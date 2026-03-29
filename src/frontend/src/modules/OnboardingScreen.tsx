import { useICPIdentity } from "@/context/ICPIdentityContext";
import { useActor } from "@/hooks/useActor";
import { generateAnonymousID } from "@/lib/mockData";
import { useOmniStore } from "@/lib/omniStore";
import {
  CheckCircle2,
  Eye,
  Fingerprint,
  Loader2,
  MessageCircle,
  Shield,
  Zap,
} from "lucide-react";
import { useEffect, useState } from "react";

export function OnboardingScreen() {
  const { completeOnboarding } = useOmniStore();
  const { login, isLoading, isAuthenticated, principal, activeId777 } =
    useICPIdentity();
  const [step, setStep] = useState<
    "intro" | "generate" | "name" | "icp-success"
  >("intro");
  const [generatedId, setGeneratedId] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [animating, setAnimating] = useState(false);

  useEffect(() => {
    if (step === "generate") {
      setAnimating(true);
      let count = 0;
      const interval = setInterval(() => {
        setGeneratedId(generateAnonymousID());
        count++;
        if (count >= 12) {
          clearInterval(interval);
          setGeneratedId(generateAnonymousID());
          setAnimating(false);
        }
      }, 80);
      return () => clearInterval(interval);
    }
  }, [step]);

  // When ICP auth completes, show success screen
  useEffect(() => {
    if (isAuthenticated && principal && step !== "icp-success") {
      setStep("icp-success");
    }
  }, [isAuthenticated, principal, step]);

  const handleGenerate = () => setStep("generate");
  const handleLock = () => setStep("name");
  const handleFinish = () => completeOnboarding(generatedId, displayName);
  const { actor } = useActor();
  const handleICPFinish = () => {
    const id = activeId777 || generateAnonymousID();
    completeOnboarding(id, "");
    if (actor) (actor as any).registerId777(id).catch(() => {});
  };

  const truncatePrincipal = (p: string) =>
    p.length > 12 ? `${p.slice(0, 8)}...${p.slice(-4)}` : p;

  const handleIntroHover = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.currentTarget.style.background = "rgba(25,230,255,0.1)";
  };
  const handleIntroLeave = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.currentTarget.style.background = "transparent";
  };

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center px-6 py-12 relative overflow-hidden"
      style={{
        background:
          "linear-gradient(135deg, #06070B 0%, #0B1020 60%, #0F0A1A 100%)",
      }}
    >
      {/* Background glow */}
      <div
        className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full"
        style={{
          background:
            "radial-gradient(ellipse, rgba(25,230,255,0.06) 0%, transparent 70%)",
        }}
      />
      <div
        className="absolute bottom-1/3 right-1/4 w-64 h-64 rounded-full"
        style={{
          background:
            "radial-gradient(ellipse, rgba(181,107,255,0.06) 0%, transparent 70%)",
        }}
      />

      {/* Logo */}
      <div className="relative mb-8">
        <div
          className="w-24 h-24 rounded-full flex items-center justify-center"
          style={{
            background:
              "conic-gradient(from 0deg, #19E6FF, #B56BFF, #2FF5C7, #19E6FF)",
            padding: "3px",
          }}
        >
          <div
            className="w-full h-full rounded-full flex items-center justify-center"
            style={{ background: "#06070B" }}
          >
            <span
              className="text-3xl font-black"
              style={{
                color: "#19E6FF",
                textShadow: "0 0 16px rgba(25,230,255,0.8)",
              }}
            >
              O
            </span>
          </div>
        </div>
      </div>

      {step === "intro" && (
        <div className="text-center animate-fade-in max-w-sm">
          <h1
            className="text-4xl font-black tracking-widest mb-2"
            style={{ color: "#F2F4FF" }}
          >
            OMNI
          </h1>
          <p
            className="text-sm tracking-[0.3em] mb-2"
            style={{ color: "#19E6FF" }}
          >
            NEXT-GEN SUPER APP
          </p>
          <p
            className="text-sm mb-8"
            style={{ color: "#A7ACBE", lineHeight: "1.7" }}
          >
            No phone number. No email. No trace.
            <br />
            Your identity is yours alone.
          </p>

          {/* Features grid */}
          <div className="grid grid-cols-2 gap-3 mb-8">
            {[
              { icon: MessageCircle, label: "Ghost Chat", color: "#19E6FF" },
              { icon: Shield, label: "Zero-Trace", color: "#2FF5C7" },
              { icon: Eye, label: "Anonymous", color: "#B56BFF" },
              { icon: Zap, label: "AI-Powered", color: "#FF4FD8" },
            ].map(({ icon: Icon, label, color }) => (
              <div
                key={label}
                className="p-3 rounded-xl flex items-center gap-2"
                style={{
                  background: "rgba(21,26,38,0.8)",
                  border: "1px solid #2A3142",
                }}
              >
                <Icon size={16} style={{ color }} />
                <span
                  className="text-xs font-bold tracking-wider"
                  style={{ color: "#F2F4FF" }}
                >
                  {label}
                </span>
              </div>
            ))}
          </div>

          {/* Anon ID button */}
          <button
            type="button"
            onClick={handleGenerate}
            data-ocid="onboarding.primary_button"
            className="w-full py-4 rounded-full font-black tracking-widest text-sm transition-all mb-4"
            style={{
              background: "transparent",
              border: "1px solid #19E6FF",
              color: "#19E6FF",
              boxShadow: "0 0 20px rgba(25,230,255,0.3)",
              letterSpacing: "0.2em",
            }}
            onMouseEnter={handleIntroHover}
            onMouseLeave={handleIntroLeave}
          >
            GENERATE MY ID
          </button>

          {/* Divider */}
          <div className="flex items-center gap-3 mb-4">
            <div style={{ flex: 1, height: 1, background: "#1A2030" }} />
            <span style={{ color: "#4A5568", fontSize: 11 }}>VEYA</span>
            <div style={{ flex: 1, height: 1, background: "#1A2030" }} />
          </div>

          {/* ICP Internet Identity button */}
          <button
            type="button"
            onClick={login}
            disabled={isLoading}
            data-ocid="onboarding.secondary_button"
            className="w-full py-4 rounded-full font-bold text-sm transition-all flex flex-col items-center gap-1"
            style={{
              background: isLoading
                ? "rgba(181,107,255,0.05)"
                : "rgba(181,107,255,0.08)",
              border: "1px solid rgba(181,107,255,0.4)",
              color: isLoading ? "#6B7280" : "#B56BFF",
              boxShadow: isLoading ? "none" : "0 0 16px rgba(181,107,255,0.15)",
              cursor: isLoading ? "not-allowed" : "pointer",
            }}
          >
            {isLoading ? (
              <span className="flex items-center gap-2">
                <Loader2 size={16} className="animate-spin" />
                <span>Bağlanıyor...</span>
              </span>
            ) : (
              <>
                <span className="flex items-center gap-2 font-black tracking-wider">
                  <Fingerprint size={16} />🔐 Internet Identity ile Giriş Yap
                </span>
                <span
                  style={{ fontSize: 10, color: "#6B7280", fontWeight: 400 }}
                >
                  Parmak izi / Yüz tanıma / PIN ile anonim giriş
                </span>
              </>
            )}
          </button>

          {/* ICP info note */}
          <p className="text-xs mt-3" style={{ color: "#4A5568" }}>
            Internet Computer · Cihazdan bağımsız kimlik
          </p>
        </div>
      )}

      {step === "icp-success" && (
        <div className="text-center animate-fade-in max-w-sm w-full">
          <div className="flex justify-center mb-4">
            <CheckCircle2 size={48} style={{ color: "#00FF88" }} />
          </div>
          <h2
            className="text-2xl font-black tracking-wider mb-2"
            style={{ color: "#F2F4FF" }}
          >
            Kimlik Doğrulandı
          </h2>
          <p className="text-sm mb-6" style={{ color: "#A7ACBE" }}>
            Internet Computer kimliğiniz bağlandı
          </p>

          <div
            className="p-4 rounded-2xl mb-4"
            style={{
              background: "rgba(21,26,38,0.9)",
              border: "1px solid rgba(25,230,255,0.4)",
              boxShadow: "0 0 20px rgba(25,230,255,0.1)",
            }}
          >
            <div className="mb-3">
              <p className="text-xs mb-1" style={{ color: "#6B7280" }}>
                PRINCIPAL ID
              </p>
              <p
                className="font-mono text-sm font-bold"
                style={{ color: "#B56BFF" }}
              >
                {principal ? truncatePrincipal(principal) : "—"}
              </p>
            </div>
            <div
              style={{ height: 1, background: "#1A2030", margin: "12px 0" }}
            />
            <div>
              <p className="text-xs mb-1" style={{ color: "#6B7280" }}>
                OMNI KİMLİK ID
              </p>
              <p
                className="font-mono text-xl font-black"
                style={{
                  color: "#19E6FF",
                  textShadow: "0 0 10px rgba(25,230,255,0.6)",
                }}
              >
                {activeId777 ?? "..."}
              </p>
              <p className="text-xs mt-1" style={{ color: "#2FF5C7" }}>
                ✓ Blockchain&apos;e bağlı
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleICPFinish}
            disabled={isLoading}
            data-ocid="onboarding.submit_button"
            className="w-full py-4 rounded-full font-black tracking-widest text-sm btn-neon-cyan disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? "YÜKLENİYOR..." : "OMNI'YE GİR"}
          </button>
        </div>
      )}

      {step === "generate" && (
        <div className="text-center animate-fade-in max-w-sm w-full">
          <p
            className="text-xs tracking-[0.3em] mb-6"
            style={{ color: "#A7ACBE" }}
          >
            BLOCKCHAIN ID GENERATOR
          </p>
          <div
            className="p-6 rounded-2xl mb-6"
            style={{
              background: "rgba(21,26,38,0.9)",
              border: `1px solid ${animating ? "#B56BFF" : "#19E6FF"}`,
              boxShadow: animating
                ? "0 0 24px rgba(181,107,255,0.3)"
                : "0 0 24px rgba(25,230,255,0.3)",
            }}
          >
            <p className="text-xs mb-3" style={{ color: "#A7ACBE" }}>
              YOUR ANONYMOUS ID
            </p>
            <p
              className="text-2xl font-black font-mono tracking-widest"
              style={{
                color: animating ? "#B56BFF" : "#19E6FF",
                textShadow: `0 0 12px ${animating ? "rgba(181,107,255,0.8)" : "rgba(25,230,255,0.8)"}`,
              }}
            >
              {generatedId || "..."}
            </p>
            {!animating && (
              <p className="text-xs mt-2" style={{ color: "#2FF5C7" }}>
                ✓ CRYPTOGRAPHICALLY UNIQUE
              </p>
            )}
          </div>
          {!animating && (
            <>
              <p className="text-xs mb-4" style={{ color: "#A7ACBE" }}>
                This ID is yours. No one else has it.
              </p>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={handleGenerate}
                  className="flex-1 py-3 rounded-xl font-bold tracking-wider text-sm transition-all"
                  style={{
                    background: "transparent",
                    border: "1px solid #2A3142",
                    color: "#A7ACBE",
                  }}
                >
                  REGENERATE
                </button>
                <button
                  type="button"
                  onClick={handleLock}
                  className="flex-1 py-3 rounded-xl font-bold tracking-wider text-sm transition-all btn-neon-cyan"
                >
                  LOCK THIS ID
                </button>
              </div>
            </>
          )}
        </div>
      )}

      {step === "name" && (
        <div className="text-center animate-fade-in max-w-sm w-full">
          <p
            className="text-xs tracking-[0.3em] mb-2"
            style={{ color: "#A7ACBE" }}
          >
            IDENTITY SETUP
          </p>
          <h2
            className="text-2xl font-black tracking-wider mb-6"
            style={{ color: "#F2F4FF" }}
          >
            CHOOSE YOUR ALIAS
          </h2>
          <div
            className="p-3 rounded-xl mb-4 font-mono"
            style={{
              background: "rgba(21,26,38,0.8)",
              border: "1px solid #2A3142",
            }}
          >
            <span className="text-xs" style={{ color: "#A7ACBE" }}>
              ID:{" "}
            </span>
            <span className="text-sm font-bold" style={{ color: "#19E6FF" }}>
              {generatedId}
            </span>
          </div>
          <input
            type="text"
            placeholder="Enter alias (optional)"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            maxLength={20}
            data-ocid="onboarding.input"
            className="w-full px-4 py-3 rounded-xl mb-3 text-sm outline-none"
            style={{
              background: "#151A26",
              border: "1px solid #2A3142",
              color: "#F2F4FF",
              caretColor: "#19E6FF",
            }}
          />
          <p className="text-xs mb-6" style={{ color: "#A7ACBE" }}>
            Your alias is visible to people you chat with. Leave blank to stay
            fully anonymous.
          </p>
          <button
            type="button"
            onClick={handleFinish}
            data-ocid="onboarding.submit_button"
            className="w-full py-4 rounded-full font-black tracking-widest text-sm btn-neon-cyan"
          >
            ENTER OMNI
          </button>
        </div>
      )}
    </div>
  );
}
