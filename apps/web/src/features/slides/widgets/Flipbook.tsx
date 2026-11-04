import { useEffect, useState } from 'react';

const FRAMES = 8;
const ys = Array.from({ length: FRAMES }, (_, i) => 30 + i * 22);

/**
 * Bài 6: a cartoon is many still pictures shown fast. Eight frames of the bird, each a little lower;
 * play them slowly, then fast (frames per second) and the stills become movement.
 */
export function Flipbook() {
  const [fps, setFps] = useState(2);
  const [playing, setPlaying] = useState(false);
  const [frame, setFrame] = useState(0);

  useEffect(() => {
    if (!playing) return;
    const id = setInterval(() => {
      setFrame((f) => (f + 1) % FRAMES);
    }, 1000 / fps);
    return () => {
      clearInterval(id);
    };
  }, [playing, fps]);

  return (
    <div className="flex h-full w-full flex-col gap-3" data-testid="flipbook">
      <ol className="grid grid-cols-8 gap-2">
        {ys.map((y, i) => (
          <li key={y}>
            <svg
              viewBox="0 0 60 220"
              className={`h-24 w-full rounded-[6px] border-2 ${i === frame ? 'border-ink bg-sun/40' : 'border-ink/20 bg-white'}`}
            >
              <circle cx={30} cy={y} r={9} fill="#d6342f" stroke="#1b2233" strokeWidth={2} />
            </svg>
            <p className="text-center font-pixel text-base leading-none">{i + 1}</p>
          </li>
        ))}
      </ol>
      <div className="flex min-h-0 flex-1 items-center gap-6">
        <svg
          viewBox="0 0 120 220"
          className="h-full rounded-[10px] border-2 border-ink bg-[#e8f4fb]"
        >
          <circle cx={60} cy={ys[frame]} r={14} fill="#d6342f" stroke="#1b2233" strokeWidth={3} />
        </svg>
        <div className="flex flex-col gap-3 text-lg">
          <button
            type="button"
            className="min-h-11 rounded-[10px] border-2 border-ink bg-go px-4 font-display text-white"
            onClick={() => {
              setPlaying((p) => !p);
            }}
          >
            {playing ? '⏸ Dừng' : '▶ Chiếu'}
          </button>
          <label className="flex flex-col">
            Tốc độ: <b className="font-pixel text-3xl">{fps} khung/giây</b>
            <input
              type="range"
              min={1}
              max={30}
              value={fps}
              onChange={(e) => {
                setFps(Number(e.target.value));
              }}
              data-testid="fps-slider"
            />
          </label>
          <p className="max-w-64 text-base text-ink-soft">
            Chậm thì thấy từng ảnh. Nhanh (từ khoảng 12 khung/giây) thì thành chuyển động.
          </p>
        </div>
      </div>
    </div>
  );
}
