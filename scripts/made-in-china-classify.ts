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

interface Rule {
  readonly slug: string;
  readonly test: RegExp;
}

/** Maquinaria y vehículos. Se miran primero: una "máquina de doblar encofrados" no es un encofrado. */
const MACHINE_RULES: readonly Rule[] = [
  { slug: "cranes", test: /\bcranes?\b/i },
  { slug: "forklifts", test: /\bforklifts?\b/i },
  { slug: "lifting-equipment", test: /\b(elevators?|hoists?|funicular|lifts?)\b/i },
  { slug: "drilling-rigs", test: /\bdrill(ing)? rigs?\b|\brotary drill\w*/i },
  { slug: "concrete-machinery", test: /\b(concrete (mixer|pump|batching|mixing|machinery)|batching plant|mixing (plant|station)|cement mixing|mixer)\b/i },
  { slug: "earthmoving-machinery", test: /\b(excavators?|loaders?|bulldozers?|compactors?|rollers?|graders?|backhoe|skid steer|mining|engineering (and |& )?construction machinery)\b/i },
  { slug: "trailers", test: /\btrailers?\b/i },
  { slug: "vehicle-parts", test: /\b(tires?|tyres?|railway|railroad|turnout|wheels?|auto parts?)\b/i },
  { slug: "trucks", test: /\b(trucks?|tipper|dump|tractor|specialized vehicle|vehicle)\b/i },
  { slug: "building-material-machines", test: /\b(purlin|roll forming|machines?|machinery)\b/i },
  { slug: "machinery-parts", test: /^(?!.*\b(formwork|scaffold\w*)\b).*\b(hydraulic|solenoid|swivel joint|counterbalance|bearings?|compressors?|engines?|generators?|boilers?|motors?|pumps?)\b/i },
];

/** Reglas en orden: gana la primera que coincide, así que van de lo específico a lo general. */
const MATERIAL_RULES: readonly Rule[] = [
  { slug: "scaffolding", test: /\b(formwork|scaffold\w*|shuttering|steel prop|acrow|ringlock|cuplock|jack base|u[- ]?head|tie rod|falsework|trench box)\b/i },
  { slug: "container-houses", test: /\bcontainer (house|home|office)s?\b|\bprefab(ricated)? (container|house)\b/i },
  { slug: "steel-structure-buildings", test: /\b(steel structure|steel frame (building|structure)|portal frame|peb|steel building|hangar|workshop|warehouse)\b/i },
  { slug: "prefab-houses", test: /\b(prefab\w*|villa|modular (house|home|building)|light steel (house|villa))\b/i },
  { slug: "welded-mesh", test: /\b(welded|wire)\s+(wire\s+)?mesh\b|\bfenc(e|es|ing)\b/i },
  { slug: "rebar", test: /\b(rebar|re-bar|deformed (steel )?bar|reinforc\w*\s+(steel\s+)?bar|strand)/i },
  { slug: "structural-sections", test: /\b(h[- ]?beam|i[- ]?beam|ipe|channel steel|steel channel|channel bar|u channel|angle (steel|bar)|steel angle|structural steel|[cz] purlin|section steel)\b/i },
  { slug: "steel-pipes", test: /\b(steel|seamless|erw|galvanized|square|rectangular|round)\s+(pipe|tube|tubing)s?\b|\bapi 5l\b|\b(ductile )?iron pipes?\b/i },
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
  { slug: "metal-coils-strips", test: /\b(coils?|strips?)\b/i },
  { slug: "roofing-sheets", test: /(roofing|roof sheet|roof tile|corrugated (steel|sheet|metal)|ppgi|color[- ]?coated (steel|sheet))/i },
  { slug: "metal-coils-strips", test: /\b(steel|stainless|galvanized)\s+(\w+\s+)*(sheets?|plates?)\b|stainless steel wire/i },
  { slug: "non-ferrous-metals", test: /\b(aluminum|aluminium|copper)\s+(\w+\s+)*(sheets?|plates?|profiles?|foil|tubes?|bars?|rods?|wire|alloy)\b|\bbrass\b/i },
  { slug: "timber-plywood", test: /\b(timber|plywood|lumber|mdf|osb|veneer|blockboard|hardwood|softwood)\b/i },
  { slug: "adhesives-sealants", test: /\b(adhesives?|sealants?|glues?|silicone|pu foam|polyurethane foam)\b/i },
  { slug: "paints-coatings", test: /\b(paints?|coatings?|primer|lacquer|varnish)\b/i },
  { slug: "waterproofing-membranes", test: /(waterproof\w*|membrane|bitumen|geomembrane)/i },
  { slug: "industrial-chemicals", test: /\b(chemicals?|sodium|calcium|chloride|sulfate|sulphate|acid|caustic|silicate|fertilizer|reagent|resin)\b/i },
];

function matchRules(rules: readonly Rule[], text: string): string | null {
  return rules.find((rule) => rule.test.test(text))?.slug ?? null;
}

/** El nombre manda; el rubro del sitio solo desempata cuando el nombre no dice nada. */
export function classifyProduct(input: ClassifyInput): string | null {
  const path = input.categoryPath.join(" ");
  return (
    matchRules(MACHINE_RULES, input.name) ??
    matchRules(MATERIAL_RULES, input.name) ??
    matchRules(MACHINE_RULES, path) ??
    matchRules(MATERIAL_RULES, path)
  );
}
