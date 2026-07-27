# Multi-app import redesign

**Date:** 2026-07-27  
**Status:** Approved for planning  
**App:** My Cycle Keeper (`period-tracker/`)

## Problem

Importing history today feels bolted on:

1. My Calendar export → separate `mycalendar-to-drip.html` converter (flow pattern only) → drip CSV → in-app drip import  
2. Leaving the SPA for the converter unloads the session; users hit login/errors even though the downloaded CSV still works after re-login  
3. My Calendar extras (symptoms, temperature, moods) and most drip columns are dropped  
4. My Calendar can encode per-day flow via `Symptoms:+…++++Flow`, but the converter only used Period Starts/Ends + a manual pattern  
5. Many source apps use four flow intensities; this app only has Light / Medium / Heavy (plus spotting)

## Goals

- One in-app **Import from another app** flow that feels native (Settings + onboarding)
- Direct import from **My Calendar** and **drip**, with a clear extension point for more apps
- Flow: use source values when present; always allow a typed day-of-period pattern; if source flow exists, choose overwrite vs fill-gaps only
- Mood: import when mappable (drip flags/notes today); My Calendar mood labels are reported as unmapped for manual entry; no mood pattern UI
- Unmapped / unsupported fields: short truncated day note + full leftovers in an import report; report is copyable and exportable as `.txt` / `.csv`
- Add **flow level 4 (Very heavy)** without rescaling existing `1–3` data
- Never navigate away from the running app during import (preserve unlock/onboarding session)
- Import overlay uses the same theme tokens and UI patterns as the rest of the app (no bolted-on tool styling)

## Non-goals (v1)

- Auto-mapping My Calendar pain-like symptoms into numeric pain (drip pain mapping stays as today)
- Mood pattern UI
- Persisting the import report inside encrypted health state
- New symptom types beyond flow level 4
- Changing Google Drive backup format beyond whatever already serializes `state.logs`

## Approach

**Source adapters + one in-app wizard** (chosen over auto-detect-only or parallel bolt-on paths).

```
Pick source → Choose file → Review + flow pattern → Apply (merge/replace) → Import report
```

All steps run inside the existing app overlay stack. Standalone `mycalendar-to-drip.html` / `import-drip.html` are retired as primary paths (redirect or deep-link into the app import after unlock only).

---

## Architecture

### Modules

| Module | Role |
|--------|------|
| `js/import/adapters/mycalendar.js` | Parse My Calendar `.txt` / TSV export |
| `js/import/adapters/drip.js` | Parse drip CSV (refactor of `import-drip.js`) |
| `js/import/import-core.js` | Shared preview model, pattern apply, leftover summarization, apply-to-state helpers |
| UI (overlay in `index.html` + wiring in `script.js`) | Wizard steps, report panel, exports |

Future apps add another adapter that returns the same preview model; the wizard registers it in the source picker.

### Shared preview model

Every adapter returns roughly:

```text
{
  source: "mycalendar" | "drip" | …,
  periods: [{ start, end, hasSourceFlow }],
  days: {
    "YYYY-MM-DD": {
      flow?: 1|2|3|4,
      spotting?: true,
      mood?: number,     // drip-mapped mood when present; My Calendar moods are unmapped in v1
      pain?: number,     // drip only in v1
      note?: string,     // source user note if any
      leftovers: string[]
    }
  },
  unmappedMoods: [{ date, label }],
  counts: { periods, periodsWithFlow, daysWithFlow, daysWithMood, daysWithLeftovers, unmappedMoodCount }
}
```

`buildCycleHistoryFromLogs` (existing) remains the cycle rebuild path after logs are finalized.

### Session / login safety

- Import never sets `location`, never full-reloads the document, and must not rely on separate HTML tools while unlocked
- Onboarding import continues on the onboarding screen (PIN already in memory), same as today’s drip onboarding path
- Service worker updates must not force-reload mid-wizard (reuse existing unlock/import single-flight protections where applicable)

