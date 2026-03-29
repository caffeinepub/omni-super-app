import { STORY_TEMPLATES, analyzeMood, getAIResponse } from "@/lib/mockData";
import { BookOpen, Brain, Globe, Send, Zap } from "lucide-react";
import { useEffect, useRef, useState } from "react";

interface ChatMessage {
  id: string;
  role: "user" | "ai";
  content: string;
}
interface MoodEntry {
  text: string;
  mood: string;
  emoji: string;
  confidence: number;
  color: string;
  ts: number;
}

const LANGUAGES = [
  "Turkish → English",
  "English → Turkish",
  "English → Spanish",
  "Spanish → English",
  "Arabic → English",
];

const MOCK_TRANSLATIONS: Record<string, string> = {
  "Turkish → English": (t: string) =>
    `[EN] ${
      t
        .replace(/merhaba/gi, "hello")
        .replace(/nasılsın/gi, "how are you")
        .replace(/teşekkür/gi, "thank you")
        .replace(/güzel/gi, "beautiful") || "Translation complete."
    }`,
  "English → Turkish": (t: string) =>
    `[TR] ${
      t
        .replace(/hello/gi, "merhaba")
        .replace(/thanks/gi, "teşekkürler")
        .replace(/good/gi, "iyi")
        .replace(/beautiful/gi, "güzel") || "Çeviri tamamlandı."
    }`,
  "English → Spanish": (t: string) =>
    `[ES] ${
      t
        .replace(/hello/gi, "hola")
        .replace(/thanks/gi, "gracias")
        .replace(/good/gi, "bueno")
        .replace(/beautiful/gi, "hermosa") || "Traducción completa."
    }`,
  "Spanish → English": (t: string) =>
    `[EN] ${
      t
        .replace(/hola/gi, "hello")
        .replace(/gracias/gi, "thanks")
        .replace(/bueno/gi, "good") || "Translation complete."
    }`,
  "Arabic → English": (t: string) =>
    `[EN] Translation from Arabic: "${t}" — Powered by OMNI AI`,
} as unknown as Record<string, string>;

function applyTranslation(lang: string, text: string): string {
  const fn = (
    MOCK_TRANSLATIONS as unknown as Record<string, (t: string) => string>
  )[lang];
  return fn ? fn(text) : `[Translated] ${text}`;
}

