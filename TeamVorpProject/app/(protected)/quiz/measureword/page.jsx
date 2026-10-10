"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import Navbar from "../../../components/Navbar/Navbar"
import { getQuestions } from "../../../../lib/questions"

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

  useEffect(() => {
    async function load(){
      try {
        const list = await getQuestions("measure")
        setQuestions(shuffle(list))
      } catch (e) {
        setError("Could not load questions. Check your connection and the database rules.")
        setQuestions([])
      }
    }
    load()
  }, [])

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

  function check(e){
    e.preventDefault()
    const answer = input.trim()
    if (!answer || done) return
    if (answer === q.answerText) {
      setDone(true)
      setMessage("")
      if (firstTry) setScore((s) => s + 1)
    } else {
      setFirstTry(false)
      
      const specific = q.wrongAnswers && q.wrongAnswers[answer]
      setMessage(specific || "Not quite. Think about what kind of thing it is and try again.")
      setInput("")
    }
  }

  function skip(){
    setSkipped(true)
    setDone(true)
    setFirstTry(false)
    setMessage("")
  }

  function next(){
    setIndex((i) => i + 1)
    setInput("")
    setMessage("")
    setDone(false)
    setSkipped(false)
    setFirstTry(true)
  }

  return (
    <>
      <p><Link href="/contextguess">Back</Link></p>
      <p>Measure Word · {index + 1} / {questions.length}</p>

      <h2>一 ___ {q.prompt}</h2>
      {q.gloss && <p>({q.gloss})</p>}

      <form onSubmit={check}>
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type the measure word"
          disabled={done}
        />
        <button type="submit" disabled={done}>Check</button>
        <button type="button" onClick={skip} disabled={done}>Skip</button>
      </form>

      {message && <p>{message}</p>}

      {done && !skipped && <p><strong>Correct!</strong> 一{q.answerText}{q.prompt}. {q.explanation}</p>}
      {done && skipped && <p>The answer is <strong>{q.answerText}</strong>: 一{q.answerText}{q.prompt}. {q.explanation}</p>}

      {done && (
        <button onClick={next}>
          {index + 1 === questions.length ? "See results" : "Next"}
        </button>
      )}
    </>
  )
}

function MeasureWordPage(){
  return (
    <>
      <Navbar/>
      <MeasureWord/>
    </>
  )
}

export default MeasureWordPage