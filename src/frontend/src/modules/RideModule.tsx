import "leaflet/dist/leaflet.css";
import L from "leaflet";
import {
  AlertTriangle,
  Briefcase,
  Car,
  CheckCircle,
  ChevronUp,
  Heart,
  Home,
  Loader2,
  MapPin,
  MessageCircle,
  Navigation,
  Phone,
  Shield,
  Star,
  TrendingUp,
  X,
  Zap,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import {
  MapContainer,
  Marker,
  Polyline,
  TileLayer,
  useMap,
} from "react-leaflet";

// Fix default leaflet icons
(L.Icon.Default.prototype as any)._getIconUrl = undefined;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

// ─── TYPES ───────────────────────────────────────────────────────────────────

type RideState =
  | "idle"
  | "selecting"
  | "confirming"
  | "matching"
  | "driver_assigned"
  | "driver_arriving"
  | "trip_started"
  | "completed";

type DriverRideState =
  | "idle"
  | "going_to_pickup"
  | "arrived_at_pickup"
  | "trip_started"
  | "trip_completed";

type DriverTab = "gorev" | "kazanc" | "guvenlik" | "ai";
type RideType = "economy" | "comfort" | "premium";
type PaymentMethod = "wallet" | "card" | "cash";

interface LatLon {
  lat: number;
  lon: number;
}

interface NominatimResult {
  place_id: number;
  display_name: string;
  lat: string;
  lon: string;
}

interface SimulatedDriver {
  id: string;
  lat: number;
  lon: number;
  type: "economy" | "premium";
  name: string;
  rating: number;
  car: string;
  plate: string;
}

interface IncomingRide {
  passengerID: string;
  pickup: string;
  destination: string;
  distance: string;
  fare: string;
}

// ─── CONSTANTS ───────────────────────────────────────────────────────────────

const isTurkey = Intl.DateTimeFormat()
  .resolvedOptions()
  .timeZone.includes("Istanbul");
const currency = isTurkey
  ? { symbol: "₺", code: "TRY" }
  : { symbol: "€", code: "EUR" };

const RIDE_OPTIONS = [
  {
    id: "economy" as RideType,
    label: "Economy",
    icon: "🚗",
    base: isTurkey ? 30 : 5,
    perKm: isTurkey ? 8 : 1.2,
    perMin: isTurkey ? 1 : 0.15,
    etaMin: 3,
  },
  {
    id: "comfort" as RideType,
    label: "Comfort",
    icon: "🚙",
    base: isTurkey ? 50 : 8,
    perKm: isTurkey ? 12 : 1.8,
    perMin: isTurkey ? 1.5 : 0.2,
    etaMin: 5,
  },
  {
    id: "premium" as RideType,
    label: "Premium",
    icon: "🏎️",
    base: isTurkey ? 80 : 12,
    perKm: isTurkey ? 18 : 2.5,
    perMin: isTurkey ? 2 : 0.3,
    etaMin: 7,
  },
];

// Peak hours bar heights (pre-computed, no random)
const PEAK_HOURS_HEIGHTS: { hour: number; height: number }[] = Array.from(
  { length: 24 },
  (_, h) => {
    let height = 14;
    if (h >= 7 && h <= 9) height = 42;
    else if (h >= 12 && h <= 14) height = 36;
    else if (h >= 17 && h <= 20) height = 46;
    else if (h === 6 || h === 10) height = 26;
    else if (h === 11 || h === 15) height = 22;
    else if (h === 16 || h === 21) height = 30;
    else if (h >= 22 || h <= 4) height = 8;
    return { hour: h, height };
  },
);

const MOCK_RIDE_HISTORY = [
  {
    id: "+777 8821 3390",
    dest: "Schiphol",
    fare: isTurkey ? 195 : 28,
    km: 18.2,
    rating: 4.9,
    time: "14:32",
  },
  {
    id: "+777 2934 8821",
    dest: "Centrum",
    fare: isTurkey ? 85 : 12,
    km: 5.1,
    rating: 5.0,
    time: "11:15",
  },
  {
    id: "+777 7761 2204",
    dest: "Vondelpark",
    fare: isTurkey ? 65 : 9.5,
    km: 3.8,
    rating: 4.7,
    time: "09:45",
  },
  {
    id: "+777 3348 5509",
    dest: "Leidseplein",
    fare: isTurkey ? 105 : 15,
    km: 7.2,
    rating: 4.8,
    time: "08:20",
  },
  {
    id: "+777 9921 0018",
    dest: "Amsterdam Noord",
    fare: isTurkey ? 130 : 18.5,
    km: 9.6,
    rating: 5.0,
    time: "07:55",
  },
];

// ─── HELPERS ─────────────────────────────────────────────────────────────────

function haversineKm(a: LatLon, b: LatLon): number {
  const R = 6371;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLon = ((b.lon - a.lon) * Math.PI) / 180;
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((a.lat * Math.PI) / 180) *
      Math.cos((b.lat * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.asin(Math.sqrt(h));
}

function calcPrice(
  option: (typeof RIDE_OPTIONS)[number],
  km: number,
  surge: number,
): number {
  const mins = km * 2;
  return (option.base + option.perKm * km + option.perMin * mins) * surge;
}

function randomDrivers(center: LatLon): SimulatedDriver[] {
  const names = [
    "+777 4821 3390",
    "+777 2934 8821",
    "+777 7761 2204",
    "+777 3348 5509",
    "+777 9921 0018",
  ];
  const cars = [
    { car: "Toyota Corolla", plate: "34 ABC 1234" },
    { car: "Honda Civic", plate: "06 DEF 5678" },
    { car: "BMW 3 Series", plate: "35 XYZ 9900" },
    { car: "Renault Megane", plate: "34 KLM 4421" },
    { car: "Mercedes C200", plate: "34 NOP 7762" },
  ];
  return Array.from({ length: 5 }, (_, i) => ({
    id: String(i),
    lat: center.lat + (Math.random() - 0.5) * 0.03,
    lon: center.lon + (Math.random() - 0.5) * 0.03,
    type: i >= 3 ? "premium" : "economy",
    name: names[i],
    rating: 4.5 + Math.random() * 0.5,
    car: cars[i].car,
    plate: cars[i].plate,
  }));
}

function carIcon(type: "economy" | "premium") {
  return L.divIcon({
    html: type === "premium" ? "🚙" : "🚗",
    className: "",
    iconSize: [28, 28],
    iconAnchor: [14, 14],
  });
}

function pinIcon(color: string) {
  return L.divIcon({
    html: `<div style="width:16px;height:16px;border-radius:50%;background:${color};border:3px solid white;box-shadow:0 0 8px ${color}"></div>`,
    className: "",
    iconSize: [16, 16],
    iconAnchor: [8, 8],
  });
}

function pulseIcon() {
  return L.divIcon({
    html: `<div class="ride-request-pulse"></div>`,
    className: "",
    iconSize: [24, 24],
    iconAnchor: [12, 12],
  });
}

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

// ─── MAP CONTROLLER ──────────────────────────────────────────────────────────

function MapController({
  center,
  bounds,
}: {
  center: LatLon | null;
  bounds: [LatLon, LatLon] | null;
}) {
  const map = useMap();
  useEffect(() => {
    if (bounds) {
      map.fitBounds(
        [
          [bounds[0].lat, bounds[0].lon],
          [bounds[1].lat, bounds[1].lon],
        ],
        { padding: [60, 60] },
      );
    } else if (center) {
      map.setView([center.lat, center.lon], 15);
    }
  }, [center, bounds, map]);
  return null;
}

function useDebounce<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

// ─── MAIN COMPONENT ──────────────────────────────────────────────────────────

export default function RideModule() {
  // ── Passenger state ──
  const [rideState, setRideState] = useState<RideState>("idle");
  const [isDriverMode, setIsDriverMode] = useState(false);
  const [driverOnline, setDriverOnline] = useState(false);

  const [userLocation, setUserLocation] = useState<LatLon | null>(null);
  const [locationAccuracy, setLocationAccuracy] = useState<number>(0);
  const [gpsError, setGpsError] = useState(false);

  const [pickupText, setPickupText] = useState("");
  const [pickupCoords, setPickupCoords] = useState<LatLon | null>(null);
  const [destText, setDestText] = useState("");
  const [destCoords, setDestCoords] = useState<LatLon | null>(null);

  const [pickupQuery, setPickupQuery] = useState("");
  const [destQuery, setDestQuery] = useState("");
  const [pickupResults, setPickupResults] = useState<NominatimResult[]>([]);
  const [destResults, setDestResults] = useState<NominatimResult[]>([]);
  const [activeInput, setActiveInput] = useState<"pickup" | "dest" | null>(
    null,
  );

  const [selectedRide, setSelectedRide] = useState<RideType>("economy");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("wallet");
  const [surgeMultiplier] = useState(Math.random() > 0.7 ? 1.2 : 1.0);
  const [distanceKm, setDistanceKm] = useState(0);

  const [drivers, setDrivers] = useState<SimulatedDriver[]>([]);
  const [assignedDriver, setAssignedDriver] = useState<SimulatedDriver | null>(
    null,
  );
  const [driverEta, setDriverEta] = useState(3);
  const [panelExpanded, setPanelExpanded] = useState(false);
  const [rating, setRating] = useState(5);

  // ── Driver mode state ──
  const [driverRideState, setDriverRideState] =
    useState<DriverRideState>("idle");
  const [driverTab, setDriverTab] = useState<DriverTab>("gorev");
  const [incomingRide, setIncomingRide] = useState<IncomingRide | null>(null);
  const [countdown, setCountdown] = useState(12);
  const [fareMeter, setFareMeter] = useState(0);
  const [tripSeconds, setTripSeconds] = useState(0);
  const [waitSeconds, setWaitSeconds] = useState(0);
  const [showPaymentReceipt, setShowPaymentReceipt] = useState(false);
  const [driverPassengerRating, setDriverPassengerRating] = useState(5);
  const [showDriverRating, setShowDriverRating] = useState(false);
  const [driverEarningsToday, setDriverEarningsToday] = useState(
    isTurkey ? 320 : 45,
  );
  const [driverRidesCountToday, setDriverRidesCountToday] = useState(5);
  const [showSosModal, setShowSosModal] = useState(false);
  const [pulseMarkers, setPulseMarkers] = useState<LatLon[]>([]);

  // Derived driver status
  const driverStatus: "offline" | "online" | "busy" = !driverOnline
    ? "offline"
    : driverRideState !== "idle"
      ? "busy"
      : "online";

  const mapCenter: LatLon = userLocation || { lat: 52.3676, lon: 4.9041 };

  const dPickupQuery = useDebounce(pickupQuery, 500);
  const dDestQuery = useDebounce(destQuery, 500);

  // ── Inject pulse CSS ──
  useEffect(() => {
    const style = document.createElement("style");
    style.id = "ride-pulse-css";
    style.textContent = `
      .ride-request-pulse {
        width: 16px;
        height: 16px;
        border-radius: 50%;
        background: #f97316;
        box-shadow: 0 0 0 0 rgba(249,115,22,0.7);
        animation: pulse-ride 1.5s infinite;
      }
      @keyframes pulse-ride {
        0%   { box-shadow: 0 0 0 0 rgba(249,115,22,0.7); }
        70%  { box-shadow: 0 0 0 14px rgba(249,115,22,0); }
        100% { box-shadow: 0 0 0 0 rgba(249,115,22,0); }
      }
    `;
    if (!document.getElementById("ride-pulse-css")) {
      document.head.appendChild(style);
    }
    return () => {
      const el = document.getElementById("ride-pulse-css");
      if (el) el.remove();
    };
  }, []);

  // ── Generate pulse markers when driver online ──
  useEffect(() => {
    if (!isDriverMode || !driverOnline || driverRideState !== "idle") {
      setPulseMarkers([]);
      return;
    }
    const center = userLocation || { lat: 52.3676, lon: 4.9041 };
    const offsets: LatLon[] = [
      { lat: center.lat + 0.008, lon: center.lon + 0.005 },
      { lat: center.lat - 0.006, lon: center.lon + 0.009 },
      { lat: center.lat + 0.004, lon: center.lon - 0.007 },
      { lat: center.lat - 0.009, lon: center.lon - 0.004 },
      { lat: center.lat + 0.011, lon: center.lon + 0.012 },
    ];
    setPulseMarkers(offsets);
  }, [isDriverMode, driverOnline, driverRideState, userLocation]);

  // ── GPS auto-detect ──
  useEffect(() => {
    if (!navigator.geolocation) {
      setGpsError(true);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const loc = { lat: pos.coords.latitude, lon: pos.coords.longitude };
        setUserLocation(loc);
        setLocationAccuracy(pos.coords.accuracy);
        fetch(
          `https://nominatim.openstreetmap.org/reverse?lat=${loc.lat}&lon=${loc.lon}&format=json`,
        )
          .then((r) => r.json())
          .then((data) => {
            const addr = data.address;
            const label = [
              addr.road,
              addr.house_number,
              addr.city || addr.town || addr.village,
            ]
              .filter(Boolean)
              .join(", ");
            setPickupText(
              label ||
                data.display_name?.split(",").slice(0, 2).join(",") ||
                "Mevcut Konum",
            );
            setPickupCoords(loc);
          })
          .catch(() => {
            setPickupText("Mevcut Konum");
            setPickupCoords(loc);
          });
      },
      () => setGpsError(true),
      { enableHighAccuracy: true, timeout: 10000 },
    );
  }, []);

  // ── Generate drivers ──
  useEffect(() => {
    if (userLocation) setDrivers(randomDrivers(userLocation));
  }, [userLocation]);

  // ── Nominatim pickup search ──
  useEffect(() => {
    if (!dPickupQuery || dPickupQuery.length < 3) {
      setPickupResults([]);
      return;
    }
    fetch(
      `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(dPickupQuery)}&format=json&limit=5`,
    )
      .then((r) => r.json())
      .then(setPickupResults)
      .catch(() => setPickupResults([]));
  }, [dPickupQuery]);

  // ── Nominatim dest search ──
  useEffect(() => {
    if (!dDestQuery || dDestQuery.length < 3) {
      setDestResults([]);
      return;
    }
    fetch(
      `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(dDestQuery)}&format=json&limit=5`,
    )
      .then((r) => r.json())
      .then(setDestResults)
      .catch(() => setDestResults([]));
  }, [dDestQuery]);

  // ── Calc distance ──
  useEffect(() => {
    if (pickupCoords && destCoords) {
      setDistanceKm(haversineKm(pickupCoords, destCoords));
      setRideState("selecting");
      setPanelExpanded(true);
    }
  }, [pickupCoords, destCoords]);

  // ── Animate drivers ──
  useEffect(() => {
    if (rideState !== "driver_arriving" && rideState !== "trip_started") return;
    const interval = setInterval(() => {
      setDrivers((prev) =>
        prev.map((d) => {
          if (!assignedDriver || d.id !== assignedDriver.id) return d;
          const target =
            rideState === "driver_arriving" ? pickupCoords : destCoords;
          if (!target) return d;
          return {
            ...d,
            lat: d.lat + (target.lat - d.lat) * 0.05,
            lon: d.lon + (target.lon - d.lon) * 0.05,
          };
        }),
      );
    }, 2000);
    return () => clearInterval(interval);
  }, [rideState, assignedDriver, pickupCoords, destCoords]);

  // ── ETA countdown (passenger) ──
  useEffect(() => {
    if (rideState !== "driver_arriving") return;
    setDriverEta(3);
    const interval = setInterval(() => {
      setDriverEta((prev) => {
        if (prev <= 1) {
          setRideState("trip_started");
          return 0;
        }
        return prev - 1;
      });
    }, 3000);
    return () => clearInterval(interval);
  }, [rideState]);

  // ── Incoming ride countdown (12s) ──
  useEffect(() => {
    if (!incomingRide) return;
    setCountdown(12);
    const interval = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          setIncomingRide(null);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [incomingRide]);

  // ── Simulate incoming ride (5s after going online, re-trigger after idle) ──
  useEffect(() => {
    if (!driverOnline || !isDriverMode || driverRideState !== "idle") return;
    const t = setTimeout(() => {
      setIncomingRide({
        passengerID: "+777 5544 2211",
        pickup: "Damrak 21, Amsterdam",
        destination: "Schiphol Airport",
        distance: "18.2 km",
        fare: isTurkey ? "₺195" : "€28.50",
      });
    }, 5000);
    return () => clearTimeout(t);
  }, [driverOnline, isDriverMode, driverRideState]);

  // ── Fare meter (driver trip_started) ──
  useEffect(() => {
    if (driverRideState !== "trip_started") return;
    const interval = setInterval(() => {
      setFareMeter((prev) => prev + (isTurkey ? 0.4 : 0.05));
      setTripSeconds((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [driverRideState]);

  // ── Wait timer (arrived_at_pickup) ──
  useEffect(() => {
    if (driverRideState !== "arrived_at_pickup") {
      setWaitSeconds(0);
      return;
    }
    const interval = setInterval(() => {
      setWaitSeconds((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [driverRideState]);

  // ─── PASSENGER HANDLERS ───────────────────────────────────────────────────

  const handleConfirmRide = useCallback(() => {
    setRideState("matching");
    setTimeout(() => {
      const closest = drivers[Math.floor(Math.random() * drivers.length)];
      setAssignedDriver(closest);
      setRideState("driver_assigned");
      setTimeout(() => setRideState("driver_arriving"), 2000);
    }, 3000);
  }, [drivers]);

  const handleCancelRide = useCallback(() => {
    setRideState("idle");
    setAssignedDriver(null);
    setDestText("");
    setDestCoords(null);
    setPanelExpanded(false);
  }, []);

  const handleTripComplete = useCallback(() => {
    setRideState("completed");
  }, []);

  const handleRateAndFinish = useCallback(() => {
    setRideState("idle");
    setAssignedDriver(null);
    setDestText("");
    setDestCoords(null);
    setPanelExpanded(false);
  }, []);

  // ─── DRIVER HANDLERS ──────────────────────────────────────────────────────

  const handleAcceptRide = useCallback(() => {
    setIncomingRide(null);
    setDriverRideState("going_to_pickup");
  }, []);

  const handleRejectRide = useCallback(() => {
    setIncomingRide(null);
  }, []);

  const handleDriverArrived = useCallback(() => {
    setDriverRideState("arrived_at_pickup");
  }, []);

  const handleStartRide = useCallback(() => {
    setFareMeter(0);
    setTripSeconds(0);
    setDriverRideState("trip_started");
  }, []);

  const handleEndRide = useCallback(() => {
    setDriverRideState("trip_completed");
    setShowPaymentReceipt(true);
  }, []);

  const handlePaymentContinue = useCallback(() => {
    setShowPaymentReceipt(false);
    setShowDriverRating(true);
  }, []);

  const handleDriverRatingFinish = useCallback(() => {
    setShowDriverRating(false);
    setDriverRideState("idle");
    setDriverPassengerRating(5);
    setFareMeter(0);
    setTripSeconds(0);
    const bonus = isTurkey ? 195 : 28.5;
    setDriverEarningsToday((prev) => prev + bonus);
    setDriverRidesCountToday((prev) => prev + 1);
  }, []);

  // ─── COMPUTED ─────────────────────────────────────────────────────────────

  const bounds: [LatLon, LatLon] | null =
    pickupCoords && destCoords ? [pickupCoords, destCoords] : null;

  const selectedOption = RIDE_OPTIONS.find((o) => o.id === selectedRide)!;
  const price =
    distanceKm > 0 ? calcPrice(selectedOption, distanceKm, surgeMultiplier) : 0;

  const baseFare = isTurkey ? 195 : 28.5;
  const totalFare = baseFare + fareMeter;
  const tripMinutes = Math.round(tripSeconds / 60);

  // ─── RENDER ───────────────────────────────────────────────────────────────

  return (
    <div
      className="relative w-full h-full bg-[#0a0a0a] overflow-hidden"
      style={{ minHeight: 500 }}
    >
      {/* ── TOP BAR ── */}
      <div className="absolute top-3 right-3 z-[1000] flex items-center gap-2">
        {/* Driver status badge */}
        {isDriverMode && (
          <div
            className={`px-2.5 py-1 rounded-full text-[10px] font-bold border ${
              driverStatus === "online"
                ? "bg-[#22c55e]/20 border-[#22c55e] text-[#22c55e]"
                : driverStatus === "busy"
                  ? "bg-amber-500/20 border-amber-500 text-amber-400"
                  : "bg-[#333] border-white/20 text-white/40"
            }`}
          >
            {driverStatus === "online"
              ? "● ONLİNE"
              : driverStatus === "busy"
                ? "◆ MEŞGUL"
                : "○ OFFLİNE"}
          </div>
        )}
        <button
          type="button"
          onClick={() => setIsDriverMode((v) => !v)}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${
            isDriverMode
              ? "bg-[#00D4FF]/20 border-[#00D4FF] text-[#00D4FF] shadow-[0_0_12px_rgba(0,212,255,0.4)]"
              : "bg-[#1a1a1a] border-white/10 text-white/60"
          }`}
          data-ocid="ride.toggle"
        >
          <Car size={12} />
          {isDriverMode ? "Sürücü Modu" : "Yolcu"}
        </button>
      </div>

      {/* ── MAP ── */}
      <div className="w-full h-full">
        <MapContainer
          center={[mapCenter.lat, mapCenter.lon]}
          zoom={14}
          style={{ height: "100%", width: "100%" }}
          zoomControl={false}
        >
          <TileLayer
            url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
          />
          <MapController center={userLocation} bounds={bounds} />

          {/* User location */}
          {userLocation && (
            <Marker
              position={[userLocation.lat, userLocation.lon]}
              icon={L.divIcon({
                html: `<div style="width:20px;height:20px;border-radius:50%;background:#00D4FF;border:3px solid white;box-shadow:0 0 12px #00D4FF"></div>`,
                className: "",
                iconSize: [20, 20],
                iconAnchor: [10, 10],
              })}
            />
          )}

          {/* Pickup marker */}
          {pickupCoords && pickupCoords !== userLocation && (
            <Marker
              position={[pickupCoords.lat, pickupCoords.lon]}
              icon={pinIcon("#22c55e")}
            />
          )}

          {/* Destination marker */}
          {destCoords && (
            <Marker
              position={[destCoords.lat, destCoords.lon]}
              icon={pinIcon("#f97316")}
            />
          )}

          {/* Route line */}
          {pickupCoords && destCoords && (
            <Polyline
              positions={[
                [pickupCoords.lat, pickupCoords.lon],
                [destCoords.lat, destCoords.lon],
              ]}
              color="#00D4FF"
              opacity={0.8}
              weight={4}
              dashArray="8 4"
            />
          )}

          {/* Driver markers */}
          {drivers.map((d) => (
            <Marker
              key={d.id}
              position={[d.lat, d.lon]}
              icon={carIcon(d.type)}
            />
          ))}

          {/* Pulsing ride request markers (driver online & idle) */}
          {pulseMarkers.map((m) => (
            <Marker
              key={`pulse-${m.lat.toFixed(5)}-${m.lon.toFixed(5)}`}
              position={[m.lat, m.lon]}
              icon={pulseIcon()}
            />
          ))}
        </MapContainer>
      </div>

      {/* ── RIDE STATUS BANNER (passenger) ── */}
      {!isDriverMode &&
        rideState !== "idle" &&
        rideState !== "selecting" &&
        rideState !== "completed" && (
          <div className="absolute top-3 left-1/2 -translate-x-1/2 z-[1000] bg-[#1a1a1a]/90 border border-white/10 rounded-full px-4 py-1.5 text-xs text-white/80 flex items-center gap-2 backdrop-blur-sm">
            {rideState === "matching" && (
              <Loader2 size={12} className="animate-spin text-[#00D4FF]" />
            )}
            {rideState === "matching" && "Sürücü aranıyor..."}
            {rideState === "driver_assigned" && (
              <CheckCircle size={12} className="text-green-400" />
            )}
            {rideState === "driver_assigned" && "Sürücü atandı!"}
            {rideState === "driver_arriving" && (
              <Car size={12} className="text-[#00D4FF]" />
            )}
            {rideState === "driver_arriving" &&
              `Sürücü geliyor • ${driverEta} dk`}
            {rideState === "trip_started" && (
              <Navigation size={12} className="text-[#00D4FF]" />
            )}
            {rideState === "trip_started" && "Yolculuk başladı"}
            {rideState === "confirming" && "Sürüş onaylanıyor..."}
          </div>
        )}

      {/* ════════════════════════════════════════════════════════════════
          PASSENGER BOTTOM PANEL
      ════════════════════════════════════════════════════════════════ */}
      {!isDriverMode && rideState !== "completed" && (
        <div
          className="absolute bottom-0 left-0 right-0 z-[900] transition-all duration-300"
          style={{ maxHeight: panelExpanded ? "75%" : "220px" }}
        >
          <div
            className="bg-[#111] border-t border-white/10 rounded-t-2xl shadow-2xl overflow-y-auto"
            style={{ maxHeight: "inherit" }}
          >
            <button
              type="button"
              aria-label="Toggle panel"
              className="flex justify-center w-full pt-3 pb-1 cursor-pointer"
              onClick={() => setPanelExpanded((v) => !v)}
            >
              <div className="w-10 h-1 rounded-full bg-white/20" />
            </button>

            <div className="px-4 pb-4 space-y-3">
              {/* GPS error */}
              {gpsError && !pickupCoords && (
                <div className="flex items-center gap-2 text-amber-400 text-xs bg-amber-400/10 rounded-xl px-3 py-2">
                  <MapPin size={12} />
                  <span>GPS erişimi reddedildi. Konumunu manuel seç.</span>
                </div>
              )}

              {/* Accuracy warning */}
              {locationAccuracy > 100 && (
                <div className="flex items-center gap-2 text-amber-400 text-xs bg-amber-400/10 rounded-xl px-3 py-2">
                  <MapPin size={12} />
                  <span>
                    Konumunu doğrula — düşük GPS hassasiyeti (
                    {Math.round(locationAccuracy)}m)
                  </span>
                </div>
              )}

              {/* PICKUP INPUT */}
              <div className="relative">
                <div className="flex items-center gap-2 bg-[#1a1a1a] border border-white/10 rounded-xl px-3 py-2.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-[#22c55e] flex-shrink-0" />
                  <input
                    type="text"
                    value={pickupText}
                    onChange={(e) => {
                      setPickupText(e.target.value);
                      setPickupQuery(e.target.value);
                      setActiveInput("pickup");
                    }}
                    onFocus={() => setActiveInput("pickup")}
                    placeholder="Nereden? (Pickup)"
                    className="flex-1 bg-transparent text-white text-sm outline-none placeholder:text-white/30"
                    data-ocid="ride.input"
                  />
                  {pickupCoords && (
                    <button
                      type="button"
                      onClick={() => {
                        setPickupText("");
                        setPickupCoords(null);
                        setPickupQuery("");
                      }}
                      className="text-white/30 hover:text-white/60"
                    >
                      <X size={12} />
                    </button>
                  )}
                </div>
                {activeInput === "pickup" && pickupResults.length > 0 && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-[#1a1a1a] border border-white/10 rounded-xl overflow-hidden z-50 shadow-xl">
                    {pickupResults.map((r) => (
                      <button
                        type="button"
                        key={r.place_id}
                        className="w-full text-left px-3 py-2.5 text-xs text-white/70 hover:bg-white/5 border-b border-white/5 last:border-0 flex items-center gap-2"
                        onClick={() => {
                          setPickupText(
                            r.display_name.split(",").slice(0, 2).join(","),
                          );
                          setPickupCoords({
                            lat: Number.parseFloat(r.lat),
                            lon: Number.parseFloat(r.lon),
                          });
                          setPickupQuery("");
                          setPickupResults([]);
                          setActiveInput(null);
                        }}
                      >
                        <MapPin
                          size={10}
                          className="text-[#00D4FF] flex-shrink-0"
                        />
                        {r.display_name.split(",").slice(0, 3).join(",")}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Quick shortcuts */}
              <div className="flex gap-2">
                {[
                  {
                    icon: <Home size={10} />,
                    label: "Ev",
                    addr: "Home, Amsterdam",
                    lat: (userLocation?.lat || 52.37) + 0.01,
                    lon: (userLocation?.lon || 4.9) + 0.008,
                  },
                  {
                    icon: <Briefcase size={10} />,
                    label: "İş",
                    addr: "Office, Amsterdam",
                    lat: (userLocation?.lat || 52.37) - 0.012,
                    lon: (userLocation?.lon || 4.9) + 0.015,
                  },
                  {
                    icon: <Heart size={10} />,
                    label: "Favori",
                    addr: "Favorite Place",
                    lat: (userLocation?.lat || 52.37) + 0.02,
                    lon: (userLocation?.lon || 4.9) - 0.01,
                  },
                ].map((s) => (
                  <button
                    type="button"
                    key={s.label}
                    onClick={() => {
                      setDestText(s.addr);
                      setDestCoords({ lat: s.lat, lon: s.lon });
                    }}
                    className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#1a1a1a] border border-white/10 text-white/50 text-xs hover:border-[#00D4FF]/40 hover:text-white/80 transition-all"
                  >
                    {s.icon}
                    {s.label}
                  </button>
                ))}
              </div>

              {/* DESTINATION INPUT */}
              <div className="relative">
                <div className="flex items-center gap-2 bg-[#1a1a1a] border border-white/10 rounded-xl px-3 py-2.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-[#f97316] flex-shrink-0" />
                  <input
                    type="text"
                    value={destText}
                    onChange={(e) => {
                      setDestText(e.target.value);
                      setDestQuery(e.target.value);
                      setActiveInput("dest");
                    }}
                    onFocus={() => setActiveInput("dest")}
                    placeholder="Nereye? (Destination)"
                    className="flex-1 bg-transparent text-white text-sm outline-none placeholder:text-white/30"
                    data-ocid="ride.search_input"
                  />
                  {destCoords && (
                    <button
                      type="button"
                      onClick={() => {
                        setDestText("");
                        setDestCoords(null);
                        setDestQuery("");
                        setRideState("idle");
                        setPanelExpanded(false);
                      }}
                      className="text-white/30 hover:text-white/60"
                    >
                      <X size={12} />
                    </button>
                  )}
                </div>
                {activeInput === "dest" && destResults.length > 0 && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-[#1a1a1a] border border-white/10 rounded-xl overflow-hidden z-50 shadow-xl">
                    {destResults.map((r) => (
                      <button
                        type="button"
                        key={r.place_id}
                        className="w-full text-left px-3 py-2.5 text-xs text-white/70 hover:bg-white/5 border-b border-white/5 last:border-0 flex items-center gap-2"
                        onClick={() => {
                          setDestText(
                            r.display_name.split(",").slice(0, 2).join(","),
                          );
                          setDestCoords({
                            lat: Number.parseFloat(r.lat),
                            lon: Number.parseFloat(r.lon),
                          });
                          setDestQuery("");
                          setDestResults([]);
                          setActiveInput(null);
                        }}
                      >
                        <MapPin
                          size={10}
                          className="text-[#f97316] flex-shrink-0"
                        />
                        {r.display_name.split(",").slice(0, 3).join(",")}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Ride Options */}
              {(rideState === "selecting" || rideState === "confirming") &&
                panelExpanded && (
                  <>
                    <div className="flex items-center justify-between text-xs text-white/50 px-1">
                      <span>📍 {distanceKm.toFixed(1)} km</span>
                      <span>⏱ ~{Math.round(distanceKm * 2)} dk</span>
                      {surgeMultiplier > 1 && (
                        <span className="text-orange-400">
                          ⚡ Yoğun talep ×{surgeMultiplier}
                        </span>
                      )}
                    </div>

                    <div className="space-y-2">
                      {RIDE_OPTIONS.map((opt) => {
                        const p = calcPrice(opt, distanceKm, surgeMultiplier);
                        return (
                          <button
                            type="button"
                            key={opt.id}
                            onClick={() => setSelectedRide(opt.id)}
                            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl border transition-all ${
                              selectedRide === opt.id
                                ? "bg-[#00D4FF]/10 border-[#00D4FF]/60 shadow-[0_0_12px_rgba(0,212,255,0.2)]"
                                : "bg-[#1a1a1a] border-white/10 hover:border-white/20"
                            }`}
                            data-ocid={`ride.${opt.id}.button`}
                          >
                            <span className="text-xl">{opt.icon}</span>
                            <div className="flex-1 text-left">
                              <div className="text-sm font-semibold text-white">
                                {opt.label}
                              </div>
                              <div className="text-xs text-white/40">
                                {opt.etaMin}–{opt.etaMin + 2} dk
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="text-sm font-bold text-white">
                                {currency.symbol}
                                {p.toFixed(2)}
                              </div>
                              <div className="text-xs text-white/40">
                                {currency.code}
                              </div>
                            </div>
                          </button>
                        );
                      })}
                    </div>

                    <div className="flex gap-2">
                      {[
                        { id: "wallet" as PaymentMethod, label: "💰 Cüzdan" },
                        { id: "card" as PaymentMethod, label: "💳 Kart" },
                        { id: "cash" as PaymentMethod, label: "💵 Nakit" },
                      ].map((pm) => (
                        <button
                          type="button"
                          key={pm.id}
                          onClick={() => setPaymentMethod(pm.id)}
                          className={`flex-1 py-1.5 rounded-lg text-xs border transition-all ${
                            paymentMethod === pm.id
                              ? "bg-[#00D4FF]/10 border-[#00D4FF]/60 text-[#00D4FF]"
                              : "bg-[#1a1a1a] border-white/10 text-white/50"
                          }`}
                          data-ocid={`ride.${pm.id}.toggle`}
                        >
                          {pm.label}
                        </button>
                      ))}
                    </div>

                    <button
                      type="button"
                      onClick={handleConfirmRide}
                      className="w-full py-3.5 rounded-xl bg-[#00D4FF] text-[#0a0a0a] font-bold text-sm shadow-[0_0_20px_rgba(0,212,255,0.5)] hover:shadow-[0_0_28px_rgba(0,212,255,0.7)] transition-all active:scale-[0.98]"
                      data-ocid="ride.primary_button"
                    >
                      🚗 Ride çağır — {currency.symbol}
                      {price.toFixed(2)}
                    </button>
                  </>
                )}

              {/* Driver Info Card (during trip) */}
              {(rideState === "driver_assigned" ||
                rideState === "driver_arriving" ||
                rideState === "trip_started") &&
                assignedDriver && (
                  <div className="bg-[#1a1a1a] border border-white/10 rounded-2xl p-3 space-y-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-[#00D4FF]/20 flex items-center justify-center text-lg">
                        👤
                      </div>
                      <div className="flex-1">
                        <div className="text-sm font-semibold text-white">
                          {assignedDriver.name}
                        </div>
                        <div className="text-xs text-white/40">
                          {assignedDriver.car} • {assignedDriver.plate}
                        </div>
                      </div>
                      <div className="flex items-center gap-1 text-yellow-400 text-xs">
                        <Star size={10} fill="currentColor" />
                        {assignedDriver.rating.toFixed(1)}
                      </div>
                    </div>
                    {rideState === "driver_arriving" && (
                      <div className="text-xs text-[#00D4FF] text-center">
                        {driverEta > 0
                          ? `${driverEta} dakika sonra burada`
                          : "Sürücü yaklaşıyor..."}
                      </div>
                    )}
                    {rideState === "trip_started" && (
                      <div className="text-xs text-green-400 text-center">
                        🚀 Yolculuk devam ediyor
                      </div>
                    )}
                    <div className="flex gap-2">
                      <button
                        type="button"
                        className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl bg-[#252525] border border-white/10 text-white/60 text-xs hover:bg-white/5 transition-all"
                        data-ocid="ride.secondary_button"
                      >
                        <Phone size={12} /> Ara
                      </button>
                      <button
                        type="button"
                        className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl bg-[#252525] border border-white/10 text-white/60 text-xs hover:bg-white/5 transition-all"
                        data-ocid="ride.secondary_button"
                      >
                        <MessageCircle size={12} /> Yaz
                      </button>
                      {rideState === "trip_started" && (
                        <button
                          type="button"
                          onClick={handleTripComplete}
                          className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl bg-green-500/20 border border-green-500/40 text-green-400 text-xs hover:bg-green-500/30 transition-all"
                          data-ocid="ride.confirm_button"
                        >
                          <CheckCircle size={12} /> Tamamla
                        </button>
                      )}
                      {rideState !== "trip_started" && (
                        <button
                          type="button"
                          onClick={handleCancelRide}
                          className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl bg-red-500/20 border border-red-500/40 text-red-400 text-xs hover:bg-red-500/30 transition-all"
                          data-ocid="ride.cancel_button"
                        >
                          <X size={12} /> İptal
                        </button>
                      )}
                    </div>
                  </div>
                )}

              {/* Matching spinner */}
              {rideState === "matching" && (
                <div className="flex flex-col items-center py-6 gap-3">
                  <Loader2 size={32} className="animate-spin text-[#00D4FF]" />
                  <p className="text-white/60 text-sm">Sürücü aranıyor...</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════════
          PASSENGER COMPLETED / RATING
      ════════════════════════════════════════════════════════════════ */}
      {!isDriverMode && rideState === "completed" && (
        <div className="absolute inset-0 z-[1100] bg-[#0a0a0a]/95 flex flex-col items-center justify-center gap-6 px-6">
          <div className="text-5xl">🎉</div>
          <h2 className="text-xl font-bold text-white">Yolculuk Tamamlandı!</h2>
          <p className="text-white/50 text-sm text-center">
            Toplam: {currency.symbol}
            {price.toFixed(2)} — {distanceKm.toFixed(1)} km
          </p>
          <div className="flex gap-2">
            {[1, 2, 3, 4, 5].map((s) => (
              <button type="button" key={s} onClick={() => setRating(s)}>
                <Star
                  size={28}
                  className={
                    s <= rating
                      ? "text-yellow-400 fill-yellow-400"
                      : "text-white/20"
                  }
                />
              </button>
            ))}
          </div>
          <p className="text-white/40 text-xs">Sürücüyü değerlendir</p>
          <button
            type="button"
            onClick={handleRateAndFinish}
            className="px-8 py-3 rounded-xl bg-[#00D4FF] text-[#0a0a0a] font-bold text-sm shadow-[0_0_20px_rgba(0,212,255,0.5)]"
            data-ocid="ride.primary_button"
          >
            Tamam
          </button>
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════════
          DRIVER BOTTOM DASHBOARD
      ════════════════════════════════════════════════════════════════ */}
      {isDriverMode && (
        <div className="absolute bottom-0 left-0 right-0 z-[900] bg-[#111] border-t border-white/10 rounded-t-2xl shadow-2xl">
          {/* Drag handle */}
          <div className="flex justify-center pt-3 pb-1">
            <div className="w-10 h-1 rounded-full bg-white/20" />
          </div>

          {/* Tab bar */}
          <div className="flex items-center gap-1 px-3 pb-2">
            {(
              [
                { id: "gorev", label: "🗺️ Görev" },
                { id: "kazanc", label: "📊 Kazanç" },
                { id: "guvenlik", label: "🛡️ Güvenlik" },
                { id: "ai", label: "🤖 AI" },
              ] as { id: DriverTab; label: string }[]
            ).map((tab) => (
              <button
                type="button"
                key={tab.id}
                onClick={() => setDriverTab(tab.id)}
                className={`flex-1 py-1.5 rounded-lg text-[10px] font-semibold transition-all ${
                  driverTab === tab.id
                    ? "bg-[#00D4FF]/15 text-[#00D4FF] border border-[#00D4FF]/30"
                    : "text-white/40 hover:text-white/60"
                }`}
                data-ocid={`ride.${tab.id}.tab`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* ── TAB: GÖREV ── */}
          {driverTab === "gorev" && (
            <div
              className="px-4 pb-5 space-y-3"
              style={{ maxHeight: 360, overflowY: "auto" }}
            >
              {/* Online toggle */}
              <div className="flex items-center justify-between bg-[#1a1a1a] border border-white/10 rounded-xl px-3 py-2.5">
                <div>
                  <p className="text-white text-sm font-semibold">
                    {driverOnline ? "Çevrimiçi" : "Çevrimdışı"}
                  </p>
                  <p className="text-white/40 text-xs">
                    {driverOnline
                      ? driverRideState === "idle"
                        ? "Yolcu bekleniyor..."
                        : driverRideState === "going_to_pickup"
                          ? "Yolcuya gidiliyor"
                          : driverRideState === "arrived_at_pickup"
                            ? "Yolcu bekleniyor"
                            : driverRideState === "trip_started"
                              ? "Yolda"
                              : "Tamamlandı"
                      : "Müsait değil"}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setDriverOnline((v) => !v);
                    if (driverOnline) setDriverRideState("idle");
                  }}
                  className={`relative w-14 h-7 rounded-full transition-all ${
                    driverOnline
                      ? "bg-[#22c55e] shadow-[0_0_12px_rgba(34,197,94,0.5)]"
                      : "bg-[#333]"
                  }`}
                  data-ocid="ride.toggle"
                >
                  <div
                    className={`absolute top-1 w-5 h-5 rounded-full bg-white shadow transition-all ${
                      driverOnline ? "left-8" : "left-1"
                    }`}
                  />
                </button>
              </div>

              {/* Earnings summary row */}
              {driverOnline && (
                <div className="flex items-center gap-2 bg-[#1a1a1a] border border-white/10 rounded-xl px-3 py-2">
                  <TrendingUp size={14} className="text-[#00D4FF]" />
                  <span className="text-xs text-white/60">Bugün:</span>
                  <span className="text-sm font-bold text-white">
                    {currency.symbol}
                    {driverEarningsToday.toFixed(0)}
                  </span>
                  <span className="text-xs text-white/40 ml-auto">
                    {driverRidesCountToday} sürüş
                  </span>
                </div>
              )}

              {/* STATE: idle — waiting */}
              {driverOnline && driverRideState === "idle" && (
                <div className="flex flex-col items-center py-4 gap-2">
                  <div className="flex gap-1">
                    <div
                      className="w-2 h-2 rounded-full bg-[#00D4FF] animate-bounce"
                      style={{ animationDelay: "0s" }}
                    />
                    <div
                      className="w-2 h-2 rounded-full bg-[#00D4FF] animate-bounce"
                      style={{ animationDelay: "0.15s" }}
                    />
                    <div
                      className="w-2 h-2 rounded-full bg-[#00D4FF] animate-bounce"
                      style={{ animationDelay: "0.3s" }}
                    />
                  </div>
                  <p className="text-white/50 text-sm">Yolcu bekleniyor...</p>
                </div>
              )}

              {/* STATE: going_to_pickup */}
              {driverRideState === "going_to_pickup" && (
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <div className="px-2 py-0.5 rounded-full bg-[#00D4FF]/20 border border-[#00D4FF]/40 text-[#00D4FF] text-[10px] font-bold">
                      Yolcuya gidiliyor
                    </div>
                  </div>
                  <div className="bg-[#1a1a1a] border border-white/10 rounded-xl p-3 space-y-2">
                    <div className="flex items-start gap-2">
                      <MapPin
                        size={12}
                        className="text-[#22c55e] mt-0.5 flex-shrink-0"
                      />
                      <div>
                        <p className="text-[10px] text-white/40">Pickup</p>
                        <p className="text-xs text-white">
                          Damrak 21, Amsterdam
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <MapPin
                        size={12}
                        className="text-[#f97316] mt-0.5 flex-shrink-0"
                      />
                      <div>
                        <p className="text-[10px] text-white/40">Hedef</p>
                        <p className="text-xs text-white">Schiphol Airport</p>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <a
                      href="https://maps.google.com/?q=Damrak+21+Amsterdam"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-[#1a1a1a] border border-white/10 text-white/60 text-xs hover:border-[#00D4FF]/40 hover:text-[#00D4FF] transition-all"
                      data-ocid="ride.secondary_button"
                    >
                      <Navigation size={12} /> 🗺️ Navigasyonu Aç
                    </a>
                  </div>
                  <button
                    type="button"
                    onClick={handleDriverArrived}
                    className="w-full py-3.5 rounded-xl bg-[#22c55e] text-white font-bold text-sm shadow-[0_0_20px_rgba(34,197,94,0.4)] hover:shadow-[0_0_28px_rgba(34,197,94,0.6)] transition-all active:scale-[0.98]"
                    data-ocid="ride.confirm_button"
                  >
                    ✅ Yolcu Noktasına Ulaştım
                  </button>
                </div>
              )}

              {/* STATE: arrived_at_pickup */}
              {driverRideState === "arrived_at_pickup" && (
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <div className="px-2 py-0.5 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-400 text-[10px] font-bold">
                      Yolcu bekleniyor
                    </div>
                    <span className="text-xs text-white/40">
                      Pasif bekleme: {formatTime(waitSeconds)}
                    </span>
                  </div>
                  <div className="bg-[#1a1a1a] border border-white/10 rounded-xl p-3 flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-[#00D4FF]/20 flex items-center justify-center text-base">
                      👤
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-white">
                        +777 5544 2211
                      </p>
                      <p className="text-xs text-white/40">Yolcu ID</p>
                    </div>
                    <div className="flex items-center gap-1 bg-green-500/20 border border-green-500/30 rounded-full px-2 py-0.5">
                      <CheckCircle size={10} className="text-green-400" />
                      <span className="text-[10px] text-green-400">
                        Doğrulandı
                      </span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={handleStartRide}
                    className="w-full py-3.5 rounded-xl bg-[#00D4FF] text-[#0a0a0a] font-bold text-sm shadow-[0_0_20px_rgba(0,212,255,0.5)] hover:shadow-[0_0_28px_rgba(0,212,255,0.7)] transition-all active:scale-[0.98]"
                    data-ocid="ride.primary_button"
                  >
                    🚀 Yolculuğu Başlat
                  </button>
                </div>
              )}

              {/* STATE: trip_started */}
              {driverRideState === "trip_started" && (
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <div className="px-2 py-0.5 rounded-full bg-green-500/20 border border-green-500/40 text-green-400 text-[10px] font-bold animate-pulse">
                      ● Yolda
                    </div>
                  </div>
                  <div className="bg-[#1a1a1a] border border-[#00D4FF]/20 rounded-xl p-3 flex items-center justify-between">
                    <div>
                      <p className="text-[10px] text-white/40">Aktif Ücret</p>
                      <p className="text-lg font-bold text-[#00D4FF]">
                        💰 {currency.symbol}
                        {totalFare.toFixed(2)}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] text-white/40">Süre</p>
                      <p className="text-sm text-white/80">
                        {formatTime(tripSeconds)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-white/50 bg-[#1a1a1a] rounded-xl px-3 py-2">
                    <MapPin size={10} className="text-[#f97316]" />
                    18.2 km → Schiphol Airport
                  </div>
                  <button
                    type="button"
                    onClick={handleEndRide}
                    className="w-full py-3.5 rounded-xl bg-[#ef4444] text-white font-bold text-sm shadow-[0_0_20px_rgba(239,68,68,0.4)] hover:shadow-[0_0_28px_rgba(239,68,68,0.6)] transition-all active:scale-[0.98]"
                    data-ocid="ride.delete_button"
                  >
                    🏁 Yolculuğu Sonlandır
                  </button>
                </div>
              )}

              {/* Offline message */}
              {!driverOnline && (
                <div className="flex flex-col items-center py-6 gap-3 text-center">
                  <div className="text-3xl">🔌</div>
                  <p className="text-white/40 text-sm">
                    Yolcu almak için çevrimiçi olun
                  </p>
                </div>
              )}
            </div>
          )}

          {/* ── TAB: KAZANÇ ── */}
          {driverTab === "kazanc" && (
            <div
              className="px-4 pb-5 space-y-3"
              style={{ maxHeight: 360, overflowY: "auto" }}
            >
              {/* Stats */}
              <div className="grid grid-cols-2 gap-2">
                <div className="bg-[#1a1a1a] border border-white/10 rounded-xl p-3">
                  <p className="text-[10px] text-white/40">Bugün</p>
                  <p className="text-base font-bold text-white">
                    {currency.symbol}
                    {driverEarningsToday.toFixed(0)}
                  </p>
                  <p className="text-[10px] text-[#00D4FF]">
                    {driverRidesCountToday} sürüş
                  </p>
                </div>
                <div className="bg-[#1a1a1a] border border-white/10 rounded-xl p-3">
                  <p className="text-[10px] text-white/40">Bu Hafta</p>
                  <p className="text-base font-bold text-white">
                    {currency.symbol}
                    {isTurkey ? "1.480" : "210"}
                  </p>
                  <p className="text-[10px] text-[#00D4FF]">23 sürüş</p>
                </div>
              </div>

              {/* Rating */}
              <div className="flex items-center gap-2 bg-[#1a1a1a] border border-white/10 rounded-xl px-3 py-2">
                <Star
                  size={14}
                  className="text-yellow-400"
                  fill="currentColor"
                />
                <span className="text-sm font-bold text-white">4.8</span>
                <span className="text-xs text-white/40">
                  / 5.0 ortalama puan
                </span>
              </div>

              {/* Ride history */}
              <p className="text-[10px] text-white/40 font-semibold uppercase tracking-wider">
                Son Sürüşler
              </p>
              <div className="space-y-1.5">
                {MOCK_RIDE_HISTORY.map((ride, idx) => (
                  <div
                    key={`${ride.id}-${ride.time}`}
                    className="flex items-center gap-2 bg-[#1a1a1a] border border-white/5 rounded-xl px-3 py-2"
                    data-ocid={`ride.item.${idx + 1}`}
                  >
                    <Car size={12} className="text-[#00D4FF] flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-white truncate">{ride.id}</p>
                      <p className="text-[10px] text-white/40">{ride.dest}</p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-xs font-bold text-white">
                        {currency.symbol}
                        {ride.fare}
                      </p>
                      <p className="text-[10px] text-white/40">{ride.km}km</p>
                    </div>
                    <div className="flex items-center gap-0.5 text-yellow-400 text-[10px] flex-shrink-0">
                      <Star size={8} fill="currentColor" />
                      {ride.rating}
                    </div>
                    <span className="text-[10px] text-white/30 flex-shrink-0">
                      {ride.time}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── TAB: GÜVENLİK ── */}
          {driverTab === "guvenlik" && (
            <div
              className="px-4 pb-5 space-y-3"
              style={{ maxHeight: 360, overflowY: "auto" }}
            >
              {/* Passenger info */}
              <div className="bg-[#1a1a1a] border border-white/10 rounded-xl p-3 space-y-2">
                <p className="text-[10px] text-white/40 uppercase tracking-wider">
                  Aktif Yolcu
                </p>
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-[#00D4FF]/20 flex items-center justify-center text-base">
                    👤
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold text-white">
                        +777 5544 2211
                      </p>
                      <div className="flex items-center gap-1 bg-green-500/20 border border-green-500/30 rounded-full px-1.5 py-0.5">
                        <CheckCircle size={8} className="text-green-400" />
                        <span className="text-[9px] text-green-400">
                          Doğrulandı
                        </span>
                      </div>
                    </div>
                    <p className="text-xs text-white/40">
                      Güven Skoru:{" "}
                      <span className="text-[#00D4FF]">94/100</span>
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-xs text-white/50">
                  <CheckCircle size={10} className="text-green-400" />
                  22 başarılı sürüş
                </div>
              </div>

              {/* SOS Button */}
              <button
                type="button"
                onClick={() => setShowSosModal(true)}
                className="w-full py-3.5 rounded-xl bg-[#ef4444]/20 border border-[#ef4444]/60 text-[#ef4444] font-bold text-sm flex items-center justify-center gap-2 hover:bg-[#ef4444]/30 transition-all"
                data-ocid="ride.delete_button"
              >
                <AlertTriangle size={16} /> 🚨 Acil Durum (SOS)
              </button>

              {/* Share trip */}
              <button
                type="button"
                onClick={() => alert("Sürüş bağlantısı kopyalandı!")}
                className="w-full py-3 rounded-xl bg-[#1a1a1a] border border-white/10 text-white/60 text-sm flex items-center justify-center gap-2 hover:border-[#00D4FF]/40 hover:text-[#00D4FF] transition-all"
                data-ocid="ride.secondary_button"
              >
                <Shield size={14} /> 🔗 Sürüşü Paylaş
              </button>

              {/* Safety tip */}
              <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl px-3 py-2.5">
                <p className="text-[10px] text-amber-400 font-semibold mb-1">
                  💡 Güvenlik İpucu
                </p>
                <p className="text-xs text-white/50">
                  Her zaman aydınlık alanlarda buluşun ve yolculuğu paylaşın.
                </p>
              </div>
            </div>
          )}

          {/* ── TAB: AI ── */}
          {driverTab === "ai" && (
            <div
              className="px-4 pb-5 space-y-3"
              style={{ maxHeight: 360, overflowY: "auto" }}
            >
              {/* Demand zones */}
              <p className="text-[10px] text-white/40 uppercase tracking-wider">
                Talep Bölgeleri
              </p>
              {[
                {
                  level: "🔥 YÜKSEK TALEP",
                  zone: "Schiphol Çevresi",
                  count: "23 aktif talep",
                  earn: isTurkey ? "₺280–420/saat" : "€40–60/saat",
                  color: "#ef4444",
                  borderColor: "rgba(239,68,68,0.3)",
                  bg: "rgba(239,68,68,0.08)",
                },
                {
                  level: "⚡ ORTA TALEP",
                  zone: "Amsterdam Centrum",
                  count: "12 aktif talep",
                  earn: isTurkey ? "₺175–245/saat" : "€25–35/saat",
                  color: "#f59e0b",
                  borderColor: "rgba(245,158,11,0.3)",
                  bg: "rgba(245,158,11,0.08)",
                },
                {
                  level: "📍 DÜŞÜK TALEP",
                  zone: "Eindhoven",
                  count: "5 aktif talep",
                  earn: isTurkey ? "₺70–105/saat" : "€10–15/saat",
                  color: "#6b7280",
                  borderColor: "rgba(107,114,128,0.3)",
                  bg: "rgba(107,114,128,0.08)",
                },
              ].map((zone) => (
                <div
                  key={zone.zone}
                  className="rounded-xl p-3 space-y-1.5"
                  style={{
                    background: zone.bg,
                    border: `1px solid ${zone.borderColor}`,
                  }}
                >
                  <div className="flex items-center justify-between">
                    <span
                      className="text-[10px] font-bold"
                      style={{ color: zone.color }}
                    >
                      {zone.level}
                    </span>
                    <button
                      type="button"
                      className="text-[10px] text-white/40 hover:text-white/70 transition-colors"
                      data-ocid="ride.secondary_button"
                    >
                      Buraya Git →
                    </button>
                  </div>
                  <p className="text-sm font-semibold text-white">
                    {zone.zone}
                  </p>
                  <p className="text-[10px] text-white/50">"{zone.count}"</p>
                  <p className="text-xs" style={{ color: zone.color }}>
                    Tahmini Kazanç: {zone.earn}
                  </p>
                </div>
              ))}

              {/* Peak hours chart */}
              <div>
                <p className="text-[10px] text-white/40 uppercase tracking-wider mb-2">
                  Yoğun Saatler
                </p>
                <div className="flex items-end gap-px h-12">
                  {PEAK_HOURS_HEIGHTS.map(({ hour, height }) => {
                    const isPeak =
                      (hour >= 7 && hour <= 9) ||
                      (hour >= 12 && hour <= 14) ||
                      (hour >= 17 && hour <= 20);
                    return (
                      <div
                        key={hour}
                        className="flex-1 flex flex-col items-center justify-end"
                      >
                        <div
                          className="w-full rounded-t-sm"
                          style={{
                            height,
                            background: isPeak
                              ? "#f59e0b"
                              : "rgba(255,255,255,0.12)",
                          }}
                        />
                        {hour % 6 === 0 && (
                          <span className="text-[7px] text-white/20 mt-0.5">
                            {hour}
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* AI Tip */}
              <div className="bg-[#00D4FF]/10 border border-[#00D4FF]/20 rounded-xl p-3">
                <div className="flex items-center gap-1.5 mb-1">
                  <Zap size={12} className="text-[#00D4FF]" />
                  <span className="text-[10px] font-bold text-[#00D4FF]">
                    💡 AI Önerisi
                  </span>
                </div>
                <p className="text-xs text-white/60">
                  "Saat 17:00–19:00 arası Schiphol bölgesinde ol. Haftalık %35
                  daha fazla kazanç bekleniyor."
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════════
          INCOMING RIDE POPUP (driver)
      ════════════════════════════════════════════════════════════════ */}
      {isDriverMode && incomingRide && (
        <div
          className="absolute inset-0 z-[1200] bg-black/70 flex items-end justify-center p-4 backdrop-blur-sm"
          data-ocid="ride.modal"
        >
          <div className="w-full bg-[#111] border border-white/10 rounded-2xl p-5 space-y-4 shadow-2xl">
            {/* Header */}
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] text-white/40 mb-0.5">
                  Yeni Yolcu Talebi
                </p>
                <div className="flex items-center gap-2">
                  <p className="text-base font-bold text-white">
                    {incomingRide.passengerID}
                  </p>
                  <div className="flex items-center gap-1 bg-green-500/20 border border-green-500/30 rounded-full px-1.5 py-0.5">
                    <CheckCircle size={8} className="text-green-400" />
                    <span className="text-[9px] text-green-400">
                      Doğrulandı
                    </span>
                  </div>
                </div>
              </div>
              <div className="text-right">
                <p className="text-[#00D4FF] font-bold text-xl">
                  {incomingRide.fare}
                </p>
                <p className="text-xs text-white/40">{incomingRide.distance}</p>
              </div>
            </div>

            {/* Route info */}
            <div className="bg-[#1a1a1a] rounded-xl p-3 space-y-2">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-[#22c55e]" />
                <div>
                  <p className="text-[9px] text-white/30">Pickup</p>
                  <p className="text-xs text-white">{incomingRide.pickup}</p>
                </div>
              </div>
              <div className="ml-1 w-px h-3 bg-white/10" />
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-[#f97316]" />
                <div>
                  <p className="text-[9px] text-white/30">Hedef</p>
                  <p className="text-xs text-white">
                    {incomingRide.destination}
                  </p>
                </div>
              </div>
            </div>

            {/* Countdown bar */}
            <div className="space-y-1">
              <div className="h-1.5 bg-[#333] rounded-full overflow-hidden">
                <div
                  className="h-full bg-[#00D4FF] rounded-full transition-all duration-1000"
                  style={{ width: `${(countdown / 12) * 100}%` }}
                />
              </div>
              <p className="text-center text-white/40 text-[10px]">
                {countdown}s içinde cevaplayın
              </p>
            </div>

            {/* Buttons */}
            <div className="flex gap-3">
              <button
                type="button"
                onClick={handleRejectRide}
                className="flex-1 py-3.5 rounded-xl bg-[#ef4444]/20 border border-[#ef4444]/40 text-[#ef4444] font-semibold text-sm hover:bg-[#ef4444]/30 transition-all"
                data-ocid="ride.cancel_button"
              >
                Reddet
              </button>
              <button
                type="button"
                onClick={handleAcceptRide}
                className="flex-1 py-3.5 rounded-xl bg-[#22c55e] text-white font-bold text-sm shadow-[0_0_20px_rgba(34,197,94,0.4)] hover:shadow-[0_0_28px_rgba(34,197,94,0.6)] transition-all"
                data-ocid="ride.confirm_button"
              >
                ✓ Kabul Et
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════════
          PAYMENT RECEIPT MODAL
      ════════════════════════════════════════════════════════════════ */}
      {isDriverMode && showPaymentReceipt && (
        <div
          className="absolute inset-0 z-[1300] bg-black/80 flex items-center justify-center px-6 backdrop-blur-sm"
          data-ocid="ride.modal"
        >
          <div className="w-full bg-[#111] border border-white/10 rounded-2xl p-6 space-y-4 shadow-2xl">
            <div className="text-center space-y-1">
              <div className="text-4xl">✅</div>
              <h3 className="text-lg font-bold text-white">Ödeme Alındı!</h3>
            </div>
            <div className="bg-[#1a1a1a] border border-[#22c55e]/20 rounded-xl p-4 space-y-2">
              <div className="flex justify-between">
                <span className="text-xs text-white/40">Toplam</span>
                <span className="text-sm font-bold text-[#22c55e]">
                  {currency.symbol}
                  {totalFare.toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-xs text-white/40">Mesafe</span>
                <span className="text-xs text-white">18.2 km</span>
              </div>
              <div className="flex justify-between">
                <span className="text-xs text-white/40">Süre</span>
                <span className="text-xs text-white">
                  {tripMinutes || 24} dk
                </span>
              </div>
              <div className="pt-1 border-t border-white/5 flex justify-between">
                <span className="text-xs text-white/40">Cüzdana Eklendi</span>
                <span className="text-xs text-[#00D4FF]">
                  🎉 +{currency.symbol}
                  {totalFare.toFixed(2)}
                </span>
              </div>
            </div>
            <button
              type="button"
              onClick={handlePaymentContinue}
              className="w-full py-3.5 rounded-xl bg-[#00D4FF] text-[#0a0a0a] font-bold text-sm shadow-[0_0_20px_rgba(0,212,255,0.5)] transition-all"
              data-ocid="ride.primary_button"
            >
              Devam Et
            </button>
          </div>
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════════
          DRIVER RATES PASSENGER
      ════════════════════════════════════════════════════════════════ */}
      {isDriverMode && showDriverRating && (
        <div
          className="absolute inset-0 z-[1300] bg-black/80 flex items-center justify-center px-6 backdrop-blur-sm"
          data-ocid="ride.modal"
        >
          <div className="w-full bg-[#111] border border-white/10 rounded-2xl p-6 space-y-5 shadow-2xl">
            <div className="text-center">
              <h3 className="text-base font-bold text-white">
                Yolcuyu Değerlendir
              </h3>
              <p className="text-xs text-white/40 mt-1">+777 5544 2211</p>
            </div>
            <div className="flex justify-center gap-3">
              {[1, 2, 3, 4, 5].map((s) => (
                <button
                  type="button"
                  key={s}
                  onClick={() => setDriverPassengerRating(s)}
                >
                  <Star
                    size={32}
                    className={
                      s <= driverPassengerRating
                        ? "text-yellow-400 fill-yellow-400"
                        : "text-white/20"
                    }
                  />
                </button>
              ))}
            </div>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={handleDriverRatingFinish}
                className="flex-1 py-2.5 rounded-xl bg-[#1a1a1a] border border-white/10 text-white/50 text-sm hover:border-white/20 transition-all"
                data-ocid="ride.cancel_button"
              >
                Atla
              </button>
              <button
                type="button"
                onClick={handleDriverRatingFinish}
                className="flex-1 py-2.5 rounded-xl bg-[#00D4FF] text-[#0a0a0a] font-bold text-sm shadow-[0_0_12px_rgba(0,212,255,0.4)] transition-all"
                data-ocid="ride.confirm_button"
              >
                Gönder
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════════
          SOS MODAL
      ════════════════════════════════════════════════════════════════ */}
      {showSosModal && (
        <div
          className="absolute inset-0 z-[1400] bg-black/85 flex items-center justify-center px-6 backdrop-blur-sm"
          data-ocid="ride.dialog"
        >
          <div className="w-full bg-[#111] border border-[#ef4444]/40 rounded-2xl p-6 space-y-4 shadow-2xl">
            <div className="text-center space-y-2">
              <div className="text-4xl">🚨</div>
              <h3 className="text-base font-bold text-white">
                Acil Durum Bildirimi Gönderildi
              </h3>
              <p className="text-sm text-white/60">
                Yardım yolda. Acil hat: +112
              </p>
            </div>
            <button
              type="button"
              onClick={() => setShowSosModal(false)}
              className="w-full py-3 rounded-xl bg-[#ef4444] text-white font-bold text-sm"
              data-ocid="ride.confirm_button"
            >
              Tamam
            </button>
          </div>
        </div>
      )}

      {/* Expand hint */}
      {!isDriverMode && rideState === "selecting" && !panelExpanded && (
        <button
          type="button"
          onClick={() => setPanelExpanded(true)}
          className="absolute bottom-[220px] left-1/2 -translate-x-1/2 z-[800] flex items-center gap-1 bg-[#00D4FF] text-[#0a0a0a] text-xs font-bold px-3 py-1.5 rounded-full shadow-[0_0_12px_rgba(0,212,255,0.5)]"
          data-ocid="ride.secondary_button"
        >
          <ChevronUp size={12} /> Sürüş seçenekleri
        </button>
      )}

      {/* GPS loading indicator */}
      {!userLocation && !gpsError && (
        <div
          className="absolute top-12 left-1/2 -translate-x-1/2 z-[1000] flex items-center gap-2 bg-[#1a1a1a]/90 border border-white/10 rounded-full px-3 py-1.5 text-xs text-white/60 backdrop-blur-sm"
          data-ocid="ride.loading_state"
        >
          <Loader2 size={10} className="animate-spin" />
          GPS konumu alınıyor...
        </div>
      )}
    </div>
  );
}
