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
  LockKeyhole,
  Search,
  History,
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
import { ShouxiangPage } from "./shouxiang-page";
import { FamilyPhoto, WeddingPhotoPuzzle, ShopPhoto, INITIAL_WEDDING_TILES, isWeddingPhotoComplete } from "./archive-photo-interactions";
import { type JuroutuanfeiTextBlock } from "./juroutuanfei-text";
import { getReadingChapter } from "./juroutuanfei-layout";
import { OpeningPrologue } from "./opening-prologue";
import { StoneInspection, inspectStoneOpening } from "./stone-inspection";
import { RentedRoom } from "./rented-room";

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
  searchHistory: string[];
  familyPhotoRead: boolean;
  societyMembersRevealed: boolean;
  roomDrumRead: boolean;
  weddingPhotoTiles: number[];
  weddingPhotoSolved: boolean;
  frameClicks: number;
  stoneBreakClicks: number;
  stoneBaseClicks: number;
  stoneOpenings: number;
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
  action?: "mang" | "wang";
  searchTerm?: string;
};

export type DirectoryEntry = {
  id: string;
  eyebrow: string;
  title: string;
  summary: string;
  path?: string;
  isNew?: boolean;
};

export const DEFAULT_STATE: GameState = {
  unlocked: [],
  recovered: [],
  visited: [],
  searchHistory: [],
  familyPhotoRead: false,
  societyMembersRevealed: false,
  roomDrumRead: false,
  weddingPhotoTiles: INITIAL_WEDDING_TILES,
  weddingPhotoSolved: false,
  frameClicks: 0,
  stoneBreakClicks: 0,
  stoneBaseClicks: 0,
  stoneOpenings: 0,
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
  home: "/",
  exhibitions: "/exhibitions",
  people: "/people",
  news: "/news",
  cemeteryReport: "/news/cemetery-report",
  duCheFamily: "/members/du-che-family",
  xuHui: "/members/xu-hui",
  publications: "/publications",
  about: "/about",
  exhibition: "/exhibitions/zhuhongmen",
  geDongping: "/members/ge-dongping",
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
  juroutuanfei: "/publications/juroutuanfei",
  jurouSection1: "/publications/juroutuanfei/section-1",
  jurouSection2: "/publications/juroutuanfei/section-2",
  jurouSection3: "/publications/juroutuanfei/section-3",
  jurouSection4: "/publications/juroutuanfei/section-4",
  jurouSection5: "/publications/juroutuanfei/section-5",
  scatteredSemu: "/archive/scattered/se-mu-jue-cao",
  scatteredTiefangshan: "/archive/scattered/tiefangshan-bu",
  scatteredZoudi: "/archive/scattered/zoudi-guoji",
  scatteredNanfuzi: "/archive/scattered/nanfuzi",
  editorLogin: "/admin/editor/login",
  editorRevisions: "/admin/editor/revisions",
  yuanchang: "/admin/characters/yuanchang",
  recoveredIndex: "/stage/recovered-index",
  stageZhuhongmen: "/stage/zhuhongmen",
  shinan: "/stage/shinan",
};

const PAGE_TITLES: Record<string, string> = {
  [ROUTES.cemeteryReport]: "他山地方公墓贪污案｜旧闻",
  [ROUTES.duCheFamily]: "杜彻｜家属记录",
  [ROUTES.xuHui]: "徐惠｜人物档案",
  [ROUTES.home]: "憎恶社｜当代艺术与出版",
  [ROUTES.exhibitions]: "展览｜憎恶社",
  [ROUTES.people]: "人物｜憎恶社",
  [ROUTES.news]: "新闻｜憎恶社",
  [ROUTES.publications]: "出版物｜憎恶社",
  [ROUTES.about]: "关于｜憎恶社",
  [ROUTES.exhibition]: "赭红门｜当期展览",
  [ROUTES.geDongping]: "葛东平｜人物档案",
  [ROUTES.artwork]: "白芍肉｜撤回作品缓存",
  [ROUTES.curator]: "李泰｜旧成员缓存",
  [ROUTES.dimensions]: "3dm×3dm｜尺寸交叉索引",
  [ROUTES.damagedReader]: "损坏朗读页｜档案 01",
  [ROUTES.recoveredOne]: "盲之春｜已恢复",
  [ROUTES.history]: "憎恶社｜旧社团历史",
  [ROUTES.duNanyangOld]: "杜南阳｜旧人物页",
  [ROUTES.duWanlin]: "杜万琳｜人物原型档案",
  [ROUTES.fangWan]: "方晚｜人物档案",
  [ROUTES.dongxingPeter]: "东兴彼得｜城市旧照",
  [ROUTES.wangKeding]: "王克定｜人物档案",
  [ROUTES.xingWan]: "邢万｜人物档案",
  [ROUTES.liXiangDeath]: "莉香｜溺亡记录",
  [ROUTES.wangAutopsy]: "王克定｜认尸与尸检摘要",
  [ROUTES.stoneHead]: "石立人·头部塑像｜物证记录",
  [ROUTES.xiyanTemple]: "西岩寺｜石像档案",
  [ROUTES.phoenixRoute]: "凤凰水库｜河流路线",
  [ROUTES.wangSupplement]: "王克定｜尸检补充",
  [ROUTES.wangDeath]: "王克定之死｜已恢复",
  [ROUTES.duCremation]: "杜万琳｜焚烧签字单",
  [ROUTES.duCremationSigned]: "杜万琳｜完整焚烧签字单",
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
  [ROUTES.juroutuanfei]: "句肉抟飞｜连载索引",
  [ROUTES.jurouSection1]: "Section.1 3dm×3dm A.A.1｜句肉抟飞",
  [ROUTES.jurouSection2]: "Section.2 紙式鱿魚｜句肉抟飞",
  [ROUTES.jurouSection3]: "Section.3 鳥首上行功曹歌 A.A.2｜句肉抟飞",
  [ROUTES.jurouSection4]: "Section.4 皮｜句肉抟飞",
  [ROUTES.jurouSection5]: "Section.5 瑪赫的厨房｜句肉抟飞",
  [ROUTES.scatteredSemu]: "色目掘漕｜独立散页",
  [ROUTES.scatteredTiefangshan]: "铁房山补｜独立散页",
  [ROUTES.scatteredZoudi]: "走地国记｜独立散页",
  [ROUTES.scatteredNanfuzi]: "男腹子｜独立散页",
  [ROUTES.editorLogin]: "叶是｜编辑后台登录",
  [ROUTES.editorRevisions]: "叶是｜编辑缓存",
  [ROUTES.yuanchang]: "元昶／左君｜角色修订页",
  [ROUTES.recoveredIndex]: "始末的碎点｜解密索引",
  [ROUTES.stageZhuhongmen]: "赭红门｜终场",
  [ROUTES.shinan]: "诗稿完成｜本地提示",
};

const HINTS: Record<string, string[]> = {
  [ROUTES.home]: [
    "这是画廊公开首页。最新公告会把你带进当期展览的异常记录。",
    "向下滑动，找到关于展品状态的告示。",
    "点击“查看告示及展厅记录”。",
  ],
  [ROUTES.exhibitions]: ["这里只收录已经公开或被你找回的展览记录。", "当期展览仍是所有异常的入口。", "打开：赭红门。"],
  [ROUTES.people]: ["人物目录会随检索进度更新。", "刚刚破解的人物会带有 NEW 标记。", "选择任一已公开人物档案继续核对。"],
  [ROUTES.news]: ["新闻栏目只显示已经完成交叉验证的记录。", "案件被破解后会出现在这里。", "选择带有 NEW 标记的新闻缓存。"],
  [ROUTES.publications]: ["出版物目录与调查进度同步。", "《句肉抟飞》的每个 Section 会在对应搜索节点完成后成为独立条目。", "带有 NEW 标记的条目包含刚刚开放的完整章节。"],
  [ROUTES.about]: ["公开介绍与旧站历史并不完全一致。", "旧版本只有在被你找到后才会出现在这里。", "选择带有 NEW 标记的旧站资料。"],
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
  [ROUTES.geDongping]: [
    "这是公开人物条目；附图与文字只作为葛东平的人物材料出现。",
    "作品撤回线索仍需从展厅记录与搜索框继续追查。",
  ],
  [ROUTES.damagedReader]: [
    "乱码不会阻断线索，可以打开纯文字版本。",
    "残留词可以直接组合搜索，不必先完成同义替换。",
    "搜索：看不见春天。也可以继续推导并搜索：盲之春。",
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
    "杜南阳的家庭栏写着配偶的姓名。",
    "徐惠保留了一张撕碎的婚纱照。",
    "搜索：徐惠，拼合那张照片。",
  ],
  [ROUTES.duWanlin]: [
    "人物原型档案中有一张没有姓名的同乡履历卡。",
    "他曾辍学务农、在果园劳动，后来去杭州学画。",
    "搜索：方晚。",
  ],
  [ROUTES.fangWan]: [
    "人物页保留着一张店铺照片。",
    "把照片招牌上的四个字完整输入搜索框。",
    "搜索：东兴彼得。",
  ],
  [ROUTES.dongxingPeter]: [
    "点一下橱窗的照片，再读访客笔记的末尾。",
    "那里的姓名也是一份朗读文件标题。",
    "搜索：王克定。",
  ],
  [ROUTES.wangKeding]: [
    "王克定的资料附有一份旧社团档案。",
    "打开这份档案，看看合照下方补出的成员姓名。",
    "也可以查找他住过的地方：西门车站附近廉租房。",
  ],
  [ROUTES.xingWan]: [
    "杜彻童年合照的背面留着姑姑的姓名。",
    "将背面的字迹与父母关系互相核对。",
    "搜索：莉香。",
  ],
  [ROUTES.liXiangDeath]: [
    "河流档案还交叉引用了另一名死者的尸检材料。",
    "附件索引已经写出材料名称。",
    "搜索：尸检报告。",
  ],
  [ROUTES.wangAutopsy]: [
    "报告里有一件与投河叙述极不相称的物证。",
    "它连接在死者反绑的双手后面。",
    "搜索：石立人。",
  ],
  [ROUTES.stoneHead]: [
    "物证来源栏保留了一处寺院名称。",
    "后山旧照与《浣石》残句都指向同一地点。",
    "搜索：西岩寺。",
  ],
  [ROUTES.xiyanTemple]: [
    "佛头的脸上还留有可触碰的位置。",
    "双眼、双耳、两个鼻孔与嘴，共有七窍。",
    "分别点击七窍，等血迹显现后查看掉落的纸条。",
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
    "搜索：焚烧签字单。",
  ],
  [ROUTES.duCremation]: [
    "代签栏只露出“方＿”，到院记录里写着他的名字。",
    "签字单让这个人的档案多出了一份记录；再搜一次他的名字。",
    "搜索：方晚。",
  ],
  [ROUTES.duCremationSigned]: [
    "收据抬头上的公墓名，也出现在新闻栏的旧闻中。",
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
    "旧站还留着一条与来访者有关的文学索引。",
    "世伯曾向杜彻介绍寿享陵园，索引保留了他的姓名。",
    "搜索：杜彻。",
  ],
  [ROUTES.duChe]: [
    "人物页写出杜彻结婚对象的名字。",
    "她的姓名是李髮；简体字只会给出纠错提示。",
    "搜索：李髮。也可以先搜索：刍味。",
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
    "第 5 版会同时出现最早署名与站内书信索引；用署名查找那封信。",
  ],
  [ROUTES.liLetter]: [
    "书信说明“憎恶社”来自杜彻的一部小说。",
    "出版目录中唯一对应的书名是《玛赫的厨房》。",
    "搜索：玛赫的厨房。记住页脚账号 editor_ys。",
  ],
  [ROUTES.mahePublication]: [
    "版权页给出首版年份，页边给出口令组合规则。",
    "把书名拼音首字母放在 2019 前面。",
    "搜索叶主任或叶是；后台口令是 MHDCF2019。",
  ],
  [ROUTES.juroutuanfei]: [
    "《句肉抟飞》改为随调查进度出现的章节连载。",
    "出版物目录只显示已经由搜索节点触发的章节；未开放章节不会提前列出标题。",
    "第一章在“盲之春”恢复后出现，之后各章跟随方晚、婚礼、书信与元昶／左君等材料逐步开放。",
  ],
  [ROUTES.jurouSection1]: ["这是搜索“盲之春”后开放的第一章。", "正文按原稿顺序完整收录。", "读完后返回出版物目录；后续调查会带来下一条连载。"],
  [ROUTES.jurouSection2]: ["这是方晚档案恢复后开放的第二章。", "正文按原稿顺序完整收录。", "读完后返回出版物目录；后续调查会带来下一条连载。"],
  [ROUTES.jurouSection3]: ["这是“舞”与婚礼档案恢复后开放的第三章。", "正文按原稿顺序完整收录。", "读完后返回出版物目录；后续调查会带来下一条连载。"],
  [ROUTES.jurouSection4]: ["这是李司贰书信被找到后开放的第四章。", "正文按原稿顺序完整收录。", "读完后返回出版物目录；后续调查会带来最终一章。"],
  [ROUTES.jurouSection5]: ["这是元昶／左君身份合并后开放的最终章。", "正文与原稿末页插图均已完整收录。", "五章至此全部可读。"],
  [ROUTES.editorLogin]: [
    "账号在李司贰书信的收件元数据里。",
    "口令规则在《玛赫的厨房》版权页：首字母＋2019。",
    "账号 editor_ys；口令 MHDCF2019。",
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
    "十四份诗稿已经全部恢复，加密文件夹的目录已更新。",
    "关闭或最小化浏览器，回到旧电脑桌面。",
    "打开“上锁文件夹”，寻找新出现的隐藏 TXT。",
  ],
  [ROUTES.shinan]: [
    "这条旧地址不再保存演出资料。",
    "最终口令不会直接显示在网页里。",
    "回到桌面的“上锁文件夹”，打开全部诗稿完成后出现的隐藏 TXT。",
  ],
};

type JuroutuanfeiChapter = {
  number: 1 | 2 | 3 | 4 | 5;
  route: string;
  sourceTitle: string;
  displayTitle: string;
  trigger: string;
  isAvailable: (game: GameState) => boolean;
};

const JUROUTUANFEI_CHAPTERS: JuroutuanfeiChapter[] = [
  {
    number: 1,
    route: ROUTES.jurouSection1,
    sourceTitle: "Section.1    3dm×3dmA.A.1",
    displayTitle: "3dm×3dm A.A.1",
    trigger: "恢复“盲之春”后开放",
    isAvailable: (game) => game.recovered.includes("01"),
  },
  {
    number: 2,
    route: ROUTES.jurouSection2,
    sourceTitle: "Section.2 紙式鱿魚",
    displayTitle: "紙式鱿魚",
    trigger: "恢复“方晚”后开放",
    isAvailable: (game) => game.recovered.includes("03"),
  },
  {
    number: 3,
    route: ROUTES.jurouSection3,
    sourceTitle: "Section.3 鳥首上行功曹歌AA.2",
    displayTitle: "鳥首上行功曹歌 A.A.2",
    trigger: "恢复“舞”后开放",
    isAvailable: (game) => game.recovered.includes("07"),
  },
  {
    number: 4,
    route: ROUTES.jurouSection4,
    sourceTitle: "Section.4  皮",
    displayTitle: "皮",
    trigger: "找到“李司贰致叶是”后开放",
    isAvailable: (game) => game.unlocked.includes("S30"),
  },
  {
    number: 5,
    route: ROUTES.jurouSection5,
    sourceTitle: "Section.5瑪赫的厨房",
    displayTitle: "瑪赫的厨房",
    trigger: "合并“元昶／左君”后开放",
    isAvailable: (game) => game.unlocked.includes("S33"),
  },
];

function getJuroutuanfeiChapterBlocks(number: JuroutuanfeiChapter["number"]) {
  return getReadingChapter(number);
}

