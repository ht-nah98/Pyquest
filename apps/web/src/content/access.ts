import type { Role } from '../storage/store';
import type { CatalogCourse } from './catalog';

/** A draft course is the coach's only (AGENTS.md §9.5, ADR 0011). */
export function seesCourse(course: CatalogCourse, role: Role): boolean {
  return role === 'coach' || course.draft !== true;
}

/** May this person open this lesson's pages by address? Not a child in a draft course, nor a draft lesson. */
export function opensLesson(course: CatalogCourse, lessonId: string, role: Role): boolean {
  if (role === 'coach') return true;
  const lesson = course.lessons.find((l) => l.id === lessonId);
  return seesCourse(course, role) && lesson?.draft !== true;
}
