import test from "node:test";
import assert from "node:assert/strict";
import { addDays, fromISO, toISO } from "../dateUtils.js";
import {
  getCycleInfo,
  getRecordedCycleContext,
  isPeriodEpisodeActive,
  setState,
} from "../cycles.js";

function useState(overrides = {}) {
  setState({
    lastPeriodStart: null,
    cycleLength: 33,
    periodDuration: 6,
    toleranceDays: 0,
    logs: {},
    cycleHistory: [],
    ...overrides,
  });
}

function flowRange(startDay, endDay, estimatedFrom = null) {
  const logs = {};
  for (let day = startDay; day <= endDay; day++) {
    const date = `2026-09-${String(day).padStart(2, "0")}`;
    logs[date] = {
      flow: day === startDay ? 2 : 1,
      ...(estimatedFrom != null && day >= estimatedFrom
        ? { flowEstimated: true }
        : {}),
    };
  }
  return logs;
}

test("recorded start is cycle day 1 and takes priority over predictions", () => {
  useState({
    lastPeriodStart: "2026-09-17",
    logs: { "2026-09-17": { flow: 2 } },
    cycleHistory: [{ start: "2026-09-17", length: 33 }],
  });
  const info = getCycleInfo(fromISO("2026-09-17"));
  assert.equal(info.cycleDay, 1);
  assert.equal(info.periodDay, 1);
  assert.equal(info.isRecordedPeriod, true);
  assert.equal(info.isLate, false);
});

test("saved auto-fill continues a user-recorded period", () => {
  useState({
    lastPeriodStart: "2026-09-17",
    logs: flowRange(17, 22, 18),
    cycleHistory: [{ start: "2026-09-17", length: 33 }],
  });
  const info = getCycleInfo(fromISO("2026-09-19"));
  assert.equal(info.cycleDay, 3);
  assert.equal(info.periodDay, 3);
  assert.equal(info.isRecordedPeriod, true);
});

test("manual daily flow produces the same ongoing-period result as auto-fill", () => {
  useState({
    lastPeriodStart: "2026-09-17",
    logs: flowRange(17, 22),
    cycleHistory: [{ start: "2026-09-17", length: 33 }],
  });
  const info = getCycleInfo(fromISO("2026-09-19"));
  assert.equal(info.cycleDay, 3);
  assert.equal(info.periodDay, 3);
  assert.equal(info.isRecordedPeriod, true);
});

test("configured period duration alone does not claim ongoing recorded flow", () => {
  useState({
    lastPeriodStart: "2026-09-17",
    logs: { "2026-09-17": { flow: 2 } },
    cycleHistory: [{ start: "2026-09-17", length: 33 }],
  });
  const info = getCycleInfo(fromISO("2026-09-19"));
  assert.equal(info.cycleDay, 3);
  assert.equal(info.periodDay, null);
  assert.equal(info.isRecordedPeriod, false);
});

test("a newer recorded episode replaces a stale cycle anchor", () => {
  useState({
    lastPeriodStart: "2026-08-15",
    logs: {
      "2026-08-15": { flow: 2 },
      ...flowRange(8, 12),
    },
    cycleHistory: [{ start: "2026-08-15", length: 33 }],
  });
  const info = getCycleInfo(fromISO("2026-09-12"));
  assert.equal(toISO(info.cycleStart), "2026-09-08");
  assert.equal(info.cycleDay, 5);
  assert.equal(info.periodDay, 5);
});

test("a future-only recorded start produces a date conflict without back-projection", () => {
  useState({
    lastPeriodStart: "2026-09-17",
    logs: { "2026-09-17": { flow: 2 } },
    cycleHistory: [{ start: "2026-09-17", length: 33 }],
  });
  for (const date of ["2026-09-10", "2026-09-12"]) {
    const info = getCycleInfo(fromISO(date));
    assert.equal(info.hasDateConflict, true);
    assert.equal(info.cycleStart, null);
    assert.equal(info.cycleDay, null);
    assert.equal(toISO(info.futureRecordedStart), "2026-09-17");
  }
});

test("a future start does not displace a valid earlier recorded anchor", () => {
  useState({
    lastPeriodStart: "2026-09-17",
    logs: {
      "2026-08-17": { flow: 2 },
      "2026-09-17": { flow: 2 },
    },
    cycleHistory: [
      { start: "2026-08-17", length: 31 },
      { start: "2026-09-17", length: 33 },
    ],
  });
  const info = getCycleInfo(fromISO("2026-09-12"));
  assert.equal(toISO(info.cycleStart), "2026-08-17");
  assert.equal(info.cycleDay, 27);
  assert.equal(toISO(info.futureRecordedStart), "2026-09-17");
});

