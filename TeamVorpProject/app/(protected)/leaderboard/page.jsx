"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { getAuth, onAuthStateChanged } from "firebase/auth"
import { ref, get } from "firebase/database"
import Navbar from "../../components/Navbar/Navbar"
import ShareButton from "../../components/ShareButton/ShareButton"
import { db } from "../../../lib/firebase"
import { levelFromScore, todayString, POINTS_PER_LEVEL } from "../../../lib/progress"
import styles from "./page.module.css"

const TOP = 10

function Row({ uid, rank, name, isMe, level, value, sub }){
  return (
    <li className={styles.row + (isMe ? " " + styles.me : "")} aria-current={isMe ? "true" : undefined}>
      <span className={styles.rank} data-top={rank <= 3 ? rank : undefined}>{rank}</span>
      <span className={styles.name}>
        {uid ? <Link href={"/profile/" + uid} className={styles.nameLink}>{name}</Link> : name}
        {isMe && <span className={styles.you}>You</span>}
      </span>
      {level && <span className={styles.level}>Level {level}</span>}
      <span className={styles.value}>
        {value}
        {sub && <small>{sub}</small>}
      </span>
    </li>
  )
}

function Leaderboard(){
  const [rows, setRows] = useState(null)
  const [todayRows, setTodayRows] = useState([])
  const [myUid, setMyUid] = useState(null)
  const [error, setError] = useState("")
  const [hiddenMe, setHiddenMe] = useState(false)

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
          visible: !(u.settings && u.settings.showOnLeaderboard === false),
          showLevel: !(u.settings && u.settings.showLevel === false),
        }))
        list.sort((a, b) => b.score - a.score)
        setHiddenMe(list.some((r) => r.uid === authUser.uid && !r.visible))
        setRows(list.filter((r) => r.visible))

        // Today's Quiz of the Day, best score first
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

  if (rows === null) return <p className={styles.note}>Loading...</p>
  if (error) return <p className={styles.note}>{error}</p>
  if (!myUid) return <p className={styles.note}>Please log in to see the leaderboard.</p>

  const top = rows.slice(0, TOP)
  const myIndex = rows.findIndex((r) => r.uid === myUid)
  const me = myIndex >= 0 ? rows[myIndex] : null

  // Motivation: how far to the next level, and who is just ahead
  const myLevel = me ? levelFromScore(me.score) : 1
  const intoLevel = me ? me.score % POINTS_PER_LEVEL : 0
  const toNextLevel = POINTS_PER_LEVEL - intoLevel
  const ahead = me && myIndex > 0 ? rows[myIndex - 1] : null
  const gap = ahead ? ahead.score - me.score + 1 : 0

  let nudge = ""
  if (me) {
    if (myIndex === 0) nudge = "You're in first place. Keep going to stay ahead!"
    else if (me.score === 0) nudge = "Answer your first question to get on the board."
    else nudge = gap + " more point" + (gap === 1 ? "" : "s") + " to pass " + ahead.name + "."
  }

  const myToday = todayRows.findIndex((r) => r.uid === myUid)
  const showMeBelow = me && myIndex >= TOP

  return (
    <>
      <header className={styles.header}>
        <h1 className={styles.title}>Leaderboard</h1>
        <p className={styles.subtitle}>Earn points from every quiz question. Climb the ranks.</p>
      </header>

      {hiddenMe && (
        <section className={styles.hero} aria-label="Leaderboard visibility">
          <div className={styles.heroBody}>
            <p className={styles.heroLine}><strong>You are hidden from the leaderboard.</strong></p>
            <p className={styles.heroSmall}>Other learners can't see you. You can turn this back on in your profile.</p>
          </div>
          <div className={styles.heroShare}>
            <Link href="/profile" className={styles.profileLink}>Open profile settings</Link>
          </div>
        </section>
      )}

      {me && (
        <section className={styles.hero} aria-label="Your rank">
          <div className={styles.heroRank}>
            <span className={styles.heroLabel}>Your rank</span>
            <span className={styles.heroNum}>#{myIndex + 1}</span>
            <span className={styles.heroOf}>of {rows.length}</span>
          </div>
          <div className={styles.heroBody}>
            <p className={styles.heroLine}><strong>{me.score}</strong> points · Level {myLevel}</p>
            <div className={styles.meter} role="progressbar" aria-valuemin={0} aria-valuemax={POINTS_PER_LEVEL} aria-valuenow={intoLevel} aria-label={"Progress to Level " + (myLevel + 1)}>
              <div className={styles.meterFill} style={{ width: intoLevel + "%" }} />
            </div>
            <p className={styles.heroSmall}>{toNextLevel} points to Level {myLevel + 1}</p>
            <p className={styles.nudge}>{nudge}</p>
          </div>
          <div className={styles.heroShare}>
            <ShareButton
              label="Share my rank"
              text={"I'm #" + (myIndex + 1) + " on the Mother Tongue leaderboard with " + me.score + " points!"}
            />
          </div>
        </section>
      )}

      <div className={styles.columns}>
        <section className={styles.panel} aria-labelledby="overall">
          <h2 id="overall" className={styles.panelTitle}>Overall</h2>
          {rows.length === 0 && <p className={styles.empty}>No players yet.</p>}
          <ol className={styles.list}>
            {top.map((r, i) => (
              <Row key={r.uid} uid={r.uid} rank={i + 1} name={r.name} isMe={r.uid === myUid} level={r.showLevel || r.uid === myUid ? levelFromScore(r.score) : null} value={r.score} sub=" pts" />
            ))}
          </ol>
          {showMeBelow && (
            <>
              <p className={styles.gap} aria-hidden="true">· · ·</p>
              <ol className={styles.list} start={myIndex + 1}>
                <Row uid={me.uid} rank={myIndex + 1} name={me.name} isMe level={myLevel} value={me.score} sub=" pts" />
              </ol>
            </>
          )}
        </section>

        <section className={styles.panel} aria-labelledby="daily">
          <h2 id="daily" className={styles.panelTitle}>Quiz of the Day <span className={styles.tag}>Today</span></h2>
          {todayRows.length === 0 && <p className={styles.empty}>Nobody has played today's quiz yet. Be the first!</p>}
          <ol className={styles.list}>
            {todayRows.slice(0, TOP).map((r, i) => (
              <Row key={r.uid} uid={r.uid} rank={i + 1} name={r.name} isMe={r.uid === myUid} value={r.score + " / " + r.total} />
            ))}
          </ol>
          {myToday === -1 && todayRows.length > 0 && <p className={styles.empty}>You haven't played yet today.</p>}
        </section>
      </div>
    </>
  )
}

function LeaderboardPage(){
  return (
    <div className={styles.shell}>
      <Navbar/>
      <main className={styles.page}>
        <Leaderboard/>
      </main>
    </div>
  )
}

export default LeaderboardPage