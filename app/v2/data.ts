export type AppId = "browser" | "trash" | "audio" | "vault" | "word";

export type GameSettings = {
  volume: number;
  subtitles: boolean;
  reducedMotion: boolean;
  reducedFlashes: boolean;
  textScale: number;
};

export type SearchEntry = {
  term: string;
  searchedAt: number;
};

export type V2Save = {
  schemaVersion: 2;
  prologueSeen: boolean;
  events: string[];
  visited: string[];
  readItems: string[];
  searchHistory: SearchEntry[];
  recovered: string[];
  settings: GameSettings;
};

export const V2_STORAGE_KEY = "zengwu-she-v2-save";

export const DEFAULT_V2_SAVE: V2Save = {
  schemaVersion: 2,
  prologueSeen: false,
  events: [],
  visited: [],
  readItems: [],
  searchHistory: [
    { term: "赭红门展览", searchedAt: 2 },
  ],
  recovered: [],
  settings: {
    volume: 70,
    subtitles: true,
    reducedMotion: false,
    reducedFlashes: false,
    textScale: 100,
  },
};

export const PROLOGUE = {
  source:
    "荆州街子葛清，勇不肤挠，自颈以下，遍刺白居易舍人诗。成式尝与荆客陈至呼观之，令其自解，背上亦能暗记。反手指其剖处，至“不是此花偏爱菊”，则有一人持杯临菊丛。又“黄夹缬林寒有叶”，则指一树，树上挂缬，缬窠锁胜绝细。凡刻三十余首，体无完肤，陈至呼为白舍人行诗图也。",
  citation: "唐·段成式《酉阳杂俎·前集》卷八",
  dedication: "献给玛赫、L 和杜彻",
};

export const FINAL_WORD_PASSWORD = "shinan2024";
export const FINAL_WORD_URL = "https://mp.weixin.qq.com/s/q1JOS5ufNDzoVLKh-BSaIA";

export const FINAL_FOLDER_REQUIREMENTS = [
  "verified_wang_poison",
  "verified_wang_staging",
  "recovered_ledger_mail",
  "verified_lixiang_homicide",
  "heard_duwanlin_confession",
] as const;

export const STORY_BIBLE = {
  names: {
    wang: "王克定",
    xing: "邢万",
    lixiang: "杜莉香",
    nanyang: "杜南阳",
    wanlin: "杜万琳",
    xu: "徐惠",
    fang: "方晚",
    che: "杜彻",
    li: "李髮",
    publisher: "荷潜艇出版社",
  },
  conclusions: {
    wang:
      "王克定因精神困境与艺术信念冲突服毒自杀。邢万发现尸体后移动尸体、反绑并坠石，伪造了投河现场。",
    lixiang:
      "杜莉香发现挪用公款，在争执中被邢万掐死。邢万藏尸西岩寺附近，对外宣称她意外溺亡，之后因良心发现供述。",
    nanyang:
      "杜南阳压下杜莉香第一次账目举报，承担明确的道德责任，但他不知道邢万将实施杀人，不是杀人共犯。",
    fang:
      "方晚与杜莉香主要是朋友关系，带有轻微、未越界的爱意，没有婚外关系，也不是案件动机。",
  },
};

