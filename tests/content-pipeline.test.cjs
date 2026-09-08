const test = require('node:test');
const assert = require('node:assert/strict');
test('content publication blocks empty, duplicate and unparsed chapters', async () => {
  const { validateBook } = await import('../scripts/classic-quality.mjs');
  const good = { id: 'fixture', chapters: [{ id: '01', blocks: [{ original: '天地有寒暖。' }] }] };
  assert.equal(validateBook(good).characters, 6);
  assert.throws(() => validateBook({ ...good, chapters: [{ id: '01', blocks: [] }] }), /为空/);
  assert.throws(() => validateBook({ ...good, chapters: [good.chapters[0], good.chapters[0]] }), /重复/);
  assert.throws(() => validateBook({ ...good, chapters: [{ id: '01', blocks: [{ original: '{| class="wikitable"' }] }] }), /格式标记/);
  assert.throws(() => validateBook(good, { chapters: [{ id: '02', path: 'missing-fixture.json' }] }), /缺篇/);
});
