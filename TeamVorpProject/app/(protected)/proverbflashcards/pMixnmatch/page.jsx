"use client";

import Link from "next/link";
import { Suspense, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import Navbar from "../../../components/Navbar/Navbar";
import SavePhrase from "../../../components/SavePhrase/SavePhrase";
import { useProverbs, chunk, shuffle } from "../../../../lib/useProverbs";

const btn =
    "inline-flex items-center justify-center rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-blue-600 hover:bg-blue-700 disabled:opacity-50";

// Remove punctuation and spaces so only the characters remain
const clean = (text) => text.replace(/[\p{P}\s]/gu, "");

function MixView() {
    const params = useSearchParams();
    const setNumber = Number(params.get("set") ?? 0);
    const { proverbs, loading, error } = useProverbs();

    const [current, setCurrent] = useState(0);
    const [selected, setSelected] = useState([]);   // tile ids, in click order
    const [status, setStatus] = useState("idle");   // "idle" | "correct" | "wrong"
    const [passed, setPassed] = useState(0);

    const cards = useMemo(() => chunk(proverbs)[setNumber] ?? [], [proverbs, setNumber]);
    const card = cards[current];

    // Shuffled tiles for the current question
    const tiles = useMemo(() => {
        if (!card) return [];
        const chars = [...clean(card.proverb)];
        return shuffle(chars.map((char, id) => ({ id, char })));
    }, [card]);

    if (loading) return <p>Loading...</p>;
    if (error) return <p>Couldn't load proverbs: {error}</p>;
    if (cards.length === 0) return <p>No proverbs in this set.</p>;

    // Finished screen
    if (!card) {
        return (
            <main className="mx-auto flex max-w-2xl flex-col items-center gap-4 p-8">
                <h1 className="text-2xl font-bold">All done</h1>
                <p>You got {passed} of {cards.length} right.</p>
                <div className="flex gap-10">
                    <Link href={`/proverbflashcards/pFlashcards?set=${setNumber}`} className={btn}>
                        Back to flashcards
                    </Link>
                    <Link href={`/proverbflashcards/pQuiz?set=${setNumber}`} className={btn}>
                        Short Quiz
                    </Link>
                </div>
            </main>
        );
    }

    function toggleTile(id) {
        if (status !== "idle") return;
        setSelected(selected.includes(id) ? selected.filter((s) => s !== id) : [...selected, id]);
    }

    function submit() {
        const attempt = selected.map((id) => tiles.find((t) => t.id === id).char).join("");
        const isRight = attempt === clean(card.proverb);
        setStatus(isRight ? "correct" : "wrong");
        if (isRight) setPassed(passed + 1);
    }

    function nextQuestion() {
        setCurrent(current + 1);
        setSelected([]);
        setStatus("idle");
    }

    return (
        <main className="mx-auto flex max-w-2xl flex-col gap-4 p-8">
            <div className="text-center">
                <h1 className="text-2xl font-bold">Mix and Match</h1>
                {status === "correct" && <p className="text-sm">Correct answer</p>}
                {status === "wrong" && <p className="text-sm">Not quite</p>}
                {status === "passed" && <p className="text-sm">Question passed</p>}
            </div>

            <div className="flex flex-col gap-4 border p-6">
                <div className="flex justify-between text-sm">
                    <span>Question {current + 1} of {cards.length}</span>
                    <span>Proverbs</span>
                </div>

                <progress value={current} max={cards.length} className="w-full" />
                <p className="text-xs">{current} of {cards.length} complete</p>

                <h2 className="text-lg font-bold">
                    Form the proverb that means: {card.translation}
                </h2>

                {/* Tiles */}
                <div className="flex flex-wrap justify-center gap-3 border p-4">
                    {tiles.map((tile) => {
                        const order = selected.indexOf(tile.id);
                        return (
                            <button
                                key={tile.id}
                                onClick={() => toggleTile(tile.id)}
                                className="flex h-14 w-14 flex-col items-center justify-center rounded-md border text-xl"
                            >
                                {tile.char}
                                <span className="text-xs">{order >= 0 ? order + 1 : ""}</span>
                            </button>
                        );
                    })}
                </div>

                {status === "passed" && (
                    <div className="flex flex-col items-center gap-1 border p-4 text-center">
                        <p className="text-sm">The answer was:</p>
                        <p className="text-2xl font-bold">{card.proverb}</p>
                        <p className="text-sm">{card.pinyin}</p>
                    </div>
                )}

                {(status === "correct" || status === "passed") && (
                    <SavePhrase
                        key={card.proverb}
                        choices={[{ chinese: card.proverb, pinyin: card.pinyin, meaning: card.translation }]}
                    />
                )}

                {/* Buttons change with the state */}
                <div className="flex justify-end gap-4">
                    {status === "idle" && (
                        <>
                            <button onClick={() => setStatus("passed")} className={btn}>
                                Pass Question
                            </button>
                            <button
                                onClick={submit}
                                disabled={selected.length !== tiles.length}
                                className={btn}
                            >
                                Submit Answer
                            </button>
                        </>
                    )}
                    {status === "wrong" && (
                        <button
                            onClick={() => {
                                setSelected([]);
                                setStatus("idle");
                            }}
                            className={btn}
                        >
                            Try Again
                        </button>
                    )}
                    {(status === "correct" || status === "passed") && (
                        <button onClick={nextQuestion} className={btn}>
                            Next Question
                        </button>
                    )}
                </div>
            </div>
        </main>
    );
}

export default function PMixnmatch() {
    return (
        <>
            <Navbar />
            <Suspense fallback={<p>Loading...</p>}>
                <MixView />
            </Suspense>
        </>
    );
}