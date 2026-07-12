import { execFileSync } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';

const chapterGuides = [
  ['通天论', '总论命理从阴阳、五行、干支与进退之机入手。阅读时应把旺衰、顺逆和配置放在同一结构中，不可执一字断吉凶。'],
  ['天干论', '逐一说明十天干的性情、时令与配合条件。核心不在固定物象，而在同一五行进入不同季节、根气和组合后如何发挥。'],
  ['地支论', '地支兼具季节、方位、藏干与根气，彼此作用也比表面五行更复杂。此篇是理解根气与合冲刑害的入口。'],
  ['形象论', '讨论两气成象、独象与全象。所谓成象须有清楚主线和承载条件，不能只因某一五行数量多便轻率归类。'],
  ['方局论', '三合、三会等方局会重组原局气势。判断是否成局，要看月令、透干、杂气、日主承载以及是否遭到破坏。'],
  ['格局论', '格局是命局中能持续运转的成事结构。应从月令、透藏和制化关系辨清主线，再谈成败、高低与救应。'],
  ['从化论·真', '真从真化要求日主失去独立依托，所从之势专一而有情。条件严格，不能把身弱、见合简单等同于从化。'],
  ['从化论·假', '假从假化是表面趋从、内部仍留根气或杂质的状态。岁运扶起原有根气时，结构可能出现明显反复。'],
  ['岁运论', '原局定底色，大运改变长期环境，流年负责具体触发。岁运吉凶仍须服从原局喜忌与结构，不能单看一个干支。'],
  ['体用论', '体是命局所立之本，用是解决主要矛盾、推动结构运转的力量。体用会随观察主题和岁运阶段发生侧重变化。'],
  ['精神论', '命局是否有精神，关键在气机有源、有归、有流通。五行俱全不等于有情，字少而清也可能精神贯注。'],
  ['衰旺论', '旺衰要看时令、根气、透藏和组合后的真实作用。旺者宜疏导，弱者宜生扶，但仍须服从全局制化。'],
  ['中和论', '中和不是五行平均，而是强弱有承、寒暖适宜、制化得当。过与不及都需通过结构性的用神来调整。'],
  ['刚柔论', '刚柔是五行阴阳在具体环境中的表现。刚需有制与泄，柔需有扶与依，得宜则成器，失衡则偏枯。'],
  ['顺逆论', '顺逆指气势流转是否顺畅，而非简单顺生为吉、逆克为凶。适当的克制可能建立秩序，过度生助也会壅滞。'],
  ['寒暖论', '先看季节造成的寒暖燥湿，再看原局是否有解冻、润燥、暖局或除湿的条件。调候得力后，格局之用才容易落实。'],
  ['月令论', '月令是季节主气和格局入口，权重高但不能包办全局。须结合司令、透干、会局与日主根气共同判断。'],
  ['生时论', '时柱是全局归宿与后势，常关乎成果、晚景、子女和长期输出。其作用仍要看是否承接前三柱之气。'],
  ['源流论', '源流关注五行从何处发起、经过何种转化、最终归于何处。流向喜用则有情，中途阻断或归于忌神则需救应。'],
  ['通隔论', '命局的力量虽出现，却可能因位置、阻隔或无根而不能相互作用。通关之神能把相战两端连接起来。'],
  ['清浊论', '清是主线纯一、配合有情，浊是多头牵制、真假混杂。清浊不是字数多少，而是结构能否辨明与执行。'],
  ['真假论', '真假辨别力量是否得令、得地、有根、有源。天干虚浮、地支无援往往是假；表面不显但根深有源也可能是真。'],
  ['隐显论', '显者透干而易见，隐者藏支而待引动。岁运透出、冲开或会合时，潜在主题才可能转为现实事件。'],
  ['众寡论', '数量多不必然强，数量少不必然弱。众势需看是否同心成局，寡势需看是否得令有根、能否以少制多。'],
  ['奋郁论', '气得生扶和出口则奋发，受压制、闭塞而无通道则郁结。判断时要寻找能让力量表达或转化的出口。'],
  ['恩怨论', '生克会因承受能力与位置不同而呈现恩或怨。生扶过度可能成为负担，适度约束反而可能成全结构。'],
  ['顺反论', '表面相生未必顺，表面相克未必反。须看作用结果是否保护体用、疏通气势并符合命局承载。'],
  ['战合论', '战是相克对峙，合是牵绊重组。合可解战也可羁绊用神，战可破局也可去病，必须辨清双方力量。'],
  ['震兑论', '借震木、兑金讨论生发与肃杀、东方与西方之气。重点仍是木金之间能否经过火炼、水润而成材。'],
  ['坎离论', '借坎水、离火讨论寒暖、水火既济。水火相见要有中介和尺度，偏枯或激战都难以持续。'],
  ['君臣论', '以君臣比喻日主、月令与用神的主从关系。主线明确、辅佐得位则结构有序，臣强欺主或多头争权则混乱。'],
  ['母子论', '以母子比喻生泄关系。母旺子弱、子多泄母都可能失衡，理想状态是有生有承、源流不绝。'],
  ['才德论', '才德是命局气质与现实成事能力的综合取象，不等同道德裁判。清纯、制化与岁运环境共同影响其显现。'],
  ['性情论', '性情从日主、月令、十神主线与组合共同推导。不可只凭生肖、单一五行或一颗十神给人贴标签。'],
  ['疾病论', '传统疾病类象用于观察偏性，不可代替医学诊断。重点是寒热燥湿、五行偏枯与岁运触发，现实中应以专业检查为准。'],
  ['闲神论', '闲神是暂未参与主线的字，并非永远无用。岁运引动、合冲改变或结构转换后，闲神也可能成为关键。'],
  ['绊神论', '绊神使关键力量被合住、牵制或难以到位。判断合绊要看位置、强弱与化局条件，不能见合便论吉。'],
  ['六亲论', '六亲须将十神、宫位、旺衰与岁运合看。传统类象可帮助定位关系主题，但不宜据此断定亲属存亡或品性。'],
  ['出身论', '出身主要从年、月柱及全局清浊、气势承接观察，反映早年资源与环境，不决定个人一生上限。'],
  ['地位论', '地位取决于格局能否成事、用神是否得力以及岁运是否承接。官杀、印财只是角色，组合才决定现实层级。'],
  ['贵贱贫富吉凶寿夭论', '本篇汇总多种结果类判断。现代阅读应去除宿命化，把它理解为结构质量、资源条件与风险倾向的综合讨论。'],
  ['贞元论', '以元亨利贞说明时间循环和阶段递变。命局与运程皆有起承转合，判断应重视前后阶段的连续性。'],
];

