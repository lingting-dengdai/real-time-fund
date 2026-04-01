/**
 * 每日收益数据管理：{ [code]: Array<{ date: string, earnings: number, rate?: number|null }> }
 * - date: YYYY-MM-DD
 * - earnings: 当日收益（元）
 * - rate: 当日收益率（百分比数值，如 1.23 表示 +1.23%），可选
 */
import { isPlainObject, isString, isNumber } from 'lodash';

const STORAGE_KEY = 'fundDailyEarnings';

function normalizeItem(item) {
  if (!item || typeof item !== 'object') return null;
  const date = item.date;
  const earnings = item.earnings;
  const rate = item.rate;
  if (!isString(date) || !/^\d{4}-\d{2}-\d{2}$/.test(date)) return null;
  if (!isNumber(earnings) || !Number.isFinite(earnings)) return null;
  const normalizedRate =
    isNumber(rate) && Number.isFinite(rate) ? rate : null;
  return { date, earnings, rate: normalizedRate };
}

function getStored() {
  if (typeof window === 'undefined' || !window.localStorage) return {};
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : {};
    return isPlainObject(parsed) ? parsed : {};
  } catch {
    return {};
  }
}

function setStored(data) {
  if (typeof window === 'undefined' || !window.localStorage) return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (e) {
    console.warn('dailyEarnings persist failed', e);
  }
}

export function recordDailyEarnings(code, earnings, dateStr) {
  if (!isString(code) || !code) return getDailyEarnings(code);
  if (!isNumber(earnings) || !Number.isFinite(earnings)) return getDailyEarnings(code);
  if (!isString(dateStr) || !/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return getDailyEarnings(code);

  // 兼容老调用：recordDailyEarnings(code, earnings, dateStr, rate)
  const rate = arguments.length >= 4 ? arguments[3] : null;
  const normalizedRate = isNumber(rate) && Number.isFinite(rate) ? rate : null;

  const all = getStored();
  const list = Array.isArray(all[code]) ? all[code] : [];
  const existingIndex = list.findIndex(item => item.date === dateStr);

  const nextList = existingIndex >= 0
    ? list.map((item, i) => i === existingIndex ? { date: dateStr, earnings, rate: normalizedRate } : item)
    : [...list, { date: dateStr, earnings, rate: normalizedRate }];

  nextList.sort((a, b) => a.date.localeCompare(b.date));

  all[code] = nextList;
  setStored(all);
  return nextList.map(normalizeItem).filter(Boolean);
}

export function getDailyEarnings(code) {
  const all = getStored();
  const list = Array.isArray(all[code]) ? all[code] : [];
  return list.map(normalizeItem).filter(Boolean);
}

export function clearDailyEarnings(code) {
  const all = getStored();
  if (!(code in all)) return;
  const next = { ...all };
  delete next[code];
  setStored(next);
}

export function getAllDailyEarnings() {
  return getStored();
}
