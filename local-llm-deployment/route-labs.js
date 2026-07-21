const routeLabData = {
  audit: {
    unix: {
      note: '在任意目录执行。脚本会自动区分 macOS 与 Linux / WSL。',
      command: `python3 - <<'PY'
import os
import platform
import shutil
import subprocess

system = platform.system()
if system == "Darwin":
    ram_bytes = int(subprocess.check_output(["sysctl", "-n", "hw.memsize"]))
else:
    ram_bytes = os.sysconf("SC_PAGE_SIZE") * os.sysconf("SC_PHYS_PAGES")

print("system:", system, platform.machine())
print("cpu_threads:", os.cpu_count())
print("ram_gib:", round(ram_bytes / 2**30, 1))
print("disk_free_gib:", round(shutil.disk_usage(".").free / 2**30, 1))
PY`,
      output: `system: Darwin arm64
cpu_threads: 12
ram_gib: 32.0
disk_free_gib: 120.4`,
      criterion: '出现四个字段即可；数字因机器而异，请记下 ram_gib 与 disk_free_gib。'
    },
    windows: {
      note: '在任意 PowerShell 窗口执行。示例读取系统盘 C: 的剩余空间。',
      command: `Add-Type -AssemblyName Microsoft.VisualBasic
$computer = [Microsoft.VisualBasic.Devices.ComputerInfo]::new()
$disk = Get-PSDrive -Name C
"system: Windows $env:PROCESSOR_ARCHITECTURE"
"cpu_threads: $([Environment]::ProcessorCount)"
"ram_gib: $([math]::Round($computer.TotalPhysicalMemory / 1GB, 1))"
"disk_free_gib: $([math]::Round($disk.Free / 1GB, 1))"`,
      output: `system: Windows AMD64
cpu_threads: 16
ram_gib: 32.0
disk_free_gib: 120.4`,
      criterion: '出现四个字段即可；数字因机器而异，请记下 ram_gib 与 disk_free_gib。'
    }
  },
  model: {
    unix: {
      note: '先把第一行改成教师提供的 GGUF 文件路径，再整段执行。',
      command: `export MODEL="$HOME/models/student-model-q4.gguf"
python3 - "$MODEL" <<'PY'
import os
import sys

path = os.path.expanduser(sys.argv[1])
exists = os.path.isfile(path)
print("exists:", exists)
print("name:", os.path.basename(path) if exists else "missing")
print("size_gib:", round(os.path.getsize(path) / 2**30, 2) if exists else "missing")
PY`,
      output: `exists: True
name: student-model-q4.gguf
size_gib: 4.37`,
      criterion: 'exists 必须为 True，文件名以 .gguf 结尾，size_gib 应明显小于第一步的 ram_gib。'
    },
    windows: {
      note: '先把第一行改成教师提供的 GGUF 文件路径，再整段执行。',
      command: `$env:MODEL = "$HOME\\models\\student-model-q4.gguf"
$file = Get-Item -LiteralPath $env:MODEL -ErrorAction SilentlyContinue
if ($file) {
  "exists: True"
  "name: $($file.Name)"
  "size_gib: $([math]::Round($file.Length / 1GB, 2))"
} else {
  "exists: False"
  "name: missing"
  "size_gib: missing"
}`,
      output: `exists: True
name: student-model-q4.gguf
size_gib: 4.37`,
      criterion: 'exists 必须为 True，文件名以 .gguf 结尾，size_gib 应明显小于第一步的 ram_gib。'
    }
  },
  run: {
    unix: {
      note: 'llama-cli 需要已加入 PATH；MODEL 沿用第二步设置。',
      command: `llama-cli -m "$MODEL" -p "Reply with only: LOCAL_OK" -n 16`,
      output: `LOCAL_OK

llama_perf_context_print: ...`,
      criterion: '回答中出现 LOCAL_OK，且没有崩溃、内存不足或模型加载失败。末尾的性能日志属于正常输出。'
    },
    windows: {
      note: '在 llama.cpp 可执行文件目录运行；MODEL 沿用第二步设置。',
      command: `.\\llama-cli.exe -m $env:MODEL -p "Reply with only: LOCAL_OK" -n 16`,
      output: `LOCAL_OK

llama_perf_context_print: ...`,
      criterion: '回答中出现 LOCAL_OK，且没有崩溃、内存不足或模型加载失败。末尾的性能日志属于正常输出。'
    }
  },
  serve: {
    unix: {
      note: '在终端 A 启动服务并保持运行，再到终端 B 验证。',
      command: `# Terminal A
llama-server -m "$MODEL" --alias student-model --host 127.0.0.1 --port 8000 -c 4096

# Terminal B
curl -s http://127.0.0.1:8000/v1/models`,
      output: `{
  "object": "list",
  "data": [
    { "id": "student-model", "object": "model" }
  ]
}`,
      criterion: '终端 A 显示服务监听 127.0.0.1:8000；终端 B 返回 JSON，data 中能看到 student-model。'
    },
    windows: {
      note: '在 PowerShell A 启动服务并保持运行，再到 PowerShell B 验证。',
      command: `# PowerShell A
.\\llama-server.exe -m $env:MODEL --alias student-model --host 127.0.0.1 --port 8000 -c 4096

# PowerShell B
Invoke-RestMethod http://127.0.0.1:8000/v1/models | ConvertTo-Json -Depth 6`,
      output: `{
  "object": "list",
  "data": [
    { "id": "student-model", "object": "model" }
  ]
}`,
      criterion: 'PowerShell A 显示服务监听 127.0.0.1:8000；PowerShell B 返回 JSON，data 中能看到 student-model。'
    }
  },
  api: {
    unix: {
      note: '保持第四步的 llama-server 运行，在另一个终端发送请求。',
      command: `curl -s http://127.0.0.1:8000/v1/messages \\
  -H 'content-type: application/json' \\
  -H 'x-api-key: local-only' \\
  -H 'anthropic-version: 2023-06-01' \\
  -d '{"model":"student-model","max_tokens":32,"messages":[{"role":"user","content":"Reply with only: MESSAGES_OK"}]}'`,
      output: `{
  "type": "message",
  "role": "assistant",
  "content": [
    { "type": "text", "text": "MESSAGES_OK" }
  ]
}`,
      criterion: '请求返回成功，JSON 的 content 中出现 MESSAGES_OK。若得到 404，请更新 llama.cpp 或换用支持 Anthropic Messages 的适配层。'
    },
    windows: {
      note: '保持第四步的 llama-server 运行，在另一个 PowerShell 窗口发送请求。',
      command: `$body = @{
  model = "student-model"
  max_tokens = 32
  messages = @(@{ role = "user"; content = "Reply with only: MESSAGES_OK" })
} | ConvertTo-Json -Depth 6

$headers = @{
  "x-api-key" = "local-only"
  "anthropic-version" = "2023-06-01"
}

$response = Invoke-RestMethod -Method Post -Uri "http://127.0.0.1:8000/v1/messages" -Headers $headers -ContentType "application/json" -Body $body
$response | ConvertTo-Json -Depth 8`,
      output: `{
  "type": "message",
  "role": "assistant",
  "content": [
    { "type": "text", "text": "MESSAGES_OK" }
  ]
}`,
      criterion: '请求返回成功，JSON 的 content 中出现 MESSAGES_OK。若得到 404，请更新 llama.cpp 或换用支持 Anthropic Messages 的适配层。'
    }
  },
  client: {
    unix: {
      note: '在一个测试项目目录执行；本地模型需要支持工具调用。',
      command: `export ANTHROPIC_BASE_URL="http://127.0.0.1:8000"
export ANTHROPIC_AUTH_TOKEN="local-only"
export ANTHROPIC_MODEL="student-model"

claude -p --tools Bash --allowedTools 'Bash(pwd)' 'Use Bash exactly once to run pwd, then return only the path.'`,
      output: `/Users/student/project

# Linux / WSL 也可能是 /home/student/project`,
      criterion: '返回路径与当前项目目录一致；服务日志中应能看到工具调用前后两轮 /v1/messages 请求。'
    },
    windows: {
      note: '在测试项目目录执行；需先安装 Git for Windows，使 Claude Code 能使用 Git Bash。',
      command: `$env:ANTHROPIC_BASE_URL = "http://127.0.0.1:8000"
$env:ANTHROPIC_AUTH_TOKEN = "local-only"
$env:ANTHROPIC_MODEL = "student-model"

claude -p --tools Bash --allowedTools "Bash(pwd)" "Use Bash exactly once to run pwd, then return only the path."`,
      output: `C:\\Users\\student\\project

# Git Bash 也可能显示 /c/Users/student/project`,
      criterion: '返回路径与当前项目目录一致；服务日志中应能看到工具调用前后两轮 /v1/messages 请求。'
    }
  }
};

