import { notFound } from "next/navigation";

// Esta ruta solo existe para responder 404, así que no tiene una vista
// previa instantánea que validar.
export const instant = false;

/** Cualquier ruta desconocida dentro de un idioma muestra el 404 traducido. */
export default function UnknownRoutePage(): never {
  notFound();
}
