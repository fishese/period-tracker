# Multi-app Import + Flow Level 4 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship an in-app multi-source import wizard (My Calendar + drip) with flow patterns, leftover/unmapped-mood reports (copy + export), and a new flow level 4 (Very heavy) without rescaling existing data — without kicking users out of an unlocked session.

**Architecture:** Pure JS adapters (`mycalendar`, `drip`) normalize exports into a shared preview model; `import-core.js` applies flow patterns and builds apply-ready logs + an in-memory report; the existing Settings/onboarding overlay hosts the wizard. Flow level 4 is a cross-cutting validators/UI change required for My Calendar `++++Flow`.

**Tech Stack:** Vanilla ES modules (no bundler), IndexedDB + AES-GCM (unchanged), Node built-in test runner (`node --test`) for pure logic, manual browser checks for UI/session.

## Global Constraints

- Never navigate away / full-reload during import (preserve unlock + onboarding PIN session)
- Do not rescale existing flow `1–3`; only add `4`
- Notes max 500 chars; full leftovers live in the report/export only
- My Calendar moods: all labels → `unmappedMoods` (no auto mood map in v1)
- My Calendar pain-like symptoms → leftovers only (drip pain mapping stays)
- No encrypted-state persistence of the import report
- Sample fixtures for automated tests: copy snippets into `period-tracker/js/import/fixtures/` (do not depend on gitignored `sampledata/` at runtime)
- Spec: `docs/superpowers/specs/2026-07-27-multi-app-import-design.md`

---

## File map

| Path | Responsibility |
|------|----------------|
| `period-tracker/package.json` | `"type": "module"` + `npm test` → `node --test` |
| `period-tracker/js/validators.js` | Flow normalize/read/write allow `0–4` (0=spotting UI level) |
| `period-tracker/js/import/import-core.js` | Pattern parse/apply, preview→logs, note truncation, report text/csv |
| `period-tracker/js/import/adapters/drip.js` | drip CSV → preview (+ leftovers); re-export `buildCycleHistoryFromLogs` |
| `period-tracker/js/import/adapters/mycalendar.js` | My Calendar txt → preview |
| `period-tracker/js/import/fixtures/*` | Tiny fixture strings for tests |
| `period-tracker/js/import/tests/*.test.js` | Unit tests |
| `period-tracker/js/import-drip.js` | Thin re-export shim for any leftover imports during migration |
| `period-tracker/js/export-drip.js` | Map flow `4→3` + `flow:4` note token; restore on import |
| `period-tracker/index.html` | Flow-4 choice; replace drip-only overlay with multi-step wizard |
| `period-tracker/js/script.js` | Wizard wiring, apply/merge/replace, session-safe entry points |
| `period-tracker/style.css` | `.flow-4`, wizard/report styles |
| `period-tracker/js/i18n.js` | New copy keys (en + existing locales that already have flow keys) |
| `period-tracker/mycalendar-to-drip.html`, `import-drip.html` | Redirect/message → open app import |
| `period-tracker/service-worker.js` | Bump `CACHE_VERSION` |
| `period-tracker/docs/HANDOFF.md` | Document new import path |

---

### Task 1: Test harness + flow level 4 in validators

**Files:**
- Create: `period-tracker/package.json`
- Create: `period-tracker/js/import/tests/validators-flow.test.js`
- Modify: `period-tracker/js/validators.js`

**Interfaces:**
- Consumes: none
- Produces:
  - `normalizeFlowValue(value, fallback?) → number` clamp **1–4**
  - `normalizeFlowLevel(value, fallback?) → number` clamp **0–4** (0=spotting)
  - `getFlowLevelFromLog(log) → number|null` (spotting→0, flow 1–4)
  - `applyFlowLevelToLog(log, level)` sets spotting or `flow` 1–4

- [ ] **Step 1: Add package.json**

```json
{
  "name": "mycyclekeeper-period-tracker",
  "private": true,
  "type": "module",
  "scripts": {
    "test": "node --test js/import/tests/*.test.js"
  }
}
```

