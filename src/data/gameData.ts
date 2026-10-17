import {
  ActivityId,
  CombatZoneInfo,
  CraftingRecipe,
  EquipmentBlueprint,
  EquipmentItem,
  EquipmentSlot,
  EquipmentSubType,
  FishboneUpgrade,
  GameState,
  PlayerClass,
  Tier,
  TierNodeState,
} from '../types/game';

export const TIERS: Tier[] = [1, 2, 3, 4, 5, 6, 7, 8];

export const CLASS_CONFIG: Record<
  PlayerClass,
  {
    id: PlayerClass;
    nameZh: string;
    nameEn: string;
    roleTitleZh: string;
    roleTitleEn: string;
    combatStyleZh: string;
    combatStyleEn: string;
    weaponNameZh: string;
    weaponNameEn: string;
    armorNameZh: string;
    armorNameEn: string;
    descZh: string;
    descEn: string;
    weaponSubType: EquipmentSubType;
    armorSubType: EquipmentSubType;
    color: string;
  }
> = {
  warrior: {
    id: 'warrior',
    nameZh: '战士',
    nameEn: 'Warrior',
    roleTitleZh: '近战顺劈 · 均衡输出 & 破甲前排',
    roleTitleEn: 'Melee Cleave · Balanced & Armor Break',
    combatStyleZh: '上前挥砍顺劈（群怪顺劈3目标 / Boss重击125% · 伤害均衡）',
    combatStyleEn: 'Steps forward to slash (Cleaves 3 mobs / 125% vs Boss)',
    weaponNameZh: '大剑（锻造制作）',
    weaponNameEn: 'Greatsword (Smithing)',
    armorNameZh: '板甲（锻造制作）',
    armorNameEn: 'Plate Armor (Smithing)',
    descZh: '【上前挥砍】大剑与板甲（锻造·金属锭），AOE与单体伤害均衡，提供全队破甲与厚重生命',
    descEn: 'Lunges forward to cleave with Greatsword & Plate. Balanced AOE/Single damage & Squad Armor Break',
    weaponSubType: 'greatsword',
    armorSubType: 'plate_armor',
    color: '#f59e0b',
  },
  hunter: {
    id: 'hunter',
    nameZh: '猎人',
    nameEn: 'Hunter',
    roleTitleZh: '远程射箭 · 领主Boss克星 & 掉宝乘区',
    roleTitleEn: 'Ranged Archer · Boss Slayer & Loot Mult',
    combatStyleZh: '远程弯弓射箭（对Boss造成 185% 弱点贯穿重创 · 单体最强）',
    combatStyleEn: 'Fires ranged arrows (185% Giant-Slayer damage vs Bosses)',
    weaponNameZh: '弓（工匠制作）',
    weaponNameEn: 'Bow (Carpentry)',
    armorNameZh: '皮甲（裁缝制作·皮革掉落）',
    armorNameEn: 'Leather Armor (Tailoring)',
    descZh: '【远程射箭】猎弓（工匠·木板）与皮甲（裁缝·皮革），Boss战主力核心，并倍增全队战利品掉落',
    descEn: 'Shoots piercing arrows from afar. Deals massive Boss damage & multiplies Leather/Material drops',
    weaponSubType: 'bow',
    armorSubType: 'leather_armor',
    color: '#10b981',
  },
  mage: {
    id: 'mage',
    nameZh: '法师',
    nameEn: 'Mage',
    roleTitleZh: '魔法弹幕 · 群怪AOE霸主 & 金币乘区',
    roleTitleEn: 'Arcane Projectile · Mob AOE King & Gold Mult',
    combatStyleZh: '远程发射魔法投射物（小怪阶段轰击全屏所有怪物 115% AOE）',
    combatStyleEn: 'Launches ranged arcane orbs (Hits ALL mobs for 115% AOE)',
    weaponNameZh: '法杖（工匠制作）',
    weaponNameEn: 'Staff (Carpentry)',
    armorNameZh: '布甲（裁缝制作）',
    armorNameEn: 'Cloth Armor (Tailoring)',
    descZh: '【魔法投射物】法杖（工匠·木板）与布甲（裁缝·布匹），小怪阶段全屏AOE清场，并倍增全队金币',
    descEn: 'Fires ranged arcane projectiles that detonate across all mobs in a wave & multiplies Gold drops',
    weaponSubType: 'staff',
    armorSubType: 'cloth_armor',
    color: '#a855f7',
  },
};

export interface TierMeta {
  tier: Tier;
  prefixZh: string;
  prefixEn: string;
  oreZh: string;
  oreEn: string;
  ingotZh: string;
  ingotEn: string;
  woodZh: string;
  woodEn: string;
  fishZh: string;
  fishEn: string;
  fiberZh: string;
  fiberEn: string;
  leatherZh: string;
  leatherEn: string;
  foodZh: string;
  foodEn: string;
  colorHex: string;
  threeColor: number;
  baseMultiplier: number; // 1000^(tier-1)
}

