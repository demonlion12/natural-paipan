import type { FormEvent, MouseEvent as ReactMouseEvent, ReactNode, RefObject } from 'react';
import { lazy, Suspense, useEffect, useRef, useState } from 'react';
import type { AccountProfile } from './auth';
import {
  deleteActiveAccount,
  loginLocalAccount,
  logoutLocalAccount,
  registerLocalAccount
} from './auth';
import type { BaziReading, BirthInput } from './core/types';
import { ErrorBoundary as PageBoundary } from './ErrorBoundary';
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  CalendarDays,
  CheckCircle2,
  Clock3,
  Download,
  Eye,
  EyeOff,
  GraduationCap,
  LockKeyhole,
  LogIn,
  LogOut,
  MapPin,
  MessageSquare,
  RefreshCw,
  RotateCcw,
  ShieldCheck,
  Sparkles,
  Trash2,
  UserPlus,
  UserRound,
  X
} from './icons';
import { birthLocations, findBirthLocation } from './locationData';
import { navigate, readRoute, usePageRoute } from './navigation';
import type { ArchiveRecord } from './operations';
import {
  archiveRepository,
  clearLocalProductData,
  exportLocalProductData,
  getPrivacyPreferences,
  POLICY_VERSION,
  savePrivacyPreferences,
  submitFeedback,
  trackEvent,
} from './operations';

import { AppStep, createReadingSafely, initialInput, NavTarget, PolicyView } from './appConfig';
const TopProfile = lazy(() => import('./features/report/ReportSections').then(module => ({ default: module.TopProfile })));
const AncientReference = lazy(() => import('./features/report/ReportSections').then(module => ({ default: module.AncientReference })));
const PaipanSection = lazy(() => import('./features/report/ReportSections').then(module => ({ default: module.PaipanSection })));
const ProfessionalChartPanel = lazy(() => import('./features/report/ReportSections').then(module => ({ default: module.ProfessionalChartPanel })));
const UsefulAndTiaohouPanel = lazy(() => import('./features/report/ReportSections').then(module => ({ default: module.UsefulAndTiaohouPanel })));
const SmartPillarDiagram = lazy(() => import('./features/report/ReportSections').then(module => ({ default: module.SmartPillarDiagram })));
const PortraitSection = lazy(() => import('./features/report/ReportSections').then(module => ({ default: module.PortraitSection })));
const DeepDivePanel = lazy(() => import('./features/report/ReportSections').then(module => ({ default: module.DeepDivePanel })));
const LuckIntegratedPanel = lazy(() => import('./features/report/ReportSections').then(module => ({ default: module.LuckIntegratedPanel })));
const LearningPage = lazy(() => import('./features/learning/LearningPage').then(module => ({ default: module.LearningPage })));
const YijingPage = lazy(() => import('./features/yijing/YijingPage').then(module => ({ default: module.YijingPage })));
function Toast({ message, onDismiss }: { message: string; onDismiss: () => void }) {
  if (!message) return null;
  return (
    <div aria-atomic="true" aria-live="polite" className="toast" role="status">
      <CheckCircle2 size={17} />
      <span>{message}</span>
      <button aria-label="关闭提示" onClick={onDismiss} title="关闭提示" type="button"><X size={15} /></button>
    </div>
  );
}

function useDialogLifecycle(onClose: () => void) {
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    const previousFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const previousOverflow = document.body.style.overflow;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onCloseRef.current();
    };
    document.body.style.overflow = 'hidden';
    document.addEventListener('keydown', handleKeyDown);
    const frame = window.requestAnimationFrame(() => closeButtonRef.current?.focus());
    return () => {
      window.cancelAnimationFrame(frame);
      document.body.style.overflow = previousOverflow;
      document.removeEventListener('keydown', handleKeyDown);
      previousFocus?.focus();
    };
  }, []);

  const closeFromBackdrop = (event: ReactMouseEvent<HTMLDivElement>) => {
    if (event.target === event.currentTarget) onCloseRef.current();
  };

  return { closeButtonRef, closeFromBackdrop };
}

function HomePage({
  account,
  archives,
  onBazi,
  onDeleteArchive,
  onLearning,
  onLogout,
  onOpenArchive,
  onYijing,
}: {
  account: AccountProfile | null;
  archives: ArchiveRecord[];
  onBazi: () => void;
  onDeleteArchive: (id: string) => void;
  onLearning: () => void;
  onLogout: () => void;
  onOpenArchive: (archive: ArchiveRecord) => void;
  onYijing: () => void;
}) {
  const [pendingDeleteId, setPendingDeleteId] = useState<string>();
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
          <span>{account ? `本机加密账号 · @${account.username}` : '游客模式 · 不保存数据'}</span>
          <strong>{account?.displayName || '游客'}</strong>
          <button aria-label={account ? '退出登录' : '返回登录页'} onClick={onLogout} title={account ? '退出登录' : '返回登录页'} type="button">
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

        <section className="archive-section">
          <div className="section-title"><div><span>{account ? '当前账号加密保存' : '游客模式不保存'}</span><h2>本机命盘档案</h2></div><strong>{archives.length}/30</strong></div>
          {archives.length ? <div className="archive-grid">{archives.map((archive) => (
            <article key={archive.id}>
              <button className="archive-open" onClick={() => onOpenArchive(archive)} type="button">
                <span>{archive.input.name || '未命名'}</span>
                <strong>{archive.pillars}</strong>
                <small>{archive.input.birthDate} · {archive.input.birthTime} · {archive.input.birthplace}</small>
              </button>
              <button aria-label={`删除${archive.input.name || '未命名'}档案`} className="archive-delete" onClick={() => setPendingDeleteId(archive.id)} title="删除本机档案" type="button"><Trash2 size={16} /></button>
              {pendingDeleteId === archive.id && <div aria-label={`确认删除${archive.input.name || '未命名'}档案`} className="archive-delete-confirm" role="alertdialog">
                <strong>删除这份档案？</strong>
                <span>删除后无法恢复。</span>
                <div>
                  <button onClick={() => setPendingDeleteId(undefined)} type="button">取消</button>
                  <button className="confirm" onClick={() => { onDeleteArchive(archive.id); setPendingDeleteId(undefined); }} type="button">确认删除</button>
                </div>
              </div>}
            </article>
          ))}</div> : <div className="archive-empty"><strong>{account ? '还没有保存命盘' : '游客数据不会落盘'}</strong><p>{account ? '生成第一份排盘后会加密保存在当前账号，不会上传出生资料。' : '可以完整体验排盘、学堂和起卦；注册或登录后才会保存个人记录。'}</p></div>}
        </section>
      </section>

    </main>
  );
}

