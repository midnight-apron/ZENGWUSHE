import { JUROUTUANFEI_TEXT, type JuroutuanfeiTextBlock } from "./juroutuanfei-text";

// The uploaded transcription remains untouched. These boundaries repair page/line
// breaks in its prose; scene headings, dialogue turns and source order stay intact.
const JOIN_RANGES = [
  [12, 13], [14, 15], [16, 17], [23, 24], [32, 33], [47, 49], [68, 69], [81, 83],
  [91, 92], [101, 102], [104, 105], [106, 108], [110, 111], [115, 116], [117, 118],
  [127, 128], [134, 135], [136, 137], [144, 145], [146, 157], [162, 163], [181, 182],
  [197, 198], [208, 209], [211, 212], [220, 221], [258, 259], [261, 262],
  [266, 267], [269, 270], [272, 273], [279, 280], [291, 292],
];

export function cleanManuscriptSpacing(text: string) {
  return text.trim()
    .replace(/[ \t]{2,}/g, " ")
    .replace(/(?<=[\u3400-\u9fff，。！？、；：“”‘’（）《》——…])\s+(?=[\u3400-\u9fff，。！？、；：“”‘’（）《》——…])/gu, "")
    .replace(/([AZ])\s+(区|城)/g, "$1$2")
    .replace(/a4\s+文件/gi, "A4文件")
    .replace(/3dm×\s+3dm/g, "3dm×3dm")
    .replace(/\s*([,?!:])\s*/g, (_, mark: string) => ({ ",": "，", "?": "？", "!": "！", ":": "：" }[mark]!))
    .replace(/\(/g, "（").replace(/\)/g, "）")
    .replace(/"+/g, "”")
    .replace(/\s+”/g, "”")
    .replace(/·(?:\s*·){2,}/g, "……")
    .replace(/(?<!…)…(?!…)/g, "……");
}

const PARAGRAPH_EDITS: Record<number, string[]> = {
  20: ["“你看着比照片里胖太多了。”他说，“写诗的人不该有这种油水。”"],
  23: ["一包红塔山，他捏着卷纸一头，一边摸火机给我点着。", "“这次是邀请去做作品讲解，就六月发你的那个。”", "“白芍肉？”"],
  32: ["主展厅围了一层接待怠慢的来展艺术家，我们当然也该忝列其中，他领着我绕进会场里。沿着布置好的作品一件件排查。他确信属于自己手笔那副也在这。", "“主办方开始沟通时没有和你说明你作品的布置情况么？”"],
  63: ["《箱庭植物三种》\n作者：XXX"],
  104: ["平衡不住凉爽和伤身之间的分寸，只顾咳嗽。明了这段咳与咳间夹杂着非实质性的事物：秋天确有来到。"],
  146: [
    "直到在副驾制造一啐鼾声让她安心，更明显的意图是令她意会关掉车载电台。乡道信号奇差，FM96.7被拆成两段，前一段明晰，后段重复挟夹玻璃渣。干燥掌把方向盘，喝水时喉头如同割伤。闭眼，月色透过林间驳落，通圆离车太远，光到眼底仍是长距离。夜云环抱，模糊它形状的黑色已经辨认不出是树影还是电缆。",
    "其余色泽像肉化开，凝脂通体粉蹿上下层。东石乡的新抓的黑猪肉作肴，能吃上好几顿，精瘦带肥香两段。这年头养殖户要加个“谷饲”在前面，强调说没喂饲料。它总归香是香的一种，却几时入水泡得口感啃叽。",
    "猪脸庞肉劲足抵狠，终是如此。他脸颊亦是愣愣角角，法相超脱，脸一侧是青蛙般仁慈。",
  ],
  190: ["李司贰\n20XX.2.20"],
};

export const JUROUTUANFEI_READING_TEXT: JuroutuanfeiTextBlock[] = [];
for (let index = 10; index < JUROUTUANFEI_TEXT.length; index++) {
  const first = JUROUTUANFEI_TEXT[index];
  const end = JOIN_RANGES.find(([start]) => start === index)?.[1] ?? index;
  const joined = cleanManuscriptSpacing(JUROUTUANFEI_TEXT.slice(index, end + 1).map((block) => block.text).join(""));
  let paragraphs = PARAGRAPH_EDITS[index] ?? [joined];
  if (index === 95) paragraphs = joined.split(/(?=四人当中|他高中)/);
  // This speech is unfinished in the supplied source. Mark the interruption,
  // without inventing the missing words or merging it into the next speaker.
  if (index === 296) paragraphs = [joined + "——”"];
  paragraphs.forEach((text) => JUROUTUANFEI_READING_TEXT.push({ ...first, sourceIndex: JUROUTUANFEI_READING_TEXT.length, text }));
  index = end;
}

export function getReadingChapter(number: number) {
  const starts = JUROUTUANFEI_READING_TEXT.flatMap((block, index) => block.kind === "section" ? [index] : []);
  return JUROUTUANFEI_READING_TEXT.slice(starts[number - 1], starts[number] ?? JUROUTUANFEI_READING_TEXT.length);
}

export const OPENING_EPIGRAPH = "荆州街子葛清，勇不肤挠，自颈以下，遍刺白居易舍人诗。成式尝与荆客陈至呼观之，令其自解，背上亦能暗记。反手指其剖处，至“不是此花偏爱菊”，则有一人持杯临菊丛。又“黄夹缬林寒有叶”，则指一树，树上挂缬，缬窠锁胜绝细。凡刻三十余首，体无完肤，陈至呼为白舍人行诗图也。";
export const OPENING_ATTRIBUTION = "——唐·段成式《酉阳杂俎·前集》卷八";
export const OPENING_DEDICATION = "献给玛赫、L 和杜彻";
