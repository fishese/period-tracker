# Task 2 Report: Flow level 4 in UI, calendar, charts, i18n

**Branch:** `feature/multi-app-import`  
**Commit:** `b233dec` — feat: expose very-heavy flow in UI and charts  
**Date:** 2026-07-27

## Summary

Exposed flow level 4 (Very heavy) across the daily log UI, calendar tinting, insights/history charts, period profile mini-calendar, and all six locales. Chart scales and heavy-day counters now treat 4 as the max intensity; heavy-day stats include both level 3 and 4.

## Files changed

| File | Change |
|------|--------|
| `period-tracker/index.html` | Added `data-flow-value="4"` log choice button after Heavy |
| `period-tracker/js/i18n.js` | Added `flow_very_heavy` in en, ru, be, es, ja, zh-TW |
| `period-tracker/js/script.js` | Labels, `/4` chart scales, `>= 3` heavy-day counts, aria-label array |
| `period-tracker/style.css` | `.cal-day.flow-4`, `.profile-day--flow-4` (stronger rose tint + inset ring) |

## Implementation details

### Log UI
- New button: `selectFlowValue(4)` with `data-i18n="flow_very_heavy"`.
- `flowWordLabelFromValue`, `flowIconFromValue`, `flowLabelFromValue` distinguish level 3 vs 4.

### Charts / stats
- History daily chart: `Math.min(day.flow, 4)`, bar height `/ 4`.
- Insights month/year: `flowIntensity` uses `/ 4`.
- `summarizeCycleSymptoms` and `renderPeriodProfile`: heavy days `>= 3`.

### Calendar / profile
- Calendar cells get `flow-4` class via existing `getFlowLevelFromLog` path.
- Aria labels include `t("flow_very_heavy")` at index 4.
- Profile cells use dynamic `profile-day--flow-${row.flow}` (no JS change needed).

### CSS
- `.cal-day.flow-4`: 88% inner gradient (vs 72% for flow-3) + subtle inset white ring.
- `.profile-day--flow-4`: full-opacity rose + inset ring.

### i18n values (per brief)
| Locale | Key | Value |
|--------|-----|-------|
| en | flow_very_heavy | Very heavy |
| ja | flow_very_heavy | とても多い |
| zh-TW | flow_very_heavy | 極大量 |
| es | flow_very_heavy | Muy abundante |
| ru | flow_very_heavy | Очень обильные |
| be | flow_very_heavy | Вельмі абутныя |

## Verification (static review)

| Check | Method | Result |
|-------|--------|--------|
| Very heavy button in HTML | grep `data-flow-value="4"` | ✓ |
| All 6 i18n keys | grep `flow_very_heavy` | ✓ (6 locales) |
| No remaining `/ 3` flow scales | grep `flowLevel / 3`, `Math.min(day.flow, 3)` | ✓ none |
| Heavy-day `=== 3` removed | grep `flow === 3`, `getFlowLevelFromLog.*=== 3` | ✓ none |
| CSS flow-4 rules | grep `.flow-4`, `.profile-day--flow-4` | ✓ |
| Label array length 5 | script.js aria-label + flowWordLabelFromValue | ✓ |
| CACHE_VERSION untouched | not modified | ✓ |
| Import code untouched | not modified | ✓ |
| Browser manual test | not run (no server in this session) | deferred |

## Self-review

| Check | Result |
|-------|--------|
| Matches task brief steps 1–4 | ✓ |
| Commit message per brief | ✓ |
| Builds on Task 1 validators (0–4) | ✓ |
| Existing flow 3 days unchanged (same label, CSS, scale relative position 3/4) | ✓ |
| Heavy-day semantics expanded per brief (`>= 3`) | ✓ |

## Concerns

1. **Flow modal slider** (`showFlowModal`) still has `slider.max = "3"`. The brief only specified the inline log-choice buttons; users opening the legacy flow modal cannot set level 4 there. Recommend Task 3+ or a small follow-up if modal remains in use.
2. **i18n.js line endings**: commit includes CRLF normalization across much of `i18n.js` (editor/line-ending artifact). Functional change is only the six new keys; consider a separate whitespace-only commit in future to reduce diff noise.
3. **Browser check deferred**: static grep confirms wiring; visual confirmation of calendar tint and insights bar height for level 4 not performed in this session.

## Downstream notes

- Import adapters can now rely on UI displaying imported level-4 days correctly.
- Chart bar for level 3 is now 75% height (was 100%); level 4 is 100%. This is intentional rescaling to a 0–4 range.

---

## Review fix (2026-07-27)

**Commit:** `267df57` — fix: scale flow-4 sparkline and widen flow grid

### Fixes applied

1. **History compact sparkline** (`script.js` ~2092): bar height and opacity now scale with `(level / 4)` so level 4 stays within 100% height and opacity ≤ 1.0 (was `25 + level * 25`, overflowing at level 4).
2. **Flow choice grid** (`style.css`): `.log-choice-grid--flow` changed from `repeat(5, …)` to `repeat(6, …)` for six buttons (None through Very heavy).
3. **Flow modal slider** (`showFlowModal`): `slider.max` updated from `"3"` to `"4"`.

### Verification

| Check | Method | Result |
|-------|--------|--------|
| Sparkline uses `/4` scale | grep `(level / 4) * 100` | ✓ |
| No legacy `level * 25` sparkline | grep `level * 25` | ✓ none |
| Flow grid 6 columns | grep `repeat(6` in `--flow` rule | ✓ |
| Modal slider max 4 | grep `slider.max = "4"` | ✓ |
| Validators / flow-4 tests | `cd period-tracker && npm test` | ✓ 4 pass, 0 fail |
