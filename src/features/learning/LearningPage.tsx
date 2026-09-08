import { useEffect, useRef, useState } from 'react';
import { downloadBook, loadBook, loadChapter, removeBookDownload, searchClassicText } from '../../adapters/classicRepository';
import {
  readProfileValue,
  writeProfileValue
} from '../../auth';
import type { AppLocale, LearningLocalizers } from '../../i18n';
import { loadTraditionalLocalizers, localizeReactTree, readLearningLocale, writeLearningLocale } from '../../i18n';
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  Bookmark,
  CheckCircle2,
  Download,
  FileText,
  GraduationCap,
  Languages,
  LibraryBig,
  MessageSquare,
  RefreshCw,
  RotateCcw,
  Search,
  Sparkles,
  Trash2
} from '../../icons';
import type { ClassicBook, ClassicChapter, KnowledgeModule } from '../../knowledge';
import { navigate, readRoute } from '../../navigation';

export type LearningView = 'paths' | 'review' | 'curriculum' | 'cases' | 'practice' | 'glossary' | 'classics' | 'reference';
export type ClassicLibraryMode = 'shelf' | 'reader' | 'excerpts';
export type QuizAttempt = { selected: number; correct: boolean };
export type PracticeFilter = '全部' | '未作答' | '错题';

export function getClassicRelatedModules(knowledgeModules: KnowledgeModule[], bookId: string, chapterTitle: string) {
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

export type KnowledgeData = typeof import('../../knowledge');
export type LearningPageProps = { onBack: () => void; onGoBazi: () => void; onYijing: () => void };

export function LearningPage(props: LearningPageProps) {
  const [knowledgeData, setKnowledgeData] = useState<KnowledgeData | null>(null);
  const [loadError, setLoadError] = useState('');

  useEffect(() => {
    let active = true;
    import('../../knowledge')
      .then((data) => { if (active) setKnowledgeData(data); })
      .catch(() => { if (active) setLoadError('知识库载入失败，请检查网络后重试。'); });
    return () => { active = false; };
  }, []);

  if (!knowledgeData) {
    return <main className="knowledge-shell"><div className="flow-topbar"><button className="icon-text-button" onClick={props.onBack} type="button"><ArrowLeft size={17} />返回</button></div><section className="empty-knowledge knowledge-loading"><LibraryBig size={28} /><strong>{loadError || '正在载入命理学堂…'}</strong>{loadError && <button className="secondary-button" onClick={() => window.location.reload()} type="button"><RefreshCw size={16} />重新载入</button>}</section></main>;
  }

  return <LearningPageContent {...props} knowledgeData={knowledgeData} />;
}

export function LearningPageContent({ onBack, onGoBazi, onYijing, knowledgeData }: LearningPageProps & { knowledgeData: KnowledgeData }) {
  const {
    branchQuickReference,
    classicExcerpts,
    classicShelf,
    knowledgeCases,
    knowledgeModules,
    knowledgeQuizQuestions,
    knowledgeTerms,
    learningPaths,
    relationQuickReference,
    seasonQuickReference,
    stemQuickReference,
    tenGodQuickReference,
  } = knowledgeData;
  const [learningLocale, setLearningLocale] = useState<AppLocale>(() => readLearningLocale());
  const [learningLocalizers, setLearningLocalizers] = useState<LearningLocalizers | null>(null);
  const [localeLoading, setLocaleLoading] = useState(false);
  const [view, setView] = useState<LearningView>('paths');
  const [activeModuleId, setActiveModuleId] = useState(knowledgeModules[0].id);
  const [query, setQuery] = useState('');
  const [fullTextResults, setFullTextResults] = useState<Awaited<ReturnType<typeof searchClassicText>>>([]);
  const [searchStatus, setSearchStatus] = useState('');
  useEffect(() => {
    let active = true;
    setFullTextResults([]);
    if (view !== 'classics' || query.trim().length < 2) { setSearchStatus(''); return; }
    const timer = window.setTimeout(() => {
      setSearchStatus('正在检索原文…');
      void searchClassicText(query).then(results => { if (active) { setFullTextResults(results); setSearchStatus(results.length ? `原文结果 ${results.length} 条（最多显示 30 条）` : '没有匹配的原文'); } }).catch(() => { if (active) setSearchStatus('全文索引暂不可用，请联网后重试'); });
    }, 300);
    return () => { active = false; window.clearTimeout(timer); };
  }, [view, query]);
  const [activeBook, setActiveBook] = useState('全部');
  const [classicMode, setClassicMode] = useState<ClassicLibraryMode>('shelf');
  const [classicBook, setClassicBook] = useState<ClassicBook | null>(null);
  const [classicLoading, setClassicLoading] = useState(false);
  const [chapterLoading, setChapterLoading] = useState(false);
  const [downloadStatus, setDownloadStatus] = useState('');
  const [downloading, setDownloading] = useState(false);
  const bookRequest = useRef(0);
  const appliedRoute = useRef('');
  const bookAbort = useRef<AbortController | null>(null);
  const downloadAbort = useRef<AbortController | null>(null);
  useEffect(() => () => { bookAbort.current?.abort(); downloadAbort.current?.abort(); }, []);
  const [activeChapterData, setActiveChapterData] = useState<ClassicChapter | null>(null);
  const [classicError, setClassicError] = useState('');
  const [activeChapterId, setActiveChapterId] = useState('01');
  const [readerLayer, setReaderLayer] = useState<'all' | 'original' | 'guide'>('all');
  const [termCategory, setTermCategory] = useState('全部');
  const [practiceCategory, setPracticeCategory] = useState('全部');
  const [practiceFilter, setPracticeFilter] = useState<PracticeFilter>('全部');
  const [caseTheme, setCaseTheme] = useState('全部');
  const [activeCaseId, setActiveCaseId] = useState(knowledgeCases[0].id);
  const [activeQuizId, setActiveQuizId] = useState(knowledgeQuizQuestions[0].id);
  const [selectedQuizAnswer, setSelectedQuizAnswer] = useState<number | null>(null);
  const [quizAttempts, setQuizAttempts] = useState<Record<string, QuizAttempt>>(() => readProfileValue('shanyi-quiz-attempts', {}));
  const [classicBookmarks, setClassicBookmarks] = useState<string[]>(() => readProfileValue('shanyi-classic-bookmarks', []));
  const [classicReadingPositions, setClassicReadingPositions] = useState<Record<string, string>>(() => readProfileValue('shanyi-classic-positions', {}));
  const chapterLoadRequest = useRef(0);
  const [completedLessons, setCompletedLessons] = useState<string[]>(() => readProfileValue('shanyi-learning-progress', []));

  useEffect(() => {
    let active = true;
    const previousLang = document.documentElement.lang;
    document.documentElement.lang = learningLocale;
    writeLearningLocale(learningLocale);
    if (learningLocale === 'zh-CN') {
      setLearningLocalizers(null);
      setLocaleLoading(false);
    } else {
      setLocaleLoading(true);
      loadTraditionalLocalizers()
        .then((localizers) => { if (active) setLearningLocalizers(localizers); })
        .finally(() => { if (active) setLocaleLoading(false); });
    }
    return () => {
      active = false;
      document.documentElement.lang = previousLang || 'zh-CN';
    };
  }, [learningLocale]);

  const totalLessons = knowledgeModules.reduce((sum, module) => sum + module.lessons.length, 0);
  const completedCount = completedLessons.filter((id) => knowledgeModules.some((module) => module.lessons.some((lesson) => lesson.id === id))).length;
  const progress = Math.round((completedCount / totalLessons) * 100);
  const normalizedQuery = (learningLocalizers?.normalizeSearch(query.trim()) ?? query.trim()).toLowerCase();
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
  const caseThemes = ['全部', ...new Set(knowledgeCases.map((item) => item.theme))];
  const filteredCases = knowledgeCases.filter((item) => {
    const matchesTheme = caseTheme === '全部' || item.theme === caseTheme;
    const matchesQuery = !normalizedQuery || [item.title, item.theme, item.pillars, item.brief, item.task, item.conclusion, item.commonMistake, ...item.steps.flatMap((step) => [step.title, step.analysis, ...step.evidence])]
      .join(' ')
      .toLowerCase()
      .includes(normalizedQuery);
    return matchesTheme && matchesQuery;
  });
  const activeCase = filteredCases.find((item) => item.id === activeCaseId) ?? filteredCases[0];
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
  const reviewLessons = knowledgeModules.flatMap((module) => module.lessons.map((lesson) => ({ module, lesson })))
    .filter(({ lesson }) => !completedLessons.includes(lesson.id))
    .slice(0, 4);
  const reviewQuestions = knowledgeQuizQuestions
    .filter((question) => quizAttempts[question.id] && !quizAttempts[question.id].correct)
    .slice(0, 4);
  const reviewBookmarks = classicBookmarks.slice(-4).reverse().map((key) => {
    const [bookId, chapterId] = key.split(':');
    const book = classicShelf.find((item) => item.id === bookId);
    return book ? { book, chapterId } : null;
  }).filter((item): item is NonNullable<typeof item> => Boolean(item));
  const activeChapter = classicBook?.chapters.find((chapter) => chapter.id === activeChapterId) ?? classicBook?.chapters[0];
  const chapterIndex = activeChapter ? classicBook?.chapters.findIndex((chapter) => chapter.id === activeChapter.id) ?? 0 : 0;
  const filteredChapters = classicBook?.chapters.filter((chapter) => !normalizedQuery || [chapter.title, chapter.guide].join(' ').toLowerCase().includes(normalizedQuery)) ?? [];
  const relatedModules = activeChapter && classicBook ? getClassicRelatedModules(knowledgeModules, classicBook.id, activeChapter.title) : [];
  const activeBookmarkKey = classicBook && activeChapter ? `${classicBook.id}:${activeChapter.id}` : '';

  const loadClassicChapter = async (book: ClassicBook, chapterId: string) => {
    const chapter = book.chapters.find((item) => item.id === chapterId);
    if (!chapter) return;
    const requestId = ++chapterLoadRequest.current;
    setChapterLoading(true);
    setClassicError('');
    try {
      const data = await loadChapter(book, chapter.id, bookAbort.current?.signal);
      if (requestId !== chapterLoadRequest.current) return;
      setActiveChapterData(data);
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
      void writeProfileValue('shanyi-classic-positions', next);
      return next;
    });
    void loadClassicChapter(book, chapterId);
    const path = `/learn/classics/${book.id}/${chapterId}`;
    appliedRoute.current = path;
    navigate(path);
  };

  const openClassicBook = async (bookId: string, targetChapterId?: string) => {
    const meta = classicShelf.find((book) => book.id === bookId);
    if (!meta || !('path' in meta)) return;
    const requestId = ++bookRequest.current;
    chapterLoadRequest.current++;
    bookAbort.current?.abort();
    bookAbort.current = new AbortController();
    setActiveChapterData(null);
    setClassicMode('reader');
    setClassicLoading(true);
    setClassicError('');
    setQuery('');
    try {
      const requestedEdition = readRoute().parts[2] === bookId ? readRoute().query.get('edition') : null;
      const book = await loadBook(requestedEdition && /^[a-f0-9]{20}$/.test(requestedEdition) ? meta.path.replace('index.json', `index.${requestedEdition}.json`) : meta.path, bookAbort.current.signal);
      if (requestId !== bookRequest.current) return;
      setClassicBook(book);
      const rememberedChapterId = classicReadingPositions[book.id];
      const requestedChapterId = targetChapterId ?? rememberedChapterId;
      const firstChapterId = requestedChapterId && book.chapters.some((chapter) => chapter.id === requestedChapterId) ? requestedChapterId : book.chapters[0]?.id ?? '01';
      setActiveChapterId(firstChapterId);
      setActiveChapterData(null);
      setClassicReadingPositions((current) => {
        const next = { ...current, [book.id]: firstChapterId };
        void writeProfileValue('shanyi-classic-positions', next);
        return next;
      });
      void loadClassicChapter(book, firstChapterId);
      const path = `/learn/classics/${book.id}/${firstChapterId}`;
      if (!window.location.hash.startsWith(`#${path}`)) { appliedRoute.current = path; navigate(path); }
    } catch (error) {
      if (requestId === bookRequest.current) setClassicError(error instanceof Error ? error.message : '古籍载入失败');
    } finally {
      if (requestId === bookRequest.current) setClassicLoading(false);
    }
  };

  useEffect(() => {
    const restore = () => {
      const raw = window.location.hash.slice(1);
      if (raw === appliedRoute.current) return;
      appliedRoute.current = raw;
      const route = readRoute();
      if (route.page !== 'learning') return;
      if (route.parts[1] === 'classics' && route.parts[2]) { setView('classics'); void openClassicBook(route.parts[2], route.parts[3]); }
      else if (['paths', 'review', 'curriculum', 'cases', 'practice', 'glossary', 'classics', 'reference'].includes(route.parts[1])) setView(route.parts[1] as LearningView);
      else setView('paths');
    };
    restore(); window.addEventListener('hashchange', restore);
    return () => window.removeEventListener('hashchange', restore);
  }, []);
  useEffect(() => {
    const passage = readRoute().query.get('passage');
    if (passage && activeChapterData) document.getElementById(passage)?.scrollIntoView({ block: 'center' });
  }, [activeChapterData]);

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
      void writeProfileValue('shanyi-learning-progress', next);
      return next;
    });
  };

  const toggleClassicBookmark = () => {
    if (!activeBookmarkKey) return;
    setClassicBookmarks((current) => {
      const next = current.includes(activeBookmarkKey) ? current.filter((key) => key !== activeBookmarkKey) : [...current, activeBookmarkKey];
      void writeProfileValue('shanyi-classic-bookmarks', next);
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
      void writeProfileValue('shanyi-quiz-attempts', next);
      return next;
    });
  };

  const retryQuizQuestion = () => {
    if (!activeQuizQuestion) return;
    setQuizAttempts((current) => {
      const next = { ...current };
      delete next[activeQuizQuestion.id];
      void writeProfileValue('shanyi-quiz-attempts', next);
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

  const switchLearningView = (nextView: LearningView) => {
    appliedRoute.current = `/learn/${nextView}`;
    navigate(appliedRoute.current);
    setView(nextView);
    setQuery('');
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

  const page = (
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
          <label className="learning-locale-select">
            <Languages size={16} />
            <select aria-label="学堂显示语言" disabled={localeLoading} onChange={(event) => setLearningLocale(event.target.value as AppLocale)} value={learningLocale}>
              <option value="zh-CN">简体中文</option>
              <option value="zh-TW">繁體中文</option>
            </select>
          </label>
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
          <button aria-selected={view === 'paths'} className={view === 'paths' ? 'active' : ''} onClick={() => switchLearningView('paths')} role="tab" type="button">
            <GraduationCap size={17} /> 学习路线
          </button>
          <button aria-selected={view === 'review'} className={view === 'review' ? 'active' : ''} onClick={() => switchLearningView('review')} role="tab" type="button">
            <RotateCcw size={17} /> 今日复习
          </button>
          <button aria-selected={view === 'curriculum'} className={view === 'curriculum' ? 'active' : ''} onClick={() => switchLearningView('curriculum')} role="tab" type="button">
            <BookOpen size={17} /> 课程体系
          </button>
          <button aria-selected={view === 'cases'} className={view === 'cases' ? 'active' : ''} onClick={() => switchLearningView('cases')} role="tab" type="button">
            <MessageSquare size={17} /> 案例研习
          </button>
          <button aria-selected={view === 'practice'} className={view === 'practice' ? 'active' : ''} onClick={() => switchLearningView('practice')} role="tab" type="button">
            <CheckCircle2 size={17} /> 练习复盘
          </button>
          <button aria-selected={view === 'glossary'} className={view === 'glossary' ? 'active' : ''} onClick={() => switchLearningView('glossary')} role="tab" type="button">
            <FileText size={17} /> 术语词典
          </button>
          <button aria-selected={view === 'classics'} className={view === 'classics' ? 'active' : ''} onClick={() => switchLearningView('classics')} role="tab" type="button">
            <LibraryBig size={17} /> 古籍研读
          </button>
          <button aria-selected={view === 'reference'} className={view === 'reference' ? 'active' : ''} onClick={() => switchLearningView('reference')} role="tab" type="button">
            <Search size={17} /> 基础速查
          </button>
        </div>
        {view !== 'paths' && view !== 'review' && view !== 'practice' && view !== 'reference' && <label className="knowledge-search">
          <Search size={17} />
          <input aria-label="搜索知识库" onChange={(event) => setQuery(event.target.value)} placeholder={view === 'classics' ? '搜索古籍原文（至少两个字）' : '搜索天干、调候、案例或古籍篇名'} value={query} />
        </label>}
      </section>

      {view === 'classics' && query.trim().length >= 2 && <section className="classic-search-results"><p role="status">{searchStatus}</p>{fullTextResults.map(result => <article key={`${result.bookId}-${result.passageId}`}><a href={`#/learn/classics/${result.bookId}/${result.chapterId}?passage=${result.passageId}&edition=${result.version}`}>{classicShelf.find(book => book.id === result.bookId)?.title} · {result.chapterTitle}</a><p>{result.text.slice(Math.max(0, result.normalized.indexOf(normalizedQuery) - 40), Math.max(0, result.normalized.indexOf(normalizedQuery) - 40) + 200)}</p></article>)}</section>}

      {view === 'paths' && (
        <section className="learning-path-library">
          <div className="learning-overview">
            <div><strong>{knowledgeModules.length}</strong><span>课程章节</span></div>
            <div><strong>{totalLessons}</strong><span>核心课节</span></div>
            <div><strong>{knowledgeTerms.length}</strong><span>术语词条</span></div>
            <div><strong>{knowledgeQuizQuestions.length}</strong><span>分层练习</span></div>
            <div><strong>{knowledgeCases.length}</strong><span>实盘案例</span></div>
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

      {view === 'review' && (
        <section className="review-library">
          <div className="review-summary">
            <div><span>未学课程</span><strong>{totalLessons - completedCount}</strong><small>按课程顺序补齐</small></div>
            <div><span>错题待复盘</span><strong>{wrongQuizCount}</strong><small>先回知识点再重做</small></div>
            <div><span>古籍书签</span><strong>{classicBookmarks.length}</strong><small>继续上次精读</small></div>
          </div>
          <div className="review-method">
            <div><span>建议节奏</span><h2>一次复习只解决一个判断问题</h2></div>
            <ol>
              <li><strong>回忆</strong><span>先不看答案，用一句话写出规则。</span></li>
              <li><strong>核对</strong><span>回到课程或原典，找出遗漏的成立条件。</span></li>
              <li><strong>迁移</strong><span>换一个盘例，说明规则何时不成立。</span></li>
            </ol>
          </div>
          <div className="review-columns">
            <article className="review-queue">
              <header><div><span>继续课程</span><h2>下一组知识点</h2></div><small>{reviewLessons.length} 项</small></header>
              <div>
                {reviewLessons.map(({ module, lesson }) => (
                  <button key={lesson.id} onClick={() => { setActiveModuleId(module.id); setQuery(''); setView('curriculum'); }} type="button">
                    <span>{String(module.order).padStart(2, '0')}</span>
                    <div><strong>{lesson.title}</strong><small>{module.title} · {module.level}</small></div>
                    <ArrowRight size={15} />
                  </button>
                ))}
                {!reviewLessons.length && <p className="review-empty">全部课程已标记完成，可以进入案例研习检验掌握程度。</p>}
              </div>
            </article>
            <article className="review-queue">
              <header><div><span>错题回炉</span><h2>需要重新判断</h2></div><small>{reviewQuestions.length} 项</small></header>
              <div>
                {reviewQuestions.map((question) => (
                  <button key={question.id} onClick={() => { setPracticeCategory('全部'); setPracticeFilter('错题'); chooseQuizQuestion(question.id); setView('practice'); }} type="button">
                    <span>{question.category.slice(0, 1)}</span>
                    <div><strong>{question.prompt}</strong><small>{question.level} · 回到对应课程后再答</small></div>
                    <RotateCcw size={15} />
                  </button>
                ))}
                {!reviewQuestions.length && <p className="review-empty">目前没有错题。继续完成练习，系统会自动把答错的题放到这里。</p>}
              </div>
            </article>
            <article className="review-queue">
              <header><div><span>原典书签</span><h2>继续精读</h2></div><small>{reviewBookmarks.length} 项</small></header>
              <div>
                {reviewBookmarks.map(({ book, chapterId }) => (
                  <button key={`${book.id}:${chapterId}`} onClick={() => { setView('classics'); void openClassicBook(book.id, chapterId); }} type="button">
                    <span>{book.title.slice(0, 1)}</span>
                    <div><strong>{book.title} · 第 {Number(chapterId)} 篇</strong><small>从书签位置继续阅读</small></div>
                    <Bookmark size={15} />
                  </button>
                ))}
                {!reviewBookmarks.length && <p className="review-empty">精读古籍时点击书签，重点篇章会出现在这里。</p>}
              </div>
            </article>
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

      {view === 'cases' && (
        <section className="case-library">
          <div className="glossary-filter" aria-label="案例主题">
            {caseThemes.map((theme) => <button className={caseTheme === theme ? 'active' : ''} key={theme} onClick={() => { setCaseTheme(theme); setActiveCaseId(''); }} type="button">{theme}</button>)}
          </div>
          <div className="knowledge-section-head">
            <div><span>教学盘例</span><h2>{normalizedQuery ? `找到 ${filteredCases.length} 个案例` : `${caseTheme} · ${filteredCases.length} 个案例`}</h2></div>
            <p>每个案例都保留证据、暂定结论和反证条件，训练推理过程，不背成固定断语。</p>
          </div>
          {activeCase ? (
            <div className="case-layout">
              <aside className="case-index">
                {filteredCases.map((item, index) => (
                  <button className={activeCase.id === item.id ? 'active' : ''} key={item.id} onClick={() => setActiveCaseId(item.id)} type="button">
                    <span>{String(index + 1).padStart(2, '0')}</span>
                    <div><strong>{item.title}</strong><small>{item.theme} · {item.level}</small></div>
                  </button>
                ))}
              </aside>
              <article className="case-study">
                <header>
                  <div><span>{activeCase.theme} · {activeCase.level}</span><small>案例仅供方法训练</small></div>
                  <h2>{activeCase.title}</h2>
                  <p className="case-pillars">{activeCase.pillars}</p>
                  <p>{activeCase.brief}</p>
                </header>
                <div className="case-task"><strong>先做再看</strong><p>{activeCase.task}</p></div>
                <div className="case-steps">
                  {activeCase.steps.map((step) => (
                    <section key={step.label}>
                      <span>{step.label}</span>
                      <div><h3>{step.title}</h3><p>{step.analysis}</p><ul>{step.evidence.map((item) => <li key={item}>{item}</li>)}</ul></div>
                    </section>
                  ))}
                </div>
                <div className="case-conclusion-grid">
                  <div><span>暂定结论</span><p>{activeCase.conclusion}</p></div>
                  <div><span>反证条件</span><p>{activeCase.counterEvidence}</p></div>
                  <div><span>常见误判</span><p>{activeCase.commonMistake}</p></div>
                </div>
                <footer>
                  <strong>关联学习</strong>
                  <div>{activeCase.moduleIds.map((moduleId) => {
                    const module = knowledgeModules.find((item) => item.id === moduleId);
                    return module ? <button key={module.id} onClick={() => { setActiveModuleId(module.id); setQuery(''); setView('curriculum'); }} type="button">{module.title}<ArrowRight size={13} /></button> : null;
                  })}</div>
                  {activeCase.classicRef && <button onClick={() => { setQuery(''); setView('classics'); void openClassicBook(activeCase.classicRef!.bookId, activeCase.classicRef!.chapterId); }} type="button">原典关联 · {activeCase.classicRef.label}<BookOpen size={14} /></button>}
                </footer>
              </article>
            </div>
          ) : <div className="empty-knowledge">没有匹配的案例，请更换关键词或主题。</div>}
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
                      <span>{book.dynasty} · {book.chapterCount} {('unit' in book && book.unit) || (book.id === 'lixu' ? '卷' : '篇')}</span>
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
                    <div><span>{classicBook.dynasty} · 全 {classicBook.chapterCount} {classicBook.unit ?? '篇'}</span><h2>{classicBook.title}</h2><p>{classicBook.attribution}</p></div>
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
                            <section id={block.id} className={block.heading === '命式示例' ? 'example-block' : ''} key={block.id ?? `${activeChapter.id}-${index}`}>
                              {block.heading && block.heading !== '命式示例' && <h3>{block.heading}</h3>}
                              {block.heading === '命式示例' ? (
                                <div className="classic-example-chart"><span>命式示例</span><p>{block.original}</p></div>
                              ) : (
                                <div className="original-text">{index === 0 && <span>原典正文</span>}<blockquote>{block.original}</blockquote></div>
                              )}
                              {readerLayer === 'all' && block.commentary && <div className="old-commentary"><span>底本旧注</span>{block.commentary.split('\n').map((line) => <p key={line}>{line}</p>)}</div>}
                              {readerLayer === 'all' && block.translation && <div className="old-commentary"><span>现代译文 · {block.translation.author} · {block.translation.status === 'reviewed' ? '已校订' : '待校订'}</span><p>{block.translation.text}</p></div>}
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
                      <button type="button" className="icon-text-button" disabled={downloading} onClick={async () => {
                        setDownloading(true); downloadAbort.current = new AbortController();
                        try { await downloadBook(classicBook, (done, total) => setDownloadStatus(`已下载 ${done}/${total} 篇`), downloadAbort.current.signal); setDownloadStatus('全书已可离线阅读'); }
                        catch (error) { setDownloadStatus(error instanceof Error ? error.message : '下载失败'); }
                        finally { setDownloading(false); }
                      }}><Download size={16} />下载全书</button>
                      {downloading && <button type="button" className="icon-text-button" onClick={() => downloadAbort.current?.abort()}>取消下载</button>}
                      <button type="button" className="icon-text-button" disabled={downloading} onClick={async () => { await removeBookDownload(classicBook); setDownloadStatus('已删除本书离线内容'); }}><Trash2 size={16} />删除下载</button>
                      <p role="status">{downloadStatus}</p>
                      <strong>版本说明</strong>
                      <p>{classicBook.editionNote}</p>
                      <dl><dt>底本</dt><dd>{classicBook.sourceLabel}</dd><dt>来源修订</dt><dd>{classicBook.sourceRevision || '来源页未提供'}{classicBook.sourceUpdatedAt ? ` · ${classicBook.sourceUpdatedAt}` : ''}</dd><dt>整理日期</dt><dd>{classicBook.updatedAt}</dd><dt>收录状态</dt><dd>{classicBook.status} · {classicBook.chapterCount} {classicBook.unit ?? '篇'}</dd><dt>加载方式</dt><dd>本地分篇 · 已读缓存</dd></dl>
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
          <article>
            <div className="knowledge-section-head"><div><span>以节气为界</span><h2>十二月令气候速查</h2></div><p>气候判断只是第一层，仍须用全局火水、湿燥土与根源修正。</p></div>
            <div className="reference-table-wrap"><table><thead><tr><th>月令</th><th>节气范围</th><th>气候底色</th><th>判断重点</th></tr></thead><tbody>{seasonQuickReference.map((row) => <tr key={row[0]}>{row.map((cell) => <td key={cell}>{cell}</td>)}</tr>)}</tbody></table></div>
          </article>
          <article>
            <div className="knowledge-section-head"><div><span>先定成立，再论结果</span><h2>干支关系速查</h2></div><p>合冲刑害是作用方式，不是固定吉凶；必须结合月令、强弱、宫位和岁运。</p></div>
            <div className="reference-table-wrap"><table><thead><tr><th>关系</th><th>组合</th><th>使用提醒</th></tr></thead><tbody>{relationQuickReference.map((row) => <tr key={row[0]}>{row.map((cell) => <td key={cell}>{cell}</td>)}</tr>)}</tbody></table></div>
          </article>
        </section>
      )}

      <p className="disclaimer">知识库用于传统文化学习与结构化思考，不应替代医学、法律、财务或其他专业意见。</p>
    </main>
  );
  return learningLocalizers ? localizeReactTree(page, learningLocalizers.display) : page;
}
