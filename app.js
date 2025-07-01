// simplified upgrade-based version without grid
const RESOURCE_TYPES = { WOOD: 'wood', STONE: 'stone', METAL: 'metal' };

const LOCATIONS = {
  forest: {
    cost: 1,
    getReward() {
      const roll = Math.floor(Math.random() * 6) + 1;
      if (roll <= 4) return { resource: RESOURCE_TYPES.WOOD, amount: 1 };
      if (roll <= 5) return { resource: RESOURCE_TYPES.STONE, amount: 1 };
      return { resource: RESOURCE_TYPES.METAL, amount: 1 };
    }
  },
  quarry: {
    cost: 2,
    getReward() {
      const roll = Math.floor(Math.random() * 6) + 1;
      if (roll <= 2) return { resource: RESOURCE_TYPES.WOOD, amount: 1 };
      if (roll <= 5) return { resource: RESOURCE_TYPES.STONE, amount: 2 };
      return { resource: RESOURCE_TYPES.METAL, amount: 1 };
    }
  },
  mine: {
    cost: 3,
    getReward() {
      const roll = Math.floor(Math.random() * 6) + 1;
      if (roll <= 3) return { resource: RESOURCE_TYPES.STONE, amount: 1 };
      if (roll <= 5) return { resource: RESOURCE_TYPES.METAL, amount: 1 };
      return { resource: RESOURCE_TYPES.METAL, amount: 2 };
    }
  }
};

const XP_PER_LEVEL = 5;
const EXPLORES_PER_DAY = 5;

let eventLog = load('eventLog') || [];
let season = load('season') || 0; // 0 spring, 1 summer, 2 autumn, 3 winter
let dailyChallenge = load('dailyChallenge') || { completed: false, locations: {} };
let inventory = load('inventory') || { luckyCharm: false };

const HOME_UPGRADES = [
  { name: 'Camp', emoji: '🏕️', nextCost: { [RESOURCE_TYPES.WOOD]: 5 } },
  { name: 'House', emoji: '🏠', nextCost: { [RESOURCE_TYPES.WOOD]: 10, [RESOURCE_TYPES.STONE]: 5 } },
  { name: 'Hall', emoji: '🏡', nextCost: { [RESOURCE_TYPES.STONE]: 20, [RESOURCE_TYPES.METAL]: 5 } },
  { name: 'Fortress', emoji: '🏰', nextCost: null }
];

const WALL_UPGRADES = [
  { name: 'None', emoji: '', nextCost: { [RESOURCE_TYPES.WOOD]: 5 } },
  { name: 'Earthen', emoji: '🟫', nextCost: { [RESOURCE_TYPES.WOOD]: 10 } },
  { name: 'Wood', emoji: '🪵', nextCost: { [RESOURCE_TYPES.STONE]: 20 } },
  { name: 'Stone', emoji: '🧱', nextCost: null }
];

const FARM_UPGRADES = [
  { name: 'Basic', emoji: '🌾', nextCost: { [RESOURCE_TYPES.WOOD]: 2 } },
  { name: 'Improved', emoji: '🌾', nextCost: { [RESOURCE_TYPES.WOOD]: 5, [RESOURCE_TYPES.STONE]: 2 } },
  { name: 'Advanced', emoji: '🌾', nextCost: { [RESOURCE_TYPES.WOOD]: 10, [RESOURCE_TYPES.STONE]: 5, [RESOURCE_TYPES.METAL]: 2 } },
  { name: 'Master', emoji: '🌾', nextCost: null }
];

const QUARRY_UPGRADES = [
  { name: 'Basic', emoji: '⛏️', nextCost: { [RESOURCE_TYPES.WOOD]: 2 } },
  { name: 'Improved', emoji: '⛏️', nextCost: { [RESOURCE_TYPES.WOOD]: 5, [RESOURCE_TYPES.STONE]: 2 } },
  { name: 'Advanced', emoji: '⛏️', nextCost: { [RESOURCE_TYPES.WOOD]: 10, [RESOURCE_TYPES.STONE]: 5, [RESOURCE_TYPES.METAL]: 2 } },
  { name: 'Master', emoji: '⛏️', nextCost: null }
];

const BUILD_FARM_COST = { [RESOURCE_TYPES.WOOD]: 1, [RESOURCE_TYPES.STONE]: 1 };
const BUILD_QUARRY_COST = { [RESOURCE_TYPES.WOOD]: 1, [RESOURCE_TYPES.STONE]: 2 };

