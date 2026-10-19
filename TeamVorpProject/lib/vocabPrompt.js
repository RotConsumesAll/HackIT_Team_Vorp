const SYSTEM = `You check word choice in a Chinese sentence written by a learner in Singapore.
The learner is translating an English sentence into casual, spoken Singapore Mandarin.

Scope: judge ONLY the words listed by the user. Do not comment on grammar, word order, or missing words.

For each listed word, compare it with the accepted forms and give one verdict:
- equivalent: same meaning, and fits as well as an accepted form.
- less_natural: correct meaning, but a different register or less local than the accepted forms.
- different_meaning: a real word, but it means something other than what the English sentence asks for.
- incorrect: not a real word, or used wrongly.
- uncertain: you are not sure. Use this whenever you are unsure.

Glossary entries are verified local Singapore usage. A word that matches a glossary entry is correct local usage, not an error.

Reply with JSON only, no other text. The format is below. The content is only an example of the format.
{"verdicts":[{"token":3,"word":"咖啡","verdict":"different_meaning","suggestion":"茶","reason":"咖啡 means coffee, but the sentence is about tea."}]}

"token" must be the number given for the word. "suggestion" is an accepted form, or "" if none fits. "reason" is one short English sentence for a learner.`;

export function buildVocabMessages(english, sentence, items) {
    let wordLines = "";
    let glossaryLines = "";
    const seen = {};

    for (const item of items) {
        wordLines += `- token ${item.tokens[0]}: "${item.text}" (role: ${item.role}). Accepted forms: ${item.expected.join(", ")}\n`;

        for (const g of item.glossary) {
            if (seen[g.id]) continue; // list each glossary entry once
            seen[g.id] = true;

            let standard = "none";
            if (g.standardEquivalent) standard = g.standardEquivalent;

            glossaryLines += `- ${g.term} (${g.posTag}): ${g.definition} Standard equivalent: ${standard}. Tone: ${g.tone}. Origin: ${g.originNote}\n`;
        }
    }

    if (glossaryLines === "") glossaryLines = "- No glossary entries apply.\n";

    const user = `English sentence: ${english}
    Learner's sentence: ${sentence}

    Words to judge:
    ${wordLines}
    Glossary:
    ${glossaryLines}
    Return the JSON now.`;

    return [
        { role: "system", content: SYSTEM },
        { role: "user", content: user },
    ];
}