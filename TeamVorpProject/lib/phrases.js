import { ref, get, set, push, remove } from "firebase/database";
import { db } from "./firebase";
import { awardBadge } from "./progress";


export async function getSavedPhrases(uid) {
  const snap = await get(ref(db, `users/${uid}/savedPhrases`));
  return Object.entries(snap.val() || {})
    .map(([id, value]) => ({ id, ...value }))
    .sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
}

export function normalizePhrase(text) {
  return (text || "").replace(/[\p{P}\p{S}\s]/gu, "");
}

const QUIZ_LABELS = {
  naturalGuess: "Natural Guess",
  naturalPhrase: "Natural Phrase",
  sound: "Sound Guess",
  character: "Character Guess",
  tone: "Tone Guess",
  measureword: "Measure Word",
};
export function contextSource(quizType) {
  const label = QUIZ_LABELS[quizType];
  return label ? `Context Guess · ${label}` : "Context Guess";
}

export async function addSavedPhrase(uid, phrase) {
  const key = normalizePhrase(phrase.chinese);
  const existing = await getSavedPhrases(uid);
  if (key && existing.some((p) => normalizePhrase(p.chinese) === key)) {
    return { saved: false, duplicate: true, newBadges: [] };
  }
  const newRef = push(ref(db, `users/${uid}/savedPhrases`));
  await set(newRef, {
    chinese: phrase.chinese,
    pinyin: phrase.pinyin || "",
    meaning: phrase.meaning || "",
    source: phrase.source || "",
    createdAt: Date.now(),
  });
  const newBadges = await awardBadge(uid, "first_phrase");
  return { saved: true, duplicate: false, newBadges };
}

export async function deleteSavedPhrase(uid, id) {
  await remove(ref(db, `users/${uid}/savedPhrases/${id}`));
}