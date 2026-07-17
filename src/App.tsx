import { useEffect, useRef, useState } from "react";
import type { RefObject } from "react";
import { baseline, chapters, lessons, sourceLinks } from "./content";
import type { Lesson } from "./lesson-types";

let mermaidPromise: Promise<(typeof import("mermaid"))["default"]> | undefined;

function loadMermaid() {
  mermaidPromise ??= import("mermaid").then(({ default: instance }) => {
    instance.initialize({
      startOnLoad: false,
      securityLevel: "strict",
      theme: "base",
      themeVariables: {
        background: "#ffffff",
        primaryColor: "#e6f0eb",
        primaryTextColor: "#171918",
        primaryBorderColor: "#116149",
        lineColor: "#657069",
        secondaryColor: "#f4e9e3",
        tertiaryColor: "#f4f5f2",
        noteBkgColor: "#fff7dd",
        noteTextColor: "#282b29",
        noteBorderColor: "#a84321",
        fontFamily: 'Inter, "Segoe UI", "Microsoft YaHei", sans-serif',
        fontSize: "15px",
      },
      flowchart: { curve: "basis", htmlLabels: true },
      sequence: { useMaxWidth: true, wrap: true },
    });
    return instance;
  });
  return mermaidPromise;
}

let diagramSequence = 0;

function MermaidDiagram({ title, chart }: { title: string; chart: string }) {
  const figureRef = useRef<HTMLElement>(null);
  const [visible, setVisible] = useState(false);
  const [svg, setSvg] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    const figure = figureRef.current;
    if (!figure) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { rootMargin: "420px 0px" },
    );
    observer.observe(figure);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!visible) return;
    let active = true;
    const id = `pi-mermaid-${++diagramSequence}`;
    setSvg("");
    setError("");
    loadMermaid()
      .then((instance) => instance.render(id, chart))
      .then((result) => active && setSvg(result.svg))
      .catch((reason: unknown) => active && setError(reason instanceof Error ? reason.message : "图表渲染失败"));
    return () => {
      active = false;
    };
  }, [chart, visible]);

  return (
    <figure className="diagram-block" ref={figureRef}>
      <figcaption><span>MERMAID</span>{title}</figcaption>
      {svg ? (
        <div className="mermaid-output" dangerouslySetInnerHTML={{ __html: svg }} />
      ) : error ? (
        <div className="diagram-error"><strong>图表未能渲染</strong><pre>{chart}</pre></div>
      ) : (
        <div className="diagram-loading" role="status">正在绘制架构图...</div>
      )}
    </figure>
  );
}

function Header({ activeLesson, progressRef }: { activeLesson: number; progressRef: RefObject<HTMLSpanElement | null> }) {
  return (
    <header className="site-header">
      <div className="header-inner">
        <a className="brand" href="#top" aria-label="返回首页顶部">
          <span className="brand-mark" aria-hidden="true">π</span>
          <span><strong>Pi Runtime</strong><small>Learning Journal</small></span>
        </a>
        <nav aria-label="主导航">
          <a href="#course">课程</a>
          <a href="#lesson-4">Compaction</a>
          <a href="#lesson-18">统一框架</a>
          <a href="#sources">源码</a>
        </nav>
        <div className="header-actions">
          <span className="header-position">LESSON {String(activeLesson).padStart(2, "0")} / 18</span>
          <a className="github-link" href="https://github.com/SipengXie2024/pi-agent-learning-journal" target="_blank" rel="noreferrer">GitHub</a>
        </div>
      </div>
      <div className="reading-progress" aria-hidden="true"><span ref={progressRef} /></div>
    </header>
  );
}

