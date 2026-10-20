"use client"

import { useEffect, useId, useRef, useState } from "react"
import { getAuth, onAuthStateChanged } from "firebase/auth"
import { ref, get } from "firebase/database"
import Navbar from "../../components/Navbar/Navbar"
import { db } from "../../../lib/firebase"
import {
  tierStatus, dailyStatus, levelFromScore, TIERED_BADGES,
  POINTS_PER_LEVEL, POINTS_PER_CORRECT, DAILY_GOAL, DAILY_GOAL_BONUS, DAILY_QUIZ_BONUS,
} from "../../../lib/progress"
import styles from "./page.module.css"

const SKILLS = {
  phrasing: { name: "Phrasing", quizzes: "Natural Phrase" },
  context: { name: "Context", quizzes: "Natural Guess" },
  pronunciation: { name: "Pronunciation", quizzes: "Sound Guess and Tone Guess" },
  grammar: { name: "Grammar", quizzes: "Character Guess and Measure Word" },
  proverbs: { name: "Proverbs", quizzes: "Proverb Flashcards quiz and Mix and Match" },
  vocab: { name: "Vocab", quizzes: "Image Learner" },
}

const ONE_OFF = [
  { id: "first_quiz", name: "First quiz", han: "初", how: "Finish any quiz, all the way to the results screen." },
  { id: "perfect", name: "Perfect score", han: "满", how: "Get every question right on the first try in a quiz of 5 or more questions." },
  { id: "daily_quiz", name: "Quiz of the Day finisher", han: "日", how: "Finish the Quiz of the Day. You can earn it on any day, and it only counts the first time you play each day." },
  { id: "first_proverb", name: "First proverb set", han: "谚", how: "Finish a Proverb Flashcards quiz or Mix and Match set, all the way to the end." },
  { id: "proverb_perfect", name: "Proverb perfectionist", han: "全", how: "Finish a Proverb Flashcards quiz or Mix and Match set with every question right on the first try." },
  { id: "first_image", name: "First image word", han: "图", how: "Name an Image Learner picture correctly on your first try." },
  { id: "image_explorer", name: "Image explorer", han: "探", how: "Get at least one Image Learner word right on the first try in every category: Food, Animals, Places, Countries and Everyday Objects." },
  { id: "first_phrase", name: "First saved phrase", han: "存", how: "Save a phrase after a question, or add one yourself on the Saved Phrases page." },
  { id: "first_post", name: "First community post", han: "帖", how: "Post something on the Teh Talk community page." },
  { id: "daily3", name: "3 days in a row", han: "三", how: "Answer " + DAILY_GOAL + " Context Guess, Proverb or Image Learner questions a day, for 3 days in a row." },
  { id: "daily7", name: "7 days in a row", han: "七", how: "Answer " + DAILY_GOAL + " Context Guess, Proverb or Image Learner questions a day, for 7 days in a row." },
]

const TIERED_INFO = {
  streak: {
    han: "连",
    how: (n) => "Get " + n + " questions right in a row. Your best streak counts, so a wrong answer never takes a badge away.",
    value: (u) => (u.streak || {}).best,
  },
  login: {
    han: "常",
    how: (n) => "Log in on " + n + " different days. Each day counts once, however many times you visit.",
    value: (u) => (u.login || {}).days,
  },
  mastery_phrasing: {
    han: "句",
    how: (n) => "Get " + n + " correct answers in total in Natural Phrase questions.",
    value: (u) => ((u.mastery || {}).phrasing || {}).score,
  },
  mastery_context: {
    han: "境",
    how: (n) => "Get " + n + " correct answers in total in Natural Guess questions.",
    value: (u) => ((u.mastery || {}).context || {}).score,
  },
  mastery_pronunciation: {
    han: "音",
    how: (n) => "Get " + n + " correct answers in total in Sound Guess and Tone Guess questions.",
    value: (u) => ((u.mastery || {}).pronunciation || {}).score,
  },
  mastery_proverbs: {
    han: "谚",
    how: (n) => "Get " + n + " correct answers in total in Proverb Flashcards quiz and Mix and Match questions.",
    value: (u) => ((u.mastery || {}).proverbs || {}).score,
  },
  mastery_vocab: {
    han: "词",
    how: (n) => "Get " + n + " Image Learner words right on the first try in total.",
    value: (u) => ((u.mastery || {}).vocab || {}).score,
  },
  mastery_grammar: {
    han: "法",
    how: (n) => "Get " + n + " correct answers in total in Character Guess and Measure Word questions.",
    value: (u) => ((u.mastery || {}).grammar || {}).score,
  },
}

