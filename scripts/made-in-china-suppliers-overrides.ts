/**
 * Ciudades corregidas a mano para los proveedores cuyo registro del sitio trae
 * campos desordenados. Cada una sale de la dirección que el propio proveedor
 * publica; no se agrega nada que la dirección no diga, salvo la provincia
 * cuando la ciudad la determina sin ambigüedad.
 */
import type { Location } from "./made-in-china-suppliers";

export const LOCATION_OVERRIDES: Readonly<Record<string, Location>> = {
  // "Tengzhou City, 500 Metres East and 500 Metres South": el campo ciudad trae una calle.
  rotarydrillingrig: { city: "Tengzhou", province: "Shandong" },
  // Dirección "Zhenzhou Henan": error de tipeo de Zhengzhou.
  hengyoumachine: { city: "Zhengzhou", province: "Henan" },
  // "Yun County Economic Development Zone Shiyan, Hubei".
  hbqzcrane: { city: "Shiyan", province: "Hubei" },
  // "Xiamen Area (Free Trade Port Area), China (Fujian) Pilot Free Trade Zone".
  frametec: { city: "Xiamen", province: "Fujian" },
  // "…National Highway 205 and National Highway 327 in Linyi Economic Development Zone".
  huaxiacrane: { city: "Linyi", province: "Shandong" },
  // "…Located in Jinnan District, Tianjin, China": el campo ciudad trae una frase.
  junmaiyuan: { city: "Tianjin", province: null },
};
