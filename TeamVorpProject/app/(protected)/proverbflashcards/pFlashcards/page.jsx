"use client";

import Link from "next/link";
import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import Navbar from "../../../components/Navbar/Navbar";
import { useProverbs, chunk } from "../../../../lib/useProverbs";

const btn =
    "inline-flex items-center justify-center rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-blue-600 hover:bg-blue-700";

function FlashcardView() {
    const params = useSearchParams();
    const setNumber = Number(params.get("set") ?? 0);

    const { proverbs, loading, error } = useProverbs();
    const [cardIndex, setCardIndex] = useState(0);
    const [flipped, setFlipped] = useState(false);

    if (loading) return <p>Loading flashcards...</p>;
    if (error) return <p>Couldn't load flashcards: {error}</p>;

    const cards = chunk(proverbs)[setNumber] ?? [];
    if (cards.length === 0) return <p>No proverbs in this set.</p>;

    const card = cards[cardIndex];

    function go(step) {
        setCardIndex((cardIndex + step + cards.length) % cards.length);
        setFlipped(false);
    }

    return (
        <main className="mx-auto flex max-w-2xl flex-col items-center gap-6 p-8">
            {/* The card */}
            <div
                onClick={() => setFlipped(!flipped)}
                className="flex h-64 w-full cursor-pointer flex-col items-center justify-center gap-2 border p-6 text-center"
            >
                {flipped ? (
                    <>
                        <p className="text-4xl font-bold">{card.proverb}</p>
                        <p className="text-sm">{card.pinyin}</p>
                        <p>{card.translation}</p>
                    </>
                ) : (
                    <p className="text-4xl font-bold">{card.proverb}</p>
                )}
            </div>

            {/* Prev / next arrows */}
            <div className="flex gap-6">
                <button onClick={() => go(-1)}>&lt;</button>
                <button onClick={() => go(1)}>&gt;</button>
            </div>

            {/* Counter on the left, buttons on the right */}
            <div className="flex w-full items-center justify-between">
                <p>{cardIndex + 1}/{cards.length}</p>

                <div className="flex gap-10">
                    <Link href={`/proverbflashcards/pMixnmatch?set=${setNumber}`} className={btn}>
                        Mix and Match
                    </Link>
                    <Link href={`/proverbflashcards/pQuiz?set=${setNumber}`} className={btn}>
                        Short Quiz
                    </Link>
                </div>
            </div>
        </main>
    );
}

export default function PFlashcards() {
    return (
        <>
            <Navbar />
            <Suspense fallback={<p>Loading...</p>}>
                <FlashcardView />
            </Suspense>
        </>
    );
}