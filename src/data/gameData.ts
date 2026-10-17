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
    roleTitleZh: '近战前排',
    roleTitleEn: 'Vanguard',
    combatStyleZh: '顺劈3个目标',
    combatStyleEn: 'Cleaves 3 targets',
    weaponNameZh: '重剑',
    weaponNameEn: 'Greatsword',
    armorNameZh: '板甲',
    armorNameEn: 'Plate Armor',
    descZh: '近战顺劈，提供破甲与生命上限',
    descEn: 'Melee cleave with armor break and high health',
    weaponSubType: 'greatsword',
    armorSubType: 'plate_armor',
    color: '#f59e0b',
  },
  hunter: {
    id: 'hunter',
    nameZh: '猎人',
    nameEn: 'Hunter',
    roleTitleZh: '远程射手',
    roleTitleEn: 'Ranger',
    combatStyleZh: '对首领伤害提升',
    combatStyleEn: 'Bonus Boss DMG',
    weaponNameZh: '猎弓',
    weaponNameEn: 'Warbow',
    armorNameZh: '皮甲',
    armorNameEn: 'Leather Armor',
    descZh: '远程射击，擅长应对首领并提升战利品掉率',
    descEn: 'Ranged archer excelling against bosses',
    weaponSubType: 'bow',
    armorSubType: 'leather_armor',
    color: '#10b981',
  },
  mage: {
    id: 'mage',
    nameZh: '法师',
    nameEn: 'Mage',
    roleTitleZh: '奥术群攻',
    roleTitleEn: 'Arcanist',
    combatStyleZh: '群体法术伤害',
    combatStyleEn: 'Area Magic DMG',
    weaponNameZh: '法杖',
    weaponNameEn: 'Staff',
    armorNameZh: '布甲',
    armorNameEn: 'Cloth Robe',
    descZh: '法术弹幕覆盖全屏目标，提升金币收益',
    descEn: 'Area spellcaster boosting gold drops',
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
    subTitleZh: '区域 I',
    subTitleEn: 'Zone I',
    rangeLabel: 'T1',
    minVal: 1,
    maxVal: 999,
    baseMultiplier: 1,
    monsterNameZh: '森林史莱姆',
    monsterNameEn: 'Emerald Slime',
    bossNameZh: '史莱姆王',
    bossNameEn: 'King Slime',
    themeColor: '#10b981',
    accentHex: 0x10b981,
    groundHex: 0x163024,
    fogHex: 0x0b1614,
  },
  {
    zone: 2,
    nameZh: '铜幕幽林',
    nameEn: 'Copperveil Woods',
    subTitleZh: '区域 II',
    subTitleEn: 'Zone II',
    rangeLabel: 'T2',
    minVal: 1_000,
    maxVal: 999_999,
    baseMultiplier: 1_000,
    monsterNameZh: '枯木树精',
    monsterNameEn: 'Armored Treant',
    bossNameZh: '千年树卫',
    bossNameEn: 'Elder Treant',
    themeColor: '#f59e0b',
    accentHex: 0xf59e0b,
    groundHex: 0x261e14,
    fogHex: 0x14100a,
  },
  {
    zone: 3,
    nameZh: '铁炉深窟',
    nameEn: 'Ironforge Caverns',
    subTitleZh: '区域 III',
    subTitleEn: 'Zone III',
    rangeLabel: 'T3',
    minVal: 1e6,
    maxVal: 1e9 - 1,
    baseMultiplier: 1e6,
    monsterNameZh: '黑曜魔像',
    monsterNameEn: 'Obsidian Golem',
    bossNameZh: '熔核巨像',
    bossNameEn: 'Molten Colossus',
    themeColor: '#eab308',
    accentHex: 0xeab308,
    groundHex: 0x242028,
    fogHex: 0x110f14,
  },
  {
    zone: 4,
    nameZh: '秘银冰峰',
    nameEn: 'Mithril Frostpeaks',
    subTitleZh: '区域 IV',
    subTitleEn: 'Zone IV',
    rangeLabel: 'T4',
    minVal: 1e9,
    maxVal: 1e12 - 1,
    baseMultiplier: 1e9,
    monsterNameZh: '霜鳞飞龙',
    monsterNameEn: 'Frostscale Wyvern',
    bossNameZh: '凛冬巨龙',
    bossNameEn: 'Glacial Wyrm',
    themeColor: '#38bdf8',
    accentHex: 0x38bdf8,
    groundHex: 0x132434,
    fogHex: 0x09131c,
  },
  {
    zone: 5,
    nameZh: '精金深渊',
    nameEn: 'Adamantite Abyss',
    subTitleZh: '区域 V',
    subTitleEn: 'Zone V',
    rangeLabel: 'T5',
    minVal: 1e12,
    maxVal: 1e15 - 1,
    baseMultiplier: 1e12,
    monsterNameZh: '深渊巨兽',
    monsterNameEn: 'Abyssal Ravager',
    bossNameZh: '深渊利维坦',
    bossNameEn: 'Abyssal Behemoth',
    themeColor: '#14b8a6',
    accentHex: 0x14b8a6,
    groundHex: 0x102826,
    fogHex: 0x071413,
  },
  {
    zone: 6,
    nameZh: '符文天城',
    nameEn: 'Runic Sky-Citadel',
    subTitleZh: '区域 VI',
    subTitleEn: 'Zone VI',
    rangeLabel: 'T6',
    minVal: 1e15,
    maxVal: 1e18 - 1,
    baseMultiplier: 1e15,
    monsterNameZh: '符文裁决者',
    monsterNameEn: 'Runic Arbiter',
    bossNameZh: '符文泰坦',
    bossNameEn: 'Runic Titan',
    themeColor: '#a855f7',
    accentHex: 0xa855f7,
    groundHex: 0x221533,
    fogHex: 0x110a1a,
  },
  {
    zone: 7,
    nameZh: '龙骨火山',
    nameEn: 'Dragonbone Caldera',
    subTitleZh: '区域 VII',
    subTitleEn: 'Zone VII',
    rangeLabel: 'T7',
    minVal: 1e18,
    maxVal: 1e21 - 1,
    baseMultiplier: 1e18,
    monsterNameZh: '骸骨炎龙',
    monsterNameEn: 'Hellfire Drake',
    bossNameZh: '灾厄古龙',
    bossNameEn: 'Cataclysm Dragon',
    themeColor: '#ef4444',
    accentHex: 0xef4444,
    groundHex: 0x2d1212,
    fogHex: 0x180808,
  },
  {
    zone: 8,
    nameZh: '星界圣殿',
    nameEn: 'Astral Sanctum',
    subTitleZh: '区域 VIII',
    subTitleEn: 'Zone VIII',
    rangeLabel: 'T8',
    minVal: 1e21,
    maxVal: 1e24,
    baseMultiplier: 1e21,
    monsterNameZh: '星界炽天使',
    monsterNameEn: 'Astral Seraph',
    bossNameZh: '星界主宰',
    bossNameEn: 'Astral Overlord',
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
    baseDuration: number;
    npcUnlockLevel: number;
    npcBaseHireCost: number;
    rareMaterialId: string;
    accentColor: string;
  }
