function safeColor(value, fallback) {
  return typeof value === "string" && /^#[0-9a-f]{6}$/i.test(value) ? value : fallback;
}

function renderCapsule(item, modifier) {
  const leftColor = safeColor(item.leftColor, "#dfe9ef");
  const rightColor = safeColor(item.rightColor, leftColor);

  return `
    <span class="battle-item-visual capsule-visual${modifier}" style="--capsule-left-color:${leftColor};--capsule-right-color:${rightColor}" aria-hidden="true">
      <span class="capsule-half capsule-left"></span>
      <span class="capsule-half capsule-right"></span>
      <span class="capsule-seam"></span>
      <span class="capsule-glint"></span>
    </span>
  `;
}

function renderCan(item, modifier) {
  const color = safeColor(item.color, "#8a6046");

  return `
    <span class="battle-item-visual can-visual${modifier}" style="--can-color:${color}" aria-hidden="true">
      <span class="can-pull-tab"></span>
      <span class="can-highlight"></span>
      <span class="can-label">${item.name}</span>
    </span>
  `;
}

function renderTin(item, modifier) {
  const color = safeColor(item.color, "#c5c8cc");

  return `
    <span class="battle-item-visual tin-visual${modifier}" style="--tin-color:${color}" aria-hidden="true">
      <span class="tin-lid"><span>${item.name}</span></span>
      <span class="tin-rim"></span>
    </span>
  `;
}

function renderBottle(item, modifier) {
  const asset = typeof item.asset === "string" ? item.asset : "";

  return `
    <span class="battle-item-visual bottle-visual${modifier}" aria-hidden="true">
      <img class="bottle-image" src="${asset}" alt="" draggable="false" />
    </span>
  `;
}

export function renderBattleItemVisual(item, options = {}) {
  const modifier = options.compact ? " is-compact" : "";

  if (item?.visualType === "capsule") {
    return renderCapsule(item, modifier);
  }

  if (item?.visualType === "can") {
    return renderCan(item, modifier);
  }

  if (item?.visualType === "tin") {
    return renderTin(item, modifier);
  }

  if (item?.visualType === "bottle") {
    return renderBottle(item, modifier);
  }

  return `<span class="battle-item-visual fallback-item-visual${modifier}" aria-hidden="true">${item?.icon || "✦"}</span>`;
}
