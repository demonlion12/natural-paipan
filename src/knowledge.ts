export type KnowledgeLesson = {
  id: string;
  title: string;
  summary: string;
  points: string[];
  practice: string;
};

export type KnowledgeModule = {
  id: string;
  title: string;
  level: '入门' | '进阶' | '实战';
  order: number;
  summary: string;
  lessons: KnowledgeLesson[];
};

export type ClassicReference = {
  bookId: 'ditiansui' | 'qiongtong' | 'lixu';
  chapterId: string;
  label: string;
};

export type KnowledgeTerm = {
  id: string;
  term: string;
  aliases: string[];
  category: '基础坐标' | '力量判断' | '干支关系' | '格局取用' | '调候气象' | '岁运应用';
  definition: string;
  caution: string;
  moduleId: string;
  classicRef?: ClassicReference;
};

export type LearningPath = {
  id: string;
  title: string;
  audience: string;
  duration: string;
  summary: string;
  moduleIds: string[];
  outcome: string;
};

export type KnowledgeQuizQuestion = {
  id: string;
  level: '入门' | '进阶' | '实战';
  category: '基础' | '强弱' | '关系' | '取用' | '岁运' | '古籍';
  prompt: string;
  options: string[];
  answer: number;
  explanation: string;
  moduleId: string;
  lessonId: string;
};

export type ClassicExcerpt = {
  id: string;
  book: string;
  chapter: string;
  original: string;
  translation: string;
  notes: string[];
  related: string[];
  sourceLabel: string;
  sourceUrl: string;
};

export type ClassicTextBlock = {
  heading: string;
  original: string;
  commentary: string;
};

export type ClassicChapter = {
  id: string;
  title: string;
  guide: string;
  blocks: ClassicTextBlock[];
};

export type ClassicChapterSummary = Omit<ClassicChapter, 'blocks'> & {
  path: string;
  blockCount: number;
};

export type ClassicBook = {
  id: string;
  title: string;
  dynasty: string;
  attribution: string;
  status: string;
  chapterCount: number;
  description: string;
  editionNote: string;
  sourceLabel: string;
  sourceUrl: string;
  updatedAt: string;
  version: string;
  chapters: ClassicChapterSummary[];
};

export const classicShelf = [
  {
    id: 'ditiansui', title: '滴天髓', dynasty: '明', status: '全文', chapterCount: 42,
    summary: '通天、干支、格局、体用、寒暖、六亲与岁运等四十二论。',
    path: 'knowledge/classics/ditiansui/index.json',
  },
  { id: 'sanming', title: '三命通会', dynasty: '明', status: '目录校勘中', chapterCount: 12, summary: '汇集禄命法、子平法、神煞与诸家论法的大型命理文献。' },
  { id: 'yuanhai', title: '渊海子平', dynasty: '宋元以来', status: '目录校勘中', chapterCount: 5, summary: '子平法重要汇编，包含定格、诗诀、六亲和岁运诸法。' },
  { id: 'qiongtong', title: '穷通宝鉴', dynasty: '清刊本系统', status: '全文', chapterCount: 15, summary: '以月令和十干为线索讨论寒暖燥湿与调候取用。', path: 'knowledge/classics/qiongtong/index.json' },
  { id: 'wuxing', title: '五行精纪', dynasty: '宋', status: '目录校勘中', chapterCount: 34, summary: '汇集唐宋禄命材料，是研究早期命理体系的重要文献。' },
  { id: 'lixu', title: '李虚中命书', dynasty: '唐宋文献系统', status: '全文', chapterCount: 3, summary: '早期禄命法文献，适合用来理解子平法之前的历史脉络。', path: 'knowledge/classics/lixu/index.json' },
] as const;

