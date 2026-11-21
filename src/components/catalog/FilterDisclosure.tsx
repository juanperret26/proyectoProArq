"use client";

import { ChevronDown } from "lucide-react";
import { useId, useState, type ReactNode } from "react";

type Props = {
  /** Texto del botón que muestra u oculta los filtros en pantallas chicas. */
  label: string;
  children: ReactNode;
};

/**
 * En pantallas chicas los filtros arrancan ocultos para que se vean primero los
 * productos; en pantallas grandes siempre están visibles y el botón no aparece.
 */
export function FilterDisclosure({ label, children }: Props) {
  const [open, setOpen] = useState(false);
  const panelId = useId();

  return (
    <div>
      <button
        type="button"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen((value) => !value)}
        className="btn btn-outline flex w-full items-center justify-between lg:hidden"
      >
        {label}
        <ChevronDown
          className={`size-5 transition-transform ${open ? "rotate-180" : ""}`}
          aria-hidden="true"
        />
      </button>
      <div id={panelId} className={`${open ? "mt-4" : "hidden"} lg:mt-0 lg:block`}>
        {children}
      </div>
    </div>
  );
}
