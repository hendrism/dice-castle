// constants
const GRID_SIZE = 5;
const RESOURCE_TYPES = { WOOD: 'wood', STONE: 'stone', METAL: 'metal' };

const CRAFTABLES = {
  fortifiedWall: { emoji: '🧱', cost: { [RESOURCE_TYPES.STONE]: 2, [RESOURCE_TYPES.METAL]: 1 } },
  reinforcedDoor: { emoji: '🚪', cost: { [RESOURCE_TYPES.WOOD]: 1, [RESOURCE_TYPES.METAL]: 1 } },
};

const BUILDINGS = {
  wall: { emoji: '🧱', cost: { [RESOURCE_TYPES.STONE]: 1 } },
  tower: { emoji: '🏰', cost: { [RESOURCE_TYPES.STONE]: 2, [RESOURCE_TYPES.METAL]: 1 } },
  door: { emoji: '🚪', cost: { [RESOURCE_TYPES.WOOD]: 1 } },
  market: { emoji: '🏪', cost: { [RESOURCE_TYPES.WOOD]: 2, [RESOURCE_TYPES.STONE]: 1 } },
  barracks: { emoji: '🏹', cost: { [RESOURCE_TYPES.STONE]: 2, [RESOURCE_TYPES.WOOD]: 1 } },
  fortifiedWall: { emoji: '🧱', inventoryItem: 'fortifiedWall' },
  reinforcedDoor: { emoji: '🚪', inventoryItem: 'reinforcedDoor' },
};
const XP_PER_LEVEL = 5;

// game state
let resources = load('resources') || { wood: 0, stone: 0, metal: 0 };
let inventory = load('inventory') || { fortifiedWall: 0, reinforcedDoor: 0 };
let grid = load('grid') || [Array.from({ length: GRID_SIZE }, () => Array(GRID_SIZE).fill(''))];
let currentFloor = load('currentFloor') || 0;
let player = load('player') || { level: 1, xp: 0 };
let history = [];
let questProgress = load('questProgress') || { totalBuildings: 0 };
let completedQuests = load('completedQuests') || [];

// helpers
function updateResources() {
  const inv = `Fortified Walls: ${inventory.fortifiedWall} | Reinforced Doors: ${inventory.reinforcedDoor}`;
  document.getElementById('resources').textContent =
    `Wood: ${resources.wood} | Stone: ${resources.stone} | Metal: ${resources.metal} | Level: ${player.level}` +
    `\n${inv}`;
  updateQuests();
  save();
}

function updateQuests() {
  const questsEl = document.getElementById('quests');
  const quests = [];
  if (!completedQuests.includes('builder')) {
    quests.push(`Build 5 structures (${questProgress.totalBuildings}/5)`);
  }
  if (!completedQuests.includes('level3')) {
    quests.push(`Reach level 3 (current ${player.level})`);
  }
  questsEl.textContent = quests.length ? 'Quests:\n' + quests.join('\n') : 'All quests completed!';
}

function checkQuests() {
  if (!completedQuests.includes('builder') && questProgress.totalBuildings >= 5) {
    completedQuests.push('builder');
    resources.wood += 5;
    narrate('Quest complete! You built 5 structures and gained 5 wood.');
  }
  if (!completedQuests.includes('level3') && player.level >= 3) {
    completedQuests.push('level3');
    resources.metal += 2;
    narrate('Quest complete! You reached level 3 and gained 2 metal.');
  }
}
function narrate(text) {
  document.getElementById('narration').textContent = text;
}

function save() {
  localStorage.setItem('resources', JSON.stringify(resources));
  localStorage.setItem('inventory', JSON.stringify(inventory));
  localStorage.setItem('grid', JSON.stringify(grid));
  localStorage.setItem('currentFloor', JSON.stringify(currentFloor));
  localStorage.setItem('player', JSON.stringify(player));
  localStorage.setItem('questProgress', JSON.stringify(questProgress));
  localStorage.setItem('completedQuests', JSON.stringify(completedQuests));
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
  if (eventRoll < 0.05) {
    const gain = Object.values(RESOURCE_TYPES)[Math.floor(Math.random() * 3)];
    resources[gain]++;
    msg += ` A friendly trader gifted you 1 ${gain}!`;
  } else if (eventRoll < 0.1) {
    const keys = Object.keys(resources).filter(k => resources[k] > 0);
    if (keys.length) {
      const lossKey = keys[Math.floor(Math.random() * keys.length)];
      resources[lossKey]--;
      msg += ` Bandits stole 1 ${lossKey}!`;
    }
  } else if (eventRoll > 0.95) {
    resources.metal++;
    msg += ' You discovered rare metal!';
  } else if (eventRoll > 0.9) {
    const gain = Object.values(RESOURCE_TYPES)[Math.floor(Math.random() * 3)];
    resources[gain] += 2;
    msg += ` You found a treasure chest with 2 ${gain}!`;
  }

  player.xp++;
  if (player.xp >= player.level * XP_PER_LEVEL) {
    player.level++;
    player.xp = 0;
    msg += ` Level up! You are now level ${player.level}.`;
    checkQuests();
  }

  narrate(msg);
  updateResources();
});

