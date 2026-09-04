import {
  ACCESSORIES,
  ACCESSORY_LAYOUT_CONFIG,
  BATTLE_CONFIG,
  BATTLE_SHOP_ITEMS,
  CHAT_LINES,
  FOODS,
  GAME_CONFIG,
  JELLYFISH_COLORS,
  QUANTITY_CONFIG,
  SCENES,
  SKINS
} from "./config.js?v=2.13.0";
import { trackEvent } from "./analytics.js";
import { feedFood, getInventoryItems } from "./inventory.js";
import { getScene } from "./jellyfish.js?v=2.13.0";
import { purchaseItem, getShopItems } from "./shop.js";
import {
  addBattleItem,
  addExp,
  addIntimacy,
  addPoints,
  applyDailyReset,
  chatWithJellyfish,
  createDefaultSave,
  equipAccessory,
  equipScene,
  equipSkin,
  forceNextDay,
  getCurrentStage,
  getAccessoryPosition,
  getEquippedAccessories,
  getFoodQuantity,
  resetAccessoryPosition,
  resetAccessoryPositions,
  petJellyfish,
  setAccessoryPosition,
  unequipAccessory
} from "./state.js?v=2.13.0";
import {
  beginPlayerAction,
  claimBossReward,
  createBattleState,
  debugApplyStatus,
  debugClearStatus,
  debugDamageBoss,
  debugDamagePlayer,
  getBattleActionQuantityLimits,
  recordBossFailure,
  recordBossVictory,
  resetBossReward,
  resolveBossTurn
} from "./battle.js";
import { clearSave, createAndPersistSave, loadSave, persistSave } from "./storage.js?v=2.13.0";
import {
  closeModal,
  escapeHtml,
  formatNumber,
  openConfirm,
  renderCollection,
  renderDebugPanel,
  renderChallenge,
  renderHome,
  renderInventory,
  renderOnboardingState,
  renderShop,
  setOnboardingVisible,
  showLevelUpModal,
  showBattleDefeatModal,
  showBattleVictoryModal,
  showPurchaseSuccess,
  showToast,
  updateHeader
} from "./ui.js?v=2.13.0";

let save = loadSave();
let currentView = "home";
let shopCategory = "battle";
let inventoryCategory = "food";
let battleState = null;
let battleActionSelection = null;
let shopQuantities = {};
let onboardingStep = "name";
let pendingJellyfishName = "";
let selectedBaseColor = GAME_CONFIG.initialBaseColor;
let debugCollapsed = true;
let accessoryEditMode = false;
let selectedAccessoryId = null;
let accessoryGesture = null;
const debugEnabled = new URLSearchParams(window.location.search).get("debug") === "1";

const viewIds = ["home", "shop", "challenge", "inventory", "collection"];

function getElement(id) {
  return document.getElementById(id);
}

function findItem(itemId) {
  return [...FOODS, ...SKINS, ...ACCESSORIES, ...SCENES, ...BATTLE_SHOP_ITEMS].find((item) => item.id === itemId) || null;
}

function normalizeQuantity(value, fallback = QUANTITY_CONFIG.default) {
  const number = Number(value);

  if (!Number.isFinite(number)) {
    return fallback;
  }

  return Math.min(QUANTITY_CONFIG.max, Math.max(QUANTITY_CONFIG.min, Math.floor(number)));
}

function validateName(value) {
  const name = value.trim();

  if (!name) {
    return { ok: false, message: "請先幫水母取一個名字。" };
  }

  if (/\s/.test(name)) {
    return { ok: false, message: "名字不能包含空白。" };
  }

  if (/^[\u4e00-\u9fff]{1,10}$/.test(name) || /^[A-Za-z0-9]{1,20}$/.test(name)) {
    return { ok: true, name };
  }

  return { ok: false, message: "請輸入 1～10 個中文字，或 1～20 個英數字元。" };
}

function persist() {
  persistSave(save);
}

function renderNavigation() {
  document.querySelectorAll("[data-nav-view]").forEach((button) => {
    const isActive = button.dataset.navView === currentView;
    button.classList.toggle("is-active", isActive);
    button.setAttribute("aria-current", isActive ? "page" : "false");
  });
}

function leaveBattleIfNeeded(nextView) {
  if (battleState && nextView !== "challenge") {
    battleState = null;
    battleActionSelection = null;
  }
}

function renderViews() {
  const containers = {
    home: getElement("view-home"),
    shop: getElement("view-shop"),
    challenge: getElement("view-challenge"),
    inventory: getElement("view-inventory"),
    collection: getElement("view-collection")
  };

  viewIds.forEach((viewId) => {
    const container = containers[viewId];
    if (!container) return;
    container.hidden = viewId !== currentView;
  });

  if (!save) return;

  if (accessoryEditMode) {
    const equippedAccessories = getEquippedAccessories(save);
    if (!equippedAccessories.includes(selectedAccessoryId)) {
      selectedAccessoryId = equippedAccessories[0] || null;
    }
  }

  renderHome(containers.home, save, { accessoryEditMode, selectedAccessoryId });
  renderShop(containers.shop, save, shopCategory, shopQuantities);
  renderChallenge(containers.challenge, save, battleState, battleActionSelection);
  renderInventory(containers.inventory, save, inventoryCategory);
  renderCollection(containers.collection, save);
}

