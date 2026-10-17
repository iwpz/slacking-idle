import React, { useState } from 'react';
import {
  Anvil,
  ChevronDown,
  ChevronUp,
  Coins,
  Crown,
  Fish,
  Flame,
  Hammer,
  Lock,
  Pickaxe,
  Shield,
  Store,
  Sword,
  Utensils,
  Zap,
} from 'lucide-react';
import {
  ACTIVITY_CONFIG,
  CLASS_CONFIG,
  COMBAT_ZONES,
  CRAFTING_RECIPES,
  EQUIPMENT_BLUEPRINTS,
  ERA_PERKS,
  FISHBONE_UPGRADES,
  generateEquipmentItem,
  getResourceName,
  getResourceUnitPrice,
  MONUMENT_STAGES,
  RARE_MATERIALS,
  TIER_META,
  TIERS,
} from '../data/gameData';
import {
  ActivityId,
  AutoSellSettings,
  CraftingActivityId,
  EquipmentItem,
  GameState,
  GatheringActivityId,
  PlayerClass,
  Tier,
} from '../types/game';
import { formatCompact } from '../utils/format';
import {
  canAffordCraftingRecipe,
  canAffordEquipmentBlueprint,
  canAffordMonumentStage,
  getActivityTierMetrics,
  getActivityTierUpgradeCosts,
  getBlueprintById,
  getEnemyStatsForZoneStage,
  getEraStatus,
  getFishboneMultipliers,
  getFishboneUpgradeCost,
  getPlayerCombatStats,
} from '../utils/gameCalculations';

interface ControlDockProps {
  state: GameState;
  onToggleCollapse: () => void;
  onSelectTab: (tab: GameState['activeTab']) => void;
  onSelectGatheringTierTab: (tier: Tier) => void;
  onSelectCraftingTierTab: (tier: Tier) => void;
  onToggleActivityTier: (id: ActivityId, tier: Tier) => void;
  onUpgradeActivityTier: (
    id: ActivityId,
    tier: Tier,
    upgradeType:
      | 'speed'
      | 'yield'
      | 'rare'
      | 'unlockTier'
      | 'hireNpc'
      | 'upgradeNpc',
    count?: number
  ) => void;
  onSelectForgeBlueprint: (blueprintId: string) => void;
  onSelectForgeTier: (tier: Tier) => void;
  onToggleForgeRare: () => void;
  onStartEquipmentForge: () => void;
  onToggleAutoForge: () => void;
  onSelectCombatZone: (zone: Tier, stage: number) => void;
  onToggleAutoAdvance: () => void;
  onToggleCombat: () => void;
  onTriggerUltimate: () => void;
  onEatFood: (tier: Tier) => void;
  onSelectAutoFoodTier: (tier: Tier) => void;
  onEquipItem: (item: EquipmentItem) => void;
  onSellItem: (itemId: string) => void;
  onSellAllBag: () => void;
  onEnhanceEquipped: (
    playerClass: PlayerClass,
    slot: 'weapon' | 'armor'
  ) => void;
  onUpdateAutoSell: (
    updater: (prev: AutoSellSettings) => AutoSellSettings
  ) => void;
  onSellResourceManual: (key: string) => void;
  onBuyFishboneUpgrade: (upgradeId: string) => void;
  onToggleOverdrive: () => void;
  onBuildMonumentStage: () => void;
  onOpenVictoryModal: () => void;
}

const ACTIVITY_UNLOCK_HINT_ZH: Record<ActivityId, string> = {
  mining: '初始解锁',
  smithing: '采集 3 块铜矿石解锁',
  logging: '战斗到达 S3 解锁',
  carpentry: '采集 3 根原木解锁',
  foraging: '战斗到达 S6 解锁',
  tailoring: '采集 3 株草药解锁',
  fishing: '击败 S10 领主解锁',
  cooking: '钓起 3 条鱼解锁',
};

const ACTIVITY_UNLOCK_HINT_EN: Record<ActivityId, string> = {
  mining: 'Unlocked',
  smithing: 'Mine 3 Copper Ore',
  logging: 'Reach Zone 1 S3',
  carpentry: 'Gather 3 Logs',
  foraging: 'Reach Zone 1 S6',
  tailoring: 'Gather 3 Herbs',
  fishing: 'Defeat Zone 1 Boss',
  cooking: 'Catch 3 Fish',
};

