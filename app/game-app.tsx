"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type FormEvent,
  type ReactNode,
} from "react";
import {
  ArrowUpRight,
  Eye,
  EyeOff,
  FileWarning,
  FolderOpen,
  HelpCircle,
  Search,
  Settings2,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";

const STORAGE_KEY = "zengwu-she-prototype-v1";
const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

type Settings = {
  reducedScares: boolean;
  reducedMotion: boolean;
  assistedInteraction: boolean;
};

type GameState = {
  unlocked: string[];
  recovered: string[];
  visited: string[];
  frameClicks: number;
  scaresSeen: string[];
  settings: Settings;
};

type SearchResult = {
  id: string;
  kind: string;
  title: string;
  summary: string;
  path?: string;
  unlock?: string[];
  recover?: string[];
  locked?: boolean;
  note?: string;
};

const DEFAULT_STATE: GameState = {
  unlocked: [],
  recovered: [],
  visited: [],
  frameClicks: 0,
  scaresSeen: [],
  settings: {
    reducedScares: false,
    reducedMotion: false,
    assistedInteraction: false,
  },
};

const ROUTES = {
  exhibition: "/exhibitions/zhuhongmen",
  artwork: "/cache/artwork/baishaorou",
  curator: "/cache/curator/li-tai",
  dimensions: "/cross-index/3dm-3dm",
  damagedReader: "/archive/damaged/reader-01",
  recoveredOne: "/recovered/01-mangzhichun",
  history: "/about/history",
};

const PAGE_TITLES: Record<string, string> = {
  [ROUTES.exhibition]: "赭红门｜当期展览",
  [ROUTES.artwork]: "白芍肉｜撤回作品缓存",
  [ROUTES.curator]: "李泰｜旧成员缓存",
  [ROUTES.dimensions]: "3dm×3dm｜尺寸交叉索引",
  [ROUTES.damagedReader]: "损坏朗读页｜档案 01",
  [ROUTES.recoveredOne]: "盲之春｜已恢复",
  [ROUTES.history]: "憎恶社｜旧社团历史",
};

const HINTS: Record<string, string[]> = {
  [ROUTES.exhibition]: [
    "目录与墙面并不一致。留意访客意见中被反复提到的作品。",
    "葛东平说，西南角本来应该挂着他的画。",
    "在搜索框输入：白芍肉。",
  ],
  [ROUTES.artwork]: [
    "这份旧作品页仍留着一名被遮去的人员。",
    "葛东平在投诉里反复喊出了那个人的名字。",
    "在搜索框输入：李泰。",
  ],
  [ROUTES.curator]: [
    "不要继续查人名，查两份记录共有的规格。",
    "缓存页上唯一精确到单位的字段，是作品尺寸。",
    "搜索：3dm×3dm。乘号也可以写成 x 或 *。",
  ],
  [ROUTES.dimensions]: [
    "两条记录有同一个尺寸，其中一条没有标题。",
    "规格里的数字也可能是动作次数。",
    "连续点击空画框中心 3 次。",
  ],
  [ROUTES.damagedReader]: [
    "乱码不会阻断线索，可以打开纯文字版本。",
    "把“看不见”换成一个字，再接上“春天”的“春”。",
    "搜索：盲之春。",
  ],
  [ROUTES.recoveredOne]: [
    "留意正文之外的页脚、标签与分类残留。",
    "“憎恶”既是标签，也是这个网站名称的一部分。",
    "搜索：憎恶社。",
  ],
  [ROUTES.history]: [
    "首段原型已经完成。下一条人物线索在旧年表中。",
    "创办人的旧名没有出现在现代成员表。",
    "下一阶段将从：杜南阳，继续。",
  ],
};

function unique(values: string[]) {
  return Array.from(new Set(values));
}

function normalizeQuery(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[《》〈〉【】\[\]（）()，,。.!！?？·—_\s]/g, "")
    .replace(/[×＊*]/g, "x");
}

function displayPath(path: string) {
  let cleanPath = path.split("?")[0].split("#")[0] || "/";
  if (BASE_PATH && cleanPath.startsWith(BASE_PATH)) {
    cleanPath = cleanPath.slice(BASE_PATH.length) || "/";
  }
  if (cleanPath === "/") return ROUTES.exhibition;
  return cleanPath;
}

function browserPath(path: string) {
  return `${BASE_PATH}${path}` || "/";
}

function MetaLine({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="meta-line">
      <dt>{label}</dt>
      <dd>{children}</dd>
    </div>
  );
}

function CacheStamp({ children }: { children: ReactNode }) {
  return <span className="cache-stamp">{children}</span>;
}

function ArtifactTag({ children }: { children: ReactNode }) {
  return <span className="artifact-tag">{children}</span>;
}

