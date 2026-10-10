import { ref, get } from "firebase/database";
import { db } from "./firebase";


function toList(obj) {
  return Object.entries(obj || {}).map(([key, value]) => ({ key, ...value }));
}

export async function getQuestions(quizType) {
  const snap = await get(ref(db, `questions/${quizType}`));
  if (!snap.exists()) return [];
  return Object.entries(snap.val()).map(([id, q]) => ({
    id,
    quizType,
    ...q,
    options: toList(q.options),
  }));
}

export async function getMixedQuestions(types) {
  const lists = await Promise.all(types.map((t) => getQuestions(t)));
  return lists.flat();
}