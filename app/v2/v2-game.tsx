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
  Check,
  ChevronRight,
  CircleHelp,
  FileArchive,
  FileAudio,
  FileLock2,
  FileText,
  FolderLock,
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
  Volume2,
  Wifi,
  X,
} from "lucide-react";
import { WeddingPhotoPuzzle, FamilyPhoto, INITIAL_WEDDING_TILES, isWeddingPhotoComplete } from "../archive-photo-interactions";
import { DirectoryPage, ExhibitionPage, GalleryHomePage, GameApp, type DirectoryEntry } from "../game-app";
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
  FINAL_FOLDER_REQUIREMENTS,
  FINAL_WORD_PASSWORD,
  FINAL_WORD_URL,
  HINTS,
  PROLOGUE,
  RECORDINGS,
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
  word: { open: false, minimized: false, z: 5 },
};

const APP_META: Record<AppId, { label: string; subtitle: string; icon: typeof Search }> = {
  browser: { label: "浏览器", subtitle: "公开网页与搜索", icon: Search },
  trash: { label: "回收站", subtitle: "删除文件与恢复", icon: Trash2 },
  audio: { label: "录音文件", subtitle: "逐字稿与证言", icon: FileAudio },
  vault: { label: "上锁文件夹", subtitle: "《目盲》图像诗稿", icon: FolderLock },
  word: { label: "最终文件.doc", subtitle: "Microsoft Word", icon: FileText },
};

type GallerySection = "home" | "exhibitions" | "people" | "news" | "publications" | "about";

const GALLERY_SECTIONS: Array<{ id: GallerySection; label: string }> = [
  { id: "home", label: "首页" },
  { id: "exhibitions", label: "展览" },
  { id: "people", label: "人物" },
  { id: "news", label: "新闻" },
  { id: "publications", label: "出版物" },
  { id: "about", label: "关于" },
];

const GALLERY_DIRECTORY_IDS: Record<Exclude<GallerySection, "home" | "exhibitions">, string[]> = {
  people: ["ge-dongping", "xu-hui", "wang-keding", "xing-wan", "du-che", "du-lixiang", "fang-wan"],
  news: ["anonymous-xing", "evening-news", "wang-autopsy", "cremation-form", "stone-head", "phoenix-reservoir", "cemetery-case"],
  publications: ["publisher", "alzheimer", "editor", "yuanchang"],
  about: ["society"],
};

function mangImageSeries(prefix: string, count: number) {
  return Array.from({ length: count }, (_, index) => `/archive/mang/${prefix}-${String(index + 1).padStart(2, "0")}.webp`);
}

const MANG_IMAGE_ARCHIVE = [
  { id: "prologue", title: "序诗：盲之春", images: mangImageSeries("00-prologue", 2) },
  { id: "chapter-one", title: "瞽人篇", images: mangImageSeries("01-chapter", 1) },
  { id: "society", title: "1.1 憎恶社", images: mangImageSeries("01-01", 3) },
  { id: "fang-wan", title: "1.2 方晚", images: mangImageSeries("01-02", 3) },
  { id: "wang-keding", title: "1.3 王克定", images: mangImageSeries("01-03", 4) },
  { id: "zai-landao", title: "1.4 在蘭道", images: mangImageSeries("01-04", 1) },
  { id: "chapter-two", title: "闊南篇", images: mangImageSeries("02-chapter", 1) },
  { id: "lixiang", title: "2.1 溺水的莉香", images: mangImageSeries("02-01", 3) },
  { id: "dance", title: "2.2 舞", images: mangImageSeries("02-02", 3) },
  { id: "chapter-three", title: "浣石篇", images: mangImageSeries("03-chapter", 1) },
  { id: "confession", title: "3.1 自白", images: mangImageSeries("03-01", 2) },
  { id: "washing-stone", title: "3.2 浣石", images: mangImageSeries("03-02", 2) },
  { id: "chapter-four", title: "過曝篇", images: mangImageSeries("04-chapter", 3) },
  { id: "taste", title: "4.1 芻味", images: mangImageSeries("04-01", 2) },
  { id: "stomach", title: "4.2 芻胃", images: mangImageSeries("04-02", 2) },
  { id: "chapter-five", title: "失焦篇", images: mangImageSeries("05-chapter", 1) },
  { id: "fragments", title: "5.1 始末的碎点", images: mangImageSeries("05-01", 11) },
  { id: "wang-death", title: "5.2 王克定之死", images: mangImageSeries("05-02", 5) },
  { id: "epilogue", title: "结诗：赭紅門—點意象之歌", images: mangImageSeries("06-epilogue", 1) },
] as const;

function unique(values: string[]) {
  return Array.from(new Set(values));
}

function asset(path: string) {
  return `${BASE_PATH}${path}`;
}

