#!/usr/bin/env python3
"""
GMP 문제 마크다운을 JSON으로 변환
"""
import re
import json
import os


def strip_meta_bold(text: str) -> str:
    """정답 hint가 될 수 있는 ** 마크다운을 제거.

    표/옵션 라인에서 정답을 굵게 표시한 것만 제거하고,
    '기본정보', '보기', '〈보기〉' 같은 라벨 bold는 유지한다.
    """
    lines = text.split("\n")
    cleaned = []
    circles = set("①②③④⑤")

    for line in lines:
        stripped = line.strip()
        contains_option_circle = any(c in line for c in circles)
        is_table_row = stripped.startswith("|")

        if contains_option_circle and ("**" in line):
            # 옵션 라인이면 ** 전부 제거
            line = line.replace("**", "")
        elif is_table_row and "**" in line:
            # 테이블 행에서 **... ** 은 정답 강조이므로 제거
            line = line.replace("**", "")
        cleaned.append(line)
    return "\n".join(cleaned)


def parse_question_block(block: str, q_num: int, chapter_key: str):
    answer_match = re.search(r"\*\*정답:\s*([^\*]+?)\*\*", block)
    if not answer_match:
        return None

    answer_raw = answer_match.group(1).strip()
    ans_start = answer_match.start()
    ans_end = answer_match.end()
    pre = block[:ans_start].rstrip()
    post = block[ans_end:].lstrip()

    # post에서 배치 누계 제거
    post_lines = []
    for l in post.split("\n"):
        s = l.strip()
        if s == "---":
            continue
        if s.startswith("**배치") or "누계" in s or "총계" in s:
            continue
        post_lines.append(l)
    post = "\n".join(post_lines).strip()

    # pre의 첫줄(### Q..)에서 질문 시작 텍스트 추출
    pre_lines = pre.split("\n")
    header = pre_lines[0]
    q_header_text = re.sub(r"^### Q\d+\.\s*", "", header)
    body_lines = pre_lines[1:]

    question_content = q_header_text.strip()
    if body_lines:
        question_content += "\n" + "\n".join(body_lines)

    question_content = question_content.rstrip()

    # 단답형 여부
    is_short = ("단답형" in q_header_text) or ("(단답형)" in question_content)

    # 정답 파싱
    circle_to_num = {"①": 1, "②": 2, "③": 3, "④": 4, "⑤": 5}
    first_char = answer_raw[0] if answer_raw else ""

    if first_char in circle_to_num and not is_short:
        correct = circle_to_num[first_char]
        q_type = "multiple_choice"
    elif first_char in circle_to_num and is_short:
        # 표시는 단답형이지만 정답이 번호인 경우 → 객관식 처리
        correct = circle_to_num[first_char]
        q_type = "multiple_choice"
    else:
        q_type = "short_answer"
        correct = answer_raw

    # 객관식일 경우 정답 강조 bold 제거
    if q_type == "multiple_choice":
        question_content = strip_meta_bold(question_content)

    # 설명 정제 (bold 유지, 공백 정리)
    explanation = post.strip()

    return {
        "id": f"{chapter_key}-Q{q_num}",
        "chapter": chapter_key,
        "number": q_num,
        "type": q_type,
        "question": question_content,
        "correctAnswer": correct,
        "correctAnswerLabel": circles_num_to_label(correct) if q_type == "multiple_choice" else correct,
        "explanation": explanation,
    }


def circles_num_to_label(n: int) -> str:
    mapping = {1: "①", 2: "②", 3: "③", 4: "④", 5: "⑤"}
    return mapping.get(n, str(n))


def parse_all(md_text: str):
    chapters = []
    chapters_by_key = {}
    current_key = None

    lines = md_text.split("\n")
    i = 0
    while i < len(lines):
        line = lines[i]

        m = re.match(r"## CHAPTER (\d+)\s+(.+?)(\s*\((?:이어서|단답형 이어서)\))?$", line)
        if m:
            ch_num = m.group(1)
            ch_name = m.group(2).strip()
            key = f"CH{ch_num}"
            if key not in chapters_by_key:
                chapter = {
                    "key": key,
                    "number": int(ch_num),
                    "name": ch_name,
                    "questions": [],
                }
                chapters.append(chapter)
                chapters_by_key[key] = chapter
            current_key = key
            i += 1
            continue

        q_match = re.match(r"### Q(\d+)\.\s*(.+?)$", line)
        if q_match and current_key:
            q_num = int(q_match.group(1))
            block_lines = [line]
            j = i + 1
            while j < len(lines):
                nxt = lines[j]
                if (
                    re.match(r"### Q\d+\.", nxt)
                    or nxt.startswith("## CHAPTER")
                    or nxt.startswith("# ")
                ):
                    break
                block_lines.append(nxt)
                j += 1
            block = "\n".join(block_lines)
            question = parse_question_block(block, q_num, current_key)
            if question:
                chapters_by_key[current_key]["questions"].append(question)
            i = j
            continue

        i += 1

    # 각 챕터 내 Q 번호 중복 방지 - 재번호
    for ch in chapters:
        # 원본 번호 보존하되 글로벌 id는 chapter + index
        # 원본 번호 그대로 사용 (단, id에 index도 포함)
        for idx, q in enumerate(ch["questions"], 1):
            q["index"] = idx
            q["id"] = f"{ch['key']}-{idx:03d}"

    return chapters


def main():
    root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    src = os.path.join(root, "problems", "GMP_문제_전체통합.md")
    dst_dir = os.path.join(root, "data")
    os.makedirs(dst_dir, exist_ok=True)
    dst = os.path.join(dst_dir, "questions.json")

    with open(src, "r", encoding="utf-8") as f:
        md = f.read()

    chapters = parse_all(md)

    # 챕터 이름 정리
    chapter_name_map = {
        "CH01": "의료기기 GMP 총론",
        "CH02": "의료기기 GMP 기준해설",
        "CH03": "위험관리",
        "CH04": "밸리데이션",
        "CH05": "의료기기 사용적합성",
    }
    for ch in chapters:
        if ch["key"] in chapter_name_map:
            ch["name"] = chapter_name_map[ch["key"]]

    data = {"chapters": chapters}

    total = sum(len(ch["questions"]) for ch in chapters)
    print(f"Parsed {total} questions across {len(chapters)} chapters")
    for ch in chapters:
        shorts = sum(1 for q in ch["questions"] if q["type"] == "short_answer")
        mc = sum(1 for q in ch["questions"] if q["type"] == "multiple_choice")
        print(f"  {ch['key']} {ch['name']}: {len(ch['questions'])}문제 (객관식 {mc}, 단답형 {shorts})")

    with open(dst, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
    print(f"Wrote {dst}")


if __name__ == "__main__":
    main()
