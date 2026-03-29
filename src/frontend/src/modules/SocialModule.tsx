import {
  Camera,
  Car,
  Check,
  Coins,
  Eye,
  Heart,
  MapPin,
  MessageCircle,
  MoreVertical,
  Play,
  Plus,
  Settings,
  Share2,
  UserPlus,
  X,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { useOmniStore } from "../lib/omniStore";

// ─── Types ───────────────────────────────────────────────────────────────────

type Privacy = "PUBLIC" | "FRIENDS" | "ANON" | "GHOST";

interface Post {
  id: string;
  authorId: string;
  authorEmoji: string;
  content: string;
  mood: string;
  privacy: Privacy;
  likes: number;
  comments: number;
  shares: number;
  rideTag?: boolean;
  time: string;
  liked: boolean;
  mediaUrl?: string;
  mediaType?: "image" | "video";
}

interface Reel {
  id: string;
  authorId: string;
  authorEmoji: string;
  mood: string;
  description: string;
  likes: number;
  comments: number;
  views: number;
  location?: string;
  rideTag?: boolean;
  gradient: string;
  liked: boolean;
}

interface Story {
  id: string;
  authorId: string;
  authorEmoji: string;
  emoji: string;
  timeLeft: string;
  gradient: string;
}

interface NearbyUser {
  id: string;
  userId: string;
  emoji: string;
  trust: number;
  online: boolean;
  following: boolean;
  mood: string;
}

// ─── Mock Data ────────────────────────────────────────────────────────────────

const INITIAL_STORIES: Story[] = [
  {
    id: "s1",
    authorId: "+777 3842 9173",
    authorEmoji: "🦊",
    emoji: "🔥",
    timeLeft: "4h left",
    gradient: "linear-gradient(135deg, #FF6B35, #FF4F4F)",
  },
  {
    id: "s2",
    authorId: "+777 5521 0834",
    authorEmoji: "🌊",
    emoji: "😎",
    timeLeft: "12h left",
    gradient: "linear-gradient(135deg, #19E6FF, #4F8EFF)",
  },
  {
    id: "s3",
    authorId: "+777 7790 2265",
    authorEmoji: "⚡",
    emoji: "💔",
    timeLeft: "2h left",
    gradient: "linear-gradient(135deg, #B56BFF, #FF4F4F)",
  },
  {
    id: "s4",
    authorId: "+777 1138 6647",
    authorEmoji: "🔮",
    emoji: "🌙",
    timeLeft: "8h left",
    gradient: "linear-gradient(135deg, #2FF5C7, #19E6FF)",
  },
  {
    id: "s5",
    authorId: "+777 9903 4412",
    authorEmoji: "🎭",
    emoji: "⚡",
    timeLeft: "22h left",
    gradient: "linear-gradient(135deg, #FFD700, #FF8C00)",
  },
  {
    id: "s6",
    authorId: "+777 4456 8891",
    authorEmoji: "🌸",
    emoji: "🌸",
    timeLeft: "1h left",
    gradient: "linear-gradient(135deg, #FF85C2, #B56BFF)",
  },
];

const INITIAL_POSTS: Post[] = [
  {
    id: "p1",
    authorId: "+777 3842 9173",
    authorEmoji: "🦊",
    content:
      "İstanbul geceleri böyle güzel olur. Köprüden geçerken insan hayata dair her şeyi unutuyor 🌉✨",
    mood: "🌙",
    privacy: "PUBLIC",
    likes: 247,
    comments: 34,
    shares: 12,
    rideTag: true,
    time: "2 dk",
    liked: false,
  },
  {
    id: "p2",
    authorId: "+777 5521 0834",
    authorEmoji: "🌊",
    content:
      "Yeni avatar açıldı! Gizlilik modu aktifken bile vibe'ı gizleyemiyorum 😎🔥",
    mood: "🔥",
    privacy: "ANON",
    likes: 189,
    comments: 21,
    shares: 8,
    time: "15 dk",
    liked: false,
  },
  {
    id: "p3",
    authorId: "+777 7790 2265",
    authorEmoji: "⚡",
    content:
      "P2P trade tamamlandı. 500 OMNI → nakite çevrildi. Escrow sistemi mükemmel çalıştı 💎",
    mood: "⚡",
    privacy: "FRIENDS",
    likes: 312,
    comments: 56,
    shares: 23,
    time: "1 sa",
    liked: true,
  },
  {
    id: "p4",
    authorId: "+777 1138 6647",
    authorEmoji: "🔮",
    content:
      "Shadow modunda bile insanları etkilemek mümkün. Anonymity güçtür 🌑",
    mood: "😎",
    privacy: "GHOST",
    likes: 98,
    comments: 7,
    shares: 4,
    time: "3 sa",
    liked: false,
  },
  {
    id: "p5",
    authorId: "+777 9903 4412",
    authorEmoji: "🎭",
    content:
      "Boğaz turu + sürücü arkadaş = mükemmel gün. OMNI Ride ile tanıştım bugün 🚗💫",
    mood: "🔥",
    privacy: "PUBLIC",
    likes: 421,
    comments: 67,
    shares: 31,
    rideTag: true,
    time: "5 sa",
    liked: false,
  },
  {
    id: "p6",
    authorId: "+777 4456 8891",
    authorEmoji: "🌸",
    content:
      "Dating modülünden yeni bir match. 60 saniye içinde bağlantı kuruldu 💔✨",
    mood: "💔",
    privacy: "ANON",
    likes: 156,
    comments: 29,
    shares: 9,
    time: "8 sa",
    liked: true,
  },
];

const INITIAL_REELS: Reel[] = [
  {
    id: "r1",
    authorId: "+777 3842 9173",
    authorEmoji: "🦊",
    mood: "🔥",
    description: "Gece sürüşü — kimse fark etmeden",
    likes: 1247,
    comments: 89,
    views: 8432,
    location: "📍 İstanbul ~2km",
    rideTag: true,
    gradient: "linear-gradient(160deg, #06070B 0%, #1A0A2E 50%, #2D0B4E 100%)",
    liked: false,
  },
  {
    id: "r2",
    authorId: "+777 5521 0834",
    authorEmoji: "🌊",
    mood: "😎",
    description: "Shadow modda kim olduğumu bilen var mı?",
    likes: 892,
    comments: 43,
    views: 5621,
    gradient: "linear-gradient(160deg, #06070B 0%, #0A1A2E 50%, #0B2E4E 100%)",
    liked: false,
  },
  {
    id: "r3",
    authorId: "+777 7790 2265",
    authorEmoji: "⚡",
    mood: "⚡",
    description: "500 OMNI kazandım bugün. Wallet dolu 💎",
    likes: 2341,
    comments: 156,
    views: 15673,
    location: "📍 Kadıköy ~5km",
    gradient: "linear-gradient(160deg, #06070B 0%, #1A1A0A 50%, #2E2E0B 100%)",
    liked: true,
  },
  {
    id: "r4",
    authorId: "+777 1138 6647",
    authorEmoji: "🔮",
    mood: "🌙",
    description: "Gece yarısı düşünceler. Uyku yok 🌑",
    likes: 673,
    comments: 31,
    views: 3892,
    gradient: "linear-gradient(160deg, #06070B 0%, #0D0A2E 50%, #1A0D4E 100%)",
    liked: false,
  },
  {
    id: "r5",
    authorId: "+777 9903 4412",
    authorEmoji: "🎭",
    mood: "💔",
    description: "Anonim olmak bazen özgürleştirir",
    likes: 1876,
    comments: 112,
    views: 12004,
    location: "📍 Beşiktaş ~1km",
    gradient: "linear-gradient(160deg, #06070B 0%, #2E0A0A 50%, #4E0B0B 100%)",
    liked: false,
  },
  {
    id: "r6",
    authorId: "+777 4456 8891",
    authorEmoji: "🌸",
    mood: "🌸",
    description: "Yeni gün, yeni kimlik. OMNI ile mümkün",
    likes: 934,
    comments: 58,
    views: 6234,
    rideTag: true,
    gradient: "linear-gradient(160deg, #06070B 0%, #2E0A2E 50%, #4E0B4E 100%)",
    liked: false,
  },
];

const NEARBY_USERS: NearbyUser[] = [
  {
    id: "u1",
    userId: "+777 3842 9173",
    emoji: "🦊",
    trust: 94,
    online: true,
    following: false,
    mood: "🔥",
  },
  {
    id: "u2",
    userId: "+777 5521 0834",
    emoji: "🌊",
    trust: 87,
    online: true,
    following: true,
    mood: "😎",
  },
  {
    id: "u3",
    userId: "+777 7790 2265",
    emoji: "⚡",
    trust: 91,
    online: false,
    following: false,
    mood: "⚡",
  },
  {
    id: "u4",
    userId: "+777 1138 6647",
    emoji: "🔮",
    trust: 78,
    online: true,
    following: false,
    mood: "🌙",
  },
  {
    id: "u5",
    userId: "+777 9903 4412",
    emoji: "🎭",
    trust: 96,
    online: true,
    following: true,
    mood: "💔",
  },
  {
    id: "u6",
    userId: "+777 4456 8891",
    emoji: "🌸",
    trust: 83,
    online: false,
    following: false,
    mood: "🌸",
  },
];

// ─── Helpers ─────────────────────────────────────────────────────────────────

const privacyConfig: Record<Privacy, { label: string; color: string }> = {
  PUBLIC: { label: "PUBLIC", color: "#2FF5C7" },
  FRIENDS: { label: "FRIENDS", color: "#19E6FF" },
  ANON: { label: "ANON", color: "#B56BFF" },
  GHOST: { label: "GHOST", color: "#FF4F4F" },
};

const MOOD_FILTERS = [
  "All",
  "🔥 Hot",
  "😎 Chill",
  "💔 Sad",
  "🌙 Night",
  "⚡ Energy",
];
const MOOD_TAGS = ["🔥", "😎", "💔", "🌙", "⚡", "🌊", "🎭", "🌸", "💎", "✨"];

function formatCount(n: number): string {
  if (n >= 1000) return `${(n / 1000).toFixed(1)}K`;
  return String(n);
}

// ─── Story Viewer ─────────────────────────────────────────────────────────────

function StoryViewer({
  story,
  onClose,
}: { story: Story; onClose: () => void }) {
  useEffect(() => {
    const t = setTimeout(onClose, 4000);
    return () => clearTimeout(t);
  }, [onClose]);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      style={{ background: story.gradient }}
      className="fixed inset-0 z-50 flex flex-col items-center justify-center"
      onClick={onClose}
    >
      <div className="absolute top-4 left-4 right-4 h-1 bg-white/20 rounded-full overflow-hidden">
        <motion.div
          className="h-full bg-white rounded-full"
          initial={{ width: "0%" }}
          animate={{ width: "100%" }}
          transition={{ duration: 4, ease: "linear" }}
        />
      </div>
      <button
        type="button"
        onClick={onClose}
        className="absolute top-6 right-4 text-white/80"
      >
        <X size={24} />
      </button>
      <div className="text-8xl mb-4">{story.emoji}</div>
      <div className="text-white/60 text-sm font-mono">{story.authorId}</div>
      <div className="text-white/40 text-xs mt-2">{story.timeLeft}</div>
    </motion.div>
  );
}

