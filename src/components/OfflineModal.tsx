import React from 'react';
import { getResourceName } from '../data/gameData';
import { Language, OfflineReport } from '../types/game';
import { formatCompact, formatDuration } from '../utils/format';

interface OfflineModalProps {
  report: OfflineReport | null;
  lang: Language;
  onClose: () => void;
  onSimulateHour: () => void;
  onExportSave: () => void;
  onResetSave: () => void;
}

export const OfflineModal: React.FC<OfflineModalProps> = ({
  report,
  lang,
  onClose,
  onSimulateHour,
  onExportSave,
  onResetSave,
}) => {
  if (!report) return null;

  const isZh = lang === 'zh';
  const itemKeys = Object.keys(report.itemsGained);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4">
      <div className="w-full max-w-lg rounded-xl border border-slate-700 bg-[#0f172a] p-6 text-slate-100 shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div>
            <h2 className="font-display text-xl font-bold text-amber-400">
              {isZh ? '离线挂机收益结算' : 'Offline Idle Gains Report'}
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              {isZh ? '挂机时长：' : 'Time Away: '}
              <span className="font-mono text-slate-200">
                {formatDuration(report.secondsElapsed, lang)}
              </span>
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg border border-slate-700 bg-slate-800 px-3 py-1.5 text-xs font-medium text-slate-300 hover:bg-slate-700"
          >
            {isZh ? '关闭' : 'Close'}
          </button>
        </div>

        <div className="mt-4 grid grid-cols-3 gap-3">
          <div className="rounded-lg border border-slate-800 bg-slate-900/90 p-3">
            <div className="text-xs text-slate-400">
              {isZh ? '获得金币' : 'Gold Earned'}
            </div>
            <div className="mt-1 font-mono text-base font-bold text-amber-400 tabular-nums">
              +{formatCompact(report.goldEarned)}
            </div>
          </div>
          <div className="rounded-lg border border-slate-800 bg-slate-900/90 p-3">
            <div className="text-xs text-slate-400">
              {isZh ? '获得鱼骨头' : 'Fishbones Earned'}
            </div>
            <div className="mt-1 font-mono text-base font-bold text-cyan-400 tabular-nums">
              +{formatCompact(report.fishbonesEarned)}
            </div>
          </div>
          <div className="rounded-lg border border-slate-800 bg-slate-900/90 p-3">
            <div className="text-xs text-slate-400">
              {isZh ? '击败怪物' : 'Monsters Slain'}
            </div>
            <div className="mt-1 font-mono text-base font-bold text-rose-400 tabular-nums">
              +{formatCompact(report.killsGained)}
            </div>
          </div>
        </div>

        <div className="mt-4">
          <div className="text-xs font-medium text-slate-400 mb-2">
            {isZh
              ? 'NPC 自动采集与加工战利品明细：'
              : 'Automated NPC & Combat Loot:'}
          </div>
          {itemKeys.length === 0 ? (
            <div className="rounded-lg border border-slate-800 bg-slate-900/60 p-4 text-center text-xs text-slate-400">
              {isZh
                ? '暂未雇佣采集/加工 NPC 或未开启自动战斗。雇佣 NPC 后离线可自动产出海量资源！'
                : 'Hire NPCs or enable Combat to accumulate resources while offline.'}
            </div>
          ) : (
            <div className="max-h-48 overflow-y-auto rounded-lg border border-slate-800 bg-slate-900/80 p-3 grid grid-cols-2 gap-2">
              {itemKeys.map((k) => (
                <div
                  key={k}
                  className="flex items-center justify-between text-xs border-b border-slate-800/70 pb-1"
                >
                  <span className="text-slate-300 truncate">
                    {getResourceName(k, lang)}
                  </span>
                  <span className="font-mono font-semibold text-emerald-400 tabular-nums">
                    +{formatCompact(report.itemsGained[k])}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="mt-5 flex flex-wrap items-center justify-between gap-2 border-t border-slate-800 pt-4">
          <div className="flex items-center gap-2">
            <button
              onClick={onSimulateHour}
              className="rounded-lg border border-amber-500/40 bg-amber-500/15 px-3 py-2 text-xs font-semibold text-amber-300 hover:bg-amber-500/25 transition-colors whitespace-nowrap"
            >
              {isZh ? '⚡ 模拟离线 1 小时' : '⚡ Simulate 1h Offline'}
            </button>
            <button
              onClick={onExportSave}
              className="rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-xs font-medium text-slate-300 hover:bg-slate-700 transition-colors whitespace-nowrap"
            >
              {isZh ? '复制存档码' : 'Copy Save'}
            </button>
            <button
              onClick={onResetSave}
              className="rounded-lg border border-rose-800/60 bg-rose-950/50 px-3 py-2 text-xs font-medium text-rose-300 hover:bg-rose-900/60 transition-colors whitespace-nowrap"
            >
              {isZh ? '重置存档' : 'Reset Save'}
            </button>
          </div>

          <button
            onClick={onClose}
            className="rounded-lg bg-emerald-600 px-5 py-2 text-xs font-semibold text-white hover:bg-emerald-500 transition-colors whitespace-nowrap"
          >
            {isZh ? '收下全部收益' : 'Claim All Rewards'}
          </button>
        </div>
      </div>
    </div>
  );
};