function LoginPage({
  analyticsEnabled,
  consentAccepted,
  onAnalyticsChange,
  onConsentChange,
  onLogin,
  onRegister,
  onGuest,
  onOpenPolicy,
}: {
  analyticsEnabled: boolean;
  consentAccepted: boolean;
  onAnalyticsChange: (value: boolean) => void;
  onConsentChange: (value: boolean) => void;
  onLogin: (username: string, password: string) => Promise<void>;
  onRegister: (input: { username: string; displayName: string; password: string }) => Promise<void>;
  onGuest: () => void;
  onOpenPolicy: (view: PolicyView) => void;
}) {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [username, setUsername] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [capsLockOn, setCapsLockOn] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');
    if (mode === 'register' && password !== confirmPassword) {
      setError('两次输入的密码不一致。');
      return;
    }
    setSubmitting(true);
    try {
      if (mode === 'login') await onLogin(username, password);
      else await onRegister({ username, displayName, password });
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : '操作失败，请稍后重试。');
    } finally {
      setSubmitting(false);
    }
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
          <div className="local-mode-label"><ShieldCheck size={17} /><span>本机加密账号</span></div>
          <div className="auth-heading">
            <h2>{mode === 'login' ? '登录山易排盘' : '注册本机账号'}</h2>
            <p>{mode === 'login' ? '解锁你的命盘档案和学习记录。' : '建立独立加密空间，与同一浏览器内的其他账号隔离。'}</p>
          </div>
          <div className="auth-mode-switch" aria-label="账号操作">
            <button aria-pressed={mode === 'login'} className={mode === 'login' ? 'active' : ''} onClick={() => { setMode('login'); setError(''); }} type="button"><LogIn size={16} />登录</button>
            <button aria-pressed={mode === 'register'} className={mode === 'register' ? 'active' : ''} onClick={() => { setMode('register'); setError(''); }} type="button"><UserPlus size={16} />注册</button>
          </div>
          <label>
            <span>
              <UserRound size={15} /> 账号
            </span>
            <input
              autoFocus
              autoCapitalize="none"
              autoComplete="username"
              maxLength={24}
              name="username"
              onChange={(event) => setUsername(event.target.value)}
              placeholder="3–24 位中文、字母或数字"
              required
              value={username}
            />
          </label>
          {mode === 'register' && <label>
            <span><UserRound size={15} /> 显示名称</span>
            <input autoComplete="nickname" maxLength={24} name="displayName" onChange={(event) => setDisplayName(event.target.value)} placeholder="用于工作台显示" required value={displayName} />
          </label>}
          <label>
            <span><LockKeyhole size={15} /> 密码</span>
            <div className="password-field">
              <input autoComplete={mode === 'login' ? 'current-password' : 'new-password'} maxLength={72} minLength={8} name="password" onChange={(event) => setPassword(event.target.value)} onKeyDown={(event) => setCapsLockOn(event.getModifierState('CapsLock'))} onKeyUp={(event) => setCapsLockOn(event.getModifierState('CapsLock'))} placeholder="至少 8 个字符" required type={passwordVisible ? 'text' : 'password'} value={password} />
              <button aria-label={passwordVisible ? '隐藏密码' : '显示密码'} onClick={() => setPasswordVisible((value) => !value)} title={passwordVisible ? '隐藏密码' : '显示密码'} type="button">{passwordVisible ? <EyeOff size={18} /> : <Eye size={18} />}</button>
            </div>
          </label>
          {mode === 'register' && <label>
            <span><LockKeyhole size={15} /> 确认密码</span>
            <div className="password-field">
              <input autoComplete="new-password" maxLength={72} minLength={8} name="confirmPassword" onChange={(event) => setConfirmPassword(event.target.value)} onKeyDown={(event) => setCapsLockOn(event.getModifierState('CapsLock'))} onKeyUp={(event) => setCapsLockOn(event.getModifierState('CapsLock'))} placeholder="再次输入密码" required type={passwordVisible ? 'text' : 'password'} value={confirmPassword} />
              <button aria-label={passwordVisible ? '隐藏密码' : '显示密码'} onClick={() => setPasswordVisible((value) => !value)} title={passwordVisible ? '隐藏密码' : '显示密码'} type="button">{passwordVisible ? <EyeOff size={18} /> : <Eye size={18} />}</button>
            </div>
          </label>}
          {capsLockOn && <p className="caps-lock-note" role="status">大写锁定已开启，请留意密码大小写。</p>}
          {error && <p className="form-error" role="alert">{error}</p>}
          <label className="consent-row"><input checked={consentAccepted} onChange={(event) => onConsentChange(event.target.checked)} type="checkbox" /><span>我已阅读并同意<button onClick={() => onOpenPolicy('terms')} type="button">用户协议</button>与<button onClick={() => onOpenPolicy('privacy')} type="button">隐私说明</button></span></label>
          <label className="consent-row optional"><input checked={analyticsEnabled} onChange={(event) => onAnalyticsChange(event.target.checked)} type="checkbox" /><span>允许发送不含生辰和联系方式的匿名使用统计</span></label>
          <button className="primary-button" disabled={!consentAccepted || !username.trim() || password.length < 8 || (mode === 'register' && !displayName.trim()) || submitting} type="submit">
            {mode === 'login' ? <LogIn size={17} /> : <UserPlus size={17} />}
            {submitting ? '正在加密验证' : mode === 'login' ? '登录并解锁' : '注册并进入'}
          </button>
          <button className="secondary-button" disabled={!consentAccepted} onClick={onGuest} type="button">
            <ArrowRight size={16} />
            不建名档体验
          </button>
          <p className="local-mode-note"><ShieldCheck size={14} />密码只用于在本机派生加密密钥，不会明文保存或上传。当前版本暂不支持跨设备同步，忘记密码后无法恢复加密数据。</p>
        </form>
      </section>
    </main>
  );
}

