/**
 * Datos curados a mano que el CSV de Made-in-China no trae. Fuente: la página
 * de perfil de cada empresa en Made-in-China.com (leída el 2026-11-19) y, para
 * las certificaciones de Bright Link, la columna del CSV.
 *
 * Solo se anota lo que la página afirma. Si no lo dice, queda en null.
 */
import type { SupplierProfile } from "./made-in-china-parser";

/** Perfiles de empresa por company_id. */
export const SUPPLIER_PROFILES: Readonly<Record<string, SupplierProfile>> = {
  // Foshan Jts Building Materials Co., Ltd. Fabricante; no publica año de fundación.
  uFwGyUlHnpIi: {
    city: "Foshan",
    businessType: "manufacturer",
    foundedYear: null,
    certifications: ["ISO9001", "ISO14001", "CE"],
  },
  // Foshan Shengkailo Building Materials Co., Ltd. Fabricante, fundada en 2014.
  GZoaOPtuJzHJ: {
    city: "Foshan",
    businessType: "manufacturer",
    foundedYear: 2014,
    certifications: [],
  },
  // Foshan Bright Link Ceramics Co., Ltd. Fabricante; "Export Year 2014" no es el año de fundación.
  UdsfAxbCCrDB: {
    city: "Foshan",
    businessType: "manufacturer",
    foundedYear: null,
    certifications: ["ISO9001"],
  },
  // Zibo Zenitile Ceramics Co., Limited. La página no dice si fabrica o comercializa:
  // se presenta como exportadora que coopera con fábricas, por eso se carga como
  // empresa comercializadora. Es una inferencia: confirmar con el proveedor.
  wqfJoHgzJeYm: {
    city: "Zibo",
    businessType: "trading_company",
    foundedYear: null,
    certifications: [],
  },
};

/** Nombre en español por product_id (el CSV solo trae inglés). */
export const PRODUCT_NAMES_ES: Readonly<Record<string, string>> = {
  qGbUzWLVsRkQ:
    "Porcelanato de arena dorada brillante 600x1200 mm, diseño moderno, para hotel y villa",
  UfORSrLTvYVP:
    "Porcelanato rústico efecto mármol 600x600 mm para pisos, diseño moderno, decoración de departamentos",
  qGzUngWdhpVO:
    "Porcelanato efecto mármol amarillo brillante 60x60 cm para pisos de living y cocina",
  tEmRHaprNJAh:
    "Porcelanato esmaltado Skelo 600x1200 mm, blanco crema efecto mármol y madera, para pisos y paredes de cocina",
  nUERphrvVOkG:
    "Porcelanato esmaltado brillante Skelo 6.0 súper blanco 600x1200 mm, efecto mármol, para pisos y paredes de ambientes de estar",
  NUQYMXwklecq:
    "Porcelanato rústico antideslizante mate 600x1200 mm, 12 mm de espesor, R9 R10 R11, para pisos y pavimentos",
  hpyRutdCnWVY:
    "Porcelanato rústico antideslizante mate 600x600 mm, 12 mm de espesor, R10 R11, para pisos y pavimentos",
  jditEsuMkOaC:
    "Porcelanato esmaltado brillante Skelo 6.0 súper blanco 600x1200 mm, efecto mármol, para hotel, fabricación OEM y ODM a pedido",
  tRJUGKFDYqWh:
    "Porcelanato rústico antideslizante mate 600x1200 mm, 12 mm de espesor, R9 a R11, para pisos y pavimentos",
  KQZRqsdVLxpS: "Porcelanato gris efecto mármol 600x1200 mm para pisos",
};
