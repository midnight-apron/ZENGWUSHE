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
  ArrowLeft,
  ArrowRight,
  BookOpenText,
  Check,
  ChevronRight,
  CircleHelp,
  FileArchive,
  FileAudio,
  FileLock2,
  FolderLock,
  History,
  Home,
  Maximize2,
  Minus,
  MonitorCog,
  Pause,
  Play,
  RotateCcw,
  Search,
  Settings2,
  Trash2,
  Upload,
  X,
} from "lucide-react";
import { WeddingPhotoPuzzle, FamilyPhoto, INITIAL_WEDDING_TILES, isWeddingPhotoComplete } from "../archive-photo-interactions";
import { RentedRoom } from "../rented-room";
import { StoneInspection, inspectStoneOpening } from "../stone-inspection";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  BROWSER_NODES,
  DEFAULT_V2_SAVE,
  EVIDENCE_CLAIMS,
  HINTS,
  PROLOGUE,
  RECORDINGS,
  STORY_BIBLE,
  TRASH_FILES,
  V2_STORAGE_KEY,
  hasAll,
  searchNodes,
  type AppId,
  type BrowserNode,
  type V2Save,
} from "./data";
import styles from "./v2-game.module.css";

const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

type WindowState = Record<AppId, { open: boolean; minimized: boolean; z: number }>;

const INITIAL_WINDOWS: WindowState = {
  browser: { open: false, minimized: false, z: 1 },
  trash: { open: false, minimized: false, z: 2 },
  audio: { open: false, minimized: false, z: 3 },
  vault: { open: false, minimized: false, z: 4 },
};

const APP_META: Record<AppId, { label: string; subtitle: string; icon: typeof Search }> = {
  browser: { label: "浏览器", subtitle: "公开网页与搜索", icon: Search },
  trash: { label: "回收站", subtitle: "删除文件与恢复", icon: Trash2 },
  audio: { label: "录音文件", subtitle: "逐字稿与证言", icon: FileAudio },
  vault: { label: "上锁文件夹", subtitle: "等待三项验证", icon: FolderLock },
};

function unique(values: string[]) {
  return Array.from(new Set(values));
}

function asset(path: string) {
  return `${BASE_PATH}${path}`;
}

function safeLoad(): V2Save {
  if (typeof window === "undefined") return DEFAULT_V2_SAVE;
  try {
    const parsed = JSON.parse(window.localStorage.getItem(V2_STORAGE_KEY) || "null") as Partial<V2Save> | null;
    if (!parsed || parsed.schemaVersion !== 2) {
      const old = JSON.parse(window.localStorage.getItem("zengwu-she-prototype-v1") || "null") as { settings?: Partial<V2Save["settings"]>; openingSeen?: boolean } | null;
      return {
        ...DEFAULT_V2_SAVE,
        prologueSeen: Boolean(old?.openingSeen),
        settings: { ...DEFAULT_V2_SAVE.settings, ...(old?.settings || {}) },
      };
    }
    return {
      ...DEFAULT_V2_SAVE,
      ...parsed,
      events: Array.isArray(parsed.events) ? unique(parsed.events) : [],
      visited: Array.isArray(parsed.visited) ? unique(parsed.visited) : [],
      readItems: Array.isArray(parsed.readItems) ? unique(parsed.readItems) : [],
      recovered: Array.isArray(parsed.recovered) ? unique(parsed.recovered) : [],
      searchHistory: Array.isArray(parsed.searchHistory) ? parsed.searchHistory.slice(0, 50) : DEFAULT_V2_SAVE.searchHistory,
      settings: { ...DEFAULT_V2_SAVE.settings, ...(parsed.settings || {}) },
    };
  } catch {
    return DEFAULT_V2_SAVE;
  }
}

function AppIcon({ id, isNew, onOpen }: { id: AppId; isNew: boolean; onOpen: (id: AppId) => void }) {
  const meta = APP_META[id];
  const Icon = meta.icon;
  return (
    <button className={styles.desktopIcon} type="button" onDoubleClick={() => onOpen(id)} onClick={() => onOpen(id)}>
      <span className={styles.iconTile}><Icon aria-hidden="true" /></span>
      <span><b>{meta.label}</b><small>{meta.subtitle}</small></span>
      {isNew ? <i>NEW</i> : null}
    </button>
  );
}

function AppWindow({ id, state, active, onFocus, onMinimize, onClose, children }: {
  id: AppId;
  state: WindowState[AppId];
  active: boolean;
  onFocus: () => void;
  onMinimize: () => void;
  onClose: () => void;
  children: ReactNode;
}) {
  const meta = APP_META[id];
  if (!state.open || state.minimized) return null;
  return (
    <section
      className={`${styles.appWindow} ${styles[`window_${id}`]} ${active ? styles.activeWindow : ""}`}
      style={{ zIndex: state.z }}
      onPointerDown={onFocus}
      aria-label={meta.label}
    >
      <header className={styles.windowBar}>
        <div><meta.icon aria-hidden="true" /><b>{meta.label}</b><span>DUCHE-PC / LOCAL</span></div>
        <nav aria-label={`${meta.label}窗口控制`}>
          <button type="button" onClick={onMinimize} aria-label={`最小化${meta.label}`}><Minus /></button>
          <button type="button" disabled aria-label="窗口尺寸固定"><Maximize2 /></button>
          <button type="button" onClick={onClose} aria-label={`关闭${meta.label}`}><X /></button>
        </nav>
      </header>
      <div className={styles.windowBody}>{children}</div>
    </section>
  );
}

function EvidenceChoice({ title, options, correct, ready, completed, onCorrect }: {
  title: string;
  options: string[];
  correct: number;
  ready: boolean;
  completed: boolean;
  onCorrect: () => void;
}) {
  const [note, setNote] = useState("");
  return (
    <section className={styles.choiceBlock}>
      <h3>{title}</h3>
      {!ready ? <p>先打开上方两类材料，完成交叉核对。</p> : null}
      <div>
        {options.map((option, index) => (
          <button
            type="button"
            key={option}
            disabled={!ready || completed}
            className={completed && index === correct ? styles.correctChoice : ""}
            onClick={() => {
              if (index === correct) {
                setNote("这项判断已写入证据图。");
                onCorrect();
              } else {
                setNote("这项说法不能同时解释现有材料。请重新核对。 ");
              }
            }}
          >
            {completed && index === correct ? <Check aria-hidden="true" /> : null}{option}
          </button>
        ))}
      </div>
      <p role="status">{note}</p>
    </section>
  );
}