export function AIModule() {
  const [activeTab, setActiveTab] = useState<
    "assistant" | "mood" | "translate" | "story"
  >("assistant");

  // Assistant
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "init",
      role: "ai",
      content:
        'Hey there, anonymous one 👋 I\'m OMNI AI. How can I assist you today? Type "help" to see all features.',
    },
  ]);
  const [chatInput, setChatInput] = useState("");
  const [aiTyping, setAiTyping] = useState(false);
  const msgEndRef = useRef<HTMLDivElement>(null);

  // Mood
  const [moodInput, setMoodInput] = useState("");
  const [moodResult, setMoodResult] = useState<{
    mood: string;
    emoji: string;
    confidence: number;
    color: string;
  } | null>(null);
  const [moodHistory, setMoodHistory] = useState<MoodEntry[]>([]);
  const [analyzingMood, setAnalyzingMood] = useState(false);

  // Translate
  const [sourceLang, setSourceLang] = useState(LANGUAGES[0]);
  const [sourceText, setSourceText] = useState("");
  const [translated, setTranslated] = useState("");
  const [translating, setTranslating] = useState(false);

  // Story
  const [storyPrompt, setStoryPrompt] = useState("");
  const [story, setStory] = useState("");
  const storyParts = story
    .split("**")
    .map((text, idx) => ({ id: `sp${idx}`, text, bold: idx % 2 === 1 }));
  const [generating, setGenerating] = useState(false);

  // biome-ignore lint/correctness/useExhaustiveDependencies: msgEndRef is a stable ref, no need in deps
  useEffect(() => {
    msgEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendChat = () => {
    if (!chatInput.trim()) return;
    const userMsg: ChatMessage = {
      id: `u${Date.now()}`,
      role: "user",
      content: chatInput,
    };
    setMessages((m) => [...m, userMsg]);
    setChatInput("");
    setAiTyping(true);
    setTimeout(
      () => {
        const response = getAIResponse(userMsg.content);
        setMessages((m) => [
          ...m,
          { id: `a${Date.now()}`, role: "ai", content: response },
        ]);
        setAiTyping(false);
      },
      800 + Math.random() * 800,
    );
  };

  const handleAnalyzeMood = () => {
    if (!moodInput.trim()) return;
    setAnalyzingMood(true);
    setTimeout(() => {
      const result = analyzeMood(moodInput);
      setMoodResult(result);
      setMoodHistory((h) =>
        [{ text: moodInput, ...result, ts: Date.now() }, ...h].slice(0, 5),
      );
      setAnalyzingMood(false);
    }, 1200);
  };

  const handleTranslate = () => {
    if (!sourceText.trim()) return;
    setTranslating(true);
    setTimeout(() => {
      setTranslated(applyTranslation(sourceLang, sourceText));
      setTranslating(false);
    }, 1000);
  };

  const handleGenerateStory = () => {
    if (!storyPrompt.trim()) return;
    setGenerating(true);
    setTimeout(() => {
      const template =
        STORY_TEMPLATES[Math.floor(Math.random() * STORY_TEMPLATES.length)];
      setStory(template(storyPrompt));
      setGenerating(false);
    }, 1500);
  };

  return (
    <div className="flex flex-col h-full animate-fade-in">
      {/* Tabs */}
      <div
        className="flex px-4 py-3 gap-1 flex-shrink-0 overflow-x-auto scrollbar-hide"
        style={{ borderBottom: "1px solid #1A2030" }}
      >
        {[
          { id: "assistant", icon: Zap, label: "AI Chat" },
          { id: "mood", icon: Brain, label: "Mood" },
          { id: "translate", icon: Globe, label: "Translate" },
          { id: "story", icon: BookOpen, label: "Story" },
        ].map(({ id, icon: Icon, label }) => (
          <button
            type="button"
            key={id}
            onClick={() => setActiveTab(id as typeof activeTab)}
            className="flex-shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold tracking-wider transition-all"
            style={{
              background:
                activeTab === id ? "rgba(25,230,255,0.1)" : "transparent",
              color: activeTab === id ? "#19E6FF" : "#4A5568",
              border: `1px solid ${activeTab === id ? "rgba(25,230,255,0.3)" : "transparent"}`,
            }}
          >
            <Icon size={12} />
            {label}
          </button>
        ))}
      </div>

      {/* ASSISTANT */}
      {activeTab === "assistant" && (
        <div className="flex flex-col flex-1 overflow-hidden">
          <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3 scrollbar-hide">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"} animate-fade-in`}
              >
                {msg.role === "ai" && (
                  <div
                    className="w-7 h-7 rounded-full flex items-center justify-center mr-2 flex-shrink-0 mt-1"
                    style={{
                      background: "rgba(25,230,255,0.15)",
                      border: "1px solid rgba(25,230,255,0.4)",
                    }}
                  >
                    <span className="text-xs" style={{ color: "#19E6FF" }}>
                      AI
                    </span>
                  </div>
                )}
                <div
                  className="max-w-[80%] px-3 py-2 rounded-2xl text-sm"
                  style={{
                    background:
                      msg.role === "user" ? "rgba(25,230,255,0.15)" : "#151A26",
                    border: `1px solid ${msg.role === "user" ? "rgba(25,230,255,0.3)" : "#2A3142"}`,
                    color: "#F2F4FF",
                    whiteSpace: "pre-line",
                    lineHeight: "1.6",
                  }}
                >
                  {msg.content}
                </div>
              </div>
            ))}
            {aiTyping && (
              <div className="flex items-center gap-2">
                <div
                  className="w-7 h-7 rounded-full flex items-center justify-center"
                  style={{
                    background: "rgba(25,230,255,0.15)",
                    border: "1px solid rgba(25,230,255,0.4)",
                  }}
                >
                  <span className="text-xs" style={{ color: "#19E6FF" }}>
                    AI
                  </span>
                </div>
                <div
                  className="flex gap-1 px-3 py-2 rounded-2xl"
                  style={{ background: "#151A26" }}
                >
                  {[0, 1, 2].map((dot) => (
                    <div
                      key={dot}
                      className="w-2 h-2 rounded-full animate-pulse"
                      style={{
                        background: "#19E6FF",
                        animationDelay: `${dot * 0.2}s`,
                      }}
                    />
                  ))}
                </div>
              </div>
            )}
            <div ref={msgEndRef} />
          </div>
          <div
            className="px-4 py-3 flex gap-2 flex-shrink-0"
            style={{ borderTop: "1px solid #1A2030" }}
          >
            <input
              type="text"
              placeholder="Ask OMNI AI anything..."
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && sendChat()}
              className="flex-1 px-4 py-2 rounded-xl text-sm outline-none"
              style={{
                background: "#151A26",
                border: "1px solid #2A3142",
                color: "#F2F4FF",
                caretColor: "#19E6FF",
              }}
            />
            <button
              type="button"
              onClick={sendChat}
              className="p-2 rounded-xl"
              style={{
                background: "rgba(25,230,255,0.15)",
                border: "1px solid rgba(25,230,255,0.3)",
              }}
            >
              <Send size={16} style={{ color: "#19E6FF" }} />
            </button>
          </div>
        </div>
      )}

      {/* MOOD */}
      {activeTab === "mood" && (
        <div className="flex-1 overflow-y-auto px-4 py-4 scrollbar-hide">
          <div className="text-center mb-6">
            <h2
              className="text-lg font-black tracking-wider mb-1"
              style={{ color: "#F2F4FF" }}
            >
              MOOD ANALYZER
            </h2>
            <p className="text-xs" style={{ color: "#A7ACBE" }}>
              AI detects your emotional tone
            </p>
          </div>
          <textarea
            placeholder="Type anything and I'll analyze your mood..."
            value={moodInput}
            onChange={(e) => setMoodInput(e.target.value)}
            rows={4}
            className="w-full px-4 py-3 rounded-xl text-sm outline-none resize-none mb-4"
            style={{
              background: "#151A26",
              border: "1px solid #2A3142",
              color: "#F2F4FF",
              caretColor: "#B56BFF",
            }}
          />
          <button
            type="button"
            onClick={handleAnalyzeMood}
            disabled={!moodInput.trim() || analyzingMood}
            className="w-full py-3 rounded-xl font-bold text-sm mb-6 btn-neon-purple"
            style={{ opacity: !moodInput.trim() ? 0.5 : 1 }}
          >
            {analyzingMood ? "ANALYZING..." : "ANALYZE MY MOOD"}
          </button>

          {moodResult && (
            <div
              className="p-5 rounded-2xl text-center mb-6 animate-fade-in"
              style={{
                background: "#151A26",
                border: `2px solid ${moodResult.color}`,
                boxShadow: `0 0 20px ${moodResult.color}30`,
              }}
            >
              <div className="text-5xl mb-3">{moodResult.emoji}</div>
              <p
                className="text-2xl font-black tracking-wider"
                style={{ color: moodResult.color }}
              >
                {moodResult.mood.toUpperCase()}
              </p>
              <p className="text-sm mt-1" style={{ color: "#A7ACBE" }}>
                Confidence: {moodResult.confidence}%
              </p>
              <div
                className="mt-3 h-2 rounded-full overflow-hidden"
                style={{ background: "#0E1320" }}
              >
                <div
                  className="h-full rounded-full transition-all"
                  style={{
                    width: `${moodResult.confidence}%`,
                    background: moodResult.color,
                  }}
                />
              </div>
            </div>
          )}

          {moodHistory.length > 0 && (
            <div>
              <p
                className="text-xs font-bold tracking-wider mb-3"
                style={{ color: "#A7ACBE" }}
              >
                MOOD HISTORY
              </p>
              <div className="space-y-2">
                {moodHistory.map((m) => (
                  <div
                    key={m.ts}
                    className="flex items-center gap-3 p-3 rounded-xl"
                    style={{
                      background: "#151A26",
                      border: "1px solid #2A3142",
                    }}
                  >
                    <span className="text-xl">{m.emoji}</span>
                    <div className="flex-1 min-w-0">
                      <p
                        className="text-xs truncate"
                        style={{ color: "#A7ACBE" }}
                      >
                        {m.text}
                      </p>
                      <p
                        className="text-xs font-bold mt-0.5"
                        style={{ color: m.color }}
                      >
                        {m.mood} • {m.confidence}%
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* TRANSLATE */}
      {activeTab === "translate" && (
        <div className="flex-1 overflow-y-auto px-4 py-4 scrollbar-hide">
          <h2
            className="text-lg font-black tracking-wider mb-4"
            style={{ color: "#F2F4FF" }}
          >
            REAL-TIME TRANSLATE
          </h2>
          <select
            value={sourceLang}
            onChange={(e) => setSourceLang(e.target.value)}
            className="w-full px-4 py-3 rounded-xl text-sm outline-none mb-3"
            style={{
              background: "#151A26",
              border: "1px solid #2A3142",
              color: "#19E6FF",
            }}
          >
            {LANGUAGES.map((l) => (
              <option key={l} value={l}>
                {l}
              </option>
            ))}
          </select>
          <textarea
            placeholder="Enter text to translate..."
            value={sourceText}
            onChange={(e) => setSourceText(e.target.value)}
            rows={5}
            className="w-full px-4 py-3 rounded-xl text-sm outline-none resize-none mb-3"
            style={{
              background: "#151A26",
              border: "1px solid #2A3142",
              color: "#F2F4FF",
              caretColor: "#19E6FF",
            }}
          />
          <button
            type="button"
            onClick={handleTranslate}
            disabled={!sourceText.trim() || translating}
            className="w-full py-3 rounded-xl font-bold text-sm btn-neon-cyan mb-4"
            style={{ opacity: !sourceText.trim() ? 0.5 : 1 }}
          >
            {translating ? "TRANSLATING..." : "TRANSLATE"}
          </button>
          {translated && (
            <div
              className="p-4 rounded-2xl animate-fade-in"
              style={{
                background: "#151A26",
                border: "1px solid rgba(25,230,255,0.3)",
              }}
            >
              <p
                className="text-xs font-bold tracking-wider mb-2"
                style={{ color: "#19E6FF" }}
              >
                RESULT
              </p>
              <p
                className="text-sm"
                style={{ color: "#F2F4FF", lineHeight: "1.7" }}
              >
                {translated}
              </p>
              <p className="text-[10px] mt-3" style={{ color: "#4A5568" }}>
                Powered by OMNI AI Neural Translation
              </p>
            </div>
          )}
        </div>
      )}

      {/* STORY */}
      {activeTab === "story" && (
        <div className="flex-1 overflow-y-auto px-4 py-4 scrollbar-hide">
          <div className="mb-4">
            <h2
              className="text-lg font-black tracking-wider mb-1"
              style={{ color: "#F2F4FF" }}
            >
              STORY GENERATOR
            </h2>
            <p className="text-xs" style={{ color: "#A7ACBE" }}>
              Generate interactive anonymous experiences
            </p>
          </div>
          <input
            type="text"
            placeholder='e.g. "Two strangers meet in a cyberpunk city"'
            value={storyPrompt}
            onChange={(e) => setStoryPrompt(e.target.value)}
            className="w-full px-4 py-3 rounded-xl text-sm outline-none mb-4"
            style={{
              background: "#151A26",
              border: "1px solid #2A3142",
              color: "#F2F4FF",
              caretColor: "#B56BFF",
            }}
          />
          <div className="flex flex-wrap gap-2 mb-4">
            {[
              "Two ghosts meet online",
              "A midnight ride story",
              "The rarest ID in OMNI",
            ].map((p) => (
              <button
                type="button"
                key={p}
                onClick={() => setStoryPrompt(p)}
                className="px-3 py-1.5 rounded-full text-xs transition-all"
                style={{
                  background: "#151A26",
                  border: "1px solid #2A3142",
                  color: "#A7ACBE",
                }}
              >
                {p}
              </button>
            ))}
          </div>
          <button
            type="button"
            onClick={handleGenerateStory}
            disabled={!storyPrompt.trim() || generating}
            className="w-full py-3 rounded-xl font-bold text-sm btn-neon-purple mb-6"
            style={{ opacity: !storyPrompt.trim() ? 0.5 : 1 }}
          >
            {generating ? "GENERATING..." : "GENERATE STORY ✨"}
          </button>
          {story && (
            <div
              className="p-5 rounded-2xl animate-fade-in"
              style={{
                background: "#151A26",
                border: "1px solid rgba(181,107,255,0.3)",
              }}
            >
              <p
                className="text-sm leading-relaxed whitespace-pre-line"
                style={{ color: "#F2F4FF", lineHeight: "1.8" }}
              >
                {storyParts.map((seg) =>
                  seg.bold ? (
                    <strong key={seg.id} style={{ color: "#B56BFF" }}>
                      {seg.text}
                    </strong>
                  ) : (
                    seg.text
                  ),
                )}
              </p>
              <p className="text-[10px] mt-4" style={{ color: "#4A5568" }}>
                Generated by OMNI AI Narrative Engine
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
