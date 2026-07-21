const themeRoot = document.documentElement;
const themeToggle = document.getElementById('themeToggle');
const themeIcon = themeToggle.querySelector('span');

function readStorage(key, fallback) {
  try {
    const value = localStorage.getItem(key);
    return value === null ? fallback : JSON.parse(value);
  } catch (_) {
    return fallback;
  }
}

function writeStorage(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (_) {}
}

const savedTheme = readStorage('local-llm-theme', null);
if (savedTheme === 'light' || savedTheme === 'dark') themeRoot.dataset.theme = savedTheme;

function syncTheme() {
  const isDark = themeRoot.dataset.theme === 'dark';
  themeIcon.textContent = isDark ? '\u263C' : '\u263E';
  themeToggle.setAttribute('aria-pressed', String(isDark));
}

syncTheme();
themeToggle.addEventListener('click', () => {
  themeRoot.dataset.theme = themeRoot.dataset.theme === 'dark' ? 'light' : 'dark';
  writeStorage('local-llm-theme', themeRoot.dataset.theme);
  syncTheme();
});

const modules = [
  {
    title: '需求、边界与风险',
    duration: 60,
    output: '一页部署需求单',
    summary: '先把“最强可运行”拆成任务、质量、交互、上下文、隐私与风险约束，再决定模型。默认只监听本机，并把工具权限纳入安全边界。',
    points: [
      '分别写明常用上下文、极限窗口和最大输出，它们不是同一个参数。',
      '定义可接受的首 token 延迟、解码速度、并发与磁盘上限。',
      '把模型许可、数据许可、日志内容与 Bash、文件、网络权限写进需求。'
    ],
    checks: [
      '需求单包含目标任务、延迟、上下文、并发、量化与验收标准。',
      '能解释“权重能加载”为什么不等于“工作流可用”。'
    ]
  },
  {
    title: '硬件审计与容量预算',
    duration: 90,
    output: '内存与磁盘容量评估表',
    summary: '容量判断应从实际制品大小出发，把权重、运行时开销、活跃 KV、系统保留和磁盘余量同时纳入，而不是只做参数量乘位宽。',
    points: [
      'MoE 激活参数影响每 token 计算量，通常不减少完整权重的常驻需求。',
      '长上下文要同时获得模型、运行时、KV 和客户端四层支持。',
      '区分 GB 与 GiB，并明确结论来自估算还是实测。'
    ],
    checks: [
      '报告同时覆盖内存与磁盘，且保留系统余量。',
      '所有输入、公式、单位与假设都能追溯。'
    ]
  },
  {
    title: '模型、量化与运行时',
    duration: 90,
    output: '主方案、降级方案与候选矩阵',
    summary: '先确认任务、许可和架构支持，再比较量化制品。文件格式兼容不等于运行时已经支持模型架构、量化内核和工具调用。',
    points: [
      '候选矩阵记录模型修订、量化、文件大小、上下文、工具调用与来源日期。',
      'Q4 常是大型模型的平衡点；Q2/Q3 只有经过目标任务评测后才采用。',
      'Apple、NVIDIA 与 CPU 平台分别核实 Metal、CUDA 和内存带宽路径。'
    ],
    checks: [
      '主方案与降级方案都有当前证据和明确退路。',
      '能说明为什么没有盲目选择更大模型或更低量化。'
    ]
  },
  {
    title: '下载、分流与完整性',
    duration: 90,
    output: '测速、路由与校验记录',
    summary: '模型页面、鉴权、重定向和权重 CDN 可能经过不同域名。先观察真实链路，再做最小域名分流和断点续传。',
    points: [
      '分别测页面、鉴权与重定向后的权重 CDN，不用全局代理猜测。',
      '更具体的域名规则必须排在泛规则之前，并在网络变化后重新测速。',
      '下载完成后核对大小、校验值和格式，大小相同也不代表内容正确。'
    ],
    checks: [
      '提交直连与代理吞吐、稳定性和失败率证据。',
      '解释最终规则优先级并给出完整性校验结果。'
    ]
  },
  {
    title: '首次运行与性能调优',
    duration: 120,
    output: '可复现的基准测试报告',
    summary: '从保守上下文和短输出开始，每次只改变一个变量。把冷启动、预填、解码、内存与磁盘 KV 分开测量。',
    points: [
      '先完成固定短句冒烟，再开启 GPU、增加上下文、预热和持久 KV。',
      '至少记录冷启动、首 token、预填、解码、峰值内存和十次连续请求。',
      '按 1K、8K、32K、128K 等梯度评估上下文，不能从短交互外推到极限窗口。'
    ],
    checks: [
      '报告区分预填 tokens/s 与解码 tokens/s。',
      '每项性能数字都能对应输入、命令、上下文和日志。'
    ]
  },
  {
    title: '常驻服务与运维',
    duration: 75,
    output: '可启动、停止、重启并自动恢复的服务',
    summary: '把一次性命令变成可维护服务：绝对路径、固定工作目录、独立日志、开机启动、异常重启和明确失败信息。',
    points: [
      '默认绑定 127.0.0.1；局域网访问必须额外增加鉴权和防火墙。',
      '分离模型文件、启动脚本、服务定义与 stdout、stderr。',
      'macOS 使用 LaunchAgent，Linux 可用 systemd 实现同等职责。'
    ],
    checks: [
      '重启系统或服务后可自动恢复，日志能定位失败原因。',
      '验收不止看 PID，还检查端口、模型接口与生成请求。'
    ]
  },
  {
    title: 'API 与 Claude Code 集成',
    duration: 120,
    output: 'Messages API 与真实工具调用闭环',
    summary: '确认本地服务的 Anthropic /v1/messages 路径后，再配置 Claude Code 的模型、上下文、输出与超时；最后用真实工具任务证明协议闭环。',
    points: [
      'ANTHROPIC_BASE_URL 使用根地址，避免机械增加云供应商的路径前缀。',
      '客户端最大输出不宜直接等于服务极限，过大保留会压缩有效上下文。',
      '日志必须显示 tool_use、工具结果和第二轮生成都到达本地后端。'
    ],
    checks: [
      '新终端会话确认实际模型、窗口和输出上限。',
      'Claude Code 调用 Bash 一次并把结果交回模型完成最终回答。'
    ]
  },
  {
    title: '故障演练与结课考核',
    duration: 90,
    output: '部署答辩材料与现场恢复记录',
    summary: '用随机故障检验是否真正理解证据链。排查时按容量、文件、网络、进程、端口、协议和客户端逐层定位，不直接重装全部组件。',
    points: [
      '演练错误模型路径、端口占用、超量上下文、Base URL 和路由顺序。',
      '区分服务存在、协议兼容与客户端实际选中本地模型。',
      '答辩报告保留方法、输入、日志、限制和可复现步骤。'
    ],
    checks: [
      '全新终端完成检查服务、API、工具任务、停止与恢复四步。',
      '不泄露 API Key、Cookie、系统序列号或 Hugging Face Token。'
    ]
  }
];

