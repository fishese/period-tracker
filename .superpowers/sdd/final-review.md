# Final Review: Multi-app Import + Flow Level 4

**Reviewer:** Senior Code Reviewer (whole-branch)  
**Base:** `973e6c4a4146ae0a96660b628045b10c522da543`  
**Head:** `46342d6784e2320af7338a2068d00aafdf3b0d89`  
**Spec:** `docs/superpowers/specs/2026-07-27-multi-app-import-design.md`  
**Plan:** `docs/superpowers/plans/2026-07-27-multi-app-import.md`  
**Diff:** `.superpowers/sdd/final-review-package.diff`  
**Tests cited:** 15/15 pass (not re-run in this review)

---

## Strengths

1. **Architecture matches spec.** Adapters (`mycalendar.js`, `drip.js`) normalize into a shared `ImportPreview`; `import-core.js` owns pattern apply, `previewToLogs`, and report builders; wizard wiring in `script.js` consumes those modules cleanly. Extension point for future apps is obvious.

2. **Session safety (code-level).** Import path uses overlay + file picker only — no `location` assignment, no full reload, no standalone converter navigation from the wizard. Onboarding entry is PIN-guarded (`importAppOnboarding()`). Standalone pages retired to static “open the app” messages.

3. **Flow level 4 is cross-cutting and coherent.** Validators allow 1–4 without rescaling 1–3; UI button, modal slider, calendar tint, insights/history scales, heavy-day counts (`>= 3`), and drip export token (`flow:4`) round-trip are wired together. Sparkline overflow at level 4 was caught and fixed.

4. **Mapping fidelity for primary acceptance sample.** My Calendar July fixture maps `+++ / ++++ / ++ / + / + / +` → 3,4,2,1,1,1; `Moods:Angelic` → unmapped report; temperature/symptoms → leftovers; pain-like symptoms stay in leftovers (tested).

5. **Pattern semantics tested.** `applyFlowPattern` overwrite vs fill-gaps behavior matches spec; last-value repeat; `0` → spotting in pattern apply.

6. **Report UX in overlay.** Summary panel, conditional unmapped/leftover sections, Copy / Export `.txt` / Export `.csv` (RFC-4180 quoting), in-memory `_lastImportReport` (not persisted to encrypted state).

7. **Test harness.** `package.json` + `node --test` gives 15 focused unit tests across validators, import-core, both adapters, and drip export round-trip — good foundation for regression.

8. **Migration/cleanup done.** Settings/onboarding labels, About/i18n copy, HANDOFF §7, `CACHE_VERSION` → `v20260727r`, legacy HTML pages stripped to redirect stubs.

---

## Critical

**None.**

No session-kick paths, no PIN leakage, no merge/replace inversion, no schema break, no obvious data-loss or security defects in the reviewed diff. Remaining issues are functional gaps and polish, not ship-stoppers for a personal fork if the Important items below are accepted or fixed.

---

## Important

### 1. Period-only My Calendar exports blocked before review (spec acceptance gap)

**Spec:** “Historical My Calendar periods with no Flow symptoms: pattern fill works” and “Allow apply if at least one usable day remains … block apply only if the result would be completely empty.”

**Issue:** `chooseImportFile()` gates on `_importPreviewHasUsableData()`, which only inspects `preview.days`. A file with Period Starts/Ends only (e.g. June block in the fixture: lines 8–9, no symptom rows) has `periods.length > 0` but empty `days` → user gets empty-import modal and never reaches the review/pattern step.

**Impact:** Cannot pattern-fill flow-only historical periods unless the export also contains at least one symptom/mood/temperature row. `_buildImportPreviewForApply()` would succeed after pattern apply, but the wizard never gets there.

**Fix:** Treat `preview.periods?.length > 0` as sufficient to advance to review; keep the post-pattern empty check at apply time.

**Location:** `script.js` — `_importPreviewHasUsableData`, `chooseImportFile`.

---

### 2. Copy / Export `.txt` omit most summary stats (spec mismatch)

**Spec:** Report Copy and Export `.txt` should render all sections; summary includes source, periods, flow days, mood days, leftover days, unmapped-mood count.

**Issue:** On-screen report (`_renderImportReport`) shows seven summary lines via i18n keys. `buildReportText()` only writes `Source: …` under “Import report” — periods, flow/mood/leftover counts, and days imported are missing from clipboard and `.txt` download.

**Impact:** Users who rely on Copy/txt lose the summary they see in the UI. CSV correctly omits summary (spec allows `date,kind,detail` only).

**Fix:** Extend `buildReportText` to mirror `_renderImportReport` summary fields (or share one formatter).

**Location:** `import-core.js` — `buildReportText`; `script.js` — `copyImportReport`, `exportImportReportTxt`.

---

### 3. My Calendar can import both `flow` and `spotting` on one day

**Issue:** `parseSymptomsValue` can set `spotting: true` (from a `Spotting` token in one `+` group) and `flow` (from `Flow` in another) on the same date. Fixture Jul 13 asserts both `flow: 1` and `spotting: true`.

