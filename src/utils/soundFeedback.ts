import type { SubmissionKind } from '../types/portal';

export interface ChimeNote {
  frequencyHz: number;
  startOffsetSec: number;
  durationSec: number;
  peakGain: number;
}

export interface AudioParamLike {
  setValueAtTime: (value: number, startTime: number) => void;
  linearRampToValueAtTime: (value: number, endTime: number) => void;
  exponentialRampToValueAtTime: (value: number, endTime: number) => void;
}

export interface GainNodeLike {
  gain: AudioParamLike;
  connect: (destination: unknown) => void;
}

export interface OscillatorNodeLike {
  type: OscillatorType;
  frequency: AudioParamLike;
  connect: (destination: unknown) => void;
  start: (when?: number) => void;
  stop: (when?: number) => void;
  onended: (() => void) | null;
}

export interface AudioContextLike {
  state: AudioContextState;
  currentTime: number;
  destination: unknown;
  resume: () => Promise<void>;
  createOscillator: () => OscillatorNodeLike;
  createGain: () => GainNodeLike;
}

let sharedAudioContext: AudioContextLike | null = null;

/**
 * Pure note specification for the subtle confirmation chime.
 * Soft sine tones under 0.06 gain so feedback feels tactile without startling.
 */
export function buildConfirmationNotes(kind: SubmissionKind): ChimeNote[] {
  if (kind === 'service') {
    // Gentle warm two-note chime (D5 -> A5)
    return [
      { frequencyHz: 587.33, startOffsetSec: 0, durationSec: 0.16, peakGain: 0.045 },
      { frequencyHz: 880.0, startOffsetSec: 0.075, durationSec: 0.26, peakGain: 0.05 },
    ];
  }
  // Gentle calm two-note chime (C5 -> G5)
  return [
    { frequencyHz: 523.25, startOffsetSec: 0, durationSec: 0.16, peakGain: 0.045 },
    { frequencyHz: 783.99, startOffsetSec: 0.075, durationSec: 0.26, peakGain: 0.05 },
  ];
}

function getDefaultAudioContext(): AudioContextLike | null {
  if (typeof window === 'undefined') return null;

  if (sharedAudioContext && sharedAudioContext.state !== 'closed') {
    return sharedAudioContext;
  }

  const win = window as unknown as {
    AudioContext?: new () => AudioContextLike;
    webkitAudioContext?: new () => AudioContextLike;
  };
  const AudioCtx = win.AudioContext || win.webkitAudioContext;
  if (!AudioCtx) return null;

  sharedAudioContext = new AudioCtx();
  return sharedAudioContext;
}

/**
 * Plays a subtle, non-intrusive two-tone confirmation chime using the Web Audio API.
 * Safe in SSR, headless environments, and browsers where audio is blocked.
 */
export async function playSubmissionSuccessSound(
  kind: SubmissionKind = 'issue',
  contextFactory?: () => AudioContextLike | null,
): Promise<boolean> {
  try {
    const ctx = contextFactory ? contextFactory() : getDefaultAudioContext();
    if (!ctx || ctx.state === 'closed') return false;

    if (ctx.state === 'suspended') {
      await ctx.resume();
    }

    const notes = buildConfirmationNotes(kind);
    const baseTime = ctx.currentTime + 0.01;

    for (const note of notes) {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(note.frequencyHz, baseTime + note.startOffsetSec);

      const noteStart = baseTime + note.startOffsetSec;
      const attackEnd = noteStart + 0.014;
      const noteEnd = noteStart + note.durationSec;

      gain.gain.setValueAtTime(0.0001, noteStart);
      gain.gain.linearRampToValueAtTime(note.peakGain, attackEnd);
      gain.gain.exponentialRampToValueAtTime(0.0001, noteEnd);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(noteStart);
      osc.stop(noteEnd + 0.02);
    }

    return true;
  } catch {
    return false;
  }
}
