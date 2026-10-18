"use client";

import Link from "next/link";
import { Suspense, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import Navbar from "../../../components/Navbar/Navbar";
import { useProverbs, chunk, shuffle } from "../../../../lib/useProverbs";

const btn =
    "inline-flex items-center justify-center rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-blue-600 hover:bg-blue-700 disabled:opacity-50";
const LETTERS = ["A", "B", "C", "D"];

function QuizView() {
    const params = useSearchParams();
    const setNumber = Number(params.get("set") ?? 0);
    const { proverbs, loading, error } = useProverbs();

    const [current, setCurrent] = useState(0);
    const [picked, setPicked] = useState(null);   // last option clicked
    const [correct, setCorrect] = useState(false);
    const [missed, setMissed] = useState(false);  // got this question wrong at least once
    const [score, setScore] = useState(0);

    // Build the questions once the data has loaded
    const questions = useMemo(() => {
        const cards = chunk(proverbs)[setNumber] ?? [];
        return cards.map((card) => {
            const wrong = shuffle(proverbs.filter((p) => p.translation !== card.translation))
                .slice(0, 3)
                .map((p) => p.translation);
            return {
                proverb: card.proverb,
                answer: card.translation,
                options: shuffle([card.translation, ...wrong]),
            };
        });
    }, [proverbs, setNumber]);

    if (loading) return <p>Loading quiz...</p>;
    if (error) return <p>Couldn't load quiz: {error}</p>;
    if (questions.length === 0) return <p>No proverbs in this set.</p>;

    // Finished screen
    if (current >= questions.length) {
        return (
            <main className="mx-auto flex max-w-2xl flex-col items-center gap-4 p-8">
                <h1 className="text-2xl font-bold">Quiz complete</h1>
                <p>You scored {score} out of {questions.length} on the first try.</p>
                <div className="flex gap-10">
                    <Link href={`/proverbflashcards/pFlashcards?set=${setNumber}`} className={btn}>
                        Back to flashcards
                    </Link>
                    <button
                        className={btn}
                        onClick={() => {
                            setCurrent(0);
                            setScore(0);
                            setPicked(null);
                            setCorrect(false);
                            setMissed(false);
                        }}
                    >
                        Try again
                    </button>
                </div>
            </main>
        );
    }

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

    return (
        <main className="mx-auto flex max-w-2xl flex-col gap-4 p-8">
            <div className="text-center">
                <h1 className="text-2xl font-bold">Quiz</h1>
                {correct && <p className="text-sm">Correct answer</p>}
            </div>

            <div className="flex flex-col gap-4 border p-6">
                <div className="flex justify-between text-sm">
                    <span>Question {current + 1} of {questions.length}</span>
                    <span>Proverbs</span>
                </div>

                <progress value={current} max={questions.length} className="w-full" />
                <p className="text-xs">{current} of {questions.length} complete</p>

                <h2 className="text-lg font-bold">What is the meaning of {q.proverb}?</h2>

                <div className="flex flex-col gap-2">
                    {q.options.map((option, i) => (
                        <button
                            key={option}
                            onClick={() => choose(option)}
                            disabled={correct}
                            className="flex flex-col items-start rounded-md border p-3 text-left"
                        >
                            <span className="flex items-center gap-3">
                                <span className="flex h-6 w-6 items-center justify-center rounded-full border text-xs">
                                    {LETTERS[i]}
                                </span>
                                {option}
                            </span>
                            {picked === option && (
                                <span className="text-sm">{correct ? "Correct answer" : "Try Again"}</span>
                            )}
                        </button>
                    ))}
                </div>

                <div className="flex justify-end">
                    <button onClick={next} disabled={!correct} className={btn}>
                        {current + 1 === questions.length ? "Finish" : "Next"}
                    </button>
                </div>
            </div>
        </main>
    );
}

export default function PQuiz() {
    return (
        <>
            <Navbar />
            <Suspense fallback={<p>Loading...</p>}>
                <QuizView />
            </Suspense>
        </>
    );
}