const BADGES_SHOWN_FIRST = 9

function allBadges(user){
  const owned = user.badges || {}
  const list = ONE_OFF.map((b) => ({
    id: b.id, name: b.name, han: b.han, how: b.how,
    earned: !!owned[b.id], level: 0, progress: null,
  }))
  Object.entries(TIERED_INFO).forEach(([key, info]) => {
    const t = TIERED_BADGES[key]
    const value = info.value(user) || 0
    t.levels.forEach((need, i) => {
      const id = key + "_" + (i + 1)
      const earned = !!owned[id] || value >= need
      list.push({
        id, name: t.name, han: info.han, how: info.how(need),
        earned, level: i + 1,
        progress: earned ? null : Math.min(value, need) + " / " + need,
      })
    })
  })
  return list
}

function list(levels){
  return levels.slice(0, -1).join(", ") + " and " + levels[levels.length - 1]
}

function prettyName(key){
  const spaced = key.replace(/([a-z])([A-Z])/g, "$1 $2")
  return spaced.charAt(0).toUpperCase() + spaced.slice(1)
}

function barPercent(levels, value){
  const v = value || 0
  const next = levels.find((n) => v < n)
  if (next === undefined) return 100
  const prev = [...levels].reverse().find((n) => n <= v) || 0
  return Math.round(((v - prev) / (next - prev)) * 100)
}

function Card({ title, label, help, children, className = "" }){
  const [open, setOpen] = useState(false)
  const box = useRef(null)
  const id = useId()
  useEffect(() => {
    if (!open) return
    const onDown = (e) => { if (box.current && !box.current.contains(e.target)) setOpen(false) }
    const onKey = (e) => { if (e.key === "Escape") setOpen(false) }
    document.addEventListener("mousedown", onDown)
    document.addEventListener("keydown", onKey)
    return () => {
      document.removeEventListener("mousedown", onDown)
      document.removeEventListener("keydown", onKey)
    }
  }, [open])

  return (
    <div ref={box} className={styles.card + " " + className + (open ? " " + styles.cardOpen : "")}>
      <div className={styles.cardHead}>
        <h3 className={styles.cardTitle}>{title}</h3>
        <div className={styles.headRight}>
          {label}
          <button
            type="button"
            className={styles.help}
            onClick={() => setOpen(!open)}
            aria-expanded={open}
            aria-controls={id}
            aria-label={"How to earn: " + title}
          >?</button>
        </div>
      </div>
      {open && <p id={id} role="tooltip" className={styles.helpText}>{help}</p>}
      {children}
    </div>
  )
}

function Stars({ level, max = 4 }){
  return (
    <span className={styles.stars} role="img" aria-label={"Level " + level + " of " + max}>
      {"★".repeat(level)}<span className={styles.starOff}>{"★".repeat(max - level)}</span>
    </span>
  )
}

function Bar({ percent, label }){
  return (
    <div className={styles.bar} role="progressbar" aria-valuenow={percent} aria-valuemin={0} aria-valuemax={100} aria-label={label}>
      <div className={styles.barFill} style={{ width: percent + "%" }} />
    </div>
  )
}