const moduleNav = document.getElementById('moduleNav');
const moduleIndex = document.getElementById('moduleIndex');
const moduleTitle = document.getElementById('moduleTitle');
const moduleSummary = document.getElementById('moduleSummary');
const moduleOutput = document.getElementById('moduleOutput');
const modulePoints = document.getElementById('modulePoints');
const moduleChecks = document.getElementById('moduleChecks');
const moduleComplete = document.getElementById('moduleComplete');
const previousModule = document.getElementById('previousModule');
const nextModule = document.getElementById('nextModule');
const courseProgressText = document.getElementById('courseProgressText');
const courseProgressBar = document.getElementById('courseProgressBar');
const completedModules = new Set(readStorage('local-llm-completed-modules', []));
let activeModule = 0;

function appendListItems(target, values) {
  target.replaceChildren(...values.map((value) => {
    const item = document.createElement('li');
    item.textContent = value;
    return item;
  }));
}

function renderModuleNav() {
  if (moduleNav.childElementCount === 0) {
    const buttons = modules.map((module, index) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.setAttribute('aria-label', `模块 ${index + 1}：${module.title}`);

      const number = document.createElement('span');
      number.className = 'module-nav-index';
      number.textContent = String(index + 1).padStart(2, '0');

      const copy = document.createElement('span');
      copy.className = 'module-nav-copy';
      const title = document.createElement('strong');
      title.textContent = module.title;
      const duration = document.createElement('span');
      duration.textContent = `${module.duration} 分钟`;
      copy.append(title, duration);

      const state = document.createElement('span');
      state.className = 'module-nav-state';
      state.setAttribute('aria-hidden', 'true');
      button.append(number, copy, state);
      button.addEventListener('click', () => selectModule(index));
      return button;
    });
    moduleNav.replaceChildren(...buttons);
  }

  [...moduleNav.children].forEach((button, index) => {
    button.dataset.complete = String(completedModules.has(index));
    if (index === activeModule) button.setAttribute('aria-current', 'step');
    else button.removeAttribute('aria-current');
  });
}

