import {
  ACTIVITY_CONFIG,
  CLASS_CONFIG,
  COMBAT_ZONES,
  CRAFTING_RECIPES,
  EQUIPMENT_BLUEPRINTS,
  FISHBONE_UPGRADES,
  getResourceUnitPrice,
  MONUMENT_STAGES,
  TIER_META,
  TIERS,
} from '../data/gameData';
import {
  ActivityId,
  ActivityState,
  EquipmentBlueprint,
  GameState,
  OfflineReport,
  PlayerClass,
  Tier,
} from '../types/game';

/**
 * Returns the highest Era Tier (1..8) unlocked by the player across any Activity or Combat Zone.
 */
export function getHighestEraTier(state: GameState): Tier {
  let maxT: Tier = state.combat.maxUnlockedZone || 1;
  for (const act of Object.values(state.activities)) {
    if (act.unlockedTier > maxT) {
      maxT = act.unlockedTier;
    }
  }
  return maxT;
}

/**
 * Computes active Era Perks (T1..T8), Synergy Crit Chance, Monument Multiplier, and Overdrive Multipliers.
 */
export function getEraStatus(state: GameState) {
  const highestEraTier = getHighestEraTier(state);

  let totalHiredNpcs = 0;
  for (const act of Object.values(state.activities)) {
    for (const t of TIERS) {
      if (act.tiers[t]?.npcHired) {
        totalHiredNpcs += 1;
      }
    }
  }

  const hasSteamSynergy = highestEraTier >= 2;
  const synergyCritChance = hasSteamSynergy
    ? Math.min(1.0, totalHiredNpcs * 0.06)
    : 0;

  const hasSquadUltimate = highestEraTier >= 3;
  const hasMasterArtificer = highestEraTier >= 4;
  const hasZeroCostRefining = highestEraTier >= 5;
  const hasSuperconductor = highestEraTier >= 6;
  const hasDragonDivinity = highestEraTier >= 7;
  const hasAstralOverdrive = highestEraTier >= 8;

  const mStage = state.progression?.monumentStage || 0;
  const monumentMult =
    mStage >= 3 ? 100 : mStage === 2 ? 25 : mStage === 1 ? 5 : 1;

  const isOverdrive =
    hasAstralOverdrive && Boolean(state.progression?.overdriveActive);
  const overdriveYieldMult = isOverdrive ? 100 : 1;
  const overdriveCombatMult = isOverdrive ? 250 : 1;
  const overdriveSpeedMult = isOverdrive ? 3.0 : 1;

  return {
    highestEraTier,
    totalHiredNpcs,
    hasSteamSynergy,
    hasIndustrialSynergy: hasSteamSynergy,
    synergyCritChance,
    hasSquadUltimate,
    hasMasterArtificer,
    hasZeroCostRefining,
    hasSuperconductor,
    hasDragonDivinity,
    hasAstralOverdrive,
    isOverdrive,
    monumentMult,
    overdriveYieldMult,
    overdriveCombatMult,
    overdriveSpeedMult,
  };
}

/**
 * Computes global multipliers granted by Fishbone Altar upgrades.
 */
export function getFishboneMultipliers(fishboneUpgrades: Record<string, number>) {
  const speedLv = fishboneUpgrades.fb_global_speed || 0;
  const yieldLv = fishboneUpgrades.fb_global_yield || 0;
  const combatLv = fishboneUpgrades.fb_combat_power || 0;
  const rareLv = fishboneUpgrades.fb_rare_luck || 0;
  const offlineLv = fishboneUpgrades.fb_offline_mastery || 0;

  return {
    speedMult: 1 + speedLv * 0.12,
    yieldMult: Math.pow(1.22, yieldLv),
    combatMult: Math.pow(1.28, combatLv),
    rareMult: 1 + rareLv * 0.2,
    offlineEfficiency: 0.7 + offlineLv * 0.2,
    shopPriceMult: 1 + offlineLv * 0.15,
  };
}

