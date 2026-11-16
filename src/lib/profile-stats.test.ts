import { describe, expect, test } from "vitest";
import { computeProfileStats, sortLibrary, type LibraryItem } from "@/lib/profile-stats";

// La biblioteca de la planilla original de Gael (hoja "Mi biblioteca").
const EXCEL: { name: string; score: number; hoursPlayed: number; finishedOn: string }[] = [
  { name: "Hades", score: 92, hoursPlayed: 85.7, finishedOn: "2026-05-22" },
  { name: "Half Life", score: 98, hoursPlayed: 40.1, finishedOn: "2025-05-01" },
  { name: "Resident Evil 0", score: 67, hoursPlayed: 13.7, finishedOn: "2026-06-14" },
  { name: "Resident Evil 1", score: 90, hoursPlayed: 37.6, finishedOn: "2026-03-26" },
  { name: "Resident Evil 2", score: 96, hoursPlayed: 37.6, finishedOn: "2024-06-14" },
  { name: "Resident Evil 3", score: 64, hoursPlayed: 34.4, finishedOn: "2024-11-13" },
  { name: "Resident Evil 4", score: 98, hoursPlayed: 44.9, finishedOn: "2024-07-09" },
  { name: "Resident Evil 5", score: 74, hoursPlayed: 35, finishedOn: "2024-07-16" },
  { name: "Resident Evil 6", score: 76, hoursPlayed: 32.1, finishedOn: "2024-07-27" },
  { name: "Resident Evil 7", score: 81, hoursPlayed: 18.9, finishedOn: "2025-03-16" },
  { name: "Resident Evil 8", score: 78, hoursPlayed: 69.9, finishedOn: "2024-10-11" },
  { name: "Resident Evil 9", score: 93, hoursPlayed: 37.6, finishedOn: "2026-07-23" },
  { name: "Code Veronica X", score: 94, hoursPlayed: 16, finishedOn: "2026-08-16" },
];

describe("computeProfileStats", () => {
  test("coincide con la hoja 'Resumen' del Excel", () => {
    const stats = computeProfileStats(EXCEL);
    expect(stats.count).toBe(13);
    expect(stats.average).toBe(84.7); // 1101 / 13
    expect(stats.averageOutOfTen).toBe("8.5");
    expect(stats.totalHours).toBe(503.5);
    expect(stats.finishedCount).toBe(13);
    expect(stats.byCategory).toEqual({
      mediocre: 0,
      fair: 0,
      decent: 3,
      good: 3,
      great: 0,
      excellent: 4,
      masterpiece: 3,
    });
  });

  test("biblioteca vacía", () => {
    const stats = computeProfileStats([]);
    expect(stats).toMatchObject({ count: 0, average: null, averageOutOfTen: null, totalHours: 0, finishedCount: 0 });
  });

  test("ignora horas y fechas vacías", () => {
    const stats = computeProfileStats([
      { score: 50, hoursPlayed: null, finishedOn: null },
      { score: 70, hoursPlayed: 10.25, finishedOn: "2026-01-01" },
    ]);
    expect(stats.totalHours).toBe(10.3);
    expect(stats.finishedCount).toBe(1);
    expect(stats.average).toBe(60);
  });
});

describe("sortLibrary", () => {
  const items: LibraryItem[] = [
    { name: "A", score: 70, hoursPlayed: null, finishedOn: "2026-01-01", updatedAt: "2026-11-01T00:00:00Z" },
    { name: "B", score: 90, hoursPlayed: 5, finishedOn: null, updatedAt: "2026-11-03T00:00:00Z" },
    { name: "C", score: 80, hoursPlayed: 50, finishedOn: "2025-01-01", updatedAt: "2026-11-02T00:00:00Z" },
  ];
  const names = (list: LibraryItem[]) => list.map((i) => i.name);

  test("por nota, de mayor a menor", () => {
    expect(names(sortLibrary(items, "score"))).toEqual(["B", "C", "A"]);
  });
  test("por horas: los que no tienen horas van al final", () => {
    expect(names(sortLibrary(items, "hours"))).toEqual(["C", "B", "A"]);
  });
  test("por fecha de finalización: sin fecha al final", () => {
    expect(names(sortLibrary(items, "finished"))).toEqual(["A", "C", "B"]);
  });
  test("por actividad reciente", () => {
    expect(names(sortLibrary(items, "recent"))).toEqual(["B", "C", "A"]);
  });
  test("no modifica la lista original", () => {
    sortLibrary(items, "score");
    expect(names(items)).toEqual(["A", "B", "C"]);
  });
});
