import {
  BATTLE_CONFIG,
  BATTLE_SHOP_ITEMS,
  QUANTITY_CONFIG,
  REWARDS_CONFIG
} from "./config.js?v=2.15.1";
import {
  consumeBattleItem,
  getBattleItemQuantity
} from "./state.js?v=2.15.1";

const WEAPON_TYPES = new Set(["weapon"]);
const BATTLE_ITEM_TYPES = new Set(["weapon", "recovery", "ointment"]);

function safeRandom(randomFn) {
  const value = Number(randomFn?.());
  return Number.isFinite(value) ? Math.min(0.999999, Math.max(0, value)) : Math.random();
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, Math.floor(Number(value) || 0)));
}

function randomInteger(min, max, randomFn) {
  return Math.floor(safeRandom(randomFn) * (max - min + 1)) + min;
}

function playerName(save) {
  return save?.jellyfish?.name || "水母夥伴";
}

function getBossConfig(bossId = "agingMonster") {
  return BATTLE_CONFIG.boss[bossId] || BATTLE_CONFIG.boss.agingMonster;
}

function getBattleItem(itemId) {
  return BATTLE_SHOP_ITEMS.find((item) => item.id === itemId || item.storageKey === itemId) || null;
}

function integerQuantity(value) {
  const number = Number(value);
  return Number.isFinite(number) ? Math.floor(number) : 0;
}

export function getBattleActionQuantityLimits(battle, save, itemOrId) {
  const item = typeof itemOrId === "string" ? getBattleItem(itemOrId) : itemOrId;
  const available = item && save ? getBattleItemQuantity(save, item) : 0;

  if (!battle || !save || !item || available <= 0) {
    return { min: 0, max: 0, available };
  }

  if (item.type === "weapon") {
    return {
      min: 1,
      max: Math.min(QUANTITY_CONFIG.max, available),
      available
    };
  }

  if (item.type === "recovery") {
    const missingHp = Math.max(0, battle.player.maxHp - battle.player.hp);
    const requiredForHp = Math.ceil(missingHp / Math.max(1, item.heal || 1));
    const requiredQuantity = requiredForHp > 0 ? requiredForHp : battle.player.status.blurred ? 1 : 0;

    return {
      min: requiredQuantity > 0 ? 1 : 0,
      max: Math.min(QUANTITY_CONFIG.max, available, requiredQuantity),
      available
    };
  }

  if (item.type === "ointment") {
    return {
      min: battle.player.status.itchy ? 1 : 0,
      max: battle.player.status.itchy ? Math.min(1, available) : 0,
      available
    };
  }

  return { min: 0, max: 0, available };
}

function addEvent(events, eventName, payload = {}) {
  events.push({ eventName, payload });
}

export function appendBattleLog(battle, message) {
  if (!battle || !message) return;

  battle.log = [...(Array.isArray(battle.log) ? battle.log : []), message].slice(-BATTLE_CONFIG.logLimit);
}

export function createBattleState(bossId = "agingMonster") {
  const boss = getBossConfig(bossId);

  return {
    bossId,
    boss: {
      id: boss.id,
      name: boss.name,
      icon: boss.icon,
      maxHp: boss.maxHp,
      hp: boss.maxHp
    },
    player: {
      maxHp: BATTLE_CONFIG.playerMaxHp,
      hp: BATTLE_CONFIG.playerMaxHp,
      status: {
        itchy: false,
        blurred: false
      }
    },
    turn: 1,
    phase: "player",
    actionLocked: false,
    log: ["戰鬥開始！", `${boss.name}出現了。`],
    lastAnimation: "",
    lastEffect: null,
    outcomeRecorded: false
  };
}

function failAction(battle, reason) {
  if (battle) battle.actionLocked = false;
  return { ok: false, reason, events: [] };
}

function isMissed(battle, randomFn) {
  return battle.player.status.blurred && safeRandom(randomFn) < BATTLE_CONFIG.statuses.blurredMissChance;
}

function applyBossDamage(battle, amount) {
  const damage = Math.max(0, Math.floor(Number(amount) || 0));
  battle.boss.hp = clamp(battle.boss.hp - damage, 0, battle.boss.maxHp);
  return damage;
}

function applyPlayerDamage(battle, amount) {
  const damage = Math.max(0, Math.floor(Number(amount) || 0));
  battle.player.hp = clamp(battle.player.hp - damage, 0, battle.player.maxHp);
  return damage;
}

