import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const read = (file) => fs.readFileSync(path.join(root, file), "utf8");

const {
  ACCESSORY_LAYOUT_CONFIG,
  BATTLE_SHOP_ITEMS,
  GAME_CONFIG,
  JELLYFISH_COLORS,
  SKINS
} = await import("../js/config.js?v=2.18.1");
const state = await import("../js/state.js?v=2.18.1");
const inventory = await import("../js/inventory.js?v=2.18.1");
const battle = await import("../js/battle.js?v=2.18.1");
const jellyfish = await import("../js/jellyfish.js?v=2.18.1");

class MemoryStorage {
  constructor() {
    this.values = new Map();
    this.failWrites = false;
  }

  getItem(key) {
    return this.values.has(key) ? this.values.get(key) : null;
  }

  setItem(key, value) {
    if (this.failWrites) throw new Error("simulated write failure");
    this.values.set(key, String(value));
  }

  removeItem(key) {
    this.values.delete(key);
  }

  clear() {
    this.values.clear();
  }
}

const storage = new MemoryStorage();
globalThis.CustomEvent = class CustomEvent {
  constructor(type, init = {}) {
    this.type = type;
    this.detail = init.detail;
  }
};
globalThis.window = {
  localStorage: storage,
  __jellyLabSaveNotices: [],
  dispatchEvent() {}
};
const saveStorage = await import("../js/storage.js?v=2.18.1");

function resetStorage() {
  storage.clear();
  window.__jellyLabSaveNotices = [];
}

function goalActionFor(save, date) {
  state.applyDailyReset(save, date);
  return state.getDailyCompanionGoal(save).action;
}

function completeGoalForDate(save, date) {
  const action = goalActionFor(save, date);
  if (action === "pet") {
    assert.equal(state.petJellyfish(save).ok, true);
  } else {
    assert.equal(state.chatWithJellyfish(save).ok, true);
  }
  return state.completeDailyCompanion(save, action, date);
}

// Save: normal write, one backup, corrupted primary recovery, write failure and migration.
resetStorage();
const save = state.createDefaultSave("回訪測試");
assert.equal(saveStorage.persistSave(save), true);
const firstRaw = storage.getItem(GAME_CONFIG.saveKey);
save.player.points -= 123;
assert.equal(saveStorage.persistSave(save), true);
assert.equal(storage.getItem(GAME_CONFIG.backupSaveKey), firstRaw);
storage.setItem(GAME_CONFIG.saveKey, "{corrupted-json");
const recovered = saveStorage.loadSave();
assert.equal(recovered.jellyfish.name, "回訪測試");
assert.equal(storage.getItem(GAME_CONFIG.corruptedSaveKey), "{corrupted-json");
assert.ok(window.__jellyLabSaveNotices.some((notice) => notice.eventName === "save-recovery"));

storage.failWrites = true;
assert.equal(saveStorage.persistSave(recovered), false);
assert.ok(window.__jellyLabSaveNotices.some((notice) => notice.eventName === "save-failure"));
storage.failWrites = false;

resetStorage();
const oldSave = state.createDefaultSave("舊版玩家");
oldSave.version = 6;
delete oldSave.weekly;
delete oldSave.daily.companionGoalDate;
delete oldSave.daily.companionGoalId;
delete oldSave.daily.companionCompleted;
delete oldSave.daily.companionRewardClaimed;
storage.setItem(GAME_CONFIG.saveKey, JSON.stringify(oldSave));
const migrated = saveStorage.loadSave();
assert.equal(migrated.version, GAME_CONFIG.version);
assert.ok(migrated.weekly && migrated.daily.companionGoalId);

// Feed: LV9 works, LV10 refuses without consuming food.
const feedSave = state.createDefaultSave("餵食測試");
feedSave.jellyfish.level = 9;
state.addFood(feedSave, "food_candy", 1);
const feedResult = inventory.feedFood(feedSave, { id: "food_candy" });
assert.equal(feedResult.ok, true);
feedSave.jellyfish.level = GAME_CONFIG.maxLevel;
state.addFood(feedSave, "food_candy", 1);
const maxFoodBefore = state.getFoodQuantity(feedSave, "food_candy");
const maxFeedResult = inventory.feedFood(feedSave, { id: "food_candy" });
assert.equal(maxFeedResult.ok, false);
assert.equal(state.getFoodQuantity(feedSave, "food_candy"), maxFoodBefore);