function browserAddress(key: string) {
  if (key.startsWith("legacy:")) {
    const path = key.slice(7) || "/";
    return path === "/mirror/shouxiang/staff"
      ? "http://shouxiang.invalid/staff/index.htm"
      : `http://zengwushe.local${path}`;
  }
  return `local://duche-backup/${key.replace(":", "/")}`;
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
    const events = Array.isArray(parsed.events) ? unique(parsed.events) : [];
    const searchHistory = Array.isArray(parsed.searchHistory) ? parsed.searchHistory.slice(0, 50) : DEFAULT_V2_SAVE.searchHistory;
    return {
      ...DEFAULT_V2_SAVE,
      ...parsed,
      events,
      visited: Array.isArray(parsed.visited) ? unique(parsed.visited) : [],
      readItems: Array.isArray(parsed.readItems) ? unique(parsed.readItems) : [],
      recovered: Array.isArray(parsed.recovered) ? unique(parsed.recovered) : [],
      searchHistory: events.includes("recovered_ledger_mail") ? searchHistory : searchHistory.filter((entry) => entry.term !== "寿享陵园"),
      settings: { ...DEFAULT_V2_SAVE.settings, ...(parsed.settings || {}) },
    };
  } catch {
    return DEFAULT_V2_SAVE;
  }
}

