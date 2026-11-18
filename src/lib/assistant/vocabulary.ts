/**
 * Vocabulario EN/ES que el parser del asistente reconoce. Todas las claves van
 * normalizadas: minúsculas, sin acentos y en singular (ver `singular` en parse.ts).
 */

export type Unit = "m2" | "ton" | "piece" | "bag" | "sheet" | "roll" | "box" | "set";

export const UNIT_WORDS: Readonly<Record<string, Unit>> = {
  m2: "m2", sqm: "m2", "square meter": "m2", "square meters": "m2",
  "metro cuadrado": "m2", "metros cuadrados": "m2",
  ton: "ton", tons: "ton", tonne: "ton", tonnes: "ton", tonelada: "ton", toneladas: "ton",
  piece: "piece", pieces: "piece", pcs: "piece", pieza: "piece", piezas: "piece",
  unit: "piece", units: "piece", unidad: "piece", unidades: "piece",
  bag: "bag", bags: "bag", sack: "bag", sacks: "bag", bolsa: "bag", bolsas: "bag",
  saco: "bag", sacos: "bag",
  sheet: "sheet", sheets: "sheet", plancha: "sheet", planchas: "sheet",
  pano: "sheet", panos: "sheet",
  roll: "roll", rolls: "roll", rollo: "roll", rollos: "roll",
  box: "box", boxes: "box", caja: "box", cajas: "box",
  set: "set", sets: "set", juego: "set", juegos: "set",
};

/** Orden en que se listan los países cuando el pedido excluye alguno. */
export const COUNTRY_CODES = ["CN", "IN", "TW", "TR", "VN"] as const;

export const COUNTRY_WORDS: Readonly<Record<string, string>> = {
  china: "CN", chinese: "CN", chino: "CN",
  india: "IN", indian: "IN", indio: "IN",
  taiwan: "TW", taiwanese: "TW", taiwanes: "TW",
  turkey: "TR", turkiye: "TR", turkish: "TR", turquia: "TR", turco: "TR",
  vietnam: "VN", vietnamese: "VN", vietnamita: "VN",
};

/** Palabras que, hasta tres posiciones antes de un país, lo excluyen. */
export const NEGATION_WORDS: ReadonlySet<string> = new Set([
  "not", "no", "except", "excluding", "without", "avoid",
  "excepto", "sin", "salvo", "evitar", "menos",
]);

export const CERTIFICATION_WORDS: Readonly<Record<string, string>> = {
  iso9001: "ISO9001", iso14001: "ISO14001", ce: "CE", astm: "ASTM", sgs: "SGS", bis: "BIS",
};

export const VERIFIED_WORDS: ReadonlySet<string> = new Set([
  "verified", "verificado", "verificada",
]);

export const PRICE_WORDS: ReadonlySet<string> = new Set([
  "cheap", "cheaper", "cheapest", "price", "cost", "affordable",
  "barato", "barata", "economico", "economica", "precio", "costo",
]);

export const SPEED_WORDS: ReadonlySet<string> = new Set([
  "fast", "faster", "fastest", "quick", "urgent", "asap", "soon", "express",
  "rapido", "rapida", "urgente", "pronto", "plazo",
]);

export const STOP_WORDS: ReadonlySet<string> = new Set([
  // English
  "a", "an", "the", "and", "or", "for", "from", "with", "of", "to", "in", "on", "at",
  "by", "per", "each", "about", "under", "below", "over", "less", "than", "more", "max",
  "maximum", "up", "need", "needs", "want", "looking", "please", "some", "any", "our",
  "my", "your", "this", "that", "these", "those", "buy", "get", "quote", "supplier",
  "suppliers", "product", "products", "project", "hello", "hi", "thanks", "can", "you",
  "me", "we", "what", "which", "how", "best", "good", "quality", "high", "low", "new",
  "also", "only", "just", "like", "would", "could", "should", "is", "are", "be", "have",
  "has", "it", "delivery",
  // Español
  "el", "la", "los", "las", "de", "del", "un", "una", "unos", "unas", "para", "por",
  "con", "que", "en", "al", "se", "sea", "mi", "mis", "su", "sus", "nuestro", "necesito",
  "necesitamos", "quiero", "busco", "buscando", "comprar", "cotizar", "proveedor",
  "proveedores", "producto", "productos", "proyecto", "hola", "gracias", "como", "estas",
  "esta", "este", "estos", "buen", "bueno", "buena", "calidad", "alta", "baja", "mas",
  "hasta", "entrega", "maximo", "cada", "favor",
]);

/**
 * Palabra o frase del material → rubros que puede significar. Si coinciden un
 * rubro y uno de sus subrubros, el parser se queda con el subrubro.
 */
