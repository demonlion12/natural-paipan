import { useEffect, useMemo, useRef, useState } from 'react';
import type { FormEvent, RefObject } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  Bookmark,
  BookOpen,
  CalendarDays,
  CheckCircle2,
  Clock3,
  Copy,
  Download,
  Edit3,
  FileText,
  GraduationCap,
  LibraryBig,
  LogIn,
  LogOut,
  MapPin,
  RefreshCw,
  RotateCcw,
  Search,
  Sparkles,
  UserRound,
} from 'lucide-react';
import { Solar } from 'lunar-javascript';
import { readingService } from './adapters/readingService';
import type { BaziReading, BirthInput, DeepDomainKey, ElementName, Pillar } from './core/types';
import { branchQuickReference, classicExcerpts, classicShelf, knowledgeModules, knowledgeQuizQuestions, knowledgeTerms, learningPaths, stemQuickReference, tenGodQuickReference } from './knowledge';
import type { ClassicBook, ClassicChapter } from './knowledge';

const initialInput: BirthInput = {
  name: '1232',
  gender: 'male',
  birthDate: '1990-01-01',
  birthTime: '00:00',
  birthplace: '未知地 北京时间',
};

type AppStep = 'login' | 'home' | 'birth' | 'report' | 'yijing' | 'learning';
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

type ElementRemedyGuide = {
  principle: string;
  timing: string[];
  environments: string[];
  workModes: string[];
  capabilities: string[];
  relationships: string[];
  actions: string[];
  items: string[];
  overuseSignals: string[];
  avoid: string[];
};

const elementRemedyGuide: Record<ElementName, ElementRemedyGuide> = {
  木: {
    principle: '取木之曲直与生发，用在建立方向、连续成长、疏通停滞，不等同于单纯增加绿色。',
    timing: ['把高认知任务放在清晨或一天的启动段', '以季度为单位经营一项可持续成长的主线'],
    environments: ['有自然光、通风、植物或书籍的学习空间', '公园、校园、文化机构、研发与教育场域'],
    workModes: ['适合策划、教育、产品孵化、研究与长期项目', '先搭框架再迭代，让项目有枝干、有里程碑'],
    capabilities: ['系统学习、写作表达、规划拆解', '柔韧沟通、持续迭代、把复杂问题理出脉络'],
    relationships: ['多接触能给方向和方法的师友', '关系中明确成长目标，避免一味迁就而失去主线'],
    actions: ['每天保留固定学习与输出时段', '每周推进一个长期项目里程碑', '散步、舒展和整理待办，使身心由滞转动'],
    items: ['书籍、纸笔、成长看板、木质器物可作提醒', '青绿色和东方位只作辅助象意，不代替实际行动'],
    overuseSignals: ['项目越开越多却没有收口', '想法繁盛、边界松散、长期被人情牵动'],
    avoid: ['同时铺太多方向', '只强调成长而不验收成果', '把摆放绿植当成主要补法'],
  },
  火: {
    principle: '取火之炎上与显明，用来暖局、启动、表达和把潜能变成可见成果；寒局尤重持续温养。',
    timing: ['珍惜白天与午前后的有效光照，重要推进尽量不拖到深夜', '用短周期冲刺启动，再安排冷却与复盘'],
    environments: ['采光良好、温暖干爽、交流活跃的空间', '演讲、展示、传播、运动和需要现场反馈的场域'],
    workModes: ['适合公开表达、品牌传播、销售推动、带队与快速验证', '任务必须可视化，设置交付日期和反馈对象'],
    capabilities: ['表达、呈现、决断、现场反应', '把抽象想法做成作品、演示、样品或明确结论'],
    relationships: ['主动回应、及时赞赏、把真实态度说清楚', '选择能鼓励行动但不会煽动冲动的伙伴'],
    actions: ['规律日间活动与适量运动', '每周至少一次公开输出或成果汇报', '当天完成一个能被看见的小闭环'],
    items: ['暖光照明、日程白板、进度牌和运动装备可作助缘', '红橙色、南向与明亮陈设只作辅助，不宜满屋堆叠'],
    overuseSignals: ['睡眠被挤压、讲话变急、承诺快速膨胀', '追求曝光胜过质量，容易情绪化决策'],
    avoid: ['熬夜硬冲和持续高刺激', '用冲动消费或社交热闹代替行动', '火已偏旺时继续盲目加火'],
  },
  土: {
    principle: '取土之承载与稼穑，用来收束、沉淀、建立信用和稳定兑现；湿土要疏燥，燥土要先润。',
    timing: ['固定睡起、用餐、结算和复盘时间', '以周为单位收口，以月为单位归档和清账'],
    environments: ['固定工位、稳定社区、资料可归档的空间', '秩序清楚、责任明确、能够长期经营的组织'],
    workModes: ['适合运营、项目管理、供应链、财务规划和长期服务', '把目标拆成责任人、期限、预算、验收四项'],
    capabilities: ['预算、归档、复盘、风险预案', '耐心执行、资源承接、把口头承诺写成清单'],
    relationships: ['以稳定兑现建立信任，减少含糊承诺', '照顾他人之前先确认自己的时间与资源容量'],
    actions: ['每周清理空间、文件和未结事项', '建立现金流与时间预算', '一次只推进少量关键任务并按期验收'],
    items: ['账本、收纳、档案系统、陶瓷与方正器物可作提醒', '黄色、中央位和土地意象只是辅助层'],
    overuseSignals: ['事情越积越多、对变化本能抗拒', '责任全揽在身上，身体和情绪都显沉重'],
    avoid: ['以稳定为名拖延决策', '湿滞时继续囤积物品与任务', '燥重时再用高压规则逼迫自己'],
  },
  金: {
    principle: '取金之从革与裁成，用来立规矩、做取舍、提高精度，使生发之气最终成为器用。',
    timing: ['在项目中段安排评审，在结束段安排验收', '固定留出做减法、清理和决策的时段'],
    environments: ['整洁、低噪、工具齐全、规则明确的空间', '法务、金融、技术、工程、审计与标准化组织'],
    workModes: ['适合流程设计、质量控制、谈判、技术与专业判断', '先定义标准和边界，再进入合作与交付'],
    capabilities: ['逻辑判断、数据核验、合同意识、精准表达', '拒绝无效需求、建立模板与检查清单'],
    relationships: ['重要合作先谈角色、钱、权、期限和退出机制', '表达原则时保留温度，避免把关系只处理成规则'],
    actions: ['每周删减一个低价值承诺', '为高频任务建立标准流程', '重要决定使用核对表并留书面记录'],
    items: ['计时器、金属工具、文件夹、合同模板可作助缘', '白灰色、西方位和圆形器物仅为象意辅助'],
    overuseSignals: ['评价过密、对自己和他人都变得苛刻', '为了正确牺牲协作，关系明显冷硬'],
    avoid: ['只讲规则不看情境', '频繁否定却不给替代方案', '金旺燥重时继续过度压缩与挑剔'],
  },
  水: {
    principle: '取水之润下与流通，用来润燥、蓄势、调研和保留回旋；寒湿命局补水必须受控。',
    timing: ['把深度思考、复盘和信息整理放在安静时段', '重大决定设置冷静期，但必须给冷静期设截止时间'],
    environments: ['安静、湿度舒适、信息可流动的空间', '研究、咨询、贸易、跨地域协作和临水但不阴寒的场域'],
    workModes: ['适合调研、咨询、数据、策略、跨平台资源连接', '先收集事实与备选方案，再小步试水'],
    capabilities: ['倾听、研究、复盘、情境判断', '建立资料库、信息筛选机制和风险缓冲'],
    relationships: ['先听清需求再回应，重要冲突留出缓冲', '保持边界，避免因共情过度承担他人情绪'],
    actions: ['每周做一次事实与判断分离的复盘', '重大选择准备至少两个替代方案', '主动请教并把信息转成下一步动作'],
    items: ['水杯、加湿与资料工具可作生活支持', '蓝黑色、北方位和水景只是象意；寒湿重者不宜以水景叠加'],
    overuseSignals: ['信息越收越多、迟迟不决定', '情绪反复、边界模糊、作息越来越晚'],
    avoid: ['用思考代替行动', '无节制接收信息', '寒湿已重时继续追求阴暗、临水、夜间环境'],
  },
};

