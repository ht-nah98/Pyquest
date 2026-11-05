import { MUSIC, SOUNDS, type DrawEvent } from '@pyquest/runtime';
import { useSyncExternalStore } from 'react';

/**
 * 8-bit sounds and tunes made with Web Audio (ADR 0007): no sound files, nothing to license, works on the LAN
 * without Internet. play_sound / play_music in the child's code arrive here as events (Stage), the app's own
 * sounds (✅ Đạt, ⚠️ lỗi) through uiSound. 🔇 in the top bar silences everything, remembered per device.
 */

const MUTE_KEY = 'pq-mute';
let muted = readMuted();
const listeners = new Set<() => void>();
let ctx: AudioContext | null = null;
let master: GainNode | null = null;

function readMuted(): boolean {
  try {
    return localStorage.getItem(MUTE_KEY) === '1';
  } catch {
    return false;
  }
}

export function setMuted(m: boolean): void {
  muted = m;
  try {
    localStorage.setItem(MUTE_KEY, m ? '1' : '0');
  } catch {
    /* private window: lasts for this tab */
  }
  if (master !== null) master.gain.value = m ? 0 : 1;
  for (const fn of listeners) fn();
}

export function useMuted(): boolean {
  return useSyncExternalStore(
    (fn) => {
      listeners.add(fn);
      return () => listeners.delete(fn);
    },
    () => muted,
  );
}

/** The audio context, made on first use. Browsers start it only after a click or key, so ▶ Chạy calls unlock(). */
function audio(): AudioContext | null {
  if (typeof AudioContext === 'undefined') return null;
  if (ctx === null) {
    ctx = new AudioContext();
    master = ctx.createGain();
    master.gain.value = muted ? 0 : 1;
    master.connect(ctx.destination);
  }
  if (ctx.state === 'suspended') void ctx.resume().catch(() => undefined);
  return ctx;
}

/** Call from a click handler (▶ Chạy, tap on the stage) so sound may start. */
export function unlock(): void {
  audio();
}

const hz = (midi: number) => 440 * 2 ** ((midi - 69) / 12);

/** One note: a wave from f0 to f1 Hz over dur seconds, with a quick fade so it does not click. */
function tone(at: number, f0: number, f1: number, dur: number, type: OscillatorType, vol: number) {
  if (ctx === null || master === null) return;
  const o = ctx.createOscillator();
  const g = ctx.createGain();
  o.type = type;
  o.frequency.setValueAtTime(f0, at);
  o.frequency.exponentialRampToValueAtTime(Math.max(f1, 1), at + dur);
  g.gain.setValueAtTime(vol, at);
  g.gain.exponentialRampToValueAtTime(0.0001, at + dur);
  o.connect(g).connect(master);
  o.start(at);
  o.stop(at + dur + 0.02);
}

