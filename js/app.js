// ============================================
// App Shell — Navigation, State, Routing
// ============================================

import audioEngine from './audio.js';
import Piano from './piano.js';
import LearnMode from './learn.js';
import { getSongs, getSongById } from './songs.js';

class App {
    constructor() {
        this.currentView = 'home';
        this.piano = null;
        this.learnMode = null;
        this.currentSong = null;

        this.views = {
            home: document.getElementById('homeView'),
            learn: document.getElementById('learnView'),
        };

        this.elements = {
            songsGrid: document.getElementById('songsGrid'),
            learnSongTitle: document.getElementById('learnSongTitle'),
            learnSongArtist: document.getElementById('learnSongArtist'),
            scoreCorrect: document.getElementById('scoreCorrect'),
            scoreMissed: document.getElementById('scoreMissed'),
            notesCanvas: document.getElementById('notesCanvas'),
            pianoContainer: document.getElementById('pianoContainer'),
            resultsOverlay: document.getElementById('resultsOverlay'),
            resultsCorrect: document.getElementById('resultsCorrect'),
            resultsMissed: document.getElementById('resultsMissed'),
            resultsAccuracy: document.getElementById('resultsAccuracy'),
            waitIndicator: document.getElementById('waitIndicator'),
            btnPlayPause: document.getElementById('btnPlayPause'),
            btnRestart: document.getElementById('btnRestart'),
            btnWaitMode: document.getElementById('btnWaitMode'),
        };
    }

    async init() {
        // Initialize audio
        await audioEngine.init();

        // Render song library
        this._renderSongLibrary();

        // Set up piano
        this.piano = new Piano(this.elements.pianoContainer);
        this.piano.render();

        // Set up learn mode
        this.learnMode = new LearnMode(this.elements.notesCanvas, this.piano);
        this.learnMode.onScoreUpdate = (score) => this._updateScoreDisplay(score);
        this.learnMode.onSongComplete = (score) => this._showResults(score);
        this.learnMode.onWaitingChange = (waiting) => {
            this.elements.waitIndicator.classList.toggle('visible', waiting);
        };

        // Bind controls
        this._bindControls();

        // Show home view
        this.showView('home');
    }

    _renderSongLibrary() {
        const songs = getSongs();
        this.elements.songsGrid.innerHTML = '';

        songs.forEach((song, index) => {
            const card = document.createElement('div');
            card.className = `song-card slide-up slide-up-delay-${Math.min(index, 3)}`;
            card.style.setProperty('--card-gradient', `linear-gradient(135deg, ${song.color[0]}, ${song.color[1]})`);
            card.id = `song-card-${song.id}`;

            const difficultyDots = Array.from({ length: 5 }, (_, i) =>
                `<div class="dot ${i < song.difficulty ? 'filled' : ''}"></div>`
            ).join('');

            card.innerHTML = `
                <span class="song-icon">${song.icon}</span>
                <div class="song-title">${song.title}</div>
                <div class="song-artist">${song.artist}</div>
                <div class="song-meta">
                    <div class="song-difficulty">${difficultyDots}</div>
                    <span class="song-bpm">${song.bpm} BPM</span>
                </div>
                <div class="play-hint">
                    <svg viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
                </div>
            `;

            card.addEventListener('click', () => this.startSong(song.id));
            this.elements.songsGrid.appendChild(card);
        });
    }

    _bindControls() {
        // Logo → home
        document.getElementById('logoBtn').addEventListener('click', () => {
            this.learnMode.stop();
            this.showView('home');
        });

        // Play/Pause
        this.elements.btnPlayPause.addEventListener('click', () => {
            if (this.learnMode.isPlaying) {
                this.learnMode.pause();
                this.elements.btnPlayPause.textContent = '▶ Play';
            } else if (this.learnMode.isPaused) {
                this.learnMode.resume();
                this.elements.btnPlayPause.textContent = '⏸ Pause';
            } else {
                this.learnMode.start();
                this.elements.btnPlayPause.textContent = '⏸ Pause';
            }
        });

        // Restart
        this.elements.btnRestart.addEventListener('click', () => {
            this.learnMode.restart();
            this.elements.btnPlayPause.textContent = '⏸ Pause';
            this.elements.resultsOverlay.classList.remove('active');
        });

        // Wait mode toggle
        this.elements.btnWaitMode.addEventListener('click', () => {
            const isWait = this.learnMode.toggleWaitMode();
            this.elements.btnWaitMode.textContent = isWait ? '⏳ Wait: ON' : '⏳ Wait: OFF';
            this.elements.btnWaitMode.classList.toggle('btn-primary', isWait);
            this.elements.btnWaitMode.classList.toggle('btn-ghost', !isWait);
        });

        // Speed buttons
        document.querySelectorAll('.speed-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('.speed-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this.learnMode.setSpeed(parseFloat(btn.dataset.speed));
            });
        });

        // Results overlay buttons
        document.getElementById('btnRetry').addEventListener('click', () => {
            this.elements.resultsOverlay.classList.remove('active');
            this.learnMode.restart();
            this.elements.btnPlayPause.textContent = '⏸ Pause';
        });

        document.getElementById('btnBackHome').addEventListener('click', () => {
            this.elements.resultsOverlay.classList.remove('active');
            this.learnMode.stop();
            this.showView('home');
        });

        // Free play
        document.getElementById('freePlayCard').addEventListener('click', () => {
            this.currentSong = null;
            this.elements.learnSongTitle.textContent = 'Free Play';
            this.elements.learnSongArtist.textContent = 'Play whatever you want!';
            this.showView('learn');
        });

        // Init audio on first user interaction
        document.addEventListener('click', async () => {
            await audioEngine.init();
            await audioEngine.resume();
        }, { once: true });

        document.addEventListener('keydown', async () => {
            await audioEngine.init();
            await audioEngine.resume();
        }, { once: true });
    }

    startSong(songId) {
        const song = getSongById(songId);
        if (!song) return;

        this.currentSong = song;
        this.elements.learnSongTitle.textContent = song.title;
        this.elements.learnSongArtist.textContent = song.artist;

        this.showView('learn');

        // Small delay to allow layout to settle
        setTimeout(() => {
            this.piano.render(); // Re-render for correct sizing
            this.learnMode.loadSong(song);
            this.learnMode._resizeCanvas();
            this.learnMode.start();
            this.elements.btnPlayPause.textContent = '⏸ Pause';
            this._updateScoreDisplay({ correct: 0, missed: 0, total: song.notes.length });
        }, 100);
    }

    showView(viewName) {
        Object.entries(this.views).forEach(([name, el]) => {
            el.classList.toggle('active', name === viewName);
        });
        this.currentView = viewName;
    }

    _updateScoreDisplay(score) {
        this.elements.scoreCorrect.textContent = score.correct;
        this.elements.scoreMissed.textContent = score.missed;
    }

    _showResults(score) {
        const accuracy = score.total > 0
            ? Math.round((score.correct / score.total) * 100)
            : 0;

        this.elements.resultsCorrect.textContent = score.correct;
        this.elements.resultsMissed.textContent = score.missed;
        this.elements.resultsAccuracy.textContent = `${accuracy}%`;
        this.elements.resultsOverlay.classList.add('active');
    }
}

// Boot
document.addEventListener('DOMContentLoaded', () => {
    const app = new App();
    app.init();
});
