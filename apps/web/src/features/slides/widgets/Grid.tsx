import { useState } from 'react';

const W = 400;
const H = 600;

/** A tappable coordinate grid: tap anywhere to see (x, y). Teaches the y-down screen (Bài 1). */
export function Grid() {
  const [pt, setPt] = useState<{ x: number; y: number } | null>(null);
  const lines = [];
  for (let x = 0; x <= W; x += 50) {
    lines.push(
      <line
        key={`x${String(x)}`}
        x1={x}
        y1={0}
        x2={x}
        y2={H}
        stroke="#55607a"
        strokeOpacity={x % 100 === 0 ? 0.5 : 0.2}
      />,
    );
  }
  for (let y = 0; y <= H; y += 50) {
    lines.push(
      <line
        key={`y${String(y)}`}
        x1={0}
        y1={y}
        x2={W}
        y2={y}
        stroke="#55607a"
        strokeOpacity={y % 100 === 0 ? 0.5 : 0.2}
      />,
    );
  }
  return (
    <div className="flex h-full min-h-60 items-start gap-4">
      <svg
        viewBox={`-52 -28 ${String(W + 64)} ${String(H + 40)}`}
        className="h-full max-h-[440px] touch-none rounded-[10px] border-2 border-ink bg-white"
        data-testid="grid"
        onPointerDown={(e) => {
          const svg = e.currentTarget;
          const p = svg.createSVGPoint();
          p.x = e.clientX;
          p.y = e.clientY;
          const m = svg.getScreenCTM();
          if (m === null) return;
          const q = p.matrixTransform(m.inverse());
          const x = Math.round(Math.max(0, Math.min(W, q.x)) / 10) * 10;
          const y = Math.round(Math.max(0, Math.min(H, q.y)) / 10) * 10;
          setPt({ x, y });
        }}
      >
        <rect x={0} y={0} width={W} height={H} fill="#e8f4fb" />
        {lines}
        {[0, 100, 200, 300, 400].map((x) => (
          <text
            key={`tx${String(x)}`}
            x={x}
            y={-8}
            fontSize={20}
            textAnchor="middle"
            fill="#1b2233"
          >
            {x}
          </text>
        ))}
        {[0, 100, 200, 300, 400, 500, 600].map((y) => (
          <text
            key={`ty${String(y)}`}
            x={-6}
            y={y + 5}
            fontSize={20}
            textAnchor="end"
            fill="#1b2233"
          >
            {y}
          </text>
        ))}
        <text x={W - 4} y={-8} fontSize={20} textAnchor="end" fill="#3776ab">
          x →
        </text>
        <text x={-6} y={H + 4} fontSize={20} textAnchor="end" fill="#3776ab">
          y ↓
        </text>
        {pt !== null && (
          <g>
            <circle cx={pt.x} cy={pt.y} r={8} fill="#ffd43b" stroke="#1b2233" strokeWidth={3} />
            <text
              x={pt.x + 12}
              y={pt.y - 12}
              fontSize={26}
              fontFamily="VT323, monospace"
              fill="#1b2233"
              data-testid="grid-point"
            >
              ({pt.x}, {pt.y})
            </text>
          </g>
        )}
      </svg>
      <p className="max-w-56 text-base text-ink-soft">Bấm vào lưới. Điểm em bấm có tọa độ nào?</p>
    </div>
  );
}
