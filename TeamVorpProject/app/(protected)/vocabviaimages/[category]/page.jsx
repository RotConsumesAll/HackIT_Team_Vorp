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

    function handleSubmit(e) {
        e.preventDefault()
        if (!guess.trim()) return
        setResult(guess.trim() === item.chinese ? "correct" : "wrong")
    }

    function handleNext() {
        setIndex((i) => (i + 1) % items.length)
        setGuess("")
        setResult(null)
        setRevealed(false)
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
                <div className={styles.answerArea}>
                    <form className={styles.inputRow} onSubmit={handleSubmit}>
                        <input
                            className={styles.input}
                            type="text"
                            value={guess}
                            onChange={(e) => setGuess(e.target.value)}
                            aria-label="Your answer in Chinese"
                        />
                        <button type="submit" className={styles.submitButton}>Submit</button>
                    </form>

                    {result && (
                        <p className={`${styles.feedback} ${result === "correct" ? styles.correct : styles.wrong}`}>
                            {result === "correct" ? "Correct!" : "Not quite. Try again or reveal the answer."}
                        </p>
                    )}

                    <button className={styles.button} onClick={() => setRevealed(true)}>
                        Reveal Answer
                    </button>
                </div>
            ) : (
                <div className={styles.revealWrap}>
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