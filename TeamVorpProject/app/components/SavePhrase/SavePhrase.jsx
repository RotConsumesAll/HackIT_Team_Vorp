"use client"

import { useState } from "react"
import { useUid } from "../../../lib/useuid"
import { addSavedPhrase, getSavedPhrases, normalizePhrase } from "../../../lib/phrases"
import { BADGE_NAMES } from "../../../lib/progress"
import { toPinyin } from "../../../lib/pinyin"

function SavePhrase({ choices }){
  const { uid } = useUid()
  const [open, setOpen] = useState(false)
  const [selected, setSelected] = useState([])
  const [custom, setCustom] = useState("")
  const [customMeaning, setCustomMeaning] = useState("")
  const [message, setMessage] = useState("")
  const [savedKeys, setSavedKeys] = useState([]) // phrases the user already has

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
    const toSave = selected.map((i) => choices[i])

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
    <div>
      <button onClick={handleOpen}>{open ? "Close" : "Save a phrase"}</button>

      {open && (
        <div>
          <p>Which phrase do you want to save?</p>
          <ul>
            {choices.map((c, i) => (
              <li key={i}>
                {isSaved(c.chinese) ? (
                  <span>
                    <strong>{c.chinese}</strong>
                    {c.pinyin ? " (" + c.pinyin + ")" : ""}
                    {c.meaning ? " - " + c.meaning : ""}
                    {" - "}<strong>Phrase already saved</strong>
                  </span>
                ) : (
                  <label>
                    <input type="checkbox" checked={selected.includes(i)} onChange={() => toggle(i)} />
                    {" "}<strong>{c.chinese}</strong>
                    {c.pinyin ? " (" + c.pinyin + ")" : ""}
                    {c.meaning ? " - " + c.meaning : ""}
                  </label>
                )}
              </li>
            ))}
          </ul>

          <input
            value={custom}
            onChange={(e) => setCustom(e.target.value)}
            placeholder="Or type another word or phrase"
          />
          {custom.trim() && (
            <input
              value={customMeaning}
              onChange={(e) => setCustomMeaning(e.target.value)}
              placeholder="Its meaning, e.g. to take away"
            />
          )}

          <button onClick={handleSave}>Save</button>
          {message && <p>{message}</p>}
        </div>
      )}
    </div>
  )
}

export default SavePhrase