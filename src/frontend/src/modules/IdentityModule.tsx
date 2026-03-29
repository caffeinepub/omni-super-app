import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useICPIdentity } from "@/context/ICPIdentityContext";
import {
  EMOJI_OPTIONS,
  type IDType,
  MOCK_MARKETPLACE,
  NEARBY_USERS,
  type OmniIdentity,
  type PrivacyMode,
  simulateSignature,
} from "@/lib/identitySystem";
import { useOmniStore } from "@/lib/omniStore";
import {
  Check,
  Copy,
  Eye,
  EyeOff,
  Fingerprint,
  Key,
  Loader2,
  MoreVertical,
  Plus,
  QrCode,
  RefreshCw,
  Search,
  Share2,
  Shield,
  ShieldCheck,
  Star,
  Trash2,
  TrendingUp,
  Zap,
} from "lucide-react";
import { useCallback, useMemo, useState } from "react";
import { toast } from "sonner";

const CARD_STYLE: React.CSSProperties = {
  background: "rgba(255,255,255,0.03)",
  border: "1px solid #1A2030",
  borderRadius: "12px",
  padding: "14px",
};

const GLOW_CYAN = "0 0 20px rgba(25,230,255,0.25)";
function formatKey(key: string): string {
  return key.match(/.{1,8}/g)?.join(" ") ?? key;
}

function formatFingerprint(fp: string): string {
  return fp.match(/.{1,4}/g)?.join(":") ?? fp;
}

function getTimeLeft(expiresAt?: number): string {
  if (!expiresAt) return "";
  const diff = expiresAt - Date.now();
  if (diff <= 0) return "Süresi doldu";
  const h = Math.floor(diff / 3600000);
  const m = Math.floor((diff % 3600000) / 60000);
  if (h > 24) return `${Math.floor(h / 24)}g kaldı`;
  return `${h}s ${m}d kaldı`;
}

function getRarityColor(rarity: string) {
  if (rarity === "legendary") return "linear-gradient(90deg, #FFD700, #FF8C00)";
  if (rarity === "rare") return "#19E6FF";
  return "#6B7280";
}

function getRarityLabel(rarity: string) {
  if (rarity === "legendary") return "Efsanevi";
  if (rarity === "rare") return "Nadir";
  return "Yaygın";
}

function QRCodeDisplay({ idStr }: { idStr: string }) {
  const gridData = useMemo(() => {
    let seed = 0;
    for (let i = 0; i < idStr.length; i++)
      seed += idStr.charCodeAt(i) * (i + 7);
    const cells: boolean[] = [];
    for (let i = 0; i < 144; i++) {
      seed = (seed * 1664525 + 1013904223) & 0xffffffff;
      cells.push((seed >> 16) % 3 !== 0);
    }
    // Force corners (finder pattern)
    for (const i of [
      0, 1, 2, 3, 4, 5, 6, 12, 18, 24, 30, 36, 6, 13, 20, 27, 34, 41,
    ]) {
      cells[i] = true;
    }
    return cells.map((cellOn, idx) => ({ on: cellOn, id: idx }));
  }, [idStr]);

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(12, 1fr)",
        gap: 2,
        width: 156,
        height: 156,
      }}
    >
      {gridData.map(({ on, id }) => (
        <div
          key={id}
          style={{
            background: on ? "#19E6FF" : "transparent",
            borderRadius: 1,
          }}
        />
      ))}
    </div>
  );
}

function ReputationGauge({ score }: { score: number }) {
  const radius = 52;
  const circ = 2 * Math.PI * radius;
  const dash = (score / 100) * circ;
  const label = score >= 80 ? "Güvenilir" : score >= 50 ? "Orta" : "Düşük";
  const color = score >= 80 ? "#00FF88" : score >= 50 ? "#19E6FF" : "#FF4F4F";

  return (
    <div className="flex flex-col items-center gap-2">
      <div style={{ position: "relative", width: 130, height: 130 }}>
        <svg
          width={130}
          height={130}
          style={{ transform: "rotate(-90deg)" }}
          aria-labelledby="gauge-title"
        >
          <title id="gauge-title">Reputation Gauge</title>
          <circle
            cx={65}
            cy={65}
            r={radius}
            fill="none"
            stroke="#1A2030"
            strokeWidth={10}
          />
          <circle
            cx={65}
            cy={65}
            r={radius}
            fill="none"
            stroke={color}
            strokeWidth={10}
            strokeDasharray={`${dash} ${circ - dash}`}
            strokeLinecap="round"
            style={{
              filter: `drop-shadow(0 0 6px ${color})`,
              transition: "stroke-dasharray 0.5s",
            }}
          />
        </svg>
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <span
            style={{
              color,
              fontSize: 28,
              fontWeight: 800,
              fontFamily: "monospace",
            }}
          >
            {score}
          </span>
          <span style={{ color: "#6B7280", fontSize: 10 }}>{label}</span>
        </div>
      </div>
    </div>
  );
}

