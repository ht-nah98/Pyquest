import { describe, expect, test } from 'vitest';
import {
  AssetSchema,
  CourseSchema,
  isOpenLesson,
  LibraryRefSchema,
  parseLesson,
  StudioSchema,
} from './index';

/** The first exercise of a test lesson, to change one field. */
const ex = (l: Record<string, unknown>) => (l['exercises'] as Record<string, unknown>[])[0];

function validLesson(): Record<string, unknown> {
  return {
    id: 'l01',
    courseId: 'bay-qua-khe',
    order: 1,
    title: 'Màn hình là tờ giấy kẻ ô',
    steps: [
      { kind: 'understand', slides: [{ id: 's1', text: 'Màn hình có tọa độ.' }] },
      {
        kind: 'design',
        slides: [
          {
            id: 's2',
            quiz: {
              question: 'Chim ở đâu?',
              choices: ['Trên', 'Dưới'],
              answer: 0,
              explain: 'y nhỏ là ở trên.',
            },
          },
        ],
      },
      { kind: 'code', slides: [{ id: 's3', text: 'Vẽ chim.' }] },
      { kind: 'playtest', slides: [{ id: 's4', text: 'Đổi số, chạy lại.' }] },
    ],
    exercises: [
      {
        id: 'l01-e1',
        title: 'Vẽ chim',
        task: 'Vẽ chim ở (100, 300).',
        input: 'blocks',
        starter: { 'main.py': '' },
        main: 'main.py',
        toolbox: ['pq_draw_bird'],
        mode: 'script',
        goals: [
          { id: 'g1', label: 'Không lỗi', kind: 'noError' },
          { id: 'g2', label: 'Vẽ chim ở (100, 300)', kind: 'drew', sprite: 'bird', at: [100, 300] },
        ],
        solution: { 'main.py': 'draw_bird(100, 300)\n' },
      },
    ],
    unlocksRoadmap: ['stage'],
    docsUnlocked: [],
  };
}

describe('parseLesson', () => {
  test('accepts a valid lesson', () => {
    const lesson = parseLesson(validLesson());
    if (!isOpenLesson(lesson)) throw new Error('expected an open lesson');
    expect(lesson.steps).toHaveLength(4);
    expect(lesson.hidden).toBeUndefined();
  });

  test('accepts a hidden stub lesson with only id, title and order', () => {
    const lesson = parseLesson({
      id: 'l05',
      courseId: 'bay-qua-khe',
      order: 5,
      title: 'Lặp lại',
      hidden: true,
    });
    expect(lesson.hidden).toBe(true);
  });

  test('rejects a lesson without an understand step', () => {
    const l = validLesson();
    l['steps'] = (l['steps'] as { kind: string }[]).filter((s) => s.kind !== 'understand');
    expect(() => parseLesson(l)).toThrow(/understand/);
  });

  test('rejects a lesson without a playtest step', () => {
    const l = validLesson();
    l['steps'] = (l['steps'] as { kind: string }[]).filter((s) => s.kind !== 'playtest');
    expect(() => parseLesson(l)).toThrow(/playtest/);
  });

  test('rejects slide text longer than 280 characters', () => {
    const l = validLesson();
    const steps = l['steps'] as { slides: { text?: string }[] }[];
    steps[0]!.slides[0]!.text = 'a'.repeat(281);
    expect(() => parseLesson(l)).toThrow();
  });

  test('rejects a quiz answer outside the choices', () => {
    const l = validLesson();
    const steps = l['steps'] as { slides: { quiz?: { answer: number } }[] }[];
    steps[1]!.slides[0]!.quiz!.answer = 2;
    expect(() => parseLesson(l)).toThrow(/answer/);
  });

  test('exercises need unique ids and say how the child answers (blocks or typing)', () => {
    const l = validLesson();
    const first = ex(l) as Record<string, unknown>;
    l['exercises'] = [first, { ...first }];
    expect(() => parseLesson(l)).toThrow(/duplicate exercise id/);
    l['exercises'] = [{ ...first, input: 'voice' }];
    expect(() => parseLesson(l)).toThrow();
    l['exercises'] = [first, { ...first, id: 'l01-e2', input: 'typing' }];
    expect(isOpenLesson(parseLesson(l)) && parseLesson(l)).toBeTruthy();
  });

  test('a code step needs exercises, and exercises need a code step', () => {
    const l = validLesson();
    delete l['exercises'];
    expect(() => parseLesson(l)).toThrow(/code/);
  });

  test('rejects code.main missing from the starter files', () => {
    const l = validLesson();
    (ex(l) as { main: string }).main = 'game.py';
    expect(() => parseLesson(l)).toThrow(/main/);
  });

  test('rejects a drew goal without a sprite', () => {
    const l = validLesson();
    const code = ex(l) as { goals: Record<string, unknown>[] };
    delete code.goals[1]!['sprite'];
    expect(() => parseLesson(l)).toThrow();
  });

  test('rejects duplicate slide ids', () => {
    const l = validLesson();
    const steps = l['steps'] as { slides: { id: string }[] }[];
    steps[1]!.slides[0]!.id = 's1';
    expect(() => parseLesson(l)).toThrow(/s1/);
  });
});

