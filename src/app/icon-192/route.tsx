import { ImageResponse } from "next/og";

export const runtime = "edge";

const SIZE = 192;

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
          borderRadius: "38px",
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
              gap: "6px",
            }}
          >
            <div style={{ width: "16px", height: "16px", borderRadius: "50%", backgroundColor: "#FFD400" }} />
            <div style={{ width: "16px", height: "16px", borderRadius: "50%", backgroundColor: "#E20613" }} />
            <div style={{ width: "16px", height: "16px", borderRadius: "50%", backgroundColor: "#0080C8" }} />
          </div>
          <div
            style={{
              fontSize: "72px",
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
              fontSize: "18px",
              fontWeight: 600,
              color: "rgba(255,255,255,0.6)",
              letterSpacing: "4px",
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
