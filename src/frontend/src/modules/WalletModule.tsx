import { useOmniToken } from "@/hooks/useOmniToken";
import type {
  EscrowTrade,
  IDListing,
  P2POffer,
  TokenTransaction,
} from "@/lib/mockData";
import { useOmniStore } from "@/lib/omniStore";
import {
  AlertTriangle,
  ArrowDownLeft,
  ArrowUpRight,
  Check,
  Clock,
  Copy,
  Crown,
  Download,
  Flame,
  Gift,
  Lock,
  Send,
  Shield,
  ShoppingBag,
  Star,
  TrendingUp,
  Users,
  Zap,
} from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

const NEON_CYAN = "#19E6FF";
const NEON_PURPLE = "#B56BFF";
const NEON_GREEN = "#2FF5C7";
const NEON_RED = "#FF4F4F";
const NEON_GOLD = "#FFB347";
const BG_DARK = "#06070B";
const BG_CARD = "#0D1117";
const BG_CARD2 = "#111827";

const TX_COLORS: Record<string, string> = {
  earn: NEON_GREEN,
  spend: NEON_RED,
  transfer: NEON_PURPLE,
  reward: NEON_GOLD,
};

const QR_CELLS = Array.from({ length: 64 }, (_, i) => ({
  id: `qr-c${i}`,
  isOn: [
    0, 1, 2, 3, 7, 8, 10, 11, 14, 15, 16, 17, 18, 24, 26, 28, 31, 32, 35, 37,
    39, 40, 42, 45, 47, 48, 49, 50, 53, 55, 56, 57, 58, 59, 60, 63,
  ].includes(i % 36),
}));

