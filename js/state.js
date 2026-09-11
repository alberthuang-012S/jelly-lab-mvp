import {
  ACCESSORIES,
  ACCESSORY_LAYOUT_CONFIG,
  BATTLE_SHOP_ITEMS,
  COMPANION_GOALS,
  EVOLUTION_STAGES,
  FOODS,
  GAME_CONFIG,
  JELLYFISH_COLORS,
  LEVEL_CONFIG,
  REWARDS_CONFIG,
  SCENES,
  SKINS
} from "./config.js?v=2.18.2";

function integerOr(value, fallback = 0) {
  const number = Number(value);
  return Number.isFinite(number) ? Math.floor(number) : fallback;
}

function nonNegativeInteger(value, fallback = 0) {
  return Math.max(0, integerOr(value, fallback));
}

function uniqueKnownIds(values, knownItems) {
  const knownIds = new Set(knownItems.map((item) => item.id));
  return [...new Set(Array.isArray(values) ? values.filter((id) => knownIds.has(id)) : [])];
}

function clampAccessoryValue(value, minimum, maximum, fallback) {
  const number = Number(value);
  const safeValue = Number.isFinite(number) ? number : fallback;
  return Math.min(maximum, Math.max(minimum, safeValue));
}

function roundAccessoryValue(value, precision = 2) {
  const factor = 10 ** precision;
  return Math.round(value * factor) / factor;
}

function getDefaultAccessoryPosition(accessory) {
  return {
    x: clampAccessoryValue(accessory?.defaultPosition?.x, ACCESSORY_LAYOUT_CONFIG.minX, ACCESSORY_LAYOUT_CONFIG.maxX, ACCESSORY_LAYOUT_CONFIG.defaultPosition.x),
    y: clampAccessoryValue(accessory?.defaultPosition?.y, ACCESSORY_LAYOUT_CONFIG.minY, ACCESSORY_LAYOUT_CONFIG.maxY, ACCESSORY_LAYOUT_CONFIG.defaultPosition.y),
    rotation: clampAccessoryValue(accessory?.defaultPosition?.rotation, ACCESSORY_LAYOUT_CONFIG.minRotation, ACCESSORY_LAYOUT_CONFIG.maxRotation, ACCESSORY_LAYOUT_CONFIG.defaultPosition.rotation),
    scale: clampAccessoryValue(accessory?.defaultPosition?.scale, ACCESSORY_LAYOUT_CONFIG.minScale, ACCESSORY_LAYOUT_CONFIG.maxScale, ACCESSORY_LAYOUT_CONFIG.defaultPosition.scale)
  };
}

function createDefaultAccessoryPositions() {
  return Object.fromEntries(ACCESSORIES.map((accessory) => [accessory.id, getDefaultAccessoryPosition(accessory)]));
}

function normalizeAccessoryPositions(sourcePositions) {
  const values = sourcePositions && typeof sourcePositions === "object" && !Array.isArray(sourcePositions) ? sourcePositions : {};

  return Object.fromEntries(ACCESSORIES.map((accessory) => {
    const fallback = getDefaultAccessoryPosition(accessory);
    const source = values[accessory.id];
    return [accessory.id, {
      x: clampAccessoryValue(source?.x, ACCESSORY_LAYOUT_CONFIG.minX, ACCESSORY_LAYOUT_CONFIG.maxX, fallback.x),
      y: clampAccessoryValue(source?.y, ACCESSORY_LAYOUT_CONFIG.minY, ACCESSORY_LAYOUT_CONFIG.maxY, fallback.y),
      rotation: clampAccessoryValue(source?.rotation, ACCESSORY_LAYOUT_CONFIG.minRotation, ACCESSORY_LAYOUT_CONFIG.maxRotation, fallback.rotation),
      scale: clampAccessoryValue(source?.scale, ACCESSORY_LAYOUT_CONFIG.minScale, ACCESSORY_LAYOUT_CONFIG.maxScale, fallback.scale)
    }];
  }));
}

