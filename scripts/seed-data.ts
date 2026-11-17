/**
 * Datos base del catálogo de ejemplo: países, certificaciones, nombres de
 * proveedores ficticios y plantillas de producto por subrubro.
 */

export interface Bilingual {
  en: string;
  es: string;
}

/** Texto igual en ambos idiomas, o par [inglés, español]. */
export type Variant = string | readonly [string, string];

export interface ProductTemplate {
  slug: string;
  baseEn: string;
  baseEs: string;
  unit: string;
  /** Precio base en USD por unidad, antes de ajustes por país y variante. */
  price: number;
  minOrder: number;
  standard: string;
  specLabel: Bilingual;
  variants: readonly Variant[];
}

export interface CountrySeed {
  code: string;
  nameEn: string;
  nameEs: string;
  priceFactor: number;
  leadTimeDays: number;
  cities: readonly string[];
  prefixes: readonly string[];
  suffixes: readonly { name: string; slug: string }[];
}

export const CERTIFICATIONS = [
  { code: "ISO9001", name: "ISO 9001 Quality Management" },
  { code: "ISO14001", name: "ISO 14001 Environmental Management" },
  { code: "CE", name: "CE Marking" },
  { code: "ASTM", name: "ASTM Compliance" },
  { code: "SGS", name: "SGS Tested" },
  { code: "BIS", name: "BIS Certification (India)" },
] as const;

export const COUNTRIES: readonly CountrySeed[] = [
  {
    code: "CN",
    nameEn: "China",
    nameEs: "China",
    priceFactor: 1,
    leadTimeDays: 20,
    cities: ["Foshan", "Tangshan", "Guangzhou", "Qingdao", "Ningbo", "Tianjin"],
    prefixes: ["Huaxin", "Jinde", "Rongsheng", "Haoda", "Zhongtai", "Yuanfeng"],
    suffixes: [
      { name: "Building Materials Co., Ltd.", slug: "building-materials" },
      { name: "Industrial Group", slug: "industrial-group" },
    ],
  },
  {
    code: "IN",
    nameEn: "India",
    nameEs: "India",
    priceFactor: 1.05,
    leadTimeDays: 25,
    cities: ["Morbi", "Ahmedabad", "Pune", "Chennai", "Jaipur", "Kolkata"],
    prefixes: ["Shreeji", "Narmada", "Konark", "Vindhya", "Anand", "Kaveri"],
    suffixes: [
      { name: "Industries Pvt. Ltd.", slug: "industries" },
      { name: "Exports", slug: "exports" },
    ],
  },
  {
    code: "TW",
    nameEn: "Taiwan",
    nameEs: "Taiwán",
    priceFactor: 1.25,
    leadTimeDays: 18,
    cities: ["Taichung", "Kaohsiung", "Tainan", "Taoyuan"],
    prefixes: ["Taiyu", "Chenghua", "Ruizhan", "Yongtai", "Hongjie", "Shengda"],
    suffixes: [
      { name: "Enterprise Co., Ltd.", slug: "enterprise" },
      { name: "Industrial Corp.", slug: "industrial" },
    ],
  },
  {
    code: "TR",
    nameEn: "Turkey",
    nameEs: "Turquía",
    priceFactor: 1.15,
    leadTimeDays: 15,
    cities: ["Istanbul", "Izmir", "Bursa", "Konya", "Kocaeli"],
    prefixes: ["Anadolu", "Ege", "Marmara", "Toros", "Bogaz", "Akdeniz"],
    suffixes: [
      { name: "Yapı A.Ş.", slug: "yapi" },
      { name: "Sanayi Ltd. Şti.", slug: "sanayi" },
    ],
  },
  {
    code: "VN",
    nameEn: "Vietnam",
    nameEs: "Vietnam",
    priceFactor: 0.97,
    leadTimeDays: 22,
    cities: ["Ho Chi Minh City", "Hai Phong", "Binh Duong", "Da Nang"],
    prefixes: ["Viet Phat", "Hoang Gia", "Dai Nam", "Song Hong", "Bao Minh", "Thanh Cong"],
    suffixes: [
      { name: "Materials JSC", slug: "materials" },
      { name: "Trading Co., Ltd.", slug: "trading" },
    ],
  },
];

const label = (en: string, es: string): Bilingual => ({ en, es });