/**
 * Computes active Gourmet Food Buff multiplier when the squad has eaten cooked food.
 */
export function getActiveFoodBuffMultiplier(state: GameState): number {
  if (state.combat.activeBuffTimer <= 0) return 1;
  return 1.25 + state.combat.activeBuffTier * 0.2;
}

/**
 * Computes effective duration (seconds) and yield multiplier for a specific Tier (1..8) of an Activity.
 * - Initial baseDuration = 5.0s
 * - speedLevel = 1 -> 5.00s
 * - speedLevel = 100 -> 0.50s
 * - At Tier 6 Era (Superconductor): minDuration drops from 0.25s to 0.05s (Laser Beam mode) & overflow triples!
 */
export function getActivityTierMetrics(
  state: GameState,
  id: ActivityId,
  tier: Tier
) {
  const act = state.activities[id];
  const node = act.tiers[tier];
  const cfg = ACTIVITY_CONFIG[id];
  const fb = getFishboneMultipliers(state.fishboneUpgrades);
  const era = getEraStatus(state);
  const foodBuff = state.combat.activeBuffTimer > 0 ? 1.15 : 1;

  const speedLevelFactor = 1 + (node.speedLevel - 1) * (9 / 99);
  const npcSpeedFactor = node.npcHired ? 1 + (node.npcLevel - 1) * 0.05 : 1;
  const rawSpeedMultiplier =
    speedLevelFactor *
    npcSpeedFactor *
    fb.speedMult *
    foodBuff *
    era.overdriveSpeedMult;

  const rawDuration = cfg.baseDuration / rawSpeedMultiplier;
  const minDuration = era.hasSuperconductor ? 0.05 : 0.25;
  const duration = Math.max(minDuration, rawDuration);
  const overflowSpeedMult =
    rawDuration < minDuration
      ? (minDuration / rawDuration) * (era.hasSuperconductor ? 3.0 : 1.0)
      : 1;

  const yieldUpgradeMult =
    (1 + (node.yieldLevel - 1) * 0.22) *
    Math.pow(1.032, node.yieldLevel - 1);
  const npcYieldMult = node.npcHired
    ? (1 + (node.npcLevel - 1) * 0.15) * Math.pow(1.025, node.npcLevel - 1)
    : 1;
  const totalYieldMult =
    yieldUpgradeMult *
    npcYieldMult *
    fb.yieldMult *
    overflowSpeedMult *
    era.monumentMult *
    era.overdriveYieldMult;

  const yieldPerCycle = Math.max(1, Math.round(totalYieldMult));

  const baseRareChance = 0.035;
  const rareChance = Math.min(
    0.95,
    baseRareChance *
      (1 + (node.rareDropLevel - 1) * 0.12) *
      fb.rareMult *
      (1 + (tier - 1) * 0.08) *
      (era.isOverdrive ? 3.0 : 1.0)
  );

  return {
    duration,
    yieldPerCycle,
    rareChance,
    rawSpeedMultiplier,
    overflowYieldMult: overflowSpeedMult,
    isLaserBeam: duration <= 0.1,
    isSuperconducting: era.hasSuperconductor && duration <= 0.1,
    synergyCritChance: era.synergyCritChance,
  };
}

/**
 * Upgrade costs in Gold for a specific Tier (1..8) of an Activity.
 */
