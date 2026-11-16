"use client";
// Menú desplegable de la cuenta. Usa <details> (accesible y funciona sin JS),
// y se cierra solo al cambiar de página o al tocar fuera.
import { useEffect, useRef, type ReactNode } from "react";
import { usePathname } from "@/i18n/navigation";

export function AccountMenu({ summary, label, children }: { summary: ReactNode; label: string; children: ReactNode }) {
  const ref = useRef<HTMLDetailsElement>(null);
  const pathname = usePathname();

  useEffect(() => {
    ref.current?.removeAttribute("open");
  }, [pathname]);

  useEffect(() => {
    const onPointerDown = (e: PointerEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) ref.current.removeAttribute("open");
    };
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, []);

  return (
    <details ref={ref} className="relative">
      <summary
        aria-label={label}
        className="flex h-11 cursor-pointer list-none items-center gap-2 rounded-[10px] bg-surface px-3 font-semibold [&::-webkit-details-marker]:hidden"
      >
        {summary}
      </summary>
      <div className="absolute right-0 z-10 mt-2 flex w-48 flex-col rounded-xl border border-line bg-surface p-1.5 shadow-lg">
        {children}
      </div>
    </details>
  );
}
