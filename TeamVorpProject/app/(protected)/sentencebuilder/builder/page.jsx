"use client"
import {useState} from "react";
import styles from "./page.module.css";
import Navbar from "../../../components/Navbar/Navbar";
import SlangGlossSearch from "../../../components/SlangGlossSearch/SlangGlossSearch";
import CheckSent from "../../../../lib/checkSent";
import CheckResult from "../../../components/CheckResult/CheckResult";
import { PROMPTS } from "../../../../lib/prompts";

function EnglishInput({exerciseSent}){
    // const [sentence, setSentance] = useState("");
    // const [displaySent, setDispSent] = useState("");

    // function updateDisplay(e){
    //     setSentance(e.target.value)
    // }
    
    // function handleSubmit(e){
    //     e.preventDefault();
    //     setDispSent(sentence);
    // }
    return(
        <>  
            <section className={styles["eng-cont"]}>
                <div>English</div>
                <div className={styles["sentence-display-container"]}>
                    <p className={styles["sentence-display-text"]}>{exerciseSent}</p>
                </div>
                {/* <form className = {styles.form} onSubmit={handleSubmit}>
                    <label> 
                        <input type = "text"  value={sentence} onChange={updateDisplay} placeholder="English sentence here..."></input>
                    </label>
                </form> */}
            </section>
        </>
    )
}

function ChineseInput({exerciseId}){
    const [sentence, setSentance] = useState("");
    const [result, setResult] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    async function handleSubmit(e){
        e.preventDefault();
        if (!sentence.trim()) return;
        setLoading(true);
        setError("");
        try {
            setResult(await CheckSent(exerciseId, sentence));
        } 
        catch {
            setError("Couldn't check your sentence. Is the service running?");
        } 
        finally {
            setLoading(false);
        }        
    }

    return(
        <section className={styles["chi-cont"]}>
            <div>Chinese</div>
            <div className={styles["sentence-display-container"]}>
            {result && <CheckResult result={result}/>}                
            </div>
            {error && <p>{error}</p>}
            <form className = {styles.form} onSubmit={handleSubmit}>
                <input type = "text"  value={sentence} onChange={(e)=>setSentance(e.target.value)} placeholder="Chinese sentence here..."></input>
                <button type="submit" disabled={loading}>{loading ? "Checking..." : "Check"}</button>
            </form>
        </section>
    )
}



function App(){
    const [index, setIndex] = useState(0);
    const prompt = PROMPTS[index];    
    return(
        <>
            <Navbar/>
            <main className={styles.main}>
                <section>
                    <h1>Sentence Builder</h1>
                    { <EnglishInput exerciseSent={prompt.english}/>}
                    <button onClick={() => setIndex((i) => (i + 1) % PROMPTS.length)}>Next sentence</button>
                    <div>
                        <p>Placeholder seperator here</p>
                    </div>
                    <ChineseInput key={prompt.id} exerciseId={prompt.id}/>
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