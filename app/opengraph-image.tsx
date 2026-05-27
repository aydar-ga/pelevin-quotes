import { ImageResponse } from "next/og";

export const alt = "Цитатки из Пелевина";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const PIXELS: readonly string[] = [
  "BBBBBBBBBBBBBBBBBBBBBBBB",
  "B......................B",
  "B......................B",
  "B........HHHHHHHH......B",
  "B.......HHHHHHHHHH.....B",
  "B......HHHHHHHHHHHH....B",
  "B.....HHHHHHHHHHHHH....B",
  "B....HHHSSSSSSSSHHHH...B",
  "B....HHSSSSSSSSSSHHH...B",
  "B....HSGGGGSGGGGGSHH...B",
  "B....HSGGGGGGGGGGSHH...B",
  "B....HSSSSSSSSSSSSSH...B",
  "B.....SSSDDSSSSDDSS....B",
  "B.....SSSSSDDSSSSSS....B",
  "B......SSSSSSSSSSS.....B",
  "B.......SSDDDDSSS......B",
  "B........SSSSSSS.......B",
  "B........SSSSSSS.......B",
  "B....TTTTTTTTTTTTTT....B",
  "B...TTTTTTTTTTTTTTTT...B",
  "B..TTTTTTTbttbTTTTTTT..B",
  "B..TTTTTTTbtttTTTTTTT..B",
  "B..TTTTTTTTTTTTTTTTTT..B",
  "BBBBBBBBBBBBBBBBBBBBBBBB",
];

const PALETTE: Record<string, string> = {
  B: "#fbbf24",
  ".": "#1f1410",
  H: "#16100a",
  S: "#d4a07a",
  D: "#a67050",
  G: "#000000",
  T: "#c8b88a",
  t: "#8a7a4c",
  b: "#5a4a2c",
};

const PORTRAIT_SIZE = 360;
const PX = PORTRAIT_SIZE / PIXELS.length;

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
            width: PORTRAIT_SIZE,
            height: PORTRAIT_SIZE,
            display: "flex",
          }}
        >
          {PIXELS.flatMap((row, y) =>
            [...row].map((ch, x) => (
              <div
                key={`${x}-${y}`}
                style={{
                  position: "absolute",
                  left: x * PX,
                  top: y * PX,
                  width: PX,
                  height: PX,
                  background: PALETTE[ch] ?? "transparent",
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
