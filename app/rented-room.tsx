"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

export function RentedRoom({ image, drumImage, drumRead, onReadDrum, onOpenFamily }: {
  image: string; drumImage: string; drumRead: boolean; onReadDrum: () => void; onOpenFamily: () => void;
}) {
  const [message, setMessage] = useState("");
  const [detailOpen, setDetailOpen] = useState(false);
  const [ashtrayRead, setAshtrayRead] = useState(false);
  return <section className="rented-room">
    <div className="rented-room-scene">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={image} alt="西门车站附近的一间旧廉租房，桌上有烟灰缸，地上散落着拨浪鼓" />
      <button type="button" className="room-background" aria-label="查看房间" onClick={() => setMessage("似乎是王克定的房间")} />
      <button type="button" className={`room-object room-ashtray${ashtrayRead ? " is-read" : ""}`} aria-label="查看桌上的烟灰缸" onClick={() => { setAshtrayRead(true); setMessage("邢万已经来过了"); }} />
      <button type="button" className={`room-object room-drum${drumRead ? " is-read" : ""}`} aria-label="查看地上的拨浪鼓" onClick={() => { setDetailOpen(true); onReadDrum(); }} />
    </div>
    <p className="room-observation" role="status">{message}</p>
    <Dialog open={detailOpen} onOpenChange={setDetailOpen}><DialogContent className="drum-detail-dialog" aria-describedby={undefined}>
      <DialogHeader><DialogTitle>拨浪鼓</DialogTitle></DialogHeader>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={drumImage} alt="旧拨浪鼓的细节，手柄抓握处刻着“杜彻”两个字" />
      <p>手柄握处，刻着：杜彻。</p>
      {drumRead && <button className="independent-text-link" type="button" onClick={() => { setDetailOpen(false); onOpenFamily(); }}><b>杜彻 · 家属记录</b><small>查看人物档案</small></button>}
    </DialogContent></Dialog>
  </section>;
}
