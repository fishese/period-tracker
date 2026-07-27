import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  getFlowPeriods,
  findPeriodForDate,
  listExportableDates,
  exportFilename,
} from "../export-core.js";

describe("getFlowPeriods", () => {
  it("groups flow days with gap <= 2 and ignores spotting-only", () => {
    const logs = {
      "2026-05-01": { flow: 1 },
      "2026-05-03": { flow: 1 }, // gap 2 → same period
      "2026-06-01": { spotting: true },
      "2026-07-08": { flow: 2 },
      "2026-07-09": { flow: 3 },
    };
    const periods = getFlowPeriods(logs);
    assert.deepEqual(
      periods.find((p) => p.start === "2026-05-01"),
      { start: "2026-05-01", end: "2026-05-03" }
    );
    assert.ok(!periods.some((p) => p.start === "2026-06-01"));
    assert.deepEqual(
      periods.find((p) => p.start === "2026-07-08"),
      { start: "2026-07-08", end: "2026-07-09" }
    );
  });
});

describe("listExportableDates + filename", () => {
  it("lists exportable days ascending", () => {
    const dates = listExportableDates({
      "2026-07-09": { flow: 1 },
      "2026-07-01": { mood: 50 },
    });
    assert.deepEqual(dates, ["2026-07-01", "2026-07-09"]);
  });
  it("builds filenames", () => {
    assert.equal(exportFilename("drip", "2026-07-27"), "mycyclekeeper-drip-2026-07-27.csv");
    assert.equal(exportFilename("plain", "2026-07-27"), "mycyclekeeper-plain-2026-07-27.csv");
  });
});

describe("findPeriodForDate", () => {
  it("returns matching period or null", () => {
    const periods = [
      { start: "2026-07-08", end: "2026-07-09" },
      { start: "2026-05-01", end: "2026-05-03" },
    ];
    assert.deepEqual(findPeriodForDate(periods, "2026-07-08"), {
      start: "2026-07-08",
      end: "2026-07-09",
    });
    assert.equal(findPeriodForDate(periods, "2026-07-20"), null);
  });
});
