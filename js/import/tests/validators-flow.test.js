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
