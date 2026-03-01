// ============================================
// Audio Engine — Grand Piano Synthesizer
// ============================================

class AudioEngine {
    constructor() {
        this.ctx = null;
        this.masterGain = null;
        this.reverbNode = null;
        this.compressor = null;
        this.isInitialized = false;

        // Note frequencies (Hz) for all octaves
        this.noteFrequencies = {};
        const noteNames = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
        for (let octave = 0; octave <= 8; octave++) {
            for (let i = 0; i < noteNames.length; i++) {
                const noteIndex = octave * 12 + i - 57; // A4 = 440Hz reference
                const freq = 440 * Math.pow(2, noteIndex / 12);
                this.noteFrequencies[`${noteNames[i]}${octave}`] = freq;
            }
        }

        // Grand piano harmonic amplitudes (based on real piano spectral analysis)
        // Each entry is [harmonicNumber, relativeAmplitude]
        this.harmonicProfile = [
            [1, 1.2],      // fundamental — boosted for Steinway bass weight
            [2, 0.75],     // octave — strong presence
            [3, 0.30],     // 5th above octave
            [4, 0.18],     // 2nd octave
            [5, 0.10],     // major 3rd above 2nd octave
            [6, 0.07],     // 5th above 2nd octave
            [7, 0.04],     // minor 7th (subtle richness)
            [8, 0.02],     // 3rd octave
        ];

        // Piano string inharmonicity coefficient
        // Real piano strings are slightly stiff, stretching upper partials sharp
        this.inharmonicity = 0.0004;
    }

    async init() {
        if (this.isInitialized) return;
        this.ctx = new (window.AudioContext || window.webkitAudioContext)();

        // Dynamics compressor — tighter for Steinway clarity
        this.compressor = this.ctx.createDynamicsCompressor();
        this.compressor.threshold.value = -18;
        this.compressor.knee.value = 6;
        this.compressor.ratio.value = 3;
        this.compressor.attack.value = 0.001;
        this.compressor.release.value = 0.08;

        // Master gain
        this.masterGain = this.ctx.createGain();
        this.masterGain.gain.value = 0.5;

        // Minimal room reverb — Steinway is mostly dry and direct
        this.reverbNode = await this._createGrandPianoReverb();
        const reverbGain = this.ctx.createGain();
        reverbGain.gain.value = 0.12;

        const dryGain = this.ctx.createGain();
        dryGain.gain.value = 0.88;

        // Signal chain: masterGain → compressor → dry/wet split → destination
        this.masterGain.connect(this.compressor);
        this.compressor.connect(dryGain);
        this.compressor.connect(reverbGain);
        dryGain.connect(this.ctx.destination);
        reverbGain.connect(this.reverbNode);
        this.reverbNode.connect(this.ctx.destination);

        this.isInitialized = true;
    }

    /**
     * Create a reverb impulse response that simulates the resonance
     * inside a grand piano body — warm, with early reflections
     */
    async _createGrandPianoReverb() {
        const convolver = this.ctx.createConvolver();
        const sampleRate = this.ctx.sampleRate;
        const length = sampleRate * 1.2; // Short 1.2s tail — tight Steinway room
        const impulse = this.ctx.createBuffer(2, length, sampleRate);

        for (let channel = 0; channel < 2; channel++) {
            const data = impulse.getChannelData(channel);
            for (let i = 0; i < length; i++) {
                const t = i / sampleRate;
                // Very short early reflections — close-mic'd Steinway character
                const early = t < 0.02 ? Math.sin(t * 1200) * 0.15 * (1 - t / 0.02) : 0;
                // Fast-decaying diffuse tail
                const late = (Math.random() * 2 - 1) * Math.pow(1 - i / length, 4.5);
                // Rapid high-freq absorption
                const warmth = Math.exp(-t * 4.0);
                data[i] = (early + late) * warmth;
            }
        }
        convolver.buffer = impulse;
        return convolver;
    }

    /**
     * Calculate the inharmonic frequency of the nth partial
     * Real piano strings are slightly stiff, which stretches upper harmonics sharp
     */
    _inharmonicFreq(fundamental, n) {
        return fundamental * n * Math.sqrt(1 + this.inharmonicity * n * n);
    }

