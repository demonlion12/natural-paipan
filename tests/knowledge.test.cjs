const test = require('node:test');
const assert = require('node:assert/strict');

const {
  branchQuickReference,
  knowledgeCases,
  knowledgeModules,
  knowledgeQuizQuestions,
  knowledgeTerms,
  learningPaths,
  relationQuickReference,
  seasonQuickReference,
  stemQuickReference,
  tenGodQuickReference,
} = require('../test-runtime/knowledge.js');

function assertUnique(items, getId, label) {
  const ids = items.map(getId);
  assert.equal(new Set(ids).size, ids.length, `${label}存在重复 ID`);
}

test('knowledge library identifiers and links stay internally consistent', () => {
  const lessons = knowledgeModules.flatMap((module) => module.lessons);
  const moduleIds = new Set(knowledgeModules.map((module) => module.id));
  const lessonIds = new Set(lessons.map((lesson) => lesson.id));

  assertUnique(knowledgeModules, (item) => item.id, '课程');
  assertUnique(lessons, (item) => item.id, '课节');
  assertUnique(knowledgeQuizQuestions, (item) => item.id, '练习题');
  assertUnique(knowledgeTerms, (item) => item.id, '术语');
  assertUnique(knowledgeCases, (item) => item.id, '案例');

  for (const question of knowledgeQuizQuestions) {
    assert.ok(moduleIds.has(question.moduleId), `练习题 ${question.id} 的课程不存在`);
    assert.ok(lessonIds.has(question.lessonId), `练习题 ${question.id} 的课节不存在`);
    assert.ok(question.answer >= 0 && question.answer < question.options.length, `练习题 ${question.id} 的答案越界`);
  }

  for (const item of knowledgeCases) {
    assert.ok(item.steps.length >= 4, `案例 ${item.id} 缺少完整推演步骤`);
    assert.ok(item.counterEvidence.length > 0, `案例 ${item.id} 缺少反证条件`);
    for (const moduleId of item.moduleIds) assert.ok(moduleIds.has(moduleId), `案例 ${item.id} 的课程 ${moduleId} 不存在`);
  }

  for (const path of learningPaths) {
    for (const moduleId of path.moduleIds) assert.ok(moduleIds.has(moduleId), `路线 ${path.id} 的课程 ${moduleId} 不存在`);
  }
});

test('quick-reference tables cover the expected base systems', () => {
  assert.equal(stemQuickReference.length, 10);
  assert.equal(branchQuickReference.length, 12);
  assert.equal(tenGodQuickReference.length, 10);
  assert.equal(seasonQuickReference.length, 12);
  assert.equal(relationQuickReference.length, 8);
});

test('traditional localization converts display text and normalizes search text locally', async () => {
  const { loadTraditionalLocalizers } = require('../test-runtime/i18n.js');
  const localizers = await loadTraditionalLocalizers();
  assert.equal(localizers.display('学习调候与岁运分析'), '學習調候與歲運分析');
  assert.equal(localizers.normalizeSearch('學習調候與歲運分析'), '学习调候与岁运分析');
});