export const knowledgeModules: KnowledgeModule[] = [
  {
    id: 'foundation',
    title: '四柱基础',
    level: '入门',
    order: 1,
    summary: '先建立时间、四柱、日主和月令的基本坐标，知道八个字分别从哪里来。',
    lessons: [
      {
        id: 'four-pillars',
        title: '四柱与八字',
        summary: '年、月、日、时各由一干一支组成，共四柱八字。',
        points: ['年柱常用于观察早年、家族与外部环境', '月柱是月令所在，判断季节旺衰与格局时权重很高', '日干称日主，代表命局分析的中心坐标', '时柱常用于观察后期发展、输出、晚辈与长期结果'],
        practice: '拿自己的命盘，依次指出年柱、月柱、日柱、时柱，并圈出日干与月支。',
      },
      {
        id: 'solar-terms',
        title: '干支历与节气',
        summary: '八字的月份按节气划分，不以农历初一作为月界。',
        points: ['立春通常作为干支年的起点', '月柱在十二个“节”处切换，如立春、惊蛰、清明', '出生在交节前后时，要核对精确时刻', '出生地与真太阳时可能影响时柱，临界时尤其重要'],
        practice: '找一个出生在立春当天的案例，比较节前与节后年柱、月柱是否变化。',
      },
      {
        id: 'reading-order',
        title: '正确阅读顺序',
        summary: '先定日主和月令，再看根气、透藏、流通，最后才谈格局、喜忌和岁运。',
        points: ['第一步：确认日主阴阳五行', '第二步：看月令季节与司令之气', '第三步：看通根、得地、得助和克泄耗', '第四步：看天干透出、地支藏干和组合关系', '第五步：综合格局、喜用、调候与大运流年'],
        practice: '每次看盘先写五行结构，不要一上来先背性格断语。',
      },
    ],
  },
  {
    id: 'yin-yang-elements',
    title: '阴阳五行',
    level: '入门',
    order: 2,
    summary: '五行不是五种物质标签，而是生长、发散、承载、收敛、流动五类关系。',
    lessons: [
      {
        id: 'yin-yang',
        title: '阴阳的作用',
        summary: '阴阳用来区分同一五行的表达方向、节奏与显隐。',
        points: ['阳偏外显、主动、刚健与扩展', '阴偏内敛、细密、柔韧与承接', '阴阳不是好坏，也不能直接等同男女', '十神正偏的区分，与日干和目标天干的阴阳同异有关'],
        practice: '比较甲木与乙木、丙火与丁火，写出同五行不同阴阳的表达差异。',
      },
      {
        id: 'five-elements',
        title: '五行取象',
        summary: '木曲直、火炎上、土稼穑、金从革、水润下。',
        points: ['木：生发、规划、成长、条理', '火：温暖、显明、表达、推动', '土：承载、转化、信用、收束', '金：规则、裁成、判断、边界', '水：流动、润下、信息、蓄势'],
        practice: '分别为五行找一个工作场景和一个失衡场景，避免只用颜色记忆。',
      },
      {
        id: 'generation-control',
        title: '生克制化',
        summary: '相生提供流转，相克提供边界；生多会滞，克过会伤。',
        points: ['木生火、火生土、土生金、金生水、水生木', '木克土、土克水、水克火、火克金、金克木', '被生者太弱，生助未必承受得住', '生者过多可能形成泄耗，克者适量也可能成为秩序', '看命重在制化与流通，不把“生”固定为吉、“克”固定为凶'],
        practice: '在命盘上画出最顺的一条相生链，再找出一处被截断或过旺的环节。',
      },
    ],
  },
  {
    id: 'stems',
    title: '十天干',
    level: '入门',
    order: 3,
    summary: '天干偏向外显、事件与表达方式，是命局浮在表面的力量。',
    lessons: [
      {
        id: 'stem-map',
        title: '十干速查',
        summary: '甲乙木、丙丁火、戊己土、庚辛金、壬癸水，前者阳、后者阴。',
        points: ['甲阳木、乙阴木', '丙阳火、丁阴火', '戊阳土、己阴土', '庚阳金、辛阴金', '壬阳水、癸阴水'],
        practice: '不看表格写出十干顺序、五行与阴阳。',
      },
      {
        id: 'stem-combinations',
        title: '天干五合',
        summary: '甲己、乙庚、丙辛、丁壬、戊癸为五合，但“见合”不等于必然合化。',
        points: ['甲己合土', '乙庚合金', '丙辛合水', '丁壬合木', '戊癸合火', '是否化成要看月令、化神、根气、位置与破坏条件'],
        practice: '看到天干五合时，先写“有合象”，再检查是否有足够条件谈合化。',
      },
      {
        id: 'stem-function',
        title: '透干与作用路径',
        summary: '藏在地支的力量透到天干，通常更容易成为可见事件和角色。',
        points: ['月令本气透干，往往更容易成为格局主线', '天干相邻作用更直接，远隔要看中间是否通关', '同一十神在年、月、日、时位置不同，现实落点不同', '不能只数天干个数，还要回到地支根气'],
        practice: '找出命盘所有透干，分别标注它们是否在地支有根。',
      },
    ],
  },
  {
    id: 'branches',
    title: '十二地支',
    level: '入门',
    order: 4,
    summary: '地支包含季节、方位、藏干和根气，力量比单个字面更复杂。',
    lessons: [
      {
        id: 'branch-map',
        title: '十二支与季节',
        summary: '寅卯辰春，巳午未夏，申酉戌秋，亥子丑冬。',
        points: ['子水、丑湿土', '寅卯木、辰湿土', '巳午火、未燥土', '申酉金、戌燥土', '亥水', '辰戌丑未兼具季节转换与库气特征'],
        practice: '按春夏秋冬写出十二支，并标出四库辰戌丑未。',
      },
      {
        id: 'hidden-stems',
        title: '地支藏干',
        summary: '每个地支内部藏有一至三个天干，分本气、中气、余气。',
        points: ['子藏癸；丑藏己癸辛', '寅藏甲丙戊；卯藏乙；辰藏戊乙癸', '巳藏丙庚戊；午藏丁己；未藏己丁乙', '申藏庚壬戊；酉藏辛；戌藏戊辛丁', '亥藏壬甲', '藏干决定地支对应哪些十神，不可只看地支表面五行'],
        practice: '把自己四个地支的藏干全部写出，再换算成十神。',
      },
      {
        id: 'branch-relations',
        title: '合冲刑害破',
        summary: '地支关系表示力量重组、位移、牵制或隐性不协调，不可只背吉凶。',
        points: ['六合与三合重在聚气和关系重组', '六冲常带变化、移动、分离或对立', '三刑重在结构性摩擦与反复', '六害常表现为暗中牵制、好心难成好事', '六破偏向关系松动、计划破损', '必须结合宫位、十神、喜忌和岁运触发'],
        practice: '每发现一组关系，同时写出涉及宫位、十神和可能的现实主题。',
      },
    ],
  },
  {
    id: 'ten-gods',
    title: '十神体系',
    level: '进阶',
    order: 5,
    summary: '十神是以日主为中心，对其他天干五行关系进行角色化表达。',
    lessons: [
      {
        id: 'ten-god-logic',
        title: '十神生成逻辑',
        summary: '同我为比劫，我生为食伤，我克为财，克我为官杀，生我为印。',
        points: ['同性同我为比肩，异性同我为劫财', '同性我生为食神，异性我生为伤官', '同性我克为偏财，异性我克为正财', '同性克我为七杀，异性克我为正官', '同性生我为偏印，异性生我为正印'],
        practice: '任选一个日干，把另外九个天干对应的十神完整列出。',
      },
      {
        id: 'ten-god-groups',
        title: '五组十神的现实含义',
        summary: '十神首先是功能角色，其次才是性格标签和六亲类象。',
        points: ['比劫：自我、同辈、竞争、合作与资源分配', '食伤：输出、表达、技术、作品与体验', '财星：经营、资源、结果、责任与交换', '官杀：规则、职位、压力、约束与权责', '印星：学习、支持、保护、系统与资质'],
        practice: '为每组十神写一个优势场景和一个过量风险。',
      },
      {
        id: 'ten-god-combination',
        title: '十神组合阅读',
        summary: '单颗十神不能定性，组合与流通才决定成事方式。',
        points: ['官印相生：压力通过学习、资质和系统转成位置', '食伤生财：输出、产品或技术转成资源', '杀印相生：高压任务借专业支持化解', '伤官配印：锋芒借方法、学历和体系得到约束', '比劫夺财：同辈与合作可能分散资源，需要边界', '枭神夺食等组合要看是否真有制化，不能见词断凶'],
        practice: '从命盘找出两条十神关系链，并判断是否流通。',
      },
    ],
  },
  {
    id: 'strength-roots',
    title: '旺衰与根气',
    level: '进阶',
    order: 6,
    summary: '旺衰不是数五行个数，而是综合得令、得地、得助和克泄耗。',
    lessons: [
      {
        id: 'four-strength-factors',
        title: '得令、得地、得助、得势',
        summary: '月令是季节权重，通根是落地条件，透干与同党决定能否成势。',
        points: ['得令：日主五行符合月令旺相', '得地：在地支有根、有长生禄旺等落点', '得助：印比生扶日主', '克泄耗：官杀克、食伤泄、财星耗', '还要看组合是否让力量真正可用'],
        practice: '分别为日主写出支持项与消耗项，再判断承载力。',
      },
      {
        id: 'twelve-stages',
        title: '十二长生',
        summary: '长生十二宫描述天干在地支中的阶段状态，是辅助判断根气的工具。',
        points: ['长生、沐浴、冠带、临官、帝旺', '衰、病、死、墓、绝、胎、养', '十二长生不能脱离月令和实际根气单独断吉凶', '日主与各十神都可观察十二长生状态'],
        practice: '查看日主在四个地支的十二长生，比较哪一柱根气更实。',
      },
      {
        id: 'strong-weak-misunderstanding',
        title: '身强身弱不是能力高低',
        summary: '身强讲承载与自主，身弱讲外部牵引与资源依赖，不直接等同优秀或失败。',
        points: ['身强也可能闭塞、固执或不受制', '身弱也可能借平台、借印、借团队成事', '关键是命局是否有可用结构', '岁运改变的是阶段性承载与触发'],
        practice: '把“身弱就是弱者”改写成一段更准确的解释。',
      },
    ],
  },
  {
    id: 'structure-useful',
    title: '格局、喜用与调候',
    level: '进阶',
    order: 7,
    summary: '格局看成事结构，喜用看平衡路径，调候先解决寒暖燥湿。',
    lessons: [
      {
        id: 'structure',
        title: '格局从月令出发',
        summary: '月令司令之气与透干组合，是传统格局判断的重要入口。',
        points: ['先看月令藏干谁当令、谁透出', '再看日主能否承受格局之用', '格局有成败、救应、清浊与高低', '特殊格局必须条件充分，不能因一个特征轻易从格'],
        practice: '写出月支藏干、透干和对应十神，尝试确定格局主线。',
      },
      {
        id: 'useful-god',
        title: '喜神、用神、忌神',
        summary: '用神是解决主要结构问题的关键力量，喜神帮助用神，忌神会破坏平衡。',
        points: ['扶抑用神处理日主承载与克泄耗', '格局用神服务于格局成败', '通关用神连接相战五行', '病药用神针对命局最突出病处', '同一五行可能调候有用、扶抑却需控制剂量'],
        practice: '对一个命盘分别写扶抑、调候、通关三层需求，不急着合成一个答案。',
      },
      {
        id: 'climate',
        title: '调候：寒暖燥湿',
        summary: '先判断季节气候是否允许命局发挥，再谈数量上的补偏。',
        points: ['冬月先看寒暖与解冻', '夏月先看炎燥与润泽', '春木重生发与裁成', '秋金重燥润与锻炼', '湿土与燥土不能同断', '调候得用仍要有根、有源、有承接'],
        practice: '只看月令，先写一版气候诊断；再加入原局五行修正。',
      },
    ],
  },
  {
    id: 'special-markers',
    title: '神煞与辅助信息',
    level: '进阶',
    order: 8,
    summary: '神煞适合做辅助定位，不应凌驾于五行、十神和格局。',
    lessons: [
      {
        id: 'shen-sha',
        title: '神煞的正确用法',
        summary: '天乙、文昌、桃花、驿马、华盖等提供类象提示，必须回到原局验证。',
        points: ['贵人类看支持、资源与化解机会', '桃花类看人际吸引、表达与关系曝光', '驿马类看迁移、流动、岗位变化', '华盖类看独立研究、审美、精神兴趣', '羊刃、劫煞等不直接等同灾祸，要看是否有制'],
        practice: '选一个神煞，分别写“有利表达、过量风险、现实验证”三栏。',
      },
      {
        id: 'na-yin',
        title: '纳音、胎元、命宫、身宫',
        summary: '这些信息可扩展类象，但在子平主线中权重通常低于月令、日主和十神。',
        points: ['纳音是六十甲子的另一套五行编码', '胎元由月柱推衍，用于辅助观察先天气息', '命宫、身宫有不同流派算法', '使用时应明确流派，不与主盘结论混为一谈'],
        practice: '先完成不含纳音和神煞的主体判断，再观察辅助信息是否印证。',
      },
      {
        id: 'palaces',
        title: '宫位与六亲',
        summary: '年、月、日、时有时间和关系类象，十神也有六亲类象，两者需要交叉看。',
        points: ['年柱偏早年、祖上、外部与远方', '月柱偏父母、成长环境、同事与事业平台', '日支为夫妻宫，也反映自身贴近生活的状态', '时柱偏子女、晚辈、下属、晚年和成果', '六亲不能只凭一颗十神断吉凶或存亡'],
        practice: '选择一个六亲主题，同时查看对应宫位、十神与岁运触发。',
      },
    ],
  },
  {
    id: 'luck-cycle',
    title: '大运与流年',
    level: '实战',
    order: 9,
    summary: '原局是底盘，大运是十年环境，流年是当年触发，流月流日用于进一步定位。',
    lessons: [
      {
        id: 'dayun',
        title: '大运怎么读',
        summary: '大运干支要分层看：天干偏外显主题，地支偏长期环境与根气。',
        points: ['先判断大运五行是否补喜用或加重偏性', '再看大运十神带来的角色主题', '检查与原局天干地支的合冲刑害', '大运不能脱离年龄、职业和现实资源', '交运前后常有主题切换，但不宜机械断某日突变'],
        practice: '为当前大运写出“机会、风险、原局触发、现实行动”四栏。',
      },
      {
        id: 'annual-monthly',
        title: '流年、流月、流日',
        summary: '流年在大运背景中定年度主题，流月定位阶段，流日只适合做短周期观察。',
        points: ['先看大运，再看流年，不倒置层级', '流年干支分别引动十神和宫位', '流月以节气为界，共十二个月', '流日适合观察执行、沟通与事件窗口，不宜过度放大', '同一冲合在不同层级重复时，主题通常更明显'],
        practice: '选一个已发生的重要年份，回测当年、大运与原局的共同触发。',
      },
      {
        id: 'event-verification',
        title: '岁运回测与验证',
        summary: '先用过去事件校验模型，再讨论未来趋势。',
        points: ['记录换学业、换工作、迁居、关系、收入与健康节奏变化', '区分事件发生时间和决定形成时间', '关注重复出现的十神与宫位主题', '若过去完全对不上，要回查时辰、历法和算法', '预测使用条件句和风险边界，不把趋势写成必然'],
        practice: '整理至少三个已发生年份，每年只记录可核对事实。',
      },
    ],
  },
  {
    id: 'case-method',
    title: '实盘分析方法',
    level: '实战',
    order: 10,
    summary: '用固定流程减少先入为主，让每条结论都能追溯到命理依据。',
    lessons: [
      {
        id: 'case-steps',
        title: '十步推盘流程',
        summary: '从校时到验证，形成可重复的分析链。',
        points: ['1 校验公历、时区、地点与节气', '2 定日主与月令', '3 看藏干、透干、根气', '4 判断旺衰承载', '5 看五行流通', '6 定十神主线与格局', '7 分调候、扶抑、通关', '8 看宫位与六亲', '9 合大运流年', '10 用过去事件回测并修正'],
        practice: '每看一个案例都按十步写标题，禁止跳步先下吉凶结论。',
      },
      {
        id: 'evidence-writing',
        title: '如何写详批',
        summary: '专业详批应包含结论、依据、现实表现、风险、建议和验证点。',
        points: ['结论要具体但保留条件', '依据写明哪一柱、哪一十神、哪一关系', '现实表现给多个可能落点，不强行对号入座', '建议要能执行，并写明何时停止或调整', '验证点用于让用户检查，不迎合用户信息反推命盘'],
        practice: '把一句“你事业很好”改写成完整的六段式判断。',
      },
      {
        id: 'common-errors',
        title: '常见误区',
        summary: '避免缺什么补什么、见冲即凶、见合即吉、见神煞即定性。',
        points: ['五行数量不等于五行力量', '合而不化与合化要分开', '冲可能是变化、调整和位移，不必然是灾', '喜用五行也可能过量', '健康、法律、投资问题不能由命盘替代专业判断', '命理分析应当帮助观察和规划，而不是制造恐惧'],
        practice: '检查一份旧报告，标出所有绝对化、恐吓式和无依据结论。',
      },
    ],
  },
  {
    id: 'time-correction', title: '历法、校时与真太阳时', level: '进阶', order: 11,
    summary: '排盘先解决时间坐标：历法、节气、时区、出生地与时辰边界。',
    lessons: [
      { id: 'calendar-boundary', title: '年界、月界与日界', summary: '干支年通常以立春为界，月令以十二节为界，日界还涉及子初换日流派差异。', points: ['农历正月初一不等于干支年的固定起点', '月柱依节气切换，不按农历初一', '子时换日存在晚子时与早子时分法，应注明算法', '临界出生时间要保留两个盘作事件回测'], practice: '选择一位出生在立春或交节当天的人，比较交节前后四柱。' },
      { id: 'timezone-solar', title: '时区与真太阳时', summary: '钟表时间是统一行政时间，真太阳时按经度与均时差修正。', points: ['先确认出生地当时采用的法定时区', '经度每差一度约对应四分钟地方时差', '均时差会随日期变化，不能只做固定经度修正', '修正跨越时辰边界时，应把两个时柱都纳入验证'], practice: '计算出生地与东经120度的经度差，再检查是否接近时辰边界。' },
      { id: 'unknown-hour', title: '时辰不详怎么处理', summary: '缺时辰时应缩小结论边界，以已知事件反推而非凭感觉硬定。', points: ['先只分析年月日三柱能稳定支持的结论', '列出可能时柱对格局与六亲的关键差异', '用迁移、婚育、职业转折等时间点回测', '无法确认时明确标记不确定性'], practice: '为一个未知时辰案例列出三条“无论何时柱都成立”的结论。' },
    ],
  },
  {
    id: 'palace-kinship', title: '宫位与六亲专题', level: '进阶', order: 12,
    summary: '把四柱宫位、十神六亲和人生阶段交叉起来，避免只凭一颗星断关系。',
    lessons: [
      { id: 'four-palaces', title: '四柱宫位的层次', summary: '年、月、日、时既是时间序列，也是远近、内外与关系位置。', points: ['年柱偏外部、祖上、早年和远方', '月柱偏成长环境、父母、事业平台和同事', '日柱偏自身与伴侣，日支为贴近日常的夫妻宫', '时柱偏成果、晚辈、下属、晚景与长期归宿'], practice: '把一件真实事件同时标注发生年龄、涉及宫位和对应十神。' },
      { id: 'kinship-crosscheck', title: '六亲交叉验证', summary: '六亲要同时看代表十神、所居宫位、根气和岁运触发。', points: ['同一六亲在不同性别与流派中取星可能不同', '星弱不等于关系一定差，更不能断存亡', '宫位受冲可表现为距离、变化或相处模式调整', '岁运引动时才更容易形成可观察事件'], practice: '选择父母、伴侣或子女主题，写出星、宫、运三层依据。' },
      { id: 'relationship-boundary', title: '关系判断的边界', summary: '命理适合讨论互动结构和阶段压力，不适合替他人定性。', points: ['不以单个桃花判断忠诚', '不以财官数量断婚姻次数', '不把刑冲直接等同分离', '结论应给出沟通、边界和现实验证方法'], practice: '把“婚姻不顺”改写成可验证的关系模式与建议。' },
    ],
  },
  {
    id: 'relations-deep', title: '合冲刑害破专题', level: '进阶', order: 13,
    summary: '把干支关系视为气势重组和触发机制，逐项辨认成立条件。',
    lessons: [
      { id: 'combine-transform', title: '合、合绊与合化', summary: '见合先论牵引，再看是否绊住，最后才检验能否化气。', points: ['天干五合与地支六合的作用层级不同', '合化要得时、得势并有化神承接', '相合可能保护用神，也可能使其失去作用', '岁运加入第三方后，原有合局可能改变'], practice: '找出命盘全部合关系，分别标注“合象、合绊、可能化气”。' },
      { id: 'clash-punish-harm', title: '冲、刑、害、破', summary: '冲偏位移对立，刑偏结构摩擦，害偏暗损，破偏松动，均须落到宫位和十神。', points: ['旺冲衰与衰冲旺的结果不同', '冲库、冲根、冲夫妻宫不能同断', '刑害常需要重复或岁运触发才明显', '喜神受冲与忌神受冲的意义可能相反'], practice: '为一组地支关系写出至少三种现实可能，不使用绝对吉凶词。' },
      { id: 'relation-priority', title: '多重关系的优先级', summary: '当合冲刑害并见，应按月令、位置、强弱和岁运时效排序。', points: ['先处理能改变月令气势或成局的关系', '邻近、透出、有根的作用通常更直接', '同一字被合又被冲时，要比较双方力量与到达顺序', '原局是长期结构，岁运是阶段触发'], practice: '给一个多重关系命盘画作用图，只保留三条最重要路径。' },
    ],
  },
  {
    id: 'structure-patterns', title: '格局与组合专题', level: '实战', order: 14,
    summary: '从月令立格，再看相神、忌神、救应和现实成事路径。',
    lessons: [
      { id: 'regular-patterns', title: '正格八格', summary: '财、官、印、食、杀、伤等格从月令透藏入手，重点在成格条件。', points: ['月令本气、中气、余气透出时权重不同', '立格后要找维护格局的相神', '日主承载不足时，格局名称成立也难发挥', '杂气月与多透要辨主次清浊'], practice: '选一盘写出格神、相神、忌神和救应，不只写格局名称。' },
      { id: 'common-chains', title: '常见十神链条', summary: '官印相生、食伤生财、杀印相生等，是能量如何转化的结构描述。', points: ['链条每一环都要有根有力', '中间一环受伤会造成流通中断', '组合好坏取决于是否解决原局主要矛盾', '岁运补齐缺环时，相关主题更易落实'], practice: '把命盘画成“源头→转化→结果”的十神链。' },
      { id: 'special-structure', title: '从格、化格与专旺', summary: '特殊格局条件严格，应先排除日主有根、逆势和破局因素。', points: ['从格看是否真正无依并顺从全局大势', '化格看合化是否得令并有化神', '专旺看同类成方成局且无强力逆气', '岁运逆势时特殊格局波动通常更明显'], practice: '对疑似从格案例同时写普通格和特殊格两套解释，再用往事验证。' },
    ],
  },
  {
    id: 'monthly-practice', title: '流年流月实战', level: '实战', order: 15,
    summary: '把十年、年度、月份和日期放回同一时间层级，建立可回测的节奏判断。',
    lessons: [
      { id: 'time-layers', title: '岁运四层模型', summary: '大运定舞台，流年定年度主题，流月定阶段窗口，流日用于具体安排。', points: ['下层时间不能推翻上层长期背景', '同一五行在多层重复时信号更集中', '流月按节气切换，每个流年完整观察十二个月', '流日宜用于执行节奏，不作重大宿命判断'], practice: '选择一个过去年份，按大运、流年、流月记录一件可核对事件。' },
      { id: 'annual-trigger', title: '岁运触发清单', summary: '优先观察伏吟反吟、合冲刑害、用忌到位和宫位重复引动。', points: ['先列原局关键字和关键关系', '再看大运是否建立长期触发条件', '流年到位时判断哪一宫、哪一十神被引动', '最后结合现实年龄和可用资源筛选事件类型'], practice: '为当前流年制作触发清单，不直接写必然事件。' },
      { id: 'monthly-journal', title: '十二月观察日志', summary: '逐月记录计划、行动和结果，用事实检验命理模型。', points: ['每月节气切换时记录预期主题', '月底只记可核对事实与情绪偏差', '区分外部事件、主动选择和解释偏见', '连续一年后再总结稳定规律'], practice: '建立十二行年度表，列出节气、干支、主题、事实与复盘。' },
    ],
  },
  {
    id: 'classic-reading', title: '古籍阅读方法', level: '进阶', order: 16,
    summary: '学会区分正文、原注、后注、版本异文和现代解释，避免断章取义。',
    lessons: [
      { id: 'text-layers', title: '正文、注与疏', summary: '同一页面可能叠加多个时代的文字，必须先辨认作者层次。', points: ['正文是被解释的核心文本', '注解释字句或提出一套读法', '疏进一步解释旧注', '现代译文应标明是直译、意译还是导读'], practice: '打开一篇古籍，分别标出正文、旧注和本站导读。' },
      { id: 'edition-check', title: '版本与异文校核', summary: '不同刻本、抄本与数据库录入可能出现字词、标点和篇章差异。', points: ['记录底本来源、卷次与篇名', '优先核对影印本或可靠全文库', '遇到讹字先保留原貌并加校记', '标点属于现代整理，也可能影响理解'], practice: '对同一句古文寻找两个来源，记录至少一处差异。' },
      { id: 'context-reading', title: '从上下文到命盘', summary: '先理解篇章在讨论什么问题，再把原则用于具体命盘。', points: ['不要从诗诀截一句直接套人', '区分普遍原则与特定月令条件', '把古文命题改写成可验证条件', '用多个案例检验，不以单个巧合证明'], practice: '选择一句原文，写出适用条件、不适用条件和验证方法。' },
    ],
  },
  {
    id: 'case-validation', title: '案例回测与论证', level: '实战', order: 17,
    summary: '把命理判断写成可追溯、可证伪、能复盘的分析，而不是事后附会。',
    lessons: [
      { id: 'case-record', title: '案例资料标准', summary: '记录时间来源、地点、已知误差和事件时间，保护隐私并避免诱导信息。', points: ['出生时间注明来自证件、家人回忆或推测', '事件用年月和客观事实记录', '先排盘再收集反馈，减少反向迎合', '公开案例应去标识化'], practice: '制作一张不含姓名的案例资料表。' },
      { id: 'claim-evidence', title: '结论—依据—验证', summary: '每条判断都应能回到命盘结构，并给出现实验证点。', points: ['结论说明主题和条件', '依据注明干支、十神、宫位与岁运', '给出至少两个可能现实表现', '注明什么事实会推翻或修正判断'], practice: '把一条性格判断写成四列表格：结论、依据、验证、反证。' },
      { id: 'bias-control', title: '控制确认偏误', summary: '命理学习最容易只记应验、忽略不应验，因此必须保存失败记录。', points: ['预测前写下时间戳和条件', '不随反馈偷偷改写原结论', '统计命中和未命中，不只讲精彩案例', '把不确定性作为模型信息而非失败遮掩'], practice: '复盘三条过去判断，至少保留一条不应验记录并分析原因。' },
    ],
  },
  {
    id: 'climate-calendar', title: '十二月令调候专题', level: '进阶', order: 18,
    summary: '把寒暖燥湿落实到十二月令，辨认季节主气、余气和气候转折。',
    lessons: [
      { id: 'twelve-climates', title: '十二月气候总纲', summary: '寅至丑十二月不是十二个静态标签，而是一条从生发、炎热、收敛到严寒的连续曲线。', points: ['寅卯辰由余寒转温润，辰为春夏转换', '巳午未由升温至炎燥，未月火退而土燥', '申酉戌由暑气未尽转为肃杀燥凉', '亥子丑由初寒转严寒，丑月寒湿凝滞', '节气初交、中气和月末的气感并不完全相同'], practice: '为十二月令各写一个寒暖词和一个燥湿词，再标出四个季节转折点。' },
      { id: 'wet-dry-earth', title: '辰丑湿土与未戌燥土', summary: '同为土，辰丑偏湿寒，未戌偏燥暖，承载和通关方式不同。', points: ['湿土可能蓄水、晦火，也能培木', '燥土可能脆金、耗水，也能制湿', '土多不一定都一样，须先辨温度和含水状态', '岁运改变寒暖时，原有土性也会随之变化'], practice: '比较辰土和戌土对火、水、木、金的不同影响。' },
      { id: 'climate-versus-strength', title: '调候与扶抑冲突时怎么判', summary: '某五行可能调候有利，却在强弱层面造成过量，需要分层确定先后和剂量。', points: ['先问命局能否正常生化，再问日主能否承载', '调候用神解决气候，扶抑用神解决力量', '同一五行在两层意见相反时，宜小量、有源、有制', '现实建议应采用可逆、渐进、能验证的方式'], practice: '找一例冬月身强水旺命盘，分别写调候需求和扶抑需求。' },
    ],
  },
  {
    id: 'useful-god-method', title: '用神辨析专题', level: '实战', order: 19,
    summary: '把用神拆成格局、调候、扶抑、通关四个问题，避免只报一个五行答案。',
    lessons: [
      { id: 'four-useful-layers', title: '四层取用模型', summary: '格局取用看结构，调候取用看气候，扶抑取用看承载，通关取用看相战。', points: ['四层可能指向同一五行，也可能不同', '先写每层解决的问题，再综合主次', '用神要在原局有来源或能由岁运引入', '没有条件成立的“用神”只是概念标签'], practice: '为同一命盘填写四层取用表，每层只写一个主要矛盾。' },
      { id: 'useful-real-false', title: '用神的真、假、清、浊', summary: '用神出现不等于可用，还要看得令、通根、位置、受制与是否被混杂。', points: ['透而无根可能显而不实', '有根不透可能潜藏待运', '用神被合绊、冲伤时作用打折', '多个用神互相冲突会形成清浊问题', '岁运扶起真用往往比单纯补数量更有效'], practice: '检查命盘候选用神的根、源、位置和受制，给出可信度。' },
      { id: 'useful-changing', title: '喜忌会不会随大运变化', summary: '原局核心病处相对稳定，但岁运会改变力量、气候与作用路径，因此阶段用法会调整。', points: ['原局用神与阶段喜神需要区分', '大运补足某一环后，下一阶段矛盾可能转移', '喜神过量也会反成偏性', '判断变化要解释结构，不可每十年随意换说法'], practice: '选择两步相邻大运，说明主矛盾如何变化、哪些需求保持不变。' },
    ],
  },
  {
    id: 'case-workshop', title: '综合案例工作坊', level: '实战', order: 20,
    summary: '用争议案例训练多方案比较、证据权重和岁运回测。',
    lessons: [
      { id: 'strength-dispute', title: '身强身弱争议案例', summary: '当得令、得地、得助与克泄耗互相冲突时，用权重和现实验证处理边界盘。', points: ['分别列支持身强和支持身弱的证据', '月令权重大，但不能忽略成局和透干', '比较两套喜忌在过去岁运中的解释力', '保留“中和偏强、随运摆动”等中间结论'], practice: '选择一个边界命盘，写正反两份论证，最后说明倾向和不确定性。' },
      { id: 'climate-case', title: '寒暖燥湿案例', summary: '从月令气候出发，再叠加原局火水、湿燥土和流通条件。', points: ['先写纯月令气候诊断', '再加入四柱修正寒暖燥湿', '区分需要的五行与现实可执行方案', '用过去冬夏月份的状态差异做回测'], practice: '对一个冬月命盘写“气候—结构—表现—方案—验证”五段分析。' },
      { id: 'luck-case', title: '大运流年复盘案例', summary: '把一件已发生事件放回原局、大运、流年、流月四层，检查重复触发。', points: ['先记录事件事实，不先写命理解释', '标出被触发的宫位、十神和干支关系', '区分背景条件、直接触发和个人选择', '写出若模型正确，下一次类似触发应出现什么'], practice: '选择一次工作或迁居变化，完成四层时间轴并写反证条件。' },
    ],
  },
];

