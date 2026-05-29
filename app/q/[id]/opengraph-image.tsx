import { ImageResponse } from "next/og";
import { getQuoteById } from "@/lib/quotes";
import { OG_PALETTE, OG_PIXELS } from "@/lib/og-pixels";

export const alt = "Цитатка из Пелевина";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function QuoteOpengraphImage({ params }: PageProps) {
  const { id } = await params;
  const quoteId = Number(id);
  const quote =
    Number.isInteger(quoteId) && quoteId > 0
      ? await getQuoteById(quoteId)
      : null;

  const excerpt = quote
    ? quote.text.length > 180
      ? `${quote.text.slice(0, 177)}…`
      : quote.text
    : "Цитатки из Пелевина";

  const book = quote?.book ?? "Виктор Пелевин";

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
          padding: 48,
          fontFamily: "sans-serif",
        }}
      >
        <div
          style={{
            position: "relative",
            width: 120,
            height: 120,
            display: "flex",
            marginBottom: 24,
          }}
        >
          {OG_PIXELS.flatMap((row, y) =>
            [...row].map((ch, x) => (
              <div
                key={`${x}-${y}`}
                style={{
                  position: "absolute",
                  left: (x * 120) / OG_PIXELS.length,
                  top: (y * 120) / OG_PIXELS.length,
                  width: 120 / OG_PIXELS.length,
                  height: 120 / OG_PIXELS.length,
                  background: OG_PALETTE[ch] ?? "transparent",
                }}
              />
            )),
          )}
        </div>
        <div
          style={{
            fontSize: 42,
            fontWeight: 700,
            textAlign: "center",
            lineHeight: 1.25,
            maxWidth: 980,
          }}
        >
          &quot;{excerpt}&quot;
        </div>
        <div
          style={{
            marginTop: 20,
            fontSize: 24,
            color: "#fbbf24",
          }}
        >
          — {book}
        </div>
      </div>
    ),
    { ...size },
  );
}
