// ============================================
// Piano Keyboard — Rendering & Interaction
// ============================================

import audioEngine from './audio.js';

class Piano {
    constructor(containerEl) {
        this.container = containerEl;
        this.keys = new Map(); // noteId -> DOM element
        this.keyboardMap = {};
        this.activeKeys = new Set();
        this.onNotePlay = null; // callback: (noteId) => {}

        // Define the keyboard layout: 2.5 octaves (C3 to E5)
        this.octaves = [3, 4, 5];
        this.whiteNotes = ['C', 'D', 'E', 'F', 'G', 'A', 'B'];
        this.blackNotes = { 'C': 'C#', 'D': 'D#', 'F': 'F#', 'G': 'G#', 'A': 'A#' };
        this.lastOctaveWhites = ['C', 'D', 'E']; // partial last octave

        // Computer keyboard mapping (bottom row = white keys, top row = black keys)
        this.keyMappings = {
            // Octave 3
            'z': 'C3', 'x': 'D3', 'c': 'E3', 'v': 'F3', 'b': 'G3', 'n': 'A3', 'm': 'B3',
            's': 'C#3', 'd': 'D#3', 'g': 'F#3', 'h': 'G#3', 'j': 'A#3',
            // Octave 4
            'q': 'C4', 'w': 'D4', 'e': 'E4', 'r': 'F4', 't': 'G4', 'y': 'A4', 'u': 'B4',
            '2': 'C#4', '3': 'D#4', '5': 'F#4', '6': 'G#4', '7': 'A#4',
            // Octave 5 (partial)
            'i': 'C5', 'o': 'D5', 'p': 'E5',
        };
    }

    render() {
        this.container.innerHTML = '';
        const pianoEl = document.createElement('div');
        pianoEl.className = 'piano';

        let whiteKeyIndex = 0;
        const whiteKeyWidth = 52; // matches CSS

        const allNotes = [];

        // Build note list
        for (const octave of this.octaves) {
            const whites = octave === 5 ? this.lastOctaveWhites : this.whiteNotes;
            for (const note of whites) {
                allNotes.push({ note, octave, isBlack: false });
                if (this.blackNotes[note] && !(octave === 5 && (note === 'D' || note === 'E'))) {
                    allNotes.push({ note: this.blackNotes[note], octave, isBlack: true });
                }
            }
        }

        // Render white keys first, then black on top
        const whiteKeys = allNotes.filter(n => !n.isBlack);
        const blackKeys = allNotes.filter(n => n.isBlack);

        // Set piano width
        pianoEl.style.width = `${whiteKeys.length * whiteKeyWidth}px`;
        pianoEl.style.height = '180px';

        // White keys
        whiteKeys.forEach((n, i) => {
            const noteId = `${n.note}${n.octave}`;
            const keyEl = document.createElement('div');
            keyEl.className = 'key white';
            keyEl.dataset.note = noteId;
            keyEl.style.left = `${i * whiteKeyWidth}px`;
            keyEl.style.position = 'absolute';

            // Key label
            const label = document.createElement('span');
            label.className = 'key-label';
            const shortcut = this._getShortcutForNote(noteId);
            label.textContent = shortcut ? shortcut.toUpperCase() : n.note;
            keyEl.appendChild(label);

            pianoEl.appendChild(keyEl);
            this.keys.set(noteId, keyEl);
        });

        // Black keys — position relative to white keys
        let wIdx = 0;
        for (const octave of this.octaves) {
            const whites = octave === 5 ? this.lastOctaveWhites : this.whiteNotes;
            for (let j = 0; j < whites.length; j++) {
                const wNote = whites[j];
                if (this.blackNotes[wNote] && !(octave === 5 && (wNote === 'D' || wNote === 'E'))) {
                    const blackNote = this.blackNotes[wNote];
                    const noteId = `${blackNote}${octave}`;
                    const keyEl = document.createElement('div');
                    keyEl.className = 'key black';
                    keyEl.dataset.note = noteId;
                    keyEl.style.left = `${wIdx * whiteKeyWidth + whiteKeyWidth - 16}px`;

                    const label = document.createElement('span');
                    label.className = 'key-label';
                    const shortcut = this._getShortcutForNote(noteId);
                    label.textContent = shortcut ? shortcut.toUpperCase() : '';
                    keyEl.appendChild(label);

                    pianoEl.appendChild(keyEl);
                    this.keys.set(noteId, keyEl);
                }
                wIdx++;
            }
        }

        this.container.appendChild(pianoEl);
        this._bindEvents();
    }

    _getShortcutForNote(noteId) {
        for (const [key, nid] of Object.entries(this.keyMappings)) {
            if (nid === noteId) return key;
        }
        return null;
    }

    _bindEvents() {
        // Mouse/touch events on keys
        this.keys.forEach((keyEl, noteId) => {
            keyEl.addEventListener('mousedown', (e) => {
                e.preventDefault();
                this._pressKey(noteId);
            });
            keyEl.addEventListener('mouseup', () => this._releaseKey(noteId));
            keyEl.addEventListener('mouseleave', () => this._releaseKey(noteId));

            keyEl.addEventListener('touchstart', (e) => {
                e.preventDefault();
                this._pressKey(noteId);
            }, { passive: false });
            keyEl.addEventListener('touchend', () => this._releaseKey(noteId));
        });

        // Keyboard events
        document.addEventListener('keydown', (e) => {
            if (e.repeat) return;
            const noteId = this.keyMappings[e.key.toLowerCase()];
            if (noteId) {
                e.preventDefault();
                this._pressKey(noteId);
            }
        });

        document.addEventListener('keyup', (e) => {
            const noteId = this.keyMappings[e.key.toLowerCase()];
            if (noteId) {
                this._releaseKey(noteId);
            }
        });
    }

    _pressKey(noteId) {
        if (this.activeKeys.has(noteId)) return;
        this.activeKeys.add(noteId);

        const keyEl = this.keys.get(noteId);
        if (keyEl) keyEl.classList.add('pressed');

        // Play audio
        audioEngine.playNoteByName(noteId, 0.8);

        // Callback for learn mode
        if (this.onNotePlay) {
            this.onNotePlay(noteId);
        }
    }

    _releaseKey(noteId) {
        this.activeKeys.delete(noteId);
        const keyEl = this.keys.get(noteId);
        if (keyEl) keyEl.classList.remove('pressed');
    }

    /**
     * Highlight a key (for learning mode)
     */
    highlightKey(noteId, className = 'highlight') {
        const keyEl = this.keys.get(noteId);
        if (keyEl) keyEl.classList.add(className);
    }

    /**
     * Remove highlight from key
     */
    unhighlightKey(noteId, className = 'highlight') {
        const keyEl = this.keys.get(noteId);
        if (keyEl) keyEl.classList.remove(className);
    }

    /**
     * Clear all highlights
     */
    clearHighlights() {
        this.keys.forEach((keyEl) => {
            keyEl.classList.remove('highlight', 'upcoming');
        });
    }

    /**
     * Get the X position of a key for falling notes alignment
     */
    getKeyPosition(noteId) {
        const keyEl = this.keys.get(noteId);
        if (!keyEl) return null;
        const rect = keyEl.getBoundingClientRect();
        const containerRect = this.container.getBoundingClientRect();
        return {
            x: rect.left - containerRect.left + rect.width / 2,
            width: rect.width,
            isBlack: keyEl.classList.contains('black')
        };
    }

    /**
     * Check if a note exists on this keyboard
     */
    hasNote(noteId) {
        return this.keys.has(noteId);
    }
}

export default Piano;
