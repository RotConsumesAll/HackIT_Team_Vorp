"use client";

import Link from "next/link";
import { Suspense, useState } from "react";
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

                    <div className={styles.arrows}>
                        <button type="button" className={styles.arrow} onClick={() => go(-1)} aria-label="Previous card">&lt;</button>
                        <button type="button" className={styles.arrow} onClick={() => go(1)} aria-label="Next card">&gt;</button>
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