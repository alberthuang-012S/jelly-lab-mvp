export const GAME_CONFIG = {
  version: 5,
  saveKey: "jellyLabSave",
  startingPoints: 50000,
  maxLevel: 10,
  dailyIntimacyLimit: 10,
  petDailyLimit: 3,
  chatDailyLimit: 2,
  petIntimacyGain: 2,
  chatIntimacyGain: 2,
  initialBaseColor: "yellow",
  initialSkin: "normal",
  initialScene: "default",
  pointsPer100Dollar: 10
};

export const LEVEL_CONFIG = {
  baseExp: 100,
  expStep: 50,
  maxLevelLabel: "MAX"
};

export const QUANTITY_CONFIG = {
  min: 1,
  max: 99,
  default: 1
};

export const JELLYFISH_COLORS = [
  {
    id: "yellow",
    name: "奶油黃",
    shortName: "黃色",
    color: "#F4D36B",
    hueRotate: "0deg",
    saturation: "1.06"
  },
  {
    id: "purple",
    name: "薰衣草紫",
    shortName: "紫色",
    color: "#A984D6",
    hueRotate: "215deg",
    saturation: "1.08"
  },
  {
    id: "green",
    name: "草綠色",
    shortName: "綠色",
    color: "#69B95C",
    hueRotate: "60deg",
    saturation: "1.08"
  },
  {
    id: "blue",
    name: "海洋藍",
    shortName: "藍色",
    color: "#5F9FDF",
    hueRotate: "150deg",
    saturation: "1.08"
  },
  {
    id: "pink",
    name: "櫻花粉",
    shortName: "粉紅",
    color: "#E58BC0",
    hueRotate: "270deg",
    saturation: "1.08"
  },
  {
    id: "cyan",
    name: "水藍色",
    shortName: "水藍",
    color: "#55CFE0",
    hueRotate: "120deg",
    saturation: "1.08"
  },
  {
    id: "red",
    name: "珊瑚紅",
    shortName: "紅色",
    color: "#D9534F",
    hueRotate: "300deg",
    saturation: "1.05"
  }
];

export const FOODS = [
  {
    id: "food_candy",
    type: "food",
    name: "海洋糖果",
    shortName: "海洋糖果",
    icon: "🍬",
    requiredLevel: 1,
    exp: 10,
    price: 20,
    description: "甜甜的海洋能量，讓小水母補充元氣。"
  },
  {
    id: "food_cookie",
    type: "food",
    name: "星星餅乾",
    shortName: "星星餅乾",
    icon: "🍪",
    requiredLevel: 1,
    exp: 25,
    price: 40,
    description: "酥脆的星星形餅乾，水母最喜歡的點心。"
  },
  {
    id: "food_jelly",
    type: "food",
    name: "水母果凍",
    shortName: "水母果凍",
    icon: "🍮",
    requiredLevel: 1,
    exp: 50,
    price: 70,
    description: "Q 彈果凍，含有滿滿的成長魔法。"
  },
  {
    id: "food_cake",
    type: "food",
    name: "星光蛋糕",
    shortName: "星光蛋糕",
    icon: "🍰",
    requiredLevel: 1,
    exp: 100,
    price: 120,
    description: "閃著星光的慶祝蛋糕，EXP 大幅提升。"
  }
];