export const PRODUCT_TEMPLATES: readonly ProductTemplate[] = [
  { slug: "portland-cement", baseEn: "Portland cement", baseEs: "Cemento portland", unit: "ton", price: 78, minOrder: 50, standard: "EN 197-1", specLabel: label("Grade", "Clase"), variants: ["CEM I 42.5R", "CEM I 52.5N", "CEM II/A-L 42.5N", "CEM II/B-M 32.5R"] },
  { slug: "concrete-admixtures", baseEn: "Concrete admixture", baseEs: "Aditivo para hormigón", unit: "ton", price: 620, minOrder: 5, standard: "EN 934-2", specLabel: label("Type", "Tipo"), variants: [["superplasticizer", "superplastificante"], ["water reducer", "reductor de agua"], ["set retarder", "retardador de fraguado"], ["waterproofing", "hidrófugo"]] },
  { slug: "concrete-blocks", baseEn: "Concrete block", baseEs: "Bloque de hormigón", unit: "piece", price: 0.55, minOrder: 5000, standard: "EN 771-3", specLabel: label("Size", "Medida"), variants: ["400x200x200 mm", "400x200x150 mm", "400x200x100 mm", "200x100x60 mm paver"] },
  { slug: "mortars-adhesives", baseEn: "Tile adhesive 25 kg bag", baseEs: "Adhesivo cerámico bolsa 25 kg", unit: "bag", price: 5.2, minOrder: 500, standard: "EN 12004", specLabel: label("Class", "Clase"), variants: [["C1 standard", "C1 estándar"], ["C2 improved", "C2 mejorado"], ["C2TE flexible", "C2TE flexible"], ["C2S1 deformable", "C2S1 deformable"]] },
  { slug: "rebar", baseEn: "Reinforcing bar", baseEs: "Barra de acero para hormigón", unit: "ton", price: 560, minOrder: 25, standard: "ASTM A615 / BS 4449", specLabel: label("Diameter", "Diámetro"), variants: ["Ø10 mm B500B", "Ø12 mm B500B", "Ø16 mm B500B", "Ø20 mm B500B"] },
  { slug: "structural-sections", baseEn: "Structural steel section", baseEs: "Perfil de acero estructural", unit: "ton", price: 720, minOrder: 20, standard: "EN 10025", specLabel: label("Section", "Perfil"), variants: ["IPE 200", "HEB 160", "UPN 140", ["angle 50x50x5 mm", "ángulo 50x50x5 mm"]] },
  { slug: "welded-mesh", baseEn: "Welded wire mesh sheet", baseEs: "Malla electrosoldada en paño", unit: "sheet", price: 38, minOrder: 200, standard: "ASTM A1064", specLabel: label("Mesh", "Malla"), variants: ["Ø6 mm 150x150 mm", "Ø5 mm 100x100 mm", "Ø8 mm 200x200 mm", "Ø4 mm 50x50 mm"] },
  { slug: "steel-pipes", baseEn: "Steel pipe", baseEs: "Caño de acero", unit: "ton", price: 690, minOrder: 15, standard: "ASTM A53 / EN 10219", specLabel: label("Size", "Medida"), variants: [["DN50 galvanized", "DN50 galvanizado"], ["DN100 black", "DN100 negro"], ["60x60x3 mm square", "60x60x3 mm cuadrado"], ["114 mm seamless", "114 mm sin costura"]] },
  { slug: "porcelain-tiles", baseEn: "Porcelain tile", baseEs: "Porcelanato", unit: "m2", price: 9.5, minOrder: 500, standard: "ISO 13006", specLabel: label("Size", "Formato"), variants: [["600x600 mm matt", "600x600 mm mate"], ["800x800 mm polished", "800x800 mm pulido"], ["600x1200 mm glazed", "600x1200 mm esmaltado"], ["300x600 mm wood-look", "300x600 mm símil madera"]] },
  { slug: "ceramic-wall-tiles", baseEn: "Ceramic wall tile", baseEs: "Cerámico de pared", unit: "m2", price: 6.2, minOrder: 800, standard: "ISO 13006", specLabel: label("Size", "Formato"), variants: [["300x600 mm white gloss", "300x600 mm blanco brillante"], ["250x400 mm beige matt", "250x400 mm beige mate"], ["300x300 mm patterned", "300x300 mm con diseño"], ["75x150 mm subway", "75x150 mm tipo subway"]] },
  { slug: "mosaics", baseEn: "Mosaic tile", baseEs: "Mosaico", unit: "m2", price: 28, minOrder: 100, standard: "ISO 10545", specLabel: label("Material", "Material"), variants: [["glass 300x300 mm", "de vidrio 300x300 mm"], ["marble hexagon", "hexagonal de mármol"], ["porcelain 300x300 mm", "de porcelana 300x300 mm"], ["stainless steel strips", "con tiras de acero inoxidable"]] },
  { slug: "stone-slabs", baseEn: "Natural stone slab", baseEs: "Placa de piedra natural", unit: "m2", price: 48, minOrder: 50, standard: "EN 1469", specLabel: label("Stone", "Piedra"), variants: [["Carrara marble 20 mm", "mármol Carrara 20 mm"], ["black granite 30 mm", "granito negro 30 mm"], ["sandstone 25 mm", "arenisca 25 mm"], ["travertine 20 mm", "travertino 20 mm"]] },
  { slug: "toilets", baseEn: "Toilet", baseEs: "Inodoro", unit: "piece", price: 42, minOrder: 100, standard: "EN 997", specLabel: label("Type", "Tipo"), variants: [["two-piece S-trap", "dos piezas descarga horizontal"], ["one-piece washdown", "monobloque"], ["wall-hung rimless", "colgante sin borde"], ["close-coupled P-trap", "con mochila descarga vertical"]] },
  { slug: "basins", baseEn: "Basin", baseEs: "Lavatorio", unit: "piece", price: 25, minOrder: 100, standard: "EN 14688", specLabel: label("Mounting", "Montaje"), variants: [["countertop 500 mm", "de apoyar 500 mm"], ["pedestal 550 mm", "con pedestal 550 mm"], ["wall-hung 600 mm", "colgante 600 mm"], ["stainless sink 800x450 mm", "bacha de acero inoxidable 800x450 mm"]] },
  { slug: "faucets", baseEn: "Faucet", baseEs: "Grifería", unit: "piece", price: 14, minOrder: 200, standard: "EN 817", specLabel: label("Style", "Estilo"), variants: [["single-lever basin", "monocomando de lavatorio"], ["kitchen pull-out", "de cocina extraíble"], ["bath shower mixer", "mezcladora de ducha y baño"], ["wall-mounted", "de pared"]] },
  { slug: "pipes-fittings", baseEn: "Plumbing fitting", baseEs: "Accesorio sanitario", unit: "piece", price: 1.8, minOrder: 2000, standard: "ISO 15874", specLabel: label("Item", "Artículo"), variants: [["PPR elbow 25 mm", "codo PPR 25 mm"], ["PVC-U pipe 110 mm", "caño PVC-U 110 mm"], ["brass ball valve 1/2 in", "válvula esférica de bronce 1/2 in"], ["PEX pipe 20 mm", "caño PEX 20 mm"]] },
  { slug: "aluminum-windows", baseEn: "Aluminum window", baseEs: "Ventana de aluminio", unit: "m2", price: 85, minOrder: 50, standard: "EN 14351-1", specLabel: label("Opening", "Apertura"), variants: [["sliding double glazed", "corrediza doble vidrio"], ["casement thermal break", "abatible con rotura de puente térmico"], ["fixed panel", "paño fijo"], ["tilt and turn", "oscilobatiente"]] },
  { slug: "upvc-windows", baseEn: "uPVC window", baseEs: "Ventana de PVC", unit: "m2", price: 70, minOrder: 50, standard: "EN 14351-1", specLabel: label("Opening", "Apertura"), variants: [["sliding double glazed", "corrediza doble vidrio"], ["casement 5-chamber", "abatible de 5 cámaras"], ["tilt and turn", "oscilobatiente"], ["fixed panel", "paño fijo"]] },
  { slug: "interior-doors", baseEn: "Interior door", baseEs: "Puerta de interior", unit: "piece", price: 55, minOrder: 100, standard: "EN 14351-2", specLabel: label("Finish", "Terminación"), variants: [["solid wood flush", "de madera maciza lisa"], ["molded HDF", "de HDF moldeada"], ["glass panel", "con paño de vidrio"], ["fire-rated FD30", "cortafuego FD30"]] },
  { slug: "door-hardware", baseEn: "Door hardware", baseEs: "Herraje para puertas", unit: "set", price: 9, minOrder: 300, standard: "EN 1906", specLabel: label("Item", "Artículo"), variants: [["lever handle set", "juego de manija"], ["mortise lock", "cerradura embutida"], ["stainless hinges 4 in", "bisagras de acero inoxidable 4 in"], ["door closer", "cierrapuertas"]] },
  { slug: "cables-wires", baseEn: "Electric cable 100 m roll", baseEs: "Cable eléctrico rollo 100 m", unit: "roll", price: 38, minOrder: 100, standard: "IEC 60227", specLabel: label("Section", "Sección"), variants: [["1.5 mm² single core", "1,5 mm² unipolar"], ["2.5 mm² single core", "2,5 mm² unipolar"], ["4 mm² single core", "4 mm² unipolar"], ["3x2.5 mm² flexible", "3x2,5 mm² flexible"]] },
  { slug: "switches-sockets", baseEn: "Wall switch & socket", baseEs: "Llave y tomacorriente", unit: "piece", price: 1.9, minOrder: 1000, standard: "IEC 60669", specLabel: label("Model", "Modelo"), variants: [["1-gang switch", "llave de un punto"], ["2-gang switch", "llave de dos puntos"], ["universal socket", "tomacorriente universal"], ["socket with USB", "tomacorriente con USB"]] },
  { slug: "led-lighting", baseEn: "LED light", baseEs: "Luminaria LED", unit: "piece", price: 6.5, minOrder: 500, standard: "IEC 62031", specLabel: label("Type", "Tipo"), variants: [["panel 600x600 mm 40 W", "panel 600x600 mm 40 W"], ["downlight 12 W", "empotrable 12 W"], ["high bay 150 W", "campana industrial 150 W"], ["strip 12 V 5 m", "tira 12 V 5 m"]] },
  { slug: "circuit-breakers", baseEn: "Circuit breaker", baseEs: "Interruptor termomagnético", unit: "piece", price: 2.6, minOrder: 500, standard: "IEC 60898-1", specLabel: label("Rating", "Calibre"), variants: ["MCB 1P 16 A", "MCB 2P 32 A", "MCB 3P 63 A", "RCBO 2P 25 A 30 mA"] },
  { slug: "power-tools", baseEn: "", baseEs: "", unit: "piece", price: 48, minOrder: 100, standard: "EN 62841", specLabel: label("Model", "Modelo"), variants: [["Cordless drill 18 V", "Taladro inalámbrico 18 V"], ["Angle grinder 850 W", "Amoladora angular 850 W"], ["Rotary hammer 800 W", "Martillo rotativo 800 W"], ["Circular saw 1200 W", "Sierra circular 1200 W"]] },
  { slug: "hand-tools", baseEn: "", baseEs: "", unit: "piece", price: 4.5, minOrder: 500, standard: "", specLabel: label("Model", "Modelo"), variants: [["Claw hammer 500 g", "Martillo de uña 500 g"], ["Adjustable wrench 250 mm", "Llave ajustable 250 mm"], ["Tape measure 5 m", "Cinta métrica 5 m"], ["Masonry trowel 200 mm", "Cuchara de albañil 200 mm"]] },
  { slug: "fasteners", baseEn: "", baseEs: "", unit: "box", price: 6, minOrder: 200, standard: "ISO 4014", specLabel: label("Model", "Modelo"), variants: [["Hex bolt M12x80", "Bulón hexagonal M12x80"], ["Wedge anchor M10x100", "Anclaje de cuña M10x100"], ["Self-drilling screw 4.8x38", "Tornillo autoperforante 4,8x38"], ["Chemical anchor capsule M12", "Cápsula de anclaje químico M12"]] },
  { slug: "scaffolding", baseEn: "", baseEs: "", unit: "set", price: 36, minOrder: 100, standard: "EN 12810", specLabel: label("Model", "Modelo"), variants: [["Ringlock standard 2 m", "Vertical Ringlock 2 m"], ["Frame scaffold 1.7 m", "Andamio tubular 1,7 m"], ["Steel prop 3.5 m", "Puntal metálico 3,5 m"], ["Phenolic formwork panel 18 mm", "Panel de encofrado fenólico 18 mm"]] },
  { slug: "mineral-wool", baseEn: "Mineral wool", baseEs: "Lana mineral", unit: "m2", price: 3.8, minOrder: 1000, standard: "EN 13162", specLabel: label("Form", "Formato"), variants: [["board 50 mm", "placa 50 mm"], ["roll 100 mm", "rollo 100 mm"], ["pipe section 40 mm", "coquilla 40 mm"], ["glass wool 75 mm", "de vidrio 75 mm"]] },
  { slug: "foam-boards", baseEn: "Foam insulation board", baseEs: "Placa aislante de espuma", unit: "m2", price: 4.2, minOrder: 800, standard: "EN 13164", specLabel: label("Type", "Tipo"), variants: ["XPS 30 mm", "XPS 50 mm", "EPS 100 mm", [ "EPS graphite 80 mm", "EPS con grafito 80 mm"]] },
  { slug: "roofing-sheets", baseEn: "Roofing sheet", baseEs: "Chapa para techo", unit: "m2", price: 5.4, minOrder: 1000, standard: "EN 14782", specLabel: label("Profile", "Perfil"), variants: [["galvanized corrugated 0.4 mm", "galvanizada acanalada 0,4 mm"], ["color-coated trapezoidal 0.5 mm", "prepintada trapezoidal 0,5 mm"], ["polycarbonate 6 mm", "de policarbonato 6 mm"], ["metal tile profile", "perfil tipo teja metálica"]] },
  { slug: "waterproofing-membranes", baseEn: "Waterproofing membrane", baseEs: "Membrana impermeabilizante", unit: "roll", price: 22, minOrder: 200, standard: "EN 13707", specLabel: label("Type", "Tipo"), variants: [["APP bitumen 4 mm", "asfáltica APP 4 mm"], ["SBS bitumen 3 mm", "asfáltica SBS 3 mm"], ["PVC 1.5 mm", "de PVC 1,5 mm"], ["liquid polyurethane 20 kg", "poliuretano líquido 20 kg"]] },
];
