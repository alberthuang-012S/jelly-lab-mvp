import {
  BATTLE_CONFIG,
  BATTLE_SHOP_GROUPS,
  BATTLE_SHOP_ITEMS,
  EVOLUTION_STAGES,
  GAME_CONFIG,
  JELLYFISH_COLORS,
  QUANTITY_CONFIG,
  REWARDS_CONFIG,
  SHOP_CATEGORIES,
  SKINS
} from "./config.js";
import { getCollectionProgress, isCollected } from "./collection.js";
import { getBattleInventorySummary, getInventoryItems, getRewardItems } from "./inventory.js";
import { getBattleItemQuantity, getExpRequired, getFoodQuantity, getCurrentStage, getNextStage, getStageProgress, getEquippedAccessories } from "./state.js";
import { renderJellyfish, renderJellyfishPreview, getScene, getSkin } from "./jellyfish.js?v=2.12.0";
import { getItemStatus, getShopItems, isEquipped, isRepeatableItem } from "./shop.js";
import { getBattleActionQuantityLimits, getBossForDisplay } from "./battle.js";
import { renderBattleItemVisual } from "./components.js";

export function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

export function formatNumber(value) {
  return new Intl.NumberFormat("zh-TW").format(value);
}

export function renderOnboardingState(step = "name", selectedColorId = GAME_CONFIG.initialBaseColor) {
  const nameStep = document.querySelector("#onboarding-step-name");
  const colorStep = document.querySelector("#onboarding-step-color");
  const preview = document.querySelector("#onboarding-character");
  const colorOptions = document.querySelector("#onboarding-color-options");
  const selectedColorLabel = document.querySelector("#onboarding-selected-color");
  const nameSummary = document.querySelector("#onboarding-name-summary");
  const selectedColor = JELLYFISH_COLORS.find((color) => color.id === selectedColorId) || JELLYFISH_COLORS[0];
  const isColorStep = step === "color";

  if (nameStep) nameStep.hidden = isColorStep;
  if (colorStep) colorStep.hidden = !isColorStep;
  if (preview) {
    preview.innerHTML = renderJellyfishPreview(selectedColor.id);
    preview.setAttribute("aria-label", `${selectedColor.name}水母預覽`);
  }
  if (selectedColorLabel) selectedColorLabel.textContent = `目前選擇：${selectedColor.name}`;
  if (nameSummary) nameSummary.textContent = nameSummary.dataset.name ? `水母名字：${nameSummary.dataset.name}` : "";
  if (colorOptions) {
    colorOptions.innerHTML = JELLYFISH_COLORS.map((color) => `
      <button type="button" class="color-swatch ${color.id === selectedColor.id ? "is-selected" : ""}" data-action="onboarding-color" data-color-id="${color.id}" aria-pressed="${color.id === selectedColor.id}" style="--swatch-color:${color.color}">
        <span class="color-swatch-dot" aria-hidden="true"></span><span>${color.shortName}</span>${color.id === selectedColor.id ? "<b>✓</b>" : ""}
      </button>
    `).join("");
  }
}

function progressBar(value, max, label, tone = "blue") {
  const percentage = max > 0 ? Math.min(100, Math.max(0, (value / max) * 100)) : 0;

  return `
    <div class="progress-label-row">
      <span>${label}</span>
      <strong>${formatNumber(value)} / ${formatNumber(max)}</strong>
    </div>
    <div class="progress-track tone-${tone}" role="progressbar" aria-valuenow="${value}" aria-valuemin="0" aria-valuemax="${max}" aria-label="${label}">
      <span style="width:${percentage}%"></span>
    </div>
  `;
}

function renderStageTrack(save) {
  const current = getCurrentStage(save).stage;

  return `
    <div class="stage-track" aria-label="水母成長五階段">
      ${EVOLUTION_STAGES.map((stage) => {
        const reached = current >= stage.stage;
        const isCurrent = current === stage.stage;
        return `
          <div class="stage-step ${reached ? "is-reached" : ""} ${isCurrent ? "is-current" : ""}">
            <span class="stage-dot">${reached ? "✓" : stage.stage}</span>
            <span>${stage.name.replace("水母", "")}</span>
          </div>
        `;
      }).join("")}
    </div>
  `;
}

function renderAccessoryLayoutControls(save, accessoryEditMode = false) {
  const equippedCount = getEquippedAccessories(save).length;

  if (!equippedCount) {
    return `
      <section class="accessory-layout-card">
        <div class="accessory-layout-copy"><span class="card-kicker">FREE ACCESSORY LAYOUT</span><strong>自由裝備你的配件</strong><p>先到配件商店取得配件，就能同時裝備多件並自由調整位置。</p></div>
        <button class="small-action" data-action="go-accessory-shop">挑選配件</button>
      </section>
    `;
  }

  return `
    <section class="accessory-layout-card ${accessoryEditMode ? "is-editing" : ""}">
      <div class="accessory-layout-copy"><span class="card-kicker">FREE ACCESSORY LAYOUT</span><strong>自由裝備 · ${equippedCount} 件</strong><p>${accessoryEditMode ? "拖曳主角上的配件到喜歡的位置，放開後會自動保存。" : "配件可以同時裝備，不同配件也能放在你喜歡的位置。"}</p></div>
      <div class="accessory-layout-actions">
        <button class="small-action ${accessoryEditMode ? "button-primary" : ""}" data-action="toggle-accessory-editor">${accessoryEditMode ? "完成調整" : "調整位置"}</button>
        ${accessoryEditMode ? `<button class="small-action button-quiet" data-action="reset-accessory-positions">回復預設</button>` : ""}
      </div>
    </section>
  `;
}

