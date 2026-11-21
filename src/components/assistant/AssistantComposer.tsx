"use client";

import { ArrowUp, Plus } from "lucide-react";
import Form from "next/form";
import { useRef, type ChangeEvent, type KeyboardEvent } from "react";

type Props = {
  /** Ruta a la que se envía el pedido, con el idioma incluido. */
  action: string;
  defaultValue: string;
  placeholder: string;
  /** Etiqueta accesible del campo (no se muestra). */
  label: string;
  submitLabel: string;
  /** Texto del botón "+" que vacía la caja para escribir un pedido nuevo. */
  clearLabel: string;
  hint: string;
  maxLength: number;
};

/** Cuántas líneas crece la caja antes de mostrar scroll. */
const MAX_HEIGHT_PX = 200;

/** Caja de texto del asistente. Enter envía el pedido; Mayús + Enter agrega una línea. */
export function AssistantComposer({
  action,
  defaultValue,
  placeholder,
  label,
  submitLabel,
  clearLabel,
  hint,
  maxLength,
}: Props) {
  const formRef = useRef<HTMLFormElement>(null);
  const textRef = useRef<HTMLTextAreaElement>(null);

  function fit(element: HTMLTextAreaElement) {
    element.style.height = "auto";
    element.style.height = `${Math.min(element.scrollHeight, MAX_HEIGHT_PX)}px`;
  }

  function handleChange(event: ChangeEvent<HTMLTextAreaElement>) {
    fit(event.currentTarget);
  }

  function handleKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key !== "Enter" || event.shiftKey || event.nativeEvent.isComposing) return;
    event.preventDefault();
    if (event.currentTarget.value.trim() !== "") formRef.current?.requestSubmit();
  }

  function handleClear() {
    const element = textRef.current;
    if (!element) return;
    element.value = "";
    fit(element);
    element.focus();
  }

  return (
    <Form
      ref={formRef}
      action={action}
      className="rounded-[28px] bg-[#fffffe] p-3 shadow-[0_0_0_1px_rgba(0,0,0,0.08),0_25px_50px_-12px_rgba(0,0,0,0.25)] focus-within:shadow-[0_0_0_2px_var(--color-blueline),0_25px_50px_-12px_rgba(0,0,0,0.25)]"
    >
      <label htmlFor="assistant-q" className="sr-only">
        {label}
      </label>
      <textarea
        ref={textRef}
        id="assistant-q"
        name="q"
        rows={1}
        defaultValue={defaultValue}
        maxLength={maxLength}
        placeholder={placeholder}
        autoComplete="off"
        enterKeyHint="search"
        aria-describedby="assistant-hint"
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        className="block max-h-[200px] w-full resize-none bg-transparent px-2 pt-1.5 text-[1rem] leading-snug text-ink outline-none placeholder:text-black/50"
      />
      <div className="mt-3 flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={handleClear}
          aria-label={clearLabel}
          title={clearLabel}
          className="grid size-8 shrink-0 place-items-center rounded-full border border-black/10 text-black/50 transition-colors hover:border-black/25 hover:text-black"
        >
          <Plus className="size-4" aria-hidden="true" />
        </button>
        <p id="assistant-hint" className="min-w-0 flex-1 text-right text-[0.8125rem] text-black/50">
          {hint}
        </p>
        <button
          type="submit"
          aria-label={submitLabel}
          title={submitLabel}
          className="grid size-8 shrink-0 place-items-center rounded-full bg-[#1c1c1c] text-white transition-colors hover:bg-blueline focus-visible:outline-offset-2"
        >
          <ArrowUp className="size-4" aria-hidden="true" />
        </button>
      </div>
    </Form>
  );
}
