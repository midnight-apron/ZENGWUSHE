import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const data = await readFile(new URL("../app/v2/data.ts", import.meta.url), "utf8");
const app = await readFile(new URL("../app/v2/v2-game.tsx", import.meta.url), "utf8");
const rentedRoom = await readFile(new URL("../app/rented-room.tsx", import.meta.url), "utf8");
const styles = await readFile(new URL("../app/v2/v2-game.module.css", import.meta.url), "utf8");

test("V2 uses an independent semantic save and four-application desktop", () => {
  assert.match(data, /zengwu-she-v2-save/);
  for (const appName of ["浏览器", "回收站", "录音文件", "上锁文件夹"]) assert.match(app, new RegExp(appName));
  for (const event of ["found_pellet_drum", "verified_wang_poison", "verified_wang_staging", "recovered_ledger_mail", "verified_lixiang_homicide", "heard_duwanlin_confession", "unlocked_final_folder"]) assert.match(data + app, new RegExp(event));
});

test("V2 story bible preserves the corrected deaths and responsibility boundaries", () => {
  assert.match(data, /王克定因精神困境与艺术信念冲突服毒自杀/);
  assert.match(data, /移动尸体、反绑并坠石/);
  assert.match(data, /杜莉香发现挪用公款，在争执中被邢万掐死/);
  assert.match(data, /不是杀人共犯/);
  assert.match(data, /轻微、未越界的爱意/);
  assert.doesNotMatch(data + app, /王克定并非自杀|王克定遭到杀害|杜莉香确实溺亡/);
});

test("V2 uses normalized names and confirmed search aliases", () => {
  for (const text of ["邢万", "杜莉香", "李髮", "荷潜艇出版社", "阿尔茨海默症", "阿尔兹海默病", "礼倒僧元昶", "尸检报告"]) assert.match(data + app, new RegExp(text));
  assert.doesNotMatch(data + app, /刑万|李髪|核潜艇出版社/);
});

test("locked discoveries expose direction but not final bodies", () => {
  assert.match(data, /lockedHint/);
  assert.match(app, /尚未获得读取权限/);
  assert.match(app, /node\.title\.replace/);
  assert.match(app, /const unlocked = hasAll\(save\.events, node\.requires\)/);
  assert.match(app, /ACCESS \/ PENDING/);
  assert.match(app, /if \(!unlocked\) return/);
});

test("Du Che and the evening news stay behind the pellet-drum event", () => {
  assert.match(data, /id: "du-che"[\s\S]*?requires: \["found_pellet_drum"\]/);
  assert.match(data, /id: "evening-news"[\s\S]*?requires: \["found_pellet_drum"\]/);
  assert.match(rentedRoom, /手柄握处，刻着：杜彻/);
  assert.match(app, /减少惊吓/);
});

test("V2 uses a faithful Windows XP Luna shell without changing the investigation apps", () => {
  for (const selector of ["startMenu", "windowsFlag", "activeTask", "trayIcons", "selectedDesktopIcon"]) assert.match(app + styles, new RegExp(selector));
  for (const color of ["#245edb", "#3c9a37", "#ece9d8", "#0a246a"]) assert.match(styles.toLowerCase(), new RegExp(color));
  assert.match(app, /<b>开始<\/b>/);
  assert.match(app, /onDoubleClick=\{\(\) => onOpen\(id\)\}/);
  assert.match(app, /onClick=\{onFocus\}/);
  assert.match(app, /if \(activeApp === id\) return/);
});

test("摆渡首页只从画展新闻起步，并在账目线索后开放寿享陵园", () => {
  const defaultSave = data.match(/export const DEFAULT_V2_SAVE[\s\S]*?\n\};/)?.[0] ?? "";
  assert.match(app, /摆渡热搜/);
  assert.match(app, /临展画作遭撤，艺术家生存环境堪忧/);
  assert.match(app, /cemeteryLeadReady = hasEvent\("recovered_ledger_mail"\)/);
  assert.match(app, /cemeteryLeadReady[\s\S]*?寿享陵园改建账目受质疑/);
  assert.match(data, /id: "shouxiang"[\s\S]*?requires: \["recovered_ledger_mail"\]/);
  assert.match(data, /id: "start"[\s\S]*?done: \["visited_exhibition"\]/);
  assert.match(defaultSave, /赭红门展览/);
  assert.doesNotMatch(defaultSave, /寿享陵园/);
  assert.match(app, /events\.includes\("recovered_ledger_mail"\) \? searchHistory : searchHistory\.filter/);
  for (const selector of ["browserBrand", "searchForm", "hotSearch"]) assert.match(styles, new RegExp(selector));
});

test("V2 implements three neutral endings and delays the stage archive", () => {
  for (const id of ["publish-all", "case-only", "close"]) assert.match(app, new RegExp(id));
  assert.match(app, /三项选择建立在同一事实真相上，只改变公开范围，不进行道德评分/);
  assert.match(data, /requires: \["unlocked_final_folder"\]/);
});

test("literary sources are registered with the verbatim boundary", () => {
  for (const title of ["句肉抟飞", "目盲", "西岩大火", "玛赫", "走地国记"]) assert.match(data, new RegExp(title));
  assert.match(data, /不得改写或节选/);
  assert.match(app, /zoudi-guoji\.html/);
});