export const SKINS = [
  {
    id: "normal",
    type: "skin",
    name: "平凡水母",
    price: 0,
    requiredLevel: 1,
    asset: "./assets/jellyfish/jelly-normal.png",
    accent: "#f3b943",
    description: "最初相遇的黃色普通水母。"
  },
  {
    id: "sparkle",
    type: "skin",
    name: "閃耀水母",
    price: 200,
    requiredLevel: 2,
    asset: "./assets/jellyfish/jelly-sparkle.png",
    accent: "#7250d8",
    description: "身上藏著小小星光的夢幻水母。"
  },
  {
    id: "playful",
    type: "skin",
    name: "調皮水母",
    price: 200,
    requiredLevel: 2,
    asset: "./assets/jellyfish/jelly-playful.png",
    accent: "#41c5e4",
    description: "總是睜大眼睛探索海底的淘氣夥伴。"
  },
  {
    id: "detective",
    type: "skin",
    name: "好奇水母",
    price: 250,
    requiredLevel: 3,
    asset: "./assets/jellyfish/jelly-detective.png",
    accent: "#76c840",
    description: "帶著放大鏡，什麼秘密都逃不過牠。"
  },
  {
    id: "shy",
    type: "skin",
    name: "害羞水母",
    price: 250,
    requiredLevel: 3,
    asset: "./assets/jellyfish/jelly-shy.png",
    accent: "#b985e8",
    description: "躲在柔和星光裡，悄悄陪著你。"
  },
  {
    id: "cute",
    type: "skin",
    name: "萌萌水母",
    price: 300,
    requiredLevel: 4,
    asset: "./assets/jellyfish/jelly-cute.png",
    accent: "#e77bce",
    description: "用甜甜笑容融化整片海洋。"
  },
  {
    id: "angry",
    type: "skin",
    name: "爆氣水母",
    price: 350,
    requiredLevel: 5,
    asset: "./assets/jellyfish/jelly-angry.png",
    accent: "#2952bf",
    description: "看起來很有氣勢，其實還是很溫柔。"
  },
  {
    id: "fire",
    type: "skin",
    name: "火焰水母",
    price: 500,
    requiredLevel: 7,
    asset: "./assets/jellyfish/jelly-fire.png",
    accent: "#bd3f33",
    description: "燃著小小火焰，準備游向更遠的海。"
  }
];

export const ACCESSORY_SLOTS = {
  head: { label: "頭部", order: 1 },
  left: { label: "左側裝飾", order: 2 },
  face: { label: "臉部", order: 3 },
  right: { label: "右側裝飾", order: 4 }
};

export const ACCESSORY_LAYOUT_CONFIG = {
  minX: 4,
  maxX: 96,
  minY: 4,
  maxY: 96,
  defaultPosition: { x: 50, y: 50, rotation: 0, scale: 1 }
};

export const ACCESSORIES = [
  {
    id: "accessory_crown",
    type: "accessory",
    slot: "head",
    name: "海洋皇冠",
    icon: "👑",
    price: 180,
    requiredLevel: 3,
    defaultPosition: { x: 40, y: 7, rotation: -6, scale: 1 },
    description: "給今天的主角戴上一頂皇冠。"
  },
  {
    id: "accessory_bow",
    type: "accessory",
    slot: "left",
    name: "珊瑚蝴蝶結",
    icon: "🎀",
    price: 160,
    requiredLevel: 2,
    defaultPosition: { x: 14, y: 36, rotation: -14, scale: 1 },
    description: "輕飄飄的蝴蝶結，讓漂浮更有風格。"
  },
  {
    id: "accessory_glasses",
    type: "accessory",
    slot: "face",
    name: "研究眼鏡",
    icon: "🕶️",
    price: 220,
    requiredLevel: 4,
    defaultPosition: { x: 50, y: 39, rotation: -6, scale: 0.86 },
    description: "Jelly Lab 研究員的專屬配件。"
  },
  {
    id: "accessory_star",
    type: "accessory",
    slot: "right",
    name: "星星髮飾",
    icon: "⭐",
    price: 260,
    requiredLevel: 5,
    defaultPosition: { x: 86, y: 19, rotation: 8, scale: 0.72 },
    description: "把一顆小星星帶到海底。"
  },
  {
    id: "accessory_hat",
    type: "accessory",
    slot: "head",
    name: "小小船長帽",
    icon: "🧢",
    price: 300,
    requiredLevel: 6,
    defaultPosition: { x: 62, y: 8, rotation: 5, scale: 0.92 },
    description: "準備好帶你探索星海。"
  }
];

