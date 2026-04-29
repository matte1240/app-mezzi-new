"use client";

import { VehiclePhotoTemplate } from "@prisma/client";

type HotspotConfig = {
  template: VehiclePhotoTemplate;
  label: string;
  cx: number;
  cy: number;
};

// Top-down car hotspots (viewBox 100x190)
const CAR_HOTSPOTS: HotspotConfig[] = [
  { template: "FRONTE" as VehiclePhotoTemplate, label: "Fronte", cx: 50, cy: 10 },
  { template: "RETRO" as VehiclePhotoTemplate, label: "Retro", cx: 50, cy: 180 },
  { template: "LATERALE_SX" as VehiclePhotoTemplate, label: "Lat. SX", cx: 8, cy: 95 },
  { template: "LATERALE_DX" as VehiclePhotoTemplate, label: "Lat. DX", cx: 92, cy: 95 },
  { template: "CRUSCOTTO" as VehiclePhotoTemplate, label: "Interno", cx: 50, cy: 78 },
];

const VAN_HOTSPOTS: HotspotConfig[] = [
  { template: "FRONTE" as VehiclePhotoTemplate, label: "Fronte", cx: 50, cy: 10 },
  { template: "RETRO" as VehiclePhotoTemplate, label: "Retro", cx: 50, cy: 180 },
  { template: "LATERALE_SX" as VehiclePhotoTemplate, label: "Lat. SX", cx: 7, cy: 95 },
  { template: "LATERALE_DX" as VehiclePhotoTemplate, label: "Lat. DX", cx: 93, cy: 95 },
  { template: "CRUSCOTTO" as VehiclePhotoTemplate, label: "Interno", cx: 50, cy: 65 },
];

function CarTopDown() {
  return (
    <>
      {/* Shadow */}
      <ellipse cx="50" cy="170" rx="28" ry="5" fill="#00000015" />

      {/* Body */}
      <rect x="18" y="22" width="64" height="148" rx="14" fill="#e5e7eb" stroke="#9ca3af" strokeWidth="1.5" />

      {/* Hood */}
      <rect x="22" y="22" width="56" height="28" rx="10" fill="#d1d5db" stroke="#9ca3af" strokeWidth="1" />

      {/* Front windshield */}
      <rect x="24" y="38" width="52" height="20" rx="3" fill="#bfdbfe" stroke="#93c5fd" strokeWidth="0.8" opacity="0.85" />

      {/* Interior floor */}
      <rect x="22" y="60" width="56" height="80" rx="3" fill="#f3f4f6" stroke="#e5e7eb" strokeWidth="0.8" />

      {/* Dashboard bar */}
      <rect x="24" y="60" width="52" height="5" rx="1" fill="#d1d5db" />

      {/* Front seats */}
      <rect x="26" y="70" width="20" height="16" rx="3" fill="#d1d5db" stroke="#9ca3af" strokeWidth="0.6" />
      <rect x="54" y="70" width="20" height="16" rx="3" fill="#d1d5db" stroke="#9ca3af" strokeWidth="0.6" />

      {/* Rear seat */}
      <rect x="26" y="110" width="48" height="18" rx="3" fill="#d1d5db" stroke="#9ca3af" strokeWidth="0.6" />

      {/* Rear windshield */}
      <rect x="24" y="132" width="52" height="18" rx="3" fill="#bfdbfe" stroke="#93c5fd" strokeWidth="0.8" opacity="0.75" />

      {/* Trunk */}
      <rect x="22" y="150" width="56" height="20" rx="10" fill="#d1d5db" stroke="#9ca3af" strokeWidth="1" />

      {/* Wheels - front */}
      <rect x="8" y="30" width="10" height="18" rx="2" fill="#374151" />
      <rect x="82" y="30" width="10" height="18" rx="2" fill="#374151" />
      {/* Wheel rims front */}
      <rect x="10" y="33" width="6" height="12" rx="1" fill="#6b7280" />
      <rect x="84" y="33" width="6" height="12" rx="1" fill="#6b7280" />

      {/* Wheels - rear */}
      <rect x="8" y="142" width="10" height="18" rx="2" fill="#374151" />
      <rect x="82" y="142" width="10" height="18" rx="2" fill="#374151" />
      {/* Wheel rims rear */}
      <rect x="10" y="145" width="6" height="12" rx="1" fill="#6b7280" />
      <rect x="84" y="145" width="6" height="12" rx="1" fill="#6b7280" />

      {/* Headlights */}
      <rect x="20" y="23" width="12" height="6" rx="2" fill="#fde68a" stroke="#f59e0b" strokeWidth="0.5" />
      <rect x="68" y="23" width="12" height="6" rx="2" fill="#fde68a" stroke="#f59e0b" strokeWidth="0.5" />

      {/* Taillights */}
      <rect x="20" y="161" width="12" height="6" rx="2" fill="#fca5a5" stroke="#ef4444" strokeWidth="0.5" />
      <rect x="68" y="161" width="12" height="6" rx="2" fill="#fca5a5" stroke="#ef4444" strokeWidth="0.5" />
    </>
  );
}