describe('drafts, summaries, hints and course parts', () => {
  test('a draft lesson with a summary and code hints parses', () => {
    const l = validLesson();
    l['draft'] = true;
    l['summary'] = 'Đặt chim vào đúng chỗ bằng hai con số.';
    (ex(l) as Record<string, unknown>)['hints'] = [
      'Kéo khối "vẽ chim".',
      'Số đầu là x, số sau là y.',
    ];
    const lesson = parseLesson(l);
    if (!isOpenLesson(lesson)) throw new Error('open');
    expect(lesson.draft).toBe(true);
    expect(lesson.exercises?.[0]?.hints).toHaveLength(2);
  });

  test('a summary longer than 120 characters is rejected', () => {
    const l = validLesson();
    l['summary'] = 'a'.repeat(121);
    expect(() => parseLesson(l)).toThrow();
  });

  test('course parts must cover lessonIds in order', () => {
    const base = {
      id: 'c',
      title: 'Khóa',
      summary: 'Tóm tắt.',
      lessonIds: ['l00', 'l01', 'l02'],
      roadmap: [],
    };
    expect(() =>
      CourseSchema.parse({
        ...base,
        parts: [
          { title: 'A', lessonIds: ['l00'] },
          { title: 'B', lessonIds: ['l01', 'l02'] },
        ],
      }),
    ).not.toThrow();
    expect(() =>
      CourseSchema.parse({ ...base, parts: [{ title: 'A', lessonIds: ['l00', 'l02'] }] }),
    ).toThrow(/parts/);
  });
});

describe('walkthrough and the library reference', () => {
  test('code may carry numbered walkthrough steps (at most 8, each ≤ 200 characters)', () => {
    const l = validLesson();
    (ex(l) as Record<string, unknown>)['walkthrough'] = ['Kéo khối "vẽ chim".', 'Sửa hai số.'];
    expect(() => parseLesson(l)).not.toThrow();
    (ex(l) as Record<string, unknown>)['walkthrough'] = ['a'.repeat(201)];
    expect(() => parseLesson(l)).toThrow();
  });

  test('a library entry says what it does, why it exists and the lesson that teaches it', () => {
    const entry = {
      name: 'draw_rect',
      signature: 'draw_rect(x, y, rộng, cao, màu)',
      vi: 'Tô một khối.',
      why: 'Tô từng điểm thì quá lâu.',
      example: 'draw_rect(0, 0, 10, 10, "red")',
      lesson: 'l01',
    };
    const ok = LibraryRefSchema.parse({
      entries: [{ ...entry, inside: '_emit gửi lệnh vẽ cho trang web.' }],
    });
    expect(ok.entries[0]?.why).toBe('Tô từng điểm thì quá lâu.');
    const noWhy = Object.fromEntries(Object.entries(entry).filter(([k]) => k !== 'why'));
    expect(() => LibraryRefSchema.parse({ entries: [noWhy] })).toThrow();
    expect(() => LibraryRefSchema.parse({ entries: [{ name: 'x' }] })).toThrow();
  });

  test('a command no lesson teaches yet may leave out its lesson (ADR 0009)', () => {
    const ok = LibraryRefSchema.parse({
      entries: [
        {
          name: 'draw_circle',
          signature: 'draw_circle(x, y, bán kính, màu)',
          vi: 'Tô một hình tròn.',
          why: 'Ghép hình tròn từ ô vuông thì rất lâu.',
          example: 'draw_circle(300, 300, 100, "gold")',
        },
      ],
    });
    expect(ok.entries[0]?.lesson).toBeUndefined();
  });
});

