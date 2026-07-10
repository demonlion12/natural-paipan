import { useEffect, useMemo, useRef, useState } from 'react';
import type { FormEvent, RefObject } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
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
import type { BaziReading, BirthInput, DeepDomainKey, ElementName, Pillar } from './core/types';

const initialInput: BirthInput = {
  name: '1232',
  gender: 'male',
  birthDate: '1990-01-01',
  birthTime: '00:00',
  birthplace: '未知地 北京时间',
};

type AppStep = 'login' | 'birth' | 'report' | 'yijing';
type NavTarget = 'paipan' | 'element' | 'useful' | 'professional' | 'luck' | 'detail';
type ClassicKey = 'qiongtong' | 'ditiansui' | 'sanming' | 'tiyao' | 'ziping' | 'yuanhai' | 'tianyuan' | 'shenfeng' | 'qianli' | 'wuxing' | 'lixu';
type DiagramTab = 'ganzhi' | 'flow' | 'palace' | 'kinship';
type YaoValue = 6 | 7 | 8 | 9;
const deepDomainOrder: DeepDomainKey[] = ['summary', 'career', 'wealth', 'relationship', 'health', 'family'];
const elementCycleOrder: ElementName[] = ['木', '火', '土', '金', '水'];

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

const seasonProfileByBranch: Record<
  string,
  { season: string; climate: string; thermal: string; moisture: string; priority: string; adjustment: ElementName[] }
