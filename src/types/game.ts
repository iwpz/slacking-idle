export type Language = 'zh' | 'en';

export type Tier = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;

export type PlayerClass = 'warrior' | 'hunter' | 'mage';

export type GatheringActivityId = 'mining' | 'logging' | 'fishing' | 'foraging';
export type CraftingActivityId =
  | 'smithing'
  | 'carpentry'
  | 'tailoring'
  | 'cooking';
export type ActivityId = GatheringActivityId | CraftingActivityId;

export type EquipmentSlot = 'weapon' | 'armor';
export type EquipmentSubType =
  | 'greatsword' // 战士武器：大剑（锻造制作）
  | 'bow' // 猎人武器：弓（工匠制作）
  | 'staff' // 法师武器：法杖（工匠制作）
  | 'plate_armor' // 战士护甲：板甲（锻造制作）
  | 'leather_armor' // 猎人护甲：皮甲（裁缝制作，皮革战斗掉落）
  | 'cloth_armor'; // 法师护甲：布甲（裁缝制作）

export interface EquipmentItem {
  id: string;
  tier: Tier;
  requiredClass: PlayerClass;
  slot: EquipmentSlot;
  subType: EquipmentSubType;
  isRare: boolean;
  enhanceLevel: number;
  nameZh: string;
  nameEn: string;
  attack: number;
  defense: number;
  maxHp: number;
  critRate: number; // 0 to 1
  goldBonus: number; // multiplier e.g. 0.25 = +25%
  lootBonus: number; // material/leather drop bonus e.g. 0.25 = +25%
  armorBreak: number; // squad damage amp / armor break e.g. 0.20 = +20%
  speedBonus: number; // combat attack speed bonus
  sellPrice: number;
  colorHex: string;
}

export interface CraftingRecipe {
  id: string;
  activity: CraftingActivityId;
  nameZh: string;
  nameEn: string;
  descZh: string;
  descEn: string;
  inputs: {
    itemKey: string;
    isTiered: boolean;
    amount: number;
  }[];
  output: {
    type: 'resource' | 'food';
    itemKey: string;
    isTiered: boolean;
    amount: number;
  };
}

export interface EquipmentBlueprint {
  id: string;
  requiredClass: PlayerClass;
  requiredActivity: 'smithing' | 'carpentry' | 'tailoring';
  slot: EquipmentSlot;
  subType: EquipmentSubType;
  nameZh: string;
  nameEn: string;
  descZh: string;
  descEn: string;
  rareMaterialId: string;
  fixedDuration: number; // seconds, unaffected by speed bonuses
  inputs: {
    itemKey: 'ingot' | 'plank' | 'cloth' | 'leather';
    amount: number;
  }[];
}

/**
 * Independent state for a single Tier (T1..T8) within an Activity.
 * All unlocked tiers with hired NPCs continue working simultaneously in parallel!
 */
export interface TierNodeState {
  tier: Tier;
  unlocked: boolean;
  speedLevel: number; // Lv.1 = 5.0s -> Lv.100 = 0.50s
  yieldLevel: number;
  rareDropLevel: number;
  npcHired: boolean; // Each Tier has its own dedicated NPC to hire
  npcLevel: number;
  progress: number; // 0 to 1
  isRunning: boolean;
}

export interface ActivityState {
  id: ActivityId;
  unlockedTier: Tier; // Highest unlocked tier (1..8)
  selectedTier: Tier; // Currently viewed tier tab in UI
  selectedRecipeId: string;
  tiers: Record<Tier, TierNodeState>;
}

export interface EquipmentForgeState {
  selectedBlueprintId: string;
  selectedTier: Tier;
  useRare: boolean;
  isCrafting: boolean;
  progress: number; // 0 to 1 (independent progress bar)
  craftingBlueprintId: string | null;
  craftingTier: Tier;
  craftingUseRare: boolean;
  autoForge: boolean; // Unlocked at Tier 4 (Master Artificer Era)
  autoForgeEnabled?: boolean;
}

export interface AutoSellSettings {
  enabled: boolean;
  reserveAmount: number; // Keep this many items in stock per resource before auto-selling excess
  sellRawByTier: Record<Tier, boolean>; // ore, wood, fish, fiber, leather
  sellRefinedByTier: Record<Tier, boolean>; // ingot, plank, cloth, food
  sellCommonIngredients: boolean; // sugar, egg above reserve
  autoSellEquipmentBelowTier: number; // 0 = off, 2..9 = sell non-rare below tier
}

/**
 * Progressive Unlocking & Endgame State:
 * Starts with ONLY the Warrior Smithing Line (Mining -> Smithing -> Warrior Gear -> Warrior Solo Combat)
 * and progressively unlocks new lines, heroes, era mechanics, and the Endgame Monument!
 */
