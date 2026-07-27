# Multi-format Export Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace drip-only Settings export with an in-app **Export to another app** wizard that downloads drip CSV or plain CSV, using the same theme tokens/overlay patterns as the import wizard, with adapters ready for future formats.

**Architecture:** Pure export adapters (`drip`, `plain-csv`) plus `export-core` for period ranges and download helpers; Settings overlay reuses `.csv-import-overlay` / panel / button classes (or shared renamed aliases) so light/dark themes stay consistent. No My Calendar export.

**Tech Stack:** Vanilla ES modules, Node `node --test` (existing `period-tracker/package.json`), existing drip CSV builder.

## Global Constraints

- Formats now: **drip** and **plain CSV** only — leave room for more adapters later
- No My Calendar / proprietary backup export
- Theme parity: reuse app CSS variables (`--card`, `--border`, `--text`, `--rose`, etc.) and existing overlay/button patterns; no one-off tool palette
- Session-safe: no `location` navigation / full reload during export
- Local dates via `toISO()` — never `Date.toISOString()` for filenames or day keys
- Plain CSV header exact: `period_start,period_end,date,flow,pain,mood,notes`
- Period ranges from **flow** days only (spotting alone does not define a period); gap ≤ 2 days (same spirit as import)
- Encrypted `.bin` export stays separate
- Spec: `docs/superpowers/specs/2026-07-27-multi-format-export-design.md`
- Do not push to GitHub unless the owner explicitly asks

---

## File map

| Path | Responsibility |
|------|----------------|
| `period-tracker/js/export/export-core.js` | `getFlowPeriods(logs)`, `listExportableDates(logs)`, `downloadTextFile(filename, text, mime)`, `exportFilename(kind, todayIso)` |
| `period-tracker/js/export/adapters/plain-csv.js` | `buildPlainCsv(logs) → string` |
| `period-tracker/js/export/adapters/drip.js` | Re-export / thin wrap of `buildDripCsv` (or move implementation here) |
| `period-tracker/js/export-drip.js` | Shim: `export { buildDripCsv } from "./export/adapters/drip.js"` (or keep impl + re-export from adapter) |
| `period-tracker/js/export/tests/*.test.js` | Unit tests |
| `period-tracker/index.html` | Export overlay (mirror import wizard chrome) |
| `period-tracker/js/script.js` | `showAppExportWizard`, wire Settings button |
| `period-tracker/style.css` | Prefer **reuse** import wizard classes; only add export-specific rules if needed, still on theme tokens |
| `period-tracker/js/i18n.js` | Export wizard strings |
| `period-tracker/docs/HANDOFF.md` | Export section update |
| `period-tracker/service-worker.js` | Bump `CACHE_VERSION` when shipping this feature |

---

### Task 1: export-core — periods + download helpers

**Files:**
- Create: `period-tracker/js/export/export-core.js`
- Create: `period-tracker/js/export/tests/export-core.test.js`

**Interfaces:**
- Consumes: `toISO` / `fromISO` / `addDays` from `dateUtils.js` as needed
- Produces:
  - `getFlowPeriods(logs) → Array<{ start: string, end: string }>` — flow-only, gap ≤ 2
  - `findPeriodForDate(periods, date) → { start, end } | null`
  - `listExportableDates(logs) → string[]` — dates with flow|spotting|pain|mood|non-empty note, sorted ascending
  - `exportFilename(kind: "drip"|"plain", todayIso: string) → string`
  - `downloadTextFile(filename, text, mimeType)` — blob + `<a download>` (DOM; test optional / skip in node)

- [ ] **Step 1: Write failing tests**

