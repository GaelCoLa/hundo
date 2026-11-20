// Validación de un reporte de reseña (lógica pura). La base tiene las mismas
// reglas como respaldo (check de motivo y largo del detalle).

export const REPORT_REASONS = ["spam", "offensive", "spoilers", "other"] as const;
export type ReportReason = (typeof REPORT_REASONS)[number];
export type ReportInputError = "report_reason" | "report_too_long";

const MAX_DETAILS = 500;

export function parseReportInput(form: {
  reason: string;
  details: string;
}): { ok: true; value: { reason: ReportReason; details: string | null } } | { ok: false; error: ReportInputError } {
  if (!(REPORT_REASONS as readonly string[]).includes(form.reason)) return { ok: false, error: "report_reason" };
  const details = form.details.trim();
  if (details.length > MAX_DETAILS) return { ok: false, error: "report_too_long" };
  return { ok: true, value: { reason: form.reason as ReportReason, details: details || null } };
}
