import { ImageResponse } from "next/og";

export const runtime = "edge";
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = "image/png";

export default function TwitterImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background:
            "radial-gradient(circle at 20% 20%, #202a44 0%, #101218 45%, #07080c 100%)",
          color: "white",
          fontFamily: "Inter, Arial, sans-serif",
          position: "relative",
        }}
      >
        <div
          style={{
            position: "absolute",
            top: 40,
            left: 40,
            width: 56,
            height: 56,
            borderRadius: 12,
            border: "2px solid rgba(255,255,255,0.8)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 28,
            fontWeight: 700,
          }}
        >
          S
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 20, textAlign: "center" }}>
          <div style={{ fontSize: 84, fontWeight: 800, letterSpacing: 1 }}>SQLBots</div>
          <div style={{ fontSize: 30, opacity: 0.88 }}>
            Automated SQL security workflow dashboard
          </div>
        </div>
      </div>
    ),
    size
  );
}