export function renderHome(container, save, options = {}) {
  const accessoryEditMode = options.accessoryEditMode === true;
  const jellyfish = save.jellyfish;
  const stage = getCurrentStage(save);
  const nextStage = getNextStage(save);
  const scene = getScene(jellyfish.equippedScene);
  const expRequired = getExpRequired(jellyfish.level);
  const stageProgress = getStageProgress(save);
  const intimacyForBar = nextStage ? Math.min(jellyfish.intimacy, nextStage.intimacy) : 200;
  const intimacyBarMax = nextStage ? nextStage.intimacy : 200;
  const canPet = save.daily.petCount < GAME_CONFIG.petDailyLimit && save.daily.intimacyEarned < GAME_CONFIG.dailyIntimacyLimit;
  const canChat = save.daily.chatCount < GAME_CONFIG.chatDailyLimit && save.daily.intimacyEarned < GAME_CONFIG.dailyIntimacyLimit;

  container.innerHTML = `
    <div class="view-heading home-heading">
      <div>
        <span class="eyebrow">JELLY LAB · 今日研究紀錄</span>
        <h1>${escapeHtml(jellyfish.name)}的水母養成所</h1>
        <p>每一次回來，都是牠長大的證明。</p>
      </div>
      <div class="stage-pill"><span class="status-dot"></span> ${stage.name}</div>
    </div>

    <div class="home-layout">
      <section class="jelly-card glass-card">
        <div class="jelly-card-header">
          <div>
            <span class="card-kicker">現在陪伴你的</span>
            <h2>${escapeHtml(getSkin(jellyfish.equippedSkin).name)}</h2>
          </div>
          <span class="level-orb">LV.${jellyfish.level}</span>
        </div>

        <div id="jelly-stage" class="jelly-stage ${scene.cssClass}" data-stage="${stage.stage}">
          <span class="scene-label">${scene.icon} ${scene.name}</span>
          <span class="bubble bubble-a"></span>
          <span class="bubble bubble-b"></span>
          <span class="bubble bubble-c"></span>
          <span class="star star-a">✦</span>
          <span class="star star-b">✦</span>
          <div id="jelly-display" class="jelly-display">
            ${renderJellyfish(save, { accessoryEditMode })}
          </div>
        </div>

        ${renderAccessoryLayoutControls(save, accessoryEditMode)}

        <div class="jelly-card-footer">
          <div>
            <span class="card-kicker">成長階段 ${stage.stage} / 5</span>
            <strong>${stage.description}</strong>
          </div>
          ${nextStage ? `<span class="next-stage-mini">下一階段：${nextStage.name}</span>` : `<span class="max-badge">已抵達星海</span>`}
        </div>
      </section>

      <section class="home-side">
        <div class="stats-grid">
          <article class="stat-card level-stat">
            <span class="stat-icon">↗</span>
            <span class="stat-label">水母等級</span>
            <strong>LV.${jellyfish.level}</strong>
            <small>${jellyfish.level >= GAME_CONFIG.maxLevel ? "已達最高等級" : `下一級需要 ${formatNumber(expRequired)} EXP`}</small>
          </article>
          <article class="stat-card point-stat">
            <span class="stat-icon">✦</span>
            <span class="stat-label">養成點數</span>
            <strong>${formatNumber(save.player.points)}</strong>
            <small>可在商店使用</small>
          </article>
        </div>

        <article class="glass-card meter-card">
          <div class="meter-section">
            ${jellyfish.level >= GAME_CONFIG.maxLevel ? `
              <div class="progress-label-row"><span>EXP</span><strong class="max-text">MAX</strong></div>
              <div class="progress-track tone-purple"><span style="width:100%"></span></div>
            ` : progressBar(jellyfish.exp, expRequired, "EXP", "purple")}
          </div>
          <div class="meter-section">
            ${progressBar(intimacyForBar, intimacyBarMax, "親密度", "pink")}
            <small class="meter-hint">${nextStage ? `距離${nextStage.name}還差 ${Math.max(0, nextStage.intimacy - jellyfish.intimacy)} 點` : "你們已經一起抵達星海"}</small>
          </div>
        </article>

        <article class="glass-card interaction-card">
          <div class="interaction-heading">
            <div>
              <span class="card-kicker">今日互動</span>
              <h2>和${escapeHtml(jellyfish.name)}待一會</h2>
            </div>
            <div class="daily-count"><strong>${save.daily.intimacyEarned}</strong><span>/ ${GAME_CONFIG.dailyIntimacyLimit} 親密度</span></div>
          </div>
          <div class="daily-progress"><span style="width:${Math.min(100, (save.daily.intimacyEarned / GAME_CONFIG.dailyIntimacyLimit) * 100)}%"></span></div>
          <div class="interaction-actions">
            <button class="action-button action-primary" data-action="pet" ${canPet ? "" : "disabled"}>
              <span>♡</span><span>摸摸</span><small>${save.daily.petCount} / ${GAME_CONFIG.petDailyLimit}</small>
            </button>
            <button class="action-button action-secondary" data-action="chat" ${canChat ? "" : "disabled"}>
              <span>◌</span><span>聊聊天</span><small>${save.daily.chatCount} / ${GAME_CONFIG.chatDailyLimit}</small>
            </button>
            <button class="action-button action-tertiary" data-action="go-inventory">
              <span>🍰</span><span>餵食</span><small>打開背包</small>
            </button>
          </div>
          <p class="interaction-note">每日凌晨重置互動次數 · 今天還能獲得 ${Math.max(0, GAME_CONFIG.dailyIntimacyLimit - save.daily.intimacyEarned)} 點親密度</p>
        </article>

        <article class="glass-card evolution-card">
          <div class="section-title-row">
            <div><span class="card-kicker">長大路線</span><h2>五階段進化</h2></div>
            <span class="stage-number">${stage.stage} / 5</span>
          </div>
          ${renderStageTrack(save)}
          ${nextStage ? `
            <div class="evolution-requirement">
              <div><span>下一階段</span><strong>${nextStage.name}</strong></div>
              <div class="requirement-tags">
                <span class="requirement-tag ${jellyfish.level >= nextStage.level ? "is-done" : ""}">${jellyfish.level >= nextStage.level ? "✓" : "○"} LV${nextStage.level}</span>
                <span class="requirement-tag ${jellyfish.intimacy >= nextStage.intimacy ? "is-done" : ""}">${jellyfish.intimacy >= nextStage.intimacy ? "✓" : "○"} 親密 ${jellyfish.intimacy} / ${nextStage.intimacy}</span>
              </div>
            </div>
            <div class="dual-progress">
              <span style="width:${stageProgress.levelRatio * 100}%"></span>
              <span style="width:${stageProgress.intimacyRatio * 100}%"></span>
            </div>
          ` : `<p class="max-stage-note">✨ 所有成長條件都已完成，這就是你們的星海。</p>`}
        </article>
      </section>
    </div>
  `;
}

function normalizeUiQuantity(value, fallback = QUANTITY_CONFIG.default) {
  const raw = String(value ?? "").trim();

  if (!/^\d+$/.test(raw)) {
    return Math.min(QUANTITY_CONFIG.max, Math.max(QUANTITY_CONFIG.min, fallback));
  }

  const number = Number(raw);
  if (!Number.isFinite(number)) {
    return Math.min(QUANTITY_CONFIG.max, Math.max(QUANTITY_CONFIG.min, fallback));
  }

  return Math.min(QUANTITY_CONFIG.max, Math.max(QUANTITY_CONFIG.min, Math.floor(number)));
}

function renderQuantitySelector({ quantity, max = QUANTITY_CONFIG.max, itemId, decreaseAction, increaseAction, inputAction, label = "數量" }) {
  const safeMax = Math.max(QUANTITY_CONFIG.min, Math.min(QUANTITY_CONFIG.max, Number(max) || QUANTITY_CONFIG.min));
  const safeQuantity = Math.min(safeMax, normalizeUiQuantity(quantity));

  return `
    <div class="quantity-control" aria-label="${label}">
      <button type="button" class="quantity-step" data-action="${decreaseAction}" data-item-id="${itemId}" aria-label="${label}減少">−</button>
      <input type="number" min="${QUANTITY_CONFIG.min}" max="${safeMax}" step="1" inputmode="numeric" value="${safeQuantity}" data-action="${inputAction}" data-item-id="${itemId}" aria-label="${label}，${itemId}" />
      <button type="button" class="quantity-step" data-action="${increaseAction}" data-item-id="${itemId}" aria-label="${label}增加">＋</button>
    </div>
  `;
}