export function buildPublicCatalog(game: GameState) {
  const unlocked = (step: string) => game.unlocked.includes(step);
  const recovered = (id: string) => game.recovered.includes(id);
  const isUnvisited = (path: string) => !game.visited.includes(path);

  const people: DirectoryEntry[] = [
    (unlocked("P-GE") || game.visited.includes(ROUTES.geDongping)) && { id: "ge-dongping", eyebrow: "参展者 / 人物档案", title: "葛东平", summary: "《赭红门》当期展览相关人物；人物附图与文本摘录现已归档。", path: ROUTES.geDongping, isNew: isUnvisited(ROUTES.geDongping) },
    unlocked("S02") && { id: "li-tai", eyebrow: "旧成员缓存", title: "李泰", summary: "撤回作品记录中的策展与编辑人员。", path: ROUTES.curator, isNew: isUnvisited(ROUTES.curator) },
    unlocked("S06") && { id: "du-nanyang", eyebrow: "人物档案", title: "杜南阳", summary: "旧成员页与社团合照中的同一人物。", path: ROUTES.duNanyangOld, isNew: isUnvisited(ROUTES.duNanyangOld) },
    (unlocked("P-XU") || game.visited.includes(ROUTES.xuHui)) && { id: "xu-hui", eyebrow: "人物档案", title: "徐惠", summary: "一张未拼合的婚纱照。", path: ROUTES.xuHui, isNew: isUnvisited(ROUTES.xuHui) },
    unlocked("S07") && { id: "du-wanlin", eyebrow: "人物原型档案", title: "杜万琳", summary: "杜南阳的现实原型；创作者、家属关系与手稿之间的交叉节点。", path: ROUTES.duWanlin, isNew: isUnvisited(ROUTES.duWanlin) },
    unlocked("S08") && { id: "fang-wan", eyebrow: "人物档案", title: "方晚", summary: "杜万琳的同乡、同学与画廊合伙人。", path: ROUTES.fangWan, isNew: isUnvisited(ROUTES.fangWan) },
    unlocked("S10") && { id: "wang-keding", eyebrow: "人物档案", title: "王克定", summary: "旧社团关系者；死亡记录与作品文本存在交叉。", path: ROUTES.wangKeding, isNew: isUnvisited(ROUTES.wangKeding) },
    unlocked("S11") && { id: "xing-wan", eyebrow: "人物档案", title: "邢万", summary: "憎恶社早期成员及其社会关系。", path: ROUTES.xingWan, isNew: isUnvisited(ROUTES.xingWan) },
    unlocked("S12") && { id: "li-xiang", eyebrow: "人物及死亡档案", title: "莉香", summary: "杜家亲属、邢万关联人；公开档案暂将其死亡写作溺亡。", path: ROUTES.liXiangDeath, isNew: isUnvisited(ROUTES.liXiangDeath) },
    unlocked("S24") && hasDuCheFamilyLead(game) && { id: "du-che", eyebrow: "人物档案", title: "杜彻", summary: "家庭资料与寿享陵园相关文学记录中的人物。", path: ROUTES.duChe, isNew: isUnvisited(ROUTES.duChe) },
    !unlocked("S24") && hasDuCheFamilyLead(game) && { id: "du-che-family", eyebrow: "家属记录", title: "杜彻", summary: "地方旧闻附存的杜家亲属记录。", path: ROUTES.duCheFamily, isNew: isUnvisited(ROUTES.duCheFamily) },
    unlocked("S32") && { id: "ye-shi", eyebrow: "编辑缓存", title: "叶是", summary: "旧站编辑与人物年表修订记录的署名者。", path: ROUTES.editorRevisions, isNew: isUnvisited(ROUTES.editorRevisions) },
    unlocked("S33") && { id: "yuanchang", eyebrow: "小说角色", title: "元昶／左君", summary: "法名与本名已合并为同一个小说角色。", path: ROUTES.yuanchang, isNew: isUnvisited(ROUTES.yuanchang) },
  ].filter(Boolean) as DirectoryEntry[];

  const news: DirectoryEntry[] = [
    hasDuCheFamilyLead(game) && { id: "cemetery-report", eyebrow: "地方旧闻 / 他山晚讯", title: "他山地方公墓贪污案", summary: "他山晚讯的一页旧报，附随文材料。", path: ROUTES.cemeteryReport },
    { id: "missing-notice", eyebrow: "场馆告示", title: "关于 A-07 展品状态的说明", summary: "西南角展品未能在闭馆复核中确认位置。", path: ROUTES.exhibition },
    recovered("13") && { id: "wang-death", eyebrow: "档案更新", title: "王克定死亡记录完成补充", summary: "认尸、尸检与文学文件的文字层已经恢复。", path: ROUTES.wangDeath, isNew: isUnvisited(ROUTES.wangDeath) },
    unlocked("S21") && { id: "cemetery-case", eyebrow: "专题索引", title: "他山地方公墓贪污案", summary: "五名参与者、项目关系及死亡过程的交叉索引。", path: ROUTES.cemeteryCase, isNew: isUnvisited(ROUTES.cemeteryCase) },
    unlocked("S22") && { id: "xing-news", eyebrow: "新闻原刊 / 缓存", title: "刑某被捕报道的两个版本", summary: "公开报道与缓存页面之间存在姓名和时间差异。", path: ROUTES.xingNews, isNew: isUnvisited(ROUTES.xingNews) },
    unlocked("S23") && { id: "shouxiang", eyebrow: "站点存档", title: "寿享陵园旧站镜像恢复", summary: "失效网站的人员目录和早期文字层重新可读。", path: ROUTES.shouxiang, isNew: isUnvisited(ROUTES.shouxiang) },
  ].filter(Boolean) as DirectoryEntry[];

  const publications: DirectoryEntry[] = [
    { id: "catalog-zhuhongmen", eyebrow: "展览手册", title: "《赭红门》", summary: "当期展览作品目录与现场记录。", path: ROUTES.exhibition },
    unlocked("S31") && { id: "mahe", eyebrow: "小说 / 2019", title: "《玛赫的厨房》", summary: "杜彻小说的出版档案与版权页。", path: ROUTES.mahePublication, isNew: isUnvisited(ROUTES.mahePublication) },
    ...JUROUTUANFEI_CHAPTERS.map((chapter) => chapter.isAvailable(game) && {
      id: `juroutuanfei-section-${chapter.number}`,
      eyebrow: `Section.${chapter.number} / 选自《句肉抟飞》`,
      title: chapter.displayTitle,
      summary: `${chapter.trigger}。本条目收录该章完整正文。`,
      path: chapter.route,
      isNew: isUnvisited(chapter.route),
    }),
  ].filter(Boolean) as DirectoryEntry[];

  const exhibitions: DirectoryEntry[] = [
    { id: "zhuhongmen", eyebrow: "正在展出 / 主厅", title: "赭红门", summary: "10.01—10.14｜憎恶社二层主厅", path: ROUTES.exhibition },
    unlocked("S01") && { id: "baishaorou", eyebrow: "撤回作品缓存", title: "白芍肉", summary: "展厅目录中缺失的 A-07 作品记录。", path: ROUTES.artwork, isNew: isUnvisited(ROUTES.artwork) },
  ].filter(Boolean) as DirectoryEntry[];

  const about: DirectoryEntry[] = [
    { id: "institution", eyebrow: "机构介绍", title: "憎恶社", summary: "以当代艺术、诗歌、出版与地方档案为工作线索的独立空间。" },
    unlocked("S05") && { id: "old-history", eyebrow: "旧社团历史", title: "憎恶社的早期成员", summary: "角色字段损坏的社团历史与成员合照。", path: ROUTES.history, isNew: isUnvisited(ROUTES.history) },
    unlocked("S29") && { id: "kuonan", eyebrow: "网站版本史", title: "阔南会社", summary: "本站公开名称被改写前的五层版本记录。", path: ROUTES.kuonanHistory, isNew: isUnvisited(ROUTES.kuonanHistory) },
    unlocked("S30") && { id: "li-letter", eyebrow: "私人书信缓存", title: "李司贰致叶是", summary: "关于憎恶社、小说与画廊命名关系的书信。", path: ROUTES.liLetter, isNew: isUnvisited(ROUTES.liLetter) },
  ].filter(Boolean) as DirectoryEntry[];

  return { people, news, publications, exhibitions, about };
}

export function hasDuCheFamilyLead(game: GameState) {
  return game.roomDrumRead === true;
}

export function isDrumRecordLocked(game: GameState, path: string) {
  return [ROUTES.cemeteryReport, ROUTES.duCheFamily, ROUTES.duChe].includes(path) && !hasDuCheFamilyLead(game);
}

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
  return cleanPath;
}

function browserPath(path: string) {
  return `${BASE_PATH}${path}` || "/";
}

