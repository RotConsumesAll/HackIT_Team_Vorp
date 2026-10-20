"use client";

import Link from "next/link";
import { Suspense, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import Navbar from "../../../components/Navbar/Navbar";
import ProverbFrame from "../ProverbFrame";
import { useProverbs, chunk, shuffle } from "../../../../lib/useProverbs";
import styles from "../proverbs.module.css";

// Remove punctuation and spaces so only the characters remain
const clean = (text) => text.replace(/[\p{P}\s]/gu, "");

function MixView() {
    const params = useSearchParams();
    const setNumber = Number(params.get("set") ?? 0);
    const { proverbs, loading, error } = useProverbs();

    const [current, setCurrent] = useState(0);
    const [selected, setSelected] = useState([]);   // tile ids in click order
    const [status, setStatus] = useState("idle");   // idle | correct | wrong | passed
    const [score, setScore] = useState(0);

    const cards = useMemo(() => chunk(proverbs)[setNumber] ?? [], [proverbs, setNumber]);
    const card = cards[current];

    const tiles = useMemo(() => {
        if (!card) return [];
        return shuffle([...clean(card.proverb)].map((char, id) => ({ id, char })));
    }, [card]);

    function toggleTile(id) {
        if (status !== "idle") return;
        setSelected(selected.includes(id) ? selected.filter((s) => s !== id) : [...selected, id]);
    }

    function submit() {
        const attempt = selected.map((id) => tiles.find((t) => t.id === id).char).join("");
        const isRight = attempt === clean(card.proverb);
        setStatus(isRight ? "correct" : "wrong");
        if (isRight) setScore(score + 1);
    }

    function nextQuestion() {
        setCurrent(current + 1);
        setSelected([]);
        setStatus("idle");
    }

    function tileClass(isSelected) {
        if (status === "correct") return styles.tileCorrect;
        if (status === "wrong") return styles.tileWrong;
        return isSelected ? styles.tileOn : "";
    }

    let body;
    if (loading) {
        body = <p className={styles.note}>Loading...</p>;
    } else if (error) {
        body = <p className={styles.bad}>Couldn't load proverbs: {error}</p>;
    } else if (cards.length === 0) {
        body = <p className={styles.note}>No proverbs in this set.</p>;
    } else if (!card) {
        body = (
            <div className={styles.done}>
                <h2>All done</h2>
                <p>You got {score} of {cards.length} right.</p>
                <div className={styles.actions}>
                    <Link href={`/proverbflashcards/pFlashcards?set=${setNumber}`} className={styles.ghost}>
                        Back to flashcards
                    </Link>
                    <Link href={`/proverbflashcards/pQuiz?set=${setNumber}`} className={styles.btn}>
                        Short Quiz
                    </Link>
                </div>
            </div>
        );
    } else {
        body = (
            <div className={styles.panel}>
                <div className={styles.metaRow}>
                    <span>Question {current + 1} of {cards.length}</span>
                    <span>Proverbs</span>
                </div>
                <div className={styles.bar}>
                    <div className={styles.barFill} style={{ width: `${(current / cards.length) * 100}%` }} />
                </div>
                <p className={styles.barText}>{current} of {cards.length} complete</p>

                <h2 className={styles.question}>Form the proverb that means: {card.translation}</h2>

                {status === "correct" && <p className={styles.good}>Correct answer</p>}
                {status === "wrong" && <p className={styles.bad}>Not quite, try again</p>}
                {status === "passed" && <p className={styles.info}>Question passed</p>}

                <div className={styles.tiles}>
                    {tiles.map((tile) => {
                        const order = selected.indexOf(tile.id);
                        return (
                            <button
                                key={tile.id}
                                type="button"
                                onClick={() => toggleTile(tile.id)}
                                disabled={status !== "idle"}
                                className={`${styles.tile} ${tileClass(order >= 0)}`}
                            >
                                {tile.char}
                                <span className={styles.tileNum}>{order >= 0 ? order + 1 : ""}</span>
                            </button>
                        );
                    })}
                </div>

                {status === "passed" && (
                    <div className={styles.reveal}>
                        <p className={styles.hint}>The answer was:</p>
                        <p className={styles.cardHan}>{card.proverb}</p>
                        <p className={styles.cardPinyin}>{card.pinyin}</p>
                    </div>
                )}

                <div className={styles.footRow}>
                    {status === "idle" && (
                        <>
                            <button type="button" className={styles.ghost} onClick={() => setStatus("passed")}>
                                Pass Question
                            </button>
                            <button
                                type="button"
                                className={styles.btn}
                                onClick={submit}
                                disabled={selected.length !== tiles.length}
                            >
                                Submit Answer
                            </button>
                        </>
                    )}
                    {status === "wrong" && (
                        <button
                            type="button"
                            className={styles.btn}
                            onClick={() => { setSelected([]); setStatus("idle"); }}
                        >
                            Try Again
                        </button>
                    )}
                    {(status === "correct" || status === "passed") && (
                        <button type="button" className={styles.btn} onClick={nextQuestion}>
                            Next Question
                        </button>
                    )}
                </div>
            </div>
        );
    }

    return (
        <ProverbFrame title="Mix and Match" subtitle={`Set ${setNumber + 1}`} narrow>
            {body}
        </ProverbFrame>
    );
}

export default function PMixnmatch() {
    return (
        <>
            <Navbar />
            <Suspense fallback={null}>
                <MixView />
            </Suspense>
        </>
    );
}