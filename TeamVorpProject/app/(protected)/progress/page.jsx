"use client"

import { useEffect, useState } from "react"
import { getAuth, onAuthStateChanged } from "firebase/auth"
import { ref, get } from "firebase/database"
import Navbar from "../../components/Navbar/Navbar"
import { db } from "../../../lib/firebase"
import { BADGE_NAMES, MASTERY_SCORE } from "../../../lib/progress"

const SKILL_NAMES = {
  phrasing: "Phrasing",
  context: "Context",
  pronunciation: "Pronunciation",
  grammar: "Grammar",
}

function Progress(){
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const stop = onAuthStateChanged(getAuth(), async (authUser) => {
      if (!authUser) {
        setLoading(false)
        return
      }
      try {
        const snap = await get(ref(db, `users/${authUser.uid}`))
        setUser(snap.val() || {})
      } catch (e) {
        setUser({})
      }
      setLoading(false)
    })
    return () => stop()
  }, [])

  if (loading) return <p>Loading...</p>
  if (!user) return <p>Please log in to see your progress.</p>

  const streak = user.streak || {}
  const mastery = user.mastery || {}
  const badges = user.badges || {}

  return (
    <>
      <h1>{user.userName ? user.userName + "'s progress" : "Your progress"}</h1>

      <h2>Streak</h2>
      <p>Current: {streak.current || 0}</p>
      <p>Best: {streak.best || 0}</p>

      <h2>Skills</h2>
      <ul>
        {Object.entries(SKILL_NAMES).map(([id, name]) => {
          const score = (mastery[id] && mastery[id].score) || 0
          const mastered = score >= MASTERY_SCORE
          return (
            <li key={id}>
              {name}: {Math.min(score, MASTERY_SCORE)} / {MASTERY_SCORE}
              {mastered ? " (mastered)" : ""}
            </li>
          )
        })}
      </ul>

      <h2>Badges</h2>
      <ul>
        {Object.entries(BADGE_NAMES).map(([id, name]) => (
          <li key={id}>
            {badges[id] ? "Earned: " : "Locked: "}{name}
          </li>
        ))}
      </ul>

      <h2>High scores</h2>
      <ul>
        {Object.entries(user.highScores || {}).map(([feature, score]) => (
          <li key={feature}>{feature}: {score}</li>
        ))}
      </ul>
    </>
  )
}

function ProgressPage(){
  return (
    <>
      <Navbar/>
      <Progress/>
    </>
  )
}

export default ProgressPage