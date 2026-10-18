"use client"

import { useState } from "react"

function ShareButton({ text, label = "Share" }){
  const [message, setMessage] = useState("")

  async function handleShare(){
    const url = window.location.origin
    try {
      if (navigator.share) {
        await navigator.share({ title: "Mother Tongue app", text, url })
        return
      }
      await navigator.clipboard.writeText(text + " " + url)
      setMessage("Copied! Paste it to a friend.")
    } catch (e) {
      if (e && e.name === "AbortError") return
      setMessage("Could not share automatically. Copy this: " + text)
    }
    setTimeout(() => setMessage(""), 4000)
  }

  return (
    <>
      <button onClick={handleShare}>{label}</button>
      {message && <p>{message}</p>}
    </>
  )
}

export default ShareButton