import { execFileSync } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { archiveSource } from './classic-quality.mjs';

const API = 'https://zh.wikisource.org/w/api.php';

function fetchPages(titles, maxBuffer = 128 * 1024 * 1024) {
  const payload = execFileSync('curl', [
    '-fsSG', API,
    '--data-urlencode', 'action=query',
    '--data-urlencode', `titles=${titles.join('|')}`,
    '--data-urlencode', 'prop=revisions',
    '--data-urlencode', 'rvprop=ids|timestamp|content',
    '--data-urlencode', 'rvslots=main',
    '--data-urlencode', 'format=json',
    '--data-urlencode', 'formatversion=2',
  ], { encoding: 'utf8', maxBuffer });
  archiveSource(payload, titles.join('|'));
  const pages = JSON.parse(payload).query.pages;
  return new Map(pages.map((page) => [page.title, {
    revision: page.revisions?.[0]?.revid,
    timestamp: page.revisions?.[0]?.timestamp,
    text: page.revisions?.[0]?.slots?.main?.content ?? '',
  }]));
}

function splitLongText(value, limit = 460) {
  const chunks = [];
  let rest = value.trim();
  while (rest.length > limit) {
    const window = rest.slice(0, limit + 1);
    const boundary = Math.max(...['。', '！', '？', '〕', '；'].map((mark) => window.lastIndexOf(mark)));
    const cut = boundary >= Math.floor(limit * 0.48) ? boundary + 1 : limit;
    chunks.push(rest.slice(0, cut).trim());
    rest = rest.slice(cut).trim();
  }
  if (rest) chunks.push(rest);
  return chunks;
}

