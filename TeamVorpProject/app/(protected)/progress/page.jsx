"use client"

import { useEffect, useState } from "react"
import { getAuth, onAuthStateChanged } from "firebase/auth"
import { ref, get } from "firebase/database"
import Navbar from "../../components/Navbar/Navbar"
import { db } from "../../../lib/firebase"
import { BADGE_NAMES, tierStatus, dailyStatus, levelFromScore, POINTS_PER_LEVEL } from "../../../lib/progress"

const SKILL_NAMES = {
  phrasing: "Phrasing",
  context: "Context",
  pronunciation: "Pronunciation",
  grammar: "Grammar",
}

function levelText(key, value){
  const t = tierStatus(key, value)
  return t.levelName + (t.next ? " (next level at " + t.next + ")" : " (top level)")
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
  const daily = dailyStatus((user.dailyStreak || {}).contextGuess)

  return (
    <>
      <h1>{user.userName ? user.userName + "'s progress" : "Your progress"}</h1>

      <h2>Level</h2>
      <p>Level {levelFromScore(user.totalScore)} · {user.totalScore || 0} points</p>
      <p>{POINTS_PER_LEVEL - ((user.totalScore || 0) % POINTS_PER_LEVEL)} points to the next level</p>

      <h2>Streak</h2>
      <p>Current: {streak.current || 0}</p>
      <p>Best: {streak.best || 0} · {levelText("streak", streak.best)}</p>

      <h2>Days logged in</h2>
      <p>{(user.login && user.login.days) || 0} day(s) · {levelText("login", user.login && user.login.days)}</p>

      <h2>Daily streak (Context Guess)</h2>
      <p>Current: {daily.current} day(s)</p>
      <p>Best: {daily.best} day(s)</p>
      <p>{daily.doneToday ? "Today's goal done!" : "Today: " + daily.todayCount + " / " + daily.goal + " questions"}</p>

      <h2>Skills</h2>
      <ul>
        {Object.entries(SKILL_NAMES).map(([id, name]) => {
          const score = (mastery[id] && mastery[id].score) || 0
          return (
            <li key={id}>
              {name}: {score} points · {levelText("mastery_" + id, score)}
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