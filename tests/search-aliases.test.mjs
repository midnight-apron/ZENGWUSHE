import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("accepts the literal damaged-reader clue as an alias for Mangzhichun", async () => {
  const source = await readFile(
    new URL("../app/game-app.tsx", import.meta.url),
    "utf8",
  );

  assert.match(
    source,
    /\["盲之春", "盲春", "看不见春天", "看不見春天"\]\.includes\(normalized\)/,
  );
  assert.match(source, /搜索：看不见春天/);
});

test("uses discoverable forensic searches and clears NEW after a record is read", async () => {
  const source = await readFile(
    new URL("../app/game-app.tsx", import.meta.url),
    "utf8",
  );

  assert.match(source, /搜索：尸检报告。/);
  assert.match(source, /\["尸检报告", "投河", "王克定尸检", "王克定认尸"\]\.includes\(normalized\)/);
  assert.match(source, /搜索：石立人。/);
  assert.match(source, /\["石立人", "石立人头", "石人头"\]\.includes\(normalized\)/);
  assert.match(source, /title: "石立人·头部塑像"/);
  assert.match(source, /const isUnvisited = \(path: string\) => !game\.visited\.includes\(path\)/);
  assert.doesNotMatch(source, /isNew: true/);
  assert.doesNotMatch(source, /系统把断口拆为六处检查标记|系统把石座拆为七处检查标记/);
});
