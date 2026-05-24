import { readFile } from "node:fs/promises";

const registry = "https://cdn.jsdelivr.net/gh/StevenBuglione/wiki-data-registry@main/sources.json";
const response = await fetch(registry);
if (!response.ok) throw new Error(`registry smoke failed: HTTP ${response.status}`);
const data = await response.json();
if (data.routeMode !== "query") throw new Error("registry routeMode must be query");
const runtime = await readFile("src/components/WikiRuntime.tsx", "utf8");
const styles = await readFile("src/components/WikiRuntime.module.css", "utf8");
if (!runtime.includes("styles.citationPill")) throw new Error("runtime must render numeric citations as pills");
if (!runtime.includes("Citation ${label}")) throw new Error("citation pills must include accessible labels");
if (!runtime.includes("/^\\d+$/")) throw new Error("citation pill detection must stay limited to numeric links");
if (!styles.includes(".citationPill")) throw new Error("citation pill styles are missing");
if (!styles.includes('h2[id="sources"] + ol')) throw new Error("Sources list polish is missing");
console.log("wiki-site smoke ok");
