
"use client";

import { useEffect, useRef, useState } from "react";
import "./conversation.css";
import { speakChinese, stopChineseSpeech } from "../../lib/speech";

export default function ConversationClient() {
  const [autoSpeak, setAutoSpeak] = useState(true);
  const [translatedText, setTranslatedText] = useState("");
  const [englishText, setEnglishText] = useState("");
  const [scenario, setScenario] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [starting, setStarting] = useState(true);
  const [error, setError] = useState("");
  const [flashcard, setFlashcard] = useState(null);
  const [listening, setListening] = useState(false);

  const bottomRef = useRef(null);
  const recognitionRef = useRef(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const chinese = params.get("text") || "";
    const english = params.get("english") || "";

    setTranslatedText(chinese);
    setEnglishText(english);

    if (!chinese.trim()) {
      setError("No translated text was provided. Please return to Translate.");
      setStarting(false);
      return;
    }

    let cancelled = false;

    async function startConversation() {
      try {
        const response = await fetch("/api/conversation", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "start",
            translatedText: chinese,
          }),
        });

        const data = await response.json();
        if (data.reply && autoSpeak) {
  speakChinese(data.reply);
}

        if (!response.ok) {
          throw new Error(data.error || "Could not start conversation.");
        }

        if (cancelled) return;

        setScenario(data.scenario);
        setMessages([
          {
            id: crypto.randomUUID(),
            role: "assistant",
            text: data.reply,
            corrections: [],
            vocab: data.vocab || [],
          },
        ]);
      } catch (err) {
        if (!cancelled) {
          setError(err.message || "Could not start conversation.");
        }
      } finally {
        if (!cancelled) setStarting(false);
      }
    }

    startConversation();

    return () => {
      cancelled = true;
      recognitionRef.current?.stop();
    };
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  async function sendMessage(event) {
    event?.preventDefault();

    const message = input.trim();

    if (!message || loading || !scenario) return;

    setInput("");
    setError("");
    setLoading(true);

    try {
      const history = messages.map((item) => ({
        role: item.role === "assistant" ? "model" : "user",
        text: item.text,
      }));

      const response = await fetch("/api/conversation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "reply",
          translatedText,
          englishText,
          scenario,
          history,
          message,
        }),
      });

      const data = await response.json();
      if (data.reply && autoSpeak) {
  speakChinese(data.reply);
}

      if (!response.ok) {
        throw new Error(data.error || "Could not send message.");
      }

      setMessages((previous) => [
        ...previous,
        {
          id: crypto.randomUUID(),
          role: "user",
          text: message,
          corrections: data.corrections || [],
          vocab: [],
        },
        {
          id: crypto.randomUUID(),
          role: "assistant",
          text: data.reply,
          corrections: [],
          vocab: data.vocab || [],
        },
      ]);
    } catch (err) {
      setInput(message);
      setError(err.message || "Could not send message.");
    } finally {
      setLoading(false);
    }
  }

  function toggleMicrophone() {
    if (listening) {
      recognitionRef.current?.stop();
      setListening(false);
      return;
    }

    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setError(
        "Speech recognition is not supported in this browser. Try a supported browser or type your reply."
      );
      return;
    }

    const recognition = new SpeechRecognition();

    recognition.lang = "zh-CN";
    recognition.continuous = false;
    recognition.interimResults = true;

    recognition.onstart = () => {
      setListening(true);
      setError("");
    };

    recognition.onresult = (event) => {
      let transcript = "";

      for (let i = event.resultIndex; i < event.results.length; i++) {
        transcript += event.results[i][0].transcript;
      }

      setInput(transcript);
    };

    recognition.onerror = (event) => {
      setError(`Microphone error: ${event.error}`);
      setListening(false);
    };

    recognition.onend = () => setListening(false);

    recognitionRef.current = recognition;
    recognition.start();
  }

  function renderReply(message) {
    const words = [...(message.vocab || [])]
      .filter((item) => item.zh)
      .sort((a, b) => b.zh.length - a.zh.length);

    if (!words.length) return message.text;

    const pattern = new RegExp(
      `(${words.map((item) =>
        item.zh.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
      ).join("|")})`,
      "g"
    );

    return message.text.split(pattern).map((part, index) => {
      const word = words.find((item) => item.zh === part);

      if (!word) return part;

      return (
        <button
          className="vocab-word"
          type="button"
          key={`${part}-${index}`}
          onClick={() => setFlashcard(word)}
          title="Click to see the meaning"
        >
          {part}
        </button>
      );
    });
  }

  return (
    <main className="conversation-page">
      <header className="conversation-header">
        <a className="back-link" href="/translate">
          ← Back to Translate
        </a>

        <div className="conversation-heading">
          <span className="conversation-icon">对话</span>
          <div>
            <h1>Chinese Conversation</h1>
            <p>Practise Chinese with your AI partner</p>
          </div>
        </div>
      </header>

      <div className="conversation-layout">
        <section className="chat-panel">
          {scenario && (
            <div className="scenario-card">
              <span className="scenario-label">YOUR SCENARIO</span>
              <h2>{scenario.title}</h2>
              <p>{scenario.description}</p>
            </div>
          )}

          <div className="chat-messages">
            {starting && (
              <div className="chat-status">
                Creating your conversation scenario...
              </div>
            )}

            {error && (
              <div className="conversation-error" role="alert">
                {error}
              </div>
            )}

            {messages.map((message) => (
              <div
                className={`message-row ${
                  message.role === "user" ? "user-row" : "assistant-row"
                }`}
                key={message.id}
              >
                <div className="message-content">
                  <span className="message-sender">
                    {message.role === "user" ? "You" : "AI Partner"}
                  </span>

                  <div className="message-bubble">
                    {message.role === "assistant"
                      ? renderReply(message)
                      : message.text}
                  </div>

                  {message.corrections?.length > 0 && (
                    <div className="corrections-card">
                      <h3>Gentle corrections</h3>

                      {message.corrections.map((correction, index) => (
                        <div
                          className="correction-item"
                          key={`${correction.original}-${index}`}
                        >
                          <p>
                            <span className="correction-label">
                              You said
                            </span>
                            {correction.original}
                          </p>

                          <p>
                            <span className="correction-label">
                              More natural
                            </span>
                            {correction.corrected}
                          </p>

                          <p className="correction-explanation">
                            {correction.explanation}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}

            {loading && (
              <div className="chat-status">
                AI is thinking...
              </div>
            )}

            <div ref={bottomRef} />
          </div>

          <form className="chat-composer" onSubmit={sendMessage}>
            <button
              className={`microphone-button ${listening ? "is-listening" : ""}`}
              type="button"
              onClick={toggleMicrophone}
              disabled={starting || loading}
              aria-label="Record Chinese speech"
              title="Speak in Chinese"
            >
              {listening ? "■" : "🎙"}
            </button>

            <input
              value={input}
              onChange={(event) => setInput(event.target.value)}
              placeholder={
                listening
                  ? "Listening to your Chinese..."
                  : "Type your reply in Chinese..."
              }
              disabled={starting || loading || !scenario}
              aria-label="Your Chinese reply"
            />

            <button
              className="send-button"
              type="submit"
              disabled={!input.trim() || starting || loading || !scenario}
            >
              Send
            </button>
          </form>

          <p className="composer-hint">
            Speak or type in Chinese. Click highlighted words to learn more.
          </p>
        </section>

        <aside className="learning-panel">
          <h2>Word explorer</h2>
          <p className="panel-description">
            Click a highlighted word in the conversation to see its meaning.
          </p>

          {flashcard ? (
            <div className="vocabulary-card">
              <span className="flashcard-label">VOCABULARY</span>
              <h3>{flashcard.zh}</h3>
              <p className="vocabulary-pinyin">{flashcard.py}</p>
              <div className="flashcard-divider" />
              <p className="vocabulary-meaning">{flashcard.en}</p>

              <button
                type="button"
                className="close-card-button"
                onClick={() => setFlashcard(null)}
              >
                Close card
              </button>
            </div>
          ) : (
            <div className="empty-flashcard">
              <span>词</span>
              <p>Your vocabulary cards will appear here.</p>
              <p>Click a highlighted Chinese word to explore it.</p>
            </div>
          )}

          <div className="source-card">
            <h3>Learning material</h3>
            <p>{translatedText}</p>
            {englishText && (
              <details>
                <summary>View English meaning</summary>
                <p>{englishText}</p>
              </details>
            )}
          </div>
        </aside>
      </div>
    </main>
  );
}
