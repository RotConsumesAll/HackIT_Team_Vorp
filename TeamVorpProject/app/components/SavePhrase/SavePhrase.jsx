"use client"

import { useState } from "react"
import { useUid } from "../../../lib/useuid"
import { addSavedPhrase, getSavedPhrases, normalizePhrase } from "../../../lib/phrases"
import { BADGE_NAMES } from "../../../lib/progress"
import { toPinyin } from "../../../lib/pinyin"
import styles from "./SavePhrase.module.css"

function SavePhrase({ choices, source = "", align = "left" }){
  const { uid } = useUid()
  const [open, setOpen] = useState(false)
  const [selected, setSelected] = useState([])
  const [custom, setCustom] = useState("")
  const [customMeaning, setCustomMeaning] = useState("")
  const [message, setMessage] = useState("")
  const [savedKeys, setSavedKeys] = useState([]) 

  if (!uid || choices.length === 0) return null

  async function handleOpen(){
    const next = !open
    setOpen(next)
    if (next) {
      try {
        const saved = await getSavedPhrases(uid)
        setSavedKeys(saved.map((p) => normalizePhrase(p.chinese)))
      } catch (e) {
        setSavedKeys([])
      }
    }
  }

  const isSaved = (chinese) => savedKeys.includes(normalizePhrase(chinese))

  function toggle(index){
    setSelected((s) => (s.includes(index) ? s.filter((i) => i !== index) : [...s, index]))
  }

  async function handleSave(){
    const toSave = selected.map((i) => ({ ...choices[i], source }))

    if (custom.trim()) {
      if (!customMeaning.trim()) {
        setMessage("Please add the meaning of your own phrase.")
        return
      }
      // Pinyin is worked out automatically for a phrase the user typed
      toSave.push({
        chinese: custom.trim(),
        pinyin: toPinyin(custom.trim()),
        meaning: customMeaning.trim(),
        source,
      })
    }

    if (toSave.length === 0) {
      setMessage("Pick at least one phrase, or type your own.")
      return
    }

    try {
      const earned = []
      const savedNow = []
      const already = []
      for (const phrase of toSave) {
        const result = await addSavedPhrase(uid, phrase)
        if (result.duplicate) {
          already.push(phrase.chinese)
        } else {
          savedNow.push(phrase.chinese)
          earned.push(...result.newBadges)
        }
      }
      const parts = []
      if (savedNow.length) parts.push("Saved to My Phrases!")
      if (already.length) parts.push("Already saved: " + already.join(", "))
      if (earned.length) parts.push("New badge: " + earned.map((b) => BADGE_NAMES[b] || b).join(", "))
      setMessage(parts.join(" "))
      setSavedKeys((k) => [...k, ...toSave.map((p) => normalizePhrase(p.chinese))])
      setSelected([])
      setCustom("")
      setCustomMeaning("")
    } catch (e) {
      setMessage("Could not save. Please try again.")
    }
  }

  return (
    <div className={styles.wrap}>
      <div className={align === "center" ? styles.toggleCenter : undefined}>
        <button type="button" className={styles.toggle} onClick={handleOpen} aria-expanded={open}>
          {open ? "Close" : "+ Save a phrase"}
        </button>
      </div>

      {open && (
        <div className={styles.panel}>
          <p className={styles.heading}>Which phrase do you want to save?</p>
          <ul className={styles.list}>
            {choices.map((c, i) => (
              <li key={i}>
                {isSaved(c.chinese) ? (
                  <div className={styles.row + " " + styles.rowSaved}>
                    <span className={styles.han}>{c.chinese}</span>
                    <span className={styles.info}>
                      {c.pinyin && <span className={styles.py}>{c.pinyin}</span>}
                      {c.meaning && <span className={styles.mean}>{c.meaning}</span>}
                    </span>
                    <span className={styles.tag}>Already saved</span>
                  </div>
                ) : (
                  <label className={styles.row}>
                    <input type="checkbox" className={styles.check} checked={selected.includes(i)} onChange={() => toggle(i)} />
                    <span className={styles.han}>{c.chinese}</span>
                    <span className={styles.info}>
                      {c.pinyin && <span className={styles.py}>{c.pinyin}</span>}
                      {c.meaning && <span className={styles.mean}>{c.meaning}</span>}
                    </span>
                  </label>
                )}
              </li>
            ))}
          </ul>

          <div className={styles.custom}>
            <input
              className={styles.input}
              value={custom}
              onChange={(e) => setCustom(e.target.value)}
              placeholder="Or type another word or phrase"
            />
            {custom.trim() && (
              <input
                className={styles.input}
                value={customMeaning}
                onChange={(e) => setCustomMeaning(e.target.value)}
                placeholder="Its meaning, e.g. to take away"
              />
            )}
          </div>

          <div className={styles.footer}>
            <button type="button" className={styles.save} onClick={handleSave}>Save</button>
            {message && <p className={styles.msg} role="status">{message}</p>}
          </div>
        </div>
      )}
    </div>
  )
}

export default SavePhrase