import type { PrivacyMode } from "@/lib/identitySystem";
import { type Friend, type Message, generateAnonymousID } from "@/lib/mockData";
import { useOmniStore } from "@/lib/omniStore";
import {
  Bot,
  Camera,
  Check,
  CheckCheck,
  ChevronLeft,
  Copy,
  Download,
  Eye,
  EyeOff,
  FileText,
  Ghost,
  Globe,
  Hash,
  Info,
  Lock,
  MapPin,
  Mic,
  MicOff,
  Paperclip,
  Phone,
  Play,
  Plus,
  Search,
  Send,
  Shield,
  Square,
  Timer,
  Trash2,
  Users,
  Video,
  VideoOff,
  X,
  Zap,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { useWebRTC } from "../hooks/useWebRTC";

function timeAgo(ts: number): string {
  const diff = Date.now() - ts;
  if (diff < 60000) return "now";
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h`;
  return `${Math.floor(diff / 86400000)}d`;
}

function formatTime(ts: number): string {
  return new Date(ts).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
}

const DESTRUCT_OPTIONS = [
  { label: "Off", value: 0 },
  { label: "5m", value: 5 },
  { label: "1h", value: 60 },
  { label: "24h", value: 1440 },
];

const REACTION_EMOJIS = ["👍", "❤️", "😂", "😮", "😢", "🔥"];

const SMART_REPLIES = [
  "Got it! 👍",
  "Thanks!",
  "On my way 🚗",
  "Sure, sounds good",
  "Let me check",
  "Tell me more",
  "lol 😂",
  "Interesting...",
  "Can we talk later?",
  "👀",
];

const AI_RESPONSES: Record<string, string> = {
  hello: "Hey! I'm OMNI AI 🤖 How can I help you?",
  hi: "Hello! Ask me anything.",
  help: "I can translate messages, summarize links, suggest replies, analyze mood, and more!",
  translate:
    "I support real-time translation for Turkish, English, Spanish, and Arabic.",
  privacy:
    "OMNI uses E2EE for all messages. Ghost Mode hides your identity completely.",
  call: "Voice & video calls use encrypted P2P connections. Enable AI Voice Mask to change your voice.",
  default: "Interesting! Tell me more and I'll do my best to help. 🌟",
};

function getAIResponse(input: string): string {
  const lower = input.toLowerCase();
  for (const [key, val] of Object.entries(AI_RESPONSES)) {
    if (lower.includes(key)) return val;
  }
  const responses = [
    "Great question! Based on context, I'd suggest being direct and clear. ✨",
    "I analyzed your message — the sentiment is positive! Keep it up 🎯",
    "Here's a tip: use Ghost Mode for maximum privacy in sensitive conversations.",
    "I can help translate that! Just say 'translate' before your message.",
    "Smart reply suggestion: try acknowledging their point first, then share yours.",
  ];
  return responses[Math.floor(Math.random() * responses.length)];
}

function getTranslation(content: string): string {
  const turkishWords = [
    "merhaba",
    "nasılsın",
    "iyi",
    "tamam",
    "evet",
    "hayır",
    "teşekkür",
    "güzel",
    "gün",
    "ne",
  ];
  const hasTurkish = turkishWords.some((w) =>
    content.toLowerCase().includes(w),
  );
  if (hasTurkish) {
    return `[EN] ${content
      .replace(/merhaba/gi, "hello")
      .replace(/nasılsın/gi, "how are you")
      .replace(/teşekkür/gi, "thank you")}`;
  }
  return `[TR] ${content
    .replace(/hello/gi, "merhaba")
    .replace(/how are you/gi, "nasılsın")
    .replace(/thank you/gi, "teşekkür ederim")}`;
}

function pickSmartReplies(): string[] {
  const shuffled = [...SMART_REPLIES].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, 3);
}

function extractUrl(text: string): string | null {
  const match = text.match(/https?:\/\/[^\s]+/);
  return match ? match[0] : null;
}

const LINK_PREVIEWS: Record<
  string,
  { title: string; desc: string; domain: string }
> = {
  "github.com": {
    title: "GitHub",
    desc: "Where the world builds software",
    domain: "github.com",
  },
  "twitter.com": {
    title: "Twitter / X",
    desc: "See the latest tweets",
    domain: "twitter.com",
  },
  "youtube.com": {
    title: "YouTube",
    desc: "Watch videos and discover more",
    domain: "youtube.com",
  },
  "reddit.com": {
    title: "Reddit",
    desc: "The front page of the internet",
    domain: "reddit.com",
  },
  default: { title: "Link Preview", desc: "External resource", domain: "web" },
};

function getLinkPreview(url: string) {
  for (const [domain, info] of Object.entries(LINK_PREVIEWS)) {
    if (url.includes(domain)) return info;
  }
  try {
    const domain = new URL(url).hostname.replace("www.", "");
    return { title: domain, desc: "Click to open link", domain };
  } catch {
    return LINK_PREVIEWS.default;
  }
}

function TypingBubble() {
  return (
    <div className="flex justify-start animate-fade-in">
      <div
        className="px-4 py-3 rounded-2xl flex items-center gap-1"
        style={{ background: "#151A26", border: "1px solid #2A3142" }}
      >
        <span className="typing-dot" style={{ animationDelay: "0ms" }} />
        <span className="typing-dot" style={{ animationDelay: "150ms" }} />
        <span className="typing-dot" style={{ animationDelay: "300ms" }} />
      </div>
    </div>
  );
}

function VoiceWaveform({ duration }: { duration?: number }) {
  const bars = [3, 6, 9, 5, 8, 4, 7, 10, 6, 4, 8, 5, 9, 3, 7];
  return (
    <div className="flex items-center gap-1.5">
      <Mic size={13} style={{ color: "#19E6FF" }} />
      <div className="flex items-center gap-[2px]">
        {bars.map((h, i) => (
          <div
            // biome-ignore lint/suspicious/noArrayIndexKey: static decorative bars
            key={`vb-${i}`}
            style={{
              width: 2,
              height: h,
              background: "#19E6FF",
              borderRadius: 2,
              opacity: 0.8,
            }}
          />
        ))}
      </div>
      <span className="text-xs" style={{ color: "#A7ACBE" }}>
        0:{String(duration ?? 5).padStart(2, "0")}
      </span>
    </div>
  );
}

function RecordingWaveform() {
  const bars = [4, 8, 12, 6, 10, 8, 14, 6, 10, 4, 8, 12];
  return (
    <div className="flex items-center gap-[3px]">
      {bars.map((h, i) => (
        <div
          // biome-ignore lint/suspicious/noArrayIndexKey: static decorative bars
          key={`rb-${i}`}
          className="recording-bar"
          style={{
            width: 3,
            height: h,
            background: "#FF4F4F",
            borderRadius: 2,
            animationDelay: `${i * 80}ms`,
          }}
        />
      ))}
    </div>
  );
}

function StatusIcon({ status }: { status?: "sent" | "delivered" | "read" }) {
  if (!status || status === "sent")
    return <Check size={11} style={{ color: "#4A5568" }} />;
  if (status === "delivered")
    return <CheckCheck size={11} style={{ color: "#4A5568" }} />;
  return <CheckCheck size={11} style={{ color: "#19E6FF" }} />;
}

interface AIMessage {
  id: string;
  role: "user" | "ai";
  content: string;
  timestamp: number;
}

interface ContextMenuState {
  msg: Message;
  x: number;
  y: number;
}

export function ChatModule() {
  const {
    conversations,
    activeConversationId,
    setActiveConversation,
    sendMessage,
    createConversation,
    createGroup,
    myId,
    markConversationRead,
    addReaction,
    setMessageTranslation,
    deleteMessage,
    typingConversations,
    identities,
    activeIdentityId,
    privacyMode,
    updatePrivacyMode,
    friends,
    addFriendById,
    removeFriend,
  } = useOmniStore();

  const [input, setInput] = useState("");
  const [destructMins, setDestructMins] = useState(0);
  const [showNewChat, setShowNewChat] = useState(false);
  const [addFriendInput, setAddFriendInput] = useState("");
  const [friendToDelete, setFriendToDelete] = useState<string | null>(null);
  const [showNewGroup, setShowNewGroup] = useState(false);
  const [newChatId, setNewChatId] = useState("");
  const [newGroupName, setNewGroupName] = useState("");
  const [isTempSession, setIsTempSession] = useState(false);
  const [activeTab, setActiveTab] = useState<
    "dms" | "groups" | "channels" | "friends"
  >("dms");
  const [replyTo, setReplyTo] = useState<Message | null>(null);
  const [showMediaSheet, setShowMediaSheet] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isPTT, setIsPTT] = useState(false);
  const [pttActive, setPttActive] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [smartReplies, setSmartReplies] = useState<string[]>([]);
  const [contextMenu, setContextMenu] = useState<ContextMenuState | null>(null);
  const [reactionPickerMsgId, setReactionPickerMsgId] = useState<string | null>(
    null,
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [showSearch, setShowSearch] = useState(false);
  const [firstUnreadIndex, setFirstUnreadIndex] = useState<number | null>(null);
  const [showTranslated, setShowTranslated] = useState<Record<string, boolean>>(
    {},
  );
  // Media
  const [pendingMedia, setPendingMedia] = useState<{
    url: string;
    type: "image" | "video" | "document";
    name: string;
  } | null>(null);
  const [compressing, setCompressing] = useState(false);
  const [previewMedia, setPreviewMedia] = useState<{
    url: string;
    type: string;
    name: string;
  } | null>(null);
  const [linkSummaries, setLinkSummaries] = useState<Record<string, string>>(
    {},
  );
  // Calls - WebRTC
  const webrtc = useWebRTC(myId);
  // AI Assistant
  const [showAIPanel, setShowAIPanel] = useState(false);
  const [aiMessages, setAiMessages] = useState<AIMessage[]>([
    {
      id: "ai0",
      role: "ai",
      content:
        "Hi! I'm OMNI AI. I can help with smart replies, translations, link summaries, and more. How can I assist?",
      timestamp: Date.now(),
    },
  ]);
  const [aiInput, setAiInput] = useState("");
  const [aiTyping, setAiTyping] = useState(false);
  // Privacy
  const [showPrivacyMenu, setShowPrivacyMenu] = useState(false);
  const [screenshotProtection, setScreenshotProtection] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const recordingIntervalRef = useRef<ReturnType<typeof setInterval> | null>(
    null,
  );
  const longPressTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const prevMessagesLengthRef = useRef<number>(0);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);
  const docInputRef = useRef<HTMLInputElement>(null);
  const aiEndRef = useRef<HTMLDivElement>(null);

  const activeConv = conversations.find((c) => c.id === activeConversationId);
  const isTyping = activeConversationId
    ? typingConversations.includes(activeConversationId)
    : false;

  // biome-ignore lint/correctness/useExhaustiveDependencies: intentional
  useEffect(() => {
    if (activeConversationId && activeConv) {
      markConversationRead(activeConversationId);
      const unreadCount = activeConv.unread;
      if (unreadCount > 0)
        setFirstUnreadIndex(activeConv.messages.length - unreadCount);
      else setFirstUnreadIndex(null);
      prevMessagesLengthRef.current = activeConv.messages.length;
      setSmartReplies([]);
      setReplyTo(null);
      setSearchQuery("");
      setShowSearch(false);
    }
  }, [activeConversationId]);

  // biome-ignore lint/correctness/useExhaustiveDependencies: intentional
  useEffect(() => {
    if (!activeConv) return;
    const newLen = activeConv.messages.length;
    if (newLen > prevMessagesLengthRef.current) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
      const lastMsg = activeConv.messages[newLen - 1];
      if (lastMsg && lastMsg.senderId !== myId)
        setSmartReplies(pickSmartReplies());
      prevMessagesLengthRef.current = newLen;
    }
  }, [activeConv?.messages.length]);

  useEffect(() => {
    if (isRecording) {
      setRecordingDuration(0);
      recordingIntervalRef.current = setInterval(
        () => setRecordingDuration((d) => d + 1),
        1000,
      );
    } else {
      if (recordingIntervalRef.current) {
        clearInterval(recordingIntervalRef.current);
        recordingIntervalRef.current = null;
      }
    }
    return () => {
      if (recordingIntervalRef.current)
        clearInterval(recordingIntervalRef.current);
    };
  }, [isRecording]);

  // biome-ignore lint/correctness/useExhaustiveDependencies: intentional
  useEffect(() => {
    aiEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [aiMessages]);

  const filteredConvs = conversations.filter((c) => {
    if (activeTab === "friends") return false;
    if (activeTab === "dms") return !c.isGroup && !c.isChannel;
    if (activeTab === "groups") return c.isGroup;
    if (activeTab === "channels") return c.isChannel;
    return true;
  });

  const displayedMessages = searchQuery
    ? (activeConv?.messages.filter((m) =>
        m.content.toLowerCase().includes(searchQuery.toLowerCase()),
      ) ?? [])
    : (activeConv?.messages ?? []);

  const handleSend = (text?: string) => {
    const content = text ?? input.trim();
    if (!content || !activeConversationId) return;
    sendMessage(
      activeConversationId,
      content,
      destructMins || undefined,
      false,
      undefined,
      replyTo?.id,
    );
    setInput("");
    setReplyTo(null);
    setSmartReplies([]);
  };

  const handleSendVoice = () => {
    if (!activeConversationId) return;
    sendMessage(
      activeConversationId,
      "Voice message",
      destructMins || undefined,
      true,
      recordingDuration,
      replyTo?.id,
    );
    setIsRecording(false);
    setRecordingDuration(0);
    setReplyTo(null);
  };

  const handleFileSelect = (
    file: File,
    type: "image" | "video" | "document",
  ) => {
    setShowMediaSheet(false);
    setCompressing(true);
    const url = URL.createObjectURL(file);
    setTimeout(() => {
      setCompressing(false);
      setPendingMedia({ url, type, name: file.name });
    }, 800);
  };

  const handleSendMedia = () => {
    if (!pendingMedia || !activeConversationId) return;
    const content =
      pendingMedia.type === "document"
        ? `📄 ${pendingMedia.name}`
        : pendingMedia.type === "video"
          ? "🎥 Video"
          : "🖼️ Image";
    // Send as regular message but with media metadata stored in content for display
    const mediaPrefix = `__MEDIA__${pendingMedia.type}__${pendingMedia.url}__${pendingMedia.name}__`;
    sendMessage(
      activeConversationId,
      mediaPrefix + content,
      destructMins || undefined,
      false,
      undefined,
      replyTo?.id,
    );
    setPendingMedia(null);
    setReplyTo(null);
  };

  const handleNewChat = () => {
    if (!newChatId.trim()) return;
    const id = createConversation(newChatId.trim());
    setActiveConversation(id);
    setShowNewChat(false);
    setNewChatId("");
  };

  const handleNewGroup = () => {
    if (!newGroupName.trim()) return;
    const id = createGroup(newGroupName, [
      generateAnonymousID(),
      generateAnonymousID(),
    ]);
    setActiveConversation(id);
    setShowNewGroup(false);
    setNewGroupName("");
  };

  const handlePointerDown = (msg: Message, e: React.PointerEvent) => {
    const x = e.clientX;
    const y = e.clientY;
    longPressTimerRef.current = setTimeout(() => {
      setReactionPickerMsgId(msg.id);
      setContextMenu({ msg, x, y });
    }, 500);
  };

  const handlePointerUp = () => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
  };

  const handleContextAction = (action: string) => {
    if (!contextMenu) return;
    const msg = contextMenu.msg;
    switch (action) {
      case "reply":
        setReplyTo(msg);
        break;
      case "copy":
        navigator.clipboard
          .writeText(msg.content)
          .then(() => toast.success("Copied!"));
        break;
      case "translate": {
        const translated = getTranslation(msg.content);
        setMessageTranslation(activeConversationId!, msg.id, translated);
        setShowTranslated((p) => ({ ...p, [msg.id]: true }));
        break;
      }
      case "delete":
        deleteMessage(activeConversationId!, msg.id);
        break;
    }
    setContextMenu(null);
    setReactionPickerMsgId(null);
  };

  const handleReaction = (msgId: string, emoji: string) => {
    addReaction(activeConversationId!, msgId, emoji, myId ?? "me");
    setReactionPickerMsgId(null);
    setContextMenu(null);
  };

  const formatCallDuration = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  };

  const sendAIMessage = () => {
    if (!aiInput.trim()) return;
    const userMsg: AIMessage = {
      id: `ai${Date.now()}`,
      role: "user",
      content: aiInput.trim(),
      timestamp: Date.now(),
    };
    setAiMessages((prev) => [...prev, userMsg]);
    const q = aiInput.trim();
    setAiInput("");
    setAiTyping(true);
    setTimeout(
      () => {
        const response = getAIResponse(q);
        const aiMsg: AIMessage = {
          id: `ai${Date.now()}`,
          role: "ai",
          content: response,
          timestamp: Date.now(),
        };
        setAiMessages((prev) => [...prev, aiMsg]);
        setAiTyping(false);
      },
      1000 + Math.random() * 800,
    );
  };

  // Parse media message content
  const parseMediaContent = (
    content: string,
  ): {
    isMedia: boolean;
    mediaType?: string;
    mediaUrl?: string;
    mediaName?: string;
    displayContent?: string;
  } => {
    if (content.startsWith("__MEDIA__")) {
      const parts = content.split("__");
      // format: __MEDIA__type__url__name__displayContent
      if (parts.length >= 6) {
        return {
          isMedia: true,
          mediaType: parts[2],
          mediaUrl: parts[3],
          mediaName: parts[4],
          displayContent: parts.slice(5).join("__"),
        };
      }
    }
    return { isMedia: false };
  };

  const handleLinkSummary = (msgId: string, _url: string) => {
    const summaries = [
      "This resource provides comprehensive documentation and examples for developers.",
      "A popular platform for sharing and discovering content across communities.",
      "Breaking news and trending topics from around the world.",
      "An open-source project with active community contributions and regular updates.",
    ];
    setLinkSummaries((prev) => ({
      ...prev,
      [msgId]: summaries[Math.floor(Math.random() * summaries.length)],
    }));
  };

  // ─── Conversation List ───────────────────────────────────────────────────────

  // Active Identity helpers
  const PRIVACY_MODES: PrivacyMode[] = ["normal", "ghost", "shadow"];
  const PRIVACY_LABELS: Record<PrivacyMode, string> = {
    normal: "NORMAL",
    ghost: "GHOST",
    shadow: "SHADOW",
  };
  const PRIVACY_COLORS: Record<PrivacyMode, string> = {
    normal: "#19E6FF",
    ghost: "#B56BFF",
    shadow: "#6B7280",
  };
  const PRIVACY_GLOWS: Record<PrivacyMode, string> = {
    normal: "0 0 8px rgba(25,230,255,0.4)",
    ghost: "0 0 8px rgba(181,107,255,0.4)",
    shadow: "0 0 8px rgba(107,114,128,0.4)",
  };
  const activeIdentity = identities.find((i) => i.id === activeIdentityId);
  const displayId = activeIdentity?.id ?? myId ?? "+777 0000 0000";
  const displayEmoji = activeIdentity?.emoji ?? "👤";
  const displayNick = activeIdentity?.nickname;
  const [privacyBannerDismissed, setPrivacyBannerDismissed] = useState(false);

  function cyclePrivacyMode() {
    if (!activeIdentityId) return;
    const idx = PRIVACY_MODES.indexOf(privacyMode);
    const next = PRIVACY_MODES[(idx + 1) % PRIVACY_MODES.length];
    updatePrivacyMode(activeIdentityId, next);
    const modeNames: Record<PrivacyMode, string> = {
      normal: "Normal",
      ghost: "Ghost",
      shadow: "Shadow",
    };
    toast(`Gizlilik modu: ${modeNames[next]}`);
  }

  function ActiveIdentityBar() {
    return (
      <div
        data-ocid="chat.identity_bar.panel"
        className="flex items-center justify-between px-3 py-2 flex-shrink-0"
        style={{
          background: "rgba(20,26,42,0.95)",
          borderBottom: "1px solid #1A2030",
          minHeight: "40px",
        }}
      >
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-sm">{displayEmoji}</span>
          <span
            className="text-xs font-mono truncate"
            style={{ color: "#A7ACBE", maxWidth: "130px" }}
          >
            {displayNick ?? displayId}
          </span>
        </div>
        <button
          type="button"
          data-ocid="chat.privacy_mode.toggle"
          onClick={cyclePrivacyMode}
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black tracking-widest uppercase transition-all active:scale-95"
          style={{
            background: `rgba(${privacyMode === "normal" ? "25,230,255" : privacyMode === "ghost" ? "181,107,255" : "107,114,128"},0.12)`,
            border: `1px solid ${PRIVACY_COLORS[privacyMode]}40`,
            color: PRIVACY_COLORS[privacyMode],
            boxShadow: PRIVACY_GLOWS[privacyMode],
          }}
        >
          {privacyMode === "normal"
            ? "●"
            : privacyMode === "ghost"
              ? "👻"
              : "🌑"}{" "}
          {PRIVACY_LABELS[privacyMode]}
        </button>
      </div>
    );
  }

  function PrivacyModeBanner() {
    if (privacyMode === "normal" || privacyBannerDismissed) return null;
    const isGhost = privacyMode === "ghost";
    return (
      <div
        data-ocid="chat.privacy_banner.panel"
        className="flex items-center justify-between px-3 py-1.5 flex-shrink-0 text-[11px]"
        style={{
          background: isGhost ? "rgba(181,107,255,0.1)" : "rgba(30,30,36,0.95)",
          borderBottom: `1px solid ${isGhost ? "#B56BFF30" : "#3A3A4A30"}`,
          color: isGhost ? "#B56BFF" : "#9CA3AF",
        }}
      >
        <span>
          {isGhost
            ? "👻 Ghost Modu — Sohbet geçmişi kaydedilmiyor"
            : "🌑 Shadow Modu — Çevrimiçi durumun gizli"}
        </span>
        <button
          type="button"
          data-ocid="chat.privacy_banner.close_button"
          onClick={() => setPrivacyBannerDismissed(true)}
          className="ml-2 opacity-60 hover:opacity-100 flex-shrink-0"
          style={{ color: isGhost ? "#B56BFF" : "#9CA3AF" }}
        >
          ✕
        </button>
      </div>
    );
  }

  if (!activeConversationId) {
    return (
      <div className="flex flex-col h-full animate-fade-in">
        <div
          className="flex items-center justify-between px-4 py-3 flex-shrink-0"
          style={{
            background: "rgba(14,19,32,0.95)",
            borderBottom: "1px solid #1A2030",
          }}
        >
          <h2 className="font-bold text-base" style={{ color: "#F2F4FF" }}>
            Messages
          </h2>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setShowNewGroup(true)}
              className="p-2 rounded-xl"
              style={{
                background: "rgba(181,107,255,0.1)",
                border: "1px solid rgba(181,107,255,0.3)",
              }}
              data-ocid="chat.open_modal_button"
            >
              <Users size={15} style={{ color: "#B56BFF" }} />
            </button>
            <button
              type="button"
              onClick={() => setShowNewChat(true)}
              className="p-2 rounded-xl"
              style={{
                background: "rgba(25,230,255,0.1)",
                border: "1px solid rgba(25,230,255,0.3)",
              }}
              data-ocid="chat.primary_button"
            >
              <Plus size={15} style={{ color: "#19E6FF" }} />
            </button>
          </div>
        </div>

        <ActiveIdentityBar />

        <div
          className="flex flex-shrink-0"
          style={{
            borderBottom: "1px solid #1A2030",
            background: "rgba(14,19,32,0.7)",
          }}
        >
          {(["dms", "groups", "channels", "friends"] as const).map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setActiveTab(tab)}
              className="flex-1 py-2 text-xs font-semibold tracking-wide uppercase transition-colors relative"
              style={{
                color: activeTab === tab ? "#19E6FF" : "#4A5568",
                borderBottom:
                  activeTab === tab
                    ? "2px solid #19E6FF"
                    : "2px solid transparent",
              }}
              data-ocid={`chat.${tab}.tab`}
            >
              {tab === "dms" ? (
                "DMs"
              ) : tab === "groups" ? (
                "Groups"
              ) : tab === "channels" ? (
                "Channels"
              ) : (
                <span className="flex items-center justify-center gap-1">
                  Arkadaşlar
                  {friends.length > 0 && (
                    <span
                      className="inline-flex items-center justify-center w-4 h-4 rounded-full text-[9px] font-bold"
                      style={{ background: "#19E6FF", color: "#0A0F1E" }}
                    >
                      {friends.length}
                    </span>
                  )}
                </span>
              )}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto scrollbar-hide">
          {activeTab === "friends" ? (
            <div className="flex flex-col h-full">
              {/* Add Friend Input */}
              <div className="p-3 border-b" style={{ borderColor: "#1A2030" }}>
                <div className="flex gap-2 items-center">
                  <input
                    type="text"
                    value={addFriendInput}
                    onChange={(e) => setAddFriendInput(e.target.value)}
                    placeholder="+777 XXXX XXXX"
                    data-ocid="chat.friends.add.input"
                    className="flex-1 px-3 py-2 rounded-xl text-sm outline-none"
                    style={{
                      background: "#151A26",
                      border: "1px solid #2A3142",
                      color: "#F2F4FF",
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        const raw = addFriendInput.trim();
                        const digits = raw
                          .replace(/^\+?777\s*/, "")
                          .replace(/\D/g, "");
                        if (digits.length !== 8) {
                          toast.error("Format: +777 XXXX XXXX (8 rakam)");
                          return;
                        }
                        const formatted = `+777 ${digits.slice(0, 4)} ${digits.slice(4)}`;
                        const result = addFriendById(
                          formatted as import("@/lib/mockData").AnonymousID,
                        );
                        if (result === "added") {
                          toast.success(
                            `${formatted} arkadaş listesine eklendi! ✅`,
                          );
                          setAddFriendInput("");
                        } else if (result === "already_friend")
                          toast.error("Bu kişi zaten arkadaşın");
                        else toast.error("Kendinizi ekleyemezsiniz");
                      }
                    }}
                  />
                  <button
                    type="button"
                    data-ocid="chat.friends.add.button"
                    className="px-3 py-2 rounded-xl text-sm font-bold"
                    style={{
                      background: "rgba(25,230,255,0.15)",
                      color: "#19E6FF",
                      border: "1px solid rgba(25,230,255,0.3)",
                    }}
                    onClick={() => {
                      const raw = addFriendInput.trim();
                      const digits = raw
                        .replace(/^\+?777\s*/, "")
                        .replace(/\D/g, "");
                      if (digits.length !== 8) {
                        toast.error("Format: +777 XXXX XXXX (8 rakam)");
                        return;
                      }
                      const formatted = `+777 ${digits.slice(0, 4)} ${digits.slice(4)}`;
                      const result = addFriendById(
                        formatted as import("@/lib/mockData").AnonymousID,
                      );
                      if (result === "added") {
                        toast.success(
                          `${formatted} arkadaş listesine eklendi! ✅`,
                        );
                        setAddFriendInput("");
                      } else if (result === "already_friend")
                        toast.error("Bu kişi zaten arkadaşın");
                      else toast.error("Kendinizi ekleyemezsiniz");
                    }}
                  >
                    Ekle
                  </button>
                </div>
              </div>
              {friends.length === 0 ? (
                <div
                  className="flex flex-col items-center justify-center flex-1 gap-3 px-6 text-center"
                  data-ocid="chat.friends.empty_state"
                >
                  <div className="text-4xl mb-2">👥</div>
                  <p
                    className="text-sm font-semibold"
                    style={{ color: "#19E6FF" }}
                  >
                    Henüz arkadaş eklemedin
                  </p>
                  <p className="text-xs" style={{ color: "#4A5568" }}>
                    +777 ID girerek arkadaş ekle 👆
                  </p>
                </div>
              ) : (
                <div className="overflow-y-auto flex-1 scrollbar-hide">
                  {friends.map((friend: Friend, idx: number) => (
                    <div
                      key={friend.id}
                      className="flex items-center gap-3 px-4 py-3 transition-colors"
                      style={{ borderBottom: "1px solid #0E1320" }}
                      data-ocid={`chat.friends.item.${idx + 1}`}
                    >
                      <div
                        className="w-11 h-11 rounded-full flex items-center justify-center text-base font-bold flex-shrink-0"
                        style={{
                          background:
                            "linear-gradient(135deg,#19E6FF22,#19E6FF44)",
                          color: "#19E6FF",
                          border: "1px solid #19E6FF44",
                        }}
                      >
                        {friend.friendId.charAt(0)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span
                            className="text-sm font-semibold truncate"
                            style={{ color: "#E2E8F0" }}
                          >
                            {friend.name || friend.friendId}
                          </span>
                          <span
                            className="text-xs px-1.5 py-0.5 rounded-full flex-shrink-0"
                            style={{
                              background: "rgba(25,230,255,0.1)",
                              color: "#19E6FF",
                              border: "1px solid rgba(25,230,255,0.2)",
                            }}
                          >
                            {friend.friendScore} ⭐
                          </span>
                        </div>
                        <p
                          className="text-xs truncate mt-0.5"
                          style={{ color: "#4A5568" }}
                        >
                          {friend.mood}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <button
                          type="button"
                          className="w-8 h-8 rounded-full flex items-center justify-center transition-all"
                          style={{
                            background: "rgba(25,230,255,0.12)",
                            color: "#19E6FF",
                            border: "1px solid rgba(25,230,255,0.3)",
                          }}
                          data-ocid={`chat.friends.button.${idx + 1}`}
                          title="Mesaj"
                          onClick={() => {
                            const existing = conversations.find(
                              (c) =>
                                !c.isGroup &&
                                !c.isChannel &&
                                c.participants.includes(friend.friendId),
                            );
                            if (existing) {
                              setActiveConversation(existing.id);
                              setActiveTab("dms");
                            } else {
                              const id = createConversation(friend.friendId);
                              setActiveConversation(id);
                              setActiveTab("dms");
                            }
                          }}
                        >
                          <Send size={14} />
                        </button>
                        <button
                          type="button"
                          className="w-8 h-8 rounded-full flex items-center justify-center transition-all"
                          style={{
                            background: "rgba(47,245,199,0.12)",
                            color: "#2FF5C7",
                            border: "1px solid rgba(47,245,199,0.3)",
                          }}
                          data-ocid={`chat.friends.voice.${idx + 1}`}
                          title="Sesli Arama"
                          onClick={() => {
                            const existing = conversations.find(
                              (c) =>
                                !c.isGroup &&
                                !c.isChannel &&
                                c.participants.includes(friend.friendId),
                            );
                            if (existing) {
                              setActiveConversation(existing.id);
                            } else {
                              const id = createConversation(friend.friendId);
                              setActiveConversation(id);
                            }
                            webrtc.initiateCall(friend.friendId, "voice");
                          }}
                        >
                          <Phone size={14} />
                        </button>
                        <button
                          type="button"
                          className="w-8 h-8 rounded-full flex items-center justify-center transition-all"
                          style={{
                            background: "rgba(181,107,255,0.12)",
                            color: "#B56BFF",
                            border: "1px solid rgba(181,107,255,0.3)",
                          }}
                          data-ocid={`chat.friends.video.${idx + 1}`}
                          title="Görüntülü Arama"
                          onClick={() => {
                            const existing = conversations.find(
                              (c) =>
                                !c.isGroup &&
                                !c.isChannel &&
                                c.participants.includes(friend.friendId),
                            );
                            if (existing) {
                              setActiveConversation(existing.id);
                            } else {
                              const id = createConversation(friend.friendId);
                              setActiveConversation(id);
                            }
                            webrtc.initiateCall(friend.friendId, "video");
                          }}
                        >
                          <Video size={14} />
                        </button>
                        <button
                          type="button"
                          className="w-8 h-8 rounded-full flex items-center justify-center transition-all"
                          style={{
                            background: "rgba(255,79,79,0.12)",
                            color: "#FF4F4F",
                            border: "1px solid rgba(255,79,79,0.3)",
                          }}
                          data-ocid={`chat.friends.delete_button.${idx + 1}`}
                          title="Arkadaşı Sil"
                          onClick={() => setFriendToDelete(friend.friendId)}
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : filteredConvs.length === 0 ? (
            <div
              className="flex flex-col items-center justify-center h-full gap-3"
              data-ocid="chat.empty_state"
            >
              <p className="text-sm" style={{ color: "#4A5568" }}>
                No conversations yet
              </p>
              <button
                type="button"
                onClick={() => setShowNewChat(true)}
                className="text-xs px-4 py-2 rounded-full"
                style={{
                  background: "rgba(25,230,255,0.1)",
                  color: "#19E6FF",
                  border: "1px solid rgba(25,230,255,0.3)",
                }}
              >
                Start a chat
              </button>
            </div>
          ) : (
            filteredConvs.map((conv, idx) => {
              const title = conv.name || conv.participants[0] || "Unknown";
              const isOnline = false;
              const lastMsg = conv.lastMessage ?? "";
              const displayLast =
                conv.isGroup && conv.messages.length > 0
                  ? `${conv.messages[conv.messages.length - 1]?.senderId?.split(" ")[1] ?? ""}: ${lastMsg}`
                  : lastMsg;
              return (
                <button
                  key={conv.id}
                  type="button"
                  onClick={() => setActiveConversation(conv.id)}
                  className="w-full flex items-center gap-3 px-4 py-3 transition-colors"
                  style={{ borderBottom: "1px solid #0E1320" }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = "#0E1320";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = "transparent";
                  }}
                  data-ocid={`chat.item.${idx + 1}`}
                >
                  <div className="relative flex-shrink-0">
                    <div
                      className="w-11 h-11 rounded-full flex items-center justify-center text-base"
                      style={{
                        background: "linear-gradient(135deg,#1A2030,#2A3142)",
                      }}
                    >
                      {conv.isChannel
                        ? "📡"
                        : conv.isGroup
                          ? "👥"
                          : title.charAt(0)}
                    </div>
                    {isOnline && (
                      <span
                        className="absolute bottom-0 right-0 w-3 h-3 rounded-full"
                        style={{
                          background: "#2FF5C7",
                          border: "2px solid #06070B",
                        }}
                      />
                    )}
                  </div>
                  <div className="flex-1 min-w-0 text-left">
                    <div className="flex items-center gap-1.5 mb-0.5">
                      {conv.isChannel && (
                        <Hash size={11} style={{ color: "#B56BFF" }} />
                      )}
                      {conv.isGroup && (
                        <Users size={11} style={{ color: "#2FF5C7" }} />
                      )}
                      {conv.ghostMode && (
                        <Ghost size={10} style={{ color: "#B56BFF" }} />
                      )}
                      <p
                        className="font-semibold text-sm truncate"
                        style={{ color: "#F2F4FF" }}
                      >
                        {title}
                      </p>
                    </div>
                    <p
                      className="text-xs truncate"
                      style={{ color: "#4A5568" }}
                    >
                      {displayLast}
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-1 flex-shrink-0">
                    <div className="flex items-center gap-1">
                      {!conv.isGroup && !conv.isChannel && (
                        <CheckCheck size={11} style={{ color: "#19E6FF" }} />
                      )}
                      <span
                        className="text-[10px]"
                        style={{ color: "#4A5568" }}
                      >
                        {conv.lastTime ? timeAgo(conv.lastTime) : ""}
                      </span>
                    </div>
                    {conv.unread > 0 && (
                      <span
                        className="text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center"
                        style={{ background: "#19E6FF", color: "#06070B" }}
                      >
                        {conv.unread}
                      </span>
                    )}
                  </div>
                </button>
              );
            })
          )}
        </div>

        {/* New Chat Modal */}
        {/* Delete Friend Confirmation */}
        {friendToDelete && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center"
            style={{ background: "rgba(0,0,0,0.75)" }}
            data-ocid="chat.friends.delete.dialog"
          >
            <div
              className="mx-4 w-full max-w-sm rounded-2xl p-6"
              style={{ background: "#0E1320", border: "1px solid #2A3142" }}
            >
              <div className="text-center mb-4">
                <div className="text-3xl mb-2">🗑️</div>
                <h3
                  className="font-bold text-base"
                  style={{ color: "#F2F4FF" }}
                >
                  Arkadaşı Sil
                </h3>
                <p className="text-xs mt-1" style={{ color: "#A7ACBE" }}>
                  <span style={{ color: "#19E6FF" }}>{friendToDelete}</span>{" "}
                  arkadaş listesinden kaldırılsın mı?
                </p>
              </div>
              <div className="flex gap-3">
                <button
                  type="button"
                  data-ocid="chat.friends.delete.cancel_button"
                  className="flex-1 py-2.5 rounded-xl text-sm font-bold"
                  style={{
                    background: "rgba(167,172,190,0.1)",
                    color: "#A7ACBE",
                    border: "1px solid #2A3142",
                  }}
                  onClick={() => setFriendToDelete(null)}
                >
                  İptal
                </button>
                <button
                  type="button"
                  data-ocid="chat.friends.delete.confirm_button"
                  className="flex-1 py-2.5 rounded-xl text-sm font-bold"
                  style={{
                    background: "rgba(255,79,79,0.15)",
                    color: "#FF4F4F",
                    border: "1px solid rgba(255,79,79,0.3)",
                  }}
                  onClick={() => {
                    if (friendToDelete) {
                      removeFriend(
                        friendToDelete as import("@/lib/mockData").AnonymousID,
                      );
                      toast.success("Arkadaş silindi");
                      setFriendToDelete(null);
                    }
                  }}
                >
                  Sil
                </button>
              </div>
            </div>
          </div>
        )}

        {showNewChat && (
          <div
            className="fixed inset-0 z-50 flex items-end justify-center"
            style={{ background: "rgba(0,0,0,0.7)" }}
            onClick={() => setShowNewChat(false)}
            onKeyDown={(e) => e.key === "Escape" && setShowNewChat(false)}
            data-ocid="chat.dialog"
          >
            <div
              className="w-full max-w-md rounded-t-2xl p-5 pb-8"
              style={{ background: "#0E1320", border: "1px solid #1A2030" }}
              onClick={(e) => e.stopPropagation()}
              onKeyDown={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold" style={{ color: "#F2F4FF" }}>
                  New Chat
                </h3>
                <button
                  type="button"
                  onClick={() => setShowNewChat(false)}
                  data-ocid="chat.close_button"
                >
                  <X size={18} style={{ color: "#A7ACBE" }} />
                </button>
              </div>
              <input
                className="w-full rounded-xl px-4 py-3 text-sm mb-3"
                style={{
                  background: "#151A26",
                  border: "1px solid #2A3142",
                  color: "#F2F4FF",
                }}
                placeholder="Enter +777 ID..."
                value={newChatId}
                onChange={(e) => setNewChatId(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleNewChat()}
                data-ocid="chat.input"
              />
              <label className="flex items-center gap-2 mb-4 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isTempSession}
                  onChange={(e) => setIsTempSession(e.target.checked)}
                  className="w-4 h-4 rounded"
                  style={{ accentColor: "#19E6FF" }}
                  data-ocid="chat.checkbox"
                />
                <span className="text-xs" style={{ color: "#A7ACBE" }}>
                  ⏳ Temporary Session (24h) — auto-delete after 24 hours
                </span>
              </label>
              <button
                type="button"
                onClick={handleNewChat}
                className="w-full py-3 rounded-xl font-semibold text-sm"
                style={{
                  background: "rgba(25,230,255,0.15)",
                  border: "1px solid rgba(25,230,255,0.4)",
                  color: "#19E6FF",
                }}
                data-ocid="chat.submit_button"
              >
                Start Chat
              </button>
            </div>
          </div>
        )}

        {/* New Group Modal */}
        {showNewGroup && (
          <div
            className="fixed inset-0 z-50 flex items-end justify-center"
            style={{ background: "rgba(0,0,0,0.7)" }}
            onClick={() => setShowNewGroup(false)}
            onKeyDown={(e) => e.key === "Escape" && setShowNewGroup(false)}
          >
            <div
              className="w-full max-w-md rounded-t-2xl p-5 pb-8"
              style={{ background: "#0E1320", border: "1px solid #1A2030" }}
              onClick={(e) => e.stopPropagation()}
              onKeyDown={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold" style={{ color: "#F2F4FF" }}>
                  New Group
                </h3>
                <button type="button" onClick={() => setShowNewGroup(false)}>
                  <X size={18} style={{ color: "#A7ACBE" }} />
                </button>
              </div>
              <input
                className="w-full rounded-xl px-4 py-3 text-sm mb-3"
                style={{
                  background: "#151A26",
                  border: "1px solid #2A3142",
                  color: "#F2F4FF",
                }}
                placeholder="Group name..."
                value={newGroupName}
                onChange={(e) => setNewGroupName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleNewGroup()}
                data-ocid="chat.input"
              />
              <button
                type="button"
                onClick={handleNewGroup}
                className="w-full py-3 rounded-xl font-semibold text-sm"
                style={{
                  background: "rgba(181,107,255,0.15)",
                  border: "1px solid rgba(181,107,255,0.4)",
                  color: "#B56BFF",
                }}
                data-ocid="chat.submit_button"
              >
                Create Group
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }

  // ─── Chat Thread ─────────────────────────────────────────────────────────────
  const title = activeConv?.name || activeConv?.participants[0] || "Unknown";
  const isOnlineConv = false;

  return (
    <div
      className="flex flex-col h-full animate-fade-in"
      style={{ position: "relative" }}
    >
      {/* Thread Header */}
      <div
        className="flex items-center gap-2 px-3 py-3 flex-shrink-0"
        style={{
          background: "rgba(14,19,32,0.95)",
          borderBottom: "1px solid #1A2030",
          zIndex: 10,
        }}
      >
        <button
          type="button"
          onClick={() => setActiveConversation(null)}
          className="p-1 flex-shrink-0"
          data-ocid="chat.link"
        >
          <ChevronLeft size={20} style={{ color: "#19E6FF" }} />
        </button>
        <div className="relative flex-shrink-0">
          <div
            className="w-9 h-9 rounded-full flex items-center justify-center text-sm"
            style={{ background: "linear-gradient(135deg,#1A2030,#2A3142)" }}
          >
            {activeConv?.isChannel
              ? "📡"
              : activeConv?.isGroup
                ? "👥"
                : title.charAt(0)}
          </div>
          {isOnlineConv && (
            <span
              className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full"
              style={{ background: "#2FF5C7", border: "2px solid #06070B" }}
            />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            {activeConv?.isChannel ? (
              <Hash size={12} style={{ color: "#B56BFF" }} />
            ) : activeConv?.isGroup ? (
              <Users size={12} style={{ color: "#2FF5C7" }} />
            ) : null}
            <p
              className="font-bold text-sm truncate"
              style={{ color: "#F2F4FF" }}
            >
              {title}
            </p>
            {activeConv?.ghostMode && (
              <span
                className="text-[9px] px-1.5 py-0.5 rounded-full flex-shrink-0"
                style={{
                  background: "rgba(181,107,255,0.2)",
                  color: "#B56BFF",
                }}
              >
                GHOST
              </span>
            )}
            {isTempSession && (
              <span
                className="text-[9px] px-1.5 py-0.5 rounded-full flex-shrink-0"
                style={{ background: "rgba(255,179,71,0.2)", color: "#FFB347" }}
              >
                ⏳ TEMP
              </span>
            )}
          </div>
          <div className="flex items-center gap-1.5">
            <Lock size={9} style={{ color: "#2FF5C7" }} />
            <span
              className="text-[9px] font-semibold"
              style={{ color: "#2FF5C7" }}
            >
              E2EE
            </span>
            <span
              className="text-[10px]"
              style={{ color: isOnlineConv ? "#2FF5C7" : "#4A5568" }}
            >
              {isOnlineConv
                ? "Online"
                : activeConv?.isGroup
                  ? `${activeConv.participants.length} members`
                  : "Last seen recently"}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-1">
          {!activeConv?.isChannel && (
            <>
              <button
                type="button"
                onClick={() => {
                  const friend = activeConv?.participants.find(
                    (p) => p !== myId,
                  );
                  if (friend) webrtc.initiateCall(friend, "voice");
                }}
                className="p-1.5 rounded-lg"
                style={{ background: "rgba(47,245,199,0.1)" }}
                data-ocid="chat.button"
                title="Voice Call"
              >
                <Phone size={14} style={{ color: "#2FF5C7" }} />
              </button>
              <button
                type="button"
                onClick={() => {
                  const friend = activeConv?.participants.find(
                    (p) => p !== myId,
                  );
                  if (friend) webrtc.initiateCall(friend, "video");
                }}
                className="p-1.5 rounded-lg"
                style={{ background: "rgba(181,107,255,0.1)" }}
                data-ocid="chat.button"
                title="Video Call"
              >
                <Video size={14} style={{ color: "#B56BFF" }} />
              </button>
            </>
          )}
          <button
            type="button"
            onClick={() => setShowAIPanel(true)}
            className="p-1.5 rounded-lg"
            style={{ background: "rgba(25,230,255,0.1)" }}
            data-ocid="chat.button"
            title="AI Assistant"
          >
            <Bot size={14} style={{ color: "#19E6FF" }} />
          </button>
          <button
            type="button"
            onClick={() => setShowSearch((p) => !p)}
            className="p-1.5 rounded-lg"
            style={{
              background: showSearch ? "rgba(25,230,255,0.1)" : "transparent",
            }}
            data-ocid="chat.search_input"
          >
            <Search
              size={14}
              style={{ color: showSearch ? "#19E6FF" : "#A7ACBE" }}
            />
          </button>
          <button
            type="button"
            onClick={() => setShowPrivacyMenu((p) => !p)}
            className="p-1.5 rounded-lg"
            style={{
              background: screenshotProtection
                ? "rgba(255,79,79,0.15)"
                : "transparent",
            }}
            data-ocid="chat.toggle"
            title="Privacy Settings"
          >
            <Shield
              size={14}
              style={{ color: screenshotProtection ? "#FF4F4F" : "#A7ACBE" }}
            />
          </button>
        </div>
      </div>

      <PrivacyModeBanner />

      {/* Privacy Menu Dropdown */}
      {showPrivacyMenu && (
        <div
          className="flex-shrink-0 px-4 py-3"
          style={{ background: "#0A0E1A", borderBottom: "1px solid #1A2030" }}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Eye
                size={13}
                style={{ color: screenshotProtection ? "#FF4F4F" : "#A7ACBE" }}
              />
              <span
                className="text-xs font-semibold"
                style={{ color: "#F2F4FF" }}
              >
                Screenshot Protection
              </span>
            </div>
            <button
              type="button"
              onClick={() => {
                setScreenshotProtection((p) => !p);
                setShowPrivacyMenu(false);
              }}
              className="px-3 py-1 rounded-full text-xs font-semibold transition-all"
              style={{
                background: screenshotProtection
                  ? "rgba(255,79,79,0.2)"
                  : "rgba(25,230,255,0.1)",
                color: screenshotProtection ? "#FF4F4F" : "#19E6FF",
                border: `1px solid ${screenshotProtection ? "rgba(255,79,79,0.4)" : "rgba(25,230,255,0.3)"}`,
              }}
              data-ocid="chat.toggle"
            >
              {screenshotProtection ? "ON" : "OFF"}
            </button>
          </div>
        </div>
      )}

      {/* Search bar */}
      {showSearch && (
        <div
          className="px-4 py-2 flex-shrink-0"
          style={{
            background: "rgba(14,19,32,0.9)",
            borderBottom: "1px solid #1A2030",
          }}
        >
          <input
            className="w-full rounded-xl px-3 py-2 text-sm"
            style={{
              background: "#151A26",
              border: "1px solid #2A3142",
              color: "#F2F4FF",
            }}
            placeholder="Search messages..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            data-ocid="chat.search_input"
          />
        </div>
      )}

      {/* Screenshot Protection Overlay */}
      {screenshotProtection && (
        <div
          className="absolute top-0 left-0 right-0 z-20 flex items-center justify-center py-1.5"
          style={{
            background: "rgba(255,79,79,0.15)",
            borderBottom: "1px solid rgba(255,79,79,0.3)",
          }}
        >
          <EyeOff size={12} style={{ color: "#FF4F4F" }} />
          <span
            className="ml-1.5 text-[10px] font-bold"
            style={{ color: "#FF4F4F" }}
          >
            SCREENSHOT PROTECTION: ON
          </span>
        </div>
      )}

      {/* Messages */}
      <div
        className="flex-1 overflow-y-auto px-4 py-3 space-y-1 scrollbar-hide"
        style={{
          userSelect: screenshotProtection ? "none" : "auto",
          WebkitUserSelect: screenshotProtection ? "none" : "auto",
          marginTop: screenshotProtection ? "28px" : 0,
        }}
      >
        {displayedMessages.map((msg, idx) => {
          const isMe = msg.senderId === myId;
          const isExpired =
            msg.selfDestructAt && Date.now() > msg.selfDestructAt;
          const showUnreadDivider =
            firstUnreadIndex !== null &&
            idx === firstUnreadIndex &&
            !searchQuery;
          const replyMsg = msg.replyToId
            ? activeConv?.messages.find((m) => m.id === msg.replyToId)
            : null;
          const showTranslation =
            showTranslated[msg.id] && msg.translatedContent;
          const mediaInfo = parseMediaContent(msg.content);
          const urlInMsg = !mediaInfo.isMedia ? extractUrl(msg.content) : null;

          return (
            <div key={msg.id}>
              {showUnreadDivider && (
                <div
                  className="flex items-center gap-3 my-4"
                  data-ocid="chat.row"
                >
                  <div
                    className="flex-1 h-px"
                    style={{ background: "#2A3142" }}
                  />
                  <span
                    className="text-[10px] font-semibold tracking-wider px-2"
                    style={{ color: "#19E6FF" }}
                  >
                    NEW MESSAGES
                  </span>
                  <div
                    className="flex-1 h-px"
                    style={{ background: "#2A3142" }}
                  />
                </div>
              )}
              <div
                className={`flex ${isMe ? "justify-end" : "justify-start"} mb-1`}
                onPointerDown={(e) => handlePointerDown(msg, e)}
                onPointerUp={handlePointerUp}
                onPointerLeave={handlePointerUp}
              >
                <div className="max-w-[78%]">
                  {!isMe && activeConv?.isGroup && (
                    <p
                      className="text-[10px] mb-1 font-mono"
                      style={{ color: "#19E6FF", opacity: 0.7 }}
                    >
                      {msg.senderId}
                    </p>
                  )}
                  <div
                    className="px-3 py-2 rounded-2xl text-sm relative"
                    style={{
                      background: isMe ? "rgba(25,230,255,0.12)" : "#151A26",
                      border: `1px solid ${isMe ? "rgba(25,230,255,0.25)" : "#2A3142"}`,
                      color: isExpired ? "transparent" : "#F2F4FF",
                      filter: isExpired ? "blur(4px)" : "none",
                      opacity: isExpired ? 0.3 : 1,
                    }}
                  >
                    {replyMsg && (
                      <div
                        className="mb-2 px-2 py-1 rounded-lg text-xs truncate"
                        style={{
                          background: "rgba(25,230,255,0.07)",
                          borderLeft: "3px solid #19E6FF",
                          color: "#A7ACBE",
                        }}
                      >
                        ↩ {replyMsg.content.slice(0, 60)}
                        {replyMsg.content.length > 60 ? "..." : ""}
                      </div>
                    )}

                    {/* Content */}
                    {msg.isVoice ? (
                      <VoiceWaveform duration={msg.voiceDuration} />
                    ) : mediaInfo.isMedia ? (
                      <div>
                        {mediaInfo.mediaType === "image" && (
                          <button
                            type="button"
                            onClick={() =>
                              setPreviewMedia({
                                url: mediaInfo.mediaUrl!,
                                type: "image",
                                name: mediaInfo.mediaName!,
                              })
                            }
                            className="block w-full"
                            data-ocid="chat.button"
                          >
                            <div
                              className="rounded-xl overflow-hidden mb-1"
                              style={{ width: 200, height: 140 }}
                            >
                              <img
                                src={mediaInfo.mediaUrl}
                                alt={mediaInfo.mediaName}
                                className="w-full h-full object-cover"
                                style={{ display: "block" }}
                              />
                            </div>
                          </button>
                        )}
                        {mediaInfo.mediaType === "video" && (
                          <button
                            type="button"
                            onClick={() =>
                              setPreviewMedia({
                                url: mediaInfo.mediaUrl!,
                                type: "video",
                                name: mediaInfo.mediaName!,
                              })
                            }
                            className="relative block"
                            data-ocid="chat.button"
                          >
                            <div
                              className="rounded-xl flex items-center justify-center mb-1"
                              style={{
                                width: 200,
                                height: 120,
                                background: "#0A0E1A",
                                border: "1px solid #2A3142",
                              }}
                            >
                              <div
                                className="absolute inset-0 rounded-xl"
                                style={{
                                  background:
                                    "linear-gradient(135deg,rgba(181,107,255,0.3),rgba(25,230,255,0.1))",
                                }}
                              />
                              <div
                                className="w-12 h-12 rounded-full flex items-center justify-center"
                                style={{ background: "rgba(255,255,255,0.15)" }}
                              >
                                <Play size={20} style={{ color: "#fff" }} />
                              </div>
                            </div>
                          </button>
                        )}
                        {mediaInfo.mediaType === "document" && (
                          <button
                            type="button"
                            onClick={() =>
                              setPreviewMedia({
                                url: mediaInfo.mediaUrl!,
                                type: "document",
                                name: mediaInfo.mediaName!,
                              })
                            }
                            className="flex items-center gap-3 px-3 py-2.5 rounded-xl"
                            style={{
                              background: "rgba(255,255,255,0.05)",
                              border: "1px solid #2A3142",
                            }}
                            data-ocid="chat.button"
                          >
                            <div
                              className="w-9 h-9 rounded-lg flex items-center justify-center"
                              style={{ background: "rgba(25,230,255,0.15)" }}
                            >
                              <FileText
                                size={18}
                                style={{ color: "#19E6FF" }}
                              />
                            </div>
                            <div className="min-w-0">
                              <p
                                className="text-xs font-semibold truncate"
                                style={{ color: "#F2F4FF", maxWidth: 120 }}
                              >
                                {mediaInfo.mediaName}
                              </p>
                              <p
                                className="text-[10px]"
                                style={{ color: "#4A5568" }}
                              >
                                Document • Tap to preview
                              </p>
                            </div>
                          </button>
                        )}
                      </div>
                    ) : msg.content.startsWith("__LOCATION__") ? (
                      (() => {
                        const parts = msg.content.split("__");
                        const lat = parts[2];
                        const lng = parts[3];
                        return (
                          <a
                            href={`https://www.google.com/maps?q=${lat},${lng}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-2 px-2 py-1.5 rounded-xl"
                            style={{
                              background: "rgba(255,79,79,0.1)",
                              border: "1px solid rgba(255,79,79,0.25)",
                              color: "#FF4F4F",
                              textDecoration: "none",
                            }}
                          >
                            <MapPin size={14} />
                            <div>
                              <p className="text-xs font-bold">
                                Konum Paylaşıldı
                              </p>
                              <p
                                className="text-[10px]"
                                style={{ color: "#A7ACBE" }}
                              >
                                {lat}, {lng}
                              </p>
                            </div>
                          </a>
                        );
                      })()
                    ) : (
                      <span>
                        {showTranslation ? msg.translatedContent : msg.content}
                      </span>
                    )}

                    {/* Translation toggle */}
                    {!isMe && !msg.isVoice && !mediaInfo.isMedia && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (msg.translatedContent) {
                            setShowTranslated((p) => ({
                              ...p,
                              [msg.id]: !p[msg.id],
                            }));
                          } else {
                            const translated = getTranslation(msg.content);
                            setMessageTranslation(
                              activeConversationId!,
                              msg.id,
                              translated,
                            );
                            setShowTranslated((p) => ({
                              ...p,
                              [msg.id]: true,
                            }));
                          }
                        }}
                        className="ml-1.5 inline-flex"
                        style={{ opacity: 0.45 }}
                      >
                        <Globe
                          size={11}
                          style={{
                            color: showTranslation ? "#19E6FF" : "#A7ACBE",
                          }}
                        />
                      </button>
                    )}
                  </div>

                  {/* Link Preview Card */}
                  {urlInMsg &&
                    !mediaInfo.isMedia &&
                    (() => {
                      const preview = getLinkPreview(urlInMsg);
                      return (
                        <div
                          className="mt-1.5 rounded-xl overflow-hidden"
                          style={{
                            background: "#0E1320",
                            border: "1px solid #2A3142",
                          }}
                        >
                          <div className="px-3 py-2.5">
                            <div className="flex items-center gap-1.5 mb-1">
                              <div
                                className="w-4 h-4 rounded flex items-center justify-center text-[10px]"
                                style={{ background: "#151A26" }}
                              >
                                🌐
                              </div>
                              <span
                                className="text-[10px]"
                                style={{ color: "#4A5568" }}
                              >
                                {preview.domain}
                              </span>
                            </div>
                            <p
                              className="text-xs font-semibold mb-0.5"
                              style={{ color: "#F2F4FF" }}
                            >
                              {preview.title}
                            </p>
                            <p
                              className="text-[10px] mb-2"
                              style={{ color: "#A7ACBE" }}
                            >
                              {preview.desc}
                            </p>
                            {linkSummaries[msg.id] ? (
                              <div
                                className="px-2 py-1.5 rounded-lg text-[10px]"
                                style={{
                                  background: "rgba(25,230,255,0.08)",
                                  border: "1px solid rgba(25,230,255,0.2)",
                                  color: "#A7ACBE",
                                }}
                              >
                                <span style={{ color: "#19E6FF" }}>
                                  🤖 AI Summary:{" "}
                                </span>
                                {linkSummaries[msg.id]}
                              </div>
                            ) : (
                              <button
                                type="button"
                                onClick={() =>
                                  handleLinkSummary(msg.id, urlInMsg)
                                }
                                className="text-[10px] px-2 py-1 rounded-full"
                                style={{
                                  background: "rgba(25,230,255,0.1)",
                                  color: "#19E6FF",
                                  border: "1px solid rgba(25,230,255,0.3)",
                                }}
                                data-ocid="chat.button"
                              >
                                🤖 AI Summary
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })()}

                  {/* Reactions */}
                  {msg.reactions && Object.keys(msg.reactions).length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-1">
                      {Object.entries(msg.reactions).map(
                        ([emoji, users]) =>
                          users.length > 0 && (
                            <button
                              key={emoji}
                              type="button"
                              onClick={() => handleReaction(msg.id, emoji)}
                              className="flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-xs"
                              style={{
                                background: users.includes(myId ?? "me")
                                  ? "rgba(25,230,255,0.15)"
                                  : "rgba(255,255,255,0.05)",
                                border: `1px solid ${users.includes(myId ?? "me") ? "rgba(25,230,255,0.4)" : "#2A3142"}`,
                              }}
                            >
                              {emoji}{" "}
                              <span style={{ color: "#A7ACBE" }}>
                                {users.length}
                              </span>
                            </button>
                          ),
                      )}
                    </div>
                  )}

                  {/* Timestamp + status */}
                  <div
                    className={`flex items-center gap-1 mt-0.5 ${isMe ? "justify-end" : "justify-start"}`}
                  >
                    <span className="text-[10px]" style={{ color: "#4A5568" }}>
                      {formatTime(msg.timestamp)}
                    </span>
                    {msg.selfDestructAt && !isExpired && (
                      <span
                        className="text-[10px] flex items-center gap-0.5"
                        style={{ color: "#FFB347" }}
                      >
                        <Timer size={9} />
                      </span>
                    )}
                    {isMe && <StatusIcon status={msg.status} />}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
        {isTyping && <TypingBubble />}
        <div ref={messagesEndRef} />
      </div>

      {/* Smart Replies */}
      {smartReplies.length > 0 && !input && (
        <div
          className="flex gap-2 px-4 py-2 flex-shrink-0 overflow-x-auto scrollbar-hide"
          style={{ borderTop: "1px solid #1A2030" }}
        >
          {smartReplies.map((reply) => (
            <button
              key={reply}
              type="button"
              onClick={() => handleSend(reply)}
              className="flex-shrink-0 text-xs px-3 py-1.5 rounded-full"
              style={{
                background: "rgba(25,230,255,0.08)",
                border: "1px solid rgba(25,230,255,0.25)",
                color: "#A7ACBE",
                whiteSpace: "nowrap",
              }}
            >
              {reply}
            </button>
          ))}
        </div>
      )}

      {/* Pending Media Preview */}
      {pendingMedia && (
        <div
          className="flex items-center gap-3 px-4 py-2 flex-shrink-0"
          style={{
            borderTop: "1px solid #1A2030",
            background: "rgba(25,230,255,0.04)",
          }}
        >
          {pendingMedia.type === "image" && (
            <img
              src={pendingMedia.url}
              alt="preview"
              className="w-14 h-14 object-cover rounded-xl"
            />
          )}
          {pendingMedia.type === "video" && (
            <div
              className="w-14 h-14 rounded-xl flex items-center justify-center"
              style={{ background: "#0E1320", border: "1px solid #2A3142" }}
            >
              <Play size={18} style={{ color: "#B56BFF" }} />
            </div>
          )}
          {pendingMedia.type === "document" && (
            <div
              className="w-14 h-14 rounded-xl flex items-center justify-center"
              style={{ background: "#0E1320", border: "1px solid #2A3142" }}
            >
              <FileText size={18} style={{ color: "#19E6FF" }} />
            </div>
          )}
          <div className="flex-1 min-w-0">
            <p
              className="text-xs font-semibold truncate"
              style={{ color: "#F2F4FF" }}
            >
              {pendingMedia.name}
            </p>
            <p className="text-[10px]" style={{ color: "#4A5568" }}>
              Ready to send
            </p>
          </div>
          <button
            type="button"
            onClick={handleSendMedia}
            className="p-2 rounded-xl"
            style={{
              background: "rgba(25,230,255,0.2)",
              border: "1px solid rgba(25,230,255,0.4)",
            }}
            data-ocid="chat.submit_button"
          >
            <Send size={14} style={{ color: "#19E6FF" }} />
          </button>
          <button
            type="button"
            onClick={() => setPendingMedia(null)}
            className="p-2 rounded-xl"
            style={{
              background: "rgba(255,79,79,0.1)",
              border: "1px solid rgba(255,79,79,0.3)",
            }}
          >
            <X size={14} style={{ color: "#FF4F4F" }} />
          </button>
        </div>
      )}

      {/* Compressing indicator */}
      {compressing && (
        <div
          className="flex items-center gap-2 px-4 py-2 flex-shrink-0"
          style={{
            borderTop: "1px solid #1A2030",
            background: "rgba(255,179,71,0.05)",
          }}
        >
          <div
            className="w-3 h-3 rounded-full animate-pulse"
            style={{ background: "#FFB347" }}
          />
          <span className="text-xs" style={{ color: "#FFB347" }}>
            Compressing media...
          </span>
        </div>
      )}

      {/* Input area */}
      <div
        className="px-4 py-3 flex-shrink-0"
        style={{
          borderTop: "1px solid #1A2030",
          background: "rgba(6,7,11,0.95)",
        }}
      >
        {replyTo && (
          <div
            className="flex items-center gap-2 mb-2 px-3 py-2 rounded-xl"
            style={{
              background: "rgba(25,230,255,0.07)",
              border: "1px solid rgba(25,230,255,0.2)",
            }}
          >
            <div className="flex-1 min-w-0">
              <p
                className="text-[10px] font-semibold"
                style={{ color: "#19E6FF" }}
              >
                Reply to
              </p>
              <p className="text-xs truncate" style={{ color: "#A7ACBE" }}>
                {replyTo.content.slice(0, 60)}
              </p>
            </div>
            <button type="button" onClick={() => setReplyTo(null)}>
              <X size={14} style={{ color: "#4A5568" }} />
            </button>
          </div>
        )}

        {/* Self-destruct timer */}
        <div className="flex gap-1.5 mb-2">
          {DESTRUCT_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => setDestructMins(opt.value)}
              className="flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-semibold transition-all"
              style={{
                background:
                  destructMins === opt.value
                    ? "rgba(255,179,71,0.2)"
                    : "rgba(255,255,255,0.03)",
                border: `1px solid ${destructMins === opt.value ? "rgba(255,179,71,0.5)" : "#1A2030"}`,
                color: destructMins === opt.value ? "#FFB347" : "#4A5568",
              }}
            >
              {opt.value > 0 && <Timer size={8} />}
              {opt.label}
            </button>
          ))}
          {/* PTT Toggle */}
          <button
            type="button"
            onClick={() => setIsPTT((p) => !p)}
            className="ml-auto flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-semibold"
            style={{
              background: isPTT
                ? "rgba(255,79,79,0.15)"
                : "rgba(255,255,255,0.03)",
              border: `1px solid ${isPTT ? "rgba(255,79,79,0.4)" : "#1A2030"}`,
              color: isPTT ? "#FF4F4F" : "#4A5568",
            }}
            data-ocid="chat.toggle"
          >
            <Zap size={8} />
            {isPTT ? "PTT" : "STD"}
          </button>
        </div>

        {/* Recording UI */}
        {isRecording && (
          <div
            className="flex items-center gap-3 px-3 py-2.5 rounded-2xl mb-2"
            style={{
              background: "rgba(255,79,79,0.08)",
              border: "1px solid rgba(255,79,79,0.3)",
            }}
          >
            <div
              className="w-2.5 h-2.5 rounded-full recording-pulse"
              style={{ background: "#FF4F4F" }}
            />
            <RecordingWaveform />
            <span
              className="ml-auto text-xs font-mono"
              style={{ color: "#FF4F4F" }}
            >
              {String(Math.floor(recordingDuration / 60)).padStart(2, "0")}:
              {String(recordingDuration % 60).padStart(2, "0")}
            </span>
            <button
              type="button"
              onClick={() => {
                setIsRecording(false);
                setRecordingDuration(0);
              }}
              className="p-1"
            >
              <Square size={14} style={{ color: "#FF4F4F" }} />
            </button>
          </div>
        )}

        {/* PTT indicator */}
        {isPTT && pttActive && (
          <div
            className="flex items-center justify-center gap-2 px-3 py-2 rounded-2xl mb-2"
            style={{
              background: "rgba(255,79,79,0.15)",
              border: "1px solid rgba(255,79,79,0.4)",
            }}
          >
            <div
              className="w-2 h-2 rounded-full animate-pulse"
              style={{ background: "#FF4F4F" }}
            />
            <span
              className="text-xs font-semibold"
              style={{ color: "#FF4F4F" }}
            >
              Transmitting... Release to send
            </span>
          </div>
        )}

        {/* Input row */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShowMediaSheet(true)}
            className="p-2 rounded-xl flex-shrink-0"
            style={{ background: "#151A26", border: "1px solid #2A3142" }}
            data-ocid="chat.upload_button"
          >
            <Paperclip size={16} style={{ color: "#A7ACBE" }} />
          </button>

          <input
            className="flex-1 rounded-2xl px-4 py-2.5 text-sm outline-none"
            style={{
              background: "#0E1320",
              border: "1px solid #2A3142",
              color: "#F2F4FF",
            }}
            placeholder={
              activeConv?.ghostMode ? "Ghost message..." : "Message..."
            }
            value={input}
            onChange={(e) => {
              setInput(e.target.value);
              if (e.target.value) setSmartReplies([]);
            }}
            onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSend()}
            data-ocid="chat.input"
          />

          {input.trim() ? (
            <button
              type="button"
              onClick={() => handleSend()}
              className="p-2.5 rounded-xl flex-shrink-0"
              style={{
                background: "rgba(25,230,255,0.2)",
                border: "1px solid rgba(25,230,255,0.4)",
              }}
              data-ocid="chat.submit_button"
            >
              <Send size={16} style={{ color: "#19E6FF" }} />
            </button>
          ) : isRecording ? (
            <button
              type="button"
              onClick={handleSendVoice}
              className="p-2.5 rounded-xl flex-shrink-0"
              style={{
                background: "rgba(25,230,255,0.2)",
                border: "1px solid rgba(25,230,255,0.4)",
              }}
              data-ocid="chat.submit_button"
            >
              <Send size={16} style={{ color: "#19E6FF" }} />
            </button>
          ) : isPTT ? (
            <button
              type="button"
              onPointerDown={() => {
                setPttActive(true);
              }}
              onPointerUp={() => {
                if (pttActive) {
                  setPttActive(false);
                  if (!activeConversationId) return;
                  sendMessage(
                    activeConversationId,
                    "Voice message",
                    destructMins || undefined,
                    true,
                    2,
                    replyTo?.id,
                  );
                  toast.success("PTT message sent");
                }
              }}
              onPointerLeave={() => {
                setPttActive(false);
              }}
              className="p-2.5 rounded-xl flex-shrink-0 select-none"
              style={{
                background: pttActive
                  ? "rgba(255,79,79,0.3)"
                  : "rgba(255,79,79,0.1)",
                border: `1px solid ${pttActive ? "rgba(255,79,79,0.6)" : "rgba(255,79,79,0.3)"}`,
              }}
              data-ocid="chat.button"
            >
              <Mic
                size={16}
                style={{ color: pttActive ? "#FF4F4F" : "#A7ACBE" }}
              />
            </button>
          ) : (
            <button
              type="button"
              onClick={() => {
                if (!isRecording) {
                  navigator.mediaDevices
                    ?.getUserMedia({ audio: true })
                    .then(() => setIsRecording(true))
                    .catch(() => setIsRecording(true));
                } else {
                  setIsRecording(false);
                }
              }}
              className="p-2.5 rounded-xl flex-shrink-0"
              style={{ background: "#151A26", border: "1px solid #2A3142" }}
              data-ocid="chat.button"
            >
              <Mic
                size={16}
                style={{ color: isRecording ? "#FF4F4F" : "#A7ACBE" }}
              />
            </button>
          )}
        </div>
      </div>

      {/* Hidden file inputs */}
      <input
        ref={imageInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) handleFileSelect(f, "image");
          e.target.value = "";
        }}
      />
      <input
        ref={videoInputRef}
        type="file"
        accept="video/*"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) handleFileSelect(f, "video");
          e.target.value = "";
        }}
      />
      <input
        ref={docInputRef}
        type="file"
        accept=".pdf,.doc,.docx,.txt,.zip"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) handleFileSelect(f, "document");
          e.target.value = "";
        }}
      />

      {/* Media Sheet */}
      {showMediaSheet && (
        <div
          className="fixed inset-0 z-50 flex items-end"
          style={{ background: "rgba(0,0,0,0.6)" }}
          onClick={() => setShowMediaSheet(false)}
          onKeyDown={(e) => e.key === "Escape" && setShowMediaSheet(false)}
          data-ocid="chat.sheet"
        >
          <div
            className="w-full max-w-md mx-auto rounded-t-2xl pb-8"
            style={{ background: "#0E1320", border: "1px solid #1A2030" }}
            onClick={(e) => e.stopPropagation()}
            onKeyDown={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-5 pt-5 pb-4">
              <h3 className="font-bold text-sm" style={{ color: "#F2F4FF" }}>
                Attach Media
              </h3>
              <button
                type="button"
                onClick={() => setShowMediaSheet(false)}
                data-ocid="chat.close_button"
              >
                <X size={18} style={{ color: "#A7ACBE" }} />
              </button>
            </div>
            <div className="grid grid-cols-4 gap-3 px-5">
              {[
                {
                  label: "📷 Photo",
                  color: "#19E6FF",
                  action: () => {
                    imageInputRef.current?.click();
                  },
                },
                {
                  label: "🎥 Video",
                  color: "#B56BFF",
                  action: () => {
                    videoInputRef.current?.click();
                  },
                },
                {
                  label: "📄 File",
                  color: "#2FF5C7",
                  action: () => {
                    docInputRef.current?.click();
                  },
                },
                {
                  label: "🎙️ Audio",
                  color: "#FFB347",
                  action: () => {
                    setShowMediaSheet(false);
                    setIsRecording(true);
                  },
                },
                {
                  label: "📍 Location",
                  color: "#FF4F4F",
                  action: () => {
                    setShowMediaSheet(false);
                    if (!activeConversationId) {
                      toast.error("Önce bir sohbet aç");
                      return;
                    }
                    navigator.geolocation.getCurrentPosition(
                      (pos) => {
                        const lat = pos.coords.latitude.toFixed(5);
                        const lng = pos.coords.longitude.toFixed(5);
                        sendMessage(
                          activeConversationId,
                          `__LOCATION__${lat}__${lng}__`,
                          undefined,
                          false,
                          undefined,
                          replyTo?.id,
                        );
                        setReplyTo(null);
                        toast.success("Konum paylaşıldı 📍");
                      },
                      () => toast.error("Konum erişimi reddedildi"),
                    );
                  },
                },
                {
                  label: "👤 Contact",
                  color: "#A7ACBE",
                  action: () => {
                    setShowMediaSheet(false);
                    toast.info("Contact sharing");
                  },
                },
                {
                  label: "🎵 Music",
                  color: "#19E6FF",
                  action: () => {
                    setShowMediaSheet(false);
                    toast.info("Music sharing");
                  },
                },
                {
                  label: "🖥️ GIF",
                  color: "#B56BFF",
                  action: () => {
                    setShowMediaSheet(false);
                    toast.info("GIF picker");
                  },
                },
              ].map(({ label, color, action }) => (
                <button
                  key={label}
                  type="button"
                  onClick={action}
                  className="flex flex-col items-center gap-2 p-3 rounded-2xl"
                  style={{ background: "#151A26", border: "1px solid #2A3142" }}
                  data-ocid="chat.button"
                >
                  <span className="text-xl">{label.split(" ")[0]}</span>
                  <span className="text-[10px]" style={{ color }}>
                    {label.split(" ").slice(1).join(" ")}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Media Preview Modal */}
      {previewMedia && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center"
          style={{ background: "rgba(0,0,0,0.92)" }}
          onClick={() => setPreviewMedia(null)}
          onKeyDown={(e) => e.key === "Escape" && setPreviewMedia(null)}
          data-ocid="chat.modal"
        >
          <div
            className="w-full max-w-lg p-4"
            onClick={(e) => e.stopPropagation()}
            onKeyDown={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <span
                className="text-sm font-semibold"
                style={{ color: "#F2F4FF" }}
              >
                {previewMedia.name}
              </span>
              <div className="flex items-center gap-2">
                <a
                  href={previewMedia.url}
                  download={previewMedia.name}
                  className="p-2 rounded-xl"
                  style={{
                    background: "rgba(25,230,255,0.15)",
                    border: "1px solid rgba(25,230,255,0.3)",
                  }}
                  data-ocid="chat.button"
                >
                  <Download size={16} style={{ color: "#19E6FF" }} />
                </a>
                <button
                  type="button"
                  onClick={() => setPreviewMedia(null)}
                  className="p-2 rounded-xl"
                  style={{ background: "rgba(255,79,79,0.1)" }}
                  data-ocid="chat.close_button"
                >
                  <X size={16} style={{ color: "#FF4F4F" }} />
                </button>
              </div>
            </div>
            {previewMedia.type === "image" && (
              <img
                src={previewMedia.url}
                alt={previewMedia.name}
                className="w-full rounded-2xl"
                style={{ maxHeight: "70vh", objectFit: "contain" }}
              />
            )}
            {previewMedia.type === "video" && (
              // biome-ignore lint/a11y/useMediaCaption: preview player
              <video
                src={previewMedia.url}
                controls
                className="w-full rounded-2xl"
                style={{ maxHeight: "70vh" }}
              />
            )}
            {previewMedia.type === "document" && (
              <div
                className="flex flex-col items-center justify-center py-16 rounded-2xl"
                style={{ background: "#0E1320", border: "1px solid #2A3142" }}
              >
                <FileText size={48} style={{ color: "#19E6FF" }} />
                <p className="mt-4 font-semibold" style={{ color: "#F2F4FF" }}>
                  {previewMedia.name}
                </p>
                <p className="text-sm mt-1" style={{ color: "#4A5568" }}>
                  Document preview
                </p>
                <a
                  href={previewMedia.url}
                  download={previewMedia.name}
                  className="mt-4 px-5 py-2.5 rounded-xl font-semibold text-sm"
                  style={{
                    background: "rgba(25,230,255,0.15)",
                    border: "1px solid rgba(25,230,255,0.4)",
                    color: "#19E6FF",
                  }}
                >
                  Download File
                </a>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Incoming Call Overlay */}
      {webrtc.incomingCall && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 1001,
            background: "rgba(0,0,0,0.92)",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: 24,
          }}
          data-ocid="chat.modal"
        >
          <div style={{ fontSize: 48 }}>
            {webrtc.incomingCall.callType === "video" ? "📹" : "📞"}
          </div>
          <div style={{ color: "#fff", fontSize: 20, fontWeight: 700 }}>
            {webrtc.incomingCall.fromId777}
          </div>
          <div style={{ color: "#A7ACBE", fontSize: 14 }}>
            {webrtc.incomingCall.callType === "video"
              ? "Görüntülü arama"
              : "Sesli arama"}
          </div>
          <div style={{ display: "flex", gap: 32, marginTop: 16 }}>
            <button
              type="button"
              onClick={webrtc.rejectCall}
              style={{
                width: 64,
                height: 64,
                borderRadius: "50%",
                background: "rgba(255,79,79,0.9)",
                border: "none",
                fontSize: 28,
                cursor: "pointer",
              }}
              data-ocid="chat.cancel_button"
            >
              📵
            </button>
            <button
              type="button"
              onClick={webrtc.answerCall}
              style={{
                width: 64,
                height: 64,
                borderRadius: "50%",
                background: "rgba(47,245,199,0.9)",
                border: "none",
                fontSize: 28,
                cursor: "pointer",
              }}
              data-ocid="chat.confirm_button"
            >
              ✅
            </button>
          </div>
        </div>
      )}

      {/* Call Modal */}
      {webrtc.callState !== "idle" && (
        <div
          className="fixed inset-0 z-[100] flex flex-col items-center justify-between py-12 px-6"
          style={{
            background:
              webrtc.callType === "video"
                ? "linear-gradient(180deg,#0A0610 0%,#06070B 100%)"
                : "linear-gradient(180deg,#061520 0%,#06070B 100%)",
          }}
          data-ocid="chat.modal"
        >
          {webrtc.callType === "video" &&
            webrtc.callState === "connected" &&
            !webrtc.videoOff && (
              <>
                <div
                  className="absolute inset-0"
                  style={{
                    background:
                      "linear-gradient(135deg,rgba(181,107,255,0.15),rgba(25,230,255,0.05),rgba(6,7,11,0.9))",
                    animation: "pulse 3s infinite",
                  }}
                />
                {/* biome-ignore lint/a11y/useMediaCaption: live video stream */}
                <video
                  ref={webrtc.remoteVideoRef}
                  autoPlay
                  playsInline
                  className="absolute inset-0 w-full h-full object-cover opacity-30"
                />
                <video
                  ref={webrtc.localVideoRef}
                  autoPlay
                  muted
                  playsInline
                  className="absolute bottom-4 right-4 w-24 h-32 rounded-xl object-cover z-20"
                  style={{ border: "2px solid rgba(25,230,255,0.5)" }}
                />
              </>
            )}
          <div className="relative z-10 flex flex-col items-center gap-4 text-center">
            <div
              className="w-24 h-24 rounded-full flex items-center justify-center text-4xl"
              style={{
                background: "linear-gradient(135deg,#1A2030,#2A3142)",
                border: "3px solid rgba(25,230,255,0.3)",
              }}
            >
              {(webrtc.remoteId777 ?? title).charAt(0)}
            </div>
            <div>
              <p className="text-xl font-bold" style={{ color: "#F2F4FF" }}>
                {webrtc.remoteId777 ?? title}
              </p>
              <p
                className="text-sm mt-1"
                style={{
                  color:
                    webrtc.callState === "connected" ? "#2FF5C7" : "#A7ACBE",
                }}
              >
                {webrtc.callState === "outgoing-ringing"
                  ? "Ringing..."
                  : formatCallDuration(webrtc.duration)}
              </p>
            </div>
            {webrtc.callType === "video" && webrtc.videoOff && (
              <div
                className="mt-2 px-3 py-1 rounded-full text-xs"
                style={{
                  background: "rgba(255,79,79,0.15)",
                  color: "#FF4F4F",
                  border: "1px solid rgba(255,79,79,0.3)",
                }}
              >
                Camera Off
              </div>
            )}
          </div>

          {/* Group call tiles (for group convs) */}
          {activeConv?.isGroup && webrtc.callState === "connected" && (
            <div className="relative z-10 flex gap-3 flex-wrap justify-center">
              {activeConv.participants.slice(0, 4).map((p, i) => (
                <div
                  key={p}
                  className="w-16 h-20 rounded-2xl flex flex-col items-center justify-center gap-1"
                  style={{ background: "#151A26", border: "1px solid #2A3142" }}
                >
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center text-base"
                    style={{
                      background: "linear-gradient(135deg,#1A2030,#2A3142)",
                    }}
                  >
                    {p.charAt(0)}
                  </div>
                  <span className="text-[9px]" style={{ color: "#A7ACBE" }}>
                    +777 {i + 1}xxx
                  </span>
                </div>
              ))}
            </div>
          )}

          {/* Call Controls */}
          <div className="relative z-10 flex items-center gap-4">
            <button
              type="button"
              onClick={webrtc.toggleMute}
              className="w-14 h-14 rounded-full flex items-center justify-center"
              style={{
                background: webrtc.muted
                  ? "rgba(255,79,79,0.3)"
                  : "rgba(255,255,255,0.1)",
                border: `1px solid ${webrtc.muted ? "rgba(255,79,79,0.5)" : "rgba(255,255,255,0.2)"}`,
              }}
              data-ocid="chat.toggle"
            >
              {webrtc.muted ? (
                <MicOff size={20} style={{ color: "#FF4F4F" }} />
              ) : (
                <Mic size={20} style={{ color: "#fff" }} />
              )}
            </button>
            {webrtc.callType === "video" && (
              <button
                type="button"
                onClick={webrtc.toggleVideo}
                className="w-14 h-14 rounded-full flex items-center justify-center"
                style={{
                  background: webrtc.videoOff
                    ? "rgba(255,79,79,0.3)"
                    : "rgba(255,255,255,0.1)",
                  border: `1px solid ${webrtc.videoOff ? "rgba(255,79,79,0.5)" : "rgba(255,255,255,0.2)"}`,
                }}
                data-ocid="chat.toggle"
              >
                {webrtc.videoOff ? (
                  <VideoOff size={20} style={{ color: "#FF4F4F" }} />
                ) : (
                  <Video size={20} style={{ color: "#fff" }} />
                )}
              </button>
            )}
            <button
              type="button"
              onClick={webrtc.hangUp}
              className="w-14 h-14 rounded-full flex items-center justify-center"
              style={{ background: "#FF4F4F" }}
              data-ocid="chat.delete_button"
            >
              <Phone
                size={20}
                style={{ color: "#fff", transform: "rotate(135deg)" }}
              />
            </button>
          </div>
        </div>
      )}

      {/* AI Assistant Panel */}
      {showAIPanel && (
        <div
          className="fixed inset-0 z-[90] flex items-end"
          style={{ background: "rgba(0,0,0,0.5)" }}
          onClick={() => setShowAIPanel(false)}
          onKeyDown={(e) => e.key === "Escape" && setShowAIPanel(false)}
          data-ocid="chat.sheet"
        >
          <div
            className="w-full max-w-md mx-auto rounded-t-2xl flex flex-col"
            style={{
              background: "#0A0E1A",
              border: "1px solid #1A2030",
              maxHeight: "75vh",
            }}
            onClick={(e) => e.stopPropagation()}
            onKeyDown={(e) => e.stopPropagation()}
          >
            <div
              className="flex items-center gap-3 px-4 py-3.5"
              style={{ borderBottom: "1px solid #1A2030" }}
            >
              <div
                className="w-8 h-8 rounded-xl flex items-center justify-center"
                style={{ background: "rgba(25,230,255,0.15)" }}
              >
                <Bot size={18} style={{ color: "#19E6FF" }} />
              </div>
              <div className="flex-1">
                <p className="text-sm font-bold" style={{ color: "#F2F4FF" }}>
                  OMNI AI Assistant
                </p>
                <p className="text-[10px]" style={{ color: "#2FF5C7" }}>
                  Online — Ready to help
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowAIPanel(false)}
                data-ocid="chat.close_button"
              >
                <X size={18} style={{ color: "#A7ACBE" }} />
              </button>
            </div>
            <div
              className="flex-1 overflow-y-auto p-4 space-y-3 scrollbar-hide"
              style={{ minHeight: 200 }}
            >
              {aiMessages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className="max-w-[85%] px-3 py-2 rounded-2xl text-sm"
                    style={{
                      background:
                        msg.role === "user"
                          ? "rgba(25,230,255,0.12)"
                          : "#151A26",
                      border: `1px solid ${msg.role === "user" ? "rgba(25,230,255,0.25)" : "#2A3142"}`,
                      color: "#F2F4FF",
                    }}
                  >
                    {msg.content}
                  </div>
                </div>
              ))}
              {aiTyping && (
                <div className="flex justify-start">
                  <div
                    className="px-4 py-3 rounded-2xl flex items-center gap-1"
                    style={{
                      background: "#151A26",
                      border: "1px solid #2A3142",
                    }}
                  >
                    <span
                      className="typing-dot"
                      style={{ animationDelay: "0ms" }}
                    />
                    <span
                      className="typing-dot"
                      style={{ animationDelay: "150ms" }}
                    />
                    <span
                      className="typing-dot"
                      style={{ animationDelay: "300ms" }}
                    />
                  </div>
                </div>
              )}
              <div ref={aiEndRef} />
            </div>
            <div className="p-4" style={{ borderTop: "1px solid #1A2030" }}>
              <div className="flex items-center gap-2">
                <input
                  className="flex-1 rounded-2xl px-4 py-2.5 text-sm outline-none"
                  style={{
                    background: "#151A26",
                    border: "1px solid #2A3142",
                    color: "#F2F4FF",
                  }}
                  placeholder="Ask OMNI AI..."
                  value={aiInput}
                  onChange={(e) => setAiInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && sendAIMessage()}
                  data-ocid="chat.input"
                />
                <button
                  type="button"
                  onClick={sendAIMessage}
                  className="p-2.5 rounded-xl"
                  style={{
                    background: "rgba(25,230,255,0.2)",
                    border: "1px solid rgba(25,230,255,0.4)",
                  }}
                  data-ocid="chat.submit_button"
                >
                  <Send size={16} style={{ color: "#19E6FF" }} />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Reaction Picker + Context Menu */}
      {contextMenu && (
        <div
          className="fixed inset-0 z-50"
          onClick={() => {
            setContextMenu(null);
            setReactionPickerMsgId(null);
          }}
          onKeyDown={(e) => {
            if (e.key === "Escape") {
              setContextMenu(null);
              setReactionPickerMsgId(null);
            }
          }}
        >
          <div
            className="absolute rounded-2xl overflow-hidden shadow-2xl"
            style={{
              left: Math.min(contextMenu.x - 10, window.innerWidth - 220),
              top: Math.max(contextMenu.y - 180, 60),
              background: "#0E1320",
              border: "1px solid #2A3142",
              minWidth: 200,
            }}
            onClick={(e) => e.stopPropagation()}
            onKeyDown={(e) => e.stopPropagation()}
          >
            <div
              className="flex items-center gap-1 px-3 py-2.5"
              style={{ borderBottom: "1px solid #1A2030" }}
            >
              {REACTION_EMOJIS.map((emoji) => (
                <button
                  key={emoji}
                  type="button"
                  onClick={() => handleReaction(reactionPickerMsgId!, emoji)}
                  className="text-lg hover:scale-110 transition-transform p-1"
                >
                  {emoji}
                </button>
              ))}
            </div>
            {[
              { action: "reply", label: "Reply", icon: "↩" },
              { action: "copy", label: "Copy", icon: "📋" },
              { action: "translate", label: "Translate", icon: "🌐" },
              { action: "delete", label: "Delete", icon: "🗑️" },
            ].map(({ action, label, icon }) => (
              <button
                key={action}
                type="button"
                onClick={() => handleContextAction(action)}
                className="w-full flex items-center gap-3 px-4 py-2.5 text-sm transition-colors"
                style={{ color: action === "delete" ? "#FF4F4F" : "#F2F4FF" }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "#151A26";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "transparent";
                }}
                data-ocid={
                  action === "delete"
                    ? "chat.delete_button"
                    : `chat.${action}.button`
                }
              >
                <span>{icon}</span>
                {label}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