> = {
  mining: {
    id: 'mining',
    type: 'gathering',
    nameZh: '采矿',
    nameEn: 'Mining',
    npcNameZh: '矿工布隆',
    npcNameEn: 'Miner Brom',
    descZh: '开采矿石，小概率伴生星辰棱晶',
    descEn: 'Extract ores and rare Starlight Prisms',
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
    npcNameZh: '樵夫奥恩',
    npcNameEn: 'Logger Ornn',
    descZh: '砍伐原木，小概率伴生万年古珀',
    descEn: 'Harvest timber and rare Amber',
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
    npcNameZh: '草药师艾莉娅',
    npcNameEn: 'Herbalist Aria',
    descZh: '采集纤维、蜜糖与鲜蛋',
    descEn: 'Gather fibers, sugar and eggs',
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
    npcNameZh: '钓叟姜澜',
    npcNameEn: 'Angler Jiang',
    descZh: '垂钓鲜鱼与鱼骨',
    descEn: 'Catch fish and fishbones',
    baseDuration: 5.0,
    npcUnlockLevel: 16,
    npcBaseHireCost: 1800,
    rareMaterialId: 'rare_pearl',
    accentColor: '#38bdf8',
  },
  smithing: {
    id: 'smithing',
    type: 'crafting',
    nameZh: '熔炼',
    nameEn: 'Smithing',
    npcNameZh: '铁匠索尔',
    npcNameEn: 'Blacksmith Thorin',
    descZh: '将矿石熔炼为金属锭',
    descEn: 'Smelt ores into metal ingots',
    baseDuration: 5.0,
    npcUnlockLevel: 14,
    npcBaseHireCost: 1200,
    rareMaterialId: 'rare_gem',
    accentColor: '#f97316',
  },
  carpentry: {
    id: 'carpentry',
    type: 'crafting',
    nameZh: '木工',
    nameEn: 'Carpentry',
    npcNameZh: '木匠墨班',
    npcNameEn: 'Carpenter Mo',
    descZh: '将原木加工为木板',
    descEn: 'Mill logs into planks',
    baseDuration: 5.0,
    npcUnlockLevel: 16,
    npcBaseHireCost: 1600,
    rareMaterialId: 'rare_amber',
    accentColor: '#84cc16',
  },
  tailoring: {
    id: 'tailoring',
    type: 'crafting',
    nameZh: '纺织',
    nameEn: 'Tailoring',
    npcNameZh: '裁缝薇薇安',
    npcNameEn: 'Weaver Vivian',
    descZh: '将纤维纺织为布匹',
    descEn: 'Weave fibers into cloth',
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
    npcNameZh: '厨师古斯塔夫',
    npcNameEn: 'Chef Gusteau',
    descZh: '烹制恢复生命的料理',
    descEn: 'Cook rations for combat recovery',
    baseDuration: 5.0,
    npcUnlockLevel: 20,
    npcBaseHireCost: 3200,
    rareMaterialId: 'rare_pearl',
    accentColor: '#f43f5e',
  },
};

