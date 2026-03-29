import { useActor } from "@/hooks/useActor";
import type { AnonymousID } from "@/lib/mockData";
import { useOmniStore } from "@/lib/omniStore";
import type { SocialPost, SocialReel } from "@/lib/omniStore";
import {
  Ghost,
  Grid3X3,
  Heart,
  MessageCircle,
  MoreHorizontal,
  Play,
  Share2,
  ShoppingBag,
  Star,
  Users,
  Video,
  Zap,
} from "lucide-react";
import type React from "react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

const STAR_INDICES = [0, 1, 2, 3, 4] as const;

// ─── Sub-components ──────────────────────────────────────────────────────────

function StatItem({
  value,
  label,
  onClick,
}: {
  value: string;
  label: string;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex flex-col items-center gap-0.5 px-3 py-1 rounded-xl transition-all"
      style={{ background: "transparent" }}
    >
      <span
        className="text-lg font-black"
        style={{ color: "#F0F4FF", letterSpacing: "-0.02em" }}
      >
        {value}
      </span>
      <span className="text-xs font-medium" style={{ color: "#4A5568" }}>
        {label}
      </span>
    </button>
  );
}

function GlassButton({
  children,
  onClick,
  primary,
  "data-ocid": dataOcid,
}: {
  children: React.ReactNode;
  onClick?: () => void;
  primary?: boolean;
  "data-ocid"?: string;
}) {
  return (
    <button
      type="button"
      data-ocid={dataOcid}
      onClick={onClick}
      className="flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold transition-all"
      style={{
        background: primary
          ? "linear-gradient(135deg, rgba(25,230,255,0.25) 0%, rgba(181,107,255,0.25) 100%)"
          : "rgba(255,255,255,0.06)",
        border: primary
          ? "1px solid rgba(25,230,255,0.4)"
          : "1px solid rgba(255,255,255,0.08)",
        color: primary ? "#19E6FF" : "#A7ACBE",
        boxShadow: primary ? "0 0 16px rgba(25,230,255,0.15)" : "none",
      }}
    >
      {children}
    </button>
  );
}

function PostGrid({
  onSelect,
}: {
  onSelect: (idx: number) => void;
}) {
  const { socialPosts, myId, addSocialPost, setActiveModule } = useOmniStore();
  const myPosts = socialPosts.filter((p) => p.authorId === (myId ?? ""));
  const [desc, setDesc] = useState("");

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    const resolvedId =
      myId ?? localStorage.getItem("omni-permanent-id") ?? "+777 0000 0000";
    addSocialPost({
      id: `p${Date.now()}`,
      authorId: resolvedId as AnonymousID,
      authorEmoji: "🔮",
      content: desc || "📷 Yeni fotoğraf",
      mood: "📷",
      privacy: "PUBLIC",
      likes: 0,
      comments: 0,
      shares: 0,
      time: "Şimdi",
      liked: false,
      mediaUrl: url,
      mediaType: "image",
    });
    setDesc("");
    e.target.value = "";
    toast.success("Fotoğraf paylaşıldı! 📷");
  };

  if (myPosts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-3">
        <span className="text-4xl">📷</span>
        <p className="text-sm font-semibold" style={{ color: "#19E6FF" }}>
          Henüz gönderi yok
        </p>
        <p className="text-xs" style={{ color: "#4A5568" }}>
          İlk fotoğrafını paylaş
        </p>
        <input
          type="text"
          placeholder="Açıklama yaz..."
          value={desc}
          onChange={(e) => setDesc(e.target.value)}
          className="w-48 px-3 py-2 rounded-xl text-xs outline-none"
          style={{
            background: "rgba(25,230,255,0.08)",
            color: "#fff",
            border: "1px solid rgba(25,230,255,0.2)",
          }}
        />
        <label
          className="mt-2 px-5 py-2 rounded-xl text-xs font-bold cursor-pointer"
          style={{
            background:
              "linear-gradient(135deg, rgba(25,230,255,0.25), rgba(189,0,255,0.25))",
            color: "#19E6FF",
            border: "1px solid rgba(25,230,255,0.4)",
          }}
          data-ocid="profile.upload_button"
        >
          <input
            type="file"
            accept="image/*"
            hidden
            onChange={handleImageUpload}
          />
          📷 Fotoğraf Ekle
        </label>
        <button
          type="button"
          onClick={() => setActiveModule("social")}
          className="px-5 py-2 rounded-xl text-xs font-bold"
          style={{
            background: "rgba(25,230,255,0.08)",
            color: "#888",
            border: "1px solid rgba(255,255,255,0.1)",
          }}
          data-ocid="profile.post.button"
        >
          Sosyal Feed&apos;e Git
        </button>
      </div>
    );
  }
  return (
    <div className="grid grid-cols-3 gap-0.5 px-0.5">
      {/* Upload button as first grid item */}
      <label
        className="relative aspect-square overflow-hidden flex flex-col items-center justify-center cursor-pointer"
        style={{
          borderRadius: "4px",
          background: "rgba(25,230,255,0.08)",
          border: "1px dashed rgba(25,230,255,0.3)",
        }}
        data-ocid="profile.upload_button"
      >
        <input
          type="file"
          accept="image/*"
          hidden
          onChange={handleImageUpload}
        />
        <span className="text-xl">📷</span>
        <span className="text-[9px] mt-1" style={{ color: "#19E6FF" }}>
          Ekle
        </span>
      </label>
      {myPosts.map((post, idx) => (
        <button
          key={post.id}
          type="button"
          data-ocid={`profile.item.${idx + 1}`}
          onClick={() => onSelect(idx)}
          className="relative aspect-square overflow-hidden"
          style={{ borderRadius: "4px" }}
        >
          {post.mediaUrl ? (
            post.mediaType === "video" ? (
              <video
                src={post.mediaUrl}
                className="w-full h-full object-cover"
                muted
              />
            ) : (
              <img
                src={post.mediaUrl}
                alt="post"
                className="w-full h-full object-cover"
              />
            )
          ) : (
            <div
              className="w-full h-full flex items-center justify-center text-2xl"
              style={{ background: "#1E2436" }}
            >
              {post.mood || "🔮"}
            </div>
          )}
          {post.mediaType === "video" && (
            <div
              className="absolute inset-0 flex items-center justify-center"
              style={{ background: "rgba(0,0,0,0.2)" }}
            >
              <Play size={20} style={{ color: "white" }} fill="white" />
            </div>
          )}
          <div
            className="absolute bottom-1 left-1 flex items-center gap-0.5"
            style={{ color: "rgba(255,255,255,0.85)" }}
          >
            <Heart size={9} fill="white" />
            <span className="text-[9px] font-semibold">{post.likes}</span>
          </div>
        </button>
      ))}
    </div>
  );
}