function updateCourseProgress() {
  const count = completedModules.size;
  courseProgressText.textContent = `${count} / ${modules.length}`;
  courseProgressBar.style.width = `${(count / modules.length) * 100}%`;
}

function selectModule(index) {
  activeModule = Math.max(0, Math.min(index, modules.length - 1));
  const module = modules[activeModule];
  moduleIndex.textContent = `MODULE ${String(activeModule + 1).padStart(2, '0')} / ${module.duration} MIN`;
  moduleTitle.textContent = module.title;
  moduleSummary.textContent = module.summary;
  moduleOutput.textContent = module.output;
  appendListItems(modulePoints, module.points);
  appendListItems(moduleChecks, module.checks);
  moduleComplete.checked = completedModules.has(activeModule);
  previousModule.disabled = activeModule === 0;
  nextModule.disabled = activeModule === modules.length - 1;
  renderModuleNav();
}

moduleComplete.addEventListener('change', () => {
  if (moduleComplete.checked) completedModules.add(activeModule);
  else completedModules.delete(activeModule);
  writeStorage('local-llm-completed-modules', [...completedModules]);
  renderModuleNav();
  updateCourseProgress();
});

previousModule.addEventListener('click', () => selectModule(activeModule - 1));
nextModule.addEventListener('click', () => selectModule(activeModule + 1));
selectModule(0);
updateCourseProgress();

const capacityFields = {
  ramTotal: document.getElementById('ramTotal'),
  weights: document.getElementById('weights'),
  runtimeOverhead: document.getElementById('runtimeOverhead'),
  activeKv: document.getElementById('activeKv'),
  systemReserve: document.getElementById('systemReserve'),
  diskFree: document.getElementById('diskFree'),
  diskOverhead: document.getElementById('diskOverhead'),
  diskKv: document.getElementById('diskKv')
};

const presets = {
  student: { ramTotal: 32, weights: 5, runtimeOverhead: 3, activeKv: 4, systemReserve: 6, diskFree: 100, diskOverhead: 10, diskKv: 8 },
  case: { ramTotal: 256, weights: 153, runtimeOverhead: 12, activeKv: 16, systemReserve: 32, diskFree: 500, diskOverhead: 20, diskKv: 64 }
};

const numberFormat = new Intl.NumberFormat('zh-CN', { maximumFractionDigits: 1 });
const capacityStatus = document.getElementById('capacityStatus');
const capacityBadge = document.getElementById('capacityBadge');
const memoryNumbers = document.getElementById('memoryNumbers');
const memoryBar = document.getElementById('memoryBar');
const memoryDetail = document.getElementById('memoryDetail');
const diskNumbers = document.getElementById('diskNumbers');
const diskBar = document.getElementById('diskBar');
const diskDetail = document.getElementById('diskDetail');
const capacityAdvice = document.getElementById('capacityAdvice');

