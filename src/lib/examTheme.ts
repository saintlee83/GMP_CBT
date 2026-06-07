import { exams } from "./data";

export type Accent = "brand" | "emerald";

const ACCENTS: Accent[] = ["brand", "emerald"];

/**
 * 시험 그룹별 강조 색상. exams 배열 내 위치를 기준으로 결정하므로
 * 홈(선택 카드)과 시험 전용 페이지에서 항상 동일한 색이 적용된다.
 */
export function accentForExam(key: string): Accent {
  const i = exams.findIndex((e) => e.key === key);
  return ACCENTS[(i < 0 ? 0 : i) % ACCENTS.length];
}