- [ ] **Step 2: Write failing tests**

```js
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  normalizeFlowValue,
  normalizeFlowLevel,
  getFlowLevelFromLog,
  applyFlowLevelToLog,
} from "../../validators.js";

describe("flow level 4", () => {
  it("normalizeFlowValue keeps 1-3 and allows 4", () => {
    assert.equal(normalizeFlowValue(1), 1);
    assert.equal(normalizeFlowValue(3), 3);
    assert.equal(normalizeFlowValue(4), 4);
    assert.equal(normalizeFlowValue(5), 4);
    assert.equal(normalizeFlowValue(0), 1);
  });

  it("normalizeFlowLevel allows spotting 0 through very heavy 4", () => {
    assert.equal(normalizeFlowLevel(0), 0);
    assert.equal(normalizeFlowLevel(4), 4);
    assert.equal(normalizeFlowLevel(9), 4);
  });

  it("getFlowLevelFromLog / applyFlowLevelToLog round-trip 4", () => {
    const log = {};
    applyFlowLevelToLog(log, 4);
    assert.equal(log.flow, 4);
    assert.equal(log.spotting, undefined);
    assert.equal(getFlowLevelFromLog(log), 4);
  });

  it("does not rescale a stored 3", () => {
    assert.equal(getFlowLevelFromLog({ flow: 3 }), 3);
  });
});
```

- [ ] **Step 3: Run tests — expect FAIL**

Run: `cd period-tracker && npm test`  
Expected: FAIL (`normalizeFlowValue(4)` currently clamps to 3)

- [ ] **Step 4: Update validators.js clamps**

In `normalizeFlowValue`, change `Math.min(3, …)` → `Math.min(4, …)`.  
In `normalizeFlowLevel`, change `Math.min(3, …)` → `Math.min(4, …)`.  
Update the comment on `normalizeFlowLevel` to `0 = spotting, 1–4 = light…very heavy`.

- [ ] **Step 5: Run tests — expect PASS**

