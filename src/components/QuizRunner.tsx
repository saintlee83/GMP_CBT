"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { AnswerRecord, Question } from "@/lib/types";
import QuestionView from "./QuestionView";
import QuizResult from "./QuizResult";
import ProgressBar from "./ProgressBar";
import {
  clearProgress,
  readProgress,
  updateBestScore,
  writeProgress,
} from "@/lib/storage";

interface Props {
  title: string;
  subtitle?: string;
  mode: "study" | "exam";
  questions: Question[];
  /** localStorage 에 진도를 저장할 키. 모의고사는 null */
  persistKey: string | null;
  backHref?: string;
  /** 재시도 시 호출 (같은 URL 유지한 채 상태 초기화) */
  resetKey?: string;
}

export default function QuizRunner({
  title,
  subtitle,
  mode,
  questions,
  persistKey,
  backHref,
  resetKey,
}: Props) {
  const total = questions.length;
  const [started] = useState(() => Date.now());
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, AnswerRecord>>({});
  const [finished, setFinished] = useState(false);
  const [stopTime, setStopTime] = useState<number | null>(null);
  const initialized = useRef(false);

  useEffect(() => {
    // 첫 마운트 시 localStorage에서 진도 복원 (study 모드만)
    if (initialized.current) return;
    initialized.current = true;
    if (mode !== "study" || !persistKey) return;
    const all = readProgress();
    const saved = all[persistKey];
    if (saved && saved.lastIndex >= 0 && saved.lastIndex < total) {
      setIndex(saved.lastIndex);
    }
  }, [mode, persistKey, total]);

  useEffect(() => {
    // resetKey가 바뀌면 초기화
    setIndex(0);
    setAnswers({});
    setFinished(false);
    setStopTime(null);
  }, [resetKey]);

  const current = questions[index];

  const answeredCount = Object.values(answers).filter((a) => a.answered).length;
  const correctCount = Object.values(answers).filter((a) => a.correct).length;

  const handleAnswer = useCallback(
    (qid: string, userAnswer: number | string, correct: boolean) => {
      setAnswers((prev) => ({
        ...prev,
        [qid]: { questionId: qid, userAnswer, correct, answered: true },
      }));

      if (mode === "study" && persistKey) {
        const updatedAnswers = {
          ...answers,
          [qid]: {
            questionId: qid,
            userAnswer,
            correct,
            answered: true,
          } as AnswerRecord,
        };
        const nextAnswered = Object.values(updatedAnswers).filter(
          (a) => a.answered,
        ).length;
        const nextCorrect = Object.values(updatedAnswers).filter(
          (a) => a.correct,
        ).length;
        writeProgress(persistKey, {
          lastIndex: index,
          answered: nextAnswered,
          correct: nextCorrect,
        });
      }
    },
    [mode, persistKey, answers, index],
  );

  const goPrev = () => {
    if (index > 0) {
      setIndex((i) => i - 1);
      if (mode === "study" && persistKey) {
        writeProgress(persistKey, {
          lastIndex: index - 1,
          answered: answeredCount,
          correct: correctCount,
        });
      }
    }
  };

  const goNext = () => {
    if (index < total - 1) {
      setIndex((i) => i + 1);
      if (mode === "study" && persistKey) {
        writeProgress(persistKey, {
          lastIndex: index + 1,
          answered: answeredCount,
          correct: correctCount,
        });
      }
    } else {
      // 마지막
      setFinished(true);
      const now = Date.now();
      setStopTime(now);
      if (persistKey) {
        updateBestScore(persistKey, {
          score: correctCount,
          total,
          durationMs: now - started,
          achievedAt: now,
        });
        if (mode === "study") {
          // study는 다시 풀 수 있게 진도 초기화
          clearProgress(persistKey);
        }
      }
    }
  };

  const handleSubmitExam = () => {
    setFinished(true);
    const now = Date.now();
    setStopTime(now);
    if (persistKey) {
      updateBestScore(persistKey, {
        score: correctCount,
        total,
        durationMs: now - started,
        achievedAt: now,
      });
    }
  };

  const handleRetry = () => {
    setIndex(0);
    setAnswers({});
    setFinished(false);
    setStopTime(null);
    if (persistKey) clearProgress(persistKey);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const duration = useMemo(
    () => (stopTime ?? Date.now()) - started,
    [stopTime, started],
  );

  if (total === 0) {
    return (
      <div className="bg-white border border-slate-200 rounded-2xl p-10 text-center text-slate-500">
        문제가 없습니다.
      </div>
    );
  }

  if (finished) {
    return (
      <div>
        <header className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900">
              {title}
            </h1>
            {subtitle && (
              <p className="text-sm text-slate-500 mt-0.5">{subtitle}</p>
            )}
          </div>
          <Link
            href={backHref || "/"}
            className="text-sm text-slate-500 hover:text-slate-700"
          >
            ← 홈
          </Link>
        </header>
        <QuizResult
          questions={questions}
          answers={answers}
          durationMs={duration}
          onRetry={handleRetry}
          backHref={backHref}
        />
      </div>
    );
  }

  return (
    <div>
      <header className="mb-4 flex items-center justify-between">
        <div>
          <div className="text-xs font-semibold text-brand-600 tracking-wider">
            {mode === "study" ? "학습 모드" : "시험 모드"}
          </div>
          <h1 className="text-lg sm:text-xl font-extrabold text-slate-900 mt-0.5">
            {title}
          </h1>
          {subtitle && (
            <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>
          )}
        </div>
        <Link
          href={backHref || "/"}
          className="text-sm text-slate-500 hover:text-slate-700"
        >
          ← 홈
        </Link>
      </header>

      <div className="mb-4">
        <ProgressBar
          current={index + 1}
          total={total}
          correct={mode === "study" ? correctCount : undefined}
        />
      </div>

      <QuestionView
        key={current.id}
        question={current}
        immediate={mode === "study"}
        initialAnswer={
          answers[current.id]?.userAnswer !== undefined
            ? answers[current.id].userAnswer
            : null
        }
        onAnswer={(val, correct) => handleAnswer(current.id, val, correct)}
      />

      <div className="mt-5 flex items-center gap-2">
        <button
          onClick={goPrev}
          disabled={index === 0}
          className="px-4 py-2.5 rounded-lg border border-slate-300 bg-white text-slate-700 font-semibold disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-50 text-sm"
        >
          이전
        </button>
        <button
          onClick={goNext}
          className="flex-1 px-4 py-2.5 rounded-lg bg-brand-600 text-white font-semibold hover:bg-brand-700 text-sm"
        >
          {index === total - 1 ? "제출하고 결과보기" : "다음"}
        </button>
        {mode === "exam" && index < total - 1 && (
          <button
            onClick={handleSubmitExam}
            className="px-4 py-2.5 rounded-lg border border-rose-200 bg-rose-50 text-rose-700 font-semibold hover:bg-rose-100 text-sm"
            title="현재까지 답한 문항으로 채점"
          >
            즉시 제출
          </button>
        )}
      </div>

      <div className="mt-4 text-center text-xs text-slate-400">
        답변 {answeredCount} / {total}
      </div>
    </div>
  );
}
