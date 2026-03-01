// ============================================
// Learn Mode — Falling Notes & Scoring
// ============================================

import audioEngine from './audio.js';

class LearnMode {
    constructor(canvasEl, piano) {
        this.canvas = canvasEl;
        this.ctx = canvasEl.getContext('2d');
        this.piano = piano;

        // State
        this.song = null;
        this.isPlaying = false;
        this.isPaused = false;
        this.waitMode = true;
        this.isWaiting = false;
        this.speed = 1;
        this.currentTime = 0;
        this.startTime = 0;
        this.score = { correct: 0, missed: 0, total: 0 };
        this.noteStates = []; // per-note state
        this.animFrameId = null;

        // Visual settings
        this.fallDuration = 2.5; // seconds for a note to fall from top to keys
        this.noteColors = {
            default: '#7c5cff',
            active: '#00e676',
            missed: '#ff5252',
            upcoming: 'rgba(124, 92, 255, 0.6)',
        };

        // Callbacks
        this.onScoreUpdate = null;
        this.onSongComplete = null;
        this.onWaitingChange = null;

        this._resizeCanvas();
        window.addEventListener('resize', () => this._resizeCanvas());
    }

    _resizeCanvas() {
        const rect = this.canvas.parentElement.getBoundingClientRect();
        this.canvas.width = rect.width * window.devicePixelRatio;
        this.canvas.height = rect.height * window.devicePixelRatio;
        this.canvas.style.width = `${rect.width}px`;
        this.canvas.style.height = `${rect.height}px`;
        this.ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
        this.displayWidth = rect.width;
        this.displayHeight = rect.height;
    }

    loadSong(song) {
        this.song = song;
        this.currentTime = -1.5; // Start with a lead-in
        this.score = { correct: 0, missed: 0, total: song.notes.length };
        this.noteStates = song.notes.map((note, i) => ({
            ...note,
            index: i,
            hit: false,
            missed: false,
            active: false,
        }));
        this.isPlaying = false;
        this.isPaused = false;
        this.isWaiting = false;
        this.piano.clearHighlights();
    }

    start() {
        if (!this.song) return;
        this.isPlaying = true;
        this.isPaused = false;
        this.startTime = performance.now() / 1000 - this.currentTime;

        // Set up note play handler for scoring
        this.piano.onNotePlay = (noteId) => this._handleNoteInput(noteId);

        this._gameLoop();
    }

    pause() {
        this.isPaused = true;
        this.isPlaying = false;
        if (this.animFrameId) cancelAnimationFrame(this.animFrameId);
    }

    resume() {
        if (!this.isPaused) return;
        this.isPaused = false;
        this.isPlaying = true;
        this.startTime = performance.now() / 1000 - this.currentTime;
        this._gameLoop();
    }

    restart() {
        this.pause();
        this.loadSong(this.song);
        this.start();
    }

    setSpeed(speed) {
        this.speed = speed;
        if (this.isPlaying) {
            this.startTime = performance.now() / 1000 - this.currentTime / this.speed;
        }
    }

    stop() {
        this.isPlaying = false;
        this.isPaused = false;
        if (this.animFrameId) cancelAnimationFrame(this.animFrameId);
        this.piano.onNotePlay = null;
        this.piano.clearHighlights();
    }

    _gameLoop() {
        if (!this.isPlaying) return;

        const now = performance.now() / 1000;

        if (!this.isWaiting) {
            this.currentTime = (now - this.startTime) * this.speed;
        }

        this._update();
        this._render();

        this.animFrameId = requestAnimationFrame(() => this._gameLoop());
    }

    _update() {
        const hitWindow = 0.35; // seconds tolerance
        let nearestUpcoming = null;

        this.piano.clearHighlights();

        for (const ns of this.noteStates) {
            if (ns.hit || ns.missed) continue;

            const noteArrival = ns.time;
            const diff = noteArrival - this.currentTime;

            // Mark as missed if past the hit window
            if (diff < -hitWindow && !ns.hit) {
                if (!this.waitMode) {
                    ns.missed = true;
                    this.score.missed++;
                    this._emitScoreUpdate();
                }
            }

            // Highlight the current note to play
            if (diff >= -hitWindow && diff <= hitWindow) {
                ns.active = true;
                this.piano.highlightKey(ns.note, 'highlight');

                // In wait mode, pause if this note hasn't been hit
                if (this.waitMode && !ns.hit && diff <= 0) {
                    this.isWaiting = true;
                    if (this.onWaitingChange) this.onWaitingChange(true);
                }
            } else {
                ns.active = false;
            }

            // Highlight upcoming notes
            if (diff > hitWindow && diff < 1.5) {
                this.piano.highlightKey(ns.note, 'upcoming');
            }
        }

        // Check song completion
        const allProcessed = this.noteStates.every(ns => ns.hit || ns.missed);
        const lastNote = this.noteStates[this.noteStates.length - 1];
        if (allProcessed && this.currentTime > lastNote.time + 2) {
            this.isPlaying = false;
            if (this.onSongComplete) {
                this.onSongComplete(this.score);
            }
        }
    }

