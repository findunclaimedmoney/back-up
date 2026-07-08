import React, { useState, useRef, useCallback } from "react";
import { Loader2, ChevronDown } from "lucide-react";

const THRESHOLD = 70;
const MAX_PULL = 100;

export default function PullToRefresh({ onRefresh, children }) {
  const [pullDistance, setPullDistance] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const startY = useRef(0);
  const pulling = useRef(false);

  const onTouchStart = useCallback(
    (e) => {
      if (window.scrollY > 0 || refreshing) return;
      startY.current = e.touches[0].clientY;
      pulling.current = true;
    },
    [refreshing]
  );

  const onTouchMove = useCallback(
    (e) => {
      if (!pulling.current || refreshing) return;
      const delta = e.touches[0].clientY - startY.current;
      if (delta <= 0) return;
      const resisted = Math.min(delta * 0.5, MAX_PULL);
      setPullDistance(resisted);
    },
    [refreshing]
  );

  const onTouchEnd = useCallback(async () => {
    if (!pulling.current) return;
    pulling.current = false;
    if (pullDistance >= THRESHOLD) {
      setRefreshing(true);
      setPullDistance(THRESHOLD);
      try {
        await onRefresh();
      } catch (err) {
        console.error(err);
      } finally {
        setRefreshing(false);
        setPullDistance(0);
      }
    } else {
      setPullDistance(0);
    }
  }, [pullDistance, onRefresh, refreshing]);

  return (
    <div
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
    >
      <div
        className="flex items-center justify-center overflow-hidden"
        style={{
          height: pullDistance,
          opacity: pullDistance / THRESHOLD,
        }}
      >
        {refreshing ? (
          <Loader2 className="w-5 h-5 text-primary animate-spin" />
        ) : (
          <ChevronDown
            className="w-5 h-5 text-muted-foreground transition-transform"
            style={{ transform: pullDistance >= THRESHOLD ? "rotate(180deg)" : "rotate(0deg)" }}
          />
        )}
      </div>
      {children}
    </div>
  );
}