function getShopAffordableQuantity(save, item) {
  if (item.price <= 0) {
    return QUANTITY_CONFIG.max;
  }

  return Math.min(QUANTITY_CONFIG.max, Math.floor(Math.max(0, save.player.points) / item.price));
}

function renderShopVisual(save, item) {
  if (item.type === "skin") {
    return `<div class="item-visual skin-preview">${renderJellyfish(save, { skinId: item.id, accessoryId: null, actionClass: "preview-character" })}</div>`;
  }

  if (item.type === "accessory") {
    return `<div class="item-visual accessory-preview"><span>${item.icon}</span><small>Overlay</small></div>`;
  }

  if (item.type === "scene") {
    return `<div class="item-visual scene-preview ${item.cssClass}"><span>${item.icon}</span></div>`;
  }

  if (["weapon", "recovery", "ointment"].includes(item.type)) {
    const detail = item.type === "weapon" ? `${item.damage} Damage` : item.type === "recovery" ? `HP +${item.heal}` : "乳霜 · 解除癢";
    return `
      <div class="item-visual battle-item-preview battle-${item.category}">
        <div class="battle-item-content">
          <div class="battle-item-visual-wrapper">${renderBattleItemVisual(item)}</div>
          <div class="battle-item-damage">${detail}</div>
        </div>
      </div>
    `;
  }

  return `<div class="item-visual food-preview"><span>${item.icon}</span><small>+${item.exp} EXP</small></div>`;
}

function renderShopCard(save, item, shopQuantities = {}) {
  const status = getItemStatus(save, item);
  const requiredLevel = item.requiredLevel || 1;
  const isLocked = status.kind === "locked";
  const isOwned = status.kind === "owned" || status.kind === "equipped";
  const isBattleItem = ["weapon", "recovery", "ointment"].includes(item.type);
  const isStackable = isRepeatableItem(item);
  const quantity = isStackable ? normalizeUiQuantity(shopQuantities[item.id] || QUANTITY_CONFIG.default) : 1;
  const affordableMax = getShopAffordableQuantity(save, item);
  const totalPrice = item.price * quantity;
  const totalInsufficient = totalPrice > save.player.points;
  const canPurchase = !isLocked && !isOwned && !totalInsufficient && status.kind === "available";
  const itemDetail = item.type === "food"
    ? `EXP +${item.exp}`
    : isBattleItem
      ? item.type === "weapon" ? `傷害 ${item.damage}` : item.type === "recovery" ? `回血 +${item.heal}` : "乳霜 · 解除癢"
      : `LV${requiredLevel} 解鎖`;
  let actionLabel = status.label;

  if (canPurchase) {
    actionLabel = item.price === 0 ? "免費取得" : isStackable ? `購買 ×${quantity}` : `購買 · ${formatNumber(item.price)}`;
  } else if (!isLocked && !isOwned && totalInsufficient && isStackable) {
    actionLabel = `還差 ${formatNumber(totalPrice - save.player.points)} 點`;
  }

  const stockQuantity = isBattleItem ? getBattleItemQuantity(save, item) : item.type === "food" ? getFoodQuantity(save, item.id) : null;
  const ownedText = isStackable ? `<span class="battle-stock shop-stock">目前庫存 ×${stockQuantity}</span>` : "";
  const actionKind = canPurchase ? "available" : totalInsufficient && !isLocked && !isOwned ? "insufficient" : status.kind;

  return `
    <article class="shop-card ${isLocked ? "is-locked" : ""} ${isOwned ? "is-owned" : ""} ${isBattleItem ? "is-battle-item" : ""}" style="--item-accent:${item.accent || "#69c6dc"}">
      ${renderShopVisual(save, item)}
      <div class="item-copy">
        <div class="item-title-row"><h3>${item.icon && !isBattleItem ? `${item.icon} ` : ""}${item.name}</h3>${status.kind === "equipped" ? "<span class=inline-check>✓</span>" : ""}</div>
        <p>${item.description}</p>
        <div class="item-meta"><span>${itemDetail}</span><strong>${item.price === 0 ? "免費" : `✦ ${formatNumber(item.price)}`}</strong></div>
        ${ownedText}
        ${isStackable ? `
          <div class="shop-quantity-section">
            <div class="quantity-heading"><span>數量</span><button type="button" class="max-quantity-button" data-action="shop-quantity-max" data-item-id="${item.id}" ${affordableMax < 1 ? "disabled" : ""}>MAX</button></div>
            ${renderQuantitySelector({ quantity, max: QUANTITY_CONFIG.max, itemId: item.id, decreaseAction: "shop-quantity-decrease", increaseAction: "shop-quantity-increase", inputAction: "shop-quantity-input" })}
            <div class="quantity-total"><span>總價</span><strong>✦ ${formatNumber(totalPrice)}</strong></div>
            ${totalInsufficient ? `<small class="quantity-warning">還差 ${formatNumber(totalPrice - save.player.points)} 點</small>` : ""}
          </div>
        ` : ""}
      </div>
      <button class="item-action ${actionKind} ${isLocked || isOwned ? "is-static" : ""}" data-action="purchase" data-id="${item.id}" data-quantity="${quantity}" ${!canPurchase ? "disabled" : ""}>
        ${isLocked ? `🔒 LV${requiredLevel} 解鎖` : actionLabel}
      </button>
    </article>
  `;
}

