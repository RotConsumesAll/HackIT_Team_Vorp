'use client'
import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import { ref, get } from "firebase/database"
import { db } from "../../../../lib/firebase"   // adjust if your lib folder is elsewhere
import Navbar from "../../../components/Navbar/Navbar"
import styles from "../imageLearner.module.css"

// Where your image files live. Firebase only stores the file name (e.g. "chair.jpg"),
// so the full URL is IMAGE_BASE_PATH + file name.
// e.g. files in public/images/vocab/chair.jpg  ->  "/images/vocab/"
const IMAGE_BASE_PATH = "/images/vocab/"

// Only Chinese (Han) characters allowed: no pinyin, English, numbers or punctuation
const CHINESE_ONLY = /^\p{Script=Han}+$/u

// "everyday-objects" -> "Everyday Objects"
function formatCategory(slug = "") {
    return decodeURIComponent(slug)
        .split("-")
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
        .join(" ")
}

function shuffle(array) {
    const copy = [...array]
    for (let i = copy.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1))
        ;[copy[i], copy[j]] = [copy[j], copy[i]]
    }
    return copy
}

// Loads questions/image/<category> from Firebase Realtime Database
function useCategoryItems(slug) {
    const [items, setItems] = useState([])
    const [status, setStatus] = useState("loading")   // "loading" | "ready" | "empty" | "error"

    useEffect(() => {
        if (!slug) return
        let cancelled = false
        setStatus("loading")

        get(ref(db, `questions/image/${slug}`))
            .then((snapshot) => {
                if (cancelled) return
                if (!snapshot.exists()) {
                    setItems([])
                    setStatus("empty")
                    return
                }
                const list = Object.entries(snapshot.val()).map(([id, value]) => ({ id, ...value }))
                setItems(shuffle(list))
                setStatus("ready")
            })
            .catch((err) => {
                console.error("Failed to load items:", err)
                if (!cancelled) setStatus("error")
            })

        return () => { cancelled = true }
    }, [slug])

    return { items, status }
}

function Shell({ categoryName, children }){
    return (
        <main className={styles.main}>
            <h1 className={styles.title}>Image Learner</h1>
            <p className={styles.subtitle}>Name the Object in Chinese</p>
            {children}
            <p className={styles.categoryLabel}>Category: {categoryName}</p>
        </main>
    )
}

function Main({ categoryName, slug }){
    const { items, status } = useCategoryItems(slug)
    const [index, setIndex] = useState(0)
    const [guess, setGuess] = useState("")
    const [result, setResult] = useState(null)      // null | "correct" | "wrong"
    const [revealed, setRevealed] = useState(false)
    const [error, setError] = useState("")          // input validation message

    if (status === "loading") {
        return <Shell categoryName={categoryName}><p className={styles.message}>Loading…</p></Shell>
    }
    if (status === "error") {
        return (
            <Shell categoryName={categoryName}>
                <p className={`${styles.message} ${styles.messageError}`}>
                    Couldn&apos;t load this category. Check your connection and database rules, then refresh.
                </p>
            </Shell>
        )
    }
    if (status === "empty") {
        return <Shell categoryName={categoryName}><p className={styles.message}>No items in this category yet.</p></Shell>
    }

    const item = items[index]
    // Reveal Answer unlocks once the user has submitted at least once for this word
    const hasSubmitted = result !== null

    function handleSubmit(e) {
        e.preventDefault()
        const answer = guess.trim()

        // Validation: invalid input shows a message and does NOT count as an attempt
        if (!answer) {
            setError("Please type an answer")
            return
        }
        if (!CHINESE_ONLY.test(answer)) {
            setError("Type only in Chinese")
            return
        }
        setError("")

        const isCorrect = answer === item.chinese
        setResult(isCorrect ? "correct" : "wrong")
        // Right answer: go straight to the answer screen (same as Reveal Answer)
        if (isCorrect) setRevealed(true)
    }

    function handleNext() {
        setIndex((i) => (i + 1) % items.length)
        setGuess("")
        setResult(null)
        setRevealed(false)
        setError("")
    }

    return(
        <Shell categoryName={categoryName}>
            <div className={styles.imageBox}>
                {item.image
                    ? <img src={`${IMAGE_BASE_PATH}${item.image}`} alt={item.meaning} />
                    : <span>No image</span>}
            </div>
            <p className={styles.english}>{item.meaning}</p>

            {!revealed ? (
                <>
                <div className={styles.answerArea}>
                    <form className={styles.inputRow} onSubmit={handleSubmit}>
                        <input
                            className={styles.input}
                            type="text"
                            value={guess}
                            onChange={(e) => {
                                setGuess(e.target.value)
                                if (error) setError("")   // clear the message once they start editing
                            }}
                            onKeyDown={(e) => {
                                // Enter while composing with a Chinese keyboard (IME) only confirms the
                                // characters, so don't let it submit the form
                                if (e.key === "Enter" && (e.nativeEvent.isComposing || e.keyCode === 229)) {
                                    e.preventDefault()
                                }
                            }}
                            aria-label="Your answer in Chinese"
                        />
                        <button type="submit" className={styles.submitButton}>Submit</button>
                    </form>

                    {error && (
                        <p className={`${styles.feedback} ${styles.wrong}`} role="alert">{error}</p>
                    )}

                    {!error && result && (
                        <p className={`${styles.feedback} ${result === "correct" ? styles.correct : styles.wrong}`}>
                            {result === "correct" ? "Correct!" : "Not quite. Try again or reveal the answer."}
                        </p>
                    )}
                </div>
                <div className={styles.revealDock}>
                        <button
                            className={styles.button}
                            onClick={() => setRevealed(true)}
                            disabled={!hasSubmitted}
                            title={hasSubmitted ? "" : "Submit an answer first"}
                        >
                            Reveal Answer
                        </button>
                        {!hasSubmitted && (
                            <p className={styles.hint}>Submit an answer to unlock Reveal Answer.</p>
                        )}
                </div>
                </>
            ) : (
                <div className={styles.revealWrap}>
                    {result === "correct" && (
                        <p className={styles.correctBanner}>
                            <span aria-hidden="true">✓</span> Correct!
                        </p>
                    )}
                    <p className={styles.chinese}>{item.chinese}</p>
                    <p className={styles.pinyin}>{item.pinyin}</p>
                    <div className={styles.nextWrap}>
                        <button className={styles.button} onClick={handleNext}>Next</button>
                    </div>
                </div>
            )}
        </Shell>
    )
}

function App(){
    const params = useParams()
    const slug = params.category   // must match your folder name: [category] -> params.category
    return(
        <>
            <Navbar />
            <Main categoryName={formatCategory(slug)} slug={slug} />
        </>
    )
}

export default App