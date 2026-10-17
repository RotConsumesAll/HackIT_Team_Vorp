# Rule engine
# Try to line up learner's text against model answer, report gaps and mismatches.

LEVELS = ("required", "expected", "optional")

def prepare_answers(exercise):
    #Turn each answer into one flat list of segments, each with a 'level'."""
    roles = exercise["roles"]
    prepared = []
    for ai, answer in enumerate(exercise["answers"]):
        flat = []
        for ci, clause in enumerate(answer["clauses"]):
            for seg in clause["segments"]:
                role = seg["role"]
                if role not in roles:
                    raise ValueError(
                        f'{exercise["id"]}, answer {ai + 1}: role "{role}" is not declared in "roles"')

                level = "optional" if seg.get("optional") else roles[role]

                if level not in LEVELS:
                    raise ValueError(
                        f'{exercise["id"]}: role "{role}" has unknown level "{level}"')
                
                flat.append({"role": role, "forms": seg["forms"], "level": level, "clause": ci})
        prepared.append(flat)
    return prepared #Flattens clauses into 1 list per ans

""" 
-------------------Step 1---------------------
For each segment, list where its forms appear in the learner's text.
----------------------------------------------

For every segment of an answer, search raw text and for each of its forms, longest first.
E.g.  我的爷爷 must win over 爷爷 and 我. Each match is a character span, and spans can't overlap
"""

#Searches raw text by characters
def find_occurrences(text, forms):
    #Every place any of `forms` appears in `text`, as (start, end, form).
    found = []
    for form in forms:
        #Stops empty string from looping forever
        if not form:
            continue

        start = text.find(form)
        while start != -1:
            found.append((start, start + len(form), form))
            start = text.find(form, start + 1) #Keeps searching after each hit
    found.sort(key=lambda m: (m[0], -(m[1] - m[0]))) #Puts matches in text order, longer form first.
    return found

def candidates_for_answer(text, segments):
    #For each segment of one prepared answer, all places its forms occur in `text`.
    return [find_occurrences(text, seg["forms"]) for seg in segments]





""" 
-------------------Step 2---------------------
Walking the answer in order, give each segment one non-overlapping occurrence, preferring text after what is already matched, otherwise any. A segment with none has no match.
----------------------------------------------

Treat answer's clauses as 1 flat segment list. Go through segments in answer order.
For each segment, take leftmost unused occurence after prev match.
If no unused occ, take any. This allows out of order text to still get matched.
In order matches keeps repeated words from being mixed up in correct sentences.
"""

def overlaps(a, b):
    return a[0] < b[1] and b[0] < a[1]


def assign(candidates):
    #Pick one occurrence per segment (or None), working through the answer in order.
    used, picks, prev_end = [], [], 0
    for cands in candidates:
        free = [c for c in cands if not any(overlaps(c, u) for u in used)]
        in_order = [c for c in free if c[0] >= prev_end]
        pick = (in_order or free or [None])[0]
        picks.append(pick)
        if pick:
            used.append(pick)
            prev_end = max(prev_end, pick[1])
    return picks


def match_answer(text, segments):
    #One match (start, end, form) or None for each segment of a prepared answer.
    return assign(candidates_for_answer(text, segments))




""" 
-------------------Step 3---------------------
Score each answer by fewest missing required segments, then missing expected ones, then order inversions, then most characters explained. The lowest score wins.
----------------------------------------------
Score each ans as a tuple. Tuples means no weight tuning.
Lowest score wins, report errors against that ans only.
"""
def score_answer(segments, matches):
    #Lower is better: (required missing, expected missing, order inversions, -characters explained).
    required = expected = covered = 0
    for seg, m in zip(segments, matches):
        if m is None:
            required += seg["level"] == "required"
            expected += seg["level"] == "expected"
        else:
            covered += m[1] - m[0]
    starts = [m[0] for m in matches if m]
    inversions = sum(1 for i in range(len(starts))
                     for j in range(i + 1, len(starts)) if starts[i] > starts[j])
    return (required, expected, inversions, -covered)


def closest_answer(text, prepared_answers):
    #Return (score, answer index, matches) for the best-fitting answer.
    best = None
    for index, segments in enumerate(prepared_answers):
        matches = match_answer(text, segments)
        score = score_answer(segments, matches)
        if best is None or score < best[0]:
            best = (score, index, matches)
    return best






""" 
-------------------Step 4---------------------
In the chosen answer, a segment with no match becomes an error (required) or a warning (expected), unless an unexplained word with a fitting part of speech exists. That word is passed on as unrecognised.
----------------------------------------------

"""
SEVERITY = {"required": "error", "expected": "warning", "optional": "tip"}

# Provisional: which Stanza tags can fill each role. Build it from real parses of learner-style mistakes.
#Check stanza for output
ROLE_POS = {
    "predicate": {"VERB", "AUX"},
    "subject": {"PRON", "NOUN", "PROPN"},
    "object": {"NOUN", "PROPN", "PRON"},
    "frequency": {"ADV", "ADJ"},  # a misplaced 常常 came back as ADJ
    "adverb": {"ADV"},
    "auxiliary": {"AUX", "VERB"},
    "relativeTime": {"ADV", "NOUN"},
    "timeOfDay": {"NOUN", "ADV"},
    "meal": {"NOUN"},
    "aspect": {"PART"},
    "particle": {"PART"},
}


