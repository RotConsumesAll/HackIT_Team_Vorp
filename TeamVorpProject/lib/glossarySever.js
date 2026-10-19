// lib/glossaryServer.js  (server-only)
const DB_URL = process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL;
const MAX_AGE = 5 * 60 * 1000; // reload the glossary every 5 minutes

let cachedTerms = null;
let cachedAt = 0;

export async function loadGlossary() {
    if (cachedTerms && Date.now() - cachedAt < MAX_AGE) {
        return cachedTerms;
    }

    try {
    const res = await fetch(`${DB_URL}/glossaryTerms.json`, {
        cache: "no-store",
        signal: AbortSignal.timeout(5000),
    });
    if (!res.ok) throw new Error(`Firebase returned ${res.status}`);

    const data = await res.json(); // { TERM_01: {...}, TERM_02: {...} } or null
    const terms = [];
    if (data) {
        for (const id in data) {
        const entry = data[id];
        entry.id = id;
        terms.push(entry);
        }
    }

    cachedTerms = terms;
    cachedAt = Date.now();
    return terms;
    } 
    catch (error) {
        // A glossary failure shouldn't stop the vocab check, so carry on without it.
        console.error("glossary load failed:", error);
        return [];
    }
}