export const learningPaths: LearningPath[] = [
  { id: 'starter', title: '零基础入门', audience: '第一次接触四柱', duration: '7天', summary: '先建立干支、五行、四柱和十神坐标，不急着判断吉凶。', moduleIds: ['foundation', 'yin-yang-elements', 'stems', 'branches', 'ten-gods'], outcome: '能读懂基础命盘，独立换算藏干和十神。' },
  { id: 'structure', title: '结构判断进阶', audience: '会排盘但不会分析', duration: '14天', summary: '训练旺衰、流通、格局、喜用和干支关系的固定判断顺序。', moduleIds: ['strength-roots', 'structure-useful', 'relations-deep', 'structure-patterns', 'useful-god-method'], outcome: '能写出有依据的命局主线与分层喜用。' },
  { id: 'climate', title: '调候专项', audience: '想深入寒暖燥湿', duration: '10天', summary: '从十二月令出发，将调候、扶抑和现实改善方案区分开。', moduleIds: ['structure-useful', 'climate-calendar', 'useful-god-method', 'case-workshop'], outcome: '能完成寒暖燥湿诊断，并控制补偏的先后与剂量。' },
  { id: 'timing', title: '岁运实战', audience: '想学习大运流年', duration: '12天', summary: '从原局到大运、流年、流月逐层定位，用过去事件回测。', moduleIds: ['luck-cycle', 'monthly-practice', 'case-validation', 'case-workshop'], outcome: '能建立年度观察表和可验证的趋势判断。' },
  { id: 'classics', title: '古籍研读', audience: '想系统阅读原典', duration: '21天', summary: '先学习版本、正文与旧注层次，再精读调候、格局、岁运专题。', moduleIds: ['classic-reading', 'structure-useful', 'structure-patterns', 'climate-calendar'], outcome: '能区分原文、旧注和现代解释，不再断章套诀。' },
];