export const TIER_META: Record<Tier, TierMeta> = {
  1: {
    tier: 1,
    prefixZh: '粗铜',
    prefixEn: 'Copper',
    oreZh: '赤铜矿石',
    oreEn: 'Copper Ore',
    ingotZh: '赤铜锭',
    ingotEn: 'Copper Ingot',
    woodZh: '翠松原木',
    woodEn: 'Pine Log',
    fishZh: '溪流银鳟',
    fishEn: 'Brook Trout',
    fiberZh: '亚麻纤维',
    fiberEn: 'Flax Fiber',
    leatherZh: '轻柔兽皮',
    leatherEn: 'Soft Pelt',
    foodZh: '蜜汁烤鳟鱼',
    foodEn: 'Honey Roasted Trout',
    colorHex: '#d97706',
    threeColor: 0xd97706,
    baseMultiplier: 1, // 10^0 (1 - 999)
  },
  2: {
    tier: 2,
    prefixZh: '寒铁',
    prefixEn: 'Cold-Iron',
    oreZh: '寒铁矿石',
    oreEn: 'Cold-Iron Ore',
    ingotZh: '寒铁锭',
    ingotEn: 'Cold-Iron Ingot',
    woodZh: '铁桦原木',
    woodEn: 'Birch Log',
    fishZh: '深潭金鲤',
    fishEn: 'Golden Carp',
    fiberZh: '云棉纤维',
    fiberEn: 'Cotton Fiber',
    leatherZh: '硬质狼皮',
    leatherEn: 'Thick Wolfhide',
    foodZh: '金鲤蛋奶酥',
    foodEn: 'Carp Egg Souffle',
    colorHex: '#94a3b8',
    threeColor: 0x94a3b8,
    baseMultiplier: 1_000, // 10^3 (1,000 - 999,999)
  },
  3: {
    tier: 3,
    prefixZh: '精钢',
    prefixEn: 'High-Steel',
    oreZh: '耀金钢矿',
    oreEn: 'Gilded Steel Ore',
    ingotZh: '精钢锭',
    ingotEn: 'High-Steel Ingot',
    woodZh: '古橡巨木',
    woodEn: 'Ancient Oak',
    fishZh: '幽谷剑鱼',
    fishEn: 'Cavern Swordfish',
    fiberZh: '冰蚕丝线',
    fiberEn: 'Frost Silk Fiber',
    leatherZh: '地穴巨蜥皮',
    leatherEn: 'Drake Scalehide',
    foodZh: '剑鱼糖霜盛宴',
    foodEn: 'Glazed Swordfish Feast',
    colorHex: '#eab308',
    threeColor: 0xeab308,
    baseMultiplier: 1_000_000, // 10^6 (1M - 999M)
  },
  4: {
    tier: 4,
    prefixZh: '秘银',
    prefixEn: 'Mithril',
    oreZh: '秘银原矿',
    oreEn: 'Mithril Ore',
    ingotZh: '秘银锭',
    ingotEn: 'Mithril Ingot',
    woodZh: '月影灵木',
    woodEn: 'Moonshadow Timber',
    fishZh: '极光水晶鲑',
    fishEn: 'Aurora Salmon',
    fiberZh: '月华灵纤',
    fiberEn: 'Moonweave Fiber',
    leatherZh: '双足飞龙皮',
    leatherEn: 'Wyvern Leather',
    foodZh: '秘银极光鱼排',
    foodEn: 'Aurora Salmon Steak',
    colorHex: '#38bdf8',
    threeColor: 0x38bdf8,
    baseMultiplier: 1e9, // 10^9 (1B - 999B)
  },
  5: {
    tier: 5,
    prefixZh: '精金',
    prefixEn: 'Adamantite',
    oreZh: '深渊精金矿',
    oreEn: 'Adamantite Ore',
    ingotZh: '精金锭',
    ingotEn: 'Adamantite Ingot',
    woodZh: '血纹红木',
    woodEn: 'Crimson Ironwood',
    fishZh: '深渊灯笼鲨',
    fishEn: 'Abyssal Shark',
    fiberZh: '虚空暗纱',
    fiberEn: 'Voidweave Fiber',
    leatherZh: '深渊巨兽革',
    leatherEn: 'Behemoth Hide',
    foodZh: '深渊鱼王浓汤',
    foodEn: 'Abyssal Shark Bisque',
    colorHex: '#10b981',
    threeColor: 0x10b981,
    baseMultiplier: 1e12, // 10^12 (1T - 999T)
  },
  6: {
    tier: 6,
    prefixZh: '符文',
    prefixEn: 'Runic',
    oreZh: '奥术符文矿',
    oreEn: 'Runic Arcanite',
    ingotZh: '符文奥金锭',
    ingotEn: 'Runic Ingot',
    woodZh: '雷鸣神木',
    woodEn: 'Thunderstruck Elderwood',
    fishZh: '雷霆电鳗王',
    fishEn: 'Storm Leviathan',
    fiberZh: '星辉天蚕丝',
    fiberEn: 'Starlight Silk',
    leatherZh: '泰坦魔像皮',
    leatherEn: 'Titan Runehide',
    foodZh: '雷霆龙王刺身',
    foodEn: 'Leviathan Sashimi',
    colorHex: '#a855f7',
    threeColor: 0xa855f7,
    baseMultiplier: 1e15, // 10^15 (1Qa - 999Qa)
  },
  7: {
    tier: 7,
    prefixZh: '龙骨',
    prefixEn: 'Dragonbone',
    oreZh: '龙血炽炎矿',
    oreEn: 'Dragonblood Ore',
    ingotZh: '龙炎神铁锭',
    ingotEn: 'Dragonfire Ingot',
    woodZh: '涅槃梧桐木',
    woodEn: 'Phoenix Ashwood',
    fishZh: '熔岩火龙鱼',
    fishEn: 'Magma Arowana',
    fiberZh: '炽天使羽绒',
    fiberEn: 'Seraphic Down',
    leatherZh: '远古红龙鳞革',
    leatherEn: 'Ancient Dragonscale',
    foodZh: '熔岩龙息炙烤宴',
    foodEn: 'Dragonfire Imperial Banquet',
    colorHex: '#ef4444',
    threeColor: 0xef4444,
    baseMultiplier: 1e18, // 10^18 (1Qi - 999Qi)
  },
  8: {
    tier: 8,
    prefixZh: '星界',
    prefixEn: 'Astral',
    oreZh: '星核创世矿',
    oreEn: 'Astral Core Ore',
    ingotZh: '星界永恒锭',
    ingotEn: 'Astral Eternity Ingot',
    woodZh: '世界树枝干',
    woodEn: 'Worldtree Yggdrasil',
    fishZh: '银河星鲲',
    fishEn: 'Cosmic Kun-Fish',
    fiberZh: '命运星云线',
    fiberEn: 'Nebula Fate-Thread',
    leatherZh: '星空神兽圣革',
    leatherEn: 'Celestial Aegis Hide',
    foodZh: '星界不朽神肴',
    foodEn: 'Astral Ambrosia Feast',
    colorHex: '#f43f5e',
    threeColor: 0xf43f5e,
    baseMultiplier: 1e21, // 10^21 (1Sx - 1Sp)
  },
};

export const RARE_MATERIALS: Record<
  string,
  { id: string; nameZh: string; nameEn: string; sourceZh: string; sourceEn: string; color: string }
> = {
  rare_gem: {
    id: 'rare_gem',
    nameZh: '星辰棱晶',
    nameEn: 'Starlight Prism',
    sourceZh: '采矿稀有掉落',
    sourceEn: 'Rare Mining Drop',
    color: '#38bdf8',
  },
  rare_amber: {
    id: 'rare_amber',
    nameZh: '万年古珀',
    nameEn: 'Millennium Amber',
    sourceZh: '伐木稀有掉落',
    sourceEn: 'Rare Logging Drop',
    color: '#f59e0b',
  },
  rare_pearl: {
    id: 'rare_pearl',
    nameZh: '深海龙珠',
    nameEn: 'Abyssal Dragon Pearl',
    sourceZh: '钓鱼稀有掉落',
    sourceEn: 'Rare Fishing Drop',
    color: '#2dd4bf',
  },
  rare_feather: {
    id: 'rare_feather',
    nameZh: '不死鸟圣羽',
    nameEn: 'Phoenix Plume',
    sourceZh: '采集/战斗稀有掉落',
    sourceEn: 'Rare Foraging/Combat Drop',
    color: '#fb7185',
  },
};

