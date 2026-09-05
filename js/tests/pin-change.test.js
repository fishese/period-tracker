import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";

// Exercise the actual UI handlers without booting the rest of the app.
const source = readFileSync(new URL("../script.js", import.meta.url), "utf8");
const handlers = source.slice(source.indexOf('let changePinStage ='), source.indexOf('function switchTab(tab)'));

function setup(overrides = {}) {
  const timers = new Map();
  const calls = { renders: 0, writes: [], modals: 0 };
  let timerId = 0;
  const context = vm.createContext({
    sessionPin: "1234", state: { logs: { note: "keep" } },
    console: { error() {} },
    document: { getElementById: () => ({ style: {}, classList: { toggle() {}, remove() {} } }) },
    setTimeout: fn => { timers.set(++timerId, fn); return timerId; },
    clearTimeout: id => timers.delete(id),
    getOrCreateSalt: async () => "salt",
    hashPin: async () => "new-hash",
    statePersistence: { save: async (...args) => { calls.writes.push(args); } },
    disableBiometric: async () => {},
    _restoreModalBox: () => vm.runInContext("cancelChangePin()", context),
    showModal: () => { calls.modals++; },
    t: key => key,
    render: () => { calls.renders++; },
    ...overrides,
  });
  vm.runInContext(handlers + "\n_renderChangePinModal = render;", context);
  const run = script => vm.runInContext(script, context);
  const flushTimers = () => {
    const pending = [...timers.values()];
    timers.clear();
    pending.forEach(fn => fn());
  };
  const confirm = () => run('showChangePinModal(); changePinStage="confirm"; changePinFirst="5678"; changePinBuffer="5678"; _submitChangePinStep()');
  return { calls, context, run, flushTimers, confirm, timers };
}

test("cancelling PIN entry or mismatch cancels delayed modal updates", async () => {
  const ui = setup();
  ui.run('showChangePinModal(); for (const digit of "5678") changePinInput(digit); cancelChangePin();');
  ui.flushTimers();
  assert.equal(ui.calls.renders, 1);
  assert.equal(ui.calls.writes.length, 0);
  await ui.run('showChangePinModal(); changePinStage="confirm"; changePinFirst="5678"; changePinBuffer="1111"; _submitChangePinStep()');
  ui.run('cancelChangePin(); sessionPin=null;');
  ui.flushTimers();
  assert.equal(ui.calls.renders, 2);
});

test("locking during PIN hashing prevents a new PIN commit", async () => {
  let finishHash;
  let enteredHash;
  const started = new Promise(resolve => { enteredHash = resolve; });
  const ui = setup({ hashPin: () => {
    enteredHash();
    return new Promise(resolve => { finishHash = resolve; });
  } });
  const pending = ui.confirm();
  await started;
  ui.run('sessionPin=null; cancelChangePin();');
  finishHash("new-hash");
  await pending;
  assert.equal(ui.calls.writes.length, 0);
  assert.equal(ui.calls.modals, 0);
  assert.equal(ui.context.sessionPin, null);
});

test("locking during an atomic PIN commit never unlocks or reopens a modal", async () => {
  let finishSave;
  let enteredSave;
  const started = new Promise(resolve => { enteredSave = resolve; });
  const ui = setup({ statePersistence: { save: () => {
    enteredSave();
    return new Promise(resolve => { finishSave = resolve; });
  } } });
  const pending = ui.confirm();
  await started;
  ui.run('sessionPin=null; cancelChangePin();');
  finishSave();
  await pending;
  assert.equal(ui.calls.modals, 0);
  assert.equal(ui.context.sessionPin, null);
  assert.equal(ui.run("changePinSaving"), false);
});
