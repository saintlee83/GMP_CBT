"use client";

import { useMemo, useState } from "react";
import type { Question } from "@/lib/types";
import MarkdownView from "./MarkdownView";
import OptionButton from "./OptionButton";

interface Props {
  question: Question;
  /** study: 즉시 채점, exam: 제출 전까지 숨김 */
  immediate: boolean;
  /** 이미 기록된 사용자 답(재진입용) */
  initialAnswer?: number | string | null;
  /** 해설을 무조건 보여줄지 (결과화면 리뷰용) */
  forceReveal?: boolean;
  onAnswer: (value: number | string, correct: boolean) => void;
}

export default function QuestionView({
  question,
  immediate,
  initialAnswer,
  forceReveal,
  onAnswer,
}: Props) {
  const [selected, setSelected] = useState<number | string | null>(
    initialAnswer ?? null,
  );
  const [shortInput, setShortInput] = useState<string>(
    typeof initialAnswer === "string" ? initialAnswer : "",
  );
  const [submitted, setSubmitted] = useState<boolean>(
    forceReveal || initialAnswer !== undefined && initialAnswer !== null,
  );

  const reveal = forceReveal || (immediate && submitted);

  const isCorrectNow = useMemo(() => {
    if (!submitted) return null;
    if (question.type === "multiple_choice") {
      return selected === question.correctAnswer;
    }
    const user = (shortInput || "").trim();
    const ans = String(question.correctAnswer || "").trim();
    if (!user || !ans) return false;
    // 단답형: 원문에 사용자가 입력한 키워드가 포함되거나 그 반대인 경우 정답으로 간주
    const norm = (s: string) => s.replace(/\s+/g, "").toLowerCase();
    const nu = norm(user);
    const na = norm(ans);
    return nu === na || na.includes(nu) || nu.includes(na);
  }, [submitted, selected, shortInput, question]);

  function handleSelect(optionNumber: number) {
    if (submitted) return;
    setSelected(optionNumber);
    if (immediate) {
      const correct = optionNumber === question.correctAnswer;
      setSubmitted(true);
      onAnswer(optionNumber, correct);
    } else {
      onAnswer(optionNumber, optionNumber === question.correctAnswer);
    }
  }

  function handleShortSubmit() {
    if (submitted) return;
    const user = shortInput.trim();
    if (!user) return;
    const ans = String(question.correctAnswer || "").trim();
    const norm = (s: string) => s.replace(/\s+/g, "").toLowerCase();
    const correct = norm(user) === norm(ans) || norm(ans).includes(norm(user));
    setSubmitted(true);
    onAnswer(user, correct);
  }

  const options = [1, 2, 3, 4, 5];
  const circle = ["①", "②", "③", "④", "⑤"];

  return (
    <article className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-7 shadow-sm">
      <div className="flex items-center gap-2 mb-3">
        <span className="inline-flex items-center gap-1 text-xs font-semibold text-brand-700 bg-brand-50 px-2 py-0.5 rounded-full">
          {question.chapter} · {question.index}번
        </span>
        <span className="text-xs text-slate-500">
          {question.type === "multiple_choice" ? "객관식" : "단답형"}
        </span>
      </div>

      <MarkdownView content={question.question} />

      {question.type === "multiple_choice" ? (
        <div className="mt-5 space-y-2">
          {options.map((n, idx) => {
            let state: "idle" | "correct" | "wrong" | "reveal" = "idle";
            if (reveal) {
              if (n === question.correctAnswer) {
                state = "correct";
              } else if (selected === n) {
                state = "wrong";
              }
            }
            return (
              <OptionButton
                key={n}
                label={circle[idx]}
                text={`보기 ${circle[idx]} 선택`}
                selected={selected === n}
                disabled={submitted}
                state={state}
                onClick={() => handleSelect(n)}
              />
            );
          })}
          <p className="mt-2 text-xs text-slate-500">
            ※ 보기의 상세 내용은 위 문제 본문에 표/목록으로 표시됩니다. 해당
            번호를 선택하세요.
          </p>
        </div>
      ) : (
        <div className="mt-5">
          <label className="block text-sm font-semibold text-slate-700 mb-2">
            정답 입력
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              value={shortInput}
              onChange={(e) => setShortInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleShortSubmit();
              }}
              disabled={submitted}
              placeholder="예: ISO 13485"
              className="flex-1 border-2 border-slate-200 focus:border-brand-500 rounded-lg px-3 py-2.5 text-sm disabled:bg-slate-50"
            />
            <button
              type="button"
              onClick={handleShortSubmit}
              disabled={submitted || !shortInput.trim()}
              className="bg-brand-600 text-white font-semibold px-4 rounded-lg hover:bg-brand-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-sm"
            >
              제출
            </button>
          </div>
        </div>
      )}

      {reveal && (
        <div
          className={`mt-5 rounded-xl border-2 p-4 ${
            isCorrectNow
              ? "border-emerald-200 bg-emerald-50"
              : "border-rose-200 bg-rose-50"
          }`}
        >
          <div className="flex items-center gap-2 mb-2">
            <span
              className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                isCorrectNow
                  ? "bg-emerald-500 text-white"
                  : "bg-rose-500 text-white"
              }`}
            >
              {isCorrectNow ? "정답" : "오답"}
            </span>
            <span className="text-sm font-semibold text-slate-800">
              정답: {question.correctAnswerLabel}
            </span>
          </div>
          {question.explanation && (
            <div className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">
              {question.explanation}
            </div>
          )}
        </div>
      )}
    </article>
  );
}