function normalizeEquippedAccessories(values, ownedAccessoryIds) {
  const ownedIds = new Set(ownedAccessoryIds);

  return uniqueKnownIds(values, ACCESSORIES).filter((accessoryId) => {
    return ownedIds.has(accessoryId);
  });
}

function battleStorageKey(itemOrId) {
  const item = typeof itemOrId === "string" ? BATTLE_SHOP_ITEMS.find((candidate) => candidate.id === itemOrId || candidate.storageKey === itemOrId) : itemOrId;
  return item?.storageKey || item?.id || String(itemOrId);
}

function createBattleItemInventory(source = {}) {
  const values = source && typeof source === "object" && !Array.isArray(source) ? source : {};

  return Object.fromEntries(BATTLE_SHOP_ITEMS.map((item) => {
    const key = battleStorageKey(item);
    const rawQuantity = values[key] ?? values[item.id];
    return [key, nonNegativeInteger(rawQuantity)];
  }));
}

function normalizeBaseColor(colorId) {
  return JELLYFISH_COLORS.some((color) => color.id === colorId) ? colorId : GAME_CONFIG.initialBaseColor;
}

function normalizeCoupons(sourceCoupons) {
  if (!Array.isArray(sourceCoupons)) {
    return [];
  }

  const coupons = [];
  sourceCoupons.forEach((coupon) => {
    if (!coupon || typeof coupon !== "object" || typeof coupon.id !== "string" || !coupon.id.trim()) {
      return;
    }

    if (coupons.some((existing) => existing.id === coupon.id)) {
      return;
    }

    coupons.push({
      id: coupon.id,
      name: typeof coupon.name === "string" ? coupon.name : "虛擬折價券",
      type: "coupon",
      value: nonNegativeInteger(coupon.value),
      icon: typeof coupon.icon === "string" ? coupon.icon : "🎫",
      claimed: coupon.claimed !== false,
      description: typeof coupon.description === "string" ? coupon.description : "虛擬優惠獎勵。",
      claimedAt: typeof coupon.claimedAt === "string" ? coupon.claimedAt : null
    });
  });

  return coupons;
}