> = {
  寅: { season: '初春', climate: '木气初升，余寒未退', thermal: '寒气未尽，火能开冻，木才有生发之势。', moisture: '春木带湿，水多则寒湿滞木，土重则木郁不舒。', priority: '先扶生机，再防寒湿滞木。', adjustment: ['火', '木'] },
  卯: { season: '仲春', climate: '木旺风动，生发最盛', thermal: '寒退而风动，火可化木气为文明与表达。', moisture: '木旺易泛，湿重则枝叶繁而根气杂，需有疏泄裁成。', priority: '宜疏木成材，忌木多无制。', adjustment: ['火', '金'] },
  辰: { season: '暮春', climate: '湿土收春，木气入库', thermal: '春末阳气渐足，但辰为湿土，火弱则土湿木困。', moisture: '湿土最怕泥滞，水土过重会让格局迟缓，需火燥湿、木疏土。', priority: '宜燥湿通关，防土湿困木。', adjustment: ['火', '木'] },
  巳: { season: '初夏', climate: '火气渐旺，燥象初成', thermal: '阳气已旺，火势渐炎，过暖则急躁燥烈。', moisture: '燥气开始抬头，水能润燥，金能生水并收敛火势。', priority: '宜取水润燥，兼看土金是否承接。', adjustment: ['水', '金'] },
  午: { season: '仲夏', climate: '火旺炎上，燥热最显', thermal: '火到极旺，先论降温，不宜再盲目助火。', moisture: '燥热伤津，水为第一调候，金为水源，土多则更燥。', priority: '先取水调候，再以金生水。', adjustment: ['水', '金'] },
  未: { season: '季夏', climate: '燥土含火，暑气未退', thermal: '暑气仍在，土中藏火，火土并重时易燥滞。', moisture: '未土燥而能困水，宜先润土，再看金水是否有根。', priority: '宜润土降燥，使气能下行。', adjustment: ['水', '金'] },
  申: { season: '初秋', climate: '金气初肃，余热尚存', thermal: '秋金初成，仍有余热，火太过则炼金太急，火太弱则金寒无用。', moisture: '初秋偏燥，水可润金，但水多又会寒湿。', priority: '宜火炼金、水平燥，忌寒燥偏枯。', adjustment: ['火', '水'] },
  酉: { season: '仲秋', climate: '金旺肃杀，燥气明显', thermal: '金旺而气肃，火能温炼，使金有器用。', moisture: '秋燥明显，水能润燥，但不可寒水过多伤火。', priority: '宜火暖金，亦需水润其燥。', adjustment: ['火', '水'] },
  戌: { season: '暮秋', climate: '燥土收金，火入墓库', thermal: '火气入墓，暖意内收，若火不透则燥土无生机。', moisture: '戌为燥土，土金过重会枯，水可润燥，木可疏土。', priority: '宜水润燥土，木疏土闭。', adjustment: ['水', '木'] },
  亥: { season: '初冬', climate: '水势渐旺，寒气已起', thermal: '寒气初起，火为调候核心，能使格局有温度与行动力。', moisture: '水旺渐成，湿寒若重则木火难发，土只可适度堤防。', priority: '先取火暖局，再看木能否引火。', adjustment: ['火', '木'] },
  子: { season: '仲冬', climate: '水旺寒凝，阳气初萌', thermal: '寒到极处，丙火最要紧；有火则阳气能复，无火则才气易被寒水压住。', moisture: '水旺湿重，土可堤水，但冻土太厚也会困局；木可引火通生机。', priority: '调候首重火暖，土可堤水，木可引火。', adjustment: ['火', '土'] },
  丑: { season: '季冬', climate: '寒湿之土，水气入库', thermal: '寒湿未退，火可暖土解冻，使藏气能用。', moisture: '丑为湿土，水土相杂最易迟滞，木能疏土，火能化湿寒。', priority: '宜火暖寒湿，木疏冻土。', adjustment: ['火', '木'] },
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

const trigramByBits: Record<string, { name: string; symbol: string; nature: string; image: string }> = {
  '111': { name: '乾', symbol: '☰', nature: '天', image: '健、主动、开创' },
  '110': { name: '兑', symbol: '☱', nature: '泽', image: '悦、沟通、兑现' },
  '101': { name: '离', symbol: '☲', nature: '火', image: '明、依附、看见' },
  '100': { name: '震', symbol: '☳', nature: '雷', image: '动、启动、惊醒' },
  '011': { name: '巽', symbol: '☴', nature: '风', image: '入、渗透、协商' },
  '010': { name: '坎', symbol: '☵', nature: '水', image: '险、压力、反复' },
  '001': { name: '艮', symbol: '☶', nature: '山', image: '止、边界、沉淀' },
  '000': { name: '坤', symbol: '☷', nature: '地', image: '顺、承载、积累' },
};

const hexagramMatrix: Record<string, Record<string, { number: number; name: string }>> = {
  乾: { 乾: { number: 1, name: '乾为天' }, 兑: { number: 10, name: '天泽履' }, 离: { number: 13, name: '天火同人' }, 震: { number: 25, name: '天雷无妄' }, 巽: { number: 44, name: '天风姤' }, 坎: { number: 6, name: '天水讼' }, 艮: { number: 33, name: '天山遁' }, 坤: { number: 12, name: '天地否' } },
  兑: { 乾: { number: 43, name: '泽天夬' }, 兑: { number: 58, name: '兑为泽' }, 离: { number: 49, name: '泽火革' }, 震: { number: 17, name: '泽雷随' }, 巽: { number: 28, name: '泽风大过' }, 坎: { number: 47, name: '泽水困' }, 艮: { number: 31, name: '泽山咸' }, 坤: { number: 45, name: '泽地萃' } },
  离: { 乾: { number: 14, name: '火天大有' }, 兑: { number: 38, name: '火泽睽' }, 离: { number: 30, name: '离为火' }, 震: { number: 21, name: '火雷噬嗑' }, 巽: { number: 50, name: '火风鼎' }, 坎: { number: 64, name: '火水未济' }, 艮: { number: 56, name: '火山旅' }, 坤: { number: 35, name: '火地晋' } },
  震: { 乾: { number: 34, name: '雷天大壮' }, 兑: { number: 54, name: '雷泽归妹' }, 离: { number: 55, name: '雷火丰' }, 震: { number: 51, name: '震为雷' }, 巽: { number: 32, name: '雷风恒' }, 坎: { number: 40, name: '雷水解' }, 艮: { number: 62, name: '雷山小过' }, 坤: { number: 16, name: '雷地豫' } },
  巽: { 乾: { number: 9, name: '风天小畜' }, 兑: { number: 61, name: '风泽中孚' }, 离: { number: 37, name: '风火家人' }, 震: { number: 42, name: '风雷益' }, 巽: { number: 57, name: '巽为风' }, 坎: { number: 59, name: '风水涣' }, 艮: { number: 53, name: '风山渐' }, 坤: { number: 20, name: '风地观' } },
  坎: { 乾: { number: 5, name: '水天需' }, 兑: { number: 60, name: '水泽节' }, 离: { number: 63, name: '水火既济' }, 震: { number: 3, name: '水雷屯' }, 巽: { number: 48, name: '水风井' }, 坎: { number: 29, name: '坎为水' }, 艮: { number: 39, name: '水山蹇' }, 坤: { number: 8, name: '水地比' } },
  艮: { 乾: { number: 26, name: '山天大畜' }, 兑: { number: 41, name: '山泽损' }, 离: { number: 22, name: '山火贲' }, 震: { number: 27, name: '山雷颐' }, 巽: { number: 18, name: '山风蛊' }, 坎: { number: 4, name: '山水蒙' }, 艮: { number: 52, name: '艮为山' }, 坤: { number: 23, name: '山地剥' } },
  坤: { 乾: { number: 11, name: '地天泰' }, 兑: { number: 19, name: '地泽临' }, 离: { number: 36, name: '地火明夷' }, 震: { number: 24, name: '地雷复' }, 巽: { number: 46, name: '地风升' }, 坎: { number: 7, name: '地水师' }, 艮: { number: 15, name: '地山谦' }, 坤: { number: 2, name: '坤为地' } },
};

const hexagramThemes: Record<string, string> = {
  乾为天: '贵在主动开创，但要守正，不宜躁进。',
  坤为地: '贵在承载配合，先稳住资源，再谈推进。',
  水雷屯: '初始阻力较大，适合先搭框架、找帮手。',
  山水蒙: '信息未明，先学习、求证、请教，不宜急断。',
  水天需: '时机未到，守住准备，等待条件成熟。',
  天水讼: '有争执和分歧，先厘清边界，避免硬碰硬。',
  地水师: '需要组织纪律，先统一目标，再调动资源。',
  水地比: '重在结盟与依附，选择可信的人和平台。',
  风天小畜: '力量仍在积蓄，小步推进比大举冒进更好。',
  天泽履: '如履薄冰，礼数、规则、分寸最关键。',
  地天泰: '上下相通，适合推进合作和长期建设。',
  天地否: '气机不通，先收缩、清障、等局势转圜。',
  天火同人: '适合结伴同行，公开透明能聚人心。',
  火天大有: '资源较足，关键在于正确分配与守成。',
  地山谦: '以谦受益，降低姿态反而更容易成事。',
  雷地豫: '人心可动，但要防乐观过度。',
  泽雷随: '顺势而行，跟随变化，但不能失去主见。',
  山风蛊: '旧问题需整顿，先治本，再求新局。',
  地泽临: '机会临近，宜主动接近、观察反馈。',
  风地观: '先观察全局，暂不宜凭情绪决策。',
  火雷噬嗑: '有阻隔要咬断，适合处理规则和执行问题。',
  山火贲: '重在修饰与呈现，内容和外观都要顾及。',
  山地剥: '势在剥落，宜保核心，少做扩张。',
  地雷复: '转机初现，适合从小处恢复。',
  天雷无妄: '不妄为则无咎，按事实行动。',
  山天大畜: '积累深厚，宜蓄势待发。',
  山雷颐: '注意供养与言行，先修内在系统。',
  泽风大过: '压力超载，要减重、换梁、调整结构。',
  坎为水: '险象反复，守正、分步、备预案。',
  离为火: '重在清晰与依附，需看清所依之物是否可靠。',
  泽山咸: '感应互动强，关系和情绪是关键变量。',
  雷风恒: '贵在稳定持续，忌三分钟热度。',
  天山遁: '退不是败，是避锋芒、保主动权。',
  雷天大壮: '势大力强，尤其要守规则。',
  火地晋: '有上升机会，宜展示成果、争取认可。',
  地火明夷: '光明受伤，宜低调守内，不宜锋芒太露。',
  风火家人: '先正内部秩序，家人/团队关系是根。',
  火泽睽: '意见相背，先求同存异。',
  水山蹇: '前路有阻，宜换路径或求助。',
  雷水解: '阻力可解，行动后会有松动。',
  山泽损: '有所减损，换来结构更清。',
  风雷益: '有增益之象，适合投入有回报的事。',
  泽天夬: '需要决断，但要防过刚。',
  天风姤: '偶遇强缘，机会突来，也要防失控。',
  泽地萃: '聚合资源，适合集会、整合、组织。',
  地风升: '渐进上升，靠积累和台阶。',
  泽水困: '受困之象，少说多做，保存实力。',
  水风井: '根源未变，宜修井养源。',
  泽火革: '变革之象，需名正言顺。',
  火风鼎: '更新器物与制度，适合重组升级。',
  震为雷: '震动突来，先稳神，再行动。',
  艮为山: '止而后定，适合暂停、设边界。',
  风山渐: '循序渐进，慢就是快。',
  雷泽归妹: '关系或合作名分未正，谨慎承诺。',
  雷火丰: '盛大但易过满，防高位回落。',
  火山旅: '漂泊变动，宜轻装、守规矩。',
  巽为风: '柔入渐进，用沟通和渗透成事。',
  兑为泽: '喜悦沟通，利谈判，也防口舌。',
  风水涣: '涣散需重聚，先定共同目标。',
  水泽节: '节制有利，边界越清越稳。',
  风泽中孚: '诚信感通，以真实换信任。',
  雷山小过: '小事可过，大事宜谨慎。',
  水火既济: '阶段已成，防满而生变。',
  火水未济: '未完成，仍需补最后一环。',
};

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

function isYangLine(value: YaoValue) {
  return value === 7 || value === 9;
}

function isMovingLine(value: YaoValue) {
  return value === 6 || value === 9;
}

function changedLine(value: YaoValue): YaoValue {
  if (value === 6) {
    return 7;
  }
  if (value === 9) {
    return 8;
  }
  return value;
}

function castYao(): YaoValue {
  const heads = [0, 1, 2].reduce((sum) => sum + (Math.random() > 0.5 ? 1 : 0), 0);
  return ([6, 7, 8, 9] as YaoValue[])[heads];
}

function getTrigram(lines: YaoValue[]) {
  const key = lines.map((line) => (isYangLine(line) ? '1' : '0')).join('');
  return trigramByBits[key] ?? trigramByBits['000'];
}

function getHexagram(lines: YaoValue[]) {
  const lower = getTrigram(lines.slice(0, 3));
  const upper = getTrigram(lines.slice(3, 6));
  const entry = hexagramMatrix[upper.name]?.[lower.name] ?? { number: 0, name: '未成卦' };
  return {
    ...entry,
    lower,
    upper,
    theme: hexagramThemes[entry.name] ?? '此卦宜先看上下卦气是否相通，再看动爻落点决定进退。',
  };
}

function formatYao(value: YaoValue) {
  if (value === 6) {
    return '老阴';
  }
  if (value === 7) {
    return '少阳';
  }
  if (value === 8) {
    return '少阴';
  }
  return '老阳';
}

function movingLineAdvice(index: number, value: YaoValue) {
  const positions = ['初爻', '二爻', '三爻', '四爻', '五爻', '上爻'];
  const phase = ['事情刚起，先定方向。', '进入执行层，重在稳住基础。', '处在临界位，谨慎过度用力。', '开始接近外部环境，要看协作。', '来到主位，适合承担决策。', '事情到高处，防过满或收尾不当。'];
  const motion = value === 9 ? '阳动变阴，宜从强势转为收敛。' : '阴动变阳，宜从等待转为行动。';
  return `${positions[index]}动：${phase[index]}${motion}`;
}

function buildDivinationReading(question: string, lines: YaoValue[]) {
  if (lines.length !== 6) {
    return null;
  }
  const base = getHexagram(lines);
  const changedLines = lines.map(changedLine);
  const changed = getHexagram(changedLines);
  const moving = lines.map((line, index) => ({ line, index })).filter((item) => isMovingLine(item.line));
  const questionText = question.trim() || '未填写具体事项';
  const trend =
    moving.length === 0
      ? '无动爻，说明局势相对稳定，重点看本卦所示的长期结构。'
      : moving.length <= 2
        ? '动爻较少，事情有明确变化点，宜抓住关键节点处理。'
        : '动爻较多，局势变动明显，先稳住节奏，避免同时处理太多变量。';
  return { base, changed, moving, questionText, trend };
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
  const elementScoresByCycle = elementCycleOrder
    .map((element) => reading.elementScores.find((item) => item.element === element))
    .filter((item): item is BaziReading['elementScores'][number] => Boolean(item));

  return (
    <section className={compact ? 'section element-section compact' : 'section element-section'}>
      <div className="section-title">
        <h2>五行气势</h2>
        <span>喜用 {reading.usefulElements.join('、')}</span>
      </div>
      <div className="element-board">
        <div className="wheel" aria-label="五行盘">
          {elementScoresByCycle.map((item, index) => (
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
          {elementScoresByCycle.map((item) => (
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
  const scoreOf = (element: ElementName) => Math.round((reading.elementScores.find((item) => item.element === element)?.ratio ?? 0) * 100);
  const thermalBalance = `火约${scoreOf('火')}%，水约${scoreOf('水')}%`;
  const moistureBalance = `土约${scoreOf('土')}%，水约${scoreOf('水')}%，金约${scoreOf('金')}%`;
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
            {monthProfile.priority} 本盘寒暖参考为{thermalBalance}，燥湿参考为{moistureBalance}。
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
            <li>寒暖判断：{monthProfile.thermal} 本盘{thermalBalance}，若火不足则先补温度与行动力；若火已旺，则调候用火不可过头。</li>
            <li>燥湿判断：{monthProfile.moisture} 本盘{moistureBalance}，水土金的比例决定是先润、先燥，还是先疏通。</li>
            <li>{tiaohouHits.length ? `调候与喜用重合：${tiaohouHits.join('、')}，属于既补结构又调气候。` : `调候与扶抑有张力：${tensionElements.join('、')}需谨慎使用，不能一概当成喜。`}</li>
            <li>月令藏干：{reading.pillars[1].hiddenStems.join('、')}，说明气候背后还藏着{reading.pillars[1].branchTenGods.join('、') || '十神伏藏'}。</li>
            <li>取法次第：先处理{monthProfile.adjustment[0]}，再看{monthProfile.adjustment[1]}能否承接；若二者都不显，就要等大运流年或现实环境来补。</li>
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
  const relationTone = (relation: string) => (relation === '生' || relation === '助' ? 'good' : 'warn');
  const describeStemLink = (pillar: Pillar, next: Pillar, relation: string) =>
    `${pillar.stem}${stemElement[pillar.stem]} → ${next.stem}${stemElement[next.stem]}：${relation}`;
  const describeBranchLink = (pillar: Pillar, next: Pillar, relation: string) =>
    `${pillar.branch}${branchElement[pillar.branch]} → ${next.branch}${branchElement[next.branch]}：${relation}`;
  const describeRootLink = (pillar: Pillar, relation: string) =>
    `${pillar.stem}${stemElement[pillar.stem]} → ${pillar.branch}${branchElement[pillar.branch]}：${relation}`;

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
            <div className="flow-chart">
              <div className="flow-chart-row">
                {pillars.map((pillar, index) => (
                  <div className="flow-slot" key={`stem-slot-${pillar.key}`}>
                    <div className="flow-glyph-node">
                      <small>{pillar.stemTenGod}</small>
                      <GanZhiGlyph value={pillar.stem} type="stem" />
                    </div>
                    {index < adjacentPairs.length && (
                      <div className={`relation-line horizontal ${relationTone(adjacentPairs[index].stemRelation)}`}>
                        <span>{adjacentPairs[index].stemRelation}</span>
                        <em>{describeStemLink(pillar, adjacentPairs[index].next, adjacentPairs[index].stemRelation)}</em>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              <div className="flow-chart-row">
                {pillars.map((pillar, index) => {
                  const stemBranchRelation = getElementRelation(stemElement[pillar.stem], branchElement[pillar.branch]);
                  return (
                    <div className="flow-slot branch-slot" key={`branch-slot-${pillar.key}`}>
                      <div className={`relation-line vertical ${relationTone(stemBranchRelation)}`}>
                        <span>{stemBranchRelation}</span>
                        <em>{describeRootLink(pillar, stemBranchRelation)}</em>
                      </div>
                      <div className="flow-glyph-node">
                        <GanZhiGlyph value={pillar.branch} type="branch" />
                        <small>{pillar.branchTenGods[0] || '-'}</small>
                      </div>
                      {index < adjacentPairs.length && (
                        <div className={`relation-line horizontal branch-line ${relationTone(adjacentPairs[index].branchRelation)}`}>
                          <span>{adjacentPairs[index].branchRelation}</span>
                          <em>{describeBranchLink(pillar, adjacentPairs[index].next, adjacentPairs[index].branchRelation)}</em>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
          <div className="diagram-note-grid">
            <p>
              <strong>天干关系：</strong>
              {adjacentPairs.map((item) => describeStemLink(item.pillar, item.next, item.stemRelation)).join('；')}
            </p>
            <p>
              <strong>地支关系：</strong>
              {adjacentPairs.map((item) => describeBranchLink(item.pillar, item.next, item.branchRelation)).join('；')}
            </p>
            <p>
              <strong>上下关系：</strong>
              {pillars
                .map((pillar) => describeRootLink(pillar, getElementRelation(stemElement[pillar.stem], branchElement[pillar.branch])))
                .join('；')}
            </p>
            <p>
              <strong>总体判断：</strong>
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
    `山易排盘报告：${reading.input.name || '未命名'}`,
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

function YijingPage({ onBack, onGoBazi }: { onBack: () => void; onGoBazi: () => void }) {
  const [question, setQuestion] = useState('近期事业推进是否适合主动争取？');
  const [lines, setLines] = useState<YaoValue[]>([]);
  const reading = useMemo(() => buildDivinationReading(question, lines), [question, lines]);

  const castFullHexagram = () => {
    setLines(Array.from({ length: 6 }, () => castYao()));
  };

  const castOneLine = () => {
    setLines((current) => (current.length >= 6 ? [castYao()] : [...current, castYao()]));
  };

  return (
    <main className="yijing-shell">
      <header className="yijing-topbar">
        <button className="icon-text-button" onClick={onBack} type="button">
          <ArrowLeft size={17} />
          返回
        </button>
        <div className="topnav-brand">
          <div className="brand-symbol">易</div>
          <div>
            <strong>易经求卦</strong>
            <span>起卦 · 解卦 · 动爻参考</span>
          </div>
        </div>
        <button className="secondary-button slim" onClick={onGoBazi} type="button">
          <BookOpen size={16} />
          八字排盘
        </button>
      </header>

      <section className="yijing-layout">
        <aside className="yijing-control section">
          <div className="section-title">
            <h2>求卦</h2>
            <span>六爻自下而上</span>
          </div>
          <label>
            <span>所问事项</span>
            <textarea value={question} onChange={(event) => setQuestion(event.target.value)} />
          </label>
          <div className="yijing-actions">
            <button className="primary-button" onClick={castFullHexagram} type="button">
              <Sparkles size={17} />
              自动起卦
            </button>
            <button className="secondary-button" onClick={castOneLine} type="button">
              摇一爻 {lines.length ? `${lines.length}/6` : ''}
            </button>
            <button className="secondary-button" onClick={() => setLines([])} type="button">
              清空
            </button>
          </div>
          <div className="yijing-method">
            <strong>起卦说明</strong>
            <p>采用三枚铜钱法：六为老阴、七为少阳、八为少阴、九为老阳。老阴老阳为动爻，动则生成变卦。</p>
          </div>
        </aside>

        <section className="yijing-result">
          {!reading && (
            <div className="empty-divination section">
              <h2>尚未成卦</h2>
              <p>可以一次自动起卦，也可以逐爻摇出六爻。六爻完成后，会显示本卦、变卦、动爻和解读建议。</p>
            </div>
          )}

          {reading && (
            <>
              <div className="hexagram-summary section">
                <article>
                  <span>本卦</span>
                  <strong>
                    {reading.base.number}. {reading.base.name}
                  </strong>
                  <p>
                    上{reading.base.upper.name}{reading.base.upper.symbol}为{reading.base.upper.nature}，下{reading.base.lower.name}
                    {reading.base.lower.symbol}为{reading.base.lower.nature}。
                  </p>
                </article>
                <article>
                  <span>变卦</span>
                  <strong>
                    {reading.changed.number}. {reading.changed.name}
                  </strong>
                  <p>{reading.moving.length ? `动爻 ${reading.moving.map((item) => item.index + 1).join('、')} 位，局势由本卦转向变卦。` : '无动爻，以本卦为主，不另取变卦。'}</p>
                </article>
              </div>

              <div className="hexagram-board section">
                <div className="hexagram-lines" aria-label="六爻图">
                  {[...lines].reverse().map((line, reverseIndex) => {
                    const index = 5 - reverseIndex;
                    const yang = isYangLine(line);
                    return (
                      <div className="yao-row" key={`${index}-${line}`}>
                        <span>{['上', '五', '四', '三', '二', '初'][reverseIndex]}爻</span>
                        <div className={yang ? 'yao-line yang' : 'yao-line yin'}>
                          <i />
                          {!yang && <i />}
                        </div>
                        <em className={isMovingLine(line) ? 'moving' : ''}>{formatYao(line)}</em>
                      </div>
                    );
                  })}
                </div>
                <div className="hexagram-reading">
                  <h2>{reading.questionText}</h2>
                  <article>
                    <h3>卦意</h3>
                    <p>{reading.base.theme}</p>
                  </article>
                  <article>
                    <h3>趋势</h3>
                    <p>{reading.trend}</p>
                  </article>
                  <article>
                    <h3>现代解读</h3>
                    <p>
                      本卦上卦主外部环境，呈{reading.base.upper.image}；下卦主自身处境，呈{reading.base.lower.image}。
                      若要推进此事，先看内外是否同向，再看动爻提示的变化位置。
                    </p>
                  </article>
                </div>
              </div>

              <div className="moving-advice section">
                <div className="section-title">
                  <h2>动爻详解</h2>
                  <span>{reading.moving.length ? `${reading.moving.length} 个动爻` : '无动爻'}</span>
                </div>
                {reading.moving.length ? (
                  <div className="moving-grid">
                    {reading.moving.map((item) => (
                      <article key={item.index}>
                        <strong>{formatYao(item.line)}</strong>
                        <p>{movingLineAdvice(item.index, item.line)}</p>
                      </article>
                    ))}
                  </div>
                ) : (
                  <p className="plain-note">无动爻时，以本卦整体卦意为主，适合观察稳定结构，不急于改变策略。</p>
                )}
              </div>
            </>
          )}
        </section>
      </section>
    </main>
  );
}

function LoginPage({
  profileName,
  onChangeName,
  onLogin,
  onGuest,
  onYijing,
}: {
  profileName: string;
  onChangeName: (value: string) => void;
  onLogin: () => void;
  onGuest: () => void;
  onYijing: () => void;
}) {
  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    onLogin();
  };

  return (
    <main className="flow-shell login-screen">
      <section className="login-hero">
        <div className="brand-lockup">
          <div className="brand-symbol">山</div>
          <div>
            <span>Shan Yi Paipan</span>
            <h1>山易排盘</h1>
          </div>
        </div>
        <div className="login-preview" aria-hidden="true">
          <div className="preview-topline">
            <span>命盘预览</span>
            <strong>四柱 · 五行 · 大运</strong>
          </div>
          <div className="preview-board">
            <div className="preview-cell muted">日期</div>
            <div className="preview-cell muted">年柱</div>
            <div className="preview-cell muted">月柱</div>
            <div className="preview-cell muted">日柱</div>
            <div className="preview-cell muted">时柱</div>
            <div className="preview-cell muted">主星</div>
            <div className="preview-cell">伤官</div>
            <div className="preview-cell">比肩</div>
            <div className="preview-cell">日主</div>
            <div className="preview-cell">食神</div>
            <div className="preview-cell muted">天干</div>
            <div className="preview-cell gan">己</div>
            <div className="preview-cell gan fire">丙</div>
            <div className="preview-cell gan fire">丙</div>
            <div className="preview-cell gan">戊</div>
            <div className="preview-cell muted">地支</div>
            <div className="preview-cell zhi fire">巳</div>
            <div className="preview-cell zhi water">子</div>
            <div className="preview-cell zhi wood">寅</div>
            <div className="preview-cell zhi water">子</div>
          </div>
          <div className="preview-footer">
            <div>
              <span>日主</span>
              <strong>丙火</strong>
            </div>
            <div>
              <span>气势</span>
              <strong>中和</strong>
            </div>
            <div className="preview-elements">
              <i>木</i>
              <i>火</i>
              <i>土</i>
              <i>金</i>
              <i>水</i>
            </div>
          </div>
        </div>
        <div className="feature-strip" aria-label="核心能力">
          <span>四柱排盘</span>
          <span>五行气势</span>
          <span>专业深度页</span>
          <button onClick={onYijing} type="button">易经求卦</button>
        </div>
      </section>

      <section className="auth-card">
        <form onSubmit={handleSubmit}>
          <h2>登录山易排盘</h2>
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
  onYijing,
  onReset,
  onSubmit,
}: {
  input: BirthInput;
  onBack: () => void;
  onChange: (input: BirthInput) => void;
  onYijing: () => void;
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
          <button className="icon-text-button" onClick={onYijing} type="button">
            <BookOpen size={17} />
            易经求卦
          </button>
        </div>

        <div className="birth-heading">
          <p className="eyebrow">第二步 · 建立命盘资料</p>
          <h1>输入出生日期，生成四柱与完整详批。</h1>
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

    </main>
  );
}

function ReportTopNav({
  activeNav,
  onNavigate,
  onYijing,
}: {
  activeNav: NavTarget;
  onNavigate: (target: NavTarget) => void;
  onYijing: () => void;
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
        <div className="brand-symbol">山</div>
        <div>
          <strong>山易排盘</strong>
          <span>命盘报告</span>
        </div>
      </div>

      <nav className="topnav-tabs" aria-label="报告导航">
        {navItems.map((item) => (
          <button className={activeNav === item.key ? 'active' : ''} key={item.key} onClick={() => onNavigate(item.key)} type="button">
            {item.label}
          </button>
        ))}
        <button onClick={onYijing} type="button">
          易经求卦
        </button>
      </nav>
    </header>
  );
}

export default function App() {
  const [input, setInput] = useState(initialInput);
  const [submitted, setSubmitted] = useState(initialInput);
  const [step, setStep] = useState<AppStep>('login');
  const [yijingBackStep, setYijingBackStep] = useState<AppStep>('login');
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

  const openYijing = () => {
    setYijingBackStep(step);
    setStep('yijing');
  };

  const copyReport = async () => {
    if (!reading) {
      return;
    }
    const text = buildReportText(reading);
    try {
      await navigator.clipboard.writeText(text);
      setToast('已复制山易排盘报告');
    } catch {
      const textarea = document.createElement('textarea');
      textarea.value = text;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      textarea.remove();
      setToast('已复制山易排盘报告');
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
    link.download = `${reading.input.name || 'bazi'}-山易排盘报告.txt`;
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
        onYijing={openYijing}
        profileName={input.name}
      />
    );
  }

  if (step === 'yijing') {
    return (
      <>
        <YijingPage onBack={() => setStep(yijingBackStep === 'yijing' ? 'login' : yijingBackStep)} onGoBazi={() => setStep('birth')} />
        {toast && <div className="toast">{toast}</div>}
      </>
    );
  }

  if (step === 'birth') {
    return (
      <>
        <BirthSetupPage
          input={input}
          onBack={() => setStep('login')}
          onChange={setInput}
          onYijing={openYijing}
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
      <ReportTopNav activeNav={activeNav} onNavigate={scrollTo} onYijing={openYijing} />

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
