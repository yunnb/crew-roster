import { useState, useEffect } from 'react';

/**
 * Tracks visible viewport changes caused by the mobile virtual keyboard.
 * Returns the pixel offset that's been "eaten" from the bottom of the viewport.
 */
export function useKeyboardOffset() {
  const [offset, setOffset] = useState(0);

  useEffect(() => {
    const vv = typeof window !== 'undefined' ? window.visualViewport : null;
    if (!vv) return;

    const update = () => {
      const covered = window.innerHeight - vv.height - vv.offsetTop;
      setOffset(covered > 40 ? covered : 0); // ignore tiny browser chrome changes
    };

    vv.addEventListener('resize', update);
    vv.addEventListener('scroll', update);
    update();

    return () => {
      vv.removeEventListener('resize', update);
      vv.removeEventListener('scroll', update);
    };
  }, []);

  return offset;
}

/**
 * Returns the current visible viewport height (shrinks when keyboard opens).
 */
export function useViewportHeight() {
  const [h, setH] = useState(() =>
    typeof window !== 'undefined'
      ? (window.visualViewport?.height || window.innerHeight)
      : 0
  );

  useEffect(() => {
    const vv = typeof window !== 'undefined' ? window.visualViewport : null;
    if (!vv) returnㅋ
    const update = () => setH(vv.height);
    vv.addEventListener('resize', update);
    update();
    return () => vv.removeEventListener('resize', update);
  }, []);

  return h;
}