Run: `cd period-tracker && npm test`  
Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add period-tracker/package.json period-tracker/js/validators.js period-tracker/js/import/tests/validators-flow.test.js
git commit -m "feat: allow flow level 4 in validators"
```

---

### Task 2: Flow level 4 in UI, calendar, charts, i18n

**Files:**
- Modify: `period-tracker/index.html` (add Very heavy choice after Heavy)
- Modify: `period-tracker/js/script.js` (labels arrays, chart clamps `/3` → `/4`, heavy-days `>= 3`)
- Modify: `period-tracker/style.css` (`.cal-day.flow-4`, `.profile-day--flow-4`)
- Modify: `period-tracker/js/i18n.js` (`flow_very_heavy` in en, ru, be, es, ja, zh-TW)

**Interfaces:**
- Consumes: `getFlowLevelFromLog` / `selectFlowValue(4)` from Task 1
- Produces: UI can record and display `flow: 4`

- [ ] **Step 1: Add log choice button**

In `index.html` after the Heavy button, add:

```html
<button type="button" class="log-choice" data-flow-value="4" onclick="selectFlowValue(4)" data-i18n="flow_very_heavy">Very heavy</button>
```

- [ ] **Step 2: i18n keys**

Add `flow_very_heavy` next to each locale’s `flow_heavy`:
- en: `"Very heavy"`
- ja: `"とても多い"`
- zh-TW: `"極大量"`
- es: `"Muy abundante"`
- ru: `"Очень обильные"`
- be: `"Вельмі абутныя"`

- [ ] **Step 3: script.js label + chart updates**

Wherever flow labels are indexed as  
`[spotting, light, medium, heavy]`  
extend to  
`[spotting, light, medium, heavy, very_heavy]`  
and use `t("flow_very_heavy")` for level 4.

Replace clamps/scales that use `Math.min(day.flow, 3)` / `/ 3` for bar height or `flowIntensity` with max **4**.

Change heavy-day counters from `=== 3` to `>= 3`.

- [ ] **Step 4: CSS**

Mirror `.flow-3` / `.profile-day--flow-3` with a stronger `.flow-4` / `.profile-day--flow-4` (same rose family, higher opacity / thicker indicator — match existing visual language, no new color system).

- [ ] **Step 5: Manual browser check**

Run: `python -m http.server 8000` from repo root → open app → unlock → set a day to Very heavy → confirm calendar tint + insights bar.  
Expected: level 4 visible; existing heavy (3) days unchanged.

- [ ] **Step 6: Commit**

```bash
git add period-tracker/index.html period-tracker/js/script.js period-tracker/style.css period-tracker/js/i18n.js
git commit -m "feat: expose very-heavy flow in UI and charts"
```

---

### Task 3: import-core — pattern + preview→logs + report export

**Files:**
- Create: `period-tracker/js/import/import-core.js`
- Create: `period-tracker/js/import/tests/import-core.test.js`

**Interfaces:**
- Consumes: none (pure)
- Produces:
  - `parseFlowPattern(str) → { pattern: number[] } | { error: string }` values 0–4
  - `applyFlowPattern(preview, { pattern, mode: "overwrite"|"fill-gaps" }) → preview`  
    (`mode` ignored / treated as fill-all when no period has source flow)
  - `previewToLogs(preview) → { logs, unmappedMoods, leftoverReport }`  
    `logs[date]` = `{ flow?, spotting?, mood?, pain?, note? }` with note ≤500
  - `buildReportText(report) → string`
  - `buildReportCsv(report) → string` rows `date,kind,detail`
  - `countPreview(preview)` helper for `periodsWithFlow` etc. if not already on preview

Preview shape (lock this name):

```js
/**
 * @typedef {{
 *   source: string,
 *   periods: Array<{ start: string, end: string, hasSourceFlow: boolean }>,
 *   days: Record<string, {
 *     flow?: 1|2|3|4,
 *     spotting?: boolean,
 *     mood?: number,
 *     pain?: number,
 *     note?: string,
 *     leftovers: string[]
 *   }>,
 *   unmappedMoods: Array<{ date: string, label: string }>
 * }} ImportPreview
 */
