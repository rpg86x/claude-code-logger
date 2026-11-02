// Claude Code Logger — leest de lokale Claude Code transcripts (~/.claude/projects)
// en toont prompts en programmeertijd in een dashboard op http://localhost:4317
const http = require("http");
const fs = require("fs");
const path = require("path");
const os = require("os");

const PORT = Number(process.env.PORT) || 4317;
const PROJECTS_DIR = path.join(os.homedir(), ".claude", "projects");
const cache = new Map(); // bestand -> { mtimeMs, size, parsed }

// Eigen archief: Claude Code wist transcripts na verloop van tijd,
// dus alles wat we ooit gezien hebben bewaren we hier zelf. Het archief staat
// naast de versiemappen (D:\Claude Code Logger\data), zodat elke versie het deelt.
const ARCHIVE_FILE = path.join(__dirname, "..", "data", "archive.json");
const archive = loadArchive();

function loadArchive() {
  try {
    const a = JSON.parse(fs.readFileSync(ARCHIVE_FILE, "utf8"));
    return { prompts: new Map(a.prompts.map(p => [p.id, p])), activity: new Set(a.activity) };
  } catch {
    return { prompts: new Map(), activity: new Set() };
  }
}

function saveArchive() {
  fs.mkdirSync(path.dirname(ARCHIVE_FILE), { recursive: true });
  const body = JSON.stringify({
    version: 1,
    saved: new Date().toISOString(),
    prompts: [...archive.prompts.values()].sort((a, b) => a.ts - b.ts),
    activity: [...archive.activity].sort((a, b) => a - b),
  });
  const tmp = ARCHIVE_FILE + ".tmp";
  fs.writeFileSync(tmp, body);
  fs.renameSync(tmp, ARCHIVE_FILE);
}

function walk(dir) {
  let out = [];
  let entries;
  try { entries = fs.readdirSync(dir, { withFileTypes: true }); } catch { return out; }
  for (const e of entries) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) out = out.concat(walk(p));
    else if (e.name.endsWith(".jsonl")) out.push(p);
  }
  return out;
}

function promptText(msg) {
  const c = msg && msg.content;
  const parts = typeof c === "string" ? [c] : Array.isArray(c) ? c.filter(x => x.type === "text").map(x => x.text) : [];
  if (!parts.length) return null;
  return parts.join("\n")
    .replace(/<system-reminder>[\s\S]*?<\/system-reminder>/g, "")
    .replace(/<pasted_content[^>]*>[\s\S]*?<\/pasted_content[^>]*>/g, "[geplakte tekst]")
    .trim();
}

function isHumanPrompt(o, text) {
  if (o.type !== "user" || o.isSidechain || o.isMeta || o.toolUseResult) return false;
  if (!text) return false;
  if (o.origin && o.origin.kind) return o.origin.kind === "human";
  if (o.turnOrigin) return o.turnOrigin === "human";
  // Oudere transcripts zonder origin-velden: sluit command-/systeemberichten uit
  return !/^<(command-|local-command|task-notification|bash-)/.test(text);
}

function projectName(cwd) {
  if (!cwd) return "Onbekend";
  if (/scratch-workspaces/i.test(cwd)) return "Zonder map";
  return path.basename(cwd);
}

function parseFile(file) {
  const res = { prompts: [], activity: [], titles: {} };
  let data;
  try { data = fs.readFileSync(file, "utf8"); } catch { return res; }
  for (const line of data.split("\n")) {
    if (!line) continue;
    let o;
    try { o = JSON.parse(line); } catch { continue; }
    if (o.type === "custom-title" && o.sessionId) { res.titles[o.sessionId] = o.customTitle; continue; }
    if (o.type === "agent-name" && o.sessionId && !res.titles[o.sessionId]) { res.titles[o.sessionId] = o.agentName; continue; }
    if ((o.type !== "user" && o.type !== "assistant") || !o.timestamp) continue;
    const ts = Date.parse(o.timestamp);
    if (isNaN(ts)) continue;
    if (!o.isSidechain) res.activity.push(ts);
    if (o.type === "user") {
      const text = promptText(o.message);
      if (isHumanPrompt(o, text)) {
        res.prompts.push({ id: o.uuid || ts + text.slice(0, 40), ts, text, session: o.sessionId, project: projectName(o.cwd) });
      }
    }
  }
  return res;
}

function collect() {
  const files = walk(PROJECTS_DIR);
  const prompts = archive.prompts;
  const activity = archive.activity;
  const before = prompts.size + activity.size;
  const titles = {};
  for (const f of files) {
    let st;
    try { st = fs.statSync(f); } catch { continue; }
    let c = cache.get(f);
    if (!c || c.mtimeMs !== st.mtimeMs || c.size !== st.size) {
      c = { mtimeMs: st.mtimeMs, size: st.size, parsed: parseFile(f) };
      cache.set(f, c);
    }
    // Geforkte sessies kopiëren eerdere berichten: ontdubbelen op uuid
    for (const p of c.parsed.prompts) if (!prompts.has(p.id)) prompts.set(p.id, p);
    for (const t of c.parsed.activity) activity.add(t);
    Object.assign(titles, c.parsed.titles);
  }
  // Sessietitels kunnen later pas bekend worden; bewaar ze bij de prompt
  let changed = prompts.size + activity.size !== before;
  for (const p of prompts.values()) {
    const t = titles[p.session];
    if (t && p.title !== t) { p.title = t; changed = true; }
  }
  if (changed) saveArchive();
  const list = [...prompts.values()].sort((a, b) => a.ts - b.ts)
    .map(p => ({ ...p, title: p.title || null }));
  const first = list.length ? list[0].ts : null;
  return { generated: Date.now(), files: files.length, archiveSince: first, prompts: list, activity: [...activity].sort((a, b) => a - b) };
}

const server = http.createServer((req, res) => {
  if (req.url.startsWith("/api/data")) {
    try {
      const demo = /[?&]demo\b/.test(req.url);
      const lang = (req.url.match(/[?&]lang=([a-z]{2})/) || [])[1];
      const body = JSON.stringify(demo ? require("./demo").demoData(120, lang) : collect());
      res.writeHead(200, { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" });
      res.end(body);
    } catch (e) {
      res.writeHead(500, { "Content-Type": "text/plain" });
      res.end(String(e));
    }
    return;
  }
  if (req.url === "/i18n.js") {
    res.writeHead(200, { "Content-Type": "text/javascript; charset=utf-8" });
    fs.createReadStream(path.join(__dirname, "i18n.js")).pipe(res);
    return;
  }
  if (req.url === "/" || req.url.startsWith("/?")) {
    res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
    fs.createReadStream(path.join(__dirname, "index.html")).pipe(res);
    return;
  }
  res.writeHead(404); res.end();
});

const url = `http://localhost:${PORT}`;
function openBrowser() {
  if (!process.argv.includes("--no-open")) require("child_process").exec(`start "" "${url}"`);
}

// Draait de logger al? Open dan alleen het dashboard opnieuw.
server.on("error", e => {
  if (e.code === "EADDRINUSE") { openBrowser(); setTimeout(() => process.exit(0), 1500); }
  else throw e;
});

server.listen(PORT, "127.0.0.1", () => {
  console.log(`Claude Code Logger draait op ${url}`);
  console.log(`Leest transcripts uit ${PROJECTS_DIR}`);
  openBrowser();
});
