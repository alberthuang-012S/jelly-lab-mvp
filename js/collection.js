import { SKINS } from "./config.js?v=2.15.0";

export function getCollectionProgress(save) {
  const owned = SKINS.filter((skin) => save.collection.skins.includes(skin.id)).length;
  return { owned, total: SKINS.length };
}

export function isCollected(save, skinId) {
  return save.collection.skins.includes(skinId);
}
