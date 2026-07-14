import type { Lesson } from "./lesson-types";

export const runtimeLessons: Lesson[] = [
  {
    id: 7,
    title: "Extension Runtime：不改核心也能扩展行为",
    domain: "扩展机制",
    question: "Extension、Skill、Plugin 与 Hook 分别改变什么？",
    lead: "扩展系统的价值是让能力在核心 Loop 之外演化，但每一种扩展都必须说明加载时机、状态所有权和权限边界。",
    sections: [
      {
        title: "先按作用方式分类",
        paragraphs: ["Skill 主要提供按需加载的任务知识；Extension 或 Plugin 可以注册工具、命令和事件处理器；Hook 在明确生命周期点观察或影响流程；自定义 Provider 则扩展 Model Runtime。"],
      },
      {
        title: "发现不等于立即生效",
        paragraphs: ["Runtime 通常需要扫描来源、解析 Manifest、处理命名冲突，并在某个时点冻结 Tool Registry 和 Hook 列表。Turn 中途热更新会导致同一 Session 的前后语义不一致。"],
        bullets: [
          "扩展来自哪个目录、包或配置层？",
          "相同工具名出现两次时谁优先？",
          "扩展版本是否进入 Session 快照？",
          "扩展失败是跳过、降级还是阻止启动？",
        ],
      },
      {
        title: "知识能力与执行权限分离",
        paragraphs: ["加载 Skill 只意味着模型能读取相关说明，不应自动获得 Shell、网络或凭据。Plugin 代码的信任等级更高，还需要版本锁定、来源验证和清晰的卸载边界。"],
      },
    ],
    diagram: {
      title: "扩展发现、冻结与运行时调用",
      chart: `flowchart LR
    S["Extension sources"] --> D["Discover and validate"]
    D --> M["Resolve manifest and conflicts"]
    M --> F["Freeze runtime snapshot"]
    F --> TR["Tool Registry"]
    F --> HK["Lifecycle Hooks"]
    F --> SK["Skills and prompt resources"]
    F --> PA["Provider Adapters"]
    TR --> L["Agent Loop"]
    HK --> L
    SK --> C["Context Builder"]
    PA --> MR["Model Runtime"]`,
    },
    takeaway: "扩展面决定系统的可塑性，加载与授权边界决定这种可塑性的风险。",
    sourcePointers: ["packages/coding-agent/src/core/", "Pi documentation: extensions and skills"],
  },
  {
    id: 8,
    title: "Model Runtime：统一接口背后的真实差异",
    domain: "模型运行时",
    question: "统一 Provider API 需要归一哪些语义？",
    lead: "Model Runtime 不只是 SDK 封装。它必须把不同 Provider 的请求、能力、流事件、Tool Call 和错误映射到 Runtime 能稳定消费的协议。",
    sections: [
      {
        title: "Adapter 与 Router 是两层",
        paragraphs: ["Provider Adapter 负责协议映射；Router 负责选择使用哪个 Provider 和 Model。把两者混在一起，会让请求转换逻辑和故障策略互相污染。"],
      },
      {
        title: "Streaming 需要事件归一",
        paragraphs: ["不同 API 可能以 SSE、WebSocket 或厂商 SDK 返回增量文本、推理片段、Tool Call 参数和终态统计。Runtime 需要定义稳定事件顺序，并处理断流、重复与不完整调用。"],
        bullets: [
          "Model Capability：工具、视觉、推理和 Context Window。",
          "Normalized Error：认证、限流、网络、服务端和协议错误。",
          "Usage：输入、输出、缓存 Token 与成本元数据。",
          "Terminal Event：完整回答、工具调用、错误或取消。",
        ],
      },
      {
        title: "Retry 与 Fallback 不同",
        paragraphs: ["Retry 在同一语义目标上再次尝试；Fallback 切换 Provider、Model 或 Transport，可能改变工具能力、上下文窗口和输出风格，因此必须记录语义变化。"],
      },
    ],
    diagram: {
      title: "Model Runtime 的路由与适配",
      chart: `flowchart LR
    L["Agent Loop"] --> R["Model Router"]
    R --> C{"Capability and policy"}
    C --> A1["Provider Adapter A"]
    C --> A2["Provider Adapter B"]
    A1 --> P1["Provider API"]
    A2 --> P2["Provider API"]
    P1 -. stream .-> N["Normalized Events"]
    P2 -. stream .-> N
    N --> L
    E["Normalized Errors"] --> F{"Retry or Fallback"}
    F --> R`,
    },
    takeaway: "统一接口应稳定核心语义，而不是假装所有模型和 Provider 完全相同。",
    sourcePointers: ["packages/ai/", "packages/agent/src/agent-loop.ts"],
  },
  {
    id: 9,
    title: "CLI、TUI、Print、JSON、RPC 与 SDK：同一核心的多种入口",
    domain: "产品入口",
    question: "多个产品入口是否意味着多个 Agent Runtime？",
    lead: "不同 Surface 服务不同消费者，但应该共享 Agent Loop、Session 和 Tool Runtime。入口层主要改变输入输出契约与生命周期。",
    sections: [
      {
        title: "每种入口解决的问题不同",
        paragraphs: ["CLI/TUI 面向人类交互；Print 适合一次性自动化；JSON Event Stream 面向机器消费；RPC 控制长期进程；SDK 允许宿主应用直接嵌入 Runtime。"],
      },
      {
        title: "机器接口需要严格契约",
        paragraphs: ["Headless 模式不能把进度动画和日志混入结构化 stdout。命令、响应、事件、错误和退出码需要明确区分，Cancellation 也必须能从调用者传播到模型与工具。"],
        bullets: [
          "Print：输入 Prompt，输出最终文本或结构化事件，然后退出。",
          "JSON：按顺序输出可解析事件，适合日志和自动化。",
          "RPC：stdin/stdout JSONL，允许长期控制 Session。",
          "SDK：由宿主拥有进程、依赖和 UI。",
        ],
      },
      {
        title: "Surface 不应复制核心状态机",
        paragraphs: ["如果 TUI 和 RPC 各自实现一套 Tool Call 处理逻辑，取消、错误和 Transcript 很快会产生差异。更好的结构是 Surface 只发送命令、消费统一 Runtime Event。"],
      },
    ],
    diagram: {
      title: "多个 Surface 共享同一 Runtime",
      chart: `flowchart TD
    CLI["CLI / TUI"] --> A["Surface Adapter"]
    PRINT["Print / JSON"] --> A
    RPC["JSONL RPC"] --> A
    SDK["Embedded SDK"] --> A
    A --> S["Session Manager"]
    S --> L["Agent Loop"]
    L --> M["Model Runtime"]
    L --> T["Tool Runtime"]
    L -. events .-> A
    A -. text / JSON / UI .-> CLI
    A -. result / event .-> PRINT
    A -. response / event .-> RPC
    A -. callbacks .-> SDK`,
    },
    takeaway: "Surface 是协议适配层；Agent 的核心执行语义应该只有一份。",
    sourcePointers: ["packages/coding-agent/src/modes/print-mode.ts", "packages/coding-agent/docs/rpc.md"],
  },
  {
    id: 10,
    title: "Graceful Shutdown：让退出成为一个协议",
    domain: "可靠性",
    question: "收到退出信号后为什么不能立刻结束进程？",
    lead: "Runtime 可能正在接收输入、生成模型流、执行工具、写 Transcript 或发送事件。Graceful Shutdown 要让这些活动在共同截止时间内进入可解释终态。",
    sections: [
      {
        title: "第一步是停止产生新工作",
        paragraphs: ["Lifecycle Controller 先进入 Quiescing，拒绝新 Turn，并关闭 Producer Gate。只停止 Worker 不够，因为仍有 Producer 可能继续把任务放进 Queue。"],
      },
      {
        title: "Drain 与 Cancel 是策略选择",
        paragraphs: ["短操作可以等待完成；长模型流或工具进程可能需要取消。无论选择哪种，都要把 partial result、取消原因和未完成副作用写入 Durable State。"],
        bullets: [
          "停止接收新的外部输入。",
          "等待已经进入生产区的 Producer 退出。",
          "停止调度新工作，排空或取消 in-flight 操作。",
          "提交 Transcript、Checkpoint 和 Audit 后关闭传输。",
        ],
      },
      {
        title: "Deadline 到期也要留下恢复线索",
        paragraphs: ["如果无法在截止时间前完成，就应强制取消并记录 incomplete marker，而不是静默丢失。退出码还需要区分正常关闭、超时强退和持久化失败。"],
      },
    ],
    diagram: {
      title: "Graceful Shutdown 时序",
      chart: `sequenceDiagram
    actor O as OS / Operator
    participant L as Lifecycle Controller
    participant I as Ingress
    participant W as Worker Supervisor
    participant X as Model and Tools
    participant D as Durable Store
    O->>L: shutdown with deadline
    L->>I: reject new turns
    L->>W: stop scheduling
    W->>X: drain or cancel
    alt completed before deadline
        X-->>W: terminal results
        W->>D: append results and checkpoint
    else deadline reached
        L->>X: force cancellation
        W->>D: mark incomplete and resumable
    end
    L->>D: flush state and audit
    D-->>L: durable commit
    L-->>O: exit`,
    },
    takeaway: "退出成功的判定点是关键状态已经提交，而不是已经收到 Shutdown Signal。",
    sourcePointers: ["packages/orchestrator/src/supervisor.ts", "packages/coding-agent/src/core/"],
  },
  {
    id: 11,
    title: "Crash Recovery：恢复一致性，而不是只重启进程",
    domain: "可靠性",
    question: "进程重启后，如何知道上一次执行到哪里？",
    lead: "恢复需要把 Checkpoint、Transcript 尾部和外部副作用放在一起分析。单独重新启动 Agent 无法回答哪些操作已经发生。",
    sections: [
      {
        title: "三种状态各自提供什么",
        paragraphs: ["Checkpoint 提供一致性快照和 Transcript Cursor；Transcript 保存之后追加的事件；Effect Ledger 记录 Tool Call 或外部操作的稳定 ID 与结果状态。"],
      },
      {
        title: "Resume 的基本步骤",
        paragraphs: ["先加载最新有效 Checkpoint，校验版本并迁移，再重放 Transcript 尾部。遇到没有终态的 Tool Call 时，必须查询外部系统、去重、补偿或标记未知。"],
        bullets: [
          "检测尾部半写和损坏记录。",
          "恢复 Session 配置、模型和扩展快照。",
          "重建未完成 Turn，但不要自动重做副作用。",
          "创建新的 Attempt，并关联崩溃前的 Attempt。",
        ],
      },
      {
        title: "恢复的核心是不变量",
        paragraphs: ["每个可见 Tool Call 最终要么有 Result，要么有明确 incomplete marker；每次恢复也应从已知线性化点开始，而不是猜测内存中的最后一行代码。"],
      },
    ],
    diagram: {
      title: "Checkpoint、Transcript 与副作用对账",
      chart: `flowchart LR
    C["Crash or resume request"] --> L["Load latest valid checkpoint"]
    CP[("Checkpoint and cursor")] --> L
    L --> V["Validate version and migrate"]
    V --> R["Replay transcript tail"]
    T[("Transcript")] --> R
    R --> I{"Incomplete operation?"}
    I -->|No| S["Resume session"]
    I -->|Yes| Q["Query Effect Ledger or external system"]
    E[("Effect Ledger")] --> Q
    Q --> D["Deduplicate, compensate or mark unknown"]
    D --> S`,
    },
    takeaway: "Recovery 的目标是恢复可解释的一致状态，而不是让进程数量回到一。",
    sourcePointers: ["packages/coding-agent/src/core/", "Session transcript and resume paths"],
  },
  {
    id: 12,
    title: "Idempotency：面对重复执行的工程答案",
    domain: "可靠性",
    question: "工具已经成功，但 Runtime 来不及记录，能否安全重试？",
    lead: "跨进程和外部系统几乎总有一个模糊窗口：副作用成功了，但确认结果丢失。Idempotency 与 Reconciliation 用来控制这个窗口。",
    sections: [
      {
        title: "稳定 Operation ID 是起点",
        paragraphs: ["同一个逻辑动作的 Retry 应复用相同 operation_id，而每次具体尝试使用新的 attempt_id。外部 API 如果支持 Idempotency Key，应直接传递稳定 ID。"],
      },
      {
        title: "Exactly-once 通常只是表象",
        paragraphs: ["数据库内部可以用事务避免重复写，但文件系统、Shell、GitHub 或支付 API 很难和本地状态组成一个原子事务。实践中通常采用 at-least-once 加去重、查询或补偿。"],
        code: "job_id: J42\noperation_id: create-pr:repo17:branch-fix\nattempt_id: A3\nstatus: UNKNOWN",
      },
      {
        title: "不要把未知直接当失败",
        paragraphs: ["当 Worker 在副作用后崩溃，新 Worker 应先查询目标状态。例如检查 PR 是否已存在、文件 Hash 是否已经变化，再决定补写成功记录还是重新执行。"],
        bullets: [
          "PREPARED：意图已持久化，尚未确认执行。",
          "APPLIED：外部副作用已观察到。",
          "CONFIRMED：结果与业务状态已经提交。",
          "UNKNOWN：必须 Reconcile，不能盲目 Retry。",
        ],
      },
    ],
    diagram: {
      title: "副作用执行与确认的模糊窗口",
      chart: `stateDiagram-v2
    [*] --> Prepared
    Prepared --> Executing
    Executing --> Applied: external effect succeeds
    Executing --> Failed: definite failure
    Applied --> Confirmed: result persisted
    Applied --> Unknown: process crashes before commit
    Unknown --> Reconciling
    Reconciling --> Confirmed: effect found
    Reconciling --> Prepared: effect absent and retry allowed
    Failed --> [*]
    Confirmed --> [*]`,
    },
    takeaway: "重试之前先问：上一次是否可能已经产生了外部副作用？",
    sourcePointers: ["Tool call IDs and transcript events", "Effect Ledger design"],
  },
];
