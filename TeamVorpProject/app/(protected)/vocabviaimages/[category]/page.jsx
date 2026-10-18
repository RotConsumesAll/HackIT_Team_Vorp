'use client'
import { useState } from "react"
import { useParams } from "next/navigation"
import Navbar from "../../../components/Navbar/Navbar"

// TODO: replace with real data (e.g. from Firebase / your API).
// Each item: an image URL, the English word, the Chinese characters and pinyin.
const PLACEHOLDER_ITEMS = [
    { image: "", english: "English word 1", chinese: "中文一", pinyin: "pinyin yī" },
    { image: "", english: "English word 2", chinese: "中文二", pinyin: "pinyin èr" },
    { image: "", english: "English word 3", chinese: "中文三", pinyin: "pinyin sān" },
]

const primaryButton =
    "cursor-pointer rounded bg-[#6479f5] px-7 py-2 text-xs font-semibold text-white hover:bg-[#5063d9] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#6479f5]"

// "everyday-objects" -> "Everyday Objects"
function formatCategory(slug = "") {
    return decodeURIComponent(slug)
        .split("-")
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
        .join(" ")
}

function Main({ categoryName }){
    const [index, setIndex] = useState(0)
    const [guess, setGuess] = useState("")
    const [result, setResult] = useState(null)      // null | "correct" | "wrong"
    const [revealed, setRevealed] = useState(false)

    // TODO: load items for `categoryName` instead of using the placeholder list
    const items = PLACEHOLDER_ITEMS
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
        <main className="relative flex min-h-[calc(100vh-64px)] flex-col items-center bg-[#faf9f5] px-4 pb-14 pt-8">
            <h1 className="m-0 text-center text-3xl font-bold text-[#6479f5]">Image Learner</h1>
            <p className="mb-8 mt-1 text-center text-xs text-neutral-700">Name the Object in Chinese</p>

            <div className="flex aspect-[270/220] w-full max-w-[270px] items-center justify-center bg-white text-xs text-neutral-400">
                {item.image
                    ? <img className="max-h-full max-w-full object-contain" src={item.image} alt={item.english} />
                    : <span>Image placeholder</span>}
            </div>
            <p className="mt-2 text-xs font-medium">{item.english}</p>

            {!revealed ? (
                <div className="mt-8 flex min-h-[130px] w-full max-w-[420px] flex-col items-center gap-4">
                    <form className="flex w-full gap-1" onSubmit={handleSubmit}>
                        <input
                            className="min-w-0 flex-1 rounded border border-neutral-300 bg-white px-2 py-1.5 text-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#6479f5]"
                            type="text"
                            value={guess}
                            onChange={(e) => setGuess(e.target.value)}
                            aria-label="Your answer in Chinese"
                        />
                        <button
                            type="submit"
                            className="cursor-pointer rounded border border-neutral-300 bg-white px-2.5 py-1.5 text-xs focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#6479f5]"
                        >
                            Submit
                        </button>
                    </form>

                    {result && (
                        <p className={`m-0 text-xs ${result === "correct" ? "text-green-700" : "text-red-700"}`}>
                            {result === "correct" ? "Correct!" : "Not quite. Try again or reveal the answer."}
                        </p>
                    )}

                    <button className={primaryButton} onClick={() => setRevealed(true)}>
                        Reveal Answer
                    </button>
                </div>
            ) : (
                <div className="mt-2 flex w-full max-w-[420px] flex-col items-center">
                    <p className="mt-6 text-3xl font-medium leading-tight">{item.chinese}</p>
                    <p className="mt-1 text-xs">{item.pinyin}</p>
                    <div className="mt-12">
                        <button className={primaryButton} onClick={handleNext}>Next</button>
                    </div>
                </div>
            )}

            <p className="absolute bottom-3 right-4 m-0 text-xs">Category: {categoryName}</p>
        </main>
    )
}

function App(){
    const params = useParams()
    const categoryName = formatCategory(params.category)
    return(
        <>
            <Navbar />
            <Main categoryName={categoryName} />
        </>
    )
}

export default App