let resources = load('resources') || { wood: 0, stone: 0, metal: 0 };
let structures = load('structures') || {
  homeLevel: 0,
  wallLevel: 0,
  farmLevel: 0,
  farmCount: 0,
  quarryLevel: 0,
  quarryCount: 0
};
let player = load('player') || { level: 1, xp: 0, explores: EXPLORES_PER_DAY };
if (player.stamina !== undefined && player.explores === undefined) {
  player.explores = player.stamina;
}
if (player.explores === undefined) {
  player.explores = EXPLORES_PER_DAY;
}
let questProgress = load('questProgress') || { totalBuildings: 0 };
let completedQuests = load('completedQuests') || [];

function save() {
  localStorage.setItem('resources', JSON.stringify(resources));
  localStorage.setItem('structures', JSON.stringify(structures));
  localStorage.setItem('player', JSON.stringify(player));
  localStorage.setItem('questProgress', JSON.stringify(questProgress));
  localStorage.setItem('completedQuests', JSON.stringify(completedQuests));
  localStorage.setItem('eventLog', JSON.stringify(eventLog));
  localStorage.setItem('season', JSON.stringify(season));
  localStorage.setItem('dailyChallenge', JSON.stringify(dailyChallenge));
  localStorage.setItem('inventory', JSON.stringify(inventory));
}
function load(key) {
  const data = localStorage.getItem(key);
  return data ? JSON.parse(data) : null;
}
function narrate(text) {
  document.getElementById('narration').textContent = text;
  eventLog.unshift(text);
  if (eventLog.length > 5) eventLog.pop();
  const logEl = document.getElementById('log');
  if (logEl) logEl.textContent = eventLog.join('\n');
}
function costToString(cost) {
  return Object.entries(cost).map(([k,v])=>`${v} ${k}`).join(', ');
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
  if (!completedQuests.includes('lucky')) {
    quests.push('Craft a Lucky Charm');
  }
  const locNames = Object.keys(dailyChallenge.locations);
  quests.push(`Daily: explore all locations (${locNames.length}/3)`);
  questsEl.textContent = quests.length ? 'Quests:\n' + quests.join('\n') : 'All quests completed!';
}
function updateResources() {
  document.getElementById('resources').textContent =
    `Wood: ${resources.wood} | Stone: ${resources.stone} | Metal: ${resources.metal} | Level: ${player.level} | Explores Left: ${player.explores}/${EXPLORES_PER_DAY} | Season: ${['Spring','Summer','Autumn','Winter'][season]}`;
  updateUI();
  updateQuests();
  save();
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
  if (!completedQuests.includes('lucky') && inventory.luckyCharm) {
    completedQuests.push('lucky');
    resources.stone += 2;
    narrate('Quest complete! You crafted a Lucky Charm and gained 2 stone.');
  }
}
function canAfford(cost) {
  return Object.entries(cost).every(([r,n]) => resources[r] >= n);
}
function payCost(cost) {
  Object.entries(cost).forEach(([r,n]) => resources[r] -= n);
}

function sleep() {
  const roll = Math.floor(Math.random() * 6) + 1;
  let msg = 'After a long day you rest. ';
  if (roll <= 2) {
    const keys = Object.keys(resources).filter(k => resources[k] > 0);
    if (keys.length) {
      const loss = keys[Math.floor(Math.random()*keys.length)];
      resources[loss]--;
      msg += `Thieves stole 1 ${loss} during the night.`;
    } else {
      msg += 'Restless dreams disturb your sleep.';
    }
  } else if (roll <= 4) {
    msg += 'Nothing of note happens overnight.';
  } else {
    const gain = Object.values(RESOURCE_TYPES)[Math.floor(Math.random()*3)];
    resources[gain]++;
    msg += `You wake refreshed and find 1 ${gain} nearby.`;
  }
  const farmYield = structures.farmCount * (structures.farmLevel + 1);
  const quarryYield = structures.quarryCount * (structures.quarryLevel + 1);
  const seasonEffect = season === 0 ? 1 : season === 3 ? -1 : 0;
  let farmTotal = farmYield + seasonEffect * structures.farmCount;
  farmTotal = Math.max(0, farmTotal);
  if (farmYield || quarryYield) {
    resources.wood += farmTotal;
    resources.stone += quarryYield;
    msg += ` Your farms produced ${farmTotal} wood and quarries yielded ${quarryYield} stone.`;
  }
  if (dailyChallenge.completed) {
    resources.metal += 1;
    msg += ' Daily challenge complete! You gained 1 metal.';
  }
  season = (season + 1) % 4;
  dailyChallenge = { completed: false, locations: {} };
  player.explores = EXPLORES_PER_DAY;
  narrate(msg);
  updateResources();
}

const locationSelect = document.getElementById('locationSelect');

