import type { StudioTemplate } from '@pyquest/content-schema';
import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { useSession } from '../../app/session';
import { catalog } from '../../content/catalog';
import { Button } from '../../ui/Button';
import { Panel } from '../../ui/Panel';
import { TopBar } from '../../ui/TopBar';
import {
  cleanTitle,
  createDrawing,
  deleteDrawing,
  drawingsOf,
  MAX_DRAWINGS,
  MAX_TITLE,
  renameDrawing,
  type Drawing,
} from './drawings';
import { TemplatePicker } from './TemplatePicker';

const when = (ms: number) =>
  new Date(ms).toLocaleString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });

/** 🎨 Xưởng vẽ: the child's drawings. New, open, rename, delete (spec 2026-11-23 §6). */
export function StudioList() {
  const { store, profile } = useSession();
  const navigate = useNavigate();
  const [drawings, setDrawings] = useState<Drawing[] | null>(null);
  const [renaming, setRenaming] = useState<{ id: string; title: string } | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const [picking, setPicking] = useState(false);
  const profileId = profile?.id;
  const studio = catalog.studio();

  const reload = async () => {
    if (profileId === undefined) return;
    setDrawings(drawingsOf(await store.allLessonStates(profileId)));
  };

  // Load again when the store changes (cloud sign-in swaps it).
  useEffect(() => {
    if (profileId === undefined) return;
    void store.allLessonStates(profileId).then((m) => {
      setDrawings(drawingsOf(m));
    });
  }, [store, profileId]);

  if (studio === undefined) return <p className="p-8">Chưa có Xưởng vẽ.</p>;
  const full = drawings !== null && drawings.length >= MAX_DRAWINGS;

  /** ✏️ a free drawing, or 📐 one that traces a template. */
  const create = async (template?: StudioTemplate) => {
    if (profileId === undefined) return;
    const id = await createDrawing(
      store,
      profileId,
      studio.starter,
      Date.now(),
      template === undefined ? undefined : { id: template.id, title: template.title },
    );
    if (id === null) {
      setMsg(`Em đã có ${String(MAX_DRAWINGS)} tranh rồi. Xóa bớt tranh cũ để vẽ tranh mới nhé.`);
      return;
    }
    void navigate(`/studio/${id}`);
  };

  const saveName = async () => {
    if (renaming === null || profileId === undefined) return;
    await renameDrawing(store, profileId, renaming.id, renaming.title);
    setRenaming(null);
    await reload();
  };

  const remove = async (d: Drawing) => {
    if (profileId === undefined) return;
    if (!window.confirm(`Xóa tranh "${d.title}"? Xóa rồi thì không lấy lại được.`)) return;
    await deleteDrawing(store, profileId, d.id);
    setMsg(null);
    await reload();
  };

  return (
    <div className="flex h-dvh flex-col">
      <TopBar title="🎨 Xưởng vẽ" back="/courses" />
      <main className="min-h-0 flex-1 overflow-y-auto">
        <div className="mx-auto flex max-w-5xl flex-col gap-4 px-4 py-6">
          <Panel className="flex flex-wrap items-center gap-4 p-5">
            <div className="min-w-0 flex-1">
              <h2 className="text-3xl text-brand-deep">Vẽ gì cũng được!</h2>
              <p className="mt-1 text-lg text-ink-soft">
                Vẽ bằng khối hoặc gõ code, lưu thành nhiều tranh, tải tranh về máy.
              </p>
            </div>
            <span className="font-pixel text-2xl" data-testid="drawing-count">
              {drawings?.length ?? 0}/{MAX_DRAWINGS} tranh
            </span>
            <div className="flex flex-wrap gap-2">
              <Button
                tone="go"
                className="min-h-14 px-6 text-2xl"
                onClick={() => void create()}
                disabled={drawings === null || full}
                data-testid="new-drawing"
              >
                ✏️ Vẽ sáng tạo
              </Button>
              {studio.templates.length > 0 && (
                <Button
                  tone="sun"
                  className="min-h-14 px-6 text-2xl"
                  onClick={() => {
                    setPicking((p) => !p);
                  }}
                  disabled={drawings === null || full}
                  aria-expanded={picking}
                  data-testid="trace-mode"
                >
                  📐 Vẽ theo mẫu
                </Button>
              )}
            </div>
          </Panel>
          {picking && (
            <Panel className="p-5">
              <TemplatePicker
                templates={studio.templates}
                stage={studio.stage}
                onPick={(t) => void create(t)}
                disabled={drawings === null || full}
              />
            </Panel>
          )}
          {(msg !== null || full) && (
            <p className="rounded-[8px] bg-sun/40 px-3 py-2" role="status" data-testid="studio-msg">
              {msg ??
                `Em đã có ${String(MAX_DRAWINGS)} tranh rồi. Xóa bớt tranh cũ để vẽ tranh mới nhé.`}
            </p>
          )}
          {drawings !== null && drawings.length === 0 && (
            <p className="py-8 text-center text-xl text-ink-soft" data-testid="no-drawings">
              Chưa có tranh nào. Bấm ✏️ Vẽ sáng tạo hoặc 📐 Vẽ theo mẫu để bắt đầu nhé!
            </p>
          )}
          <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {drawings?.map((d) => (
              <li key={d.id} data-testid={`drawing-${d.id}`}>
                <Panel className="flex h-full flex-col gap-3 p-4">
                  {renaming?.id === d.id ? (
                    <form
                      className="flex gap-2"
                      onSubmit={(e) => {
                        e.preventDefault();
                        void saveName();
                      }}
                    >
                      <input
                        value={renaming.title}
                        maxLength={MAX_TITLE}
                        onChange={(e) => {
                          setRenaming({ id: d.id, title: e.target.value });
                        }}
                        aria-label="Tên mới của tranh"
                        className="min-h-11 min-w-0 flex-1 rounded-[10px] border-2 border-ink bg-white px-3 text-lg"
                        data-testid="rename-input"
                        autoFocus
                      />
                      <Button tone="go" type="submit" data-testid="rename-save">
                        Lưu
                      </Button>
                    </form>
                  ) : (
                    <Link
                      to={`/studio/${d.id}`}
                      className="font-display text-2xl font-extrabold text-brand-deep hover:underline"
                      data-testid="open-drawing"
                    >
                      🖼️ {d.title}
                    </Link>
                  )}
                  <p className="text-sm text-ink-soft">Sửa lần cuối: {when(d.changedAt)}</p>
                  <div className="mt-auto flex flex-wrap gap-2">
                    <Link to={`/studio/${d.id}`} className="flex-1">
                      <Button tone="brand" className="w-full">
                        Mở tranh
                      </Button>
                    </Link>
                    <Button
                      title="Đổi tên"
                      onClick={() => {
                        setRenaming(
                          renaming?.id === d.id ? null : { id: d.id, title: cleanTitle(d.title) },
                        );
                      }}
                      data-testid="rename"
                    >
                      ✏️
                    </Button>
                    <Button
                      title="Xóa tranh"
                      tone="oops"
                      onClick={() => void remove(d)}
                      data-testid="delete"
                    >
                      🗑️
                    </Button>
                  </div>
                </Panel>
              </li>
            ))}
          </ul>
        </div>
      </main>
    </div>
  );
}
