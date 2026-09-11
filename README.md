# 憎恶社 / ZENGWUSHE

艇造司出品的基于陈潮小说集《句肉抟飞》与诗集《目盲》改编的 ARG 游戏。

游戏入口：https://midnight-apron.github.io/ZENGWUSHE/

## 当前版本

- 以杜彻旧电脑为游戏外壳，包含浏览器、回收站、录音文件、《目盲》上锁文件夹和最终 Word 文件
- 画廊旧站与寿享陵园旧站作为独立的站内网页按线索开放
- 保留事件型存档、搜索记录、恢复进度与分级提示
- 完成画廊终场后取得 Word 口令，解锁最终外部链接
- 支持键盘操作、减少动态效果与字幕阅读
- 使用 GitHub Pages 自动构建和发布

## 本地运行

需要 Node.js `>=22.13.0`。

```bash
npm ci
npm run dev
```

## 检查与构建

```bash
npm run lint
npm test
./scripts/build-github-pages.sh /ZENGWUSHE
```

GitHub Pages 的生产文件会输出到 `dist/client`。

## 说明

本项目为文学文本改编的虚构交互原型。游戏中的人物、机构与事件均属于作品内部叙事。
