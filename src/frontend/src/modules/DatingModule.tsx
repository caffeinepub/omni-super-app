import {
  type DatingMatch,
  type DatingProfile,
  useOmniStore,
} from "@/lib/omniStore";
import {
  AlertTriangle,
  CheckCircle2,
  ChevronLeft,
  Gift,
  Heart,
  Share2,
  Shield,
  Sparkles,
  Star,
  Trophy,
  Users,
  X,
  Zap,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

type DatingTab = "discover" | "matches" | "events" | "rewards";

function maskId(idx: number): string {
  const suffixes = [
    "4821",
    "3307",
    "9154",
    "6628",
    "1293",
    "8740",
    "5561",
    "2974",
  ];
  return `+777 **** ${suffixes[idx % suffixes.length]}`;
}

function timeAgo(ts: number): string {
  const diff = Date.now() - ts;
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}d önce`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}s önce`;
  return `${Math.floor(hrs / 24)}g önce`;
}

function countdown(ts: number): string {
  const diff = ts - Date.now();
  if (diff <= 0) return "Süresi doldu";
  const hrs = Math.floor(diff / 3600000);
  const mins = Math.floor((diff % 3600000) / 60000);
  return `${hrs}s ${mins}d`;
}

// ─── Swipe Card ─────────────────────────────────────────────────────────────
function SwipeCard({
  profile,
  index,
  ghostMode,
  onSwipe,
}: {
  profile: DatingProfile;
  index: number;
  ghostMode: boolean;
  onSwipe: (direction: "like" | "pass") => void;
}) {
  const [drag, setDrag] = useState({ x: 0, y: 0, active: false });
  const [gone, setGone] = useState<"like" | "pass" | null>(null);
  const startRef = useRef({ x: 0, y: 0 });
  const cardRef = useRef<HTMLDivElement>(null);

  const threshold = 100;

  const onPointerDown = useCallback((e: React.PointerEvent) => {
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    startRef.current = { x: e.clientX, y: e.clientY };
    setDrag({ x: 0, y: 0, active: true });
  }, []);

  const onPointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!drag.active) return;
      setDrag((d) => ({
        ...d,
        x: e.clientX - startRef.current.x,
        y: e.clientY - startRef.current.y,
      }));
    },
    [drag.active],
  );

  const onPointerUp = useCallback(() => {
    if (!drag.active) return;
    const dir =
      drag.x > threshold ? "like" : drag.x < -threshold ? "pass" : null;
    if (dir) {
      setGone(dir);
      setTimeout(() => onSwipe(dir), 300);
    } else {
      setDrag({ x: 0, y: 0, active: false });
    }
  }, [drag, onSwipe]);

  if (index > 0) {
    return (
      <div
        className="absolute inset-0 rounded-2xl"
        style={{
          background: "rgba(15,20,35,0.9)",
          border: "1px solid rgba(25,230,255,0.1)",
          transform: `scale(${1 - index * 0.04}) translateY(${index * 8}px)`,
          zIndex: 10 - index,
        }}
      />
    );
  }

  const rotation = drag.x * 0.08;
  const direction =
    drag.x > threshold ? "like" : drag.x < -threshold ? "pass" : null;

  return (
    <div
      ref={cardRef}
      data-ocid="dating.card"
      className="absolute inset-0 rounded-2xl cursor-grab active:cursor-grabbing select-none overflow-hidden"
      style={{
        background: "rgba(15,20,35,0.95)",
        border: "1px solid rgba(25,230,255,0.18)",
        boxShadow:
          "0 20px 60px rgba(0,0,0,0.6), 0 0 40px rgba(25,230,255,0.04)",
        transform: gone
          ? `translateX(${gone === "like" ? 600 : -600}px) rotate(${gone === "like" ? 30 : -30}deg)`
          : `translateX(${drag.x}px) translateY(${drag.y * 0.3}px) rotate(${rotation}deg)`,
        transition:
          gone || !drag.active
            ? "transform 0.35s cubic-bezier(0.25,0.46,0.45,0.94)"
            : "none",
        zIndex: 20,
        touchAction: "none",
        filter: ghostMode ? "blur(8px) brightness(0.6)" : "none",
      }}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
    >
      {/* Swipe overlay indicators */}
      {direction === "like" && (
        <div
          className="absolute top-6 left-6 z-30 rounded-xl px-4 py-2 font-black text-2xl"
          style={{
            border: "3px solid #19E6FF",
            color: "#19E6FF",
            opacity: Math.min(Math.abs(drag.x) / threshold, 1),
            transform: "rotate(-15deg)",
          }}
        >
          BEĞEN ♥
        </div>
      )}
      {direction === "pass" && (
        <div
          className="absolute top-6 right-6 z-30 rounded-xl px-4 py-2 font-black text-2xl"
          style={{
            border: "3px solid #FF4F4F",
            color: "#FF4F4F",
            opacity: Math.min(Math.abs(drag.x) / threshold, 1),
            transform: "rotate(15deg)",
          }}
        >
          GEÇ ✕
        </div>
      )}

      {/* Gradient bg based on mood */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(180deg, rgba(25,230,255,0.03) 0%, rgba(181,107,255,0.06) 50%, rgba(6,7,11,0.95) 100%)",
        }}
      />

      <div className="relative z-10 flex flex-col items-center pt-8 px-6 h-full">
        {/* Avatar */}
        <div
          className="flex items-center justify-center rounded-full mb-4"
          style={{
            width: 96,
            height: 96,
            background: "rgba(25,230,255,0.08)",
            border: "2px solid rgba(25,230,255,0.25)",
            fontSize: 52,
            boxShadow: "0 0 30px rgba(25,230,255,0.15)",
          }}
        >
          {profile.emoji}
        </div>

        {/* Masked ID */}
        <div className="text-xs font-mono mb-1" style={{ color: "#4A5568" }}>
          {maskId(Number.parseInt(profile.id.replace("dp", "")) - 1)}
        </div>

        {/* Mood badge */}
        <div
          className="text-xs font-bold px-3 py-1 rounded-full mb-3"
          style={{
            background: "rgba(181,107,255,0.15)",
            border: "1px solid rgba(181,107,255,0.35)",
            color: "#B56BFF",
          }}
        >
          {profile.mood}
        </div>

        {/* Vibe status */}
        <p
          className="text-center text-sm mb-4 leading-relaxed"
          style={{ color: "#A7ACBE" }}
        >
          {profile.vibeStatus}
        </p>

        {/* Interest tags */}
        <div className="flex flex-wrap gap-2 justify-center mb-4">
          {profile.interests.map((i) => (
            <span
              key={i}
              className="text-[11px] px-2.5 py-1 rounded-full"
              style={{
                background: "rgba(25,230,255,0.08)",
                border: "1px solid rgba(25,230,255,0.2)",
                color: "#19E6FF",
              }}
            >
              {i}
            </span>
          ))}
        </div>

        {/* Proximity */}
        <div className="flex items-center gap-1.5 mb-3">
          <span className="text-xs" style={{ color: "#4A5568" }}>
            📍
          </span>
          <span className="text-xs" style={{ color: "#6B7280" }}>
            {profile.proximity}
          </span>
          <span
            className="text-xs px-2 py-0.5 rounded-full ml-2"
            style={{
              background: "rgba(255,179,71,0.12)",
              border: "1px solid rgba(255,179,71,0.3)",
              color: "#FFB347",
            }}
          >
            {profile.privacyMode === "ghost"
              ? "👻 Ghost"
              : profile.privacyMode === "shadow"
                ? "🌑 Shadow"
                : "🔓 Normal"}
          </span>
        </div>

        {/* AI Match bar */}
        <div className="w-full mb-3">
          <div className="flex justify-between text-[10px] mb-1">
            <span style={{ color: "#4A5568" }}>AI Uyum Skoru</span>
            <span style={{ color: "#19E6FF" }} className="font-bold">
              %{profile.aiMatchScore}
            </span>
          </div>
          <div
            className="w-full h-1.5 rounded-full overflow-hidden"
            style={{ background: "rgba(25,230,255,0.1)" }}
          >
            <div
              className="h-full rounded-full"
              style={{
                width: `${profile.aiMatchScore}%`,
                background: "linear-gradient(90deg, #19E6FF, #B56BFF)",
                boxShadow: "0 0 8px rgba(25,230,255,0.5)",
              }}
            />
          </div>
        </div>

        {/* Trust score stars */}
        <div className="flex items-center gap-1">
          {[1, 2, 3, 4, 5].map((s) => (
            <Star
              key={s}
              size={12}
              style={{
                color:
                  s <= Math.round(profile.trustScore) ? "#FFB347" : "#2A3040",
                fill:
                  s <= Math.round(profile.trustScore)
                    ? "#FFB347"
                    : "transparent",
              }}
            />
          ))}
          <span className="text-[10px] ml-1" style={{ color: "#4A5568" }}>
            {profile.trustScore.toFixed(1)}
          </span>
        </div>
      </div>
    </div>
  );
}