document.getElementById('exploreBtn').addEventListener('click', () => {
  const loc = LOCATIONS[locationSelect.value];
  if (player.explores <= 0) {
    sleep();
    return;
  }
  player.explores--;
  const roll = Math.floor(Math.random() * 20) + 1;
  let reward = loc.getReward();
  let msg = `You rolled a ${roll} while exploring the ${locationSelect.value}.`;
  if (roll === 1) {
    reward = null;
    msg += ' Complete failure! You found nothing.';
  } else if (roll <= 8) {
    reward.amount = Math.max(1, Math.floor(reward.amount / 2));
    resources[reward.resource] += reward.amount;
    msg += ` Some success. You found ${reward.amount} ${reward.resource}.`;
  } else if (roll <= 14) {
    reward.amount = Math.ceil(reward.amount * 1.5);
    resources[reward.resource] += reward.amount;
    msg += ` Moderate success. You found ${reward.amount} ${reward.resource}.`;
  } else if (roll < 20) {
    reward.amount *= 2;
    resources[reward.resource] += reward.amount;
    msg += ` High success! You found ${reward.amount} ${reward.resource}.`;
  } else {
    reward.amount *= 3;
    resources[reward.resource] += reward.amount;
    msg += ` Natural 20! You found ${reward.amount} ${reward.resource}!`;
  }
  const eventRoll = Math.random();
  const failChance = 0.05 + player.level * 0.01;
  if (eventRoll < 0.05) {
    const gain = Object.values(RESOURCE_TYPES)[Math.floor(Math.random()*3)];
    resources[gain]++;
    msg += ` A friendly trader gifted you 1 ${gain}!`;
  } else if (eventRoll < failChance) {
    const keys = Object.keys(resources).filter(k => resources[k] > 0);
    if (keys.length) {
      const lossKey = keys[Math.floor(Math.random()*keys.length)];
      resources[lossKey]--;
      msg += ` Bandits stole 1 ${lossKey}!`;
    }
  }
  player.xp++;
  if (player.xp >= player.level * XP_PER_LEVEL) {
    player.level++;
    player.xp = 0;
    msg += ` Level up! You are now level ${player.level}.`;
    checkQuests();
  }
  dailyChallenge.locations[locationSelect.value] = true;
  if (Object.keys(dailyChallenge.locations).length === 3) {
    dailyChallenge.completed = true;
  }
  if (inventory.luckyCharm && reward) {
    resources[reward.resource] += 1;
    msg += ' Your Lucky Charm granted 1 extra ' + reward.resource + '!';
  }
  narrate(msg);
  updateResources();
  if (player.explores <= 0) {
    sleep();
  }
});

function tryUpgrade(struct, upgrades, levelProp) {
  const nextCost = upgrades[structures[levelProp]].nextCost;
  if (!nextCost) return;
  if (canAfford(nextCost)) {
    payCost(nextCost);
    structures[levelProp]++;
    questProgress.totalBuildings++;
    narrate(`Upgraded ${struct} to ${upgrades[structures[levelProp]].name}!`);
    checkQuests();
    updateResources();
  }
}
function tryBuild(type, cost, countProp) {
  if (structures[countProp] >= structures.homeLevel + 1) {
    narrate('You need a larger home to build more.');
    return;
  }
  if (canAfford(cost)) {
    payCost(cost);
    structures[countProp]++;
    questProgress.totalBuildings++;
    narrate(`Built a new ${type}!`);
    checkQuests();
    updateResources();
  }
}

const homeLevelSpan = document.getElementById('homeLevel');
const wallsLevelSpan = document.getElementById('wallsLevel');
const farmLevelSpan = document.getElementById('farmLevel');
const quarryLevelSpan = document.getElementById('quarryLevel');
const farmCountSpan = document.getElementById('farmCount');
const quarryCountSpan = document.getElementById('quarryCount');
const upgradeHomeBtn = document.getElementById('upgradeHomeBtn');
const upgradeWallsBtn = document.getElementById('upgradeWallsBtn');
const buildFarmBtn = document.getElementById('buildFarmBtn');
const upgradeFarmBtn = document.getElementById('upgradeFarmBtn');
const buildQuarryBtn = document.getElementById('buildQuarryBtn');
const upgradeQuarryBtn = document.getElementById('upgradeQuarryBtn');
const craftCharmBtn = document.getElementById('craftCharmBtn');
const textBiggerBtn = document.getElementById('textBigger');
const textSmallerBtn = document.getElementById('textSmaller');
const exploreScreen = document.getElementById('exploreScreen');
const buildScreen = document.getElementById('buildScreen');
const logScreen = document.getElementById('logScreen');
const navExplore = document.getElementById('navExplore');
const navBuild = document.getElementById('navBuild');
const navLog = document.getElementById('navLog');

