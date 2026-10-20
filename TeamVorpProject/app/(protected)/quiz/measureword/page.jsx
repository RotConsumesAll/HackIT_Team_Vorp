"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import Navbar from "../../../components/Navbar/Navbar"
import ShareButton from "../../../components/ShareButton/ShareButton"
import SavePhrase from "../../../components/SavePhrase/SavePhrase"
import { phraseChoices } from "../../../../lib/phraseChoices"
import { getQuestions, QUIZ_LENGTH } from "../../../../lib/questions"
import { recordAnswer, recordDaily, recordHighScore, currentUid, BADGE_NAMES, recordQuizFinished } from "../../../../lib/progress"
import { useUid } from "../../../../lib/useuid"
import styles from "./page.module.css"

function shuffle(list){
  const a = [...list]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

function MeasureWord(){
  const [questions, setQuestions] = useState(null)
  const [index, setIndex] = useState(0)
  const [input, setInput] = useState("")
  const [message, setMessage] = useState("")
  const [done, setDone] = useState(false)
  const [skipped, setSkipped] = useState(false)
  const [score, setScore] = useState(0)
  const [firstTry, setFirstTry] = useState(true)
  const [error, setError] = useState("")
  const [streak, setStreak] = useState(0)
  const [daily, setDaily] = useState(null)
  const [badgeMsg, setBadgeMsg] = useState("")
  const [endBadgeMsg, setEndBadgeMsg] = useState("")
  useUid() // also counts today as a login day

  useEffect(() => {
    async function load(){
      try {
        const list = await getQuestions("measure")
        setQuestions(shuffle(list).slice(0, QUIZ_LENGTH))
      } catch (e) {
        setError("Could not load questions. Check your connection and the database rules.")
        setQuestions([])
      }
    }
    load()
  }, [])

  // When the quiz ends: save the score, and give any badges for finishing
  useEffect(() => {
    async function finish(){
      const uid = currentUid()
      await recordHighScore(uid, "quiz_measure", score)
      const finished = await recordQuizFinished(uid, score, questions.length)
      if (finished.newBadges.length > 0) {
        setEndBadgeMsg("New badge: " + finished.newBadges.map((b) => BADGE_NAMES[b] || b).join(", "))
      }
    }
    if (questions && questions.length > 0 && index >= questions.length) finish()
  }, [index])

  if (questions === null) return <p className={styles.note}>Loading...</p>
  if (error) return <p className={styles.note}>{error}</p>
  if (questions.length === 0) {
    return (
      <section className={styles.result}>
        <h1 className={styles.title}>No questions yet</h1>
        <p className={styles.small}>No questions found for this quiz yet.</p>
        <Link href="/contextguess" className={styles.back}>Back to Context Guess</Link>
      </section>
    )
  }

  if (index >= questions.length) {
    return (
      <section className={styles.result}>
        <p className={styles.eyebrow}>Round complete</p>
        <h1 className={styles.title}>Nice one!</h1>
        <p className={styles.score}><span>{score}</span> / {questions.length}</p>
        <p className={styles.small}>right on the first try</p>
        {endBadgeMsg && <p className={styles.badge}>{endBadgeMsg}</p>}
        <div className={styles.actions}>
          <button className={styles.primary} onClick={() => window.location.reload()}>Play again</button>
          <ShareButton text={"I got " + score + " / " + questions.length + " on " + "Measure Word" + " in the Mother Tongue app!"} />
        </div>
        <Link href="/contextguess" className={styles.back}>Pick another quiz</Link>
      </section>
    )
  }

  const q = questions[index]

  async function track(correct){
    const uid = currentUid()
    const result = await recordAnswer(uid, "measure", correct)
    const dailyResult = await recordDaily(uid, "contextGuess")
    if (result) setStreak(result.streak)
    if (dailyResult) setDaily(dailyResult)
    const earned = [...(result ? result.newBadges : []), ...(dailyResult ? dailyResult.newBadges : [])]
    if (earned.length > 0) {
      setBadgeMsg("New badge: " + earned.map((b) => BADGE_NAMES[b] || b).join(", "))
    }
  }

  function check(e){
    e.preventDefault()
    const answer = input.trim()
    if (!answer || done) return
    if (answer === q.answerText) {
      setDone(true)
      setMessage("")
      if (firstTry) { setScore((s) => s + 1); track(true) }
    } else {
      if (firstTry) track(false)
      setFirstTry(false)
      // Optional: a specific message for common wrong answers, e.g. wrongAnswers: { "个": "..." }
      const specific = q.wrongAnswers && q.wrongAnswers[answer]
      setMessage(specific || "Not quite. Think about what kind of thing it is and try again.")
      setInput("")
    }
  }

  function skip(){
    if (firstTry) track(false)
    setSkipped(true)
    setDone(true)
    setFirstTry(false)
    setMessage("")
  }

  function next(){
    setBadgeMsg("")
    setIndex((i) => i + 1)
    setInput("")
    setMessage("")
    setDone(false)
    setSkipped(false)
    setFirstTry(true)
  }

  const percent = Math.round((index / questions.length) * 100)

  return (
    <>
      <Link href="/contextguess" className={styles.back}>← Back</Link>

      <header className={styles.header}>
        <h1 className={styles.title}>Measure Word</h1>
        <p className={styles.count}>Question {index + 1} of {questions.length}</p>
        <div className={styles.progress} role="progressbar" aria-valuenow={percent} aria-valuemin={0} aria-valuemax={100} aria-label="Quiz progress">
          <div className={styles.fill} style={{ width: percent + "%" }} />
        </div>
        <div className={styles.chips}>
          <span className={styles.chip}>Streak {streak}</span>
          {daily && <span className={styles.chip}>Daily streak {daily.current} · Today {Math.min(daily.todayCount, daily.goal)} / {daily.goal}</span>}
        </div>
      </header>

      <section className={styles.prompt}>
        <p className={styles.label}>Fill in the blank</p>
        <h2 className={styles.question}>一 ___ {q.prompt}</h2>
      </section>

      <form className={styles.typedForm} onSubmit={check}>
        <input
          className={styles.input}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type the measure word"
          disabled={done}
          aria-label="Measure word"
        />
        <button className={styles.primary} type="submit" disabled={done}>Check</button>
        <button className={styles.secondary} type="button" onClick={skip} disabled={done}>Pass question</button>
      </form>

      {message && <p className={styles.bad} role="status">{message}</p>}

      {done && !skipped && <p className={styles.ok} role="status"><strong>Correct!</strong> 一{q.answerText}{q.prompt}. {q.explanation}</p>}
      {done && skipped && <p className={styles.bad} role="status"><strong>Passed.</strong> The answer is <strong>{q.answerText}</strong>: 一{q.answerText}{q.prompt}. {q.explanation}</p>}

      {badgeMsg && <p className={styles.badge}>{badgeMsg}</p>}

      {done && <SavePhrase key={q.quizType + q.id} choices={phraseChoices(q)} source="Context Guess · Measure Word" />}

      {done && (
        <div className={styles.nextRow}>
          <button className={styles.primary} onClick={next}>
            {index + 1 === questions.length ? "See results" : "Next"}
          </button>
        </div>
      )}
    </>
  )
}

function MeasureWordPage(){
  return (
    <div className={styles.shell}>
      <Navbar/>
      <main className={styles.page}>
        <MeasureWord/>
      </main>
    </div>
  )
}

export default MeasureWordPage