export const SCENES = [
  {
    id: "default",
    type: "scene",
    name: "初始海洋",
    icon: "🌊",
    price: 0,
    requiredLevel: 1,
    cssClass: "scene-default",
    description: "清澈、溫柔的初始海域。"
  },
  {
    id: "ocean",
    type: "scene",
    name: "氣泡海底",
    icon: "🫧",
    price: 300,
    requiredLevel: 3,
    cssClass: "scene-ocean",
    description: "更多泡泡，更多悠閒的海底午後。"
  },
  {
    id: "night",
    type: "scene",
    name: "月光海洋",
    icon: "🌙",
    price: 400,
    requiredLevel: 5,
    cssClass: "scene-night",
    description: "月光落在海面，適合安靜陪伴。"
  },
  {
    id: "star",
    type: "scene",
    name: "星海世界",
    icon: "✨",
    price: 600,
    requiredLevel: 7,
    cssClass: "scene-star",
    description: "像在星星之間漂浮一樣的特別場景。"
  }
];

export const EVOLUTION_STAGES = [
  {
    stage: 1,
    name: "幼生水母",
    level: 1,
    intimacy: 0,
    description: "剛來到 Jelly Lab 的小小夥伴。"
  },
  {
    stage: 2,
    name: "成長水母",
    level: 3,
    intimacy: 20,
    description: "開始熟悉你的腳步，也更勇敢地探索海洋。"
  },
  {
    stage: 3,
    name: "發光水母",
    level: 5,
    intimacy: 60,
    description: "親密的陪伴化成溫柔光暈。"
  },
  {
    stage: 4,
    name: "幻彩水母",
    level: 8,
    intimacy: 120,
    description: "牠的光芒開始映出整片海的顏色。"
  },
  {
    stage: 5,
    name: "星海水母",
    level: 10,
    intimacy: 200,
    description: "與你一起抵達 Jelly Lab 的星海深處。"
  }
];

export const CHAT_LINES = [
  "今天也來看我了！",
  "今天要吃什麼呢？",
  "我好像又長大了一點。",
  "海底今天很漂亮！",
  "我喜歡你來找我。",
  "聽說商店有新的東西？",
  "我想吃星星蛋糕。",
  "今天也一起加油吧！",
  "噗嚕噗嚕～",
  "我今天心情很好！",
  "你知道嗎？泡泡會唱歌。",
  "陪我游一圈好不好？",
  "我在這裡等你很久囉。",
  "你的聲音聽起來像海浪。",
  "今天的你也閃閃發光。"
];

export const SHOP_CATEGORIES = [
  { id: "battle", label: "⚔️ 戰鬥" },
  { id: "food", label: "🍰 食物" },
  { id: "skin", label: "🪼 造型" },
  { id: "accessory", label: "🎀 配件" },
  { id: "scene", label: "🌊 場景" }
];

