"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import QuizRunner from "./QuizRunner";
import AnswerKeyView from "./AnswerKeyView";
import {
  allQuestions,
  chapters,
  getChapterByKey,
  getExamByKey,
  getQuestionsForChapter,
  getQuestionsForExam,
  pickRandom,
} from "@/lib/data";

interface Props {
  /** 경로 세그먼트 모드: "study" | "exam" | "answers" */
  pathMode: string;
}

/**
 * 문항 선택을 서버가 아니라 클라이언트(useSearchParams)에서 수행한다.
 * 서버 컴포넌트에서 searchParams 를 읽으면 정적 프리렌더/라우터 캐시 때문에
 * 링크 클릭(soft navigation) 시 ?exam=...&mode=random&limit=30 이 갱신되지 않아
 * '전체 문제'로 빠지는 문제가 있었다. 클라이언트에서 읽으면 항상 현재 URL이 반영된다.
 */
export default function QuizClient({ pathMode }: Props) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const sp = useSearchParams();
  // 랜덤 seed: URL에 없으면 마운트 시 1회 생성해 고정(재렌더에도 같은 추출 유지)
  const [fallbackSeed] = useState(() => Math.floor(Math.random() * 2 ** 31));

  const isAnswers = pathMode === "answers";
  const mode = (isAnswers ? "study" : pathMode) as "study" | "exam";

  const chapterKey = sp.get("chapter") || undefined;
  const examKey = sp.get("exam") || undefined;
  const subMode = sp.get("mode") || undefined; // "random" | "all" | undefined
  const limitParam = sp.get("limit") || undefined;
  const seedParam = sp.get("seed") || undefined;

  const view = useMemo(() => {
    let questions = allQuestions;
    let title = "";
    let subtitle = "";
    let persistKey: string | null = null;
    let resetKey = "";
    let backHref = "/";

    const seedNum =
      seedParam && /^\d+$/.test(seedParam)
        ? parseInt(seedParam, 10)
        : fallbackSeed;

    if (chapterKey) {
      const ch = getChapterByKey(chapterKey);
      if (ch) {
        questions = getQuestionsForChapter(chapterKey);
        title = ch.name;
        subtitle = `총 ${questions.length}문항`;
        persistKey = `${mode}:${ch.key}`;
        resetKey = `ch:${ch.key}:${mode}`;
        backHref = `/exam/${ch.exam}`;
      }
    } else if (examKey) {
      const exam = getExamByKey(examKey);
      if (exam) {
        backHref = `/exam/${exam.key}`;
        const pool = getQuestionsForExam(examKey);
        if (subMode === "random") {
          const limit = Math.max(
            5,
            Math.min(pool.length, parseInt(limitParam ?? "30", 10) || 30),
          );
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
      }
    } else if (subMode === "random") {
      const limit = Math.max(
        5,
        Math.min(allQuestions.length, parseInt(limitParam ?? "30", 10) || 30),
      );
      questions = pickRandom(allQuestions, limit, seedNum);
      title = `통합 모의고사 (랜덤 ${limit}문항)`;
      subtitle = "전 챕터에서 무작위 추출";
      persistKey = null;
      resetKey = `random:${limit}:${seedNum}`;
    } else {
      questions = allQuestions;
      title = `전체 학습 (${chapters.length}개 챕터)`;
      subtitle = `총 ${questions.length}문항`;
      persistKey = `${mode}:ALL`;
      resetKey = `all:${mode}`;
    }
    return { questions, title, subtitle, persistKey, resetKey, backHref };
  }, [chapterKey, examKey, subMode, limitParam, seedParam, fallbackSeed, mode]);

  // SSR/첫 렌더에는 seed가 확정되지 않아(하이드레이션 불일치 방지) 로딩만 표시
  if (!mounted) {
    return (
      <div className="py-20 text-center text-sm text-slate-400">불러오는 중…</div>
    );
  }

  if (isAnswers) {
    return (
      <AnswerKeyView
        title={view.title}
        subtitle={view.subtitle}
        questions={view.questions}
        backHref={view.backHref}
      />
    );
  }

  return (
    <QuizRunner
      title={view.title}
      subtitle={view.subtitle}
      mode={mode}
      questions={view.questions}
      persistKey={view.persistKey}
      backHref={view.backHref}
      resetKey={view.resetKey}
    />
  );
}
