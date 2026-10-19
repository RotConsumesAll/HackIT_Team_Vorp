export async function POST(req) {
    const { exerciseId, text } = await req.json();
    if (!exerciseId || !text || !text.trim()) {
    return Response.json({ error: "exerciseId and text are required" }, { status: 400 });
    }

    try {
    const res = await fetch("http://localhost:8000/check", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ exerciseId, text }),
        signal: AbortSignal.timeout(15000), // don't hang forever
    });

    if (!res.ok) {
      return Response.json({ error: "Check failed" }, { status: res.status === 404 ? 404 : 502 });
    }
    const data = await res.json();      // { tokens: [...] }
    return Response.json(data);
    }

    catch (error) {
        console.error("NLP service error:", error);
    return Response.json(
        { error: "Check service unavailable" },
        { status: 503 }
    );
  }
}