export function renderShop(container, save, category, shopQuantities = {}) {
  const items = getShopItems(category);
  const isBattleShop = category === "battle";
  const heading = isBattleShop ? "戰鬥商店" : "養成商店";
  const description = isBattleShop ? "準備戰鬥用品，挑戰老化怪獸。" : "用養成點數，為你的水母準備下一段成長。";
  const intro = isBattleShop
    ? "基本的水母撞擊不需要道具；戰鬥用品會在每場挑戰中消耗。"
    : category === "food"
      ? "每一口都會轉化成 EXP。"
      : category === "skin"
        ? "解鎖一個造型，就多認識水母一點。"
      : category === "accessory"
          ? "可同時裝備多件配件，回到養成區拖曳調整位置。"
          : "只改變角色區，保留你熟悉的 Jelly Lab。";

  container.innerHTML = `
    <div class="view-heading">
      <div><span class="eyebrow">JELLY LAB · ${isBattleShop ? "BATTLE SUPPLY" : "SUPPLY ROOM"}</span><h1>${heading}</h1><p>${description}</p></div>
      <div class="points-balance"><span>目前點數</span><strong>✦ ${formatNumber(save.player.points)}</strong></div>
    </div>
    <div class="category-tabs" role="tablist" aria-label="商店分類">
      ${SHOP_CATEGORIES.map((categoryItem) => `<button role="tab" aria-selected="${categoryItem.id === category}" class="category-tab ${categoryItem.id === category ? "is-active" : ""}" data-action="shop-category" data-category="${categoryItem.id}">${categoryItem.label}</button>`).join("")}
    </div>
    <div class="shop-intro ${isBattleShop ? "battle-shop-intro" : ""}"><span class="intro-spark">${isBattleShop ? "⚔️" : "✦"}</span><span>${intro}</span></div>
    ${isBattleShop ? BATTLE_SHOP_GROUPS.map((group) => `
      <section class="shop-group battle-shop-group">
        <div class="shop-group-heading"><div><span class="card-kicker">BATTLE LOADOUT</span><h2>${group.label}</h2></div><span>${group.hint}</span></div>
        <div class="item-grid shop-grid">${items.filter((item) => item.category === group.id).map((item) => renderShopCard(save, item, shopQuantities)).join("")}</div>
      </section>
    `).join("") : `<div class="item-grid shop-grid">${items.map((item) => renderShopCard(save, item, shopQuantities)).join("")}</div>`}
  `;
}

function renderInventoryVisual(save, item, category) {
  if (category === "food") {
    return `<div class="inventory-icon food-icon">${item.icon}</div>`;
  }

  if (category === "skin") {
    return `<div class="inventory-icon skin-inventory-preview">${renderJellyfish(save, { skinId: item.id, accessoryId: null, actionClass: "preview-character" })}</div>`;
  }

  if (category === "accessory") {
    return `<div class="inventory-icon accessory-icon">${item.icon}</div>`;
  }

  if (category === "battle") {
    return `<div class="inventory-icon battle-inventory-icon battle-${item.category}">${renderBattleItemVisual(item, { compact: true })}</div>`;
  }

  return `<div class="inventory-icon scene-inventory-preview ${item.cssClass}">${item.icon}</div>`;
}

function renderInventoryCard(save, item, category) {
  const quantity = category === "food" ? getFoodQuantity(save, item.id) : category === "battle" ? getBattleItemQuantity(save, item) : null;
  const equipped = isEquipped(save, item);
  const isAccessory = category === "accessory";
  const action = category === "food" ? "feed" : category === "battle" ? "go-challenge" : category === "skin" ? "equip-skin" : category === "accessory" ? "equip-accessory" : "equip-scene";
  const buttonLabel = category === "food" ? "餵食" : category === "battle" ? "前往挑戰" : isAccessory ? equipped ? "卸下" : "裝備" : equipped ? "使用中" : "裝備";
  const itemDescription = category === "food"
    ? `EXP +${item.exp} · ${item.description}`
    : category === "battle"
      ? item.type === "weapon" ? `傷害 ${item.damage} · ${item.description}` : item.type === "recovery" ? `HP +${item.heal} · ${item.description}` : item.description
      : isAccessory ? `可自由移動 · ${item.description}` : item.description;

  return `
    <article class="inventory-card ${equipped ? "is-equipped" : ""} ${category === "battle" ? "is-battle-inventory" : ""}">
      ${renderInventoryVisual(save, item, category)}
      <div class="inventory-copy"><h3>${item.icon && category !== "skin" && category !== "scene" && category !== "battle" ? `${item.icon} ` : ""}${item.name}</h3><p>${itemDescription}</p></div>
      <div class="inventory-actions">
        ${category === "food" || category === "battle" ? `<span class="quantity-badge">×${quantity}</span>` : equipped ? `<span class="equipped-label">${isAccessory ? "✓ 已裝備" : "✓ 使用中"}</span>` : ""}
        <button class="small-action ${equipped ? "is-selected" : ""}" data-action="${action}" data-id="${item.id}" ${equipped && !isAccessory ? "disabled" : ""}>${buttonLabel}</button>
      </div>
    </article>
  `;
}

function renderRewards(container, save) {
  const progress = save.bossProgress.agingMonster;
  const coupons = getRewardItems(save);
  const pending = progress.defeated && !progress.rewardClaimed;
  const reward = REWARDS_CONFIG.agingMonsterCoupon;

  container.innerHTML = `
    <div class="view-heading"><div><span class="eyebrow">JELLY LAB · REWARD ARCHIVE</span><h1>我的獎勵</h1><p>擊敗 Boss 後取得的虛擬獎勵會保存在這裡。</p></div><div class="locker-mark">🎫</div></div>
    <div class="category-tabs inventory-tabs" role="tablist" aria-label="背包分類">
      ${Object.entries({ food: "食物", battle: "戰鬥用品", skin: "水母造型", accessory: "配件", scene: "場景", rewards: "我的獎勵" }).map(([id, label]) => `<button role="tab" aria-selected="${id === "rewards"}" class="category-tab ${id === "rewards" ? "is-active" : ""}" data-action="inventory-category" data-category="${id}">${label}</button>`).join("")}
    </div>
    <section class="reward-summary glass-card"><div><span class="card-kicker">BOSS 戰績</span><h2>老化怪獸</h2></div><div class="reward-summary-stats"><span>通關 <strong>${progress.clearCount}</strong> 次</span><span>${progress.rewardClaimed ? "首勝獎勵已領取" : progress.defeated ? "首勝獎勵待領取" : "尚未通關"}</span></div></section>
    ${pending ? `<article class="reward-card reward-pending"><div class="reward-card-icon">${reward.icon}</div><div><span class="card-kicker">首次通關獎勵</span><h2>NT$${reward.value} 折價券</h2><p>老化怪獸已被擊敗，現在可以領取虛擬折價券。</p></div><button class="small-action" data-action="claim-boss-reward">領取獎勵</button></article>` : ""}
    ${coupons.length ? `<div class="reward-list">${coupons.map((coupon) => `<article class="reward-card"><div class="reward-card-icon">${escapeHtml(coupon.icon || "🎫")}</div><div><span class="card-kicker">虛擬優惠獎勵</span><h2>NT$${formatNumber(coupon.value)}</h2><p>${escapeHtml(coupon.name)} · 正式版本將串接官網優惠券系統</p></div><span class="equipped-label">✓ 已領取</span></article>`).join("")}</div>` : pending ? "" : `<div class="empty-state"><span>🎫</span><h2>還沒有獎勵</h2><p>挑戰老化怪獸，取得首次通關的 NT$600 虛擬折價券。</p><button class="outline-button" data-action="go-challenge">前往挑戰</button></div>`}
  `;
}

