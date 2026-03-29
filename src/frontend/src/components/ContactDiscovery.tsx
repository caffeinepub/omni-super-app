import { useOmniStore } from "@/lib/omniStore";
import jsQR from "jsqr";
import QRCode from "qrcode";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";

type SubTab = "rehber" | "link" | "qr";
type QRMode = "generate" | "scan";

interface MockContact {
  name: string;
  tel: string;
}

interface DiscoveredContact {
  name: string;
  tel: string;
  hash: string;
  found: boolean;
  omniId?: string;
  avatar: string;
}

const MOCK_CONTACTS: MockContact[] = [
  { name: "Ahmet Yılmaz", tel: "+90 532 111 2233" },
  { name: "Fatma Kaya", tel: "+90 545 223 4455" },
  { name: "Mehmet Demir", tel: "+90 501 334 5566" },
  { name: "Ayşe Şahin", tel: "+90 533 445 6677" },
  { name: "Mustafa Çelik", tel: "+90 546 556 7788" },
  { name: "Zeynep Arslan", tel: "+90 552 667 8899" },
  { name: "Emre Koç", tel: "+90 505 778 9900" },
  { name: "Elif Aydın", tel: "+90 538 889 0011" },
];

const AVATARS = ["🦊", "🐺", "🦁", "🐯", "🐻", "🦝", "🐼", "🦄"];

async function hashPhone(phone: string): Promise<string> {
  const normalized = phone.replace(/\s/g, "");
  const encoded = new TextEncoder().encode(normalized);
  const hashBuffer = await crypto.subtle.digest("SHA-256", encoded);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

function generateFakeId(seed: string): string {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = (hash * 31 + seed.charCodeAt(i)) & 0xffffffff;
  }
  const a = Math.abs(hash % 10000)
    .toString()
    .padStart(4, "0");
  const b = Math.abs((hash >> 8) % 10000)
    .toString()
    .padStart(4, "0");
  return `+777 ${a} ${b}`;
}

