// allTerms: array of glossary entries; strings: the learner's word + its accepted forms
export function findGlossaryEntries(allTerms, strings) {
    const found = [];

    for (const entry of allTerms) {
        for (const s of strings) {
            if (s.includes(entry.term)) {
            found.push(entry);
            break; // one hit is enough, don't add the same entry twice
            }
        }
    }
    return found;
}