function fieldNumber(field) {
  const value = Number.parseFloat(field.value);
  return Number.isFinite(value) ? Math.max(0, value) : 0;
}

function budgetState(total, required) {
  const headroom = total - required;
  if (headroom < 0) return 'danger';
  if (total === 0 || headroom / total < 0.1) return 'warning';
  return 'good';
}

function setBudgetBar(bar, total, required, state) {
  const percent = total > 0 ? Math.min(100, (required / total) * 100) : 100;
  bar.style.width = `${percent}%`;
  bar.classList.toggle('warning', state === 'warning');
  bar.classList.toggle('danger', state === 'danger');
}

function updateCapacity() {
  const values = Object.fromEntries(Object.entries(capacityFields).map(([key, field]) => [key, fieldNumber(field)]));
  const memoryRequired = values.weights + values.runtimeOverhead + values.activeKv + values.systemReserve;
  const diskRequired = values.weights + values.diskOverhead + values.diskKv;
  const memoryHeadroom = values.ramTotal - memoryRequired;
  const diskHeadroom = values.diskFree - diskRequired;
  const memoryState = budgetState(values.ramTotal, memoryRequired);
  const diskState = budgetState(values.diskFree, diskRequired);
  const overallState = memoryState === 'danger' || diskState === 'danger'
    ? 'danger'
    : memoryState === 'warning' || diskState === 'warning' ? 'warning' : 'good';

  memoryNumbers.textContent = `${numberFormat.format(memoryRequired)} / ${numberFormat.format(values.ramTotal)} GiB`;
  diskNumbers.textContent = `${numberFormat.format(diskRequired)} / ${numberFormat.format(values.diskFree)} GiB`;
  memoryDetail.textContent = memoryHeadroom >= 0
    ? `保留 ${numberFormat.format(memoryHeadroom)}GiB 预算余量。`
    : `超出总内存 ${numberFormat.format(Math.abs(memoryHeadroom))}GiB。`;
  diskDetail.textContent = diskHeadroom >= 0
    ? `保留 ${numberFormat.format(diskHeadroom)}GiB 可用空间。`
    : `超出可用磁盘 ${numberFormat.format(Math.abs(diskHeadroom))}GiB。`;
  setBudgetBar(memoryBar, values.ramTotal, memoryRequired, memoryState);
  setBudgetBar(diskBar, values.diskFree, diskRequired, diskState);

  capacityBadge.className = 'status-badge';
  if (overallState === 'danger') {
    capacityStatus.textContent = '容量不足';
    capacityBadge.textContent = '需降级';
    capacityBadge.classList.add('danger');
    capacityAdvice.textContent = '先降低权重、上下文或磁盘 KV 预算；不要用换页或磁盘抖动换取“勉强加载”。';
  } else if (overallState === 'warning') {
    capacityStatus.textContent = '余量偏紧';
    capacityBadge.textContent = '需复测';
    capacityBadge.classList.add('warning');
    capacityAdvice.textContent = '先做小上下文冒烟测试并观察峰值 RSS、活跃 KV 与磁盘增长，再决定是否放大配置。';
  } else {
    capacityStatus.textContent = '可以进入验证';
    capacityBadge.textContent = '可行';
    capacityAdvice.textContent = '预算上可行，但仍需通过架构兼容、冷启动、预填、解码与连续请求实测。';
  }
}

Object.values(capacityFields).forEach((field) => field.addEventListener('input', () => {
  document.querySelectorAll('[data-preset]').forEach((button) => button.setAttribute('aria-pressed', 'false'));
  updateCapacity();
}));

document.querySelectorAll('[data-preset]').forEach((button) => {
  button.addEventListener('click', () => {
    Object.entries(presets[button.dataset.preset]).forEach(([key, value]) => {
      capacityFields[key].value = value;
    });
    document.querySelectorAll('[data-preset]').forEach((item) => item.setAttribute('aria-pressed', String(item === button)));
    updateCapacity();
  });
});
updateCapacity();

