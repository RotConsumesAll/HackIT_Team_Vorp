export async function GET() {
    const res = await fetch("https://chinese-proverbs.onrender.com/api/proverbs/all", {
        next: { revalidate: 86400 }, // reuse the result for 24 hours
    });

    if (!res.ok) {
        return Response.json({ error: "Upstream failed" }, { status: 502 });
    }

    const data = await res.json();
    return Response.json(data, {
        headers: { "Cache-Control": "public, max-age=3600" }, // browser may reuse it for 1 hour
    });
}