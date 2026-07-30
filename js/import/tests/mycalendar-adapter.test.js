import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { parseMyCalendarText } from "../adapters/mycalendar.js";

const text = readFileSync(
  join(dirname(fileURLToPath(import.meta.url)), "../fixtures/mycalendar-july.txt"),
  "utf8"
);

describe("mycalendar adapter", () => {
  it("maps +…++++ Flow and periods", () => {
    const { preview, error } = parseMyCalendarText(text);
    assert.equal(error, undefined);
    assert.equal(preview.days["2026-07-08"].flow, 3);
    assert.equal(preview.days["2026-07-09"].flow, 4);
    assert.equal(preview.days["2026-07-10"].flow, 2);
    assert.equal(preview.days["2026-07-11"].flow, 1);
    assert.equal(preview.days["2026-07-13"].flow, 1);
    assert.equal(preview.days["2026-07-13"].spotting, undefined);
    assert.ok(preview.days["2026-07-13"].leftovers.some((s) => /Spotting/i.test(s)));
    const july = preview.periods.find((p) => p.start === "2026-07-08");
    assert.equal(july.end, "2026-07-13");
    assert.equal(july.hasSourceFlow, true);
    const june = preview.periods.find((p) => p.start === "2026-06-04");
    assert.equal(june.hasSourceFlow, false);
  });

  it("puts Angelic in unmappedMoods and temp/symptoms in leftovers", () => {
    const { preview } = parseMyCalendarText(text);
    assert.ok(preview.unmappedMoods.some((m) => m.date === "2026-07-13" && m.label === "Angelic"));
    assert.ok(preview.days["2026-07-09"].leftovers.some((s) => /temperature/i.test(s)));
    assert.ok(preview.days["2026-07-13"].leftovers.length > 0);
    assert.equal(preview.days["2026-07-13"].mood, undefined);
    assert.equal(preview.days["2026-07-13"].pain, undefined);
    assert.ok(
      preview.days["2026-07-13"].leftovers.some((s) => /Cramps|Backaches/i.test(s))
    );
  });
});
