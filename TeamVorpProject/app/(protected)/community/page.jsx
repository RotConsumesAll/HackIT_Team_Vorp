"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import Navbar from "../../components/Navbar/Navbar"
import { useUid } from "../../../lib/useuid"
import {
  getPosts, createPost, editPost, deletePost, toggleLike,
  getReplies, addReply, editReply,
} from "../../../lib/community"
import { addSavedPhrase } from "../../../lib/phrases"
import { BADGE_NAMES } from "../../../lib/progress"
import { initialsOf } from "../../../lib/profile"
import styles from "./page.module.css"

function badgeText(ids){
  return ids && ids.length ? " New badge: " + ids.map((b) => BADGE_NAMES[b] || b).join(", ") : ""
}

function timeAgo(ms){
  if (!ms) return ""
  const s = Math.max(1, Math.floor((Date.now() - ms) / 1000))
  if (s < 60) return "just now"
  const m = Math.floor(s / 60)
  if (m < 60) return m + " min ago"
  const h = Math.floor(m / 60)
  if (h < 24) return h + (h === 1 ? " hour ago" : " hours ago")
  const d = Math.floor(h / 24)
  if (d < 7) return d + (d === 1 ? " day ago" : " days ago")
  return new Date(ms).toLocaleDateString(undefined, { day: "numeric", month: "short" })
}

function Avatar({ name, size = 40 }){
  return (
    <span className={styles.avatar} style={{ width: size, height: size, fontSize: size * 0.4 }} aria-hidden="true">
      {initialsOf(name)}
    </span>
  )
}

function Author({ uid, name }){
  return uid
    ? <Link href={"/profile/" + uid} className={styles.authorLink}>{name}</Link>
    : <span>{name}</span>
}