export function GameApp({ initialPath }: { initialPath: string }) {
  const [path, setPath] = useState(initialPath);
  const [game, setGame] = useState<GameState>(DEFAULT_STATE);
  const [hydrated, setHydrated] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[] | null>(null);
  const [resultNote, setResultNote] = useState("");
  const [wrongAttempts, setWrongAttempts] = useState<Record<string, number>>({});
  const [hintLevel, setHintLevel] = useState(0);
  const [frameNotice, setFrameNotice] = useState(false);
  const [plainText, setPlainText] = useState(false);
  const [scareActive, setScareActive] = useState(false);
  const [scareTextVisible, setScareTextVisible] = useState(false);
  const [roleGlitch, setRoleGlitch] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const skipScareRef = useRef<HTMLButtonElement>(null);

  const currentPath = displayPath(path);
  const currentHints = HINTS[currentPath] ?? HINTS[ROUTES.exhibition];

  const mutateGame = useCallback((unlock: string[] = [], recover: string[] = []) => {
    setGame((previous) => ({
      ...previous,
      unlocked: unique([...previous.unlocked, ...unlock]),
      recovered: unique([...previous.recovered, ...recover]),
    }));
  }, []);

  const navigate = useCallback((nextPath: string) => {
    const cleanPath = displayPath(nextPath);
    window.history.pushState({}, "", browserPath(nextPath));
    setPath(cleanPath);
    setResults(null);
    setResultNote("");
    setQuery("");
    setFrameNotice(false);
    setPlainText(false);
  }, []);

  const finishMangRecovery = useCallback(() => {
    setScareActive(false);
    setScareTextVisible(false);
    mutateGame(["S03", "S04"], ["01"]);
    navigate(ROUTES.recoveredOne);
  }, [mutateGame, navigate]);

  useEffect(() => {
    const initialize = window.setTimeout(() => {
      const stored = window.localStorage.getItem(STORAGE_KEY);
      if (stored) {
        try {
          const parsed = JSON.parse(stored) as Partial<GameState>;
          setGame({
            ...DEFAULT_STATE,
            ...parsed,
            settings: { ...DEFAULT_STATE.settings, ...(parsed.settings ?? {}) },
          });
        } catch {
          window.localStorage.removeItem(STORAGE_KEY);
        }
      } else if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
        setGame((previous) => ({
          ...previous,
          settings: { ...previous.settings, reducedMotion: true },
        }));
      }
      setHydrated(true);
    }, 0);

    const onPopState = () => {
      setPath(displayPath(window.location.pathname));
      setResults(null);
    };
    window.addEventListener("popstate", onPopState);
    return () => {
      window.clearTimeout(initialize);
      window.removeEventListener("popstate", onPopState);
    };
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(game));
  }, [game, hydrated]);

  useEffect(() => {
    if (!hydrated) return;
    const arrival: Record<string, { unlock?: string[]; recover?: string[] }> = {
      [ROUTES.artwork]: { unlock: ["S01"] },
      [ROUTES.curator]: { unlock: ["S01", "S02"] },
      [ROUTES.dimensions]: { unlock: ["S01", "S02"] },
      [ROUTES.damagedReader]: { unlock: ["S01", "S02", "S03"] },
      [ROUTES.recoveredOne]: {
        unlock: ["S01", "S02", "S03", "S04"],
        recover: ["01"],
      },
      [ROUTES.history]: {
        unlock: ["S01", "S02", "S03", "S04", "S05"],
        recover: ["01", "02"],
      },
    };
    const effect = arrival[currentPath];
    const syncArrival = window.setTimeout(() => {
      setGame((previous) => ({
        ...previous,
        unlocked: unique([...previous.unlocked, ...(effect?.unlock ?? [])]),
        recovered: unique([...previous.recovered, ...(effect?.recover ?? [])]),
        visited: unique([...previous.visited, currentPath]),
      }));
      setHintLevel(0);
    }, 0);
    document.title = `${PAGE_TITLES[currentPath] ?? "憎恶社"}｜憎恶社`;
    window.scrollTo({ top: 0, behavior: game.settings.reducedMotion ? "auto" : "smooth" });
    return () => window.clearTimeout(syncArrival);
  }, [currentPath, hydrated, game.settings.reducedMotion]);

  useEffect(() => {
    if (currentPath !== ROUTES.history || game.scaresSeen.includes("role-glitch")) return;
    const start = window.setTimeout(() => setRoleGlitch(true), 0);
    const timer = window.setTimeout(() => {
      setRoleGlitch(false);
      setGame((previous) => ({
        ...previous,
        scaresSeen: unique([...previous.scaresSeen, "role-glitch"]),
      }));
    }, game.settings.reducedMotion ? 120 : 1100);
    return () => {
      window.clearTimeout(start);
      window.clearTimeout(timer);
    };
  }, [currentPath, game.scaresSeen, game.settings.reducedMotion]);

  useEffect(() => {
    if (!scareActive) return;
    skipScareRef.current?.focus();
    const reveal = window.setTimeout(
      () => setScareTextVisible(true),
      game.settings.reducedMotion ? 0 : 450,
    );
    const enter = window.setTimeout(
      () => finishMangRecovery(),
      game.settings.reducedMotion ? 120 : 1750,
    );
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") finishMangRecovery();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.clearTimeout(reveal);
      window.clearTimeout(enter);
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [scareActive, finishMangRecovery, game.settings.reducedMotion]);

  function triggerMangRecovery() {
    if (game.settings.reducedScares || game.scaresSeen.includes("J01")) {
      finishMangRecovery();
      return;
    }
    setGame((previous) => ({
      ...previous,
      scaresSeen: unique([...previous.scaresSeen, "J01"]),
    }));
    setScareTextVisible(false);
    setScareActive(true);
  }

  function openResult(result: SearchResult) {
    if (result.locked || !result.path) return;
    mutateGame(result.unlock ?? [], result.recover ?? []);
    navigate(result.path);
  }

  function markWrong(message: string, fallbackResults: SearchResult[] = []) {
    const nextCount = (wrongAttempts[currentPath] ?? 0) + 1;
    setWrongAttempts((previous) => ({ ...previous, [currentPath]: nextCount }));
    setResults(fallbackResults);
    setResultNote(nextCount >= 3 ? `${message} 提示：${currentHints[0]}` : message);
  }

  function handleSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const normalized = normalizeQuery(query);
    if (!normalized) {
      setResults([]);
      setResultNote("先输入一个作品名、人名、尺寸或文件标签。");
      return;
    }

    if (normalized === "白芍肉") {
      setResults([{
        id: "baishaorou",
        kind: "撤回作品缓存 · 1条",
        title: "《白芍肉》",
        summary: "创作者：葛东平。公开目录无此记录；旧缓存仍可读取。",
        path: ROUTES.artwork,
        unlock: ["S01"],
      }]);
      setResultNote("搜索范围已越过公开目录。");
      return;
    }

    if (normalized === "李泰" || normalized === "litai") {
      const allowed = game.unlocked.includes("S01") || currentPath === ROUTES.artwork;
      setResults([{
        id: "li-tai",
        kind: allowed ? "旧成员缓存 · 1条" : "受限元数据 · 1条",
        title: "李泰",
        summary: allowed ? "策展记录已撤回。缓存写入时间晚于撤展时间一分钟。" : "旧成员记录存在；作品来源尚未恢复。",
        path: allowed ? ROUTES.curator : undefined,
        unlock: allowed ? ["S02"] : undefined,
        locked: !allowed,
        note: allowed ? undefined : "权限不足",
      }]);
      setResultNote(allowed ? "找到一份未列入成员目录的缓存。" : "先恢复与此人相关的作品记录。");
      return;
    }

    if (["3dmx3dm", "3x3dm", "3dm3dm"].includes(normalized)) {
      const allowed = game.unlocked.includes("S02") || currentPath === ROUTES.curator;
      setResults([{
        id: "dimension-cross",
        kind: allowed ? "尺寸交叉索引 · 2条" : "公开作品 · 2条",
        title: "3dm × 3dm",
        summary: allowed ? "两份材料使用同一规格；其中一条没有作品名。" : "两件公开作品符合该尺寸，隐藏附件未展开。",
        path: allowed ? ROUTES.dimensions : undefined,
        locked: !allowed,
        note: allowed ? undefined : "索引未恢复",
      }]);
      setResultNote(allowed ? "发现跨目录重复字段。" : "该查询仍停留在公开目录。");
      return;
    }

    if (normalized === "盲之春" || normalized === "盲春") {
      const allowed = game.frameClicks >= 3 || game.unlocked.includes("S03");
      if (allowed) {
        setResults(null);
        setResultNote("");
        triggerMangRecovery();
      } else {
        setResults([{
          id: "mang-spring-locked",
          kind: "损坏文件 · 1条",
          title: "mang_?_chun",
          summary: "文件存在，但尚未取得隐藏档案访问资格。",
          locked: true,
          note: "附件损坏",
        }]);
        setResultNote("先找出与这份朗读文件交叉的尺寸记录。");
      }
      return;
    }

    if (normalized === "憎恶社" || normalized === "憎恶") {
      const allowed = game.recovered.includes("01") || currentPath === ROUTES.recoveredOne;
      if (!allowed) {
        setResults([{
          id: "hate-public",
          kind: "公开页面 · 1条",
          title: "关于憎恶社",
          summary: "当前网站介绍。旧社团记录尚未恢复。",
          locked: true,
          note: "仅公开摘要",
        }]);
        setResultNote("同名旧记录仍处于不可访问状态。");
        return;
      }
      setResults([
        {
          id: "history",
          kind: "组织档案",
          title: "憎恶社｜旧社团历史",
          summary: "一份从现代成员目录中消失的画社年表。",
          path: ROUTES.history,
          unlock: ["S05"],
          recover: ["02"],
        },
        {
          id: "script-two",
          kind: "朗读文件",
          title: "1.1 憎恶社（杜万琳）",
          summary: "损坏状态：可恢复。关联人物与旧社团年表重合。",
          path: `${ROUTES.history}#script-02`,
          unlock: ["S05"],
          recover: ["02"],
        },
      ]);
      setResultNote("“憎恶”同时命中组织档案与朗读文件。");
      return;
    }

    if (normalized === "杜南阳") {
      setResults([{
        id: "du-nanyang-next",
        kind: "旧人物页 · 原型边界",
        title: "杜南阳",
        summary: "永久重定向目标缺失。此人物页将在下一阶段开放。",
        locked: true,
        note: "待恢复",
      }]);
      setResultNote("你已找到下一章入口；当前试玩段到此结束。");
      return;
    }

    if (normalized === "春天") {
      markWrong("“春天”命中 8 条公开内容，但没有完整篇名。", [{
        id: "spring-public",
        kind: "公开展讯",
        title: "春季驻留计划",
        summary: "普通公开页面，与损坏朗读文件没有直接关联。",
        locked: true,
      }]);
      return;
    }

    if (normalized === "策展人") {
      markWrong("人员范围过宽。旧缓存中的名字比职位更有效。", [{
        id: "curators-public",
        kind: "公开成员",
        title: "策展与编辑",
        summary: "现任成员 4 人；撤回记录未显示。",
        locked: true,
      }]);
      return;
    }

    markWrong(`没有找到“${query.trim()}”。已保留原查询。`);
  }

  function inspectFrame() {
    if (currentPath === ROUTES.exhibition) {
      setFrameNotice(true);
      return;
    }
    if (currentPath !== ROUTES.dimensions || game.frameClicks >= 3) return;
    const nextCount = Math.min(3, game.frameClicks + 1);
    setGame((previous) => ({
      ...previous,
      frameClicks: nextCount,
      unlocked: nextCount === 3 ? unique([...previous.unlocked, "S03"]) : previous.unlocked,
    }));
  }

  function renderPage() {
    switch (currentPath) {
      case ROUTES.artwork:
        return <ArtworkPage />;
      case ROUTES.curator:
        return <CuratorPage />;
      case ROUTES.dimensions:
        return <DimensionsPage clicks={game.frameClicks} assisted={game.settings.assistedInteraction} onInspect={inspectFrame} onOpenReader={() => navigate(ROUTES.damagedReader)} />;
      case ROUTES.damagedReader:
        return <DamagedReaderPage plainText={plainText} onTogglePlain={() => setPlainText((value) => !value)} />;
      case ROUTES.recoveredOne:
        return <RecoveredOnePage />;
      case ROUTES.history:
        return <HistoryPage roleGlitch={roleGlitch} />;
      case ROUTES.exhibition:
      default:
        return <ExhibitionPage frameNotice={frameNotice} onInspectFrame={inspectFrame} />;
    }
  }

  const recoveredLabel = `${game.recovered.length}/14`;
  const progressPercent = Math.round((game.recovered.length / 14) * 100);
  const searchSummary = useMemo(() => {
    if (!results) return "";
    if (results.length === 0) return resultNote;
    return `${resultNote} ${results.length} 条结果。`;
  }, [results, resultNote]);

  return (
    <div className={`game-shell${game.settings.reducedMotion ? " reduce-motion" : ""}`}>
      <a className="skip-link" href="#main-content">跳到正文</a>

      <header className="site-header">
        <button className="wordmark" type="button" onClick={() => navigate(ROUTES.exhibition)} aria-label="返回憎恶社当期展览">
          <span className="wordmark-mark" aria-hidden="true">憎恶社</span>
          <span><b>ZENGWU SOCIETY</b><small>作品与旧档案</small></span>
        </button>

        <nav className="gallery-section-nav" aria-label="画廊栏目">
          <button type="button" className="is-current" onClick={() => navigate(ROUTES.exhibition)}>展览</button>
          <span>作品</span>
          <span>艺术家</span>
          <span>出版</span>
          <span>关于</span>
        </nav>

        <form className="global-search" onSubmit={handleSearch} role="search">
          <Search aria-hidden="true" />
          <label className="sr-only" htmlFor="global-query">搜索作品、人名、尺寸或文件标签</label>
          <input id="global-query" ref={searchInputRef} value={query} onChange={(event) => setQuery(event.target.value)} placeholder="搜索作品、人名、尺寸或文件标签" autoComplete="off" spellCheck={false} aria-describedby="search-instruction" />
          <button type="submit">搜索</button>
          <span className="sr-only" id="search-instruction">线索可能存在于公开导航之外。搜索不会自动清空错误答案。</span>

          {results !== null && (
            <section className="search-results" aria-label="搜索结果">
              <div className="search-results-head">
                <p>{resultNote || "搜索结果"}</p>
                <button type="button" onClick={() => setResults(null)} aria-label="关闭搜索结果"><X /></button>
              </div>
              {results.length === 0 ? (
                <div className="empty-result"><span aria-hidden="true">∅</span><p>目录没有给出答案。换一种更精确的写法。</p></div>
              ) : (
                <div className="result-list">
                  {results.map((result) => (
                    <button key={result.id} className="result-card" type="button" onClick={() => openResult(result)} disabled={result.locked || !result.path}>
                      <span className="result-kind">{result.kind}</span>
                      <strong>{result.title}</strong>
                      <span className="result-summary">{result.summary}</span>
                      {result.note ? <span className="result-note">{result.note}</span> : <ArrowUpRight className="result-arrow" aria-hidden="true" />}
                    </button>
                  ))}
                </div>
              )}
            </section>
          )}
        </form>

        <nav className="header-actions" aria-label="游戏工具">
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="ghost" className="header-button"><FolderOpen aria-hidden="true" /><span>已恢复</span><b>{recoveredLabel}</b></Button>
            </DialogTrigger>
            <DialogContent className="archive-dialog">
              <DialogHeader><DialogTitle>已恢复的朗读文件</DialogTitle><DialogDescription>文件保存在这台设备上。完整游戏共 14 份。</DialogDescription></DialogHeader>
              <div className="archive-progress" aria-label={`恢复进度 ${recoveredLabel}`}><span style={{ width: `${progressPercent}%` }} /></div>
              <ol className="archive-list">
                <li className={game.recovered.includes("01") ? "is-found" : ""}><span>01</span><div><b>{game.recovered.includes("01") ? "序诗：盲之春" : "未恢复"}</b><small>{game.recovered.includes("01") ? "来源：损坏朗读页" : "文件名未知"}</small></div></li>
                <li className={game.recovered.includes("02") ? "is-found" : ""}><span>02</span><div><b>{game.recovered.includes("02") ? "1.1 憎恶社（杜万琳）" : "未恢复"}</b><small>{game.recovered.includes("02") ? "来源：旧社团历史" : "文件名未知"}</small></div></li>
                <li className="archive-locked-row"><span>03—14</span><div><b>尚未开放</b><small>完整版将继续沿人物与事件索引展开</small></div></li>
              </ol>
            </DialogContent>
          </Dialog>

          <Dialog>
            <DialogTrigger asChild><Button variant="ghost" size="icon" className="header-icon" aria-label="打开线索"><HelpCircle aria-hidden="true" /></Button></DialogTrigger>
            <DialogContent className="hint-dialog">
              <DialogHeader><DialogTitle>当前线索</DialogTitle><DialogDescription>提示分三级递进；第三条会直接给出答案或动作。</DialogDescription></DialogHeader>
              <div className="hint-sheet"><span>提示 {hintLevel + 1}/3</span><p>{currentHints[hintLevel]}</p></div>
              <Button variant="outline" onClick={() => setHintLevel((level) => Math.min(2, level + 1))} disabled={hintLevel >= 2}>{hintLevel >= 2 ? "已显示最终提示" : "再给我一点提示"}</Button>
            </DialogContent>
          </Dialog>

          <Dialog>
            <DialogTrigger asChild><Button variant="ghost" size="icon" className="header-icon" aria-label="打开显示选项"><Settings2 aria-hidden="true" /></Button></DialogTrigger>
            <DialogContent className="settings-dialog">
              <DialogHeader><DialogTitle>显示与互动</DialogTitle><DialogDescription>不会改变谜题答案，只调整呈现方式。</DialogDescription></DialogHeader>
              <label className="setting-row"><span><b>减少惊吓</b><small>跳过黑场与突发文字，直接进入内容。</small></span><Switch checked={game.settings.reducedScares} onCheckedChange={(checked) => setGame((previous) => ({ ...previous, settings: { ...previous.settings, reducedScares: checked } }))} aria-label="减少惊吓" /></label>
              <label className="setting-row"><span><b>减少动态</b><small>关闭位移动画与平滑滚动。</small></span><Switch checked={game.settings.reducedMotion} onCheckedChange={(checked) => setGame((previous) => ({ ...previous, settings: { ...previous.settings, reducedMotion: checked } }))} aria-label="减少动态" /></label>
              <label className="setting-row"><span><b>简化互动</b><small>为重复点击显示明确次数。</small></span><Switch checked={game.settings.assistedInteraction} onCheckedChange={(checked) => setGame((previous) => ({ ...previous, settings: { ...previous.settings, assistedInteraction: checked } }))} aria-label="简化互动" /></label>
            </DialogContent>
          </Dialog>
        </nav>
      </header>

      <div className="path-strip" aria-label="当前位置"><span>INDEX</span><code>{currentPath}</code>{game.visited.includes(currentPath) && <i>LOCAL COPY</i>}</div>

      <main id="main-content" className="game-main">{renderPage()}</main>

      <footer className="site-footer"><span>憎恶社 · 作品与旧档案</span><span>本页面为文学文本改编的虚构交互原型</span><button type="button" onClick={() => searchInputRef.current?.focus()}>搜索站内记录</button></footer>

      <p className="sr-only" aria-live="polite">{searchSummary}{currentPath === ROUTES.dimensions ? `空框已检查 ${game.frameClicks} 次。` : ""}</p>

      {scareActive && (
        <div className="scare-layer" role="dialog" aria-modal="true" aria-label="短暂黑场提示"><button ref={skipScareRef} type="button" onClick={finishMangRecovery}>跳过</button><p className={scareTextVisible ? "is-visible" : ""}>先听见，后看见。</p></div>
      )}
    </div>
  );
}

