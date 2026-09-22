import {
  useId,
  type CSSProperties,
  type SVGProps,
} from "react";

export interface DiamondLogoProps
  extends Omit<SVGProps<SVGSVGElement>, "color"> {
  readonly size?: number;
  readonly glow?: boolean;
  readonly decorative?: boolean;
}

function DiamondLogo({
  size = 40,
  glow = true,
  decorative = false,
  ...svgProps
}: DiamondLogoProps) {
  const reactId = useId();

  const gradientId =
    `mass-diamond-gradient-${reactId}`
      .replace(/:/g, "");

  const highlightId =
    `mass-diamond-highlight-${reactId}`
      .replace(/:/g, "");

  const style: CSSProperties = {
    overflow: "visible",
    flexShrink: 0,
    ...(glow
      ? {
          filter: `drop-shadow(0 0 ${Math.max(
            4,
            size * 0.14,
          )}px rgba(57, 255, 136, 0.28))`,
        }
      : {}),
  };

  return (
    <svg
      {...svgProps}
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      role={decorative ? undefined : "img"}
      aria-hidden={
        decorative ? true : undefined
      }
      aria-label={
        decorative ? undefined : "Mass Diamond"
      }
      style={{
        ...style,
        ...svgProps.style,
      }}
    >
      <defs>
        <linearGradient
          id={gradientId}
          x1="18"
          y1="16"
          x2="82"
          y2="88"
          gradientUnits="userSpaceOnUse"
        >
          <stop
            offset="0"
            stopColor="#7AFFB0"
          />
          <stop
            offset="0.48"
            stopColor="#39FF88"
          />
          <stop
            offset="1"
            stopColor="#18B85E"
          />
        </linearGradient>

        <linearGradient
          id={highlightId}
          x1="25"
          y1="22"
          x2="73"
          y2="78"
          gradientUnits="userSpaceOnUse"
        >
          <stop
            offset="0"
            stopColor="#E4FFEE"
            stopOpacity="0.9"
          />
          <stop
            offset="0.45"
            stopColor="#8CFFB8"
            stopOpacity="0.28"
          />
          <stop
            offset="1"
            stopColor="#39FF88"
            stopOpacity="0"
          />
        </linearGradient>
      </defs>

      <path
        d="M50 7L91 37L50 94L9 37L50 7Z"
        fill={`url(#${gradientId})`}
        fillOpacity="0.12"
        stroke="#39FF88"
        strokeWidth="2.5"
        strokeLinejoin="round"
      />

      <path
        d="M9 37L50 7L91 37L50 94L9 37Z"
        stroke="#39FF88"
        strokeWidth="1.5"
        strokeLinejoin="round"
        opacity="0.9"
      />

      <path
        d="M9 37H91"
        stroke="#39FF88"
        strokeWidth="1.5"
        opacity="0.72"
      />

      <path
        d="M28 37L50 94L72 37L50 7L28 37Z"
        fill={`url(#${highlightId})`}
        opacity="0.7"
      />

      <path
        d="M28 37L50 94L72 37"
        stroke="#39FF88"
        strokeWidth="1.4"
        strokeLinejoin="round"
        opacity="0.8"
      />

      <path
        d="M28 37L50 7L72 37"
        stroke="#8CFFB8"
        strokeWidth="1.2"
        strokeLinejoin="round"
        opacity="0.65"
      />

      <path
        d="M50 7V94"
        stroke="#39FF88"
        strokeWidth="1"
        opacity="0.38"
      />
    </svg>
  );
}

export default DiamondLogo;
