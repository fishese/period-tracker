import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { parseDripCsvToPreview } from "../adapters/drip.js";

const dir = dirname(fileURLToPath(import.meta.url));
const csv = readFileSync(join(dir, "../fixtures/drip-mini.csv"), "utf8");

describe("drip adapter", () => {
  it("maps bleeding and leftovers", () => {
    const { preview, error } = parseDripCsvToPreview(csv);
    assert.equal(error, undefined);
    assert.equal(preview.source, "drip");
    assert.equal(preview.days["2026-07-01"].flow, 2);
    assert.equal(preview.days["2026-07-02"].spotting, true);
    assert.equal(preview.days["2026-07-02"].flow, undefined);
    assert.equal(preview.days["2026-07-03"].flow, 3);
    assert.deepEqual(preview.days["2026-07-04"].leftovers, ["temperature:36.5"]);
    assert.equal(preview.days["2026-07-04"].flow, undefined);
    assert.equal(preview.periods.length, 1);
    assert.equal(preview.periods[0].start, "2026-07-01");
    assert.equal(preview.periods[0].end, "2026-07-03");
    assert.equal(preview.periods[0].hasSourceFlow, true);
  });

  it("restores flow 4 from note token", () => {
    const text = `date,temperature.value,temperature.exclude,temperature.time,temperature.note,bleeding.value,bleeding.exclude,mucus.feeling,mucus.texture,mucus.value,mucus.exclude,cervix.opening,cervix.firmness,cervix.position,cervix.exclude,note.value,desire.value,sex.solo,sex.partner,sex.condom,sex.pill,sex.iud,sex.patch,sex.ring,sex.implant,sex.diaphragm,sex.none,sex.other,sex.note,pain.cramps,pain.ovulationPain,pain.headache,pain.backache,pain.nausea,pain.tenderBreasts,pain.migraine,pain.other,pain.note,mood.happy,mood.sad,mood.stressed,mood.balanced,mood.fine,mood.anxious,mood.energetic,mood.fatigue,mood.angry,mood.other,mood.note
2026-01-01,,,,,3,false,,,,,,,,,flow:4,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,`;
    const { preview } = parseDripCsvToPreview(text);
    assert.equal(preview.days["2026-01-01"].flow, 4);
    assert.equal(preview.days["2026-01-01"].note, undefined);
  });
});