export const knowledgeQuizQuestions: KnowledgeQuizQuestion[] = [
  { id: 'q01', level: '入门', category: '基础', prompt: '四柱分析中，十神关系以哪一个字为中心建立？', options: ['年干', '月支', '日干', '时干'], answer: 2, explanation: '日干又称日主、日元，是十神生克关系的中心坐标；月支则是判断季节与月令的重要入口。', moduleId: 'foundation', lessonId: 'four-pillars' },
  { id: 'q02', level: '入门', category: '基础', prompt: '八字月柱通常在哪一类时间节点切换？', options: ['每月初一', '十二个节', '每月十五', '公历每月一日'], answer: 1, explanation: '干支月以节气中的“节”为分界，如立春、惊蛰、清明。农历初一并不是八字月柱的固定边界。', moduleId: 'foundation', lessonId: 'solar-terms' },
  { id: 'q03', level: '入门', category: '基础', prompt: '下列哪一组完整呈现五行相生次序？', options: ['木火土金水木', '木土水火金木', '木水金土火木', '火木水金土火'], answer: 0, explanation: '木生火、火生土、土生金、金生水、水生木，构成连续的相生循环。', moduleId: 'yin-yang-elements', lessonId: 'generation-control' },
  { id: 'q04', level: '入门', category: '基础', prompt: '关于阴阳，以下哪项表述更准确？', options: ['阳一定优于阴', '阴阳直接等于男女', '阴阳描述同一五行不同的表达方向', '阴干都没有行动力'], answer: 2, explanation: '阴阳用于描述显隐、动静、刚柔等表达方向，并非价值高低，也不能机械等同于性别。', moduleId: 'yin-yang-elements', lessonId: 'yin-yang' },
  { id: 'q05', level: '入门', category: '基础', prompt: '“藏干”指的是什么？', options: ['没有写出的出生时间', '地支内部所含的天干', '大运中未出现的天干', '被合住的天干'], answer: 1, explanation: '十二地支各含一至三个天干，分本气、中气、余气；其权重并不完全相同。', moduleId: 'branches', lessonId: 'hidden-stems' },
  { id: 'q06', level: '入门', category: '基础', prompt: '日主所生者，在十神六类关系中属于哪一组？', options: ['印星', '官杀', '食伤', '财星'], answer: 2, explanation: '我生者为食神、伤官；生我者为印；我克者为财；克我者为官杀。', moduleId: 'ten-gods', lessonId: 'ten-god-logic' },
  { id: 'q07', level: '进阶', category: '强弱', prompt: '判断日主强弱时，哪一种做法最不可靠？', options: ['观察月令', '检查通根', '比较生扶与克泄耗', '只统计五行个数'], answer: 3, explanation: '同一个字因季节、根气、透藏、位置和组合不同，权重差别很大，不能只做数量加减。', moduleId: 'strength-roots', lessonId: 'four-strength-factors' },
  { id: 'q08', level: '进阶', category: '强弱', prompt: '“得令”最直接表示什么？', options: ['得到长辈帮助', '符合月令季节旺相', '地支出现同类根', '天干数量最多'], answer: 1, explanation: '得令指某五行符合月令时气。它权重很高，但仍不能代替得地、得助和克泄耗的全局判断。', moduleId: 'strength-roots', lessonId: 'four-strength-factors' },
  { id: 'q09', level: '进阶', category: '强弱', prompt: '天干“透而无根”通常应怎样理解？', options: ['必然完全无效', '显而不实，作用需看来源与岁运', '一定比藏干强', '自动成为用神'], answer: 1, explanation: '透干使作用可见，但无根无源时持续性和承载力有限；不能简单判为零，也不能视为稳定有力。', moduleId: 'stems', lessonId: 'stem-function' },
  { id: 'q10', level: '进阶', category: '强弱', prompt: '十二长生在命局判断中的合理位置是什么？', options: ['单独决定吉凶', '替代月令', '作为根气与状态的辅助坐标', '只用于看寿命'], answer: 2, explanation: '十二长生描述阶段状态，应与月令、通根、透藏和组合并看，不宜孤立断事。', moduleId: 'strength-roots', lessonId: 'twelve-stages' },
  { id: 'q11', level: '进阶', category: '关系', prompt: '看到天干五合时，第一步应先判断什么？', options: ['立即改成化神五行', '先看牵引与合绊，再审合化条件', '直接断婚姻', '忽略双方强弱'], answer: 1, explanation: '合而不化很常见。应先观察双方是否被牵引、是否影响原有功能，再看月令、化神与整体气势是否支持合化。', moduleId: 'relations-deep', lessonId: 'combine-transform' },
  { id: 'q12', level: '进阶', category: '关系', prompt: '下列哪一项不是地支三合局？', options: ['申子辰水局', '亥卯未木局', '寅午戌火局', '寅卯辰木局'], answer: 3, explanation: '寅卯辰是东方木三会方；三合木局为亥卯未。三合与三会的形成逻辑不同。', moduleId: 'relations-deep', lessonId: 'combine-transform' },
  { id: 'q13', level: '进阶', category: '关系', prompt: '对“六冲”最稳妥的理解是？', options: ['一见必有灾', '只代表身体疾病', '常提示位移、变化、对立或结构松动', '一定能冲开墓库'], answer: 2, explanation: '冲是作用方式，不是固定吉凶。它可能带来搬迁、调整、分离或激活，结果取决于被冲对象和全局喜忌。', moduleId: 'relations-deep', lessonId: 'clash-punish-harm' },
  { id: 'q14', level: '进阶', category: '关系', prompt: '处理合、冲、刑、害等多重关系时，优先级通常应首先参考什么？', options: ['神煞数量', '月令、旺衰、位置与是否成局', '口诀字数', '生肖属相'], answer: 1, explanation: '关系是否成立及其权重，首先取决于时令、力量、位置、透干和成局条件，辅助关系不应压过主结构。', moduleId: 'relations-deep', lessonId: 'relation-priority' },
  { id: 'q15', level: '进阶', category: '取用', prompt: '“用神”最准确的工作定义是？', options: ['命局中数量最少的五行', '固定带来好运的颜色', '解决主要结构矛盾的关键作用', '日主同五行'], answer: 2, explanation: '用神服务于具体问题，可能用于格局、扶抑、调候或通关；不能用“缺什么补什么”替代结构判断。', moduleId: 'structure-useful', lessonId: 'useful-god' },
  { id: 'q16', level: '进阶', category: '取用', prompt: '格局取用、扶抑取用、调候取用与通关取用之间是什么关系？', options: ['四者永远相同', '只能选择其中一种', '分别解决不同层面的矛盾，需要综合主次', '只需看调候'], answer: 2, explanation: '四层模型的观察对象不同，结论可能重合也可能分开。专业分析应说明每一层解决什么问题，再排先后。', moduleId: 'useful-god-method', lessonId: 'four-useful-layers' },
  { id: 'q17', level: '进阶', category: '取用', prompt: '冬月命局见火，就能直接判定寒气已解吗？', options: ['能，见火即暖', '不能，还要看火的根、源、位置和受制', '只看火的数量', '只看年干是否为火'], answer: 1, explanation: '调候不能只数五行。无根虚火、受水冲克之火与得根有源之火，实际温暖能力完全不同。', moduleId: 'climate-calendar', lessonId: 'twelve-climates' },
  { id: 'q18', level: '进阶', category: '取用', prompt: '燥土与湿土在调候中的差异，以下哪项较准确？', options: ['四土完全相同', '燥土偏收燥，湿土偏蓄水转化', '湿土一定是忌神', '燥土一定生金'], answer: 1, explanation: '辰丑多带湿蓄，未戌偏燥；但具体作用仍要结合季节、藏干、透干与刑冲合化。', moduleId: 'climate-calendar', lessonId: 'wet-dry-earth' },
  { id: 'q19', level: '实战', category: '取用', prompt: '候选用神透出但被合绊、无根且受克，分析时应如何表述？', options: ['用神明确而有力', '用神存在但可用度低，需要根源或岁运扶起', '直接删除这个字', '一定从格'], answer: 1, explanation: '专业表达应区分“出现”和“可用”。根、源、位置、受制决定候选用神能否真正解决命局问题。', moduleId: 'useful-god-method', lessonId: 'useful-real-false' },
  { id: 'q20', level: '实战', category: '岁运', prompt: '大运、流年、流月的合理分工是？', options: ['三者权重完全一样', '大运定阶段背景，流年触发主题，流月细化落点', '只看流年即可', '流月能推翻原局'], answer: 1, explanation: '原局是底图，大运改变长期环境，流年集中触发，流月用于缩小时间窗口；后层不能脱离前层独立解释。', moduleId: 'monthly-practice', lessonId: 'time-layers' },
  { id: 'q21', level: '实战', category: '岁运', prompt: '复盘一次已经发生的职业变化，第一步最好做什么？', options: ['先套十神断语', '先记录事件事实与准确时间', '先找神煞', '先判断吉凶等级'], answer: 1, explanation: '先保存事实，才能避免事后挑选解释。之后再标注原局主题、大运背景、流年触发与流月落点。', moduleId: 'case-validation', lessonId: 'case-record' },
  { id: 'q22', level: '实战', category: '岁运', prompt: '伏吟最稳妥的解释方式是？', options: ['必然发生丧事', '重复的干支主题被加强或反复', '一定升职', '完全没有作用'], answer: 1, explanation: '伏吟强调重复、回响与同类主题加重，具体表现仍由被重复的宫位、十神、喜忌与现实处境决定。', moduleId: 'luck-cycle', lessonId: 'annual-monthly' },
  { id: 'q23', level: '实战', category: '岁运', prompt: '当两套强弱判断都能解释部分事实时，较专业的做法是？', options: ['选择更吉利的一套', '列出双方证据并用过去岁运比较解释力', '把结论写得更绝对', '只参考五行百分比'], answer: 1, explanation: '边界命局应保留不确定性，通过证据权重和历史事件回测缩小范围，而不是用更强的语气掩盖分歧。', moduleId: 'case-workshop', lessonId: 'strength-dispute' },
  { id: 'q24', level: '实战', category: '岁运', prompt: '下面哪一种写法最符合“可验证命理分析”？', options: ['你一生必定大富', '此运较好', '若此结构判断成立，相关年份应更容易出现岗位调整，可用实际记录反证', '贵人很多'], answer: 2, explanation: '可验证表达需要条件、观察对象和反证入口，避免不可证伪的宽泛断语。', moduleId: 'case-validation', lessonId: 'claim-evidence' },
  { id: 'q25', level: '入门', category: '古籍', prompt: '阅读古籍时，为什么要区分正文、旧注与现代导读？', options: ['为了让页面更长', '三者作者、时代和解释层次不同', '旧注一定错误', '现代导读就是原文'], answer: 1, explanation: '正文、历代注释与现代整理者的说明属于不同文本层，混在一起会造成错误引用和时代语境错置。', moduleId: 'classic-reading', lessonId: 'text-layers' },
  { id: 'q26', level: '进阶', category: '古籍', prompt: '用古籍口诀判断具体命盘前，最重要的校验是什么？', options: ['口诀是否听起来顺口', '版本、上下文与适用前提', '是否能直接断富贵', '字数是否足够短'], answer: 1, explanation: '同一句话在不同版本、篇章语境和论法体系中可能含义不同，脱离前提套诀容易误判。', moduleId: 'classic-reading', lessonId: 'edition-check' },
  { id: 'q27', level: '进阶', category: '古籍', prompt: '《穷通宝鉴》最适合重点训练哪一类分析？', options: ['六爻纳甲', '月令气候与十干调候', '紫微斗数', '生肖配对'], answer: 1, explanation: '《穷通宝鉴》以月令、十干及寒暖燥湿为重要组织线索，适合训练调候思路，但仍需结合结构判断。', moduleId: 'classic-reading', lessonId: 'context-reading' },
  { id: 'q28', level: '进阶', category: '古籍', prompt: '古籍中的命例应如何使用？', options: ['见到一字相同就照搬结论', '提取论证路径，并检查自己的命盘是否满足同样条件', '只记结论不看过程', '当作现代统计数据'], answer: 1, explanation: '命例的价值在于展示作者如何从结构走向判断；迁移时必须核对月令、根气、组合和岁运条件。', moduleId: 'classic-reading', lessonId: 'context-reading' },
  { id: 'q29', level: '实战', category: '取用', prompt: '根据调候提出改善方案时，哪种方法更可靠？', options: ['只推荐固定颜色和饰品', '从作息、空间、活动、节律和风险边界综合设计，并观察反馈', '补得越多越好', '完全忽略现实健康条件'], answer: 1, explanation: '传统取象应转成低风险、可执行、可反馈的生活策略；物品只是弱提示，不能代替环境、行为和专业建议。', moduleId: 'case-workshop', lessonId: 'climate-case' },
  { id: 'q30', level: '实战', category: '关系', prompt: '神煞在完整命局分析中的合理权重是？', options: ['高于月令和格局', '用于辅助取象，服从五行结构和岁运触发', '数量越多越凶', '可以单独决定婚姻事业'], answer: 1, explanation: '神煞适合补充象意和事件语言，但不能压过月令、旺衰、格局、干支组合及岁运层次。', moduleId: 'special-markers', lessonId: 'shen-sha' },
];

