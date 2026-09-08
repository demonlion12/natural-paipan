import { mkdirSync, readFileSync, writeFileSync, renameSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { dirname, resolve } from 'node:path';
import { validateBook } from './classic-quality.mjs';

const bookIds = ['ditiansui', 'qiongtong', 'lixu', 'sanming', 'yuanhai', 'wuxing'];
const digest = value => createHash('sha256').update(JSON.stringify(value)).digest('hex').slice(0, 20);
const atomicWrite = (target, value) => { mkdirSync(dirname(target), { recursive: true }); writeFileSync(`${target}.tmp`, `${JSON.stringify(value, null, 2)}\n`); renameSync(`${target}.tmp`, target); };
const citations = [];
const translations = JSON.parse(readFileSync(resolve('content/translations.json'), 'utf8'));
const review = bookIds.map(bookId => validateBook(
  JSON.parse(readFileSync(resolve(`public/knowledge/classics/${bookId}.json`), 'utf8')),
  JSON.parse(readFileSync(resolve(`public/knowledge/classics/${bookId}/index.json`), 'utf8')),
));
atomicWrite(resolve('content/review-latest.json'), { checkedAt: new Date().toISOString(), books: review });

for (const bookId of bookIds) {
  const sourcePath = resolve(`public/knowledge/classics/${bookId}.json`);
  const source = JSON.parse(readFileSync(sourcePath, 'utf8'));
  const annotations = translations.filter(item => item.bookId === bookId);
  for (const annotation of annotations) {
    if (!source.chapters.some(chapter => chapter.id === annotation.chapterId && chapter.blocks.some(block => block.original === annotation.original))) throw new Error(`译注原文未匹配：${bookId}/${annotation.chapterId}`);
  }
  const version = digest({ source, annotations });
  const editionId = `${bookId}-${digest(source.sourceUrl)}`;
  const chapters = source.chapters.map((chapter) => {
    const content = { ...chapter, editionId, version, blocks: chapter.blocks.map((block, index) => ({ ...block, id: `${chapter.id}-${digest(block.original)}-${chapter.blocks.slice(0, index).filter(previous => previous.original === block.original).length}`, translation: annotations.find(item => item.chapterId === chapter.id && item.original === block.original) ?? null })) };
    const chapterPath = `knowledge/classics/${bookId}/chapters/${chapter.id}.${digest(content)}.json`;
    const target = resolve(`public/${chapterPath}`);
    mkdirSync(dirname(target), { recursive: true });
    atomicWrite(target, content);
    content.blocks.forEach(block => citations.push({ bookId, chapterId: chapter.id, chapterTitle: chapter.title, passageId: block.id, version, sourceUrl: source.sourceUrl, text: block.original }));
    return {
      id: chapter.id,
      title: chapter.title,
      guide: chapter.guide,
      path: chapterPath,
      blockCount: chapter.blocks.length,
    };
  });

  const manifest = { ...source, editionId, schemaVersion: 2, version, chapters };
  const manifestPath = resolve(`public/knowledge/classics/${bookId}/index.json`);
  mkdirSync(dirname(manifestPath), { recursive: true });
  atomicWrite(manifestPath, manifest);
  atomicWrite(resolve(`public/knowledge/classics/${bookId}/index.${version}.json`), manifest);
  console.log(`Split ${source.title}: ${chapters.length} chapters`);
}
atomicWrite(resolve('public/knowledge/classics/search.json'), citations);
const monthWords = ['正月', '二月', '三月', '四月', '五月', '六月', '七月', '八月', '九月', '十月', '十一月', '十二月'];
const refs = {};
for (const stem of ['甲','乙','丙','丁','戊','己','庚','辛','壬','癸']) for (let month = 0; month < 12; month++) {
  const passage = citations.find(c => c.bookId === 'qiongtong' && c.chapterTitle.includes(stem) && c.text.startsWith(monthWords[month]));
  if (passage) refs[`qiongtong:${stem}:${month}`] = passage;
}
for (const [key, bookId, match] of [['ditiansui', 'ditiansui', '天道有寒暖'], ['sanming', 'sanming', '大凡看命']]) {
  const passage = citations.find(c => c.bookId === bookId && c.text.includes(match));
  if (passage) refs[key] = passage;
}
atomicWrite(resolve('src/core/classicReferences.json'), refs);
