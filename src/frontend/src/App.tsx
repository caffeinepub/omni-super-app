import { BottomNav } from "@/components/layout/BottomNav";
import { Header } from "@/components/layout/Header";
import { Toaster } from "@/components/ui/sonner";
import { ICPIdentityProvider } from "@/context/ICPIdentityContext";
import { useOmniStore } from "@/lib/omniStore";
import { AIModule } from "@/modules/AIModule";
import { ChatModule } from "@/modules/ChatModule";
import { DatingModule } from "@/modules/DatingModule";
import { EngineModule } from "@/modules/EngineModule";
import { FriendsModule } from "@/modules/FriendsModule";
import { IdentityModule } from "@/modules/IdentityModule";
import { MarketModule } from "@/modules/MarketModule";
import { OnboardingScreen } from "@/modules/OnboardingScreen";
import { ProfileModule } from "@/modules/ProfileModule";
import RideModule from "@/modules/RideModule";
import SocialModule from "@/modules/SocialModule";
import { WalletModule } from "@/modules/WalletModule";

const MODULE_TITLES: Record<string, string> = {
  chat: "MESSAGES",
  social: "SOCIAL",
  friends: "FRIENDS",
  ride: "RIDE",
  market: "MARKETPLACE",
  ai: "OMNI AI",
  wallet: "WALLET",
  engine: "RT ENGINE",
  identity: "IDENTITY HUB",
  dating: "DATING",
  profile: "PROFİL",
};

export default function App() {
  const { isOnboarded, activeModule } = useOmniStore();

  if (!isOnboarded) {
    return (
      <ICPIdentityProvider>
        <div style={{ minHeight: "100vh" }}>
          <OnboardingScreen />
          <Toaster theme="dark" />
        </div>
      </ICPIdentityProvider>
    );
  }

  return (
    <ICPIdentityProvider>
      <div
        className="flex flex-col"
        style={{
          minHeight: "100vh",
          background: "linear-gradient(135deg, #06070B 0%, #0B1020 100%)",
        }}
      >
        <Header />

        {/* Module title bar */}
        <div
          className="fixed top-[52px] left-0 right-0 z-40 px-4 py-2"
          style={{
            background: "rgba(6,7,11,0.85)",
            backdropFilter: "blur(8px)",
            borderBottom: "1px solid #0F1320",
          }}
        >
          <h1
            className="text-xs font-black tracking-[0.3em]"
            style={{ color: "#A7ACBE" }}
          >
            {MODULE_TITLES[activeModule] ?? "OMNI"}
          </h1>
        </div>

        {/* Main content */}
        <main
          className="flex-1 overflow-hidden"
          style={{ paddingTop: "84px", paddingBottom: "80px" }}
        >
          <div
            className="h-full"
            style={{ height: "calc(100vh - 84px - 80px)" }}
          >
            {activeModule === "chat" && <ChatModule />}
            {activeModule === "social" && <SocialModule />}
            {activeModule === "friends" && <FriendsModule />}
            {activeModule === "ride" && <RideModule />}
            {activeModule === "market" && <MarketModule />}
            {activeModule === "ai" && <AIModule />}
            {activeModule === "wallet" && <WalletModule />}
            {activeModule === "engine" && <EngineModule />}
            {activeModule === "identity" && <IdentityModule />}
            {activeModule === "dating" && <DatingModule />}
            {activeModule === "profile" && <ProfileModule />}
          </div>
        </main>

        <BottomNav />
        <Toaster theme="dark" />
      </div>
    </ICPIdentityProvider>
  );
}
