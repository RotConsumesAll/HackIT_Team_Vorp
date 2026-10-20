"use client";
import { useState, useEffect } from "react";
import styles from "./SlangGlossSearch.module.css";
import {getAllTerms} from "../../../lib/glossary";

function SearchIcon(){
    return(
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"
             strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <circle cx="11" cy="11" r="7"/>
            <line x1="16.5" y1="16.5" x2="21" y2="21"/>
        </svg>
    )
}

// The big heading. If the pronunciation has one syllable per character (e.g. "da bao" for 打包),
// each syllable is shown under its own character. Otherwise the whole pronunciation goes on one line below.
// NOTE: "pronounciation" is spelt this way on purpose, it matches the field name in Firebase.
function TermHeading({entry}){
    const chars = Array.from(entry.term);
    let syllables = [];
    if (entry.pronounciation){
        syllables = entry.pronounciation.trim().split(/\s+/);
    }

    if (syllables.length === chars.length){
        return(
            <h2 className={styles["term-heading"]}>
                {chars.map((ch, i) => (
                    <span key={i} className={styles.char}>
                        <span className={styles["char-hanzi"]}>{ch}</span>
                        <span className={styles["char-pinyin"]}>{syllables[i]}</span>
                    </span>
                ))}
            </h2>
        )
    }

    return(
        <div className={styles["term-plain-wrap"]}>
            <h2 className={styles["term-plain"]}>{entry.term}</h2>
            {entry.pronounciation && <p className={styles["pinyin-line"]}>{entry.pronounciation}</p>}
        </div>
    )
}

// One label + value pair on the card. A missing value shows "None" in grey.
function Field({label, value, wide}){
    let fieldClass = styles.field;
    if (wide) fieldClass += " " + styles["field-wide"];

    let valueClass = styles["field-value"];
    let content = value;
    if (!value){
        content = "None";
        valueClass += " " + styles["field-empty"];
    }

    return(
        <div className={fieldClass}>
            <dt className={styles["field-label"]}>{label}</dt>
            <dd className={valueClass}>{content}</dd>
        </div>
    )
}

function TermCard({entry}){
    return(
        <article className={styles.card}>
            <header className={styles["card-head"]}>
                <TermHeading entry={entry}/>
                {entry.posTag && <span className={styles["pos-tag"]}>{entry.posTag}</span>}
            </header>
            <dl className={styles.fields}>
                <Field label="Definition" value={entry.definition}/>
                <Field label="Standard Equivalent" value={entry.standardEquivalent}/>
                <Field label="Origin" value={entry.originNote}/>
                <Field label="Tone" value={entry.tone}/>
                <Field label="Sample Sentence" value={entry.sampleSentence} wide={true}/>
            </dl>
        </article>
    )
}

export default function SlangGlossSearch({variant = "dropdown"}){
    const [allTerms, setAllTerms] = useState([]); //Store in memory instead of calling READ all terms repeatedly
    const [dropOpen, setdropOpen] = useState(false);
    const [term, setTerm] = useState("");
    const [selectedId, setSelectedId] = useState(null); //id of the entry whose card is showing

    useEffect(()=>{
        getAllTerms().then(setAllTerms);
    }, []); //[] as 2nd param only calls when app first renders        

    function updateTerm(e){
        setTerm(e.target.value)
    }

    // Show the card for this entry and put its term in the search box.
    function selectEntry(entry){
        setSelectedId(entry.id);
        setTerm(entry.term);
    }

    // Pressing Enter picks the first match.
    function lookupTerm(e){
        e.preventDefault();
        if (!term.trim() || resultList.length === 0) return;
        selectEntry(resultList[0]);
    }

    function toggleDropdown(){
        setdropOpen(prev => !prev);
    }

    const query = term.trim();
    const resultList = !query
    ? allTerms.slice(0, 3)
    : allTerms.filter(entry => entry.term.includes(query));

    const selected = allTerms.find(entry => entry.id === selectedId);

    // Hide the list once the box holds exactly the chosen term. Typing something else brings the list back.
    const showList = !selected || term !== selected.term;

    let rootClass = styles.root;
    if (variant === "standalone") rootClass += " " + styles.standalone;

    return(
        <section className={rootClass}>
            {variant === "dropdown" && (
                <button
                    type="button"
                    onClick={toggleDropdown}
                    className={styles["drop-btn"]}
                    aria-label="Search slang"
                    aria-expanded={dropOpen}
                >
                    <SearchIcon/>
                </button>
            )}
            {(variant === "standalone" || dropOpen) && (
                <>
                    <div className={styles["search-area"]}>
                        <form className={styles["search-form"]} onSubmit={lookupTerm}>
                            <div className={styles["search-box"]}>
                                <span className={styles["search-icon"]}><SearchIcon/></span>
                                <input
                                    type="text"
                                    value={term}
                                    onChange={updateTerm}
                                    placeholder="Search slang..."
                                    aria-label="Search slang"
                                />
                            </div>
                        </form>

                        {showList && (
                            <div className={styles.results}>
                                {/* Display first 3 as "suggested" searches if searchbar is empty, hide if not.*/}
                                {!query && (<p className={styles.hint}>Suggested searches</p>)}
                                {query && resultList.length === 0 && (
                                    <p className={styles.hint}>No matches for "{query}"</p>
                                )}
                                {resultList.map(entry => (
                                    <button
                                        type="button"
                                        key={entry.id}
                                        className={styles["result-btn"]}
                                        onClick={() => selectEntry(entry)}
                                    >
                                        <span className={styles["result-term"]}>{entry.term}</span>
                                        <span className={styles["result-def"]}>{entry.definition}</span>
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    {selected && <TermCard entry={selected}/>}
                </>
            )}
        </section>
    )
}
