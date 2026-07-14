export type Domain =
  | "执行内核"
  | "上下文与状态"
  | "模型与工具"
  | "安全与扩展"
  | "可靠性"
  | "分布式运行"
  | "综合方法";

export type Lesson = {
  id: number;
  title: string;
  domain: Domain;
  question: string;
  summary: string;
  takeaway: string;
  pointer: string;
};

export const baseline = {
  repository: "earendil-works/pi",
  release: "v0.80.6",
  commit: "8479bd84743e8889f728acb21a62794102db0529",
  verifiedAt: "2026-07-13",
};

export const domains: Array<"全部" | Domain> = [
  "全部",
  "执行内核",
  "上下文与状态",
  "模型与工具",
  "安全与扩展",
  "可靠性",
  "分布式运行",
  "综合方法",
];

export const lessons: Lesson[] = [
  {
    id: 1,
    title: "Agent Loop",
    domain: "执行内核",
    question: "为什么 Agent 不是一次 LLM API 调用？",
    summary:
      "模型先产生结构化 Tool Call，Runtime 校验并执行工具，再把 Tool Result 作为 Observation 放回下一次模型请求，直到满足停止条件。",
    takeaway: "模型负责提出动作，Runtime 负责让动作真实发生。",
    pointer: "packages/agent/src/agent-loop.ts",
  },
  {
    id: 2,
    title: "Stateful Agent Wrapper",
    domain: "执行内核",
    question: "Agent 对象比 Loop 多管理了什么？",
    summary:
      "Agent Wrapper 保存消息、当前运行状态、事件订阅、模型与工具配置，并把一次次 Turn 交给 Loop。它是可交互对象，不只是函数。",
    takeaway: "Loop 是控制算法，Agent Wrapper 是有状态的运行入口。",
    pointer: "packages/agent/src/agent.ts",
  },
  {
    id: 3,
    title: "Session、Transcript 与 Context",
    domain: "上下文与状态",
    question: "模型看到的 Context 等于完整会话吗？",
    summary:
      "Transcript 保存 Session 历史；Context Builder 根据指令、分支、工具与预算构造本次 Model Request 的有限视图。二者不能混为一谈。",
    takeaway: "Transcript 是历史，Context 是一次请求的投影视图。",
    pointer: "packages/coding-agent/src/core/",
  },
  {
    id: 4,
    title: "Context Compaction",
    domain: "上下文与状态",
    question: "压缩为什么不是简单删除旧消息？",
    summary:
      "压缩需要选择安全前缀、保持 Tool Call 与 Tool Result 配对、生成摘要、验证预算，并保留未完成任务与关键约束。",
    takeaway: "Compaction 是带协议不变量的状态迁移。",
    pointer: "packages/coding-agent/src/core/compaction/",
  },
  {
    id: 5,
    title: "Tool Runtime",
    domain: "模型与工具",
    question: "模型输出工具 JSON 后，谁真正执行？",
    summary:
      "Tool Runtime 负责 Registry、Schema、参数校验、Permission、Dispatch、Timeout、Cancellation、结果归一化与回传。",
    takeaway: "Tool Call 是执行意图，不是执行成功。",
    pointer: "packages/coding-agent/src/core/tools/",
  },
  {
    id: 6,
    title: "Permission、Approval 与 Sandbox",
    domain: "安全与扩展",
    question: "用户点了允许，为什么操作仍可能失败？",
    summary:
      "Permission 判断规则，Approval 表示具体授权，Sandbox 用操作系统边界强制限制资源。三者独立，而且 Sandbox 拥有最终物理否决权。",
    takeaway: "允许尝试，不等于能够越过隔离边界。",
    pointer: "packages/coding-agent/docs/security.md",
  },
  {
    id: 7,
    title: "Extension Runtime",
    domain: "安全与扩展",
    question: "扩展如何改变 Agent，而不改写核心 Loop？",
    summary:
      "Extension、Skill、Package 与自定义 Provider 在不同生命周期点注入工具、提示、事件处理和模型适配；加载能力不自动获得执行权限。",
    takeaway: "扩展面决定可塑性，信任边界决定代价。",
    pointer: "packages/coding-agent/src/core/extensions/",
  },
  {
    id: 8,
    title: "Model Runtime",
    domain: "模型与工具",
    question: "统一模型接口需要吸收哪些差异？",
    summary:
      "Provider Adapter 归一请求、流事件、Tool Call、错误与能力；Router 再处理模型选择、Retry、Fallback 和凭据。",
    takeaway: "统一接口的价值在语义归一，不在隐藏所有差异。",
    pointer: "packages/ai/",
  },
  {
    id: 9,
    title: "CLI、TUI、Print、JSON、RPC 与 SDK",
    domain: "执行内核",
    question: "多个产品入口是否意味着多个 Runtime？",
    summary:
      "这些入口服务不同消费者：人类交互、一次性自动化、结构化事件、长期进程控制与应用嵌入；核心执行语义应尽量共享。",
    takeaway: "Surface 是适配层，不应偷偷复制 Agent Loop。",
    pointer: "packages/coding-agent/src/modes/",
  },
  {
    id: 10,
    title: "Graceful Shutdown",
    domain: "可靠性",
    question: "收到退出信号后为什么不能立刻结束进程？",
    summary:
      "Runtime 需要停止接收新工作、关闭 Producer、排空或取消进行中的操作、持久化终态，再关闭传输与资源。",
    takeaway: "退出成功的判定点是状态已提交，不是信号已收到。",
    pointer: "packages/orchestrator/src/supervisor.ts",
  },
  {
    id: 11,
    title: "Crash Recovery",
    domain: "可靠性",
    question: "重启进程为什么不等于恢复任务？",
    summary:
      "恢复需要加载有效 Checkpoint、重放 Transcript 尾部、识别不完整 Tool Call，并对外部副作用去重、补偿或标记未知。",
    takeaway: "Recovery 恢复的是一致性，而不是进程数量。",
    pointer: "packages/coding-agent/src/core/session-manager.ts",
  },
  {
    id: 12,
    title: "Idempotency 与重复执行",
    domain: "可靠性",
    question: "工具成功后进程崩溃，能否安全重试？",
    summary:
      "稳定 Operation ID、效果账本和 Reconciliation 共同处理模糊结果。Exactly-once 很难跨越外部系统，通常需要安全的 at-least-once。",
    takeaway: "重试之前，先问上一次是否可能已经产生副作用。",
    pointer: "Effect Ledger / operation_id design",
  },
  {
    id: 13,
    title: "Multi-Agent Delegation",
    domain: "分布式运行",
    question: "Subagent、Worker、Delegation 与 Handoff 有何区别？",
    summary:
      "Subagent 有独立执行上下文；Worker 只是执行单元；Delegation 保留父级责任；Handoff 则转移后续控制权。",
    takeaway: "多 Agent 的核心不是数量，而是所有权和责任协议。",
    pointer: "packages/orchestrator/",
  },
  {
    id: 14,
    title: "Provider Routing、Fallback 与 Credential Pool",
    domain: "模型与工具",
    question: "模型调用失败时，切换模型为什么可能改变任务语义？",
    summary:
      "Router 根据能力、策略与健康度选择 Provider；Fallback 必须记录能力变化；Credential Pool 管理配额、轮换与隔离。",
    takeaway: "Fallback 是有语义成本的状态迁移，不是透明重试。",
    pointer: "packages/ai/src/",
  },
  {
    id: 15,
    title: "Background Task、Cron 与 Webhook",
    domain: "分布式运行",
    question: "没有用户盯着终端时，谁拥有任务？",
    summary:
      "Cron 和 Webhook 只产生 Trigger；Durable Job 保存执行意图；Worker 通过 Lease 运行 Attempt；结果需要独立验收与交付。",
    takeaway: "触发器不是 Runtime，也不是可靠任务系统。",
    pointer: "packages/orchestrator/src/ipc/protocol.ts",
  },
  {
    id: 16,
    title: "Queue、Worker、Actor 与 Backpressure",
    domain: "分布式运行",
    question: "为什么不能每来一个事件就启动一个 Agent？",
    summary:
      "Queue 保存工作，Worker 提供算力，Actor 串行保护 Session 或工作区状态，Backpressure 在容量不足时限制上游。",
    takeaway: "并发上限必须跟随最稀缺的下游资源。",
    pointer: "packages/orchestrator/src/",
  },
  {
    id: 17,
    title: "Observability、Tracing 与 Audit",
    domain: "可靠性",
    question: "怎样证明 Agent 为什么执行了某个动作？",
    summary:
      "Trace 连接 Job、Attempt、Model Request 与 Tool Call；Metrics 展示整体健康；Audit 记录身份、策略、审批、动作与结果。",
    takeaway: "模型的自我解释不能替代 Runtime 证据。",
    pointer: "packages/coding-agent/docs/rpc.md",
  },
  {
    id: 18,
    title: "执行链、状态链与信任链",
    domain: "综合方法",
    question: "如何用一个框架评审任意 Agent Runtime？",
    summary:
      "执行链证明发生了什么，状态链证明从何处演化，信任链证明依据什么授权。三条链应在每个外部副作用点汇合。",
    takeaway: "生产级可靠性，是让三条证据链在副作用点闭环。",
    pointer: "Unified review framework",
  },
];

