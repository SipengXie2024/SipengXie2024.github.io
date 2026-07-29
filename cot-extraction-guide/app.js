const root = document.documentElement;
const themeToggle = document.getElementById('themeToggle');
const themeIcon = themeToggle.querySelector('span');

let savedTheme = null;
try {
  savedTheme = localStorage.getItem('reasoning-security-theme');
} catch (_) {}

if (savedTheme === 'light' || savedTheme === 'dark') root.dataset.theme = savedTheme;

function syncTheme() {
  const dark = root.dataset.theme === 'dark';
  themeIcon.textContent = dark ? '\u263C' : '\u263E';
  themeToggle.setAttribute('aria-pressed', String(dark));
}

syncTheme();
themeToggle.addEventListener('click', () => {
  root.dataset.theme = root.dataset.theme === 'dark' ? 'light' : 'dark';
  try {
    localStorage.setItem('reasoning-security-theme', root.dataset.theme);
  } catch (_) {}
  syncTheme();
});

const recommendations = {
  gpt: {
    complete: {
      index: '01',
      name: 'Blob Replay',
      reason: '该路径直接恢复 Responses API 返回的密封推理状态，是当前记录中 GPT-5.5 完整度最高的方案。',
      href: '#blob'
    },
    stable: {
      index: '02',
      name: 'Tool Calling',
      reason: '强制调用带 reasoning 字段的函数，结果结构稳定、易解析，也便于自动核验 Canary 与最终答案。',
      href: '#tool'
    },
    portable: {
      index: '03',
      name: 'REP',
      reason: '只依赖常规对话接口和示例格式，不要求网关提供 encrypted_content 或 Anthropic signature 恢复。',
      href: '#rep'
    },
    deep: {
      index: '01',
      name: 'Blob Replay + 定向追问',
      reason: '先恢复密封状态，再围绕列方程、进位或分支逐项追问，可获得比单次宽泛请求更细的中间步骤。',
      href: '#blob'
    }
  },
  opus: {
    complete: {
      index: '03',
      name: 'REP / no thinking',
      reason: '实验记录中，无 thinking 的 REP 提供最长的单轮可见推理，适合作为完整度优先的起点。',
      href: '#rep'
    },
    stable: {
      index: '02',
      name: 'Detailed Tool Schema',
      reason: '把问题阶段拆成独立字段，能稳定获得结构化结果，并直接检查每个步骤是否缺失。',
      href: '#tool'
    },
    portable: {
      index: '03',
      name: 'REP',
      reason: '无需特殊状态恢复接口；agent-tool XML 或 numbered steps 都可通过普通 Messages API 运行。',
      href: '#rep'
    },
    deep: {
      index: '04',
      name: '多轮苏格拉底追问',
      reason: '每轮只索取一个明确中间产物，逐步深入并在末轮验证 Canary，是当前记录中 Opus 最深的路径。',
      href: '#socratic'
    }
  }
};

const modelButtons = [...document.querySelectorAll('[data-model]')];
const goalButtons = [...document.querySelectorAll('[data-goal]')];
const recommendationIndex = document.getElementById('recommendationIndex');
const recommendationName = document.getElementById('recommendationName');
const recommendationReason = document.getElementById('recommendationReason');
const recommendationLink = document.getElementById('recommendationLink');

let selectedModel = 'gpt';
let selectedGoal = 'complete';

function updateRecommendation() {
  const recommendation = recommendations[selectedModel][selectedGoal];
  recommendationIndex.textContent = recommendation.index;
  recommendationName.textContent = recommendation.name;
  recommendationReason.textContent = recommendation.reason;
  recommendationLink.href = recommendation.href;

  modelButtons.forEach((button) => {
    button.setAttribute('aria-pressed', String(button.dataset.model === selectedModel));
  });
  goalButtons.forEach((button) => {
    button.setAttribute('aria-pressed', String(button.dataset.goal === selectedGoal));
  });
}

modelButtons.forEach((button) => {
  button.addEventListener('click', () => {
    selectedModel = button.dataset.model;
    updateRecommendation();
  });
});

goalButtons.forEach((button) => {
  button.addEventListener('click', () => {
    selectedGoal = button.dataset.goal;
    updateRecommendation();
  });
});

document.querySelectorAll('.segmented').forEach((group) => {
  const buttons = [...group.querySelectorAll('button')];
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

document.querySelectorAll('.copy-button').forEach((button) => {
  button.addEventListener('click', async () => {
    const code = button.closest('.code-shell').querySelector('code').textContent;
    try {
      await copyText(code);
      button.textContent = '\u2713';
      button.setAttribute('aria-label', '代码已复制');
      setTimeout(() => {
        button.textContent = '\u29C9';
        button.setAttribute('aria-label', '复制代码');
      }, 1400);
    } catch (_) {
      button.textContent = '!';
      button.setAttribute('aria-label', '复制失败，请手动选择代码');
    }
  });
});

const tocLinks = [...document.querySelectorAll('.toc nav a')];
const observedSections = tocLinks
  .map((link) => document.querySelector(link.getAttribute('href')))
  .filter(Boolean);

if ('IntersectionObserver' in window) {
  const observer = new IntersectionObserver((entries) => {
    const visible = entries
      .filter((entry) => entry.isIntersecting)
      .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
    if (!visible) return;

    tocLinks.forEach((link) => {
      const active = link.getAttribute('href') === `#${visible.target.id}`;
      if (active) link.setAttribute('aria-current', 'location');
      else link.removeAttribute('aria-current');
    });
  }, { rootMargin: '-18% 0px -64% 0px', threshold: [0, 0.15, 0.4] });

  observedSections.forEach((section) => observer.observe(section));
}

updateRecommendation();
