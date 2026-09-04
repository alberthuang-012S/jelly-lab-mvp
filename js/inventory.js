import { ACCESSORIES, BATTLE_SHOP_ITEMS, FOODS, SCENES, SKINS } from "./config.js?v=2.15.2";
import { consumeFood, getBattleItemQuantity, getFoodQuantity } from "./state.js?v=2.15.2";

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

export function feedFood(save, food) {
  if (!food || getFoodQuantity(save, food.id) <= 0) {
    return { ok: false, reason: "這份食物已經吃完了。" };
  }

  if (!consumeFood(save, food.id)) {
    return { ok: false, reason: "這份食物已經吃完了。" };
  }

  return { ok: true, food };
}