export const COMBAT_ZONES: CombatZoneInfo[] = [
  {
    zone: 1,
    nameZh: '微风草甸',
    nameEn: 'Whispering Meadow',
    subTitleZh: '第1阶场所 · 初始试炼',
    subTitleEn: 'Tier 1 Realm · Novice Trial',
    rangeLabel: '1 – 999 (10⁰–10³)',
    minVal: 1,
    maxVal: 999,
    baseMultiplier: 1,
    monsterNameZh: '翡翠森林史莱姆',
    monsterNameEn: 'Emerald Slime',
    bossNameZh: '巨型狂暴史莱姆王',
    bossNameEn: 'King Slime Sovereign',
    themeColor: '#10b981',
    accentHex: 0x10b981,
    groundHex: 0x163024,
    fogHex: 0x0b1614,
  },
  {
    zone: 2,
    nameZh: '铜幕幽林',
    nameEn: 'Copperveil Woods',
    subTitleZh: '第2阶场所 · 千倍膨胀',
    subTitleEn: 'Tier 2 Realm · Kilo Surge',
    rangeLabel: '1,000 – 1,000,000 (10³–10⁶)',
    minVal: 1_000,
    maxVal: 999_999,
    baseMultiplier: 1_000,
    monsterNameZh: '重甲枯木树精',
    monsterNameEn: 'Armored Treant',
    bossNameZh: '千年腐化古树守卫',
    bossNameEn: 'Elder Blight Treant',
    themeColor: '#f59e0b',
    accentHex: 0xf59e0b,
    groundHex: 0x261e14,
    fogHex: 0x14100a,
  },
  {
    zone: 3,
    nameZh: '铁炉深窟',
    nameEn: 'Ironforge Caverns',
    subTitleZh: '第3阶场所 · 百万狂潮',
    subTitleEn: 'Tier 3 Realm · Mega Surge',
    rangeLabel: '1M – 999M (10⁶–10⁹)',
    minVal: 1e6,
    maxVal: 1e9 - 1,
    baseMultiplier: 1e6,
    monsterNameZh: '黑曜石机械魔像',
    monsterNameEn: 'Obsidian Golem',
    bossNameZh: '熔核巨神兵统领',
    bossNameEn: 'Molten Colossus Prime',
    themeColor: '#eab308',
    accentHex: 0xeab308,
    groundHex: 0x242028,
    fogHex: 0x110f14,
  },
  {
    zone: 4,
    nameZh: '秘银冰峰',
    nameEn: 'Mithril Frostpeaks',
    subTitleZh: '第4阶场所 · 十亿领域',
    subTitleEn: 'Tier 4 Realm · Giga Surge',
    rangeLabel: '1B – 999B (10⁹–10¹²)',
    minVal: 1e9,
    maxVal: 1e12 - 1,
    baseMultiplier: 1e9,
    monsterNameZh: '极寒秘银飞龙',
    monsterNameEn: 'Frostscale Wyvern',
    bossNameZh: '冰冠永冬冰霜巨龙',
    bossNameEn: 'Glacial Wyrm Monarch',
    themeColor: '#38bdf8',
    accentHex: 0x38bdf8,
    groundHex: 0x132434,
    fogHex: 0x09131c,
  },
  {
    zone: 5,
    nameZh: '精金深渊',
    nameEn: 'Adamantite Abyss',
    subTitleZh: '第5阶场所 · 万亿裂隙',
    subTitleEn: 'Tier 5 Realm · Tera Surge',
    rangeLabel: '1T – 999T (10¹²–10¹⁵)',
    minVal: 1e12,
    maxVal: 1e15 - 1,
    baseMultiplier: 1e12,
    monsterNameZh: '深渊蚀骨巨兽',
    monsterNameEn: 'Abyssal Ravager',
    bossNameZh: '深渊吞噬者利维坦',
    bossNameEn: 'Abyssal Behemoth Lord',
    themeColor: '#14b8a6',
    accentHex: 0x14b8a6,
    groundHex: 0x102826,
    fogHex: 0x071413,
  },
  {
    zone: 6,
    nameZh: '符文天城',
    nameEn: 'Runic Sky-Citadel',
    subTitleZh: '第6阶场所 · 千万亿圣域',
    subTitleEn: 'Tier 6 Realm · Peta Surge',
    rangeLabel: '1Qa – 999Qa (10¹⁵–10¹⁸)',
    minVal: 1e15,
    maxVal: 1e18 - 1,
    baseMultiplier: 1e15,
    monsterNameZh: '奥术符文裁决者',
    monsterNameEn: 'Runic Arbiter',
    bossNameZh: '天界符文泰坦神王',
    bossNameEn: 'Arch-Runic Titan',
    themeColor: '#a855f7',
    accentHex: 0xa855f7,
    groundHex: 0x221533,
    fogHex: 0x110a1a,
  },
  {
    zone: 7,
    nameZh: '龙骨火山',
    nameEn: 'Dragonbone Caldera',
    subTitleZh: '第7阶场所 · 百京炼狱',
    subTitleEn: 'Tier 7 Realm · Exa Surge',
    rangeLabel: '1Qi – 999Qi (10¹⁸–10²¹)',
    minVal: 1e18,
    maxVal: 1e21 - 1,
    baseMultiplier: 1e18,
    monsterNameZh: '炼狱骸骨炎龙',
    monsterNameEn: 'Hellfire Dread-Drake',
    bossNameZh: '灭世灾厄古龙巴哈姆特',
    bossNameEn: 'Cataclysm Dragon Emperor',
    themeColor: '#ef4444',
    accentHex: 0xef4444,
    groundHex: 0x2d1212,
    fogHex: 0x180808,
  },
  {
    zone: 8,
    nameZh: '星界虚空圣殿',
    nameEn: 'Astral Void Sanctum',
    subTitleZh: '第8阶场所 · 十垓创世终焉',
    subTitleEn: 'Tier 8 Realm · Zetta Pinnacle',
    rangeLabel: '1Sx – 1Sp (10²¹–10²⁴)',
    minVal: 1e21,
    maxVal: 1e24,
    baseMultiplier: 1e21,
    monsterNameZh: '星界炽天使统御者',
    monsterNameEn: 'Astral Seraph Archon',
    bossNameZh: '永恒星神·维度超越者',
    bossNameEn: 'Eternity Overlord of the Void',
    themeColor: '#f43f5e',
    accentHex: 0xf43f5e,
    groundHex: 0x1a102b,
    fogHex: 0x0b0614,
  },
];

export const ACTIVITY_CONFIG: Record<
  ActivityId,
  {
    id: ActivityId;
    type: 'gathering' | 'crafting';
    nameZh: string;
    nameEn: string;
    npcNameZh: string;
    npcNameEn: string;
    descZh: string;
    descEn: string;
    baseDuration: number; // 5.0 seconds initial cycle duration
    npcUnlockLevel: number; // Required node total level (speed + yield + rare - 2) before NPC can be hired
    npcBaseHireCost: number; // Staggered base Gold cost to hire the Tier 1 NPC
    rareMaterialId: string;
    accentColor: string;
  }