```js
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  getFlowPeriods,
  findPeriodForDate,
  listExportableDates,
  exportFilename,
} from "../export-core.js";

describe("getFlowPeriods", () => {
  it("groups flow days with gap <= 2 and ignores spotting-only", () => {
    const logs = {
      "2026-05-01": { flow: 1 },
      "2026-05-03": { flow: 1 }, // gap 2 → same period
      "2026-06-01": { spotting: true },
      "2026-07-08": { flow: 2 },
      "2026-07-09": { flow: 3 },
    };
    const periods = getFlowPeriods(logs);
    assert.deepEqual(
      periods.find((p) => p.start === "2026-05-01"),
      { start: "2026-05-01", end: "2026-05-03" }
    );
    assert.ok(!periods.some((p) => p.start === "2026-06-01"));
    assert.deepEqual(
      periods.find((p) => p.start === "2026-07-08"),
      { start: "2026-07-08", end: "2026-07-09" }
    );
  });
});

describe("listExportableDates + filename", () => {
  it("lists exportable days ascending", () => {
    const dates = listExportableDates({
      "2026-07-09": { flow: 1 },
      "2026-07-01": { mood: 50 },
    });
    assert.deepEqual(dates, ["2026-07-01", "2026-07-09"]);
  });
  it("builds filenames", () => {
    assert.equal(exportFilename("drip", "2026-07-27"), "mycyclekeeper-drip-2026-07-27.csv");
    assert.equal(exportFilename("plain", "2026-07-27"), "mycyclekeeper-plain-2026-07-27.csv");
  });
});
```

Implement periods from dates where `log.flow` is set only (spotting alone never opens a period).

- [ ] **Step 2: Run — expect FAIL**

Run: `cd period-tracker && npm test`

- [ ] **Step 3: Implement `export-core.js`**

Period algorithm: sort dates with `flow`, group while gap ≤ 2 days, `{ start: first, end: last }`.

`findPeriodForDate`: return period where `start <= date <= end`, else null.

`downloadTextFile`: create Blob, object URL, click, revoke (guard `typeof document`).

- [ ] **Step 4: Tests PASS**

- [ ] **Step 5: Commit**

```bash
git add period-tracker/js/export/export-core.js period-tracker/js/export/tests/export-core.test.js
git commit -m "feat: add export-core period and filename helpers"
```

---

### Task 2: plain-csv adapter

**Files:**
- Create: `period-tracker/js/export/adapters/plain-csv.js`
- Create: `period-tracker/js/export/tests/plain-csv.test.js`

**Interfaces:**
- Consumes: `getFlowPeriods`, `findPeriodForDate`, `listExportableDates` from export-core
- Produces: `buildPlainCsv(logs) → string`

- [ ] **Step 1: Failing test**

```js
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
    assert.ok(lines.some((l) => l.startsWith(",,2026-07-20,,100,")));
    assert.ok(lines.some((l) => /2026-07-21,spotting,/.test(l)));
  });

  it("escapes quotes and commas in notes", () => {
    const csv = buildPlainCsv({
      "2026-01-01": { note: 'say "hi", please' },
    });
    assert.match(csv, /"say ""hi"", please"/);
  });
});
```

- [ ] **Step 2: Implement**

For each exportable date (ascending): resolve period; `flow` cell = `spotting` if spotting and no flow, else flow number or empty; pain/mood as string or empty; notes escaped.

- [ ] **Step 3: PASS + commit**

```bash
git add period-tracker/js/export/adapters/plain-csv.js period-tracker/js/export/tests/plain-csv.test.js
git commit -m "feat: plain CSV export adapter"
```

---

### Task 3: drip adapter wiring

**Files:**
- Create or adjust: `period-tracker/js/export/adapters/drip.js`
- Modify: `period-tracker/js/export-drip.js` (shim if moved)
- Test: existing `period-tracker/js/import/tests/drip-adapter.test.js` must keep passing; optionally add `period-tracker/js/export/tests/drip-export.test.js`

**Interfaces:**
- Produces: `buildDripCsv(logs) → string` (same behavior as today)

- [ ] **Step 1:** Move or re-export `buildDripCsv` so the canonical import path is `./export/adapters/drip.js`
- [ ] **Step 2:** Keep `export-drip.js` as `export { buildDripCsv } from "./export/adapters/drip.js"` if anything still imports the old path
- [ ] **Step 3:** Run full `npm test` — flow-4 export tests must still pass
- [ ] **Step 4: Commit**

```bash
git add period-tracker/js/export/adapters/drip.js period-tracker/js/export-drip.js
git commit -m "refactor: house drip CSV builder under export adapters"
```

---

### Task 4: Export wizard UI (theme parity)

**Files:**
- Modify: `period-tracker/index.html`
- Modify: `period-tracker/style.css` (minimal — prefer shared classes)
- Modify: `period-tracker/js/i18n.js`
- Modify: `period-tracker/js/script.js`

