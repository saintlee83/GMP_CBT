"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

interface Props {
  content: string;
  className?: string;
}

// 인접한 `> ㄱ. ...`, `> ㄴ. ...` 보기 항목이 한 문단으로 합쳐져 한 줄에 나오는
// 문제를 막기 위해, 보기 항목 직전 블록쿼트 라인에 마크다운 하드브레이크(`  `)를 추가.
const BOGI_LINE = /^>\s*[ㄱㄴㄷㄹㅁㅂㅅㅇㅈㅊㅋㅌㅍㅎ]\.\s+/;
const QUOTED_NON_EMPTY = /^>\s*\S/;

function insertBogiLineBreaks(content: string): string {
  const lines = content.split("\n");
  for (let i = 1; i < lines.length; i++) {
    if (!BOGI_LINE.test(lines[i])) continue;
    const prev = lines[i - 1];
    if (!QUOTED_NON_EMPTY.test(prev)) continue;
    if (prev.endsWith("  ")) continue;
    lines[i - 1] = prev.replace(/\s*$/, "  ");
  }
  return lines.join("\n");
}

export default function MarkdownView({ content, className }: Props) {
  return (
    <div className={className ?? "md-question"}>
      <ReactMarkdown remarkPlugins={[remarkGfm]}>
        {insertBogiLineBreaks(content)}
      </ReactMarkdown>
    </div>
  );
}
