"use client";
import { useEffect, useState } from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from "@/components/ui/accordion";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";

const STAFF = [
  { name: "陈守安", role: "园务主管", duty: "公共区域与值班安排", detail: "负责步道巡查、雨季排水和节日值班。平时随身带一本巡园记录，遇到损坏的路牌会先记下位置，再交给维护组。", hours: "周一至周五 08:30—16:30" },
  { name: "林素贞", role: "服务接待", duty: "来访登记与物品借用", detail: "在南门服务室接待来访家属，协助查询园区位置，并管理轮椅、雨伞和手推车。借用物品请在离园前归还原处。", hours: "每日 08:00—17:00" },
  { name: "周树平", role: "绿化养护", duty: "树木、草坪与花坛", detail: "负责松柏修枝与草坪养护。新栽区域会拉起矮绳，浇水后的石阶较滑，请沿干燥步道通行。", hours: "周一至周六 07:30—15:30" },
  { name: "许明川", role: "设施维护", duty: "照明、水管与无障碍设施", detail: "定期检查廊灯、水龙头和扶手。园内发现设施损坏，可到服务室填写维修登记，注明附近的分区牌号。", hours: "周二至周日 08:30—16:30" },
  { name: "杜彻", role: "投资人", duty: "无", detail: "", hours: "" },
];
const SERVICES = [
  { id: "visit", title: "祭扫与来访", text: "园区白天开放。鲜花可带入，包装纸请放进步道旁的分类箱。雨天石阶湿滑，建议穿平底鞋。临近闭园时，值班员会沿主路提醒来访者。" },
  { id: "borrow", title: "便民用品借用", text: "南门服务室备有轮椅、雨伞和小型手推车。请向接待人员说明使用需要，并在离园前归还；轮椅可沿西侧缓坡进入各区。" },
  { id: "flowers", title: "鲜花摆放与日常整理", text: "需协助摆放鲜花或清理落叶，可在接待处登记所在分区。工作人员只整理公共通行范围，纪念物品的移动须由家属确认。" },
  { id: "stone", title: "碑面维护咨询", text: "碑面清洁以清水和软布为宜。文字补色、石材松动等事项可先登记，由维护人员查看后说明处理方式，请勿自行使用强酸清洁剂。" },
];
const GRAVES = [
  { id: "upright", name: "松庭式 · 立碑", position: "图左", material: "浅灰花岗岩", shape: "直立碑面，配矮石基座", text: "碑面纵向排列文字，周围留有鲜花摆放位置。设于松庭区平缓台地，沿主路可到。" },
  { id: "sloped", name: "静岚式 · 斜碑", position: "图中", material: "深灰抛光石材", shape: "低矮斜面，横向碑身", text: "碑面微倾，文字与周围绿篱保持较低的视线高度。设于静岚区，步道旁有供停留的长椅。" },
  { id: "lawn", name: "归草式 · 草坪碑", position: "图右", material: "灰色石材嵌板", shape: "平卧铭牌，与草地相接", text: "铭牌沿草坪排列，整体平缓。鲜花置于指定位置，养护期间请沿石板路行走，避免踩踏新铺草皮。" },
];
export function ShouxiangPage({ imageUrl, reducedMotion = false }: { imageUrl: string; reducedMotion?: boolean }) {
  const [staff, setStaff] = useState<(typeof STAFF)[number] | null>(null);
  const [curseOpen, setCurseOpen] = useState(false);
  const [curseCount, setCurseCount] = useState(1);
  useEffect(() => {
    if (!curseOpen) return;
    const timer = window.setInterval(() => setCurseCount((count) => Math.min(180, count + Math.max(1, Math.ceil(count / 4)))), 300);
    return () => window.clearInterval(timer);
  }, [curseOpen]);
  return <article className="old-web-page shouxiang-interactive">
    <div className="old-browser-bar"><span>网页存档</span><code>http://shouxiang.invalid/staff/index.htm</code><b>旧版栏目存档</b></div>
    <header className="old-site-head"><div className="old-word-seal" aria-hidden="true">寿享</div><div><h1>寿享陵园</h1><p>让思念有处安放</p></div><span>园务公开 · 服务指南</span></header>
    <div className="old-marquee">园务通知：雨后请慢行。南门服务室备有雨伞与轮椅，可向值班人员借用。</div>
    <Tabs defaultValue="staff" className="cemetery-tabs">
      <TabsList className="cemetery-nav" aria-label="陵园栏目"><TabsTrigger value="staff">管理人员</TabsTrigger><TabsTrigger value="services">园区服务</TabsTrigger><TabsTrigger value="graves">墓形展示</TabsTrigger><TabsTrigger value="directions">来园路线</TabsTrigger></TabsList>
      <TabsContent value="staff" className="cemetery-panel"><h2>工作人员名录</h2><p>点击姓名查看分工与接待安排。</p>
        <div className="cemetery-table-scroll"><table><thead><tr><th>姓名</th><th>职务</th><th>工作内容</th></tr></thead><tbody>{STAFF.map((person) => <tr key={person.name}><th scope="row"><button type="button" onClick={() => { if (person.name === "杜彻") { setCurseCount(1); setCurseOpen(true); } else setStaff(person); }}>{person.name}</button></th><td>{person.role}</td><td>{person.duty}</td></tr>)}</tbody></table></div>
      </TabsContent>
      <TabsContent value="services" className="cemetery-panel"><h2>园区服务</h2><p>接待时间 08:00—17:00；临时调整以南门公告栏为准。</p><Accordion type="single" collapsible>{SERVICES.map((service) => <AccordionItem key={service.id} value={service.id}><AccordionTrigger>{service.title}</AccordionTrigger><AccordionContent><p>{service.text}</p></AccordionContent></AccordionItem>)}</Accordion></TabsContent>
      <TabsContent value="graves" className="cemetery-panel"><h2>墓形展示</h2><p>园区样式图录 · 选择下方名称查看说明。</p>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img className="cemetery-catalog-image" src={imageUrl} width={1200} height={800} alt="园林中的三种空白墓碑样式：左侧立碑、中间斜碑、右侧草坪碑" loading="lazy" />
        <Tabs defaultValue="upright" className="cemetery-subtabs"><TabsList aria-label="选择墓形">{GRAVES.map((grave) => <TabsTrigger value={grave.id} key={grave.id}>{grave.name}</TabsTrigger>)}</TabsList>{GRAVES.map((grave) => <TabsContent value={grave.id} key={grave.id}><h3>{grave.name}</h3><p>{grave.position} · {grave.material} · {grave.shape}</p><p>{grave.text}</p></TabsContent>)}</Tabs>
      </TabsContent>
      <TabsContent value="directions" className="cemetery-panel"><h2>来园路线</h2><p>园址：他山市北郊青松路尽头。南门为来访入口，北侧通道仅供园务车辆使用。</p>
        <Tabs defaultValue="bus" className="cemetery-subtabs"><TabsList aria-label="选择交通方式"><TabsTrigger value="bus">乘车来园</TabsTrigger><TabsTrigger value="car">自驾来园</TabsTrigger><TabsTrigger value="accessible">无障碍路线</TabsTrigger></TabsList>
          <TabsContent value="bus"><h3>从城北客运站出发</h3><ol><li>在站前广场乘园区方向的郊线车。</li><li>到“青松路口”下车，沿路旁步道向北步行。</li><li>经过石桥后左转，至南门服务室登记问询。</li></ol><p>末班车时间请在出发前向站内值班人员确认。</p></TabsContent>
          <TabsContent value="car"><h3>经北环路进入青松路</h3><ol><li>沿北环路行至青松路口，按园区指示转入。</li><li>过石桥后进入南门外访客停车区。</li><li>步行穿过门廊即可到达服务室，请勿将车辆停在消防通道。</li></ol></TabsContent>
          <TabsContent value="accessible"><h3>南门西侧缓坡</h3><ol><li>在南门服务室借用轮椅，或请值班员指路。</li><li>沿门廊西侧缓坡进入主路，避开中央石阶。</li><li>顺主路可抵松庭、静岚及归草三处区域，途中设休息座椅。</li></ol></TabsContent>
        </Tabs>
      </TabsContent>
    </Tabs>
    <Dialog open={staff !== null} onOpenChange={(open) => { if (!open) setStaff(null); }}><DialogContent className="cemetery-person-dialog"><DialogHeader><DialogTitle>{staff?.name}</DialogTitle><DialogDescription>{staff?.role} · {staff?.duty}</DialogDescription></DialogHeader><p>{staff?.detail}</p><p>{staff?.hours}</p></DialogContent></Dialog>
    <Dialog open={curseOpen} onOpenChange={setCurseOpen}><DialogContent className={`cemetery-curse-dialog${reducedMotion ? " motion-quiet" : ""}`}>
      <DialogHeader className="sr-only"><DialogTitle>杜彻</DialogTitle><DialogDescription>红色的“去死”逐渐填满画面。按 Escape 或关闭按钮返回。</DialogDescription></DialogHeader>
      <div className="cemetery-curse-field" aria-hidden="true">{Array.from({ length: curseCount }, (_, index) => <span key={index} style={{ left: `${(index * 37 + 43) % 94}%`, top: `${(index * 53 + 42) % 91}%`, fontSize: `${1.3 + (index % 7) * 0.7}rem`, transform: `rotate(${(index * 17) % 35 - 17}deg)` }}>去死</span>)}</div>
    </DialogContent></Dialog>
    <footer className="old-site-foot">Copyright 20— 寿享陵园 · 虚构旧站存档；所列地点、人员与路线属于游戏内容。</footer>
  </article>;
}