export const CATEGORY_KEYWORDS: Readonly<Record<string, readonly string[]>> = {
  // Cemento y hormigón
  concrete: ["cement-concrete"], hormigon: ["cement-concrete"],
  cement: ["portland-cement"], cemento: ["portland-cement"], portland: ["portland-cement"],
  admixture: ["concrete-admixtures"], aditivo: ["concrete-admixtures"],
  plasticizer: ["concrete-admixtures"], plastificante: ["concrete-admixtures"],
  block: ["concrete-blocks"], bloque: ["concrete-blocks"], paver: ["concrete-blocks"],
  adoquin: ["concrete-blocks"], adoquine: ["concrete-blocks"], brick: ["concrete-blocks"],
  ladrillo: ["concrete-blocks"],
  mortar: ["mortars-adhesives"], mortero: ["mortars-adhesives"],
  adhesive: ["mortars-adhesives"], adhesivo: ["mortars-adhesives"],
  pegamento: ["mortars-adhesives"], grout: ["mortars-adhesives"], pastina: ["mortars-adhesives"],
  // Acero y estructuras
  steel: ["steel-structures"], acero: ["steel-structures"],
  rebar: ["rebar"], hierro: ["rebar"], varilla: ["rebar"], "reinforcing bar": ["rebar"],
  beam: ["structural-sections"], viga: ["structural-sections"],
  perfil: ["structural-sections"], channel: ["structural-sections"],
  mesh: ["welded-mesh"], malla: ["welded-mesh"],
  pipe: ["steel-pipes", "pipes-fittings"], cano: ["steel-pipes", "pipes-fittings"],
  tube: ["steel-pipes"], tubo: ["steel-pipes"],
  // Cerámicos y revestimientos
  tile: ["tiles-ceramics"], baldosa: ["tiles-ceramics"], revestimiento: ["tiles-ceramics"],
  porcelain: ["porcelain-tiles"], porcelanato: ["porcelain-tiles"],
  ceramic: ["ceramic-wall-tiles"], ceramico: ["ceramic-wall-tiles"],
  ceramica: ["ceramic-wall-tiles"], azulejo: ["ceramic-wall-tiles"],
  mosaic: ["mosaics"], mosaico: ["mosaics"], venecita: ["mosaics"],
  marble: ["stone-slabs"], marmol: ["stone-slabs"], granite: ["stone-slabs"],
  granito: ["stone-slabs"], stone: ["stone-slabs"], piedra: ["stone-slabs"],
  // Sanitarios y grifería
  sanitary: ["sanitary-plumbing"], sanitario: ["sanitary-plumbing"],
  plumbing: ["sanitary-plumbing"],
  toilet: ["toilets"], inodoro: ["toilets"], wc: ["toilets"],
  basin: ["basins"], sink: ["basins"], lavatorio: ["basins"], bacha: ["basins"],
  pileta: ["basins"],
  faucet: ["faucets"], tap: ["faucets"], mixer: ["faucets"], grifo: ["faucets"],
  griferia: ["faucets"], canilla: ["faucets"], monocomando: ["faucets"],
  fitting: ["pipes-fittings"], accesorio: ["pipes-fittings"], ppr: ["pipes-fittings"],
  // Aberturas
  window: ["doors-windows"], ventana: ["doors-windows"], abertura: ["doors-windows"],
  "aluminum window": ["aluminum-windows"], "aluminium window": ["aluminum-windows"],
  "ventana de aluminio": ["aluminum-windows"],
  upvc: ["upvc-windows"], "pvc window": ["upvc-windows"], "ventana de pvc": ["upvc-windows"],
  door: ["interior-doors"], puerta: ["interior-doors"],
  hinge: ["door-hardware"], bisagra: ["door-hardware"], handle: ["door-hardware"],
  picaporte: ["door-hardware"], lock: ["door-hardware"], cerradura: ["door-hardware"],
  herraje: ["door-hardware"],
  // Electricidad e iluminación
  electrical: ["electrical-lighting"], electricidad: ["electrical-lighting"],
  iluminacion: ["electrical-lighting"],
  cable: ["cables-wires"], wire: ["cables-wires"], conductor: ["cables-wires"],
  switch: ["switches-sockets"], socket: ["switches-sockets"], outlet: ["switches-sockets"],
  enchufe: ["switches-sockets"], tomacorriente: ["switches-sockets"],
  led: ["led-lighting"], lamp: ["led-lighting"], light: ["led-lighting"],
  luminaria: ["led-lighting"], lampara: ["led-lighting"],
  breaker: ["circuit-breakers"], termica: ["circuit-breakers"],
  termomagnetica: ["circuit-breakers"], disyuntor: ["circuit-breakers"],
  // Herramientas y ferretería
  tool: ["tools-hardware"], herramienta: ["tools-hardware"],
  drill: ["power-tools"], taladro: ["power-tools"], grinder: ["power-tools"],
  amoladora: ["power-tools"], "power tool": ["power-tools"],
  hammer: ["hand-tools"], martillo: ["hand-tools"], wrench: ["hand-tools"],
  screwdriver: ["hand-tools"], destornillador: ["hand-tools"], "hand tool": ["hand-tools"],
  screw: ["fasteners"], tornillo: ["fasteners"], bolt: ["fasteners"], bulon: ["fasteners"],
  anchor: ["fasteners"], anclaje: ["fasteners"], nail: ["fasteners"], clavo: ["fasteners"],
  fastener: ["fasteners"], fijacion: ["fasteners"],
  scaffold: ["scaffolding"], scaffolding: ["scaffolding"], andamio: ["scaffolding"],
  formwork: ["scaffolding"], encofrado: ["scaffolding"],
  // Aislantes y techos
  insulation: ["insulation-roofing"], aislante: ["insulation-roofing"],
  aislacion: ["insulation-roofing"], roof: ["insulation-roofing"], techo: ["insulation-roofing"],
  "mineral wool": ["mineral-wool"], "rock wool": ["mineral-wool"],
  "glass wool": ["mineral-wool"], "lana mineral": ["mineral-wool"],
  "lana de vidrio": ["mineral-wool"], "lana de roca": ["mineral-wool"],
  xps: ["foam-boards"], eps: ["foam-boards"], foam: ["foam-boards"],
  telgopor: ["foam-boards"], poliestireno: ["foam-boards"],
  roofing: ["roofing-sheets"], chapa: ["roofing-sheets"], teja: ["roofing-sheets"],
  "roof sheet": ["roofing-sheets"], corrugated: ["roofing-sheets"],
  membrane: ["waterproofing-membranes"], membrana: ["waterproofing-membranes"],
  waterproofing: ["waterproofing-membranes"], impermeabilizante: ["waterproofing-membranes"],
};
