import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("preserves the complete Juroutuanfei manuscript in source order", async () => {
  const moduleSource = await readFile(
    new URL("../app/juroutuanfei-text.ts", import.meta.url),
    "utf8",
  );
  const match = moduleSource.match(
    /export const JUROUTUANFEI_TEXT: JuroutuanfeiTextBlock\[\] =\n([\s\S]+);\n$/,
  );
  assert.ok(match, "generated manuscript array should be readable");

  const blocks = JSON.parse(match[1]);
  assert.equal(blocks.length, 313);
  assert.equal(blocks.map((block) => block.text).join("").length, 13781);
  assert.deepEqual(
    blocks.filter((block) => block.kind === "section").map((block) => block.text),
    [
      "Section.1    3dm×3dmA.A.1",
      "Section.2 紙式鱿魚",
      "Section.3 鳥首上行功曹歌AA.2",
      "Section.4  皮",
      "Section.5瑪赫的厨房",
    ],
  );
  assert.equal(blocks[0].text, "献给玛赫、L 和杜彻");
  assert.equal(
    blocks.at(-1).text,
    "(元昶活动年表，引自杜彻小说《玛赫的厨房》)",
  );
  assert.equal(new Set(blocks.map((block) => block.sourceIndex)).size, 313);

  const sectionStarts = blocks
    .map((block, index) => block.kind === "section" ? index : -1)
    .filter((index) => index >= 0);
  const chapterRanges = sectionStarts.map((start, index) => ({
    start: index === 0 ? 0 : start,
    end: sectionStarts[index + 1] ?? blocks.length,
  }));
  const serializedBlocks = chapterRanges.flatMap(({ start, end }) => blocks.slice(start, end));

  assert.deepEqual(chapterRanges, [
    { start: 0, end: 89 },
    { start: 89, end: 158 },
    { start: 158, end: 184 },
    { start: 184, end: 191 },
    { start: 191, end: 313 },
  ]);
  assert.deepEqual(serializedBlocks, blocks, "five independent entries must preserve every source block exactly once");
});
