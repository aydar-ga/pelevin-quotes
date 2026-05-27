import { ImageResponse } from "next/og";

export const size = { width: 32, height: 32 };
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

export default function Icon() {
  const px = 32 / PIXELS.length;
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          background: "#1f1410",
          display: "flex",
          flexWrap: "wrap",
        }}
      >
        {PIXELS.flatMap((row, y) =>
          [...row].map((ch, x) => (
            <div
              key={`${x}-${y}`}
              style={{
                position: "absolute",
                left: x * px,
                top: y * px,
                width: px,
                height: px,
                background: PALETTE[ch] ?? "transparent",
              }}
            />
          )),
        )}
      </div>
    ),
    { ...size },
  );
}
