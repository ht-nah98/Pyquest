import { TEST_KEYS } from '@pyquest/content-schema';
import { KEYS, PyRunner } from '@pyquest/runtime';
import { beforeAll, describe, expect, test } from 'vitest';
import { checkContent, type ContentInput } from './rules';

let py: PyRunner;
beforeAll(async () => {
  py = await PyRunner.create();
});

const slides = (id: string) => [{ id, text: 'Một ý.' }];

/** The first exercise of a test lesson. */
const ex = (l: Record<string, unknown>) => (l['exercises'] as Record<string, unknown>[])[0];

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
    exercises: [
      {
        id: 'l00-e1',
        title: 'Vẽ chim',
        task: 'Vẽ chim ở (100, 300).',
        input: 'blocks',
        starter: { 'main.py': '' },
        main: 'main.py',
        toolbox: ['pq_import', 'pq_draw_image', 'pq_number', 'pq_text'],
        mode: 'script',
        goals: [{ id: 'g-bird', label: 'Chim', kind: 'drew', sprite: 'bird', at: [100, 300] }],
        solution: { 'main.py': 'from pyquest import *\ndraw_image("images/bird.png", 100, 300)\n' },
      },
    ],
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
    (ex(l) as { solution: Record<string, string> }).solution = {
      'main.py': 'from pyquest import *\ndraw_image("images/bird.png", 101, 300)\n',
    };
    const errors = await checkContent(input(l), py);
    expect(errors.join('\n')).toContain('g-bird');
  });

  test('a starter that already passes every goal is reported', async () => {
    const l = lesson();
    (ex(l) as { starter: Record<string, string> }).starter = {
      'main.py': 'from pyquest import *\ndraw_image("images/bird.png", 100, 300)\n',
    };
    expect((await checkContent(input(l), py)).join('\n')).toMatch(/starter/);
  });

  test('a toolbox that lacks a block the code uses is reported (rule 11), calls and code text are not', async () => {
    const l = lesson();
    const e = ex(l) as Record<string, unknown>;
    e['toolbox'] = ['pq_import', 'pq_number', 'pq_text'];
    expect((await checkContent(input(l), py)).join('\n')).toContain(
      'l00-e1: toolbox lacks blocks the code uses: pq_draw_image',
    );
    e['toolbox'] = ['pq_import', 'pq_draw_image', 'pq_number', 'pq_text', 'pq_def', 'pq_var_get'];
    e['solution'] = {
      'main.py':
        'from pyquest import *\nimport math\n\n\ndef bird(x):\n    draw_image("images/bird.png", x, 300)\n\n\nbird(100)\n',
    };
    expect(await checkContent(input(l), py)).toEqual([]);
  });

  test('an unknown toolbox block is reported', async () => {
    const l = lesson();
    (ex(l) as { toolbox: string[] }).toolbox = ['pq_nope'];
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

  test('code the block editor would change is reported (rule 9)', async () => {
    const l = lesson();
    (ex(l) as { starter: Record<string, string> }).starter = {
      'main.py': 'draw_rect(1,2,3,4,"red")\n',
    };
    expect((await checkContent(input(l), py)).join('\n')).toMatch(/round trip/);
  });

  test('a library entry pointing at an unknown lesson is reported (rule 10)', async () => {
    const i = input(lesson());
    i.library = {
      entries: [
        {
          name: 'draw_rect',
          signature: 'draw_rect(x, y, rộng, cao, màu)',
          vi: 'Tô một khối.',
          why: 'Tô từng điểm thì quá lâu.',
          example: 'draw_rect(1, 2, 3, 4, "red")',
          lesson: 'l99',
        },
      ],
    };
    expect((await checkContent(i, py)).join('\n')).toContain('l99');
  });

  test('a library entry with no lesson yet is accepted (ADR 0009)', async () => {
    const i = input(lesson());
    i.library = {
      entries: [
        {
          name: 'draw_circle',
          signature: 'draw_circle(x, y, bán kính, màu)',
          vi: 'Tô một hình tròn.',
          why: 'Ghép hình tròn từ ô vuông thì rất lâu.',
          example: 'draw_circle(300, 300, 100, "gold")',
        },
      ],
    };
    expect(await checkContent(i, py)).toEqual([]);
  });

  test("grading runs use the course's stage size (ADR 0009)", async () => {
    // The solution passes only when its WIDTH is 600, so the run must use the course's stage.
    const l = lesson();
    const e = ex(l) as Record<string, unknown>;
    e['toolbox'] = [
      'pq_import',
      'pq_draw_circle',
      'pq_assign',
      'pq_var_get',
      'pq_arith',
      'pq_number',
      'pq_text',
    ];
    e['goals'] = [
      { id: 'g-size', label: 'Sân rộng 600', kind: 'varEquals', name: 'w', value: 600 },
    ];
    e['starter'] = { 'main.py': 'from pyquest import *\n' };
    e['solution'] = {
      'main.py': 'from pyquest import *\n\nw = WIDTH\ndraw_circle(w / 2, 300, 100, "gold")\n',
    };
    const i = input(l);
    const course = i.courses[0]!.course as Record<string, unknown>;
    expect((await checkContent(i, py)).join('\n')).toContain('g-size');
    course['stage'] = { width: 600, height: 600 };
    expect(await checkContent(i, py)).toEqual([]);
  });

  test('a shifts goal catches a bird typed with fixed numbers', async () => {
    const birdAt = (x: string) =>
      `from pyquest import *\n\nx = 100\ndraw_rect(${x}, 300, 30, 20, "red")\n`;
    const l = lesson();
    const code = ex(l) as Record<string, unknown>;
    code['toolbox'] = [
      'pq_import',
      'pq_draw_rect',
      'pq_assign',
      'pq_var_get',
      'pq_number',
      'pq_text',
    ];
    code['goals'] = [
      { id: 'g-follow', label: 'Theo x', kind: 'shifts', var: 'x', by: 50, axis: 'x' },
    ];
    code['starter'] = { 'main.py': 'from pyquest import *\n' };
    code['solution'] = { 'main.py': birdAt('x') };
    expect(await checkContent(input(l), py)).toEqual([]);
    code['solution'] = { 'main.py': birdAt('100') };
    expect((await checkContent(input(l), py)).join('\n')).toContain('g-follow');
  });

  test('every exercise is checked on its own and named in the error', async () => {
    const l = lesson();
    const first = ex(l) as Record<string, unknown>;
    l['exercises'] = [
      first,
      { ...first, id: 'l00-e2', solution: { 'main.py': 'from pyquest import *\n' } },
    ];
    expect((await checkContent(input(l), py)).join('\n')).toMatch(/l00-e2: solution misses/);
  });

  test('a matches goal compares with the solution picture', async () => {
    const l = lesson();
    const e = ex(l) as Record<string, unknown>;
    e['toolbox'] = ['pq_import', 'pq_draw_rect', 'pq_number', 'pq_text'];
    e['goals'] = [{ id: 'g-same', label: 'Giống hình', kind: 'matches' }];
    e['solution'] = { 'main.py': 'from pyquest import *\ndraw_rect(0, 0, 10, 10, "red")\n' };
    e['starter'] = { 'main.py': 'from pyquest import *\ndraw_rect(0, 0, 10, 10, "blue")\n' };
    expect(await checkContent(input(l), py)).toEqual([]);
  });

  test('M2: a matches goal in a game exercise is reported (the page cannot grade it)', async () => {
    const l = lesson();
    const e = ex(l) as Record<string, unknown>;
    e['mode'] = 'game';
    e['goals'] = [{ id: 'g-same', label: 'Giống hình', kind: 'matches' }];
    expect((await checkContent(input(l), py)).join('\n')).toMatch(
      /matches only works in script mode/,
    );
  });

  test('stray files are reported', async () => {
    const i = input(lesson());
    i.strayFiles = ['courses/c/.omc/state.json'];
    expect((await checkContent(i, py)).join('\n')).toContain('.omc');
  });

  test('a sample game that crashes is reported', async () => {
    const i = input(lesson());
    i.courses[0]!.sampleGame = 'from pyquest import *\ndef update():\n    boom()\n';
    expect((await checkContent(i, py)).join('\n')).toMatch(/sample game/);
  });

  describe('two courses (rule 13, ADR 0011)', () => {
    const two = (secondId: string, over: Record<string, unknown> = {}): ContentInput => {
      const i = input(lesson());
      i.courses.push({
        dir: 'd',
        course: {
          id: 'd',
          title: 'Khóa 2',
          summary: 'Tóm tắt.',
          draft: true,
          after: 'c',
          lessonIds: [secondId],
          roadmap: [],
          ...over,
        },
        lessons: [
          {
            file: `${secondId}.json`,
            json: { id: secondId, courseId: 'd', order: 0, title: 'Một', hidden: true },
          },
        ],
      });
      return i;
    };

    test('a draft course after another one is fine', async () => {
      expect(await checkContent(two('h00'), py)).toEqual([]);
    });

    test('a lesson id used by two courses is reported', async () => {
      expect((await checkContent(two('l00'), py)).join('\n')).toContain(
        'duplicate lesson id "l00" (already in c)',
      );
    });

    test('a lesson id that is not a letter and two digits is reported', async () => {
      for (const id of ['h0', 'H00', 'ham00', 'h000'])
        expect((await checkContent(two(id), py)).join('\n')).toContain(`lesson id "${id}" must be`);
    });

    test('after: an unknown course, itself or a circle is reported', async () => {
      const check = async (i: ContentInput) => (await checkContent(i, py)).join('\n');
      expect(await check(two('h00', { after: 'nope' }))).toContain('unknown course "nope"');
      expect(await check(two('h00', { after: 'd' }))).toContain('circle');
      const round = two('h00');
      (round.courses[0]!.course as Record<string, unknown>)['after'] = 'd';
      expect(await check(round)).toContain('circle');
    });

    test('rule 10 accepts a lesson of any course', async () => {
      const i = two('h00');
      const entry = {
        name: 'clicked',
        signature: 'clicked()',
        vi: 'Vừa bấm.',
        why: 'Làm nút bấm.',
        example: 'clicked()',
      };
      i.library = { entries: [{ ...entry, lesson: 'h00' }] };
      expect(await checkContent(i, py)).toEqual([]);
      i.library = { entries: [{ ...entry, lesson: 'h01' }] };
      expect((await checkContent(i, py)).join('\n')).toContain('unknown lesson h01');
    });
  });

  describe('game tests with keys and clicks (ADR 0011)', () => {
    test('the schema knows the same keys as Python', () => {
      expect(TEST_KEYS).toEqual(KEYS);
    });

    const WALK = `from pyquest import *

x = 300
shots = 0


def update():
    global x, shots
    if key_pressed("left"):
        x -= 4
    if clicked() and mouse_x() > 500:
        shots += 1


def draw():
    draw_image("images/bird.png", x, 100, scale=3)
`;
    const game = (test: Record<string, unknown>, stage?: { width: number; height: number }) => {
      const l = lesson();
      Object.assign(ex(l) as Record<string, unknown>, {
        mode: 'game',
        test: { frames: 30, taps: [], ...test },
        toolbox: [
          'pq_import',
          'pq_assign',
          'pq_aug',
          'pq_def',
          'pq_global',
          'pq_if',
          'pq_key_held',
          'pq_logic',
          'pq_clicked',
          'pq_compare',
          'pq_mouse_x',
          'pq_draw_image_scale',
          'pq_number',
          'pq_text',
          'pq_var_get',
        ],
        goals: [
          { id: 'g-left', label: 'Sang trái', kind: 'moves', sprite: 'bird', axis: 'x', dir: -1 },
          { id: 'g-shot', label: 'Bắn', kind: 'varCompare', name: 'shots', op: '>=', value: 1 },
          {
            id: 'g-far',
            label: 'Đi xa',
            kind: 'varCompare',
            name: 'x',
            op: '<=',
            value: 270,
            when: 'ever',
          },
        ],
        starter: { 'main.py': 'from pyquest import *\n' },
        solution: { 'main.py': WALK },
      });
      const i = input(l);
      if (stage !== undefined) (i.courses[0]!.course as Record<string, unknown>)['stage'] = stage;
      return checkContent(i, py);
    };
    const square = { width: 600, height: 600 };
    const keys = [{ key: 'left', from: 2, to: 11 }];

    test('the solution is graded with the held keys and the clicks', async () => {
      expect(await game({ keys, clicks: [{ frame: 5, x: 560, y: 10 }] }, square)).toEqual([]);
      expect((await game({ clicks: [{ frame: 5, x: 560, y: 10 }] }, square)).join('\n')).toMatch(
        /misses goals g-left, g-far/,
      );
    });

    test('a click outside the stage is reported (400 wide here)', async () => {
      expect((await game({ keys, clicks: [{ frame: 5, x: 560, y: 10 }] })).join('\n')).toContain(
        'outside the 400 × 600 stage',
      );
    });
  });

  test('a goal may name a group of pictures; one that matches nothing is reported', async () => {
    const i = input(lesson());
    const assets = (i.manifest as { assets: Record<string, unknown>[] }).assets;
    assets.push({ ...assets[0], id: 'bird-rong' }, { ...assets[0], id: 'boss-1', group: 'mob' });
    const e = ex(i.courses[0]!.lessons[0]!.json as Record<string, unknown>) as Record<
      string,
      unknown
    >;
    e['solution'] = {
      'main.py': 'from pyquest import *\ndraw_image("images/boss-1.png", 1, 2)\n',
    };
    e['goals'] = [{ id: 'g', label: 'Trùm', kind: 'drew', sprite: 'boss' }];
    expect(await checkContent(i, py)).toEqual([]);
    e['goals'] = [{ id: 'g', label: 'Trùm', kind: 'drewCount', sprite: 'mob', min: 1 }];
    expect((await checkContent(i, py)).join('\n')).toContain('sprite "mob" is not in the asset');
  });

  describe('the drawing studio (rule 12)', () => {
    const studio = (over: Record<string, unknown> = {}) => ({
      stage: { width: 600, height: 600 },
      starter: 'from pyquest import *\n\nclear("white")\ndraw_circle(300, 300, 100, "orange")\n',
      toolbox: ['pq_import', 'pq_clear', 'pq_draw_circle', 'pq_number', 'pq_text'],
      challenges: [
        { id: 'nha', title: 'Ngôi nhà', task: 'Vẽ một ngôi nhà.', hint: 'Mái là tam giác.' },
      ],
      ...over,
    });
    const check = (s: unknown) => checkContent({ ...input(lesson()), studio: s }, py);

    test('a valid studio has no errors', async () => {
      expect(await check(studio())).toEqual([]);
    });

    test('a broken studio file is reported', async () => {
      expect((await check(studio({ challenges: [{ id: 'x' }] }))).join('\n')).toContain(
        'studio/studio.json',
      );
    });

    test('unknown toolbox blocks and blocks the starter needs are reported', async () => {
      const errors = (await check(studio({ toolbox: ['pq_import', 'pq_nope'] }))).join('\n');
      expect(errors).toContain('unknown toolbox block "pq_nope"');
      expect(errors).toMatch(/toolbox lacks blocks the starter uses: .*pq_draw_circle/);
    });

    test('a starter the block editor would change is reported', async () => {
      const errors = await check(
        studio({ starter: 'from pyquest import *\ndraw_circle(300,300,100,"orange")\n' }),
      );
      expect(errors.join('\n')).toContain('does not survive the blocks round trip');
    });

    test('a starter that fails on the studio stage is reported', async () => {
      const errors = await check(
        studio({ starter: 'from pyquest import *\n\ndraw_circle(300, 300, -1, "orange")\n' }),
      );
      expect(errors.join('\n')).toContain('starter fails');
    });
  });
});
