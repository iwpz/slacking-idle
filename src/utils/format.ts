import { Language } from '../types/game';

const EN_SUFFIXES = [
  '',
  'K',
  'M',
  'B',
  'T',
  'Qa',
  'Qi',
  'Sx',
  'Sp',
  'Oc',
  'No',
  'Dc',
];

/**
 * Formats numbers cleanly across 8+ 3-digit magnitude brackets (1 to 10^27+).
 * Supports clear display for the 3-order-of-magnitude combat zones.
 */
export function formatNumber(val: number, decimals = 2): string {
  if (!Number.isFinite(val)) return '∞';
  const sign = val < 0 ? '-' : '';
  const abs = Math.abs(val);

  if (abs < 1000) {
    if (Number.isInteger(abs)) return `${sign}${abs}`;
    return `${sign}${abs.toFixed(abs < 10 ? decimals : 1).replace(/\.0+$/, '')}`;
  }

  if (abs < 1_000_000) {
    return `${sign}${Math.floor(abs).toLocaleString('en-US')}`;
  }

  const tier = Math.floor(Math.log10(abs) / 3);
  if (tier < EN_SUFFIXES.length) {
    const scale = Math.pow(10, tier * 3);
    const scaled = abs / scale;
    const formatted =
      scaled >= 100
        ? scaled.toFixed(1)
        : scaled >= 10
          ? scaled.toFixed(2)
          : scaled.toFixed(2);
    return `${sign}${formatted}${EN_SUFFIXES[tier]} (10^${tier * 3})`;
  }

  return `${sign}${abs.toExponential(2)}`;
}

/**
 * Compact number formatter for tight UI badges and tables.
 */
export function formatCompact(val: number): string {
  if (!Number.isFinite(val)) return '∞';
  const sign = val < 0 ? '-' : '';
  const abs = Math.abs(val);

  if (abs < 1000) {
    if (Number.isInteger(abs)) return `${sign}${abs}`;
    return `${sign}${abs.toFixed(1).replace(/\.0$/, '')}`;
  }

  const tier = Math.floor(Math.log10(abs) / 3);
  if (tier < EN_SUFFIXES.length) {
    const scale = Math.pow(10, tier * 3);
    const scaled = abs / scale;
    const formatted =
      scaled >= 100
        ? scaled.toFixed(1)
        : scaled >= 10
          ? scaled.toFixed(2)
          : scaled.toFixed(2);
    return `${sign}${formatted}${EN_SUFFIXES[tier]}`;
  }

  return `${sign}${abs.toExponential(2)}`;
}

export function formatDuration(seconds: number, lang: Language): string {
  if (seconds < 60) {
    return `${seconds.toFixed(1)}s`;
  }
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  if (lang === 'zh') {
    if (hrs > 0) return `${hrs}小时 ${mins}分 ${secs}秒`;
    return `${mins}分 ${secs}秒`;
  } else {
    if (hrs > 0) return `${hrs}h ${mins}m ${secs}s`;
    return `${mins}m ${secs}s`;
  }
}
