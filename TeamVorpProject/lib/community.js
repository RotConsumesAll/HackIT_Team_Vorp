import { ref, get, set, push, remove, update } from "firebase/database";
import { db } from "./firebase";
import { awardBadge } from "./progress";

function toList(obj) {
  return Object.entries(obj || {})
    .map(([id, value]) => ({ id, ...value }))
    .sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
}

export async function getUserName(uid) {
  try {
    const snap = await get(ref(db, `users/${uid}/userName`));
    return snap.val() || "Player";
  } catch (e) {
    return "Player";
  }
}

export async function createPost(uid, data) {
  const post = {
    type: data.type,
    authorUid: uid,
    authorName: await getUserName(uid),
    text: data.text || "",
    createdAt: Date.now(),
  };
  if (data.chinese) post.chinese = data.chinese;
  if (data.pinyin) post.pinyin = data.pinyin;
  if (data.meaning) post.meaning = data.meaning;
  await set(push(ref(db, "community/posts")), post);
  return awardBadge(uid, "first_post");
}

export async function getPosts() {
  const snap = await get(ref(db, "community/posts"));
  return toList(snap.val()).slice(0, 50);
}

export async function deletePost(postId) {
  await remove(ref(db, `community/posts/${postId}`));
}

export async function toggleLike(uid, postId, liked) {
  await update(ref(db), { [`community/posts/${postId}/likes/${uid}`]: liked ? null : true });
}

export async function getReplies(postId) {
  const snap = await get(ref(db, `community/replies/${postId}`));
  return toList(snap.val()).reverse(); 
}

export async function addReply(uid, postId, text) {
  await set(push(ref(db, `community/replies/${postId}`)), {
    authorUid: uid,
    authorName: await getUserName(uid),
    text,
    createdAt: Date.now(),
  });
}