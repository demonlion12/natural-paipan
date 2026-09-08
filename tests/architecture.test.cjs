const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const { createBaziReading } = require('../test-runtime/core/bazi.js');
const { getSolarTermMonths, getFlowDays } = require('../test-runtime/core/solarTerms.js');
const input = { name: '回归', gender: 'male', birthDate: '1990-01-01', birthTime: '00:00', birthplace: '北京', calendarType: 'solar', lunarLeapMonth: false, timezoneOffset: 8, longitude: 116.4074, timeMode: 'trueSolar', daylightSaving: false, dayBoundary: 'midnight', unknownHour: false, birthTimeSource: 'certificate', uncertaintyMinutes: 5 };
test('year-specific solar terms preserve exact boundaries and all daily intervals', () => {
  const months = getSolarTermMonths(2025);
  assert.equal(months.length, 12);
  assert.match(months[2].startText, /^2025-04-04 /);
  assert.match(getSolarTermMonths(2026)[4].startText, /^2026-06-05 /);
  assert.match(months[11].startText, /^2026-01-/);
  months.forEach((month, index) => {
    if (index < 11) assert.equal(month.end, months[index + 1].start);
    const days = getFlowDays(month);
    assert.ok(days.length >= 29 && days.length <= 33);
    assert.equal(new Set(days.map(d => d.dateText)).size, days.length);
  });
});
test('analysis context makes a full report reproducible and controls all annual sections', () => {
  const context = { asOf: '2025-07-01T00:00:00Z' };
  const a = createBaziReading(input, context);
  assert.deepEqual(a, createBaziReading(input, context));
  assert.equal(a.annual.year, 2025);
  assert.equal(a.deepDive.futureYears[0].year, 2025);
  const later = createBaziReading(input, { asOf: '2027-07-01T00:00:00Z' });
  assert.equal(later.annual.year, 2027);
  assert.deepEqual(a.pillars, later.pillars);
});
test('unknown hour does not contribute a noon pillar or deterministic detailed judgments', () => {
  const reading = createBaziReading({ ...input, unknownHour: true });
  assert.equal(reading.pillars[3].known, false);
  assert.equal(reading.pillars[3].stem, '');
  assert.deepEqual(reading.usefulElements, []);
  assert.deepEqual(reading.deepDive.domains, []);
  assert.deepEqual(reading.daYun.periods, []);
  assert.ok(reading.elementScores.every(x => Number.isFinite(x.score)));
  assert.equal(reading.elementScores.reduce((n,x) => n+x.score, 0), 3*10 + reading.pillars.slice(0,3).reduce((n,p)=>n + p.hiddenStems.reduce((v,_,i)=>v+([8,4,2][i] ?? 1),0),0) + 8 + (reading.pillars[1].hiddenStems.length-1)*2);
});
test('method evaluations have distinct dependencies, counter evidence and local citation targets', () => {
  const reading = createBaziReading(input);
  for (const school of reading.deepDive.methodSynthesis.schools) {
    assert.ok(school.ruleId);
    assert.ok(school.dependencies.length);
    assert.ok(school.counterEvidence.length);
    if (school.citation) {
      const ref = school.citation;
      const book = JSON.parse(fs.readFileSync(`public/knowledge/classics/${ref.bookId}/index.${ref.version}.json`));
      const chapter = JSON.parse(fs.readFileSync(`public/${book.chapters.find(c=>c.id===ref.chapterId).path}`));
      assert.ok(chapter.blocks.some(block=>block.id===ref.passageId && block.original===ref.text));
    }
  }
});
test('all current chapter URLs are content-addressed and passage IDs unique', () => {
  for (const id of ['ditiansui','qiongtong','lixu','sanming','yuanhai','wuxing']) {
    const book = JSON.parse(fs.readFileSync(`public/knowledge/classics/${id}/index.json`));
    assert.match(book.version, /^[a-f0-9]{20}$/);
    for (const chapter of book.chapters) {
      assert.match(chapter.path, /\.[a-f0-9]{20}\.json$/);
      const content=JSON.parse(fs.readFileSync(`public/${chapter.path}`));
      assert.equal(new Set(content.blocks.map(b=>b.id)).size, content.blocks.length);
    }
  }
});