function formatTime(ts: number): string {
  const diff = Date.now() - ts;
  if (diff < 3600000) return `${Math.floor(diff / 60000)}d`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}s`;
  return `${Math.floor(diff / 86400000)}g`;
}

function maskId(id: string): string {
  const parts = id.split(" ");
  if (parts.length === 3) return `+777 **** ${parts[2]}`;
  return id;
}

function formatCountdown(expiresAt: number): string {
  const diff = expiresAt - Date.now();
  if (diff <= 0) return "Süre doldu";
  const h = Math.floor(diff / 3600000);
  const m = Math.floor((diff % 3600000) / 60000);
  if (h > 24) return `${Math.floor(h / 24)}g ${h % 24}s`;
  return `${h}s ${m}d`;
}

const EARN_ACTIVITIES = [
  {
    id: "msg",
    label: "Mesaj gönder",
    amount: 1,
    icon: "💬",
    desc: "+1 OMNI / mesaj",
  },
  {
    id: "story",
    label: "Hikaye paylaş",
    amount: 5,
    icon: "✨",
    desc: "+5 OMNI / hikaye",
  },
  {
    id: "daily",
    label: "Günlük giriş",
    amount: 10,
    icon: "🔥",
    desc: "+10 OMNI / gün",
  },
  {
    id: "refer",
    label: "Arkadaş davet et",
    amount: 50,
    icon: "👥",
    desc: "+50 OMNI / davet",
  },
];

const MOCK_DROPS: Array<{
  id: string;
  title: string;
  amount: number;
  claimedBy: number;
  expiresAt: number;
  icon: string;
}> = [];

const RARITY_COLORS: Record<string, string> = {
  nadir: NEON_CYAN,
  epik: NEON_PURPLE,
  efsanevi: NEON_GOLD,
};

const RARITY_LABELS: Record<string, string> = {
  nadir: "NADİR",
  epik: "EPİK",
  efsanevi: "EFSANEVİ",
};

const ESCROW_COLORS: Record<string, string> = {
  tokens_locked: NEON_GOLD,
  payment_sent: NEON_CYAN,
  completed: NEON_GREEN,
  disputed: NEON_RED,
  cancelled: "#666",
};

const ESCROW_LABELS: Record<string, string> = {
  tokens_locked: "🔒 Token Kilitli",
  payment_sent: "💸 Ödeme Gönderildi",
  completed: "✅ Tamamlandı",
  disputed: "⚠️ Anlaşmazlık",
  cancelled: "❌ İptal",
};

// ============================
// Tab 1: CÜZDAN
// ============================
function WalletTab() {
  const {
    tokenBalance,
    transactions,
    sendTokens,
    claimedRewards,
    claimReward,
    myId,
    isPremium,
    upgradeToPremium,
  } = useOmniStore();

  const icpToken = useOmniToken();

  const [activeAction, setActiveAction] = useState<"main" | "send" | "receive">(
    "main",
  );
  const [recipientInput, setRecipientInput] = useState("");
  const [sendAmount, setSendAmount] = useState("");
  const [useICP, setUseICP] = useState(true);

  const handleSend = async () => {
    const amount = Number.parseInt(sendAmount);
    if (!amount || amount <= 0) return;

    if (!recipientInput.trim()) return;
    if (useICP) {
      // Real on-chain ICP transfer via +777 ID
      try {
        await icpToken.transferByid777(recipientInput.trim(), BigInt(amount));
        toast.success("✅ Transfer zincire kaydedildi!");
        setRecipientInput("");
        setSendAmount("");
        setActiveAction("main");
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Transfer başarısız");
      }
    } else {
      // Fallback: localStorage-based transfer
      const success = sendTokens(recipientInput.trim(), amount);
      if (success) {
        toast.success(`${amount} OMNI gönderildi!`);
        setRecipientInput("");
        setSendAmount("");
        setActiveAction("main");
      } else {
        toast.error("Yetersiz bakiye");
      }
    }
  };

  const handleCopyId = () => {
    if (myId) navigator.clipboard.writeText(myId);
    toast.success("ID kopyalandı!");
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {/* Balance Card */}
      <div
        data-ocid="wallet.card"
        style={{
          background: isPremium
            ? "linear-gradient(135deg, #1a0a2e 0%, #0d1117 100%)"
            : "linear-gradient(135deg, #0a1628 0%, #0d1117 100%)",
          border: `1px solid ${isPremium ? NEON_PURPLE : "#1e2a3a"}`,
          borderRadius: 16,
          padding: 20,
          position: "relative",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            position: "absolute",
            top: -20,
            right: -20,
            width: 120,
            height: 120,
            borderRadius: "50%",
            background: `radial-gradient(circle, ${isPremium ? NEON_PURPLE : NEON_CYAN}22 0%, transparent 70%)`,
          }}
        />
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
          }}
        >
          <div>
            <div
              style={{
                color: "#888",
                fontSize: 11,
                letterSpacing: 1,
                marginBottom: 4,
              }}
            >
              OMNI BAKİYE
            </div>
            <div
              style={{
                color: "#fff",
                fontSize: 36,
                fontWeight: 700,
                lineHeight: 1,
              }}
            >
              {tokenBalance.toLocaleString()}
              <span style={{ fontSize: 14, color: NEON_CYAN, marginLeft: 6 }}>
                OMNI
              </span>
            </div>
            <div style={{ color: "#555", fontSize: 11, marginTop: 4 }}>
              ≈ €{(tokenBalance * 0.085).toFixed(2)}
            </div>
            {/* ICP On-Chain Balance */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                marginTop: 8,
              }}
            >
              <div
                style={{
                  width: 6,
                  height: 6,
                  borderRadius: "50%",
                  background: icpToken.isLoading ? "#555" : "#2FF5C7",
                  boxShadow: icpToken.isLoading ? "none" : "0 0 6px #2FF5C7",
                }}
              />
              <span style={{ color: "#888", fontSize: 10, letterSpacing: 1 }}>
                ZİNCİR BAKİYESİ
              </span>
              {icpToken.isLoading ? (
                <span style={{ color: "#555", fontSize: 10 }}>
                  yükleniyor...
                </span>
              ) : (
                <span
                  style={{ color: "#2FF5C7", fontSize: 12, fontWeight: 700 }}
                >
                  {icpToken.balance.toString()} OMNI
                </span>
              )}
            </div>
          </div>
          <div style={{ textAlign: "right" }}>
            <div
              style={{
                background: isPremium ? `${NEON_PURPLE}22` : "transparent",
                border: `1px solid ${isPremium ? NEON_PURPLE : "#333"}`,
                borderRadius: 8,
                padding: "2px 8px",
                color: isPremium ? NEON_PURPLE : "#555",
                fontSize: 10,
                letterSpacing: 1,
              }}
            >
              {isPremium ? "PREMIUM" : "FREE"}
            </div>
            <div style={{ color: "#555", fontSize: 10, marginTop: 4 }}>
              {myId ?? "+777 **** ****"}
            </div>
          </div>
        </div>

        {activeAction === "main" && (
          <div style={{ display: "flex", gap: 8, marginTop: 16 }}>
            <button
              type="button"
              data-ocid="wallet.send_button"
              onClick={() => setActiveAction("send")}
              style={{
                flex: 1,
                background: `${NEON_CYAN}15`,
                border: `1px solid ${NEON_CYAN}44`,
                borderRadius: 10,
                padding: "10px 0",
                color: NEON_CYAN,
                fontSize: 13,
                fontWeight: 600,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 6,
              }}
            >
              <Send size={14} /> GÖNDER
            </button>
            <button
              type="button"
              data-ocid="wallet.receive_button"
              onClick={() => setActiveAction("receive")}
              style={{
                flex: 1,
                background: `${NEON_GREEN}15`,
                border: `1px solid ${NEON_GREEN}44`,
                borderRadius: 10,
                padding: "10px 0",
                color: NEON_GREEN,
                fontSize: 13,
                fontWeight: 600,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 6,
              }}
            >
              <Download size={14} /> AL
            </button>
          </div>
        )}

        {activeAction === "send" && (
          <div
            style={{
              marginTop: 12,
              display: "flex",
              flexDirection: "column",
              gap: 8,
            }}
          >
            {/* Toggle ICP / Local transfer */}
            <div style={{ display: "flex", gap: 6, marginBottom: 4 }}>
              <button
                type="button"
                onClick={() => setUseICP(false)}
                style={{
                  flex: 1,
                  padding: "6px 0",
                  borderRadius: 6,
                  cursor: "pointer",
                  fontSize: 11,
                  fontWeight: 600,
                  background: !useICP ? `${NEON_CYAN}20` : "#0a0f1a",
                  border: `1px solid ${!useICP ? NEON_CYAN : "#222"}`,
                  color: !useICP ? NEON_CYAN : "#555",
                }}
              >
                +777 ID
              </button>
              <button
                type="button"
                onClick={() => setUseICP(true)}
                style={{
                  flex: 1,
                  padding: "6px 0",
                  borderRadius: 6,
                  cursor: "pointer",
                  fontSize: 11,
                  fontWeight: 600,
                  background: useICP ? `${NEON_GREEN}20` : "#0a0f1a",
                  border: `1px solid ${useICP ? NEON_GREEN : "#222"}`,
                  color: useICP ? NEON_GREEN : "#555",
                }}
              >
                🔗 ICP Zincir
              </button>
            </div>
            <input
              data-ocid="wallet.recipient_id_input"
              placeholder="+777 XXXX XXXX"
              value={recipientInput}
              onChange={(e) => setRecipientInput(e.target.value)}
              style={{
                background: "#0a0f1a",
                border: `1px solid ${useICP ? NEON_GREEN : NEON_CYAN}33`,
                borderRadius: 8,
                padding: "8px 12px",
                color: "#fff",
                fontSize: 13,
                outline: "none",
              }}
            />
            <input
              data-ocid="wallet.amount_input"
              placeholder="Miktar (OMNI)"
              type="number"
              value={sendAmount}
              onChange={(e) => setSendAmount(e.target.value)}
              style={{
                background: "#0a0f1a",
                border: `1px solid ${NEON_CYAN}33`,
                borderRadius: 8,
                padding: "8px 12px",
                color: "#fff",
                fontSize: 13,
                outline: "none",
              }}
            />
            {useICP && (
              <div
                style={{
                  color: "#2FF5C7",
                  fontSize: 10,
                  display: "flex",
                  alignItems: "center",
                  gap: 4,
                }}
              >
                <span
                  style={{
                    width: 5,
                    height: 5,
                    borderRadius: "50%",
                    background: "#2FF5C7",
                    display: "inline-block",
                  }}
                />
                Gerçek ICP zincir transferi · +777 ID ile gönder · Geri alınamaz
              </div>
            )}
            <div style={{ display: "flex", gap: 6 }}>
              <button
                type="button"
                data-ocid="wallet.send_submit_button"
                disabled={icpToken.isTransferring}
                onClick={handleSend}
                style={{
                  flex: 1,
                  background: icpToken.isTransferring ? "#333" : NEON_CYAN,
                  border: "none",
                  borderRadius: 8,
                  padding: "8px 0",
                  color: BG_DARK,
                  fontSize: 13,
                  fontWeight: 700,
                  cursor: icpToken.isTransferring ? "not-allowed" : "pointer",
                  opacity: icpToken.isTransferring ? 0.7 : 1,
                }}
              >
                {icpToken.isTransferring ? "GÖNDERİLİYOR..." : "GÖNDER"}
              </button>
              <button
                type="button"
                data-ocid="wallet.send_cancel_button"
                onClick={() => setActiveAction("main")}
                style={{
                  flex: 1,
                  background: "#1a2030",
                  border: "1px solid #333",
                  borderRadius: 8,
                  padding: "8px 0",
                  color: "#888",
                  fontSize: 13,
                  cursor: "pointer",
                }}
              >
                İPTAL
              </button>
            </div>
          </div>
        )}

        {activeAction === "receive" && (
          <div style={{ marginTop: 12 }}>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(8, 1fr)",
                gap: 2,
                width: 96,
                margin: "0 auto 12px",
              }}
            >
              {QR_CELLS.map((cell) => (
                <div
                  key={cell.id}
                  style={{
                    width: 10,
                    height: 10,
                    borderRadius: 1,
                    background: cell.isOn ? NEON_CYAN : "#1a2030",
                  }}
                />
              ))}
            </div>
            <div
              style={{
                textAlign: "center",
                color: "#888",
                fontSize: 11,
                marginBottom: 8,
              }}
            >
              {myId ?? "+777 XXXX XXXX"}
            </div>
            <button
              type="button"
              data-ocid="wallet.copy_id_button"
              onClick={handleCopyId}
              style={{
                width: "100%",
                background: `${NEON_GREEN}15`,
                border: `1px solid ${NEON_GREEN}44`,
                borderRadius: 8,
                padding: "8px 0",
                color: NEON_GREEN,
                fontSize: 12,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 4,
              }}
            >
              <Copy size={12} /> ID KOPYAla
            </button>
            <button
              type="button"
              data-ocid="wallet.receive_cancel_button"
              onClick={() => setActiveAction("main")}
              style={{
                width: "100%",
                marginTop: 6,
                background: "transparent",
                border: "none",
                color: "#555",
                fontSize: 12,
                cursor: "pointer",
              }}
            >
              Kapat
            </button>
          </div>
        )}
      </div>

      {/* Earn Activities */}
      <div
        style={{
          background: BG_CARD,
          border: "1px solid #1a2030",
          borderRadius: 12,
          padding: 16,
        }}
      >
        <div
          style={{
            color: "#888",
            fontSize: 11,
            letterSpacing: 1,
            marginBottom: 12,
          }}
        >
          OMNI KAZAN
        </div>
        <div
          style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}
        >
          {EARN_ACTIVITIES.map((act) => (
            <button
              type="button"
              key={act.id}
              data-ocid={`wallet.${act.id}_button`}
              onClick={() => claimReward(act.id, act.amount, act.label)}
              disabled={claimedRewards.includes(act.id)}
              style={{
                background: claimedRewards.includes(act.id)
                  ? "#0d1117"
                  : `${NEON_CYAN}08`,
                border: `1px solid ${claimedRewards.includes(act.id) ? "#1a2030" : `${NEON_CYAN}33`}`,
                borderRadius: 10,
                padding: 10,
                cursor: claimedRewards.includes(act.id) ? "default" : "pointer",
                display: "flex",
                flexDirection: "column",
                gap: 4,
                textAlign: "left",
              }}
            >
              <div style={{ fontSize: 18 }}>{act.icon}</div>
              <div
                style={{
                  color: claimedRewards.includes(act.id) ? "#444" : "#ccc",
                  fontSize: 11,
                }}
              >
                {act.label}
              </div>
              <div
                style={{
                  color: claimedRewards.includes(act.id) ? "#333" : NEON_GREEN,
                  fontSize: 12,
                  fontWeight: 700,
                }}
              >
                {claimedRewards.includes(act.id)
                  ? "✓ Alındı"
                  : `+${act.amount} OMNI`}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* ICP On-Chain Transactions */}
      {icpToken.transactions.length > 0 && (
        <div
          style={{
            background: BG_CARD,
            border: `1px solid ${NEON_GREEN}33`,
            borderRadius: 12,
            padding: 16,
          }}
        >
          <div
            style={{
              color: "#888",
              fontSize: 11,
              letterSpacing: 1,
              marginBottom: 12,
              display: "flex",
              alignItems: "center",
              gap: 6,
            }}
          >
            <span
              style={{
                width: 6,
                height: 6,
                borderRadius: "50%",
                background: NEON_GREEN,
                display: "inline-block",
                boxShadow: `0 0 6px ${NEON_GREEN}`,
              }}
            />
            ZİNCİR İŞLEMLERİ
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {icpToken.transactions.slice(0, 5).map((tx, idx) => {
              const tsMs = Number(tx.timestamp / BigInt(1_000_000));
              const diff = Date.now() - tsMs;
              const relTime =
                diff < 3600000
                  ? `${Math.floor(diff / 60000)}d`
                  : diff < 86400000
                    ? `${Math.floor(diff / 3600000)}s`
                    : `${Math.floor(diff / 86400000)}g`;
              const isSend = tx.from.toString() !== "2vxsx-fae";
              return (
                <div
                  key={String(tx.id)}
                  data-ocid={`wallet.item.${idx + 1}`}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    padding: "8px 0",
                    borderBottom: "1px solid #0f1520",
                  }}
                >
                  <div
                    style={{ display: "flex", alignItems: "center", gap: 10 }}
                  >
                    <div
                      style={{
                        width: 32,
                        height: 32,
                        borderRadius: 8,
                        background: `${isSend ? NEON_RED : NEON_GREEN}15`,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        color: isSend ? NEON_RED : NEON_GREEN,
                        fontSize: 14,
                      }}
                    >
                      {isSend ? (
                        <ArrowUpRight size={14} />
                      ) : (
                        <ArrowDownLeft size={14} />
                      )}
                    </div>
                    <div>
                      <div style={{ color: "#ccc", fontSize: 12 }}>
                        {isSend ? "Gönderildi" : "Alındı"} · Zincir
                      </div>
                      <div style={{ color: "#444", fontSize: 10 }}>
                        {relTime} önce
                      </div>
                    </div>
                  </div>
                  <div
                    style={{
                      color: isSend ? NEON_RED : NEON_GREEN,
                      fontSize: 13,
                      fontWeight: 700,
                    }}
                  >
                    {isSend ? "-" : "+"}
                    {tx.amount.toString()} OMNI
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Transactions */}
      <div
        style={{
          background: BG_CARD,
          border: "1px solid #1a2030",
          borderRadius: 12,
          padding: 16,
        }}
      >
        <div
          style={{
            color: "#888",
            fontSize: 11,
            letterSpacing: 1,
            marginBottom: 12,
          }}
        >
          SON İŞLEMLER
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {transactions.slice(0, 8).map((tx: TokenTransaction, idx: number) => (
            <div
              key={tx.id}
              data-ocid={`wallet.item.${idx + 1}`}
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                padding: "8px 0",
                borderBottom: "1px solid #0f1520",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: 8,
                    background: `${TX_COLORS[tx.type] ?? NEON_CYAN}15`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: TX_COLORS[tx.type] ?? NEON_CYAN,
                    fontSize: 14,
                  }}
                >
                  {tx.type === "earn" || tx.type === "reward" ? (
                    <ArrowDownLeft size={14} />
                  ) : (
                    <ArrowUpRight size={14} />
                  )}
                </div>
                <div>
                  <div style={{ color: "#ccc", fontSize: 12 }}>
                    {tx.description}
                  </div>
                  <div style={{ color: "#444", fontSize: 10 }}>
                    {formatTime(tx.timestamp)} önce
                  </div>
                </div>
              </div>
              <div
                style={{
                  color: TX_COLORS[tx.type] ?? NEON_CYAN,
                  fontSize: 13,
                  fontWeight: 700,
                }}
              >
                {tx.amount > 0 ? `+${tx.amount}` : tx.amount} OMNI
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Premium Upgrade */}
      {!isPremium && (
        <div
          style={{
            background: "linear-gradient(135deg, #1a0a2e 0%, #0d1117 100%)",
            border: `1px solid ${NEON_PURPLE}44`,
            borderRadius: 12,
            padding: 16,
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              marginBottom: 8,
            }}
          >
            <Crown size={16} style={{ color: NEON_GOLD }} />
            <span style={{ color: NEON_GOLD, fontSize: 13, fontWeight: 700 }}>
              PREMIUM'A GEÇ
            </span>
          </div>
          <div style={{ color: "#888", fontSize: 12, marginBottom: 12 }}>
            Sınırsız özellikler, öncelikli eşleşme ve özel ID oluşturma.
          </div>
          <button
            type="button"
            data-ocid="wallet.upgrade_button"
            onClick={upgradeToPremium}
            style={{
              width: "100%",
              background: `linear-gradient(90deg, ${NEON_PURPLE}, #7c3aed)`,
              border: "none",
              borderRadius: 8,
              padding: "10px 0",
              color: "#fff",
              fontSize: 13,
              fontWeight: 700,
              cursor: "pointer",
            }}
          >
            PREMIUM AKTİF ET — 500 OMNI
          </button>
        </div>
      )}
    </div>
  );
}