export const runtimeLayers = [
  { name: "产品入口", detail: "CLI · TUI · Print · JSON · RPC · SDK", tone: "neutral" },
  { name: "Session 与生命周期", detail: "Turn · Cancellation · Shutdown", tone: "neutral" },
  { name: "Agent 执行内核", detail: "Agent Loop · Streaming · Stop Condition", tone: "core" },
  { name: "Context 与状态", detail: "Builder · Compaction · Transcript · Checkpoint", tone: "state" },
  { name: "Model 与 Tool Runtime", detail: "Provider Adapter · Registry · Dispatch", tone: "model" },
  { name: "Policy 与隔离", detail: "Permission · Approval · Sandbox", tone: "trust" },
  { name: "Durable 与可观测性", detail: "Queue · Effect Ledger · Trace · Audit", tone: "durable" },
];

export const flashcards = [
  { q: "Tool Call 是否表示工具已经执行？", a: "不是。它只是模型或 Runtime 提出的结构化执行意图；只有 Tool Runtime 的结果才能证明尝试发生。" },
  { q: "Turn、Step 和 Attempt 如何区分？", a: "Turn 是一次外部输入到终态；Step 是一次构建 Context 到消费模型结果；Attempt 是同一逻辑操作的一次具体尝试。" },
  { q: "Context 与 Transcript 最大的区别是什么？", a: "Transcript 是 Session 历史；Context 是某次 Model Request 实际携带的有限、有序视图。" },
  { q: "Permission、Approval、Sandbox 谁负责什么？", a: "Permission 求值规则，Approval 表示授权决定，Sandbox 使用系统机制强制资源边界。" },
  { q: "Compaction 必须保持什么？", a: "任务约束、因果顺序、未完成工作，以及 Tool Call 与 Tool Result 的协议配对。" },
  { q: "Checkpoint 为什么不等于随手保存文件？", a: "Checkpoint 必须对应可恢复的一致性点，并记录 Transcript Cursor 与版本。" },
  { q: "为什么 Exactly-once 很难？", a: "外部副作用可能成功，但 Runtime 在记录成功前崩溃；恢复者无法仅凭本地状态判断。" },
  { q: "Actor 与 Worker 的核心区别？", a: "Worker 提供执行能力；Actor 拥有私有状态并通过 Mailbox 串行处理消息。" },
  { q: "Webhook 应在什么时候返回成功？", a: "验证并把 Job 持久化后即可确认接收；不应等待完整 Agent 运行结束。" },
  { q: "三条链分别证明什么？", a: "执行链证明做了什么，状态链证明如何演化，信任链证明为什么被允许。" },
];

