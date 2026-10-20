"use client";

import Link from "next/link";
import { useState } from "react";
import Navbar from "../../components/Navbar/Navbar";
import ProverbFrame from "./ProverbFrame";
import { useProverbs, chunk } from "../../../lib/useProverbs";
import styles from "./proverbs.module.css";

const SETS_PER_PAGE = 4;

function Body() {
    const { proverbs, loading, error } = useProverbs();
    const [visible, setVisible] = useState(SETS_PER_PAGE);
    const sets = chunk(proverbs);

    return (
        <ProverbFrame title="Chinese Proverb Learning" subtitle="Pick a set and start practising.">
            {loading && <p className={styles.note}>Loading proverbs...</p>}
            {error && <p className={styles.bad}>Couldn't load proverbs: {error}</p>}

            <div className={styles.grid}>
                {sets.slice(0, visible).map((set, i) => (
                    <div key={i} className={styles.setCard}>
                        <div className={styles.preview}>
                            <span className={styles.previewText}>{set[0].proverb}</span>
                        </div>
                        <h2 className={styles.setTitle}>Proverb Learning Set {i + 1}</h2>
                        <p className={styles.setMeta}>Quantity: {set.length}</p>
                        <Link href={`/proverbflashcards/pFlashcards?set=${i}`} className={styles.btn}>
                            More info →
                        </Link>
                    </div>
                ))}
            </div>

            {visible < sets.length && (
                <div className={styles.moreRow}>
                    <button type="button" className={styles.more} onClick={() => setVisible(visible + SETS_PER_PAGE)}>
                        See More
                    </button>
                </div>
            )}
        </ProverbFrame>
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