export function renderInventory(container, save, category) {
  const items = category === "rewards" ? [] : getInventoryItems(save, category);
  const categoryLabels = { food: "食物", battle: "戰鬥用品", skin: "水母造型", accessory: "配件", scene: "場景", rewards: "我的獎勵" };
  const emptyCopy = {
    food: "去商店準備一點好吃的，水母會期待你回來。",
    battle: "去戰鬥商店準備膠囊、飲料與乳霜。",
    skin: "去商店解鎖第一個新造型吧。",
    accessory: "研究室還有一些配件等你發現。",
    scene: "換個場景，讓角色區有新的心情。",
    rewards: "完成 Boss 挑戰後，虛擬折價券會出現在這裡。"
  };

  if (category === "rewards") {
    renderRewards(container, save);
    return;
  }

  container.innerHTML = `
    <div class="view-heading"><div><span class="eyebrow">JELLY LAB · PERSONAL LOCKER</span><h1>我的背包</h1><p>所有已取得的物品，都在這裡等你使用。</p></div><div class="locker-mark">🎒</div></div>
    <div class="category-tabs inventory-tabs" role="tablist" aria-label="背包分類">
      ${Object.entries(categoryLabels).map(([id, label]) => `<button role="tab" aria-selected="${id === category}" class="category-tab ${id === category ? "is-active" : ""}" data-action="inventory-category" data-category="${id}">${label}</button>`).join("")}
    </div>
    ${category === "accessory" ? `<section class="accessory-locker-tip glass-card"><div><span class="card-kicker">FREE ACCESSORY LAYOUT</span><h2>自由裝備與移動</h2><p>所有已購買的配件都能一起裝備，並在養成區直接拖曳調整位置。</p></div><button class="small-action" data-action="go-home-accessory-editor">前往調整</button></section>` : ""}
    <div class="inventory-summary"><span>${categoryLabels[category]}</span><strong>${items.length} 項</strong></div>
    ${items.length ? `<div class="inventory-list">${items.map((item) => renderInventoryCard(save, item, category)).join("")}</div>` : `<div class="empty-state"><span>${category === "food" ? "🍽️" : "🫧"}</span><h2>這裡還是空的</h2><p>${emptyCopy[category]}</p><button class="outline-button" data-action="go-shop">前往商店</button></div>`}
  `;
}

function renderBattleHpBar(current, max, label) {
  const safeMax = Math.max(1, Number(max) || 1);
  const safeCurrent = Math.min(safeMax, Math.max(0, Number(current) || 0));
  const percentage = (safeCurrent / safeMax) * 100;

  return `
    <div class="battle-hp-label"><span>${label}</span><strong>${formatNumber(safeCurrent)} / ${formatNumber(safeMax)}</strong></div>
    <div class="battle-hp-track" role="progressbar" aria-label="${label}" aria-valuenow="${safeCurrent}" aria-valuemin="0" aria-valuemax="${safeMax}"><span style="width:${percentage}%"></span></div>
  `;
}

function getBattleItemDisplayName(type, fallback) {
  return BATTLE_SHOP_ITEMS.find((item) => item.type === type)?.name || fallback;
}

function renderBattlePrep(save) {
  const boss = getBossForDisplay();
  const itemSummary = getBattleInventorySummary(save);
  const hasItems = itemSummary.some((item) => item.quantity > 0);
  const progress = save.bossProgress.agingMonster;
  const recoveryName = getBattleItemDisplayName("recovery", "PPT+1");
  const ointmentName = getBattleItemDisplayName("ointment", "PPA+1");

  return `
    <div class="view-heading challenge-heading">
      <div><span class="eyebrow">JELLY LAB · BOSS ENCOUNTER</span><h1>⚔️ BOSS 挑戰</h1><p>帶著你的水母，和老化怪獸進行一場輕量回合制挑戰。</p></div>
      <div class="challenge-record"><span>通關紀錄</span><strong>${progress.clearCount} 次</strong></div>
    </div>
    <div class="battle-prep-layout">
      <section class="battle-prep-hero glass-card">
        <div class="battle-card-topline"><span class="card-kicker">BOSS CHALLENGE PREP</span><span class="boss-level-pill">FIRST BOSS</span></div>
        <div class="prep-boss-visual">
          <span class="boss-aura"></span><span class="boss-icon">${boss.icon}</span><span class="boss-clock">◷</span>
        </div>
        <div class="prep-boss-copy"><span class="card-kicker">TIMEWORN CREATURE</span><h2>${boss.name}</h2><p>${boss.description}</p></div>
        <div class="prep-boss-hp">${renderBattleHpBar(boss.maxHp, boss.maxHp, "BOSS HP")}</div>
        <div class="battle-attack-preview"><span class="card-kicker">可能攻擊</span><div>${boss.attacks.map((attack) => `<span class="attack-chip attack-${attack.status || "normal"}">${attack.icon} ${attack.name}</span>`).join("")}</div></div>
      </section>

      <section class="battle-prep-loadout glass-card">
        <div class="section-title-row"><div><span class="card-kicker">MY LOADOUT</span><h2>我的戰鬥用品</h2></div><span class="locker-mark">🎒</span></div>
        <div class="prep-loadout-list">
          ${BATTLE_SHOP_GROUPS.map((group) => `
            <div class="prep-loadout-group"><span>${group.label}</span><div>${itemSummary.filter((item) => item.category === group.id).map((item) => `<span class="loadout-count">${item.name} <strong>×${item.quantity}</strong></span>`).join("")}</div></div>
          `).join("")}
        </div>
        <p class="battle-prep-hint ${hasItems ? "" : "is-warning"}">${hasItems ? "戰鬥用品會在每次使用後消耗，記得依狀態做出選擇。" : "目前沒有攜帶戰鬥用品，挑戰難度會提高，但仍可使用免費的水母撞擊。"}</p>
        <div class="battle-prep-tip">💡 老化怪獸可能造成癢與視野模糊，記得準備 ${ointmentName} 與 ${recoveryName}。</div>
        <div class="prep-actions"><button class="outline-button" data-action="go-battle-shop">前往戰鬥商店</button><button class="start-button battle-start-button" data-action="start-battle"><span>開始挑戰</span><span>→</span></button></div>
      </section>
    </div>
  `;
}

