import { useEffect, useMemo, useRef, useState } from 'react';
import type { FormEvent, RefObject } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  CalendarDays,
  Clock3,
  Copy,
  Download,
  Edit3,
  FileText,
  LogIn,
  MapPin,
  RefreshCw,
  RotateCcw,
  Sparkles,
  UserRound,
} from 'lucide-react';
import { Solar } from 'lunar-javascript';
import { readingService } from './adapters/readingService';
import type { BaziReading, BirthInput, DeepDomainKey, ElementName } from './core/types';

const initialInput: BirthInput = {
  name: '1232',
  gender: 'male',
  birthDate: '1990-01-01',
  birthTime: '00:00',
  birthplace: '未知地 北京时间',
};

type AppStep = 'login' | 'birth' | 'report';
type NavTarget = 'paipan' | 'element' | 'useful' | 'professional' | 'luck' | 'detail';
type ClassicKey = 'qiongtong' | 'ditiansui' | 'sanming' | 'tiyao' | 'ziping' | 'yuanhai' | 'tianyuan' | 'shenfeng' | 'qianli' | 'wuxing' | 'lixu';
type DiagramTab = 'ganzhi' | 'flow' | 'palace' | 'kinship';
const deepDomainOrder: DeepDomainKey[] = ['summary', 'career', 'wealth', 'relationship', 'health', 'family'];