function ExhibitionPage({ frameNotice, onInspectFrame }: { frameNotice: boolean; onInspectFrame: () => void }) {
  return (
    <article className="exhibition-page">
      <header className="editorial-head">
        <div><p className="section-kicker">当期展览 · A区 / 01</p><h1>赭红门</h1></div>
        <dl><MetaLine label="展期">10.01—10.14</MetaLine><MetaLine label="地点">憎恶社二层主厅</MetaLine><MetaLine label="状态"><span className="status-open">开放中</span></MetaLine></dl>
      </header>
      <section className="exhibition-grid">
        <div className="wall-view">
          <div className="wall-label">西南角 / A-07</div>
          <button className="empty-frame" type="button" onClick={onInspectFrame} aria-label="检查西南角空画框"><span className="frame-center" /><span className="frame-corner top-left" /><span className="frame-corner bottom-right" /></button>
          <div className="art-label"><b>《箱庭植物三种》</b><span>作者：XXX</span><span>规格：3dm×3dm</span></div>
          {frameNotice && <div className="frame-notice" role="status"><FileWarning aria-hidden="true" /><span>作品记录不存在。墙面与目录状态不一致。</span></div>}
        </div>
        <aside className="catalog-panel">
          <div className="catalog-title"><span>公开作品目录</span><small>共 18 件</small></div>
          <ol><li><span>01</span><b>纸式鱿鱼</b><i>在展</i></li><li><span>02</span><b>鸟首上行功曹歌</b><i>在展</i></li><li><span>03</span><b>皮</b><i>在展</i></li><li><span>04</span><b>玛赫的厨房</b><i>在展</i></li><li className="catalog-gap"><span>—</span><b>记录缺失</b><i>—</i></li></ol>
          <p className="catalog-note">目录最后更新于布展完成前两日。</p>
        </aside>
      </section>
      <section className="complaint-log"><div className="complaint-index"><span>访客意见</span><b>#019</b><small>转录自现场记录</small></div><blockquote>“白芍肉，你们应该去查查，就叫这个名字……创作者是葛东平——我的画。你去问问他。”</blockquote><p>提交人未登记。原始纸页在“作品撤回”分类下找不到对应条目。</p></section>
    </article>
  );
}