    /**
     * Play a grand piano note
     * @param {string} note - Note name (e.g., 'C', 'F#')
     * @param {number} octave - Octave number (2-7)
     * @param {number} duration - Note duration in seconds
     */
    playNote(note, octave, duration = 0.5) {
        if (!this.isInitialized) return;

        const noteKey = `${note}${octave}`;
        const freq = this.noteFrequencies[noteKey];
        if (!freq) return;

        const now = this.ctx.currentTime;

        // === Frequency-dependent parameters (grand piano character) ===
        // Lower notes sustain longer, higher notes are brighter but decay faster
        const freqRatio = Math.log2(freq / 27.5) / Math.log2(4186 / 27.5); // 0=low, 1=high
        const sustainMultiplier = 2.0 - freqRatio * 1.3;  // low notes sustain more
        const brightnessRolloff = 1.0 - freqRatio * 0.25;  // keep more brightness across range (Steinway clarity)

        // === Hammer strike noise transient ===
        // Grand pianos have a percussive "thunk" from the hammer hitting strings
        const noiseLength = 0.015; // 15ms — shorter, crisper hammer attack
        const noiseBuffer = this.ctx.createBuffer(1, this.ctx.sampleRate * noiseLength, this.ctx.sampleRate);
        const noiseData = noiseBuffer.getChannelData(0);
        for (let i = 0; i < noiseData.length; i++) {
            noiseData[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / noiseData.length, 4);
        }

        const noiseSource = this.ctx.createBufferSource();
        noiseSource.buffer = noiseBuffer;

        // Bandpass the hammer noise around the fundamental for realism
        const noiseBP = this.ctx.createBiquadFilter();
        noiseBP.type = 'bandpass';
        noiseBP.frequency.value = Math.min(freq * 3, 6000);
        noiseBP.Q.value = 0.8;

        const noiseGain = this.ctx.createGain();
        noiseGain.gain.value = 0.20 + freqRatio * 0.20; // crisp, defined attack

        noiseSource.connect(noiseBP);
        noiseBP.connect(noiseGain);
        noiseGain.connect(this.masterGain);
        noiseSource.start(now);
        noiseSource.stop(now + noiseLength);

        // === Harmonic oscillators with inharmonicity ===
        const oscillators = [];
        const gains = [];

        for (const [n, baseAmplitude] of this.harmonicProfile) {
            const harmonicFreq = this._inharmonicFreq(freq, n);

            // Skip harmonics above Nyquist or above audible range
            if (harmonicFreq > this.ctx.sampleRate / 2 || harmonicFreq > 16000) continue;

            const osc = this.ctx.createOscillator();
            osc.type = 'sine';
            osc.frequency.value = harmonicFreq;

            // Slight random detuning per harmonic (string imperfection, adds life)
            osc.detune.value = (Math.random() - 0.5) * 1.5; // tighter tuning for clarity

            const gain = this.ctx.createGain();
            // Roll off higher harmonics for lower notes (warmth), keep for higher notes
            const amplitude = baseAmplitude * Math.pow(brightnessRolloff, (n - 1) * 0.3);
            gain.gain.value = amplitude * 0.40; // more headroom for bass presence

            osc.connect(gain);
            oscillators.push(osc);
            gains.push(gain);
        }

        // Also add a detuned "sympathetic string" layer — the soul of a grand
        const sympOsc = this.ctx.createOscillator();
        sympOsc.type = 'sine';
        sympOsc.frequency.value = freq;
        sympOsc.detune.value = (Math.random() - 0.5) * 3 + 1; // tight detune
        const sympGain = this.ctx.createGain();
        sympGain.gain.value = 0.05; // subtler sympathetic layer
        sympOsc.connect(sympGain);
        oscillators.push(sympOsc);
        gains.push(sympGain);

        // === Master envelope for this note ===
        const envelope = this.ctx.createGain();
        envelope.gain.setValueAtTime(0, now);

        // Grand piano ADSR:
        // - Very fast attack (hammer strike)
        // - Quick initial decay to intermediate level (string energy dissipation)
        // - Slow secondary decay (sustain resonance in the body)
        // - Release: gradual damper
        const attack = 0.002; // snappier
        const initialDecay = 0.06;
        const initialLevel = 0.75;
        const secondaryDecay = 0.5 * sustainMultiplier;
        const sustainLevel = 0.15 * sustainMultiplier;
        const release = Math.min(duration * 0.6, 1.8) * sustainMultiplier;

        // Attack
        envelope.gain.linearRampToValueAtTime(1.0, now + attack);
        // Initial fast decay (hammer bounce off string)
        envelope.gain.exponentialRampToValueAtTime(initialLevel, now + attack + initialDecay);
        // Secondary slow decay (string vibration in body)
        envelope.gain.exponentialRampToValueAtTime(
            Math.max(sustainLevel, 0.01),
            now + attack + initialDecay + secondaryDecay
        );
        // Release (damper falls)
        const releaseStart = now + duration;
        envelope.gain.setTargetAtTime(0.001, releaseStart, release * 0.3);

        // === Tone-shaping filter — open top-end for Steinway crispness ===
        const toneFilter = this.ctx.createBiquadFilter();
        toneFilter.type = 'lowpass';
        toneFilter.frequency.value = 5000 + freq * 3; // higher cutoff = more clarity
        toneFilter.Q.value = 0.4;

        // Bass boost — Steinway low-end weight
        const bassBoost = this.ctx.createBiquadFilter();
        bassBoost.type = 'lowshelf';
        bassBoost.frequency.value = 250;
        bassBoost.gain.value = 5; // +5dB bass shelf

        // Subtle body resonance at the fundamental
        const bodyResonance = this.ctx.createBiquadFilter();
        bodyResonance.type = 'peaking';
        bodyResonance.frequency.value = freq;
        bodyResonance.Q.value = 3;
        bodyResonance.gain.value = 4;

        // === Connect all harmonics → envelope → filters → master ===
        gains.forEach(g => g.connect(envelope));
        envelope.connect(toneFilter);
        toneFilter.connect(bassBoost);
        bassBoost.connect(bodyResonance);
        bodyResonance.connect(this.masterGain);

        // === Start & schedule stop ===
        const stopTime = releaseStart + release + 1;
        oscillators.forEach(osc => {
            osc.start(now);
            osc.stop(stopTime);
        });
    }

    /**
     * Play a note by its full name e.g. "C4", "F#5"
     */
    playNoteByName(noteName, duration = 0.5) {
        const match = noteName.match(/^([A-G]#?)(\d)$/);
        if (!match) return;
        this.playNote(match[1], parseInt(match[2]), duration);
    }

    /**
     * Resume audio context (required after user gesture)
     */
    async resume() {
        if (this.ctx && this.ctx.state === 'suspended') {
            await this.ctx.resume();
        }
    }

    setVolume(value) {
        if (this.masterGain) {
            this.masterGain.gain.value = Math.max(0, Math.min(1, value));
        }
    }
}

// Singleton
const audioEngine = new AudioEngine();
export default audioEngine;
