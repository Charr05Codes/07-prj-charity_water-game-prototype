# Water Works — Interactive Pipe Puzzle Game

Water Works is a beginner-friendly browser puzzle game inspired by the mission of improving access to clean and safe drinking water. Rotate pipe tiles to build a working route from the water source to the bucket before the timer runs out.

> This project is inspired by charity: water's mission and is not an official charity: water product.

## Technologies

- HTML5
- CSS3
- Vanilla JavaScript
- GitHub Pages

## How to Run

### 1) Run in GitHub Codespaces

1. Open this repository in GitHub Codespaces.
2. Open `index.html` in a browser preview, **or** run a small static server:
   ```bash
   python3 -m http.server 8080
   ```
3. In Codespaces, open the forwarded port (`8080`) in your browser.

### 2) Run Locally

1. Clone/download the repository.
2. Open `index.html` directly in a browser, or run:
   ```bash
   python3 -m http.server 8080
   ```
3. Visit `http://localhost:8080`.

### 3) Deploy with GitHub Pages

This repository includes a GitHub Actions workflow at
`.github/workflows/deploy-pages.yml`. To publish the game:

1. Push the repository to GitHub.
2. In repository settings, open **Pages** and set **Source** to **GitHub Actions**.
3. Push to `main`, or run **Deploy Water Works to GitHub Pages** from the
   repository's **Actions** tab.
4. Open the published URL shown in the completed workflow run.

The site is fully static, so GitHub Pages serves `index.html`, `css/styles.css`,
and `js/script.js` directly without a build step.

## How to Play

1. Click **Start Game**.
2. Click pipe tiles to rotate them 90° clockwise.
3. Build a continuous path from the top-left source entry to the bottom-right bucket exit.
4. Click **Check Pipes** to validate your current route.
5. Finish before the timer expires.
6. Use **Restart Level** to retry the current level.
7. Complete all three levels to finish the game.

### Scoring

When a level is completed, points are awarded once using:

```javascript
100 + (timeRemaining * 10)
```

The score is cumulative across levels.

## Project Structure

```text
water-works/
├── index.html          # Main page structure and game UI
├── css/
│   └── styles.css      # Game styles, layout, board visuals, animations
├── js/
│   └── script.js       # Game logic (state, rendering, rotation, timer, scoring)
├── assets/
│   ├── charity-water-logo.png # Linked charity: water logo
│   └── README.md       # Notes for optional local assets
├── README.md           # Project documentation
└── .gitignore
```

## JavaScript Concepts Used

- Variables (`const`, `let`) for game state and UI data
- Arrays for levels, board rows, and educational facts
- Objects for each pipe tile (`type`, `rotation`) and state values
- Functions for rendering, rotation, timers, scoring, and validation
- Event listeners for button clicks and tile interaction
- DOM manipulation to update board tiles, text, overlays, and controls
- Timers with `setInterval` / `clearInterval`
- Conditionals and loops for game flow and path checks
- Pipe connection validation to verify source-to-bucket routes

## Future Improvements

- Add more handcrafted levels
- Improve pipe graphics and board themes
- Add lightweight water flow animation polish
- Add optional sound effects
- Improve small-screen spacing and touch feedback
- Add additional educational clean-water messages
- Add optional advanced level generation
