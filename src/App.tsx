import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Clock,
  Coins,
  Crown,
  Fish,
  Flame,
  Globe,
  Sparkles,
  Sword,
  Volume2,
  VolumeX,
} from 'lucide-react';
import { ControlDock } from './components/ControlDock';
import { OfflineModal } from './components/OfflineModal';
import { ThreeViewport } from './components/ThreeViewport';
import {
  ACTIVITY_CONFIG,
  CLASS_CONFIG,
  COMBAT_ZONES,
  CRAFTING_RECIPES,
  createInitialGameState,
  ERA_PERKS,
  FISHBONE_UPGRADES,
  generateEquipmentItem,
  getResourceUnitPrice,
  MONUMENT_STAGES,
  TIER_META,
  TIERS,
} from './data/gameData';
import {
  ActivityId,
  AutoSellSettings,
  CameraFocusMode,
  CraftingActivityId,
  EquipmentItem,
  FloatingCombatText,
  GameState,
  OfflineReport,
  PlayerClass,
  Tier,
} from './types/game';
import { formatCompact, formatNumber } from './utils/format';
import {
  applyOfflineProgress,
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
  runAutoSellPass,
} from './utils/gameCalculations';
import { soundFX } from './utils/sound';

const SAVE_STORAGE_KEY = 'aethelgard_exponential_save_v9';

