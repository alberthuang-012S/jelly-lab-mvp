import { ACCESSORIES, BATTLE_SHOP_ITEMS, FOODS, QUANTITY_CONFIG, SCENES, SKINS } from "./config.js?v=2.15.0";
import { addBattleItem, addFood, getEquippedAccessories, spendPoints } from "./state.js?v=2.15.0";

export function getShopItems(category) {
  if (category === "food") {
    return FOODS;
  }

  if (category === "skin") {
    return SKINS.filter((item) => item.id !== "normal");
  }

  if (category === "accessory") {
    return ACCESSORIES;
  }

  if (category === "scene") {
    return SCENES.filter((item) => item.id !== "default");
  }

  if (category === "battle") {
    return BATTLE_SHOP_ITEMS;
  }

  return FOODS;
}

export function getItemCollectionKey(item) {
  if (item.type === "food") return "foods";
  if (["weapon", "recovery", "ointment"].includes(item.type)) return "battleItems";
  if (item.type === "skin") return "skins";
  if (item.type === "accessory") return "accessories";
  return "scenes";
}

export function isOwned(save, item) {
  if (item.type === "food" || ["weapon", "recovery", "ointment"].includes(item.type)) {
    return false;
  }

  return save.inventory[getItemCollectionKey(item)].includes(item.id);
}

export function isRepeatableItem(item) {
  return item?.type === "food" || ["weapon", "recovery", "ointment"].includes(item?.type);
}

export function isEquipped(save, item) {
  if (item.type === "skin") return save.jellyfish.equippedSkin === item.id;
  if (item.type === "accessory") return getEquippedAccessories(save).includes(item.id);
  if (item.type === "scene") return save.jellyfish.equippedScene === item.id;
  return false;
}

export function getItemStatus(save, item) {
  const requiredLevel = item.requiredLevel || 1;

  if (save.jellyfish.level < requiredLevel) {
    return { kind: "locked", label: `🔒 LV${requiredLevel} 解鎖` };
  }

  if (isOwned(save, item)) {
    const equipped = isEquipped(save, item);
    return { kind: equipped ? "equipped" : "owned", label: equipped ? item.type === "accessory" ? "✓ 已裝備" : "✓ 使用中" : "已擁有" };
  }

  if (save.player.points < item.price) {
    return { kind: "insufficient", label: `還差 ${item.price - save.player.points} 點` };
  }

  return { kind: "available", label: "購買" };
}

export function purchaseItem(save, item, quantity = QUANTITY_CONFIG.default) {
  if (!item) {
    return { ok: false, reason: "找不到這項商品。" };
  }

  const amount = Number.isFinite(Number(quantity)) ? Math.floor(Number(quantity)) : 0;

  if (amount < QUANTITY_CONFIG.min || amount > QUANTITY_CONFIG.max) {
    return { ok: false, reason: `一次最多只能購買 ${QUANTITY_CONFIG.max} 個。` };
  }

  if (!isRepeatableItem(item) && amount !== 1) {
    return { ok: false, reason: "這項商品只能一次購買 1 個。" };
  }

  const requiredLevel = item.requiredLevel || 1;

  if (save.jellyfish.level < requiredLevel) {
    return { ok: false, reason: `需要達到 LV${requiredLevel} 才能購買。` };
  }

  if (isOwned(save, item)) {
    return { ok: false, reason: "這項商品已經在你的收藏裡了。" };
  }

  const totalPrice = item.price * amount;

  if (!spendPoints(save, totalPrice)) {
    return { ok: false, reason: `養成點數不足，還差 ${totalPrice - save.player.points} 點。` };
  }

  if (item.type === "food") {
    addFood(save, item.id, amount);
  } else if (["weapon", "recovery", "ointment"].includes(item.type)) {
    addBattleItem(save, item, amount);
  } else {
    const key = getItemCollectionKey(item);
    save.inventory[key].push(item.id);

    if (item.type === "skin" && !save.collection.skins.includes(item.id)) {
      save.collection.skins.push(item.id);
    }
  }

  return { ok: true, item, quantity: amount, totalPrice };
}
