# MissionDeck — Personal Ops Center

A fully offline personal productivity PWA built for Jose Reyna. Tasks with time horizons, one Kanban board, calendar with .ics export, markdown notes with voice dictation, an adjustable pomodoro timer with stats, and 2048 + Snake for breaks.

**No build step. No dependencies. No accounts.** All data is saved on your device (localStorage) and the app works fully offline once installed.

## What's inside

| File | Purpose |
|---|---|
| `index.html` | App shell |
| `css/styles.css` | Design system (dark + light themes) |
| `js/app.js` | Tasks, board, calendar, notes, voice capture, focus timer, settings |
| `js/games.js` | 2048 and Snake |
| `manifest.json` | PWA install metadata |
| `sw.js` | Service worker — offline caching |
| `icons/` | App icons |

## Deploy (GitHub + Vercel)

1. Create a free account at **github.com**, then a new repository (e.g. `missiondeck`).
2. Upload all of these files to the repo, keeping the folder structure (`css/`, `js/`, `icons/` as folders).
3. Go to **vercel.com** → sign up with your GitHub account → **New Project** → import the repo → **Deploy**. No settings needed — it's a static site.
4. You'll get a URL like `https://missiondeck.vercel.app`.

## Install on your phone (Samsung S24 Ultra)

1. Open your Vercel URL in **Chrome** on the phone.
2. Tap the **⋮** menu → **Add to Home screen** → **Install**.
3. MissionDeck now opens fullscreen like a native app and works offline.

## Honest limitations

- **Phone calendar**: a web app can't write directly into Samsung/Google Calendar. Instead, tap the calendar icon on any task (or **Export .ics** in the Calendar view) — opening the downloaded `.ics` file imports the events, including weekly recurrence, into your phone's calendar.
- **Voice capture**: uses the browser's speech recognition (Chrome / Samsung Internet). On most phones it needs an internet connection while transcribing. Everything else works offline.
- **Samsung Notes**: no app can read Samsung Notes. MissionDeck has its own notes with search, tags, dictation, and markdown export instead.
- **Data lives on the device**: clearing Chrome's site data deletes it. Use **Settings → Export** for a JSON backup.