function stripMarkup(value) {
  return value
    .replace(/<[^>]+>/g, '')
    .replace(/\{\{[^{}]*\}\}/g, '')
    .replace(/\[\[([^\]|]+\|)?([^\]]+)\]\]/g, '$2')
    .replace(/'''?/g, '')
    .replace(/^[：:\s　]+/, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function parseChapter(wikitext, index) {
  const [fallbackTitle, guide] = chapterGuides[index];
  const novelTitle = wikitext.match(/\{\{Novel\|滴天髓\|([^|}]+)/)?.[1] ?? fallbackTitle;
  const body = wikitext.match(/<onlyinclude>([\s\S]*?)<\/onlyinclude>/)?.[1] ?? wikitext;
  const blocks = [];
  let heading = '';
  let pending = null;

  for (const rawLine of body.split('\n')) {
    const line = rawLine.trim();
    const headingMatch = line.match(/^===+\s*(.*?)\s*===+$/);
    if (headingMatch) {
      heading = stripMarkup(headingMatch[1]);
      continue;
    }
    const originalMatch = line.match(/\{\{color\|red\|\{\{\+\|([\s\S]*?)\}\}\}\}/);
    if (originalMatch) {
      pending = { heading, original: stripMarkup(originalMatch[1]), commentary: '' };
      blocks.push(pending);
      continue;
    }
    if (/^[:：]/.test(line) && pending) {
      const note = stripMarkup(line);
      if (note) pending.commentary += `${pending.commentary ? '\n' : ''}${note}`;
    }
  }

  return {
    id: String(index + 1).padStart(2, '0'),
    title: novelTitle,
    guide,
    blocks,
  };
}

const pageTitles = chapterGuides.map((_, index) => `滴天髓/${String(index + 1).padStart(2, '0')}`);
const payload = execFileSync('curl', [
  '-sG', 'https://zh.wikisource.org/w/api.php',
  '--data-urlencode', 'action=query',
  '--data-urlencode', `titles=${pageTitles.join('|')}`,
  '--data-urlencode', 'prop=revisions',
  '--data-urlencode', 'rvprop=content',
  '--data-urlencode', 'rvslots=main',
  '--data-urlencode', 'format=json',
  '--data-urlencode', 'formatversion=2',
], { encoding: 'utf8', maxBuffer: 32 * 1024 * 1024 });
const pages = JSON.parse(payload).query.pages;
const pageByTitle = new Map(pages.map((page) => [page.title, page.revisions?.[0]?.slots?.main?.content ?? '']));
const chapters = chapterGuides.map((_, index) => {
  const title = pageTitles[index];
  const wikitext = pageByTitle.get(title);
  if (!wikitext) throw new Error(`Missing source page: ${title}`);
  return parseChapter(wikitext, index);
});

const output = {
  id: 'ditiansui',
  title: '滴天髓',
  dynasty: '明',
  attribution: '传为京图撰、刘基注；本站底本含旧注，署名与版本沿用来源页',
  status: '全文',
  chapterCount: chapters.length,
  description: '以阴阳五行、干支气势、格局体用与岁运为主线的命理典籍。本站按四十二论编排全文。',
  editionNote: '正文与旧注据维基文库《滴天髓》页面整理，保留原页繁体用字；个别异体、讹字及标点从底本。白话导读为本站重新撰写，仅帮助建立阅读框架，不替代逐句训诂。',
  sourceLabel: '维基文库《滴天髓》',
  sourceUrl: 'https://zh.wikisource.org/wiki/滴天髓',
  updatedAt: new Date().toISOString().slice(0, 10),
  chapters,
};

const target = resolve('public/knowledge/classics/ditiansui.json');
mkdirSync(dirname(target), { recursive: true });
writeFileSync(target, `${JSON.stringify(output, null, 2)}\n`);
console.log(`Wrote ${chapters.length} chapters to ${target}`);
