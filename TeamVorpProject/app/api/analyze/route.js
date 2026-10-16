export async function POST(req) {
    const { text } = await req.json();

    if (!text || !text.trim()) {
        return Response.json({ error: "No sentence provided" }, { status: 400 });
    }

    try {
    const res = await fetch("http://localhost:8000/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
        signal: AbortSignal.timeout(15000), // don't hang forever
    });

    if (!res.ok) {
        return Response.json(
        { error: "Analysis failed" },
        { status: 502 }
        );
    }

    const data = await res.json();      // { tokens: [...] }
    return Response.json(data);
    }

    catch (error) {
        console.error("NLP service error:", error);
    return Response.json(
        { error: "Analysis service unavailable" },
        { status: 503 }
    );
  }
}