function resolvePlayerAfterAction(battle, save, events) {
  const name = playerName(save);

  if (battle.boss.hp <= 0) {
    battle.boss.hp = 0;
    battle.phase = "won";
    battle.actionLocked = false;
    battle.lastAnimation = "boss-defeated";
    battle.lastEffect = { target: "boss", type: "damage", amount: 0 };
    appendBattleLog(battle, `${battle.boss.name}被擊敗了！`);
    return;
  }

  if (battle.player.status.itchy) {
    const damage = applyPlayerDamage(battle, BATTLE_CONFIG.statuses.itchyDamage);
    battle.lastEffect = { target: "player", type: "damage", amount: damage };
    appendBattleLog(battle, `好癢！${name}因為搔癢受到 ${damage} 點傷害。`);
    battle.lastAnimation = "player-itchy";

    if (battle.player.hp <= 0) {
      battle.phase = "lost";
      battle.actionLocked = false;
      appendBattleLog(battle, `${name}沒有力氣了……`);
      return;
    }
  }

  battle.phase = "boss";
  battle.lastAnimation = "boss-turn";
}

export function beginPlayerAction(battle, save, actionId, quantityOrRandom = 1, randomFn = Math.random) {
  let quantity = quantityOrRandom;

  if (typeof quantityOrRandom === "function") {
    randomFn = quantityOrRandom;
    quantity = 1;
  }

  quantity = integerQuantity(quantity);

  if (!battle || !save || battle.phase !== "player" || battle.actionLocked) {
    return failAction(battle, "現在還不能行動。" );
  }

  if (battle.player.hp <= 0 || battle.boss.hp <= 0) {
    return failAction(battle, "這場戰鬥已經結束了。" );
  }

  const basicAttack = BATTLE_CONFIG.basicAttack;
  const item = getBattleItem(actionId);
  const isBasicAttack = actionId === "basic" || actionId === basicAttack.id;
  const isBattleItem = item && BATTLE_ITEM_TYPES.has(item.type);

  if (!isBasicAttack && !isBattleItem) {
    return failAction(battle, "找不到這個戰鬥行動。" );
  }

  if (isBasicAttack) {
    quantity = 1;
  } else {
    const limits = getBattleActionQuantityLimits(battle, save, item);

    if (limits.max <= 0) {
      return failAction(battle, item.type === "recovery" ? "目前沒有可回復的 HP 或視野模糊狀態。" : "目前沒有可解除的癢狀態或庫存。" );
    }

    if (quantity < limits.min || quantity > limits.max) {
      return failAction(battle, `這次最多只能使用 ${limits.max} 個${item.name}。`);
    }
  }

  battle.actionLocked = true;
  const events = [];
  const name = playerName(save);

  if (isBasicAttack || WEAPON_TYPES.has(item?.type)) {
    const attack = isBasicAttack ? basicAttack : item;
    const damage = attack.damage * quantity;
    const missed = isMissed(battle, randomFn);

    if (!isBasicAttack) {
      if (!consumeBattleItem(save, item, quantity)) {
        return failAction(battle, `${item.name}目前沒有足夠庫存。`);
      }
      addEvent(events, "battle_item_used", { itemId: item.id, itemName: item.name, quantity });
    }

    appendBattleLog(battle, quantity > 1 ? `${name}一次使用了 ${attack.name} ×${quantity}！` : `${name}使用${attack.name}！`);

    if (missed) {
      appendBattleLog(battle, quantity > 1 ? `視野太模糊了，${attack.name} ×${quantity} 全部落空！` : "視野太模糊了！攻擊落空！");
      battle.lastAnimation = "player-miss";
      battle.lastEffect = { target: "boss", type: "miss", amount: 0 };
      addEvent(events, "player_attack", { actionId: attack.id, quantity, damage: 0, missed: true });
    } else {
      const dealt = applyBossDamage(battle, damage);
      appendBattleLog(battle, `${battle.boss.name}受到 ${dealt} 點傷害。`);
      battle.lastAnimation = isBasicAttack ? "player-bump" : "capsule-fly";
      battle.lastEffect = { target: "boss", type: "damage", amount: dealt };
      addEvent(events, "player_attack", { actionId: attack.id, quantity, damage: dealt, missed: false });
    }
  } else if (item.type === "recovery") {
    if (!consumeBattleItem(save, item, quantity)) {
      return failAction(battle, `${item.name}目前沒有足夠庫存。`);
    }
    const wasBlurred = battle.player.status.blurred;
    const beforeHp = battle.player.hp;
    battle.player.hp = clamp(battle.player.hp + item.heal * quantity, 0, battle.player.maxHp);
    const healed = battle.player.hp - beforeHp;
    battle.player.status.blurred = false;
    appendBattleLog(battle, `${name}喝下 ${item.name}${quantity > 1 ? ` ×${quantity}` : ""}！`);
    appendBattleLog(battle, `HP +${healed}！`);
    if (wasBlurred) {
      appendBattleLog(battle, "視線恢復正常了！");
      addEvent(events, "status_cured", { status: "blurred", itemId: item.id });
    }
    addEvent(events, "battle_item_used", { itemId: item.id, itemName: item.name, quantity, healed });
    battle.lastAnimation = "player-heal";
    battle.lastEffect = { target: "player", type: "heal", amount: healed };
  } else if (item.type === "ointment") {
    if (!consumeBattleItem(save, item, quantity)) {
      return failAction(battle, `${item.name}目前沒有足夠庫存。`);
    }
    battle.player.status.itchy = false;
    appendBattleLog(battle, `使用 ${item.name}，搔癢舒緩了！`);
    addEvent(events, "battle_item_used", { itemId: item.id, itemName: item.name, quantity });
    addEvent(events, "status_cured", { status: "itchy", itemId: item.id, quantity });
    battle.lastAnimation = "player-cure";
    battle.lastEffect = { target: "player", type: "cure", amount: 0 };
  }

  resolvePlayerAfterAction(battle, save, events);
  return { ok: true, events, phase: battle.phase };
}