---

## Wizard UX

### Entry

- Settings → Security: replace “Import from drip (CSV)” + converter link with **Import from another app**
- Onboarding: same entry (alongside encrypted backup import)
- Encrypted `.bin` backup import stays separate

### Steps

1. **Pick source** — My Calendar | drip (extensible list)
2. **Choose file** — accept types appropriate to source (`.txt`/`.csv` for My Calendar; `.csv` for drip)
3. **Review + flow pattern**
   - Show: *N periods total, M with identified source flow*
   - Always show pattern input (app levels `1–4`; `0` = spotting for pattern convenience)
   - Hint under the field: if the pattern is longer than a period, extra days are ignored; if shorter, the last level repeats for the rest of the period
   - Presets: at least `2,3,3,1`, `1,2,3,2,1`, `2`, `3`, `1,1,1,1,1`
   - When `M > 0`: radio/choice **Overwrite existing flow** vs **Only fill periods with no flow**
   - Pattern semantics: from each period start, apply pattern day-by-day; last value repeats if period longer; extra pattern values dropped if period shorter
4. **Apply**
   - Onboarding: write logs + cycle history, finish onboarding
   - In-app with existing data: keep today’s **Merge** (keep existing logs on date collision) vs **Replace** (imported wins) choice for the overall dataset
5. **Import report** — short result line; unmapped moods / leftovers only when present (with extras note); Copy / Export txt / Export csv when extras exist; Done

---

## Data mapping

### My Calendar

File shape: tab-separated lines `Mon D, YYYY\tEvent…` (also tolerate pasted variants the converter already accepted).

| Source | Mapping |
|--------|---------|
| `Period Starts` / `Period Ends` | Pair into periods (same open-start / orphan-end rules as current converter) |
| `Symptoms:…` with `Flow` under `+`–`++++` group | `+`→1, `++`→2, `+++`→3, `++++`→4 |
| `Spotting` in symptoms | `spotting: true` (not flow) |
| `Moods:Label` | **v1:** no label→0/50/100 dictionary — every `Moods:` value goes to `unmappedMoods` only (not written as `mood`) |
| Temperature, other symptoms, mood labels (also mirrored into leftovers if useful), etc. | `leftovers[]` for that date |

Pain-like My Calendar symptoms are **not** mapped to numeric pain in v1 (leftovers only).

### drip

| Source | Mapping |
|--------|---------|
| `bleeding.value` 1–3 | flow 1–3 |
| `bleeding.value` 0 | spotting |
| (no drip level 4) | — |
| Mood flags / numeric mood notes | Existing drip→mood conversion when present |
| Pain flags / numeric pain notes | Existing drip→pain conversion |
| temperature, mucus, cervix, sex, desire, extra notes, … | leftovers |

### Flow pattern application

After adapter parse:

1. Compute periods and which have any source flow day  
2. Review UI always offers the pattern field. When `M > 0`, also show apply mode:
   - **Overwrite:** non-empty pattern replaces flow on **all** period days (`0` → spotting for that day)
   - **Fill gaps only:** non-empty pattern applies only to periods with `hasSourceFlow === false`; periods with source flow keep source values  
   When `M === 0`, treat as fill-all (no mode control needed): non-empty pattern expands every period start–end into daily flow  
3. **Empty pattern:** when `periodsWithFlow < periods`, treat empty as `1` (light), prefill the field, and apply. When every period already has source flow, empty pattern leaves source flow/spotting as parsed. Review may still warn when gaps exist. Allow apply if at least one usable day remains (flow, spotting, mood, pain, note, or leftovers); block apply only if the result would be completely empty  
4. Non-period leftover / unmapped-mood days remain as parsed  
5. Pattern apply (within the import preview) is independent of the later **Merge vs Replace** choice against existing app `state.logs`

### Notes on apply

For each day with leftovers:

