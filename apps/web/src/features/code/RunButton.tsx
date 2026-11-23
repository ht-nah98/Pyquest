import { python, usePyStatus } from '../../runtime/client';
import { Button } from '../../ui/Button';

/**
 * ▶ Chạy / ■ Dừng, and "try again" when Python did not load. One component for every screen that runs
 * the child's code (AGENTS.md §9.11).
 */
export function RunButton({
  running,
  onRun,
  onStop,
}: {
  running: boolean;
  onRun: () => void;
  onStop: () => void;
}) {
  const status = usePyStatus();
  if (running)
    return (
      <Button tone="oops" onClick={onStop} data-testid="stop" className="flex-1 text-xl">
        ■ Dừng
      </Button>
    );
  if (status === 'failed')
    return (
      <Button
        tone="sun"
        className="flex-1"
        onClick={() => {
          void python.warmUp().catch(() => undefined);
        }}
        data-testid="python-retry"
      >
        ⚠️ Chưa tải được Python. Thử lại
      </Button>
    );
  const waiting = status === 'loading' || status === 'idle';
  return (
    <Button
      tone="go"
      className="flex-1 text-xl"
      onClick={onRun}
      disabled={waiting}
      data-testid="run"
    >
      {waiting ? 'Đang chuẩn bị Python…' : '▶ Chạy'}
    </Button>
  );
}