export const knowledgeTerms: KnowledgeTerm[] = [
  { id: 'day-master', term: '日主', aliases: ['日元', '日干'], category: '基础坐标', definition: '出生日天干，是十神关系和强弱判断的中心坐标。', caution: '以日主为中心不等于只看日干；月令、根气和全局组合仍决定其状态。', moduleId: 'foundation' },
  { id: 'month-command', term: '月令', aliases: ['月支', '提纲'], category: '基础坐标', definition: '出生月的地支，代表季节主气，是旺衰、格局和调候的重要入口。', caution: '月令权重大但不包办全局，须结合透干、会局和日主根气。', moduleId: 'foundation', classicRef: { bookId: 'ditiansui', chapterId: '17', label: '《滴天髓·月令论》' } },
  { id: 'hidden-stem', term: '藏干', aliases: ['人元', '支中所藏'], category: '基础坐标', definition: '地支内部所含的一至三个天干，分本气、中气和余气。', caution: '藏干有层次和季节权重，不能把三个藏干视为等量。', moduleId: 'branches' },
  { id: 'revealed-stem', term: '透干', aliases: ['透出'], category: '基础坐标', definition: '地支所藏之气在天干出现，通常更容易形成可见角色和事件。', caution: '透出若无根无源，可能显而不实；藏而不透也不等于不存在。', moduleId: 'stems' },
  { id: 'rooting', term: '通根', aliases: ['得根', '根气'], category: '基础坐标', definition: '天干在地支藏干中找到同类或生扶落点，获得持续承载。', caution: '本气根、中余气根、远近位置和是否受冲，力量并不相同。', moduleId: 'strength-roots' },
  { id: 'seasonal-ruler', term: '司令', aliases: ['当令', '司权'], category: '基础坐标', definition: '月令内部在出生节气阶段实际主事的气。', caution: '不同流派对分日司令表有差异，临界日期应注明算法。', moduleId: 'time-correction' },
  { id: 'season-support', term: '得令', aliases: ['乘令'], category: '力量判断', definition: '某五行符合月令季节旺相，获得最直接的时令支持。', caution: '得令不一定最终身强；若无根、被制或大量泄耗，仍需综合。', moduleId: 'strength-roots' },
  { id: 'ground-support', term: '得地', aliases: ['得根'], category: '力量判断', definition: '天干在地支获得根、禄旺或其他实质落点。', caution: '根被冲坏、合化或隔远时，实际可用程度会变化。', moduleId: 'strength-roots' },
  { id: 'momentum', term: '得势', aliases: ['成势'], category: '力量判断', definition: '同类众多、透藏呼应或成方成局，形成整体气势。', caution: '数量多未必同心，杂乱、无令或彼此牵制时不一定成势。', moduleId: 'strength-roots' },
  { id: 'prosperity', term: '旺衰', aliases: ['旺相休囚死'], category: '力量判断', definition: '五行在季节、根气和组合中的阶段性状态。', caution: '旺衰不是简单计数，也不直接等同人的能力或命运高低。', moduleId: 'strength-roots', classicRef: { bookId: 'ditiansui', chapterId: '12', label: '《滴天髓·衰旺论》' } },
  { id: 'storage', term: '墓库', aliases: ['四库'], category: '力量判断', definition: '辰戌丑未兼具季节转换、收藏与杂气特征。', caution: '“墓”和“库”要结合对象是否旺衰、有无引动，不能固定断为收藏或困住。', moduleId: 'branches' },
  { id: 'growth-cycle', term: '十二长生', aliases: ['长生十二宫'], category: '力量判断', definition: '描述天干在十二地支中的生长、旺盛、衰退和收藏阶段。', caution: '它是辅助坐标，不能脱离月令、通根和实际组合单独论吉凶。', moduleId: 'strength-roots' },
  { id: 'six-combine', term: '六合', aliases: ['地支六合'], category: '干支关系', definition: '子丑、寅亥、卯戌、辰酉、巳申、午未六组相合。', caution: '合可能是聚合、牵引或羁绊，是否化气另需条件。', moduleId: 'relations-deep' },
  { id: 'three-combine', term: '三合局', aliases: ['三合'], category: '干支关系', definition: '申子辰水、亥卯未木、寅午戌火、巳酉丑金的生旺墓组合。', caution: '三字齐全也要看月令、透干和破坏条件；两字只能称半合或拱局倾向。', moduleId: 'relations-deep' },
  { id: 'seasonal-meeting', term: '三会方', aliases: ['三会局'], category: '干支关系', definition: '寅卯辰东方木、巳午未南方火、申酉戌西方金、亥子丑北方水。', caution: '三会强调季节方气，是否完全改变原局仍须比较强弱和逆气。', moduleId: 'relations-deep' },
  { id: 'five-stem-combine', term: '天干五合', aliases: ['五合'], category: '干支关系', definition: '甲己、乙庚、丙辛、丁壬、戊癸五组天干相合。', caution: '见合先论牵引，合化需得令、得势、有化神。', moduleId: 'stems' },
  { id: 'transformation', term: '合化', aliases: ['化气'], category: '干支关系', definition: '相合双方在条件充分时改变原有作用，趋向新的五行气势。', caution: '合而不化远多于真正合化，不可见合就改变五行。', moduleId: 'relations-deep' },
  { id: 'binding', term: '合绊', aliases: ['贪合忘用'], category: '干支关系', definition: '关键力量因相合而被牵制，暂时难以发挥原有作用。', caution: '是否成绊取决于位置、强弱、岁运和另一方是否有力。', moduleId: 'relations-deep', classicRef: { bookId: 'ditiansui', chapterId: '37', label: '《滴天髓·绊神论》' } },
  { id: 'six-clash', term: '六冲', aliases: ['地支相冲'], category: '干支关系', definition: '子午、丑未、寅申、卯酉、辰戌、巳亥六组对冲。', caution: '冲常带位移、变化和对立，不等于必然灾祸。', moduleId: 'relations-deep' },
  { id: 'punishment', term: '三刑', aliases: ['相刑'], category: '干支关系', definition: '寅巳申、丑未戌、子卯及自刑等结构性摩擦关系。', caution: '刑的体系流派差异较多，应结合重复触发和现实主题。', moduleId: 'relations-deep' },
  { id: 'harm', term: '六害', aliases: ['相害'], category: '干支关系', definition: '六组地支之间的暗中牵制与不协调关系。', caution: '害通常不如冲直接，不能一见便断人际背叛或疾病。', moduleId: 'relations-deep' },
  { id: 'break', term: '六破', aliases: ['相破'], category: '干支关系', definition: '表示关系松动、结构破损或计划不稳的一组辅助关系。', caution: '六破在不同流派权重差异大，应低于月令、旺衰和主要合冲。', moduleId: 'relations-deep' },
  { id: 'structure', term: '格局', aliases: ['成格'], category: '格局取用', definition: '以月令透藏和十神制化形成的稳定成事结构。', caution: '格局名称不是等级结论，还要看成败、相神、清浊与日主承载。', moduleId: 'structure-patterns', classicRef: { bookId: 'ditiansui', chapterId: '06', label: '《滴天髓·格局论》' } },
  { id: 'assistant-god', term: '相神', aliases: ['辅格之神'], category: '格局取用', definition: '维护格局、协助用神并解决结构阻碍的关键力量。', caution: '相神依格局而定，不是固定对应某个五行。', moduleId: 'structure-patterns' },
  { id: 'useful-god-term', term: '用神', aliases: ['取用'], category: '格局取用', definition: '解决命局主要矛盾、使结构得以运转的关键力量。', caution: '格局、调候、扶抑、通关各有取用角度，不能只报一个五行。', moduleId: 'useful-god-method', classicRef: { bookId: 'ditiansui', chapterId: '10', label: '《滴天髓·体用论》' } },
  { id: 'favorable-god', term: '喜神', aliases: ['喜用'], category: '格局取用', definition: '帮助用神、改善流通或增强承载的有利力量。', caution: '喜神也有剂量，过量或破坏其他层次时不再纯喜。', moduleId: 'useful-god-method' },
  { id: 'unfavorable-god', term: '忌神', aliases: ['忌'], category: '格局取用', definition: '加重命局主要病处、破坏用神或阻断流通的力量。', caution: '忌神受制时也可能成为结构的一部分，不能简单视为坏元素。', moduleId: 'useful-god-method' },
  { id: 'illness-medicine', term: '病药', aliases: ['病药法'], category: '格局取用', definition: '先找命局最突出的问题为“病”，再找能有针对性解决的力量为“药”。', caution: '病药是结构比喻，不是医学诊断；药过量同样可能成为新病。', moduleId: 'useful-god-method' },
  { id: 'mediation', term: '通关', aliases: ['引通'], category: '格局取用', definition: '在两种相战五行之间引入中介，使克战转为连续相生路径。', caution: '通关五行必须有根、有位置并能真实参与作用。', moduleId: 'useful-god-method', classicRef: { bookId: 'ditiansui', chapterId: '20', label: '《滴天髓·通隔论》' } },
  { id: 'support-control', term: '扶抑', aliases: ['扶弱抑强'], category: '格局取用', definition: '根据日主与全局承载关系，对过弱者生扶、过强者疏泄制约。', caution: '扶抑不是唯一取用法，也不能用五行个数代替力量判断。', moduleId: 'useful-god-method' },
  { id: 'climate-adjustment', term: '调候', aliases: ['调候用神'], category: '调候气象', definition: '针对出生季节造成的寒暖燥湿，使五行具备正常生化条件。', caution: '调候解决气候，不自动等同格局或扶抑用神。', moduleId: 'climate-calendar', classicRef: { bookId: 'ditiansui', chapterId: '16', label: '《滴天髓·寒暖论》' } },
  { id: 'cold-warm', term: '寒暖', aliases: ['寒热'], category: '调候气象', definition: '由季节、火水配置和湿燥共同形成的温度状态。', caution: '冬生不一定都寒，夏生也不一定都热，须看原局修正。', moduleId: 'climate-calendar', classicRef: { bookId: 'qiongtong', chapterId: '01', label: '《穷通宝鉴·五行总论》' } },
  { id: 'dry-wet', term: '燥湿', aliases: ['湿燥'], category: '调候气象', definition: '气局中水分、润泽和凝滞程度，常与四季土性密切相关。', caution: '水多不等于润，寒水可能凝；火多不等于燥，也要看湿土和水源。', moduleId: 'climate-calendar', classicRef: { bookId: 'ditiansui', chapterId: '16', label: '《滴天髓·寒暖论》' } },
  { id: 'following-structure', term: '从格', aliases: ['从势'], category: '格局取用', definition: '日主失去独立依托而顺从全局主势的特殊结构。', caution: '条件严格；日主有根、有援或逆势力量时通常不能轻言从格。', moduleId: 'structure-patterns', classicRef: { bookId: 'ditiansui', chapterId: '07', label: '《滴天髓·从化论·真》' } },
  { id: 'exclusive-prosperity', term: '专旺', aliases: ['一行专旺'], category: '格局取用', definition: '某一五行得令成方成局、气势纯一并少有逆气的特殊结构。', caution: '五行数量多不等于专旺，杂气、克泄和日主关系都需检验。', moduleId: 'structure-patterns' },
  { id: 'major-luck', term: '大运', aliases: ['运程'], category: '岁运应用', definition: '约十年一阶段的干支环境，改变原局力量和现实主题。', caution: '大运不是独立命盘，必须与原局同看，交运年龄也依算法而定。', moduleId: 'luck-cycle', classicRef: { bookId: 'ditiansui', chapterId: '09', label: '《滴天髓·岁运论》' } },
  { id: 'annual-luck', term: '流年', aliases: ['太岁'], category: '岁运应用', definition: '某一公历节气年对应的干支，用于观察年度触发。', caution: '流年要放在大运背景中，不可用一个字直接断全年事件。', moduleId: 'luck-cycle' },
  { id: 'monthly-luck', term: '流月', aliases: ['月运'], category: '岁运应用', definition: '流年内按节气切换的十二个月干支，用于定位阶段窗口。', caution: '流月不是农历初一切换，且层级低于大运和流年。', moduleId: 'monthly-practice' },
  { id: 'repetition', term: '伏吟', aliases: ['同柱复现'], category: '岁运应用', definition: '岁运干支与原局某柱相同，形成主题重复和加强。', caution: '伏吟表示重复、停滞或强化，不固定等同凶事。', moduleId: 'monthly-practice' },
  { id: 'opposition', term: '反吟', aliases: ['天克地冲'], category: '岁运应用', definition: '岁运与原局某柱形成强烈对冲或相反结构。', caution: '常见变化幅度增大，但结果仍取决于冲到喜神还是忌神及现实条件。', moduleId: 'monthly-practice' },
  { id: 'luck-transition', term: '交运', aliases: ['起运', '换运'], category: '岁运应用', definition: '从一柱大运切换到下一柱大运的时间节点。', caution: '交运并非某天必然突变，更常表现为前后数月到一两年的主题过渡。', moduleId: 'luck-cycle' },
  { id: 'symbolic-stars', term: '神煞', aliases: ['星煞'], category: '岁运应用', definition: '依据干支组合推导的辅助类象系统，如天乙、驿马、桃花。', caution: '神煞只能辅助定位，不能凌驾于月令、五行、十神和格局。', moduleId: 'special-markers' },
];

