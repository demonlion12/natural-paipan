import { useMemo, useState } from 'react';
import { YaoValue } from '../../appConfig';
import {
  ArrowLeft,
  BookOpen,
  GraduationCap,
  Sparkles
} from '../../icons';

import { buildDivinationReading, castYao, divinationPresets, formatYao, isMovingLine, isYangLine, movingLineAdvice, yaoDisplayLabels, yaoPositionLabels } from '../../core/interpretation';
export function YijingPage({ onBack, onGoBazi, onLearning }: { onBack: () => void; onGoBazi: () => void; onLearning: () => void }) {
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
