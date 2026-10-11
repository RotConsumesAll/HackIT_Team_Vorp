"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import Link from "next/link"
import Navbar from "../../../components/Navbar/Navbar"
import { getQuestions, getMixedQuestions } from "../../../../lib/questions"
import { recordAnswer, recordHighScore, currentUid, BADGE_NAMES } from "../../../../lib/progress"

const ALL_TYPES = ["naturalPhrase", "naturalGuess", "sound", "character", "tone", "measure"]

const TITLES = {
  naturalPhrase: "Natural Phrase",
  naturalGuess: "Natural Guess",
  sound: "Sound Guess",
  character: "Character Guess",
  tone: "Tone Guess",
  measure: "Measure Word",
  mix: "Mix it up",
}

function shuffle(list){
  const a = [...list]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
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
  const [badgeMsg, setBadgeMsg] = useState("")

  useEffect(() => {
    async function load(){
      try {
        const list = type === "mix" ? await getMixedQuestions(ALL_TYPES) : await getQuestions(type)
        setQuestions(shuffle(list).map((q) => ({ ...q, options: shuffle(q.options) })))
      } catch (e) {
        setError("Could not load questions. Check your connection and the database rules.")
        setQuestions([])
      }
    }
    load()
  }, [type])

  useEffect(() => {
    if (questions && questions.length > 0 && index >= questions.length) {
      recordHighScore(currentUid(), "quiz_" + type, score)
    }
  }, [index])

  if (questions === null) return <p>Loading...</p>
  if (error) return <p>{error}</p>
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
    const result = await recordAnswer(currentUid(), q.quizType, correct)
    if (!result) return
    setStreak(result.streak)
    if (result.newBadges.length > 0) {
      setBadgeMsg("New badge: " + result.newBadges.map((b) => BADGE_NAMES[b] || b).join(", "))
    }
  }

  function choose(option){
    if (answered || wrongKeys.includes(option.key)) return
    if (option.isCorrect) {
      setCorrectKey(option.key)
      setLastWrong(null)
      if (firstTry) { setScore((s) => s + 1); track(true) }
    } else {
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