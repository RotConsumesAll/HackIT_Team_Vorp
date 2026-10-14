"use client";

import Link from "next/link";
import { useState } from "react";
import Navbar from "../../components/Navbar/Navbar";
import { useProverbs, chunk } from "../../../lib/useProverbs";

const SETS_PER_PAGE = 4;
const btn =
    "inline-flex items-center justify-center rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700";

function Body() {
    const { proverbs, loading, error } = useProverbs();
    const [visible, setVisible] = useState(SETS_PER_PAGE);

    if (loading) return <p>Loading proverbs...</p>;
    if (error) return <p>Couldn't load proverbs: {error}</p>;

    const sets = chunk(proverbs);

    return (
        <main className="flex flex-col items-center gap-8 p-8">
            <h1 className="text-2xl font-bold">Chinese Proverb Learning</h1>

            <div className="flex flex-wrap justify-center gap-6">
                {sets.slice(0, visible).map((set, i) => (
                    <div key={i} className="flex w-64 flex-col gap-3 border p-4">
                        <p className="text-xl">{set[0].proverb}</p>
                        <h2 className="font-semibold">Proverb Learning Set {i + 1}</h2>
                        <p className="text-sm">Quantity: {set.length}</p>
                        <Link href={`/proverbflashcards/pFlashcards?set=${i}`} className={btn}>
                            More info
                        </Link>
                    </div>
                ))}
            </div>

            {visible < sets.length && (
                <button onClick={() => setVisible(visible + SETS_PER_PAGE)} className={btn}>
                    See More
                </button>
            )}
        </main>
    );
}

export default function PMain() {
    return (
        <>
            <Navbar />
            <Body />
        </>
    );
}