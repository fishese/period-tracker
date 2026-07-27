import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { buildPlainCsv } from "../adapters/plain-csv.js";

describe("buildPlainCsv", () => {
  it("emits header and period context + out-of-period row", () => {
    const csv = buildPlainCsv({
      "2026-07-08": { flow: 2, note: "hi" },
      "2026-07-09": { flow: 4, pain: 3 },
      "2026-07-20": { mood: 100 },
      "2026-07-21": { spotting: true },
    });
    const lines = csv.trim().split(/\r?\n/);
    assert.equal(lines[0], "period_start,period_end,date,flow,pain,mood,notes");
    assert.ok(lines.some((l) => l.startsWith("2026-07-08,2026-07-09,2026-07-08,2,,")));
    assert.ok(lines.some((l) => l.includes("2026-07-09,4,3,,")));
    assert.ok(lines.some((l) => l.startsWith(",,2026-07-20,,,100,")));
    assert.ok(lines.some((l) => /2026-07-21,spotting,/.test(l)));
  });

  it("escapes quotes and commas in notes", () => {
    const csv = buildPlainCsv({
      "2026-01-01": { note: 'say "hi", please' },
    });
    assert.match(csv, /"say ""hi"", please"/);
  });
});
