# GMP CBT — 의료기기 RA 전문가 2급

2021 의료기기 RA 전문가 2급 핵심문제집 문제를 웹에서 풀어볼 수 있는 CBT(Computer-Based Test) 앱입니다. 문제는 **중간고사**·**기말고사** 두 시험범위로 묶여 있으며, 총 200문제입니다. Next.js 14(App Router) + TypeScript + Tailwind CSS로 작성되어 있으며, **Vercel에 그대로 배포**할 수 있습니다.

## 시험범위 (큰 카테고리)

- **중간고사** — PART 04 품질관리(GMP), 5개 챕터 / 164문제
  - CH01 총론 · CH02 기준해설 · CH03 위험관리 · CH04 밸리데이션 · CH05 사용적합성
- **기말고사** — PART 05 임상, 2개 챕터 / 36문제
  - CL03 의료기기 임상시험의 실시 · CL04 의료기기 임상시험의 통계적 원칙 및 관련 문서

> 기말고사 일부 단답형 문항(보관기간 등)은 스캔 원본의 정답 표기가 불명확하여 자동 추정한 정답에 `※ 원본 확인 권장` 표시를 해두었습니다.

## 주요 기능

- **중간고사 / 기말고사 시험범위별 학습**: 각 시험범위 단위로 모의고사(랜덤)·전체 학습을 진행하거나, 챕터별로 풀 수 있음
- **학습 모드**: 정답을 고르면 즉시 정답·해설 확인. 진도와 정답 수가 브라우저에 자동 저장되어 이어풀기 가능
- **시험 모드**: 끝까지 풀고 일괄 채점. 점수·소요시간·오답 리뷰 제공
- **모의고사**: 시험범위(중간고사/기말고사)에서 30문항 랜덤 추출 (개수 URL 파라미터로 변경 가능)
- **단답형 채점**: 공백 무시 및 부분 일치 허용
- **표/인용문/리스트** 등 원본 마크다운 형식을 그대로 유지하면서 렌더링
- **최고 점수 저장**: localStorage로 챕터별·모드별 최고 정답률 기록
- 모바일·데스크톱 반응형 UI

## 로컬 개발

```bash
# 의존성 설치
npm install

# 개발 서버
npm run dev
# http://localhost:3000

# 프로덕션 빌드
npm run build
npm run start
```

## 문제 데이터 재생성

`problems/` 의 마크다운 파일이 원본입니다. 파일 이름 접두사로 시험범위가 결정됩니다.

- `GMP_CH0N_*.md` → **중간고사** (챕터 key `CH0N`)
- `CL_CH0N_*.md` → **기말고사** (챕터 key `CL0N`)

시험범위 정의는 `scripts/parse_problems.py` 의 `EXAM_GROUPS` 에 있으며, 새 시험범위를 추가하려면 여기에 `glob`/`prefix` 를 등록하면 됩니다. 원본을 수정한 뒤 아래 명령으로 `data/questions.json` 을 다시 생성합니다.

```bash
npm run parse
# 또는
python3 scripts/parse_problems.py
```

생성되는 `questions.json` 구조는 `{ "exams": [ { key, name, description, chapters: [ { key, number, name, exam, questions } ] } ] }` 입니다.

**챕터 파일 형식**

```markdown
# CHAPTER 01 의료기기 GMP 총론

> 2021 의료기기 RA 전문가 2급 ... (인트로 블록 쿼트, 선택)

---

## Q1. 문제 본문?

> 인용문/보기/표 등 자유형식

① 보기 1
② 보기 2
③ 보기 3
**④ 정답 보기 (또는 표에서 ** 로 정답 행 강조)**
⑤ 보기 5

**정답: ④**

> 해설: 한 줄 해설...     ← 선택, 여러 줄 지원

---

## Q2. ...
```

## 디렉터리 구조

```
.
├── data/
│   └── questions.json        # 파싱된 문제 데이터 (앱에서 import)
├── problems/                 # 원본 마크다운 문제집
├── scripts/
│   └── parse_problems.py     # 마크다운 → JSON 파서
├── src/
│   ├── app/
│   │   ├── layout.tsx        # 루트 레이아웃
│   │   ├── page.tsx          # 홈 (시험범위 선택 화면)
│   │   ├── exam/[examKey]/   # /exam/midterm, /exam/final (시험별 전용 페이지)
│   │   ├── quiz/[mode]/      # /quiz/study, /quiz/exam
│   │   └── not-found.tsx
│   ├── components/
│   │   ├── ChapterCard.tsx
│   │   ├── ExamChooserCard.tsx # 홈의 시험범위 선택 카드
│   │   ├── ExamSection.tsx     # 시험 전용 페이지의 본문 섹션
│   │   ├── MarkdownView.tsx
│   │   ├── OptionButton.tsx
│   │   ├── ProgressBar.tsx
│   │   ├── QuestionView.tsx
│   │   ├── QuizResult.tsx
│   │   └── QuizRunner.tsx
│   └── lib/
│       ├── data.ts           # 챕터·문제 로드, 랜덤 추출
│       ├── storage.ts        # localStorage 진도/점수 저장
│       └── types.ts
├── next.config.js
├── tailwind.config.ts
├── tsconfig.json
└── vercel.json
```

## URL 라우트

| 경로 | 설명 |
| --- | --- |
| `/` | 홈 — 시험범위(중간고사/기말고사) 선택 화면 |
| `/exam/midterm` | 중간고사 전용 페이지 (시험범위·모의고사·전체학습·챕터 목록) |
| `/exam/final` | 기말고사 전용 페이지 |
| `/quiz/study?exam=final` | 기말고사 전체 순차 학습 (`midterm`/`final`) |
| `/quiz/exam?exam=final&mode=random&limit=30` | 기말고사 시험범위 랜덤 모의고사 |
| `/quiz/study?chapter=CL03` | 챕터 학습 모드 (즉시 채점) |
| `/quiz/exam?chapter=CH02` | 챕터 시험 모드 (일괄 채점) |
| `/quiz/study?mode=all` | 전 챕터(전 시험범위) 순차 학습 |
| `/quiz/exam?mode=random&limit=30` | 전체 통합 랜덤 모의고사 (limit 조절 가능) |

## Vercel 배포

1. 이 저장소를 GitHub에 푸시합니다.
2. [vercel.com](https://vercel.com) 에서 New Project → 해당 저장소 선택.
3. 프레임워크 자동 감지(Next.js)로 기본값 그대로 Deploy.
4. 빌드 완료 후 발급되는 `<project>.vercel.app` 에서 CBT 앱 사용.

환경변수·서버리스 함수·DB가 필요 없는 100% 정적 + 클라이언트 앱이므로 무료 플랜에서 문제없이 호스팅됩니다.

## 라이선스 / 출처

- 문제 원본: **2021 의료기기 RA 전문가 2급 핵심문제집** (PART 04 품질관리(GMP) · PART 05 임상)
- 앱 코드: MIT
- 학습용 보조 도구입니다. 실제 시험과 다를 수 있습니다.
