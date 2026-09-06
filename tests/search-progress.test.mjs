import assert from "node:assert/strict";
import test, { after } from "node:test";
import { fileURLToPath } from "node:url";
import { createServer } from "vite";

const root = fileURLToPath(new URL("..", import.meta.url));
const vite = await createServer({ appType: "custom", configFile: false, root,
  resolve: { alias: { "@": root } }, server: { middlewareMode: true } });
after(() => vite.close());
const { resolveGameSearch: search, rememberSearch, searchStatus } = await vite.ssrLoadModule("/app/game-app.tsx");
const state = (overrides = {}) => ({ unlocked: [], recovered: [], visited: [], routeTrips: 0,
  frameClicks: 0, historyVersionsLoaded: 1, editorLoggedIn: false, ...overrides });
const run = (query, overrides) => search(query, state(overrides), "/");

test("partial autopsy search exposes only records allowed by current progress", () => {
  const locked = run("尸检");
  assert.equal(locked.results.length, 2);
  for (const row of locked.results) {
    assert.equal(row.locked, true);
    assert.equal(row.path, undefined);
    assert.equal(row.unlock, undefined);
    assert.match(row.summary, /先/);
    assert.doesNotMatch(row.title, /王克定|右小手指/);
  }
  const first = run("尸检", { unlocked: ["S12"] });
  assert.equal(first.results.filter((row) => !row.locked).length, 1);
  assert.equal(first.results[0].path, "/archive/autopsy/wang-keding");
  const both = run("尸检", { unlocked: ["S12", "S16"] });
  assert.equal(both.results.filter((row) => !row.locked).length, 2);
});

test("new finger and egret queries preserve route and password gates", () => {
  assert.equal(searchStatus(run("右小手指")), "待解锁");
  assert.equal(run("右小手指", { routeTrips: 3 }).results[0].path, "/archive/autopsy/wang-keding-supplement");
  assert.equal(run("野生白鹭", { unlocked: ["S16"] }).action, undefined);
  assert.equal(run("野生白鹭", { unlocked: ["S17"] }).action, "wang");
  assert.equal(run("王克定之死", { unlocked: ["S17"] }).action, undefined);
  const partial = run("白鹭", { unlocked: ["S17"] });
  assert.equal(partial.action, undefined);
  assert.equal(partial.results[0].action, "wang");
});

test("fuzzy lookup does not mutate progress or bypass the late story gates", () => {
  const game = state();
  const original = JSON.stringify(game);
  for (const query of ["尸检", "杜", "火化", "白鹭", "始末", "厨房", "水库"]) {
    search(query, game, "/");
  }
  assert.equal(JSON.stringify(game), original);
  assert.equal(searchStatus(run("始末")), "待解锁");
  assert.equal(searchStatus(run("白鹭")), "待解锁");
});

test("history deduplicates, persists as JSON, and follows changing unlock state", () => {
  const history = rememberSearch(rememberSearch([], "尸检"), " 尸检 ");
  assert.deepEqual(JSON.parse(JSON.stringify(history)), ["尸检"]);
  assert.equal(searchStatus(run(history[0])), "待解锁");
  assert.equal(searchStatus(run(history[0], { unlocked: ["S12"] })), "有效");
  assert.equal(searchStatus(run("完全不存在的搜索词")), "未命中");
  assert.deepEqual(rememberSearch(history, "  "), history);
  assert.equal(rememberSearch(Array.from({ length: 50 }, (_, i) => `词${i}`), "新词").length, 50);
});
