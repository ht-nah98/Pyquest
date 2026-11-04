import type { ReactNode } from 'react';
import { createBrowserRouter, Navigate } from 'react-router';
import { CourseList } from '../features/course/CourseList';
import { CourseMap } from '../features/course/CourseMap';
import { ProfilePicker } from '../features/profile/ProfilePicker';
import { CodeScreen } from '../features/code/CodeScreen';
import { PlayScreen } from '../features/code/PlayScreen';
import { CoachNotesWindow } from '../features/slides/CoachNotesWindow';
import { LessonSlides } from '../features/slides/LessonSlides';
import { useSession } from './session';

function NeedProfile({ children }: { children: ReactNode }) {
  const { profile, ready } = useSession();
  if (!ready) return null;
  return profile === null ? <Navigate to="/" replace /> : children;
}

const guard = (el: ReactNode) => <NeedProfile>{el}</NeedProfile>;

export const router = createBrowserRouter([
  { path: '/', element: <ProfilePicker /> },
  { path: '/courses', element: guard(<CourseList />) },
  { path: '/c/:courseId', element: guard(<CourseMap />) },
  { path: '/l/:lessonId', element: guard(<LessonSlides />) },
  { path: '/l/:lessonId/notes', element: guard(<CoachNotesWindow />) },
  { path: '/l/:lessonId/code', element: guard(<CodeScreen />) },
  { path: '/l/:lessonId/play', element: guard(<PlayScreen />) },
]);
