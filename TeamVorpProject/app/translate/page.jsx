"use client";
import { useEffect, useRef, useState } from "react";
import Navbar from "../components/Navbar/Navbar"; 
import "./translate.css";
import { useRouter } from "next/navigation";

const MODES = [
  { id: "text", label: "Text" },
  { id: "voice", label: "Voice" },
  { id: "audio", label: "Audio" },
  { id: "video", label: "Video" },
  { id: "website", label: "Website" },
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
  const [url, setUrl] = useState("");
  const [audioFile, setAudioFile] = useState(null);
  const [videoFile, setVideoFile] = useState(null);
  const [recording, setRecording] = useState(false);
  const [recordedUrl, setRecordedUrl] = useState("");
  const [hasRecording, setHasRecording] = useState(false);
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(SHOW_DEMO ? DEMO_RESULT : null);
  const [english, setEnglish] = useState(SHOW_DEMO ? DEMO_ENGLISH : "");
  const [activeNote, setActiveNote] = useState(null);

  const recorderRef = useRef(null);
  const chunksRef = useRef([]);
  const audioInputRef = useRef(null);
  const videoInputRef = useRef(null);
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

  // cleanup recording URL + mic on unmount
  useEffect(() => {
    return () => {
      if (recordedUrl) URL.revokeObjectURL(recordedUrl);
      if (recorderRef.current && recorderRef.current.state !== "inactive") {
        recorderRef.current.stop();
      }
    };
  }, [recordedUrl]);

  function chooseMode(id) {
    setMode(id);
    setMenuOpen(false);
    setStatus("");
  }

  async function startRecording() {
    setStatus("");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const rec = new MediaRecorder(stream);
      chunksRef.current = [];
      rec.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };
      rec.onstop = () => {
        const blob = new Blob(chunksRef.current, {
          type: rec.mimeType || "audio/webm",
        });
        setRecordedUrl(URL.createObjectURL(blob));
        setHasRecording(true);
        stream.getTracks().forEach((t) => t.stop());
      };
      recorderRef.current = rec;
      rec.start();
      setRecording(true);
    } catch (err) {
      setStatus("Could not access the microphone. Check browser permissions.");
    }
  }

  function stopRecording() {
    if (recorderRef.current && recorderRef.current.state !== "inactive") {
      recorderRef.current.stop();
    }
    setRecording(false);
  }

  function clearInput() {
    if (mode === "text") setText("");
    if (mode === "website") setUrl("");
    if (mode === "audio") {
      setAudioFile(null);
      if (audioInputRef.current) audioInputRef.current.value = "";
    }
    if (mode === "video") {
      setVideoFile(null);
      if (videoInputRef.current) videoInputRef.current.value = "";
    }
    if (mode === "voice") {
      setRecordedUrl("");
      setHasRecording(false);
    }
    setStatus("");
  }

  function isValidUrl(value) {
    try {
      const u = new URL(value);
      return u.protocol === "http:" || u.protocol === "https:";
    } catch {
      return false;
    }
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
    if (mode === "text") {
      if (!text.trim()) return setStatus("Enter some text first.");
      return runTranslate({ type: "text", content: text.trim() });
    }
    if (mode === "website") {
      if (!url.trim()) return setStatus("Enter a website link first.");
      if (!isValidUrl(url.trim()))
        return setStatus(
          "Enter a valid link starting with http:// or https://",
        );
      return runTranslate({ type: "website", content: url.trim() });
    }
    if (mode === "audio") {
      if (!audioFile) return setStatus("Choose an audio file first.");
      return setStatus(
        "Audio is ready, but transcription is not implemented yet.",
      );
    }
    if (mode === "video") {
      if (!videoFile) return setStatus("Choose a video file first.");
      return setStatus(
        "Video is ready, but transcription is not implemented yet.",
      );
    }
    if (mode === "voice") {
      if (recording) return setStatus("Stop recording first.");
      if (!hasRecording) return setStatus("Record something first.");
      return setStatus(
        "Recording is ready, but transcription is not implemented yet.",
      );
    }
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

  const hasValue =
    (mode === "text" && text) ||
    (mode === "website" && url) ||
    (mode === "audio" && audioFile) ||
    (mode === "video" && videoFile) ||
    (mode === "voice" && hasRecording);

  return (
    <div className="tr-page">
      <Navbar />

      <main className="tr-main">
        <header className="tr-head">
          <h1 className="tr-title">Chinese Adapter</h1>
          <p className="tr-sub">Upload a content to translate it to Chinese</p>
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
              <span className="tr-label">
                File text or link are all accepted
              </span>
              {mode === "text" && (
                <span className="tr-count">
                  {text.length}/{MAX_CHARS}
                </span>
              )}
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

                {mode === "website" && (
                  <input
                    className="tr-input"
                    type="url"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
                    placeholder="https://example.com/article"
                  />
                )}

                {mode === "audio" && (
                  <>
                    <input
                      ref={audioInputRef}
                      type="file"
                      accept="audio/*"
                      hidden
                      onChange={(e) =>
                        setAudioFile(e.target.files?.[0] || null)
                      }
                    />
                    <button
                      type="button"
                      className="tr-file-btn"
                      onClick={() => audioInputRef.current?.click()}
                    >
                      {audioFile ? audioFile.name : "Choose audio file"}
                    </button>
                  </>
                )}

                {mode === "video" && (
                  <>
                    <input
                      ref={videoInputRef}
                      type="file"
                      accept="video/*"
                      hidden
                      onChange={(e) =>
                        setVideoFile(e.target.files?.[0] || null)
                      }
                    />
                    <button
                      type="button"
                      className="tr-file-btn"
                      onClick={() => videoInputRef.current?.click()}
                    >
                      {videoFile ? videoFile.name : "Choose video file"}
                    </button>
                  </>
                )}

                {mode === "voice" && (
                  <div className="tr-voice">
                    {!recording ? (
                      <button
                        type="button"
                        className="tr-file-btn"
                        onClick={startRecording}
                      >
                        {hasRecording ? "Record again" : "Start recording"}
                      </button>
                    ) : (
                      <button
                        type="button"
                        className="tr-file-btn is-rec"
                        onClick={stopRecording}
                      >
                        ● Stop recording
                      </button>
                    )}
                    {hasRecording && !recording && recordedUrl && (
                      <audio className="tr-audio" controls src={recordedUrl} />
                    )}
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