const classicTabs: Array<{ key: ClassicKey; label: string }> = [
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

function createReadingSafely(input: BirthInput) {
  try {
    return { reading: readingService.createReading(input), error: '' };
  } catch (error) {
    return {
      reading: null,
      error: error instanceof Error ? error.message : '排盘失败，请检查输入',
    };
  }
}

const elementIcon: Record<string, string> = {
  木: '🌱',
  火: '🔥',
  土: '⛰',
  金: '⚒',
  水: '💧',
};

const branchElement: Record<string, string> = {
  子: '水',
  丑: '土',
  寅: '木',
  卯: '木',
  辰: '土',
  巳: '火',
  午: '火',
  未: '土',
  申: '金',
  酉: '金',
  戌: '土',
  亥: '水',
};

const elementGenerates: Record<ElementName, ElementName> = {
  木: '火',
  火: '土',
  土: '金',
  金: '水',
  水: '木',
};

const elementControls: Record<ElementName, ElementName> = {
  木: '土',
  火: '金',
  土: '水',
  金: '木',
  水: '火',
};

const elementControlledBy: Record<ElementName, ElementName> = {
  木: '金',
  火: '水',
  土: '木',
  金: '火',
  水: '土',
};

const seasonProfileByBranch: Record<string, { season: string; climate: string; priority: string; adjustment: ElementName[] }> = {
  寅: { season: '初春', climate: '木气初升，余寒未退', priority: '先扶生机，再防寒湿滞木。', adjustment: ['火', '木'] },
  卯: { season: '仲春', climate: '木旺风动，生发最盛', priority: '宜疏木成材，忌木多无制。', adjustment: ['火', '金'] },
  辰: { season: '暮春', climate: '湿土收春，木气入库', priority: '宜燥湿通关，防土湿困木。', adjustment: ['火', '木'] },
  巳: { season: '初夏', climate: '火气渐旺，燥象初成', priority: '宜取水润燥，兼看土金是否承接。', adjustment: ['水', '金'] },
  午: { season: '仲夏', climate: '火旺炎上，燥热最显', priority: '先取水调候，再以金生水。', adjustment: ['水', '金'] },
  未: { season: '季夏', climate: '燥土含火，暑气未退', priority: '宜润土降燥，使气能下行。', adjustment: ['水', '金'] },
  申: { season: '初秋', climate: '金气初肃，余热尚存', priority: '宜火炼金、水平燥，忌寒燥偏枯。', adjustment: ['火', '水'] },
  酉: { season: '仲秋', climate: '金旺肃杀，燥气明显', priority: '宜火暖金，亦需水润其燥。', adjustment: ['火', '水'] },
  戌: { season: '暮秋', climate: '燥土收金，火入墓库', priority: '宜水润燥土，木疏土闭。', adjustment: ['水', '木'] },
  亥: { season: '初冬', climate: '水势渐旺，寒气已起', priority: '先取火暖局，再看木能否引火。', adjustment: ['火', '木'] },
  子: { season: '仲冬', climate: '水旺寒凝，阳气初萌', priority: '调候首重火暖，土可堤水，木可引火。', adjustment: ['火', '土'] },
  丑: { season: '季冬', climate: '寒湿之土，水气入库', priority: '宜火暖寒湿，木疏冻土。', adjustment: ['火', '木'] },
};

const palaceMeanings: Record<string, { title: string; time: string; space: string; body: string; people: string[] }> = {
  year: { title: '祖辈宫', time: '少年 1~18岁', space: '远方、祖籍', body: '头部、颈部', people: ['长辈', '外人', '祖上'] },
  month: { title: '父母宫 / 兄弟宫 / 事业宫', time: '青年 18~36岁', space: '家乡、成长环境', body: '胸背、脊柱、肩背', people: ['父母', '兄弟', '同事', '领导'] },
  day: { title: '夫妻宫 / 自身宫', time: '中年 36~48岁', space: '住所、工作场所', body: '腹部、心脏、内脏', people: ['自己', '配偶', '至亲之人'] },
  time: { title: '子女宫', time: '晚年 48岁往后', space: '门户、房子附近', body: '下肢、泌尿系统', people: ['子女', '晚辈', '学生', '下属'] },
};

const kinshipByTenGod: Record<string, { family: string[]; social: string[] }> = {
  日主: { family: ['自己', '自身', '配偶宫核心'], social: ['自我定位', '决策中心', '承载力'] },
  比肩: { family: ['兄弟', '姐妹', '同辈'], social: ['同性朋友', '同业竞争', '合伙人'] },
  劫财: { family: ['兄弟', '姐弟', '同辈'], social: ['竞争者', '合伙人', '资源分配'] },
  食神: { family: ['子女', '晚辈', '孙辈'], social: ['学生', '下属', '作品输出'] },
  伤官: { family: ['子女', '晚辈', '外向表达'], social: ['创作者', '表达力', '规则冲突'] },
  偏财: { family: ['父亲', '外缘', '妻缘参考'], social: ['客户', '资源', '商业机会'] },
  正财: { family: ['妻子', '父亲参考', '稳定财'], social: ['现金流', '执行资源', '合作收益'] },
  七杀: { family: ['压力来源', '子女参考'], social: ['上级压力', '竞争者', '纪律'] },
  正官: { family: ['丈夫参考', '规则长辈'], social: ['上司', '政府', '职位名分'] },
  偏印: { family: ['母系长辈', '助力', '精神追求'], social: ['贵人', '专业方法', '非标资源'] },
  正印: { family: ['母亲', '长辈', '保护者'], social: ['学历', '证书', '贵人庇护'] },
};

const stemElement: Record<string, string> = {
  甲: '木',
  乙: '木',
  丙: '火',
  丁: '火',
  戊: '土',
  己: '土',
  庚: '金',
  辛: '金',
  壬: '水',
  癸: '水',
};

const stemPolarity: Record<string, '阳' | '阴'> = {
  甲: '阳',
  乙: '阴',
  丙: '阳',
  丁: '阴',
  戊: '阳',
  己: '阴',
  庚: '阳',
  辛: '阴',
  壬: '阳',
  癸: '阴',
};

const branchHiddenStems: Record<string, string[]> = {
  子: ['癸'],
  丑: ['己', '癸', '辛'],
  寅: ['甲', '丙', '戊'],
  卯: ['乙'],
  辰: ['戊', '乙', '癸'],
  巳: ['丙', '庚', '戊'],
  午: ['丁', '己'],
  未: ['己', '丁', '乙'],
  申: ['庚', '壬', '戊'],
  酉: ['辛'],
  戌: ['戊', '辛', '丁'],
  亥: ['壬', '甲'],
};

const stems = ['甲', '乙', '丙', '丁', '戊', '己', '庚', '辛', '壬', '癸'];
const branches = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥'];
const monthBranches = ['寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥', '子', '丑'];
const monthTerms = ['立春', '惊蛰', '清明', '立夏', '芒种', '小暑', '立秋', '白露', '寒露', '立冬', '大雪', '小寒'];
const monthTermDates = [
  { month: 2, day: 4 },
  { month: 3, day: 5 },
  { month: 4, day: 5 },
  { month: 5, day: 5 },
  { month: 6, day: 6 },
  { month: 7, day: 7 },
  { month: 8, day: 7 },
  { month: 9, day: 7 },
  { month: 10, day: 8 },
  { month: 11, day: 7 },
  { month: 12, day: 7 },
  { month: 1, day: 5 },
];
const dayMs = 24 * 60 * 60 * 1000;

const tianYiMap: Record<string, string[]> = {
  甲: ['丑', '未'],
  戊: ['丑', '未'],
  庚: ['丑', '未'],
  乙: ['子', '申'],
  己: ['子', '申'],
  丙: ['亥', '酉'],
  丁: ['亥', '酉'],
  壬: ['卯', '巳'],
  癸: ['卯', '巳'],
  辛: ['寅', '午'],
};

const wenChangMap: Record<string, string> = {
  甲: '巳',
  乙: '午',
  丙: '申',
  丁: '酉',
  戊: '申',
  己: '酉',
  庚: '亥',
  辛: '子',
  壬: '寅',
  癸: '卯',
};

const luShenMap: Record<string, string> = {
  甲: '寅',
  乙: '卯',
  丙: '巳',
  丁: '午',
  戊: '巳',
  己: '午',
  庚: '申',
  辛: '酉',
  壬: '亥',
  癸: '子',
};

const yangRenMap: Record<string, string> = {
  甲: '卯',
  乙: '寅',
  丙: '午',
  丁: '巳',
  戊: '午',
  己: '巳',
  庚: '酉',
  辛: '申',
  壬: '子',
  癸: '亥',
};

const taiJiMap: Record<string, string[]> = {
  甲: ['子', '午'],
  乙: ['子', '午'],
  丙: ['卯', '酉'],
  丁: ['卯', '酉'],
  戊: ['辰', '戌', '丑', '未'],
  己: ['辰', '戌', '丑', '未'],
  庚: ['寅', '亥'],
  辛: ['寅', '亥'],
  壬: ['巳', '申'],
  癸: ['巳', '申'],
};

const guoYinMap: Record<string, string> = {
  甲: '戌',
  乙: '亥',
  丙: '丑',
  丁: '寅',
  戊: '丑',
  己: '寅',
  庚: '辰',
  辛: '巳',
  壬: '未',
  癸: '申',
};

const fuXingMap: Record<string, string> = {
  甲: '寅',
  乙: '丑',
  丙: '子',
  丁: '亥',
  戊: '申',
  己: '未',
  庚: '午',
  辛: '巳',
  壬: '辰',
  癸: '卯',
};

const tianChuMap: Record<string, string> = {
  甲: '巳',
  乙: '午',
  丙: '巳',
  丁: '午',
  戊: '申',
  己: '酉',
  庚: '亥',
  辛: '子',
  壬: '寅',
  癸: '卯',
};

const jinYuMap: Record<string, string> = {
  甲: '辰',
  乙: '巳',
  丙: '未',
  丁: '申',
  戊: '未',
  己: '申',
  庚: '戌',
  辛: '亥',
  壬: '丑',
  癸: '寅',
};

const hongYanMap: Record<string, string> = {
  甲: '午',
  乙: '申',
  丙: '寅',
  丁: '未',
  戊: '辰',
  己: '辰',
  庚: '戌',
  辛: '酉',
  壬: '子',
  癸: '申',
};

const hongLuanMap: Record<string, string> = {
  子: '卯',
  丑: '寅',
  寅: '丑',
  卯: '子',
  辰: '亥',
  巳: '戌',
  午: '酉',
  未: '申',
  申: '未',
  酉: '午',
  戌: '巳',
  亥: '辰',
};

const tianXiMap: Record<string, string> = {
  子: '酉',
  丑: '申',
  寅: '未',
  卯: '午',
  辰: '巳',
  巳: '辰',
  午: '卯',
  未: '寅',
  申: '丑',
  酉: '子',
  戌: '亥',
  亥: '戌',
};

const tianDeMap: Record<string, string[]> = {
  寅: ['丁'],
  卯: ['申'],
  辰: ['壬'],
  巳: ['辛'],
  午: ['亥'],
  未: ['甲'],
  申: ['癸'],
  酉: ['寅'],
  戌: ['丙'],
  亥: ['乙'],
  子: ['巳'],
  丑: ['庚'],
};

const yueDeMap: Record<string, string[]> = {
  寅: ['丙'],
  午: ['丙'],
  戌: ['丙'],
  申: ['壬'],
  子: ['壬'],
  辰: ['壬'],
  亥: ['甲'],
  卯: ['甲'],
  未: ['甲'],
  巳: ['庚'],
  酉: ['庚'],
  丑: ['庚'],
};

const combinePairs = [
  ['甲', '己', '甲己合土'],
  ['乙', '庚', '乙庚合金'],
  ['丙', '辛', '丙辛合水'],
  ['丁', '壬', '丁壬合木'],
  ['戊', '癸', '戊癸合火'],
];

const branchRelations = [
  ['子', '午', '子午冲'],
  ['丑', '未', '丑未冲'],
  ['寅', '申', '寅申冲'],
  ['卯', '酉', '卯酉冲'],
  ['辰', '戌', '辰戌冲'],
  ['巳', '亥', '巳亥冲'],
  ['子', '丑', '子丑合'],
  ['寅', '亥', '寅亥合'],
  ['卯', '戌', '卯戌合'],
  ['辰', '酉', '辰酉合'],
  ['巳', '申', '巳申合'],
  ['午', '未', '午未合'],
  ['子', '卯', '子卯刑'],
  ['寅', '巳', '寅巳刑'],
  ['巳', '申', '巳申刑'],
  ['丑', '戌', '丑戌刑'],
  ['戌', '未', '戌未刑'],
  ['子', '未', '子未害'],
  ['丑', '午', '丑午害'],
  ['寅', '巳', '寅巳害'],
  ['卯', '辰', '卯辰害'],
  ['申', '亥', '申亥害'],
  ['酉', '戌', '酉戌害'],
];

function collectPairNotes(values: string[], rules: string[][], fallback: string) {
  const notes = new Set<string>();
  rules.forEach(([a, b, label]) => {
    if (values.includes(a) && values.includes(b)) {
      notes.add(label);
    }
  });
  return notes.size ? [...notes].join('，') : fallback;
}

function advanceGanZhi(baseGanZhi: string, offset: number) {
  const [stem, branch] = baseGanZhi.split('');
  const stemIndex = stems.indexOf(stem);
  const branchIndex = branches.indexOf(branch);
  if (stemIndex < 0 || branchIndex < 0) {
    return baseGanZhi;
  }
  return `${stems[(stemIndex + offset + stems.length * 20) % stems.length]}${branches[(branchIndex + offset + branches.length * 20) % branches.length]}`;
}

function getTenGod(dayStem: string, targetStem: string) {
  const dayElement = stemElement[dayStem];
  const targetElement = stemElement[targetStem];
  const samePolarity = stemPolarity[dayStem] === stemPolarity[targetStem];

  if (!dayElement || !targetElement) {
    return '-';
  }
  if (dayElement === targetElement) {
    return samePolarity ? '比肩' : '劫财';
  }
  if (
    (dayElement === '木' && targetElement === '火') ||
    (dayElement === '火' && targetElement === '土') ||
    (dayElement === '土' && targetElement === '金') ||
    (dayElement === '金' && targetElement === '水') ||
    (dayElement === '水' && targetElement === '木')
  ) {
    return samePolarity ? '食神' : '伤官';
  }
  if (
    (targetElement === '木' && dayElement === '火') ||
    (targetElement === '火' && dayElement === '土') ||
    (targetElement === '土' && dayElement === '金') ||
    (targetElement === '金' && dayElement === '水') ||
    (targetElement === '水' && dayElement === '木')
  ) {
    return samePolarity ? '偏印' : '正印';
  }
  if (
    (dayElement === '木' && targetElement === '土') ||
    (dayElement === '火' && targetElement === '金') ||
    (dayElement === '土' && targetElement === '水') ||
    (dayElement === '金' && targetElement === '木') ||
    (dayElement === '水' && targetElement === '火')
  ) {
    return samePolarity ? '偏财' : '正财';
  }
  return samePolarity ? '七杀' : '正官';
}

function getBranchGroupStar(referenceBranch: string, targetBranch: string, map: Record<string, string[]>, label: string) {
  const matched = Object.entries(map).find(([branchesInGroup, starBranch]) => {
    return branchesInGroup.includes(referenceBranch) && starBranch.includes(targetBranch);
  });
  return matched ? label : '';
}

function getElementRelation(fromElement: string, toElement: string) {
  if (!fromElement || !toElement) {
    return '待定';
  }
  if (fromElement === toElement) {
    return '助';
  }
  if (elementGenerates[fromElement as ElementName] === toElement) {
    return '生';
  }
  if (elementGenerates[toElement as ElementName] === fromElement) {
    return '泄';
  }
  if (elementControls[fromElement as ElementName] === toElement) {
    return '克';
  }
  if (elementControls[toElement as ElementName] === fromElement) {
    return '受克';
  }
  return '制化';
}

function getPairRelations(a: string, b: string, rules: string[][]) {
  return rules.filter(([left, right]) => (left === a && right === b) || (left === b && right === a)).map(([, , label]) => label);
}

function getShenShaForBranch(reading: BaziReading, targetStem: string, targetBranch: string) {
  const dayStem = reading.dayMaster.stem;
  const dayBranch = reading.pillars.find((pillar) => pillar.key === 'day')?.branch ?? '';
  const yearBranch = reading.pillars.find((pillar) => pillar.key === 'year')?.branch ?? '';
  const monthBranch = reading.pillars.find((pillar) => pillar.key === 'month')?.branch ?? '';
  const stars = new Set<string>();

  if ((tianYiMap[dayStem] ?? []).includes(targetBranch)) {
    stars.add('天乙贵人');
  }
  if ((taiJiMap[dayStem] ?? []).includes(targetBranch)) {
    stars.add('太极贵人');
  }
  if (wenChangMap[dayStem] === targetBranch) {
    stars.add('文昌贵人');
  }
  if (guoYinMap[dayStem] === targetBranch) {
    stars.add('国印贵人');
  }
  if (fuXingMap[dayStem] === targetBranch) {
    stars.add('福星贵人');
  }
  if (tianChuMap[dayStem] === targetBranch) {
    stars.add('天厨贵人');
  }
  if (luShenMap[dayStem] === targetBranch) {
    stars.add('禄神');
  }
  if (yangRenMap[dayStem] === targetBranch) {
    stars.add('羊刃');
  }
  if (jinYuMap[dayStem] === targetBranch) {
    stars.add('金舆');
  }
  if (hongYanMap[dayStem] === targetBranch) {
    stars.add('红艳');
  }
  if ((tianDeMap[monthBranch] ?? []).includes(targetStem) || (tianDeMap[monthBranch] ?? []).includes(targetBranch)) {
    stars.add('天德贵人');
  }
  if ((yueDeMap[monthBranch] ?? []).includes(targetStem) || (yueDeMap[monthBranch] ?? []).includes(targetBranch)) {
    stars.add('月德贵人');
  }
  if (hongLuanMap[yearBranch] === targetBranch) {
    stars.add('红鸾');
  }
  if (tianXiMap[yearBranch] === targetBranch) {
    stars.add('天喜');
  }

  const groupMaps = [
    { label: '桃花', map: { 申子辰: ['酉'], 寅午戌: ['卯'], 巳酉丑: ['午'], 亥卯未: ['子'] } },
    { label: '驿马', map: { 申子辰: ['寅'], 寅午戌: ['申'], 巳酉丑: ['亥'], 亥卯未: ['巳'] } },
    { label: '华盖', map: { 申子辰: ['辰'], 寅午戌: ['戌'], 巳酉丑: ['丑'], 亥卯未: ['未'] } },
    { label: '将星', map: { 申子辰: ['子'], 寅午戌: ['午'], 巳酉丑: ['酉'], 亥卯未: ['卯'] } },
    { label: '劫煞', map: { 申子辰: ['巳'], 寅午戌: ['亥'], 巳酉丑: ['寅'], 亥卯未: ['申'] } },
    { label: '灾煞', map: { 申子辰: ['午'], 寅午戌: ['子'], 巳酉丑: ['卯'], 亥卯未: ['酉'] } },
    { label: '亡神', map: { 申子辰: ['亥'], 寅午戌: ['巳'], 巳酉丑: ['申'], 亥卯未: ['寅'] } },
  ];
  [dayBranch, yearBranch].filter(Boolean).forEach((referenceBranch) => {
    groupMaps.forEach((item) => {
      const star = getBranchGroupStar(referenceBranch, targetBranch, item.map, item.label);
      if (star) {
        stars.add(star);
      }
    });
  });
  [
    { label: '孤辰', map: { 亥子丑: ['寅'], 寅卯辰: ['巳'], 巳午未: ['申'], 申酉戌: ['亥'] } },
    { label: '寡宿', map: { 亥子丑: ['戌'], 寅卯辰: ['丑'], 巳午未: ['辰'], 申酉戌: ['未'] } },
  ].forEach((item) => {
    const star = getBranchGroupStar(yearBranch, targetBranch, item.map, item.label);
    if (star) {
      stars.add(star);
    }
  });

  if (targetStem === dayStem) {
    stars.add('伏吟');
  }
  return [...stars];
}

function createVirtualColumn(label: string, ganZhi: string, reading: BaziReading) {
  const [stem, branch] = ganZhi.split('');
  const hiddenStems = branchHiddenStems[branch] ?? [];
  return {
    label,
    ganZhi,
    stem,
    branch,
    hiddenStems,
    stemTenGod: getTenGod(reading.dayMaster.stem, stem),
    branchTenGods: hiddenStems.map((hiddenStem) => getTenGod(reading.dayMaster.stem, hiddenStem)),
    shenSha: getShenShaForBranch(reading, stem, branch),
    diShi: '-',
    xunKong: '-',
    naYin: '-',
  };
}

function getLuckPhase(period: BaziReading['daYun']['periods'][number]) {
  if (period.endAge <= 22) {
    return '成长期';
  }
  if (period.endAge <= 42) {
    return '立业期';
  }
  if (period.endAge <= 62) {
    return '沉淀期';
  }
  return '收束期';
}

function describeLuckPeriod(reading: BaziReading, period: BaziReading['daYun']['periods'][number]) {
  const [stem, branch] = period.ganZhi.split('');
  const stemWuXing = stemElement[stem] ?? '';
  const branchWuXing = branchElement[branch] ?? '';
  const usefulHits = [stemWuXing, branchWuXing].filter((element): element is ElementName =>
    reading.usefulElements.includes(element as ElementName),
  );
  const repeatsDominant = [stemWuXing, branchWuXing].includes(reading.structure.dominantElement);
  const branchNote = collectPairNotes(
    [...reading.pillars.map((pillar) => pillar.branch), branch],
    branchRelations,
    '与原局地支未见明显冲合刑害，更多看五行补偏与十神落点。',
  );
  const stemNote = collectPairNotes(
    [...reading.pillars.map((pillar) => pillar.stem), stem],
    combinePairs,
    '与原局天干未见明显合化，重点看该运天干所带出的做事方式。',
  );
  const theme = usefulHits.length
    ? `这步运带${usefulHits.join('、')}，能补命局所需，适合主动经营关键机会。`
    : repeatsDominant
      ? `这步运加重${reading.structure.dominantElement}气，优势会更明显，但也容易把原本的惯性放大。`
      : `这步运不直接落在首要喜用上，宜以稳定节奏和现实选择来借势。`;
  const action = period.isCurrent
    ? '当前正在此运，重要决定要同时看原局短板、流年触发和现实资源，不宜只凭一时情绪推进。'
    : period.startYear > new Date().getFullYear()
      ? '未来进入此运前，先把专业能力、现金流和关系边界准备好，届时更容易承接机会。'
      : '这步运可作为回测样本，回看学习、迁移、事业压力、关系变化是否在此阶段明显被触发。';

  return {
    action,
    branchNote,
    phase: getLuckPhase(period),
    stemNote,
    theme,
    usefulText: usefulHits.length ? `喜用触发：${usefulHits.join('、')}` : `喜用未显：以${reading.usefulElements.join('、')}为调候方向`,
  };
}

function GanZhiGlyph({ value, type }: { value: string; type: 'stem' | 'branch' }) {
  const element = type === 'stem' ? stemElement[value] : branchElement[value];

  return (
    <span className={`gz-glyph gz-${element}`}>
      {value}
      <small>{elementIcon[element]}</small>
    </span>
  );
}

function TopProfile({
  reading,
  onEdit,
  onCopy,
  onExport,
}: {
  reading: BaziReading;
  onEdit: () => void;
  onCopy: () => void;
  onExport: () => void;
}) {
  return (
    <section className="profile-banner">
      <div className="profile-seal">☯</div>
      <div className="profile-name">{reading.input.name || '未命名'}</div>
      <div className="profile-dates">
        <span>
          阴历：{reading.lunarText} {reading.pillars[3].branch}时
        </span>
        <span>阳历：{reading.solarText}</span>
      </div>
      <div className="profile-actions">
        <button className="edit-button" onClick={onEdit} type="button">
          <Edit3 size={16} />
          编辑
        </button>
        <button className="edit-button" onClick={onCopy} type="button">
          <Copy size={16} />
          复制
        </button>
        <button className="edit-button" onClick={onExport} type="button">
          <Download size={16} />
          导出
        </button>
      </div>
    </section>
  );
}

function AncientReference({ reading }: { reading: BaziReading }) {
  const [activeClassic, setActiveClassic] = useState<ClassicKey>('qiongtong');
  const [showReasoning, setShowReasoning] = useState(true);
  const dayStem = reading.dayMaster.stem;
  const monthBranch = reading.pillars[1].branch;
  const visibleStems = reading.pillars.map((pillar) => pillar.stem).join('、');
  const hiddenStems = [...new Set(reading.pillars.flatMap((pillar) => pillar.hiddenStems))].join('、');
  const useful = reading.usefulElements.join('、');
  const dominant = reading.structure.dominantElement;
  const missing = reading.structure.missingElements.join('、') || '五行不见明显缺口';

  const classicContent: Record<
    ClassicKey,
    {
      quote: string;
      source: string;
      chapter: string;
      sourceUrl?: string;
      status: '已校勘短引' | '待校勘短引';
      relevance: string;
      interpretation: string[];
    }
  > = {
    qiongtong: {
      quote: '十一月丙火，冬至一阳生，弱中复强。',
      source: '《穷通宝鉴》',
      chapter: '论丙火，子月条',
      sourceUrl: 'https://zh.wikisource.org/wiki/%E7%AA%AE%E9%80%9A%E5%AF%B6%E9%91%91',
      status: dayStem === '丙' && monthBranch === '子' ? '已校勘短引' : '待校勘短引',
      relevance:
        dayStem === '丙' && monthBranch === '子'
          ? '当前命盘为丙日、子月，此条可作为调候参考。'
          : `当前命盘为${dayStem}日、${monthBranch}月；本条先作为“按日主月令取调候”的方法示例，后续可接入完整日主月令原文库。`,
      interpretation: [
        `${monthBranch}月论命，先看月令寒暖燥湿，再看日主是否得令、得地、得助。此局日主为${dayStem}，${reading.dayMaster.strength}，不可只按五行数量取断，仍须合看月令、藏干与十神透出。`,
        `从盘面看，${dominant}气较显，${missing}为后天需调之处。若行运能引动${useful}，多主思路顺、资源顺、做事阻力减；若再逢耗泄太过，则宜守中取势，不宜强拧。`,
      ],
    },
    ditiansui: {
      quote: '欲识三元万法宗，先观帝载与神功。',
      source: '《滴天髓》',
      chapter: '通神论',
      sourceUrl: 'https://zh.wikisource.org/wiki/%E6%BB%B4%E5%A4%A9%E9%AB%93',
      status: '已校勘短引',
      relevance: `此条强调先看全局气势。当前命盘${dominant}气较显，喜用取${useful}，正适合从“气势是否流通”切入。`,
      interpretation: [
        `此局要点在“气势是否能流通”。${dominant}显则是天赋与惯性，若只旺而不通，现实中容易表现为某类反应过度；若能以${useful}疏导，则才气、判断和执行更容易落地。`,
        `看命不可见一字便断吉凶。年、月、日、时四柱需合看：年看根基，月看令气，日看自身，时看后劲。此局时柱为${reading.pillars[3].ganZhi}，后期更重能力沉淀。`,
      ],
    },
    sanming: {
      quote: '凡看命，以日干为主。',
      source: '《三命通会》',
      chapter: '论命总法相关条',
      sourceUrl: 'https://zh.wikisource.org/wiki/%E4%B8%89%E5%91%BD%E9%80%9A%E6%9C%83',
      status: '待校勘短引',
      relevance: `当前日主为${dayStem}，专业详批里所有十神、喜忌、岁运触发都应回到日主承受力来判断。`,
      interpretation: [
        `十神较显者为${reading.structure.highlightedTenGods.join('、') || '结构分散'}。这些不是标签，而是你在现实事务中的角色：有的主资源，有的主规则，有的主表达，有的主竞争。`,
        `格局有成有破，不宜强行套一个名称。若大运配合，优势能成事；若岁运冲动短板，则容易在人情、节奏、资源或规则上出现压力。`,
      ],
    },
    tiyao: {
      quote: '论命以日主为体，月令为提纲。',
      source: '《八字提要》',
      chapter: '定局提要',
      status: '待校勘短引',
      relevance: `当前命盘为${dayStem}日、${monthBranch}月，此条用于提示“先定日主，再看月令”的阅读顺序。`,
      interpretation: [
        `定盘简要：日主${dayStem}，生于${monthBranch}月，整体${reading.dayMaster.strength}。喜用偏向${useful}，忌一味加重${dominant}之偏。`,
        `现实落点：重要选择宜先问三件事：是否补足用神，是否减少内耗，是否能沉淀长期能力。若三者皆无，则短期热闹未必值得投入。`,
      ],
    },
    ziping: {
      quote: '八字用神，专求月令。',
      source: '《子平真诠》',
      chapter: '论用神',
      sourceUrl: 'https://zh.wikisource.org/wiki/%E5%AD%90%E5%B9%B3%E7%9C%9F%E8%A9%AE',
      status: '已校勘短引',
      relevance: `当前月柱为${reading.pillars[1].ganZhi}，月令决定气候和格局入口，所以不能只看日柱或单个神煞。`,
      interpretation: [
        `月柱${reading.pillars[1].ganZhi}为提纲，提纲定一局气候。此处要看${reading.pillars[1].stemTenGod}与藏干${reading.pillars[1].hiddenStems.join('、')}如何作用于日主。`,
        `若格局清，则事有主线；若混杂，则人生常需先筛选方向。你的盘面更适合把复杂机会收束成一条主线，不宜什么都抓。`,
      ],
    },
    yuanhai: {
      quote: '子平一法，专以日干为主。',
      source: '《渊海子平》',
      chapter: '论日为主',
      sourceUrl: 'https://zh.wikisource.org/wiki/%E6%B7%B5%E6%B5%B7%E5%AD%90%E5%B9%B3',
      status: '待校勘短引',
      relevance: `当前日主${dayStem}是十神换算的中心，财官印食伤都要看它与日主的关系，不宜单独贴标签。`,
      interpretation: [
        `此盘以日主${dayStem}为核心，先看月令${monthBranch}所主之气，再看透干${visibleStems}是否成局。若十神有情，则现实中做事有章法；若互相牵制，则容易一边想推进，一边被关系、资源或规则拖住。`,
        `从子平法看，${reading.structure.highlightedTenGods.join('、') || '十神分布较散'}为较醒目的事务角色。它们会具体落在工作分工、合作方式、财务节奏和人际边界上。`,
      ],
    },
    tianyuan: {
      quote: '甲己之年丙作首，乙庚之岁戊为头。',
      source: '《天元巫咸经》',
      chapter: '五虎遁月法相关条',
      sourceUrl: 'https://zh.wikisource.org/wiki/%E5%A4%A9%E5%85%83%E5%B7%AB%E5%92%B8%E7%B6%93',
      status: '待校勘短引',
      relevance: `此条偏向干支排布法。当前盘面透${visibleStems}，用于说明天干不是装饰，而是外显能力与岁运触发入口。`,
      interpretation: [
        `天干为外显之气，此局透${visibleStems}，说明外在表现不只看性格，还看机会来时你会先动用哪一类能力。${dayStem}日主遇${monthBranch}月，宜先定主气，再分清扶抑。`,
        `若岁运再引动${useful}，做事容易从“想明白”走到“做成形”；若岁运加重${dominant}之偏，则要防止判断过满、节奏过急或对单一方向投入过深。`,
      ],
    },
    shenfeng: {
      quote: '有病方为贵，无伤不是奇。',
      source: '《神峰通考》',
      chapter: '病药说相关条',
      sourceUrl: 'https://zh.wikisource.org/wiki/%E7%A5%9E%E5%B3%B0%E9%80%9A%E8%80%83',
      status: '已校勘短引',
      relevance: `当前命盘${dominant}较显，${missing}；从病药法看，重点不是说好坏，而是找失衡处与可调之物。`,
      interpretation: [
        `此局之“病”不必理解为坏，而是命局里最容易失衡的地方。${dominant}显，是优势也是惯性；${missing}，则是现实中需要后天经营的功课。`,
        `取“药”宜看${useful}。在选择行业、合作方式和长期方向时，凡能补${useful}、缓${dominant}之偏者，多半更利沉淀；反之，短期虽热，长期容易内耗。`,
      ],
    },
    qianli: {
      quote: '看命先看日主强弱。',
      source: '《千里命稿》',
      chapter: '强弱篇相关条',
      status: '待校勘短引',
      relevance: `当前日主判为${reading.dayMaster.strength}，这会影响事业、财务、关系建议是偏进取还是偏蓄势。`,
      interpretation: [
        `以现代应用看，此局不是单看旺弱，而要看“能力如何变现”。${reading.dayMaster.strength}时，行事最怕只凭情绪或短线反馈；能建立稳定节奏，优势更容易兑现。`,
        `事业上宜把${reading.structure.highlightedTenGods.slice(0, 3).join('、') || '主要十神'}对应的能力做成可复用方法。关系和财务上，则要用规则感降低反复消耗。`,
      ],
    },
    wuxing: {
      quote: '五行者，金木水火土也。',
      source: '《五行精纪》',
      chapter: '论五行',
      sourceUrl: 'https://zh.wikisource.org/wiki/%E4%BA%94%E8%A1%8C%E7%B2%BE%E7%B4%80',
      status: '待校勘短引',
      relevance: `当前五行以${dominant}较显，喜用${useful}。此条提示五行分析要落到生克循环，不只是百分比。`,
      interpretation: [
        `五行以${dominant}较显，${missing}为调候与平衡处。旺者不一定全吉，弱者不一定全凶，关键在生克是否形成通路。`,
        `若能以${useful}引通，则才华、资源与执行之间更顺；若一处太旺而无泄无制，现实中容易表现为执着、反复、急躁或长期疲惫。`,
      ],
    },
    lixu: {
      quote: '年为本，日为主。',
      source: '《李虚中命书》',
      chapter: '命书总论相关条',
      sourceUrl: 'https://zh.wikisource.org/wiki/%E6%9D%8E%E8%99%9B%E4%B8%AD%E5%91%BD%E6%9B%B8',
      status: '待校勘短引',
      relevance: `当前年柱${reading.pillars[0].ganZhi}看根基，日柱${reading.pillars[2].ganZhi}看自身承载，二者要合看。`,
      interpretation: [
        `年柱${reading.pillars[0].ganZhi}为根基气，月柱${reading.pillars[1].ganZhi}为成长环境与行事底色。早年受环境、规则、资源配置影响较明显，但真正成事仍要看日时与运势承接。`,
        `此局后劲要看时柱${reading.pillars[3].ganZhi}与大运配合。若阶段运能补${useful}，后期越能靠经验、专业和稳定输出打开空间。`,
      ],
    },
  };
  const currentClassic = classicContent[activeClassic];

  return (
    <article className="classic-panel">
      <h2>智能古籍参考</h2>
      <div className="classic-tabs">
        {classicTabs.map((tab) => (
          <button
            className={tab.key === activeClassic ? 'classic-tab active' : 'classic-tab'}
            key={tab.key}
            onClick={() => setActiveClassic(tab.key)}
            type="button"
          >
            {tab.label}
          </button>
        ))}
      </div>
      <div className="classic-body">
        <section className="classic-source-card">
          <div className="classic-source-meta">
            <span>古籍原文</span>
            <strong>{currentClassic.source}</strong>
            <em>{currentClassic.chapter}</em>
            <small>{currentClassic.status}</small>
          </div>
          <blockquote>{currentClassic.quote}</blockquote>
          {currentClassic.sourceUrl && (
            <a className="classic-source-link" href={currentClassic.sourceUrl} rel="noreferrer" target="_blank">
              查看文本来源
            </a>
          )}
        </section>
        <p>
          本八字：透 <mark>{visibleStems}</mark>，藏 <mark>{hiddenStems}</mark>
        </p>
        <section className="classic-interpretation">
          <h3>现代解读</h3>
          <p className="classic-hint">{currentClassic.relevance}</p>
        </section>
        <button className="classic-pill" onClick={() => setShowReasoning((value) => !value)} type="button">
          {showReasoning ? '收起现代解读' : `展开论${dayStem}生${monthBranch}月`}
        </button>
        {showReasoning && currentClassic.interpretation.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
        <p>
          原文短引用于定位经典论法，现代解读为系统根据当前命盘转译，并非绝对断语。命局定底色，大运定阶段，流年定触发，现实选择才定落点。
        </p>
      </div>
    </article>
  );
}

function PaipanSection({ reading, elementRef }: { reading: BaziReading; elementRef: RefObject<HTMLDivElement | null> }) {
  const stemNotes = collectPairNotes(reading.pillars.map((pillar) => pillar.stem), combinePairs, '无合冲关系');
  const branchNotes = collectPairNotes(reading.pillars.map((pillar) => pillar.branch), branchRelations, '未见明显冲合刑害');
  const rows = [
    { label: '主星', render: (pillar: BaziReading['pillars'][number]) => <strong>{pillar.stemTenGod}</strong> },
    { label: '天干', render: (pillar: BaziReading['pillars'][number]) => <GanZhiGlyph value={pillar.stem} type="stem" /> },
    { label: '地支', render: (pillar: BaziReading['pillars'][number]) => <GanZhiGlyph value={pillar.branch} type="branch" /> },
    {
      label: '藏干',
      render: (pillar: BaziReading['pillars'][number]) => (
        <span className="stacked-text">{pillar.hiddenStems.map((stem) => `${stem}${stemElement[stem]}`).join('\n')}</span>
      ),
    },
    {
      label: '副星',
      render: (pillar: BaziReading['pillars'][number]) => (
        <span className="stacked-text">{pillar.branchTenGods.join('\n') || '-'}</span>
      ),
    },
    { label: '星运', render: (pillar: BaziReading['pillars'][number]) => <span>{pillar.diShi}</span> },
    { label: '自坐', render: (pillar: BaziReading['pillars'][number]) => <span>{pillar.diShi}</span> },
    { label: '空亡', render: (pillar: BaziReading['pillars'][number]) => <span>{pillar.xunKong}</span> },
    { label: '纳音', render: (pillar: BaziReading['pillars'][number]) => <span>{pillar.naYin}</span> },
    {
      label: '神煞',
      render: (pillar: BaziReading['pillars'][number]) => (
        <span className="stacked-text shensha-text">{getShenShaForBranch(reading, pillar.stem, pillar.branch).join('\n') || '-'}</span>
      ),
    },
  ];

  return (
    <section className="paipan-section">
      <div className="paipan-grid">
        <article className="paipan-table-card">
          <div className="paipan-table">
            <div className="paipan-row paipan-head">
              <div>日期</div>
              {reading.pillars.map((pillar) => (
                <div key={pillar.key}>{pillar.label}</div>
              ))}
            </div>
            {rows.map((row) => (
              <div className="paipan-row" key={row.label}>
                <div className="row-label">{row.label}</div>
                {reading.pillars.map((pillar) => (
                  <div className="paipan-cell" key={`${row.label}-${pillar.key}`}>
                    {row.render(pillar)}
                  </div>
                ))}
              </div>
            ))}
          </div>
        </article>
        <div ref={elementRef}>
          <ElementBoard reading={reading} compact />
        </div>
      </div>
      <div className="paipan-notes">
        <p>
          <strong>天干留意：</strong>
          {stemNotes}
        </p>
        <p>
          <strong>地支留意：</strong>
          {branchNotes}
        </p>
      </div>
    </section>
  );
}

function ProfessionalChartPanel({ reading }: { reading: BaziReading }) {
  const currentYear = new Date().getFullYear();
  const flowColumnCount = 12;
  const [selectedYear, setSelectedYear] = useState(currentYear);
  const [selectedMonthIndex, setSelectedMonthIndex] = useState(Math.max(0, Math.min(11, new Date().getMonth() - 1)));
  const [selectedDayIndex, setSelectedDayIndex] = useState(0);
  const currentLuck =
    reading.daYun.periods.find((period) => selectedYear >= period.startYear && selectedYear <= period.endYear) ??
    reading.daYun.periods.find((period) => period.isCurrent) ??
    reading.daYun.periods[0];
  const currentYearGanZhi =
    reading.annual.year === selectedYear ? reading.annual.ganZhi : advanceGanZhi(reading.annual.ganZhi, selectedYear - reading.annual.year);
  const displayedLuckPeriods = Array.from({ length: flowColumnCount }, (_, index) => reading.daYun.periods[index] ?? null);
  const nextYears = Array.from({ length: flowColumnCount }, (_, index) => {
    const year = selectedYear + index;
    return {
      year,
      ganZhi: advanceGanZhi(currentYearGanZhi, index),
    };
  });
  const flowMonths = monthBranches.map((branch, index) => {
    const ganZhi = `${stems[(stems.indexOf(currentYearGanZhi[0]) * 2 + index + 2) % stems.length]}${branch}`;
    return {
      term: monthTerms[index],
      ganZhi,
    };
  });
  const getTermStart = (year: number, monthIndex: number) => {
    const termDate = monthTermDates[monthIndex];
    return new Date(monthIndex === 11 ? year + 1 : year, termDate.month - 1, termDate.day, 12, 0, 0);
  };
  const selectedTermStart = getTermStart(selectedYear, selectedMonthIndex);
  const nextTermStart = selectedMonthIndex === 11 ? getTermStart(selectedYear + 1, 0) : getTermStart(selectedYear, selectedMonthIndex + 1);
  const flowDayCount = Math.max(28, Math.round((nextTermStart.getTime() - selectedTermStart.getTime()) / dayMs));
  const flowDays = Array.from({ length: flowDayCount }, (_, index) => {
    const date = new Date(selectedTermStart);
    date.setDate(selectedTermStart.getDate() + index);
    const solar = Solar.fromYmdHms(date.getFullYear(), date.getMonth() + 1, date.getDate(), 12, 0, 0);
    const lunar = solar.getLunar();
    const ganZhi = lunar.getEightChar().getDay();
    return {
      label: lunar.getDayInChinese(),
      dateText: `${date.getMonth() + 1}/${date.getDate()}`,
      ganZhi,
    };
  });
  const currentMonth = flowMonths[selectedMonthIndex];
  const currentDay = flowDays[selectedDayIndex] ?? flowDays[0];
  const detailColumns = [
    createVirtualColumn('流日', currentDay.ganZhi, reading),
    createVirtualColumn('流月', currentMonth.ganZhi, reading),
    createVirtualColumn('流年', currentYearGanZhi, reading),
    createVirtualColumn('大运', currentLuck.ganZhi, reading),
    ...reading.pillars.map((pillar) => ({
      ...pillar,
      shenSha: getShenShaForBranch(reading, pillar.stem, pillar.branch),
    })),
  ];
  const stemNotes = collectPairNotes(detailColumns.map((column) => column.stem), combinePairs, '天干暂未见明显合化，重点看十神与五行补偏。');
  const branchNotes = collectPairNotes(detailColumns.map((column) => column.branch), branchRelations, '地支暂未见明显冲合刑害，重点看岁运是否引动原局。');
  const rows = [
    { label: '主星', render: (column: typeof detailColumns[number]) => <strong>{column.stemTenGod}</strong> },
    { label: '天干', render: (column: typeof detailColumns[number]) => <GanZhiGlyph value={column.stem} type="stem" /> },
    { label: '地支', render: (column: typeof detailColumns[number]) => <GanZhiGlyph value={column.branch} type="branch" /> },
    {
      label: '藏干',
      render: (column: typeof detailColumns[number]) => (
        <span className="stacked-text">{column.hiddenStems.map((stem) => `${stem}${stemElement[stem]}`).join('\n') || '-'}</span>
      ),
    },
    {
      label: '副星',
      render: (column: typeof detailColumns[number]) => <span className="stacked-text">{column.branchTenGods.join('\n') || '-'}</span>,
    },
    { label: '星运', render: (column: typeof detailColumns[number]) => <span>{column.diShi}</span> },
    { label: '空亡', render: (column: typeof detailColumns[number]) => <span>{column.xunKong}</span> },
    { label: '纳音', render: (column: typeof detailColumns[number]) => <span>{column.naYin}</span> },
    { label: '神煞', render: (column: typeof detailColumns[number]) => <span className="stacked-text shensha-text">{column.shenSha.join('\n') || '-'}</span> },
  ];

  return (
    <section className="section professional-chart-section">
      <div className="section-title">
        <h2>专业细盘</h2>
        <div className="professional-title-actions">
          <span>
            {selectedYear}流年 · {currentMonth.ganZhi}流月 · {currentDay.ganZhi}流日 · {currentLuck.ganZhi}大运
          </span>
        </div>
      </div>

      <div className="professional-grid">
        <article className="professional-table-card">
          <div className="professional-table">
            <div className="professional-row professional-head">
              <div>日期</div>
              {detailColumns.map((column) => (
                <div key={column.label}>{column.label}</div>
              ))}
            </div>
            {rows.map((row) => (
              <div className="professional-row" key={row.label}>
                <div className="row-label">{row.label}</div>
                {detailColumns.map((column) => (
                  <div className="paipan-cell" key={`${row.label}-${column.label}`}>
                    {row.render(column)}
                  </div>
                ))}
              </div>
            ))}
          </div>
        </article>

        <article className="flow-board">
          <div className="flow-board-head">
            <div>
              <strong>岁运盘</strong>
              <span>
                起运：{reading.daYun.startText} · {reading.daYun.direction}
              </span>
            </div>
            <small>日主：{reading.dayMaster.stem} · 点击大运 / 流年 / 流月 / 流日切换</small>
          </div>

          <div className="flow-stack">
            <div className="flow-matrix">
              <div className="flow-label">大运</div>
              {displayedLuckPeriods.map((period, index) =>
                period ? (
                  <button
                    type="button"
                    className={period.startYear === currentLuck.startYear ? 'flow-cell current' : 'flow-cell'}
                    key={`${period.startYear}-${period.ganZhi}`}
                    onClick={() => {
                      setSelectedYear(period.startYear);
                      setSelectedMonthIndex(0);
                      setSelectedDayIndex(0);
                    }}
                    aria-label={`切换到${period.startYear}年开始的${period.ganZhi}大运`}
                  >
                    <small>{period.startYear}</small>
                    <strong>{period.ganZhi}</strong>
                    <span>{getTenGod(reading.dayMaster.stem, period.ganZhi[0])}</span>
                  </button>
                ) : (
                  <div className="flow-cell" key={`luck-empty-${index}`}>
                    <span>-</span>
                  </div>
                )
              )}

              <div className="flow-label">流年</div>
              {nextYears.map((year) => (
                <button
                  type="button"
                  className={year.year === selectedYear ? 'flow-cell current' : 'flow-cell'}
                  key={year.year}
                  onClick={() => {
                    setSelectedYear(year.year);
                    setSelectedDayIndex(0);
                  }}
                  aria-label={`切换到${year.year}流年`}
                >
                  <small>{year.year}</small>
                  <strong>{year.ganZhi}</strong>
                  <span>{getTenGod(reading.dayMaster.stem, year.ganZhi[0])}</span>
                </button>
              ))}
            </div>

            <div className="flow-strip">
              <div className="flow-label">流月</div>
              <div className="flow-scroll" aria-label="流月横向列表">
                {flowMonths.map((month, index) => (
                  <button
                    type="button"
                    className={index === selectedMonthIndex ? 'flow-cell current' : 'flow-cell'}
                    key={`${month.term}-${month.ganZhi}`}
                    onClick={() => {
                      setSelectedMonthIndex(index);
                      setSelectedDayIndex(0);
                    }}
                    aria-label={`切换到${month.term}${month.ganZhi}流月`}
                  >
                    <small>{month.term}</small>
                    <strong>{month.ganZhi}</strong>
                    <span>{getTenGod(reading.dayMaster.stem, month.ganZhi[0])}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="flow-strip">
              <div className="flow-label">流日</div>
              <div className="flow-scroll day-scroll" aria-label="流日横向列表">
                {flowDays.map((day, index) => (
                  <button
                    type="button"
                    className={index === selectedDayIndex ? 'flow-cell current' : 'flow-cell'}
                    key={`${day.dateText}-${day.ganZhi}`}
                    onClick={() => setSelectedDayIndex(index)}
                    aria-label={`切换到${day.dateText}${day.ganZhi}流日`}
                  >
                    <small>
                      {day.label}
                      <br />
                      {day.dateText}
                    </small>
                    <strong>{day.ganZhi}</strong>
                    <span>{getTenGod(reading.dayMaster.stem, day.ganZhi[0])}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="flow-summary">
            <span>{reading.usefulElements[0]}旺</span>
            <span>{reading.structure.dominantElement}显</span>
            <span>{reading.dayMaster.strength}</span>
          </div>
        </article>
      </div>

      <div className="paipan-notes">
        <p>
          <strong>天干留意：</strong>
          {stemNotes}
        </p>
        <p>
          <strong>地支留意：</strong>
          {branchNotes}
        </p>
      </div>
    </section>
  );
}

function ElementBoard({ reading, compact = false }: { reading: BaziReading; compact?: boolean }) {
  return (
    <section className={compact ? 'section element-section compact' : 'section element-section'}>
      <div className="section-title">
        <h2>五行气势</h2>
        <span>喜用 {reading.usefulElements.join('、')}</span>
      </div>
      <div className="element-board">
        <div className="wheel" aria-label="五行盘">
          {reading.elementScores.map((item, index) => (
            <div className={`wheel-item wheel-${item.element}`} key={item.element} style={{ rotate: `${index * 72}deg` }}>
              <span style={{ rotate: `${-index * 72}deg` }}>{item.element}</span>
            </div>
          ))}
          <div className="wheel-center">
            <strong>{reading.dayMaster.stem}</strong>
            <span>{reading.dayMaster.strength}</span>
          </div>
        </div>
        <div className="element-bars">
          {reading.elementScores.map((item) => (
            <div className="element-row" key={item.element}>
              <div className="element-head">
                <strong>{item.element}</strong>
                <span>{item.tone}</span>
              </div>
              <div className="bar-track">
                <div className={`bar-fill fill-${item.element}`} style={{ width: `${Math.max(item.ratio * 100, 5)}%` }} />
              </div>
              <span className="score">{Math.round(item.ratio * 100)}%</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function UsefulAndTiaohouPanel({ reading }: { reading: BaziReading }) {
  const dayElement = reading.dayMaster.element;
  const dayStrength = reading.dayMaster.strength;
  const monthBranch = reading.pillars[1].branch;
  const monthProfile = seasonProfileByBranch[monthBranch];
  const usefulPrimary = reading.usefulElements[0];
  const usefulSecondary = reading.usefulElements[1] ?? elementGenerates[usefulPrimary];
  const avoidElements = reading.elementScores
    .filter((item) => item.tone === '偏旺' && !reading.usefulElements.includes(item.element))
    .map((item) => item.element);
  const weakElements = reading.elementScores.filter((item) => item.tone === '不足').map((item) => item.element);
  const visibleUseful = reading.pillars
    .flatMap((pillar) => [pillar.stem, pillar.branch])
    .filter((value) => reading.usefulElements.includes((stemElement[value] ?? branchElement[value]) as ElementName));
  const supportElement = dayStrength === '偏弱' ? dayElement : elementGenerates[dayElement];
  const controlElement = elementControlledBy[dayElement];
  const drainElement = elementGenerates[dayElement];
  const wealthElement = elementControls[dayElement];
  const tiaohouHits = monthProfile.adjustment.filter((element) => reading.usefulElements.includes(element));
  const tensionElements = monthProfile.adjustment.filter((element) => !reading.usefulElements.includes(element));
  const usefulLogic =
    dayStrength === '偏弱'
      ? `日主${dayElement}偏弱，扶抑上先看印比：${supportElement}能补根气、增强承压，${controlElement}来克时则要先看有无通关。`
      : dayStrength === '偏旺'
        ? `日主${dayElement}偏旺，扶抑上宜泄耗制：${drainElement}可泄秀，${wealthElement}可成事，${controlElement}可立规矩，但过制则反成压力。`
        : `日主${dayElement}中和，扶抑不是单纯补强或削弱，重点看月令气候、格局清浊和岁运是否引动关键十神。`;

  return (
    <section className="section useful-section">
      <div className="section-title">
        <h2>喜用与调候详析</h2>
        <span>
          用神 {usefulPrimary} · 喜神 {usefulSecondary} · 月令{monthBranch}
        </span>
      </div>

      <div className="useful-summary">
        <article>
          <span>用神</span>
          <strong>{usefulPrimary}</strong>
          <p>
            当前日主{reading.dayMaster.stem}属{dayElement}，整体{dayStrength}。系统取{reading.usefulElements.join('、')}为主要补偏方向，
            不是只看缺什么，而是看月令、旺衰、流通和现实可承接性。
          </p>
        </article>
        <article>
          <span>调候</span>
          <strong>{monthProfile.adjustment.join('、')}</strong>
          <p>
            生于{monthBranch}月，属{monthProfile.season}，{monthProfile.climate}。调候先看寒暖燥湿：
            {monthProfile.priority}
          </p>
        </article>
        <article>
          <span>忌偏</span>
          <strong>{avoidElements.join('、') || reading.structure.dominantElement}</strong>
          <p>
            {avoidElements.length
              ? `${avoidElements.join('、')}已偏旺，岁运再增时容易放大惯性。`
              : `${reading.structure.dominantElement}为命局主气，未必为忌，但过度时会压住其他五行。`}
            取用要看能否形成流通，而不是把某一行越补越多。
          </p>
        </article>
      </div>

      <div className="useful-grid">
        <article>
          <h3>一、扶抑喜用</h3>
          <p>{usefulLogic}</p>
          <ul>
            <li>首要用神：{usefulPrimary}，用于修正命局最需要补的方向。</li>
            <li>辅助喜神：{usefulSecondary}，用于承接用神，避免补而不通。</li>
            <li>可见根气：{visibleUseful.length ? `${visibleUseful.join('、')}已在原局出现，喜用有落点。` : '原局喜用不显，更要靠环境、选择和岁运来补。'}</li>
          </ul>
        </article>

        <article>
          <h3>二、调候取法</h3>
          <p>
            调候重在“气候适不适合日主发挥”。{monthProfile.season}的核心问题是{monthProfile.climate}，
            所以本盘不能只用旺弱判断，还要看{monthProfile.adjustment.join('、')}能否调出可用之气。
          </p>
          <ul>
            <li>{tiaohouHits.length ? `调候与喜用重合：${tiaohouHits.join('、')}，属于既补结构又调气候。` : `调候与扶抑有张力：${tensionElements.join('、')}需谨慎使用，不能一概当成喜。`}</li>
            <li>月令藏干：{reading.pillars[1].hiddenStems.join('、')}，说明气候背后还藏着{reading.pillars[1].branchTenGods.join('、') || '十神伏藏'}。</li>
            <li>缺口提示：{weakElements.length ? `${weakElements.join('、')}不足，适合后天主动补环境和能力。` : '五行缺口不明显，重点在清浊与流通。'}</li>
          </ul>
        </article>

        <article>
          <h3>三、现实取用</h3>
          <p>
            喜用落到现实，不是简单穿颜色或选方位，而是选择能补足{reading.usefulElements.join('、')}性质的环境、能力和节奏。
          </p>
          <ul>
            <li>{usefulPrimary}为用：优先经营能带来稳定补偏的能力、行业资源或生活节律。</li>
            <li>{usefulSecondary}为喜：适合作为辅助策略，用来承接机会、缓冲压力。</li>
            <li>若遇到加重{reading.structure.dominantElement}的年份，先降内耗，再谈扩张。</li>
          </ul>
        </article>

        <article>
          <h3>四、岁运观察</h3>
          <p>
            大运、流年见{reading.usefulElements.join('、')}时，往往更容易出现顺手的机会；若见{avoidElements.join('、') || reading.structure.dominantElement}过多，
            则要看是否冲动原局关系。
          </p>
          <ul>
            <li>可回测：过去进入喜用年份时，学习、迁移、合作或收入是否更顺。</li>
            <li>可预判：未来岁运若同时补调候与扶抑，适合主动推进重要事项。</li>
            <li>可避险：岁运冲合刑害明显时，先做减法，避免在压力期硬扩张。</li>
          </ul>
        </article>
      </div>
    </section>
  );
}

function SmartPillarDiagram({ reading }: { reading: BaziReading }) {
  const [activeTab, setActiveTab] = useState<DiagramTab>('ganzhi');
  const tabItems: Array<{ key: DiagramTab; label: string }> = [
    { key: 'ganzhi', label: '干支' },
    { key: 'flow', label: '流通' },
    { key: 'palace', label: '宫位' },
    { key: 'kinship', label: '六亲' },
  ];
  const pillars = reading.pillars;
  const adjacentPairs = pillars.slice(0, -1).map((pillar, index) => {
    const next = pillars[index + 1];
    const stemRelation = getElementRelation(stemElement[pillar.stem], stemElement[next.stem]);
    const branchRelation = getElementRelation(branchElement[pillar.branch], branchElement[next.branch]);
    const branchNotes = getPairRelations(pillar.branch, next.branch, branchRelations);
    const stemNotes = getPairRelations(pillar.stem, next.stem, combinePairs);
    return { pillar, next, stemRelation, branchRelation, branchNotes, stemNotes };
  });
  const allStemNotes = collectPairNotes(pillars.map((pillar) => pillar.stem), combinePairs, '天干未见明显合化');
  const allBranchNotes = collectPairNotes(pillars.map((pillar) => pillar.branch), branchRelations, '地支未见明显冲合刑害');

  return (
    <section className="section diagram-section">
      <div className="diagram-title">
        <h2>智能四柱图示</h2>
      </div>
      <div className="diagram-tabs" role="tablist" aria-label="智能四柱图示">
        {tabItems.map((item) => (
          <button
            className={activeTab === item.key ? 'active' : ''}
            key={item.key}
            onClick={() => setActiveTab(item.key)}
            type="button"
          >
            {item.label}
          </button>
        ))}
      </div>

      {activeTab === 'ganzhi' && (
        <div className="diagram-pane">
          <div className="diagram-pillars">
            {pillars.map((pillar) => (
              <article className="diagram-pillar" key={pillar.key}>
                <span>{pillar.label}</span>
                <em>{pillar.stemTenGod}</em>
                <GanZhiGlyph value={pillar.stem} type="stem" />
                <GanZhiGlyph value={pillar.branch} type="branch" />
                <small>{pillar.branchTenGods.join('、') || '-'}</small>
              </article>
            ))}
          </div>
          <div className="diagram-note-grid">
            <p>
              <strong>天干：</strong>
              {allStemNotes}
            </p>
            <p>
              <strong>地支：</strong>
              {allBranchNotes}
            </p>
          </div>
        </div>
      )}

      {activeTab === 'flow' && (
        <div className="diagram-pane">
          <div className="flow-visual">
            <div className="flow-line-grid">
              {pillars.map((pillar, index) => (
                <div className="flow-node" key={`stem-${pillar.key}`}>
                  <small>{pillar.stemTenGod}</small>
                  <GanZhiGlyph value={pillar.stem} type="stem" />
                  {index < adjacentPairs.length && (
                    <span className={adjacentPairs[index].stemRelation === '生' || adjacentPairs[index].stemRelation === '助' ? 'flow-badge good' : 'flow-badge warn'}>
                      {adjacentPairs[index].stemRelation}
                    </span>
                  )}
                </div>
              ))}
              {pillars.map((pillar, index) => (
                <div className="flow-node" key={`branch-${pillar.key}`}>
                  <GanZhiGlyph value={pillar.branch} type="branch" />
                  <small>{pillar.branchTenGods[0] || '-'}</small>
                  {index < adjacentPairs.length && (
                    <span className={adjacentPairs[index].branchRelation === '生' || adjacentPairs[index].branchRelation === '助' ? 'flow-badge good' : 'flow-badge warn'}>
                      {adjacentPairs[index].branchRelation}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
          <div className="diagram-note-grid">
            <p>
              <strong>流通：</strong>
              {adjacentPairs
                .map((item) => `${item.pillar.label}${item.next.label}：天干${item.stemRelation}，地支${item.branchRelation}`)
                .join('；')}
            </p>
            <p>
              <strong>阻塞：</strong>
              {adjacentPairs
                .flatMap((item) => [...item.stemNotes, ...item.branchNotes])
                .join('、') || '未见明显相冲、相刑、相克阻塞，重点看岁运触发。'}
            </p>
          </div>
        </div>
      )}

      {activeTab === 'palace' && (
        <div className="diagram-pane">
          <div className="palace-pillar-row">
            {pillars.map((pillar) => {
              const palace = palaceMeanings[pillar.key];
              return (
                <article className="palace-pillar" key={pillar.key}>
                  <strong>{palace.title}</strong>
                  <span>{pillar.label}</span>
                  <GanZhiGlyph value={pillar.stem} type="stem" />
                  <GanZhiGlyph value={pillar.branch} type="branch" />
                </article>
              );
            })}
          </div>
          <div className="palace-matrix">
            {['time', 'space', 'body'].map((key) => (
              <article key={key}>
                <h3>{key === 'time' ? '时间类象' : key === 'space' ? '空间类象' : '身体类象'}</h3>
                <div>
                  {pillars.map((pillar) => (
                    <span key={`${key}-${pillar.key}`}>{palaceMeanings[pillar.key][key as 'time' | 'space' | 'body']}</span>
                  ))}
                </div>
              </article>
            ))}
            <article>
              <h3>人际类象</h3>
              <div>
                {pillars.map((pillar) => (
                  <span key={`people-${pillar.key}`}>{palaceMeanings[pillar.key].people.join('、')}</span>
                ))}
              </div>
            </article>
          </div>
        </div>
      )}

      {activeTab === 'kinship' && (
        <div className="diagram-pane">
          <div className="kinship-board">
            <article>
              <h3>亲属关系</h3>
              <div className="kinship-columns">
                {pillars.map((pillar) => {
                  const kin = kinshipByTenGod[pillar.stemTenGod] ?? { family: ['关系待定'], social: ['关系待定'] };
                  return (
                    <div key={`family-${pillar.key}`}>
                      <strong>{kin.family.join(' / ')}</strong>
                      <span>{pillar.stemTenGod}</span>
                      <GanZhiGlyph value={pillar.stem} type="stem" />
                      <GanZhiGlyph value={pillar.branch} type="branch" />
                      <small>{pillar.branchTenGods.map((god) => kinshipByTenGod[god]?.family[0] ?? god).join('、') || '-'}</small>
                    </div>
                  );
                })}
              </div>
            </article>
            <article>
              <h3>社会关系</h3>
              <div className="kinship-columns">
                {pillars.map((pillar) => {
                  const kin = kinshipByTenGod[pillar.stemTenGod] ?? { family: ['关系待定'], social: ['关系待定'] };
                  return (
                    <div key={`social-${pillar.key}`}>
                      <strong>{kin.social.join(' / ')}</strong>
                      <span>{pillar.stemTenGod}</span>
                      <GanZhiGlyph value={pillar.stem} type="stem" />
                      <GanZhiGlyph value={pillar.branch} type="branch" />
                      <small>{pillar.branchTenGods.map((god) => kinshipByTenGod[god]?.social[0] ?? god).join('、') || '-'}</small>
                    </div>
                  );
                })}
              </div>
            </article>
          </div>
        </div>
      )}
    </section>
  );
}

function PortraitSection({ reading }: { reading: BaziReading }) {
  const { portrait } = reading;

  return (
    <section className="section portrait-section">
      <div className="section-title">
        <h2>性格画像</h2>
        <span>从日主、月令、十神和五行结构合看</span>
      </div>
      <div className="portrait-opening">
        <span className="eyebrow">{portrait.title}</span>
        <p>{portrait.opening}</p>
      </div>

      <div className="portrait-grid">
        <article>
          <h3>命理依据</h3>
          <ul>
            {portrait.evidence.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </article>
        <article>
          <h3>内在模式</h3>
          <ul>
            {portrait.traits.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </article>
        <article>
          <h3>优势所在</h3>
          <ul>
            {portrait.strengths.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </article>
        <article>
          <h3>容易卡住</h3>
          <ul>
            {portrait.blindSpots.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </article>
      </div>

      <div className="life-grid">
        <article>
          <h3>事业打法</h3>
          <p>{portrait.workStyle}</p>
        </article>
        <article>
          <h3>关系模式</h3>
          <p>{portrait.relationshipStyle}</p>
        </article>
        <article>
          <h3>财务节奏</h3>
          <p>{portrait.moneyStyle}</p>
        </article>
      </div>

      <article className="growth-key">
        <h3>一句话点醒</h3>
        <p>{portrait.growthKey}</p>
      </article>

      <div className="verification-box">
        <strong>可验证回测</strong>
        <ul>
          {portrait.verification.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </div>
    </section>
  );
}

function DeepDivePanel({ reading }: { reading: BaziReading }) {
  const [activeDomain, setActiveDomain] = useState<DeepDomainKey>('summary');
  const activeReport = reading.deepDive.domains.find((domain) => domain.key === activeDomain) ?? reading.deepDive.domains[0];
  const mergedAdvice = [
    reading.advice.overview,
    reading.advice.career,
    reading.advice.relationship,
    reading.advice.health,
    reading.advice.growth,
  ];

  return (
    <section className="section deep-section">
      <div className="section-title">
        <h2>专业详批</h2>
        <span>
          {reading.deepDive.structureName} · 用神{reading.deepDive.usefulGod} · 喜神{reading.deepDive.favorableGod}
        </span>
      </div>
      <div className="deep-thesis">
        <strong>命局总纲</strong>
        <p>{reading.deepDive.thesis}</p>
      </div>
      <div className="deep-tabs" role="tablist" aria-label="专项详批">
        {deepDomainOrder.map((key) => {
          const domain = reading.deepDive.domains.find((item) => item.key === key);
          if (!domain) {
            return null;
          }
          return (
            <button
              className={activeDomain === key ? 'deep-tab active' : 'deep-tab'}
              key={key}
              onClick={() => setActiveDomain(key)}
              type="button"
            >
              {domain.title}
            </button>
          );
        })}
      </div>
      <article className="domain-report">
        <h3>{activeReport.title}</h3>
        <p className="domain-conclusion">{activeReport.conclusion}</p>
        <div className="domain-grid">
          <div>
            <h4>命理依据</h4>
            <ul>
              {activeReport.evidence.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
          <div>
            <h4>现实表现</h4>
            <ul>
              {activeReport.realWorld.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
          <div>
            <h4>风险点</h4>
            <ul>
              {activeReport.risks.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
          <div>
            <h4>行动建议</h4>
            <ul>
              {activeReport.actions.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
        </div>
      </article>
      <div className="merged-advice-grid">
        {mergedAdvice.map((advice) => (
          <article key={advice.title}>
            <h3>{advice.title}</h3>
            <p>{advice.body}</p>
            <div className="tag-row">
              {advice.tags.map((tag, index) => (
                <span key={`${advice.title}-${tag}-${index}`}>{tag}</span>
              ))}
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

function LuckIntegratedPanel({ reading }: { reading: BaziReading }) {
  const currentPeriod = reading.daYun.periods.find((period) => period.isCurrent);
  const currentDescription = currentPeriod ? describeLuckPeriod(reading, currentPeriod) : null;

  return (
    <section className="section luck-integrated-section">
      <div className="section-title">
        <h2>大运合参</h2>
        <span>
          八字原局 + 十年大运 + 未来三年
        </span>
      </div>

      <div className="luck-overview">
        <article>
          <strong>起运方式</strong>
          <p>
            {reading.daYun.direction}，{reading.daYun.startText}。大运不是单独看吉凶，而是看它把原局里的哪一股气引出来。
          </p>
        </article>
        <article>
          <strong>命局底盘</strong>
          <p>
            日主{reading.dayMaster.stem}，整体{reading.dayMaster.strength}；命局{reading.structure.dominantElement}气较显，喜用偏向
            {reading.usefulElements.join('、')}。
          </p>
        </article>
        <article>
          <strong>当前重点</strong>
          <p>
            {currentPeriod && currentDescription
              ? `${currentPeriod.ganZhi}运（${currentPeriod.startYear}-${currentPeriod.endYear}）处在${currentDescription.phase}，${currentDescription.theme}`
              : '当前大运未能定位，建议检查出生时间与性别信息。'}
          </p>
        </article>
      </div>

      <div className="luck-current-grid">
        <article className="luck-current-card">
          <h3>当前大运详批</h3>
          {reading.deepDive.currentLuck && currentPeriod && currentDescription ? (
            <>
              <div className="luck-current-head">
                <strong>{reading.deepDive.currentLuck.ganZhi}</strong>
                <span>
                  {reading.deepDive.currentLuck.years} · {reading.deepDive.currentLuck.ages}
                </span>
              </div>
              <p>{reading.deepDive.currentLuck.effect}</p>
              <div className="domain-grid compact">
                <div>
                  <h4>原局触发</h4>
                  <ul>
                    <li>{currentDescription.stemNote}</li>
                    <li>{currentDescription.branchNote}</li>
                  </ul>
                </div>
                <div>
                  <h4>较利方向</h4>
                  <ul>
                    {reading.deepDive.currentLuck.bestFor.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                </div>
                <div>
                  <h4>需要留意</h4>
                  <ul>
                    {reading.deepDive.currentLuck.caution.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                </div>
                <div>
                  <h4>行动取法</h4>
                  <ul>
                    <li>{currentDescription.action}</li>
                    <li>{currentDescription.usefulText}</li>
                  </ul>
                </div>
              </div>
            </>
          ) : (
            <p>当前大运未能定位，请检查出生时间与性别信息。</p>
          )}
        </article>
      </div>

      <div className="luck-period-list">
        {reading.daYun.periods.map((period) => (
          <article className={period.isCurrent ? 'luck-period-card current' : 'luck-period-card'} key={`${period.startYear}-${period.ganZhi}`}>
            <div className="luck-period-head">
              <div>
                <strong>{period.ganZhi}</strong>
                <span>{describeLuckPeriod(reading, period).phase}</span>
              </div>
              <p>
                {period.startYear}-{period.endYear} · {period.startAge}-{period.endAge}岁
              </p>
            </div>
            <div className="luck-period-body">
              <p>{describeLuckPeriod(reading, period).theme}</p>
              <ul>
                <li>{describeLuckPeriod(reading, period).stemNote}</li>
                <li>{describeLuckPeriod(reading, period).branchNote}</li>
                <li>{describeLuckPeriod(reading, period).action}</li>
              </ul>
            </div>
            <small>空亡：{period.xunKong} · {describeLuckPeriod(reading, period).usefulText}</small>
          </article>
        ))}
      </div>

      <article className="year-card">
        <h3>未来三年逐年提示</h3>
        <div className="year-list">
          {reading.deepDive.futureYears.map((year) => (
            <div className="year-item" key={year.year}>
              <strong>
                {year.year} · {year.ganZhi} · {year.theme}
              </strong>
              <p>{year.focus}</p>
              <p>事业：{year.career}</p>
              <p>关系：{year.relationship}</p>
              <p>财务：{year.money}</p>
              <small>提醒：{year.caution}</small>
            </div>
          ))}
        </div>
      </article>
    </section>
  );
}

function buildReportText(reading: BaziReading) {
  const pillars = reading.pillars.map((pillar) => `${pillar.label} ${pillar.ganZhi} ${pillar.stemTenGod}`).join(' / ');
  const elements = reading.elementScores.map((item) => `${item.element}${Math.round(item.ratio * 100)}%(${item.tone})`).join('、');
  const monthBranch = reading.pillars[1].branch;
  const monthProfile = seasonProfileByBranch[monthBranch];
  const avoidElements = reading.elementScores
    .filter((item) => item.tone === '偏旺' && !reading.usefulElements.includes(item.element))
    .map((item) => item.element);
  const deepDomains = reading.deepDive.domains
    .map((domain) => {
      return [
        `【${domain.title}】`,
        domain.conclusion,
        `依据：${domain.evidence.join('；')}`,
        `现实表现：${domain.realWorld.join('；')}`,
        `风险点：${domain.risks.join('；')}`,
        `行动建议：${domain.actions.join('；')}`,
      ].join('\n');
    })
    .join('\n\n');
  const futureYears = reading.deepDive.futureYears
    .map((year) => `${year.year} ${year.ganZhi} ${year.theme}：${year.focus} 事业：${year.career} 关系：${year.relationship} 财务：${year.money} 提醒：${year.caution}`)
    .join('\n');
  const luckPeriods = reading.daYun.periods
    .map((period) => {
      const description = describeLuckPeriod(reading, period);
      return `${period.ganZhi} ${period.startYear}-${period.endYear} ${period.startAge}-${period.endAge}岁：${description.theme} ${description.stemNote} ${description.branchNote} ${description.action}`;
    })
    .join('\n');

  return [
    `自然排盘报告：${reading.input.name || '未命名'}`,
    `阳历：${reading.solarText}`,
    `阴历：${reading.lunarText}`,
    `四柱：${pillars}`,
    `日主：${reading.dayMaster.polarity}${reading.dayMaster.element}，${reading.dayMaster.strength}`,
    `五行：${elements}`,
    `喜用：${reading.usefulElements.join('、')}`,
    `调候：${monthBranch}月属${monthProfile.season}，${monthProfile.climate}；调候取${monthProfile.adjustment.join('、')}，重点为${monthProfile.priority}`,
    `喜用详析：日主${reading.dayMaster.stem}属${reading.dayMaster.element}，整体${reading.dayMaster.strength}；用神${reading.usefulElements[0]}，喜神${reading.usefulElements[1] ?? elementGenerates[reading.usefulElements[0]]}。忌偏参考：${avoidElements.join('、') || reading.structure.dominantElement}。`,
    `命宫：${reading.structure.mingGong}，身宫：${reading.structure.shenGong}，胎元：${reading.structure.taiYuan}`,
    '',
    '【专业详批：性格画像】',
    reading.portrait.opening,
    '',
    '【事业打法】',
    reading.portrait.workStyle,
    '',
    '【关系模式】',
    reading.portrait.relationshipStyle,
    '',
    '【财务节奏】',
    reading.portrait.moneyStyle,
    '',
    '【专业详批：命局总论】',
    reading.deepDive.thesis,
    `格局取向：${reading.deepDive.structureName}`,
    `用神：${reading.deepDive.usefulGod}；喜神：${reading.deepDive.favorableGod}；忌神参考：${reading.deepDive.avoidGod}`,
    '',
    deepDomains,
    '',
    '【大运合参】',
    luckPeriods,
    '',
    '【未来三年】',
    futureYears,
    '',
    '注：以上为传统命理视角下的趋势分析，不替代医学、法律、心理、财务等专业意见。',
  ].join('\n');
}

function LoginPage({
  profileName,
  onChangeName,
  onLogin,
  onGuest,
}: {
  profileName: string;
  onChangeName: (value: string) => void;
  onLogin: () => void;
  onGuest: () => void;
}) {
  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    onLogin();
  };

  return (
    <main className="flow-shell login-screen">
      <section className="login-hero">
        <div className="brand-lockup">
          <div className="brand-symbol">自</div>
          <div>
            <span>Natural Paipan</span>
            <h1>自然排盘</h1>
          </div>
        </div>
        <div className="hero-copy">
          <p className="eyebrow">八字排盘 · 专业详批 · 大运合参</p>
          <h2>输入生辰，生成一份清晰可读的八字分析报告。</h2>
          <p>
            先建立档案，再录入出生信息，系统会把四柱、五行、格局、事业关系和大运节奏整理成结构化报告。
          </p>
        </div>
        <div className="feature-strip" aria-label="核心能力">
          <span>四柱排盘</span>
          <span>五行气势</span>
          <span>专业深度页</span>
          <span>逐项详批</span>
        </div>
      </section>

      <section className="auth-card">
        <form onSubmit={handleSubmit}>
          <h2>登录自然排盘</h2>
          <p>建立一个档案，后续可以保存报告，并继续查看不同阶段的运势变化。</p>
          <label>
            <span>
              <UserRound size={15} /> 昵称 / 档案名
            </span>
            <input
              autoComplete="name"
              name="profileName"
              onChange={(event) => onChangeName(event.target.value)}
              placeholder="请输入昵称"
              value={profileName}
            />
          </label>
          <label>
            <span>
              <LogIn size={15} /> 手机号 / 邮箱
            </span>
            <input autoComplete="email" name="account" placeholder="演示版可留空" />
          </label>
          <button className="primary-button" type="submit">
            <LogIn size={17} />
            进入录入
          </button>
          <button className="secondary-button" onClick={onGuest} type="button">
            <ArrowRight size={16} />
            游客体验
          </button>
        </form>
      </section>
    </main>
  );
}

function BirthSetupPage({
  input,
  onBack,
  onChange,
  onReset,
  onSubmit,
}: {
  input: BirthInput;
  onBack: () => void;
  onChange: (input: BirthInput) => void;
  onReset: () => void;
  onSubmit: (input: BirthInput) => void;
}) {
  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    onSubmit({
      name: String(form.get('name') || input.name),
      gender: String(form.get('gender') || input.gender) as BirthInput['gender'],
      birthDate: String(form.get('birthDate') || input.birthDate),
      birthTime: String(form.get('birthTime') || input.birthTime),
      birthplace: String(form.get('birthplace') || input.birthplace),
    });
  };

  return (
    <main className="flow-shell birth-screen">
      <section className="birth-panel">
        <div className="flow-topbar">
          <button className="icon-text-button" onClick={onBack} type="button">
            <ArrowLeft size={17} />
            返回
          </button>
        </div>

        <div className="birth-heading">
          <p className="eyebrow">第二步 · 建立命盘资料</p>
          <h1>输入出生日期，生成四柱与完整详批。</h1>
          <p>默认使用公历时间。后续接 App 时，这一页可以独立做成资料录入 screen，并扩展真太阳时、农历、出生地经纬度和多档案管理。</p>
        </div>

        <form className="birth-form" id="basic-info" onSubmit={handleSubmit}>
          <div className="form-grid">
            <label>
              <span>
                <UserRound size={15} /> 昵称
              </span>
              <input name="name" value={input.name} onChange={(event) => onChange({ ...input, name: event.target.value })} />
            </label>

            <label>
              <span>
                <Sparkles size={15} /> 性别
              </span>
              <select
                name="gender"
                value={input.gender}
                onChange={(event) => onChange({ ...input, gender: event.target.value as BirthInput['gender'] })}
              >
                <option value="female">女</option>
                <option value="male">男</option>
              </select>
            </label>

            <label>
              <span>
                <CalendarDays size={15} /> 出生日期
              </span>
              <input
                name="birthDate"
                type="date"
                value={input.birthDate}
                onChange={(event) => onChange({ ...input, birthDate: event.target.value })}
              />
            </label>

            <label>
              <span>
                <Clock3 size={15} /> 出生时间
              </span>
              <input
                name="birthTime"
                type="time"
                value={input.birthTime}
                onChange={(event) => onChange({ ...input, birthTime: event.target.value })}
              />
            </label>

            <label className="wide">
              <span>
                <MapPin size={15} /> 出生地
              </span>
              <input
                name="birthplace"
                value={input.birthplace}
                onChange={(event) => onChange({ ...input, birthplace: event.target.value })}
              />
            </label>
          </div>

          <div className="form-actions">
            <button className="primary-button" type="submit">
              <RefreshCw size={17} />
              生成八字排盘分析
            </button>
            <button className="secondary-button" onClick={onReset} type="button">
              <RotateCcw size={16} />
              重置案例
            </button>
          </div>
        </form>
      </section>

      <aside className="birth-aside">
        <strong>可扩展功能口</strong>
        <p>当前由本地 `ReadingPort` 出报告，后续可替换为远程 API、登录会员、订单支付、历史档案和原生 App Bridge。</p>
        <div className="aside-checks">
          <span>真太阳时</span>
          <span>多档案</span>
          <span>报告导出</span>
          <span>AI 详批</span>
        </div>
      </aside>
    </main>
  );
}

function ReportTopNav({
  activeNav,
  onNavigate,
}: {
  activeNav: NavTarget;
  onNavigate: (target: NavTarget) => void;
}) {
  const navItems: Array<{ key: NavTarget; label: string }> = [
    { key: 'paipan', label: '基本排盘' },
    { key: 'element', label: '五行气势' },
    { key: 'useful', label: '喜用调候' },
    { key: 'detail', label: '专业详批' },
    { key: 'professional', label: '专业细盘' },
    { key: 'luck', label: '大运合参' },
  ];

  return (
    <header className="report-topnav">
      <div className="topnav-brand">
        <div className="brand-symbol">自</div>
        <div>
          <strong>自然排盘</strong>
          <span>命盘报告</span>
        </div>
      </div>

      <nav className="topnav-tabs" aria-label="报告导航">
        {navItems.map((item) => (
          <button className={activeNav === item.key ? 'active' : ''} key={item.key} onClick={() => onNavigate(item.key)} type="button">
            {item.label}
          </button>
        ))}
      </nav>
    </header>
  );
}

export default function App() {
  const [input, setInput] = useState(initialInput);
  const [submitted, setSubmitted] = useState(initialInput);
  const [step, setStep] = useState<AppStep>('login');
  const [activeNav, setActiveNav] = useState<NavTarget>('paipan');
  const [toast, setToast] = useState('');
  const { reading, error } = useMemo(() => createReadingSafely(submitted), [submitted]);
  const paipanRef = useRef<HTMLDivElement>(null);
  const elementRef = useRef<HTMLDivElement>(null);
  const usefulRef = useRef<HTMLDivElement>(null);
  const professionalRef = useRef<HTMLDivElement>(null);
  const luckRef = useRef<HTMLDivElement>(null);
  const detailRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!toast) {
      return;
    }
    const timer = window.setTimeout(() => setToast(''), 2200);
    return () => window.clearTimeout(timer);
  }, [toast]);

  const scrollTo = (target: NavTarget) => {
    const refs: Record<NavTarget, RefObject<HTMLDivElement | null>> = {
      paipan: paipanRef,
      element: elementRef,
      useful: usefulRef,
      professional: professionalRef,
      luck: luckRef,
      detail: detailRef,
    };
    setActiveNav(target);
    refs[target].current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const copyReport = async () => {
    if (!reading) {
      return;
    }
    const text = buildReportText(reading);
    try {
      await navigator.clipboard.writeText(text);
      setToast('已复制自然排盘报告');
    } catch {
      const textarea = document.createElement('textarea');
      textarea.value = text;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      textarea.remove();
      setToast('已复制自然排盘报告');
    }
  };

  const exportReport = () => {
    if (!reading) {
      return;
    }
    const text = buildReportText(reading);
    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${reading.input.name || 'bazi'}-自然排盘报告.txt`;
    link.click();
    URL.revokeObjectURL(url);
    setToast('已导出 txt 报告');
  };

  const resetCase = () => {
    setInput(initialInput);
    setSubmitted(initialInput);
    setToast('已重置为默认案例');
    setActiveNav('paipan');
  };

  if (step === 'login') {
    return (
      <LoginPage
        onChangeName={(name) => setInput((current) => ({ ...current, name }))}
        onGuest={() => {
          setToast('已进入游客体验');
          setStep('birth');
        }}
        onLogin={() => {
          setToast('登录成功，继续录入生辰');
          setStep('birth');
        }}
        profileName={input.name}
      />
    );
  }

  if (step === 'birth') {
    return (
      <>
        <BirthSetupPage
          input={input}
          onBack={() => setStep('login')}
          onChange={setInput}
          onReset={resetCase}
          onSubmit={(nextInput) => {
            setInput(nextInput);
            setSubmitted(nextInput);
            setActiveNav('paipan');
            setStep('report');
            setToast('排盘已生成');
          }}
        />
        {toast && <div className="toast">{toast}</div>}
      </>
    );
  }

  return (
    <main className="report-shell">
      <ReportTopNav activeNav={activeNav} onNavigate={scrollTo} />

      <div className="report-main">
        {error && <div className="error-box">{error}</div>}
        {reading && (
          <>
            <TopProfile
              onCopy={copyReport}
              onEdit={() => setStep('birth')}
              onExport={exportReport}
              reading={reading}
            />
            <div ref={paipanRef}>
              <PaipanSection reading={reading} elementRef={elementRef} />
            </div>
            <AncientReference reading={reading} />
            <div ref={usefulRef}>
              <UsefulAndTiaohouPanel reading={reading} />
            </div>
            <div className="detail-stack" ref={detailRef}>
              <PortraitSection reading={reading} />
              <DeepDivePanel reading={reading} />
            </div>
            <SmartPillarDiagram reading={reading} />
            <div ref={professionalRef}>
              <ProfessionalChartPanel reading={reading} />
            </div>
            <div ref={luckRef}>
              <LuckIntegratedPanel reading={reading} />
            </div>

            <p className="disclaimer">以上为基于传统干支模型的结构化参考，不替代医学、法律、财务或人生重大决策建议。</p>
          </>
        )}
        {toast && <div className="toast">{toast}</div>}
      </div>
    </main>
  );
}
