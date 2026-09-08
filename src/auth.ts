export type AccountProfile = {
  id: string;
  username: string;
  displayName: string;
  createdAt: string;
};

export type AuthResult = {
  account: AccountProfile;
  migratedArchives: number;
};

type StoredAccount = AccountProfile & {
  salt: string;
  verifier: string;
  iterations: number;
};

type VaultData = {
  version: 1;
  archives: unknown[];
  profileStorage: Record<string, string>;
  updatedAt: string;
};

type VaultEnvelope = {
  version: 1;
  iv: string;
  ciphertext: string;
  updatedAt: string;
};

type ActiveSession = {
  account: AccountProfile;
  key: CryptoKey;
  vault: VaultData;
  envelope: string | null;
};

const ACCOUNT_REGISTRY_KEY = 'shanyi-accounts-v1';
const VAULT_PREFIX = 'shanyi-account-vault-v1:';
const LEGACY_ARCHIVE_KEY = 'shanyi-archives-v1';
const LEGACY_PROFILE_KEYS = [
  'shanyi-feedback-queue-v1',
  'shanyi-quiz-attempts',
  'shanyi-classic-bookmarks',
  'shanyi-classic-positions',
  'shanyi-learning-progress',
] as const;
const PBKDF2_ITERATIONS = 210_000;
const MAX_ACCOUNTS = 8;
const encoder = new TextEncoder();
const decoder = new TextDecoder();
let activeSession: ActiveSession | null = null;
let persistQueue: Promise<void> = Promise.resolve();

export class AuthError extends Error {
  constructor(public readonly code: 'invalid' | 'exists' | 'credentials' | 'storage' | 'unsupported', message: string) {
    super(message);
    this.name = 'AuthError';
  }
}

function storage() {
  if (!globalThis.localStorage) throw new AuthError('storage', '浏览器不允许本机存储，无法使用账号功能。');
  return globalThis.localStorage;
}

function randomBytes(length: number) {
  const bytes = new Uint8Array(length);
  globalThis.crypto.getRandomValues(bytes);
  return bytes;
}

function bytesToBase64(bytes: Uint8Array) {
  let binary = '';
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return globalThis.btoa(binary);
}

function base64ToBytes(value: string) {
  const binary = globalThis.atob(value);
  return Uint8Array.from(binary, (character) => character.charCodeAt(0));
}

function readAccounts(): StoredAccount[] {
  try {
    return JSON.parse(storage().getItem(ACCOUNT_REGISTRY_KEY) || '[]') as StoredAccount[];
  } catch {
    return [];
  }
}

function writeAccounts(accounts: StoredAccount[]) {
  try {
    storage().setItem(ACCOUNT_REGISTRY_KEY, JSON.stringify(accounts));
  } catch {
    throw new AuthError('storage', '账号信息保存失败，请检查浏览器存储空间。');
  }
}

function normalizeUsername(username: string) {
  return username.trim().normalize('NFKC').toLocaleLowerCase('zh-CN');
}

function validateRegistration(username: string, displayName: string, password: string) {
  if (!/^[\p{L}\p{N}_-]{3,24}$/u.test(username)) {
    throw new AuthError('invalid', '账号需为 3–24 位中文、字母、数字、下划线或短横线。');
  }
  if (displayName.trim().length < 1 || displayName.trim().length > 24) {
    throw new AuthError('invalid', '显示名称需为 1–24 个字符。');
  }
  if (password.length < 8 || password.length > 72) {
    throw new AuthError('invalid', '密码需为 8–72 个字符。');
  }
}

async function deriveCredentials(password: string, salt: Uint8Array, iterations: number) {
  if (!globalThis.crypto?.subtle) throw new AuthError('unsupported', '当前浏览器不支持安全加密，无法使用账号功能。');
  const material = await globalThis.crypto.subtle.importKey('raw', encoder.encode(password), 'PBKDF2', false, ['deriveBits']);
  const bits = new Uint8Array(await globalThis.crypto.subtle.deriveBits(
    { name: 'PBKDF2', hash: 'SHA-256', salt: salt as BufferSource, iterations },
    material,
    512,
  ));
  const verifierBytes = new Uint8Array(await globalThis.crypto.subtle.digest('SHA-256', bits.slice(0, 32)));
  const key = await globalThis.crypto.subtle.importKey('raw', bits.slice(32), { name: 'AES-GCM' }, false, ['encrypt', 'decrypt']);
  bits.fill(0);
  return { verifier: bytesToBase64(verifierBytes), key };
}