// ============================
// Tab 2: P2P MARKET
// ============================
function P2PMarketTab() {
  const {
    p2pOffers,
    escrowTrades,
    userTrustScore,
    completedTrades,
    tokenBalance,
    myId,
    createP2POffer,
    acceptOffer,
    confirmPaymentSent,
    confirmPaymentReceived,
    disputeTrade,
    cancelEscrow,
  } = useOmniStore();

  const [showOfferForm, setShowOfferForm] = useState(false);
  const [offerType, setOfferType] = useState<"sell" | "buy">("sell");
  const [offerAmount, setOfferAmount] = useState("");
  const [offerPrice, setOfferPrice] = useState("");
  const [escrowModal, setEscrowModal] = useState<{
    offerId: string;
    amount: number;
    price: number;
  } | null>(null);

  const activeEscrows = escrowTrades.filter(
    (e) =>
      e.status !== "completed" &&
      e.status !== "cancelled" &&
      e.buyerId === (myId ?? ""),
  );

  const handleCreateOffer = () => {
    const amount = Number.parseInt(offerAmount);
    const price = Number.parseFloat(offerPrice);
    if (!amount || !price || amount <= 0 || price <= 0) {
      toast.error("Geçersiz değer");
      return;
    }
    if (offerType === "sell" && tokenBalance < amount) {
      toast.error("Yetersiz bakiye");
      return;
    }
    createP2POffer(offerType, amount, price);
    toast.success(`Teklif oluşturuldu: ${amount} OMNI — €${price}`);
    setShowOfferForm(false);
    setOfferAmount("");
    setOfferPrice("");
  };

  const handleAccept = (offer: P2POffer) => {
    setEscrowModal({
      offerId: offer.id,
      amount: offer.amount,
      price: offer.price,
    });
  };

  const handleConfirmEscrow = () => {
    if (!escrowModal) return;
    acceptOffer(escrowModal.offerId);
    toast.success(`${escrowModal.amount} OMNI escrow'a kilitlendi!`);
    setEscrowModal(null);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {/* Header */}
      <div
        style={{
          background: BG_CARD,
          border: "1px solid #1a2030",
          borderRadius: 12,
          padding: 16,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <div>
          <div
            style={{
              color: "#fff",
              fontSize: 14,
              fontWeight: 700,
              marginBottom: 4,
            }}
          >
            P2P Nakit Pazarı
          </div>
          <div
            style={{
              color: "#888",
              fontSize: 11,
              display: "flex",
              alignItems: "center",
              gap: 4,
            }}
          >
            <Star size={11} style={{ color: NEON_GOLD }} />
            <span style={{ color: NEON_GOLD }}>
              {userTrustScore.toFixed(1)}
            </span>
            <span>· {completedTrades} işlem</span>
            {activeEscrows.length > 0 && (
              <span
                style={{
                  background: `${NEON_GOLD}22`,
                  border: `1px solid ${NEON_GOLD}44`,
                  borderRadius: 4,
                  padding: "0 6px",
                  color: NEON_GOLD,
                  fontSize: 10,
                  marginLeft: 4,
                }}
              >
                ● {activeEscrows.length} AKTİF ESCROW
              </span>
            )}
          </div>
        </div>
        <button
          type="button"
          data-ocid="p2p.open_modal_button"
          onClick={() => setShowOfferForm(!showOfferForm)}
          style={{
            background: `linear-gradient(90deg, ${NEON_CYAN}, ${NEON_GREEN})`,
            border: "none",
            borderRadius: 10,
            padding: "8px 14px",
            color: BG_DARK,
            fontSize: 12,
            fontWeight: 700,
            cursor: "pointer",
          }}
        >
          + TEKLİF
        </button>
      </div>

      {/* Create Offer Form */}
      {showOfferForm && (
        <div
          data-ocid="p2p.modal"
          style={{
            background: BG_CARD,
            border: `1px solid ${NEON_CYAN}33`,
            borderRadius: 12,
            padding: 16,
          }}
        >
          <div
            style={{
              color: "#ccc",
              fontSize: 13,
              fontWeight: 700,
              marginBottom: 12,
            }}
          >
            TEKLİF OLUŞTUR
          </div>
          {/* Type Toggle */}
          <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
            {(["sell", "buy"] as const).map((t) => (
              <button
                type="button"
                key={t}
                data-ocid={`p2p.${t}_toggle`}
                onClick={() => setOfferType(t)}
                style={{
                  flex: 1,
                  padding: "8px 0",
                  borderRadius: 8,
                  cursor: "pointer",
                  background:
                    offerType === t
                      ? t === "sell"
                        ? `${NEON_CYAN}20`
                        : `${NEON_PURPLE}20`
                      : "#0a0f1a",
                  border: `1px solid ${offerType === t ? (t === "sell" ? NEON_CYAN : NEON_PURPLE) : "#222"}`,
                  color:
                    offerType === t
                      ? t === "sell"
                        ? NEON_CYAN
                        : NEON_PURPLE
                      : "#555",
                  fontSize: 13,
                  fontWeight: 600,
                }}
              >
                {t === "sell" ? "OMNI SAT" : "OMNI AL"}
              </button>
            ))}
          </div>
          <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
            <input
              data-ocid="p2p.amount_input"
              type="number"
              placeholder="Miktar (OMNI)"
              value={offerAmount}
              onChange={(e) => setOfferAmount(e.target.value)}
              style={{
                flex: 1,
                background: "#0a0f1a",
                border: "1px solid #222",
                borderRadius: 8,
                padding: "8px 12px",
                color: "#fff",
                fontSize: 13,
                outline: "none",
              }}
            />
            <input
              data-ocid="p2p.price_input"
              type="number"
              placeholder="Fiyat (€)"
              value={offerPrice}
              onChange={(e) => setOfferPrice(e.target.value)}
              style={{
                flex: 1,
                background: "#0a0f1a",
                border: "1px solid #222",
                borderRadius: 8,
                padding: "8px 12px",
                color: "#fff",
                fontSize: 13,
                outline: "none",
              }}
            />
          </div>
          <div style={{ color: "#555", fontSize: 10, marginBottom: 12 }}>
            Platform komisyonu: %1.5 · Escrow koruması dahil
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button
              type="button"
              data-ocid="p2p.submit_button"
              onClick={handleCreateOffer}
              style={{
                flex: 1,
                background: NEON_CYAN,
                border: "none",
                borderRadius: 8,
                padding: "9px 0",
                color: BG_DARK,
                fontSize: 13,
                fontWeight: 700,
                cursor: "pointer",
              }}
            >
              OLUŞTUR
            </button>
            <button
              type="button"
              data-ocid="p2p.cancel_button"
              onClick={() => setShowOfferForm(false)}
              style={{
                flex: 1,
                background: "#0a0f1a",
                border: "1px solid #222",
                borderRadius: 8,
                padding: "9px 0",
                color: "#666",
                fontSize: 13,
                cursor: "pointer",
              }}
            >
              İPTAL
            </button>
          </div>
        </div>
      )}

      {/* Active Escrows */}
      {activeEscrows.length > 0 && (
        <div
          style={{
            background: BG_CARD,
            border: `1px solid ${NEON_GOLD}33`,
            borderRadius: 12,
            padding: 16,
          }}
        >
          <div
            style={{
              color: NEON_GOLD,
              fontSize: 11,
              letterSpacing: 1,
              marginBottom: 12,
              display: "flex",
              alignItems: "center",
              gap: 4,
            }}
          >
            <Lock size={12} /> AKTİF ESCROW'LAR
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {activeEscrows.map((trade: EscrowTrade, idx: number) => (
              <div
                key={trade.id}
                data-ocid={`p2p.item.${idx + 1}`}
                style={{
                  background: "#0a0f1a",
                  borderRadius: 10,
                  padding: 12,
                  border: `1px solid ${ESCROW_COLORS[trade.status]}33`,
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: 8,
                  }}
                >
                  <div
                    style={{
                      color: ESCROW_COLORS[trade.status],
                      fontSize: 12,
                      fontWeight: 600,
                    }}
                  >
                    {ESCROW_LABELS[trade.status]}
                  </div>
                  <div
                    style={{
                      color: "#555",
                      fontSize: 10,
                      display: "flex",
                      alignItems: "center",
                      gap: 3,
                    }}
                  >
                    <Clock size={10} /> {formatCountdown(trade.expiresAt)}
                  </div>
                </div>
                <div style={{ color: "#ccc", fontSize: 13, marginBottom: 8 }}>
                  {trade.amount} OMNI · €{trade.price.toFixed(2)}
                  <span style={{ color: "#555", fontSize: 10, marginLeft: 6 }}>
                    Satıcı: {maskId(trade.sellerId)}
                  </span>
                </div>
                <div style={{ display: "flex", gap: 6 }}>
                  {trade.status === "tokens_locked" && (
                    <button
                      type="button"
                      data-ocid={`p2p.confirm_button.${idx + 1}`}
                      onClick={() => {
                        confirmPaymentSent(trade.id);
                        toast.success("Ödeme gönderildi olarak işaretlendi");
                      }}
                      style={{
                        flex: 1,
                        background: `${NEON_CYAN}15`,
                        border: `1px solid ${NEON_CYAN}44`,
                        borderRadius: 6,
                        padding: "6px 0",
                        color: NEON_CYAN,
                        fontSize: 11,
                        cursor: "pointer",
                      }}
                    >
                      ÖDEME GÖNDERİLDİ
                    </button>
                  )}
                  {trade.status === "payment_sent" && (
                    <button
                      type="button"
                      data-ocid={`p2p.confirm_button.${idx + 1}`}
                      onClick={() => {
                        confirmPaymentReceived(trade.id);
                        toast.success(
                          "İşlem tamamlandı! Token cüzdanına eklendi.",
                        );
                      }}
                      style={{
                        flex: 1,
                        background: `${NEON_GREEN}15`,
                        border: `1px solid ${NEON_GREEN}44`,
                        borderRadius: 6,
                        padding: "6px 0",
                        color: NEON_GREEN,
                        fontSize: 11,
                        cursor: "pointer",
                      }}
                    >
                      ÖDEME ONAYLANDIM
                    </button>
                  )}
                  {(trade.status === "tokens_locked" ||
                    trade.status === "payment_sent") && (
                    <>
                      <button
                        type="button"
                        data-ocid={`p2p.delete_button.${idx + 1}`}
                        onClick={() => {
                          cancelEscrow(trade.id);
                          toast.info("Escrow iptal edildi");
                        }}
                        style={{
                          background: `${NEON_RED}10`,
                          border: `1px solid ${NEON_RED}33`,
                          borderRadius: 6,
                          padding: "6px 10px",
                          color: NEON_RED,
                          fontSize: 11,
                          cursor: "pointer",
                        }}
                      >
                        İPTAL
                      </button>
                      <button
                        type="button"
                        data-ocid={`p2p.secondary_button.${idx + 1}`}
                        onClick={() => {
                          disputeTrade(trade.id);
                          toast.warning("Anlaşmazlık bildirimi gönderildi");
                        }}
                        style={{
                          background: `${NEON_GOLD}10`,
                          border: `1px solid ${NEON_GOLD}33`,
                          borderRadius: 6,
                          padding: "6px 10px",
                          color: NEON_GOLD,
                          fontSize: 11,
                          cursor: "pointer",
                        }}
                      >
                        ⚠️
                      </button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Offers List */}
      <div
        style={{
          background: BG_CARD,
          border: "1px solid #1a2030",
          borderRadius: 12,
          padding: 16,
        }}
      >
        <div
          style={{
            color: "#888",
            fontSize: 11,
            letterSpacing: 1,
            marginBottom: 12,
          }}
        >
          AKTİF TEKLİFLER
        </div>
        {p2pOffers.length === 0 ? (
          <div
            data-ocid="p2p.empty_state"
            style={{
              color: "#444",
              fontSize: 12,
              textAlign: "center",
              padding: 20,
            }}
          >
            Aktif teklif yok
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {p2pOffers.slice(0, 8).map((offer: P2POffer, idx: number) => (
              <div
                key={offer.id}
                data-ocid={`p2p.row.${idx + 1}`}
                style={{
                  background: "#0a0f1a",
                  borderRadius: 10,
                  padding: 12,
                  border: "1px solid #1a2030",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <div style={{ flex: 1 }}>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 6,
                      marginBottom: 4,
                    }}
                  >
                    <span
                      style={{
                        color: NEON_CYAN,
                        fontSize: 14,
                        fontWeight: 700,
                      }}
                    >
                      {offer.amount} OMNI
                    </span>
                    <span style={{ color: "#555", fontSize: 11 }}>→</span>
                    <span
                      style={{
                        color: NEON_GREEN,
                        fontSize: 14,
                        fontWeight: 700,
                      }}
                    >
                      €{offer.price.toFixed(2)}
                    </span>
                  </div>
                  <div
                    style={{
                      color: "#555",
                      fontSize: 10,
                      display: "flex",
                      alignItems: "center",
                      gap: 6,
                    }}
                  >
                    <span>{maskId(offer.sellerId)}</span>
                    <span style={{ color: NEON_GOLD }}>
                      ⭐ {offer.trustScore.toFixed(1)}
                    </span>
                    <span style={{ color: "#333" }}>·</span>
                    <span>{formatTime(offer.createdAt)}</span>
                  </div>
                </div>
                <button
                  type="button"
                  data-ocid={`p2p.primary_button.${idx + 1}`}
                  onClick={() => handleAccept(offer)}
                  style={{
                    background: `${NEON_CYAN}15`,
                    border: `1px solid ${NEON_CYAN}44`,
                    borderRadius: 8,
                    padding: "6px 12px",
                    color: NEON_CYAN,
                    fontSize: 11,
                    fontWeight: 600,
                    cursor: "pointer",
                    whiteSpace: "nowrap",
                  }}
                >
                  KABUL ET
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Escrow Confirmation Modal */}
      {escrowModal && (
        <div
          data-ocid="p2p.dialog"
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.8)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 100,
            padding: 16,
          }}
        >
          <div
            style={{
              background: BG_CARD2,
              border: `1px solid ${NEON_GOLD}44`,
              borderRadius: 16,
              padding: 24,
              maxWidth: 340,
              width: "100%",
            }}
          >
            <div style={{ textAlign: "center", marginBottom: 16 }}>
              <Lock size={32} style={{ color: NEON_GOLD, marginBottom: 8 }} />
              <div style={{ color: "#fff", fontSize: 16, fontWeight: 700 }}>
                Escrow Onayla
              </div>
            </div>
            <div
              style={{
                background: `${NEON_GOLD}10`,
                border: `1px solid ${NEON_GOLD}33`,
                borderRadius: 10,
                padding: 12,
                marginBottom: 16,
                textAlign: "center",
              }}
            >
              <div style={{ color: NEON_GOLD, fontSize: 20, fontWeight: 700 }}>
                {escrowModal.amount} OMNI
              </div>
              <div style={{ color: "#888", fontSize: 12, marginTop: 4 }}>
                kilitlenecek · €{escrowModal.price.toFixed(2)} karşılığı
              </div>
            </div>
            <div
              style={{
                color: "#888",
                fontSize: 12,
                textAlign: "center",
                marginBottom: 16,
              }}
            >
              Token escrow'a kilitlenir. Satıcı ödemeyi onaylayana kadar bekler.
              <span
                style={{ color: NEON_GOLD, display: "block", marginTop: 4 }}
              >
                ⏱ 24 saat süresi
              </span>
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <button
                type="button"
                data-ocid="p2p.confirm_button"
                onClick={handleConfirmEscrow}
                style={{
                  flex: 1,
                  background: NEON_GOLD,
                  border: "none",
                  borderRadius: 8,
                  padding: "10px 0",
                  color: BG_DARK,
                  fontSize: 13,
                  fontWeight: 700,
                  cursor: "pointer",
                }}
              >
                ONAYLA
              </button>
              <button
                type="button"
                data-ocid="p2p.cancel_button"
                onClick={() => setEscrowModal(null)}
                style={{
                  flex: 1,
                  background: "#0a0f1a",
                  border: "1px solid #222",
                  borderRadius: 8,
                  padding: "10px 0",
                  color: "#666",
                  fontSize: 13,
                  cursor: "pointer",
                }}
              >
                İPTAL
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ============================
// Tab 3: KİMLİK MARKET
// ============================
function IDMarketTab() {
  const { idListings, tokenBalance, myId, userTrustScore, bidOnID, buyNowID } =
    useOmniStore();

  const [bidModal, setBidModal] = useState<{ listing: IDListing } | null>(null);
  const [bidAmount, setBidAmount] = useState("");

  const myListings = idListings.filter((l) => l.sellerId === myId);
  const otherListings = idListings.filter((l) => l.sellerId !== myId);

  const handleBid = () => {
    if (!bidModal) return;
    const amount = Number.parseInt(bidAmount);
    if (!amount || amount <= bidModal.listing.currentBid) {
      toast.error(
        `Teklif mevcut tekliften yüksek olmalı: ${bidModal.listing.currentBid} OMNI`,
      );
      return;
    }
    if (amount > tokenBalance) {
      toast.error("Yetersiz bakiye");
      return;
    }
    bidOnID(bidModal.listing.id, amount);
    toast.success(`${amount} OMNI teklif verildi!`);
    setBidModal(null);
    setBidAmount("");
  };

  const handleBuyNow = (listing: IDListing) => {
    if (tokenBalance < listing.buyNowPrice) {
      toast.error("Yetersiz bakiye");
      return;
    }
    const success = buyNowID(listing.id);
    if (success) toast.success(`✅ ${listing.idValue} sana transfer edildi!`);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {/* Header */}
      <div
        style={{
          background: BG_CARD,
          border: `1px solid ${NEON_PURPLE}33`,
          borderRadius: 12,
          padding: 16,
        }}
      >
        <div
          style={{
            color: NEON_PURPLE,
            fontSize: 13,
            fontWeight: 700,
            marginBottom: 4,
          }}
        >
          🆔 KİMLİK PAZARI
        </div>
        <div style={{ color: "#666", fontSize: 11 }}>
          Nadir +777 ID'ler — sahip ol, sat, kazan
        </div>
        <div
          style={{
            color: "#444",
            fontSize: 10,
            marginTop: 4,
            display: "flex",
            alignItems: "center",
            gap: 4,
          }}
        >
          <Shield size={10} style={{ color: NEON_GREEN }} />
          <span style={{ color: NEON_GREEN }}>Escrow korumalı</span> · Her
          satışta %1.5 komisyon
        </div>
      </div>

      {/* Listings */}
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {otherListings.map((listing: IDListing, idx: number) => (
          <div
            key={listing.id}
            data-ocid={`idmarket.item.${idx + 1}`}
            style={{
              background: BG_CARD,
              borderRadius: 12,
              padding: 14,
              overflow: "hidden",
              border: `1px solid ${RARITY_COLORS[listing.rarity]}44`,
              position: "relative",
            }}
          >
            {/* Rarity glow */}
            <div
              style={{
                position: "absolute",
                top: 0,
                right: 0,
                width: 80,
                height: 80,
                background: `radial-gradient(circle at top right, ${RARITY_COLORS[listing.rarity]}15, transparent 70%)`,
              }}
            />
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "flex-start",
                marginBottom: 10,
              }}
            >
              <div>
                <div
                  style={{
                    color: "#fff",
                    fontSize: 16,
                    fontWeight: 700,
                    letterSpacing: 1,
                  }}
                >
                  {listing.idValue}
                </div>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    marginTop: 4,
                  }}
                >
                  <span
                    style={{
                      background: `${RARITY_COLORS[listing.rarity]}22`,
                      border: `1px solid ${RARITY_COLORS[listing.rarity]}66`,
                      borderRadius: 4,
                      padding: "1px 6px",
                      color: RARITY_COLORS[listing.rarity],
                      fontSize: 9,
                      letterSpacing: 1,
                      fontWeight: 700,
                    }}
                  >
                    {RARITY_LABELS[listing.rarity]}
                  </span>
                  <span style={{ color: "#555", fontSize: 10 }}>
                    ⭐ {listing.sellerTrust.toFixed(1)}
                  </span>
                </div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div style={{ color: "#888", fontSize: 10, marginBottom: 2 }}>
                  Mevcut teklif
                </div>
                <div
                  style={{ color: NEON_GOLD, fontSize: 14, fontWeight: 700 }}
                >
                  {listing.currentBid.toLocaleString()} OMNI
                </div>
                <div
                  style={{
                    color: "#555",
                    fontSize: 10,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "flex-end",
                    gap: 2,
                    marginTop: 2,
                  }}
                >
                  <Clock size={9} /> {formatCountdown(listing.expiresAt)}
                </div>
              </div>
            </div>
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <div style={{ flex: 1 }}>
                <div style={{ color: "#555", fontSize: 10 }}>Hemen Al</div>
                <div
                  style={{ color: NEON_CYAN, fontSize: 13, fontWeight: 700 }}
                >
                  {listing.buyNowPrice.toLocaleString()} OMNI
                </div>
              </div>
              <button
                type="button"
                data-ocid={`idmarket.secondary_button.${idx + 1}`}
                onClick={() => {
                  setBidModal({ listing });
                  setBidAmount("");
                }}
                style={{
                  background: `${NEON_PURPLE}15`,
                  border: `1px solid ${NEON_PURPLE}44`,
                  borderRadius: 8,
                  padding: "7px 12px",
                  color: NEON_PURPLE,
                  fontSize: 11,
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                TEKLİF VER
              </button>
              <button
                type="button"
                data-ocid={`idmarket.primary_button.${idx + 1}`}
                onClick={() => handleBuyNow(listing)}
                style={{
                  background: `${RARITY_COLORS[listing.rarity]}20`,
                  border: `1px solid ${RARITY_COLORS[listing.rarity]}66`,
                  borderRadius: 8,
                  padding: "7px 12px",
                  color: RARITY_COLORS[listing.rarity],
                  fontSize: 11,
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                HEMEN AL
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* My Listings */}
      {myListings.length > 0 && (
        <div
          style={{
            background: BG_CARD,
            border: "1px solid #1a2030",
            borderRadius: 12,
            padding: 16,
          }}
        >
          <div
            style={{
              color: "#888",
              fontSize: 11,
              letterSpacing: 1,
              marginBottom: 10,
            }}
          >
            KENDİ ID'LERİM
          </div>
          {myListings.map((l, idx) => (
            <div
              key={l.id}
              data-ocid={`idmarket.row.${idx + 1}`}
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                padding: "8px 0",
                borderBottom: "1px solid #0f1520",
              }}
            >
              <span style={{ color: "#ccc", fontSize: 12 }}>{l.idValue}</span>
              <span style={{ color: RARITY_COLORS[l.rarity], fontSize: 10 }}>
                {RARITY_LABELS[l.rarity]}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* My Trust Score */}
      <div
        style={{
          background: BG_CARD,
          border: "1px solid #1a2030",
          borderRadius: 12,
          padding: 16,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <div>
          <div style={{ color: "#888", fontSize: 11, marginBottom: 4 }}>
            GÜVENİLİRLİK SKORUM
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <Star size={16} style={{ color: NEON_GOLD }} />
            <span style={{ color: NEON_GOLD, fontSize: 20, fontWeight: 700 }}>
              {userTrustScore.toFixed(1)}
            </span>
            <span style={{ color: "#555", fontSize: 12 }}>/ 5.0</span>
          </div>
        </div>
        <div style={{ textAlign: "right" }}>
          <div style={{ color: "#555", fontSize: 10 }}>Tamamlanan İşlem</div>
          <div style={{ color: NEON_GREEN, fontSize: 18, fontWeight: 700 }}>
            7
          </div>
        </div>
      </div>

      {/* Bid Modal */}
      {bidModal && (
        <div
          data-ocid="idmarket.dialog"
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.85)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 100,
            padding: 16,
          }}
        >
          <div
            style={{
              background: BG_CARD2,
              border: `1px solid ${NEON_PURPLE}44`,
              borderRadius: 16,
              padding: 24,
              maxWidth: 320,
              width: "100%",
            }}
          >
            <div
              style={{
                color: "#fff",
                fontSize: 15,
                fontWeight: 700,
                marginBottom: 4,
              }}
            >
              {bidModal.listing.idValue}
            </div>
            <div style={{ color: "#555", fontSize: 11, marginBottom: 16 }}>
              Mevcut teklif:{" "}
              <span style={{ color: NEON_GOLD }}>
                {bidModal.listing.currentBid} OMNI
              </span>
            </div>
            <input
              data-ocid="idmarket.input"
              type="number"
              placeholder={`${bidModal.listing.currentBid + 50} OMNI'den fazla`}
              value={bidAmount}
              onChange={(e) => setBidAmount(e.target.value)}
              style={{
                width: "100%",
                background: "#0a0f1a",
                border: `1px solid ${NEON_PURPLE}44`,
                borderRadius: 8,
                padding: "10px 12px",
                color: "#fff",
                fontSize: 13,
                outline: "none",
                marginBottom: 12,
                boxSizing: "border-box",
              }}
            />
            <div style={{ display: "flex", gap: 8 }}>
              <button
                type="button"
                data-ocid="idmarket.confirm_button"
                onClick={handleBid}
                style={{
                  flex: 1,
                  background: NEON_PURPLE,
                  border: "none",
                  borderRadius: 8,
                  padding: "10px 0",
                  color: "#fff",
                  fontSize: 13,
                  fontWeight: 700,
                  cursor: "pointer",
                }}
              >
                TEKLİF VER
              </button>
              <button
                type="button"
                data-ocid="idmarket.cancel_button"
                onClick={() => setBidModal(null)}
                style={{
                  flex: 1,
                  background: "#0a0f1a",
                  border: "1px solid #222",
                  borderRadius: 8,
                  padding: "10px 0",
                  color: "#666",
                  fontSize: 13,
                  cursor: "pointer",
                }}
              >
                İPTAL
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ============================
// Tab 4: DROPLAR
// ============================
function DropsTab() {
  const {
    myId,
    claimedDrops,
    referralCount,
    dailyStreakDays,
    dailyStreakClaimed,
    claimDrop,
    claimDailyStreak,
  } = useOmniStore();

  const [countdown, setCountdown] = useState<Record<string, string>>({});

  useEffect(() => {
    const update = () => {
      const times: Record<string, string> = {};
      for (const drop of MOCK_DROPS) {
        times[drop.id] = formatCountdown(drop.expiresAt);
      }
      setCountdown(times);
    };
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleCopyReferral = () => {
    const link = `omni.app/invite/${myId?.replace(/\s/g, "-") ?? "unknown"}`;
    navigator.clipboard.writeText(link).catch(() => {});
    toast.success("Davet linki kopyalandı!");
  };

  const inviteGoal = 5;
  const inviteProgress = Math.min(referralCount, inviteGoal);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {/* Limited Drops */}
      <div
        style={{
          background: BG_CARD,
          border: "1px solid #1a2030",
          borderRadius: 12,
          padding: 16,
        }}
      >
        <div
          style={{
            color: "#888",
            fontSize: 11,
            letterSpacing: 1,
            marginBottom: 12,
            display: "flex",
            alignItems: "center",
            gap: 4,
          }}
        >
          <Flame size={12} style={{ color: NEON_RED }} /> SINIRLI DROPLAR
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {MOCK_DROPS.length === 0 ? (
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                padding: "24px 0",
                gap: 8,
              }}
            >
              <span style={{ fontSize: 32 }}>🎁</span>
              <p style={{ color: "#19E6FF", fontSize: 13, fontWeight: 600 }}>
                Aktif drop yok
              </p>
              <p style={{ color: "#4A5568", fontSize: 11 }}>
                Yeni droplar yakında gelecek
              </p>
            </div>
          ) : (
            MOCK_DROPS.map((drop, idx) => {
              const claimed = claimedDrops.includes(drop.id);
              return (
                <div
                  key={drop.id}
                  data-ocid={`drops.item.${idx + 1}`}
                  style={{
                    background: "#0a0f1a",
                    borderRadius: 10,
                    padding: 12,
                    border: `1px solid ${claimed ? "#1a2030" : `${NEON_RED}44`}`,
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <div style={{ flex: 1 }}>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 6,
                        marginBottom: 3,
                      }}
                    >
                      <span style={{ fontSize: 16 }}>{drop.icon}</span>
                      <span
                        style={{
                          color: claimed ? "#444" : "#ccc",
                          fontSize: 12,
                          fontWeight: 600,
                        }}
                      >
                        {drop.title}
                      </span>
                    </div>
                    <div
                      style={{
                        color: claimed ? "#333" : NEON_GREEN,
                        fontSize: 13,
                        fontWeight: 700,
                      }}
                    >
                      +{drop.amount} OMNI
                    </div>
                    <div
                      style={{
                        color: "#444",
                        fontSize: 10,
                        marginTop: 2,
                        display: "flex",
                        alignItems: "center",
                        gap: 8,
                      }}
                    >
                      <span
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 2,
                        }}
                      >
                        <Flame size={9} style={{ color: NEON_RED }} />
                        {drop.claimedBy.toLocaleString()} kişi talep etti
                      </span>
                      {!claimed && (
                        <span
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 2,
                          }}
                        >
                          <Clock size={9} />
                          {countdown[drop.id] ?? "..."}
                        </span>
                      )}
                    </div>
                  </div>
                  <button
                    type="button"
                    data-ocid={`drops.primary_button.${idx + 1}`}
                    disabled={claimed}
                    onClick={() => {
                      claimDrop(drop.id, drop.amount);
                      toast.success(`+${drop.amount} OMNI cüzdana eklendi!`);
                    }}
                    style={{
                      background: claimed ? "#1a2030" : `${NEON_RED}20`,
                      border: `1px solid ${claimed ? "#222" : `${NEON_RED}66`}`,
                      borderRadius: 8,
                      padding: "7px 14px",
                      color: claimed ? "#333" : NEON_RED,
                      fontSize: 11,
                      fontWeight: 600,
                      cursor: claimed ? "default" : "pointer",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {claimed ? "✓ Alındı" : "TALEP ET"}
                  </button>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Daily Streak */}
      <div
        style={{
          background: BG_CARD,
          border: `1px solid ${dailyStreakClaimed ? "#1a2030" : `${NEON_GOLD}44`}`,
          borderRadius: 12,
          padding: 16,
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 12,
          }}
        >
          <div>
            <div
              style={{
                color: "#888",
                fontSize: 11,
                letterSpacing: 1,
                display: "flex",
                alignItems: "center",
                gap: 4,
              }}
            >
              <Flame size={12} style={{ color: NEON_GOLD }} /> GÜNLÜK STREAK
            </div>
            <div
              style={{
                color: NEON_GOLD,
                fontSize: 22,
                fontWeight: 700,
                marginTop: 4,
              }}
            >
              {dailyStreakDays} GÜN 🔥
            </div>
          </div>
          <button
            type="button"
            data-ocid="drops.streak_button"
            disabled={dailyStreakClaimed}
            onClick={() => {
              claimDailyStreak();
              toast.success("🔥 Streak bonusu: +10 OMNI!");
            }}
            style={{
              background: dailyStreakClaimed
                ? "#1a2030"
                : `linear-gradient(135deg, ${NEON_GOLD}, #ff8800)`,
              border: "none",
              borderRadius: 10,
              padding: "10px 16px",
              color: dailyStreakClaimed ? "#444" : BG_DARK,
              fontSize: 12,
              fontWeight: 700,
              cursor: dailyStreakClaimed ? "default" : "pointer",
            }}
          >
            {dailyStreakClaimed ? "✓ Alındı" : "BONUS AL +10"}
          </button>
        </div>
        <div style={{ background: "#0a0f1a", borderRadius: 8, padding: 10 }}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              marginBottom: 4,
            }}
          >
            {Array.from({ length: 7 }, (_, i) => {
              const dayKey = `streak-day-${i}`;
              return (
                <div
                  key={dayKey}
                  style={{
                    width: 28,
                    height: 28,
                    borderRadius: 6,
                    background:
                      i < dailyStreakDays % 7 ? `${NEON_GOLD}30` : "#1a2030",
                    border: `1px solid ${i < dailyStreakDays % 7 ? `${NEON_GOLD}66` : "#222"}`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 12,
                  }}
                >
                  {i < dailyStreakDays % 7 ? "🔥" : ""}
                </div>
              );
            })}
          </div>
          <div
            style={{
              color: "#555",
              fontSize: 10,
              textAlign: "center",
              marginTop: 4,
            }}
          >
            Her 7 günlük streak için bonus çarpan!
          </div>
        </div>
      </div>

      {/* Referral */}
      <div
        style={{
          background: BG_CARD,
          border: `1px solid ${NEON_GREEN}33`,
          borderRadius: 12,
          padding: 16,
        }}
      >
        <div
          style={{
            color: "#888",
            fontSize: 11,
            letterSpacing: 1,
            marginBottom: 12,
            display: "flex",
            alignItems: "center",
            gap: 4,
          }}
        >
          <Users size={12} style={{ color: NEON_GREEN }} /> ARKADAŞ DAVET
        </div>
        <div style={{ color: "#ccc", fontSize: 12, marginBottom: 8 }}>
          Her davet ={" "}
          <span style={{ color: NEON_GREEN, fontWeight: 700 }}>+50 OMNI</span>{" "}
          ikimize birden!
        </div>
        <div
          style={{
            background: "#0a0f1a",
            border: `1px solid ${NEON_GREEN}22`,
            borderRadius: 8,
            padding: "8px 12px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 12,
          }}
        >
          <span
            style={{ color: "#555", fontSize: 11, fontFamily: "monospace" }}
          >
            omni.app/invite/{myId?.replace(/\s/g, "-") ?? "..."}
          </span>
          <button
            type="button"
            data-ocid="drops.copy_button"
            onClick={handleCopyReferral}
            style={{
              background: "transparent",
              border: "none",
              cursor: "pointer",
              color: NEON_GREEN,
              padding: 0,
            }}
          >
            <Copy size={14} />
          </button>
        </div>
        <div style={{ marginBottom: 8 }}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              marginBottom: 4,
            }}
          >
            <span style={{ color: "#888", fontSize: 10 }}>
              5 arkadaş davet et →{" "}
              <span style={{ color: NEON_GOLD }}>500 OMNI bonus</span>
            </span>
            <span style={{ color: NEON_GREEN, fontSize: 10 }}>
              {inviteProgress}/{inviteGoal}
            </span>
          </div>
          <div
            style={{
              background: "#0a0f1a",
              borderRadius: 4,
              height: 6,
              overflow: "hidden",
            }}
          >
            <div
              style={{
                height: "100%",
                borderRadius: 4,
                background: `linear-gradient(90deg, ${NEON_GREEN}, ${NEON_CYAN})`,
                width: `${(inviteProgress / inviteGoal) * 100}%`,
                transition: "width 0.3s",
              }}
            />
          </div>
        </div>
        <div style={{ color: "#555", fontSize: 11 }}>
          <TrendingUp
            size={10}
            style={{ display: "inline", marginRight: 4, color: NEON_GREEN }}
          />
          {referralCount} kişi davet ettin ·{" "}
          <span style={{ color: NEON_GREEN }}>{referralCount * 50} OMNI</span>{" "}
          kazandın
        </div>
      </div>

      {/* Viral Gift */}
      <div
        style={{
          background: "linear-gradient(135deg, #0a0f1a 0%, #1a0a2e 100%)",
          border: `1px solid ${NEON_PURPLE}33`,
          borderRadius: 12,
          padding: 16,
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            marginBottom: 8,
          }}
        >
          <Gift size={16} style={{ color: NEON_PURPLE }} />
          <span style={{ color: NEON_PURPLE, fontSize: 13, fontWeight: 700 }}>
            TOKEN HEDİYESİ GÖNDER
          </span>
        </div>
        <div style={{ color: "#666", fontSize: 11, marginBottom: 12 }}>
          Arkadaşına OMNI token hediye et, topluluk güvenin artsın.
        </div>
        <button
          type="button"
          data-ocid="drops.gift_button"
          onClick={() =>
            toast.info("Token hediyesi göndermek için Sohbet bölümünü kullan")
          }
          style={{
            width: "100%",
            background: `${NEON_PURPLE}15`,
            border: `1px solid ${NEON_PURPLE}44`,
            borderRadius: 8,
            padding: "10px 0",
            color: NEON_PURPLE,
            fontSize: 12,
            fontWeight: 600,
            cursor: "pointer",
          }}
        >
          🎁 SOHBETTEN HEDİYE GÖNDER
        </button>
      </div>
    </div>
  );
}

// ============================
// Main WalletModule
// ============================
export function WalletModule() {
  const [activeTab, setActiveTab] = useState<
    "wallet" | "p2p" | "idmarket" | "drops"
  >("wallet");

  const TABS: { id: typeof activeTab; label: string; icon: string }[] = [
    { id: "wallet", label: "CÜZDAN", icon: "💎" },
    { id: "p2p", label: "P2P", icon: "🔄" },
    { id: "idmarket", label: "KİMLİK", icon: "🆔" },
    { id: "drops", label: "DROPLAR", icon: "⚡" },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      {/* Tab Bar */}
      <div
        style={{
          display: "flex",
          background: BG_CARD,
          borderBottom: "1px solid #1a2030",
          position: "sticky",
          top: 0,
          zIndex: 10,
        }}
      >
        {TABS.map((tab) => (
          <button
            type="button"
            key={tab.id}
            data-ocid={`wallet.${tab.id}_tab`}
            onClick={() => setActiveTab(tab.id)}
            style={{
              flex: 1,
              background: "transparent",
              border: "none",
              borderBottom: `2px solid ${activeTab === tab.id ? NEON_CYAN : "transparent"}`,
              padding: "10px 4px",
              color: activeTab === tab.id ? NEON_CYAN : "#555",
              fontSize: 10,
              fontWeight: 700,
              cursor: "pointer",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 2,
              letterSpacing: 0.5,
              transition: "color 0.2s, border-color 0.2s",
            }}
          >
            <span style={{ fontSize: 14 }}>{tab.icon}</span>
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div style={{ flex: 1, overflowY: "auto", padding: "16px 0 16px" }}>
        {activeTab === "wallet" && <WalletTab />}
        {activeTab === "p2p" && <P2PMarketTab />}
        {activeTab === "idmarket" && <IDMarketTab />}
        {activeTab === "drops" && <DropsTab />}
      </div>
    </div>
  );
}