function ReelsView() {
  const { socialReels, myId, setActiveModule, addSocialReel } = useOmniStore();
  const myReels = socialReels.filter((r) => r.authorId === (myId ?? ""));
  const [liked, setLiked] = useState<Record<string, boolean>>({});
  const [currentReel, setCurrentReel] = useState(0);
  const reel = myReels[currentReel];

  const [reelDesc, setReelDesc] = useState("");

  const handleVideoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    const resolvedId =
      myId ?? localStorage.getItem("omni-permanent-id") ?? "+777 0000 0000";
    const newReel: SocialReel = {
      id: `r${Date.now()}`,
      authorId: resolvedId as AnonymousID,
      authorEmoji: "🔮",
      description: reelDesc || "🎬 Yeni video",
      mood: "🎬",
      gradient: `url(${url})`,
      likes: 0,
      comments: 0,
      views: 0,
      liked: false,
    };
    addSocialReel(newReel);
    setReelDesc("");
    e.target.value = "";
    toast.success("Video paylaşıldı! 🎬");
  };

  if (myReels.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-3">
        <span className="text-4xl">🎬</span>
        <p className="text-sm font-semibold" style={{ color: "#19E6FF" }}>
          Henüz video yok
        </p>
        <p className="text-xs text-center" style={{ color: "#4A5568" }}>
          İlk videonu paylaş ve keşfedilmeye başla
        </p>
        <input
          type="text"
          placeholder="Video açıklaması..."
          value={reelDesc}
          onChange={(e) => setReelDesc(e.target.value)}
          className="w-48 px-3 py-2 rounded-xl text-xs outline-none"
          style={{
            background: "rgba(189,0,255,0.08)",
            color: "#fff",
            border: "1px solid rgba(189,0,255,0.2)",
          }}
        />
        <label
          className="mt-2 px-5 py-2 rounded-xl text-xs font-bold cursor-pointer"
          style={{
            background:
              "linear-gradient(135deg, rgba(189,0,255,0.25), rgba(25,230,255,0.25))",
            color: "#BD00FF",
            border: "1px solid rgba(189,0,255,0.4)",
          }}
          data-ocid="profile.upload_button"
        >
          <input
            type="file"
            accept="video/*"
            hidden
            onChange={handleVideoUpload}
          />
          🎬 Video Ekle
        </label>
        <button
          type="button"
          onClick={() => setActiveModule("social")}
          className="px-5 py-2 rounded-xl text-xs font-bold"
          style={{
            background: "rgba(25,230,255,0.08)",
            color: "#888",
            border: "1px solid rgba(255,255,255,0.1)",
          }}
          data-ocid="profile.video.button"
        >
          Sosyal Feed&apos;e Git
        </button>
      </div>
    );
  }

  return (
    <div
      className="relative mx-2 rounded-2xl overflow-hidden"
      style={{
        height: "420px",
        background: reel.gradient,
        border: "1px solid rgba(25,230,255,0.1)",
      }}
    >
      {/* Play area */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div
          className="w-16 h-16 rounded-full flex items-center justify-center"
          style={{
            background: "rgba(255,255,255,0.12)",
            border: "2px solid rgba(255,255,255,0.3)",
          }}
        >
          <Play size={28} style={{ color: "white" }} fill="white" />
        </div>
      </div>

      {/* Bottom info overlay */}
      <div
        className="absolute bottom-0 left-0 right-12 p-4"
        style={{
          background: "linear-gradient(transparent, rgba(6,7,11,0.9))",
        }}
      >
        <p className="text-xs font-semibold mb-1" style={{ color: "#19E6FF" }}>
          {reel.authorId}
        </p>
        <p className="text-sm font-medium text-white mb-1 leading-snug">
          {reel.description}
        </p>
        <div className="flex items-center gap-3">
          <span
            className="text-xs px-2 py-0.5 rounded-full"
            style={{
              background: "rgba(255,255,255,0.1)",
              color: "#A7ACBE",
            }}
          >
            {reel.mood}
          </span>
          <span className="text-xs" style={{ color: "rgba(255,255,255,0.5)" }}>
            📍 {reel.location}
          </span>
        </div>
      </div>

      {/* Right actions */}
      <div className="absolute right-2 bottom-16 flex flex-col gap-4 items-center">
        <button
          type="button"
          data-ocid="profile.toggle"
          onClick={() =>
            setLiked((prev) => ({ ...prev, [reel.id]: !prev[reel.id] }))
          }
          className="flex flex-col items-center gap-0.5"
        >
          <Heart
            size={22}
            fill={liked[reel.id] ? "#FF4F6E" : "transparent"}
            style={{ color: liked[reel.id] ? "#FF4F6E" : "white" }}
          />
          <span className="text-[10px] text-white">{reel.likes}</span>
        </button>
        <button type="button" className="flex flex-col items-center gap-0.5">
          <MessageCircle size={22} style={{ color: "white" }} />
          <span className="text-[10px] text-white">{reel.comments}</span>
        </button>
        <button type="button" className="flex flex-col items-center gap-0.5">
          <Share2 size={22} style={{ color: "white" }} />
          <span className="text-[10px] text-white">Paylaş</span>
        </button>
        <button type="button" className="flex flex-col items-center gap-0.5">
          <Zap size={22} style={{ color: "#19E6FF" }} />
          <span className="text-[10px]" style={{ color: "#19E6FF" }}>
            Token
          </span>
        </button>
      </div>

      {/* Reel pagination */}
      <div className="absolute top-3 left-0 right-0 flex justify-center gap-1.5">
        {myReels.map((r, i) => (
          <button
            key={r.id}
            type="button"
            onClick={() => setCurrentReel(i)}
            className="h-0.5 rounded-full transition-all"
            style={{
              width: i === currentReel ? "20px" : "8px",
              background:
                i === currentReel ? "#19E6FF" : "rgba(255,255,255,0.3)",
            }}
          />
        ))}
      </div>
    </div>
  );
}

