import { ContactDiscovery } from "@/components/ContactDiscovery";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { PrivacyMode } from "@/lib/identitySystem";
import { MOCK_MATCH_PROFILES, analyzeMood } from "@/lib/mockData";
import { type CallLog, useOmniStore } from "@/lib/omniStore";
import { AnimatePresence, motion } from "motion/react";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";

const EMOJIS = ["🎧", "✈️", "🎮", "🔥", "💡", "🌍", "❤️", "🎨", "🌙", "⚡"];
const MOODS = ["Happy", "Excited", "Focused", "Chill", "Mysterious"];
const AVATAR_EMOJIS = [
  "🦊",
  "🐺",
  "🦁",
  "🐉",
  "🦄",
  "🤖",
  "👾",
  "🐼",
  "🦋",
  "🌊",
];

function formatTimeLeft(ms: number): string {
  if (ms <= 0) return "Expired";
  const h = Math.floor(ms / 3600000);
  const m = Math.floor((ms % 3600000) / 60000);
  if (h > 0) return `${h}h ${m}m left`;
  return `${m}m left`;
}

function formatDuration(secs: number): string {
  const m = Math.floor(secs / 60);
  const s = secs % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

function formatRelativeTime(ts: number): string {
  const diff = Date.now() - ts;
  if (diff < 60000) return "Az önce";
  if (diff < 3600000) return `${Math.floor(diff / 60000)} dk önce`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)} sa önce`;
  return "Dün";
}

function ScoreBar({ score }: { score: number }) {
  return (
    <div
      className="w-full rounded-full overflow-hidden"
      style={{ height: "4px", background: "#2A3142" }}
    >
      <div
        className="h-full rounded-full"
        style={{
          width: `${score}%`,
          background: "linear-gradient(90deg, #19E6FF, #B56BFF)",
          boxShadow: "0 0 6px #19E6FF80",
        }}
      />
    </div>
  );
}

// ── CALL MODAL (WebRTC) ──────────────────────────────────────────────────────
function CallModal({
  open,
  onClose,
  targetId,
  initialType = "voice",
}: {
  open: boolean;
  onClose: () => void;
  targetId: string;
  initialType?: "voice" | "video";
}) {
  const { addCallLog } = useOmniStore();
  const [callType, setCallType] = useState<"voice" | "video">(initialType);
  const [callState, setCallState] = useState<
    "requesting" | "ringing" | "connected" | "error"
  >("requesting");
  const [elapsed, setElapsed] = useState(0);
  const [muted, setMuted] = useState(false);
  const [aiMask, setAiMask] = useState(false);
  const [permError, setPermError] = useState("");
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const autoAnswerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const localVideoRef = useRef<HTMLVideoElement>(null);

  // Request real mic/camera permissions
  useEffect(() => {
    if (!open) return;
    setCallState("requesting");
    setElapsed(0);
    setPermError("");

    const constraints =
      callType === "video"
        ? { audio: true, video: { facingMode: "user" } }
        : { audio: true, video: false };

    navigator.mediaDevices
      .getUserMedia(constraints)
      .then((stream) => {
        localStreamRef.current = stream;
        if (localVideoRef.current && callType === "video") {
          localVideoRef.current.srcObject = stream;
        }
        setCallState("ringing");
        autoAnswerRef.current = setTimeout(() => {
          setCallState("connected");
        }, 2500);
      })
      .catch((err) => {
        console.error("Media error:", err);
        if (
          err.name === "NotAllowedError" ||
          err.name === "PermissionDeniedError"
        ) {
          setPermError(
            "Mikrofon/kamera erişimi reddedildi. Tarayıcı ayarlarından izin ver.",
          );
        } else if (err.name === "NotFoundError") {
          setPermError("Mikrofon veya kamera bulunamadı.");
        } else {
          setPermError(`Medya cihazı hatası: ${err.message}`);
        }
        setCallState("error");
      });

    return () => {
      if (autoAnswerRef.current) clearTimeout(autoAnswerRef.current);
    };
  }, [open, callType]);

  // Cleanup stream on close
  useEffect(() => {
    if (!open && localStreamRef.current) {
      for (const t of localStreamRef.current.getTracks()) t.stop();
      localStreamRef.current = null;
    }
  }, [open]);

  // Mute/unmute mic
  useEffect(() => {
    if (localStreamRef.current) {
      for (const t of localStreamRef.current.getAudioTracks())
        t.enabled = !muted;
    }
  }, [muted]);

  // Timer
  useEffect(() => {
    if (callState === "connected") {
      timerRef.current = setInterval(() => setElapsed((e) => e + 1), 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [callState]);

  const handleHangup = useCallback(() => {
    if (autoAnswerRef.current) clearTimeout(autoAnswerRef.current);
    if (timerRef.current) clearInterval(timerRef.current);
    if (localStreamRef.current) {
      for (const t of localStreamRef.current.getTracks()) t.stop();
      localStreamRef.current = null;
    }
    if (callState !== "requesting" && callState !== "error") {
      addCallLog({
        contactId: targetId,
        type: callType,
        direction: "outgoing",
        status: callState === "connected" ? "answered" : "missed",
        duration: callState === "connected" ? elapsed : undefined,
        timestamp: Date.now(),
      });
    }
    toast("Arama sonlandırıldı");
    onClose();
  }, [addCallLog, callState, callType, elapsed, onClose, targetId]);

  const avatarEmoji =
    AVATAR_EMOJIS[Math.abs(targetId.charCodeAt(5) || 0) % AVATAR_EMOJIS.length];

  return (
    <Dialog open={open} onOpenChange={(o) => !o && handleHangup()}>
      <DialogContent
        data-ocid="friends.call.dialog"
        className="max-w-xs mx-auto p-0 overflow-hidden"
        style={{ background: "#0D1118", border: "1px solid #2A3142" }}
      >
        {/* Video preview (when video call active) */}
        {callType === "video" && callState !== "error" && (
          <div className="relative w-full bg-black" style={{ height: "220px" }}>
            <video
              ref={localVideoRef}
              autoPlay
              muted
              playsInline
              className="w-full h-full object-cover"
              style={{ transform: "scaleX(-1)" }}
            />
            {callState !== "connected" && (
              <div
                className="absolute inset-0 flex items-center justify-center"
                style={{ background: "rgba(0,0,0,0.5)" }}
              >
                <span className="text-5xl">{avatarEmoji}</span>
              </div>
            )}
            {callState === "connected" && (
              <div
                className="absolute top-2 right-2 px-2 py-0.5 rounded-full text-xs font-bold"
                style={{
                  background: "rgba(47,245,199,0.2)",
                  color: "#2FF5C7",
                  border: "1px solid #2FF5C730",
                }}
              >
                ● CANLI
              </div>
            )}
          </div>
        )}

        <div className="p-4 space-y-4">
          <div className="flex items-center justify-between">
            <span className="font-bold text-sm" style={{ color: "#F2F4FF" }}>
              Arama
            </span>
            {/* Type toggle */}
            <div className="flex gap-1">
              {(["voice", "video"] as const).map((t) => (
                <button
                  type="button"
                  key={t}
                  data-ocid={`friends.call.${t}.toggle`}
                  onClick={() => {
                    if (callState !== "connected") setCallType(t);
                  }}
                  className="px-3 py-1 rounded-xl text-xs font-bold transition-all"
                  style={{
                    background:
                      callType === t
                        ? "rgba(25,230,255,0.15)"
                        : "rgba(255,255,255,0.05)",
                    border: `1px solid ${callType === t ? "#19E6FF50" : "#2A3142"}`,
                    color: callType === t ? "#19E6FF" : "#A7ACBE",
                    opacity: callState === "connected" ? 0.5 : 1,
                  }}
                >
                  {t === "voice" ? "📞" : "🎥"}
                </button>
              ))}
            </div>
          </div>

          {/* Status area (voice call) */}
          {callType === "voice" && (
            <div className="flex flex-col items-center gap-3 py-2">
              <div
                className="w-20 h-20 rounded-full flex items-center justify-center text-4xl"
                style={{
                  background: "rgba(25,230,255,0.08)",
                  border: "2px solid #19E6FF30",
                  boxShadow:
                    callState === "connected" ? "0 0 30px #19E6FF40" : "none",
                  transition: "box-shadow 0.5s",
                }}
              >
                {avatarEmoji}
              </div>
              <span
                className="font-mono font-bold text-lg"
                style={{ color: "#19E6FF" }}
              >
                {targetId}
              </span>
            </div>
          )}

          {/* State indicator */}
          <div className="flex justify-center">
            <AnimatePresence mode="wait">
              {callState === "requesting" && (
                <motion.div
                  key="req"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex items-center gap-2"
                >
                  <span
                    className="w-2 h-2 rounded-full animate-pulse"
                    style={{ background: "#B56BFF" }}
                  />
                  <span className="text-sm" style={{ color: "#B56BFF" }}>
                    İzin isteniyor...
                  </span>
                </motion.div>
              )}
              {callState === "ringing" && (
                <motion.div
                  key="ring"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex items-center gap-2"
                >
                  <span
                    className="w-2 h-2 rounded-full animate-pulse"
                    style={{ background: "#19E6FF" }}
                  />
                  <span className="text-sm" style={{ color: "#A7ACBE" }}>
                    Arıyor...
                  </span>
                </motion.div>
              )}
              {callState === "connected" && (
                <motion.div
                  key="conn"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex flex-col items-center gap-1"
                >
                  <span
                    className="text-sm font-bold"
                    style={{ color: "#2FF5C7" }}
                  >
                    Bağlandı ✓
                  </span>
                  <span
                    className="font-mono text-xl font-black"
                    style={{ color: "#F2F4FF" }}
                  >
                    {formatDuration(elapsed)}
                  </span>
                </motion.div>
              )}
              {callState === "error" && (
                <motion.div
                  key="err"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="text-center px-2"
                >
                  <p className="text-sm font-bold" style={{ color: "#FF4F4F" }}>
                    Hata
                  </p>
                  <p className="text-xs mt-1" style={{ color: "#A7ACBE" }}>
                    {permError}
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Controls */}
          <div
            className={`grid gap-2 ${callType === "video" ? "grid-cols-4" : "grid-cols-3"}`}
          >
            <button
              type="button"
              data-ocid="friends.call.mute.toggle"
              onClick={() => setMuted((v) => !v)}
              disabled={callState === "error" || callState === "requesting"}
              className="flex flex-col items-center gap-1 py-2 rounded-xl text-xs transition-all"
              style={{
                background: muted
                  ? "rgba(25,230,255,0.15)"
                  : "rgba(255,255,255,0.05)",
                border: `1px solid ${muted ? "#19E6FF40" : "#2A3142"}`,
                color: muted ? "#19E6FF" : "#A7ACBE",
                minHeight: "52px",
              }}
            >
              <span className="text-xl">{muted ? "🔇" : "🎙️"}</span>
              <span className="text-[9px] font-bold">
                {muted ? "Sessiz" : "Mikrofon"}
              </span>
            </button>

            <button
              type="button"
              data-ocid="friends.call.ai_mask.toggle"
              onClick={() => setAiMask((v) => !v)}
              disabled={callState === "error"}
              className="flex flex-col items-center gap-1 py-2 rounded-xl text-xs transition-all"
              style={{
                background: aiMask
                  ? "rgba(181,107,255,0.15)"
                  : "rgba(255,255,255,0.05)",
                border: `1px solid ${aiMask ? "#B56BFF40" : "#2A3142"}`,
                color: aiMask ? "#B56BFF" : "#A7ACBE",
                minHeight: "52px",
              }}
            >
              <span className="text-xl">🤖</span>
              <span className="text-[9px] font-bold">AI Maske</span>
            </button>

            {callType === "video" && (
              <button
                type="button"
                data-ocid="friends.call.camera.toggle"
                onClick={() => {
                  if (localStreamRef.current) {
                    const vt = localStreamRef.current.getVideoTracks()[0];
                    if (vt) vt.enabled = !vt.enabled;
                  }
                }}
                className="flex flex-col items-center gap-1 py-2 rounded-xl text-xs transition-all"
                style={{
                  background: "rgba(255,255,255,0.05)",
                  border: "1px solid #2A3142",
                  color: "#A7ACBE",
                  minHeight: "52px",
                }}
              >
                <span className="text-xl">📷</span>
                <span className="text-[9px] font-bold">Kamera</span>
              </button>
            )}

            <button
              type="button"
              data-ocid="friends.call.hangup.button"
              onClick={handleHangup}
              className="flex flex-col items-center gap-1 py-2 rounded-xl text-xs transition-all"
              style={{
                background: "rgba(255,79,79,0.15)",
                border: "1px solid #FF4F4F40",
                color: "#FF4F4F",
                minHeight: "52px",
              }}
            >
              <span className="text-xl">🔴</span>
              <span className="text-[9px] font-bold">Kapat</span>
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ── ADD BY ID MODAL ───────────────────────────────────────────────────────────
function AddByIdModal({
  open,
  onClose,
}: { open: boolean; onClose: () => void }) {
  const { addFriendById } = useOmniStore();
  const [inputId, setInputId] = useState("");
  const [formatted, setFormatted] = useState("");
  const isValid = /^\+777\s\d{4}\s\d{4}$/.test(formatted);

  const handleInput = (val: string) => {
    setInputId(val);
    // Auto-format: +777 XXXX XXXX
    const allDigits = val.replace(/[^\d]/g, "");
    // Strip leading 777 prefix if user typed the full +777 ID
    const digits = allDigits.startsWith("777") ? allDigits.slice(3) : allDigits;
    if (digits.length <= 11) {
      let f = "+777";
      if (digits.length > 0) f += ` ${digits.slice(0, 4)}`;
      if (digits.length > 4) f += ` ${digits.slice(4, 8)}`;
      setFormatted(f);
    } else {
      setFormatted(val);
    }
  };

  const randomEmoji =
    AVATAR_EMOJIS[
      Math.abs(formatted.charCodeAt(5) || 0) % AVATAR_EMOJIS.length
    ];

  const handleAdd = useCallback(() => {
    if (!isValid) return;
    const result = addFriendById(formatted);
    const messages: Record<string, string> = {
      added: "Arkadaş eklendi! 🎉",
      already_friend: "Zaten arkadaşsınız",
      already_sent: "İstek zaten gönderildi",
      self: "Kendi ID'nizi ekleyemezsiniz",
    };
    if (result === "added") toast.success(messages[result]);
    else toast(messages[result]);
    if (result === "added") {
      setInputId("");
      setFormatted("");
      onClose();
    }
  }, [addFriendById, formatted, isValid, onClose]);

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent
        data-ocid="friends.add_by_id.dialog"
        className="max-w-sm"
        style={{ background: "#0D1118", border: "1px solid #2A3142" }}
      >
        <DialogHeader>
          <DialogTitle style={{ color: "#F2F4FF" }}>
            ID ile Arkadaş Ekle
          </DialogTitle>
          <p className="text-xs mt-1" style={{ color: "#A7ACBE" }}>
            Arkadaşının +777 ID numarasını gir
          </p>
        </DialogHeader>

        <div className="space-y-4">
          <Input
            data-ocid="friends.add_by_id.input"
            value={inputId}
            onChange={(e) => handleInput(e.target.value)}
            placeholder="+777 1234 5678"
            className="font-mono text-center text-lg tracking-widest"
            style={{
              background: "#151A26",
              border: `1px solid ${isValid ? "#19E6FF60" : "#2A3142"}`,
              color: isValid ? "#19E6FF" : "#F2F4FF",
            }}
          />

          <AnimatePresence>
            {isValid && (
              <motion.div
                initial={{ opacity: 0, y: 8, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -4 }}
                className="rounded-2xl p-4 flex items-center gap-4"
                style={{
                  background: "rgba(25,230,255,0.06)",
                  border: "1px solid #19E6FF30",
                }}
              >
                <div
                  className="w-14 h-14 rounded-xl flex items-center justify-center text-3xl"
                  style={{
                    background: "rgba(25,230,255,0.1)",
                    border: "1px solid #19E6FF30",
                  }}
                >
                  {randomEmoji}
                </div>
                <div>
                  <p
                    className="font-mono font-black text-base"
                    style={{ color: "#19E6FF" }}
                  >
                    {formatted}
                  </p>
                  <p className="text-xs mt-0.5" style={{ color: "#2FF5C7" }}>
                    ✓ Geçerli OMNI ID
                  </p>
                  <p
                    className="text-[10px] mt-0.5"
                    style={{ color: "#6B7280" }}
                  >
                    Anonim kullanıcı
                  </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="flex gap-2">
            <button
              type="button"
              data-ocid="friends.add_by_id.cancel_button"
              onClick={onClose}
              className="flex-1 py-3 rounded-xl text-sm font-bold"
              style={{
                background: "rgba(167,172,190,0.08)",
                border: "1px solid #2A3142",
                color: "#A7ACBE",
              }}
            >
              İptal
            </button>
            <button
              type="button"
              data-ocid="friends.add_by_id.submit_button"
              onClick={handleAdd}
              disabled={!isValid}
              className="flex-1 py-3 rounded-xl text-sm font-black tracking-wide transition-all"
              style={{
                background: isValid
                  ? "linear-gradient(135deg, rgba(25,230,255,0.2), rgba(181,107,255,0.2))"
                  : "rgba(167,172,190,0.05)",
                border: `1px solid ${isValid ? "#19E6FF50" : "#2A3142"}`,
                color: isValid ? "#19E6FF" : "#4A5568",
              }}
            >
              Arkadaş Ekle
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ── ID PAYLAŞ MODAL ───────────────────────────────────────────────────────────
function IDPaylaşModal({
  open,
  onClose,
}: { open: boolean; onClose: () => void }) {
  const { myId } = useOmniStore();

  const handleCopy = useCallback(() => {
    if (myId) {
      navigator.clipboard.writeText(myId);
      toast.success("ID kopyalandı!");
    }
  }, [myId]);

  const handleShare = useCallback(() => {
    if (!myId) return;
    if (navigator.share) {
      navigator.share({ title: "OMNI ID", text: myId });
    } else {
      navigator.clipboard.writeText(myId);
      toast.success("ID kopyalandı!");
    }
  }, [myId]);

  const handleInviteLink = useCallback(() => {
    if (!myId) return;
    const code = myId.replace(/\s/g, "").replace("+777", "");
    const text = `OMNI'ye katıl! ID: ${myId} https://omni.app/invite/${code}`;
    navigator.clipboard.writeText(text);
    toast.success("Davet linki kopyalandı! 🔗");
  }, [myId]);

  // Pseudo-QR: 7x7 grid of dots
  const qrPattern = Array.from({ length: 49 }, (_, i) => {
    const row = Math.floor(i / 7);
    const col = i % 7;
    const on =
      (row < 2 && col < 2) || (row < 2 && col > 4) || (row > 4 && col < 2)
        ? true
        : (row + col + (myId?.charCodeAt(row + col) || 0)) % 3 !== 0;
    return { key: `r${row}c${col}`, on };
  });

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent
        data-ocid="friends.id_share.dialog"
        className="max-w-sm"
        style={{ background: "#0D1118", border: "1px solid #19E6FF30" }}
      >
        <DialogHeader>
          <DialogTitle style={{ color: "#F2F4FF" }}>Benim ID'im</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Big ID card */}
          <div
            className="rounded-2xl p-5 text-center space-y-1"
            style={{
              background:
                "linear-gradient(135deg, rgba(25,230,255,0.06), rgba(181,107,255,0.06))",
              border: "1px solid #19E6FF30",
            }}
          >
            <p
              className="text-[10px] font-black tracking-[0.3em] uppercase"
              style={{ color: "#A7ACBE" }}
            >
              OMNI Anonim ID
            </p>
            <p
              className="font-mono font-black text-2xl tracking-widest"
              style={{ color: "#19E6FF", textShadow: "0 0 20px #19E6FF50" }}
            >
              {myId ?? "+777 ???? ????"}
            </p>
            <p className="text-[10px]" style={{ color: "#6B7280" }}>
              Blockchain verified • Anonymous
            </p>
          </div>

          {/* Pseudo-QR */}
          <div className="flex justify-center">
            <div
              className="p-3 rounded-xl"
              style={{ background: "#151A26", border: "1px solid #2A3142" }}
            >
              <div
                className="grid gap-0.5"
                style={{ gridTemplateColumns: "repeat(7, 1fr)", width: "84px" }}
              >
                {qrPattern.map(({ key, on }) => (
                  <div
                    key={key}
                    className="rounded-sm"
                    style={{
                      width: "10px",
                      height: "10px",
                      background: on ? "#19E6FF" : "transparent",
                    }}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Action buttons */}
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              data-ocid="friends.id_share.copy_button"
              onClick={handleCopy}
              className="py-3 rounded-xl text-sm font-bold"
              style={{
                background: "rgba(25,230,255,0.1)",
                border: "1px solid #19E6FF40",
                color: "#19E6FF",
              }}
            >
              📋 Kopyala
            </button>
            <button
              type="button"
              data-ocid="friends.id_share.share_button"
              onClick={handleShare}
              className="py-3 rounded-xl text-sm font-bold"
              style={{
                background: "rgba(181,107,255,0.1)",
                border: "1px solid #B56BFF40",
                color: "#B56BFF",
              }}
            >
              📤 Paylaş
            </button>
          </div>
          <button
            type="button"
            data-ocid="friends.id_share.invite_button"
            onClick={handleInviteLink}
            className="w-full py-3 rounded-xl text-sm font-black tracking-wide"
            style={{
              background:
                "linear-gradient(135deg, rgba(25,230,255,0.12), rgba(181,107,255,0.12))",
              border: "1px solid #19E6FF30",
              color: "#F2F4FF",
            }}
          >
            🔗 Davet Linki Oluştur
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ── DISCOVER TAB ──────────────────────────────────────────────────────────────
function DiscoverTab() {
  const { friendRequests, sendFriendRequest } = useOmniStore();
  const [syncing, setSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState<string | null>(null);

  const pendingOutgoing = friendRequests
    .filter((r) => r.direction === "outgoing" && r.status === "pending")
    .map((r) => r.toId);

  const handleSync = useCallback(() => {
    setSyncing(true);
    setSyncResult(null);
    setTimeout(() => {
      const contacts = Math.floor(80 + Math.random() * 120);
      const matches = Math.floor(3 + Math.random() * 8);
      setSyncing(false);
      setSyncResult(`${contacts} contacts hashed, ${matches} matches found`);
    }, 1800);
  }, []);

  const handleAdd = useCallback(
    (profile: (typeof MOCK_MATCH_PROFILES)[0]) => {
      sendFriendRequest(
        profile.id,
        profile.interests,
        Math.floor(70 + Math.random() * 30),
      );
      toast.success(`Friend request sent to ${profile.id}`);
    },
    [sendFriendRequest],
  );

  return (
    <div className="space-y-4">
      <div
        className="rounded-2xl p-4"
        style={{ background: "#151A26", border: "1px solid #2A3142" }}
      >
        <div className="flex items-center justify-between mb-2">
          <div>
            <p
              className="text-xs font-black tracking-[0.2em] uppercase"
              style={{ color: "#A7ACBE" }}
            >
              AI Friend Suggestions
            </p>
            <p className="text-[11px] mt-0.5" style={{ color: "#6B7280" }}>
              Based on hashed contact sync & pulse matching
            </p>
          </div>
          <button
            type="button"
            data-ocid="friends.sync.button"
            onClick={handleSync}
            disabled={syncing}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold tracking-wide transition-all"
            style={{
              background: syncing ? "#1A2030" : "rgba(25,230,255,0.1)",
              border: "1px solid #19E6FF40",
              color: syncing ? "#A7ACBE" : "#19E6FF",
            }}
          >
            {syncing ? (
              <>
                <span
                  className="w-3 h-3 border-2 border-t-transparent rounded-full animate-spin"
                  style={{
                    borderColor: "#19E6FF",
                    borderTopColor: "transparent",
                  }}
                />
                Syncing…
              </>
            ) : (
              "🔑 Hash Sync"
            )}
          </button>
        </div>
        {syncResult && (
          <p
            className="text-[11px] px-3 py-1.5 rounded-lg mt-1"
            style={{ background: "rgba(47,245,199,0.08)", color: "#2FF5C7" }}
          >
            ✓ {syncResult}
          </p>
        )}
        <p className="text-[10px] mt-2" style={{ color: "#6B7280" }}>
          🔒 Only cryptographic hashes are synced. Your contacts stay private.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-3">
        {MOCK_MATCH_PROFILES.map((profile, i) => {
          const isPending = pendingOutgoing.includes(profile.id);
          return (
            <motion.div
              key={profile.id}
              data-ocid={`friends.discover.item.${i + 1}`}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.06 }}
              className="rounded-2xl p-4"
              style={{ background: "#151A26", border: "1px solid #2A3142" }}
            >
              <div className="flex items-start gap-3">
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl flex-shrink-0"
                  style={{
                    background: "rgba(25,230,255,0.06)",
                    border: "1px solid #2A3142",
                  }}
                >
                  {profile.mood}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span
                      className="font-mono font-bold text-sm"
                      style={{ color: "#19E6FF" }}
                    >
                      {profile.id}
                    </span>
                    <span
                      className="text-[10px] px-2 py-0.5 rounded-full font-bold"
                      style={{
                        background: profile.online
                          ? "rgba(47,245,199,0.15)"
                          : "rgba(167,172,190,0.1)",
                        color: profile.online ? "#2FF5C7" : "#A7ACBE",
                      }}
                    >
                      {profile.online ? "● Online" : profile.lastSeen}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-1 mt-1.5">
                    {profile.interests.map((interest) => (
                      <span
                        key={interest}
                        className="text-[10px] px-2 py-0.5 rounded-full"
                        style={{
                          background: "rgba(181,107,255,0.12)",
                          color: "#B56BFF",
                          border: "1px solid #B56BFF30",
                        }}
                      >
                        {interest}
                      </span>
                    ))}
                  </div>
                  <div className="mt-2 space-y-1">
                    <div className="flex items-center justify-between">
                      <span
                        className="text-[10px] font-bold tracking-wider"
                        style={{ color: "#A7ACBE" }}
                      >
                        AI FRIEND SCORE
                      </span>
                      <span
                        className="text-xs font-black"
                        style={{ color: "#19E6FF" }}
                      >
                        {Math.floor(72 + i * 5)}%
                      </span>
                    </div>
                    <ScoreBar score={72 + i * 5} />
                  </div>
                </div>
                <button
                  type="button"
                  data-ocid={`friends.discover.add_button.${i + 1}`}
                  onClick={() => !isPending && handleAdd(profile)}
                  disabled={isPending}
                  className="flex-shrink-0 px-3 py-1.5 rounded-xl text-xs font-bold tracking-wide transition-all"
                  style={{
                    background: isPending
                      ? "rgba(167,172,190,0.1)"
                      : "rgba(25,230,255,0.12)",
                    border: `1px solid ${isPending ? "#2A3142" : "#19E6FF50"}`,
                    color: isPending ? "#A7ACBE" : "#19E6FF",
                  }}
                >
                  {isPending ? "Pending ⏳" : "+ Add"}
                </button>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}

// ── REQUESTS TAB ──────────────────────────────────────────────────────────────
function RequestsTab() {
  const { friendRequests, acceptFriendRequest, declineFriendRequest } =
    useOmniStore();

  const incoming = friendRequests.filter(
    (r) => r.direction === "incoming" && r.status === "pending",
  );
  const outgoing = friendRequests.filter(
    (r) => r.direction === "outgoing" && r.status === "pending",
  );

  const handleAccept = useCallback(
    (id: string) => {
      acceptFriendRequest(id);
      toast.success("Friend added! +15 OMNI 🎉");
    },
    [acceptFriendRequest],
  );
  const handleDecline = useCallback(
    (id: string) => {
      declineFriendRequest(id);
      toast("Request declined");
    },
    [declineFriendRequest],
  );
  const handleCancel = useCallback(
    (id: string) => {
      declineFriendRequest(id);
      toast("Request cancelled");
    },
    [declineFriendRequest],
  );

  return (
    <div className="space-y-5">
      <div>
        <p
          className="text-[11px] font-black tracking-[0.25em] uppercase mb-3"
          style={{ color: "#A7ACBE" }}
        >
          Incoming
          {incoming.length > 0 && (
            <span
              className="ml-2 px-1.5 py-0.5 rounded-full text-[9px]"
              style={{ background: "#19E6FF", color: "#06070B" }}
            >
              {incoming.length}
            </span>
          )}
        </p>
        {incoming.length === 0 ? (
          <div
            className="rounded-2xl p-6 text-center"
            data-ocid="friends.requests.incoming.empty_state"
            style={{ background: "#151A26", border: "1px solid #2A3142" }}
          >
            <p className="text-2xl mb-2">📭</p>
            <p className="text-sm" style={{ color: "#A7ACBE" }}>
              No incoming requests
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {incoming.map((req, i) => (
              <motion.div
                key={req.id}
                data-ocid={`friends.requests.incoming.item.${i + 1}`}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.07 }}
                className="rounded-2xl p-4"
                style={{ background: "#151A26", border: "1px solid #2A3142" }}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span
                        className="font-mono font-bold text-sm"
                        style={{ color: "#19E6FF" }}
                      >
                        {req.fromId}
                      </span>
                      {req.pulseMatch !== undefined && (
                        <span
                          className="text-[10px] px-2 py-0.5 rounded-full font-black"
                          style={{
                            background: "rgba(47,245,199,0.15)",
                            color: "#2FF5C7",
                          }}
                        >
                          ⚡ {req.pulseMatch}% match
                        </span>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-1 mt-2">
                      {req.sharedInterests.map((interest) => (
                        <span
                          key={interest}
                          className="text-[10px] px-2 py-0.5 rounded-full"
                          style={{
                            background: "rgba(181,107,255,0.12)",
                            color: "#B56BFF",
                            border: "1px solid #B56BFF30",
                          }}
                        >
                          {interest}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="flex gap-2 flex-shrink-0">
                    <button
                      type="button"
                      data-ocid={`friends.requests.accept_button.${i + 1}`}
                      onClick={() => handleAccept(req.id)}
                      className="px-3 py-1.5 rounded-xl text-xs font-bold"
                      style={{
                        background: "rgba(47,245,199,0.15)",
                        border: "1px solid #2FF5C740",
                        color: "#2FF5C7",
                      }}
                    >
                      Accept
                    </button>
                    <button
                      type="button"
                      data-ocid={`friends.requests.decline_button.${i + 1}`}
                      onClick={() => handleDecline(req.id)}
                      className="px-3 py-1.5 rounded-xl text-xs font-bold"
                      style={{
                        background: "rgba(255,79,79,0.12)",
                        border: "1px solid #FF4F4F30",
                        color: "#FF4F4F",
                      }}
                    >
                      Decline
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      <div>
        <p
          className="text-[11px] font-black tracking-[0.25em] uppercase mb-3"
          style={{ color: "#A7ACBE" }}
        >
          Outgoing
        </p>
        {outgoing.length === 0 ? (
          <div
            className="rounded-2xl p-6 text-center"
            data-ocid="friends.requests.outgoing.empty_state"
            style={{ background: "#151A26", border: "1px solid #2A3142" }}
          >
            <p className="text-2xl mb-2">📤</p>
            <p className="text-sm" style={{ color: "#A7ACBE" }}>
              No pending sent requests
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {outgoing.map((req, i) => (
              <div
                key={req.id}
                data-ocid={`friends.requests.outgoing.item.${i + 1}`}
                className="rounded-2xl p-4"
                style={{ background: "#151A26", border: "1px solid #2A3142" }}
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span
                        className="font-mono font-bold text-sm"
                        style={{ color: "#19E6FF" }}
                      >
                        {req.toId}
                      </span>
                      {req.pulseMatch !== undefined && (
                        <span
                          className="text-[10px] px-2 py-0.5 rounded-full font-black"
                          style={{
                            background: "rgba(25,230,255,0.1)",
                            color: "#19E6FF",
                          }}
                        >
                          ⚡ {req.pulseMatch}% match
                        </span>
                      )}
                    </div>
                    <p className="text-xs mt-1" style={{ color: "#6B7280" }}>
                      Awaiting response…
                    </p>
                  </div>
                  <button
                    type="button"
                    data-ocid={`friends.requests.cancel_button.${i + 1}`}
                    onClick={() => handleCancel(req.id)}
                    className="px-3 py-1.5 rounded-xl text-xs font-bold"
                    style={{
                      background: "rgba(167,172,190,0.08)",
                      border: "1px solid #2A3142",
                      color: "#A7ACBE",
                    }}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ── KİŞİLER TAB ──────────────────────────────────────────────────────────────
function KisilerTab({
  onOpenAddById,
  onOpenIDPaylaş,
}: {
  onOpenAddById: () => void;
  onOpenIDPaylaş: () => void;
}) {
  const {
    friends,
    setActiveModule,
    createConversation,
    setActiveConversation,
    privacyMode,
    removeFriend,
  } = useOmniStore();
  const [inviteTarget, setInviteTarget] = useState<string | null>(null);
  const [callTarget, setCallTarget] = useState<string | null>(null);
  const [callType, setCallType] = useState<"voice" | "video">("voice");
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);

  const handleMessage = useCallback(
    (friendId: string) => {
      const convId = createConversation(friendId);
      setActiveConversation(convId);
      setActiveModule("chat");
    },
    [createConversation, setActiveConversation, setActiveModule],
  );

  const handleCall = (friendId: string, type: "voice" | "video") => {
    setCallType(type);
    setCallTarget(friendId);
  };

  const handleInviteSend = useCallback((type: string) => {
    toast.success(`${type} invite sent! 🎉`);
    setInviteTarget(null);
  }, []);

  return (
    <div className="space-y-3">
      {privacyMode === "shadow" && (
        <div
          data-ocid="friends.shadow_warning.panel"
          className="flex items-center gap-2 px-3 py-2 rounded-xl text-[11px] font-medium"
          style={{
            background: "rgba(251,191,36,0.08)",
            border: "1px solid rgba(251,191,36,0.25)",
            color: "#FBBF24",
          }}
        >
          🌑 Shadow modunda çevrimiçi durumun arkadaşlarından gizli
        </div>
      )}
      {/* Top action buttons */}
      <div className="flex gap-2">
        <button
          type="button"
          data-ocid="friends.kisiler.id_share.button"
          onClick={onOpenIDPaylaş}
          className="flex-1 py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5"
          style={{
            background: "rgba(25,230,255,0.08)",
            border: "1px solid #19E6FF30",
            color: "#19E6FF",
          }}
        >
          📋 ID Paylaş
        </button>
        <button
          type="button"
          data-ocid="friends.kisiler.add_by_id.button"
          onClick={onOpenAddById}
          className="flex-1 py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5"
          style={{
            background: "rgba(181,107,255,0.08)",
            border: "1px solid #B56BFF30",
            color: "#B56BFF",
          }}
        >
          + ID ile Ekle
        </button>
      </div>

      <div className="flex items-center justify-between">
        <p
          className="text-[11px] font-black tracking-[0.25em] uppercase"
          style={{ color: "#A7ACBE" }}
        >
          {friends.length} Kişi
        </p>
      </div>

      {friends.length === 0 ? (
        <div
          className="rounded-2xl p-8 text-center"
          data-ocid="friends.kisiler.empty_state"
          style={{ background: "#151A26", border: "1px solid #2A3142" }}
        >
          <p className="text-3xl mb-3">👻</p>
          <p className="font-bold" style={{ color: "#F2F4FF" }}>
            Henüz kişi yok
          </p>
          <p className="text-sm mt-1" style={{ color: "#A7ACBE" }}>
            ID ile arkadaş ekle veya Keşfet'e bak
          </p>
          <button
            type="button"
            data-ocid="friends.kisiler.add_first.button"
            onClick={onOpenAddById}
            className="mt-4 px-6 py-2 rounded-xl text-xs font-bold"
            style={{
              background: "rgba(25,230,255,0.1)",
              border: "1px solid #19E6FF40",
              color: "#19E6FF",
            }}
          >
            + ID ile Ekle
          </button>
        </div>
      ) : (
        friends.map((friend, i) => {
          const timeLeft = friend.phantomExpiresAt
            ? friend.phantomExpiresAt - Date.now()
            : 0;
          return (
            <motion.div
              key={friend.id}
              data-ocid={`friends.kisiler.item.${i + 1}`}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.06 }}
              className="rounded-2xl p-4"
              style={{ background: "#151A26", border: "1px solid #2A3142" }}
            >
              <div className="flex items-start gap-3">
                {/* Avatar with online dot */}
                <div className="relative flex-shrink-0">
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl"
                    style={{
                      background: "rgba(25,230,255,0.06)",
                      border: `2px solid ${friend.isPhantom ? "#B56BFF" : "#19E6FF"}40`,
                      boxShadow: friend.isPhantom
                        ? "0 0 10px #B56BFF30"
                        : "0 0 10px #19E6FF20",
                    }}
                  >
                    {friend.mood}
                  </div>
                  {friend.lastSeen === "Online" && (
                    <span
                      className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2"
                      style={{ background: "#2FF5C7", borderColor: "#151A26" }}
                    />
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span
                      className="font-mono font-bold text-sm"
                      style={{ color: "#19E6FF" }}
                    >
                      {friend.friendId}
                    </span>
                    {friend.isPhantom && (
                      <span
                        className="text-[10px] px-2 py-0.5 rounded-full font-black"
                        style={{
                          background: "rgba(181,107,255,0.15)",
                          color: "#B56BFF",
                          border: "1px solid #B56BFF30",
                        }}
                      >
                        👻 PHANTOM
                      </span>
                    )}
                    <span
                      className="text-[10px] px-2 py-0.5 rounded-full font-black"
                      style={{
                        background: "rgba(25,230,255,0.1)",
                        color: "#19E6FF",
                      }}
                    >
                      ★ {friend.friendScore}
                    </span>
                  </div>
                  {friend.isPhantom && timeLeft > 0 && (
                    <p
                      className="text-[10px] mt-0.5 font-mono"
                      style={{ color: "#B56BFF" }}
                    >
                      ⏱ {formatTimeLeft(timeLeft)}
                    </p>
                  )}
                  <p
                    className="text-[11px] mt-0.5"
                    style={{ color: "#6B7280" }}
                  >
                    {friend.lastSeen}
                  </p>

                  {/* 4 action buttons */}
                  <div className="grid grid-cols-4 gap-1.5 mt-3">
                    {[
                      {
                        emoji: "💬",
                        label: "Sohbet",
                        action: () => handleMessage(friend.friendId),
                        ocid: `friends.kisiler.message_button.${i + 1}`,
                        color: "#19E6FF",
                      },
                      {
                        emoji: "📞",
                        label: "Ara",
                        action: () => handleCall(friend.friendId, "voice"),
                        ocid: `friends.kisiler.call_button.${i + 1}`,
                        color: "#2FF5C7",
                      },
                      {
                        emoji: "🎥",
                        label: "Görüntülü",
                        action: () => handleCall(friend.friendId, "video"),
                        ocid: `friends.kisiler.video_button.${i + 1}`,
                        color: "#B56BFF",
                      },
                      {
                        emoji: "✨",
                        label: "Davet",
                        action: () => setInviteTarget(friend.friendId),
                        ocid: `friends.kisiler.invite_button.${i + 1}`,
                        color: "#FFB547",
                      },
                      {
                        emoji: "🗑️",
                        label: "Sil",
                        action: () => setDeleteTarget(friend.friendId),
                        ocid: `friends.kisiler.delete_button.${i + 1}`,
                        color: "#FF4F4F",
                      },
                    ].map(({ emoji, label, action, ocid, color }) => (
                      <button
                        type="button"
                        key={label}
                        data-ocid={ocid}
                        onClick={action}
                        className="flex flex-col items-center gap-0.5 py-2 rounded-xl text-[10px] font-bold transition-all"
                        style={{
                          background: `${color}10`,
                          border: `1px solid ${color}25`,
                          color,
                          minHeight: "44px",
                        }}
                      >
                        <span>{emoji}</span>
                        <span>{label}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          );
        })
      )}

      {/* Call Modal */}
      <CallModal
        open={!!callTarget}
        onClose={() => setCallTarget(null)}
        targetId={callTarget ?? ""}
        initialType={callType}
      />

      {/* Delete Confirmation */}
      {deleteTarget && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center"
          style={{ background: "rgba(0,0,0,0.75)" }}
          data-ocid="friends.delete.dialog"
        >
          <div
            className="mx-4 w-full max-w-sm rounded-2xl p-6"
            style={{ background: "#0E1320", border: "1px solid #2A3142" }}
          >
            <div className="text-center mb-4">
              <div className="text-3xl mb-2">🗑️</div>
              <h3 className="font-bold text-base" style={{ color: "#F2F4FF" }}>
                Arkadaşı Sil
              </h3>
              <p className="text-xs mt-1" style={{ color: "#A7ACBE" }}>
                <span style={{ color: "#19E6FF" }}>{deleteTarget}</span> arkadaş
                listesinden kaldırılsın mı?
              </p>
            </div>
            <div className="flex gap-3">
              <button
                type="button"
                data-ocid="friends.delete.cancel_button"
                className="flex-1 py-2.5 rounded-xl text-sm font-bold"
                style={{
                  background: "rgba(167,172,190,0.1)",
                  color: "#A7ACBE",
                  border: "1px solid #2A3142",
                }}
                onClick={() => setDeleteTarget(null)}
              >
                İptal
              </button>
              <button
                type="button"
                data-ocid="friends.delete.confirm_button"
                className="flex-1 py-2.5 rounded-xl text-sm font-bold"
                style={{
                  background: "rgba(255,79,79,0.15)",
                  color: "#FF4F4F",
                  border: "1px solid rgba(255,79,79,0.3)",
                }}
                onClick={() => {
                  removeFriend(
                    deleteTarget as import("@/lib/mockData").AnonymousID,
                  );
                  toast.success("Arkadaş silindi");
                  setDeleteTarget(null);
                }}
              >
                Sil
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Invite Modal */}
      <Dialog
        open={!!inviteTarget}
        onOpenChange={(open) => !open && setInviteTarget(null)}
      >
        <DialogContent
          data-ocid="friends.invite.dialog"
          style={{ background: "#151A26", border: "1px solid #2A3142" }}
        >
          <DialogHeader>
            <DialogTitle style={{ color: "#F2F4FF" }}>
              Shared Experience
            </DialogTitle>
            <p className="text-xs mt-1" style={{ color: "#A7ACBE" }}>
              Invite {inviteTarget} to a shared experience
            </p>
          </DialogHeader>
          <div className="space-y-3 mt-2">
            {[
              {
                emoji: "🎮",
                label: "Mini-Game",
                desc: "Anonymous competitive game",
              },
              {
                emoji: "📖",
                label: "Interactive Story",
                desc: "Co-write a story together",
              },
              {
                emoji: "💓",
                label: "Pulse Share",
                desc: "Share live mood & vibe",
              },
            ].map(({ emoji, label, desc }) => (
              <button
                type="button"
                key={label}
                data-ocid={`friends.invite.${label.toLowerCase().replace(/ /g, "_")}.button`}
                onClick={() => handleInviteSend(label)}
                className="w-full flex items-center gap-3 p-4 rounded-xl text-left transition-all"
                style={{
                  background: "rgba(25,230,255,0.05)",
                  border: "1px solid #2A3142",
                }}
              >
                <span className="text-2xl">{emoji}</span>
                <div>
                  <p className="font-bold text-sm" style={{ color: "#F2F4FF" }}>
                    {label}
                  </p>
                  <p className="text-xs" style={{ color: "#A7ACBE" }}>
                    {desc}
                  </p>
                </div>
              </button>
            ))}
          </div>
          <button
            type="button"
            data-ocid="friends.invite.close_button"
            onClick={() => setInviteTarget(null)}
            className="mt-2 w-full py-2 rounded-xl text-xs font-bold"
            style={{
              background: "rgba(167,172,190,0.08)",
              border: "1px solid #2A3142",
              color: "#A7ACBE",
            }}
          >
            Cancel
          </button>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ── ARAMALAR TAB ──────────────────────────────────────────────────────────────
function AramalarTab({ onOpenAddById }: { onOpenAddById: () => void }) {
  const { callLogs } = useOmniStore();
  const [filter, setFilter] = useState<"all" | "missed">("all");
  const [callTarget, setCallTarget] = useState<string | null>(null);
  const [callType, setCallType] = useState<"voice" | "video">("voice");

  const filtered =
    filter === "missed"
      ? callLogs.filter((c) => c.status === "missed")
      : callLogs;

  const handleCallback = (log: CallLog) => {
    setCallType(log.type);
    setCallTarget(log.contactId);
  };

  return (
    <div className="space-y-3">
      {/* Filter tabs */}
      <div className="flex gap-1">
        {(["all", "missed"] as const).map((f) => (
          <button
            type="button"
            key={f}
            data-ocid={`friends.aramalar.${f}.tab`}
            onClick={() => setFilter(f)}
            className="px-4 py-1.5 rounded-xl text-xs font-bold transition-all"
            style={{
              background:
                filter === f
                  ? "rgba(25,230,255,0.12)"
                  : "rgba(255,255,255,0.03)",
              border: `1px solid ${filter === f ? "#19E6FF30" : "transparent"}`,
              color: filter === f ? "#19E6FF" : "#A7ACBE",
            }}
          >
            {f === "all" ? "Tümü" : "Cevapsız"}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div
          className="rounded-2xl p-10 text-center"
          data-ocid="friends.aramalar.empty_state"
          style={{ background: "#151A26", border: "1px solid #2A3142" }}
        >
          <p className="text-4xl mb-3">📞</p>
          <p className="font-bold" style={{ color: "#F2F4FF" }}>
            Henüz arama yok
          </p>
          <p className="text-sm mt-1" style={{ color: "#A7ACBE" }}>
            Kişiler sekmesinden arama yapabilirsin
          </p>
          <button
            type="button"
            data-ocid="friends.aramalar.first_call.button"
            onClick={onOpenAddById}
            className="mt-4 px-6 py-2.5 rounded-xl text-xs font-bold"
            style={{
              background: "rgba(25,230,255,0.1)",
              border: "1px solid #19E6FF40",
              color: "#19E6FF",
            }}
          >
            İlk Aramayı Yap
          </button>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((log, i) => {
            const isAnswered = log.status === "answered";
            const isMissed = log.status === "missed";
            return (
              <motion.div
                key={log.id}
                data-ocid={`friends.aramalar.item.${i + 1}`}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.04 }}
                className="rounded-2xl p-4 flex items-center gap-3"
                style={{ background: "#151A26", border: "1px solid #2A3142" }}
              >
                {/* Call type icon */}
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center text-lg flex-shrink-0"
                  style={{
                    background: isAnswered
                      ? "rgba(47,245,199,0.1)"
                      : "rgba(255,79,79,0.1)",
                    border: `1px solid ${isAnswered ? "#2FF5C730" : "#FF4F4F30"}`,
                  }}
                >
                  {log.type === "voice" ? "📞" : "🎥"}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span
                      className="font-mono font-bold text-sm"
                      style={{ color: "#19E6FF" }}
                    >
                      {log.contactId}
                    </span>
                    <span className="text-sm">
                      {log.direction === "outgoing" ? "↗" : "↙"}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span
                      className="text-[10px] font-bold"
                      style={{
                        color: isAnswered
                          ? "#2FF5C7"
                          : isMissed
                            ? "#FF4F4F"
                            : "#A7ACBE",
                      }}
                    >
                      {isAnswered
                        ? "Yanıtlandı"
                        : isMissed
                          ? "Cevapsız"
                          : "Reddedildi"}
                    </span>
                    {isAnswered && log.duration !== undefined && (
                      <span
                        className="text-[10px]"
                        style={{ color: "#6B7280" }}
                      >
                        • {formatDuration(log.duration)}
                      </span>
                    )}
                    <span className="text-[10px]" style={{ color: "#6B7280" }}>
                      • {formatRelativeTime(log.timestamp)}
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  data-ocid={`friends.aramalar.callback_button.${i + 1}`}
                  onClick={() => handleCallback(log)}
                  className="px-3 py-1.5 rounded-xl text-xs font-bold flex-shrink-0"
                  style={{
                    background: "rgba(25,230,255,0.1)",
                    border: "1px solid #19E6FF30",
                    color: "#19E6FF",
                  }}
                >
                  Geri Ara
                </button>
              </motion.div>
            );
          })}
        </div>
      )}

      <CallModal
        open={!!callTarget}
        onClose={() => setCallTarget(null)}
        targetId={callTarget ?? ""}
        initialType={callType}
      />
    </div>
  );
}

// ── PULSE (NABIZ) TAB ─────────────────────────────────────────────────────────
function PulseTab() {
  const { pulses, addPulse, sendFriendRequest, friendRequests } =
    useOmniStore();
  const [content, setContent] = useState("");
  const [selectedEmoji, setSelectedEmoji] = useState(EMOJIS[0]);
  const [selectedMood, setSelectedMood] = useState(MOODS[0]);
  const [liveMood, setLiveMood] = useState<ReturnType<
    typeof analyzeMood
  > | null>(null);
  const [myPulseMatches, setMyPulseMatches] = useState<string[]>([]);

  useEffect(() => {
    if (content.length > 3) setLiveMood(analyzeMood(content));
    else setLiveMood(null);
  }, [content]);

  const pendingOutgoing = friendRequests
    .filter((r) => r.direction === "outgoing" && r.status === "pending")
    .map((r) => r.toId);

  const handleBroadcast = useCallback(() => {
    if (!content.trim()) return;
    addPulse(content.trim(), selectedEmoji, selectedMood);
    setMyPulseMatches(
      ["+777 1129 476", "+777 8844 331", "+777 5521 763"].slice(
        0,
        2 + Math.floor(Math.random() * 2),
      ),
    );
    setContent("");
    toast.success("Pulse broadcast! +3 OMNI 📡");
  }, [content, selectedEmoji, selectedMood, addPulse]);

  const handleConnect = useCallback(
    (targetId: string) => {
      sendFriendRequest(targetId, [], Math.floor(60 + Math.random() * 40));
      toast.success(`Friend request sent to ${targetId}`);
    },
    [sendFriendRequest],
  );

  return (
    <div className="space-y-5">
      <div
        className="rounded-2xl p-4"
        style={{ background: "#151A26", border: "1px solid #2A3142" }}
      >
        <p
          className="text-[11px] font-black tracking-[0.25em] uppercase mb-3"
          style={{ color: "#A7ACBE" }}
        >
          My Pulse
        </p>
        <div className="flex gap-2 mb-3 flex-wrap">
          {EMOJIS.map((e) => (
            <button
              type="button"
              key={e}
              data-ocid="friends.pulse.emoji.toggle"
              onClick={() => setSelectedEmoji(e)}
              className="w-8 h-8 rounded-lg text-lg transition-all"
              style={{
                background:
                  selectedEmoji === e
                    ? "rgba(25,230,255,0.15)"
                    : "rgba(255,255,255,0.04)",
                border: `1px solid ${selectedEmoji === e ? "#19E6FF60" : "#2A3142"}`,
                transform: selectedEmoji === e ? "scale(1.15)" : "scale(1)",
              }}
            >
              {e}
            </button>
          ))}
        </div>
        <Select value={selectedMood} onValueChange={setSelectedMood}>
          <SelectTrigger
            data-ocid="friends.pulse.mood.select"
            className="mb-3 text-sm"
            style={{
              background: "#0D1118",
              border: "1px solid #2A3142",
              color: "#F2F4FF",
            }}
          >
            <SelectValue />
          </SelectTrigger>
          <SelectContent
            style={{ background: "#151A26", border: "1px solid #2A3142" }}
          >
            {MOODS.map((m) => (
              <SelectItem key={m} value={m} style={{ color: "#F2F4FF" }}>
                {m}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <div className="relative">
          <Input
            data-ocid="friends.pulse.input"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Share your vibe, mood, or thought…"
            className="text-sm pr-24"
            style={{
              background: "#0D1118",
              border: "1px solid #2A3142",
              color: "#F2F4FF",
            }}
          />
          {liveMood && (
            <span
              className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] px-2 py-0.5 rounded-full font-bold"
              style={{
                background: `${liveMood.color}20`,
                color: liveMood.color,
                border: `1px solid ${liveMood.color}40`,
              }}
            >
              {liveMood.emoji} {liveMood.mood}
            </span>
          )}
        </div>
        <button
          type="button"
          data-ocid="friends.pulse.broadcast_button"
          onClick={handleBroadcast}
          disabled={!content.trim()}
          className="w-full mt-3 py-2.5 rounded-xl text-sm font-black tracking-[0.15em] uppercase transition-all"
          style={{
            background: content.trim()
              ? "linear-gradient(135deg, rgba(25,230,255,0.15), rgba(181,107,255,0.15))"
              : "rgba(167,172,190,0.05)",
            border: `1px solid ${content.trim() ? "#19E6FF40" : "#2A3142"}`,
            color: content.trim() ? "#19E6FF" : "#4A5568",
          }}
        >
          📡 Broadcast Pulse (+3 OMNI)
        </button>
      </div>

      {myPulseMatches.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl p-4 space-y-3"
          style={{
            background: "rgba(47,245,199,0.05)",
            border: "1px solid #2FF5C730",
          }}
        >
          <p
            className="text-[11px] font-black tracking-[0.2em] uppercase"
            style={{ color: "#2FF5C7" }}
          >
            ⚡ AI Matched You With
          </p>
          {myPulseMatches.map((id) => (
            <div key={id} className="flex items-center justify-between">
              <span className="font-mono text-sm" style={{ color: "#19E6FF" }}>
                {id}
              </span>
              <button
                type="button"
                onClick={() =>
                  !pendingOutgoing.includes(id) && handleConnect(id)
                }
                disabled={pendingOutgoing.includes(id)}
                className="px-3 py-1 rounded-xl text-xs font-bold"
                style={{
                  background: pendingOutgoing.includes(id)
                    ? "rgba(167,172,190,0.08)"
                    : "rgba(47,245,199,0.15)",
                  color: pendingOutgoing.includes(id) ? "#A7ACBE" : "#2FF5C7",
                  border: "1px solid transparent",
                }}
              >
                {pendingOutgoing.includes(id) ? "Pending ⏳" : "+ Add"}
              </button>
            </div>
          ))}
        </motion.div>
      )}

      <div>
        <p
          className="text-[11px] font-black tracking-[0.25em] uppercase mb-3"
          style={{ color: "#A7ACBE" }}
        >
          Pulse Feed
        </p>
        <div className="space-y-3">
          {pulses.map((pulse, i) => {
            const timeLeft = pulse.expiresAt - Date.now();
            return (
              <motion.div
                key={pulse.id}
                data-ocid={`friends.pulse.item.${i + 1}`}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.08 }}
                className="rounded-2xl p-4"
                style={{ background: "#151A26", border: "1px solid #2A3142" }}
              >
                <div className="flex items-start gap-3">
                  <span className="text-2xl">{pulse.emoji}</span>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span
                        className="font-mono text-xs font-bold"
                        style={{ color: "#19E6FF" }}
                      >
                        {pulse.authorId}
                      </span>
                      <span
                        className="text-[10px] px-2 py-0.5 rounded-full font-bold"
                        style={{
                          background: "rgba(181,107,255,0.12)",
                          color: "#B56BFF",
                        }}
                      >
                        {pulse.mood}
                      </span>
                    </div>
                    <p className="text-sm mt-1.5" style={{ color: "#F2F4FF" }}>
                      {pulse.content}
                    </p>
                    <div className="flex items-center justify-between mt-2">
                      <span
                        className="text-[10px]"
                        style={{ color: "#6B7280" }}
                      >
                        ⏱ {formatTimeLeft(timeLeft)}
                      </span>
                      <button
                        type="button"
                        data-ocid={`friends.pulse.connect_button.${i + 1}`}
                        onClick={() =>
                          !pendingOutgoing.includes(pulse.authorId) &&
                          handleConnect(pulse.authorId)
                        }
                        disabled={pendingOutgoing.includes(pulse.authorId)}
                        className="px-3 py-1 rounded-xl text-xs font-bold"
                        style={{
                          background: pendingOutgoing.includes(pulse.authorId)
                            ? "rgba(167,172,190,0.08)"
                            : "rgba(25,230,255,0.1)",
                          color: pendingOutgoing.includes(pulse.authorId)
                            ? "#A7ACBE"
                            : "#19E6FF",
                          border: "1px solid transparent",
                        }}
                      >
                        {pendingOutgoing.includes(pulse.authorId)
                          ? "Pending ⏳"
                          : "Connect"}
                      </button>
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ── MAIN MODULE ───────────────────────────────────────────────────────────────
export function FriendsModule() {
  const [activeTab, setActiveTab] = useState<
    "discover" | "requests" | "kisiler" | "aramalar" | "nabiz" | "rehber"
  >("discover");
  const {
    friendRequests,
    identities,
    activeIdentityId,
    privacyMode,
    updatePrivacyMode,
    myId,
  } = useOmniStore();
  const [addByIdOpen, setAddByIdOpen] = useState(false);
  const [idPaylaşOpen, setIdPaylaşOpen] = useState(false);

  const pendingCount = friendRequests.filter(
    (r) => r.direction === "incoming" && r.status === "pending",
  ).length;

  const TABS = [
    { key: "discover", label: "Keşfet" },
    { key: "rehber", label: "Rehber" },
    {
      key: "requests",
      label: `İstekler${pendingCount > 0 ? ` (${pendingCount})` : ""}`,
    },
    { key: "kisiler", label: "Kişiler" },
    { key: "aramalar", label: "Aramalar" },
    { key: "nabiz", label: "Nabız" },
  ] as const;

  const PRIVACY_MODES_F: PrivacyMode[] = ["normal", "ghost", "shadow"];
  const PRIVACY_COLORS_F: Record<PrivacyMode, string> = {
    normal: "#19E6FF",
    ghost: "#B56BFF",
    shadow: "#6B7280",
  };
  const PRIVACY_LABELS_F: Record<PrivacyMode, string> = {
    normal: "NORMAL",
    ghost: "GHOST",
    shadow: "SHADOW",
  };
  const PRIVACY_GLOWS_F: Record<PrivacyMode, string> = {
    normal: "0 0 8px rgba(25,230,255,0.4)",
    ghost: "0 0 8px rgba(181,107,255,0.4)",
    shadow: "0 0 8px rgba(107,114,128,0.4)",
  };
  const activeIdentityF = identities.find((i) => i.id === activeIdentityId);
  const displayIdF = activeIdentityF?.id ?? myId ?? "+777 0000 0000";
  const displayEmojiF = activeIdentityF?.emoji ?? "👤";
  const displayNickF = activeIdentityF?.nickname;

  function cycleFriendsPrivacyMode() {
    if (!activeIdentityId) return;
    const idx = PRIVACY_MODES_F.indexOf(privacyMode);
    const next = PRIVACY_MODES_F[(idx + 1) % PRIVACY_MODES_F.length];
    updatePrivacyMode(activeIdentityId, next);
    const modeNames: Record<PrivacyMode, string> = {
      normal: "Normal",
      ghost: "Ghost",
      shadow: "Shadow",
    };
    toast(`Gizlilik modu: ${modeNames[next]}`);
  }

  function FriendsIdentityBar() {
    return (
      <div
        data-ocid="friends.identity_bar.panel"
        className="flex items-center justify-between px-3 py-2 flex-shrink-0"
        style={{
          background: "rgba(20,26,42,0.95)",
          borderBottom: "1px solid #1A2030",
          minHeight: "40px",
        }}
      >
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-sm">{displayEmojiF}</span>
          <span
            className="text-xs font-mono truncate"
            style={{ color: "#A7ACBE", maxWidth: "130px" }}
          >
            {displayNickF ?? displayIdF}
          </span>
        </div>
        <button
          type="button"
          data-ocid="friends.privacy_mode.toggle"
          onClick={cycleFriendsPrivacyMode}
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black tracking-widest uppercase transition-all active:scale-95"
          style={{
            background: `rgba(${privacyMode === "normal" ? "25,230,255" : privacyMode === "ghost" ? "181,107,255" : "107,114,128"},0.12)`,
            border: `1px solid ${PRIVACY_COLORS_F[privacyMode]}40`,
            color: PRIVACY_COLORS_F[privacyMode],
            boxShadow: PRIVACY_GLOWS_F[privacyMode],
          }}
        >
          {privacyMode === "normal"
            ? "●"
            : privacyMode === "ghost"
              ? "👻"
              : "🌑"}{" "}
          {PRIVACY_LABELS_F[privacyMode]}
        </button>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col" style={{ background: "transparent" }}>
      {/* Header with action buttons */}
      <div
        className="flex items-center justify-between px-4 pt-3 pb-1 flex-shrink-0"
        style={{ background: "rgba(6,7,11,0.8)" }}
      >
        <p
          className="text-[11px] font-black tracking-[0.3em] uppercase"
          style={{ color: "#A7ACBE" }}
        >
          OMNI Friends
        </p>
        <div className="flex gap-2">
          <button
            type="button"
            data-ocid="friends.header.id_share.button"
            onClick={() => setIdPaylaşOpen(true)}
            className="px-3 py-1.5 rounded-xl text-[11px] font-bold flex items-center gap-1"
            style={{
              background: "rgba(25,230,255,0.08)",
              border: "1px solid #19E6FF30",
              color: "#19E6FF",
            }}
          >
            📋 ID'mi Paylaş
          </button>
          <button
            type="button"
            data-ocid="friends.header.add_by_id.button"
            onClick={() => setAddByIdOpen(true)}
            className="px-3 py-1.5 rounded-xl text-[11px] font-bold flex items-center gap-1"
            style={{
              background: "rgba(181,107,255,0.08)",
              border: "1px solid #B56BFF30",
              color: "#B56BFF",
            }}
          >
            🔍 + ID Ekle
          </button>
        </div>
      </div>

      <FriendsIdentityBar />

      {/* Tab bar */}
      <div
        className="flex gap-0.5 px-3 py-2 flex-shrink-0 overflow-x-auto scrollbar-hide"
        style={{
          background: "rgba(6,7,11,0.8)",
          borderBottom: "1px solid #1A2030",
        }}
      >
        {TABS.map(({ key, label }) => (
          <button
            type="button"
            key={key}
            data-ocid={`friends.${key}.tab`}
            onClick={() => setActiveTab(key)}
            className="flex-shrink-0 px-3 py-1.5 rounded-xl text-[10px] font-bold tracking-wider uppercase transition-all"
            style={{
              background:
                activeTab === key
                  ? "rgba(25,230,255,0.12)"
                  : "rgba(255,255,255,0.03)",
              border: `1px solid ${activeTab === key ? "#19E6FF30" : "transparent"}`,
              color: activeTab === key ? "#19E6FF" : "#A7ACBE",
            }}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div
        className="flex-1 overflow-y-auto scrollbar-hide px-4 py-4"
        style={{ minHeight: 0 }}
      >
        {activeTab === "discover" && <DiscoverTab />}
        {activeTab === "requests" && <RequestsTab />}
        {activeTab === "kisiler" && (
          <KisilerTab
            onOpenAddById={() => setAddByIdOpen(true)}
            onOpenIDPaylaş={() => setIdPaylaşOpen(true)}
          />
        )}
        {activeTab === "aramalar" && (
          <AramalarTab onOpenAddById={() => setAddByIdOpen(true)} />
        )}
        {activeTab === "nabiz" && <PulseTab />}
        {activeTab === "rehber" && <ContactDiscovery />}
      </div>

      {/* FAB */}
      <button
        type="button"
        data-ocid="friends.fab.button"
        onClick={() => setAddByIdOpen(true)}
        className="fixed bottom-24 right-5 w-14 h-14 rounded-full flex items-center justify-center text-2xl font-black shadow-2xl z-40 transition-all active:scale-95"
        style={{
          background: "linear-gradient(135deg, #19E6FF, #B56BFF)",
          boxShadow:
            "0 0 24px rgba(25,230,255,0.4), 0 0 48px rgba(181,107,255,0.2)",
        }}
      >
        +
      </button>

      {/* Global Modals */}
      <AddByIdModal open={addByIdOpen} onClose={() => setAddByIdOpen(false)} />
      <IDPaylaşModal
        open={idPaylaşOpen}
        onClose={() => setIdPaylaşOpen(false)}
      />
    </div>
  );
}
