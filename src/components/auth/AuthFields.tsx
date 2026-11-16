// Piezas visuales compartidas por los formularios de registro e inicio de sesión.
import type { InputHTMLAttributes, ReactNode } from "react";

export function Field({
  label,
  hint,
  ...input
}: { label: string; hint?: string } & InputHTMLAttributes<HTMLInputElement>) {
  return (
    <label className="flex flex-col gap-1.5 text-sm text-muted">
      {label}
      <input
        {...input}
        className="h-11 rounded-[10px] border border-line bg-bg px-3 text-[15px] text-ink placeholder:text-muted/60"
      />
      {hint ? <span className="text-xs text-muted">{hint}</span> : null}
    </label>
  );
}

export function FormError({ children }: { children: ReactNode }) {
  return (
    <p role="alert" className="rounded-[10px] border border-scale-mediocre/50 bg-scale-mediocre/10 px-3 py-2 text-sm text-ink">
      {children}
    </p>
  );
}

export function SubmitButton({ pending, children }: { pending: boolean; children: ReactNode }) {
  return (
    <button
      type="submit"
      disabled={pending}
      aria-busy={pending}
      className="h-12 rounded-xl bg-accent px-6 font-bold text-accent-ink disabled:opacity-60"
    >
      {children}
    </button>
  );
}
