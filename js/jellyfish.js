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

function renderJellyfishMarkup({ skin, accessory, stage, baseColorId, actionClass = "" }) {
  const baseColor = getBaseColor(baseColorId);
  const hasBaseColor = skin.id === "normal";
  const accessibilityName = `${hasBaseColor ? `${baseColor.name} ` : ""}${skin.name}，${stage.name}`;
  const spriteStyle = `--skin-accent:${skin.accent};--jelly-base-color:${baseColor.color};--jelly-hue-rotate:${baseColor.hueRotate};--jelly-saturation:${baseColor.saturation}`;

  return `
    <div class="jelly-character skin-${skin.id} stage-${stage.stage}${hasBaseColor ? " has-base-color" : ""}${actionClass ? ` ${actionClass}` : ""}" style="${spriteStyle}" role="img" aria-label="${accessibilityName}">
      <div class="jelly-art" aria-hidden="true">
        <img class="jelly-image" src="${skin.asset}" alt="" draggable="false" />
      </div>
      ${accessory ? `<span class="jelly-accessory" aria-label="${accessory.name}">${accessory.icon}</span>` : ""}
      <span class="jelly-shine" aria-hidden="true"></span>
    </div>
  `;
}

export function renderJellyfish(save, options = {}) {
  const skin = getSkin(options.skinId || save.jellyfish.equippedSkin);
  const accessory = options.accessoryId === null ? null : getAccessory(options.accessoryId ?? save.jellyfish.equippedAccessory);
  const stage = options.stage || getCurrentStage(save);
  const baseColorId = options.baseColor || save.jellyfish.baseColor;

  return renderJellyfishMarkup({
    skin,
    accessory,
    stage,
    baseColorId,
    actionClass: options.actionClass
  });
}

export function renderJellyfishPreview(baseColorId = "yellow") {
  return renderJellyfishMarkup({
    skin: getSkin("normal"),
    accessory: null,
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
