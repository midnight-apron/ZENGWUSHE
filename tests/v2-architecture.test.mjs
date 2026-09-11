import assert from "node:assert/strict";
import { access, readFile, readdir } from "node:fs/promises";
import test from "node:test";

const data = await readFile(new URL("../app/v2/data.ts", import.meta.url), "utf8");
const app = await readFile(new URL("../app/v2/v2-game.tsx", import.meta.url), "utf8");
const legacyApp = await readFile(new URL("../app/game-app.tsx", import.meta.url), "utf8");
const rentedRoom = await readFile(new URL("../app/rented-room.tsx", import.meta.url), "utf8");
const styles = await readFile(new URL("../app/v2/v2-game.module.css", import.meta.url), "utf8");
const rootPage = await readFile(new URL("../app/page.tsx", import.meta.url), "utf8");

test("the XP investigation is the single root game entry", () => {
  assert.match(rootPage, /import \{ V2Game \} from "\.\/v2\/v2-game"/);
  assert.match(rootPage, /return <V2Game \/>/);
  assert.doesNotMatch(rootPage, /GameApp initialPath/);
});

test("V2 uses an independent semantic save and five-application desktop", () => {
  assert.match(data, /zengwu-she-v2-save/);
  for (const appName of ["浏览器", "回收站", "录音文件", "上锁文件夹", "最终文件\\.doc"]) assert.match(app, new RegExp(appName));
  for (const event of ["found_pellet_drum", "verified_wang_poison", "verified_wang_staging", "recovered_ledger_mail", "verified_lixiang_homicide", "heard_duwanlin_confession", "unlocked_final_folder", "found_final_word_password", "unlocked_final_word"]) assert.match(data + app, new RegExp(event));
});

test("V2 story bible preserves the corrected deaths and responsibility boundaries", () => {
  assert.match(data, /王克定因精神困境与艺术信念冲突服毒自杀/);
  assert.match(data, /移动尸体、反绑并坠石/);
  assert.match(data, /杜莉香发现挪用公款，在争执中被邢万掐死/);
  assert.match(data, /不是杀人共犯/);
  assert.match(data, /轻微、未越界的爱意/);
  assert.doesNotMatch(data + app, /王克定并非自杀|王克定遭到杀害|杜莉香确实溺亡/);
  assert.match(legacyApp, /王克定因精神困境与艺术信念冲突服毒自杀/);
  assert.match(legacyApp, /投河现场由邢万在死后伪造/);
  assert.match(legacyApp, /遭邢万掐死，溺亡说法不成立/);
  assert.doesNotMatch(
    legacyApp,
    /王克定并非自杀|王克定.*遭杀害|旧名：杜南阳|IDENTITY MERGE \/ 02 SOURCES/,
  );
});

test("V2 uses normalized names and confirmed search aliases", () => {
  for (const text of ["邢万", "杜莉香", "李髮", "荷潜艇出版社", "阿尔茨海默症", "阿尔兹海默病", "礼倒僧元昶", "尸检报告"]) assert.match(data + app, new RegExp(text));
  assert.doesNotMatch(data + app, /刑万|李髪|核潜艇出版社/);
});