// grid setup
const gridEl = document.getElementById('grid');
const buildSelect = document.getElementById('buildSelect');
const craftSelect = document.getElementById('craftSelect');
const floorSelect = document.getElementById('floorSelect');
const addFloorBtn = document.getElementById('addFloorBtn');
let selectedBuild = buildSelect.value;
buildSelect.addEventListener('change', e => (selectedBuild = e.target.value));

function populateFloors() {
  floorSelect.innerHTML = '';
  for (let i = 0; i < grid.length; i++) {
    const opt = document.createElement('option');
    opt.value = i;
    opt.textContent = `Floor ${i + 1}`;
    if (i === currentFloor) opt.selected = true;
    floorSelect.appendChild(opt);
  }
}

floorSelect.addEventListener('change', e => {
  currentFloor = Number(e.target.value);
  drawGrid();
  updateResources();
});

addFloorBtn.addEventListener('click', () => {
  grid.push(Array.from({ length: GRID_SIZE }, () => Array(GRID_SIZE).fill('')));
  currentFloor = grid.length - 1;
  populateFloors();
  drawGrid();
  updateResources();
});

document.getElementById('craftBtn').addEventListener('click', () => {
  const itemKey = craftSelect.value;
  const craft = CRAFTABLES[itemKey];
  if (Object.keys(craft.cost).every(r => resources[r] >= craft.cost[r])) {
    Object.keys(craft.cost).forEach(r => (resources[r] -= craft.cost[r]));
    inventory[itemKey]++;
    updateResources();
    narrate(`Crafted 1 ${itemKey}!`);
  }
});

function canAfford(building) {
  if (building.cost) {
    return Object.keys(building.cost).every(r => resources[r] >= building.cost[r]);
  }
  if (building.inventoryItem) {
    return inventory[building.inventoryItem] > 0;
  }
  return false;
}

function payCost(building) {
  if (building.cost) {
    Object.keys(building.cost).forEach(r => (resources[r] -= building.cost[r]));
  } else if (building.inventoryItem) {
    inventory[building.inventoryItem]--;
  }
}

function refundCost(building) {
  if (building.cost) {
    Object.keys(building.cost).forEach(r => (resources[r] += building.cost[r]));
  } else if (building.inventoryItem) {
    inventory[building.inventoryItem]++;
  }
}

function drawGrid() {
  gridEl.style.setProperty('--grid-size', GRID_SIZE);
  gridEl.innerHTML = '';
  const floor = grid[currentFloor];
  for (let y = 0; y < GRID_SIZE; y++) {
    for (let x = 0; x < GRID_SIZE; x++) {
      const cell = document.createElement('div');
      cell.className = 'cell';
      cell.textContent = floor[y][x] || '';
      cell.addEventListener('click', () => {
        if (!floor[y][x]) {
          const building = BUILDINGS[selectedBuild];
          if (canAfford(building)) {
            payCost(building);
            floor[y][x] = building.emoji;
            history.push({ x, y, building, floor: currentFloor });
            questProgress.totalBuildings++;
            checkQuests();
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
    grid[last.floor][last.y][last.x] = '';
    refundCost(last.building);
    drawGrid();
    updateResources();
  }
});

document.getElementById('clearBtn').addEventListener('click', () => {
  grid[currentFloor] = Array.from({ length: GRID_SIZE }, () => Array(GRID_SIZE).fill(''));
  history = history.filter(h => h.floor !== currentFloor);
  drawGrid();
  updateResources();
});

populateFloors();
drawGrid();
updateResources();
