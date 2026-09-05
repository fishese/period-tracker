import test from "node:test";
import assert from "node:assert/strict";
import { addMonths, fromISO, toISO, today } from "../dateUtils.js";
import { setState, getPredictionPeriodDuration } from "../cycles.js";

test("month arithmetic clamps to the intended month across short months and leap years", () => {
  assert.equal(toISO(addMonths(fromISO("2026-08-31"), -6)), "2026-02-28");
  assert.equal(toISO(addMonths(fromISO("2024-08-31"), -6)), "2024-02-29");
  assert.equal(toISO(addMonths(fromISO("2026-01-31"), 1)), "2026-02-28");
});

test("the first still-active period does not replace the configured prediction duration", () => {
  const date = today();
  setState({ lastPeriodStart: date, logs: { [date]: { flow: 2 } }, periodDuration: 5 });
  assert.equal(getPredictionPeriodDuration(), 5);
});
