import Link from "next/link";
import { notFound } from "next/navigation";
import { exams, getExamByKey } from "@/lib/data";
import ExamSection from "@/components/ExamSection";

export function generateStaticParams() {
  return exams.map((e) => ({ examKey: e.key }));
}

interface PageProps {
  params: { examKey: string };
}

export default function ExamPage({ params }: PageProps) {
  const exam = getExamByKey(params.examKey);
  if (!exam) notFound();

  const accent = exam.key === "final" ? "emerald" : "brand";
  const totalQ = exam.chapters.reduce((s, ch) => s + ch.questions.length, 0);

  return (
    <main className="min-h-screen bg-[var(--color-bg)]">
      <header className="border-b border-slate-200 bg-white/70 backdrop-blur-sm sticky top-0 z-10">
        <div className="mx-auto max-w-5xl px-4 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 group">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center text-white font-bold text-sm">
              RA
            </div>
            <div>
              <div className="font-bold text-slate-900 text-sm sm:text-base group-hover:text-brand-700 transition">
                GMP CBT
              </div>
              <div className="text-[11px] text-slate-500">
                의료기기 RA 전문가 2급
              </div>
            </div>
          </Link>
          <div className="text-xs text-slate-500">
            {exam.name} · {totalQ}문제
          </div>
        </div>
      </header>

      <section className="mx-auto max-w-5xl px-4 py-8 sm:py-12">
        <Link
          href="/"
          className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700"
        >
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
          시험 선택으로
        </Link>

        <ExamSection exam={exam} accent={accent} />

        <div className="mt-12 pt-8 border-t border-slate-200 text-xs text-slate-500 text-center">
          <p>출제 기준: {exam.description}</p>
          <p className="mt-1">학습용 목적 · 실제 시험과 다를 수 있습니다</p>
        </div>
      </section>
    </main>
  );
}
