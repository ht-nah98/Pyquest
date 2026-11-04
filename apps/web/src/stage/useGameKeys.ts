import { useEffect } from 'react';

const KEYS: Record<string, string> = {
  ' ': 'space',
  ArrowUp: 'up',
  ArrowDown: 'down',
  ArrowLeft: 'left',
  ArrowRight: 'right',
};

/** While active, forwards Space and the arrows to key_pressed() and stops the page from scrolling. */
export function useGameKeys(active: boolean, press: (key: string, down: boolean) => void): void {
  useEffect(() => {
    if (!active) return;
    const handler = (down: boolean) => (e: KeyboardEvent) => {
      const key = KEYS[e.key];
      if (key === undefined || e.target instanceof HTMLInputElement) return;
      if (e.target instanceof HTMLElement && e.target.closest('.cm-editor') !== null) return;
      e.preventDefault();
      if (down && e.repeat) return;
      press(key, down);
    };
    const onDown = handler(true);
    const onUp = handler(false);
    window.addEventListener('keydown', onDown);
    window.addEventListener('keyup', onUp);
    return () => {
      window.removeEventListener('keydown', onDown);
      window.removeEventListener('keyup', onUp);
    };
  }, [active, press]);
}
