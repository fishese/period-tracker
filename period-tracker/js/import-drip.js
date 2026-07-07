"use strict";

// ─── Value converters ─────────────────────────────────────────────────────────

// drip bleeding.value: 0=spotting, 1=light, 2=medium, 3=heavy
// My Cycle Keeper flow:                      1=light,  2=medium, 3=heavy
function dripBleedingToFlow(value) {
  if (value === 0) return 1;
  if (value === 1) return 1;
  if (value === 2) return 2;
  if (value === 3) return 3;
  return null;
}

// drip pain: up to 8 boolean flags → My Cycle Keeper pain 1–10
// More flags present = higher severity.
function dripPainToPainValue(pain) {
  if (!pain) return null;
  const count = [
    pain.cramps, pain.ovulationPain, pain.headache, pain.backache,
    pain.nausea, pain.tenderBreasts, pain.migraine, pain.other,
  ].filter(Boolean).length;
  if (count === 0) return null;
  return Math.min(10, Math.round(count * 1.3 + 1.5));
}

// drip mood: positive and negative boolean flags → My Cycle Keeper mood 0–100
// Baseline 50; each positive flag +15, each negative flag -15.
function dripMoodToMoodValue(mood) {
  if (!mood) return null;
  const pos = [mood.happy, mood.energetic, mood.fine, mood.balanced].filter(Boolean).length;
  const neg = [mood.sad, mood.stressed, mood.anxious, mood.fatigue, mood.angry].filter(Boolean).length;
  if (pos === 0 && neg === 0) return null;
  return Math.max(0, Math.min(100, 50 + pos * 15 - neg * 15));
}

// ─── CSV parser ───────────────────────────────────────────────────────────────

// Parses a CSV string into an array of flat objects keyed by header name.
// Handles RFC-4180 quoted fields (commas and escaped quotes inside values).
function parseCsv(text) {
  const normalized = text.replace(/\r\n/g, "\n").replace(/\r/g, "\n").trim();
  const lines = normalized.split("\n");
  if (lines.length < 2) return [];

  function parseRow(line) {
    const fields = [];
    let i = 0;
    while (i <= line.length) {
      if (line[i] === '"') {
        i++;
        let val = "";
        while (i < line.length) {
          if (line[i] === '"' && line[i + 1] === '"') {
            val += '"';
            i += 2;
          } else if (line[i] === '"') {
            i++;
            break;
          } else {
            val += line[i++];
          }
        }
        fields.push(val);
        if (line[i] === ",") i++;
      } else {
        const end = line.indexOf(",", i);
        if (end === -1) {
          fields.push(line.slice(i));
          break;
        } else {
          fields.push(line.slice(i, end));
          i = end + 1;
        }
      }
    }
    return fields;
  }

  const headers = parseRow(lines[0]);
  const rows = [];
  for (let i = 1; i < lines.length; i++) {
    if (!lines[i].trim()) continue;
    const values = parseRow(lines[i]);
    const obj = {};
    headers.forEach((h, idx) => {
      obj[h] = values[idx] ?? "";
    });
    rows.push(obj);
  }
  return rows;
}

// Expand dot-separated flat keys into nested objects.
// e.g. { "bleeding.value": "2" } → { bleeding: { value: "2" } }
function unflatten(flat) {
  const out = {};
  for (const [key, val] of Object.entries(flat)) {
    const dot = key.indexOf(".");
    if (dot === -1) {
      out[key] = val;
    } else {
      const parent = key.slice(0, dot);
      const child = key.slice(dot + 1);
      if (!out[parent]) out[parent] = {};
      out[parent][child] = val;
    }
  }
  return out;
}

