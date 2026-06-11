import { Suspense } from "react";
import { notFound } from "next/navigation";
import QuizClient from "@/components/QuizClient";

interface PageProps {
  params: { mode: string };
}

export function generateStaticParams() {
  return [{ mode: "study" }, { mode: "exam" }, { mode: "answers" }];
}

export default function QuizPage({ params }: PageProps) {
  const modeParam = params.mode;
  if (modeParam !== "study" && modeParam !== "exam" && modeParam !== "answers") {
    notFound();
  }

  // 문항 선택은 QuizClient(클라이언트)에서 useSearchParams 로 수행한다.
  // (서버에서 searchParams 를 읽으면 soft navigation 시 갱신되지 않는 문제가 있음)
  return (
    <main className="min-h-screen bg-[var(--color-bg)]">
      <div className="mx-auto max-w-3xl px-4 py-6 sm:py-10">
        <Suspense
          fallback={
            <div className="py-20 text-center text-sm text-slate-400">
              불러오는 중…
            </div>
          }
        >
          <QuizClient pathMode={modeParam} />
        </Suspense>
      </div>
    </main>
  );
}
