
"use client";

export function speakChinese(text) {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) {
    return false;
  }

  const cleanText = String(text ?? "").trim();

  if (!cleanText) return false;

  // Stop the previous utterance before speaking the latest reply.
  window.speechSynthesis.cancel();

  const utterance = new SpeechSynthesisUtterance(cleanText);
  utterance.lang = "zh-CN";
  utterance.rate = 0.9;
  utterance.pitch = 1;
  utterance.volume = 1;

  const voices = window.speechSynthesis.getVoices();

  // Prefer a Mandarin Chinese voice when the device provides one.
  const chineseVoice = voices.find(
    (voice) =>
      /^zh(-|_)/i.test(voice.lang) &&
      /mandarin|chinese|中文|普通话/i.test(voice.name)
  ) || voices.find((voice) => /^zh(-|_)/i.test(voice.lang));

  if (chineseVoice) {
    utterance.voice = chineseVoice;
  }

  window.speechSynthesis.speak(utterance);
  return true;
}

export function stopChineseSpeech() {
  if (typeof window !== "undefined" && "speechSynthesis" in window) {
    window.speechSynthesis.cancel();
  }
}
