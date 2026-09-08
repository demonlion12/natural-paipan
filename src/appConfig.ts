import type { BirthInput, DeepDomainKey, ElementName } from './core/types';
export const initialInput: BirthInput = {
  name: '未命名',
  gender: 'male',
  birthDate: '1990-01-01',
  birthTime: '00:00',
  birthplace: '北京',
  latitude: 39.9042,
  calendarType: 'solar',
  lunarLeapMonth: false,
  timezoneOffset: 8,
  longitude: 116.4074,
  timeMode: 'clock',
  daylightSaving: false,
  dayBoundary: 'midnight',
  unknownHour: false,
  birthTimeSource: 'family',
  uncertaintyMinutes: 30,
};

export type AppStep = 'login' | 'home' | 'birth' | 'report' | 'yijing' | 'learning';
export type PolicyView = 'privacy' | 'terms' | 'boundary' | 'data';
export type NavTarget = 'paipan' | 'element' | 'useful' | 'professional' | 'luck' | 'detail';
export type ClassicKey = 'qiongtong' | 'ditiansui' | 'sanming' | 'tiyao' | 'ziping' | 'yuanhai' | 'tianyuan' | 'shenfeng' | 'qianli' | 'wuxing' | 'lixu';
export type DiagramTab = 'ganzhi' | 'flow' | 'palace' | 'kinship';
export type { YaoValue } from './core/types';
export const deepDomainOrder: DeepDomainKey[] = ['summary', 'career', 'wealth', 'relationship', 'health', 'family'];
export const elementCycleOrder: ElementName[] = ['木', '火', '土', '金', '水'];

export const classicTabs: Array<{ key: ClassicKey; label: string }> = [
  { key: 'qiongtong', label: '穷通宝鉴' },
  { key: 'ditiansui', label: '滴天髓' },
  { key: 'sanming', label: '三命通会' },
  { key: 'tiyao', label: '八字提要' },
  { key: 'ziping', label: '子平真诠' },
  { key: 'yuanhai', label: '渊海子平' },
  { key: 'tianyuan', label: '天元巫咸' },
  { key: 'shenfeng', label: '神峰通考' },
  { key: 'qianli', label: '千里命稿' },
  { key: 'wuxing', label: '五行精纪' },
  { key: 'lixu', label: '李虚中命书' },
];

export async function createReadingSafely(input: BirthInput) {
  try {
    const { readingService } = await import('./adapters/readingService');
    return { reading: await readingService.createReading(input), error: '' };
  } catch (error) {
    return {
      reading: null,
      error: error instanceof Error ? error.message : '排盘失败，请检查输入',
    };
  }
}
