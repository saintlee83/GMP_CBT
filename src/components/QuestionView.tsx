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

interface AnswerPart {
  label: string; // ㄱ, ㄴ, ㄷ, ...
  value: string; // 해당 파트의 정답 본문
}

// "ㄱ. 안전성, ㄴ. 유효성" / "ㄱ.1, ㄴ.1, ㄷ.3" 류 정답을 파트로 분해.
// 2개 이상 파트로 쪼개지는 경우에만 배열 반환, 그 외에는 null.
function parseAnswerParts(raw: string): AnswerPart[] | null {
  if (!/[ㄱㄴㄷㄹㅁㅂㅅㅇㅈㅊㅋㅌㅍㅎ]\./.test(raw)) return null;
  const segments = raw.split(",").map((s) => s.trim()).filter(Boolean);
  const parts: AnswerPart[] = [];
  for (const seg of segments) {
    const m = seg.match(/^([ㄱㄴㄷㄹㅁㅂㅅㅇㅈㅊㅋㅌㅍㅎ])\.\s*(.+)$/);
    if (!m) return null;
    parts.push({ label: m[1], value: m[2].trim() });
  }
  return parts.length >= 2 ? parts : null;
}

const normalize = (s: string) => s.replace(/\s+/g, "").toLowerCase();

function isPartMatch(user: string, expected: string): boolean {
  const u = normalize(user);
  const a = normalize(expected);
  if (!u || !a) return false;
  return u === a || a.includes(u) || u.includes(a);
}

export default function QuestionView({
  question,
  immediate,
  initialAnswer,
  forceReveal,
  onAnswer,
}: Props) {
  const answerParts = useMemo(
    () =>
      question.type === "short_answer"
        ? parseAnswerParts(String(question.correctAnswer))
        : null,
    [question],
  );

  const [selected, setSelected] = useState<number | string | null>(
    initialAnswer ?? null,
  );
  const [shortInput, setShortInput] = useState<string>(
    typeof initialAnswer === "string" && !answerParts ? initialAnswer : "",
  );
  const [multiInputs, setMultiInputs] = useState<string[]>(() => {
    if (!answerParts) return [];
    if (typeof initialAnswer === "string" && initialAnswer) {
      const saved = initialAnswer.split(",").map((s) => s.trim());
      return answerParts.map((_, i) => saved[i] ?? "");
    }
    return answerParts.map(() => "");
  });
  const [submitted, setSubmitted] = useState<boolean>(
    forceReveal || (initialAnswer !== undefined && initialAnswer !== null),
  );

  const reveal = forceReveal || (immediate && submitted);

  const isCorrectNow = useMemo(() => {
    if (!submitted) return null;
    if (question.type === "multiple_choice") {
      return selected === question.correctAnswer;
    }
    if (answerParts) {
      if (multiInputs.length !== answerParts.length) return false;
      return answerParts.every((p, i) =>
        isPartMatch(multiInputs[i] || "", p.value),
      );
    }
    return isPartMatch(shortInput, String(question.correctAnswer || ""));
  }, [submitted, selected, shortInput, multiInputs, answerParts, question]);

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
    if (answerParts) {
      const trimmed = multiInputs.map((s) => s.trim());
      if (trimmed.some((s) => !s)) return;
      const correct = answerParts.every((p, i) =>
        isPartMatch(trimmed[i], p.value),
      );
      setSubmitted(true);
      onAnswer(trimmed.join(", "), correct);
      return;
    }
    const user = shortInput.trim();
    if (!user) return;
    const correct = isPartMatch(user, String(question.correctAnswer || ""));
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
        <div className="mt-5 space-y-2.5">
          {options.map((n, idx) => {
            let state: "idle" | "correct" | "wrong" | "reveal" = "idle";
            if (reveal) {
              if (n === question.correctAnswer) {
                state = "correct";
              } else if (selected === n) {
                state = "wrong";
              }
            }
            const optionText =
              question.options?.[idx] ?? `보기 ${circle[idx]} 선택`;
            return (
              <OptionButton
                key={n}
                label={circle[idx]}
                text={optionText}
                selected={selected === n}
                disabled={submitted}
                state={state}
                onClick={() => handleSelect(n)}
              />
            );
          })}
        </div>
      ) : answerParts ? (
        <div className="mt-5">
          <label className="block text-sm font-semibold text-slate-700 mb-2">
            정답 입력 ({answerParts.length}개)
          </label>
          <div className="space-y-2">
            {answerParts.map((part, idx) => (
              <div key={idx} className="flex items-center gap-2">
                <span className="shrink-0 w-8 text-center text-sm font-semibold text-slate-600">
                  {part.label}.
                </span>
                <input
                  type="text"
                  value={multiInputs[idx] ?? ""}
                  onChange={(e) => {
                    const next = [...multiInputs];
                    next[idx] = e.target.value;
                    setMultiInputs(next);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleShortSubmit();
                  }}
                  disabled={submitted}
                  placeholder={`${part.label} 정답`}
                  className="flex-1 border-2 border-slate-200 focus:border-brand-500 rounded-lg px-3 py-2.5 text-sm disabled:bg-slate-50"
                />
              </div>
            ))}
          </div>
          <button
            type="button"
            onClick={handleShortSubmit}
            disabled={submitted || multiInputs.some((s) => !s.trim())}
            className="mt-3 w-full bg-brand-600 text-white font-semibold py-2.5 rounded-lg hover:bg-brand-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-sm"
          >
            제출
          </button>
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
            <MarkdownView
              content={question.explanation}
              className="md-question md-explanation text-sm text-slate-700"
            />
          )}
        </div>
      )}
    </article>
  );
}
