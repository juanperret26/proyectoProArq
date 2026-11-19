import type { CSSProperties, ReactNode } from "react";
import { useId } from "react";
import type { CategoryGlyphKey } from "@/lib/catalog/taxonomy";

type CategoryGlyphProps = {
  glyph: CategoryGlyphKey;
  className?: string;
  style?: CSSProperties;
};

type GlyphRenderer = (clipId: string) => ReactNode;

/** Trazos a 45° que cubren todo el lienzo de 96×96; se recortan con clipPath. */
function hatchPath(step: number, offset = 0): string {
  const segments: string[] = [];
  for (let start = -96 + offset; start <= 96; start += step) {
    segments.push(`M${start} 96L${start + 96} 0`);
  }
  return segments.join("");
}

const HATCH_FINE = hatchPath(6);
const HATCH_STEEL = hatchPath(12) + hatchPath(12, 3);

const I_BEAM = "M22 18h52v10H53v40h21v10H22V68h21V28H22z";
const WALLS = "M10 62h18v10H10zM68 62h18v10H68z";
const CENTERLINES = "M48 8v80M8 48h80";
const CENTERLINE_DASH = "9 3 2 3";

const SAND_DOTS: ReadonlyArray<readonly [number, number]> = [
  [22, 22],
  [39, 20],
  [50, 31],
  [73, 22],
  [66, 33],
  [20, 43],
  [33, 42],
  [53, 41],
  [61, 52],
  [76, 59],
  [30, 59],
  [49, 63],
  [72, 75],
  [47, 75],
  [21, 77],
  [41, 35],
  [65, 61],
  [52, 22],
  [77, 34],
  [25, 51],
];

