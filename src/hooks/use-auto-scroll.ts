import { useRef, useState, useEffect, useCallback } from 'react';

const BOTTOM_THRESHOLD = 100;

/**
 * Smart auto-scroll that respects user intent.
 * Only auto-scrolls when the user is near the bottom of the scroll area.
 * When the user scrolls up to read earlier content, auto-scroll pauses.
 *
 * Uses a callback ref so the scroll listener is attached/detached
 * whenever the ScrollArea mounts/unmounts (e.g. status transitions).
 */
export function useAutoScroll(deps: unknown[]) {
  const isAtBottomRef = useRef(true);
  const viewportRef = useRef<HTMLElement | null>(null);
  const [showButton, setShowButton] = useState(false);
  // Trigger re-run of the auto-scroll effect when the node changes
  const [, setMounted] = useState(0);

  // Callback ref: attached to the ScrollArea wrapper div.
  // When the element mounts, we find the viewport inside it and wire up the scroll listener.
  const containerRef = useCallback((node: HTMLDivElement | null) => {
    // Clean up previous listener
    viewportRef.current = null;

    if (!node) return;

    const viewport = node.querySelector<HTMLElement>(
      '[data-slot="scroll-area-viewport"]'
    );
    if (!viewport) return;

    viewportRef.current = viewport;
    // Force the auto-scroll effect to re-run now that we have a viewport
    setMounted((n) => n + 1);
  }, []);

  // Listen to scroll events on the viewport
  useEffect(() => {
    const viewport = viewportRef.current;
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
  });

  // Auto-scroll when deps change, but only if user is at bottom
  useEffect(() => {
    if (!isAtBottomRef.current) return;
    const viewport = viewportRef.current;
    if (!viewport) return;

    // Use requestAnimationFrame to ensure the DOM has been painted with new content
    requestAnimationFrame(() => {
      viewport.scrollTo({ top: viewport.scrollHeight, behavior: 'smooth' });
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  const scrollToBottom = useCallback(() => {
    const viewport = viewportRef.current;
    if (!viewport) return;

    viewport.scrollTo({ top: viewport.scrollHeight, behavior: 'smooth' });
    isAtBottomRef.current = true;
    setShowButton(false);
  }, []);

  return { containerRef, showButton, scrollToBottom };
}
