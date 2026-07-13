import type { BaziReading, BirthInput } from './core/types';

export const POLICY_VERSION = '2026-07-13';

export type ArchiveRecord = {
  id: string;
  input: BirthInput;
  pillars: string;
  calculationVersion?: string;
  updatedAt: string;
  createdAt: string;
};

export type PrivacyPreferences = {
  acceptedAt: string;
  analytics: boolean;
  version: string;
};

export type FeedbackPayload = {
  category: string;
  message: string;
  contact?: string;
};

const ARCHIVE_KEY = 'shanyi-archives-v1';
const PRIVACY_KEY = 'shanyi-privacy-v1';
const FEEDBACK_KEY = 'shanyi-feedback-queue-v1';
const EVENTS_KEY = 'shanyi-analytics-events-v1';
const ERRORS_KEY = 'shanyi-client-errors-v1';

function readJson<T>(key: string, fallback: T): T {
  try {
    return JSON.parse(window.localStorage.getItem(key) || '') as T;
  } catch {
    return fallback;
  }
}

function writeJson(key: string, value: unknown) {
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // The public beta remains usable when storage is blocked.
  }
}

function createId() {
  return globalThis.crypto?.randomUUID?.() ?? `local-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

export const archiveRepository = {
  list(): ArchiveRecord[] {
    return readJson<ArchiveRecord[]>(ARCHIVE_KEY, []).sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  },
  save(input: BirthInput, reading: BaziReading, existingId?: string) {
    const records = this.list();
    const existing = records.find((record) => record.id === existingId) ?? records.find((record) => record.input.name === input.name && record.input.birthDate === input.birthDate && record.input.birthTime === input.birthTime);
    const now = new Date().toISOString();
    const record: ArchiveRecord = {
      id: existing?.id ?? createId(),
      input,
      pillars: reading.pillars.map((pillar) => pillar.ganZhi).join(' '),
      calculationVersion: reading.calculation.version,
      createdAt: existing?.createdAt ?? now,
      updatedAt: now,
    };
    writeJson(ARCHIVE_KEY, [record, ...records.filter((item) => item.id !== record.id)].slice(0, 30));
    return record;
  },
  remove(id: string) {
    writeJson(ARCHIVE_KEY, this.list().filter((record) => record.id !== id));
  },
  clear() {
    writeJson(ARCHIVE_KEY, []);
  },
};

export function getPrivacyPreferences(): PrivacyPreferences | null {
  return readJson<PrivacyPreferences | null>(PRIVACY_KEY, null);
}

export function savePrivacyPreferences(analytics: boolean) {
  const preferences = { acceptedAt: new Date().toISOString(), analytics, version: POLICY_VERSION };
  writeJson(PRIVACY_KEY, preferences);
  return preferences;
}

export function clearLocalProductData() {
  [ARCHIVE_KEY, PRIVACY_KEY, FEEDBACK_KEY, EVENTS_KEY, ERRORS_KEY, 'shanyi-quiz-attempts', 'shanyi-classic-bookmarks', 'shanyi-classic-positions', 'shanyi-learning-progress'].forEach((key) => {
    try {
      window.localStorage.removeItem(key);
    } catch {
      // Ignore unavailable storage.
    }
  });
}

export function exportLocalProductData() {
  return {
    exportedAt: new Date().toISOString(),
    archives: archiveRepository.list(),
    preferences: getPrivacyPreferences(),
    feedback: readJson<unknown[]>(FEEDBACK_KEY, []),
    learning: {
      attempts: readJson('shanyi-quiz-attempts', {}),
      bookmarks: readJson('shanyi-classic-bookmarks', []),
      positions: readJson('shanyi-classic-positions', {}),
      progress: readJson('shanyi-learning-progress', []),
    },
  };
}

export function trackEvent(name: string, properties: Record<string, string | number | boolean> = {}) {
  if (!getPrivacyPreferences()?.analytics) return;
  const event = { name, properties, at: new Date().toISOString() };
  const events = readJson<unknown[]>(EVENTS_KEY, []);
  writeJson(EVENTS_KEY, [...events, event].slice(-100));
  const endpoint = import.meta.env.VITE_ANALYTICS_ENDPOINT;
  if (endpoint) void fetch(endpoint, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(event), keepalive: true }).catch(() => undefined);
}

export async function submitFeedback(payload: FeedbackPayload) {
  const item = { ...payload, id: createId(), createdAt: new Date().toISOString(), status: 'queued' };
  const endpoint = import.meta.env.VITE_FEEDBACK_ENDPOINT;
  if (endpoint) {
    const response = await fetch(endpoint, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(item) });
    if (!response.ok) throw new Error(`反馈提交失败（${response.status}）`);
    return { remote: true };
  }
  writeJson(FEEDBACK_KEY, [...readJson<unknown[]>(FEEDBACK_KEY, []), item].slice(-30));
  return { remote: false };
}

export function recordClientError(error: Error, componentStack?: string) {
  const errors = readJson<unknown[]>(ERRORS_KEY, []);
  writeJson(ERRORS_KEY, [...errors, { message: error.message, stack: error.stack, componentStack, at: new Date().toISOString() }].slice(-20));
}