function chooseBossAttack(boss, randomFn) {
  const roll = safeRandom(randomFn);
  let cursor = 0;

  for (const attack of boss.attacks) {
    cursor += attack.chance;
    if (roll < cursor) {
      return attack;
    }
  }

  return boss.attacks[boss.attacks.length - 1];
}

export function resolveBossTurn(battle, save, randomFn = Math.random) {
  if (!battle || !save || battle.phase !== "boss") {
    return { ok: false, reason: "現在不是老化怪獸的回合。", events: [] };
  }

  battle.actionLocked = true;
  const events = [];
  const attack = chooseBossAttack(getBossConfig(battle.bossId), randomFn);
  const name = playerName(save);

  appendBattleLog(battle, `${battle.boss.name}使用${attack.name}！`);

  let damage = attack.damage || 0;
  if (attack.minDamage !== undefined) {
    damage = randomInteger(attack.minDamage, attack.maxDamage, randomFn);
  }

  const received = applyPlayerDamage(battle, damage);
  battle.lastEffect = { target: "player", type: "damage", amount: received };
  if (received > 0) {
    appendBattleLog(battle, `${name}受到 ${received} 點傷害。`);
  }

  if (attack.status === "itchy") {
    const wasItchy = battle.player.status.itchy;
    battle.player.status.itchy = true;
    appendBattleLog(battle, wasItchy ? "癢狀態還在持續。" : `${name}進入「癢」狀態。`);
    addEvent(events, "status_itchy", { alreadyActive: wasItchy });
  }

  if (attack.status === "blurred") {
    const wasBlurred = battle.player.status.blurred;
    battle.player.status.blurred = true;
    appendBattleLog(battle, wasBlurred ? "視野模糊仍未散去。" : `${name}進入「視野模糊」狀態。`);
    addEvent(events, "status_blurred", { alreadyActive: wasBlurred });
  }

  addEvent(events, "boss_attack", {
    attackId: attack.id,
    attackName: attack.name,
    damage: received,
    status: attack.status || null
  });

  if (battle.player.hp <= 0) {
    battle.phase = "lost";
    battle.actionLocked = false;
    battle.lastAnimation = "player-hit";
    appendBattleLog(battle, `${name}沒有力氣了……`);
  } else {
    battle.phase = "player";
    battle.turn += 1;
    battle.actionLocked = false;
    battle.lastAnimation = "player-hit";
  }

  return { ok: true, events, attack, phase: battle.phase };
}