function ArtworkPage() {
  return (
    <article className="record-page">
      <header className="record-header"><div><CacheStamp>RECOVERED CACHE / 01</CacheStamp><p className="section-kicker">撤回作品记录</p><h1>白芍肉</h1><p className="record-subtitle">公开目录没有这件作品，但旧版本仍保留了标题与投诉附件。</p></div><div className="cache-time"><span>最后公开版本</span><b>18:41:07</b><small>索引状态：REMOVED</small></div></header>
      <section className="record-layout"><div className="artwork-absence" aria-label="作品图像已被移除"><span>IMAGE REMOVED</span><b>图像文件已从公开服务器移除</b><small>checksum: 8f—c1—00—lost</small></div><dl className="record-facts"><MetaLine label="作品名">《白芍肉》</MetaLine><MetaLine label="创作者">葛东平</MetaLine><MetaLine label="媒介">布面综合材料</MetaLine><MetaLine label="策展联系人"><span className="redacted">李 泰</span></MetaLine><MetaLine label="目录状态">未入展 / 已撤回</MetaLine></dl></section>
      <section className="transcript-card"><div><ArtifactTag>投诉转录 / 片段 03</ArtifactTag><span className="audio-off">无音频</span></div><p>“怎么撤我的展品呢？”</p><p className="transcript-loud">“李泰呢？李泰！李泰——”</p><p>记录在此处中断。三次点名均指向同一旧成员索引。</p></section>
    </article>
  );
}

