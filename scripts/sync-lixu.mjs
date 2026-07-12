import { execFileSync } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';

const volumes = [
  ['卷上', '卷上集中讨论六十甲子纳音、天乙贵人和多种早期禄命格法。阅读时应注意：这套体系与后世以日主为中心的子平法并不完全相同。'],
  ['卷中', '卷中从阴阳、五行、三元和干支配合展开，保存了大量早期命理概念与旧说，可用于观察禄命法向子平法发展的思想脉络。'],
  ['卷下', '卷下进一步讨论六亲、贵贱、三元九限、行运与多类格法。现代学习宜将其视作文献史材料，与后世旺衰、格局理论相互参照。'],
];
const titles = volumes.map(([volume]) => `李虛中命書 (四庫全書本)/${volume}`);
const payload = execFileSync('curl', [
  '-sG', 'https://zh.wikisource.org/w/api.php',
  '--data-urlencode', 'action=query',
  '--data-urlencode', `titles=${titles.join('|')}`,
  '--data-urlencode', 'prop=revisions',
  '--data-urlencode', 'rvprop=content',
  '--data-urlencode', 'rvslots=main',
  '--data-urlencode', 'format=json',
  '--data-urlencode', 'formatversion=2',
], { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });
const pages = JSON.parse(payload).query.pages;
const pageByTitle = new Map(pages.map((page) => [page.title, page.revisions?.[0]?.slots?.main?.content ?? '']));

function normalizeSource(wikitext) {
  const body = wikitext.match(/<onlyinclude><poem>([\s\S]*?)<\/poem><\/onlyinclude>/)?.[1] ?? wikitext;
  return body
    .replace(/<!--([\s\S]*?)-->/g, '')
    .replace(/\{\{SK notes\|([\s\S]*?)\}\}/g, '〔原注：$1〕')
    .replace(/\{\{SKchar\|\d+\}\}/g, '□')
    .replace(/\{\{SK anchor\|[^}]+\}\}/g, '')
    .replace(/\{\{[^{}]+\}\}/g, '')
    .replace(/\[\[([^\]|]+\|)?([^\]]+)\]\]/g, '$2')
    .replace(/<[^>]+>/g, '')
    .replace(/'''?/g, '')
    .split('\n')
    .map((line) => line.replace(/^[\s　]+/, '').trim())
    .filter((line) => line && line !== '欽定四庫全書')
    .flatMap((line) => splitLongText(line));
}

function splitLongText(value, limit = 460) {
  const chunks = [];
  let rest = value;
  while (rest.length > limit) {
    const window = rest.slice(0, limit + 1);
    const candidates = ['。', '！', '？', '〕', '；'].map((mark) => window.lastIndexOf(mark));
    const boundary = Math.max(...candidates);
    const cut = boundary >= Math.floor(limit * 0.48) ? boundary + 1 : limit;
    chunks.push(rest.slice(0, cut).trim());
    rest = rest.slice(cut).trim();
  }
  if (rest) chunks.push(rest);
  return chunks;
}

const chapters = volumes.map(([title, guide], index) => {
  const lines = normalizeSource(pageByTitle.get(titles[index]) ?? '');
  if (!lines.length) throw new Error(`Missing source content: ${titles[index]}`);
  return {
    id: String(index + 1).padStart(2, '0'),
    title,
    guide,
    blocks: lines.map((original) => ({ heading: '', original, commentary: '' })),
  };
});

const output = {
  id: 'lixu',
  title: '李虚中命书',
  dynasty: '唐宋文献系统',
  attribution: '题唐李虚中撰；现存本经后世整理，本站沿用《四库全书》本题名',
  status: '全文',
  chapterCount: 3,
  description: '早期禄命法重要文献，包含纳音、贵人、三元、六亲与行运等内容。',
  editionNote: '全文据维基文库《李虚中命书（四库全书本）》卷上、卷中、卷下整理，保留底本原字与原注；“□”表示来源页未能直接显示的缺字或异体字。白话导读为本站撰写。',
  sourceLabel: '维基文库《李虚中命书（四库全书本）》',
  sourceUrl: 'https://zh.wikisource.org/wiki/李虛中命書_(四庫全書本)',
  updatedAt: new Date().toISOString().slice(0, 10),
  chapters,
};

const target = resolve('public/knowledge/classics/lixu.json');
mkdirSync(dirname(target), { recursive: true });
writeFileSync(target, `${JSON.stringify(output, null, 2)}\n`);
console.log(`Wrote ${chapters.length} volumes to ${target}`);
