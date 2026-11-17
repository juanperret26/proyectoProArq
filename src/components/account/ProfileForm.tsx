"use client";

import { useTranslations } from "next-intl";
import { useActionState } from "react";

import { saveProfile, type FormState } from "@/lib/account/actions";
import type { Profile } from "@/lib/account/queries";

import { FormField, INPUT_CLASS } from "./FormField";

const INITIAL: FormState = { status: "idle" };

export function ProfileForm({ profile }: { profile: Profile | null }) {
  const t = useTranslations("account");
  const [state, formAction, pending] = useActionState(saveProfile, INITIAL);
  const errors = state.status === "error" ? state.errors : {};
  const message = (field: string) => {
    const code = errors[field];
    return code ? t(`errors.${code}`) : undefined;
  };

  return (
    <form action={formAction} className="flex max-w-xl flex-col gap-5" noValidate>
      <FormField id="fullName" label={t("fullName")} error={message("fullName")}>
        {(p) => (
          <input
            id={p.id}
            name="fullName"
            autoComplete="name"
            defaultValue={profile?.full_name ?? ""}
            aria-invalid={p.invalid}
            aria-describedby={p.describedBy}
            className={INPUT_CLASS}
          />
        )}
      </FormField>
      <FormField id="company" label={t("company")} error={message("company")}>
        {(p) => (
          <input
            id={p.id}
            name="company"
            autoComplete="organization"
            defaultValue={profile?.company ?? ""}
            aria-invalid={p.invalid}
            aria-describedby={p.describedBy}
            className={INPUT_CLASS}
          />
        )}
      </FormField>
      <FormField
        id="countryCode"
        label={t("country")}
        hint={t("countryHint")}
        error={message("countryCode")}
      >
        {(p) => (
          <input
            id={p.id}
            name="countryCode"
            maxLength={2}
            autoComplete="country"
            defaultValue={profile?.country_code ?? ""}
            aria-invalid={p.invalid}
            aria-describedby={p.describedBy}
            className={`${INPUT_CLASS} uppercase sm:max-w-32`}
          />
        )}
      </FormField>
      <div className="flex items-center gap-4">
        <button type="submit" disabled={pending} className="btn btn-primary">
          {t("save")}
        </button>
        <p role="status" className="text-ink-soft">
          {state.status === "saved" ? t("saved") : null}
          {errors.form ? t(`errors.${errors.form}`) : null}
        </p>
      </div>
    </form>
  );
}
