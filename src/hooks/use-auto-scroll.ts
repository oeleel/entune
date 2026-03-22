import { useRef, useState, useEffect, useCallback } from 'react';

const BOTTOM_THRESHOLD = 100;

/**
 * Smart auto-scroll that respects user intent.
 * Only auto-scrolls when the user is near the bottom of the scroll area.
 * When the user scrolls up to read earlier content, auto-scroll pauses.
 */
export function useAutoScroll(deps: unknown[]) {
  const containerRef = useRef<HTMLDivElement>(null);
  const isAtBottomRef = useRef(true);
  const [showButton, setShowButton] = useState(false);

  // Find the viewport element inside the ScrollArea
  const getViewport = useCallback(() => {
    return containerRef.current?.querySelector<HTMLElement>(
      '[data-slot="scroll-area-viewport"]'
    );
  }, []);

  // Listen to scroll events on the viewport
  useEffect(() => {
    const viewport = getViewport();
    if (!viewport) return;

    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = viewport;
      const distanceFromBottom = scrollHeight - scrollTop - clientHeight;
      const atBottom = distanceFromBottom <= BOTTOM_THRESHOLD;

      isAtBottomRef.current = atBottom;
      setShowButton(!atBottom);
    };

    viewport.addEventListener('scroll', handleScroll, { passive: true });
    return () => viewport.removeEventListener('scroll', handleScroll);
  }, [getViewport]);

  // Auto-scroll when deps change, but only if user is at bottom
  useEffect(() => {
    if (!isAtBottomRef.current) return;
    const viewport = getViewport();
    if (!viewport) return;

    viewport.scrollTo({ top: viewport.scrollHeight, behavior: 'smooth' });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  const scrollToBottom = useCallback(() => {
    const viewport = getViewport();
    if (!viewport) return;

    viewport.scrollTo({ top: viewport.scrollHeight, behavior: 'smooth' });
    isAtBottomRef.current = true;
    setShowButton(false);
  }, [getViewport]);

  return { containerRef, showButton, scrollToBottom };
}
