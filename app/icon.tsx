import { ImageResponse } from "next/og";

export const size = { width: 32, height: 32 };
export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          background: "#0a0a0a",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <svg
          viewBox="0 0 128 128"
          width="28"
          height="28"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M64 22c-15 0-26 11-26 26 0 5 1 9 3 13l-4 14c-1 3 1 6 4 6h6l-2 16c-0.3 3 2 5 5 5h28c3 0 5-2 5-5l-2-16h6c3 0 5-3 4-6l-4-14c2-4 3-8 3-13 0-15-11-26-26-26z"
            fill="#ededed"
          />
          <ellipse cx="51" cy="52" rx="12" ry="9" fill="#0a0a0a" />
          <ellipse cx="77" cy="52" rx="12" ry="9" fill="#0a0a0a" />
          <rect x="62" y="50" width="4" height="3" fill="#0a0a0a" />
        </svg>
      </div>
    ),
    { ...size },
  );
}