// ─── Match Celebration Overlay ───────────────────────────────────────────────
function MatchCelebration({
  match,
  onChat,
  onDismiss,
}: {
  match: DatingMatch;
  onChat: () => void;
  onDismiss: () => void;
}) {
  return (
    <div
      data-ocid="dating.modal"
      className="fixed inset-0 z-50 flex flex-col items-center justify-center"
      style={{ background: "rgba(6,7,11,0.94)", backdropFilter: "blur(20px)" }}
    >
      {/* Pulse rings */}
      <div className="relative flex items-center justify-center mb-8">
        {[1, 2, 3].map((r) => (
          <div
            key={r}
            className="absolute rounded-full"
            style={{
              width: 80 + r * 50,
              height: 80 + r * 50,
              border: "1px solid rgba(25,230,255,0.15)",
              animation: `ping ${0.8 + r * 0.3}s cubic-bezier(0,0,0.2,1) infinite`,
              animationDelay: `${r * 0.15}s`,
            }}
          />
        ))}
        <div
          className="relative z-10 flex items-center justify-center rounded-full"
          style={{
            width: 100,
            height: 100,
            background: "rgba(25,230,255,0.1)",
            border: "2px solid rgba(25,230,255,0.4)",
            fontSize: 52,
            boxShadow: "0 0 50px rgba(25,230,255,0.3)",
          }}
        >
          {match.profile.emoji}
        </div>
      </div>

      <div
        className="text-3xl font-black mb-2 tracking-wider"
        style={{
          background: "linear-gradient(135deg, #19E6FF, #B56BFF)",
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
        }}
      >
        💫 EŞLEŞME!
      </div>
      <p className="text-sm mb-1" style={{ color: "#A7ACBE" }}>
        Karşılıklı beğeni — bağlantı kuruldu
      </p>
      <p className="text-xs mb-8" style={{ color: "#4A5568" }}>
        Geçerlilik: {countdown(match.expiresAt ?? Date.now() + 3600000)}
      </p>

      <div className="flex gap-4">
        <button
          type="button"
          data-ocid="dating.cancel_button"
          onClick={onDismiss}
          className="px-6 py-3 rounded-xl text-sm font-bold"
          style={{
            background: "rgba(255,255,255,0.05)",
            border: "1px solid rgba(255,255,255,0.1)",
            color: "#6B7280",
          }}
        >
          Sonra
        </button>
        <button
          type="button"
          data-ocid="dating.confirm_button"
          onClick={onChat}
          className="px-6 py-3 rounded-xl text-sm font-black"
          style={{
            background: "linear-gradient(135deg, #19E6FF22, #B56BFF22)",
            border: "1px solid rgba(25,230,255,0.4)",
            color: "#19E6FF",
            boxShadow: "0 0 20px rgba(25,230,255,0.2)",
          }}
        >
          Sohbet Başlat 💬
        </button>
      </div>
    </div>
  );
}

