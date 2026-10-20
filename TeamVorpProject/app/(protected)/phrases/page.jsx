"use client"

import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import Navbar from "../../components/Navbar/Navbar"
import { useUid } from "../../../lib/useuid"
import { getSavedPhrases, addSavedPhrase, deleteSavedPhrase } from "../../../lib/phrases"
import { toPinyin } from "../../../lib/pinyin"
import { BADGE_NAMES } from "../../../lib/progress"
import styles from "./page.module.css"

const useIsoLayoutEffect = typeof window !== "undefined" ? useLayoutEffect : useEffect

const FIT_STEPS = [1, 0.9, 0.8, 0.7, 0.6, 0.52, 0.45]

function PinyinText({ chinese, pinyin }){
  const box = useRef(null)

  useIsoLayoutEffect(() => {
    const el = box.current
    if (!el) return
    const fit = () => {
      for (const s of FIT_STEPS) {
        el.style.setProperty("--s", s)
        if (el.scrollHeight <= el.clientHeight + 1) break
      }
    }
    fit()
    if (typeof ResizeObserver === "undefined") return
    const watch = new ResizeObserver(fit) 
    watch.observe(el)
    return () => watch.disconnect()
  }, [chinese, pinyin])

  const syllables = (pinyin || "").trim().split(/\s+/).filter(Boolean)
  const chars = Array.from(chinese || "")
  const isHan = (c) => /\p{Script=Han}/u.test(c)
  const hanCount = chars.filter(isHan).length

  if (!syllables.length || syllables.length !== hanCount) {
    return (
      <div ref={box} className={styles.phrase}>
        <h3 className={styles.han}>{chinese}</h3>
        {pinyin && <span className={styles.pinyinLine}>{pinyin}</span>}
      </div>
    )
  }

  let i = 0
  return (
    <div ref={box} className={styles.phrase}>
      <h3 className={styles.ruby} aria-label={chinese + " (" + pinyin + ")"}>
        {chars.map((c, k) => (
          <span key={k} className={styles.pair} aria-hidden="true">
            <span className={styles.han}>{c}</span>
            <span className={styles.py}>{isHan(c) ? syllables[i++] : "\u00a0"}</span>
          </span>
        ))}
      </h3>
    </div>
  )
}

