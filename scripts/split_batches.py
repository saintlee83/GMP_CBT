#!/usr/bin/env python3
"""
검수된 GMP_문제_전체통합.md 를 5개 배치 파일로 분리.

각 배치의 종료 지점은 '**배치 N 누계:' 마커로 식별하며,
'**배치 1+2+... 총계:' 합계 라인이 같이 있으면 그 라인까지 포함한다.
다음 배치의 시작 지점은 그 다음 줄부터(처음 '## CHAPTER'가 나올 때까지 비어있는 줄은 버림).
"""
import os
import re

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = os.path.join(ROOT, "problems", "GMP_문제_전체통합.md")
TITLE_BASE = "# 2021 의료기기 RA 전문가 2급 핵심문제집 PART 04 품질관리(GMP)"


def main() -> None:
    with open(SRC, "r", encoding="utf-8") as f:
        lines = f.readlines()

    # 배치 N 누계 라인 위치(1-indexed) 찾기
    batch_end_lines: list[int] = []
    for idx, line in enumerate(lines, start=1):
        if re.match(r"^\*\*배치 \d+ 누계:", line):
            batch_end_lines.append(idx)
    assert len(batch_end_lines) == 5, f"expected 5 batches, got {len(batch_end_lines)}"

    # 각 배치의 끝 라인을 확장: 바로 다음 라인이 '**배치 ... 총계:' 면 그 라인까지 포함
    extended_ends: list[int] = []
    for end in batch_end_lines:
        next_idx = end + 1
        # 1개까지는 같이 묶일 수 있음
        if next_idx <= len(lines) and lines[next_idx - 1].startswith("**배치") and "총계" in lines[next_idx - 1]:
            extended_ends.append(next_idx)
        else:
            extended_ends.append(end)

    # 각 배치의 시작/끝 범위(1-indexed, inclusive) 계산
    ranges: list[tuple[int, int]] = []
    prev_end = 0
    for end in extended_ends:
        start = prev_end + 1
        # 다음 배치의 '## CHAPTER' 헤더가 나오기 전의 공백 라인을 건너뛰는 대신,
        # '## CHAPTER' 또는 '### Q' 가 나타나는 최초 라인부터 시작.
        while start <= end:
            s = lines[start - 1].rstrip("\n")
            if s.strip() == "":
                start += 1
                continue
            break
        ranges.append((start, end))
        prev_end = end

    # 배치별 파일로 작성
    for i, (start, end) in enumerate(ranges, start=1):
        dst = os.path.join(ROOT, "problems", f"GMP_문제_배치{i}.md")
        body = "".join(lines[start - 1:end])

        # 제목 라인 선행 처리
        # 배치1: 원본 맨 위 '# 2021 ...' 헤더가 이미 포함되어 있어야 함
        #   - start==1이면 그대로
        # 배치2~5: 배치용 헤더 prepend
        if i == 1:
            out = body
        else:
            header = f"{TITLE_BASE} - 배치 {i}\n\n"
            out = header + body

        # 말미에 개행 1개 보장
        if not out.endswith("\n"):
            out += "\n"

        with open(dst, "w", encoding="utf-8") as f:
            f.write(out)

        n_questions = len(re.findall(r"^### Q\d+\.", body, flags=re.MULTILINE))
        print(f"wrote {dst}: lines {start}-{end} ({end - start + 1}줄, {n_questions}문제)")


if __name__ == "__main__":
    main()
