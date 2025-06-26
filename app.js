// constants
const GRID_SIZE = 8;
const RESOURCE_TYPES = { WOOD: 'wood', STONE: 'stone', METAL: 'metal' };

const CRAFTABLES = {
  fortifiedWall: { emoji: '🧱', cost: { [RESOURCE_TYPES.STONE]: 2, [RESOURCE_TYPES.METAL]: 1 } },
  reinforcedDoor: { emoji: '🚪', cost: { [RESOURCE_TYPES.WOOD]: 1, [RESOURCE_TYPES.METAL]: 1 } },
};

const TERRAIN_TYPES = {
  plain: { emoji: '⬜' },
  forest: { emoji: '🌲' },
  mountain: { emoji: '⛰️' },
  desert: { emoji: '🏜️' },
};

const BUILDINGS = {
  home: { emoji: '🏠', cost: { [RESOURCE_TYPES.WOOD]: 5 } },
  woodWall: { emoji: '🪵', cost: { [RESOURCE_TYPES.WOOD]: 1 } },
  stoneWall: { emoji: '🧱', cost: { [RESOURCE_TYPES.STONE]: 2 }, upgradeFrom: 'woodWall' },
  farm: { emoji: '🌾', cost: { [RESOURCE_TYPES.WOOD]: 1, [RESOURCE_TYPES.STONE]: 1 } },
  quarry: { emoji: '⛏️', cost: { [RESOURCE_TYPES.WOOD]: 1, [RESOURCE_TYPES.STONE]: 2 } },
};

const LOCATIONS = {
  forest: {
    cost: 1,
    getReward() {
      const roll = Math.floor(Math.random() * 6) + 1;
      if (roll <= 4) return { resource: RESOURCE_TYPES.WOOD, amount: 1 };
      if (roll <= 5) return { resource: RESOURCE_TYPES.STONE, amount: 1 };
      return { resource: RESOURCE_TYPES.METAL, amount: 1 };
    },
  },
  quarry: {
    cost: 2,
    getReward() {
      const roll = Math.floor(Math.random() * 6) + 1;
      if (roll <= 2) return { resource: RESOURCE_TYPES.WOOD, amount: 1 };
      if (roll <= 5) return { resource: RESOURCE_TYPES.STONE, amount: 2 };
      return { resource: RESOURCE_TYPES.METAL, amount: 1 };
    },
  },
  mine: {
    cost: 3,
    getReward() {
      const roll = Math.floor(Math.random() * 6) + 1;
      if (roll <= 3) return { resource: RESOURCE_TYPES.STONE, amount: 1 };
      if (roll <= 5) return { resource: RESOURCE_TYPES.METAL, amount: 1 };
      return { resource: RESOURCE_TYPES.METAL, amount: 2 };
    },
  },
};
const XP_PER_LEVEL = 5;
const MAX_STAMINA = 10;

// game state
let resources = load('resources') || { wood: 0, stone: 0, metal: 0 };
let inventory = load('inventory') || { fortifiedWall: 0, reinforcedDoor: 0 };
function generateTerrain() {
  const terrains = Object.keys(TERRAIN_TYPES);
  return Array.from({ length: GRID_SIZE }, () =>
    Array.from({ length: GRID_SIZE }, () => terrains[Math.floor(Math.random() * terrains.length)])
  );
}

let grid = load('grid') || [Array.from({ length: GRID_SIZE }, () => Array(GRID_SIZE).fill(''))];
let terrain = load('terrain');
if (!terrain) {
  terrain = [generateTerrain()];
}
let homePlaced = load('homePlaced');
if (homePlaced === null) {
  homePlaced = grid.some(f => f.some(row => row.includes('home')));
}
let currentFloor = load('currentFloor') || 0;
let player = load('player') || { level: 1, xp: 0, stamina: MAX_STAMINA };
if (player.stamina === undefined) player.stamina = MAX_STAMINA;
let history = [];
let questProgress = load('questProgress') || { totalBuildings: 0 };
let completedQuests = load('completedQuests') || [];

