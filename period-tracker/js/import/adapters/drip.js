import { toISO } from "../../dateUtils.js";

const FLOW_4_TOKEN = "flow:4";
const MAX_GAP = 2;

const PAIN_FLAGS = [
  "cramps", "ovulationPain", "headache", "backache",
  "nausea", "tenderBreasts", "migraine", "other",
];

const MOOD_FLAGS = [
  "happy", "sad", "stressed", "balanced", "fine",
  "anxious", "energetic", "fatigue", "angry", "other",
];

function dripBleedingToFlow(value) {
  if (value === 1) return 1;
  if (value === 2) return 2;
  if (value === 3) return 3;
  return null;
}

function dripPainToPainValue(pain) {
  if (!pain) return null;
  const numericNote = Number(pain.note);
  if (
    pain.note !== "" &&
    Number.isFinite(numericNote) &&
    numericNote >= 0 &&
    numericNote <= 10
  ) {
    return Math.round(numericNote * 2) / 2;
  }
  const count = PAIN_FLAGS.filter((flag) => pain[flag]).length;
  if (count === 0) return null;
  return Math.min(10, Math.round(count * 1.3 + 1.5));
}

function dripMoodToMoodValue(mood) {
  if (!mood) return null;
  const numericNote = Number(mood.note);
  if (
    mood.note !== "" &&
    Number.isFinite(numericNote) &&
    [0, 50, 100].includes(numericNote)
  ) {
    return numericNote;
  }
  const pos = [mood.happy, mood.energetic, mood.fine, mood.balanced].filter(Boolean).length;
  const neg = [mood.sad, mood.stressed, mood.anxious, mood.fatigue, mood.angry].filter(Boolean).length;
  if (pos === 0 && neg === 0) return null;
  return Math.max(0, Math.min(100, 50 + pos * 15 - neg * 15));
}

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
        }
        fields.push(line.slice(i, end));
        i = end + 1;
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

function isTruthyField(value) {
  return value !== "" && value !== undefined && value !== "false";
}

function stripFlow4Token(note) {
  if (!note) return undefined;
  const parts = note
    .split("|")
    .map((part) => part.trim())
    .filter((part) => part && part !== FLOW_4_TOKEN);
  return parts.length > 0 ? parts.join(" | ") : undefined;
}

function noteContainsFlow4Token(note) {
  if (!note) return false;
  return note.split("|").some((part) => part.trim() === FLOW_4_TOKEN);
}

function collectLeftovers(raw) {
  const leftovers = [];

  if (raw.temperature) {
    const temp = raw.temperature;
    if (isTruthyField(temp.value)) {
      leftovers.push(`temperature:${temp.value}`);
    } else {
      if (isTruthyField(temp.time)) leftovers.push(`temperature.time:${temp.time}`);
      if (isTruthyField(temp.note)) leftovers.push(`temperature.note:${temp.note}`);
    }
    if (temp.exclude === "true") leftovers.push("temperature.exclude:true");
  }

  if (raw.mucus) {
    for (const [key, val] of Object.entries(raw.mucus)) {
      if (isTruthyField(val)) leftovers.push(`mucus.${key}:${val}`);
    }
  }

  if (raw.cervix) {
    for (const [key, val] of Object.entries(raw.cervix)) {
      if (isTruthyField(val)) leftovers.push(`cervix.${key}:${val}`);
    }
  }

  if (isTruthyField(raw.desire?.value)) {
    leftovers.push(`desire:${raw.desire.value}`);
  }

  if (raw.sex) {
    for (const [key, val] of Object.entries(raw.sex)) {
      if (isTruthyField(val)) leftovers.push(`sex.${key}:${val}`);
    }
  }

  return leftovers;
}

function coerceRow(raw) {
  const row = { date: raw.date };

  if (raw.bleeding) {
    const val = raw.bleeding.value;
    if (val !== "" && val !== undefined) {
      row.bleeding = {
        value: parseInt(val, 10),
        exclude: raw.bleeding.exclude === "true",
      };
    }
  }

  if (raw.pain) {
    const pain = {};
    let any = false;
    for (const flag of PAIN_FLAGS) {
      if (raw.pain[flag] === "true") {
        pain[flag] = true;
        any = true;
      }
    }
    if (raw.pain.note) pain.note = raw.pain.note;
    if (any || pain.note) row.pain = pain;
  }

  if (raw.mood) {
    const mood = {};
    let any = false;
    for (const flag of MOOD_FLAGS) {
      if (raw.mood[flag] === "true") {
        mood[flag] = true;
        any = true;
      }
    }
    if (raw.mood.note) mood.note = raw.mood.note;
    if (any || mood.note) row.mood = mood;
  }

  if (raw.note && raw.note.value) row.noteValue = raw.note.value;

  return row;
}

