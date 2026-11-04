import type { RunResult } from '@pyquest/runtime';
import { fireEvent, render, screen } from '@testing-library/react';
import { expect, test, vi } from 'vitest';
import { CallPanel, eventAsCall, familyOf } from './CallPanel';

const result: RunResult = {
  events: [
    { t: 'clear', color: 'skyblue' },
    { t: 'rect', x: 100, y: 310, w: 30, h: 20, color: 'red', by: 1 },
    { t: 'rect', x: 130, y: 314, w: 8, h: 8, color: 'orange', by: 1 },
  ],
  vars: {},
  stoppedByLimit: false,
  calls: [
    { id: 0, parent: null, name: 'flock', args: {}, line: 9 },
    { id: 1, parent: 0, name: 'draw_bird', args: { x: 100, y: 300 }, line: 7 },
  ],
};

test('each call shows its numbers and the library calls it made, nested under its caller', () => {
  render(<CallPanel result={result} from={0} picked={null} onPick={() => undefined} />);
  const rows = screen.getAllByTestId('call-row').map((r) => r.textContent);
  expect(rows).toEqual(['📞 flock()dòng 9', '📞 draw_bird(x=100, y=300)dòng 7']);
  expect(screen.getAllByTestId('call-leaf').map((l) => l.textContent)).toEqual([
    'draw_rect(100, 310, 30, 20, "red")',
    'draw_rect(130, 314, 8, 8, "orange")',
  ]);
});

test('picking a row reports the call; picking it again clears', () => {
  const onPick = vi.fn();
  const { rerender } = render(<CallPanel result={result} from={0} picked={null} onPick={onPick} />);
  fireEvent.click(screen.getAllByTestId('call-row')[1] as HTMLElement);
  expect(onPick).toHaveBeenLastCalledWith(result.calls[1]);
  rerender(<CallPanel result={result} from={0} picked={1} onPick={onPick} />);
  fireEvent.click(screen.getAllByTestId('call-row')[1] as HTMLElement);
  expect(onPick).toHaveBeenLastCalledWith(null);
});

test('no calls yet: a sentence says what will appear', () => {
  render(
    <CallPanel result={{ ...result, calls: [] }} from={0} picked={null} onPick={() => undefined} />,
  );
  expect(screen.getByTestId('calls-empty').textContent).toContain('def');
});

test('a call lights up with every call made inside it', () => {
  expect([...familyOf(result.calls, 0)]).toEqual([0, 1]);
  expect([...familyOf(result.calls, 1)]).toEqual([1]);
});

test('drawings read back as Python', () => {
  expect(eventAsCall({ t: 'sprite', sprite: 'pipe', x: 1, y: 2, frame: 0, flip: true })).toBe(
    'draw_image("images/pipe.png", 1, 2, flip=True)',
  );
});
