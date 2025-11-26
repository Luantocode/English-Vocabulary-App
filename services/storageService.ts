import { SRSItem } from '../types';

const STORAGE_KEY = 'lexiflow_srs_data';

export const getSRSData = (): SRSItem[] => {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch (e) {
    console.error("Failed to load SRS data", e);
    return [];
  }
};

export const getDueWords = (): SRSItem[] => {
  const data = getSRSData();
  const now = Date.now();
  return data.filter(item => item.nextReviewDate <= now);
};

export const saveSRSResult = (term: string, isCorrect: boolean) => {
  const data = getSRSData();
  const existingIndex = data.findIndex(item => item.term.toLowerCase() === term.toLowerCase());
  
  let item: SRSItem;

  if (existingIndex >= 0) {
    item = data[existingIndex];
  } else {
    item = {
      term,
      interval: 0,
      nextReviewDate: Date.now(),
      easeFactor: 2.5
    };
  }

  // Simple Spaced Repetition Algorithm (Simplified SuperMemo-2)
  if (isCorrect) {
    if (item.interval === 0) {
      item.interval = 1;
    } else if (item.interval === 1) {
      item.interval = 3;
    } else {
      item.interval = Math.ceil(item.interval * item.easeFactor);
    }
    // Ease factor adjustment slightly
    item.easeFactor = item.easeFactor + 0.1;
  } else {
    item.interval = 0; // Reset to today
    item.easeFactor = Math.max(1.3, item.easeFactor - 0.2);
  }

  item.nextReviewDate = Date.now() + (item.interval * 24 * 60 * 60 * 1000);

  if (existingIndex >= 0) {
    data[existingIndex] = item;
  } else {
    data.push(item);
  }

  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
};