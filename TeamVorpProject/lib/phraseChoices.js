export function phraseChoices(q) {
  const saved = Array.isArray(q.save) ? q.save : Object.values(q.save || {});

  if (saved.length > 0) {
    return saved.map((p) => ({
      chinese: p.chinese,
      pinyin: p.pinyin || "",
      meaning: p.meaning || "",
    }));
  }

  const text = q.quizType === "measure" ? "一" + q.answerText + q.prompt : q.prompt;
  return text ? [{ chinese: text, pinyin: "", meaning: "" }] : [];
}