function MarketList() {
  const { listings, setActiveModule } = useOmniStore();

  if (listings.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-3">
        <span className="text-4xl">🏷️</span>
        <p className="text-sm font-semibold" style={{ color: "#19E6FF" }}>
          Henüz ürün yok
        </p>
        <p className="text-xs" style={{ color: "#4A5568" }}>
          Market'te ilk ürününü listele
        </p>
        <button
          type="button"
          onClick={() => setActiveModule("market")}
          className="mt-2 px-5 py-2 rounded-xl text-xs font-bold"
          style={{
            background: "rgba(25,230,255,0.15)",
            color: "#19E6FF",
            border: "1px solid rgba(25,230,255,0.3)",
          }}
          data-ocid="profile.market.button"
        >
          Ürün Ekle
        </button>
      </div>
    );
  }

  return (
    <div className="px-2 flex flex-col gap-3">
      {listings.map((item, idx) => (
        <div
          key={item.id}
          data-ocid={`profile.item.${idx + 1}`}
          className="rounded-2xl overflow-hidden p-4"
          style={{
            background: "#151A26",
            border: "1px solid #2A3142",
          }}
        >
          <div className="flex items-start justify-between mb-2">
            <div>
              <span
                className="text-xs px-2 py-0.5 rounded-full font-bold"
                style={{
                  background: "rgba(25,230,255,0.1)",
                  color: "#19E6FF",
                  border: "1px solid rgba(25,230,255,0.2)",
                }}
              >
                {item.category}
              </span>
              <p
                className="text-base font-bold mt-1.5"
                style={{ color: "#F0F4FF" }}
              >
                {item.title}
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm font-bold" style={{ color: "#19E6FF" }}>
                {item.price.toLocaleString()}
              </p>
              <p className="text-xs" style={{ color: "#4A5568" }}>
                OMNI
              </p>
            </div>
          </div>
          <p className="text-xs mb-3" style={{ color: "#A7ACBE" }}>
            {item.description}
          </p>
          <div className="flex items-center gap-2">
            <span
              className="text-[10px] px-2 py-0.5 rounded-full"
              style={{
                background:
                  item.status === "active"
                    ? "rgba(34,197,94,0.1)"
                    : "rgba(255,255,255,0.05)",
                color: item.status === "active" ? "#22C55E" : "#4A5568",
                border: `1px solid ${item.status === "active" ? "rgba(34,197,94,0.2)" : "rgba(255,255,255,0.08)"}`,
              }}
            >
              {item.status === "active" ? "Aktif" : "Pasif"}
            </span>
            <span className="text-[10px]" style={{ color: "#4A5568" }}>
              ❤️ {item.likes}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}

function RidesList() {
  const { rideHistory } = useOmniStore();

  if (rideHistory.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-3">
        <span className="text-4xl">🚗</span>
        <p className="text-sm font-semibold" style={{ color: "#19E6FF" }}>
          Henüz sürüş yok
        </p>
        <p className="text-xs" style={{ color: "#4A5568" }}>
          İlk sürüşünden sonra burada görünecek
        </p>
      </div>
    );
  }

  return (
    <div className="px-2 flex flex-col gap-3">
      {rideHistory.map((ride, idx) => (
        <div
          key={ride.id}
          data-ocid={`profile.item.${idx + 1}`}
          className="rounded-2xl p-4"
          style={{
            background: "rgba(255,255,255,0.04)",
            border: "1px solid rgba(255,255,255,0.07)",
          }}
        >
          <div className="flex items-start justify-between mb-3">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <div
                  className="w-2 h-2 rounded-full"
                  style={{ background: "#19E6FF" }}
                />
                <span
                  className="text-xs font-medium"
                  style={{ color: "#F0F4FF" }}
                >
                  {ride.origin}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <div
                  className="w-2 h-2 rounded-full"
                  style={{ background: "#B56BFF" }}
                />
                <span
                  className="text-xs font-medium"
                  style={{ color: "#F0F4FF" }}
                >
                  {ride.destination}
                </span>
              </div>
            </div>
            <div className="text-right">
              <p className="text-base font-black" style={{ color: "#19E6FF" }}>
                ₺{ride.price.toFixed(0)}
              </p>
              <div className="flex items-center justify-end gap-0.5">
                {STAR_INDICES.map((i) => (
                  <Star
                    key={`star-${i}`}
                    size={9}
                    fill={i < ride.passengerRating ? "#FFB347" : "transparent"}
                    style={{
                      color: i < ride.passengerRating ? "#FFB347" : "#2D3748",
                    }}
                  />
                ))}
              </div>
            </div>
          </div>
          <div
            className="flex items-center gap-3 text-[10px]"
            style={{ color: "#4A5568" }}
          >
            <span>
              📅 {new Date(ride.completedAt).toLocaleDateString("tr-TR")}
            </span>
            <span>⏱ {ride.durationMinutes} dk</span>
            <span>📍 {ride.distanceKm} km</span>
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Post Viewer Modal ────────────────────────────────────────────────────────

function PostViewer({
  index,
  onClose,
}: {
  index: number;
  onClose: () => void;
}) {
  const { socialPosts, myId } = useOmniStore();
  const myPosts = socialPosts.filter((p) => p.authorId === (myId ?? ""));
  const [current, setCurrent] = useState(index);
  const post = myPosts[current];

  if (!post) return null;

  return (
    <div
      data-ocid="profile.modal"
      className="fixed inset-0 z-[100] flex flex-col"
      style={{ background: "rgba(0,0,0,0.95)" }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3">
        <button
          type="button"
          data-ocid="profile.close_button"
          onClick={onClose}
          className="text-white"
        >
          ✕
        </button>
        <span className="text-xs" style={{ color: "#4A5568" }}>
          {current + 1} / {myPosts.length}
        </span>
        <button type="button">
          <MoreHorizontal size={20} style={{ color: "#A7ACBE" }} />
        </button>
      </div>

      {/* Image */}
      <div className="flex-1 flex items-center">
        <div className="w-full" style={{ aspectRatio: "1" }}>
          {post.mediaUrl ? (
            post.mediaType === "video" ? (
              <video
                src={post.mediaUrl}
                className="w-full h-full object-cover"
                controls
              >
                <track kind="captions" />
              </video>
            ) : (
              <img
                src={post.mediaUrl}
                alt="post"
                className="w-full h-full object-cover"
              />
            )
          ) : (
            <div
              className="w-full h-full flex items-center justify-center text-6xl"
              style={{ background: "#1E2436" }}
            >
              {post.mood || "🔮"}
            </div>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="px-4 py-4">
        <div className="flex items-center gap-5 mb-3">
          <Heart size={24} style={{ color: "white" }} />
          <MessageCircle size={24} style={{ color: "white" }} />
          <Share2 size={24} style={{ color: "white" }} />
        </div>
        <p className="text-sm font-semibold text-white mb-0.5">
          {post.likes} beğeni
        </p>
        <p className="text-sm text-white">{post.content}</p>
      </div>

      {/* Prev / Next */}
      <div className="flex justify-between px-4 pb-6">
        <button
          type="button"
          data-ocid="profile.pagination_prev"
          disabled={current === 0}
          onClick={() => setCurrent((c) => Math.max(0, c - 1))}
          className="px-6 py-2 rounded-xl text-sm font-semibold disabled:opacity-30"
          style={{
            background: "rgba(255,255,255,0.08)",
            color: "white",
          }}
        >
          ‹ Önceki
        </button>
        <button
          type="button"
          data-ocid="profile.pagination_next"
          disabled={current === myPosts.length - 1}
          onClick={() => setCurrent((c) => Math.min(myPosts.length - 1, c + 1))}
          className="px-6 py-2 rounded-xl text-sm font-semibold disabled:opacity-30"
          style={{
            background: "rgba(255,255,255,0.08)",
            color: "white",
          }}
        >
          Sonraki ›
        </button>
      </div>
    </div>
  );
}

// ─── Profile Sub-Section Panel ────────────────────────────────────────────────

type SubSection = "friends" | "match" | "identity" | "settings" | null;

function SubSectionPanel({
  section,
  onClose,
  myId,
}: {
  section: SubSection;
  onClose: () => void;
  myId: string;
}) {
  if (!section) return null;

  const titles: Record<NonNullable<SubSection>, string> = {
    friends: "👥 Arkadaşlar",
    match: "🔥 Eşleşmeler",
    identity: "🛡️ Kimlik",
    settings: "⚙️ Ayarlar",
  };

  const content: Record<NonNullable<SubSection>, React.ReactNode> = {
    friends: (
      <div className="flex flex-col gap-2">
        {["+777 9921 3304", "+777 5540 8812", "+777 2287 6631"].map((id, i) => (
          <div
            key={id}
            className="flex items-center gap-3 p-3 rounded-xl"
            style={{ background: "rgba(255,255,255,0.04)" }}
          >
            <div
              className="w-9 h-9 rounded-full flex items-center justify-center text-base"
              style={{ background: "rgba(25,230,255,0.1)" }}
            >
              {["🌙", "⚡", "🌊"][i]}
            </div>
            <span className="text-sm font-mono" style={{ color: "#19E6FF" }}>
              {id}
            </span>
            <span
              className="ml-auto text-xs px-2 py-0.5 rounded-full"
              style={{
                background: "rgba(25,230,255,0.1)",
                color: "#19E6FF",
              }}
            >
              Online
            </span>
          </div>
        ))}
      </div>
    ),
    match: (
      <div className="flex flex-col gap-2">
        {[
          { id: "+777 2847 3901", emoji: "🌙", mood: "Mistik" },
          { id: "+777 5519 6628", emoji: "⚡", mood: "Enerjik" },
        ].map((m, i) => (
          <div
            key={m.id}
            className="flex items-center gap-3 p-3 rounded-xl"
            style={{
              background:
                "linear-gradient(135deg, rgba(181,107,255,0.08), rgba(25,230,255,0.05))",
              border: "1px solid rgba(181,107,255,0.15)",
            }}
          >
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center text-lg"
              style={{ background: "rgba(181,107,255,0.15)" }}
            >
              {m.emoji}
            </div>
            <div>
              <p className="text-xs font-mono" style={{ color: "#A7ACBE" }}>
                {m.id}
              </p>
              <p className="text-xs" style={{ color: "#B56BFF" }}>
                {m.mood}
              </p>
            </div>
            <button
              type="button"
              data-ocid={`profile.secondary_button.${i + 1}`}
              className="ml-auto text-xs px-3 py-1.5 rounded-lg font-semibold"
              style={{
                background: "rgba(181,107,255,0.15)",
                color: "#B56BFF",
                border: "1px solid rgba(181,107,255,0.3)",
              }}
            >
              Mesaj
            </button>
          </div>
        ))}
      </div>
    ),
    identity: (
      <div className="flex flex-col gap-3">
        <div
          className="p-4 rounded-2xl"
          style={{
            background:
              "linear-gradient(135deg, rgba(25,230,255,0.08), rgba(181,107,255,0.08))",
            border: "1px solid rgba(25,230,255,0.2)",
          }}
        >
          <p className="text-xs" style={{ color: "#4A5568" }}>
            Aktif Kimlik
          </p>
          <p
            className="text-lg font-black font-mono mt-1"
            style={{ color: "#19E6FF" }}
          >
            {myId}
          </p>
          <div
            className="mt-2 flex items-center gap-2 text-xs"
            style={{ color: "#A7ACBE" }}
          >
            <span
              className="px-2 py-0.5 rounded-full"
              style={{
                background: "rgba(25,230,255,0.1)",
                color: "#19E6FF",
              }}
            >
              ✓ Kalıcı
            </span>
            <span>ICP Bağlı</span>
          </div>
        </div>
        <p className="text-xs text-center" style={{ color: "#4A5568" }}>
          Kimlik Hub'a git → Kimlik sekmesini aç
        </p>
      </div>
    ),
    settings: (
      <div className="flex flex-col gap-2">
        {[
          "🔔 Bildirimler",
          "🎨 Görünüm",
          "🔒 Gizlilik",
          "💎 Premium",
          "❓ Yardım",
          "🚪 Çıkış",
        ].map((item, i) => (
          <button
            key={item}
            type="button"
            data-ocid={`profile.secondary_button.${i + 1}`}
            className="flex items-center gap-3 p-3 rounded-xl text-left w-full transition-all"
            style={{
              background: "rgba(255,255,255,0.04)",
              color: "#F0F4FF",
            }}
          >
            <span className="text-sm">{item}</span>
          </button>
        ))}
      </div>
    ),
  };

  return (
    <div
      data-ocid="profile.sheet"
      className="fixed inset-x-0 bottom-0 z-[90] rounded-t-3xl"
      style={{
        background: "rgba(10,11,20,0.98)",
        backdropFilter: "blur(24px)",
        border: "1px solid rgba(25,230,255,0.12)",
        paddingBottom: "env(safe-area-inset-bottom)",
        maxHeight: "70vh",
        overflow: "auto",
      }}
    >
      <div className="flex items-center justify-between px-4 pt-4 pb-3">
        <h3 className="text-sm font-bold text-white">{titles[section]}</h3>
        <button
          type="button"
          data-ocid="profile.close_button"
          onClick={onClose}
          className="w-8 h-8 rounded-full flex items-center justify-center text-sm"
          style={{
            background: "rgba(255,255,255,0.08)",
            color: "#A7ACBE",
          }}
        >
          ✕
        </button>
      </div>
      <div className="px-4 pb-6">{content[section]}</div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function ProfileModule() {
  const {
    myId,
    displayName,
    tokenBalance,
    setActiveModule,
    userTrustScore,
    socialPosts,
    profileAvatarUrl,
    setProfileAvatarUrl,
    profileBio,
    setProfileBio,
    followers,
    following,
  } = useOmniStore();

  const [isAnonymous, setIsAnonymous] = useState(false);
  const [activeTab, setActiveTab] = useState<
    "posts" | "videos" | "market" | "rides"
  >("posts");
  const [viewerIndex, setViewerIndex] = useState<number | null>(null);
  const [subSection, setSubSection] = useState<SubSection>(null);
  const [editingBio, setEditingBio] = useState(false);

  const { actor } = useActor();
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    if (!actor) return;
    actor
      .isCallerAdmin()
      .then(setIsAdmin)
      .catch(() => {});
  }, [actor]);

  const profileId =
    myId ?? localStorage.getItem("omni-permanent-id") ?? "+777 0000 0000";
  const name = displayName !== "Anonymous" ? displayName : null;
  const trustDisplay = ((userTrustScore ?? 80) / 20).toFixed(1);
  const myPostCount = socialPosts.filter(
    (p) => p.authorId === (myId ?? ""),
  ).length;

  const handleAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setProfileAvatarUrl(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const TABS = [
    { id: "posts" as const, label: "Gönderiler", icon: Grid3X3 },
    { id: "videos" as const, label: "Videolar", icon: Video },
    { id: "market" as const, label: "Market", icon: ShoppingBag },
    { id: "rides" as const, label: "Sürüşler", icon: Star },
  ];

  return (
    <div
      data-ocid="profile.page"
      className="h-full overflow-y-auto"
      style={{
        background: "linear-gradient(180deg, #06070B 0%, #09091A 100%)",
      }}
    >
      {/* ── Header ── */}
      <div
        className="relative px-4 pt-4 pb-0"
        style={{
          background:
            "linear-gradient(180deg, rgba(25,230,255,0.03) 0%, transparent 100%)",
        }}
      >
        {/* Top actions */}
        <div className="flex items-center justify-between mb-4">
          <button
            type="button"
            data-ocid="profile.toggle"
            onClick={() => setIsAnonymous((p) => !p)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl transition-all"
            style={{
              background: isAnonymous
                ? "rgba(181,107,255,0.15)"
                : "rgba(255,255,255,0.06)",
              border: isAnonymous
                ? "1px solid rgba(181,107,255,0.4)"
                : "1px solid rgba(255,255,255,0.08)",
            }}
          >
            <Ghost
              size={13}
              style={{
                color: isAnonymous ? "#B56BFF" : "#4A5568",
              }}
            />
            <span
              className="text-xs font-semibold"
              style={{
                color: isAnonymous ? "#B56BFF" : "#4A5568",
              }}
            >
              {isAnonymous ? "Anonim" : "Görünür"}
            </span>
          </button>

          <button type="button">
            <MoreHorizontal size={20} style={{ color: "#4A5568" }} />
          </button>
        </div>

        {/* Avatar + ID row */}
        <div className="flex items-start gap-4 mb-4">
          {/* Avatar */}
          <div className="relative shrink-0">
            <div
              className="w-20 h-20 rounded-full flex items-center justify-center text-3xl"
              style={{
                background: "linear-gradient(135deg, #06070B 0%, #0B1020 100%)",
                boxShadow:
                  "0 0 0 2px rgba(6,7,11,1), 0 0 0 4px transparent, 0 0 24px rgba(25,230,255,0.4)",
                border: "2px solid transparent",
                backgroundClip: "padding-box",
              }}
            >
              <div
                className="absolute inset-0 rounded-full"
                style={{
                  background: "linear-gradient(135deg, #19E6FF, #B56BFF)",
                  padding: "2px",
                  zIndex: -1,
                  margin: "-2px",
                }}
              />
              {profileAvatarUrl ? (
                <img
                  src={profileAvatarUrl}
                  alt="avatar"
                  className="w-full h-full rounded-full object-cover"
                />
              ) : (
                <>🌟</>
              )}
            </div>
            {/* Online dot */}
            <div
              className="absolute bottom-1 right-1 w-3.5 h-3.5 rounded-full"
              style={{
                background: "#22C55E",
                border: "2px solid #06070B",
                boxShadow: "0 0 6px #22C55E",
              }}
            />
            {/* Camera upload button */}
            <label
              htmlFor="avatar-upload"
              className="absolute top-0 right-0 w-6 h-6 rounded-full flex items-center justify-center cursor-pointer"
              style={{
                background: "rgba(25,230,255,0.8)",
                border: "1.5px solid #06070B",
              }}
            >
              <span style={{ fontSize: 10 }}>📷</span>
            </label>
            <input
              type="file"
              accept="image/*"
              id="avatar-upload"
              className="hidden"
              onChange={handleAvatarUpload}
            />
          </div>

          {/* Name / ID / Bio */}
          <div className="flex-1 min-w-0">
            {!isAnonymous && name && (
              <p className="text-base font-bold text-white truncate mb-0.5">
                {name}
              </p>
            )}
            <p
              className="text-sm font-mono font-bold"
              style={{ color: "#19E6FF" }}
            >
              {profileId}
            </p>
            {isAnonymous ? (
              <p
                className="text-xs mt-1 leading-snug"
                style={{ color: "#A7ACBE" }}
              >
                Anonim modda gizleniyor 👻
              </p>
            ) : editingBio ? (
              <input
                className="text-xs mt-1 w-full bg-transparent border-b outline-none"
                style={{ color: "#A7ACBE", borderColor: "#19E6FF44" }}
                value={profileBio}
                placeholder="Bio ekle..."
                onChange={(e) => setProfileBio(e.target.value)}
                onBlur={() => setEditingBio(false)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") setEditingBio(false);
                }}
              />
            ) : (
              <button
                type="button"
                className="text-xs mt-1 leading-snug text-left w-full"
                style={{ color: profileBio ? "#A7ACBE" : "#4A5568" }}
                onClick={() => setEditingBio(true)}
              >
                {profileBio || "Bio ekle... ✏️"}
              </button>
            )}

            {/* Badges */}
            <div className="flex items-center gap-2 mt-2">
              <span
                className="text-[10px] px-2 py-0.5 rounded-full font-semibold"
                style={{
                  background: "rgba(25,230,255,0.1)",
                  color: "#19E6FF",
                  border: "1px solid rgba(25,230,255,0.2)",
                }}
              >
                ✓ Güven {trustDisplay}
              </span>
              <span
                className="text-[10px] px-2 py-0.5 rounded-full font-semibold"
                style={{
                  background: "rgba(34,197,94,0.1)",
                  color: "#22C55E",
                  border: "1px solid rgba(34,197,94,0.2)",
                }}
              >
                ● Online
              </span>
              <span
                className="text-[10px] px-2 py-0.5 rounded-full font-semibold"
                style={{
                  background: "rgba(181,107,255,0.1)",
                  color: "#B56BFF",
                  border: "1px solid rgba(181,107,255,0.2)",
                }}
              >
                💎 {tokenBalance} OMNI
              </span>
            </div>
          </div>
        </div>

        {/* Stats row */}
        <div
          className="flex items-center justify-around py-3 mb-3 rounded-2xl"
          style={{
            background: "rgba(255,255,255,0.03)",
            border: "1px solid rgba(255,255,255,0.06)",
          }}
        >
          <StatItem value={String(myPostCount)} label="Gönderi" />
          <div
            className="w-px h-8"
            style={{ background: "rgba(255,255,255,0.06)" }}
          />
          <StatItem value={String(followers)} label="Takipçi" />
          <div
            className="w-px h-8"
            style={{ background: "rgba(255,255,255,0.06)" }}
          />
          <StatItem value={String(following)} label="Takip" />
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-2 mb-3">
          <GlassButton
            primary
            data-ocid="profile.primary_button"
            onClick={() => {}}
          >
            <Users size={12} />
            Takip Et
          </GlassButton>
          <GlassButton
            data-ocid="profile.secondary_button"
            onClick={() => setActiveModule("chat")}
          >
            <MessageCircle size={12} />
            Mesaj
          </GlassButton>
          <GlassButton
            data-ocid="profile.secondary_button"
            onClick={() => setActiveModule("wallet")}
          >
            <Zap size={12} />
            Token
          </GlassButton>
          <GlassButton
            data-ocid="profile.secondary_button"
            onClick={() => setActiveModule("ride")}
          >
            🚗 Ride
          </GlassButton>
        </div>

        {/* Sub-section shortcuts */}
        <div className="flex items-center gap-2 pb-3">
          {[
            { id: "friends" as const, emoji: "👥", label: "Arkadaşlar" },
            { id: "match" as const, emoji: "🔥", label: "Eşleşme" },
            { id: "identity" as const, emoji: "🛡️", label: "Kimlik" },
            { id: "settings" as const, emoji: "⚙️", label: "Ayarlar" },
          ].map((item, idx) => (
            <button
              key={item.id}
              type="button"
              data-ocid={`profile.secondary_button.${idx + 1}`}
              onClick={() => setSubSection(item.id)}
              className="flex flex-col items-center gap-0.5 flex-1 py-2 rounded-xl transition-all"
              style={{
                background:
                  subSection === item.id
                    ? "rgba(25,230,255,0.08)"
                    : "rgba(255,255,255,0.04)",
                border:
                  subSection === item.id
                    ? "1px solid rgba(25,230,255,0.2)"
                    : "1px solid rgba(255,255,255,0.06)",
              }}
            >
              <span className="text-base">{item.emoji}</span>
              <span
                className="text-[9px] font-medium"
                style={{
                  color: subSection === item.id ? "#19E6FF" : "#4A5568",
                }}
              >
                {item.label}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* ── Tabs ── */}
      <div
        className="sticky top-0 z-10 flex items-center gap-0 px-0"
        style={{
          background: "rgba(6,7,11,0.95)",
          backdropFilter: "blur(16px)",
          borderBottom: "1px solid rgba(255,255,255,0.05)",
        }}
      >
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              data-ocid={`profile.${tab.id}.tab`}
              onClick={() => setActiveTab(tab.id)}
              className="flex flex-col items-center gap-1 flex-1 py-3 relative transition-all"
            >
              <Icon
                size={16}
                style={{
                  color: isActive ? "#19E6FF" : "#4A5568",
                  filter: isActive
                    ? "drop-shadow(0 0 6px rgba(25,230,255,0.6))"
                    : "none",
                }}
              />
              <span
                className="text-[9px] font-semibold tracking-wide"
                style={{ color: isActive ? "#19E6FF" : "#4A5568" }}
              >
                {tab.label.toUpperCase()}
              </span>
              {isActive && (
                <div
                  className="absolute bottom-0 left-1/2 -translate-x-1/2 h-0.5 rounded-full"
                  style={{
                    width: "32px",
                    background: "linear-gradient(90deg, #19E6FF, #B56BFF)",
                    boxShadow: "0 0 8px #19E6FF",
                  }}
                />
              )}
            </button>
          );
        })}
      </div>

      {/* ── Tab Content ── */}
      <div className="pt-3 pb-24">
        {activeTab === "posts" && (
          <PostGrid onSelect={(idx) => setViewerIndex(idx)} />
        )}
        {activeTab === "videos" && <ReelsView />}
        {activeTab === "market" && <MarketList />}
        {activeTab === "rides" && <RidesList />}
      </div>

      {/* ── Post Viewer Modal ── */}
      {viewerIndex !== null && (
        <PostViewer index={viewerIndex} onClose={() => setViewerIndex(null)} />
      )}

      {/* ── Admin Panel ── */}
      {isAdmin && (
        <div
          className="mx-4 mb-4 rounded-2xl p-4 space-y-3"
          style={{ background: "#1A0D07", border: "1px solid #FF6B3544" }}
          data-ocid="profile.admin.panel"
        >
          <div className="flex items-center gap-2 mb-2">
            <span style={{ color: "#FF6B35", fontSize: 16 }}>🔐</span>
            <span
              className="text-sm font-black tracking-widest"
              style={{ color: "#FF6B35" }}
            >
              ADMIN PANEL
            </span>
          </div>
          <div className="grid grid-cols-3 gap-2">
            {[
              { label: "Kullanıcılar", value: "1,247" },
              { label: "Aktif Oturum", value: "89" },
              { label: "Bekleyen Rapor", value: "3" },
            ].map((stat) => (
              <div
                key={stat.label}
                className="rounded-xl p-2 text-center"
                style={{
                  background: "#FF6B3510",
                  border: "1px solid #FF6B3522",
                }}
              >
                <p className="text-sm font-black" style={{ color: "#FF6B35" }}>
                  {stat.value}
                </p>
                <p className="text-[10px]" style={{ color: "#8A6A5A" }}>
                  {stat.label}
                </p>
              </div>
            ))}
          </div>
          <button
            type="button"
            onClick={() =>
              toast.info("Admin moderasyon arayüzü yakında açılacak")
            }
            className="w-full py-2.5 rounded-xl text-xs font-bold tracking-widest transition-all"
            style={{ background: "#FF6B35", color: "#06070B" }}
            data-ocid="profile.admin.moderation_button"
          >
            Moderasyon Merkezi
          </button>
        </div>
      )}

      {/* ── Sub-section Panel ── */}
      {subSection && (
        <>
          <button
            type="button"
            aria-label="Kapat"
            className="fixed inset-0 z-[85] cursor-default"
            style={{ background: "rgba(0,0,0,0.5)" }}
            onClick={() => setSubSection(null)}
          />
          <SubSectionPanel
            section={subSection}
            onClose={() => setSubSection(null)}
            myId={profileId}
          />
        </>
      )}
    </div>
  );
}
