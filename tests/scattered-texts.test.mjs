import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");

test("places every independent text outside the Juroutuanfei serial", async () => {
  const app = await read("app/game-app.tsx");
  const files = {
    semu: await read("public/archive/scattered/se-mu-jue-cao.html"),
    tiefangshan: await read("public/archive/scattered/tiefangshan-bu.html"),
    zoudi: await read("public/archive/scattered/zoudi-guoji.html"),
    nanfuzi: await read("public/archive/scattered/nanfuzi.html"),
  };

  assert.match(app, /篇目一：色目掘漕/);
  assert.match(app, /篇目二：铁房山补/);
  assert.match(app, /终局叙事补遗/);
  assert.match(app, /独立散页 · 非《句肉抟飞》/);

  assert.match(files.semu, /除开会画点“大写意古典油画”/);
  assert.match(files.semu, /牛牟，声调过长，一边含笑摇头。/);
  assert.ok((files.semu.match(/<p>/g) ?? []).length >= 22);

  assert.match(files.tiefangshan, /<em>其一：鲦<\/em>/);
  assert.match(files.tiefangshan, /<strong>其二：反身肉<\/strong>/);
  assert.match(files.tiefangshan, /<strong>其三：壤慈航<\/strong>/);
  assert.match(files.tiefangshan, /雨槌依然娑络，仅有它有的无穷身外身等着下雨。/);
  assert.ok((files.tiefangshan.match(/<p>/g) ?? []).length >= 74);

  assert.match(files.zoudi, /憎恶社是可一同赚钱的。/);
  assert.match(files.zoudi, /拨座机给莉香问道平安，久也未接想到是半夜始终不敢睡去。/);
  assert.ok((files.zoudi.match(/<p>/g) ?? []).length >= 44);

  assert.match(files.nanfuzi, /<strong>腹国的他者<\/strong>/);
  assert.match(files.nanfuzi, /<strong>胰子<\/strong>/);
  assert.match(files.nanfuzi, /“我错了——不想死——不该死。”/);
  assert.ok((files.nanfuzi.match(/<p>/g) ?? []).length >= 48);
});