```

- [ ] **Step 1: Write failing tests**

```js
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
    assert.match(buildReportText({
      summary: { source: "mycalendar" },
      unmappedMoods: preview.unmappedMoods,
      leftovers: leftoverReport,
    }), /Angelic/);
  });
});
```

- [ ] **Step 2: Run — expect FAIL** (module missing)

Run: `cd period-tracker && npm test`

- [ ] **Step 3: Implement `import-core.js`**

Implement the exports above. Date iteration must use local Y-M-D arithmetic (same idea as `_localDate` in current `import-drip.js`) — **never** `Date.toISOString()` for day keys.

Pattern day assignment: for each selected period, `offset=0…`, value = `pattern[min(offset, len-1)]`; `0` → set `spotting: true` and clear `flow`; `1–4` → set `flow` and clear spotting.

`previewToLogs` note builder: join existing `note` + short leftover summary (`leftovers.join("; ")`), then `.slice(0, 500)`.

Empty pattern: `applyFlowPattern` no-ops (returns clone unchanged).

- [ ] **Step 4: Run — expect PASS**

- [ ] **Step 5: Commit**

```bash
git add period-tracker/js/import/import-core.js period-tracker/js/import/tests/import-core.test.js
git commit -m "feat: add import-core pattern and report helpers"
```

---

### Task 4: drip adapter → ImportPreview (+ leftovers, flow:4 token)

**Files:**
- Create: `period-tracker/js/import/adapters/drip.js`
- Create: `period-tracker/js/import/fixtures/drip-mini.csv`
- Create: `period-tracker/js/import/tests/drip-adapter.test.js`
- Modify: `period-tracker/js/import-drip.js` → re-export shim
- Modify: `period-tracker/js/export-drip.js` (flow 4 → bleed 3 + `flow:4` token)

**Interfaces:**
- Consumes: preview shape from Task 3; existing drip CSV parsing logic
- Produces:
  - `parseDripCsvToPreview(csvText) → { preview } | { error }`
  - `buildCycleHistoryFromLogs(logs, fallbackCycleLength?)` (move/keep)
  - On re-import: if `note.value` contains `flow:4` and bleeding is 3, set `flow: 4` and strip token from note

- [ ] **Step 1: Fixture**

`drip-mini.csv` — header row matching drip export + 3 data rows: bleed 2, bleed 0 (spotting), bleed 3 with `note.value` empty; plus one row with `temperature.value=36.5` and no bleed (leftover).

- [ ] **Step 2: Failing tests**

```js
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
    // assert specific dates from fixture for flow/spotting/leftover temp
  });

  it("restores flow 4 from note token", () => {
    const text = `date,temperature.value,temperature.exclude,temperature.time,temperature.note,bleeding.value,bleeding.exclude,mucus.feeling,mucus.texture,mucus.value,mucus.exclude,cervix.opening,cervix.firmness,cervix.position,cervix.exclude,note.value,desire.value,sex.solo,sex.partner,sex.condom,sex.pill,sex.iud,sex.patch,sex.ring,sex.implant,sex.diaphragm,sex.none,sex.other,sex.note,pain.cramps,pain.ovulationPain,pain.headache,pain.backache,pain.nausea,pain.tenderBreasts,pain.migraine,pain.other,pain.note,mood.happy,mood.sad,mood.stressed,mood.balanced,mood.fine,mood.anxious,mood.energetic,mood.fatigue,mood.angry,mood.other,mood.note
2026-01-01,,,,,3,false,,,,,,,,,,flow:4,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,`;
    const { preview } = parseDripCsvToPreview(text);
    assert.equal(preview.days["2026-01-01"].flow, 4);
    assert.equal(preview.days["2026-01-01"].note, undefined);
  });
});
```

Fill exact assertions from the fixture you write.

- [ ] **Step 3: Implement adapter**

Move/adapt logic from `import-drip.js`. For each unused non-empty drip field (temp, mucus, cervix, sex, desire, extra notes not used as numeric pain/mood), push a human-readable leftover string e.g. `temperature:36.5`.

Build `periods` by grouping consecutive flow days with the same gap rule as `buildCycleHistoryFromLogs` (gap ≤2), or derive period ranges from flow episodes; set `hasSourceFlow: true` when any day in the episode has flow/spotting from source.

Keep mood/pain conversion behavior from current `import-drip.js`.

- [ ] **Step 4: Update export-drip.js**

```js
function flowToBleed(flow) {
  if (flow === 4) return 3;
  return flow >= 1 && flow <= 3 ? flow : null;
}
```

When writing a row with `flow === 4`, ensure `note.value` includes token `flow:4` (append with ` | ` if a user note exists; if note already has the token, don’t duplicate).

- [ ] **Step 5: Shim `import-drip.js`**

```js
export { buildCycleHistoryFromLogs } from "./import/adapters/drip.js";
// Optional compatibility: parseDripCsv wraps previewToLogs for old callers until script.js migrates
```

Prefer updating `script.js` imports in Task 6 rather than keeping a long-lived dual API.

- [ ] **Step 6: Tests PASS + commit**

```bash
git add period-tracker/js/import/adapters/drip.js period-tracker/js/import/fixtures/drip-mini.csv period-tracker/js/import/tests/drip-adapter.test.js period-tracker/js/import-drip.js period-tracker/js/export-drip.js
git commit -m "feat: drip adapter with leftovers and flow-4 round-trip"
```

---

### Task 5: My Calendar adapter

**Files:**
- Create: `period-tracker/js/import/adapters/mycalendar.js`
- Create: `period-tracker/js/import/fixtures/mycalendar-july.txt` (Jul 2026 period + moods/symptoms from the real sample)
- Create: `period-tracker/js/import/tests/mycalendar-adapter.test.js`

**Interfaces:**
- Consumes: preview shape
- Produces: `parseMyCalendarText(text) → { preview } | { error }`

- [ ] **Step 1: Fixture**

Copy these lines into the fixture (exact content from sample):

```text
Jul 8, 2026	Period Starts
Jul 8, 2026	Symptoms:+++Flow;
Jul 9, 2026	Symptoms:++++Flow;
Jul 9, 2026	Temperature:37.0℃
Jul 10, 2026	Symptoms:++Flow;
Jul 11, 2026	Symptoms:+Flow;
Jul 12, 2026	Symptoms:+Flow;
Jul 13, 2026	Period Ends
Jul 13, 2026	Symptoms:++++Acne,Backaches,...(full line from sample)...
Jul 13, 2026	Moods:Angelic
Jun 4, 2026	Period Starts
Jun 9, 2026	Period Ends
```

(Include the full Jul 13 Symptoms line from `sampledata/My Calendar-2026-07-27.txt`.)

- [ ] **Step 2: Failing tests**

```js
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
  });
});
```

- [ ] **Step 3: Implement parser**

Reuse date parsing approach from `mycalendar-to-drip.html` (`Mon D, YYYY` → ISO via **local** Y/M/D, not UTC `toISOString`).

Symptoms parsing:
- Split on `;` groups prefixed by `++++`, `+++`, `++`, `+` (match longest first)
- Within a group, comma-separated symptom names
- `Flow` → flow level by group stars
- `Spotting` → `spotting: true` (if same day also has Flow, keep both per spec: spotting separate; prefer recording spotting flag and flow if both appear — if conflict, flow wins for period math and still list Spotting in leftovers)
- All other symptom names → leftovers as `symptom(+…):Name` or keep compact `Symptoms:` residual string without the Flow token

`Moods:Label` → push `{ date, label }` to `unmappedMoods`; also add `Moods:Label` to leftovers for day-note summary visibility.

`Temperature:…` → leftover.

Period pairing: same as converter (open start, orphan end, etc.).

- [ ] **Step 4: Tests PASS + commit**

```bash
git add period-tracker/js/import/adapters/mycalendar.js period-tracker/js/import/fixtures/mycalendar-july.txt period-tracker/js/import/tests/mycalendar-adapter.test.js
git commit -m "feat: parse My Calendar exports into import preview"
```

---

### Task 6: In-app wizard UI + apply wiring (session-safe)

**Files:**
- Modify: `period-tracker/index.html` — replace `#csv-import-overlay` content with multi-step wizard
- Modify: `period-tracker/js/script.js` — wire wizard; remove navigation to standalone converters
- Modify: `period-tracker/style.css` — wizard steps / report panel
- Modify: `period-tracker/js/i18n.js` — wizard strings
- Modify: onboarding + Settings buttons (labels)

