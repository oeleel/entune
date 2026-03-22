import { useRef, useState, useEffect, useCallback } from 'react';

const BOTTOM_THRESHOLD = 100;

/**
 * Smart auto-scroll that respects user intent.
 * Only auto-scrolls when the user is near the bottom of the scroll area.
 * When the user scrolls up to read earlier content, auto-scroll pauses
 * and a "Scroll to latest" button appears.
 */
export function useAutoScroll(deps: unknown[]) {
  const isAtBottomRef = useRef(true);
  const isAutoScrollingRef = useRef(false);
  const viewportRef = useRef<HTMLElement | null>(null);
  const [showButton, setShowButton] = useState(false);

  // Callback ref: find the viewport inside the ScrollArea wrapper.
  const containerRef = useCallback((node: HTMLDivElement | null) => {
    viewportRef.current = null;
    if (!node) return;

    const viewport = node.querySelector<HTMLElement>(
      '[data-slot="scroll-area-viewport"]'
    );
    if (viewport) viewportRef.current = viewport;
  }, []);

  // Attach scroll listener. Re-runs when viewportRef is set via containerRef.
  useEffect(() => {
    const viewport = viewportRef.current;
    if (!viewport) return;

    const handleScroll = () => {
      // Ignore scroll events fired during our own programmatic scrollTo
      if (isAutoScrollingRef.current) return;

      const { scrollTop, scrollHeight, clientHeight } = viewport;
      const distanceFromBottom = scrollHeight - scrollTop - clientHeight;
      const atBottom = distanceFromBottom <= BOTTOM_THRESHOLD;

      isAtBottomRef.current = atBottom;
      setShowButton(!atBottom);
    };

    viewport.addEventListener('scroll', handleScroll, { passive: true });
    return () => viewport.removeEventListener('scroll', handleScroll);
  });

  // Auto-scroll when deps change, but only if user is at bottom
  useEffect(() => {
    if (!isAtBottomRef.current) return;
    const viewport = viewportRef.current;
    if (!viewport) return;

    // Set flag so the scroll listener ignores events from this animation
    isAutoScrollingRef.current = true;

    // Double rAF ensures React's DOM mutations are flushed and painted
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        viewport.scrollTo({ top: viewport.scrollHeight, behavior: 'smooth' });

        // Clear the flag after the smooth scroll settles (~400ms is generous)
        setTimeout(() => {
          isAutoScrollingRef.current = false;
          // Re-check position after scroll finishes
          const { scrollTop, scrollHeight, clientHeight } = viewport;
          const distanceFromBottom = scrollHeight - scrollTop - clientHeight;
          isAtBottomRef.current = distanceFromBottom <= BOTTOM_THRESHOLD;
        }, 400);
      });
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  const scrollToBottom = useCallback(() => {
    const viewport = viewportRef.current;
    if (!viewport) return;

    isAutoScrollingRef.current = true;
    viewport.scrollTo({ top: viewport.scrollHeight, behavior: 'smooth' });

    setTimeout(() => {
      isAutoScrollingRef.current = false;
      isAtBottomRef.current = true;
      setShowButton(false);
    }, 400);
  }, []);

  return { containerRef, showButton, scrollToBottom };
}
