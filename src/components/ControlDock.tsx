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
  Sparkles,
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
  mining: '初始解锁（战士锻造线核心原料）',
  smithing: '采集满 2 个铜矿石后自动解锁（熔炼铜锭）',
  logging: '在【战斗】推进至第1阶 S3（猎人入队）后自动解锁',
  carpentry: '在【战斗】推进至第1阶 S3（猎人入队）后自动解锁',
  foraging: '在【战斗】推进至第1阶 S6（法师入队）后自动解锁',
  tailoring: '在【战斗】推进至第1阶 S6（法师入队）后自动解锁',
  fishing: '通关第1阶 Boss（S10）后自动解锁',
  cooking: '通关第1阶 Boss（S10）后自动解锁',
};

const ACTIVITY_UNLOCK_HINT_EN: Record<ActivityId, string> = {
  mining: 'Unlocked at start (Warrior Forge Line)',
  smithing: 'Unlocks automatically after mining 2 Copper Ore',
  logging: 'Unlocks at Zone 1 Stage 3 when Hunter joins your squad',
  carpentry: 'Unlocks at Zone 1 Stage 3 when Hunter joins your squad',
  foraging: 'Unlocks at Zone 1 Stage 6 when Mage joins your squad',
  tailoring: 'Unlocks at Zone 1 Stage 6 when Mage joins your squad',
  fishing: 'Unlocks after defeating Zone 1 Boss (Stage 10)',
  cooking: 'Unlocks after defeating Zone 1 Boss (Stage 10)',
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

  // Progressive onboarding banner helper
  const renderProgressionQuestBanner = () => {
    let stepTitle = '';
    let stepDesc = '';
    let badgeText = '';

    if (!prog.unlockedTabs.crafting) {
      badgeText = isZh ? '新手引导 1/6 · 矿工起步' : 'Step 1/6 · Mining Start';
      stepTitle = isZh
        ? '第一步：点击「采矿一次」收集 2 块铜矿石'
        : 'Step 1: Click "Mine Once" to gather 2 Copper Ore';
      stepDesc = isZh
        ? '开局仅保留最纯粹的【战士锻造线】。先亲手挖掘铜矿石，满 2 块后将开启【锻造熔炼】！'
        : 'Start with the pure Warrior Forge Line. Mine 2 Copper Ore to unlock Smithing!';
    } else if (!prog.unlockedTabs.forge) {
      badgeText = isZh ? '新手引导 2/6 · 熔炼金属锭' : 'Step 2/6 · Smelting';
      stepTitle = isZh
        ? '第二步：前往「通用耗材加工」熔炼 3 块铜锭'
        : 'Step 2: Go to Refining & smelt 3 Copper Ingots';
      stepDesc = isZh
        ? '将铜矿石熔炼为铜锭（满 3 块），即可开启【战士武器与护甲制作】工坊！'
        : 'Smelt 3 Copper Ingots to unlock the Warrior Weapon & Armor Forge!';
    } else if (!prog.unlockedTabs.combat) {
      badgeText = isZh ? '新手引导 3/6 · 打造战士重剑' : 'Step 3/6 · First Gear';
      stepTitle = isZh
        ? '第三步：在「武器与护甲制作」打造并穿戴 1 件战士装备'
        : 'Step 3: Craft & equip your first Warrior gear piece';
      stepDesc = isZh
        ? '为战士打造「铜重剑」或「铜重铠」并在【小队装备】中穿戴，即可正式出征【八阶战斗场所】！'
        : 'Craft a Copper Greatsword or Plate Armor and equip it to unlock Combat!';
    } else if (!prog.unlockedHeroes.hunter) {
      badgeText = isZh ? '主线推进 4/6 · 招募猎人' : 'Step 4/6 · Recruit Hunter';
      stepTitle = isZh
        ? '第四步：在「战斗」击败微风草甸 S2，解锁【猎人】与【伐木/工匠线】'
        : 'Step 4: Clear Whispering Meadow S2 to unlock Hunter & Logging/Carpentry';
      stepDesc = isZh
        ? '推进战斗关卡至 S3，神射猎人将加入小队，并同步开放木材采集、木板加工与猎弓/皮甲制作！'
        : 'Reach Zone 1 Stage 3 to recruit the Hunter and unlock Wood & Bow crafting!';
    } else if (!prog.unlockedHeroes.mage) {
      badgeText = isZh ? '主线推进 5/6 · 招募法师' : 'Step 5/6 · Recruit Mage';
      stepTitle = isZh
        ? '第五步：在「战斗」推进至 S6，解锁【法师】与【草药/裁缝线】'
        : 'Step 5: Reach Zone 1 Stage 6 to unlock Mage & Foraging/Tailoring';
      stepDesc = isZh
        ? '推进战斗关卡至 S6，奥术法师将加入小队释放全屏AOE，并开放草药纤维与法杖/布甲制作！'
        : 'Reach Zone 1 Stage 6 to recruit the AOE Mage and unlock Cloth & Staff crafting!';
    } else if (!prog.unlockedTabs.altar) {
      badgeText = isZh ? '主线推进 6/6 · 讨伐领主' : 'Step 6/6 · First Boss';
      stepTitle = isZh
        ? '第六步：击败第1阶 S10 史莱姆王，解锁【钓鱼/烹饪】与【T2 工业共鸣纪元】！'
        : 'Step 6: Defeat Zone 1 Boss (S10) to unlock Fishing, Cooking & Era T2!';
      stepDesc = isZh
        ? '集齐三职业小队，升级矿场与工坊雇佣自动NPC，击败史莱姆王开启全自动工业时代！'
        : 'Assemble all 3 heroes, hire NPCs, and defeat the King Slime to enter Era T2!';
    } else {
      const currentPerk = ERA_PERKS.find((p) => p.tier === era.highestEraTier)!;
      const nextPerk = ERA_PERKS.find(
        (p) => p.tier === ((era.highestEraTier + 1) as Tier)
      );
      badgeText = isZh
        ? `${currentPerk.eraNameZh} · ${currentPerk.perkTitleZh}`
        : `${currentPerk.eraNameEn} · ${currentPerk.perkTitleEn}`;
      stepTitle = isZh ? currentPerk.perkDescZh : currentPerk.perkDescEn;
      stepDesc = nextPerk
        ? isZh
          ? `下一纪元预告（解锁任意 T${nextPerk.tier} 产线激活）：【${nextPerk.perkTitleZh}】— ${nextPerk.perkDescZh}`
          : `Next Era (Unlock any T${nextPerk.tier} node): [${nextPerk.perkTitleEn}] — ${nextPerk.perkDescEn}`
        : isZh
          ? '已登顶 T8 星界超载纪元！前往【时代与神碑】开启百倍超载或建造创世摸鱼神碑！'
          : 'Max T8 Astral Era reached! Open [Era & Monument] for 100x Overdrive & Finale Monument!';
    }

    return (
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2 rounded-lg border border-amber-500/40 bg-gradient-to-r from-amber-500/15 via-slate-900/95 to-purple-500/15 px-3.5 py-2 text-xs">
        <div className="flex flex-col sm:flex-row sm:items-center gap-1.5 sm:gap-3 min-w-0">
          <span className="inline-flex items-center gap-1 rounded bg-amber-500 px-2 py-0.5 font-mono text-[11px] font-bold text-slate-950 shrink-0 w-fit">
            <Sparkles className="w-3 h-3" />
            {badgeText}
          </span>
          <span className="font-bold text-amber-200 truncate">{stepTitle}</span>
        </div>
        <div className="text-[11px] text-slate-300 truncate max-w-full">
          {stepDesc}
        </div>
      </div>
    );
  };

  const renderTierSubTabBar = (
    activeTier: Tier,
    onSelect: (t: Tier) => void,
    activityList: ActivityId[]
  ) => {
    // Only show T2-T8 tabs once the player has unlocked at least 2 activities or unlocked T2, keeping the first few minutes super clean
    const showMultiTiers =
      era.highestEraTier >= 2 ||
      prog.unlockedHeroes.hunter ||
      state.gold >= 200;

    return (
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2 rounded-lg border border-slate-800 bg-[#111827] px-3 py-2">
        <div className="flex items-center gap-1.5 overflow-x-auto">
          {(showMultiTiers ? TIERS : ([1] as Tier[])).map((t) => {
            const meta = TIER_META[t];
            const isSelected = activeTier === t;
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
                <span className="font-mono">
                  T{t} {isZh ? meta.prefixZh : meta.prefixEn}
                </span>
                {autoCount > 0 ? (
                  <span
                    className={`rounded px-1 py-0.2 text-[10px] font-mono ${
                      isSelected
                        ? 'bg-slate-950/25 text-slate-950'
                        : 'bg-emerald-500/20 text-emerald-300'
                    }`}
                  >
                    {autoCount}/{totalAvailInTier}
                    {isZh ? '自动' : 'Auto'}
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
                ? `★ 工业共鸣：全服 ${era.totalHiredNpcs} 名NPC → +${(era.synergyCritChance * 100).toFixed(0)}% 双倍暴击率`
                : `★ Synergy: ${era.totalHiredNpcs} NPCs → +${(era.synergyCritChance * 100).toFixed(0)}% Double Yield`}
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

    // Check if the activity line itself is still locked in progressive onboarding
    if (!prog.unlockedActivities[id]) {
      return (
        <div
          key={`${id}_${tier}_locked_line`}
          className="flex flex-col justify-between rounded-lg border border-slate-800/70 bg-slate-950/60 p-4 text-slate-400"
        >
          <div>
            <div className="flex items-center justify-between">
              <h3 className="font-display text-sm font-bold text-slate-300 flex items-center gap-2">
                <Lock className="w-4 h-4 text-slate-500" />
                <span>
                  {isZh ? `${cfg.nameZh}产线` : `${cfg.nameEn} Line`}
                </span>
              </h3>
              <span className="font-mono text-[11px] text-slate-500">
                {isZh ? '随主线进度解锁' : 'Progressive Unlock'}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-2">
              {isZh
                ? `解锁条件：${ACTIVITY_UNLOCK_HINT_ZH[id]}`
                : `Unlock Condition: ${ACTIVITY_UNLOCK_HINT_EN[id]}`}
            </p>
          </div>
        </div>
      );
    }

    const act = state.activities[id];
    const node = act.tiers[tier];
    const isCrafting = cfg.type === 'crafting';
    const currentRecipe = isCrafting
      ? CRAFTING_RECIPES.find((r) => r.activity === id)
      : null;

    // If this specific Tier is not yet unlocked for this activity
    if (!node.unlocked) {
      const prevUnlocked =
        tier === 1 || act.tiers[(tier - 1) as Tier]?.unlocked;
      const unlockCost = Math.round(
        750 * TIER_META[(tier - 1) as Tier].baseMultiplier
      );
      const canAffordUnlock = prevUnlocked && state.gold >= unlockCost;
      const eraPerkForTier = ERA_PERKS.find((p) => p.tier === tier);

      return (
        <div
          key={`${id}_${tier}`}
          className="flex flex-col justify-between rounded-lg border border-slate-800/90 bg-[#111827]/90 p-4 text-slate-200"
        >
          <div>
            <div className="flex items-center justify-between">
              <h3 className="font-display text-base font-bold text-white flex items-center gap-2">
                <Lock className="w-4 h-4 text-amber-400" />
                <span>
                  T{tier}{' '}
                  {isZh
                    ? `${tierMeta.prefixZh} · ${cfg.nameZh}`
                    : `${tierMeta.prefixEn} ${cfg.nameEn}`}
                </span>
              </h3>
              {eraPerkForTier && tier > era.highestEraTier && (
                <span className="rounded bg-purple-500/20 border border-purple-400/40 px-2 py-0.5 font-mono text-[10px] text-purple-300">
                  {isZh
                    ? `首开激活：${eraPerkForTier.perkTitleZh}`
                    : `Unlocks Era: ${eraPerkForTier.perkTitleEn}`}
                </span>
              )}
            </div>
            <p className="text-xs text-slate-400 mt-1.5">
              {isZh
                ? `解锁后开启独立的【T${tier} ${tierMeta.prefixZh}${cfg.nameZh}】产线（可独立雇佣 T${tier} 专属 NPC），之前 T1~T${tier - 1} 的产线将继续在后台全速并行产出！`
                : `Unlocks independent T${tier} ${tierMeta.prefixEn} ${cfg.nameEn} production line while T1-T${tier - 1} keep running in parallel!`}
            </p>
            {eraPerkForTier && tier > era.highestEraTier && (
              <div className="mt-2 rounded border border-amber-500/30 bg-amber-500/10 px-2.5 py-1.5 text-[11px] text-amber-200">
                <span className="font-bold">
                  {isZh
                    ? `★ 首次解锁任意 T${tier} 产线将永久激活【${eraPerkForTier.eraNameZh} · ${eraPerkForTier.perkTitleZh}】：`
                    : `★ First T${tier} unlock activates [${eraPerkForTier.perkTitleEn}]: `}
                </span>
                {isZh ? eraPerkForTier.perkDescZh : eraPerkForTier.perkDescEn}
              </div>
            )}
          </div>

          <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between gap-3">
            <span className="text-xs text-slate-400">
              {!prevUnlocked
                ? isZh
                  ? `需先解锁 T${tier - 1} ${cfg.nameZh}`
                  : `Unlock T${tier - 1} ${cfg.nameEn} first`
                : isZh
                  ? `解锁费用：${formatCompact(unlockCost)} 金币`
                  : `Unlock Cost: ${formatCompact(unlockCost)} Gold`}
            </span>
            <button
              disabled={!canAffordUnlock}
              onClick={() => onUpgradeActivityTier(id, tier, 'unlockTier')}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition-colors whitespace-nowrap ${
                canAffordUnlock
                  ? 'bg-amber-500 text-slate-950 hover:bg-amber-400'
                  : 'bg-slate-800 text-slate-500 cursor-not-allowed'
              }`}
            >
              {isZh
                ? `解锁 T${tier} ${cfg.nameZh} (${formatCompact(unlockCost)} G)`
                : `Unlock T${tier} (${formatCompact(unlockCost)} G)`}
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
            ? 'border-cyan-500/60 bg-gradient-to-br from-[#0f172a] via-[#111827] to-cyan-950/30 shadow-[0_0_20px_rgba(34,211,238,0.12)]'
            : 'border-slate-800 bg-[#111827]'
        }`}
      >
        <div>
          <div className="flex items-center justify-between gap-2">
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-display text-base font-bold text-white">
                  T{tier}{' '}
                  {isZh
                    ? `${tierMeta.prefixZh}${cfg.nameZh}`
                    : `${tierMeta.prefixEn} ${cfg.nameEn}`}
                </h3>
                <span className="text-xs font-mono text-amber-400">
                  Lv.{costs.nodeTotalLevel}{' '}
                  {node.npcHired
                    ? isZh
                      ? `[自动运转]`
                      : `[Auto]`
                    : isZh
                      ? `[手动·完成+${formatCompact(Math.round(3 * tierMeta.baseMultiplier))}G]`
                      : `[Manual +${formatCompact(Math.round(3 * tierMeta.baseMultiplier))}G]`}
                </span>
                {metrics.isSuperconducting && (
                  <span className="rounded bg-cyan-500/20 border border-cyan-400/50 px-1.5 py-0.2 font-mono text-[10px] font-bold text-cyan-300">
                    {isZh ? '⚡超导光束 20次/秒' : '⚡SOLID BEAM'}
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400 mt-0.5 line-clamp-1">
                {isZh ? cfg.descZh : cfg.descEn}
              </p>
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
                  ? `自动${cfg.nameZh}中`
                  : `Auto ${cfg.nameEn}`
                : node.isRunning
                  ? isZh
                    ? `点击加速 ${(node.progress * 100).toFixed(0)}% (+12%)`
                    : `Tap Boost ${(node.progress * 100).toFixed(0)}% (+12%)`
                  : isZh
                    ? `${cfg.nameZh}一次`
                    : `${cfg.nameEn} Once`}
            </button>
          </div>

          <div className="mt-2.5">
            <div className="flex items-center justify-between text-xs text-slate-300 mb-1">
              <span className="font-mono tabular-nums">
                {isZh ? '周期' : 'Cycle'}: {metrics.duration.toFixed(2)}s ·{' '}
                {isZh ? '单次产量' : 'Yield'}:{' '}
                <span className="text-emerald-400 font-bold">
                  ×{formatCompact(metrics.yieldPerCycle)}
                </span>
                {metrics.overflowYieldMult > 1.01 && (
                  <span className="text-cyan-300 ml-1">
                    (溢出×{metrics.overflowYieldMult.toFixed(1)})
                  </span>
                )}
              </span>
              <span className="font-mono text-amber-300 tabular-nums">
                {isZh ? '稀有率' : 'Rare'}:{' '}
                {(metrics.rareChance * 100).toFixed(1)}%
              </span>
            </div>

            {/* Progress Bar OR T6+ Superconducting Solid Beam */}
            <div className="h-2.5 w-full overflow-hidden rounded-sm bg-slate-900 border border-slate-800 relative">
              {metrics.isSuperconducting ? (
                <div className="h-full w-full bg-gradient-to-r from-cyan-400 via-purple-400 to-amber-300 animate-pulse shadow-[0_0_12px_#22d3ee]" />
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
            <div className="mt-2.5 rounded border border-slate-800/80 bg-slate-900/70 px-2.5 py-2 text-xs">
              <div className="flex items-center justify-between text-slate-300">
                <span>
                  {id === 'mining' &&
                    `${getResourceName(`ore_${tier}`, state.language)}: ${formatCompact(state.resources[`ore_${tier}`] || 0)} (${isZh ? '单价' : 'Val'} ${formatCompact(getResourceUnitPrice(`ore_${tier}`))}G)`}
                  {id === 'logging' &&
                    `${getResourceName(`wood_${tier}`, state.language)}: ${formatCompact(state.resources[`wood_${tier}`] || 0)} (${isZh ? '单价' : 'Val'} ${formatCompact(getResourceUnitPrice(`wood_${tier}`))}G)`}
                  {id === 'fishing' &&
                    `${getResourceName(`fish_${tier}`, state.language)}: ${formatCompact(state.resources[`fish_${tier}`] || 0)} + ${isZh ? '鱼骨头' : 'Fishbones'}`}
                  {id === 'foraging' &&
                    `${getResourceName(`fiber_${tier}`, state.language)}: ${formatCompact(state.resources[`fiber_${tier}`] || 0)} / ${isZh ? '糖' : 'Sugar'}(${formatCompact(state.resources.sugar || 0)})`}
                </span>
                <span className="font-mono text-sky-300">
                  {isZh ? rareInfo.nameZh : rareInfo.nameEn}:{' '}
                  {formatCompact(rareHave)}
                </span>
              </div>
            </div>
          ) : (
            currentRecipe && (
              <div className="mt-2.5 rounded border border-slate-800/80 bg-slate-900/70 px-2.5 py-2 text-xs flex flex-wrap items-center justify-between gap-2">
                <div className="flex flex-wrap items-center gap-2 text-slate-300">
                  <span className="text-slate-400">
                    {era.hasZeroCostRefining
                      ? isZh
                        ? '★T5零损耗免原料:'
                        : '★T5 Zero-Cost:'
                      : isZh
                        ? '消耗:'
                        : 'In:'}
                  </span>
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
                            ? '免消耗'
                            : 'FREE'
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
                  ) · {isZh ? '单价' : 'Val'}{' '}
                  {formatCompact(
                    getResourceUnitPrice(
                      `${currentRecipe.output.itemKey}_${tier}`
                    )
                  )}
                  G
                </div>
              </div>
            )
          )}
        </div>

        {/* Bottom Row: Per-Tier Dedicated NPC + 3 Smooth Level Upgrades */}
        <div className="mt-3 pt-2.5 border-t border-slate-800/90 space-y-2">
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs text-slate-300 truncate">
              T{tier} {isZh ? cfg.npcNameZh : cfg.npcNameEn}{' '}
              {node.npcHired ? (
                <span className="font-mono text-emerald-400">
                  (Lv.{node.npcLevel})
                </span>
              ) : (
                <span
                  className={`font-mono ${costs.canUnlockNpc ? 'text-emerald-400' : 'text-amber-400'}`}
                >
                  (
                  {isZh
                    ? `需总等级 Lv.${costs.npcUnlockLevel} · 当前 ${costs.nodeTotalLevel}/${costs.npcUnlockLevel}`
                    : `Req Lv.${costs.npcUnlockLevel} · Now ${costs.nodeTotalLevel}/${costs.npcUnlockLevel}`}
                  )
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
                    ? `差 ${costs.npcUnlockLevel - costs.nodeTotalLevel} 级解锁NPC (${formatCompact(costs.npcHireCost)} G)`
                    : `Need +${costs.npcUnlockLevel - costs.nodeTotalLevel} Lv (${formatCompact(costs.npcHireCost)} G)`
                  : isZh
                    ? `雇佣 T${tier} 自动NPC (${formatCompact(costs.npcHireCost)} G)`
                    : `Hire T${tier} NPC (${formatCompact(costs.npcHireCost)} G)`}
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
                {isZh ? '升级NPC' : 'Up NPC'} (
                {formatCompact(costs.npcUpgradeCost)} G)
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
                {isZh ? '稀有率' : 'Rare'} Lv.{node.rareDropLevel}
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

  // Only show blueprints for unlocked heroes
  const availableBlueprints = EQUIPMENT_BLUEPRINTS.filter(
    (bp) => prog.unlockedHeroes[bp.requiredClass]
  );
  const filteredBlueprints =
    forgeClassFilter === 'all'
      ? availableBlueprints
      : availableBlueprints.filter(
          (bp) => bp.requiredClass === forgeClassFilter
        );

  return (
    <div
      className="fixed bottom-3 left-1/2 -translate-x-1/2 z-30 w-[96vw] max-w-[1180px] transition-transform duration-200"
      style={{
        transform: state.dockCollapsed
          ? 'translate(0, calc(100% - 38px))'
          : 'translate(0, 0)',
      }}
    >
      {/* Top Tab Bar (Progressive Unlocks) + Zen Collapse Handle */}
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
            <span>{isZh ? '采集原材料' : 'Gathering'}</span>
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
              <span>{isZh ? '通用耗材加工' : 'Refining'}</span>
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
              <span>
                {isZh
                  ? unlockedHeroesList.length === 1
                    ? '战士武器与护甲制作'
                    : '小队武器与护甲制作'
                  : 'Gear Forge'}
              </span>
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
                  ? `小队装备与仓库 (${state.equipmentBag.length})`
                  : `Squad & Bag (${state.equipmentBag.length})`}
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
              <span>
                {isZh
                  ? `八阶战斗 (第${state.combat.currentZone}阶·${unlockedHeroesList.length}人队)`
                  : `Combat (Z${state.combat.currentZone}·${unlockedHeroesList.length}Hero)`}
              </span>
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
              <span>{isZh ? '商会与自动卖出' : 'Shop & Auto-Sell'}</span>
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
              <span>{isZh ? '鱼骨圣坛' : 'Fishbone Altar'}</span>
            </button>
          )}

          {/* ERA PERKS & ENDGAME MONUMENT TAB */}
          <button
            onClick={() => onSelectTab('monument')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap shrink-0 ${
              state.activeTab === 'monument'
                ? 'bg-purple-500 text-white'
                : 'text-purple-300 hover:bg-slate-800'
            }`}
          >
            <Crown className="w-3.5 h-3.5" />
            <span>
              {isZh
                ? `时代法则与终局神碑 (T${era.highestEraTier})`
                : `Eras & Monument (T${era.highestEraTier})`}
            </span>
          </button>
        </div>

        <button
          onClick={onToggleCollapse}
          className="flex items-center gap-1 px-2.5 py-1 rounded-md border border-slate-700 bg-slate-800/90 text-xs font-medium text-slate-300 hover:text-white hover:bg-slate-700 whitespace-nowrap shrink-0"
          title="Shortcut: H"
        >
          {state.dockCollapsed ? (
            <>
              <ChevronUp className="w-3.5 h-3.5" />
              <span>{isZh ? '展开控制台 (H)' : 'Expand Dock (H)'}</span>
            </>
          ) : (
            <>
              <ChevronDown className="w-3.5 h-3.5" />
              <span>{isZh ? '全景模式 (H)' : 'Zen Mode (H)'}</span>
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

          {/* TAB 2: GENERAL CONSUMABLE REFINING */}
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

          {/* TAB 3: DEDICATED WEAPON & ARMOR FORGE UI (WITH T4 AUTO-FORGE & AUTO-MERGE) */}
          {state.activeTab === 'forge' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-3.5">
              <div className="lg:col-span-5 space-y-2">
                <div className="flex items-center justify-between gap-1">
                  <span className="text-xs font-bold text-slate-300">
                    {isZh ? '已解锁英雄图纸：' : 'Unlocked Hero Blueprints:'}
                  </span>
                  <div className="flex items-center gap-1">
                    {unlockedHeroesList.length > 1 && (
                      <button
                        onClick={() => setForgeClassFilter('all')}
                        className={`px-2 py-0.5 rounded text-xs font-medium ${
                          forgeClassFilter === 'all'
                            ? 'bg-slate-200 text-slate-950 font-semibold'
                            : 'bg-slate-800 text-slate-400 hover:text-white'
                        }`}
                      >
                        {isZh
                          ? `全部(${availableBlueprints.length})`
                          : `All(${availableBlueprints.length})`}
                      </button>
                    )}
                    {unlockedHeroesList.map((c) => (
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
                    const actUnlockedTier =
                      state.activities[bp.requiredActivity].unlockedTier;
                    const reqActName = isZh
                      ? ACTIVITY_CONFIG[bp.requiredActivity].nameZh
                      : ACTIVITY_CONFIG[bp.requiredActivity].nameEn;
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
                        <div className="min-w-0">
                          <div className="text-xs font-bold truncate">
                            {isZh ? bp.nameZh : bp.nameEn}
                          </div>
                          <div className="text-[11px] text-slate-400 truncate mt-0.5">
                            {isZh ? bp.descZh : bp.descEn}
                          </div>
                        </div>
                        <div className="text-right shrink-0 font-mono text-[11px]">
                          <div className="text-amber-400">
                            {reqActName} T{actUnlockedTier}
                          </div>
                          <div className="text-slate-400">
                            {isZh ? '现穿:' : 'Eq:'}{' '}
                            {eqInSlot
                              ? `T${eqInSlot.tier}${eqInSlot.enhanceLevel > 0 ? `+${eqInSlot.enhanceLevel}` : ''}`
                              : '无'}
                          </div>
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
                          {isZh ? previewGear.nameZh : previewGear.nameEn}
                        </h3>
                        <span className="text-xs text-amber-400 font-semibold">
                          ·{' '}
                          {isZh
                            ? `${CLASS_CONFIG[selectedBp.requiredClass].nameZh} (${CLASS_CONFIG[selectedBp.requiredClass].roleTitleZh})`
                            : `${CLASS_CONFIG[selectedBp.requiredClass].nameEn} (${CLASS_CONFIG[selectedBp.requiredClass].roleTitleEn})`}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 mt-0.5">
                        {isZh
                          ? `独立读条耗时 ${selectedBp.fixedDuration.toFixed(1)} 秒 · 制作一次获得 1 件 · 现穿：${currentlyEquippedInSlot ? `T${currentlyEquippedInSlot.tier} ${currentlyEquippedInSlot.nameZh} (+${currentlyEquippedInSlot.enhanceLevel})` : '未穿戴'}`
                          : `Fixed ${selectedBp.fixedDuration.toFixed(1)}s cast · Crafts 1 item · Current: ${currentlyEquippedInSlot ? `T${currentlyEquippedInSlot.tier} (+${currentlyEquippedInSlot.enhanceLevel})` : 'None'}`}
                      </p>
                    </div>

                    <div className="flex items-center gap-1">
                      {TIERS.map((t) => {
                        const unlocked =
                          state.activities[selectedBp.requiredActivity].tiers[t]
                            ?.unlocked;
                        const active = t === forge.selectedTier;
                        return (
                          <button
                            key={t}
                            disabled={forge.isCrafting}
                            onClick={() => onSelectForgeTier(t)}
                            className={`px-2 py-1 rounded text-xs font-mono font-semibold transition-colors ${
                              active
                                ? 'bg-amber-500 text-slate-950'
                                : unlocked
                                  ? 'bg-slate-800 text-slate-200 hover:bg-slate-700'
                                  : 'bg-slate-900 text-slate-600'
                            }`}
                          >
                            T{t}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {!forgeCheck.unlocked && (
                    <div className="mt-3 rounded border border-rose-500/40 bg-rose-950/30 px-3 py-2 text-xs text-rose-300">
                      {isZh
                        ? `尚未解锁 T${forge.selectedTier} 制作权限！请先在【通用耗材加工】中切换至 T${forge.selectedTier} 页签并解锁【T${forge.selectedTier} ${reqActConfig.nameZh}】。`
                        : `Requires T${forge.selectedTier} ${reqActConfig.nameEn} unlocked in the Refining tab!`}
                    </div>
                  )}

                  <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="rounded border border-slate-800 bg-slate-900/80 p-3">
                      <div className="text-xs font-semibold text-slate-400 mb-1.5">
                        {isZh ? '所需耗材：' : 'Required Materials:'}
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
                              ? '★ 已注入神话材料 (3.2倍属性)'
                              : '★ Mythic Infused (3.2x)'
                            : isZh
                              ? '注入稀有材料'
                              : 'Infuse Rare Mat'}
                        </button>
                      </div>
                    </div>

                    <div className="rounded border border-slate-800 bg-slate-900/80 p-3">
                      <div className="text-xs font-semibold text-slate-400 mb-1.5">
                        {isZh
                          ? `T${forge.selectedTier}${forgeTierMeta.prefixZh} 成品属性与小队乘区：`
                          : `T${forge.selectedTier} ${forgeTierMeta.prefixEn} Stats & Multipliers:`}
                      </div>
                      <div className="grid grid-cols-2 gap-y-1 text-xs font-mono tabular-nums text-slate-200">
                        <div>
                          {isZh ? '攻击力:' : 'ATK:'}{' '}
                          <span className="text-sky-400 font-bold">
                            +{formatCompact(previewGear.attack)}
                          </span>
                        </div>
                        <div>
                          {isZh ? '防御力:' : 'DEF:'}{' '}
                          <span className="text-emerald-400 font-bold">
                            +{formatCompact(previewGear.defense)}
                          </span>
                        </div>
                        <div>
                          {isZh ? '最大生命:' : 'HP:'}{' '}
                          <span className="text-rose-400 font-bold">
                            +{formatCompact(previewGear.maxHp)}
                          </span>
                        </div>
                        <div>
                          {isZh ? '破甲增伤:' : 'ArmorBrk:'}{' '}
                          <span className="text-amber-300">
                            +{(previewGear.armorBreak * 100).toFixed(0)}%
                          </span>
                        </div>
                        <div>
                          {isZh ? '战利品率:' : 'LootDrop:'}{' '}
                          <span className="text-emerald-300">
                            +{(previewGear.lootBonus * 100).toFixed(0)}%
                          </span>
                        </div>
                        <div>
                          {isZh ? '金币倍率:' : 'GoldMult:'}{' '}
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
                        ? isZh
                          ? `独立读条制作中... ${(forge.progress * 100).toFixed(0)}%`
                          : `Crafting Gear... ${(forge.progress * 100).toFixed(0)}%`
                        : isZh
                          ? `独立读条耗时：${selectedBp.fixedDuration.toFixed(1)} 秒 (产出后若未穿戴将自动穿戴，同阶装备在T4后自动合成+1)`
                          : `Independent Cast Time: ${selectedBp.fixedDuration.toFixed(1)}s`}
                    </span>

                    {/* T4 Era Perk: Auto-Forge & Auto-Synthesis Toggle */}
                    {era.hasMasterArtificer ? (
                      <button
                        onClick={onToggleAutoForge}
                        className={`px-2.5 py-1 rounded text-xs font-bold border transition-colors ${
                          forge.autoForge
                            ? 'border-purple-400 bg-purple-500/25 text-purple-200'
                            : 'border-slate-700 bg-slate-800 text-slate-400 hover:text-white'
                        }`}
                      >
                        {isZh
                          ? `★ T4神匠自动锻造与合成: ${forge.autoForge ? 'ON' : 'OFF'}`
                          : `★ T4 Auto-Forge & Merge: ${forge.autoForge ? 'ON' : 'OFF'}`}
                      </button>
                    ) : (
                      <span className="text-[11px] text-slate-500">
                        {isZh
                          ? '（解锁 T4 秘银纪元后可开启全自动锻造与吞噬合成+N）'
                          : '(Unlock T4 Mythril Era for Auto-Forge & Merge)'}
                      </span>
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
                        ? isZh
                          ? `制作中 ${(forge.progress * 100).toFixed(0)}%`
                          : `Crafting ${(forge.progress * 100).toFixed(0)}%`
                        : isZh
                          ? '制作一次 (获得 1 件)'
                          : 'Craft 1 Equipment'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: COMBAT & 8 EXPONENTIAL ZONES */}
          {state.activeTab === 'combat' && (
            <div className="space-y-3">
              <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2">
                {COMBAT_ZONES.map((z) => {
                  const isCurrent = state.combat.currentZone === z.zone;
                  const isUnlocked = z.zone <= state.combat.maxUnlockedZone;
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
                        <span>{isZh ? `第${z.zone}阶` : `Zone ${z.zone}`}</span>
                        <span className="font-mono text-[10px] text-amber-400">
                          ×{formatCompact(z.baseMultiplier)}
                        </span>
                      </div>
                      <div className="text-xs font-semibold truncate mt-0.5">
                        {isZh ? z.nameZh : z.nameEn}
                      </div>
                      <div className="font-mono text-[10px] text-slate-400 mt-1 truncate">
                        {z.rangeLabel}
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
                        {isZh
                          ? `${currentZoneInfo.nameZh} · ${currentZoneInfo.rangeLabel}`
                          : `${currentZoneInfo.nameEn} · ${currentZoneInfo.rangeLabel}`}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 mt-1">
                      {isZh
                        ? '第1阶 S3 解锁【猎人】，S6 解锁【法师】，S10 击败领主开启下一阶！'
                        : 'Z1 S3 unlocks Hunter, S6 unlocks Mage, S10 Boss unlocks the next Zone!'}
                    </p>

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
                          ? '战斗进行中 (点击暂停)'
                          : 'Fighting (Pause)'
                        : isZh
                          ? '▶ 点击开始出征战斗'
                          : '▶ Start Combat'}
                    </button>

                    <button
                      onClick={onToggleAutoAdvance}
                      className={`px-3 py-1.5 rounded text-xs font-medium border transition-colors ${
                        state.combat.autoAdvance
                          ? 'border-amber-500/60 bg-amber-500/20 text-amber-300'
                          : 'border-slate-700 bg-slate-800 text-slate-400'
                      }`}
                    >
                      {isZh ? '自动推进关卡' : 'Auto-Advance'}:{' '}
                      {state.combat.autoAdvance ? 'ON' : 'OFF'}
                    </button>
                  </div>
                </div>

                {/* Col 2: Squad Specialization, Attack Bars & T3 Ultimate Bar */}
                <div className="rounded-lg border border-slate-800 bg-[#111827] p-3 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between text-xs font-bold text-white mb-2">
                      <span>
                        {state.combat.stageInZone === 10
                          ? isZh
                            ? '★ 领主Boss战 (猎人185%克制)'
                            : '★ Boss Fight (Hunter 185%)'
                          : isZh
                            ? `小怪群波次 (${state.combat.enemiesAlive}/${state.combat.enemyCount}只)`
                            : `Mob Wave (${state.combat.enemiesAlive}/${state.combat.enemyCount})`}
                      </span>
                      <span className="font-mono text-amber-400">
                        {isZh
                          ? `T${pStats.resonanceTier}共鸣 ×${pStats.resonanceMult.toFixed(2)}`
                          : `T${pStats.resonanceTier} Res ×${pStats.resonanceMult.toFixed(2)}`}
                      </span>
                    </div>

                    <div className="space-y-2">
                      {(
                        [
                          {
                            cls: 'warrior' as PlayerClass,
                            timer: state.combat.warriorAttackTimer,
                            color: 'bg-amber-500',
                            specText: isZh
                              ? '上前顺劈3怪 / Boss 125%'
                              : 'Cleave 3 / Boss 125%',
                            unlockHint: '',
                          },
                          {
                            cls: 'hunter' as PlayerClass,
                            timer: state.combat.hunterAttackTimer,
                            color: 'bg-emerald-500',
                            specText: isZh
                              ? '远程射箭 / Boss 185%重创'
                              : 'Ranged / Boss 185%',
                            unlockHint: isZh
                              ? '第1阶 S3 解锁入队'
                              : 'Unlocks at Z1 S3',
                          },
                          {
                            cls: 'mage' as PlayerClass,
                            timer: state.combat.mageAttackTimer,
                            color: 'bg-purple-500',
                            specText: isZh
                              ? '魔法投射 / 全屏5怪 115%'
                              : 'Magic / All 5 Mobs 115%',
                            unlockHint: isZh
                              ? '第1阶 S6 解锁入队'
                              : 'Unlocks at Z1 S6',
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
                                {isZh ? cfg.nameZh : cfg.nameEn}{' '}
                                <span className="text-slate-400 font-mono">
                                  ATK {formatCompact(h.attack)}
                                </span>
                              </span>
                              <span className="text-amber-300 text-[10px]">
                                {row.specText}
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

                    {/* T3 Era Perk: Squad Ultimate Charge Bar */}
                    {era.hasSquadUltimate && (
                      <div className="mt-2.5 pt-2 border-t border-slate-800/80">
                        <div className="flex items-center justify-between text-[11px] mb-1">
                          <span className="font-bold text-purple-300 flex items-center gap-1">
                            <Zap className="w-3 h-3 text-amber-400" />
                            {isZh
                              ? `★ T3小队合击奥义 (${Math.floor(state.combat.ultimateCharge)}%)`
                              : `★ T3 Squad Ultimate (${Math.floor(state.combat.ultimateCharge)}%)`}
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
                            {isZh ? '满100%自动释放 / 立即轰击' : 'Auto @ 100% / Cast'}
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
                      {isZh ? '小队有效秒伤:' : 'Effective DPS:'}{' '}
                      <span className="text-sky-300 font-bold">
                        {formatCompact(pStats.totalDps)}/s
                      </span>
                    </span>
                    <span>
                      {isZh ? '单波皮革掉落:' : 'Leather/Wave:'}{' '}
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

                {/* Col 3: Cooking Rations & Auto-Eat */}
                <div className="rounded-lg border border-slate-800 bg-[#111827] p-3 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-white flex items-center gap-1">
                        <Utensils className="w-3.5 h-3.5 text-rose-400" />
                        {isZh ? '烹饪料理补给栏' : 'Combat Rations & Buffs'}
                      </span>
                      {state.combat.activeBuffTimer > 0 && (
                        <span className="font-mono text-xs text-emerald-400">
                          {isZh ? '全队料理增益:' : 'Buff:'}{' '}
                          {state.combat.activeBuffTimer.toFixed(0)}s
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-400 mt-0.5">
                      {prog.unlockedActivities.cooking
                        ? isZh
                          ? '食用料理立即恢复小队 60% 生命，并赋予 30 秒全队战力暴涨！'
                          : 'Eating restores 60% Squad HP & grants 30s All-Stat Surge!'
                        : isZh
                          ? '击败第1阶 Boss（S10）后将开启钓鱼与烹饪料理线，战斗中自动回血加攻！'
                          : 'Defeat Zone 1 Boss (S10) to unlock Fishing & Cooking Rations!'}
                    </p>

                    <div className="mt-2 grid grid-cols-4 gap-1">
                      {TIERS.map((t) => {
                        const count = state.resources[`food_${t}`] || 0;
                        const isSelected = state.combat.selectedFoodTier === t;
                        return (
                          <button
                            key={t}
                            onClick={() => onSelectAutoFoodTier(t)}
                            className={`px-1.5 py-1 rounded text-xs font-mono border transition-colors flex flex-col items-center ${
                              isSelected
                                ? 'border-rose-400 bg-rose-500/20 text-white'
                                : 'border-slate-800 bg-slate-900 text-slate-400 hover:text-slate-200'
                            }`}
                          >
                            <span>T{t}</span>
                            <span className="text-[10px] text-emerald-400">
                              ×{formatCompact(count)}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="mt-2 pt-2 border-t border-slate-800 flex items-center justify-between gap-2">
                    <span className="text-xs text-slate-400">
                      {isZh
                        ? 'HP < 55% 自动食用所选料理'
                        : 'Auto-eats when HP < 55%'}
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
                        ? `立即食用 T${state.combat.selectedFoodTier} 料理`
                        : `Eat T${state.combat.selectedFoodTier} Ration`}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: ADVENTURING SQUAD & WAREHOUSE */}
          {state.activeTab === 'character' && (
            <div className="space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-amber-500/40 bg-amber-500/10 px-3.5 py-2 text-xs">
                <div className="flex items-center gap-2">
                  <span className="font-display font-bold text-amber-300">
                    {isZh
                      ? `★ 已上阵小队品阶共鸣：当前 T${pStats.resonanceTier} 共鸣 (全队全属性 ×${pStats.resonanceMult.toFixed(2)} 倍)`
                      : `★ Active Squad Tier Resonance: T${pStats.resonanceTier} (All Squad Stats ×${pStats.resonanceMult.toFixed(2)})`}
                  </span>
                </div>
                <span className="text-slate-300 font-mono">
                  {pStats.resonanceTier < 8
                    ? isZh
                      ? `短板部位：【${pStats.lowestSlotLabelZh}】→ 将已解锁队员装备全部升至 T${pStats.resonanceTier + 1} 可大幅提升共鸣倍率！`
                      : `Bottleneck: [${pStats.lowestSlotLabelEn}] → Upgrade all active slots to T${pStats.resonanceTier + 1}!`
                    : isZh
                      ? '已达成最高 T8 星界神装共鸣！'
                      : 'Max T8 Astral Squad Resonance Achieved!'}
                </span>
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
                        <Lock className="w-5 h-5 mb-1 text-slate-600" />
                        <div className="text-xs font-bold text-slate-400">
                          {isZh ? cfg.nameZh : cfg.nameEn} ·{' '}
                          {isZh ? cfg.roleTitleZh : cfg.roleTitleEn}
                        </div>
                        <div className="text-[11px] mt-1">
                          {cls === 'hunter'
                            ? isZh
                              ? '推进至【第1阶 S3】战斗自动入队'
                              : 'Unlocks at Zone 1 Stage 3'
                            : isZh
                              ? '推进至【第1阶 S6】战斗自动入队'
                              : 'Unlocks at Zone 1 Stage 6'}
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
                          <div>
                            <span className="font-display text-sm font-bold text-white">
                              {isZh ? cfg.nameZh : cfg.nameEn}
                            </span>
                            <span className="ml-1.5 text-[11px] text-amber-400">
                              · {isZh ? cfg.roleTitleZh : cfg.roleTitleEn}
                            </span>
                          </div>
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
                        ? `装备背包 (${state.equipmentBag.length})`
                        : `Equipment Bag (${state.equipmentBag.length})`}
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
                        {isZh
                          ? '打造的装备若对应槽位为空将自动穿戴；多余装备存放在此处。'
                          : 'Crafted gear auto-equips if slot is empty; extras appear here.'}
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
                        {isZh
                          ? '全品阶物资仓库 (基础原材料 / 通用耗材 / 稀有材料)'
                          : 'Global Material & Consumable Warehouse'}
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
                              {f === 'refined' && (isZh ? '耗材' : 'Refined')}
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
                                  {isZh ? '纤维' : 'Fiber'}
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
                          {TIERS.map((t) => (
                            <tr key={t} className="hover:bg-slate-900/50">
                              <td className="py-1 px-2 font-sans font-semibold text-slate-200">
                                T{t}{' '}
                                {isZh
                                  ? TIER_META[t].prefixZh
                                  : TIER_META[t].prefixEn}
                              </td>
                              {(warehouseFilter === 'all' ||
                                warehouseFilter === 'raw') && (
                                <>
                                  <td className="py-1 px-2 text-amber-300">
                                    {formatCompact(
                                      state.resources[`ore_${t}`] || 0
                                    )}
                                  </td>
                                  <td className="py-1 px-2 text-emerald-300">
                                    {formatCompact(
                                      state.resources[`wood_${t}`] || 0
                                    )}
                                  </td>
                                  <td className="py-1 px-2 text-sky-300">
                                    {formatCompact(
                                      state.resources[`fish_${t}`] || 0
                                    )}
                                  </td>
                                  <td className="py-1 px-2 text-pink-300">
                                    {formatCompact(
                                      state.resources[`fiber_${t}`] || 0
                                    )}
                                  </td>
                                  <td className="py-1 px-2 text-orange-300">
                                    {formatCompact(
                                      state.resources[`leather_${t}`] || 0
                                    )}
                                  </td>
                                </>
                              )}
                              {(warehouseFilter === 'all' ||
                                warehouseFilter === 'refined') && (
                                <>
                                  <td className="py-1 px-2 text-amber-400">
                                    {formatCompact(
                                      state.resources[`ingot_${t}`] || 0
                                    )}
                                  </td>
                                  <td className="py-1 px-2 text-lime-300">
                                    {formatCompact(
                                      state.resources[`plank_${t}`] || 0
                                    )}
                                  </td>
                                  <td className="py-1 px-2 text-purple-300">
                                    {formatCompact(
                                      state.resources[`cloth_${t}`] || 0
                                    )}
                                  </td>
                                  <td className="py-1 px-2 text-rose-300">
                                    {formatCompact(
                                      state.resources[`food_${t}`] || 0
                                    )}
                                  </td>
                                </>
                              )}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 6: SHOP & AUTO-SELL CONFIGURATION */}
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
                    {isZh ? '自动卖出总开关:' : 'Auto-Sell Master:'}{' '}
                    {state.autoSell.enabled ? 'ON' : 'OFF'}
                  </button>

                  <div className="flex items-center gap-1.5">
                    <span className="text-slate-300 font-semibold">
                      {isZh
                        ? '库存保留线 (超出部分每秒自动变现):'
                        : 'Stock Reserve:'}
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
                      {isZh ? '低阶装备自动卖出:' : 'Auto-Sell Gear:'}
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
                      <option value={0}>
                        {isZh ? '不自动卖装备' : 'Off'}
                      </option>
                      {[2, 3, 4, 5, 6, 7, 8, 9].map((t) => (
                        <option key={t} value={t}>
                          {t === 9
                            ? isZh
                              ? '自动卖全部非神话装备'
                              : 'All Non-Mythic'
                            : isZh
                              ? `自动卖 < T${t} 装备`
                              : `Below T${t}`}
                        </option>
                      ))}
                    </select>
                  </div>

                  <span className="font-mono text-emerald-400 font-bold">
                    <Coins className="w-3.5 h-3.5 inline mr-1" />
                    {isZh ? '自动卖出收益:' : 'Auto-Sell:'} +
                    {formatCompact(state.lastAutoSellGoldPerSec)} G/s
                  </span>
                </div>
              </div>

              <div className="rounded-lg border border-slate-800 bg-[#111827] p-3">
                <div className="flex flex-wrap items-center justify-between gap-2 mb-2.5">
                  <div>
                    <h4 className="text-xs font-bold text-white">
                      {isZh
                        ? '各品阶【原材料】与【二级加工产物】自动卖出配置表'
                        : 'Per-Tier Raw Materials & Refined Products Auto-Sell Matrix'}
                    </h4>
                    <p className="text-[11px] text-slate-400">
                      {isZh
                        ? '升级到高品阶后，低品阶已雇佣的 NPC 会继续在后台生产。勾选下方对应品阶的自动卖出，即可将淘汰品阶产线转化为全天候自动印钞机！'
                        : 'Lower-tier NPCs keep working forever! Enable Auto-Sell on lower tiers to turn them into permanent automated Gold factories!'}
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() =>
                        onUpdateAutoSell((prev) => {
                          const nextRaw = { ...prev.sellRawByTier };
                          const nextRef = { ...prev.sellRefinedByTier };
                          for (const t of TIERS) {
                            nextRaw[t] = true;
                            nextRef[t] = true;
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
                      {isZh ? '全部开启自动卖出' : 'Enable All Tiers'}
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
                    const meta = TIER_META[t];
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
                            T{t} {isZh ? meta.prefixZh : meta.prefixEn}
                          </span>
                          <span className="font-mono text-[10px] text-amber-400">
                            ×{formatCompact(meta.baseMultiplier)}
                          </span>
                        </div>

                        <button
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
                            rawOn
                              ? 'border-emerald-500/70 bg-emerald-500/20 text-emerald-200'
                              : 'border-slate-800 bg-slate-950 text-slate-400 hover:text-slate-200'
                          }`}
                        >
                          <div className="flex items-center justify-between font-bold">
                            <span>{isZh ? '卖原材料' : 'Sell Raw'}</span>
                            <span>{rawOn ? 'ON' : 'OFF'}</span>
                          </div>
                          <div className="font-mono text-[10px] text-amber-400 mt-0.5">
                            {formatCompact(rawPrice)} G/{isZh ? '个' : 'ea'}
                          </div>
                        </button>

                        <button
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
                            refOn
                              ? 'border-amber-500/70 bg-amber-500/20 text-amber-200'
                              : 'border-slate-800 bg-slate-950 text-slate-400 hover:text-slate-200'
                          }`}
                        >
                          <div className="flex items-center justify-between font-bold">
                            <span>{isZh ? '卖加工品' : 'Sell Refined'}</span>
                            <span>{refOn ? 'ON' : 'OFF'}</span>
                          </div>
                          <div className="font-mono text-[10px] text-amber-400 mt-0.5">
                            {formatCompact(refPrice)} G/{isZh ? '个' : 'ea'}
                          </div>
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
              <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-cyan-900/60 bg-cyan-950/25 px-3.5 py-2.5">
                <div>
                  <h3 className="font-display text-sm font-bold text-cyan-300">
                    {isZh
                      ? '远古鱼骨圣坛 · 二级货币永久指数增幅'
                      : 'Ancient Fishbone Altar · Exponential Global Multipliers'}
                  </h3>
                  <p className="text-xs text-slate-300">
                    {isZh
                      ? '通过【钓鱼】与【战斗】获取鱼骨头，永久倍增全品阶速度、产量、小队战力与商会售价！'
                      : 'Obtain Fishbones from Fishing & Combat to permanently multiply Speed, Yield & Squad Power!'}
                  </p>
                </div>
                <div className="font-mono text-xs text-cyan-300 flex items-center gap-4">
                  <span>
                    {isZh ? '全局速度:' : 'Speed:'} ×
                    {fbMultipliers.speedMult.toFixed(2)}
                  </span>
                  <span>
                    {isZh ? '全局产量:' : 'Yield:'} ×
                    {formatCompact(fbMultipliers.yieldMult)}
                  </span>
                  <span>
                    {isZh ? '小队战力:' : 'Power:'} ×
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
                        </div>
                        <div className="font-mono text-xs text-slate-400 mt-0.5">
                          Lv.{lv} / {up.maxLevel}
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
                          ? isZh
                            ? '已满级 MAX'
                            : 'MAXED'
                          : `${formatCompact(cost)} ${isZh ? '鱼骨头' : 'Fishbones'}`}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 8: ERA PARADIGM PERKS (T1-T8) & ENDGAME MONUMENT OF ETERNAL SLACKING */}
          {state.activeTab === 'monument' && (
            <div className="space-y-3">
              {/* Top Row: T8 Overdrive Switch & Endgame Monument Builder */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-3">
                {/* Left: T8 Overdrive Carnival Switch */}
                <div className="lg:col-span-5 rounded-lg border border-purple-500/50 bg-gradient-to-br from-purple-950/40 via-[#111827] to-amber-950/30 p-3.5 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between gap-2">
                      <h3 className="font-display text-sm font-bold text-amber-300 flex items-center gap-1.5">
                        <Flame className="w-4 h-4 text-rose-400" />
                        {isZh
                          ? 'T8 终局狂欢 · 星界百倍超载模式'
                          : 'T8 Endgame · Astral 100x Overdrive'}
                      </h3>
                      <span className="font-mono text-[11px] text-purple-300">
                        {era.hasAstralOverdrive
                          ? isZh
                            ? '已解锁'
                            : 'UNLOCKED'
                          : isZh
                            ? '需解锁任意 T8 产线'
                            : 'Requires T8'}
                      </span>
                    </div>
                    <p className="text-xs text-slate-300 mt-1.5">
                      {isZh
                        ? '开启后全服进入终局爽感狂飙状态：所有采集与加工产量 ×100 倍、小队攻击力与金币掉落 ×250 倍、全小队攻速 ×300%！'
                        : 'Multiplies all Gathering & Refining yields by 100x, Squad ATK & Gold by 250x, and Attack Speed by 300%!'}
                    </p>
                  </div>

                  <div className="mt-3 pt-2.5 border-t border-slate-800/80 flex items-center justify-between gap-2">
                    <span className="font-mono text-xs text-amber-300">
                      {prog.overdriveActive
                        ? isZh
                          ? '★ 超载引擎全功率运转中！'
                          : '★ OVERDRIVE ACTIVE!'
                        : isZh
                          ? '状态：常态运转'
                          : 'Status: Normal'}
                    </span>
                    <button
                      disabled={!era.hasAstralOverdrive}
                      onClick={onToggleOverdrive}
                      className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
                        !era.hasAstralOverdrive
                          ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                          : prog.overdriveActive
                            ? 'bg-gradient-to-r from-amber-400 via-rose-500 to-purple-500 text-slate-950 shadow-[0_0_20px_rgba(245,158,11,0.5)]'
                            : 'bg-purple-600 text-white hover:bg-purple-500'
                      }`}
                    >
                      {prog.overdriveActive
                        ? isZh
                          ? '★ 星界超载已开启 (点击关闭)'
                          : '★ Overdrive ON'
                        : isZh
                          ? '⚡ 开启百倍星界超载'
                          : '⚡ Activate Overdrive'}
                    </button>
                  </div>
                </div>

                {/* Right: 3-Stage Monument of Eternal Slacking */}
                <div className="lg:col-span-7 rounded-lg border border-amber-500/50 bg-[#111827] p-3.5 flex flex-col justify-between">
                  <div>
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <h3 className="font-display text-sm font-bold text-white flex items-center gap-1.5">
                        <Crown className="w-4 h-4 text-amber-400" />
                        {isZh
                          ? `终局奇观 · 创世摸鱼神碑 (当前进度: ${prog.monumentStage}/3 阶段)`
                          : `Endgame Wonder · Monument of Eternal Slacking (${prog.monumentStage}/3)`}
                      </h3>
                      {prog.monumentStage >= 3 && (
                        <button
                          onClick={onOpenVictoryModal}
                          className="px-2.5 py-1 rounded bg-amber-500 text-slate-950 text-xs font-bold hover:bg-amber-400"
                        >
                          {isZh ? '★ 查看通关荣誉证书' : '★ Victory Certificate'}
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
                              {isZh ? stgInfo.nameZh : stgInfo.nameEn} —{' '}
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
                                {isZh ? '金币:' : 'Gold:'}{' '}
                                {formatCompact(state.gold)} /{' '}
                                {formatCompact(stgInfo.goldCost)}
                              </span>
                              <span
                                className={
                                  state.fishbones >= stgInfo.fishboneCost
                                    ? 'text-emerald-400'
                                    : 'text-rose-400'
                                }
                              >
                                {isZh ? '鱼骨:' : 'Fishbones:'}{' '}
                                {formatCompact(state.fishbones)} /{' '}
                                {formatCompact(stgInfo.fishboneCost)}
                              </span>
                              {stgInfo.inputs.map((inp, idx) => {
                                const have = state.resources[inp.itemKey] || 0;
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
                                {isZh
                                  ? `筑造第 ${nextStageNum} 阶段神碑`
                                  : `Build Stage ${nextStageNum}`}
                              </button>
                            </div>
                          </div>
                        );
                      })()
                    ) : (
                      <div className="mt-2 rounded border border-amber-500/50 bg-amber-500/15 p-2.5 text-xs text-amber-200">
                        {isZh
                          ? '★ 恭喜！【创世摸鱼神碑】已圆满落成屹立于浮空岛中央！全服永久享受神碑创世加成，您已登顶摸鱼之神！'
                          : '★ The Monument of Eternal Slacking stands complete in the 3D realm! You have beaten the game!'}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Bottom Grid: T1-T8 Era Perks Overview */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
                {ERA_PERKS.map((perk) => {
                  const unlocked = era.highestEraTier >= perk.tier;
                  return (
                    <div
                      key={perk.tier}
                      className={`rounded-lg border p-2.5 flex flex-col justify-between ${
                        unlocked
                          ? 'border-amber-500/50 bg-slate-900/95 text-slate-100'
                          : 'border-slate-800/70 bg-slate-950/60 text-slate-500'
                      }`}
                    >
                      <div>
                        <div className="flex items-center justify-between text-xs font-bold">
                          <span
                            className={
                              unlocked ? 'text-amber-400' : 'text-slate-500'
                            }
                          >
                            {isZh ? perk.eraNameZh : perk.eraNameEn}
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
                                ? '已激活'
                                : 'ACTIVE'
                              : isZh
                                ? `解锁T${perk.tier}激活`
                                : `Locked T${perk.tier}`}
                          </span>
                        </div>
                        <div
                          className={`text-xs font-bold mt-1 ${unlocked ? 'text-white' : 'text-slate-400'}`}
                        >
                          {isZh ? perk.perkTitleZh : perk.perkTitleEn}
                        </div>
                        <p className="text-[11px] mt-1 leading-relaxed">
                          {isZh ? perk.perkDescZh : perk.perkDescEn}
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