// Daily idempotency and weekly accumulation across four non-consecutive dates.
const companionSave = state.createDefaultSave("陪伴測試");
const dailyDate = new Date("2026-09-07T12:00:00");
const dailyResult = completeGoalForDate(companionSave, dailyDate);
assert.equal(dailyResult.completed, true);
const pointsAfterDaily = companionSave.player.points;
const duplicateDaily = state.completeDailyCompanion(companionSave, dailyResult.goal.action, dailyDate);
assert.equal(duplicateDaily.alreadyCompleted, true);
assert.equal(companionSave.player.points, pointsAfterDaily);
const reloadSave = state.createDefaultSave("重新載入測試");
const reloadDate = new Date(`${state.getToday()}T12:00:00`);
const reloadResult = completeGoalForDate(reloadSave, reloadDate);
resetStorage();
assert.equal(saveStorage.persistSave(reloadSave), true);
const reloaded = saveStorage.loadSave();
const reloadDuplicate = state.completeDailyCompanion(reloaded, reloadResult.goal.action, reloadDate);
assert.equal(reloadDuplicate.alreadyCompleted, true);
assert.equal(reloaded.player.points, reloadSave.player.points);
const weeklyDates = ["2026-09-08", "2026-09-10", "2026-09-12"];
for (const dateText of weeklyDates) {
  completeGoalForDate(companionSave, new Date(`${dateText}T12:00:00`));
}
assert.equal(companionSave.weekly.completedDates.length, 4);
assert.equal(companionSave.weekly.rewardClaimed, true);
const weeklyPoints = companionSave.player.points;
state.applyDailyReset(companionSave, new Date("2026-09-12T18:00:00"));
assert.equal(companionSave.player.points, weeklyPoints);
state.applyDailyReset(companionSave, new Date("2026-09-14T12:00:00"));
assert.equal(companionSave.weekly.weekKey, "2026-09-14");
assert.deepEqual(companionSave.weekly.completedDates, []);
assert.equal(companionSave.weekly.rewardClaimed, false);

// Battle: one weapon per player action and local reward idempotency.
const battleSave = state.createDefaultSave("戰鬥測試");
const weapon = BATTLE_SHOP_ITEMS.find((item) => item.type === "weapon");
state.addBattleItem(battleSave, weapon, 2);
const battleState = battle.createBattleState();
const overLimit = battle.beginPlayerAction(battleState, battleSave, weapon.id, 2, () => 0.1);
assert.equal(overLimit.ok, false);
assert.equal(battleState.boss.hp, battleState.boss.maxHp);
const oneWeapon = battle.beginPlayerAction(battleState, battleSave, weapon.id, 1, () => 0.1);
assert.equal(oneWeapon.ok, true);
assert.equal(battleState.phase, "boss");
assert.ok(battle.getBossAttackPreview(battleState));
assert.equal(battle.resolveBossTurn(battleState, battleSave, () => 0.1).ok, true);
battleSave.bossProgress.agingMonster.defeated = true;
const firstReward = battle.claimBossReward(battleSave);
assert.equal(firstReward.ok, true);
assert.equal(battle.claimBossReward(battleSave).ok, false);

// Accessory layout: legacy coordinates remain valid and the editor accepts the full stage.
const accessorySave = state.createDefaultSave("配件範圍測試");
state.setAccessoryPosition(accessorySave, "accessory_crown", { x: 100, y: 0, rotation: 0, scale: 1 });
assert.deepEqual(state.getAccessoryPosition(accessorySave, "accessory_crown"), { x: 100, y: 0, rotation: 0, scale: 1 });
state.setAccessoryPosition(accessorySave, "accessory_crown", { x: -10, y: 120, rotation: 0, scale: 1 });
assert.deepEqual(state.getAccessoryPosition(accessorySave, "accessory_crown"), { x: 0, y: 100, rotation: 0, scale: 1 });

// Asset existence and actual WebP signatures.
const activeAssets = [
  ...JELLYFISH_COLORS.map((color) => `assets/jellyfish-3d/jelly-normal-${color.id}.webp`),
  ...SKINS.filter((skin) => skin.id !== "normal").map((skin) => `assets/jellyfish-3d/jelly-${skin.id}.webp`)
];
for (const asset of activeAssets) assert.equal(fs.existsSync(path.join(root, asset)), true, asset);
for (const skin of SKINS) {
  const fallbackPath = String(skin.asset || `./assets/jellyfish/jelly-${skin.id}.png`).replace(/^\.\//, "");
  assert.equal(fs.existsSync(path.join(root, fallbackPath)), true, `${skin.id} PNG fallback`);
}
assert.match(jellyfish.renderJellyfish(state.createDefaultSave("素材回退測試")), /data-fallback-src=/);
const allWebp = fs.readdirSync(path.join(root, "assets/jellyfish-3d")).filter((file) => file.endsWith(".webp"));
for (const file of allWebp) {
  const bytes = fs.readFileSync(path.join(root, "assets/jellyfish-3d", file));
  assert.equal(bytes.subarray(0, 4).toString("ascii"), "RIFF", `${file} RIFF signature`);
  assert.equal(bytes.subarray(8, 12).toString("ascii"), "WEBP", `${file} WEBP signature`);
}

assert.equal(ACCESSORY_LAYOUT_CONFIG.minX, 0);
assert.equal(ACCESSORY_LAYOUT_CONFIG.maxX, 100);
assert.equal(ACCESSORY_LAYOUT_CONFIG.minY, 0);
assert.equal(ACCESSORY_LAYOUT_CONFIG.maxY, 100);
assert.match(read("index.html"), /V2\.18\.1/);
assert.match(read("js/config.js"), /productVersion: "2\.18\.1"/);
assert.match(read("js/ui.js"), /accessory-transform-toolbar/);
assert.doesNotMatch(read("js/jellyfish.js"), /accessory-floating-toolbar/);
for (const match of read("index.html").matchAll(/(?:href|src)="(\.\/[^"?]+)(?:\?[^\"]+)?"/g)) {
  assert.equal(fs.existsSync(path.join(root, match[1])), true, `index reference ${match[1]}`);
}
console.log("Jelly Lab V2.18.1 regression PASS");
