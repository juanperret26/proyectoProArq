import { ImageResponse } from "next/og";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

/** Ícono para pantalla de inicio en iOS: la misma marca que el de la pestaña. */
export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#2f3ccf",
        }}
      >
        <svg width="104" height="104" viewBox="0 0 18 18" fill="none">
          <clipPath id="c">
            <rect x="1" y="1" width="16" height="16" />
          </clipPath>
          <path
            d="M-1 13L13 -1M-1 21L21 -1M7 21L21 7"
            stroke="#ffffff"
            strokeWidth="1.6"
            clipPath="url(#c)"
          />
          <rect x="1" y="1" width="16" height="16" stroke="#ffffff" strokeWidth="1.6" />
        </svg>
      </div>
    ),
    size,
  );
}