function renderApp() {
  if (save) {
    if (applyDailyReset(save)) {
      persist();
    }
    setOnboardingVisible(false);
    updateHeader(save);
  } else {
    setOnboardingVisible(true);
    const nameSummary = getElement("onboarding-name-summary");
    if (nameSummary) nameSummary.dataset.name = pendingJellyfishName;
    renderOnboardingState(onboardingStep, selectedBaseColor);
  }

  renderViews();
  renderNavigation();

  const debugPanel = getElement("debug-panel");
  if (debugPanel) {
    renderDebugPanel(debugPanel, debugEnabled, save, battleState, debugCollapsed);
    debugPanel.classList.toggle("is-collapsed", debugCollapsed);
  }
}

function animateAvatar(actionClass) {
  const character = document.querySelector("#jelly-display .jelly-character");
  if (!character) return;

  character.classList.remove("is-petting", "is-chatting", "is-feeding", "is-level-up");
  void character.offsetWidth;
  character.classList.add(actionClass);
  window.setTimeout(() => character.classList.remove(actionClass), 1100);
}

function clampAccessoryCoordinate(value, minimum, maximum) {
  return Math.min(maximum, Math.max(minimum, value));
}

function getPointerDistance(first, second) {
  return Math.hypot(second.x - first.x, second.y - first.y);
}

function getPointerAngle(first, second) {
  return Math.atan2(second.y - first.y, second.x - first.x) * (180 / Math.PI);
}

function getPointerCenter(first, second) {
  return {
    x: (first.x + second.x) / 2,
    y: (first.y + second.y) / 2
  };
}

function normalizeAngleDelta(value) {
  let angle = value;
  while (angle > 180) angle -= 360;
  while (angle < -180) angle += 360;
  return angle;
}

function snapAccessoryRotation(value) {
  const clamped = clampAccessoryCoordinate(value, ACCESSORY_LAYOUT_CONFIG.minRotation, ACCESSORY_LAYOUT_CONFIG.maxRotation);
  const snapAngle = ACCESSORY_LAYOUT_CONFIG.snapAngles.find((angle) => Math.abs(clamped - angle) <= ACCESSORY_LAYOUT_CONFIG.snapThreshold);
  return snapAngle ?? clamped;
}

function applyAccessoryTransformToDom(target, transform) {
  target.style.setProperty("--accessory-left", `${transform.x}%`);
  target.style.setProperty("--accessory-top", `${transform.y}%`);
  target.style.setProperty("--accessory-rotation", `${transform.rotation}deg`);
  target.style.setProperty("--accessory-scale", transform.scale);

  const rotationOutput = document.querySelector("[data-accessory-rotation]");
  const scaleOutput = document.querySelector("[data-accessory-scale]");
  if (rotationOutput) rotationOutput.textContent = `旋轉 ${Math.round(transform.rotation)}°`;
  if (scaleOutput) scaleOutput.textContent = `大小 ${Number(transform.scale).toFixed(2)}×`;
}

function selectAccessory(accessoryId) {
  if (!getEquippedAccessories(save).includes(accessoryId)) return false;

  selectedAccessoryId = accessoryId;
  document.querySelectorAll("#jelly-display .jelly-accessory.is-draggable").forEach((accessory) => {
    const isSelected = accessory.dataset.accessoryId === accessoryId;
    accessory.classList.toggle("is-selected", isSelected);
    accessory.setAttribute("aria-pressed", String(isSelected));
  });

  const accessory = ACCESSORIES.find((item) => item.id === accessoryId);
  const selectedName = document.querySelector("[data-accessory-selected-name]");
  const selectedIcon = document.querySelector(".accessory-transform-icon");
  if (selectedName && accessory) selectedName.textContent = accessory.name;
  if (selectedIcon && accessory) selectedIcon.textContent = accessory.icon;
  if (accessory) {
    const target = document.querySelector(`#jelly-display .jelly-accessory[data-accessory-id="${accessoryId}"]`);
    if (target) applyAccessoryTransformToDom(target, getAccessoryPosition(save, accessoryId));
  }
  return true;
}

function getAccessoryDragTarget(event) {
  if (!accessoryEditMode || currentView !== "home" || !save) {
    return null;
  }

  const target = event.target.closest?.(".jelly-accessory.is-draggable");
  return target?.closest("#jelly-display .jelly-character.accessory-edit-mode") ? target : null;
}

