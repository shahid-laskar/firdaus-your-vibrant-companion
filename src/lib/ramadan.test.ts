import { describe, test } from "node:test";
import assert from "node:assert/strict";
import {
  calculateSuhurIftar,
  generateRamadanSignals,
  IFTAR_DUA,
  SUHUR_DUA,
  type SuhurIftarContext,
} from "./ramadan";

describe("Ramadan Mode Engine", () => {
  test("calculateSuhurIftar handles Suhur window correctly", () => {
    // 04:15 AM — Fajr is 05:00, Maghrib is 18:30
    const now = new Date("2026-03-10T04:15:00");
    const result = calculateSuhurIftar("05:00", "18:30", now);

    assert.equal(result.phase, "suhur");
    assert.equal(result.minutesRemaining, 45);
    assert.equal(result.countdownText, "Suhur ends in 45m");
    assert.equal(result.suhurTime, "05:00");
    assert.equal(result.iftarTime, "18:30");
  });

  test("calculateSuhurIftar handles Fasting daytime window correctly", () => {
    // 14:00 (2:00 PM) — Fajr is 05:00, Maghrib is 18:30
    const now = new Date("2026-03-10T14:00:00");
    const result = calculateSuhurIftar("05:00", "18:30", now);

    assert.equal(result.phase, "fasting");
    assert.equal(result.minutesRemaining, 270); // 4h 30m
    assert.equal(result.countdownText, "Iftar in 4h 30m");
  });

  test("calculateSuhurIftar handles post-Iftar window correctly", () => {
    // 18:45 (6:45 PM) — Maghrib is 18:30
    const now = new Date("2026-03-10T18:45:00");
    const result = calculateSuhurIftar("05:00", "18:30", now);

    assert.equal(result.phase, "iftar");
    assert.ok(result.countdownText.includes("Iftar Mubarak"));
  });

  test("IFTAR_DUA and SUHUR_DUA contain valid texts", () => {
    assert.ok(IFTAR_DUA.ar.includes("ذَهَبَ الظَّمَأُ"));
    assert.ok(IFTAR_DUA.en.includes("thirst is gone"));
    assert.ok(SUHUR_DUA.ar.includes("وَبِصَوْمِ غَدٍ"));
  });

  test("generateRamadanSignals generates Suhur and Iftar signals on active thresholds", () => {
    // Fasting context 45m before Iftar
    const nearIftar: SuhurIftarContext = {
      suhurTime: "05:00",
      iftarTime: "18:30",
      phase: "fasting",
      countdownText: "Iftar in 45m",
      minutesRemaining: 45,
      iftarDua: IFTAR_DUA,
      suhurDua: SUHUR_DUA,
    };

    const signals = generateRamadanSignals(nearIftar, false, 15, "2026-03-10");
    assert.ok(signals.some((s) => s.id.includes("ramadan-iftar")));
    assert.ok(signals.some((s) => s.id.includes("ramadan-taraweeh")));

    // When taraweeh is already done
    const signalsDone = generateRamadanSignals(nearIftar, true, 15, "2026-03-10");
    assert.ok(!signalsDone.some((s) => s.id.includes("ramadan-taraweeh")));
  });
});
