"use client"
import {useState, useRef} from "react";
import styles from "./page.module.css";
import Navbar from "../../../components/Navbar/Navbar";
import SlangGlossSearch from "../../../components/SlangGlossSearch/SlangGlossSearch";
import CheckSentence from "../../../../lib/checkSentence";
import CheckVocab from "../../../../lib/checkVocab";
import CheckResult from "../../../components/CheckResult/CheckResult";
import { PROMPTS } from "../../../../lib/prompts";
import SavePhrase from "../../../components/SavePhrase/SavePhrase";
import { toPinyin } from "../../../../lib/pinyin";

const IDLE = { status: "idle", items: [] };

// Verdicts that CheckResult treats as "not ok". Keep in sync with FLAGGED in CheckResult.jsx.
const FLAGGED = ["different_meaning", "incorrect"];

// True when CheckResult would show the "Looks good!" banner, so the learner has figured the sentence out.
// Only then can they save it.
function sentenceIsCorrect(result, vocab){
    if (!result || !result.ok) return false;
    const status = vocab ? vocab.status : "idle";
    const hasUnrecognised = result.unrecognised && result.unrecognised.length > 0;
    if (hasUnrecognised && status !== "done") return false; // still checking the wording, or it could not be checked
    if (status === "done" && vocab.items.some((v) => FLAGGED.includes(v.verdict))) return false;
    return true;
}

// Small decorative icon for the Shuffle button. aria-hidden because the button already has text.
function ShuffleIcon(){
    return(
        <svg className={styles["shuffle-icon"]} width="16" height="16" viewBox="0 0 24 24" fill="none"
             stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="m18 14 4 4-4 4"/>
            <path d="m18 2 4 4-4 4"/>
            <path d="M2 18h1.973a4 4 0 0 0 3.3-1.7l5.454-8.6a4 4 0 0 1 3.3-1.7H22"/>
            <path d="M2 6h1.972a4 4 0 0 1 3.6 2.2"/>
            <path d="M22 18h-6.041a4 4 0 0 1-3.3-1.8l-.359-.45"/>
        </svg>
    )
}

// The up/down arrows between the English and Chinese sections.
function SwapArrows(){
    return(
        <div className={styles.divider}>
            <svg width="72" height="52" viewBox="0 0 72 52" fill="none" stroke="currentColor"
                 strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <line x1="18" y1="48" x2="18" y2="6"/>
                <polyline points="6,18 18,6 30,18"/>
                <line x1="54" y1="4" x2="54" y2="46"/>
                <polyline points="42,34 54,46 66,34"/>
            </svg>
        </div>
    )
}

function EnglishInput({exerciseSent, onShuffle}){
    return(
        <section className={styles["eng-cont"]}>
            <div className={styles["tag-row"]}>
                {/* The tag is a label (filled, not clickable). Shuffle is a real button (outlined, with icon). */}
                <span className={styles.tag}>English</span>
                <button type="button" className={styles["shuffle-btn"]} onClick={onShuffle}>
                    <ShuffleIcon/>
                    Shuffle
                </button>
            </div>
            <div className={styles["sentence-display-container"]}>
                <p className={styles["sentence-display-text"]}>{exerciseSent}</p>
            </div>
        </section>
    )
}

function ChineseInput({exerciseId, english}){
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
            <div className={styles["tag-row"]}>
                <span className={styles.tag}>Chinese</span>
            </div>
            <div className={styles["sentence-display-container"]}>
            {result && <CheckResult result={result} vocab={vocab}/>}                
            </div>
            {/* Saving is only offered once the sentence is right. The English prompt is saved as the meaning. */}
            {sentenceIsCorrect(result, vocab) && (
                <SavePhrase
                    key={exerciseId + (result.text || sentence)}
                    choices={[{ chinese: result.text || sentence, pinyin: toPinyin(result.text || sentence), meaning: english }]}
                    source="Sentence Builder"
                />
            )}
            {error && <p className={styles["error-text"]} role="alert">{error}</p>}
            <form className={styles.form} onSubmit={handleSubmit}>
                <textarea
                    className={styles["chinese-input"]}
                    value={sentence}
                    onChange={(e)=>setSentance(e.target.value)}
                    placeholder="Chinese sentence here..."
                    aria-label="Your Chinese sentence"
                    rows={4}
                />
                <div className={styles["form-actions"]}>
                    <button type="submit" className={styles["submit-btn"]} disabled={loading}>
                        {loading ? "Checking..." : "Check"}
                    </button>
                </div>
            </form>
        </section>
    )
}



function App(){
    const [index, setIndex] = useState(0);
    const prompt = PROMPTS[index];

    // Picks a random sentence that is different from the current one.
    function handleShuffle(){
        if (PROMPTS.length < 2) return;
        let next = index;
        while (next === index){
            next = Math.floor(Math.random() * PROMPTS.length);
        }
        setIndex(next);
    }

    return(
        <>
            <Navbar/>
            <main className={styles.main}>               
                <section className={styles.builder}>
                    <h1 className={styles.title}>Sentence Builder</h1>
                    <EnglishInput exerciseSent={prompt.english} onShuffle={handleShuffle}/>
                    <SwapArrows/>
                    <ChineseInput key={prompt.id} exerciseId={prompt.id} english={prompt.english}/>
                </section>
                {/* <section className={styles.side}>
                    <div>
                        <SlangGlossSearch variant = {"dropdown"}/>    
                    </div>    
                </section>   */}
            </main>
        </>
    )
}

export default App