> = {
  mining: {
    id: 'mining',
    type: 'gathering',
    nameZh: '采矿',
    nameEn: 'Mining',
    npcNameZh: '矮人矿工·布隆',
    npcNameEn: 'Dwarf Miner Brom',
    descZh: '开采本阶矿脉获取矿石与星辰棱晶（手动完成附赠摸鱼金币，满10级可雇佣矿工自动采矿）',
    descEn: 'Extract tiered ores & Starlight Prisms (Reach Node Lv.10 to hire Auto-Miner)',
    baseDuration: 5.0,
    npcUnlockLevel: 10,
    npcBaseHireCost: 300,
    rareMaterialId: 'rare_gem',
    accentColor: '#f59e0b',
  },
  logging: {
    id: 'logging',
    type: 'gathering',
    nameZh: '伐木',
    nameEn: 'Logging',
    npcNameZh: '巨木森守·奥恩',
    npcNameEn: 'Forest Warden Ornn',
    descZh: '砍伐本阶灵木获取原木与万年古珀（满12级可雇佣森守自动伐木）',
    descEn: 'Harvest ancient timber & Millennium Amber (Reach Node Lv.12 to hire Auto-Logger)',
    baseDuration: 5.0,
    npcUnlockLevel: 12,
    npcBaseHireCost: 550,
    rareMaterialId: 'rare_amber',
    accentColor: '#10b981',
  },
  foraging: {
    id: 'foraging',
    type: 'gathering',
    nameZh: '采集',
    nameEn: 'Foraging',
    npcNameZh: '百草学者·艾莉娅',
    npcNameEn: 'Botanist Aria',
    descZh: '搜集本阶布料纤维、蜜糖、鲜蛋与圣羽（满14级可雇佣学者自动采集）',
    descEn: 'Gather Cloth Fibers, Sugar, Eggs & Plumes (Reach Node Lv.14 to hire Auto-Forager)',
    baseDuration: 5.0,
    npcUnlockLevel: 14,
    npcBaseHireCost: 900,
    rareMaterialId: 'rare_feather',
    accentColor: '#ec4899',
  },
  fishing: {
    id: 'fishing',
    type: 'gathering',
    nameZh: '钓鱼',
    nameEn: 'Fishing',
    npcNameZh: '沧海钓叟·姜澜',
    npcNameEn: 'Master Angler Jiang',
    descZh: '垂钓本阶灵鱼、产出二级货币【鱼骨头】与龙珠（满16级可雇佣钓叟自动垂钓）',
    descEn: 'Catch tiered fish, Fishbones & Dragon Pearls (Reach Node Lv.16 to hire Auto-Angler)',
    baseDuration: 5.0,
    npcUnlockLevel: 16,
    npcBaseHireCost: 1800,
    rareMaterialId: 'rare_pearl',
    accentColor: '#38bdf8',
  },
  smithing: {
    id: 'smithing',
    type: 'crafting',
    nameZh: '锻造',
    nameEn: 'Smithing',
    npcNameZh: '铁砧匠师·索尔',
    npcNameEn: 'Blacksmith Thorin',
    descZh: '熔炼本阶矿石制作【金属锭】（满14级可雇佣匠师自动熔炼）',
    descEn: 'Smelt Ores into Metal Ingots (Reach Node Lv.14 to hire Auto-Blacksmith)',
    baseDuration: 5.0,
    npcUnlockLevel: 14,
    npcBaseHireCost: 1200,
    rareMaterialId: 'rare_gem',
    accentColor: '#f97316',
  },
  carpentry: {
    id: 'carpentry',
    type: 'crafting',
    nameZh: '工匠',
    nameEn: 'Carpentry',
    npcNameZh: '机关木匠·墨班',
    npcNameEn: 'Artisan Mo',
    descZh: '加工本阶木材制作【木板】（满16级可雇佣木匠自动加工）',
    descEn: 'Mill Logs into Planks (Reach Node Lv.16 to hire Auto-Carpenter)',
    baseDuration: 5.0,
    npcUnlockLevel: 16,
    npcBaseHireCost: 1600,
    rareMaterialId: 'rare_amber',
    accentColor: '#84cc16',
  },
  tailoring: {
    id: 'tailoring',
    type: 'crafting',
    nameZh: '裁缝',
    nameEn: 'Tailoring',
    npcNameZh: '星织裁缝·薇薇安',
    npcNameEn: 'Weaver Vivian',
    descZh: '纺织本阶纤维制作【布匹】（满18级可雇佣裁缝自动纺织）',
    descEn: 'Weave Fibers into Cloth (Reach Node Lv.18 to hire Auto-Weaver)',
    baseDuration: 5.0,
    npcUnlockLevel: 18,
    npcBaseHireCost: 2400,
    rareMaterialId: 'rare_feather',
    accentColor: '#a855f7',
  },
  cooking: {
    id: 'cooking',
    type: 'crafting',
    nameZh: '烹饪',
    nameEn: 'Cooking',
    npcNameZh: '皇家主厨·古斯塔夫',
    npcNameEn: 'Royal Chef Gusteau',
    descZh: '烹制恢复小队生命并倍增战力的【料理消耗品】（满20级可雇佣主厨自动烹饪）',
    descEn: 'Cook Fish, Sugar & Eggs into Rations (Reach Node Lv.20 to hire Auto-Chef)',
    baseDuration: 5.0,
    npcUnlockLevel: 20,
    npcBaseHireCost: 3200,
    rareMaterialId: 'rare_pearl',
    accentColor: '#f43f5e',
  },
};

/**
 * 4 General Consumable / Material Refining Recipes (supports per-tier NPC idle automation)
 */
export const CRAFTING_RECIPES: CraftingRecipe[] = [
  {
    id: 'smelt_ingot',
    activity: 'smithing',
    nameZh: '熔炼金属锭',
    nameEn: 'Smelt Metal Ingot',
    descZh: '消耗 2 矿石 → 产出 1 金属锭（单价为矿石的 3.2 倍）',
    descEn: 'Consumes 2 Ores → Produces 1 Metal Ingot (3.2x value)',
    inputs: [{ itemKey: 'ore', isTiered: true, amount: 2 }],
    output: {
      type: 'resource',
      itemKey: 'ingot',
      isTiered: true,
      amount: 1,
    },
  },
  {
    id: 'mill_wood',
    activity: 'carpentry',
    nameZh: '加工木板',
    nameEn: 'Mill Plank',
    descZh: '消耗 2 木材 → 产出 1 木板（单价为木材的 3.2 倍）',
    descEn: 'Consumes 2 Wood → Produces 1 Plank (3.2x value)',
    inputs: [{ itemKey: 'wood', isTiered: true, amount: 2 }],
    output: {
      type: 'resource',
      itemKey: 'plank',
      isTiered: true,
      amount: 1,
    },
  },
  {
    id: 'spin_weave_cloth',
    activity: 'tailoring',
    nameZh: '纺织布匹',
    nameEn: 'Weave Cloth',
    descZh: '消耗 2 布料纤维 → 产出 1 布匹（单价为纤维的 3.2 倍）',
    descEn: 'Consumes 2 Cloth Fibers → Produces 1 Cloth (3.2x value)',
    inputs: [{ itemKey: 'fiber', isTiered: true, amount: 2 }],
    output: {
      type: 'resource',
      itemKey: 'cloth',
      isTiered: true,
      amount: 1,
    },
  },
  {
    id: 'cook_feast',
    activity: 'cooking',
    nameZh: '烹制战力料理',
    nameEn: 'Cook Gourmet Ration',
    descZh: '消耗 2 鱼类 + 1 糖 + 1 鸡蛋 → 产出 2 料理消耗品',
    descEn: 'Consumes 2 Fish + 1 Sugar + 1 Egg → Cooks 2 Rations',
    inputs: [
      { itemKey: 'fish', isTiered: true, amount: 2 },
      { itemKey: 'sugar', isTiered: false, amount: 1 },
      { itemKey: 'egg', isTiered: false, amount: 1 },
    ],
    output: {
      type: 'food',
      itemKey: 'food',
      isTiered: true,
      amount: 2,
    },
  },
];

/**
 * 6 Squad Equipment & Weapon Blueprints
 */
