export type IDType = "permanent" | "temp_24h" | "temp_7d";
export type PrivacyMode = "normal" | "ghost" | "shadow";

export interface OmniIdentity {
  id: string;
  type: IDType;
  nickname?: string;
  emoji?: string;
  publicKey: string;
  privateKey: string;
  fingerprint: string;
  createdAt: number;
  expiresAt?: number;
  privacyMode: PrivacyMode;
  reputationScore: number;
  isActive: boolean;
}

const HEX_CHARS = "0123456789abcdef";

function randomHex(length: number): string {
  let result = "";
  for (let i = 0; i < length; i++) {
    result += HEX_CHARS[Math.floor(Math.random() * 16)];
  }
  return result;
}

function randomDigits(length: number): string {
  let result = "";
  for (let i = 0; i < length; i++) {
    result += Math.floor(Math.random() * 10).toString();
  }
  return result;
}

export function generateRandomID(): string {
  const part1 = randomDigits(4);
  const part2 = randomDigits(4);
  return `+777 ${part1} ${part2}`;
}

export function generateCustomID(suffix: string): string {
  const cleaned = suffix.replace(/\s/g, "").toUpperCase().slice(0, 8);
  const padded = cleaned.padEnd(8, Math.floor(Math.random() * 10).toString());
  return `+777 ${padded.slice(0, 4)} ${padded.slice(4, 8)}`;
}

export function generateKeyPair(): {
  publicKey: string;
  privateKey: string;
  fingerprint: string;
} {
  const publicKey = randomHex(64);
  const privateKey = randomHex(64);
  const fingerprint = randomHex(40);
  return { publicKey, privateKey, fingerprint };
}

export function simulateSignature(message: string, privateKey: string): string {
  // Simulated signature — not real cryptography
  const combined = message + privateKey + Date.now().toString();
  let hash = 0;
  for (let i = 0; i < combined.length; i++) {
    hash = (hash * 31 + combined.charCodeAt(i)) & 0xffffffff;
  }
  const base = Math.abs(hash).toString(16).padStart(8, "0");
  return (
    randomHex(8) +
    base +
    randomHex(8) +
    base.split("").reverse().join("") +
    randomHex(16)
  );
}

export function createIdentity(
  type: IDType,
  nickname?: string,
  emoji?: string,
  customSuffix?: string,
): OmniIdentity {
  const id = customSuffix ? generateCustomID(customSuffix) : generateRandomID();
  const keyPair = generateKeyPair();
  let expiresAt: number | undefined;
  if (type === "temp_24h") expiresAt = Date.now() + 24 * 60 * 60 * 1000;
  if (type === "temp_7d") expiresAt = Date.now() + 7 * 24 * 60 * 60 * 1000;

  return {
    id,
    type,
    nickname,
    emoji: emoji ?? "🌑",
    ...keyPair,
    createdAt: Date.now(),
    expiresAt,
    privacyMode: "normal",
    reputationScore: Math.floor(60 + Math.random() * 35),
    isActive: false,
  };
}

export const EMOJI_OPTIONS = [
  "🦊",
  "🐺",
  "🌑",
  "👻",
  "🔮",
  "⚡",
  "🌊",
  "🦋",
  "🎭",
  "🕷️",
  "🌙",
  "🔥",
];

export const MOCK_MARKETPLACE: Array<{
  id: string;
  idNumber: string;
  rarity: "common" | "rare" | "legendary";
  price: number;
  sellerRating: number;
  bidCount: number;
  seller: string;
}> = [];

export const NEARBY_USERS = [
  {
    id: "n1",
    emoji: "🦊",
    distance: "12m",
    type: "permanent" as IDType,
    partial: "+777 48** ****",
  },
  {
    id: "n2",
    emoji: "⚡",
    distance: "38m",
    type: "temp_24h" as IDType,
    partial: "+777 91** ****",
  },
  {
    id: "n3",
    emoji: "🔮",
    distance: "67m",
    type: "permanent" as IDType,
    partial: "+777 33** ****",
  },
  {
    id: "n4",
    emoji: "🌊",
    distance: "124m",
    type: "temp_7d" as IDType,
    partial: "+777 72** ****",
  },
  {
    id: "n5",
    emoji: "🎭",
    distance: "200m",
    type: "permanent" as IDType,
    partial: "+777 55** ****",
  },
];
