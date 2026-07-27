import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  parseFlowPattern,
  applyFlowPattern,
  previewToLogs,
  buildReportText,
  buildReportCsv,
} from "../import-core.js";

describe("parseFlowPattern", () => {
  it("parses 1,1,1,1,1", () => {
    assert.deepEqual(parseFlowPattern("1,1,1,1,1").pattern, [1, 1, 1, 1, 1]);
  });
  it("rejects 5", () => {
    assert.ok(parseFlowPattern("2,5").error);
  });
});

describe("applyFlowPattern", () => {
  const base = {
    source: "mycalendar",
    periods: [
      { start: "2026-07-08", end: "2026-07-13", hasSourceFlow: true },
      { start: "2026-06-04", end: "2026-06-09", hasSourceFlow: false },
    ],
    days: {
      "2026-07-08": { flow: 3, leftovers: [] },
      "2026-07-09": { flow: 4, leftovers: [] },
    },
    unmappedMoods: [],
  };

  it("fill-gaps only fills periods without source flow", () => {
    const out = applyFlowPattern(structuredClone(base), {
      pattern: [2, 3, 3, 1],
      mode: "fill-gaps",
    });
    assert.equal(out.days["2026-07-08"].flow, 3);
    assert.equal(out.days["2026-06-04"].flow, 2);
    assert.equal(out.days["2026-06-09"].flow, 1); // last value repeats
  });

  it("overwrite replaces all period days", () => {
    const out = applyFlowPattern(structuredClone(base), {
      pattern: [1, 1, 1, 1, 1],
      mode: "overwrite",
    });
    assert.equal(out.days["2026-07-08"].flow, 1);
    assert.equal(out.days["2026-07-09"].flow, 1);
  });
});

describe("previewToLogs + report", () => {
  it("truncates notes to 500 and keeps full leftovers in report", () => {
    const long = "x".repeat(600);
    const preview = {
      source: "mycalendar",
      periods: [],
      days: {
        "2026-07-13": { leftovers: [long], note: "hi" },
      },
      unmappedMoods: [{ date: "2026-07-13", label: "Angelic" }],
    };
    const { logs, leftoverReport } = previewToLogs(preview);
    assert.ok(logs["2026-07-13"].note.length <= 500);
    assert.equal(leftoverReport[0].detail, long);
    const csv = buildReportCsv({
      unmappedMoods: preview.unmappedMoods,
      leftovers: leftoverReport,
    });
    assert.match(csv, /unmapped_mood/);
    assert.match(csv, /leftover/);
    const text = buildReportText({
      summary: {
        source: "mycalendar",
        periods: 1,
        daysWithFlow: 0,
        daysWithMood: 0,
        daysWithLeftovers: 1,
        unmappedMoodCount: 1,
        daysImported: 1,
      },
      unmappedMoods: preview.unmappedMoods,
      leftovers: leftoverReport,
    });
    assert.match(text, /Source: mycalendar/);
    assert.match(text, /Periods: 1/);
    assert.match(text, /Days with flow: 0/);
    assert.match(text, /Days with mood: 0/);
    assert.match(text, /Days with leftovers: 1/);
    assert.match(text, /Unmapped moods: 1/);
    assert.match(text, /Days imported: 1/);
    assert.match(text, /Angelic/);
  });
});
