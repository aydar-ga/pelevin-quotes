import React from "react";

interface PelevinIconProps extends React.SVGProps<SVGSVGElement> {
  size?: number;
  title?: string;
}

const PelevinIcon: React.FC<PelevinIconProps> = ({
  size = 64,
  title = "Виктор Пелевин",
  ...rest
}) => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 128 128"
      width={size}
      height={size}
      role="img"
      aria-label={title}
      {...rest}
    >
      <title>{title}</title>
      <defs>
        <linearGradient id="pelevin-bg" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="currentColor" stopOpacity="0.08" />
          <stop offset="100%" stopColor="currentColor" stopOpacity="0.18" />
        </linearGradient>
      </defs>

      <circle cx="64" cy="64" r="62" fill="url(#pelevin-bg)" />

      <path
        d="M64 22c-15 0-26 11-26 26 0 5 1 9 3 13l-4 14c-1 3 1 6 4 6h6l-2 16c-0.3 3 2 5 5 5h28c3 0 5-2 5-5l-2-16h6c3 0 5-3 4-6l-4-14c2-4 3-8 3-13 0-15-11-26-26-26z"
        fill="currentColor"
      />

      <ellipse cx="51" cy="52" rx="12" ry="9" fill="#0a0a0a" />
      <ellipse cx="77" cy="52" rx="12" ry="9" fill="#0a0a0a" />
      <rect x="62" y="50" width="4" height="3" fill="#0a0a0a" />
      <rect x="39" y="50" width="3" height="3" fill="#0a0a0a" />
      <rect x="86" y="50" width="3" height="3" fill="#0a0a0a" />

      <path
        d="M48 53q3-3 6 0"
        fill="none"
        stroke="#ffffff"
        strokeOpacity="0.35"
        strokeWidth="1.2"
        strokeLinecap="round"
      />
      <path
        d="M74 53q3-3 6 0"
        fill="none"
        stroke="#ffffff"
        strokeOpacity="0.35"
        strokeWidth="1.2"
        strokeLinecap="round"
      />
    </svg>
  );
};

export default PelevinIcon;