export const EQUIPMENT_BLUEPRINTS: EquipmentBlueprint[] = [
  // 战士 (Warrior)
  {
    id: 'bp_greatsword',
    requiredClass: 'warrior',
    requiredActivity: 'smithing',
    slot: 'weapon',
    subType: 'greatsword',
    nameZh: '【战士武器】大剑（锻造制作）',
    nameEn: '[Warrior Weapon] Greatsword (Smithing)',
    descZh: '消耗 3 金属锭 → 锻造战士顺劈大剑（近战顺劈3目标 + 全队破甲）',
    descEn: 'Uses 3 Metal Ingots → Forges Warrior Greatsword (Cleaves 3 targets + Armor Break)',
    rareMaterialId: 'rare_gem',
    fixedDuration: 3.5,
    inputs: [{ itemKey: 'ingot', amount: 3 }],
  },
  {
    id: 'bp_plate_armor',
    requiredClass: 'warrior',
    requiredActivity: 'smithing',
    slot: 'armor',
    subType: 'plate_armor',
    nameZh: '【战士护甲】板甲（锻造制作）',
    nameEn: '[Warrior Armor] Plate Armor (Smithing)',
    descZh: '消耗 4 金属锭 → 锻造战士重装板甲（提供全队高额防御与最大生命池）',
    descEn: 'Uses 4 Metal Ingots → Forges Warrior Plate Armor (+Massive Squad DEF & Max HP)',
    rareMaterialId: 'rare_gem',
    fixedDuration: 3.5,
    inputs: [{ itemKey: 'ingot', amount: 4 }],
  },

  // 猎人 (Hunter)
  {
    id: 'bp_bow',
    requiredClass: 'hunter',
    requiredActivity: 'carpentry',
    slot: 'weapon',
    subType: 'bow',
    nameZh: '【猎人武器】弓（工匠制作）',
    nameEn: '[Hunter Weapon] Warbow (Carpentry)',
    descZh: '消耗 4 木板 → 打造猎人远程猎弓（对Boss造成 185% 巨兽猎杀伤害）',
    descEn: 'Uses 4 Planks → Crafts Hunter Ranged Bow (185% Giant-Slayer damage vs Bosses)',
    rareMaterialId: 'rare_amber',
    fixedDuration: 3.5,
    inputs: [{ itemKey: 'plank', amount: 4 }],
  },
  {
    id: 'bp_leather_armor',
    requiredClass: 'hunter',
    requiredActivity: 'tailoring',
    slot: 'armor',
    subType: 'leather_armor',
    nameZh: '【猎人护甲】皮甲（裁缝制作·皮革掉落）',
    nameEn: '[Hunter Armor] Leather Armor (Tailoring)',
    descZh: '消耗 4 战斗皮革 → 缝制猎人皮甲（大幅提升全队皮革/矿木战利品掉落倍率）',
    descEn: 'Uses 4 Combat Leather → Tailors Hunter Leather Armor (+Squad Material/Leather Drop Multiplier)',
    rareMaterialId: 'rare_feather',
    fixedDuration: 3.5,
    inputs: [{ itemKey: 'leather', amount: 4 }],
  },

  // 法师 (Mage)
  {
    id: 'bp_staff',
    requiredClass: 'mage',
    requiredActivity: 'carpentry',
    slot: 'weapon',
    subType: 'staff',
    nameZh: '【法师武器】法杖（工匠制作）',
    nameEn: '[Mage Weapon] Arcane Staff (Carpentry)',
    descZh: '消耗 4 木板 → 打造法师奥术法杖（小怪阶段轰击全屏所有目标 115% AOE）',
    descEn: 'Uses 4 Planks → Crafts Mage Arcane Staff (Hits ALL mobs in wave for 115% AOE)',
    rareMaterialId: 'rare_amber',
    fixedDuration: 3.5,
    inputs: [{ itemKey: 'plank', amount: 4 }],
  },
  {
    id: 'bp_cloth_armor',
    requiredClass: 'mage',
    requiredActivity: 'tailoring',
    slot: 'armor',
    subType: 'cloth_armor',
    nameZh: '【法师护甲】布甲（裁缝制作）',
    nameEn: '[Mage Armor] Cloth Armor (Tailoring)',
    descZh: '消耗 4 布匹 → 缝制法师星织布甲（大幅倍增全队战斗金币获取倍率）',
    descEn: 'Uses 4 Cloth → Tailors Mage Cloth Robe (+Massive Squad Gold Drop Multiplier)',
    rareMaterialId: 'rare_feather',
    fixedDuration: 3.5,
    inputs: [{ itemKey: 'cloth', amount: 4 }],
  },
];

/**
 * 8 Era Perks (T1..T8): Every Tier unlocks a brand-new gameplay rule / paradigm shift!
 */
export interface EraPerkDef {
  tier: Tier;
  eraNameZh: string;
  eraNameEn: string;
  perkTitleZh: string;
  perkTitleEn: string;
  perkDescZh: string;
  perkDescEn: string;
  descZh: string;
  descEn: string;
}

export const ERA_PERKS: EraPerkDef[] = [
  {
    tier: 1,
    eraNameZh: 'T1 青铜·拓荒纪元',
    eraNameEn: 'T1 Bronze Pioneer Era',
    perkTitleZh: '战士铸剑 · 渐进集结',
    perkTitleEn: 'Warrior Forge & Squad Assembly',
    perkDescZh:
      '从采矿-熔炼-锻造战士大剑起步，推进第1阶战斗逐步招募猎人(S3)与法师(S6)，集结三人小队。',
    perkDescEn:
      'Start with Warrior Smithing line, then progressively recruit Hunter (S3) and Mage (S6).',
    descZh:
      '从采矿-熔炼-锻造战士大剑起步，推进第1阶战斗逐步招募猎人(S3)与法师(S6)，集结三人小队。',
    descEn:
      'Start with Warrior Smithing line, then progressively recruit Hunter (S3) and Mage (S6).',
  },
  {
    tier: 2,
    eraNameZh: 'T2 寒铁·工业共鸣纪元',
    eraNameEn: 'T2 Cold-Iron Synergy Era',
    perkTitleZh: '全服NPC双倍暴击共鸣',
    perkTitleEn: 'Global NPC Double-Yield Synergy',
    perkDescZh:
      '每雇佣 1 名自动 NPC 提供 +6% 工业共鸣率（最高100%），所有采集与加工触发双倍暴击产出！',
    perkDescEn:
      'Every hired NPC grants +6% Synergy Chance (up to 100%) for 2x Critical Yield on all production!',
    descZh:
      '每雇佣 1 名自动 NPC 提供 +6% 工业共鸣率（最高100%），所有采集与加工触发双倍暴击产出！',
    descEn:
      'Every hired NPC grants +6% Synergy Chance (up to 100%) for 2x Critical Yield on all production!',
  },
  {
    tier: 3,
    eraNameZh: 'T3 精钢·小队奥义纪元',
    eraNameEn: 'T3 High-Steel Ultimate Era',
    perkTitleZh: '三位一体 · 合击奥义槽',
    perkTitleEn: 'Trinity Squad Ultimate Strike',
    perkDescZh:
      '解锁战斗【小队合击奥义槽】！每次攻击充能，满 100% 自动轰出 1200% 全队总攻击力的次元断罪！',
    perkDescEn:
      'Unlocks Squad Ultimate Bar! Attacks charge energy to unleash a 1200% Total Squad ATK strike!',
    descZh:
      '解锁战斗【小队合击奥义槽】！每次攻击充能，满 100% 自动轰出 1200% 全队总攻击力的次元断罪！',
    descEn:
      'Unlocks Squad Ultimate Bar! Attacks charge energy to unleash a 1200% Total Squad ATK strike!',
  },
  {
    tier: 4,
    eraNameZh: 'T4 秘银·宗师神匠纪元',
    eraNameEn: 'T4 Mithril Artificer Era',
    perkTitleZh: '自动锻造 & 同阶吞噬+N',
    perkTitleEn: 'Auto-Forge & Auto-Synthesis +N',
    perkDescZh:
      '解锁【神匠自动锻造与合成】开关：耗材充足自动打造装备，同阶装备自动吞噬融合使英雄穿戴装备强化等级 +1！',
    perkDescEn:
      'Unlocks Auto-Forge & Merge: automatically crafts gear and merges same-tier items into +1 Enhance Level!',
    descZh:
      '解锁【神匠自动锻造与合成】开关：耗材充足自动打造装备，同阶装备自动吞噬融合使英雄穿戴装备强化等级 +1！',
    descEn:
      'Unlocks Auto-Forge & Merge: automatically crafts gear and merges same-tier items into +1 Enhance Level!',
  },
  {
    tier: 5,
    eraNameZh: 'T5 精金·生态闭环纪元',
    eraNameEn: 'T5 Adamantite Zero-Loss Era',
    perkTitleZh: '零损耗永动加工',
    perkTitleEn: 'Zero-Consumption Refining',
    perkDescZh:
      '锻造、工匠、裁缝、烹饪加工不再消耗底层原材料！原矿原木与加工成品可同时自动卖出，享受双倍印钞流水线！',
    perkDescEn:
      'Refining no longer consumes raw materials! Sell both raw materials and refined goods simultaneously!',
    descZh:
      '锻造、工匠、裁缝、烹饪加工不再消耗底层原材料！原矿原木与加工成品可同时自动卖出，享受双倍印钞流水线！',
    descEn:
      'Refining no longer consumes raw materials! Sell both raw materials and refined goods simultaneously!',
  },
  {
    tier: 6,
    eraNameZh: 'T6 符文·超导光束纪元',
    eraNameEn: 'T6 Runic Superconducting Era',
    perkTitleZh: '0.05秒超导光束 & 300%溢出转化',
    perkTitleEn: '0.05s Solid Beam & 300% Overflow',
    perkDescZh:
      '打破周期下限至 0.05s（每秒结算20次，读条化作常亮超导光束），且溢出速度按 300% 暴利转化为单次产量！',
    perkDescEn:
      'Breaks cycle cap down to 0.05s (20/sec solid beam) and triples overflow speed-to-yield conversion!',
    descZh:
      '打破周期下限至 0.05s（每秒结算20次，读条化作常亮超导光束），且溢出速度按 300% 暴利转化为单次产量！',
    descEn:
      'Breaks cycle cap down to 0.05s (20/sec solid beam) and triples overflow speed-to-yield conversion!',
  },
  {
    tier: 7,
    eraNameZh: 'T7 龙骨·古龙神格纪元',
    eraNameEn: 'T7 Dragonbone Divinity Era',
    perkTitleZh: '龙神三连击 & +50%暴击率',
    perkTitleEn: 'Dragon 3x Multistrike & +50% Crit',
    perkDescZh:
      '小队全员暴击率 +50%，每次攻击必定触发【龙神三连击（伤害 ×3.0）】，且强化每级加成跃升至 +35%！',
    perkDescEn:
      'All heroes gain +50% Crit Rate, guaranteed 3x Multistrike on every attack, and +35%/lv enhance scaling!',
    descZh:
      '小队全员暴击率 +50%，每次攻击必定触发【龙神三连击（伤害 ×3.0）】，且强化每级加成跃升至 +35%！',
    descEn:
      'All heroes gain +50% Crit Rate, guaranteed 3x Multistrike on every attack, and +35%/lv enhance scaling!',
  },
  {
    tier: 8,
    eraNameZh: 'T8 星界·终焉超载纪元',
    eraNameEn: 'T8 Astral Overdrive Finale',
    perkTitleZh: '百倍星界超载 & 创世摸鱼神碑',
    perkTitleEn: '100x Overdrive & Endgame Monument',
    perkDescZh:
      '解锁【⚡百倍星界超载开关】（产量×100、战力与金币×250、攻速×300%），并可筑造【创世摸鱼神碑】完美通关！',
    perkDescEn:
      'Unlocks Astral Overdrive (100x Yield, 250x ATK/Gold, 3x Speed) and the Monument of Eternal Slacking!',
    descZh:
      '解锁【⚡百倍星界超载开关】（产量×100、战力与金币×250、攻速×300%），并可筑造【创世摸鱼神碑】完美通关！',
    descEn:
      'Unlocks Astral Overdrive (100x Yield, 250x ATK/Gold, 3x Speed) and the Monument of Eternal Slacking!',
  },
];