export const CRAFTING_RECIPES: CraftingRecipe[] = [
  {
    id: 'smelt_ingot',
    activity: 'smithing',
    nameZh: '熔炼金属锭',
    nameEn: 'Smelt Ingot',
    descZh: '2 矿石 → 1 金属锭',
    descEn: '2 Ores → 1 Ingot',
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
    descZh: '2 木材 → 1 木板',
    descEn: '2 Wood → 1 Plank',
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
    descZh: '2 纤维 → 1 布匹',
    descEn: '2 Fibers → 1 Cloth',
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
    nameZh: '烹制料理',
    nameEn: 'Cook Ration',
    descZh: '2 鱼 + 1 糖 + 1 蛋 → 2 料理',
    descEn: '2 Fish + 1 Sugar + 1 Egg → 2 Rations',
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

export const EQUIPMENT_BLUEPRINTS: EquipmentBlueprint[] = [
  {
    id: 'bp_greatsword',
    requiredClass: 'warrior',
    requiredActivity: 'smithing',
    slot: 'weapon',
    subType: 'greatsword',
    nameZh: '战士 · 重剑',
    nameEn: 'Warrior · Greatsword',
    descZh: '近战顺劈武器，附带破甲',
    descEn: 'Melee cleave weapon with armor break',
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
    nameZh: '战士 · 板甲',
    nameEn: 'Warrior · Plate Armor',
    descZh: '重型护甲，大幅提升防御与生命',
    descEn: 'Heavy armor boosting defense and health',
    rareMaterialId: 'rare_gem',
    fixedDuration: 3.5,
    inputs: [{ itemKey: 'ingot', amount: 4 }],
  },
  {
    id: 'bp_bow',
    requiredClass: 'hunter',
    requiredActivity: 'carpentry',
    slot: 'weapon',
    subType: 'bow',
    nameZh: '猎人 · 猎弓',
    nameEn: 'Hunter · Warbow',
    descZh: '远程武器，对首领造成额外伤害',
    descEn: 'Ranged bow dealing bonus damage to bosses',
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
    nameZh: '猎人 · 皮甲',
    nameEn: 'Hunter · Leather Armor',
    descZh: '轻便护甲，提升战利品掉落率',
    descEn: 'Light armor increasing material drop rates',
    rareMaterialId: 'rare_feather',
    fixedDuration: 3.5,
    inputs: [{ itemKey: 'leather', amount: 4 }],
  },
  {
    id: 'bp_staff',
    requiredClass: 'mage',
    requiredActivity: 'carpentry',
    slot: 'weapon',
    subType: 'staff',
    nameZh: '法师 · 法杖',
    nameEn: 'Mage · Staff',
    descZh: '法术武器，攻击波次内全体目标',
    descEn: 'Arcane staff hitting all targets in a wave',
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
    nameZh: '法师 · 布甲',
    nameEn: 'Mage · Cloth Robe',
    descZh: '法术长袍，提升战斗金币收益',
    descEn: 'Arcane robe increasing combat gold drops',
    rareMaterialId: 'rare_feather',
    fixedDuration: 3.5,
    inputs: [{ itemKey: 'cloth', amount: 4 }],
  },
];

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
    eraNameZh: 'T1 粗铜',
    eraNameEn: 'T1 Copper',
    perkTitleZh: '铁砧初鸣',
    perkTitleEn: 'First Anvil',
    perkDescZh: '开启采矿与熔炼，召集冒险小队。',
    perkDescEn: 'Unlock mining, smithing, and assemble your squad.',
    descZh: '开启采矿与熔炼，召集冒险小队。',
    descEn: 'Unlock mining, smithing, and assemble your squad.',
  },
  {
    tier: 2,
    eraNameZh: 'T2 寒铁',
    eraNameEn: 'T2 Cold-Iron',
    perkTitleZh: '工坊协力',
    perkTitleEn: 'Workshop Synergy',
    perkDescZh: '每名已雇佣工匠提供 +6% 双倍产出概率（最高 100%）。',
    perkDescEn: 'Each hired NPC grants +6% chance for double output (up to 100%).',
    descZh: '每名已雇佣工匠提供 +6% 双倍产出概率（最高 100%）。',
    descEn: 'Each hired NPC grants +6% chance for double output (up to 100%).',
  },
  {
    tier: 3,
    eraNameZh: 'T3 精钢',
    eraNameEn: 'T3 High-Steel',
    perkTitleZh: '小队合击',
    perkTitleEn: 'Squad Strike',
    perkDescZh: '战斗中每次攻击积攒合击槽，蓄满释放 12 倍伤害的合击技。',
    perkDescEn: 'Attacks charge the Squad Bar to unleash a 12x damage strike.',
    descZh: '战斗中每次攻击积攒合击槽，蓄满释放 12 倍伤害的合击技。',
    descEn: 'Attacks charge the Squad Bar to unleash a 12x damage strike.',
  },
  {
    tier: 4,
    eraNameZh: 'T4 秘银',
    eraNameEn: 'T4 Mithril',
    perkTitleZh: '炉火纯青',
    perkTitleEn: 'Master Artificer',
    perkDescZh: '解锁自动锻造；打造出同阶装备时自动融合（强化 +1）。',
    perkDescEn: 'Unlocks Auto-Forge; same-tier gear automatically merges (+1 Enhance).',
    descZh: '解锁自动锻造；打造出同阶装备时自动融合（强化 +1）。',
    descEn: 'Unlocks Auto-Forge; same-tier gear automatically merges (+1 Enhance).',
  },
  {
    tier: 5,
    eraNameZh: 'T5 精金',
    eraNameEn: 'T5 Adamantite',
    perkTitleZh: '炉火返还',
    perkTitleEn: 'Zero-Loss Refining',
    perkDescZh: '熔炼、木工、纺织与烹饪不再消耗基础原料。',
    perkDescEn: 'Refining no longer consumes raw materials.',
    descZh: '熔炼、木工、纺织与烹饪不再消耗基础原料。',
    descEn: 'Refining no longer consumes raw materials.',
  },
  {
    tier: 6,
    eraNameZh: 'T6 符文',
    eraNameEn: 'T6 Runic',
    perkTitleZh: '极速连产',
    perkTitleEn: 'Rapid Production',
    perkDescZh: '生产周期上限突破至 0.05 秒，溢出速度按 3 倍转化为产量。',
    perkDescEn: 'Cycle minimum drops to 0.05s; excess speed converts 3x into yield.',
    descZh: '生产周期上限突破至 0.05 秒，溢出速度按 3 倍转化为产量。',
    descEn: 'Cycle minimum drops to 0.05s; excess speed converts 3x into yield.',
  },
  {
    tier: 7,
    eraNameZh: 'T7 龙骨',
    eraNameEn: 'T7 Dragonbone',
    perkTitleZh: '古龙战意',
    perkTitleEn: 'Dragon Might',
    perkDescZh: '小队暴击率 +50%，普攻变为三连击，强化加成提升至 +35%/级。',
    perkDescEn: 'Squad Crit +50%, 3x Multistrike on attacks, +35%/lv enhance scaling.',
    descZh: '小队暴击率 +50%，普攻变为三连击，强化加成提升至 +35%/级。',
    descEn: 'Squad Crit +50%, 3x Multistrike on attacks, +35%/lv enhance scaling.',
  },
  {
    tier: 8,
    eraNameZh: 'T8 星界',
    eraNameEn: 'T8 Astral',
    perkTitleZh: '星界丰碑',
    perkTitleEn: 'Astral Monument',
    perkDescZh: '解锁星界超载与浮空岛中央丰碑建造。',
    perkDescEn: 'Unlocks Astral Overdrive and the central Monument construction.',
    descZh: '解锁星界超载与浮空岛中央丰碑建造。',
    descEn: 'Unlocks Astral Overdrive and the central Monument construction.',
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
    nameZh: '一阶段：丰碑基座',
    nameEn: 'Stage I: Foundation',
    descZh: '全产出与战斗收益 ×5',
    descEn: 'All yields & combat ×5',
    goldCost: 1e12,
    fishboneCost: 200,
    inputs: [
      { itemKey: 'ingot_4', amount: 20 },
      { itemKey: 'plank_4', amount: 20 },
    ],
  },
  {
    stage: 2,
    nameZh: '二阶段：星界方尖碑',
    nameEn: 'Stage II: Astral Obelisk',
    descZh: '全产出与战斗收益 ×25',
    descEn: 'All yields & combat ×25',
    goldCost: 1e18,
    fishboneCost: 1000,
    inputs: [
      { itemKey: 'ingot_6', amount: 30 },
      { itemKey: 'cloth_6', amount: 30 },
    ],
  },
  {
    stage: 3,
    nameZh: '三阶段：星界神冠',
    nameEn: 'Stage III: Astral Crown',
    descZh: '全产出与战斗收益 ×100 · 完成终局丰碑',
    descEn: 'All yields & combat ×100 · Complete the Monument',
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
    nameZh: '急速共鸣',
    nameEn: 'Haste Resonance',
    descZh: '全局生产与攻击速度 +12% / 级',
    descEn: 'Global speed +12% / Lv',
    level: 0,
    maxLevel: 50,
    baseCost: 15,
    costMult: 1.55,
    effectPerLevel: 0.12,
  },
  {
    id: 'fb_global_yield',
    nameZh: '丰饶图腾',
    nameEn: 'Abundance Totem',
    descZh: '采集与加工产量 ×1.22 / 级',
    descEn: 'Gathering & refining yield ×1.22 / Lv',
    level: 0,
    maxLevel: 100,
    baseCost: 25,
    costMult: 1.65,
    effectPerLevel: 0.22,
  },
  {
    id: 'fb_combat_power',
    nameZh: '战力图腾',
    nameEn: 'Combat Totem',
    descZh: '小队属性与金币掉落 ×1.28 / 级',
    descEn: 'Squad stats & combat gold ×1.28 / Lv',
    level: 0,
    maxLevel: 100,
    baseCost: 30,
    costMult: 1.7,
    effectPerLevel: 0.28,
  },
  {
    id: 'fb_rare_luck',
    nameZh: '稀有洞察',
    nameEn: 'Rare Insight',
    descZh: '稀有材料掉落率 +20% / 级',
    descEn: 'Rare material drop rate +20% / Lv',
    level: 0,
    maxLevel: 40,
    baseCost: 40,
    costMult: 1.75,
    effectPerLevel: 0.2,
  },
  {
    id: 'fb_offline_mastery',
    nameZh: '商会契约',
    nameEn: 'Trade Pact',
    descZh: '离线收益与商会售价 +20% / 级',
    descEn: 'Offline gains & shop price +20% / Lv',
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