function getNavigationSection(path: string) {
  if (path === ROUTES.home) return ROUTES.home;
  if (path === ROUTES.people || path.startsWith("/members/") || path === ROUTES.editorRevisions || path === ROUTES.yuanchang || path === ROUTES.liXiangDeath) return ROUTES.people;
  if (path === ROUTES.news || path.startsWith("/news/") || path === ROUTES.cemeteryCase || path === ROUTES.wangDeath || path === ROUTES.shouxiang) return ROUTES.news;
  if (path === ROUTES.publications || path.startsWith("/publications/") || path.startsWith("/recovered/") || path === ROUTES.recoveredIndex || path === ROUTES.shinan) return ROUTES.publications;
  if (path === ROUTES.about || path.startsWith("/about/") || path === ROUTES.kuonanHistory || path === ROUTES.liLetter) return ROUTES.about;
  return ROUTES.exhibitions;
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

type SearchOutcome = { results: SearchResult[] | null; note: string; action?: "mang" | "wang"; wrong?: boolean };

function resolveExactSearch(query: string, game: GameState, currentPath: string): SearchOutcome {
  const outcome: SearchOutcome = { results: [], note: "" };
  const setResults = (results: SearchResult[] | null) => { outcome.results = results; };
  const setResultNote = (note: string) => { outcome.note = note; };
  const triggerMangRecovery = () => { outcome.action = "mang"; };
  const triggerWangRecovery = () => { outcome.action = "wang"; };
  const markWrong = (note: string, results: SearchResult[] = []) => {
    outcome.results = results;
    outcome.note = note;
    outcome.wrong = true;
  };
  function resolve() {
    const normalized = normalizeQuery(query);
    if (!normalized) {
      setResults([]);
      setResultNote("先输入一个作品名、人名、尺寸或文件标签。");
      return;
    }

    if (normalized === "葛东平") {
      setResults([{
        id: "ge-dongping",
        kind: "公开人物档案 · 1条",
        title: "葛东平",
        summary: "《赭红门》当期展览相关人物；附有一份图像材料与文本摘录。",
        path: ROUTES.geDongping,
        unlock: ["P-GE"],
      }]);
      setResultNote("找到一份公开人物条目。");
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

    if (["盲之春", "盲春", "看不见春天", "看不見春天"].includes(normalized)) {
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
      const mapped = game.unlocked.includes("S07");
      const allowed = game.unlocked.includes("S05") || currentPath === ROUTES.history || mapped;
      setResults([{
        id: mapped ? "du-wanlin-prototype" : "du-nanyang-old",
        kind: allowed ? (mapped ? "人物原型档案 · 已互证" : "文学人物页 · 1条") : "受限元数据 · 1条",
        title: mapped ? "杜南阳／原型杜万琳" : "杜南阳",
        summary: allowed
          ? (mapped ? "文学人物杜南阳与现实人物杜万琳已建立原型对应；两者不是同一人的异名。" : "表层文学世界中的社团创办人；家庭栏保留着配偶徐惠的姓名。")
          : "文学人物记录存在；相关组织档案尚未恢复。",
        path: allowed ? (mapped ? ROUTES.duWanlin : ROUTES.duNanyangOld) : undefined,
        unlock: allowed ? ["S06"] : undefined,
        locked: !allowed,
        note: allowed ? undefined : "证据不足",
      }]);
      setResultNote(allowed ? "找到一份已从现代成员目录迁移的旧页面。" : "先恢复与此人相关的社团历史。");
      return;
    }

    if (normalized === "徐惠") {
      const allowed = game.unlocked.includes("S06") || currentPath === ROUTES.duNanyangOld || game.visited.includes(ROUTES.xuHui);
      setResults([{
        id: "xu-hui", kind: "人物档案", title: "徐惠",
        summary: allowed ? "旧相簿里存着一张撕碎的婚纱照。" : "先核对旧社团的人物与家庭关系。",
        path: allowed ? ROUTES.xuHui : undefined, unlock: allowed ? ["P-XU"] : undefined, locked: !allowed,
      }]);
      setResultNote(allowed ? "找到徐惠的旧相簿。" : "从杜南阳的家庭栏查找。 ");
      return;
    }

    if (normalized === "杜万琳") {
      const allowed = game.unlocked.includes("S07") || (game.unlocked.includes("S06") && game.weddingPhotoSolved);
      setResults([{
        id: "du-wanlin",
        kind: allowed ? "人物原型档案 · 2个来源" : "现实人物 · 公开摘要",
        title: "杜万琳",
        summary: allowed
          ? "现实人物杜万琳是文学人物杜南阳的创作原型；家庭与画廊线索构成对应关系。"
          : "现实人物记录存在；与文学人物的对应关系尚未恢复。",
        path: allowed ? ROUTES.duWanlin : undefined,
        unlock: allowed ? ["S07"] : undefined,
        locked: !allowed,
        note: allowed ? undefined : "缺少旧页",
      }]);
      setResultNote(allowed ? "婚纱照与家庭线索建立了人物原型关系。" : "先到徐惠的人物页，拼合那张婚纱照。");
      return;
    }

    if (["方晚", "fangwan", "方晚署名", "方晚代签", "方晚火化单", "方晚焚烧签字单"].includes(normalized)) {
      const hasForm = game.unlocked.includes("S19") || game.unlocked.includes("S20") || currentPath === ROUTES.duCremation || currentPath === ROUTES.duCremationSigned;
      const allowed = hasForm || game.unlocked.includes("S07") || currentPath === ROUTES.duWanlin;
      setResults([...(hasForm ? [{
        id: "du-cremation-signed", kind: "新增记录 · 代签人已确认",
        title: "方晚｜代签记录与《自白》",
        summary: "与焚烧签字单上的署名相符。打开完整单据及方晚留下的文字。",
        path: ROUTES.duCremationSigned, unlock: ["S20"], recover: ["08"],
      }] : []), {
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
      setResultNote(hasForm ? "焚烧签字单关联出一份新记录，原人物档案仍可回看。" : allowed ? "人物履历与无名同乡记录完全重合。" : "先确认这份履历与哪名旧成员相连。");
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

    if (["邢万", "邢萬", "刑万", "刑萬", "刑某", "廉租房", "西门车站", "西门车站附近廉租房"].includes(normalized)) {
      const caseIndexed = game.unlocked.includes("S21") || currentPath === ROUTES.cemeteryCase;
      if (caseIndexed) {
        setResults([{
          id: "xing-mou-news",
          kind: "新闻原刊／缓存 · 2个版本",
          title: "‘他山地方公墓贪污案’涉案人员刑某现已被警方依法逮捕",
          summary: "公开报道采用匿名写法；缓存与旧成员索引将刑某映射为邢万。",
          path: ROUTES.xingNews,
          unlock: ["S22"],
        }]);
        setResultNote("同一个姓名在社团合照与新闻标题中采用了不同写法。");
        return;
      }
      const allowed = game.unlocked.includes("S10") || currentPath === ROUTES.wangKeding;
      setResults([{
        id: "xing-wan",
        kind: allowed ? "人物档案＋朗读文件" : "人物记录",
        title: "邢万",
        summary: allowed
          ? "西门车站附近的一间廉租房；附存一份旧朗读诗文。"
          : "新闻中的姓名已匿名化，尚不能与成员库互证。",
        path: allowed ? ROUTES.xingWan : undefined,
        unlock: allowed ? ["S11"] : undefined,
        recover: allowed ? ["05"] : undefined,
        locked: !allowed,
        note: allowed ? undefined : "待交叉验证",
      }]);
      setResultNote(allowed ? "找到邢万的人物档案与朗读诗文。" : "还需要一份写出完整姓名的旧社团材料。");
      return;
    }

    if (normalized === "莉香" || normalized === "莉香溺水") {
      const allowed = game.unlocked.includes("S12") || ((game.unlocked.includes("S11") || currentPath === ROUTES.xingWan) && game.familyPhotoRead);
      setResults([{
        id: "li-xiang-death",
        kind: allowed ? "亲属／死亡档案＋朗读文件" : "损坏关系卡",
        title: allowed ? "莉香｜溺亡记录" : "莉×",
        summary: allowed
          ? "杜家亲属、邢万关联人；记录只确认溺亡过程，不记原因与责任者。"
          : "杜家亲属。姓名第二字与死亡附件均不可读。",
        path: allowed ? ROUTES.liXiangDeath : undefined,
        unlock: allowed ? ["S12"] : undefined,
        recover: allowed ? ["06"] : undefined,
        locked: !allowed,
        note: allowed ? undefined : "字段损坏",
      }]);
      setResultNote(allowed ? "河流档案与亲属记录指向同一人。" : "先查找廉租房里的旧物，再翻看杜彻童年合照的背面。");
      return;
    }

    if (["尸检报告", "投河", "王克定尸检", "王克定认尸"].includes(normalized)) {
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

    if (["石立人", "石立人头", "石人头"].includes(normalized)) {
      const allowed = game.unlocked.includes("S13") || currentPath === ROUTES.wangAutopsy;
      setResults([{
        id: "stone-head",
        kind: allowed ? "独立物证记录 · 1件" : "雕塑索引 · 4条",
        title: "石立人·头部塑像",
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

    if (["右小手指", "右手小指"].includes(normalized)) {
      const allowed = game.routeTrips >= 3 || game.unlocked.includes("S16");
      setResults([{
        id: "wang-supplement",
        kind: allowed ? "加密附件 · 尸检补充" : "伤口索引 · 元数据",
        title: "王克定｜尸检补充",
        summary: allowed
          ? "右小手指缺失一截；创口时间早于溺水。附件需要口令。"
          : "伤口条目存在；完整路线批注尚未恢复。",
        path: allowed ? ROUTES.wangSupplement : undefined,
        locked: !allowed,
        note: allowed ? "需要口令" : "证据不足",
      }]);
      setResultNote(allowed ? "加密附件已定位。提示：石像数量－面部伤口数。" : "先完成三次尸体路线回溯。");
      return;
    }

    if (normalized === "野生白鹭") {
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
        setResultNote("先解密右小手指的尸检补充，再核对其中的文学索引。");
      }
      return;
    }

    if (["焚烧签字单", "火化单", "火化签字单"].includes(normalized)) {
      const allowed = game.recovered.includes("13") || currentPath === ROUTES.wangDeath;
      setResults([{
        id: "du-cremation",
        kind: allowed ? "死亡手续扫描件 · 1份" : "受限文件元数据",
        title: "杜万琳｜焚烧签字单",
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
      setResultNote(allowed ? "个人档案已汇入同一项目索引。" : "先恢复完整焚烧签字单与方晚的自白。");
      return;
    }

    if (["寿享陵园", "寿享陵園"].includes(normalized)) {
      const allowed = game.unlocked.includes("S22") || currentPath === ROUTES.xingNews;
      setResults([{
        id: "shouxiang-old-site",
        kind: allowed ? "旧网站镜像 · 人员目录" : "失效网站元数据",
        title: "寿享陵园｜旧站人员页",
        summary: allowed
          ? "旧站的文学索引仍可读取，其中提到世伯向杜彻介绍陵园。"
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
      if (!hasDuCheFamilyLead(game)) {
        setResults([]);
        setResultNote("尚未发现对应的人物材料。");
        return;
      }
      if (!allowed) {
        setResults([{
          id: "du-che-family", kind: "人物档案 · 家属记录", title: "杜彻",
          summary: "地方旧闻附存的杜家亲属记录。", path: ROUTES.duCheFamily,
        }]);
        setResultNote("找到他山晚讯随文保留的家属记录。");
        return;
      }
      setResults([{
        id: "du-che",
        kind: allowed ? "人物档案 · 家庭／作品索引" : "旧站文学索引",
        title: "杜彻",
        summary: allowed
          ? "杜万琳与徐惠之子；《刍味》写到世伯向他介绍陵园。"
          : "姓名出现在陵园旧站的一条文学索引中。",
        path: allowed ? ROUTES.duChe : undefined,
        unlock: allowed ? ["S24"] : undefined,
        locked: !allowed,
        note: allowed ? undefined : "履历未恢复",
      }]);
      setResultNote(allowed ? "家庭资料与文学索引指向同一人物。" : "先查看陵园旧站保留的文学索引。");
      return;
    }

    if (normalized === "李髮") {
      const allowed = game.unlocked.includes("S24") || currentPath === ROUTES.duChe;
      setResults([{
        id: "du-li-wedding",
        kind: allowed ? "婚礼档案＋朗读文件" : "人物关系元数据",
        title: "杜彻与李髮｜婚礼档案",
        summary: allowed
          ? "李髮与杜彻的婚礼档案；附朗读文件07《舞》。"
          : "人物名存在，家庭关系尚未与杜彻档案互证。",
        path: allowed ? ROUTES.wedding : undefined,
        unlock: allowed ? ["S25"] : undefined,
        recover: allowed ? ["07"] : undefined,
        locked: !allowed,
        note: allowed ? undefined : "关系未确认",
      }]);
      setResultNote(allowed ? "找到李髮与杜彻的婚礼档案。" : "先打开杜彻的人物档案。");
      return;
    }

    if (normalized === "李发") {
      setResults([{
        id: "li-fa-suggestion",
        kind: "姓名纠错",
        title: "是否查找“李髮”？",
        summary: "人物档案使用繁体姓名；简体写法不直接打开档案。",
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
      setResultNote(allowed ? "检索同时命中一个同音标题。" : "先查看寿享陵园中与杜彻有关的文学索引。");
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

    if (["阿尔茨海默病", "阿尔茨海默症", "阿尔兹海默症", "阿尔兹海默病", "阿爾茨海默病", "阿兹海默症", "阿茲海默症"].includes(normalized)) {
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
      setResultNote(allowed ? "找到五层旧站历史；最早版本仍在页面底部。" : medicalComplete ? "回到杜彻档案，查找李髮。" : "先恢复《刍胃》的完整文字层。");
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

    if (["元昶", "礼倒僧元昶", "左君"].includes(normalized)) {
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

    if (["句肉抟飞", "句肉抟飛"].includes(normalized)) {
      const availableCount = JUROUTUANFEI_CHAPTERS.filter((chapter) => chapter.isAvailable(game)).length;
      const allowed = availableCount > 0;
      setResults([{
        id: "juroutuanfei-serial",
        kind: allowed ? "小说连载 · 章节索引" : "受限馆藏书目",
        title: "《句肉抟飞》",
        summary: allowed
          ? `目前已有 ${availableCount}/5 个完整章节随调查进度开放。`
          : "馆藏登记存在；第一章将在“盲之春”恢复后进入出版物目录。",
        path: allowed ? ROUTES.juroutuanfei : undefined,
        locked: !allowed,
        note: allowed ? "真相连载索引" : "先恢复“盲之春”",
      }]);
      setResultNote(allowed ? "每个 Section 是出版物栏目中的独立条目；新章节只在对应搜索节点完成后出现。" : "先从损坏朗读页恢复“盲之春”。");
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

    if (["尸检", "认尸记录"].includes(normalized)) {
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
        title: "右小手指／补充附件",
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
        summary: "标题可辨，但文件仍需要尸检补充中的文学索引。",
        locked: true,
        note: "当前不可访问",
      }]);
      setResultNote("回看解密后的尸检补充，寻找其中保留的鸟名。");
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
        summary: "杜家亲属；邢万关联人。第二字缺失。",
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
  resolve();
  return outcome;
}

// Every fuzzy candidate is evaluated through the exact query's existing evidence gate.
const SEARCH_TERMS = [
  ["葛东平"], ["白芍肉"], ["李泰", "litai"], ["3dmx3dm", "3x3dm", "3dm3dm"],
  ["盲之春", "盲春", "看不见春天", "看不見春天"], ["憎恶社", "憎恶"],
  ["杜南阳"], ["徐惠"], ["杜万琳"], ["方晚", "fangwan", "方晚署名", "方晚代签", "方晚火化单", "方晚焚烧签字单"], ["东兴彼得"], ["王克定", "王克订"],
  ["邢万", "邢萬", "刑万", "刑萬", "刑某", "廉租房", "西门车站", "西门车站附近廉租房"], ["莉香", "莉香溺水"],
  ["尸检报告", "投河", "王克定尸检", "王克定认尸", "认尸记录"],
  ["石立人", "石立人头", "石人头", "佛头"], ["西岩寺", "西岩寺院"],
  ["凤凰水库", "凤凰水庫", "鳳凰水庫"],
  ["右小手指", "右手小指", "小指", "尸检补充", "尸检补充报告"], ["野生白鹭"],
  ["焚烧签字单", "火化单", "火化签字单"],
  ["他山地方公墓贪污案", "他山公墓贪污案", "地方公墓贪污案"], ["寿享陵园", "寿享陵園"],
  ["杜彻", "杜徹"], ["李髮"], ["刍味", "芻味"], ["刍胃", "芻胃"],
  ["阿尔茨海默病", "阿尔茨海默症", "阿尔兹海默症", "阿尔兹海默病", "阿爾茨海默病", "阿兹海默症", "阿茲海默症"],
  ["阔南会社", "闊南會社"], ["李司贰"], ["玛赫的厨房", "瑪赫的廚房", "玛赫厨房"],
  ["叶主任", "葉主任", "叶是", "葉是"], ["元昶", "礼倒僧元昶", "左君"], ["句肉抟飞", "句肉抟飛"],
  ["始末的碎点", "始末碎点"], ["赭红门", "赭紅門"],
];

export function resolveGameSearch(query: string, game: GameState, currentPath: string): SearchOutcome {
  const normalized = normalizeQuery(query);
  if (!normalized) return resolveExactSearch(query, game, currentPath);
  const exact = SEARCH_TERMS.find((terms) => terms.some((term) => normalizeQuery(term) === normalized));
  if (exact) return resolveExactSearch(exact[0], game, currentPath);
  const matches = SEARCH_TERMS.filter((terms) => terms.some((term) => normalizeQuery(term).includes(normalized)));
  if (!matches.length) return resolveExactSearch(query, game, currentPath);
  const candidates = new Map<string, SearchResult>();
  for (const terms of matches) {
    const found = resolveExactSearch(terms[0], game, currentPath);
    const rows: SearchResult[] = found.action ? [{
      id: `recovery-${found.action}`, kind: "可恢复的文学文件", title: terms[0],
      summary: "相关证据已齐，可以打开文字层。", action: found.action,
    }] : found.results ?? [];
    for (const row of rows) {
      const accessible = !row.locked && Boolean(row.path || row.action);
      const key = row.path ?? row.id;
      if (candidates.has(key)) continue;
      candidates.set(key, accessible ? { ...row, searchTerm: terms[0] } : {
        id: `locked-${candidates.size}`, kind: "解锁提示", title: "相关记录尚未解锁",
        summary: found.note || "沿当前档案的线索继续调查。", locked: true,
      });
    }
  }
  const results = [...candidates.values()].sort((a, b) => Number(Boolean(a.locked)) - Number(Boolean(b.locked)));
  const accessibleCount = results.filter((row) => !row.locked).length;
  return { results, note: `找到 ${accessibleCount} 条可访问记录，${results.length - accessibleCount} 条解锁提示。` };
}

export function rememberSearch(history: string[], query: string) {
  const term = query.trim().slice(0, 100);
  if (!normalizeQuery(term)) return history;
  return [term, ...history.filter((old) => normalizeQuery(old) !== normalizeQuery(term))].slice(0, 50);
}

export function searchStatus(outcome: SearchOutcome) {
  if (outcome.action || outcome.results?.some((row) => !row.locked && (row.path || row.action))) return "有效";
  return outcome.results?.length ? "待解锁" : "未命中";
}

export function getProgressHint(game: GameState) {
  const has = (n: number) => game.unlocked.includes(`S${String(n).padStart(2, "0")}`);
  const seen = (path: string) => game.visited.includes(path);
  const from = (id: string, path: string, hints = HINTS[path]) => ({ id, path, hints });
  if (has(36)) return from("complete", ROUTES.stageZhuhongmen);
  if (game.recovered.includes("14")) return from("curtain", ROUTES.stageZhuhongmen);
  if (game.recovered.includes("12")) return from("final-poem", ROUTES.recoveredIndex, ["主要文本已恢复，接下来是终场场记。", "回到当期展览的名称。", "搜索：赭红门。"]);
  if (has(33)) return seen(ROUTES.recoveredIndex) ? from("fragment-password", ROUTES.recoveredIndex) : from("fragment-index", ROUTES.yuanchang);
  if (has(32) || game.editorLoggedIn) return from("character", ROUTES.editorRevisions);
  if (has(31)) return from("editor-password", ROUTES.editorLogin);
  if (has(30)) return from("book", ROUTES.liLetter);
  if (has(29)) return game.historyVersionsLoaded >= 5
    ? from("letter", ROUTES.kuonanHistory, ["最早的网站版本已经恢复，留意其中的署名。", "那封信的作者是李司贰。", "搜索：李司贰。"])
    : from("old-versions", ROUTES.kuonanHistory);
  if (has(28) && !game.recovered.includes("07")) return from("missing-wedding", ROUTES.duChe, ["病历已恢复，但下一份旧站历史还缺婚礼材料。", "回看杜彻人物页的家庭公告，核对新娘姓名。", "搜索：李髮，打开婚礼记录。"]);
  if (has(28)) return from("old-site", ROUTES.stomach);
  if (has(27)) return from("diagnosis", ROUTES.medical);
  if (has(26) || game.recovered.includes("10")) return from("stomach", ROUTES.taste);
  if (has(25) || game.recovered.includes("07")) return from("taste", ROUTES.wedding);
  if (has(24)) return from("du-che-records", ROUTES.duChe);
  if (has(23)) return from("du-che", ROUTES.shouxiang);
  if (has(22)) return from("cemetery-site", ROUTES.xingNews);
  if (has(21)) return from("news-cache", ROUTES.cemeteryCase);
  if (has(20)) return from("case-index", ROUTES.duCremationSigned);
  if (has(19)) return from("signature", ROUTES.duCremation);
  if (has(18) || game.recovered.includes("13")) return from("burning-form", ROUTES.wangDeath);
  if (has(17)) return from("egret", ROUTES.wangSupplement, ["补充页已经解密，继续读页边的文学索引。", "标签是一种白色水鸟。", "搜索：野生白鹭。"]);
  if (has(16) || game.routeTrips >= 3) return seen(ROUTES.wangSupplement)
    ? from("supplement-password", ROUTES.wangSupplement)
    : from("finger", ROUTES.phoenixRoute, ["路线回溯已完成，伤口批注多出了一处缺失部位。", "用批注中的部位名称查补充附件。", "搜索：右小手指。"]);
  if (has(15)) return seen(ROUTES.phoenixRoute) ? from("river", ROUTES.phoenixRoute)
    : from("reservoir", ROUTES.xiyanTemple, ["石像检查已完成，隐藏层给出了漂流终点。", "接着核对河流附件。", "搜索：凤凰水库。"]);
  if (has(14)) return seen(ROUTES.xiyanTemple) ? from("stone-inspection", ROUTES.xiyanTemple) : from("temple", ROUTES.stoneHead);
  if (has(13)) return from("stone", ROUTES.wangAutopsy);
  if (has(12)) return from("autopsy", ROUTES.liXiangDeath);
  if (has(11)) return hasDuCheFamilyLead(game) && game.familyPhotoRead
    ? from("li-xiang", ROUTES.xingWan)
    : hasDuCheFamilyLead(game)
      ? from("du-che-family", ROUTES.duCheFamily, ["旧物上留下的姓名属于杜家的孩子。", "从拨浪鼓细节中的“杜彻 · 家属记录”进入。", "翻到照片背面，核对姑姑姓名。"])
      : from("room-drum", ROUTES.xingWan, ["房间里留下了别人的东西。", "查看桌上的烟灰缸和地上的拨浪鼓。", "拨浪鼓手柄的握处刻着一个姓名。"]);
  if (has(10)) return game.societyMembersRevealed
    ? from("xing-wan", ROUTES.history, ["合照下补出了早期成员。", "还有一名成员没有查过。", "搜索：邢万。也可搜索：廉租房。"])
    : from("society-return", ROUTES.wangKeding);
  if (has(9)) return from("wang", ROUTES.dongxingPeter);
  if (has(8)) return from("photo", ROUTES.fangWan);
  if (has(7)) return from("fang", ROUTES.duWanlin);
  if (has(6)) return game.weddingPhotoSolved
    ? from("du-wanlin", ROUTES.xuHui, ["婚纱照已经拼好，照片上浮现了两个人的姓名。", "将现实人物的姓名与杜南阳的家庭关系互证。", "搜索：杜万琳。"] )
    : from("xu-hui-photo", ROUTES.duNanyangOld);
  if (has(5)) return from("du-nanyang", ROUTES.history);
  if (has(4) || game.recovered.includes("01")) return from("society", ROUTES.recoveredOne);
  if (has(3) || game.frameClicks >= 3) return from("spring", ROUTES.damagedReader);
  if (has(2)) return seen(ROUTES.dimensions) ? from("frame", ROUTES.dimensions) : from("dimensions", ROUTES.curator);
  if (has(1)) return from("curator", ROUTES.artwork);
  return from("missing-work", ROUTES.exhibition);
}

export function matchesEditorCredentials(user: string, password: string) {
  return user.trim().toLowerCase() === "editor_ys" && password.trim().toLowerCase() === "mhdcf2019";
}

type GameAppProps = {
  initialPath: string;
  embedded?: boolean;
  onNavigate?: (path: string) => void;
  onCemeteryVisit?: () => void;
};

export function GameApp({ initialPath, embedded = false, onNavigate, onCemeteryVisit }: GameAppProps) {
  const [path, setPath] = useState(initialPath);
  const [game, setGame] = useState<GameState>(DEFAULT_STATE);
  const [hydrated, setHydrated] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[] | null>(null);
  const [resultNote, setResultNote] = useState("");
  const [historyOpen, setHistoryOpen] = useState(false);
  const [wrongAttempts, setWrongAttempts] = useState<Record<string, number>>({});
  const [frameNotice, setFrameNotice] = useState(false);
  const [plainText, setPlainText] = useState(false);
  const [openingActive, setOpeningActive] = useState(!embedded);
  const [roleGlitch, setRoleGlitch] = useState(false);
  const [supplementPassword, setSupplementPassword] = useState("");
  const [supplementPasswordVisible, setSupplementPasswordVisible] = useState(false);
  const [supplementPasswordAttempts, setSupplementPasswordAttempts] = useState(0);
  const [supplementPasswordNote, setSupplementPasswordNote] = useState("");
  const [deathScareActive, setDeathScareActive] = useState(false);
  const [deathScareTextVisible, setDeathScareTextVisible] = useState(false);
  const [collapseImageActive, setCollapseImageActive] = useState(false);
  const [editorUser, setEditorUser] = useState("");
  const [editorPassword, setEditorPassword] = useState("");
  const [editorAttempts, setEditorAttempts] = useState(0);
  const [editorNote, setEditorNote] = useState("");
  const [fragmentPassword, setFragmentPassword] = useState("");
  const [fragmentAttempts, setFragmentAttempts] = useState(0);
  const [fragmentNote, setFragmentNote] = useState("");
  const [stableStage, setStableStage] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const skipDeathScareRef = useRef<HTMLButtonElement>(null);
  const collapseImageRef = useRef<HTMLButtonElement>(null);

  const currentPath = displayPath(path);
  const drumRecordLocked = isDrumRecordLocked(game, currentPath);
  const currentHint = getProgressHint(game);
  const currentHints = currentHint.hints;
  const stageComplete = game.recovered.includes("14");
  const stageVocabulary = game.recovered.includes("12");
  const publicCatalog = useMemo(() => buildPublicCatalog(game), [game]);
  const currentNavigationSection = getNavigationSection(currentPath);
  const isGalleryHome = currentPath === ROUTES.home;
  const isDirectoryPage = [ROUTES.exhibitions, ROUTES.people, ROUTES.news, ROUTES.publications, ROUTES.about].includes(currentPath);

  const mutateGame = useCallback((unlock: string[] = [], recover: string[] = []) => {
    setGame((previous) => ({
      ...previous,
      unlocked: unique([...previous.unlocked, ...unlock]),
      recovered: unique([...previous.recovered, ...recover]),
    }));
  }, []);

  const navigate = useCallback((nextPath: string) => {
    const cleanPath = displayPath(nextPath);
    if (embedded) onNavigate?.(cleanPath);
    else window.history.pushState({}, "", browserPath(nextPath));
    if (cleanPath === ROUTES.shouxiang) onCemeteryVisit?.();
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
  }, [embedded, onCemeteryVisit, onNavigate]);

  const finishMangRecovery = useCallback(() => {
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

  const dismissCollapseImage = useCallback(() => {
    setCollapseImageActive(false);
    setGame((previous) => ({
      ...previous,
      scaresSeen: unique([...previous.scaresSeen, "J04-collapse-image"]),
    }));
  }, []);

  useEffect(() => {
    const initialize = window.setTimeout(() => {
      const stored = window.localStorage.getItem(STORAGE_KEY);
      if (stored) {
        try {
          const parsed = JSON.parse(stored) as Partial<GameState>;
          setGame({
            ...DEFAULT_STATE,
            ...parsed,
            stoneOpenings: Number.isInteger(parsed.stoneOpenings) && (parsed.stoneOpenings ?? 0) >= 0 && (parsed.stoneOpenings ?? 0) <= 127 ? parsed.stoneOpenings! : 0,
            weddingPhotoTiles: Array.isArray(parsed.weddingPhotoTiles) && parsed.weddingPhotoTiles.length === 9 && new Set(parsed.weddingPhotoTiles).size === 9 && parsed.weddingPhotoTiles.every((tile) => Number.isInteger(tile) && tile >= 0 && tile <= 8) ? parsed.weddingPhotoTiles : INITIAL_WEDDING_TILES,
            searchHistory: Array.isArray(parsed.searchHistory) ? parsed.searchHistory.filter((value): value is string => typeof value === "string").slice(0, 50) : [],
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
    if (!embedded) window.addEventListener("popstate", onPopState);
    return () => {
      window.clearTimeout(initialize);
      if (!embedded) window.removeEventListener("popstate", onPopState);
    };
  }, [embedded]);

  useEffect(() => {
    if (!embedded) return;
    const synchronizeEmbeddedPath = window.setTimeout(() => {
      setPath(displayPath(initialPath));
      setResults(null);
      setResultNote("");
    }, 0);
    return () => window.clearTimeout(synchronizeEmbeddedPath);
  }, [embedded, initialPath]);

  useEffect(() => {
    if (!hydrated) return;
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(game));
  }, [game, hydrated]);

  useEffect(() => {
    if (!hydrated || openingActive || drumRecordLocked) return;
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
    }, 0);
    if (!embedded) {
      document.title = `${PAGE_TITLES[currentPath] ?? "憎恶社"}｜憎恶社`;
      window.scrollTo({ top: 0, behavior: game.settings.reducedMotion ? "auto" : "smooth" });
    }
    return () => window.clearTimeout(syncArrival);
  }, [currentPath, embedded, hydrated, openingActive, game.settings.reducedMotion, drumRecordLocked]);

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
    const roleGlitchFinished = game.scaresSeen.includes("role-glitch");
    const collapseImageSeen = game.scaresSeen.includes("J04-collapse-image");
    if (currentPath !== ROUTES.history || !roleGlitchFinished || collapseImageSeen) return;

    if (game.settings.reducedScares) {
      const skip = window.setTimeout(() => {
        setGame((previous) => ({
          ...previous,
          scaresSeen: unique([...previous.scaresSeen, "J04-collapse-image"]),
        }));
      }, 0);
      return () => window.clearTimeout(skip);
    }

    const reveal = window.setTimeout(
      () => setCollapseImageActive(true),
      game.settings.reducedMotion ? 0 : 180,
    );
    return () => window.clearTimeout(reveal);
  }, [currentPath, game.scaresSeen, game.settings.reducedMotion, game.settings.reducedScares]);

  useEffect(() => {
    if (!collapseImageActive) return;
    collapseImageRef.current?.focus();
  }, [collapseImageActive]);

  useEffect(() => {
    if (!deathScareActive) return;
    skipDeathScareRef.current?.focus();
    const reveal = window.setTimeout(
      () => setDeathScareTextVisible(true),
      game.settings.reducedMotion ? 0 : 160,
    );
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") finishWangRecovery();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.clearTimeout(reveal);
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
    if (!game.recovered.includes("12") || game.stageTransformStep === 0 || game.stageTransformStep >= 3) return;
    const advance = window.setTimeout(() => {
      setGame((previous) => ({ ...previous, stageTransformStep: Math.min(3, previous.stageTransformStep + 1) }));
    }, game.settings.reducedMotion ? 100 : 4000);
    return () => window.clearTimeout(advance);
  }, [game.recovered, game.settings.reducedMotion, game.stageTransformStep]);

  function triggerMangRecovery() {
    finishMangRecovery();
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

  function inspectStone(opening: number) {
    if (currentPath !== ROUTES.xiyanTemple) return;
    setGame((previous) => previous.unlocked.includes("S15") ? previous : ({
      ...previous, stoneOpenings: inspectStoneOpening(previous.stoneOpenings, opening),
    }));
  }

  const finishStoneReveal = useCallback(() => {
    setGame((previous) => previous.stoneOpenings !== 127 || previous.unlocked.includes("S15") ? previous : ({
      ...previous,
      unlocked: unique([...previous.unlocked, "S15"]),
      recovered: unique([...previous.recovered, "09"]),
      scaresSeen: unique([...previous.scaresSeen, "J02"]),
    }));
  }, []);

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
    const passwordMatches = matchesEditorCredentials(editorUser, editorPassword);
    if (userMatches && passwordMatches) {
      if (!game.unlocked.includes("S31") && !game.editorLoggedIn) {
        setEditorNote("凭据已识别；请先找到李司贰书信与《玛赫的厨房》出版档案，再核对修订记录。");
        return;
      }
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
    if (result.locked) return;
    if (result.searchTerm) {
      setGame((previous) => ({ ...previous, searchHistory: rememberSearch(previous.searchHistory, result.searchTerm!) }));
    }
    if (result.action === "mang") { triggerMangRecovery(); return; }
    if (result.action === "wang") { triggerWangRecovery(); return; }
    if (!result.path) return;
    mutateGame(result.unlock ?? [], result.recover ?? []);
    navigate(result.path);
  }

  function markWrong(message: string, fallbackResults: SearchResult[] = []) {
    const nextCount = (wrongAttempts[currentHint.id] ?? 0) + 1;
    setWrongAttempts((previous) => ({ ...previous, [currentHint.id]: nextCount }));
    setResults(fallbackResults);
    setResultNote(nextCount >= 3 ? `${message} 提示：${currentHints[0]}` : message);
  }

  function runSearch(value: string) {
    const outcome = resolveGameSearch(value, game, currentPath);
    setQuery(value);
    if (normalizeQuery(value)) setGame((previous) => ({ ...previous,
      searchHistory: rememberSearch(previous.searchHistory, value),
      unlocked: unique([...previous.unlocked, ...(outcome.results ?? []).filter((result) => !result.locked).flatMap((result) => (result.unlock ?? []).filter((step) => step === "P-GE" || step === "P-XU"))]),
    }));
    if (outcome.wrong) markWrong(outcome.note, outcome.results ?? []);
    else { setResults(outcome.results); setResultNote(outcome.note); }
    if (outcome.action === "mang") triggerMangRecovery();
    if (outcome.action === "wang") triggerWangRecovery();
  }

  function handleSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    runSearch(query);
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
    if (drumRecordLocked) return <article className="person-page"><h1>记录尚未开放</h1><p>继续调查，寻找相关旧物。</p></article>;
    switch (currentPath) {
      case ROUTES.home:
        return <GalleryHomePage onStart={() => navigate(ROUTES.exhibition)} />;
      case ROUTES.exhibitions:
        return <DirectoryPage kicker="PROGRAM / EXHIBITIONS" title="展览" intro="正在展出的项目与从旧版本中恢复的特别计划。未被发现的条目不会出现在公开目录中。" entries={publicCatalog.exhibitions} onOpen={navigate} />;
      case ROUTES.people:
        return <DirectoryPage kicker="PEOPLE / INDEX" title="人物" intro="参展者、编辑、旧成员与文本中的相关人物。搜索所得的新人物将在这里更新。" entries={publicCatalog.people} onOpen={navigate} />;
      case ROUTES.news:
        return <DirectoryPage kicker="NEWS / ARCHIVE" title="新闻" intro="场馆公告、地方旧闻与陆续恢复的后续报道。" entries={publicCatalog.news} onOpen={navigate} />;
      case ROUTES.cemeteryReport:
        return <CemeteryReportPage onOpenFamily={() => navigate(ROUTES.duCheFamily)} />;
      case ROUTES.duCheFamily:
        return <DuCheFamilyPage familyPhotoRead={game.familyPhotoRead} onRead={() => setGame((previous) => ({ ...previous, familyPhotoRead: true }))} />;
      case ROUTES.xuHui:
        return <XuHuiPage tiles={game.weddingPhotoTiles} solved={game.weddingPhotoSolved} onChange={(tiles) => setGame((previous) => ({ ...previous, weddingPhotoTiles: tiles, weddingPhotoSolved: isWeddingPhotoComplete(tiles) }))} />;
      case ROUTES.publications:
        return <DirectoryPage kicker="PUBLICATIONS / TEXT" title="出版物" intro="展览手册、小说集、小说出版档案与最终开放的诗剧资料。" entries={publicCatalog.publications} onOpen={navigate} />;
      case ROUTES.about:
        return <DirectoryPage kicker="ABOUT / INSTITUTION" title="关于" intro="憎恶社的机构资料及逐步恢复的网站版本历史。" entries={publicCatalog.about} onOpen={navigate} />;
      case ROUTES.geDongping:
        return <GeDongpingPage onOpenSupplement={() => navigate(ROUTES.scatteredSemu)} />;
      case ROUTES.artwork:
        return <ArtworkPage />;
      case ROUTES.curator:
        return <CuratorPage />;
      case ROUTES.dimensions:
        return <DimensionsPage clicks={game.frameClicks} assisted={game.settings.assistedInteraction} onInspect={inspectFrame} onOpenReader={() => navigate(ROUTES.damagedReader)} />;
      case ROUTES.damagedReader:
        return <DamagedReaderPage plainText={plainText} onTogglePlain={() => setPlainText((value) => !value)} />;
      case ROUTES.recoveredOne:
        return <RecoveredOnePage onReturnToSearch={() => searchInputRef.current?.focus()} />;
      case ROUTES.history:
        return <HistoryPage roleGlitch={roleGlitch} membersRevealed={game.societyMembersRevealed} />;
      case ROUTES.duNanyangOld:
        return <DuNanyangOldPage />;
      case ROUTES.duWanlin:
        return <DuWanlinPage />;
      case ROUTES.fangWan:
        return <FangWanPage />;
      case ROUTES.dongxingPeter:
        return <DongxingPeterPage />;
      case ROUTES.wangKeding:
        return <WangKedingPage onOpenSociety={() => { setGame((previous) => ({ ...previous, societyMembersRevealed: true })); navigate(ROUTES.history); }} />;
      case ROUTES.xingWan:
        return <XingWanPage drumRead={game.roomDrumRead} onReadDrum={() => setGame((previous) => ({ ...previous, roomDrumRead: true }))} onOpenFamily={() => { if (game.roomDrumRead) navigate(ROUTES.duCheFamily); }} />;
      case ROUTES.liXiangDeath:
        return <LiXiangDeathPage />;
      case ROUTES.wangAutopsy:
        return <WangAutopsyPage />;
      case ROUTES.stoneHead:
        return <StoneHeadEvidencePage />;
      case ROUTES.xiyanTemple:
        return <XiyanTemplePage
          openings={game.stoneOpenings}
          completed={game.unlocked.includes("S15")}
          reducedMotion={game.settings.reducedMotion || game.settings.reducedScares}
          onInspect={inspectStone}
          onRevealComplete={finishStoneReveal}
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
        return <ShouxiangPage imageUrl={browserPath("/archive/shouxiang-memorials.webp")} reducedMotion={game.settings.reducedMotion} />;
      case ROUTES.duChe:
        return <DuChePage onOpenSupplement={() => navigate(ROUTES.scatteredTiefangshan)} onOpenEditor={() => navigate(ROUTES.editorLogin)} />;
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
      case ROUTES.juroutuanfei:
        return <JuroutuanfeiSeriesPage game={game} onOpen={navigate} onBack={() => navigate(ROUTES.publications)} />;
      case ROUTES.jurouSection1:
      case ROUTES.jurouSection2:
      case ROUTES.jurouSection3:
      case ROUTES.jurouSection4:
      case ROUTES.jurouSection5: {
        const chapter = JUROUTUANFEI_CHAPTERS.find((item) => item.route === currentPath)!;
        return <JuroutuanfeiChapterPage chapter={chapter} available={chapter.isAvailable(game)} onBack={() => navigate(ROUTES.publications)} onSeries={() => navigate(ROUTES.juroutuanfei)} />;
      }
      case ROUTES.scatteredSemu:
        return <IndependentTextPage title="色目掘漕" placement="葛东平人物补遗" src="/archive/scattered/se-mu-jue-cao.html" available showMetadata={false} onBack={() => navigate(ROUTES.geDongping)} />;
      case ROUTES.scatteredTiefangshan:
        return <IndependentTextPage title="铁房山补" placement="杜彻／铁房山关联散页" src="/archive/scattered/tiefangshan-bu.html" available={game.unlocked.includes("S24")} onBack={() => navigate(ROUTES.duChe)} />;
      case ROUTES.scatteredZoudi:
        return <IndependentTextPage title="走地国记" placement="终局叙事补遗" src="/archive/scattered/zoudi-guoji.html" available={game.recovered.includes("12")} lateDisclosure onBack={() => navigate(ROUTES.recoveredIndex)} />;
      case ROUTES.scatteredNanfuzi:
        return <IndependentTextPage title="男腹子" placement="终局叙事补遗" src="/archive/scattered/nanfuzi.html" available={game.recovered.includes("12")} lateDisclosure onBack={() => navigate(ROUTES.recoveredIndex)} />;
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
          onOpenSupplement={navigate}
        />;
      case ROUTES.stageZhuhongmen:
        return <StageZhuhongmenPage />;
      case ROUTES.shinan:
        return <FinalWordPasswordPage />;
      case ROUTES.exhibition:
      default:
        return <ExhibitionPage frameNotice={frameNotice} onInspectFrame={inspectFrame} />;
    }
  }

  const searchSummary = useMemo(() => {
    if (!results) return "";
    if (results.length === 0) return resultNote;
    return `${resultNote} ${results.length} 条结果。`;
  }, [results, resultNote]);
  const independentCemeterySite = embedded && currentPath === ROUTES.shouxiang;

  return (
    <>
    <div inert={!embedded && openingActive} className={`game-shell${embedded ? " is-embedded-game" : ""}${independentCemeterySite ? " is-independent-site" : ""}${game.settings.reducedMotion ? " reduce-motion" : ""}${stageComplete ? " stage-complete" : stageVocabulary ? " stage-transition" : ""}${isGalleryHome ? " is-gallery-home" : ""}${isDirectoryPage ? " is-directory-page" : ""}`}>
      {!independentCemeterySite && <a className="skip-link" href="#main-content">跳到正文</a>}

      {!independentCemeterySite && <header className="site-header">
        <button className="wordmark" type="button" onClick={() => navigate(ROUTES.home)} aria-label="返回憎恶社首页">
          <span className="wordmark-mark" aria-hidden="true">憎恶社</span>
          <span><b>ZENGWU SOCIETY</b><small>当代艺术 · 诗歌 · 出版</small></span>
        </button>

        <nav className="gallery-section-nav" aria-label="画廊栏目">
          {[
            { path: ROUTES.home, label: "首页" },
            { path: ROUTES.exhibitions, label: "展览", hasNew: publicCatalog.exhibitions.some((entry) => entry.isNew) },
            { path: ROUTES.people, label: "人物", hasNew: publicCatalog.people.some((entry) => entry.isNew) },
            { path: ROUTES.news, label: "新闻", hasNew: publicCatalog.news.some((entry) => entry.isNew) },
            { path: ROUTES.publications, label: "出版物", hasNew: publicCatalog.publications.some((entry) => entry.isNew) },
            { path: ROUTES.about, label: "关于", hasNew: publicCatalog.about.some((entry) => entry.isNew) },
          ].map((item) => (
            <button key={item.path} type="button" className={currentNavigationSection === item.path ? "is-current" : ""} onClick={() => navigate(item.path)}>
              {item.label}{item.hasNew ? <i>NEW</i> : null}
            </button>
          ))}
        </nav>

        <form className="global-search" onSubmit={handleSearch} role="search">
          <Search aria-hidden="true" />
          <label className="sr-only" htmlFor="global-query">{stageVocabulary ? "搜索剧本、朗读者、场记或演出名称" : "搜索作品、人名、尺寸或文件标签"}</label>
          <input id="global-query" ref={searchInputRef} value={query} onChange={(event) => setQuery(event.target.value)} placeholder={stageVocabulary ? "搜索剧本、朗读者、场记或演出名称" : "搜索作品、人名、尺寸或文件标签"} autoComplete="off" spellCheck={false} aria-describedby="search-instruction" />
          <button type="submit">搜索</button>
          <span className="sr-only" id="search-instruction">支持输入部分关键词。未解锁记录只提供线索提示；搜索历史可以重新查询。</span>

          {results !== null && (
            <section className="search-results" aria-label="搜索结果">
              <div className="search-results-head">
                <p>{resultNote || "搜索结果"}</p>
                <button type="button" onClick={() => setResults(null)} aria-label="关闭搜索结果"><X /></button>
              </div>
              {results.length === 0 ? (
                <div className="empty-result"><span aria-hidden="true">∅</span><p>没有找到相关记录。试试作品名、人名，或其中的一部分。</p></div>
              ) : (
                <div className="result-list">
                  {results.map((result) => (
                    <button key={result.id} className="result-card" type="button" onClick={() => openResult(result)} disabled={result.locked || (!result.path && !result.action)}>
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
          <Dialog open={historyOpen} onOpenChange={setHistoryOpen}>
            <DialogTrigger asChild><Button variant="ghost" className="header-button"><History aria-hidden="true" /><span>搜索历史</span></Button></DialogTrigger>
            <DialogContent className="search-history-dialog">
              <DialogHeader><DialogTitle>搜索历史</DialogTitle><DialogDescription>保留最近 50 个搜索词。标记为“有效”的词可访问记录；点击任一词可按当前进度重新查询。</DialogDescription></DialogHeader>
              {game.searchHistory.length ? <ol className="search-history-list">
                {game.searchHistory.map((term) => {
                  const status = searchStatus(resolveGameSearch(term, game, currentPath));
                  return <li key={term}><button type="button" onClick={() => { setHistoryOpen(false); runSearch(term); }}><span>{term}</span><b className={status === "有效" ? "is-valid" : ""}>{status}</b></button></li>;
                })}
              </ol> : <p>还没有搜索记录。找到的线索可以在这里随时重查。</p>}
            </DialogContent>
          </Dialog>
        </nav>
      </header>}

      {!independentCemeterySite && !isGalleryHome && <div className="path-strip" aria-label="当前位置"><span>INDEX</span><code>{currentPath}</code>{game.visited.includes(currentPath) && <i>LOCAL COPY</i>}</div>}

      <main id={embedded ? undefined : "main-content"} className="game-main">{renderPage()}</main>

      {!independentCemeterySite && <footer className="site-footer"><span>憎恶社 · 作品与旧档案</span><span>本页面为文学文本改编的虚构交互原型</span><button type="button" onClick={() => searchInputRef.current?.focus()}>搜索站内记录</button></footer>}

      <p className="sr-only" aria-live="polite">{searchSummary}{currentPath === ROUTES.dimensions ? `空框已检查 ${game.frameClicks} 次。` : ""}{currentPath === ROUTES.phoenixRoute ? `河流路线已完成 ${game.routeTrips} 次往返。` : ""}</p>

      {deathScareActive && (
        <div className="deleted-post-scare" role="dialog" aria-modal="true" aria-label="已删除帖子">
          <button ref={skipDeathScareRef} type="button" onClick={(event) => { event.stopPropagation(); finishWangRecovery(); }}>阅读完毕，继续</button>
          <article className={deathScareTextVisible ? "is-visible" : ""}>
            <span>帖子 302｜已删除</span>
            <p>他们已经替王克定写好了一种死法。</p>
            <strong>但绳结不会替人作证。</strong>
          </article>
        </div>
      )}

      {collapseImageActive && (
        <div className="collapse-image-layer" role="dialog" aria-modal="true" aria-label="憎恶社停止活动后的四散意象">
          <button ref={collapseImageRef} type="button" onClick={dismissCollapseImage} aria-label="关闭四散意象并继续查看旧社团档案">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={browserPath("/archive/zengwu-collapse.webp")} alt="深蓝色水面般的背景中，白色飞鸟向四处散开，一只红鸟停留在中央下方" />
            <span>点击画面继续</span>
          </button>
        </div>
      )}
    </div>
    {!embedded && <OpeningPrologue onActiveChange={setOpeningActive} onComplete={() => navigate(ROUTES.home)} />}
    </>
  );
}

const RENAISSANCE_WORKS = [
  {
    id: "arnolfini",
    title: "乔凡尼·阿尔诺芬尼夫妇像",
    artist: "扬·凡·艾克",
    year: "1434",
    collection: "伦敦国家美术馆",
    image: "/gallery/renaissance/arnolfini.webp",
    alt: "扬·凡·艾克画作《乔凡尼·阿尔诺芬尼夫妇像》",
    note: "凸面镜、吊灯与室内织物，把双人肖像变成一间关于观看与见证的房间。",
    interactive: true,
  },
  {
    id: "birth-of-venus",
    title: "维纳斯的诞生",
    artist: "桑德罗·波提切利",
    year: "约 1485",
    collection: "乌菲齐美术馆",
    image: "/gallery/renaissance/birth-of-venus.webp",
    alt: "桑德罗·波提切利画作《维纳斯的诞生》",
    note: "海风、衣褶与贝壳，让神话人物在平面化的节奏中抵达岸边。",
  },
  {
    id: "primavera",
    title: "春",
    artist: "桑德罗·波提切利",
    year: "约 1480",
    collection: "乌菲齐美术馆",
    image: "/gallery/renaissance/primavera.webp",
    alt: "桑德罗·波提切利画作《春》",
    note: "花木、身体与寓意人物，被编织成一座难以一次读完的花园。",
  },
  {
    id: "lady-with-ermine",
    title: "抱银鼠的女子",
    artist: "列奥纳多·达·芬奇",
    year: "约 1489—1490",
    collection: "恰尔托雷斯基博物馆",
    image: "/gallery/renaissance/lady-with-ermine.webp",
    alt: "列奥纳多·达·芬奇画作《抱银鼠的女子》",
    note: "身体转向和视线错位，使静止的肖像保留了刚刚发生过的动作。",
  },
  {
    id: "castiglione",
    title: "巴尔达萨雷·卡斯蒂廖内肖像",
    artist: "拉斐尔",
    year: "约 1514—1515",
    collection: "卢浮宫",
    image: "/gallery/renaissance/castiglione.webp",
    alt: "拉斐尔画作《巴尔达萨雷·卡斯蒂廖内肖像》",
    note: "灰、黑与肉色的克制关系，把人物的身份暂时退到目光之后。",
  },
  {
    id: "goldsmith",
    title: "金匠在他的店铺",
    artist: "彼得鲁斯·克里斯蒂",
    year: "1449",
    collection: "大都会艺术博物馆",
    image: "/gallery/renaissance/goldsmith.webp",
    alt: "彼得鲁斯·克里斯蒂画作《金匠在他的店铺》",
    note: "镜面、金属和玻璃，把商业空间处理成一场细密的物质观看。",
  },
] as const;

export function GalleryHomePage({ onStart }: { onStart: () => void }) {
  return (
    <article className="gallery-home">
      <section className="gallery-home-hero" aria-labelledby="current-exhibition-title">
        {/* Native image keeps the GitHub Pages base path and the Sites build on the same asset URL. */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={browserPath("/gallery/zhuhongmen-hall.webp")} alt="憎恶社赭红门展览现场：暖白展墙、赭红色门状装置与一处留下挂钩的空展位" />
        <div className="gallery-home-shade" />
        <div className="gallery-home-caption">
          <p>正在展出 / NOW ON VIEW</p>
          <span>憎恶社二层主厅</span>
          <h1 id="current-exhibition-title">赭红门</h1>
          <b>10.01—10.14</b>
          <button type="button" onClick={onStart}>进入展览 <ArrowUpRight aria-hidden="true" /></button>
        </div>
        <a href="#latest-notice">最新公告 <ArrowDown aria-hidden="true" /></a>
      </section>

      <section className="gallery-notice" id="latest-notice">
        <header><p>场馆告示 / NOTICE 01</p><time>10.03</time></header>
        <div className="gallery-notice-copy">
          <span>展厅状态更新</span>
          <h2>展品丢失</h2>
          <p>闭馆复核时，工作人员未能确认 A 区西南角 A-07 展品的位置。展厅仍正常开放，相关墙面、目录与访客记录已暂时保留。</p>
          <button type="button" onClick={onStart}>查看告示及展厅记录 <ArrowUpRight aria-hidden="true" /></button>
        </div>
        <div className="missing-work-mark" aria-hidden="true"><span>A—07</span><i>未确认位置</i></div>
      </section>

      <section className="gallery-appreciation" aria-labelledby="gallery-appreciation-title">
        <header>
          <p>VIEWING ROOM / 画作赏析</p>
          <div><h2 id="gallery-appreciation-title">文艺复兴与早期尼德兰绘画选</h2></div>
        </header>

        <div className="renaissance-grid">
          {RENAISSANCE_WORKS.map((work, index) => {
            const image = <>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={browserPath(work.image)} alt={work.alt} />
              {work.interactive ? <i>DETAIL / 可查看</i> : null}
            </>;
            return (
              <figure key={work.id} className={`renaissance-card renaissance-card-${index + 1}${work.interactive ? " is-interactive" : ""}`}>
                {work.interactive ? (
                  <Dialog>
                    <DialogTrigger asChild><button type="button" className="renaissance-image-button" aria-label={`查看《${work.title}》的馆藏细节`}>{image}</button></DialogTrigger>
                    <DialogContent className="xu-hui-sketch-dialog">
                      <div className="xu-hui-sketch-image">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={browserPath("/gallery/xu-hui-sketch.webp")} alt="泛黄纸张上的徐惠炭笔肖像手稿" />
                      </div>
                      <div className="xu-hui-sketch-copy">
                        <DialogHeader>
                          <p>馆藏图像交叉索引 / 未登记</p>
                          <DialogTitle>徐惠</DialogTitle>
                          <DialogDescription>一张夹在旧图录里的素描手稿。</DialogDescription>
                        </DialogHeader>
                      </div>
                    </DialogContent>
                  </Dialog>
                ) : image}
                <figcaption>
                  <span>{String(index + 1).padStart(2, "0")} / {work.collection}</span>
                  <h3>{work.title}</h3>
                  <b>{work.artist} · {work.year}</b>
                  <p>{work.note}</p>
                </figcaption>
              </figure>
            );
          })}
        </div>
      </section>
    </article>
  );
}

export function DirectoryPage({ kicker, title, intro, entries, onOpen }: { kicker: string; title: string; intro: string; entries: DirectoryEntry[]; onOpen: (path: string) => void }) {
  return (
    <article className="directory-page">
      <header className="directory-head"><div><p>{kicker}</p><h1>{title}</h1></div><div><span>{String(entries.length).padStart(2, "0")} ENTRIES</span><p>{intro}</p></div></header>
      <div className="directory-list">
        {entries.map((entry, index) => {
          const content = <><span className="directory-number">{String(index + 1).padStart(2, "0")}</span><div><p>{entry.eyebrow}{entry.isNew ? <b>NEW</b> : null}</p><h2>{entry.title}</h2><span>{entry.summary}</span></div>{entry.path ? <ArrowUpRight aria-hidden="true" /> : <i>公开资料</i>}</>;
          return entry.path ? <button key={entry.id} type="button" onClick={() => onOpen(entry.path)}>{content}</button> : <section key={entry.id}>{content}</section>;
        })}
      </div>
      <footer><span>LOCAL INDEX</span><p>这里显示的目录由本机已恢复进度生成。换一台设备时，未发现条目不会提前出现。</p></footer>
    </article>
  );
}

export function ExhibitionPage({ frameNotice, onInspectFrame }: { frameNotice: boolean; onInspectFrame: () => void }) {
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

function GeDongpingPage({ onOpenSupplement }: { onOpenSupplement: () => void }) {
  return (
    <article className="person-page ge-dongping-page">
      <header className="person-masthead">
        <div><CacheStamp>PERSON / PUBLIC FILE</CacheStamp><p className="section-kicker">参展相关人物</p><h1>葛东平</h1></div>
        <dl className="person-quick-facts"><MetaLine label="身份">参展者／艺术工作者</MetaLine><MetaLine label="公开关联">《赭红门》</MetaLine><MetaLine label="档案">图像材料 GD—01</MetaLine></dl>
      </header>

      <section className="ge-dongping-archive">
        <figure>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={browserPath("/archive/ge-dongping-figure.webp")} alt="葛东平人物附图：蓝黑色人物侧身，肩背叠有红色白芍花与我自顾文字" />
          <figcaption><span>FIGURE / GD—01</span><small>人物附图</small></figcaption>
        </figure>
        <div><span>文本摘录</span><h2>刺青</h2><blockquote><p>葛东平赤着上身，膀处小块一朵白芍站着，两簇窄叶。花下纹三字“我自顾”。言语中大有铭记着现代艺术失败的大创痛。但那花绣却实在美得逃出戏谑：</p><p>刺青。肉上生花，墨色的细线条与粗棱角穿插，团团从从，交亘几组颜色不同，仿似死了，仿似开得艳一时，素泠一时。频繁地抖动肩胛，字体扯皮扯筋肉变形，明体作宋。当是值得漂亮二字。刺扎的边角血隐隐继续敛光。对于非姣好肉之辩，针灼皮下图样猛然变化，冬天凝起，咕哝一紧，白白生生地教它多出大小皴痕来，如是古时候受用墨刑的罪人，脸上在这般季节结霜了。</p></blockquote></div>
      </section>
      <button className="independent-text-link" type="button" onClick={onOpenSupplement}><b>篇目一：色目掘漕</b><small>葛东平人物补遗 · 完整文本 <ArrowUpRight aria-hidden="true" /></small></button>
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
      {plainText ? <section className="plain-reader"><p>［仅恢复索引字段］</p><p>残留词组：<span className="reader-clue">看不见</span> / <span className="reader-clue">春天</span> / 瞽人</p><p>正文已从画廊缓存中移除。</p></section> : <section className="corrupted-reader" aria-label="损坏文件索引"><p className="noise">▒▒ READER BODY REMOVED ▒▒▒</p><p className="shift-one"><span className="reader-clue">看不见</span> / ? / <span className="reader-clue">春天</span></p><p className="noise">00::mang / ? / chun::FILE HEADER LOST</p><div className="corruption-block" aria-hidden="true">▓░▓▓░░▓░▓░░▓▓░</div></section>}
      <footer className="damaged-footer"><span>正文状态：REMOVED</span><span>标题字段：LOST</span><span>索引搜索：AVAILABLE</span></footer>
    </article>
  );
}

function RecoveredOnePage({ onReturnToSearch }: { onReturnToSearch: () => void }) {
  return (
    <article className="recovered-one-page">
      <TransferredReading title="序诗：盲之春" />
      <section className="archive-next-step" aria-labelledby="mang-next-step-title">
        <span>当前步骤 / 仍在画廊网站</span>
        <h2 id="mang-next-step-title">加密文件夹尚未开放，现在不需要返回桌面。</h2>
        <p>图像诗稿将在调查后期进入 Administrator 的“上锁文件夹”。此刻请先使用本页留下的分类残留，继续检索旧社团记录。</p>
        <div className="archive-next-clue"><small>分类残留</small><strong>憎恶</strong></div>
        <Button type="button" variant="outline" onClick={onReturnToSearch}>回到画廊搜索框</Button>
      </section>
    </article>
  );
}

function HistoryPage({ roleGlitch, membersRevealed }: { roleGlitch: boolean; membersRevealed: boolean }) {
  return (
    <article className="history-page">
      <header className="history-head"><div><p className="section-kicker">旧社团档案 · 组织 / 朗读同名</p><h1>憎恶社</h1><p>一份从现代目录中消失的画社年表，和第二份朗读文件叠在了一起。</p></div><span className="archive-year">20— / 杭州</span></header>
      <figure className="history-group-photo">
        <div className="history-group-photo-frame">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={browserPath("/archive/zengwu-early-group.webp")} alt="一张泛黄失焦的五人旧合照：四名男性与一名女性，中央一男一女肩靠得更近，所有人的面容都因相纸老化而模糊" />
        </div>
        <figcaption><span>社团合照 / 视觉复原层</span><strong>早期成员及同行者</strong><p>四名男性成员 · 一名女性同行者。照片背注的姓名层残损，暂不据此补全名单。</p><small>杭州 · 年份字段缺失</small></figcaption>
      </figure>
      <section className="history-layout timeline-only"><div className="timeline"><div className="timeline-item"><span>成立</span><div><b>创办人：杜南阳</b></div></div>{membersRevealed && <div className="timeline-item"><span>{roleGlitch ? "声部" : "成员"}</span><div><b>杜南阳 · 徐惠 · 邢万</b></div></div>}<div className="timeline-item"><span>状态</span><div><b>停止公开活动</b></div></div></div></section>
      <TransferredReading title="1.1 憎恶社" />
    </article>
  );
}

const MANG_CLUE_EXCERPTS: Record<string, string[]> = {
  "1.1 憎恶社": ["“我听见有人在讲他的画社", "他的艺术", "他的徐惠”"],
  "王克定": ["“我没结婚。”不婚不育，住在西门车站的", "政府廉租房，窗口的角度看得见湖，那里每年", "都有赎买虚无的年轻人。"],
  "溺水的莉香": ["但引线攥她手里。她名字叫莉香。", "也知道她堂哥是“阔南区”开画廊的杜万琳"],
  "浣石": ["六十七个等身像放在院墙", "摆做一排。从主殿一直列到寝房。"],
  "自白": ["我代为家属在火化单署名", "想到签下一个代号这门事儿"],
  "刍味": ["你想到可以有另外的问题，譬如从世伯", "承办的寿享陵园着手，关于死后的住处"],
};

function TransferredReading({ title }: { title: string }) {
  const clue = MANG_CLUE_EXCERPTS[title];
  return (
    <section className="embedded-script archive-transfer-note">
      <span>{clue ? "CLUE EXCERPT" : "IMAGE ARCHIVE"}</span>
      <h2>{title}</h2>
      <p>完整图像诗稿保存在 Administrator 的“上锁文件夹”中；画廊页面只保留推动当前调查所需的原稿片段。</p>
      {clue ? <blockquote className="archive-clue-excerpt"><small>原稿线索片段</small><p>{clue.map((line, index) => <span key={`${title}-${index}`}>{line}</span>)}</p></blockquote> : null}
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
      </section>

    </article>
  );
}

function DuWanlinPage() {
  return (
    <article className="person-page merged-person-page">
      <header className="person-masthead">
        <div><CacheStamp>CHARACTER PROTOTYPE / 02 LAYERS</CacheStamp><p className="section-kicker">文学人物与现实原型</p><h1 className="overwritten-name" aria-label="文学人物杜南阳，现实原型杜万琳"><span aria-hidden="true">杜南阳</span><b aria-hidden="true">杜万琳</b></h1><p>杜万琳是杜南阳的创作原型。两层世界共享部分家庭与画廊线索，但两者不是同一人的异名。</p></div>
        <div className="identity-status"><span>对应状态</span><b>CONFIRMED</b><small>文学层与现实层分别保留</small></div>
      </header>

      <section className="identity-compare" aria-label="两份人物来源对照">
        <div><span>表层文学世界</span><h2>杜南阳</h2><p>徐惠的丈夫</p><p>憎恶社与公墓项目参与者</p><p>杜莉香的哥哥</p></div>
        <div className="identity-equals" aria-hidden="true">↔</div>
        <div><span>里层现实世界</span><h2>杜万琳</h2><p>徐惠的丈夫</p><p>杜彻的父亲与手稿作者</p><p>杜南阳的创作原型</p></div>
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
        <figure className="lost-photo-card" aria-label="东兴彼得店铺">
          <div className="reconstructed-photo">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={browserPath("/archive/dongxing-peter-2000.webp")} alt="千禧年川渝街巷的东兴彼得店铺，玻璃橱窗内陈列着塑胶模特和内衣" />
          </div>
          <figcaption><strong>东兴彼得</strong></figcaption>
        </figure>
      </section>

      <TransferredReading title="方晚" />
    </article>
  );
}

function DongxingPeterPage() {
  return (
    <article className="photo-record-page">
      <header className="index-head"><div><p className="section-kicker">城市旧照 · 图像复原层</p><h1>东兴彼得</h1></div></header>

      <section className="photo-transcript">
        <div className="photo-index"><span>DX—P / 04</span><b>IMAGE LOST / RECONSTRUCTED</b></div>
        <div className="photo-reconstruction">
          <figure>
            <ShopPhoto original={browserPath("/archive/dongxing-peter-2000.webp")} changed={browserPath("/archive/dongxing-peter-man.webp")} />
            <figcaption><span>依据文字层复原</span><small>非原始档案影像</small></figcaption>
          </figure>
        </div>
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

function WangKedingPage({ onOpenSociety }: { onOpenSociety: () => void }) {
  return (
    <article className="person-page case-person-page">
      <header className="person-masthead">
        <div><CacheStamp>PERSON / CASE LINKED</CacheStamp><p className="section-kicker">人物档案 · 公开结论层</p><h1>王克定</h1><p>旧社团关系者。现阶段只展示公开记录；后续物证尚未并入此页。</p></div>
        <div className="public-conclusion"><span>公开死亡记录</span><b>投河</b><strong>结论：自杀</strong><small>该结论尚未经过交叉验证</small></div>
      </header>

      <section className="person-evidence-grid">
        <dl className="dossier-facts"><MetaLine label="婚姻">本人称未婚</MetaLine><MetaLine label="居所">西门车站附近廉租房</MetaLine><MetaLine label="窗景">可见湖泊</MetaLine><MetaLine label="关联">杜万琳 · 方晚</MetaLine></dl>
        <button className="independent-text-link society-return-link" type="button" onClick={onOpenSociety}><b>憎恶社</b><small>旧社团档案 · 组织 / 朗读同名 <ArrowUpRight aria-hidden="true" /></small></button>
      </section>

      <TransferredReading title="王克定" />
    </article>
  );
}

function XingWanPage({ drumRead, onReadDrum, onOpenFamily }: { drumRead: boolean; onReadDrum: () => void; onOpenFamily: () => void }) {
  return (
    <article className="person-page merged-person-page">
      <header className="person-masthead">
        <div><CacheStamp>PERSON / XW</CacheStamp><p className="section-kicker">人物档案</p><h1>邢万</h1><p>憎恶社早期成员，与杜南阳、徐惠相识，曾与方晚、王克定一同出现在社团合照中。</p></div>
      </header>

      <RentedRoom image={browserPath("/archive/rented-room.webp")} drumImage={browserPath("/archive/pellet-drum-detail.webp")} drumRead={drumRead} onReadDrum={onReadDrum} onOpenFamily={onOpenFamily} />

      <TransferredReading title="在兰道" />
    </article>
  );
}

function LiXiangDeathPage() {
  return (
    <article className="death-record-page water-record">
      <header className="death-record-head">
        <div><CacheStamp>DEATH RECORD / WATER DAMAGED</CacheStamp><p className="section-kicker">亲属档案 · 河流记录</p><h1>莉香</h1></div>
        <div className="death-status"><span>公开说法</span><b>溺亡</b><small>尚未经过案卷交叉验证</small></div>
      </header>

      <section className="water-dossier">
        <dl><MetaLine label="姓名">莉香</MetaLine><MetaLine label="公开说法">意外溺亡</MetaLine><MetaLine label="遗体地点">西岩寺附近</MetaLine><MetaLine label="发现时间">未记载</MetaLine><MetaLine label="目击记录">未记载</MetaLine><MetaLine label="案卷状态">等待交叉验证</MetaLine></dl>
        <div className="kinship-note"><span>两层亲属关系</span><p>文学层中，她是杜南阳的妹妹；现实原型资料中，她是杜万琳的堂妹。她后来与邢万结婚。</p></div>
      </section>

      <section className="case-crossref"><span>交叉附件</span><div><h2>另一名河中死者</h2><p>人物：王克定</p><p>材料名称：尸检报告</p></div><code>INDEX AVAILABLE · BODY LOCKED</code></section>

      <TransferredReading title="溺水的莉香" />

      <section className="prototype-end"><span>交叉材料</span><div><h2>莉香并非这批河流记录中唯一的死者。</h2><p>王克定名下另存有一份未并入公开结论的人体检验材料。</p></div></section>
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
            <MetaLine label="连接物">石立人·头部塑像（数公斤重）</MetaLine>
            <MetaLine label="面部">脸颊三道割伤</MetaLine>
            <MetaLine label="漂流终点">凤凰水库</MetaLine>
          </dl>
          <span className="scan-mark" aria-hidden="true">复印件</span>
        </div>
        <aside className="transcription-panel">
          <ArtifactTag>转录层 02</ArtifactTag>
          <h2>反绑与坠物</h2>
          <p>死者双手在背后受束，并与石质头部塑像连接。原记录将塑像来源指向西岩寺后山。</p>
          <p>尸表另见脸颊三道伤痕。关于漂流与伤痕形成方式的表面解释，仍需沿河流路线复核。</p>
          <div className="evidence-callout"><span>物证索引</span><strong>石立人·头部塑像</strong><code>SOURCE FIELD AVAILABLE</code></div>
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
        <div><CacheStamp>EVIDENCE OBJECT / ST-67</CacheStamp><p className="section-kicker">物证记录 · 石质残件</p><h1>石立人·头部塑像</h1><p>照片层保留为干燥状态。异常痕迹并不在这份初始物证页出现。</p></div>
        <div className="document-notice"><span>状态</span><b>入库照片</b><small>色彩未校正</small></div>
      </header>
      <figure className="evidence-photo">
        {/* Generated archival asset is already WebP-compressed and uses the runtime base path. */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={browserPath("/archive/stone-head-evidence.webp")} alt="灰黑背景下干燥、断裂的石质佛头档案照片" />
        <figcaption><span>图像编号 ST-67-A</span><p>颈部断口干燥；此页未检出红色液体痕迹。</p></figcaption>
      </figure>
      <section className="evidence-ledger">
        <dl><MetaLine label="物件">石立人头部塑像残件</MetaLine><MetaLine label="重量">数公斤（原文未给精确值）</MetaLine><MetaLine label="辨认来源">西岩寺后山</MetaLine><MetaLine label="关联">王克定尸体反绑处</MetaLine></dl>
        <div><span>旧照附注</span><p>寺院后山曾排列六十七尊等身石像。佛头的面容仍可辨认。</p><code>RELATED PLACE INDEX: 西岩寺</code></div>
      </section>
    </article>
  );
}

function XiyanTemplePage({ openings, completed, reducedMotion, onInspect, onRevealComplete }: {
  openings: number; completed: boolean; reducedMotion: boolean;
  onInspect: (opening: number) => void; onRevealComplete: () => void;
}) {
  return (
    <article className="temple-page">
      <header className="evidence-masthead">
        <div><CacheStamp>PLACE CACHE / XY-67</CacheStamp><p className="section-kicker">西岩寺 · 后山旧照</p><h1>六十七尊</h1><p>旧图说明写着：等身石像从主殿排列至寝房。最后一尊只剩下头部与石座。</p></div>
      </header>

      <StoneInspection openings={openings} completed={completed} reducedMotion={reducedMotion}
        cleanImage={browserPath("/archive/stone-head-evidence.webp")} bloodImage={browserPath("/archive/stone-head-evidence-blood.webp")}
        onInspect={onInspect} onRevealComplete={onRevealComplete} />

      <section className="xiyan-archive"><span>旧照转录</span><p>“六十七个等身像放在院墙，摆做一排。从主殿一直列到寝房。”</p></section>

      <section className="independent-leaf-prologue">
        <header><h2>西岩大火</h2></header>
        <div><p>辣火趴在寺里各处五瓣。</p><p>土蟹掐妙诀，<br />它说：荼<br />我说之于清蒸<br />顾了秋火过急</p><p>它说“格子” 沉下游泳，<br />同钳子舀汤浇壳。<br />也说毘。倏地脱力</p><p>腹子翻热我重复格子。<br />它游远，汤面圆圈同心。</p><p>我说：西岩寺。</p></div>
      </section>

      {completed && (
        <TransferredReading title="浣石" />
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
        <section className="river-stop"><span>03 / 回水</span><h2>低速水域</h2><p>漂流路线在此变缓，随后进入水库。</p>{trips >= 3 && <aside className="route-annotation pinky-reveal">伤口批注：右小手指缺失；切口时间早于落水。</aside>}</section>
        <section className="river-stop route-reservoir" id="route-bottom"><span>04 / 下游</span><h2>凤凰水库</h2><p>尸体在这里被发现。河流记录至此结束，但尸检附件仍缺少一页。</p></section>
      </div>

      <div className="route-controls" aria-label="河流路线操作">
        <button type="button" onClick={() => onMove("bottom")}><ArrowDown aria-hidden="true" />到下游</button>
        <span>{reducedMotion ? "即时移动" : "沿路线移动"}</span>
        <button type="button" onClick={() => onMove("top")}><ArrowUp aria-hidden="true" />回上游</button>
      </div>
      {trips >= 3 && <section className="prototype-end"><span>补充附件已定位</span><div><h2>尸表遗漏</h2><p>部位：右小手指<br />状态：切口形成于落水之前</p></div></section>}
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
        <div><CacheStamp>FORENSIC ATTACHMENT / WK-02</CacheStamp><p className="section-kicker">被删除的尸检补充页</p><h1>右小手指</h1><p>附件正文仍在，但访问口令被拆散在石像记录与面部伤痕中。</p></div>
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
          <dl><MetaLine label="缺失部位">右小手指</MetaLine><MetaLine label="切口状态">人为切割痕迹</MetaLine><MetaLine label="发生顺序">落水之前</MetaLine><MetaLine label="时间批注">前一周六（原文相对时间）</MetaLine></dl>
          <p className="evidence-callout">该伤口不能由漂流撞击解释；它与脸颊伤痕、反绑双手和石质坠物共同要求重新判断死亡过程。</p>
          <div className="cross-index-grid"><span>交叉索引</span><b>302 室</b><b>3 × 3dm</b><b>老城河</b></div>
          <aside className="evidence-callout"><span>关联文学索引</span><h3>野生白鹭</h3><p>补充页与一份被删除的文学文件共用这个标签。</p></aside>
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
        <h2>王克定因精神困境与艺术信念冲突服毒自杀；河中的投河现场由邢万在死后伪造。</h2>
        <p>死亡性质：自杀。死后移尸、反绑与坠石者：邢万。</p>
      </section>
      <section className="evidence-verdict-grid">
        <div><span>01</span><h3>毒物</h3><p>胃内容物与血样检出致死剂量毒物。</p></div>
        <div><span>02</span><h3>先后</h3><p>死亡时间早于入水时间，肺部征象不支持生前溺水。</p></div>
        <div><span>03</span><h3>反绑</h3><p>双手反绑、石块坠附与拖拽擦痕均形成于死亡后。</p></div>
        <div><span>04</span><h3>搬运</h3><p>尸体从住所被移至河道，公开的投河现场不是真实死亡现场。</p></div>
      </section>

      <TransferredReading title="王克定之死" />
      <section className="version-history"><span>版本历史</span><div><h2>另一名参与者的身后手续</h2><p>残留表单标题：焚烧签字单<br />死者姓名字段：杜万琳</p></div><code>FORM INDEX AVAILABLE</code></section>
    </article>
  );
}

function DuCremationPage({ revealed }: { revealed: boolean }) {
  return (
    <article className="cremation-page">
      <header className="evidence-masthead">
        <div><CacheStamp>DISPOSITION FORM / DW</CacheStamp><p className="section-kicker">遗体处理手续 · {revealed ? "完整文字层" : "表面副本"}</p><h1>杜万琳</h1></div>

      </header>

      <section className="cremation-layout">
        <div className="cremation-sheet burnt-edge">
          <header><span>焚烧签字单／转录件</span><code>DW-FORM-01</code></header>
          <dl><MetaLine label="死者">杜万琳</MetaLine><MetaLine label="死亡日期">未记载</MetaLine><MetaLine label="医院">未记载</MetaLine><MetaLine label="表面记录">病逝／肝病相关</MetaLine><MetaLine label="遗体处置">已火化</MetaLine><MetaLine label="家属状态">儿子在外；妻子留家</MetaLine></dl>
          <div className="signature-field"><span>代家属签字</span><b className={revealed ? "signature-reveal" : "signature-mask"}>{revealed ? "方晚" : "方＿"}</b><small>{revealed ? "与到院记录、诗文声部交叉确认" : "第二字被纸面灼痕覆盖"}</small></div>
        </div>
        <aside className="transcription-panel"><ArtifactTag>{revealed ? "文字层已恢复" : "表面可见"}</ArtifactTag><h2>{revealed ? "方晚代杜家签字" : "最先到院的人"}</h2><p>方晚先到医院。由于杜万琳的儿子不在场、妻子留在家中，后续手续由这名朋友代签。</p></aside>
      </section>

      {revealed && (
        <>
          <TransferredReading title="自白" />
          <figure className="cemetery-receipt">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={browserPath("/archive/cemetery-receipt.webp")} alt="他山地方公墓收据" loading="lazy" />
          </figure>
        </>
      )}
    </article>
  );
}

function CemeteryReportPage({ onOpenFamily }: { onOpenFamily: () => void }) {
  return <article className="news-cache-page">
    <header className="news-cache-head"><div><CacheStamp>NEWS / PUBLIC ARCHIVE</CacheStamp><p className="section-kicker">地方旧闻</p><h1>他山晚讯</h1></div><span>社会简讯 · 剪报存档</span></header>
    <section className="news-paper"><div className="news-masthead"><b>他山晚讯</b><span>旧版网页摘录</span></div>
      <h2>他山地方公墓贪污案</h2>
      <figure className="cemetery-newspaper">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={browserPath("/archive/cemetery-newspaper.webp")} alt="他山晚讯旧报：他山地方公墓贪污案，公墓项目账目接受调查" />
      </figure>
      <aside className="cache-difference"><span>随文材料</span><button className="independent-text-link" type="button" onClick={onOpenFamily}><b>杜彻 · 家属记录</b><small>打开随文存档 <ArrowUpRight aria-hidden="true" /></small></button></aside>
    </section>
  </article>;
}

function CemeteryCasePage() {
  const participants = [
    { name: "杜万琳", alias: "杜南阳的创作原型", relation: "手稿作者；现实层人物，与表层公墓项目叙事相连", record: "焚烧签字单／方晚代签", death: "已故；肝硬化导致肝癌后病逝，遗体已火化" },
    { name: "方晚", alias: "", relation: "杜南阳同乡与旧友；杜莉香账目材料收件人", record: "旧成员履历／寄件邮戳／谈话记录", death: "已故；晚年患阿尔茨海默症，后于养老院病逝" },
    { name: "王克定", alias: "", relation: "憎恶社早期成员；杜莉香的前男友", record: "尸检、毒检与死后搬运痕迹", death: "已故；服毒自杀，投河现场由邢万伪造" },
    { name: "邢万", alias: "新闻匿名写作刑某", relation: "公墓项目负责人；挪用公款；杜莉香的丈夫", record: "账目、供述、判决与逮捕报道", death: "被捕并判处无期徒刑" },
    { name: "杜莉香", alias: "莉香", relation: "项目财务；杜南阳的妹妹；账目材料寄件人", record: "遗体鉴定／藏尸勘验／账目邮戳", death: "已故；遭邢万掐死，溺亡说法不成立" },
  ];

  return (
    <article className="case-index-page">
      <header className="case-index-head">
        <div><CacheStamp>CASE INDEX / 05 PERSONS</CacheStamp><p className="section-kicker">项目参与者交叉索引</p><h1>他山地方<br />公墓贪污案</h1></div>
      </header>

      <div className="case-table-wrap">
        <table className="case-table">
          <thead><tr><th>人物</th><th>项目关系</th><th>公开／恢复记录</th><th>死亡过程</th></tr></thead>
          <tbody>{participants.map((person) => <tr key={person.name}><th scope="row"><b>{person.name}</b>{person.alias && <small>{person.alias}</small>}</th><td>{person.relation}</td><td>{person.record}</td><td className={["王克定", "杜莉香"].includes(person.name) ? "case-critical" : ""}>{person.death}</td></tr>)}</tbody>
        </table>
      </div>

      <section className="case-index-foot"><span>随案公开记录</span><figure className="case-magazine">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={browserPath("/archive/xing-arrest-magazine.webp")} alt="‘他山地方公墓贪污案’涉案人员 刑某现已被警方依法逮捕" loading="lazy" />
      </figure></section>
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
        <div className="news-copy"><p>报道正文未公开完整姓名，案由之外的犯罪事实、审判结果与死亡因果均不在本页扩写。</p><p>人物交叉索引：<strong>{cached ? "邢万（新闻匿名：刑某）" : "刑某"}</strong></p></div>
        {cached && <aside className="cache-difference"><span>CACHE ONLY</span><p><del>关联材料：内部人员栏已移除</del></p><p>后来材料残留：世伯承办的<strong>寿享陵园</strong>。</p></aside>}
      </section>
    </article>
  );
}

function DuCheFamilyPage({ onRead, familyPhotoRead }: { onRead: () => void; familyPhotoRead: boolean }) {
  return <article className="person-page du-che-page">
    <header className="index-head"><div><h1>杜彻</h1></div></header>
    <FamilyPhoto front={browserPath("/archive/du-che-childhood.webp")} back={browserPath("/archive/du-che-photo-back.webp")} onRead={onRead} />
    <section className="family-relations"><h2>家庭关系</h2><dl className="dossier-facts"><MetaLine label="父亲">杜万琳（文学人物杜南阳的创作原型）</MetaLine><MetaLine label="母亲">徐惠</MetaLine>{familyPhotoRead && <MetaLine label="姑姑">莉香 · 父亲的堂妹</MetaLine>}</dl></section>
  </article>;
}

function XuHuiPage({ tiles, solved, onChange }: { tiles: number[]; solved: boolean; onChange: (next: number[]) => void }) {
  return <article className="person-page xu-hui-page">
    <header className="index-head"><div><p className="section-kicker">人物档案 · 旧相簿</p><h1>徐惠</h1></div></header>
    <WeddingPhotoPuzzle image={browserPath("/archive/xu-hui-wedding.webp")} tiles={tiles} solved={solved} onChange={onChange} />
  </article>;
}

function DuChePage({ onOpenSupplement, onOpenEditor }: { onOpenSupplement: () => void; onOpenEditor: () => void }) {
  return (
    <article className="person-page du-che-page">
      <header className="person-masthead"><div><CacheStamp>PERSON / NEXT GENERATION</CacheStamp><p className="section-kicker">人物档案 · 家庭与职业</p><h1>杜彻</h1><p>杜万琳与徐惠之子，写作并经营画廊；世伯曾向他介绍寿享陵园。</p></div><dl className="person-quick-facts"><MetaLine label="父亲">杜万琳（杜南阳的创作原型）</MetaLine><MetaLine label="母亲">徐惠</MetaLine><MetaLine label="配偶">李髮</MetaLine></dl></header>
      <section className="du-che-grid"><div className="biography-sheet"><span>履历交叉</span><p>杜彻年轻时中断大学学业，回到家乡经营画廊。他在《刍味》中写到席间的世伯，以及对方承办的寿享陵园。</p><p>世伯向他谈起陵园与“死后的住处”。酒桌上的话题由婚姻转向死亡，那些没有问出口的话留在了诗里。</p></div><aside className="wedding-index-card"><span>家庭公告</span><h2>杜彻婚礼</h2><p>新娘姓名：李髮。</p><code>INDEX: LI_髮</code></aside></section>
      <button className="independent-text-link" type="button" onClick={onOpenSupplement}><b>篇目二：铁房山补</b><small>杜彻、李髮与铁房山的三则补遗 · 完整文本 <ArrowUpRight aria-hidden="true" /></small></button>
      <section className="version-history"><span>朗读文件索引 · 杜彻</span><div><h2>刍味</h2><p>一次席间谈话，世伯说起他承办的寿享陵园。杜彻把那些酒意、味觉与没有问出口的话写进这首诗。</p><p>文件状态：正文未并入人物档案。</p></div></section>
      <button className="editor-login-link" type="button" onClick={onOpenEditor}>编辑登录</button>
      <p className="editor-source-note">账号线索在李司贰书信的缓存信息里；口令线索在《玛赫的厨房》版权页。</p>
    </article>
  );
}

function WeddingPage() {
  return (
    <article className="wedding-page">
      <header className="wedding-head"><div><CacheStamp>WEDDING ARCHIVE / 07</CacheStamp><p className="section-kicker">家庭公告与城市舞台指示</p><h1>杜彻 × 李髮</h1></div></header>
      <section className="wedding-record"><div><span>婚礼记录</span><p>“杜彻婚礼办得足够气派。”婚礼档案把画廊往来与新家庭放进同一个时间切面。</p></div><div><span>人物关系</span><p>杜彻：杜万琳与徐惠之子。李髮：杜彻的结婚对象。</p></div></section>
      <TransferredReading title="舞" />
    </article>
  );
}

function TastePage() {
  return (
    <article className="script-record-page">
      <header className="script-record-head"><div><ArtifactTag>已恢复 10 / 14</ArtifactTag><p className="section-kicker">句肉篇 · 4.1</p><h1>刍味</h1><p>朗读声部：杜彻</p></div><aside><span>相似标题</span><b>刍胃</b><p>只差一个同音字。</p></aside></header>
      <TransferredReading title="刍味" />
    </article>
  );
}

function MedicalPage({ revealed, glyphRevealed, onToggleGlyph }: { revealed: boolean; glyphRevealed: boolean; onToggleGlyph: () => void }) {
  return (
    <article className={`medical-page${revealed ? " is-revealed" : ""}`}>
      <header className="medical-head"><div><CacheStamp>{revealed ? "REDACTION REMOVED / 11" : "MEDICAL CACHE / REDACTED"}</CacheStamp><p className="section-kicker">标题校订与症状索引</p><h1>刍<button type="button" className="glyph-correction" onClick={onToggleGlyph} disabled={revealed || glyphRevealed} aria-label="把被划去的味字校订为胃"><del>味</del><ins className={glyphRevealed || revealed ? "is-visible" : ""}>胃</ins></button></h1></div><div className="time-reversal"><span>旧站修改记录</span><b>{revealed ? "18:14 ← 18:15" : "18:15"}</b><small>{revealed ? "时间戳短暂倒退一分钟" : "历史层未展开"}</small></div></header>
      <section className="medical-sheet"><div className="medical-title-line"><span>疾病名称</span><strong>{revealed ? "阿尔茨海默病" : "××××××"}</strong></div><p>一种起病隐匿、进行性发展的神经系统退行性疾病。现有文字层列出以下临床表现：</p><ul><li>记忆障碍</li><li>失语</li><li>失用</li><li>失认</li><li>视空间技能损害</li><li>执行功能障碍</li><li>人格和行为改变</li></ul>{!revealed && <p className="medical-search-note">病名被六个字符遮挡；症状列表仍可全文搜索。</p>}</section>
      {revealed && <TransferredReading title="刍胃" />}
      {revealed && <section className="old-history-reveal"><span>旧站命名残片</span><h2>阔南会社</h2><p>杜彻与葛东平改造画廊时曾考虑使用的名称。正文尚未进入当前恢复范围。</p></section>}
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
      {loaded < 5 ? <div className="history-loader"><p>{reducedMotion ? "减少动态已开启，请手动载入。" : "继续滚至底部，载入更早版本。"}</p>{reducedMotion && <Button type="button" onClick={onLoad}>载入更早版本（{loaded + 1}/5）</Button>}</div> : <section className="autofill-notice"><span>5/5 · 最早版本已恢复</span><p>最早保存版的署名与站内书信索引可以互相核对。</p></section>}
    </article>
  );
}

function LiLetterPage() {
  return (
    <article className="letter-page">
      <header className="letter-meta"><div><CacheStamp>PRIVATE LETTER / CACHE</CacheStamp><p className="section-kicker">站名改写依据</p><h1>李司贰致叶是</h1></div><dl><MetaLine label="收件人">叶是</MetaLine><MetaLine label="缓存账号"><code>editor_ys</code></MetaLine><MetaLine label="日期">20XX.2.20</MetaLine></dl></header>
      <section className="letter-sheet"><p>叶是：</p><p>前些日子参考你同乡张恋发来的西岩寺主持元昶人物访谈资料，做了几首不太好的诗歌，悉以令作《礼倒僧元昶》，各中民俗相关描写不逮笔力，还望去日指点二三。</p><p>李髮、杜彻上月慨已结婚，夫妇俩托我向你道歉，有关婚礼邀请实在太忙没有寄出。他们也是看到你捎来的赠诗，才记起做邀请函时候忘记写你。</p><p>上月葛东平联合杜彻在 Z 城重新装修了画廊。杜彻执意要以自己小说里的“憎恶社”来命名，我们都觉着不太吉利，最后综合一下，他妥协名字改成了“阔南会社”。</p><p>对了，你应该是看过他的那篇小说的草稿。当时我们说其中诗的部分过于浓重而堪堪难阅，他记了很久，最后索性写得流水账起来。</p><p>半年未见，凭此信代为问安。</p><footer><strong>李司贰</strong><span>20XX.2.20</span></footer></section>
      <section className="letter-crossref"><span>随信书稿索引</span><p><b>“憎恶社”首先是杜彻小说里的组织名。</b>网站中的人物、画廊和所谓历史，可能同时属于小说、诗剧与编辑改稿。</p><code>杜彻／小说／《玛赫的厨房》</code></section>
    </article>
  );
}

function MahePublicationPage() {
  return (
    <article className="publication-page">
      <header className="publication-cover"><div><span>杜彻 小说</span><h1>玛赫的<br />厨房</h1><p>荷潜艇出版社</p></div><aside><b>2019</b><span>初版</span></aside></header>
      <section className="copyright-grid"><div><p className="section-kicker">版权页／出版档案</p><dl><MetaLine label="书名">《玛赫的厨房》</MetaLine><MetaLine label="作者">杜彻</MetaLine><MetaLine label="出版">荷潜艇出版社</MetaLine><MetaLine label="首版年份">2019</MetaLine><MetaLine label="再版编辑">叶主任</MetaLine></dl></div><aside className="password-rule-note"><span>页边批注</span><h2>初始口令</h2><p>书名拼音首字母<br /><b>＋</b><br />首版年份</p><code>M H D C F ＋ 2019</code><small>页面不会自动复制或填入结果。</small></aside></section>
      <section className="revision-request"><span>再版修改建议</span><p>“初版小说里涉及到的问题慨已指明，请在本月底将改稿交付荷潜艇编辑部<strong>叶主任</strong>处。”</p></section>
    </article>
  );
}

function JuroutuanfeiBlock({ block }: { block: JuroutuanfeiTextBlock }) {
  if (block.kind === "section") return <h2 id={block.anchor}>{block.text}</h2>;
  if (block.kind === "subheading") return <h3>{block.text}</h3>;
  if (block.kind === "dedication") return <p className="jurou-dedication">{block.text}</p>;
  if (block.kind === "toc-title") return <h3 className="jurou-source-index">{block.text}</h3>;
  if (block.kind === "toc-entry") return <p className="jurou-source-index-entry">{block.text}</p>;
  if (block.kind === "press-mark") return <p className="jurou-press-mark">{block.text}</p>;
  if (block.kind === "epigraph") return <blockquote className="jurou-epigraph">{block.text}</blockquote>;
  if (block.kind === "imprint") return <p className="jurou-imprint">{block.text}</p>;
  if (block.kind === "timeline-date") return <time className="jurou-timeline-date">{block.text}</time>;
  if (block.kind === "timeline-event") return <p className="jurou-timeline-event">{block.text}</p>;
  if (block.kind === "timeline-note") return <p className="jurou-timeline-note">{block.text}</p>;
  return <p>{block.text}</p>;
}

function JuroutuanfeiSeriesPage({ game, onOpen, onBack }: { game: GameState; onOpen: (path: string) => void; onBack: () => void }) {
  const availableChapters = JUROUTUANFEI_CHAPTERS.filter((chapter) => chapter.isAvailable(game));

  return (
    <article className="jurou-series-page">
      <header className="jurou-publication-head">
        <div><CacheStamp>SERIAL INDEX / PROGRESSIVE RELEASE</CacheStamp><p className="section-kicker">小说连载 · 真相阅读区</p><h1>句肉<br />抟飞</h1></div>
        <aside><span>已开放</span><b>{availableChapters.length}/5</b><small>每章独立收录<br />随调查节点更新</small></aside>
      </header>

      <section className="jurou-reader-note"><span>连载规则</span><p>每个 Section 都是出版物栏目中的单一条目，并保留该章的完整原稿顺序。新章节只在相关搜索与档案恢复完成后出现；尚未开放的标题和正文不会在这里提前展示。</p></section>

      {availableChapters.length ? (
        <section className="jurou-series-list" aria-label="句肉抟飞已开放章节">
          {availableChapters.map((chapter) => (
            <button type="button" key={chapter.number} onClick={() => onOpen(chapter.route)}>
              <span>{String(chapter.number).padStart(2, "0")}</span>
              <div><small>选自《句肉抟飞》</small><h2>{chapter.displayTitle}</h2><p>{chapter.trigger}</p></div>
              <ArrowUpRight aria-hidden="true" />
            </button>
          ))}
        </section>
      ) : (
        <section className="jurou-series-empty"><LockKeyhole aria-hidden="true" /><span>0 / 5</span><h2>尚无章节开放</h2><p>恢复“盲之春”后，第一条完整小说章节会出现在出版物目录。</p></section>
      )}

      <div className="jurou-series-back"><Button type="button" variant="outline" onClick={onBack}>返回出版物目录</Button></div>
    </article>
  );
}

function JuroutuanfeiChapterPage({ chapter, available, onBack, onSeries }: { chapter: JuroutuanfeiChapter; available: boolean; onBack: () => void; onSeries: () => void }) {
  if (!available) {
    return (
      <article className="jurou-locked-page">
        <header><CacheStamp>SERIAL ENTRY / SEALED</CacheStamp><p className="section-kicker">受限章节</p><h1>句肉抟飞</h1></header>
        <section><LockKeyhole aria-hidden="true" /><span>章节尚未开放</span><h2>继续完成当前搜索</h2><p>这个地址不能提前解锁正文。相关人物或档案被查明后，本章会作为一条带有 NEW 标记的出版物出现。</p><Button type="button" variant="outline" onClick={onBack}>返回出版物目录</Button></section>
      </article>
    );
  }

  const blocks = getJuroutuanfeiChapterBlocks(chapter.number);
  const isFinalChapter = chapter.number === 5;

  return (
    <article className="jurou-publication-page jurou-chapter-page">
      <header className="jurou-publication-head">
        <div><CacheStamp>SERIAL RELEASE / {String(chapter.number).padStart(2, "0")} OF 05</CacheStamp><p className="section-kicker">小说章节 · 选自《句肉抟飞》</p><h1>{chapter.displayTitle}</h1></div>
        <aside><span>Section.{chapter.number}</span><b>{blocks.length}</b><small>正文段落<br />按阅读顺序收录</small></aside>
      </header>

      <section className="jurou-reader-note"><span>出处</span><p>选自《句肉抟飞》。本页完整收录 <b>{chapter.sourceTitle}</b>；{chapter.trigger}，用作该段线索的剧情回收。</p></section>

      <section className="jurou-reading-column" aria-label={`${chapter.sourceTitle}完整正文`}>
        {blocks.map((block) => <JuroutuanfeiBlock key={block.sourceIndex} block={block} />)}
        {isFinalChapter && <figure className="jurou-ending-illustration">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={browserPath("/publications/juroutuanfei/ending-illustration.webp")} alt="原稿末页插图：一位托腮坐着的人物线描" />
          <figcaption>《句肉抟飞》原稿末页插图</figcaption>
        </figure>}
      </section>

      <footer className="jurou-reader-end"><span>END OF SECTION {chapter.number}</span><h2>{isFinalChapter ? "连载到这里结束。" : "本章到这里结束。"}</h2><p>{isFinalChapter ? "五个 Section 已随调查全部开放，小说叙事现在完整可读。" : "下一章不会在这里预告；完成后续搜索节点，它会作为新的出版物条目出现。"}</p><div><Button type="button" onClick={onSeries}>查看连载索引</Button><Button type="button" variant="outline" onClick={onBack}>返回出版物目录</Button></div></footer>
    </article>
  );
}

function IndependentTextPage({ title, placement, src, available, lateDisclosure = false, showMetadata = true, onBack }: { title: string; placement: string; src: string; available: boolean; lateDisclosure?: boolean; showMetadata?: boolean; onBack: () => void }) {
  const [frameHeight, setFrameHeight] = useState(900);

  if (!available) {
    return (
      <article className="independent-text-page is-locked">
        <header><CacheStamp>INDEPENDENT LEAF / SEALED</CacheStamp><h1>{title}</h1></header>
        <section><LockKeyhole aria-hidden="true" /><h2>这份散页尚未进入当前叙事层。</h2><p>继续完成相关人物与文本解密；直接输入地址不会提前显示正文。</p><Button type="button" variant="outline" onClick={onBack}>返回上一层档案</Button></section>
      </article>
    );
  }

  return (
    <article className={`independent-text-page${showMetadata ? "" : " is-text-only"}`}>
      <header><div><CacheStamp>INDEPENDENT LEAF / COMPLETE</CacheStamp><h1>{title}</h1><p>{placement}</p></div>{showMetadata && <aside><span>呈现原则</span><p>{lateDisclosure ? "终局开放的主观叙事文本，不替代案卷中的责任判断。" : "依据人物与地点关系归档；正文保持完整，不拆散为线索。"}</p></aside>}</header>
      {showMetadata && <section className="independent-text-source"><span>馆藏来源</span><p>独立文本《{title}》；不并入《句肉抟飞》连载。</p></section>}
      <iframe
        className="independent-text-frame"
        src={browserPath(src)}
        title={`${title}完整正文`}
        style={{ height: frameHeight }}
        onLoad={(event) => {
          const measured = event.currentTarget.contentDocument?.documentElement.scrollHeight;
          if (measured) setFrameHeight(measured + 8);
        }}
      />
      <footer><span>END OF INDEPENDENT LEAF</span><Button type="button" variant="outline" onClick={onBack}>返回上一层档案</Button></footer>
    </article>
  );
}

function EditorLoginPage({ user, password, attempts, note, alreadyUnlocked, onUserChange, onPasswordChange, onSubmit, onReopen }: { user: string; password: string; attempts: number; note: string; alreadyUnlocked: boolean; onUserChange: (value: string) => void; onPasswordChange: (value: string) => void; onSubmit: (event: FormEvent<HTMLFormElement>) => void; onReopen: () => void }) {
  return (
    <article className="editor-gate-page">
      <header><CacheStamp>EDITOR CACHE / LOCAL</CacheStamp><p className="section-kicker">叶主任／叶是</p><h1>编辑后台</h1><p>这是一处站内虚构缓存。不会连接现实账号，不保存明文口令。</p></header>
      <aside className="password-rule-note"><h2>找回编辑凭据</h2><p>账号：李司贰书信中标记为“缓存账号”的一行。</p><p>口令：《玛赫的厨房》五个字的拼音首字母，加上版权页的首版年份；“房”的首字母也要计入。</p><p>若还未找到书信，可先从杜彻人物页的《刍味》继续调查。</p></aside>
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
      <section className="fragment-index-preview"><header><span>附件索引</span><b>Ⅰ—Ⅹ</b></header><div>{["Ⅰ","Ⅱ","Ⅲ","Ⅳ","Ⅴ","Ⅵ","Ⅶ","Ⅷ","Ⅸ","Ⅹ"].map((number) => <i key={number}>{number}</i>)}</div><p>标题碎片：始／末／的／碎／点</p><small>解密提示：口令为作者被替换前的旧名。</small><p className="publication-update"><b>NEW</b> 出版物目录已新增《句肉抟飞》Section.5。</p></section>
    </article>
  );
}

function RecoveredIndexPage({ revealed, password, attempts, note, transformStep, onPasswordChange, onSubmit, onStable, onOpenSupplement }: { revealed: boolean; password: string; attempts: number; note: string; transformStep: number; onPasswordChange: (value: string) => void; onSubmit: (event: FormEvent<HTMLFormElement>) => void; onStable: () => void; onOpenSupplement: (path: string) => void }) {
  return (
    <article className={`fragment-stage-page step-${transformStep}`}>
      <header className="fragment-head"><div><CacheStamp>{revealed ? "RECOVERED SCRIPT / 12" : "ENCRYPTED INDEX / Ⅰ—Ⅹ"}</CacheStamp><p className="section-kicker">{revealed ? "场记正在显影" : "文本解密"}</p><h1>始末的碎点</h1></div>{revealed ? <div className="transform-status"><span>界面转换</span><b>{transformStep}/3</b><Button variant="outline" type="button" onClick={onStable} disabled={transformStep >= 3}>显示稳定版</Button></div> : <form className="fragment-password" onSubmit={onSubmit}><label>作者被替换前的旧名<input value={password} onChange={(event) => onPasswordChange(event.target.value)} autoComplete="off" /></label><Button type="submit">解除十段索引</Button><p role="status">{note || `错误不会清空碎片${attempts ? `；已尝试 ${attempts} 次` : ""}。`}</p></form>}</header>
      {revealed ? <TransferredReading title="5.1 始末的碎点" /> : <section className="fragment-grid" aria-label="始末的碎点加密索引">{Array.from({ length: 10 }, (_, index) => <article key={index} className="is-locked"><span>{String(index + 1).padStart(2,"0")}</span><h2>碎片 {String(index + 1).padStart(2,"0")}</h2><div className="stable-fragment-copy">文字层已加密</div></article>)}</section>}
      {revealed && <section className="late-supplement-shelf"><header><h2>终局叙事补遗</h2><p>这两份文本含有比案卷结论更直接的主观叙述，因此只在“始末的碎点”解密后开放；它们作为文学文本呈现，不替代案件索引中的责任判断。</p></header><div><button type="button" onClick={() => onOpenSupplement(ROUTES.scatteredZoudi)}><span>篇目三</span><b>走地国记</b><small>完整文本 <ArrowUpRight aria-hidden="true" /></small></button><button type="button" onClick={() => onOpenSupplement(ROUTES.scatteredNanfuzi)}><span>篇目四</span><b>男腹子</b><small>完整文本 <ArrowUpRight aria-hidden="true" /></small></button></div></section>}
      {revealed && <section className="stage-call"><span>SCENE INDEX / 13 OF 14</span><h2>文本已接近就位</h2><p>恢复目录只剩结诗。标题字段缺失，但它与网站最初的当前展览使用同一个名称。</p></section>}
    </article>
  );
}

function StageZhuhongmenPage() {
  return (
    <article className="stage-zhuhongmen-page">
      <header className="stage-warm-head"><div><ArtifactTag>场次 14 / 14</ArtifactTag><p className="section-kicker">结诗 · 合读</p><h1>赭红门</h1></div><aside><span>场记</span><p>文本已齐。<br />所有人请就位。</p></aside></header>
      <TransferredReading title="赭红门" />
      <section className="stage-note-final"><span>14 / 14 · 全部恢复</span><h2>加密文件夹目录已更新</h2><p>关闭或最小化浏览器，回到桌面的“上锁文件夹”，检查新出现的隐藏 TXT 文件。</p></section>
    </article>
  );
}

function FinalWordPasswordPage() {
  return (
    <article className="stage-zhuhongmen-page">
      <section className="stage-note-final"><span>旧地址 / 本地提示</span><h2>请检查加密文件夹</h2><p>最终口令不在网页里。完成全部诗稿后，请回到桌面的“上锁文件夹”，打开新出现的隐藏 TXT。</p></section>
    </article>
  );
}