export const MONUMENT_STAGES: {
  stage: 1 | 2 | 3;
  nameZh: string;
  nameEn: string;
  descZh: string;
  descEn: string;
  goldCost: number;
  fishboneCost: number;
  inputs: { itemKey: string; amount: number }[];
}[] = [
  {
    stage: 1,
    nameZh: '第一阶段：黄金摸鱼基座',
    nameEn: 'Stage I: Golden Slacking Foundation',
    descZh: '在 3D 浮空岛中央浇筑不朽黄金基座，全产线与战斗收益永久 ×5.0 倍！',
    descEn: 'Erect the Golden Foundation in the 3D Realm. All yields & combat ×5.0!',
    goldCost: 1e12,
    fishboneCost: 200,
    inputs: [
      { itemKey: 'ingot_4', amount: 20 },
      { itemKey: 'plank_4', amount: 20 },
    ],
  },
  {
    stage: 2,
    nameZh: '第二阶段：星界永动方尖碑',
    nameEn: 'Stage II: Astral Perpetual Obelisk',
    descZh: '升起贯穿天际的星界方尖碑与双环星轨，全产线与战斗收益永久 ×25.0 倍！',
    descEn: 'Raise the towering Astral Obelisk & Star Rings. All yields & combat ×25.0!',
    goldCost: 1e18,
    fishboneCost: 1000,
    inputs: [
      { itemKey: 'ingot_6', amount: 30 },
      { itemKey: 'cloth_6', amount: 30 },
    ],
  },
  {
    stage: 3,
    nameZh: '第三阶段：摸鱼创世神冠（完美通关！）',
    nameEn: 'Stage III: Crown of Eternal Slacking (VICTORY!)',
    descZh: '加冕创世神冠，点亮全岛星辰光柱，全收益永久 ×100 倍并颁发《荣耀通关证书》！',
    descEn: 'Crown the Monument, multiply all yields by 100x, and claim your Victory Certificate!',
    goldCost: 1e22,
    fishboneCost: 3000,
    inputs: [
      { itemKey: 'ingot_8', amount: 50 },
      { itemKey: 'plank_8', amount: 50 },
      { itemKey: 'cloth_8', amount: 50 },
    ],
  },
];

export const FISHBONE_UPGRADES: FishboneUpgrade[] = [
  {
    id: 'fb_global_speed',
    nameZh: '深海鱼骨图腾：急速共鸣',
    nameEn: 'Fishbone Totem: Haste Resonance',
    descZh: '所有品阶采集、加工与小队三人攻击速度永久提升 +12% / 级',
    descEn: 'All Gathering, Refining & 3-Hero Squad Attack Speed permanently +12% / Lv',
    level: 0,
    maxLevel: 50,
    baseCost: 15,
    costMult: 1.55,
    effectPerLevel: 0.12,
  },
  {
    id: 'fb_global_yield',
    nameZh: '丰饶鱼骨祭坛：万物倍增',
    nameEn: 'Altar of Abundance: Exponential Yield',
    descZh: '所有品阶采集与通用耗材加工产出倍率乘算 ×1.22 / 级',
    descEn: 'All Gathering & Refining yields multiplied by ×1.22 / Lv',
    level: 0,
    maxLevel: 100,
    baseCost: 25,
    costMult: 1.65,
    effectPerLevel: 0.22,
  },
  {
    id: 'fb_combat_power',
    nameZh: '远古龙鲸骸骨：狂战神力',
    nameEn: 'Leviathan Bone: Combat Supremacy',
    descZh: '冒险小队全属性（攻击/防御/生命）与金币战利品倍率 ×1.28 / 级',
    descEn: '3-Hero Squad Attack, Defense, Max HP & Combat Gold drops ×1.28 / Lv',
    level: 0,
    maxLevel: 100,
    baseCost: 30,
    costMult: 1.7,
    effectPerLevel: 0.28,
  },
  {
    id: 'fb_rare_luck',
    nameZh: '星海祈愿骨占：稀有洞察',
    nameEn: 'Oracle Fishbone: Rare Discovery',
    descZh: '所有稀有材料掉落率永久提升 +20% / 级',
    descEn: 'All Rare Material drop chances permanently +20% / Lv',
    level: 0,
    maxLevel: 40,
    baseCost: 40,
    costMult: 1.75,
    effectPerLevel: 0.2,
  },
  {
    id: 'fb_offline_mastery',
    nameZh: '永恒潮汐律动：离线增幅',
    nameEn: 'Tidal Perpetuity: Offline Mastery',
    descZh: '离线挂机收益与商会出售单价额外提升 +20% / 级',
    descEn: 'Offline idle gains & Shop sell prices increased by +20% / Lv',
    level: 0,
    maxLevel: 30,
    baseCost: 50,
    costMult: 1.85,
    effectPerLevel: 0.2,
  },
];