function CuratorPage() {
  return (
    <article className="record-page curator-page">
      <header className="record-header"><div><CacheStamp>MEMBER CACHE / DELISTED</CacheStamp><p className="section-kicker">旧成员记录</p><h1>李泰</h1><p className="record-subtitle">仅保留与《白芍肉》撤回相关的编辑缓存。此页不作责任归属。</p></div><div className="cache-time mismatch"><span>撤展记录</span><b>18:42</b><span>缓存写入</span><b>18:43</b><small>时间差：+00:01</small></div></header>
      <section className="version-sheet"><div className="version-number">V.04</div><div className="version-copy"><h2>作品字段变更</h2><p>标题与作者字段在公开目录同步前被清空，附件索引未同步删除。</p><dl><MetaLine label="关联作品">《白芍肉》</MetaLine><MetaLine label="创作者">葛东平</MetaLine><MetaLine label="原始规格"><mark>3dm × 3dm</mark></MetaLine><MetaLine label="附件">reader_01 / damaged</MetaLine></dl></div></section>
      <section className="cross-note"><span>字段异常</span><p>同一尺寸还出现在一条未命名文件中。人员索引无法继续展开。</p></section>
    </article>
  );
}

function DimensionsPage({ clicks, assisted, onInspect, onOpenReader }: { clicks: number; assisted: boolean; onInspect: () => void; onOpenReader: () => void }) {
  const completed = clicks >= 3;
  return (
    <article className="dimension-page">
      <header className="index-head"><div><p className="section-kicker">尺寸交叉索引</p><h1>3dm × 3dm</h1></div><p>公开作品与损坏附件使用了完全相同的规格。</p></header>
      <section className="dimension-table" aria-label="尺寸交叉结果"><div className="dimension-row dimension-labels"><span>来源</span><span>标题</span><span>状态</span></div><div className="dimension-row"><span>撤回作品</span><b>《白芍肉》</b><i>缓存可读</i></div><div className="dimension-row suspicious-row"><span>朗读附件</span><b>［标题字段为空］</b><i>DAMAGED</i></div></section>
      <section className="inspection-stage"><p className="inspection-caption">未命名附件 / 预览区域</p><button className={`inspectable-frame${completed ? " is-open" : ""}`} type="button" onClick={onInspect} aria-label={completed ? "空框已打开" : `检查空画框中心，已检查 ${clicks} 次`}><span className="inspection-center" /><span className="click-points" aria-hidden="true">{Array.from({ length: clicks }).map((_, index) => <i key={index} />)}</span>{completed && <span className="revealed-paper" aria-hidden="true"><b>mang_?_chun</b><i>朗读文件 / 01</i></span>}</button>{assisted && !completed && <p className="assisted-count">检查空框：{clicks}/3</p>}{completed ? <div className="attachment-reveal"><div><FileWarning aria-hidden="true" /><span><b>reader_01</b><small>文字层损坏 · 可打开</small></span></div><Button onClick={onOpenReader}>打开附件 <ArrowUpRight /></Button></div> : <p className="inspection-note">页面没有可见按钮。空白区域可能仍保留响应层。</p>}</section>
    </article>
  );
}

