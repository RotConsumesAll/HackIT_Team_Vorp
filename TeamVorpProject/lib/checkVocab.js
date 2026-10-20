export default async function CheckVocab(exerciseId, text) {
        const res = await fetch("/api/vocab", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ exerciseId, text }),
        signal: AbortSignal.timeout(45000)
    });
    if (!res.ok) throw new Error("Vocab check failed");
    const data = await res.json();
    return data.verdicts;
}