function OperationsFooter({ onFeedback, onOpenPolicy }: { onFeedback: () => void; onOpenPolicy: (view: PolicyView) => void }) {
  return (
    <footer className="operations-footer">
      <strong>山易排盘 · 传统文化学习与历法工具</strong>
      <nav aria-label="运营与合规">
        <button onClick={() => onOpenPolicy('terms')} type="button">用户协议</button>
        <button onClick={() => onOpenPolicy('privacy')} type="button">隐私说明</button>
        <button onClick={() => onOpenPolicy('boundary')} type="button">内容边界</button>
        <button onClick={() => onOpenPolicy('data')} type="button">数据管理</button>
        <button onClick={onFeedback} type="button">问题反馈</button>
      </nav>
      <span>版本 {POLICY_VERSION}</span>
    </footer>
  );
}

function PolicyDialog({ account, archives, onClearData, onClose, onDeleteAccount, onExportData, view }: { account: AccountProfile | null; archives: ArchiveRecord[]; onClearData: () => void | Promise<void>; onClose: () => void; onDeleteAccount: () => void | Promise<void>; onExportData: () => void; view: PolicyView }) {
  const { closeButtonRef, closeFromBackdrop } = useDialogLifecycle(onClose);
  const content: Record<Exclude<PolicyView, 'data'>, { title: string; intro: string; sections: Array<{ title: string; body: string }> }> = {
    privacy: {
      title: '隐私说明',
      intro: '公开测试版采用本机计算与加密保存，不要求手机号，也不会把出生资料发送到服务器。',
      sections: [
        { title: '处理的数据', body: '账号、显示名称、性别、出生日期、出生时间、地点、经度、时区及排盘结果；学习进度、书签、答题记录和本机反馈。' },
        { title: '账号与加密', body: '密码经 PBKDF2-SHA-256 派生验证信息与 AES-GCM 密钥，密码本身不保存。命盘、学习记录和反馈加密后存放于当前浏览器；退出后必须重新输入密码才能解锁。' },
        { title: '本机账号限制', body: '当前是纯静态部署，账号只存在于当前浏览器，不支持跨设备同步或找回密码。清理浏览器数据、忘记密码或设备损坏都可能导致记录无法恢复，请按需导出备份。' },
        { title: '可选统计', body: '只有主动勾选后才记录页面功能事件；事件不得包含姓名、生辰、地点、联系方式或完整报告。未配置远程统计接口时仍只保存在本机。' },
        { title: '保存与删除', body: '每个本机账号最多保存30份命盘。你可以从“数据管理”导出、清空账号内容或永久删除本机账号。游客模式不保存命盘和学习记录。' },
      ],
    },
    terms: {
      title: '用户协议',
      intro: '使用本产品即表示你理解它是传统文化与历法研究工具，不构成对现实结果的承诺。',
      sections: [
        { title: '适用范围', body: '排盘、求卦、古籍和现代解读用于学习、记录和自我观察，不替代医学、心理、法律、财务及其他持证专业服务。' },
        { title: '用户责任', body: '请勿上传他人的真实隐私资料；为他人建档前应取得授权。不得利用结果实施歧视、骚扰、欺诈或对他人作确定性判断。' },
        { title: '未成年人', body: '未满18周岁应在监护人指导下使用，不提供付费诱导、恐吓性结论或重大人生决策指令。' },
        { title: '版本与误差', body: '节气边界、出生时间误差、流派规则和资料来源都会影响结果。报告会展示计算版本和校正依据，用户应自行核对。' },
      ],
    },
    boundary: {
      title: '内容边界',
      intro: '产品不提供“保证应验”的预测，不以恐惧或灾祸描述诱导付费。',
      sections: [
        { title: '健康', body: '五行身心内容只描述传统象意与生活节律，不诊断疾病、不替代就医，也不建议停药或改变治疗。' },
        { title: '财务与事业', body: '不承诺收益，不推荐具体证券、借贷或投资行为；重大资金决策应咨询持牌人士。' },
        { title: '关系与人生决定', body: '不以命盘替代沟通、调查和本人意愿，不鼓励仅凭排盘决定婚育、离职、迁居或终止关系。' },
        { title: '传统文化表述', body: '古籍原文与现代解释分层展示；神煞和术语不得脱离全局被包装成绝对吉凶。' },
      ],
    },
  };
  const page = view === 'data' ? null : content[view];
  const titleId = `policy-dialog-title-${view}`;
  return (
    <div className="modal-backdrop" onMouseDown={closeFromBackdrop} role="presentation">
      <section aria-labelledby={titleId} aria-modal="true" className="operations-dialog" role="dialog">
        <header><div><span>{view === 'data' ? '本机自主控制' : `政策版本 ${POLICY_VERSION}`}</span><h2 id={titleId}>{view === 'data' ? '数据管理' : page?.title}</h2></div><button aria-label="关闭" onClick={onClose} ref={closeButtonRef} title="关闭" type="button"><X size={20} /></button></header>
        {view === 'data' ? <div className="data-control-panel">
          <p>{account ? <>当前为本机加密账号 <strong>@{account.username}</strong>，保存 {archives.length} 份命盘档案。导出文件包括档案、学习进度、书签和本机反馈。</> : '当前处于游客模式，没有可导出的账号数据。登录后可管理独立的加密档案。'}</p>
          <div>
            <button className="secondary-button" disabled={!account} onClick={onExportData} type="button"><Download size={16} />导出账号数据</button>
            <button className="danger-button" disabled={!account} onClick={onClearData} type="button"><Trash2 size={16} />清空账号内容</button>
            <button className="danger-button account-delete-button" disabled={!account} onClick={onDeleteAccount} type="button"><UserRound size={16} />删除本机账号</button>
          </div>
        </div> : <div className="policy-content"><p className="policy-intro">{page?.intro}</p>{page?.sections.map((section) => <article key={section.title}><h3>{section.title}</h3><p>{section.body}</p></article>)}</div>}
      </section>
    </div>
  );
}