function normalizeWikitext(wikitext, { preserveAnchors = false } = {}) {
  const onlyInclude = wikitext.match(/<onlyinclude>([\s\S]*?)<\/onlyinclude>/)?.[1] ?? wikitext;
  let text = onlyInclude
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/<poem>|<\/poem>/g, '')
    .replace(/\{\{SK notes\|([\s\S]*?)\}\}/g, '〔原注：$1〕')
    .replace(/\{\{SKchar\|\d+\}\}/g, '□')
    .replace(/\{\{SK anchor\|([^}]+)\}\}/g, preserveAnchors ? '\n@@HEADING@@$1\n' : '')
    .replace(/\{\{[^{}]*\}\}/g, '')
    .replace(/\[\[([^\]|]+\|)?([^\]]+)\]\]/g, '$2')
    .replace(/<ref[^>]*>[\s\S]*?<\/ref>/g, '')
    .replace(/<[^>]+>/g, '')
    .replace(/'''?/g, '')
    .replace(/^\{\|.*$/gm, '')
    .replace(/^\|-.*$/gm, '')
    .replace(/^\|\}.*$/gm, '')
    .replace(/^\|\+.*$/gm, '')
    .replace(/^\|[-!]?/gm, '')
    .replace(/\|\|/g, '　');
  for (let i = 0; i < 3; i += 1) text = text.replace(/\{\{[^{}]*\}\}/g, '');
  return text
    .split('\n')
    .map((line) => line.replace(/^[\s　]+/, '').replace(/[\s　]+$/, ''))
    .join('\n');
}

function cleanHeading(value) {
  return value.replace(/^[=\s]+|[=\s]+$/g, '').replace(/[《》【】]/g, '').trim();
}

function blocksFromText(text, { anchorHeadings = false } = {}) {
  const blocks = [];
  let heading = '';
  let paragraph = [];
  const flush = () => {
    if (!paragraph.length) return;
    const joined = paragraph.join(' ').replace(/\s+/g, ' ').trim();
    splitLongText(joined).forEach((original, index) => blocks.push({ heading: index === 0 ? heading : '', original, commentary: '' }));
    paragraph = [];
    heading = '';
  };
  for (const line of text.split('\n')) {
    const wikiHeading = line.match(/^={2,}\s*(.*?)\s*={2,}$/);
    const anchorHeading = anchorHeadings ? line.match(/^@@HEADING@@(.+)$/) : null;
    if (wikiHeading || anchorHeading) {
      flush();
      heading = cleanHeading((wikiHeading?.[1] ?? anchorHeading?.[1]) || '');
    } else if (!line.trim()) {
      flush();
    } else if (!/^(欽定四庫全書|明　萬民英　撰)$/.test(line.trim())) {
      paragraph.push(line.trim());
    }
  }
  flush();
  return blocks;
}

function writeBook(output) {
  const target = resolve(`public/knowledge/classics/${output.id}.json`);
  mkdirSync(dirname(target), { recursive: true });
  writeFileSync(target, `${JSON.stringify(output, null, 2)}\n`);
  const blocks = output.chapters.reduce((sum, chapter) => sum + chapter.blocks.length, 0);
  console.log(`Wrote ${output.title}: ${output.chapters.length} chapters, ${blocks} blocks`);
}

function makeSanming() {
  const titles = Array.from({ length: 12 }, (_, index) => `三命通會 (四庫全書本)/卷${String(index + 1).padStart(2, '0')}`);
  const pages = fetchPages(titles);
  const chapters = titles.map((title, index) => {
    const page = pages.get(title);
    if (!page?.text) throw new Error(`Missing source page: ${title}`);
    return {
      id: String(index + 1).padStart(2, '0'),
      title: `卷${String(index + 1).padStart(2, '0')}`,
      guide: `本卷为《三命通会》四库全书本第${index + 1}卷。先辨篇题与所引旧说，再区分纳音禄命、子平格局和神煞等不同论法，不将全书材料混作同一套规则。`,
      blocks: blocksFromText(normalizeWikitext(page.text, { preserveAnchors: true }), { anchorHeadings: true }),
    };
  });
  const revisions = titles.map((title) => pages.get(title)?.revision).filter(Boolean);
  const sourceDates = titles.map((title) => pages.get(title)?.timestamp).filter(Boolean).sort();
  writeBook({
    id: 'sanming', title: '三命通会', dynasty: '明', attribution: '明万民英撰；本站采用维基文库《四库全书》本十二卷',
    status: '全文', unit: '卷', chapterCount: chapters.length,
    description: '汇集禄命法、子平法、神煞、格局、六亲与岁运等多种传统论法的大型命理文献。',
    editionNote: '全文据维基文库《三命通会（四库全书本）》卷一至卷十二整理。原页未统一加现代标点，本站仅按篇题和段落切分，不擅改原文；缺字以“□”保留。白话导读为本站阅读提示。',
    sourceLabel: '维基文库《三命通会（四库全书本）》',
    sourceUrl: 'https://zh.wikisource.org/wiki/三命通會_(四庫全書本)',
    sourceRevision: revisions.join(','), sourceUpdatedAt: sourceDates.at(-1)?.slice(0, 10) ?? '',
    updatedAt: new Date().toISOString().slice(0, 10), chapters,
  });
}

function chaptersFromWikiHeadings(text, firstTitle) {
  const normalized = normalizeWikitext(text);
  const chapters = [];
  let chapter = { id: '01', title: firstTitle, guide: '', blocks: [] };
  let paragraph = [];
  const flush = () => {
    if (!paragraph.length) return;
    const joined = paragraph.join(' ').replace(/\s+/g, ' ').trim();
    splitLongText(joined).forEach((original) => chapter.blocks.push({ heading: '', original, commentary: '' }));
    paragraph = [];
  };
  const pushChapter = () => {
    flush();
    if (chapter.blocks.length) chapters.push(chapter);
  };
  for (const line of normalized.split('\n')) {
    const heading = line.match(/^={2,}\s*(.*?)\s*={2,}$/);
    if (heading) {
      pushChapter();
      chapter = { id: String(chapters.length + 1).padStart(2, '0'), title: cleanHeading(heading[1]), guide: '', blocks: [] };
    } else if (!line.trim()) flush();
    else if (!/^基础$/.test(line.trim()) || chapter.blocks.length) paragraph.push(line.trim());
  }
  pushChapter();
  return chapters.map((item) => ({
    ...item,
    guide: `本篇讨论“${item.title}”相关旧法。阅读时先提取月令、日主、透藏、制化与岁运等条件，再与其他章节交叉核对，不直接套用结果性断语。`,
  }));
}

function makeYuanhai() {
  const title = '淵海子平';
  const page = fetchPages([title]).get(title);
  if (!page?.text) throw new Error(`Missing source page: ${title}`);
  const chapters = chaptersFromWikiHeadings(page.text, '基础与十神');
  writeBook({
    id: 'yuanhai', title: '渊海子平', dynasty: '宋元以来', attribution: '传统题署徐大升编；来源页作者题署与版本信息仍待进一步校核',
    status: '全文·底本待校', unit: '篇', chapterCount: chapters.length,
    description: '子平法重要汇编，包含日主、月令、格局、十神、六亲、岁运、诗诀与命例等材料。',
    editionNote: '全文据维基文库《渊海子平》页面整理。来源页明确标注“No source”，未提供可逐页核对的扫描底本，因此本站保留“底本待校”标记；文本可供检索学习，不作为唯一校勘定本。',
    sourceLabel: '维基文库《渊海子平》（来源页未标底本）', sourceUrl: 'https://zh.wikisource.org/wiki/淵海子平',
    sourceRevision: String(page.revision ?? ''), sourceUpdatedAt: page.timestamp?.slice(0, 10) ?? '',
    updatedAt: new Date().toISOString().slice(0, 10), chapters,
  });
}

function makeWuxing() {
  const title = '五行精紀';
  const page = fetchPages([title], 256 * 1024 * 1024).get(title);
  if (!page?.text) throw new Error(`Missing source page: ${title}`);
  const normalized = normalizeWikitext(page.text);
  const bodyStart = normalized.lastIndexOf('\n第一卷\n');
  const body = bodyStart >= 0 ? normalized.slice(bodyStart + 1) : normalized;
  const chapters = [];
  let current = null;
  let buffer = [];
  const flush = () => {
    if (!current) return;
    current.blocks = blocksFromText(buffer.join('\n'));
    if (current.blocks.length) chapters.push(current);
    buffer = [];
  };
  for (const line of body.split('\n')) {
    if (/^第[一二三四五六七八九十○〇廿卅咫咅\d]+卷/.test(line.trim())) {
      flush();
      const volumeNumber = chapters.length + 1;
      current = {
        id: String(volumeNumber).padStart(2, '0'), title: `卷${String(volumeNumber).padStart(2, '0')}`,
        guide: `本卷汇录唐宋禄命法材料。重点识别纳音、干支、神煞、岁运等概念的历史层次，并与后世以日主和月令为中心的子平法分开阅读。`, blocks: [],
      };
    } else if (current) buffer.push(line);
  }
  flush();
  writeBook({
    id: 'wuxing', title: '五行精纪', dynasty: '宋', attribution: '宋廖中辑；本站据维基文库页面整理',
    status: '全文', unit: '卷', chapterCount: chapters.length,
    description: '汇集唐宋禄命法、纳音、干支、神煞、贵格、六亲、疾病与岁运材料的重要文献。',
    editionNote: '全文据维基文库《五行精纪》页面整理，按原页卷次切分。来源文本含少量异体、讹字与录入差异，本站保留原貌并记录来源修订号；导读只说明文献层次。',
    sourceLabel: '维基文库《五行精纪》', sourceUrl: 'https://zh.wikisource.org/wiki/五行精紀',
    sourceRevision: String(page.revision ?? ''), sourceUpdatedAt: page.timestamp?.slice(0, 10) ?? '',
    updatedAt: new Date().toISOString().slice(0, 10), chapters,
  });
}

makeSanming();
makeYuanhai();
makeWuxing();
