import { notFound } from "next/navigation";
import QuizRunner from "@/components/QuizRunner";
import {
  allQuestions,
  chapters,
  getChapterByKey,
  getQuestionsForChapter,
  pickRandom,
} from "@/lib/data";

interface PageProps {
  params: { mode: string };
  searchParams: {
    chapter?: string;
    mode?: string;
    limit?: string;
    seed?: string;
  };
}

export function generateStaticParams() {
  return [{ mode: "study" }, { mode: "exam" }];
}

export default function QuizPage({ params, searchParams }: PageProps) {
  const modeParam = params.mode;
  if (modeParam !== "study" && modeParam !== "exam") {
    notFound();
  }
  const mode = modeParam as "study" | "exam";

  const chapterKey = searchParams.chapter;
  const subMode = searchParams.mode; // "random" | "all" | undefined

  let questions = [];
  let title = "";
  let subtitle = "";
  let persistKey: string | null = null;
  let resetKey = "";

  if (chapterKey) {
    const ch = getChapterByKey(chapterKey);
    if (!ch) notFound();
    questions = getQuestionsForChapter(chapterKey);
    title = `${ch.key}. ${ch.name}`;
    subtitle = `총 ${questions.length}문항`;
    persistKey = `${mode}:${ch.key}`;
    resetKey = `ch:${ch.key}:${mode}`;
  } else if (subMode === "random") {
    const limit = Math.max(
      5,
      Math.min(164, parseInt(searchParams.limit ?? "30", 10) || 30),
    );
    const seedNum =
      searchParams.seed && /^\d+$/.test(searchParams.seed)
        ? parseInt(searchParams.seed, 10)
        : Math.floor(Math.random() * 2 ** 31);
    questions = pickRandom(allQuestions, limit, seedNum);
    title = `모의고사 (랜덤 ${limit}문항)`;
    subtitle = `전 챕터에서 무작위 추출`;
    persistKey = null; // 모의고사 진도 저장 안 함 (최고 점수만 저장)
    resetKey = `random:${limit}:${seedNum}`;
  } else {
    // 전체 순차
    questions = allQuestions;
    title = `전체 학습 (${chapters.length}개 챕터)`;
    subtitle = `총 ${questions.length}문항`;
    persistKey = `${mode}:ALL`;
    resetKey = `all:${mode}`;
  }

  return (
    <main className="min-h-screen bg-[var(--color-bg)]">
      <div className="mx-auto max-w-3xl px-4 py-6 sm:py-10">
        <QuizRunner
          title={title}
          subtitle={subtitle}
          mode={mode}
          questions={questions}
          persistKey={persistKey}
          backHref="/"
          resetKey={resetKey}
        />
      </div>
    </main>
  );
}