export function getActivityTierUpgradeCosts(act: ActivityState, tier: Tier) {
  const node = act.tiers[tier];
  const cfg = ACTIVITY_CONFIG[act.id];
  const tierBase = TIER_META[tier].baseMultiplier;

  const nodeTotalLevel =
    node.speedLevel + node.yieldLevel + node.rareDropLevel - 2;
  const npcUnlockLevel = cfg.npcUnlockLevel;
  const canUnlockNpc = nodeTotalLevel >= npcUnlockLevel;

  const speedCost = Math.round(
    8 * tierBase * Math.pow(1.095, node.speedLevel - 1)
  );
  const yieldCost = Math.round(
    12 * tierBase * Math.pow(1.102, node.yieldLevel - 1)
  );
  const rareDropCost = Math.round(
    25 * tierBase * Math.pow(1.13, node.rareDropLevel - 1)
  );

  const npcHireCost = Math.round(cfg.npcBaseHireCost * tierBase);
  const npcUpgradeCost = Math.round(
    80 * tierBase * Math.pow(1.14, node.npcLevel - 1)
  );

  const nextTierUnlockCost =
    act.unlockedTier < 8
      ? Math.round(2500 * TIER_META[act.unlockedTier].baseMultiplier)
      : Infinity;

  return {
    nodeTotalLevel,
    npcUnlockLevel,
    canUnlockNpc,
    speedCost,
    yieldCost,
    rareDropCost,
    npcHireCost,
    npcUpgradeCost,
    nextTierUnlockCost,
  };
}

export function getFishboneUpgradeCost(id: string, currentLevel: number): number {
  const def = FISHBONE_UPGRADES.find((u) => u.id === id);
  if (!def) return Infinity;
  return Math.round(def.baseCost * Math.pow(def.costMult, currentLevel));
}

/**
 * Checks if player has enough resources for one refining cycle at a specific Tier.
 */
export function canAffordCraftingRecipe(
  state: GameState,
  actId: 'smithing' | 'carpentry' | 'tailoring' | 'cooking',
  tier: Tier
): boolean {
  const act = state.activities[actId];
  const recipe = CRAFTING_RECIPES.find((r) => r.id === act.selectedRecipeId);
  if (!recipe) return false;

  for (const inp of recipe.inputs) {
    const key = inp.isTiered ? `${inp.itemKey}_${tier}` : inp.itemKey;
    const have = state.resources[key] || 0;
    if (have < inp.amount) return false;
  }

  return true;
}

/**
 * Effective duration of crafting a piece of equipment in the Forge.
 * Reduced by 70% (3.5s -> 1.05s) once Tier 4 (Master Artificer Era) is unlocked, and further in Overdrive!
 */
export function getEffectiveForgeDuration(
  state: GameState,
  bp: EquipmentBlueprint
): number {
  const era = getEraStatus(state);
  let dur = bp.fixedDuration;
  if (era.hasMasterArtificer) dur *= 0.3;
  if (era.isOverdrive) dur *= 0.35;
  return Math.max(0.25, dur);
}

/**
 * Checks if player has unlocked the required manufacturing tier and has the materials to craft an Equipment Blueprint.
 */
export function canAffordEquipmentBlueprint(
  state: GameState,
  bp: EquipmentBlueprint,
  tier: Tier,
  useRare: boolean
): {
  unlocked: boolean;
  heroUnlocked: boolean;
  hasMaterials: boolean;
  hasRare: boolean;
} {
  const reqAct = state.activities[bp.requiredActivity];
  const activityUnlocked = Boolean(
    state.progression?.unlockedActivities?.[bp.requiredActivity]
  );
  const heroUnlocked =
    activityUnlocked ||
    Boolean(state.progression?.unlockedHeroes?.[bp.requiredClass]);
  const unlocked =
    activityUnlocked &&
    tier <= reqAct.unlockedTier &&
    reqAct.tiers[tier]?.unlocked;

  let hasMaterials = true;
  for (const inp of bp.inputs) {
    const k = `${inp.itemKey}_${tier}`;
    if ((state.resources[k] || 0) < inp.amount) {
      hasMaterials = false;
      break;
    }
  }

  const hasRare = !useRare || (state.resources[bp.rareMaterialId] || 0) >= 1;

  return { unlocked, heroUnlocked, hasMaterials, hasRare };
}

export function getBlueprintById(id: string): EquipmentBlueprint {
  return (
    EQUIPMENT_BLUEPRINTS.find((b) => b.id === id) || EQUIPMENT_BLUEPRINTS[0]
  );
}

