import { describe, expect, test } from "vitest";
import { parseReportInput } from "@/lib/moderation";

describe("parseReportInput", () => {
  test("motivo válido y detalle opcional (vacío → null)", () => {
    expect(parseReportInput({ reason: "spam", details: "  " })).toEqual({ ok: true, value: { reason: "spam", details: null } });
    expect(parseReportInput({ reason: "offensive", details: " Insulta " })).toEqual({ ok: true, value: { reason: "offensive", details: "Insulta" } });
  });
  test("rechaza motivos desconocidos y detalles de más de 500 caracteres", () => {
    expect(parseReportInput({ reason: "x", details: "" })).toEqual({ ok: false, error: "report_reason" });
    expect(parseReportInput({ reason: "other", details: "x".repeat(501) })).toEqual({ ok: false, error: "report_too_long" });
    expect(parseReportInput({ reason: "other", details: "x".repeat(500) }).ok).toBe(true);
  });
});
