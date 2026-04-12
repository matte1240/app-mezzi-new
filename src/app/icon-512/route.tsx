import { ImageResponse } from "next/og";

export const runtime = "edge";

const SIZE = 512;

export async function GET() {
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
          borderRadius: "96px",
        }}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "4px",
          }}
        >
          <div
            style={{
              display: "flex",
              gap: "14px",
            }}
          >
            <div style={{ width: "36px", height: "36px", borderRadius: "50%", backgroundColor: "#FFD400" }} />
            <div style={{ width: "36px", height: "36px", borderRadius: "50%", backgroundColor: "#E20613" }} />
            <div style={{ width: "36px", height: "36px", borderRadius: "50%", backgroundColor: "#0080C8" }} />
          </div>
          <div
            style={{
              fontSize: "180px",
              fontWeight: 800,
              color: "white",
              letterSpacing: "-6px",
              lineHeight: 1,
              marginTop: "8px",
            }}
          >
            GM
          </div>
          <div
            style={{
              fontSize: "44px",
              fontWeight: 600,
              color: "rgba(255,255,255,0.6)",
              letterSpacing: "10px",
              textTransform: "uppercase",
            }}
          >
            MEZZI
          </div>
        </div>
      </div>
    ),
    { width: SIZE, height: SIZE }
  );
}
