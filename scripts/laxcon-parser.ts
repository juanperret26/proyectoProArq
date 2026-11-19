/** Producto leído de una página de laxconsteels.com ya convertida a Markdown. */
export interface ScrapedSpec {
  readonly label: string;
  readonly value: string;
}

export interface ScrapedProduct {
  readonly name: string;
  readonly summary: string;
  readonly description: string;
  readonly specs: readonly ScrapedSpec[];
  readonly imageUrl: string | null;
  readonly sourceUrl: string;
  readonly externalId: string;
}

const BLOCK_SEPARATOR = /\n{2,}/;

function blocks(text: string): string[] {
  return text
    .split(BLOCK_SEPARATOR)
    .map((block) => block.trim())
    .filter((block) => block.length > 0);
}

/** Texto de una sección `## ...`, hasta el siguiente `##` o el final. */
function sectionBody(markdown: string, heading: RegExp): string | null {
  const lines = markdown.split("\n");
  const start = lines.findIndex((line) => /^## /.test(line) && heading.test(line));
  if (start === -1) return null;
  const rest = lines.slice(start + 1);
  const end = rest.findIndex((line) => /^## /.test(line));
  return (end === -1 ? rest : rest.slice(0, end)).join("\n");
}

function plainText(markdown: string): string {
  return markdown
    .replace(/!\[[^\]]*\]\([^)]*\)/g, "")
    .replace(/\[([^\]]*)\]\([^)]*\)/g, "$1")
    .replace(/(\*\*|__)(.+?)\1/g, "$2")
    .replace(/[ \t]+/g, " ")
    .trim();
}

function singleLine(block: string): string {
  return plainText(
    block
      .split("\n")
      .map((line) => line.trim())
      .filter((line) => line.length > 0)
      .join(" / "),
  );
}

function pairSpecs(body: string): ScrapedSpec[] {
  const parts = blocks(body);
  const specs: ScrapedSpec[] = [];
  for (let index = 0; index + 1 < parts.length; index += 2) {
    const label = singleLine(parts[index]);
    const value = singleLine(parts[index + 1]);
    if (label && value) specs.push({ label, value });
  }
  return specs;
}

function lastPathSegment(url: string): string {
  const segments = new URL(url).pathname.split("/").filter((part) => part.length > 0);
  return segments[segments.length - 1] ?? "";
}

export function parseLaxconProduct(markdown: string, sourceUrl: string): ScrapedProduct {
  const title = /^# (.+)$/m.exec(markdown);
  if (!title) throw new Error(`Sin título de producto en ${sourceUrl}`);
  const afterTitle = markdown.slice((title.index ?? 0) + title[0].length);

  const summary =
    blocks(afterTitle).find((block) => !/^[[!#]/.test(block)) ?? "";

  const descriptionBody = sectionBody(markdown, /Product Description/i);
  const description = blocks(descriptionBody ?? "")
    .map(plainText)
    .filter((block) => block.length > 0)
    .join("\n\n");
  if (!description) throw new Error(`Sin descripción de producto en ${sourceUrl}`);

  const specsBody = sectionBody(markdown, /Specifications\s*$/i);
  const image = /!\[[^\]]*\]\(([^)\s]+)\)/.exec(afterTitle);

  return {
    name: plainText(title[1]),
    summary: plainText(summary),
    description,
    specs: specsBody ? pairSpecs(specsBody) : [],
    imageUrl: image ? new URL(image[1], sourceUrl).toString() : null,
    sourceUrl,
    externalId: lastPathSegment(sourceUrl),
  };
}