export const CONTENT_ASSETS = [
  { id: "zhuhongmen-hall", path: "/gallery/zhuhongmen-hall.webp", disposition: "reuse", use: "赭红门展览" },
  { id: "xu-hui-wedding", path: "/archive/xu-hui-wedding.webp", disposition: "migrate", use: "徐惠婚纱照拼图" },
  { id: "society-group", path: "/archive/zengwu-early-group.webp", disposition: "migrate", use: "早期成员回访" },
  { id: "rented-room", path: "/archive/rented-room.webp", disposition: "migrate", use: "廉租房热点" },
  { id: "pellet-drum", path: "/archive/pellet-drum-detail.webp", disposition: "migrate", use: "杜彻入口" },
  { id: "duche-front", path: "/archive/du-che-childhood.webp", disposition: "migrate", use: "童年照片正面" },
  { id: "duche-back", path: "/archive/du-che-photo-back.webp", disposition: "migrate", use: "童年照片背字" },
  { id: "news-poster", path: "/archive/cemetery-newspaper.webp", disposition: "rewrite", use: "他山晚讯图像层" },
  { id: "stone-clean", path: "/archive/stone-head-evidence.webp", disposition: "migrate", use: "佛头七窍初始态" },
  { id: "stone-blood", path: "/archive/stone-head-evidence-blood.webp", disposition: "migrate", use: "佛头七窍完成态" },
  { id: "zoudi", path: "/archive/scattered/zoudi-guoji.html", disposition: "verbatim", use: "最终文学层" },
] as const;

export const LITERARY_REGISTRY = [
  { id: "juroutuanfei", publicTitle: "句肉抟飞", source: "憎恶社游戏全流程文本汇编", integrity: "verbatim", placement: "展览、人物、出版与嵌套小说" },
  { id: "mang", publicTitle: "目盲", source: "憎恶社游戏全流程文本汇编", integrity: "verbatim", placement: "加密文件夹中的图像诗稿与人物视角" },
  { id: "xiyan", publicTitle: "西岩大火", source: "憎恶社游戏全流程文本汇编", integrity: "verbatim", placement: "罪疚、梦境与地方文本" },
  { id: "mahe", publicTitle: "玛赫", source: "憎恶社游戏全流程文本汇编", integrity: "verbatim", placement: "编辑层与诗剧关联" },
  { id: "zoudi", publicTitle: "走地国记", source: "憎恶社游戏全流程文本汇编", integrity: "verbatim", placement: "画廊终局叙事补遗；不得改写或节选" },
] as const;

export const PROGRESS_RULES = [
  { event: "found_pellet_drum", outputs: ["杜彻人物档案", "他山晚讯", "回收站旧缓存"] },
  { event: "read_duche_photo_back", outputs: ["杜莉香人物词", "方晚录音线索"] },
  { event: "solved_wedding_photo", outputs: ["杜万琳与徐惠关系", "角色映射前置"] },
  { event: "verified_wang_poison", outputs: ["王克定自杀结论槽"] },
  { event: "verified_wang_staging", outputs: ["伪造投河现场结论槽"] },
  { event: "recovered_ledger_mail", outputs: ["公墓完整案卷", "杜莉香时间线"] },
  { event: "verified_lixiang_homicide", outputs: ["杜莉香他杀结论槽", "杜万琳临终录音"] },
  { event: "heard_duwanlin_confession", outputs: ["杜南阳责任边界", "《目盲》文件夹自动解锁资格"] },
  { event: "unlocked_final_folder", outputs: ["《目盲》图像诗稿（19个篇目、51张图像）"] },
  { event: "recovered_all_mang_manuscripts", outputs: ["《目盲》文件夹中的隐藏 TXT"] },
  { event: "opened_final_password_txt", outputs: ["最终 Word 文件口令"] },
  { event: "unlocked_final_word", outputs: ["终局链接"] },
] as const;

export type BrowserNode = {
  id: string;
  title: string;
  kind: string;
  summary: string;
  aliases: string[];
  requires?: string[];
  lockedHint?: string;
  discoverEvent?: string;
};

