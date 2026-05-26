import { useState, useEffect, useCallback, useRef } from "react";

/** Navbar + sticky action bar + comfortable reading line */
const READING_OFFSET = 152;
const READING_LINE_RATIO = 0.24;

export function useReadingProgress(sectionIds: readonly string[]) {
  const [activeSection, setActiveSection] = useState(sectionIds[0] ?? "");
  const [progress, setProgress] = useState(0);
  const contentRef = useRef<HTMLDivElement>(null);
  const rafRef = useRef<number>();

  const update = useCallback(() => {
    const readingLine =
      window.scrollY + READING_OFFSET + window.innerHeight * READING_LINE_RATIO;

    let active = sectionIds[0] ?? "";
    for (const id of sectionIds) {
      const el = document.getElementById(id);
      if (el && el.offsetTop <= readingLine) active = id;
    }
    setActiveSection(active);

    const content = contentRef.current;
    if (!content) return;

    const rect = content.getBoundingClientRect();
    const contentTop = window.scrollY + rect.top;
    const contentHeight = content.offsetHeight;
    const viewport = window.innerHeight;
    const scrollable = contentHeight - viewport + READING_OFFSET;

    if (scrollable <= 0) {
      setProgress(window.scrollY > contentTop ? 1 : 0);
      return;
    }

    const p = (window.scrollY - contentTop + READING_OFFSET) / scrollable;
    setProgress(Math.min(1, Math.max(0, p)));
  }, [sectionIds]);

  useEffect(() => {
    const onScroll = () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = requestAnimationFrame(update);
    };

    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll, { passive: true });

    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [update]);

  const activeIndex = Math.max(0, sectionIds.indexOf(activeSection));

  return {
    activeSection,
    activeIndex,
    progress,
    contentRef,
    sectionCount: sectionIds.length,
  };
}
