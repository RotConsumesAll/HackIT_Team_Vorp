"use client"

import { useEffect, useId, useRef, useState } from "react"
import Link from "next/link"
import { getAuth, sendPasswordResetEmail } from "firebase/auth"
import BadgeShowcase from "./badgeshowcase"
import Navbar from "../../components/Navbar/Navbar"
import { useUid } from "../../../lib/useuid"
import { levelFromScore, POINTS_PER_LEVEL } from "../../../lib/progress"
import { getProfile, saveProfile, readPhoto, validateUserName, initialsOf, NAME_MAX, BIO_MAX } from "../../../lib/profile"
import styles from "./page.module.css"

function Avatar({ photo, name, size }){
  return (
    <span className={styles.avatar} style={{ width: size, height: size, fontSize: size * 0.38 }}>
      {photo ? <img src={photo} alt="" /> : <span aria-hidden="true">{initialsOf(name)}</span>}
    </span>
  )
}

function Switch({ checked, onChange, label, description }){
  const id = useId()
  return (
    <div className={styles.switchRow}>
      <div className={styles.switchText}>
        <label htmlFor={id} className={styles.switchLabel}>{label}</label>
        <p className={styles.switchDesc}>{description}</p>
      </div>
      <button id={id} type="button" role="switch" aria-checked={checked} className={styles.switch} onClick={() => onChange(!checked)}>
        <span className={styles.knob} />
        <span className={styles.srOnly}>{checked ? "On" : "Off"}</span>
      </button>
    </div>
  )
}

function Section({ title, hint, children }){
  return (
    <section className={styles.section}>
      <h2 className={styles.sectionTitle}>{title}</h2>
      {hint && <p className={styles.sectionHint}>{hint}</p>}
      {children}
    </section>
  )
}

