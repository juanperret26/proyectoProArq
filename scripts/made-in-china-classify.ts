/**
 * Asigna cada producto de Made-in-China a un subrubro de la taxonomía de ProArq
 * (src/lib/catalog/taxonomy.ts). Devuelve null si no encaja en ninguno: la
 * carga omite esos productos en vez de forzarlos a un rubro equivocado.
 */

export interface ClassifyInput {
  readonly name: string;
  /** Rubros del sitio, de lo general a lo particular (sin "Home" ni el producto). */
  readonly categoryPath: readonly string[];
}

/** Maquinaria, vehículos y combustibles: no son materiales de construcción de ProArq. */
const NOT_A_MATERIAL =
  /\b(crane|forklift|truck|excavator|loader|bulldozer|drilling rig|rotary drill\w*|machine|machinery|generator|engine|trailer|tractor|coal|concrete mixer|concrete pump|compressor|boiler|dump|hydraulic (cylinder|pump|press|breaker)|lift|elevator|vehicle)\b/i;

/** Reglas en orden: gana la primera que coincide, así que van de lo específico a lo general. */
const RULES: readonly { readonly slug: string; readonly test: RegExp }[] = [
  { slug: "scaffolding", test: /\b(formwork|scaffold\w*|shuttering|steel prop|acrow|ringlock|cuplock|jack base|u[- ]?head|tie rod|falsework)\b/i },
  { slug: "welded-mesh", test: /\b(welded|wire)\s+(wire\s+)?mesh\b/i },
  { slug: "rebar", test: /\b(rebar|re-bar|deformed (steel )?bar|reinforc\w*\s+(steel\s+)?bar)/i },
  { slug: "structural-sections", test: /\b(h[- ]?beam|i[- ]?beam|ipe|channel steel|u channel|angle (steel|bar)|steel angle|structural steel|[cz] purlin|section steel)\b/i },
  { slug: "steel-pipes", test: /\b(steel|seamless|erw|galvanized|square|rectangular|round)\s+(pipe|tube|tubing)s?\b|\bapi 5l\b/i },
  { slug: "concrete-admixtures", test: /(admixture|superplasticizer|water reducer|concrete additive)/i },
  { slug: "mortars-adhesives", test: /(tile adhesive|mortar|grout|thin[- ]?set|skim coat|putty)/i },
  { slug: "portland-cement", test: /\bcement\b/i },
  { slug: "concrete-blocks", test: /(concrete|cement|paving) (block|brick|paver)s?|\bpavers?\b|interlocking (block|brick)/i },
  { slug: "mosaics", test: /\bmosaic/i },
  { slug: "porcelain-tiles", test: /(porcelain|porcelanato|vitrified|polished glazed)/i },
  { slug: "ceramic-wall-tiles", test: /(ceramic|wall) tiles?\b|glazed tile|subway tile/i },
  { slug: "stone-slabs", test: /\b(marble|granite|quartz|travertine|slate|onyx)\b.*\b(slab|tile|countertop|stone)|\bnatural stone\b/i },
  { slug: "upvc-windows", test: /\b(upvc|pvc|vinyl)\s+(\w+\s+)?windows?\b/i },
  { slug: "aluminum-windows", test: /\b(aluminum|aluminium|alloy)\s+(\w+\s+)?(windows?|curtain wall)\b/i },
  { slug: "door-hardware", test: /\b(door (lock|handle|hinge|closer|knob|stopper)|hinges?|lockset)\b/i },
  { slug: "interior-doors", test: /\bdoors?\b/i },
  { slug: "toilets", test: /\b(toilet|water closet|urinal|bidet)s?\b/i },
  { slug: "basins", test: /\b(basin|sink|vanity|lavatory)s?\b/i },
  { slug: "faucets", test: /\b(faucet|mixer tap|taps?|shower (head|set))s?\b/i },
  { slug: "pipes-fittings", test: /\b(pvc|ppr|hdpe|cpvc|upvc|pe) (pipe|fitting|elbow|tee|valve)s?|pipe fittings?|\bvalves?\b/i },
  { slug: "circuit-breakers", test: /(circuit breaker|\bmcb\b|\bmccb\b|\brccb\b|isolator switch)/i },
  { slug: "cables-wires", test: /\b(cable|electric(al)? wire|building wire|copper wire|wire and cable)s?\b/i },
  { slug: "switches-sockets", test: /\b(switch|socket|outlet|plug)(es|s)?\b/i },
  { slug: "led-lighting", test: /\bled\b|\blamps?\b|\bbulbs?\b|downlight|floodlight|luminaire|street light|light fixture|panel light|lighting/i },
  { slug: "power-tools", test: /\b(drills?|grinders?|circular saw|jigsaw|power tools?|impact wrench|nail gun|rotary hammer|sander)\b/i },
  { slug: "hand-tools", test: /\b(hammer|wrench|pliers?|screwdriver|spanner|trowel|chisel|hand tools?|tape measure)s?\b/i },
  { slug: "fasteners", test: /\b(bolt|screw|nut|anchor|rivet|nail|washer|fastener|stud)s?\b/i },
  { slug: "mineral-wool", test: /(rock wool|rockwool|mineral wool|glass wool|stone wool)/i },
  { slug: "foam-boards", test: /\b(xps|eps|polystyrene|foam board|insulation board)\b/i },
  { slug: "roofing-sheets", test: /(roofing|roof sheet|roof tile|corrugated (steel|sheet|metal)|ppgi|color[- ]?coated (steel|sheet))/i },
  { slug: "waterproofing-membranes", test: /(waterproof\w*|membrane|bitumen|geomembrane)/i },
];

function matchRule(text: string): string | null {
  if (NOT_A_MATERIAL.test(text)) return null;
  return RULES.find((rule) => rule.test.test(text))?.slug ?? null;
}

/** El nombre manda; el rubro del sitio solo desempata cuando el nombre no dice nada. */
export function classifyProduct(input: ClassifyInput): string | null {
  if (NOT_A_MATERIAL.test(input.name)) return null;
  return matchRule(input.name) ?? matchRule(input.categoryPath.join(" "));
}