function DamagedReaderPage({ plainText, onTogglePlain }: { plainText: boolean; onTogglePlain: () => void }) {
  return (
    <article className="damaged-page">
      <header className="damaged-head"><div><CacheStamp>ARCHIVE / READER 01</CacheStamp><h1>损坏的朗读页</h1></div><Button variant="outline" onClick={onTogglePlain}>{plainText ? <EyeOff /> : <Eye />}{plainText ? "返回损坏层" : "查看纯文字"}</Button></header>
      <div className="file-name"><span>filename</span><code>mang_?_chun.reader</code></div>
      {plainText ? <section className="plain-reader"><p>［可辨认转录］</p><blockquote>“我已看不见这些春天，你当依着屐痕，给经行此地的瞽人指明路——教他平稳抵达南方的温度里。”</blockquote><p>残留索引词：看不见 / 春天 / 瞽人</p></section> : <section className="corrupted-reader" aria-label="损坏文字；可使用纯文字按钮读取同等线索"><p><span>说：</span>“我已看<span className="void-word">不见</span>这些春天你当</p><p className="shift-one">依着屐痕给经行此地的<span>瞽人</span>指明路</p><p className="noise">▒▒ 教他平稳抵达 南方的温度里 乱码_17%_▒▒▒</p><p className="shift-two">还要嘱咐他遇着僧众放生的蛇 便避着离去</p><p className="noise">00::mang / ? / chun::FILE HEADER LOST</p><p>感到让你惬意的好太阳便赞美 它如狮如虎方才醒过来</p><div className="corruption-block" aria-hidden="true">▓░▓▓░░▓░▓░░▓▓░</div><p className="last-line">给他们指一条明路：“得往春天最好的地方走……”</p></section>}
      <footer className="damaged-footer"><span>文字完整度：63%</span><span>标题字段：LOST</span><span>全文搜索：AVAILABLE</span></footer>
    </article>
  );
}

