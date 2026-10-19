// lib/nlp.js  (server-only)
const NLP_URL = process.env.NLP_SERVICE_URL ?? "http://localhost:8000";

export async function checkWithNlp(exerciseId, text) {
    const res = await fetch(`${NLP_URL}/check`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ exerciseId, text }),
        cache: "no-store",
        signal: AbortSignal.timeout(15000),
    });
    if (!res.ok) {
        const err = new Error(`NLP service returned ${res.status}`);
        err.status = res.status; // lets the route tell "Python said no" from "Python is down"
        throw err;
    }
    return res.json();
}

export function stripAnswerKey(result) {
    const cleaned = [];

    for (const item of result.unrecognised) {
    cleaned.push({
        role: item.role,
        tokens: item.tokens,
        text: item.text,
    });
    }

    result.unrecognised = cleaned;
    return result;
}