import Link from "next/link";
import type { ExamGroup } from "@/lib/types";
import ChapterCard from "./ChapterCard";

interface Props {
  exam: ExamGroup;
  /** 강조 색상 톤: midterm=brand, final=emerald */
  accent?: "brand" | "emerald";
}

const ACCENTS = {
  brand: {
    badge: "bg-brand-50 text-brand-700",
    dot: "bg-brand-500",
    cta: "from-brand-600 to-brand-800",
    ctaText: "text-brand-100",
    ring: "border-brand-200",
  },
  emerald: {
    badge: "bg-emerald-50 text-emerald-700",
    dot: "bg-emerald-500",
    cta: "from-emerald-600 to-emerald-800",
    ctaText: "text-emerald-100",
    ring: "border-emerald-200",
  },
} as const;

export default function ExamSection({ exam, accent = "brand" }: Props) {
  const c = ACCENTS[accent];
  const totalQ = exam.chapters.reduce((s, ch) => s + ch.questions.length, 0);
  const randomLimit = Math.min(30, totalQ);

  return (
    <section className="mt-5">
      <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
        <span
          className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-bold ${c.badge}`}
        >
          {exam.name}
        </span>
        <h1 className="text-2xl font-extrabold text-slate-900">
          {exam.name} 시험범위
        </h1>
        <span className="text-xs text-slate-500">
          {exam.chapters.length}개 챕터 · 총 {totalQ}문항
        </span>
      </div>

      {exam.description && (
        <p className="mt-1.5 text-sm text-slate-600">{exam.description}</p>
      )}

      {/* 시험범위 챕터 목록 */}
      <ul className="mt-3 flex flex-wrap gap-2">
        {exam.chapters.map((ch) => (
          <li
            key={ch.key}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs text-slate-600"
          >
            <span className={`w-1.5 h-1.5 rounded-full ${c.dot}`} />
            {ch.name}
            <span className="text-slate-400">({ch.questions.length})</span>
          </li>
        ))}
      </ul>

      {/* 시험 그룹 단위 액션 */}
      <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Link
          href={`/quiz/exam?exam=${exam.key}&mode=random&limit=${randomLimit}`}
          className={`group bg-gradient-to-br ${c.cta} text-white rounded-2xl p-5 hover:shadow-xl transition`}
        >
          <div className="flex items-start justify-between">
            <div>
              <div
                className={`text-xs tracking-wider ${c.ctaText} font-semibold`}
              >
                모의고사 모드
              </div>
              <div className="text-lg font-bold mt-1">
                {exam.name} 랜덤 {randomLimit}문항
              </div>
              <div className={`text-xs ${c.ctaText} mt-2 opacity-90`}>
                {exam.name} 범위에서 무작위 추출 · 종료 후 일괄 채점
              </div>
            </div>
            <Arrow className="opacity-80" />
          </div>
        </Link>
        <Link
          href={`/quiz/study?exam=${exam.key}`}
          className={`group bg-white border ${c.ring} rounded-2xl p-5 hover:shadow-md transition`}
        >
          <div className="flex items-start justify-between">
            <div>
              <div className="text-xs tracking-wider text-slate-500 font-semibold">
                전체 학습
              </div>
              <div className="text-lg font-bold text-slate-800 mt-1">
                {exam.name} 전 챕터 순서대로
              </div>
              <div className="text-xs text-slate-500 mt-2">
                {totalQ}문항 전체 · 즉시 해설 확인
              </div>
            </div>
            <Arrow className="text-slate-400" />
          </div>
        </Link>
      </div>

      {/* 챕터별 카드 */}
      <div className="mt-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {exam.chapters.map((ch) => (
          <ChapterCard key={ch.key} chapter={ch} />
        ))}
      </div>
    </section>
  );
}

function Arrow({ className = "" }: { className?: string }) {
  return (
    <svg
      aria-hidden="true"
      className={`w-6 h-6 group-hover:translate-x-1 transition ${className}`}
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      viewBox="0 0 24 24"
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
    </svg>
  );
}