export const BATTLE_SHOP_ITEMS = [
  {
    id: "weapon_ktt",
    storageKey: "KTT",
    name: "KTT+3",
    type: "weapon",
    category: "weapon",
    icon: "🔵",
    visualType: "capsule",
    leftColor: "#72CBEF",
    rightColor: "#F4E7A1",
    price: 1000,
    damage: 35,
    consumable: true,
    description: "穩定可靠的膠囊武器，造成 35 點傷害。"
  },
  {
    id: "weapon_pnn",
    storageKey: "PNN",
    name: "PNN+3",
    type: "weapon",
    category: "weapon",
    icon: "🟣",
    visualType: "capsule",
    leftColor: "#FFFFFF",
    rightColor: "#FFFFFF",
    price: 1500,
    damage: 55,
    consumable: true,
    description: "蓄積更多能量的膠囊武器，造成 55 點傷害。"
  },
  {
    id: "weapon_qcc",
    storageKey: "QCC",
    name: "QCC+4",
    type: "weapon",
    category: "weapon",
    icon: "🟠",
    visualType: "capsule",
    leftColor: "#69B95C",
    rightColor: "#69B95C",
    price: 2000,
    damage: 80,
    consumable: true,
    description: "高密度能量膠囊，造成 80 點傷害。"
  },
  {
    id: "weapon_rnn",
    storageKey: "RNN",
    name: "REE+5",
    type: "weapon",
    category: "weapon",
    icon: "🔴",
    visualType: "capsule",
    leftColor: "#D9534F",
    rightColor: "#D9534F",
    price: 2500,
    damage: 120,
    consumable: true,
    description: "稀有的強力膠囊武器，造成 120 點傷害。"
  },
  {
    id: "recovery_ppt",
    storageKey: "PPT",
    name: "PPT+1",
    type: "recovery",
    category: "recovery",
    icon: "🧪",
    visualType: "can",
    color: "#8A6046",
    price: 100,
    heal: 35,
    cures: "blurred",
    consumable: true,
    description: "回復 35 HP，並解除視野模糊。"
  },
  {
    id: "ointment_nap",
    storageKey: "NAP",
    name: "PPA+1",
    type: "ointment",
    category: "ointment",
    icon: "🧴",
    visualType: "bottle",
    asset: "./assets/items/ppa-plus-one.png",
    bodyColor: "#FAFAF7",
    pumpColor: "#F0F1EE",
    labelColor: "#6C578D",
    labelAccent: "#D9D0E8",
    price: 300,
    cures: "itchy",
    consumable: true,
    description: "PPA+1 乳霜，舒緩搔癢狀態，不會恢復 HP。"
  }
];

export const BATTLE_CONFIG = {
  playerMaxHp: 100,
  logLimit: 8,
  turnDelayMs: 620,
  boss: {
    agingMonster: {
      id: "aging_monster",
      name: "老化怪獸",
      maxHp: 320,
      icon: "👾",
      description: "帶著歲月紋路的灰紫色時間怪獸。",
      attacks: [
        {
          id: "aging_impact",
          name: "衰老衝擊",
          chance: 0.5,
          minDamage: 12,
          maxDamage: 18,
          icon: "⚡"
        },
        {
          id: "itch_dust",
          name: "乾癢粉塵",
          chance: 0.25,
          damage: 5,
          status: "itchy",
          icon: "🔥"
        },
        {
          id: "cloudy_vision",
          name: "混濁視線",
          chance: 0.25,
          damage: 5,
          status: "blurred",
          icon: "👁️"
        }
      ]
    }
  },
  basicAttack: {
    id: "basic_bump",
    name: "水母撞擊",
    damage: 10,
    icon: "🪼"
  },
  statuses: {
    itchyDamage: 5,
    blurredMissChance: 0.5
  }
};

export const REWARDS_CONFIG = {
  agingMonsterCoupon: {
    id: "boss_aging_coupon_600",
    name: "老化怪獸討伐獎勵",
    type: "coupon",
    value: 600,
    icon: "🎫",
    description: "虛擬 NT$600 折價券；正式版本將串接官網優惠券系統。"
  }
};

export const BATTLE_SHOP_GROUPS = [
  { id: "weapon", label: "膠囊武器", hint: "攻擊老化怪獸" },
  { id: "recovery", label: "回復飲料", hint: "回復 HP、解除視野模糊" },
  { id: "ointment", label: "外用乳霜", hint: "解除癢狀態" }
];

export function getAllShopItems() {
  return [
    ...FOODS,
    ...SKINS.filter((item) => item.id !== GAME_CONFIG.initialSkin),
    ...ACCESSORIES,
    ...SCENES.filter((item) => item.id !== GAME_CONFIG.initialScene),
    ...BATTLE_SHOP_ITEMS
  ];
}
