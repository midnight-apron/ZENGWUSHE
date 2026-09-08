"use client";

import { useEffect, useRef, useState } from "react";
import { OPENING_EPIGRAPH, OPENING_ATTRIBUTION, OPENING_DEDICATION } from "./juroutuanfei-layout";

export const OPENING_STORAGE_KEY = "zengwu-she-opening-v1";
export function nextOpeningStage(stage: number) { return Math.min(stage + 1, 2); }

export function OpeningPrologue({ onActiveChange, onComplete }: { onActiveChange: (active: boolean) => void; onComplete: () => void }) {
  const [stage, setStage] = useState<number | null>(null);
  const surface = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    let completed = false;
    try { completed = window.localStorage.getItem(OPENING_STORAGE_KEY) === "complete"; } catch { /* Reading is still available without storage. */ }
    const initialize = window.setTimeout(() => {
      setStage(completed ? 2 : 0);
      onActiveChange(!completed);
    }, 0);
    return () => window.clearTimeout(initialize);
  }, [onActiveChange]);
  useEffect(() => {
    if (stage === 2) return;
    const oldOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    surface.current?.focus();
    return () => { document.body.style.overflow = oldOverflow; };
  }, [stage]);
  if (stage === 2) return null;
  function advance() {
    if (stage === null) return;
    const next = nextOpeningStage(stage);
    setStage(next);
    if (next === 2) {
      try { window.localStorage.setItem(OPENING_STORAGE_KEY, "complete"); } catch { /* Completion still works for this visit. */ }
      onActiveChange(false);
      onComplete();
    }
  }
  return <div className="opening-prologue" role="dialog" aria-modal="true" aria-label="开场">
    <button ref={surface} type="button" className={`opening-prologue-surface${stage === 1 ? " is-dedication" : ""}`} onClick={advance} disabled={stage === null} aria-label={stage === 1 ? "读完献词，进入首页" : "读完题记，继续"}>
      {stage === 0 && <span className="opening-epigraph"><span>{OPENING_EPIGRAPH}</span><span className="opening-attribution">{OPENING_ATTRIBUTION}</span></span>}
      {stage === 1 && <span className="opening-dedication">{OPENING_DEDICATION}</span>}
      {stage !== null && <span className="opening-continue">点击继续</span>}
    </button>
  </div>;
}
