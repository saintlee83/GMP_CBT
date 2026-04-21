"use client";

import Link from "next/link";
import { useState } from "react";
import type { Question, AnswerRecord } from "@/lib/types";
import QuestionView from "./QuestionView";

interface Props {
  questions: Question[];
  answers: Record<string, AnswerRecord>;
  durationMs: number;
  onRetry: () => void;
  backHref?: string;
}

export default function QuizResult({
  questions,
  answers,
  durationMs,
  onRetry,
  backHref,
}: Props) {
  const [showOnlyWrong, setShowOnlyWrong] = useState(false);
  const answered = questions.filter((q) => answers[q.id]?.answered).length;
  const correct = questions.filter((q) => answers[q.id]?.correct).length;
  const total = questions.length;
  const pct = total === 0 ? 0 : Math.round((correct / total) * 100);

  const minutes = Math.floor(durationMs / 60000);
  const seconds = Math.floor((durationMs % 60000) / 1000);

  const list = showOnlyWrong
    ? questions.filter((q) => answers[q.id] && !answers[q.id].correct)
    : questions;

  return (
    <div className="space-y-6">
      <section className="bg-gradient-to-br from-brand-600 to-brand-800 text-white rounded-2xl p-6 sm:p-8 shadow-lg">
        <div className="text-sm font-semibold text-brand-100 tracking-wider">
          풀이 결과
        </div>
        <div className="mt-2 flex items-baseline gap-3">
          <span className="text-5xl sm:text-6xl font-extrabold">{pct}</span>
          <span className="text-xl opacity-80">점</span>
        </div>
        <div className="mt-3 grid grid-cols-3 gap-3 text-sm">
          <div>
            <div className="text-brand-100 text-xs">정답</div>
            <div className="text-lg font-bold">{correct} / {total}</div>
          </div>
          <div>
            <div className="text-brand-100 text-xs">답변</div>
            <div className="text-lg font-bold">{answered} / {total}</div>
          </div>
          <div>
            <div className="text-brand-100 text-xs">소요시간</div>
            <div className="text-lg font-bold">
              {minutes}분 {seconds}초
            </div>
          </div>
        </div>
      </section>

      <div className="flex flex-col sm:flex-row gap-2">
        <button
          onClick={onRetry}
          className="flex-1 bg-brand-600 text-white font-semibold py-3 rounded-xl hover:bg-brand-700 transition"
        >
          다시 풀기
        </button>
        <Link
          href={backHref || "/"}
          className="flex-1 text-center bg-white border border-slate-300 text-slate-700 font-semibold py-3 rounded-xl hover:bg-slate-50 transition"
        >
          홈으로
        </Link>
      </div>

      <div className="flex items-center justify-between pt-2">
        <h2 className="text-lg font-bold text-slate-800">문항별 해설</h2>
        <label className="flex items-center gap-2 text-sm text-slate-600 cursor-pointer">
          <input
            type="checkbox"
            checked={showOnlyWrong}
            onChange={(e) => setShowOnlyWrong(e.target.checked)}
            className="accent-brand-600"
          />
          오답만 보기
        </label>
      </div>

      <div className="space-y-4">
        {list.map((q) => (
          <QuestionView
            key={q.id}
            question={q}
            immediate
            forceReveal
            initialAnswer={answers[q.id]?.userAnswer ?? null}
            onAnswer={() => {}}
          />
        ))}
        {list.length === 0 && (
          <div className="bg-white border border-slate-200 rounded-2xl p-6 text-center text-slate-500">
            틀린 문항이 없습니다. 완벽합니다! 🎉
          </div>
        )}
      </div>
    </div>
  );
}