function renderBattleActionItem(save, battle, item, canAct, battleActionSelection) {
  const quantity = getBattleItemQuantity(save, item);
  const isWeapon = item.type === "weapon";
  const isRecovery = item.type === "recovery";
  const isOintment = item.type === "ointment";
  const limits = getBattleActionQuantityLimits(battle, save, item);
  const blockedByEffect = isRecovery
    ? battle.player.hp >= battle.player.maxHp && !battle.player.status.blurred
    : isOintment && !battle.player.status.itchy;
  const disabled = !canAct || limits.max <= 0;
  const statusHint = quantity <= 0 ? "無庫存" : blockedByEffect ? isRecovery ? "HP 已滿" : "無癢可解" : battleActionSelection?.itemId === item.id ? "收起" : "選擇";
  const highlight = (isRecovery && battle.player.status.blurred) || (isOintment && battle.player.status.itchy);
  const detail = isWeapon ? `${item.damage} Damage` : isRecovery ? `HP +${item.heal} · 解模糊` : "乳霜 · 解除癢";
  const isSelected = canAct && battleActionSelection?.itemId === item.id && limits.max > 0;
  const selectedQuantity = isSelected ? Math.min(limits.max, normalizeUiQuantity(battleActionSelection.quantity)) : 1;
  const expectedValue = isWeapon
    ? item.damage * selectedQuantity
    : isRecovery
      ? Math.min(Math.max(0, battle.player.maxHp - battle.player.hp), item.heal * selectedQuantity)
      : 0;

  return `
    <article class="battle-action-item ${highlight ? "is-recommended" : ""} ${quantity <= 0 ? "is-empty" : ""} ${isSelected ? "is-open" : ""}">
      <div class="battle-item-icon battle-${item.category}">${renderBattleItemVisual(item, { compact: true })}</div>
      <div class="battle-item-copy"><strong>${item.name} ×${quantity}</strong><span>${detail}</span></div>
      <button class="battle-use-button" data-action="battle-open-action" data-battle-action="${item.id}" ${disabled ? "disabled" : ""}>${statusHint}</button>
      ${isSelected ? `
        <div class="battle-action-panel">
          <div class="battle-action-panel-heading"><strong>使用 ${item.name}</strong><span>庫存 ×${quantity}</span></div>
          <div class="battle-action-panel-meta"><span>${isWeapon ? `單顆 Damage：${item.damage}` : isRecovery ? `每罐 HP +${item.heal}` : "乳霜 · 固定使用 1 個"}</span><strong>${isWeapon ? `預計 Damage：${expectedValue}` : isRecovery ? `預計回血：+${expectedValue} HP` : "狀態解除"}</strong></div>
          ${isOintment ? `<div class="battle-single-quantity">使用數量：<strong>1</strong></div>` : renderQuantitySelector({ quantity: selectedQuantity, max: limits.max, itemId: item.id, decreaseAction: "battle-quantity-decrease", increaseAction: "battle-quantity-increase", inputAction: "battle-quantity-input", label: "戰鬥使用數量" })}
          <div class="battle-action-panel-actions"><button type="button" class="battle-cancel-button" data-action="battle-cancel-action">取消</button><button type="button" class="battle-confirm-button" data-action="battle-confirm-action" data-battle-action="${item.id}" data-quantity="${selectedQuantity}">使用 ${item.name} ×${selectedQuantity}</button></div>
        </div>
      ` : ""}
    </article>
  `;
}

function renderBattleEffect(effect) {
  if (!effect) return "";

  if (effect.type === "heal") {
    return `<span class="battle-effect-number effect-heal">+${effect.amount}</span>`;
  }

  if (effect.type === "miss") {
    return `<span class="battle-effect-number effect-miss">MISS</span>`;
  }

  return `<span class="battle-effect-number effect-damage">-${effect.amount}</span>`;
}

function renderBattleStatus(battle) {
  const { itchy, blurred } = battle.player.status;
  const suggestions = [];
  if (itchy) suggestions.push(`建議使用 ${getBattleItemDisplayName("ointment", "PPA+1")}`);
  if (blurred) suggestions.push(`建議使用 ${getBattleItemDisplayName("recovery", "PPT+1")}`);

  return `
    <section class="battle-status-card glass-card">
      <div class="battle-status-title"><span class="card-kicker">CURRENT STATUS</span><strong>${itchy || blurred ? "需要留意" : "狀態正常"}</strong></div>
      <div class="battle-status-chips">${itchy ? "<span class=\"status-chip is-itchy\">🔴 癢</span>" : ""}${blurred ? "<span class=\"status-chip is-blurred\">👁️ 視野模糊</span>" : ""}${!itchy && !blurred ? "<span class=\"status-chip is-normal\">🟢 狀態正常</span>" : ""}</div>
      ${suggestions.length ? `<p class="battle-status-suggestion">${suggestions.join(" · ")}</p>` : ""}
    </section>
  `;
}

function renderBattleScene(save, battle, battleActionSelection) {
  const boss = getBossForDisplay(battle.bossId);
  const canAct = battle.phase === "player" && !battle.actionLocked;
  const phaseLabel = battle.phase === "boss" ? "老化怪獸回合" : battle.actionLocked ? "行動處理中…" : battle.phase === "won" ? "挑戰成功" : battle.phase === "lost" ? "挑戰失敗" : "你的回合";
  const bossAnimation = ["capsule-fly", "player-bump", "boss-defeated"].includes(battle.lastAnimation) ? "is-hurt" : "";
  const bossAttackAnimation = battle.lastAnimation === "boss-turn" ? "is-attacking" : "";
  const playerAnimation = battle.lastAnimation === "player-hit" ? "battle-player-hit" : battle.lastAnimation === "player-itchy" ? "battle-player-itchy" : battle.lastAnimation === "player-heal" ? "battle-player-heal" : battle.lastAnimation === "player-cure" ? "battle-player-cure" : "";
  const playerEffect = battle.lastEffect?.target === "player" ? renderBattleEffect(battle.lastEffect) : "";
  const bossEffect = battle.lastEffect?.target === "boss" ? renderBattleEffect(battle.lastEffect) : "";
  const weapons = BATTLE_SHOP_ITEMS.filter((item) => item.category === "weapon");
  const recovery = BATTLE_SHOP_ITEMS.filter((item) => item.category !== "weapon");
  const resultBanner = battle.phase === "won"
    ? `<div class="battle-result-banner is-victory"><strong>🎉 老化怪獸已被擊敗！</strong><div><button class="small-action" data-action="battle-retry">再次挑戰</button><button class="small-action" data-action="battle-return-home">回到養成</button></div></div>`
    : battle.phase === "lost"
      ? `<div class="battle-result-banner is-defeat"><strong>這次先休息一下，再試一次吧。</strong><div><button class="small-action" data-action="battle-retry">再次挑戰</button><button class="small-action" data-action="battle-return-home">回到養成</button></div></div>`
      : "";

  return `
    <div class="view-heading challenge-heading battle-heading">
      <div><span class="eyebrow">JELLY LAB · LIVE BATTLE</span><h1>⚔️ 對戰中</h1><p>回合 ${battle.turn} · ${phaseLabel}</p></div>
      <button class="outline-button battle-exit-button" data-action="battle-exit">離開戰鬥</button>
    </div>
    <div class="battle-screen">
      <div class="battle-arena ${battle.player.status.blurred ? "is-blurred" : ""}">
        <div class="battle-fog" aria-hidden="true"></div>
        <article class="battle-combatant battle-boss-card">
          <div class="battle-combatant-heading"><div><span class="card-kicker">BOSS</span><h2>${boss.name}</h2></div><span class="boss-round-mark">◷</span></div>
          <div class="battle-boss-illustration ${bossAnimation} ${bossAttackAnimation}"><span class="boss-aura"></span><span class="boss-icon">${boss.icon}</span><span class="boss-clock">◷</span>${bossEffect}</div>
          ${renderBattleHpBar(battle.boss.hp, battle.boss.maxHp, "HP")}
        </article>
        <div class="battle-versus"><span>VS</span><i>✦</i></div>
        <article class="battle-combatant battle-player-card">
          <div class="battle-combatant-heading"><div><span class="card-kicker">YOUR JELLYFISH</span><h2>${escapeHtml(save.jellyfish.name)}</h2></div><span class="battle-turn-mark">🪼</span></div>
          <div class="battle-player-illustration ${battle.player.status.itchy ? "is-itchy" : ""}">${renderJellyfish(save, { actionClass: playerAnimation })}${playerEffect}</div>
          ${renderBattleHpBar(battle.player.hp, battle.player.maxHp, "HP")}
        </article>
      </div>

      ${renderBattleStatus(battle)}

      <div class="battle-columns">
        <section class="battle-actions-card glass-card">
          <div class="section-title-row"><div><span class="card-kicker">PLAYER ACTION</span><h2>攻擊</h2></div><span class="turn-label">${phaseLabel}</span></div>
          <button class="basic-battle-action" data-action="battle-action" data-battle-action="basic_bump" ${canAct ? "" : "disabled"}><span>🪼</span><div><strong>水母撞擊</strong><small>Damage ${BATTLE_CONFIG.basicAttack.damage} · 免費</small></div><b>使用</b></button>
          <div class="battle-control-group"><span class="battle-control-label">膠囊武器</span>${weapons.map((item) => renderBattleActionItem(save, battle, item, canAct, battleActionSelection)).join("")}</div>
          <div class="battle-control-group"><span class="battle-control-label">回復道具</span>${recovery.map((item) => renderBattleActionItem(save, battle, item, canAct, battleActionSelection)).join("")}</div>
        </section>
        <aside class="battle-log-card glass-card" aria-live="polite">
          <div class="section-title-row"><div><span class="card-kicker">BATTLE LOG</span><h2>戰鬥紀錄</h2></div><span class="log-limit-label">最近 ${BATTLE_CONFIG.logLimit} 筆</span></div>
          <ol class="battle-log-list">${battle.log.map((entry, index) => `<li class="${index === battle.log.length - 1 ? "is-latest" : ""}"><span>${String(index + 1).padStart(2, "0")}</span><p>${escapeHtml(entry)}</p></li>`).join("")}</ol>
        </aside>
      </div>
      ${resultBanner}
    </div>
  `;
}

