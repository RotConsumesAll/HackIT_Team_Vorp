async function CheckSent(exerciseId, text) {
    const res = await fetch("/api/check", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ exerciseId, text }),
    });
    if (!res.ok) throw new Error("Check failed");
    return res.json();
}

export default CheckSent;