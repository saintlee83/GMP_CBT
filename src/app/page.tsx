import Link from "next/link";
import { chapters, totalQuestionCount } from "@/lib/data";
import ChapterCard from "@/components/ChapterCard";

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
          <span className="text-brand-600">품질관리(GMP)</span> 핵심문제 CBT
        </h1>
        <p className="mt-3 text-slate-600 text-sm sm:text-base max-w-2xl">
          5개 챕터, 총 {totalQuestionCount()}문항. 챕터별 학습 모드로 즉시 해설을 확인하고,
          시험 모드로 실전처럼 연습해보세요. 풀이 진도는 브라우저에 자동 저장됩니다.
        </p>

        <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Link
            href="/quiz/exam?mode=random&limit=30"
            className="group bg-gradient-to-br from-brand-600 to-brand-800 text-white rounded-2xl p-5 hover:shadow-xl transition"
          >
            <div className="flex items-start justify-between">
              <div>
                <div className="text-xs tracking-wider text-brand-100 font-semibold">
                  모의고사 모드
                </div>
                <div className="text-lg font-bold mt-1">
                  랜덤 30문항 모의고사
                </div>
                <div className="text-xs text-brand-100 mt-2 opacity-90">
                  전 챕터에서 무작위 추출 · 종료 후 일괄 채점
                </div>
              </div>
              <svg
                className="w-6 h-6 opacity-80 group-hover:translate-x-1 transition"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </div>
          </Link>
          <Link
            href="/quiz/study?mode=all"
            className="group bg-white border border-slate-200 rounded-2xl p-5 hover:border-brand-400 hover:shadow-md transition"
          >
            <div className="flex items-start justify-between">
              <div>
                <div className="text-xs tracking-wider text-brand-600 font-semibold">
                  전체 학습
                </div>
                <div className="text-lg font-bold text-slate-800 mt-1">
                  전 챕터 순서대로 풀기
                </div>
                <div className="text-xs text-slate-500 mt-2">
                  164문항 전체 · 즉시 해설 확인
                </div>
              </div>
              <svg
                className="w-6 h-6 text-slate-400 group-hover:translate-x-1 transition"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </div>
          </Link>
        </div>

        <h2 className="mt-10 mb-4 text-lg font-bold text-slate-800">
          챕터별 학습
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {chapters.map((ch) => (
            <ChapterCard key={ch.key} chapter={ch} />
          ))}
        </div>

        <div className="mt-12 pt-8 border-t border-slate-200 text-xs text-slate-500 text-center">
          <p>
            출제 기준: 2021 의료기기 RA 전문가 2급 핵심문제집 PART 04 품질관리(GMP)
          </p>
          <p className="mt-1">학습용 목적 · 실제 시험과 다를 수 있습니다</p>
        </div>
      </section>
    </main>
  );
}
