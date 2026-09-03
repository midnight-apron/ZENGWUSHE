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

test("renders the game metadata and opening exhibition", async () => {
  const html = await renderPath("/");
  assert.match(html, /<title>憎恶社｜作品与旧档案<\/title>/);
  assert.match(html, /赭红门/);
  assert.match(html, /搜索作品、人名、尺寸或文件标签/);
});

test("renders the recovered identity and death-record chapter routes", async () => {
  const mergedIdentity = await renderPath("/members/du-wanlin");
  assert.match(mergedIdentity, /杜南阳/);
  assert.match(mergedIdentity, /杜万琳/);
  assert.match(mergedIdentity, /IDENTITY MERGE/);

  const wangKeding = await renderPath("/members/wang-keding");
  assert.match(wangKeding, /公开死亡记录/);
  assert.match(wangKeding, /结论：自杀/);
  assert.match(wangKeding, /该结论尚未经过交叉验证/);

  const liXiang = await renderPath("/archive/deaths/lixiang");
  assert.match(liXiang, /死亡过程/);
  assert.match(liXiang, /溺亡/);
  assert.match(liXiang, /不记录原因与责任主体/);
  assert.match(liXiang, /已恢复 06 \/ 14/);
});

test("renders the forensic route, encrypted supplement, and completed cremation form", async () => {
  const autopsy = await renderPath("/archive/autopsy/wang-keding");
  assert.match(autopsy, /双手/);
  assert.match(autopsy, /反绑于身后/);
  assert.match(autopsy, /脸颊三道割伤/);

  const temple = await renderPath("/archive/evidence/xiyansi");
  assert.match(temple, /六十七尊/);
  assert.match(temple, /检查断口/);
  assert.match(temple, /检查石座/);

  const supplement = await renderPath("/archive/autopsy/wang-keding-supplement");
  assert.match(supplement, /石像数量－面部伤口数/);
  assert.match(supplement, /无失败锁定/);

  const wangDeath = await renderPath("/recovered/13-wang-keding");
  assert.match(wangDeath, /王克定并非自杀/);
  assert.match(wangDeath, /现场被布置为投河自杀/);
  assert.match(wangDeath, /责任主体：现有材料不指认/);

  const cremation = await renderPath("/archive/forms/cremation-du-complete");
  assert.match(cremation, /方晚/);
  assert.match(cremation, /已恢复 08 \/ 14/);
  assert.match(cremation, /他山地方公墓贪污案/);
});

test("renders the five-person cemetery case without inventing missing deaths", async () => {
  const caseIndex = await renderPath("/archive/case/cemetery");
  assert.match(caseIndex, /CASE INDEX \/ 05 PERSONS/);
  assert.match(caseIndex, /杜万琳/);
  assert.match(caseIndex, /方晚/);
  assert.match(caseIndex, /王克定/);
  assert.match(caseIndex, /刑万/);
  assert.match(caseIndex, /莉香/);
  assert.match(caseIndex, /自杀现场系伪造/);
  assert.match(caseIndex, /溺亡/);
  assert.match(caseIndex, /死亡过程未公开/);
  assert.doesNotMatch(caseIndex, /责任单位|执行人|凶手/);
});

test("renders the cached news, cemetery mirror, and Du Che profile", async () => {
  const news = await renderPath("/news/cache/xing-mou");
  assert.match(news, /刑某现已被警方依法逮捕/);
  assert.match(news, /原刊/);
  assert.match(news, /缓存/);

  const cemetery = await renderPath("/mirror/shouxiang/staff");
  assert.match(cemetery, /shouxiang\.invalid/);
  assert.match(cemetery, /杜彻/);
  assert.match(cemetery, /负责人/);

  const duChe = await renderPath("/members/du-che");
  assert.match(duChe, /杜万琳与徐惠之子/);
  assert.match(duChe, /李髮／李髪/);
  assert.match(duChe, /编辑登录/);
});

test("renders recovered scripts 07, 10, and 11 with the medical clue chain", async () => {
  const wedding = await renderPath("/archive/wedding/du-li");
  assert.match(wedding, /已恢复 07 \/ 14/);
  assert.match(wedding, /舞/);
  assert.match(wedding, /朗读声部：徐惠/);

  const taste = await renderPath("/recovered/10-chuwei-taste");
  assert.match(taste, /已恢复 10 \/ 14/);
  assert.match(taste, /寿享陵园/);
  assert.match(taste, /朗读声部：杜彻/);

  const redacted = await renderPath("/archive/medical/redacted");
  assert.match(redacted, /××××××/);
  assert.match(redacted, /记忆障碍/);
  assert.match(redacted, /执行功能障碍/);

  const stomach = await renderPath("/recovered/11-chuwei-stomach");
  assert.match(stomach, /阿尔茨海默病/);
  assert.match(stomach, /已恢复 11 \/ 14/);
  assert.match(stomach, /朗读声部：杜万琳/);
  assert.match(stomach, /阔南会社/);
});