function constantTimeEqual(left: string, right: string) {
  const leftBytes = encoder.encode(left);
  const rightBytes = encoder.encode(right);
  let difference = leftBytes.length ^ rightBytes.length;
  const length = Math.max(leftBytes.length, rightBytes.length);
  for (let index = 0; index < length; index += 1) difference |= (leftBytes[index] ?? 0) ^ (rightBytes[index] ?? 0);
  return difference === 0;
}

function emptyVault(): VaultData {
  return { version: 1, archives: [], profileStorage: {}, updatedAt: new Date().toISOString() };
}

async function encryptVault(accountId: string, key: CryptoKey, vault: VaultData): Promise<VaultEnvelope> {
  const iv = randomBytes(12);
  const ciphertext = await globalThis.crypto.subtle.encrypt(
    { name: 'AES-GCM', iv: iv as BufferSource, additionalData: encoder.encode(`shanyi-vault:${accountId}:v1`) },
    key,
    encoder.encode(JSON.stringify(vault)),
  );
  return {
    version: 1,
    iv: bytesToBase64(iv),
    ciphertext: bytesToBase64(new Uint8Array(ciphertext)),
    updatedAt: vault.updatedAt,
  };
}

async function decryptVault(accountId: string, key: CryptoKey, envelope: VaultEnvelope): Promise<VaultData> {
  try {
    const plaintext = await globalThis.crypto.subtle.decrypt(
      {
        name: 'AES-GCM',
        iv: base64ToBytes(envelope.iv) as BufferSource,
        additionalData: encoder.encode(`shanyi-vault:${accountId}:v1`),
      },
      key,
      base64ToBytes(envelope.ciphertext) as BufferSource,
    );
    const parsed = JSON.parse(decoder.decode(plaintext)) as VaultData;
    return parsed.version === 1 ? parsed : emptyVault();
  } catch {
    throw new AuthError('storage', '账号数据无法解密，可能已损坏或来自不兼容版本。');
  }
}

function readLegacyData() {
  let archives: unknown[] = [];
  const profileStorage: Record<string, string> = {};
  try {
    archives = JSON.parse(storage().getItem(LEGACY_ARCHIVE_KEY) || '[]') as unknown[];
  } catch {
    archives = [];
  }
  for (const key of LEGACY_PROFILE_KEYS) {
    const value = storage().getItem(key);
    if (value !== null) profileStorage[key] = value;
  }
  return { archives, profileStorage };
}

function removeLegacyData() {
  storage().removeItem(LEGACY_ARCHIVE_KEY);
  for (const key of LEGACY_PROFILE_KEYS) storage().removeItem(key);
}

function mergeLegacyData(vault: VaultData) {
  const legacy = readLegacyData();
  const archiveIds = new Set(vault.archives.map((item) => (item && typeof item === 'object' && 'id' in item ? String(item.id) : '')));
  const imported = legacy.archives.filter((item) => !(item && typeof item === 'object' && 'id' in item && archiveIds.has(String(item.id))));
  return {
    migratedArchives: imported.length,
    vault: {
      ...vault,
      archives: [...imported, ...vault.archives].slice(0, 30),
      profileStorage: { ...legacy.profileStorage, ...vault.profileStorage },
      updatedAt: new Date().toISOString(),
    } satisfies VaultData,
  };
}

async function writeVault(accountId: string, key: CryptoKey, vault: VaultData, expected?: string | null) {
  const envelope = await encryptVault(accountId, key, vault);
  const serialized = JSON.stringify(envelope);
  if (expected !== undefined && storage().getItem(`${VAULT_PREFIX}${accountId}`) !== expected) {
    throw new AuthError('storage', '另一个页面已修改本机档案，请重新登录后再保存，避免覆盖新内容。');
  }
  try {
    storage().setItem(`${VAULT_PREFIX}${accountId}`, serialized);
  } catch {
    throw new AuthError('storage', '加密档案保存失败，请检查浏览器存储空间。');
  }
  return serialized;
}

function scheduleVaultPersistence(session: ActiveSession, update: (vault: VaultData) => VaultData) {
  const commit = async () => {
    const next = update(structuredClone(session.vault));
    next.updatedAt = new Date().toISOString();
    const envelope = await writeVault(session.account.id, session.key, next, session.envelope);
    session.vault = next;
    session.envelope = envelope;
  };
  persistQueue = persistQueue.catch(() => undefined).then(() => globalThis.navigator?.locks
    ? navigator.locks.request(`shanyi-vault:${session.account.id}`, commit) : commit());
  void persistQueue.catch(error => {
    if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent('shanyi-storage-error', { detail: error.message }));
  });
  return persistQueue;
}

