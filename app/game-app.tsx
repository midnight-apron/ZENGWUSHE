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
  ArrowDown,
  ArrowUp,
  Eye,
  EyeOff,
  FileWarning,
  FolderOpen,
  HelpCircle,
  LockKeyhole,
  Search,
  Settings2,
  UnlockKeyhole,
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
  stoneBreakClicks: number;
  stoneBaseClicks: number;
  routeTrips: number;
  routeReachedBottom: boolean;
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
  stoneBreakClicks: 0,
  stoneBaseClicks: 0,
  routeTrips: 0,
  routeReachedBottom: false,
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
  duNanyangOld: "/members/du-nanyang-old",
  duWanlin: "/members/du-wanlin",
  fangWan: "/members/fang-wan",
  dongxingPeter: "/photos/dongxing-peter",
  wangKeding: "/members/wang-keding",
  xingWan: "/members/xing-wan",
  liXiangDeath: "/archive/deaths/lixiang",
  wangAutopsy: "/archive/autopsy/wang-keding",
  stoneHead: "/archive/evidence/stone-head",
  xiyanTemple: "/archive/evidence/xiyansi",
  phoenixRoute: "/archive/routes/phoenix-reservoir",
  wangSupplement: "/archive/autopsy/wang-keding-supplement",
  wangDeath: "/recovered/13-wang-keding",
  duCremation: "/archive/forms/cremation-du",
  duCremationSigned: "/archive/forms/cremation-du-complete",
};

const PAGE_TITLES: Record<string, string> = {
  [ROUTES.exhibition]: "赭红门｜当期展览",
  [ROUTES.artwork]: "白芍肉｜撤回作品缓存",
  [ROUTES.curator]: "李泰｜旧成员缓存",
  [ROUTES.dimensions]: "3dm×3dm｜尺寸交叉索引",
  [ROUTES.damagedReader]: "损坏朗读页｜档案 01",
  [ROUTES.recoveredOne]: "盲之春｜已恢复",
  [ROUTES.history]: "憎恶社｜旧社团历史",
  [ROUTES.duNanyangOld]: "杜南阳｜旧人物页",
  [ROUTES.duWanlin]: "杜万琳｜合并人物档案",
  [ROUTES.fangWan]: "方晚｜人物档案",
  [ROUTES.dongxingPeter]: "东兴彼得｜城市旧照",
  [ROUTES.wangKeding]: "王克定｜人物档案",
  [ROUTES.xingWan]: "刑万／刑某｜合并人物档案",
  [ROUTES.liXiangDeath]: "莉香｜溺亡记录",
  [ROUTES.wangAutopsy]: "王克定｜认尸与尸检摘要",
  [ROUTES.stoneHead]: "石立人头｜物证记录",
  [ROUTES.xiyanTemple]: "西岩寺｜石像档案",
  [ROUTES.phoenixRoute]: "凤凰水库｜河流路线",
  [ROUTES.wangSupplement]: "王克定｜尸检补充",
  [ROUTES.wangDeath]: "王克定之死｜已恢复",
  [ROUTES.duCremation]: "杜万琳｜火化单",
  [ROUTES.duCremationSigned]: "杜万琳｜完整火化单",
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
    "下一条人物线索在旧年表中。",
    "创办人的旧名没有出现在现代成员表。",
    "搜索：杜南阳。",
  ],
  [ROUTES.duNanyangOld]: [
    "这份旧人物页显示了一个残缺的永久重定向地址。",
    "比较画廊、配偶和同乡关系，补全“杜＿琳”。",
    "搜索：杜万琳。",
  ],
  [ROUTES.duWanlin]: [
    "合并档案中有一张没有姓名的同乡履历卡。",
    "他曾辍学务农、在果园劳动，后来去杭州学画。",
    "搜索：方晚。",
  ],
  [ROUTES.fangWan]: [
    "人物页的照片图层损坏了，但OCR转录仍在。",
    "把照片招牌上的四个字完整输入搜索框。",
    "搜索：东兴彼得。",
  ],
  [ROUTES.dongxingPeter]: [
    "照片说明不够，继续读访客笔记的末尾。",
    "那里的姓名也是一份朗读文件标题。",
    "搜索：王克定。",
  ],
  [ROUTES.wangKeding]: [
    "人物页底部的社团合照转录还留着另一名旧成员。",
    "新闻用“某”隐去他的名字，合照却写出完整姓名。",
    "搜索：刑万或刑某。",
  ],
  [ROUTES.xingWan]: [
    "刑万的关联人物只剩下“莉×”。",
    "杜彻称她为未曾谋面的姑姑，诗中直接叫出她的名字。",
    "搜索：莉香。",
  ],
  [ROUTES.liXiangDeath]: [
    "河流档案还交叉引用了另一名死者的材料。",
    "把死者姓名与材料类型组合起来搜索。",
    "搜索：王克定尸检。",
  ],
  [ROUTES.wangAutopsy]: [
    "报告里有一件与投河叙述极不相称的物证。",
    "它连接在死者反绑的双手后面。",
    "搜索：石立人头。",
  ],
  [ROUTES.stoneHead]: [
    "物证来源栏保留了一处寺院名称。",
    "后山旧照与《浣石》残句都指向同一地点。",
    "搜索：西岩寺。",
  ],
  [ROUTES.xiyanTemple]: [
    "图注中的“六十七”也可以拆成两个动作次数。",
    "先检查佛头断口，再检查石座。",
    "断口点 6 次，石座点 7 次。",
  ],
  [ROUTES.phoenixRoute]: [
    "尸体路线需要回溯，不能只顺流看一遍。",
    "从上游到水库再返回上游，重复三次。",
    "完成 3 次往返后，查看新出现的伤口批注。",
  ],
  [ROUTES.wangSupplement]: [
    "口令由两份已经看过的数字组成，不是日期。",
    "西岩寺有多少尊像？死者脸颊有几道伤口？",
    "输入：67-3。",
  ],
  [ROUTES.wangDeath]: [
    "版本历史还连接着另一名参与者的死亡手续。",
    "《始末的碎点》把这道手续称为“焚烧签字单”。",
    "搜索：火化单。",
  ],
  [ROUTES.duCremation]: [
    "代签人并非杜家直系亲属，遮挡层只露出“方＿”。",
    "回想谁最早赶到医院，又在诗中承认代签。",
    "搜索：方晚署名。",
  ],
  [ROUTES.duCremationSigned]: [
    "火化单与项目往来共享了一个完整案名。",
    "下一章将把五个人放回同一份项目索引。",
    "搜索：他山地方公墓贪污案。",
  ],
};

