import { JSDOM } from "jsdom";
import { lessons } from "../src/content";

const dom = new JSDOM("<!doctype html><html><body></body></html>");
Object.assign(globalThis, {
  window: dom.window,
  document: dom.window.document,
  DOMParser: dom.window.DOMParser,
  HTMLElement: dom.window.HTMLElement,
  SVGElement: dom.window.SVGElement,
});

const { default: mermaid } = await import("mermaid");
mermaid.initialize({ startOnLoad: false, securityLevel: "strict" });

const failures: string[] = [];

for (const lesson of lessons) {
  try {
    await mermaid.parse(lesson.diagram.chart);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    failures.push(`Lesson ${lesson.id}: ${message}`);
  }
}

if (failures.length > 0) {
  console.error(failures.join("\n\n"));
  process.exitCode = 1;
} else {
  console.log(`Validated ${lessons.length} Mermaid diagrams.`);
}
