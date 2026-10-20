"use client";
import { useEffect, useRef, useState } from "react";
import Navbar from "../../components/Navbar/Navbar";
import "./translate.css";
import { useRouter } from "next/navigation";

const MODES = [
  { id: "text", label: "Text" },
  { id: "voice", label: "Voice" },
];
const MAX_CHARS = 2000;

const SHOW_DEMO = false;

const DEMO_ENGLISH =
  "Oil prices jump 4% as Houthis fire missiles at Saudi Arabia.";
const DEMO_RESULT = [
  [
    {
      zh: "纽约，9月24日——周四，油价大幅上涨约4%，",
      py: "Niǔ Yuē, jiǔ yuè èr shí sì rì zhōu sì, yóu jià dà fú shàng zhǎng yuē bǎi fēn zhī sì,",
    },
  ],
  [{ zh: "升至一周高位。", py: "shēng zhì yì zhōu gāo wèi." }],
  [
    {
      zh: "市场主要受到也门获伊朗支持的胡塞武装向",
      py: "Shì chǎng zhǔ yào shòu dào Yě Mén huò Yī Lǎng zhī chí de Hú Sāi wǔ zhuāng xiàng",
    },
  ],
  [{ zh: "沙特阿拉伯发射导弹，", py: "Shā Tè Ā Lā Bó fā shè dǎo dàn," }],
  [
    { zh: "以及美伊外交谈判", py: "yǐ jí Měi Yī wài jiāo tán pàn " },
    {
      zh: "进展甚微",
      py: "jìn zhǎn shèn wēi",
      hard: true,
      note: "Very little progress",
    },
    { zh: "、", py: ", " },
    {
      zh: "举步维艰",
      py: "jǔ bù wéi jiān",
      hard: true,
      note: "Progress is extremely difficult",
    },
    { zh: "的影响。", py: " de yǐng xiǎng." },
  ],
];

/* ---------- inline icons ---------- */
const IconPlus = () => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.5"
    strokeLinecap="round"
  >
    <path d="M12 5v14M5 12h14" />
  </svg>
);
const IconArrowUp = () => (
  <svg
    width="26"
    height="26"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.5"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M12 20V5M5 12l7-7 7 7" />
  </svg>
);
const IconPlay = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
    <path d="M6 4l14 8-14 8z" />
  </svg>
);
const IconClose = () => (
  <svg
    width="14"
    height="14"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.5"
    strokeLinecap="round"
  >
    <path d="M6 6l12 12M18 6L6 18" />
  </svg>
);

