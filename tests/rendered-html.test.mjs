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
