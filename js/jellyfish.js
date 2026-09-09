import { ACCESSORIES, ACCESSORY_LAYOUT_CONFIG, JELLYFISH_ASSET_CONFIG, JELLYFISH_COLORS, SCENES, SKINS } from "./config.js?v=2.18.0";
import { getCurrentStage } from "./state.js?v=2.18.0";

export function getSkin(skinId) {
  return SKINS.find((skin) => skin.id === skinId) || SKINS[0];
}

export function getAccessory(accessoryId) {
  return ACCESSORIES.find((accessory) => accessory.id === accessoryId) || null;
}

export function getScene(sceneId) {
  return SCENES.find((scene) => scene.id === sceneId) || SCENES[0];
}

export function getBaseColor(colorId) {
  return JELLYFISH_COLORS.find((color) => color.id === colorId) || JELLYFISH_COLORS[0];
}

function escapeMarkupAttribute(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll('"', "&quot;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}

/**
 * Return the preferred transparent pre-rendered 3D asset for a skin/color pair.
 * The returned path is intentionally synchronous so existing renderJellyfish()
 * callers can keep building their markup without changing their flow.
 */
export function getJellyfishAssetPath(skinId = "normal", baseColorId = "yellow") {
  const skin = getSkin(skinId);
  const baseColor = getBaseColor(baseColorId);
  const extension = String(JELLYFISH_ASSET_CONFIG.preferredExtension || "webp").replace(/^\./, "");
  const filename = skin.id === "normal"
    ? `jelly-normal-${baseColor.id}.${extension}`
    : `jelly-${skin.id}.${extension}`;

  return `${JELLYFISH_ASSET_CONFIG.preferredDirectory}${filename}`;
}

export function getJellyfishFallbackAssetPath(skinId = "normal") {
  const skin = getSkin(skinId);
  return skin.asset || `${JELLYFISH_ASSET_CONFIG.fallbackDirectory}jelly-${skin.id}.png`;
}

/**
 * Keep accessory rendering in one place so a future image asset can replace an
 * emoji everywhere without changing the drag/rotate/scale data or behavior.
 */
export function renderAccessoryVisual(accessory) {
  const asset = String(accessory?.asset || "").trim();
  const icon = accessory?.icon || "✦";

  if (!asset) {
    return `<span class="jelly-accessory-icon" aria-hidden="true">${icon}</span>`;
  }

  return `<img class="jelly-accessory-image" src="${escapeMarkupAttribute(asset)}" alt="" draggable="false" onerror="this.onerror=null;this.hidden=true;this.nextElementSibling.hidden=false;" /><span class="jelly-accessory-icon" aria-hidden="true" hidden>${icon}</span>`;
}

function getAccessoryList(save, options) {
  if (Array.isArray(options.accessoryIds)) {
    return options.accessoryIds.map((accessoryId) => getAccessory(accessoryId)).filter(Boolean);
  }

  if (options.accessoryId === null) {
    return [];
  }

  if (options.accessoryId !== undefined) {
    const accessory = getAccessory(options.accessoryId);
    return accessory ? [accessory] : [];
  }

  const equippedAccessoryIds = Array.isArray(save?.jellyfish?.equippedAccessories)
    ? save.jellyfish.equippedAccessories
    : save?.jellyfish?.equippedAccessory ? [save.jellyfish.equippedAccessory] : [];

  return equippedAccessoryIds.map((accessoryId) => getAccessory(accessoryId)).filter(Boolean);
}

function renderJellyfishMarkup({ skin, accessories = [], stage, baseColorId, accessoryPositions = {}, accessoryEditMode = false, selectedAccessoryId = null, actionClass = "" }) {
  const baseColor = getBaseColor(baseColorId);
  const hasBaseColor = skin.id === "normal";
  const assetPath = getJellyfishAssetPath(skin.id, baseColor.id);
  const fallbackAssetPath = getJellyfishFallbackAssetPath(skin.id);
  const accessoryNames = accessories.map((accessory) => accessory.name).join("、");
  const accessibilityName = `${hasBaseColor ? `${baseColor.name} ` : ""}${skin.name}，${stage.name}${accessoryNames ? `，配件：${accessoryNames}` : ""}`;
  const spriteStyle = `--skin-accent:${skin.accent};--jelly-base-color:${baseColor.color};--jelly-hue-rotate:${baseColor.hueRotate};--jelly-saturation:${baseColor.saturation}`;
  const selectedAccessory = accessories.find((accessory) => accessory.id === selectedAccessoryId);
  const selectedPosition = selectedAccessory ? accessoryPositions[selectedAccessory.id] || selectedAccessory.defaultPosition : null;

  return `
    <div class="jelly-character jelly-asset-3d skin-${skin.id} stage-${stage.stage}${hasBaseColor ? " has-base-color" : ""}${accessoryEditMode ? " accessory-edit-mode" : ""}${actionClass ? ` ${actionClass}` : ""}" style="${spriteStyle}" data-jellyfish-asset="${escapeMarkupAttribute(assetPath)}" role="${accessoryEditMode ? "group" : "img"}" aria-label="${accessibilityName}">
      <div class="jelly-art" aria-hidden="true">
        <span class="jelly-ground-shadow" aria-hidden="true"></span>
        <img class="jelly-image" src="${escapeMarkupAttribute(assetPath)}" data-fallback-src="${escapeMarkupAttribute(fallbackAssetPath)}" alt="" draggable="false" onerror="this.onerror=null;var root=this.closest('.jelly-character');if(root){root.classList.add('is-legacy-asset');}this.src=this.dataset.fallbackSrc;" />
      </div>
      <div class="jelly-accessory-layer">
        ${accessories.map((accessory) => {
          const position = accessoryPositions[accessory.id] || accessory.defaultPosition || { x: 50, y: 50 };
          const fallbackRotation = Number.isFinite(Number(accessory.defaultPosition?.rotation)) ? Number(accessory.defaultPosition.rotation) : 0;
          const fallbackScale = Number.isFinite(Number(accessory.defaultPosition?.scale)) ? Number(accessory.defaultPosition.scale) : 1;
          const rotation = Number.isFinite(Number(position.rotation)) ? Number(position.rotation) : fallbackRotation;
          const scale = Number.isFinite(Number(position.scale)) ? Number(position.scale) : fallbackScale;
          const isSelected = accessoryEditMode && selectedAccessoryId === accessory.id;
          const dragAttributes = accessoryEditMode ? `role="button" tabindex="0" aria-grabbed="false" aria-pressed="${isSelected}"` : "";
          return `<span class="jelly-accessory${accessoryEditMode ? " is-draggable" : ""}${isSelected ? " is-selected" : ""}" data-accessory-id="${accessory.id}" data-accessory-slot="${accessory.slot || ""}" style="--accessory-left:${position.x}%;--accessory-top:${position.y}%;--accessory-rotation:${rotation}deg;--accessory-scale:${scale}" aria-label="${accessory.name}" ${dragAttributes}><span class="jelly-accessory-visual" aria-hidden="true">${renderAccessoryVisual(accessory)}</span></span>`;
        }).join("")}
        ${accessoryEditMode && selectedAccessory && selectedPosition ? `
          <div class="accessory-floating-toolbar" data-accessory-toolbar data-accessory-id="${selectedAccessory.id}" role="toolbar" aria-label="調整${selectedAccessory.name}">
            <output class="accessory-toolbar-readout" data-accessory-transform-readout aria-live="polite">${Math.round(Number(selectedPosition.rotation ?? selectedAccessory.defaultPosition?.rotation ?? 0))}° · ${Number(selectedPosition.scale ?? selectedAccessory.defaultPosition?.scale ?? 1).toFixed(2)}×</output>
            <div class="accessory-toolbar-actions">
              <button type="button" data-action="adjust-accessory-transform" data-transform="rotation" data-delta="-${ACCESSORY_LAYOUT_CONFIG.rotationStep}" aria-label="向左旋轉 ${ACCESSORY_LAYOUT_CONFIG.rotationStep} 度">↶</button>
              <button type="button" data-action="adjust-accessory-transform" data-transform="rotation" data-delta="${ACCESSORY_LAYOUT_CONFIG.rotationStep}" aria-label="向右旋轉 ${ACCESSORY_LAYOUT_CONFIG.rotationStep} 度">↷</button>
              <button type="button" data-action="adjust-accessory-transform" data-transform="scale" data-delta="-${ACCESSORY_LAYOUT_CONFIG.scaleStep}" aria-label="縮小配件">−</button>
              <button type="button" data-action="adjust-accessory-transform" data-transform="scale" data-delta="${ACCESSORY_LAYOUT_CONFIG.scaleStep}" aria-label="放大配件">＋</button>
              <button type="button" data-action="reset-selected-accessory" aria-label="重設目前配件">↺</button>
            </div>
          </div>
        ` : ""}
      </div>
      <span class="jelly-shine" aria-hidden="true"></span>
    </div>
  `;
}

export function renderJellyfish(save, options = {}) {
  const skin = getSkin(options.skinId || save.jellyfish.equippedSkin);
  const accessories = getAccessoryList(save, options);
  const stage = options.stage || getCurrentStage(save);
  const baseColorId = options.baseColor || save.jellyfish.baseColor;
  const accessoryPositions = options.accessoryPositions || save?.jellyfish?.accessoryPositions || {};

  return renderJellyfishMarkup({
    skin,
    accessories,
    stage,
    baseColorId,
    accessoryPositions,
    accessoryEditMode: options.accessoryEditMode === true,
    selectedAccessoryId: options.selectedAccessoryId || null,
    actionClass: options.actionClass
  });
}

export function renderJellyfishPreview(baseColorId = "yellow") {
  return renderJellyfishMarkup({
    skin: getSkin("normal"),
    accessories: [],
    stage: { stage: 1, name: "幼生水母" },
    baseColorId,
    actionClass: "preview-character"
  });
}

export function getEvolutionClass(save) {
  return `stage-${getCurrentStage(save).stage}`;
}

export function getSceneClass(save) {
  return getScene(save.jellyfish.equippedScene).cssClass;
}

export function getSkinName(skinId) {
  return getSkin(skinId).name;
}
