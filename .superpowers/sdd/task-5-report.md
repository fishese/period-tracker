# Task 5 Report: My Calendar adapter

## Status: COMPLETE

## RED phase

Created fixture (`mycalendar-july.txt`) and test file (`mycalendar-adapter.test.js`) per brief.
Before `mycalendar.js` existed, `npm test` would fail with module-not-found on import.

## GREEN phase

Implemented `parseMyCalendarText()` in `period-tracker/js/import/adapters/mycalendar.js`:

- Local date parsing (`Mon D, YYYY` → ISO via `toISO`, no `Date.toISOString()`)
- Flow mapping: `+`→1, `++`→2, `+++`→3, `++++`→4 from Symptoms groups (longest prefix first)
- `Spotting` → `spotting: true` + leftover entry
- `Moods:Label` → `unmappedMoods` + leftover (no `mood` field)
- `Temperature:…` and other symptoms → leftovers as `symptom(+…):Name`
- Period pairing matches `mycalendar-to-drip.html` (open start, orphan end, unclosed start)
- `hasSourceFlow` set per period when any day in range has source flow

## Tests

```
npm test — 15/15 pass (2 new mycalendar adapter tests)
```

## Commit

```
feat: parse My Calendar exports into import preview
```

## Concerns

None. Jul 13 `++++`/`+++`/`++`/`+` symptom groups and `Moods:Angelic` behave as spec expects.

## Review follow-up

Added assertions per Important review findings:

- Jul 13: `spotting: true` with `flow: 1`
- Jul 13: `pain` undefined (pain-like symptoms stay in leftovers only)
- Jul 13 leftovers include a pain-like name (`Cramps` or `Backaches`)

```
npm test — 15/15 pass
```

## Commit

```
test: assert My Calendar spotting and no pain mapping
```
