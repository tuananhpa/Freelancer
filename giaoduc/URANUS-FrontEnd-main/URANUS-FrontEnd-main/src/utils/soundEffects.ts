const SOUND_KEY = 'uranus_sound_enabled';

export function isSoundEnabled(): boolean {
  return localStorage.getItem(SOUND_KEY) !== 'false';
}

export function setSoundEnabled(enabled: boolean): void {
  localStorage.setItem(SOUND_KEY, enabled ? 'true' : 'false');
}

let audioCtx: AudioContext | null = null;

function getCtx(): AudioContext | null {
  if (!isSoundEnabled()) return null;
  try {
    if (!audioCtx) audioCtx = new AudioContext();
    if (audioCtx.state === 'suspended') audioCtx.resume();
    return audioCtx;
  } catch {
    return null;
  }
}

function playTone(freq: number, duration: number, type: OscillatorType = 'sine', volume = 0.12) {
  const ctx = getCtx();
  if (!ctx) return;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.frequency.value = freq;
  osc.type = type;
  gain.gain.setValueAtTime(volume, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
  osc.start(ctx.currentTime);
  osc.stop(ctx.currentTime + duration);
}

export const sounds = {
  correct() {
    playTone(523.25, 0.08);
    setTimeout(() => playTone(659.25, 0.1), 70);
    setTimeout(() => playTone(783.99, 0.14), 140);
  },
  wrong() {
    playTone(220, 0.15, 'sawtooth', 0.08);
    setTimeout(() => playTone(185, 0.2, 'sawtooth', 0.06), 100);
  },
  submit() {
    playTone(392, 0.1);
    setTimeout(() => playTone(523.25, 0.1), 90);
    setTimeout(() => playTone(659.25, 0.18), 180);
  },
  streak() {
    [523.25, 659.25, 783.99, 1046.5].forEach((f, i) => {
      setTimeout(() => playTone(f, 0.12, 'triangle', 0.1), i * 90);
    });
  },
  levelUp() {
    [440, 554.37, 659.25, 880].forEach((f, i) => {
      setTimeout(() => playTone(f, 0.15, 'sine', 0.11), i * 100);
    });
  },
  tap() {
    playTone(800, 0.04, 'sine', 0.05);
  },
};