function handleAccessoryPointerDown(event) {
  const target = getAccessoryDragTarget(event);
  if (!target) return;

  const coordinateLayer = target.closest(".jelly-accessory-layer");
  const rect = coordinateLayer?.getBoundingClientRect();
  const accessoryId = target.dataset.accessoryId;

  if (!coordinateLayer || !rect || !rect.width || !rect.height || !accessoryId) return;

  if (accessoryGesture && accessoryGesture.accessoryId !== accessoryId) return;
  selectAccessory(accessoryId);

  if (!accessoryGesture) {
    accessoryGesture = {
      accessoryId,
      coordinateLayer,
      target,
      pointers: new Map(),
      currentTransform: getAccessoryPosition(save, accessoryId),
      frameId: null
    };
  }

  if (accessoryGesture.pointers.size >= 2 || accessoryGesture.pointers.has(event.pointerId)) return;

  accessoryGesture.pointers.set(event.pointerId, { x: event.clientX, y: event.clientY });
  const pointerValues = [...accessoryGesture.pointers.values()];

  if (pointerValues.length === 1) {
    accessoryGesture.mode = "drag";
    accessoryGesture.startTransform = { ...accessoryGesture.currentTransform };
    accessoryGesture.startPointer = { ...pointerValues[0] };
  } else {
    accessoryGesture.mode = "transform";
    accessoryGesture.startTransform = { ...accessoryGesture.currentTransform };
    accessoryGesture.startDistance = Math.max(1, getPointerDistance(pointerValues[0], pointerValues[1]));
    accessoryGesture.startAngle = getPointerAngle(pointerValues[0], pointerValues[1]);
    accessoryGesture.startCenter = getPointerCenter(pointerValues[0], pointerValues[1]);
    target.classList.add("is-transforming");
  }

  target.classList.add("is-dragging");
  target.setAttribute("aria-grabbed", "true");
  try {
    target.setPointerCapture?.(event.pointerId);
  } catch (error) {
    console.debug("Pointer capture unavailable for this gesture.", error);
  }
  event.preventDefault();
}

function handleAccessoryPointerMove(event) {
  if (!accessoryGesture?.pointers.has(event.pointerId)) return;

  accessoryGesture.pointers.set(event.pointerId, { x: event.clientX, y: event.clientY });
  const { coordinateLayer, startTransform } = accessoryGesture;
  const rect = coordinateLayer.getBoundingClientRect();

  if (!rect.width || !rect.height) return;

  const pointers = [...accessoryGesture.pointers.values()];
  let nextTransform = { ...accessoryGesture.currentTransform };

  if (accessoryGesture.mode === "transform" && pointers.length >= 2) {
    const center = getPointerCenter(pointers[0], pointers[1]);
    const distance = getPointerDistance(pointers[0], pointers[1]);
    const angle = getPointerAngle(pointers[0], pointers[1]);
    const rotationDelta = normalizeAngleDelta(angle - accessoryGesture.startAngle);

    nextTransform = {
      x: clampAccessoryCoordinate(startTransform.x + ((center.x - accessoryGesture.startCenter.x) / rect.width) * 100, ACCESSORY_LAYOUT_CONFIG.minX, ACCESSORY_LAYOUT_CONFIG.maxX),
      y: clampAccessoryCoordinate(startTransform.y + ((center.y - accessoryGesture.startCenter.y) / rect.height) * 100, ACCESSORY_LAYOUT_CONFIG.minY, ACCESSORY_LAYOUT_CONFIG.maxY),
      rotation: snapAccessoryRotation(startTransform.rotation + rotationDelta),
      scale: clampAccessoryCoordinate(startTransform.scale * (distance / accessoryGesture.startDistance), ACCESSORY_LAYOUT_CONFIG.minScale, ACCESSORY_LAYOUT_CONFIG.maxScale)
    };
  } else if (pointers.length === 1) {
    nextTransform = {
      ...startTransform,
      x: clampAccessoryCoordinate(startTransform.x + ((pointers[0].x - accessoryGesture.startPointer.x) / rect.width) * 100, ACCESSORY_LAYOUT_CONFIG.minX, ACCESSORY_LAYOUT_CONFIG.maxX),
      y: clampAccessoryCoordinate(startTransform.y + ((pointers[0].y - accessoryGesture.startPointer.y) / rect.height) * 100, ACCESSORY_LAYOUT_CONFIG.minY, ACCESSORY_LAYOUT_CONFIG.maxY)
    };
  }

  accessoryGesture.currentTransform = nextTransform;
  if (!accessoryGesture.frameId) {
    accessoryGesture.frameId = window.requestAnimationFrame(() => {
      if (!accessoryGesture) return;
      applyAccessoryTransformToDom(accessoryGesture.target, accessoryGesture.currentTransform);
      accessoryGesture.frameId = null;
    });
  }

  event.preventDefault();
}

