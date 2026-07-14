const test = require('node:test');
const assert = require('node:assert/strict');
const { webcrypto } = require('node:crypto');

if (!globalThis.crypto) globalThis.crypto = webcrypto;
if (!globalThis.btoa) globalThis.btoa = (value) => Buffer.from(value, 'binary').toString('base64');
if (!globalThis.atob) globalThis.atob = (value) => Buffer.from(value, 'base64').toString('binary');

class MemoryStorage {
  constructor() {
    this.values = new Map();
  }

  get length() {
    return this.values.size;
  }

  clear() {
    this.values.clear();
  }

  getItem(key) {
    return this.values.has(key) ? this.values.get(key) : null;
  }

  key(index) {
    return [...this.values.keys()][index] ?? null;
  }

  removeItem(key) {
    this.values.delete(key);
  }

  setItem(key, value) {
    this.values.set(String(key), String(value));
  }
}

globalThis.localStorage = new MemoryStorage();

const {
  deleteActiveAccount,
  getActiveAccount,
  getVaultArchives,
  loginLocalAccount,
  logoutLocalAccount,
  readProfileValue,
  registerLocalAccount,
  setVaultArchives,
  writeProfileValue,
} = require('../test-runtime/auth.js');

test('local accounts encrypt migrated archives and isolate account vaults', async () => {
  localStorage.clear();
  const legacyArchive = {
    id: 'legacy-one',
    input: { name: '隐私案例', birthDate: '1990-01-01', birthTime: '00:00' },
    updatedAt: '2026-07-14T00:00:00.000Z',
  };
  localStorage.setItem('shanyi-archives-v1', JSON.stringify([legacyArchive]));

  const first = await registerLocalAccount({ username: 'first_user', displayName: '甲用户', password: 'correct-horse-1' });
  assert.equal(first.migratedArchives, 1);
  assert.equal(getVaultArchives()[0].id, 'legacy-one');
  assert.equal(localStorage.getItem('shanyi-archives-v1'), null);

  const storedText = [...localStorage.values.values()].join('\n');
  assert.doesNotMatch(storedText, /correct-horse-1/);
  assert.doesNotMatch(storedText, /1990-01-01/);
  assert.doesNotMatch(storedText, /隐私案例/);
  await writeProfileValue('shanyi-learning-progress', ['first-lesson']);

  await logoutLocalAccount();
  assert.equal(getActiveAccount(), null);
  assert.deepEqual(getVaultArchives(), []);
  await assert.rejects(() => loginLocalAccount('first_user', 'wrong-password'), /账号或密码错误/);

  await registerLocalAccount({ username: 'second_user', displayName: '乙用户', password: 'correct-horse-2' });
  assert.deepEqual(readProfileValue('shanyi-learning-progress', []), []);
  await setVaultArchives([{ id: 'second-only', updatedAt: '2026-07-14T01:00:00.000Z' }]);
  assert.deepEqual(getVaultArchives().map((item) => item.id), ['second-only']);
  await logoutLocalAccount();

  await loginLocalAccount('first_user', 'correct-horse-1');
  assert.deepEqual(getVaultArchives().map((item) => item.id), ['legacy-one']);
  assert.deepEqual(readProfileValue('shanyi-learning-progress', []), ['first-lesson']);
  await deleteActiveAccount();
  await assert.rejects(() => loginLocalAccount('first_user', 'correct-horse-1'), /账号或密码错误/);
});
