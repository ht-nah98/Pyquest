import type { StageSize } from '@pyquest/runtime';
import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router';
import { problemOf } from '../../runtime/broken';
import type { StageHandle } from '../../stage/Stage';
import { useGameKeys } from '../../stage/useGameKeys';
import { useGameLoop } from '../../stage/useGameLoop';
import { PlayFrame } from '../code/PlayFrame';

// A glob, not an import: the file may not be there (yet).
const sources = import.meta.glob<string>('../../../../../tools/prototypes/ham-ngoc/main.py', {
  eager: true,
  query: '?raw',
  import: 'default',
});
const SOURCE = Object.values(sources)[0];
const MAIN = 'main.py';
const SIZE: StageSize = { width: 600, height: 600 };

/** /coach/prototype, dev server only: the coach plays the game being made, before any lesson about it exists. */
export function PrototypePlay() {
  const navigate = useNavigate();
  const stage = useRef<StageHandle>(null);
  const [error, setError] = useState<string | null>(
    SOURCE === undefined ? 'Chưa có game thử (tools/prototypes/ham-ngoc/main.py).' : null,
  );
  const loop = useGameLoop(stage, (r) => {
    const problem = problemOf(r);
    if (problem !== null) setError(problem);
  });
  useGameKeys(true, loop.press);
  const { start } = loop;

  useEffect(() => {
    if (SOURCE !== undefined) void start({ [MAIN]: SOURCE }, MAIN, SIZE);
  }, [start]);

  return (
    <PlayFrame
      stage={stage}
      size={SIZE}
      pointer={loop.pointer}
      error={error}
      backLabel="Về"
      onAgain={() => {
        if (SOURCE === undefined) return;
        setError(null);
        void start({ [MAIN]: SOURCE }, MAIN, SIZE);
      }}
      onBack={() => {
        loop.stop();
        void navigate('/courses');
      }}
    />
  );
}
