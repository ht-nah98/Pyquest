import { useEffect, useRef, useState } from 'react';

const H = 420;

/**
 * Gravity on a slider: each frame speed += gravity, y += speed. The dots show one position per frame,
 * so the child sees the gaps grow — falling faster and faster (Bài 7, Bài 0).
 */
export function Gravity() {
  const [gravity, setGravity] = useState(0.4);
  const [dots, setDots] = useState<number[]>([]);
  const [speed, setSpeed] = useState(0);
  const raf = useRef(0);

  useEffect(
    () => () => {
      cancelAnimationFrame(raf.current);
    },
    [],
  );

  const drop = () => {
    cancelAnimationFrame(raf.current);
    let y = 10;
    let v = 0;
    const ys: number[] = [y];
    let frame = 0;
    const tick = () => {
      frame += 1;
      if (frame % 3 === 0) {
        v += gravity;
        y += v;
        ys.push(Math.min(y, H - 10));
        setDots([...ys]);
        setSpeed(v);
      }
      if (y < H - 10) raf.current = requestAnimationFrame(tick);
    };
    setDots(ys);
    raf.current = requestAnimationFrame(tick);
  };

  return (
    <div className="flex h-full min-h-60 items-start gap-6" data-testid="gravity">
      <svg
        viewBox={`0 0 120 ${String(H)}`}
        className="h-full max-h-[440px] rounded-[10px] border-2 border-ink bg-[#e8f4fb]"
      >
        <rect x={0} y={H - 10} width={120} height={10} fill="#5aa36a" />
        {dots.map((y, i) => (
          <circle
            key={i}
            cx={60}
            cy={y}
            r={i === dots.length - 1 ? 9 : 3}
            fill={i === dots.length - 1 ? '#d6342f' : '#3776ab'}
          />
        ))}
      </svg>
      <div className="flex flex-col gap-3 text-lg">
        <label className="flex flex-col gap-1">
          Trọng lực: <b className="font-pixel text-3xl">{gravity.toFixed(1)}</b>
          <input
            type="range"
            min={0.1}
            max={1}
            step={0.1}
            value={gravity}
            onChange={(e) => {
              setGravity(Number(e.target.value));
            }}
            className="w-56"
            data-testid="gravity-slider"
          />
        </label>
        <button
          type="button"
          className="min-h-11 rounded-[10px] border-2 border-ink bg-sun px-4 font-display"
          onClick={drop}
        >
          Thả chim ↓
        </button>
        <p>
          Tốc độ lúc chạm đất: <b className="font-pixel text-3xl">{speed.toFixed(1)}</b>
        </p>
        <p className="max-w-64 text-base text-ink-soft">
          Mỗi chấm là một khung hình. Khoảng cách giãn dần: chim rơi nhanh dần.
        </p>
      </div>
    </div>
  );
}
