"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import Link from "next/link"
import BadgeShowcase from "../badgeshowcase"
import Navbar from "../../../components/Navbar/Navbar"
import { useUid } from "../../../../lib/useuid"
import { getPublicProfile, initialsOf } from "../../../../lib/profile"
import styles from "../page.module.css"

function PublicProfile(){
  const params = useParams()
  const target = params.uid
  const { uid, ready } = useUid()
  const [profile, setProfile] = useState(undefined)

  useEffect(() => {
    let cancelled = false
    getPublicProfile(target)
      .then((p) => { if (!cancelled) setProfile(p) })
      .catch(() => { if (!cancelled) setProfile(null) })
    return () => { cancelled = true }
  }, [target])

  if (!ready || profile === undefined) return <p className={styles.note}>Loading...</p>
  if (!uid) return <p className={styles.note}>Please log in to see profiles.</p>
  if (!profile) return <p className={styles.note}>We could not find this learner.</p>

  const mine = uid === target

  return (
    <div className={styles.publicWrap}>
      <div className={styles.card + " " + styles.identity}>
        <span className={styles.avatar} style={{ width: 112, height: 112, fontSize: 42 }}>
          {profile.photo ? <img src={profile.photo} alt="" /> : <span aria-hidden="true">{initialsOf(profile.userName)}</span>}
        </span>
        <p className={styles.idName}>{profile.userName}</p>
        {profile.level !== null && <p className={styles.idLevel}>Level {profile.level}</p>}
        {profile.bio && <p className={styles.idBio}>{profile.bio}</p>}
        {mine && <Link href="/profile" className={styles.editLink}>Edit my profile</Link>}
      </div>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Badges</h2>
        {profile.publicProgress ? (
          <>
            <div className={styles.gap}><BadgeShowcase items={profile.highlights} /></div>
            <p className={styles.help}>{profile.badgeCount} {profile.badgeCount === 1 ? "badge" : "badges"} earned</p>
          </>
        ) : (
          <p className={styles.help}>{mine ? "Your progress is private. Turn on public progress in your profile settings to show it here." : "This learner keeps their progress private."}</p>
        )}
      </section>
    </div>
  )
}

function PublicProfilePage(){
  return (
    <div className={styles.shell}>
      <Navbar/>
      <main className={styles.page}>
        <header className={styles.header}>
          <h1 className={styles.title}>Learner Profile</h1>
        </header>
        <PublicProfile/>
      </main>
    </div>
  )
}

export default PublicProfilePage