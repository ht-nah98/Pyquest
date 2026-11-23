import type { KeyName } from '@pyquest/runtime';
import { useEffect } from 'react';

/** By e.key, else by e.code: letters by their place, so Caps Lock or a Vietnamese typing mode changes nothing. */
const KEYS: Record<string, KeyName> = {
  ' ': 'space',
  ArrowUp: 'up',
  ArrowDown: 'down',
  ArrowLeft: 'left',
  ArrowRight: 'right',
  KeyW: 'up',
  KeyS: 'down',
  KeyA: 'left',
  KeyD: 'right',
  '1': '1',
  '2': '2',
  '3': '3',
  Digit1: '1',
  Digit2: '2',
  Digit3: '3',
};

const TYPING = 'input, textarea, select, .cm-editor';

/**
 * While active, forwards Space, the arrows (and W A S D) and 1–3 to key_pressed() and stops the page from
 * scrolling. Keys typed into a field or the code editor, and shortcuts (Ctrl+A…), are not the game's.
 */
export function useGameKeys(active: boolean, press: (key: string, down: boolean) => void): void {
  useEffect(() => {
    if (!active) return;
    const keyOf = (e: KeyboardEvent) => KEYS[e.key] ?? KEYS[e.code];
    const onDown = (e: KeyboardEvent) => {
      const key = keyOf(e);
      if (key === undefined || e.ctrlKey || e.metaKey || e.altKey) return;
      if (e.target instanceof Element && e.target.closest(TYPING) !== null) return;
      e.preventDefault();
      if (!e.repeat) press(key, true);
    };
    // Wherever the focus went meanwhile, a key let go is let go: else it would stay held.
    const onUp = (e: KeyboardEvent) => {
      const key = keyOf(e);
      if (key === undefined) return;
      if (!(e.target instanceof Element && e.target.closest(TYPING) !== null)) e.preventDefault();
      press(key, false);
    };
    window.addEventListener('keydown', onDown);
    window.addEventListener('keyup', onUp);
    return () => {
      window.removeEventListener('keydown', onDown);
      window.removeEventListener('keyup', onUp);
    };
  }, [active, press]);
}
