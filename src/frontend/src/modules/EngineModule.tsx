import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import {
  Activity,
  Cpu,
  Globe,
  MonitorSmartphone,
  Server,
  Shield,
  Smartphone,
  Tablet,
  Wifi,
  Zap,
} from "lucide-react";
import { useEffect, useState } from "react";

// ── Helpers ──────────────────────────────────────────────────────────────────
function rnd(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}
function fmtTime(d: Date) {
  return `${d.toTimeString().slice(0, 8)}.${String(d.getMilliseconds()).padStart(3, "0")}`;
}
function fmtUptime(s: number) {
  const h = Math.floor(s / 3600)
    .toString()
    .padStart(2, "0");
  const m = Math.floor((s % 3600) / 60)
    .toString()
    .padStart(2, "0");
  const sec = (s % 60).toString().padStart(2, "0");
  return `${h}:${m}:${sec}`;
}
const SESSION_ID = Array.from({ length: 8 }, () =>
  Math.floor(Math.random() * 16).toString(16),
).join("");

// ── Event types ───────────────────────────────────────────────────────────────
const EVENT_TYPES = [
  { type: "MESSAGE_SEND", color: "#06B6D4" },
  { type: "MESSAGE_RECEIVE", color: "#22C55E" },
  { type: "TYPING_START", color: "#EAB308" },
  { type: "TYPING_STOP", color: "#6B7280" },
  { type: "USER_ONLINE", color: "#10B981" },
  { type: "USER_OFFLINE", color: "#EF4444" },
  { type: "RIDE_REQUEST", color: "#F97316" },
  { type: "DRIVER_ACCEPT", color: "#22C55E" },
  { type: "LOCATION_UPDATE", color: "#3B82F6" },
  { type: "CALL_START", color: "#A855F7" },
  { type: "CALL_END", color: "#EC4899" },
];

const ROUTES = ["→ USER", "→ GROUP", "→ BROADCAST"];
const USER_IDS = [
  "+777 3421 892",
  "+777 8831 004",
  "+777 5512 763",
  "+777 1190 447",
];
const CHAT_IDS = ["#c4f2", "#a3b9", "#e7c1", "#f002"];

function genEvent() {
  const ev = EVENT_TYPES[rnd(0, EVENT_TYPES.length - 1)];
  const userId = USER_IDS[rnd(0, USER_IDS.length - 1)];
  const chatId = CHAT_IDS[rnd(0, CHAT_IDS.length - 1)];
  return {
    id: `ev${Date.now()}${Math.random()}`,
    type: ev.type,
    color: ev.color,
    time: fmtTime(new Date()),
    payload: `userId: ${userId}, chatId: ${chatId}`,
    route: ROUTES[rnd(0, ROUTES.length - 1)],
  };
}

type LiveEvent = ReturnType<typeof genEvent>;

// ── Initial sessions ──────────────────────────────────────────────────────────
const INIT_SESSIONS = [
  {
    id: "a1b2c3d4",
    userId: "+777 8831 004",
    device: "Mobile",
    status: "ACTIVE",
    region: "TR-IST",
    duration: 1847,
    events: 342,
  },
  {
    id: "e5f6a7b8",
    userId: "+777 3421 892",
    device: "Desktop",
    status: "ACTIVE",
    region: "TR-ANK",
    duration: 5621,
    events: 1204,
  },
  {
    id: "c9d0e1f2",
    userId: "+777 5512 763",
    device: "Tablet",
    status: "IDLE",
    region: "EU-AMS",
    duration: 890,
    events: 88,
  },
  {
    id: "b3c4d5e6",
    userId: "+777 1190 447",
    device: "Mobile",
    status: "ACTIVE",
    region: "US-NYC",
    duration: 3210,
    events: 760,
  },
  {
    id: "f7a8b9c0",
    userId: "+777 2293 881",
    device: "Mobile",
    status: "OFFLINE",
    region: "TR-IST",
    duration: 0,
    events: 45,
  },
  {
    id: "d1e2f3a4",
    userId: "+777 9945 326",
    device: "Desktop",
    status: "IDLE",
    region: "EU-AMS",
    duration: 712,
    events: 130,
  },
];

