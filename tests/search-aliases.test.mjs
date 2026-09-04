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