const RECOVERED_FILES = [
  { id: "01", title: "序诗：盲之春", source: "损坏朗读页" },
  { id: "02", title: "1.1 憎恶社（杜万琳）", source: "旧社团历史" },
  { id: "03", title: "1.2 方晚（杜万琳）", source: "方晚人物档案" },
  { id: "04", title: "1.3 王克定（方晚）", source: "城市旧照片" },
  { id: "05", title: "1.4 在兰道（刑万）", source: "刑万合并档案" },
  { id: "06", title: "2.1 溺水的莉香（刑万）", source: "莉香溺亡记录" },
  { id: "07", title: "2.2 舞（徐惠）", source: "婚礼档案" },
  { id: "08", title: "3.1 自白（方晚）", source: "完整火化单" },
  { id: "09", title: "3.2 浣石（方晚）", source: "西岩寺石像档案" },
  { id: "10", title: "4.1 刍味（杜彻）", source: "寿享陵园" },
  { id: "11", title: "4.2 刍胃（杜万琳）", source: "医学删除页" },
  { id: "12", title: "5.1 始末的碎点", source: "碎点索引" },
  { id: "13", title: "5.2 王克定之死（杜万琳）", source: "尸检补充" },
  { id: "14", title: "结诗：赭红门", source: "终场" },
];

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
  const [stoneRevealActive, setStoneRevealActive] = useState(false);
  const [supplementPassword, setSupplementPassword] = useState("");
  const [supplementPasswordVisible, setSupplementPasswordVisible] = useState(false);
  const [supplementPasswordAttempts, setSupplementPasswordAttempts] = useState(0);
  const [supplementPasswordNote, setSupplementPasswordNote] = useState("");
  const [deathScareActive, setDeathScareActive] = useState(false);
  const [deathScareTextVisible, setDeathScareTextVisible] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const skipScareRef = useRef<HTMLButtonElement>(null);
  const skipDeathScareRef = useRef<HTMLButtonElement>(null);

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
    setSupplementPassword("");
    setSupplementPasswordVisible(false);
    setSupplementPasswordAttempts(0);
    setSupplementPasswordNote("");
  }, []);

  const finishMangRecovery = useCallback(() => {
    setScareActive(false);
    setScareTextVisible(false);
    mutateGame(["S03", "S04"], ["01"]);
    navigate(ROUTES.recoveredOne);
  }, [mutateGame, navigate]);

  const finishWangRecovery = useCallback(() => {
    setDeathScareActive(false);
    setDeathScareTextVisible(false);
    mutateGame(["S18"], ["13"]);
    navigate(ROUTES.wangDeath);
    window.setTimeout(() => searchInputRef.current?.focus(), 0);
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
      [ROUTES.duNanyangOld]: {
        unlock: ["S01", "S02", "S03", "S04", "S05", "S06"],
        recover: ["01", "02"],
      },
      [ROUTES.duWanlin]: {
        unlock: ["S01", "S02", "S03", "S04", "S05", "S06", "S07"],
        recover: ["01", "02"],
      },
      [ROUTES.fangWan]: {
        unlock: ["S01", "S02", "S03", "S04", "S05", "S06", "S07", "S08"],
        recover: ["01", "02", "03"],
      },
      [ROUTES.dongxingPeter]: {
        unlock: ["S01", "S02", "S03", "S04", "S05", "S06", "S07", "S08", "S09"],
        recover: ["01", "02", "03"],
      },
      [ROUTES.wangKeding]: {
        unlock: ["S01", "S02", "S03", "S04", "S05", "S06", "S07", "S08", "S09", "S10"],
        recover: ["01", "02", "03", "04"],
      },
      [ROUTES.xingWan]: {
        unlock: ["S01", "S02", "S03", "S04", "S05", "S06", "S07", "S08", "S09", "S10", "S11"],
        recover: ["01", "02", "03", "04", "05"],
      },
      [ROUTES.liXiangDeath]: {
        unlock: ["S01", "S02", "S03", "S04", "S05", "S06", "S07", "S08", "S09", "S10", "S11", "S12"],
        recover: ["01", "02", "03", "04", "05", "06"],
      },
      [ROUTES.wangAutopsy]: {
        unlock: ["S01", "S02", "S03", "S04", "S05", "S06", "S07", "S08", "S09", "S10", "S11", "S12", "S13"],
        recover: ["01", "02", "03", "04", "05", "06"],
      },
      [ROUTES.stoneHead]: {
        unlock: ["S01", "S02", "S03", "S04", "S05", "S06", "S07", "S08", "S09", "S10", "S11", "S12", "S13", "S14"],
        recover: ["01", "02", "03", "04", "05", "06"],
      },
      [ROUTES.xiyanTemple]: {
        unlock: ["S01", "S02", "S03", "S04", "S05", "S06", "S07", "S08", "S09", "S10", "S11", "S12", "S13", "S14"],
        recover: ["01", "02", "03", "04", "05", "06"],
      },
      [ROUTES.phoenixRoute]: {
        unlock: ["S01", "S02", "S03", "S04", "S05", "S06", "S07", "S08", "S09", "S10", "S11", "S12", "S13", "S14", "S15"],
        recover: ["01", "02", "03", "04", "05", "06", "09"],
      },
      [ROUTES.wangSupplement]: {
        unlock: ["S01", "S02", "S03", "S04", "S05", "S06", "S07", "S08", "S09", "S10", "S11", "S12", "S13", "S14", "S15", "S16"],
        recover: ["01", "02", "03", "04", "05", "06", "09"],
      },
      [ROUTES.wangDeath]: {
        unlock: ["S01", "S02", "S03", "S04", "S05", "S06", "S07", "S08", "S09", "S10", "S11", "S12", "S13", "S14", "S15", "S16", "S17", "S18"],
        recover: ["01", "02", "03", "04", "05", "06", "09", "13"],
      },
      [ROUTES.duCremation]: {
        unlock: ["S01", "S02", "S03", "S04", "S05", "S06", "S07", "S08", "S09", "S10", "S11", "S12", "S13", "S14", "S15", "S16", "S17", "S18", "S19"],
        recover: ["01", "02", "03", "04", "05", "06", "09", "13"],
      },
      [ROUTES.duCremationSigned]: {
        unlock: ["S01", "S02", "S03", "S04", "S05", "S06", "S07", "S08", "S09", "S10", "S11", "S12", "S13", "S14", "S15", "S16", "S17", "S18", "S19", "S20"],
        recover: ["01", "02", "03", "04", "05", "06", "08", "09", "13"],
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

  useEffect(() => {
    if (!deathScareActive) return;
    skipDeathScareRef.current?.focus();
    const reveal = window.setTimeout(
      () => setDeathScareTextVisible(true),
      game.settings.reducedMotion ? 0 : 160,
    );
    const enter = window.setTimeout(
      () => finishWangRecovery(),
      game.settings.reducedMotion ? 180 : 1760,
    );
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") finishWangRecovery();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.clearTimeout(reveal);
      window.clearTimeout(enter);
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [deathScareActive, finishWangRecovery, game.settings.reducedMotion]);

  useEffect(() => {
    if (!hydrated || currentPath !== ROUTES.phoenixRoute || game.routeTrips >= 3) return;

    const inspectRoutePosition = () => {
      const page = document.documentElement;
      const atBottom = window.innerHeight + window.scrollY >= page.scrollHeight - 32;
      const atTop = window.scrollY <= 32;

      if (atBottom && !game.routeReachedBottom) {
        setGame((previous) => previous.routeReachedBottom
          ? previous
          : { ...previous, routeReachedBottom: true });
        return;
      }

      if (atTop && game.routeReachedBottom) {
        setGame((previous) => {
          if (!previous.routeReachedBottom) return previous;
          const nextTrips = Math.min(3, previous.routeTrips + 1);
          return {
            ...previous,
            routeTrips: nextTrips,
            routeReachedBottom: false,
            unlocked: nextTrips === 3
              ? unique([...previous.unlocked, "S16"])
              : previous.unlocked,
          };
        });
      }
    };

    window.addEventListener("scroll", inspectRoutePosition, { passive: true });
    inspectRoutePosition();
    return () => window.removeEventListener("scroll", inspectRoutePosition);
  }, [currentPath, game.routeReachedBottom, game.routeTrips, hydrated]);

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

  function triggerWangRecovery() {
    if (game.settings.reducedScares || game.scaresSeen.includes("J03")) {
      finishWangRecovery();
      return;
    }
    setGame((previous) => ({
      ...previous,
      scaresSeen: unique([...previous.scaresSeen, "J03"]),
    }));
    setDeathScareTextVisible(false);
    setDeathScareActive(true);
  }

  function inspectStone(part: "break" | "base") {
    if (currentPath !== ROUTES.xiyanTemple || game.unlocked.includes("S15")) return;

    if (part === "break") {
      const nextBreakClicks = Math.min(6, game.stoneBreakClicks + 1);
      setGame((previous) => ({ ...previous, stoneBreakClicks: nextBreakClicks }));
      return;
    }

    if (game.stoneBreakClicks < 6) return;
    const nextBaseClicks = Math.min(7, game.stoneBaseClicks + 1);
    const completed = nextBaseClicks === 7;
    setGame((previous) => ({
      ...previous,
      stoneBaseClicks: nextBaseClicks,
      unlocked: completed ? unique([...previous.unlocked, "S15"]) : previous.unlocked,
      recovered: completed ? unique([...previous.recovered, "09"]) : previous.recovered,
      scaresSeen: completed ? unique([...previous.scaresSeen, "J02"]) : previous.scaresSeen,
    }));

    if (completed && !game.settings.reducedScares && !game.scaresSeen.includes("J02")) {
      setStoneRevealActive(true);
      window.setTimeout(() => setStoneRevealActive(false), 900);
    }
  }

  function moveAlongRoute(destination: "top" | "bottom") {
    if (currentPath === ROUTES.phoenixRoute && game.routeTrips < 3) {
      setGame((previous) => {
        if (destination === "bottom") {
          return previous.routeReachedBottom
            ? previous
            : { ...previous, routeReachedBottom: true };
        }
        if (!previous.routeReachedBottom) return previous;
        const nextTrips = Math.min(3, previous.routeTrips + 1);
        return {
          ...previous,
          routeTrips: nextTrips,
          routeReachedBottom: false,
          unlocked: nextTrips === 3
            ? unique([...previous.unlocked, "S16"])
            : previous.unlocked,
        };
      });
    }
    window.scrollTo({
      top: destination === "top" ? 0 : document.documentElement.scrollHeight,
      behavior: game.settings.reducedMotion ? "auto" : "smooth",
    });
  }

  function submitSupplementPassword(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const normalized = supplementPassword.trim().replace(/[—–\-\s]/g, "");
    if (normalized === "673") {
      mutateGame(["S17"]);
      setSupplementPasswordNote("校验通过。被删除的文字层已恢复。");
      return;
    }

    const nextAttempts = supplementPasswordAttempts + 1;
    setSupplementPasswordAttempts(nextAttempts);
    setSupplementPasswordNote(
      nextAttempts >= 3
        ? "口令不匹配。回看西岩寺的石像数量，以及尸检摘要中的面部伤口数。"
        : "口令不匹配；附件不会锁定。",
    );
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
      const merged = game.unlocked.includes("S07");
      const allowed = game.unlocked.includes("S05") || currentPath === ROUTES.history || merged;
      setResults([{
        id: merged ? "du-wanlin-redirect" : "du-nanyang-old",
        kind: allowed ? (merged ? "规范人物档案 · 已合并" : "旧人物页 · 1条") : "受限元数据 · 1条",
        title: merged ? "杜万琳（旧名：杜南阳）" : "杜南阳",
        summary: allowed
          ? (merged ? "旧姓名已永久映射到杜万琳的规范人物档案。" : "旧社团创办人。人物页显示一条目标残缺的永久重定向。")
          : "旧人物记录存在；相关组织档案尚未恢复。",
        path: allowed ? (merged ? ROUTES.duWanlin : ROUTES.duNanyangOld) : undefined,
        unlock: allowed ? ["S06"] : undefined,
        locked: !allowed,
        note: allowed ? undefined : "证据不足",
      }]);
      setResultNote(allowed ? "找到一份已从现代成员目录迁移的旧页面。" : "先恢复与此人相关的社团历史。");
      return;
    }

    if (normalized === "杜万琳") {
      const allowed = game.unlocked.includes("S06") || currentPath === ROUTES.duNanyangOld;
      setResults([{
        id: "du-wanlin",
        kind: allowed ? "合并人物档案 · 2个来源" : "现代成员 · 公开摘要",
        title: "杜万琳",
        summary: allowed
          ? "家庭、画廊与同乡记录均与旧人物杜南阳重合。"
          : "现代成员记录存在；旧姓名映射尚未恢复。",
        path: allowed ? ROUTES.duWanlin : undefined,
        unlock: allowed ? ["S07"] : undefined,
        locked: !allowed,
        note: allowed ? undefined : "缺少旧页",
      }]);
      setResultNote(allowed ? "两个姓名现在指向同一份规范档案。" : "仅凭现代成员页还不能确认身份合并。");
      return;
    }

    if (normalized === "方晚" || normalized === "fangwan") {
      const allowed = game.unlocked.includes("S07") || currentPath === ROUTES.duWanlin;
      setResults([{
        id: "fang-wan",
        kind: allowed ? "人物档案＋朗读文件" : "匿名履历 · 1条",
        title: allowed ? "方晚" : "［姓名缺失］",
        summary: allowed
          ? "杜万琳的同乡、同学与画廊合伙人；附朗读文件03。"
          : "曾辍学务农，后来赴杭州学画。姓名字段尚未开放。",
        path: allowed ? ROUTES.fangWan : undefined,
        unlock: allowed ? ["S08"] : undefined,
        recover: allowed ? ["03"] : undefined,
        locked: !allowed,
        note: allowed ? undefined : "关系未确认",
      }]);
      setResultNote(allowed ? "人物履历与无名同乡记录完全重合。" : "先确认这份履历与哪名旧成员相连。");
      return;
    }

    if (normalized === "东兴彼得") {
      const allowed = game.unlocked.includes("S08") || currentPath === ROUTES.fangWan;
      setResults([{
        id: "dongxing-peter",
        kind: allowed ? "城市旧照 · OCR缓存" : "公开地点 · 3条",
        title: "东兴彼得",
        summary: allowed
          ? "招牌文字完整；照片中的人物用手遮住半张脸。"
          : "词组存在于旧城商业记录，关联照片尚未恢复。",
        path: allowed ? ROUTES.dongxingPeter : undefined,
        unlock: allowed ? ["S09"] : undefined,
        locked: !allowed,
        note: allowed ? undefined : "图像未恢复",
      }]);
      setResultNote(allowed ? "找到一张只有文字层仍可读取的旧照片。" : "先从人物档案中取得照片索引。");
      return;
    }

    if (normalized === "王克定" || normalized === "王克订") {
      const allowed = game.unlocked.includes("S09") || currentPath === ROUTES.dongxingPeter;
      setResults([{
        id: "wang-keding",
        kind: allowed ? "人物档案＋朗读文件" : "受限人物元数据",
        title: "王克定",
        summary: allowed
          ? "旧社团关系者；公开死亡记录暂记为投河／自杀结论。"
          : "姓名存在于旧照片访客索引，正文尚未开放。",
        path: allowed ? ROUTES.wangKeding : undefined,
        unlock: allowed ? ["S10"] : undefined,
        recover: allowed ? ["04"] : undefined,
        locked: !allowed,
        note: allowed ? undefined : "来源不足",
      }]);
      setResultNote(normalized === "王克订" ? "是否查找“王克定”？" : (allowed ? "人物页同时关联一份朗读文件。" : "先找到写出这个姓名的访客笔记。"));
      return;
    }

    if (["刑万", "刑萬", "刑某"].includes(normalized)) {
      const allowed = game.unlocked.includes("S10") || currentPath === ROUTES.wangKeding;
      setResults([{
        id: "xing-wan",
        kind: allowed ? "异名合并＋朗读文件" : "新闻匿名记录",
        title: "刑万／刑某",
        summary: allowed
          ? "社团合照使用刑万，新闻缓存使用刑某；职业、位置与关联人一致。"
          : "新闻中的姓名已匿名化，尚不能与成员库互证。",
        path: allowed ? ROUTES.xingWan : undefined,
        unlock: allowed ? ["S11"] : undefined,
        recover: allowed ? ["05"] : undefined,
        locked: !allowed,
        note: allowed ? undefined : "待交叉验证",
      }]);
      setResultNote(allowed ? "“某”是新闻匿名写法，不是另一个人。" : "还需要一份写出完整姓名的旧社团材料。");
      return;
    }

    if (normalized === "莉香" || normalized === "莉香溺水") {
      const allowed = game.unlocked.includes("S11") || currentPath === ROUTES.xingWan;
      setResults([{
        id: "li-xiang-death",
        kind: allowed ? "亲属／死亡档案＋朗读文件" : "损坏关系卡",
        title: allowed ? "莉香｜溺亡记录" : "莉×",
        summary: allowed
          ? "杜家亲属、刑万关联人；记录只确认溺亡过程，不记原因与责任者。"
          : "杜家亲属。姓名第二字与死亡附件均不可读。",
        path: allowed ? ROUTES.liXiangDeath : undefined,
        unlock: allowed ? ["S12"] : undefined,
        recover: allowed ? ["06"] : undefined,
        locked: !allowed,
        note: allowed ? undefined : "字段损坏",
      }]);
      setResultNote(allowed ? "河流档案与亲属记录指向同一人。" : "先从刑万的关联人与杜彻的家庭记录交叉确认。");
      return;
    }

    if (["王克定尸检", "王克定认尸"].includes(normalized)) {
      const allowed = game.unlocked.includes("S12") || currentPath === ROUTES.liXiangDeath;
      setResults([{
        id: "wang-autopsy",
        kind: allowed ? "认尸／尸检摘要 · 1份" : "受限案件元数据",
        title: "王克定｜认尸与尸检摘要",
        summary: allowed
          ? "家属认尸记录与部分尸检文字层可读取；附件物证链接失效。"
          : "材料存在，但尚未取得河流档案的交叉索引。",
        path: allowed ? ROUTES.wangAutopsy : undefined,
        unlock: allowed ? ["S13"] : undefined,
        locked: !allowed,
        note: allowed ? undefined : "证据不足",
      }]);
      setResultNote(allowed ? "找到一份文学作品内的虚构档案。" : "先完成与河流有关的人物档案。");
      return;
    }

    if (["石立人头", "石人头"].includes(normalized)) {
      const allowed = game.unlocked.includes("S13") || currentPath === ROUTES.wangAutopsy;
      setResults([{
        id: "stone-head",
        kind: allowed ? "独立物证记录 · 1件" : "雕塑索引 · 4条",
        title: "石立人头",
        summary: allowed
          ? "与死者反绑双手连接的石物；物证来源栏仍可读取。"
          : "名称命中旧雕塑目录，但案件关联尚未开放。",
        path: allowed ? ROUTES.stoneHead : undefined,
        unlock: allowed ? ["S14"] : undefined,
        locked: !allowed,
        note: allowed ? undefined : "关联未恢复",
      }]);
      setResultNote(allowed ? "失效的物证编号已转为可读记录。" : "先从尸检摘要取得完整物证名称。");
      return;
    }

    if (["西岩寺", "西岩寺院"].includes(normalized)) {
      const allowed = game.unlocked.includes("S14") || currentPath === ROUTES.stoneHead;
      setResults([{
        id: "xiyan-temple",
        kind: allowed ? "地点档案＋石像旧照" : "公开地点介绍",
        title: "西岩寺｜后山石像档案",
        summary: allowed
          ? "物证来源地；旧照说明院墙内曾排列六十七尊等身像。"
          : "寺院公开介绍可读；后山档案尚未与物证互证。",
        path: allowed ? ROUTES.xiyanTemple : undefined,
        locked: !allowed,
        note: allowed ? undefined : "档案未关联",
      }]);
      setResultNote(allowed ? "地点与物证来源字段完全一致。" : "先确认是哪一件物证来自这里。");
      return;
    }

    if (["凤凰水库", "凤凰水庫", "鳳凰水庫"].includes(normalized)) {
      const allowed = game.unlocked.includes("S15");
      setResults([{
        id: "phoenix-reservoir",
        kind: allowed ? "河流路线附件 · 批注缺失" : "公开地点介绍",
        title: "凤凰水库｜尸体漂流路线",
        summary: allowed
          ? "从上游至水库的路线可读；三层勘验批注尚未复原。"
          : "地点存在于报告摘要；石像隐藏层尚未恢复。",
        path: allowed ? ROUTES.phoenixRoute : undefined,
        locked: !allowed,
        note: allowed ? undefined : "证据层未完成",
      }]);
      setResultNote(allowed ? "路线附件已打开，需要沿水流来回核对。" : "先完成西岩寺石像档案中的检查。");
      return;
    }

    if (["小手指", "右手小指"].includes(normalized)) {
      const allowed = game.routeTrips >= 3 || game.unlocked.includes("S16");
      setResults([{
        id: "wang-supplement",
        kind: allowed ? "加密附件 · 尸检补充" : "伤口索引 · 元数据",
        title: "王克定｜尸检补充",
        summary: allowed
          ? "右手小指缺失一截；创口时间早于溺水。附件需要口令。"
          : "伤口条目存在；完整路线批注尚未恢复。",
        path: allowed ? ROUTES.wangSupplement : undefined,
        locked: !allowed,
        note: allowed ? "需要口令" : "证据不足",
      }]);
      setResultNote(allowed ? "加密附件已定位。提示：石像数量－面部伤口数。" : "先完成三次尸体路线回溯。");
      return;
    }

    if (normalized === "王克定之死") {
      const allowed = game.unlocked.includes("S17");
      if (allowed) {
        setResults(null);
        setResultNote("");
        triggerWangRecovery();
      } else {
        setResults([{
          id: "wang-death-locked",
          kind: "文学文件 · 受限元数据",
          title: "5.2 王克定之死",
          summary: "文件存在，当前版本不可访问。",
          locked: true,
          note: "缺少尸检补充",
        }]);
        setResultNote("同名文件尚不能由现有证据打开。");
      }
      return;
    }

    if (["火化单", "焚烧签字单", "火化签字单"].includes(normalized)) {
      const allowed = game.recovered.includes("13") || currentPath === ROUTES.wangDeath;
      setResults([{
        id: "du-cremation",
        kind: allowed ? "死亡手续扫描件 · 1份" : "受限文件元数据",
        title: "杜万琳｜火化单",
        summary: allowed
          ? "姓名与火化状态可读；代签栏仍被遮挡。"
          : "文件名存在于版本历史；来源文件尚未恢复。",
        path: allowed ? ROUTES.duCremation : undefined,
        unlock: allowed ? ["S19"] : undefined,
        locked: !allowed,
        note: allowed ? undefined : "来源不足",
      }]);
      setResultNote(allowed ? "找到一份纸边焦黑的手续扫描件。" : "先恢复把这份手续写入版本历史的文学文件。");
      return;
    }

    if (["方晚署名", "方晚火化单", "方晚代签"].includes(normalized)) {
      const hasProcedure = game.unlocked.includes("S19") || currentPath === ROUTES.duCremation;
      const hasPerson = game.visited.includes(ROUTES.fangWan);
      const allowed = hasProcedure && hasPerson;
      setResults([{
        id: "du-cremation-signed",
        kind: allowed ? "完整文字层＋朗读文件" : "人物／手续交叉结果",
        title: allowed ? "杜万琳｜完整火化单" : "方晚 × 火化单",
        summary: allowed
          ? "代签栏遮挡已解除；附朗读文件08《自白》。"
          : hasProcedure
            ? "手续已找到，但需先查看方晚人物档案确认关系。"
            : "人物档案存在；相关死亡手续尚未开放。",
        path: allowed ? ROUTES.duCremationSigned : undefined,
        unlock: allowed ? ["S20"] : undefined,
        recover: allowed ? ["08"] : undefined,
        locked: !allowed,
        note: allowed ? undefined : "交叉证据不足",
      }]);
      setResultNote(allowed ? "人物履历与手续代签栏互相补全。" : "必须同时看过人物档案和遮挡版手续。");
      return;
    }

    if (normalized === "他山地方公墓贪污案") {
      const allowed = game.unlocked.includes("S20") || currentPath === ROUTES.duCremationSigned;
      setResults([{
        id: "cemetery-case-next",
        kind: allowed ? "案件索引 · 已定位" : "受限项目元数据",
        title: "他山地方公墓贪污案",
        summary: allowed
          ? "火化单与项目往来首次共享完整案名；正文将在下一章恢复。"
          : "项目名存在，但参与者与死亡手续尚未完成交叉。",
        locked: true,
        note: allowed ? "下一章入口" : "证据不足",
      }]);
      setResultNote(allowed ? "第三章完成：个人死亡开始汇入同一项目。" : "先恢复完整火化单与方晚的自白。");
      return;
    }

    if (["尸检", "尸检报告", "认尸记录"].includes(normalized)) {
      markWrong("同类材料过多；莉香档案给出了另一名死者的姓名。", [{
        id: "autopsy-public",
        kind: "档案类型 · 7条",
        title: "认尸／尸检摘要",
        summary: "请把文件类型与死者姓名组合搜索。",
        locked: true,
      }]);
      return;
    }

    if (normalized === "佛头") {
      markWrong("“佛头”命中公开寺院介绍，案件记录使用更具体的物证名。", [{
        id: "buddha-public",
        kind: "公开地点资料",
        title: "西岩寺石刻介绍",
        summary: "复制尸检摘要中的原始名词，才能打开独立物证页。",
        locked: true,
      }]);
      return;
    }

    if (normalized === "凤凰" || normalized === "鳳凰") {
      markWrong("“凤凰”命中多个公开地点；报告写出了完整的漂流终点。", [{
        id: "phoenix-public",
        kind: "公开地点 · 6条",
        title: "凤凰",
        summary: "请使用带地点类型的完整名称。",
        locked: true,
      }]);
      return;
    }

    if (normalized === "小指") {
      setResults([{
        id: "little-finger-meta",
        kind: "伤口索引 · 元数据",
        title: "右手小指／补充附件",
        summary: "附件名可见，但搜索词不足以验证路线中的完整批注。",
        locked: true,
        note: "补全伤口名称",
      }]);
      setResultNote("回到第三层路线批注，使用其中的完整写法。");
      return;
    }

    if (normalized === "王克定死") {
      setResults([{
        id: "wang-death-meta",
        kind: "文学文件 · 元数据",
        title: "5.2 王克定之死",
        summary: "标题可辨，但文件仍需要精确名称与尸检补充权限。",
        locked: true,
        note: "当前不可访问",
      }]);
      setResultNote("文章标题就是人名加上事件。");
      return;
    }

    if (normalized === "死亡证明") {
      setResults([{
        id: "death-summary-public",
        kind: "医院摘要 · 1条",
        title: "杜万琳｜死亡摘要",
        summary: "表面记录为病逝／肝病相关；后续手续另有名称。",
        locked: true,
        note: "仅摘要",
      }]);
      setResultNote("继续查找死亡之后用于处理遗体的手续。");
      return;
    }

    if (normalized === "南阳") {
      markWrong("“南阳”命中旧年表摘要，但还不是完整姓名。", [{
        id: "nanyang-history",
        kind: "旧社团年表",
        title: "创办人：杜南阳",
        summary: "请使用年表中的完整姓名继续搜索。",
        locked: true,
      }]);
      return;
    }

    if (normalized === "彼得") {
      markWrong("“彼得”命中多条公开记录，旧照片使用的是四字完整招牌。", [{
        id: "peter-public",
        kind: "公开记录 · 4条",
        title: "彼得",
        summary: "范围过宽；请回到照片的OCR转录。",
        locked: true,
      }]);
      return;
    }

    if (normalized === "莉") {
      markWrong("只找到一张姓名损坏的关系卡。", [{
        id: "li-relation",
        kind: "损坏关系卡",
        title: "莉×",
        summary: "杜家亲属；刑万关联人。第二字缺失。",
        locked: true,
      }]);
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
      case ROUTES.duNanyangOld:
        return <DuNanyangOldPage />;
      case ROUTES.duWanlin:
        return <DuWanlinPage />;
      case ROUTES.fangWan:
        return <FangWanPage />;
      case ROUTES.dongxingPeter:
        return <DongxingPeterPage />;
      case ROUTES.wangKeding:
        return <WangKedingPage />;
      case ROUTES.xingWan:
        return <XingWanPage />;
      case ROUTES.liXiangDeath:
        return <LiXiangDeathPage />;
      case ROUTES.wangAutopsy:
        return <WangAutopsyPage />;
      case ROUTES.stoneHead:
        return <StoneHeadEvidencePage />;
      case ROUTES.xiyanTemple:
        return <XiyanTemplePage
          breakClicks={game.stoneBreakClicks}
          baseClicks={game.stoneBaseClicks}
          completed={game.unlocked.includes("S15")}
          revealActive={stoneRevealActive}
          reducedScares={game.settings.reducedScares}
          assisted={game.settings.assistedInteraction}
          onInspect={inspectStone}
        />;
      case ROUTES.phoenixRoute:
        return <PhoenixRoutePage
          trips={game.routeTrips}
          reachedBottom={game.routeReachedBottom}
          reducedMotion={game.settings.reducedMotion}
          onMove={moveAlongRoute}
        />;
      case ROUTES.wangSupplement:
        return <WangSupplementPage
          unlocked={game.unlocked.includes("S17")}
          password={supplementPassword}
          passwordVisible={supplementPasswordVisible}
          attempts={supplementPasswordAttempts}
          note={supplementPasswordNote}
          onPasswordChange={setSupplementPassword}
          onTogglePassword={() => setSupplementPasswordVisible((visible) => !visible)}
          onSubmit={submitSupplementPassword}
        />;
      case ROUTES.wangDeath:
        return <WangDeathPage />;
      case ROUTES.duCremation:
        return <DuCremationPage revealed={false} />;
      case ROUTES.duCremationSigned:
        return <DuCremationPage revealed />;
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
                {RECOVERED_FILES.map((file) => {
                  const found = game.recovered.includes(file.id);
                  return <li key={file.id} className={found ? "is-found" : ""}><span>{file.id}</span><div><b>{found ? file.title : "未恢复"}</b><small>{found ? `来源：${file.source}` : "文件名未知"}</small></div></li>;
                })}
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

      <p className="sr-only" aria-live="polite">{searchSummary}{currentPath === ROUTES.dimensions ? `空框已检查 ${game.frameClicks} 次。` : ""}{currentPath === ROUTES.xiyanTemple ? `断口已检查 ${game.stoneBreakClicks} 次，石座已检查 ${game.stoneBaseClicks} 次。` : ""}{currentPath === ROUTES.phoenixRoute ? `河流路线已完成 ${game.routeTrips} 次往返。` : ""}</p>

      {scareActive && (
        <div className="scare-layer" role="dialog" aria-modal="true" aria-label="短暂黑场提示"><button ref={skipScareRef} type="button" onClick={finishMangRecovery}>跳过</button><p className={scareTextVisible ? "is-visible" : ""}>先听见，后看见。</p></div>
      )}

      {deathScareActive && (
        <div className="deleted-post-scare" role="dialog" aria-modal="true" aria-label="已删除帖子" onClick={finishWangRecovery}>
          <button ref={skipDeathScareRef} type="button" onClick={(event) => { event.stopPropagation(); finishWangRecovery(); }}>跳过</button>
          <article className={deathScareTextVisible ? "is-visible" : ""}>
            <span>帖子 302｜已删除</span>
            <p>他们已经替王克定写好了一种死法。</p>
            <strong>但绳结不会替人作证。</strong>
          </article>
        </div>
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
      <section className="prototype-end"><span>旧索引未闭合</span><div><h2>创办人没有出现在现代成员表。</h2><p>从旧年表中的姓名继续搜索。不要先猜他的新名字。</p></div></section>
    </article>
  );
}

function RecoveredScript({ id, section, title, reader, children }: { id: string; section: string; title: string; reader: string; children: ReactNode }) {
  return (
    <section className="embedded-script">
      <header>
        <div><ArtifactTag>已恢复 {id} / 14</ArtifactTag><span>{section}</span></div>
        <span className="recovered-seal">RECOVERED</span>
      </header>
      <div className="embedded-script-title"><h2>{title}</h2><p>朗读声部：{reader}</p></div>
      <div className="poem-body">{children}</div>
    </section>
  );
}

function DuNanyangOldPage() {
  return (
    <article className="person-page old-person-page">
      <header className="person-masthead">
        <div><CacheStamp>PERSON CACHE / LEGACY</CacheStamp><p className="section-kicker">旧社团人物页 · 迁移前版本</p><h1>杜南阳</h1><p>旧年表中的创办人。现代成员目录没有这个名字。</p></div>
        <div className="broken-portrait" role="img" aria-label="此人物页已迁移；旧头像无法载入"><span>PORTRAIT 301</span><b>此人物页已迁移</b></div>
      </header>

      <section className="person-evidence-grid">
        <dl className="dossier-facts">
          <MetaLine label="身份">憎恶社创办人之一</MetaLine>
          <MetaLine label="家庭">配偶：徐惠；育有一子</MetaLine>
          <MetaLine label="经营">县城画廊</MetaLine>
          <MetaLine label="同乡／同学">方晚</MetaLine>
          <MetaLine label="活动地">杭州 → 阔南</MetaLine>
        </dl>
        <div className="redirect-card">
          <span>HTTP 301 / PERMANENT</span>
          <h2>永久重定向目标损坏</h2>
          <code>/members/du＿lin</code>
          <p>迁移记录仍保留同一配偶、画廊与同乡关系，目标姓名的中间字段被覆盖。</p>
        </div>
      </section>

      <section className="source-note"><span>来源差异</span><p>本页使用旧姓名。不要将年代不同当作两个人；先补全重定向后的规范姓名。</p></section>
    </article>
  );
}

function DuWanlinPage() {
  return (
    <article className="person-page merged-person-page">
      <header className="person-masthead">
        <div><CacheStamp>IDENTITY MERGE / 02 SOURCES</CacheStamp><p className="section-kicker">规范人物档案</p><h1 className="overwritten-name" aria-label="杜万琳，旧名杜南阳"><span aria-hidden="true">杜南阳</span><b aria-hidden="true">杜万琳</b></h1><p>两个姓名的家庭、画廊与人际关系完全重合，系统已建立双向映射。</p></div>
        <div className="identity-status"><span>合并状态</span><b>CONFIRMED</b><small>旧名仍保留在来源标签中</small></div>
      </header>

      <section className="identity-compare" aria-label="两份人物来源对照">
        <div><span>旧社团年表</span><h2>杜南阳</h2><p>徐惠的丈夫</p><p>经营县城画廊</p><p>方晚的同乡、同学</p></div>
        <div className="identity-equals" aria-hidden="true">＝</div>
        <div><span>现代人物库</span><h2>杜万琳</h2><p>徐惠的丈夫</p><p>经营同一画廊</p><p>同一位同乡合伙人</p></div>
      </section>

      <section className="anonymous-profile">
        <header><span>关联履历 / 姓名层损坏</span><b>同乡记录 FW—12</b></header>
        <div><h2>［姓名被遮挡］</h2><p>家中反对学画，曾辍学务农，在果园劳动；后来以“学手艺”为名赴杭州学画。毕业后与杜万琳保持往来，并共同经营画廊。</p></div>
        <footer>交叉字段：同乡 · 同学 · 果园 · 杭州 · 画廊</footer>
      </section>
    </article>
  );
}

function FangWanPage() {
  return (
    <article className="person-page">
      <header className="person-masthead">
        <div><CacheStamp>MEMBER FILE / FW—12</CacheStamp><p className="section-kicker">旧社团人物档案</p><h1>方晚</h1><p>杜万琳的同乡、同学与画廊合伙人。履历由旧成员回忆与朗读稿交叉恢复。</p></div>
        <dl className="person-quick-facts"><MetaLine label="来源">川中</MetaLine><MetaLine label="经历">辍学务农／赴杭州学画</MetaLine><MetaLine label="关联">杜万琳 · 王克定</MetaLine></dl>
      </header>

      <section className="person-evidence-grid">
        <div className="biography-sheet"><span>履历摘要</span><p>家中反对他学画。他曾中断学业、在果园劳动，恢复学业后前往杭州。春节留校创作的一幅作品，后来被旧成员称作加入憎恶社的“投名状”。</p><p>毕业后，他开过小卖店，经历再婚；与杜万琳保持往来，后来共同经营画廊。</p></div>
        <figure className="lost-photo-card" aria-label="旧照片图像层遗失；OCR转录显示招牌为东兴彼得">
          <div><span>PHOTO LAYER LOST</span><b>图像层不可读取</b><small>文字识别层仍在</small></div>
          <figcaption><span>OCR / 招牌</span><strong>东兴彼得</strong><p>照片人物以手遮住半张脸。</p></figcaption>
        </figure>
      </section>

      <RecoveredScript id="03" section="瞽人篇 · 1.2" title="方晚" reader="杜万琳">
        <p>如今想不起他究底怎样<br />诸如模样、年龄、生平喜恶<br />身边女人（如今是他的妻子或者情人）应该活得很好</p>
        <p>印象里总是面色憔然。毕业后<br />我们之间互有往来，得知他开了<br />自己的小卖店，之后是再婚</p>
        <p>娶了高中校友。让我们心怀诚恳地<br />赞美他的新感情就像受树之荫<br />也得为这一份破隳又拼接的感情<br />写上“此事良久”的尾注。</p>
        <p>你说在东门外见过他，这样讲：<br />左臂稍长，遇着朋友的拥抱两手<br />的时机总有相差。发密遮耳后束为髻<br />不生油不显燥，像八十年代的老艺术家。</p>
        <p>男人之肉，难于从中辨认属于<br />澎湃雄性的力量，像暴力边沿的<br />晚霞，从树与楼的夹缝中依稀瞥见。</p>
      </RecoveredScript>
    </article>
  );
}

function DongxingPeterPage() {
  return (
    <article className="photo-record-page">
      <header className="index-head"><div><p className="section-kicker">城市旧照 · 文字层缓存</p><h1>东兴彼得</h1></div><p>照片本体在迁移中遗失；OCR、替代文字和访客笔记仍可读取。</p></header>

      <section className="photo-transcript">
        <div className="photo-index"><span>DX—P / 04</span><b>扫描状态：IMAGE LOST</b><small>缩放不影响文字层</small></div>
        <div className="photo-description"><span>替代文字</span><p>一名男子站在“东兴彼得”的招牌下面，以手遮住半张脸。背后可见塑胶模特与店内唯一的内衣柜台。</p></div>
        <div className="ocr-strip"><span>OCR</span><strong>东兴彼得</strong><i>置信度 98%</i></div>
      </section>

      <section className="visitor-note">
        <header><span>访客笔记 / 未公开</span><b>#302</b></header>
        <blockquote>“他说自己没有结婚，住在西门车站的政府廉租房，从窗口可以看见湖。回来时，他仍旧把半张脸藏在手后。”</blockquote>
        <footer>记录对象：<strong>王克定</strong></footer>
      </section>
    </article>
  );
}

function WangKedingPage() {
  return (
    <article className="person-page case-person-page">
      <header className="person-masthead">
        <div><CacheStamp>PERSON / CASE LINKED</CacheStamp><p className="section-kicker">人物档案 · 公开结论层</p><h1>王克定</h1><p>旧社团关系者。现阶段只展示公开记录；后续物证尚未并入此页。</p></div>
        <div className="public-conclusion"><span>公开死亡记录</span><b>投河</b><strong>结论：自杀</strong><small>该结论尚未经过交叉验证</small></div>
      </header>

      <section className="person-evidence-grid">
        <dl className="dossier-facts"><MetaLine label="婚姻">本人称未婚</MetaLine><MetaLine label="居所">西门车站附近廉租房</MetaLine><MetaLine label="窗景">可见湖泊</MetaLine><MetaLine label="照片特征">长期遮住半张脸</MetaLine><MetaLine label="关联">杜万琳 · 方晚 · 刑万</MetaLine></dl>
        <div className="group-photo-transcript"><span>社团合照 / 背注转录</span><ol><li>杜南阳</li><li>方晚</li><li>王克定</li><li className="next-name">刑万</li></ol><p>新闻缓存没有“刑万”这一完整姓名，只出现“刑某”。</p></div>
      </section>

      <RecoveredScript id="04" section="瞽人篇 · 1.3" title="王克定" reader="方晚">
        <p>王克定从没这样<br />掩着半张脸。站在“东兴彼得”的<br />招牌下面。像许多年前结婚的朋友<br />一个业务经理。</p>
        <p>他说这几年带着受人威迫的钱款<br />穿过那些泥淖，人和人拥簇一起，穿过<br />那些旁窥的车窗玻璃。</p>
        <p>有人告诉他：“这是你的妻子。”<br />“我没结婚。”他说。像毒蝮蛇的<br />上颚刺穿一样的夜晚，我渡过了很多。</p>
        <p>“我没结婚。”不婚不育，住在西门车站的<br />政府廉租房，窗口的角度看得见湖，那里每年<br />都有赎买虚无的年轻人。</p>
        <p>我搬出廉租房。凭着扑簌的碎银<br />找到湖水。像曾经在窗口目视的一样<br />目视着来向，冀望得到某些鸟<br />记录城市的视觉。</p>
        <p>王克定从没这样掩着半张脸讲故事，<br />在“东兴彼得”的招牌下面。<br />残酷的一部分事实：<br />我们早已失去飞和描状形体的本事了。</p>
      </RecoveredScript>
    </article>
  );
}

function XingWanPage() {
  return (
    <article className="person-page merged-person-page">
      <header className="person-masthead">
        <div><CacheStamp>NAME CROSS-REFERENCE / XW</CacheStamp><p className="section-kicker">异名合并人物档案</p><h1>刑万 <small>／刑某</small></h1><p>“某”来自新闻匿名化处理。旧合照、职业位置和关联人物确认两种写法指向同一人。</p></div>
        <div className="identity-status"><span>映射状态</span><b>刑万 ⇄ 刑某</b><small>来源名称不被覆盖</small></div>
      </header>

      <section className="alias-source-grid">
        <div><span>社团合照</span><h2>刑万</h2><p>旧成员背注使用完整姓名。</p></div>
        <div><span>新闻缓存</span><h2>刑某</h2><p>报道以“某”替代名字。</p></div>
        <div className="damaged-relation"><span>关联人物</span><h2>莉×</h2><p>杜家亲属 · 第二字损坏</p></div>
      </section>

      <RecoveredScript id="05" section="瞽人篇 · 1.4" title="在兰道" reader="刑万">
        <p>紧张是一时的，去兰道看好的戏法吧<br />一环重一环。也无关抒情了<br />仅是绘画带来的乐趣已不足捱过昨夜</p>
        <p>更棒的譬如抛球，三个轮着转圈<br />这已是次点。甭说那些迷人眼的扑克骗术<br />会更高明么？</p>
        <p>当消愁时候喝多酒，你眼你耳<br />你神经你的嗅觉都高明地捂骗你<br />在水之花仿佛捧在手心。</p>
        <p>棋差一招指的是理智偏偏<br />压住你一跃而下或抽刀刺腕。</p>
        <p>为了这趟谎我们都要活去四十岁<br />给彼此办葬礼。其实这样算下来<br />帷幕足够大了，躲在其后那些拙劣的把戏<br />总把人骗得最深。</p>
      </RecoveredScript>
    </article>
  );
}

function LiXiangDeathPage() {
  return (
    <article className="death-record-page water-record">
      <header className="death-record-head">
        <div><CacheStamp>DEATH RECORD / WATER DAMAGED</CacheStamp><p className="section-kicker">亲属档案 · 河流记录</p><h1>莉香</h1><p>姓名由刑万关联栏、杜家亲属记录与朗读稿共同补全。</p></div>
        <div className="death-status"><span>死亡过程</span><b>溺亡</b><small>不记录原因与责任主体</small></div>
      </header>

      <section className="water-dossier">
        <dl><MetaLine label="姓名">莉香</MetaLine><MetaLine label="地点">T县河流</MetaLine><MetaLine label="过程">溺亡</MetaLine><MetaLine label="发现时间">未记载</MetaLine><MetaLine label="目击记录">未记载</MetaLine><MetaLine label="责任主体">未记载</MetaLine></dl>
        <div className="kinship-note"><span>亲属关系合并</span><p>杜万琳的妹妹；早期诗稿亦写作堂妹。杜彻称她为未曾谋面的姑姑。</p><p>刑万的童年记忆与她相连，但现有材料没有补写婚姻或死亡原因。</p></div>
      </section>

      <section className="case-crossref"><span>交叉附件</span><div><h2>另一名河中死者</h2><p>人物：王克定</p><p>材料类型：认尸／尸检摘要</p></div><code>INDEX AVAILABLE · BODY LOCKED</code></section>

      <RecoveredScript id="06" section="阔南篇 · 2.1" title="溺水的莉香" reader="刑万">
        <p>T县热的夏天六月煞人心气<br />这段时间过完十岁生日的男孩<br />学着向街里同龄女孩表现——<br />像是爬树或者吹口哨。</p>
        <p>偶尔也游水，湿的裤衩紧着大胯。<br />抬头两两三三之间推搡玩闹<br />要么是较量潜水的功夫<br />另外的人光着身子坐岸上打水漂。</p>
        <p>疲累之余提早一步去小店<br />买廉价雪糕，没拆开包装的<br />刚登岸水渍拉紧皮肤。</p>
        <p>和河流只隔了一个周末的距离。<br />肚腹鼓胀，夏天撺掇的猛火<br />跳上灼灼而炽的死畜尸首<br />你觉得它随时可能点燃这批炸药。</p>
        <p>但引线攥她手里。她名字叫莉香。</p>
        <p>也知道她堂哥是“阔南区”开画廊的杜万琳<br />你又想出一册浸水的油画册<br />分散的丙烯颜料和这些无关紧要称呼<br />连着汗也一齐出现她掌心。</p>
        <p>朋友觉得你泳得并不好，开起玩笑<br />可不在乎，你有更好的乐趣、更完整的命。<br />哪怕她此刻并未站在这河流中某一岸，<br />甚至从未搭过一句话。</p>
        <p>你要去打招呼呢，<br />可淹没着你半部身子的河水——<br />身体已经旧了。</p>
        <p>啊，你想起那位莉香<br />就此时已是许多年前的事了。</p>
      </RecoveredScript>

      <section className="prototype-end"><span>第三章入口已定位</span><div><h2>河流档案指向一份尸检摘要。</h2><p>下一步需要把另一名死者的姓名与材料类型组合起来搜索。</p></div></section>
    </article>
  );
}

function WangAutopsyPage() {
  return (
    <article className="autopsy-page">
      <header className="evidence-masthead">
        <div><CacheStamp>FORENSIC CACHE / WK-01</CacheStamp><p className="section-kicker">亲属认尸记录 · 尸检摘要</p><h1>王克定</h1><p>两份损坏材料的文字层被并置保存；以下内容只复述可交叉确认的现场状态。</p></div>
        <div className="document-notice"><span>档案性质</span><b>文学改编／虚构界面</b><small>无公章 · 无机构名称</small></div>
      </header>

      <section className="autopsy-layout">
        <div className="scan-sheet">
          <header className="scan-sheet-head"><span>尸体辨认摘要</span><code>WK / BODY / PARTIAL</code></header>
          <dl className="scan-fields">
            <MetaLine label="辨认人">母亲、表哥</MetaLine>
            <MetaLine label="身长">约 1.6 米</MetaLine>
            <MetaLine label="双手">反绑于身后</MetaLine>
            <MetaLine label="连接物">数公斤重石立人头</MetaLine>
            <MetaLine label="面部">脸颊三道割伤</MetaLine>
            <MetaLine label="漂流终点">凤凰水库</MetaLine>
          </dl>
          <span className="scan-mark" aria-hidden="true">复印件</span>
        </div>
        <aside className="transcription-panel">
          <ArtifactTag>转录层 02</ArtifactTag>
          <h2>反绑与坠物</h2>
          <p>死者双手在背后受束，并与石质人头像连接。原记录将石头像来源指向西岩寺后山。</p>
          <p>尸表另见脸颊三道伤痕。关于漂流与伤痕形成方式的表面解释，仍需沿河流路线复核。</p>
          <div className="evidence-callout"><span>物证索引</span><strong>石立人头</strong><code>SOURCE FIELD AVAILABLE</code></div>
        </aside>
      </section>
      <p className="literary-disclaimer">此页是依据用户提供文学文本制作的游戏档案，不对应现实司法文书。</p>
    </article>
  );
}

function StoneHeadEvidencePage() {
  return (
    <article className="stone-evidence-page">
      <header className="evidence-masthead">
        <div><CacheStamp>EVIDENCE OBJECT / ST-67</CacheStamp><p className="section-kicker">物证记录 · 石质残件</p><h1>石立人头</h1><p>照片层保留为干燥状态。异常痕迹并不在这份初始物证页出现。</p></div>
        <div className="document-notice"><span>状态</span><b>入库照片</b><small>色彩未校正</small></div>
      </header>
      <figure className="evidence-photo">
        {/* Generated archival asset is already WebP-compressed and uses the runtime base path. */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={browserPath("/archive/stone-head-evidence.webp")} alt="灰黑背景下干燥、断裂的石质佛头档案照片" />
        <figcaption><span>图像编号 ST-67-A</span><p>颈部断口干燥；此页未检出红色液体痕迹。</p></figcaption>
      </figure>
      <section className="evidence-ledger">
        <dl><MetaLine label="物件">石质立人头像残件</MetaLine><MetaLine label="重量">数公斤（原文未给精确值）</MetaLine><MetaLine label="辨认来源">西岩寺后山</MetaLine><MetaLine label="关联">王克定尸体反绑处</MetaLine></dl>
        <div><span>旧照附注</span><p>寺院后山曾排列六十七尊等身石像。断口与石座被分列为两个检查区域。</p><code>RELATED PLACE INDEX: 西岩寺</code></div>
      </section>
    </article>
  );
}

function XiyanTemplePage({
  breakClicks,
  baseClicks,
  completed,
  revealActive,
  reducedScares,
  assisted,
  onInspect,
}: {
  breakClicks: number;
  baseClicks: number;
  completed: boolean;
  revealActive: boolean;
  reducedScares: boolean;
  assisted: boolean;
  onInspect: (part: "break" | "base") => void;
}) {
  const showCounts = assisted || breakClicks > 0 || baseClicks > 0;
  return (
    <article className="temple-page">
      <header className="evidence-masthead">
        <div><CacheStamp>PLACE CACHE / XY-67</CacheStamp><p className="section-kicker">西岩寺 · 后山旧照</p><h1>六十七尊</h1><p>旧图说明写着：等身石像从主殿排列至寝房。最后一尊只剩下头部与石座。</p></div>
        <div className="document-notice"><span>检查规则</span><b>六／七</b><small>断口在先，石座在后</small></div>
      </header>

      <section className={`stone-inspection${completed ? " is-complete" : ""}${revealActive ? " is-revealing" : ""}`}>
        <div className="stone-image-stage">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={browserPath("/archive/stone-head-evidence.webp")} alt="可检查的断裂石质佛头；断口与底座分别设有互动区域" />
          <span className="seep-line" aria-hidden="true" />
          <div className="stone-hotspots">
            <button className="stone-hotspot break-hotspot" type="button" onClick={() => onInspect("break")} aria-label={`检查佛头断口，已检查 ${breakClicks} 次`}><span>检查断口</span></button>
            <button className="stone-hotspot base-hotspot" type="button" onClick={() => onInspect("base")} disabled={breakClicks < 6} aria-label={`检查石座，已检查 ${baseClicks} 次`}><span>检查石座</span></button>
          </div>
        </div>
        <div className="stone-controls">
          <div><span>图像检查</span><h2>{completed ? "断口出现一条细红渗痕。" : breakClicks < 6 ? "先确认颈部断口。" : "断口已标记；现在检查石座。"}</h2><p>没有声音、喷溅或闪烁。痕迹只在完成既定顺序后出现。</p></div>
          {showCounts && <div className="stone-counts" aria-live="polite"><span>断口 <b>{breakClicks}/6</b></span><span>石座 <b>{baseClicks}/7</b></span></div>}
          {completed && reducedScares && <p className="static-scare-note">减少惊吓：断口出现一条细红渗痕（静态替代）。</p>}
        </div>
      </section>

      <section className="xiyan-archive"><span>旧照转录</span><p>“六十七个等身像放在院墙，摆做一排。从主殿一直列到寝房。”</p><code>67 → 6 / 7</code></section>

      {completed && (
        <RecoveredScript id="09" section="句肉篇 · 3.2" title="浣石" reader="方晚">
          <p>之后两年我一直想起<br />合伙做生意前的日子<br />那时还没接受政府的招标项目<br />得空就沿着西岩寺外小路<br />走一个上午。人们不知道<br />周末了无人烟的西岩寺<br />为何总有履印刻蚀在<br />寺门外一圈复叠一圈。</p>
          <p>那时候你那凿石为佛的朋友<br />还健在，仍挥得起重几斤的<br />铁椎拟物刻像。<br />彼此身形都很完整<br />肝脏那么新鲜喜欢看<br />这人老派的造佛艺术<br />你能听到的敲击声往往是<br />一整个早晨，短促而惶惑。</p>
          <p>六十七个等身像放在院墙<br />摆做一排。从主殿一直列到寝房。<br />到染疾逝世前两年<br />他没再雕。终日看着那些<br />逐步抵达释迦牟尼佛的仿品<br />在露天坝子被雨洗刷。</p>
          <p>这故事讲并得不干净<br />你确切的脸容从那时便屡屡浮现<br />读颂经文的幸福感。被山雨乔装的<br />刀将佛面刻在腹下那么暗淡<br />像不啻宗门还俗的头陀。这是<br />为你刻造的石躯，山间昏暗的光<br />我们从中认出一张最隳败的脸。</p>
          <p>左右反复比对。石英质地的胚子<br />青苔在其上缘皲裂纵向长开。<br />凹陷处晨露汇作一处。</p>
          <p>你说那立像眼角窜流的水<br />多年后会同样出现在<br />你我二人的眼角。像我们各自<br />抵达的圆寂，你掏出雄踞在你<br />中庭的肝脏，它如磐石，反复洗濯。<br />到进炉火前它已很干净了。</p>
        </RecoveredScript>
      )}
    </article>
  );
}

function PhoenixRoutePage({ trips, reachedBottom, reducedMotion, onMove }: { trips: number; reachedBottom: boolean; reducedMotion: boolean; onMove: (destination: "top" | "bottom") => void }) {
  return (
    <article className="river-route-page" id="route-top">
      <header className="route-head">
        <div><CacheStamp>ROUTE RECONSTRUCTION / PHX</CacheStamp><p className="section-kicker">水路复核 · 上游至凤凰水库</p><h1>逆读一条河</h1><p>顺流只能得到结论；折返才会显出被覆盖的批注。</p></div>
        <div className="route-progress"><span>完整往返</span><b>{trips}/3</b><small>{reachedBottom ? "已到下游，返回上游" : "从上游前往下游"}</small></div>
      </header>

      <div className="river-track" aria-label="王克定尸体漂流路线">
        <span className="river-spine" aria-hidden="true" />
        <section className="river-stop"><span>00 / 上游</span><h2>老城河入口</h2><p>记录把这里列作可能的入水区，却没有保留可靠目击证词。</p>{trips >= 1 && <aside className="route-annotation">水位批注：当周河水不足以覆盖岸边全部石面。</aside>}</section>
        <section className="river-stop"><span>01 / 石滩</span><h2>第一处弯道</h2><p>原解释称面部伤口可能来自漂流中撞击河石。</p>{trips >= 2 && <aside className="route-annotation">时间批注：伤口状态与长距离漂流的单一解释不能完全闭合。</aside>}</section>
        <section className="river-stop"><span>02 / 闸口</span><h2>废弃测量点</h2><p>绳结、石质坠物与水流方向被分开记录，从未在同一张表中对照。</p>{trips >= 2 && <aside className="route-annotation">复核批注：先验结论遮住了反绑这一事实。</aside>}</section>
        <section className="river-stop"><span>03 / 回水</span><h2>低速水域</h2><p>漂流路线在此变缓，随后进入水库。</p>{trips >= 3 && <aside className="route-annotation pinky-reveal">伤口批注：右手小指缺失；切口时间早于落水。</aside>}</section>
        <section className="river-stop route-reservoir" id="route-bottom"><span>04 / 下游</span><h2>凤凰水库</h2><p>尸体在这里被发现。河流记录至此结束，但尸检附件仍缺少一页。</p></section>
      </div>

      <div className="route-controls" aria-label="河流路线操作">
        <button type="button" onClick={() => onMove("bottom")}><ArrowDown aria-hidden="true" />到下游</button>
        <span>{reducedMotion ? "即时移动" : "沿路线移动"}</span>
        <button type="button" onClick={() => onMove("top")}><ArrowUp aria-hidden="true" />回上游</button>
      </div>
      {trips >= 3 && <section className="prototype-end"><span>补充附件已定位</span><div><h2>被漏记的部位：右手小指。</h2><p>用部位名称搜索尸检补充记录。</p></div></section>}
    </article>
  );
}

function WangSupplementPage({
  unlocked,
  password,
  passwordVisible,
  attempts,
  note,
  onPasswordChange,
  onTogglePassword,
  onSubmit,
}: {
  unlocked: boolean;
  password: string;
  passwordVisible: boolean;
  attempts: number;
  note: string;
  onPasswordChange: (value: string) => void;
  onTogglePassword: () => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
}) {
  return (
    <article className="supplement-page">
      <header className="evidence-masthead">
        <div><CacheStamp>FORENSIC ATTACHMENT / WK-02</CacheStamp><p className="section-kicker">被删除的尸检补充页</p><h1>右手小指</h1><p>附件正文仍在，但访问口令被拆散在石像记录与面部伤痕中。</p></div>
        <div className="document-notice"><span>附件状态</span><b>{unlocked ? "文字层已恢复" : "加密"}</b><small>无失败锁定</small></div>
      </header>

      {!unlocked ? (
        <section className="locked-attachment">
          <LockKeyhole aria-hidden="true" />
          <div><span>口令提示</span><h2>石像数量－面部伤口数</h2><p>分隔符可使用短横线、长横线或空格。</p></div>
          <form className="password-form" onSubmit={onSubmit}>
            <label htmlFor="supplement-password">附件口令</label>
            <div className="password-field"><input id="supplement-password" type={passwordVisible ? "text" : "password"} value={password} onChange={(event) => onPasswordChange(event.target.value)} autoComplete="off" /><button type="button" onClick={onTogglePassword} aria-label={passwordVisible ? "隐藏口令" : "显示口令"}>{passwordVisible ? <EyeOff aria-hidden="true" /> : <Eye aria-hidden="true" />}</button></div>
            <button className="password-submit" type="submit">校验并打开</button>
            {note && <p className="password-note" role="status">{note}</p>}
            {attempts >= 3 && <div className="password-return-links"><span>回看：</span><a href={browserPath(ROUTES.xiyanTemple)}>西岩寺</a><span>／</span><a href={browserPath(ROUTES.wangAutopsy)}>尸检摘要</a></div>}
          </form>
        </section>
      ) : (
        <section className="supplement-evidence">
          <header><UnlockKeyhole aria-hidden="true" /><div><span>DECRYPTED TEXT LAYER</span><h2>尸检补充摘要</h2></div></header>
          <dl><MetaLine label="缺失部位">右手小指</MetaLine><MetaLine label="切口状态">人为切割痕迹</MetaLine><MetaLine label="发生顺序">落水之前</MetaLine><MetaLine label="时间批注">前一周六（原文相对时间）</MetaLine></dl>
          <p className="evidence-callout">该伤口不能由漂流撞击解释；它与脸颊伤痕、反绑双手和石质坠物共同要求重新判断死亡过程。</p>
          <div className="cross-index-grid"><span>交叉索引</span><b>302 室</b><b>3 × 3dm</b><b>老城河</b></div>
        </section>
      )}
    </article>
  );
}

function WangDeathPage() {
  return (
    <article className="death-recovery-page">
      <header className="evidence-masthead">
        <div><CacheStamp>CASE REVIEW / WK-FINAL</CacheStamp><p className="section-kicker">证据复核 · 死亡过程</p><h1>王克定之死</h1><p>判断只覆盖死亡过程，不推定或暗示实施者身份。</p></div>
        <span className="recovered-seal">RECOVERED 13</span>
      </header>
      <section className="case-verdict">
        <span>复核结论</span>
        <h2>王克定并非自杀。他遭到杀害，现场被布置为投河自杀。</h2>
        <p>责任主体：现有材料不指认。</p>
      </section>
      <section className="evidence-verdict-grid">
        <div><span>01</span><h3>反绑</h3><p>双手在背后受束，且连接数公斤重的石质人头。</p></div>
        <div><span>02</span><h3>伤痕</h3><p>脸颊三道割伤不能仅靠河石碰撞闭合解释。</p></div>
        <div><span>03</span><h3>缺指</h3><p>右手小指在人落水前已被人为切断。</p></div>
        <div><span>04</span><h3>路线</h3><p>水位、时间与回水路线彼此留下矛盾。</p></div>
      </section>

      <RecoveredScript id="13" section="目盲 · 5.2" title="王克定之死" reader="杜万琳">
        <p>第一天我们进城。房子独栋两不相接。<br />招徕客人的年青女孩在客房二楼<br />旁边是路灯。她很干净，手背有皮屑<br />在楼底能把握住，清清楚楚。</p>
        <p>老人办住房登记，屏幕上说身份<br />信息缺失。我们上下打点，住进三楼<br />勉为其难。302室，左墙空的，向右是街。</p>
        <p>警察背后牵着一组月亮，看得见<br />房间里落地窗仅一个方格<br />三个人挤在同一个区域，3×3dm<br />月光呈素色散开，颇显立体。那一刻<br />如果没有抒情警察和哨棍得空着手。<br />诗和发表，它们合法，没到89年前<br />今天单位在痛打西洋画家。</p>
        <p>曾几何时，我们像这样围成一圈在<br />街道办前的小凳高谈阔论。一块空地<br />只有两个颜色，渗水的蓝和零食袋上<br />人像红（我们常吃的）。众人围作暴风<br />最深处站立他写文字，（也会鼓吹）<br />但肠胃不好。讲正话，或者是反话<br />是反话。无非是骂政委和军阀。</p>
        <p>有人指明当今是看不见君王，也看不见臣属。<br />如同是歌剧里刺耳的女角色，<br />这个偌大的城池，古称是什么<br />还有些旧人，如扇骨一样重迭的身影。</p>
        <p>你应该反思，为年青时狂暴的诗篇<br />有些不恰当的日子，他一头跳进老城河<br />以至于和谁又忘了这座城市<br />谁记得的，众人默不作声，全权算作祭奠。</p>
      </RecoveredScript>
      <section className="version-history"><span>版本历史</span><div><h2>下一份手续发生在另一名参与者死后。</h2><p>相关诗文将它称为“焚烧签字单”；档案分类使用更日常的名称。</p></div><code>FORM INDEX AVAILABLE</code></section>
    </article>
  );
}

function DuCremationPage({ revealed }: { revealed: boolean }) {
  return (
    <article className="cremation-page">
      <header className="evidence-masthead">
        <div><CacheStamp>DISPOSITION FORM / DW</CacheStamp><p className="section-kicker">遗体处理手续 · {revealed ? "完整文字层" : "表面副本"}</p><h1>杜万琳</h1><p>死亡表面记录与代签信息分属两个图层；空缺字段保持空缺。</p></div>
        <div className="document-notice"><span>页面状态</span><b>{revealed ? "代签人已交叉确认" : "签名遮挡"}</b><small>人物异名：杜南阳</small></div>
      </header>

      <section className="cremation-layout">
        <div className="cremation-sheet burnt-edge">
          <header><span>火化签字单／转录件</span><code>DW-FORM-01</code></header>
          <dl><MetaLine label="死者">杜万琳</MetaLine><MetaLine label="死亡日期">未记载</MetaLine><MetaLine label="医院">未记载</MetaLine><MetaLine label="表面记录">病逝／肝病相关</MetaLine><MetaLine label="遗体处置">已火化</MetaLine><MetaLine label="家属状态">儿子在外；妻子留家</MetaLine></dl>
          <div className="signature-field"><span>代家属签字</span><b className={revealed ? "signature-reveal" : "signature-mask"}>{revealed ? "方晚" : "方＿"}</b><small>{revealed ? "与到院记录、诗文声部交叉确认" : "第二字被纸面灼痕覆盖"}</small></div>
        </div>
        <aside className="transcription-panel"><ArtifactTag>{revealed ? "文字层已恢复" : "表面可见"}</ArtifactTag><h2>{revealed ? "方晚代杜家签字" : "最先到院的人"}</h2><p>方晚先到医院。由于杜万琳的儿子不在场、妻子留在家中，后续手续由这名朋友代签。</p><p>现有材料只记录过程，不把表面病逝说明扩写成未经证实的医学诊断。</p></aside>
      </section>

      {revealed && (
        <>
          <RecoveredScript id="08" section="句肉篇 · 3.1" title="自白" reader="方晚">
            <p>前几年你风光得意，总在思忖合适的死<br />会倒在哪里。想要突发暴疾<br />和朋友一起喝到胃穿孔<br />——你说这病非得不是肝硬化。</p>
            <p>我们共有因贪杯而沾染的罪过<br />趔趄像失足的苍蝇<br />头脑昏沉连两翅都已濡湿。<br />想着就因此淹死吧。你挣脱<br />的意愿，将那份糜烂的肝脏剖划而出<br />如托起一枚玉石、裹着璞质的珍玩。<br />就因此淹死吧。</p>
            <p>你反复声明<br />把摧折肝器的历史<br />比作好事多磨的象征。</p>
            <p>后来你真走了。<br />尸检的报告单上写着<br />——小麦。徐惠发给我们这讯息<br />来不及吊唁，你生前少有的几个朋友<br />大家互相联系赶到殡仪馆。</p>
            <p>那当天鼓起热风，你胸骨<br />哔剥作响从中辨认出红色的怪脸<br />像是你沉底的孽障欲将练成舍利。</p>
            <p>徐惠哭至力竭很早便离开。<br />我代为家属在火化单署名<br />想到签下一个代号这门事儿<br />便裁定你惶惶的一生——<br />另一代号——自此变成土壤。</p>
            <p>簇拥着喝得烂醉像以前一样<br />轻蔑地悲悼一条命的垂死<br />我们放弃审视各自毫无活性的肝脏<br />当天夜里织合一道谎言瞒过自己<br />杯酒相撞，庆幸仍活在世上。</p>
          </RecoveredScript>
          <section className="case-name-reveal"><span>案件名称／首次完整出现</span><h2>他山地方公墓贪污案</h2><p>五名参与者的档案由此被编入同一索引。下一章暂只开放元数据。</p><code>NEXT: CASE / CEMETERY / METADATA ONLY</code></section>
        </>
      )}
    </article>
  );
}
