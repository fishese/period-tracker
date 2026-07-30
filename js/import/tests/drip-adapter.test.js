import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { parseDripCsvToPreview } from "../adapters/drip.js";
import { applyFlowPattern } from "../import-core.js";
import { buildDripCsv } from "../../export-drip.js";

const dir = dirname(fileURLToPath(import.meta.url));
const csv = readFileSync(join(dir, "../fixtures/drip-mini.csv"), "utf8");

function csvRowByDate(text, date) {
  const lines = text.trim().split("\n");
  const headers = lines[0].split(",");
  const dateIdx = headers.indexOf("date");
  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(",");
    if (values[dateIdx] !== date) continue;
    const row = {};
    headers.forEach((header, idx) => {
      row[header] = values[idx] ?? "";
    });
    return row;
  }
  return null;
}

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

  it("sets hasSourceFlow false for spotting-only period groups", () => {
    const spottingOnly = `date,temperature.value,temperature.exclude,temperature.time,temperature.note,bleeding.value,bleeding.exclude,mucus.feeling,mucus.texture,mucus.value,mucus.exclude,cervix.opening,cervix.firmness,cervix.position,cervix.exclude,note.value,desire.value,sex.solo,sex.partner,sex.condom,sex.pill,sex.iud,sex.patch,sex.ring,sex.implant,sex.diaphragm,sex.none,sex.other,sex.note,pain.cramps,pain.ovulationPain,pain.headache,pain.backache,pain.nausea,pain.tenderBreasts,pain.migraine,pain.other,pain.note,mood.happy,mood.sad,mood.stressed,mood.balanced,mood.fine,mood.anxious,mood.energetic,mood.fatigue,mood.angry,mood.other,mood.note
2026-07-20,,,,,0,false,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,
2026-07-21,,,,,0,false,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,`;
    const { preview } = parseDripCsvToPreview(spottingOnly);
    assert.equal(preview.periods.length, 1);
    assert.equal(preview.periods[0].hasSourceFlow, false);

    const filled = applyFlowPattern(structuredClone(preview), {
      pattern: [1, 2],
      mode: "fill-gaps",
    });
    assert.equal(filled.days["2026-07-20"].flow, 1);
    assert.equal(filled.days["2026-07-21"].flow, 2);
  });

  it("restores flow 4 from note token", () => {
    const text = `date,temperature.value,temperature.exclude,temperature.time,temperature.note,bleeding.value,bleeding.exclude,mucus.feeling,mucus.texture,mucus.value,mucus.exclude,cervix.opening,cervix.firmness,cervix.position,cervix.exclude,note.value,desire.value,sex.solo,sex.partner,sex.condom,sex.pill,sex.iud,sex.patch,sex.ring,sex.implant,sex.diaphragm,sex.none,sex.other,sex.note,pain.cramps,pain.ovulationPain,pain.headache,pain.backache,pain.nausea,pain.tenderBreasts,pain.migraine,pain.other,pain.note,mood.happy,mood.sad,mood.stressed,mood.balanced,mood.fine,mood.anxious,mood.energetic,mood.fatigue,mood.angry,mood.other,mood.note
2026-01-01,,,,,3,false,,,,,,,,,flow:4,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,`;
    const { preview } = parseDripCsvToPreview(text);
    assert.equal(preview.days["2026-01-01"].flow, 4);
    assert.equal(preview.days["2026-01-01"].note, undefined);
  });

  it("exports flow 4 as bleed 3 with flow:4 token", () => {
    const exported = buildDripCsv({ "2026-01-01": { flow: 4 } });
    const row = csvRowByDate(exported, "2026-01-01");
    assert.equal(row["bleeding.value"], "3");
    assert.equal(row["note.value"], "flow:4");
  });

  it("round-trips flow 4 with user note without duplicating token", () => {
    const logs = { "2026-01-01": { flow: 4, note: "hello" } };
    const exported = buildDripCsv(logs);
    const row = csvRowByDate(exported, "2026-01-01");
    assert.equal(row["bleeding.value"], "3");
    assert.equal(row["note.value"], "hello | flow:4");

    const { preview } = parseDripCsvToPreview(exported);
    assert.equal(preview.days["2026-01-01"].flow, 4);
    assert.equal(preview.days["2026-01-01"].note, "hello");

    const reexported = buildDripCsv(logs);
    assert.equal(
      csvRowByDate(reexported, "2026-01-01")["note.value"],
      "hello | flow:4",
    );
  });
});
