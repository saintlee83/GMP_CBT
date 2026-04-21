"use client";

const PROGRESS_KEY = "gmp-cbt:progress";
const BEST_KEY = "gmp-cbt:best-scores";

export interface ChapterProgress {
  lastIndex: number;
  correct: number;
  answered: number;
}

export interface BestScore {
  score: number;
  total: number;
  durationMs: number;
  achievedAt: number;
}

export function readProgress(): Record<string, ChapterProgress> {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(PROGRESS_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

export function writeProgress(key: string, progress: ChapterProgress) {
  if (typeof window === "undefined") return;
  try {
    const all = readProgress();
    all[key] = progress;
    window.localStorage.setItem(PROGRESS_KEY, JSON.stringify(all));
  } catch {
    /* ignore */
  }
}

export function clearProgress(key: string) {
  if (typeof window === "undefined") return;
  try {
    const all = readProgress();
    delete all[key];
    window.localStorage.setItem(PROGRESS_KEY, JSON.stringify(all));
  } catch {
    /* ignore */
  }
}

export function readBestScores(): Record<string, BestScore> {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(BEST_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

export function updateBestScore(key: string, score: BestScore) {
  if (typeof window === "undefined") return;
  try {
    const all = readBestScores();
    const prev = all[key];
    if (!prev || score.score / score.total > prev.score / prev.total) {
      all[key] = score;
      window.localStorage.setItem(BEST_KEY, JSON.stringify(all));
    }
  } catch {
    /* ignore */
  }
}