function handleAccessoryPointerUp(event) {
  if (!accessoryGesture?.pointers.has(event.pointerId)) return;

  const gesture = accessoryGesture;
  if (event.type !== "pointercancel") {
    gesture.pointers.set(event.pointerId, { x: event.clientX, y: event.clientY });
    handleAccessoryPointerMove(event);
  }
  gesture.pointers.delete(event.pointerId);

  if (gesture.target.hasPointerCapture?.(event.pointerId)) {
    try {
      gesture.target.releasePointerCapture(event.pointerId);
    } catch (error) {
      console.debug("Pointer capture was already released.", error);
    }
  }

  const remainingPointers = [...gesture.pointers.values()];
  if (remainingPointers.length === 1) {
    gesture.mode = "drag";
    gesture.startTransform = { ...gesture.currentTransform };
    gesture.startPointer = { ...remainingPointers[0] };
    gesture.target.classList.remove("is-transforming");
  } else if (!remainingPointers.length) {
    if (gesture.frameId) window.cancelAnimationFrame(gesture.frameId);
    applyAccessoryTransformToDom(gesture.target, gesture.currentTransform);
    setAccessoryPosition(save, gesture.accessoryId, gesture.currentTransform);
    persist();
    gesture.target.classList.remove("is-dragging", "is-transforming");
    gesture.target.setAttribute("aria-grabbed", "false");
    accessoryGesture = null;
    renderApp();
    showToast("配件位置、角度與大小已保存。", "success");
  }
}

