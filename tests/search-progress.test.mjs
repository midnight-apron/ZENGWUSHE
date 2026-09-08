import assert from "node:assert/strict";
import test, { after } from "node:test";
import { fileURLToPath } from "node:url";
import { createServer } from "vite";

const root = fileURLToPath(new URL("..", import.meta.url));
const vite = await createServer({ appType: "custom", configFile: false, root,
  resolve: { alias: { "@": root } }, server: { middlewareMode: true } });
after(() => vite.close());
const { resolveGameSearch: search, rememberSearch, searchStatus, getProgressHint, matchesEditorCredentials } = await vite.ssrLoadModule("/app/game-app.tsx");
const { INITIAL_WEDDING_TILES, swapPhotoTiles, isWeddingPhotoComplete } = await vite.ssrLoadModule("/app/archive-photo-interactions.tsx");
const state = (overrides = {}) => ({ unlocked: [], recovered: [], visited: [], familyPhotoRead: false, weddingPhotoSolved: false, routeTrips: 0,
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


test("Fang Wan gains a new signed record only after the unsigned form is opened", () => {
  const before = run("方晚", { unlocked: ["S07"], visited: ["/members/fang-wan"] });
  assert.equal(before.results.length, 1);
  assert.equal(before.results[0].path, "/members/fang-wan");
  const after = run("方晚", { unlocked: ["S19"] });
  assert.equal(after.results.length, 2);
  const signed = after.results.find((row) => row.id === "du-cremation-signed");
  assert.equal(signed.path, "/archive/forms/cremation-du-complete");
  assert.deepEqual(signed.unlock, ["S20"]);
  assert.deepEqual(signed.recover, ["08"]);
  assert.equal(run("焚烧签字单", { recovered: ["13"] }).results[0].path, "/archive/forms/cremation-du");
  assert.equal(searchStatus(run("焚烧签字单")), "待解锁");
});

test("public cemetery news does not unlock the late case index", () => {
  const game = state({ unlocked: ["S19"] });
  const fromNews = search("他山地方公墓贪污案", game, "/news/cemetery-report");
  assert.equal(searchStatus(fromNews), "待解锁");
  assert.equal(fromNews.results[0].path, undefined);
  const ready = run("他山地方公墓贪污案", { unlocked: ["S20"] });
  assert.equal(ready.results[0].path, "/archive/case/cemetery");
  assert.equal(searchStatus(run("公墓", { unlocked: ["S19"] })), "待解锁");
});

test("early Du Che family record supplies the name without granting late chapter progress", () => {
  const game = state();
  assert.equal(searchStatus(search("杜彻", game, "/")), "未命中");
  const early = search("杜彻", game, "/news/cemetery-report").results[0];
  assert.equal(early.path, "/members/du-che-family");
  assert.equal(early.unlock, undefined);
  assert.equal(early.recover, undefined);
  game.visited.push("/news/cemetery-report", early.path);
  assert.equal(getProgressHint(game).id, "missing-work");
  for (const term of ["李髮", "刍味", "他山地方公墓贪污案", "莉香"]) {
    assert.equal(searchStatus(search(term, game, early.path)), "待解锁");
  }
  game.unlocked.push("S11");
  assert.equal(getProgressHint(game).id, "du-che-family");
  assert.equal(searchStatus(search("莉香", game, early.path)), "待解锁");
  game.familyPhotoRead = true;
  assert.equal(getProgressHint(game).id, "li-xiang");
  assert.equal(search("莉香", game, early.path).results[0].path, "/archive/deaths/lixiang");
  const late = run("杜彻", { unlocked: ["S23"] }).results[0];
  assert.equal(late.path, "/members/du-che");
  assert.deepEqual(late.unlock, ["S24"]);
  assert.equal(getProgressHint(state({ unlocked: ["S11"] })).id, "du-che-family");
});


test("hints follow the unresolved frontier and preserve the missing wedding branch", () => {
  const game = state({ unlocked: Array.from({ length: 17 }, (_, i) => `S${String(i + 1).padStart(2, "0")}`) });
  assert.equal(getProgressHint(game).id, "egret");
  game.visited.push("/", "/members/fang-wan", "/cache/artwork/baishaorou");
  assert.equal(getProgressHint(game).id, "egret");
  assert.match(getProgressHint(game).hints[2], /野生白鹭/);
  const late = state({ unlocked: ["S28"], recovered: ["10", "11"] });
  assert.equal(getProgressHint(late).id, "missing-wedding");
  late.recovered.push("07");
  assert.equal(getProgressHint(late).id, "old-site");
  assert.equal(getProgressHint(state({ unlocked: ["S31"] })).id, "editor-password");
});

test("all requested diagnosis aliases and the full monk title share their gates", () => {
  for (const term of ["阿尔茨海默症", "阿尔兹海默症", "阿尔兹海默病"]) {
    assert.equal(searchStatus(run(term)), "待解锁");
    assert.deepEqual(run(term, { unlocked: ["S27"] }), run("阿尔茨海默病", { unlocked: ["S27"] }));
  }
  assert.equal(searchStatus(run("礼倒僧元昶")), "待解锁");
  assert.deepEqual(run("礼倒僧元昶", { editorLoggedIn: true, unlocked: ["S32"] }), run("元昶", { editorLoggedIn: true, unlocked: ["S32"] }));
});

test("editor password includes the final title initial F", () => {
  assert.equal(matchesEditorCredentials("editor_ys", "mhdcf2019"), true);
  assert.equal(matchesEditorCredentials(" editor_ys ", "MHDCF2019"), true);
  assert.equal(matchesEditorCredentials("editor_ys", "mhdc2019"), false);
  assert.equal(matchesEditorCredentials("unknown", "mhdcf2019"), false);
});


test("wedding puzzle gates the alias, while existing saves retain access", () => {
  const game = state({ unlocked: ["S06"] });
  assert.equal(search("徐惠", game, "/members/du-nanyang-old").results[0].path, "/members/xu-hui");
  assert.equal(searchStatus(search("杜万琳", game, "/members/du-nanyang-old")), "待解锁");
  assert.equal(getProgressHint(game).id, "xu-hui-photo");
  let tiles = [...INITIAL_WEDDING_TILES];
  assert.equal(isWeddingPhotoComplete(tiles), false);
  for (let target = 0; target < 9; target++) {
    tiles = swapPhotoTiles(tiles, tiles.indexOf(target), target);
    assert.equal(new Set(tiles).size, 9);
  }
  assert.equal(isWeddingPhotoComplete(tiles), true);
  game.weddingPhotoSolved = true;
  assert.equal(getProgressHint(game).id, "du-wanlin");
  assert.equal(search("杜万琳", game, "/members/xu-hui").results[0].path, "/members/du-wanlin");
  assert.equal(searchStatus(run("杜万琳", { unlocked: ["S07"] })), "有效");
  assert.equal(searchStatus(run("莉香", { unlocked: ["S12"] })), "有效");
});


test("投河 shares the exact autopsy gate and results", () => {
  for (const progress of [{}, { unlocked: ["S12"] }, { unlocked: ["S12", "S16"] }]) {
    assert.deepEqual(run("投河", progress), run("尸检报告", progress));
  }
});

test("seven distinct openings are required; repeated clicks do not advance", async () => {
  const { inspectStoneOpening } = await vite.ssrLoadModule("/app/stone-inspection.tsx");
  let mask = 0;
  for (const opening of [6, 2, 4, 0, 5, 1]) {
    mask = inspectStoneOpening(mask, opening);
    assert.equal(inspectStoneOpening(mask, opening), mask);
    assert.notEqual(mask, 127);
  }
  assert.equal(inspectStoneOpening(mask, 3), 127);
  assert.equal(inspectStoneOpening(mask, 7), mask);
});