**Interfaces:**
- Consumes: `parseMyCalendarText`, `parseDripCsvToPreview`, `parseFlowPattern`, `applyFlowPattern`, `previewToLogs`, `buildReportText`, `buildReportCsv`, `buildCycleHistoryFromLogs`
- Produces: `showAppImportWizard({ onboarding })`, in-memory `_lastImportReport`

- [ ] **Step 1: HTML structure**

Replace drip-only panel with steps (all inside one overlay; toggle `.hidden` per step — **no** `location` changes):

1. Source picker (`My Calendar` | `drip`)
2. File picker + source-specific export hint
3. Review: counts `N` periods / `M` with flow; pattern input; presets; overwrite vs fill-gaps (show when `M > 0`); warning when `M < N`; Continue
4. Apply confirm: onboarding → apply; else Merge vs Replace modal (reuse existing modal pattern)
5. Report: summary, unmapped list, leftovers list, Copy / Export txt / Export csv / Done

Remove the “Convert My Calendar to drip →” link from the overlay.

- [ ] **Step 2: script.js flow**

```js
import { parseMyCalendarText } from "./import/adapters/mycalendar.js";
import { parseDripCsvToPreview, buildCycleHistoryFromLogs } from "./import/adapters/drip.js";
import {
  parseFlowPattern,
  applyFlowPattern,
  previewToLogs,
  buildReportText,
  buildReportCsv,
} from "./import/import-core.js";
```