function RecoveredOnePage() {
  return (
    <article className="script-page">
      <header className="script-head"><div><ArtifactTag>已恢复 01 / 14</ArtifactTag><p>《目盲》· 序诗</p></div><span className="recovered-seal">RECOVERED</span></header>
      <div className="script-title"><span>序诗</span><h1>盲之春</h1></div>
      <section className="poem-body"><p>说：“我已看不见这些春天你当<br />依着屐痕给经行此地的瞽人指明路<br />——教他平稳抵达南方的温度里”</p><p>还要嘱咐他遇着僧众放生的蛇<br />便避着离去遇着冬眠的兽<br />便停着听沉而紧的呼噜</p><p>感到让你惬意的好太阳便赞美<br />它如狮如虎方才醒过来<br />鬃毛含着白光可天底下真有俗套的肖像会把它画成狮</p><p>世人有意目睹这狮与斑蟒的搏击<br />你去扑它吧，我们大伙的好太阳<br />就算扑了个空也可以死在船道边</p><p>瞎！辨或辨不出它都得是些什么<br />是春天的兽、农人药死的耗子<br />给他们指一条明路：“得往春天<br />最好的地方走，之后退出一个完整。”</p></section>
      <footer className="script-footer"><div><span>文件标签</span><button type="button">憎恶</button></div><div><span>后台残留分类</span><code>社 / voice_01</code></div><p>下一份朗读文件与一个同名组织共享索引。</p></footer>
    </article>
  );
}

