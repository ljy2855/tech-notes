// scripts/prerender-dataview.mjs
// 목적: content/ 아래 "index.md" 파일들 안의 ```dataview 블록만``` 찾아
//       정적 Markdown 표로 치환하여 Quartz 빌드에 반영.
// 링크 형식: https://<BASE>/...  (BASE_URL 환경변수로 주입 가능)

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const REPO_ROOT = path.resolve(__dirname, "..");
const CONTENT_DIR = path.join(REPO_ROOT, "content");

// 베이스 URL (예: https://ljy2855.github.io/obsidian.md)
const BASE_URL = process.env.SITE_BASE || "https://ljy2855.github.io/obsidian.md";

// Dataview 코드블록 탐지
const DV_FENCE_RE = /```dataview\s+([\s\S]*?)```/g;

// -------- 파일 탐색/유틸 --------
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
  // 문서 내 첫 H1을 제목으로, 없으면 파일명
  const h1 = raw.match(/^#\s+(.*)$/m);
  if (h1) return h1[1].trim();
  return path.basename(mdPath, ".md");
}

function stripContentPrefix(mdPath) {
  // content/Infra/Openstack/foo.md -> "Infra/Openstack"
  const rel = path.relative(REPO_ROOT, mdPath).replaceAll("\\", "/");
  const folder = path.posix.dirname(rel);
  return folder.startsWith("content/") ? folder.slice("content/".length) : folder;
}

// 간단 slugify: 공백 → 하이픈
function slugifySegment(s) {
  return s.trim().replace(/\s+/g, "-");
}

// content/ 경로를 퍼블릭 URL로 변환
// - content/ 제거
// - 각 세그먼트 slugify
// - index.md 는 폴더 경로로 링크
function toQuartzUrl(mdAbsPath) {
  const rel = path.relative(REPO_ROOT, mdAbsPath).replaceAll("\\", "/"); // content/Computer Science/OS/Process Execution.md
  let pathNoContent = rel.replace(/^content\//, "");                      // Computer Science/OS/Process Execution.md
  const parts = pathNoContent.split("/");

  const last = parts.pop();                               // Process Execution.md
  const base = last.replace(/\.md$/i, "");                // Process Execution

  if (base.toLowerCase() === "index") {
    const folderSegments = parts.map(slugifySegment);
    const joined = folderSegments.join("/");
    return `${BASE_URL}/${encodeURI(joined)}`;
  }

  const slugSegments = [...parts.map(slugifySegment), slugifySegment(base)];
  const joined = slugSegments.join("/");                  // Computer-Science/OS/Process-Execution
  return `${BASE_URL}/${encodeURI(joined)}`;
}

// Dataview 블록을 우리가 처리할지 최소 판단 (요구: from "content")
function shouldHandleQuery(block) {
  return /from\s+"content"/i.test(block);
}

// 표 렌더링 (title, category, updated)
function renderTableRows(files) {
  const header = `| title | category | updated |\n|---|---|---|`;
  const rows = files.map(f => {
    const href = toQuartzUrl(f.path);
    const date = new Date(f.mtime).toISOString().slice(0, 19).replace("T", " ");
    return `| [${f.title}](${href}) | ${f.category} | ${date} |`;
  });
  return [header, ...rows].join("\n");
}

// index.md 안의 dataview 블록만 치환
function processIndexMarkdown(mdPath) {
  const raw = fs.readFileSync(mdPath, "utf8");
  let replaced = false;

  const newBody = raw.replace(DV_FENCE_RE, (whole, block) => {
    if (!shouldHandleQuery(block)) return whole;

    // 사용자가 쿼리에 명시하면 따라감
    const excludeIndex =
      /where\s+(?:lower\(file\.name\)\s*!=\s*"index"|file\.name\s*!=\s*"index")/i.test(block);
    const sortByMtimeDesc = /sort\s+file\.mtime\s+desc/i.test(block);

    // 목록 대상: content/ 아래 모든 md
    const all = walk(CONTENT_DIR).map(p => {
      const stat = fs.statSync(p);
      const md = fs.readFileSync(p, "utf8");
      return {
        path: p,
        mtime: stat.mtimeMs,
        title: getTitle(p, md),
        base: path.basename(p, ".md"),
        category: stripContentPrefix(p), // "Infra/Openstack" 같은 경로
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
  // content/ 아래 index.md만 선별
  const mdFiles = walk(CONTENT_DIR);
  const indexFiles = mdFiles.filter(f => path.basename(f).toLowerCase() === "index.md");

  for (const f of indexFiles) {
    processIndexMarkdown(f);
  }

  console.log("[prerender-dataview] done.");
}

main();