// ── TAB 1: My IDs ─────────────────────────────────────────────────────────────
function MyIDsTab() {
  const {
    identities,
    activeIdentityId,
    switchIdentity,
    createIdentity,
    deleteIdentity,
  } = useOmniStore();
  const { isPremium } = useOmniStore();
  const [showCreate, setShowCreate] = useState(false);
  const [idType, setIdType] = useState<IDType>("permanent");
  const [nickname, setNickname] = useState("");
  const [selectedEmoji, setSelectedEmoji] = useState(EMOJI_OPTIONS[0]);
  const [useCustom, setUseCustom] = useState(false);
  const [customSuffix, setCustomSuffix] = useState("");
  const [menuId, setMenuId] = useState<string | null>(null);

  const handleCreate = () => {
    const identity = createIdentity(
      idType,
      nickname || undefined,
      selectedEmoji,
      useCustom ? customSuffix : undefined,
    );
    if (identities.length === 0) switchIdentity(identity.id);
    setShowCreate(false);
    setNickname("");
    setCustomSuffix("");
    toast.success("Yeni kimlik oluşturuldu!");
  };

  const handleCopy = (id: string) => {
    navigator.clipboard.writeText(id).catch(() => {});
    toast.success("Kopyalandı!");
  };

  return (
    <div className="flex flex-col gap-3 p-4" style={{ paddingBottom: 80 }}>
      {identities.map((identity) => {
        const isActive = identity.id === activeIdentityId;
        return (
          <div
            key={identity.id}
            data-ocid={`identity.item.${identities.indexOf(identity) + 1}`}
            style={{
              ...CARD_STYLE,
              border: isActive ? "1px solid #19E6FF" : "1px solid #1A2030",
              boxShadow: isActive ? GLOW_CYAN : "none",
              position: "relative",
            }}
          >
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-2">
                <span style={{ fontSize: 28 }}>{identity.emoji}</span>
                <div>
                  {identity.nickname && (
                    <div
                      style={{
                        color: "#A7ACBE",
                        fontSize: 11,
                        marginBottom: 2,
                      }}
                    >
                      {identity.nickname}
                    </div>
                  )}
                  <div
                    style={{
                      fontFamily: "monospace",
                      color: "#19E6FF",
                      fontSize: 17,
                      fontWeight: 700,
                      letterSpacing: 1,
                    }}
                  >
                    {identity.id}
                  </div>
                  <div className="flex items-center gap-1.5 mt-1">
                    <Badge
                      style={{
                        background:
                          identity.type === "permanent"
                            ? "rgba(25,230,255,0.12)"
                            : "rgba(181,107,255,0.12)",
                        color:
                          identity.type === "permanent" ? "#19E6FF" : "#B56BFF",
                        fontSize: 9,
                        padding: "1px 6px",
                      }}
                    >
                      {identity.type === "permanent"
                        ? "PERM"
                        : identity.type === "temp_24h"
                          ? "TEMP 24S"
                          : "TEMP 7G"}
                    </Badge>
                    <Badge
                      style={{
                        background: "rgba(255,255,255,0.05)",
                        color:
                          identity.privacyMode === "ghost"
                            ? "#B56BFF"
                            : identity.privacyMode === "shadow"
                              ? "#FF4F4F"
                              : "#6B7280",
                        fontSize: 9,
                        padding: "1px 6px",
                      }}
                    >
                      {identity.privacyMode === "ghost"
                        ? "👻 GHOST"
                        : identity.privacyMode === "shadow"
                          ? "🌑 SHADOW"
                          : "NORMAL"}
                    </Badge>
                    {identity.expiresAt && (
                      <span style={{ color: "#FF8C00", fontSize: 9 }}>
                        {getTimeLeft(identity.expiresAt)}
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <button
                type="button"
                data-ocid={`identity.edit_button.${identities.indexOf(identity) + 1}`}
                onClick={() =>
                  setMenuId(menuId === identity.id ? null : identity.id)
                }
                style={{ color: "#4A5568", padding: 4 }}
              >
                <MoreVertical size={16} />
              </button>
            </div>

            {/* Reputation bar */}
            <div className="mt-3">
              <div className="flex justify-between items-center mb-1">
                <span style={{ color: "#6B7280", fontSize: 10 }}>
                  İtibar Skoru
                </span>
                <span
                  style={{
                    color: "#00FF88",
                    fontSize: 10,
                    fontFamily: "monospace",
                  }}
                >
                  {identity.reputationScore}/100
                </span>
              </div>
              <Progress
                value={identity.reputationScore}
                className="h-1"
                style={{ background: "#1A2030" }}
              />
            </div>

            {!isActive && (
              <Button
                size="sm"
                data-ocid={`identity.primary_button.${identities.indexOf(identity) + 1}`}
                onClick={() => switchIdentity(identity.id)}
                className="mt-3 w-full"
                style={{
                  background: "rgba(25,230,255,0.1)",
                  color: "#19E6FF",
                  border: "1px solid #19E6FF40",
                  fontSize: 11,
                }}
              >
                Aktif Yap
              </Button>
            )}
            {isActive && (
              <div className="mt-3 flex items-center gap-1.5">
                <Check size={12} style={{ color: "#00FF88" }} />
                <span style={{ color: "#00FF88", fontSize: 11 }}>
                  Aktif Kimlik
                </span>
              </div>
            )}

            {/* Kebab menu */}
            {menuId === identity.id && (
              <div
                style={{
                  position: "absolute",
                  right: 36,
                  top: 8,
                  zIndex: 50,
                  background: "#0B1020",
                  border: "1px solid #1A2030",
                  borderRadius: 8,
                  overflow: "hidden",
                  minWidth: 140,
                }}
              >
                {[
                  {
                    label: "Kopyala",
                    icon: <Copy size={12} />,
                    action: () => {
                      handleCopy(identity.id);
                      setMenuId(null);
                    },
                  },
                  {
                    label: "Paylaş",
                    icon: <Share2 size={12} />,
                    action: () => {
                      toast.info("Paylaşım linki kopyalandı");
                      setMenuId(null);
                    },
                  },
                  {
                    label: "Transfer",
                    icon: <TrendingUp size={12} />,
                    action: () => {
                      toast.info("Transfer özelliği yakında");
                      setMenuId(null);
                    },
                  },
                  {
                    label: "Sil",
                    icon: <Trash2 size={12} />,
                    action: () => {
                      if (identity.id !== activeIdentityId) {
                        deleteIdentity(identity.id);
                        toast.success("Kimlik silindi");
                      } else {
                        toast.error("Aktif kimliği silemezsiniz");
                      }
                      setMenuId(null);
                    },
                  },
                ].map((item) => (
                  <button
                    key={item.label}
                    type="button"
                    onClick={item.action}
                    className="flex items-center gap-2 w-full px-3 py-2 text-left hover:bg-white/5 transition-colors"
                    style={{
                      color: item.label === "Sil" ? "#FF4F4F" : "#A7ACBE",
                      fontSize: 12,
                    }}
                  >
                    {item.icon} {item.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        );
      })}

      {identities.length === 0 && (
        <div
          data-ocid="identity.empty_state"
          style={{ textAlign: "center", color: "#4A5568", padding: "40px 0" }}
        >
          <Shield
            size={40}
            style={{ margin: "0 auto 12px", color: "#1A2030" }}
          />
          <p style={{ fontSize: 14 }}>Henüz kimlik yok</p>
          <p style={{ fontSize: 12, marginTop: 4 }}>İlk kimliğini oluştur</p>
        </div>
      )}

      {/* FAB */}
      <button
        type="button"
        data-ocid="identity.open_modal_button"
        onClick={() => setShowCreate(true)}
        style={{
          position: "fixed",
          bottom: 88,
          right: 20,
          zIndex: 40,
          width: 52,
          height: 52,
          borderRadius: "50%",
          background: "linear-gradient(135deg, #19E6FF, #B56BFF)",
          border: "none",
          color: "white",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          boxShadow: "0 0 20px rgba(25,230,255,0.4)",
        }}
      >
        <Plus size={22} />
      </button>

      {/* Create dialog */}
      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent
          data-ocid="identity.dialog"
          style={{
            background: "#0B1020",
            border: "1px solid #1A2030",
            borderRadius: 16,
            maxWidth: 360,
          }}
        >
          <DialogHeader>
            <DialogTitle style={{ color: "#19E6FF", fontFamily: "monospace" }}>
              Yeni Kimlik Oluştur
            </DialogTitle>
          </DialogHeader>

          <div className="flex flex-col gap-4 mt-2">
            {/* Type selector */}
            <div>
              <Label style={{ color: "#6B7280", fontSize: 11 }}>
                Kimlik Tipi
              </Label>
              <div className="flex gap-2 mt-1.5">
                {(["permanent", "temp_24h", "temp_7d"] as IDType[]).map((t) => (
                  <button
                    key={t}
                    type="button"
                    data-ocid="identity.tab"
                    onClick={() => setIdType(t)}
                    style={{
                      flex: 1,
                      padding: "6px 4px",
                      borderRadius: 8,
                      fontSize: 10,
                      fontWeight: 600,
                      border: `1px solid ${idType === t ? "#19E6FF" : "#1A2030"}`,
                      background:
                        idType === t ? "rgba(25,230,255,0.1)" : "transparent",
                      color: idType === t ? "#19E6FF" : "#6B7280",
                    }}
                  >
                    {t === "permanent"
                      ? "KALICI"
                      : t === "temp_24h"
                        ? "24 SAAT"
                        : "7 GÜN"}
                  </button>
                ))}
              </div>
            </div>

            {/* Nickname */}
            <div>
              <Label style={{ color: "#6B7280", fontSize: 11 }}>
                Takma Ad (opsiyonel)
              </Label>
              <Input
                data-ocid="identity.input"
                placeholder="Ör: Gölge Operatör"
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                style={{
                  background: "#060710",
                  border: "1px solid #1A2030",
                  color: "white",
                  marginTop: 4,
                }}
              />
            </div>

            {/* Emoji picker */}
            <div>
              <Label style={{ color: "#6B7280", fontSize: 11 }}>
                Avatar Emoji
              </Label>
              <div className="grid grid-cols-6 gap-2 mt-1.5">
                {EMOJI_OPTIONS.map((em) => (
                  <button
                    key={em}
                    type="button"
                    onClick={() => setSelectedEmoji(em)}
                    style={{
                      padding: "6px",
                      borderRadius: 8,
                      fontSize: 18,
                      textAlign: "center",
                      border: `1px solid ${selectedEmoji === em ? "#19E6FF" : "transparent"}`,
                      background:
                        selectedEmoji === em
                          ? "rgba(25,230,255,0.1)"
                          : "transparent",
                    }}
                  >
                    {em}
                  </button>
                ))}
              </div>
            </div>

            {/* Custom suffix (premium only) */}
            <div className="flex items-center justify-between">
              <Label style={{ color: "#6B7280", fontSize: 11 }}>
                Özel ID Eki{" "}
                {!isPremium && (
                  <span style={{ color: "#B56BFF" }}>(Premium)</span>
                )}
              </Label>
              <Switch
                data-ocid="identity.switch"
                checked={useCustom && isPremium}
                onCheckedChange={(v) => {
                  if (!isPremium) {
                    toast.error("Premium üyelik gerekli!");
                    return;
                  }
                  setUseCustom(v);
                }}
              />
            </div>
            {useCustom && isPremium && (
              <Input
                data-ocid="identity.input"
                placeholder="Özel ek (maks 8 karakter)"
                value={customSuffix}
                onChange={(e) => setCustomSuffix(e.target.value.slice(0, 8))}
                style={{
                  background: "#060710",
                  border: "1px solid #1A2030",
                  color: "white",
                  fontFamily: "monospace",
                }}
              />
            )}

            <div className="flex gap-2 mt-2">
              <Button
                data-ocid="identity.cancel_button"
                variant="outline"
                onClick={() => setShowCreate(false)}
                className="flex-1"
                style={{
                  border: "1px solid #1A2030",
                  background: "transparent",
                  color: "#6B7280",
                }}
              >
                İptal
              </Button>
              <Button
                data-ocid="identity.submit_button"
                onClick={handleCreate}
                className="flex-1"
                style={{
                  background: "linear-gradient(135deg, #19E6FF20, #B56BFF20)",
                  color: "#19E6FF",
                  border: "1px solid #19E6FF40",
                }}
              >
                Oluştur
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ── TAB 2: Security ────────────────────────────────────────────────────────────
function SecurityTab() {
  const { identities, activeIdentityId, regenerateKeyPair } = useOmniStore();
  const {
    isAuthenticated: icpAuth,
    principal: icpPrincipal,
    activeId777: icpId777,
    login: icpLogin,
    logout: icpLogout,
    isLoading: icpLoading,
  } = useICPIdentity();
  const active = identities.find((i) => i.id === activeIdentityId);
  const [showPub, setShowPub] = useState(false);
  const [showPriv, setShowPriv] = useState(false);
  const [signMsg, setSignMsg] = useState("");
  const [signature, setSignature] = useState("");
  const [showRegenConfirm, setShowRegenConfirm] = useState(false);

  const fakeTxHash = useMemo(
    () => `0x${(active?.fingerprint ?? "").slice(0, 40)}`,
    [active?.fingerprint],
  );
  const fakeBlock = useMemo(
    () => 14823917 + Math.floor((active?.createdAt ?? 0) % 100000),
    [active?.createdAt],
  );

  if (!active)
    return (
      <div
        style={{ textAlign: "center", color: "#4A5568", padding: "60px 20px" }}
      >
        <Key size={36} style={{ margin: "0 auto 12px", color: "#1A2030" }} />
        <p>Aktif kimlik seçilmedi</p>
      </div>
    );

  return (
    <div className="flex flex-col gap-3 p-4" style={{ paddingBottom: 80 }}>
      {/* ICP Internet Identity */}
      <div
        style={
          icpAuth
            ? {
                ...CARD_STYLE,
                border: "1px solid rgba(25,230,255,0.45)",
                boxShadow: "0 0 18px rgba(25,230,255,0.12)",
              }
            : CARD_STYLE
        }
      >
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Fingerprint
              size={14}
              style={{ color: icpAuth ? "#00FF88" : "#6B7280" }}
            />
            <span style={{ fontSize: 12, fontWeight: 700, color: "#F2F4FF" }}>
              Internet Computer Kimliği
            </span>
          </div>
          {icpAuth ? (
            <span
              style={{
                fontSize: 10,
                fontWeight: 700,
                color: "#00FF88",
                background: "rgba(0,255,136,0.1)",
                padding: "2px 8px",
                borderRadius: 20,
              }}
            >
              Bağlı ✓
            </span>
          ) : (
            <span
              style={{
                fontSize: 10,
                color: "#6B7280",
                background: "rgba(255,255,255,0.04)",
                padding: "2px 8px",
                borderRadius: 20,
              }}
            >
              Bağlı Değil
            </span>
          )}
        </div>
        <p style={{ fontSize: 11, color: "#6B7280", marginBottom: 10 }}>
          Cihazdan bağımsız, kriptografik kimlik doğrulama
        </p>
        {icpAuth && icpPrincipal ? (
          <>
            <div style={{ marginBottom: 6 }}>
              <span style={{ fontSize: 10, color: "#6B7280" }}>
                Kimlik Türü:{" "}
              </span>
              <span style={{ fontSize: 10, color: "#A7ACBE" }}>
                WebAuthn (Biyometrik)
              </span>
            </div>
            <div style={{ marginBottom: 6 }}>
              <span style={{ fontSize: 10, color: "#6B7280" }}>
                Blockchain:{" "}
              </span>
              <span style={{ fontSize: 10, color: "#A7ACBE" }}>
                Internet Computer
              </span>
            </div>
            <div style={{ marginBottom: 6 }}>
              <span style={{ fontSize: 10, color: "#6B7280" }}>Durum: </span>
              <span style={{ fontSize: 10, color: "#00FF88" }}>Aktif</span>
            </div>
            <div style={{ marginBottom: 10, fontFamily: "monospace" }}>
              <span style={{ fontSize: 10, color: "#6B7280" }}>
                Principal:{" "}
              </span>
              <span style={{ fontSize: 10, color: "#B56BFF" }}>
                {icpPrincipal.slice(0, 8)}...{icpPrincipal.slice(-4)}
              </span>
            </div>
            {icpId777 && (
              <div style={{ marginBottom: 10 }}>
                <span style={{ fontSize: 10, color: "#6B7280" }}>
                  OMNI ID:{" "}
                </span>
                <span
                  style={{
                    fontSize: 12,
                    fontWeight: 700,
                    color: "#19E6FF",
                    fontFamily: "monospace",
                  }}
                >
                  {icpId777}
                </span>
              </div>
            )}
            <button
              type="button"
              onClick={icpLogout}
              data-ocid="icp.delete_button"
              style={{
                fontSize: 11,
                color: "#FF4F4F",
                border: "1px solid rgba(255,79,79,0.3)",
                background: "rgba(255,79,79,0.05)",
                borderRadius: 8,
                padding: "4px 12px",
                cursor: "pointer",
              }}
            >
              Bağlantıyı Kes
            </button>
          </>
        ) : (
          <button
            type="button"
            onClick={icpLogin}
            disabled={icpLoading}
            data-ocid="icp.primary_button"
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              fontSize: 12,
              fontWeight: 700,
              color: icpLoading ? "#6B7280" : "#B56BFF",
              border: "1px solid rgba(181,107,255,0.4)",
              background: "rgba(181,107,255,0.08)",
              borderRadius: 10,
              padding: "8px 16px",
              cursor: icpLoading ? "not-allowed" : "pointer",
            }}
          >
            {icpLoading ? (
              <Loader2 size={13} className="animate-spin" />
            ) : (
              <Fingerprint size={13} />
            )}
            Bağlan
          </button>
        )}
      </div>
      {/* Fingerprint */}
      <div style={CARD_STYLE}>
        <div className="flex items-center gap-2 mb-2">
          <ShieldCheck size={14} style={{ color: "#00FF88" }} />
          <span style={{ color: "#00FF88", fontSize: 11, fontWeight: 600 }}>
            ANAHTAR PARMAK İZİ
          </span>
        </div>
        <div
          style={{
            fontFamily: "monospace",
            color: "#19E6FF",
            fontSize: 11,
            wordBreak: "break-all",
            lineHeight: 1.8,
          }}
        >
          {formatFingerprint(active.fingerprint)}
        </div>
      </div>

      {/* Public key */}
      <div style={CARD_STYLE}>
        <div className="flex items-center justify-between mb-2">
          <span style={{ color: "#6B7280", fontSize: 11 }}>Genel Anahtar</span>
          <button
            type="button"
            onClick={() => setShowPub(!showPub)}
            style={{ color: "#19E6FF" }}
          >
            {showPub ? <EyeOff size={14} /> : <Eye size={14} />}
          </button>
        </div>
        <div
          style={{
            fontFamily: "monospace",
            fontSize: 10,
            color: "#A7ACBE",
            wordBreak: "break-all",
            lineHeight: 1.6,
            filter: showPub ? "none" : "blur(4px)",
            userSelect: showPub ? "text" : "none",
          }}
        >
          {formatKey(active.publicKey)}
        </div>
      </div>

      {/* Private key */}
      <div style={CARD_STYLE}>
        <div className="flex items-center justify-between mb-2">
          <span style={{ color: "#FF4F4F", fontSize: 11 }}>⚠️ Özel Anahtar</span>
          <button
            type="button"
            onClick={() => setShowPriv(!showPriv)}
            style={{ color: "#FF4F4F" }}
          >
            {showPriv ? <EyeOff size={14} /> : <Eye size={14} />}
          </button>
        </div>
        <div
          style={{
            fontFamily: "monospace",
            fontSize: 10,
            color: "#FF8C8C",
            wordBreak: "break-all",
            lineHeight: 1.6,
            filter: showPriv ? "none" : "blur(4px)",
            userSelect: showPriv ? "text" : "none",
          }}
        >
          {formatKey(active.privateKey)}
        </div>
      </div>

      {/* Sign demo */}
      <div style={CARD_STYLE}>
        <div className="flex items-center gap-2 mb-2">
          <Zap size={13} style={{ color: "#B56BFF" }} />
          <span style={{ color: "#B56BFF", fontSize: 11, fontWeight: 600 }}>
            İMZA DEMO
          </span>
        </div>
        <Input
          data-ocid="security.input"
          placeholder="İmzalanacak mesaj..."
          value={signMsg}
          onChange={(e) => setSignMsg(e.target.value)}
          style={{
            background: "#060710",
            border: "1px solid #1A2030",
            color: "white",
            fontSize: 12,
            marginBottom: 8,
          }}
        />
        <Button
          data-ocid="security.primary_button"
          size="sm"
          onClick={() => {
            if (!signMsg) return;
            setSignature(simulateSignature(signMsg, active.privateKey));
          }}
          style={{
            background: "rgba(181,107,255,0.1)",
            color: "#B56BFF",
            border: "1px solid #B56BFF40",
            fontSize: 11,
          }}
        >
          İmzala
        </Button>
        {signature && (
          <div
            style={{
              marginTop: 8,
              fontFamily: "monospace",
              fontSize: 9,
              color: "#6B7280",
              wordBreak: "break-all",
            }}
          >
            SIG: {signature}
          </div>
        )}
      </div>

      {/* ZK model */}
      <div style={CARD_STYLE}>
        <div className="flex items-center gap-2 mb-2">
          <Shield size={13} style={{ color: "#19E6FF" }} />
          <span style={{ color: "#19E6FF", fontSize: 11, fontWeight: 600 }}>
            SIFIR BİLGİ MODELİ
          </span>
        </div>
        {[
          "Sunucu sadece imzanızı doğrular",
          "Gerçek kimliğiniz bilinmez",
          "Her işlem şifreli anahtar ile imzalanır",
        ].map((txt) => (
          <div key={txt} className="flex items-center gap-2 mb-1.5">
            <Check size={11} style={{ color: "#00FF88", flexShrink: 0 }} />
            <span style={{ color: "#A7ACBE", fontSize: 12 }}>{txt}</span>
          </div>
        ))}
      </div>

      {/* ICP Blockchain proof */}
      <div style={CARD_STYLE}>
        <div className="flex items-center gap-2 mb-2">
          <span style={{ color: "#FFD700", fontSize: 11, fontWeight: 600 }}>
            ⛓ ICP BLOCKCHAIN KANITI
          </span>
        </div>
        <div style={{ color: "#6B7280", fontSize: 10 }}>TX Hash:</div>
        <div
          style={{
            fontFamily: "monospace",
            color: "#A7ACBE",
            fontSize: 10,
            wordBreak: "break-all",
            marginBottom: 6,
          }}
        >
          {fakeTxHash}
        </div>
        <div style={{ color: "#6B7280", fontSize: 10 }}>
          Blok:{" "}
          <span style={{ color: "#00FF88", fontFamily: "monospace" }}>
            #{fakeBlock}
          </span>
        </div>
      </div>

      {/* Regen */}
      <Button
        data-ocid="security.delete_button"
        onClick={() => setShowRegenConfirm(true)}
        style={{
          background: "rgba(255,79,79,0.08)",
          color: "#FF4F4F",
          border: "1px solid #FF4F4F30",
          fontSize: 12,
        }}
      >
        <RefreshCw size={13} className="mr-2" /> Anahtar Çiftini Yenile
      </Button>

      <Dialog open={showRegenConfirm} onOpenChange={setShowRegenConfirm}>
        <DialogContent
          style={{
            background: "#0B1020",
            border: "1px solid #1A2030",
            borderRadius: 16,
            maxWidth: 320,
          }}
        >
          <DialogHeader>
            <DialogTitle style={{ color: "#FF4F4F" }}>
              Anahtarları Yenile?
            </DialogTitle>
          </DialogHeader>
          <p style={{ color: "#A7ACBE", fontSize: 13, lineHeight: 1.6 }}>
            Bu işlem geri alınamaz. Mevcut anahtarlarınız silinecek.
          </p>
          <div className="flex gap-2 mt-4">
            <Button
              data-ocid="security.cancel_button"
              variant="outline"
              onClick={() => setShowRegenConfirm(false)}
              className="flex-1"
              style={{
                border: "1px solid #1A2030",
                background: "transparent",
                color: "#6B7280",
              }}
            >
              İptal
            </Button>
            <Button
              data-ocid="security.confirm_button"
              onClick={() => {
                regenerateKeyPair(active.id);
                setShowRegenConfirm(false);
                toast.success("Anahtar çifti yenilendi!");
              }}
              className="flex-1"
              style={{
                background: "rgba(255,79,79,0.15)",
                color: "#FF4F4F",
                border: "1px solid #FF4F4F40",
              }}
            >
              Yenile
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ── TAB 3: Privacy ─────────────────────────────────────────────────────────────
function PrivacyTab() {
  const { identities, activeIdentityId, updatePrivacyMode } = useOmniStore();
  const active = identities.find((i) => i.id === activeIdentityId);
  const [showOnline, setShowOnline] = useState(true);
  const [showLastSeen, setShowLastSeen] = useState(true);

  const modes: Array<{
    mode: PrivacyMode;
    label: string;
    emoji: string;
    color: string;
    description: string;
    features: string[];
  }> = [
    {
      mode: "normal",
      label: "NORMAL",
      emoji: "💡",
      color: "#19E6FF",
      description: "Standart görünürlük modu",
      features: ["ID görünür", "Sohbet açık", "Çevrimiçi durumu yayınlanır"],
    },
    {
      mode: "ghost",
      label: "GHOST",
      emoji: "👻",
      color: "#B56BFF",
      description: "Geçici kimlik, kayıt yok",
      features: ["Geçici kimlik", "Geçmiş saklanmaz", "24s sonra sona erer"],
    },
    {
      mode: "shadow",
      label: "SHADOW",
      emoji: "🌑",
      color: "#FF4F4F",
      description: "Görünmez tarama modu",
      features: [
        "Görünmez tarama",
        "Son görülme kapalı",
        "Çevrimiçi durumu yok",
      ],
    },
  ];

  const currentMode = active?.privacyMode ?? "normal";

  return (
    <div className="flex flex-col gap-3 p-4" style={{ paddingBottom: 80 }}>
      {modes.map(({ mode, label, emoji, color, description, features }) => {
        const isActive = currentMode === mode;
        return (
          <button
            key={mode}
            type="button"
            data-ocid={`privacy.${mode}.toggle`}
            onClick={() => {
              if (active) updatePrivacyMode(active.id, mode);
            }}
            style={{
              ...CARD_STYLE,
              border: `1px solid ${isActive ? color : "#1A2030"}`,
              boxShadow: isActive ? `0 0 20px ${color}30` : "none",
              textAlign: "left",
              width: "100%",
              position: "relative",
              overflow: "hidden",
            }}
          >
            {isActive && (
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  background: `radial-gradient(ellipse at 50% 0%, ${color}10 0%, transparent 70%)`,
                  pointerEvents: "none",
                }}
              />
            )}
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <span style={{ fontSize: 22 }}>{emoji}</span>
                <span
                  style={{
                    color: isActive ? color : "#6B7280",
                    fontWeight: 700,
                    fontSize: 14,
                    fontFamily: "monospace",
                  }}
                >
                  {label}
                </span>
              </div>
              {isActive && (
                <span
                  style={{
                    background: `${color}20`,
                    color,
                    fontSize: 9,
                    padding: "2px 8px",
                    borderRadius: 20,
                    border: `1px solid ${color}40`,
                    fontWeight: 600,
                  }}
                >
                  AKTİF
                </span>
              )}
            </div>
            <p style={{ color: "#6B7280", fontSize: 12, marginBottom: 8 }}>
              {description}
            </p>
            <div className="flex flex-col gap-1">
              {features.map((f) => (
                <div key={f} className="flex items-center gap-1.5">
                  <div
                    style={{
                      width: 4,
                      height: 4,
                      borderRadius: "50%",
                      background: color,
                    }}
                  />
                  <span style={{ color: "#A7ACBE", fontSize: 11 }}>{f}</span>
                </div>
              ))}
            </div>
          </button>
        );
      })}

      <div style={CARD_STYLE}>
        <div className="flex items-center justify-between py-2">
          <span style={{ color: "#A7ACBE", fontSize: 13 }}>Son Görülme</span>
          <Switch
            data-ocid="privacy.last_seen.switch"
            checked={showLastSeen && currentMode !== "shadow"}
            disabled={currentMode === "shadow"}
            onCheckedChange={setShowLastSeen}
          />
        </div>
        <div style={{ height: 1, background: "#1A2030" }} />
        <div className="flex items-center justify-between py-2">
          <span style={{ color: "#A7ACBE", fontSize: 13 }}>
            Çevrimiçi Durumu
          </span>
          <Switch
            data-ocid="privacy.online_status.switch"
            checked={showOnline && currentMode !== "shadow"}
            disabled={currentMode === "shadow"}
            onCheckedChange={setShowOnline}
          />
        </div>
      </div>
    </div>
  );
}

// ── TAB 4: Marketplace ─────────────────────────────────────────────────────────
function MarketplaceTab() {
  const { tokenBalance } = useOmniStore();
  const [filter, setFilter] = useState<"all" | "rare" | "legendary">("all");
  const [bidTarget, setBidTarget] = useState<string | null>(null);
  const [bidAmount, setBidAmount] = useState("");
  const [showList, setShowList] = useState(false);
  const [listPrice, setListPrice] = useState("");

  const filtered = MOCK_MARKETPLACE.filter(
    (m) => filter === "all" || m.rarity === filter,
  );

  return (
    <div className="flex flex-col gap-3 p-4" style={{ paddingBottom: 80 }}>
      {/* Filter tabs */}
      <div className="flex gap-2">
        {(["all", "rare", "legendary"] as const).map((f) => (
          <button
            key={f}
            type="button"
            data-ocid={`market.${f}.tab`}
            onClick={() => setFilter(f)}
            style={{
              flex: 1,
              padding: "6px",
              borderRadius: 8,
              fontSize: 11,
              fontWeight: 600,
              border: `1px solid ${filter === f ? "#19E6FF" : "#1A2030"}`,
              background: filter === f ? "rgba(25,230,255,0.1)" : "transparent",
              color: filter === f ? "#19E6FF" : "#6B7280",
            }}
          >
            {f === "all" ? "Tümü" : f === "rare" ? "Nadir" : "Efsanevi"}
          </button>
        ))}
      </div>

      <Button
        data-ocid="market.open_modal_button"
        onClick={() => setShowList(true)}
        style={{
          background: "rgba(0,255,136,0.08)",
          color: "#00FF88",
          border: "1px solid #00FF8830",
          fontSize: 12,
        }}
      >
        <Plus size={13} className="mr-1" /> Satışa Çıkar
      </Button>

      {filtered.map((item, idx) => (
        <div
          key={item.id}
          data-ocid={`market.item.${idx + 1}`}
          style={CARD_STYLE}
        >
          <div className="flex items-start justify-between gap-2">
            <div>
              <div
                style={{
                  fontFamily: "monospace",
                  fontSize: 15,
                  fontWeight: 700,
                  background:
                    item.rarity === "legendary"
                      ? "linear-gradient(90deg,#FFD700,#FF8C00)"
                      : "none",
                  WebkitBackgroundClip:
                    item.rarity === "legendary" ? "text" : undefined,
                  WebkitTextFillColor:
                    item.rarity === "legendary"
                      ? "transparent"
                      : getRarityColor(item.rarity),
                }}
              >
                {item.idNumber}
              </div>
              <div className="flex items-center gap-1.5 mt-1">
                <Badge
                  style={{
                    fontSize: 9,
                    padding: "1px 6px",
                    background:
                      item.rarity === "legendary"
                        ? "rgba(255,215,0,0.12)"
                        : item.rarity === "rare"
                          ? "rgba(25,230,255,0.12)"
                          : "rgba(107,114,128,0.12)",
                    color: getRarityColor(item.rarity),
                    border: "none",
                  }}
                >
                  {getRarityLabel(item.rarity)}
                </Badge>
                <span style={{ color: "#4A5568", fontSize: 9 }}>
                  🔒 Emanet Koruması
                </span>
              </div>
              <div className="flex items-center gap-2 mt-1.5">
                <div className="flex">
                  {[1, 2, 3, 4, 5].map((n) => (
                    <Star
                      key={n}
                      size={10}
                      style={{
                        color:
                          n - 1 < Math.round(item.sellerRating)
                            ? "#FFD700"
                            : "#1A2030",
                      }}
                      fill={
                        n - 1 < Math.round(item.sellerRating)
                          ? "#FFD700"
                          : "none"
                      }
                    />
                  ))}
                </div>
                <span style={{ color: "#4A5568", fontSize: 10 }}>
                  {item.bidCount} teklif
                </span>
              </div>
            </div>
            <div className="flex flex-col items-end gap-2">
              <div
                style={{
                  color: "#00FF88",
                  fontFamily: "monospace",
                  fontWeight: 700,
                  fontSize: 14,
                }}
              >
                {item.price.toLocaleString()} ◈
              </div>
              <Button
                size="sm"
                data-ocid={`market.secondary_button.${idx + 1}`}
                onClick={() => setBidTarget(item.id)}
                style={{
                  background: "rgba(181,107,255,0.1)",
                  color: "#B56BFF",
                  border: "1px solid #B56BFF40",
                  fontSize: 10,
                  padding: "4px 10px",
                }}
              >
                Teklif Ver
              </Button>
            </div>
          </div>
        </div>
      ))}

      {/* Bid dialog */}
      <Dialog open={!!bidTarget} onOpenChange={() => setBidTarget(null)}>
        <DialogContent
          style={{
            background: "#0B1020",
            border: "1px solid #1A2030",
            borderRadius: 16,
            maxWidth: 320,
          }}
        >
          <DialogHeader>
            <DialogTitle style={{ color: "#B56BFF" }}>Teklif Ver</DialogTitle>
          </DialogHeader>
          <p style={{ color: "#6B7280", fontSize: 12 }}>
            Bakiye: <span style={{ color: "#00FF88" }}>{tokenBalance} ◈</span>
          </p>
          <Input
            data-ocid="market.input"
            type="number"
            placeholder="Teklif miktarı (OMNI)"
            value={bidAmount}
            onChange={(e) => setBidAmount(e.target.value)}
            style={{
              background: "#060710",
              border: "1px solid #1A2030",
              color: "white",
            }}
          />
          <div className="flex gap-2 mt-2">
            <Button
              data-ocid="market.cancel_button"
              variant="outline"
              onClick={() => setBidTarget(null)}
              className="flex-1"
              style={{
                border: "1px solid #1A2030",
                background: "transparent",
                color: "#6B7280",
              }}
            >
              İptal
            </Button>
            <Button
              data-ocid="market.confirm_button"
              onClick={() => {
                setBidTarget(null);
                setBidAmount("");
                toast.success("Teklifiniz iletildi!");
              }}
              className="flex-1"
              style={{
                background: "rgba(181,107,255,0.15)",
                color: "#B56BFF",
                border: "1px solid #B56BFF40",
              }}
            >
              Teklif Ver
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* List ID dialog */}
      <Dialog open={showList} onOpenChange={setShowList}>
        <DialogContent
          style={{
            background: "#0B1020",
            border: "1px solid #1A2030",
            borderRadius: 16,
            maxWidth: 320,
          }}
        >
          <DialogHeader>
            <DialogTitle style={{ color: "#00FF88" }}>
              ID'ni Satışa Çıkar
            </DialogTitle>
          </DialogHeader>
          <Input
            data-ocid="market.input"
            type="number"
            placeholder="Satış fiyatı (OMNI)"
            value={listPrice}
            onChange={(e) => setListPrice(e.target.value)}
            style={{
              background: "#060710",
              border: "1px solid #1A2030",
              color: "white",
            }}
          />
          <div className="flex gap-2 mt-2">
            <Button
              data-ocid="market.cancel_button"
              variant="outline"
              onClick={() => setShowList(false)}
              className="flex-1"
              style={{
                border: "1px solid #1A2030",
                background: "transparent",
                color: "#6B7280",
              }}
            >
              İptal
            </Button>
            <Button
              data-ocid="market.submit_button"
              onClick={() => {
                setShowList(false);
                setListPrice("");
                toast.success("ID satışa çıkarıldı!");
              }}
              className="flex-1"
              style={{
                background: "rgba(0,255,136,0.1)",
                color: "#00FF88",
                border: "1px solid #00FF8840",
              }}
            >
              Listele
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ── TAB 5: Discovery ───────────────────────────────────────────────────────────
function DiscoveryTab() {
  const { identities, activeIdentityId, addFriendById } = useOmniStore();
  const active = identities.find((i) => i.id === activeIdentityId);
  const [searchInput, setSearchInput] = useState("");
  const [searchResult, setSearchResult] = useState<null | "found" | "notfound">(
    null,
  );
  const [copied, setCopied] = useState(false);

  const handleSearch = () => {
    if (!searchInput.startsWith("+777")) {
      toast.error("+777 ile başlayan ID girin");
      return;
    }
    setSearchResult(Math.random() > 0.3 ? "found" : "notfound");
  };

  const handleCopy = () => {
    if (active) {
      navigator.clipboard.writeText(active.id).catch(() => {});
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="flex flex-col gap-4 p-4" style={{ paddingBottom: 80 }}>
      {/* QR */}
      <div
        style={{
          ...CARD_STYLE,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 12,
        }}
      >
        <div className="flex items-center gap-2">
          <QrCode size={13} style={{ color: "#19E6FF" }} />
          <span style={{ color: "#19E6FF", fontSize: 11, fontWeight: 600 }}>
            QR KOD
          </span>
        </div>
        <div
          style={{
            padding: 12,
            background: "#060710",
            borderRadius: 8,
            border: "1px solid #1A2030",
          }}
        >
          <QRCodeDisplay idStr={active?.id ?? "+777 0000 0000"} />
        </div>
        <div
          style={{ fontFamily: "monospace", color: "#A7ACBE", fontSize: 13 }}
        >
          {active?.id ?? "—"}
        </div>
        <div className="flex gap-2 w-full">
          <Button
            data-ocid="discovery.secondary_button"
            onClick={handleCopy}
            style={{
              flex: 1,
              background: copied
                ? "rgba(0,255,136,0.1)"
                : "rgba(25,230,255,0.1)",
              color: copied ? "#00FF88" : "#19E6FF",
              border: `1px solid ${copied ? "#00FF8840" : "#19E6FF40"}`,
              fontSize: 12,
            }}
          >
            {copied ? (
              <Check size={13} className="mr-1" />
            ) : (
              <Copy size={13} className="mr-1" />
            )}
            {copied ? "Kopyalandı" : "Kopyala"}
          </Button>
          <Button
            data-ocid="discovery.primary_button"
            onClick={() => toast.info("Paylaşım linki kopyalandı!")}
            style={{
              flex: 1,
              background: "rgba(181,107,255,0.1)",
              color: "#B56BFF",
              border: "1px solid #B56BFF40",
              fontSize: 12,
            }}
          >
            <Share2 size={13} className="mr-1" /> Paylaş
          </Button>
        </div>
      </div>

      {/* ID Search */}
      <div style={CARD_STYLE}>
        <div className="flex items-center gap-2 mb-3">
          <Search size={13} style={{ color: "#19E6FF" }} />
          <span style={{ color: "#19E6FF", fontSize: 11, fontWeight: 600 }}>
            ID ARA
          </span>
        </div>
        <div className="flex gap-2">
          <Input
            data-ocid="discovery.search_input"
            placeholder="+777 XXXX XXXX"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            style={{
              background: "#060710",
              border: "1px solid #1A2030",
              color: "white",
              fontFamily: "monospace",
              fontSize: 12,
            }}
          />
          <Button
            data-ocid="discovery.primary_button"
            onClick={handleSearch}
            style={{
              background: "rgba(25,230,255,0.1)",
              color: "#19E6FF",
              border: "1px solid #19E6FF40",
              flexShrink: 0,
            }}
          >
            Ara
          </Button>
        </div>
        {searchResult === "found" && (
          <div
            data-ocid="discovery.success_state"
            style={{
              marginTop: 12,
              padding: 10,
              background: "rgba(25,230,255,0.05)",
              borderRadius: 8,
              border: "1px solid #19E6FF30",
            }}
          >
            <div className="flex items-center justify-between">
              <div>
                <div
                  style={{
                    fontFamily: "monospace",
                    color: "#19E6FF",
                    fontSize: 13,
                  }}
                >
                  {searchInput}
                </div>
                <div style={{ color: "#6B7280", fontSize: 10, marginTop: 2 }}>
                  🟢 Çevrimiçi · PERM
                </div>
              </div>
              <Button
                size="sm"
                onClick={() => {
                  addFriendById(searchInput as any);
                  setSearchResult(null);
                  toast.success("Arkadaş eklendi!");
                }}
                style={{
                  background: "rgba(0,255,136,0.1)",
                  color: "#00FF88",
                  border: "1px solid #00FF8840",
                  fontSize: 11,
                }}
              >
                Ekle
              </Button>
            </div>
          </div>
        )}
        {searchResult === "notfound" && (
          <div
            data-ocid="discovery.error_state"
            style={{
              marginTop: 8,
              color: "#FF4F4F",
              fontSize: 12,
              textAlign: "center",
            }}
          >
            Kullanıcı bulunamadı
          </div>
        )}
      </div>

      {/* Radar */}
      <div style={CARD_STYLE}>
        <div className="flex items-center gap-2 mb-3">
          <span style={{ color: "#00FF88", fontSize: 11, fontWeight: 600 }}>
            📡 YAKINLARDAKILER
          </span>
        </div>
        {/* Radar visual */}
        <div
          style={{
            position: "relative",
            width: "100%",
            paddingBottom: "56%",
            marginBottom: 12,
          }}
        >
          <div
            style={{
              position: "absolute",
              inset: 0,
              background:
                "radial-gradient(circle at 50% 50%, rgba(0,255,136,0.05) 0%, transparent 70%)",
              borderRadius: 8,
              border: "1px solid #00FF8820",
              overflow: "hidden",
            }}
          >
            {/* Rings */}
            {[30, 50, 70].map((r) => (
              <div
                key={r}
                style={{
                  position: "absolute",
                  left: `${50 - r / 2}%`,
                  top: `${50 - r}%`,
                  width: `${r}%`,
                  height: `${r * 2}%`,
                  borderRadius: "50%",
                  border: "1px solid #00FF8815",
                }}
              />
            ))}
            {/* Sweep line animation */}
            <div
              style={{
                position: "absolute",
                left: "50%",
                top: "50%",
                width: "40%",
                height: 1,
                background: "linear-gradient(90deg, #00FF88, transparent)",
                transformOrigin: "0 50%",
                animation: "spin 3s linear infinite",
              }}
            />
            {/* Dots */}
            {NEARBY_USERS.map((u, i) => {
              const angle = (i / NEARBY_USERS.length) * 2 * Math.PI - 0.5;
              const dist = 0.2 + i * 0.15;
              const x = 50 + dist * 40 * Math.cos(angle);
              const y = 50 + dist * 40 * Math.sin(angle);
              return (
                <div
                  key={u.id}
                  style={{
                    position: "absolute",
                    left: `${x}%`,
                    top: `${y}%`,
                    transform: "translate(-50%,-50%)",
                    width: 8,
                    height: 8,
                    borderRadius: "50%",
                    background: "#00FF88",
                    boxShadow: "0 0 6px #00FF88",
                    animation: `pulse ${1.5 + i * 0.3}s ease-in-out infinite`,
                  }}
                />
              );
            })}
          </div>
        </div>
        {NEARBY_USERS.map((u, idx) => (
          <div
            key={u.id}
            data-ocid={`discovery.item.${idx + 1}`}
            className="flex items-center justify-between py-2"
            style={{ borderTop: idx > 0 ? "1px solid #0F1320" : "none" }}
          >
            <div className="flex items-center gap-2">
              <span style={{ fontSize: 18 }}>{u.emoji}</span>
              <div>
                <div
                  style={{
                    fontFamily: "monospace",
                    color: "#A7ACBE",
                    fontSize: 12,
                  }}
                >
                  {u.partial}
                </div>
                <div style={{ color: "#4A5568", fontSize: 10 }}>
                  {u.distance} · {u.type === "permanent" ? "PERM" : "TEMP"}
                </div>
              </div>
            </div>
            <Button
              size="sm"
              data-ocid={`discovery.secondary_button.${idx + 1}`}
              onClick={() => toast.success(`${u.partial} eklendi!`)}
              style={{
                background: "rgba(0,255,136,0.08)",
                color: "#00FF88",
                border: "1px solid #00FF8830",
                fontSize: 10,
                padding: "3px 10px",
              }}
            >
              Ekle
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── TAB 6: Reputation ──────────────────────────────────────────────────────────
const MOCK_ABUSE_EVENTS = [
  {
    ts: Date.now() - 3600000,
    event: "Mesaj aktivitesi tarandı",
    status: "clean",
  },
  { ts: Date.now() - 7200000, event: "İşlem doğrulandı", status: "clean" },
  {
    ts: Date.now() - 14400000,
    event: "Şüpheli IP tespit",
    status: "suspicious",
  },
  { ts: Date.now() - 86400000, event: "Normal kullanım", status: "clean" },
  {
    ts: Date.now() - 172800000,
    event: "Spam girişimi engellendi",
    status: "blocked",
  },
];

function ReputationTab() {
  const { identities, activeIdentityId } = useOmniStore();
  const active = identities.find((i) => i.id === activeIdentityId);
  const score = active?.reputationScore ?? 75;

  const breakdown = [
    {
      label: "Mesaj Aktivitesi",
      value: Math.min(100, score + 5),
      color: "#19E6FF",
    },
    { label: "İşlem Geçmişi", value: Math.max(0, score - 8), color: "#00FF88" },
    {
      label: "Şikayet Sayısı",
      value: Math.max(0, 100 - score + 10),
      color: "#FF4F4F",
    },
    { label: "Hesap Yaşı", value: Math.min(100, score + 15), color: "#B56BFF" },
  ];

  const statusColor = (s: string) =>
    s === "clean" ? "#00FF88" : s === "suspicious" ? "#FF8C00" : "#FF4F4F";
  const statusLabel = (s: string) =>
    s === "clean" ? "Temiz" : s === "suspicious" ? "Şüpheli" : "Engellendi";

  return (
    <div className="flex flex-col gap-3 p-4" style={{ paddingBottom: 80 }}>
      <div
        style={{
          ...CARD_STYLE,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 4,
        }}
      >
        <ReputationGauge score={score} />
        <p style={{ color: "#6B7280", fontSize: 12 }}>
          Aktif kimliğin güvenilirlik puanı
        </p>
      </div>

      {/* Score breakdown */}
      <div style={CARD_STYLE}>
        <div
          style={{
            color: "#A7ACBE",
            fontSize: 11,
            fontWeight: 600,
            marginBottom: 12,
          }}
        >
          PUAN DAĞILIMI
        </div>
        {breakdown.map((b) => (
          <div key={b.label} className="mb-3">
            <div className="flex justify-between mb-1">
              <span style={{ color: "#6B7280", fontSize: 12 }}>{b.label}</span>
              <span
                style={{
                  color: b.color,
                  fontSize: 12,
                  fontFamily: "monospace",
                }}
              >
                {b.value}
              </span>
            </div>
            <Progress
              value={b.value}
              className="h-1.5"
              style={{ background: "#1A2030" }}
            />
          </div>
        ))}
      </div>

      {/* Device limit */}
      <div style={CARD_STYLE}>
        <div className="flex items-center justify-between">
          <span style={{ color: "#A7ACBE", fontSize: 13 }}>Bu cihazda ID</span>
          <span
            style={{ color: "#19E6FF", fontFamily: "monospace", fontSize: 13 }}
          >
            {identities.length}/5
          </span>
        </div>
        <Progress
          value={(identities.length / 5) * 100}
          className="mt-2 h-1.5"
          style={{ background: "#1A2030" }}
        />
      </div>

      {/* AI abuse feed */}
      <div style={CARD_STYLE}>
        <div className="flex items-center gap-2 mb-3">
          <Shield size={13} style={{ color: "#B56BFF" }} />
          <span style={{ color: "#B56BFF", fontSize: 11, fontWeight: 600 }}>
            AI İSTİSMAR TESPİT
          </span>
        </div>
        {MOCK_ABUSE_EVENTS.map((ev, idx) => (
          <div
            key={ev.event}
            data-ocid={`reputation.item.${idx + 1}`}
            className="flex items-center justify-between py-2"
            style={{ borderTop: idx > 0 ? "1px solid #0F1320" : "none" }}
          >
            <div>
              <div style={{ color: "#A7ACBE", fontSize: 12 }}>{ev.event}</div>
              <div style={{ color: "#4A5568", fontSize: 10 }}>
                {new Date(ev.ts).toLocaleString("tr-TR", {
                  month: "short",
                  day: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </div>
            </div>
            <Badge
              style={{
                background: `${statusColor(ev.status)}15`,
                color: statusColor(ev.status),
                fontSize: 9,
                padding: "2px 6px",
              }}
            >
              {statusLabel(ev.status)}
            </Badge>
          </div>
        ))}
      </div>

      {/* Tips */}
      <div style={CARD_STYLE}>
        <div
          style={{
            color: "#FFD700",
            fontSize: 11,
            fontWeight: 600,
            marginBottom: 10,
          }}
        >
          💡 PUAN ARTIRMA İPUÇLARI
        </div>
        {[
          "Düzenli mesajlaşma aktivitesi sürdür",
          "Güvenilir işlemler gerçekleştir",
          "Şikayet almaktan kaçın",
          "Hesabını aktif tut",
        ].map((tip) => (
          <div key={tip} className="flex items-start gap-2 mb-1.5">
            <div
              style={{
                width: 4,
                height: 4,
                borderRadius: "50%",
                background: "#FFD700",
                marginTop: 5,
                flexShrink: 0,
              }}
            />
            <span style={{ color: "#A7ACBE", fontSize: 12 }}>{tip}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Main ───────────────────────────────────────────────────────────────────────
export function IdentityModule() {
  const { identities, activeIdentityId } = useOmniStore();
  const active = identities.find((i) => i.id === activeIdentityId);

  return (
    <div
      className="h-full flex flex-col"
      style={{ background: "#06070B", overflow: "hidden" }}
    >
      {/* Active ID strip */}
      {active && (
        <div
          style={{
            padding: "8px 16px",
            background: "rgba(25,230,255,0.04)",
            borderBottom: "1px solid #1A2030",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div className="flex items-center gap-2">
            <span style={{ fontSize: 16 }}>{active.emoji}</span>
            <div>
              <div
                style={{
                  fontFamily: "monospace",
                  color: "#19E6FF",
                  fontSize: 13,
                  fontWeight: 700,
                }}
              >
                {active.id}
              </div>
              {active.nickname && (
                <div style={{ color: "#4A5568", fontSize: 10 }}>
                  {active.nickname}
                </div>
              )}
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            <div
              style={{
                width: 6,
                height: 6,
                borderRadius: "50%",
                background: "#00FF88",
                boxShadow: "0 0 6px #00FF88",
              }}
            />
            <span style={{ color: "#00FF88", fontSize: 10 }}>Aktif</span>
          </div>
        </div>
      )}

      <Tabs defaultValue="ids" className="flex flex-col flex-1 overflow-hidden">
        <TabsList
          className="shrink-0 w-full rounded-none"
          style={{
            background: "rgba(6,7,11,0.95)",
            borderBottom: "1px solid #1A2030",
            gap: 0,
            padding: "0 4px",
            overflowX: "auto",
          }}
        >
          {(
            [
              { value: "ids", label: "KİMLİKLER" },
              { value: "security", label: "GÜVENLİK" },
              { value: "privacy", label: "GİZLİLİK" },
              { value: "market", label: "PAZAR" },
              { value: "discovery", label: "KEŞFET" },
              { value: "reputation", label: "SKOR" },
            ] as const
          ).map(({ value, label }) => (
            <TabsTrigger
              key={value}
              value={value}
              data-ocid={`identity.${value}.tab`}
              style={{
                fontSize: 9,
                fontWeight: 700,
                letterSpacing: "0.05em",
                padding: "8px 10px",
                borderRadius: 0,
                flex: "0 0 auto",
              }}
              className="data-[state=active]:text-[#19E6FF] data-[state=active]:border-b-2 data-[state=active]:border-[#19E6FF] text-[#4A5568]"
            >
              {label}
            </TabsTrigger>
          ))}
        </TabsList>

        <div className="flex-1 overflow-y-auto">
          <TabsContent value="ids" className="m-0">
            <MyIDsTab />
          </TabsContent>
          <TabsContent value="security" className="m-0">
            <SecurityTab />
          </TabsContent>
          <TabsContent value="privacy" className="m-0">
            <PrivacyTab />
          </TabsContent>
          <TabsContent value="market" className="m-0">
            <MarketplaceTab />
          </TabsContent>
          <TabsContent value="discovery" className="m-0">
            <DiscoveryTab />
          </TabsContent>
          <TabsContent value="reputation" className="m-0">
            <ReputationTab />
          </TabsContent>
        </div>
      </Tabs>

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; transform: translate(-50%,-50%) scale(1); }
          50% { opacity: 0.5; transform: translate(-50%,-50%) scale(1.5); }
        }
      `}</style>
    </div>
  );
}