export const ControlDock: React.FC<ControlDockProps> = ({
  state,
  onToggleCollapse,
  onSelectTab,
  onSelectGatheringTierTab,
  onSelectCraftingTierTab,
  onToggleActivityTier,
  onUpgradeActivityTier,
  onSelectForgeBlueprint,
  onSelectForgeTier,
  onToggleForgeRare,
  onStartEquipmentForge,
  onToggleAutoForge,
  onSelectCombatZone,
  onToggleAutoAdvance,
  onToggleCombat,
  onTriggerUltimate,
  onEatFood,
  onSelectAutoFoodTier,
  onEquipItem,
  onSellItem,
  onSellAllBag,
  onEnhanceEquipped,
  onUpdateAutoSell,
  onBuyFishboneUpgrade,
  onToggleOverdrive,
  onBuildMonumentStage,
  onOpenVictoryModal,
}) => {
  const isZh = state.language === 'zh';
  const [buyStep, setBuyStep] = useState<1 | 10>(1);
  const [warehouseFilter, setWarehouseFilter] = useState<
    'all' | 'raw' | 'refined' | 'rare'
  >('all');
  const [forgeClassFilter, setForgeClassFilter] = useState<
    'all' | PlayerClass
  >('all');

  const era = getEraStatus(state);
  const prog = state.progression;
  const maxTier = era.highestEraTier;

  const getTierLabel = (t: Tier) => {
    const meta = TIER_META[t];
    if (t <= maxTier + 1) {
      return `T${t} ${isZh ? meta.prefixZh : meta.prefixEn}`;
    }
    return isZh ? `T${t} ？？` : `T${t} ??`;
  };

  const allGatheringIds: GatheringActivityId[] = [
    'mining',
    'logging',
    'foraging',
    'fishing',
  ];
  const allCraftingIds: CraftingActivityId[] = [
    'smithing',
    'carpentry',
    'tailoring',
    'cooking',
  ];

  const unlockedHeroesList: PlayerClass[] = (
    ['warrior', 'hunter', 'mage'] as PlayerClass[]
  ).filter((c) => prog.unlockedHeroes[c]);

  const renderProgressionQuestBanner = () => {
    if (prog.unlockedTabs.altar) return null;

    let stepTitle = '';
    if (!prog.unlockedTabs.crafting) {
      stepTitle = isZh ? '目标：采集 3 块铜矿石' : 'Goal: Gather 3 Copper Ore';
    } else if (!prog.unlockedTabs.forge) {
      stepTitle = isZh
        ? '目标：前往「加工」熔炼 3 块铜锭'
        : 'Goal: Smelt 3 Copper Ingots in Refine';
    } else if (!prog.unlockedTabs.combat) {
      stepTitle = isZh
        ? '目标：前往「锻造」打造 1 件战士装备'
        : 'Goal: Craft 1 Warrior equipment in Forge';
    } else if (!prog.unlockedActivities.logging) {
      stepTitle = isZh
        ? '目标：推进「战斗」至微风草甸 S3（解锁伐木）'
        : 'Goal: Reach Zone 1 Stage 3 (Unlocks Logging)';
    } else if (!prog.unlockedActivities.carpentry) {
      stepTitle = isZh
        ? '目标：前往「采集」伐木收集 3 根原木（解锁木工）'
        : 'Goal: Gather 3 Logs in Gather (Unlocks Carpentry)';
    } else if (!prog.unlockedHeroes.hunter) {
      stepTitle = isZh
        ? '目标：在「加工」制作木板，并在「锻造」打造猎弓或皮甲（解锁猎人）'
        : 'Goal: Craft Planks & forge a Bow or Leather Armor (Recruits Hunter)';
    } else if (!prog.unlockedActivities.foraging) {
      stepTitle = isZh
        ? '目标：推进「战斗」至微风草甸 S6（解锁采药）'
        : 'Goal: Reach Zone 1 Stage 6 (Unlocks Foraging)';
    } else if (!prog.unlockedActivities.tailoring) {
      stepTitle = isZh
        ? '目标：前往「采集」采药收集 3 株草药（解锁裁缝）'
        : 'Goal: Gather 3 Herbs in Gather (Unlocks Tailoring)';
    } else if (!prog.unlockedHeroes.mage) {
      stepTitle = isZh
        ? '目标：在「加工」织造布匹，并在「锻造」打造法杖或布甲（解锁法师）'
        : 'Goal: Weave Cloth & forge a Staff or Cloth Armor (Recruits Mage)';
    } else if (!prog.unlockedActivities.fishing) {
      stepTitle = isZh
        ? '目标：击败微风草甸 S10 领主（解锁钓鱼）'
        : 'Goal: Defeat Zone 1 Boss (Unlocks Fishing)';
    } else {
      stepTitle = isZh
        ? '目标：前往「采集」钓起 3 条鱼（解锁烹饪与圣坛）'
        : 'Goal: Catch 3 Fish (Unlocks Cooking & Altar)';
    }

    return (
      <div className="mb-2.5 flex items-center justify-between rounded-lg border border-amber-500/30 bg-slate-900/90 px-3 py-1.5 text-xs">
        <span className="font-semibold text-amber-300">{stepTitle}</span>
      </div>
    );
  };

  const renderTierSubTabBar = (
    activeTier: Tier,
    onSelect: (t: Tier) => void,
    activityList: ActivityId[]
  ) => {
    const showMultiTiers =
      era.highestEraTier >= 2 ||
      prog.unlockedHeroes.hunter ||
      state.gold >= 200;

    return (
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2 rounded-lg border border-slate-800 bg-[#111827] px-3 py-2">
        <div className="flex items-center gap-1.5 overflow-x-auto">
          {(showMultiTiers ? TIERS : ([1] as Tier[])).map((t) => {
            const isSelected = activeTier === t;
            const isFutureMasked = t > maxTier + 1;
            const unlockedCount = activityList.filter(
              (id) =>
                prog.unlockedActivities[id] &&
                state.activities[id].tiers[t]?.unlocked
            ).length;
            const autoCount = activityList.filter(
              (id) =>
                prog.unlockedActivities[id] &&
                state.activities[id].tiers[t]?.unlocked &&
                state.activities[id].tiers[t]?.npcHired
            ).length;
            const totalAvailInTier = activityList.filter(
              (id) => prog.unlockedActivities[id]
            ).length;

            return (
              <button
                key={t}
                onClick={() => onSelect(t)}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-semibold transition-colors whitespace-nowrap shrink-0 border ${
                  isSelected
                    ? 'border-amber-400 bg-amber-500 text-slate-950 font-bold'
                    : unlockedCount > 0
                      ? 'border-slate-700 bg-slate-800/90 text-slate-200 hover:bg-slate-700'
                      : 'border-slate-800/80 bg-slate-900/60 text-slate-500 hover:text-slate-300'
                }`}
              >
                <span className="font-mono">{getTierLabel(t)}</span>
                {!isFutureMasked && autoCount > 0 ? (
                  <span
                    className={`rounded px-1 py-0.2 text-[10px] font-mono ${
                      isSelected
                        ? 'bg-slate-950/25 text-slate-950'
                        : 'bg-emerald-500/20 text-emerald-300'
                    }`}
                  >
                    {autoCount}/{totalAvailInTier}
                  </span>
                ) : unlockedCount === 0 ? (
                  <Lock className="w-3 h-3 opacity-60" />
                ) : null}
              </button>
            );
          })}
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {era.hasIndustrialSynergy && (
            <span className="text-[11px] font-mono text-emerald-400 hidden md:inline">
              {isZh
                ? `双倍产出率 +${(era.synergyCritChance * 100).toFixed(0)}%`
                : `2x Yield +${(era.synergyCritChance * 100).toFixed(0)}%`}
            </span>
          )}
          <div className="flex items-center rounded border border-slate-700 bg-slate-900 p-0.5 text-xs font-mono">
            {([1, 10] as const).map((step) => (
              <button
                key={step}
                onClick={() => setBuyStep(step)}
                className={`px-2 py-0.5 rounded font-semibold ${
                  buyStep === step
                    ? 'bg-amber-500 text-slate-950'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                +{step}
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  };

  const renderActivityTierCard = (id: ActivityId, tier: Tier) => {
    const cfg = ACTIVITY_CONFIG[id];
    const tierMeta = TIER_META[tier];

    if (!prog.unlockedActivities[id]) {
      return (
        <div
          key={`${id}_${tier}_locked_line`}
          className="flex items-center justify-between rounded-lg border border-slate-800/70 bg-slate-950/60 p-4 text-slate-400"
        >
          <div className="flex items-center gap-2">
            <Lock className="w-4 h-4 text-slate-500" />
            <span className="font-display text-sm font-bold text-slate-300">
              {isZh ? cfg.nameZh : cfg.nameEn}
            </span>
          </div>
          <span className="text-xs text-slate-500">
            {isZh ? ACTIVITY_UNLOCK_HINT_ZH[id] : ACTIVITY_UNLOCK_HINT_EN[id]}
          </span>
        </div>
      );
    }

    const act = state.activities[id];
    const node = act.tiers[tier];
    const isCrafting = cfg.type === 'crafting';
    const currentRecipe = isCrafting
      ? CRAFTING_RECIPES.find((r) => r.activity === id)
      : null;

    // Locked Tier Card
    if (!node.unlocked) {
      const prevUnlocked =
        tier === 1 || act.tiers[(tier - 1) as Tier]?.unlocked;
      const unlockCost = Math.round(
        750 * TIER_META[(tier - 1) as Tier].baseMultiplier
      );
      const canAffordUnlock = prevUnlocked && state.gold >= unlockCost;
      const isMasked = tier > maxTier + 1;

      return (
        <div
          key={`${id}_${tier}`}
          className="flex flex-col justify-between rounded-lg border border-slate-800/90 bg-[#111827]/90 p-4 text-slate-200"
        >
          <div className="flex items-center justify-between">
            <h3 className="font-display text-base font-bold text-white flex items-center gap-2">
              <Lock className="w-4 h-4 text-amber-400" />
              <span>
                {isMasked
                  ? `T${tier} ？？`
                  : `T${tier} ${isZh ? `${tierMeta.prefixZh} · ${cfg.nameZh}` : `${tierMeta.prefixEn} ${cfg.nameEn}`}`}
              </span>
            </h3>
            <span className="font-mono text-xs text-slate-500">
              {isMasked ? '？？' : isZh ? '未解锁' : 'Locked'}
            </span>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between gap-3">
            <span className="text-xs text-slate-400 font-mono">
              {!prevUnlocked
                ? isZh
                  ? `需先解锁 T${tier - 1}`
                  : `Unlock T${tier - 1} first`
                : `${formatCompact(unlockCost)} G`}
            </span>
            <button
              disabled={!canAffordUnlock}
              onClick={() => onUpgradeActivityTier(id, tier, 'unlockTier')}
              className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-colors whitespace-nowrap ${
                canAffordUnlock
                  ? 'bg-amber-500 text-slate-950 hover:bg-amber-400'
                  : 'bg-slate-800 text-slate-500 cursor-not-allowed'
              }`}
            >
              {isMasked
                ? '？？'
                : isZh
                  ? `解锁 (${formatCompact(unlockCost)} G)`
                  : `Unlock (${formatCompact(unlockCost)} G)`}
            </button>
          </div>
        </div>
      );
    }

    const metrics = getActivityTierMetrics(state, id, tier);
    const costs = getActivityTierUpgradeCosts(act, tier);
    const canCraft = isCrafting
      ? canAffordCraftingRecipe(state, id as CraftingActivityId, tier)
      : true;

    const rareInfo = RARE_MATERIALS[cfg.rareMaterialId];
    const rareHave = state.resources[cfg.rareMaterialId] || 0;

    return (
      <div
        key={`${id}_${tier}`}
        className={`flex flex-col justify-between rounded-lg border p-3.5 text-slate-100 ${
          metrics.isSuperconducting
            ? 'border-cyan-500/60 bg-gradient-to-br from-[#0f172a] via-[#111827] to-cyan-950/30'
            : 'border-slate-800 bg-[#111827]'
        }`}
      >
        <div>
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-display text-base font-bold text-white">
                T{tier}{' '}
                {isZh
                  ? `${tierMeta.prefixZh} · ${cfg.nameZh}`
                  : `${tierMeta.prefixEn} ${cfg.nameEn}`}
              </h3>
              <span className="text-xs font-mono text-amber-400">
                Lv.{costs.nodeTotalLevel}
              </span>
              {metrics.isSuperconducting && (
                <span className="rounded bg-cyan-500/20 border border-cyan-400/50 px-1.5 py-0.2 font-mono text-[10px] font-bold text-cyan-300">
                  {isZh ? '极速' : 'MAX'}
                </span>
              )}
            </div>

            <button
              disabled={
                node.npcHired || (!node.isRunning && isCrafting && !canCraft)
              }
              onClick={() => onToggleActivityTier(id, tier)}
              className={`px-3.5 py-1.5 rounded-md text-xs font-semibold transition-colors whitespace-nowrap shrink-0 ${
                node.npcHired
                  ? 'bg-emerald-600/90 text-white cursor-default'
                  : node.isRunning
                    ? 'bg-amber-500/30 text-amber-200 border border-amber-400 hover:bg-amber-500/45 active:scale-95'
                    : isCrafting && !canCraft
                      ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                      : 'bg-amber-500 text-slate-950 hover:bg-amber-400 active:scale-95'
              }`}
            >
              {node.npcHired
                ? isZh
                  ? '自动中'
                  : 'Auto'
                : node.isRunning
                  ? isZh
                    ? `加速 ${(node.progress * 100).toFixed(0)}%`
                    : `Boost ${(node.progress * 100).toFixed(0)}%`
                  : isZh
                    ? cfg.nameZh
                    : cfg.nameEn}
            </button>
          </div>

          <div className="mt-2.5">
            <div className="flex items-center justify-between text-xs text-slate-300 mb-1">
              <span className="font-mono tabular-nums">
                {metrics.duration.toFixed(2)}s ·{' '}
                <span className="text-emerald-400 font-bold">
                  ×{formatCompact(metrics.yieldPerCycle)}
                </span>
              </span>
              <span className="font-mono text-amber-300 tabular-nums">
                {isZh ? '稀有' : 'Rare'} {(metrics.rareChance * 100).toFixed(1)}
                %
              </span>
            </div>

            <div className="h-2 w-full overflow-hidden rounded-sm bg-slate-900 border border-slate-800 relative">
              {metrics.isSuperconducting ? (
                <div className="h-full w-full bg-gradient-to-r from-cyan-400 via-purple-400 to-amber-300" />
              ) : (
                <div
                  className="h-full bg-amber-500 transition-transform duration-75 origin-left"
                  style={{
                    transform: `scaleX(${Math.min(1, Math.max(0, node.progress))})`,
                  }}
                />
              )}
            </div>
          </div>

          {!isCrafting ? (
            <div className="mt-2.5 rounded border border-slate-800/80 bg-slate-900/70 px-2.5 py-1.5 text-xs">
              <div className="flex items-center justify-between text-slate-300">
                <span>
                  {id === 'mining' &&
                    `${getResourceName(`ore_${tier}`, state.language)}: ${formatCompact(state.resources[`ore_${tier}`] || 0)}`}
                  {id === 'logging' &&
                    `${getResourceName(`wood_${tier}`, state.language)}: ${formatCompact(state.resources[`wood_${tier}`] || 0)}`}
                  {id === 'fishing' &&
                    `${getResourceName(`fish_${tier}`, state.language)}: ${formatCompact(state.resources[`fish_${tier}`] || 0)}`}
                  {id === 'foraging' &&
                    `${getResourceName(`fiber_${tier}`, state.language)}: ${formatCompact(state.resources[`fiber_${tier}`] || 0)} · ${isZh ? '糖' : 'Sugar'}: ${formatCompact(state.resources.sugar || 0)}`}
                </span>
                <span className="font-mono text-sky-300">
                  {isZh ? rareInfo.nameZh : rareInfo.nameEn}:{' '}
                  {formatCompact(rareHave)}
                </span>
              </div>
            </div>
          ) : (
            currentRecipe && (
              <div className="mt-2.5 rounded border border-slate-800/80 bg-slate-900/70 px-2.5 py-1.5 text-xs flex flex-wrap items-center justify-between gap-2">
                <div className="flex flex-wrap items-center gap-2 text-slate-300">
                  {currentRecipe.inputs.map((inp, idx) => {
                    const k = inp.isTiered
                      ? `${inp.itemKey}_${tier}`
                      : inp.itemKey;
                    const have = state.resources[k] || 0;
                    const enough =
                      era.hasZeroCostRefining || have >= inp.amount;
                    return (
                      <span
                        key={idx}
                        className={`font-mono ${enough ? 'text-emerald-400' : 'text-rose-400'}`}
                      >
                        {getResourceName(k, state.language)}{' '}
                        {era.hasZeroCostRefining
                          ? isZh
                            ? '免耗材'
                            : '0'
                          : `${formatCompact(have)}/${inp.amount}`}
                      </span>
                    );
                  })}
                </div>
                <div className="font-mono text-amber-300">
                  →{' '}
                  {getResourceName(
                    `${currentRecipe.output.itemKey}_${tier}`,
                    state.language
                  )}{' '}
                  (
                  {formatCompact(
                    state.resources[
                      `${currentRecipe.output.itemKey}_${tier}`
                    ] || 0
                  )}
                  )
                </div>
              </div>
            )
          )}
        </div>

        <div className="mt-2.5 pt-2 border-t border-slate-800/90 space-y-2">
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs text-slate-300 truncate">
              {isZh ? cfg.npcNameZh : cfg.npcNameEn}{' '}
              {node.npcHired ? (
                <span className="font-mono text-emerald-400">
                  Lv.{node.npcLevel}
                </span>
              ) : (
                <span
                  className={`font-mono ${costs.canUnlockNpc ? 'text-emerald-400' : 'text-slate-500'}`}
                >
                  (Lv.{costs.nodeTotalLevel}/{costs.npcUnlockLevel})
                </span>
              )}
            </span>
            {!node.npcHired ? (
              <button
                disabled={
                  !costs.canUnlockNpc || state.gold < costs.npcHireCost
                }
                onClick={() => onUpgradeActivityTier(id, tier, 'hireNpc')}
                className={`px-2.5 py-1 rounded text-xs font-semibold transition-colors whitespace-nowrap shrink-0 ${
                  costs.canUnlockNpc && state.gold >= costs.npcHireCost
                    ? 'bg-emerald-600 text-white hover:bg-emerald-500'
                    : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                }`}
              >
                {!costs.canUnlockNpc
                  ? isZh
                    ? `需 Lv.${costs.npcUnlockLevel}`
                    : `Req Lv.${costs.npcUnlockLevel}`
                  : isZh
                    ? `雇佣 (${formatCompact(costs.npcHireCost)} G)`
                    : `Hire (${formatCompact(costs.npcHireCost)} G)`}
              </button>
            ) : (
              <button
                disabled={state.gold < costs.npcUpgradeCost}
                onClick={() =>
                  onUpgradeActivityTier(id, tier, 'upgradeNpc', buyStep)
                }
                className={`px-2.5 py-1 rounded text-xs font-medium transition-colors whitespace-nowrap shrink-0 ${
                  state.gold >= costs.npcUpgradeCost
                    ? 'bg-sky-600 text-white hover:bg-sky-500'
                    : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                }`}
              >
                {isZh ? '升级' : 'Up'} ({formatCompact(costs.npcUpgradeCost)} G)
              </button>
            )}
          </div>

          <div className="grid grid-cols-3 gap-1.5">
            <button
              disabled={state.gold < costs.speedCost}
              onClick={() => onUpgradeActivityTier(id, tier, 'speed', buyStep)}
              className={`px-2 py-1.5 rounded text-xs font-medium flex flex-col items-center justify-center border transition-colors ${
                state.gold >= costs.speedCost
                  ? 'border-slate-700 bg-slate-800 hover:bg-slate-700 text-slate-100'
                  : 'border-slate-800/60 bg-slate-900/50 text-slate-600 cursor-not-allowed'
              }`}
            >
              <span className="whitespace-nowrap">
                {isZh ? '速度' : 'Speed'} Lv.{node.speedLevel}
              </span>
              <span className="font-mono text-[11px] text-amber-400 tabular-nums">
                {formatCompact(costs.speedCost)} G
              </span>
            </button>

            <button
              disabled={state.gold < costs.yieldCost}
              onClick={() => onUpgradeActivityTier(id, tier, 'yield', buyStep)}
              className={`px-2 py-1.5 rounded text-xs font-medium flex flex-col items-center justify-center border transition-colors ${
                state.gold >= costs.yieldCost
                  ? 'border-slate-700 bg-slate-800 hover:bg-slate-700 text-slate-100'
                  : 'border-slate-800/60 bg-slate-900/50 text-slate-600 cursor-not-allowed'
              }`}
            >
              <span className="whitespace-nowrap">
                {isZh ? '产量' : 'Yield'} Lv.{node.yieldLevel}
              </span>
              <span className="font-mono text-[11px] text-amber-400 tabular-nums">
                {formatCompact(costs.yieldCost)} G
              </span>
            </button>

            <button
              disabled={state.gold < costs.rareDropCost}
              onClick={() => onUpgradeActivityTier(id, tier, 'rare', buyStep)}
              className={`px-2 py-1.5 rounded text-xs font-medium flex flex-col items-center justify-center border transition-colors ${
                state.gold >= costs.rareDropCost
                  ? 'border-slate-700 bg-slate-800 hover:bg-slate-700 text-slate-100'
                  : 'border-slate-800/60 bg-slate-900/50 text-slate-600 cursor-not-allowed'
              }`}
            >
              <span className="whitespace-nowrap">
                {isZh ? '稀有' : 'Rare'} Lv.{node.rareDropLevel}
              </span>
              <span className="font-mono text-[11px] text-amber-400 tabular-nums">
                {formatCompact(costs.rareDropCost)} G
              </span>
            </button>
          </div>
        </div>
      </div>
    );
  };

  const pStats = getPlayerCombatStats(state);
  const eStats = getEnemyStatsForZoneStage(
    state.combat.currentZone,
    state.combat.stageInZone
  );
  const currentZoneInfo = COMBAT_ZONES[state.combat.currentZone - 1];
  const fbMultipliers = getFishboneMultipliers(state.fishboneUpgrades);

  const forge = state.equipmentForge;
  const selectedBp = getBlueprintById(forge.selectedBlueprintId);
  const forgeTierMeta = TIER_META[forge.selectedTier];
  const forgeCheck = canAffordEquipmentBlueprint(
    state,
    selectedBp,
    forge.selectedTier,
    forge.useRare
  );
  const previewGear = generateEquipmentItem(
    forge.selectedTier,
    selectedBp.slot,
    selectedBp.subType,
    forge.useRare
  );
  const rareMatInfo = RARE_MATERIALS[selectedBp.rareMaterialId];
  const reqActConfig = ACTIVITY_CONFIG[selectedBp.requiredActivity];
  const currentlyEquippedInSlot =
    state.classLoadouts[selectedBp.requiredClass][selectedBp.slot];

  const availableBlueprints = EQUIPMENT_BLUEPRINTS.filter(
    (bp) =>
      prog.unlockedActivities[bp.requiredActivity] ||
      prog.unlockedHeroes[bp.requiredClass]
  );
  const forgeClassesAvailable: PlayerClass[] = (
    ['warrior', 'hunter', 'mage'] as PlayerClass[]
  ).filter((c) =>
    availableBlueprints.some((bp) => bp.requiredClass === c)
  );
  const filteredBlueprints =
    forgeClassFilter === 'all'
      ? availableBlueprints
      : availableBlueprints.filter(
          (bp) => bp.requiredClass === forgeClassFilter
        );

  const showEraTab =
    prog.unlockedTabs.altar ||
    era.highestEraTier >= 2 ||
    prog.unlockedHeroes.mage;

  return (
    <div
      className="fixed bottom-3 left-1/2 -translate-x-1/2 z-30 w-[96vw] max-w-[1180px] transition-transform duration-200"
      style={{
        transform: state.dockCollapsed
          ? 'translate(0, calc(100% - 38px))'
          : 'translate(0, 0)',
      }}
    >
      {/* Top Tab Bar */}
      <div className="flex items-center justify-between gap-2 rounded-t-xl border border-b-0 border-slate-700/90 bg-[#0b111e] px-3 py-2">
        <div className="flex items-center gap-1.5 overflow-x-auto">
          <button
            onClick={() => onSelectTab('gathering')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap shrink-0 ${
              state.activeTab === 'gathering'
                ? 'bg-amber-500 text-slate-950'
                : 'text-slate-300 hover:bg-slate-800'
            }`}
          >
            <Pickaxe className="w-3.5 h-3.5" />
            <span>{isZh ? '采集' : 'Gather'}</span>
          </button>

          {prog.unlockedTabs.crafting && (
            <button
              onClick={() => onSelectTab('crafting')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap shrink-0 ${
                state.activeTab === 'crafting'
                  ? 'bg-amber-500 text-slate-950'
                  : 'text-slate-300 hover:bg-slate-800'
              }`}
            >
              <Hammer className="w-3.5 h-3.5" />
              <span>{isZh ? '加工' : 'Refine'}</span>
            </button>
          )}

          {prog.unlockedTabs.forge && (
            <button
              onClick={() => onSelectTab('forge')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap shrink-0 ${
                state.activeTab === 'forge'
                  ? 'bg-amber-500 text-slate-950'
                  : 'text-amber-300 hover:bg-slate-800'
              }`}
            >
              <Anvil className="w-3.5 h-3.5" />
              <span>{isZh ? '锻造' : 'Forge'}</span>
            </button>
          )}

          {prog.unlockedTabs.character && (
            <button
              onClick={() => onSelectTab('character')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap shrink-0 ${
                state.activeTab === 'character'
                  ? 'bg-amber-500 text-slate-950'
                  : 'text-slate-300 hover:bg-slate-800'
              }`}
            >
              <Shield className="w-3.5 h-3.5" />
              <span>
                {isZh
                  ? `装备 (${state.equipmentBag.length})`
                  : `Squad (${state.equipmentBag.length})`}
              </span>
            </button>
          )}

          {prog.unlockedTabs.combat && (
            <button
              onClick={() => onSelectTab('combat')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap shrink-0 ${
                state.activeTab === 'combat'
                  ? 'bg-rose-500 text-white'
                  : 'text-rose-300 hover:bg-slate-800'
              }`}
            >
              <Sword className="w-3.5 h-3.5" />
              <span>{isZh ? '战斗' : 'Combat'}</span>
            </button>
          )}

          {prog.unlockedTabs.shop && (
            <button
              onClick={() => onSelectTab('shop')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap shrink-0 ${
                state.activeTab === 'shop'
                  ? 'bg-emerald-500 text-slate-950'
                  : 'text-emerald-300 hover:bg-slate-800'
              }`}
            >
              <Store className="w-3.5 h-3.5" />
              <span>{isZh ? '商会' : 'Shop'}</span>
            </button>
          )}

          {prog.unlockedTabs.altar && (
            <button
              onClick={() => onSelectTab('altar')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap shrink-0 ${
                state.activeTab === 'altar'
                  ? 'bg-cyan-400 text-slate-950'
                  : 'text-cyan-300 hover:bg-slate-800'
              }`}
            >
              <Fish className="w-3.5 h-3.5" />
              <span>{isZh ? '圣坛' : 'Altar'}</span>
            </button>
          )}

          {showEraTab && (
            <button
              onClick={() => onSelectTab('monument')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap shrink-0 ${
                state.activeTab === 'monument'
                  ? 'bg-purple-500 text-white'
                  : 'text-purple-300 hover:bg-slate-800'
              }`}
            >
              <Crown className="w-3.5 h-3.5" />
              <span>{isZh ? '时代法则' : 'Era Rules'}</span>
            </button>
          )}
        </div>

        <button
          onClick={onToggleCollapse}
          className="flex items-center gap-1 px-2.5 py-1 rounded-md border border-slate-700 bg-slate-800/90 text-xs font-medium text-slate-300 hover:text-white hover:bg-slate-700 whitespace-nowrap shrink-0"
          title="Shortcut: H"
        >
          {state.dockCollapsed ? (
            <>
              <ChevronUp className="w-3.5 h-3.5" />
              <span>{isZh ? '展开 (H)' : 'Expand (H)'}</span>
            </>
          ) : (
            <>
              <ChevronDown className="w-3.5 h-3.5" />
              <span>{isZh ? '收起 (H)' : 'Hide (H)'}</span>
            </>
          )}
        </button>
      </div>

      {/* Main Dock Content Body */}
      {!state.dockCollapsed && (
        <div className="max-h-[48vh] overflow-y-auto rounded-b-xl border border-slate-700/90 bg-[#0b111e]/98 p-3.5 shadow-2xl">
          {renderProgressionQuestBanner()}

          {/* TAB 1: GATHERING */}
          {state.activeTab === 'gathering' && (
            <div>
              {renderTierSubTabBar(
                state.activeGatheringTier,
                onSelectGatheringTierTab,
                allGatheringIds
              )}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {allGatheringIds.map((id) =>
                  renderActivityTierCard(id, state.activeGatheringTier)
                )}
              </div>
            </div>
          )}

          {/* TAB 2: REFINING */}
          {state.activeTab === 'crafting' && (
            <div>
              {renderTierSubTabBar(
                state.activeCraftingTier,
                onSelectCraftingTierTab,
                allCraftingIds
              )}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {allCraftingIds.map((id) =>
                  renderActivityTierCard(id, state.activeCraftingTier)
                )}
              </div>
            </div>
          )}

          {/* TAB 3: FORGE */}
          {state.activeTab === 'forge' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-3.5">
              <div className="lg:col-span-5 space-y-2">
                <div className="flex items-center justify-between gap-1">
                  <span className="text-xs font-bold text-slate-300">
                    {isZh ? '图纸' : 'Blueprints'}
                  </span>
                  <div className="flex items-center gap-1">
                    {forgeClassesAvailable.length > 1 && (
                      <button
                        onClick={() => setForgeClassFilter('all')}
                        className={`px-2 py-0.5 rounded text-xs font-medium ${
                          forgeClassFilter === 'all'
                            ? 'bg-slate-200 text-slate-950 font-semibold'
                            : 'bg-slate-800 text-slate-400 hover:text-white'
                        }`}
                      >
                        {isZh ? '全部' : 'All'}
                      </button>
                    )}
                    {forgeClassesAvailable.map((c) => (
                      <button
                        key={c}
                        onClick={() => setForgeClassFilter(c)}
                        className={`px-2 py-0.5 rounded text-xs font-medium ${
                          forgeClassFilter === c
                            ? 'bg-amber-500 text-slate-950 font-semibold'
                            : 'bg-slate-800 text-slate-300 hover:text-white'
                        }`}
                      >
                        {isZh ? CLASS_CONFIG[c].nameZh : CLASS_CONFIG[c].nameEn}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-1.5 max-h-60 overflow-y-auto pr-0.5">
                  {filteredBlueprints.map((bp) => {
                    const isSelected = bp.id === forge.selectedBlueprintId;
                    const eqInSlot =
                      state.classLoadouts[bp.requiredClass][bp.slot];

                    return (
                      <button
                        key={bp.id}
                        onClick={() => onSelectForgeBlueprint(bp.id)}
                        className={`w-full text-left rounded-lg border px-3 py-2 transition-colors flex items-center justify-between gap-2 ${
                          isSelected
                            ? 'border-amber-400 bg-amber-500/15 text-white'
                            : 'border-slate-800 bg-[#111827] text-slate-300 hover:border-slate-700'
                        }`}
                      >
                        <div className="text-xs font-bold truncate">
                          {isZh ? bp.nameZh : bp.nameEn}
                        </div>
                        <div className="text-right shrink-0 font-mono text-[11px] text-slate-400">
                          {eqInSlot
                            ? `T${eqInSlot.tier}${eqInSlot.enhanceLevel > 0 ? `+${eqInSlot.enhanceLevel}` : ''}`
                            : isZh
                              ? '未装备'
                              : 'None'}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="lg:col-span-7 rounded-lg border border-slate-800 bg-[#111827] p-4 flex flex-col justify-between">
                <div>
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-display text-base font-bold text-white">
                          {forge.selectedTier > maxTier + 1
                            ? `T${forge.selectedTier} ？？`
                            : isZh
                              ? previewGear.nameZh
                              : previewGear.nameEn}
                        </h3>
                        <span className="text-xs text-amber-400 font-semibold">
                          ·{' '}
                          {isZh
                            ? CLASS_CONFIG[selectedBp.requiredClass].nameZh
                            : CLASS_CONFIG[selectedBp.requiredClass].nameEn}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 mt-0.5">
                        {isZh
                          ? `当前穿戴：${currentlyEquippedInSlot ? `T${currentlyEquippedInSlot.tier} ${currentlyEquippedInSlot.nameZh}${currentlyEquippedInSlot.enhanceLevel > 0 ? ` +${currentlyEquippedInSlot.enhanceLevel}` : ''}` : '无'}`
                          : `Equipped: ${currentlyEquippedInSlot ? `T${currentlyEquippedInSlot.tier} (+${currentlyEquippedInSlot.enhanceLevel})` : 'None'}`}
                      </p>
                    </div>

                    <div className="flex items-center gap-1">
                      {TIERS.map((t) => {
                        const unlocked =
                          state.activities[selectedBp.requiredActivity].tiers[t]
                            ?.unlocked;
                        const active = t === forge.selectedTier;
                        const isMasked = t > maxTier + 1;
                        return (
                          <button
                            key={t}
                            disabled={forge.isCrafting || isMasked}
                            onClick={() => onSelectForgeTier(t)}
                            className={`px-2 py-1 rounded text-xs font-mono font-semibold transition-colors ${
                              active
                                ? 'bg-amber-500 text-slate-950'
                                : unlocked
                                  ? 'bg-slate-800 text-slate-200 hover:bg-slate-700'
                                  : 'bg-slate-900 text-slate-600'
                            }`}
                          >
                            {isMasked ? '？？' : `T${t}`}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {!forgeCheck.unlocked && (
                    <div className="mt-3 rounded border border-rose-500/40 bg-rose-950/30 px-3 py-2 text-xs text-rose-300">
                      {isZh
                        ? `需先在「加工」中解锁 T${forge.selectedTier} ${reqActConfig.nameZh}`
                        : `Unlock T${forge.selectedTier} ${reqActConfig.nameEn} in Refining first`}
                    </div>
                  )}

                  <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="rounded border border-slate-800 bg-slate-900/80 p-3">
                      <div className="text-xs font-semibold text-slate-400 mb-1.5">
                        {isZh ? '所需材料' : 'Materials'}
                      </div>
                      <div className="space-y-1">
                        {selectedBp.inputs.map((inp, idx) => {
                          const key = `${inp.itemKey}_${forge.selectedTier}`;
                          const have = state.resources[key] || 0;
                          const enough = have >= inp.amount;
                          return (
                            <div
                              key={idx}
                              className="flex items-center justify-between text-xs font-mono"
                            >
                              <span className="text-slate-200 font-sans">
                                {getResourceName(key, state.language)}
                              </span>
                              <span
                                className={
                                  enough ? 'text-emerald-400' : 'text-rose-400'
                                }
                              >
                                {formatCompact(have)} / {inp.amount}
                              </span>
                            </div>
                          );
                        })}
                      </div>

                      <div className="mt-3 pt-2 border-t border-slate-800 flex items-center justify-between">
                        <span className="text-xs text-slate-300">
                          {isZh ? rareMatInfo.nameZh : rareMatInfo.nameEn} (
                          {formatCompact(
                            state.resources[selectedBp.rareMaterialId] || 0
                          )}
                          /1)
                        </span>
                        <button
                          disabled={forge.isCrafting}
                          onClick={onToggleForgeRare}
                          className={`px-2.5 py-1 rounded text-xs font-semibold border transition-colors ${
                            forge.useRare
                              ? 'border-amber-400 bg-amber-500/20 text-amber-300'
                              : 'border-slate-700 bg-slate-800 text-slate-400 hover:text-white'
                          }`}
                        >
                          {forge.useRare
                            ? isZh
                              ? '已附加稀有材料'
                              : 'Rare Active'
                            : isZh
                              ? '附加稀有材料'
                              : 'Add Rare'}
                        </button>
                      </div>
                    </div>

                    <div className="rounded border border-slate-800 bg-slate-900/80 p-3">
                      <div className="text-xs font-semibold text-slate-400 mb-1.5">
                        {isZh
                          ? `T${forge.selectedTier} ${forgeTierMeta.prefixZh} 属性`
                          : `T${forge.selectedTier} Stats`}
                      </div>
                      <div className="grid grid-cols-2 gap-y-1 text-xs font-mono tabular-nums text-slate-200">
                        <div>
                          {isZh ? '攻击:' : 'ATK:'}{' '}
                          <span className="text-sky-400 font-bold">
                            +{formatCompact(previewGear.attack)}
                          </span>
                        </div>
                        <div>
                          {isZh ? '防御:' : 'DEF:'}{' '}
                          <span className="text-emerald-400 font-bold">
                            +{formatCompact(previewGear.defense)}
                          </span>
                        </div>
                        <div>
                          {isZh ? '生命:' : 'HP:'}{' '}
                          <span className="text-rose-400 font-bold">
                            +{formatCompact(previewGear.maxHp)}
                          </span>
                        </div>
                        <div>
                          {isZh ? '破甲:' : 'Brk:'}{' '}
                          <span className="text-amber-300">
                            +{(previewGear.armorBreak * 100).toFixed(0)}%
                          </span>
                        </div>
                        <div>
                          {isZh ? '掉落:' : 'Loot:'}{' '}
                          <span className="text-emerald-300">
                            +{(previewGear.lootBonus * 100).toFixed(0)}%
                          </span>
                        </div>
                        <div>
                          {isZh ? '金币:' : 'Gold:'}{' '}
                          <span className="text-purple-300">
                            +{(previewGear.goldBonus * 100).toFixed(0)}%
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-800">
                  <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-300 mb-1.5">
                    <span className="font-mono">
                      {forge.isCrafting
                        ? `${(forge.progress * 100).toFixed(0)}%`
                        : `${selectedBp.fixedDuration.toFixed(1)}s`}
                    </span>

                    {era.hasMasterArtificer && (
                      <button
                        onClick={onToggleAutoForge}
                        className={`px-2.5 py-1 rounded text-xs font-bold border transition-colors ${
                          forge.autoForge
                            ? 'border-purple-400 bg-purple-500/25 text-purple-200'
                            : 'border-slate-700 bg-slate-800 text-slate-400 hover:text-white'
                        }`}
                      >
                        {isZh
                          ? `自动锻造: ${forge.autoForge ? '开启' : '关闭'}`
                          : `Auto-Forge: ${forge.autoForge ? 'ON' : 'OFF'}`}
                      </button>
                    )}
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="h-3 flex-1 overflow-hidden rounded bg-slate-900 border border-slate-800">
                      <div
                        className="h-full bg-amber-500 transition-transform duration-75 origin-left"
                        style={{
                          transform: `scaleX(${Math.min(1, Math.max(0, forge.progress))})`,
                        }}
                      />
                    </div>

                    <button
                      disabled={
                        forge.isCrafting ||
                        !forgeCheck.unlocked ||
                        !forgeCheck.hasMaterials ||
                        !forgeCheck.hasRare
                      }
                      onClick={onStartEquipmentForge}
                      className={`px-5 py-2 rounded-lg text-xs font-bold transition-colors whitespace-nowrap shrink-0 ${
                        forge.isCrafting
                          ? 'bg-amber-500/40 text-amber-200 border border-amber-500/50 cursor-wait'
                          : forgeCheck.unlocked &&
                              forgeCheck.hasMaterials &&
                              forgeCheck.hasRare
                            ? 'bg-amber-500 text-slate-950 hover:bg-amber-400 active:scale-95'
                            : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                      }`}
                    >
                      {forge.isCrafting
                        ? `${(forge.progress * 100).toFixed(0)}%`
                        : isZh
                          ? '锻造'
                          : 'Craft'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: COMBAT */}
          {state.activeTab === 'combat' && (
            <div className="space-y-3">
              <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2">
                {COMBAT_ZONES.map((z) => {
                  const isCurrent = state.combat.currentZone === z.zone;
                  const isUnlocked = z.zone <= state.combat.maxUnlockedZone;
                  const isNext = z.zone === state.combat.maxUnlockedZone + 1;

                  return (
                    <button
                      key={z.zone}
                      disabled={!isUnlocked}
                      onClick={() => onSelectCombatZone(z.zone, 1)}
                      className={`p-2 rounded-lg border text-left transition-colors flex flex-col justify-between ${
                        isCurrent
                          ? 'border-amber-400 bg-amber-500/15 text-white'
                          : isUnlocked
                            ? 'border-slate-800 bg-slate-900/90 hover:border-slate-600 text-slate-200'
                            : 'border-slate-900 bg-slate-950/60 text-slate-600 cursor-not-allowed'
                      }`}
                    >
                      <div className="flex items-center justify-between text-xs font-bold">
                        <span>
                          {isUnlocked
                            ? `T${z.zone}`
                            : isNext
                              ? `T${z.zone} ${isZh ? TIER_META[z.zone].prefixZh : TIER_META[z.zone].prefixEn}`
                              : `T${z.zone}`}
                        </span>
                        {!isUnlocked && <Lock className="w-3 h-3 opacity-60" />}
                      </div>
                      <div className="text-xs font-semibold truncate mt-0.5">
                        {isUnlocked ? (isZh ? z.nameZh : z.nameEn) : '？？'}
                      </div>
                    </button>
                  );
                })}
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
                {/* Col 1: Stage Selector */}
                <div className="rounded-lg border border-slate-800 bg-[#111827] p-3 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-white">
                        {isZh ? currentZoneInfo.nameZh : currentZoneInfo.nameEn}
                      </span>
                      <span className="font-mono text-xs text-slate-400">
                        {state.combat.stageInZone}/10
                      </span>
                    </div>

                    <div className="mt-2.5 grid grid-cols-5 gap-1.5">
                      {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((stg) => {
                        const maxAllowed =
                          state.combat.currentZone <
                          state.combat.maxUnlockedZone
                            ? 10
                            : state.combat.maxStageInHighestZone;
                        const unlocked = stg <= maxAllowed;
                        const active = stg === state.combat.stageInZone;
                        return (
                          <button
                            key={stg}
                            disabled={!unlocked}
                            onClick={() =>
                              onSelectCombatZone(state.combat.currentZone, stg)
                            }
                            className={`py-1 rounded text-xs font-mono font-semibold transition-colors ${
                              active
                                ? 'bg-rose-600 text-white'
                                : unlocked
                                  ? 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                                  : 'bg-slate-900 text-slate-600 cursor-not-allowed'
                            }`}
                          >
                            {stg === 10 ? 'BOSS' : `S${stg}`}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="mt-3 flex items-center justify-between gap-2 pt-2 border-t border-slate-800">
                    <button
                      onClick={onToggleCombat}
                      className={`px-3 py-1.5 rounded text-xs font-semibold transition-colors ${
                        state.combat.isFighting
                          ? 'bg-emerald-600 text-white'
                          : 'bg-amber-500 text-slate-950 font-bold'
                      }`}
                    >
                      {state.combat.isFighting
                        ? isZh
                          ? '战斗中 (点击暂停)'
                          : 'Fighting (Pause)'
                        : isZh
                          ? '开始战斗'
                          : 'Start'}
                    </button>

                    <button
                      onClick={onToggleAutoAdvance}
                      className={`px-3 py-1.5 rounded text-xs font-medium border transition-colors ${
                        state.combat.autoAdvance
                          ? 'border-amber-500/60 bg-amber-500/20 text-amber-300'
                          : 'border-slate-700 bg-slate-800 text-slate-400'
                      }`}
                    >
                      {isZh ? '自动推进' : 'Auto'}:{' '}
                      {state.combat.autoAdvance
                        ? isZh
                          ? '开启'
                          : 'ON'
                        : isZh
                          ? '关闭'
                          : 'OFF'}
                    </button>
                  </div>
                </div>

                {/* Col 2: Squad Attack Bars */}
                <div className="rounded-lg border border-slate-800 bg-[#111827] p-3 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between text-xs font-bold text-white mb-2">
                      <span>
                        {state.combat.stageInZone === 10
                          ? 'BOSS'
                          : isZh
                            ? `怪物 (${state.combat.enemiesAlive}/${state.combat.enemyCount})`
                            : `Mobs (${state.combat.enemiesAlive}/${state.combat.enemyCount})`}
                      </span>
                      <span className="font-mono text-amber-400">
                        T{pStats.resonanceTier} ×
                        {pStats.resonanceMult.toFixed(2)}
                      </span>
                    </div>

                    <div className="space-y-2">
                      {(
                        [
                          {
                            cls: 'warrior' as PlayerClass,
                            timer: state.combat.warriorAttackTimer,
                            color: 'bg-amber-500',
                            unlockHint: '',
                          },
                          {
                            cls: 'hunter' as PlayerClass,
                            timer: state.combat.hunterAttackTimer,
                            color: 'bg-emerald-500',
                            unlockHint: isZh ? '打造猎弓/皮甲入队' : 'Craft Bow/Leather',
                          },
                          {
                            cls: 'mage' as PlayerClass,
                            timer: state.combat.mageAttackTimer,
                            color: 'bg-purple-500',
                            unlockHint: isZh ? '打造法杖/布甲入队' : 'Craft Staff/Cloth',
                          },
                        ] as const
                      ).map((row) => {
                        const isUnlocked = prog.unlockedHeroes[row.cls];
                        const h = pStats.heroes[row.cls];
                        const cfg = CLASS_CONFIG[row.cls];

                        if (!isUnlocked) {
                          return (
                            <div
                              key={row.cls}
                              className="rounded border border-slate-800/80 bg-slate-900/50 px-2.5 py-1 text-[11px] text-slate-500 flex items-center justify-between"
                            >
                              <span>
                                <Lock className="w-3 h-3 inline mr-1" />
                                {isZh ? cfg.nameZh : cfg.nameEn}
                              </span>
                              <span>{row.unlockHint}</span>
                            </div>
                          );
                        }

                        return (
                          <div key={row.cls}>
                            <div className="flex items-center justify-between text-[11px] font-mono text-slate-300">
                              <span className="font-sans font-semibold text-white">
                                {isZh ? cfg.nameZh : cfg.nameEn}
                              </span>
                              <span className="text-slate-400">
                                ATK {formatCompact(h.attack)}
                              </span>
                            </div>
                            <div className="h-1.5 w-full rounded-sm bg-slate-900 overflow-hidden mt-0.5">
                              <div
                                className={`h-full ${row.color} transition-transform duration-75 origin-left`}
                                style={{
                                  transform: `scaleX(${Math.min(1, Math.max(0, row.timer))})`,
                                }}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {era.hasSquadUltimate && (
                      <div className="mt-2.5 pt-2 border-t border-slate-800/80">
                        <div className="flex items-center justify-between text-[11px] mb-1">
                          <span className="font-bold text-purple-300 flex items-center gap-1">
                            <Zap className="w-3 h-3 text-amber-400" />
                            {isZh
                              ? `合击技 (${Math.floor(state.combat.ultimateCharge)}%)`
                              : `Ultimate (${Math.floor(state.combat.ultimateCharge)}%)`}
                          </span>
                          <button
                            onClick={onTriggerUltimate}
                            disabled={state.combat.ultimateCharge < 50}
                            className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              state.combat.ultimateCharge >= 50
                                ? 'bg-amber-500 text-slate-950 hover:bg-amber-400'
                                : 'bg-slate-800 text-slate-500'
                            }`}
                          >
                            {isZh ? '释放' : 'Cast'}
                          </button>
                        </div>
                        <div className="h-2 w-full rounded bg-slate-900 overflow-hidden border border-purple-500/40">
                          <div
                            className="h-full bg-gradient-to-r from-amber-500 via-rose-500 to-purple-500 transition-transform duration-75 origin-left"
                            style={{
                              transform: `scaleX(${Math.min(1, state.combat.ultimateCharge / 100)})`,
                            }}
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="mt-2 pt-2 border-t border-slate-800 text-[11px] font-mono text-slate-400 flex items-center justify-between">
                    <span>
                      DPS{' '}
                      <span className="text-sky-300 font-bold">
                        {formatCompact(pStats.totalDps)}/s
                      </span>
                    </span>
                    <span>
                      {isZh ? '皮革' : 'Leather'}{' '}
                      <span className="text-emerald-400 font-bold">
                        +
                        {formatCompact(
                          Math.round(
                            eStats.materialDropCount * pStats.lootDropMult
                          )
                        )}
                      </span>
                    </span>
                  </div>
                </div>

                {/* Col 3: Cooking Rations */}
                <div className="rounded-lg border border-slate-800 bg-[#111827] p-3 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-white flex items-center gap-1">
                        <Utensils className="w-3.5 h-3.5 text-rose-400" />
                        {isZh ? '料理补给' : 'Rations'}
                      </span>
                      {state.combat.activeBuffTimer > 0 && (
                        <span className="font-mono text-xs text-emerald-400">
                          {state.combat.activeBuffTimer.toFixed(0)}s
                        </span>
                      )}
                    </div>

                    <div className="mt-2.5 grid grid-cols-4 gap-1">
                      {TIERS.map((t) => {
                        const count = state.resources[`food_${t}`] || 0;
                        const isSelected = state.combat.selectedFoodTier === t;
                        const isMasked = t > maxTier + 1;
                        return (
                          <button
                            key={t}
                            disabled={isMasked}
                            onClick={() => onSelectAutoFoodTier(t)}
                            className={`px-1.5 py-1 rounded text-xs font-mono border transition-colors flex flex-col items-center ${
                              isSelected
                                ? 'border-rose-400 bg-rose-500/20 text-white'
                                : 'border-slate-800 bg-slate-900 text-slate-400 hover:text-slate-200'
                            }`}
                          >
                            <span>{isMasked ? '？？' : `T${t}`}</span>
                            <span className="text-[10px] text-emerald-400">
                              {isMasked ? '-' : `×${formatCompact(count)}`}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="mt-2 pt-2 border-t border-slate-800 flex items-center justify-between gap-2">
                    <span className="text-xs text-slate-400">
                      {isZh ? '生命<55%自动食用' : 'Auto <55% HP'}
                    </span>
                    <button
                      onClick={() => onEatFood(state.combat.selectedFoodTier)}
                      disabled={
                        (state.resources[
                          `food_${state.combat.selectedFoodTier}`
                        ] || 0) <= 0
                      }
                      className={`px-3 py-1.5 rounded text-xs font-semibold transition-colors whitespace-nowrap ${
                        (state.resources[
                          `food_${state.combat.selectedFoodTier}`
                        ] || 0) > 0
                          ? 'bg-rose-600 text-white hover:bg-rose-500'
                          : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                      }`}
                    >
                      {isZh
                        ? `食用 T${state.combat.selectedFoodTier}`
                        : `Eat T${state.combat.selectedFoodTier}`}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: SQUAD & WAREHOUSE */}
          {state.activeTab === 'character' && (
            <div className="space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-amber-500/40 bg-amber-500/10 px-3.5 py-2 text-xs">
                <span className="font-display font-bold text-amber-300">
                  {isZh
                    ? `装备共鸣：T${pStats.resonanceTier} (全队属性 ×${pStats.resonanceMult.toFixed(2)})`
                    : `Squad Resonance: T${pStats.resonanceTier} (×${pStats.resonanceMult.toFixed(2)})`}
                </span>
                {pStats.resonanceTier < 8 && (
                  <span className="text-slate-300 font-mono">
                    {isZh
                      ? `最低部位：${pStats.lowestSlotLabelZh}`
                      : `Lowest: ${pStats.lowestSlotLabelEn}`}
                  </span>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5">
                {(['warrior', 'hunter', 'mage'] as PlayerClass[]).map((cls) => {
                  const cfg = CLASS_CONFIG[cls];
                  const isHeroUnlocked = prog.unlockedHeroes[cls];
                  const loadout = state.classLoadouts[cls];
                  const hStats = pStats.heroes[cls];

                  if (!isHeroUnlocked) {
                    return (
                      <div
                        key={cls}
                        className="rounded-lg border border-slate-800/70 bg-slate-950/60 p-3 flex flex-col justify-center items-center text-center text-slate-500"
                      >
                        <Lock className="w-4 h-4 mb-1 text-slate-600" />
                        <div className="text-xs font-bold text-slate-400">
                          {isZh ? cfg.nameZh : cfg.nameEn}
                        </div>
                        <div className="text-[11px] mt-0.5">
                          {cls === 'hunter'
                            ? isZh
                              ? '解锁木工后打造猎人装备入队'
                              : 'Craft Hunter gear after Carpentry'
                            : isZh
                              ? '解锁裁缝后打造法师装备入队'
                              : 'Craft Mage gear after Tailoring'}
                        </div>
                      </div>
                    );
                  }

                  return (
                    <div
                      key={cls}
                      className="rounded-lg border border-slate-800 bg-[#111827] p-3 flex flex-col justify-between"
                    >
                      <div>
                        <div className="flex items-center justify-between border-b border-slate-800 pb-1.5 mb-2">
                          <span className="font-display text-sm font-bold text-white">
                            {isZh ? cfg.nameZh : cfg.nameEn}
                          </span>
                          <span className="font-mono text-[11px] text-sky-300">
                            ATK {formatCompact(hStats.attack)}
                          </span>
                        </div>

                        {(['weapon', 'armor'] as const).map((slot) => {
                          const eq = loadout[slot];
                          const enhCost = eq
                            ? Math.round(
                                eq.sellPrice *
                                  1.4 *
                                  Math.pow(1.45, eq.enhanceLevel)
                              )
                            : 0;
                          const slotName =
                            slot === 'weapon'
                              ? isZh
                                ? cfg.weaponNameZh
                                : cfg.weaponNameEn
                              : isZh
                                ? cfg.armorNameZh
                                : cfg.armorNameEn;

                          return (
                            <div
                              key={slot}
                              className="mb-1.5 last:mb-0 rounded border border-slate-800 bg-slate-900/90 p-2"
                            >
                              <div className="flex items-center justify-between gap-1.5">
                                <div className="min-w-0">
                                  <div className="text-[10px] text-slate-400 truncate">
                                    {slotName}
                                  </div>
                                  <div className="text-xs font-bold text-white truncate">
                                    {eq
                                      ? `T${eq.tier} ${isZh ? eq.nameZh : eq.nameEn} ${eq.enhanceLevel > 0 ? `+${eq.enhanceLevel}` : ''}`
                                      : isZh
                                        ? '未装备'
                                        : 'Empty'}
                                  </div>
                                </div>
                                {eq && (
                                  <button
                                    disabled={state.gold < enhCost}
                                    onClick={() =>
                                      onEnhanceEquipped(cls, slot)
                                    }
                                    className={`px-2 py-1 rounded text-[11px] font-mono font-semibold transition-colors whitespace-nowrap shrink-0 ${
                                      state.gold >= enhCost
                                        ? 'bg-amber-500 text-slate-950 hover:bg-amber-400'
                                        : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                                    }`}
                                  >
                                    {isZh ? '强化' : 'Enh'} (
                                    {formatCompact(enhCost)}G)
                                  </button>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-3">
                <div className="lg:col-span-5 rounded-lg border border-slate-800 bg-[#111827] p-3">
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="text-xs font-bold text-white">
                      {isZh
                        ? `背包 (${state.equipmentBag.length})`
                        : `Bag (${state.equipmentBag.length})`}
                    </span>
                    {state.equipmentBag.length > 0 && (
                      <button
                        onClick={onSellAllBag}
                        className="rounded bg-amber-500/20 border border-amber-500/50 px-2 py-0.5 text-[11px] font-semibold text-amber-300 hover:bg-amber-500/30 whitespace-nowrap"
                      >
                        {isZh ? '全部卖出' : 'Sell All'}
                      </button>
                    )}
                  </div>

                  <div className="max-h-40 overflow-y-auto space-y-1.5">
                    {state.equipmentBag.length === 0 ? (
                      <div className="text-xs text-slate-500 py-6 text-center">
                        {isZh ? '暂无多余装备' : 'Empty'}
                      </div>
                    ) : (
                      state.equipmentBag.map((item) => {
                        const clsCfg = CLASS_CONFIG[item.requiredClass];
                        return (
                          <div
                            key={item.id}
                            className="flex items-center justify-between gap-2 rounded border border-slate-800 bg-slate-900 px-2.5 py-1.5 text-xs"
                          >
                            <div className="min-w-0">
                              <div className="font-semibold text-white truncate">
                                [{isZh ? clsCfg.nameZh : clsCfg.nameEn}] T
                                {item.tier} {isZh ? item.nameZh : item.nameEn}
                              </div>
                              <div className="font-mono text-[10px] text-slate-400">
                                ATK {formatCompact(item.attack)} · DEF{' '}
                                {formatCompact(item.defense)} · HP{' '}
                                {formatCompact(item.maxHp)}
                              </div>
                            </div>
                            <div className="flex items-center gap-1 shrink-0">
                              <button
                                onClick={() => onEquipItem(item)}
                                className="rounded bg-emerald-600 px-2 py-1 text-[11px] font-semibold text-white hover:bg-emerald-500"
                              >
                                {isZh ? '装备' : 'Equip'}
                              </button>
                              <button
                                onClick={() => onSellItem(item.id)}
                                className="rounded bg-slate-800 border border-slate-700 px-2 py-1 text-[11px] font-mono text-amber-400 hover:bg-slate-700"
                              >
                                +{formatCompact(item.sellPrice)}G
                              </button>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>

                <div className="lg:col-span-7 rounded-lg border border-slate-800 bg-[#111827] p-3 flex flex-col justify-between">
                  <div>
                    <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                      <span className="text-xs font-bold text-white">
                        {isZh ? '物资仓库' : 'Warehouse'}
                      </span>
                      <div className="flex items-center gap-1">
                        {(['all', 'raw', 'refined', 'rare'] as const).map(
                          (f) => (
                            <button
                              key={f}
                              onClick={() => setWarehouseFilter(f)}
                              className={`px-2 py-0.5 rounded text-xs font-medium transition-colors ${
                                warehouseFilter === f
                                  ? 'bg-slate-200 text-slate-950'
                                  : 'bg-slate-800 text-slate-400 hover:text-white'
                              }`}
                            >
                              {f === 'all' && (isZh ? '全部' : 'All')}
                              {f === 'raw' && (isZh ? '原材料' : 'Raw')}
                              {f === 'refined' && (isZh ? '加工品' : 'Refined')}
                              {f === 'rare' && (isZh ? '稀有' : 'Rare')}
                            </button>
                          )
                        )}
                      </div>
                    </div>

                    <div className="overflow-x-auto max-h-40">
                      <table className="w-full text-left border-collapse text-xs">
                        <thead>
                          <tr className="border-b border-slate-800 text-slate-400">
                            <th className="py-1 px-2">
                              {isZh ? '品阶' : 'Tier'}
                            </th>
                            {(warehouseFilter === 'all' ||
                              warehouseFilter === 'raw') && (
                              <>
                                <th className="py-1 px-2">
                                  {isZh ? '矿石' : 'Ore'}
                                </th>
                                <th className="py-1 px-2">
                                  {isZh ? '木材' : 'Wood'}
                                </th>
                                <th className="py-1 px-2">
                                  {isZh ? '鱼类' : 'Fish'}
                                </th>
                                <th className="py-1 px-2">
                                  {isZh ? '草药' : 'Herb'}
                                </th>
                                <th className="py-1 px-2">
                                  {isZh ? '皮革' : 'Leather'}
                                </th>
                              </>
                            )}
                            {(warehouseFilter === 'all' ||
                              warehouseFilter === 'refined') && (
                              <>
                                <th className="py-1 px-2">
                                  {isZh ? '金属锭' : 'Ingot'}
                                </th>
                                <th className="py-1 px-2">
                                  {isZh ? '木板' : 'Plank'}
                                </th>
                                <th className="py-1 px-2">
                                  {isZh ? '布匹' : 'Cloth'}
                                </th>
                                <th className="py-1 px-2">
                                  {isZh ? '料理' : 'Ration'}
                                </th>
                              </>
                            )}
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800/60 font-mono tabular-nums">
                          {TIERS.map((t) => {
                            const isMasked = t > maxTier + 1;
                            return (
                              <tr key={t} className="hover:bg-slate-900/50">
                                <td className="py-1 px-2 font-sans font-semibold text-slate-200">
                                  {getTierLabel(t)}
                                </td>
                                {(warehouseFilter === 'all' ||
                                  warehouseFilter === 'raw') && (
                                  <>
                                    <td className="py-1 px-2 text-amber-300">
                                      {isMasked
                                        ? '-'
                                        : formatCompact(
                                            state.resources[`ore_${t}`] || 0
                                          )}
                                    </td>
                                    <td className="py-1 px-2 text-emerald-300">
                                      {isMasked
                                        ? '-'
                                        : formatCompact(
                                            state.resources[`wood_${t}`] || 0
                                          )}
                                    </td>
                                    <td className="py-1 px-2 text-sky-300">
                                      {isMasked
                                        ? '-'
                                        : formatCompact(
                                            state.resources[`fish_${t}`] || 0
                                          )}
                                    </td>
                                    <td className="py-1 px-2 text-pink-300">
                                      {isMasked
                                        ? '-'
                                        : formatCompact(
                                            state.resources[`fiber_${t}`] || 0
                                          )}
                                    </td>
                                    <td className="py-1 px-2 text-orange-300">
                                      {isMasked
                                        ? '-'
                                        : formatCompact(
                                            state.resources[`leather_${t}`] || 0
                                          )}
                                    </td>
                                  </>
                                )}
                                {(warehouseFilter === 'all' ||
                                  warehouseFilter === 'refined') && (
                                  <>
                                    <td className="py-1 px-2 text-amber-400">
                                      {isMasked
                                        ? '-'
                                        : formatCompact(
                                            state.resources[`ingot_${t}`] || 0
                                          )}
                                    </td>
                                    <td className="py-1 px-2 text-lime-300">
                                      {isMasked
                                        ? '-'
                                        : formatCompact(
                                            state.resources[`plank_${t}`] || 0
                                          )}
                                    </td>
                                    <td className="py-1 px-2 text-purple-300">
                                      {isMasked
                                        ? '-'
                                        : formatCompact(
                                            state.resources[`cloth_${t}`] || 0
                                          )}
                                    </td>
                                    <td className="py-1 px-2 text-rose-300">
                                      {isMasked
                                        ? '-'
                                        : formatCompact(
                                            state.resources[`food_${t}`] || 0
                                          )}
                                    </td>
                                  </>
                                )}
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 6: SHOP */}
          {state.activeTab === 'shop' && (
            <div className="space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-emerald-500/40 bg-emerald-950/20 px-4 py-2.5 text-xs">
                <div className="flex flex-wrap items-center gap-3">
                  <button
                    onClick={() =>
                      onUpdateAutoSell((prev) => ({
                        ...prev,
                        enabled: !prev.enabled,
                      }))
                    }
                    className={`px-3 py-1.5 rounded-md font-bold transition-colors ${
                      state.autoSell.enabled
                        ? 'bg-emerald-500 text-slate-950'
                        : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    {isZh ? '自动卖出:' : 'Auto-Sell:'}{' '}
                    {state.autoSell.enabled
                      ? isZh
                        ? '开启'
                        : 'ON'
                      : isZh
                        ? '关闭'
                        : 'OFF'}
                  </button>

                  <div className="flex items-center gap-1.5">
                    <span className="text-slate-300 font-semibold">
                      {isZh ? '保留库存:' : 'Reserve:'}
                    </span>
                    {[0, 20, 50, 100, 300].map((val) => (
                      <button
                        key={val}
                        onClick={() =>
                          onUpdateAutoSell((prev) => ({
                            ...prev,
                            reserveAmount: val,
                          }))
                        }
                        className={`px-2 py-1 rounded font-mono font-semibold ${
                          state.autoSell.reserveAmount === val
                            ? 'bg-amber-500 text-slate-950'
                            : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                        }`}
                      >
                        {val}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1.5">
                    <span className="text-slate-300">
                      {isZh ? '低阶装备:' : 'Gear:'}
                    </span>
                    <select
                      value={state.autoSell.autoSellEquipmentBelowTier}
                      onChange={(e) =>
                        onUpdateAutoSell((prev) => ({
                          ...prev,
                          autoSellEquipmentBelowTier: Number(e.target.value),
                        }))
                      }
                      className="rounded border border-slate-700 bg-slate-900 px-2 py-1 text-xs text-amber-300 font-mono"
                    >
                      <option value={0}>{isZh ? '保留' : 'Keep'}</option>
                      {[2, 3, 4, 5, 6, 7, 8, 9].map((t) => (
                        <option key={t} value={t}>
                          {t === 9
                            ? isZh
                              ? '卖出全部普通装备'
                              : 'All Normal'
                            : isZh
                              ? `卖出 < T${t}`
                              : `< T${t}`}
                        </option>
                      ))}
                    </select>
                  </div>

                  <span className="font-mono text-emerald-400 font-bold">
                    <Coins className="w-3.5 h-3.5 inline mr-1" />+
                    {formatCompact(state.lastAutoSellGoldPerSec)} G/s
                  </span>
                </div>
              </div>

              <div className="rounded-lg border border-slate-800 bg-[#111827] p-3">
                <div className="flex flex-wrap items-center justify-between gap-2 mb-2.5">
                  <h4 className="text-xs font-bold text-white">
                    {isZh ? '按品阶自动卖出' : 'Auto-Sell by Tier'}
                  </h4>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() =>
                        onUpdateAutoSell((prev) => {
                          const nextRaw = { ...prev.sellRawByTier };
                          const nextRef = { ...prev.sellRefinedByTier };
                          for (const t of TIERS) {
                            if (t <= maxTier) {
                              nextRaw[t] = true;
                              nextRef[t] = true;
                            }
                          }
                          return {
                            ...prev,
                            enabled: true,
                            sellRawByTier: nextRaw,
                            sellRefinedByTier: nextRef,
                          };
                        })
                      }
                      className="px-2.5 py-1 rounded bg-emerald-600 text-white text-xs font-semibold hover:bg-emerald-500"
                    >
                      {isZh ? '全部开启' : 'Enable All'}
                    </button>
                    <button
                      onClick={() =>
                        onUpdateAutoSell((prev) => {
                          const nextRaw = { ...prev.sellRawByTier };
                          const nextRef = { ...prev.sellRefinedByTier };
                          for (const t of TIERS) {
                            nextRaw[t] = false;
                            nextRef[t] = false;
                          }
                          return {
                            ...prev,
                            sellRawByTier: nextRaw,
                            sellRefinedByTier: nextRef,
                          };
                        })
                      }
                      className="px-2.5 py-1 rounded bg-slate-800 text-slate-300 text-xs font-medium hover:bg-slate-700"
                    >
                      {isZh ? '全部关闭' : 'Disable All'}
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2">
                  {TIERS.map((t) => {
                    const isMasked = t > maxTier + 1;
                    const rawOn = state.autoSell.sellRawByTier[t];
                    const refOn = state.autoSell.sellRefinedByTier[t];
                    const rawPrice = getResourceUnitPrice(`ore_${t}`);
                    const refPrice = getResourceUnitPrice(`ingot_${t}`);

                    return (
                      <div
                        key={t}
                        className="rounded-lg border border-slate-800 bg-slate-900/90 p-2.5 flex flex-col justify-between space-y-2"
                      >
                        <div className="flex items-center justify-between border-b border-slate-800 pb-1">
                          <span className="font-bold text-xs text-white">
                            {getTierLabel(t)}
                          </span>
                        </div>

                        <button
                          disabled={isMasked}
                          onClick={() =>
                            onUpdateAutoSell((prev) => ({
                              ...prev,
                              sellRawByTier: {
                                ...prev.sellRawByTier,
                                [t]: !prev.sellRawByTier[t],
                              },
                            }))
                          }
                          className={`w-full py-1.5 px-2 rounded text-left text-[11px] font-medium border transition-colors ${
                            isMasked
                              ? 'border-slate-900 bg-slate-950 text-slate-600 cursor-not-allowed'
                              : rawOn
                                ? 'border-emerald-500/70 bg-emerald-500/20 text-emerald-200'
                                : 'border-slate-800 bg-slate-950 text-slate-400 hover:text-slate-200'
                          }`}
                        >
                          <div className="flex items-center justify-between font-bold">
                            <span>{isZh ? '原材料' : 'Raw'}</span>
                            <span>{isMasked ? '？？' : rawOn ? 'ON' : 'OFF'}</span>
                          </div>
                          {!isMasked && (
                            <div className="font-mono text-[10px] text-amber-400 mt-0.5">
                              {formatCompact(rawPrice)} G
                            </div>
                          )}
                        </button>

                        <button
                          disabled={isMasked}
                          onClick={() =>
                            onUpdateAutoSell((prev) => ({
                              ...prev,
                              sellRefinedByTier: {
                                ...prev.sellRefinedByTier,
                                [t]: !prev.sellRefinedByTier[t],
                              },
                            }))
                          }
                          className={`w-full py-1.5 px-2 rounded text-left text-[11px] font-medium border transition-colors ${
                            isMasked
                              ? 'border-slate-900 bg-slate-950 text-slate-600 cursor-not-allowed'
                              : refOn
                                ? 'border-amber-500/70 bg-amber-500/20 text-amber-200'
                                : 'border-slate-800 bg-slate-950 text-slate-400 hover:text-slate-200'
                          }`}
                        >
                          <div className="flex items-center justify-between font-bold">
                            <span>{isZh ? '加工品' : 'Refined'}</span>
                            <span>{isMasked ? '？？' : refOn ? 'ON' : 'OFF'}</span>
                          </div>
                          {!isMasked && (
                            <div className="font-mono text-[10px] text-amber-400 mt-0.5">
                              {formatCompact(refPrice)} G
                            </div>
                          )}
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* TAB 7: FISHBONE ALTAR */}
          {state.activeTab === 'altar' && (
            <div className="space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-cyan-900/60 bg-cyan-950/25 px-3.5 py-2">
                <h3 className="font-display text-sm font-bold text-cyan-300">
                  {isZh ? '鱼骨圣坛' : 'Fishbone Altar'}
                </h3>
                <div className="font-mono text-xs text-cyan-300 flex items-center gap-4">
                  <span>
                    {isZh ? '速度' : 'Speed'} ×
                    {fbMultipliers.speedMult.toFixed(2)}
                  </span>
                  <span>
                    {isZh ? '产量' : 'Yield'} ×
                    {formatCompact(fbMultipliers.yieldMult)}
                  </span>
                  <span>
                    {isZh ? '战力' : 'Power'} ×
                    {formatCompact(fbMultipliers.combatMult)}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-2.5">
                {FISHBONE_UPGRADES.map((up) => {
                  const lv = state.fishboneUpgrades[up.id] || 0;
                  const cost = getFishboneUpgradeCost(up.id, lv);
                  const isMax = lv >= up.maxLevel;
                  const canAfford = state.fishbones >= cost && !isMax;

                  return (
                    <div
                      key={up.id}
                      className="rounded-lg border border-slate-800 bg-[#111827] p-3 flex flex-col justify-between"
                    >
                      <div>
                        <div className="flex items-center justify-between text-xs font-bold text-cyan-300">
                          <span className="truncate">
                            {isZh ? up.nameZh : up.nameEn}
                          </span>
                          <span className="font-mono text-slate-400">
                            {lv}/{up.maxLevel}
                          </span>
                        </div>
                        <p className="text-xs text-slate-300 mt-1.5">
                          {isZh ? up.descZh : up.descEn}
                        </p>
                      </div>

                      <button
                        disabled={!canAfford}
                        onClick={() => onBuyFishboneUpgrade(up.id)}
                        className={`mt-3 w-full py-1.5 rounded text-xs font-semibold font-mono transition-colors ${
                          isMax
                            ? 'bg-emerald-950/50 text-emerald-400 cursor-default'
                            : canAfford
                              ? 'bg-cyan-500 text-slate-950 hover:bg-cyan-400'
                              : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                        }`}
                      >
                        {isMax
                          ? 'MAX'
                          : `${formatCompact(cost)} ${isZh ? '鱼骨' : 'Bones'}`}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 8: ERA RULES & ENDGAME (Endgame section only shown when T8 is unlocked!) */}
          {state.activeTab === 'monument' && (
            <div className="space-y-3">
              {/* Only show T8 Overdrive & Monument when T8 is unlocked */}
              {era.highestEraTier >= 8 && (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-3">
                  <div className="lg:col-span-5 rounded-lg border border-purple-500/50 bg-gradient-to-br from-purple-950/40 via-[#111827] to-amber-950/30 p-3.5 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between gap-2">
                        <h3 className="font-display text-sm font-bold text-amber-300 flex items-center gap-1.5">
                          <Flame className="w-4 h-4 text-rose-400" />
                          {isZh ? '星界超载' : 'Astral Overdrive'}
                        </h3>
                      </div>
                      <p className="text-xs text-slate-300 mt-1.5">
                        {isZh
                          ? '全品阶产量 ×100，小队攻击与金币 ×250，攻速 ×300%。'
                          : 'Yield ×100, Squad ATK & Gold ×250, Attack Speed ×300%.'}
                      </p>
                    </div>

                    <div className="mt-3 pt-2.5 border-t border-slate-800/80 flex items-center justify-between gap-2">
                      <span className="font-mono text-xs text-amber-300">
                        {prog.overdriveActive
                          ? isZh
                            ? '超载运转中'
                            : 'Active'
                          : isZh
                            ? '未开启'
                            : 'Idle'}
                      </span>
                      <button
                        onClick={onToggleOverdrive}
                        className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
                          prog.overdriveActive
                            ? 'bg-gradient-to-r from-amber-400 via-rose-500 to-purple-500 text-slate-950'
                            : 'bg-purple-600 text-white hover:bg-purple-500'
                        }`}
                      >
                        {prog.overdriveActive
                          ? isZh
                            ? '关闭超载'
                            : 'Turn Off'
                          : isZh
                            ? '开启超载'
                            : 'Turn On'}
                      </button>
                    </div>
                  </div>

                  <div className="lg:col-span-7 rounded-lg border border-amber-500/50 bg-[#111827] p-3.5 flex flex-col justify-between">
                    <div>
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <h3 className="font-display text-sm font-bold text-white flex items-center gap-1.5">
                          <Crown className="w-4 h-4 text-amber-400" />
                          {isZh
                            ? `摸鱼神碑 (${prog.monumentStage}/3)`
                            : `Monument (${prog.monumentStage}/3)`}
                        </h3>
                        {prog.monumentStage >= 3 && (
                          <button
                            onClick={onOpenVictoryModal}
                            className="px-2.5 py-1 rounded bg-amber-500 text-slate-950 text-xs font-bold hover:bg-amber-400"
                          >
                            {isZh ? '通关证书' : 'Certificate'}
                          </button>
                        )}
                      </div>

                      {prog.monumentStage < 3 ? (
                        (() => {
                          const nextStageNum = (prog.monumentStage + 1) as
                            | 1
                            | 2
                            | 3;
                          const stgInfo = MONUMENT_STAGES[nextStageNum - 1];
                          const canBuild = canAffordMonumentStage(
                            state,
                            nextStageNum
                          );
                          return (
                            <div className="mt-2">
                              <div className="text-xs font-bold text-amber-300">
                                {isZh ? stgInfo.nameZh : stgInfo.nameEn} ·{' '}
                                <span className="font-normal text-slate-300">
                                  {isZh ? stgInfo.descZh : stgInfo.descEn}
                                </span>
                              </div>
                              <div className="mt-2 flex flex-wrap items-center justify-between gap-2 rounded border border-slate-800 bg-slate-900/90 px-3 py-2 text-xs font-mono">
                                <span
                                  className={
                                    state.gold >= stgInfo.goldCost
                                      ? 'text-emerald-400'
                                      : 'text-rose-400'
                                  }
                                >
                                  {formatCompact(state.gold)} /{' '}
                                  {formatCompact(stgInfo.goldCost)} G
                                </span>
                                <span
                                  className={
                                    state.fishbones >= stgInfo.fishboneCost
                                      ? 'text-emerald-400'
                                      : 'text-rose-400'
                                  }
                                >
                                  {isZh ? '鱼骨' : 'Bones'}:{' '}
                                  {formatCompact(state.fishbones)} /{' '}
                                  {formatCompact(stgInfo.fishboneCost)}
                                </span>
                                {stgInfo.inputs.map((inp, idx) => {
                                  const have =
                                    state.resources[inp.itemKey] || 0;
                                  return (
                                    <span
                                      key={idx}
                                      className={
                                        have >= inp.amount
                                          ? 'text-emerald-400'
                                          : 'text-rose-400'
                                      }
                                    >
                                      {getResourceName(
                                        inp.itemKey,
                                        state.language
                                      )}
                                      : {formatCompact(have)}/{inp.amount}
                                    </span>
                                  );
                                })}
                                <button
                                  disabled={!canBuild}
                                  onClick={onBuildMonumentStage}
                                  className={`px-3.5 py-1 rounded font-sans font-bold transition-colors ${
                                    canBuild
                                      ? 'bg-amber-500 text-slate-950 hover:bg-amber-400'
                                      : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                                  }`}
                                >
                                  {isZh ? '建造' : 'Build'}
                                </button>
                              </div>
                            </div>
                          );
                        })()
                      ) : (
                        <div className="mt-2 rounded border border-amber-500/50 bg-amber-500/15 p-2.5 text-xs text-amber-200">
                          {isZh ? '摸鱼神碑已全部建成。' : 'Monument complete.'}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Era Perks Grid: Unlocked show full details; Next tier (e.g. T2) shows name + ??; Higher tiers show ?? */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
                {ERA_PERKS.map((perk) => {
                  const unlocked = perk.tier <= maxTier;
                  const isNext = perk.tier === maxTier + 1;

                  return (
                    <div
                      key={perk.tier}
                      className={`rounded-lg border p-3 flex flex-col justify-between ${
                        unlocked
                          ? 'border-amber-500/50 bg-slate-900/95 text-slate-100'
                          : 'border-slate-800/70 bg-slate-950/60 text-slate-500'
                      }`}
                    >
                      <div>
                        <div className="flex items-center justify-between text-xs font-bold">
                          <span
                            className={
                              unlocked
                                ? 'text-amber-400'
                                : isNext
                                  ? 'text-slate-300'
                                  : 'text-slate-600'
                            }
                          >
                            {unlocked || isNext
                              ? isZh
                                ? perk.eraNameZh
                                : perk.eraNameEn
                              : `T${perk.tier} ？？`}
                          </span>
                          <span
                            className={`font-mono text-[10px] px-1.5 py-0.2 rounded ${
                              unlocked
                                ? 'bg-emerald-500/20 text-emerald-300'
                                : 'bg-slate-800 text-slate-500'
                            }`}
                          >
                            {unlocked
                              ? isZh
                                ? '已解锁'
                                : 'Active'
                              : isZh
                                ? '未解锁'
                                : 'Locked'}
                          </span>
                        </div>
                        <div
                          className={`text-xs font-bold mt-1.5 ${
                            unlocked ? 'text-white' : 'text-slate-500'
                          }`}
                        >
                          {unlocked
                            ? isZh
                              ? perk.perkTitleZh
                              : perk.perkTitleEn
                            : '？？'}
                        </div>
                        <p className="text-[11px] mt-1 leading-relaxed text-slate-400">
                          {unlocked
                            ? isZh
                              ? perk.perkDescZh
                              : perk.perkDescEn
                            : '？？'}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