function Hero() {
  return (
    <section className="hero shell" id="top">
      <div className="hero-copy">
        <span className="eyebrow"><i />Source-grounded field guide</span>
        <h1>Pi Agent Runtime<br /><em>学习日记</em></h1>
        <p>
          从 Agent Loop 出发，逐课进入 Context、Tool Runtime、可靠性、分布式调度与三条证据链。
          每一课都直接给出问题、知识讲解、架构图和工程结论。
        </p>
        <div className="hero-actions">
          <a className="action primary" href="#course">开始阅读</a>
          <a className="action" href="#sources">查看源码基线</a>
        </div>
      </div>
      <dl className="hero-meta">
        <div><dt>完整讲义</dt><dd>18<small>lessons</small></dd></div>
        <div><dt>架构图解</dt><dd>18<small>diagrams</small></dd></div>
        <div><dt>固定版本</dt><dd>{baseline.release}<small>{baseline.commit.slice(0, 9)}</small></dd></div>
      </dl>
    </section>
  );
}

function CourseSidebar({ activeLesson }: { activeLesson: number }) {
  const jumpToLesson = (lessonId: number) => {
    window.location.hash = `lesson-${lessonId}`;
  };

  return (
    <aside className="course-sidebar" aria-label="课程目录">
      <div className="sidebar-title">
        <span>COURSE INDEX</span>
        <strong>课程目录</strong>
      </div>
      <div className="sidebar-progress">
        <span>当前阅读</span>
        <strong>{String(activeLesson).padStart(2, "0")}<small>/ 18</small></strong>
      </div>
      <label className="mobile-course-picker" htmlFor="lesson-picker">
        <span>快速跳转</span>
        <select id="lesson-picker" value={activeLesson} onChange={(event) => jumpToLesson(Number(event.target.value))}>
          {lessons.map((lesson) => <option value={lesson.id} key={lesson.id}>{String(lesson.id).padStart(2, "0")} / {lesson.title}</option>)}
        </select>
      </label>
      <div className="desktop-course-index">
        {chapters.map((chapter) => (
          <section key={chapter.label}>
            <header><span>{chapter.range}</span>{chapter.label}</header>
            <ol>
              {chapter.lessonIds.map((id) => {
                const lesson = lessons.find((item) => item.id === id)!;
                const active = activeLesson === id;
                return (
                  <li className={active ? "active" : ""} key={id}>
                    <a href={`#lesson-${id}`} aria-current={active ? "location" : undefined}>
                      <span>{String(id).padStart(2, "0")}</span>{lesson.title.split("：")[0]}
                    </a>
                  </li>
                );
              })}
            </ol>
          </section>
        ))}
      </div>
    </aside>
  );
}

function ChapterOverview() {
  return (
    <nav className="chapter-overview" aria-label="课程分章">
      {chapters.map((chapter) => (
        <a href={`#lesson-${chapter.lessonIds[0]}`} key={chapter.label}>
          <span>{chapter.range}</span>
          <strong>{chapter.label}</strong>
          <small>{chapter.lessonIds.length} lessons</small>
        </a>
      ))}
    </nav>
  );
}