function Progress(){
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [showAll, setShowAll] = useState(false)

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

  if (loading) return <p className={styles.note}>Loading...</p>
  if (!user) return <p className={styles.note}>Please log in to see your progress.</p>

  const streak = user.streak || {}
  const mastery = user.mastery || {}
  const badges = user.badges || {}
  const daily = dailyStatus((user.dailyStreak || {}).contextGuess)
  const total = user.totalScore || 0
  const toNext = POINTS_PER_LEVEL - (total % POINTS_PER_LEVEL)
  const days = (user.login && user.login.days) || 0
  const scores = Object.entries(user.highScores || {})
  const badgeList = allBadges(user)
  const earnedCount = badgeList.filter((b) => b.earned).length
  const visibleBadges = showAll ? badgeList : badgeList.slice(0, BADGES_SHOWN_FIRST)

  return (
    <>
      <header className={styles.header}>
        <h1 className={styles.title}>{user.userName ? user.userName + "'s progress" : "Your progress"}</h1>
        <p className={styles.subtitle}>Tap the ? on anything to see how to earn it.</p>
      </header>

      <section className={styles.stats}>
        <Card
          title="Level"
          help={"You earn " + POINTS_PER_CORRECT + " points for each correct answer, " + DAILY_GOAL_BONUS + " for reaching your daily goal and " + DAILY_QUIZ_BONUS + " for finishing the Quiz of the Day. Every " + POINTS_PER_LEVEL + " points is a new level."}
        >
          <p className={styles.big}>{levelFromScore(total)}</p>
          <Bar percent={((total % POINTS_PER_LEVEL) / POINTS_PER_LEVEL) * 100} label="Progress to the next level" />
          <p className={styles.small}>{total} points<br />{toNext} to the next level</p>
        </Card>

        <Card
          title="Best streak"
          help="The most questions you have got right in a row. A wrong answer ends a run, but your best streak stays. It earns the Streak star badge."
        >
          <p className={styles.big}>{streak.best || 0}</p>
        </Card>

        <Card
          title="Days logged in"
          help="Counts each day you open the site while logged in, once per day. It earns the Regular visitor badge."
        >
          <p className={styles.big}>{days}</p>
        </Card>

        <Card
          title="Daily goal streak"
          help={"Answer " + DAILY_GOAL + " Context Guess, Proverb or Image Learner questions in a day to keep your daily streak going. Miss a day and your current streak starts again, but your highest goal streak is kept. 3 and 7 days in a row earn badges."}
        >
          <p className={styles.big}>{daily.current}<span className={styles.unit}> {daily.current === 1 ? "day" : "days"}</span></p>
          <p className={styles.small + " " + styles.bottom}>Highest goal: {daily.best} {daily.best === 1 ? "day" : "days"}</p>
        </Card>
      </section>

      <h2 className={styles.section}>Skills</h2>
      <section className={styles.skills}>
        {Object.entries(SKILLS).map(([id, s]) => {
          const score = (mastery[id] && mastery[id].score) || 0
          const key = "mastery_" + id
          const levels = TIERED_BADGES[key].levels
          const t = tierStatus(key, score)
          return (
            <Card
              key={id}
              title={s.name}
              label={<span className={t.level ? styles.levelOn : styles.levelOff}><Stars level={t.level} /></span>}
              help={"Answer " + s.quizzes + " questions correctly. Each correct answer is 1 point. Reach " + list(levels) + " points for levels 1, 2, 3 and 4 (shown as stars)."}
            >
              <p className={styles.big}>{score}<span className={styles.unit}> points</span></p>
              <Bar percent={barPercent(levels, score)} label={s.name + " progress"} />
              <p className={styles.small}>{t.next ? t.next - score + " more for the next level" : "Top level reached"}</p>
            </Card>
          )
        })}
      </section>

      <div className={styles.sectionRow}>
        <h2 className={styles.sectionInline}>Badges</h2>
        <span className={styles.levelOn}>{earnedCount} of {badgeList.length} earned</span>
      </div>
      <section className={styles.badges}>
        {visibleBadges.map((b) => (
          <Card
            key={b.id}
            title={b.name}
            label={<span className={b.earned ? styles.levelOn : styles.levelOff}>{b.level ? <Stars level={b.level} /> : (b.earned ? "Earned" : "Locked")}</span>}
            help={b.how}
            className={b.earned ? "" : styles.locked}
          >
            <div className={styles.badgeRow}>
              <span className={b.earned ? styles.tile : styles.tileOff} aria-hidden="true">{b.han}</span>
              <p className={styles.badgeHow}>
                {b.earned ? "You have earned this badge." : b.progress ? "Progress: " + b.progress : "Not earned yet. Tap the ? to see how."}
              </p>
            </div>
          </Card>
        ))}
      </section>
      {badgeList.length > BADGES_SHOWN_FIRST && (
        <div className={styles.moreRow}>
          <button type="button" className={styles.more} onClick={() => setShowAll(!showAll)} aria-expanded={showAll}>
            {showAll ? "Show fewer badges" : "Show more badges (" + (badgeList.length - BADGES_SHOWN_FIRST) + " more)"}
          </button>
        </div>
      )}

      <h2 className={styles.section}>High scores</h2>
      {scores.length === 0 ? (
        <p className={styles.empty}>No high scores yet. Finish a quiz to set one.</p>
      ) : (
        <ul className={styles.scores}>
          {scores.map(([feature, score]) => (
            <li key={feature} className={styles.score}>
              <span>{prettyName(feature)}</span>
              <strong>{score}</strong>
            </li>
          ))}
        </ul>
      )}
    </>
  )
}

function ProgressPage(){
  return (
    <div className={styles.shell}>
      <Navbar/>
      <main className={styles.page}>
        <Progress/>
      </main>
    </div>
  )
}

export default ProgressPage