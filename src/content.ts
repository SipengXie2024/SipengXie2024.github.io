import { coreLessons } from "./lessons-core";
import { runtimeLessons } from "./lessons-runtime";
import { systemsLessons } from "./lessons-systems";

export const baseline = {
  repository: "earendil-works/pi",
  release: "v0.80.6",
  commit: "8479bd84743e8889f728acb21a62794102db0529",
  verifiedAt: "2026-07-13",
};

export const lessons = [...coreLessons, ...runtimeLessons, ...systemsLessons];

export const chapters = [
  { label: "执行内核与状态", range: "01–06", lessonIds: [1, 2, 3, 4, 5, 6] },
  { label: "Runtime 与可靠性", range: "07–12", lessonIds: [7, 8, 9, 10, 11, 12] },
  { label: "分布式与统一框架", range: "13–18", lessonIds: [13, 14, 15, 16, 17, 18] },
];

const sourceRoot = `https://github.com/${baseline.repository}/blob/${baseline.commit}`;

export const sourceLinks = [
  { label: "Pi 官方文档", href: "https://pi.dev/docs/latest" },
  { label: "Agent Loop", href: `${sourceRoot}/packages/agent/src/agent-loop.ts` },
  { label: "Agent Wrapper", href: `${sourceRoot}/packages/agent/src/agent.ts` },
  { label: "Agent Types", href: `${sourceRoot}/packages/agent/src/types.ts` },
  { label: "Model Runtime", href: `${sourceRoot}/packages/ai` },
  { label: "Coding Agent Core", href: `${sourceRoot}/packages/coding-agent/src/core` },
  { label: "Print Mode", href: `${sourceRoot}/packages/coding-agent/src/modes/print-mode.ts` },
  { label: "RPC 文档", href: `${sourceRoot}/packages/coding-agent/docs/rpc.md` },
  { label: "Orchestrator", href: `${sourceRoot}/packages/orchestrator` },
];
