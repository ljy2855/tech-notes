// scripts/prerender-dataview.mjs
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { execSync } from "child_process";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const REPO_ROOT = path.resolve(__dirname, "..");
const CONTENT_DIR = path.join(REPO_ROOT, "content");
const BASE_URL = process.env.SITE_BASE || "https://ljy2855.github.io/tech-notes";
const DV_FENCE_RE = /```dataview\s+([\s\S]*?)```/g;

function walk(dir) {
  const out = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...walk(p));
    else if (entry.isFile() && p.endsWith(".md")) out.push(p);
  }
  return out;
}

function getTitle(mdPath, raw) {
  const h1 = raw.match(/^#\s+(.*)$/m);
  if (h1) return h1[1].trim();
  return path.basename(mdPath, ".md");
}

function stripContentPrefix(mdPath) {
  const rel = path.relative(REPO_ROOT, mdPath).replaceAll("\\", "/");
  const folder = path.posix.dirname(rel);
  return folder.startsWith("content/") ? folder.slice("content/".length) : folder;
}

function slugifySegment(s) {
  return s.trim().replace(/\s+/g, "-");
}

function toQuartzUrl(mdAbsPath) {
  const rel = path.relative(REPO_ROOT, mdAbsPath).replaceAll("\\", "/");
  let pathNoContent = rel.replace(/^content\//, "");
  const parts = pathNoContent.split("/");

  const last = parts.pop();
  const base = last.replace(/\.md$/i, "");

  if (base.toLowerCase() === "index") {
    const folderSegments = parts.map(slugifySegment);
    const joined = folderSegments.join("/");
    return `${BASE_URL}/${encodeURI(joined)}`;
  }

  const slugSegments = [...parts.map(slugifySegment), slugifySegment(base)];
  const joined = slugSegments.join("/");
  return `${BASE_URL}/${encodeURI(joined)}`;
}

function shouldHandleQuery(block) {
  return /from\s+"content"/i.test(block);
}

function renderTableRows(files) {
  const header = `| title | category | updated |\n|---|---|---|`;
  const rows = files.map(f => {
    const href = toQuartzUrl(f.path);
    const date = new Date(f.mtime).toISOString().slice(0, 19).replace("T", " ");
    return `| [${f.title}](${href}) | ${f.category} | ${date} |`;
  });
  return [header, ...rows].join("\n");
}

function getGitModifiedTime(filepath) {
  try {
    const out = execSync(`git log -1 --format=%ct -- "${filepath}"`, {
      cwd: REPO_ROOT,
      stdio: ["ignore", "pipe", "ignore"],
    }).toString().trim();
    if (out) {
      return parseInt(out, 10) * 1000;
    }
  } catch (e) {}
  return null;
}

function processIndexMarkdown(mdPath) {
  const raw = fs.readFileSync(mdPath, "utf8");
  let replaced = false;

  const newBody = raw.replace(DV_FENCE_RE, (whole, block) => {
    if (!shouldHandleQuery(block)) return whole;

    const excludeIndex =
      /where\s+(?:lower\(file\.name\)\s*!=\s*"index"|file\.name\s*!=\s*"index")/i.test(block);
    const sortByMtimeDesc = /sort\s+file\.mtime\s+desc/i.test(block);

    const all = walk(CONTENT_DIR).map(p => {
      const stat = fs.statSync(p);
      const gitMtime = getGitModifiedTime(p);
      const md = fs.readFileSync(p, "utf8");
      return {
        path: p,
        mtime: gitMtime || stat.mtimeMs,
        title: getTitle(p, md),
        base: path.basename(p, ".md"),
        category: stripContentPrefix(p),
      };
    });

    let filtered = all;
    if (excludeIndex) {
      filtered = filtered.filter(f => f.base.toLowerCase() !== "index");
    }
    if (sortByMtimeDesc) {
      filtered.sort((a, b) => b.mtime - a.mtime);
    }

    const table = renderTableRows(filtered);
    replaced = true;
    return table + "\n";
  });

  if (replaced) {
    fs.writeFileSync(mdPath, newBody, "utf8");
    console.log(`[prerender-dataview] updated ${path.relative(REPO_ROOT, mdPath)}`);
  }
}

function main() {
  const mdFiles = walk(CONTENT_DIR);
  const indexFiles = mdFiles.filter(f => path.basename(f).toLowerCase() === "index.md");
  for (const f of indexFiles) {
    processIndexMarkdown(f);
  }
  console.log("[prerender-dataview] done.");
}

main();