/**
 * Computes the unit Gold sell price for any raw or refined resource in the Shop / Auto-Sell system.
 * Refined products (Ingots, Planks, Cloth, Rations) sell for 3.2x the base raw material price,
 * rewarding players who keep lower-tier refining NPCs running as automated Gold factories!
 */
export function getResourceUnitPrice(key: string): number {
  if (key === 'sugar') return 2;
  if (key === 'egg') return 3;
  if (RARE_MATERIALS[key]) return 250;

  const parts = key.split('_');
  if (parts.length === 2) {
    const [prefix, tierStr] = parts;
    const tier = Number(tierStr) as Tier;
    const meta = TIER_META[tier];
    if (!meta) return 1;
    const base = meta.baseMultiplier; // 1, 1000, 1e6, 1e9...

    switch (prefix) {
      case 'ore':
      case 'wood':
      case 'fish':
      case 'fiber':
        return Math.max(1, Math.round(3 * base));
      case 'leather':
        return Math.max(2, Math.round(5 * base));
      case 'ingot':
      case 'plank':
      case 'cloth':
        return Math.max(8, Math.round(10 * base)); // Consumes 2 raw (worth 6) -> sells for 10!
      case 'food':
        return Math.max(10, Math.round(12 * base));
    }
  }
  return 1;
}

/**
 * Generates an EquipmentItem for any of the 6 class-specific subtypes.
 */
