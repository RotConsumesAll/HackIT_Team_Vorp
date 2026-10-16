#!/usr/bin/env python3
"""
check_tokens.py - check that the segment forms in exercises.json line up with
token boundaries.

The matcher maps a form's character span onto whole tokens, so a form must start
and end on a token boundary. This script builds test sentences from every answer
and checks that.

Two tokenizations are checked:
  pipeline   jieba with your glossary terms registered. This is what the service
             hands to Stanza in pretokenized mode, so it is the one that counts.
             A form that starts or ends inside a token is a FAIL.
  stanza     Stanza's own tokenizer, for comparison only (WARN, not a failure).

It also confirms that Stanza leaves the pipeline's tokens unchanged when it runs
in pretokenized mode.

Test sentences per answer: the base answer, each alternative form swapped in one
at a time, each optional segment left out, and all optional segments left out.

Usage (venv active):
    python check_tokens.py exercises.json --glossary glossary.json
    python check_tokens.py exercises.json --no-stanza     # jieba only, no model needed
    python check_tokens.py exercises.json --no-hmm        # jieba with HMM=False

Exit code: 0 = all good, 1 = problems found, 2 = setup error.
"""
import argparse
import json
import sys
from collections import defaultdict

if hasattr(sys.stdout, "reconfigure"):  # avoid UnicodeEncodeError on Windows consoles
    sys.stdout.reconfigure(encoding="utf-8")

JOINER = "，"  # how clauses are joined into one test sentence
FALLBACK_TERMS = ["巴刹", "打包", "咖啡店", "咖椰"]  # used only when --glossary is missing
SPLITS = [("喝", "咖啡"), ("我", "会"), ("煮", "饭")]  # forced splits, e.g. [("煮", "饭")]; paste the script's suggestions here
PIPELINE = "pipeline (jieba)"
NATIVE = "stanza native"


# ---------- loading ----------

def load_json(path):
    with open(path, encoding="utf-8-sig") as f:
        return json.load(f)


def glossary_terms(path):
    """Return {id: term}. Accepts {"glossaryTerms": {...}} or a bare {id: {...}} map."""
    data = load_json(path)
    data = data.get("glossaryTerms", data)
    return {
        gid: entry["term"]
        for gid, entry in data.items()
        if isinstance(entry, dict) and "term" in entry
    }


def exercise_map(data):
    return data["Exercises"] if isinstance(data.get("Exercises"), dict) else data


# ---------- building test sentences ----------

def render(answer, choice, omit):
    """Join an answer's segments into one sentence.
    choice: {(clause, segment): form index}; omit: set of (clause, segment).
    Returns (sentence, [(role, form, start, end), ...])."""
    text, spans = "", []
    for ci, clause in enumerate(answer["clauses"]):
        if ci:
            text += JOINER
        for si, seg in enumerate(clause["segments"]):
            if (ci, si) in omit:
                continue
            form = seg["forms"][choice.get((ci, si), 0)]
            spans.append((seg["role"], form, len(text), len(text) + len(form)))
            text += form
    return text, spans


def variants(answer):
    """Yield (label, sentence, spans) for one answer."""
    text, spans = render(answer, {}, set())
    yield "base", text, spans
    optional = set()
    for ci, clause in enumerate(answer["clauses"]):
        for si, seg in enumerate(clause["segments"]):
            for fi in range(1, len(seg["forms"])):
                text, spans = render(answer, {(ci, si): fi}, set())
                yield f"{seg['role']} -> {seg['forms'][fi]}", text, spans
            if seg.get("optional"):
                optional.add((ci, si))
                text, spans = render(answer, {}, {(ci, si)})
                yield f"without {seg['role']} ({seg['forms'][0]})", text, spans
    if len(optional) > 1:
        text, spans = render(answer, {}, optional)
        yield "all optional omitted", text, spans


# ---------- tokenizers ----------

def build_jieba(terms, hmm=True):
    import jieba
    for term in terms:
        jieba.add_word(term, freq=1_000_000)
    for parts in SPLITS:
        jieba.suggest_freq(tuple(parts), True)  # makes jieba cut the word into these parts
    # Keep this identical to the call in main.py, or the check proves nothing.
    return lambda text: jieba.lcut(text, HMM=hmm)


