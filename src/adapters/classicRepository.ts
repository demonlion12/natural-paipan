import type { ClassicBook, ClassicChapter } from '../knowledge';
const CACHE = 'shanyi-classic-content-v2';
const base = () => import.meta.env.BASE_URL;
async function cacheStore() {
  try { return await globalThis.caches?.open(CACHE); } catch { return undefined; }
}
export function clearLegacyChapterCache() {
  try {
    for (const key of Object.keys(localStorage)) if (key.startsWith('shanyi-classic:')) localStorage.removeItem(key);
  } catch { /* Private archives and preferences are never touched. */ }
}
async function json<T>(response: Response): Promise<T> {
  if (!response.ok || !response.headers.get('content-type')?.includes('application/json')) throw new Error(`内容读取失败（${response.status}），请重试。`);
  return response.json() as Promise<T>;
}
export async function loadBook(path: string, signal?: AbortSignal): Promise<ClassicBook> {
  clearLegacyChapterCache();
  const url = `${base()}${path}`;
  const cache = await cacheStore();
  let response: Response;
  try { response = await fetch(url, { cache: 'no-cache', signal }); }
  catch (error) {
    signal?.throwIfAborted();
    const offline = await cache?.match(url);
    if (!offline) throw error;
    return json<ClassicBook>(offline);
  }
  const book = await json<ClassicBook>(response.clone());
  if (!book.id || !book.version || !Array.isArray(book.chapters)) throw new Error('古籍目录格式无效');
  try { await cache?.put(url, response); } catch { /* Online reading survives storage quota errors. */ }
  return book;
}
export async function loadChapter(book: ClassicBook, id: string, signal?: AbortSignal): Promise<ClassicChapter> {
  const chapter = book.chapters.find(item => item.id === id);
  if (!chapter) throw new Error('章节不存在');
  const url = `${base()}${chapter.path}`;
  const cache = await cacheStore();
  const cached = await cache?.match(url);
  if (cached) {
    try { return await json<ClassicChapter>(cached); } catch { await cache?.delete(url); }
  }
  const response = await fetch(url, { cache: 'default', signal });
  const content = await json<ClassicChapter>(response.clone());
  if (content.id !== id || !Array.isArray(content.blocks)) throw new Error('章节内容与目录不匹配');
  signal?.throwIfAborted();
  try { await cache?.put(url, response); } catch { /* Online reading survives storage quota errors. */ }
  return content;
}
export async function downloadBook(book: ClassicBook, progress: (completed: number, total: number) => void, signal?: AbortSignal) {
  const cache = await cacheStore();
  if (!cache) throw new Error('此入口的浏览器存储不支持离线下载，仍可在线阅读。');
  await cache.put(`${base()}knowledge/classics/${book.id}/index.${book.version}.json`, Response.json(book));
  let completed = 0;
  for (const chapter of book.chapters) {
    await loadChapter(book, chapter.id, signal);
    const cached = await (await cacheStore())?.match(`${base()}${chapter.path}`);
    if (!cached) throw new Error('离线空间不足，下载未完成。');
    progress(++completed, book.chapters.length);
  }
}
export async function removeBookDownload(book: ClassicBook) {
  const cache = await cacheStore();
  for (const request of await cache?.keys() ?? []) {
    if (new URL(request.url).pathname.includes(`/knowledge/classics/${book.id}/`)) await cache?.delete(request);
  }
}

type SearchPassage = { bookId: string; chapterId: string; chapterTitle: string; passageId: string; version: string; text: string };
let searchIndex: Promise<Array<SearchPassage & { normalized: string }>> | undefined;
async function loadSearchIndex() {
  const url = `${base()}knowledge/classics/search.json`;
  const cache = await cacheStore();
  let response: Response;
  try { response = await fetch(url, { cache: 'no-cache' }); }
  catch (error) {
    const saved = await cache?.match(url);
    if (!saved) throw error;
    response = saved;
  }
  const items = await json<SearchPassage[]>(response.clone());
  if (!Array.isArray(items) || items.some(item => !item.passageId || typeof item.text !== 'string')) throw new Error('全文索引格式无效');
  try { await cache?.put(url, response); } catch { /* Search remains available online. */ }
  return items;
}
export async function searchClassicText(query: string) {
  const { default: OpenCC } = await import('opencc-js');
  const normalize = OpenCC.Converter({ from: 'twp', to: 'cn' });
  if (!searchIndex) searchIndex = loadSearchIndex()
    .then(items => items.map(item => ({ ...item, normalized: normalize(item.text) })))
    .catch(error => { searchIndex = undefined; throw error; });
  const terms = normalize(query.trim()).split(/\s+/).filter(Boolean);
  return (await searchIndex).filter(item => terms.every(term => item.normalized.includes(term))).slice(0, 30);
}
