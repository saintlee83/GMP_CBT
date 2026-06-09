export const meta = {
  name: 'extract-sahu-haesol',
  description: 'Read full pages of answer-key PDF to extract official 해설 + SA answers + full content of the 2 newly-present CH4 questions',
  phases: [{ title: 'ReadPages', detail: 'agents read full pages, extract 해설/정답/보기' }],
}

const PNG = '/Users/jaylee_83/Documents/_itsjayspace/git_clones/GMP_CBT/.pdf_work2/png'
const TOTAL = 87
const CHUNK = 4

const QITEM = {
  type: 'object', additionalProperties: false,
  required: ['chapterNum', 'qnum', 'type', 'answerIndex', 'answerText', 'haesol', 'questionStem', 'bogiItems', 'options'],
  properties: {
    chapterNum: { type: 'integer', description: '1~9, read from the running "CHAPTER NN ..." footer label on the page' },
    qnum: { type: 'integer', description: 'question number printed (the big number 01,02,...)' },
    type: { type: 'string', enum: ['multiple_choice', 'short_answer'] },
    answerIndex: { type: 'integer', description: 'multiple_choice: the correct option 1~5 (read the bottom 「정답 NN ⑤」 band AND confirm with 해설). short_answer: 0.' },
    answerText: { type: 'string', description: 'short_answer: the exact Korean term(s) that fill the blank (for multiple blanks use "ㄱ. xxx, ㄴ. yyy"). multiple_choice: empty string.' },
    haesol: { type: 'string', description: 'the official 해설(explanation) text on the page, transcribed cleanly in Korean (1~4 sentences; include the key legal basis e.g. 「의료기기법 시행규칙」 제42조). Fix obvious OCR garbles. Omit the "교재 P.x" page ref.' },
    questionStem: { type: 'string', description: 'the question sentence (without 〈보기〉). Needed especially for new questions.' },
    bogiItems: { type: 'array', items: { type: 'string' }, description: 'each 〈보기〉 item as a separate clean string in order (e.g. "ㄱ. ...", "ㄴ. ..."); empty array if there is no 〈보기〉 box.' },
    options: { type: 'array', items: { type: 'string' }, description: 'multiple_choice: the 4~5 option texts WITHOUT ①②③ prefixes, in order. short_answer: empty array.' },
  },
}

const SCHEMA = {
  type: 'object', additionalProperties: false, required: ['questions'],
  properties: { questions: { type: 'array', items: QITEM } },
}

function pad(n) { return String(n).padStart(2, '0') }

const chunks = []
for (let s = 1; s <= TOTAL; s += CHUNK) {
  const pages = []
  for (let p = s; p < s + CHUNK && p <= TOTAL; p++) pages.push(p)
  chunks.push(pages)
}

log(`Extracting official 해설/정답 from ${TOTAL} full pages in ${chunks.length} chunks`)

const results = await parallel(chunks.map((pages) => async () => {
  const paths = pages.map((p) => `${PNG}/p-${pad(p)}.png`)
  const prompt = `당신은 의료기기 RA '핵심문제집 PART 03 사후관리'의 정답·해설 페이지를 정확히 디지털화합니다. 이 PDF는 각 문제 아래에 공식 해설과 페이지 하단 「정답」 띠지를 포함합니다.

각 페이지 이미지를 Read 하세요:
${paths.map((p, i) => `- page ${pages[i]}: ${p}`).join('\n')}

각 페이지의 '문제(들)'에 대해 다음을 추출하세요:
- chapterNum: 페이지 하단 러닝 라벨 "CHAPTER NN 챕터명"에서 NN(1~9). (왼쪽 페이지엔 책제목만 있을 수 있는데, 그 페이지의 문제는 직전 챕터 소속입니다 — 같은 문제 흐름의 chapterNum을 쓰세요.)
- qnum: 문제 번호(01,02,...). 챕터마다 1부터 다시 시작.
- type: 객관식이면 multiple_choice, 단답형('쓰시오'/괄호채우기, 선택지 없음)이면 short_answer.
- answerIndex: 객관식은 페이지 하단 「정답 NN ⑤」 띠지의 동그라미 숫자(1~5)를 읽고 해설 내용과 일치하는지 확인해 확정. 단답형은 0.
- answerText: 단답형이면 괄호에 들어갈 정확한 한국어 용어. 빈칸이 여러 개면 "ㄱ. xxx, ㄴ. yyy" 형식. 객관식이면 빈 문자열.
- haesol: 페이지에 인쇄된 공식 '해설' 본문을 한국어로 깔끔히 전사(1~4문장, 핵심 법령 근거 포함, 예: 「의료기기법 시행규칙」 제42조). 명백한 OCR 깨짐은 교정. "교재 P.x" 같은 페이지 표기는 제외.
- questionStem: 〈보기〉를 뺀 문제 문장.
- bogiItems: 〈보기〉 박스의 각 항목을 순서대로 개별 문자열 배열로(예: "ㄱ. ...","ㄴ. ..." 또는 "1) ...","• ..."). 〈보기〉가 없으면 빈 배열.
- options: 객관식 선택지 4~5개 텍스트를 ①②③ 기호 없이 순서대로. 단답형은 빈 배열.

주의:
- 한 페이지에 문제가 2개일 수 있습니다(둘 다 반환). 표지/빈 페이지/순수 해설 연속 페이지는 문제가 없으면 반환하지 않아도 됩니다.
- 정답은 반드시 하단 「정답」 띠지를 우선 근거로 하되 해설과 교차확인하세요.
이 묶음의 모든 문제를 반환하세요.`
  const r = await agent(prompt, { schema: SCHEMA, label: `pp ${pages[0]}-${pages[pages.length - 1]}`, phase: 'ReadPages' })
  return (r && r.questions) ? r.questions : []
}))

const all = results.filter(Boolean).flat()
log(`Extracted ${all.length} question records`)
return { count: all.length, questions: all }