export const classicExcerpts: ClassicExcerpt[] = [
  {
    id: 'hongfan-elements',
    book: '尚书·洪范',
    chapter: '五行',
    original: '水曰润下，火曰炎上，木曰曲直，金曰从革，土爰稼穑。',
    translation: '水的基本趋势是向下润泽，火向上发散，木能屈能伸而生长，金能顺应锻造而改变，土承担耕作与转化。',
    notes: ['这是五行基本性质的重要早期表述', '后世命理把这些性质延伸为流动、表达、成长、裁成与承载', '原文不是在直接描述人的性格'],
    related: ['阴阳五行', '五行取象'],
    sourceLabel: '中国哲学书电子化计划《尚书·洪范》',
    sourceUrl: 'https://ctext.org/shang-shu/great-plan/zhs',
  },
  {
    id: 'ziping-useful',
    book: '子平真诠',
    chapter: '论用神',
    original: '八字用神，专求月令，以日干配月令地支，而生克不同，格局分焉。',
    translation: '取用神先从月令入手，以日干和月支的生克关系确定结构入口，再据此区分格局。',
    notes: ['“专求月令”强调月令权重，不是永远只看月令一个字', '用神在这里与格局结构密切相关', '后续还要看透干、会支与成败救应'],
    related: ['格局、喜用与调候', '旺衰与根气'],
    sourceLabel: '《子平真诠》原本·论用神',
    sourceUrl: 'https://donglishuzhai.net/chapter/3721.html',
  },
  {
    id: 'ziping-change',
    book: '子平真诠',
    chapter: '论用神变化',
    original: '用神既主月令矣，然月令所藏不一，而用神遂有变化。',
    translation: '虽然取用从月令开始，但月支内部往往藏有多种天干，因此实际用神会随透藏与组合发生变化。',
    notes: ['地支不能只按一个表面五行判断', '月令藏干谁透出、谁会合，都会改变结构', '这是理解格局变化与杂气月的重要入口'],
    related: ['地支藏干', '格局、喜用与调候'],
    sourceLabel: '《子平真诠》·论用神变化',
    sourceUrl: 'https://guoxue.httpcn.com/html/book/PWXVRNIL/CQAZXVTBMEPW.shtml',
  },
  {
    id: 'ditiansui-moisture',
    book: '滴天髓',
    chapter: '燥湿',
    original: '地道有燥湿，生成品汇，人道得之，不可偏也。',
    translation: '地气有干燥和湿润的差别，万物由此生化；人所禀受的气也不宜偏于一端。',
    notes: ['调候不能只谈寒暖，还要辨燥湿', '湿土与燥土、寒水与润水不可混作一个标签', '所谓不可偏，核心是气能否流通和生化'],
    related: ['调候：寒暖燥湿', '五行气势'],
    sourceLabel: '维基文库《滴天髓》第十六篇',
    sourceUrl: 'https://zh.wikisource.org/zh-hans/%E6%BB%B4%E5%A4%A9%E9%AB%93/16',
  },
  {
    id: 'ditiansui-passage',
    book: '滴天髓阐微',
    chapter: '通关',
    original: '通关者，引通克制之神也。所谓阴阳二用，妙在气交。',
    translation: '通关就是引入能够连接两股相克力量的中介，使阴阳五行重新交流。',
    notes: ['木土相战可观察火，火金相战可观察土', '通关之神必须有力量、有位置，不能只在概念上存在', '岁运来到通关五行时，原局矛盾可能获得新的处理路径'],
    related: ['生克制化', '喜神、用神、忌神'],
    sourceLabel: '维基文库《滴天髓阐微·通关》',
    sourceUrl: 'https://zh.wikisource.org/wiki/%E6%BB%B4%E5%A4%A9%E9%AB%93%E9%97%A1%E5%BE%AE',
  },
  {
    id: 'sanming-month',
    book: '三命通会',
    chapter: '卷十·看命口诀',
    original: '大凡看命，先看月支有无财官，方看其他。月令为命也。',
    translation: '看命应先观察月支所主之气及其中的财官等结构，再扩展到其他干支，因为月令是全局的重要提纲。',
    notes: ['这里体现月令优先的传统格局路径', '财官只是原书时代常用的结构语言，现代学习不能只追逐财官', '仍要结合日主承载与其他十神制化'],
    related: ['格局从月令出发', '正确阅读顺序'],
    sourceLabel: '维基文库《三命通会》四库全书本卷十',
    sourceUrl: 'https://zh.wikisource.org/zh-hans/%E4%B8%89%E5%91%BD%E9%80%9A%E6%9C%83_%28%E5%9B%9B%E5%BA%AB%E5%85%A8%E6%9B%B8%E6%9C%AC%29/%E5%8D%B710',
  },
  {
    id: 'sanming-day',
    book: '三命通会',
    chapter: '玉井奥诀',
    original: '凡推究造化之理，其法以日为主。',
    translation: '推究命局变化时，以日干作为分析中心，其他干支都要相对于日主确定关系。',
    notes: ['这正是十神以日主为坐标的基础', '以日为主不代表忽略月令', '日主、月令分别解决中心坐标与季节权重问题'],
    related: ['四柱与八字', '十神生成逻辑'],
    sourceLabel: '维基文库《古今图书集成·三命通会·玉井奥诀》',
    sourceUrl: 'https://zh.wikisource.org/wiki/Page%3AGujin_Tushu_Jicheng%2C_Volume_472_%281700-1725%29.djvu/38',
  },
  {
    id: 'yuanhai-balance',
    book: '渊海子平',
    chapter: '五行生克赋',
    original: '五行贵在中和。以理求之，慎勿苟言。',
    translation: '五行分析重在适度、流通与平衡，应根据具体结构推理，不能草率套用口诀。',
    notes: ['中和不是五行各占百分之二十', '真正的平衡会随季节、日主和结构变化', '这句话也提醒学习者避免见一字就下断语'],
    related: ['生克制化', '常见误区'],
    sourceLabel: '维基文库《渊海子平大全·五行生克赋》',
    sourceUrl: 'https://zh.wikisource.org/zh-hans/%E6%B7%B5%E6%B5%B7%E5%AD%90%E5%B9%B3%E5%A4%A7%E5%85%A8',
  },
  {
    id: 'yuanhai-overflow',
    book: '渊海子平',
    chapter: '论五行生克制化',
    original: '金赖土生，土多金埋；木赖水生，水多木漂。',
    translation: '金需要土来生，但土过多反会埋金；木需要水来生，但水过多反会使木漂浮无根。',
    notes: ['相生不是越多越好', '生扶必须考虑被生者能否承载', '喜用五行来到岁运时仍要观察剂量与流通'],
    related: ['生克制化', '喜神、用神、忌神'],
    sourceLabel: '维基文库《渊海子平·论五行生克制化》',
    sourceUrl: 'https://zh.wikisource.org/zh-hant/%E6%B7%B5%E6%B5%B7%E5%AD%90%E5%B9%B3',
  },
  {
    id: 'qiongtong-bing',
    book: '穷通宝鉴',
    chapter: '十一月丙火',
    original: '十一月丙火，冬至一阳生，弱中复强。',
    translation: '丙火生在子月，处于严冬，但冬至后阳气开始回升，因此不能只按衰弱一端判断。',
    notes: ['《穷通宝鉴》重视月令气候与日干性质', '原文讨论的是特定日干与月份组合，不可横向套给所有命盘', '还要继续看壬、戊等具体配置与原局承载'],
    related: ['调候：寒暖燥湿', '十天干'],
    sourceLabel: '维基文库《穷通宝鉴》',
    sourceUrl: 'https://zh.wikisource.org/zh-hans/%E7%A9%B7%E9%80%9A%E5%AF%B6%E9%91%91',
  },
  {
    id: 'wuxing-stems',
    book: '五行精纪',
    chapter: '论十干',
    original: '十干者，五行之精纪，甲阳木，乙阴木也。',
    translation: '十天干是五行进一步分阴分阳的表达，例如甲为阳木、乙为阴木。',
    notes: ['十干把五行与阴阳结合成十种基本编码', '同五行的阴阳干具有共同性质，也有不同表达方式', '十干类象必须结合季节与坐支'],
    related: ['阴阳的作用', '十干速查'],
    sourceLabel: '维基文库《五行精纪》',
    sourceUrl: 'https://zh.wikisource.org/zh-hans/%E4%BA%94%E8%A1%8C%E7%B2%BE%E7%B4%80',
  },
  {
    id: 'shenfeng-inside-outside',
    book: '神峰通考',
    chapter: '定真篇',
    original: '十二支中所藏人元，谓之内；十干露出，谓之外。',
    translation: '地支内部所藏的天干称为内在之气，直接显现在天干上的力量称为外在之气。',
    notes: ['这是理解“透干”和“藏干”的直观方式', '藏而不透不等于没有，只是事件表达较隐', '透干若无根，也可能显而不实'],
    related: ['地支藏干', '透干与作用路径'],
    sourceLabel: '维基文库《神峰通考》',
    sourceUrl: 'https://zh.wikisource.org/wiki/%E7%A5%9E%E5%B3%B0%E9%80%9A%E8%80%83',
  },
  {
    id: 'lixuzhong-season',
    book: '李虚中命书',
    chapter: '卷下·五行四时',
    original: '水性本寒，火体本热。五行之运，阴阳相推。',
    translation: '水的本性偏寒，火的本性偏热；五行随阴阳和四时相互推动，不能脱离季节理解。',
    notes: ['五行性质与季节气候相连', '同一个五行在不同月份会呈现不同状态', '原书体系与后世子平法不完全相同，阅读时要辨流派'],
    related: ['阴阳五行', '调候：寒暖燥湿'],
    sourceLabel: '维基文库《李虚中命书》四库全书本卷下',
    sourceUrl: 'https://zh.wikisource.org/zh-hans/%E6%9D%8E%E8%99%9B%E4%B8%AD%E5%91%BD%E6%9B%B8_%28%E5%9B%9B%E5%BA%AB%E5%85%A8%E6%9B%B8%E6%9C%AC%29/%E5%8D%B7%E4%B8%8B',
  },
];