- Build a short leftover summary appended to any imported user note
- Truncate final `note` to **500** characters (current app limit)
- Full leftover strings remain only in the import report / exports

---

## Import report + export

Shown in the same overlay after apply (and available when there are warnings). Held **in memory for the session** only — not stored in IndexedDB/encrypted state.

### Sections

1. Summary — single result line: `Imported {days} period days across {periods} cycles.`  
   When unmapped moods or leftovers exist, also show a short extras note (details aren’t tracked in-app yet; listed below for backup / notes).
2. Unmapped moods — `YYYY-MM-DD — Label` (hide if empty)  
3. Leftovers by day — full leftover text per date (hide if empty)

### Actions

- **Copy** / **Export .txt** / **Export .csv** — shown only when extras exist  
  - Copy / txt: same short summary (+ extras note when present) plus unmapped and leftover sections  
  - CSV: rows `date,kind,detail` with `kind` ∈ `unmapped_mood` | `leftover` (RFC-4180 quoting)  
- **Done** — close overlay; session stays unlocked

---

## Flow level 4 (“Very heavy”)

Add `flow: 4` without rescaling existing data.

| Value | Label | Typical sources |
|------:|-------|-----------------|
| spotting | Spotting | drip `0`; My Calendar Spotting |
| 1 | Light | drip `1`; `+Flow` |
| 2 | Medium | drip `2`; `++Flow` |
| 3 | Heavy | drip `3`; `+++Flow` |
| 4 | Very heavy | `++++Flow` (and future apps) |

### Product touch points

- Validators + daily log flow controls + i18n (`flow_very_heavy` / locale equivalents)
- Calendar `.flow-4` styling; charts/history that currently clamp to 3 must allow 4 (scale off max 4)
- Insights: peak flow includes 4; “heavy-flow days” counts `flow >= 3` (Heavy + Very heavy)
- drip **export:** map `4 → bleeding.value 3` and add a recoverable token in `note.value` (e.g. `flow:4`) when it does not collide with an existing structured note, so re-import can restore Very heavy
- **No schema version bump required** — `flow` remains a number; old blobs with 1–3 stay valid

---

## Error handling

- Unreadable / wrong-format file → modal with source-specific hint (how to export from that app)
- Zero usable periods/days → empty-import modal; do not apply  
- Pattern parse errors → inline validation on review step (block apply)  
- Apply/save failures → existing save error UX; do not clear session PIN

## Testing (acceptance)

- My Calendar sample: July 8–13 flow `+++ / ++++ / ++ / + / + / +` → levels `3,4,2,1,1,1`; Jul 13 leftovers + `Moods:Angelic` in unmapped report  
- Historical My Calendar periods with no `Flow` symptoms: pattern fill works; overwrite vs fill-gaps behaves correctly when mixed with July  
- drip sample: bleeding-only CSV imports flow; no false mood; empty leftover sections hidden  
- Import while unlocked never returns to lock screen / does not require re-login  
- Onboarding import still completes PIN setup  
- Merge vs Replace still correct for in-app re-import  
- Flow 4 appears in log UI, calendar, charts; existing flow 3 days unchanged  
- Report result line is short (`Imported {days} period days across {periods} cycles.`); extras note + Copy / Export only when unmapped/leftovers exist; exports contain full leftover detail  
- Flow pattern hint visible; longer patterns truncate, shorter patterns repeat last level; empty + gaps defaults to `1`  
- Note field never exceeds 500 chars after import  

## Migration / cleanup

- Point About / HANDOFF / i18n copy away from “convert My Calendar → drip first”
- Deprecate primary use of `mycalendar-to-drip.html` and `import-drip.html` (redirect or short “open the app → Import from another app” message)
- Bump `CACHE_VERSION` when shipping

## Open follow-ups (explicitly later)

- Map My Calendar pain symptoms to numeric pain  
- Mood pattern UI  
- Persist last import report across lock (optional)
- Additional app adapters
