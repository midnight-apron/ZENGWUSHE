"use client";

import { useEffect } from "react";

// Coordinates refer to the uncropped archival photograph, including the far ear's visible edge.
const OPENINGS = [
  { name: "右眼", x: 51.4, y: 45.3, width: 9, height: 7 },
  { name: "左眼", x: 63.5, y: 45.3, width: 7, height: 7 },
  { name: "右耳", x: 34.7, y: 54, width: 8, height: 13 },
  { name: "左耳", x: 66.4, y: 55, width: 5, height: 14 },
  { name: "右鼻孔", x: 58, y: 54.7, width: 4, height: 6 },
  { name: "左鼻孔", x: 61.6, y: 54.7, width: 3.2, height: 6 },
  { name: "口", x: 59.3, y: 61.4, width: 9, height: 7 },
];

export function inspectStoneOpening(mask: number, opening: number) {
  return Number.isInteger(opening) && opening >= 0 && opening < 7 ? mask | (1 << opening) : mask;
}

export function StoneInspection({ openings, completed, reducedMotion, cleanImage, bloodImage, onInspect, onRevealComplete }: {
  openings: number; completed: boolean; reducedMotion: boolean; cleanImage: string; bloodImage: string;
  onInspect: (opening: number) => void; onRevealComplete: () => void;
}) {
  const bleeding = completed || openings === 127;
  useEffect(() => {
    if (!bleeding || completed) return;
    const timer = window.setTimeout(onRevealComplete, reducedMotion ? 400 : 2400);
    return () => window.clearTimeout(timer);
  }, [bleeding, completed, reducedMotion, onRevealComplete]);

  return <section className={`stone-inspection stone-seven${bleeding ? " is-complete" : ""}${reducedMotion ? " motion-quiet" : ""}`}>
    <h2>图像检查</h2>
    <div className="stone-image-stage">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img className="stone-image-clean" src={cleanImage} alt="断裂石质佛头；可触碰双眼、双耳、两个鼻孔与嘴" />
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img className="stone-image-blood" src={bloodImage} alt="" aria-hidden="true" />
      <div className="stone-hotspots">
        {OPENINGS.map((opening, index) => <button key={opening.name} type="button"
          className={`stone-opening${openings & (1 << index) ? " is-touched" : ""}`}
          style={{ left: `${opening.x}%`, top: `${opening.y}%`, width: `${opening.width}%`, height: `${opening.height}%` }}
          aria-label={opening.name} aria-pressed={Boolean(openings & (1 << index)) || completed}
          disabled={bleeding} onClick={() => onInspect(index)} />)}
      </div>
      {completed && <div className="stone-fallen-note" role="status"><span>凤凰水库</span></div>}
    </div>
    <p className="stone-seven-hint">“七窍”是指人体头面部具有七个孔洞的解剖结构。具体构成为：眼：左右各一，共两个。耳：左右各一，共两个。鼻：左右鼻孔，共两个。口：虽然内部包含舌，但在计数时合为一个窍。</p>
  </section>;
}
