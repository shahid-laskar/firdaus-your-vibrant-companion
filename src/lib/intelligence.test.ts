import { describe, test } from "node:test";
import assert from "node:assert/strict";
import {
  isoDate,
  isoOffset,
  getWeekRange,
  getMonthRange,
  sum,
  average,
  distribution,
  trendDelta,
  checkThreshold,
  fillMissingData,
} from "./intelligence";

describe("Intelligence Foundation", () => {
  test("isoDate formatting", () => {
    const d = new Date("2026-08-14T12:00:00Z");
    assert.equal(isoDate(d), "2026-08-14");
  });

  test("isoOffset calculations", () => {
    const base = "2026-08-14";
    assert.equal(isoOffset(base, -1), "2026-08-13");
    assert.equal(isoOffset(base, 1), "2026-08-15");
    assert.equal(isoOffset("2024-02-28", 1), "2024-02-29");
  });

  test("getWeekRange returns 7 days", () => {
    const range = getWeekRange("2026-08-14");
    assert.equal(range.length, 7);
    assert.equal(range[6], "2026-08-14");
    assert.equal(range[0], "2026-08-08");
  });

  test("getMonthRange returns 30 days", () => {
    const range = getMonthRange("2026-08-14");
    assert.equal(range.length, 30);
    assert.equal(range[29], "2026-08-14");
    assert.equal(range[0], "2026-07-16");
  });

  test("fillMissingData handles gaps", () => {
    const range = ["2026-08-01", "2026-08-02", "2026-08-03"];
    const data = { "2026-08-01": 10, "2026-08-03": 5 };
    assert.deepEqual(fillMissingData(range, data), [10, 0, 5]);
    assert.deepEqual(fillMissingData(range, data, -1), [10, -1, 5]);
  });

  test("aggregates and math", () => {
    assert.equal(sum([1, 2, 3]), 6);
    assert.equal(average([1, 2, 3]), 2);
    assert.equal(average([]), 0);

    const dist = distribution<string>(["a", "b", "a", "c"]);
    assert.equal(dist.get("a"), 2);
    assert.equal(dist.get("b"), 1);
    assert.equal(dist.get("d"), undefined);
  });

  test("trendDelta", () => {
    assert.deepEqual(trendDelta(150, 100), { delta: 50, percentage: 50 });
    assert.deepEqual(trendDelta(50, 100), { delta: -50, percentage: -50 });
    assert.deepEqual(trendDelta(100, 0), { delta: 100, percentage: 100 });
    assert.deepEqual(trendDelta(0, 0), { delta: 0, percentage: 0 });
  });

  test("checkThreshold", () => {
    assert.equal(checkThreshold(5, 10, "lt"), true);
    assert.equal(checkThreshold(10, 10, "lte"), true);
    assert.equal(checkThreshold(15, 10, "gt"), true);
    assert.equal(checkThreshold(10, 10, "gte"), true);
  });
});