const routePlatformNames = {
  unix: 'macOS / Linux / WSL',
  windows: 'Windows PowerShell'
};

const routeOsTabs = [...document.querySelectorAll('[data-route-os]')];
const routeLabMounts = [...document.querySelectorAll('[data-route-lab]')];
const routePanelRefs = new Map();

function routeElement(tagName, className, textContent) {
  const element = document.createElement(tagName);
  if (className) element.className = className;
  if (textContent !== undefined) element.textContent = textContent;
  return element;
}

function buildRoutePanel(mount, index) {
  const details = routeElement('details', 'route-command');
  details.open = index === 0;

  const summary = routeElement('summary');
  const summaryTitle = routeElement('span', '', '命令与期望结果');
  const platformName = routeElement('small', 'route-platform-name');
  summary.append(summaryTitle, platformName);

  const content = routeElement('div', 'route-command-grid');
  const commandSection = routeElement('section', 'route-command-section');
  const commandHeading = routeElement('div', 'route-command-heading');
  commandHeading.append(routeElement('span', '', '执行命令'));

  const copyButton = routeElement('button', 'icon-button compact route-copy-button', '\u29C9');
  copyButton.type = 'button';
  copyButton.setAttribute('aria-label', '复制本步命令');
  copyButton.title = '复制命令';
  commandHeading.append(copyButton);

  const note = routeElement('p', 'route-command-note');
  const commandPre = routeElement('pre', 'route-code');
  const commandCode = routeElement('code');
  commandPre.append(commandCode);
  commandSection.append(commandHeading, note, commandPre);

  const outputSection = routeElement('section', 'route-command-section route-command-output');
  outputSection.append(routeElement('div', 'route-command-heading', '期望看到'));
  const outputPre = routeElement('pre', 'route-output');
  const outputCode = routeElement('samp');
  outputPre.append(outputCode);
  const criterion = routeElement('p', 'route-criterion');
  criterion.append(routeElement('strong', '', '通过标准'), document.createTextNode(' '));
  const criterionText = routeElement('span');
  criterion.append(criterionText);
  outputSection.append(outputPre, criterion);

  content.append(commandSection, outputSection);
  details.append(summary, content);
  mount.append(details);

  const step = mount.dataset.routeLab;
  copyButton.addEventListener('click', async () => {
    const selectedTab = routeOsTabs.find((tab) => tab.getAttribute('aria-selected') === 'true');
    const os = selectedTab ? selectedTab.dataset.routeOs : 'unix';
    try {
      await copyText(routeLabData[step][os].command);
      copyButton.textContent = '\u2713';
      copyButton.setAttribute('aria-label', '命令已复制');
      setTimeout(() => {
        copyButton.textContent = '\u29C9';
        copyButton.setAttribute('aria-label', '复制本步命令');
      }, 1400);
    } catch (_) {
      copyButton.textContent = '!';
      copyButton.setAttribute('aria-label', '复制失败，请手动选择命令');
    }
  });

  routePanelRefs.set(step, { platformName, note, commandCode, outputCode, criterionText });
}

