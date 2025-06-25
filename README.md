# dice-castle
# 🛡️ Dice & Castle

**Dice & Castle** is a minimalist browser-based game built as a Progressive Web App (PWA). You explore regions using dice rolls to gather resources, then use those resources to build a castle on a simple 2D grid.

This project is designed to be iPhone-friendly and playable in portrait mode. Once deployed, you can "Add to Home Screen" on Safari to play like a native app.

---

## 🎮 Gameplay

- Tap **"Roll to Explore"** to gather random resources with a chance for random events.
- Build structures on the grid: **walls (🧱)**, **towers (🏰)** and **doors (🚪)**.
- Resources and grid layout persist between sessions thanks to `localStorage`.
- Gain experience when exploring and level up over time.
- Undo your last placement or clear the grid entirely.

---

## 🧱 Tech Stack

- HTML, CSS, JavaScript
- PWA: `manifest.json` + `service-worker.js`
- No server/backend — everything runs client-side
- Offline play supported

---

## 🛠 Setup & Deployment

1. Clone or fork the repo
2. Add the following files:
   - `index.html`
   - `styles.css`
   - `app.js`
   - `manifest.json`
   - `service-worker.js`
   - `icon-192.png` and `icon-512.png`
3. Push to GitHub
4. Go to **Settings > Pages** and set it to deploy from the `main` branch
5. Visit `https://your-username.github.io/dice-castle/` on iPhone
6. Tap **Share > Add to Home Screen** to install

---

## 🔮 Future Ideas

- Multi-floor castle building
- Crafting system (combine resources)
- Quest-based objectives

---

Made for fun and learning. Contributions and forks welcome!
