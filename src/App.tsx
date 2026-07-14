import { useMemo, useState, type CSSProperties } from "react";
import {
  baseline,
  domains,
  flashcards,
  lessons,
  quizQuestions,
  runtimeLayers,
  sources,
  type Domain,
} from "./content";

const progressKey = "pi-agent-learning-journal-progress-v1";

function readProgress() {
  try {
    const value = window.localStorage.getItem(progressKey);
    return value ? (JSON.parse(value) as number[]) : [];
  } catch {
    return [];
  }
}

function AppHeader({ progress }: { progress: number }) {
  return (
    <header className="site-header">
      <a className="brand" href="#top" aria-label="返回顶部">
        <span className="brand-mark">π</span>
        <span>
          <strong>Pi Runtime</strong>
          <small>Learning Journal</small>
        </span>
      </a>
      <nav aria-label="主导航">
        <a href="#map">架构地图</a>
        <a href="#journal">学习日记</a>
        <a href="#review">复习模式</a>
        <a href="#sources">源码入口</a>
      </nav>
      <div className="header-progress" aria-label={`复习进度 ${progress}%`}>
        <span>{progress}%</span>
        <i style={{ width: `${progress}%` }} />
      </div>
    </header>
  );
}

function Hero({ reviewedCount }: { reviewedCount: number }) {
  const progress = Math.round((reviewedCount / lessons.length) * 100);
  const ringStyle = { "--progress": `${progress * 3.6}deg` } as CSSProperties;

  return (
    <section className="hero shell" id="top">
      <div className="hero-copy">
        <span className="eyebrow"><i />从最小内核到生产级 Runtime</span>
        <h1>Pi Agent Runtime<br /><em>学习日记</em></h1>
        <p>
          不是功能清单，而是一条从 Agent Loop 出发，逐步理解模型、工具、状态、可靠性与信任边界的学习路径。
        </p>
        <div className="hero-actions">
          <a className="button primary" href="#journal">从第 1 课开始</a>
          <a className="button secondary" href="#review">快速复习</a>
        </div>
        <div className="baseline-line">
          <span>固定版本</span>
          <code>{baseline.release}</code>
          <span className="dot">·</span>
          <code>{baseline.commit.slice(0, 9)}</code>
          <span className="dot">·</span>
          <span>{baseline.verifiedAt} 复核</span>
        </div>
      </div>
      <div className="hero-panel" aria-label="学习进度概览">
        <div className="progress-ring" style={ringStyle}>
          <div><strong>{reviewedCount}</strong><span>/ {lessons.length}</span></div>
        </div>
        <h2>你的复习进度</h2>
        <p>勾选已经能独立解释的课程，进度只保存在当前浏览器。</p>
        <div className="stat-grid">
          <div><strong>18</strong><span>渐进课程</span></div>
          <div><strong>7</strong><span>架构领域</span></div>
          <div><strong>3</strong><span>证据链</span></div>
        </div>
      </div>
    </section>
  );
}

function RuntimeMap() {
  return (
    <section className="section shell" id="map">
      <div className="section-heading split-heading">
        <div>
          <span className="section-index">01 / ARCHITECTURE</span>
          <h2>先看系统，再看代码</h2>
        </div>
        <p>每次阅读源码，都先判断它位于哪一层、拥有哪份状态、依赖哪个边界。</p>
      </div>
      <div className="map-layout">
        <div className="layer-stack" aria-label="Agent Runtime 分层架构">
          {runtimeLayers.map((layer, index) => (
            <div className={`runtime-layer ${layer.tone}`} key={layer.name}>
              <span>L{index + 1}</span>
              <div><strong>{layer.name}</strong><small>{layer.detail}</small></div>
              {index < runtimeLayers.length - 1 && <i aria-hidden="true">↓</i>}
            </div>
          ))}
        </div>
        <aside className="mental-model">
          <span className="mini-label">最小闭环</span>
          <ol>
            <li><b>构建 Context</b><span>把历史、指令、工具与预算组合成模型输入。</span></li>
            <li><b>调用 Model</b><span>模型生成文本、事件或结构化 Tool Call。</span></li>
            <li><b>执行 Tool</b><span>Runtime 校验、授权、隔离并执行真实动作。</span></li>
            <li><b>追加 Observation</b><span>结果进入状态，再决定继续或停止。</span></li>
          </ol>
          <div className="model-note">
            <strong>最容易混淆的一点</strong>
            <p>模型“看到工具输出”发生在工具已经由 Runtime 执行之后；模型本身不会直接运行 Shell。</p>
          </div>
        </aside>
      </div>
    </section>
  );
}

