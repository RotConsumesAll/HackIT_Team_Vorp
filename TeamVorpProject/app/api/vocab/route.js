//Call Python /check again to get unrecognised with accepted forms
//Looks up glossary
//Call Gemini with {exerciseID, text}
//Gemini returns only {verdicts}


/*
| Verdict           | Meaning                                                     | Effect                      |
| ----------------- | ----------------------------------------------------------- | --------------------------- |
| equivalent        | Same meaning and register in this sentence                  | Fine; shown as accepted     |
| less_natural      | Correct, but a different register or less local (菜市场 vs 巴刹) | Tip with a suggestion       |
| different_meaning | Means something else (借 vs 租, 啃 vs 吃)                       | Flag; ok becomes false      |
| incorrect         | Not a valid word or misuse                                  | Flag; ok becomes false      |
| uncertain         | The model isn’t sure                                        | Stays dotted, no accusation |

*/ 
import { loadGlossary } from "../../../lib/glossarySever";
import { findGlossaryEntries } from "../../../lib/glossaryMatch";
import { checkWithNlp } from "../../../lib/nlp";
import { PROMPTS } from "../../../lib/prompts";
import { buildVocabMessages } from "../../../lib/vocabPrompt";
import { askGemini, parseVerdicts } from "../../../lib/vocabLLM";

export async function POST(req) {
    const { exerciseId, text } = await req.json();
    if (!exerciseId || !text || !text.trim()) {
        return Response.json({ error: "exerciseId and text are required" }, { status: 400 });
    }

    try {
        // Re-run the grammar check server-side so we get the accepted forms
        // (the browser never sends them, so it can't fake or read the key).
        const result = await checkWithNlp(exerciseId, text);
        const items = result.unrecognised ?? [];

        // Nothing for the LLM to judge.
        if (items.length === 0) {
            return Response.json({ verdicts: [] });
        }

        const glossary = await loadGlossary();
        for (const item of items) {
            const strings = [item.text].concat(item.expected);
            item.glossary = findGlossaryEntries(glossary, strings);
        }

        const prompt = PROMPTS.find((p) => p.id === exerciseId);
        if (!prompt) {
            return Response.json({ error: "Unknown exercise" }, { status: 404 });
        }
        const messages = buildVocabMessages(prompt.english, result.text, items);
        // console.log(messages[0].content);   // system message: read once, then delete this line
        // console.log("-----");
        // console.log(messages[1].content);   // user message

        // // Server terminal only: `expected` must never go to the browser.
        // for (const item of items) {
        //     console.log(item.role, item.text, "expected:", item.expected,
        //                 "glossary:", item.glossary.map((g) => g.term));
        // }

        //Send prompt to LLM
        const raw = await askGemini(messages);
        const verdicts = parseVerdicts(raw, items);
        console.log("verdicts:", verdicts);
        return Response.json({ verdicts: verdicts });
    } 
    catch (error) {
        console.error("vocab route error:", error);
        // The grammar result is already on screen, so the client treats any failure as "no vocab feedback".
        return Response.json({ error: "Vocab check unavailable" }, { status: error.status === 404 ? 404 : 503 });
    }
}