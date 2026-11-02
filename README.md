# Claude Code Logger

🇬🇧 **English** · 🇳🇱 [Nederlands](README.nl.md)

**See when you code with Claude Code: every prompt to the second, your active time, and your patterns per day, week, month and quarter.**

> *"Today, Monday, 2 November 2026: you sent 32 prompts."*

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="docs/dashboard-dark.png">
  <img alt="Claude Code Logger dashboard with timeline, prompts per hour and quarterly overview (demo data)" src="docs/dashboard-light.png">
</picture>

<sub>Screenshot with made-up demo data.</sub>

Claude Code Logger is a small local dashboard for Windows. It reads the transcripts Claude Code already keeps on your machine (`%USERPROFILE%\.claude\projects`) and shows when you were active. Nothing goes to the internet: all data stays on your own computer.

## What you get

- **Prompts per day**, with the exact time of every prompt and the session it belongs to
- **Active coding time**: your total active time, plus your first and last activity of the day
- **24-hour timeline** with your active blocks and a tick for every prompt
- **Prompts per hour**, so you can see when you do the most
- **Week, month or quarter overview** with total prompts, active time and active days
- **Its own archive**: Claude Code deletes old transcripts after a while, but the logger keeps everything it has ever seen
- **Language switcher**: Dutch and English, plus an optional third language of your choice (Deutsch, Français or Español)
- Refreshes every 15 seconds, with light and dark themes

## Install

All you need is [Node.js](https://nodejs.org) 18 or newer. There are no packages to install.

1. Download this repository via **Code → Download ZIP** and unzip it.
2. Double-click `launch.vbs` to start the app without a console window. If you want to see the console, use `start.bat` instead.
3. The dashboard opens at <http://localhost:4317>.

Want a desktop shortcut? Right-click `launch.vbs`, choose **Create shortcut**, and use `claude-code-logger.ico` as the icon.

**Tip:** Claude Code keeps transcripts for 30 days by default. To let the logger see more history, add this to `%USERPROFILE%\.claude\settings.json`:

```json
{ "cleanupPeriodDays": 365 }
```

## Demo mode

Want to show the app without revealing your own prompts? Open <http://localhost:4317/?demo>. You'll see 120 days of made-up but realistic data, with a **DEMO** label on screen. Add `&range=90` to open the quarter view, and `&lang=en` (or `nl`, `de`, `fr`, `es`) to pick the language. Demo data is available in all five languages. Demo mode never reads or changes your real data or archive.

## How it works

- `server.js` is a small Node server that only listens on `127.0.0.1`. It reads Claude Code's `.jsonl` transcripts and only counts messages you typed yourself. System messages, tool results and commands are skipped, and prompts from forked sessions are counted once.
- **Active time** is built from every moment you or Claude did something. A gap of more than 10 minutes starts a new block.
- The **archive** lives in a `data` folder next to the app folder (`../data/archive.json`). It contains the text of your prompts, so don't share that folder.
- Translations live in `i18n.js`. Adding a language means adding one block there.

## Support the Logger

Claude Code Logger is free. Find it useful? A small donation helps fund new versions with more charts and patterns.

☕ **[Buy me a coffee](https://urbantechmonk.gumroad.com/coffee)**

---

Open source under the [MIT License](LICENSE) · © 2026 rpg86x. Claude Code Logger is an independent project and is not affiliated with Anthropic.