function PostCard({ post, uid, onChanged }){
  const [showReplies, setShowReplies] = useState(false)
  const [replies, setReplies] = useState(null)
  const [text, setText] = useState("")
  const [message, setMessage] = useState("")
  const [confirming, setConfirming] = useState(false)
  const [editing, setEditing] = useState(false)
  const [form, setForm] = useState(null)
  const [editingReply, setEditingReply] = useState(null)
  const [replyDraft, setReplyDraft] = useState("")

  const likes = post.likes ? Object.keys(post.likes) : []
  const liked = likes.includes(uid)
  const mine = post.authorUid === uid

  async function run(action){
    try {
      await action()
    } catch (e) {
      setMessage("Something went wrong. Please try again.")
    }
  }

  function handleLike(){
    run(async () => {
      await toggleLike(uid, post.id, liked)
      onChanged()
    })
  }

  function handleDelete(){
    run(async () => {
      await deletePost(post.id)
      onChanged()
    })
  }

  function handleSave(){
    run(async () => {
      const result = await addSavedPhrase(uid, { chinese: post.chinese, pinyin: post.pinyin, meaning: post.meaning, source: "Community" })
      setMessage(result.duplicate ? "You have already saved this phrase." : "Saved to your phrases!" + badgeText(result.newBadges))
    })
  }

  function startEdit(){
    setForm({ text: post.text || "", chinese: post.chinese || "", pinyin: post.pinyin || "", meaning: post.meaning || "" })
    setEditing(true)
    setConfirming(false)
  }

  function changeForm(field, value){
    setForm((f) => ({ ...f, [field]: value }))
  }

  function handleEditSave(e){
    e.preventDefault()
    const isPhrase = post.type === "phrase"
    if (isPhrase && (!form.chinese.trim() || !form.meaning.trim())) {
      setMessage("Please fill in the Chinese and the meaning.")
      return
    }
    if (!isPhrase && !form.text.trim()) {
      setMessage("Your question cannot be empty.")
      return
    }
    run(async () => {
      const data = { text: form.text.trim() }
      if (isPhrase) {
        data.chinese = form.chinese.trim()
        data.pinyin = form.pinyin.trim()
        data.meaning = form.meaning.trim()
      }
      await editPost(post.id, data)
      setEditing(false)
      setMessage("")
      onChanged()
    })
  }

  function startEditReply(r){
    setEditingReply(r.id)
    setReplyDraft(r.text)
  }

  function handleReplyEdit(e, r){
    e.preventDefault()
    if (!replyDraft.trim()) return
    run(async () => {
      await editReply(post.id, r.id, replyDraft.trim())
      setEditingReply(null)
      setReplies(await getReplies(post.id))
    })
  }

  function toggleReplies(){
    run(async () => {
      const next = !showReplies
      setShowReplies(next)
      if (next) setReplies(await getReplies(post.id))
    })
  }

  function handleReply(e){
    e.preventDefault()
    if (!text.trim()) return
    run(async () => {
      await addReply(uid, post.id, text.trim())
      setText("")
      setReplies(await getReplies(post.id))
    })
  }

  return (
    <li className={styles.post}>
      <div className={styles.postHead}>
        <Avatar name={post.authorName} />
        <div className={styles.postWho}>
          <p className={styles.postName}><Author uid={post.authorUid} name={post.authorName} /></p>
          <p className={styles.postMeta}>
            <span className={post.type === "phrase" ? styles.tagPhrase : styles.tagQuestion}>
              {post.type === "phrase" ? "Shared a phrase" : "Asked a question"}
            </span>
            <span>{timeAgo(post.createdAt)}{post.editedAt ? " \u00b7 edited" : ""}</span>
          </p>
        </div>
        {mine && !confirming && !editing && (
          <div className={styles.tools}>
            <button className={styles.iconBtn} onClick={startEdit} aria-label="Edit this post" title="Edit">
              <svg viewBox="0 0 20 20" width="18" height="18" aria-hidden="true"><path d="M3 17l1-4L14 3l3 3L7 16l-4 1zM12 5l3 3" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>
            </button>
            <button className={styles.iconBtn + " " + styles.danger} onClick={() => setConfirming(true)} aria-label="Delete this post" title="Delete">
              <svg viewBox="0 0 20 20" width="18" height="18" aria-hidden="true"><path d="M4 6h12M8 6V4h4v2M6 6l1 10h6l1-10" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>
            </button>
          </div>
        )}
        {mine && confirming && (
          <div className={styles.confirm}>
            <span>Delete this post?</span>
            <button className={styles.yes} onClick={handleDelete}>Delete</button>
            <button className={styles.no} onClick={() => setConfirming(false)}>Keep</button>
          </div>
        )}
      </div>

      {editing ? (
        <form className={styles.editForm} onSubmit={handleEditSave}>
          {post.type === "phrase" && (
            <div className={styles.grid}>
              <label className={styles.field}>
                <span className={styles.label}>Chinese</span>
                <input className={styles.input} value={form.chinese} onChange={(e) => changeForm("chinese", e.target.value)} />
              </label>
              <label className={styles.field}>
                <span className={styles.label}>Pinyin</span>
                <input className={styles.input} value={form.pinyin} onChange={(e) => changeForm("pinyin", e.target.value)} />
              </label>
              <label className={styles.field + " " + styles.wide}>
                <span className={styles.label}>Meaning</span>
                <input className={styles.input} value={form.meaning} onChange={(e) => changeForm("meaning", e.target.value)} />
              </label>
            </div>
          )}
          <label className={styles.field} style={{ marginTop: post.type === "phrase" ? ".9rem" : 0 }}>
            <span className={styles.label}>{post.type === "phrase" ? "Note" : "Question"}</span>
            <textarea className={styles.input + " " + styles.textarea} value={form.text} onChange={(e) => changeForm("text", e.target.value)} maxLength={300} rows={3} autoFocus />
          </label>
          <div className={styles.row}>
            <button type="button" className={styles.secondary} onClick={() => setEditing(false)}>Cancel</button>
            <button type="submit" className={styles.primary}>Save changes</button>
          </div>
        </form>
      ) : (
        <>
          {post.chinese && (
            <div className={styles.phrase}>
              <p className={styles.han}>{post.chinese}</p>
              {post.pinyin && <p className={styles.py}>{post.pinyin}</p>}
              <p className={styles.mean}>{post.meaning}</p>
            </div>
          )}
          {post.text && <p className={styles.body}>{post.text}</p>}
        </>
      )}

      <div className={styles.actions}>
        <button className={styles.action + (liked ? " " + styles.actionOn : "")} onClick={handleLike} aria-pressed={liked}>
          <span aria-hidden="true">{liked ? "♥" : "♡"}</span> {liked ? "Liked" : "Like"} ({likes.length})
        </button>
        <button className={styles.action} onClick={toggleReplies} aria-expanded={showReplies}>
          {showReplies ? "Hide replies" : "Replies"}
        </button>
        {post.type === "phrase" && !mine && (
          <button className={styles.action + " " + styles.saveAction} onClick={handleSave}>Save to my phrases</button>
        )}
      </div>

      {message && <p className={styles.notice} role="status">{message}</p>}

      {showReplies && (
        <div className={styles.replies}>
          {replies === null && <p className={styles.muted}>Loading...</p>}
          {replies && replies.length === 0 && <p className={styles.muted}>No replies yet. Start the conversation.</p>}
          <ul className={styles.replyList}>
            {(replies || []).map((r) => (
              <li key={r.id} className={styles.reply}>
                <Avatar name={r.authorName} size={30} />
                <div className={styles.replyBody} style={{ flex: 1 }}>
                  <p className={styles.replyName}>
                    <Author uid={r.authorUid} name={r.authorName} />
                    <span className={styles.replyTime}>{timeAgo(r.createdAt)}{r.editedAt ? " \u00b7 edited" : ""}</span>
                    {r.authorUid === uid && editingReply !== r.id && (
                      <button className={styles.linkBtn} onClick={() => startEditReply(r)}>Edit</button>
                    )}
                  </p>
                  {editingReply === r.id ? (
                    <form className={styles.replyForm} onSubmit={(e) => handleReplyEdit(e, r)}>
                      <input className={styles.input} value={replyDraft} onChange={(e) => setReplyDraft(e.target.value)} maxLength={300} aria-label="Edit your reply" autoFocus />
                      <button className={styles.primary} type="submit" disabled={!replyDraft.trim()}>Save</button>
                      <button className={styles.secondary} type="button" onClick={() => setEditingReply(null)}>Cancel</button>
                    </form>
                  ) : (
                    <p className={styles.replyText}>{r.text}</p>
                  )}
                </div>
              </li>
            ))}
          </ul>
          <form className={styles.replyForm} onSubmit={handleReply}>
            <input className={styles.input} value={text} onChange={(e) => setText(e.target.value)} placeholder="Write a reply" maxLength={300} aria-label="Write a reply" />
            <button className={styles.primary} type="submit" disabled={!text.trim()}>Reply</button>
          </form>
        </div>
      )}
    </li>
  )
}

