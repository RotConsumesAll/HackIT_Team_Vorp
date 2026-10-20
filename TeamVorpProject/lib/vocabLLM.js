// lib/vocabLLM.js  (server-only)
// const API_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent";
const API_URL = "https://generativelanguage.googleapis.com/v1beta/openai/chat/completions";
const MODEL = process.env.GEMINI_VOCAB_MODEL || "gemini-3.5-flash-lite";
const VERDICTS = ["equivalent", "less_natural", "different_meaning", "incorrect", "uncertain"];
const TIMEOUT_MS = 15000;

function uncertain(item) {
  return { token: item.tokens[0], word: item.text, verdict: "uncertain", suggestion: "", reason: "" };
}

function cleanText(value) {
  if (typeof value !== "string") return "";
  return value.trim().slice(0, 200);
}

export function parseVerdicts(raw, items) {
    let list = [];
    try {
        const data = JSON.parse(raw);
        if (Array.isArray(data.verdicts)) list = data.verdicts;
    } 
    catch {
        // unparseable reply: every word falls through to "uncertain" below
    }

    const results = [];
    for (const item of items) {
    const token = item.tokens[0];
    const found = list.find((v) => v.token === token);

    if (!found || !VERDICTS.includes(found.verdict)) {
        results.push(uncertain(item));
        continue;
    }
    results.push({
        token: token,
        word: item.text,
        verdict: found.verdict,
        suggestion: cleanText(found.suggestion),
        reason: cleanText(found.reason),
    });
    }
    return results;
}

// Tells Gemini the exact shape of the reply. We still validate it ourselves afterwards.
const RESPONSE_FORMAT = {
    type: "json_schema",
        json_schema: {
        name: "vocab_verdicts",
        schema: {
            type: "object",
            properties: {
                verdicts: {
                    type: "array",
                    items: {
                    type: "object",
                    properties: {
                        token: { type: "integer" },
                        word: { type: "string" },
                        verdict: {
                        type: "string",
                        enum: ["equivalent", "less_natural", "different_meaning", "incorrect", "uncertain"],
                        },
                        suggestion: { type: "string" },
                        reason: { type: "string" },
                    },
                    required: ["token", "word", "verdict", "suggestion", "reason"],
                    },
                },
            },
            required: ["verdicts"],
            },
        },
    };

async function callGemini(messages) {
    const res = await fetch(API_URL, {
    method: "POST",
    headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.GEMINI_VOCAB_API_KEY}`,
    },
    body: JSON.stringify({
        model: MODEL,
        messages: messages,
        response_format: RESPONSE_FORMAT,
        reasoning_effort: "low", // less thinking = faster and cheaper
    }),
    cache: "no-store",
    signal: AbortSignal.timeout(TIMEOUT_MS),
    });

    if (!res.ok) {
        const detail = await res.text(); // Google's error message explains what was wrong
        throw new Error(`Gemini returned ${res.status}: ${detail}`);
    }

    const data = await res.json();
    return data.choices?.[0]?.message?.content || "";
}

// Returns the reply text. Retries once if the reply comes back empty.
export async function askGemini(messages) {
    for (let attempt = 0; attempt < 2; attempt++) {
        const text = await callGemini(messages);
        if (text.trim()) return text;
    }
    return "";
}