// ─── Rehber Sub-Tab ───────────────────────────────────────────────────────────
function RehberTab() {
  const { addFriendById } = useOmniStore();
  const [contacts, setContacts] = useState<DiscoveredContact[]>([]);
  const [scanning, setScanning] = useState(false);
  const [done, setDone] = useState(false);
  const [addedIds, setAddedIds] = useState<Set<string>>(new Set());

  const handleScan = useCallback(async () => {
    setScanning(true);
    setDone(false);

    let rawContacts: MockContact[] = MOCK_CONTACTS;

    if ("contacts" in navigator) {
      try {
        const result = await (navigator as any).contacts.select([
          "name",
          "tel",
        ]);
        rawContacts = result
          .filter((c: any) => c.tel?.length)
          .map((c: any) => ({
            name: c.name?.[0] || "Bilinmiyor",
            tel: c.tel[0],
          }));
        if (!rawContacts.length) rawContacts = MOCK_CONTACTS;
      } catch {
        rawContacts = MOCK_CONTACTS;
      }
    }

    // Compute hashes
    const withHashes: DiscoveredContact[] = await Promise.all(
      rawContacts.map(async (c, i) => ({
        ...c,
        hash: await hashPhone(c.tel),
        found: false,
        avatar: AVATARS[i % AVATARS.length],
      })),
    );

    // Simulate server match: random 3-4
    const matchCount = 3 + Math.floor(Math.random() * 2);
    const indices = new Set<number>();
    while (indices.size < Math.min(matchCount, withHashes.length)) {
      indices.add(Math.floor(Math.random() * withHashes.length));
    }

    const result = withHashes.map((c, i) => ({
      ...c,
      found: indices.has(i),
      omniId: indices.has(i) ? generateFakeId(c.hash) : undefined,
    }));

    await new Promise((r) => setTimeout(r, 1800));
    setContacts(result);
    setScanning(false);
    setDone(true);
  }, []);

  const handleAdd = useCallback(
    (id: string) => {
      const res = addFriendById(id);
      if (res === "added") {
        toast.success("Arkadaş eklendi!");
        setAddedIds((prev) => new Set(prev).add(id));
      } else if (res === "already_friend") {
        toast.info("Zaten arkadaşsınız");
      } else {
        toast.error("Eklenemedi");
      }
    },
    [addFriendById],
  );

  const matched = contacts.filter((c) => c.found);
  const unmatched = contacts.filter((c) => !c.found);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {/* Scan button */}
      {!done && (
        <button
          type="button"
          data-ocid="friends.rehber.scan_button"
          onClick={handleScan}
          disabled={scanning}
          style={{
            background: scanning
              ? "rgba(25,230,255,0.08)"
              : "linear-gradient(135deg, #19E6FF22, #B56BFF22)",
            border: "1px solid rgba(25,230,255,0.4)",
            borderRadius: 14,
            color: "#19E6FF",
            padding: "14px 0",
            fontSize: 15,
            fontWeight: 600,
            cursor: scanning ? "not-allowed" : "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 8,
          }}
        >
          {scanning ? (
            <>
              <span
                style={{
                  display: "inline-block",
                  width: 18,
                  height: 18,
                  border: "2px solid rgba(25,230,255,0.3)",
                  borderTopColor: "#19E6FF",
                  borderRadius: "50%",
                  animation: "spin 0.8s linear infinite",
                }}
              />
              Rehber taranıyor...
            </>
          ) : (
            "📱 Rehbere Eriş"
          )}
        </button>
      )}

      {done && (
        <>
          {/* Matched section */}
          {matched.length > 0 && (
            <div>
              <p
                style={{
                  color: "#19E6FF",
                  fontSize: 11,
                  fontWeight: 700,
                  letterSpacing: "0.1em",
                  marginBottom: 8,
                  textTransform: "uppercase",
                }}
              >
                ✅ OMNI'DE BULUNANLAR ({matched.length})
              </p>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {matched.map((c, i) => (
                  <div
                    key={c.hash || i}
                    data-ocid={`friends.rehber.matched.item.${i + 1}`}
                    style={{
                      background: "rgba(25,230,255,0.05)",
                      border: "1px solid rgba(25,230,255,0.15)",
                      borderRadius: 12,
                      padding: "10px 14px",
                      display: "flex",
                      alignItems: "center",
                      gap: 12,
                    }}
                  >
                    <span style={{ fontSize: 28 }}>{c.avatar}</span>
                    <div style={{ flex: 1 }}>
                      <p
                        style={{
                          color: "#E8EAF2",
                          fontWeight: 600,
                          fontSize: 14,
                          margin: 0,
                        }}
                      >
                        {c.name}
                      </p>
                      <p
                        style={{
                          color: "#19E6FF",
                          fontSize: 12,
                          margin: 0,
                          fontFamily: "monospace",
                        }}
                      >
                        {c.omniId}
                      </p>
                    </div>
                    {c.omniId && (
                      <button
                        type="button"
                        data-ocid={`friends.rehber.add_button.${i + 1}`}
                        onClick={() => handleAdd(c.omniId!)}
                        disabled={addedIds.has(c.omniId!)}
                        style={{
                          background: addedIds.has(c.omniId!)
                            ? "rgba(25,230,255,0.05)"
                            : "rgba(25,230,255,0.15)",
                          border: "1px solid rgba(25,230,255,0.3)",
                          borderRadius: 8,
                          color: addedIds.has(c.omniId!)
                            ? "#A7ACBE"
                            : "#19E6FF",
                          padding: "5px 12px",
                          fontSize: 13,
                          cursor: addedIds.has(c.omniId!)
                            ? "default"
                            : "pointer",
                          fontWeight: 600,
                        }}
                      >
                        {addedIds.has(c.omniId!) ? "✓ Eklendi" : "Ekle"}
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Unmatched section */}
          {unmatched.length > 0 && (
            <div>
              <p
                style={{
                  color: "#A7ACBE",
                  fontSize: 11,
                  fontWeight: 700,
                  letterSpacing: "0.1em",
                  marginBottom: 8,
                  textTransform: "uppercase",
                }}
              >
                📨 HENÜZ KATILMAMIŞ ({unmatched.length})
              </p>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {unmatched.map((c, i) => (
                  <div
                    key={c.hash || i}
                    data-ocid={`friends.rehber.unmatched.item.${i + 1}`}
                    style={{
                      background: "rgba(181,107,255,0.04)",
                      border: "1px solid rgba(181,107,255,0.1)",
                      borderRadius: 12,
                      padding: "10px 14px",
                      display: "flex",
                      alignItems: "center",
                      gap: 12,
                    }}
                  >
                    <span style={{ fontSize: 28 }}>{c.avatar}</span>
                    <div style={{ flex: 1 }}>
                      <p
                        style={{
                          color: "#A7ACBE",
                          fontWeight: 600,
                          fontSize: 14,
                          margin: 0,
                        }}
                      >
                        {c.name}
                      </p>
                      <p style={{ color: "#6B7099", fontSize: 12, margin: 0 }}>
                        {c.tel}
                      </p>
                    </div>
                    <button
                      type="button"
                      data-ocid={`friends.rehber.invite_button.${i + 1}`}
                      onClick={() => toast.success("Davet gönderildi 📨")}
                      style={{
                        background: "rgba(181,107,255,0.1)",
                        border: "1px solid rgba(181,107,255,0.25)",
                        borderRadius: 8,
                        color: "#B56BFF",
                        padding: "5px 12px",
                        fontSize: 13,
                        cursor: "pointer",
                        fontWeight: 600,
                      }}
                    >
                      Davet Et
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          <button
            type="button"
            onClick={() => {
              setDone(false);
              setContacts([]);
            }}
            style={{
              background: "transparent",
              border: "1px solid rgba(167,172,190,0.2)",
              borderRadius: 10,
              color: "#A7ACBE",
              padding: "10px 0",
              fontSize: 13,
              cursor: "pointer",
            }}
          >
            🔄 Tekrar Tara
          </button>
        </>
      )}
    </div>
  );
}

// ─── Link Sub-Tab ─────────────────────────────────────────────────────────────
function LinkTab() {
  const { myId } = useOmniStore();
  const shareUrl = `https://omni.app/add/${myId?.replace(/\s/g, "") || "+7770000000"}`;

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      toast.success("Link kopyalandı! 📋");
    } catch {
      toast.error("Kopyalanamadı");
    }
  }, [shareUrl]);

  const handleShare = useCallback(async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: "OMNI'de beni bul",
          text: `OMNI'ye katıl ve beni ekle: ${myId}`,
          url: shareUrl,
        });
      } catch {
        /* dismissed */
      }
    } else {
      await navigator.clipboard.writeText(shareUrl);
      toast.success("Link kopyalandı! 📋");
    }
  }, [shareUrl, myId]);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {/* ID Badge */}
      <div style={{ textAlign: "center" }}>
        <div
          style={{
            display: "inline-block",
            background:
              "linear-gradient(135deg, rgba(25,230,255,0.12), rgba(181,107,255,0.12))",
            border: "1px solid rgba(25,230,255,0.3)",
            borderRadius: 12,
            padding: "8px 20px",
          }}
        >
          <span
            style={{
              color: "#19E6FF",
              fontFamily: "monospace",
              fontSize: 18,
              fontWeight: 700,
              letterSpacing: "0.05em",
            }}
          >
            {myId ?? "+777 ???? ????"}
          </span>
        </div>
      </div>

      {/* Description */}
      <p
        style={{
          color: "#A7ACBE",
          fontSize: 13,
          textAlign: "center",
          margin: 0,
          lineHeight: 1.6,
        }}
      >
        Bu linki arkadaşlarına gönder, tıkladıklarında seni otomatik eklesinler
      </p>

      {/* Link display box */}
      <div
        style={{
          background: "rgba(13,17,23,0.8)",
          border: "1px solid rgba(25,230,255,0.2)",
          borderRadius: 12,
          padding: "12px 16px",
          wordBreak: "break-all",
        }}
      >
        <p
          style={{
            color: "#19E6FF",
            fontSize: 13,
            margin: 0,
            fontFamily: "monospace",
          }}
        >
          {shareUrl}
        </p>
      </div>

      {/* Action buttons */}
      <div style={{ display: "flex", gap: 10 }}>
        <button
          type="button"
          data-ocid="friends.link.copy_button"
          onClick={handleCopy}
          style={{
            flex: 1,
            background: "rgba(25,230,255,0.12)",
            border: "1px solid rgba(25,230,255,0.3)",
            borderRadius: 12,
            color: "#19E6FF",
            padding: "12px 0",
            fontSize: 14,
            fontWeight: 600,
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 6,
          }}
        >
          📋 Kopyala
        </button>
        <button
          type="button"
          data-ocid="friends.link.share_button"
          onClick={handleShare}
          style={{
            flex: 1,
            background: "rgba(181,107,255,0.12)",
            border: "1px solid rgba(181,107,255,0.3)",
            borderRadius: 12,
            color: "#B56BFF",
            padding: "12px 0",
            fontSize: 14,
            fontWeight: 600,
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 6,
          }}
        >
          🔗 Paylaş
        </button>
      </div>
    </div>
  );
}

// ─── QR Sub-Tab ───────────────────────────────────────────────────────────────
function QRTab() {
  const { myId, addFriendById } = useOmniStore();
  const [qrMode, setQRMode] = useState<QRMode>("generate");
  const [qrDataUrl, setQRDataUrl] = useState<string>("");
  const [scanning, setScanning] = useState(false);
  const [cameraError, setCameraError] = useState("");
  const [scannedId, setScannedId] = useState<string | null>(null);
  const [added, setAdded] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const rafRef = useRef<number>(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (myId) {
      QRCode.toDataURL(myId, {
        width: 240,
        margin: 2,
        color: { dark: "#000000", light: "#FFFFFF" },
      })
        .then(setQRDataUrl)
        .catch(() => {});
    }
  }, [myId]);

  const stopCamera = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    for (const t of streamRef.current?.getTracks() ?? []) {
      t.stop();
    }
    streamRef.current = null;
    setScanning(false);
  }, []);

  useEffect(() => () => stopCamera(), [stopCamera]);

  const handleStartCamera = useCallback(async () => {
    setCameraError("");
    setScannedId(null);
    setAdded(false);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setScanning(true);

      intervalRef.current = setInterval(() => {
        if (!videoRef.current || !canvasRef.current) return;
        const video = videoRef.current;
        if (video.readyState !== video.HAVE_ENOUGH_DATA) return;
        const canvas = canvasRef.current;
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const code = jsQR(imageData.data, imageData.width, imageData.height);
        if (code?.data?.startsWith("+777")) {
          stopCamera();
          setScannedId(code.data);
        }
      }, 200);
    } catch (err: any) {
      setCameraError(
        err?.name === "NotAllowedError"
          ? "Kamera izni reddedildi. Lütfen tarayıcı ayarlarından izin ver."
          : `Kamera açılamadı: ${err?.message || "Bilinmeyen hata"}`,
      );
    }
  }, [stopCamera]);

  const handleConfirmAdd = useCallback(() => {
    if (!scannedId) return;
    const res = addFriendById(scannedId);
    if (res === "added") {
      toast.success("Arkadaş eklendi! 🎉");
      setAdded(true);
    } else if (res === "already_friend") {
      toast.info("Zaten arkadaşsınız");
    } else {
      toast.error("Kendinizi ekleyemezsiniz");
    }
    setScannedId(null);
  }, [scannedId, addFriendById]);

  const handleDownload = useCallback(() => {
    if (!qrDataUrl) return;
    const a = document.createElement("a");
    a.href = qrDataUrl;
    a.download = `omni-qr-${myId?.replace(/\s/g, "") || "id"}.png`;
    a.click();
  }, [qrDataUrl, myId]);

  const handleCopyId = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(myId || "");
      toast.success("ID kopyalandı! 📋");
    } catch {
      toast.error("Kopyalanamadı");
    }
  }, [myId]);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {/* QR mode toggle */}
      <div
        style={{
          display: "flex",
          background: "rgba(13,17,23,0.6)",
          border: "1px solid rgba(25,230,255,0.1)",
          borderRadius: 12,
          padding: 4,
          gap: 4,
        }}
      >
        {(["generate", "scan"] as QRMode[]).map((m) => (
          <button
            type="button"
            key={m}
            data-ocid={`friends.qr.${m}_tab`}
            onClick={() => {
              setQRMode(m);
              if (scanning) stopCamera();
            }}
            style={{
              flex: 1,
              background:
                qrMode === m ? "rgba(25,230,255,0.15)" : "transparent",
              border:
                qrMode === m
                  ? "1px solid rgba(25,230,255,0.3)"
                  : "1px solid transparent",
              borderRadius: 9,
              color: qrMode === m ? "#19E6FF" : "#A7ACBE",
              padding: "8px 0",
              fontSize: 13,
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            {m === "generate" ? "📱 QR Oluştur" : "📷 QR Tara"}
          </button>
        ))}
      </div>

      {qrMode === "generate" && (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 12,
          }}
        >
          {qrDataUrl ? (
            <div
              style={{
                background: "#FFFFFF",
                borderRadius: 16,
                padding: 12,
                display: "inline-block",
                boxShadow: "0 0 30px rgba(25,230,255,0.2)",
              }}
            >
              <img
                src={qrDataUrl}
                alt="QR Code"
                style={{ width: 200, height: 200, display: "block" }}
              />
            </div>
          ) : (
            <div
              style={{
                width: 224,
                height: 224,
                background: "rgba(25,230,255,0.05)",
                borderRadius: 16,
                border: "1px solid rgba(25,230,255,0.1)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#A7ACBE",
              }}
            >
              Yükleniyor...
            </div>
          )}
          <p
            style={{
              color: "#A7ACBE",
              fontSize: 12,
              margin: 0,
              fontFamily: "monospace",
              textAlign: "center",
            }}
          >
            {myId}
          </p>
          <div style={{ display: "flex", gap: 10, width: "100%" }}>
            <button
              type="button"
              data-ocid="friends.qr.download_button"
              onClick={handleDownload}
              style={{
                flex: 1,
                background: "rgba(25,230,255,0.12)",
                border: "1px solid rgba(25,230,255,0.3)",
                borderRadius: 12,
                color: "#19E6FF",
                padding: "11px 0",
                fontSize: 13,
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              📥 İndir
            </button>
            <button
              type="button"
              data-ocid="friends.qr.copy_id_button"
              onClick={handleCopyId}
              style={{
                flex: 1,
                background: "rgba(181,107,255,0.12)",
                border: "1px solid rgba(181,107,255,0.3)",
                borderRadius: 12,
                color: "#B56BFF",
                padding: "11px 0",
                fontSize: 13,
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              📋 ID'yi Kopyala
            </button>
          </div>
        </div>
      )}

      {qrMode === "scan" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {!scanning && !scannedId && (
            <button
              type="button"
              data-ocid="friends.qr.open_camera_button"
              onClick={handleStartCamera}
              style={{
                background:
                  "linear-gradient(135deg, rgba(25,230,255,0.15), rgba(181,107,255,0.15))",
                border: "1px solid rgba(25,230,255,0.3)",
                borderRadius: 14,
                color: "#19E6FF",
                padding: "14px 0",
                fontSize: 15,
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              📷 Kamerayı Aç
            </button>
          )}

          {cameraError && (
            <div
              data-ocid="friends.qr.camera_error_state"
              style={{
                background: "rgba(255,80,80,0.08)",
                border: "1px solid rgba(255,80,80,0.2)",
                borderRadius: 12,
                padding: "12px 16px",
                color: "#FF8080",
                fontSize: 13,
                textAlign: "center",
              }}
            >
              ⚠️ {cameraError}
            </div>
          )}

          {scanning && (
            <div style={{ position: "relative" }}>
              <video
                ref={videoRef}
                style={{
                  width: "100%",
                  borderRadius: 14,
                  border: "1px solid rgba(25,230,255,0.2)",
                  display: "block",
                  background: "#000",
                  maxHeight: 260,
                  objectFit: "cover",
                }}
                playsInline
                muted
              />
              <canvas ref={canvasRef} style={{ display: "none" }} />
              <div
                style={{
                  position: "absolute",
                  top: "50%",
                  left: "50%",
                  transform: "translate(-50%, -50%)",
                  width: 160,
                  height: 160,
                  border: "2px solid rgba(25,230,255,0.6)",
                  borderRadius: 8,
                  boxShadow: "0 0 0 9999px rgba(0,0,0,0.4)",
                }}
              />
              <div
                style={{
                  textAlign: "center",
                  marginTop: 10,
                  color: "#A7ACBE",
                  fontSize: 13,
                }}
              >
                QR kod taranıyor...
              </div>
              <button
                type="button"
                data-ocid="friends.qr.stop_camera_button"
                onClick={stopCamera}
                style={{
                  marginTop: 8,
                  width: "100%",
                  background: "rgba(255,80,80,0.1)",
                  border: "1px solid rgba(255,80,80,0.2)",
                  borderRadius: 10,
                  color: "#FF8080",
                  padding: "10px 0",
                  fontSize: 13,
                  cursor: "pointer",
                }}
              >
                ✕ Kapat
              </button>
            </div>
          )}

          {/* Scanned confirmation */}
          {scannedId && !added && (
            <div
              data-ocid="friends.qr.scanned_dialog"
              style={{
                background: "rgba(25,230,255,0.06)",
                border: "1px solid rgba(25,230,255,0.25)",
                borderRadius: 14,
                padding: "16px",
                display: "flex",
                flexDirection: "column",
                gap: 12,
                alignItems: "center",
              }}
            >
              <p
                style={{
                  color: "#E8EAF2",
                  fontWeight: 600,
                  margin: 0,
                  fontSize: 14,
                }}
              >
                QR Kod Okundu ✅
              </p>
              <p
                style={{
                  color: "#19E6FF",
                  fontFamily: "monospace",
                  fontSize: 16,
                  margin: 0,
                }}
              >
                {scannedId}
              </p>
              <div style={{ display: "flex", gap: 10, width: "100%" }}>
                <button
                  type="button"
                  data-ocid="friends.qr.confirm_add_button"
                  onClick={handleConfirmAdd}
                  style={{
                    flex: 1,
                    background: "rgba(25,230,255,0.15)",
                    border: "1px solid rgba(25,230,255,0.35)",
                    borderRadius: 10,
                    color: "#19E6FF",
                    padding: "11px 0",
                    fontSize: 14,
                    fontWeight: 600,
                    cursor: "pointer",
                  }}
                >
                  Ekle
                </button>
                <button
                  type="button"
                  data-ocid="friends.qr.cancel_button"
                  onClick={() => setScannedId(null)}
                  style={{
                    flex: 1,
                    background: "transparent",
                    border: "1px solid rgba(167,172,190,0.2)",
                    borderRadius: 10,
                    color: "#A7ACBE",
                    padding: "11px 0",
                    fontSize: 14,
                    cursor: "pointer",
                  }}
                >
                  İptal
                </button>
              </div>
            </div>
          )}

          {added && (
            <div
              data-ocid="friends.qr.success_state"
              style={{
                background: "rgba(25,230,255,0.06)",
                border: "1px solid rgba(25,230,255,0.2)",
                borderRadius: 12,
                padding: "14px",
                textAlign: "center",
                color: "#19E6FF",
                fontSize: 14,
                fontWeight: 600,
              }}
            >
              🎉 Arkadaş eklendi!
              <br />
              <button
                type="button"
                onClick={() => {
                  setAdded(false);
                  setScannedId(null);
                }}
                style={{
                  marginTop: 8,
                  background: "transparent",
                  border: "none",
                  color: "#A7ACBE",
                  fontSize: 12,
                  cursor: "pointer",
                  textDecoration: "underline",
                }}
              >
                Tekrar Tara
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Main ContactDiscovery Component ─────────────────────────────────────────
export function ContactDiscovery() {
  const [subTab, setSubTab] = useState<SubTab>("rehber");

  const SUB_TABS: { key: SubTab; label: string }[] = [
    { key: "rehber", label: "📱 Rehber" },
    { key: "link", label: "🔗 Link" },
    { key: "qr", label: "⬛ QR Kod" },
  ];

  return (
    <div
      style={{
        background: "#161B27",
        border: "1px solid rgba(25,230,255,0.1)",
        borderRadius: 16,
        padding: 16,
        display: "flex",
        flexDirection: "column",
        gap: 16,
      }}
    >
      {/* Sub-tab pills */}
      <div
        style={{
          display: "flex",
          gap: 6,
          background: "rgba(13,17,23,0.6)",
          border: "1px solid rgba(25,230,255,0.08)",
          borderRadius: 12,
          padding: 4,
        }}
      >
        {SUB_TABS.map(({ key, label }) => (
          <button
            type="button"
            key={key}
            data-ocid={`friends.rehber.${key}_tab`}
            onClick={() => setSubTab(key)}
            style={{
              flex: 1,
              background:
                subTab === key ? "rgba(25,230,255,0.12)" : "transparent",
              border:
                subTab === key
                  ? "1px solid rgba(25,230,255,0.25)"
                  : "1px solid transparent",
              borderRadius: 9,
              color: subTab === key ? "#19E6FF" : "#A7ACBE",
              padding: "7px 0",
              fontSize: 12,
              fontWeight: 600,
              cursor: "pointer",
              whiteSpace: "nowrap",
            }}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Sub-tab content */}
      {subTab === "rehber" && <RehberTab />}
      {subTab === "link" && <LinkTab />}
      {subTab === "qr" && <QRTab />}
    </div>
  );
}
