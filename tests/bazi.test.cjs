const test = require('node:test');
const assert = require('node:assert/strict');
const { CALCULATION_VERSION, createBaziReading, resolveBirthMoment } = require('../test-runtime/core/bazi.js');

const baseInput = {
  name: '测试档案',
  gender: 'male',
  birthDate: '1990-01-01',
  birthTime: '00:00',
  birthplace: '北京',
  calendarType: 'solar',
  lunarLeapMonth: false,
  timezoneOffset: 8,
  longitude: 116.4074,
  timeMode: 'trueSolar',
  daylightSaving: false,
  dayBoundary: 'midnight',
  unknownHour: false,
  birthTimeSource: 'certificate',
  uncertaintyMinutes: 5,
};

test('known solar fixture produces stable four pillars', () => {
  const reading = createBaziReading(baseInput);
  assert.deepEqual(reading.pillars.map((pillar) => pillar.ganZhi), ['己巳', '丙子', '丙寅', '戊子']);
  assert.equal(reading.zodiac, '蛇');
  assert.equal(reading.calculation.version, CALCULATION_VERSION);
});

test('clock time applies longitude, equation-of-time and daylight-saving corrections', () => {
  const standard = resolveBirthMoment({ ...baseInput, timeMode: 'clock', birthTime: '12:00' });
  const daylight = resolveBirthMoment({ ...baseInput, timeMode: 'clock', birthTime: '12:00', daylightSaving: true });
  assert.notEqual(standard.correctionMinutes, 0);
  assert.equal(daylight.daylightSavingMinutes, -60);
  assert.equal(daylight.correctionMinutes, standard.correctionMinutes - 60);
  assert.match(standard.effectiveSolarText, /^1990-01-01 /);
});

test('a true-solar correction crossing midnight is surfaced as a chart risk', () => {
  const reading = createBaziReading({ ...baseInput, timeMode: 'clock', uncertaintyMinutes: 30 });
  assert.equal(reading.calculation.effectiveSolarText.slice(0, 10), '1989-12-31');
  assert.ok(reading.calculation.warnings.some((warning) => warning.includes('跨越公历日期')));
});

test('lunar dates are converted before the pillars are calculated', () => {
  const moment = resolveBirthMoment({
    ...baseInput,
    calendarType: 'lunar',
    birthDate: '1989-12-05',
  });
  assert.equal(moment.convertedSolarText, '1990-01-01 00:00');
});

test('unknown hour and broad uncertainty are visible in calculation warnings', () => {
  const reading = createBaziReading({
    ...baseInput,
    unknownHour: true,
    birthTimeSource: 'unknown',
    uncertaintyMinutes: 120,
  });
  assert.match(reading.calculation.reliabilityText, /时辰未知/);
  assert.ok(reading.calculation.warnings.some((warning) => warning.includes('时柱')));
  assert.ok(reading.calculation.warnings.some((warning) => warning.includes('跨时辰边界')));
});

test('changing the Zi-hour day boundary rule is an explicit, reproducible option', () => {
  const midnight = createBaziReading({ ...baseInput, birthDate: '2024-05-20', birthTime: '23:30', dayBoundary: 'midnight' });
  const lateZi = createBaziReading({ ...baseInput, birthDate: '2024-05-20', birthTime: '23:30', dayBoundary: 'lateZi' });
  assert.equal(midnight.calculation.dayBoundaryText, '午夜换日（00:00）');
  assert.equal(lateZi.calculation.dayBoundaryText, '子初换日（23:00）');
  assert.notEqual(midnight.pillars[2].ganZhi, lateZi.pillars[2].ganZhi);
});

test('different natal charts produce materially different portrait reports', () => {
  const first = createBaziReading(baseInput);
  const second = createBaziReading({
    ...baseInput,
    name: '第二档案',
    gender: 'female',
    birthDate: '1986-06-01',
    birthTime: '06:30',
    birthplace: '浙江湖州德清',
    longitude: 119.9774,
  });

  assert.notDeepEqual(first.pillars.map((pillar) => pillar.ganZhi), second.pillars.map((pillar) => pillar.ganZhi));
  assert.notEqual(first.portrait.opening, second.portrait.opening);
  assert.notEqual(first.portrait.workStyle, second.portrait.workStyle);
  assert.notEqual(first.portrait.relationshipStyle, second.portrait.relationshipStyle);
  assert.notEqual(first.portrait.moneyStyle, second.portrait.moneyStyle);
  assert.match(first.portrait.workStyle, new RegExp(first.pillars[1].ganZhi));
  assert.match(second.portrait.relationshipStyle, new RegExp(second.pillars[2].branch));
});
