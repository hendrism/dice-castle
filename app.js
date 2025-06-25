// game state
let resources = { wood: 0, stone: 0, metal: 0 };
let grid = Array.from({ length: 5 }, () => Array(5).fill(''));

// helpers
function updateResources() {
  document.getElementById('resources').textContent =
    `Wood: ${resources.wood} | Stone: ${resources.stone} | Metal: ${resources.metal}`;
}
function narrate(text) {
  document.getElementById('narration').textContent = text;
}

// exploration
document.getElementById('exploreBtn').addEventListener('click', () => {
  const roll = Math.floor(Math.random() * 6) + 1;
  let found;
  if (roll <= 2) {
    resources.wood++;
    found = '1 Wood';
  } else if (roll <= 4) {
    resources.stone++;
    found = '1 Stone';
  } else {
    resources.metal++;
    found = '1 Metal';
  }
  narrate(`You rolled a ${roll} and found ${found}!`);
  updateResources();
});

// grid setup
const gridEl = document.getElementById('grid');
function drawGrid() {
  gridEl.innerHTML = '';
  for (let y = 0; y < 5; y++) {
    for (let x = 0; x < 5; x++) {
      const cell = document.createElement('div');
      cell.className = 'cell';
      cell.textContent = grid[y][x] || '';
      // click to build a wall (example)
      cell.addEventListener('click', () => {
        if (resources.stone > 0 && !grid[y][x]) {
          resources.stone--;
          grid[y][x] = '🧱';
          updateResources();
          drawGrid();
        }
      });
      gridEl.appendChild(cell);
    }
  }
}
drawGrid();
updateResources();