**Impact:** `getFlowLevelFromLog()` returns `0` when `spotting` is set, so calendar/editor show **Spotting** tint/label even though `log.flow` is also set and cycle logic treats the day as a flow period day. Confusing and inconsistent with normal editor behavior (flow vs spotting are mutually exclusive in UI).

**Fix:** In adapter (or `previewToLogs`), prefer flow over spotting when both present, or drop spotting when flow is assigned.

**Location:** `adapters/mycalendar.js` — symptom merge; optionally `import-core.js` — `previewToLogs`.

---

### 4. drip adapter sets `hasSourceFlow: true` for all period groups

**Issue:** `buildPeriodsFromDays()` always sets `hasSourceFlow: true`, including spotting-only episodes (`bleeding.value === 0`, no numeric flow).

**Impact:** With mixed imports, fill-gaps mode treats spotting-only periods as “having source flow,” so pattern does not fill them when user intended to add flow levels to periods that only had spotting in drip.

**Fix:** Set `hasSourceFlow` per group if any day in range has `day.flow !== undefined` (mirror `updatePeriodSourceFlow` in My Calendar adapter).

**Location:** `adapters/drip.js` — `buildPeriodsFromDays`.

---

### 5. Manual unlock → import session test still unverified

Task reports and prior task reviews defer browser verification: unlock → My Calendar/drip fixture → pattern → merge → report → still unlocked; onboarding path completes PIN + report.

**Impact:** Highest-risk spec requirement (session preservation) has code review confidence but no automated or recorded manual pass.

**Recommendation:** Run once before deploy; optional smoke checklist in HANDOFF.

---

## Minor

1. **Wizard i18n mostly English** — new `app_import_*` keys added for `en` only; ru/be/es fall back to English (ja/zh-TW partially updated for settings label). Acceptable v1 defer per plan.

2. **Import-core edge coverage** — no tests for: empty pattern + period-only preview path, post-pattern `previewToLogs` with only leftovers, merge/replace integration, wizard gates. Unit tests cover happy paths well.

3. **i18n.js CRLF noise** — large line-ending-only diff alongside six `flow_very_heavy` keys; functional noise only.

4. **HANDOFF header** — literal `<br>` in “Last updated” markdown line.

5. **Dead helper** — `_finishOnboardingAfterImport` remains for encrypted backup import; onboarding app-import now uses inline finish in `_finishImportApply` (report instead of success modal). Intentional UX change, not a bug.

6. **Stale CSS class** — Settings button still `btn--import-drip`.

7. **Unused i18n keys** — legacy `drip_import_*` strings repointed in English; some keys may be unused in UI.

---

## Assessment

| Dimension | Result |
|-----------|--------|
| Spec compliance (core) | **Mostly pass** — wizard, adapters, pattern, flow 4, report UI, session-safe code, migration |
| Spec gaps | Period-only gate (#1), Copy/txt summary (#2) |
| Data integrity | Flow+spotting coexistence (#3), drip `hasSourceFlow` (#4) |
| Tests | 15/15 unit pass; no browser/session automation |
| Security / session | No Critical issues in diff |
| Ship readiness (personal fork) | **Approve with fixes or accepted risk on #1–#5** |

**Verdict:** **Approved with Important follow-ups.** The branch delivers the intended redesign: native in-app wizard, My Calendar + drip adapters, flow level 4, and exportable leftover/unmapped-mood reports, with solid modular structure and unit tests. Fix **#1** before claiming full spec acceptance (historical period pattern fill). Fix **#2** before users depend on Copy/txt exports. **#3–#4** are correctness polish for edge imports. **#5** is a pre-deploy manual check, not a code change.

Recommended commit order if fixing: (1) period-only gate → (2) report text summary → (3) flow/spotting precedence → (4) drip `hasSourceFlow` → manual session smoke → deploy with `CACHE_VERSION` already bumped.

---

## Fix pass (2026-07-27)

**Commit:** `fix: import period-only gate, report summary, flow/spotting rules`

### Changes

1. **Period-only gate** (`script.js` `chooseImportFile`): advance to review when `preview.periods.length > 0` even if `preview.days` is empty; post-pattern apply gate unchanged (`_importPreviewHasUsableData` only).

2. **`buildReportText` summary** (`import-core.js`): Copy/txt now includes periods, days with flow/mood/leftovers, unmapped mood count, and days imported (matches on-screen report). Test extended in `import-core.test.js`.

3. **Flow + spotting same day** (`mycalendar.js`): when both present, keep `flow` and omit `spotting`; Spotting remains in `leftovers`. Jul 13 test updated (flow 1, no spotting flag, Spotting in leftovers).

4. **drip `hasSourceFlow`** (`drip.js` `buildPeriodsFromDays`): `true` only when the period group has at least one day with real `flow` (1–4); spotting-only groups get `false` and are fillable in fill-gaps mode. New test in `drip-adapter.test.js`.

### Tests

```
cd period-tracker && npm test
ℹ tests 16
ℹ pass 16
ℹ fail 0
```
