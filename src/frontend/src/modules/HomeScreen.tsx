import { useOmniStore } from "@/lib/omniStore";
import {
  ArrowLeft,
  Car,
  ChevronUp,
  Circle,
  Fingerprint,
  Ghost,
  MapPin,
  MessageCircle,
  Moon,
  Navigation,
  Plus,
  Send,
  ShoppingBag,
  Sun,
  Wallet,
  X,
  Zap,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

// ─── Types ───────────────────────────────────────────────────────────────────
type DrawerTab = "ride" | "chat" | "wallet" | "market" | "id";
type FabState = "closed" | "open";

interface Toast {
  id: string;
  message: string;
  icon: string;
  color: string;
}

interface MapDot {
  id: string;
  x: number;
  y: number;
  dx: number;
  dy: number;
  emoji: string;
  type: "driver" | "user";
}

interface ChatMsg {
  id: string;
  from: "me" | "them";
  text: string;
  time: string;
}

interface InlineChat {
  convId: string;
  name: string;
  avatar: string;
  messages: ChatMsg[];
}

// ─── Constants ───────────────────────────────────────────────────────────────
const DRAWER_COLLAPSED = 0.35;
const DRAWER_EXPANDED = 0.85;

const MOCK_CHATS = [
  {
    id: "c1",
    name: "+777 3847 1920",
    avatar: "🌙",
    last: "Tamam, yoldayım!",
    unread: 2,
    time: "14:32",
  },
  {
    id: "c2",
    name: "+777 5519 6628",
    avatar: "⚡",
    last: "Token gönderdin mi?",
    unread: 0,
    time: "13:15",
  },
  {
    id: "c3",
    name: "+777 8834 1122",
    avatar: "🌊",
    last: "👍",
    unread: 1,
    time: "12:00",
  },
  {
    id: "c4",
    name: "+777 1107 4456",
    avatar: "🔥",
    last: "Sürüş nasıldı?",
    unread: 0,
    time: "11:44",
  },
  {
    id: "c5",
    name: "+777 7723 8890",
    avatar: "💫",
    last: "Görüşürüz!",
    unread: 3,
    time: "Dün",
  },
];

const MOCK_MARKET_ITEMS = [
  {
    id: "m1",
    emoji: "🎵",
    name: "Müzik Koleksiyonu",
    price: 120,
    seller: "+777 ****1920",
    badge: "NADİR",
  },
  {
    id: "m2",
    emoji: "🎨",
    name: "Dijital Sanat NFT",
    price: 350,
    seller: "+777 ****6628",
    badge: "EPİK",
  },
  {
    id: "m3",
    emoji: "📱",
    name: "Premium Uygulama",
    price: 80,
    seller: "+777 ****1122",
    badge: null,
  },
  {
    id: "m4",
    emoji: "🔑",
    name: "Özel Erişim Kodu",
    price: 200,
    seller: "+777 ****4456",
    badge: "NADİR",
  },
];

const MOCK_TRANSACTIONS = [
  {
    id: "t1",
    type: "earn",
    label: "Sürüş ödülü",
    amount: "+50",
    time: "Bugün 14:20",
    color: "#00e5cc",
  },
  {
    id: "t2",
    type: "spend",
    label: "Market alışveriş",
    amount: "-120",
    time: "Bugün 12:15",
    color: "#ff4f4f",
  },
  {
    id: "t3",
    type: "earn",
    label: "Arkadaş daveti",
    amount: "+100",
    time: "Dün 18:30",
    color: "#00e5cc",
  },
];

const QUICK_REPLIES = ["👍", "Yoldayım", "2 dk", "Tamam!", "Neredesin?"];

// ─── Helpers ─────────────────────────────────────────────────────────────────
function generateMapDots(): MapDot[] {
  const emojis = ["🚗", "🚙", "🚘", "👤", "⚡", "🌙", "🔥"];
  return Array.from({ length: 8 }, (_, i) => ({
    id: `dot-${i}`,
    x: 15 + Math.random() * 70,
    y: 10 + Math.random() * 80,
    dx: (Math.random() - 0.5) * 0.02,
    dy: (Math.random() - 0.5) * 0.02,
    emoji: emojis[i % emojis.length],
    type: i < 4 ? "driver" : "user",
  }));
}

// ─── Sub-components ──────────────────────────────────────────────────────────

function MapBackground({
  ghost,
  theme,
  activeRide,
}: {
  ghost: boolean;
  theme: "dark" | "light";
  activeRide: boolean;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const dotsRef = useRef<MapDot[]>(generateMapDots());
  const rafRef = useRef<number | null>(null);
  const carPosRef = useRef(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const resize = () => {
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
    };
    resize();
    window.addEventListener("resize", resize);

    const draw = () => {
      const w = canvas.width;
      const h = canvas.height;
      const isDark = theme === "dark";

      // Background
      ctx.fillStyle = isDark ? "#0a0d1a" : "#e8eef5";
      ctx.fillRect(0, 0, w, h);

      // Grid streets
      const gridColor = isDark
        ? "rgba(0,229,204,0.06)"
        : "rgba(0,100,150,0.08)";
      ctx.strokeStyle = gridColor;
      ctx.lineWidth = 1;
      const step = 40;
      for (let x = 0; x < w; x += step) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, h);
        ctx.stroke();
      }
      for (let y = 0; y < h; y += step) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(w, y);
        ctx.stroke();
      }

      // Main roads
      const roadColor = isDark
        ? "rgba(0,229,204,0.12)"
        : "rgba(0,100,150,0.15)";
      ctx.strokeStyle = roadColor;
      ctx.lineWidth = 2.5;
      for (const [x1, y1, x2, y2] of [
        [0.2, 0, 0.8, 1],
        [0, 0.45, 1, 0.55],
        [0.35, 0, 0.65, 1],
        [0, 0.2, 1, 0.75],
      ]) {
        ctx.beginPath();
        ctx.moveTo((x1 as number) * w, (y1 as number) * h);
        ctx.lineTo((x2 as number) * w, (y2 as number) * h);
        ctx.stroke();
      }

      // Active ride route
      if (activeRide) {
        carPosRef.current = (carPosRef.current + 0.003) % 1;
        const startX = 0.2 * w;
        const startY = 0.7 * h;
        const endX = 0.75 * w;
        const endY = 0.25 * h;
        // Dashed route line
        ctx.setLineDash([8, 6]);
        ctx.strokeStyle = isDark
          ? "rgba(0,229,204,0.5)"
          : "rgba(8,145,178,0.5)";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(startX, startY);
        ctx.lineTo(endX, endY);
        ctx.stroke();
        ctx.setLineDash([]);
        // Car emoji
        const carX = startX + (endX - startX) * carPosRef.current;
        const carY = startY + (endY - startY) * carPosRef.current;
        ctx.font = "20px sans-serif";
        ctx.fillText("🚗", carX - 10, carY + 8);
        // Destination pin
        ctx.fillStyle = isDark ? "#ff4f4f" : "#dc2626";
        ctx.beginPath();
        ctx.arc(endX, endY, 8, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = "white";
        ctx.font = "bold 10px sans-serif";
        ctx.textAlign = "center";
        ctx.fillText("B", endX, endY + 4);
        ctx.textAlign = "left";
      }

      // Move and draw nearby dots
      dotsRef.current = dotsRef.current.map((dot) => {
        let nx = dot.x + dot.dx;
        let ny = dot.y + dot.dy;
        let ndx = dot.dx;
        let ndy = dot.dy;
        if (nx < 5 || nx > 95) ndx = -ndx;
        if (ny < 5 || ny > 90) ndy = -ndy;
        return { ...dot, x: nx, y: ny, dx: ndx, dy: ndy };
      });

      for (const dot of dotsRef.current) {
        const px = (dot.x / 100) * w;
        const py = (dot.y / 100) * h;
        ctx.font = "14px sans-serif";
        ctx.fillText(dot.emoji, px - 7, py + 5);
      }

      // User location pin (center)
      const cx = w * 0.5;
      const cy = h * 0.6;
      // Ripple
      const rippleR = 20 + 10 * Math.sin(Date.now() / 600);
      const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, rippleR);
      grad.addColorStop(
        0,
        isDark ? "rgba(0,229,204,0.25)" : "rgba(8,145,178,0.25)",
      );
      grad.addColorStop(1, "rgba(0,229,204,0)");
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(cx, cy, rippleR, 0, Math.PI * 2);
      ctx.fill();
      // Dot
      ctx.fillStyle = isDark ? "#00e5cc" : "#0891b2";
      ctx.shadowColor = isDark ? "#00e5cc" : "#0891b2";
      ctx.shadowBlur = 12;
      ctx.beginPath();
      ctx.arc(cx, cy, 7, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;
      ctx.fillStyle = "white";
      ctx.beginPath();
      ctx.arc(cx, cy, 3, 0, Math.PI * 2);
      ctx.fill();

      // Ghost overlay
      if (ghost) {
        ctx.fillStyle = "rgba(0,0,0,0.55)";
        ctx.fillRect(0, 0, w, h);
      }

      rafRef.current = requestAnimationFrame(draw);
    };

    draw();
    return () => {
      window.removeEventListener("resize", resize);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [ghost, theme, activeRide]);

  return <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />;
}

function NotificationToast({
  toasts,
  onDismiss,
}: { toasts: Toast[]; onDismiss: (id: string) => void }) {
  return (
    <div
      className="absolute top-16 right-3 flex flex-col gap-2 z-50"
      style={{ maxWidth: "220px" }}
    >
      {toasts.map((t) => (
        <button
          key={t.id}
          onClick={() => onDismiss(t.id)}
          type="button"
          className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium cursor-pointer w-full text-left"
          style={{
            background: "rgba(12,12,24,0.92)",
            border: `1px solid ${t.color}44`,
            backdropFilter: "blur(12px)",
            color: "#f8fafc",
            animation: "slideInRight 0.3s ease-out",
          }}
        >
          <span>{t.icon}</span>
          <span>{t.message}</span>
        </button>
      ))}
    </div>
  );
}

function IDQuickPanel({
  id,
  privacyMode,
  tokenBalance,
  onClose,
  onPrivacyChange,
}: {
  id: string;
  privacyMode: string;
  tokenBalance: number;
  onClose: () => void;
  onPrivacyChange: (mode: "normal" | "ghost" | "shadow") => void;
}) {
  const modes = [
    { key: "normal" as const, label: "NORMAL", color: "#00e5cc" },
    { key: "ghost" as const, label: "GHOST", color: "#8b5cf6" },
    { key: "shadow" as const, label: "SHADOW", color: "#4a5568" },
  ];
  return (
    <div
      className="absolute top-12 left-3 z-50 p-4 rounded-2xl"
      style={{
        background: "rgba(12,12,24,0.96)",
        border: "1px solid rgba(0,229,204,0.2)",
        backdropFilter: "blur(20px)",
        width: "220px",
        boxShadow: "0 8px 32px rgba(0,0,0,0.5)",
      }}
    >
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-bold text-white">Kimlik</span>
        <button type="button" onClick={onClose}>
          <X size={14} style={{ color: "#4a5568" }} />
        </button>
      </div>
      <div className="text-center mb-3">
        <div className="text-2xl mb-1">🌟</div>
        <div
          className="text-xs font-mono font-bold"
          style={{ color: "#00e5cc" }}
        >
          {id}
        </div>
        <div className="text-[10px] mt-1" style={{ color: "#64748b" }}>
          KALICI · Rep: ⭐ 4.8
        </div>
      </div>
      <div className="flex items-center justify-center gap-1 mb-3">
        <span style={{ color: "#00e5cc" }} className="text-sm font-bold">
          {tokenBalance.toLocaleString()}
        </span>
        <span style={{ color: "#64748b" }} className="text-[10px]">
          OMNI
        </span>
      </div>
      <div className="flex gap-1 mb-3">
        {modes.map((m) => (
          <button
            key={m.key}
            type="button"
            data-ocid={`id_panel.${m.key}.button`}
            onClick={() => onPrivacyChange(m.key)}
            className="flex-1 py-1 rounded-lg text-[9px] font-bold transition-all"
            style={{
              background:
                privacyMode === m.key
                  ? `${m.color}22`
                  : "rgba(255,255,255,0.04)",
              border: `1px solid ${privacyMode === m.key ? m.color : "transparent"}`,
              color: privacyMode === m.key ? m.color : "#4a5568",
            }}
          >
            {m.label}
          </button>
        ))}
      </div>
      <button
        type="button"
        data-ocid="id_panel.switch.button"
        className="w-full py-2 rounded-lg text-[10px] font-bold"
        style={{
          background: "rgba(0,229,204,0.1)",
          color: "#00e5cc",
          border: "1px solid rgba(0,229,204,0.2)",
        }}
      >
        Kimlik Değiştir
      </button>
    </div>
  );
}

// ─── Panel Components ─────────────────────────────────────────────────────────

function RidePanel({
  isDark,
  onRideStart,
}: { isDark: boolean; onRideStart: () => void }) {
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const { activeRide, requestRide, cancelRide, nearbyDrivers } = useOmniStore();

  const handleRequest = () => {
    if (!from || !to) return;
    requestRide(from, to, {
      distanceKm: 4.2,
      estimatedMinutes: 12,
      baseFare: 40,
      trafficMultiplier: 1.15,
      surgeMultiplier: 1.0,
      fairPrice: 55,
      minPrice: 47,
      maxPrice: 63,
    });
    onRideStart();
  };

  const surf = isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.04)";
  const txt = isDark ? "#f8fafc" : "#0f172a";
  const muted = isDark ? "#64748b" : "#94a3b8";

  if (activeRide) {
    const stateLabels: Record<string, string> = {
      REQUESTED: "🔍 Sürücü aranıyor...",
      DRIVER_ASSIGNED: "✅ Sürücü atandı",
      DRIVER_ARRIVING: "🚗 Sürücü geliyor",
      TRIP_STARTED: "🟢 Sürüş başladı",
      TRIP_COMPLETED: "🏁 Tamamlandı",
      CANCELLED: "❌ İptal edildi",
    };
    return (
      <div className="space-y-3">
        <div
          className="p-3 rounded-xl"
          style={{
            background: "rgba(0,229,204,0.08)",
            border: "1px solid rgba(0,229,204,0.2)",
          }}
        >
          <div className="text-xs font-bold mb-1" style={{ color: "#00e5cc" }}>
            {stateLabels[activeRide.state] ?? activeRide.state}
          </div>
          <div
            className="flex justify-between text-[11px]"
            style={{ color: muted }}
          >
            <span>
              {activeRide.origin} → {activeRide.destination}
            </span>
            <span className="font-bold" style={{ color: txt }}>
              {activeRide.agreedPrice} ₺
            </span>
          </div>
        </div>
        <div
          className="flex items-center gap-3 p-3 rounded-xl"
          style={{ background: surf }}
        >
          <div className="text-2xl">{activeRide.driverEmoji}</div>
          <div className="flex-1">
            <div className="text-xs font-bold" style={{ color: txt }}>
              {activeRide.driverAnonymousId}
            </div>
            <div className="text-[10px]" style={{ color: muted }}>
              ⭐ {activeRide.driverRating} · {activeRide.driverVehicle}
            </div>
          </div>
          <button
            type="button"
            data-ocid="ride.chat.button"
            className="px-3 py-1.5 rounded-lg text-[10px] font-bold"
            style={{ background: "rgba(0,229,204,0.15)", color: "#00e5cc" }}
          >
            💬 Sohbet
          </button>
        </div>
        <button
          type="button"
          data-ocid="ride.cancel_button"
          onClick={cancelRide}
          className="w-full py-2.5 rounded-xl text-xs font-bold"
          style={{
            background: "rgba(255,79,79,0.15)",
            color: "#ff4f4f",
            border: "1px solid rgba(255,79,79,0.3)",
          }}
        >
          Sürüşü İptal Et
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="space-y-2">
        <div
          className="flex items-center gap-2 px-3 py-2.5 rounded-xl"
          style={{ background: surf }}
        >
          <div
            className="w-2 h-2 rounded-full"
            style={{ background: "#00e5cc" }}
          />
          <input
            className="flex-1 bg-transparent text-xs outline-none"
            placeholder="Nereden?"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
            style={{ color: txt }}
            data-ocid="ride.from.input"
          />
          <Navigation size={12} style={{ color: "#00e5cc" }} />
        </div>
        <div
          className="flex items-center gap-2 px-3 py-2.5 rounded-xl"
          style={{ background: surf }}
        >
          <div
            className="w-2 h-2 rounded-full"
            style={{ background: "#ff4f4f" }}
          />
          <input
            className="flex-1 bg-transparent text-xs outline-none"
            placeholder="Nereye?"
            value={to}
            onChange={(e) => setTo(e.target.value)}
            style={{ color: txt }}
            data-ocid="ride.to.input"
          />
          <MapPin size={12} style={{ color: "#ff4f4f" }} />
        </div>
      </div>

      {from && to && (
        <div className="p-3 rounded-xl" style={{ background: surf }}>
          <div className="flex justify-between items-center">
            <div>
              <div className="text-xs font-bold" style={{ color: txt }}>
                ≈ 47–63 ₺ · 12 dk · 4.2 km
              </div>
              <div className="text-[10px] mt-0.5" style={{ color: muted }}>
                AI fiyat tahmini · Normal trafik
              </div>
            </div>
            <div
              className="text-[10px] px-2 py-1 rounded-lg font-bold"
              style={{ background: "rgba(0,229,204,0.15)", color: "#00e5cc" }}
            >
              ADİL
            </div>
          </div>
        </div>
      )}

      <div className="flex items-center gap-1.5">
        <div
          className="w-2 h-2 rounded-full"
          style={{ background: "#00e5cc" }}
        />
        <span className="text-[11px]" style={{ color: muted }}>
          {nearbyDrivers.length} sürücü yakında
        </span>
        <div className="flex gap-1 ml-1">
          {nearbyDrivers.map((d) => (
            <span key={d.id} className="text-xs">
              {d.emoji}
            </span>
          ))}
        </div>
      </div>

      <button
        type="button"
        data-ocid="ride.confirm.primary_button"
        onClick={handleRequest}
        disabled={!from || !to}
        className="w-full py-3 rounded-xl text-sm font-bold transition-all"
        style={{
          background: from && to ? "#00e5cc" : "rgba(0,229,204,0.2)",
          color: from && to ? "#0a0a0f" : "#00e5cc",
        }}
      >
        Sürüş İste
      </button>
    </div>
  );
}

function ChatPanel({
  isDark,
  onOpenChat,
}: { isDark: boolean; onOpenChat: (chat: (typeof MOCK_CHATS)[0]) => void }) {
  const txt = isDark ? "#f8fafc" : "#0f172a";
  const muted = isDark ? "#64748b" : "#94a3b8";
  const surf = isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.03)";

  return (
    <div className="space-y-1">
      {MOCK_CHATS.map((chat, i) => (
        <button
          key={chat.id}
          type="button"
          data-ocid={`chat.item.${i + 1}`}
          onClick={() => onOpenChat(chat)}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all"
          style={{ background: surf }}
        >
          <div
            className="w-9 h-9 rounded-full flex items-center justify-center shrink-0 text-lg"
            style={{ background: "rgba(0,229,204,0.1)" }}
          >
            {chat.avatar}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex justify-between items-center">
              <span className="text-xs font-bold" style={{ color: txt }}>
                {chat.name}
              </span>
              <span className="text-[10px]" style={{ color: muted }}>
                {chat.time}
              </span>
            </div>
            <div className="text-[11px] truncate" style={{ color: muted }}>
              {chat.last}
            </div>
          </div>
          {chat.unread > 0 && (
            <div
              className="w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold shrink-0"
              style={{ background: "#00e5cc", color: "#0a0a0f" }}
            >
              {chat.unread}
            </div>
          )}
        </button>
      ))}
    </div>
  );
}

