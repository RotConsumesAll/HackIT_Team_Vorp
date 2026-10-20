"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import Link from "next/link"
import Navbar from "../../../components/Navbar/Navbar"
import ShareButton from "../../../components/ShareButton/ShareButton"
import SavePhrase from "../../../components/SavePhrase/SavePhrase"
import { contextSource } from "../../../../lib/phrases"
import { phraseChoices } from "../../../../lib/phraseChoices"
import { getQuestions, getMixedQuestions, QUIZ_LENGTH } from "../../../../lib/questions"
import { recordAnswer, recordDaily, recordHighScore, recordDailyQuiz, getDailyQuizResult, todayString, DAILY_QUIZ_COUNT, currentUid, BADGE_NAMES, recordQuizFinished } from "../../../../lib/progress"
import { useUid } from "../../../../lib/useuid"
import styles from "./page.module.css"

const ALL_TYPES = ["naturalPhrase", "naturalGuess", "sound", "character", "tone", "measure"]

const TITLES = {
  naturalPhrase: "Natural Phrase",
  naturalGuess: "Natural Guess",
  sound: "Sound Guess",
  character: "Character Guess",
  tone: "Tone Guess",
  measure: "Measure Word",
  mix: "Mix it up",
  daily: "Quiz of the Day",
}

