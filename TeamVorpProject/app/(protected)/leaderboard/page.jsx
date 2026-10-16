"use client"

import { useEffect, useState } from "react"
import { getAuth, onAuthStateChanged } from "firebase/auth"
import { ref, get } from "firebase/database"
import Navbar from "../../components/Navbar/Navbar"
import ShareButton from "../../components/ShareButton/ShareButton"
import { db } from "../../../lib/firebase"
import { levelFromScore, todayString } from "../../../lib/progress"

const TOP = 10

function Leaderboard(){
  const [rows, setRows] = useState(null)
  const [todayRows, setTodayRows] = useState([])
  const [myUid, setMyUid] = useState(null)
  const [error, setError] = useState("")

  useEffect(() => {
    const stop = onAuthStateChanged(getAuth(), async (authUser) => {
      setMyUid(authUser ? authUser.uid : null)
      if (!authUser) {
        setRows([])
        return
      }
      try {
        const snap = await get(ref(db, "users"))
        const users = snap.val() || {}
        const list = Object.entries(users).map(([uid, u]) => ({
          uid,
          name: u.userName || "Player",
          score: u.totalScore || 0,
        }))
        list.sort((a, b) => b.score - a.score)
        setRows(list)

        const today = todayString()
        const todayList = Object.entries(users)
          .filter(([, u]) => u.dailyQuiz && u.dailyQuiz.date === today)
          .map(([uid, u]) => ({
            uid,
            name: u.userName || "Player",
            score: u.dailyQuiz.score,
            total: u.dailyQuiz.total,
          }))
        todayList.sort((a, b) => b.score - a.score)
        setTodayRows(todayList)
      } catch (e) {
        setError("Could not load the leaderboard.")
        setRows([])
      }
    })
    return () => stop()
  }, [])

  if (rows === null) return <p>Loading...</p>
  if (error) return <p>{error}</p>
  if (!myUid) return <p>Please log in to see the leaderboard.</p>

  const top = rows.slice(0, TOP)
  const myIndex = rows.findIndex((r) => r.uid === myUid)
  const me = myIndex >= 0 ? rows[myIndex] : null

  return (
    <>
      <h1>Leaderboard</h1>

      {rows.length === 0 && <p>No players yet.</p>}

      <ol>
        {top.map((r) => (
          <li key={r.uid}>
            {r.name}{r.uid === myUid ? " (you)" : ""} · Level {levelFromScore(r.score)} · {r.score} points
          </li>
        ))}
      </ol>

      <h2>Quiz of the Day (today)</h2>
      {todayRows.length === 0 && <p>Nobody has played today's quiz yet. Be the first!</p>}
      <ol>
        {todayRows.slice(0, TOP).map((r) => (
          <li key={r.uid}>
            {r.name}{r.uid === myUid ? " (you)" : ""} · {r.score} / {r.total}
          </li>
        ))}
      </ol>

      {me && myIndex >= TOP && (
        <p>Your rank: #{myIndex + 1} · {me.score} points</p>
      )}

      {me && (
        <ShareButton
          label="Share my rank"
          text={"I'm #" + (myIndex + 1) + " on the Mother Tongue leaderboard with " + me.score + " points!"}
        />
      )}
    </>
  )
}

function LeaderboardPage(){
  return (
    <>
      <Navbar/>
      <Leaderboard/>
    </>
  )
}

export default LeaderboardPage