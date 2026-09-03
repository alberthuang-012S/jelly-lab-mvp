import { ACCESSORIES, JELLYFISH_COLORS, SCENES, SKINS } from "./config.js";
import { getCurrentStage } from "./state.js";

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

function renderJellyfishMarkup({ skin, accessories = [], stage, baseColorId, actionClass = "" }) {
  const baseColor = getBaseColor(baseColorId);
  const hasBaseColor = skin.id === "normal";
  const accessoryNames = accessories.map((accessory) => accessory.name).join("、");
  const accessibilityName = `${hasBaseColor ? `${baseColor.name} ` : ""}${skin.name}，${stage.name}${accessoryNames ? `，配件：${accessoryNames}` : ""}`;
  const spriteStyle = `--skin-accent:${skin.accent};--jelly-base-color:${baseColor.color};--jelly-hue-rotate:${baseColor.hueRotate};--jelly-saturation:${baseColor.saturation}`;

  return `
    <div class="jelly-character skin-${skin.id} stage-${stage.stage}${hasBaseColor ? " has-base-color" : ""}${actionClass ? ` ${actionClass}` : ""}" style="${spriteStyle}" role="img" aria-label="${accessibilityName}">
      <div class="jelly-art" aria-hidden="true">
        <img class="jelly-image" src="${skin.asset}" alt="" draggable="false" />
      </div>
      ${accessories.map((accessory) => `<span class="jelly-accessory" data-accessory-slot="${accessory.slot}" aria-label="${accessory.name}">${accessory.icon}</span>`).join("")}
      <span class="jelly-shine" aria-hidden="true"></span>
    </div>
  `;
}

export function renderJellyfish(save, options = {}) {
  const skin = getSkin(options.skinId || save.jellyfish.equippedSkin);
  const accessories = getAccessoryList(save, options);
  const stage = options.stage || getCurrentStage(save);
  const baseColorId = options.baseColor || save.jellyfish.baseColor;

  return renderJellyfishMarkup({
    skin,
    accessories,
    stage,
    baseColorId,
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