// ─── Discover Tab ────────────────────────────────────────────────────────────
function DiscoverTab() {
  const {
    datingProfiles,
    datingDailySwipes,
    swipeProfile,
    setDatingActiveMatch,
    tokenBalance,
  } = useOmniStore();
  const [ghostMode, setGhostMode] = useState(false);
  const [newMatch, setNewMatch] = useState<DatingMatch | null>(null);

  const topProfiles = datingProfiles.slice(0, 3);

  const handleSwipe = useCallback(
    (profileId: string, direction: "like" | "pass") => {
      const match = swipeProfile(profileId, direction);
      if (match) setNewMatch(match);
    },
    [swipeProfile],
  );

  const handleSuperLike = useCallback(() => {
    if (topProfiles.length === 0) return;
    if (tokenBalance < 5) return;
    handleSwipe(topProfiles[0].id, "like");
  }, [topProfiles, tokenBalance, handleSwipe]);

  const swipeProgress = datingDailySwipes % 10;

  return (
    <div className="flex flex-col h-full">
      {/* Top controls */}
      <div className="flex items-center justify-between px-4 py-3">
        <div>
          <p
            className="text-[10px] font-bold tracking-widest"
            style={{ color: "#4A5568" }}
          >
            BUGÜNÜN ÖDÜLÜ
          </p>
          <div className="flex items-center gap-2 mt-1">
            <div
              className="h-1.5 rounded-full overflow-hidden"
              style={{ width: 80, background: "rgba(25,230,255,0.1)" }}
            >
              <div
                className="h-full rounded-full"
                style={{
                  width: `${(swipeProgress / 10) * 100}%`,
                  background: "linear-gradient(90deg, #19E6FF, #B56BFF)",
                  transition: "width 0.4s",
                }}
              />
            </div>
            <span className="text-[10px]" style={{ color: "#19E6FF" }}>
              {swipeProgress}/10 → +5 🪙
            </span>
          </div>
        </div>

        <button
          type="button"
          data-ocid="dating.toggle"
          onClick={() => setGhostMode((g) => !g)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold"
          style={{
            background: ghostMode
              ? "rgba(181,107,255,0.15)"
              : "rgba(255,255,255,0.04)",
            border: `1px solid ${ghostMode ? "rgba(181,107,255,0.4)" : "rgba(255,255,255,0.08)"}`,
            color: ghostMode ? "#B56BFF" : "#4A5568",
          }}
        >
          <Shield size={12} />
          {ghostMode ? "Ghost ON" : "Ghost"}
        </button>
      </div>

      {/* Card stack */}
      <div className="flex-1 relative px-4" style={{ minHeight: 0 }}>
        {topProfiles.length === 0 ? (
          <div
            data-ocid="dating.empty_state"
            className="absolute inset-0 flex flex-col items-center justify-center gap-3"
          >
            <div className="text-5xl">✨</div>
            <p className="text-sm font-bold" style={{ color: "#A7ACBE" }}>
              Hepsi görüldü!
            </p>
            <p className="text-xs" style={{ color: "#4A5568" }}>
              Yeni profiller yakında eklenecek
            </p>
          </div>
        ) : (
          <div className="absolute inset-0">
            {topProfiles
              .slice()
              .reverse()
              .map((profile, revIdx) => {
                const idx = topProfiles.length - 1 - revIdx;
                return (
                  <SwipeCard
                    key={profile.id}
                    profile={profile}
                    index={idx}
                    ghostMode={ghostMode}
                    onSwipe={(dir) => handleSwipe(profile.id, dir)}
                  />
                );
              })}
          </div>
        )}
      </div>

      {/* Action buttons */}
      {topProfiles.length > 0 && (
        <div className="flex items-center justify-center gap-5 px-4 py-4">
          <button
            type="button"
            data-ocid="dating.secondary_button"
            onClick={() => handleSwipe(topProfiles[0].id, "pass")}
            className="flex items-center justify-center rounded-full"
            style={{
              width: 60,
              height: 60,
              background: "rgba(255,79,79,0.12)",
              border: "2px solid rgba(255,79,79,0.4)",
              boxShadow: "0 0 20px rgba(255,79,79,0.15)",
            }}
          >
            <X size={28} style={{ color: "#FF4F4F" }} />
          </button>

          <button
            type="button"
            data-ocid="dating.secondary_button"
            onClick={handleSuperLike}
            className="flex items-center justify-center rounded-full"
            style={{
              width: 50,
              height: 50,
              background: "rgba(255,179,71,0.12)",
              border: "2px solid rgba(255,179,71,0.35)",
            }}
          >
            <Zap size={22} style={{ color: "#FFB347" }} />
          </button>

          <button
            type="button"
            data-ocid="dating.primary_button"
            onClick={() => handleSwipe(topProfiles[0].id, "like")}
            className="flex items-center justify-center rounded-full"
            style={{
              width: 60,
              height: 60,
              background: "rgba(25,230,255,0.12)",
              border: "2px solid rgba(25,230,255,0.4)",
              boxShadow: "0 0 20px rgba(25,230,255,0.15)",
            }}
          >
            <Heart size={28} style={{ color: "#19E6FF" }} />
          </button>
        </div>
      )}

      {/* Match celebration */}
      {newMatch && (
        <MatchCelebration
          match={newMatch}
          onChat={() => {
            setDatingActiveMatch(newMatch.id);
            setNewMatch(null);
          }}
          onDismiss={() => setNewMatch(null)}
        />
      )}
    </div>
  );
}

// ─── Match Chat ──────────────────────────────────────────────────────────────
function MatchChat({
  match,
  onBack,
}: { match: DatingMatch; onBack: () => void }) {
  const { sendDatingMessage, sendTokenGift, tokenBalance } = useOmniStore();
  const [input, setInput] = useState("");
  const [giftAmount, setGiftAmount] = useState("");
  const [showGift, setShowGift] = useState(false);
  const [showMeetup, setShowMeetup] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // biome-ignore lint/correctness/useExhaustiveDependencies: scroll on message change
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [match.messages]);

  const handleSend = () => {
    if (!input.trim()) return;
    sendDatingMessage(match.id, input.trim());
    setInput("");
  };

  const handleGift = () => {
    const amt = Number.parseInt(giftAmount);
    if (!amt || amt <= 0 || amt > tokenBalance) return;
    sendTokenGift(match.id, amt);
    setGiftAmount("");
    setShowGift(false);
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div
        className="flex items-center gap-3 px-4 py-3"
        style={{ borderBottom: "1px solid rgba(25,230,255,0.08)" }}
      >
        <button
          type="button"
          data-ocid="dating.close_button"
          onClick={onBack}
          className="p-1 rounded-lg"
          style={{ color: "#4A5568" }}
        >
          <ChevronLeft size={20} />
        </button>
        <div
          className="flex items-center justify-center rounded-full text-2xl"
          style={{
            width: 40,
            height: 40,
            background: "rgba(25,230,255,0.08)",
            border: "1px solid rgba(25,230,255,0.2)",
          }}
        >
          {match.profile.emoji}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-mono" style={{ color: "#4A5568" }}>
            {maskId(Number.parseInt(match.profile.id.replace("dp", "")) - 1)}
          </p>
          <p className="text-xs" style={{ color: "#B56BFF" }}>
            {match.profile.mood}
          </p>
        </div>
        <div className="text-right">
          <p className="text-[9px] font-bold" style={{ color: "#4A5568" }}>
            SÜRE
          </p>
          <p className="text-[10px] font-bold" style={{ color: "#FFB347" }}>
            {countdown(match.expiresAt ?? Date.now() + 3600000)}
          </p>
        </div>
      </div>

      {/* Messages */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto px-4 py-3 space-y-3"
        style={{ minHeight: 0 }}
      >
        {match.messages.length === 0 && (
          <div className="flex flex-col items-center py-8 gap-2">
            <Sparkles size={28} style={{ color: "#B56BFF" }} />
            <p className="text-xs" style={{ color: "#4A5568" }}>
              Merhaba de ve bağlantıyı başlat!
            </p>
          </div>
        )}
        {match.messages.map((msg) => {
          const isMe = msg.senderId === "me";
          return (
            <div
              key={msg.id}
              className={`flex ${isMe ? "justify-end" : "justify-start"}`}
            >
              <div
                className="max-w-[75%] px-3 py-2 rounded-2xl text-sm leading-relaxed"
                style={{
                  background: msg.isGift
                    ? "rgba(181,107,255,0.15)"
                    : isMe
                      ? "rgba(25,230,255,0.12)"
                      : "rgba(255,255,255,0.06)",
                  border: msg.isGift
                    ? "1px solid rgba(181,107,255,0.3)"
                    : isMe
                      ? "1px solid rgba(25,230,255,0.2)"
                      : "1px solid rgba(255,255,255,0.08)",
                  color: msg.isGift ? "#B56BFF" : isMe ? "#19E6FF" : "#D1D5DB",
                }}
              >
                {msg.content}
              </div>
            </div>
          );
        })}
      </div>

      {/* Meetup consent dialog */}
      {showMeetup && (
        <div
          data-ocid="dating.dialog"
          className="absolute inset-x-0 bottom-24 mx-4 rounded-2xl p-4"
          style={{
            background: "rgba(15,20,35,0.98)",
            border: "1px solid rgba(181,107,255,0.3)",
            zIndex: 30,
          }}
        >
          <p className="text-sm font-bold mb-1" style={{ color: "#B56BFF" }}>
            🤝 Buluşmayı Onayla
          </p>
          <p className="text-xs mb-3" style={{ color: "#6B7280" }}>
            Her iki taraf da onay vermelidir. Kimliğiniz korunmaya devam eder.
          </p>
          <div className="flex gap-2">
            <button
              type="button"
              data-ocid="dating.cancel_button"
              onClick={() => setShowMeetup(false)}
              className="flex-1 py-2 rounded-xl text-xs"
              style={{
                background: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(255,255,255,0.08)",
                color: "#4A5568",
              }}
            >
              İptal
            </button>
            <button
              type="button"
              data-ocid="dating.confirm_button"
              onClick={() => setShowMeetup(false)}
              className="flex-1 py-2 rounded-xl text-xs font-bold"
              style={{
                background: "rgba(181,107,255,0.15)",
                border: "1px solid rgba(181,107,255,0.4)",
                color: "#B56BFF",
              }}
            >
              Onay Gönder
            </button>
          </div>
        </div>
      )}

      {/* Gift panel */}
      {showGift && (
        <div
          className="px-4 py-3"
          style={{ borderTop: "1px solid rgba(181,107,255,0.15)" }}
        >
          <div className="flex gap-2">
            <input
              data-ocid="dating.input"
              type="number"
              value={giftAmount}
              onChange={(e) => setGiftAmount(e.target.value)}
              placeholder="Token miktarı..."
              className="flex-1 px-3 py-2 rounded-xl text-sm"
              style={{
                background: "rgba(181,107,255,0.08)",
                border: "1px solid rgba(181,107,255,0.25)",
                color: "#D1D5DB",
                outline: "none",
              }}
            />
            <button
              type="button"
              data-ocid="dating.submit_button"
              onClick={handleGift}
              className="px-4 py-2 rounded-xl text-sm font-bold"
              style={{
                background: "rgba(181,107,255,0.15)",
                border: "1px solid rgba(181,107,255,0.4)",
                color: "#B56BFF",
              }}
            >
              Gönder
            </button>
          </div>
          <p className="text-[10px] mt-1" style={{ color: "#4A5568" }}>
            Bakiye: {tokenBalance} 🪙
          </p>
        </div>
      )}

      {/* Bottom input */}
      <div
        className="flex items-center gap-2 px-4 py-3"
        style={{ borderTop: "1px solid rgba(25,230,255,0.08)" }}
      >
        <button
          type="button"
          data-ocid="dating.toggle"
          onClick={() => setShowMeetup((s) => !s)}
          title="Buluşma Talebi"
          className="p-2 rounded-xl flex-shrink-0"
          style={{
            background: "rgba(255,179,71,0.08)",
            border: "1px solid rgba(255,179,71,0.2)",
            color: "#FFB347",
          }}
        >
          <Users size={16} />
        </button>
        <button
          type="button"
          data-ocid="dating.toggle"
          onClick={() => setShowGift((s) => !s)}
          className="p-2 rounded-xl flex-shrink-0"
          style={{
            background: showGift
              ? "rgba(181,107,255,0.15)"
              : "rgba(181,107,255,0.06)",
            border: `1px solid ${showGift ? "rgba(181,107,255,0.4)" : "rgba(181,107,255,0.15)"}`,
            color: "#B56BFF",
          }}
        >
          <Gift size={16} />
        </button>
        <input
          data-ocid="dating.input"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSend()}
          placeholder="Mesaj yaz..."
          className="flex-1 px-3 py-2 rounded-xl text-sm"
          style={{
            background: "rgba(255,255,255,0.04)",
            border: "1px solid rgba(255,255,255,0.08)",
            color: "#D1D5DB",
            outline: "none",
          }}
        />
        <button
          type="button"
          data-ocid="dating.submit_button"
          onClick={handleSend}
          className="p-2 rounded-xl"
          style={{
            background: "rgba(25,230,255,0.12)",
            border: "1px solid rgba(25,230,255,0.3)",
            color: "#19E6FF",
          }}
        >
          <Heart size={16} />
        </button>
      </div>
    </div>
  );
}