export const BROWSER_NODES: BrowserNode[] = [
  {
    id: "exhibition",
    title: "赭红门｜当期展览",
    kind: "展览网站",
    summary: "憎恶社二层主厅的当期展览；页面底部保留联合主办信息。",
    aliases: ["赭红门展览", "赭红门", "展览"],
    discoverEvent: "visited_exhibition",
  },
  {
    id: "shouxiang",
    title: "寿享陵园｜旧站镜像",
    kind: "机构网站",
    summary: "他山公墓改建后的陵园旧站，含人员、服务、墓形与来园路线。",
    aliases: ["寿享陵园", "他山公墓", "陵园"],
    requires: ["recovered_ledger_mail"],
    lockedHint: "公墓项目的账目线索尚未恢复。",
    discoverEvent: "visited_shouxiang",
  },
  {
    id: "publisher",
    title: "荷潜艇出版社",
    kind: "机构网站",
    summary: "一次资料恢复项目的委托方；旧版缓存连接杜彻、李司贰、叶是与《玛赫的厨房》。",
    aliases: ["荷潜艇出版社", "荷潜艇", "出版社"],
    discoverEvent: "visited_publisher",
  },
  {
    id: "ge-dongping",
    title: "葛东平｜人物档案",
    kind: "人物",
    summary: "《赭红门》相关人物；投诉记录提到展厅西南角原应悬挂的作品。",
    aliases: ["葛东平"],
    discoverEvent: "visited_ge_dongping",
  },
  {
    id: "xu-hui",
    title: "徐惠｜人物档案",
    kind: "人物",
    summary: "一张撕碎的婚纱照仍未完成归档。",
    aliases: ["徐惠"],
    discoverEvent: "visited_xu_hui",
  },
  {
    id: "society",
    title: "憎恶社｜早期成员缓存",
    kind: "旧站缓存",
    summary: "上世纪八十年代的社团合照与成员记录；回访内容可能发生变化。",
    aliases: ["憎恶社", "早期成员", "旧社团"],
    discoverEvent: "visited_society",
  },
  {
    id: "wang-keding",
    title: "王克定｜人物档案",
    kind: "人物",
    summary: "早期成员。长期存在精神问题，将艺术纯粹性视作生命原则。",
    aliases: ["王克定", "野生白鹭", "野生白鷺"],
    discoverEvent: "visited_wang_keding",
  },
  {
    id: "xing-wan",
    title: "邢万｜人物与居所记录",
    kind: "人物 / 地点",
    summary: "早期成员；西门车站附近廉租房的到访痕迹仍可检查。",
    aliases: ["邢万", "邢萬", "廉租房", "西门车站", "西门车站附近廉租房"],
    discoverEvent: "visited_xing_wan",
  },
  {
    id: "anonymous-xing",
    title: "刑某｜早期匿名新闻",
    kind: "地方旧闻",
    summary: "一则只保留匿名措辞的项目调查短讯。",
    aliases: ["刑某"],
    requires: ["found_pellet_drum"],
    lockedHint: "这条地方旧闻与一件儿童旧物有关。",
  },
  {
    id: "wang-autopsy",
    title: "王克定｜尸检与毒检摘要",
    kind: "证据",
    summary: "死亡时间、肺部征象、毒物、绳结与死后搬运痕迹。",
    aliases: ["尸检报告", "尸检", "投河", "王克定尸检"],
    requires: ["visited_wang_keding"],
    lockedHint: "先确认死者身份，再核对法医学材料。",
  },
  {
    id: "du-che",
    title: "杜彻｜家庭与出版档案",
    kind: "人物",
    summary: "杜万琳与徐惠之子；整理父亲手稿并核对旧案。",
    aliases: ["杜彻", "杜徹"],
    requires: ["found_pellet_drum"],
    lockedHint: "名字刻在廉租房里一件儿童旧物的手柄上。",
    discoverEvent: "visited_du_che",
  },
  {
    id: "evening-news",
    title: "他山晚讯｜公墓案早期报道",
    kind: "地方旧闻",
    summary: "千禧年前后的匿名报道；信息不全，只承担早期公开说法。",
    aliases: ["他山晚讯", "地方旧闻", "公墓案新闻"],
    requires: ["found_pellet_drum"],
    lockedHint: "先找到能解释杜彻童年的那件旧物。",
    discoverEvent: "read_evening_news",
  },
  {
    id: "du-lixiang",
    title: "杜莉香｜公开档案",
    kind: "人物 / 公开记录",
    summary: "杜万琳的堂妹，邢万的妻子。旧档案仍把她的死写作意外溺亡。",
    aliases: ["杜莉香", "莉香", "莉香溺水"],
    requires: ["read_duche_photo_back"],
    lockedHint: "先翻看杜彻童年照片的背面。",
    discoverEvent: "visited_du_lixiang",
  },
  {
    id: "cremation-form",
    title: "焚烧签字单｜代签记录",
    kind: "手续档案",
    summary: "无遗体告别仪式后留存的代签、收件与时间字段。",
    aliases: ["焚烧签字单", "签字单", "焚烧"],
    requires: ["visited_du_lixiang"],
    lockedHint: "先确认公开档案中的死者与家庭关系。",
    discoverEvent: "read_cremation_form",
  },
  {
    id: "fang-wan",
    title: "方晚｜人物与收件记录",
    kind: "人物",
    summary: "杜南阳同乡与旧友。签字单出现后，人物页会增加一份收件材料。",
    aliases: ["方晚", "方晩"],
    discoverEvent: "visited_fang_wan",
  },
  {
    id: "stone-head",
    title: "六十七尊佛头｜图像检查",
    kind: "物证 / 地点",
    summary: "西岩寺附近的断裂佛头；七窍仍可触碰。",
    aliases: ["西岩寺", "六十七尊佛头", "佛头", "石立人"],
    requires: ["read_cremation_form"],
    lockedHint: "一份遗体手续与寺院旧照互相指向。",
    discoverEvent: "visited_stone_head",
  },
  {
    id: "phoenix-reservoir",
    title: "凤凰水库｜河流路线",
    kind: "地点档案",
    summary: "从西岩寺后山通往水库的河流与运送路线。",
    aliases: ["凤凰水库", "水库", "河流路线"],
    requires: ["completed_seven_openings"],
    lockedHint: "地点写在七窍互动结束后掉落的纸条上。",
    discoverEvent: "visited_phoenix_reservoir",
  },
  {
    id: "cemetery-case",
    title: "他山地方公墓案｜核验档案",
    kind: "案件证据",
    summary: "项目账目、邮寄记录、遗体鉴定与逮捕报道的交叉档案。",
    aliases: ["他山地方公墓贪污案", "他山地方公墓案", "公墓贪污", "公墓案"],
    requires: ["recovered_ledger_mail", "read_cremation_form"],
    lockedHint: "还需要恢复杜莉香生前寄出的账目材料。",
    discoverEvent: "visited_cemetery_case",
  },
  {
    id: "alzheimer",
    title: "阿尔茨海默病｜医学删除页",
    kind: "文学档案",
    summary: "《刍味》与《刍胃》之间的一页标题修订记录。",
    aliases: ["阿尔茨海默病", "阿尔茨海默症", "阿尔兹海默症", "阿尔兹海默病", "阿兹海默症"],
    requires: ["visited_du_che"],
    lockedHint: "先从杜彻的文学索引辨认《刍味》。",
  },
  {
    id: "editor",
    title: "叶是｜编辑后台",
    kind: "受限页面",
    summary: "荷潜艇出版社的编辑缓存；账号与口令分散在书信和版权页中。",
    aliases: ["叶是", "叶主任", "editor_ys", "玛赫的厨房"],
    requires: ["visited_publisher", "visited_du_che"],
    lockedHint: "先核对出版社旧版缓存与杜彻的文学索引。",
  },
  {
    id: "yuanchang",
    title: "元昶／左君｜角色修订页",
    kind: "文学角色",
    summary: "法名与本名被合并为同一个小说角色。",
    aliases: ["元昶", "礼倒僧元昶", "左君"],
    requires: ["editor_verified"],
    lockedHint: "先进入编辑后台，核对人物年表修订。",
  },
];