const GLYPHS: Record<CategoryGlyphKey, GlyphRenderer> = {
  // Rayado de hormigón: agregado grueso (triángulos) y arena (puntos).
  concrete: () => (
    <>
      <rect x="14" y="14" width="68" height="68" />
      <path d="M26 33l4-7 4 7zM57 28l3-5 3 5zM70 46l4-7 4 7zM41 53l3-6 4 6zM22 64l3-5 3 5zM58 71l4-7 4 7zM34 76l3-5 3 5z" />
      <g fill="currentColor" stroke="none">
        {SAND_DOTS.map(([cx, cy]) => (
          <circle key={`${cx}-${cy}`} cx={cx} cy={cy} r="1.2" />
        ))}
      </g>
    </>
  ),
  // Perfil doble T en corte, con el rayado doble del acero y sus ejes.
  steel: (clipId) => (
    <>
      <defs>
        <clipPath id={clipId}>
          <path d={I_BEAM} />
        </clipPath>
      </defs>
      <path d={HATCH_STEEL} clipPath={`url(#${clipId})`} strokeWidth="1" />
      <path d={I_BEAM} />
      <path
        d={CENTERLINES}
        strokeWidth="1"
        strokeDasharray={CENTERLINE_DASH}
      />
    </>
  ),
  // Despiece de piso: nueve piezas, una en corte y una con inserto.
  tile: (clipId) => (
    <>
      <defs>
        <clipPath id={clipId}>
          <rect x="16" y="16" width="21.33" height="21.33" />
        </clipPath>
      </defs>
      <path d={HATCH_FINE} clipPath={`url(#${clipId})`} strokeWidth="1" />
      <rect x="16" y="16" width="64" height="64" />
      <path d="M37.33 16v64M58.67 16v64M16 37.33h64M16 58.67h64" />
      <path d="M48 40.5l7.5 7.5-7.5 7.5-7.5-7.5z" />
    </>
  ),
  // Lavatorio en planta, con caño y dos llaves.
  basin: () => (
    <>
      <rect x="16" y="22" width="64" height="52" rx="5" />
      <ellipse cx="48" cy="52" rx="23" ry="14.5" />
      <circle cx="48" cy="54" r="2.2" />
      <rect x="45.5" y="26" width="5" height="14" rx="2.5" />
      <circle cx="35" cy="30" r="2.6" />
      <circle cx="61" cy="30" r="2.6" />
    </>
  ),
  // Puerta en planta: muros en corte, hoja abierta y barrido.
  door: (clipId) => (
    <>
      <defs>
        <clipPath id={clipId}>
          <path d={WALLS} />
        </clipPath>
      </defs>
      <path d={HATCH_FINE} clipPath={`url(#${clipId})`} strokeWidth="1" />
      <path d={WALLS} />
      <path d="M28 62V22" strokeWidth="2.5" />
      <path d="M28 22a40 40 0 0 1 40 40" strokeWidth="1" />
    </>
  ),
  // Boca de luz en cielorraso unida por cableado a su interruptor.
  light: () => (
    <>
      <circle cx="52" cy="38" r="20" />
      <path d="M37.9 23.9l28.2 28.2M66.1 23.9L37.9 52.1" />
      <path
        d="M37 53c-10 5-16 12-17 21"
        strokeWidth="1"
        strokeDasharray="4 3"
      />
      <circle cx="20" cy="79" r="3.5" />
      <path d="M22.5 76.5l8-8" />
    </>
  ),
  // Bulón hexagonal en vista: rosca en tres cuartos de círculo y ejes.
  bolt: () => (
    <>
      <path d="M74 48L61 70.5H35L22 48l13-22.5h26z" />
      <circle cx="48" cy="48" r="12" />
      <path d="M48 31.5a16.5 16.5 0 1 0 16.5 16.5" strokeWidth="1" />
      <path
        d={CENTERLINES}
        strokeWidth="1"
        strokeDasharray={CENTERLINE_DASH}
      />
    </>
  ),
  // Aislante en manta entre dos caras, con su onda característica.
  insulation: () => (
    <>
      <path d="M10 26h76M10 70h76" />
      <path d="M12 48a9 22 0 0 1 18 0a9 22 0 0 0 18 0a9 22 0 0 1 18 0a9 22 0 0 0 18 0" />
    </>
  ),
  // Engranaje en planta: dientes, eje central y ejes de simetría.
  gear: () => (
    <>
      <circle cx="48" cy="48" r="22" />
      <circle cx="48" cy="48" r="9" />
      <path d="M44 20V10h8v10M44 76v10h8V76M20 44H10v8h10M76 44h10v8H76M28 28l-7-7 6-6 7 7M68 68l7 7-6 6-7-7M68 28l7-7-6-6-7 7M28 68l-7 7 6 6 7-7" />
      <path
        d={CENTERLINES}
        strokeWidth="1"
        strokeDasharray={CENTERLINE_DASH}
      />
    </>
  ),
  // Camión en elevación lateral: caja, cabina y dos ruedas.
  truck: () => (
    <>
      <rect x="8" y="30" width="46" height="34" />
      <path d="M54 40h16l12 14v10H54z" />
      <path d="M62 44h8l6 8H62z" strokeWidth="1" />
      <circle cx="26" cy="68" r="7" />
      <circle cx="70" cy="68" r="7" />
      <path d="M6 79h84" strokeWidth="1" />
    </>
  ),
  // Pórtico de estructura de acero: columnas, cubierta a dos aguas y correas.
  frame: () => (
    <>
      <path d="M14 80V40L48 18l34 22v40z" />
      <path d="M14 40h68M48 18v22" />
      <path d="M31 29l0 11M65 29l0 11" strokeWidth="1" />
      <path d="M8 80h80" strokeWidth="1" />
    </>
  ),
  // Pila de chapas en perspectiva.
  stack: () => (
    <>
      <path d="M12 64l36-14 36 14-36 14z" />
      <path d="M12 52l36-14 36 14" />
      <path d="M12 40l36-14 36 14" />
      <path d="M12 40v24M84 40v24" strokeWidth="1" />
    </>
  ),
};

/**
 * Símbolo de plano de cada rubro: rayados de material y simbología de planta
 * en lugar de íconos genéricos. Se dibuja con el color de texto actual.
 */
export function CategoryGlyph({ glyph, className, style }: CategoryGlyphProps) {
  const clipId = useId();

  return (
    <svg
      viewBox="0 0 96 96"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={className}
      style={style}
    >
      {GLYPHS[glyph](clipId)}
    </svg>
  );
}