export function canAffordMonumentStage(
  state: GameState,
  stageNum: 1 | 2 | 3
): boolean {
  const stg = MONUMENT_STAGES[stageNum - 1];
  if (!stg) return false;
  if (state.gold < stg.goldCost) return false;
  if (state.fishbones < stg.fishboneCost) return false;
  for (const inp of stg.inputs) {
    if ((state.resources[inp.itemKey] || 0) < inp.amount) return false;
  }
  return true;
}

export interface HeroIndividualStats {
  playerClass: PlayerClass;
  unlocked: boolean;
  attack: number;
  defense: number;
  maxHp: number;
  critRate: number;
  attackInterval: number;
  armorBreak: number;
  lootBonus: number;
  goldBonus: number;
  mobMaxTargets: number;
  mobDamageMult: number;
  bossDamageMult: number;
  multiStrikeCount: number; // 1 normally, 3 at Tier 7 Era (Dragon Divinity)!
}

/**
 * Computes 3-Hero Adventuring Squad combat statistics, factoring in which heroes are currently recruited!
 */
export function getPlayerCombatStats(state: GameState) {
  const fb = getFishboneMultipliers(state.fishboneUpgrades);
  const foodBuff = getActiveFoodBuffMultiplier(state);
  const era = getEraStatus(state);
  const classes: PlayerClass[] = ['warrior', 'hunter', 'mage'];

  // 1. Check 6-Slot Squad Tier Resonance (requires all 3 heroes recruited & equipped)
  let minTier = 8;
  let lowestSlotLabelZh = '';
  let lowestSlotLabelEn = '';

  for (const cls of classes) {
    const isHeroUnlocked = Boolean(state.progression?.unlockedHeroes?.[cls]);
    const loadout = state.classLoadouts[cls];
    const clsCfg = CLASS_CONFIG[cls];
    const wTier = isHeroUnlocked && loadout.weapon ? loadout.weapon.tier : 0;
    const aTier = isHeroUnlocked && loadout.armor ? loadout.armor.tier : 0;

    if (wTier < minTier) {
      minTier = wTier;
      lowestSlotLabelZh = isHeroUnlocked
        ? `${clsCfg.nameZh}·武器(T${wTier})`
        : `${clsCfg.nameZh}(未招募)`;
      lowestSlotLabelEn = isHeroUnlocked
        ? `${clsCfg.nameEn} Weapon (T${wTier})`
        : `${clsCfg.nameEn} (Locked)`;
    }
    if (aTier < minTier) {
      minTier = aTier;
      lowestSlotLabelZh = isHeroUnlocked
        ? `${clsCfg.nameZh}·护甲(T${aTier})`
        : `${clsCfg.nameZh}(未招募)`;
      lowestSlotLabelEn = isHeroUnlocked
        ? `${clsCfg.nameEn} Armor (T${aTier})`
        : `${clsCfg.nameEn} (Locked)`;
    }
  }

  const resonanceTier = Math.max(0, minTier) as 0 | Tier;
  const resonanceMult =
    resonanceTier > 0 ? 1.25 * Math.pow(1.65, resonanceTier - 1) : 1.0;

  let totalArmorBreak = 0;
  let totalLootBonus = 0;
  let totalGoldBonus = 0;

  const rawHeroMap = {} as Record<
    PlayerClass,
    {
      unlocked: boolean;
      rawAtk: number;
      rawDef: number;
      rawHp: number;
      critRate: number;
      speedBonus: number;
      armorBreak: number;
      lootBonus: number;
      goldBonus: number;
    }
  >;

  for (const cls of classes) {
    const unlocked = Boolean(state.progression?.unlockedHeroes?.[cls]);
    const w = unlocked ? state.classLoadouts[cls].weapon : null;
    const a = unlocked ? state.classLoadouts[cls].armor : null;
    const wEnh = w ? Math.pow(1.18, w.enhanceLevel) : 1;
    const aEnh = a ? Math.pow(1.18, a.enhanceLevel) : 1;

    const rawAtk = unlocked
      ? 5 + (w ? w.attack * wEnh : 0) + (a ? a.attack * aEnh : 0)
      : 0;
    const rawDef = unlocked
      ? 2 + (w ? w.defense * wEnh : 0) + (a ? a.defense * aEnh : 0)
      : 0;
    const rawHp = unlocked
      ? 60 + (w ? w.maxHp * wEnh : 0) + (a ? a.maxHp * aEnh : 0)
      : 0;

    const baseCrit =
      0.05 +
      (w ? w.critRate : 0) +
      (a ? a.critRate : 0) +
      (era.hasDragonDivinity ? 0.5 : 0);
    const critRate = unlocked ? Math.min(1.0, baseCrit) : 0;
    const speedBonus = unlocked
      ? (w ? w.speedBonus : 0) + (a ? a.speedBonus : 0)
      : 0;
    const armorBreak = unlocked
      ? (w ? w.armorBreak || 0 : 0) + (a ? a.armorBreak || 0 : 0)
      : 0;
    const lootBonus = unlocked
      ? (w ? w.lootBonus || 0 : 0) + (a ? a.lootBonus || 0 : 0)
      : 0;
    const goldBonus = unlocked
      ? (w ? w.goldBonus || 0 : 0) + (a ? a.goldBonus || 0 : 0)
      : 0;

    totalArmorBreak += armorBreak;
    totalLootBonus += lootBonus;
    totalGoldBonus += goldBonus;

    rawHeroMap[cls] = {
      unlocked,
      rawAtk,
      rawDef,
      rawHp,
      critRate,
      speedBonus,
      armorBreak,
      lootBonus,
      goldBonus,
    };
  }

  const armorBreakMult = 1 + totalArmorBreak;
  const lootDropMult =
    (1 + totalLootBonus) *
    (1 + Math.max(0, resonanceTier - 1) * 0.2) *
    era.monumentMult;
  const goldBonus =
    (1 + totalGoldBonus) *
    fb.combatMult *
    (1 + Math.max(0, resonanceTier - 1) * 0.25) *
    era.monumentMult *
    era.overdriveCombatMult;

  const globalStatMult =
    fb.combatMult *
    foodBuff *
    resonanceMult *
    armorBreakMult *
    era.monumentMult *
    era.overdriveCombatMult;

  const heroes = {} as Record<PlayerClass, HeroIndividualStats>;
  let totalAttack = 0;
  let totalDefense = 0;
  let totalMaxHp = 0;
  let totalDps = 0;

  for (const cls of classes) {
    const r = rawHeroMap[cls];
    const baseInterval =
      cls === 'hunter' ? 1.35 : cls === 'warrior' ? 1.55 : 1.8;
    const attackInterval = Math.max(
      0.22,
      baseInterval /
        ((1 + r.speedBonus) *
          fb.speedMult *
          (state.combat.activeBuffTimer > 0 ? 1.15 : 1) *
          era.overdriveSpeedMult)
    );

    const attack = r.unlocked
      ? Math.max(1, Math.round(r.rawAtk * globalStatMult))
      : 0;
    const defense = r.unlocked
      ? Math.max(
          0,
          Math.round(
            r.rawDef *
              fb.combatMult *
              foodBuff *
              resonanceMult *
              era.monumentMult
          )
        )
      : 0;
    const maxHp = r.unlocked
      ? Math.max(
          50,
          Math.round(
            r.rawHp *
              fb.combatMult *
              foodBuff *
              resonanceMult *
              era.monumentMult
          )
        )
      : 0;

    const mobMaxTargets = cls === 'mage' ? 5 : cls === 'warrior' ? 3 : 1;
    const mobDamageMult =
      cls === 'mage' ? 1.15 : cls === 'warrior' ? 1.0 : 1.05;
    const bossDamageMult =
      cls === 'hunter' ? 1.85 : cls === 'warrior' ? 1.25 : 0.85;
    const multiStrikeCount = era.hasDragonDivinity ? 3 : 1;

    heroes[cls] = {
      playerClass: cls,
      unlocked: r.unlocked,
      attack,
      defense,
      maxHp,
      critRate: r.critRate,
      attackInterval,
      armorBreak: r.armorBreak,
      lootBonus: r.lootBonus,
      goldBonus: r.goldBonus,
      mobMaxTargets,
      mobDamageMult,
      bossDamageMult,
      multiStrikeCount,
    };

    if (r.unlocked) {
      totalAttack += attack;
      totalDefense += defense;
      totalMaxHp += maxHp;

      const isBoss = state.combat.stageInZone === 10;
      const activeTargets = isBoss
        ? 1
        : Math.min(state.combat.enemiesAlive || 3, mobMaxTargets);
      const modeMult = isBoss
        ? bossDamageMult
        : mobDamageMult * activeTargets;

      totalDps +=
        (attack *
          modeMult *
          multiStrikeCount *
          (1 + r.critRate * 1.15)) /
        attackInterval;
    }
  }

  totalMaxHp = Math.max(60, totalMaxHp);

  const powerRating = Math.round(
    totalAttack * 2.0 + totalDefense * 1.8 + totalMaxHp * 0.35
  );

  return {
    heroes,
    attack: totalAttack,
    defense: totalDefense,
    maxHp: totalMaxHp,
    totalDps: Math.round(totalDps),
    critRate: heroes.warrior.critRate,
    attackInterval: heroes.warrior.attackInterval,
    armorBreakMult,
    lootDropMult,
    goldBonus,
    resonanceTier,
    resonanceMult,
    lowestSlotLabelZh,
    lowestSlotLabelEn,
    powerRating,
  };
}