function VanTopDown() {
  return (
    <>
      {/* Shadow */}
      <ellipse cx="50" cy="172" rx="32" ry="5" fill="#00000015" />

      {/* Main body (cargo area) */}
      <rect x="14" y="18" width="72" height="155" rx="6" fill="#e5e7eb" stroke="#9ca3af" strokeWidth="1.5" />

      {/* Cab/front section */}
      <rect x="14" y="18" width="72" height="45" rx="6" fill="#d1d5db" stroke="#9ca3af" strokeWidth="1" />

      {/* Front windshield */}
      <rect x="18" y="26" width="64" height="22" rx="3" fill="#bfdbfe" stroke="#93c5fd" strokeWidth="0.8" opacity="0.85" />

      {/* Dashboard */}
      <rect x="16" y="50" width="68" height="5" rx="1" fill="#9ca3af" />

      {/* Front seats */}
      <rect x="20" y="58" width="22" height="14" rx="2" fill="#d1d5db" stroke="#9ca3af" strokeWidth="0.6" />
      <rect x="58" y="58" width="22" height="14" rx="2" fill="#d1d5db" stroke="#9ca3af" strokeWidth="0.6" />

      {/* Cargo area interior */}
      <rect x="16" y="76" width="68" height="85" rx="2" fill="#f9fafb" stroke="#e5e7eb" strokeWidth="0.6" />

      {/* Cargo area lines (floor markings) */}
      <line x1="16" y1="99" x2="84" y2="99" stroke="#e5e7eb" strokeWidth="0.5" strokeDasharray="3 2" />
      <line x1="16" y1="122" x2="84" y2="122" stroke="#e5e7eb" strokeWidth="0.5" strokeDasharray="3 2" />
      <line x1="16" y1="145" x2="84" y2="145" stroke="#e5e7eb" strokeWidth="0.5" strokeDasharray="3 2" />

      {/* Rear doors */}
      <rect x="14" y="163" width="72" height="10" rx="2" fill="#d1d5db" stroke="#9ca3af" strokeWidth="0.8" />
      <line x1="50" y1="163" x2="50" y2="173" stroke="#9ca3af" strokeWidth="0.8" />

      {/* Wheels - front */}
      <rect x="4" y="26" width="10" height="20" rx="2" fill="#374151" />
      <rect x="86" y="26" width="10" height="20" rx="2" fill="#374151" />
      <rect x="6" y="29" width="6" height="14" rx="1" fill="#6b7280" />
      <rect x="88" y="29" width="6" height="14" rx="1" fill="#6b7280" />

      {/* Wheels - rear (double axle) */}
      <rect x="4" y="140" width="10" height="20" rx="2" fill="#374151" />
      <rect x="4" y="155" width="10" height="14" rx="2" fill="#374151" />
      <rect x="86" y="140" width="10" height="20" rx="2" fill="#374151" />
      <rect x="86" y="155" width="10" height="14" rx="2" fill="#374151" />

      {/* Headlights */}
      <rect x="14" y="18" width="16" height="7" rx="2" fill="#fde68a" stroke="#f59e0b" strokeWidth="0.5" />
      <rect x="70" y="18" width="16" height="7" rx="2" fill="#fde68a" stroke="#f59e0b" strokeWidth="0.5" />

      {/* Taillights */}
      <rect x="14" y="166" width="16" height="6" rx="2" fill="#fca5a5" stroke="#ef4444" strokeWidth="0.5" />
      <rect x="70" y="166" width="16" height="6" rx="2" fill="#fca5a5" stroke="#ef4444" strokeWidth="0.5" />
    </>
  );
}

export function VehicleMockup({
  vehicleType,
  hasPhoto,
  onHotspotClick,
}: {
  vehicleType: "car" | "van" | "truck" | "bus";
  hasPhoto: (template: VehiclePhotoTemplate) => boolean;
  onHotspotClick: (template: VehiclePhotoTemplate) => void;
}) {
  const isVan = vehicleType === "van" || vehicleType === "truck" || vehicleType === "bus";
  const hotspots = isVan ? VAN_HOTSPOTS : CAR_HOTSPOTS;
  const HOTSPOT_R = 7;

  return (
    <div className="flex justify-center">
      <svg
        viewBox="0 0 100 190"
        className="w-full max-w-[200px] h-auto"
        style={{ filter: "drop-shadow(0 2px 8px rgba(0,0,0,0.08))" }}
      >
        {isVan ? <VanTopDown /> : <CarTopDown />}

        {/* Hotspots */}
        {hotspots.map((hotspot) => {
          const done = hasPhoto(hotspot.template);
          return (
            <g
              key={hotspot.template}
              onClick={() => onHotspotClick(hotspot.template)}
              style={{ cursor: "pointer" }}
            >
              {/* Outer ring */}
              <circle
                cx={hotspot.cx}
                cy={hotspot.cy}
                r={HOTSPOT_R + 2}
                fill="white"
                opacity="0.7"
              />
              {/* Fill circle */}
              <circle
                cx={hotspot.cx}
                cy={hotspot.cy}
                r={HOTSPOT_R}
                fill={done ? "#16a34a" : "#2563eb"}
                stroke={done ? "#15803d" : "#1d4ed8"}
                strokeWidth="1"
              />
              {/* Icon */}
              {done ? (
                <text
                  x={hotspot.cx}
                  y={hotspot.cy + 0.5}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  fill="white"
                  fontSize="6"
                  fontWeight="bold"
                >
                  ✓
                </text>
              ) : (
                <text
                  x={hotspot.cx}
                  y={hotspot.cy + 0.5}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  fill="white"
                  fontSize="8"
                  fontWeight="bold"
                >
                  +
                </text>
              )}
              <title>{`${hotspot.label}${done ? " (foto presente)" : " (clicca per aggiungere)"}`}</title>
            </g>
          );
        })}
      </svg>
    </div>
  );
}
