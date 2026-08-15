"use client";

import { useEffect, useRef, useState } from "react";
import { botReply, ChatMessage, SEED_MESSAGES } from "../lib/risk";
import { chat as chatApi } from "../lib/api";

export function Chatbot() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>(SEED_MESSAGES);
  const [typing, setTyping] = useState(false);
  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  function scrollToBottom() {
    setTimeout(() => {
      const el = scrollRef.current;
      if (el) el.scrollTop = el.scrollHeight;
    }, 60);
  }

  useEffect(() => {
    if (open) scrollToBottom();
  }, [open]);

  async function send() {
    const text = input.trim();
    if (!text) return;
    const userMsg: ChatMessage = { id: "u" + Date.now(), from: "user", text };
    const priorHistory = messages;
    setMessages((m) => [...m, userMsg]);
    setInput("");
    setTyping(true);
    scrollToBottom();
    try {
      const { reply } = await chatApi(text, priorHistory);
      const botMsg: ChatMessage = { id: "b" + Date.now(), from: "bot", text: reply };
      setMessages((m) => [...m, botMsg]);
    } catch {
      // Network/backend down — fall back to the local canned reply so the
      // assistant still responds.
      const botMsg: ChatMessage = { id: "b" + Date.now(), from: "bot", text: botReply(text) };
      setMessages((m) => [...m, botMsg]);
    } finally {
      setTyping(false);
      scrollToBottom();
    }
  }

  return (
    <>
      {open && (
        <div
          style={{
            position: "fixed",
            bottom: 96,
            right: 26,
            zIndex: 60,
            width: 370,
            maxWidth: "calc(100vw - 40px)",
            height: 520,
            maxHeight: "calc(100vh - 130px)",
            background: "#fff",
            borderRadius: 22,
            boxShadow: "0 24px 60px rgba(31,40,51,.28)",
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
            animation: "sgPop .22s ease both",
          }}
        >
          <div
            style={{
              background: "linear-gradient(150deg,var(--sg-accent),var(--sg-accent-dk))",
              padding: "16px 18px",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 11 }}>
              <div
                style={{
                  width: 38,
                  height: 38,
                  borderRadius: 11,
                  background: "rgba(255,255,255,.16)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <svg width="20" height="20" viewBox="0 0 24 24">
                  <path d="M12 3v18" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" />
                  <circle cx="12" cy="6" r="1.6" fill="#fff" />
                  <circle cx="12" cy="12" r="1.6" fill="#fff" />
                  <circle cx="12" cy="18" r="1.6" fill="#fff" />
                </svg>
              </div>
              <div>
                <div style={{ fontSize: 15.5, fontWeight: 700, color: "#fff" }}>Ask SpineGuard AI</div>
                <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "rgba(255,255,255,.8)" }}>
                  <span style={{ width: 7, height: 7, borderRadius: "50%", background: "#7FE0A0" }} />
                  Online · here to help
                </div>
              </div>
            </div>
            <button
              onClick={() => setOpen(false)}
              className="sg-close-btn"
              style={{
                border: "none",
                background: "rgba(255,255,255,.15)",
                cursor: "pointer",
                width: 32,
                height: 32,
                borderRadius: 9,
                color: "#fff",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24">
                <path d="M6 6l12 12M18 6L6 18" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" />
              </svg>
            </button>
          </div>
          <div
            ref={scrollRef}
            style={{
              flex: 1,
              overflowY: "auto",
              padding: 18,
              display: "flex",
              flexDirection: "column",
              gap: 12,
              background: "#FBF7F0",
            }}
          >
            {messages.map((m) => (
              <div
                key={m.id}
                style={{ display: "flex", justifyContent: m.from === "user" ? "flex-end" : "flex-start" }}
              >
                <div
                  style={
                    m.from === "user"
                      ? {
                          maxWidth: "80%",
                          background: "var(--sg-accent)",
                          color: "#fff",
                          fontSize: 14.5,
                          lineHeight: 1.5,
                          padding: "11px 15px",
                          borderRadius: "15px 15px 4px 15px",
                        }
                      : {
                          maxWidth: "82%",
                          background: "#fff",
                          border: "1px solid rgba(38,48,59,.08)",
                          color: "#3E4A57",
                          fontSize: 14.5,
                          lineHeight: 1.55,
                          padding: "11px 15px",
                          borderRadius: "15px 15px 15px 4px",
                        }
                  }
                >
                  {m.text}
                </div>
              </div>
            ))}
            {typing && (
              <div
                style={{
                  alignSelf: "flex-start",
                  background: "#fff",
                  border: "1px solid rgba(38,48,59,.08)",
                  borderRadius: "15px 15px 15px 4px",
                  padding: "12px 16px",
                  display: "flex",
                  gap: 5,
                }}
              >
                <span style={{ width: 7, height: 7, borderRadius: "50%", background: "#B9C4D0", animation: "sgBlink 1.2s infinite" }} />
                <span style={{ width: 7, height: 7, borderRadius: "50%", background: "#B9C4D0", animation: "sgBlink 1.2s .2s infinite" }} />
                <span style={{ width: 7, height: 7, borderRadius: "50%", background: "#B9C4D0", animation: "sgBlink 1.2s .4s infinite" }} />
              </div>
            )}
          </div>
          <div
            style={{
              padding: "12px 14px",
              borderTop: "1px solid rgba(38,48,59,.08)",
              display: "flex",
              gap: 9,
              alignItems: "center",
              background: "#fff",
            }}
          >
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  send();
                }
              }}
              placeholder="Ask about IVDD, breeds, grades…"
              style={{
                flex: 1,
                padding: "12px 14px",
                border: "1.5px solid #E3DACC",
                borderRadius: 12,
                fontSize: 14.5,
                background: "#FCFAF6",
              }}
            />
            <button
              onClick={send}
              style={{
                flex: "none",
                width: 44,
                height: 44,
                borderRadius: 12,
                border: "none",
                background: "var(--sg-accent)",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <svg width="19" height="19" viewBox="0 0 24 24">
                <path d="M4 12l16-8-6 16-2-6-8-2z" fill="#fff" />
              </svg>
            </button>
          </div>
        </div>
      )}

      <button
        onClick={() => {
          setOpen((v) => !v);
          scrollToBottom();
        }}
        className="sg-fab"
        style={{
          position: "fixed",
          bottom: 26,
          right: 26,
          zIndex: 61,
          width: 60,
          height: 60,
          borderRadius: "50%",
          border: "none",
          background: "linear-gradient(150deg,var(--sg-accent-lt),var(--sg-accent-dk))",
          cursor: "pointer",
          boxShadow: "0 12px 28px rgba(47,107,214,.4)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {open ? (
          <svg width="24" height="24" viewBox="0 0 24 24">
            <path d="M6 6l12 12M18 6L6 18" stroke="#fff" strokeWidth="2.4" strokeLinecap="round" />
          </svg>
        ) : (
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none">
            <path
              d="M21 11.5a8.38 8.38 0 01-8.5 8.5 8.5 8.5 0 01-3.6-.8L3 21l1.9-5.4a8.5 8.5 0 01-.9-3.6A8.38 8.38 0 0112.5 3 8.38 8.38 0 0121 11.5z"
              stroke="#fff"
              strokeWidth="2"
              strokeLinejoin="round"
            />
          </svg>
        )}
      </button>
    </>
  );
}
