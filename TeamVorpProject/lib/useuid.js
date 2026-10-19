"use client"

import { useEffect, useState } from "react"
import { getAuth, onAuthStateChanged } from "firebase/auth"
import "./firebase"
import { recordLogin } from "./progress"

export function useUid(){
  const [uid, setUid] = useState(null)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    const stop = onAuthStateChanged(getAuth(), (user) => {
      setUid(user ? user.uid : null)
      if (user) recordLogin(user.uid) 
      setReady(true)
    })
    return () => stop()
  }, [])

  return { uid, ready }
}