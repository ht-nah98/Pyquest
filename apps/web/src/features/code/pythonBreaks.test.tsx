import { act, fireEvent, render, screen } from '@testing-library/react';
import { forwardRef, useImperativeHandle, type ReactElement } from 'react';
import { MemoryRouter, Route, Routes } from 'react-router';
import { beforeAll, beforeEach, expect, test, vi } from 'vitest';
import { SessionProvider } from '../../app/session';
import { catalog } from '../../content/catalog';
import { DexieStore } from '../../storage/dexieStore';
import { emptyLessonState } from '../../storage/store';
import { CoachCode } from '../coach/CoachCode';
import { SampleGame } from '../slides/widgets/SampleGame';
import { createDrawing } from '../studio/drawings';
import { StudioEditor } from '../studio/StudioEditor';
import { CodeScreen } from './CodeScreen';
import { PlayScreen } from './PlayScreen';

/** A Python that always breaks by itself (worker crash, out of memory): nothing here is the child's error. */
const { calls, pending } = vi.hoisted(() => ({
  calls: { warmUp: 0, stop: 0 },
  /** Set: a call hangs until stop() rejects it, as a killed worker does. */
  pending: { hang: false, reject: undefined as ((e: Error) => void) | undefined },
}));
vi.mock('../../runtime/client', () => {
  const broken = () =>
    pending.hang
      ? new Promise((_, reject) => {
          pending.reject = reject;
        })
      : Promise.reject(new Error('crash'));
  return {
    python: {
      run: broken,
      startGame: broken,
      step: broken,
      parse: broken,
      warmUp: () => {
        calls.warmUp++;
        return Promise.resolve();
      },
      get hasPending() {
        return pending.reject !== undefined;
      },
      stop: () => {
        calls.stop++;
        pending.reject?.(new Error('stopped'));
        pending.reject = undefined;
      },
    },
    usePyStatus: () => 'ready',
  };
});
// Blockly and CodeMirror need a real browser.
vi.mock('./EditorPanes', () => ({
  EditorPanes: forwardRef(function EditorPanes(_, ref) {
    useImperativeHandle(ref, () => ({ highlight: () => undefined, reparse: () => undefined }));
    return null;
  }),
}));
vi.mock('../coach/coachApi', () => ({
  lessonsOf: () =>
    Promise.resolve([
      { userId: 'u', lessonId: 'l01', state: emptyLessonState(), at: 0 },
      { userId: 'u', lessonId: 'l17', state: emptyLessonState(), at: 0 },
    ]),
}));

const MESSAGE = /Có trục trặc khi chạy/;
const game = catalog.openLesson('l17')?.exercises?.find((e) => e.mode === 'game')?.id ?? '';
const script = catalog.openLesson('l01')?.exercises?.find((e) => e.mode === 'script')?.id ?? '';

beforeAll(() => {
  window.ResizeObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
  };
  // No canvas in jsdom: the stage then draws nothing.
  HTMLCanvasElement.prototype.getContext = () => null;
  HTMLElement.prototype.requestFullscreen = () => Promise.resolve();
  window.Image = class {
    onload: (() => void) | null = null;
    onerror: (() => void) | null = null;
    set src(_: string) {
      this.onerror?.();
    }
  } as unknown as typeof Image;
});

beforeEach(() => {
  calls.warmUp = 0;
  calls.stop = 0;
  pending.hang = false;
  pending.reject = undefined;
});

let n = 0;
async function open(path: string, route: string, element: ReactElement) {
  const store = new DexieStore(`pq-breaks-${String(++n)}`);
  const coach = await store.createProfile('HLV', '🦉', 'coach');
  const drawing = await createDrawing(store, coach.id, 'draw_circle(1, 1, 1)');
  localStorage.setItem('pq-profile', coach.id);
  render(
    <SessionProvider store={store}>
      <MemoryRouter initialEntries={[path.replace(':drawing', drawing ?? '')]}>
        <Routes>
          <Route path={route} element={element} />
        </Routes>
      </MemoryRouter>
    </SessionProvider>,
  );
}

test.each([
  ['script', `/l/l01/code?ex=${script}`],
  ['game', `/l/l17/code?ex=${game}`],
])('code screen, %s: ▶ comes back and the error bubble says why', async (_, path) => {
  await open(path, '/l/:lessonId/code', <CodeScreen />);
  fireEvent.click(await screen.findByTestId('run'));
  expect((await screen.findByTestId('run-error')).textContent).toMatch(MESSAGE);
  expect(screen.queryByTestId('stop')).toBeNull();
  // ▶ again is possible.
  fireEvent.click(screen.getByTestId('run'));
  expect((await screen.findByTestId('run-error')).textContent).toMatch(MESSAGE);
  expect(screen.getByTestId('run')).toBeTruthy();
});

test('code screen: ■ Dừng is no failure, and its late answer does not end the next run', async () => {
  await open(`/l/l01/code?ex=${script}`, '/l/:lessonId/code', <CodeScreen />);
  pending.hang = true;
  fireEvent.click(await screen.findByTestId('run'));
  await act(async () => {
    fireEvent.click(await screen.findByTestId('stop'));
    fireEvent.click(await screen.findByTestId('run'));
    await Promise.resolve();
  });
  expect(calls.stop).toBe(1);
  expect(screen.queryByTestId('run-error')).toBeNull();
  expect(screen.getByTestId('stop')).toBeTruthy();
});

test.each([
  ['script', `/l/l01/play?ex=${script}`],
  ['game', `/l/l17/play?ex=${game}`],
])('fullscreen play, %s', async (_, path) => {
  await open(path, '/l/:lessonId/play', <PlayScreen />);
  expect((await screen.findByTestId('play-error')).textContent).toMatch(MESSAGE);
});

test.each([
  ['script', `/coach/s/u/l/l01?ex=${script}`],
  ['game', `/coach/s/u/l/l17?ex=${game}`],
])('the coach runs a child’s code, %s', async (_, path) => {
  await open(path, '/coach/s/:userId/l/:lessonId', <CoachCode />);
  const run = await screen.findByTestId<HTMLButtonElement>('coach-run');
  await vi.waitFor(() => {
    expect(run.disabled).toBe(false);
  });
  fireEvent.click(run);
  expect(await screen.findByText(MESSAGE)).toBeTruthy();
});

test('studio: ▶ comes back and the error bubble says why', async () => {
  await open('/studio/:drawing', '/studio/:drawingId', <StudioEditor />);
  fireEvent.click(await screen.findByTestId('run'));
  expect((await screen.findByTestId('run-error')).textContent).toMatch(MESSAGE);
  expect(screen.getByTestId('run')).toBeTruthy();
});

test('studio: ■ Dừng is no failure', async () => {
  await open('/studio/:drawing', '/studio/:drawingId', <StudioEditor />);
  pending.hang = true;
  fireEvent.click(await screen.findByTestId('run'));
  fireEvent.click(await screen.findByTestId('stop'));
  expect(await screen.findByTestId('run')).toBeTruthy();
  expect(screen.queryByTestId('run-error')).toBeNull();
});

test('the sample game on a slide', async () => {
  render(<SampleGame source="" />);
  expect((await screen.findByTestId('sample-error')).textContent).toMatch(MESSAGE);
});