export function getToday(now = new Date()) {
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function getWeekKey(now = new Date()) {
  const date = new Date(now);
  date.setHours(0, 0, 0, 0);
  const day = date.getDay();
  const daysFromMonday = (day + 6) % 7;
  date.setDate(date.getDate() - daysFromMonday);
  return getToday(date);
}

function getCompanionGoalForDate(date = getToday()) {
  const dateText = String(date);
  const seed = [...dateText].reduce((sum, character) => sum + character.charCodeAt(0), 0);
  return COMPANION_GOALS[seed % COMPANION_GOALS.length] || COMPANION_GOALS[0];
}

function isCompanionActionCompleted(save, action) {
  if (action === "pet") return save.daily.petCount > 0;
  if (action === "chat") return save.daily.chatCount > 0;
  return false;
}

function resetDailyCompanion(save, today) {
  const goal = getCompanionGoalForDate(today);
  save.daily.companionGoalDate = today;
  save.daily.companionGoalId = goal.id;
  save.daily.companionCompleted = false;
  save.daily.companionRewardClaimed = false;
}

function resetWeeklyCompanion(save, weekKey) {
  save.weekly.weekKey = weekKey;
  save.weekly.completedDates = [];
  save.weekly.rewardClaimed = false;
}

function markCompanionComplete(save, today) {
  if (!save?.daily || save.daily.companionCompleted) {
    return { completed: false, alreadyCompleted: true, dailyRewardPoints: 0, weeklyRewardPoints: 0 };
  }

  const goal = COMPANION_GOALS.find((candidate) => candidate.id === save.daily.companionGoalId) || COMPANION_GOALS[0];
  if (!isCompanionActionCompleted(save, goal.action)) {
    return { completed: false, alreadyCompleted: false, dailyRewardPoints: 0, weeklyRewardPoints: 0 };
  }

  save.daily.companionCompleted = true;
  let dailyRewardPoints = 0;
  if (!save.daily.companionRewardClaimed) {
    dailyRewardPoints = GAME_CONFIG.dailyCompanionRewardPoints;
    addPoints(save, dailyRewardPoints);
    save.daily.companionRewardClaimed = true;
  }

  if (!Array.isArray(save.weekly.completedDates)) {
    save.weekly.completedDates = [];
  }
  if (!save.weekly.completedDates.includes(today)) {
    save.weekly.completedDates.push(today);
  }

  let weeklyRewardPoints = 0;
  if (save.weekly.completedDates.length >= GAME_CONFIG.weeklyCompanionTargetDays && !save.weekly.rewardClaimed) {
    weeklyRewardPoints = GAME_CONFIG.weeklyCompanionRewardPoints;
    addPoints(save, weeklyRewardPoints);
    save.weekly.rewardClaimed = true;
  }

  return {
    completed: true,
    alreadyCompleted: false,
    goal,
    dailyRewardPoints,
    weeklyRewardPoints,
    weeklyProgress: Math.min(GAME_CONFIG.weeklyCompanionTargetDays, save.weekly.completedDates.length),
    weeklyCompleted: save.weekly.rewardClaimed
  };
}

export function getExpRequired(level) {
  if (level >= GAME_CONFIG.maxLevel) {
    return 0;
  }

  return LEVEL_CONFIG.baseExp + (level - 1) * LEVEL_CONFIG.expStep;
}

export function createDefaultSave(name, baseColor = GAME_CONFIG.initialBaseColor) {
  const today = getToday();

  return {
    version: GAME_CONFIG.version,
    player: {
      points: GAME_CONFIG.startingPoints,
      createdAt: new Date().toISOString(),
      lastLoginDate: today
    },
    jellyfish: {
      name,
      baseColor: normalizeBaseColor(baseColor),
      level: 1,
      exp: 0,
      intimacy: 0,
      equippedSkin: GAME_CONFIG.initialSkin,
      equippedAccessories: [],
      accessoryPositions: createDefaultAccessoryPositions(),
      equippedScene: GAME_CONFIG.initialScene
    },
    daily: {
      date: today,
      intimacyEarned: 0,
      petCount: 0,
      chatCount: 0,
      companionGoalDate: today,
      companionGoalId: getCompanionGoalForDate(today).id,
      companionCompleted: false,
      companionRewardClaimed: false
    },
    weekly: {
      weekKey: getWeekKey(),
      completedDates: [],
      rewardClaimed: false
    },
    inventory: {
      foods: {},
      skins: [GAME_CONFIG.initialSkin],
      accessories: [],
      scenes: [GAME_CONFIG.initialScene],
      battleItems: createBattleItemInventory()
    },
    collection: {
      skins: [GAME_CONFIG.initialSkin]
    },
    bossProgress: {
      agingMonster: {
        defeated: false,
        clearCount: 0,
        rewardClaimed: false
      }
    },
    rewards: {
      coupons: []
    }
  };
}

export function normalizeSave(raw) {
  const source = raw && typeof raw === "object" ? raw : {};
  const sourcePlayer = source.player && typeof source.player === "object" ? source.player : {};
  const sourceJellyfish = source.jellyfish && typeof source.jellyfish === "object" ? source.jellyfish : {};
  const sourceDaily = source.daily && typeof source.daily === "object" ? source.daily : {};
  const sourceWeekly = source.weekly && typeof source.weekly === "object" ? source.weekly : {};
  const sourceInventory = source.inventory && typeof source.inventory === "object" ? source.inventory : {};
  const sourceCollection = source.collection && typeof source.collection === "object" ? source.collection : {};
  const sourceBossProgress = source.bossProgress && typeof source.bossProgress === "object" ? source.bossProgress : {};
  const sourceAgingMonster = sourceBossProgress.agingMonster && typeof sourceBossProgress.agingMonster === "object" ? sourceBossProgress.agingMonster : {};
  const sourceRewards = source.rewards && typeof source.rewards === "object" ? source.rewards : {};

  const skinIds = uniqueKnownIds(sourceInventory.skins, SKINS);
  const collectionSkins = uniqueKnownIds(sourceCollection.skins, SKINS);
  const accessories = uniqueKnownIds(sourceInventory.accessories, ACCESSORIES);
  const scenes = uniqueKnownIds(sourceInventory.scenes, SCENES);
  const foods = {};

  if (sourceInventory.foods && typeof sourceInventory.foods === "object" && !Array.isArray(sourceInventory.foods)) {
    FOODS.forEach((food) => {
      const quantity = nonNegativeInteger(sourceInventory.foods[food.id]);
      if (quantity > 0) {
        foods[food.id] = quantity;
      }
    });
  }

  if (Array.isArray(sourceInventory.items)) {
    sourceInventory.items.forEach((itemId) => {
      if (FOODS.some((food) => food.id === itemId)) {
        foods[itemId] = (foods[itemId] || 0) + 1;
      }
    });
  }

  if (!skinIds.includes(GAME_CONFIG.initialSkin)) {
    skinIds.unshift(GAME_CONFIG.initialSkin);
  }

  if (!collectionSkins.includes(GAME_CONFIG.initialSkin)) {
    collectionSkins.unshift(GAME_CONFIG.initialSkin);
  }

  const coupons = normalizeCoupons(sourceRewards.coupons);
  const defaultCoupon = REWARDS_CONFIG.agingMonsterCoupon;
  const hasAgingMonsterCoupon = coupons.some((coupon) => coupon.id === defaultCoupon.id);

  const level = Math.min(GAME_CONFIG.maxLevel, Math.max(1, nonNegativeInteger(sourceJellyfish.level, 1)));
  const name = typeof sourceJellyfish.name === "string" ? sourceJellyfish.name.trim() : "";
  const baseColor = normalizeBaseColor(sourceJellyfish.baseColor);
  const equippedSkin = skinIds.includes(sourceJellyfish.equippedSkin) ? sourceJellyfish.equippedSkin : GAME_CONFIG.initialSkin;
  const sourceEquippedAccessories = Array.isArray(sourceJellyfish.equippedAccessories)
    ? sourceJellyfish.equippedAccessories
    : sourceJellyfish.equippedAccessory ? [sourceJellyfish.equippedAccessory] : [];
  const equippedAccessories = normalizeEquippedAccessories(sourceEquippedAccessories, accessories);
  const accessoryPositions = normalizeAccessoryPositions(sourceJellyfish.accessoryPositions);
  const equippedScene = scenes.includes(sourceJellyfish.equippedScene) ? sourceJellyfish.equippedScene : GAME_CONFIG.initialScene;
  const normalizedDailyDate = typeof sourceDaily.date === "string" ? sourceDaily.date : getToday();
  const companionGoal = COMPANION_GOALS.some((goal) => goal.id === sourceDaily.companionGoalId)
    ? sourceDaily.companionGoalId
    : getCompanionGoalForDate(normalizedDailyDate).id;
  const weeklyDates = Array.isArray(sourceWeekly.completedDates)
    ? [...new Set(sourceWeekly.completedDates.filter((date) => /^\d{4}-\d{2}-\d{2}$/.test(String(date))).map(String))]
    : [];

  return {
    version: GAME_CONFIG.version,
    player: {
      points: nonNegativeInteger(sourcePlayer.points, GAME_CONFIG.startingPoints),
      createdAt: typeof sourcePlayer.createdAt === "string" ? sourcePlayer.createdAt : new Date().toISOString(),
      lastLoginDate: typeof sourcePlayer.lastLoginDate === "string" ? sourcePlayer.lastLoginDate : getToday()
    },
    jellyfish: {
      name,
      baseColor,
      level,
      exp: level >= GAME_CONFIG.maxLevel ? 0 : nonNegativeInteger(sourceJellyfish.exp),
      intimacy: nonNegativeInteger(sourceJellyfish.intimacy),
      equippedSkin,
      equippedAccessories,
      accessoryPositions,
      equippedScene
    },
    daily: {
      date: normalizedDailyDate,
      intimacyEarned: Math.min(GAME_CONFIG.dailyIntimacyLimit, nonNegativeInteger(sourceDaily.intimacyEarned)),
      petCount: Math.min(GAME_CONFIG.petDailyLimit, nonNegativeInteger(sourceDaily.petCount)),
      chatCount: Math.min(GAME_CONFIG.chatDailyLimit, nonNegativeInteger(sourceDaily.chatCount)),
      companionGoalDate: typeof sourceDaily.companionGoalDate === "string" ? sourceDaily.companionGoalDate : normalizedDailyDate,
      companionGoalId: companionGoal,
      companionCompleted: sourceDaily.companionCompleted === true,
      companionRewardClaimed: sourceDaily.companionRewardClaimed === true
    },
    weekly: {
      weekKey: typeof sourceWeekly.weekKey === "string" ? sourceWeekly.weekKey : getWeekKey(),
      completedDates: weeklyDates,
      rewardClaimed: sourceWeekly.rewardClaimed === true
    },
    inventory: {
      foods,
      skins: skinIds,
      accessories,
      scenes: scenes.includes(GAME_CONFIG.initialScene) ? scenes : [GAME_CONFIG.initialScene, ...scenes],
      battleItems: createBattleItemInventory(sourceInventory.battleItems)
    },
    collection: {
      skins: [...new Set([...collectionSkins, ...skinIds])]
    },
    bossProgress: {
      agingMonster: {
        defeated: sourceAgingMonster.defeated === true,
        clearCount: nonNegativeInteger(sourceAgingMonster.clearCount),
        rewardClaimed: sourceAgingMonster.rewardClaimed === true || hasAgingMonsterCoupon
      }
    },
    rewards: {
      coupons
    }
  };
}

export function applyDailyReset(save, now = new Date()) {
  const today = getToday(now);
  const weekKey = getWeekKey(now);
  let didReset = false;

  if (save.daily.date !== today) {
    save.daily.date = today;
    save.daily.intimacyEarned = 0;
    save.daily.petCount = 0;
    save.daily.chatCount = 0;
    resetDailyCompanion(save, today);
    didReset = true;
  } else if (save.daily.companionGoalDate !== today || !COMPANION_GOALS.some((goal) => goal.id === save.daily.companionGoalId)) {
    resetDailyCompanion(save, today);
    didReset = true;
  }

  if (save.player.lastLoginDate !== today) {
    save.player.lastLoginDate = today;
    didReset = true;
  }

  if (!save.weekly || typeof save.weekly !== "object") {
    save.weekly = { weekKey, completedDates: [], rewardClaimed: false };
    didReset = true;
  } else if (save.weekly.weekKey !== weekKey) {
    resetWeeklyCompanion(save, weekKey);
    didReset = true;
  }

  const companionResult = markCompanionComplete(save, today);
  if (companionResult.completed) {
    didReset = true;
  }

  return didReset;
}

export function getDailyCompanionGoal(save) {
  const goalId = save?.daily?.companionGoalId;
  return COMPANION_GOALS.find((goal) => goal.id === goalId) || getCompanionGoalForDate(save?.daily?.date || getToday());
}

export function getWeeklyCompanionProgress(save) {
  const completedDates = Array.isArray(save?.weekly?.completedDates) ? save.weekly.completedDates : [];
  const completedDays = new Set(completedDates).size;
  return {
    completedDays: Math.min(GAME_CONFIG.weeklyCompanionTargetDays, completedDays),
    targetDays: GAME_CONFIG.weeklyCompanionTargetDays,
    completed: save?.weekly?.rewardClaimed === true || completedDays >= GAME_CONFIG.weeklyCompanionTargetDays,
    rewardClaimed: save?.weekly?.rewardClaimed === true
  };
}

export function completeDailyCompanion(save, action, now = new Date()) {
  if (!save) {
    return { completed: false, alreadyCompleted: false, dailyRewardPoints: 0, weeklyRewardPoints: 0 };
  }

  const wasCompleted = save.daily?.companionCompleted === true;
  const hadWeeklyReward = save.weekly?.rewardClaimed === true;
  applyDailyReset(save, now);
  const goal = getDailyCompanionGoal(save);
  if (goal.action !== action) {
    return { completed: false, alreadyCompleted: save.daily.companionCompleted, goal, dailyRewardPoints: 0, weeklyRewardPoints: 0 };
  }

  const today = getToday(now);
  if (!wasCompleted && save.daily.companionCompleted) {
    return {
      completed: true,
      alreadyCompleted: false,
      goal,
      dailyRewardPoints: save.daily.companionRewardClaimed ? GAME_CONFIG.dailyCompanionRewardPoints : 0,
      weeklyRewardPoints: !hadWeeklyReward && save.weekly.rewardClaimed ? GAME_CONFIG.weeklyCompanionRewardPoints : 0,
      weeklyProgress: getWeeklyCompanionProgress(save).completedDays,
      weeklyCompleted: save.weekly.rewardClaimed
    };
  }
  const result = markCompanionComplete(save, today);
  return { ...result, goal };
}

export function forceNextDay(save) {
  save.daily.date = "2000-01-01";
  applyDailyReset(save);
  return save;
}

export function getCurrentStage(save) {
  const { level, intimacy } = save.jellyfish;
  return EVOLUTION_STAGES.reduce((current, stage) => {
    if (level >= stage.level && intimacy >= stage.intimacy) {
      return stage;
    }
    return current;
  }, EVOLUTION_STAGES[0]);
}

export function getNextStage(save) {
  const currentStage = getCurrentStage(save);
  return EVOLUTION_STAGES.find((stage) => stage.stage === currentStage.stage + 1) || null;
}

export function getStageProgress(save) {
  const nextStage = getNextStage(save);

  if (!nextStage) {
    return { nextStage: null, levelRatio: 1, intimacyRatio: 1 };
  }

  const levelRatio = Math.min(1, save.jellyfish.level / nextStage.level);
  const intimacyRatio = Math.min(1, save.jellyfish.intimacy / nextStage.intimacy);

  return { nextStage, levelRatio, intimacyRatio };
}

export function addPoints(save, amount) {
  const safeAmount = nonNegativeInteger(amount);
  save.player.points = nonNegativeInteger(save.player.points) + safeAmount;
  return safeAmount;
}

export function spendPoints(save, amount) {
  const price = nonNegativeInteger(amount);

  if (save.player.points < price) {
    return false;
  }

  save.player.points -= price;
  return true;
}

export function addIntimacy(save, amount, options = {}) {
  const safeAmount = nonNegativeInteger(amount);

  if (options.ignoreDailyLimit) {
    save.jellyfish.intimacy += safeAmount;
    return safeAmount;
  }

  const remaining = Math.max(0, GAME_CONFIG.dailyIntimacyLimit - save.daily.intimacyEarned);
  const granted = Math.min(safeAmount, remaining);
  save.jellyfish.intimacy += granted;
  save.daily.intimacyEarned += granted;
  return granted;
}

export function petJellyfish(save) {
  if (save.daily.petCount >= GAME_CONFIG.petDailyLimit) {
    return { ok: false, reason: "今天已經被摸得很開心了！" };
  }

  if (save.daily.intimacyEarned >= GAME_CONFIG.dailyIntimacyLimit) {
    return { ok: false, reason: "今天的親密互動額度已用完，明天再來吧！" };
  }

  save.daily.petCount += 1;
  const gained = addIntimacy(save, GAME_CONFIG.petIntimacyGain);
  return { ok: gained > 0, gained };
}

export function chatWithJellyfish(save) {
  if (save.daily.chatCount >= GAME_CONFIG.chatDailyLimit) {
    return { ok: false, reason: "今天已經聊得很開心了，明天再來找我吧！" };
  }

  if (save.daily.intimacyEarned >= GAME_CONFIG.dailyIntimacyLimit) {
    return { ok: false, reason: "今天的親密互動額度已用完，明天再來吧！" };
  }

  save.daily.chatCount += 1;
  const gained = addIntimacy(save, GAME_CONFIG.chatIntimacyGain);
  return { ok: gained > 0, gained };
}

export function addExp(save, amount) {
  let remainingExp = nonNegativeInteger(amount);
  const levelUps = [];

  if (save.jellyfish.level >= GAME_CONFIG.maxLevel) {
    save.jellyfish.level = GAME_CONFIG.maxLevel;
    save.jellyfish.exp = 0;
    return levelUps;
  }

  save.jellyfish.exp += remainingExp;

  while (save.jellyfish.level < GAME_CONFIG.maxLevel) {
    const required = getExpRequired(save.jellyfish.level);

    if (save.jellyfish.exp < required) {
      break;
    }

    save.jellyfish.exp -= required;
    const fromLevel = save.jellyfish.level;
    save.jellyfish.level += 1;
    levelUps.push({ from: fromLevel, to: save.jellyfish.level });
  }

  if (save.jellyfish.level >= GAME_CONFIG.maxLevel) {
    save.jellyfish.level = GAME_CONFIG.maxLevel;
    save.jellyfish.exp = 0;
  }

  return levelUps;
}

export function getFoodQuantity(save, foodId) {
  return nonNegativeInteger(save.inventory.foods[foodId]);
}

export function addFood(save, foodId, quantity = 1) {
  const amount = nonNegativeInteger(quantity);
  save.inventory.foods[foodId] = getFoodQuantity(save, foodId) + amount;
  return amount;
}

export function consumeFood(save, foodId) {
  const current = getFoodQuantity(save, foodId);

  if (current <= 0) {
    return false;
  }

  if (current === 1) {
    delete save.inventory.foods[foodId];
  } else {
    save.inventory.foods[foodId] = current - 1;
  }

  return true;
}

export function getBattleItemQuantity(save, itemOrId) {
  const key = battleStorageKey(itemOrId);
  return nonNegativeInteger(save.inventory.battleItems?.[key]);
}

export function addBattleItem(save, itemOrId, quantity = 1) {
  const key = battleStorageKey(itemOrId);
  const amount = nonNegativeInteger(quantity);
  save.inventory.battleItems = save.inventory.battleItems || {};
  save.inventory.battleItems[key] = getBattleItemQuantity(save, itemOrId) + amount;
  return amount;
}

export function consumeBattleItem(save, itemOrId, quantity = 1) {
  const key = battleStorageKey(itemOrId);
  const current = getBattleItemQuantity(save, itemOrId);
  const amount = Math.max(1, nonNegativeInteger(quantity));

  if (current < amount) {
    return false;
  }

  save.inventory.battleItems = save.inventory.battleItems || {};
  save.inventory.battleItems[key] = Math.max(0, current - amount);
  return true;
}

export function equipSkin(save, skinId) {
  if (!save.inventory.skins.includes(skinId)) {
    return false;
  }

  save.jellyfish.equippedSkin = skinId;
  return true;
}

export function getEquippedAccessories(save) {
  if (Array.isArray(save?.jellyfish?.equippedAccessories)) {
    return [...save.jellyfish.equippedAccessories];
  }

  return save?.jellyfish?.equippedAccessory ? [save.jellyfish.equippedAccessory] : [];
}

export function getAccessoryPosition(save, accessoryId) {
  const accessory = ACCESSORIES.find((item) => item.id === accessoryId);
  const fallback = getDefaultAccessoryPosition(accessory);
  const savedPosition = save?.jellyfish?.accessoryPositions?.[accessoryId];

  return {
    x: clampAccessoryValue(savedPosition?.x, ACCESSORY_LAYOUT_CONFIG.minX, ACCESSORY_LAYOUT_CONFIG.maxX, fallback.x),
    y: clampAccessoryValue(savedPosition?.y, ACCESSORY_LAYOUT_CONFIG.minY, ACCESSORY_LAYOUT_CONFIG.maxY, fallback.y),
    rotation: clampAccessoryValue(savedPosition?.rotation, ACCESSORY_LAYOUT_CONFIG.minRotation, ACCESSORY_LAYOUT_CONFIG.maxRotation, fallback.rotation),
    scale: clampAccessoryValue(savedPosition?.scale, ACCESSORY_LAYOUT_CONFIG.minScale, ACCESSORY_LAYOUT_CONFIG.maxScale, fallback.scale)
  };
}

export function setAccessoryPosition(save, accessoryId, position = {}) {
  if (!ACCESSORIES.some((accessory) => accessory.id === accessoryId)) {
    return false;
  }

  save.jellyfish.accessoryPositions = save.jellyfish.accessoryPositions || createDefaultAccessoryPositions();
  const current = getAccessoryPosition(save, accessoryId);
  save.jellyfish.accessoryPositions[accessoryId] = {
    x: roundAccessoryValue(clampAccessoryValue(position.x, ACCESSORY_LAYOUT_CONFIG.minX, ACCESSORY_LAYOUT_CONFIG.maxX, current.x)),
    y: roundAccessoryValue(clampAccessoryValue(position.y, ACCESSORY_LAYOUT_CONFIG.minY, ACCESSORY_LAYOUT_CONFIG.maxY, current.y)),
    rotation: roundAccessoryValue(clampAccessoryValue(position.rotation, ACCESSORY_LAYOUT_CONFIG.minRotation, ACCESSORY_LAYOUT_CONFIG.maxRotation, current.rotation)),
    scale: roundAccessoryValue(clampAccessoryValue(position.scale, ACCESSORY_LAYOUT_CONFIG.minScale, ACCESSORY_LAYOUT_CONFIG.maxScale, current.scale))
  };
  return true;
}

export function resetAccessoryPosition(save, accessoryId) {
  const accessory = ACCESSORIES.find((item) => item.id === accessoryId);
  if (!accessory) return false;

  save.jellyfish.accessoryPositions = save.jellyfish.accessoryPositions || createDefaultAccessoryPositions();
  save.jellyfish.accessoryPositions[accessoryId] = getDefaultAccessoryPosition(accessory);
  return true;
}

export function resetAccessoryPositions(save) {
  save.jellyfish.accessoryPositions = createDefaultAccessoryPositions();
  return save.jellyfish.accessoryPositions;
}

export function equipAccessory(save, accessoryId) {
  const accessory = ACCESSORIES.find((item) => item.id === accessoryId);

  if (!accessory || !save.inventory.accessories.includes(accessoryId)) {
    return { ok: false, replacedId: null };
  }

  const equippedAccessories = getEquippedAccessories(save);

  save.jellyfish.equippedAccessories = [
    ...equippedAccessories.filter((equippedId) => equippedId !== accessoryId),
    accessoryId
  ];

  return { ok: true, replacedId: null };
}

export function unequipAccessory(save, accessoryId) {
  const equippedAccessories = getEquippedAccessories(save);

  if (!equippedAccessories.includes(accessoryId)) {
    return false;
  }

  save.jellyfish.equippedAccessories = equippedAccessories.filter((equippedId) => equippedId !== accessoryId);
  return true;
}

export function equipScene(save, sceneId) {
  if (!save.inventory.scenes.includes(sceneId)) {
    return false;
  }

  save.jellyfish.equippedScene = sceneId;
  return true;
}
