# dice-castle
# 🛡️ Dice & Castle

**Dice & Castle** is a minimalist browser-based game built as a Progressive Web App (PWA). You explore regions using dice rolls to gather resources, then use those resources to upgrade your camp into a thriving settlement.

This project is designed to be iPhone-friendly and playable in portrait mode. Once deployed, you can "Add to Home Screen" on Safari to play like a native app.

---

## 🎮 Gameplay

- Choose a location and tap **"Explore"** to gather resources using stamina.
- Stamina drains as you explore and automatically recovers when you sleep.
- Sleep triggers a dice roll for good, bad, or neutral overnight events.
- Upgrade your **living quarters** from a humble camp to larger homes.
- Strengthen your **walls** from earthen mounds to sturdy stone.
- Build multiple **farms (🌾)** and **quarries (⛏️)** and upgrade them for more production.
- Structures and resources persist between sessions thanks to `localStorage`.
- Gain experience when exploring and level up over time.

## 🏗️ Building & Upgrading

Scroll down to the **Your Settlement** section to expand your camp. Each
structure lists its current level along with a **Build** or **Upgrade** button.
The buttons display the required materials and are enabled whenever you can
afford the cost.

### Build Costs

- **Farm** – 1 wood, 1 stone
- **Quarry** – 1 wood, 2 stone

### Upgrade Costs

**Home**

| From    | To       | Cost                    |
| ------- | -------- | ----------------------- |
| Camp    | House    | 5 wood                  |
| House   | Hall     | 10 wood, 5 stone        |
| Hall    | Fortress | 20 stone, 5 metal       |

**Walls**

| From   | To      | Cost      |
| ------ | ------- | --------- |
| None   | Earthen | 5 wood    |
| Earthen| Wood    | 10 wood   |
| Wood   | Stone   | 20 stone  |

**Farms**

| From     | To       | Cost                          |
| -------- | -------- | ----------------------------- |
| Basic    | Improved | 2 wood                        |
| Improved | Advanced | 5 wood, 2 stone               |
| Advanced | Master   | 10 wood, 5 stone, 2 metal     |

**Quarries**

| From     | To       | Cost                          |
| -------- | -------- | ----------------------------- |
| Basic    | Improved | 2 wood                        |
| Improved | Advanced | 5 wood, 2 stone               |
| Advanced | Master   | 10 wood, 5 stone, 2 metal     |

You can build a number of farms and quarries up to your home level plus one.

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

- Additional quest lines
- More random events and NPCs

---

Made for fun and learning. Contributions and forks welcome!