    _handleNoteInput(noteId) {
        if (!this.isPlaying && !this.isWaiting) return;

        const hitWindow = 0.45;

        // Find the closest active/upcoming note that matches
        let bestMatch = null;
        let bestDiff = Infinity;

        for (const ns of this.noteStates) {
            if (ns.hit || ns.missed) continue;
            if (ns.note !== noteId) continue;

            const diff = Math.abs(ns.time - this.currentTime);
            if (diff < hitWindow && diff < bestDiff) {
                bestMatch = ns;
                bestDiff = diff;
            }
        }

        if (bestMatch) {
            bestMatch.hit = true;
            this.score.correct++;
            this._emitScoreUpdate();
            this._spawnParticles(noteId);

            // Resume from wait
            if (this.isWaiting) {
                this.isWaiting = false;
                this.startTime = performance.now() / 1000 - this.currentTime / this.speed;
                if (this.onWaitingChange) this.onWaitingChange(false);
            }
        }
    }

    _render() {
        const ctx = this.ctx;
        const w = this.displayWidth;
        const h = this.displayHeight;

        // Clear
        ctx.clearRect(0, 0, w, h);

        // Draw guide line at bottom
        ctx.strokeStyle = 'rgba(124, 92, 255, 0.3)';
        ctx.lineWidth = 2;
        ctx.setLineDash([8, 8]);
        ctx.beginPath();
        ctx.moveTo(0, h - 10);
        ctx.lineTo(w, h - 10);
        ctx.stroke();
        ctx.setLineDash([]);

        // Draw falling notes
        for (const ns of this.noteStates) {
            const keyPos = this.piano.getKeyPosition(ns.note);
            if (!keyPos) continue;

            // Calculate vertical position
            const timeUntilHit = ns.time - this.currentTime;
            const yRatio = 1 - (timeUntilHit / this.fallDuration);
            const noteHeight = Math.max(20, ns.duration * (h / this.fallDuration));
            const y = yRatio * h - noteHeight;

            // skip if off screen
            if (y > h + 10 || y + noteHeight < -10) continue;

            // Determine color
            let color = this.noteColors.default;
            let alpha = 1;
            if (ns.hit) {
                color = this.noteColors.active;
                alpha = Math.max(0, 1 - (this.currentTime - ns.time) * 2);
            } else if (ns.missed) {
                color = this.noteColors.missed;
                alpha = 0.4;
            } else if (ns.active) {
                color = this.noteColors.active;
            }

            // Note rectangle position based on key position
            const pianoContainerRect = this.piano.container.getBoundingClientRect();
            const canvasRect = this.canvas.parentElement.getBoundingClientRect();
            const offsetX = pianoContainerRect.left - canvasRect.left;

            const noteWidth = keyPos.width * 0.75;
            const noteX = offsetX + keyPos.x - noteWidth / 2;

            ctx.globalAlpha = alpha;

            // Draw note with rounded rect and glow
            const radius = 6;
            ctx.fillStyle = color;
            ctx.shadowColor = color;
            ctx.shadowBlur = ns.active ? 20 : 8;

            ctx.beginPath();
            ctx.roundRect(noteX, y, noteWidth, noteHeight, radius);
            ctx.fill();

            // Inner glow highlight
            ctx.shadowBlur = 0;
            const gradient = ctx.createLinearGradient(noteX, y, noteX + noteWidth, y);
            gradient.addColorStop(0, 'rgba(255,255,255,0.25)');
            gradient.addColorStop(0.5, 'rgba(255,255,255,0.05)');
            gradient.addColorStop(1, 'rgba(255,255,255,0)');
            ctx.fillStyle = gradient;
            ctx.beginPath();
            ctx.roundRect(noteX, y, noteWidth, noteHeight, radius);
            ctx.fill();

            // Note label
            if (noteHeight > 25) {
                ctx.fillStyle = 'rgba(255,255,255,0.85)';
                ctx.font = '600 11px Inter';
                ctx.textAlign = 'center';
                ctx.fillText(ns.note, noteX + noteWidth / 2, y + noteHeight / 2 + 4);
            }

            ctx.globalAlpha = 1;
            ctx.shadowBlur = 0;
        }
    }

    _spawnParticles(noteId) {
        const keyPos = this.piano.getKeyPosition(noteId);
        if (!keyPos) return;

        const pianoContainerRect = this.piano.container.getBoundingClientRect();

        for (let i = 0; i < 8; i++) {
            const particle = document.createElement('div');
            particle.className = 'particle';
            particle.style.background = `hsl(${Math.random() * 60 + 120}, 80%, 60%)`;
            particle.style.left = `${pianoContainerRect.left + keyPos.x}px`;
            particle.style.top = `${pianoContainerRect.top - 10}px`;
            particle.style.setProperty('--px', `${(Math.random() - 0.5) * 80}px`);
            particle.style.setProperty('--py', `${-Math.random() * 60 - 20}px`);
            document.body.appendChild(particle);

            setTimeout(() => particle.remove(), 600);
        }
    }

    _emitScoreUpdate() {
        if (this.onScoreUpdate) {
            this.onScoreUpdate(this.score);
        }
    }

    toggleWaitMode() {
        this.waitMode = !this.waitMode;
        if (!this.waitMode && this.isWaiting) {
            this.isWaiting = false;
            this.startTime = performance.now() / 1000 - this.currentTime / this.speed;
            if (this.onWaitingChange) this.onWaitingChange(false);
        }
        return this.waitMode;
    }
}

export default LearnMode;