def find_missing(exercise, segments, matches, tokens, include_tips=False):
    #Return (errors, unrecognised). A segment with no match counts as missing unless an unexplained token has a fitting part of speech; that word is passed on as unrecognised.
    hints = exercise["hints"]["missing"]
    free = set(leftover_tokens(tokens, matches))  # unexplained tokens not yet used
    errors, unrecognised = [], []
    for seg, m in zip(segments, matches):
        if m is not None:
            continue
        if seg["level"] == "optional" and not include_tips:
            continue
        allowed = ROLE_POS.get(seg["role"], set())
        word = next((t for t in tokens if t["index"] in free and t["upos"] in allowed), None)
        if word is not None:
            free.discard(word["index"])  # one leftover word excuses only one segment
            unrecognised.append({"role": seg["role"], "tokens": [word["index"]],
                                 "text": word["text"], "expected": seg["forms"]})
            continue
        errors.append({
            "type": "missing",
            "severity": SEVERITY[seg["level"]],
            "role": seg["role"],
            "clause": seg["clause"],
            "message": hints.get(seg["role"], f"Missing: {seg['role']}"),
        })
    return errors, unrecognised





""" 
-------------------Step 5---------------------
Keep the heaviest set of matched segments that are in the answer's order. Every other matched segment is displaced and gets an error with the most specific hint available.
----------------------------------------------

"""
WEIGHT = {"required": 3, "expected": 2, "optional": 1}

def in_place(segments, matches):
    #Indices of the segments treated as correctly placed: the heaviest run whose positions in the learner's text increase in the same order as in the answer.
    items = [(i, m[0], WEIGHT[segments[i]["level"]]) for i, m in enumerate(matches) if m]
    best = []  # best[k] = (total weight, indices) of the best run ending at items[k]
    for k, (i, start, weight) in enumerate(items):
        run = (weight, [i])
        for j in range(k):
            if items[j][1] < start and best[j][0] + weight > run[0]:
                run = (best[j][0] + weight, best[j][1] + [i])
        best.append(run)
    return set(max(best, key=lambda r: r[0])[1]) if best else set()

def find_order_errors(exercise, segments, matches):
    #One entry per displaced segment, with the most specific hint available."""
    hints = exercise["hints"]
    pairs = hints.get("orderPairs", {})
    keep = in_place(segments, matches)
    errors = []
    for i, m in enumerate(matches):
        if m is None or i in keep:
            continue
        message = hints.get("order", "Check the word order.")
        for k in sorted(keep):
            a, b = (i, k) if i < k else (k, i)  # the answer puts a before b
            if matches[a][0] > matches[b][0]:   # but the learner put b first
                key = f'{segments[a]["role"]}>>{segments[b]["role"]}'
                if key in pairs:
                    message = pairs[key]
                    break
        errors.append({
            "type": "order",
            "severity": "error",
            "role": segments[i]["role"],
            "clause": segments[i]["clause"],
            "span": [m[0], m[1]],
            "message": message,
        })
    return errors

""" 
-------------------Step 6---------------------
Map spans to tokens and return errors, matches, unexplained tokens, unrecognised words, the closest answer, ok, and the cleaned text.
----------------------------------------------

"""

# ------------------Helpers-------------------
#turns a character span into token indices for UI to highlight.
def tokens_touching(tokens, start, end):
    #Indices of the tokens that overlap the character span [start, end].
    return [t["index"] for t in tokens if t["start"] < end and start < t["end"]]

#collects the words with no explanations, such as the learner’s own wording, and leaves out punctuation
def leftover_tokens(tokens, matches):
    #Indices of non-punctuation tokens that no matched segment explains.
    spans = [(m[0], m[1]) for m in matches if m]
    return [t["index"] for t in tokens
            if t["upos"] != "PUNCT" and not any(t["start"] < e and s < t["end"] for s, e in spans)]

# ------------Combine everything--------------
def check_sentence(exercise, prepared_answers, text, tokens, include_tips=False):
    #Run every check and build the response. `tokens` is the output of analyze().
    score, index, matches = closest_answer(text, prepared_answers)
    segments = prepared_answers[index]

    errors, unrecognised = find_missing(exercise, segments, matches, tokens, include_tips)    
    for e in errors:
        e["tokens"] = [] #missing errors have no tokens to highlight
    for e in find_order_errors(exercise, segments, matches):
        e["tokens"] = tokens_touching(tokens, *e["span"])
        errors.append(e)

    return {
        "text": text,
        "closestAnswer": index + 1,
        "ok": not any(e["severity"] == "error" for e in errors), #false only when error has severity "error"
        "errors": errors,
        "matches": [
            {"role": seg["role"], "span": [m[0], m[1]], "tokens": tokens_touching(tokens, m[0], m[1])}
            for seg, m in zip(segments, matches) if m
        ], #list of words that were recognized
        "unmatched": leftover_tokens(tokens, matches),
        "unrecognised": unrecognised,
        "tokens": tokens,
    }