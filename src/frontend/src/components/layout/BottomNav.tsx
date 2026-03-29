import { type Module, useOmniStore } from "@/lib/omniStore";
import {
  Bot,
  Flame,
  MessageCircle,
  ShoppingBag,
  Smartphone,
  User,
  Wallet,
} from "lucide-react";
import { useCallback } from "react";

type NavItem = {
  module: Module;
  icon: React.ComponentType<{ size: number; style?: React.CSSProperties }>;
  label: string;
  center?: boolean;
};

const LEFT_ITEMS: NavItem[] = [
  { module: "chat", icon: MessageCircle, label: "Chat" },
  { module: "social", icon: Smartphone, label: "Sosyal" },
];

const CENTER_ITEM: NavItem = {
  module: "dating",
  icon: Flame,
  label: "Dating",
  center: true,
};

const RIGHT_ITEMS: NavItem[] = [
  { module: "market", icon: ShoppingBag, label: "Market" },
  { module: "wallet", icon: Wallet, label: "Cüzdan" },
  { module: "ai", icon: Bot, label: "AI" },
  { module: "profile", icon: User, label: "Profil" },
];

export function BottomNav() {
  const { activeModule, setActiveModule, conversations } = useOmniStore();

  const totalUnread = conversations.reduce((sum, c) => sum + c.unread, 0);

  const handleNav = useCallback(
    (module: Module) => {
      setActiveModule(module);
    },
    [setActiveModule],
  );

  const renderItem = (item: NavItem) => {
    const isActive = activeModule === item.module;
    const hasChatBadge = item.module === "chat" && totalUnread > 0;
    const isDating = item.module === "dating";

    if (item.center) {
      return (
        <button
          type="button"
          key={item.module}
          data-ocid="nav.dating.link"
          onClick={() => handleNav(item.module)}
          className="relative flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl transition-all"
          style={{
            minWidth: "46px",
            background: isActive
              ? "linear-gradient(135deg, rgba(255,79,123,0.2), rgba(255,107,157,0.12))"
              : "rgba(255,79,123,0.07)",
            border: isActive
              ? "1px solid rgba(255,79,123,0.45)"
              : "1px solid rgba(255,79,123,0.18)",
            boxShadow: isActive
              ? "0 0 20px rgba(255,79,123,0.3), 0 0 8px rgba(255,107,157,0.2)"
              : "0 0 8px rgba(255,79,123,0.08)",
          }}
        >
          <item.icon
            size={22}
            style={{
              color: isActive ? "#FF4F7B" : "#C47090",
              filter: isActive
                ? "drop-shadow(0 0 8px rgba(255,79,123,0.9))"
                : "none",
              transition: "all 0.2s",
            }}
          />
          <span
            className="text-[8px] font-bold tracking-wide"
            style={{
              color: isActive ? "#FF6B9D" : "#C47090",
              transition: "color 0.2s",
            }}
          >
            {item.label}
          </span>
          {isActive && (
            <div
              className="absolute bottom-0 left-1/2 -translate-x-1/2 w-5 h-0.5 rounded-full"
              style={{
                background: "linear-gradient(90deg, #FF4F7B, #FF6B9D)",
                boxShadow: "0 0 8px #FF4F7B",
              }}
            />
          )}
        </button>
      );
    }

    return (
      <button
        type="button"
        key={item.module}
        data-ocid={`nav.${item.module}.link`}
        onClick={() => handleNav(item.module)}
        className="relative flex flex-col items-center gap-0.5 px-1 py-1.5 rounded-xl transition-all"
        style={{
          minWidth: "34px",
          background: isActive
            ? isDating
              ? "rgba(255,79,123,0.07)"
              : "rgba(25,230,255,0.07)"
            : "transparent",
          boxShadow: isActive
            ? isDating
              ? "0 0 12px rgba(255,79,123,0.1)"
              : "0 0 12px rgba(25,230,255,0.1)"
            : "none",
        }}
      >
        <div className="relative">
          <item.icon
            size={18}
            style={{
              color: isActive ? "#19E6FF" : "#4A5568",
              filter: isActive
                ? "drop-shadow(0 0 5px rgba(25,230,255,0.7))"
                : "none",
              transition: "all 0.2s",
            }}
          />
          {hasChatBadge && (
            <span
              className="absolute -top-1 -right-1.5 min-w-[14px] h-3.5 rounded-full flex items-center justify-center text-[8px] font-bold px-0.5"
              style={{ background: "#FF4F4F", color: "white" }}
            >
              {totalUnread > 9 ? "9+" : totalUnread}
            </span>
          )}
        </div>
        <span
          className="text-[8px] font-semibold tracking-wide"
          style={{
            color: isActive ? "#19E6FF" : "#4A5568",
            transition: "color 0.2s",
          }}
        >
          {item.label}
        </span>
        {isActive && (
          <div
            className="absolute bottom-0 left-1/2 -translate-x-1/2 w-4 h-0.5 rounded-full"
            style={{
              background: "linear-gradient(90deg, #19E6FF, #B56BFF)",
              boxShadow: "0 0 6px #19E6FF",
            }}
          />
        )}
      </button>
    );
  };

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50"
      style={{
        background: "rgba(6,7,11,0.96)",
        backdropFilter: "blur(24px)",
        borderTop: "1px solid rgba(255,79,123,0.12)",
        paddingBottom: "env(safe-area-inset-bottom)",
        height: "64px",
      }}
    >
      <div className="flex items-center justify-between h-full px-1">
        {LEFT_ITEMS.map(renderItem)}
        {renderItem(CENTER_ITEM)}
        {RIGHT_ITEMS.map(renderItem)}
      </div>
    </nav>
  );
}