function Phrases(){
  const router = useRouter()
  const { uid, ready } = useUid()
  const [phrases, setPhrases] = useState(null)
  const [chinese, setChinese] = useState("")
  const [pinyin, setPinyin] = useState("")
  const [meaning, setMeaning] = useState("")
  const [message, setMessage] = useState("")
  const [query, setQuery] = useState("")
  const [confirmId, setConfirmId] = useState(null)

  async function load(){
    try {
      setPhrases(await getSavedPhrases(uid))
    } catch (e) {
      setMessage("Could not load your phrases.")
      setPhrases([])
    }
  }

  useEffect(() => {
    if (uid) load()
  }, [uid])


  useEffect(() => {
    if (!message) return
    const t = setTimeout(() => setMessage(""), 5000)
    return () => clearTimeout(t)
  }, [message])


  const pinyinHint = useMemo(() => (chinese.trim() ? toPinyin(chinese.trim()) : ""), [chinese])

  const shown = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q || !phrases) return phrases || []
    return phrases.filter((p) => [p.chinese, p.pinyin, p.meaning].some((v) => (v || "").toLowerCase().includes(q)))
  }, [phrases, query])

  async function handleAdd(e){
    e.preventDefault()
    if (!chinese.trim() || !meaning.trim()) {
      setMessage("Please fill in the Chinese and the meaning.")
      return
    }
    try {
      const result = await addSavedPhrase(uid, { chinese: chinese.trim(), pinyin: pinyin.trim() || toPinyin(chinese.trim()), meaning: meaning.trim(), source: "Added by you" })
      if (result.duplicate) {
        setMessage("You have already saved " + chinese.trim() + ".")
        return
      }
      setChinese("")
      setPinyin("")
      setMeaning("")
      setMessage("Saved!" + (result.newBadges.length ? " New badge: " + result.newBadges.map((b) => BADGE_NAMES[b] || b).join(", ") : ""))
      load()
    } catch (err) {
      setMessage("Could not save the phrase.")
    }
  }

  async function handleDelete(id){
    try {
      await deleteSavedPhrase(uid, id)
      setConfirmId(null)
      load()
    } catch (err) {
      setMessage("Could not delete the phrase.")
    }
  }

   function handleShare(p){
    const params = new URLSearchParams({
      chinese: p.chinese || "",
      pinyin: p.pinyin || "",
      meaning: p.meaning || "",
    })
    router.push("/community?" + params.toString())
  }

  if (!ready) return <p className={styles.note}>Loading...</p>
  if (!uid) return <p className={styles.note}>Please log in to see your saved phrases.</p>

  const good = message.startsWith("Saved")
  const count = phrases ? phrases.length : 0

  return (
    <>
      <header className={styles.header}>
        <h1 className={styles.title}>My Saved Phrases</h1>
        <p className={styles.subtitle}>Phrases you save from the website features show up here. You can also add your own.</p>
      </header>

      <form className={styles.form} onSubmit={handleAdd}>
        <div className={styles.fields}>
          <label className={styles.field}>
            <span>Chinese</span>
            <input className={styles.input} value={chinese} onChange={(e) => setChinese(e.target.value)} placeholder="e.g. 打包" />
          </label>
          <label className={styles.field}>
            <span>Pinyin <em>(optional)</em></span>
            <input className={styles.input} value={pinyin} onChange={(e) => setPinyin(e.target.value)} placeholder={pinyinHint || "Filled in for you"} />
          </label>
          <label className={styles.field}>
            <span>Meaning</span>
            <input className={styles.input} value={meaning} onChange={(e) => setMeaning(e.target.value)} placeholder="e.g. take away" />
          </label>
          <button className={styles.save} type="submit" disabled={!chinese.trim() || !meaning.trim()}>Add phrase</button>
        </div>
        {message && <p className={good ? styles.good : styles.bad} role="status">{message}</p>}
      </form>

      <div className={styles.listHead}>
        <h2 className={styles.listTitle}>
          Saved <span className={styles.count}>{query.trim() ? shown.length + " of " + count : count}</span>
        </h2>
        {count > 0 && (
          <label className={styles.search}>
            <svg viewBox="0 0 20 20" width="18" height="18" aria-hidden="true"><circle cx="9" cy="9" r="6" fill="none" stroke="currentColor" strokeWidth="2"/><path d="M14 14l4 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
            <input
              className={styles.searchInput}
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search phrases"
              aria-label="Search saved phrases"
            />
          </label>
        )}
      </div>

      {phrases === null && <p className={styles.note}>Loading your phrases...</p>}
      {phrases && phrases.length === 0 && (
        <div className={styles.empty}>
          <span className={styles.emptyHan} aria-hidden="true">空</span>
          <strong>No saved phrases yet</strong>
          <p>Save one after a quiz question, or add your own above.</p>
        </div>
      )}
      {phrases && phrases.length > 0 && shown.length === 0 && (
        <p className={styles.note}>No phrases match &ldquo;{query}&rdquo;.</p>
      )}

      <ul className={styles.list}>
        {shown.map((p) => (
          <li key={p.id} className={styles.item}>
            <button className={styles.trash} onClick={() => setConfirmId(p.id)} aria-label={"Delete " + p.chinese} title="Delete">
              <svg viewBox="0 0 20 20" width="18" height="18" aria-hidden="true"><path d="M4 6h12M8 6V4h4v2M6 6l1 10h6l1-10" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>
            </button>

            <PinyinText chinese={p.chinese} pinyin={p.pinyin} />
            <p className={styles.meaning} title={p.meaning}>{p.meaning}</p>

            <div className={styles.foot}>
              {p.source && confirmId !== p.id && <span className={styles.source} title={"Saved from " + p.source}>{p.source}</span>}
              {confirmId === p.id ? (
                <div className={styles.confirm}>
                  <span>Delete this phrase?</span>
                  <button className={styles.yes} onClick={() => handleDelete(p.id)}>Delete</button>
                  <button className={styles.no} onClick={() => setConfirmId(null)}>Keep</button>
                </div>
              ) : (
                <button className={styles.share} onClick={() => handleShare(p)}>Share to community <span aria-hidden="true">→</span></button>
              )}
            </div>
          </li>
        ))}
      </ul>
    </>
  )
}

function PhrasesPage(){
  return (
    <div className={styles.shell}>
      <Navbar/>
      <main className={styles.page}>
        <Phrases/>
      </main>
    </div>
  )
}

export default PhrasesPage