export default function TranslatePage() {
  const router = useRouter();
  const [mode, setMode] = useState("text");
  const [menuOpen, setMenuOpen] = useState(false);
  const [text, setText] = useState("");
  const [listening, setListening] = useState(false);
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(SHOW_DEMO ? DEMO_RESULT : null);
  const [english, setEnglish] = useState(SHOW_DEMO ? DEMO_ENGLISH : "");
  const [activeNote, setActiveNote] = useState(null);

  const recognitionRef = useRef(null);
  const menuRef = useRef(null);

  // close mode menu on outside click
  useEffect(() => {
    function onClick(e) {
      if (menuRef.current && !menuRef.current.contains(e.target))
        setMenuOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  // stop mic on unmount
  useEffect(() => {
    return () => recognitionRef.current?.stop();
  }, []);

  function chooseMode(id) {
    if (listening) stopListening();
    setMode(id);
    setMenuOpen(false);
    setStatus("");
  }

  function startListening() {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) {
      return setStatus(
        "Speech recognition is not supported in this browser. Use Chrome or Edge.",
      );
    }

    setText("");

    const rec = new SR();
    rec.lang = "en-US"; // source language; change if needed
    rec.continuous = true;
    rec.interimResults = true;

    rec.onstart = () => {
      setListening(true);
      setStatus("");
    };
    rec.onresult = (e) => {
      let t = "";
      for (let i = 0; i < e.results.length; i++) {
        t += e.results[i][0].transcript;
      }
      setText(t.slice(0, MAX_CHARS));
    };
    rec.onerror = (e) => {
      setStatus(`Microphone error: ${e.error}`);
      setListening(false);
    };
    rec.onend = () => setListening(false);

    recognitionRef.current = rec;
    rec.start();
  }

  function stopListening() {
    recognitionRef.current?.stop();
    setListening(false);
  }

  function clearInput() {
    recognitionRef.current?.stop();
    setListening(false);
    setText("");
    setStatus("");
  }

  async function runTranslate(payload) {
    setLoading(true);
    setStatus("Translating…");
    try {
      const res = await fetch("/api/translate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Translation failed.");
      setResult(data.lines);
      setEnglish(data.english || "");
      setActiveNote(null);
      setStatus("");
    } catch (err) {
      setStatus(err.message || "Translation failed.");
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit() {
    if (loading) return;
    setStatus("");
    if (listening) return setStatus("Stop recording first.");
    if (!text.trim())
      return setStatus(
        mode === "voice" ? "Record something first." : "Enter some text first.",
      );
    return runTranslate({ type: "text", content: text.trim() });
  }

  function handleNext() {
    if (!result) return;

    const chineseText = result
      .map((line) => line.map((segment) => segment.zh).join(""))
      .join("\n");

    const params = new URLSearchParams({
      text: chineseText,
      english: english || "",
    });

    router.push(`/conversation?${params.toString()}`);
  }

  function playChinese() {
    if (!result || typeof window === "undefined" || !window.speechSynthesis)
      return;
    const full = result.map((line) => line.map((s) => s.zh).join("")).join("");
    const u = new SpeechSynthesisUtterance(full);
    u.lang = "zh-CN";
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(u);
  }

  const hasValue = !!text;

  return (
    <div className="tr-page">
      <Navbar />

      <main className="tr-main">
        <header className="tr-head">
          <h1 className="tr-title">Chinese Adapter</h1>
          <p className="tr-sub">Type or speak to translate it to Chinese</p>
        </header>

        <div className="tr-body">
          {result && (
            <section className="tr-result" aria-label="Translation result">
              {result.map((line, i) => (
                <div className="tr-line" key={i}>
                  <p className="tr-zh">
                    {line.map((s, j) =>
                      s.hard ? (
                        <span className="tr-hard-wrap" key={j}>
                          <button
                            type="button"
                            className="tr-hard"
                            onClick={() =>
                              setActiveNote(
                                activeNote === `${i}-${j}` ? null : `${i}-${j}`,
                              )
                            }
                          >
                            {s.zh}
                          </button>
                          {activeNote === `${i}-${j}` && (
                            <span className="tr-note">{s.note}</span>
                          )}
                        </span>
                      ) : (
                        <span key={j}>{s.zh}</span>
                      ),
                    )}
                  </p>
                  <p className="tr-py">
                    {line.map((s, j) => (
                      <span key={j} className={s.hard ? "tr-py-hard" : ""}>
                        {s.py}
                      </span>
                    ))}
                  </p>
                </div>
              ))}
              <div className="tr-play-row">
                <button
                  type="button"
                  className="tr-play"
                  onClick={playChinese}
                  aria-label="Play Chinese audio"
                >
                  <IconPlay />
                </button>
                {english && <p className="tr-english">{english}</p>}
              </div>
            </section>
          )}

          <div className="tr-input-area">
            <div className="tr-label-row">
              <span className="tr-label">Type or speak to translate</span>
              <span className="tr-count">
                {text.length}/{MAX_CHARS}
              </span>
            </div>

            <div className="tr-bar">
              <div className="tr-menu-wrap" ref={menuRef}>
                <button
                  type="button"
                  className="tr-attach"
                  onClick={() => setMenuOpen((v) => !v)}
                  aria-label="Choose input type"
                  aria-expanded={menuOpen}
                >
                  <IconPlus />
                </button>
                {menuOpen && (
                  <ul className="tr-menu" role="menu">
                    {MODES.map((m) => (
                      <li key={m.id}>
                        <button
                          type="button"
                          role="menuitem"
                          className={`tr-menu-item ${mode === m.id ? "is-active" : ""}`}
                          onClick={() => chooseMode(m.id)}
                        >
                          {m.label}
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <div className="tr-field">
                {mode === "text" && (
                  <input
                    className="tr-input"
                    type="text"
                    value={text}
                    maxLength={MAX_CHARS}
                    onChange={(e) => setText(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
                    placeholder="Type or paste text to translate"
                  />
                )}

                {mode === "voice" && (
                  <div className="tr-voice">
                    <button
                      type="button"
                      className={`tr-file-btn ${listening ? "is-rec" : ""}`}
                      onClick={listening ? stopListening : startListening}
                    >
                      {listening
                        ? "● Stop"
                        : text
                          ? "Record again"
                          : "Start recording"}
                    </button>
                    <input
                      className="tr-input"
                      type="text"
                      value={text}
                      maxLength={MAX_CHARS}
                      onChange={(e) => setText(e.target.value)}
                      placeholder={
                        listening ? "Listening…" : "Your speech appears here"
                      }
                    />
                  </div>
                )}
              </div>

              {hasValue && (
                <button
                  type="button"
                  className="tr-clear"
                  onClick={clearInput}
                  aria-label="Clear input"
                >
                  <IconClose />
                </button>
              )}

              <button
                type="button"
                className="tr-send"
                onClick={handleSubmit}
                disabled={loading}
                aria-label="Translate"
              >
                <IconArrowUp />
              </button>
            </div>

            {status && (
              <p className="tr-status" role="status">
                {status}
              </p>
            )}

            {result && (
              <div className="tr-next-row">
                <button type="button" className="tr-next" onClick={handleNext}>
                  Next
                </button>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}