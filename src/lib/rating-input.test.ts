import { describe, expect, test } from "vitest";
import { parseRatingInput, readRatingForm, type RatingForm } from "@/lib/rating-input";

const TODAY = new Date("2026-11-17T15:00:00Z");
const base: RatingForm = { score: "92", review: "", hasSpoilers: null, hours: "", finishedOn: "" };
const parse = (patch: Partial<RatingForm>) => parseRatingInput({ ...base, ...patch }, TODAY);

describe("nota", () => {
  test("acepta enteros del 1 al 100", () => {
    expect(parse({ score: "92" })).toMatchObject({ ok: true, value: { score: 92 } });
    expect(parse({ score: "1" })).toMatchObject({ ok: true, value: { score: 1 } });
    expect(parse({ score: "100" })).toMatchObject({ ok: true, value: { score: 100 } });
  });
  test.each(["0", "101", "92.5", "abc", "", "-5"])("rechaza %j", (score) => {
    expect(parse({ score })).toEqual({ ok: false, error: "score_range" });
  });
});

describe("reseña", () => {
  test("hasta 5000 caracteres", () => {
    expect(parse({ review: "a".repeat(5000) })).toMatchObject({ ok: true });
    expect(parse({ review: "a".repeat(5001) })).toEqual({ ok: false, error: "review_too_long" });
  });
  test("vacía o solo espacios se guarda como null", () => {
    expect(parse({ review: "   " })).toMatchObject({ ok: true, value: { review: null } });
  });
  test("recorta espacios de los bordes", () => {
    expect(parse({ review: "  Muy bueno  " })).toMatchObject({ ok: true, value: { review: "Muy bueno" } });
  });
  test("spoilers: casilla marcada = true", () => {
    expect(parse({ hasSpoilers: "on" })).toMatchObject({ ok: true, value: { hasSpoilers: true } });
    expect(parse({ hasSpoilers: null })).toMatchObject({ ok: true, value: { hasSpoilers: false } });
  });
});

describe("horas", () => {
  test("vacío es null; acepta punto o coma decimal", () => {
    expect(parse({ hours: "" })).toMatchObject({ ok: true, value: { hoursPlayed: null } });
    expect(parse({ hours: "85.7" })).toMatchObject({ ok: true, value: { hoursPlayed: 85.7 } });
    expect(parse({ hours: "85,7" })).toMatchObject({ ok: true, value: { hoursPlayed: 85.7 } });
    expect(parse({ hours: "0" })).toMatchObject({ ok: true, value: { hoursPlayed: 0 } });
  });
  test("redondea a un decimal", () => {
    expect(parse({ hours: "12.34" })).toMatchObject({ ok: true, value: { hoursPlayed: 12.3 } });
  });
  test.each(["16 (APROX)", "-1", "10000", "abc", "1e3"])("rechaza %j", (hours) => {
    expect(parse({ hours })).toEqual({ ok: false, error: "hours_invalid" });
  });
});

describe("fecha de finalización", () => {
  test("vacía es null; hoy y fechas pasadas valen", () => {
    expect(parse({ finishedOn: "" })).toMatchObject({ ok: true, value: { finishedOn: null } });
    expect(parse({ finishedOn: "2026-11-17" })).toMatchObject({ ok: true, value: { finishedOn: "2026-11-17" } });
    expect(parse({ finishedOn: "1970-01-01" })).toMatchObject({ ok: true });
  });
  test("mañana es futura", () => {
    expect(parse({ finishedOn: "2026-11-18" })).toEqual({ ok: false, error: "date_future" });
  });
  test.each(["1969-12-31", "2026-02-30", "17/11/2026", "ayer"])("rechaza %j", (finishedOn) => {
    expect(parse({ finishedOn })).toEqual({ ok: false, error: "date_invalid" });
  });
});

describe("readRatingForm", () => {
  test("devuelve lo escrito tal cual, para reponerlo en el formulario si hay un error", () => {
    const fd = new FormData();
    fd.set("score", "92");
    fd.set("review", "Una reseña larga");
    fd.set("hasSpoilers", "on");
    fd.set("hours", "16 (APROX)");
    fd.set("finishedOn", "2020-11-02");
    expect(readRatingForm(fd)).toEqual({
      score: "92",
      review: "Una reseña larga",
      hasSpoilers: "on",
      hours: "16 (APROX)",
      finishedOn: "2020-11-02",
    });
  });

  test("campos ausentes quedan vacíos y la casilla sin marcar es null", () => {
    expect(readRatingForm(new FormData())).toEqual({ score: "", review: "", hasSpoilers: null, hours: "", finishedOn: "" });
  });
});