export default function App() {
  const [state, setState] = useState<GameState>(() => {
    try {
      const saved = localStorage.getItem(SAVE_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved) as GameState;
        const init = createInitialGameState();
        const classLoadouts = {
          warrior: {
            ...init.classLoadouts.warrior,
            ...(parsed.classLoadouts?.warrior || {}),
          },
          hunter: {
            ...init.classLoadouts.hunter,
            ...(parsed.classLoadouts?.hunter || {}),
          },
          mage: {
            ...init.classLoadouts.mage,
            ...(parsed.classLoadouts?.mage || {}),
          },
        };
        return {
          ...init,
          ...parsed,
          classLoadouts,
          progression: {
            ...init.progression,
            ...(parsed.progression || {}),
            unlockedTabs: {
              ...init.progression.unlockedTabs,
              ...(parsed.progression?.unlockedTabs || {}),
            },
            unlockedHeroes: {
              ...init.progression.unlockedHeroes,
              ...(parsed.progression?.unlockedHeroes || {}),
            },
            unlockedActivities: {
              ...init.progression.unlockedActivities,
              ...(parsed.progression?.unlockedActivities || {}),
            },
          },
          autoSell: {
            ...init.autoSell,
            ...(parsed.autoSell || {}),
          },
          equipmentForge: {
            ...init.equipmentForge,
            ...(parsed.equipmentForge || {}),
          },
          combat: {
            ...init.combat,
            ...(parsed.combat || {}),
          },
        };
      }
    } catch {
      // Ignore corrupt save
    }
    return createInitialGameState();
  });

  const [offlineReport, setOfflineReport] = useState<OfflineReport | null>(
    null
  );
  const [showVictoryModal, setShowVictoryModal] = useState(false);
  const [floatingTexts, setFloatingTexts] = useState<FloatingCombatText[]>([]);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const combatPulseRef = useRef({
    warriorAttackPulse: 0,
    hunterAttackPulse: 0,
    mageAttackPulse: 0,
    enemyHitPulse: 0,
    gatherPulse: 0,
    craftPulse: 0,
  });

  const autoSellTimerRef = useRef(0);

  const showToast = useCallback((msg: string) => {
    setToastMsg(msg);
    setTimeout(() => {
      setToastMsg((prev) => (prev === msg ? null : prev));
    }, 3000);
  }, []);

  const pushFloatingText = useCallback(
    (
      text: string,
      color: string,
      target: FloatingCombatText['target'],
      isCrit = false
    ) => {
      setFloatingTexts((prev) => [
        ...prev.slice(-8),
        {
          id: Date.now() + Math.random(),
          text,
          color,
          target,
          isCrit,
        },
      ]);
    },
    []
  );

  useEffect(() => {
    soundFX.enabled = state.soundEnabled;
  }, [state.soundEnabled]);

  // Check real offline elapsed time on first mount
  useEffect(() => {
    const now = Date.now();
    const elapsedSec = (now - state.lastSavedAt) / 1000;
    if (elapsedSec > 15) {
      const { nextState, report } = applyOfflineProgress(state, elapsedSec);
      setState(nextState);
      setOfflineReport(report);
    }
  }, []);

  // Auto-save to localStorage
  const stateRef = useRef(state);
  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  useEffect(() => {
    const saveTimer = setInterval(() => {
      try {
        const toSave: GameState = {
          ...stateRef.current,
          lastSavedAt: Date.now(),
        };
        localStorage.setItem(SAVE_STORAGE_KEY, JSON.stringify(toSave));
      } catch {
        // Ignore storage quota errors
      }
    }, 4000);
    return () => clearInterval(saveTimer);
  }, []);

  // Keyboard shortcut 'H' to toggle Zen Mode dock collapse
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (
        e.key.toLowerCase() === 'h' &&
        document.activeElement?.tagName !== 'INPUT' &&
        document.activeElement?.tagName !== 'SELECT'
      ) {
        setState((prev) => ({ ...prev, dockCollapsed: !prev.dockCollapsed }));
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  // Main 20Hz (50ms) Game Loop
  useEffect(() => {
    const tickMs = 50;
    const dt = tickMs / 1000;

    const interval = setInterval(() => {
      setState((prev) => {
        const next: GameState = {
          ...prev,
          resources: { ...prev.resources },
          activities: { ...prev.activities },
          equipmentForge: { ...prev.equipmentForge },
          combat: { ...prev.combat },
          classLoadouts: {
            warrior: { ...prev.classLoadouts.warrior },
            hunter: { ...prev.classLoadouts.hunter },
            mage: { ...prev.classLoadouts.mage },
          },
          progression: {
            ...prev.progression,
            unlockedTabs: { ...prev.progression.unlockedTabs },
            unlockedHeroes: { ...prev.progression.unlockedHeroes },
            unlockedActivities: { ...prev.progression.unlockedActivities },
          },
          equipmentBag: [...prev.equipmentBag],
        };

        const era = getEraStatus(next);
        const fb = getFishboneMultipliers(next.fishboneUpgrades);
        const prog = next.progression;

        // 1. Update ALL Unlocked Tiers (T1..T8) across unlocked Gathering & Refining Activities in Parallel!
        const allIds = Object.keys(next.activities) as ActivityId[];
        for (const id of allIds) {
          if (!prog.unlockedActivities[id]) continue;

          const prevAct = next.activities[id];
          const act = {
            ...prevAct,
            tiers: { ...prevAct.tiers },
          };
          next.activities[id] = act;

          const cfg = ACTIVITY_CONFIG[id];
          const isCrafting = cfg.type === 'crafting';

          for (const t of TIERS) {
            const prevNode = act.tiers[t];
            if (!prevNode || !prevNode.unlocked) continue;
            if (!prevNode.isRunning && !prevNode.npcHired) continue;

            const node = { ...prevNode };
            act.tiers[t] = node;

            if (
              isCrafting &&
              !canAffordCraftingRecipe(next, id as CraftingActivityId, t)
            ) {
              if (!node.npcHired) node.isRunning = false;
              node.progress = 0;
              continue;
            }

            const metrics = getActivityTierMetrics(next, id, t);
            node.progress += dt / metrics.duration;

            if (node.progress >= 1) {
              const completedCycles = node.npcHired
                ? Math.floor(node.progress)
                : 1;
              const wasManual = !node.npcHired;
              if (node.npcHired) {
                node.progress -= completedCycles;
              } else {
                node.progress = 0;
                node.isRunning = false;
              }

              if (wasManual) {
                const manualGold = Math.round(
                  3 * TIER_META[t].baseMultiplier
                );
                next.gold += manualGold;
                next.totalGoldEarned += manualGold;
              }

              // T2 Era Perk: Industrial Synergy Double Output Crit!
              const isSynergyDouble =
                era.hasIndustrialSynergy &&
                Math.random() < era.synergyCritChance;
              const critFactor = isSynergyDouble ? 2 : 1;
              const outMult =
                metrics.yieldPerCycle * completedCycles * critFactor;

              if (!isCrafting) {
                combatPulseRef.current.gatherPulse = 1;
                if (id === 'mining') {
                  next.resources[`ore_${t}`] =
                    (next.resources[`ore_${t}`] || 0) + outMult;
                } else if (id === 'logging') {
                  next.resources[`wood_${t}`] =
                    (next.resources[`wood_${t}`] || 0) + outMult;
                } else if (id === 'fishing') {
                  next.resources[`fish_${t}`] =
                    (next.resources[`fish_${t}`] || 0) + outMult;
                  const bonesGained = Math.max(
                    1,
                    Math.round(
                      completedCycles *
                        critFactor *
                        (1 + t * 0.5) *
                        (1 + (node.yieldLevel - 1) * 0.12)
                    )
                  );
                  next.fishbones += bonesGained;
                } else if (id === 'foraging') {
                  next.resources[`fiber_${t}`] =
                    (next.resources[`fiber_${t}`] || 0) + outMult;
                  next.resources.sugar =
                    (next.resources.sugar || 0) + Math.ceil(outMult * 0.6);
                  next.resources.egg =
                    (next.resources.egg || 0) + Math.ceil(outMult * 0.45);
                }

                if (Math.random() < metrics.rareChance * completedCycles) {
                  const rareKey = cfg.rareMaterialId;
                  next.resources[rareKey] =
                    (next.resources[rareKey] || 0) + critFactor;
                }
              } else {
                const recipe = CRAFTING_RECIPES.find((r) => r.activity === id);
                if (recipe) {
                  let canPay = true;
                  if (!era.hasZeroCostRefining) {
                    for (const inp of recipe.inputs) {
                      const k = inp.isTiered
                        ? `${inp.itemKey}_${t}`
                        : inp.itemKey;
                      if ((next.resources[k] || 0) < inp.amount) {
                        canPay = false;
                        break;
                      }
                    }
                  }

                  if (canPay) {
                    combatPulseRef.current.craftPulse = 1;
                    // T5 Era Perk: Zero-Loss Refining skips raw material deduction!
                    if (!era.hasZeroCostRefining) {
                      for (const inp of recipe.inputs) {
                        const k = inp.isTiered
                          ? `${inp.itemKey}_${t}`
                          : inp.itemKey;
                        next.resources[k] -= inp.amount;
                      }
                    }

                    const outKey = recipe.output.isTiered
                      ? `${recipe.output.itemKey}_${t}`
                      : recipe.output.itemKey;
                    next.resources[outKey] =
                      (next.resources[outKey] || 0) +
                      recipe.output.amount * outMult;
                  }
                }
              }
            }
          }
        }

        // 2. T4 Era Perk: Auto-Forge Start Check + Equipment Forge Progress Bar
        if (
          era.hasMasterArtificer &&
          next.equipmentForge.autoForge &&
          !next.equipmentForge.isCrafting
        ) {
          const bp = getBlueprintById(next.equipmentForge.selectedBlueprintId);
          const check = canAffordEquipmentBlueprint(
            next,
            bp,
            next.equipmentForge.selectedTier,
            next.equipmentForge.useRare
          );
          if (check.unlocked && check.hasMaterials && check.hasRare) {
            for (const inp of bp.inputs) {
              const k = `${inp.itemKey}_${next.equipmentForge.selectedTier}`;
              next.resources[k] = (next.resources[k] || 0) - inp.amount;
            }
            if (next.equipmentForge.useRare) {
              next.resources[bp.rareMaterialId] =
                (next.resources[bp.rareMaterialId] || 0) - 1;
            }
            next.equipmentForge.isCrafting = true;
            next.equipmentForge.progress = 0;
            next.equipmentForge.craftingBlueprintId = bp.id;
            next.equipmentForge.craftingTier = next.equipmentForge.selectedTier;
            next.equipmentForge.craftingUseRare = next.equipmentForge.useRare;
          }
        }

        if (
          next.equipmentForge.isCrafting &&
          next.equipmentForge.craftingBlueprintId
        ) {
          const bp = getBlueprintById(next.equipmentForge.craftingBlueprintId);
          next.equipmentForge.progress += dt / bp.fixedDuration;

          if (next.equipmentForge.progress >= 1) {
            next.equipmentForge.progress = 0;
            next.equipmentForge.isCrafting = false;
            combatPulseRef.current.craftPulse = 1;

            const newEq = generateEquipmentItem(
              next.equipmentForge.craftingTier,
              bp.slot,
              bp.subType,
              next.equipmentForge.craftingUseRare
            );

            const targetHero = newEq.requiredClass;
            const currentEq = next.classLoadouts[targetHero][newEq.slot];

            // Unlock the hero if this is their first forged equipment!
            if (!prog.unlockedHeroes[targetHero]) {
              prog.unlockedHeroes[targetHero] = true;
            }

            // Auto-equip if the hero's slot is currently empty!
            if (!currentEq) {
              next.classLoadouts[targetHero][newEq.slot] = newEq;
              prog.unlockedTabs.combat = true;
              prog.combatUnlocked = true;
            } else if (
              era.hasMasterArtificer &&
              newEq.tier === currentEq.tier
            ) {
              next.classLoadouts[targetHero][newEq.slot] = {
                ...currentEq,
                enhanceLevel: currentEq.enhanceLevel + 1,
                isRare: currentEq.isRare || newEq.isRare,
              };
            } else if (
              era.hasMasterArtificer &&
              newEq.tier > currentEq.tier
            ) {
              next.classLoadouts[targetHero][newEq.slot] = {
                ...newEq,
                enhanceLevel: Math.floor(currentEq.enhanceLevel * 0.5),
              };
              next.gold += currentEq.sellPrice;
              next.totalGoldEarned += currentEq.sellPrice;
            } else if (
              next.autoSell.enabled &&
              next.autoSell.autoSellEquipmentBelowTier > 0 &&
              newEq.tier < next.autoSell.autoSellEquipmentBelowTier &&
              !newEq.isRare
            ) {
              next.gold += newEq.sellPrice;
              next.totalGoldEarned += newEq.sellPrice;
            } else if (next.equipmentBag.length < 40) {
              next.equipmentBag.unshift(newEq);
            } else {
              next.gold += newEq.sellPrice;
              next.totalGoldEarned += newEq.sellPrice;
            }
          }
        }

        // 3. Granular Step-by-Step Progression Milestones!
        // Step 1: Mine 3 Copper Ore -> Unlock Smithing (Refining tab)
        if (!prog.unlockedTabs.crafting && (next.resources.ore_1 || 0) >= 3) {
          prog.unlockedTabs.crafting = true;
          prog.unlockedActivities.smithing = true;
          prog.craftingUnlocked = true;
        }
        // Step 2: Smelt 3 Copper Ingots -> Unlock Equipment Forge (Warrior Blueprints)
        if (!prog.unlockedTabs.forge && (next.resources.ingot_1 || 0) >= 3) {
          prog.unlockedTabs.forge = true;
          prog.unlockedTabs.character = true;
          prog.forgeUnlocked = true;
        }
        // Step 3: Craft 1 Warrior Gear -> Unlock Combat (Solo Warrior)
        if (
          !prog.unlockedTabs.combat &&
          (next.classLoadouts.warrior.weapon !== null ||
            next.classLoadouts.warrior.armor !== null ||
            next.equipmentBag.length > 0)
        ) {
          prog.unlockedTabs.combat = true;
          prog.combatUnlocked = true;
        }
        // Shop unlocks once player has some gold or hires an NPC
        if (
          !prog.unlockedTabs.shop &&
          (era.totalHiredNpcs > 0 ||
            next.gold >= 180 ||
            next.combat.maxStageInHighestZone >= 3)
        ) {
          prog.unlockedTabs.shop = true;
        }

        // Step 4: Reach Zone 1 Stage 3 -> Unlock Logging ONLY!
        if (
          !prog.unlockedActivities.logging &&
          (next.combat.maxUnlockedZone > 1 ||
            next.combat.maxStageInHighestZone >= 3)
        ) {
          prog.unlockedActivities.logging = true;
          prog.loggingLineUnlocked = true;
        }
        // Step 5: Gather 3 Wood -> Unlock Carpentry (and Hunter Blueprints in Forge!)
        if (
          prog.unlockedActivities.logging &&
          !prog.unlockedActivities.carpentry &&
          (next.resources.wood_1 || 0) >= 3
        ) {
          prog.unlockedActivities.carpentry = true;
        }
        // Step 6: Craft a Hunter Gear (Bow or Leather Armor) -> Recruit Hunter!
        if (
          !prog.unlockedHeroes.hunter &&
          (next.classLoadouts.hunter.weapon !== null ||
            next.classLoadouts.hunter.armor !== null ||
            next.equipmentBag.some((i) => i.requiredClass === 'hunter'))
        ) {
          prog.unlockedHeroes.hunter = true;
        }

        // Step 7: Reach Zone 1 Stage 6 (with Hunter recruited) -> Unlock Foraging ONLY!
        if (
          prog.unlockedHeroes.hunter &&
          !prog.unlockedActivities.foraging &&
          (next.combat.maxUnlockedZone > 1 ||
            next.combat.maxStageInHighestZone >= 6)
        ) {
          prog.unlockedActivities.foraging = true;
          prog.foragingLineUnlocked = true;
        }
        // Step 8: Gather 3 Herb Fiber -> Unlock Tailoring (and Mage Blueprints in Forge!)
        if (
          prog.unlockedActivities.foraging &&
          !prog.unlockedActivities.tailoring &&
          (next.resources.fiber_1 || 0) >= 3
        ) {
          prog.unlockedActivities.tailoring = true;
        }
        // Step 9: Craft a Mage Gear (Staff or Cloth Robe) -> Recruit Mage!
        if (
          !prog.unlockedHeroes.mage &&
          (next.classLoadouts.mage.weapon !== null ||
            next.classLoadouts.mage.armor !== null ||
            next.equipmentBag.some((i) => i.requiredClass === 'mage'))
        ) {
          prog.unlockedHeroes.mage = true;
        }

        // Step 10: Defeat Zone 1 Boss (Stage 10 -> Zone 2) -> Unlock Fishing!
        if (
          !prog.unlockedActivities.fishing &&
          (next.combat.maxUnlockedZone >= 2 || era.highestEraTier >= 2)
        ) {
          prog.unlockedActivities.fishing = true;
          prog.fishingLineUnlocked = true;
        }
        // Step 11: Catch 3 Fish -> Unlock Cooking & Fishbone Altar!
        if (
          prog.unlockedActivities.fishing &&
          !prog.unlockedActivities.cooking &&
          ((next.resources.fish_1 || 0) >= 3 || era.highestEraTier >= 2)
        ) {
          prog.unlockedActivities.cooking = true;
          prog.unlockedTabs.altar = true;
        }

        // 4. Run Shop Auto-Sell Pass once every 1.0 second
        autoSellTimerRef.current += dt;
        if (autoSellTimerRef.current >= 1.0) {
          autoSellTimerRef.current -= 1.0;
          const { goldEarned, updatedResources } = runAutoSellPass(next);
          next.resources = updatedResources;
          next.lastAutoSellGoldPerSec = goldEarned;
          if (goldEarned > 0) {
            next.gold += goldEarned;
            next.totalGoldEarned += goldEarned;
          }
        }

        // 5. Update Active Food Buff Timer
        if (next.combat.activeBuffTimer > 0) {
          next.combat.activeBuffTimer = Math.max(
            0,
            next.combat.activeBuffTimer - dt
          );
        }

        // 6. Update Adventuring Squad Parallel Combat Loop (Only Unlocked Heroes Attack!)
        const pStats = getPlayerCombatStats(next);
        next.combat.playerMaxHp = pStats.maxHp;
        if (next.combat.playerHp > pStats.maxHp) {
          next.combat.playerHp = pStats.maxHp;
        }

        let eStats = getEnemyStatsForZoneStage(
          next.combat.currentZone,
          next.combat.stageInZone
        );
        next.combat.enemyMaxHp = eStats.maxHp;
        next.combat.singleEnemyMaxHp = eStats.singleEnemyMaxHp;
        next.combat.enemyCount = eStats.enemyCount;

        if (next.combat.isFighting) {
          if (
            next.combat.playerHp / pStats.maxHp <=
            next.combat.autoEatThreshold
          ) {
            const foodKey = `food_${next.combat.selectedFoodTier}`;
            if ((next.resources[foodKey] || 0) > 0) {
              next.resources[foodKey] -= 1;
              next.combat.playerHp = Math.min(
                pStats.maxHp,
                next.combat.playerHp + Math.round(pStats.maxHp * 0.6)
              );
              next.combat.activeBuffTimer = 30;
              next.combat.activeBuffTier = next.combat.selectedFoodTier;
            }
          }

          const heroOrder: {
            cls: PlayerClass;
            timerKey:
              | 'warriorAttackTimer'
              | 'hunterAttackTimer'
              | 'mageAttackTimer';
            pulseKey:
              | 'warriorAttackPulse'
              | 'hunterAttackPulse'
              | 'mageAttackPulse';
            tagZh: string;
            tagEn: string;
            color: string;
          }[] = [
            {
              cls: 'warrior',
              timerKey: 'warriorAttackTimer',
              pulseKey: 'warriorAttackPulse',
              tagZh: '战士',
              tagEn: 'WAR',
              color: '#f59e0b',
            },
            {
              cls: 'hunter',
              timerKey: 'hunterAttackTimer',
              pulseKey: 'hunterAttackPulse',
              tagZh: '猎人',
              tagEn: 'HUN',
              color: '#34d399',
            },
            {
              cls: 'mage',
              timerKey: 'mageAttackTimer',
              pulseKey: 'mageAttackPulse',
              tagZh: '法师',
              tagEn: 'MAG',
              color: '#c084fc',
            },
          ];

          for (const hInfo of heroOrder) {
            if (!prog.unlockedHeroes[hInfo.cls]) continue;

            const hStat = pStats.heroes[hInfo.cls];
            next.combat[hInfo.timerKey] += dt / hStat.attackInterval;

            if (next.combat[hInfo.timerKey] >= 1) {
              next.combat[hInfo.timerKey] -= 1;
              const isCrit = Math.random() < hStat.critRate;

              const isBoss = eStats.isBoss;
              const aliveCount = Math.max(
                1,
                Math.ceil(next.combat.enemyHp / eStats.singleEnemyMaxHp)
              );
              const targetsHit = isBoss
                ? 1
                : Math.min(aliveCount, hStat.mobMaxTargets);

              const roleDamageMult = isBoss
                ? hStat.bossDamageMult
                : hStat.mobDamageMult * targetsHit;

              // T7 Dragon Divinity: 3x Multistrike!
              const multistrikeCount = era.hasDragonDivinity ? 3 : 1;
              const perTargetNet = Math.max(
                1,
                hStat.attack * (isCrit ? 2.15 : 1) - eStats.defense * 0.45
              );
              let dmg = Math.max(
                1,
                Math.round(perTargetNet * roleDamageMult * multistrikeCount)
              );

              // T3 Squad Ultimate Charge & Auto-Release at 100%!
              let isUltimateCast = false;
              if (era.hasSquadUltimate) {
                next.combat.ultimateCharge = Math.min(
                  100,
                  next.combat.ultimateCharge + 9
                );
                if (next.combat.ultimateCharge >= 100) {
                  next.combat.ultimateCharge = 0;
                  isUltimateCast = true;
                  dmg += Math.round(pStats.attack * 12);
                }
              }

              next.combat.enemyHp = Math.max(0, next.combat.enemyHp - dmg);
              next.combat.enemiesAlive = isBoss
                ? next.combat.enemyHp > 0
                  ? 1
                  : 0
                : Math.max(
                    0,
                    Math.ceil(next.combat.enemyHp / eStats.singleEnemyMaxHp)
                  );

              combatPulseRef.current[hInfo.pulseKey] = 1;
              combatPulseRef.current.enemyHitPulse = 1;

              const tag = next.language === 'zh' ? hInfo.tagZh : hInfo.tagEn;
              const aoeSuffix =
                !isBoss && targetsHit > 1 ? ` ×${targetsHit}` : '';
              const multiSuffix = multistrikeCount > 1 ? ` 三连` : '';
              pushFloatingText(
                isUltimateCast
                  ? `合击 -${formatCompact(dmg)}`
                  : `${tag}${aoeSuffix}${multiSuffix} ${isCrit ? '暴击 ' : ''}-${formatCompact(dmg)}`,
                isUltimateCast
                  ? '#f43f5e'
                  : isCrit
                    ? '#fbbf24'
                    : hInfo.color,
                'enemy',
                isCrit || isUltimateCast
              );

              if (next.combat.enemyHp <= 0) {
                next.combat.totalKills += eStats.enemyCount;
                const z = next.combat.currentZone;
                const goldWon = Math.round(eStats.goldDrop * pStats.goldBonus);
                next.gold += goldWon;
                next.totalGoldEarned += goldWon;

                const dropAmt = Math.max(
                  1,
                  Math.round(eStats.materialDropCount * pStats.lootDropMult)
                );
                next.resources[`leather_${z}`] =
                  (next.resources[`leather_${z}`] || 0) + dropAmt;
                next.resources[`ore_${z}`] =
                  (next.resources[`ore_${z}`] || 0) + Math.ceil(dropAmt * 0.5);
                if (prog.unlockedActivities.logging) {
                  next.resources[`wood_${z}`] =
                    (next.resources[`wood_${z}`] || 0) +
                    Math.ceil(dropAmt * 0.5);
                }

                if (Math.random() < 0.45) {
                  const bones = Math.max(
                    1,
                    Math.round(z * (eStats.isBoss ? 4 : 1))
                  );
                  next.fishbones += bones;
                }
                if (Math.random() < 0.06 * fb.rareMult) {
                  next.resources.rare_feather =
                    (next.resources.rare_feather || 0) + 1;
                }

                pushFloatingText(
                  `+${formatCompact(goldWon)}G · +${formatCompact(dropAmt)} ${next.language === 'zh' ? '皮革' : 'Leather'}`,
                  '#34d399',
                  'loot'
                );

                // Recover 35% HP on wave clear
                next.combat.playerHp = Math.min(
                  pStats.maxHp,
                  next.combat.playerHp + Math.round(pStats.maxHp * 0.35)
                );

                // In Zone 1, gate advancing past S3 until Hunter joins, and past S6 until Mage joins
                const z1StageCap =
                  next.combat.currentZone === 1
                    ? !prog.unlockedHeroes.hunter
                      ? 3
                      : !prog.unlockedHeroes.mage
                        ? 6
                        : 10
                    : 10;

                if (
                  next.combat.currentZone === next.combat.maxUnlockedZone &&
                  next.combat.stageInZone === next.combat.maxStageInHighestZone
                ) {
                  if (next.combat.maxStageInHighestZone < z1StageCap) {
                    next.combat.maxStageInHighestZone += 1;
                    if (next.combat.autoAdvance) {
                      next.combat.stageInZone =
                        next.combat.maxStageInHighestZone;
                    }
                  } else if (
                    next.combat.maxStageInHighestZone >= 10 &&
                    next.combat.maxUnlockedZone < 8
                  ) {
                    next.combat.maxUnlockedZone = (next.combat.maxUnlockedZone +
                      1) as Tier;
                    next.combat.maxStageInHighestZone = 1;
                    if (next.combat.autoAdvance) {
                      next.combat.currentZone = next.combat.maxUnlockedZone;
                      next.combat.stageInZone = 1;
                    }
                  }
                } else if (
                  next.combat.autoAdvance &&
                  next.combat.stageInZone <
                    Math.min(next.combat.maxStageInHighestZone, z1StageCap)
                ) {
                  next.combat.stageInZone += 1;
                }

                eStats = getEnemyStatsForZoneStage(
                  next.combat.currentZone,
                  next.combat.stageInZone
                );
                next.combat.enemyCount = eStats.enemyCount;
                next.combat.enemiesAlive = eStats.enemyCount;
                next.combat.singleEnemyMaxHp = eStats.singleEnemyMaxHp;
                next.combat.enemyHp = eStats.maxHp;
                next.combat.enemyMaxHp = eStats.maxHp;
                next.combat.enemyAttackTimer = 0;
              }
            }
          }

          if (next.combat.enemyHp > 0) {
            next.combat.enemyAttackTimer += dt / 1.65;
            if (next.combat.enemyAttackTimer >= 1) {
              next.combat.enemyAttackTimer -= 1;
              const aliveFactor = eStats.isBoss
                ? 1.0
                : 0.65 + 0.12 * next.combat.enemiesAlive;
              const enemyDmg = Math.max(
                1,
                Math.round(
                  eStats.attack * aliveFactor - pStats.defense * 0.65
                )
              );
              next.combat.playerHp = Math.max(
                0,
                next.combat.playerHp - enemyDmg
              );

              if (next.combat.playerHp <= 0) {
                next.combat.playerHp = pStats.maxHp;
                next.combat.autoAdvance = false;
                if (next.combat.stageInZone > 1) {
                  next.combat.stageInZone -= 1;
                }
                const fallbackEnemy = getEnemyStatsForZoneStage(
                  next.combat.currentZone,
                  next.combat.stageInZone
                );
                next.combat.enemyCount = fallbackEnemy.enemyCount;
                next.combat.enemiesAlive = fallbackEnemy.enemyCount;
                next.combat.singleEnemyMaxHp = fallbackEnemy.singleEnemyMaxHp;
                next.combat.enemyHp = fallbackEnemy.maxHp;
                next.combat.enemyMaxHp = fallbackEnemy.maxHp;
              }
            }
          }
        }

        return next;
      });
    }, tickMs);

    return () => clearInterval(interval);
  }, [pushFloatingText]);

  // Handlers
  const handleToggleActivityTier = (id: ActivityId, tier: Tier) => {
    const cfg = ACTIVITY_CONFIG[id];
    setState((prev) => {
      if (!prev.progression.unlockedActivities[id]) return prev;
      const act = prev.activities[id];
      const node = act.tiers[tier];
      if (!node || !node.unlocked || node.npcHired) {
        return prev;
      }

      if (node.isRunning) {
        if (cfg.type === 'gathering') {
          combatPulseRef.current.gatherPulse = 1;
          soundFX.playGather(
            id as 'mining' | 'logging' | 'fishing' | 'foraging'
          );
        } else {
          combatPulseRef.current.craftPulse = 1;
          soundFX.playCraft(false);
        }
        return {
          ...prev,
          activities: {
            ...prev.activities,
            [id]: {
              ...act,
              selectedTier: tier,
              tiers: {
                ...act.tiers,
                [tier]: {
                  ...node,
                  progress: Math.min(0.99, node.progress + 0.12),
                },
              },
            },
          },
        };
      }

      if (
        cfg.type === 'crafting' &&
        !canAffordCraftingRecipe(prev, id as CraftingActivityId, tier)
      ) {
        showToast(
          prev.language === 'zh'
            ? `T${tier} 原材料不足，请先采集对应品阶原材料！`
            : `Insufficient T${tier} raw materials!`
        );
        return prev;
      }

      if (cfg.type === 'gathering') {
        combatPulseRef.current.gatherPulse = 1;
        soundFX.playGather(id as 'mining' | 'logging' | 'fishing' | 'foraging');
      } else {
        combatPulseRef.current.craftPulse = 1;
        soundFX.playCraft(false);
      }

      return {
        ...prev,
        activities: {
          ...prev.activities,
          [id]: {
            ...act,
            selectedTier: tier,
            tiers: {
              ...act.tiers,
              [tier]: {
                ...node,
                isRunning: true,
                progress: 0,
              },
            },
          },
        },
      };
    });
  };

  const handleUpgradeActivityTier = (
    id: ActivityId,
    tier: Tier,
    upgradeType:
      | 'speed'
      | 'yield'
      | 'rare'
      | 'unlockTier'
      | 'hireNpc'
      | 'upgradeNpc',
    count = 1
  ) => {
    soundFX.playUpgrade();
    setState((prev) => {
      const prevAct = prev.activities[id];
      const act = {
        ...prevAct,
        tiers: { ...prevAct.tiers },
      };
      const node = { ...act.tiers[tier] };
      act.tiers[tier] = node;

      let gold = prev.gold;
      const oldEraTier = getEraStatus(prev).highestEraTier;

      if (upgradeType === 'unlockTier') {
        const prevT = (tier - 1) as Tier;
        const unlockCost = Math.round(750 * TIER_META[prevT].baseMultiplier);
        if (gold >= unlockCost) {
          gold -= unlockCost;
          if (tier > act.unlockedTier) {
            act.unlockedTier = tier;
          }
          act.selectedTier = tier;
          act.tiers[tier] = {
            ...act.tiers[tier],
            unlocked: true,
          };
        } else {
          return prev;
        }
      } else if (upgradeType === 'hireNpc') {
        const costs = getActivityTierUpgradeCosts(act, tier);
        if (
          !node.npcHired &&
          costs.canUnlockNpc &&
          gold >= costs.npcHireCost
        ) {
          gold -= costs.npcHireCost;
          node.npcHired = true;
          node.isRunning = true;
        } else {
          return prev;
        }
      } else {
        let upgradedAny = false;
        for (let i = 0; i < count; i++) {
          const costs = getActivityTierUpgradeCosts(act, tier);
          if (upgradeType === 'speed' && gold >= costs.speedCost) {
            gold -= costs.speedCost;
            node.speedLevel += 1;
            upgradedAny = true;
          } else if (upgradeType === 'yield' && gold >= costs.yieldCost) {
            gold -= costs.yieldCost;
            node.yieldLevel += 1;
            upgradedAny = true;
          } else if (upgradeType === 'rare' && gold >= costs.rareDropCost) {
            gold -= costs.rareDropCost;
            node.rareDropLevel += 1;
            upgradedAny = true;
          } else if (
            upgradeType === 'upgradeNpc' &&
            node.npcHired &&
            gold >= costs.npcUpgradeCost
          ) {
            gold -= costs.npcUpgradeCost;
            node.npcLevel += 1;
            upgradedAny = true;
          } else {
            break;
          }
        }
        if (!upgradedAny) return prev;
      }

      const nextState: GameState = {
        ...prev,
        gold,
        activities: {
          ...prev.activities,
          [id]: act,
        },
      };

      const newEraTier = getEraStatus(nextState).highestEraTier;
      if (newEraTier > oldEraTier) {
        const perk = ERA_PERKS.find((p) => p.tier === newEraTier);
        if (perk) {
          showToast(
            prev.language === 'zh'
              ? `解锁时代法则：${perk.eraNameZh} · ${perk.perkTitleZh}`
              : `Unlocked: ${perk.eraNameEn} · ${perk.perkTitleEn}`
          );
        }
      }

      return nextState;
    });
  };

  const handleStartEquipmentForge = () => {
    setState((prev) => {
      const forge = prev.equipmentForge;
      if (forge.isCrafting) return prev;

      const bp = getBlueprintById(forge.selectedBlueprintId);
      const check = canAffordEquipmentBlueprint(
        prev,
        bp,
        forge.selectedTier,
        forge.useRare
      );
      if (!check.unlocked || !check.hasMaterials || !check.hasRare) {
        return prev;
      }

      const nextResources = { ...prev.resources };
      for (const inp of bp.inputs) {
        const k = `${inp.itemKey}_${forge.selectedTier}`;
        nextResources[k] = (nextResources[k] || 0) - inp.amount;
      }
      if (forge.useRare) {
        nextResources[bp.rareMaterialId] =
          (nextResources[bp.rareMaterialId] || 0) - 1;
      }

      soundFX.playCraft(forge.useRare);

      return {
        ...prev,
        resources: nextResources,
        equipmentForge: {
          ...forge,
          isCrafting: true,
          progress: 0,
          craftingBlueprintId: bp.id,
          craftingTier: forge.selectedTier,
          craftingUseRare: forge.useRare,
        },
      };
    });
  };

  const handleTriggerUltimate = () => {
    soundFX.playCraft(true);
    setState((prev) => {
      if (prev.combat.ultimateCharge < 50) return prev;
      const pStats = getPlayerCombatStats(prev);
      const ultDmg = Math.round(
        pStats.attack * 12 * (prev.combat.ultimateCharge / 100)
      );
      const nextHp = Math.max(0, prev.combat.enemyHp - ultDmg);
      combatPulseRef.current.warriorAttackPulse = 1;
      combatPulseRef.current.hunterAttackPulse = 1;
      combatPulseRef.current.mageAttackPulse = 1;
      combatPulseRef.current.enemyHitPulse = 1;
      pushFloatingText(
        `合击 -${formatCompact(ultDmg)}`,
        '#f43f5e',
        'enemy',
        true
      );
      return {
        ...prev,
        combat: {
          ...prev.combat,
          ultimateCharge: 0,
          enemyHp: nextHp,
        },
      };
    });
  };

  const handleBuildMonumentStage = () => {
    soundFX.playCraft(true);
    setState((prev) => {
      const nextStageNum = (prev.progression.monumentStage + 1) as 1 | 2 | 3;
      if (nextStageNum > 3 || !canAffordMonumentStage(prev, nextStageNum)) {
        return prev;
      }
      const stg = MONUMENT_STAGES[nextStageNum - 1];
      const nextResources = { ...prev.resources };
      for (const inp of stg.inputs) {
        nextResources[inp.itemKey] =
          (nextResources[inp.itemKey] || 0) - inp.amount;
      }

      const completedAll = nextStageNum === 3;
      if (completedAll) {
        setTimeout(() => setShowVictoryModal(true), 250);
      } else {
        showToast(
          prev.language === 'zh'
            ? `摸鱼神碑 ${nextStageNum}/3 建造完成`
            : `Monument Stage ${nextStageNum}/3 Built`
        );
      }

      return {
        ...prev,
        gold: prev.gold - stg.goldCost,
        fishbones: prev.fishbones - stg.fishboneCost,
        resources: nextResources,
        cameraFocus: 'overview',
        progression: {
          ...prev.progression,
          monumentStage: nextStageNum as 0 | 1 | 2 | 3,
          victoryCompletedAt: completedAll
            ? prev.progression.victoryCompletedAt || Date.now()
            : prev.progression.victoryCompletedAt,
        },
      };
    });
  };

  const handleSelectCombatZone = (zone: Tier, stage: number) => {
    setState((prev) => {
      const eStats = getEnemyStatsForZoneStage(zone, stage);
      return {
        ...prev,
        combat: {
          ...prev.combat,
          currentZone: zone,
          stageInZone: stage,
          enemyCount: eStats.enemyCount,
          enemiesAlive: eStats.enemyCount,
          singleEnemyMaxHp: eStats.singleEnemyMaxHp,
          enemyHp: eStats.maxHp,
          enemyMaxHp: eStats.maxHp,
          enemyAttackTimer: 0,
        },
      };
    });
  };

  const handleEatFood = (tier: Tier) => {
    const foodKey = `food_${tier}`;
    setState((prev) => {
      if ((prev.resources[foodKey] || 0) <= 0) return prev;
      const pStats = getPlayerCombatStats(prev);
      soundFX.playUpgrade();
      return {
        ...prev,
        resources: {
          ...prev.resources,
          [foodKey]: prev.resources[foodKey] - 1,
        },
        combat: {
          ...prev.combat,
          playerHp: Math.min(
            pStats.maxHp,
            prev.combat.playerHp + Math.round(pStats.maxHp * 0.6)
          ),
          activeBuffTimer: 30,
          activeBuffTier: tier,
        },
      };
    });
  };

  const handleEquipItem = (item: EquipmentItem) => {
    soundFX.playCraft(item.isRare);
    setState((prev) => {
      const targetClass = item.requiredClass;
      const targetLoadout = { ...prev.classLoadouts[targetClass] };
      const currentEquipped = targetLoadout[item.slot];
      const nextBag = prev.equipmentBag.filter((i) => i.id !== item.id);
      if (currentEquipped) {
        nextBag.unshift(currentEquipped);
      }
      targetLoadout[item.slot] = item;

      const clsName =
        prev.language === 'zh'
          ? CLASS_CONFIG[targetClass].nameZh
          : CLASS_CONFIG[targetClass].nameEn;
      showToast(
        prev.language === 'zh'
          ? `已为【${clsName}】装备 ${item.nameZh}`
          : `Equipped ${item.nameEn} on [${clsName}]`
      );

      return {
        ...prev,
        progression: {
          ...prev.progression,
          unlockedHeroes: {
            ...prev.progression.unlockedHeroes,
            [targetClass]: true,
          },
          unlockedTabs: {
            ...prev.progression.unlockedTabs,
            combat: true,
          },
        },
        classLoadouts: {
          ...prev.classLoadouts,
          [targetClass]: targetLoadout,
        },
        equipmentBag: nextBag,
      };
    });
  };

  const handleSellItem = (itemId: string) => {
    soundFX.playUpgrade();
    setState((prev) => {
      const item = prev.equipmentBag.find((i) => i.id === itemId);
      if (!item) return prev;
      return {
        ...prev,
        gold: prev.gold + item.sellPrice,
        totalGoldEarned: prev.totalGoldEarned + item.sellPrice,
        equipmentBag: prev.equipmentBag.filter((i) => i.id !== itemId),
      };
    });
  };

  const handleSellAllBag = () => {
    soundFX.playUpgrade();
    setState((prev) => {
      const totalValue = prev.equipmentBag.reduce(
        (acc, item) => acc + item.sellPrice,
        0
      );
      return {
        ...prev,
        gold: prev.gold + totalValue,
        totalGoldEarned: prev.totalGoldEarned + totalValue,
        equipmentBag: [],
      };
    });
  };

  const handleEnhanceEquipped = (
    playerClass: PlayerClass,
    slot: 'weapon' | 'armor'
  ) => {
    soundFX.playUpgrade();
    setState((prev) => {
      const eq = prev.classLoadouts[playerClass][slot];
      if (!eq) return prev;
      const cost = Math.round(
        eq.sellPrice * 1.4 * Math.pow(1.45, eq.enhanceLevel)
      );
      if (prev.gold < cost) return prev;

      const enhancedItem: EquipmentItem = {
        ...eq,
        enhanceLevel: eq.enhanceLevel + 1,
      };

      return {
        ...prev,
        gold: prev.gold - cost,
        classLoadouts: {
          ...prev.classLoadouts,
          [playerClass]: {
            ...prev.classLoadouts[playerClass],
            [slot]: enhancedItem,
          },
        },
      };
    });
  };

  const handleUpdateAutoSell = (
    updater: (prev: AutoSellSettings) => AutoSellSettings
  ) => {
    setState((prev) => ({
      ...prev,
      autoSell: updater(prev.autoSell),
    }));
  };

  const handleSellResourceManual = (key: string) => {
    soundFX.playUpgrade();
    setState((prev) => {
      const have = Math.floor(prev.resources[key] || 0);
      if (have <= 0) return prev;
      const fb = getFishboneMultipliers(prev.fishboneUpgrades);
      const unitPrice = getResourceUnitPrice(key);
      const goldGain = Math.round(have * unitPrice * fb.shopPriceMult);

      return {
        ...prev,
        gold: prev.gold + goldGain,
        totalGoldEarned: prev.totalGoldEarned + goldGain,
        resources: {
          ...prev.resources,
          [key]: 0,
        },
      };
    });
  };

  const handleBuyFishboneUpgrade = (upgradeId: string) => {
    soundFX.playCraft(true);
    setState((prev) => {
      const def = FISHBONE_UPGRADES.find((u) => u.id === upgradeId);
      if (!def) return prev;
      const lv = prev.fishboneUpgrades[upgradeId] || 0;
      if (lv >= def.maxLevel) return prev;
      const cost = getFishboneUpgradeCost(upgradeId, lv);
      if (prev.fishbones < cost) return prev;

      return {
        ...prev,
        fishbones: prev.fishbones - cost,
        fishboneUpgrades: {
          ...prev.fishboneUpgrades,
          [upgradeId]: lv + 1,
        },
      };
    });
  };

  const handleSimulateOfflineHour = () => {
    soundFX.playCraft(true);
    const { nextState, report } = applyOfflineProgress(state, 3600);
    setState(nextState);
    setOfflineReport(report);
  };

  const isZh = state.language === 'zh';
  const pStats = getPlayerCombatStats(state);
  const era = getEraStatus(state);
  const eStats = getEnemyStatsForZoneStage(
    state.combat.currentZone,
    state.combat.stageInZone
  );
  const currentZoneInfo = COMBAT_ZONES[state.combat.currentZone - 1];

  return (
    <div className="relative w-screen h-screen overflow-hidden select-none bg-[#080b11]">
      {/* 100vw x 100vh Three.js 3D Viewport */}
      <ThreeViewport gameState={state} combatPulseRef={combatPulseRef} />

      {/* TOP BAR CONTRACT: 3 Zones */}
      <header className="fixed top-0 left-0 right-0 z-30 flex items-center justify-between gap-4 px-5 py-2.5 border-b border-slate-800/90 bg-[#0b111e]/95">
        <div className="flex items-center gap-3 shrink-0">
          <a
            href="#top"
            onClick={(e) => {
              e.preventDefault();
              setState((p) => ({ ...p, cameraFocus: 'overview' }));
            }}
            className="font-display text-base font-bold tracking-tight text-white whitespace-nowrap"
          >
            {isZh ? '摸鱼挂机' : 'Slacking Idle'}
          </a>
          <span className="hidden sm:inline-flex items-center gap-1 rounded border border-amber-500/40 bg-amber-500/10 px-2 py-0.5 font-mono text-[11px] font-semibold text-amber-300">
            <Crown className="w-3 h-3" />
            {isZh
              ? (ERA_PERKS[era.highestEraTier - 1] || ERA_PERKS[0]).eraNameZh
              : (ERA_PERKS[era.highestEraTier - 1] || ERA_PERKS[0]).eraNameEn}
          </span>
        </div>

        <nav className="hidden md:flex items-center gap-6 text-xs font-medium text-slate-300">
          {(
            [
              { id: 'overview', zh: '全景', en: 'Overview' },
              { id: 'gathering', zh: '采集区', en: 'Gathering' },
              { id: 'crafting', zh: '工坊区', en: 'Workshops' },
              { id: 'combat', zh: '战场', en: 'Arena' },
            ] as { id: CameraFocusMode; zh: string; en: string }[]
          ).map((cam) => (
            <button
              key={cam.id}
              onClick={() => setState((p) => ({ ...p, cameraFocus: cam.id }))}
              className={`transition-colors whitespace-nowrap shrink-0 ${
                state.cameraFocus === cam.id
                  ? 'text-amber-400 underline underline-offset-4 font-semibold'
                  : 'hover:text-white'
              }`}
            >
              {isZh ? cam.zh : cam.en}
            </button>
          ))}
        </nav>

        <div className="flex items-center gap-2.5 shrink-0">
          {/* Quick Overdrive Button when T8 unlocked */}
          {era.hasAstralOverdrive && (
            <button
              onClick={() =>
                setState((p) => ({
                  ...p,
                  progression: {
                    ...p.progression,
                    overdriveActive: !p.progression.overdriveActive,
                  },
                }))
              }
              className={`flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-bold transition-all ${
                state.progression.overdriveActive
                  ? 'bg-gradient-to-r from-amber-400 via-rose-500 to-purple-500 text-slate-950 shadow-[0_0_15px_rgba(245,158,11,0.5)]'
                  : 'border border-purple-500/60 bg-purple-950/60 text-purple-200 hover:bg-purple-900'
              }`}
            >
              <Flame className="w-3.5 h-3.5" />
              <span>
                {state.progression.overdriveActive
                  ? isZh
                    ? '超载 ×100'
                    : 'Overdrive ×100'
                  : isZh
                    ? '超载'
                    : 'Overdrive'}
              </span>
            </button>
          )}

          <div className="flex items-center gap-3.5 rounded-lg border border-slate-800 bg-slate-900/90 px-3 py-1 text-xs font-mono tabular-nums">
            <span
              className="flex items-center gap-1 text-amber-400 font-bold"
              title={isZh ? '核心货币：金币' : 'Core Currency: Gold'}
            >
              <Coins className="w-3.5 h-3.5" />
              {formatNumber(state.gold)}
            </span>
            {state.progression.unlockedTabs.altar && (
              <>
                <span className="text-slate-600">·</span>
                <span
                  className="flex items-center gap-1 text-cyan-300 font-bold"
                  title={
                    isZh ? '二级货币：鱼骨头' : 'Secondary Currency: Fishbones'
                  }
                >
                  <Fish className="w-3.5 h-3.5" />
                  {formatCompact(state.fishbones)}
                </span>
              </>
            )}
            <span className="hidden sm:inline text-slate-600">·</span>
            <span
              className="hidden sm:flex items-center gap-1 text-emerald-400 font-semibold"
              title={isZh ? '小队综合战力' : 'Squad Power'}
            >
              <Sword className="w-3.5 h-3.5" />
              {formatCompact(pStats.powerRating)}
            </span>
          </div>

          <button
            onClick={() =>
              setState((p) => ({
                ...p,
                language: p.language === 'zh' ? 'en' : 'zh',
              }))
            }
            className="flex items-center gap-1 rounded-lg border border-slate-700 bg-slate-800 px-2.5 py-1.5 text-xs font-semibold text-slate-200 hover:bg-slate-700 whitespace-nowrap shrink-0"
          >
            <Globe className="w-3.5 h-3.5" />
            <span>{isZh ? 'EN' : '中文'}</span>
          </button>

          <button
            onClick={() =>
              setState((p) => ({ ...p, soundEnabled: !p.soundEnabled }))
            }
            className="rounded-lg border border-slate-700 bg-slate-800 p-1.5 text-slate-300 hover:bg-slate-700 shrink-0"
            title={isZh ? '音效开关' : 'Toggle Audio'}
          >
            {state.soundEnabled ? (
              <Volume2 className="w-4 h-4 text-amber-400" />
            ) : (
              <VolumeX className="w-4 h-4 text-slate-500" />
            )}
          </button>

          <button
            onClick={() =>
              setOfflineReport({
                secondsElapsed: 0,
                goldEarned: 0,
                fishbonesEarned: 0,
                itemsGained: {},
                killsGained: 0,
              })
            }
            className="flex items-center gap-1 rounded-lg bg-amber-500 px-3 py-1.5 text-xs font-semibold text-slate-950 hover:bg-amber-400 transition-colors whitespace-nowrap shrink-0"
          >
            <Clock className="w-3.5 h-3.5" />
            <span>{isZh ? '存档' : 'Save'}</span>
          </button>
        </div>
      </header>

      {/* FLOATING ZONE & ENEMY STATUS OVERLAY (Top Center-Right over 3D Arena) */}
      {state.progression.unlockedTabs.combat && (
        <div className="pointer-events-none fixed top-14 right-5 z-20 hidden lg:flex flex-col items-end gap-1.5">
          <div className="rounded-lg border border-slate-800/80 bg-[#0b111e]/85 px-3.5 py-2 text-right">
            <div className="text-[11px] font-mono text-amber-400">
              ZONE {state.combat.currentZone} ·{' '}
              {isZh ? currentZoneInfo.nameZh : currentZoneInfo.nameEn} [
              {currentZoneInfo.rangeLabel}]
            </div>
            <div className="text-xs font-bold text-white mt-0.5">
              {isZh ? eStats.nameZh : eStats.nameEn}{' '}
              <span className="font-mono text-rose-400">
                ({state.combat.stageInZone}/10)
              </span>
            </div>
            <div className="w-48 h-1.5 rounded-full bg-slate-900 overflow-hidden mt-1.5">
              <div
                className="h-full bg-rose-500 transition-all duration-100"
                style={{
                  width: `${Math.min(100, (state.combat.enemyHp / Math.max(1, state.combat.enemyMaxHp)) * 100)}%`,
                }}
              />
            </div>
          </div>

          {/* Floating Damage / Loot Numbers */}
          <div className="flex flex-col items-end gap-1 pr-2">
            {floatingTexts.map((ft) => (
              <div
                key={ft.id}
                className={`font-mono font-bold tracking-tight transition-all ${
                  ft.isCrit ? 'text-sm scale-110' : 'text-xs'
                }`}
                style={{ color: ft.color }}
              >
                {ft.text}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TOAST NOTIFICATION */}
      {toastMsg && (
        <div className="fixed top-16 left-1/2 -translate-x-1/2 z-50 rounded-lg border border-amber-500/50 bg-[#0b111e]/95 px-4 py-2 text-xs font-semibold text-amber-300 shadow-lg">
          {toastMsg}
        </div>
      )}

      {/* BOTTOM CONTROL DOCK */}
      <ControlDock
        state={state}
        onToggleCollapse={() =>
          setState((p) => ({ ...p, dockCollapsed: !p.dockCollapsed }))
        }
        onSelectTab={(tab) => setState((p) => ({ ...p, activeTab: tab }))}
        onSelectGatheringTierTab={(tier) =>
          setState((p) => ({ ...p, activeGatheringTier: tier }))
        }
        onSelectCraftingTierTab={(tier) =>
          setState((p) => ({ ...p, activeCraftingTier: tier }))
        }
        onToggleActivityTier={handleToggleActivityTier}
        onUpgradeActivityTier={handleUpgradeActivityTier}
        onSelectForgeBlueprint={(blueprintId) =>
          setState((p) => ({
            ...p,
            equipmentForge: {
              ...p.equipmentForge,
              selectedBlueprintId: blueprintId,
            },
          }))
        }
        onSelectForgeTier={(tier) =>
          setState((p) => ({
            ...p,
            equipmentForge: {
              ...p.equipmentForge,
              selectedTier: tier,
            },
          }))
        }
        onToggleForgeRare={() =>
          setState((p) => ({
            ...p,
            equipmentForge: {
              ...p.equipmentForge,
              useRare: !p.equipmentForge.useRare,
            },
          }))
        }
        onStartEquipmentForge={handleStartEquipmentForge}
        onToggleAutoForge={() =>
          setState((p) => ({
            ...p,
            equipmentForge: {
              ...p.equipmentForge,
              autoForge: !p.equipmentForge.autoForge,
            },
          }))
        }
        onSelectCombatZone={handleSelectCombatZone}
        onToggleAutoAdvance={() =>
          setState((p) => ({
            ...p,
            combat: { ...p.combat, autoAdvance: !p.combat.autoAdvance },
          }))
        }
        onToggleCombat={() =>
          setState((p) => ({
            ...p,
            combat: { ...p.combat, isFighting: !p.combat.isFighting },
          }))
        }
        onTriggerUltimate={handleTriggerUltimate}
        onEatFood={handleEatFood}
        onSelectAutoFoodTier={(tier) =>
          setState((p) => ({
            ...p,
            combat: { ...p.combat, selectedFoodTier: tier },
          }))
        }
        onEquipItem={handleEquipItem}
        onSellItem={handleSellItem}
        onSellAllBag={handleSellAllBag}
        onEnhanceEquipped={handleEnhanceEquipped}
        onUpdateAutoSell={handleUpdateAutoSell}
        onSellResourceManual={handleSellResourceManual}
        onBuyFishboneUpgrade={handleBuyFishboneUpgrade}
        onToggleOverdrive={() =>
          setState((p) => ({
            ...p,
            progression: {
              ...p.progression,
              overdriveActive: !p.progression.overdriveActive,
            },
          }))
        }
        onBuildMonumentStage={handleBuildMonumentStage}
        onOpenVictoryModal={() => setShowVictoryModal(true)}
      />

      {/* VICTORY MODAL */}
      {showVictoryModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-amber-400/80 bg-[#0b111e] p-6 text-slate-100 shadow-2xl">
            <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
              <Crown className="w-5 h-5 text-amber-400" />
              <h2 className="font-display text-lg font-bold text-amber-300">
                {isZh ? '摸鱼神碑建成 · 通关留念' : 'Monument Complete'}
              </h2>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-3 rounded-xl border border-slate-800 bg-slate-900/90 p-4 font-mono text-xs">
              <div>
                <div className="text-slate-400">
                  {isZh ? '累计金币' : 'Total Gold'}
                </div>
                <div className="text-base font-bold text-amber-400 mt-0.5">
                  {formatCompact(state.totalGoldEarned)} G
                </div>
              </div>
              <div>
                <div className="text-slate-400">
                  {isZh ? '小队秒伤' : 'Squad DPS'}
                </div>
                <div className="text-base font-bold text-sky-400 mt-0.5">
                  {formatCompact(pStats.totalDps)} /s
                </div>
              </div>
              <div>
                <div className="text-slate-400">
                  {isZh ? '击败怪物' : 'Monsters Slain'}
                </div>
                <div className="text-base font-bold text-rose-400 mt-0.5">
                  {formatCompact(state.combat.totalKills)}
                </div>
              </div>
              <div>
                <div className="text-slate-400">
                  {isZh ? '已雇佣帮工' : 'NPCs Hired'}
                </div>
                <div className="text-base font-bold text-emerald-400 mt-0.5">
                  {era.totalHiredNpcs} / 64
                </div>
              </div>
            </div>

            <div className="mt-5 flex items-center justify-end gap-2.5">
              <button
                onClick={() => {
                  setState((p) => ({
                    ...p,
                    progression: {
                      ...p.progression,
                      overdriveActive: true,
                    },
                  }));
                  setShowVictoryModal(false);
                }}
                className="rounded-lg bg-amber-500 px-4 py-2 text-xs font-bold text-slate-950 hover:bg-amber-400"
              >
                {isZh ? '开启超载继续挂机' : 'Continue with Overdrive'}
              </button>
              <button
                onClick={() => setShowVictoryModal(false)}
                className="rounded-lg border border-slate-700 bg-slate-800 px-4 py-2 text-xs font-semibold text-slate-200 hover:bg-slate-700"
              >
                {isZh ? '关闭' : 'Close'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* OFFLINE PROGRESS & SAVE MANAGEMENT MODAL */}
      {offlineReport && (
        <OfflineModal
          report={offlineReport}
          language={state.language}
          onClose={() => setOfflineReport(null)}
          onSimulateHour={handleSimulateOfflineHour}
          onHardReset={() => {
            localStorage.removeItem(SAVE_STORAGE_KEY);
            setState(createInitialGameState());
            setOfflineReport(null);
            showToast(
              isZh ? '已重置本地存档！' : 'Local save reset complete!'
            );
          }}
        />
      )}
    </div>
  );
}