function updateUI() {
  homeLevelSpan.textContent = `${HOME_UPGRADES[structures.homeLevel].name} ${HOME_UPGRADES[structures.homeLevel].emoji}`;
  const hc = HOME_UPGRADES[structures.homeLevel].nextCost;
  upgradeHomeBtn.textContent = hc ? `Upgrade (Cost: ${costToString(hc)})` : 'Max Level';
  upgradeHomeBtn.disabled = !hc || !canAfford(hc);

  wallsLevelSpan.textContent = `${WALL_UPGRADES[structures.wallLevel].name} ${WALL_UPGRADES[structures.wallLevel].emoji}`;
  const wc = WALL_UPGRADES[structures.wallLevel].nextCost;
  upgradeWallsBtn.textContent = wc ? `Upgrade (Cost: ${costToString(wc)})` : 'Max Level';
  upgradeWallsBtn.disabled = !wc || !canAfford(wc);

  farmLevelSpan.textContent = structures.farmLevel + 1;
  farmCountSpan.textContent = structures.farmCount;
  const fc = FARM_UPGRADES[structures.farmLevel].nextCost;
  upgradeFarmBtn.textContent = fc ? `Upgrade Farms (Cost: ${costToString(fc)})` : 'Farms Max';
  upgradeFarmBtn.disabled = !fc || !canAfford(fc);
  buildFarmBtn.textContent = `Build Farm (Cost: ${costToString(BUILD_FARM_COST)})`;
  buildFarmBtn.disabled = structures.farmCount >= structures.homeLevel + 1 || !canAfford(BUILD_FARM_COST);

  quarryLevelSpan.textContent = structures.quarryLevel + 1;
  quarryCountSpan.textContent = structures.quarryCount;
  const qc = QUARRY_UPGRADES[structures.quarryLevel].nextCost;
  upgradeQuarryBtn.textContent = qc ? `Upgrade Quarries (Cost: ${costToString(qc)})` : 'Quarries Max';
  upgradeQuarryBtn.disabled = !qc || !canAfford(qc);
  buildQuarryBtn.textContent = `Build Quarry (Cost: ${costToString(BUILD_QUARRY_COST)})`;
  buildQuarryBtn.disabled = structures.quarryCount >= structures.homeLevel + 1 || !canAfford(BUILD_QUARRY_COST);

  craftCharmBtn.disabled = inventory.luckyCharm || !canAfford({ [RESOURCE_TYPES.WOOD]: 2 });
}

upgradeHomeBtn.addEventListener('click', () => tryUpgrade('home', HOME_UPGRADES, 'homeLevel'));
upgradeWallsBtn.addEventListener('click', () => tryUpgrade('walls', WALL_UPGRADES, 'wallLevel'));
buildFarmBtn.addEventListener('click', () => tryBuild('farm', BUILD_FARM_COST, 'farmCount'));
upgradeFarmBtn.addEventListener('click', () => tryUpgrade('farms', FARM_UPGRADES, 'farmLevel'));
buildQuarryBtn.addEventListener('click', () => tryBuild('quarry', BUILD_QUARRY_COST, 'quarryCount'));
upgradeQuarryBtn.addEventListener('click', () => tryUpgrade('quarries', QUARRY_UPGRADES, 'quarryLevel'));
craftCharmBtn.addEventListener('click', () => {
  const cost = { [RESOURCE_TYPES.WOOD]: 2 };
  if (!inventory.luckyCharm && canAfford(cost)) {
    payCost(cost);
    inventory.luckyCharm = true;
    narrate('You crafted a Lucky Charm!');
    checkQuests();
    updateResources();
  }
});
textBiggerBtn.addEventListener('click', () => {
  const size = parseInt(getComputedStyle(document.body).fontSize);
  document.body.style.fontSize = (size + 2) + 'px';
});
textSmallerBtn.addEventListener('click', () => {
  const size = parseInt(getComputedStyle(document.body).fontSize);
  document.body.style.fontSize = Math.max(12, size - 2) + 'px';
});

function showScreen(screen) {
  exploreScreen.style.display = screen === 'explore' ? 'block' : 'none';
  buildScreen.style.display = screen === 'build' ? 'block' : 'none';
  logScreen.style.display = screen === 'log' ? 'block' : 'none';
}

navExplore.addEventListener('click', () => showScreen('explore'));
navBuild.addEventListener('click', () => showScreen('build'));
navLog.addEventListener('click', () => showScreen('log'));

showScreen('explore');

updateResources();