/**
 * Computes enemy statistics for a given Zone (1..8) and Stage (1..10):
 * - Tuned so Stages 1-2 in Zone 1 can be beaten by a solo Warrior equipped with a forged T1 Copper Greatsword!
 */
export function getEnemyStatsForZoneStage(zone: Tier, stage: number) {
  const zInfo = COMBAT_ZONES[zone - 1];
  const base = zInfo.baseMultiplier; // 1, 1000, 1e6, 1e9...

  const isBoss = stage === 10;
  const enemyCount = isBoss ? 1 : stage <= 3 ? 3 : stage <= 6 ? 4 : 5;

  // Stage gate multipliers at S4 (requires Hunter) and S7 (requires Mage)
  const gateMult =
    stage >= 7 ? 1.85 : stage >= 4 ? 1.35 : 1.0;
  const stageScale = Math.pow(1.46, stage - 1) * gateMult;

  const singleEnemyMaxHp = isBoss
    ? Math.max(320, Math.round(420 * stageScale * base))
    : Math.max(75, Math.round(80 * stageScale * base));

  const totalWaveMaxHp = singleEnemyMaxHp * enemyCount;

  const attack = Math.max(
    6,
    Math.round((isBoss ? 26 : 11) * stageScale * base)
  );
  const defense = Math.max(
    1,
    Math.round((isBoss ? 10 : 3) * stageScale * base)
  );

  const goldDrop = Math.max(
    6,
    Math.round(12 * stageScale * base * (isBoss ? 3.5 : 1.0))
  );
  const materialDropCount = Math.max(1, Math.round(1 + stage * 0.4));

  return {
    nameZh: isBoss
      ? `★ 领主 · ${zInfo.bossNameZh}`
      : `${zInfo.monsterNameZh}群 (×${enemyCount})`,
    nameEn: isBoss
      ? `★ Boss · ${zInfo.bossNameEn}`
      : `${zInfo.monsterNameEn} Pack (×${enemyCount})`,
    isBoss,
    enemyCount,
    singleEnemyMaxHp,
    maxHp: totalWaveMaxHp,
    attack,
    defense,
    goldDrop,
    materialDropCount,
    rangeMin: zInfo.minVal,
    rangeMax: zInfo.maxVal,
  };
}

