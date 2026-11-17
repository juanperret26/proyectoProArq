"use client";

import { useTranslations } from "next-intl";
import { useActionState } from "react";

import { createRfq, type FormState } from "@/lib/account/actions";
import { MESSAGE_MAX_LENGTH } from "@/lib/account/validation";

import { FormField, INPUT_CLASS } from "./FormField";

const INITIAL: FormState = { status: "idle" };

type Props = { productId: string; locale: string; unit: string; minOrder: number };

export function RfqForm({ productId, locale, unit, minOrder }: Props) {
  const t = useTranslations("rfq");
  const a = useTranslations("account");
  const [state, formAction, pending] = useActionState(createRfq, INITIAL);
  const errors = state.status === "error" ? state.errors : {};
  const message = (field: string) => {
    const code = errors[field];
    return code ? a(`errors.${code}`) : undefined;
  };

  return (
    <form action={formAction} className="flex max-w-xl flex-col gap-5" noValidate>
      <input type="hidden" name="productId" value={productId} />
      <input type="hidden" name="locale" value={locale} />
      <FormField
        id="quantity"
        label={t("quantity", { unit })}
        hint={t("minOrderHint", { qty: minOrder, unit })}
        error={message("quantity")}
      >
        {(p) => (
          <input
            id={p.id}
            name="quantity"
            inputMode="decimal"
            defaultValue={minOrder}
            aria-invalid={p.invalid}
            aria-describedby={p.describedBy}
            className={`${INPUT_CLASS} sm:max-w-48`}
          />
        )}
      </FormField>
      <FormField id="destination" label={t("destination")} error={message("destination")}>
        {(p) => (
          <input
            id={p.id}
            name="destination"
            placeholder={t("destinationPlaceholder")}
            aria-invalid={p.invalid}
            aria-describedby={p.describedBy}
            className={INPUT_CLASS}
          />
        )}
      </FormField>
      <FormField id="message" label={t("message")} error={message("message")}>
        {(p) => (
          <textarea
            id={p.id}
            name="message"
            rows={6}
            maxLength={MESSAGE_MAX_LENGTH}
            aria-invalid={p.invalid}
            aria-describedby={p.describedBy}
            className={INPUT_CLASS}
          />
        )}
      </FormField>
      <div className="flex items-center gap-4">
        <button type="submit" disabled={pending} className="btn btn-primary">
          {t("send")}
        </button>
        <p role="status" className="text-red-700">
          {errors.form ? a(`errors.${errors.form}`) : null}
        </p>
      </div>
    </form>
  );
}
