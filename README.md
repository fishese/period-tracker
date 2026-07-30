# My Cycle Keeper

A private, open-source period and cycle tracker that works in your browser and can be installed as a Progressive Web App (PWA).

**Use the app:** https://period.fishese.cc/

My Cycle Keeper is designed for straightforward daily tracking, useful cycle insights, and control over your own data. Your cycle records are stored locally on your device and encrypted with AES-256-GCM. The app does not use a backend to store your health data, and no account is required unless you choose to connect Google Drive for encrypted backups.

## Features

- **Simple daily tracking** for flow, spotting, pain, mood, and notes
- **Cycle and period predictions** based on your recent history, with adjustable prediction ranges
- **Cycle insights and history** with recent-period summaries, long-term statistics, and compact flow, pain, and mood charts
- **Optional cycle-phase and fertility estimates**, controlled separately in Settings
- **Privacy-conscious sharing and printing** for appointments, with dates and durations by default and optional symptom or note details
- **Import tools** for bringing in data from **My Calendar** or **drip**
- **Portable exports** in **drip-compatible CSV**, **plain CSV**, or an encrypted app backup
- **Optional encrypted Google Drive backup** for restoring your data on another device *(uses Google Drive's [`drive.appdata`](https://developers.google.com/workspace/drive/api/guides/api-specific-auth#drive-api-scopes) scope, which only allows My Cycle Keeper to access its own hidden app-data folder—not your other Drive files or folders)*
- **Offline support** after the app has been loaded, with an installable mobile-friendly interface
- Interface available in **English, Spanish, Japanese, and Traditional Chinese**

## Privacy and data ownership

My Cycle Keeper is built to keep cycle data under the user's control:

- Records are encrypted and stored locally in the browser
- There is no application server collecting or storing cycle logs
- Google Drive backup is optional and stores an encrypted backup in the app's hidden Drive app-data folder; it does not have permission to view or modify other content in your Drive
- Data can be exported in open, reusable formats
- Sharing and printed summaries default to limited information

As with any browser-based app, clearing site data may remove locally stored records. Keep an encrypted backup or enable Google Drive backup if the data is important to you.

## About this fork

My Cycle Keeper is based on [Your Cycle Keeper](https://github.com/pythonime-lab/yourcyclekeeper), an open-source project by [pythonime-lab](https://github.com/pythonime-lab), and continues to use the GPL v3 license.

This fork keeps the original project's privacy-focused foundation while adding substantial enhancements, including a redesigned daily logging experience, expanded cycle history and insights, improved prediction handling, multilingual updates, import and export tools, privacy-controlled print summaries, optional encrypted Google Drive backup, and broader PWA support.

| Project | App | Source code |
|---|---|---|
| **My Cycle Keeper** | [period.fishese.cc](https://period.fishese.cc/) | [fishese/period-tracker](https://github.com/fishese/period-tracker) |
| **Your Cycle Keeper** | [yourcyclekeeper.web.app](https://yourcyclekeeper.web.app) | [pythonime-lab/yourcyclekeeper](https://github.com/pythonime-lab/yourcyclekeeper) |

## Run locally

The app uses vanilla JavaScript modules and does not require a build step. Serve the repository root over HTTP so that the Service Worker and Web Crypto features work correctly.

```bash
python -m http.server 8000
```

Then open:

```text
http://localhost:8000/
```

Do not open the app directly with a `file://` URL.

## Deployment

This repository is deployed through GitHub Pages from the repository root.

```bash
git push period-tracker master
```

Before deploying, bump `CACHE_VERSION` in `service-worker.js`. Additional maintenance notes are available in [`docs/HANDOFF.md`](docs/HANDOFF.md).

## License

My Cycle Keeper is licensed under the [GNU General Public License v3.0](LICENSE.txt).

It is derived from [Your Cycle Keeper](https://github.com/pythonime-lab/yourcyclekeeper), also released under GPL v3. Copyright and attribution for the original project remain with its respective contributors.