function ChainSection() {
  const chains = [
    { name: "执行链", question: "实际发生了什么？", nodes: ["Job", "Attempt", "Model", "Tool", "Acceptance"], tone: "execution" },
    { name: "状态链", question: "状态如何演化？", nodes: ["Session", "Context", "Transcript", "Checkpoint", "Resume"], tone: "state" },
    { name: "信任链", question: "为什么允许执行？", nodes: ["Identity", "Policy", "Approval", "Sandbox", "Audit"], tone: "trust" },
  ];

  return (
    <section className="chain-section">
      <div className="shell">
        <div className="section-heading light-heading">
          <span className="section-index">THE UNIFIED LENS</span>
          <h2>三条链，统一评审任何 Agent</h2>
          <p>三条链必须在每一个外部副作用点汇合。</p>
        </div>
        <div className="chain-grid">
          {chains.map((chain) => (
            <article className={`chain-card ${chain.tone}`} key={chain.name}>
              <header><span>{chain.name}</span><small>{chain.question}</small></header>
              <div className="chain-nodes">
                {chain.nodes.map((node, index) => (
                  <span key={node}>{node}{index < chain.nodes.length - 1 && <i>→</i>}</span>
                ))}
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

function Journal({ reviewed, onToggle }: { reviewed: number[]; onToggle: (id: number) => void }) {
  const [query, setQuery] = useState("");
  const [domain, setDomain] = useState<"全部" | Domain>("全部");
  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return lessons.filter((lesson) => {
      const matchesDomain = domain === "全部" || lesson.domain === domain;
      const haystack = `${lesson.title} ${lesson.question} ${lesson.summary} ${lesson.takeaway}`.toLowerCase();
      return matchesDomain && (!needle || haystack.includes(needle));
    });
  }, [domain, query]);

  return (
    <section className="section shell" id="journal">
      <div className="section-heading split-heading">
        <div><span className="section-index">02 / JOURNAL</span><h2>18 课渐进学习路线</h2></div>
        <p>先尝试回答教学问题，再展开课程摘要。能独立讲清楚时，标记为已掌握。</p>
      </div>
      <div className="journal-toolbar">
        <label className="search-box">
          <span aria-hidden="true">⌕</span>
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="搜索课程或概念…" />
        </label>
        <div className="filter-row" aria-label="按领域筛选">
          {domains.map((item) => (
            <button className={domain === item ? "active" : ""} onClick={() => setDomain(item)} key={item}>{item}</button>
          ))}
        </div>
      </div>
      <p className="result-count">显示 {filtered.length} / {lessons.length} 节</p>
      <div className="lesson-grid">
        {filtered.map((lesson) => {
          const isReviewed = reviewed.includes(lesson.id);
          return (
            <article className={`lesson-card ${isReviewed ? "reviewed" : ""}`} key={lesson.id}>
              <div className="lesson-topline">
                <span className="lesson-number">{String(lesson.id).padStart(2, "0")}</span>
                <span className="domain-badge">{lesson.domain}</span>
                <button
                  className="review-toggle"
                  aria-pressed={isReviewed}
                  onClick={() => onToggle(lesson.id)}
                  title={isReviewed ? "取消已掌握" : "标记为已掌握"}
                >{isReviewed ? "✓ 已掌握" : "○ 待复习"}</button>
              </div>
              <h3>{lesson.title}</h3>
              <p className="teaching-question">{lesson.question}</p>
              <details>
                <summary>展开笔记 <span>＋</span></summary>
                <div className="lesson-detail">
                  <p>{lesson.summary}</p>
                  <div className="takeaway"><span>Engineer Takeaway</span>{lesson.takeaway}</div>
                  <code>{lesson.pointer}</code>
                </div>
              </details>
            </article>
          );
        })}
      </div>
      {filtered.length === 0 && <div className="empty-state">没有匹配的课程。试试更短的关键词。</div>}
    </section>
  );
}

function ReviewLab() {
  const [cardIndex, setCardIndex] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [submitted, setSubmitted] = useState(false);
  const card = flashcards[cardIndex];
  const score = quizQuestions.reduce((total, item, index) => total + (answers[index] === item.answer ? 1 : 0), 0);

  const moveCard = (offset: number) => {
    setCardIndex((current) => (current + offset + flashcards.length) % flashcards.length);
    setRevealed(false);
  };

  const resetQuiz = () => {
    setAnswers({});
    setSubmitted(false);
  };

  return (
    <section className="review-section" id="review">
      <div className="shell">
        <div className="section-heading light-heading">
          <span className="section-index">03 / ACTIVE RECALL</span>
          <h2>不要重读，先主动回忆</h2>
          <p>复习时先说出自己的答案，再点击卡片核对。</p>
        </div>
        <div className="review-layout">
          <article className="flashcard-panel">
            <div className="panel-title"><span>概念卡片</span><small>{cardIndex + 1} / {flashcards.length}</small></div>
            <button className={`flashcard ${revealed ? "revealed" : ""}`} onClick={() => setRevealed((value) => !value)} aria-expanded={revealed}>
              <span>{revealed ? "答案" : "问题"}</span>
              <strong>{revealed ? card.a : card.q}</strong>
              <small>{revealed ? "再次点击收起" : "想好后点击查看答案"}</small>
            </button>
            <div className="card-controls">
              <button onClick={() => moveCard(-1)}>← 上一张</button>
              <button onClick={() => moveCard(1)}>下一张 →</button>
            </div>
          </article>

          <article className="quiz-panel">
            <div className="panel-title"><span>快速自测</span><small>{quizQuestions.length} 题</small></div>
            <div className="quiz-list">
              {quizQuestions.map((item, questionIndex) => (
                <fieldset key={item.question}>
                  <legend><span>{questionIndex + 1}</span>{item.question}</legend>
                  {item.options.map((option, optionIndex) => {
                    const selected = answers[questionIndex] === optionIndex;
                    const correct = submitted && optionIndex === item.answer;
                    const wrong = submitted && selected && optionIndex !== item.answer;
                    return (
                      <button
                        className={`${selected ? "selected" : ""} ${correct ? "correct" : ""} ${wrong ? "wrong" : ""}`}
                        onClick={() => !submitted && setAnswers((current) => ({ ...current, [questionIndex]: optionIndex }))}
                        type="button"
                        key={option}
                      ><i />{option}</button>
                    );
                  })}
                  {submitted && <p className="explanation">{item.explanation}</p>}
                </fieldset>
              ))}
            </div>
            {submitted ? (
              <div className="quiz-result"><strong>{score} / {quizQuestions.length}</strong><span>{score === quizQuestions.length ? "概念已经形成闭环。" : "回到对应课程，重新解释错误选项。"}</span><button onClick={resetQuiz}>重新作答</button></div>
            ) : (
              <button className="button primary quiz-submit" disabled={Object.keys(answers).length < quizQuestions.length} onClick={() => setSubmitted(true)}>提交答案</button>
            )}
          </article>
        </div>
      </div>
    </section>
  );
}

function Sources() {
  return (
    <section className="section shell" id="sources">
      <div className="section-heading split-heading">
        <div><span className="section-index">04 / SOURCE MAP</span><h2>从学习笔记回到源码</h2></div>
        <p>页面只保留自己的理解与路径指针；最终判断应回到固定提交源码和官方文档。</p>
      </div>
      <div className="source-meta">
        <div><span>Repository</span><code>{baseline.repository}</code></div>
        <div><span>Release context</span><code>{baseline.release}</code></div>
        <div className="wide"><span>Fixed commit</span><code>{baseline.commit}</code></div>
      </div>
      <div className="source-grid">
        {sources.map((source) => (
          <a href={source.href} target="_blank" rel="noreferrer" key={source.label}>
            <span>↗</span><div><strong>{source.label}</strong><small>{source.detail}</small></div>
          </a>
        ))}
      </div>
      <div className="study-loop">
        <span>推荐复习循环</span>
        <div><b>01</b>用自己的话解释</div><i>→</i>
        <div><b>02</b>回到源码定位</div><i>→</i>
        <div><b>03</b>做最小实验</div><i>→</i>
        <div><b>04</b>注入一次故障</div>
      </div>
    </section>
  );
}

export function App() {
  const [reviewed, setReviewed] = useState<number[]>(readProgress);
  const progress = Math.round((reviewed.length / lessons.length) * 100);

  const toggleReviewed = (id: number) => {
    setReviewed((current) => {
      const next = current.includes(id) ? current.filter((item) => item !== id) : [...current, id];
      window.localStorage.setItem(progressKey, JSON.stringify(next));
      return next;
    });
  };

  return (
    <>
      <AppHeader progress={progress} />
      <main>
        <Hero reviewedCount={reviewed.length} />
        <RuntimeMap />
        <ChainSection />
        <Journal reviewed={reviewed} onToggle={toggleReviewed} />
        <ReviewLab />
        <Sources />
      </main>
      <footer>
        <div className="shell footer-inner">
          <div><span className="brand-mark small">π</span><p><strong>Pi Agent Runtime 学习日记</strong><small>理解系统，而不是背诵功能。</small></p></div>
          <div className="footer-links"><a href="https://github.com/SipengXie2024/pi-agent-learning-journal" target="_blank" rel="noreferrer">GitHub ↗</a><a href="#top">返回顶部 ↑</a></div>
        </div>
      </footer>
    </>
  );
}
