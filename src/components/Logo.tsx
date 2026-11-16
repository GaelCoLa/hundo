/** Logo de Hundo: el cuadrado amarillo con "100" y el nombre al lado. */
export function Logo() {
  return (
    <span className="flex items-center gap-2.5">
      <span
        aria-hidden="true"
        className="flex size-[38px] items-center justify-center rounded-xl bg-accent font-logo text-[13px] font-black text-accent-ink"
      >
        100
      </span>
      <span className="font-logo text-2xl font-bold">hundo</span>
    </span>
  );
}
