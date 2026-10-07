"use client"
import {useState} from "react";
import styles from "./page.module.css";
import Navbar from "../../components/Navbar/Navbar";
import SlangGlossSearch from "../../components/SlangGlossSearch/SlangGlossSearch";

function EnglishInput(){
    const [sentence, setSentance] = useState("");
    const [displaySent, setDispSent] = useState("");

    function updateDisplay(e){
        setSentance(e.target.value)
    }
    
    function handleSubmit(e){
        e.preventDefault();
        setDispSent(sentence);
    }
    return(
        <>  
            <section className={styles["eng-cont"]}>
                <div className={styles["sentence-display-container"]}>
                    <p className={styles["sentence-display-text"]}>{displaySent}</p>
                </div>
                <form className = {styles.form} onSubmit={handleSubmit}>
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
    const [displaySent, setDispSent] = useState("");
    
    function updateDisplay(e){
        setSentance(e.target.value)
    }

    function handleSubmit(e){
        e.preventDefault();
        setDispSent(sentence);
    }

    return(
        <>  
            <section className={styles["chi-cont"]}>
                <div className={styles["sentence-display-container"]}>
                    <p className={styles["sentence-display-text"]}>{displaySent}</p>
                </div>
                <form className = {styles.form} onSubmit={handleSubmit}>
                    <input type = "text"  value={sentence} onChange={updateDisplay} placeholder="Chinese sentence here..."></input>
                </form>
            </section>
        </>
    )
}



function App(){
    return(
        <>
            <Navbar/>
            <main className={styles.main}>
                <section>
                    <h1>Sentence Builder</h1>
                        <EnglishInput/>
                    <div>
                        <p>Placeholder seperator here</p>
                    </div>
                        <ChineseInput/>                     
                </section>
                <section>
                    <div>
                        <SlangGlossSearch variant = {"dropdown"}/>    
                    </div>    
                </section>  
            </main>
        </>
    )
}

export default App