def build_stanza(model_dir, offline):
    try:
        import stanza
    except ImportError:
        sys.exit("Stanza isn't installed here. Activate the venv, or run with --no-stanza.")
    opts = dict(lang="zh-hans", processors="tokenize", use_gpu=False, logging_level="WARN")
    if model_dir:
        opts["dir"] = model_dir
    if offline:
        opts["download_method"] = None  # needs a reasonably recent Stanza
    pretokenized = stanza.Pipeline(tokenize_pretokenized=True, **opts)
    native = stanza.Pipeline(tokenize_no_ssplit=True, **opts)
    return pretokenized, native


# ---------- alignment ----------

def check_span(tokens, start, end):
    """Return (aligned, tokens touching the span). Aligned = both edges are token boundaries."""
    bounds, touching, pos = {0}, [], 0
    for tok in tokens:
        tok_start, pos = pos, pos + len(tok)
        bounds.add(pos)
        if pos > start and tok_start < end:
            touching.append(tok)
    return (start in bounds and end in bounds), touching


def split_suggestions(tokens, spans):
    """Tokens that contain a segment boundary, with the pieces they would need to be cut into."""
    cuts = {p for _, _, start, end in spans for p in (start, end)}
    found, pos = set(), 0
    for tok in tokens:
        low, pos = pos, pos + len(tok)
        inside = sorted(c for c in cuts if low < c < pos)
        if inside:
            edges = [low, *inside, pos]
            found.add(tuple(tok[a - low:b - low] for a, b in zip(edges, edges[1:])))
    return found


class Tally:
    def __init__(self):
        self.ok = 0
        self.bad = []       # (context, sentence, tokens touching the span)
        self.sample = None  # tokens covering the form in the first aligned sentence


# ---------- main ----------

