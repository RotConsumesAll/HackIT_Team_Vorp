"use client";
import { useState, useEffect } from "react";
import styles from "./SlangGlossSearch.module.css";
import {getAllTerms} from "../../../lib/glossary";
//import glossary from "../../../lib/slangGlossary.json";

export default function SlangGlossSearch({variant = "dropdown"}){
    const [allTerms, setAllTerms] = useState([]); //Store in memory instead of calling READ all terms repeatedly
    const [dropOpen, setdropOpen] = useState(false);
    const [term, setTerm] = useState("");

    useEffect(()=>{
        getAllTerms().then(setAllTerms);
    }, []); //[] as 2nd param only calls when app first renders        

    function updateTerm(e){
        setTerm(e.target.value)
    }

    function lookupTerm(e){
        e.preventDefault();
    }

    function toggleDropdown(){
        setdropOpen(prev => !prev);
    }

    const resultList = !term.trim()
    ? allTerms.slice(0, 3)
    : allTerms.filter(entry => entry.term.includes(term));

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

                        {/* Display first 3 as "suggested" searches if searchbar is empty, hide if not.*/}
                        {!term.trim() && (<h5>Suggested searches:</h5>)}
                        {resultList.map(entry=>(
                            <p key={entry.id}>{entry.term}: {entry.definition}</p>
                        ))}
                    </div>
                )}
            </section>
        </>
    )
}