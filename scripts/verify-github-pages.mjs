import { access, readFile } from "node:fs/promises";
import { resolve } from "node:path";

const [outputDirectory, requestedBasePath] = process.argv.slice(2);

if (!outputDirectory || !requestedBasePath) {
  throw new Error("Usage: node scripts/verify-github-pages.mjs <output-directory> <base-path>");
}

const basePath = `/${requestedBasePath.replace(/^\/+|\/+$/g, "")}`;
const outputRoot = resolve(outputDirectory);
const indexHtml = await readFile(resolve(outputRoot, "index.html"), "utf8");
const entryMatch = indexHtml.match(/<script id="_R_">import\("([^"]+)"\)<\/script>/);

if (!entryMatch || !entryMatch[1].startsWith(`${basePath}/assets/`)) {
  throw new Error(`Root page does not load its client entry from ${basePath}/assets/.`);
}

const entryRelativePath = entryMatch[1].slice(basePath.length + 1);
const entryFile = resolve(outputRoot, entryRelativePath);
await access(entryFile);

const entrySource = await readFile(entryFile, "utf8");
const expectedDynamicBase = `return\`${basePath}/\`+`;

if (!entrySource.includes(expectedDynamicBase)) {
  throw new Error(`Client-side module preloads do not use ${basePath}/.`);
}

if (!indexHtml.includes("V2Game")) {
  throw new Error("The root page is not wired to the XP game client.");
}

try {
  await access(resolve(outputRoot, "v2", "index.html"));
  throw new Error("The obsolete /v2 page is still present in the export.");
} catch (error) {
  if (error instanceof Error && error.message.includes("obsolete /v2")) throw error;
}

console.log(`GitHub Pages root verified for ${basePath}/`);
