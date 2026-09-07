"use client";

import { useState } from "react";

export const INITIAL_WEDDING_TILES = [4, 0, 7, 2, 8, 1, 6, 3, 5];

export function swapPhotoTiles(tiles: number[], from: number, to: number) {
  if (from < 0 || from > 8 || to < 0 || to > 8 || from === to) return tiles;
  const next = [...tiles];
  [next[from], next[to]] = [next[to], next[from]];
  return next;
}

export function isWeddingPhotoComplete(tiles: number[]) {
  return tiles.length === 9 && tiles.every((tile, index) => tile === index);
}

export function FamilyPhoto({ front, back, onRead }: { front: string; back: string; onRead: () => void }) {
  const [flipped, setFlipped] = useState(false);
  return <figure className="family-snapshot">
    <link rel="preload" as="image" href={back} />
    <button type="button" className="archive-photo-button" aria-label={flipped ? "翻回合照正面" : "翻看照片背面"} aria-pressed={flipped} onClick={() => {
      if (!flipped) onRead();
      setFlipped(!flipped);
    }}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={flipped ? back : front} alt={flipped ? "照片背面，孩子的字迹：我和爸爸妈妈还有姑姑莉香。" : "年幼的杜彻与父母、姑姑的四人合照"} />
    </button>
    <figcaption>{flipped ? "点击照片，翻回正面" : "点击照片，看看背面"}</figcaption>
  </figure>;
}

export function WeddingPhotoPuzzle({ image, tiles, solved, onChange }: { image: string; tiles: number[]; solved: boolean; onChange: (next: number[]) => void }) {
  const [selected, setSelected] = useState<number | null>(null);
  function exchange(from: number, to: number) {
    if (!solved) onChange(swapPhotoTiles(tiles, from, to));
    setSelected(null);
  }
  return <section className="wedding-puzzle" aria-label="徐惠的婚纱照拼图">
    <p className="photo-instruction" aria-live="polite">{solved ? "照片已经拼合。" : selected === null ? "依次点选两块碎片，交换位置；也可以拖动。" : "已选中一块碎片，点选另一块与它交换。"}</p>
    <div className={`wedding-puzzle-board${solved ? " is-complete" : ""}`}>
      {solved ? <>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img className="wedding-complete-photo" src={image} alt="拼合完整的婚纱照" />
        <p className="wedding-name-reveal" role="status">杜万琳和徐惠</p>
      </> : tiles.map((tile, slot) => <button key={slot} type="button" className={`wedding-photo-piece${selected === slot ? " is-selected" : ""}`} aria-label={`第${slot + 1}格照片碎片`} aria-pressed={selected === slot} draggable
        onClick={() => selected === null ? setSelected(slot) : exchange(selected, slot)}
        onDragStart={(event) => { event.dataTransfer.setData("text/plain", String(slot)); event.dataTransfer.effectAllowed = "move"; setSelected(slot); }}
        onDragOver={(event) => event.preventDefault()}
        onDrop={(event) => { event.preventDefault(); const value = event.dataTransfer.getData("text/plain"); if (/^[0-8]$/.test(value)) exchange(Number(value), slot); }}
        onDragEnd={() => setSelected(null)}
      ><span style={{ backgroundImage: `url("${image}")`, backgroundPosition: `${(tile % 3) * 50}% ${Math.floor(tile / 3) * 50}%` }} /></button>)}
    </div>
  </section>;
}

export function ShopPhoto({ original, changed }: { original: string; changed: string }) {
  const [revealed, setRevealed] = useState(false);
  return <><link rel="preload" as="image" href={changed} /><button type="button" className="archive-photo-button shop-photo-button" aria-label={revealed ? "再看一眼橱窗" : "查看橱窗中的人影"} aria-pressed={revealed} onClick={() => setRevealed(!revealed)}>
    {/* eslint-disable-next-line @next/next/no-img-element */}
    <img src={revealed ? changed : original} alt={revealed ? "东兴彼得的橱窗里，一个男人单手遮住半张脸" : "东兴彼得的橱窗里，塑料模特站在内衣柜台旁"} />
    <span className="shop-photo-hint">点击照片</span>
  </button></>;
}