export function renderChallenge(container, save, battle, battleActionSelection = null) {
  container.innerHTML = battle ? renderBattleScene(save, battle, battleActionSelection) : renderBattlePrep(save);
}

function renderCollectionCard(save, skin) {
  const collected = isCollected(save, skin.id);
  const current = save.jellyfish.equippedSkin === skin.id;
  return `
    <article class="collection-card ${collected ? "is-collected" : "is-locked"} ${current ? "is-current" : ""}">
      <div class="collection-art ${collected ? "" : "locked-art"}">${renderJellyfish(save, { skinId: skin.id, accessoryId: null, actionClass: "preview-character" })}${!collected ? "<span class=lock-overlay>🔒</span>" : ""}</div>
      <div class="collection-copy"><span class="collection-index">${String(skin.id === "normal" ? 1 : skin.requiredLevel).padStart(2, "0")}</span><h3>${collected ? skin.name : "???"}</h3><p>${collected ? skin.description : `達到 LV${skin.requiredLevel} 後可購買`}</p></div>
      <span class="collection-state">${current ? "✓ 使用中" : collected ? "✓ 已收集" : "尚未發現"}</span>
    </article>
  `;
}

export function renderCollection(container, save) {
  const progress = getCollectionProgress(save);
  const percentage = (progress.owned / progress.total) * 100;

  container.innerHTML = `
    <div class="view-heading"><div><span class="eyebrow">JELLY LAB · ARCHIVE</span><h1>水母圖鑑</h1><p>每一種造型，都是你們一起走過的證明。</p></div><div class="collection-count"><strong>${progress.owned}</strong><span>/ ${progress.total}</span></div></div>
    <section class="collection-progress glass-card"><div><span class="card-kicker">收集進度</span><h2>${progress.owned} / ${progress.total} 種水母</h2></div><strong>${Math.round(percentage)}%</strong><div class="progress-track tone-collection"><span style="width:${percentage}%"></span></div></section>
    <div class="collection-grid">${SKINS.map((skin) => renderCollectionCard(save, skin)).join("")}</div>
  `;
}

export function setOnboardingVisible(isVisible) {
  const onboarding = document.querySelector("#onboarding");
  const shell = document.querySelector("#game-shell");

  if (onboarding) onboarding.hidden = !isVisible;
  if (shell) shell.hidden = isVisible;
}

export function updateHeader(save) {
  const points = document.querySelector("#header-points");
  const name = document.querySelector("#header-jelly-name");

  if (points) points.textContent = formatNumber(save.player.points);
  if (name) name.textContent = save.jellyfish.name;
}

export function showToast(message, type = "info") {
  const region = document.querySelector("#toast-region");
  if (!region) return;

  const toast = document.createElement("div");
  toast.className = `toast toast-${type}`;
  toast.setAttribute("role", "status");
  toast.innerHTML = `<span class="toast-mark">${type === "success" ? "✓" : type === "warning" ? "!" : "✦"}</span><span>${escapeHtml(message)}</span>`;
  region.append(toast);

  window.setTimeout(() => {
    toast.classList.add("is-leaving");
    window.setTimeout(() => toast.remove(), 220);
  }, 2400);
}

export function closeModal() {
  const root = document.querySelector("#modal-root");
  if (root) root.innerHTML = "";
}

export function openModal({ title, eyebrow = "JELLY LAB", body, actions = [], className = "" }) {
  const root = document.querySelector("#modal-root");
  if (!root) return;

  root.innerHTML = `
    <div class="modal-backdrop">
      <section class="modal-card ${className}" role="dialog" aria-modal="true" aria-labelledby="modal-title">
        <button class="modal-close" type="button" data-action="close-modal" aria-label="關閉">×</button>
        <span class="eyebrow">${escapeHtml(eyebrow)}</span>
        <h2 id="modal-title">${title}</h2>
        <div class="modal-body">${body}</div>
        <div class="modal-actions"></div>
      </section>
    </div>
  `;

  const backdrop = root.querySelector(".modal-backdrop");
  const card = root.querySelector(".modal-card");
  const actionsRoot = root.querySelector(".modal-actions");

  backdrop?.addEventListener("click", (event) => {
    if (event.target === backdrop) closeModal();
  });

  actions.forEach((action, index) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = `modal-button ${action.className || (index === actions.length - 1 ? "button-primary" : "button-quiet")}`;
    button.textContent = action.label;
    button.addEventListener("click", (event) => {
      event.stopPropagation();
      closeModal();
      action.onClick?.();
    });
    actionsRoot?.append(button);
  });

  card?.querySelector(".modal-close")?.focus();
}

