"use client";

import Link from "next/link";
import { Suspense, useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import Navbar from "../../../components/Navbar/Navbar";
import ProverbFrame from "../ProverbFrame";
import { useProverbs, chunk } from "../../../../lib/useProverbs";
import styles from "../proverbs.module.css";

function FlashcardView() {
    const params = useSearchParams();
    const setNumber = Number(params.get("set") ?? 0);

    const { proverbs, loading, error } = useProverbs();
    const [cardIndex, setCardIndex] = useState(0);
    const [flipped, setFlipped] = useState(false);

    const cards = chunk(proverbs)[setNumber] ?? [];
    const card = cards[cardIndex];

    useEffect(() => {
        function onKey(e) {
            if (e.key === "ArrowLeft") go(-1);
            if (e.key === "ArrowRight") go(1);
        }
        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
    });

    function go(step) {
        setCardIndex((cardIndex + step + cards.length) % cards.length);
        setFlipped(false);
    }

    return (
        <ProverbFrame title="Proverb Flashcards" subtitle={`Set ${setNumber + 1}`} narrow>
            {loading && <p className={styles.note}>Loading flashcards...</p>}
            {error && <p className={styles.bad}>Couldn't load flashcards: {error}</p>}
            {!loading && !error && !card && <p className={styles.note}>No proverbs in this set.</p>}

            {card && (
                <>
                    <div className={styles.cardRow}>
                        <button type="button" className={styles.arrow} onClick={() => go(-1)} aria-label="Previous card">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                                <path d="M15 18l-6-6 6-6" />
                            </svg>
                        </button>

                        <button type="button" className={styles.flashcard} onClick={() => setFlipped(!flipped)}>
                            {flipped ? (
                                <>
                                    <p className={styles.cardHan}>{card.proverb}</p>
                                    <p className={styles.cardPinyin}>{card.pinyin}</p>
                                    <p className={styles.cardMeaning}>{card.translation}</p>
                                </>
                            ) : (
                                <>
                                    <p className={styles.cardHan}>{card.proverb}</p>
                                    <p className={styles.hint}>Tap to flip</p>
                                </>
                            )}
                        </button>

                        <button type="button" className={styles.arrow} onClick={() => go(1)} aria-label="Next card">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                                <path d="M9 6l6 6-6 6" />
                            </svg>
                        </button>
                    </div>

                    <div className={styles.bottomRow}>
                        <p className={styles.counter}>{cardIndex + 1}/{cards.length}</p>
                        <div className={styles.actions}>
                            <Link href={`/proverbflashcards/pMixnmatch?set=${setNumber}`} className={styles.ghost}>
                                Mix and Match
                            </Link>
                            <Link href={`/proverbflashcards/pQuiz?set=${setNumber}`} className={styles.btn}>
                                Short Quiz
                            </Link>
                        </div>
                    </div>
                </>
            )}
        </ProverbFrame>
    );
}

export default function PFlashcards() {
    return (
        <>
            <Navbar />
            <Suspense fallback={null}>
                <FlashcardView />
            </Suspense>
        </>
    );
}