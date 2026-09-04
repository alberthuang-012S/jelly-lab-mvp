import { ACCESSORIES, ACCESSORY_LAYOUT_CONFIG, JELLYFISH_COLORS, SCENES, SKINS } from "./config.js?v=2.16.0";
import { getCurrentStage } from "./state.js?v=2.16.0";

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
  const accessoryNames = accessories.map((accessory) => accessory.name).join("、");
  const accessibilityName = `${hasBaseColor ? `${baseColor.name} ` : ""}${skin.name}，${stage.name}${accessoryNames ? `，配件：${accessoryNames}` : ""}`;
  const spriteStyle = `--skin-accent:${skin.accent};--jelly-base-color:${baseColor.color};--jelly-hue-rotate:${baseColor.hueRotate};--jelly-saturation:${baseColor.saturation}`;
  const selectedAccessory = accessories.find((accessory) => accessory.id === selectedAccessoryId);
  const selectedPosition = selectedAccessory ? accessoryPositions[selectedAccessory.id] || selectedAccessory.defaultPosition : null;

  return `
    <div class="jelly-character skin-${skin.id} stage-${stage.stage}${hasBaseColor ? " has-base-color" : ""}${accessoryEditMode ? " accessory-edit-mode" : ""}${actionClass ? ` ${actionClass}` : ""}" style="${spriteStyle}" role="${accessoryEditMode ? "group" : "img"}" aria-label="${accessibilityName}">
      <div class="jelly-art" aria-hidden="true">
        <img class="jelly-image" src="${skin.asset}" alt="" draggable="false" />
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
          return `<span class="jelly-accessory${accessoryEditMode ? " is-draggable" : ""}${isSelected ? " is-selected" : ""}" data-accessory-id="${accessory.id}" data-accessory-slot="${accessory.slot || ""}" style="--accessory-left:${position.x}%;--accessory-top:${position.y}%;--accessory-rotation:${rotation}deg;--accessory-scale:${scale}" aria-label="${accessory.name}" ${dragAttributes}><span class="jelly-accessory-visual" aria-hidden="true">${accessory.icon}</span></span>`;
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
