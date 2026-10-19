"use client"

import { useState } from "react"
import { useUid } from "../../../lib/useuid"
import { addSavedPhrase } from "../../../lib/phrases"
import { BADGE_NAMES } from "../../../lib/progress"
import { toPinyin } from "../../../lib/pinyin"


function SavePhrase({ choices }){
  const { uid } = useUid()
  const [open, setOpen] = useState(false)
  const [selected, setSelected] = useState([])
  const [custom, setCustom] = useState("")
  const [customMeaning, setCustomMeaning] = useState("")
  const [message, setMessage] = useState("")

  if (!uid || choices.length === 0) return null

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
      for (const phrase of toSave) {
        earned.push(...(await addSavedPhrase(uid, phrase)))
      }
      setMessage("Saved to My Phrases!" + (earned.length ? " New badge: " + earned.map((b) => BADGE_NAMES[b] || b).join(", ") : ""))
      setSelected([])
      setCustom("")
      setCustomMeaning("")
    } catch (e) {
      setMessage("Could not save. Please try again.")
    }
  }

  return (
    <div>
      <button onClick={() => setOpen(!open)}>{open ? "Close" : "Save a phrase"}</button>

      {open && (
        <div>
          <p>Which phrase do you want to save?</p>
          <ul>
            {choices.map((c, i) => (
              <li key={i}>
                <label>
                  <input type="checkbox" checked={selected.includes(i)} onChange={() => toggle(i)} />
                  {" "}<strong>{c.chinese}</strong>
                  {c.pinyin ? " (" + c.pinyin + ")" : ""}
                  {c.meaning ? " - " + c.meaning : ""}
                </label>
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