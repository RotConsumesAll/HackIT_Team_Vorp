import { ref, get, set, push, remove } from "firebase/database";
import { db } from "./firebase";
import { awardBadge } from "./progress";

export async function getSavedPhrases(uid) {
  const snap = await get(ref(db, `users/${uid}/savedPhrases`));
  return Object.entries(snap.val() || {})
    .map(([id, value]) => ({ id, ...value }))
    .sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
}

export async function addSavedPhrase(uid, phrase) {
  const newRef = push(ref(db, `users/${uid}/savedPhrases`));
  await set(newRef, {
    chinese: phrase.chinese,
    pinyin: phrase.pinyin || "",
    meaning: phrase.meaning || "",
    createdAt: Date.now(),
  });
  return awardBadge(uid, "first_phrase");
}

export async function deleteSavedPhrase(uid, id) {
  await remove(ref(db, `users/${uid}/savedPhrases/${id}`));
}