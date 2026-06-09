import { notFound } from "next/navigation";
import QuizRunner from "@/components/QuizRunner";
import AnswerKeyView from "@/components/AnswerKeyView";
import {
  allQuestions,
  chapters,
  getChapterByKey,
  getExamByKey,
  getQuestionsForChapter,
  getQuestionsForExam,
  pickRandom,
} from "@/lib/data";

interface PageProps {
  params: { mode: string };
  searchParams: {
    chapter?: string;
    exam?: string;
    mode?: string;
    limit?: string;
    seed?: string;
  };
}

export function generateStaticParams() {
  return [{ mode: "study" }, { mode: "exam" }, { mode: "answers" }];
}

export default function QuizPage({ params, searchParams }: PageProps) {
  const modeParam = params.mode;
  if (modeParam !== "study" && modeParam !== "exam" && modeParam !== "answers") {
    notFound();
  }
  const isAnswers = modeParam === "answers";
  // 정답 보기는 채점/진도가 없으므로 study 로직을 빌려 문항 목록만 구성한다.
  const mode = (isAnswers ? "study" : modeParam) as "study" | "exam";

  const chapterKey = searchParams.chapter;
  const examKey = searchParams.exam;
  const subMode = searchParams.mode; // "random" | "all" | undefined

  let questions = [];
  let title = "";
  let subtitle = "";
  let persistKey: string | null = null;
  let resetKey = "";
  let backHref = "/"; // 풀이 종료 후 돌아갈 위치 (소속 시험 페이지)

  if (chapterKey) {
    const ch = getChapterByKey(chapterKey);
    if (!ch) notFound();
    questions = getQuestionsForChapter(chapterKey);
    title = `${ch.name}`;
    subtitle = `총 ${questions.length}문항`;
    persistKey = `${mode}:${ch.key}`;
    resetKey = `ch:${ch.key}:${mode}`;
    backHref = `/exam/${ch.exam}`;
  } else if (examKey) {
    // 시험 그룹(중간고사/기말고사) 범위
    const exam = getExamByKey(examKey);
    if (!exam) notFound();
    backHref = `/exam/${exam.key}`;
    const pool = getQuestionsForExam(examKey);
    if (subMode === "random") {
      const limit = Math.max(
        5,
        Math.min(pool.length, parseInt(searchParams.limit ?? "30", 10) || 30),
      );
      const seedNum =
        searchParams.seed && /^\d+$/.test(searchParams.seed)
          ? parseInt(searchParams.seed, 10)
          : Math.floor(Math.random() * 2 ** 31);
      questions = pickRandom(pool, limit, seedNum);
      title = `${exam.name} 모의고사 (랜덤 ${limit}문항)`;
      subtitle = `${exam.name} 시험범위에서 무작위 추출`;
      persistKey = null;
      resetKey = `exam-random:${examKey}:${limit}:${seedNum}`;
    } else {
      questions = pool;
      title = `${exam.name} 전체 학습`;
      subtitle = `${exam.chapters.length}개 챕터 · 총 ${questions.length}문항`;
      persistKey = `${mode}:EXAM:${exam.key}`;
      resetKey = `exam-all:${examKey}:${mode}`;
    }
  } else if (subMode === "random") {
    const limit = Math.max(
      5,
      Math.min(allQuestions.length, parseInt(searchParams.limit ?? "30", 10) || 30),
    );
    const seedNum =
      searchParams.seed && /^\d+$/.test(searchParams.seed)
        ? parseInt(searchParams.seed, 10)
        : Math.floor(Math.random() * 2 ** 31);
    questions = pickRandom(allQuestions, limit, seedNum);
    title = `통합 모의고사 (랜덤 ${limit}문항)`;
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

  if (isAnswers) {
    return (
      <main className="min-h-screen bg-[var(--color-bg)]">
        <div className="mx-auto max-w-3xl px-4 py-6 sm:py-10">
          <AnswerKeyView
            title={title}
            subtitle={subtitle}
            questions={questions}
            backHref={backHref}
          />
        </div>
      </main>
    );
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
          backHref={backHref}
          resetKey={resetKey}
        />
      </div>
    </main>
  );
}
