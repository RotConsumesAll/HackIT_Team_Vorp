"use client"
import {useState} from "react";
import styles from "./page.module.css";

function EnglishInput(){
    const [sentence, setSentance] = useState("");
    function updateDisplay(e){
        setSentance(e.target.value)
    }
    return(
        <>  
            <section className={styles["eng-cont"]}>
                <div className={styles["sentence-display-container"]}>
                    <p className={styles["sentence-display-text"]}>{sentence}</p>
                </div>
                <form className = {styles.form}>
                    <label> 
                        <input type = "text"  value={sentence} onChange={updateDisplay} placeholder="English sentence here..."></input>
                    </label>
                </form>
            </section>
        </>
    )
}

function ChineseInput(){
    const [sentence, setSentance] = useState("");
    function updateDisplay(e){
        setSentance(e.target.value)
    }
    return(
        <>  
            <section className={styles["chi-cont"]}>
                <div className={styles["sentence-display-container"]}>
                    <p className={styles["sentence-display-text"]}>{sentence}</p>
                </div>
                <form className = {styles.form}>
                    <input type = "text"  value={sentence} onChange={updateDisplay} placeholder="Chinese sentence here..."></input>
                </form>
            </section>
        </>
    )
}

function App(){
    return(
        <>
            <main>
                <h1>Sentence Builder</h1>
                    <EnglishInput/>
                <div>
                    <p>Placeholder seperator here</p>
                </div>
                    <ChineseInput/>           
            </main>
        </>
    )
}

export default App