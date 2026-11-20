"use client";

import { Menu, X } from "lucide-react";
import {
  useEffect,
  useId,
  useRef,
  useState,
  type MouseEvent,
  type ReactNode,
} from "react";
import { Link } from "@/i18n/navigation";

type CategoryMenuItem = {
  slug: string;
  label: string;
};

type Props = {
  items: readonly CategoryMenuItem[];
  openLabel: string;
  closeLabel: string;
  navLabel: string;
  /** Enlaces extra que solo se muestran en pantallas chicas. */
  children?: ReactNode;
};

const ITEM_LINK =
  "block py-2.5 text-[0.9375rem] leading-5 text-ink-soft underline-offset-4 hover:text-blueline hover:underline";

/**
 * Botón de tres líneas que despliega todos los rubros del catálogo.
 * Se cierra con Escape, al hacer clic fuera o al elegir un enlace.
 */
export function CategoryMenu({
  items,
  openLabel,
  closeLabel,
  navLabel,
  children,
}: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const panelId = useId();

  function handlePanelClick(event: MouseEvent<HTMLElement>) {
    if ((event.target as HTMLElement).closest("a")) setIsOpen(false);
  }

  useEffect(() => {
    if (!isOpen) return;

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setIsOpen(false);
    }
    function handlePointerDown(event: PointerEvent) {
      if (!containerRef.current?.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    document.addEventListener("pointerdown", handlePointerDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("pointerdown", handlePointerDown);
    };
  }, [isOpen]);

  const Icon = isOpen ? X : Menu;

  return (
    <div ref={containerRef} className="shrink-0">
      <button
        type="button"
        onClick={() => setIsOpen((open) => !open)}
        aria-expanded={isOpen}
        aria-controls={panelId}
        aria-label={isOpen ? closeLabel : openLabel}
        className="btn btn-quiet min-[1400px]:absolute min-[1400px]:left-6 min-[1400px]:top-1/2 min-[1400px]:-translate-y-1/2"
      >
        <Icon className="size-5" aria-hidden="true" />
      </button>

      {isOpen && (
        <nav
          id={panelId}
          aria-label={navLabel}
          onClick={handlePanelClick}
          className="absolute inset-x-0 top-full z-50 border-y border-rule bg-paper shadow-lg"
        >
          <div className="mx-auto max-w-[1240px] px-4 py-3 sm:px-6">
            {children && (
              <ul className="mb-2 border-b border-rule pb-2 font-semibold lg:hidden">
                {children}
              </ul>
            )}
            <ul className="grid gap-x-8 sm:grid-cols-2 lg:grid-cols-3">
              {items.map((item) => (
                <li key={item.slug}>
                  <Link
                    href={`/categories/${item.slug}`}
                    className={ITEM_LINK}
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </nav>
      )}
    </div>
  );
}
