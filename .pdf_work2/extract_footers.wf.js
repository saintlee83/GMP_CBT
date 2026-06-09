export const meta = {
  name: 'extract-sahu-answer-footers',
  description: 'Read 87 footer crops to extract official 정답 (answer key) + chapter per question',
  phases: [{ title: 'ReadFooters', detail: 'agents read footer crops, extract 정답 NN ⑤ pairs' }],
}

const FOOT = '/Users/jaylee_83/Documents/_itsjayspace/git_clones/GMP_CBT/.pdf_work2/foot'
const TOTAL = 87
const CHUNK = 9

const SCHEMA = {
  type: 'object', additionalProperties: false, required: ['pages'],
  properties: {
    pages: {
      type: 'array',
      items: {
        type: 'object', additionalProperties: false,
        required: ['page', 'hasAnswerFooter', 'chapterNum', 'chapterName', 'answers'],
        properties: {
          page: { type: 'integer' },
          hasAnswerFooter: { type: 'boolean', description: 'true if a pink 「정답」 band is present on this strip' },
          chapterNum: { type: 'integer', description: 'from the running "CHAPTER NN ..." label; 0 if not visible (e.g. left page shows only book title)' },
          chapterName: { type: 'string', description: 'chapter title next to CHAPTER NN, or empty' },
          answers: {
            type: 'array',
            description: 'each (question number, answer) pair shown in the 「정답」 band',
            items: {
              type: 'object', additionalProperties: false,
              required: ['qnum', 'answer'],
              properties: {
                qnum: { type: 'integer', description: 'question number (the 2-digit number, e.g. 02)' },
                answer: { type: 'integer', description: 'the circled answer number ①=1 ②=2 ③=3 ④=4 ⑤=5. Use 0 if the answer is NOT a circled number (e.g. a 단답형 with no circle shown).' },
              },
            },
          },
        },
      },
    },
  },
}

function pad(n) { return String(n).padStart(2, '0') }

const chunks = []
for (let s = 1; s <= TOTAL; s += CHUNK) {
  const pages = []
  for (let p = s; p < s + CHUNK && p <= TOTAL; p++) pages.push(p)
  chunks.push(pages)
}

log(`Reading ${TOTAL} footer crops in ${chunks.length} chunks to extract the official answer key`)

const results = await parallel(chunks.map((pages) => async () => {
  const paths = pages.map((p) => `${FOOT}/f-${pad(p)}.png`)
  const prompt = `당신은 의료기기 RA 문제집(PART 03 사후관리)의 페이지 하단 띠지를 읽어 '정답표'를 정확히 추출합니다.

아래 이미지들은 각 페이지의 '하단 footer 부분만' 잘라낸 것입니다. 각각을 Read 하세요:
${paths.map((p, i) => `- page ${pages[i]}: ${p}`).join('\n')}

각 이미지에서 두 가지를 봅니다:
1) 분홍색 「정답」 라벨로 시작하는 띠 — 그 뒤에 "02 ③   03 ⑤" 처럼 (문항번호, 동그라미 정답)들이 나열돼 있습니다. 동그라미 숫자 ①②③④⑤ 를 1~5 로 정확히 읽으세요. 흐릿하면 추측하지 말고 가장 가까운 값과 함께 페이지를 표시하세요.
2) 오른쪽의 "CHAPTER NN 챕터명 [페이지번호]" 러닝 라벨 — chapterNum(1~9)과 chapterName을 읽으세요. (왼쪽 페이지는 「정답」 띠 없이 "174 2021 의료기기 RA..." 책 제목만 있을 수 있음 → hasAnswerFooter=false, chapterNum=0)

규칙:
- 「정답」 띠가 있으면 hasAnswerFooter=true 로 하고 answers 배열에 모든 (qnum, answer) 쌍을 담으세요. 없으면 hasAnswerFooter=false, answers=[].
- answer 는 동그라미 숫자(①=1 … ⑤=5). 단답형이라 동그라미가 아니면 answer=0.
- 모든 페이지(이미지)를 page 번호와 함께 빠짐없이 반환하세요.`
  const r = await agent(prompt, { schema: SCHEMA, label: `footers ${pages[0]}-${pages[pages.length - 1]}`, phase: 'ReadFooters' })
  return (r && r.pages) ? r.pages : []
}))

const all = results.filter(Boolean).flat()
all.sort((a, b) => a.page - b.page)
// build answer key: only from pages that have an answer footer and a chapter
const key = []
for (const pg of all) {
  if (!pg.hasAnswerFooter) continue
  for (const a of pg.answers) {
    key.push({ page: pg.page, chapterNum: pg.chapterNum, chapterName: pg.chapterName, qnum: a.qnum, answer: a.answer })
  }
}
log(`Collected ${key.length} answer entries from ${all.filter(p => p.hasAnswerFooter).length} answer-footers`)
return { pages: all, key }