function buildPeriodsFromDays(days) {
  const relevantDates = Object.keys(days)
    .filter((date) => days[date].flow !== undefined || days[date].spotting)
    .sort();

  if (relevantDates.length === 0) {
    return [];
  }

  const groups = [];
  let group = [relevantDates[0]];

  for (let i = 1; i < relevantDates.length; i++) {
    const prev = _localDate(group[group.length - 1]);
    const curr = _localDate(relevantDates[i]);
    const gap = Math.round((curr - prev) / 86400000);
    if (gap <= MAX_GAP) {
      group.push(relevantDates[i]);
    } else {
      groups.push(group);
      group = [relevantDates[i]];
    }
  }
  groups.push(group);

  return groups.map((dates) => ({
    start: dates[0],
    end: dates[dates.length - 1],
    hasSourceFlow: dates.some((date) => days[date].flow !== undefined),
  }));
}

function _localDate(str) {
  const [y, m, d] = str.split("-").map(Number);
  return new Date(y, m - 1, d);
}

/**
 * Parse a drip CSV export into the shared ImportPreview model.
 *
 * @returns {{ preview: import("../import-core.js").ImportPreview }} | {{ error: string }}
 */
export function parseDripCsvToPreview(csvText) {
  let flatRows;
  try {
    flatRows = parseCsv(csvText);
  } catch {
    return { error: "Could not parse the CSV file." };
  }

  if (flatRows.length === 0 || !flatRows[0].date) {
    return {
      error: "No data found. Make sure you exported from drip (Settings → Data → Export as CSV).",
    };
  }

  const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
  if (!DATE_RE.test(flatRows[0].date)) {
    return { error: "Unrecognized format. Expected drip CSV with YYYY-MM-DD dates." };
  }

  const days = {};
  const today = toISO(new Date());

  for (const flat of flatRows) {
    const raw = unflatten(flat);
    const row = coerceRow(raw);

    if (!row.date || !DATE_RE.test(row.date)) continue;
    if (row.date > today) continue;

    const day = { leftovers: [] };
    const leftovers = collectLeftovers(raw);

    if (row.bleeding && !row.bleeding.exclude && typeof row.bleeding.value === "number") {
      const noteValue = row.noteValue || "";
      const hasFlow4Token = noteContainsFlow4Token(noteValue);

      if (row.bleeding.value === 0) {
        day.spotting = true;
      } else if (row.bleeding.value === 3 && hasFlow4Token) {
        day.flow = 4;
      } else {
        const flow = dripBleedingToFlow(row.bleeding.value);
        if (flow !== null) day.flow = flow;
      }
    }

    const pain = dripPainToPainValue(row.pain);
    if (pain !== null) day.pain = pain;

    const mood = dripMoodToMoodValue(row.mood);
    if (mood !== null) day.mood = mood;

    const noteParts = [];
    if (row.noteValue) {
      const stripped = stripFlow4Token(row.noteValue);
      if (stripped) noteParts.push(stripped);
    }
    if (row.pain?.note && !/^(?:10|[0-9](?:\.5)?)$/.test(row.pain.note.trim())) {
      noteParts.push(row.pain.note);
    }
    if (row.mood?.note && !/^(?:0|50|100)$/.test(row.mood.note.trim())) {
      noteParts.push(row.mood.note);
    }
    if (noteParts.length > 0) {
      day.note = noteParts.join(" | ");
    }

    if (leftovers.length > 0) {
      day.leftovers.push(...leftovers);
    }

    const hasData =
      day.flow !== undefined ||
      day.spotting ||
      day.pain !== undefined ||
      day.mood !== undefined ||
      day.note ||
      day.leftovers.length > 0;

    if (hasData) {
      days[row.date] = day;
    }
  }

  return {
    preview: {
      source: "drip",
      periods: buildPeriodsFromDays(days),
      days,
      unmappedMoods: [],
    },
  };
}

/**
 * Rebuild cycleHistory from a logs object using 1-day gap tolerance
 * (matches isSameMenses in periodMarking.js).
 */
export function buildCycleHistoryFromLogs(logs, fallbackCycleLength = 28) {
  const flowDates = Object.keys(logs)
    .filter((d) => logs[d].flow)
    .sort();

  if (flowDates.length === 0) {
    return { cycleHistory: [], lastPeriodStart: null };
  }

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

  const cycleHistory = starts.map((start, i) => {
    const next = starts[i + 1];
    if (!next) return { start, length: fallbackCycleLength };
    const len = Math.round((_localDate(next) - _localDate(start)) / 86400000);
    return { start, length: len > 14 && len < 60 ? len : fallbackCycleLength };
  });

  return { cycleHistory, lastPeriodStart: starts[starts.length - 1] };
}
