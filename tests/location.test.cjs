const test = require('node:test');
const assert = require('node:assert/strict');
const { birthLocations, findBirthLocation } = require('../test-runtime/locationData.js');

test('birth location aliases resolve to coordinates and timezone', () => {
  const deqing = findBirthLocation('浙江湖州德清');
  assert.equal(deqing.label, '浙江省 湖州市 德清县');
  assert.equal(deqing.longitude, 119.9774);
  assert.equal(deqing.timezoneOffset, 8);

  const tokyo = findBirthLocation('东京');
  assert.equal(tokyo.timezoneOffset, 9);
  assert.equal(findBirthLocation('未收录的自定义地点'), undefined);
  assert.ok(birthLocations.length >= 60);
});