test("locked discoveries expose direction but not final bodies", () => {
  assert.match(data, /lockedHint/);
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

test("V2 opens on an XP login screen gated by Du Che's lowercase pinyin", () => {
  assert.match(app, /Windows XP 登录/);
  assert.match(app, /<b>Administrator<\/b>/);
  assert.match(app, /prologuePassword\.trim\(\)\.toLowerCase\(\) === "duche"/);
  assert.match(app, /提示：我的名字的拼音小写/);
  assert.match(data, /献给玛赫、L 和杜彻/);
  for (const selector of ["loginStage", "loginIntro", "loginAccount", "loginPasswordRow", "loginBottom"]) assert.match(styles, new RegExp(selector));
});

test("摆渡只开放两个本地站点，并在账目线索后开放寿享陵园", () => {
  const defaultSave = data.match(/export const DEFAULT_V2_SAVE[\s\S]*?\n\};/)?.[0] ?? "";
  assert.match(app, /摆渡热搜/);
  assert.match(app, /临展画作遭撤，艺术家生存环境堪忧/);
  assert.match(app, /他山地方公墓贪污案旧档重启核查/);
  assert.match(app, /cemeteryLeadReady = hasEvent\("recovered_ledger_mail"\)/);
  assert.match(app, /target: cemeteryLeadReady \? "legacy:\/mirror\/shouxiang\/staff" : undefined/);
  assert.match(data, /id: "shouxiang"[\s\S]*?requires: \["recovered_ledger_mail"\]/);
  assert.match(data, /id: "start"[\s\S]*?done: \["visited_exhibition"\]/);
  assert.match(defaultSave, /赭红门展览/);
  assert.doesNotMatch(defaultSave, /寿享陵园/);
  assert.match(app, /events\.includes\("recovered_ledger_mail"\) \? searchHistory : searchHistory\.filter/);
  for (const selector of ["browserBrand", "searchForm", "hotSearch"]) assert.match(styles, new RegExp(selector));
});

test("V2 embeds the complete legacy gallery game and separates the cemetery site", () => {
  assert.match(app, /import \{[^}]*GameApp/);
  assert.match(app, /<GameApp[\s\S]*?embedded[\s\S]*?initialPath=\{legacyPath\}/);
  assert.match(app, /target: "legacy:\/"/);
  assert.match(app, /target: cemeteryLeadReady \? "legacy:\/mirror\/shouxiang\/staff"/);
  assert.match(app, /onCemeteryVisit=\{\(\) => markEvent\("recovered_ledger_mail"\)\}/);
  for (const component of ["GalleryHomePage", "DirectoryPage", "ExhibitionPage"]) assert.match(app, new RegExp(component));
  for (const className of ["site-header", "gallery-section-nav", "global-search", "path-strip", "game-main", "site-footer"]) assert.match(app, new RegExp(className));
  assert.match(app, /<ExhibitionPage frameNotice=\{frameNotice\}/);
  assert.match(app, /onSubmit=\{\(event: FormEvent\) => \{ event\.preventDefault\(\); setOfflineOpen\(true\); \}\}/);
  assert.match(app, /function GallerySearchForm/);
  assert.match(app, /runGallerySearch\(query\)/);
  assert.match(app, /gallery-search:/);
  assert.match(app, /无法连接互联网/);
  assert.match(styles, /grid-template-areas: "brand" "sections" "search" "tools"/);
  assert.match(styles, /\.galleryWebsite :global\(\.global-search\) \{ width: 100%; justify-self: stretch; \}/);
  assert.doesNotMatch(app, /pushBrowser\(`search:/);
  assert.doesNotMatch(app, /function BrowserResults/);
});

test("legacy gallery milestones unlock the desktop evidence vault", () => {
  assert.match(app, /\/recovered\/13-wang-keding/);
  assert.match(app, /verified_wang_poison/);
  assert.match(app, /\/archive\/case\/cemetery/);
  assert.match(app, /verified_lixiang_homicide/);
  assert.match(app, /\/stage\/recovered-index/);
  assert.match(app, /heard_duwanlin_confession/);
  assert.match(app, /\["\/stage\/zhuhongmen", "\/stage\/shinan"\]/);
  assert.match(app, /found_final_word_password/);
});

test("NEW badges stay inside the gallery website instead of the XP desktop", () => {
  assert.doesNotMatch(app, /newState|isNew=\{newState/);
  assert.match(legacyApp, /entry\.isNew \? <b>NEW<\/b>/);
  assert.match(legacyApp, /item\.hasNew \? <i>NEW<\/i>/);
});

test("the locked folder contains only the Mang image manuscripts", () => {
  const vault = app.match(/function renderVault\(\)[\s\S]*?\n  function renderWord\(\)/)?.[0] ?? "";
  assert.match(vault, /《目盲》图像诗稿/);
  assert.match(vault, /共 19 个篇目、51 张图像/);
  assert.doesNotMatch(vault, /最终证据包|两起死亡与责任边界|文学角色与真实原型|其他文学文本|决定文件去向|publish-all|case-only|EndingCard|诗喃终场/);
  assert.doesNotMatch(data, /最终文件夹；不得改写或节选/);
});

test("the final objective is a locked Word document containing only the supplied link", () => {
  const word = app.match(/function renderWord\(\)[\s\S]*?\n  function renderSettings\(\)/)?.[0] ?? "";
  assert.match(data, /export const FINAL_WORD_PASSWORD = "诗喃"/);
  assert.match(data, /https:\/\/mp\.weixin\.qq\.com\/s\/q1JOS5ufNDzoVLKh-BSaIA/);
  assert.match(word, /found_final_word_password/);
  assert.match(word, /unlocked_final_word/);
  assert.match(word, /最终文件\.doc/);
  assert.match(word, /className=\{styles\.wordPage\}><a href=\{FINAL_WORD_URL\}/);
  assert.doesNotMatch(word, /航船诗歌社|朗读者|排演|谢幕|剧中人/);
  for (const selector of ["window_word", "wordLocked", "wordFileIcon", "wordApp", "wordPage"]) assert.match(styles, new RegExp(selector));
});

test("Mang image archive contains all 19 entries and 51 supplied images", async () => {
  const files = (await readdir(new URL("../public/archive/mang/", import.meta.url)))
    .filter((name) => name.endsWith(".webp"));
  assert.equal(files.length, 51);
  assert.match(app, /共 19 个篇目、51 张图像/);
  for (const prefix of ["00-prologue", "01-chapter", "01-01", "01-02", "01-03", "01-04", "02-chapter", "02-01", "02-02", "03-chapter", "03-01", "03-02", "04-chapter", "04-01", "04-02", "05-chapter", "05-01", "05-02", "06-epilogue"]) {
    assert.ok(files.some((name) => name.startsWith(`${prefix}-`)), `missing ${prefix}`);
  }
});

test("the old Shinan finale and its image archive are removed", async () => {
  assert.doesNotMatch(data + app + legacyApp, /archive\/shinan|shinan-poster|现场档案 \/ 01—21|演出海报与活动照|静音字幕版开演|他们是剧中人，也是朗读者/);
  assert.doesNotMatch(legacyApp, /shinan-open|shinan-script|shinan-stage|航船诗歌社 · 国庆诗歌剧场/);
  await assert.rejects(access(new URL("../public/archive/shinan/", import.meta.url)));
});

test("literary sources are registered with the verbatim boundary", () => {
  for (const title of ["句肉抟飞", "目盲", "西岩大火", "玛赫", "走地国记"]) assert.match(data, new RegExp(title));
  assert.match(data, /不得改写或节选/);
  assert.match(legacyApp, /zoudi-guoji\.html/);
});
