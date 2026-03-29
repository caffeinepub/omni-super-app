import { useOmniStore } from "@/lib/omniStore";
import { Settings, Zap } from "lucide-react";
import { useState } from "react";

export function Header() {
  const { myId, isPremium, tokenBalance } = useOmniStore();
  const [showSettings, setShowSettings] = useState(false);

  return (
    <>
      <header
        className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-4 py-3"
        style={{
          background: "rgba(6,7,11,0.92)",
          backdropFilter: "blur(16px)",
          borderBottom: "1px solid #1A2030",
        }}
      >
        {/* Logo */}
        <div className="flex items-center gap-2">
          <div className="relative w-8 h-8">
            <div
              className="absolute inset-0 rounded-full gradient-ring animate-rotate-ring"
              style={{ padding: "2px" }}
            >
              <div
                className="w-full h-full rounded-full"
                style={{ background: "#06070B" }}
              />
            </div>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-xs font-bold" style={{ color: "#19E6FF" }}>
                O
              </span>
            </div>
          </div>
          <span
            className="text-lg font-bold tracking-widest"
            style={{ color: "#F2F4FF", letterSpacing: "0.2em" }}
          >
            OMNI
          </span>
          {isPremium && (
            <span
              className="text-xs px-1.5 py-0.5 rounded-full font-bold tracking-wider"
              style={{
                background: "rgba(181,107,255,0.2)",
                color: "#B56BFF",
                border: "1px solid #B56BFF",
                fontSize: "9px",
              }}
            >
              PRO
            </span>
          )}
        </div>

        {/* Right side */}
        <div className="flex items-center gap-3">
          {/* Token balance */}
          <div
            className="flex items-center gap-1 px-2 py-1 rounded-full"
            style={{
              background: "rgba(47,245,199,0.1)",
              border: "1px solid rgba(47,245,199,0.3)",
            }}
          >
            <Zap size={11} style={{ color: "#2FF5C7" }} />
            <span className="text-xs font-bold" style={{ color: "#2FF5C7" }}>
              {tokenBalance}
            </span>
          </div>

          {/* ID badge */}
          {myId && (
            <div
              className="hidden sm:flex items-center px-2 py-1 rounded-full"
              style={{
                background: "rgba(25,230,255,0.08)",
                border: "1px solid rgba(25,230,255,0.25)",
                maxWidth: "140px",
              }}
            >
              <span
                className="text-xs font-mono truncate"
                style={{ color: "#19E6FF", fontSize: "10px" }}
              >
                {myId}
              </span>
            </div>
          )}

          {/* Settings */}
          <button
            type="button"
            onClick={() => setShowSettings(true)}
            className="p-1.5 rounded-lg transition-all"
            style={{ background: "rgba(255,255,255,0.05)" }}
          >
            <Settings size={16} style={{ color: "#A7ACBE" }} />
          </button>
        </div>
      </header>

      {/* Settings Panel */}
      {showSettings && (
        <>
          {/* Backdrop */}
          <button
            type="button"
            aria-label="Close settings"
            className="fixed inset-0 z-[100]"
            style={{
              background: "rgba(0,0,0,0.7)",
              backdropFilter: "blur(4px)",
            }}
            onClick={() => setShowSettings(false)}
          />
          {/* Panel */}
          <div className="fixed inset-0 z-[101] flex items-end justify-center sm:items-center pointer-events-none">
            <div
              className="w-full max-w-sm mx-4 rounded-2xl p-6 animate-slide-up pointer-events-auto"
              style={{ background: "#0E1320", border: "1px solid #2A3142" }}
            >
              <h3
                className="text-lg font-bold tracking-wider mb-4"
                style={{ color: "#F2F4FF" }}
              >
                SETTINGS
              </h3>
              <div className="space-y-3">
                <div
                  className="p-3 rounded-xl"
                  style={{ background: "#151A26", border: "1px solid #2A3142" }}
                >
                  <p className="text-xs" style={{ color: "#A7ACBE" }}>
                    YOUR ANONYMOUS ID
                  </p>
                  <p
                    className="font-mono font-bold mt-1"
                    style={{ color: "#19E6FF" }}
                  >
                    {myId}
                  </p>
                </div>
                <div
                  className="p-3 rounded-xl"
                  style={{ background: "#151A26", border: "1px solid #2A3142" }}
                >
                  <p className="text-xs" style={{ color: "#A7ACBE" }}>
                    STATUS
                  </p>
                  <p
                    className="font-bold mt-1"
                    style={{ color: isPremium ? "#B56BFF" : "#A7ACBE" }}
                  >
                    {isPremium ? "OMNI PREMIUM" : "FREE ACCOUNT"}
                  </p>
                </div>
                <div
                  className="p-3 rounded-xl"
                  style={{ background: "#151A26", border: "1px solid #2A3142" }}
                >
                  <p className="text-xs" style={{ color: "#A7ACBE" }}>
                    TOKEN BALANCE
                  </p>
                  <p className="font-bold mt-1" style={{ color: "#2FF5C7" }}>
                    {tokenBalance} OMNI
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowSettings(false)}
                className="w-full mt-4 py-3 rounded-xl font-bold tracking-wider text-sm btn-neon-cyan"
              >
                CLOSE
              </button>
            </div>
          </div>
        </>
      )}
    </>
  );
}