function WalletPanel({
  isDark,
  tokenBalance,
}: { isDark: boolean; tokenBalance: number }) {
  const [showReward, setShowReward] = useState(false);
  const txt = isDark ? "#f8fafc" : "#0f172a";
  const muted = isDark ? "#64748b" : "#94a3b8";
  const surf = isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.03)";

  useEffect(() => {
    const t = setTimeout(() => setShowReward(true), 1500);
    return () => clearTimeout(t);
  }, []);

  return (
    <div className="space-y-3">
      {showReward && (
        <div
          className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold"
          style={{
            background: "rgba(0,229,204,0.12)",
            border: "1px solid rgba(0,229,204,0.3)",
            color: "#00e5cc",
          }}
          data-ocid="wallet.reward.success_state"
        >
          🎁 +50 OMNI kazandın! Sürüş ödülü
          <button
            type="button"
            onClick={() => setShowReward(false)}
            className="ml-auto"
          >
            <X size={12} />
          </button>
        </div>
      )}

      <div className="text-center py-3">
        <div className="text-3xl font-black" style={{ color: txt }}>
          {tokenBalance.toLocaleString()}
          <span
            className="text-lg font-normal ml-2"
            style={{ color: "#00e5cc" }}
          >
            OMNI
          </span>
        </div>
        <div className="text-[11px] mt-1" style={{ color: muted }}>
          ≈ ₺{(tokenBalance * 0.85).toFixed(2)} TRY
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2">
        {["Gönder", "Al", "P2P"].map((label, i) => (
          <button
            key={label}
            type="button"
            data-ocid={`wallet.${label.toLowerCase()}.button`}
            className="py-2.5 rounded-xl text-xs font-bold transition-all"
            style={{
              background: i === 0 ? "rgba(0,229,204,0.15)" : surf,
              color: i === 0 ? "#00e5cc" : txt,
              border:
                i === 0
                  ? "1px solid rgba(0,229,204,0.3)"
                  : "1px solid transparent",
            }}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="space-y-1">
        {MOCK_TRANSACTIONS.map((tx, i) => (
          <div
            key={tx.id}
            data-ocid={`wallet.transaction.item.${i + 1}`}
            className="flex items-center justify-between px-3 py-2 rounded-xl"
            style={{ background: surf }}
          >
            <div>
              <div className="text-xs font-medium" style={{ color: txt }}>
                {tx.label}
              </div>
              <div className="text-[10px]" style={{ color: muted }}>
                {tx.time}
              </div>
            </div>
            <div className="text-sm font-bold" style={{ color: tx.color }}>
              {tx.amount} OMNI
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function MarketPanel({ isDark }: { isDark: boolean }) {
  const [selectedItem, setSelectedItem] = useState<
    (typeof MOCK_MARKET_ITEMS)[0] | null
  >(null);
  const txt = isDark ? "#f8fafc" : "#0f172a";
  const muted = isDark ? "#64748b" : "#94a3b8";
  const surf = isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.03)";

  return (
    <div className="space-y-3">
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
        {MOCK_MARKET_ITEMS.map((item, i) => (
          <button
            key={item.id}
            type="button"
            data-ocid={`market.item.${i + 1}`}
            onClick={() => setSelectedItem(item)}
            className="shrink-0 p-3 rounded-xl text-left"
            style={{
              background: surf,
              minWidth: "120px",
              border:
                selectedItem?.id === item.id
                  ? "1px solid rgba(0,229,204,0.4)"
                  : "1px solid transparent",
            }}
          >
            <div className="text-2xl mb-1">{item.emoji}</div>
            <div className="text-[11px] font-bold" style={{ color: txt }}>
              {item.name}
            </div>
            <div className="text-[10px] mt-1" style={{ color: "#00e5cc" }}>
              {item.price} OMNI
            </div>
            {item.badge && (
              <div
                className="text-[8px] mt-1 px-1.5 py-0.5 rounded-full inline-block font-bold"
                style={{
                  background:
                    item.badge === "EPİK"
                      ? "rgba(139,92,246,0.2)"
                      : "rgba(0,229,204,0.15)",
                  color: item.badge === "EPİK" ? "#8b5cf6" : "#00e5cc",
                }}
              >
                {item.badge}
              </div>
            )}
          </button>
        ))}
      </div>

      {selectedItem && (
        <div
          className="p-3 rounded-xl"
          style={{ background: surf, border: "1px solid rgba(0,229,204,0.2)" }}
        >
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xl">{selectedItem.emoji}</span>
            <div>
              <div className="text-xs font-bold" style={{ color: txt }}>
                {selectedItem.name}
              </div>
              <div className="text-[10px]" style={{ color: muted }}>
                Satıcı: {selectedItem.seller}
              </div>
            </div>
            <button
              type="button"
              onClick={() => setSelectedItem(null)}
              className="ml-auto"
            >
              <X size={12} style={{ color: muted }} />
            </button>
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              data-ocid="market.chat_seller.button"
              className="flex-1 py-2 rounded-xl text-[11px] font-bold"
              style={{
                background: "rgba(0,229,204,0.1)",
                color: "#00e5cc",
                border: "1px solid rgba(0,229,204,0.2)",
              }}
            >
              💬 Satıcıyla Sohbet
            </button>
            <button
              type="button"
              data-ocid="market.buy.primary_button"
              className="flex-1 py-2 rounded-xl text-[11px] font-bold"
              style={{ background: "#00e5cc", color: "#0a0a0f" }}
            >
              {selectedItem.price} OMNI Al
            </button>
          </div>
        </div>
      )}

      <div>
        <div className="text-[10px] font-bold mb-2" style={{ color: muted }}>
          NADİR ID'LER
        </div>
        <div className="space-y-1.5">
          {[
            {
              id: "id1",
              value: "+777 0001 7890",
              badge: "EFSANEVİ",
              price: 5000,
              color: "#f59e0b",
            },
            {
              id: "id2",
              value: "+777 0042 0000",
              badge: "EPİK",
              price: 2500,
              color: "#8b5cf6",
            },
            {
              id: "id3",
              value: "+777 1234 5678",
              badge: "NADİR",
              price: 800,
              color: "#00e5cc",
            },
          ].map((item, i) => (
            <div
              key={item.id}
              data-ocid={`market.id_listing.item.${i + 1}`}
              className="flex items-center gap-2 px-3 py-2 rounded-xl"
              style={{ background: surf }}
            >
              <span
                className="text-[10px] px-1.5 py-0.5 rounded-full font-bold"
                style={{ background: `${item.color}20`, color: item.color }}
              >
                {item.badge}
              </span>
              <span className="text-xs font-mono flex-1" style={{ color: txt }}>
                {item.value}
              </span>
              <button
                type="button"
                data-ocid={`market.id_buy.button.${i + 1}`}
                className="px-2 py-1 rounded-lg text-[10px] font-bold"
                style={{ background: "rgba(0,229,204,0.15)", color: "#00e5cc" }}
              >
                {item.price} OMNI
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function IDPanel({
  isDark,
  activeIdentity,
  privacyMode,
  tokenBalance,
  onPrivacyChange,
}: {
  isDark: boolean;
  activeIdentity: string;
  privacyMode: string;
  tokenBalance: number;
  onPrivacyChange: (mode: "normal" | "ghost" | "shadow") => void;
}) {
  const txt = isDark ? "#f8fafc" : "#0f172a";
  const muted = isDark ? "#64748b" : "#94a3b8";
  const surf = isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.03)";
  const modes = [
    { key: "normal" as const, label: "NORMAL", color: "#00e5cc" },
    { key: "ghost" as const, label: "GHOST", color: "#8b5cf6" },
    { key: "shadow" as const, label: "SHADOW", color: "#4a5568" },
  ];
  const otherIds = ["+777 5519 6628", "+777 8834 1122"];

  return (
    <div className="space-y-3">
      <div
        className="p-4 rounded-2xl text-center"
        style={{ background: surf, border: "1px solid rgba(0,229,204,0.15)" }}
      >
        <div className="text-3xl mb-2">🌟</div>
        <div
          className="text-xs font-mono font-black"
          style={{ color: "#00e5cc" }}
        >
          {activeIdentity}
        </div>
        <div className="text-[10px] mt-1 mb-3" style={{ color: muted }}>
          KALICI · Oluşturuldu: 2025
        </div>
        <div className="flex justify-center items-center gap-2">
          <div className="flex-1">
            <div className="text-[10px]" style={{ color: muted }}>
              Rep Skoru
            </div>
            <div
              className="h-1.5 rounded-full mt-1"
              style={{ background: "rgba(0,229,204,0.15)" }}
            >
              <div
                className="h-full rounded-full"
                style={{ width: "88%", background: "#00e5cc" }}
              />
            </div>
            <div className="text-[10px] mt-0.5" style={{ color: "#00e5cc" }}>
              4.8 / 5.0
            </div>
          </div>
          <div
            className="w-px h-8"
            style={{ background: "rgba(255,255,255,0.1)" }}
          />
          <div>
            <div className="text-[10px]" style={{ color: muted }}>
              Bakiye
            </div>
            <div className="text-sm font-bold" style={{ color: "#00e5cc" }}>
              {tokenBalance.toLocaleString()} OMNI
            </div>
          </div>
        </div>
      </div>

      <div className="flex gap-2">
        {modes.map((m) => (
          <button
            key={m.key}
            type="button"
            data-ocid={`id.privacy_${m.key}.button`}
            onClick={() => onPrivacyChange(m.key)}
            className="flex-1 py-2.5 rounded-xl text-[10px] font-bold transition-all"
            style={{
              background: privacyMode === m.key ? `${m.color}20` : surf,
              border: `1px solid ${privacyMode === m.key ? m.color : "transparent"}`,
              color: privacyMode === m.key ? m.color : muted,
            }}
          >
            {m.label}
          </button>
        ))}
      </div>

      <div>
        <div className="text-[10px] font-bold mb-2" style={{ color: muted }}>
          DİĞER KİMLİKLERİM
        </div>
        <div className="space-y-1.5">
          {otherIds.map((oid, i) => (
            <button
              key={oid}
              type="button"
              data-ocid={`id.switch.item.${i + 1}`}
              className="w-full flex items-center gap-3 px-3 py-2 rounded-xl"
              style={{ background: surf }}
            >
              <span className="text-base">{["⚡", "🌊"][i]}</span>
              <span className="text-xs font-mono" style={{ color: txt }}>
                {oid}
              </span>
              <span
                className="ml-auto text-[10px]"
                style={{ color: "#00e5cc" }}
              >
                Geç
              </span>
            </button>
          ))}
        </div>
      </div>

      <button
        type="button"
        data-ocid="id.manage.button"
        className="w-full py-2.5 rounded-xl text-xs font-bold"
        style={{
          background: "rgba(139,92,246,0.15)",
          color: "#8b5cf6",
          border: "1px solid rgba(139,92,246,0.3)",
        }}
      >
        🛡️ Kimlik Merkezi
      </button>
    </div>
  );
}

function InlineChatView({
  chat,
  onClose,
  isDark,
}: {
  chat: InlineChat;
  onClose: () => void;
  isDark: boolean;
}) {
  const [messages, setMessages] = useState<ChatMsg[]>(chat.messages);
  const [input, setInput] = useState("");
  const txt = isDark ? "#f8fafc" : "#0f172a";
  const muted = isDark ? "#64748b" : "#94a3b8";
  const surf = isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.04)";

  const send = (text: string) => {
    if (!text.trim()) return;
    const now = new Date();
    const time = `${now.getHours()}:${String(now.getMinutes()).padStart(2, "0")}`;
    setMessages((prev) => [
      ...prev,
      { id: `m${Date.now()}`, from: "me", text, time },
    ]);
    setInput("");
    setTimeout(() => {
      const replies = ["Tamam!", "Anladım 👍", "Birazdan görüşürüz", "👋"];
      setMessages((prev) => [
        ...prev,
        {
          id: `m${Date.now() + 1}`,
          from: "them",
          text: replies[Math.floor(Math.random() * replies.length)],
          time,
        },
      ]);
    }, 800);
  };

  return (
    <div className="flex flex-col h-full">
      <div
        className="flex items-center gap-3 pb-3 mb-3"
        style={{ borderBottom: "1px solid rgba(255,255,255,0.07)" }}
      >
        <button type="button" data-ocid="chat.back.button" onClick={onClose}>
          <ArrowLeft size={18} style={{ color: "#00e5cc" }} />
        </button>
        <div
          className="w-8 h-8 rounded-full flex items-center justify-center text-base"
          style={{ background: "rgba(0,229,204,0.1)" }}
        >
          {chat.avatar}
        </div>
        <div>
          <div className="text-xs font-bold" style={{ color: txt }}>
            {chat.name}
          </div>
          <div className="text-[10px]" style={{ color: "#00e5cc" }}>
            ● Çevrimiçi
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto space-y-2 mb-3 scrollbar-hide">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex ${msg.from === "me" ? "justify-end" : "justify-start"}`}
          >
            <div
              className="max-w-[75%] px-3 py-1.5 rounded-2xl text-xs"
              style={{
                background: msg.from === "me" ? "#00e5cc" : surf,
                color: msg.from === "me" ? "#0a0a0f" : txt,
                borderRadius:
                  msg.from === "me"
                    ? "16px 16px 4px 16px"
                    : "16px 16px 16px 4px",
              }}
            >
              {msg.text}
            </div>
          </div>
        ))}
      </div>

      <div className="flex gap-1.5 overflow-x-auto pb-2 scrollbar-hide">
        {QUICK_REPLIES.map((r) => (
          <button
            key={r}
            type="button"
            onClick={() => send(r)}
            className="shrink-0 px-2.5 py-1 rounded-full text-[10px] font-medium"
            style={{
              background: surf,
              color: muted,
              border: "1px solid rgba(255,255,255,0.08)",
            }}
          >
            {r}
          </button>
        ))}
      </div>

      <div className="flex items-center gap-2">
        <input
          className="flex-1 px-3 py-2 rounded-xl text-xs outline-none"
          style={{
            background: surf,
            color: txt,
            border: "1px solid rgba(255,255,255,0.08)",
          }}
          placeholder="Mesaj yaz..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && send(input)}
          data-ocid="chat.message.input"
        />
        <button
          type="button"
          data-ocid="chat.send.button"
          onClick={() => send(input)}
          className="w-8 h-8 rounded-full flex items-center justify-center shrink-0"
          style={{ background: "#00e5cc" }}
        >
          <Send size={14} style={{ color: "#0a0a0f" }} />
        </button>
      </div>
    </div>
  );
}

// ─── Main HomeScreen ──────────────────────────────────────────────────────────

export function HomeScreen() {
  const {
    tokenBalance,
    myId,
    privacyMode,
    activeIdentityId,
    identities,
    updatePrivacyMode,
    activeRide,
  } = useOmniStore();

  // Theme
  const [theme, setTheme] = useState<"dark" | "light">("dark");
  const isDark = theme === "dark";

  // Ghost mode
  const [ghost, setGhost] = useState(false);

  // Drawer
  const [drawerH, setDrawerH] = useState(DRAWER_COLLAPSED);
  const [activeTab, setActiveTab] = useState<DrawerTab>("ride");
  const drawerDragRef = useRef<{ startY: number; startH: number } | null>(null);
  const drawerRef = useRef<HTMLDivElement>(null);

  // FAB
  const [fabState, setFabState] = useState<FabState>("closed");

  // ID panel
  const [idPanelOpen, setIdPanelOpen] = useState(false);

  // Notifications
  const [toasts, setToasts] = useState<Toast[]>([]);

  // Inline chat
  const [inlineChat, setInlineChat] = useState<InlineChat | null>(null);

  // Ride active flag (for map animation)
  const [rideActive, setRideActive] = useState(false);

  useEffect(() => {
    if (
      activeRide &&
      activeRide.state !== "TRIP_COMPLETED" &&
      activeRide.state !== "CANCELLED"
    ) {
      setRideActive(true);
    } else {
      setRideActive(false);
    }
  }, [activeRide]);

  // Active identity
  const activeIdentity = identities.find((i) => i.id === activeIdentityId);
  const activeIdStr = activeIdentity?.id ?? myId ?? "+777 0000 0000";

  // Show initial notifications
  useEffect(() => {
    const demos: Toast[] = [
      { id: "n1", message: "Yeni sohbet mesajı", icon: "💬", color: "#00e5cc" },
      { id: "n2", message: "+50 OMNI kazandın!", icon: "💎", color: "#8b5cf6" },
    ];
    const timers = demos.map((t, i) =>
      setTimeout(
        () => {
          setToasts((prev) => [...prev, t]);
          setTimeout(
            () => setToasts((prev) => prev.filter((x) => x.id !== t.id)),
            3500,
          );
        },
        1500 + i * 2000,
      ),
    );
    return () => timers.forEach(clearTimeout);
  }, []);

  // Drawer drag handlers
  const onDragStart = useCallback(
    (clientY: number) => {
      drawerDragRef.current = { startY: clientY, startH: drawerH };
    },
    [drawerH],
  );

  const onDragMove = useCallback((clientY: number) => {
    if (!drawerDragRef.current) return;
    const delta = (drawerDragRef.current.startY - clientY) / window.innerHeight;
    const newH = Math.max(
      0.2,
      Math.min(0.9, drawerDragRef.current.startH + delta),
    );
    setDrawerH(newH);
  }, []);

  const onDragEnd = useCallback(() => {
    if (!drawerDragRef.current) return;
    drawerDragRef.current = null;
    setDrawerH((h) => (h > 0.6 ? DRAWER_EXPANDED : DRAWER_COLLAPSED));
  }, []);

  // Mouse events
  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    onDragStart(e.clientY);
  };
  useEffect(() => {
    const mm = (e: MouseEvent) => onDragMove(e.clientY);
    const mu = () => onDragEnd();
    window.addEventListener("mousemove", mm);
    window.addEventListener("mouseup", mu);
    return () => {
      window.removeEventListener("mousemove", mm);
      window.removeEventListener("mouseup", mu);
    };
  }, [onDragMove, onDragEnd]);

  // Touch events
  const handleTouchStart = (e: React.TouchEvent) =>
    onDragStart(e.touches[0].clientY);
  const handleTouchMove = (e: React.TouchEvent) =>
    onDragMove(e.touches[0].clientY);
  const handleTouchEnd = () => onDragEnd();

  const handlePrivacyChange = (mode: "normal" | "ghost" | "shadow") => {
    if (activeIdentityId) updatePrivacyMode(activeIdentityId, mode);
    setGhost(mode === "ghost" || mode === "shadow");
  };

  const openChat = (chat: (typeof MOCK_CHATS)[0]) => {
    setInlineChat({
      convId: chat.id,
      name: chat.name,
      avatar: chat.avatar,
      messages: [{ id: "m0", from: "them", text: chat.last, time: chat.time }],
    });
    setDrawerH(DRAWER_EXPANDED);
  };

  const bg = isDark ? "#0a0a0f" : "#f1f5f9";
  const surface = isDark ? "rgba(18,18,26,0.96)" : "rgba(255,255,255,0.97)";
  const muted = isDark ? "#64748b" : "#94a3b8";
  const border = isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)";

  const TABS: { key: DrawerTab; label: string; icon: React.ReactNode }[] = [
    { key: "ride", label: "Sürüş", icon: <Car size={13} /> },
    { key: "chat", label: "Sohbet", icon: <MessageCircle size={13} /> },
    { key: "wallet", label: "Cüzdan", icon: <Wallet size={13} /> },
    { key: "market", label: "Market", icon: <ShoppingBag size={13} /> },
    { key: "id", label: "Kimlik", icon: <Fingerprint size={13} /> },
  ];

  const FAB_ACTIONS = [
    { icon: "💬", label: "Sohbet Başlat", color: "#00e5cc", angle: -90 },
    { icon: "🚗", label: "Sürüş İste", color: "#8b5cf6", angle: -45 },
    { icon: "💸", label: "Token Gönder", color: "#f59e0b", angle: -135 },
  ];

  return (
    <div
      className="relative overflow-hidden"
      style={{
        height: "100vh",
        width: "100%",
        background: bg,
        userSelect: "none",
        paddingBottom: "60px",
      }}
      onClick={() => {
        if (idPanelOpen) setIdPanelOpen(false);
        if (fabState === "open") setFabState("closed");
      }}
      onKeyDown={(e: React.KeyboardEvent) => {
        if (e.key === "Escape") {
          setIdPanelOpen(false);
          setFabState("closed");
        }
      }}
      role="presentation"
    >
      {/* ── MAP AREA ── */}
      <div
        className="absolute top-0 left-0 right-0"
        style={{
          height: `${(1 - drawerH) * 100}%`,
          transition: "height 0.35s cubic-bezier(0.32,0.72,0,1)",
        }}
      >
        <MapBackground ghost={ghost} theme={theme} activeRide={rideActive} />

        {/* Ride status banner */}
        {activeRide &&
          (activeRide.state === "TRIP_STARTED" ||
            activeRide.state === "DRIVER_ARRIVING") && (
            <div
              className="absolute top-3 left-1/2 -translate-x-1/2 px-4 py-2 rounded-full text-xs font-bold"
              style={{
                background: "rgba(0,229,204,0.15)",
                border: "1px solid rgba(0,229,204,0.4)",
                backdropFilter: "blur(12px)",
                color: "#00e5cc",
                animation: "slideDown 0.4s ease-out",
              }}
              data-ocid="ride.status.panel"
            >
              {activeRide.state === "DRIVER_ARRIVING"
                ? "🚗 Sürücü Geliyor · 3 dk"
                : "🟢 Sürüş Başladı · 8 dk"}
            </div>
          )}

        {/* Notifications */}
        <NotificationToast
          toasts={toasts}
          onDismiss={(id) => setToasts((p) => p.filter((t) => t.id !== id))}
        />

        {/* Ghost badge */}
        {ghost && (
          <div
            className="absolute top-3 left-1/2 -translate-x-1/2 px-3 py-1.5 rounded-full text-xs font-bold"
            style={{
              background: "rgba(139,92,246,0.2)",
              border: "1px solid rgba(139,92,246,0.4)",
              color: "#8b5cf6",
            }}
          >
            👻 {privacyMode === "shadow" ? "Shadow Modu" : "Ghost Modu"}
          </div>
        )}

        {/* Top-left: ID chip */}
        <div className="absolute top-3 left-3 z-30">
          <button
            type="button"
            data-ocid="home.id_chip.button"
            onClick={(e) => {
              e.stopPropagation();
              setIdPanelOpen((p) => !p);
            }}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-[11px] font-bold"
            style={{
              background: "rgba(12,12,24,0.85)",
              border: "1px solid rgba(0,229,204,0.3)",
              backdropFilter: "blur(12px)",
              color: "#00e5cc",
            }}
          >
            <Circle size={6} fill="#00e5cc" style={{ color: "#00e5cc" }} />
            {activeIdStr}
          </button>

          {idPanelOpen && (
            <IDQuickPanel
              id={activeIdStr}
              privacyMode={privacyMode}
              tokenBalance={tokenBalance}
              onClose={() => setIdPanelOpen(false)}
              onPrivacyChange={handlePrivacyChange}
            />
          )}
        </div>

        {/* Top-right: Ghost + Theme toggles */}
        <div className="absolute top-3 right-3 z-30 flex gap-2">
          <button
            type="button"
            data-ocid="home.ghost.toggle"
            onClick={(e) => {
              e.stopPropagation();
              setGhost((g) => !g);
            }}
            className="w-8 h-8 rounded-full flex items-center justify-center"
            style={{
              background: ghost
                ? "rgba(139,92,246,0.3)"
                : "rgba(12,12,24,0.85)",
              border: `1px solid ${ghost ? "rgba(139,92,246,0.5)" : "rgba(255,255,255,0.1)"}`,
              backdropFilter: "blur(12px)",
            }}
          >
            <Ghost size={14} style={{ color: ghost ? "#8b5cf6" : "#64748b" }} />
          </button>
          <button
            type="button"
            data-ocid="home.theme.toggle"
            onClick={(e) => {
              e.stopPropagation();
              setTheme((t) => (t === "dark" ? "light" : "dark"));
            }}
            className="w-8 h-8 rounded-full flex items-center justify-center"
            style={{
              background: "rgba(12,12,24,0.85)",
              border: "1px solid rgba(255,255,255,0.1)",
              backdropFilter: "blur(12px)",
            }}
          >
            {isDark ? (
              <Sun size={14} style={{ color: "#f59e0b" }} />
            ) : (
              <Moon size={14} style={{ color: "#8b5cf6" }} />
            )}
          </button>
        </div>
      </div>

      {/* ── DRAWER ── */}
      <div
        ref={drawerRef}
        className="absolute bottom-0 left-0 right-0 flex flex-col"
        style={{
          height: `${drawerH * 100}%`,
          background: surface,
          borderRadius: "24px 24px 0 0",
          boxShadow: "0 -8px 40px rgba(0,0,0,0.4)",
          transition: drawerDragRef.current
            ? "none"
            : "height 0.35s cubic-bezier(0.32,0.72,0,1)",
          zIndex: 20,
        }}
      >
        {/* Drag handle */}
        <div
          className="flex flex-col items-center pt-3 pb-2 cursor-grab active:cursor-grabbing shrink-0"
          onMouseDown={handleMouseDown}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          data-ocid="home.drawer.drag_handle"
        >
          <div
            className="w-10 h-1 rounded-full"
            style={{
              background: isDark
                ? "rgba(255,255,255,0.15)"
                : "rgba(0,0,0,0.12)",
            }}
          />
          <button
            type="button"
            onClick={() =>
              setDrawerH((h) => (h > 0.6 ? DRAWER_COLLAPSED : DRAWER_EXPANDED))
            }
            className="mt-1"
          >
            <ChevronUp
              size={16}
              style={{
                color: muted,
                transition: "transform 0.3s",
                transform: drawerH > 0.6 ? "rotate(180deg)" : "rotate(0deg)",
              }}
            />
          </button>
        </div>

        {/* Tab switcher */}
        <div
          className="flex gap-1.5 px-4 pb-3 overflow-x-auto scrollbar-hide shrink-0"
          style={{ borderBottom: `1px solid ${border}` }}
        >
          {TABS.map((tab) => (
            <button
              key={tab.key}
              type="button"
              data-ocid={`home.${tab.key}.tab`}
              onClick={() => {
                setActiveTab(tab.key);
                setInlineChat(null);
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-bold whitespace-nowrap shrink-0 transition-all"
              style={{
                background:
                  activeTab === tab.key
                    ? "rgba(0,229,204,0.15)"
                    : "transparent",
                border: `1px solid ${activeTab === tab.key ? "rgba(0,229,204,0.4)" : "transparent"}`,
                color: activeTab === tab.key ? "#00e5cc" : muted,
              }}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>

        {/* Panel content */}
        <div className="flex-1 overflow-y-auto px-4 pt-3 pb-4 scrollbar-hide">
          {inlineChat && activeTab === "chat" ? (
            <InlineChatView
              chat={inlineChat}
              onClose={() => setInlineChat(null)}
              isDark={isDark}
            />
          ) : (
            <>
              {activeTab === "ride" && (
                <RidePanel
                  isDark={isDark}
                  onRideStart={() => setActiveTab("ride")}
                />
              )}
              {activeTab === "chat" && (
                <ChatPanel isDark={isDark} onOpenChat={openChat} />
              )}
              {activeTab === "wallet" && (
                <WalletPanel isDark={isDark} tokenBalance={tokenBalance} />
              )}
              {activeTab === "market" && <MarketPanel isDark={isDark} />}
              {activeTab === "id" && (
                <IDPanel
                  isDark={isDark}
                  activeIdentity={activeIdStr}
                  privacyMode={privacyMode}
                  tokenBalance={tokenBalance}
                  onPrivacyChange={handlePrivacyChange}
                />
              )}
            </>
          )}
        </div>
      </div>

      {/* ── FAB ── */}
      <div
        className="absolute z-30"
        style={{
          bottom: `calc(${drawerH * 100}% + 16px)`,
          right: "16px",
          transition: "bottom 0.35s cubic-bezier(0.32,0.72,0,1)",
        }}
      >
        {/* FAB radial actions */}
        {fabState === "open" &&
          FAB_ACTIONS.map((action, i) => {
            const spread = 70;
            const rad = (action.angle * Math.PI) / 180;
            const x = Math.cos(rad) * spread;
            const y = Math.sin(rad) * spread;
            return (
              <div
                key={action.label}
                className="absolute flex flex-col items-center"
                style={{
                  right: `${-x}px`,
                  bottom: `${-y}px`,
                  transform: "translate(50%, 50%)",
                  animation: `fabExpand 0.25s ease-out ${i * 0.05}s both`,
                }}
              >
                <button
                  type="button"
                  data-ocid={`home.fab_action.button.${i + 1}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    setFabState("closed");
                    if (action.label === "Sürüş İste") setActiveTab("ride");
                    if (action.label === "Sohbet Başlat") setActiveTab("chat");
                    if (action.label === "Token Gönder") setActiveTab("wallet");
                    setDrawerH(DRAWER_EXPANDED);
                  }}
                  className="w-11 h-11 rounded-full flex items-center justify-center text-lg shadow-lg"
                  style={{ background: action.color }}
                >
                  {action.icon}
                </button>
                <div
                  className="text-[9px] font-bold mt-1 px-2 py-0.5 rounded-full whitespace-nowrap"
                  style={{ background: "rgba(0,0,0,0.7)", color: "white" }}
                >
                  {action.label}
                </div>
              </div>
            );
          })}

        {/* Main FAB */}
        <button
          type="button"
          data-ocid="home.fab.primary_button"
          onClick={(e) => {
            e.stopPropagation();
            setFabState((s) => (s === "open" ? "closed" : "open"));
          }}
          className="w-14 h-14 rounded-full flex items-center justify-center shadow-xl transition-all"
          style={{
            background: "#00e5cc",
            boxShadow:
              fabState === "open"
                ? "0 0 24px rgba(0,229,204,0.6)"
                : "0 4px 20px rgba(0,229,204,0.3)",
            transform: fabState === "open" ? "rotate(45deg)" : "rotate(0deg)",
            transition: "transform 0.25s ease, box-shadow 0.25s ease",
          }}
        >
          <Plus size={22} style={{ color: "#0a0a0f" }} />
        </button>
      </div>

      {/* ── Quick ride request shortcut from FAB ── */}
      {fabState === "open" && (
        <div
          className="absolute inset-0 z-25"
          style={{ background: "rgba(0,0,0,0.3)", backdropFilter: "blur(2px)" }}
          onClick={() => setFabState("closed")}
          onKeyDown={() => {}}
          role="presentation"
        />
      )}

      <style>{`
        @keyframes slideInRight {
          from { opacity: 0; transform: translateX(20px); }
          to { opacity: 1; transform: translateX(0); }
        }
        @keyframes slideDown {
          from { opacity: 0; transform: translateX(-50%) translateY(-12px); }
          to { opacity: 1; transform: translateX(-50%) translateY(0); }
        }
        @keyframes fabExpand {
          from { opacity: 0; transform: translate(50%, 50%) scale(0.5); }
          to { opacity: 1; transform: translate(50%, 50%) scale(1); }
        }
      `}</style>
    </div>
  );
}
