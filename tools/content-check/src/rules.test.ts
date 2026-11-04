import { PyRunner } from '@pyquest/runtime';
import { beforeAll, describe, expect, test } from 'vitest';
import { checkContent, type ContentInput } from './rules';

let py: PyRunner;
beforeAll(async () => {
  py = await PyRunner.create();
});

const slides = (id: string) => [{ id, text: 'Một ý.' }];

function lesson(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    id: 'l00',
    courseId: 'c',
    order: 0,
    title: 'Bài',
    steps: [
      { kind: 'understand', slides: slides('a') },
      { kind: 'code', slides: slides('b') },
      { kind: 'playtest', slides: slides('c') },
    ],
    code: {
      starter: { 'main.py': '' },
      main: 'main.py',
      toolbox: ['pq_draw_bird', 'pq_number'],
      mode: 'script',
      goals: [{ id: 'g-bird', label: 'Chim', kind: 'drew', sprite: 'bird', at: [100, 300] }],
      solution: { 'main.py': 'draw_bird(100, 300)\n' },
    },
    unlocksRoadmap: ['stage'],
    docsUnlocked: [],
    ...overrides,
  };
}

function input(l: Record<string, unknown>): ContentInput {
  return {
    courses: [
      {
        dir: 'c',
        course: {
          id: 'c',
          title: 'Khóa',
          summary: 'Tóm tắt.',
          lessonIds: ['l00', 'l01'],
          roadmap: [{ id: 'stage', label: 'Sân khấu' }],
        },
        lessons: [
          { file: 'l00.json', json: l },
          {
            file: 'l01.json',
            json: { id: 'l01', courseId: 'c', order: 1, title: 'Sau', hidden: true },
          },
        ],
      },
    ],
    manifest: {
      assets: [
        {
          id: 'bird',
          group: 'bird',
          file: 'bird.png',
          width: 32,
          height: 24,
          frames: 3,
          credit: 'placeholder',
        },
      ],
    },
    assetFiles: ['bird.png'],
    strayFiles: [],
  };
}

describe('checkContent', () => {
  test('a valid course has no errors', async () => {
    expect(await checkContent(input(lesson()), py)).toEqual([]);
  });

  test('a solution that misses a goal is reported with the goal id', async () => {
    const l = lesson();
    (l['code'] as { solution: Record<string, string> }).solution = {
      'main.py': 'draw_bird(101, 300)\n',
    };
    const errors = await checkContent(input(l), py);
    expect(errors.join('\n')).toContain('g-bird');
  });

  test('a starter that already passes every goal is reported', async () => {
    const l = lesson();
    (l['code'] as { starter: Record<string, string> }).starter = {
      'main.py': 'draw_bird(100, 300)\n',
    };
    expect((await checkContent(input(l), py)).join('\n')).toMatch(/starter/);
  });

  test('an unknown toolbox block is reported', async () => {
    const l = lesson();
    (l['code'] as { toolbox: string[] }).toolbox = ['pq_nope'];
    expect((await checkContent(input(l), py)).join('\n')).toContain('pq_nope');
  });

  test('a missing slide image is reported', async () => {
    const l = lesson({
      steps: [
        { kind: 'understand', slides: [{ id: 'a', image: 'nope.png' }] },
        { kind: 'code', slides: slides('b') },
        { kind: 'playtest', slides: slides('c') },
      ],
    });
    expect((await checkContent(input(l), py)).join('\n')).toContain('nope.png');
  });

  test('lessonIds that do not match the files are reported', async () => {
    const i = input(lesson());
    i.courses[0]!.lessons.pop();
    expect((await checkContent(i, py)).join('\n')).toContain('l01');
  });

  test('an unknown roadmap id is reported', async () => {
    expect(
      (await checkContent(input(lesson({ unlocksRoadmap: ['nope'] })), py)).join('\n'),
    ).toContain('nope');
  });

  test('stray files are reported', async () => {
    const i = input(lesson());
    i.strayFiles = ['courses/c/.omc/state.json'];
    expect((await checkContent(i, py)).join('\n')).toContain('.omc');
  });

  test('a sample game that crashes is reported', async () => {
    const i = input(lesson());
    i.courses[0]!.sampleGame = 'def update():\n    boom()\n';
    expect((await checkContent(i, py)).join('\n')).toMatch(/sample game/);
  });
});
