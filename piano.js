/**
 * Realistic Piano Synthesizer using Web Audio API
 *
 * Sound design approach:
 *  - 3 slightly-detuned oscillators per voice to simulate multiple piano strings
 *  - Inharmonic upper partials (real piano strings are slightly stiff)
 *  - Fast percussive attack + long exponential decay (piano envelope)
 *  - Dynamic lowpass filter that opens on attack and closes during decay
 *  - Short convolution reverb synthesised from noise bursts
 *  - Keyboard + mouse/touch input
 */

const AudioContext = window.AudioContext || window.webkitAudioContext;
let audioCtx = null;
let reverbNode = null;
let masterGain = null;

// ─── Sound design constants ───────────────────────────────────────────────────

/** Shortest decay time (seconds) – bright/high notes ring briefly */
const MIN_DECAY_TIME = 0.8;
/** Longest decay time (seconds) – low bass notes can ring for ~3.5 s */
const MAX_DECAY_TIME = 3.5;
/** Frequency of the lowest A on a standard piano (A0 = 27.5 Hz) */
const REFERENCE_FREQ_A0 = 27.5;
/** Number of semitone doublings across the full 88-key range (7 octaves) */
const PIANO_OCTAVE_SPAN = 7;

/** Duration of the hammer-noise burst that simulates key strike (seconds) */
const HAMMER_CLICK_DURATION_SEC = 0.015;

/**
 * Maximum lowpass cutoff as a multiple of the fundamental.
 * Keeping it well below Nyquist ensures no aliasing artefacts.
 */
const MAX_HARMONIC_MULTIPLIER = 18;
/** Safety divisor so the max cutoff stays below the Nyquist frequency */
const NYQUIST_SAFETY_DIVISOR  = 2.2;
/** Steady-state cutoff as a multiple of the fundamental (warmth floor) */
const MIN_HARMONIC_MULTIPLIER = 3.5;
/** Absolute minimum cutoff in Hz, prevents audible ring on very low notes */
const ABSOLUTE_MIN_CUTOFF_HZ  = 300;

// ─── Reverb ───────────────────────────────────────────────────────────────────

function buildReverb(ctx) {
  const convolver = ctx.createConvolver();
  const rate = ctx.sampleRate;
  const length = rate * 1.8;          // ~1.8 s tail
  const impulse = ctx.createBuffer(2, length, rate);

  for (let ch = 0; ch < 2; ch++) {
    const data = impulse.getChannelData(ch);
    for (let i = 0; i < length; i++) {
      // exponentially-decaying white noise → room impulse response
      data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / length, 3.5);
    }
  }
  convolver.buffer = impulse;
  return convolver;
}

// ─── Audio context init ───────────────────────────────────────────────────────

function initAudio() {
  if (audioCtx) return;
  audioCtx = new AudioContext();

  masterGain = audioCtx.createGain();
  masterGain.gain.value = 0.9;

  reverbNode = buildReverb(audioCtx);

  const reverbGain = audioCtx.createGain();
  reverbGain.gain.value = 0.18;       // subtle room reverb

  reverbNode.connect(reverbGain);
  reverbGain.connect(masterGain);
  masterGain.connect(audioCtx.destination);
}

// ─── Note → frequency ────────────────────────────────────────────────────────

const NOTE_NAMES = ['C','C#','D','D#','E','F','F#','G','G#','A','A#','B'];

function noteToFrequency(note, octave) {
  const semitone = NOTE_NAMES.indexOf(note);
  // A4 = 440 Hz, MIDI note 69
  const midi = (octave + 1) * 12 + semitone;
  return 440 * Math.pow(2, (midi - 69) / 12);
}

// ─── Piano voice synthesis ────────────────────────────────────────────────────

/*
 * A single piano strike is modelled as:
 *
 *   [oscillator bank] → [filter] → [amp envelope] → [dry mix] → master
 *                                                 ↘ [reverb send]
 *
 * Oscillator bank: 3 strings slightly detuned + 2 partials with inharmonic ratio
 */

