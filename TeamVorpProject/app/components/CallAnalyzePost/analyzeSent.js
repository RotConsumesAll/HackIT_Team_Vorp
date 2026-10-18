async function AnalyzeSent(chiSent) {
    const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: chiSent }),
    });
    if (!res.ok) throw new Error("Analysis failed");
    return res.json();
}

export default AnalyzeSent;