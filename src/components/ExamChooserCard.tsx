import Link from "next/link";
import type { ExamGroup } from "@/lib/types";

interface Props {
  exam: ExamGroup;
  accent?: "brand" | "emerald";
}

const ACCENTS = {
  brand: {
    badge: "bg-brand-50 text-brand-700",
    dot: "bg-brand-500",
    ring: "hover:border-brand-400",
    arrow: "text-brand-500",
  },
  emerald: {
    badge: "bg-emerald-50 text-emerald-700",
    dot: "bg-emerald-500",
    ring: "hover:border-emerald-400",
    arrow: "text-emerald-500",
  },
} as const;

export default function ExamChooserCard({ exam, accent = "brand" }: Props) {
  const c = ACCENTS[accent];
  const totalQ = exam.chapters.reduce((s, ch) => s + ch.questions.length, 0);

  return (
    <Link
      href={`/exam/${exam.key}`}
      aria-label={`${exam.name} 시험범위로 이동`}
      className={`group bg-white rounded-2xl p-6 border border-slate-200 ${c.ring} hover:shadow-lg transition flex flex-col gap-3`}
    >
      <div className="flex items-center justify-between">
        <span
          className={`inline-flex items-center rounded-full px-3 py-1 text-sm font-bold ${c.badge}`}
        >
          {exam.name}
        </span>
        <svg
          aria-hidden="true"
          className={`w-6 h-6 ${c.arrow} group-hover:translate-x-1 transition`}
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
        </svg>
      </div>

      <div>
        <div className="text-lg font-extrabold text-slate-900">
          {exam.name} 시험범위
        </div>
        {exam.description && (
          <p className="mt-1 text-sm text-slate-600">{exam.description}</p>
        )}
      </div>

      <div className="text-xs text-slate-500">
        {exam.chapters.length}개 챕터 · 총 {totalQ}문항
      </div>

      <ul className="mt-auto flex flex-wrap gap-1.5 pt-1">
        {exam.chapters.map((ch) => (
          <li
            key={ch.key}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-2 py-1 text-[11px] text-slate-600"
          >
            <span className={`w-1.5 h-1.5 rounded-full ${c.dot}`} />
            {ch.name}
            <span className="text-slate-400">({ch.questions.length})</span>
          </li>
        ))}
      </ul>
    </Link>
  );
}
