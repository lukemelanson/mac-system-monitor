# 🖥️ Mac System Monitor

A lightweight Mac menu bar app that displays real-time system stats with switchable session profiles — built with Electron.

---

## Features

- **Lives in your menu bar** — click the icon to open a clean dropdown, click away to dismiss
- **4 session profiles** that show only the metrics you care about in the moment:
  - 💼 **Work** — CPU, RAM, Battery, Active App, Network, Break Reminder (every 60 min)
  - 🎮 **Gaming** — CPU, RAM, Battery, Active App, GPU (refreshes every second)
  - 😌 **Chill** — Battery + Network only, minimal noise
  - 🎨 **Creative** — CPU, RAM, Battery, Active App, Disk, Break Reminder (every 90 min)
- **Break reminders** — notifies you when it's time to step away, with a "Took one ✓" button to reset the timer
- **Live tray title** — shows your current CPU % (or battery %) at a glance without opening the dropdown

---

## Screenshots

> _Add your own screenshots here!_

---

## Requirements

- macOS
- [Node.js](https://nodejs.org) (v18 or higher)
- [npm](https://www.npmjs.com)

---

## Installation

```bash
# Clone the repo
git clone https://github.com/YOUR-USERNAME/mac-system-monitor.git

# Go into the project folder
cd mac-system-monitor

# Install dependencies
npm install

# Start the app
npm start
```

> On first launch, macOS may ask for **Accessibility permissions** (needed to detect your active app). Go to **System Settings → Privacy & Security → Accessibility** and enable it.

---

## Usage

1. Run `npm start` in Terminal
2. Look for the icon in your **menu bar** (top right, near the clock)
3. Click it to open the dropdown
4. Switch between **Work / Gaming / Chill / Creative** profiles using the buttons at the top
5. Your metrics update automatically based on the active session

---

## Project Structure

```
mac-system-monitor/
├── main.js        # Electron main process — tray, window, metrics polling
├── preload.js     # Secure IPC bridge between main and renderer
├── renderer.js    # UI logic — renders metrics and handles session switching
├── index.html     # Dropdown window shell
├── style.css      # Styles for the popup
└── package.json
```

---

## Roadmap

- [ ] Custom profiles (build your own metric set)
- [ ] Pomodoro timer integration
- [ ] Top apps by usage time today
- [ ] Calendar event countdown
- [ ] Package as a standalone `.app` (no Terminal needed)
- [ ] Auto-detect session based on active app

---

## Built With

- [Electron](https://www.electronjs.org)
- [systeminformation](https://systeminformation.io)

---

## License

MIT