export function generateEquipmentItem(
  tier: Tier,
  slot: EquipmentSlot,
  subType: EquipmentSubType,
  useRare: boolean
): EquipmentItem {
  const meta = TIER_META[tier];
  const baseScale = meta.baseMultiplier;
  const rareBonus = useRare ? 3.2 : 1.0;
  const totalMult = baseScale * rareBonus;

  let requiredClass: PlayerClass = 'warrior';
  let nameZh = '';
  let nameEn = '';
  let attack = 0;
  let defense = 0;
  let maxHp = 0;
  let critRate = 0.05;
  let goldBonus = 0;
  let lootBonus = 0;
  let armorBreak = 0;
  let speedBonus = 0;

  const rarePrefixZh = useRare ? '【神话·星耀】' : '';
  const rarePrefixEn = useRare ? '[Mythic] ' : '';

  if (subType === 'greatsword') {
    requiredClass = 'warrior';
    nameZh = `${rarePrefixZh}${meta.prefixZh}重型大剑`;
    nameEn = `${rarePrefixEn}${meta.prefixEn} Greatsword`;
    attack = Math.max(1, Math.round(24 * totalMult));
    defense = Math.round(12 * totalMult);
    maxHp = Math.round(95 * totalMult);
    critRate = useRare ? 0.18 : 0.1;
    armorBreak = (useRare ? 0.35 : 0.18) + (tier - 1) * 0.08;
    goldBonus = useRare ? 0.12 : 0.05;
    lootBonus = 0.05;
    speedBonus = 0.05;
  } else if (subType === 'plate_armor') {
    requiredClass = 'warrior';
    nameZh = `${rarePrefixZh}${meta.prefixZh}圣堂板甲`;
    nameEn = `${rarePrefixEn}${meta.prefixEn} Plate Armor`;
    attack = Math.round(7 * totalMult);
    defense = Math.max(1, Math.round(42 * totalMult));
    maxHp = Math.max(10, Math.round(310 * totalMult));
    critRate = 0.06;
    armorBreak = (useRare ? 0.25 : 0.12) + (tier - 1) * 0.06;
    goldBonus = useRare ? 0.12 : 0.05;
    lootBonus = 0.05;
    speedBonus = 0.04;
  } else if (subType === 'bow') {
    requiredClass = 'hunter';
    nameZh = `${rarePrefixZh}${meta.prefixZh}追风猎弓`;
    nameEn = `${rarePrefixEn}${meta.prefixEn} Warbow`;
    attack = Math.max(1, Math.round(22 * totalMult));
    defense = Math.round(4 * totalMult);
    maxHp = Math.round(45 * totalMult);
    critRate = useRare ? 0.42 : 0.25;
    lootBonus = (useRare ? 0.45 : 0.2) + (tier - 1) * 0.1;
    goldBonus = useRare ? 0.15 : 0.06;
    armorBreak = 0.06;
    speedBonus = useRare ? 0.38 : 0.22;
  } else if (subType === 'leather_armor') {
    requiredClass = 'hunter';
    nameZh = `${rarePrefixZh}${meta.prefixZh}猎龙皮甲`;
    nameEn = `${rarePrefixEn}${meta.prefixEn} Leather Armor`;
    attack = Math.max(1, Math.round(12 * totalMult));
    defense = Math.max(1, Math.round(20 * totalMult));
    maxHp = Math.max(10, Math.round(150 * totalMult));
    critRate = useRare ? 0.26 : 0.15;
    lootBonus = (useRare ? 0.65 : 0.3) + (tier - 1) * 0.14;
    goldBonus = useRare ? 0.2 : 0.08;
    armorBreak = 0.05;
    speedBonus = useRare ? 0.28 : 0.15;
  } else if (subType === 'staff') {
    requiredClass = 'mage';
    nameZh = `${rarePrefixZh}${meta.prefixZh}奥术法杖`;
    nameEn = `${rarePrefixEn}${meta.prefixEn} Arcane Staff`;
    attack = Math.max(1, Math.round(30 * totalMult));
    defense = Math.round(3 * totalMult);
    maxHp = Math.round(40 * totalMult);
    critRate = useRare ? 0.28 : 0.16;
    goldBonus = (useRare ? 0.55 : 0.25) + (tier - 1) * 0.14;
    lootBonus = 0.08;
    armorBreak = 0.08;
    speedBonus = 0.08;
  } else {
    // cloth_armor (Mage)
    requiredClass = 'mage';
    nameZh = `${rarePrefixZh}${meta.prefixZh}星织布甲`;
    nameEn = `${rarePrefixEn}${meta.prefixEn} Cloth Robe`;
    attack = Math.max(1, Math.round(15 * totalMult));
    defense = Math.max(1, Math.round(15 * totalMult));
    maxHp = Math.max(10, Math.round(125 * totalMult));
    critRate = useRare ? 0.24 : 0.14;
    goldBonus = (useRare ? 0.75 : 0.35) + (tier - 1) * 0.16;
    lootBonus = 0.08;
    armorBreak = 0.06;
    speedBonus = 0.08;
  }

  const sellPrice = Math.max(15, Math.round(45 * baseScale * (useRare ? 4 : 1)));

  return {
    id: `eq_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    tier,
    requiredClass,
    slot,
    subType,
    isRare: useRare,
    enhanceLevel: 0,
    nameZh,
    nameEn,
    attack,
    defense,
    maxHp,
    critRate,
    goldBonus,
    lootBonus,
    armorBreak,
    speedBonus,
    sellPrice,
    colorHex: meta.colorHex,
  };
}

export function getResourceName(key: string, lang: 'zh' | 'en'): string {
  if (key === 'sugar') return lang === 'zh' ? '晶莹蜜糖' : 'Crystal Sugar';
  if (key === 'egg') return lang === 'zh' ? '灵禽鲜蛋' : 'Fresh Egg';
  if (RARE_MATERIALS[key]) {
    return lang === 'zh' ? RARE_MATERIALS[key].nameZh : RARE_MATERIALS[key].nameEn;
  }

  const parts = key.split('_');
  if (parts.length === 2) {
    const [prefix, tierStr] = parts;
    const tier = Number(tierStr) as Tier;
    const meta = TIER_META[tier];
    if (!meta) return key;

    switch (prefix) {
      case 'ore':
        return lang === 'zh' ? meta.oreZh : meta.oreEn;
      case 'ingot':
        return lang === 'zh' ? meta.ingotZh : meta.ingotEn;
      case 'wood':
        return lang === 'zh' ? meta.woodZh : meta.woodEn;
      case 'plank':
        return lang === 'zh' ? `${meta.prefixZh}木板` : `${meta.prefixEn} Plank`;
      case 'fish':
        return lang === 'zh' ? meta.fishZh : meta.fishEn;
      case 'fiber':
        return lang === 'zh' ? meta.fiberZh : meta.fiberEn;
      case 'cloth':
        return lang === 'zh' ? `${meta.prefixZh}布匹` : `${meta.prefixEn} Cloth`;
      case 'leather':
        return lang === 'zh' ? meta.leatherZh : meta.leatherEn;
      case 'food':
        return lang === 'zh' ? meta.foodZh : meta.foodEn;
    }
  }
  return key;
}

export function createInitialTierMap(): Record<Tier, TierNodeState> {
  const map = {} as Record<Tier, TierNodeState>;
  for (const t of TIERS) {
    map[t] = {
      tier: t,
      unlocked: t === 1,
      speedLevel: 1,
      yieldLevel: 1,
      rareDropLevel: 1,
      npcHired: false,
      npcLevel: 1,
      progress: 0,
      isRunning: false,
    };
  }
  return map;
}

export function createInitialGameState(): GameState {
  const initialResources: Record<string, number> = {
    sugar: 0,
    egg: 0,
    rare_gem: 0,
    rare_amber: 0,
    rare_pearl: 0,
    rare_feather: 0,
  };

  TIERS.forEach((t) => {
    initialResources[`ore_${t}`] = 0;
    initialResources[`ingot_${t}`] = 0;
    initialResources[`wood_${t}`] = 0;
    initialResources[`plank_${t}`] = 0;
    initialResources[`fish_${t}`] = 0;
    initialResources[`fiber_${t}`] = 0;
    initialResources[`cloth_${t}`] = 0;
    initialResources[`leather_${t}`] = 0;
    initialResources[`food_${t}`] = 0;
  });

  const sellRawByTier = {} as Record<Tier, boolean>;
  const sellRefinedByTier = {} as Record<Tier, boolean>;
  for (const t of TIERS) {
    sellRawByTier[t] = false;
    sellRefinedByTier[t] = false;
  }

  return {
    version: 7,
    language: 'zh',
    lastSavedAt: Date.now(),
    gold: 10,
    fishbones: 0,
    totalGoldEarned: 10,
    soundEnabled: true,
    cameraFocus: 'overview',
    dockCollapsed: false,
    activeTab: 'gathering',
    progression: {
      unlockedTabs: {
        gathering: true,
        crafting: false,
        forge: false,
        combat: false,
        character: false,
        shop: false,
        altar: false,
        monument: true,
      },
      unlockedHeroes: {
        warrior: true,
        hunter: false,
        mage: false,
      },
      unlockedActivities: {
        mining: true,
        smithing: false,
        logging: false,
        carpentry: false,
        foraging: false,
        tailoring: false,
        fishing: false,
        cooking: false,
      },
      craftingUnlocked: false,
      forgeUnlocked: false,
      combatUnlocked: false,
      loggingLineUnlocked: false,
      foragingLineUnlocked: false,
      fishingLineUnlocked: false,
      overdriveActive: false,
      monumentStage: 0,
      victoryCompletedAt: null,
      victoryModalShown: false,
      startedAt: Date.now(),
      completedAt: null,
      manualClicks: 0,
    },
    activeGatheringTier: 1,
    activeCraftingTier: 1,
    classLoadouts: {
      warrior: { weapon: null, armor: null },
      hunter: { weapon: null, armor: null },
      mage: { weapon: null, armor: null },
    },
    resources: initialResources,
    activities: {
      mining: {
        id: 'mining',
        unlockedTier: 1,
        selectedTier: 1,
        selectedRecipeId: '',
        tiers: createInitialTierMap(),
      },
      logging: {
        id: 'logging',
        unlockedTier: 1,
        selectedTier: 1,
        selectedRecipeId: '',
        tiers: createInitialTierMap(),
      },
      fishing: {
        id: 'fishing',
        unlockedTier: 1,
        selectedTier: 1,
        selectedRecipeId: '',
        tiers: createInitialTierMap(),
      },
      foraging: {
        id: 'foraging',
        unlockedTier: 1,
        selectedTier: 1,
        selectedRecipeId: '',
        tiers: createInitialTierMap(),
      },
      smithing: {
        id: 'smithing',
        unlockedTier: 1,
        selectedTier: 1,
        selectedRecipeId: 'smelt_ingot',
        tiers: createInitialTierMap(),
      },
      carpentry: {
        id: 'carpentry',
        unlockedTier: 1,
        selectedTier: 1,
        selectedRecipeId: 'mill_wood',
        tiers: createInitialTierMap(),
      },
      tailoring: {
        id: 'tailoring',
        unlockedTier: 1,
        selectedTier: 1,
        selectedRecipeId: 'spin_weave_cloth',
        tiers: createInitialTierMap(),
      },
      cooking: {
        id: 'cooking',
        unlockedTier: 1,
        selectedTier: 1,
        selectedRecipeId: 'cook_feast',
        tiers: createInitialTierMap(),
      },
    },
    equipmentForge: {
      selectedBlueprintId: 'bp_greatsword',
      selectedTier: 1,
      useRare: false,
      isCrafting: false,
      progress: 0,
      craftingBlueprintId: null,
      craftingTier: 1,
      craftingUseRare: false,
      autoForge: false,
      autoForgeEnabled: false,
    },
    autoSell: {
      enabled: true,
      reserveAmount: 30,
      sellRawByTier,
      sellRefinedByTier,
      sellCommonIngredients: false,
      autoSellEquipmentBelowTier: 0,
    },
    lastAutoSellGoldPerSec: 0,
    equipmentBag: [],
    combat: {
      isFighting: false,
      currentZone: 1,
      stageInZone: 1,
      maxUnlockedZone: 1,
      maxStageInHighestZone: 1,
      autoAdvance: true,
      playerHp: 85,
      playerMaxHp: 85,
      warriorAttackTimer: 0,
      hunterAttackTimer: 0,
      mageAttackTimer: 0,
      ultimateCharge: 0,
      enemyCount: 3,
      enemiesAlive: 3,
      enemyHp: 90,
      enemyMaxHp: 90,
      singleEnemyMaxHp: 30,
      enemyAttackTimer: 0,
      selectedFoodTier: 1,
      autoEatThreshold: 0.55,
      activeBuffTimer: 0,
      activeBuffTier: 1,
      totalKills: 0,
    },
    fishboneUpgrades: {
      fb_global_speed: 0,
      fb_global_yield: 0,
      fb_combat_power: 0,
      fb_rare_luck: 0,
      fb_offline_mastery: 0,
    },
  };
}
