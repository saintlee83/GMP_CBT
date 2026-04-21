"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { Chapter } from "@/lib/types";
import { readBestScores, readProgress } from "@/lib/storage";

interface Props {
  chapter: Chapter;
}

export default function ChapterCard({ chapter }: Props) {
  const [progressLabel, setProgressLabel] = useState<string>("");
  const [bestLabel, setBestLabel] = useState<string>("");

  useEffect(() => {
    const p = readProgress()[`study:${chapter.key}`];
    if (p) {
      setProgressLabel(
        `이어풀기 (${p.lastIndex + 1}/${chapter.questions.length})`,
      );
    }
    const b = readBestScores()[`study:${chapter.key}`];
    if (b) {
      const pct = Math.round((b.score / b.total) * 100);
      setBestLabel(`최고 정답률 ${pct}%`);
    }
  }, [chapter]);

  return (
    <div className="group bg-white rounded-2xl p-5 border border-slate-200 hover:border-brand-400 hover:shadow-md transition flex flex-col gap-3">
      <div>
        <div className="text-xs font-semibold text-brand-600 tracking-wide">
          CHAPTER {String(chapter.number).padStart(2, "0")}
        </div>
        <h2 className="text-lg font-bold text-slate-800 mt-1">
          {chapter.name}
        </h2>
      </div>
      <div className="flex items-center gap-3 text-sm text-slate-500">
        <span className="inline-flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-brand-500" />
          {chapter.questions.length}문제
        </span>
        {bestLabel && (
          <span className="text-emerald-600 font-medium">{bestLabel}</span>
        )}
      </div>
      <div className="mt-auto flex flex-col sm:flex-row gap-2 pt-2">
        <Link
          href={`/quiz/study?chapter=${chapter.key}`}
          className="flex-1 text-center bg-brand-600 text-white font-semibold py-2.5 rounded-lg hover:bg-brand-700 transition text-sm"
        >
          {progressLabel || "학습하기"}
        </Link>
        <Link
          href={`/quiz/exam?chapter=${chapter.key}`}
          className="flex-1 text-center bg-slate-100 text-slate-700 font-semibold py-2.5 rounded-lg hover:bg-slate-200 transition text-sm"
        >
          시험모드
        </Link>
      </div>
    </div>
  );
}