export interface ProgressionState {
  unlockedTabs: {
    gathering: boolean;
    crafting: boolean;
    forge: boolean;
    combat: boolean;
    character: boolean;
    shop: boolean;
    altar: boolean;
    monument: boolean;
  };
  unlockedHeroes: Record<PlayerClass, boolean>;
  unlockedActivities: Record<ActivityId, boolean>;

  // 3D Station visibility flags used by ThreeViewport
  craftingUnlocked: boolean;
  forgeUnlocked: boolean;
  combatUnlocked: boolean;
  loggingLineUnlocked: boolean;
  foragingLineUnlocked: boolean;
  fishingLineUnlocked: boolean;

  // Endgame Overdrive & Monument of Eternal Slacking (Unlocked at Tier 8)
  overdriveActive: boolean;
  monumentStage: 0 | 1 | 2 | 3; // 3 = Game Completed!
  victoryCompletedAt: number | null;
  victoryModalShown?: boolean;
  startedAt?: number;
  completedAt?: number | null;
  manualClicks?: number;
}

export interface CombatZoneInfo {
  zone: Tier;
  nameZh: string;
  nameEn: string;
  subTitleZh: string;
  subTitleEn: string;
  rangeLabel: string;
  minVal: number;
  maxVal: number;
  baseMultiplier: number; // 10^(3*(zone-1))
  monsterNameZh: string;
  monsterNameEn: string;
  bossNameZh: string;
  bossNameEn: string;
  themeColor: string;
  accentHex: number;
  groundHex: number;
  fogHex: number;
}

export interface FishboneUpgrade {
  id: string;
  nameZh: string;
  nameEn: string;
  descZh: string;
  descEn: string;
  level: number;
  maxLevel: number;
  baseCost: number;
  costMult: number;
  effectPerLevel: number;
}

export interface OfflineReport {
  secondsElapsed: number;
  goldEarned: number;
  fishbonesEarned: number;
  itemsGained: Record<string, number>;
  killsGained: number;
}

export type CameraFocusMode =
  | 'overview'
  | 'combat'
  | 'gathering'
  | 'crafting';

export interface FloatingCombatText {
  id: number;
  text: string;
  color: string;
  isCrit?: boolean;
  target: 'enemy' | 'player' | 'loot';
}

export interface ClassLoadout {
  weapon: EquipmentItem | null;
  armor: EquipmentItem | null;
}

export interface GameState {
  version: number;
  language: Language;
  lastSavedAt: number;
  gold: number;
  fishbones: number;
  totalGoldEarned: number;
  soundEnabled: boolean;
  cameraFocus: CameraFocusMode;
  dockCollapsed: boolean;
  activeTab:
    | 'gathering'
    | 'crafting'
    | 'forge'
    | 'combat'
    | 'character'
    | 'shop'
    | 'altar'
    | 'monument'
    | 'era';

  // Progressive Unlocks & Endgame Climax State
  progression: ProgressionState;

  // Currently selected Tier Tab in Gathering & Refining UI
  activeGatheringTier: Tier;
  activeCraftingTier: Tier;

  // 3-Hero Adventuring Squad Loadouts
  classLoadouts: Record<PlayerClass, ClassLoadout>;

  // Resources dictionary
  resources: Record<string, number>;

  // Activities (4 Gathering + 4 General Consumable Refining), each with 8 parallel Tiers
  activities: Record<ActivityId, ActivityState>;

  // Dedicated Manual Equipment Forge State
  equipmentForge: EquipmentForgeState;

  // Shop & Auto-Sell Configuration
  autoSell: AutoSellSettings;
  lastAutoSellGoldPerSec: number;

  equipmentBag: EquipmentItem[];

  // Combat State
  combat: {
    isFighting: boolean;
    currentZone: Tier;
    stageInZone: number; // 1 to 10 (1-9 = Mob Pack of 3-5 monsters; 10 = Giant Boss)
    maxUnlockedZone: Tier;
    maxStageInHighestZone: number;
    autoAdvance: boolean;
    playerHp: number;
    playerMaxHp: number;
    warriorAttackTimer: number; // 0 to 1
    hunterAttackTimer: number; // 0 to 1
    mageAttackTimer: number; // 0 to 1
    ultimateCharge: number; // 0 to 100 (Unlocked at Tier 3 Era: Squad Ultimates!)
    enemyCount: number; // Total monsters in current wave (3..5 for S1-S9, 1 for Boss S10)
    enemiesAlive: number; // Currently alive monsters in wave
    enemyHp: number; // Total remaining HP of current wave/pack
    enemyMaxHp: number; // Total max HP of current wave/pack
    singleEnemyMaxHp: number; // Max HP of a single monster in the wave
    enemyAttackTimer: number; // 0 to 1
    selectedFoodTier: Tier;
    autoEatThreshold: number;
    activeBuffTimer: number;
    activeBuffTier: Tier;
    totalKills: number;
  };

  // Fishbone Upgrades
  fishboneUpgrades: Record<string, number>;
}