// ─── Matches Tab ─────────────────────────────────────────────────────────────
function MatchesTab() {
  const { datingMatches, datingActiveMatchId, setDatingActiveMatch } =
    useOmniStore();

  const activeMatch = datingMatches.find((m) => m.id === datingActiveMatchId);

  if (activeMatch) {
    return (
      <MatchChat
        match={activeMatch}
        onBack={() => setDatingActiveMatch(null)}
      />
    );
  }

  return (
    <div className="flex flex-col h-full overflow-y-auto">
      <div className="px-4 py-3">
        <p
          className="text-xs font-bold tracking-widest"
          style={{ color: "#4A5568" }}
        >
          EŞLEŞMELERİM · {datingMatches.length}
        </p>
      </div>

      {datingMatches.length === 0 && (
        <div
          data-ocid="dating.empty_state"
          className="flex flex-col items-center py-16 gap-3"
        >
          <Heart size={40} style={{ color: "#2A3040" }} />
          <p className="text-sm" style={{ color: "#4A5568" }}>
            Henüz eşleşme yok
          </p>
          <p className="text-xs" style={{ color: "#2A3040" }}>
            Keşfet sekmesine geç ve kaydır!
          </p>
        </div>
      )}

      <div className="px-4 space-y-3 pb-4">
        {datingMatches.map((match, idx) => (
          <button
            type="button"
            key={match.id}
            data-ocid={`dating.item.${idx + 1}`}
            onClick={() => setDatingActiveMatch(match.id)}
            className="w-full flex items-center gap-3 p-3 rounded-2xl text-left"
            style={{
              background: "rgba(15,20,35,0.9)",
              border: "1px solid rgba(25,230,255,0.1)",
            }}
          >
            <div
              className="flex items-center justify-center rounded-full text-2xl flex-shrink-0"
              style={{
                width: 52,
                height: 52,
                background: "rgba(25,230,255,0.08)",
                border: "1px solid rgba(25,230,255,0.2)",
              }}
            >
              {match.profile.emoji}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <span
                  className="text-xs font-mono"
                  style={{ color: "#4A5568" }}
                >
                  {maskId(
                    Number.parseInt(match.profile.id.replace("dp", "")) - 1,
                  )}
                </span>
                <span className="text-[10px]" style={{ color: "#4A5568" }}>
                  {timeAgo(match.matchedAt)}
                </span>
              </div>
              <p className="text-xs truncate" style={{ color: "#B56BFF" }}>
                {match.profile.mood}
              </p>
              {match.messages.length > 0 && (
                <p
                  className="text-xs truncate mt-0.5"
                  style={{ color: "#6B7280" }}
                >
                  {match.messages[match.messages.length - 1].content}
                </p>
              )}
              <div className="flex items-center justify-between mt-1">
                <span className="text-[9px]" style={{ color: "#FFB347" }}>
                  ⏱ {countdown(match.expiresAt ?? Date.now() + 3600000)}
                </span>
                {match.tokensSent > 0 && (
                  <span className="text-[9px]" style={{ color: "#B56BFF" }}>
                    🎁 {match.tokensSent} 🪙 gönderildi
                  </span>
                )}
              </div>
            </div>
            <div className="flex flex-col items-end gap-1">
              <button
                type="button"
                data-ocid="dating.delete_button"
                onClick={(e) => {
                  e.stopPropagation();
                }}
                className="p-1 rounded-lg"
                style={{ color: "#FF4F4F", background: "rgba(255,79,79,0.08)" }}
                title="Raporla"
              >
                <AlertTriangle size={12} />
              </button>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

// ─── Events Tab ──────────────────────────────────────────────────────────────
const EVENTS = [
  {
    id: "ev1",
    emoji: "🌙",
    name: "Gece Ruhu",
    desc: "Gece yıldızları altında özgün bağlantılar kur",
    reward: 50,
    status: "active" as const,
    startsIn: 0,
  },
  {
    id: "ev2",
    emoji: "🔥",
    name: "Ateş Halkası",
    desc: "En yüksek enerjili profillerle eşleş",
    reward: 75,
    status: "upcoming" as const,
    startsIn: 7200000,
  },
  {
    id: "ev3",
    emoji: "🎭",
    name: "Gizemli Eşleşme",
    desc: "Kim olduğunu bilmeden sohbet et — sonra ifşa et",
    reward: 100,
    status: "upcoming" as const,
    startsIn: 86400000,
  },
];

function EventsTab() {
  const { earnTokens } = useOmniStore();
  const [joined, setJoined] = useState<string[]>([]);
  const [mysteryActive, setMysteryActive] = useState(false);

  const handleJoin = (eventId: string, reward: number) => {
    if (joined.includes(eventId)) return;
    setJoined((j) => [...j, eventId]);
    earnTokens(reward, "Etkinlik katılım ödülü");
    if (eventId === "ev3") setMysteryActive(true);
  };

  return (
    <div className="flex flex-col h-full overflow-y-auto px-4 py-3 space-y-4">
      <p
        className="text-xs font-bold tracking-widest"
        style={{ color: "#4A5568" }}
      >
        AKTİF ETKİNLİKLER
      </p>

      {EVENTS.map((ev, idx) => (
        <div
          key={ev.id}
          data-ocid={`dating.item.${idx + 1}`}
          className="rounded-2xl p-4 relative overflow-hidden"
          style={{
            background: "rgba(15,20,35,0.9)",
            border: `1px solid ${ev.status === "active" ? "rgba(25,230,255,0.25)" : "rgba(255,255,255,0.06)"}`,
          }}
        >
          {ev.status === "active" && (
            <div
              className="absolute top-3 right-3 text-[9px] font-black px-2 py-0.5 rounded-full"
              style={{
                background: "rgba(25,230,255,0.15)",
                border: "1px solid rgba(25,230,255,0.3)",
                color: "#19E6FF",
              }}
            >
              CANLI
            </div>
          )}
          <div className="flex items-start gap-3">
            <div
              className="text-3xl flex-shrink-0 flex items-center justify-center rounded-xl"
              style={{
                width: 56,
                height: 56,
                background: "rgba(181,107,255,0.08)",
                border: "1px solid rgba(181,107,255,0.2)",
              }}
            >
              {ev.emoji}
            </div>
            <div className="flex-1">
              <p className="font-bold text-sm" style={{ color: "#E5E7EB" }}>
                {ev.name}
              </p>
              <p className="text-xs mt-0.5" style={{ color: "#6B7280" }}>
                {ev.desc}
              </p>
              {ev.status === "upcoming" && (
                <p className="text-[10px] mt-1" style={{ color: "#FFB347" }}>
                  ⏱ {countdown(Date.now() + ev.startsIn)} içinde başlıyor
                </p>
              )}
              <div className="flex items-center justify-between mt-3">
                <span
                  className="text-xs font-bold"
                  style={{ color: "#B56BFF" }}
                >
                  +{ev.reward} 🪙 ödül
                </span>
                <button
                  type="button"
                  data-ocid="dating.primary_button"
                  onClick={() => handleJoin(ev.id, ev.reward)}
                  disabled={joined.includes(ev.id)}
                  className="px-4 py-1.5 rounded-xl text-xs font-bold"
                  style={{
                    background: joined.includes(ev.id)
                      ? "rgba(255,255,255,0.04)"
                      : "rgba(25,230,255,0.12)",
                    border: `1px solid ${joined.includes(ev.id) ? "rgba(255,255,255,0.08)" : "rgba(25,230,255,0.3)"}`,
                    color: joined.includes(ev.id) ? "#4A5568" : "#19E6FF",
                  }}
                >
                  {joined.includes(ev.id) ? (
                    <span className="flex items-center gap-1">
                      <CheckCircle2 size={12} /> Katıldın
                    </span>
                  ) : (
                    "Katıl"
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      ))}

      {/* Mystery match animation */}
      {mysteryActive && (
        <div
          data-ocid="dating.dialog"
          className="fixed inset-0 z-50 flex flex-col items-center justify-center"
          style={{
            background: "rgba(6,7,11,0.96)",
            backdropFilter: "blur(20px)",
          }}
        >
          <div
            className="text-6xl mb-4"
            style={{ animation: "spin 2s linear" }}
          >
            🎭
          </div>
          <p className="text-xl font-black mb-2" style={{ color: "#B56BFF" }}>
            Gizemli Eşleşme!
          </p>
          <p className="text-sm mb-6" style={{ color: "#6B7280" }}>
            Kimliğini bilmeden bir profille bağlandın...
          </p>
          <button
            type="button"
            data-ocid="dating.close_button"
            onClick={() => setMysteryActive(false)}
            className="px-6 py-3 rounded-xl font-bold"
            style={{
              background: "rgba(181,107,255,0.15)",
              border: "1px solid rgba(181,107,255,0.4)",
              color: "#B56BFF",
            }}
          >
            Sohbet Başlat 🎭
          </button>
        </div>
      )}
    </div>
  );
}

// ─── Rewards Tab ─────────────────────────────────────────────────────────────
const ACHIEVEMENTS = [
  {
    id: "ach1",
    emoji: "🎯",
    name: "İlk Eşleşme",
    tokens: 20,
    desc: "İlk karşılıklı beğeni",
  },
  {
    id: "ach2",
    emoji: "💬",
    name: "İlk Mesaj",
    tokens: 5,
    desc: "İlk sohbeti başlat",
  },
  {
    id: "ach3",
    emoji: "🔥",
    name: "10 Swipe",
    tokens: 5,
    desc: "Bugün 10 profil gör",
  },
  {
    id: "ach4",
    emoji: "🤝",
    name: "Arkadaş Davet Et",
    tokens: 0,
    desc: "Match boost kazan",
  },
  {
    id: "ach5",
    emoji: "⭐",
    name: "5 Eşleşme",
    tokens: 0,
    desc: "Nadir avatar kilidi aç",
  },
  {
    id: "ach6",
    emoji: "💫",
    name: "Başarı Hikayesi",
    tokens: 0,
    desc: "Anonim hikayeni paylaş",
  },
];

const SUCCESS_STORIES = [
  {
    id: "ss1",
    emoji: "🌙",
    text: "Geç gece eşleştik, üç saat sohbet ettik. Hâlâ konuşuyoruz 💫",
    mood: "Gece Ruhu Eşleşmesi",
  },
  {
    id: "ss2",
    emoji: "🎵",
    text: "Aynı müzikleri seviyorduk. Kimliğimizi hiç bilmeden bu kadar ortak şey bulduk.",
    mood: "Müzik Bağlantısı",
  },
  {
    id: "ss3",
    emoji: "🔥",
    text: "Ateş Halkası etkinliğinde tanıştık. %94 AI uyum skoru yanlış söylemiyormuş!",
    mood: "Etkinlik Eşleşmesi",
  },
];

function RewardsTab() {
  const { datingDailySwipes, datingMatches, claimReward, claimedRewards } =
    useOmniStore();
  const [showShare, setShowShare] = useState(false);

  const swipeProgress = datingDailySwipes % 10;

  return (
    <div className="flex flex-col h-full overflow-y-auto px-4 py-3 space-y-4">
      {/* Daily progress */}
      <div
        className="rounded-2xl p-4"
        style={{
          background: "rgba(15,20,35,0.9)",
          border: "1px solid rgba(25,230,255,0.15)",
        }}
      >
        <div className="flex items-center justify-between mb-3">
          <p className="text-sm font-bold" style={{ color: "#E5E7EB" }}>
            Günlük Ödül
          </p>
          <span className="text-xs" style={{ color: "#19E6FF" }}>
            +5 🪙 / 10 swipe
          </span>
        </div>
        <div
          className="w-full h-2 rounded-full overflow-hidden"
          style={{ background: "rgba(25,230,255,0.08)" }}
        >
          <div
            className="h-full rounded-full"
            style={{
              width: `${(swipeProgress / 10) * 100}%`,
              background: "linear-gradient(90deg, #19E6FF, #B56BFF)",
              transition: "width 0.5s",
            }}
          />
        </div>
        <div className="flex justify-between text-[10px] mt-1">
          <span style={{ color: "#4A5568" }}>{swipeProgress}/10 swipe</span>
          <span style={{ color: "#FFB347" }}>
            Toplam: {datingDailySwipes} swipe
          </span>
        </div>
      </div>

      {/* Achievements */}
      <p
        className="text-xs font-bold tracking-widest"
        style={{ color: "#4A5568" }}
      >
        BAŞARILAR
      </p>
      <div className="grid grid-cols-2 gap-3">
        {ACHIEVEMENTS.map((ach, idx) => {
          const isClaimed = claimedRewards.includes(ach.id);
          const isUnlocked =
            (ach.id === "ach1" && datingMatches.length >= 1) ||
            (ach.id === "ach2" &&
              datingMatches.some((m) => m.messages.length > 0)) ||
            (ach.id === "ach3" && datingDailySwipes >= 10) ||
            (ach.id === "ach5" && datingMatches.length >= 5);

          return (
            <button
              type="button"
              key={ach.id}
              data-ocid={`dating.item.${idx + 1}`}
              onClick={() =>
                isUnlocked && ach.tokens > 0 && !isClaimed
                  ? claimReward(ach.id, ach.tokens, ach.name)
                  : undefined
              }
              className="rounded-2xl p-3 text-left"
              style={{
                background: isUnlocked
                  ? "rgba(25,230,255,0.06)"
                  : "rgba(255,255,255,0.02)",
                border: `1px solid ${isUnlocked ? "rgba(25,230,255,0.2)" : "rgba(255,255,255,0.05)"}`,
                opacity: isUnlocked ? 1 : 0.5,
              }}
            >
              <div className="text-2xl mb-1">{ach.emoji}</div>
              <p
                className="text-xs font-bold"
                style={{ color: isUnlocked ? "#E5E7EB" : "#4A5568" }}
              >
                {ach.name}
              </p>
              <p className="text-[10px]" style={{ color: "#4A5568" }}>
                {ach.desc}
              </p>
              {ach.tokens > 0 && (
                <p
                  className="text-[10px] font-bold mt-1"
                  style={{ color: isClaimed ? "#4A5568" : "#19E6FF" }}
                >
                  {isClaimed ? "✓ Alındı" : `+${ach.tokens} 🪙`}
                </p>
              )}
            </button>
          );
        })}
      </div>

      {/* Success stories */}
      <p
        className="text-xs font-bold tracking-widest"
        style={{ color: "#4A5568" }}
      >
        BAŞARI HİKAYELERİ
      </p>
      {SUCCESS_STORIES.map((story) => (
        <div
          key={story.id}
          data-ocid="dating.card"
          className="rounded-2xl p-4"
          style={{
            background: "rgba(15,20,35,0.9)",
            border: "1px solid rgba(181,107,255,0.12)",
          }}
        >
          <div className="flex items-start gap-3">
            <div className="text-2xl">{story.emoji}</div>
            <div>
              <p className="text-xs" style={{ color: "#A7ACBE" }}>
                {story.text}
              </p>
              <p className="text-[10px] mt-1" style={{ color: "#B56BFF" }}>
                {story.mood}
              </p>
            </div>
          </div>
        </div>
      ))}

      {/* Invite */}
      <button
        type="button"
        data-ocid="dating.open_modal_button"
        onClick={() => setShowShare(true)}
        className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl font-bold text-sm"
        style={{
          background: "rgba(25,230,255,0.08)",
          border: "1px solid rgba(25,230,255,0.2)",
          color: "#19E6FF",
        }}
      >
        <Share2 size={16} />
        Arkadaş Davet Et → Match Boost Kazan
      </button>

      {showShare && (
        <div
          data-ocid="dating.dialog"
          className="fixed inset-0 z-50 flex flex-col items-center justify-center p-6"
          style={{
            background: "rgba(6,7,11,0.94)",
            backdropFilter: "blur(20px)",
          }}
        >
          <div
            className="w-full max-w-sm rounded-2xl p-6"
            style={{
              background: "rgba(15,20,35,0.98)",
              border: "1px solid rgba(25,230,255,0.2)",
            }}
          >
            <p className="text-lg font-black mb-2" style={{ color: "#19E6FF" }}>
              🤝 Arkadaşını Davet Et
            </p>
            <p className="text-xs mb-4" style={{ color: "#6B7280" }}>
              Davet ettiğin her arkadaş için özel Match Boost kazanırsın!
            </p>
            <div
              className="p-3 rounded-xl text-center font-mono text-sm mb-4"
              style={{
                background: "rgba(25,230,255,0.06)",
                border: "1px solid rgba(25,230,255,0.2)",
                color: "#19E6FF",
              }}
            >
              OMNI://INVITE/MATCH/8X7K2
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                data-ocid="dating.cancel_button"
                onClick={() => setShowShare(false)}
                className="flex-1 py-2 rounded-xl text-sm"
                style={{
                  background: "rgba(255,255,255,0.04)",
                  border: "1px solid rgba(255,255,255,0.08)",
                  color: "#4A5568",
                }}
              >
                Kapat
              </button>
              <button
                type="button"
                data-ocid="dating.primary_button"
                onClick={() => setShowShare(false)}
                className="flex-1 py-2 rounded-xl text-sm font-bold"
                style={{
                  background: "rgba(25,230,255,0.12)",
                  border: "1px solid rgba(25,230,255,0.3)",
                  color: "#19E6FF",
                }}
              >
                Paylaş
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Main Module ─────────────────────────────────────────────────────────────
export function DatingModule() {
  const [activeTab, setActiveTab] = useState<DatingTab>("discover");
  const { datingMatches } = useOmniStore();

  const TABS: { id: DatingTab; label: string; icon: React.ReactNode }[] = [
    { id: "discover", label: "Keşfet", icon: <Sparkles size={14} /> },
    {
      id: "matches",
      label: "Eşleşmeler",
      icon: (
        <span className="relative">
          <Heart size={14} />
          {datingMatches.length > 0 && (
            <span
              className="absolute -top-1 -right-1 w-3 h-3 rounded-full text-[7px] font-bold flex items-center justify-center"
              style={{ background: "#FF4F4F", color: "white" }}
            >
              {datingMatches.length}
            </span>
          )}
        </span>
      ),
    },
    { id: "events", label: "Etkinlikler", icon: <Zap size={14} /> },
    { id: "rewards", label: "Ödüller", icon: <Trophy size={14} /> },
  ];

  return (
    <div
      className="flex flex-col h-full"
      style={{
        background: "linear-gradient(135deg, #06070B 0%, #0B1020 100%)",
      }}
    >
      {/* Module top bar */}
      <div
        className="flex-shrink-0 px-4 py-2"
        style={{
          background: "rgba(6,7,11,0.8)",
          backdropFilter: "blur(10px)",
          borderBottom: "1px solid rgba(25,230,255,0.06)",
        }}
      >
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <div
              className="text-xs font-black tracking-widest"
              style={{
                background: "linear-gradient(135deg, #19E6FF, #B56BFF)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}
            >
              OMNI MATCH
            </div>
            <span
              className="text-[9px] px-2 py-0.5 rounded-full font-bold"
              style={{
                background: "rgba(25,230,255,0.12)",
                border: "1px solid rgba(25,230,255,0.25)",
                color: "#19E6FF",
              }}
            >
              ANONIM
            </span>
          </div>
          <div className="flex items-center gap-1">
            <Shield size={12} style={{ color: "#B56BFF" }} />
            <span className="text-[10px]" style={{ color: "#B56BFF" }}>
              E2E Korumalı
            </span>
          </div>
        </div>

        {/* Inner tab bar */}
        <div className="flex gap-1">
          {TABS.map((tab) => (
            <button
              type="button"
              key={tab.id}
              data-ocid={`dating.${tab.id}.tab`}
              onClick={() => setActiveTab(tab.id)}
              className="flex-1 flex items-center justify-center gap-1 py-1.5 rounded-xl text-[10px] font-bold transition-all"
              style={{
                background:
                  activeTab === tab.id
                    ? "rgba(25,230,255,0.12)"
                    : "rgba(255,255,255,0.03)",
                border: `1px solid ${
                  activeTab === tab.id
                    ? "rgba(25,230,255,0.3)"
                    : "rgba(255,255,255,0.05)"
                }`,
                color: activeTab === tab.id ? "#19E6FF" : "#4A5568",
              }}
            >
              {tab.icon}
              <span className="hidden sm:inline">{tab.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Tab content */}
      <div className="flex-1 overflow-hidden" style={{ minHeight: 0 }}>
        {activeTab === "discover" && <DiscoverTab />}
        {activeTab === "matches" && <MatchesTab />}
        {activeTab === "events" && <EventsTab />}
        {activeTab === "rewards" && <RewardsTab />}
      </div>
    </div>
  );
}
