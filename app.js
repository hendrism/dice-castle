// constants
const GRID_SIZE = 5;
const RESOURCE_TYPES = { WOOD: 'wood', STONE: 'stone', METAL: 'metal' };
const BUILDINGS = {
  wall: { emoji: '🧱', cost: { [RESOURCE_TYPES.STONE]: 1 } },
  tower: { emoji: '🏰', cost: { [RESOURCE_TYPES.STONE]: 2, [RESOURCE_TYPES.METAL]: 1 } },
  door: { emoji: '🚪', cost: { [RESOURCE_TYPES.WOOD]: 1 } },
};
const XP_PER_LEVEL = 5;

// game state
let resources = load('resources') || { wood: 0, stone: 0, metal: 0 };
let grid = load('grid') || Array.from({ length: GRID_SIZE }, () => Array(GRID_SIZE).fill(''));
let player = load('player') || { level: 1, xp: 0 };
let history = [];

// helpers
function updateResources() {
  document.getElementById('resources').textContent =
    `Wood: ${resources.wood} | Stone: ${resources.stone} | Metal: ${resources.metal} | Level: ${player.level}`;
  save();
}
function narrate(text) {
  document.getElementById('narration').textContent = text;
}

function save() {
  localStorage.setItem('resources', JSON.stringify(resources));
  localStorage.setItem('grid', JSON.stringify(grid));
  localStorage.setItem('player', JSON.stringify(player));
}

function load(key) {
  const data = localStorage.getItem(key);
  return data ? JSON.parse(data) : null;
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

  let msg = `You rolled a ${roll} and found ${found}!`;

  const eventRoll = Math.random();
  if (eventRoll < 0.1) {
    const keys = Object.keys(resources).filter(k => resources[k] > 0);
    if (keys.length) {
      const lossKey = keys[Math.floor(Math.random() * keys.length)];
      resources[lossKey]--;
      msg += ` But bandits stole 1 ${lossKey}!`;
    }
  } else if (eventRoll > 0.9) {
    resources.metal++;
    msg += ' You discovered rare metal!';
  }

  player.xp++;
  if (player.xp >= player.level * XP_PER_LEVEL) {
    player.level++;
    player.xp = 0;
    msg += ` Level up! You are now level ${player.level}.`;
  }

  narrate(msg);
  updateResources();
});

// grid setup
const gridEl = document.getElementById('grid');
const buildSelect = document.getElementById('buildSelect');
let selectedBuild = buildSelect.value;
buildSelect.addEventListener('change', e => (selectedBuild = e.target.value));

function canAfford(cost) {
  return Object.keys(cost).every(r => resources[r] >= cost[r]);
}

function payCost(cost) {
  Object.keys(cost).forEach(r => (resources[r] -= cost[r]));
}

function refundCost(cost) {
  Object.keys(cost).forEach(r => (resources[r] += cost[r]));
}

function drawGrid() {
  gridEl.style.setProperty('--grid-size', GRID_SIZE);
  gridEl.innerHTML = '';
  for (let y = 0; y < GRID_SIZE; y++) {
    for (let x = 0; x < GRID_SIZE; x++) {
      const cell = document.createElement('div');
      cell.className = 'cell';
      cell.textContent = grid[y][x] || '';
      cell.addEventListener('click', () => {
        if (!grid[y][x]) {
          const building = BUILDINGS[selectedBuild];
          if (canAfford(building.cost)) {
            payCost(building.cost);
            grid[y][x] = building.emoji;
            history.push({ x, y, building });
            cell.classList.add('selected');
            setTimeout(() => cell.classList.remove('selected'), 200);
            updateResources();
            drawGrid();
          }
        }
      });
      gridEl.appendChild(cell);
    }
  }
}

document.getElementById('undoBtn').addEventListener('click', () => {
  const last = history.pop();
  if (last) {
    grid[last.y][last.x] = '';
    refundCost(last.building.cost);
    drawGrid();
    updateResources();
  }
});

document.getElementById('clearBtn').addEventListener('click', () => {
  grid = Array.from({ length: GRID_SIZE }, () => Array(GRID_SIZE).fill(''));
  history = [];
  drawGrid();
  updateResources();
});

drawGrid();
updateResources();