function AppIcon({ id, selected, onOpen, onSelect }: { id: AppId; selected: boolean; onOpen: (id: AppId) => void; onSelect: (id: AppId) => void }) {
  const meta = APP_META[id];
  const Icon = meta.icon;
  return (
    <button
      className={`${styles.desktopIcon} ${selected ? styles.selectedDesktopIcon : ""}`}
      data-app={id}
      type="button"
      onDoubleClick={() => onOpen(id)}
      onClick={() => window.matchMedia("(pointer: coarse)").matches ? onOpen(id) : onSelect(id)}
      onKeyDown={(event) => { if (event.key === "Enter") onOpen(id); }}
    >
      <span className={styles.iconTile}><Icon aria-hidden="true" /></span>
      <span><b>{meta.label}</b><small>{meta.subtitle}</small></span>
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
      onClick={onFocus}
      aria-label={meta.label}
    >
      <header className={styles.windowBar}>
        <div><meta.icon aria-hidden="true" /><b>{meta.label}</b><span>DUCHE-PC / LOCAL</span></div>
        <nav aria-label={`${meta.label}窗口控制`}>
          <button type="button" onClick={(event) => { event.stopPropagation(); onMinimize(); }} aria-label={`最小化${meta.label}`}><Minus /></button>
          <button type="button" disabled aria-label="窗口尺寸固定"><Maximize2 /></button>
          <button type="button" onClick={(event) => { event.stopPropagation(); onClose(); }} aria-label={`关闭${meta.label}`}><X /></button>
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
  const [prologuePassword, setProloguePassword] = useState("");
  const [prologueNote, setPrologueNote] = useState("");
  const [windows, setWindows] = useState<WindowState>(INITIAL_WINDOWS);
  const [activeApp, setActiveApp] = useState<AppId | null>(null);
  const [selectedDesktopApp, setSelectedDesktopApp] = useState<AppId | null>(null);
  const [startOpen, setStartOpen] = useState(false);
  const [clock, setClock] = useState("");
  const [zCounter, setZCounter] = useState(6);
  const [browserTrail, setBrowserTrail] = useState<string[]>(["home"]);
  const [browserIndex, setBrowserIndex] = useState(0);
  const [query, setQuery] = useState("");
  const [offlineOpen, setOfflineOpen] = useState(false);
  const [frameNotice, setFrameNotice] = useState(false);
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
  const [selectedMangPoem, setSelectedMangPoem] = useState<string | null>(null);
  const [passwordTextOpen, setPasswordTextOpen] = useState(false);
  const [wordPassword, setWordPassword] = useState("");
  const [wordNote, setWordNote] = useState("");
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

  useEffect(() => {
    const updateClock = () => setClock(new Date().toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit", hour12: false }));
    updateClock();
    const timer = window.setInterval(updateClock, 30_000);
    return () => window.clearInterval(timer);
  }, []);

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
    if (activeApp === id) return;
    setZCounter((value) => value + 1);
    setWindows((previous) => ({ ...previous, [id]: { ...previous[id], z: zCounter + 1 } }));
    setActiveApp(id);
  }, [activeApp, zCounter]);

  const openApp = useCallback((id: AppId) => {
    setZCounter((value) => value + 1);
    setWindows((previous) => ({ ...previous, [id]: { open: true, minimized: false, z: zCounter + 1 } }));
    setActiveApp(id);
    setSelectedDesktopApp(id);
    setStartOpen(false);
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

  function runGallerySearch(term: string) {
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
    pushBrowser(`gallery-search:${clean}`);
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

  const currentHint = useMemo(() => HINTS.find((hint) => !hint.done.every(hasEvent)) || HINTS[HINTS.length - 1], [hasEvent]);
  useEffect(() => setHintLevel(0), [currentHint.id]);

  const finalFolderReady = FINAL_FOLDER_REQUIREMENTS.every(hasEvent);

  useEffect(() => {
    if (!ready || !finalFolderReady || hasEvent("unlocked_final_folder")) return;
    markEvent("unlocked_final_folder");
  }, [finalFolderReady, hasEvent, markEvent, ready]);

  useEffect(() => {
    if (activeApp !== "vault" || !hasEvent("unlocked_final_folder") || hasEvent("opened_mang_archive")) return;
    markEvent("opened_mang_archive");
  }, [activeApp, hasEvent, markEvent]);

  if (!ready) return <main className={styles.loading}>正在读取本地备份……</main>;

  if (!save.prologueSeen) {
    return (
      <main className={`${styles.prologue} ${save.settings.reducedMotion ? styles.reduceMotion : ""}`}>
        <div className={styles.loginTop} aria-hidden="true" />
        <section className={styles.loginStage} aria-label="Windows XP 登录">
          <div className={styles.loginIntro}>
            <div className={styles.loginBrand} aria-label="Microsoft Windows XP">
              <span className={`${styles.windowsFlag} ${styles.loginWindowsFlag}`} aria-hidden="true"><i /><i /><i /><i /></span>
              <span className={styles.loginWindowsWord}><small>Microsoft</small><b>Windows</b><em>xp</em></span>
            </div>
            <div className={styles.loginTexts}>
              <p>{PROLOGUE.source}</p>
              <cite>——{PROLOGUE.citation}</cite>
              <strong>{PROLOGUE.dedication}</strong>
            </div>
          </div>
          <div className={styles.loginPanel}>
            <form
              className={styles.loginAccount}
              onSubmit={(event) => {
                event.preventDefault();
                if (prologuePassword.trim().toLowerCase() === "duche") {
                  setSave((previous) => ({ ...previous, prologueSeen: true }));
                  setPrologueNote("");
                } else {
                  setPrologueNote("密码不正确，请再试一次。");
                }
              }}
            >
              <span className={styles.loginAvatar}><MonitorCog aria-hidden="true" /></span>
              <div className={styles.loginCredentials}>
                <label htmlFor="duche-login-password"><b>Administrator</b><small>请输入您的密码</small></label>
                <div className={styles.loginPasswordRow}>
                  <input id="duche-login-password" type="password" value={prologuePassword} onChange={(event) => setProloguePassword(event.target.value)} autoComplete="current-password" autoFocus />
                  <button type="submit" aria-label="登录到 Administrator 账户"><ArrowRight aria-hidden="true" /></button>
                </div>
                <p className={styles.loginHint}>提示：我的名字的拼音小写</p>
                <p className={styles.loginError} role="status">{prologueNote}</p>
              </div>
            </form>
          </div>
        </section>
        <footer className={styles.loginBottom}><span><i aria-hidden="true">●</i> 关闭计算机</span><small>登录后即可读取这台电脑中保存的本地资料。</small></footer>
      </main>
    );
  }

  return (
    <main
      className={`${styles.desktop} ${save.settings.reducedMotion ? styles.reduceMotion : ""} ${save.settings.reducedFlashes ? styles.reduceFlashes : ""}`}
      style={{ fontSize: `${save.settings.textScale}%` }}
      onPointerDown={() => setStartOpen(false)}
    >
      <a href="#v2-desktop-icons" className={styles.skipLink}>跳到桌面应用</a>
      <div className={styles.desktopTexture} aria-hidden="true" />
      <header className={styles.desktopHeader}>
        <div><span>DUCHE-PC</span><b>资料恢复终端</b></div>
        <time suppressHydrationWarning>{new Date().toLocaleDateString("zh-CN", { year: "numeric", month: "2-digit", day: "2-digit" })}</time>
      </header>

      <section id="v2-desktop-icons" className={styles.desktopIcons} aria-label="桌面应用" onPointerDown={(event) => { if (event.target === event.currentTarget) setSelectedDesktopApp(null); }}>
        {(Object.keys(APP_META) as AppId[]).map((id) => <AppIcon key={id} id={id} selected={selectedDesktopApp === id} onOpen={openApp} onSelect={setSelectedDesktopApp} />)}
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
            {id === "word" ? renderWord() : null}
          </AppWindow>
        ))}
      </section>

      <footer className={styles.taskbar}>
        <button type="button" className={`${styles.homeButton} ${startOpen ? styles.startPressed : ""}`} onPointerDown={(event) => event.stopPropagation()} onClick={() => setStartOpen((value) => !value)} aria-label="打开开始菜单"><span className={styles.windowsFlag} aria-hidden="true"><i /><i /><i /><i /></span><b>开始</b></button>
        <nav aria-label="应用切换器">
          {(Object.keys(APP_META) as AppId[]).map((id) => {
            const Icon = APP_META[id].icon;
            return <button key={id} type="button" data-app={id} className={`${windows[id].open ? styles.running : ""} ${activeApp === id && !windows[id].minimized ? styles.activeTask : ""}`} onClick={() => openApp(id)} aria-label={`打开${APP_META[id].label}`}><Icon /><span>{APP_META[id].label}</span></button>;
          })}
        </nav>
        <div className={styles.taskTools}>
          <button type="button" onClick={() => setHintOpen(true)} aria-label="打开调查提示"><CircleHelp /></button>
          {renderSettings()}
          <span className={styles.trayIcons} aria-hidden="true"><Wifi /><Volume2 /></span>
          <time suppressHydrationWarning>{clock}</time>
        </div>
      </footer>

      {startOpen ? <StartMenu /> : null}

      <Dialog open={hintOpen} onOpenChange={setHintOpen}>
        <DialogContent className={styles.dialog}>
          <DialogHeader><DialogTitle>当前调查目标</DialogTitle><DialogDescription>提示只跟随尚未完成的事实动作，不会在旧页面重复弹出。</DialogDescription></DialogHeader>
          <div className={styles.hintCard}><span>提示 {hintLevel + 1}/3</span><p>{currentHint.levels[hintLevel]}</p></div>
          <Button variant="outline" disabled={hintLevel === 2} onClick={() => setHintLevel((value) => Math.min(2, value + 1))}>{hintLevel === 2 ? "已显示完整提示" : "再给我一点提示"}</Button>
        </DialogContent>
      </Dialog>

      <Dialog open={offlineOpen} onOpenChange={setOfflineOpen}>
        <DialogContent className={styles.dialog}>
          <DialogHeader>
            <DialogTitle>无法连接互联网</DialogTitle>
            <DialogDescription>这台旧电脑没有可用的互联网连接。只能打开已经保存在本地的憎恶社画廊网站，以及线索解锁后的寿享陵园旧站。</DialogDescription>
          </DialogHeader>
          <Button type="button" onClick={() => setOfflineOpen(false)}>确定</Button>
        </DialogContent>
      </Dialog>
    </main>
  );

  function renderBrowser() {
    let content: ReactNode;
    if (currentBrowserKey === "home") content = <BrowserHome />;
    else if (currentBrowserKey.startsWith("legacy:")) {
      const legacyPath = currentBrowserKey.slice(7) || "/";
      content = (
        <div className={styles.galleryWebsite}>
          <GameApp
            embedded
            initialPath={legacyPath}
            onNavigate={(path) => {
              if (path === "/recovered/13-wang-keding") {
                markEvent("verified_wang_poison", "verified_wang_staging");
              }
              if (path === "/archive/case/cemetery") {
                markEvent("recovered_ledger_mail", "verified_lixiang_homicide");
              }
              if (["/stage/recovered-index", "/stage/zhuhongmen", "/stage/shinan"].includes(path)) {
                markEvent(
                  "verified_wang_poison",
                  "verified_wang_staging",
                  "recovered_ledger_mail",
                  "verified_lixiang_homicide",
                  "heard_duwanlin_confession",
                );
              }
              if (["/stage/zhuhongmen", "/stage/shinan"].includes(path)) {
                markEvent("recovered_all_mang_manuscripts");
              }
              pushBrowser(`legacy:${path}`);
            }}
            onCemeteryVisit={() => markEvent("recovered_ledger_mail")}
          />
        </div>
      );
    }
    else if (currentBrowserKey.startsWith("gallery-search:")) content = <GallerySearchResults term={currentBrowserKey.slice(15)} />;
    else if (currentBrowserKey.startsWith("gallery:")) content = <GallerySectionPage section={currentBrowserKey.slice(8) as GallerySection} />;
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
          <span className={styles.addressBar}>{browserAddress(currentBrowserKey)}</span>
          <span className={styles.offlineBadge}>脱机工作</span>
        </header>
        <div className={styles.browserViewport}>{content}</div>
      </div>
    );
  }

  function StartMenu() {
    return (
      <section className={styles.startMenu} aria-label="开始菜单" onPointerDown={(event) => event.stopPropagation()}>
        <header><span className={styles.userTile}><MonitorCog aria-hidden="true" /></span><b>DUCHE-PC</b></header>
        <div className={styles.startMenuBody}>
          <div className={styles.startPrograms}>
            {(Object.keys(APP_META) as AppId[]).map((id) => {
              const Icon = APP_META[id].icon;
              return <button type="button" key={id} data-app={id} onClick={() => openApp(id)}><span><Icon aria-hidden="true" /></span><b>{APP_META[id].label}</b><small>{APP_META[id].subtitle}</small></button>;
            })}
          </div>
          <div className={styles.startPlaces}>
            <button type="button" onClick={() => openApp("vault")}><FolderLock /><b>我的文档</b></button>
            <button type="button" onClick={() => openApp("browser")}><Search /><b>搜索</b></button>
            <button type="button" onClick={() => { setStartOpen(false); setHintOpen(true); }}><CircleHelp /><b>帮助和支持</b></button>
          </div>
        </div>
        <footer><button type="button" onClick={() => setSave((previous) => ({ ...previous, prologueSeen: false }))}><span aria-hidden="true">⇥</span>注销</button><button type="button" onClick={() => { setStartOpen(false); setWindows(INITIAL_WINDOWS); setActiveApp(null); }}><span aria-hidden="true">●</span>关闭计算机</button></footer>
      </section>
    );
  }

  function BrowserHome() {
    const cemeteryLeadReady = hasEvent("recovered_ledger_mail");
    const hotItems: Array<{ rank: number; title: string; target?: string; trend?: "up" | "new" }> = [
      { rank: 1, title: "临展画作遭撤，艺术家生存环境堪忧", target: "legacy:/", trend: "up" },
      { rank: 2, title: "他山地方公墓贪污案旧档重启核查", target: cemeteryLeadReady ? "legacy:/mirror/shouxiang/staff" : undefined, trend: cemeteryLeadReady ? "new" : undefined },
      { rank: 3, title: "青年艺术家驻留计划公布首批名单" },
      { rank: 4, title: "西门车站周边改造方案进入公示期" },
      { rank: 5, title: "地方旧书店联合发起手稿修复计划" },
      { rank: 6, title: "航船诗歌社秋季朗读会即将开始" },
    ];
    return (
      <section className={styles.searchHome}>
        <div className={styles.browserBrand} aria-label="摆渡，公开网页与本地缓存">
          <b><span>摆</span><span>渡</span></b>
          <i aria-hidden="true"><span /><span /><span /></i>
          <small>公开网页与本地缓存</small>
        </div>
        <SearchForm />
        <section className={styles.hotSearch} aria-labelledby="ferry-hot-title">
          <header><h2 id="ferry-hot-title">摆渡热搜</h2><span>新闻线索榜</span></header>
          <ol>
            {hotItems.map((item) => <li key={item.rank}><button type="button" disabled={!item.target} onClick={() => item.target && pushBrowser(item.target)}><em>{item.rank}</em><span>{item.title}</span>{item.trend ? <i data-trend={item.trend}>{item.trend === "new" ? "新" : "↑"}</i> : null}</button></li>)}
          </ol>
          <p>灰色条目仅保留新闻标题；“公墓贪污案”需取得账目线索后才能打开对应旧站。</p>
        </section>
      </section>
    );
  }

  function SearchForm() {
    return (
      <form className={styles.searchForm} onSubmit={(event: FormEvent) => { event.preventDefault(); setOfflineOpen(true); }} role="search">
        <Search aria-hidden="true" />
        <label className="sr-only" htmlFor="v2-search">检索公开网页与本地缓存</label>
        <input id="v2-search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="输入人名、地点、作品或档案字段" autoComplete="off" />
        <button type="submit">摆渡检索</button>
      </form>
    );
  }

  function GallerySearchForm() {
    return (
      <form className="global-search" onSubmit={(event: FormEvent) => { event.preventDefault(); runGallerySearch(query); }} role="search">
        <Search aria-hidden="true" />
        <label className="sr-only" htmlFor="gallery-search">搜索憎恶社画廊</label>
        <input id="gallery-search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="搜索作品、人物与档案" autoComplete="off" />
        <button type="submit">搜索</button>
      </form>
    );
  }

  function GalleryWebsiteShell({ section, path, children }: { section: GallerySection | "search"; path: string; children: ReactNode }) {
    return (
      <section className={`${styles.galleryWebsite} game-shell ${section === "home" ? "is-gallery-home" : ""} ${!["home", "exhibitions"].includes(section) ? "is-directory-page" : ""}`}>
        <header className="site-header">
          <button type="button" className="wordmark" onClick={() => pushBrowser("gallery:home")}>
            <span className="wordmark-mark">憎恶社</span>
            <span><b>ZENGWU SOCIETY</b><small>当代艺术 · 诗歌 · 出版</small></span>
          </button>
          <nav className="gallery-section-nav" aria-label="憎恶社网站栏目">
            {GALLERY_SECTIONS.map((item) => (
              <button
                type="button"
                key={item.id}
                className={section === item.id ? "is-current" : ""}
                onClick={() => item.id === "exhibitions" ? openBrowserNode("exhibition") : pushBrowser(`gallery:${item.id}`)}
              >
                {item.label}
              </button>
            ))}
          </nav>
          <GallerySearchForm />
        </header>
        <div className="path-strip"><span>LOCAL CACHE</span><code>{path}</code><i>互联网连接不可用</i></div>
        <main className="game-main">{children}</main>
        <footer className="site-footer"><span>© ZENGWU SOCIETY</span><span>本机缓存副本</span><button type="button" onClick={() => pushBrowser("home")}>返回摆渡</button></footer>
      </section>
    );
  }

  function GallerySearchResults({ term }: { term: string }) {
    const entries: DirectoryEntry[] = searchNodes(term)
      .filter((node) => node.id !== "shouxiang" && hasAll(save.events, node.requires))
      .map((node) => ({ id: node.id, eyebrow: node.kind, title: node.title, summary: node.summary, path: node.id, isNew: !save.visited.includes(node.id) }));
    return (
      <GalleryWebsiteShell section="search" path={`/search?q=${encodeURIComponent(term)}`}>
        <DirectoryPage
          kicker={`站内搜索 / ${String(entries.length).padStart(2, "0")} RESULTS`}
          title={term ? `“${term}”` : "搜索"}
          intro={entries.length ? "以下内容来自憎恶社画廊的本地站内索引。" : "画廊站内索引中没有找到相关页面。"}
          entries={entries}
          onOpen={openBrowserNode}
        />
      </GalleryWebsiteShell>
    );
  }

  function sectionForNode(id: string): GallerySection {
    if (id === "exhibition") return "exhibitions";
    if (GALLERY_DIRECTORY_IDS.people.includes(id)) return "people";
    if (GALLERY_DIRECTORY_IDS.news.includes(id)) return "news";
    if (GALLERY_DIRECTORY_IDS.publications.includes(id)) return "publications";
    return "about";
  }

  function GallerySectionPage({ section }: { section: GallerySection }) {
    if (section === "home") {
      return <GalleryWebsiteShell section="home" path="/"><GalleryHomePage onStart={() => openBrowserNode("exhibition")} /></GalleryWebsiteShell>;
    }
    if (section === "exhibitions") {
      return <GalleryWebsiteShell section="exhibitions" path="/exhibitions/zhuhongmen"><ExhibitionPage frameNotice={frameNotice} onInspectFrame={() => setFrameNotice(true)} /></GalleryWebsiteShell>;
    }
    const directorySection = section as Exclude<GallerySection, "home" | "exhibitions">;
    const copy = {
      people: ["人物索引 / PEOPLE", "人物", "画廊公开人物页与本机已恢复的相关档案。"],
      news: ["新闻与档案 / NEWS", "新闻", "公开报道、展览告示与调查过程中恢复的旧记录。"],
      publications: ["出版与文本 / PUBLICATIONS", "出版物", "出版机构、编辑缓存与文学档案。"],
      about: ["关于憎恶社 / ABOUT", "关于", "社团沿革与早期成员资料。"],
    }[directorySection];
    const entries: DirectoryEntry[] = GALLERY_DIRECTORY_IDS[directorySection]
      .map((id) => BROWSER_NODES.find((node) => node.id === id))
      .filter((node): node is BrowserNode => Boolean(node) && hasAll(save.events, node?.requires))
      .map((node) => ({ id: node.id, eyebrow: node.kind, title: node.title, summary: node.summary, path: node.id, isNew: !save.visited.includes(node.id) }));
    return (
      <GalleryWebsiteShell section={section} path={`/${section}`}>
        <DirectoryPage kicker={copy[0]} title={copy[1]} intro={copy[2]} entries={entries} onOpen={openBrowserNode} />
      </GalleryWebsiteShell>
    );
  }

  function BrowserNodePage({ node }: { node: BrowserNode }) {
    const unlocked = hasAll(save.events, node.requires);
    if (!unlocked) {
      return (
        <section className={styles.lockedRecord} aria-live="polite">
          <FileLock2 aria-hidden="true" />
          <span>ACCESS / PENDING</span>
          <h1>{node.title.replace(/[\u4e00-\u9fff]/g, "□")}</h1>
          <p>{node.lockedHint || "这份记录仍缺少前置材料。"}</p>
          <button type="button" onClick={() => pushBrowser("home")}>返回检索首页</button>
        </section>
      );
    }
    if (node.id === "exhibition") {
      return <GalleryWebsiteShell section="exhibitions" path="/exhibitions/zhuhongmen"><ExhibitionPage frameNotice={frameNotice} onInspectFrame={() => setFrameNotice(true)} /></GalleryWebsiteShell>;
    }
    if (node.id === "shouxiang") {
      return (
        <section className={styles.embeddedCemeteryWebsite}>
          <div className={styles.embeddedSearch}><SearchForm /></div>
          <article className={styles.nodePage}>
            <header><span>{node.kind}</span><h1>{node.title}</h1><p>{node.summary}</p></header>
            {renderNodeBody(node.id)}
          </article>
        </section>
      );
    }
    const section = sectionForNode(node.id);
    return (
      <GalleryWebsiteShell section={section} path={`/${section}/${node.id}`}>
        <article className={styles.nodePage}>
          <header><span>{node.kind}</span><h1>{node.title}</h1><p>{node.summary}</p></header>
          {renderNodeBody(node.id)}
        </article>
      </GalleryWebsiteShell>
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
        return <><div className={styles.formSheet}><span>他山地方公墓 / 遗体处理手续</span><h2>焚烧签字单</h2><dl><dt>申请人</dt><dd>杜万琳</dd><dt>死者</dt><dd>杜莉香</dd><dt>遗体</dt><dd>未到院</dd><dt>代签</dt><dd>方＿</dd><dt>后补收件</dt><dd>葬礼后第三日</dd><dt>项目编号</dt><dd>SX-2000-17</dd></dl></div><button type="button" className={styles.archiveAction} onClick={() => openBrowserNode("fang-wan")}>打开画廊人物索引中的代签人<ChevronRight /></button></>;
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
        return hasEvent("editor_verified") ? <div className={styles.documentSheet}><h2>编辑缓存已解锁</h2><p>初版人物年表把元昶与左君分开记录；批注要求恢复本名并将两条记录合并。</p><button className={styles.archiveAction} type="button" onClick={() => openBrowserNode("yuanchang")}>打开人物修订页<ChevronRight /></button></div> : <form className={styles.loginForm} onSubmit={(event) => { event.preventDefault(); if (editorUser.trim().toLowerCase() === "editor_ys" && editorPassword.trim().toUpperCase() === "MHDCF2019") { markEvent("editor_verified"); setEditorNote("身份核验通过。"); } else setEditorNote("账号或口令与两份来源不一致。"); }}><label>账号<input value={editorUser} onChange={(event) => setEditorUser(event.target.value)} autoComplete="username" /></label><label>口令<input type="password" value={editorPassword} onChange={(event) => setEditorPassword(event.target.value)} autoComplete="current-password" /></label><button type="submit">读取编辑缓存</button><p role="status">{editorNote}</p></form>;
      case "yuanchang":
        return <><div className={styles.documentSheet}><span>人物修订 / 叶是</span><h2>元昶，即左君</h2><p>法名与本名属于同一个小说角色。这里仅记录修订结果，不再使用损坏重定向把杜南阳与杜万琳简单合并。</p></div></>;
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
    if (!unlocked) return <section className={styles.vaultLocked}><FileLock2 /><span>MANG / IMAGE ARCHIVE</span><h1>《目盲》图像诗稿</h1><p>文件夹仍受剧情进度保护。完成案件证据链、账目恢复与关键录音核验后，系统会自动解除锁定。</p><small>无需在此输入密码或完成额外验证。</small></section>;
    const selectedPoem = MANG_IMAGE_ARCHIVE.find((item) => item.id === selectedMangPoem);
    const allManuscriptsRecovered = hasEvent("recovered_all_mang_manuscripts");
    return (
      <>
        <section className={styles.vaultOpen}>
          <section className={styles.mangArchive}>
            <header><span>MANG / IMAGE ARCHIVE</span><h1>《目盲》图像诗稿</h1><p>共 19 个篇目、51 张图像。</p></header>
            <div>{MANG_IMAGE_ARCHIVE.map((item) => <button type="button" key={item.id} onClick={() => setSelectedMangPoem(item.id)}><span>{item.images.length} 张</span><b>{item.title}</b><ChevronRight aria-hidden="true" /></button>)}</div>
          </section>
          {allManuscriptsRecovered ? <section className={styles.hiddenTextArea} aria-label="新出现的隐藏文件"><button type="button" className={styles.hiddenTextFile} onClick={() => { markEvent("opened_final_password_txt"); setPasswordTextOpen(true); }}><FileText aria-hidden="true" /><span><b>mang-index.txt</b><small>隐藏文件 · 1 KB</small></span><ChevronRight aria-hidden="true" /></button></section> : null}
        </section>
        <Dialog open={Boolean(selectedPoem)} onOpenChange={(open) => { if (!open) setSelectedMangPoem(null); }}>
          <DialogContent className={styles.mangViewer}>
            <DialogHeader><DialogTitle>{selectedPoem?.title}</DialogTitle><DialogDescription>《目盲》加密图像档案 · {selectedPoem?.images.length ?? 0} 张</DialogDescription></DialogHeader>
            <div>{selectedPoem?.images.map((image, index) => <figure key={image}><img src={asset(image)} alt={`${selectedPoem.title} 第 ${index + 1} 张`} loading="lazy" /><figcaption>{index + 1} / {selectedPoem.images.length}</figcaption></figure>)}</div>
          </DialogContent>
        </Dialog>
        {allManuscriptsRecovered ? <Dialog open={passwordTextOpen} onOpenChange={setPasswordTextOpen}><DialogContent className={styles.passwordTextDialog}><DialogHeader><DialogTitle>mang-index.txt - 记事本</DialogTitle></DialogHeader><pre>{FINAL_WORD_PASSWORD}</pre></DialogContent></Dialog> : null}
      </>
    );
  }

  function renderWord() {
    const passwordSourceFound = hasEvent("opened_final_password_txt");
    const unlocked = passwordSourceFound && hasEvent("unlocked_final_word");
    if (!unlocked) {
      return (
        <section className={styles.wordLocked}>
          <form onSubmit={(event) => {
            event.preventDefault();
            if (!passwordSourceFound) {
              setWordNote("系统尚未找到可验证的口令来源。");
              return;
            }
            if (wordPassword.trim() === FINAL_WORD_PASSWORD) {
              markEvent("unlocked_final_word");
              setWordNote("");
              return;
            }
            setWordNote("密码不正确。请核对隐藏 TXT 中的完整字符串。");
          }}>
            <span className={styles.wordFileIcon}><FileText aria-hidden="true" /><b>W</b></span>
            <div><span>Microsoft Word</span><h1>最终文件.doc</h1><p>此文档受密码保护。</p></div>
            <label htmlFor="final-word-password">打开文件所需密码</label>
            <input id="final-word-password" type="password" value={wordPassword} onChange={(event) => setWordPassword(event.target.value)} autoComplete="off" autoFocus />
            <p role="status">{wordNote || (passwordSourceFound ? "口令文件已找到。" : "请先完成全部诗稿，并检查上锁文件夹中新出现的隐藏 TXT。")}</p>
            <button type="submit">确定</button>
          </form>
        </section>
      );
    }
    return (
      <section className={styles.wordApp}>
        <nav aria-label="Word 菜单"><span>文件</span><span>编辑</span><span>视图</span><span>插入</span><span>格式</span><span>工具</span><span>表格</span><span>窗口</span><span>帮助</span></nav>
        <div className={styles.wordToolbar} aria-hidden="true"><b>100%</b><span>正文</span><span>宋体</span><span>小四</span><i>B</i><i>I</i><i>U</i></div>
        <div className={styles.wordWorkspace}>
          <article className={styles.wordPage}><a href={FINAL_WORD_URL} target="_blank" rel="noreferrer">{FINAL_WORD_URL}</a></article>
        </div>
        <footer><span>第 1 页</span><span>1 / 1</span><span>中文（中国）</span></footer>
      </section>
    );
  }

  function renderSettings() {
    return <Dialog><DialogTrigger asChild><button type="button" aria-label="设置"><Settings2 /></button></DialogTrigger><DialogContent className={styles.dialog}><DialogHeader><DialogTitle>系统与可访问性</DialogTitle><DialogDescription>设置不会改变谜题答案。存档仅保存在当前设备。</DialogDescription></DialogHeader><label className={styles.settingRow}><span><b>字幕与逐字稿</b><small>无声音也能完成全部核验。</small></span><Switch checked={save.settings.subtitles} onCheckedChange={(checked) => setSave((previous) => ({ ...previous, settings: { ...previous.settings, subtitles: checked } }))} /></label><label className={styles.settingRow}><span><b>减少动态</b><small>缩短位移动画与渐变等待。</small></span><Switch checked={save.settings.reducedMotion} onCheckedChange={(checked) => setSave((previous) => ({ ...previous, settings: { ...previous.settings, reducedMotion: checked } }))} /></label><label className={styles.settingRow}><span><b>减少惊吓</b><small>关闭突发闪烁；红字与渗血仅保留静态结果。</small></span><Switch checked={save.settings.reducedFlashes} onCheckedChange={(checked) => setSave((previous) => ({ ...previous, settings: { ...previous.settings, reducedFlashes: checked } }))} /></label><div className={styles.sliderRow}><span><b>音量</b><small>{save.settings.volume}%</small></span><Slider min={0} max={100} step={5} value={[save.settings.volume]} onValueChange={(value) => setSave((previous) => ({ ...previous, settings: { ...previous.settings, volume: value[0] } }))} /></div><div className={styles.sliderRow}><span><b>文字字号</b><small>{save.settings.textScale}%</small></span><Slider min={90} max={130} step={10} value={[save.settings.textScale]} onValueChange={(value) => setSave((previous) => ({ ...previous, settings: { ...previous.settings, textScale: value[0] } }))} /></div><div className={styles.settingsActions}><button type="button" onClick={() => setSave((previous) => ({ ...previous, prologueSeen: false }))}><RotateCcw />重播序幕</button><button type="button" onClick={() => { const blob = new Blob([JSON.stringify(save, null, 2)], { type: "application/json" }); const url = URL.createObjectURL(blob); const anchor = document.createElement("a"); anchor.href = url; anchor.download = "zengwu-she-save.json"; anchor.click(); URL.revokeObjectURL(url); }}><FileArchive />导出存档</button><button type="button" onClick={() => importRef.current?.click()}><Upload />导入存档</button><input ref={importRef} hidden type="file" accept="application/json" onChange={(event) => { const file = event.target.files?.[0]; if (!file) return; const reader = new FileReader(); reader.onload = () => { try { const parsed = JSON.parse(String(reader.result)) as V2Save; if (parsed.schemaVersion === 2) setSave({ ...DEFAULT_V2_SAVE, ...parsed, settings: { ...DEFAULT_V2_SAVE.settings, ...parsed.settings } }); } catch { /* Invalid saves remain untouched. */ } }; reader.readAsText(file); }} /><AlertDialog><AlertDialogTrigger asChild><button type="button" className={styles.dangerAction}><Trash2 />重新开始</button></AlertDialogTrigger><AlertDialogContent><AlertDialogHeader><AlertDialogTitle>清除当前调查进度？</AlertDialogTitle><AlertDialogDescription>这会删除当前调查的事件、搜索历史、已恢复文件和最终文档状态。</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel>取消</AlertDialogCancel><AlertDialogAction variant="destructive" onClick={() => { window.localStorage.removeItem(V2_STORAGE_KEY); setSave(DEFAULT_V2_SAVE); setProloguePassword(""); setPrologueNote(""); setWordPassword(""); setWordNote(""); setWindows(INITIAL_WINDOWS); }}>确认重新开始</AlertDialogAction></AlertDialogFooter></AlertDialogContent></AlertDialog></div></DialogContent></Dialog>;
  }
}
