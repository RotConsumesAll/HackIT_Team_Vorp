"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Navbar from "../../components/Navbar/Navbar"
import { useUid } from "../../../lib/useUid"
import { getSavedPhrases, addSavedPhrase, deleteSavedPhrase } from "../../../lib/phrases"
import { toPinyin } from "../../../lib/pinyin"

function Phrases(){
  const router = useRouter()
  const { uid, ready } = useUid()
  const [phrases, setPhrases] = useState(null)
  const [chinese, setChinese] = useState("")
  const [pinyin, setPinyin] = useState("")
  const [meaning, setMeaning] = useState("")
  const [message, setMessage] = useState("")

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

  async function handleAdd(e){
    e.preventDefault()
    if (!chinese.trim() || !meaning.trim()) {
      setMessage("Please fill in the Chinese and the meaning.")
      return
    }
    try {
      await addSavedPhrase(uid, { chinese: chinese.trim(), pinyin: pinyin.trim() || toPinyin(chinese.trim()), meaning: meaning.trim() })
      setChinese("")
      setPinyin("")
      setMeaning("")
      setMessage("Saved!")
      load()
    } catch (err) {
      setMessage("Could not save the phrase.")
    }
  }

  async function handleDelete(id){
    try {
      await deleteSavedPhrase(uid, id)
      load()
    } catch (err) {
      setMessage("Could not delete the phrase.")
    }
  }

  // Opens the Community page with this phrase in the share form. Nothing is posted until the user presses Post there.
  function handleShare(p){
    const params = new URLSearchParams({
      chinese: p.chinese || "",
      pinyin: p.pinyin || "",
      meaning: p.meaning || "",
    })
    router.push("/community?" + params.toString())
  }

  if (!ready) return <p>Loading...</p>
  if (!uid) return <p>Please log in to see your saved phrases.</p>

  return (
    <>
      <h1>My Saved Phrases</h1>
      <p>Phrases you save from the website features show up here. You can also add your own.</p>

      <form onSubmit={handleAdd}>
        <input value={chinese} onChange={(e) => setChinese(e.target.value)} placeholder="Chinese, e.g. 打包" />
        <input value={pinyin} onChange={(e) => setPinyin(e.target.value)} placeholder="Pinyin (filled in for you if empty)" />
        <input value={meaning} onChange={(e) => setMeaning(e.target.value)} placeholder="Meaning, e.g. take away" />
        <button type="submit">Save phrase</button>
      </form>

      {message && <p>{message}</p>}

      {phrases === null && <p>Loading your phrases...</p>}
      {phrases && phrases.length === 0 && <p>No saved phrases yet.</p>}

      <ul>
        {(phrases || []).map((p) => (
          <li key={p.id}>
            <strong>{p.chinese}</strong> {p.pinyin && "(" + p.pinyin + ")"} - {p.meaning}
            {" "}
            <button onClick={() => handleShare(p)}>Share to community</button>
            <button onClick={() => handleDelete(p.id)}>Delete</button>
          </li>
        ))}
      </ul>
    </>
  )
}

function PhrasesPage(){
  return (
    <>
      <Navbar/>
      <Phrases/>
    </>
  )
}

export default PhrasesPage