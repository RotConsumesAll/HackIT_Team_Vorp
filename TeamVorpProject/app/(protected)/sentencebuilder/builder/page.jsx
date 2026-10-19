"use client"
import {useState, useRef} from "react";
import styles from "./page.module.css";
import Navbar from "../../../components/Navbar/Navbar";
import SlangGlossSearch from "../../../components/SlangGlossSearch/SlangGlossSearch";
import CheckSentence from "../../../../lib/checkSentence";
import CheckVocab from "../../../../lib/checkVocab";
import CheckResult from "../../../components/CheckResult/CheckResult";
import { PROMPTS } from "../../../../lib/prompts";

const IDLE = { status: "idle", items: [] };

function EnglishInput({exerciseSent}){
    return(
        <>  
            <section className={styles["eng-cont"]}>
                <div>English</div>
                <div className={styles["sentence-display-container"]}>
                    <p className={styles["sentence-display-text"]}>{exerciseSent}</p>
                </div>
            </section>
        </>
    )
}

function ChineseInput({exerciseId}){
    const [sentence, setSentance] = useState("");
    const [result, setResult] = useState(null);
    const [vocab, setVocab] = useState(IDLE);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const latestCheckTag = useRef(0); //useRef stores a value that dones not trigger re render. 
    //Used to drop any res that belongs to an older sentence.
    //Behaviour: Button renables when grammar check finishes while vocab req is still running. If learner submits again during taht time, old vocab is discarded. 


    async function handleSubmit(e){
        setResult(null);
        e.preventDefault();
        if (!sentence.trim()) return;
        const newCheckTag = ++latestCheckTag.current; //Gives each submit its own number
        setLoading(true);
        setError("");
        setVocab(IDLE);

        let res;
        try {
            res = await CheckSentence(exerciseId, sentence);
        } 
        catch (err) {
            console.error("check failed:", err);
            if (newCheckTag === latestCheckTag.current){
                setError("Couldn't check your sentence. Is the service running?");
            }
            return;
        } 
        finally {
            if (newCheckTag === latestCheckTag.current){
                setLoading(false);
            }
        }
        
        if (newCheckTag !== latestCheckTag.current){
            return;
        }

        setResult(res);

        if (!res.unrecognised?.length){
            return;
        }

        setVocab({status:"loading", items: []});
        try {
            const items = await CheckVocab(exerciseId, res.text);
            if (newCheckTag === latestCheckTag.current){
                setVocab({status: "done", items});
            }
        }
        catch (err) {
            console.error("vocab failed:", err);
            if (newCheckTag === latestCheckTag.current){
                setVocab({status: "failed", items: []});
            }
        }
    }

    return(
        <section className={styles["chi-cont"]}>
            <div>Chinese</div>
            <div className={styles["sentence-display-container"]}>
            {result && <CheckResult result={result} vocab={vocab}/>}                
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