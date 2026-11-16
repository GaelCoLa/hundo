import type { ReactNode } from "react";

/** Tarjeta centrada para las pantallas de registro e inicio de sesión. */
export function AuthCard({ title, children }: { title: string; children: ReactNode }) {
  return (
    <main className="mx-auto flex w-full max-w-md flex-col gap-8 px-4 py-12 sm:py-20">
      <h1 className="font-display text-5xl font-black uppercase leading-[0.9]">{title}</h1>
      <div className="rounded-[20px] bg-surface p-6 sm:p-8">{children}</div>
    </main>
  );
}