function shuffle(list){
  const a = [...list]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

// Same random numbers for the same seed, so everyone gets the same daily questions
function seededRandom(seed){
  let a = seed
  return function(){
    a |= 0
    a = (a + 0x6D2B79F5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function hashString(str){
  let h = 0
  for (let i = 0; i < str.length; i++) {
    h = (Math.imul(31, h) + str.charCodeAt(i)) | 0
  }
  return h
}

// Picks today's questions. Sorting first means the order doesn't depend on the database.
function pickDaily(all){
  const sorted = [...all].sort((a, b) => (a.quizType + a.id).localeCompare(b.quizType + b.id))
  const rand = seededRandom(hashString(todayString()))
  for (let i = sorted.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1))
    ;[sorted[i], sorted[j]] = [sorted[j], sorted[i]]
  }
  return sorted.slice(0, DAILY_QUIZ_COUNT)
}

function Quiz(){
  const { type } = useParams()
  const [questions, setQuestions] = useState(null)
  const [index, setIndex] = useState(0)
  const [wrongKeys, setWrongKeys] = useState([])
  const [lastWrong, setLastWrong] = useState(null)
  const [correctKey, setCorrectKey] = useState(null)
  const [score, setScore] = useState(0)
  const [firstTry, setFirstTry] = useState(true)
  const [error, setError] = useState("")
  const [input, setInput] = useState("")
  const [message, setMessage] = useState("")
  const [skipped, setSkipped] = useState(false)
  const [streak, setStreak] = useState(0)
  const [daily, setDaily] = useState(null)
  const [playedToday, setPlayedToday] = useState(null)
  const [badgeMsg, setBadgeMsg] = useState("")
  const [endBadgeMsg, setEndBadgeMsg] = useState("")
  useUid() // also counts today as a login day

  useEffect(() => {
    async function load(){
      try {
        let list
        if (type === "daily") {
          const done = await getDailyQuizResult(currentUid())
          if (done) {
            setPlayedToday(done)
            setQuestions([])
            return
          }
          list = pickDaily(await getMixedQuestions(ALL_TYPES))
        } else if (type === "mix") {
          list = shuffle(await getMixedQuestions(ALL_TYPES)).slice(0, QUIZ_LENGTH)
        } else {
          list = shuffle(await getQuestions(type)).slice(0, QUIZ_LENGTH)
        }
        setQuestions(list.map((q) => ({ ...q, options: shuffle(q.options) })))
      } catch (e) {
        setError("Could not load questions. Check your connection and the database rules.")
        setQuestions([])
      }
    }
    load()
  }, [type])

  // When the quiz ends: save the score, and give any badges for finishing
  useEffect(() => {
    async function finish(){
      const uid = currentUid()
      const earned = []
      if (type === "daily") {
        const saved = await recordDailyQuiz(uid, score, questions.length)
        if (saved && saved.newBadges) earned.push(...saved.newBadges)
      } else {
        await recordHighScore(uid, "quiz_" + type, score)
      }
      const finished = await recordQuizFinished(uid, score, questions.length)
      earned.push(...finished.newBadges)
      if (earned.length > 0) {
        setEndBadgeMsg("New badge: " + earned.map((b) => BADGE_NAMES[b] || b).join(", "))
      }
    }
    if (questions && questions.length > 0 && index >= questions.length) finish()
  }, [index])

  if (questions === null) return <p className={styles.note}>Loading...</p>
  if (error) return <p className={styles.note}>{error}</p>
  if (playedToday) {
    return (
      <section className={styles.result}>
        <p className={styles.eyebrow}>Quiz of the Day</p>
        <h1 className={styles.title}>You already played today</h1>
        <p className={styles.score}><span>{playedToday.score}</span> / {playedToday.total}</p>
        <p className={styles.small}>Come back tomorrow for a new set of questions!</p>
        <div className={styles.actions}>
          <Link href="/leaderboard" className={styles.primaryLink}>See today's ranking</Link>
        </div>
        <Link href="/contextguess" className={styles.back}>Back to Context Guess</Link>
      </section>
    )
  }
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
          <ShareButton text={"I got " + score + " / " + questions.length + " on " + (TITLES[type] || "a quiz") + " in the Mother Tongue app!"} />
        </div>
        <Link href="/contextguess" className={styles.back}>Pick another quiz</Link>
      </section>
    )
  }

  const q = questions[index]
  const answered = correctKey !== null
  const typed = q.options.length === 0
  const correctOption = q.options.find((o) => o.isCorrect)
  async function track(correct){
    const uid = currentUid()
    const result = await recordAnswer(uid, q.quizType, correct)
    const dailyResult = await recordDaily(uid, "contextGuess")
    if (result) setStreak(result.streak)
    if (dailyResult) setDaily(dailyResult)
    const earned = [...(result ? result.newBadges : []), ...(dailyResult ? dailyResult.newBadges : [])]
    if (earned.length > 0) {
      setBadgeMsg("New badge: " + earned.map((b) => BADGE_NAMES[b] || b).join(", "))
    }
  }

  function choose(option){
    if (answered || wrongKeys.includes(option.key)) return
    if (option.isCorrect) {
      setCorrectKey(option.key)
      setLastWrong(null)
      if (firstTry) { setScore((s) => s + 1); track(true) }
    } else {
      // Only show why this option is wrong. Never reveal the right answer.
      if (firstTry) track(false)
      setWrongKeys((w) => [...w, option.key])
      setLastWrong(option)
      setFirstTry(false)
    }
  }

  function checkTyped(e){
    e.preventDefault()
    const answer = input.trim()
    if (!answer || answered) return
    if (answer === q.answerText) {
      setCorrectKey("typed")
      setMessage("")
      if (firstTry) { setScore((s) => s + 1); track(true) }
    } else {
      if (firstTry) track(false)
      setFirstTry(false)
      const specific = q.wrongAnswers && q.wrongAnswers[answer]
      setMessage(specific || "Not quite. Think about what kind of thing it is and try again.")
      setInput("")
    }
  }

  function pass(){
    if (answered) return
    if (firstTry) track(false)
    setSkipped(true)
    setCorrectKey(typed ? "typed" : correctOption.key)
    setLastWrong(null)
    setFirstTry(false)
    setMessage("")
  }

  function next(){
    setBadgeMsg("")
    setSkipped(false)
    setInput("")
    setMessage("")
    setIndex((i) => i + 1)
    setWrongKeys([])
    setLastWrong(null)
    setCorrectKey(null)
    setFirstTry(true)
  }

  const percent = Math.round((index / questions.length) * 100)

  return (
    <>
      <Link href="/contextguess" className={styles.back}>← Back</Link>

      <header className={styles.header}>
        <h1 className={styles.title}>{TITLES[type] || "Quiz"}</h1>
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
        <p className={styles.label}>{typed ? "Fill in the blank" : "Question"}</p>
        {q.target && <p className={styles.target}>How do you say <strong>{q.target}</strong> here?</p>}
        <h2 className={styles.question}>{typed ? "一 ___ " + q.prompt : q.prompt}</h2>
      </section>

      {typed && (
        <form className={styles.typedForm} onSubmit={checkTyped}>
          <input
            className={styles.input}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type the measure word"
            disabled={answered}
            aria-label="Measure word"
          />
          <button className={styles.primary} type="submit" disabled={answered}>Check</button>
          <button className={styles.secondary} type="button" onClick={pass} disabled={answered}>Pass question</button>
        </form>
      )}
      {typed && message && <p className={styles.bad} role="status">{message}</p>}

      {!typed && (
        <ul className={styles.options}>
          {q.options.map((o, i) => {
            const state = wrongKeys.includes(o.key) ? "wrong" : correctKey === o.key ? "correct" : "idle"
            return (
              <li key={o.key}>
                <button
                  className={styles.option}
                  data-state={state}
                  onClick={() => choose(o)}
                  disabled={answered || wrongKeys.includes(o.key)}
                >
                  <span className={styles.letter} aria-hidden="true">{"ABCD"[i] || i + 1}</span>
                  <span className={styles.optionText}>{o.text}</span>
                </button>
              </li>
            )
          })}
        </ul>
      )}

      {!typed && !answered && (
        <div className={styles.passRow}>
          <button type="button" className={styles.secondary} onClick={pass}>Pass question</button>
        </div>
      )}

      {lastWrong && !answered && <p className={styles.bad} role="status"><strong>Not quite.</strong> {lastWrong.reason} Try another one.</p>}

      {answered && !skipped && <p className={styles.ok} role="status"><strong>Correct!</strong> {correctOption ? correctOption.reason + ". " : ""}{q.explanation}</p>}
      {answered && skipped && <p className={styles.bad} role="status"><strong>Passed.</strong> {typed ? <>The answer is <strong>{q.answerText}</strong>: 一{q.answerText}{q.prompt}. </> : <>The answer is <strong>{correctOption ? correctOption.text : ""}</strong>. </>}{q.explanation}</p>}

      {badgeMsg && <p className={styles.badge}>{badgeMsg}</p>}

      {answered && <SavePhrase key={q.quizType + q.id} choices={phraseChoices(q)} source={contextSource(q.quizType)} />}

      {answered && (
        <div className={styles.nextRow}>
          <button className={styles.primary} onClick={next}>
            {index + 1 === questions.length ? "See results" : "Next"}
          </button>
        </div>
      )}
    </>
  )
}

function QuizPage(){
  return (
    <div className={styles.shell}>
      <Navbar/>
      <main className={styles.page}>
        <Quiz/>
      </main>
    </div>
  )
}

export default QuizPage