routeLabMounts.forEach(buildRoutePanel);

function selectRouteOs(os) {
  routeOsTabs.forEach((tab) => {
    const selected = tab.dataset.routeOs === os;
    tab.setAttribute('aria-selected', String(selected));
    tab.tabIndex = selected ? 0 : -1;
  });

  routePanelRefs.forEach((refs, step) => {
    const lab = routeLabData[step][os];
    refs.platformName.textContent = routePlatformNames[os];
    refs.note.textContent = lab.note;
    refs.commandCode.textContent = lab.command;
    refs.outputCode.textContent = lab.output;
    refs.criterionText.textContent = lab.criterion;
  });

  writeStorage('local-llm-route-os', os);
}

routeOsTabs.forEach((tab) => {
  tab.addEventListener('click', () => selectRouteOs(tab.dataset.routeOs));
});

const savedRouteOs = readStorage('local-llm-route-os', null);
const browserPlatform = navigator.userAgentData?.platform || navigator.platform || navigator.userAgent;
const detectedRouteOs = /windows/i.test(browserPlatform) ? 'windows' : 'unix';
const initialRouteOs = Object.prototype.hasOwnProperty.call(routePlatformNames, savedRouteOs) ? savedRouteOs : detectedRouteOs;
selectRouteOs(initialRouteOs);
bindArrowNavigation('[data-route-os]');
