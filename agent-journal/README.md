# Pi Agent Runtime 学习日记

一个用于学习与复习 Pi Agent Runtime 的交互式中文站点。内容从最小 Agent Loop 出发，逐步进入 Context、Tool Runtime、Session、可靠性、分布式运行，以及执行链、状态链和信任链。

在线访问：<https://sipengxie2024.github.io/pi-agent-learning-journal/>

## 站点内容

- 18 节默认展开的完整课程讲义；
- 每课一张可渲染的 Mermaid 架构图；
- 教学问题、具体知识讲解和 Engineer Takeaway；
- 左侧课程目录与当前章节定位；
- 执行链、状态链与信任链统一框架；
- 固定版本的源码入口。

## 数据基线

- Repository：`earendil-works/pi`
- Release context：`v0.80.6`
- Commit：`8479bd84743e8889f728acb21a62794102db0529`
- 远程复核日期：`2026-07-13`

页面不复制 Pi 源码，仅提供自己的学习摘要与源码路径。Pi 的实现结论应以固定提交和官方文档为准。

## 本地运行

需要 Node.js 22.13 或更高版本。

```bash
npm install
npm run dev
```

生产构建：

```bash
npm run build
```

## 更新课程

课程正文分别位于 `src/lessons-core.ts`、`src/lessons-runtime.ts` 与 `src/lessons-systems.ts`。页面组件位于 `src/App.tsx`，视觉样式位于 `src/styles/`。

## 部署

推送到 `main` 后，GitHub Actions 会构建站点并发布到 GitHub Pages。

## License

[MIT](LICENSE)