export const stemQuickReference = [
  ['甲', '阳木', '乔木、开创、向上'], ['乙', '阴木', '藤蔓、协调、柔韧'],
  ['丙', '阳火', '太阳、公开、推动'], ['丁', '阴火', '灯火、专注、感知'],
  ['戊', '阳土', '山岳、平台、承载'], ['己', '阴土', '田园、培育、整合'],
  ['庚', '阳金', '刀斧、改革、执行'], ['辛', '阴金', '珠玉、精细、标准'],
  ['壬', '阳水', '江海、流动、连接'], ['癸', '阴水', '雨露、渗透、洞察'],
];

export const branchQuickReference = [
  ['子', '水', '癸', '冬·仲月'], ['丑', '土', '己癸辛', '冬·季月'],
  ['寅', '木', '甲丙戊', '春·孟月'], ['卯', '木', '乙', '春·仲月'], ['辰', '土', '戊乙癸', '春·季月'],
  ['巳', '火', '丙庚戊', '夏·孟月'], ['午', '火', '丁己', '夏·仲月'], ['未', '土', '己丁乙', '夏·季月'],
  ['申', '金', '庚壬戊', '秋·孟月'], ['酉', '金', '辛', '秋·仲月'], ['戌', '土', '戊辛丁', '秋·季月'],
  ['亥', '水', '壬甲', '冬·孟月'],
];

export const tenGodQuickReference = [
  ['比肩', '同五行、同阴阳', '自我、同辈、自主、竞争'],
  ['劫财', '同五行、异阴阳', '伙伴、争夺、行动、分配'],
  ['食神', '我生、同阴阳', '稳定输出、作品、体验、口碑'],
  ['伤官', '我生、异阴阳', '表达、创新、质疑、改革'],
  ['偏财', '我克、同阴阳', '项目、机会、资源、人脉'],
  ['正财', '我克、异阴阳', '收入、经营、责任、兑现'],
  ['七杀', '克我、同阴阳', '压力、竞争、突破、风险'],
  ['正官', '克我、异阴阳', '规则、职位、名分、责任'],
  ['偏印', '生我、同阴阳', '研究、洞察、非标、独立'],
  ['正印', '生我、异阴阳', '学习、资质、支持、系统'],
];
