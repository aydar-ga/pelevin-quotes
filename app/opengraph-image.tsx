import { ImageResponse } from "next/og";
import { OG_PALETTE, OG_PIXELS, OG_PORTRAIT_SIZE } from "@/lib/og-pixels";

export const alt = "Цитатки из Пелевина";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const PX = OG_PORTRAIT_SIZE / OG_PIXELS.length;

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          background: "#0a0a0a",
          color: "#ededed",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: 60,
          fontFamily: "sans-serif",
        }}
      >
        <div
          style={{
            position: "relative",
            width: OG_PORTRAIT_SIZE,
            height: OG_PORTRAIT_SIZE,
            display: "flex",
          }}
        >
          {OG_PIXELS.flatMap((row, y) =>
            [...row].map((ch, x) => (
              <div
                key={`${x}-${y}`}
                style={{
                  position: "absolute",
                  left: x * PX,
                  top: y * PX,
                  width: PX,
                  height: PX,
                  background: OG_PALETTE[ch] ?? "transparent",
                }}
              />
            )),
          )}
        </div>
        <div
          style={{
            marginTop: 36,
            fontSize: 76,
            fontWeight: 800,
            letterSpacing: -1,
          }}
        >
          Цитатки из Пелевина
        </div>
        <div
          style={{
            marginTop: 12,
            fontSize: 28,
            color: "#fbbf24",
            letterSpacing: 3,
          }}
        >
          ▶ PRESS START ◀
        </div>
      </div>
    ),
    { ...size },
  );
}
