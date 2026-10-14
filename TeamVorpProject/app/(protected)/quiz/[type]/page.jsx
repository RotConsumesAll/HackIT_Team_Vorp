"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import Link from "next/link"
import Navbar from "../../../components/Navbar/Navbar"
import ShareButton from "../../../components/ShareButton/ShareButton"
import { getQuestions, getMixedQuestions } from "../../../../lib/questions"
import { recordAnswer, recordDaily, recordHighScore, recordDailyQuiz, getDailyQuizResult, todayString, DAILY_QUIZ_COUNT, currentUid, BADGE_NAMES } from "../../../../lib/progress"

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
          list = shuffle(await getMixedQuestions(ALL_TYPES))
        } else {
          list = shuffle(await getQuestions(type))
        }
        setQuestions(list.map((q) => ({ ...q, options: shuffle(q.options) })))
      } catch (e) {
        setError("Could not load questions. Check your connection and the database rules.")
        setQuestions([])
      }
    }
    load()
  }, [type])

  useEffect(() => {
    if (questions && questions.length > 0 && index >= questions.length) {
      if (type === "daily") {
        recordDailyQuiz(currentUid(), score, questions.length)
      } else {
        recordHighScore(currentUid(), "quiz_" + type, score)
      }
    }
  }, [index])

  if (questions === null) return <p>Loading...</p>
  if (error) return <p>{error}</p>
  if (playedToday) {
    return (
      <>
        <h1>Quiz of the Day</h1>
        <p>You already played today. You got {playedToday.score} / {playedToday.total}.</p>
        <p>Come back tomorrow for a new set of questions!</p>
        <Link href="/leaderboard">See today's ranking</Link>
      </>
    )
  }
  if (questions.length === 0) {
    return (
      <>
        <p>No questions found for this quiz yet.</p>
        <Link href="/contextguess">Back</Link>
      </>
    )
  }

  if (index >= questions.length) {
    return (
      <>
        <h1>Nice one!</h1>
        <p>{score} / {questions.length} right on the first try</p>
        <ShareButton text={"I got " + score + " / " + questions.length + " on " + (TITLES[type] || "a quiz") + " in the Mother Tongue app!"} />
        <button onClick={() => window.location.reload()}>Play again</button>
        <p><Link href="/contextguess">Pick another quiz</Link></p>
      </>
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

  function skipTyped(){
    if (firstTry) track(false)
    setSkipped(true)
    setCorrectKey("typed")
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

  return (
    <>
      <p><Link href="/contextguess">Back</Link></p>
      <p>{TITLES[type] || "Quiz"} · {index + 1} / {questions.length}</p>
      <p>Streak: {streak}</p>
      {daily && <p>Daily streak: {daily.current} day(s) · Today: {Math.min(daily.todayCount, daily.goal)} / {daily.goal}</p>}

      {q.target && <p>How do you say <strong>{q.target}</strong> here?</p>}
      <h2>{typed ? "一 ___ " + q.prompt : q.prompt}</h2>
      {typed && q.gloss && <p>({q.gloss})</p>}
      {!typed && q.context && <p>({q.context})</p>}

      {typed && (
        <form onSubmit={checkTyped}>
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type the measure word"
            disabled={answered}
          />
          <button type="submit" disabled={answered}>Check</button>
          <button type="button" onClick={skipTyped} disabled={answered}>Skip</button>
        </form>
      )}
      {typed && message && <p>{message}</p>}

      <ul>
        {q.options.map((o) => (
          <li key={o.key}>
            <button onClick={() => choose(o)} disabled={answered || wrongKeys.includes(o.key)}>
              {o.text}
            </button>
          </li>
        ))}
      </ul>

      {lastWrong && <p><strong>Not quite.</strong> {lastWrong.reason} Try another one.</p>}

      {answered && !skipped && <p><strong>Correct!</strong> {correctOption ? correctOption.reason + ". " : ""}{q.explanation}</p>}
      {answered && skipped && <p>The answer is <strong>{q.answerText}</strong>: 一{q.answerText}{q.prompt}. {q.explanation}</p>}

      {badgeMsg && <p><strong>{badgeMsg}</strong></p>}

      {answered && (
        <button onClick={next}>
          {index + 1 === questions.length ? "See results" : "Next"}
        </button>
      )}
    </>
  )
}

function QuizPage(){
  return (
    <>
      <Navbar/>
      <Quiz/>
    </>
  )
}

export default QuizPage