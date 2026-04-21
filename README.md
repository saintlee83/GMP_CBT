# GMP CBT — 의료기기 RA 전문가 2급

2021 의료기기 RA 전문가 2급 핵심문제집 PART 04 품질관리(GMP) 총 164문제를 웹에서 풀어볼 수 있는 CBT(Computer-Based Test) 앱입니다. Next.js 14(App Router) + TypeScript + Tailwind CSS로 작성되어 있으며, **Vercel에 그대로 배포**할 수 있습니다.

## 주요 기능

- **5개 챕터 × 164문제**: CH01 총론 / CH02 기준해설 / CH03 위험관리 / CH04 밸리데이션 / CH05 사용적합성
- **학습 모드**: 정답을 고르면 즉시 정답·해설 확인. 진도와 정답 수가 브라우저에 자동 저장되어 이어풀기 가능
- **시험 모드**: 끝까지 풀고 일괄 채점. 점수·소요시간·오답 리뷰 제공
- **모의고사**: 전 챕터에서 30문항 랜덤 추출 (개수 URL 파라미터로 변경 가능)
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

`problems/GMP_CH0N_*.md` (5개 챕터 파일) 이 원본입니다. 원본을 수정한 뒤 아래 명령으로 `data/questions.json` 을 다시 생성할 수 있습니다.

```bash
npm run parse
# 또는
python3 scripts/parse_problems.py
```

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
│   │   ├── page.tsx          # 홈 (챕터 선택 / 모의고사 진입)
│   │   ├── quiz/[mode]/      # /quiz/study, /quiz/exam
│   │   └── not-found.tsx
│   ├── components/
│   │   ├── ChapterCard.tsx
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
| `/` | 홈 — 챕터 목록, 모의고사 진입 |
| `/quiz/study?chapter=CH01` | 챕터 학습 모드 (즉시 채점) |
| `/quiz/study?mode=all` | 전 챕터 순차 학습 |
| `/quiz/exam?chapter=CH02` | 챕터 시험 모드 (일괄 채점) |
| `/quiz/exam?mode=random&limit=30` | 랜덤 모의고사 (limit 조절 가능) |

## Vercel 배포

1. 이 저장소를 GitHub에 푸시합니다.
2. [vercel.com](https://vercel.com) 에서 New Project → 해당 저장소 선택.
3. 프레임워크 자동 감지(Next.js)로 기본값 그대로 Deploy.
4. 빌드 완료 후 발급되는 `<project>.vercel.app` 에서 CBT 앱 사용.

환경변수·서버리스 함수·DB가 필요 없는 100% 정적 + 클라이언트 앱이므로 무료 플랜에서 문제없이 호스팅됩니다.

## 라이선스 / 출처

- 문제 원본: **2021 의료기기 RA 전문가 2급 핵심문제집 PART 04 품질관리(GMP)**
- 앱 코드: MIT
- 학습용 보조 도구입니다. 실제 시험과 다를 수 있습니다.