function LessonArticle({ lesson }: { lesson: Lesson }) {
  return (
    <article className="lesson" id={`lesson-${lesson.id}`}>
      <header className="lesson-header">
        <div className="lesson-kicker"><span>LESSON {String(lesson.id).padStart(2, "0")}</span><i />{lesson.domain}</div>
        <h2>{lesson.title}</h2>
        <p className="lesson-lead">{lesson.lead}</p>
      </header>

      <div className="teaching-question">
        <span>教学问题</span>
        <strong>{lesson.question}</strong>
      </div>

      <div className="lesson-body">
        {lesson.sections.map((section, index) => (
          <section className="knowledge-section" key={section.title}>
            <div className="knowledge-index">{lesson.id}.{index + 1}</div>
            <div>
              <h3>{section.title}</h3>
              {section.paragraphs.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
              {section.bullets && <ul>{section.bullets.map((bullet) => <li key={bullet}>{bullet}</li>)}</ul>}
              {section.code && <pre className="code-block"><code>{section.code}</code></pre>}
            </div>
          </section>
        ))}
      </div>

      <MermaidDiagram title={lesson.diagram.title} chart={lesson.diagram.chart} />

      <div className="engineer-takeaway">
        <span>ENGINEER TAKEAWAY</span>
        <strong>{lesson.takeaway}</strong>
      </div>

      <footer className="lesson-sources">
        <span>源码与设计入口</span>
        <div>{lesson.sourcePointers.map((pointer) => <code key={pointer}>{pointer}</code>)}</div>
      </footer>
    </article>
  );
}

function SourceMap() {
  return (
    <section className="source-section" id="sources">
      <span className="section-label">SOURCE MAP</span>
      <h2>继续回到源码验证</h2>
      <p>课程文字用于建立心智模型；实现细节仍应回到固定提交和官方文档。本站不复制 Pi 源码。</p>
      <dl className="baseline-grid">
        <div><dt>Repository</dt><dd><code>{baseline.repository}</code></dd></div>
        <div><dt>Release context</dt><dd><code>{baseline.release}</code></dd></div>
        <div><dt>Fixed commit</dt><dd><code>{baseline.commit}</code></dd></div>
        <div><dt>Verified</dt><dd><code>{baseline.verifiedAt}</code></dd></div>
      </dl>
      <div className="source-links">
        {sourceLinks.map((source) => (
          <a href={source.href} target="_blank" rel="noreferrer" key={source.label}><span aria-hidden="true">↗</span>{source.label}</a>
        ))}
      </div>
    </section>
  );
}

export function App() {
  const [activeLesson, setActiveLesson] = useState(1);
  const progressRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)[0];
        if (visible) setActiveLesson(Number(visible.target.id.replace("lesson-", "")));
      },
      { rootMargin: "-18% 0px -68% 0px", threshold: 0 },
    );
    lessons.forEach((lesson) => {
      const element = document.getElementById(`lesson-${lesson.id}`);
      if (element) observer.observe(element);
    });
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    let frame = 0;
    const updateProgress = () => {
      frame = 0;
      const root = document.documentElement;
      const distance = root.scrollHeight - root.clientHeight;
      const progress = distance > 0 ? Math.min(root.scrollTop / distance, 1) : 0;
      if (progressRef.current) progressRef.current.style.transform = `scaleX(${progress})`;
    };
    const scheduleUpdate = () => {
      if (!frame) frame = window.requestAnimationFrame(updateProgress);
    };
    updateProgress();
    window.addEventListener("scroll", scheduleUpdate, { passive: true });
    window.addEventListener("resize", scheduleUpdate);
    return () => {
      window.removeEventListener("scroll", scheduleUpdate);
      window.removeEventListener("resize", scheduleUpdate);
      if (frame) window.cancelAnimationFrame(frame);
    };
  }, []);

  return (
    <>
      <a className="skip-link" href="#course">跳到课程正文</a>
      <Header activeLesson={activeLesson} progressRef={progressRef} />
      <main>
        <Hero />
        <div className="course-shell shell" id="course">
          <CourseSidebar activeLesson={activeLesson} />
          <div className="course-content">
            <div className="course-intro">
              <span className="section-label">READING MODE</span>
              <h2>按顺序读，也可以从目录跳转</h2>
              <p>每课先给出一个必须回答的问题，再展开概念边界、执行过程、失败路径与架构图。所有内容默认展开，不需要点击卡片。</p>
              <ChapterOverview />
            </div>
            {lessons.map((lesson) => <LessonArticle lesson={lesson} key={lesson.id} />)}
            <SourceMap />
          </div>
        </div>
      </main>
      <footer className="site-footer">
        <div className="shell">
          <div><span className="brand-mark small" aria-hidden="true">π</span><p><strong>Pi Agent Runtime 学习日记</strong><small>理解执行、状态与信任，而不是背诵功能。</small></p></div>
          <div className="footer-links"><a href="https://sipengxie2024.github.io/">Sipeng Xie</a><a href="#top">返回顶部 ↑</a></div>
        </div>
      </footer>
    </>
  );
}
