import rawData from "@data/questions.json";
import type { Chapter, Question, QuestionsData } from "./types";

const data = rawData as QuestionsData;

export const chapters: Chapter[] = data.chapters;

export const allQuestions: Question[] = data.chapters.flatMap(
  (ch) => ch.questions,
);

const questionIndex = new Map<string, Question>(
  allQuestions.map((q) => [q.id, q]),
);

export function getQuestionById(id: string): Question | undefined {
  return questionIndex.get(id);
}

export function getChapterByKey(key: string): Chapter | undefined {
  return chapters.find((ch) => ch.key === key);
}

export function getQuestionsForChapter(key: string): Question[] {
  const ch = getChapterByKey(key);
  return ch ? ch.questions : [];
}

export function totalQuestionCount(): number {
  return allQuestions.length;
}

export function pickRandom<T>(arr: T[], count: number, seed?: number): T[] {
  const copy = [...arr];
  // seed 기반 간단 셔플 (Mulberry32)
  let rand = mulberry32(seed ?? Math.floor(Math.random() * 2 ** 32));
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy.slice(0, count);
}

function mulberry32(a: number) {
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
