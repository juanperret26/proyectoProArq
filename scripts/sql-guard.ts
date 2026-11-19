/**
 * Guarda para los SQL de carga de datos: solo se permiten inserciones y
 * actualizaciones. Se revisa el código y no el contenido de los textos, que
 * pueden nombrar cualquier palabra ("delete", "drop"…).
 */
const FORBIDDEN = /\b(drop|truncate|delete|alter|grant|revoke|create)\b/i;

function withoutCommentsAndStrings(sql: string): string {
  return sql
    .split("\n")
    .filter((line) => !line.trimStart().startsWith("--"))
    .join("\n")
    .replace(/'(?:[^']|'')*'/g, "''");
}

export function assertInsertOnlySql(sql: string): void {
  const match = FORBIDDEN.exec(withoutCommentsAndStrings(sql));
  if (match) throw new Error(`Sentencia no permitida en una carga de datos: "${match[1]}".`);
}