function HistoryPage({ roleGlitch }: { roleGlitch: boolean }) {
  return (
    <article className="history-page">
      <header className="history-head"><div><p className="section-kicker">旧社团档案 · 组织 / 朗读同名</p><h1>憎恶社</h1><p>一份从现代目录中消失的画社年表，和第二份朗读文件叠在了一起。</p></div><span className="archive-year">20— / 杭州</span></header>
      <section className="history-layout"><div className="timeline"><div className="timeline-item"><span>成立</span><div><b>创办人：杜南阳</b><p>画社以人物、静物练习与集体采风开始活动。</p></div></div><div className="timeline-item"><span>{roleGlitch ? "声部" : "成员"}</span><div><b>杜南阳 · 徐惠 · 刑万</b><p>旧名单和现代成员索引无法完全互相对应。</p></div></div><div className="timeline-item"><span>状态</span><div><b>停止公开活动</b><p>关闭时间与原因字段均为空。</p></div></div></div><aside className="name-card"><span>下一人物索引</span><h2>杜南阳</h2><p>现代成员目录：查无此人</p><code>301 → /members/du＿lin</code></aside></section>
      <section className="script-two" id="script-02"><header><ArtifactTag>已恢复 02 / 14</ArtifactTag><span>瞽人篇 · 1.1</span></header><h2>憎恶社 <small>（杜万琳）</small></h2><div className="script-two-copy"><p>“我听见有人在讲他的画社<br />他的艺术<br />他的徐惠”</p><p>告诉我你对那些旅游地区布置类景色感到烦厌<br />这周末，带你去做艺术采风。<br />画静物——静物你懂吧？</p><p>谁受“憎恶”的启发呢？<br />在杭州喝到干呕，玻璃渣扎破手掌<br />根丛丛地涌血。</p><p>你说：现在画吧，画彼此<br />思多愁苦、呆滞的神色。<br />直到把彼此描成一对好看的词。</p></div></section>
      <section className="prototype-end"><span>第一段完成</span><div><h2>下一条搜索词已经出现。</h2><p>搜索“杜南阳”可确认入口；人物页与后续死亡档案将在完整版继续开放。</p></div></section>
    </article>
  );
}
