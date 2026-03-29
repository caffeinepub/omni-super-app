import type { MarketListing } from "@/lib/mockData";
import { useOmniStore } from "@/lib/omniStore";
import { Heart, Plus, Shield, ShoppingCart } from "lucide-react";
import { useState } from "react";

const RARITY_STYLES: Record<
  string,
  { color: string; bg: string; label: string }
> = {
  legendary: {
    color: "#FFD700",
    bg: "rgba(255,215,0,0.1)",
    label: "LEGENDARY ⭐",
  },
  rare: { color: "#B56BFF", bg: "rgba(181,107,255,0.1)", label: "RARE 💎" },
  common: { color: "#A7ACBE", bg: "rgba(167,172,190,0.08)", label: "COMMON" },
};

function TrustBadge({ score }: { score: number }) {
  const color = score >= 85 ? "#2FF5C7" : score >= 65 ? "#FFB347" : "#FF4F4F";
  return (
    <div className="flex items-center gap-1">
      <Shield size={10} style={{ color }} />
      <span className="text-[10px] font-bold" style={{ color }}>
        {score}
      </span>
    </div>
  );
}

export function MarketModule() {
  const {
    listings,
    purchaseListing,
    createListing,
    myId,
    tokenBalance,
    setActiveModule,
    createConversation,
    setActiveConversation,
  } = useOmniStore();
  const [activeTab, setActiveTab] = useState<"ids" | "products" | "mine">(
    "ids",
  );
  const [selectedItem, setSelectedItem] = useState<MarketListing | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [newPrice, setNewPrice] = useState("");
  const [newCategory, setNewCategory] = useState("Digital Product");
  const [filterRarity, setFilterRarity] = useState<string>("all");

  const filteredListings = listings
    .filter((l) => {
      if (l.status !== "active") return false;
      if (activeTab === "ids") return l.type === "id_sale" || l.type === "nft";
      if (activeTab === "products")
        return l.type === "product" || l.type === "service";
      if (activeTab === "mine") return l.sellerId === myId;
      return false;
    })
    .filter((l) => filterRarity === "all" || l.rarity === filterRarity);

  const handleBuy = () => {
    if (!selectedItem) return;
    purchaseListing(selectedItem.id);
    setSelectedItem(null);
  };

  const handleCreate = () => {
    if (!newTitle || !newPrice) return;
    createListing({
      sellerId: myId ?? "+777 0000 000",
      type:
        newCategory === "ID Sale"
          ? "id_sale"
          : newCategory === "NFT"
            ? "nft"
            : newCategory === "Service"
              ? "service"
              : "product",
      title: newTitle,
      description: newDesc,
      price: Number.parseInt(newPrice) || 0,
      category: newCategory,
      trustScore: 70,
    });
    setShowCreate(false);
    setNewTitle("");
    setNewDesc("");
    setNewPrice("");
  };

  return (
    <div className="flex flex-col h-full animate-fade-in">
      {/* Tabs */}
      <div
        className="flex items-center gap-1 px-4 py-3 flex-shrink-0"
        style={{ borderBottom: "1px solid #1A2030" }}
      >
        {(["ids", "products", "mine"] as const).map((tab) => (
          <button
            type="button"
            key={tab}
            onClick={() => setActiveTab(tab)}
            className="flex-1 py-2 rounded-lg text-xs font-bold tracking-wider uppercase transition-all"
            style={{
              background:
                activeTab === tab ? "rgba(25,230,255,0.1)" : "transparent",
              color: activeTab === tab ? "#19E6FF" : "#4A5568",
              border: `1px solid ${activeTab === tab ? "rgba(25,230,255,0.3)" : "transparent"}`,
            }}
          >
            {tab === "ids"
              ? "IDs & NFTs"
              : tab === "products"
                ? "Products"
                : "My Listings"}
          </button>
        ))}
        <button
          type="button"
          onClick={() => setShowCreate(true)}
          className="ml-1 p-2 rounded-lg"
          style={{
            background: "rgba(25,230,255,0.1)",
            border: "1px solid rgba(25,230,255,0.3)",
          }}
        >
          <Plus size={14} style={{ color: "#19E6FF" }} />
        </button>
      </div>

      {/* Filter */}
      {activeTab === "ids" && (
        <div
          className="flex gap-2 px-4 py-2"
          style={{ borderBottom: "1px solid #1A2030" }}
        >
          {["all", "legendary", "rare", "common"].map((r) => (
            <button
              type="button"
              key={r}
              onClick={() => setFilterRarity(r)}
              className="px-3 py-1 rounded-full text-[10px] font-bold uppercase transition-all"
              style={{
                background:
                  filterRarity === r ? "rgba(25,230,255,0.15)" : "#151A26",
                color: filterRarity === r ? "#19E6FF" : "#4A5568",
                border: `1px solid ${filterRarity === r ? "rgba(25,230,255,0.4)" : "#2A3142"}`,
              }}
            >
              {r}
            </button>
          ))}
        </div>
      )}

      <div className="flex-1 overflow-y-auto scrollbar-hide px-4 py-4">
        {filteredListings.length === 0 && (
          <div className="flex flex-col items-center justify-center h-40">
            <p className="text-sm" style={{ color: "#4A5568" }}>
              No listings found
            </p>
            <button
              type="button"
              onClick={() => setShowCreate(true)}
              className="mt-3 text-xs btn-neon-cyan px-4 py-2 rounded-full"
            >
              Create Listing
            </button>
          </div>
        )}
        <div className="grid grid-cols-1 gap-3">
          {filteredListings.map((item) => (
            <button
              type="button"
              key={item.id}
              className="p-4 rounded-2xl text-left cursor-pointer transition-all w-full"
              style={{
                background: "#151A26",
                border: `1px solid ${item.rarity === "legendary" ? "rgba(255,215,0,0.3)" : item.rarity === "rare" ? "rgba(181,107,255,0.3)" : "#2A3142"}`,
              }}
              onClick={() => setSelectedItem(item)}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    {item.rarity && (
                      <span
                        className="text-[9px] px-1.5 py-0.5 rounded-full font-bold"
                        style={{
                          background: RARITY_STYLES[item.rarity]?.bg,
                          color: RARITY_STYLES[item.rarity]?.color,
                        }}
                      >
                        {RARITY_STYLES[item.rarity]?.label}
                      </span>
                    )}
                    <span
                      className="text-[9px] px-1.5 py-0.5 rounded-full"
                      style={{
                        background: "rgba(167,172,190,0.08)",
                        color: "#A7ACBE",
                      }}
                    >
                      {item.category}
                    </span>
                  </div>
                  <p
                    className="font-black text-base tracking-wide"
                    style={{
                      color: item.type === "id_sale" ? "#19E6FF" : "#F2F4FF",
                      fontFamily: "monospace",
                    }}
                  >
                    {item.title}
                  </p>
                  <p
                    className="text-xs mt-1 line-clamp-2"
                    style={{ color: "#A7ACBE" }}
                  >
                    {item.description}
                  </p>
                </div>
              </div>
              <div className="flex items-center justify-between mt-3">
                <div className="flex items-center gap-3">
                  <p className="font-mono text-xs" style={{ color: "#4A5568" }}>
                    {item.sellerId}
                  </p>
                  <TrustBadge score={item.trustScore} />
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1">
                    <Heart size={10} style={{ color: "#FF4FD8" }} />
                    <span className="text-[10px]" style={{ color: "#FF4FD8" }}>
                      {item.likes}
                    </span>
                  </div>
                  <span
                    className="font-black text-sm"
                    style={{ color: "#2FF5C7" }}
                  >
                    {item.price} <span className="text-[10px]">OMNI</span>
                  </span>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Buy Modal */}
      {selectedItem && (
        <>
          <button
            type="button"
            aria-label="Close buy modal"
            className="fixed inset-0 z-[60]"
            style={{ background: "rgba(0,0,0,0.8)" }}
            onClick={() => setSelectedItem(null)}
          />
          <div className="fixed inset-0 z-[61] flex items-end justify-center pointer-events-none">
            <div
              className="w-full max-w-sm mx-4 mb-24 rounded-2xl p-6 animate-slide-up pointer-events-auto"
              style={{ background: "#0E1320", border: "1px solid #2A3142" }}
            >
              <h3
                className="font-bold tracking-wider mb-1"
                style={{ color: "#F2F4FF" }}
              >
                {selectedItem.title}
              </h3>
              <p className="text-sm mb-4" style={{ color: "#A7ACBE" }}>
                {selectedItem.description}
              </p>
              <div
                className="p-3 rounded-xl mb-4"
                style={{ background: "#151A26", border: "1px solid #2A3142" }}
              >
                <div className="flex justify-between">
                  <span className="text-sm" style={{ color: "#A7ACBE" }}>
                    Price
                  </span>
                  <span className="font-black" style={{ color: "#2FF5C7" }}>
                    {selectedItem.price} OMNI
                  </span>
                </div>
                <div className="flex justify-between mt-1">
                  <span className="text-sm" style={{ color: "#A7ACBE" }}>
                    Your balance
                  </span>
                  <span
                    className="font-bold"
                    style={{
                      color:
                        tokenBalance >= selectedItem.price
                          ? "#F2F4FF"
                          : "#FF4F4F",
                    }}
                  >
                    {tokenBalance} OMNI
                  </span>
                </div>
              </div>
              {tokenBalance < selectedItem.price ? (
                <p
                  className="text-sm text-center mb-4"
                  style={{ color: "#FF4F4F" }}
                >
                  Insufficient OMNI tokens
                </p>
              ) : (
                <button
                  type="button"
                  onClick={handleBuy}
                  className="w-full py-3 rounded-xl font-bold text-sm btn-neon-cyan mb-2"
                >
                  <ShoppingCart size={14} className="inline mr-2" />
                  BUY NOW
                </button>
              )}
              <button
                type="button"
                onClick={() => {
                  setSelectedItem(null);
                  const id = createConversation(selectedItem.sellerId);
                  setActiveConversation(id);
                  setActiveModule("chat");
                }}
                className="w-full py-3 rounded-xl font-bold text-sm transition-all"
                style={{
                  background: "transparent",
                  border: "1px solid #2A3142",
                  color: "#A7ACBE",
                }}
              >
                MESSAGE SELLER
              </button>
            </div>
          </div>
        </>
      )}

      {/* Create listing */}
      {showCreate && (
        <>
          <button
            type="button"
            aria-label="Close create listing"
            className="fixed inset-0 z-[60]"
            style={{ background: "rgba(0,0,0,0.8)" }}
            onClick={() => setShowCreate(false)}
          />
          <div className="fixed inset-0 z-[61] flex items-end justify-center pointer-events-none">
            <div
              className="w-full max-w-sm mx-4 mb-24 rounded-2xl p-6 animate-slide-up pointer-events-auto"
              style={{ background: "#0E1320", border: "1px solid #2A3142" }}
            >
              <h3
                className="font-bold tracking-wider mb-4"
                style={{ color: "#F2F4FF" }}
              >
                CREATE LISTING
              </h3>
              <div className="space-y-3">
                <select
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl text-sm outline-none"
                  style={{
                    background: "#151A26",
                    border: "1px solid #2A3142",
                    color: "#F2F4FF",
                  }}
                >
                  {["ID Sale", "Digital Product", "Service", "NFT"].map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
                <input
                  type="text"
                  placeholder="Title"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl text-sm outline-none"
                  style={{
                    background: "#151A26",
                    border: "1px solid #2A3142",
                    color: "#F2F4FF",
                    caretColor: "#19E6FF",
                  }}
                />
                <textarea
                  placeholder="Description"
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  rows={2}
                  className="w-full px-4 py-3 rounded-xl text-sm outline-none resize-none"
                  style={{
                    background: "#151A26",
                    border: "1px solid #2A3142",
                    color: "#F2F4FF",
                    caretColor: "#19E6FF",
                  }}
                />
                <input
                  type="number"
                  placeholder="Price (OMNI tokens)"
                  value={newPrice}
                  onChange={(e) => setNewPrice(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl text-sm outline-none"
                  style={{
                    background: "#151A26",
                    border: "1px solid #2A3142",
                    color: "#F2F4FF",
                    caretColor: "#19E6FF",
                  }}
                />
              </div>
              <button
                type="button"
                onClick={handleCreate}
                className="w-full py-3 rounded-xl font-bold text-sm btn-neon-cyan mt-4"
              >
                CREATE LISTING
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