/**
 * Executes auto-sell on a resources dictionary according to AutoSellSettings.
 */
export function runAutoSellPass(state: GameState): {
  goldEarned: number;
  updatedResources: Record<string, number>;
} {
  if (!state.autoSell.enabled || !state.progression?.loggingLineUnlocked) {
    return { goldEarned: 0, updatedResources: state.resources };
  }

  const fb = getFishboneMultipliers(state.fishboneUpgrades);
  const reserve = Math.max(0, state.autoSell.reserveAmount);
  let goldEarned = 0;
  let mutated = false;
  const nextRes = { ...state.resources };

  const trySellKey = (key: string) => {
    const have = nextRes[key] || 0;
    if (have > reserve) {
      const sellCount = Math.floor(have - reserve);
      if (sellCount > 0) {
        const unitPrice = getResourceUnitPrice(key);
        const value = Math.round(sellCount * unitPrice * fb.shopPriceMult);
        nextRes[key] = have - sellCount;
        goldEarned += value;
        mutated = true;
      }
    }
  };

  for (const t of TIERS) {
    if (state.autoSell.sellRawByTier[t]) {
      trySellKey(`ore_${t}`);
      trySellKey(`wood_${t}`);
      trySellKey(`fish_${t}`);
      trySellKey(`fiber_${t}`);
      trySellKey(`leather_${t}`);
    }
    if (state.autoSell.sellRefinedByTier[t]) {
      trySellKey(`ingot_${t}`);
      trySellKey(`plank_${t}`);
      trySellKey(`cloth_${t}`);
      trySellKey(`food_${t}`);
    }
  }

  if (state.autoSell.sellCommonIngredients) {
    trySellKey('sugar');
    trySellKey('egg');
  }

  return {
    goldEarned,
    updatedResources: mutated ? nextRes : state.resources,
  };
}