def main():
    ap = argparse.ArgumentParser(description="Check exercise forms against token boundaries.")
    ap.add_argument("exercises", nargs="?", default="exercises.json")
    ap.add_argument("--glossary", help="JSON export of glossaryTerms ({id: {term: ...}})")
    ap.add_argument("--no-hmm", action="store_true",
                    help="tokenize with jieba's HMM=False (no merging of unknown single characters)")
    ap.add_argument("--no-stanza", action="store_true", help="skip all Stanza checks")
    ap.add_argument("--model-dir", help="folder holding the Stanza models")
    ap.add_argument("--offline", action="store_true", help="never try to download Stanza models")
    ap.add_argument("-v", "--verbose", action="store_true", help="also list single-token forms")
    args = ap.parse_args()

    try:
        exercises = exercise_map(load_json(args.exercises))
        id_to_term = glossary_terms(args.glossary) if args.glossary else None
    except (OSError, ValueError) as err:
        print(f"Could not read input: {err}")
        return 2

    if id_to_term is not None:
        terms = sorted(set(id_to_term.values()))
        for key, ex in exercises.items():
            for gid in ex.get("glossaryTerms", []):
                if gid not in id_to_term:
                    print(f"WARN  {ex.get('id', key)}: glossary id {gid} not found in {args.glossary}")
    else:
        terms = FALLBACK_TERMS
        print("WARN  no --glossary given; registering the built-in fallback terms: " + " ".join(terms))

    # 1. build the test sentences
    plan = {}  # exercise id -> {sentence: [(context, spans), ...]}
    for key, ex in exercises.items():
        ex_id = ex.get("id", key)
        sentences = defaultdict(list)
        try:
            for ai, answer in enumerate(ex["answers"]):
                for label, text, spans in variants(answer):
                    sentences[text].append((f"answer {ai + 1}: {label}", spans))
        except (KeyError, IndexError, TypeError) as err:
            print(f"{ex_id}: malformed answers/clauses/segments/forms ({err!r}). Fix the structure first.")
            return 2
        plan[ex_id] = sentences

    # 2. tokenize every unique sentence once
    texts = sorted({t for sentences in plan.values() for t in sentences})
    segment = build_jieba(terms, hmm=not args.no_hmm)
    jieba_tokens = {t: segment(t) for t in texts}
    changed = [t for t, toks in jieba_tokens.items() if "".join(toks) != t]
    if changed:
        print("jieba changed the text itself for:", *changed[:5], sep="\n  ")
        return 2

    altered, native_tokens, native_skipped = [], {}, 0
    if not args.no_stanza:
        pretokenized, native = build_stanza(args.model_dir, args.offline)
        doc = pretokenized([jieba_tokens[t] for t in texts])
        if len(doc.sentences) != len(texts):
            print(f"Stanza returned {len(doc.sentences)} sentences for {len(texts)} inputs.")
            return 2
        for text, sent in zip(texts, doc.sentences):
            got = [tok.text for tok in sent.tokens]
            if got != jieba_tokens[text]:
                altered.append((text, jieba_tokens[text], got))
        for text in texts:
            toks = [tok.text for s in native(text).sentences for tok in s.tokens]
            if "".join(toks) == text:
                native_tokens[text] = toks
            else:
                native_skipped += 1

    engines = {PIPELINE: jieba_tokens}
    if native_tokens:
        engines[NATIVE] = native_tokens

    # 3. check every form's span against each tokenization
    tallies = {name: defaultdict(Tally) for name in engines}
    suggestions = set()
    for ex_id, sentences in plan.items():
        for text, contexts in sentences.items():
            for name, table in engines.items():
                tokens = table.get(text)
                if tokens is None:
                    continue
                for context, spans in contexts:
                    if name == PIPELINE:
                        suggestions |= split_suggestions(tokens, spans)
                    for role, form, start, end in spans:
                        aligned, touching = check_span(tokens, start, end)
                        tally = tallies[name][(ex_id, role, form)]
                        if aligned:
                            tally.ok += 1
                            tally.sample = tally.sample or touching
                        else:
                            tally.bad.append((context, text, touching))

    # 4. report
    failures = 0
    warnings = 0
    for ex_id in plan:
        print(f"\n{ex_id}  ({len(plan[ex_id])} test sentences)")
        for name, table in tallies.items():
            for (eid, role, form), tally in sorted(table.items()):
                if eid != ex_id:
                    continue
                if tally.bad:
                    is_fail = name == PIPELINE
                    failures += is_fail
                    warnings += not is_fail
                    level = "FAIL" if is_fail else "WARN"
                    print(f"  {level}  [{name}] {role} 「{form}」 crosses a token boundary "
                          f"in {len(tally.bad)} sentence(s)")
                    context, text, touching = tally.bad[0]
                    print(f"        e.g. {context}: {text}")
                    print(f"        tokens touching it: {' | '.join(touching)}")
                elif name == PIPELINE and tally.sample and (len(tally.sample) > 1 or args.verbose):
                    print(f"  ok    {role} 「{form}」 -> {' | '.join(tally.sample)}")

    print("\n" + "=" * 60)
    if suggestions:
        print("Forced splits that would fix the pipeline failures. Paste into SPLITS at the top of")
        print("this script, and apply the same jieba.suggest_freq(parts, True) calls in main.py:")
        print("    SPLITS = " + repr(sorted(suggestions)).replace("'", '"'))
        if any(all(len(part) == 1 for part in parts) for parts in suggestions):
            print("Splits made only of single characters can be re-merged by jieba's HMM.")
            print("If they persist, run with --no-hmm and use HMM=False in main.py too.")
        print()
    print(f"Forms checked against the pipeline tokenization: {len(tallies[PIPELINE])}")
    print(f"Pipeline failures: {failures}")
    if args.no_stanza:
        print("Stanza checks skipped (--no-stanza).")
    else:
        if altered:
            print(f"Stanza altered the pipeline tokens in {len(altered)} sentence(s), e.g.:")
            text, expected, got = altered[0]
            print(f"  {text}\n  expected: {' | '.join(expected)}\n  got:      {' | '.join(got)}")
        else:
            print(f"Stanza (pretokenized) returned all {len(texts)} sentences unchanged.")
        print(f"Warnings from Stanza's own tokenizer: {warnings}"
              + (f" ({native_skipped} sentence(s) skipped: text not preserved)" if native_skipped else ""))
    return 1 if (failures or altered) else 0


if __name__ == "__main__":
    sys.exit(main())