describe('CourseSchema and AssetSchema', () => {
  test('parse a course and an asset', () => {
    const course = CourseSchema.parse({
      id: 'bay-qua-khe',
      title: 'Bay Qua Khe',
      summary: 'Làm một game bay luồn qua khe.',
      lessonIds: ['l00', 'l01'],
      roadmap: [{ id: 'stage', label: 'Sân khấu' }],
    });
    expect(course.lessonIds).toEqual(['l00', 'l01']);
    expect(course.stage).toBeUndefined();
    const asset = AssetSchema.parse({
      id: 'bird',
      group: 'bird',
      file: 'bird-placeholder.png',
      width: 32,
      height: 24,
      frames: 3,
      credit: 'placeholder',
    });
    expect(asset.frames).toBe(3);
  });

  test('a course may set its stage size; odd sizes are refused (ADR 0009)', () => {
    const base = {
      id: 'hoa-si-code',
      title: 'Họa sĩ Code',
      summary: 'Vẽ tranh bằng code.',
      lessonIds: ['d00'],
      roadmap: [{ id: 'stage', label: 'Sân khấu' }],
    };
    expect(CourseSchema.parse({ ...base, stage: { width: 600, height: 600 } }).stage).toEqual({
      width: 600,
      height: 600,
    });
    expect(() => CourseSchema.parse({ ...base, stage: { width: 600.5, height: 600 } })).toThrow();
    expect(() => CourseSchema.parse({ ...base, stage: { width: 0, height: 600 } })).toThrow();
  });

  test('the drawing studio: stage, starter, toolbox and challenges; long or duplicate challenges are refused', () => {
    const challenge = {
      id: 'nha',
      title: 'Ngôi nhà',
      task: 'Vẽ một ngôi nhà.',
      hint: 'Mái là tam giác.',
    };
    const studio = {
      stage: { width: 600, height: 600 },
      starter: 'from pyquest import *\n',
      toolbox: ['pq_import'],
      challenges: [challenge],
    };
    expect(StudioSchema.parse(studio).challenges).toHaveLength(1);
    expect(() =>
      StudioSchema.parse({ ...studio, challenges: [{ ...challenge, title: 'x'.repeat(41) }] }),
    ).toThrow();
    expect(() => StudioSchema.parse({ ...studio, challenges: [challenge, challenge] })).toThrow(
      /duplicate/,
    );
    expect(() => StudioSchema.parse({ ...studio, toolbox: [] })).toThrow();
  });
});

test('AssetSchema: pixel art is marked with pixel: true, anything else is refused', () => {
  const asset = {
    id: 'ui',
    group: 'ui',
    file: 'ui.png',
    width: 16,
    height: 16,
    frames: 1,
    credit: 'placeholder',
  };
  expect(AssetSchema.parse(asset).pixel).toBeUndefined();
  expect(AssetSchema.parse({ ...asset, pixel: true }).pixel).toBe(true);
  expect(() => AssetSchema.parse({ ...asset, pixel: false })).toThrow();
});
