import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import { catalog } from '../content/catalog';
import { DexieStore } from '../storage/dexieStore';
import { NeedCourse } from './NeedCourse';
import { reloadPage, siteAnswers } from './reload';
import { SessionProvider } from './session';

vi.mock('./reload', () => ({ reloadPage: vi.fn(), siteAnswers: vi.fn() }));

let store: DexieStore;
let n = 0;
beforeEach(() => {
  store = new DexieStore(`pq-need-course-${String(++n)}`);
});
afterEach(() => {
  vi.restoreAllMocks();
  vi.mocked(reloadPage).mockReset();
  vi.mocked(siteAnswers).mockReset();
});

const Page = () => <p>{catalog.openLesson('l01')?.title ?? 'no lesson'}</p>;
const page = (id: string) => (
  <SessionProvider store={store}>
    <MemoryRouter>
      <NeedCourse key={id} courseId={id}>
        <Page />
      </NeedCourse>
    </MemoryRouter>
  </SessionProvider>
);
const retry = async () => {
  fireEvent.click(await screen.findByRole('button', { name: /Thử lại/ }));
};

test('a failed download says so, with ways out; the page itself does not show', async () => {
  vi.spyOn(catalog, 'load').mockRejectedValue(new Error('offline'));
  render(page('bay-qua-khe'));
  expect(screen.getByText('Đang tải khóa học…')).toBeTruthy();
  expect(await screen.findByTestId('course-failed')).toBeTruthy();
  expect(screen.queryByText('no lesson')).toBeNull();
  expect(document.querySelector('a[href="/courses"]')).not.toBeNull();
});

test('↻ while the site does not answer stays on the page, and opens it once the download works', async () => {
  const load = vi.spyOn(catalog, 'load').mockRejectedValue(new Error('offline'));
  vi.mocked(siteAnswers).mockResolvedValue(false);
  render(page('ham-ngoc'));
  await retry();
  expect(await screen.findByTestId('course-failed')).toBeTruthy();
  expect(reloadPage).not.toHaveBeenCalled();
  load.mockResolvedValue();
  await retry();
  expect(await screen.findByText('no lesson')).toBeTruthy();
});

test('↻ with the site answering but the file gone (a new version was deployed) reloads the page', async () => {
  vi.spyOn(catalog, 'load').mockRejectedValue(new Error('404'));
  vi.mocked(siteAnswers).mockResolvedValue(true);
  render(page('ham-ngoc'));
  await retry();
  await waitFor(() => {
    expect(reloadPage).toHaveBeenCalledTimes(1);
  });
});

test('a child who left while ↻ was working keeps the page they went to', async () => {
  const load = vi.spyOn(catalog, 'load').mockRejectedValue(new Error('404'));
  let answer: (ok: boolean) => void = () => undefined;
  vi.mocked(siteAnswers).mockReturnValue(
    new Promise((resolve) => {
      answer = resolve;
    }),
  );
  const view = render(page('ham-ngoc'));
  await retry();
  await waitFor(() => {
    expect(siteAnswers).toHaveBeenCalled();
  });
  view.unmount();
  answer(true);
  await new Promise((r) => setTimeout(r, 20));
  expect(load).toHaveBeenCalled();
  expect(reloadPage).not.toHaveBeenCalled();
});

test('the page waits for its course, and does not wait again', async () => {
  const first = render(page('bay-qua-khe'));
  expect(screen.queryByText('no lesson')).toBeNull();
  expect(await screen.findByText('Tọa độ và gọi lệnh')).toBeTruthy();
  first.unmount();
  render(page('bay-qua-khe'));
  expect(screen.getByText('Tọa độ và gọi lệnh')).toBeTruthy();
});
