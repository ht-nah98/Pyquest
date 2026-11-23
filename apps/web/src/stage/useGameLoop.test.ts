import type { GameInput, RunResult } from '@pyquest/runtime';
import { act, renderHook } from '@testing-library/react';
import type { PointerEvent } from 'react';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import { useGameKeys } from './useGameKeys';
import type { StageHandle } from './Stage';
import { useGameLoop } from './useGameLoop';

const { inputs, done } = vi.hoisted(() => ({
  inputs: [] as GameInput[],
  done: { events: [], vars: {}, stoppedByLimit: false, calls: [] } satisfies RunResult,
}));
vi.mock('../runtime/client', () => ({
  python: {
    startGame: () => Promise.resolve(done),
    step: (input: GameInput) => {
      inputs.push(input);
      return Promise.resolve(done);
    },
  },
}));

beforeEach(() => {
  inputs.length = 0;
});

/** A running game with the keyboard connected, the way every play screen does it. */
async function playing(pointAt: StageHandle['pointAt'] = () => null) {
  const stage = { current: { pointAt, showFrame: () => undefined } as unknown as StageHandle };
  const hook = renderHook(() => {
    const loop = useGameLoop(stage, () => undefined);
    useGameKeys(true, loop.press);
    return loop;
  });
  await act(() => hook.result.current.start({}, 'main.py', { width: 400, height: 600 }));
  return hook;
}

const key = (
  type: 'keydown' | 'keyup',
  k: string,
  code = k,
  more: KeyboardEventInit = {},
  target: EventTarget = window,
) => {
  target.dispatchEvent(new KeyboardEvent(type, { key: k, code, bubbles: true, ...more }));
};

/** Waits for the next step and gives its input. */
async function nextInput(): Promise<GameInput> {
  const n = inputs.length;
  await vi.waitFor(() => {
    expect(inputs.length).toBeGreaterThan(n + 1);
  });
  return inputs[inputs.length - 1]!;
}

test('an arrow is not a tap: key_pressed("space") stays False', async () => {
  const { unmount } = await playing();
  key('keydown', 'ArrowRight');
  expect((await nextInput()).keys).toEqual(['right']);
  key('keyup', 'ArrowRight');
  await nextInput();
  expect(inputs.filter((i) => i.tapped)).toEqual([]);
  unmount();
});

test('Space is a tap on exactly one step, and held until it is released', async () => {
  const { unmount } = await playing();
  key('keydown', ' ', 'Space');
  expect((await nextInput()).keys).toEqual(['space']);
  key('keyup', ' ', 'Space');
  await nextInput();
  expect((await nextInput()).keys).toEqual([]);
  expect(inputs.filter((i) => i.tapped)).toHaveLength(1);
  unmount();
});

test('W A S D are the arrows, 1 2 3 are themselves; shortcuts are not the game’s', async () => {
  const { unmount } = await playing();
  for (const [k, code] of [
    ['w', 'KeyW'],
    ['A', 'KeyA'],
    ['s', 'KeyS'],
    ['Process', 'KeyD'],
    ['1', 'Digit1'],
    ['@', 'Digit2'],
    ['3', 'Numpad3'],
  ] as const)
    key('keydown', k, code);
  expect((await nextInput()).keys).toEqual(['up', 'left', 'down', 'right', '1', '2', '3']);
  for (const code of ['KeyW', 'KeyA', 'KeyS', 'KeyD', 'Digit1', 'Digit2']) key('keyup', '', code);
  key('keyup', '3', 'Numpad3');
  key('keydown', 'a', 'KeyA', { ctrlKey: true });
  await nextInput();
  expect((await nextInput()).keys).toEqual([]);
  unmount();
});

test('a key pressed and let go between two frames still counts for one frame', async () => {
  const { unmount } = await playing();
  key('keydown', '2', 'Digit2');
  key('keyup', '2', 'Digit2');
  await nextInput();
  expect((await nextInput()).keys).toEqual([]);
  expect(inputs.filter((i) => i.keys.includes('2'))).toHaveLength(1);
  unmount();
});

test('keys do not stick: the window loses focus, the key is let go in the editor, a new game', async () => {
  const { unmount, result } = await playing();
  key('keydown', 'ArrowLeft');
  expect((await nextInput()).keys).toEqual(['left']);
  window.dispatchEvent(new Event('blur'));
  expect((await nextInput()).keys).toEqual([]);

  const editor = document.createElement('div');
  editor.className = 'cm-editor';
  document.body.append(editor);
  key('keydown', 'a', 'KeyA', {}, editor);
  expect((await nextInput()).keys).toEqual([]);
  key('keydown', 'ArrowUp');
  expect((await nextInput()).keys).toEqual(['up']);
  key('keyup', 'ArrowUp', 'ArrowUp', {}, editor);
  expect((await nextInput()).keys).toEqual([]);
  editor.remove();

  key('keydown', 'ArrowDown');
  await act(() => result.current.start({}, 'main.py', { width: 400, height: 600 }));
  expect((await nextInput()).keys).toEqual([]);
  unmount();
});

describe('the pointer', () => {
  const press = (button = 0) =>
    ({ button, pointerId: 1, clientX: 30, clientY: 40 }) as PointerEvent<HTMLElement>;
  const up = () => {
    window.dispatchEvent(Object.assign(new Event('pointerup'), { pointerId: 1 }));
  };

  test('a press on the picture is a click and a flap for one frame, held as Space, at its place', async () => {
    const { unmount, result } = await playing((x, y) => ({ x: x * 10, y: y * 10 }));
    expect(await nextInput()).toEqual({ keys: [], tapped: false, clicked: false });
    result.current.pointer.onPointerDown(press());
    expect(await nextInput()).toMatchObject({ keys: ['space'], pointer: { x: 300, y: 400 } });
    up(); // anywhere on the page: dragged off the stage too
    await nextInput();
    expect((await nextInput()).keys).toEqual([]);
    expect(inputs.filter((i) => i.clicked === true)).toHaveLength(1);
    expect(inputs.filter((i) => i.tapped)).toHaveLength(1);
    result.current.pointer.onPointerMove({ ...press(), clientX: 31 });
    expect(await nextInput()).toMatchObject({ clicked: false, pointer: { x: 310, y: 400 } });
    unmount();
  });

  test('a press beside the picture still flaps but is no click; the right button is nothing', async () => {
    const { unmount, result } = await playing(() => null);
    result.current.pointer.onPointerDown(press(2));
    expect(await nextInput()).toEqual({ keys: [], tapped: false, clicked: false });
    result.current.pointer.onPointerDown(press());
    up();
    await nextInput();
    expect(inputs.filter((i) => i.tapped)).toHaveLength(1);
    expect(inputs.some((i) => i.clicked === true || i.pointer !== undefined)).toBe(false);
    unmount();
  });
});