function FeedbackDialog({ onClose, onSubmitted }: { onClose: () => void; onSubmitted: (result: { remote: boolean; stored: boolean }) => void }) {
  const [category, setCategory] = useState('排盘问题');
  const [message, setMessage] = useState('');
  const [contact, setContact] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const { closeButtonRef, closeFromBackdrop } = useDialogLifecycle(onClose);
  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (message.trim().length < 8) return;
    setError('');
    setSubmitting(true);
    try {
      const result = await submitFeedback({ category, message: message.trim(), contact: contact.trim() || undefined });
      onSubmitted(result);
    } catch {
      setError('提交暂时失败，请稍后重试。你的内容仍保留在当前输入框中。');
    } finally {
      setSubmitting(false);
    }
  };
  return (
    <div className="modal-backdrop" onMouseDown={closeFromBackdrop} role="presentation"><section aria-labelledby="feedback-dialog-title" aria-modal="true" className="operations-dialog feedback-dialog" role="dialog"><header><div><span>帮助我们定位问题</span><h2 id="feedback-dialog-title">问题反馈</h2></div><button aria-label="关闭" onClick={onClose} ref={closeButtonRef} title="关闭" type="button"><X size={20} /></button></header><form onSubmit={handleSubmit}><label><span>问题类型</span><select value={category} onChange={(event) => setCategory(event.target.value)}><option>排盘问题</option><option>内容校勘</option><option>页面与交互</option><option>隐私与数据</option><option>其他建议</option></select></label><label><span>问题描述</span><textarea minLength={8} onChange={(event) => setMessage(event.target.value)} placeholder="请写明操作步骤、预期结果和实际情况" required value={message} /></label><label><span>联系方式（可选）</span><input onChange={(event) => setContact(event.target.value)} placeholder="当前未配置远程反馈时仅保存在本机" value={contact} /></label>{error && <p className="form-error" role="alert">{error}</p>}<button aria-busy={submitting} className="primary-button" disabled={submitting || message.trim().length < 8} type="submit"><MessageSquare size={16} />{submitting ? '提交中' : '提交反馈'}</button></form></section></div>
  );
}