const runtimeOptions = {
  apple: {
    priority: '模型专用 Metal 运行时，随后比较 llama.cpp Metal 与 MLX',
    questions: ['是否明确支持该模型架构与 GGUF/MLX 制品？', '统一内存余量能否覆盖完整权重、运行时与活跃 KV？', '长上下文与工具调用是否经过实测？'],
    fallback: '缩小量化制品或上下文，再切换到已声明支持该架构的通用 Metal 路径。'
  },
  nvidia: {
    priority: 'CUDA 运行时、量化内核、显存分层与多 GPU 拓扑',
    questions: ['量化内核是否支持目标 GPU 架构？', '权重、KV 与并发能否落在显存预算内？', '跨卡通信和 CPU offload 会怎样影响首 token？'],
    fallback: '减少并发与上下文，采用更小量化或明确支持 CPU/GPU 分层的运行时。'
  },
  cpu: {
    priority: '内存带宽、NUMA/线程拓扑与首 token 延迟',
    questions: ['内存容量和持续带宽是否匹配权重？', '线程数是否贴合物理核心与 NUMA 节点？', '目标任务能否接受较高的首 token 延迟？'],
    fallback: '优先选择更小的 3B-8B Q4 制品，并把目标限定为低并发、短上下文任务。'
  }
};

const runtimePriority = document.getElementById('runtimePriority');
const runtimeQuestions = document.getElementById('runtimeQuestions');
const runtimeFallback = document.getElementById('runtimeFallback');

function selectRuntime(platform) {
  const option = runtimeOptions[platform];
  runtimePriority.textContent = option.priority;
  appendListItems(runtimeQuestions, option.questions);
  runtimeFallback.textContent = option.fallback;
  document.querySelectorAll('[data-platform]').forEach((button) => {
    const selected = button.dataset.platform === platform;
    button.setAttribute('aria-selected', String(selected));
    button.tabIndex = selected ? 0 : -1;
  });
}

document.querySelectorAll('[data-platform]').forEach((button) => {
  button.addEventListener('click', () => selectRuntime(button.dataset.platform));
});
selectRuntime('apple');

const verificationBoxes = [...document.querySelectorAll('[data-verification]')];
const verificationProgressText = document.getElementById('verificationProgressText');
const verificationProgressBar = document.getElementById('verificationProgressBar');
const savedVerification = new Set(readStorage('local-llm-verification', []));

function updateVerification() {
  const completed = verificationBoxes.filter((box) => box.checked).length;
  verificationProgressText.textContent = `${completed} / ${verificationBoxes.length}`;
  verificationProgressBar.style.width = `${(completed / verificationBoxes.length) * 100}%`;
  writeStorage('local-llm-verification', verificationBoxes.filter((box) => box.checked).map((box) => box.dataset.verification));
}

verificationBoxes.forEach((box) => {
  box.checked = savedVerification.has(box.dataset.verification);
  box.addEventListener('change', updateVerification);
});
document.getElementById('resetVerification').addEventListener('click', () => {
  verificationBoxes.forEach((box) => { box.checked = false; });
  updateVerification();
});
updateVerification();

