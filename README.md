# My Cycle Keeper (personal fork)

Privacy-first period tracking PWA — AES-256-GCM encryption, no server, optional Google Drive backup.

**Open the app:** https://fishese.github.io/period-tracker/period-tracker/

This repo root is only a redirect page for GitHub Pages. All app code lives in [`period-tracker/`](period-tracker/).

## Current highlights

- Compact mobile-first daily editor for flow, pain (including explicit **No pain**), mood, and notes
- Rolling six-month predictions plus all-time cycle statistics
- Recent-period profile and compact per-period flow/pain/mood charts in both recent and full history
- Fertility estimates default off; the independently controlled cycle-phase timeline defaults on
- Doctor-friendly sharing remains dates/durations only; printed history has separate opt-ins for symptoms and notes
- Existing encrypted data remains supported
- Import from **My Calendar** or **drip**; export to **drip** or **plain CSV** (in-app wizards)
- English, Spanish, Japanese, and Traditional Chinese UI

## Fork vs upstream

| | This fork | Upstream |
|---|-----------|----------|
| **App** | [My Cycle Keeper](https://fishese.github.io/period-tracker/period-tracker/) | [Your Cycle Keeper](https://yourcyclekeeper.web.app) |
| **Repo** | [fishese/period-tracker](https://github.com/fishese/period-tracker) | [pythonime-lab/yourcyclekeeper](https://github.com/pythonime-lab/yourcyclekeeper) |

## Develop locally

```bash
cd period-tracker
python -m http.server 8000
# http://localhost:8000/period-tracker/
```

## Deploy

```bash
git push period-tracker master
```

Bump `period-tracker/service-worker.js` `CACHE_VERSION` before deploy. See [`period-tracker/docs/HANDOFF.md`](period-tracker/docs/HANDOFF.md).

## License

GPL v3 — see [LICENSE.txt](LICENSE.txt). Based on Your Cycle Keeper (pythonime-lab).
