"use client"

import { useEffect, useState } from "react"
import { getAuth, onAuthStateChanged } from "firebase/auth"
import "./firebase"

export function useUid(){
  const [uid, setUid] = useState(null)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    const stop = onAuthStateChanged(getAuth(), (user) => {
      setUid(user ? user.uid : null)
      setReady(true)
    })
    return () => stop()
  }, [])

  return { uid, ready }
}