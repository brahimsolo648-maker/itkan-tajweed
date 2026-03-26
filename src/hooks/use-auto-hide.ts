import { useState, useCallback, useRef, useEffect } from 'react';

export function useAutoHide(delay = 3000) {
  const [visible, setVisible] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout>>();

  const show = useCallback(() => {
    setVisible(true);
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => setVisible(false), delay);
  }, [delay]);

  const toggle = useCallback(() => {
    setVisible((prev) => {
      if (timerRef.current) clearTimeout(timerRef.current);
      if (!prev) {
        timerRef.current = setTimeout(() => setVisible(false), delay);
      }
      return !prev;
    });
  }, [delay]);

  const hide = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setVisible(false);
  }, []);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  return { visible, show, hide, toggle };
}
