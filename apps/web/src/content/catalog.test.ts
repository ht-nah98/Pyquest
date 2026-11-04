import { describe, expect, test } from 'vitest';
import { catalog } from './catalog';

describe('catalog', () => {
  test('loads Bay Qua Khe with 18 lessons in order', () => {
    const course = catalog.course('bay-qua-khe');
    expect(course?.lessons.map((l) => l.order)).toEqual([...Array(18).keys()]);
  });

  test('every lesson is written; drafts open by id (the coach decides who sees them)', () => {
    const course = catalog.course('bay-qua-khe');
    expect(course?.lessons.every((l) => l.hidden !== true)).toBe(true);
    expect(catalog.openLesson('l10')?.title).toBe('Tự đặt lệnh');
    expect(catalog.openLesson('l01')?.title).toBe('Màn hình là tờ giấy kẻ ô');
  });

  test('the sample game source and the asset urls are available', () => {
    expect(catalog.course('bay-qua-khe')?.sampleGame).toContain('def update');
    expect(catalog.assetUrl('bird')).toBeDefined();
    expect(catalog.asset('bird')?.frames).toBe(3);
  });
});
