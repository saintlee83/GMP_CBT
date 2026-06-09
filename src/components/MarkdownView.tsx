"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

interface Props {
  content: string;
  className?: string;
}

// 블록쿼트(〈보기〉 등) 안의 인접한 줄들이 한 문단으로 합쳐져 한 줄에 나오는 문제를 막기 위해,
// 표(table) 행을 제외한 모든 인접 블록쿼트 줄 뒤에 마크다운 하드브레이크(`  `)를 추가한다.
// 보기 항목 마커가 ㄱ. / 1) / • 등 무엇이든(또는 단순 문장이어도) 줄바꿈이 유지된다.
const QUOTED_NON_EMPTY = /^>\s*\S/;
const QUOTED_TABLE = /^>\s*\|/;

function insertBogiLineBreaks(content: string): string {
  const lines = content.split("\n");
  for (let i = 0; i < lines.length - 1; i++) {
    if (!QUOTED_NON_EMPTY.test(lines[i])) continue;
    if (!QUOTED_NON_EMPTY.test(lines[i + 1])) continue;
    // 표 행에 하드브레이크를 넣으면 표 파싱이 깨지므로 제외
    if (QUOTED_TABLE.test(lines[i]) || QUOTED_TABLE.test(lines[i + 1])) continue;
    if (lines[i].endsWith("  ")) continue;
    lines[i] = lines[i].replace(/\s*$/, "  ");
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