function Community(){
  const router = useRouter()
  const { uid, ready } = useUid()
  const [posts, setPosts] = useState(null)
  const [question, setQuestion] = useState("")
  const [message, setMessage] = useState("")
  const [draft, setDraft] = useState(null)
  const [composing, setComposing] = useState(false)

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const chinese = params.get("chinese")
    if (chinese) {
      setDraft({
        chinese,
        pinyin: params.get("pinyin") || "",
        meaning: params.get("meaning") || "",
        note: "",
      })
    }
  }, [])

  useEffect(() => {
    if (!message) return
    const t = setTimeout(() => setMessage(""), 6000)
    return () => clearTimeout(t)
  }, [message])

  function changeDraft(field, value){
    setDraft((d) => ({ ...d, [field]: value }))
  }

  function closeDraft(){
    setDraft(null)
    router.replace("/community")
  }

  async function handleShare(e){
    e.preventDefault()
    if (!draft.chinese.trim() || !draft.meaning.trim()) {
      setMessage("Please fill in the Chinese and the meaning.")
      return
    }
    try {
      const earned = await createPost(uid, {
        type: "phrase",
        text: draft.note.trim(),
        chinese: draft.chinese.trim(),
        pinyin: draft.pinyin.trim(),
        meaning: draft.meaning.trim(),
      })
      closeDraft()
      setMessage("Your phrase was shared!" + badgeText(earned))
      load()
    } catch (err) {
      setMessage("Could not share your phrase. Please try again.")
    }
  }

  async function load(){
    try {
      setPosts(await getPosts())
    } catch (e) {
      setMessage("Could not load the community.")
      setPosts([])
    }
  }

  useEffect(() => {
    if (uid) load()
  }, [uid])

  async function handleAsk(e){
    e.preventDefault()
    if (!question.trim()) return
    try {
      const earned = await createPost(uid, { type: "question", text: question.trim() })
      setQuestion("")
      setComposing(false)
      setMessage("Your question was posted!" + badgeText(earned))
      load()
    } catch (err) {
      setMessage("Could not post your question.")
    }
  }

  if (!ready) return <p className={styles.note}>Loading...</p>
  if (!uid) return <p className={styles.note}>Please log in to join the community.</p>

  return (
    <>
      <header className={styles.header}>
        <h1 className={styles.title}>Community</h1>
        <p className={styles.subtitle}>Ask questions, share phrases and learn from other learners.</p>
      </header>

      {message && <p className={styles.toast} role="status">{message}</p>}

      {draft && (
        <section className={styles.card} aria-labelledby="share-title">
          <h2 id="share-title" className={styles.cardTitle}>Share a phrase</h2>
          <p className={styles.cardHint}>Check the details and edit anything you like. It is not shared until you press Post.</p>
          <form onSubmit={handleShare}>
            <div className={styles.grid}>
              <label className={styles.field}>
                <span className={styles.label}>Chinese</span>
                <input className={styles.input} value={draft.chinese} onChange={(e) => changeDraft("chinese", e.target.value)} />
              </label>
              <label className={styles.field}>
                <span className={styles.label}>Pinyin</span>
                <input className={styles.input} value={draft.pinyin} onChange={(e) => changeDraft("pinyin", e.target.value)} />
              </label>
              <label className={styles.field + " " + styles.wide}>
                <span className={styles.label}>Meaning</span>
                <input className={styles.input} value={draft.meaning} onChange={(e) => changeDraft("meaning", e.target.value)} />
              </label>
              <label className={styles.field + " " + styles.wide}>
                <span className={styles.label}>Note <span className={styles.optional}>(optional)</span></span>
                <textarea
                  className={styles.input + " " + styles.textarea}
                  value={draft.note}
                  onChange={(e) => changeDraft("note", e.target.value)}
                  placeholder="Where you heard it, or an example sentence"
                  maxLength={300}
                  rows={3}
                />
              </label>
            </div>
            <div className={styles.row}>
              <button type="button" className={styles.secondary} onClick={closeDraft}>Cancel</button>
              <button type="submit" className={styles.primary}>Post</button>
            </div>
          </form>
        </section>
      )}

      {!composing && (
        <div className={styles.createBar}>
          <button className={styles.createBtn} onClick={() => setComposing(true)}>
            <span aria-hidden="true">+</span> Create post
          </button>
        </div>
      )}

      {composing && (
        <section className={styles.card} aria-labelledby="ask-title">
          <h2 id="ask-title" className={styles.cardTitle}>Ask the community</h2>
          <form onSubmit={handleAsk}>
            <textarea
              className={styles.input + " " + styles.textarea}
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="e.g. What is the difference between 在 and 再?"
              maxLength={300}
              rows={3}
              aria-label="Your question"
              autoFocus
            />
            <div className={styles.askFoot}>
              <span className={styles.count}>{question.length} / 300</span>
              <div className={styles.footBtns}>
                <button type="button" className={styles.secondary} onClick={() => { setComposing(false); setQuestion("") }}>Cancel</button>
                <button className={styles.primary} type="submit" disabled={!question.trim()}>Post</button>
              </div>
            </div>
          </form>
          <p className={styles.cardHint}>To share a phrase, open My Phrases and press "Share to community".</p>
        </section>
      )}

      <h2 className={styles.feedTitle}>Latest posts</h2>
      {posts === null && <p className={styles.note}>Loading posts...</p>}
      {posts && posts.length === 0 && (
        <div className={styles.empty}>
          <strong>No posts yet</strong>
          <p>Be the first to ask a question!</p>
        </div>
      )}
      <ul className={styles.feed}>
        {(posts || []).map((p) => (
          <PostCard key={p.id} post={p} uid={uid} onChanged={load} />
        ))}
      </ul>
    </>
  )
}

function CommunityPage(){
  return (
    <div className={styles.shell}>
      <Navbar/>
      <main className={styles.page}>
        <Community/>
      </main>
    </div>
  )
}

export default CommunityPage