const snippets = {
  probe: {
    title: 'Messages 冒烟测试',
    code: `bash ~/.codex/skills/deploy-local-llm/scripts/probe_anthropic_backend.sh \\
  --base-url http://127.0.0.1:8000 \\
  --model deepseek-v4-flash`,
    note: 'Claude Code 会在根地址后追加 /v1/messages；服务原生支持该路径时不要再多写一层前缀。'
  },
  config: {
    title: 'Claude Code 用户配置',
    code: `{
  "model": "deepseek-v4-pro[1m]",
  "env": {
    "ANTHROPIC_BASE_URL": "http://127.0.0.1:8000",
    "ANTHROPIC_AUTH_TOKEN": "local-only",
    "ANTHROPIC_MODEL": "deepseek-v4-pro[1m]",
    "CLAUDE_CODE_SUBAGENT_MODEL": "deepseek-v4-flash",
    "CLAUDE_CODE_EFFORT_LEVEL": "max",
    "CLAUDE_CODE_MAX_CONTEXT_TOKENS": "1000000",
    "CLAUDE_CODE_MAX_OUTPUT_TOKENS": "65536",
    "API_TIMEOUT_MS": "1800000",
    "CLAUDE_STREAM_IDLE_TIMEOUT_MS": "1800000",
    "ENABLE_TOOL_SEARCH": "false"
  }
}`,
    note: '按实际后端修改。不要把服务的 384K 极限输出直接设成客户端默认值，过大保留会压缩有效上下文。'
  },
  gate: {
    title: '真实工具调用闸门',
    code: `claude -p --tools Bash --allowedTools 'Bash(pwd)' \\
  'Use Bash exactly once to run pwd, then return only the path.'`,
    note: '验收日志应出现请求到达本地端口、tool_use、工具结果回注和第二轮生成四段证据。'
  }
};

const snippetTitle = document.getElementById('snippetTitle');
const snippetCode = document.getElementById('snippetCode');
const snippetNote = document.getElementById('snippetNote');
const copyStatus = document.getElementById('copyStatus');
let activeSnippet = 'probe';

function selectSnippet(name) {
  activeSnippet = name;
  snippetTitle.textContent = snippets[name].title;
  snippetCode.textContent = snippets[name].code;
  snippetNote.textContent = snippets[name].note;
  copyStatus.textContent = '';
  document.querySelectorAll('[data-snippet]').forEach((button) => {
    const selected = button.dataset.snippet === name;
    button.setAttribute('aria-selected', String(selected));
    button.tabIndex = selected ? 0 : -1;
  });
}

document.querySelectorAll('[data-snippet]').forEach((button) => {
  button.addEventListener('click', () => selectSnippet(button.dataset.snippet));
});

async function copyText(value) {
  if (navigator.clipboard && window.isSecureContext) {
    await navigator.clipboard.writeText(value);
    return;
  }
  const textarea = document.createElement('textarea');
  textarea.value = value;
  textarea.setAttribute('readonly', '');
  textarea.style.position = 'fixed';
  textarea.style.opacity = '0';
  document.body.append(textarea);
  textarea.select();
  const copied = document.execCommand('copy');
  textarea.remove();
  if (!copied) throw new Error('copy failed');
}

document.getElementById('copySnippet').addEventListener('click', async () => {
  try {
    await copyText(snippets[activeSnippet].code);
    copyStatus.textContent = '已复制到剪贴板';
  } catch (_) {
    copyStatus.textContent = '复制失败，请手动选择代码';
  }
});
selectSnippet('probe');

function bindArrowNavigation(selector) {
  const buttons = [...document.querySelectorAll(selector)];
  buttons.forEach((button, index) => {
    button.addEventListener('keydown', (event) => {
      if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;
      event.preventDefault();
      const direction = event.key === 'ArrowRight' ? 1 : -1;
      const next = buttons[(index + direction + buttons.length) % buttons.length];
      next.focus();
      next.click();
    });
  });
}

bindArrowNavigation('[data-platform]');
bindArrowNavigation('[data-snippet]');

const troubleSearch = document.getElementById('troubleSearch');
const troubleRows = [...document.querySelectorAll('#troubleRows tr')];
const troubleCount = document.getElementById('troubleCount');

troubleSearch.addEventListener('input', () => {
  const query = troubleSearch.value.trim().toLocaleLowerCase('zh-CN');
  let visible = 0;
  troubleRows.forEach((row) => {
    const matches = row.textContent.toLocaleLowerCase('zh-CN').includes(query);
    row.hidden = !matches;
    if (matches) visible += 1;
  });
  troubleCount.textContent = `显示 ${visible} 条`;
});