function ProfileForm({ uid }){
  const fileRef = useRef(null)
  const nameId = useId()
  const bioId = useId()
  const [saved, setSaved] = useState(null)
  const [form, setForm] = useState(null)
  const [loadError, setLoadError] = useState("")
  const [photoError, setPhotoError] = useState("")
  const [nameError, setNameError] = useState("")
  const [status, setStatus] = useState({ type: "", text: "" })
  const [saving, setSaving] = useState(false)
  const [resetMsg, setResetMsg] = useState("")

  useEffect(() => {
    let cancelled = false
    getProfile(uid)
      .then((p) => {
        if (cancelled) return
        setSaved(p)
        setForm({
          userName: p.userName,
          bio: p.bio,
          photo: p.photo,
          showOnLeaderboard: p.showOnLeaderboard,
          showLevel: p.showLevel,
          publicProgress: p.publicProgress,
        })
      })
      .catch(() => {
        if (!cancelled) setLoadError("Could not load your profile.")
      })
    return () => { cancelled = true }
  }, [uid])

  useEffect(() => {
    if (!status.text) return
    const t = setTimeout(() => setStatus({ type: "", text: "" }), 5000)
    return () => clearTimeout(t)
  }, [status])

  if (loadError) return <p className={styles.note}>{loadError}</p>
  if (!form || !saved) return <p className={styles.note}>Loading...</p>

  const dirty = ["userName", "bio", "photo", "showOnLeaderboard", "showLevel", "publicProgress"].some((k) => form[k] !== (k === "userName" ? saved.userName : saved[k]))
  const user = getAuth().currentUser
  const level = levelFromScore(saved.totalScore)
  const into = saved.totalScore % POINTS_PER_LEVEL
  const shownName = form.userName.trim() || "Player"

  function set(key, value){
    setForm((f) => ({ ...f, [key]: value }))
    setStatus({ type: "", text: "" })
  }

  async function onFile(e){
    const file = e.target.files && e.target.files[0]
    e.target.value = ""
    if (!file) return
    setPhotoError("")
    try {
      set("photo", await readPhoto(file))
    } catch (err) {
      setPhotoError(err.message)
    }
  }

  async function onSave(e){
    e.preventDefault()
    const problem = validateUserName(form.userName)
    setNameError(problem)
    if (problem) return
    setSaving(true)
    try {
      await saveProfile(uid, form)
      setSaved((s) => ({ ...s, ...form, userName: form.userName.trim(), bio: form.bio.trim() }))
      setForm((f) => ({ ...f, userName: f.userName.trim(), bio: f.bio.trim() }))
      setStatus({ type: "ok", text: "Your changes are saved." })
    } catch (err) {
      setStatus({ type: "bad", text: "Could not save. Please try again." })
    }
    setSaving(false)
  }

  function onDiscard(){
    setForm({
      userName: saved.userName,
      bio: saved.bio,
      photo: saved.photo,
      showOnLeaderboard: saved.showOnLeaderboard,
      showLevel: saved.showLevel,
      publicProgress: saved.publicProgress,
    })
    setNameError("")
    setPhotoError("")
    setStatus({ type: "", text: "" })
  }

  async function onReset(){
    setResetMsg("")
    try {
      await sendPasswordResetEmail(getAuth(), user.email)
      setResetMsg("We sent a password reset link to " + user.email + ".")
    } catch (err) {
      setResetMsg("Could not send the email. Please try again later.")
    }
  }

  const memberSince = user && user.metadata && user.metadata.creationTime
    ? new Date(user.metadata.creationTime).toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" })
    : ""

  return (
    <form className={styles.layout} onSubmit={onSave} noValidate>
      <aside className={styles.side}>
        <div className={styles.card + " " + styles.identity}>
          <Avatar photo={form.photo} name={shownName} size={112} />
          <p className={styles.idName}>{shownName}</p>
          <p className={styles.idLevel}>Level {level}</p>
          <div className={styles.meter} role="progressbar" aria-valuemin={0} aria-valuemax={POINTS_PER_LEVEL} aria-valuenow={into} aria-label={"Progress to Level " + (level + 1)}>
            <div className={styles.meterFill} style={{ width: into + "%" }} />
          </div>
          <p className={styles.idSmall}>{POINTS_PER_LEVEL - into} points to Level {level + 1}</p>
          {form.bio.trim() && <p className={styles.idBio}>{form.bio.trim()}</p>}
        </div>

        <div className={styles.card}>
          <dl className={styles.stats}>
            <div><dt>Points</dt><dd>{saved.totalScore}</dd></div>
            <div><dt>Badges</dt><dd>{saved.badgeCount}</dd></div>
            <div><dt>Best streak</dt><dd>{saved.bestStreak}</dd></div>
            <div><dt>Days logged in</dt><dd>{saved.loginDays}</dd></div>
          </dl>
          <div className={styles.links}>
            <Link href="/progress">See all progress</Link>
            <Link href="/leaderboard">View leaderboard</Link>
          </div>
        </div>
      </aside>

      <div className={styles.main}>
        <Section title="Profile" hint="This is how other learners see you.">
          <div className={styles.photoRow}>
            <Avatar photo={form.photo} name={shownName} size={72} />
            <div>
              <div className={styles.photoBtns}>
                <button type="button" className={styles.secondary} onClick={() => fileRef.current && fileRef.current.click()}>
                  {form.photo ? "Change photo" : "Upload photo"}
                </button>
                {form.photo && <button type="button" className={styles.linkBtn} onClick={() => set("photo", "")}>Remove</button>}
              </div>
              <p className={styles.help}>JPG or PNG, up to 5 MB. We crop it to a square.</p>
              {photoError && <p className={styles.error} role="alert">{photoError}</p>}
            </div>
            <input ref={fileRef} type="file" accept="image/*" className={styles.srOnly} onChange={onFile} tabIndex={-1} aria-label="Choose a profile photo" />
          </div>

          <div className={styles.field}>
            <label htmlFor={nameId} className={styles.label}>Username</label>
            <input
              id={nameId}
              className={styles.input + (nameError ? " " + styles.inputBad : "")}
              value={form.userName}
              maxLength={NAME_MAX + 10}
              onChange={(e) => { set("userName", e.target.value); if (nameError) setNameError("") }}
              onBlur={() => setNameError(validateUserName(form.userName))}
              aria-invalid={!!nameError}
              autoComplete="nickname"
            />
            <div className={styles.fieldFoot}>
              <span className={styles.error} role={nameError ? "alert" : undefined}>{nameError}</span>
              <span className={styles.count}>{form.userName.trim().length} / {NAME_MAX}</span>
            </div>
          </div>

          <div className={styles.field}>
            <label htmlFor={bioId} className={styles.label}>About me <span className={styles.optional}>(optional)</span></label>
            <textarea
              id={bioId}
              className={styles.input + " " + styles.textarea}
              value={form.bio}
              rows={3}
              maxLength={BIO_MAX}
              onChange={(e) => set("bio", e.target.value)}
              placeholder="Why are you learning Chinese?"
            />
            <div className={styles.fieldFoot}>
              <span />
              <span className={styles.count}>{form.bio.length} / {BIO_MAX}</span>
            </div>
          </div>
        </Section>

        <Section title="Badges" hint={form.publicProgress ? "Other learners can see these on your public profile." : "Only you can see these right now. Turn on public progress in Privacy to show them."}>
          <BadgeShowcase items={saved.highlights} />
          <p className={styles.help}>We show your two highest badges, plus Regular visitor for your days logged in.</p>
        </Section>

        <Section title="Privacy" hint="You choose what other learners can see.">
          <Switch
            checked={form.showOnLeaderboard}
            onChange={(v) => set("showOnLeaderboard", v)}
            label="Show me on the leaderboard"
            description="When off, you are hidden from the leaderboard. You can still see your own progress."
          />
          <Switch
            checked={form.showLevel}
            onChange={(v) => set("showLevel", v)}
            label="Show my level to others"
            description="When off, other learners see your name but not your level."
          />
          <Switch
            checked={form.publicProgress}
            onChange={(v) => set("publicProgress", v)}
            label="Show my progress on my public profile"
            description="When on, other learners can see your top badges and badge count. When off, your profile only shows your name, photo and about me."
          />
        </Section>

        <Section title="Account">
          <dl className={styles.account}>
            <div><dt>Email</dt><dd>{user ? user.email : ""}</dd></div>
            {memberSince && <div><dt>Member since</dt><dd>{memberSince}</dd></div>}
          </dl>
          <button type="button" className={styles.secondary} onClick={onReset}>Send password reset email</button>
          {resetMsg && <p className={styles.help} role="status">{resetMsg}</p>}
        </Section>

        <div className={styles.saveBar}>
          <p className={status.type === "bad" ? styles.error : styles.ok} role="status">
            {status.text || (dirty ? "You have unsaved changes." : "")}
          </p>
          <div className={styles.saveBtns}>
            <button type="button" className={styles.secondary} onClick={onDiscard} disabled={!dirty || saving}>Discard</button>
            <button type="submit" className={styles.primary} disabled={!dirty || saving}>{saving ? "Saving..." : "Save changes"}</button>
          </div>
        </div>
      </div>
    </form>
  )
}

function Profile(){
  const { uid, ready } = useUid()
  if (!ready) return <p className={styles.note}>Loading...</p>
  if (!uid) return <p className={styles.note}>Please log in to see your profile.</p>
  return <ProfileForm uid={uid} />
}

function ProfilePage(){
  return (
    <div className={styles.shell}>
      <Navbar/>
      <main className={styles.page}>
        <header className={styles.header}>
          <h1 className={styles.title}>My Profile</h1>
          <p className={styles.subtitle}>Make it yours and choose what others can see.</p>
        </header>
        <Profile/>
      </main>
    </div>
  )
}

export default ProfilePage