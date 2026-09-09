# 憎恶社 / ZENGWUSHE

艇造司出品的基于陈潮小说集《句肉抟飞》与诗集《目盲》改变的ARG游戏
可点击以下链接进行游玩：https://midnight-apron.github.io/ZENGWUSHE

## 当前版本

- 完成序章 S01—S05 的可玩搜索链
- 保留浏览记录、恢复进度与分级提示
- 支持键盘操作、减少动态效果与纯文本阅读
- 使用 GitHub Pages 自动构建和发布

## V2 独立升级入口

V2 位于 `/v2/`，以杜彻旧电脑为游戏外壳。浏览器、回收站、录音文件和上锁文件夹共用事件型存档；旧版入口与旧存档保持不变。

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