const activeNotes = {};   // key → { stop() }

function playNote(noteKey, velocity = 0.8) {
  if (!audioCtx) return;
  if (audioCtx.state === 'suspended') audioCtx.resume();
  stopNote(noteKey);      // re-trigger (no hanging notes)

  const freq = noteKey;   // noteKey is already a frequency number here
  const now  = audioCtx.currentTime;

  // Decay time scales with pitch: lower notes ring longer
  const decayTime = Math.max(
    MIN_DECAY_TIME,
    MAX_DECAY_TIME - (Math.log2(freq / REFERENCE_FREQ_A0) / PIANO_OCTAVE_SPAN) * MAX_DECAY_TIME
  );

  // ── Oscillator bank ──────────────────────────────────────────────────────
  // String 1: fundamental, slightly flat
  // String 2: fundamental, in tune
  // String 3: fundamental, slightly sharp  (unison chorus → warmth)
  // Partial 4: 2nd harmonic, inharmonic (+3 cents)
  // Partial 5: 3rd harmonic, inharmonic (+8 cents)

  const stringDefs = [
    { ratio: 1.000, detune: -4,  gainScale: 0.55 },
    { ratio: 1.000, detune:  0,  gainScale: 0.55 },
    { ratio: 1.000, detune: +4,  gainScale: 0.55 },
    { ratio: 2.001, detune:  0,  gainScale: 0.25 },  // slightly inharmonic
    { ratio: 3.004, detune:  0,  gainScale: 0.12 },
    { ratio: 4.010, detune:  0,  gainScale: 0.05 },
  ];

  const oscillators = [];
  const oscMixer = audioCtx.createGain();
  oscMixer.gain.value = 1 / stringDefs.length;

  for (const def of stringDefs) {
    const osc = audioCtx.createOscillator();
    osc.type = 'triangle';
    osc.frequency.value = freq * def.ratio;
    osc.detune.value = def.detune;

    const oscGain = audioCtx.createGain();
    oscGain.gain.value = def.gainScale;

    osc.connect(oscGain);
    oscGain.connect(oscMixer);
    osc.start(now);
    oscillators.push(osc);
  }

  // ── Hammer click (percussive transient) ──────────────────────────────────
  const noiseBuffer = audioCtx.createBuffer(1, audioCtx.sampleRate * HAMMER_CLICK_DURATION_SEC, audioCtx.sampleRate);
  const noiseData = noiseBuffer.getChannelData(0);
  for (let i = 0; i < noiseData.length; i++) noiseData[i] = Math.random() * 2 - 1;

  const noise = audioCtx.createBufferSource();
  noise.buffer = noiseBuffer;

  const noiseFilter = audioCtx.createBiquadFilter();
  noiseFilter.type = 'bandpass';
  noiseFilter.frequency.value = freq * 2;
  noiseFilter.Q.value = 1.5;

  const noiseGain = audioCtx.createGain();
  noiseGain.gain.setValueAtTime(velocity * 0.3, now);
  noiseGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.025);

  noise.connect(noiseFilter);
  noiseFilter.connect(noiseGain);
  noiseGain.connect(oscMixer);
  noise.start(now);

  // ── Lowpass filter (opens on attack, closes during decay) ────────────────
  const lpFilter = audioCtx.createBiquadFilter();
  lpFilter.type = 'lowpass';
  lpFilter.Q.value = 1.2;

  const maxCutoff = Math.min(freq * MAX_HARMONIC_MULTIPLIER, audioCtx.sampleRate / NYQUIST_SAFETY_DIVISOR);
  const minCutoff = Math.max(freq * MIN_HARMONIC_MULTIPLIER, ABSOLUTE_MIN_CUTOFF_HZ);

  lpFilter.frequency.setValueAtTime(freq * 3, now);
  lpFilter.frequency.linearRampToValueAtTime(maxCutoff, now + 0.004);
  lpFilter.frequency.exponentialRampToValueAtTime(minCutoff, now + decayTime * 0.9);

  // ── Amplitude envelope ───────────────────────────────────────────────────
  const ampEnv = audioCtx.createGain();
  ampEnv.gain.setValueAtTime(0, now);
  ampEnv.gain.linearRampToValueAtTime(velocity, now + 0.003);        // attack ~3 ms
  ampEnv.gain.exponentialRampToValueAtTime(velocity * 0.35, now + 0.12);  // initial drop
  ampEnv.gain.exponentialRampToValueAtTime(0.0001, now + decayTime); // long decay

  // ── Routing: dry + reverb send ───────────────────────────────────────────
  oscMixer.connect(lpFilter);
  lpFilter.connect(ampEnv);

  const dryGain = audioCtx.createGain();
  dryGain.gain.value = 0.82;
  ampEnv.connect(dryGain);
  dryGain.connect(masterGain);

  const sendGain = audioCtx.createGain();
  sendGain.gain.value = 0.35;
  ampEnv.connect(sendGain);
  sendGain.connect(reverbNode);

  // ── Release (key-up) handler ─────────────────────────────────────────────
  const stopFn = (releaseTime = 0.25) => {
    const t = audioCtx.currentTime;
    ampEnv.gain.cancelScheduledValues(t);
    ampEnv.gain.setValueAtTime(ampEnv.gain.value, t);
    ampEnv.gain.exponentialRampToValueAtTime(0.0001, t + releaseTime);
    oscillators.forEach(o => o.stop(t + releaseTime + 0.05));
  };

  // Auto-stop after full decay
  oscillators.forEach(o => o.stop(now + decayTime + 0.2));

  activeNotes[noteKey] = { stop: stopFn };
}

