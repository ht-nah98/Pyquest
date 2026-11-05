import type { ReactNode } from 'react';
import { createBrowserRouter, Navigate } from 'react-router';
import { CourseList } from '../features/course/CourseList';
import { CourseMap } from '../features/course/CourseMap';
import { LoginScreen } from '../features/profile/LoginScreen';
import { ProfilePicker } from '../features/profile/ProfilePicker';
import { CoachHome } from '../features/coach/CoachHome';
import { CoachStudent } from '../features/coach/CoachStudent';
import { CoachCode } from '../features/coach/CoachCode';
import { cloud } from '../cloud/client';
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

function NeedCoach({ children }: { children: ReactNode }) {
  const { profile, ready } = useSession();
  if (!ready) return null;
  return profile?.role === 'coach' ? children : <Navigate to="/" replace />;
}

const coachOnly = (el: ReactNode) => <NeedCoach>{el}</NeedCoach>;

/** With Supabase, '/' is sign-in; without it, the on-device profile picker (spec 2026-11-05 §6). */
function Home() {
  const { profile, ready } = useSession();
  if (!ready) return null;
  if (cloud === null) return <ProfilePicker />;
  return profile === null ? <LoginScreen /> : <Navigate to="/courses" replace />;
}

export const router = createBrowserRouter(
  [
    { path: '/', element: <Home /> },
    { path: '/courses', element: guard(<CourseList />) },
    { path: '/c/:courseId', element: guard(<CourseMap />) },
    { path: '/l/:lessonId', element: guard(<LessonSlides />) },
    { path: '/l/:lessonId/notes', element: guard(<CoachNotesWindow />) },
    { path: '/l/:lessonId/code', element: guard(<CodeScreen />) },
    { path: '/l/:lessonId/play', element: guard(<PlayScreen />) },
    { path: '/coach', element: coachOnly(<CoachHome />) },
    { path: '/coach/s/:userId', element: coachOnly(<CoachStudent />) },
    { path: '/coach/s/:userId/l/:lessonId', element: coachOnly(<CoachCode />) },
    // On GitHub Pages the app lives under /Pyquest/ (vite `base`); locally under /.
  ],
  { basename: import.meta.env.BASE_URL.replace(/\/$/, '') || '/' },
);
