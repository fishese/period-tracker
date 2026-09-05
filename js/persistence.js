/** Serialize encrypted writes, including PIN rotations and data erasure. */
export function createStatePersistence({ getSalt, encrypt, write }) {
  let tail = Promise.resolve();
  function enqueue(operation) {
    const result = tail.then(operation);
    // A failed write must not prevent the user from retrying.
    tail = result.catch(() => {});
    return result;
  }
  return {
    async save(state, pin, pinHash = null) {
      if (!/^\d{4}$/.test(pin || "")) throw new Error("not_unlocked");
      // Capture before any await: locking replaces state and clears the PIN.
      const snapshot = JSON.parse(JSON.stringify(state));
      return enqueue(async () => {
        const salt = await getSalt();
        const encrypted = await encrypt(snapshot, pin, salt);
        await write(encrypted, pinHash);
      });
    },
    enqueue,
  };
}
