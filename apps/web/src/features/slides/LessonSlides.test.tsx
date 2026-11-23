import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router';
import { describe, expect, test, vi } from 'vitest';
import { SessionProvider } from '../../app/session';
import { DexieStore } from '../../storage/dexieStore';
import type { Profile } from '../../storage/store';
import { LessonSlides } from './LessonSlides';

let n = 0;

async function setup() {
  const store = new DexieStore(`pq-slides-${String(++n)}`);
  const kid: Profile = await store.createProfile('Minh', '🦊', 'student');
  localStorage.setItem('pq-profile', kid.id);
  const ui = () =>
    render(
      <SessionProvider store={store}>
        <MemoryRouter initialEntries={['/l/l01?mode=self']}>
          <Routes>
            <Route path="/l/:lessonId" element={<LessonSlides />} />
          </Routes>
        </MemoryRouter>
      </SessionProvider>,
    );
  return { store, kid, ui };
}

const next = () => screen.getByTestId<HTMLButtonElement>('slide-next');

describe('self-study mode', () => {
  test('a quiz blocks Tiếp until the right answer; a wrong answer explains why', async () => {
    const { ui } = await setup();
    ui();
    await screen.findByTestId('slide-l01-grid');
    fireEvent.click(next());
    fireEvent.click(next());
    await screen.findByTestId('slide-l01-quiz-corner');
    expect(next().disabled).toBe(true);
    fireEvent.click(screen.getByRole('button', { name: /Góc trên bên trái/ }));
    expect((await screen.findByTestId('quiz-explain')).textContent).toContain('Chưa đúng');
    expect(next().disabled).toBe(true);
    fireEvent.click(screen.getByRole('button', { name: /Góc dưới bên trái/ }));
    expect((await screen.findByTestId('quiz-explain')).textContent).toContain('sát đáy');
    await waitFor(() => {
      expect(next().disabled).toBe(false);
    });
  });

  test('reloading comes back to the same slide', async () => {
    const { ui } = await setup();
    const first = ui();
    await screen.findByTestId('slide-l01-grid');
    fireEvent.click(next());
    await screen.findByTestId('slide-l01-ydown');
    await new Promise((r) => setTimeout(r, 50));
    first.unmount();
    ui();
    expect(await screen.findByTestId('slide-l01-ydown')).toBeTruthy();
  });

  test('the code step is closed until the code goals pass', async () => {
    const { store, kid, ui } = await setup();
    await store.saveLessonState(kid.id, 'l01', {
      stepIndex: 2,
      slideIndex: 7,
      quizAnswers: { 'l01-quiz-corner': 1, 'l01-quiz-where': 0 },
      files: {},
      done: false,
      doneSteps: [],
    });
    ui();
    await screen.findByTestId('slide-l01-library');
    expect(screen.getByTestId('to-code')).toBeTruthy();
    expect(next().disabled).toBe(true);
  });
});

describe('present mode: N8, the keys while the sample game has the focus', () => {
  test('arrows and Space play the game; PageDown, PageUp and N still work', async () => {
    const store = new DexieStore(`pq-slides-${String(++n)}`);
    const coach = await store.createProfile('HLV', '🦉', 'coach');
    localStorage.setItem('pq-profile', coach.id);
    const opened = vi.spyOn(window, 'open').mockReturnValue(null);
    render(
      <SessionProvider store={store}>
        <MemoryRouter initialEntries={['/l/l01?mode=present']}>
          <Routes>
            <Route path="/l/:lessonId" element={<LessonSlides />} />
          </Routes>
        </MemoryRouter>
        <div tabIndex={-1} data-game-keys data-testid="game" />
      </SessionProvider>,
    );
    await screen.findByTestId('slide-l01-grid');
    const count = () => screen.getByTestId('slide-count').textContent.split('/')[0];
    const game = screen.getByTestId('game');
    game.focus();
    const press = (key: string) => {
      fireEvent.keyDown(game, { key });
    };
    for (const key of ['ArrowRight', ' ', 'ArrowLeft']) press(key);
    expect(count()).toBe('1');
    press('PageDown');
    await waitFor(() => {
      expect(count()).toBe('2');
    });
    press('PageUp');
    await waitFor(() => {
      expect(count()).toBe('1');
    });
    press('n');
    expect(opened).toHaveBeenCalledOnce();
    opened.mockRestore();
    // Focus back on the page: the arrows turn the slides again.
    game.blur();
    press('ArrowRight');
    await waitFor(() => {
      expect(count()).toBe('2');
    });
  });
});
