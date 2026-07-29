import type { Lesson } from "./lesson-types";

export const systemsLessons: Lesson[] = [
  {
    id: 13,
    title: "Multi-Agent Delegation：数量之外的所有权问题",
    domain: "多 Agent",
    question: "Subagent、Worker、Delegation 与 Handoff 有什么区别？",
    lead: "多 Agent 不是简单并发调用多个模型。每个参与者都需要身份、输入、状态边界、结果协议和明确的最终责任人。",
    sections: [
      {
        title: "四个术语代表不同关系",
        paragraphs: ["Subagent 是具有独立执行上下文的 Agent；Worker 只是执行被分配工作的单元；Delegation 中父 Agent 仍对最终结果负责；Handoff 则把后续控制权转移给另一个 Agent 或 Surface。"],
      },
      {
        title: "委派协议需要足够具体",
        paragraphs: ["子任务至少应包含目标、输入快照、允许工具、工作区、预算、截止时间和期望输出。仅传一句自然语言，很难在失败后判断责任边界。"],
        bullets: [
          "父 Agent 是否能取消子 Agent？",
          "子 Agent 能否创建更多 Subagent？",
          "文件和 Session 是共享、复制还是隔离？",
          "冲突结果由父 Agent、规则还是独立 Reviewer 仲裁？",
        ],
      },
      {
        title: "并行结果必须经过 Barrier",
        paragraphs: ["多个 Subagent 并行完成后，父 Agent 不能按“最先返回”直接决定答案。应等待规定集合进入终态，再根据证据来源、置信度和冲突规则合并。"],
      },
    ],
    diagram: {
      title: "Delegation、Barrier 与结果仲裁",
      chart: `flowchart TD
    P["Parent Agent owns final responsibility"] --> D["Create bounded tasks"]
    D --> A1["Subagent: research"]
    D --> A2["Subagent: implementation"]
    D --> A3["Subagent: review"]
    A1 -. result and provenance .-> B["Completion Barrier"]
    A2 -. result and provenance .-> B
    A3 -. result and provenance .-> B
    B --> C{"Conflicts?"}
    C -->|No| M["Merge result"]
    C -->|Yes| R["Arbitrate or request more evidence"]
    R --> M
    M --> P`,
    },
    takeaway: "多 Agent 的核心不是启动多少实例，而是谁拥有状态、结果与失败责任。",
    sourcePointers: ["packages/orchestrator/", "Subagent and delegation integration points"],
  },
  {
    id: 14,
    title: "Provider Routing、Fallback 与 Credential Pool",
    domain: "模型运行时",
    question: "模型调用失败时，为什么不能随便换一个模型继续？",
    lead: "Router、Fallback 和 Credential Pool 共同决定请求去哪里，但它们分别处理能力选择、执行路线变化和凭据资源管理。",
    sections: [
      {
        title: "Router 先判断任务需求",
        paragraphs: ["选择模型不能只看名称。Router 需要考虑 Tool Calling、视觉、Context Window、推理能力、成本、延迟、数据边界和组织策略。"],
      },
      {
        title: "Fallback 会改变语义",
        paragraphs: ["从一个模型切换到另一个模型，可能失去某些 Tool Schema、Prompt Cache、推理模式或上下文长度。Runtime 应把这种变化记录为新的 Route Decision，而不是伪装成透明 Retry。"],
        bullets: [
          "能力不兼容时立即拒绝，而不是运行到中途才失败。",
          "Fallback 后重新检查 Token Budget 和工具能力。",
          "模型身份变化要进入 Trace、Transcript 或 Audit。",
          "不要在同一次 Attempt 中无限切换 Route。",
        ],
      },
      {
        title: "Credential Pool 不是简单 Key 列表",
        paragraphs: ["凭据需要跟踪 Provider、租户、配额、刷新时间、健康状态和隔离域。遇到 429 时，Router 还要区分模型级限流、账号配额和全局服务故障。"],
      },
    ],
    diagram: {
      title: "请求路由、凭据选择与 Fallback",
      chart: `flowchart LR
    Q["Model Request requirements"] --> R["Provider Router"]
    R --> C{"Capability and policy match"}
    C -->|Route A| A["Provider Adapter A"]
    C -->|Route B| B["Provider Adapter B"]
    K[("Credential Pool")] --> A
    K --> B
    A --> P1["Provider A"]
    B --> P2["Provider B"]
    P1 -. normalized error .-> F{"Retry or Fallback"}
    P2 -. normalized error .-> F
    F -->|Retry same route| R
    F -->|Change route and semantics| C`,
    },
    takeaway: "Fallback 是一次有语义成本的路由变更，Credential Pool 则是受控的资源与身份系统。",
    sourcePointers: ["packages/ai/", "Provider adapter and model registry paths"],
  },
  {
    id: 15,
    title: "Background Task、Cron 与 Webhook",
    domain: "长期运行",
    question: "没有用户盯着终端时，谁负责保证任务继续？",
    lead: "Cron 和 Webhook 只是产生 Trigger；Background Job 才是需要持久化、重试、取消和交付结果的工作对象。Agent Runtime 只是执行引擎。",
    sections: [
      {
        title: "Trigger、Job、Attempt 与 Session 要分开",
        paragraphs: ["Trigger 解释为什么现在执行；Job 保存要完成的业务意图；Attempt 表示某次具体尝试；Session 保存 Agent 上下文。一个 Job 可以有多个 Attempt，也可以创建或恢复一个 Session。"],
      },
      {
        title: "Webhook 应先持久化再响应",
        paragraphs: ["入口验证签名、时间窗和 event_id，完成去重并把 Job 写入 Durable Store 后即可返回 202。等待 Agent 完整运行会放大超时重投和重复执行。"],
        bullets: [
          "Cron：明确 overlap、catch-up、时区和 misfire 策略。",
          "Webhook：验证签名、重放窗口和稳定 event_id。",
          "Headless：预先配置 Policy，不能无限等待终端审批。",
          "Result：写入独立结果存储，再通知调用方。",
        ],
        code: "trigger_id: github-delivery-123\njob_id: J42\nattempt_id: A1\nsession_policy: new\nidempotency_key: issue-17-analysis",
      },
      {
        title: "后台执行仍需要独立验收",
        paragraphs: ["模型最终文本、Tool Result 和业务成功是三层不同状态。Job Controller 应检查产物、测试或远端状态，再把 Job 标记为成功。"],
      },
    ],
    diagram: {
      title: "Trigger 到 Background Job 的执行路径",
      chart: `flowchart LR
    C["Cron"] --> I["Trigger Adapter"]
    W["Webhook"] --> I
    API["API / CLI"] --> I
    I --> J[("Durable Job Store")]
    J -. queued .-> Q["Queue"]
    Q -. lease .-> WK["Worker"]
    WK --> P["Pi Print / RPC / SDK"]
    P --> T["Tool Runtime"]
    P ==> S[("Session and Transcript")]
    WK ==> R[("Result and Audit")]
    R -. notification .-> API`,
    },
    takeaway: "触发器只创建执行意图；可靠后台任务需要持久化 Job 所有权和结果交付。",
    sourcePointers: ["packages/coding-agent/src/modes/print-mode.ts", "packages/coding-agent/docs/rpc.md", "packages/orchestrator/"],
  },
  {
    id: 16,
    title: "Queue、Worker、Actor 与 Backpressure",
    domain: "并发与调度",
    question: "为什么不能每来一个 Webhook 就启动一个 Agent？",
    lead: "系统吞吐量受最慢的下游资源限制。Queue、Worker、Actor 和 Backpressure 分别负责缓冲工作、提供算力、保护状态和控制过载。",
    sections: [
      {
        title: "四个角色回答不同问题",
        paragraphs: ["Queue 回答暂时执行不了的 Job 放在哪里；Worker 回答谁执行 Attempt；Actor 回答谁唯一拥有这份状态；Backpressure 回答下游满载时如何让上游减速。"],
      },
      {
        title: "Coding Agent 天然需要状态串行化",
        paragraphs: ["Session Transcript、Git 工作区和当前 Agent Loop 都是有序可变状态。同一 Session 或同一可写工作区通常应映射到一个 Actor Key，通过 Mailbox 顺序处理消息。"],
        bullets: [
          "同一 Session：只允许一个活动 Turn。",
          "同一工作区：写操作串行，避免 Git 和文件冲突。",
          "不同隔离 Worktree：可以在全局配额内并行。",
          "等待人工 Approval 时释放 Worker，而不是占住计算资源。",
        ],
      },
      {
        title: "无限 Queue 只是延迟故障",
        paragraphs: ["若每分钟到达 10 个 Job，而系统只能完成 6 个，积压会每分钟增加 4 个。背压需要限制入口、Queue 长度、Worker 并发、Provider 请求和工具进程。"],
      },
    ],
    diagram: {
      title: "Queue、Worker、Actor 与容量反馈",
      chart: `flowchart LR
    I["Ingress"] --> A{"Admission control"}
    A -->|accepted| Q[("Durable Queue")]
    A -->|delay or reject| B["Backpressure response"]
    Q -. lease .-> W["Worker Pool"]
    W --> R["Actor Router"]
    R --> A1["Actor: workspace A"]
    R --> A2["Actor: workspace B"]
    A1 --> P["Agent Runtime"]
    A2 --> P
    P --> M["Model capacity limit"]
    P --> T["Tool capacity limit"]
    M -. capacity feedback .-> A
    T -. capacity feedback .-> A`,
    },
    takeaway: "Queue 保存工作，Worker 提供算力，Actor 保护状态，Backpressure 保护整个系统。",
    sourcePointers: ["packages/orchestrator/src/ipc/protocol.ts", "packages/orchestrator/src/types.ts"],
  },
  {
    id: 17,
    title: "Observability、Tracing 与 Audit",
    domain: "可观测性",
    question: "Agent 做错事后，怎样不依赖它自己的解释重建现场？",
    lead: "Logs 记录事件，Metrics 展示整体趋势，Trace 连接一次执行的因果路径，Audit 则证明谁在什么规则下执行了什么动作。",
    sections: [
      {
        title: "不同 ID 代表不同语义",
        paragraphs: ["job_id 代表稳定工作，attempt_id 区分重试，trace_id 连接本次因果链，session_id 标识状态空间，model_request_id 和 tool_call_id 则定位具体调用。不要用一个万能 request ID 混合它们。"],
      },
      {
        title: "每层成功含义不同",
        paragraphs: ["Model Request 成功表示收到了响应；Tool Span 成功表示执行器得到终态；Agent Turn 成功表示 Loop 正常结束；Job 成功还需要独立 Acceptance Check 和结果提交。"],
        bullets: [
          "Queue：深度、最老等待时间和 Lease 过期率。",
          "Model：首 Token 延迟、总延迟、Token、429 与 Fallback。",
          "Tool：耗时、错误、取消和未确认副作用。",
          "State：Compaction、Checkpoint 与 Resume 结果。",
        ],
      },
      {
        title: "Audit 不是完整 Transcript",
        paragraphs: ["Transcript 可能包含源码、凭据和个人信息。Audit 更适合保存身份、Policy、Approval、动作、结果 Hash 与时间；原始内容放在受控存储，并执行结构化脱敏。"],
      },
    ],
    diagram: {
      title: "一个 Job 的 Trace 树",
      chart: `flowchart TD
    J["Job J42"] --> A["Attempt A3 / Trace T9"]
    A --> Q["queue.wait"]
    A --> L["worker.lease"]
    A --> C["context.build"]
    A --> T["agent.turn"]
    T --> M1["model.request M1"]
    T --> X["tool.execute TC7"]
    T --> M2["model.request M2"]
    A --> P["checkpoint.write"]
    A --> V["acceptance.verify"]
    X -. policy decision .-> AU[("Audit Event")]
    X -. result .-> TR[("Transcript")]`,
    },
    takeaway: "可观测性不是多打印日志，而是让模型、工具、状态和授权事件可以被关联与验证。",
    sourcePointers: ["packages/coding-agent/docs/rpc.md", "packages/coding-agent/src/modes/print-mode.ts"],
  },
  {
    id: 18,
    title: "执行链、状态链与信任链：统一分析框架",
    domain: "综合方法",
    question: "如何用同一套问题评审任意 Agent Runtime？",
    lead: "执行链证明实际发生了什么，状态链证明从什么状态演化到什么状态，信任链证明谁依据什么规则允许操作。三条链在每个副作用点汇合。",
    sections: [
      {
        title: "执行链：因果控制路径",
        paragraphs: ["从 Trigger、Job、Attempt、Turn、Model Request 到 Tool Call、Tool Result 和 Acceptance，每一步都需要稳定 ID 和终态。模型自述不属于真实执行证据。"],
      },
      {
        title: "状态链：提交与恢复路径",
        paragraphs: ["Session、Context Snapshot、Transcript、Checkpoint 和 Resume 描述状态如何演化。模型请求应能关联它实际看到的 Context，Compaction 也要记录输入范围与输出摘要。"],
      },
      {
        title: "信任链：身份、规则与强制边界",
        paragraphs: ["Principal、Authentication、Policy、Approval、Capability、Sandbox 和 Audit 共同解释操作为什么被允许。Approval 不能替代 Sandbox，Prompt 约束也不能替代系统边界。"],
        bullets: [
          "执行完成、状态未记录：恢复后可能重复副作用。",
          "状态写入、执行未发生：Transcript 描述虚假结果。",
          "执行完成、授权缺失：无法证明操作合规。",
          "三条链齐全但验收缺失：只能证明做过，不能证明做对。",
        ],
        code: "tool_call_id: TC7\nstate_version: 105\nprincipal: service/github-agent\npolicy_decision: allow\nsandbox_profile: workspace-write\nresult_hash: sha256:...",
      },
    ],
    diagram: {
      title: "三条链在 Tool Call 处汇合",
      chart: `flowchart LR
    J["Job"] --> A["Attempt"] --> M["Model Request"] --> X["Tool Call TC7"] --> R["Tool Result"] --> V["Acceptance"]
    S0["Session v104"] --> C["Context Snapshot"] --> X --> S1["Transcript v105"] --> CP["Checkpoint"]
    I["Principal"] --> P["Policy"] --> AP["Approval"] --> X --> SB["Sandbox"] --> AU["Audit"]
    style X fill:#182b46,stroke:#38d8df,stroke-width:3px,color:#edf5ff`,
    },
    takeaway: "生产级 Agent 的可靠性，就是让执行、状态和信任证据在每个外部副作用点闭环。",
    sourcePointers: ["packages/agent/src/agent-loop.ts", "packages/coding-agent/src/core/", "packages/orchestrator/"],
  },
];