// Coerce string values from a parsed CSV row into typed values.
function coerceRow(raw) {
  const row = { date: raw.date };

  // Bleeding
  if (raw.bleeding) {
    const val = raw.bleeding.value;
    if (val !== "" && val !== undefined) {
      row.bleeding = {
        value: parseInt(val, 10),
        exclude: raw.bleeding.exclude === "true",
      };
    }
  }

  // Pain
  if (raw.pain) {
    const PAIN_FLAGS = [
      "cramps", "ovulationPain", "headache", "backache",
      "nausea", "tenderBreasts", "migraine", "other",
    ];
    const pain = {};
    let any = false;
    for (const f of PAIN_FLAGS) {
      if (raw.pain[f] === "true") { pain[f] = true; any = true; }
    }
    if (raw.pain.note) pain.note = raw.pain.note;
    if (any || pain.note) row.pain = pain;
  }

  // Mood
  if (raw.mood) {
    const MOOD_FLAGS = [
      "happy", "sad", "stressed", "balanced", "fine",
      "anxious", "energetic", "fatigue", "angry", "other",
    ];
    const mood = {};
    let any = false;
    for (const f of MOOD_FLAGS) {
      if (raw.mood[f] === "true") { mood[f] = true; any = true; }
    }
    if (raw.mood.note) mood.note = raw.mood.note;
    if (any || mood.note) row.mood = mood;
  }

  // Note
  if (raw.note && raw.note.value) row.noteValue = raw.note.value;

  return row;
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Parse a drip CSV export and return converted logs ready to merge into state.
 *
 * Returns { logs, periodCount, dayCount } on success, or { error } on failure.
 * logs: { "YYYY-MM-DD": { flow?, pain?, mood?, note? } }
 */
export function parseDripCsv(csvText) {
  let flatRows;
  try {
    flatRows = parseCsv(csvText);
  } catch (e) {
    return { error: "Could not parse the CSV file." };
  }

  if (flatRows.length === 0 || !flatRows[0].date) {
    return { error: "No data found. Make sure you exported from drip (Settings → Data → Export as CSV)." };
  }

  const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
  if (!DATE_RE.test(flatRows[0].date)) {
    return { error: "Unrecognized format. Expected drip CSV with YYYY-MM-DD dates." };
  }

  const logs = {};
  const today = new Date().toISOString().slice(0, 10);

  for (const flat of flatRows) {
    const raw = unflatten(flat);
    const row = coerceRow(raw);

    if (!row.date || !DATE_RE.test(row.date)) continue;
    if (row.date > today) continue; // ignore future entries

    const log = {};

    if (row.bleeding && !row.bleeding.exclude && typeof row.bleeding.value === "number") {
      const flow = dripBleedingToFlow(row.bleeding.value);
      if (flow !== null) log.flow = flow;
    }

    const pain = dripPainToPainValue(row.pain);
    if (pain !== null) log.pain = pain;

    const mood = dripMoodToMoodValue(row.mood);
    if (mood !== null) log.mood = mood;

    // Combine main note + pain note + mood note
    const noteParts = [];
    if (row.noteValue) noteParts.push(row.noteValue);
    if (row.pain?.note) noteParts.push(row.pain.note);
    if (row.mood?.note) noteParts.push(row.mood.note);
    if (noteParts.length > 0) log.note = noteParts.join(" | ").slice(0, 500);

    if (Object.keys(log).length > 0) logs[row.date] = log;
  }

  const periodCount = Object.values(logs).filter((l) => l.flow).length;

  return { logs, periodCount, dayCount: Object.keys(logs).length };
}

/**
 * Rebuild cycleHistory from a logs object using 1-day gap tolerance
 * (matches isSameMenses in periodMarking.js).
 *
 * Returns { cycleHistory, lastPeriodStart }.
 */
export function buildCycleHistoryFromLogs(logs, fallbackCycleLength = 28) {
  const MAX_GAP = 2; // days between two flow dates to still be same menses

  const flowDates = Object.keys(logs)
    .filter((d) => logs[d].flow)
    .sort();

  if (flowDates.length === 0) {
    return { cycleHistory: [], lastPeriodStart: null };
  }

  // Group into menses episodes — consecutive flow days with gap ≤ MAX_GAP.
  const episodes = [];
  let episode = [flowDates[0]];
  for (let i = 1; i < flowDates.length; i++) {
    const a = _localDate(episode[episode.length - 1]);
    const b = _localDate(flowDates[i]);
    const gap = Math.round((b - a) / 86400000);
    if (gap <= MAX_GAP) {
      episode.push(flowDates[i]);
    } else {
      episodes.push(episode);
      episode = [flowDates[i]];
    }
  }
  episodes.push(episode);

  const starts = episodes.map((e) => e[0]);

  // Compute cycle lengths between consecutive starts.
  const cycleHistory = starts.map((start, i) => {
    const next = starts[i + 1];
    if (!next) return { start, length: fallbackCycleLength };
    const len = Math.round(
      (_localDate(next) - _localDate(start)) / 86400000
    );
    // Only record valid cycle lengths (same range as updateCycleHistory).
    return { start, length: len > 14 && len < 60 ? len : fallbackCycleLength };
  });

  return { cycleHistory, lastPeriodStart: starts[starts.length - 1] };
}

// Parse YYYY-MM-DD as a local date (avoids UTC midnight timezone shifts).
function _localDate(str) {
  const [y, m, d] = str.split("-").map(Number);
  return new Date(y, m - 1, d);
}
