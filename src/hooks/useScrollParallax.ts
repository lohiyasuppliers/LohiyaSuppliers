"use client";

import { useEffect, useRef, useState } from "react";

/** Subtle scroll-linked parallax — keeps motion professional, not dizzying. */
export function useScrollParallax(strength = 24) {
  const ref = useRef<HTMLDivElement>(null);
  const [offset, setOffset] = useState(0);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const update = () => {
      const rect = el.getBoundingClientRect();
      const center = rect.top + rect.height / 2;
      const viewCenter = window.innerHeight / 2;
      const delta = (viewCenter - center) / window.innerHeight;
      setOffset(delta * strength);
    };

    update();
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update, { passive: true });
    return () => {
      window.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, [strength]);

  return { ref, offset };
}
