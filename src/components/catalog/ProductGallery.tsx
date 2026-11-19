"use client";

import Image from "next/image";
import { useTranslations } from "next-intl";
import { useState } from "react";

type Props = {
  /** URLs ya filtradas con `displayableImages`. Debe haber al menos una. */
  images: readonly string[];
  alt: string;
};

export function ProductGallery({ images, alt }: Props) {
  const t = useTranslations("product");
  const [selected, setSelected] = useState(0);
  const current = images[selected] ?? images[0];

  return (
    <div className="flex flex-col gap-3">
      <div className="relative h-80 border border-rule bg-vellum sm:h-[26rem]">
        <Image
          src={current}
          alt={alt}
          fill
          priority
          sizes="(min-width: 1024px) 55vw, 100vw"
          className="object-contain"
        />
      </div>
      {images.length > 1 ? (
        <ul className="grid grid-cols-4 gap-2 sm:grid-cols-6">
          {images.map((src, index) => (
            <li key={src}>
              <button
                type="button"
                onClick={() => setSelected(index)}
                aria-pressed={index === selected}
                aria-label={t("photoOf", { position: index + 1, total: images.length })}
                className={`relative block aspect-square w-full overflow-hidden border bg-vellum ${
                  index === selected ? "border-blueline" : "border-rule hover:border-ink-soft"
                }`}
              >
                <Image src={src} alt="" fill sizes="120px" className="object-cover" />
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