// helpers
function updateResources() {
  const inv = `Fortified Walls: ${inventory.fortifiedWall} | Reinforced Doors: ${inventory.reinforcedDoor}`;
  document.getElementById('resources').textContent =
    `Wood: ${resources.wood} | Stone: ${resources.stone} | Metal: ${resources.metal} | Level: ${player.level} | Stamina: ${player.stamina}/${MAX_STAMINA}` +
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
  localStorage.setItem('terrain', JSON.stringify(terrain));
  localStorage.setItem('homePlaced', JSON.stringify(homePlaced));
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
const locationSelect = document.getElementById('locationSelect');

function sleep() {
  const roll = Math.floor(Math.random() * 6) + 1;
  let msg = 'Exhausted, you fall asleep. ';
  if (roll <= 2) {
    const keys = Object.keys(resources).filter(k => resources[k] > 0);
    if (keys.length) {
      const loss = keys[Math.floor(Math.random() * keys.length)];
      resources[loss]--;
      msg += `Thieves stole 1 ${loss} during the night.`;
    } else {
      msg += 'Restless dreams disturb your sleep.';
    }
  } else if (roll <= 4) {
    msg += 'Nothing of note happens overnight.';
  } else {
    const gain = Object.values(RESOURCE_TYPES)[Math.floor(Math.random() * 3)];
    resources[gain]++;
    msg += `You wake refreshed and find 1 ${gain} nearby.`;
  }
  player.stamina = MAX_STAMINA;
  narrate(msg);
  updateResources();
}

document.getElementById('exploreBtn').addEventListener('click', () => {
  const loc = LOCATIONS[locationSelect.value];
  if (player.stamina < loc.cost) {
    sleep();
    return;
  }
  player.stamina -= loc.cost;
  const reward = loc.getReward();
  resources[reward.resource] += reward.amount;
  const found = `${reward.amount} ${reward.resource.charAt(0).toUpperCase() + reward.resource.slice(1)}`;

  let msg = `You explored the ${locationSelect.value} and found ${found}!`;

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
  if (player.stamina <= 0) {
    sleep();
  }
});

// grid setup
const gridEl = document.getElementById('grid');
const buildSelect = document.getElementById('buildSelect');
const buildCostEl = document.getElementById('buildCost');
const craftSelect = document.getElementById('craftSelect');
const floorSelect = document.getElementById('floorSelect');
const addFloorBtn = document.getElementById('addFloorBtn');
let selectedBuild = buildSelect.value;
buildSelect.addEventListener('change', e => {
  selectedBuild = e.target.value;
  updateBuildCost();
});

function updateBuildCost() {
  const building = BUILDINGS[selectedBuild];
  if (building.cost) {
    const costStr = Object.entries(building.cost)
      .map(([r, n]) => `${n} ${r}`)
      .join(', ');
    buildCostEl.textContent = `Cost: ${costStr}`;
  } else if (building.inventoryItem) {
    buildCostEl.textContent = `Uses: 1 ${building.inventoryItem}`;
  } else {
    buildCostEl.textContent = '';
  }
}

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
  terrain.push(generateTerrain());
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
  const terrainFloor = terrain[currentFloor];
  for (let y = 0; y < GRID_SIZE; y++) {
    for (let x = 0; x < GRID_SIZE; x++) {
      const cell = document.createElement('div');
      cell.className = 'cell';
      const buildingKey = floor[y][x];
      const display = buildingKey
        ? BUILDINGS[buildingKey].emoji
        : TERRAIN_TYPES[terrainFloor[y][x]].emoji;
      cell.textContent = display;
      cell.addEventListener('click', () => {
        const currentKey = floor[y][x];
        if (!currentKey) {
          const buildingKey = selectedBuild;
          const building = BUILDINGS[buildingKey];
          if (building.upgradeFrom) {
            narrate('Place a wood wall first.');
            return;
          }
          if (buildingKey !== 'home' && !homePlaced) {
            narrate('Place your home first.');
            return;
          }
          if (canAfford(building)) {
            payCost(building);
            floor[y][x] = buildingKey;
            history.push({ x, y, prev: '', new: buildingKey, floor: currentFloor });
            if (buildingKey === 'home') homePlaced = true;
            questProgress.totalBuildings++;
            checkQuests();
            cell.classList.add('selected');
            setTimeout(() => cell.classList.remove('selected'), 200);
            updateResources();
            drawGrid();
          }
        } else if (selectedBuild === 'stoneWall' && currentKey === 'woodWall') {
          const building = BUILDINGS['stoneWall'];
          if (canAfford(building)) {
            payCost(building);
            floor[y][x] = 'stoneWall';
            history.push({ x, y, prev: 'woodWall', new: 'stoneWall', floor: currentFloor });
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
    grid[last.floor][last.y][last.x] = last.prev;
    refundCost(BUILDINGS[last.new]);
    homePlaced = grid.some(f => f.some(row => row.includes('home')));
    drawGrid();
    updateResources();
  }
});

document.getElementById('clearBtn').addEventListener('click', () => {
  grid[currentFloor] = Array.from({ length: GRID_SIZE }, () => Array(GRID_SIZE).fill(''));
  history = history.filter(h => h.floor !== currentFloor);
  homePlaced = grid.some(f => f.some(row => row.includes('home')));
  drawGrid();
  updateResources();
});

populateFloors();
drawGrid();
updateResources();
updateBuildCost();
