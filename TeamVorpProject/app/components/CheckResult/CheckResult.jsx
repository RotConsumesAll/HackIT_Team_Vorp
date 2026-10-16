"use client";
import { OverlayTrigger, Tooltip } from "react-bootstrap";
import styles from "./CheckResult.module.css";

const UNKNOWN_MESSAGE = "We don't recognise this wording yet. It may still be correct.";

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

export function buildChunks(result) {
    const errorOf = new Map(); // token index -> the first error that covers it

    /*------------------------------------
    ----------------Step 1----------------
    ------Map each token to is error-----*/

    //result.errors is a list of error obj. Each error has .token array.
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

    /*------------------------------------
    ----------------Step 3----------------
    Build chunks by merging adj tokens with same status*/     
    const chunks = [];
    for (const t of result.tokens) {
        const err = errorOf.get(t.index);
        const kind = err ? "error" : unknown.has(t.index) ? "unknown" : "plain";
        const last = chunks[chunks.length - 1];
        if (last && last.kind === kind && last.err === err) last.text += t.text; //If current token kind has same kind as prev chunk AND same err obj, append to token's text
        else chunks.push({ kind, err, text: t.text });//else, start new chunk
    }
    return chunks;
}

//Component
export default function CheckResult({ result }) {
    const chunks = buildChunks(result);
    //Split errors in 2 groups after filtering out errors that DO have tokens attached: 
    //1. listed for errors with no tokens attached and severity "error". (Errors that cannot be pinned to a token)
    //2. errors with no tokens and severity !=="error". (Hints)
    const listed = result.errors.filter((e) => e.tokens.length === 0 && e.severity === "error");
    const hints = result.errors.filter((e) => e.tokens.length === 0 && e.severity !== "error");

    return (
    <section className={styles.result}>
        <p className={result.ok ? styles.ok : styles.notOk}>
        {result.ok ? "Looks good!" : "Let's take another look."}
        </p>

        {/* If kind (of text) is not error or unknown, render plain text. Else, tooltip. */}
        <p className={styles.sentence}>
        {chunks.map((c, i) =>
            c.kind === "plain" ? (
            <span key={i}>{c.text}</span>
            ) : (
            <Clickable
                key={i}
                className={c.kind === "error" ? styles.bad : styles.unknown}
                message={c.kind === "error" ? c.err.message : UNKNOWN_MESSAGE}>
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