// ─── Token Tip Modal ──────────────────────────────────────────────────────────

function TipModal({
  recipientId,
  onClose,
  onSend,
}: {
  recipientId: string;
  onClose: () => void;
  onSend: (amount: number) => void;
}) {
  const [selected, setSelected] = useState(10);
  const amounts = [5, 10, 25, 50];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-black/70 flex items-end justify-center"
      onClick={onClose}
    >
      <motion.div
        initial={{ y: 100 }}
        animate={{ y: 0 }}
        exit={{ y: 100 }}
        className="w-full max-w-md rounded-t-2xl p-6 mb-0"
        style={{ background: "#151A26", border: "1px solid #2A3142" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="text-center mb-4">
          <div className="text-white font-semibold text-lg">
            💰 Token Gönder
          </div>
          <div className="text-[#A7ACBE] text-sm font-mono mt-1">
            {recipientId}
          </div>
        </div>
        <div className="grid grid-cols-4 gap-3 mb-5">
          {amounts.map((a) => (
            <button
              type="button"
              key={a}
              onClick={() => setSelected(a)}
              className="rounded-xl py-3 text-sm font-bold transition-all"
              style={{
                background: selected === a ? "#19E6FF22" : "#1E2436",
                border: `1px solid ${selected === a ? "#19E6FF" : "#2A3142"}`,
                color: selected === a ? "#19E6FF" : "#A7ACBE",
              }}
              data-ocid="tip.select_button"
            >
              {a} OMNI
            </button>
          ))}
        </div>
        <button
          type="button"
          onClick={() => onSend(selected)}
          className="w-full py-3 rounded-xl font-bold text-sm"
          style={{
            background: "linear-gradient(135deg, #19E6FF, #B56BFF)",
            color: "#06070B",
          }}
          data-ocid="tip.submit_button"
        >
          Gönder ✨
        </button>
      </motion.div>
    </motion.div>
  );
}

// ─── Media Upload Modal ───────────────────────────────────────────────────────

function MediaUploadModal({
  onClose,
  onCreate,
}: { onClose: () => void; onCreate: (post: Partial<Post>) => void }) {
  const [text, setText] = useState("");
  const [mood, setMood] = useState("🔥");
  const [privacy, setPrivacy] = useState<Privacy>("PUBLIC");
  const [mediaFile, setMediaFile] = useState<File | null>(null);
  const [mediaPreview, setMediaPreview] = useState<string | null>(null);
  const [mediaType, setMediaType] = useState<"image" | "video" | null>(null);
  const [dragging, setDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = (file: File) => {
    if (!file.type.startsWith("image/") && !file.type.startsWith("video/"))
      return;
    const type = file.type.startsWith("image/") ? "image" : "video";
    const url = URL.createObjectURL(file);
    setMediaFile(file);
    setMediaPreview(url);
    setMediaType(type);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  const clearMedia = () => {
    if (mediaPreview) URL.revokeObjectURL(mediaPreview);
    setMediaFile(null);
    setMediaPreview(null);
    setMediaType(null);
  };

  const submit = () => {
    if (!text.trim() && !mediaFile) return;
    const post: Partial<Post> = { content: text, mood, privacy };
    if (mediaPreview && mediaType) {
      post.mediaUrl = mediaPreview;
      post.mediaType = mediaType;
    }
    onCreate(post);
    onClose();
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-end justify-center"
      style={{ background: "rgba(0,0,0,0.75)", backdropFilter: "blur(4px)" }}
      onClick={onClose}
      data-ocid="post.modal"
    >
      <motion.div
        initial={{ y: 300 }}
        animate={{ y: 0 }}
        exit={{ y: 300 }}
        transition={{ type: "spring", damping: 28, stiffness: 320 }}
        className="w-full max-w-md rounded-t-2xl p-5 overflow-y-auto"
        style={{
          background: "rgba(10,11,22,0.97)",
          border: "1px solid rgba(25,230,255,0.2)",
          boxShadow: "0 -8px 40px rgba(25,230,255,0.08)",
          maxHeight: "90vh",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <span className="text-white font-bold flex items-center gap-2">
            <Camera size={18} color="#19E6FF" />
            Medya Paylaş
          </span>
          <button type="button" onClick={onClose} data-ocid="post.close_button">
            <X size={20} color="#A7ACBE" />
          </button>
        </div>

        {/* Drop zone / preview */}
        {!mediaPreview ? (
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setDragging(true);
            }}
            onDragLeave={() => setDragging(false)}
            onDrop={handleDrop}
            className="w-full rounded-xl mb-4 flex flex-col items-center justify-center gap-3 cursor-pointer transition-all"
            style={{
              height: "160px",
              border: `2px dashed ${dragging ? "#19E6FF" : "rgba(25,230,255,0.2)"}`,
              background: dragging
                ? "rgba(25,230,255,0.06)"
                : "rgba(30,36,54,0.6)",
            }}
            onClick={() => fileInputRef.current?.click()}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ")
                fileInputRef.current?.click();
            }}
            data-ocid="post.dropzone"
          >
            <Camera size={32} color={dragging ? "#19E6FF" : "#4A5568"} />
            <div className="text-center">
              <p
                className="text-sm font-semibold"
                style={{ color: dragging ? "#19E6FF" : "#A7ACBE" }}
              >
                Fotoğraf veya video sürükle
              </p>
              <p className="text-xs mt-0.5" style={{ color: "#4A5568" }}>
                ya da tıkla
              </p>
            </div>
            <button
              type="button"
              className="px-4 py-1.5 rounded-full text-xs font-bold"
              style={{
                background: "rgba(25,230,255,0.12)",
                border: "1px solid rgba(25,230,255,0.3)",
                color: "#19E6FF",
              }}
              data-ocid="post.upload_button"
            >
              Dosya Seç
            </button>
          </div>
        ) : (
          <div
            className="relative w-full rounded-xl overflow-hidden mb-4"
            style={{ maxHeight: "240px" }}
          >
            {mediaType === "image" ? (
              <img
                src={mediaPreview}
                alt="preview"
                className="w-full object-cover rounded-xl"
                style={{ maxHeight: "240px" }}
              />
            ) : (
              <video
                src={mediaPreview}
                autoPlay
                muted
                loop
                playsInline
                className="w-full rounded-xl object-cover"
                style={{ maxHeight: "240px" }}
              />
            )}
            <button
              type="button"
              onClick={clearMedia}
              className="absolute top-2 right-2 w-7 h-7 rounded-full flex items-center justify-center"
              style={{
                background: "rgba(0,0,0,0.7)",
                border: "1px solid rgba(255,255,255,0.2)",
              }}
              data-ocid="post.delete_button"
            >
              <X size={14} color="white" />
            </button>
          </div>
        )}

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*,video/*"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) handleFile(f);
          }}
        />

        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Ne düşünüyorsun?"
          rows={3}
          className="w-full rounded-xl p-3 text-sm resize-none outline-none mb-3"
          style={{
            background: "rgba(30,36,54,0.8)",
            border: "1px solid rgba(25,230,255,0.15)",
            color: "#F2F4FF",
          }}
          data-ocid="post.textarea"
        />

        <div className="mb-3">
          <div className="text-[#A7ACBE] text-xs mb-2">Mood</div>
          <div className="flex gap-2 flex-wrap">
            {MOOD_TAGS.map((m) => (
              <button
                type="button"
                key={m}
                onClick={() => setMood(m)}
                className="text-xl p-1 rounded-lg transition-all"
                style={{
                  background: mood === m ? "#19E6FF22" : "transparent",
                  border: `1px solid ${mood === m ? "#19E6FF" : "transparent"}`,
                }}
              >
                {m}
              </button>
            ))}
          </div>
        </div>

        <div className="mb-4">
          <div className="text-[#A7ACBE] text-xs mb-2">Gizlilik</div>
          <div className="flex gap-2 flex-wrap">
            {(["PUBLIC", "FRIENDS", "ANON", "GHOST"] as Privacy[]).map((p) => (
              <button
                type="button"
                key={p}
                onClick={() => setPrivacy(p)}
                className="text-xs px-3 py-1.5 rounded-full font-semibold transition-all"
                style={{
                  background:
                    privacy === p
                      ? `${privacyConfig[p].color}22`
                      : "rgba(30,36,54,0.8)",
                  border: `1px solid ${privacy === p ? privacyConfig[p].color : "rgba(25,230,255,0.1)"}`,
                  color: privacy === p ? privacyConfig[p].color : "#A7ACBE",
                }}
                data-ocid="post.privacy_button"
              >
                {p}
              </button>
            ))}
          </div>
        </div>

        <div className="flex gap-2">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-3 rounded-xl font-bold text-sm"
            style={{
              background: "rgba(30,36,54,0.8)",
              border: "1px solid rgba(25,230,255,0.1)",
              color: "#A7ACBE",
            }}
            data-ocid="post.cancel_button"
          >
            İptal
          </button>
          <button
            type="button"
            onClick={submit}
            className="flex-1 py-3 rounded-xl font-bold text-sm"
            style={{
              background: "linear-gradient(135deg, #19E6FF, #2FF5C7)",
              color: "#06070B",
            }}
            data-ocid="post.submit_button"
          >
            Paylaş
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ─── Feed Tab ─────────────────────────────────────────────────────────────────

function FeedTab() {
  const [stories] = useState(INITIAL_STORIES);
  const [posts, setPosts] = useState(INITIAL_POSTS);
  const [activeStory, setActiveStory] = useState<Story | null>(null);
  const [tipTarget, setTipTarget] = useState<string | null>(null);
  const [commentOpen, setCommentOpen] = useState<string | null>(null);
  const [commentText, setCommentText] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const { tokenBalance } = useOmniStore();
  const [localBalance, setLocalBalance] = useState(tokenBalance);

  const toggleLike = (id: string) => {
    setPosts((prev) =>
      prev.map((p) =>
        p.id === id
          ? {
              ...p,
              liked: !p.liked,
              likes: p.liked ? p.likes - 1 : p.likes + 1,
            }
          : p,
      ),
    );
  };

  const handleTip = (amount: number) => {
    if (!tipTarget) return;
    if (localBalance < amount) {
      toast.error("Yetersiz bakiye!");
      return;
    }
    setLocalBalance((b) => b - amount);
    toast.success(`${amount} OMNI gönderildi! 🎉`);
    setTipTarget(null);
  };

  const handleCreate = (partial: Partial<Post>) => {
    const newPost: Post = {
      id: `p${Date.now()}`,
      authorId: "+777 0000 0001",
      authorEmoji: "🔮",
      content: partial.content ?? "",
      mood: partial.mood ?? "🔥",
      privacy: partial.privacy ?? "PUBLIC",
      likes: 0,
      comments: 0,
      shares: 0,
      time: "Şimdi",
      liked: false,
    };
    setPosts((prev) => [newPost, ...prev]);
    toast.success("Gönderi paylaşıldı!");
  };

  return (
    <div
      className="flex flex-col h-full overflow-y-auto"
      style={{ scrollbarWidth: "none" }}
    >
      {/* Stories row */}
      <div
        className="flex gap-3 px-4 py-3 overflow-x-auto"
        style={{ scrollbarWidth: "none" }}
      >
        {/* Add story */}
        <div className="flex flex-col items-center gap-1 flex-shrink-0">
          <button
            type="button"
            onClick={() => setShowCreate(true)}
            className="w-14 h-14 rounded-full flex items-center justify-center"
            style={{ background: "#1E2436", border: "2px dashed #2A3142" }}
            data-ocid="feed.add_story_button"
          >
            <Plus size={20} color="#19E6FF" />
          </button>
          <span className="text-[#A7ACBE] text-xs">Sen</span>
        </div>
        {stories.map((s) => (
          <div
            key={s.id}
            className="flex flex-col items-center gap-1 flex-shrink-0"
          >
            <button
              type="button"
              onClick={() => setActiveStory(s)}
              className="w-14 h-14 rounded-full flex items-center justify-center text-2xl relative"
              style={{ background: s.gradient, padding: "2px" }}
              data-ocid="feed.story_button"
            >
              <div
                className="w-full h-full rounded-full flex items-center justify-center"
                style={{ background: "#06070B" }}
              >
                {s.authorEmoji}
              </div>
            </button>
            <span className="text-[#A7ACBE] text-xs">{s.timeLeft}</span>
          </div>
        ))}
      </div>

      {/* Posts */}
      <div className="flex flex-col gap-4 px-4 pb-6">
        {posts.map((post) => {
          const pc = privacyConfig[post.privacy];
          return (
            <motion.div
              key={post.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-2xl overflow-hidden"
              style={{ background: "#151A26", border: "1px solid #2A3142" }}
              data-ocid="feed.post.item"
            >
              {/* Header */}
              <div className="flex items-center gap-3 px-4 pt-4 pb-2">
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center text-xl"
                  style={{ background: "#1E2436" }}
                >
                  {post.authorEmoji}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-[#19E6FF] text-xs font-mono truncate">
                      {post.authorId}
                    </span>
                    <span
                      className="text-xs px-2 py-0.5 rounded-full font-bold"
                      style={{
                        background: `${pc.color}22`,
                        color: pc.color,
                        border: `1px solid ${pc.color}44`,
                      }}
                    >
                      {pc.label}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 mt-0.5">
                    {post.rideTag && (
                      <span
                        className="text-xs flex items-center gap-1"
                        style={{ color: "#2FF5C7" }}
                      >
                        <Car size={10} />
                        Seyahat sırasında
                      </span>
                    )}
                    <span className="text-[#A7ACBE] text-xs">
                      {post.time} önce
                    </span>
                  </div>
                </div>
                <span className="text-xl">{post.mood}</span>
              </div>

              {/* Content */}
              <div
                className="mx-4 mb-3 p-4 rounded-xl"
                style={{ background: "#1E2436" }}
              >
                <p className="text-[#F2F4FF] text-sm leading-relaxed">
                  {post.content}
                </p>
              </div>

              {/* Media */}
              {post.mediaUrl && (
                <div className="mx-4 mb-3 rounded-xl overflow-hidden">
                  {post.mediaType === "video" ? (
                    <video
                      src={post.mediaUrl}
                      autoPlay
                      muted
                      loop
                      playsInline
                      className="w-full rounded-xl max-h-72 object-cover"
                    />
                  ) : (
                    <img
                      src={post.mediaUrl}
                      alt="post media"
                      className="w-full rounded-xl object-cover max-h-72"
                    />
                  )}
                </div>
              )}

              {/* Stats */}
              <div className="flex items-center gap-4 px-4 pb-2 text-[#A7ACBE] text-xs">
                <span>❤️ {formatCount(post.likes)}</span>
                <span>💬 {post.comments}</span>
                <span>🔁 {post.shares}</span>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-1 px-3 pb-4">
                <button
                  type="button"
                  onClick={() => toggleLike(post.id)}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all"
                  style={{
                    background: post.liked ? "#FF4F4F22" : "#1E2436",
                    color: post.liked ? "#FF4F4F" : "#A7ACBE",
                  }}
                  data-ocid="feed.post.like_button"
                >
                  <Heart size={14} fill={post.liked ? "#FF4F4F" : "none"} />
                  Beğen
                </button>
                <button
                  type="button"
                  onClick={() =>
                    setCommentOpen(commentOpen === post.id ? null : post.id)
                  }
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all"
                  style={{ background: "#1E2436", color: "#A7ACBE" }}
                  data-ocid="feed.post.comment_button"
                >
                  <MessageCircle size={14} />
                  Yorum
                </button>
                <button
                  type="button"
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold"
                  style={{ background: "#1E2436", color: "#A7ACBE" }}
                  data-ocid="feed.post.share_button"
                >
                  <Share2 size={14} />
                  Paylaş
                </button>
                <button
                  type="button"
                  onClick={() => setTipTarget(post.authorId)}
                  className="ml-auto flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold"
                  style={{
                    background: "#B56BFF22",
                    color: "#B56BFF",
                    border: "1px solid #B56BFF44",
                  }}
                  data-ocid="feed.post.tip_button"
                >
                  <Coins size={14} />
                  Tip
                </button>
              </div>

              {/* Comment input */}
              <AnimatePresence>
                {commentOpen === post.id && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="px-4 pb-4 overflow-hidden"
                  >
                    <div className="flex gap-2">
                      <input
                        value={commentText}
                        onChange={(e) => setCommentText(e.target.value)}
                        placeholder="Yorumunu yaz..."
                        className="flex-1 rounded-xl px-3 py-2 text-xs outline-none"
                        style={{
                          background: "#1E2436",
                          border: "1px solid #2A3142",
                          color: "#F2F4FF",
                        }}
                        data-ocid="feed.post.comment_input"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          toast.success("Yorum eklendi!");
                          setCommentText("");
                          setCommentOpen(null);
                        }}
                        className="px-3 py-2 rounded-xl text-xs font-bold"
                        style={{ background: "#19E6FF", color: "#06070B" }}
                        data-ocid="feed.post.comment_submit"
                      >
                        Gönder
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          );
        })}
      </div>

      {/* FAB */}
      <button
        type="button"
        onClick={() => setShowCreate(true)}
        className="fixed bottom-24 right-4 w-12 h-12 rounded-full flex items-center justify-center shadow-lg z-40"
        style={{ background: "linear-gradient(135deg, #19E6FF, #B56BFF)" }}
        data-ocid="feed.create_post_button"
      >
        <Plus size={22} color="#06070B" />
      </button>

      {/* Modals */}
      <AnimatePresence>
        {activeStory && (
          <StoryViewer
            story={activeStory}
            onClose={() => setActiveStory(null)}
          />
        )}
        {tipTarget && (
          <TipModal
            recipientId={tipTarget}
            onClose={() => setTipTarget(null)}
            onSend={handleTip}
          />
        )}
        {showCreate && (
          <MediaUploadModal
            onClose={() => setShowCreate(false)}
            onCreate={handleCreate}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Reels Tab ────────────────────────────────────────────────────────────────

function ReelsTab() {
  const [reels, setReels] = useState(INITIAL_REELS);
  const [tipTarget, setTipTarget] = useState<string | null>(null);
  const { tokenBalance } = useOmniStore();
  const [localBalance, setLocalBalance] = useState(tokenBalance);

  const toggleLike = (id: string) => {
    setReels((prev) =>
      prev.map((r) =>
        r.id === id
          ? {
              ...r,
              liked: !r.liked,
              likes: r.liked ? r.likes - 1 : r.likes + 1,
            }
          : r,
      ),
    );
  };

  const handleTip = (amount: number) => {
    if (!tipTarget) return;
    if (localBalance < amount) {
      toast.error("Yetersiz bakiye!");
      return;
    }
    setLocalBalance((b) => b - amount);
    toast.success(`${amount} OMNI gönderildi! 💫`);
    setTipTarget(null);
  };

  return (
    <div
      className="h-full overflow-y-scroll"
      style={{
        scrollSnapType: "y mandatory",
        scrollbarWidth: "none",
        WebkitOverflowScrolling: "touch",
      }}
      data-ocid="reels.list"
    >
      {reels.map((reel, i) => (
        <div
          key={reel.id}
          className="relative flex-shrink-0"
          style={{
            height: "100%",
            scrollSnapAlign: "start",
            background: reel.gradient,
          }}
          data-ocid={`reels.item.${i + 1}`}
        >
          {/* Progress bar */}
          <div className="absolute top-0 left-0 right-0 h-0.5 bg-white/20">
            <motion.div
              className="h-full bg-white"
              initial={{ width: "0%" }}
              animate={{ width: "85%" }}
              transition={{
                duration: 3,
                ease: "linear",
                repeat: Number.POSITIVE_INFINITY,
              }}
            />
          </div>

          {/* Playing indicator */}
          <div className="absolute top-4 left-4 flex items-center gap-1.5">
            <div
              className="w-5 h-5 rounded-full flex items-center justify-center"
              style={{ background: "#19E6FF22", border: "1px solid #19E6FF44" }}
            >
              <Play size={10} fill="#19E6FF" color="#19E6FF" />
            </div>
            <span className="text-white/60 text-xs">Oynatılıyor</span>
          </div>

          {/* Center emoji */}
          <div className="absolute inset-0 flex items-center justify-center">
            <motion.div
              className="text-8xl"
              animate={{ scale: [1, 1.05, 1] }}
              transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY }}
            >
              {reel.mood}
            </motion.div>
          </div>

          {/* Bottom info */}
          <div className="absolute bottom-6 left-4 right-16">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-2xl">{reel.authorEmoji}</span>
              <span className="text-white/80 text-sm font-mono">
                {reel.authorId}
              </span>
            </div>
            <p className="text-white/70 text-sm mb-2">{reel.description}</p>
            <div className="flex flex-wrap gap-2">
              {reel.location && (
                <span
                  className="text-xs px-2 py-0.5 rounded-full"
                  style={{
                    background: "rgba(6,7,11,0.6)",
                    color: "#A7ACBE",
                    backdropFilter: "blur(4px)",
                  }}
                >
                  {reel.location}
                </span>
              )}
              {reel.rideTag && (
                <span
                  className="text-xs px-2 py-0.5 rounded-full flex items-center gap-1"
                  style={{
                    background: "rgba(47,245,199,0.15)",
                    color: "#2FF5C7",
                    border: "1px solid #2FF5C744",
                  }}
                >
                  <Car size={10} />
                  Seyahat sırasında
                </span>
              )}
            </div>
          </div>

          {/* Right actions */}
          <div className="absolute right-3 bottom-8 flex flex-col items-center gap-5">
            <button
              type="button"
              onClick={() => toggleLike(reel.id)}
              className="flex flex-col items-center gap-1"
              data-ocid="reels.like_button"
            >
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center"
                style={{
                  background: reel.liked
                    ? "#FF4F4F22"
                    : "rgba(255,255,255,0.1)",
                }}
              >
                <Heart
                  size={20}
                  fill={reel.liked ? "#FF4F4F" : "none"}
                  color={reel.liked ? "#FF4F4F" : "white"}
                />
              </div>
              <span className="text-white/60 text-xs">
                {formatCount(reel.likes)}
              </span>
            </button>
            <button
              type="button"
              className="flex flex-col items-center gap-1"
              data-ocid="reels.comment_button"
            >
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center"
                style={{ background: "rgba(255,255,255,0.1)" }}
              >
                <MessageCircle size={20} color="white" />
              </div>
              <span className="text-white/60 text-xs">
                {formatCount(reel.comments)}
              </span>
            </button>
            <button
              type="button"
              className="flex flex-col items-center gap-1"
              data-ocid="reels.share_button"
            >
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center"
                style={{ background: "rgba(255,255,255,0.1)" }}
              >
                <Share2 size={20} color="white" />
              </div>
              <span className="text-white/60 text-xs">
                {formatCount(reel.views)}
              </span>
            </button>
            <button
              type="button"
              onClick={() => setTipTarget(reel.authorId)}
              className="flex flex-col items-center gap-1"
              data-ocid="reels.tip_button"
            >
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center"
                style={{
                  background: "rgba(181,107,255,0.2)",
                  border: "1px solid #B56BFF44",
                }}
              >
                <Coins size={20} color="#B56BFF" />
              </div>
              <span className="text-white/60 text-xs">Tip</span>
            </button>
            <button
              type="button"
              className="flex flex-col items-center gap-1"
              data-ocid="reels.more_button"
            >
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center"
                style={{ background: "rgba(255,255,255,0.1)" }}
              >
                <MoreVertical size={20} color="white" />
              </div>
            </button>
          </div>
        </div>
      ))}

      <AnimatePresence>
        {tipTarget && (
          <TipModal
            recipientId={tipTarget}
            onClose={() => setTipTarget(null)}
            onSend={handleTip}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Explore Tab ──────────────────────────────────────────────────────────────

function ExploreTab() {
  const [moodFilter, setMoodFilter] = useState("All");
  const [users, setUsers] = useState(NEARBY_USERS);

  const toggleFollow = (id: string) => {
    setUsers((prev) =>
      prev.map((u) => (u.id === id ? { ...u, following: !u.following } : u)),
    );
  };

  const trendingReels = INITIAL_REELS.slice(0, 4);
  const viralGrid = [...INITIAL_REELS, ...INITIAL_REELS].slice(0, 9);

  return (
    <div
      className="h-full overflow-y-auto px-4 pb-6"
      style={{ scrollbarWidth: "none" }}
    >
      {/* Mood filter */}
      <div
        className="flex gap-2 overflow-x-auto py-3"
        style={{ scrollbarWidth: "none" }}
      >
        {MOOD_FILTERS.map((f) => (
          <button
            type="button"
            key={f}
            onClick={() => setMoodFilter(f)}
            className="flex-shrink-0 px-4 py-2 rounded-full text-xs font-semibold transition-all"
            style={{
              background: moodFilter === f ? "#19E6FF22" : "#151A26",
              border: `1px solid ${moodFilter === f ? "#19E6FF" : "#2A3142"}`,
              color: moodFilter === f ? "#19E6FF" : "#A7ACBE",
            }}
            data-ocid="explore.mood_filter.tab"
          >
            {f}
          </button>
        ))}
      </div>

      {/* Trending */}
      <div className="mb-5">
        <div className="flex items-center gap-2 mb-3">
          <span className="text-white font-semibold">🔥 Trend</span>
          <span
            className="text-xs px-2 py-0.5 rounded-full"
            style={{ background: "#FF4F4F22", color: "#FF4F4F" }}
          >
            Canlı
          </span>
        </div>
        <div
          className="flex gap-3 overflow-x-auto"
          style={{ scrollbarWidth: "none" }}
        >
          {trendingReels.map((r, i) => (
            <div
              key={r.id}
              className="flex-shrink-0 w-32 h-44 rounded-2xl relative overflow-hidden"
              style={{ background: r.gradient }}
              data-ocid={`explore.trending.item.${i + 1}`}
            >
              <div className="absolute inset-0 flex items-center justify-center text-5xl">
                {r.mood}
              </div>
              <div
                className="absolute bottom-0 left-0 right-0 p-2"
                style={{
                  background: "linear-gradient(transparent, rgba(6,7,11,0.9))",
                }}
              >
                <div className="text-white/70 text-xs">
                  {formatCount(r.views)} görüntü
                </div>
                <div className="flex items-center gap-1 mt-0.5">
                  <span
                    className="text-[8px] px-1.5 py-0.5 rounded-full"
                    style={{ background: "#FF4F4F22", color: "#FF4F4F" }}
                  >
                    🔥 TREND
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Nearby Users */}
      <div className="mb-5">
        <div className="text-white font-semibold mb-3">
          👥 Yakındaki Kullanıcılar
        </div>
        <div className="grid grid-cols-2 gap-3">
          {users.map((u, i) => (
            <div
              key={u.id}
              className="rounded-2xl p-3"
              style={{ background: "#151A26", border: "1px solid #2A3142" }}
              data-ocid={`explore.user.item.${i + 1}`}
            >
              <div className="flex items-center gap-2 mb-2">
                <div className="relative">
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center text-xl"
                    style={{ background: "#1E2436" }}
                  >
                    {u.emoji}
                  </div>
                  {u.online && (
                    <div
                      className="absolute bottom-0 right-0 w-3 h-3 rounded-full"
                      style={{
                        background: "#2FF5C7",
                        border: "2px solid #06070B",
                      }}
                    />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-[#19E6FF] text-xs font-mono truncate">
                    {u.userId}
                  </div>
                  <div className="text-[#A7ACBE] text-xs">
                    ⭐ {u.trust} Güven
                  </div>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-lg">{u.mood}</span>
                <button
                  type="button"
                  onClick={() => toggleFollow(u.id)}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-bold transition-all"
                  style={{
                    background: u.following ? "#2FF5C722" : "#19E6FF22",
                    border: `1px solid ${u.following ? "#2FF5C7" : "#19E6FF"}`,
                    color: u.following ? "#2FF5C7" : "#19E6FF",
                  }}
                  data-ocid="explore.user.follow_button"
                >
                  {u.following ? (
                    <>
                      <Check size={10} />
                      Takip
                    </>
                  ) : (
                    <>
                      <UserPlus size={10} />
                      Takip Et
                    </>
                  )}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Viral grid */}
      <div>
        <div className="text-white font-semibold mb-3">⚡ Viral İçerikler</div>
        <div className="grid grid-cols-3 gap-1.5">
          {viralGrid.map((r, i) => (
            <div
              key={`${r.id}-${i}`}
              className="aspect-square rounded-xl flex items-center justify-center text-3xl"
              style={{ background: r.gradient }}
              data-ocid={`explore.viral.item.${i + 1}`}
            >
              {r.mood}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Profile Tab ──────────────────────────────────────────────────────────────

function ProfileTab() {
  const { activeIdentityId, identities, privacyMode, setActiveModule } =
    useOmniStore();
  const activeIdentity =
    identities.find((i) => i.id === activeIdentityId) ?? identities[0];
  const [profileTab, setProfileTab] = useState<"grid" | "reels" | "stories">(
    "grid",
  );
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);
  const { tokenBalance } = useOmniStore();

  const displayId = activeIdentity?.id ?? "+777 0000 0001";
  const displayEmoji = activeIdentity?.emoji ?? "🔮";
  const displayName = activeIdentity?.nickname ?? "Anonim";
  const trust = 94;
  const followers = 1247;
  const following = 389;
  const posts = 42;

  const privacyLabel =
    privacyMode === "ghost"
      ? "GHOST"
      : privacyMode === "shadow"
        ? "SHADOW"
        : "NORMAL";
  const privacyColor =
    privacyMode === "ghost"
      ? "#FF4F4F"
      : privacyMode === "shadow"
        ? "#B56BFF"
        : "#2FF5C7";

  const handleChat = () => {
    setActiveModule("chat");
  };

  const gridItems = INITIAL_REELS;
  const reelItems = INITIAL_REELS.slice(0, 4);
  const storyItems = INITIAL_STORIES.slice(0, 3);

  return (
    <div className="h-full overflow-y-auto" style={{ scrollbarWidth: "none" }}>
      {/* Profile Header */}
      <div
        className="px-4 pt-4 pb-3"
        style={{
          background: "linear-gradient(180deg, #0B1020 0%, transparent 100%)",
        }}
      >
        <div className="flex items-center justify-between mb-4">
          <div className="text-white font-bold text-lg">Profilim</div>
          <button
            type="button"
            onClick={() => setShowPrivacyModal(true)}
            className="w-9 h-9 rounded-xl flex items-center justify-center"
            style={{ background: "#1E2436", border: "1px solid #2A3142" }}
            data-ocid="profile.settings_button"
          >
            <Settings size={18} color="#A7ACBE" />
          </button>
        </div>

        {/* Avatar + Stats */}
        <div className="flex items-center gap-5 mb-4">
          <div className="relative">
            <div
              className="w-20 h-20 rounded-full flex items-center justify-center text-4xl"
              style={{
                background: "linear-gradient(135deg, #19E6FF, #B56BFF)",
                padding: "3px",
              }}
            >
              <div
                className="w-full h-full rounded-full flex items-center justify-center"
                style={{ background: "#0B1020" }}
              >
                {displayEmoji}
              </div>
            </div>
            <div
              className="absolute -bottom-1 -right-1 text-xs px-2 py-0.5 rounded-full font-bold"
              style={{
                background: `${privacyColor}22`,
                color: privacyColor,
                border: `1px solid ${privacyColor}44`,
              }}
            >
              {privacyLabel}
            </div>
          </div>

          <div className="flex-1 grid grid-cols-3 gap-2 text-center">
            {[
              { label: "Takipçi", value: formatCount(followers) },
              { label: "Takip", value: formatCount(following) },
              { label: "Gönderi", value: String(posts) },
            ].map((s) => (
              <div key={s.label}>
                <div className="text-white font-bold text-lg">{s.value}</div>
                <div className="text-[#A7ACBE] text-xs">{s.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Identity info */}
        <div className="mb-3">
          <div className="text-[#19E6FF] font-mono text-sm">{displayId}</div>
          <div className="text-[#F2F4FF] font-semibold mt-0.5">
            {displayName}
          </div>
          <div className="text-[#A7ACBE] text-xs mt-1">
            OMNI Super App kullanıcısı. Gizlilik önce gelir. 🔐
          </div>
          <div className="flex items-center gap-2 mt-2">
            <span
              className="text-xs px-2 py-0.5 rounded-full"
              style={{
                background: "#FFD70022",
                color: "#FFD700",
                border: "1px solid #FFD70044",
              }}
            >
              ⭐ {trust} Güven Skoru
            </span>
            <span
              className="text-xs px-2 py-0.5 rounded-full"
              style={{
                background: "#B56BFF22",
                color: "#B56BFF",
                border: "1px solid #B56BFF44",
              }}
            >
              💎 {tokenBalance} OMNI
            </span>
          </div>
        </div>

        {/* Quick actions */}
        <div className="flex gap-2 mb-3">
          <button
            type="button"
            onClick={handleChat}
            className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-bold"
            style={{
              background: "#19E6FF22",
              border: "1px solid #19E6FF44",
              color: "#19E6FF",
            }}
            data-ocid="profile.chat_button"
          >
            <MessageCircle size={14} />
            Sohbet
          </button>
          <button
            type="button"
            className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-bold"
            style={{
              background: "#B56BFF22",
              border: "1px solid #B56BFF44",
              color: "#B56BFF",
            }}
            data-ocid="profile.send_token_button"
          >
            <Coins size={14} />
            Token Gönder
          </button>
          <button
            type="button"
            className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-bold"
            style={{
              background: "#2FF5C722",
              border: "1px solid #2FF5C744",
              color: "#2FF5C7",
            }}
            data-ocid="profile.ride_button"
          >
            <Car size={14} />
            Birlikte Git
          </button>
        </div>
      </div>

      {/* Sub-tabs */}
      <div className="flex border-b" style={{ borderColor: "#2A3142" }}>
        {(["grid", "reels", "stories"] as const).map((t) => (
          <button
            type="button"
            key={t}
            onClick={() => setProfileTab(t)}
            className="flex-1 py-3 text-xs font-semibold transition-all"
            style={{
              color: profileTab === t ? "#19E6FF" : "#A7ACBE",
              borderBottom:
                profileTab === t
                  ? "2px solid #19E6FF"
                  : "2px solid transparent",
            }}
            data-ocid="profile.content_tab"
          >
            {t === "grid"
              ? "📷 Grid"
              : t === "reels"
                ? "🎬 Reels"
                : "⏳ Hikayeler"}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="p-2 pb-6">
        {profileTab === "grid" && (
          <div className="grid grid-cols-3 gap-1">
            {gridItems.map((r, i) => (
              <div
                key={r.id}
                className="aspect-square rounded-lg flex items-center justify-center text-3xl"
                style={{ background: r.gradient }}
                data-ocid={`profile.grid.item.${i + 1}`}
              >
                {r.mood}
              </div>
            ))}
          </div>
        )}
        {profileTab === "reels" && (
          <div className="flex flex-col gap-3">
            {reelItems.map((r, i) => (
              <div
                key={r.id}
                className="rounded-2xl p-4 flex items-center gap-3"
                style={{ background: "#151A26", border: "1px solid #2A3142" }}
                data-ocid={`profile.reels.item.${i + 1}`}
              >
                <div
                  className="w-14 h-14 rounded-xl flex items-center justify-center text-3xl"
                  style={{ background: r.gradient }}
                >
                  {r.mood}
                </div>
                <div className="flex-1">
                  <div className="text-white text-sm">{r.description}</div>
                  <div className="text-[#A7ACBE] text-xs mt-1">
                    {formatCount(r.views)} görüntü · {formatCount(r.likes)}{" "}
                    beğeni
                  </div>
                </div>
                <Play size={16} color="#19E6FF" />
              </div>
            ))}
          </div>
        )}
        {profileTab === "stories" && (
          <div className="flex flex-col gap-3">
            {storyItems.map((s, i) => (
              <div
                key={s.id}
                className="rounded-2xl p-4 flex items-center gap-3"
                style={{ background: "#151A26", border: "1px solid #2A3142" }}
                data-ocid={`profile.stories.item.${i + 1}`}
              >
                <div
                  className="w-12 h-12 rounded-full flex items-center justify-center text-2xl"
                  style={{ background: s.gradient }}
                >
                  {s.emoji}
                </div>
                <div className="flex-1">
                  <div className="text-white text-sm">{s.authorId}</div>
                  <div className="text-[#A7ACBE] text-xs mt-0.5">
                    {s.timeLeft}
                  </div>
                </div>
                <Eye size={16} color="#A7ACBE" />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Privacy Modal */}
      <AnimatePresence>
        {showPrivacyModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/70 flex items-end justify-center"
            onClick={() => setShowPrivacyModal(false)}
          >
            <motion.div
              initial={{ y: 100 }}
              animate={{ y: 0 }}
              exit={{ y: 100 }}
              className="w-full max-w-md rounded-t-2xl p-5"
              style={{ background: "#151A26", border: "1px solid #2A3142" }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-4">
                <span className="text-white font-semibold">
                  🔒 Gizlilik Modu
                </span>
                <button
                  type="button"
                  onClick={() => setShowPrivacyModal(false)}
                >
                  <X size={20} color="#A7ACBE" />
                </button>
              </div>
              {(["NORMAL", "GHOST", "SHADOW"] as const).map((mode) => {
                const config = {
                  NORMAL: {
                    color: "#2FF5C7",
                    desc: "Herkese açık profil",
                    emoji: "🌟",
                  },
                  GHOST: {
                    color: "#FF4F4F",
                    desc: "Konum ve durum gizli",
                    emoji: "👻",
                  },
                  SHADOW: {
                    color: "#B56BFF",
                    desc: "Tam anonim mod",
                    emoji: "🌑",
                  },
                }[mode];
                const active = privacyLabel === mode;
                return (
                  <div
                    key={mode}
                    className="flex items-center gap-3 p-3 rounded-xl mb-2 cursor-pointer transition-all"
                    style={{
                      background: active ? `${config.color}15` : "#1E2436",
                      border: `1px solid ${active ? `${config.color}44` : "#2A3142"}`,
                    }}
                    data-ocid="profile.privacy_mode_button"
                  >
                    <span className="text-2xl">{config.emoji}</span>
                    <div className="flex-1">
                      <div
                        className="font-semibold text-sm"
                        style={{ color: config.color }}
                      >
                        {mode}
                      </div>
                      <div className="text-[#A7ACBE] text-xs">
                        {config.desc}
                      </div>
                    </div>
                    {active && <Check size={16} color={config.color} />}
                  </div>
                );
              })}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Main SocialModule ────────────────────────────────────────────────────────

export default function SocialModule() {
  const [activeTab, setActiveTab] = useState<
    "feed" | "reels" | "explore" | "profile"
  >("feed");

  const tabs = [
    { id: "feed" as const, label: "Feed", emoji: "🏠" },
    { id: "reels" as const, label: "Reels", emoji: "🎬" },
    { id: "explore" as const, label: "Keşfet", emoji: "🔍" },
    { id: "profile" as const, label: "Profil", emoji: "👤" },
  ];

  const contentHeight = "calc(100vh - 84px - 80px - 48px)";

  return (
    <div className="flex flex-col h-full" style={{ background: "#06070B" }}>
      {/* Tab Bar */}
      <div
        className="flex border-b flex-shrink-0"
        style={{
          borderColor: "#2A3142",
          background: "#0B1020",
          height: "48px",
        }}
      >
        {tabs.map((tab) => (
          <button
            type="button"
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className="flex-1 flex flex-col items-center justify-center gap-0.5 transition-all"
            style={{
              color: activeTab === tab.id ? "#19E6FF" : "#A7ACBE",
              borderBottom:
                activeTab === tab.id
                  ? "2px solid #19E6FF"
                  : "2px solid transparent",
            }}
            data-ocid={`social.${tab.id}_tab`}
          >
            <span className="text-sm">{tab.emoji}</span>
            <span className="text-[10px] font-semibold">{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden" style={{ height: contentHeight }}>
        <AnimatePresence mode="wait">
          {activeTab === "feed" && (
            <motion.div
              key="feed"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.2 }}
              className="h-full"
            >
              <FeedTab />
            </motion.div>
          )}
          {activeTab === "reels" && (
            <motion.div
              key="reels"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="h-full"
            >
              <ReelsTab />
            </motion.div>
          )}
          {activeTab === "explore" && (
            <motion.div
              key="explore"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
              className="h-full"
            >
              <ExploreTab />
            </motion.div>
          )}
          {activeTab === "profile" && (
            <motion.div
              key="profile"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.2 }}
              className="h-full"
            >
              <ProfileTab />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
