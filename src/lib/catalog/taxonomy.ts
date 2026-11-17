/**
 * Rubros de construcción de ProArq. Es la única fuente de verdad de la
 * taxonomía: la usan la navegación del sitio y el generador de datos.
 */

export type CategoryGlyphKey =
  | "concrete"
  | "steel"
  | "tile"
  | "basin"
  | "door"
  | "light"
  | "bolt"
  | "insulation";

export interface TaxonomyEntry {
  slug: string;
  nameEn: string;
  nameEs: string;
}

export interface TaxonomyCategory extends TaxonomyEntry {
  /** Símbolo de plano que identifica al rubro en la interfaz. */
  glyph: CategoryGlyphKey;
  children: readonly TaxonomyEntry[];
}

export const CATEGORY_TAXONOMY: readonly TaxonomyCategory[] = [
  {
    slug: "cement-concrete",
    nameEn: "Cement & concrete",
    nameEs: "Cemento y hormigón",
    glyph: "concrete",
    children: [
      {
        slug: "portland-cement",
        nameEn: "Portland cement",
        nameEs: "Cemento portland",
      },
      {
        slug: "concrete-admixtures",
        nameEn: "Concrete admixtures",
        nameEs: "Aditivos para hormigón",
      },
      {
        slug: "concrete-blocks",
        nameEn: "Concrete blocks & pavers",
        nameEs: "Bloques y adoquines de hormigón",
      },
      {
        slug: "mortars-adhesives",
        nameEn: "Mortars & tile adhesives",
        nameEs: "Morteros y adhesivos",
      },
    ],
  },
  {
    slug: "steel-structures",
    nameEn: "Steel & structures",
    nameEs: "Acero y estructuras",
    glyph: "steel",
    children: [
      {
        slug: "rebar",
        nameEn: "Reinforcing bar",
        nameEs: "Barras de acero para hormigón",
      },
      {
        slug: "structural-sections",
        nameEn: "Structural sections",
        nameEs: "Perfiles estructurales",
      },
      {
        slug: "welded-mesh",
        nameEn: "Welded wire mesh",
        nameEs: "Mallas electrosoldadas",
      },
      {
        slug: "steel-pipes",
        nameEn: "Steel pipes & tubes",
        nameEs: "Caños y tubos de acero",
      },
    ],
  },
  {
    slug: "tiles-ceramics",
    nameEn: "Tiles & ceramics",
    nameEs: "Cerámicos y revestimientos",
    glyph: "tile",
    children: [
      {
        slug: "porcelain-tiles",
        nameEn: "Porcelain tiles",
        nameEs: "Porcelanatos",
      },
      {
        slug: "ceramic-wall-tiles",
        nameEn: "Ceramic wall tiles",
        nameEs: "Cerámicos de pared",
      },
      { slug: "mosaics", nameEn: "Mosaics", nameEs: "Mosaicos" },
      {
        slug: "stone-slabs",
        nameEn: "Natural stone slabs",
        nameEs: "Placas de piedra natural",
      },
    ],
  },
  {
    slug: "sanitary-plumbing",
    nameEn: "Sanitary ware & faucets",
    nameEs: "Sanitarios y grifería",
    glyph: "basin",
    children: [
      { slug: "toilets", nameEn: "Toilets", nameEs: "Inodoros" },
      {
        slug: "basins",
        nameEn: "Basins & sinks",
        nameEs: "Lavatorios y bachas",
      },
      {
        slug: "faucets",
        nameEn: "Faucets & mixers",
        nameEs: "Griferías y monocomandos",
      },
      {
        slug: "pipes-fittings",
        nameEn: "Pipes & fittings",
        nameEs: "Caños y accesorios",
      },
    ],
  },
  {
    slug: "doors-windows",
    nameEn: "Doors & windows",
    nameEs: "Aberturas",
    glyph: "door",
    children: [
      {
        slug: "aluminum-windows",
        nameEn: "Aluminum windows",
        nameEs: "Ventanas de aluminio",
      },
      {
        slug: "upvc-windows",
        nameEn: "uPVC windows",
        nameEs: "Ventanas de PVC",
      },
      {
        slug: "interior-doors",
        nameEn: "Interior doors",
        nameEs: "Puertas de interior",
      },
      {
        slug: "door-hardware",
        nameEn: "Door hardware",
        nameEs: "Herrajes para puertas",
      },
    ],
  },
  {
    slug: "electrical-lighting",
    nameEn: "Electrical & lighting",
    nameEs: "Electricidad e iluminación",
    glyph: "light",
    children: [
      {
        slug: "cables-wires",
        nameEn: "Cables & wires",
        nameEs: "Cables y conductores",
      },
      {
        slug: "switches-sockets",
        nameEn: "Switches & sockets",
        nameEs: "Llaves y tomacorrientes",
      },
      {
        slug: "led-lighting",
        nameEn: "LED lighting",
        nameEs: "Iluminación LED",
      },
      {
        slug: "circuit-breakers",
        nameEn: "Circuit breakers",
        nameEs: "Interruptores termomagnéticos",
      },
    ],
  },
  {
    slug: "tools-hardware",
    nameEn: "Tools & hardware",
    nameEs: "Herramientas y ferretería",
    glyph: "bolt",
    children: [
      {
        slug: "power-tools",
        nameEn: "Power tools",
        nameEs: "Herramientas eléctricas",
      },
      {
        slug: "hand-tools",
        nameEn: "Hand tools",
        nameEs: "Herramientas manuales",
      },
      {
        slug: "fasteners",
        nameEn: "Fasteners & anchors",
        nameEs: "Fijaciones y anclajes",
      },
      {
        slug: "scaffolding",
        nameEn: "Scaffolding & formwork",
        nameEs: "Andamios y encofrados",
      },
    ],
  },
  {
    slug: "insulation-roofing",
    nameEn: "Insulation & roofing",
    nameEs: "Aislantes y techos",
    glyph: "insulation",
    children: [
      {
        slug: "mineral-wool",
        nameEn: "Mineral wool",
        nameEs: "Lana mineral",
      },
      {
        slug: "foam-boards",
        nameEn: "XPS & EPS boards",
        nameEs: "Placas de XPS y EPS",
      },
      {
        slug: "roofing-sheets",
        nameEn: "Roofing sheets",
        nameEs: "Chapas para techos",
      },
      {
        slug: "waterproofing-membranes",
        nameEn: "Waterproofing membranes",
        nameEs: "Membranas impermeabilizantes",
      },
    ],
  },
];

export function findTaxonomyCategory(
  slug: string,
): TaxonomyCategory | undefined {
  return CATEGORY_TAXONOMY.find((category) => category.slug === slug);
}
