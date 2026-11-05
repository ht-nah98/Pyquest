import { setMuted, useMuted } from '../stage/sound';

/** 🔊 / 🔇 for every sound of the app and the child's game, remembered on this device. */
export function MuteButton({ className = '' }: { className?: string }) {
  const muted = useMuted();
  return (
    <button
      type="button"
      className={`min-h-9 min-w-9 rounded-full px-2 text-lg ${className}`}
      onClick={() => {
        setMuted(!muted);
      }}
      aria-pressed={muted}
      title={muted ? 'Bật tiếng' : 'Tắt tiếng'}
      aria-label={muted ? 'Bật tiếng' : 'Tắt tiếng'}
      data-testid="mute"
    >
      {muted ? '🔇' : '🔊'}
    </button>
  );
}
