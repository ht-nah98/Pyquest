import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router';
import { describe, expect, test } from 'vitest';
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