export const TRASH_FILES = [
  {
    id: "site-cache",
    title: "他山晚讯_网页缓存.zip",
    meta: "删除时间不详 · 可直接恢复",
    requires: ["found_pellet_drum"],
    event: "recovered_news_cache",
  },
  {
    id: "family-photo",
    title: "童年合照_反面扫描.webp",
    meta: "旧照片 · 低清预览",
    requires: ["found_pellet_drum"],
    event: "recovered_family_photo",
  },
  {
    id: "chuannan-message",
    title: "锦蜀饭店_值班短讯.txt",
    meta: "未发送草稿 · 可直接恢复",
    requires: ["read_duche_photo_back"],
    event: "read_chuannan_message",
  },
  {
    id: "ledger-mail",
    title: "寄件记录_附件损坏.eml",
    meta: "寄件人：杜莉香 · 附件需核验",
    requires: ["read_cremation_form", "heard_fang_recording"],
    event: "recovered_ledger_mail",
    password: true,
  },
  {
    id: "unsent-note",
    title: "没有寄出的便笺.txt",
    meta: "方晚 · 保存于草稿箱",
    requires: ["read_chuannan_message"],
    event: "read_unsent_note",
  },
];

export const RECORDINGS = [
  {
    id: "editor-note",
    title: "编辑部恢复记录_01",
    duration: "01:12",
    requires: ["visited_publisher"],
    event: "heard_editor_note",
    transcript:
      "恢复项目来自杜彻留下的一台旧电脑。书信收件账号仍写作 editor_ys；《玛赫的厨房》首版年份为 2019。编辑说，口令沿用书名拼音首字母与年份的组合。",
  },
  {
    id: "fang-talk",
    title: "方晚与杜彻_谈话节录",
    duration: "04:36",
    requires: ["read_duche_photo_back", "read_cremation_form"],
    event: "heard_fang_recording",
    transcript:
      "方晚：她先是朋友，是老杜的妹妹。我承认我对她有过一点没说出口的爱意，到这里就停了。告别仪式没有遗体。我回到家，才收到她生前寄出的信和账目复印件。邮戳在她失踪以前，信在路上走了很多天。杜彻：所以她不是临时把你卷进来。方晚：她是把最后一份不会被邢万拿走的材料寄给了我。",
  },
  {
    id: "duwanlin-confession",
    title: "杜万琳_临终录音",
    duration: "06:18",
    requires: ["verified_lixiang_homicide", "recovered_ledger_mail"],
    event: "heard_duwanlin_confession",
    transcript:
      "杜万琳：莉香第一次拿账目来找我，我叫她不要把事情闹出去。我想到项目，想到憎恶社的名声，也想到邢万是旧朋友。我压下了那次举报。我不知道他会杀她，这不能替我的沉默开脱。后来方晚把信和账目给我看，我才知道她已经留了证据。王克定服毒以后，邢万动过尸体；莉香则死在邢万手里。前一件事我隐约知道，后一件事我从方晚和案卷里才拼完整。杜彻若找到这些手稿，让他把事实和我写下的梦分开。",
  },
];

