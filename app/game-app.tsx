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
  medicalGlyphRevealed: boolean;
  historyVersionsLoaded: number;
  historyAutofillDone: boolean;
  editorLoggedIn: boolean;
  stageTransformStep: number;
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
  medicalGlyphRevealed: false,
  historyVersionsLoaded: 1,
  historyAutofillDone: false,
  editorLoggedIn: false,
  stageTransformStep: 0,
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
  cemeteryCase: "/archive/case/cemetery",
  xingNews: "/news/cache/xing-mou",
  shouxiang: "/mirror/shouxiang/staff",
  duChe: "/members/du-che",
  wedding: "/archive/wedding/du-li",
  taste: "/recovered/10-chuwei-taste",
  medical: "/archive/medical/redacted",
  stomach: "/recovered/11-chuwei-stomach",
  kuonanHistory: "/archive/site-history/kuonan",
  liLetter: "/archive/letters/li-to-ye",
  mahePublication: "/publications/mahe-de-chufang",
  editorLogin: "/admin/editor/login",
  editorRevisions: "/admin/editor/revisions",
  yuanchang: "/admin/characters/yuanchang",
  recoveredIndex: "/stage/recovered-index",
  stageZhuhongmen: "/stage/zhuhongmen",
  shinan: "/stage/shinan",
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
  [ROUTES.cemeteryCase]: "他山地方公墓贪污案｜参与者索引",
  [ROUTES.xingNews]: "刑某｜新闻缓存",
  [ROUTES.shouxiang]: "寿享陵园｜旧站人员页",
  [ROUTES.duChe]: "杜彻｜人物档案",
  [ROUTES.wedding]: "杜彻与李髮｜婚礼档案",
  [ROUTES.taste]: "刍味｜已恢复",
  [ROUTES.medical]: "刍胃｜医学删除页",
  [ROUTES.stomach]: "刍胃｜已恢复",
  [ROUTES.kuonanHistory]: "阔南会社｜网站版本史",
  [ROUTES.liLetter]: "李司贰致叶是｜书信档案",
  [ROUTES.mahePublication]: "玛赫的厨房｜出版档案",
  [ROUTES.editorLogin]: "叶是｜编辑后台登录",
  [ROUTES.editorRevisions]: "叶是｜编辑缓存",
  [ROUTES.yuanchang]: "元昶／左君｜角色修订页",
  [ROUTES.recoveredIndex]: "始末的碎点｜解密索引",
  [ROUTES.stageZhuhongmen]: "赭红门｜终场",
  [ROUTES.shinan]: "诗喃｜航船诗歌剧场",
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
  [ROUTES.cemeteryCase]: [
    "五个人的姓名已经归入同一个案名；下一步从公开新闻措辞找人。",
    "索引中的一名参与者在新闻里被匿名写成“某”。",
    "搜索：刑某。",
  ],
  [ROUTES.xingNews]: [
    "切换原刊与缓存，留意缓存多出的一处陵园名称。",
    "后来材料提到：世伯承办的寿享陵园。",
    "搜索：寿享陵园。",
  ],
  [ROUTES.shouxiang]: [
    "旧站人员目录里有一位年轻负责人，家庭关系链接仍可用。",
    "负责人的姓名是杜彻。",
    "搜索：杜彻。",
  ],
  [ROUTES.duChe]: [
    "人物页写出杜彻结婚对象的名字；两种字形都在来源中出现。",
    "“髮”与“髪”指向同一个人。简体字只会给出纠错提示。",
    "搜索：李髮或李髪。也可以先搜索：刍味。",
  ],
  [ROUTES.wedding]: [
    "婚礼档案不是这一支线唯一的朗读文件；杜彻本人也有一个声部。",
    "从寿享陵园材料中的味觉词继续搜索。",
    "搜索：刍味。",
  ],
  [ROUTES.taste]: [
    "搜索结果里出现了一个只差一字的同音标题。",
    "把“味”换成身体器官的“胃”。",
    "搜索：刍胃。",
  ],
  [ROUTES.medical]: [
    "删除页列出的症状共同指向一种神经系统退行性疾病。",
    "可点击被划去的“味”，确认标题应写作“胃”。",
    "搜索：阿尔茨海默病。阿兹海默症也可以。",
  ],
  [ROUTES.stomach]: [
    "旧站历史里留着画廊开业时没有采用的原名称。",
    "杜彻最初想把画廊命名为阔南会社。",
    "搜索：阔南会社。",
  ],
  [ROUTES.kuonanHistory]: [
    "旧名没有消失，只藏在更早的网站版本。",
    "连续触底或点击按钮，载入全部 5 个版本。",
    "第 5 版会出现阔南会社，并把下一姓名写入搜索框。",
  ],
  [ROUTES.liLetter]: [
    "书信说明“憎恶社”来自杜彻的一部小说。",
    "出版目录中唯一对应的书名是《玛赫的厨房》。",
    "搜索：玛赫的厨房。记住页脚账号 editor_ys。",
  ],
  [ROUTES.mahePublication]: [
    "版权页给出首版年份，页边给出口令组合规则。",
    "把书名拼音首字母放在 2019 前面。",
    "搜索叶主任或叶是；后台口令是 MHDC2019。",
  ],
  [ROUTES.editorLogin]: [
    "账号在李司贰书信的收件元数据里。",
    "口令规则在《玛赫的厨房》版权页：首字母＋2019。",
    "账号 editor_ys；口令 MHDC2019。",
  ],
  [ROUTES.editorRevisions]: [
    "后台批注里有一个法名，访谈里有一个本名。",
    "元昶与左君属于同一个小说角色。",
    "搜索：元昶或左君。",
  ],
  [ROUTES.yuanchang]: [
    "年表底部的Ⅰ至Ⅹ不是档案编号，而是下一份文本的碎片序号。",
    "搜索标题后，口令要用作者替换前的旧名。",
    "搜索：始末的碎点；口令：左君。",
  ],
  [ROUTES.recoveredIndex]: [
    "口令不是法名。",
    "访谈开头说：原谅我称呼你本名。",
    "输入左君；恢复后搜索赭红门。",
  ],
  [ROUTES.stageZhuhongmen]: [
    "最后的答案已经写在场记里。",
    "它不是人物或案件名，而是一场演出的名字。",
    "搜索：诗喃。",
  ],
  [ROUTES.shinan]: [
    "全部文本已经就位。选择静音字幕版即可完成谢幕。",
    "海报、活动照和录音将在取得原始授权素材后替换占位。",
    "点击：静音字幕版开演。",
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
  const [editorUser, setEditorUser] = useState("");
  const [editorPassword, setEditorPassword] = useState("");
  const [editorAttempts, setEditorAttempts] = useState(0);
  const [editorNote, setEditorNote] = useState("");
  const [fragmentPassword, setFragmentPassword] = useState("");
  const [fragmentAttempts, setFragmentAttempts] = useState(0);
  const [fragmentNote, setFragmentNote] = useState("");
  const [stableStage, setStableStage] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const skipScareRef = useRef<HTMLButtonElement>(null);
  const skipDeathScareRef = useRef<HTMLButtonElement>(null);

  const currentPath = displayPath(path);
  const currentHints = HINTS[currentPath] ?? HINTS[ROUTES.exhibition];
  const stageComplete = game.recovered.includes("14");
  const stageVocabulary = game.recovered.includes("12");

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
    setEditorPassword("");
    setEditorNote("");
    setFragmentPassword("");
    setFragmentAttempts(0);
    setFragmentNote("");
    setStableStage(false);
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
    const unlocksThrough = (step: number) => Array.from({ length: step }, (_, index) => `S${String(index + 1).padStart(2, "0")}`);
    const recoveredTwelve = ["01", "02", "03", "04", "05", "06", "07", "08", "09", "10", "11", "13"];
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
      [ROUTES.cemeteryCase]: {
        unlock: ["S01", "S02", "S03", "S04", "S05", "S06", "S07", "S08", "S09", "S10", "S11", "S12", "S13", "S14", "S15", "S16", "S17", "S18", "S19", "S20", "S21"],
        recover: ["01", "02", "03", "04", "05", "06", "08", "09", "13"],
      },
      [ROUTES.xingNews]: {
        unlock: ["S01", "S02", "S03", "S04", "S05", "S06", "S07", "S08", "S09", "S10", "S11", "S12", "S13", "S14", "S15", "S16", "S17", "S18", "S19", "S20", "S21", "S22"],
        recover: ["01", "02", "03", "04", "05", "06", "08", "09", "13"],
      },
      [ROUTES.shouxiang]: {
        unlock: ["S01", "S02", "S03", "S04", "S05", "S06", "S07", "S08", "S09", "S10", "S11", "S12", "S13", "S14", "S15", "S16", "S17", "S18", "S19", "S20", "S21", "S22", "S23"],
        recover: ["01", "02", "03", "04", "05", "06", "08", "09", "13"],
      },
      [ROUTES.duChe]: {
        unlock: ["S01", "S02", "S03", "S04", "S05", "S06", "S07", "S08", "S09", "S10", "S11", "S12", "S13", "S14", "S15", "S16", "S17", "S18", "S19", "S20", "S21", "S22", "S23", "S24"],
        recover: ["01", "02", "03", "04", "05", "06", "08", "09", "13"],
      },
      [ROUTES.wedding]: {
        unlock: ["S01", "S02", "S03", "S04", "S05", "S06", "S07", "S08", "S09", "S10", "S11", "S12", "S13", "S14", "S15", "S16", "S17", "S18", "S19", "S20", "S21", "S22", "S23", "S24", "S25"],
        recover: ["01", "02", "03", "04", "05", "06", "07", "08", "09", "13"],
      },
      [ROUTES.taste]: {
        unlock: ["S01", "S02", "S03", "S04", "S05", "S06", "S07", "S08", "S09", "S10", "S11", "S12", "S13", "S14", "S15", "S16", "S17", "S18", "S19", "S20", "S21", "S22", "S23", "S24", "S26"],
        recover: ["01", "02", "03", "04", "05", "06", "08", "09", "10", "13"],
      },
      [ROUTES.medical]: {
        unlock: ["S01", "S02", "S03", "S04", "S05", "S06", "S07", "S08", "S09", "S10", "S11", "S12", "S13", "S14", "S15", "S16", "S17", "S18", "S19", "S20", "S21", "S22", "S23", "S24", "S26", "S27"],
        recover: ["01", "02", "03", "04", "05", "06", "08", "09", "10", "13"],
      },
      [ROUTES.stomach]: {
        unlock: ["S01", "S02", "S03", "S04", "S05", "S06", "S07", "S08", "S09", "S10", "S11", "S12", "S13", "S14", "S15", "S16", "S17", "S18", "S19", "S20", "S21", "S22", "S23", "S24", "S26", "S27", "S28"],
        recover: ["01", "02", "03", "04", "05", "06", "08", "09", "10", "11", "13"],
      },
      [ROUTES.kuonanHistory]: { unlock: unlocksThrough(29), recover: recoveredTwelve },
      [ROUTES.liLetter]: { unlock: unlocksThrough(30), recover: recoveredTwelve },
      [ROUTES.mahePublication]: { unlock: unlocksThrough(31), recover: recoveredTwelve },
      [ROUTES.editorLogin]: { unlock: unlocksThrough(31), recover: recoveredTwelve },
      [ROUTES.editorRevisions]: { unlock: unlocksThrough(32), recover: recoveredTwelve },
      [ROUTES.yuanchang]: { unlock: unlocksThrough(33), recover: recoveredTwelve },
      [ROUTES.recoveredIndex]: { unlock: unlocksThrough(33), recover: recoveredTwelve },
      [ROUTES.stageZhuhongmen]: { unlock: unlocksThrough(35), recover: [...recoveredTwelve, "12", "14"] },
      [ROUTES.shinan]: { unlock: unlocksThrough(36), recover: [...recoveredTwelve, "12", "14"] },
    };
    const effect = arrival[currentPath];
    const syncArrival = window.setTimeout(() => {
      setGame((previous) => ({
        ...previous,
        unlocked: unique([...previous.unlocked, ...(effect?.unlock ?? [])]),
        recovered: unique([...previous.recovered, ...(effect?.recover ?? [])]),
        visited: unique([...previous.visited, currentPath]),
        editorLoggedIn: currentPath === ROUTES.editorRevisions || currentPath === ROUTES.yuanchang || currentPath === ROUTES.recoveredIndex || currentPath === ROUTES.stageZhuhongmen || currentPath === ROUTES.shinan ? true : previous.editorLoggedIn,
        stageTransformStep: currentPath === ROUTES.stageZhuhongmen || currentPath === ROUTES.shinan ? Math.max(previous.stageTransformStep, 3) : previous.stageTransformStep,
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

  useEffect(() => {
    if (!hydrated || currentPath !== ROUTES.kuonanHistory || game.historyVersionsLoaded >= 5 || game.settings.reducedMotion) return;
    const loadAtBottom = () => {
      const page = document.documentElement;
      if (window.innerHeight + window.scrollY < page.scrollHeight - 24) return;
      setGame((previous) => ({
        ...previous,
        historyVersionsLoaded: Math.min(5, previous.historyVersionsLoaded + 1),
      }));
    };
    window.addEventListener("scroll", loadAtBottom, { passive: true });
    return () => window.removeEventListener("scroll", loadAtBottom);
  }, [currentPath, game.historyVersionsLoaded, game.settings.reducedMotion, hydrated]);

  useEffect(() => {
    if (currentPath !== ROUTES.kuonanHistory || game.historyVersionsLoaded < 5 || game.historyAutofillDone || query.trim()) return;
    const fill = window.setTimeout(() => {
      setQuery("李司贰");
      setGame((previous) => ({ ...previous, historyAutofillDone: true }));
      searchInputRef.current?.focus();
    }, game.settings.reducedMotion ? 0 : 650);
    return () => window.clearTimeout(fill);
  }, [currentPath, game.historyAutofillDone, game.historyVersionsLoaded, game.settings.reducedMotion, query]);

  useEffect(() => {
    if (!game.recovered.includes("12") || game.stageTransformStep === 0 || game.stageTransformStep >= 3) return;
    const advance = window.setTimeout(() => {
      setGame((previous) => ({ ...previous, stageTransformStep: Math.min(3, previous.stageTransformStep + 1) }));
    }, game.settings.reducedMotion ? 100 : 4000);
    return () => window.clearTimeout(advance);
  }, [game.recovered, game.settings.reducedMotion, game.stageTransformStep]);

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

  function loadOlderSiteVersion() {
    setGame((previous) => ({
      ...previous,
      historyVersionsLoaded: Math.min(5, previous.historyVersionsLoaded + 1),
    }));
  }

  function submitEditorLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const userMatches = editorUser.trim().toLowerCase() === "editor_ys";
    const passwordMatches = editorPassword.trim().toLowerCase() === "mhdc2019";
    if (userMatches && passwordMatches) {
      setGame((previous) => ({
        ...previous,
        editorLoggedIn: true,
        unlocked: unique([...previous.unlocked, "S32"]),
      }));
      setEditorPassword("");
      navigate(ROUTES.editorRevisions);
      return;
    }
    const nextAttempts = editorAttempts + 1;
    setEditorAttempts(nextAttempts);
    setEditorPassword("");
    setEditorNote(nextAttempts >= 3
      ? "仍未通过。账号来自李司贰书信：editor_ys；口令为书名首字母＋2019。"
      : userMatches ? "口令不匹配；账号已保留，不会锁定。" : "账号不匹配；不会锁定。");
  }

  function submitFragmentPassword(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (fragmentPassword.trim() === "左君") {
      setGame((previous) => ({
        ...previous,
        unlocked: unique([...previous.unlocked, "S34"]),
        recovered: unique([...previous.recovered, "12"]),
        stageTransformStep: Math.max(1, previous.stageTransformStep),
      }));
      setFragmentNote("十段索引已解除。档案正在改写为场记。可立即显示稳定版。");
      return;
    }
    const nextAttempts = fragmentAttempts + 1;
    setFragmentAttempts(nextAttempts);
    setFragmentNote(nextAttempts >= 3
      ? "口令不是法名“元昶”。回看访谈里“原谅我称呼你本名”的下一称呼。"
      : fragmentPassword.trim() === "元昶" ? "这是角色法名。口令要求被替换前的旧名。" : "口令不匹配；已读碎片不会清空。");
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
      const caseIndexed = game.unlocked.includes("S21") || currentPath === ROUTES.cemeteryCase;
      if (caseIndexed) {
        setResults([{
          id: "xing-mou-news",
          kind: "新闻原刊／缓存 · 2个版本",
          title: "‘他山地方公墓贪污案’涉案人员刑某现已被警方依法逮捕",
          summary: "公开报道采用匿名写法；缓存与旧成员索引将刑某映射为刑万。",
          path: ROUTES.xingNews,
          unlock: ["S22"],
        }]);
        setResultNote("同一个姓名在社团合照与新闻标题中采用了不同写法。");
        return;
      }
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

    if (["他山地方公墓贪污案", "他山公墓贪污案", "地方公墓贪污案"].includes(normalized)) {
      const allowed = game.unlocked.includes("S20") || currentPath === ROUTES.duCremationSigned;
      setResults([{
        id: "cemetery-case",
        kind: allowed ? "案件参与者索引 · 5人" : "受限项目元数据",
        title: "他山地方公墓贪污案",
        summary: allowed
          ? "五名参与者、项目关系与已公开死亡过程已完成交叉。"
          : "项目名存在，但参与者与死亡手续尚未完成交叉。",
        path: allowed ? ROUTES.cemeteryCase : undefined,
        unlock: allowed ? ["S21"] : undefined,
        locked: !allowed,
        note: allowed ? undefined : "证据不足",
      }]);
      setResultNote(allowed ? "个人档案已汇入同一项目索引。" : "先恢复完整火化单与方晚的自白。");
      return;
    }

    if (["寿享陵园", "寿享陵園"].includes(normalized)) {
      const allowed = game.unlocked.includes("S22") || currentPath === ROUTES.xingNews;
      setResults([{
        id: "shouxiang-old-site",
        kind: allowed ? "旧网站镜像 · 人员目录" : "失效网站元数据",
        title: "寿享陵园｜旧站人员页",
        summary: allowed
          ? "失效站点的文字层仍可读取；负责人字段链接到杜彻。"
          : "旧域名存在于缓存，但尚未取得新闻版本差异。",
        path: allowed ? ROUTES.shouxiang : undefined,
        unlock: allowed ? ["S23"] : undefined,
        locked: !allowed,
        note: allowed ? undefined : "来源不足",
      }]);
      setResultNote(allowed ? "找到一份保留早期网页样式的站点镜像。" : "先查看刑某新闻的缓存版本。");
      return;
    }

    if (["杜彻", "杜徹"].includes(normalized)) {
      const allowed = game.unlocked.includes("S23") || currentPath === ROUTES.shouxiang;
      setResults([{
        id: "du-che",
        kind: allowed ? "人物档案 · 家庭／职业交叉" : "旧站负责人",
        title: "杜彻",
        summary: allowed
          ? "杜万琳与徐惠之子；经世伯介绍进入他山市公墓系统。"
          : "姓名出现在一份失效陵园人员目录中。",
        path: allowed ? ROUTES.duChe : undefined,
        unlock: allowed ? ["S24"] : undefined,
        locked: !allowed,
        note: allowed ? undefined : "履历未恢复",
      }]);
      setResultNote(allowed ? "家庭与职业字段指向同一人物。" : "先取得旧陵园网页的完整人员目录。");
      return;
    }

    if (["李髮", "李髪"].includes(normalized)) {
      const allowed = game.unlocked.includes("S24") || currentPath === ROUTES.duChe;
      setResults([{
        id: "du-li-wedding",
        kind: allowed ? "婚礼档案＋朗读文件" : "人物关系元数据",
        title: "杜彻与李髮｜婚礼档案",
        summary: allowed
          ? "叙事来源同时使用李髮与李髪；附朗读文件07《舞》。"
          : "人物名存在，家庭关系尚未与杜彻档案互证。",
        path: allowed ? ROUTES.wedding : undefined,
        unlock: allowed ? ["S25"] : undefined,
        recover: allowed ? ["07"] : undefined,
        locked: !allowed,
        note: allowed ? undefined : "关系未确认",
      }]);
      setResultNote(allowed ? "两种字形已合并为同一份婚礼档案。" : "先打开杜彻的人物档案。");
      return;
    }

    if (normalized === "李发") {
      setResults([{
        id: "li-fa-suggestion",
        kind: "姓名纠错",
        title: "是否查找“李髮”或“李髪”？",
        summary: "原始来源保留异体字；简体写法不直接打开档案。",
        locked: true,
        note: "请使用来源字形",
      }]);
      setResultNote("姓名的字形本身是交叉线索。");
      return;
    }

    if (["刍味", "芻味"].includes(normalized)) {
      const allowed = game.unlocked.includes("S24") || currentPath === ROUTES.duChe || currentPath === ROUTES.wedding;
      setResults(allowed ? [
        {
          id: "chuwei-taste",
          kind: "朗读文件 · 10 / 14",
          title: "4.1 刍味（杜彻）",
          summary: "寿享陵园、世伯与一场酒在同一声部中重合。",
          path: ROUTES.taste,
          unlock: ["S26"],
          recover: ["10"],
        },
        {
          id: "chuwei-homophone",
          kind: "相似标题 · 受限",
          title: "4.2 刍胃",
          summary: "只差一个同音字；正文仍处于医学删除页之后。",
          locked: true,
          note: "标题相似",
        },
      ] : [{
        id: "chuwei-locked",
        kind: "受限朗读文件",
        title: "4.1 刍味",
        summary: "文件存在；朗读声部与陵园人员目录尚未交叉。",
        locked: true,
        note: "来源不足",
      }]);
      setResultNote(allowed ? "检索同时命中一个同音标题。" : "先确认寿享陵园的负责人。");
      return;
    }

    if (["刍胃", "芻胃"].includes(normalized)) {
      const allowed = game.recovered.includes("10") || currentPath === ROUTES.taste;
      setResults([{
        id: "medical-redaction",
        kind: allowed ? "医学文字删除页" : "相似标题元数据",
        title: "4.2 刍胃｜标题校订层",
        summary: allowed
          ? "标题中的“味”被划去；疾病名称仍被六个字符遮挡。"
          : "同音标题存在，但前一份朗读文件尚未恢复。",
        path: allowed ? ROUTES.medical : undefined,
        unlock: allowed ? ["S27"] : undefined,
        locked: !allowed,
        note: allowed ? undefined : "缺少刍味",
      }]);
      setResultNote(allowed ? "同音字把味觉材料引向了身体器官。" : "先恢复《刍味》。");
      return;
    }

    if (["阿尔茨海默病", "阿爾茨海默病", "阿兹海默症", "阿茲海默症"].includes(normalized)) {
      const allowed = game.unlocked.includes("S27") || currentPath === ROUTES.medical;
      setResults([{
        id: "chuwei-stomach",
        kind: allowed ? "删除层已解除＋朗读文件" : "医学词条",
        title: "4.2 刍胃（杜万琳）",
        summary: allowed
          ? "疾病名与完整文字层已恢复；附朗读文件11。"
          : "公开医学词条可见，但尚不能解锁文学档案。",
        path: allowed ? ROUTES.stomach : undefined,
        unlock: allowed ? ["S28"] : undefined,
        recover: allowed ? ["11"] : undefined,
        locked: !allowed,
        note: allowed ? undefined : "删除页未定位",
      }]);
      setResultNote(allowed ? "症状列表与病名吻合，删除层已解除。" : "先找到列出症状的删除页。");
      return;
    }

    if (normalized === "老年痴呆") {
      setResults([{
        id: "medical-synonym",
        kind: "医学同义提示",
        title: "请使用原病名：阿尔茨海默病",
        summary: "该词仅作搜索容错，不作为唯一答案，也不用于人物标签。",
        locked: true,
        note: "改用规范病名",
      }]);
      setResultNote("症状索引可以命中，但解锁需要原病名。");
      return;
    }

    if (["阔南会社", "闊南會社"].includes(normalized)) {
      const medicalComplete = game.unlocked.includes("S28") || currentPath === ROUTES.stomach;
      const weddingComplete = game.recovered.includes("07") || currentPath === ROUTES.wedding;
      const allowed = medicalComplete && weddingComplete;
      setResults([{
        id: "kuonan-history",
        kind: allowed ? "网站版本历史 · 5个版本" : "受限组织元数据",
        title: "阔南会社",
        summary: allowed
          ? "杜彻与葛东平改造画廊时曾考虑使用的名称；旧站曾在多个名称之间改写。"
          : medicalComplete
            ? "名称已经出现，但杜彻婚礼档案中的朗读文件07尚未恢复。"
            : "名称存在，但旧站历史仍被医学删除层遮挡。",
        path: allowed ? ROUTES.kuonanHistory : undefined,
        unlock: allowed ? ["S29"] : undefined,
        locked: !allowed,
        note: allowed ? undefined : medicalComplete ? "缺少 07《舞》" : "证据不足",
      }]);
      setResultNote(allowed ? "找到五层旧站历史；最早版本仍在页面底部。" : medicalComplete ? "回到杜彻档案，查找李髮或李髪。" : "先恢复《刍胃》的完整文字层。");
      return;
    }

    if (normalized === "阔南画廊" || normalized === "闊南畫廊") {
      setResults([{
        id: "kuonan-public-summary",
        kind: "普通历史摘要",
        title: "阔南画廊",
        summary: "画廊曾在 Z 城重新装修；旧名称没有在公开摘要中展开。",
        locked: true,
        note: "使用正式旧名",
      }]);
      setResultNote("这是普通名称，不会打开五层版本历史。");
      return;
    }

    if (normalized === "李司贰") {
      const allowed = game.historyVersionsLoaded >= 5 || game.unlocked.includes("S30");
      setResults([{
        id: "li-to-ye-letter",
        kind: allowed ? "私人书信缓存 · 1封" : "封闭书信元数据",
        title: "李司贰致叶是",
        summary: allowed
          ? "书信解释了憎恶社、杜彻小说与阔南会社之间的命名关系。"
          : "署名存在；需先读取最早的网站版本。",
        path: allowed ? ROUTES.liLetter : undefined,
        unlock: allowed ? ["S30"] : undefined,
        locked: !allowed,
        note: allowed ? undefined : "版本未齐",
      }]);
      setResultNote(allowed ? "找到一封带站内编辑账号的私人书信。" : "先在阔南会社页面载入全部 5 个旧版本。");
      return;
    }

    if (normalized === "李司二") {
      setResults([{
        id: "li-si-er-correction",
        kind: "姓名纠错",
        title: "是否查找“李司贰”？",
        summary: "原信署名使用大写数字“贰”。",
        locked: true,
        note: "请使用原署名",
      }]);
      setResultNote("姓名最后一字不是“二”。");
      return;
    }

    if (["玛赫的厨房", "瑪赫的廚房", "玛赫厨房"].includes(normalized)) {
      const allowed = game.unlocked.includes("S30") || currentPath === ROUTES.liLetter;
      setResults([{
        id: "mahe-publication",
        kind: allowed ? "出版档案＋版权页" : "公开书目",
        title: "《玛赫的厨房》",
        summary: allowed
          ? "杜彻小说，2019年初版；页边保留编辑后台的初始口令规则。"
          : "书目存在，但与憎恶社命名关系尚未展开。",
        path: allowed ? ROUTES.mahePublication : undefined,
        unlock: allowed ? ["S31"] : undefined,
        locked: !allowed,
        note: allowed ? undefined : "缺少书信关联",
      }]);
      setResultNote(allowed ? "版权页写明：初始口令＝书名拼音首字母＋首版年份。" : "先阅读说明命名来源的书信。");
      return;
    }

    if (normalized === "玛赫" || normalized === "瑪赫") {
      setResults([{
        id: "mahe-catalog",
        kind: "出版书目 · 3条",
        title: "玛赫",
        summary: "查询范围过宽；请使用书信里的完整小说名。",
        locked: true,
      }]);
      setResultNote("书名还缺少一个空间词。");
      return;
    }

    if (["叶主任", "葉主任", "叶是", "葉是"].includes(normalized)) {
      const hasAccount = game.unlocked.includes("S30");
      const hasPasswordRule = game.unlocked.includes("S31") || currentPath === ROUTES.mahePublication;
      const allowed = hasAccount && hasPasswordRule;
      setResults([{
        id: "editor-entry",
        kind: allowed ? "编辑缓存入口" : "编辑人员索引",
        title: game.editorLoggedIn ? "叶是｜已解锁编辑缓存" : "叶主任／叶是｜后台登录",
        summary: allowed
          ? "书信收件人与再版批注共用同一编辑身份。"
          : "称呼可以互证，但账号或口令规则尚未取得。",
        path: allowed ? (game.editorLoggedIn ? ROUTES.editorRevisions : ROUTES.editorLogin) : undefined,
        locked: !allowed,
        note: allowed ? undefined : hasAccount ? "缺少口令规则" : "缺少账号",
      }]);
      setResultNote(allowed ? "登录只保存解锁状态，不保存明文口令。" : "账号来自书信，口令规则来自版权页。");
      return;
    }

    if (["元昶", "左君"].includes(normalized)) {
      const allowed = game.editorLoggedIn || currentPath === ROUTES.editorRevisions || game.unlocked.includes("S32");
      setResults([{
        id: "yuanchang-character",
        kind: allowed ? "小说角色合并档案" : "公开访谈索引",
        title: "元昶／左君",
        summary: allowed
          ? "法名与本名指向同一小说角色；活动年表在初版与再版中被改写。"
          : "姓名命中访谈，但编辑修订记录尚未开放。",
        path: allowed ? ROUTES.yuanchang : undefined,
        unlock: allowed ? ["S33"] : undefined,
        locked: !allowed,
        note: allowed ? undefined : "需要编辑缓存",
      }]);
      setResultNote(allowed ? "所谓历史显示出作者与编辑共同改写的痕迹。" : "先使用叶是的编辑入口登录。");
      return;
    }

    if (["始末的碎点", "始末碎点"].includes(normalized)) {
      const allowed = game.unlocked.includes("S33") || currentPath === ROUTES.yuanchang;
      setResults([{
        id: "fragment-index",
        kind: allowed ? "加密碎片索引 · Ⅰ—Ⅹ" : "受限文学文件",
        title: "5.1 始末的碎点",
        summary: allowed
          ? "十个编号槽已经定位；解密口令为角色被替换前的旧名。"
          : "标题存在，但人物年表的修订来源尚未确认。",
        path: allowed ? ROUTES.recoveredIndex : undefined,
        locked: !allowed,
        note: allowed ? "需要口令" : "来源不足",
      }]);
      setResultNote(allowed ? "加密索引不会因错误口令清空。" : "先确认元昶与左君的身份映射。");
      return;
    }

    if (["赭红门", "赭紅門"].includes(normalized)) {
      const allowed = game.recovered.length >= 13 && game.recovered.includes("12");
      setResults([{
        id: allowed ? "stage-zhuhongmen" : "public-zhuhongmen",
        kind: allowed ? "结诗＋终场场记" : "当前展览",
        title: "赭红门",
        summary: allowed
          ? "第14份文本已经就位；档案编号将转换为场次编号。"
          : `结诗存在，尚未就位。当前还缺 ${Math.max(1, 14 - game.recovered.length)} 份文本。`,
        path: allowed ? ROUTES.stageZhuhongmen : ROUTES.exhibition,
        unlock: allowed ? ["S35"] : undefined,
        recover: allowed ? ["14"] : undefined,
        locked: false,
      }]);
      setResultNote(allowed ? "这里不再出现惊吓；页面将回到舞台暖光。" : "公开展览仍可访问，终场需要先恢复13份文本。");
      return;
    }

    if (normalized === "诗喃") {
      const allowed = game.recovered.includes("14") || currentPath === ROUTES.stageZhuhongmen || game.unlocked.includes("S36");
      setResults([{
        id: "shinan-performance",
        kind: allowed ? "航船诗歌社 · 国庆诗歌剧场" : "演出元数据",
        title: "诗喃",
        summary: allowed
          ? "完整剧本、朗读声部与谢幕页已经开放。"
          : "一场演出的名称。演出内容尚未就位。",
        path: allowed ? ROUTES.shinan : undefined,
        unlock: allowed ? ["S36"] : undefined,
        locked: !allowed,
        note: allowed ? undefined : "需恢复全部14份文本",
      }]);
      setResultNote(allowed ? "档案人物现在回到航船诗歌社的朗读名单。" : "通关前只显示名称，不公开演出归属。");
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
      case ROUTES.cemeteryCase:
        return <CemeteryCasePage />;
      case ROUTES.xingNews:
        return <XingNewsPage />;
      case ROUTES.shouxiang:
        return <ShouxiangPage />;
      case ROUTES.duChe:
        return <DuChePage />;
      case ROUTES.wedding:
        return <WeddingPage />;
      case ROUTES.taste:
        return <TastePage />;
      case ROUTES.medical:
        return <MedicalPage
          revealed={false}
          glyphRevealed={game.medicalGlyphRevealed}
          onToggleGlyph={() => setGame((previous) => ({ ...previous, medicalGlyphRevealed: true }))}
        />;
      case ROUTES.stomach:
        return <MedicalPage revealed glyphRevealed onToggleGlyph={() => undefined} />;
      case ROUTES.kuonanHistory:
        return <KuonanHistoryPage loaded={game.historyVersionsLoaded} reducedMotion={game.settings.reducedMotion} onLoad={loadOlderSiteVersion} />;
      case ROUTES.liLetter:
        return <LiLetterPage />;
      case ROUTES.mahePublication:
        return <MahePublicationPage />;
      case ROUTES.editorLogin:
        return <EditorLoginPage
          user={editorUser}
          password={editorPassword}
          attempts={editorAttempts}
          note={editorNote}
          alreadyUnlocked={game.editorLoggedIn}
          onUserChange={setEditorUser}
          onPasswordChange={setEditorPassword}
          onSubmit={submitEditorLogin}
          onReopen={() => navigate(ROUTES.editorRevisions)}
        />;
      case ROUTES.editorRevisions:
        return <EditorRevisionsPage />;
      case ROUTES.yuanchang:
        return <YuanchangPage />;
      case ROUTES.recoveredIndex:
        return <RecoveredIndexPage
          revealed={game.recovered.includes("12")}
          password={fragmentPassword}
          attempts={fragmentAttempts}
          note={fragmentNote}
          transformStep={stableStage ? 3 : game.stageTransformStep}
          onPasswordChange={setFragmentPassword}
          onSubmit={submitFragmentPassword}
          onStable={() => { setStableStage(true); setGame((previous) => ({ ...previous, stageTransformStep: 3 })); }}
        />;
      case ROUTES.stageZhuhongmen:
        return <StageZhuhongmenPage />;
      case ROUTES.shinan:
        return <ShinanPage />;
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
    <div className={`game-shell${game.settings.reducedMotion ? " reduce-motion" : ""}${stageComplete ? " stage-complete" : stageVocabulary ? " stage-transition" : ""}`}>
      <a className="skip-link" href="#main-content">跳到正文</a>

      <header className="site-header">
        <button className="wordmark" type="button" onClick={() => navigate(ROUTES.exhibition)} aria-label="返回憎恶社当期展览">
          <span className="wordmark-mark" aria-hidden="true">憎恶社</span>
          <span><b>{stageComplete ? "航船诗歌社" : "ZENGWU SOCIETY"}</b><small>{stageComplete ? "诗喃 · 国庆诗歌剧场" : stageVocabulary ? "剧本与排练缓存" : "作品与旧档案"}</small></span>
        </button>

        <nav className="gallery-section-nav" aria-label="画廊栏目">
          <button type="button" className="is-current" onClick={() => navigate(stageComplete ? ROUTES.stageZhuhongmen : ROUTES.exhibition)}>{stageComplete ? "终场" : "展览"}</button>
          <span>{game.stageTransformStep >= 1 ? "剧本" : "作品"}</span>
          <span>{stageComplete ? "声音" : game.stageTransformStep >= 2 ? "朗读者" : "艺术家"}</span>
          <span>{game.stageTransformStep >= 3 ? "场记" : "出版"}</span>
          <span>{stageComplete ? "演出" : "关于"}</span>
        </nav>

        <form className="global-search" onSubmit={handleSearch} role="search">
          <Search aria-hidden="true" />
          <label className="sr-only" htmlFor="global-query">{stageVocabulary ? "搜索剧本、朗读者、场记或演出名称" : "搜索作品、人名、尺寸或文件标签"}</label>
          <input id="global-query" ref={searchInputRef} value={query} onChange={(event) => setQuery(event.target.value)} placeholder={stageVocabulary ? "搜索剧本、朗读者、场记或演出名称" : "搜索作品、人名、尺寸或文件标签"} autoComplete="off" spellCheck={false} aria-describedby="search-instruction" />
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
          <section className="case-name-reveal"><span>案件名称／首次完整出现</span><h2>他山地方公墓贪污案</h2><p>五名参与者的档案由此被编入同一索引。使用完整案名继续搜索。</p><code>NEXT: CASE / CEMETERY / 05 PERSONS</code></section>
        </>
      )}
    </article>
  );
}

function CemeteryCasePage() {
  const participants = [
    { name: "杜万琳", alias: "旧名：杜南阳", relation: "项目参与者；与画廊、家庭手续相互交叉", record: "火化单／方晚代签", death: "已故；表面记录为病逝、肝病相关，遗体已火化" },
    { name: "方晚", alias: "", relation: "项目参与者；杜万琳同乡、同学与画廊合伙人", record: "旧成员履历／火化单代签", death: "已故；死亡过程未公开" },
    { name: "王克定", alias: "", relation: "项目参与者；旧社团关系者", record: "认尸、尸检与物证补充", death: "已故；遭杀害，自杀现场系伪造" },
    { name: "刑万", alias: "新闻匿名：刑某", relation: "项目参与者；旧社团名单与新闻缓存重合", record: "公开新闻／旧合照", death: "已故；死亡过程未公开" },
    { name: "莉香", alias: "", relation: "项目参与者；杜家亲属、刑万关联人", record: "亲属卡／河流档案", death: "已故；溺亡" },
  ];

  return (
    <article className="case-index-page">
      <header className="case-index-head">
        <div><CacheStamp>CASE INDEX / 05 PERSONS</CacheStamp><p className="section-kicker">项目参与者交叉索引</p><h1>他山地方<br />公墓贪污案</h1></div>
        <aside><span>索引原则</span><p>只呈现人物关系、可核对记录与死亡过程；不在现有文本之外推定任何责任归属。</p></aside>
      </header>

      <div className="case-table-wrap">
        <table className="case-table">
          <thead><tr><th>人物</th><th>项目关系</th><th>公开／恢复记录</th><th>死亡过程</th></tr></thead>
          <tbody>{participants.map((person) => <tr key={person.name}><th scope="row"><b>{person.name}</b>{person.alias && <small>{person.alias}</small>}</th><td>{person.relation}</td><td>{person.record}</td><td className={person.name === "王克定" ? "case-critical" : ""}>{person.death}</td></tr>)}</tbody>
        </table>
      </div>

      <section className="case-index-foot"><span>下一条公开记录</span><h2>刑某</h2><p>新闻标题没有写出全名；合照与人物库将这个匿名写法合并到刑万。</p></section>
    </article>
  );
}

function XingNewsPage() {
  const [version, setVersion] = useState<"published" | "cache">("published");
  const cached = version === "cache";
  return (
    <article className="news-cache-page">
      <header className="news-cache-head"><div><CacheStamp>NEWS CACHE / VERSION DIFF</CacheStamp><p className="section-kicker">公开报道与缓存对照</p><h1>刑某</h1></div><div className="version-toggle" role="group" aria-label="选择新闻版本"><button type="button" className={!cached ? "is-active" : ""} onClick={() => setVersion("published")}>原刊</button><button type="button" className={cached ? "is-active" : ""} onClick={() => setVersion("cache")}>缓存</button></div></header>
      <section className="news-paper">
        <div className="news-masthead"><b>他山晚讯</b><span>{cached ? "网页缓存副本" : "原刊文字层"}</span></div>
        <p className="news-date">社会简讯 · 日期字段缺失</p>
        <h2>“他山地方公墓贪污案”涉案人员<br />刑某现已被警方依法逮捕</h2>
        <div className="news-copy"><p>报道正文未公开完整姓名，案由之外的犯罪事实、审判结果与死亡因果均不在本页扩写。</p><p>人物交叉索引：<strong>{cached ? "刑万（新闻匿名：刑某）" : "刑某"}</strong></p></div>
        {cached && <aside className="cache-difference"><span>CACHE ONLY</span><p><del>关联材料：内部人员栏已移除</del></p><p>后来材料残留：世伯承办的<strong>寿享陵园</strong>。</p></aside>}
      </section>
    </article>
  );
}

function ShouxiangPage() {
  return (
    <article className="old-web-page">
      <div className="old-browser-bar"><span>网页存档</span><code>http://shouxiang.invalid/staff/index.htm</code><b>最后抓取：20—</b></div>
      <header className="old-site-head"><div className="broken-old-logo" role="img" aria-label="寿享陵园旧标志图片加载失败"><span>IMG</span></div><div><h1>寿享陵园</h1><p>让思念有处安放</p></div><nav aria-label="旧网站导航"><span>首页</span><span>园区介绍</span><b>人员名单</b><span>联系我们</span></nav></header>
      <div className="old-marquee">通知：旧站停止维护，图片与联系方式均已失效。文字层由网页缓存保留。</div>
      <section className="old-staff-layout"><aside><h2>栏目导航</h2><ul><li>管理人员</li><li>园区服务</li><li>墓型展示</li><li>来园路线</li></ul><div className="broken-ad"><span>IMAGE NOT FOUND</span><p>陵园全景图</p></div></aside><div className="old-staff-list"><h2>工作人员名录</h2><table><thead><tr><th>姓名</th><th>职务</th><th>资料</th></tr></thead><tbody><tr><td><strong>杜彻</strong></td><td>负责人</td><td>家庭关系／婚礼通告可查</td></tr><tr><td>［字段损坏］</td><td>园务</td><td>图片失效</td></tr><tr><td>［字段损坏］</td><td>维护</td><td>联系方式已清除</td></tr></tbody></table><div className="old-responsible"><span>本页负责人</span><b>杜彻</b><p>经一位世伯介绍进入他山市公墓系统；旧站把他的家庭资料与婚礼通告放在同一人员索引下。</p></div></div></section>
      <footer className="old-site-foot">Copyright 20— 寿享陵园 · 本镜像使用无效示例域名，不提供现实联系方式</footer>
    </article>
  );
}

function DuChePage() {
  const [loginNote, setLoginNote] = useState("");
  return (
    <article className="person-page du-che-page">
      <header className="person-masthead"><div><CacheStamp>PERSON / NEXT GENERATION</CacheStamp><p className="section-kicker">人物档案 · 家庭与职业</p><h1>杜彻</h1><p>杜万琳与徐惠之子。前一代人物离世之后，他仍留在公墓系统与画廊往来中。</p></div><dl className="person-quick-facts"><MetaLine label="父亲">杜万琳（旧名杜南阳）</MetaLine><MetaLine label="母亲">徐惠</MetaLine><MetaLine label="配偶">李髮／李髪</MetaLine></dl></header>
      <section className="du-che-grid"><div className="biography-sheet"><span>履历交叉</span><p>杜彻年轻时中断大学学业，回到家乡经营画廊。画廊并非主要收入来源，他经一位世伯介绍，成为他山市公墓系统中的负责人。</p><p>家庭档案显示，他在前一代人物死亡之后继续留在这一系统。现有文本只呈现这段职业延续，不推定他承担案件责任。</p></div><aside className="wedding-index-card"><span>家庭公告</span><h2>杜彻婚礼</h2><p>新娘姓名在两个来源中分别写作“李髮”与“李髪”。</p><code>INDEX: LI_髮 / LI_髪</code></aside></section>
      <Dialog>
        <DialogTrigger asChild><button className="editor-login-link" type="button">编辑登录</button></DialogTrigger>
        <DialogContent className="editor-login-dialog"><DialogHeader><DialogTitle>旧站编辑登录</DialogTitle><DialogDescription>登录入口仍在，但本页没有提供账号或密码。</DialogDescription></DialogHeader><form onSubmit={(event) => { event.preventDefault(); setLoginNote("凭据不完整，编辑缓存未开放。输入内容没有被保存。"); }}><label>账号<input name="archive-user" autoComplete="off" /></label><label>密码<input name="archive-password" type="password" autoComplete="off" /></label><Button type="submit">登录后台</Button><p role="status">{loginNote}</p></form></DialogContent>
      </Dialog>
    </article>
  );
}

function WeddingPage() {
  const [variant, setVariant] = useState<"髮" | "髪">("髮");
  return (
    <article className="wedding-page">
      <header className="wedding-head"><div><CacheStamp>WEDDING ARCHIVE / 07</CacheStamp><p className="section-kicker">家庭公告与城市舞台指示</p><h1>杜彻 × 李{variant}</h1><p>两种字形来自不同文本层，人物关系完全一致。</p></div><div className="variant-toggle" role="group" aria-label="切换李髮姓名字形"><span>来源字形</span><button type="button" className={variant === "髮" ? "is-active" : ""} onClick={() => setVariant("髮")}>李髮</button><button type="button" className={variant === "髪" ? "is-active" : ""} onClick={() => setVariant("髪")}>李髪</button></div></header>
      <section className="wedding-record"><div><span>婚礼记录</span><p>“杜彻婚礼办得足够气派。”婚礼档案把画廊、公墓工作与新家庭放进同一个时间切面。</p></div><div><span>人物关系</span><p>杜彻：杜万琳与徐惠之子。李{variant}：杜彻的结婚对象。</p></div></section>
      <RecoveredScript id="07" section="瞽人篇 · 2.2" title="舞" reader="徐惠">
        <p>斗转直下的黑<br />负重之湿<br />还有云此间将要有雨</p>
        <p>去到新康路<br />扔掉雨具<br />像这样左脚<br />轻曼地踏在双实线<br />像这样右脚<br />跨过排水口</p>
        <p>舞在一个又一个<br />打夜场的铺面之前<br />唱一支新近的流行歌<br />抵着喉咙根<br />不必处处都唱得好</p>
        <p>我们合着这朝夕复刻的濡湿声<br />今天它迟了半个拍子，比以往慢。<br />可是还得一样地跳起来，散射在侧身雨汽里的<br />前照灯扑在脸妆上</p>
        <p>黄色晕圈早于粉彩使你更加鲜艳<br />在这盛大的湿润里<br />你还能舞到清晨。</p>
      </RecoveredScript>
    </article>
  );
}

function TastePage() {
  return (
    <article className="script-record-page">
      <header className="script-record-head"><div><ArtifactTag>已恢复 10 / 14</ArtifactTag><p className="section-kicker">句肉篇 · 4.1</p><h1>刍味</h1><p>朗读声部：杜彻</p></div><aside><span>相似标题</span><b>刍胃</b><p>只差一个同音字。</p></aside></header>
      <RecoveredScript id="10" section="句肉篇 · 4.1" title="刍味" reader="杜彻">
        <p>有可能只是一个问句<br />关于先前愤岖的酒瓶<br />——在它没抛出口的那一瞬间——他举得很高。<br />之后却失手沉重摔落地上，<br />碎片剥离的断口上沾着酒精带血。</p>
        <p>你同旁人喝的第一场酒，<br />兴许是在城东的烧烤摊。<br />请教你胡须的割法，你记得<br />他一边还不停摸着下颌。</p>
        <p>这反倒让你注意到他眉目舒展，<br />阴影里棱角分明。<br />你想问问某人关于婚姻，甚至是血或者月亮<br />颤巍的音节总不构成一段话<br />告诉自己再多喝两杯。</p>
        <p>你想到可以有另外的问题，譬如从世伯<br />承办的寿享陵园着手，关于死后的住处<br />他很早就向你兜售一种活法<br />告诉你中国人古典的稳重和他眼里全部的社会。</p>
        <p>真能这般说出口么<br />这些死和不安？究底是另外些什么？<br />这会儿你只是这样想<br />烟晕笼住顶棚打下的灯<br />面对着的中年男人愈来愈沉默。</p>
        <p>血反冲到口腔的腥味快淹过来。<br />倒在地面，众人惊忙里赶来<br />拨着急救电话。</p>
      </RecoveredScript>
    </article>
  );
}

function MedicalPage({ revealed, glyphRevealed, onToggleGlyph }: { revealed: boolean; glyphRevealed: boolean; onToggleGlyph: () => void }) {
  return (
    <article className={`medical-page${revealed ? " is-revealed" : ""}`}>
      <header className="medical-head"><div><CacheStamp>{revealed ? "REDACTION REMOVED / 11" : "MEDICAL CACHE / REDACTED"}</CacheStamp><p className="section-kicker">标题校订与症状索引</p><h1>刍<button type="button" className="glyph-correction" onClick={onToggleGlyph} disabled={revealed || glyphRevealed} aria-label="把被划去的味字校订为胃"><del>味</del><ins className={glyphRevealed || revealed ? "is-visible" : ""}>胃</ins></button></h1></div><div className="time-reversal"><span>旧站修改记录</span><b>{revealed ? "18:14 ← 18:15" : "18:15"}</b><small>{revealed ? "时间戳短暂倒退一分钟" : "历史层未展开"}</small></div></header>
      <section className="medical-sheet"><div className="medical-title-line"><span>疾病名称</span><strong>{revealed ? "阿尔茨海默病" : "××××××"}</strong></div><p>一种起病隐匿、进行性发展的神经系统退行性疾病。现有文字层列出以下临床表现：</p><ul><li>记忆障碍</li><li>失语</li><li>失用</li><li>失认</li><li>视空间技能损害</li><li>执行功能障碍</li><li>人格和行为改变</li></ul>{!revealed && <p className="medical-search-note">病名被六个字符遮挡；症状列表仍可全文搜索。</p>}</section>
      {revealed && <RecoveredScript id="11" section="句肉篇 · 4.2" title="刍胃" reader="杜万琳">
        <p>时钟要敲打六点一刻的表面<br />它会多走一分钟。<br />这样的话偌大院子里<br />那些胡乱种下的果树<br />会抛出那枚剥开的橘子<br />经护工埋下再发新芽。</p>
        <p>有时偶然落在其他人不大的墓碑跟前<br />你会抱怨修在养老院旁为何没有围墙。<br />它因此被判入室抢劫么？<br />还是和许多年前一样动人的枪毙<br />是含水的？</p>
        <p>如今看见的像是<br />养老院发来的亡故通知<br />也带着果梗。<br />几个同住的老兄弟<br />站在碑前感叹<br />也许真已到暮年。</p>
        <p>你会觉得呼吸依旧顺畅，子女们<br />偶尔会拿着那薄纸闻闻<br />寻橘子鲜活的气味无时无刻<br />在你油墨名字、<br />在你老的尸首上反刍。</p>
        <p>你讲不出一个完整的故事<br />屏息前最后几个画面<br />以至于毫无干系。</p>
      </RecoveredScript>}
      {revealed && <section className="old-history-reveal"><span>旧站历史／下一条名称</span><h2>阔南会社</h2><p>杜彻与葛东平改造画廊时曾考虑使用的名称。正文尚未进入当前恢复范围。</p><code>NEXT: S29 / METADATA ONLY</code></section>}
    </article>
  );
}

function KuonanHistoryPage({ loaded, reducedMotion, onLoad }: { loaded: number; reducedMotion: boolean; onLoad: () => void }) {
  const versions = [
    { id: "V.05", label: "当前公开版", title: "憎恶社", note: "作品与旧档案" },
    { id: "V.04", label: "装修后缓存", title: "憎恶社画廊", note: "删除旧站命名说明" },
    { id: "V.03", label: "迁移版本", title: "阔南画廊", note: "站名字段发生改写" },
    { id: "V.02", label: "内部预览", title: "阔南会社／憎恶社", note: "杜彻提出使用小说中的组织名" },
    { id: "V.01", label: "最早保存版", title: "阔南会社", note: "画馆是阔南会社。署名：李司贰" },
  ];
  return (
    <article className="kuonan-history-page">
      <header className="archive-terminal-head"><div><CacheStamp>SITE HISTORY / {loaded} OF 5</CacheStamp><p className="section-kicker">旧站版本向下追溯</p><h1>阔南会社</h1></div><aside><span>已载入</span><b>{loaded}/5</b><p>每次抵达页面底部，只会载入一个更早版本。</p></aside></header>
      <section className="version-stack" aria-label={`已载入 ${loaded} 个旧版本`}>{versions.slice(0, loaded).map((version, index) => <article key={version.id} className={index === 4 ? "origin-version" : ""}><div><span>{version.id}</span><small>{version.label}</small></div><h2>{version.title}</h2><p>{version.note}</p>{index === 4 && <strong>站内书信索引：李司贰 → 叶是</strong>}</article>)}</section>
      {loaded < 5 ? <div className="history-loader"><p>{reducedMotion ? "减少动态已开启，请手动载入。" : "继续滚至底部，载入更早版本。"}</p>{reducedMotion && <Button type="button" onClick={onLoad}>载入更早版本（{loaded + 1}/5）</Button>}</div> : <section className="autofill-notice"><span>5/5 · 最早版本已恢复</span><p>署名将写入顶部搜索框，但不会自动提交，也不会覆盖正在输入的文字。</p></section>}
    </article>
  );
}

function LiLetterPage() {
  return (
    <article className="letter-page">
      <header className="letter-meta"><div><CacheStamp>PRIVATE LETTER / CACHE</CacheStamp><p className="section-kicker">站名改写依据</p><h1>李司贰致叶是</h1></div><dl><MetaLine label="收件人">叶是</MetaLine><MetaLine label="缓存账号"><code>editor_ys</code></MetaLine><MetaLine label="日期">20XX.2.20</MetaLine></dl></header>
      <section className="letter-sheet"><p>叶是：</p><p>前些日子参考你同乡张恋发来的西岩寺主持元昶人物访谈资料，做了几首不太好的诗歌，悉以令作《礼倒僧元昶》，各中民俗相关描写不逮笔力，还望去日指点二三。</p><p>李髪、杜彻上月慨已结婚，夫妇俩托我向你道歉，有关婚礼邀请实在太忙没有寄出。他们也是看到你捎来的赠诗，才记起做邀请函时候忘记写你。</p><p>上月葛东平联合杜彻在 Z 城重新装修了画廊。杜彻执意要以自己小说里的“憎恶社”来命名，我们都觉着不太吉利，最后综合一下，他妥协名字改成了“阔南会社”。</p><p>对了，你应该是看过他的那篇小说的草稿。当时我们说其中诗的部分过于浓重而堪堪难阅，他记了很久，最后索性写得流水账起来。</p><p>半年未见，凭此信代为问安。</p><footer><strong>李司贰</strong><span>20XX.2.20</span></footer></section>
      <section className="letter-crossref"><span>书信第一次确认</span><p><b>“憎恶社”首先是杜彻小说里的组织名。</b>网站中的人物、画廊和所谓历史，可能同时属于小说、诗剧与编辑改稿。</p><code>NEXT TITLE: 玛赫的厨房</code></section>
    </article>
  );
}

function MahePublicationPage() {
  return (
    <article className="publication-page">
      <header className="publication-cover"><div><span>杜彻 小说</span><h1>玛赫的<br />厨房</h1><p>荷潜艇出版社</p></div><aside><b>2019</b><span>初版</span></aside></header>
      <section className="copyright-grid"><div><p className="section-kicker">版权页／出版档案</p><dl><MetaLine label="书名">《玛赫的厨房》</MetaLine><MetaLine label="作者">杜彻</MetaLine><MetaLine label="出版">荷潜艇出版社</MetaLine><MetaLine label="首版年份">2019</MetaLine><MetaLine label="再版编辑">叶主任</MetaLine></dl></div><aside className="password-rule-note"><span>页边批注</span><h2>初始口令</h2><p>书名拼音首字母<br /><b>＋</b><br />首版年份</p><code>M H D C ＋ 2019</code><small>页面不会自动复制或填入结果。</small></aside></section>
      <section className="revision-request"><span>再版修改建议</span><p>“初版小说里涉及到的问题慨已指明，请在本月底将改稿交付荷潜艇编辑部<strong>叶主任</strong>处。”</p></section>
    </article>
  );
}

function EditorLoginPage({ user, password, attempts, note, alreadyUnlocked, onUserChange, onPasswordChange, onSubmit, onReopen }: { user: string; password: string; attempts: number; note: string; alreadyUnlocked: boolean; onUserChange: (value: string) => void; onPasswordChange: (value: string) => void; onSubmit: (event: FormEvent<HTMLFormElement>) => void; onReopen: () => void }) {
  return (
    <article className="editor-gate-page">
      <header><CacheStamp>EDITOR CACHE / LOCAL</CacheStamp><p className="section-kicker">叶主任／叶是</p><h1>编辑后台</h1><p>这是一处站内虚构缓存。不会连接现实账号，不保存明文口令。</p></header>
      {alreadyUnlocked ? <section className="login-unlocked"><UnlockKeyhole aria-hidden="true" /><h2>编辑缓存已解锁</h2><p>浏览器只记录“已登录”状态。</p><Button type="button" onClick={onReopen}>重新进入修订记录</Button></section> : <form className="editor-gate-form" onSubmit={onSubmit}><label><span>账号</span><input value={user} onChange={(event) => onUserChange(event.target.value)} autoComplete="off" spellCheck={false} /></label><label><span>口令</span><input value={password} onChange={(event) => onPasswordChange(event.target.value)} type="password" autoComplete="off" /></label><Button type="submit"><LockKeyhole aria-hidden="true" /> 登录编辑缓存</Button><p role="status">{note || `错误次数不限，不锁号${attempts ? `；已尝试 ${attempts} 次` : ""}。`}</p></form>}
    </article>
  );
}

function EditorRevisionsPage() {
  const [view, setView] = useState<"initial" | "reprint">("reprint");
  return (
    <article className="admin-revisions-page">
      <header className="admin-bar"><div><span>EDITOR CACHE</span><b>叶是</b><small>账号 editor_ys · 已解锁</small></div><div className="version-toggle" role="group" aria-label="切换修订版本"><button type="button" className={view === "initial" ? "is-active" : ""} onClick={() => setView("initial")}>初版</button><button type="button" className={view === "reprint" ? "is-active" : ""} onClick={() => setView("reprint")}>再版批注</button></div></header>
      <section className="revision-board"><div className="revision-task"><span>REVISION TASK / 04</span><h1>人物年表修订</h1><p>对象：杜彻小说《玛赫的厨房》中的寺院主持。</p></div><article><span>{view === "initial" ? "初版正文" : "再版编辑批注"}</span>{view === "initial" ? <blockquote>“贤太在榻席上深叩一头，<mark>元昶</mark>合手以僧礼回。”</blockquote> : <blockquote>“初版有读者反映<mark>元昶</mark>之故事所陈不够条例清晰，或自行拟写活动年表，或作文本调整。”</blockquote>}</article><article><span>访谈转录</span><blockquote>“<mark>左君</mark>，原谅我称呼你本名，您的佛家法名实在难以念出。”</blockquote></article><aside><span>身份映射待确认</span><h2>元昶 ⇄ 左君</h2><p>一边是法名，一边是被替换前的本名。</p></aside></section>
    </article>
  );
}

function YuanchangPage() {
  const [edition, setEdition] = useState<"initial" | "edited">("edited");
  const timeline = [
    ["1937.5.2", "出生于四川仝城盐商家庭"],
    ["1950.6.2", "往西康省凉山州寻亲途中跟随剿匪队伍"],
    ["1953.8", "寻亲未果返乡，后往崧滈寺为僧"],
    ["1966.7", "蓄发还俗，后来离开内地"],
    ["1978.10", "返回仝城，于崧滈寺再度出家"],
    ["1989.11", "年表记录其于医院因旧伤感染去世"],
  ];
  return (
    <article className="character-revision-page">
      <header className="character-head"><div><CacheStamp>CHARACTER / IDENTITY MERGED</CacheStamp><p className="section-kicker">小说角色与可改写年表</p><h1>元昶 <span>／左君</span></h1><p>法名与本名指向同一角色。这里展示的是小说及编辑版本，不是现实人物档案。</p></div><div className="version-toggle" role="group" aria-label="切换年表版本"><button type="button" className={edition === "initial" ? "is-active" : ""} onClick={() => setEdition("initial")}>初版</button><button type="button" className={edition === "edited" ? "is-active" : ""} onClick={() => setEdition("edited")}>再版</button></div></header>
      <section className="character-timeline">{timeline.map(([date, event], index) => <div key={date} className={edition === "edited" && [1, 2, 3, 5].includes(index) ? "is-edited" : ""}><time>{date}</time><p>{edition === "initial" && [1, 2, 3, 5].includes(index) ? "［初版此段缺失］" : event}</p>{edition === "edited" && [1, 2, 3, 5].includes(index) && <span>再版补写</span>}</div>)}</section>
      <section className="fragment-index-preview"><header><span>附件索引</span><b>Ⅰ—Ⅹ</b></header><div>{["Ⅰ","Ⅱ","Ⅲ","Ⅳ","Ⅴ","Ⅵ","Ⅶ","Ⅷ","Ⅸ","Ⅹ"].map((number) => <i key={number}>{number}</i>)}</div><p>标题碎片：始／末／的／碎／点</p><small>解密提示：口令为作者被替换前的旧名。</small></section>
    </article>
  );
}

function RecoveredIndexPage({ revealed, password, attempts, note, transformStep, onPasswordChange, onSubmit, onStable }: { revealed: boolean; password: string; attempts: number; note: string; transformStep: number; onPasswordChange: (value: string) => void; onSubmit: (event: FormEvent<HTMLFormElement>) => void; onStable: () => void }) {
  const fragments = [
    ["Ⅰ. 徐掖", <>下桥转身路过锦蜀饭馆，徐掖因死掉堂妹<br />约朋友坐其外打扑克<br />从口袋褶巴里摸出玉溪，给人散去半盒。</>],
    ["Ⅱ. 徐惠其一", <>徐惠。去学画或者其他。家父习惯叫<br />这门技术为江南几省的罗网，<br />被着驳彩迷乱青年人底心性——他讲道理如是。</>],
    ["Ⅲ. 憎恶社其一", <>我们捉对捞取缸中月。刑万肢端槁糙，手浸其中，<br />扒附指缝的颜料污了水体，于倒影上泛泛油光。<br />锌白底尤是多杂。他转头仆入其下。痛饮，隔天肚痛总难耐异常。</>],
    ["Ⅳ. 徐惠其二", <>绿伞弄蝶憩息的一瞬<br />她睑皮块重，粉底被揉搡到眼角，背阔起而亘落，肋如囊。<br />飞离扑扑，一点三分炽阳布线。</>],
    ["Ⅴ. 杜南阳·婚姻之一", <>期望的生活在官能层面上那么臃肿，为此<br />一定要在每日餐前最末了几句话时提到：<br />“妻子对于男人的馈赠”“永不可染上情人色彩，这是其一。”</>],
    ["Ⅵ. 憎恶社其二", <>绵羊铺满中古的月亮，一起倒下<br />像是为此柔软的黑夜准备许久。</>],
    ["Ⅶ. 杜南阳／徐惠·婚姻之二", <>是忧郁之臀、餐布、扭怩的刀叉一齐亮相。<br />我手法灵敏切下肱骨属于你，今夜啊<br />深蓝之臀的古典抒情也打败了你。</>],
    ["Ⅷ. 杜南阳的焚烧签字单", <>那些寿命颀长的一代人在高温的导引中再度归去。<br />十六世纪是铁的厄运。英国色的铁。<br />从拼接到西阵织，展出西阵织的画馆是阔南会社。</>],
    ["Ⅸ. 原稿编号缺页", <>源文件由Ⅷ直接进入Ⅹ；此处保留编号空缺，不擅自补写。</>],
    ["Ⅹ. 刑万／莉香·婚姻之一", <>他曾经运用了哲辩抚慰了婚姻吗？</>],
  ];
  return (
    <article className={`fragment-stage-page step-${transformStep}`}>
      <header className="fragment-head"><div><CacheStamp>{revealed ? "RECOVERED SCRIPT / 12" : "ENCRYPTED INDEX / Ⅰ—Ⅹ"}</CacheStamp><p className="section-kicker">{revealed ? "场记正在显影" : "文本解密"}</p><h1>始末的碎点</h1></div>{revealed ? <div className="transform-status"><span>界面转换</span><b>{transformStep}/3</b><Button variant="outline" type="button" onClick={onStable} disabled={transformStep >= 3}>显示稳定版</Button></div> : <form className="fragment-password" onSubmit={onSubmit}><label>作者被替换前的旧名<input value={password} onChange={(event) => onPasswordChange(event.target.value)} autoComplete="off" /></label><Button type="submit">解除十段索引</Button><p role="status">{note || `错误不会清空碎片${attempts ? `；已尝试 ${attempts} 次` : ""}。`}</p></form>}</header>
      <section className="fragment-grid" aria-label="始末的碎点正文">{fragments.map(([title, copy], index) => <article key={String(title)} className={!revealed ? "is-locked" : ""}><span>{String(index + 1).padStart(2,"0")}</span><h2>{revealed ? title : `碎片 ${String(index + 1).padStart(2,"0")}`}</h2><div className="stable-fragment-copy">{revealed ? copy : "文字层已加密"}</div>{revealed && transformStep < 3 && <div className="glitch-overlay" aria-hidden="true">{index % 2 ? "剧本／声部／入场" : "▒ 场记_恢复中 ▒"}</div>}</article>)}</section>
      {revealed && <section className="stage-call"><span>SCENE INDEX / 13 OF 14</span><h2>文本已接近就位</h2><p>恢复目录只剩结诗。它与网站最初的当前展览使用同一个标题。</p><strong>下一搜索词：赭红门</strong></section>}
    </article>
  );
}

function StageZhuhongmenPage() {
  return (
    <article className="stage-zhuhongmen-page">
      <header className="stage-warm-head"><div><ArtifactTag>场次 14 / 14</ArtifactTag><p className="section-kicker">结诗 · 合读</p><h1>赭红门</h1></div><aside><span>场记</span><p>文本已齐。<br />所有人请就位。</p></aside></header>
      <RecoveredScript id="14" section="结诗 · 点意象之歌" title="赭红门" reader="合读">
        <p>追随潮退之狐。</p><p>将阵羽披挂的海豚此刻要返回海。<br />溺亡在水中央的开刃刀要返回海。<br />而刀刃是藤壶动物的密交。</p><p>破腹产口诀，剖开<br />虎皮鲨胃囊取出的鱼翅，鲜美。<br />那一点断头蛇，咬住了赭红色之门。</p><p>而咬住了赭红色之门的蛇<br />又褪下了麂皮夹克。</p><p>追随退潮之狐的折扇开屏，<br />与海的一般质地的气融贯合一。</p>
      </RecoveredScript>
      <section className="reader-call-sheet"><header><span>档案编号已转换为场次编号</span><b>朗读者就位</b></header><div><p>杜万琳 <span>朗读声部</span></p><p>方晚 <span>朗读声部</span></p><p>刑万 <span>朗读声部</span></p><p>徐惠 <span>朗读声部</span></p><p>杜彻 <span>朗读声部</span></p><p>合读 <span>终场</span></p></div></section>
      <section className="stage-note-final"><span>终场场记</span><h2>演出名：诗喃</h2><p>案件索引到这里停止。下一页不会公布凶手，只会让所有人物回到朗读者的位置。</p></section>
    </article>
  );
}

function ShinanPage() {
  const [performanceStarted, setPerformanceStarted] = useState(false);
  const [cue, setCue] = useState(0);
  const [selectedPhoto, setSelectedPhoto] = useState<number | null>(null);
  const activityPhotos = [
    ["现场投影", "“伪造入门及注意事项”开场画面"],
    ["黎晏／杜彻", "蒙眼入场"],
    ["黎晏／杜彻", "朗读现场"],
    ["叶非／方晚", "吉他与话筒"],
    ["郁绵／刑万", "朗读现场"],
    ["郁绵／刑万", "舞台现场"],
    ["林锐／徐惠", "朗读现场"],
    ["林锐／徐惠", "舞步与话筒线"],
    ["观众席", "现场记录"],
    ["观众席", "现场记录"],
    ["陳潮／杜万琳", "朗读现场"],
    ["陳潮／杜万琳", "舞台现场"],
    ["诗喃现场", "读诗"],
    ["诗喃现场", "舞台装置"],
    ["诗喃现场", "表演"],
    ["诗喃现场", "吉他"],
    ["诗喃现场", "合读"],
    ["诗喃现场", "朗读"],
    ["诗喃现场", "投影与朗读"],
    ["诗喃现场", "合读"],
    ["诗喃现场", "全景"],
  ] as const;
  const cues = [
    { title: "开场", copy: "投影亮起：我已看不见这些太阳。有人试着把麦克风推近。", photos: [0, 1, 2, 3] },
    { title: "声部进入", copy: "黎晏读杜彻，叶非读方晚。剧中人与朗读者第一次在同一页相遇。", photos: [4, 5, 6, 7, 8] },
    { title: "文本合流", copy: "郁绵读刑万，林锐读徐惠。那些曾被当成档案的人名，重新成为声部。", photos: [9, 10, 11, 12] },
    { title: "赭红门", copy: "陳潮读杜万琳。合读开始：追随潮退之狐。", photos: [13, 14, 15, 16] },
    { title: "谢幕", copy: "灯光亮起。观众听见翻页，也看见台上的人从角色中退场。", photos: [17, 18, 19, 20] },
  ] as const;
  const currentCue = cues[cue];
  return (
    <article className="shinan-page">
      <header className="shinan-hero"><div><span>航船诗歌社 · 国庆诗歌剧场</span><h1>诗喃</h1><p>你恢复的从来不是司法档案，而是一份被拆散、改写并藏进画廊网站的诗剧排练文本。</p></div><figure className="shinan-poster"><img src={browserPath("/archive/shinan/shinan-poster.webp")} alt="以蒙眼人物黑白网点照片为底图的《诗喃：青年之虚与实》演出海报" /><figcaption><span>演出海报</span><small>据上传原型图生成</small></figcaption></figure></header>
      {!performanceStarted ? <section className="performance-choice"><div><span>选择终场版本</span><h2>声音不构成通关门槛</h2><p>原成员录音尚未接入。本版先开放完整静音字幕终场；取得授权录音后，可在同一位置替换。</p></div><div><Button type="button" disabled>有声版 · 素材待接入</Button><Button type="button" onClick={() => setPerformanceStarted(true)}>静音字幕版开演</Button></div></section> : <section className="silent-performance"><header><span>静音字幕终场</span><b>{cue + 1}/{cues.length}</b></header><div className="cue-stage"><small>{currentCue.title}</small><p>{currentCue.copy}</p><div className="cue-photos" aria-label={`${currentCue.title}活动照片`}>{currentCue.photos.map((photoIndex) => <button type="button" key={photoIndex} onClick={() => setSelectedPhoto(photoIndex)}><img src={browserPath(`/archive/shinan/activity/photo-${String(photoIndex + 1).padStart(2, "0")}.webp`)} alt={`${activityPhotos[photoIndex][0]}：${activityPhotos[photoIndex][1]}`} /><span>{activityPhotos[photoIndex][0]}</span></button>)}</div></div><footer><Button variant="outline" type="button" onClick={() => setCue((value) => Math.max(0, value - 1))} disabled={cue === 0}>上一场记</Button>{cue < cues.length - 1 ? <Button type="button" onClick={() => setCue((value) => Math.min(cues.length - 1, value + 1))}>下一场记</Button> : <span className="curtain-call">演出结束 · 谢幕</span>}</footer></section>}
      <section className="shinan-truth"><span>最后一次身份转换</span><div><h2>他们是剧中人，也是朗读者。</h2><p>公墓案、死亡记录、人物年表和新闻缓存属于《诗喃》的剧内文本与舞台道具。现实层只留下航船诗歌社、海报、活动照片与成员声音。</p></div></section>
      <section className="activity-archive"><header><div><span>现场档案 / 01—21</span><h2>青年之虚与实 · 石狮场</h2></div><p>活动照按原文档出现顺序归档。点击照片可查看完整画面。</p></header><div className="activity-grid">{activityPhotos.map(([title, detail], index) => <button type="button" key={index} onClick={() => setSelectedPhoto(index)}><img src={browserPath(`/archive/shinan/activity/photo-${String(index + 1).padStart(2, "0")}.webp`)} alt={`${title}：${detail}`} loading="lazy" /><span>{String(index + 1).padStart(2, "0")}</span><div><b>{title}</b><small>{detail}</small></div></button>)}</div></section>
      <section className="material-status"><article><span>14/14</span><h3>完整排练文本</h3><p>序诗、五个篇章与结诗已经全部恢复。</p></article><article><span>已接入</span><h3>演出海报与活动照</h3><p>根据上传原型生成海报，21 张现场照片依文档顺序归档。</p></article><article><span>待录制</span><h3>成员声音谢幕</h3><p>录音接入后仍保留字幕与全文，不要求玩家开启声音。</p></article></section>
      {selectedPhoto !== null && <div className="photo-lightbox" role="dialog" aria-modal="true" aria-label={`活动照片 ${selectedPhoto + 1}`} onClick={() => setSelectedPhoto(null)}><div onClick={(event) => event.stopPropagation()}><button type="button" onClick={() => setSelectedPhoto(null)} aria-label="关闭活动照片"><X aria-hidden="true" /></button><img src={browserPath(`/archive/shinan/activity/photo-${String(selectedPhoto + 1).padStart(2, "0")}.webp`)} alt={`${activityPhotos[selectedPhoto][0]}：${activityPhotos[selectedPhoto][1]}`} /><p><span>{String(selectedPhoto + 1).padStart(2, "0")} / 21</span><b>{activityPhotos[selectedPhoto][0]}</b><small>{activityPhotos[selectedPhoto][1]}</small></p></div></div>}
    </article>
  );
}