function stopNote(noteKey) {
  if (activeNotes[noteKey]) {
    activeNotes[noteKey].stop();
    delete activeNotes[noteKey];
  }
}

// ─── Keyboard layout ──────────────────────────────────────────────────────────

/*
 * We render 4 octaves (C2 – B5) which covers the most-played register.
 * Computer keyboard is mapped across 2 octaves for easy playing.
 */

const OCTAVES = [2, 3, 4, 5];
const WHITE_NOTES = ['C','D','E','F','G','A','B'];
const BLACK_NOTES = { 'C':'C#', 'D':'D#', 'F':'F#', 'G':'G#', 'A':'A#' };

// Computer-keyboard → { note, octave }
const KEY_MAP = {
  // Lower row (octave 3)
  'a': { note: 'C',  octave: 3 },
  'w': { note: 'C#', octave: 3 },
  's': { note: 'D',  octave: 3 },
  'e': { note: 'D#', octave: 3 },
  'd': { note: 'E',  octave: 3 },
  'f': { note: 'F',  octave: 3 },
  't': { note: 'F#', octave: 3 },
  'g': { note: 'G',  octave: 3 },
  'y': { note: 'G#', octave: 3 },
  'h': { note: 'A',  octave: 3 },
  'u': { note: 'A#', octave: 3 },
  'j': { note: 'B',  octave: 3 },
  // Upper row (octave 4)
  'k': { note: 'C',  octave: 4 },
  'o': { note: 'C#', octave: 4 },
  'l': { note: 'D',  octave: 4 },
  'p': { note: 'D#', octave: 4 },
  ';': { note: 'E',  octave: 4 },
};

// ─── DOM helpers ──────────────────────────────────────────────────────────────