function handleAccessoryKeydown(event) {
  if (!accessoryEditMode || currentView !== "home" || !save) return;

  const target = event.target.closest?.(".jelly-accessory.is-draggable");
  const accessoryId = target?.dataset.accessoryId;
  if (!target || !accessoryId || !["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(event.key)) return;

  const position = getAccessoryPosition(save, accessoryId);
  const step = event.shiftKey ? 5 : 2;
  if (event.key === "ArrowUp") position.y -= step;
  if (event.key === "ArrowDown") position.y += step;
  if (event.key === "ArrowLeft") position.x -= step;
  if (event.key === "ArrowRight") position.x += step;

  setAccessoryPosition(save, accessoryId, position);
  const nextPosition = getAccessoryPosition(save, accessoryId);
  target.style.setProperty("--accessory-left", `${nextPosition.x}%`);
  target.style.setProperty("--accessory-top", `${nextPosition.y}%`);
  persist();
  event.preventDefault();
}

function adjustSelectedAccessoryTransform(property, delta) {
  if (!save || !selectedAccessoryId || !["rotation", "scale"].includes(property)) return;

  const transform = getAccessoryPosition(save, selectedAccessoryId);
  const nextValue = transform[property] + Number(delta || 0);
  transform[property] = property === "rotation"
    ? clampAccessoryCoordinate(nextValue, ACCESSORY_LAYOUT_CONFIG.minRotation, ACCESSORY_LAYOUT_CONFIG.maxRotation)
    : clampAccessoryCoordinate(nextValue, ACCESSORY_LAYOUT_CONFIG.minScale, ACCESSORY_LAYOUT_CONFIG.maxScale);

  setAccessoryPosition(save, selectedAccessoryId, transform);
  persist();
  renderApp();
}

function showLevelUps(levelUps) {
  if (!levelUps.length || !save) return;

  const [current, ...remaining] = levelUps;
  trackEvent("level_up", { level: current.to });
  showLevelUpModal(save, current.from, current.to, () => showLevelUps(remaining));
}

function trackBattleEvents(events = []) {
  events.forEach(({ eventName, payload }) => trackEvent(eventName, payload));
}

function finishBattle(destination = "home") {
  battleState = null;
  battleActionSelection = null;
  currentView = destination;
  renderApp();
}

function handleClaimBossReward() {
  if (!save) return;

  const result = claimBossReward(save);
  if (!result.ok) {
    showToast(result.reason, result.alreadyClaimed ? "info" : "warning");
    return;
  }

  persist();
  trackEvent("boss_reward_claimed", { bossId: "aging_monster", rewardId: result.reward.id, value: result.reward.value });
  battleState = null;
  currentView = "inventory";
  inventoryCategory = "rewards";
  renderApp();
  showToast("🎫 NT$600 虛擬折價券已加入我的獎勵。", "success");
}

function handleBattleOutcome() {
  if (!save || !battleState || !["won", "lost"].includes(battleState.phase)) {
    return;
  }

  const currentBattle = battleState;
  const wasRecorded = currentBattle.outcomeRecorded;

  if (currentBattle.phase === "won") {
    const result = recordBossVictory(save, currentBattle);
    if (!wasRecorded) {
      trackEvent("boss_defeated", { bossId: currentBattle.boss.id, clearCount: save.bossProgress.agingMonster.clearCount });
    }
    persist();
    showBattleVictoryModal(save, {
      firstClear: result.firstClear,
      rewardClaimed: result.rewardClaimed,
      onClaim: handleClaimBossReward,
      onExit: () => finishBattle("home")
    });
    return;
  }

  recordBossFailure(currentBattle);
  if (!wasRecorded) {
    trackEvent("boss_failed", { bossId: currentBattle.boss.id });
  }
  showBattleDefeatModal(save, {
    onRetry: () => {
      battleState = createBattleState();
      trackEvent("boss_battle_start", { bossId: battleState.boss.id, retry: true });
      renderApp();
    },
    onExit: () => finishBattle("home")
  });
}

function startBattle() {
  if (!save) return;

  currentView = "challenge";
  battleState = createBattleState();
  battleActionSelection = null;
  trackEvent("boss_battle_start", { bossId: battleState.boss.id });
  renderApp();
}

function scheduleBossTurn(activeBattle) {
  window.setTimeout(() => {
    if (!save || battleState !== activeBattle || activeBattle.phase !== "boss") {
      return;
    }

    const result = resolveBossTurn(activeBattle, save);
    if (!result.ok) {
      activeBattle.actionLocked = false;
      renderApp();
      return;
    }

    trackBattleEvents(result.events);
    persist();
    renderApp();
    handleBattleOutcome();
  }, BATTLE_CONFIG.turnDelayMs);
}

function handleBattleAction(actionTarget, quantity = 1) {
  if (!save || !battleState) return;

  const activeBattle = battleState;
  const result = beginPlayerAction(activeBattle, save, actionTarget.dataset.battleAction, quantity);

  if (!result.ok) {
    showToast(result.reason, "warning");
    return;
  }

  battleActionSelection = null;
  trackBattleEvents(result.events);
  persist();
  renderApp();

  if (["won", "lost"].includes(activeBattle.phase)) {
    handleBattleOutcome();
    return;
  }

  scheduleBossTurn(activeBattle);
}

function openFeedModal(food) {
  const quantity = getFoodQuantity(save, food.id);
  openConfirm({
    title: `餵給${escapeHtml(save.jellyfish.name)}？`,
    body: `<div class="feed-confirm"><span class="feed-confirm-icon">${food.icon}</span><div><strong>${food.name}</strong><p>EXP +${food.exp} · 背包剩餘 ×${quantity}</p></div></div>`,
    confirmLabel: "餵食",
    onConfirm: () => {
      const result = feedFood(save, food);
      if (!result.ok) {
        showToast(result.reason, "warning");
        return;
      }

      const levelUps = addExp(save, food.exp);
      persist();
      trackEvent("feed_jellyfish", { itemId: food.id });
      renderApp();
      animateAvatar("is-feeding");
      showToast(`🍰 EXP +${food.exp}`, "success");
      showLevelUps(levelUps);
    }
  });
}

function handlePurchase(item, requestedQuantity = QUANTITY_CONFIG.default) {
  if (!save || !item) return;

  const quantity = normalizeQuantity(requestedQuantity);
  const totalPrice = item.price * quantity;
  const afterPoints = Math.max(0, save.player.points - totalPrice);
  openConfirm({
    title: `購買「${escapeHtml(item.name)}」 ×${quantity}？`,
    body: `<div class="purchase-confirm"><div><span>單價</span><strong>✦ ${formatNumber(item.price)}</strong></div><div><span>購買數量</span><strong>×${quantity}</strong></div><div><span>目前點數</span><strong>✦ ${formatNumber(save.player.points)}</strong></div><div class="purchase-after"><span>總價／購買後</span><strong>✦ ${formatNumber(totalPrice)} ／ ${formatNumber(afterPoints)}</strong></div></div>`,
    confirmLabel: `確認購買 ×${quantity}`,
    onConfirm: () => {
      const result = purchaseItem(save, item, quantity);

      if (!result.ok) {
        showToast(result.reason, "warning");
        renderApp();
        return;
      }

      persist();
      shopQuantities[item.id] = QUANTITY_CONFIG.default;
      trackEvent(item.type === "weapon" || item.type === "recovery" || item.type === "ointment" ? "battle_item_purchase" : "purchase_shop_item", { itemId: item.id, price: item.price, quantity: result.quantity, totalPrice: result.totalPrice });
      renderApp();
      showPurchaseSuccess(item, () => handleEquip(item.id, item.type), result.quantity);
    }
  });
}

function handleEquip(itemId, type) {
  if (!save) return;

  const item = findItem(itemId);

  if (type === "accessory") {
    const isEquipped = getEquippedAccessories(save).includes(itemId);

    if (isEquipped) {
      if (!unequipAccessory(save, itemId)) {
        showToast("這件配件目前沒有裝備。", "warning");
        return;
      }

      persist();
      renderApp();
      animateAvatar("is-chatting");
      showToast(`已卸下 ${item?.name || "配件"}`, "success");
      trackEvent("unequip_accessory", { itemId });
      return;
    }

    const result = equipAccessory(save, itemId);

    if (!result.ok) {
      showToast("這件物品還不在你的背包裡。", "warning");
      return;
    }

    persist();
    renderApp();
    animateAvatar("is-chatting");

    showToast(`已裝備 ${item?.name || "配件"}，可在養成區自由移動`, "success");
    trackEvent("equip_accessory", { itemId, equippedCount: getEquippedAccessories(save).length });
    return;
  }

  let equipped = false;
  if (type === "skin") equipped = equipSkin(save, itemId);
  if (type === "scene") equipped = equipScene(save, itemId);

  if (!equipped) {
    showToast("這件物品還不在你的背包裡。", "warning");
    return;
  }

  persist();
  renderApp();
  animateAvatar("is-chatting");
  showToast(`已裝備 ${item?.name || "新物品"}`, "success");
  trackEvent(type === "skin" ? "equip_skin" : `equip_${type}`, { itemId });
}

function handleResetSave() {
  openConfirm({
    title: "確定要重設存檔嗎？",
    body: "這會刪除目前的水母、點數、背包與圖鑑，並重新進入命名流程。此動作無法復原。",
    confirmLabel: "刪除並重置",
    tone: "button-danger",
    onConfirm: () => {
      clearSave();
      save = null;
      battleState = null;
      battleActionSelection = null;
      accessoryDrag = null;
      accessoryEditMode = false;
      shopQuantities = {};
      onboardingStep = "name";
      pendingJellyfishName = "";
      selectedBaseColor = GAME_CONFIG.initialBaseColor;
      currentView = "home";
      shopCategory = "battle";
      inventoryCategory = "food";
      renderApp();
      getElement("name-input")?.focus();
      showToast("存檔已刪除，歡迎重新開始。", "success");
    }
  });
}

function updateShopQuantity(itemId, nextQuantity) {
  const item = findItem(itemId);
  if (!item || item.type === "skin" || item.type === "accessory" || item.type === "scene") return;

  const current = shopQuantities[itemId] || QUANTITY_CONFIG.default;
  shopQuantities[itemId] = normalizeQuantity(nextQuantity, current);
  renderApp();
}

function openBattleActionPanel(itemId) {
  if (!save || !battleState || battleState.actionLocked || battleState.phase !== "player") return;

  if (battleActionSelection?.itemId === itemId) {
    battleActionSelection = null;
    renderApp();
    return;
  }

  const item = BATTLE_SHOP_ITEMS.find((candidate) => candidate.id === itemId);
  const limits = getBattleActionQuantityLimits(battleState, save, item);

  if (!item || limits.max <= 0) {
    showToast(item?.type === "recovery" ? `目前不能使用 ${item.name}。` : item?.type === "ointment" ? "目前沒有癢狀態可解除。" : "目前沒有可使用的戰鬥用品。", "warning");
    return;
  }

  battleActionSelection = {
    itemId,
    quantity: Math.min(limits.max, QUANTITY_CONFIG.default)
  };
  renderApp();
}

function updateBattleActionQuantity(itemId, nextQuantity) {
  if (!save || !battleState || !battleActionSelection || battleActionSelection.itemId !== itemId) return;

  const item = BATTLE_SHOP_ITEMS.find((candidate) => candidate.id === itemId);
  const limits = getBattleActionQuantityLimits(battleState, save, item);

  if (limits.max <= 0) {
    battleActionSelection = null;
    renderApp();
    return;
  }

  const current = battleActionSelection.quantity || QUANTITY_CONFIG.default;
  battleActionSelection.quantity = Math.min(limits.max, normalizeQuantity(nextQuantity, current));
  renderApp();
}

function continueToColorSelection(event) {
  event.preventDefault();
  const input = getElement("name-input");
  const error = getElement("name-error");
  const result = validateName(input?.value || "");

  if (!result.ok) {
    if (error) error.textContent = result.message;
    input?.focus();
    return;
  }

  pendingJellyfishName = result.name;
  onboardingStep = "color";
  const nameSummary = getElement("onboarding-name-summary");
  if (nameSummary) nameSummary.dataset.name = pendingJellyfishName;
  renderApp();
}

function startGameFromOnboarding() {
  const colorExists = JELLYFISH_COLORS.some((color) => color.id === selectedBaseColor);
  if (!pendingJellyfishName || !colorExists) {
    onboardingStep = "name";
    renderApp();
    return;
  }

  save = createAndPersistSave(pendingJellyfishName, selectedBaseColor);
  pendingJellyfishName = "";
  onboardingStep = "name";
  battleState = null;
  battleActionSelection = null;
  accessoryEditMode = false;
  currentView = "home";
  trackEvent("game_open", { baseColor: save.jellyfish.baseColor });
  renderApp();
  showToast(`歡迎${save.jellyfish.name}來到 Jelly Lab！`, "success");
}

function handleAction(actionTarget) {
  const action = actionTarget.dataset.action;

  switch (action) {
    case "view": {
      const nextView = viewIds.includes(actionTarget.dataset.view) ? actionTarget.dataset.view : "home";
      leaveBattleIfNeeded(nextView);
      if (nextView !== "home") accessoryEditMode = false;
      if (nextView === "shop") shopCategory = "battle";
      currentView = nextView;
      trackEvent(currentView === "challenge" ? "boss_challenge_open" : `${currentView === "home" ? "game_open" : `${currentView}_open`}`);
      renderApp();
      break;
    }
    case "pet": {
      if (!save) return;
      const result = petJellyfish(save);
      if (!result.ok) {
        showToast(result.reason || "今天的摸摸次數已用完。", "warning");
        return;
      }
      persist();
      renderApp();
      animateAvatar("is-petting");
      showToast(`♡ 親密度 +${result.gained}`, "success");
      trackEvent("pet_jellyfish");
      break;
    }
    case "chat": {
      if (!save) return;
      const result = chatWithJellyfish(save);
      if (!result.ok) {
        showToast(result.reason || "今天的聊天次數已用完。", "warning");
        return;
      }
      const line = CHAT_LINES[Math.floor(Math.random() * CHAT_LINES.length)];
      persist();
      renderApp();
      animateAvatar("is-chatting");
      showToast(`「${line}」 · 親密度 +${result.gained}`, "success");
      trackEvent("chat_jellyfish");
      break;
    }
    case "go-inventory":
      leaveBattleIfNeeded("inventory");
      accessoryEditMode = false;
      currentView = "inventory";
      inventoryCategory = "food";
      renderApp();
      break;
    case "go-shop":
      leaveBattleIfNeeded("shop");
      accessoryEditMode = false;
      currentView = "shop";
      shopCategory = "battle";
      renderApp();
      trackEvent("shop_open");
      break;
    case "go-battle-shop":
      leaveBattleIfNeeded("shop");
      accessoryEditMode = false;
      currentView = "shop";
      shopCategory = "battle";
      renderApp();
      trackEvent("battle_shop_open");
      break;
    case "go-challenge":
      accessoryEditMode = false;
      currentView = "challenge";
      renderApp();
      trackEvent("boss_challenge_open");
      break;
    case "go-accessory-shop":
      leaveBattleIfNeeded("shop");
      accessoryEditMode = false;
      currentView = "shop";
      shopCategory = "accessory";
      renderApp();
      trackEvent("shop_open", { category: "accessory" });
      break;
    case "go-home-accessory-editor":
      leaveBattleIfNeeded("home");
      currentView = "home";
      accessoryEditMode = true;
      selectedAccessoryId = getEquippedAccessories(save)[0] || null;
      renderApp();
      break;
    case "toggle-accessory-editor":
      if (!save || !getEquippedAccessories(save).length) return;
      accessoryEditMode = !accessoryEditMode;
      selectedAccessoryId = accessoryEditMode ? getEquippedAccessories(save)[0] : null;
      renderApp();
      showToast(accessoryEditMode ? "單指移動，雙指縮放與旋轉配件。" : "配件配置已保存。", "info");
      break;
    case "adjust-accessory-transform":
      adjustSelectedAccessoryTransform(actionTarget.dataset.transform, actionTarget.dataset.delta);
      break;
    case "reset-selected-accessory":
      if (!save || !selectedAccessoryId) return;
      resetAccessoryPosition(save, selectedAccessoryId);
      persist();
      renderApp();
      showToast("目前配件已回到預設位置與大小。", "success");
      break;
    case "reset-accessory-positions":
      if (!save || !getEquippedAccessories(save).length) return;
      resetAccessoryPositions(save);
      persist();
      renderApp();
      showToast("配件已回到預設位置。", "success");
      break;
    case "start-battle":
      startBattle();
      break;
    case "shop-category":
      shopCategory = actionTarget.dataset.category || "food";
      renderApp();
      break;
    case "inventory-category":
      inventoryCategory = actionTarget.dataset.category || "food";
      renderApp();
      break;
    case "purchase":
      handlePurchase(getShopItems(shopCategory).find((item) => item.id === actionTarget.dataset.id), Number(actionTarget.dataset.quantity || QUANTITY_CONFIG.default));
      break;
    case "shop-quantity-decrease": {
      const itemId = actionTarget.dataset.itemId;
      updateShopQuantity(itemId, (shopQuantities[itemId] || QUANTITY_CONFIG.default) - 1);
      break;
    }
    case "shop-quantity-increase": {
      const itemId = actionTarget.dataset.itemId;
      updateShopQuantity(itemId, (shopQuantities[itemId] || QUANTITY_CONFIG.default) + 1);
      break;
    }
    case "shop-quantity-input":
      updateShopQuantity(actionTarget.dataset.itemId, actionTarget.value);
      break;
    case "shop-quantity-max": {
      const item = findItem(actionTarget.dataset.itemId);
      if (!item || !save) return;
      const affordableMax = item.price > 0 ? Math.floor(Math.max(0, save.player.points) / item.price) : QUANTITY_CONFIG.max;
      updateShopQuantity(item.id, Math.max(QUANTITY_CONFIG.min, Math.min(QUANTITY_CONFIG.max, affordableMax)));
      break;
    }
    case "feed":
      if (save) openFeedModal(FOODS.find((food) => food.id === actionTarget.dataset.id));
      break;
    case "equip-skin":
      handleEquip(actionTarget.dataset.id, "skin");
      break;
    case "equip-accessory":
      handleEquip(actionTarget.dataset.id, "accessory");
      break;
    case "equip-scene":
      handleEquip(actionTarget.dataset.id, "scene");
      break;
    case "battle-action":
      handleBattleAction(actionTarget, 1);
      break;
    case "battle-open-action":
      openBattleActionPanel(actionTarget.dataset.battleAction);
      break;
    case "battle-quantity-decrease": {
      const itemId = actionTarget.dataset.itemId;
      const current = battleActionSelection?.quantity || QUANTITY_CONFIG.default;
      updateBattleActionQuantity(itemId, current - 1);
      break;
    }
    case "battle-quantity-increase": {
      const itemId = actionTarget.dataset.itemId;
      const current = battleActionSelection?.quantity || QUANTITY_CONFIG.default;
      updateBattleActionQuantity(itemId, current + 1);
      break;
    }
    case "battle-quantity-input":
      updateBattleActionQuantity(actionTarget.dataset.itemId, actionTarget.value);
      break;
    case "battle-cancel-action":
      battleActionSelection = null;
      renderApp();
      break;
    case "battle-confirm-action":
      handleBattleAction(actionTarget, normalizeQuantity(actionTarget.dataset.quantity));
      break;
    case "battle-exit":
      finishBattle("challenge");
      showToast("本次挑戰已結束。", "info");
      break;
    case "battle-retry":
      startBattle();
      break;
    case "battle-return-home":
      finishBattle("home");
      break;
    case "claim-boss-reward":
      handleClaimBossReward();
      break;
    case "close-modal":
      closeModal();
      break;
    case "toggle-debug":
      debugCollapsed = !debugCollapsed;
      renderApp();
      break;
    case "debug-points":
      if (!save) return;
      addPoints(save, Number(actionTarget.dataset.amount));
      persist();
      renderApp();
      showToast(`✦ 已增加 ${actionTarget.dataset.amount} 點`, "success");
      break;
    case "debug-exp": {
      if (!save) return;
      const amount = Number(actionTarget.dataset.amount);
      const levelUps = addExp(save, amount);
      persist();
      renderApp();
      showToast(`EXP +${amount}`, "success");
      showLevelUps(levelUps);
      break;
    }
    case "debug-intimacy":
      if (!save) return;
      addIntimacy(save, Number(actionTarget.dataset.amount), { ignoreDailyLimit: true });
      persist();
      renderApp();
      showToast(`♡ 親密度 +${actionTarget.dataset.amount}`, "success");
      break;
    case "force-next-day":
      if (!save) return;
      forceNextDay(save);
      persist();
      renderApp();
      showToast("已進入新的一天，互動限制已重置。", "success");
      break;
    case "debug-battle-item": {
      if (!save) return;
      const item = BATTLE_SHOP_ITEMS.find((candidate) => candidate.id === actionTarget.dataset.itemId);
      if (!item) return;
      addBattleItem(save, item, 1);
      persist();
      renderApp();
      showToast(`⚔️ ${item.name} +1`, "success");
      break;
    }
    case "debug-boss-damage":
      if (!battleState || !debugDamageBoss(battleState, 50)) return;
      renderApp();
      if (battleState.phase === "won") handleBattleOutcome();
      break;
    case "debug-player-damage":
      if (!save || !battleState || !debugDamagePlayer(battleState, save, 20)) return;
      renderApp();
      if (battleState.phase === "lost") handleBattleOutcome();
      break;
    case "debug-itchy":
      if (!save || !battleState || !debugApplyStatus(battleState, save, "itchy")) return;
      renderApp();
      showToast("Debug：已套用癢狀態。", "info");
      break;
    case "debug-blurred":
      if (!save || !battleState || !debugApplyStatus(battleState, save, "blurred")) return;
      renderApp();
      showToast("Debug：已套用視野模糊。", "info");
      break;
    case "debug-clear-status":
      if (!save || !battleState || !debugClearStatus(battleState, save)) return;
      renderApp();
      showToast("Debug：異常狀態已清除。", "success");
      break;
    case "debug-reset-boss-reward":
      if (!save || !resetBossReward(save)) return;
      persist();
      renderApp();
      showToast("Debug：Boss 獎勵進度已重置。", "success");
      break;
    case "reset-save":
      handleResetSave();
      break;
    case "onboarding-color":
      if (!JELLYFISH_COLORS.some((color) => color.id === actionTarget.dataset.colorId)) return;
      selectedBaseColor = actionTarget.dataset.colorId;
      renderApp();
      break;
    case "onboarding-back":
      onboardingStep = "name";
      renderApp();
      getElement("name-input")?.focus();
      break;
    case "onboarding-start":
      startGameFromOnboarding();
      break;
    default:
      break;
  }
}

function boot() {
  document.addEventListener("click", (event) => {
    const actionTarget = event.target.closest("[data-action]");
    if (actionTarget) {
      handleAction(actionTarget);
    }
  });

  document.addEventListener("input", (event) => {
    const actionTarget = event.target.closest?.("[data-action]");
    if (actionTarget) {
      handleAction(actionTarget);
    }
  });

  document.addEventListener("pointerdown", handleAccessoryPointerDown);
  document.addEventListener("pointermove", handleAccessoryPointerMove, { passive: false });
  document.addEventListener("pointerup", handleAccessoryPointerUp);
  document.addEventListener("pointercancel", handleAccessoryPointerUp);
  document.addEventListener("keydown", handleAccessoryKeydown);

  getElement("onboarding-form")?.addEventListener("submit", continueToColorSelection);
  getElement("name-input")?.addEventListener("input", () => {
    const error = getElement("name-error");
    if (error) error.textContent = "";
  });

  window.addEventListener("beforeunload", persist);
  window.addEventListener("keydown", (event) => {
    if (event.key === "Escape") closeModal();
  });

  renderApp();
  if (save) trackEvent("game_open");
}

boot();
