import { ImageResponse } from "next/og";

export const runtime = "edge";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#2B2347",
        }}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "2px",
          }}
        >
          <div
            style={{
              display: "flex",
              gap: "5px",
            }}
          >
            <div style={{ width: "14px", height: "14px", borderRadius: "50%", backgroundColor: "#FFD400" }} />
            <div style={{ width: "14px", height: "14px", borderRadius: "50%", backgroundColor: "#E20613" }} />
            <div style={{ width: "14px", height: "14px", borderRadius: "50%", backgroundColor: "#0080C8" }} />
          </div>
          <div
            style={{
              fontSize: "66px",
              fontWeight: 800,
              color: "white",
              letterSpacing: "-2px",
              lineHeight: 1,
              marginTop: "4px",
            }}
          >
            GM
          </div>
          <div
            style={{
              fontSize: "16px",
              fontWeight: 600,
              color: "rgba(255,255,255,0.6)",
              letterSpacing: "3px",
              textTransform: "uppercase",
            }}
          >
            MEZZI
          </div>
        </div>
      </div>
    ),
    { ...size }
  );
}