function BirthSetupPage({
  error,
  input,
  loading,
  onBack,
  onChange,
  onLearning,
  onYijing,
  onReset,
  onSubmit,
}: {
  error: string;
  input: BirthInput;
  loading: boolean;
  onBack: () => void;
  onChange: (input: BirthInput) => void;
  onLearning: () => void;
  onYijing: () => void;
  onReset: () => void;
  onSubmit: (input: BirthInput) => void;
}) {
  const birthDateInputRef = useRef<HTMLInputElement>(null);
  const birthTimeInputRef = useRef<HTMLInputElement>(null);
  const basicSectionRef = useRef<HTMLElement>(null);
  const timeSectionRef = useRef<HTMLElement>(null);
  const locationSectionRef = useRef<HTMLElement>(null);
  const [activeFormSection, setActiveFormSection] = useState<'basic' | 'time' | 'location'>('basic');
  const matchedBirthLocation = findBirthLocation(input.birthplace);

  useEffect(() => {
    if (!('IntersectionObserver' in window)) return undefined;
    const sections = [
      ['basic', basicSectionRef.current],
      ['time', timeSectionRef.current],
      ['location', locationSectionRef.current],
    ] as const;
    const observer = new IntersectionObserver((entries) => {
      const visible = entries.filter((entry) => entry.isIntersecting).sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
      if (visible?.target.id) setActiveFormSection(visible.target.id as 'basic' | 'time' | 'location');
    }, { rootMargin: '-18% 0px -62%', threshold: [0, 0.2, 0.6] });
    sections.forEach(([, section]) => { if (section) observer.observe(section); });
    return () => observer.disconnect();
  }, []);

  const goToFormSection = (section: 'basic' | 'time' | 'location') => {
    const refs = { basic: basicSectionRef, time: timeSectionRef, location: locationSectionRef };
    setActiveFormSection(section);
    refs[section].current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const openNativePicker = (ref: RefObject<HTMLInputElement | null>) => {
    try {
      ref.current?.showPicker();
    } catch {
      ref.current?.focus();
    }
  };

  const changeBirthplace = (value: string) => {
    const location = findBirthLocation(value);
    onChange({
      ...input,
      birthplace: value,
      ...(location ? {
        longitude: location.longitude,
        latitude: location.latitude,
        timezoneOffset: location.timezoneOffset,
      } : {}),
    });
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    onSubmit({
      ...input,
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

        <nav aria-label="生辰资料步骤" className="form-step-nav">
          {([
            ['basic', '01', '基本资料'],
            ['time', '02', '出生时刻'],
            ['location', '03', '地点校正'],
          ] as const).map(([key, number, label]) => <button aria-current={activeFormSection === key ? 'step' : undefined} className={activeFormSection === key ? 'active' : ''} key={key} onClick={() => goToFormSection(key)} type="button"><span>{number}</span><strong>{label}</strong></button>)}
        </nav>

        <form className="birth-form" id="basic-info" onSubmit={handleSubmit}>
          <section className="precision-form-section" id="basic" ref={basicSectionRef}>
            <header><span>01</span><div><h2>基本资料</h2><p>用于建立档案和确定大运顺逆，不需要填写真实姓名。</p></div></header>
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
            </div>
          </section>

          <section className="precision-form-section" id="time" ref={timeSectionRef}>
            <header><span>02</span><div><h2>历法与出生时刻</h2><p>农历日期请确认是否闰月；时间不确定时可标记来源和误差。</p></div></header>
            <div className="form-grid">
            <label>
              <span><CalendarDays size={15} /> 历法</span>
              <select value={input.calendarType} onChange={(event) => onChange({ ...input, calendarType: event.target.value as BirthInput['calendarType'], lunarLeapMonth: false })}>
                <option value="solar">公历</option>
                <option value="lunar">农历</option>
              </select>
            </label>
            <label>
              <span>
                <CalendarDays size={15} /> {input.calendarType === 'lunar' ? '农历日期' : '公历日期'}
              </span>
              <div className="native-picker-field">
                <input
                  max="2100-12-31"
                  min="1900-01-01"
                  name="birthDate"
                  ref={birthDateInputRef}
                  required
                  type="date"
                  value={input.birthDate}
                  onChange={(event) => onChange({ ...input, birthDate: event.target.value })}
                />
                <button aria-label="打开日期选择器" onClick={() => openNativePicker(birthDateInputRef)} title="选择日期" type="button"><CalendarDays size={18} /></button>
              </div>
            </label>

            {input.calendarType === 'lunar' && <label className="binary-control"><input checked={input.lunarLeapMonth} onChange={(event) => onChange({ ...input, lunarLeapMonth: event.target.checked })} type="checkbox" /><span>该月为闰月</span></label>}

            <label>
              <span>
                <Clock3 size={15} /> 出生时间
              </span>
              <div className="native-picker-field">
                <input
                  name="birthTime"
                  ref={birthTimeInputRef}
                  required={!input.unknownHour}
                  step="60"
                  type="time"
                  disabled={input.unknownHour}
                  value={input.birthTime}
                  onChange={(event) => onChange({ ...input, birthTime: event.target.value })}
                />
                <button aria-label="打开时间选择器" disabled={input.unknownHour} onClick={() => openNativePicker(birthTimeInputRef)} title="选择时间" type="button"><Clock3 size={18} /></button>
              </div>
            </label>

            <label className="binary-control"><input checked={input.unknownHour} onChange={(event) => onChange({ ...input, unknownHour: event.target.checked, birthTimeSource: event.target.checked ? 'unknown' : input.birthTimeSource })} type="checkbox" /><span>出生时辰未知</span></label>

            <label>
              <span><Clock3 size={15} /> 时间来源</span>
              <select disabled={input.unknownHour} value={input.birthTimeSource} onChange={(event) => onChange({ ...input, birthTimeSource: event.target.value as BirthInput['birthTimeSource'] })}>
                <option value="certificate">证件记录</option>
                <option value="family">家人记录</option>
                <option value="memory">本人记忆</option>
                <option value="estimated">估算时间</option>
                <option value="unknown">来源未说明</option>
              </select>
            </label>

            <label>
              <span><Clock3 size={15} /> 预计误差（分钟）</span>
              <input min="0" max="720" step="5" type="number" value={input.uncertaintyMinutes} onChange={(event) => onChange({ ...input, uncertaintyMinutes: Number(event.target.value) })} />
            </label>
            </div>
          </section>

          <section className="precision-form-section" id="location" ref={locationSectionRef}>
            <header><span>03</span><div><h2>地点与时间校正</h2><p>真太阳时按出生地经度、时区中央经线和当日均时差计算。</p></div></header>
            <div className="form-grid">
            <label className="wide">
              <span>
                <MapPin size={15} /> 出生地 <small className="field-badge">搜索选择</small>
              </span>
              <input
                autoComplete="off"
                list="birthplace-options"
                name="birthplace"
                placeholder="输入城市或区县，例如：浙江湖州德清"
                required
                value={input.birthplace}
                onChange={(event) => changeBirthplace(event.target.value)}
              />
              <datalist id="birthplace-options">
                {birthLocations.map((location) => <option key={location.id} value={location.label}>{`东经 ${location.longitude}° · UTC${location.timezoneOffset >= 0 ? '+' : ''}${location.timezoneOffset}`}</option>)}
              </datalist>
              {matchedBirthLocation ? <small className="location-match-status matched"><CheckCircle2 size={14} />已匹配地点库：东经 {matchedBirthLocation.longitude}° · 北纬 {matchedBirthLocation.latitude}° · UTC{matchedBirthLocation.timezoneOffset >= 0 ? '+' : ''}{matchedBirthLocation.timezoneOffset}</small> : <small className="location-match-status"><MapPin size={14} />未匹配本地地点库，请继续手动核对下方经度与时区。</small>}
            </label>

            <label>
              <span><MapPin size={15} /> 出生地经度</span>
              <input max="180" min="-180" step="0.0001" type="number" value={input.longitude} onChange={(event) => onChange({ ...input, longitude: Number(event.target.value) })} />
            </label>

            <label>
              <span><Clock3 size={15} /> 当地时区 UTC</span>
              <input max="14" min="-12" step="0.25" type="number" value={input.timezoneOffset} onChange={(event) => onChange({ ...input, timezoneOffset: Number(event.target.value) })} />
            </label>

            <label>
              <span><Clock3 size={15} /> 输入时间性质</span>
              <select value={input.timeMode} onChange={(event) => onChange({ ...input, timeMode: event.target.value as BirthInput['timeMode'] })}>
                <option value="clock">当地钟表时间，自动校正</option>
                <option value="trueSolar">已经是真太阳时，不再校正</option>
              </select>
            </label>

            <label>
              <span><Clock3 size={15} /> 日柱换日规则</span>
              <select value={input.dayBoundary} onChange={(event) => onChange({ ...input, dayBoundary: event.target.value as BirthInput['dayBoundary'] })}>
                <option value="midnight">午夜换日（00:00）</option>
                <option value="lateZi">子初换日（23:00）</option>
              </select>
            </label>

            <label className="binary-control"><input checked={input.daylightSaving} disabled={input.timeMode === 'trueSolar'} onChange={(event) => onChange({ ...input, daylightSaving: event.target.checked })} type="checkbox" /><span>出生时实行夏令时</span></label>
            </div>
          </section>

          <div aria-label="本次排盘摘要" className="birth-submit-summary">
            <div><span>日期</span><strong>{input.calendarType === 'lunar' ? '农历' : '公历'} {input.birthDate}</strong></div>
            <div><span>时刻</span><strong>{input.unknownHour ? '时辰未知' : input.birthTime}</strong></div>
            <div><span>地点</span><strong>{input.birthplace || '待填写'}</strong></div>
            <div><span>校正</span><strong>{input.timeMode === 'clock' ? '自动真太阳时校正' : '已是真太阳时'}</strong></div>
          </div>

          <div className="form-actions">
            {error && <p className="form-error" role="alert">{error}</p>}
            <button aria-busy={loading} className="primary-button" disabled={loading} type="submit">
              <RefreshCw className={loading ? 'spin-icon' : ''} size={17} />
              {loading ? '正在校正并排盘…' : '生成八字排盘分析'}
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
  const tabsRef = useRef<HTMLElement>(null);
  const navItems: Array<{ key: NavTarget; label: string }> = [
    { key: 'paipan', label: '基本排盘' },
    { key: 'element', label: '五行气势' },
    { key: 'useful', label: '喜用调候' },
    { key: 'detail', label: '专业详批' },
    { key: 'professional', label: '专业细盘' },
    { key: 'luck', label: '大运合参' },
  ];

  useEffect(() => {
    const tabs = tabsRef.current;
    const activeButton = tabs?.querySelector<HTMLButtonElement>(`[data-nav-target="${activeNav}"]`);
    if (!tabs || !activeButton || tabs.scrollWidth <= tabs.clientWidth) return;
    tabs.scrollTo({
      behavior: 'smooth',
      left: activeButton.offsetLeft - (tabs.clientWidth - activeButton.clientWidth) / 2,
    });
  }, [activeNav]);

  return (
    <header className="report-topnav">
      <div className="topnav-brand">
        <div className="brand-symbol">山</div>
        <div>
          <strong>山易排盘</strong>
          <span>命盘报告</span>
        </div>
      </div>

      <nav className="topnav-tabs" aria-label="报告导航" ref={tabsRef}>
        <button onClick={onHome} type="button">
          功能首页
        </button>
        {navItems.map((item) => (
          <button className={activeNav === item.key ? 'active' : ''} data-nav-target={item.key} key={item.key} onClick={() => onNavigate(item.key)} type="button">
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
  const [account, setAccount] = useState<AccountProfile | null>(null);
  const [step, setStep] = usePageRoute();
  const pendingReport = useRef(readRoute().page === 'report' ? readRoute().parts[1] : undefined);
  const [yijingBackStep, setYijingBackStep] = useState<AppStep>('login');
  const [learningBackStep, setLearningBackStep] = useState<AppStep>('login');
  const [activeNav, setActiveNav] = useState<NavTarget>('paipan');
  const [toast, setToast] = useState('');
  const [archives, setArchives] = useState<ArchiveRecord[]>([]);
  const [currentArchiveId, setCurrentArchiveId] = useState<string>();
  const [persistArchive, setPersistArchive] = useState(false);
  const [policyView, setPolicyView] = useState<PolicyView | null>(null);
  const [feedbackOpen, setFeedbackOpen] = useState(false);
  const [consentAccepted, setConsentAccepted] = useState(() => Boolean(getPrivacyPreferences()));
  const [analyticsEnabled, setAnalyticsEnabled] = useState(() => Boolean(getPrivacyPreferences()?.analytics));
  const [reading, setReading] = useState<BaziReading | null>(null);
  const [readingError, setReadingError] = useState('');
  const [readingLoading, setReadingLoading] = useState(false);
  useEffect(() => {
    const notify = (event: Event) => setToast((event as CustomEvent<string>).detail || '本机保存失败，请检查存储空间');
    window.addEventListener('shanyi-storage-error', notify);
    return () => window.removeEventListener('shanyi-storage-error', notify);
  }, []);
  useEffect(() => {
    const restore = () => {
      const route = readRoute();
      const id = route.page === 'report' ? route.parts[1] : pendingReport.current;
      if (id && account && id !== currentArchiveId) {
        const archive = archiveRepository.list().find(item => item.id === id);
        pendingReport.current = undefined;
        if (archive) { void openArchive(archive); return; }
        setToast('此账号中没有找到该档案');
        navigate('/home', true);
      } else if (route.page === 'report' && id && !account) {
        pendingReport.current = id;
        navigate('/login', true);
      } else if (route.page === 'report' && !reading) {
        navigate(account ? '/home' : '/login', true);
      }
    };
    restore();
    window.addEventListener('hashchange', restore);
    return () => window.removeEventListener('hashchange', restore);
  }, [step, reading, account, currentArchiveId]);
  const [isOnline, setIsOnline] = useState(() => navigator.onLine);
  const lastSavedReadingRef = useRef<BaziReading | null>(null);
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

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
  }, [step]);

  useEffect(() => {
    const updateConnection = () => setIsOnline(navigator.onLine);
    window.addEventListener('online', updateConnection);
    window.addEventListener('offline', updateConnection);
    return () => {
      window.removeEventListener('online', updateConnection);
      window.removeEventListener('offline', updateConnection);
    };
  }, []);

  useEffect(() => {
    if (step !== 'report' || !reading || !persistArchive || !account) return;
    if (lastSavedReadingRef.current === reading) return;
    lastSavedReadingRef.current = reading;
    let cancelled = false;
    void archiveRepository.save(submitted, reading, currentArchiveId).then((saved) => {
      if (cancelled) return;
      setCurrentArchiveId(saved.id);
      navigate(`/reports/${saved.id}`, true);
      setArchives(archiveRepository.list());
      trackEvent('reading_generated', { calendar: submitted.calendarType, trueSolar: submitted.timeMode === 'clock', unknownHour: submitted.unknownHour });
    }).catch(() => {
      if (!cancelled) {
        lastSavedReadingRef.current = null;
        setToast('命盘已生成，但本机档案保存失败');
      }
    });
    return () => { cancelled = true; };
  }, [account, persistArchive, reading, step, submitted]);

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
    const section = refs[target].current;
    if (!section) return;
    const navHeight = document.querySelector<HTMLElement>('.report-topnav')?.getBoundingClientRect().height ?? 0;
    const top = window.scrollY + section.getBoundingClientRect().top - navHeight - 16;
    window.scrollTo({ top: Math.max(0, top), left: 0, behavior: 'smooth' });
  };

  useEffect(() => {
    if (step !== 'report' || !reading) return undefined;
    const sections: Array<[NavTarget, RefObject<HTMLDivElement | null>]> = [
      ['paipan', paipanRef],
      ['element', elementRef],
      ['useful', usefulRef],
      ['detail', detailRef],
      ['professional', professionalRef],
      ['luck', luckRef],
    ];
    let frame = 0;
    const updateActiveSection = () => {
      frame = 0;
      const navHeight = document.querySelector<HTMLElement>('.report-topnav')?.getBoundingClientRect().height ?? 0;
      const threshold = navHeight + 32;
      let next: NavTarget = 'paipan';
      for (const [target, ref] of sections) {
        if (ref.current && ref.current.getBoundingClientRect().top <= threshold) next = target;
      }
      setActiveNav((current) => current === next ? current : next);
    };
    const onScroll = () => {
      if (!frame) frame = window.requestAnimationFrame(updateActiveSection);
    };
    updateActiveSection();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    return () => {
      if (frame) window.cancelAnimationFrame(frame);
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
    };
  }, [reading, step]);

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
    const { buildReportText } = await import('./core/interpretation');
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

  const exportReport = async () => {
    if (!reading) {
      return;
    }
    const { buildReportText } = await import('./core/interpretation');
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
    setReadingError('');
    setToast('已重置为默认案例');
    setActiveNav('paipan');
    setCurrentArchiveId(undefined);
  };

  const downloadJson = (value: unknown, filename: string) => {
    const blob = new Blob([JSON.stringify(value, null, 2)], { type: 'application/json;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
  };

  const generateReading = async (nextInput: BirthInput, archiveId?: string) => {
    setReadingLoading(true);
    setReadingError('');
    const result = await createReadingSafely(nextInput);
    setReadingLoading(false);
    if (!result.reading) {
      setReadingError(result.error);
      return false;
    }
    setInput(nextInput);
    setSubmitted(nextInput);
    setReading(result.reading);
    setCurrentArchiveId(archiveId);
    setActiveNav('paipan');
    setStep('report');
    return true;
  };

  const openArchive = async (archive: ArchiveRecord) => {
    setInput(archive.input);
    setPersistArchive(true);
    const snapshot = archive.snapshots?.at(-1);
    if (snapshot) {
      lastSavedReadingRef.current = snapshot;
      setSubmitted(snapshot.input);
      setReading(snapshot);
      setCurrentArchiveId(archive.id);
      setReadingError('');
      navigate(`/reports/${archive.id}`);
      return;
    }
    if (await generateReading(archive.input, archive.id)) trackEvent('archive_opened');
  };

  const wrapPage = (page: ReactNode) => (
    <>
      <PageBoundary key={step}><Suspense fallback={<main className="section" role="status">正在载入…</main>}>{page}</Suspense></PageBoundary>
      {!isOnline && <div className="offline-banner" role="status"><span>当前处于离线状态</span><small>排盘与已缓存内容仍可使用，远程反馈需联网后提交。</small></div>}
      <OperationsFooter onFeedback={() => setFeedbackOpen(true)} onOpenPolicy={setPolicyView} />
      {policyView && <PolicyDialog account={account} archives={archives} onClearData={async () => {
        if (!window.confirm('确定清空当前账号中的命盘、学习记录、书签与本机反馈吗？此操作无法撤销。')) return;
        await clearLocalProductData();
        setArchives([]);
        setCurrentArchiveId(undefined);
        setPolicyView(null);
        setReading(null);
        setStep('home');
        setToast('当前账号内容已清空');
      }} onClose={() => setPolicyView(null)} onExportData={() => {
        downloadJson(exportLocalProductData(), `山易排盘-我的数据-${new Date().toISOString().slice(0, 10)}.json`);
        setToast('账号数据已导出');
      }} onDeleteAccount={async () => {
        if (!account || !window.confirm(`确定永久删除本机账号 @${account.username} 及其全部加密数据吗？此操作无法撤销。`)) return;
        await deleteActiveAccount();
        setAccount(null);
        setArchives([]);
        setReading(null);
        setCurrentArchiveId(undefined);
        setInput(initialInput);
        setSubmitted(initialInput);
        setPersistArchive(false);
        setPolicyView(null);
        setStep('login');
        setToast('本机账号及其数据已删除');
      }} view={policyView} />}
      {feedbackOpen && <FeedbackDialog onClose={() => setFeedbackOpen(false)} onSubmitted={({ remote, stored }) => {
        setFeedbackOpen(false);
        setToast(remote ? '反馈已提交' : stored ? '反馈已加密保存在当前账号' : '游客反馈未保存，请登录后再提交');
      }} />}
      <Toast message={toast} onDismiss={() => setToast('')} />
    </>
  );

  if (step === 'login') {
    return wrapPage(
      <>
        <LoginPage
        analyticsEnabled={analyticsEnabled}
        consentAccepted={consentAccepted}
        onAnalyticsChange={setAnalyticsEnabled}
        onConsentChange={setConsentAccepted}
        onGuest={async () => {
          savePrivacyPreferences(analyticsEnabled);
          await logoutLocalAccount();
          setAccount(null);
          setArchives([]);
          setInput((current) => ({ ...current, name: '游客' }));
          setPersistArchive(false);
          setToast('已进入不建名档体验');
          setStep('home');
        }}
        onLogin={async (username, password) => {
          const result = await loginLocalAccount(username, password);
          savePrivacyPreferences(analyticsEnabled);
          setAccount(result.account);
          setArchives(archiveRepository.list());
          setInput((current) => ({ ...current, name: result.account.displayName }));
          setPersistArchive(true);
          trackEvent('workspace_entered');
          setToast(result.migratedArchives ? `已登录，并迁移 ${result.migratedArchives} 份旧档案` : '账号已解锁');
          setStep('home');
        }}
        onRegister={async (credentials) => {
          const result = await registerLocalAccount(credentials);
          savePrivacyPreferences(analyticsEnabled);
          setAccount(result.account);
          setArchives(archiveRepository.list());
          setInput((current) => ({ ...current, name: result.account.displayName }));
          setPersistArchive(true);
          trackEvent('account_registered');
          setToast(result.migratedArchives ? `注册成功，并迁移 ${result.migratedArchives} 份旧档案` : '本机加密账号已建立');
          setStep('home');
        }}
          onOpenPolicy={setPolicyView}
        />
      </>
    );
  }

  if (step === 'home') {
    return wrapPage(
      <>
        <HomePage
          account={account}
          archives={archives}
          onBazi={() => { setCurrentArchiveId(undefined); setStep('birth'); }}
          onDeleteArchive={(id) => {
            void archiveRepository.remove(id).then(() => {
              setArchives(archiveRepository.list());
              setToast('本机档案已删除');
            }).catch(() => setToast('档案删除失败，请检查浏览器存储空间'));
          }}
          onLearning={openLearning}
          onLogout={() => {
            void logoutLocalAccount().then(() => {
              setAccount(null);
              setArchives([]);
              setReading(null);
              setCurrentArchiveId(undefined);
              setInput(initialInput);
              setSubmitted(initialInput);
              setPersistArchive(false);
              setStep('login');
              setToast(account ? '已退出账号' : '已返回登录页');
            });
          }}
          onOpenArchive={openArchive}
          onYijing={openYijing}
        />
      </>
    );
  }

  if (step === 'learning') {
    return wrapPage(
      <LearningPage
        onBack={() => setStep(learningBackStep === 'learning' ? 'login' : learningBackStep)}
        onGoBazi={() => setStep('birth')}
        onYijing={openYijing}
      />
    );
  }

  if (step === 'yijing') {
    return wrapPage(
      <>
        <YijingPage
          onBack={() => setStep(yijingBackStep === 'yijing' ? 'login' : yijingBackStep)}
          onGoBazi={() => setStep('birth')}
          onLearning={openLearning}
        />
      </>
    );
  }

  if (step === 'birth') {
    return wrapPage(
      <>
        <BirthSetupPage
          error={readingError}
          input={input}
          loading={readingLoading}
          onBack={() => setStep('home')}
          onChange={setInput}
          onLearning={openLearning}
          onYijing={openYijing}
          onReset={resetCase}
          onSubmit={async (nextInput) => {
            if (await generateReading(nextInput)) setToast('排盘已生成');
          }}
        />
      </>
    );
  }

  return wrapPage(
    <main className="report-shell">
      <ReportTopNav activeNav={activeNav} onHome={() => setStep('home')} onLearning={openLearning} onNavigate={scrollTo} onYijing={openYijing} />

      <div className="report-main">
        {readingError && <div className="error-box">{readingError}</div>}
        {reading && (
          <>
            <TopProfile
              onCopy={copyReport}
              onEdit={() => setStep('birth')}
              onExport={exportReport}
              reading={reading}
            />
            <div className="report-revisions">
              <span>报告生成于 {reading.generatedAt.slice(0, 10)} · {reading.calculation.version}</span>
              <button className="icon-text-button" type="button" disabled={readingLoading} onClick={() => generateReading(reading.input, currentArchiveId)}><RefreshCw size={16} />按最新规则重算</button>
              {!!currentArchiveId && (archives.find(a => a.id === currentArchiveId)?.snapshots?.length ?? 0) > 1 && <label>历史报告 <select value={reading.generatedAt} onChange={event => {
                const snapshot = archives.find(a => a.id === currentArchiveId)?.snapshots?.find(s => s.generatedAt === event.target.value);
                if (snapshot) { lastSavedReadingRef.current = snapshot; setReading(snapshot); setSubmitted(snapshot.input); }
              }}>{archives.find(a => a.id === currentArchiveId)?.snapshots?.map(snapshot => <option key={snapshot.generatedAt} value={snapshot.generatedAt}>{snapshot.generatedAt.slice(0, 19).replace('T', ' ')} · {snapshot.calculation.version}</option>)}</select></label>}
            </div>
            <div ref={paipanRef}>
              <PaipanSection reading={reading} elementRef={elementRef} />
            </div>
            {reading.input.unknownHour && <section className="section"><h2>时辰待补全</h2><p>当前五行只统计年、月、日三柱。喜用、格局、亲属与岁运详批暂不作确定判断。</p></section>}
            {!reading.input.unknownHour && <>
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
            </>}

            <p className="disclaimer">以上为基于传统干支模型的结构化参考，不替代医学、法律、财务或人生重大决策建议。</p>
          </>
        )}
      </div>
    </main>
  );
}
