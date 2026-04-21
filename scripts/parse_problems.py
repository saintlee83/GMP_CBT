#!/usr/bin/env python3
"""
GMP 챕터별 마크다운 파일(GMP_CH0N_*.md)을 앱용 JSON으로 변환.

입력 형식 (챕터 파일 기준):
    # CHAPTER 01 의료기기 GMP 총론

    > 2021 의료기기 RA 전문가 2급 ... (인트로 블록 쿼트, 선택)

    ---

    ## Q1. 문제 본문...

    > 인용문/보기/표 등 자유형식

    ① 보기1
    ...
    **④ 정답 보기** (또는 표에서 `| **④** | ... |`)

    **정답: ④**            ←  +선택적으로 ` (공식 정답 기준)` 등 주석이 뒤에 붙을 수 있음

    > 해설: 한 줄짜리...       ← 선택
    > 또는
    > 해설:                 ← 다중행 해설
    > - 요점 1
    > - 요점 2

    ---

    ## Q2. ...
    ...

    **CH01 합계: 25문제 (객관식 18 + 단답 7)**
"""
from __future__ import annotations

import json
import os
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
PROBLEMS_DIR = ROOT / "problems"
DATA_DIR = ROOT / "data"

CIRCLE_TO_NUM = {"①": 1, "②": 2, "③": 3, "④": 4, "⑤": 5}
NUM_TO_CIRCLE = {v: k for k, v in CIRCLE_TO_NUM.items()}


def strip_option_bold(text: str) -> str:
    """객관식 문제 본문에서 정답을 강조한 ``**`` 마크만 제거.

    제거 대상:
    - 선택지 동그라미 번호(①~⑤)가 포함된 라인
    - 표 행(`|`으로 시작). 표 행의 ``**`` 는 정답 강조 외 쓰임이 없음.

    보존 대상:
    - 인용문/문단 내에 등장하는 ``**기본정보**``, ``**보기**`` 같은 라벨.
    """
    lines = text.split("\n")
    circles = set("①②③④⑤")
    cleaned: list[str] = []
    for line in lines:
        has_option = any(c in line for c in circles)
        is_table = line.lstrip().startswith("|")
        if (has_option or is_table) and "**" in line:
            line = line.replace("**", "")
        cleaned.append(line)
    return "\n".join(cleaned)


def dequote_explanation(text: str) -> str:
    """`> 해설: ...` 블록 쿼트 해설 텍스트를 일반 마크다운으로 변환.

    - 각 줄의 선두 ``> `` 제거 (``>``만 있는 빈 줄은 공백 줄로)
    - 맨 앞 ``해설:`` 라벨은 유지하지 않고 제거 (UI 에서 별도로 라벨링)
    """
    lines = text.split("\n")
    out: list[str] = []
    for line in lines:
        if line.startswith("> "):
            out.append(line[2:])
        elif line == ">":
            out.append("")
        else:
            out.append(line)
    joined = "\n".join(out).strip()

    # 선두 "해설:" 또는 "해설:\n" 제거
    joined = re.sub(r"^해설\s*:\s*", "", joined)
    # "해설:" 만 있는 첫 줄이라면 제거 후 이어지는 본문만 남김
    joined = re.sub(r"^해설\s*:\n", "", joined)
    return joined.strip()


def parse_answer(raw: str) -> tuple[str, int | str, str]:
    """정답 원문에서 (타입, 정답값, 부가 주석) 을 추출.

    반환: (type, value, note)
        - type: "multiple_choice" | "short_answer"
        - value: int (1~5) 또는 정답 문자열
        - note: 같은 줄의 ``**...**`` 뒤에 붙은 ``(주석)`` 등. 없으면 ''.
    """
    raw = raw.strip()
    first = raw[:1]
    if first in CIRCLE_TO_NUM:
        return "multiple_choice", CIRCLE_TO_NUM[first], ""
    return "short_answer", raw, ""