const tenGodLuckMeanings: Record<string, { focus: string; opportunity: string; risk: string }> = {
  正官: { focus: '规则、职位、名分与责任', opportunity: '适合争取正式身份、制度内晋升、证书资质和长期合作。', risk: '压力感会变强，若原局抗压不足，容易被规则、人情或上级节奏牵制。' },
  偏官: { focus: '竞争、压力、突发任务与突破', opportunity: '适合处理硬仗、转型、竞争型岗位和高要求项目。', risk: '节奏过急时容易冒险，需有印星、流程或专业方法来化杀。' },
  正印: { focus: '学习、贵人、资质与保护', opportunity: '适合深造、拿资格、做专业沉淀，也利获得长辈或组织支持。', risk: '印太重时会想得多、动得慢，容易依赖安全感。' },
  偏印: { focus: '冷门技能、洞察、研究与非标路径', opportunity: '适合发展差异化能力、研究型项目、工具化方法和独立判断。', risk: '容易孤立、想偏或难被大众理解，必须用结果校准。' },
  正财: { focus: '稳定收入、经营、现实责任', opportunity: '适合稳定现金流、客户经营、资产配置和长期积累。', risk: '财来伴随责任，若身弱承财，容易被成本、家庭或现实事务压住。' },
  偏财: { focus: '项目资源、机会、人脉与流动财', opportunity: '适合商务合作、资源整合、副业项目和市场机会。', risk: '机会多也容易分心，忌贪快、贪多、贪轻松的钱。' },
  食神: { focus: '作品、口碑、稳定输出与生活感', opportunity: '适合内容、产品、服务、教学和可持续输出。', risk: '太安逸会降低冲劲，遇到压力时容易回避锋芒。' },
  伤官: { focus: '表达、创新、改革与锋芒', opportunity: '适合表达观点、重做流程、技术创新、品牌传播。', risk: '锋芒太露易冲官，重要关系中要留余地。' },
  比肩: { focus: '自我、同辈、合伙与竞争', opportunity: '适合增强个人品牌、同业协作、建立自己的节奏。', risk: '同辈竞争和资源分摊明显，合伙要先谈规则。' },
  劫财: { focus: '抢夺、合伙、资源重分配', opportunity: '适合破局、拉队伍、抢窗口，但要用制度管住资源。', risk: '钱、人、权容易被分走，忌冲动投资和口头承诺。' },
  日主: { focus: '自我承担、身份确认与主动选择', opportunity: '适合重新确立主线，靠个人决断推进。', risk: '过度自我会忽略协作，需看外部反馈。' },
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
const changShengOrder = ['长生', '沐浴', '冠带', '临官', '帝旺', '衰', '病', '死', '墓', '绝', '胎', '养'];
const changShengStart: Record<string, string> = { 甲: '亥', 乙: '午', 丙: '寅', 丁: '酉', 戊: '寅', 己: '酉', 庚: '巳', 辛: '子', 壬: '申', 癸: '卯' };
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

const divinationPresets = [
  '近期事业推进是否适合主动争取？',
  '这段关系下一步应不应该继续投入？',
  '当前合作是否值得推进？',
  '近期财运与项目回款走势如何？',
  '现在是否适合换工作或换方向？',
  '这件事目前最大的阻碍在哪里？',
];

const yaoPositionLabels = ['初爻', '二爻', '三爻', '四爻', '五爻', '上爻'];
const yaoDisplayLabels = ['上爻', '五爻', '四爻', '三爻', '二爻', '初爻'];

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

function getStemBranchRelation(stem: string, branch: string) {
  const stemWuXing = stemElement[stem];
  const branchWuXing = branchElement[branch];
  if (!stemWuXing || !branchWuXing) return '干支关系待定';
  if (stemWuXing === branchWuXing) return '干支同气';
  if (elementGenerates[branchWuXing as ElementName] === stemWuXing) return '坐下生身';
  if (elementGenerates[stemWuXing as ElementName] === branchWuXing) return '天干泄秀';
  if (elementControls[branchWuXing as ElementName] === stemWuXing) return '坐下受克';
  if (elementControls[stemWuXing as ElementName] === branchWuXing) return '天干制支';
  return '干支制化';
}

function getSelfDiShi(stem: string, branch: string) {
  const startIndex = branches.indexOf(changShengStart[stem]);
  const branchIndex = branches.indexOf(branch);
  if (startIndex < 0 || branchIndex < 0) return '-';
  const direction = stemPolarity[stem] === '阳' ? 1 : -1;
  return changShengOrder[(direction * (branchIndex - startIndex) + 24) % 12];
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
  const phase = ['事情刚起，先定方向。', '进入执行层，重在稳住基础。', '处在临界位，谨慎过度用力。', '开始接近外部环境，要看协作。', '来到主位，适合承担决策。', '事情到高处，防过满或收尾不当。'];
  const motion = value === 9 ? '阳动变阴，宜从强势转为收敛。' : '阴动变阳，宜从等待转为行动。';
  return `${yaoPositionLabels[index]}动：${phase[index]}${motion}`;
}

function buildDivinationDetail(base: ReturnType<typeof getHexagram>, changed: ReturnType<typeof getHexagram>, movingCount: number) {
  const inner = `下卦${base.lower.name}为${base.lower.nature}，主自身、资源、底层条件，象为${base.lower.image}。`;
  const outer = `上卦${base.upper.name}为${base.upper.nature}，主外部环境、对方态度、趋势压力，象为${base.upper.image}。`;
  const change =
    movingCount === 0
      ? '此卦无动爻，说明事态短期内不宜频繁改变策略，应以本卦为主，观察结构是否稳定。'
      : `动而成${changed.name}，说明此事不会停留在当前状态，后续会转向“${changed.theme}”所指的方向。`;
  const action =
    movingCount === 0
      ? '行动上宜守住原计划，做复盘、补材料、稳关系，不急着推翻现有方案。'
      : movingCount <= 2
        ? '行动上宜抓住动爻所指的关键节点，先处理最能撬动局面的一个问题。'
        : '行动上宜先降复杂度，把人、钱、时间、承诺拆开处理，不宜一次性押重注。';
  const caution =
    base.upper.name === '坎' || base.lower.name === '坎'
      ? '卦中见坎，需特别注意风险、反复、信息不全和隐性成本。'
      : base.upper.name === '艮' || base.lower.name === '艮'
        ? '卦中见艮，止象明显，遇到阻滞时先设边界，不宜硬冲。'
        : base.upper.name === '离' || base.lower.name === '离'
          ? '卦中见离，重在看清事实、证据和依附关系，避免只凭情绪判断。'
          : '此卦重点不在单点吉凶，而在内外卦是否能形成配合。';
  return { inner, outer, change, action, caution };
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
  const detail = buildDivinationDetail(base, changed, moving.length);
  return { base, changed, detail, moving, questionText, trend };
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
    selfDiShi: getSelfDiShi(stem, branch),
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
  const stemWuXing = (stemElement[stem] ?? '') as ElementName;
  const branchWuXing = (branchElement[branch] ?? '') as ElementName;
  const stemTenGod = getTenGod(reading.dayMaster.stem, stem);
  const hiddenStems = branchHiddenStems[branch] ?? [];
  const branchTenGods = hiddenStems.map((hiddenStem) => getTenGod(reading.dayMaster.stem, hiddenStem));
  const monthProfile = seasonProfileByBranch[reading.pillars[1].branch];
  const tenGodMeaning = tenGodLuckMeanings[stemTenGod] ?? tenGodLuckMeanings.日主;
  const usefulHits = [stemWuXing, branchWuXing].filter((element): element is ElementName =>
    reading.usefulElements.includes(element as ElementName),
  );
  const repeatsDominant = [stemWuXing, branchWuXing].includes(reading.structure.dominantElement);
  const climateHits = [stemWuXing, branchWuXing].filter((element): element is ElementName =>
    monthProfile.adjustment.includes(element as ElementName),
  );
  const elementAction = [...new Set([stemWuXing, branchWuXing, ...usefulHits])]
    .filter((element): element is ElementName => Boolean(elementRemedyGuide[element as ElementName]))
    .map((element) => `${element}：${elementRemedyGuide[element].actions[0]}`)
    .slice(0, 3);
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
  const stemFocus = `天干${stem}属${stemWuXing || '未知'}，十神为${stemTenGod}，主外显事件、选择方式与别人首先看到的状态。${tenGodMeaning.focus}会成为此运的表层主题。`;
  const branchFocus = `地支${branch}属${branchWuXing || '未知'}，藏干${hiddenStems.join('、') || '不显'}，对应${branchTenGods.join('、') || '十神不显'}，主底层环境、长期关系和真正消耗资源的地方。`;
  const climateText = climateHits.length
    ? `调候命中${climateHits.join('、')}，这步运不仅看机会，也能改善月令所带的寒暖燥湿问题。`
    : `调候未直接命中${monthProfile.adjustment.join('、')}，这步运要靠环境和行动去补，不宜只等运势自然变好。`;
  const opportunity = usefulHits.length
    ? `${usefulHits.join('、')}为命局所喜，此运适合把长期想做但缺条件的事拿到台面推进。`
    : repeatsDominant
      ? `原局${reading.structure.dominantElement}气被放大，适合利用既有优势抢效率，但要主动补${reading.usefulElements.join('、')}来防偏。`
      : `${stemWuXing || branchWuXing}运不算直接补用，胜在可以借十神主题做阶段转换：${tenGodMeaning.opportunity}`;
  const risk = repeatsDominant
    ? `风险在于惯性过强：越熟悉的打法越容易过度，尤其要防重复投入、情绪固执和单一路径押注。`
    : usefulHits.length
      ? `喜用被引动时也要防“顺手而贪多”，机会越多越要设预算、时间和承诺边界。`
      : tenGodMeaning.risk;
  const action = period.isCurrent
    ? '当前正在此运，重要决定要同时看原局短板、流年触发和现实资源，不宜只凭一时情绪推进。'
    : period.startYear > new Date().getFullYear()
      ? '未来进入此运前，先把专业能力、现金流和关系边界准备好，届时更容易承接机会。'
      : '这步运可作为回测样本，回看学习、迁移、事业压力、关系变化是否在此阶段明显被触发。';
  const actionSteps = [
    period.isCurrent ? '当下先做资源盘点：时间、现金流、人脉、技能各列一张清单。' : period.startYear > new Date().getFullYear() ? '提前三年准备该运主题所需的证书、案例、作品或合作资源。' : '回看此运的关键年份，标出迁移、换岗、合作、收入和关系变化。',
    usefulHits.length ? `主动选择带${usefulHits.join('、')}性质的岗位、合作和环境。` : `现实补${reading.usefulElements.join('、')}：${reading.usefulElements.map((element) => elementRemedyGuide[element].actions[0]).join('；')}。`,
    climateHits.length ? `调候上继续顺用${climateHits.join('、')}，但避免补过头。` : `调候上额外补${monthProfile.adjustment.join('、')}：${monthProfile.adjustment.map((element) => elementRemedyGuide[element].environments[0]).join('；')}。`,
    elementAction.length ? `落地动作：${elementAction.join('；')}。` : '落地动作：先定节奏、再看流年，不一次性做过大承诺。',
  ];
  const reviewPoint = period.isCurrent
    ? '当前运每年都要看流年是否触发冲合刑害，尤其留意钱、人、岗位与健康节奏的压力点。'
    : period.startYear > new Date().getFullYear()
      ? `进入${period.ganZhi}运前，先观察前一年是否已经出现${stemTenGod}主题的预兆。`
      : '此运适合做人生回测：哪些选择让你变顺，哪些选择只是重复旧惯性。';

  return {
    action,
    actionSteps,
    branchNote,
    branchFocus,
    climateText,
    phase: getLuckPhase(period),
    opportunity,
    reviewPoint,
    risk,
    stemFocus,
    stemNote,
    stemTenGod,
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
      <div className="profile-facts" aria-label="命盘基础坐标">
        <div><span>性别</span><strong>{reading.input.gender === 'male' ? '男' : '女'}</strong></div>
        <div><span>生肖</span><strong>{reading.zodiac}</strong></div>
        <div><span>出生地</span><strong>{reading.input.birthplace || '未填写'}</strong></div>
        <div><span>日主</span><strong>{reading.dayMaster.stem} · {reading.dayMaster.polarity}{reading.dayMaster.element}</strong></div>
        <div><span>胎元</span><strong>{reading.structure.taiYuan}</strong></div>
        <div><span>命宫</span><strong>{reading.structure.mingGong}</strong></div>
        <div><span>身宫</span><strong>{reading.structure.shenGong}</strong></div>
        <div><span>起运</span><strong>{reading.daYun.startText} · {reading.daYun.direction}</strong></div>
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

function getStrengthEvidence(reading: BaziReading) {
  const dayElement = reading.dayMaster.element;
  const motherElement = (Object.keys(elementGenerates) as ElementName[]).find((element) => elementGenerates[element] === dayElement) ?? dayElement;
  const outputElement = elementGenerates[dayElement];
  const wealthElement = elementControls[dayElement];
  const officerElement = elementControlledBy[dayElement];
  const monthPillar = reading.pillars[1];
  const monthMainStem = monthPillar.hiddenStems[0];
  const monthMainElement = stemElement[monthMainStem] as ElementName;
  const ratioOf = (elements: ElementName[]) => Math.round(reading.elementScores.filter((score) => elements.includes(score.element)).reduce((sum, score) => sum + score.ratio, 0) * 100);
  const locationsFor = (elements: ElementName[]) => reading.pillars.flatMap((pillar) => [
    ...(elements.includes(stemElement[pillar.stem] as ElementName) ? [`${pillar.label}${pillar.stem}透`] : []),
    ...pillar.hiddenStems.flatMap((stem, index) => elements.includes(stemElement[stem] as ElementName) ? [`${pillar.label}${pillar.branch}藏${stem}${index === 0 ? '本气' : index === 1 ? '中气' : '余气'}`] : []),
  ]);
  const roots = reading.pillars.flatMap((pillar) => pillar.hiddenStems.flatMap((stem, index) => stemElement[stem] === dayElement ? [`${pillar.label}${pillar.branch}藏${stem}${index === 0 ? '本根' : index === 1 ? '中根' : '余根'}`] : []));
  const supportLocations = locationsFor([dayElement, motherElement]);
  const pressureLocations = locationsFor([outputElement, wealthElement, officerElement]);
  return {
    month: {
      title: '月令司气',
      value: `${monthPillar.branch}${branchElement[monthPillar.branch]} · ${seasonProfileByBranch[monthPillar.branch].season}`,
      detail: `月令本气${monthMainStem}${monthMainElement}，对${dayElement}日主形成“${getElementRelation(monthMainElement, dayElement)}”的季节作用。${seasonProfileByBranch[monthPillar.branch].climate}。`,
    },
    roots: {
      title: '得地通根',
      value: roots.length ? `${roots.length} 处根气` : '原局无同类根',
      detail: roots.length ? roots.join('；') : `四支藏干未见${dayElement}同类，日主承载更依赖${motherElement}印星与岁运补助。`,
    },
    support: {
      title: '生扶力量',
      value: `${ratioOf([dayElement, motherElement])}% 结构占比`,
      detail: supportLocations.length ? supportLocations.join('；') : `原局未见明显${dayElement}比劫与${motherElement}印星来源。`,
    },
    pressure: {
      title: '克泄耗力量',
      value: `${ratioOf([outputElement, wealthElement, officerElement])}% 结构占比`,
      detail: pressureLocations.length ? pressureLocations.join('；') : '食伤、财星、官杀在原局显性与根气均不突出。',
    },
    supportRatio: ratioOf([dayElement, motherElement]),
  };
}

function getPillarRelationNotes(reading: BaziReading, pillar: Pillar) {
  return reading.pillars.filter((other) => other.key !== pillar.key).flatMap((other) => {
    const stemLinks = getPairRelations(pillar.stem, other.stem, combinePairs).map((relation) => `${pillar.label}与${other.label}天干：${relation}`);
    const branchLinks = getPairRelations(pillar.branch, other.branch, branchRelations).map((relation) => `${pillar.label}与${other.label}地支：${relation}`);
    const repeated = pillar.branch === other.branch ? [`${pillar.label}与${other.label}地支同见${pillar.branch}，主题有伏吟与重复倾向`] : [];
    return [...stemLinks, ...branchLinks, ...repeated];
  });
}

function PaipanSection({ reading, elementRef }: { reading: BaziReading; elementRef: RefObject<HTMLDivElement | null> }) {
  const stemNotes = collectPairNotes(reading.pillars.map((pillar) => pillar.stem), combinePairs, '无合冲关系');
  const branchNotes = collectPairNotes(reading.pillars.map((pillar) => pillar.branch), branchRelations, '未见明显冲合刑害');
  const strengthEvidence = getStrengthEvidence(reading);
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
    { label: '自坐', render: (pillar: BaziReading['pillars'][number]) => <span>{pillar.selfDiShi}</span> },
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
      <div className="paipan-core-strip">
        <div><span>日主</span><strong>{reading.dayMaster.stem} · {reading.dayMaster.polarity}{reading.dayMaster.element}</strong><small>{reading.dayMaster.strength}</small></div>
        <div><span>月令</span><strong>{reading.pillars[1].branch} · {seasonProfileByBranch[reading.pillars[1].branch].season}</strong><small>{seasonProfileByBranch[reading.pillars[1].branch].climate}</small></div>
        <div><span>结构</span><strong>{reading.deepDive.structureName}</strong><small>显神：{reading.structure.highlightedTenGods.join('、') || '分布较散'}</small></div>
        <div><span>喜用</span><strong>{reading.usefulElements.join('、')}</strong><small>调候：{seasonProfileByBranch[reading.pillars[1].branch].adjustment.join('、')}</small></div>
      </div>
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
      <section className="strength-evidence-section">
        <div className="paipan-subhead">
          <div><span>强弱不是数个数</span><h2>旺衰判定依据</h2></div>
          <p>结论：{reading.dayMaster.strength}。依次检查月令、通根、生扶与克泄耗，再用岁运和现实经历复核。</p>
        </div>
        <div className="strength-balance">
          <div><span>生扶侧 {strengthEvidence.supportRatio}%</span><span>克泄耗侧 {100 - strengthEvidence.supportRatio}%</span></div>
          <div className="strength-track"><span style={{ width: `${strengthEvidence.supportRatio}%` }} /></div>
        </div>
        <div className="strength-evidence-grid">
          {[strengthEvidence.month, strengthEvidence.roots, strengthEvidence.support, strengthEvidence.pressure].map((evidence, index) => (
            <article key={evidence.title}>
              <span>{String(index + 1).padStart(2, '0')}</span>
              <h3>{evidence.title}</h3>
              <strong>{evidence.value}</strong>
              <p>{evidence.detail}</p>
            </article>
          ))}
        </div>
        <p className="method-disclaimer">结构占比来自天干、藏干层级与月令加权，用于展示证据方向，不等同于传统典籍中的唯一旺衰标准；边界命局仍需结合格局、合化和岁运回测。</p>
      </section>
      <section className="pillar-detail-section">
        <div className="paipan-subhead">
          <div><span>从一柱看一层人生坐标</span><h2>四柱逐柱信息</h2></div>
          <p>每柱同时看天干外显、地支根基、宫位时间，以及它与其余三柱形成的关系。</p>
        </div>
        <div className="pillar-detail-grid">
          {reading.pillars.map((pillar, pillarIndex) => {
            const palace = palaceMeanings[pillar.key];
            const relations = getPillarRelationNotes(reading, pillar);
            const stars = getShenShaForBranch(reading, pillar.stem, pillar.branch);
            return (
              <article className="pillar-detail-card" key={pillar.key}>
                <header>
                  <span>{String(pillarIndex + 1).padStart(2, '0')}</span>
                  <div><h3>{pillar.label} · {palace.title}</h3><small>{palace.time} · {palace.space}</small></div>
                  <strong>{pillar.ganZhi}</strong>
                </header>
                <div className="pillar-detail-glyphs">
                  <div><small>{pillar.stemTenGod}</small><GanZhiGlyph value={pillar.stem} type="stem" /><span>{stemPolarity[pillar.stem]}{stemElement[pillar.stem]}</span></div>
                  <div><small>地支根基</small><GanZhiGlyph value={pillar.branch} type="branch" /><span>{branchElement[pillar.branch]} · {getStemBranchRelation(pillar.stem, pillar.branch)}</span></div>
                </div>
                <div className="hidden-stem-list">
                  {pillar.hiddenStems.map((stem, index) => <div key={stem}><span>{index === 0 ? '本气' : index === 1 ? '中气' : '余气'}</span><strong>{stem}{stemElement[stem]}</strong><small>{pillar.branchTenGods[index]}</small></div>)}
                </div>
                <dl>
                  <div><dt>星运</dt><dd>{pillar.diShi}</dd></div>
                  <div><dt>自坐</dt><dd>{pillar.selfDiShi}</dd></div>
                  <div><dt>纳音</dt><dd>{pillar.naYin}</dd></div>
                  <div><dt>空亡</dt><dd>{pillar.xunKong}</dd></div>
                </dl>
                <div className="pillar-star-list"><strong>神煞</strong><div>{stars.length ? stars.map((star) => <span key={star}>{star}</span>) : <span>未见主要神煞</span>}</div></div>
                <div className="pillar-relation-list"><strong>柱间关系</strong>{relations.length ? relations.map((relation) => <p key={relation}>{relation}</p>) : <p>与其余三柱未见主要天干五合、地支冲合刑害。</p>}</div>
              </article>
            );
          })}
        </div>
      </section>
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
    { label: '自坐', render: (column: typeof detailColumns[number]) => <span>{column.selfDiShi}</span> },
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
  const fireScore = scoreOf('火');
  const waterScore = scoreOf('水');
  const earthScore = scoreOf('土');
  const metalScore = scoreOf('金');
  const thermalBalance = `火约${fireScore}%，水约${waterScore}%`;
  const moistureBalance = `土约${earthScore}%，水约${waterScore}%，金约${metalScore}%`;
  const isColdSeason = ['亥', '子', '丑'].includes(monthBranch);
  const isHotSeason = ['巳', '午', '未'].includes(monthBranch);
  const isWetSeason = ['亥', '子', '丑', '辰'].includes(monthBranch);
  const isDrySeason = ['巳', '午', '未', '申', '酉', '戌'].includes(monthBranch);
  const thermalDiagnosis =
    isColdSeason && fireScore >= 28
      ? `月令仍以寒论，但原局火约${fireScore}%，已经有解冻和发用的条件。重点是让火稳定、持续、有承接，不是继续追求更热。`
      : isColdSeason
        ? '寒气当令，火是第一层调候；宜先建立白天节律、行动与可见输出，再谈其他补偏。'
        : isHotSeason && waterScore >= 24
          ? `月令偏热，但原局水约${waterScore}%，已有润燥条件。重点是让水能收敛火势，不宜一边补水一边继续高刺激消耗。`
          : isHotSeason
            ? '热燥当令，先用水润、金收，使行动有回旋；不宜再用熬夜、冲刺和密集社交加火。'
            : waterScore >= 30 && fireScore <= 15
      ? '寒湿偏重，先补火的温度、曝光和行动力，再用土来收束水势。'
      : fireScore >= 32 && waterScore <= 15
        ? '偏热少润，宜补水金的冷静、复盘和边界，不宜再用高刺激方式催动。'
        : fireScore >= 30
          ? '火气较显，行动力和表达不弱，调候重点在防燥、防急、防过度消耗。'
          : waterScore >= 28
            ? '水气较显，思考、感受和流动性强，调候重点在用火把想法落实。'
            : '寒暖不极端，关键不是单补某一行，而是让火水有来有往。';
  const moistureDiagnosis =
    isWetSeason && waterScore + earthScore >= 45
      ? '水土并重，容易形成湿滞：现实里表现为事情堆积、想法反复、推进速度慢，需要火来烘、木来疏。'
      : isWetSeason
        ? '月令带湿，先看事情能否流动和收口。即使盘中见火，也应以持续温养、疏通积压为主，不按夏季燥局处理。'
        : isDrySeason && fireScore + earthScore >= 45
        ? '火土并重，容易偏燥：现实里表现为急、硬、耗，需水来润、金来收。'
        : isDrySeason
          ? '月令带燥，优先保留弹性、恢复与信息回流，再看水金是否足以润收。'
        : metalScore >= 28 && waterScore <= 15
          ? '金旺少水，容易干脆但不够柔润，宜增加沟通缓冲和信息复盘。'
          : waterScore <= 12
            ? '水少偏燥，做事容易缺少回旋与耐心，宜补安静、复盘和长期流动资源。'
            : '燥湿相对可调，重点看岁运是否突然加重水土或火土。';
  const remedyElements = [...new Set([...monthProfile.adjustment, ...reading.usefulElements])].slice(0, 4);
  const primaryClimateElement = monthProfile.adjustment[0];
  const secondaryClimateElement = monthProfile.adjustment[1];
  const primaryClimateScore = scoreOf(primaryClimateElement);
  const remedyPlan = remedyElements.map((element) => {
    const isPrimaryClimate = element === primaryClimateElement;
    const isClimate = monthProfile.adjustment.includes(element);
    const isUseful = reading.usefulElements.includes(element);
    const score = scoreOf(element);
    const level = isPrimaryClimate ? '第一优先' : isClimate && isUseful ? '重点协同' : isClimate ? '调候辅助' : '结构辅助';
    const dosage = score >= 30
      ? `盘中${element}约${score}%，已有明显基础，应以“疏导、规范、不过量”为主。`
      : score <= 12
        ? `盘中${element}约${score}%，根气偏少，宜小量持续建立，不宜短期猛补。`
        : `盘中${element}约${score}%，可按现实反馈稳定使用，重点是形成流通。`;
    return { element, guide: elementRemedyGuide[element], isClimate, isUseful, level, dosage };
  });
  const decisionOrder = [
    `先调月令：先处理${primaryClimateElement}，目标是修正${monthProfile.climate}带来的发挥条件。`,
    `再做承接：用${secondaryClimateElement}承接${primaryClimateElement}，避免只补一端造成新的偏枯。`,
    `再扶日主：结合${dayStrength}，以${reading.usefulElements.join('、')}改善承压、输出或约束。`,
    `最后看岁运：大运流年若已经补足同一五行，现实方案应减量，不再机械叠加。`,
  ];
  const verificationSignals = [
    `启动：重要事情从决定到开始的时间是否缩短，同时没有明显冲动增加。`,
    `持续：连续四周能否稳定完成关键任务，而不是三天用力、随后停摆。`,
    `关系：表达与边界是否更清楚，冲突后恢复速度是否改善。`,
    `资源：时间、现金流、睡眠和承诺是否仍在可控范围。若任一项持续恶化，说明补法过量或方向不合。`,
  ];
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
          <span>过量警示</span>
          <strong>{avoidElements.join('、') || reading.structure.dominantElement}</strong>
          <p>
            {avoidElements.length
              ? `${avoidElements.join('、')}已偏旺，岁运再增时容易放大惯性。`
              : `${reading.structure.dominantElement}为命局主气，未必为忌，但过度时会压住其他五行。`}
            取用要看能否形成流通，而不是把某一行越补越多。
          </p>
        </article>
      </div>

      <div className="remedy-priority" aria-label="调候执行顺序">
        {decisionOrder.map((item, index) => (
          <div key={item}>
            <span>{index + 1}</span>
            <p>{item}</p>
          </div>
        ))}
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

        <article className="wide-card">
          <h3>三、寒暖燥湿细看</h3>
          <div className="climate-detail">
            <div>
              <strong>寒暖</strong>
              <p>
                {monthProfile.thermal} 盘面参考为{thermalBalance}。{thermalDiagnosis}
              </p>
            </div>
            <div>
              <strong>燥湿</strong>
              <p>
                {monthProfile.moisture} 盘面参考为{moistureBalance}。{moistureDiagnosis}
              </p>
            </div>
            <div>
              <strong>补法次第</strong>
              <p>
                先按月令处理{monthProfile.adjustment[0]}，再用{monthProfile.adjustment[1]}承接；若与扶抑喜用冲突，就“少量、持续、可回收”地补，不做极端改变。
              </p>
            </div>
          </div>
          <div className="method-basis">
            <strong>判断依据</strong>
            <p>
              先以月令定四时寒暖燥湿，再用原局火、水、土、金的比例校验，最后才合看日主旺衰与岁运。五行的基本性质参考
              <a href="https://ctext.org/shang-shu/great-plan/zhs" target="_blank" rel="noreferrer">《尚书·洪范》</a>
              所述润下、炎上、曲直、从革、稼穑；燥湿不可偏枯的判断参考
              <a href="https://zh.wikisource.org/zh/%E6%BB%B4%E5%A4%A9%E9%AB%93/16" target="_blank" rel="noreferrer">《滴天髓·燥湿》</a>。
              现代方案是基于这些原则做的生活转译，不是古籍原文直接给出的物品清单。
            </p>
          </div>
        </article>

        <article>
          <h3>四、现实取用</h3>
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
          <h3>五、岁运观察</h3>
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

        <article className="wide-card">
          <h3>六、完整调候方案</h3>
          <p>
            以下先按月令调气候，再按日主旺衰补结构。物品、颜色和方位仅放在最后作为提醒；真正有分量的是时间安排、工作方式、能力结构、关系边界与长期环境。
          </p>
          <div className="remedy-grid">
            {remedyPlan.map(({ element, guide, isClimate, isUseful, level, dosage }) => {
              return (
                <div className="remedy-card" key={element}>
                  <div className="remedy-card-title">
                    <strong>取{element}</strong>
                    <span>{level}</span>
                    {isClimate && <small>调候</small>}
                    {isUseful && <small>喜用</small>}
                  </div>
                  <p className="remedy-principle">{guide.principle}</p>
                  <p><b>剂量判断：</b>{dosage}</p>
                  <dl>
                    <div><dt>时间节律</dt><dd>{guide.timing.join('；')}</dd></div>
                    <div><dt>空间环境</dt><dd>{guide.environments.join('；')}</dd></div>
                    <div><dt>工作路径</dt><dd>{guide.workModes.join('；')}</dd></div>
                    <div><dt>能力训练</dt><dd>{guide.capabilities.join('；')}</dd></div>
                    <div><dt>人际策略</dt><dd>{guide.relationships.join('；')}</dd></div>
                    <div><dt>日常动作</dt><dd>{guide.actions.join('；')}</dd></div>
                    <div><dt>资源与器用</dt><dd>{guide.items.join('；')}</dd></div>
                    <div><dt>过量信号</dt><dd>{guide.overuseSignals.join('；')}</dd></div>
                    <div><dt>避免</dt><dd>{guide.avoid.join('；')}</dd></div>
                  </dl>
                </div>
              );
            })}
          </div>
        </article>

        <article className="wide-card verification-card">
          <h3>七、执行周期与纠偏</h3>
          <div className="execution-grid">
            <div>
              <strong>前 7 天 · 减少阻塞</strong>
              <p>先停止最明显的反向习惯：{elementRemedyGuide[primaryClimateElement].avoid[0]}。只选一个最小动作开始，不同时改造全部生活。</p>
            </div>
            <div>
              <strong>第 2-4 周 · 建立主线</strong>
              <p>{elementRemedyGuide[primaryClimateElement].actions[0]}；同时用{secondaryClimateElement}的方式承接：{elementRemedyGuide[secondaryClimateElement].actions[0]}。</p>
            </div>
            <div>
              <strong>第 2-3 月 · 看现实结果</strong>
              <p>把方案放进真实工作、关系和资源选择中。若只有情绪感受变好、交付和边界没有改善，就需要调整剂量。</p>
            </div>
          </div>
          <ul className="verification-list">
            {verificationSignals.map((item) => <li key={item}>{item}</li>)}
          </ul>
          <p className="method-note">
            本盘首调{primaryClimateElement}，当前占比约{primaryClimateScore}%。调候取法只用于传统命理的生活规划参考；涉及饮食、睡眠、身体不适或情绪问题时，应以医学与专业意见为准。
          </p>
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
                    <li>{currentDescription.stemFocus}</li>
                    <li>{currentDescription.branchFocus}</li>
                  </ul>
                </div>
                <div>
                  <h4>机会窗口</h4>
                  <ul>
                    <li>{currentDescription.opportunity}</li>
                    <li>{currentDescription.climateText}</li>
                    {reading.deepDive.currentLuck.bestFor.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                </div>
                <div>
                  <h4>风险边界</h4>
                  <ul>
                    <li>{currentDescription.risk}</li>
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
                    {currentDescription.actionSteps.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                    <li>{currentDescription.reviewPoint}</li>
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
        {reading.daYun.periods.map((period) => {
          const description = describeLuckPeriod(reading, period);
          return (
            <article className={period.isCurrent ? 'luck-period-card current' : 'luck-period-card'} key={`${period.startYear}-${period.ganZhi}`}>
              <div className="luck-period-head">
                <div>
                  <strong>{period.ganZhi}</strong>
                  <span>{description.phase}</span>
                </div>
                <p>
                  {period.startYear}-{period.endYear} · {period.startAge}-{period.endAge}岁
                </p>
              </div>
              <div className="luck-period-body">
                <p>{description.theme}</p>
                <div className="luck-detail-block">
                  <h4>十神与原局</h4>
                  <ul>
                    <li>{description.stemFocus}</li>
                    <li>{description.branchFocus}</li>
                    <li>{description.stemNote}</li>
                    <li>{description.branchNote}</li>
                  </ul>
                </div>
                <div className="luck-detail-block">
                  <h4>机会与风险</h4>
                  <ul>
                    <li>{description.opportunity}</li>
                    <li>{description.risk}</li>
                    <li>{description.climateText}</li>
                  </ul>
                </div>
                <div className="luck-detail-block">
                  <h4>行动清单</h4>
                  <ul>
                    {description.actionSteps.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                    <li>{description.reviewPoint}</li>
                  </ul>
                </div>
              </div>
              <small>
                空亡：{period.xunKong} · {description.usefulText} · 十神主线：{description.stemTenGod}
              </small>
            </article>
          );
        })}
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
  const remedyElements = [...new Set([...monthProfile.adjustment, ...reading.usefulElements])].slice(0, 4);
  const remedyText = remedyElements
    .map((element) => {
      const guide = elementRemedyGuide[element];
      return [
        `取${element}：${guide.principle}`,
        `时间节律：${guide.timing.join('；')}`,
        `空间环境：${guide.environments.join('；')}`,
        `工作路径：${guide.workModes.join('；')}`,
        `能力训练：${guide.capabilities.join('；')}`,
        `人际策略：${guide.relationships.join('；')}`,
        `日常动作：${guide.actions.join('；')}`,
        `资源与器用：${guide.items.join('；')}`,
        `过量信号：${guide.overuseSignals.join('；')}`,
        `避免：${guide.avoid.join('；')}`,
      ].join('\n');
    })
    .join('\n\n');
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
      return [
        `${period.ganZhi} ${period.startYear}-${period.endYear} ${period.startAge}-${period.endAge}岁：${description.theme}`,
        `十神主线：${description.stemFocus} ${description.branchFocus}`,
        `原局触发：${description.stemNote} ${description.branchNote}`,
        `机会：${description.opportunity}`,
        `风险：${description.risk}`,
        `调候：${description.climateText}`,
        `行动：${description.actionSteps.join('；')}`,
      ].join('\n');
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
    `调候补法：\n${remedyText}`,
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

type LearningView = 'paths' | 'curriculum' | 'practice' | 'glossary' | 'classics' | 'reference';
type ClassicLibraryMode = 'shelf' | 'reader' | 'excerpts';
type QuizAttempt = { selected: number; correct: boolean };
type PracticeFilter = '全部' | '未作答' | '错题';

function getClassicRelatedModules(bookId: string, chapterTitle: string) {
  const ids = new Set<string>(['classic-reading']);
  if (bookId === 'qiongtong') {
    ids.add('structure-useful');
    ids.add('strength-roots');
  }
  if (/五行|木|火|土|金|水|坎離|震兌/.test(chapterTitle)) ids.add('yin-yang-elements');
  if (/天干|甲|乙|丙|丁|戊|己|庚|辛|壬|癸/.test(chapterTitle)) ids.add('stems');
  if (/地支|方局|戰合|順反|恩怨/.test(chapterTitle)) ids.add('relations-deep');
  if (/格局|從化|體用|真假|清濁|眾寡/.test(chapterTitle)) ids.add('structure-patterns');
  if (/寒暖|中和|衰旺|月令|源流|通隔/.test(chapterTitle)) ids.add('structure-useful');
  if (/六親|夫妻|子女|父母/.test(chapterTitle)) ids.add('palace-kinship');
  if (/歲運|貞元|生時/.test(chapterTitle)) ids.add('luck-cycle');
  return knowledgeModules.filter((module) => ids.has(module.id));
}

function LearningPage({ onBack, onGoBazi, onYijing }: { onBack: () => void; onGoBazi: () => void; onYijing: () => void }) {
  const [view, setView] = useState<LearningView>('paths');
  const [activeModuleId, setActiveModuleId] = useState(knowledgeModules[0].id);
  const [query, setQuery] = useState('');
  const [activeBook, setActiveBook] = useState('全部');
  const [classicMode, setClassicMode] = useState<ClassicLibraryMode>('shelf');
  const [classicBook, setClassicBook] = useState<ClassicBook | null>(null);
  const [classicLoading, setClassicLoading] = useState(false);
  const [chapterLoading, setChapterLoading] = useState(false);
  const [activeChapterData, setActiveChapterData] = useState<ClassicChapter | null>(null);
  const [classicError, setClassicError] = useState('');
  const [activeChapterId, setActiveChapterId] = useState('01');
  const [readerLayer, setReaderLayer] = useState<'all' | 'original' | 'guide'>('all');
  const [termCategory, setTermCategory] = useState('全部');
  const [practiceCategory, setPracticeCategory] = useState('全部');
  const [practiceFilter, setPracticeFilter] = useState<PracticeFilter>('全部');
  const [activeQuizId, setActiveQuizId] = useState(knowledgeQuizQuestions[0].id);
  const [selectedQuizAnswer, setSelectedQuizAnswer] = useState<number | null>(null);
  const [quizAttempts, setQuizAttempts] = useState<Record<string, QuizAttempt>>(() => {
    try {
      return JSON.parse(window.localStorage.getItem('shanyi-quiz-attempts') || '{}') as Record<string, QuizAttempt>;
    } catch {
      return {};
    }
  });
  const [classicBookmarks, setClassicBookmarks] = useState<string[]>(() => {
    try {
      return JSON.parse(window.localStorage.getItem('shanyi-classic-bookmarks') || '[]') as string[];
    } catch {
      return [];
    }
  });
  const [classicReadingPositions, setClassicReadingPositions] = useState<Record<string, string>>(() => {
    try {
      return JSON.parse(window.localStorage.getItem('shanyi-classic-positions') || '{}') as Record<string, string>;
    } catch {
      return {};
    }
  });
  const chapterLoadRequest = useRef(0);
  const [completedLessons, setCompletedLessons] = useState<string[]>(() => {
    try {
      return JSON.parse(window.localStorage.getItem('shanyi-learning-progress') || '[]') as string[];
    } catch {
      return [];
    }
  });
  const totalLessons = knowledgeModules.reduce((sum, module) => sum + module.lessons.length, 0);
  const completedCount = completedLessons.filter((id) => knowledgeModules.some((module) => module.lessons.some((lesson) => lesson.id === id))).length;
  const progress = Math.round((completedCount / totalLessons) * 100);
  const normalizedQuery = query.trim().toLowerCase();
  const activeModule = knowledgeModules.find((module) => module.id === activeModuleId) ?? knowledgeModules[0];
  const searchResults = normalizedQuery
    ? knowledgeModules.flatMap((module) => module.lessons
      .filter((lesson) => [module.title, lesson.title, lesson.summary, ...lesson.points].join(' ').toLowerCase().includes(normalizedQuery))
      .map((lesson) => ({ module, lesson })))
    : [];
  const books = ['全部', ...new Set(classicExcerpts.map((excerpt) => excerpt.book))];
  const filteredClassics = classicExcerpts.filter((excerpt) => {
    const matchesBook = activeBook === '全部' || excerpt.book === activeBook;
    const matchesQuery = !normalizedQuery || [excerpt.book, excerpt.chapter, excerpt.original, excerpt.translation, ...excerpt.notes]
      .join(' ')
      .toLowerCase()
      .includes(normalizedQuery);
    return matchesBook && matchesQuery;
  });
  const termCategories = ['全部', ...new Set(knowledgeTerms.map((term) => term.category))];
  const filteredTerms = knowledgeTerms.filter((term) => {
    const matchesCategory = termCategory === '全部' || term.category === termCategory;
    const matchesQuery = !normalizedQuery || [term.term, ...term.aliases, term.definition, term.caution].join(' ').toLowerCase().includes(normalizedQuery);
    return matchesCategory && matchesQuery;
  });
  const practiceCategories = ['全部', ...new Set(knowledgeQuizQuestions.map((question) => question.category))];
  const filteredQuizQuestions = knowledgeQuizQuestions.filter((question) => {
    const attempt = quizAttempts[question.id];
    const matchesCategory = practiceCategory === '全部' || question.category === practiceCategory;
    const matchesFilter = practiceFilter === '全部' || (practiceFilter === '未作答' ? !attempt : Boolean(attempt && !attempt.correct));
    return matchesCategory && matchesFilter;
  });
  const activeQuizQuestion = filteredQuizQuestions.find((question) => question.id === activeQuizId) ?? filteredQuizQuestions[0];
  const activeQuizAttempt = activeQuizQuestion ? quizAttempts[activeQuizQuestion.id] : undefined;
  const activeQuizModule = activeQuizQuestion ? knowledgeModules.find((module) => module.id === activeQuizQuestion.moduleId) : undefined;
  const activeQuizLesson = activeQuizModule?.lessons.find((lesson) => lesson.id === activeQuizQuestion?.lessonId);
  const answeredQuizCount = Object.keys(quizAttempts).filter((id) => knowledgeQuizQuestions.some((question) => question.id === id)).length;
  const correctQuizCount = Object.entries(quizAttempts).filter(([id, attempt]) => attempt.correct && knowledgeQuizQuestions.some((question) => question.id === id)).length;
  const wrongQuizCount = Object.entries(quizAttempts).filter(([id, attempt]) => !attempt.correct && knowledgeQuizQuestions.some((question) => question.id === id)).length;
  const activeChapter = classicBook?.chapters.find((chapter) => chapter.id === activeChapterId) ?? classicBook?.chapters[0];
  const chapterIndex = activeChapter ? classicBook?.chapters.findIndex((chapter) => chapter.id === activeChapter.id) ?? 0 : 0;
  const filteredChapters = classicBook?.chapters.filter((chapter) => !normalizedQuery || [chapter.title, chapter.guide].join(' ').toLowerCase().includes(normalizedQuery)) ?? [];
  const relatedModules = activeChapter && classicBook ? getClassicRelatedModules(classicBook.id, activeChapter.title) : [];
  const activeBookmarkKey = classicBook && activeChapter ? `${classicBook.id}:${activeChapter.id}` : '';

  const loadClassicChapter = async (book: ClassicBook, chapterId: string) => {
    const chapter = book.chapters.find((item) => item.id === chapterId);
    if (!chapter) return;
    const requestId = ++chapterLoadRequest.current;
    const cacheKey = `shanyi-classic:${book.id}:${book.version}:${chapter.id}`;
    setChapterLoading(true);
    setClassicError('');
    try {
      let cached: string | null = null;
      try {
        cached = window.localStorage.getItem(cacheKey);
      } catch {
        cached = null;
      }
      if (cached) {
        if (requestId === chapterLoadRequest.current) setActiveChapterData(JSON.parse(cached) as ClassicChapter);
        return;
      }
      const response = await fetch(`${import.meta.env.BASE_URL}${chapter.path}`, { cache: 'force-cache' });
      if (!response.ok) throw new Error(`篇章载入失败（${response.status}）`);
      const data = await response.json() as ClassicChapter;
      if (requestId !== chapterLoadRequest.current) return;
      setActiveChapterData(data);
      try {
        window.localStorage.setItem(cacheKey, JSON.stringify(data));
      } catch {
        // Storage can be unavailable in private browsing; HTTP caching still applies.
      }
    } catch (error) {
      if (requestId === chapterLoadRequest.current) setClassicError(error instanceof Error ? error.message : '篇章载入失败');
    } finally {
      if (requestId === chapterLoadRequest.current) setChapterLoading(false);
    }
  };

  const selectClassicChapter = (chapterId: string, book = classicBook) => {
    if (!book) return;
    setActiveChapterId(chapterId);
    setActiveChapterData(null);
    setClassicReadingPositions((current) => {
      const next = { ...current, [book.id]: chapterId };
      window.localStorage.setItem('shanyi-classic-positions', JSON.stringify(next));
      return next;
    });
    void loadClassicChapter(book, chapterId);
  };

  const openClassicBook = async (bookId: string, targetChapterId?: string) => {
    const meta = classicShelf.find((book) => book.id === bookId);
    if (!meta || !('path' in meta)) return;
    setClassicMode('reader');
    setClassicLoading(true);
    setClassicError('');
    setQuery('');
    try {
      const response = await fetch(`${import.meta.env.BASE_URL}${meta.path}`, { cache: 'force-cache' });
      if (!response.ok) throw new Error(`古籍载入失败（${response.status}）`);
      const book = await response.json() as ClassicBook;
      const currentCachePrefix = `shanyi-classic:${book.id}:${book.version}:`;
      try {
        for (let index = window.localStorage.length - 1; index >= 0; index -= 1) {
          const key = window.localStorage.key(index);
          if (key?.startsWith(`shanyi-classic:${book.id}:`) && !key.startsWith(currentCachePrefix)) window.localStorage.removeItem(key);
        }
      } catch {
        // The reader works without persistent storage when the browser blocks it.
      }
      setClassicBook(book);
      const rememberedChapterId = classicReadingPositions[book.id];
      const requestedChapterId = targetChapterId ?? rememberedChapterId;
      const firstChapterId = requestedChapterId && book.chapters.some((chapter) => chapter.id === requestedChapterId) ? requestedChapterId : book.chapters[0]?.id ?? '01';
      setActiveChapterId(firstChapterId);
      setActiveChapterData(null);
      setClassicReadingPositions((current) => {
        const next = { ...current, [book.id]: firstChapterId };
        window.localStorage.setItem('shanyi-classic-positions', JSON.stringify(next));
        return next;
      });
      void loadClassicChapter(book, firstChapterId);
    } catch (error) {
      setClassicError(error instanceof Error ? error.message : '古籍载入失败');
    } finally {
      setClassicLoading(false);
    }
  };

  const moveChapter = (offset: number) => {
    if (!classicBook || !activeChapter) return;
    const next = classicBook.chapters[Math.max(0, Math.min(classicBook.chapters.length - 1, chapterIndex + offset))];
    if (next) {
      selectClassicChapter(next.id);
      window.scrollTo({ top: 260, behavior: 'smooth' });
    }
  };

  const toggleLesson = (lessonId: string) => {
    setCompletedLessons((current) => {
      const next = current.includes(lessonId) ? current.filter((id) => id !== lessonId) : [...current, lessonId];
      window.localStorage.setItem('shanyi-learning-progress', JSON.stringify(next));
      return next;
    });
  };

  const toggleClassicBookmark = () => {
    if (!activeBookmarkKey) return;
    setClassicBookmarks((current) => {
      const next = current.includes(activeBookmarkKey) ? current.filter((key) => key !== activeBookmarkKey) : [...current, activeBookmarkKey];
      window.localStorage.setItem('shanyi-classic-bookmarks', JSON.stringify(next));
      return next;
    });
  };

  const chooseQuizQuestion = (questionId: string) => {
    setActiveQuizId(questionId);
    setSelectedQuizAnswer(null);
  };

  const submitQuizAnswer = () => {
    if (!activeQuizQuestion || selectedQuizAnswer === null || activeQuizAttempt) return;
    const nextAttempt = { selected: selectedQuizAnswer, correct: selectedQuizAnswer === activeQuizQuestion.answer };
    setQuizAttempts((current) => {
      const next = { ...current, [activeQuizQuestion.id]: nextAttempt };
      window.localStorage.setItem('shanyi-quiz-attempts', JSON.stringify(next));
      return next;
    });
  };

  const retryQuizQuestion = () => {
    if (!activeQuizQuestion) return;
    setQuizAttempts((current) => {
      const next = { ...current };
      delete next[activeQuizQuestion.id];
      window.localStorage.setItem('shanyi-quiz-attempts', JSON.stringify(next));
      return next;
    });
    setSelectedQuizAnswer(null);
  };

  const moveQuizQuestion = () => {
    if (!activeQuizQuestion || !filteredQuizQuestions.length) return;
    const index = filteredQuizQuestions.findIndex((question) => question.id === activeQuizQuestion.id);
    const next = filteredQuizQuestions[(index + 1) % filteredQuizQuestions.length];
    chooseQuizQuestion(next.id);
  };

  const openQuizCourse = () => {
    if (!activeQuizQuestion) return;
    setActiveModuleId(activeQuizQuestion.moduleId);
    setQuery('');
    setView('curriculum');
  };

  const renderLesson = (lesson: (typeof knowledgeModules)[number]['lessons'][number], moduleTitle?: string) => {
    const isComplete = completedLessons.includes(lesson.id);
    return (
      <article className={isComplete ? 'lesson-card completed' : 'lesson-card'} key={lesson.id}>
        <div className="lesson-heading">
          <div>
            {moduleTitle && <span>{moduleTitle}</span>}
            <h3>{lesson.title}</h3>
          </div>
          <button aria-pressed={isComplete} onClick={() => toggleLesson(lesson.id)} type="button">
            <CheckCircle2 size={16} />
            {isComplete ? '已学' : '标记已学'}
          </button>
        </div>
        <p className="lesson-summary">{lesson.summary}</p>
        <ul>
          {lesson.points.map((point) => <li key={point}>{point}</li>)}
        </ul>
        <div className="lesson-practice">
          <strong>练习</strong>
          <p>{lesson.practice}</p>
        </div>
      </article>
    );
  };

  return (
    <main className="learning-shell">
      <header className="learning-topbar">
        <button className="icon-text-button" onClick={onBack} type="button">
          <ArrowLeft size={17} />
          返回
        </button>
        <div className="topnav-brand">
          <div className="brand-symbol">学</div>
          <div>
            <strong>山易命理学堂</strong>
            <span>四柱知识库</span>
          </div>
        </div>
        <div className="learning-top-actions">
          <button className="secondary-button slim" onClick={onGoBazi} type="button">
            <BookOpen size={16} />
            八字排盘
          </button>
          <button className="secondary-button slim" onClick={onYijing} type="button">
            <Sparkles size={16} />
            易经求卦
          </button>
        </div>
      </header>

      <section className="learning-hero">
        <div>
          <span className="eyebrow">从概念到实盘</span>
          <h1>四柱八字知识库</h1>
          <p>按固定推盘顺序学习，先理解原理，再读古籍，最后用真实命盘回测。</p>
        </div>
        <div className="learning-progress">
          <div>
            <strong>{completedCount}/{totalLessons}</strong>
            <span>已完成知识点</span>
          </div>
          <div className="progress-track"><span style={{ width: `${progress}%` }} /></div>
          <small>{progress}%</small>
        </div>
      </section>

      <section className="learning-toolbar">
        <div className="learning-tabs" role="tablist" aria-label="学习内容">
          <button aria-selected={view === 'paths'} className={view === 'paths' ? 'active' : ''} onClick={() => { setView('paths'); setQuery(''); }} role="tab" type="button">
            <GraduationCap size={17} /> 学习路线
          </button>
          <button aria-selected={view === 'curriculum'} className={view === 'curriculum' ? 'active' : ''} onClick={() => setView('curriculum')} role="tab" type="button">
            <BookOpen size={17} /> 课程体系
          </button>
          <button aria-selected={view === 'practice'} className={view === 'practice' ? 'active' : ''} onClick={() => { setView('practice'); setQuery(''); }} role="tab" type="button">
            <CheckCircle2 size={17} /> 练习复盘
          </button>
          <button aria-selected={view === 'glossary'} className={view === 'glossary' ? 'active' : ''} onClick={() => { setView('glossary'); setQuery(''); }} role="tab" type="button">
            <FileText size={17} /> 术语词典
          </button>
          <button aria-selected={view === 'classics'} className={view === 'classics' ? 'active' : ''} onClick={() => setView('classics')} role="tab" type="button">
            <LibraryBig size={17} /> 古籍研读
          </button>
          <button aria-selected={view === 'reference'} className={view === 'reference' ? 'active' : ''} onClick={() => setView('reference')} role="tab" type="button">
            <Search size={17} /> 基础速查
          </button>
        </div>
        {view !== 'paths' && view !== 'practice' && view !== 'reference' && <label className="knowledge-search">
          <Search size={17} />
          <input aria-label="搜索知识库" onChange={(event) => setQuery(event.target.value)} placeholder="搜索天干、十神、调候或古籍篇名" value={query} />
        </label>}
      </section>

      {view === 'paths' && (
        <section className="learning-path-library">
          <div className="learning-overview">
            <div><strong>{knowledgeModules.length}</strong><span>课程章节</span></div>
            <div><strong>{totalLessons}</strong><span>核心课节</span></div>
            <div><strong>{knowledgeTerms.length}</strong><span>术语词条</span></div>
            <div><strong>{knowledgeQuizQuestions.length}</strong><span>分层练习</span></div>
            <div><strong>{classicShelf.filter((book) => 'path' in book).length}</strong><span>全文古籍</span></div>
          </div>
          <div className="knowledge-section-head">
            <div><span>按目标进入</span><h2>专题学习路线</h2></div>
            <p>每条路线只组合完成目标所需章节；已学进度会自动计入。</p>
          </div>
          <div className="learning-path-grid">
            {learningPaths.map((path, pathIndex) => {
              const modules = path.moduleIds.map((id) => knowledgeModules.find((module) => module.id === id)).filter((module): module is (typeof knowledgeModules)[number] => Boolean(module));
              const lessonIds = modules.flatMap((module) => module.lessons.map((lesson) => lesson.id));
              const learned = lessonIds.filter((id) => completedLessons.includes(id)).length;
              const pathProgress = Math.round((learned / lessonIds.length) * 100);
              return (
                <article className="learning-path-card" key={path.id}>
                  <header><span>{String(pathIndex + 1).padStart(2, '0')}</span><small>{path.duration}</small></header>
                  <h3>{path.title}</h3>
                  <strong>{path.audience}</strong>
                  <p>{path.summary}</p>
                  <div className="path-progress"><span style={{ width: `${pathProgress}%` }} /></div>
                  <small>{learned}/{lessonIds.length} 节 · {pathProgress}%</small>
                  <div className="path-module-list">
                    {modules.map((module) => <button key={module.id} onClick={() => { setActiveModuleId(module.id); setView('curriculum'); }} type="button"><span>{String(module.order).padStart(2, '0')}</span>{module.title}<ArrowRight size={13} /></button>)}
                  </div>
                  <footer><strong>完成后</strong><p>{path.outcome}</p></footer>
                </article>
              );
            })}
          </div>
        </section>
      )}

      {view === 'curriculum' && (
        <section className="curriculum-layout">
          <aside className="curriculum-nav">
            <div className="section-title">
              <h2>学习路径</h2>
              <span>共 {knowledgeModules.length} 章</span>
            </div>
            {knowledgeModules.map((module) => {
              const learned = module.lessons.filter((lesson) => completedLessons.includes(lesson.id)).length;
              return (
                <button className={activeModule.id === module.id ? 'active' : ''} key={module.id} onClick={() => { setActiveModuleId(module.id); setQuery(''); }} type="button">
                  <span>{String(module.order).padStart(2, '0')}</span>
                  <div><strong>{module.title}</strong><small>{module.level} · {learned}/{module.lessons.length}</small></div>
                </button>
              );
            })}
          </aside>
          <div className="curriculum-content">
            {normalizedQuery ? (
              <>
                <div className="knowledge-section-head">
                  <div><span>搜索结果</span><h2>找到 {searchResults.length} 个知识点</h2></div>
                </div>
                {searchResults.length ? searchResults.map(({ module, lesson }) => renderLesson(lesson, module.title)) : <div className="empty-knowledge">未找到相关知识点，请换一个关键词。</div>}
              </>
            ) : (
              <>
                <div className="knowledge-section-head">
                  <div><span>{activeModule.level} · 第 {activeModule.order} 章</span><h2>{activeModule.title}</h2></div>
                  <p>{activeModule.summary}</p>
                </div>
                {activeModule.lessons.map((lesson) => renderLesson(lesson))}
              </>
            )}
          </div>
        </section>
      )}

      {view === 'practice' && (
        <section className="practice-library">
          <div className="practice-summary">
            <div><span>题库</span><strong>{knowledgeQuizQuestions.length}</strong><small>道结构化练习</small></div>
            <div><span>已作答</span><strong>{answeredQuizCount}</strong><small>{Math.round((answeredQuizCount / knowledgeQuizQuestions.length) * 100)}% 完成</small></div>
            <div><span>正确</span><strong>{correctQuizCount}</strong><small>{answeredQuizCount ? Math.round((correctQuizCount / answeredQuizCount) * 100) : 0}% 正确率</small></div>
            <div><span>待复盘</span><strong>{wrongQuizCount}</strong><small>错题可反复重做</small></div>
          </div>
          <div className="practice-controls">
            <div className="practice-categories" aria-label="练习分类">
              {practiceCategories.map((category) => <button className={practiceCategory === category ? 'active' : ''} key={category} onClick={() => { setPracticeCategory(category); setActiveQuizId(''); setSelectedQuizAnswer(null); }} type="button">{category}</button>)}
            </div>
            <div className="practice-filter" aria-label="作答状态">
              {(['全部', '未作答', '错题'] as PracticeFilter[]).map((filter) => <button className={practiceFilter === filter ? 'active' : ''} key={filter} onClick={() => { setPracticeFilter(filter); setActiveQuizId(''); setSelectedQuizAnswer(null); }} type="button">{filter}{filter === '错题' ? ` ${wrongQuizCount}` : ''}</button>)}
            </div>
          </div>
          <div className="practice-layout">
            <aside className="question-index">
              <header><strong>题目目录</strong><span>{filteredQuizQuestions.length} 题</span></header>
              <div>
                {filteredQuizQuestions.map((question, index) => {
                  const attempt = quizAttempts[question.id];
                  return <button className={[activeQuizQuestion?.id === question.id ? 'active' : '', attempt ? (attempt.correct ? 'correct' : 'wrong') : ''].filter(Boolean).join(' ')} key={question.id} onClick={() => chooseQuizQuestion(question.id)} type="button"><span>{String(index + 1).padStart(2, '0')}</span><div><strong>{question.category} · {question.level}</strong><small>{attempt ? (attempt.correct ? '已掌握' : '待复盘') : '未作答'}</small></div></button>;
                })}
              </div>
            </aside>
            {activeQuizQuestion ? (
              <article className="quiz-panel">
                <header>
                  <div><span>{activeQuizQuestion.category} · {activeQuizQuestion.level}</span><small>{knowledgeQuizQuestions.findIndex((question) => question.id === activeQuizQuestion.id) + 1} / {knowledgeQuizQuestions.length}</small></div>
                  <h2>{activeQuizQuestion.prompt}</h2>
                </header>
                <div className="quiz-options">
                  {activeQuizQuestion.options.map((option, index) => {
                    const shownSelection = activeQuizAttempt?.selected ?? selectedQuizAnswer;
                    const isCorrect = Boolean(activeQuizAttempt && index === activeQuizQuestion.answer);
                    const isWrong = Boolean(activeQuizAttempt && index === activeQuizAttempt.selected && !activeQuizAttempt.correct);
                    return <button className={[shownSelection === index ? 'selected' : '', isCorrect ? 'correct' : '', isWrong ? 'wrong' : ''].filter(Boolean).join(' ')} disabled={Boolean(activeQuizAttempt)} key={option} onClick={() => setSelectedQuizAnswer(index)} type="button"><span>{String.fromCharCode(65 + index)}</span><p>{option}</p>{isCorrect && <CheckCircle2 size={18} />}</button>;
                  })}
                </div>
                {activeQuizAttempt && (
                  <div className={activeQuizAttempt.correct ? 'quiz-feedback correct' : 'quiz-feedback wrong'}>
                    <strong>{activeQuizAttempt.correct ? '回答正确' : `正确答案：${String.fromCharCode(65 + activeQuizQuestion.answer)}`}</strong>
                    <p>{activeQuizQuestion.explanation}</p>
                  </div>
                )}
                <div className="quiz-actions">
                  {!activeQuizAttempt ? <button className="primary-button" disabled={selectedQuizAnswer === null} onClick={submitQuizAnswer} type="button">确认答案</button> : <button className="secondary-button" onClick={retryQuizQuestion} type="button"><RotateCcw size={15} /> 重做此题</button>}
                  <button className="secondary-button" onClick={moveQuizQuestion} type="button">下一题 <ArrowRight size={15} /></button>
                </div>
                <footer className="quiz-course-link">
                  <div><span>对应知识点</span><strong>{activeQuizModule?.title} · {activeQuizLesson?.title}</strong></div>
                  <button onClick={openQuizCourse} type="button">回到课程复习 <ArrowRight size={14} /></button>
                </footer>
              </article>
            ) : <div className="empty-knowledge">当前筛选下没有题目。完成答题后，错题会自动进入复盘列表。</div>}
          </div>
        </section>
      )}

      {view === 'classics' && (
        <section className="classics-library">
          <div className="classic-library-nav" role="tablist" aria-label="古籍阅读方式">
            <button className={classicMode === 'shelf' ? 'active' : ''} onClick={() => { setClassicMode('shelf'); setQuery(''); }} role="tab" type="button"><LibraryBig size={16} /> 全文书架</button>
            <button className={classicMode === 'excerpts' ? 'active' : ''} onClick={() => { setClassicMode('excerpts'); setQuery(''); }} role="tab" type="button"><BookOpen size={16} /> 经典摘读</button>
            {classicMode === 'reader' && <button className="active" role="tab" type="button"><FileText size={16} /> {classicBook?.title ?? '全文阅读'}</button>}
          </div>
          <div className="classic-intro">
            <strong>编校说明</strong>
            <p>公版古籍按书、卷、篇整理全文，并区分原典正文、旧注与本站白话导读；每部书标明底本和版本说明。仍受版权保护的近现代著作只制作知识索引，不复制整本或现成译注。</p>
          </div>

          {classicMode === 'shelf' && (
            <div className="classic-shelf">
              {classicShelf.map((book) => {
                const ready = 'path' in book;
                return (
                  <article className={ready ? 'classic-book-card ready' : 'classic-book-card'} key={book.id}>
                    <div className="classic-book-mark">{book.title.slice(0, 1)}</div>
                    <div>
                      <span>{book.dynasty} · {book.chapterCount} {book.id === 'lixu' ? '卷' : '篇'}</span>
                      <h2>{book.title}</h2>
                      <p>{book.summary}</p>
                      {ready && classicReadingPositions[book.id] && <small className="classic-book-resume">上次读至第 {Number(classicReadingPositions[book.id])} 篇</small>}
                    </div>
                    <button disabled={!ready} onClick={() => openClassicBook(book.id)} type="button">
                      {ready ? <>{classicReadingPositions[book.id] ? '继续阅读' : '阅读全文'} <ArrowRight size={15} /></> : '全文校勘中'}
                    </button>
                  </article>
                );
              })}
            </div>
          )}

          {classicMode === 'reader' && (
            <div className="classic-reader">
              {classicLoading && <div className="empty-knowledge">正在载入全文与目录…</div>}
              {classicError && <div className="empty-knowledge">{classicError}</div>}
              {classicBook && !classicLoading && (
                <>
                  <header className="classic-reader-head">
                    <button className="icon-text-button" onClick={() => setClassicMode('shelf')} type="button"><ArrowLeft size={15} /> 返回书架</button>
                    <div><span>{classicBook.dynasty} · 全 {classicBook.chapterCount} 篇</span><h2>{classicBook.title}</h2><p>{classicBook.attribution}</p></div>
                    <a href={classicBook.sourceUrl} rel="noreferrer" target="_blank">核对底本 <ArrowRight size={14} /></a>
                  </header>
                  <div className="classic-reader-layout">
                    <aside className="classic-toc">
                      <div><strong>全书目录</strong><span>{filteredChapters.length}/{classicBook.chapterCount}</span></div>
                      {filteredChapters.map((chapter) => <button className={chapter.id === activeChapter?.id ? 'active' : ''} key={chapter.id} onClick={() => selectClassicChapter(chapter.id)} type="button"><span>{chapter.id}</span>{chapter.title}</button>)}
                      {!filteredChapters.length && <p>目录中没有匹配内容。</p>}
                    </aside>
                    {activeChapter && (
                      <article className="classic-chapter">
                        <div className="classic-chapter-title">
                          <div><span>第 {Number(activeChapter.id)} 篇</span><h1>{activeChapter.title}</h1></div>
                          <div className="reader-actions">
                            <button aria-label={classicBookmarks.includes(activeBookmarkKey) ? '取消书签' : '添加书签'} className={classicBookmarks.includes(activeBookmarkKey) ? 'reader-bookmark active' : 'reader-bookmark'} onClick={toggleClassicBookmark} title={classicBookmarks.includes(activeBookmarkKey) ? '取消书签' : '添加书签'} type="button"><Bookmark fill={classicBookmarks.includes(activeBookmarkKey) ? 'currentColor' : 'none'} size={17} /></button>
                            <div className="reader-layer-switch" aria-label="阅读层次">
                              <button className={readerLayer === 'all' ? 'active' : ''} onClick={() => setReaderLayer('all')} type="button">对照</button>
                              <button className={readerLayer === 'original' ? 'active' : ''} onClick={() => setReaderLayer('original')} type="button">原文</button>
                              <button className={readerLayer === 'guide' ? 'active' : ''} onClick={() => setReaderLayer('guide')} type="button">导读</button>
                            </div>
                          </div>
                        </div>
                        {readerLayer !== 'original' && <section className="chapter-guide"><strong>白话导读</strong><p>{activeChapter.guide}</p></section>}
                        {chapterLoading && <div className="chapter-loading"><span /><p>正在读取本地篇章…</p></div>}
                        {!chapterLoading && readerLayer !== 'guide' && activeChapterData && <div className="chapter-blocks">
                          {activeChapterData.blocks.map((block, index) => (
                            <section className={block.heading === '命式示例' ? 'example-block' : ''} key={`${activeChapter.id}-${index}`}>
                              {block.heading && block.heading !== '命式示例' && <h3>{block.heading}</h3>}
                              {block.heading === '命式示例' ? (
                                <div className="classic-example-chart"><span>命式示例</span><p>{block.original}</p></div>
                              ) : (
                                <div className="original-text">{index === 0 && <span>原典正文</span>}<blockquote>{block.original}</blockquote></div>
                              )}
                              {readerLayer === 'all' && block.commentary && <div className="old-commentary"><span>底本旧注</span>{block.commentary.split('\n').map((line) => <p key={line}>{line}</p>)}</div>}
                            </section>
                          ))}
                        </div>}
                        <footer className="chapter-pagination">
                          <button disabled={chapterIndex <= 0} onClick={() => moveChapter(-1)} type="button"><ArrowLeft size={15} /> 上一篇</button>
                          <span>{chapterIndex + 1} / {classicBook.chapterCount}</span>
                          <button disabled={chapterIndex >= classicBook.chapters.length - 1} onClick={() => moveChapter(1)} type="button">下一篇 <ArrowRight size={15} /></button>
                        </footer>
                      </article>
                    )}
                    <aside className="classic-meta">
                      <strong>版本说明</strong>
                      <p>{classicBook.editionNote}</p>
                      <dl><dt>底本</dt><dd>{classicBook.sourceLabel}</dd><dt>整理日期</dt><dd>{classicBook.updatedAt}</dd><dt>收录状态</dt><dd>{classicBook.status} · {classicBook.chapterCount} 篇</dd><dt>加载方式</dt><dd>本地分篇 · 已读缓存</dd></dl>
                      <strong>阅读建议</strong>
                      <ol><li>先读正文，不急于套命盘。</li><li>再看旧注的时代语境。</li><li>用白话导读提炼问题。</li><li>回到知识体系核对概念。</li></ol>
                      <strong>关联知识</strong>
                      <div className="classic-related-modules">
                        {relatedModules.map((module) => <button key={module.id} onClick={() => { setActiveModuleId(module.id); setQuery(''); setView('curriculum'); }} type="button">{module.title}<ArrowRight size={13} /></button>)}
                      </div>
                      <strong>阅读记录</strong>
                      <p>{classicBookmarks.filter((key) => key.startsWith(`${classicBook.id}:`)).length} 个书签 · 自动记住本书上次篇章</p>
                    </aside>
                  </div>
                </>
              )}
            </div>
          )}

          {classicMode === 'excerpts' && <>
            <div className="book-filter" aria-label="古籍筛选">
              {books.map((book) => <button className={activeBook === book ? 'active' : ''} key={book} onClick={() => setActiveBook(book)} type="button">{book}</button>)}
            </div>
            <div className="classic-study-list">
              {filteredClassics.map((excerpt) => (
              <article className="classic-study-card" key={excerpt.id}>
                <header>
                  <div><span>{excerpt.book}</span><h2>{excerpt.chapter}</h2></div>
                  <div className="related-tags">{excerpt.related.map((item) => <small key={item}>{item}</small>)}</div>
                </header>
                <div className="classic-two-layer">
                  <div>
                    <span>古籍原文</span>
                    <blockquote>{excerpt.original}</blockquote>
                  </div>
                  <div>
                    <span>白话译解</span>
                    <p>{excerpt.translation}</p>
                  </div>
                </div>
                <div className="classic-notes">
                  <strong>学习要点</strong>
                  <ul>{excerpt.notes.map((note) => <li key={note}>{note}</li>)}</ul>
                </div>
                <a href={excerpt.sourceUrl} rel="noreferrer" target="_blank">查看原文与版本出处 · {excerpt.sourceLabel} <ArrowRight size={15} /></a>
              </article>
            ))}
            {!filteredClassics.length && <div className="empty-knowledge">未找到相关古籍段落。</div>}
            </div>
          </>}
        </section>
      )}

      {view === 'glossary' && (
        <section className="glossary-library">
          <div className="glossary-filter" aria-label="术语分类">
            {termCategories.map((category) => <button className={termCategory === category ? 'active' : ''} key={category} onClick={() => setTermCategory(category)} type="button">{category}</button>)}
          </div>
          <div className="knowledge-section-head">
            <div><span>概念速查</span><h2>{normalizedQuery ? `找到 ${filteredTerms.length} 个术语` : `${termCategory} · ${filteredTerms.length} 条`}</h2></div>
            <p>释义说明它是什么，“辨析”提醒它最容易被误用在哪里。</p>
          </div>
          <div className="glossary-grid">
            {filteredTerms.map((term) => {
              const module = knowledgeModules.find((item) => item.id === term.moduleId);
              return (
                <article className="glossary-card" key={term.id}>
                  <header><span>{term.category}</span>{term.aliases.length > 0 && <small>又称：{term.aliases.join('、')}</small>}</header>
                  <h3>{term.term}</h3>
                  <p>{term.definition}</p>
                  <div><strong>辨析</strong><p>{term.caution}</p></div>
                  <footer>
                    {module && <button onClick={() => { setActiveModuleId(module.id); setQuery(''); setView('curriculum'); }} type="button">相关课程 · {module.title}<ArrowRight size={13} /></button>}
                    {term.classicRef && <button onClick={() => { setQuery(''); setView('classics'); void openClassicBook(term.classicRef!.bookId, term.classicRef!.chapterId); }} type="button">原典 · {term.classicRef.label}<ArrowRight size={13} /></button>}
                  </footer>
                </article>
              );
            })}
            {!filteredTerms.length && <div className="empty-knowledge">没有匹配的术语，请更换关键词或分类。</div>}
          </div>
        </section>
      )}

      {view === 'reference' && (
        <section className="reference-library">
          <article>
            <div className="knowledge-section-head"><div><span>基础编码</span><h2>十天干速查</h2></div></div>
            <div className="reference-table-wrap"><table><thead><tr><th>天干</th><th>阴阳五行</th><th>核心类象</th></tr></thead><tbody>{stemQuickReference.map((row) => <tr key={row[0]}>{row.map((cell) => <td key={cell}>{cell}</td>)}</tr>)}</tbody></table></div>
          </article>
          <article>
            <div className="knowledge-section-head"><div><span>季节与根气</span><h2>十二地支速查</h2></div></div>
            <div className="reference-table-wrap"><table><thead><tr><th>地支</th><th>五行</th><th>藏干</th><th>季节</th></tr></thead><tbody>{branchQuickReference.map((row) => <tr key={row[0]}>{row.map((cell) => <td key={cell}>{cell}</td>)}</tr>)}</tbody></table></div>
          </article>
          <article>
            <div className="knowledge-section-head"><div><span>以日主为中心</span><h2>十神速查</h2></div></div>
            <div className="reference-table-wrap"><table><thead><tr><th>十神</th><th>生成关系</th><th>现实主题</th></tr></thead><tbody>{tenGodQuickReference.map((row) => <tr key={row[0]}>{row.map((cell) => <td key={cell}>{cell}</td>)}</tr>)}</tbody></table></div>
          </article>
        </section>
      )}

      <p className="disclaimer">知识库用于传统文化学习与结构化思考，不应替代医学、法律、财务或其他专业意见。</p>
    </main>
  );
}

function YijingPage({ onBack, onGoBazi, onLearning }: { onBack: () => void; onGoBazi: () => void; onLearning: () => void }) {
  const [question, setQuestion] = useState('近期事业推进是否适合主动争取？');
  const [lines, setLines] = useState<YaoValue[]>([]);
  const [isCasting, setIsCasting] = useState(false);
  const reading = useMemo(() => buildDivinationReading(question, lines), [question, lines]);

  const castWithAnimation = (mode: 'full' | 'single') => {
    if (isCasting) {
      return;
    }
    setIsCasting(true);
    window.setTimeout(() => {
      if (mode === 'full') {
        setLines(Array.from({ length: 6 }, () => castYao()));
      } else {
        setLines((current) => (current.length >= 6 ? [castYao()] : [...current, castYao()]));
      }
      setIsCasting(false);
    }, 920);
  };

  const castFullHexagram = () => {
    castWithAnimation('full');
  };

  const castOneLine = () => {
    castWithAnimation('single');
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
        <div className="learning-top-actions">
          <button className="secondary-button slim" onClick={onLearning} type="button">
            <GraduationCap size={16} />
            命理学堂
          </button>
          <button className="secondary-button slim" onClick={onGoBazi} type="button">
            <BookOpen size={16} />
            八字排盘
          </button>
        </div>
      </header>

      <section className="yijing-layout">
        <aside className="yijing-control section">
          <div className="section-title">
            <h2>求卦</h2>
            <span>六爻自下而上</span>
          </div>
          <label>
            <span>所问事项</span>
            <div className="question-presets">
              {divinationPresets.map((preset) => (
                <button className={question === preset ? 'active' : ''} key={preset} onClick={() => setQuestion(preset)} type="button">
                  {preset}
                </button>
              ))}
            </div>
            <textarea value={question} onChange={(event) => setQuestion(event.target.value)} />
          </label>
          <div className={isCasting ? 'coin-stage casting' : 'coin-stage'} aria-hidden="true">
            <span>山</span>
            <span>易</span>
            <span>爻</span>
          </div>
          <div className="yijing-actions">
            <button className="primary-button" disabled={isCasting} onClick={castFullHexagram} type="button">
              <Sparkles size={17} />
              {isCasting ? '起卦中' : '自动起卦'}
            </button>
            <button className="secondary-button" disabled={isCasting} onClick={castOneLine} type="button">
              摇一爻 {lines.length ? `${lines.length}/6` : ''}
            </button>
            <button className="secondary-button" disabled={isCasting} onClick={() => setLines([])} type="button">
              清空
            </button>
          </div>
          <div className="yijing-method">
            <strong>起卦说明</strong>
            <p>采用三枚铜钱法：六为老阴、七为少阳、八为少阴、九为老阳。老阴老阳为动爻，动则生成变卦。</p>
          </div>
        </aside>

        <section className="yijing-result">
          {!reading && lines.length === 0 && (
            <div className="empty-divination section">
              <h2>{isCasting ? '铜钱正在落定' : '尚未成卦'}</h2>
              <p>{isCasting ? '请稍候，系统正在模拟三枚铜钱起爻。' : '可以一次自动起卦，也可以逐爻摇出六爻。六爻完成后，会显示本卦、变卦、动爻和解读建议。'}</p>
            </div>
          )}

          {!reading && lines.length > 0 && (
            <div className="partial-divination section">
              <div className="partial-head">
                <span>逐爻进度</span>
                <h2>已摇出 {lines.length}/6 爻</h2>
                <p>
                  六爻自下而上记录。当前已成到{yaoPositionLabels[lines.length - 1]}，{lines.length < 6 ? `下一次将摇${yaoPositionLabels[lines.length]}。` : '六爻已齐，正在生成解读。'}
                </p>
              </div>
              <div className="partial-board">
                <div className="partial-hexagram" aria-label="阶段六爻图">
                  {Array.from({ length: 6 }).map((_, reverseIndex) => {
                    const index = 5 - reverseIndex;
                    const line = lines[index];
                    const completed = typeof line === 'number';
                    const isNext = isCasting && index === lines.length;
                    const rowClass = completed ? 'yao-row' : isNext ? 'yao-row pending active' : 'yao-row pending';
                    return (
                      <div className={rowClass} key={index}>
                        <span>{yaoDisplayLabels[reverseIndex]}</span>
                        <div className={completed ? (isYangLine(line) ? 'yao-line yang' : 'yao-line yin') : 'yao-line pending'}>
                          <i />
                          {completed && !isYangLine(line) && <i />}
                        </div>
                        <em className={completed && isMovingLine(line) ? 'moving' : ''}>{completed ? formatYao(line) : isNext ? '落定中' : '待摇'}</em>
                      </div>
                    );
                  })}
                </div>
                <div className="partial-line-list">
                  {lines.map((line, index) => (
                    <article key={`${index}-${line}`}>
                      <strong>{yaoPositionLabels[index]}</strong>
                      <span>
                        {formatYao(line)} · {isYangLine(line) ? '阳爻' : '阴爻'}
                        {isMovingLine(line) ? ' · 动爻' : ''}
                      </span>
                      <p>{isMovingLine(line) ? movingLineAdvice(index, line) : `${yaoPositionLabels[index]}为静爻，先记录其阴阳属性，待六爻齐后再合看本卦。`}</p>
                    </article>
                  ))}
                  {lines.length < 6 && (
                    <article className="next-line">
                      <strong>{yaoPositionLabels[lines.length]}</strong>
                      <span>{isCasting ? '铜钱落定中' : '等待摇出'}</span>
                      <p>继续点击“摇一爻”，系统会把下一爻补入阶段盘；满六爻后自动生成本卦、变卦与动爻解读。</p>
                    </article>
                  )}
                </div>
              </div>
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
                        <span>{yaoDisplayLabels[reverseIndex]}</span>
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
                      {reading.detail.outer}
                      {reading.detail.inner}
                      若要推进此事，先看内外是否同向，再看动爻提示的变化位置。
                    </p>
                  </article>
                  <article>
                    <h3>变卦方向</h3>
                    <p>{reading.detail.change}</p>
                  </article>
                  <article>
                    <h3>行动建议</h3>
                    <p>{reading.detail.action}</p>
                  </article>
                  <article>
                    <h3>避坑提醒</h3>
                    <p>{reading.detail.caution}</p>
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

function HomePage({
  profileName,
  onBazi,
  onLearning,
  onLogout,
  onYijing,
}: {
  profileName: string;
  onBazi: () => void;
  onLearning: () => void;
  onLogout: () => void;
  onYijing: () => void;
}) {
  return (
    <main className="app-home-shell">
      <header className="app-home-topbar">
        <div className="topnav-brand">
          <div className="brand-symbol">山</div>
          <div>
            <strong>山易排盘</strong>
            <span>传统命理工具</span>
          </div>
        </div>
        <div className="home-profile">
          <span>当前档案</span>
          <strong>{profileName || '游客'}</strong>
          <button aria-label="退出登录" onClick={onLogout} title="退出登录" type="button">
            <LogOut size={18} />
          </button>
        </div>
      </header>

      <section className="home-workspace">
        <div className="home-heading">
          <span className="eyebrow">功能首页</span>
          <h1>选择要进入的功能</h1>
        </div>

        <div className="home-module-grid">
          <button className="home-module bazi" onClick={onBazi} type="button">
            <span className="home-module-icon"><CalendarDays size={28} /></span>
            <span className="home-module-index">01</span>
            <strong>八字排盘</strong>
            <small>录入生辰 · 四柱细盘 · 专业详批 · 大运合参</small>
            <ArrowRight size={20} />
          </button>
          <button className="home-module learning" onClick={onLearning} type="button">
            <span className="home-module-icon"><GraduationCap size={28} /></span>
            <span className="home-module-index">02</span>
            <strong>命理学堂</strong>
            <small>知识体系 · 基础速查 · 古籍原文与译解</small>
            <ArrowRight size={20} />
          </button>
          <button className="home-module yijing" onClick={onYijing} type="button">
            <span className="home-module-icon"><Sparkles size={28} /></span>
            <span className="home-module-index">03</span>
            <strong>易经起卦</strong>
            <small>自动起卦 · 逐爻摇卦 · 本卦变卦 · 详细解读</small>
            <ArrowRight size={20} />
          </button>
        </div>
      </section>

    </main>
  );
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
          <span>命理学堂</span>
          <span>易经起卦</span>
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
  onLearning,
  onYijing,
  onReset,
  onSubmit,
}: {
  input: BirthInput;
  onBack: () => void;
  onChange: (input: BirthInput) => void;
  onLearning: () => void;
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
          <button className="icon-text-button" onClick={onLearning} type="button">
            <GraduationCap size={17} />
            命理学堂
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
  onHome,
  onNavigate,
  onLearning,
  onYijing,
}: {
  activeNav: NavTarget;
  onHome: () => void;
  onNavigate: (target: NavTarget) => void;
  onLearning: () => void;
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
        <button onClick={onHome} type="button">
          功能首页
        </button>
        {navItems.map((item) => (
          <button className={activeNav === item.key ? 'active' : ''} key={item.key} onClick={() => onNavigate(item.key)} type="button">
            {item.label}
          </button>
        ))}
        <button onClick={onYijing} type="button">
          易经求卦
        </button>
        <button onClick={onLearning} type="button">
          命理学堂
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
  const [learningBackStep, setLearningBackStep] = useState<AppStep>('login');
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

  const openLearning = () => {
    setLearningBackStep(step);
    setStep('learning');
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
          setStep('home');
        }}
        onLogin={() => {
          setToast('登录成功');
          setStep('home');
        }}
        profileName={input.name}
      />
    );
  }

  if (step === 'home') {
    return (
      <>
        <HomePage
          onBazi={() => setStep('birth')}
          onLearning={openLearning}
          onLogout={() => setStep('login')}
          onYijing={openYijing}
          profileName={input.name}
        />
        {toast && <div className="toast">{toast}</div>}
      </>
    );
  }

  if (step === 'learning') {
    return (
      <LearningPage
        onBack={() => setStep(learningBackStep === 'learning' ? 'login' : learningBackStep)}
        onGoBazi={() => setStep('birth')}
        onYijing={openYijing}
      />
    );
  }

  if (step === 'yijing') {
    return (
      <>
        <YijingPage
          onBack={() => setStep(yijingBackStep === 'yijing' ? 'login' : yijingBackStep)}
          onGoBazi={() => setStep('birth')}
          onLearning={openLearning}
        />
        {toast && <div className="toast">{toast}</div>}
      </>
    );
  }

  if (step === 'birth') {
    return (
      <>
        <BirthSetupPage
          input={input}
          onBack={() => setStep('home')}
          onChange={setInput}
          onLearning={openLearning}
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
      <ReportTopNav activeNav={activeNav} onHome={() => setStep('home')} onLearning={openLearning} onNavigate={scrollTo} onYijing={openYijing} />

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