Keep `_lastImportReport` in module scope.  
`chooseFile` → parse → store `_importPreview` → show review.  
On apply: pattern → `previewToLogs` → merge/replace into `state.logs` → `buildCycleHistoryFromLogs` → `save()` → show report.  
**Forbidden:** `window.location = …`, `location.href = …`, opening `mycalendar-to-drip.html`.

Entry points:
- Settings: `Import from another app` → `showAppImportWizard({ onboarding: false })`
- Onboarding: same with `onboarding: true` (require `setupPin.length >= 4` as today)

- [ ] **Step 3: Export buttons**

```js
function downloadText(filename, text, mime) {
  const blob = new Blob([text], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
```

Copy uses `navigator.clipboard.writeText(buildReportText(_lastImportReport))`.

- [ ] **Step 4: Manual session test**

1. Unlock app  
2. Settings → Import from another app → My Calendar → fixture file → pattern `2,3,3,1` fill-gaps → Merge/Replace → Done  
3. Confirm still unlocked (no lock screen)  
4. Open a July day — flow levels match; Jul 13 note truncated; report export works  

- [ ] **Step 5: Commit**

```bash
git add period-tracker/index.html period-tracker/js/script.js period-tracker/style.css period-tracker/js/i18n.js
git commit -m "feat: in-app multi-app import wizard"
```

---

### Task 7: Retire standalone pages + docs + cache bump

**Files:**
- Modify: `period-tracker/mycalendar-to-drip.html`
- Modify: `period-tracker/import-drip.html`
- Modify: `period-tracker/docs/HANDOFF.md`
- Modify: `period-tracker/service-worker.js` (`CACHE_VERSION`)
- Modify: About / i18n strings that still say “convert My Calendar → drip”

- [ ] **Step 1: Standalone pages**

Replace converter/import UI with a short message + link to `./` (or `./index.html`) telling the user to open **Settings → Import from another app** after unlocking. Do **not** auto-redirect with a script that could surprise a mid-session tab; a normal `<a href="./">` is enough.

- [ ] **Step 2: HANDOFF §7**

Replace the My Calendar → drip → import diagram with the new wizard path; note flow level 4; note leftover report exports.

- [ ] **Step 3: Bump CACHE_VERSION**

In `service-worker.js`, bump beyond current `v20260727q` (e.g. `v20260727r` or date of ship).

- [ ] **Step 4: Final verification**

Run: `cd period-tracker && npm test` — all PASS.  
Browser: onboarding import + settings import + drip file + My Calendar file + export report + confirm lock screen not triggered by import.

- [ ] **Step 5: Commit**

```bash
git add period-tracker/mycalendar-to-drip.html period-tracker/import-drip.html period-tracker/docs/HANDOFF.md period-tracker/service-worker.js period-tracker/js/i18n.js
git commit -m "chore: retire converter pages and document multi-app import"
```

---

## Spec coverage checklist

| Spec requirement | Task |
|------------------|------|
| Adapter architecture + shared preview | 3–5 |
| In-app wizard (source → file → pattern → apply → report) | 6 |
| My Calendar Flow +/++/+++/++++ | 5 |
| My Calendar moods unmapped + report | 5–6 |
| Leftovers truncated note + full report | 3, 6 |
| Report copy + txt/csv export | 3, 6 |
| Flow pattern + presets + overwrite/fill-gaps | 3, 6 |
| drip import with leftovers; pain/mood as today | 4 |
| Flow level 4 no rescale | 1–2 |
| drip export 4→3 + flow:4 token | 4 |
| Session-safe (no kick to login) | 6–7 |
| Retire standalone primary path | 7 |
| Merge/Replace preserved | 6 |

## Plan self-review notes

- No TBD placeholders; empty-pattern and My Calendar mood rules match the approved spec  
- `previewToLogs` / `parseDripCsvToPreview` / `parseMyCalendarText` names are consistent across tasks  
- UI Task 6 depends on Tasks 1–5; do not start wizard wiring before adapters pass tests  