def parse_question_block(block: str, q_num: int, chapter_key: str) -> dict | None:
    """``## QN.`` 헤더부터 다음 ``## QN.`` 또는 파일 끝까지 범위의 텍스트를 파싱."""
    answer_match = re.search(r"\*\*정답\s*:\s*([^*]+?)\s*\*\*", block)
    if not answer_match:
        return None

    answer_raw = answer_match.group(1).strip()
    ans_start = answer_match.start()
    ans_end = answer_match.end()

    pre = block[:ans_start].rstrip()
    post = block[ans_end:].strip()

    # 1) 질문 본문 추출: 첫 줄이 "## QN. ..." 이므로 헤더 텍스트를 뽑고 본문 라인과 합침
    pre_lines = pre.split("\n")
    header = pre_lines[0]
    m = re.match(r"^##\s+Q\d+\.\s*(.+)$", header)
    if not m:
        return None
    question_head_text = m.group(1)
    question_body = "\n".join(pre_lines[1:]).strip()
    question_content = question_head_text
    if question_body:
        question_content += "\n\n" + question_body

    # 2) 단답형 여부
    is_short = "(단답형)" in question_content or "단답형" in question_head_text

    # 3) 정답 파싱
    q_type, correct, _ = parse_answer(answer_raw)
    if is_short and q_type == "multiple_choice":
        # 헤더에 단답형 표기가 있지만 정답이 번호 형태인 경우 → 객관식으로 처리
        q_type = "multiple_choice"
    if q_type == "multiple_choice":
        question_content = strip_option_bold(question_content)
        correct_label = NUM_TO_CIRCLE[int(correct)]
    else:
        correct_label = str(correct)

    # 4) 정답 라인 뒤에 붙는 주석/해설 정리
    #   - 첫 줄에 "(주석)" 류가 바로 이어지면 보존해서 note 로 사용
    note_line = ""
    trimmed_post = post
    if trimmed_post and not trimmed_post.startswith(">") and not trimmed_post.startswith("---"):
        # 첫 줄이 분리선/블록쿼트가 아니고 뭔가 있음 → 동일 라인 주석으로 취급
        first_line, _, rest = trimmed_post.partition("\n")
        note_line = first_line.strip()
        trimmed_post = rest.strip()

    # 해설 추출: `> 해설:` 로 시작하는 블록쿼트 전체
    explanation_raw = ""
    if trimmed_post.startswith(">"):
        # 블록쿼트가 끝나는 지점(공백 후 ---, 또는 빈줄+비블록쿼트 라인)까지를 해설로 간주
        block_lines = []
        for line in trimmed_post.split("\n"):
            if line.startswith(">") or line.strip() == "":
                block_lines.append(line)
            else:
                break
        # 후행 공백 라인 제거
        while block_lines and block_lines[-1].strip() == "":
            block_lines.pop()
        explanation_raw = "\n".join(block_lines)

    explanation = dequote_explanation(explanation_raw) if explanation_raw else ""
    if note_line:
        explanation = (note_line + ("\n\n" + explanation if explanation else "")).strip()

    # 푸터 '**CH01 합계: ...**' 제거
    explanation = re.sub(r"\*\*CH\d+\s*합계.*$", "", explanation).strip()

    return {
        "id": f"{chapter_key}-{q_num:03d}",
        "chapter": chapter_key,
        "number": q_num,
        "index": q_num,  # 챕터 파일 기준으로 번호=순번
        "type": q_type,
        "question": question_content,
        "correctAnswer": correct,
        "correctAnswerLabel": correct_label,
        "explanation": explanation,
    }


def parse_chapter_file(path: Path) -> dict | None:
    text = path.read_text(encoding="utf-8")
    lines = text.split("\n")
    if not lines:
        return None

    # 1. 챕터 헤더 파싱
    header_m = None
    for i, line in enumerate(lines[:5]):
        header_m = re.match(r"^#\s+CHAPTER\s+(\d+)\s+(.+)$", line)
        if header_m:
            header_idx = i
            break
    if not header_m:
        return None

    chapter_num = int(header_m.group(1))
    chapter_name = header_m.group(2).strip()
    chapter_key = f"CH{chapter_num:02d}"

    # 2. ## QN. 블록 수집
    questions: list[dict] = []
    i = 0
    while i < len(lines):
        m = re.match(r"^##\s+Q(\d+)\.", lines[i])
        if not m:
            i += 1
            continue
        q_num = int(m.group(1))
        start = i
        j = i + 1
        while j < len(lines) and not re.match(r"^##\s+Q\d+\.", lines[j]):
            j += 1
        block = "\n".join(lines[start:j])
        q = parse_question_block(block, q_num, chapter_key)
        if q:
            questions.append(q)
        i = j

    return {
        "key": chapter_key,
        "number": chapter_num,
        "name": chapter_name,
        "questions": questions,
    }


def main() -> None:
    DATA_DIR.mkdir(parents=True, exist_ok=True)

    files = sorted(PROBLEMS_DIR.glob("GMP_CH*.md"))
    if not files:
        raise SystemExit(f"챕터 파일을 찾을 수 없습니다: {PROBLEMS_DIR}/GMP_CH*.md")

    chapters: list[dict] = []
    total_q = 0
    for f in files:
        ch = parse_chapter_file(f)
        if ch is None:
            print(f"skip (no chapter header): {f.name}")
            continue
        chapters.append(ch)
        qs = ch["questions"]
        mc = sum(1 for q in qs if q["type"] == "multiple_choice")
        sa = sum(1 for q in qs if q["type"] == "short_answer")
        total_q += len(qs)
        print(
            f"  {ch['key']} {ch['name']} ({f.name}): "
            f"{len(qs)}문제 (객관식 {mc}, 단답형 {sa})"
        )

    data = {"chapters": chapters}
    dst = DATA_DIR / "questions.json"
    dst.write_text(json.dumps(data, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"\nTotal {total_q} questions across {len(chapters)} chapters")
    print(f"Wrote {dst}")


if __name__ == "__main__":
    main()
