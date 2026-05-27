import React from "react";

interface PelevinIconProps extends React.SVGProps<SVGSVGElement> {
  size?: number;
  title?: string;
}

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

const PelevinIcon: React.FC<PelevinIconProps> = ({
  size = 96,
  title = "Виктор Пелевин",
  ...rest
}) => {
  const rects: React.ReactElement[] = [];
  for (let y = 0; y < PIXELS.length; y++) {
    const row = PIXELS[y];
    for (let x = 0; x < row.length; x++) {
      const ch = row[x];
      const fill = PALETTE[ch];
      if (!fill) continue;
      rects.push(
        <rect
          key={`${x}-${y}`}
          x={x * 4}
          y={y * 4}
          width={4}
          height={4}
          fill={fill}
        />,
      );
    }
  }

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 96 96"
      width={size}
      height={size}
      shapeRendering="crispEdges"
      role="img"
      aria-label={title}
      {...rest}
    >
      <title>{title}</title>
      {rects}
    </svg>
  );
};

export default PelevinIcon;
