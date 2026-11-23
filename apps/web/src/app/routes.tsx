import type { ReactNode } from 'react';
import { createBrowserRouter, Navigate, type RouteObject } from 'react-router';
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
import { StudioEditor } from '../features/studio/StudioEditor';
import { StudioList } from '../features/studio/StudioList';
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

/**
 * Dev server only (ADR 0010): `npm run build` drops this branch, so an unfinished game never reaches the
 * children's site (AGENTS.md §9.5).
 */
const devRoutes: RouteObject[] = import.meta.env.DEV
  ? [
      {
        path: '/coach/prototype',
        hydrateFallbackElement: <></>,
        lazy: async () => {
          const { PrototypePlay } = await import('../features/coach/PrototypePlay');
          return { element: coachOnly(<PrototypePlay />) };
        },
      },
    ]
  : [];

export const router = createBrowserRouter(
  [
    { path: '/', element: <Home /> },
    { path: '/courses', element: guard(<CourseList />) },
    { path: '/c/:courseId', element: guard(<CourseMap />) },
    { path: '/l/:lessonId', element: guard(<LessonSlides />) },
    { path: '/l/:lessonId/notes', element: guard(<CoachNotesWindow />) },
    { path: '/l/:lessonId/code', element: guard(<CodeScreen />) },
    { path: '/l/:lessonId/play', element: guard(<PlayScreen />) },
    { path: '/studio', element: guard(<StudioList />) },
    { path: '/studio/:drawingId', element: guard(<StudioEditor />) },
    { path: '/coach', element: coachOnly(<CoachHome />) },
    { path: '/coach/s/:userId', element: coachOnly(<CoachStudent />) },
    { path: '/coach/s/:userId/l/:lessonId', element: coachOnly(<CoachCode />) },
    { path: '/coach/s/:userId/studio/:drawingId', element: coachOnly(<CoachCode />) },
    ...devRoutes,
    // On GitHub Pages the app lives under /Pyquest/ (vite `base`); locally under /.
  ],
  { basename: import.meta.env.BASE_URL.replace(/\/$/, '') || '/' },
);
