import Link from "next/link";
import { chapters, exams, totalQuestionCount } from "@/lib/data";
import { accentForExam } from "@/lib/examTheme";
import ExamChooserCard from "@/components/ExamChooserCard";

export default function HomePage() {
  return (
    <main className="min-h-screen bg-[var(--color-bg)]">
      <header className="border-b border-slate-200 bg-white/70 backdrop-blur-sm sticky top-0 z-10">
        <div className="mx-auto max-w-5xl px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center text-white font-bold text-sm">
              RA
            </div>
            <div>
              <div className="font-bold text-slate-900 text-sm sm:text-base">
                GMP CBT
              </div>
              <div className="text-[11px] text-slate-500">
                의료기기 RA 전문가 2급
              </div>
            </div>
          </div>
          <div className="text-xs text-slate-500">
            총 {totalQuestionCount()}문제
          </div>
        </div>
      </header>

      <section className="mx-auto max-w-5xl px-4 py-8 sm:py-12">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 leading-tight">
          2021 의료기기 RA 전문가 2급
          <br />
          <span className="text-brand-600">CBT 문제풀이</span>
        </h1>
        <p className="mt-3 text-slate-600 text-sm sm:text-base max-w-2xl">
          {chapters.length}개 챕터, 총 {totalQuestionCount()}문항. 풀어볼{" "}
          <span className="font-semibold text-slate-700">시험범위</span>를
          선택하세요. 풀이 진도와 최고 점수는 브라우저에 자동 저장됩니다.
        </p>

        <h2 className="mt-8 mb-3 text-sm font-bold tracking-wide text-slate-500">
          시험범위 선택
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {exams.map((exam) => (
            <ExamChooserCard
              key={exam.key}
              exam={exam}
              accent={accentForExam(exam.key)}
            />
          ))}
        </div>

        <div className="mt-6 rounded-2xl border border-dashed border-slate-300 bg-white/50 p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div>
            <div className="text-sm font-semibold text-slate-700">
              전체 통합 모의고사
            </div>
            <div className="text-xs text-slate-500">
              중간고사 · 기말고사 전 범위에서 무작위 30문항
            </div>
          </div>
          <Link
            href="/quiz/exam?mode=random&limit=30"
            className="shrink-0 inline-flex items-center justify-center gap-1 rounded-lg bg-slate-800 text-white font-semibold px-4 py-2.5 text-sm hover:bg-slate-900 transition"
          >
            통합 모의고사 시작
            <svg
              aria-hidden="true"
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        </div>

        <div className="mt-12 pt-8 border-t border-slate-200 text-xs text-slate-500 text-center">
          <p>
            출제 기준: 2021 의료기기 RA 전문가 2급 핵심문제집 (PART 04
            품질관리(GMP) · PART 05 임상)
          </p>
          <p className="mt-1">학습용 목적 · 실제 시험과 다를 수 있습니다</p>
        </div>
      </section>
    </main>
  );
}
