import { ACCESSORIES, BATTLE_SHOP_ITEMS, FOODS, SCENES, SKINS } from "./config.js?v=2.16.1";
import { consumeFood, getBattleItemQuantity, getFoodQuantity } from "./state.js?v=2.16.1";

export function getInventoryItems(save, category) {
  if (category === "food") {
    return FOODS.filter((food) => getFoodQuantity(save, food.id) > 0);
  }

  if (category === "skin") {
    return SKINS.filter((skin) => save.inventory.skins.includes(skin.id));
  }

  if (category === "accessory") {
    return ACCESSORIES.filter((accessory) => save.inventory.accessories.includes(accessory.id));
  }

  if (category === "scene") {
    return SCENES.filter((scene) => save.inventory.scenes.includes(scene.id));
  }

  if (category === "battle") {
    return BATTLE_SHOP_ITEMS;
  }

  return [];
}

export function getRewardItems(save) {
  return Array.isArray(save.rewards?.coupons) ? save.rewards.coupons : [];
}

export function getBattleInventorySummary(save) {
  return BATTLE_SHOP_ITEMS.map((item) => ({
    ...item,
    quantity: getBattleItemQuantity(save, item)
  }));
}

export function feedFood(save, food, quantity = 1) {
  const amount = Number.isFinite(Number(quantity)) ? Math.floor(Number(quantity)) : 0;

  if (!food || amount < 1) {
    return { ok: false, reason: "請選擇要餵食的食物。" };
  }

  const available = getFoodQuantity(save, food.id);
  if (available < amount) {
    return { ok: false, reason: amount === 1 ? "這份食物已經吃完了。" : "食物庫存不足，請調整餵食數量。" };
  }

  // 先確認整批庫存足夠，再逐份扣除，避免批量餵食只完成一半。
  for (let index = 0; index < amount; index += 1) {
    consumeFood(save, food.id);
  }

  return { ok: true, food, quantity: amount };
}