**Interfaces:**
- Consumes: `buildDripCsv`, `buildPlainCsv`, `listExportableDates`, `exportFilename`, `downloadTextFile`, `toISO`
- Produces: `showAppExportWizard()`, `exportFromAnotherApp()` on `window`

**Theme rules (required):**
- Reuse the same classes as import: `csv-import-overlay`, `csv-import-panel`, `csv-import-title`, `csv-import-intro`, `apply-btn`, `import-source-btns`, `import-source-btn`, `import-wizard-back`
- Do **not** introduce new background colors, fonts, or purple gradients — only `var(--*)` already used by Settings/import
- If adding `#app-export-overlay`, share CSS with import in one rule block

- [ ] **Step 1: HTML**

Add `#app-export-overlay` with format picker (drip | Plain CSV) and download action.

Replace Settings drip export button:

```html
<button class="apply-btn btn--export-app" onclick="exportFromAnotherApp()" data-i18n="settings_export_app">
  Export to another app
</button>
```

- [ ] **Step 2: script.js**

```js
function exportFromAnotherApp() {
  showAppExportWizard();
}

function showAppExportWizard() {
  // show overlay, reset to format step — no location changes
}

function downloadExportFormat(kind) {
  const logs = state.logs || {};
  if (listExportableDates(logs).length === 0) {
    showModal({ /* empty export message */ });
    return;
  }
  const today = toISO(new Date());
  let text;
  let filename;
  if (kind === "drip") {
    text = buildDripCsv(logs);
    filename = exportFilename("drip", today);
  } else if (kind === "plain") {
    text = buildPlainCsv(logs);
    filename = exportFilename("plain", today);
  } else {
    return;
  }
  downloadTextFile(filename, text, "text/csv;charset=utf-8");
  // toast + close overlay
}
```

- [ ] **Step 3: i18n** — en keys at minimum (`settings_export_app`, format labels, empty message); add to other locales that already have export strings when cheap

- [ ] **Step 4: Theme check**

Confirm overlay uses `var(--card)` / `var(--border)` / existing `.apply-btn`. Grep new CSS for hard-coded hex unrelated to existing theme — avoid.

- [ ] **Step 5: Commit**

```bash
git add period-tracker/index.html period-tracker/js/script.js period-tracker/style.css period-tracker/js/i18n.js
git commit -m "feat: in-app export wizard for drip and plain CSV"
```

---

### Task 5: Import theme audit (same ship)

**Files:**
- Modify: `period-tracker/style.css` and/or import overlay markup only if audit finds drift

**Goal:** Fix any leftover “tool page” styling on the shared import/export panel (e.g. hardcoded dark-only backgrounds that break light themes) so **both** wizards look native.

- [ ] **Step 1:** Compare import overlay to Settings cards under light + dark theme variables; fix shared `.csv-import-panel` once
- [ ] **Step 2:** Commit if changes needed

```bash
git commit -m "fix: align import/export overlays with app theme tokens"
```

If already aligned, note N/A in the task report and skip commit.

---

### Task 6: Docs + CACHE bump

**Files:**
- Modify: `period-tracker/docs/HANDOFF.md`
- Modify: `period-tracker/service-worker.js` — bump beyond `v20260727r` (e.g. `v20260727s`)
- Modify: About/i18n if copy still implies export is drip-only

- [ ] **Step 1:** Document Export to another app (drip + plain CSV); note My Calendar export not offered
- [ ] **Step 2:** Bump `CACHE_VERSION`
- [ ] **Step 3:** `cd period-tracker && npm test` — all green
- [ ] **Step 4: Commit**

```bash
git commit -m "chore: document multi-format export and bump cache"
```

---

## Spec coverage checklist

| Spec requirement | Task |
|------------------|------|
| Adapter architecture + wizard | 3–4 |
| drip export parity | 3–4 |
| Plain CSV layout C | 1–2, 4 |
| Flow-only periods; spotting not a period | 1–2 |
| Filenames local ISO | 1, 4 |
| Empty state | 4 |
| Theme parity import + export | 4–5 |
| Session-safe | 4 |
| Extensible formats | 4 (picker + adapter folder) |
| HANDOFF + CACHE | 6 |

## Plan self-review

- No My Calendar export tasks (per revised spec)
- Theme constraint is explicit in Global Constraints + Tasks 4–5
- `buildDripCsv` remains covered by existing round-trip tests after move
