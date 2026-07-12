import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';

const bookIds = ['ditiansui', 'qiongtong', 'lixu'];

for (const bookId of bookIds) {
  const sourcePath = resolve(`public/knowledge/classics/${bookId}.json`);
  const source = JSON.parse(readFileSync(sourcePath, 'utf8'));
  const version = `${source.updatedAt}-${source.chapters.reduce((sum, chapter) => sum + chapter.blocks.length, 0)}`;
  const chapters = source.chapters.map((chapter) => {
    const chapterPath = `knowledge/classics/${bookId}/chapters/${chapter.id}.json`;
    const target = resolve(`public/${chapterPath}`);
    mkdirSync(dirname(target), { recursive: true });
    writeFileSync(target, `${JSON.stringify(chapter)}\n`);
    return {
      id: chapter.id,
      title: chapter.title,
      guide: chapter.guide,
      path: chapterPath,
      blockCount: chapter.blocks.length,
    };
  });

  const manifest = { ...source, version, chapters };
  const manifestPath = resolve(`public/knowledge/classics/${bookId}/index.json`);
  mkdirSync(dirname(manifestPath), { recursive: true });
  writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);
  console.log(`Split ${source.title}: ${chapters.length} chapters`);
}