/** A burst of noise (crash, thud). */
function noise(at: number, dur: number, vol: number, cutoff: number) {
  if (ctx === null || master === null) return;
  const buf = ctx.createBuffer(1, Math.ceil(ctx.sampleRate * dur), ctx.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
  const src = ctx.createBufferSource();
  src.buffer = buf;
  const f = ctx.createBiquadFilter();
  f.type = 'lowpass';
  f.frequency.value = cutoff;
  const g = ctx.createGain();
  g.gain.setValueAtTime(vol, at);
  g.gain.exponentialRampToValueAtTime(0.0001, at + dur);
  src.connect(f).connect(g).connect(master);
  src.start(at);
}

type Recipe = (t: number) => void;

const SFX: Record<(typeof SOUNDS)[number] | 'ok' | 'oops', Recipe> = {
  flap: (t) => {
    tone(t, 320, 640, 0.09, 'square', 0.12);
  },
  point: (t) => {
    tone(t, hz(81), hz(81), 0.07, 'square', 0.1);
    tone(t + 0.07, hz(88), hz(88), 0.12, 'square', 0.1);
  },
  hit: (t) => {
    noise(t, 0.18, 0.35, 1800);
    tone(t, 140, 50, 0.2, 'triangle', 0.3);
  },
  fall: (t) => {
    tone(t, 700, 120, 0.55, 'triangle', 0.18);
  },
  win: (t) => {
    [72, 76, 79, 84].forEach((n, i) => {
      tone(t + i * 0.09, hz(n), hz(n), 0.14, 'square', 0.09);
    });
  },
  click: (t) => {
    tone(t, 1200, 900, 0.03, 'square', 0.06);
  },
  ok: (t) => {
    [79, 84, 88].forEach((n, i) => {
      tone(t + i * 0.08, hz(n), hz(n), 0.12, 'triangle', 0.16);
    });
  },
  oops: (t) => {
    tone(t, hz(57), hz(57), 0.12, 'triangle', 0.16);
    tone(t + 0.13, hz(52), hz(50), 0.2, 'triangle', 0.16);
  },
};

const lastAt = new Map<string, number>();
/** The same sound again within this many seconds is skipped: play_sound inside update() runs 60 times a second. */
const SAME_SOUND_GAP = 0.09;

/** How many sounds really started (after the same-sound gap), for e2e: data-sounds on the stage. */
let played = 0;
export const soundsPlayed = () => played;

function play(name: keyof typeof SFX) {
  const c = audio();
  if (c === null || muted) return;
  const now = c.currentTime;
  if (now - (lastAt.get(name) ?? -1) < SAME_SOUND_GAP) return;
  lastAt.set(name, now);
  played += 1;
  SFX[name](now + 0.005);
}

/** play_sound("…") from the child's code. Unknown names never get here (Python refuses them). */
export function playSound(name: string): void {
  if ((SOUNDS as readonly string[]).includes(name)) play(name as (typeof SOUNDS)[number]);
}

/** The app's own sounds: ✅ every goal passed, ⚠️ the code stopped on an error. */
export function uiSound(name: 'ok' | 'oops'): void {
  play(name);
}

// ---- Tunes: a melody and a bass line of eighth notes, looped (0 = rest). ----

type Tune = { bpm: number; wave: OscillatorType; melody: number[]; bass: number[] };

const TUNES: Record<(typeof MUSIC)[number], Tune> = {
  happy: {
    bpm: 150,
    wave: 'square',
    melody: [72, 76, 79, 76, 77, 81, 79, 0, 76, 79, 84, 79, 77, 74, 72, 0],
    bass: [48, 0, 55, 0, 53, 0, 55, 0, 48, 0, 55, 0, 50, 0, 43, 0],
  },
  adventure: {
    bpm: 160,
    wave: 'square',
    melody: [69, 0, 72, 76, 74, 72, 71, 0, 69, 72, 76, 81, 79, 76, 74, 0],
    bass: [45, 45, 0, 45, 41, 41, 0, 41, 43, 43, 0, 43, 40, 40, 0, 40],
  },
  calm: {
    bpm: 96,
    wave: 'triangle',
    melody: [77, 0, 81, 0, 84, 0, 81, 0, 79, 0, 76, 0, 77, 0, 0, 0],
    bass: [41, 0, 0, 0, 48, 0, 0, 0, 46, 0, 0, 0, 41, 0, 0, 0],
  },
};

let playing: { name: string; timer: ReturnType<typeof setInterval> } | null = null;

/** play_music("…"): start a looping tune; the same tune again does nothing (draw() runs every frame). */
export function playMusic(name: string | null): void {
  if (name === null) {
    stopMusic();
    return;
  }
  if (playing?.name === name) return;
  stopMusic();
  const tune = TUNES[name as (typeof MUSIC)[number]] as Tune | undefined;
  const c = audio();
  if (tune === undefined || c === null) return;
  const step = 60 / tune.bpm / 2;
  let i = 0;
  let next = c.currentTime + 0.05;
  // Schedule a little ahead on the audio clock, so a busy page does not make the tune stumble.
  const timer = setInterval(() => {
    if (muted) next = Math.max(next, c.currentTime);
    while (next < c.currentTime + 0.15) {
      const m = tune.melody[i % tune.melody.length] ?? 0;
      const b = tune.bass[i % tune.bass.length] ?? 0;
      if (!muted) {
        if (m > 0) tone(next, hz(m), hz(m), step * 0.9, tune.wave, 0.045);
        if (b > 0) tone(next, hz(b), hz(b), step * 0.9, 'triangle', 0.08);
      }
      i += 1;
      next += step;
    }
  }, 25);
  playing = { name, timer };
}

export function stopMusic(): void {
  if (playing === null) return;
  clearInterval(playing.timer);
  playing = null;
}

/** The sound and music events of a run or a frame: play them (pictures are the Stage's job). */
export function hear(events: readonly DrawEvent[]): void {
  for (const e of events) {
    if (e.t === 'sound') playSound(e.name);
    else if (e.t === 'music') playMusic(e.name);
  }
}

/** For tests: which tune is on. */
export function currentMusic(): string | null {
  return playing?.name ?? null;
}