/**
 * Calculates offline idle progress across ALL parallel tiers (T1..T8) and combat.
 */
export function applyOfflineProgress(
  state: GameState,
  elapsedSeconds: number
): { nextState: GameState; report: OfflineReport } {
  const cappedSeconds = Math.min(elapsedSeconds, 86400 * 3);
  const fb = getFishboneMultipliers(state.fishboneUpgrades);
  const era = getEraStatus(state);
  const effSeconds = cappedSeconds * fb.offlineEfficiency;

  const nextState: GameState = JSON.parse(JSON.stringify(state));
  const itemsGained: Record<string, number> = {};
  let goldEarned = 0;
  let fishbonesEarned = 0;
  let killsGained = 0;

  const addResource = (key: string, amount: number) => {
    if (amount <= 0) return;
    nextState.resources[key] = (nextState.resources[key] || 0) + amount;
    itemsGained[key] = (itemsGained[key] || 0) + amount;
  };

  const gatheringIds: ('mining' | 'logging' | 'fishing' | 'foraging')[] = [
    'mining',
    'logging',
    'fishing',
    'foraging',
  ];

  for (const gid of gatheringIds) {
    const act = nextState.activities[gid];
    for (const t of TIERS) {
      const node = act.tiers[t];
      if (!node || !node.unlocked || !node.npcHired) continue;

      const metrics = getActivityTierMetrics(nextState, gid, t);
      const cycles = Math.floor(effSeconds / metrics.duration);
      if (cycles <= 0) continue;

      const synergyBonus = 1 + era.synergyCritChance * 2.0;
      const totalOut = Math.round(
        cycles * metrics.yieldPerCycle * synergyBonus
      );

      if (gid === 'mining') {
        addResource(`ore_${t}`, totalOut);
      } else if (gid === 'logging') {
        addResource(`wood_${t}`, totalOut);
      } else if (gid === 'fishing') {
        addResource(`fish_${t}`, totalOut);
        const bones = Math.max(
          1,
          Math.floor(cycles * (1 + t * 0.5) * (1 + node.yieldLevel * 0.1))
        );
        nextState.fishbones += bones;
        fishbonesEarned += bones;
      } else if (gid === 'foraging') {
        addResource(`fiber_${t}`, totalOut);
        addResource('sugar', Math.ceil(totalOut * 0.55));
        addResource('egg', Math.ceil(totalOut * 0.4));
      }

      const rareDraws = Math.floor(cycles * metrics.rareChance);
      if (rareDraws > 0) {
        const rareKey = ACTIVITY_CONFIG[gid].rareMaterialId;
        addResource(rareKey, rareDraws);
      }
    }
  }

  if (nextState.combat.isFighting) {
    const pStats = getPlayerCombatStats(nextState);
    const eStats = getEnemyStatsForZoneStage(
      nextState.combat.currentZone,
      nextState.combat.stageInZone
    );

    const effectiveDps = Math.max(1, pStats.totalDps - eStats.defense * 0.35);
    const timePerKill = Math.max(
      1.2,
      eStats.maxHp / effectiveDps + 0.5
    );
    const kills = Math.floor(effSeconds / timePerKill);

    if (kills > 0) {
      killsGained = kills;
      nextState.combat.totalKills += kills;

      const goldGain = Math.round(kills * eStats.goldDrop * pStats.goldBonus);
      nextState.gold += goldGain;
      nextState.totalGoldEarned += goldGain;
      goldEarned += goldGain;

      const z = nextState.combat.currentZone;
      const dropAmt = Math.round(
        kills * eStats.materialDropCount * pStats.lootDropMult
      );
      addResource(`leather_${z}`, dropAmt);
      addResource(`ore_${z}`, Math.ceil(dropAmt * 0.5));
      addResource(`wood_${z}`, Math.ceil(dropAmt * 0.5));
    }
  }

  const craftIds: ('smithing' | 'carpentry' | 'tailoring' | 'cooking')[] = [
    'smithing',
    'carpentry',
    'tailoring',
    'cooking',
  ];

  for (const cid of craftIds) {
    const act = nextState.activities[cid];
    const recipe = CRAFTING_RECIPES.find((r) => r.id === act.selectedRecipeId);
    if (!recipe) continue;

    for (const t of TIERS) {
      const node = act.tiers[t];
      if (!node || !node.unlocked || !node.npcHired) continue;

      const metrics = getActivityTierMetrics(nextState, cid, t);
      let maxCycles = Math.floor(effSeconds / metrics.duration);

      for (const inp of recipe.inputs) {
        const k = inp.isTiered ? `${inp.itemKey}_${t}` : inp.itemKey;
        const have = nextState.resources[k] || 0;
        if (era.hasZeroCostRefining) {
          if (have < inp.amount) maxCycles = 0;
        } else {
          const possible = Math.floor(have / inp.amount);
          maxCycles = Math.min(maxCycles, possible);
        }
      }

      if (maxCycles > 0) {
        if (!era.hasZeroCostRefining) {
          for (const inp of recipe.inputs) {
            const k = inp.isTiered ? `${inp.itemKey}_${t}` : inp.itemKey;
            nextState.resources[k] -= maxCycles * inp.amount;
          }
        }
        const outKey = recipe.output.isTiered
          ? `${recipe.output.itemKey}_${t}`
          : recipe.output.itemKey;
        const outTotal =
          maxCycles * recipe.output.amount * metrics.yieldPerCycle;
        addResource(outKey, outTotal);
      }
    }
  }

  if (nextState.autoSell.enabled && nextState.progression?.loggingLineUnlocked) {
    const { goldEarned: autoGold, updatedResources } =
      runAutoSellPass(nextState);
    if (autoGold > 0) {
      nextState.resources = updatedResources;
      nextState.gold += autoGold;
      nextState.totalGoldEarned += autoGold;
      goldEarned += autoGold;
    }
  }

  nextState.lastSavedAt = Date.now();
  return {
    nextState,
    report: {
      secondsElapsed: cappedSeconds,
      goldEarned,
      fishbonesEarned,
      itemsGained,
      killsGained,
    },
  };
}