export function V2Game() {
  const [save, setSave] = useState<V2Save>(DEFAULT_V2_SAVE);
  const [ready, setReady] = useState(false);
  const [prologueStep, setPrologueStep] = useState(0);
  const [windows, setWindows] = useState<WindowState>(INITIAL_WINDOWS);
  const [activeApp, setActiveApp] = useState<AppId | null>(null);
  const [zCounter, setZCounter] = useState(5);
  const [browserTrail, setBrowserTrail] = useState<string[]>(["home"]);
  const [browserIndex, setBrowserIndex] = useState(0);
  const [query, setQuery] = useState("");
  const [selectedTrash, setSelectedTrash] = useState<string | null>(null);
  const [selectedRecording, setSelectedRecording] = useState<string | null>(null);
  const [playingRecording, setPlayingRecording] = useState<string | null>(null);
  const [playback, setPlayback] = useState<Record<string, number>>({});
  const [ledgerRecipient, setLedgerRecipient] = useState("");
  const [ledgerCode, setLedgerCode] = useState("");
  const [ledgerNote, setLedgerNote] = useState("");
  const [weddingTiles, setWeddingTiles] = useState(INITIAL_WEDDING_TILES);
  const [wangDocs, setWangDocs] = useState<string[]>([]);
  const [lixiangDocs, setLixiangDocs] = useState<string[]>([]);
  const [stoneOpenings, setStoneOpenings] = useState(0);
  const [editorUser, setEditorUser] = useState("");
  const [editorPassword, setEditorPassword] = useState("");
  const [editorNote, setEditorNote] = useState("");
  const [hintOpen, setHintOpen] = useState(false);
  const [hintLevel, setHintLevel] = useState(0);
  const importRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const loaded = safeLoad();
    setSave(loaded);
    if (loaded.events.includes("solved_wedding_photo")) setWeddingTiles([0, 1, 2, 3, 4, 5, 6, 7, 8]);
    if (loaded.events.includes("completed_seven_openings")) setStoneOpenings(127);
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    window.localStorage.setItem(V2_STORAGE_KEY, JSON.stringify(save));
  }, [ready, save]);

  const hasEvent = useCallback((event: string) => save.events.includes(event), [save.events]);
  const markEvent = useCallback((...events: string[]) => {
    setSave((previous) => ({ ...previous, events: unique([...previous.events, ...events]) }));
  }, []);
  const markRead = useCallback((...items: string[]) => {
    setSave((previous) => ({ ...previous, readItems: unique([...previous.readItems, ...items]) }));
  }, []);

  useEffect(() => {
    if (!playingRecording) return;
    const timer = window.setInterval(() => {
      setPlayback((previous) => {
        const next = Math.min(100, (previous[playingRecording] || 0) + 4);
        if (next === 100) {
          const recording = RECORDINGS.find((item) => item.id === playingRecording);
          if (recording) markEvent(recording.event);
          setPlayingRecording(null);
        }
        return { ...previous, [playingRecording]: next };
      });
    }, 360);
    return () => window.clearInterval(timer);
  }, [playingRecording, markEvent]);

  const focusApp = useCallback((id: AppId) => {
    setZCounter((value) => value + 1);
    setWindows((previous) => ({ ...previous, [id]: { ...previous[id], z: zCounter + 1 } }));
    setActiveApp(id);
  }, [zCounter]);

  const openApp = useCallback((id: AppId) => {
    setZCounter((value) => value + 1);
    setWindows((previous) => ({ ...previous, [id]: { open: true, minimized: false, z: zCounter + 1 } }));
    setActiveApp(id);
  }, [zCounter]);

  function minimizeApp(id: AppId) {
    setWindows((previous) => ({ ...previous, [id]: { ...previous[id], minimized: true } }));
    setActiveApp(null);
  }

  function closeApp(id: AppId) {
    setWindows((previous) => ({ ...previous, [id]: { ...previous[id], open: false, minimized: false } }));
    setActiveApp(null);
  }

  function pushBrowser(key: string) {
    setBrowserTrail((previous) => [...previous.slice(0, browserIndex + 1), key]);
    setBrowserIndex((value) => value + 1);
  }

  const currentBrowserKey = browserTrail[browserIndex] || "home";

  function runSearch(term: string) {
    const clean = term.trim();
    if (!clean) return;
    setQuery(clean);
    setSave((previous) => ({
      ...previous,
      searchHistory: [
        { term: clean, searchedAt: Date.now() },
        ...previous.searchHistory.filter((item) => item.term !== clean),
      ].slice(0, 50),
    }));
    pushBrowser(`search:${clean}`);
  }

  function openNode(node: BrowserNode) {
    if (!hasAll(save.events, node.requires)) return;
    pushBrowser(`node:${node.id}`);
    setSave((previous) => ({ ...previous, visited: unique([...previous.visited, node.id]) }));
    if (node.discoverEvent) markEvent(node.discoverEvent);
  }

  function openBrowserNode(id: string) {
    const node = BROWSER_NODES.find((item) => item.id === id);
    if (!node || !hasAll(save.events, node.requires)) return;
    openApp("browser");
    openNode(node);
  }

  function getSearchStatus(term: string) {
    const nodes = searchNodes(term);
    if (!nodes.length) return "未命中";
    return nodes.some((node) => hasAll(save.events, node.requires)) ? "有效" : "待核验";
  }

  const currentHint = useMemo(() => HINTS.find((hint) => !hint.done.every(hasEvent)) || HINTS[HINTS.length - 1], [hasEvent]);
  useEffect(() => setHintLevel(0), [currentHint.id]);

  const vaultSlots = [
    hasEvent("verified_wang_poison") && hasEvent("verified_wang_staging"),
    hasEvent("recovered_ledger_mail") && hasEvent("verified_lixiang_homicide"),
    hasEvent("heard_duwanlin_confession"),
  ];
  const vaultReady = vaultSlots.every(Boolean);

  const newState = {
    browser: BROWSER_NODES.some((node) => hasAll(save.events, node.requires) && !save.visited.includes(node.id) && node.requires?.length),
    trash: TRASH_FILES.some((file) => hasAll(save.events, file.requires) && !save.recovered.includes(file.id)),
    audio: RECORDINGS.some((recording) => hasAll(save.events, recording.requires) && !hasEvent(recording.event)),
    vault: vaultReady && !hasEvent("unlocked_final_folder"),
  };

  if (!ready) return <main className={styles.loading}>正在读取本地备份……</main>;

  if (!save.prologueSeen) {
    return (
      <main className={`${styles.prologue} ${save.settings.reducedMotion ? styles.reduceMotion : ""}`}>
        {prologueStep === 0 ? (
          <button type="button" onClick={() => setPrologueStep(1)}>
            <p>{PROLOGUE.source}</p><cite>——{PROLOGUE.citation}</cite><span>点击继续</span>
          </button>
        ) : (
          <button type="button" onClick={() => setSave((previous) => ({ ...previous, prologueSeen: true }))}>
            <strong>{PROLOGUE.dedication}</strong><span>进入旧电脑</span>
          </button>
        )}
      </main>
    );
  }

  return (
    <main
      className={`${styles.desktop} ${save.settings.reducedMotion ? styles.reduceMotion : ""} ${save.settings.reducedFlashes ? styles.reduceFlashes : ""}`}
      style={{ fontSize: `${save.settings.textScale}%` }}
    >
      <a href="#v2-desktop-icons" className={styles.skipLink}>跳到桌面应用</a>
      <div className={styles.desktopTexture} aria-hidden="true" />
      <header className={styles.desktopHeader}>
        <div><span>DUCHE-PC</span><b>资料恢复终端</b></div>
        <time suppressHydrationWarning>{new Date().toLocaleDateString("zh-CN", { year: "numeric", month: "2-digit", day: "2-digit" })}</time>
      </header>

      <section id="v2-desktop-icons" className={styles.desktopIcons} aria-label="桌面应用">
        {(Object.keys(APP_META) as AppId[]).map((id) => <AppIcon key={id} id={id} isNew={newState[id]} onOpen={openApp} />)}
      </section>

      <section className={styles.windowLayer} aria-label="已打开的应用">
        {(Object.keys(APP_META) as AppId[]).map((id) => (
          <AppWindow
            key={id}
            id={id}
            state={windows[id]}
            active={activeApp === id}
            onFocus={() => focusApp(id)}
            onMinimize={() => minimizeApp(id)}
            onClose={() => closeApp(id)}
          >
            {id === "browser" ? renderBrowser() : null}
            {id === "trash" ? renderTrash() : null}
            {id === "audio" ? renderAudio() : null}
            {id === "vault" ? renderVault() : null}
          </AppWindow>
        ))}
      </section>

      <footer className={styles.taskbar}>
        <button type="button" className={styles.homeButton} onClick={() => setActiveApp(null)} aria-label="返回桌面"><Home /></button>
        <nav aria-label="应用切换器">
          {(Object.keys(APP_META) as AppId[]).map((id) => {
            const Icon = APP_META[id].icon;
            return <button key={id} type="button" className={windows[id].open ? styles.running : ""} onClick={() => openApp(id)} aria-label={`打开${APP_META[id].label}`}><Icon />{newState[id] ? <i>NEW</i> : null}</button>;
          })}
        </nav>
        <div className={styles.taskTools}>
          <button type="button" onClick={() => setHintOpen(true)} aria-label="打开调查提示"><CircleHelp /></button>
          {renderSettings()}
        </div>
      </footer>

      <Dialog open={hintOpen} onOpenChange={setHintOpen}>
        <DialogContent className={styles.dialog}>
          <DialogHeader><DialogTitle>当前调查目标</DialogTitle><DialogDescription>提示只跟随尚未完成的事实动作，不会在旧页面重复弹出。</DialogDescription></DialogHeader>
          <div className={styles.hintCard}><span>提示 {hintLevel + 1}/3</span><p>{currentHint.levels[hintLevel]}</p></div>
          <Button variant="outline" disabled={hintLevel === 2} onClick={() => setHintLevel((value) => Math.min(2, value + 1))}>{hintLevel === 2 ? "已显示完整提示" : "再给我一点提示"}</Button>
        </DialogContent>
      </Dialog>
    </main>
  );

  function renderBrowser() {
    let content: ReactNode;
    if (currentBrowserKey === "home") content = <BrowserHome />;
    else if (currentBrowserKey.startsWith("search:")) content = <BrowserResults term={currentBrowserKey.slice(7)} />;
    else {
      const node = BROWSER_NODES.find((item) => item.id === currentBrowserKey.slice(5));
      content = node ? <BrowserNodePage node={node} /> : <BrowserHome />;
    }
    return (
      <div className={styles.browserApp}>
        <header className={styles.browserChrome}>
          <nav aria-label="浏览器导航">
            <button type="button" aria-label="后退" disabled={browserIndex === 0} onClick={() => setBrowserIndex((value) => Math.max(0, value - 1))}><ArrowLeft /></button>
            <button type="button" aria-label="前进" disabled={browserIndex >= browserTrail.length - 1} onClick={() => setBrowserIndex((value) => Math.min(browserTrail.length - 1, value + 1))}><ArrowRight /></button>
            <button type="button" aria-label="浏览器首页" onClick={() => pushBrowser("home")}><Home /></button>
          </nav>
          <span className={styles.addressBar}>local://duche-backup/{currentBrowserKey.replace(":", "/")}</span>
          <Dialog>
            <DialogTrigger asChild><button type="button" aria-label="搜索历史"><History /></button></DialogTrigger>
            <DialogContent className={styles.dialog}>
              <DialogHeader><DialogTitle>搜索历史</DialogTitle><DialogDescription>点击任一词，按当前权限重新查询。状态会随调查进度更新。</DialogDescription></DialogHeader>
              <ol className={styles.historyList}>
                {save.searchHistory.map((entry) => <li key={`${entry.term}-${entry.searchedAt}`}><button type="button" onClick={() => runSearch(entry.term)}><span>{entry.term}</span><b data-status={getSearchStatus(entry.term)}>{getSearchStatus(entry.term)}</b></button></li>)}
              </ol>
            </DialogContent>
          </Dialog>
        </header>
        <div className={styles.browserViewport}>{content}</div>
      </div>
    );
  }

  function BrowserHome() {
    return (
      <section className={styles.searchHome}>
        <div className={styles.browserBrand}><span>复</span><b>旧页检索</b><small>公开网页与本地缓存</small></div>
        <SearchForm />
        <div className={styles.initialHistory}>
          <p>这台设备最后查询</p>
          {save.searchHistory.filter((item) => ["赭红门展览", "寿享陵园"].includes(item.term)).map((item) => <button type="button" key={item.term} onClick={() => runSearch(item.term)}>{item.term}<ChevronRight /></button>)}
        </div>
      </section>
    );
  }

  function SearchForm() {
    return (
      <form className={styles.searchForm} onSubmit={(event: FormEvent) => { event.preventDefault(); runSearch(query); }} role="search">
        <Search aria-hidden="true" />
        <label className="sr-only" htmlFor="v2-search">检索公开网页与本地缓存</label>
        <input id="v2-search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="输入人名、地点、作品或档案字段" autoComplete="off" />
        <button type="submit">检索</button>
      </form>
    );
  }

  function BrowserResults({ term }: { term: string }) {
    const matches = searchNodes(term);
    return (
      <section className={styles.resultsPage}>
        <SearchForm />
        <header><span>SEARCH / {term}</span><h1>{matches.length ? `${matches.length} 条相关记录` : "没有命中"}</h1><p>只显示当前权限可读的摘要；尚未开放的结果不会泄露正文。</p></header>
        <div className={styles.resultList}>
          {matches.map((node) => {
            const allowed = hasAll(save.events, node.requires);
            const isNew = allowed && !save.visited.includes(node.id);
            return (
              <button type="button" key={node.id} disabled={!allowed} onClick={() => openNode(node)}>
                <span>{node.kind}{isNew ? <i>NEW</i> : null}</span>
                <strong>{allowed ? node.title : node.title.replace(/[\u4e00-\u9fff]/g, "□")}</strong>
                <p>{allowed ? node.summary : node.lockedHint}</p>
                <b>{allowed ? "打开记录" : "尚未获得读取权限"}<ChevronRight /></b>
              </button>
            );
          })}
          {!matches.length ? <div className={styles.emptyState}><span>∅</span><p>没有找到相关记录。可尝试材料里出现的完整人名、地点或档案字段。</p></div> : null}
        </div>
      </section>
    );
  }

  function BrowserNodePage({ node }: { node: BrowserNode }) {
    return (
      <article className={styles.nodePage}>
        <header><span>{node.kind}</span><h1>{node.title}</h1><p>{node.summary}</p></header>
        {renderNodeBody(node.id)}
      </article>
    );
  }

  function renderNodeBody(id: string) {
    const poisonRead = wangDocs.includes("poison");
    const sceneRead = wangDocs.includes("scene");
    const forensic = lixiangDocs.includes("forensic");
    const site = lixiangDocs.includes("site");
    const ledger = lixiangDocs.includes("ledger");
    switch (id) {
      case "exhibition":
        return <><figure className={styles.heroFigure}><img src={asset("/gallery/zhuhongmen-hall.webp")} alt="赭红门展览主厅，墙面与展品处于闭馆后的昏暗光线中" /><figcaption>展品编号 A-07 在闭馆复核中无法确认位置。</figcaption></figure><div className={styles.copyGrid}><section><h2>访客意见 04</h2><p>葛东平反复说，西南角本应挂着他那幅《白芍肉》。工作人员只在撤回登记里找到一处姓名涂改。</p></section><section><h2>联合主办</h2><p>憎恶社 · 荷潜艇出版社 · 阔南地方艺术档案室 · 航船诗歌社</p></section></div></>;
      case "publisher":
        return <><div className={styles.publisherMark}>荷<br />潜<br />艇</div><div className={styles.copyGrid}><section><h2>资料恢复项目</h2><p>出版社受托整理杜彻旧电脑备份。损坏书信的收件账号仍写作 <code>editor_ys</code>，但口令只在出版物版权页留下组合规则。</p></section><section><h2>旧版缓存</h2><p>李司贰致叶是的一封信提到《玛赫的厨房》与“憎恶社”并非完全独立的两个世界。</p></section></div></>;
      case "ge-dongping":
        return <><figure className={styles.archiveFigure}><img src={asset("/archive/ge-dongping-figure.webp")} alt="葛东平人物档案附图" /><figcaption>人物附图 / 年份不详</figcaption></figure><blockquote>葛东平赤着上身，冻得皮肤发红。他拍着胸口说：“我自顾。”冬天把其余的话都咽了回去。</blockquote></>;
      case "xu-hui":
        return <WeddingPhotoPuzzle image={asset("/archive/xu-hui-wedding.webp")} tiles={weddingTiles} solved={hasEvent("solved_wedding_photo")} onChange={(tiles) => { setWeddingTiles(tiles); if (isWeddingPhotoComplete(tiles)) markEvent("solved_wedding_photo"); }} />;
      case "society":
        return <><figure className={styles.archiveFigure}><img src={asset("/archive/zengwu-early-group.webp")} alt="泛黄的憎恶社早期成员合照，人物面容已经模糊" /><figcaption>{hasEvent("society_members_revealed") ? "背注已恢复：方晚、杜南阳、徐惠、邢万、王克定" : "合照背注缺损：方晚、王克定与另外三名成员"}</figcaption></figure><p>{hasEvent("society_members_revealed") ? "这次回访加载了补全的成员图层。" : "旧站没有列出全部成员；其中一人的个人页可能保留返回这张合照的链接。"}</p></>;
      case "wang-keding":
        return <><div className={styles.personFacts}><dl><dt>身份</dt><dd>憎恶社早期成员</dd><dt>个人状况</dt><dd>长期存在精神问题</dd><dt>艺术观</dt><dd>将艺术纯粹性视作生命原则，带有殉道意识</dd><dt>公开死因</dt><dd>投河自杀</dd></dl></div><button className={styles.archiveAction} type="button" onClick={() => { markEvent("society_members_revealed"); openBrowserNode("society"); }}>返回早期成员缓存，核对合照背注<ChevronRight /></button><p className={styles.fieldNote}>附档字段：死亡地点与尸检、毒检记录存在不一致。</p></>;
      case "xing-wan":
        return <><div className={styles.personFacts}><dl><dt>身份</dt><dd>憎恶社早期成员</dd><dt>关系</dt><dd>杜莉香后来的丈夫</dd><dt>关联地点</dt><dd>西门车站附近廉租房</dd></dl></div><RentedRoom image={asset("/archive/rented-room.webp")} drumImage={asset("/archive/pellet-drum-detail.webp")} drumRead={hasEvent("found_pellet_drum")} onReadDrum={() => markEvent("found_pellet_drum", "read_room_drum")} onOpenFamily={() => openBrowserNode("du-che")} /></>;
      case "anonymous-xing":
        return <div className={styles.documentSheet}><span>他山晚讯 · 早期短讯</span><h2>公墓项目涉案人员被依法调查</h2><p>项目承办人员刑某因财务问题被带走调查。报道未公开其完整姓名，也没有说明另一名失踪者的最终情况。</p></div>;
      case "wang-autopsy":
        return <><div className={styles.evidenceTabs}><button type="button" className={poisonRead ? styles.readEvidence : ""} onClick={() => setWangDocs((items) => unique([...items, "poison"]))}><span>毒物与肺部征象</span><b>打开摘要</b></button><button type="button" className={sceneRead ? styles.readEvidence : ""} onClick={() => setWangDocs((items) => unique([...items, "scene"]))}><span>绳结与入水现场</span><b>打开摘要</b></button></div>{poisonRead ? <div className={styles.documentSheet}><h2>毒物检验摘要</h2><p>胃内容物与血样检出致死剂量毒物。死亡时间早于入水时间；肺部未见支持生前溺水的完整征象。</p></div> : null}{sceneRead ? <div className={styles.documentSheet}><h2>现场勘验摘要</h2><p>双手反绑、石块坠附与拖拽擦痕均形成于死亡后。尸体由室内搬运至河道，投河现场不能解释真实死因。</p></div> : null}<EvidenceChoice title="判断一：王克定真实死因" options={["投河自杀", "服毒自杀", "他人投毒"]} correct={1} ready={poisonRead && sceneRead} completed={hasEvent("verified_wang_poison")} onCorrect={() => markEvent("verified_wang_poison")} /><EvidenceChoice title="判断二：河中现场" options={["与死亡过程一致", "属于死后伪造", "无法判断"]} correct={1} ready={poisonRead && sceneRead} completed={hasEvent("verified_wang_staging")} onCorrect={() => markEvent("verified_wang_staging")} /></>;
      case "du-che":
        return <><FamilyPhoto front={asset("/archive/du-che-childhood.webp")} back={asset("/archive/du-che-photo-back.webp")} onRead={() => markEvent("read_duche_photo_back")} /><div className={styles.copyGrid}><section><h2>家庭关系</h2><p>父亲杜万琳，母亲徐惠。照片背字只写了“姑姑莉香”，完整姓名需由后续档案确认。</p></section><section><h2>文学索引</h2><p>《刍味》朗读文件与一页被删除的医学修订相连。另一条编辑记录来自荷潜艇出版社。</p></section></div></>;
      case "evening-news":
        return <><figure className={styles.posterFigure}><img src={asset("/archive/cemetery-newspaper.webp")} alt="他山晚讯旧报海报：公墓改建项目被调查，涉案人员以匿名方式出现" /><figcaption>原刊扫描，可放大查看</figcaption></figure><p>这张海报只保留当年的公开说法，不能单独证明任何人的死因。</p></>;
      case "du-lixiang":
        return <><div className={styles.personFacts}><dl><dt>姓名</dt><dd>杜莉香</dd><dt>家庭</dt><dd>杜万琳的堂妹</dd><dt>婚姻</dt><dd>邢万的妻子</dd><dt>项目职务</dt><dd>财务</dd><dt>公开死因</dt><dd>意外溺亡</dd></dl></div><aside className={styles.disputed}><b>公开记录存在缺口</b><p>没有遗体告别仪式、失踪时间和财务举报未被写入同一份公开档案。</p></aside></>;
      case "cremation-form":
        return <><div className={styles.formSheet}><span>他山地方公墓 / 遗体处理手续</span><h2>焚烧签字单</h2><dl><dt>申请人</dt><dd>杜万琳</dd><dt>死者</dt><dd>杜莉香</dd><dt>遗体</dt><dd>未到院</dd><dt>代签</dt><dd>方＿</dd><dt>后补收件</dt><dd>葬礼后第三日</dd><dt>项目编号</dt><dd>SX-2000-17</dd></dl></div><button type="button" className={styles.archiveAction} onClick={() => runSearch("方晚")}>以当前进度重新检索代签人<ChevronRight /></button></>;
      case "fang-wan":
        return <><div className={styles.personFacts}><dl><dt>关系</dt><dd>杜南阳同乡与旧友</dd><dt>与杜莉香</dt><dd>朋友；带有轻微、未越界的爱意</dd><dt>案件位置</dt><dd>告别仪式后收到杜莉香生前寄出的材料</dd></dl></div>{hasEvent("read_cremation_form") ? <div className={styles.documentSheet}><span>新增结果 / 收件记录</span><p>信封邮戳早于失踪时间。方晚签收时，杜莉香的无遗体告别仪式已经结束。</p></div> : null} <figure className={styles.archiveFigure}><img src={asset("/archive/dongxing-peter-2000.webp")} alt="千禧年前后的川渝店铺东兴彼得旧照" /><figcaption>方晚留存的城市旧照 / 东兴彼得</figcaption></figure></>;
      case "stone-head":
        return <StoneInspection openings={stoneOpenings} completed={hasEvent("completed_seven_openings")} reducedMotion={save.settings.reducedMotion || save.settings.reducedFlashes} cleanImage={asset("/archive/stone-head-evidence.webp")} bloodImage={asset("/archive/stone-head-evidence-blood.webp")} onInspect={(opening) => { const next = inspectStoneOpening(stoneOpenings, opening); setStoneOpenings(next); if (next === 127) window.setTimeout(() => markEvent("completed_seven_openings"), save.settings.reducedMotion ? 350 : 2200); }} onRevealComplete={() => markEvent("completed_seven_openings")} />;
      case "phoenix-reservoir":
        return <><div className={styles.routeMap}><span>西岩寺后山</span><i /><span>临时岔道</span><i /><span>凤凰水库</span></div><div className={styles.documentSheet}><h2>路线核对</h2><p>河流路线与王克定尸体的搬运方向有关，也靠近杜莉香后来被发现的藏尸区域。两起事件发生于不同时间，不能合并为同一死亡过程。</p></div></>;
      case "cemetery-case":
        return <><div className={styles.evidenceTabs}><button type="button" className={forensic ? styles.readEvidence : ""} onClick={() => setLixiangDocs((items) => unique([...items, "forensic"]))}><span>遗体鉴定</span><b>打开</b></button><button type="button" className={site ? styles.readEvidence : ""} onClick={() => setLixiangDocs((items) => unique([...items, "site"]))}><span>藏尸勘验</span><b>打开</b></button><button type="button" className={ledger ? styles.readEvidence : ""} onClick={() => setLixiangDocs((items) => unique([...items, "ledger"]))}><span>账目与邮戳</span><b>打开</b></button></div>{forensic ? <div className={styles.documentSheet}><h2>遗体鉴定摘要</h2><p>颈部存在持续压迫造成的损伤；肺部征象不能支持生前溺亡。死亡发生在遗体进入潮湿环境之前。</p></div> : null}{site ? <div className={styles.documentSheet}><h2>西岩寺附近勘验</h2><p>遗体被藏于寺院后山废弃区域，与公开宣称的溺水地点不符。现场有转移与遮掩痕迹。</p></div> : null}{ledger ? <div className={styles.documentSheet}><h2>财务与邮寄时间线</h2><p>杜莉香在遇害前寄出虚报账目复印件。方晚在告别仪式后收件；半个月内，邢万因挪用公款被捕。</p></div> : null}<EvidenceChoice title="判断：杜莉香真实死因" options={["意外溺亡", "遭邢万掐死", "无法由现有材料判断"]} correct={1} ready={forensic && site && ledger} completed={hasEvent("verified_lixiang_homicide")} onCorrect={() => markEvent("verified_lixiang_homicide")} /></>;
      case "shouxiang":
        return <><section className={styles.cemeterySite}><header><span>寿享陵园</span><small>SHOUXIANG MEMORIAL PARK</small></header><nav><span>园区服务</span><span>墓形展示</span><span>来园路线</span></nav><div className={styles.staffList}><h2>工作人员</h2>{["杜南阳｜项目顾问", "徐惠｜艺术事务", "邢万｜项目负责人", "杜彻｜投资人"].map((person) => <button key={person} type="button" onClick={() => person.startsWith("杜彻") && markRead("shouxiang-duche-anomaly")}>{person}{person.startsWith("杜彻") && save.readItems.includes("shouxiang-duche-anomaly") ? <span className={styles.deathWords}>去死　去死　去死　去死</span> : null}</button>)}</div></section><p className={styles.fieldNote}>旧站污染层属于异常显示，不等同于客观履历。</p></>;
      case "alzheimer":
        return <div className={styles.documentSheet}><span>医学删除页 / 标题修订</span><h2>《刍<span className={styles.struck}>味</span>胃》</h2><p>删除页列出的症状共同指向阿尔茨海默病。这一页属于文学与编辑层，不承担案件定案功能。</p></div>;
      case "editor":
        return hasEvent("editor_verified") ? <div className={styles.documentSheet}><h2>编辑缓存已解锁</h2><p>初版人物年表把元昶与左君分开记录；批注要求恢复本名并将两条记录合并。</p><button className={styles.archiveAction} type="button" onClick={() => runSearch("元昶")}>检索人物修订<ChevronRight /></button></div> : <form className={styles.loginForm} onSubmit={(event) => { event.preventDefault(); if (editorUser.trim().toLowerCase() === "editor_ys" && editorPassword.trim().toUpperCase() === "MHDCF2019") { markEvent("editor_verified"); setEditorNote("身份核验通过。"); } else setEditorNote("账号或口令与两份来源不一致。"); }}><label>账号<input value={editorUser} onChange={(event) => setEditorUser(event.target.value)} autoComplete="username" /></label><label>口令<input type="password" value={editorPassword} onChange={(event) => setEditorPassword(event.target.value)} autoComplete="current-password" /></label><button type="submit">读取编辑缓存</button><p role="status">{editorNote}</p></form>;
      case "yuanchang":
        return <><div className={styles.documentSheet}><span>人物修订 / 叶是</span><h2>元昶，即左君</h2><p>法名与本名属于同一个小说角色。文学角色与真实人物的对应关系将在最终文件夹中解释，不再使用损坏重定向把杜南阳与杜万琳简单合并。</p></div></>;
      case "shinan":
        return <ShinanArchive />;
      default:
        return <p>记录正在恢复。</p>;
    }
  }

  function renderTrash() {
    const selected = TRASH_FILES.find((file) => file.id === selectedTrash);
    return (
      <div className={styles.fileApp}>
        <aside><span>回收站</span><b>{TRASH_FILES.filter((file) => save.recovered.includes(file.id)).length} / {TRASH_FILES.length} 已恢复</b><p>删除文件不会按固定顺序出现。权限来自你已经完成的事实动作。</p></aside>
        <section>
          <div className={styles.fileList}>
            {TRASH_FILES.map((file) => {
              const allowed = hasAll(save.events, file.requires);
              const recovered = save.recovered.includes(file.id);
              return <button type="button" key={file.id} disabled={!allowed} className={selectedTrash === file.id ? styles.selectedFile : ""} onClick={() => setSelectedTrash(file.id)}><FileArchive /><span><b>{allowed ? file.title : "文件名损坏"}</b><small>{allowed ? file.meta : "继续调查以恢复文件索引"}</small></span>{recovered ? <i>已恢复</i> : null}</button>;
            })}
          </div>
          {selected ? <TrashDetail file={selected} /> : <div className={styles.emptyState}><Trash2 /><p>选择一个文件查看恢复条件。</p></div>}
        </section>
      </div>
    );
  }

  function TrashDetail({ file }: { file: (typeof TRASH_FILES)[number] }) {
    const recovered = save.recovered.includes(file.id);
    const allowed = hasAll(save.events, file.requires);
    function recover() {
      if (!allowed) return;
      setSave((previous) => ({ ...previous, recovered: unique([...previous.recovered, file.id]), events: unique([...previous.events, file.event]) }));
    }
    return <article className={styles.fileDetail}><header><span>DELETED FILE</span><h2>{file.title}</h2><p>{file.meta}</p></header>{file.id === "ledger-mail" && !recovered ? <form onSubmit={(event) => { event.preventDefault(); if (ledgerRecipient.trim() === "方晚" && ledgerCode.trim().toUpperCase() === "SX-2000-17") { recover(); setLedgerNote("附件与邮寄记录恢复完成。"); } else setLedgerNote("收件人或项目编号不能与现有材料互证。"); }} className={styles.restoreForm}><p>这份附件需要用两处材料共同核验。</p><label>收件人<input value={ledgerRecipient} onChange={(event) => setLedgerRecipient(event.target.value)} /></label><label>项目编号<input value={ledgerCode} onChange={(event) => setLedgerCode(event.target.value)} /></label><button type="submit">恢复附件</button><span role="status">{ledgerNote}</span></form> : !recovered ? <button className={styles.restoreButton} type="button" onClick={recover}>恢复到本地档案</button> : <RecoveredFile id={file.id} />}</article>;
  }

  function RecoveredFile({ id }: { id: string }) {
    if (id === "chuannan-message") return <div className={styles.documentSheet}><h3>锦蜀饭店值班短讯</h3><p>三月某夜，锦蜀饭店九点十分来了一位穿呢子大衣的年轻女人。她盯着大堂的鱼凫，说起杭州旧书店，又叫了方晚的名字。快到凌晨，她醉得厉害，店员追出去时，街上只剩月光。方晚站在门口，很久没有回身。</p></div>;
    if (id === "ledger-mail") return <div className={styles.documentSheet}><h3>寄件记录与账目附件</h3><p>寄件人：杜莉香。收件人：方晚。寄出日期早于失踪时间。附件列出寿享陵园项目虚报工程款与重复报销；项目编号 SX-2000-17。</p></div>;
    if (id === "unsent-note") return <div className={styles.documentSheet}><h3>未寄出的便笺</h3><p>“我确实想过，如果早几年说出口，会不会有另一种生活。但她把我当朋友，我也守在朋友的位置上。现在只希望这封账目能替她把话说完。”</p></div>;
    if (id === "family-photo") return <FamilyPhoto front={asset("/archive/du-che-childhood.webp")} back={asset("/archive/du-che-photo-back.webp")} onRead={() => markEvent("read_duche_photo_back")} />;
    return <div className={styles.documentSheet}><h3>网页缓存恢复完成</h3><p>他山晚讯的图像扫描已同步到浏览器搜索结果。</p><button type="button" className={styles.archiveAction} onClick={() => openBrowserNode("evening-news")}>在浏览器中打开<ChevronRight /></button></div>;
  }

  function renderAudio() {
    const selected = RECORDINGS.find((recording) => recording.id === selectedRecording);
    return <div className={styles.audioApp}><aside><span>录音文件</span><p>音频不是通关门槛。每份材料均提供逐字稿与手动核验。</p><div className={styles.audioList}>{RECORDINGS.map((recording) => { const allowed = hasAll(save.events, recording.requires); const heard = hasEvent(recording.event); return <button type="button" key={recording.id} disabled={!allowed} onClick={() => setSelectedRecording(recording.id)} className={selectedRecording === recording.id ? styles.selectedFile : ""}><FileAudio /><span><b>{allowed ? recording.title : "受限录音"}</b><small>{allowed ? recording.duration : "需要前置材料"}</small></span>{heard ? <Check /> : null}</button>; })}</div></aside><section>{selected ? <article className={styles.audioPlayer}><header><span>LOCAL AUDIO</span><h2>{selected.title}</h2><small>{selected.duration}</small></header><div className={styles.playerControls}><button type="button" aria-label={playingRecording === selected.id ? "暂停" : "播放"} onClick={() => setPlayingRecording((value) => value === selected.id ? null : selected.id)}>{playingRecording === selected.id ? <Pause /> : <Play />}</button><div><span style={{ width: `${playback[selected.id] || 0}%` }} /></div><time>{Math.round((playback[selected.id] || 0) / 100 * Number(selected.duration.split(":")[0] || 1))}:00</time></div><details open={save.settings.subtitles}><summary>逐字稿</summary><p>{selected.transcript}</p></details><button type="button" className={styles.verifyButton} onClick={() => { markEvent(selected.event); markRead(`audio:${selected.id}`); }}>已读完逐字稿，标记核验</button></article> : <div className={styles.emptyState}><FileAudio /><p>选择录音；也可以只阅读逐字稿。</p></div>}</section></div>;
  }

  function renderVault() {
    const unlocked = hasEvent("unlocked_final_folder");
    if (!unlocked) return <section className={styles.vaultLocked}><FileLock2 /><span>FINAL_ARCHIVE</span><h1>文件夹已加密</h1><p>三个验证槽位分别来自不同应用。槽位只显示完成状态，不提前透露答案。</p><div className={styles.vaultSlots}>{vaultSlots.map((complete, index) => <div key={index} className={complete ? styles.slotComplete : ""}><span>验证片段 {String.fromCharCode(65 + index)}</span><b>{complete ? "已核验" : "等待材料"}</b></div>)}</div><button type="button" disabled={!vaultReady} onClick={() => markEvent("unlocked_final_folder")}>{vaultReady ? "拼合验证片段并打开" : "尚缺验证材料"}</button></section>;
    return <section className={styles.vaultOpen}><header><span>FINAL_ARCHIVE / VERIFIED</span><h1>杜彻整理的数字档案</h1><p>案件证据、角色映射与文学文本依次开放。案件结论不依赖文学隐喻。</p></header><div className={styles.finalEvidence}>{EVIDENCE_CLAIMS.map((item) => <article key={item.id}><span>{item.id}</span><h2>{item.claim}</h2><ul>{item.sources.map((source) => <li key={source}>{source}</li>)}</ul></article>)}</div><section className={styles.finalNarrative}><h2>两起死亡与责任边界</h2><p>{STORY_BIBLE.conclusions.wang}</p><p>{STORY_BIBLE.conclusions.lixiang}</p><p>{STORY_BIBLE.conclusions.nanyang}</p><p>{STORY_BIBLE.conclusions.fang}</p></section><section className={styles.roleMap}><h2>文学角色与真实原型</h2><dl><dt>表层文学世界</dt><dd>杜南阳、徐惠、方晚、邢万、王克定、杜莉香</dd><dt>里层档案世界</dt><dd>杜万琳是杜南阳的创作原型；徐惠与杜彻跨越两层。二者不是简单别名或损坏重定向。</dd><dt>杜彻为何持有材料</dt><dd>父亲去世后整理手稿、搜集案件细节，并向方晚核实往事。</dd></dl></section><section className={styles.literatureShelf}><h2>文学文本</h2><p>《走地国记》保持完整原稿，仅承担杜南阳的罪疚与梦境层；案件事实由上方证据包负责。</p><a href={asset("/archive/scattered/zoudi-guoji.html")} target="_blank" rel="noreferrer"><BookOpenText />阅读《走地国记》完整原文</a><a href={asset("/publications/juroutuanfei/")} target="_blank" rel="noreferrer"><BookOpenText />打开《句肉抟飞》五章连载</a></section>{save.ending ? <EndingCard ending={save.ending} /> : <EndingChoice />}</section>;
  }

  function EndingChoice() {
    const choices = [
      { id: "publish-all" as const, title: "公开全部材料", copy: "案件证据、家庭材料、文学手稿与角色映射一并公开。" },
      { id: "case-only" as const, title: "只提交案件证据", copy: "提交能够定案的法医学、账目、邮寄、供述与判决材料，保留私人手稿。" },
      { id: "close" as const, title: "关闭文件夹", copy: "不对外提交；文件仍保存在这台设备的本地存档中。" },
    ];
    return <section className={styles.endingChoices}><h2>决定文件去向</h2><p>三项选择建立在同一事实真相上，只改变公开范围，不进行道德评分。</p><div>{choices.map((choice) => <button type="button" key={choice.id} onClick={() => setSave((previous) => ({ ...previous, ending: choice.id }))}><b>{choice.title}</b><span>{choice.copy}</span><ChevronRight /></button>)}</div></section>;
  }

  function EndingCard({ ending }: { ending: NonNullable<V2Save["ending"]> }) {
    const copy = {
      "publish-all": ["全部材料已公开", "档案离开了杜彻的旧电脑。证据与手稿同时进入公共视野，文学不再遮蔽案件，也无法再被当作纯粹私语。"],
      "case-only": ["案件证据已提交", "足以定案的材料被提交，私人手稿与未寄出的便笺留在本地。事实获得出口，梦仍属于写梦的人。"],
      close: ["文件夹已关闭", "你没有改变文件去向。事实仍然成立，只是暂时没有新的读者。旧电脑回到黑暗里，存档没有被删除。"],
    }[ending];
    return <section className={styles.endingCard}><span>ENDING / SAVED</span><h2>{copy[0]}</h2><p>{copy[1]}</p><button type="button" onClick={() => openBrowserNode("shinan")}>打开《诗喃》终场档案<ChevronRight /></button></section>;
  }

  function ShinanArchive() {
    const photos = ["01", "04", "07", "11", "15", "18"];
    return <><figure className={styles.posterFigure}><img src={asset("/archive/shinan/shinan-poster.webp")} alt="诗喃诗歌剧场演出海报" /><figcaption>最终排演档案 / 海报</figcaption></figure><section className={styles.stageText}><span>场记末页</span><h2>诗喃，正式开演</h2><p>案件与角色映射已经完成。此处的表演不会推翻前面的事实；它只让被恢复的文本重新获得声音。</p></section><div className={styles.photoGrid}>{photos.map((photo) => <img key={photo} src={asset(`/archive/shinan/activity/photo-${photo}.webp`)} alt={`诗喃活动现场照片 ${photo}`} />)}</div></>;
  }

  function renderSettings() {
    return <Dialog><DialogTrigger asChild><button type="button" aria-label="设置"><Settings2 /></button></DialogTrigger><DialogContent className={styles.dialog}><DialogHeader><DialogTitle>系统与可访问性</DialogTitle><DialogDescription>设置不会改变谜题答案。存档仅保存在当前设备。</DialogDescription></DialogHeader><label className={styles.settingRow}><span><b>字幕与逐字稿</b><small>无声音也能完成全部核验。</small></span><Switch checked={save.settings.subtitles} onCheckedChange={(checked) => setSave((previous) => ({ ...previous, settings: { ...previous.settings, subtitles: checked } }))} /></label><label className={styles.settingRow}><span><b>减少动态</b><small>缩短位移动画与渐变等待。</small></span><Switch checked={save.settings.reducedMotion} onCheckedChange={(checked) => setSave((previous) => ({ ...previous, settings: { ...previous.settings, reducedMotion: checked } }))} /></label><label className={styles.settingRow}><span><b>关闭突发闪烁</b><small>红字与渗血仍保留静态结果。</small></span><Switch checked={save.settings.reducedFlashes} onCheckedChange={(checked) => setSave((previous) => ({ ...previous, settings: { ...previous.settings, reducedFlashes: checked } }))} /></label><div className={styles.sliderRow}><span><b>音量</b><small>{save.settings.volume}%</small></span><Slider min={0} max={100} step={5} value={[save.settings.volume]} onValueChange={(value) => setSave((previous) => ({ ...previous, settings: { ...previous.settings, volume: value[0] } }))} /></div><div className={styles.sliderRow}><span><b>文字字号</b><small>{save.settings.textScale}%</small></span><Slider min={90} max={130} step={10} value={[save.settings.textScale]} onValueChange={(value) => setSave((previous) => ({ ...previous, settings: { ...previous.settings, textScale: value[0] } }))} /></div><div className={styles.settingsActions}><button type="button" onClick={() => setSave((previous) => ({ ...previous, prologueSeen: false }))}><RotateCcw />重播序幕</button><button type="button" onClick={() => { const blob = new Blob([JSON.stringify(save, null, 2)], { type: "application/json" }); const url = URL.createObjectURL(blob); const anchor = document.createElement("a"); anchor.href = url; anchor.download = "zengwu-she-v2-save.json"; anchor.click(); URL.revokeObjectURL(url); }}><FileArchive />导出存档</button><button type="button" onClick={() => importRef.current?.click()}><Upload />导入存档</button><input ref={importRef} hidden type="file" accept="application/json" onChange={(event) => { const file = event.target.files?.[0]; if (!file) return; const reader = new FileReader(); reader.onload = () => { try { const parsed = JSON.parse(String(reader.result)) as V2Save; if (parsed.schemaVersion === 2) setSave({ ...DEFAULT_V2_SAVE, ...parsed, settings: { ...DEFAULT_V2_SAVE.settings, ...parsed.settings } }); } catch { /* Invalid saves remain untouched. */ } }; reader.readAsText(file); }} /><AlertDialog><AlertDialogTrigger asChild><button type="button" className={styles.dangerAction}><Trash2 />重新开始</button></AlertDialogTrigger><AlertDialogContent><AlertDialogHeader><AlertDialogTitle>清除新版调查进度？</AlertDialogTitle><AlertDialogDescription>这会删除 V2 的事件、搜索历史、已恢复文件和结局。旧版存档不受影响。</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel>取消</AlertDialogCancel><AlertDialogAction variant="destructive" onClick={() => { window.localStorage.removeItem(V2_STORAGE_KEY); setSave(DEFAULT_V2_SAVE); setPrologueStep(0); setWindows(INITIAL_WINDOWS); }}>确认重新开始</AlertDialogAction></AlertDialogFooter></AlertDialogContent></AlertDialog></div></DialogContent></Dialog>;
  }
}
