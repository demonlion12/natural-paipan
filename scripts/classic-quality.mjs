import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { resolve } from 'node:path';

export function archiveSource(payload, label) {
  const hash = createHash('sha256').update(payload).digest('hex');
  const directory = resolve('.cache/classic-sources');
  mkdirSync(directory, { recursive: true });
  writeFileSync(`${directory}/${hash}.json`, payload);
  writeFileSync(`${directory}/${hash}.meta.json`, JSON.stringify({ label, fetchedAt: new Date().toISOString(), sha256: hash }, null, 2));
}

export function validateBook(source, previous) {
  if (!source.id || !Array.isArray(source.chapters) || !source.chapters.length) throw new Error('古籍目录缺失');
  const ids = new Set();
  let characters = 0;
  for (const chapter of source.chapters) {
    if (!chapter.id || ids.has(chapter.id)) throw new Error(`${source.id}: 章节标识重复`);
    ids.add(chapter.id);
    if (!chapter.blocks?.length) throw new Error(`${source.id}/${chapter.id}: 章节为空`);
    for (const block of chapter.blocks) {
      if (!block.original?.trim()) throw new Error(`${source.id}/${chapter.id}: 正文段落为空`);
      if (/\{\||\|\}|class\s*=\s*["']wikitable|\[\[|\{\{|<script/i.test(block.original)) throw new Error(`${source.id}/${chapter.id}: 正文残留格式标记`);
      characters += block.original.length;
    }
  }
  const previousChapters = previous?.chapters ?? [];
  const missing = previousChapters.filter(chapter => !ids.has(chapter.id)).map(chapter => chapter.id);
  let oldCharacters = 0;
  for (const chapter of previousChapters) {
    const path = resolve('public', chapter.path);
    if (existsSync(path)) oldCharacters += JSON.parse(readFileSync(path, 'utf8')).blocks.reduce((sum, block) => sum + block.original.length, 0);
  }
  const reviewRequired = missing.length > 0 || (oldCharacters > 0 && characters < oldCharacters * 0.85);
  if (reviewRequired && process.env.CLASSICS_REVIEWED !== '1') throw new Error(`${source.id}: 正文显著缩短或缺篇，须人工核对后以 CLASSICS_REVIEWED=1 发布`);
  return { bookId: source.id, chapters: ids.size, characters, previousCharacters: oldCharacters, missing, reviewRequired };
}
