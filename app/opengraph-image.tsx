import { ImageResponse } from "next/og";

export const alt = "Цитатки из Пелевина";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          background: "linear-gradient(180deg, #0a0a0a 0%, #1a1b1e 100%)",
          color: "#ededed",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: 80,
          fontFamily: "sans-serif",
        }}
      >
        <svg
          viewBox="0 0 128 128"
          width="220"
          height="220"
          xmlns="http://www.w3.org/2000/svg"
        >
          <circle cx="64" cy="64" r="62" fill="#1f2024" />
          <path
            d="M64 22c-15 0-26 11-26 26 0 5 1 9 3 13l-4 14c-1 3 1 6 4 6h6l-2 16c-0.3 3 2 5 5 5h28c3 0 5-2 5-5l-2-16h6c3 0 5-3 4-6l-4-14c2-4 3-8 3-13 0-15-11-26-26-26z"
            fill="#ededed"
          />
          <ellipse cx="51" cy="52" rx="12" ry="9" fill="#0a0a0a" />
          <ellipse cx="77" cy="52" rx="12" ry="9" fill="#0a0a0a" />
          <rect x="62" y="50" width="4" height="3" fill="#0a0a0a" />
        </svg>
        <div style={{ marginTop: 48, fontSize: 88, fontWeight: 800 }}>
          Цитатки из Пелевина
        </div>
        <div
          style={{
            marginTop: 16,
            fontSize: 32,
            opacity: 0.7,
          }}
        >
          Нажми кнопку — получи дозу
        </div>
      </div>
    ),
    { ...size },
  );
}
