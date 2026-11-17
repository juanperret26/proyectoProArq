import type { ReactNode } from "react";

export const INPUT_CLASS =
  "min-h-11 w-full border border-ink bg-paper px-3 py-2 aria-[invalid=true]:border-red-700";

type Props = {
  id: string;
  label: string;
  error?: string;
  hint?: string;
  children: (props: { id: string; invalid: boolean; describedBy?: string }) => ReactNode;
};

/** Etiqueta, campo y mensaje de error enlazados para lectores de pantalla. */
export function FormField({ id, label, error, hint, children }: Props) {
  const describedBy = error ? `${id}-error` : hint ? `${id}-hint` : undefined;
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="font-semibold">
        {label}
      </label>
      {children({ id, invalid: Boolean(error), describedBy })}
      {error ? (
        <p id={`${id}-error`} className="text-[0.9375rem] text-red-700">
          {error}
        </p>
      ) : hint ? (
        <p id={`${id}-hint`} className="text-[0.9375rem] text-ink-soft">
          {hint}
        </p>
      ) : null}
    </div>
  );
}
