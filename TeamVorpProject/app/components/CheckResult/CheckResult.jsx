"use client";
import { OverlayTrigger, Tooltip } from "react-bootstrap";
import styles from "./CheckResult.module.css";

const UNKNOWN_MESSAGE = "We don't recognise this wording yet. It may still be correct.";
const FLAGGED = ["different_meaning", "incorrect"]; // verdicts that make the sentence "not ok"
const CHECKING_MESSAGE = "Checking this word...";

//helper function, renders button that opens tooltip
function Clickable({ message, className, children, ...rest }) {
  return (
    <OverlayTrigger trigger="click" rootClose placement="top" overlay={<Tooltip>{message}</Tooltip>}>
      <button type="button" className={`${styles.phrase} ${className}`} {...rest}>
        {children}
      </button>
    </OverlayTrigger>
  );
}

// Tooltip text for a vocab verdict: the reason, then the suggestion.
function verdictMessage(v) {
    const parts = [];
    if (v.reason) parts.push(v.reason);
    if (v.suggestion) parts.push("Try: " + v.suggestion);
    if (parts.length === 0) return UNKNOWN_MESSAGE;
    return parts.join(" ");
}

// // Tooltip text for a vocab verdict: the reason, then the suggestion.
// function verdictMessage(v) {
//     const parts = [];
//     if (last && last.kind === kind && last.err === err && last.verdict === verdict) {
//         last.text += t.text;
//     } else {
//         chunks.push({ kind, err, verdict, text: t.text });
//     }
//     if (parts.length === 0) return UNKNOWN_MESSAGE;
//     return parts.join(" ");
// }

export function buildChunks(result, vocab) {
    const errorOf = new Map(); // token index -> the first error that covers it

    /*------------------------------------
    ----------------Step 1----------------
    ------Map each token to is error-----*/

    //result.errors is a list of error obj. Each error has a token array.
    //Loops over every error
    result.errors.forEach((e) => 
        //Loops over every token index that error touches
        e.tokens.forEach((i) => {
            if (!errorOf.has(i)){ //first error wins, if 2 errors both cover token 5, only first in errors array is recorded.
                errorOf.set(i, e); 
            }}) //records e.g. "token 5 belongs to error x" in a map
    );

    /*------------------------------------
    ----------------Step 2----------------
    --------Collect unknown tokens-------*/    
    const unknown = new Set(result.unmatched); //Set for fast lookup
    //Tokens of the words the vocab check is judging
    const judged = new Set();
    for (const u of result.unrecognised || []) {
        for (const i of u.tokens) judged.add(i);
    }

    //Token index -> verdict, available once the vocab check has finished
    const status = vocab ? vocab.status : "idle";
    const verdictOf = new Map();
    if (status === "done") {
        for (const v of vocab.items) verdictOf.set(v.token, v);
    }    

    /*------------------------------------
    ----------------Step 3----------------
    Build chunks by merging adj tokens with same status*/     
    const chunks = [];
    for (const t of result.tokens) {
        const err = errorOf.get(t.index);
        const verdict = verdictOf.get(t.index);

        let kind = "plain";
        if (err) {kind = "error";} 
        else if (judged.has(t.index) && status === "loading") {
            kind = "checking";
        } 
        else if (verdict && FLAGGED.includes(verdict.verdict)) {
            kind = "flagged";
        } 
        else if (verdict && verdict.verdict === "less_natural") {
            kind = "tip";
        } 
        else if (verdict && verdict.verdict === "equivalent") {
            kind = "plain";
        } 
        else if (unknown.has(t.index)) {
            kind = "unknown";
        }
        
        const last = chunks[chunks.length - 1];
        if (last && last.kind === kind && last.err === err && last.verdict === verdict) {
            last.text += t.text;
        } 
        else {
            chunks.push({ kind, err, verdict, text: t.text });
        }    }
    return chunks;
}

const CLASS_OF = {
    error: styles.bad,
    flagged: styles.bad,
    tip: styles.tip,
    checking: styles.checking,
    unknown: styles.unknown,
};

function messageOf(chunk) {
    if (chunk.kind === "error") return chunk.err.message;
    if (chunk.kind === "checking") return CHECKING_MESSAGE;
    if (chunk.kind === "flagged" || chunk.kind === "tip") return verdictMessage(chunk.verdict);
    return UNKNOWN_MESSAGE;
}

//Component
export default function CheckResult({ result, vocab }) {
    const chunks = buildChunks(result, vocab);
    //Split errors in 2 groups after filtering out errors that DO have tokens attached: 
    //1. listed for errors with no tokens attached and severity "error". (Errors that cannot be pinned to a token)
    //2. errors with no tokens and severity !=="error". (Hints)
    const listed = result.errors.filter((e) => e.tokens.length === 0 && e.severity === "error");
    const hints = result.errors.filter((e) => e.tokens.length === 0 && e.severity !== "error");

    //Decide the banner from the grammar result AND the vocab result
    const status = vocab ? vocab.status : "idle";
    const hasUnrecognised = result.unrecognised && result.unrecognised.length > 0;
    const hasFlag = status === "done" && vocab.items.some((v) => FLAGGED.includes(v.verdict));

    let banner = { text: "Looks good!", className: styles.ok };
    if (!result.ok || hasFlag) {
        banner = { text: "Let's take another look.", className: styles.notOk };
    } 
    else if (hasUnrecognised && status === "failed") {
        banner = { text: "Grammar looks good, but we couldn't check every word.", className: styles.pending };
    } 
    else if (hasUnrecognised && status !== "done") {
        banner = { text: "Checking your wording...", className: styles.pending };
    }

    return (
    <section className={styles.result}>
        <p className={banner.className}>{banner.text}</p>

        {/* If kind (of text) is not error or unknown, render plain text. Else, tooltip. */}
        <p className={styles.sentence}>
        {chunks.map((c, i) =>
            c.kind === "plain" ? (
            <span key={i}>{c.text}</span>
            ) : (
            <Clickable
                key={i}
                className={CLASS_OF[c.kind]} message={messageOf(c)}>
                {c.text}
            </Clickable>
            )
        )}

        {/* Render hints in (!) button */}
        {hints.length > 0 && (
            <Clickable
                className={styles.hintIcon}
                aria-label="Show tips"
                message={hints.map((h, i) => <div key={i}>{h.message}</div>)}>
                (!)
            </Clickable>
        )}
        </p>

        {/* Render hard errors in list format */}
        <ul className={styles.errorList}>
        {listed.map((e, i) => (
            <li key={i} className={styles.error}>{e.message}</li>
        ))}
        </ul>
    </section>
    );
}