export const HINTS = [
  {
    id: "start",
    done: ["visited_exhibition"],
    levels: ["先查看摆渡热搜里唯一能够打开的新闻。", "这条新闻讨论一幅被撤下的临展画作。", "在摆渡热搜中打开“临展画作遭撤，艺术家生存环境堪忧”。"],
  },
  {
    id: "public-identities",
    done: ["solved_wedding_photo", "visited_wang_keding"],
    levels: ["从展览的人名与旧社团关系继续查找。", "葛东平的投诉、徐惠的照片和早期成员缓存互相连接。", "打开画廊导航中的“人物”和“关于”，依次查看葛东平、徐惠、憎恶社与王克定。"],
  },
  {
    id: "wang-scene",
    done: ["verified_wang_poison", "verified_wang_staging", "found_pellet_drum"],
    levels: ["王克定的档案需要与一个居所和法医学材料交叉核对。", "检查人物目录里的邢万居所与新闻目录里的法医学材料。", "打开“邢万｜人物与居所记录”和“王克定｜尸检与毒检摘要”，完成两项判断。"],
  },
  {
    id: "duche-family",
    done: ["read_duche_photo_back", "read_cremation_form"],
    levels: ["儿童旧物打开了一段家庭关系。", "翻看杜彻童年照背面，再到画廊目录核对完整姓名与遗体手续。", "在“人物”中打开杜彻与杜莉香，再到“新闻”中查看焚烧签字单。"],
  },
  {
    id: "ledger",
    done: ["heard_fang_recording", "recovered_ledger_mail"],
    levels: ["回收站里的损坏邮件需要一段证言。", "在录音中核对收件人和邮戳先后，再回收附件。", "听“方晚与杜彻”，用“方晚”和项目编号“SX-2000-17”恢复邮件。"],
  },
  {
    id: "lixiang-truth",
    done: ["verified_lixiang_homicide", "heard_duwanlin_confession"],
    levels: ["公开溺亡说法需要与项目案卷和临终录音核对。", "账目、颈部损伤、藏尸环境与供述应互相印证。", "打开“他山地方公墓案”，选择他杀结论；随后听杜万琳临终录音。"],
  },
  {
    id: "mang-folder",
    done: ["opened_mang_archive"],
    levels: ["案件证据链与关键录音已经让加密文件夹自动解锁。", "加密文件夹位于桌面，里面保存《目盲》的完整图像诗稿。", "直接打开桌面的“上锁文件夹”；不再需要额外验证。"],
  },
  {
    id: "mang-manuscripts",
    done: ["recovered_all_mang_manuscripts"],
    levels: ["文件夹已经开放，但最终口令文件尚未出现。", "继续画廊内的诗稿恢复流程，完成《始末的碎点》后寻找与当前展览同名的结诗。", "在画廊中搜索“赭红门”，完成第 14 / 14 份诗稿。"],
  },
  {
    id: "password-file",
    done: ["opened_final_password_txt"],
    levels: ["全部诗稿完成后，加密文件夹的目录会发生变化。", "回到桌面的“上锁文件夹”，寻找新出现的半透明 TXT 文件。", "打开隐藏文件“mang-index.txt”，读取其中的完整字符串。"],
  },
  {
    id: "final-word",
    done: ["opened_final_password_txt", "unlocked_final_word"],
    levels: ["隐藏 TXT 中的字符串对应桌面上的一个文档。", "关闭或最小化文件夹，打开桌面的“最终文件.doc”。", "将 TXT 中的字符串完整输入 Word 密码框。"],
  },
];

export function hasAll(events: string[], requirements: string[] = []) {
  return requirements.every((event) => events.includes(event));
}

export function normalizeSearch(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[《》〈〉【】\[\]（）()，,。.!！?？·—_\s]/g, "")
    .replace(/[×＊*]/g, "x");
}

function distance(a: string, b: string) {
  const rows = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i += 1) {
    let previous = rows[0];
    rows[0] = i;
    for (let j = 1; j <= b.length; j += 1) {
      const saved = rows[j];
      rows[j] = Math.min(rows[j] + 1, rows[j - 1] + 1, previous + (a[i - 1] === b[j - 1] ? 0 : 1));
      previous = saved;
    }
  }
  return rows[b.length];
}

export function searchNodes(query: string) {
  const q = normalizeSearch(query);
  if (!q) return [];
  return BROWSER_NODES.filter((node) =>
    node.aliases.some((alias) => {
      const normalized = normalizeSearch(alias);
      return normalized === q || normalized.includes(q) || q.includes(normalized) || (q.length >= 3 && distance(normalized, q) <= 2);
    }),
  );
}
