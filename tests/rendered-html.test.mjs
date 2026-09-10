import assert from "node:assert/strict";
import test from "node:test";

async function renderPath(pathname) {
  const routePath =
    pathname === "/" || pathname.endsWith("/") ? pathname : `${pathname}/`;
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set(
    "test",
    `${process.pid}-${Date.now()}-${Math.random()}`,
  );
  const { default: worker } = await import(workerUrl.href);

  const response = await worker.fetch(
    new Request(`http://localhost${routePath}`, {
      headers: { accept: "text/html" },
    }),
    {
      ASSETS: {
        fetch: async () => new Response("Not found", { status: 404 }),
      },
    },
    {
      waitUntil() {},
      passThroughOnException() {},
    },
  );

  assert.equal(response.status, 200);
  return (await response.text()).replaceAll("<!-- -->", "");
}

test("renders the XP investigation as the root entry", async () => {
  const html = await renderPath("/");
  assert.match(html, /<title>憎恶社｜杜彻旧电脑<\/title>/);
  assert.match(html, /正在读取本地备份/);
  assert.match(html, /V2Game/);
  assert.doesNotMatch(html, /诗喃.*archive\/shinan/s);
});

test("keeps the breakup interstitial and Xu Hui sketch behind their intended triggers", async () => {
  const source = await import("node:fs/promises").then(({ readFile }) =>
    readFile(new URL("../app/game-app.tsx", import.meta.url), "utf8"),
  );

  assert.match(source, /currentPath !== ROUTES\.history/);
  assert.match(source, /J04-collapse-image/);
  assert.match(source, /collapseImageActive/);
  assert.match(source, /archive\/zengwu-collapse\.webp/);
  assert.match(source, /gallery\/xu-hui-sketch\.webp/);
  assert.match(source, /work\.interactive \? \(/);
});

test("renders the public gallery directories without leaking locked records", async () => {
  const exhibitions = await renderPath("/exhibitions");
  assert.match(exhibitions, /PROGRAM \/ EXHIBITIONS/);
  assert.match(exhibitions, /正在展出 \/ 主厅/);
  assert.doesNotMatch(exhibitions, /白芍肉/);

  const people = await renderPath("/people");
  assert.match(people, /PEOPLE \/ INDEX/);
  assert.doesNotMatch(people, /葛东平|徐惠/);
  assert.doesNotMatch(people, />莉香<|>杜彻</);

  const news = await renderPath("/news");
  assert.match(news, /NEWS \/ ARCHIVE/);
  assert.match(news, /关于 A-07 展品状态的说明/);
  assert.doesNotMatch(news, /他山地方公墓贪污案|他山晚讯/);
  assert.doesNotMatch(news, /五名参与者|死亡过程已/);
  const report = await renderPath("/news/cemetery-report");
  assert.match(report, /记录尚未开放/);
  assert.doesNotMatch(report, /cemetery-newspaper|杜彻 · 家属记录/);

  const publications = await renderPath("/publications");
  assert.match(publications, /PUBLICATIONS \/ TEXT/);
  assert.match(publications, /展览手册/);
  assert.doesNotMatch(publications, /朗读文件|朗读文本/);
  assert.doesNotMatch(publications, /盲之春/);
});

test("renders the recovered identity and death-record chapter routes", async () => {
  const history = await renderPath("/about/history");
  assert.match(history, /zengwu-early-group\.webp/);
  assert.match(history, /早期成员及同行者/);
  assert.match(history, /四名男性成员 · 一名女性同行者/);
  assert.doesNotMatch(history, /方晚 · 王克定|杜南阳 · 徐惠 · 邢万|旧索引未闭合/);

  const mergedIdentity = await renderPath("/members/du-wanlin");
  assert.match(mergedIdentity, /杜南阳/);
  assert.match(mergedIdentity, /杜万琳/);
  assert.match(mergedIdentity, /CHARACTER PROTOTYPE/);
  assert.match(mergedIdentity, /两者不是同一人的异名/);

  const wangKeding = await renderPath("/members/wang-keding");
  assert.match(wangKeding, /公开死亡记录/);
  assert.match(wangKeding, /结论：自杀/);
  assert.match(wangKeding, /该结论尚未经过交叉验证/);
  assert.match(wangKeding, /society-return-link/);
  assert.doesNotMatch(wangKeding, /长期遮住半张脸|背注转录|新闻缓存没有/);

  const fangWan = await renderPath("/members/fang-wan");
  assert.match(fangWan, /dongxing-peter-2000\.webp/);
  assert.doesNotMatch(fangWan, /VISUAL RECONSTRUCTION|原照片人物以手遮住半张脸/);

  const dongxingPeter = await renderPath("/photos/dongxing-peter");
  assert.match(dongxingPeter, /图像复原层/);
  assert.match(dongxingPeter, /dongxing-peter-2000\.webp/);
  assert.doesNotMatch(dongxingPeter, /原照片在迁移中遗失|视觉复原不等同于原始照片|一名男子站在/);
  assert.match(dongxingPeter, /非原始档案影像/);
  assert.match(dongxingPeter, /查看橱窗中的人影/);

  const xingWan = await renderPath("/members/xing-wan");
  assert.doesNotMatch(xingWan, /晚近家属卡|分类残片：花香|关联人物|杜彻 · 家属记录/);
  assert.match(xingWan, /rented-room\.webp/);
  assert.match(xingWan, /查看桌上的烟灰缸/);
  assert.match(xingWan, /查看地上的拨浪鼓/);
  assert.doesNotMatch(xingWan, /刑某|映射状态|异名合并/);
  assert.doesNotMatch(xingWan, />杜彻</);

  const duCheFamily = await renderPath("/members/du-che-family");
  assert.match(duCheFamily, /记录尚未开放/);
  assert.doesNotMatch(duCheFamily, /du-che-childhood|翻看照片背面|家庭关系/);
  const xuHui = await renderPath("/members/xu-hui");
  assert.match(xuHui, /徐惠的婚纱照拼图/);
  assert.match(xuHui, /xu-hui-wedding\.webp/);
  assert.doesNotMatch(xuHui, /杜万琳和徐惠/);
  assert.equal((xuHui.match(/class="wedding-photo-piece/g) ?? []).length, 9);
  const oldDu = await renderPath("/members/du-nanyang-old");
  assert.doesNotMatch(oldDu, /徐惠 · 人物档案/);
  assert.match(oldDu, /配偶：徐惠/);
  assert.doesNotMatch(oldDu, /HTTP 301 \/ PERMANENT|永久重定向目标损坏|du＿lin/);
  assert.doesNotMatch(duCheFamily, /朗读文件索引|杜彻婚礼|编辑登录|寿享陵园/);

  const liXiang = await renderPath("/archive/deaths/lixiang");
  assert.match(liXiang, /公开说法/);
  assert.match(liXiang, /溺亡/);
  assert.match(liXiang, /尚未经过案卷交叉验证/);
  assert.match(liXiang, /文学层中，她是杜南阳的妹妹/);
  assert.match(liXiang, /材料名称：尸检报告/);
  assert.doesNotMatch(liXiang, /下一搜索词|搜索[“\"]?尸检报告/);
  assert.match(liXiang, /人体检验材料/);
  assert.match(liXiang, /ARCHIVE MOVED/);
});

test("renders the forensic route, encrypted supplement, and completed cremation form", async () => {
  const autopsy = await renderPath("/archive/autopsy/wang-keding");
  assert.match(autopsy, /双手/);
  assert.match(autopsy, /反绑于身后/);
  assert.match(autopsy, /脸颊三道割伤/);
  assert.match(autopsy, /石立人·头部塑像/);

  const temple = await renderPath("/archive/evidence/xiyansi");
  assert.match(temple, /六十七尊/);
  assert.doesNotMatch(temple, /检查断口|检查石座|断口在先|系统把断口|六／七/);
  for (const part of ["右眼", "左眼", "右耳", "左耳", "右鼻孔", "左鼻孔", "口"]) assert.ok(temple.includes(`aria-label="${part}"`));
  assert.doesNotMatch(temple, /stone-fallen-note/);
  assert.match(temple, /stone-head-evidence-blood\.webp/);
  assert.doesNotMatch(temple, /seep-line/);

  const supplement = await renderPath("/archive/autopsy/wang-keding-supplement");
  assert.match(supplement, /石像数量－面部伤口数/);
  assert.match(supplement, /无失败锁定/);

  const wangDeath = await renderPath("/recovered/13-wang-keding");
  assert.match(wangDeath, /服毒自杀/);
  assert.match(wangDeath, /投河现场由邢万在死后伪造/);
  assert.match(wangDeath, /死亡性质：自杀/);
  assert.match(wangDeath, /残留表单标题：焚烧签字单/);
  assert.doesNotMatch(wangDeath, /用这份单据的名称继续查找/);

  const cremation = await renderPath("/archive/forms/cremation-du-complete");
  assert.match(cremation, /方晚/);
  assert.match(cremation, /完整文字层/);
  assert.match(cremation, /cemetery-receipt\.webp/);
  assert.doesNotMatch(cremation, /旧闻关联|NEXT: CASE/);
});

test("keeps next search terms inside evidence instead of page instructions", async () => {
  const source = await import("node:fs/promises").then(({ readFile }) =>
    readFile(new URL("../app/game-app.tsx", import.meta.url), "utf8"),
  );

  assert.doesNotMatch(source, /setQuery\("李司贰"\)/);
  assert.doesNotMatch(source, /下一搜索词：|用部位名称搜索|用这份单据的名称继续查找|搜索“刍味”|NEXT TITLE:/);
  assert.match(source, /材料名称：尸检报告/);
  assert.match(source, /部位：右小手指/);
  assert.match(source, /随信书稿索引/);
  assert.match(source, /杜彻／小说／《玛赫的厨房》/);
});

test("keeps the missing-work clues and places the supplied image only in Ge Dongping's profile", async () => {
  const exhibition = await renderPath("/exhibitions/zhuhongmen");
  assert.match(exhibition, /检查西南角空画框/);
  assert.doesNotMatch(exhibition, /ge-dongping-figure\.webp/);

  const artwork = await renderPath("/cache/artwork/baishaorou");
  assert.match(artwork, /IMAGE REMOVED/);
  assert.doesNotMatch(artwork, /ge-dongping-figure\.webp/);
  assert.doesNotMatch(artwork, /原作留存图/);

  const geDongping = await renderPath("/members/ge-dongping");
  assert.match(geDongping, /PERSON \/ PUBLIC FILE/);
  assert.match(geDongping, /ge-dongping-figure\.webp/);
  assert.match(geDongping, /葛东平赤着上身/);
  assert.match(geDongping, /如是古时候受用墨刑的罪人/);
  assert.doesNotMatch(geDongping, /白芍肉/);
});

test("renders the five-person cemetery case with the canonical outcomes", async () => {
  const caseIndex = await renderPath("/archive/case/cemetery");
  assert.match(caseIndex, /CASE INDEX \/ 05 PERSONS/);
  assert.match(caseIndex, /xing-arrest-magazine/);
  assert.doesNotMatch(caseIndex, /索引原则|新闻标题没有写出/);
  assert.match(caseIndex, /杜万琳/);
  assert.match(caseIndex, /方晚/);
  assert.match(caseIndex, /王克定/);
  assert.match(caseIndex, /邢万/);
  assert.match(caseIndex, /莉香/);
  assert.match(caseIndex, /服毒自杀，投河现场由邢万伪造/);
  assert.match(caseIndex, /遭邢万掐死，溺亡说法不成立/);
  assert.match(caseIndex, /被捕并判处无期徒刑/);
  assert.match(caseIndex, /晚年患阿尔茨海默症/);
  assert.doesNotMatch(caseIndex, /王克定并非自杀|王克定.*遭杀害/);
});

test("renders the cached news, cemetery mirror, and Du Che profile", async () => {
  const news = await renderPath("/news/cache/xing-mou");
  assert.match(news, /刑某现已被警方依法逮捕/);
  assert.match(news, /原刊/);
  assert.match(news, /缓存/);

  const cemetery = await renderPath("/mirror/shouxiang/staff");
  assert.match(cemetery, /shouxiang\.invalid/);
  assert.match(cemetery, /杜彻/);
  assert.doesNotMatch(cemetery, /来访与文学索引/);
  assert.match(cemetery, /投资人/);
  assert.doesNotMatch(cemetery, /杜彻<[^>]*>.*?负责人/);

  const duChe = await renderPath("/members/du-che");
  assert.match(duChe, /记录尚未开放/);
  assert.doesNotMatch(duChe, /杜万琳与徐惠之子|朗读文件索引|编辑登录/);
});

test("keeps recovered Mang scripts out of the gallery while retaining the clue chain", async () => {
  const mangSpring = await renderPath("/recovered/01-mangzhichun");
  assert.match(mangSpring, /当前步骤 \/ 仍在画廊网站/);
  assert.match(mangSpring, /加密文件夹尚未开放/);
  assert.match(mangSpring, /分类残留/);
  assert.match(mangSpring, />憎恶</);
  assert.match(mangSpring, /回到画廊搜索框/);

  const wedding = await renderPath("/archive/wedding/du-li");
  assert.match(wedding, /ARCHIVE MOVED/);
  assert.match(wedding, /舞/);
  assert.match(wedding, /图像原稿仅保存在 Administrator 的加密文件夹/);

  const taste = await renderPath("/recovered/10-chuwei-taste");
  assert.match(taste, /ARCHIVE MOVED/);
  assert.match(taste, /刍味/);

  const redacted = await renderPath("/archive/medical/redacted");
  assert.match(redacted, /××××××/);
  assert.match(redacted, /记忆障碍/);
  assert.match(redacted, /执行功能障碍/);

  const stomach = await renderPath("/recovered/11-chuwei-stomach");
  assert.match(stomach, /ARCHIVE MOVED/);
  assert.match(stomach, /刍胃/);
});

test("renders the version history, letter, publication, and fictional editor gate", async () => {
  const history = await renderPath("/archive/site-history/kuonan");
  assert.match(history, /SITE HISTORY \/ 1 OF 5/);
  assert.match(history, /每次抵达页面底部/);

  const letter = await renderPath("/archive/letters/li-to-ye");
  assert.match(letter, /李司贰致叶是/);
  assert.match(letter, /editor_ys/);
  assert.match(letter, /自己小说里的“憎恶社”/);

  const publication = await renderPath("/publications/mahe-de-chufang");
  assert.match(publication, /玛赫的/);
  assert.match(publication, /2019/);
  assert.match(publication, /M H D C F/);

  const login = await renderPath("/admin/editor/login");
  assert.match(login, /站内虚构缓存/);
  assert.match(login, /错误次数不限/);
  assert.match(login, /不保存明文口令/);
});

test("renders the rewritten character history and encrypted fragment index", async () => {
  const revisions = await renderPath("/admin/editor/revisions");
  assert.match(revisions, /元昶/);
  assert.match(revisions, /左君/);
  assert.match(revisions, /人物年表修订/);

  const character = await renderPath("/admin/characters/yuanchang");
  assert.match(character, /小说角色与可改写年表/);
  assert.match(character, /Ⅰ—Ⅹ/);
  assert.match(character, /始／末／的／碎／点/);

  const serialIndex = await renderPath("/publications/juroutuanfei");
  assert.match(serialIndex, /句肉.*抟飞/s);
  assert.match(serialIndex, /0\/5/);
  assert.match(serialIndex, /尚无章节开放/);
  assert.doesNotMatch(serialIndex, /3dm×3dm A\.A\.1/);
  assert.doesNotMatch(serialIndex, /旁观“肱运动”从一开始就很不着落/);

  for (let section = 1; section <= 5; section += 1) {
    const sealedSection = await renderPath(`/publications/juroutuanfei/section-${section}`);
    assert.match(sealedSection, /章节尚未开放/);
    assert.match(sealedSection, /这个地址不能提前解锁正文/);
    assert.doesNotMatch(sealedSection, /旁观“肱运动”从一开始就很不着落/);
  }

  const fragments = await renderPath("/stage/recovered-index");
  assert.match(fragments, /ENCRYPTED INDEX \/ Ⅰ—Ⅹ/);
  assert.match(fragments, /作者被替换前的旧名/);
  assert.match(fragments, /错误不会清空碎片/);
});

test("renders the warm stage reveal and text-only Shinan curtain call", async () => {
  const finale = await renderPath("/stage/zhuhongmen");
  assert.match(finale, /场次 14 \/ 14/);
  assert.match(finale, /ARCHIVE MOVED/);
  assert.match(finale, /所有人请就位/);
  assert.match(finale, /演出名：诗喃/);
  assert.doesNotMatch(finale, /下一页不会公布凶手/);

  const shinan = await renderPath("/stage/shinan");
  assert.match(shinan, /航船诗歌社 · 国庆诗歌剧场/);
  assert.match(shinan, /静音字幕版开演/);
  assert.doesNotMatch(shinan, /archive\/shinan|<img|演出海报|活动照|现场照片/);
  assert.match(shinan, /他们是剧中人，也是朗读者/);
  assert.match(shinan, /不构成通关门槛/);
});
