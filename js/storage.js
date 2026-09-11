import { GAME_CONFIG } from "./config.js?v=2.18.2";
import { createDefaultSave, normalizeSave, applyDailyReset } from "./state.js?v=2.18.2";

function getNoticeQueue() {
  if (typeof window === "undefined") return null;
  window.__jellyLabSaveNotices = window.__jellyLabSaveNotices || [];
  return window.__jellyLabSaveNotices;
}

function notifySave(eventName, detail = {}) {
  const queue = getNoticeQueue();
  if (!queue) return;
  const event = { eventName, detail, at: new Date().toISOString() };
  queue.push(event);
  if (typeof CustomEvent === "function") {
    window.dispatchEvent?.(new CustomEvent(`jellylab:${eventName}`, { detail }));
  }
}

function isValidRawSave(raw) {
  if (typeof raw !== "string" || !raw.trim()) return false;

  try {
    const parsed = JSON.parse(raw);
    return Boolean(parsed && typeof parsed === "object" && typeof parsed.jellyfish?.name === "string" && parsed.jellyfish.name.trim());
  } catch {
    return false;
  }
}

function readStorage(key) {
  try {
    return window.localStorage.getItem(key);
  } catch (error) {
    console.warn("讀取存檔失敗：", error);
    return null;
  }
}

function writeStorage(key, value) {
  try {
    window.localStorage.setItem(key, value);
    return true;
  } catch (error) {
    console.warn("存檔失敗：", error);
    return false;
  }
}

function removeStorage(key) {
  try {
    window.localStorage.removeItem(key);
  } catch (error) {
    console.warn("清除存檔失敗：", error);
  }
}

export function loadSave() {
  const raw = readStorage(GAME_CONFIG.saveKey);

  if (!raw) {
    return null;
  }

  let parsed;
  try {
    parsed = JSON.parse(raw);
  } catch (error) {
    return recoverFromBackup(raw, error);
  }

  if (!parsed || typeof parsed !== "object" || !parsed.jellyfish?.name) {
    return recoverFromBackup(raw, new Error("存檔缺少水母名稱"));
  }

  const save = normalizeSave(parsed);
  if (!save.jellyfish.name) {
    return recoverFromBackup(raw, new Error("存檔缺少水母名稱"));
  }

  const didReset = applyDailyReset(save);
  const accessoryPositions = parsed.jellyfish?.accessoryPositions;
  const needsAccessoryTransformMigration = accessoryPositions
    && !Array.isArray(accessoryPositions)
    && Object.values(accessoryPositions).some((position) => {
      return !Number.isFinite(Number(position?.rotation)) || !Number.isFinite(Number(position?.scale));
    });
  const needsMigration = parsed.version !== GAME_CONFIG.version
    || !parsed.jellyfish?.baseColor
    || !Array.isArray(parsed.jellyfish?.equippedAccessories)
    || !parsed.jellyfish?.accessoryPositions
    || Array.isArray(parsed.jellyfish?.accessoryPositions)
    || needsAccessoryTransformMigration
    || !parsed.inventory?.battleItems
    || !parsed.bossProgress
    || !parsed.rewards
    || !parsed.daily?.companionGoalId
    || !parsed.daily?.companionGoalDate
    || typeof parsed.daily?.companionCompleted !== "boolean"
    || typeof parsed.daily?.companionRewardClaimed !== "boolean"
    || !parsed.weekly
    || !parsed.weekly?.weekKey
    || !Array.isArray(parsed.weekly?.completedDates)
    || typeof parsed.weekly?.rewardClaimed !== "boolean";

  if (didReset || needsMigration) {
    persistSave(save);
  }

  return save;
}

export function persistSave(save) {
  if (!save) {
    return false;
  }

  let serialized;
  try {
    serialized = JSON.stringify(save);
  } catch (error) {
    console.warn("存檔失敗：", error);
    notifySave("save-failure", { reason: "serialize" });
    return false;
  }

  const currentRaw = readStorage(GAME_CONFIG.saveKey);
  if (currentRaw && currentRaw !== serialized && isValidRawSave(currentRaw)) {
    if (!writeStorage(GAME_CONFIG.backupSaveKey, currentRaw)) {
      notifySave("save-failure", { reason: "backup" });
      return false;
    }
  }

  if (!writeStorage(GAME_CONFIG.saveKey, serialized)) {
    notifySave("save-failure", { reason: "primary" });
    return false;
  }

  return true;
}

export function clearSave() {
  removeStorage(GAME_CONFIG.saveKey);
  removeStorage(GAME_CONFIG.backupSaveKey);
  removeStorage(GAME_CONFIG.corruptedSaveKey);
}

export function createAndPersistSave(name, baseColor) {
  const save = createDefaultSave(name, baseColor);
  persistSave(save);
  return save;
}

function recoverFromBackup(corruptedRaw, error) {
  console.warn("無法讀取主要存檔：", error);

  if (typeof window !== "undefined") {
    writeStorage(GAME_CONFIG.corruptedSaveKey, corruptedRaw);
  }

  const backupRaw = readStorage(GAME_CONFIG.backupSaveKey);
  if (isValidRawSave(backupRaw)) {
    try {
      const recoveredSave = normalizeSave(JSON.parse(backupRaw));
      if (recoveredSave.jellyfish.name) {
        applyDailyReset(recoveredSave);
        if (persistSave(recoveredSave)) {
          notifySave("save-recovery", { source: "backup" });
          return recoveredSave;
        }
      }
    } catch (backupError) {
      console.warn("備份存檔也無法讀取：", backupError);
    }
  }

  removeStorage(GAME_CONFIG.saveKey);
  notifySave("save-recovery-failed", { source: "new-game" });
  return null;
}
