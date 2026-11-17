import { useId } from "react";

type LogoProps = {
  className?: string;
};

/** Marca de ProArq: una muestra de rayado de plano junto al nombre. */
export function Logo({ className = "" }: LogoProps) {
  const clipId = useId();

  return (
    <span className={`inline-flex items-center gap-2.5 ${className}`}>
      <svg
        width="28"
        height="28"
        viewBox="0 0 28 28"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        aria-hidden="true"
        className="text-blueline"
      >
        <defs>
          <clipPath id={clipId}>
            <rect x="2" y="2" width="24" height="24" />
          </clipPath>
        </defs>
        <path
          d="M-2 18L18 -2M-2 30L30 -2M10 30L30 10"
          clipPath={`url(#${clipId})`}
        />
        <rect x="2" y="2" width="24" height="24" />
      </svg>
      <span className="font-display text-[1.875rem] font-extrabold leading-none text-ink">
        ProArq
      </span>
    </span>
  );
}
