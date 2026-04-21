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


def _parse_table_row(row: str) -> list[str]:
    """| a | b | c | 형태의 한 줄에서 셀만 추출."""
    inner = row.strip()
    if inner.startswith("|"):
        inner = inner[1:]
    if inner.endswith("|"):
        inner = inner[:-1]
    return [c.strip() for c in inner.split("|")]


def extract_options(stem_text: str) -> tuple[list[str] | None, str]:
    """문제 본문에서 선택지 5개를 추출한다. 본문에서 제거한 스템을 함께 반환.

    우선순위:
    1) 연속된 5개의 ``①~⑤`` 인라인 라인 → 각 라인의 텍스트를 그대로 선택지로 사용
    2) 5개의 ``| ①~⑤ | ... |`` 표 행 → 헤더 행과 결합해 "헤더: 값" 포맷으로 결합

    모두 실패하면 ``(None, stem_text)`` 반환.
    """
    lines = stem_text.split("\n")
    circles = "①②③④⑤"

    # 1) 인라인 연속 5줄
    for start in range(len(lines) - 4):
        ok = True
        for offset in range(5):
            line = lines[start + offset]
            expected = circles[offset]
            if not re.match(rf"^\s*{expected}\s+\S", line):
                ok = False
                break
        if ok:
            options = []
            for offset in range(5):
                line = lines[start + offset].lstrip()
                # 동그라미 뒤 공백 제거
                options.append(line[1:].strip())
            new_lines = lines[:start] + lines[start + 5:]
            # 앞뒤에 남는 공백 라인 정리
            new_stem = "\n".join(new_lines).strip()
            return options, new_stem

    # 2) 표 형식: 연속된 `| ①~⑤ | ... |` 5행
    row_indices: list[int] = []
    for i, line in enumerate(lines):
        m = re.match(r"^\|\s*([①②③④⑤])\s*\|", line)
        if m:
            row_indices.append(i)

    # 5행이 연속되어 있고 순서대로 ①~⑤ 인 경우만 처리
    if len(row_indices) >= 5:
        for start in range(len(row_indices) - 4):
            chunk = row_indices[start:start + 5]
            # 인접해 있는지 (구분선 허용 X, 이미 row_indices 는 본 행만 모음)
            if chunk[-1] - chunk[0] != 4:
                continue
            # 순서대로 ①~⑤ 인지
            ok = True
            for off in range(5):
                line = lines[chunk[off]]
                if not line.lstrip().startswith(f"| {circles[off]}") and not line.lstrip().startswith(f"|{circles[off]}"):
                    m = re.match(r"^\|\s*([①②③④⑤])\s*\|", line)
                    if not m or m.group(1) != circles[off]:
                        ok = False
                        break
            if not ok:
                continue

            first_row = chunk[0]

            # 헤더행 찾기: first_row 바로 위를 거슬러 올라가 --- 구분선 → 헤더행
            header_idx: int | None = None
            sep_idx: int | None = None
            for j in range(first_row - 1, -1, -1):
                raw = lines[j].strip()
                if not raw:
                    continue
                if re.match(r"^\|\s*[-:\s|]+\|?\s*$", raw):
                    sep_idx = j
                    continue
                if raw.startswith("|"):
                    header_idx = j
                    break
                break

            if header_idx is None or sep_idx is None:
                continue

            header_cells = _parse_table_row(lines[header_idx])
            options: list[str] = []
            for idx in chunk:
                row_cells = _parse_table_row(lines[idx])
                # 첫 셀이 ①~⑤ 이므로 제외
                row_cells = row_cells[1:]
                hdrs = header_cells[1:] if len(header_cells) == len(row_cells) + 1 else header_cells
                pairs: list[str] = []
                for h, v in zip(hdrs, row_cells):
                    h = h.strip()
                    v = v.strip()
                    if not v:
                        continue
                    if h:
                        pairs.append(f"{h}: {v}")
                    else:
                        pairs.append(v)
                options.append(" · ".join(pairs) if pairs else "")

            # 표 전체(헤더+구분선+5행) 제거
            remove = set(range(header_idx, chunk[-1] + 1))
            new_lines = [l for i, l in enumerate(lines) if i not in remove]
            new_stem = "\n".join(new_lines).strip()
            # 여분 공백 라인 축소
            new_stem = re.sub(r"\n{3,}", "\n\n", new_stem)
            return options, new_stem

    return None, stem_text


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
    options: list[str] | None = None
    if q_type == "multiple_choice":
        # 1) 정답 강조 ** 제거
        question_content = strip_option_bold(question_content)
        # 2) 선택지 추출 및 본문에서 분리
        options, question_content = extract_options(question_content)
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

    result = {
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
    if options is not None:
        result["options"] = options
    return result


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