function publicProfile({ id, username, displayName, createdAt }: AccountProfile): AccountProfile {
  return { id, username, displayName, createdAt };
}

export async function registerLocalAccount(input: { username: string; displayName: string; password: string }): Promise<AuthResult> {
  const username = normalizeUsername(input.username);
  const displayName = input.displayName.trim();
  validateRegistration(username, displayName, input.password);
  const accounts = readAccounts();
  if (accounts.length >= MAX_ACCOUNTS) throw new AuthError('storage', `当前浏览器最多建立 ${MAX_ACCOUNTS} 个本机账号。`);
  if (accounts.some((account) => account.username === username)) throw new AuthError('exists', '该账号已存在，请直接登录。');

  const salt = randomBytes(16);
  const { verifier, key } = await deriveCredentials(input.password, salt, PBKDF2_ITERATIONS);
  const account: StoredAccount = {
    id: globalThis.crypto.randomUUID(),
    username,
    displayName,
    createdAt: new Date().toISOString(),
    salt: bytesToBase64(salt),
    verifier,
    iterations: PBKDF2_ITERATIONS,
  };
  const merged = mergeLegacyData(emptyVault());
  const envelope = await writeVault(account.id, key, merged.vault);
  try {
    writeAccounts([...accounts, account]);
  } catch (error) {
    storage().removeItem(`${VAULT_PREFIX}${account.id}`);
    throw error;
  }
  activeSession = { account: publicProfile(account), key, vault: merged.vault, envelope };
  removeLegacyData();
  return { account: publicProfile(account), migratedArchives: merged.migratedArchives };
}

export async function loginLocalAccount(usernameInput: string, password: string): Promise<AuthResult> {
  const username = normalizeUsername(usernameInput);
  const stored = readAccounts().find((account) => account.username === username);
  if (!stored || !password) throw new AuthError('credentials', '账号或密码错误。');
  const derived = await deriveCredentials(password, base64ToBytes(stored.salt), stored.iterations);
  if (!constantTimeEqual(derived.verifier, stored.verifier)) throw new AuthError('credentials', '账号或密码错误。');
  const rawEnvelope = storage().getItem(`${VAULT_PREFIX}${stored.id}`);
  const vault = rawEnvelope ? await decryptVault(stored.id, derived.key, JSON.parse(rawEnvelope) as VaultEnvelope) : emptyVault();
  const merged = mergeLegacyData(vault);
  let envelope = rawEnvelope;
  if (merged.migratedArchives || Object.keys(readLegacyData().profileStorage).length) {
    envelope = await writeVault(stored.id, derived.key, merged.vault, rawEnvelope);
    removeLegacyData();
  }
  activeSession = { account: publicProfile(stored), key: derived.key, vault: merged.vault, envelope };
  return { account: publicProfile(stored), migratedArchives: merged.migratedArchives };
}

export function getActiveAccount(): AccountProfile | null {
  if (!activeSession) return null;
  const { id, username, displayName, createdAt } = activeSession.account;
  return { id, username, displayName, createdAt };
}

export function getVaultArchives<T>(): T[] {
  return activeSession ? [...activeSession.vault.archives] as T[] : [];
}

export function setVaultArchives(records: unknown[]) {
  if (!activeSession) return Promise.resolve();
  const archives = structuredClone(records);
  return scheduleVaultPersistence(activeSession, vault => ({ ...vault, archives }));
}

export function readProfileValue<T>(key: string, fallback: T): T {
  const value = activeSession?.vault.profileStorage[key];
  if (value === undefined) return fallback;
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}

export function writeProfileValue(key: string, value: unknown) {
  if (!activeSession) return Promise.resolve();
  const serialized = JSON.stringify(value);
  return scheduleVaultPersistence(activeSession, vault => ({ ...vault, profileStorage: { ...vault.profileStorage, [key]: serialized } }));
}

export function exportActiveVault() {
  if (!activeSession) return { archives: [], profileStorage: {} };
  return structuredClone({ archives: activeSession.vault.archives, profileStorage: activeSession.vault.profileStorage });
}

export async function clearActiveVault() {
  if (!activeSession) return;
  await scheduleVaultPersistence(activeSession, () => emptyVault());
}

export async function logoutLocalAccount() {
  await persistQueue.catch(() => undefined);
  activeSession = null;
}

export async function deleteActiveAccount() {
  if (!activeSession) return;
  await persistQueue.catch(() => undefined);
  const accountId = activeSession.account.id;
  writeAccounts(readAccounts().filter((account) => account.id !== accountId));
  storage().removeItem(`${VAULT_PREFIX}${accountId}`);
  activeSession = null;
}