export function openConfirm({ title, body, confirmLabel = "確認", onConfirm, tone = "button-primary" }) {
  openModal({
    title,
    body,
    className: "confirm-modal",
    actions: [
      { label: "取消", className: "button-quiet" },
      { label: confirmLabel, className: tone, onClick: onConfirm }
    ]
  });
}

export function showLevelUpModal(save, fromLevel, toLevel, onClose) {
  openModal({
    eyebrow: "JELLY LAB · GROWTH LOG",
    title: "✨ LEVEL UP ✨",
    className: "level-up-modal",
    body: `<div class="level-up-number"><span>LV.${fromLevel}</span><b>→</b><strong>LV.${toLevel}</strong></div><p>${escapeHtml(save.jellyfish.name)}又長大了！牠正在朝下一片海域游去。</p><div class="level-up-stars">✦　✧　✦　✧　✦</div>`,
    actions: [{ label: "太好了！", className: "button-primary", onClick: onClose }]
  });
}

export function showPurchaseSuccess(item, onEquip, quantity = 1) {
  const canEquip = ["skin", "accessory", "scene"].includes(item.type);
  const quantityLabel = quantity > 1 || isRepeatableItem(item) ? ` ×${quantity}` : "";
  openModal({
    eyebrow: "JELLY LAB · NEW ARRIVAL",
    title: "🎉 購買成功！",
    className: "success-modal",
    body: `<div class="success-item"><span>${item.icon || "✦"}</span><strong>獲得：${item.name}${quantityLabel}</strong></div><p>${item.description}</p>`,
    actions: canEquip
      ? [{ label: "稍後", className: "button-quiet" }, { label: "立即裝備", className: "button-primary", onClick: onEquip }]
      : [{ label: "好的", className: "button-primary" }]
  });
}

export function showBattleVictoryModal(save, { firstClear = false, rewardClaimed = false, onClaim, onExit }) {
  const reward = REWARDS_CONFIG.agingMonsterCoupon;
  const canClaim = !rewardClaimed;
  const rewardMessage = canClaim
    ? firstClear
      ? "首次擊敗老化怪獸的獎勵已準備好。"
      : "這次仍可領取尚未領取的首次通關獎勵。"
    : "本 BOSS 首次通關獎勵已領取。";

  openModal({
    eyebrow: "JELLY LAB · VICTORY",
    title: "🎉 挑戰成功！",
    className: "battle-result-modal victory-modal",
    body: `<div class="battle-victory-art"><span>👾</span><b>✦</b></div><p>你擊敗了「老化怪獸」！</p><div class="battle-reward-highlight"><span>${reward.icon}</span><div><small>獲得虛擬獎勵</small><strong>NT$${formatNumber(reward.value)} 折價券</strong></div></div><p class="battle-reward-note">${rewardMessage}</p>`,
    actions: canClaim
      ? [{ label: "回到養成", className: "button-quiet", onClick: onExit }, { label: "領取獎勵", className: "button-primary", onClick: onClaim }]
      : [{ label: "回到養成", className: "button-primary", onClick: onExit }]
  });
}

export function showBattleDefeatModal(save, { onRetry, onExit }) {
  openModal({
    eyebrow: "JELLY LAB · BATTLE LOG",
    title: "挑戰失敗",
    className: "battle-result-modal defeat-modal",
    body: `<div class="battle-defeat-art"><span>🪼</span><b>…</b></div><p>${escapeHtml(save.jellyfish.name)}沒有力氣了……</p><p class="battle-reward-note">已使用的戰鬥用品不會返還，但下一場會重新恢復 HP 與狀態。</p>`,
    actions: [{ label: "返回養成", className: "button-quiet", onClick: onExit }, { label: "再次挑戰", className: "button-primary", onClick: onRetry }]
  });
}

export function renderDebugPanel(container, visible, save, battle = null, collapsed = false) {
  if (!visible) {
    container.hidden = true;
    container.innerHTML = "";
    return;
  }

  container.hidden = false;
  const battleDebugDisabled = !battle || battle.actionLocked || !["player", "boss"].includes(battle.phase);

  container.innerHTML = `
    <div class="debug-header"><span>DEBUG MODE</span><button data-action="toggle-debug" aria-label="${collapsed ? "展開 Debug" : "收合 Debug"}">${collapsed ? "+" : "−"}</button></div>
    <div class="debug-body">
      <p>只在網址含 <code>?debug=1</code> 時顯示</p>
      <div class="debug-group"><span>POINTS</span><div><button data-action="debug-points" data-amount="100">+100</button><button data-action="debug-points" data-amount="500">+500</button><button data-action="debug-points" data-amount="1000">+1000</button></div></div>
      <div class="debug-group"><span>EXP</span><div><button data-action="debug-exp" data-amount="50">+50</button><button data-action="debug-exp" data-amount="500">+500</button></div></div>
      <div class="debug-group"><span>INTIMACY</span><div><button data-action="debug-intimacy" data-amount="10">+10</button><button data-action="debug-intimacy" data-amount="100">+100</button></div></div>
      <div class="debug-actions"><button data-action="force-next-day">Force Next Day</button><button class="debug-danger" data-action="reset-save">Reset Save</button></div>
      <div class="debug-battle-section">
        <div class="debug-battle-title">BATTLE DEBUG</div>
        <small>${battle ? "只在戰鬥進行中使用" : "進入 BOSS 戰鬥後可使用"}</small>
        <div class="debug-battle-grid">${BATTLE_SHOP_ITEMS.map((item) => `<button data-action="debug-battle-item" data-item-id="${item.id}" ${!save ? "disabled" : ""}>+1 ${item.name}</button>`).join("")}</div>
        <div class="debug-battle-grid debug-battle-effects">
          <button data-action="debug-boss-damage" ${battleDebugDisabled ? "disabled" : ""}>Boss HP -50</button>
          <button data-action="debug-player-damage" ${battleDebugDisabled ? "disabled" : ""}>Player HP -20</button>
          <button data-action="debug-itchy" ${battleDebugDisabled ? "disabled" : ""}>Apply Itchy</button>
          <button data-action="debug-blurred" ${battleDebugDisabled ? "disabled" : ""}>Apply Blurred</button>
          <button data-action="debug-clear-status" ${battleDebugDisabled ? "disabled" : ""}>Clear Status</button>
        </div>
        <button class="debug-reset-reward" data-action="debug-reset-boss-reward" ${!save ? "disabled" : ""}>Reset Boss Reward</button>
      </div>
      ${save ? `<small>LV.${save.jellyfish.level} · ${formatNumber(save.player.points)} 點 · ${save.daily.date}</small>` : "<small>目前沒有存檔</small>"}
    </div>
  `;
}
