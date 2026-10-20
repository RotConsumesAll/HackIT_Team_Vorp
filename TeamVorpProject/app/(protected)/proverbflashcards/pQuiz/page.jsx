"use client";

import Link from "next/link";
import { Suspense, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import Navbar from "../../../components/Navbar/Navbar";
import SavePhrase from "../../../components/SavePhrase/SavePhrase";
import ProverbFrame from "../ProverbFrame";
import { useProverbs, chunk, shuffle } from "../../../../lib/useProverbs";
import styles from "../proverbs.module.css";

const LETTERS = ["A", "B", "C", "D"];

function QuizView() {
    const params = useSearchParams();
    const setNumber = Number(params.get("set") ?? 0);
    const { proverbs, loading, error } = useProverbs();

    const [current, setCurrent] = useState(0);
    const [picked, setPicked] = useState(null);
    const [correct, setCorrect] = useState(false);
    const [missed, setMissed] = useState(false);
    const [score, setScore] = useState(0);

    const questions = useMemo(() => {
        const cards = chunk(proverbs)[setNumber] ?? [];
        return cards.map((card) => {
            const wrong = shuffle(proverbs.filter((p) => p.translation !== card.translation))
                .slice(0, 3)
                .map((p) => p.translation);
            return {
                proverb: card.proverb,
                pinyin: card.pinyin,
                answer: card.translation,
                options: shuffle([card.translation, ...wrong]),
            };
        });
    }, [proverbs, setNumber]);

    const q = questions[current];

    function choose(option) {
        if (correct) return;
        setPicked(option);
        if (option === q.answer) {
            setCorrect(true);
            if (!missed) setScore(score + 1);
        } else {
            setMissed(true);
        }
    }

    function next() {
        setCurrent(current + 1);
        setPicked(null);
        setCorrect(false);
        setMissed(false);
    }

    function restart() {
        setCurrent(0);
        setScore(0);
        setPicked(null);
        setCorrect(false);
        setMissed(false);
    }

    let body;
    if (loading) {
        body = <p className={styles.note}>Loading quiz...</p>;
    } else if (error) {
        body = <p className={styles.bad}>Couldn't load quiz: {error}</p>;
    } else if (questions.length === 0) {
        body = <p className={styles.note}>No proverbs in this set.</p>;
    } else if (current >= questions.length) {
        body = (
            <div className={styles.done}>
                <h2>Quiz complete</h2>
                <p>You scored {score} out of {questions.length} on the first try.</p>
                <div className={styles.actions}>
                    <Link href={`/proverbflashcards/pFlashcards?set=${setNumber}`} className={styles.ghost}>
                        Back to flashcards
                    </Link>
                    <button type="button" className={styles.btn} onClick={restart}>Try again</button>
                </div>
            </div>
        );
    } else {
        body = (
            <div className={styles.panel}>
                <div className={styles.metaRow}>
                    <span>Question {current + 1} of {questions.length}</span>
                    <span>Proverbs</span>
                </div>
                <div className={styles.bar}>
                    <div className={styles.barFill} style={{ width: `${(current / questions.length) * 100}%` }} />
                </div>
                <p className={styles.barText}>{current} of {questions.length} complete</p>

                <h2 className={styles.question}>
                    What is the meaning of <span className={styles.hanInline}>{q.proverb}</span>?
                </h2>

                <div className={styles.options}>
                    {q.options.map((option, i) => {
                        const isPicked = picked === option;
                        const stateClass = isPicked ? (correct ? styles.optionCorrect : styles.optionWrong) : "";
                        return (
                            <button
                                key={option}
                                type="button"
                                onClick={() => choose(option)}
                                disabled={correct}
                                className={`${styles.option} ${stateClass}`}
                            >
                                <span className={styles.optionRow}>
                                    <span className={styles.letter}>{LETTERS[i]}</span>
                                    {option}
                                </span>
                                {isPicked && (
                                    <span className={styles.optionNote}>{correct ? "Correct answer" : "Try Again"}</span>
                                )}
                            </button>
                        );
                    })}
                </div>

                {correct && (
                    <SavePhrase
                        key={q.proverb}
                        choices={[{ chinese: q.proverb, pinyin: q.pinyin, meaning: q.answer }]}
                        source="Proverb Flashcards"
                    />
                )}

                <div className={styles.footRow}>
                    <button type="button" className={styles.btn} onClick={next} disabled={!correct}>
                        {current + 1 === questions.length ? "Finish" : "Next"}
                    </button>
                </div>
            </div>
        );
    }

    return (
        <ProverbFrame title="Quiz" subtitle={`Set ${setNumber + 1}`} narrow>
            {body}
        </ProverbFrame>
    );
}

export default function PQuiz() {
    return (
        <>
            <Navbar />
            <Suspense fallback={null}>
                <QuizView />
            </Suspense>
        </>
    );
}