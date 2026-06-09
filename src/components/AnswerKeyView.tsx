"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import type { Question } from "@/lib/types";
import QuestionView from "./QuestionView";

interface Props {
  title: string;
  subtitle?: string;
  questions: Question[];
  backHref?: string;
}

type Filter = "all" | "multiple_choice" | "short_answer";

export default function AnswerKeyView({
  title,
  subtitle,
  questions,
  backHref,
}: Props) {
  const [filter, setFilter] = useState<Filter>("all");

  const counts = useMemo(
    () => ({
      mc: questions.filter((q) => q.type === "multiple_choice").length,
      sa: questions.filter((q) => q.type === "short_answer").length,
    }),
    [questions],
  );

  const list = useMemo(
    () =>
      filter === "all"
        ? questions
        : questions.filter((q) => q.type === filter),
    [questions, filter],
  );

  const tabs: { key: Filter; label: string }[] = [
    { key: "all", label: `전체 ${questions.length}` },
    { key: "multiple_choice", label: `객관식 ${counts.mc}` },
    { key: "short_answer", label: `단답형 ${counts.sa}` },
  ];

  return (
    <div>
      <header className="mb-4 flex items-start justify-between gap-3">
        <div>
          <div className="text-xs font-semibold text-brand-600 tracking-wider">
            정답 · 해설 모아보기
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
          className="shrink-0 text-sm text-slate-500 hover:text-slate-700"
        >
          ← 나가기
        </Link>
      </header>

      <div className="mb-4 flex flex-wrap gap-2">
        {tabs.map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={() => setFilter(t.key)}
            className={`rounded-full px-3 py-1.5 text-xs font-semibold transition ${
              filter === t.key
                ? "bg-brand-600 text-white"
                : "bg-white border border-slate-200 text-slate-600 hover:border-brand-300"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="space-y-4">
        {list.map((q) => (
          <QuestionView
            key={q.id}
            question={q}
            immediate
            forceReveal
            answerKey
            initialAnswer={null}
            onAnswer={() => {}}
          />
        ))}
        {list.length === 0 && (
          <div className="bg-white border border-slate-200 rounded-2xl p-6 text-center text-slate-500">
            해당하는 문제가 없습니다.
          </div>
        )}
      </div>
    </div>
  );
}
