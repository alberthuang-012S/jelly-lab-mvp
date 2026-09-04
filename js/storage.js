import { GAME_CONFIG } from "./config.js";
import { createDefaultSave, normalizeSave, applyDailyReset } from "./state.js";

export function loadSave() {
  try {
    const raw = window.localStorage.getItem(GAME_CONFIG.saveKey);

    if (!raw) {
      return null;
    }

    const parsed = JSON.parse(raw);

    if (!parsed || typeof parsed !== "object") {
      clearSave();
      return null;
    }

    const save = normalizeSave(parsed);

    if (!save.jellyfish.name) {
      clearSave();
      return null;
    }

    const didReset = applyDailyReset(save);
    const needsMigration = parsed.version !== GAME_CONFIG.version
      || !parsed.jellyfish?.baseColor
      || !Array.isArray(parsed.jellyfish?.equippedAccessories)
      || !parsed.jellyfish?.accessoryPositions
      || Array.isArray(parsed.jellyfish?.accessoryPositions)
      || !parsed.inventory?.battleItems
      || !parsed.bossProgress
      || !parsed.rewards;

    if (didReset || needsMigration) {
      persistSave(save);
    }

    return save;
  } catch (error) {
    console.warn("無法讀取存檔，已回到初始化流程。", error);
    clearSave();
    return null;
  }
}

export function persistSave(save) {
  if (!save) {
    return;
  }

  try {
    window.localStorage.setItem(GAME_CONFIG.saveKey, JSON.stringify(save));
  } catch (error) {
    console.warn("存檔失敗：", error);
  }
}

export function clearSave() {
  try {
    window.localStorage.removeItem(GAME_CONFIG.saveKey);
  } catch (error) {
    console.warn("清除存檔失敗：", error);
  }
}

export function createAndPersistSave(name, baseColor) {
  const save = createDefaultSave(name, baseColor);
  persistSave(save);
  return save;
}
