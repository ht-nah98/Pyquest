import { render, screen } from '@testing-library/react';
import { expect, test } from 'vitest';
import { VarWatch } from './RunPanel';

test('variables are shown the Python way: True/False, text in quotes', () => {
  render(
    <VarWatch
      result={{
        events: [],
        vars: { over: true, ok: false, name: 'Lửa', x: 3 },
        stoppedByLimit: false,
      }}
    />,
  );
  const text = screen.getByTestId('var-watch').textContent;
  expect(text).toContain('over = True');
  expect(text).toContain('ok = False');
  expect(text).toContain('name = "Lửa"');
  expect(text).toContain('x = 3');
});
