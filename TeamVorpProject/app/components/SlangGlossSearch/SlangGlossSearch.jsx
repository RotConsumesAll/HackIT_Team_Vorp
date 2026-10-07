"use client";
import { useState } from "react";
import styles from "./SlangGlossSearch.module.css";
import glossary from "../../../lib/slangGlossary.json";

export default function SlangGlossSearch({variant = "dropdown"}){
    const [dropOpen, setdropOpen] = useState(false);
    const [term, setTerm] = useState("");
    const [result, setResult] = useState([]);

    function updateTerm(e){
        setTerm(e.target.value)
    }

    function lookupTerm(e){
        e.preventDefault();
        const searchResults = glossary.glossaryTerms.filter(entry=>
            entry.term.includes(term)
        );
        console.log(searchResults)
        setResult(searchResults);
    }

    function toggleDropdown(){
        setdropOpen(prev => !prev);
    }

    return(
        <>
            <section>
                {variant === "dropdown" && (
                    <button onClick={toggleDropdown} className="dropDownBtn">🔍︎</button>
                )}
                {(variant === "standalone" || dropOpen) && (
                    <div className={styles["show-searchbar"]}>
                        <form className={styles.form} onSubmit={lookupTerm}>
                            <input type="text" value={term} onChange={updateTerm} placeholder="Search slang..."></input>
                        </form>
                        {/* Display list of matches */}
                        {result.map(entry => (
                            <p key={entry.term}>{entry.term}: {entry.definition}</p>
                        ))}
                    </div>
                )}
            </section>
        </>
    )
}