import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildConfirmationNotes,
  playSubmissionSuccessSound,
  type AudioContextLike,
} from './soundFeedback';

test('buildConfirmationNotes returns subtle ascending notes for issue and service', () => {
  for (const kind of ['issue', 'service'] as const) {
    const notes = buildConfirmationNotes(kind);
    assert.equal(notes.length, 2);
    assert.ok(notes[0].frequencyHz > 0);
    assert.ok(notes[1].frequencyHz > notes[0].frequencyHz);
    assert.ok(notes[0].peakGain <= 0.08 && notes[1].peakGain <= 0.08);
    assert.ok(notes[1].startOffsetSec > notes[0].startOffsetSec);
    assert.ok(notes[1].startOffsetSec + notes[1].durationSec <= 0.5);
  }
});

test('playSubmissionSuccessSound schedules two sine oscillators and resumes suspended context', async () => {
  let resumed = false;
  const startedOscs: Array<{ type: string; startWhen?: number; stopWhen?: number }> = [];

  const mockCtx: AudioContextLike = {
    state: 'suspended',
    currentTime: 1.5,
    destination: {},
    resume: async () => {
      resumed = true;
      mockCtx.state = 'running';
    },
    createOscillator: () => {
      const record: { type: string; startWhen?: number; stopWhen?: number } = {
        type: 'sine',
      };
      startedOscs.push(record);
      return {
        type: 'sine',
        frequency: {
          setValueAtTime: () => {},
          linearRampToValueAtTime: () => {},
          exponentialRampToValueAtTime: () => {},
        },
        connect: () => {},
        start: (when?: number) => {
          record.startWhen = when;
        },
        stop: (when?: number) => {
          record.stopWhen = when;
        },
        onended: null,
      };
    },
    createGain: () => ({
      gain: {
        setValueAtTime: () => {},
        linearRampToValueAtTime: () => {},
        exponentialRampToValueAtTime: () => {},
      },
      connect: () => {},
    }),
  };

  const played = await playSubmissionSuccessSound('issue', () => mockCtx);
  assert.equal(played, true);
  assert.equal(resumed, true);
  assert.equal(startedOscs.length, 2);
  assert.ok((startedOscs[0].startWhen ?? 0) >= 1.5);
  assert.ok((startedOscs[1].startWhen ?? 0) > (startedOscs[0].startWhen ?? 0));
  assert.ok((startedOscs[1].stopWhen ?? 0) > (startedOscs[1].startWhen ?? 0));
});

test('playSubmissionSuccessSound returns false gracefully when AudioContext is unavailable or fails', async () => {
  const unavailable = await playSubmissionSuccessSound('service', () => null);
  assert.equal(unavailable, false);

  const failed = await playSubmissionSuccessSound('issue', () => {
    throw new Error('Audio blocked');
  });
  assert.equal(failed, false);
});
