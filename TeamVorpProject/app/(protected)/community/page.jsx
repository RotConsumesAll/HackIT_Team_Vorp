"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Navbar from "../../components/Navbar/Navbar"
import { useUid } from "../../../lib/useuid"
import {
  getPosts, createPost, deletePost, toggleLike,
  getReplies, addReply,
} from "../../../lib/community"
import { addSavedPhrase } from "../../../lib/phrases"
import { BADGE_NAMES } from "../../../lib/progress"

function badgeText(ids){
  return ids && ids.length ? " New badge: " + ids.map((b) => BADGE_NAMES[b] || b).join(", ") : ""
}

function PostCard({ post, uid, onChanged }){
  const [showReplies, setShowReplies] = useState(false)
  const [replies, setReplies] = useState(null)
  const [text, setText] = useState("")
  const [message, setMessage] = useState("")

  const likes = post.likes ? Object.keys(post.likes) : []
  const liked = likes.includes(uid)

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
      await addSavedPhrase(uid, { chinese: post.chinese, pinyin: post.pinyin, meaning: post.meaning })
      setMessage("Saved to your phrases!")
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
    <li>
      <p><strong>{post.authorName}</strong> · {post.type === "phrase" ? "shared a phrase" : "asked a question"}</p>

      {post.chinese && (
        <p>
          <strong>{post.chinese}</strong> {post.pinyin && "(" + post.pinyin + ")"} - {post.meaning}
        </p>
      )}
      {post.text && <p>{post.text}</p>}

      <button onClick={handleLike}>{liked ? "Unlike" : "Like"} ({likes.length})</button>
      <button onClick={toggleReplies}>{showReplies ? "Hide replies" : "Replies"}</button>
      {post.type === "phrase" && post.authorUid !== uid && <button onClick={handleSave}>Save to my phrases</button>}
      {post.authorUid === uid && <button onClick={handleDelete}>Delete</button>}

      {message && <p>{message}</p>}

      {showReplies && (
        <div>
          {replies === null && <p>Loading...</p>}
          {replies && replies.length === 0 && <p>No replies yet.</p>}
          <ul>
            {(replies || []).map((r) => (
              <li key={r.id}><strong>{r.authorName}:</strong> {r.text}</li>
            ))}
          </ul>
          <form onSubmit={handleReply}>
            <input value={text} onChange={(e) => setText(e.target.value)} placeholder="Write a reply" maxLength={300} />
            <button type="submit">Reply</button>
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
  // A phrase the user chose to share. It is only posted when they press Post.
  const [draft, setDraft] = useState(null)

  // If the user came from My Phrases, open the share form with that phrase filled in.
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

  function changeDraft(field, value){
    setDraft((d) => ({ ...d, [field]: value }))
  }

  function closeDraft(){
    setDraft(null)
    router.replace("/community") // clears the phrase from the address bar
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
      setMessage(badgeText(earned))
      load()
    } catch (err) {
      setMessage("Could not post your question.")
    }
  }

  if (!ready) return <p>Loading...</p>
  if (!uid) return <p>Please log in to join the community.</p>

  return (
    <>
      <h1>Community</h1>

      {draft && (
        <>
          <h2>Share a phrase</h2>
          <p>Check the details and edit anything you like, then press Post. It is not shared until you do.</p>
          <form onSubmit={handleShare}>
            <p><input value={draft.chinese} onChange={(e) => changeDraft("chinese", e.target.value)} placeholder="Chinese" /></p>
            <p><input value={draft.pinyin} onChange={(e) => changeDraft("pinyin", e.target.value)} placeholder="Pinyin" /></p>
            <p><input value={draft.meaning} onChange={(e) => changeDraft("meaning", e.target.value)} placeholder="Meaning" /></p>
            <p>
              <textarea
                value={draft.note}
                onChange={(e) => changeDraft("note", e.target.value)}
                placeholder="Add a note, e.g. where you heard it or an example sentence (optional)"
                maxLength={300}
                rows={3}
              />
            </p>
            <button type="submit">Post</button>
            {" "}
            <button type="button" onClick={closeDraft}>Cancel</button>
          </form>
        </>
      )}

      <h2>Ask the community</h2>
      <form onSubmit={handleAsk}>
        <input
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder="e.g. What is the difference between 在 and 再?"
          maxLength={300}
        />
        <button type="submit">Post</button>
      </form>
      <p>To share a phrase, go to My Phrases and press "Share to community".</p>

      {message && <p>{message}</p>}

      {posts === null && <p>Loading posts...</p>}
      {posts && posts.length === 0 && <p>No posts yet. Be the first to ask a question!</p>}

      <ul>
        {(posts || []).map((p) => (
          <PostCard key={p.id} post={p} uid={uid} onChanged={load} />
        ))}
      </ul>
    </>
  )
}

function CommunityPage(){
  return (
    <>
      <Navbar/>
      <Community/>
    </>
  )
}

export default CommunityPage