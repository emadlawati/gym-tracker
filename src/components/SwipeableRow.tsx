"use client";

import { useState, useRef } from "react";

interface Props {
  onDelete: () => void;
  children: React.ReactNode;
}

export default function SwipeableRow({ onDelete, children }: Props) {
  const [translateX, setTranslateX] = useState(0);
  const [dragging, setDragging] = useState(false);
  const startX = useRef(0);
  const currentX = useRef(0);
  const swiped = useRef(false);

  function onStart(clientX: number) {
    startX.current = clientX;
    currentX.current = 0;
    swiped.current = false;
    setDragging(true);
  }

  function onMove(clientX: number) {
    if (!dragging) return;
    const diff = clientX - startX.current;
    currentX.current = diff;
    if (diff < -10) swiped.current = true;
    if (diff < 0) {
      setTranslateX(Math.max(diff, -88));
    } else if (translateX !== 0) {
      setTranslateX(0);
    }
  }

  function onEnd() {
    setDragging(false);
    if (currentX.current < -40) {
      setTranslateX(-88);
    } else {
      setTranslateX(0);
    }
  }

  const open = translateX < -40;

  return (
    <div className="relative overflow-hidden rounded-lg">
      <button
        onClick={() => { onDelete(); setTranslateX(0); }}
        aria-hidden={!open}
        tabIndex={open ? 0 : -1}
        className="absolute right-0 top-0 bottom-0 w-[88px] bg-red-600 text-white text-xs font-bold flex items-center justify-center"
      >
        Delete
      </button>
      <div
        onTouchStart={(e) => onStart(e.touches[0].clientX)}
        onTouchMove={(e) => onMove(e.touches[0].clientX)}
        onTouchEnd={onEnd}
        onMouseDown={(e) => onStart(e.clientX)}
        onMouseMove={(e) => { if (e.buttons === 1) onMove(e.clientX); }}
        onMouseUp={onEnd}
        onMouseLeave={onEnd}
        onClickCapture={(e) => {
          if (swiped.current || open) {
            e.preventDefault();
            e.stopPropagation();
            if (!swiped.current && open) setTranslateX(0);
          }
        }}
        style={{
          transform: `translateX(${translateX}px)`,
          transition: dragging ? "none" : "transform 0.25s cubic-bezier(0.22, 1, 0.36, 1)",
        }}
      >
        {children}
      </div>
    </div>
  );
}
