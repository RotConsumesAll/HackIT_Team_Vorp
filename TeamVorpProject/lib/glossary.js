import { ref, get, set, push, update, remove } from "firebase/database";
import { db } from "./firebase";

// READ all
export async function getAllTerms() {
  const res = await get(ref(db, "glossaryTerms"));
  if (!res.exists()) return [];
  return Object.entries(res.val()).map(([id, data]) => ({ id, ...data }));
}

// READ one
export async function getTerm(id) {
  const res = await get(ref(db, `glossaryTerms/${id}`));
  return res.exists() ? { id, ...res.val() } : null;
}