export function debugDamageBoss(battle, amount = 50) {
  if (!battle || battle.actionLocked || ["won", "lost"].includes(battle.phase)) {
    return false;
  }

  const damage = applyBossDamage(battle, amount);
  battle.lastEffect = { target: "boss", type: "damage", amount: damage };
  appendBattleLog(battle, `Debug：${battle.boss.name}受到 ${damage} 點傷害。`);

  if (battle.boss.hp <= 0) {
    battle.phase = "won";
    battle.actionLocked = false;
    appendBattleLog(battle, `${battle.boss.name}被擊敗了！`);
  }

  return true;
}

export function debugDamagePlayer(battle, save, amount = 20) {
  if (!battle || !save || battle.actionLocked || ["won", "lost"].includes(battle.phase)) {
    return false;
  }

  const damage = applyPlayerDamage(battle, amount);
  battle.lastEffect = { target: "player", type: "damage", amount: damage };
  appendBattleLog(battle, `Debug：${playerName(save)}受到 ${damage} 點傷害。`);

  if (battle.player.hp <= 0) {
    battle.phase = "lost";
    appendBattleLog(battle, `${playerName(save)}沒有力氣了……`);
  }

  return true;
}

export function debugApplyStatus(battle, save, status) {
  if (!battle || !save || battle.actionLocked || ["won", "lost"].includes(battle.phase) || !["itchy", "blurred"].includes(status)) {
    return false;
  }

  battle.player.status[status] = true;
  const label = status === "itchy" ? "癢" : "視野模糊";
  appendBattleLog(battle, `Debug：${playerName(save)}進入「${label}」狀態。`);
  return true;
}

export function debugClearStatus(battle, save) {
  if (!battle || !save || battle.actionLocked || ["won", "lost"].includes(battle.phase)) {
    return false;
  }

  battle.player.status.itchy = false;
  battle.player.status.blurred = false;
  appendBattleLog(battle, `Debug：${playerName(save)}的異常狀態已清除。`);
  return true;
}

export function recordBossVictory(save, battle) {
  if (!save?.bossProgress?.agingMonster || !battle || battle.phase !== "won") {
    return { ok: false, firstClear: false };
  }

  const progress = save.bossProgress.agingMonster;
  const firstClear = !progress.defeated;

  if (!battle.outcomeRecorded) {
    progress.defeated = true;
    progress.clearCount += 1;
    battle.outcomeRecorded = true;
  }

  return {
    ok: true,
    firstClear,
    rewardClaimed: progress.rewardClaimed === true || save.rewards.coupons.some((coupon) => coupon.id === REWARDS_CONFIG.agingMonsterCoupon.id)
  };
}

export function recordBossFailure(battle) {
  if (!battle || battle.phase !== "lost") {
    return false;
  }

  battle.outcomeRecorded = true;
  return true;
}

export function claimBossReward(save) {
  if (!save?.bossProgress?.agingMonster || !save.rewards) {
    return { ok: false, reason: "目前沒有可領取的獎勵。" };
  }

  const progress = save.bossProgress.agingMonster;
  const reward = REWARDS_CONFIG.agingMonsterCoupon;
  const alreadyHasCoupon = save.rewards.coupons.some((coupon) => coupon.id === reward.id);

  if (progress.rewardClaimed || alreadyHasCoupon) {
    progress.rewardClaimed = true;
    return { ok: false, alreadyClaimed: true, reason: "本 BOSS 首次通關獎勵已領取。" };
  }

  if (!progress.defeated) {
    return { ok: false, reason: "先擊敗老化怪獸，才能領取獎勵。" };
  }

  save.rewards.coupons.push({
    ...reward,
    claimed: true,
    claimedAt: new Date().toISOString()
  });
  progress.rewardClaimed = true;
  return { ok: true, reward };
}

export function resetBossReward(save) {
  if (!save?.bossProgress?.agingMonster || !save.rewards) {
    return false;
  }

  save.bossProgress.agingMonster = {
    defeated: false,
    clearCount: 0,
    rewardClaimed: false
  };
  save.rewards.coupons = save.rewards.coupons.filter((coupon) => coupon.id !== REWARDS_CONFIG.agingMonsterCoupon.id);
  return true;
}

export function getBossForDisplay(bossId = "agingMonster") {
  return getBossConfig(bossId);
}

export function getBattleItemForDisplay(itemId) {
  return getBattleItem(itemId);
}