// ── Initial location streams ──────────────────────────────────────────────────
function initDrivers() {
  return [
    {
      id: "D1",
      role: "driver",
      lat: 41.0082,
      lng: 28.9784,
      speed: 42,
      vx: 0.0003,
      vy: 0.0001,
    },
    {
      id: "D2",
      role: "driver",
      lat: 41.015,
      lng: 28.96,
      speed: 37,
      vx: -0.0002,
      vy: 0.0002,
    },
    {
      id: "D3",
      role: "driver",
      lat: 40.995,
      lng: 29.01,
      speed: 55,
      vx: 0.0001,
      vy: -0.0003,
    },
    {
      id: "P1",
      role: "passenger",
      lat: 41.005,
      lng: 28.99,
      speed: 0,
      vx: 0,
      vy: 0,
    },
  ];
}

type Driver = ReturnType<typeof initDrivers>[number];

// ── Tabs ──────────────────────────────────────────────────────────────────────
const TABS = [
  "Overview",
  "Events",
  "Sessions",
  "Location",
  "Architecture",
] as const;
type Tab = (typeof TABS)[number];

// ══════════════════════════════════════════════════════════════════════════════
export function EngineModule() {
  const [activeTab, setActiveTab] = useState<Tab>("Overview");
  const [connections, setConnections] = useState(1247);
  const [eventsPerSec, setEventsPerSec] = useState(380);
  const [latency, setLatency] = useState(24);
  const [msgQueue, setMsgQueue] = useState(3);
  const [uptime, setUptime] = useState(0);
  const [heartbeat, setHeartbeat] = useState(0);
  const [modEvents, setModEvents] = useState({
    chat: 1204,
    ride: 342,
    ai: 88,
    p2p: 560,
  });
  const [events, setEvents] = useState<LiveEvent[]>(() =>
    Array.from({ length: 8 }, genEvent),
  );
  const [paused, setPaused] = useState(false);
  const [filterType, setFilterType] = useState("ALL");
  const [sessions] = useState(INIT_SESSIONS);
  const [invisibleMode, setInvisibleMode] = useState(false);
  const [myStatus, setMyStatus] = useState("Online");
  const [presenceBroadcast, setPresenceBroadcast] = useState(true);
  const [drivers, setDrivers] = useState<Driver[]>(initDrivers);
  const [packetPos, setPacketPos] = useState(0);

  useEffect(() => {
    const t1 = setInterval(() => setConnections((c) => c + rnd(-5, 5)), 1500);
    const t2 = setInterval(() => setEventsPerSec(rnd(340, 420)), 1000);
    const t3 = setInterval(() => setLatency(rnd(12, 48)), 2000);
    const t4 = setInterval(() => setMsgQueue(rnd(0, 8)), 3000);
    const t5 = setInterval(() => setUptime((u) => u + 1), 1000);
    const t6 = setInterval(() => setHeartbeat((h) => h + rnd(10, 80)), 800);
    const t7 = setInterval(() => {
      setModEvents((e) => ({
        chat: e.chat + rnd(1, 5),
        ride: e.ride + rnd(0, 3),
        ai: e.ai + rnd(0, 2),
        p2p: e.p2p + rnd(0, 4),
      }));
    }, 1200);
    return () => {
      [t1, t2, t3, t4, t5, t6, t7].forEach(clearInterval);
    };
  }, []);

  // biome-ignore lint/correctness/useExhaustiveDependencies: intentional chaining pattern
  useEffect(() => {
    if (paused) return;
    const delay = rnd(800, 2000);
    const t = setTimeout(() => {
      setEvents((prev) => [genEvent(), ...prev].slice(0, 50));
    }, delay);
    return () => clearTimeout(t);
  }, [events, paused]);

  useEffect(() => {
    const t = setInterval(() => {
      setDrivers((prev) =>
        prev.map((d) =>
          d.role === "driver"
            ? {
                ...d,
                lat: d.lat + d.vx + (Math.random() - 0.5) * 0.0001,
                lng: d.lng + d.vy + (Math.random() - 0.5) * 0.0001,
                speed: rnd(20, 70),
              }
            : d,
        ),
      );
    }, 1500);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    const t = setInterval(() => setPacketPos((p) => (p + 1) % 6), 600);
    return () => clearInterval(t);
  }, []);

  const filteredEvents =
    filterType === "ALL" ? events : events.filter((e) => e.type === filterType);

  return (
    <div className="h-full flex flex-col" style={{ background: "#06070B" }}>
      <div
        className="flex gap-1 px-3 pt-2 pb-0 overflow-x-auto scrollbar-none"
        style={{ borderBottom: "1px solid #1A2030" }}
      >
        {TABS.map((tab) => (
          <button
            key={tab}
            type="button"
            data-ocid={`engine.${tab.toLowerCase()}.tab`}
            onClick={() => setActiveTab(tab)}
            className="px-3 py-2 text-xs font-bold tracking-widest whitespace-nowrap transition-all"
            style={{
              color: activeTab === tab ? "#06B6D4" : "#4A5568",
              borderBottom:
                activeTab === tab
                  ? "2px solid #06B6D4"
                  : "2px solid transparent",
              background: "transparent",
            }}
          >
            {tab.toUpperCase()}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto px-3 py-3 space-y-4">
        {activeTab === "Overview" && (
          <OverviewTab
            connections={connections}
            eventsPerSec={eventsPerSec}
            latency={latency}
            msgQueue={msgQueue}
            uptime={uptime}
            heartbeat={heartbeat}
            modEvents={modEvents}
          />
        )}
        {activeTab === "Events" && (
          <EventsTab
            events={filteredEvents}
            paused={paused}
            setPaused={setPaused}
            filterType={filterType}
            setFilterType={setFilterType}
          />
        )}
        {activeTab === "Sessions" && (
          <SessionsTab
            sessions={sessions}
            invisibleMode={invisibleMode}
            setInvisibleMode={setInvisibleMode}
            myStatus={myStatus}
            setMyStatus={setMyStatus}
            presenceBroadcast={presenceBroadcast}
            setPresenceBroadcast={setPresenceBroadcast}
          />
        )}
        {activeTab === "Location" && <LocationTab drivers={drivers} />}
        {activeTab === "Architecture" && (
          <ArchitectureTab packetPos={packetPos} />
        )}
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// OVERVIEW TAB
// ══════════════════════════════════════════════════════════════════════════════
function OverviewTab({
  connections,
  eventsPerSec,
  latency,
  msgQueue,
  uptime,
  heartbeat,
  modEvents,
}: {
  connections: number;
  eventsPerSec: number;
  latency: number;
  msgQueue: number;
  uptime: number;
  heartbeat: number;
  modEvents: { chat: number; ride: number; ai: number; p2p: number };
}) {
  const stats = [
    {
      label: "Active Connections",
      value: connections.toLocaleString(),
      unit: "",
      accent: "#22C55E",
      icon: <Wifi size={14} />,
    },
    {
      label: "Events / sec",
      value: eventsPerSec.toString(),
      unit: "/s",
      accent: "#A855F7",
      icon: <Zap size={14} />,
    },
    {
      label: "Avg Latency",
      value: latency.toString(),
      unit: "ms",
      accent: "#06B6D4",
      icon: <Activity size={14} />,
    },
    {
      label: "Message Queue",
      value: msgQueue.toString(),
      unit: "",
      accent: "#F97316",
      icon: <Server size={14} />,
    },
  ];
  const modules = [
    { name: "Chat Module", count: modEvents.chat },
    { name: "Ride Module", count: modEvents.ride },
    { name: "AI Module", count: modEvents.ai },
    { name: "P2P Module", count: modEvents.p2p },
  ];

  return (
    <>
      <div className="grid grid-cols-2 gap-2">
        {stats.map((s) => (
          <div
            key={s.label}
            className="rounded-xl p-3"
            style={{ background: "#0B1020", border: `1px solid ${s.accent}33` }}
          >
            <div
              className="flex items-center gap-1 mb-2"
              style={{ color: s.accent }}
            >
              {s.icon}
              <span
                className="text-[10px] font-bold tracking-widest uppercase"
                style={{ color: "#94A3B8" }}
              >
                {s.label}
              </span>
            </div>
            <div
              className="font-mono font-bold text-xl"
              style={{ color: s.accent }}
            >
              {s.value}
              <span
                className="text-sm ml-0.5"
                style={{ color: `${s.accent}99` }}
              >
                {s.unit}
              </span>
            </div>
          </div>
        ))}
      </div>

      <div
        className="rounded-xl p-3 space-y-2"
        style={{ background: "#0B1020", border: "1px solid #22C55E33" }}
      >
        <div className="flex items-center gap-2">
          <span
            className="w-2.5 h-2.5 rounded-full animate-pulse"
            style={{ background: "#22C55E", boxShadow: "0 0 8px #22C55E" }}
          />
          <span
            className="font-mono text-sm font-bold"
            style={{ color: "#22C55E" }}
          >
            WSS CONNECTED
          </span>
        </div>
        <div className="grid grid-cols-2 gap-1">
          {[
            ["Session ID", `0x${SESSION_ID}`],
            ["Heartbeat", `${heartbeat % 1000}ms ago`],
            ["Uptime", fmtUptime(uptime)],
            ["Auto-Reconnect", "ENABLED"],
          ].map(([k, v]) => (
            <div key={k}>
              <div
                className="text-[9px] tracking-widest"
                style={{ color: "#4A5568" }}
              >
                {k}
              </div>
              <div
                className="font-mono text-[11px]"
                style={{ color: "#E2E8F0" }}
              >
                {v}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div>
        <div
          className="text-[10px] font-bold tracking-widest mb-2"
          style={{ color: "#4A5568" }}
        >
          MODULE INTEGRATION
        </div>
        <div className="grid grid-cols-2 gap-2">
          {modules.map((m) => (
            <div
              key={m.name}
              className="rounded-xl p-3"
              style={{ background: "#0B1020", border: "1px solid #22C55E22" }}
            >
              <div className="flex items-center justify-between mb-1">
                <span
                  className="text-xs font-bold"
                  style={{ color: "#E2E8F0" }}
                >
                  {m.name}
                </span>
                <span
                  className="text-[9px] font-bold"
                  style={{ color: "#22C55E" }}
                >
                  ONLINE
                </span>
              </div>
              <div
                className="font-mono text-[11px]"
                style={{ color: "#94A3B8" }}
              >
                {m.count.toLocaleString()} events
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// EVENTS TAB
// ══════════════════════════════════════════════════════════════════════════════
function EventsTab({
  events,
  paused,
  setPaused,
  filterType,
  setFilterType,
}: {
  events: LiveEvent[];
  paused: boolean;
  setPaused: (v: boolean) => void;
  filterType: string;
  setFilterType: (v: string) => void;
}) {
  return (
    <>
      <div className="flex items-center gap-2">
        <button
          type="button"
          data-ocid="engine.events.toggle"
          onClick={() => setPaused(!paused)}
          className="px-3 py-1.5 rounded-lg text-xs font-bold tracking-wider transition-all"
          style={{
            background: paused ? "#22C55E22" : "#EF444422",
            color: paused ? "#22C55E" : "#EF4444",
            border: `1px solid ${paused ? "#22C55E44" : "#EF444444"}`,
          }}
        >
          {paused ? "▶ RESUME" : "⏸ PAUSE"}
        </button>
        <div className="flex-1">
          <Select value={filterType} onValueChange={setFilterType}>
            <SelectTrigger
              data-ocid="engine.events.select"
              className="h-8 text-xs font-mono"
              style={{
                background: "#0B1020",
                border: "1px solid #1A2030",
                color: "#E2E8F0",
              }}
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent
              style={{ background: "#0B1020", border: "1px solid #1A2030" }}
            >
              <SelectItem value="ALL" className="text-xs font-mono">
                ALL EVENTS
              </SelectItem>
              {EVENT_TYPES.map((e) => (
                <SelectItem
                  key={e.type}
                  value={e.type}
                  className="text-xs font-mono"
                >
                  {e.type}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-1">
        {events.map((ev, i) => (
          <div
            key={ev.id}
            data-ocid={`engine.events.item.${i + 1}`}
            className="rounded-lg px-2 py-1.5 flex items-center gap-2"
            style={{
              background: "#0B1020",
              border: `1px solid ${ev.color}22`,
              opacity: i === 0 ? 1 : 0.9,
            }}
          >
            <span
              className="text-[9px] font-bold font-mono px-1.5 py-0.5 rounded whitespace-nowrap"
              style={{
                background: `${ev.color}22`,
                color: ev.color,
                border: `1px solid ${ev.color}44`,
              }}
            >
              {ev.type}
            </span>
            <span
              className="font-mono text-[9px] shrink-0"
              style={{ color: "#4A5568" }}
            >
              {ev.time}
            </span>
            <span
              className="font-mono text-[10px] truncate flex-1"
              style={{ color: "#94A3B8" }}
            >
              {ev.payload}
            </span>
            <span
              className="font-mono text-[9px] shrink-0"
              style={{ color: "#3B82F6" }}
            >
              {ev.route}
            </span>
          </div>
        ))}
      </div>
    </>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// SESSIONS TAB
// ══════════════════════════════════════════════════════════════════════════════
function SessionsTab({
  sessions,
  invisibleMode,
  setInvisibleMode,
  myStatus,
  setMyStatus,
  presenceBroadcast,
  setPresenceBroadcast,
}: {
  sessions: typeof INIT_SESSIONS;
  invisibleMode: boolean;
  setInvisibleMode: (v: boolean) => void;
  myStatus: string;
  setMyStatus: (v: string) => void;
  presenceBroadcast: boolean;
  setPresenceBroadcast: (v: boolean) => void;
}) {
  const statusColor = (s: string) =>
    s === "ACTIVE" ? "#22C55E" : s === "IDLE" ? "#EAB308" : "#6B7280";
  const DeviceIcon = ({ d }: { d: string }) =>
    d === "Mobile" ? (
      <Smartphone size={12} />
    ) : d === "Desktop" ? (
      <MonitorSmartphone size={12} />
    ) : (
      <Tablet size={12} />
    );

  return (
    <>
      <div className="flex items-center justify-between">
        <div>
          <div className="text-sm font-bold" style={{ color: "#E2E8F0" }}>
            Multi-Device Support
          </div>
          <div className="text-[11px]" style={{ color: "#94A3B8" }}>
            {sessions.length} active sessions
          </div>
        </div>
        <span
          className="font-mono text-xs px-2 py-1 rounded"
          style={{
            background: "#A855F722",
            color: "#A855F7",
            border: "1px solid #A855F744",
          }}
        >
          {sessions.filter((s) => s.status !== "OFFLINE").length} online
        </span>
      </div>

      <div className="space-y-2">
        {sessions.map((s, i) => (
          <div
            key={s.id}
            data-ocid={`engine.sessions.item.${i + 1}`}
            className="rounded-xl p-3"
            style={{
              background: "#0B1020",
              border: `1px solid ${statusColor(s.status)}33`,
            }}
          >
            <div className="flex items-center justify-between mb-1">
              <span
                className="font-mono text-[10px]"
                style={{ color: "#4A5568" }}
              >
                0x{s.id}
              </span>
              <span
                className="text-[9px] font-bold"
                style={{ color: statusColor(s.status) }}
              >
                {s.status}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-x-4 gap-y-0.5">
              <div className="flex items-center gap-1">
                <Globe size={10} style={{ color: "#4A5568" }} />
                <span
                  className="font-mono text-[10px]"
                  style={{ color: "#E2E8F0" }}
                >
                  {s.userId}
                </span>
              </div>
              <div
                className="flex items-center gap-1"
                style={{ color: "#94A3B8" }}
              >
                <DeviceIcon d={s.device} />
                <span className="text-[10px]">{s.device}</span>
              </div>
              <div
                className="font-mono text-[10px]"
                style={{ color: "#4A5568" }}
              >
                {s.region}
              </div>
              <div
                className="font-mono text-[10px]"
                style={{ color: "#94A3B8" }}
              >
                {s.events.toLocaleString()} evts
              </div>
            </div>
          </div>
        ))}
      </div>

      <div
        className="rounded-xl p-3 space-y-3"
        style={{ background: "#0B1020", border: "1px solid #1A2030" }}
      >
        <div
          className="text-[10px] font-bold tracking-widest"
          style={{ color: "#4A5568" }}
        >
          PRESENCE SETTINGS
        </div>
        <div className="flex items-center justify-between">
          <Label className="text-xs" style={{ color: "#E2E8F0" }}>
            Invisible Mode
          </Label>
          <Switch
            data-ocid="engine.sessions.switch"
            checked={invisibleMode}
            onCheckedChange={setInvisibleMode}
          />
        </div>
        <div className="flex items-center justify-between">
          <Label className="text-xs" style={{ color: "#E2E8F0" }}>
            Broadcast to Friends Only
          </Label>
          <Switch
            data-ocid="engine.sessions.broadcast.switch"
            checked={presenceBroadcast}
            onCheckedChange={setPresenceBroadcast}
          />
        </div>
        <div>
          <Label
            className="text-[10px] tracking-wider"
            style={{ color: "#4A5568" }}
          >
            MY STATUS
          </Label>
          <Select value={myStatus} onValueChange={setMyStatus}>
            <SelectTrigger
              data-ocid="engine.sessions.select"
              className="mt-1 h-8 text-xs"
              style={{
                background: "#06070B",
                border: "1px solid #1A2030",
                color: "#E2E8F0",
              }}
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent
              style={{ background: "#0B1020", border: "1px solid #1A2030" }}
            >
              {["Online", "Away", "Busy", "Invisible"].map((s) => (
                <SelectItem key={s} value={s} className="text-xs">
                  {s}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <div className="text-[10px]" style={{ color: "#4A5568" }}>
            LAST SEEN
          </div>
          <div className="font-mono text-[11px]" style={{ color: "#94A3B8" }}>
            {fmtTime(new Date())}
          </div>
        </div>
      </div>
    </>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// LOCATION TAB
// ══════════════════════════════════════════════════════════════════════════════
function LocationTab({ drivers }: { drivers: Driver[] }) {
  const latMin = 40.985;
  const latMax = 41.025;
  const lngMin = 28.95;
  const lngMax = 29.02;
  const W = 300;
  const H = 160;
  function toXY(lat: number, lng: number) {
    const x = ((lng - lngMin) / (lngMax - lngMin)) * W;
    const y = H - ((lat - latMin) / (latMax - latMin)) * H;
    return {
      x: Math.max(8, Math.min(W - 8, x)),
      y: Math.max(8, Math.min(H - 8, y)),
    };
  }

  return (
    <>
      <div
        className="rounded-xl overflow-hidden relative"
        style={{ background: "#060C18", border: "1px solid #1A2030" }}
      >
        <div className="flex items-center justify-between px-3 py-2">
          <span
            className="text-[10px] font-bold tracking-widest"
            style={{ color: "#4A5568" }}
          >
            LIVE MAP — TR-IST
          </span>
          <span
            className="font-mono text-[9px] px-2 py-0.5 rounded"
            style={{
              background: "#3B82F622",
              color: "#3B82F6",
              border: "1px solid #3B82F644",
            }}
          >
            ⟳ 1.2s
          </span>
        </div>
        <svg
          width="100%"
          viewBox={`0 0 ${W} ${H}`}
          style={{ display: "block" }}
          aria-label="Live driver map"
        >
          <title>Live driver and passenger locations</title>
          {[0, 1, 2, 3, 4, 5, 6].map((i) => (
            <line
              key={`vg${i}`}
              x1={i * (W / 6)}
              y1={0}
              x2={i * (W / 6)}
              y2={H}
              stroke="#1A2030"
              strokeWidth="1"
            />
          ))}
          {[0, 1, 2, 3, 4].map((i) => (
            <line
              key={`hg${i}`}
              x1={0}
              y1={i * (H / 4)}
              x2={W}
              y2={i * (H / 4)}
              stroke="#1A2030"
              strokeWidth="1"
            />
          ))}
          {drivers.map((d) => {
            const { x, y } = toXY(d.lat, d.lng);
            const color = d.role === "driver" ? "#3B82F6" : "#F97316";
            return (
              <g key={d.id}>
                <circle cx={x} cy={y} r={6} fill={color} fillOpacity={0.2} />
                <circle cx={x} cy={y} r={4} fill={color} />
                <text
                  x={x + 6}
                  y={y - 4}
                  fontSize={8}
                  fill={color}
                  fontFamily="monospace"
                >
                  {d.id}
                </text>
              </g>
            );
          })}
        </svg>
        <div className="flex gap-3 px-3 py-2">
          <div className="flex items-center gap-1">
            <div
              className="w-2 h-2 rounded-full"
              style={{ background: "#3B82F6" }}
            />
            <span className="text-[9px]" style={{ color: "#94A3B8" }}>
              Driver
            </span>
          </div>
          <div className="flex items-center gap-1">
            <div
              className="w-2 h-2 rounded-full"
              style={{ background: "#F97316" }}
            />
            <span className="text-[9px]" style={{ color: "#94A3B8" }}>
              Passenger
            </span>
          </div>
        </div>
      </div>

      <div
        className="rounded-xl p-3"
        style={{ background: "#0B1020", border: "1px solid #1A2030" }}
      >
        <div
          className="text-[10px] font-bold tracking-widest mb-2"
          style={{ color: "#4A5568" }}
        >
          DELTA COMPRESSION
        </div>
        <div className="grid grid-cols-3 gap-2">
          {[
            { label: "Full payload", value: "128B", color: "#EF4444" },
            { label: "Delta payload", value: "23B", color: "#22C55E" },
            { label: "Compression", value: "82%", color: "#06B6D4" },
          ].map((item) => (
            <div key={item.label} className="text-center">
              <div
                className="font-mono font-bold text-lg"
                style={{ color: item.color }}
              >
                {item.value}
              </div>
              <div className="text-[9px]" style={{ color: "#4A5568" }}>
                {item.label}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div
        className="rounded-xl overflow-hidden"
        style={{ background: "#0B1020", border: "1px solid #1A2030" }}
      >
        <div
          className="px-3 py-2 text-[10px] font-bold tracking-widest"
          style={{ color: "#4A5568" }}
        >
          ACTIVE STREAMS
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-[10px] font-mono">
            <thead>
              <tr style={{ borderBottom: "1px solid #1A2030" }}>
                {["ID", "Role", "Coords", "Speed", "Updated"].map((h) => (
                  <th
                    key={h}
                    className="px-2 py-1 text-left font-bold"
                    style={{ color: "#4A5568" }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {drivers.map((d, i) => (
                <tr
                  key={d.id}
                  data-ocid={`engine.location.item.${i + 1}`}
                  style={{
                    borderBottom: "1px solid #0F1520",
                    color: d.role === "driver" ? "#3B82F6" : "#F97316",
                  }}
                >
                  <td className="px-2 py-1.5">{d.id}</td>
                  <td className="px-2 py-1.5 capitalize">{d.role}</td>
                  <td className="px-2 py-1.5">
                    {d.lat.toFixed(4)},{d.lng.toFixed(4)}
                  </td>
                  <td className="px-2 py-1.5">{d.speed} km/h</td>
                  <td className="px-2 py-1.5" style={{ color: "#4A5568" }}>
                    now
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// ARCHITECTURE TAB
// ══════════════════════════════════════════════════════════════════════════════
const ARCH_NODES = [
  { id: "mc1", label: "Mobile 1", row: 0, col: 0, border: "#3B82F6" },
  { id: "mc2", label: "Mobile 2", row: 0, col: 1, border: "#3B82F6" },
  { id: "wc", label: "Web Client", row: 0, col: 2, border: "#3B82F6" },
  { id: "lb", label: "Load Balancer", row: 1, col: 1, border: "#EAB308" },
  { id: "ws1", label: "WS-01", row: 2, col: 0, border: "#A855F7" },
  { id: "ws2", label: "WS-02", row: 2, col: 1, border: "#A855F7" },
  { id: "ws3", label: "WS-03", row: 2, col: 2, border: "#A855F7" },
  { id: "mq", label: "Msg Queue", row: 3, col: 0, border: "#F97316" },
  { id: "eb", label: "Event Bus", row: 3, col: 2, border: "#F97316" },
  { id: "ps", label: "Presence", row: 4, col: 0, border: "#22C55E" },
  { id: "ss", label: "Sessions", row: 4, col: 1, border: "#22C55E" },
  { id: "le", label: "Location", row: 4, col: 2, border: "#22C55E" },
  { id: "ds", label: "Data Store", row: 5, col: 1, border: "#6B7280" },
];

function ArchitectureTab({ packetPos }: { packetPos: number }) {
  const ROW_H = 56;
  const COL_W = 100;
  const PAD_X = 20;
  const W = COL_W * 3 + PAD_X * 2;
  const H = ROW_H * 6 + 20;

  function nodeXY(n: (typeof ARCH_NODES)[number]) {
    return { x: PAD_X + n.col * COL_W + COL_W / 2, y: 16 + n.row * ROW_H + 18 };
  }

  const edges: [string, string][] = [
    ["mc1", "lb"],
    ["mc2", "lb"],
    ["wc", "lb"],
    ["lb", "ws1"],
    ["lb", "ws2"],
    ["lb", "ws3"],
    ["ws1", "mq"],
    ["ws3", "eb"],
    ["mq", "ps"],
    ["mq", "ss"],
    ["eb", "le"],
    ["ps", "ds"],
    ["ss", "ds"],
    ["le", "ds"],
  ];

  const PATHS = [
    ["mc1", "lb", "ws1", "mq", "ps", "ds"],
    ["mc2", "lb", "ws2", "mq", "ss", "ds"],
    ["wc", "lb", "ws3", "eb", "le", "ds"],
  ];
  const pathIdx = Math.floor((Date.now() / 3600) % PATHS.length);
  const path = PATHS[pathIdx % PATHS.length];
  const packetNode = path[packetPos % path.length];

  return (
    <>
      <div
        className="text-[10px] font-bold tracking-widest mb-1"
        style={{ color: "#4A5568" }}
      >
        SYSTEM ARCHITECTURE
      </div>
      <div
        className="rounded-xl overflow-hidden"
        style={{ background: "#060C18", border: "1px solid #1A2030" }}
      >
        <svg
          width="100%"
          viewBox={`0 0 ${W} ${H}`}
          style={{ display: "block" }}
          aria-label="System architecture diagram"
        >
          <title>WebSocket server architecture diagram</title>
          {edges.map(([a, b]) => {
            const na = ARCH_NODES.find((n) => n.id === a)!;
            const nb = ARCH_NODES.find((n) => n.id === b)!;
            const pa = nodeXY(na);
            const pb = nodeXY(nb);
            return (
              <line
                key={`${a}-${b}`}
                x1={pa.x}
                y1={pa.y + 14}
                x2={pb.x}
                y2={pb.y - 14}
                stroke="#1A2030"
                strokeWidth={1}
                markerEnd="url(#arrow)"
              />
            );
          })}
          <defs>
            <marker
              id="arrow"
              markerWidth="6"
              markerHeight="6"
              refX="3"
              refY="3"
              orient="auto"
            >
              <path d="M0,0 L0,6 L6,3 z" fill="#1A2030" />
            </marker>
          </defs>
          {ARCH_NODES.map((n) => {
            const { x, y } = nodeXY(n);
            const isPacket = n.id === packetNode;
            return (
              <g key={n.id}>
                <rect
                  x={x - 38}
                  y={y - 14}
                  width={76}
                  height={28}
                  rx={6}
                  fill={isPacket ? `${n.border}33` : "#0B1020"}
                  stroke={n.border}
                  strokeWidth={isPacket ? 2 : 1}
                />
                {isPacket && (
                  <rect
                    x={x - 38}
                    y={y - 14}
                    width={76}
                    height={28}
                    rx={6}
                    fill="none"
                    stroke={n.border}
                    strokeWidth={3}
                    opacity={0.5}
                  />
                )}
                <text
                  x={x}
                  y={y + 4}
                  textAnchor="middle"
                  fontSize={9}
                  fontFamily="monospace"
                  fill={isPacket ? n.border : "#94A3B8"}
                >
                  {n.label}
                </text>
              </g>
            );
          })}
          {[
            { y: 16 + 0 * ROW_H, label: "CLIENTS" },
            { y: 16 + 1 * ROW_H, label: "LOAD BALANCER" },
            { y: 16 + 2 * ROW_H, label: "WS CLUSTER" },
            { y: 16 + 3 * ROW_H, label: "EVENT QUEUE" },
            { y: 16 + 4 * ROW_H, label: "SERVICES" },
            { y: 16 + 5 * ROW_H, label: "DATA STORE" },
          ].map(({ y, label }) => (
            <text
              key={label}
              x={2}
              y={y + 4}
              fontSize={7}
              fontFamily="monospace"
              fill="#2A3040"
            >
              {label}
            </text>
          ))}
        </svg>
      </div>

      <div className="space-y-2">
        {[
          {
            icon: <Globe size={14} />,
            title: "Partition Strategy",
            desc: "Region-based sharding across TR / EU / US clusters",
            color: "#06B6D4",
          },
          {
            icon: <Shield size={14} />,
            title: "Fault Tolerance",
            desc: "Auto-reconnect + message retry queue + backup channels",
            color: "#22C55E",
          },
          {
            icon: <Cpu size={14} />,
            title: "Security",
            desc: "WSS + Token auth per session + rate limiting per IP",
            color: "#A855F7",
          },
          {
            icon: <Zap size={14} />,
            title: "Latency Optimization",
            desc: "Lightweight JSON payloads + delta compression + CDN",
            color: "#F97316",
          },
        ].map((item) => (
          <div
            key={item.title}
            className="rounded-xl p-3 flex gap-3"
            style={{
              background: "#0B1020",
              border: `1px solid ${item.color}33`,
            }}
          >
            <div style={{ color: item.color, marginTop: 2 }}>{item.icon}</div>
            <div>
              <div className="text-xs font-bold" style={{ color: item.color }}>
                {item.title}
              </div>
              <div className="text-[11px] mt-0.5" style={{ color: "#94A3B8" }}>
                {item.desc}
              </div>
            </div>
          </div>
        ))}
      </div>

      <div
        className="py-4 text-center text-[10px]"
        style={{ color: "#2A3040" }}
      >
        © {new Date().getFullYear()}. Built with love using{" "}
        <a
          href={`https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(window.location.hostname)}`}
          target="_blank"
          rel="noopener noreferrer"
          style={{ color: "#4A5568", textDecoration: "underline" }}
        >
          caffeine.ai
        </a>
      </div>
    </>
  );
}
