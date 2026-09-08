import assert from "node:assert/strict";
import test, { after } from "node:test";
import { fileURLToPath } from "node:url";
import { createServer } from "vite";

const root = fileURLToPath(new URL("..", import.meta.url));
const vite = await createServer({ configFile: false, appType: "custom", root, server: { middlewareMode: true, hmr: false } });
after(() => vite.close());
const { JUROUTUANFEI_TEXT: source } = await vite.ssrLoadModule("/app/juroutuanfei-text.ts");
const { getReadingChapter, OPENING_EPIGRAPH, OPENING_DEDICATION } = await vite.ssrLoadModule("/app/juroutuanfei-layout.ts");
const words = (text) => text.replace(/[\s\p{P}\p{S}]/gu, "").toLowerCase();

test("all five corrected chapters preserve every word in sequence, with front matter excluded", () => {
  const chapters = [1, 2, 3, 4, 5].map(getReadingChapter);
  const reading = chapters.flat();
  assert.equal(words(reading.map((block) => block.text).join("")), words(source.slice(10).map((block) => block.text).join("")));
  for (const [index, chapter] of chapters.entries()) {
    assert.equal(chapter[0].anchor, `section-${index + 1}`);
    assert.equal(chapter.filter((block) => block.kind === "section").length, 1);
    assert.equal(chapter.some((block) => ["dedication", "epigraph", "toc-title", "toc-entry", "press-mark"].includes(block.kind)), false);
    assert.doesNotMatch(chapter.map((block) => block.text).join("\n"), /[\u3400-\u9fff] +[\u3400-\u9fff]/u);
  }
  assert.equal(words(OPENING_EPIGRAPH), words(source[8].text));
  assert.equal(OPENING_DEDICATION, source[0].text);
});

test("paper squid reconnects broken words and gives the closing stream of thought readable paragraphs", () => {
  const chapter = getReadingChapter(2);
  assert.ok(chapter.some((block) => block.text.includes("海发菜")));
  assert.ok(chapter.some((block) => block.text.includes("今天杜南阳车儿子去县里文化宫，约我到地见面。")));
  assert.ok(chapter.some((block) => block.text.includes("双手反绑连着一块几斤重的石立人头")));
  assert.equal(chapter.filter((block) => block.kind === "subheading").length, 3);
  assert.equal(chapter.at(-3).text.startsWith("直到在副驾"), true);
  assert.equal(chapter.at(-2).text.startsWith("其余色泽"), true);
  assert.equal(chapter.at(-1).text.endsWith("脸一侧是青蛙般仁慈。"), true);
});