export const quizQuestions = [
  {
    question: "模型返回一个 shell Tool Call 后，下一步最准确的是？",
    options: ["命令已经成功", "Runtime 校验并决定是否执行", "Session 已经完成", "必须进行 Context Compaction"],
    answer: 1,
    explanation: "Tool Call 是意图；校验、策略、Sandbox 与执行仍由 Runtime 完成。",
  },
  {
    question: "哪项最适合作为同一 Session 的并发控制边界？",
    options: ["每个 Token", "Actor / 串行 Mailbox", "无限 Worker", "Provider 凭据"],
    answer: 1,
    explanation: "Session 是有序可变状态，Actor 能明确唯一所有者和线性化顺序。",
  },
  {
    question: "工具产生副作用后 Worker 崩溃，Job 应优先进入？",
    options: ["SUCCEEDED", "直接 RETRY", "UNKNOWN / RECONCILING", "删除 Transcript"],
    answer: 2,
    explanation: "副作用结果不确定时必须先对账，避免重复执行。",
  },
  {
    question: "下列哪项不能由模型最终文本证明？",
    options: ["模型生成了这段文本", "工具真实执行", "回答内容存在", "模型已停止生成"],
    answer: 1,
    explanation: "工具执行需要 Tool Runtime、外部状态或验收记录提供证据。",
  },
  {
    question: "Fallback 与 Retry 的主要区别是？",
    options: ["Fallback 一定更快", "Retry 不使用网络", "Fallback 改变执行路线或能力", "二者完全相同"],
    answer: 2,
    explanation: "Fallback 可能切换 Provider、Model 或 Transport，因此需要记录语义变化。",
  },
  {
    question: "生产级 Agent 的最终成功应由谁判定？",
    options: ["模型自述", "UI 动画", "独立 Acceptance Check", "日志行数"],
    answer: 2,
    explanation: "验收条件应独立检查产物、测试或外部状态，并持久化结果。",
  },
];

const sourceRoot = `https://github.com/${baseline.repository}/blob/${baseline.commit}`;

export const sources = [
  { label: "Pi 官方文档", detail: "产品概览与公开能力", href: "https://pi.dev/docs/latest" },
  { label: "Agent Loop", detail: "核心循环与 Tool Result 回注", href: `${sourceRoot}/packages/agent/src/agent-loop.ts` },
  { label: "Agent Wrapper", detail: "状态、事件与运行入口", href: `${sourceRoot}/packages/agent/src/agent.ts` },
  { label: "Agent Types", detail: "消息、事件与运行协议", href: `${sourceRoot}/packages/agent/src/types.ts` },
  { label: "Model Runtime", detail: "统一 Provider API", href: `${sourceRoot}/packages/ai` },
  { label: "Print Mode", detail: "一次性与 JSON 输出入口", href: `${sourceRoot}/packages/coding-agent/src/modes/print-mode.ts` },
  { label: "RPC Protocol", detail: "Headless JSONL 控制与事件流", href: `${sourceRoot}/packages/coding-agent/docs/rpc.md` },
  { label: "Experimental Orchestrator", detail: "实例监督与 RPC 路由", href: `${sourceRoot}/packages/orchestrator` },
];
