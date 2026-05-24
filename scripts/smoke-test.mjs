const registry = "https://cdn.jsdelivr.net/gh/StevenBuglione/wiki-data-registry@main/sources.json";
const response = await fetch(registry);
if (!response.ok) throw new Error(`registry smoke failed: HTTP ${response.status}`);
const data = await response.json();
if (data.routeMode !== "query") throw new Error("registry routeMode must be query");
console.log("wiki-site smoke ok");
