"use strict";

const HEADER = [
  "date",
  "temperature.value","temperature.exclude","temperature.time","temperature.note",
  "bleeding.value","bleeding.exclude",
  "mucus.feeling","mucus.texture","mucus.value","mucus.exclude",
  "cervix.opening","cervix.firmness","cervix.position","cervix.exclude",
  "note.value",
  "desire.value",
  "sex.solo","sex.partner","sex.condom","sex.pill","sex.iud","sex.patch",
  "sex.ring","sex.implant","sex.diaphragm","sex.none","sex.other","sex.note",
  "pain.cramps","pain.ovulationPain","pain.headache","pain.backache",
  "pain.nausea","pain.tenderBreasts","pain.migraine","pain.other","pain.note",
  "mood.happy","mood.sad","mood.stressed","mood.balanced","mood.fine",
  "mood.anxious","mood.energetic","mood.fatigue","mood.angry","mood.other","mood.note",
];

// Column indices for the fields we populate.
const COL = {
  date:         0,
  bleedVal:     5,
  bleedExclude: 6,
  noteVal:      15,
  painCramps:   29,
  painOvul:     30,
  painHead:     31,
  painBack:     32,
  painNausea:   33,
  painBreasts:  34,
  painMigraine: 35,
  painOther:    36,
  painNote:     37,
  moodHappy:    38,
  moodSad:      39,
  moodStressed: 40,
  moodBalanced: 41,
  moodFine:     42,
  moodAnxious:  43,
  moodEnergetic:44,
  moodFatigue:  45,
  moodAngry:    46,
  moodOther:    47,
  moodNote:     48,
};

// Wrap a field value in quotes if it contains commas, quotes, or newlines.
function csvField(val) {
  const s = String(val);
  if (s.includes(",") || s.includes('"') || s.includes("\n")) {
    return '"' + s.replace(/"/g, '""') + '"';
  }
  return s;
}

// app flow 1-3 maps 1:1 to drip bleeding.value 1-3 (light/medium/heavy).
function flowToBleed(flow) {
  return flow >= 1 && flow <= 3 ? flow : null;
}

// Approximate drip pain boolean flags from app's 1-10 pain scale.
// The numeric value is always stored in pain.note so it round-trips cleanly.
function painToCols(cols, pain) {
  if (pain >= 1)  cols[COL.painCramps]  = "true";
  if (pain >= 4)  cols[COL.painOther]   = "true";
  if (pain >= 6)  cols[COL.painBack]    = "true";
  if (pain >= 8)  cols[COL.painHead]    = "true";
  if (pain >= 9)  cols[COL.painNausea]  = "true";
  cols[COL.painNote] = String(pain);
}

// Approximate drip mood boolean flags from app's 0-100 mood scale.
// The numeric value is always stored in mood.note so it round-trips cleanly.
function moodToCols(cols, mood) {
  if      (mood >= 70) { cols[COL.moodHappy]    = "true"; cols[COL.moodFine]     = "true"; }
  else if (mood >= 55) { cols[COL.moodBalanced]  = "true"; cols[COL.moodFine]    = "true"; }
  else if (mood >= 45) { cols[COL.moodFine]      = "true"; }
  else if (mood >= 30) { cols[COL.moodStressed]  = "true"; cols[COL.moodFatigue] = "true"; }
  else                 { cols[COL.moodSad]        = "true"; cols[COL.moodAnxious] = "true";
                         cols[COL.moodStressed]   = "true"; }
  cols[COL.moodNote] = String(mood);
}

/**
 * Convert state.logs into a drip-compatible CSV string.
 * Rows are sorted newest-first (drip convention).
 * Only days with at least one data field are included.
 */
export function buildDripCsv(logs) {
  const rows = [HEADER.join(",")];

  const dates = Object.keys(logs)
    .filter(d => {
      const l = logs[d];
      return l.flow || l.pain || l.mood != null || (l.note && l.note.trim());
    })
    .sort((a, b) => (a < b ? 1 : -1)); // newest first

  for (const date of dates) {
    const log = logs[date];
    const cols = new Array(HEADER.length).fill("");

    cols[COL.date] = date;

    if (log.flow) {
      const bleed = flowToBleed(log.flow);
      if (bleed !== null) {
        cols[COL.bleedVal]     = String(bleed);
        cols[COL.bleedExclude] = "false";
      }
    }

    if (log.note && log.note.trim()) {
      cols[COL.noteVal] = csvField(log.note.trim());
    }

    if (log.pain) {
      painToCols(cols, log.pain);
    }

    if (log.mood != null) {
      moodToCols(cols, log.mood);
    }

    rows.push(cols.join(","));
  }

  return rows.join("\n");
}
