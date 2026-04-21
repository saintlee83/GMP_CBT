export type QuestionType = "multiple_choice" | "short_answer";

export interface Question {
  id: string;
  chapter: string;
  number: number;
  index: number;
  type: QuestionType;
  question: string;
  correctAnswer: number | string;
  correctAnswerLabel: string;
  explanation: string;
}

export interface Chapter {
  key: string;
  number: number;
  name: string;
  questions: Question[];
}

export interface QuestionsData {
  chapters: Chapter[];
}

export type QuizMode =
  | "study" // 챕터별 학습 모드 (즉시 피드백)
  | "exam"; // 모의고사 모드 (끝까지 풀고 결과)

export interface QuizConfig {
  mode: QuizMode;
  chapterKey?: string; // 없으면 전체
  shuffle: boolean;
  limit?: number;
}

export interface AnswerRecord {
  questionId: string;
  userAnswer: number | string | null;
  correct: boolean;
  answered: boolean;
}

export interface QuizSessionState {
  config: QuizConfig;
  questionIds: string[];
  currentIndex: number;
  answers: Record<string, AnswerRecord>;
  startedAt: number;
  submittedAt?: number;
}
