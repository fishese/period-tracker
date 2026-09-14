# Recorded period status and cycle-day correction

Implemented on 2026-09-14 against commit `7d43853`. This document records the intended behavior and regression coverage.

## Product decisions

The user wants a recorded, ongoing period to take priority over predictions in the status card. They explicitly clarified that **auto-filled flow following a recorded start counts as the recorded period**: daily reconfirmation must not be required. Prediction-only calendar days do not count.

- Cycle day 1 is the first day of the recorded period; count calendar days inclusively from that start.
- A manually recorded start plus its auto-filled continuation is one episode. Preserve `flowEstimated` for existing provenance displays, but do not exclude those continuation days from ongoing-period status.
- Prediction dates never establish a new recorded cycle or reset its day count.
- Spotting alone never establishes a period.
- A prediction date passing does not prove that a period began, or even that the user did not bleed: describe the estimate and absence of a new record neutrally.
- Keep the existing automatic filling behavior and settings. Do not require a new start/end workflow, daily confirmation, storage migration, or framework.

Reference for the day-count convention: [NHS: Periods and fertility in the menstrual cycle](https://www.nhs.uk/conditions/periods/fertility-in-the-menstrual-cycle/).

## What the screenshots establish

The user says the first bleeding day was “the 17th.” The month was not explicitly confirmed. The screenshots display September 10 and September 12, 2026, with coloured dates on September 17–22. If the start means September 17, those screen dates precede it; September 17 was also still a future prediction on both displayed dates. An example with a past prediction therefore needs a separate regression fixture.

Using synthetic data, the current code reproduces both cards exactly with `lastPeriodStart: "2026-09-17"`, `cycleLength: 33`, and a flow log on September 17:

| Reference date | Current calculated start | Cycle day | Phase | Next prediction | Countdown |
| --- | --- | --- | --- | --- | --- |
| 2026-09-10 | 2026-08-15 | 27 | Luteal | 2026-09-17 | 7 |
| 2026-09-12 | 2026-08-15 | 29 | Luteal | 2026-09-17 | 5 |

`getCurrentCycleAnchor()` invents the August 15 anchor by subtracting 33 days from the future start. The same output is possible with a genuine August 15 start, so this reproduction is evidence of a code path, not proof of the user's saved state or device clock.

If the recorded start is September 17 and today is September 19, the correct cycle day and period day are both 3. If the start means August 17, September 10 and 12 would be cycle days 25 and 27 respectively, assuming no subsequent period start. Never silently change either a log date or the device date to reconcile this ambiguity.

## Findings in the current code

Line numbers are navigation hints at the inspected commit; locate functions by name before editing.

| Location | Finding |
| --- | --- |
| `js/cycles.js:339`, `getCurrentCycleAnchor()` | Walks both forward and backward by predicted cycle lengths. Appropriate projections are being used as actual cycle starts. |
| `js/cycles.js:354`, `getCycleInfo()` | Today's logged flow changes the phase, but does not independently resolve the recorded episode start. A stale anchor can therefore yield “Day 29 of your period.” It also labels the first predicted `pd` days as menstruation without a recorded start. |
| `js/cycles.js:179`, `getMissedPeriodExpectedStart()` | Advances the missed prediction repeatedly, so lateness resets after each predicted cycle. |
| `js/cycles.js:194`, `isPeriodEpisodeActive()` | Depends on `lastPeriodStart`, has a fixed 20-day scan, and lacks a lower date bound. Do not reuse it unchanged as the new status resolver. |
| `js/script.js:2304`, `updateStatusCard()` | Has menstruation-specific subtitle text already, but no distinct recorded-period heading. Its late branch runs first. |
| `js/script.js:2384` vicinity | Puts `daysLate` into the pill labelled “Cycle Day.” That label/value mismatch is a separate confirmed defect. |
| `js/script.js:2454`, `updateReminderBanner()` | Returns early for late/no-data states without always clearing a previously visible reminder. |
| `js/script.js:4217`, `updateCycleHistory()` | Handles forward additions but ignores earlier/backfilled starts. Its one-time forced split is represented in history, not as a persisted flag on each log. |
| `js/import/adapters/drip.js:364`, `buildCycleHistoryFromLogs()` | Groups positive flow, including auto-fill, with one-day gap tolerance. Blind rebuilding can lose forced splits and replace unusual cycle lengths with a fallback. Do not introduce an automatic destructive rebuild as the status fix. |
| `js/script.js:3954`, `renderCalendar()` | Calendar classes already distinguish prediction-only days. Flow overlays are also drawn for saved auto-fill; that is compatible with the user's preference. |

Baseline verification: `npm test` passed all **47 tests**. A read-only Node probe also reproduced stale-anchor, past-estimate, and repeated-prediction day-count errors. Existing tests barely cover current-cycle status.

## Target card behavior

Evaluate these states in priority order. The date at the top always describes today, independent of the viewed calendar month or selected log date.

| State | Heading | Supporting text | First pill | Second pill |
| --- | --- | --- | --- | --- |
| Recorded episode covers today, including auto-fill | **Day 3 of your period** | Period started September 17 | `3` / Cycle Day | `Ongoing` / Period status |
| No valid start on/before today, but a future recorded start exists | **Check your period start date** | Period start is recorded as September 17. Today is September 12. | `—` / Cycle Day | `—` / Until Next |
| No usable recorded start | Existing no-data/import hint | Existing hint | `—` | `—` |
| Valid start, estimate is today, no ongoing recorded period | **Cycle day 34** | Period estimated to start today | `34` / Cycle Day | `Today` / Estimated start |
| Valid start, estimate has passed, no new recorded period | **Cycle day 37** | Period was estimated around September 17; no new period recorded | `37` / Cycle Day | `3` / Days past estimate |
| Valid start, estimate is in the future | **Cycle day 10** | Next period estimated around October 20 | `10` / Cycle Day | countdown / Until Next |

The numeric examples are independent fixtures. Actual values come from the resolved start and prediction length.

During a recorded period, omit the next-period estimate, the numbered phase prefix, and any due/late reminder from this card. Keep future forecasts in the existing Predictions view. Retain the third cycle-length/average pill without redesigning the card; do not make it an exact total in the heading. Outside a recorded period, an optional phase prefix must say it is estimated and respect the existing phase/fertility settings. Do not label prediction-only bleeding as confirmed menstruation.

If a future entry exists alongside a valid earlier start, calculate today from the valid earlier start. Add a small localized date-check hint naming the future recorded start; do not use that future entry to reset the current cycle. This hint must not replace an actually ongoing recorded-period heading.

## Implementation sequence

### 1. Resolve recorded episodes before calculating predictions

Files: `js/cycles.js`, `js/tests/dates-cycles.test.js` (or a new `js/tests/cycle-status.test.js`). Keep state supplied by the existing `setState()` reference.

Add an exported, deterministic `getRecordedCycleContext(refDate = fromISO(today()))`. Suggested return contract:

```js
{
  cycleStart: Date | null,       // latest usable recorded onset <= refDate
  periodStart: Date | null,      // start of the episode covering refDate
  periodEnd: Date | null,        // last saved flow date in that episode
  isRecordedPeriod: boolean,    // includes saved auto-fill continuation
  periodDay: number | null,
  futureRecordedStart: Date | null
}
```

Rules to implement explicitly:

1. Group saved positive-flow dates into episodes. Use the existing tolerance: adjacent flow dates at most two calendar days apart belong together, allowing one intervening blank day. Spotting-only dates do not create starts.
2. An episode must have a user-recorded/imported onset. Logs with positive flow and `flowEstimated !== true` can establish an onset. Auto-filled dates can continue the episode and extend its saved end, but cannot independently invent a start if their original start was deleted. Ignore leading orphan estimates before the first real onset in a group.
3. Preserve recorded starts in `cycleHistory`, including an explicit “This is a new period” split inside the gap-tolerance window. With the current schema, two distinct valid history starts inside one connected flow group are evidence of an intentional boundary: retain the later start as a split. A group's first stored start can move earlier when its beginning is backfilled; do not treat every old first-start date as an immovable forced boundary. A history row pointing at an estimated-only flow log is not independent proof of a new onset. An onboarding/history-only recorded onset with no day log remains a valid anchor; its start day is recorded, but subsequent days require saved continuation to count as ongoing.
4. Use actual log episodes to recover a more recent or backfilled onset when `lastPeriodStart` is stale. If a non-estimated earlier flow date is added to the same episode, use that earlier onset unless a stored split separates the episodes.
5. Choose the most recent valid start on or before `refDate`. Never subtract a predicted length from a future start. Keep future saved entries intact and return their date separately for the date-check hint.
6. An episode covers today only when its start has occurred and today is within its saved episode span, ending before any later explicit start. Saved auto-fill after a real onset counts even when marked `flowEstimated`. Respect the existing one-day-gap convention; do not extend beyond the saved episode end just because average duration is longer.
7. No fixed 20-day scanning limit is needed: traverse the finite sorted log dates. Do not truncate a recorded episode to the average period length.
8. Keep this resolution read-only. It should not call `save()`, rewrite history, remove logs, or migrate encrypted records. Current add/delete/import paths must immediately see the revised context when they render.

Use the existing local-date helpers throughout. Give relevant cycle functions optional `refDate` parameters and thread one reference date through their calculations; do not add a global test-clock setting or UTC day-key conversion.

### 2. Separate the actual cycle from projections

Files: `js/cycles.js` and its tests.

- Make `getCycleInfo(refDate)` use the recorded context. Preserve existing fields needed by other callers and add `isRecordedPeriod`, `periodStart`, `periodDay`, `futureRecordedStart`, and a status discriminator if useful.
- Calculate `cycleDay = diffDays(recordedStart, refDate) + 1`. It may legitimately exceed the predicted cycle length. Never apply modulo arithmetic or clamp this value to the average.
- Set the current cycle's estimate to `addDays(recordedStart, cl)`. Keep this same expected date until another recorded onset occurs. Use the signed difference to distinguish future, today, and past.
- A recorded episode overrides due/late state, including a long recorded episode extending beyond the predicted duration or cycle length.
- Replace the repeated advancement in `getMissedPeriodExpectedStart()` for status purposes. `daysLate`, if retained for compatibility, is the difference from the first outstanding estimate, never a substitute for `cycleDay`.
- Handle no-anchor/date-conflict results explicitly. Callers must not try to format null dates or draw a cycle bar with null values. Do not create a synthetic current cycle just to satisfy existing callers.
- Remove the inference that `cycleDay <= pd` alone proves a recorded period. Distinguish estimated phase information from `isRecordedPeriod`.
- Keep statistical thresholds and fertility formulas unchanged. When using history for the reference date, exclude future starts and cycles whose closing start has not occurred; a future saved period must not make today's ongoing cycle count as completed. Preserve the existing prediction-length fallback order.
- Keep the resolver independent of prediction-duration/statistics helpers: those helpers may call the resolver to identify the active episode, so calling them back from the resolver would introduce recursion.
- Keep future projection stepping inside `calculatePredictions()`/the Predictions view only. These may advance forecast occurrences to fill future calendar months, but must not return a projected start as the recorded current anchor. Never project backward before the earliest usable recorded start to fabricate history.
- `getDayType()` must continue to prefer saved flow, including auto-filled continuation. A date represented only by a forecast remains `predicted-period`/`tolerance-period`; passing that date never writes a log.
- Reuse the recorded-context rules in `isPeriodEpisodeActive()` so period-duration statistics and the status agree that an auto-filled current episode is still in progress. Do not let future-only episodes count as actively bleeding today.

### 3. Render the card from the resolved state

Files: `js/script.js`, `index.html`, `js/i18n.js`; CSS only if needed for wrapping.

- Update `updateStatusCard()` to implement the table above, checking `isRecordedPeriod` before due/late/predicted phases. Use `periodDay` in the recorded-period heading.
- Change the ordinary heading from “Day N of your X-day cycle” to “Cycle day N.” The average is an estimate, not a known endpoint for the current cycle.
- Always put `info.cycleDay` into `#cycle-day`, including when an estimate is overdue.
- Add a stable ID to the second pill's label (for example `days-until-next-label`). Update both its text and its `data-i18n` key on every render so switching languages does not restore an obsolete label.
- Hide or clear reminder content first in `updateReminderBanner()`, then enable it only for an eligible future estimate. Recorded-period, overdue, date-conflict, and no-data transitions must remove stale reminders.
- Clear stale bars/banners when no valid anchor remains. Keep the cycle bar based on the recorded cycle day; when the day exceeds the estimated length, hide the marker or place it at the end with an explicit beyond-estimate label. Choose **hide the marker** for this change; never wrap it back to day 1.
- Keep the calendar rendering and auto-fill settings visually unchanged. Do not dim or require confirmation of saved auto-filled days as part of this fix.
- Verify the consumers `renderPredictionsTab()`, `updateInsights()`, `updateCycleBar()`, and calendar/chart code tolerate nullable dates and unbounded cycle days. Future lists may display forecasts; the current status must retain the original outstanding estimate.

Suggested new English localization keys (translate into supported `en`, `es`, `ja`, `zh-TW`; retain existing fallback behavior):

```text
status_recorded_period_day = Day {day} of your period
status_recorded_period_started = Period started {date}
status_cycle_day = Cycle day {day}
status_next_period_estimated = Next period estimated around {date}
status_period_estimated_today = Period estimated to start today
status_period_estimate_passed = Period was estimated around {date}; no new period recorded
status_check_period_date = Check your period start date
status_future_period_date = Period start is recorded as {startDate}. Today is {todayDate}.
status_estimated_phase = Estimated phase: {phase}
period_status = Period status
period_ongoing = Ongoing
estimated_start = Estimated start
days_past_estimate = Days past estimate
```

Use locale date formatting, including the year if dates cross years. Do not hardcode September or English date ordinals. Existing `subtitle_menstruation` can be reused where its meaning matches.

### 4. Keep today's status current across day changes

File: `js/script.js`.

Capture the local reference date once for each status update and use it for both calculations and the date heading. Add a lightweight day-change check while unlocked and on the existing `visibilitychange`/`pageshow` resume paths. Respect session expiry first; never render decrypted data after locking. Refresh status and calendar only when the local day changes. A minute-based check is sufficient; clear it on lock and do not create duplicate timers on repeated unlocks.

This prevents a screen left open across midnight from showing yesterday's date/count. It cannot correct a wrongly set device clock; the date-check message covers inconsistent saved start dates without silently editing them.

### 5. Regression and presentation checks

Use `node:test` and `node:assert/strict`, already available. No new test framework or browser dependency. Fix reference dates in unit tests using the optional parameters, with a simple 33-day prediction fixture and six-day period duration unless specified otherwise.

| Fixture | Required result |
| --- | --- |
| Start Sep 17, today Sep 17, explicit flow | Period day 1 and cycle day 1; no next-period/late headline |
| Start Sep 17, today Sep 19, only Sep 17 entered manually, Sep 18–22 saved as auto-fill | Period day 3 and cycle day 3; ongoing period, no confirmation prompt |
| Same dates, every day manually recorded | Same result as auto-fill |
| Auto-fill off; only Sep 17 saved; today Sep 19 | Cycle day 3, but do not claim a recorded ongoing period solely from average duration |
| Past anchor Aug 15, today Sep 19, Sep 17–22 forecast only | Cycle day 36; original Sep 17 estimate is two days past; no recorded period |
| Stale Aug 15 anchor; recorded Sep 8–12 episode; today Sep 12 | Cycle day 5 and period day 5, replacing the erroneous day 29 |
| Only future Sep 17 start, today Sep 10 / Sep 12 | Date-check state; no invented Aug 15 start and no day 27 / 29 |
| Future Sep 17 start plus valid Aug 17 start; today Sep 12 | Cycle day 27 from Aug 17; future date hint; no backward extrapolation |
| Start Aug 15, estimate Sep 17, today Sep 17, no new logs | Cycle day 34, estimated today, no cycle reset |
| Same anchor, today Sep 20 | Cycle day 37; three days past estimate; first pill stays 37 |
| Same anchor, today Oct 25 | Cycle day 72; 38 days past Sep 17 estimate, not five days past a rolled October estimate |
| New recorded period arrives after estimate | Day 1 from new onset; previous estimate/late reminder disappears |
| Recorded bleeding longer than configured average period duration | Remains a recorded period for its saved span; day count is not capped |
| Spotting-only today | Does not start/reset a period |
| One blank day between saved flow dates; versus two blank days | Preserve existing one-day tolerance; two blank days split episodes |
| Forced new-period split within the tolerated gap | Honor the stored start; next day is day 2 of the new episode |
| Backfill an earlier first day of the same episode | Both displayed counters increase consistently from the corrected onset |
| Remove the only actual onset, leaving orphan estimated flow | Estimates alone do not create a new recorded start; valid older context or no-data state |
| Onboarding-only last start, no day logs | Still a valid cycle anchor; future days are not recorded bleeding just from `pd` |
| Empty state / future-only history / month or year boundary | No exceptions, invalid dates, negative counters, or silent record edits |

Also test the transitions recorded -> ordinary -> overdue -> no-data and language changes, using a small DOM stub if practical or a manual UI check. Make sure the heading, both pill labels/values, and reminder visibility all update together. Verify a synthetic September 19 ongoing-period card at a phone width in all four supported languages and light/dark themes. Check date rollover and resume without touching real user records or changing the system clock.

Run `npm test` once the relevant fixes are complete. Then smoke-test the browser offline. For Android verification, use the existing `npm run android:sync`/build workflow after implementation; inspect generated output rather than editing bundled copies of the JavaScript. Report any missing Android toolchain separately from JS test results.

### 6. Finish the implementation handoff

- Update `docs/HANDOFF.md` with the new recorded-start and status rules.
- Bump `CACHE_VERSION` in `service-worker.js` when packaging the code change. Current source value is `v20260905a`; the older value in existing handoff prose is stale.
- If any new runtime JS module was introduced, include it in `ASSETS_TO_CACHE`; test-only files do not need caching. The existing Android sync copies the JS directory.
- Review the diff for accidental changes to auto-fill, import/export, encryption, PIN, Drive, or deployment configuration. Do not broaden this task into a statistics/history rewrite.
- Deliver the implemented change with test results and remaining date ambiguity. Publishing or distributing a build is a separate user action unless subsequently requested.

## Prompt to use with a smaller model

> Implement `docs/recorded-period-status-plan.md` in this repository. Start with the recorded-episode resolver and regression cases, then fix the card and date refresh. A manually recorded period start and its saved auto-filled days count as an ongoing recorded period; do not require daily confirmation. Prediction-only days must never start a cycle or reset cycle day. Preserve forced starts, onboarding-only anchors, existing user data, and automatic filling. Follow the plan's exact card copy and test matrix. Use the existing vanilla JS modules and Node test runner. Run relevant checks, update the handoff/cache metadata, and report results. Do not deploy or rewrite unrelated history/storage code.
