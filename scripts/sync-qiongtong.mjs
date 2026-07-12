import { execFileSync } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';

const guides = {
  五行总论: '从阴阳寒热说明五行的来源、性情、生克与中和原则，是全书的理论入口。阅读时要把“折衷中道”理解为动态平衡，而不是五行数量平均。',
  论木: '总论木在春夏秋冬的状态，强调水、火、土、金对生木、死木和季节木气的不同作用。',
  论甲木: '甲木各月取用的核心是辨季节、根气与庚丁壬癸等配合。原文包含大量具体断语，学习时应提炼条件，不宜逐句机械套用。',
  论乙木: '乙木重在柔木能否得阳和、滋润与依托。四季取用随寒暖、燥湿和木气强弱改变。',
  论火: '总论火的炎上、光明与调候作用，强调木生、土泄、水济和季节旺衰之间的尺度。',
  论丙火: '丙火取太阳之象，重点看照暖、制化与壬庚甲等配合。旺季需节制，寒季需生扶。',
  论丁火: '丁火取灯烛炉火之象，更重根源、依附和持续性。不同月份要辨木助、金材与水制是否有情。',
  论土: '总论土随四时而变、承载转化的性质。湿土、燥土及寒暖土不可同断。',
  论戊土: '戊土偏阳厚，取用常围绕疏土、润燥、暖局和日主能否承载展开。',
  论己土: '己土偏阴湿，重培育、收纳和去湿暖土。原文按月说明丙癸甲等如何配合。',
  论庚金: '庚金重锻炼与成器，火炼、水洗、土生、木材都须符合季节与强弱。',
  论辛金: '辛金取珠玉精金之象，重淘洗、润泽与显用，忌泥滞、过火或水泛。',
  论水: '总论水润下、流动与寒湿之性。水要有源、有归、有堤防，过旺则泛，过弱则涸。',
  论壬水: '壬水取江河之象，重源流、疏导与堤岸。四季分别观察庚辛发源、戊土制约及丙火调候。',
  论癸水: '癸水取雨露泉脉之象，重滋润与通达。寒湿时需暖土，燥热时需有源，仍须结合月令。',
};

const payload = execFileSync('curl', [
  '-sG', 'https://zh.wikisource.org/w/api.php',
  '--data-urlencode', 'action=parse',
  '--data-urlencode', 'page=穷通宝鉴',
  '--data-urlencode', 'prop=wikitext',
  '--data-urlencode', 'format=json',
  '--data-urlencode', 'formatversion=2',
], { encoding: 'utf8', maxBuffer: 32 * 1024 * 1024 });
const wikitext = JSON.parse(payload).parse.wikitext;

function clean(value) {
  return value
    .replace(/<[^>]+>/g, '')
    .replace(/'''?/g, '')
    .replace(/\{\{[^{}]*\}\}/g, '')
    .replace(/\[\[([^\]|]+\|)?([^\]]+)\]\]/g, '$2')
    .replace(/\s+/g, ' ')
    .trim();
}

const lines = wikitext.split('\n');
const chapters = [];
let chapter = null;
let subheading = '';
let paragraph = [];

function flushParagraph() {
  if (!chapter || !paragraph.length) return;
  const original = clean(paragraph.join(' '));
  if (original) chapter.blocks.push({ heading: subheading, original, commentary: '' });
  paragraph = [];
  subheading = '';
}

function beginChapter(title) {
  flushParagraph();
  chapter = {
    id: String(chapters.length + 1).padStart(2, '0'),
    title,
    guide: guides[title] ?? `本篇集中讨论${title.replace('论', '')}的季节性情与取用条件。`,
    blocks: [],
  };
  chapters.push(chapter);
}

for (const rawLine of lines) {
  const line = rawLine.trim();
  const levelOne = line.match(/^=\s*([^=]+?)\s*=$/);
  const levelTwo = line.match(/^==\s*([^=]+?)\s*==$/);
  const levelThree = line.match(/^===\s*([^=]+?)\s*===$/);
  if (levelOne) {
    const title = clean(levelOne[1]);
    if (title === '五行总论') beginChapter(title);
    continue;
  }
  if (levelTwo) {
    beginChapter(clean(levelTwo[1]));
    continue;
  }
  if (levelThree) {
    flushParagraph();
    subheading = clean(levelThree[1]);
    continue;
  }
  if (!line) {
    flushParagraph();
    continue;
  }
  if (chapter && !line.startsWith('{{header')) paragraph.push(line);
}
flushParagraph();

const output = {
  id: 'qiongtong',
  title: '穷通宝鉴',
  dynasty: '清刊本系统',
  attribution: '旧题余春台辑；传本源流复杂，本站沿用维基文库题名',
  status: '全文',
  chapterCount: chapters.length,
  description: '以五行、十干和十二月令为线索，集中讨论寒暖燥湿与调候取用。',
  editionNote: '全文据维基文库《穷通宝鉴》页面整理，按“五行总论、五行分论、十干分论”重建目录；保留来源页正文与标点。白话导读为本站重新撰写，旨在说明篇章问题意识，不替代逐句训诂。',
  sourceLabel: '维基文库《穷通宝鉴》',
  sourceUrl: 'https://zh.wikisource.org/wiki/穷通宝鉴',
  updatedAt: new Date().toISOString().slice(0, 10),
  chapters,
};

const target = resolve('public/knowledge/classics/qiongtong.json');
mkdirSync(dirname(target), { recursive: true });
writeFileSync(target, `${JSON.stringify(output, null, 2)}\n`);
console.log(`Wrote ${chapters.length} chapters to ${target}`);
