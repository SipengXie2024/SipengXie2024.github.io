import type { Lesson } from "./lesson-types";

export const coreLessons: Lesson[] = [
  {
    id: 1,
    title: "Agent Loop：从一次模型调用到可执行系统",
    domain: "执行内核",
    question: "为什么 Agent 不只是一次 LLM API 调用？",
    lead: "一次模型调用只能产生文本、事件或工具调用意图。真正的 Agent 需要一个 Runtime 持续协调 Context、模型、工具和停止条件。",
    sections: [
      {
        title: "模型不会直接操作外部世界",
        paragraphs: [
          "当模型输出 Tool Call 时，它只是生成了一段结构化数据，例如工具名、参数和 call ID。Runtime 读取这段数据，完成校验、授权和真实执行，再把 Tool Result 返回给模型。",
          "因此，模型说“命令执行成功”不能证明命令发生过。执行证据来自 Tool Runtime、进程退出状态、文件变化或外部系统记录。",
        ],
      },
      {
        title: "Loop 的一次 Step",
        paragraphs: ["一个 Step 通常包含四个阶段。只要模型继续提出工具调用，Runtime 就会进入下一 Step。"],
        bullets: [
          "Context Builder 生成本次 Model Request 的有序输入。",
          "Model Runtime 消费流式响应，并识别最终文本或 Tool Call。",
          "Tool Runtime 执行被允许的调用，生成与 call ID 配对的结果。",
          "结果成为 Observation，追加到状态并进入下一轮。",
        ],
        code: "while (!stopCondition) {\n  context = buildContext(session)\n  event = await model.stream(context)\n  state = await reduceModelEvent(state, event)\n}",
      },
      {
        title: "停止条件必须显式",
        paragraphs: ["正常最终回答只是一个停止条件。取消、超时、预算耗尽、不可恢复错误和迭代上限也应产生明确终态。否则 Agent Loop 很容易变成无法解释的无限循环。"],
      },
    ],
    diagram: {
      title: "Agent Loop 的最小执行闭环",
      chart: `sequenceDiagram
    actor U as User
    participant R as Agent Runtime
    participant M as Model
    participant T as Tool Runtime
    U->>R: submit turn
    loop Until stop condition
        R->>M: Model Request with Context
        alt Model emits Tool Call
            M-->>R: Tool Call intent
            R->>T: validate and execute
            T-->>R: Tool Result
            R->>R: append Observation
        else Model emits final response
            M-->>R: Final response
            R-->>U: terminal result
        end
    end`,
    },
    takeaway: "模型负责提出下一步，Runtime 负责让下一步真实、受控、可恢复地发生。",
    sourcePointers: ["packages/agent/src/agent-loop.ts", "packages/agent/src/types.ts"],
  },
  {
    id: 2,
    title: "Stateful Agent Wrapper：谁拥有正在运行的状态",
    domain: "执行内核",
    question: "Agent 对象比 Agent Loop 多管理了什么？",
    lead: "Agent Loop 是控制算法；Agent Wrapper 则是可以长期交互的有状态对象。它把配置、消息、运行状态与事件订阅组织在同一个生命周期里。",
    sections: [
      {
        title: "Wrapper 是使用者面对的运行入口",
        paragraphs: ["调用者通常不会直接操作底层循环，而是向 Agent 提交 prompt、取消当前 Turn、切换模型、订阅事件或读取消息。Wrapper 将这些动作转换成对 Loop 的受控调用。"],
      },
      {
        title: "它需要明确拥有的状态",
        paragraphs: ["至少要区分稳定配置和正在变化的运行状态。配置包括模型、工具与系统指令；运行状态包括消息、当前流、取消信号和是否正在处理 Turn。"],
        bullets: [
          "同一 Agent 是否允许同时启动两个 Turn？",
          "模型或工具配置在 Turn 中途变化，当前 Turn 是否可见？",
          "事件回调抛出异常，是否影响主执行链？",
          "取消信号属于某个 Turn，还是整个 Session？",
        ],
      },
      {
        title: "并发的核心是所有权",
        paragraphs: ["如果 Wrapper 允许两个调用者同时修改同一消息数组，状态顺序会失去定义。最简单的实现通常是同一 Agent 串行运行 Turn，并把并行放到独立 Agent 或独立 Session。"],
      },
    ],
    diagram: {
      title: "Agent Wrapper 与 Loop 的职责边界",
      chart: `flowchart LR
    UI["CLI / TUI / SDK"] --> A["Stateful Agent Wrapper"]
    CFG["Model · Tools · Instructions"] --> A
    A --> L["Agent Loop"]
    L --> M["Messages and Runtime State"]
    L -. event .-> E["Event Subscribers"]
    UI -. cancel .-> A
    A -. signal .-> L`,
    },
    takeaway: "Loop 决定如何推进，Wrapper 决定谁能推进、状态放在哪里以及事件如何暴露。",
    sourcePointers: ["packages/agent/src/agent.ts", "packages/agent/src/agent-loop.ts"],
  },
  {
    id: 3,
    title: "Session、Transcript 与 Context：三个不同的状态视图",
    domain: "上下文与状态",
    question: "模型看到的 Context 等于完整会话吗？",
    lead: "Session 是状态命名空间，Transcript 是按顺序保存的历史，Context 则是某次 Model Request 真正携带的有限输入。",
    sections: [
      {
        title: "先把三个名词拆开",
        paragraphs: ["Session 可以跨越多个 Turn；Transcript 记录消息、工具调用、结果与分支；Context Builder 再从这些材料中选择模型当前需要看到的内容。"],
        bullets: [
          "Session 回答“这些状态属于哪段持续交互”。",
          "Transcript 回答“历史上按什么顺序发生过什么”。",
          "Context 回答“这一刻模型实际收到了什么”。",
        ],
      },
      {
        title: "Context Builder 是一个策略组件",
        paragraphs: ["它需要合并系统指令、项目规则、选中的历史、工具 Schema、当前用户输入和 Token Budget。顺序也有语义：相同消息以不同顺序提交，模型行为可能不同。"],
      },
      {
        title: "分支与 Resume 的影响",
        paragraphs: ["Session 可以保存完整树，但本次 Context 只能选择其中一条有效路径。恢复时也不能把所有历史无条件拼接，否则已经撤销的分支和旧工具结果会重新进入模型视野。"],
      },
    ],
    diagram: {
      title: "Transcript 如何生成一次 Context",
      chart: `flowchart LR
    S["Session"] --> T[("Transcript Tree")]
    T --> B["Select active branch"]
    I["System and project instructions"] --> C["Context Builder"]
    B --> C
    G["Tool schemas"] --> C
    U["Current user input"] --> C
    C --> K["Token budget and ordering"]
    K --> R["Model Request Context"]`,
    },
    takeaway: "Transcript 是可追溯历史，Context 是经过选择和预算约束后的模型输入。",
    sourcePointers: ["packages/coding-agent/src/core/", "packages/agent/src/types.ts"],
  },
  {
    id: 4,
    title: "Context Compaction：带不变量的状态迁移",
    domain: "上下文与状态",
    question: "压缩为什么不是简单删除旧消息？",
    lead: "Compaction 的目标不是让历史变短，而是在有限 Token Budget 中保留继续任务所需的语义和协议结构。",
    sections: [
      {
        title: "触发与选择",
        paragraphs: ["Runtime 需要监控 Context 预算，在溢出前选择可以压缩的历史前缀。最近消息、当前任务、未完成 Tool Call 和关键约束通常需要保留原形。"],
      },
      {
        title: "不能破坏的协议不变量",
        paragraphs: ["如果保留了 Tool Result，却删掉对应 Tool Call，模型看到的协议会断裂；反过来也一样。压缩还要保存文件修改、失败尝试、用户限制和下一步计划，而不只是对话主题。"],
        bullets: [
          "Tool Call 与 Tool Result 必须配对。",
          "未完成操作必须保留明确状态。",
          "摘要不能把推测改写成已完成事实。",
          "安装新 Context View 应具有明确提交点。",
        ],
      },
      {
        title: "失败时如何退化",
        paragraphs: ["摘要可能超长、模型调用可能失败、配对验证也可能不通过。可选策略包括缩小压缩范围、更换策略、保留更多原文，或停止并留下可恢复状态。"],
      },
    ],
    diagram: {
      title: "Context Compaction 状态机",
      chart: `stateDiagram-v2
    [*] --> Monitor
    Monitor --> Check: budget threshold reached
    Monitor --> [*]: budget sufficient
    Check --> Repair: unpaired tool protocol
    Repair --> Check
    Check --> Select: invariants hold
    Select --> Summarize
    Summarize --> Validate
    Validate --> Install: valid and within budget
    Validate --> Fallback: invalid or too large
    Fallback --> Select: shrink range
    Fallback --> Stop: retry exhausted
    Install --> Record
    Record --> Monitor
    Stop --> [*]`,
    },
    takeaway: "Compaction 是对 Context View 的受控替换，不应默认改写完整 Transcript。",
    sourcePointers: ["packages/coding-agent/src/core/", "Pi documentation: compaction"],
  },
  {
    id: 5,
    title: "Tool Runtime：从调用意图到外部副作用",
    domain: "模型与工具",
    question: "模型输出工具 JSON 后，谁真正执行？",
    lead: "Tool Runtime 是模型与真实世界之间的执行边界。它把不可信的结构化意图转换为受校验、受授权、可取消的操作。",
    sections: [
      {
        title: "一条完整的工具管线",
        paragraphs: ["Tool Registry 提供稳定名称、Schema 和执行器；Runtime 解析参数、验证类型与路径、求值 Policy，再把调用分发给本地函数、子进程或远端服务。"],
      },
      {
        title: "Tool Result 不等于原始 stdout",
        paragraphs: ["Result 应包含 call ID、终态、结构化内容、错误分类和必要元数据。stdout 只是某些工具的原始材料；超大输出还可能被截断、外置存储或摘要。"],
        bullets: [
          "Validation Error：模型参数无效。",
          "Policy Error：规则拒绝或审批未通过。",
          "Execution Error：进程、网络或工具自身失败。",
          "Timeout / Cancelled：没有得到正常终态。",
        ],
      },
      {
        title: "长时间工具需要生命周期管理",
        paragraphs: ["Runtime 必须保存进程句柄或远端任务 ID，传播 Cancellation，并在 Session 结束时决定等待、终止还是转成 Background Task。否则工具可能成为无人负责的僵尸工作。"],
      },
    ],
    diagram: {
      title: "Tool Call 的执行与回传路径",
      chart: `flowchart TD
    C["Tool Call"] --> R["Tool Registry lookup"]
    R --> V{"Schema and arguments valid?"}
    V -->|No| O["Validation Observation"]
    V -->|Yes| P{"Policy and approval"}
    P -->|Denied| D["Policy Observation"]
    P -->|Allowed| S["Sandbox and timeout"]
    S --> X["Execute tool"]
    X --> N["Normalize result"]
    N --> O2["Tool Result with call ID"]
    O --> M["Next model step"]
    D --> M
    O2 --> M`,
    },
    takeaway: "Tool Call 是意图；Tool Runtime 的执行记录和验收结果才是副作用证据。",
    sourcePointers: ["packages/agent/src/agent-loop.ts", "packages/coding-agent/src/core/"],
  },
  {
    id: 6,
    title: "Permission、Approval 与 Sandbox：三道不同防线",
    domain: "安全与隔离",
    question: "用户点了允许，为什么操作仍可能失败？",
    lead: "Permission 判断规则，Approval 表示授权决定，Sandbox 强制资源边界。它们解决不同问题，也拥有不同的否决位置。",
    sections: [
      {
        title: "三者不能互相替代",
        paragraphs: ["Permission 可以自动允许、询问或拒绝；Approval 通常绑定某个具体动作或范围；Sandbox 则依靠操作系统、容器或远端执行环境限制文件、网络和进程。"],
      },
      {
        title: "正确的决策顺序",
        paragraphs: ["先规范化工具参数和路径，再检查显式 Deny 与 Policy。需要询问时，Approval 应绑定工具、参数、工作区、有效期和使用次数。最后仍要在 Sandbox 中执行。"],
        bullets: [
          "Approval 允许尝试，不保证执行成功。",
          "Sandbox 不可用时应明确选择 fail closed 或升级审批。",
          "环境变量和凭据要在执行前过滤。",
          "工具结果仍是不可信输入，返回模型前需要标记与清理。",
        ],
      },
      {
        title: "信任来自可校验边界",
        paragraphs: ["Prompt 中写“不要访问目录外文件”不是 Sandbox。真正的边界必须由 Runtime 或系统机制强制，并把决策与结果写入 Audit。"],
      },
    ],
    diagram: {
      title: "Permission 到 Sandbox 的决策链",
      chart: `flowchart TD
    T["Normalized Tool Call"] --> V{"Arguments valid?"}
    V -->|No| R["Reject"]
    V -->|Yes| P{"Policy result"}
    P -->|Deny| D["Deny and audit"]
    P -->|Ask| A{"Approved for exact scope?"}
    A -->|No| D
    A -->|Yes| S{"Sandbox available?"}
    P -->|Allow| S
    S -->|Yes| E["Execute inside boundary"]
    S -->|No| F{"Unavailable policy"}
    F -->|Fail closed| D
    F -->|Elevated approval| A2["Explicit unsandboxed approval"]
    A2 --> E
    E --> O["Sanitize result and audit"]`,
    },
    takeaway: "Permission 决定是否允许尝试，Sandbox 决定尝试时真正能影响什么。",
    sourcePointers: ["Pi official documentation", "packages/coding-agent/src/core/"],
  },
];
