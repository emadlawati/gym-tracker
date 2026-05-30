"use client";

import { useState, useRef } from "react";

interface Props {
  onDelete: () => void;
  children: React.ReactNode;
}

export default function SwipeableRow({ onDelete, children }: Props) {
  const [translateX, setTranslateX] = useState(0);
  const [showDelete, setShowDelete] = useState(false);
  const startX = useRef(0);
  const currentX = useRef(0);

  function onStart(clientX: number) {
    startX.current = clientX;
    currentX.current = 0;
  }

  function onMove(clientX: number) {
    const diff = clientX - startX.current;
    currentX.current = diff;
    if (diff < 0) {
      setTranslateX(Math.max(diff, -80));
      setShowDelete(diff < -40);
    }
  }

  function onEnd() {
    if (currentX.current < -40) {
      setTranslateX(-80);
      setShowDelete(true);
    } else {
      setTranslateX(0);
      setShowDelete(false);
    }
  }

  return (
    <div className="relative overflow-hidden rounded-lg">
      {showDelete && (
        <button
          onClick={onDelete}
          className="absolute right-0 top-0 bottom-0 w-20 bg-red-600 text-white text-xs font-bold flex items-center justify-center"
        >
          Delete
        </button>
      )}
      <div
        onTouchStart={(e) => onStart(e.touches[0].clientX)}
        onTouchMove={(e) => onMove(e.touches[0].clientX)}
        onTouchEnd={onEnd}
        onMouseDown={(e) => onStart(e.clientX)}
        onMouseMove={(e) => { if (e.buttons === 1) onMove(e.clientX); }}
        onMouseUp={onEnd}
        onMouseLeave={onEnd}
        style={{ transform: `translateX(${translateX}px)`, transition: "transform 0.2s ease-out" }}
      >
        {children}
      </div>
    </div>
  );
}