test("a missed estimate does not roll the recorded cycle forward", () => {
  useState({
    lastPeriodStart: "2026-08-15",
    logs: { "2026-08-15": { flow: 2 } },
    cycleHistory: [{ start: "2026-08-15", length: 33 }],
  });
  const onEstimate = getCycleInfo(fromISO("2026-09-17"));
  assert.equal(onEstimate.cycleDay, 34);
  assert.equal(onEstimate.daysUntilNext, 0);
  assert.equal(onEstimate.isLate, false);

  const threeDaysPast = getCycleInfo(fromISO("2026-09-20"));
  assert.equal(threeDaysPast.cycleDay, 37);
  assert.equal(threeDaysPast.daysLate, 3);

  const muchLater = getCycleInfo(fromISO("2026-10-25"));
  assert.equal(muchLater.cycleDay, 72);
  assert.equal(muchLater.daysLate, 38);
  assert.equal(toISO(muchLater.expectedPeriodStart), "2026-09-17");
});

test("recorded bleeding remains primary even after the estimated cycle end", () => {
  const logs = { "2026-08-15": { flow: 2 } };
  for (let offset = 1; offset <= 21; offset++) {
    logs[toISO(addDays(fromISO("2026-08-15"), offset))] = {
      flow: 1,
      flowEstimated: true,
    };
  }
  useState({
    lastPeriodStart: "2026-08-15",
    cycleLength: 20,
    logs,
    cycleHistory: [{ start: "2026-08-15", length: 20 }],
  });
  const info = getCycleInfo(fromISO("2026-09-05"));
  assert.equal(info.isRecordedPeriod, true);
  assert.equal(info.periodDay, 22);
  assert.equal(info.isLate, false);
});

test("a newly recorded period replaces an overdue estimate", () => {
  useState({
    lastPeriodStart: "2026-09-20",
    logs: {
      "2026-08-15": { flow: 2 },
      "2026-09-20": { flow: 2 },
    },
    cycleHistory: [
      { start: "2026-08-15", length: 36 },
      { start: "2026-09-20", length: 33 },
    ],
  });
  const info = getCycleInfo(fromISO("2026-09-20"));
  assert.equal(toISO(info.cycleStart), "2026-09-20");
  assert.equal(info.cycleDay, 1);
  assert.equal(info.isRecordedPeriod, true);
  assert.equal(info.isLate, false);
});

test("spotting and orphaned auto-fill do not establish a cycle", () => {
  useState({
    logs: {
      "2026-09-16": { spotting: true },
      "2026-09-17": { flow: 1, flowEstimated: true },
      "2026-09-18": { flow: 1, flowEstimated: true },
    },
  });
  const context = getRecordedCycleContext(fromISO("2026-09-18"));
  assert.equal(context.cycleStart, null);
  assert.equal(context.isRecordedPeriod, false);
  assert.equal(getCycleInfo(fromISO("2026-09-18")), null);
});

test("one blank day stays in an episode and two blank days split it", () => {
  useState({
    lastPeriodStart: "2026-09-08",
    logs: {
      "2026-09-01": { flow: 2 },
      "2026-09-03": { flow: 1 },
      "2026-09-06": { flow: 2 },
      "2026-09-08": { flow: 1 },
    },
    cycleHistory: [
      { start: "2026-09-01", length: 5 },
      { start: "2026-09-06", length: 33 },
    ],
  });
  const first = getRecordedCycleContext(fromISO("2026-09-02"));
  assert.equal(first.periodDay, 2);
  const second = getRecordedCycleContext(fromISO("2026-09-07"));
  assert.equal(toISO(second.periodStart), "2026-09-06");
  assert.equal(second.periodDay, 2);
});

test("stored starts preserve an explicit split inside a connected flow group", () => {
  useState({
    lastPeriodStart: "2026-09-03",
    logs: flowRange(1, 5),
    cycleHistory: [
      { start: "2026-09-01", length: 2 },
      { start: "2026-09-03", length: 33 },
    ],
  });
  const info = getCycleInfo(fromISO("2026-09-04"));
  assert.equal(toISO(info.cycleStart), "2026-09-03");
  assert.equal(info.periodDay, 2);
});

test("backfilling the beginning of an episode corrects its onset", () => {
  useState({
    lastPeriodStart: "2026-09-03",
    logs: flowRange(1, 5),
    cycleHistory: [{ start: "2026-09-03", length: 33 }],
  });
  const info = getCycleInfo(fromISO("2026-09-05"));
  assert.equal(toISO(info.cycleStart), "2026-09-01");
  assert.equal(info.periodDay, 5);
  assert.equal(
    isPeriodEpisodeActive("2026-09-03", fromISO("2026-09-05")),
    true
  );
});

test("an onboarding-only recorded start remains a cycle anchor", () => {
  useState({
    lastPeriodStart: "2026-09-17",
    cycleHistory: [{ start: "2026-09-17", length: 33 }],
  });
  const info = getCycleInfo(fromISO("2026-09-19"));
  assert.equal(info.cycleDay, 3);
  assert.equal(info.isRecordedPeriod, false);
});