function buildKeyboard() {
  const piano = document.getElementById('piano');
  piano.innerHTML = '';

  for (const octave of OCTAVES) {
    const octaveEl = document.createElement('div');
    octaveEl.className = 'octave';
    octaveEl.dataset.octave = octave;

    for (const note of WHITE_NOTES) {
      const freq = noteToFrequency(note, octave);
      const keyEl = document.createElement('div');
      keyEl.className = 'key white';
      keyEl.dataset.freq = freq;
      keyEl.dataset.note = note;
      keyEl.dataset.octave = octave;

      const label = document.createElement('span');
      label.className = 'key-label';
      label.textContent = note + octave;
      keyEl.appendChild(label);

      // Computer-key hint
      const kbHint = getKeyboardHint(note, octave);
      if (kbHint) {
        const hint = document.createElement('span');
        hint.className = 'kb-hint';
        hint.textContent = kbHint.toUpperCase();
        keyEl.appendChild(hint);
      }

      attachPointerEvents(keyEl, freq);
      octaveEl.appendChild(keyEl);

      // Black key (if exists)
      if (BLACK_NOTES[note]) {
        const bNote = BLACK_NOTES[note];
        const bFreq = noteToFrequency(bNote, octave);
        const bKey  = document.createElement('div');
        bKey.className = 'key black';
        bKey.dataset.freq = bFreq;
        bKey.dataset.note = bNote;
        bKey.dataset.octave = octave;

        const bLabel = document.createElement('span');
        bLabel.className = 'key-label';
        bLabel.textContent = bNote + octave;
        bKey.appendChild(bLabel);

        const bKbHint = getKeyboardHint(bNote, octave);
        if (bKbHint) {
          const bHint = document.createElement('span');
          bHint.className = 'kb-hint';
          bHint.textContent = bKbHint.toUpperCase();
          bKey.appendChild(bHint);
        }

        attachPointerEvents(bKey, bFreq);
        octaveEl.appendChild(bKey);
      }
    }

    piano.appendChild(octaveEl);
  }
}

function getKeyboardHint(note, octave) {
  for (const [key, mapping] of Object.entries(KEY_MAP)) {
    if (mapping.note === note && mapping.octave === octave) return key;
  }
  return null;
}

function attachPointerEvents(el, freq) {
  el.addEventListener('mousedown',  (e) => { e.preventDefault(); initAudio(); startKey(el, freq); });
  el.addEventListener('mouseup',    ()  => stopKey(el, freq));
  el.addEventListener('mouseleave', ()  => stopKey(el, freq));
  el.addEventListener('touchstart', (e) => { e.preventDefault(); initAudio(); startKey(el, freq); }, { passive: false });
  el.addEventListener('touchend',   (e) => { e.preventDefault(); stopKey(el, freq); });
}

function startKey(el, freq) {
  el.classList.add('active');
  playNote(freq);
}

function stopKey(el, freq) {
  el.classList.remove('active');
  stopNote(freq);
}

// ─── Computer keyboard events ─────────────────────────────────────────────────

const pressedKeys = new Set();

document.addEventListener('keydown', (e) => {
  if (e.repeat) return;
  const key = e.key.toLowerCase();
  const mapping = KEY_MAP[key];
  if (!mapping) return;

  initAudio();
  const freq = noteToFrequency(mapping.note, mapping.octave);

  pressedKeys.add(key);
  playNote(freq);

  // Highlight matching key element
  const el = document.querySelector(`.key[data-freq="${freq}"]`);
  if (el) el.classList.add('active');
});

document.addEventListener('keyup', (e) => {
  const key = e.key.toLowerCase();
  const mapping = KEY_MAP[key];
  if (!mapping) return;

  const freq = noteToFrequency(mapping.note, mapping.octave);
  pressedKeys.delete(key);
  stopNote(freq);

  const el = document.querySelector(`.key[data-freq="${freq}"]`);
  if (el) el.classList.remove('active');
});

// ─── Volume slider ────────────────────────────────────────────────────────────

document.addEventListener('DOMContentLoaded', () => {
  buildKeyboard();

  const volSlider = document.getElementById('volume');
  if (volSlider) {
    volSlider.addEventListener('input', () => {
      if (masterGain) masterGain.gain.value = parseFloat(volSlider.value);
    });
  }
});
