// ============================================
// Song Library — Note data for famous songs
// ============================================

/**
 * Each song contains:
 *   title, artist, difficulty (1-5), bpm, color (gradient), 
 *   notes: [{ note: "C4", time: 0, duration: 0.5 }, ...]
 *   time = beat offset from start
 */

const songs = [
    {
        id: 'golden-hour',
        title: 'Golden Hour',
        artist: 'JVKE',
        difficulty: 2,
        bpm: 100,
        color: ['#F6D365', '#FDA085'],
        icon: '🌅',
        notes: [
            // Intro / main melody (simplified piano arrangement)
            { note: 'E4', time: 0, duration: 0.5 },
            { note: 'G4', time: 0.5, duration: 0.5 },
            { note: 'A4', time: 1, duration: 1 },
            { note: 'G4', time: 2, duration: 0.5 },
            { note: 'E4', time: 2.5, duration: 0.5 },
            { note: 'D4', time: 3, duration: 1 },

            { note: 'E4', time: 4, duration: 0.5 },
            { note: 'G4', time: 4.5, duration: 0.5 },
            { note: 'A4', time: 5, duration: 0.75 },
            { note: 'B4', time: 5.75, duration: 0.25 },
            { note: 'A4', time: 6, duration: 0.5 },
            { note: 'G4', time: 6.5, duration: 0.5 },
            { note: 'E4', time: 7, duration: 1 },

            { note: 'D4', time: 8, duration: 0.5 },
            { note: 'E4', time: 8.5, duration: 0.5 },
            { note: 'G4', time: 9, duration: 1 },
            { note: 'A4', time: 10, duration: 0.5 },
            { note: 'G4', time: 10.5, duration: 0.5 },
            { note: 'E4', time: 11, duration: 1 },

            { note: 'D4', time: 12, duration: 0.5 },
            { note: 'C4', time: 12.5, duration: 0.5 },
            { note: 'D4', time: 13, duration: 1 },
            { note: 'E4', time: 14, duration: 2 },

            // Chorus section
            { note: 'A4', time: 16, duration: 0.5 },
            { note: 'B4', time: 16.5, duration: 0.5 },
            { note: 'C5', time: 17, duration: 1 },
            { note: 'B4', time: 18, duration: 0.5 },
            { note: 'A4', time: 18.5, duration: 0.5 },
            { note: 'G4', time: 19, duration: 1 },

            { note: 'E4', time: 20, duration: 0.5 },
            { note: 'G4', time: 20.5, duration: 0.5 },
            { note: 'A4', time: 21, duration: 1.5 },
            { note: 'G4', time: 22.5, duration: 0.5 },
            { note: 'E4', time: 23, duration: 1 },

            { note: 'A4', time: 24, duration: 0.5 },
            { note: 'B4', time: 24.5, duration: 0.5 },
            { note: 'C5', time: 25, duration: 1 },
            { note: 'D5', time: 26, duration: 0.5 },
            { note: 'C5', time: 26.5, duration: 0.5 },
            { note: 'B4', time: 27, duration: 0.5 },
            { note: 'A4', time: 27.5, duration: 0.5 },
            { note: 'G4', time: 28, duration: 2 },

            { note: 'E4', time: 30, duration: 1 },
            { note: 'D4', time: 31, duration: 1 },
        ]
    },
    {
        id: 'moonlight-sonata',
        title: 'Moonlight Sonata',
        artist: 'Beethoven',
        difficulty: 3,
        bpm: 60,
        color: ['#667eea', '#764ba2'],
        icon: '🌙',
        notes: [
            // Opening triplet arpeggios (simplified)
            { note: 'G#3', time: 0, duration: 0.33 },
            { note: 'C#4', time: 0.33, duration: 0.33 },
            { note: 'E4', time: 0.66, duration: 0.33 },
            { note: 'G#3', time: 1, duration: 0.33 },
            { note: 'C#4', time: 1.33, duration: 0.33 },
            { note: 'E4', time: 1.66, duration: 0.33 },
            { note: 'G#3', time: 2, duration: 0.33 },
            { note: 'C#4', time: 2.33, duration: 0.33 },
            { note: 'E4', time: 2.66, duration: 0.33 },
            { note: 'G#3', time: 3, duration: 0.33 },
            { note: 'C#4', time: 3.33, duration: 0.33 },
            { note: 'E4', time: 3.66, duration: 0.33 },

            // 2nd measure
            { note: 'A3', time: 4, duration: 0.33 },
            { note: 'C#4', time: 4.33, duration: 0.33 },
            { note: 'E4', time: 4.66, duration: 0.33 },
            { note: 'A3', time: 5, duration: 0.33 },
            { note: 'C#4', time: 5.33, duration: 0.33 },
            { note: 'E4', time: 5.66, duration: 0.33 },
            { note: 'A3', time: 6, duration: 0.33 },
            { note: 'C#4', time: 6.33, duration: 0.33 },
            { note: 'E4', time: 6.66, duration: 0.33 },
            { note: 'A3', time: 7, duration: 0.33 },
            { note: 'C#4', time: 7.33, duration: 0.33 },
            { note: 'E4', time: 7.66, duration: 0.33 },

            // 3rd measure  
            { note: 'F#3', time: 8, duration: 0.33 },
            { note: 'B3', time: 8.33, duration: 0.33 },
            { note: 'D4', time: 8.66, duration: 0.33 },
            { note: 'F#3', time: 9, duration: 0.33 },
            { note: 'B3', time: 9.33, duration: 0.33 },
            { note: 'D4', time: 9.66, duration: 0.33 },
            { note: 'G#3', time: 10, duration: 0.33 },
            { note: 'B3', time: 10.33, duration: 0.33 },
            { note: 'E4', time: 10.66, duration: 0.33 },
            { note: 'G#3', time: 11, duration: 0.33 },
            { note: 'B3', time: 11.33, duration: 0.33 },
            { note: 'E4', time: 11.66, duration: 0.33 },

            // 4th measure
            { note: 'G#3', time: 12, duration: 0.33 },
            { note: 'C#4', time: 12.33, duration: 0.33 },
            { note: 'E4', time: 12.66, duration: 0.33 },
            { note: 'G#3', time: 13, duration: 0.33 },
            { note: 'C#4', time: 13.33, duration: 0.33 },
            { note: 'E4', time: 13.66, duration: 0.33 },
            { note: 'G#3', time: 14, duration: 0.33 },
            { note: 'C#4', time: 14.33, duration: 0.33 },
            { note: 'E4', time: 14.66, duration: 0.33 },
            { note: 'G#3', time: 15, duration: 0.33 },
            { note: 'C#4', time: 15.33, duration: 0.33 },
            { note: 'E4', time: 15.66, duration: 0.33 },
        ]
    },
    {
        id: 'river-flows',
        title: 'River Flows in You',
        artist: 'Yiruma',
        difficulty: 3,
        bpm: 68,
        color: ['#a1c4fd', '#c2e9fb'],
        icon: '🌊',
        notes: [
            // Intro
            { note: 'A4', time: 0, duration: 0.25 },
            { note: 'B4', time: 0.25, duration: 0.25 },
            { note: 'C5', time: 0.5, duration: 0.25 },
            { note: 'B4', time: 0.75, duration: 0.25 },
            { note: 'C5', time: 1, duration: 0.25 },
            { note: 'E5', time: 1.25, duration: 0.25 },
            { note: 'B4', time: 1.5, duration: 0.5 },

            { note: 'A4', time: 2, duration: 0.25 },
            { note: 'B4', time: 2.25, duration: 0.25 },
            { note: 'C5', time: 2.5, duration: 0.25 },
            { note: 'B4', time: 2.75, duration: 0.25 },
            { note: 'C5', time: 3, duration: 0.25 },
            { note: 'B4', time: 3.25, duration: 0.25 },
            { note: 'A4', time: 3.5, duration: 0.5 },

            // Main melody
            { note: 'E4', time: 4, duration: 0.5 },
            { note: 'A4', time: 4.5, duration: 0.25 },
            { note: 'B4', time: 4.75, duration: 0.25 },
            { note: 'C5', time: 5, duration: 0.5 },
            { note: 'B4', time: 5.5, duration: 0.25 },
            { note: 'C5', time: 5.75, duration: 0.25 },
            { note: 'E5', time: 6, duration: 0.5 },
            { note: 'B4', time: 6.5, duration: 0.5 },

            { note: 'E4', time: 7, duration: 0.5 },
            { note: 'A4', time: 7.5, duration: 0.25 },
            { note: 'B4', time: 7.75, duration: 0.25 },
            { note: 'C5', time: 8, duration: 0.5 },
            { note: 'B4', time: 8.5, duration: 0.25 },
            { note: 'A4', time: 8.75, duration: 0.25 },
            { note: 'G4', time: 9, duration: 1 },

            { note: 'E4', time: 10, duration: 0.5 },
            { note: 'A4', time: 10.5, duration: 0.25 },
            { note: 'B4', time: 10.75, duration: 0.25 },
            { note: 'C5', time: 11, duration: 0.5 },
            { note: 'B4', time: 11.5, duration: 0.25 },
            { note: 'C5', time: 11.75, duration: 0.25 },
            { note: 'E5', time: 12, duration: 0.5 },
            { note: 'B4', time: 12.5, duration: 0.5 },

            { note: 'A4', time: 13, duration: 0.5 },
            { note: 'E5', time: 13.5, duration: 0.5 },
            { note: 'D5', time: 14, duration: 0.5 },
            { note: 'C5', time: 14.5, duration: 0.5 },
            { note: 'B4', time: 15, duration: 0.5 },
            { note: 'A4', time: 15.5, duration: 0.5 },
        ]
    },
    {
        id: 'comptine',
        title: "Comptine d'un autre été",
        artist: 'Yann Tiersen',
        difficulty: 2,
        bpm: 100,
        color: ['#f093fb', '#f5576c'],
        icon: '🎬',
        notes: [
            // Left hand ostinato + right hand melody
            { note: 'E4', time: 0, duration: 0.5 },
            { note: 'E5', time: 0.5, duration: 0.5 },
            { note: 'B4', time: 1, duration: 0.5 },
            { note: 'C5', time: 1.5, duration: 0.5 },
            { note: 'D5', time: 2, duration: 0.5 },
            { note: 'E5', time: 2.5, duration: 0.25 },
            { note: 'D5', time: 2.75, duration: 0.25 },
            { note: 'C5', time: 3, duration: 0.5 },
            { note: 'B4', time: 3.5, duration: 0.5 },

            { note: 'E4', time: 4, duration: 0.5 },
            { note: 'E5', time: 4.5, duration: 0.5 },
            { note: 'B4', time: 5, duration: 0.5 },
            { note: 'C5', time: 5.5, duration: 0.5 },
            { note: 'D5', time: 6, duration: 1 },
            { note: 'C5', time: 7, duration: 0.5 },
            { note: 'B4', time: 7.5, duration: 0.5 },

            { note: 'A4', time: 8, duration: 0.5 },
            { note: 'E5', time: 8.5, duration: 0.5 },
            { note: 'B4', time: 9, duration: 0.5 },
            { note: 'C5', time: 9.5, duration: 0.5 },
            { note: 'D5', time: 10, duration: 0.5 },
            { note: 'E5', time: 10.5, duration: 0.25 },
            { note: 'D5', time: 10.75, duration: 0.25 },
            { note: 'C5', time: 11, duration: 0.5 },
            { note: 'B4', time: 11.5, duration: 0.5 },

            { note: 'E4', time: 12, duration: 0.5 },
            { note: 'E5', time: 12.5, duration: 0.5 },
            { note: 'B4', time: 13, duration: 0.5 },
            { note: 'C5', time: 13.5, duration: 0.5 },
            { note: 'D5', time: 14, duration: 1 },
            { note: 'E5', time: 15, duration: 1 },
        ]
    },
    {
        id: 'all-of-me',
        title: 'All of Me',
        artist: 'John Legend',
        difficulty: 2,
        bpm: 63,
        color: ['#ff9a9e', '#fad0c4'],
        icon: '❤️',
        notes: [
            // Simplified piano melody
            { note: 'E4', time: 0, duration: 0.75 },
            { note: 'G4', time: 0.75, duration: 0.25 },
            { note: 'A4', time: 1, duration: 0.75 },
            { note: 'A4', time: 1.75, duration: 0.25 },
            { note: 'G4', time: 2, duration: 1 },
            { note: 'E4', time: 3, duration: 0.5 },
            { note: 'D4', time: 3.5, duration: 0.5 },

            { note: 'C4', time: 4, duration: 1.5 },
            { note: 'D4', time: 5.5, duration: 0.5 },
            { note: 'E4', time: 6, duration: 1.5 },
            { note: 'D4', time: 7.5, duration: 0.5 },

            { note: 'E4', time: 8, duration: 0.75 },
            { note: 'G4', time: 8.75, duration: 0.25 },
            { note: 'A4', time: 9, duration: 0.75 },
            { note: 'A4', time: 9.75, duration: 0.25 },
            { note: 'G4', time: 10, duration: 1 },
            { note: 'E4', time: 11, duration: 0.5 },
            { note: 'D4', time: 11.5, duration: 0.5 },

            { note: 'C4', time: 12, duration: 1.5 },
            { note: 'B3', time: 13.5, duration: 0.5 },
            { note: 'A3', time: 14, duration: 1.5 },
            { note: 'G3', time: 15.5, duration: 0.5 },

            // Chorus: "cause all of me..."
            { note: 'C4', time: 16, duration: 1 },
            { note: 'D4', time: 17, duration: 0.5 },
            { note: 'E4', time: 17.5, duration: 0.5 },
            { note: 'F4', time: 18, duration: 0.5 },
            { note: 'E4', time: 18.5, duration: 0.5 },
            { note: 'D4', time: 19, duration: 0.5 },
            { note: 'C4', time: 19.5, duration: 0.5 },

            { note: 'E4', time: 20, duration: 1 },
            { note: 'F4', time: 21, duration: 0.5 },
            { note: 'G4', time: 21.5, duration: 0.5 },
            { note: 'A4', time: 22, duration: 0.5 },
            { note: 'G4', time: 22.5, duration: 0.5 },
            { note: 'F4', time: 23, duration: 0.5 },
            { note: 'E4', time: 23.5, duration: 0.5 },

            { note: 'C4', time: 24, duration: 1 },
            { note: 'D4', time: 25, duration: 0.5 },
            { note: 'E4', time: 25.5, duration: 0.5 },
            { note: 'F4', time: 26, duration: 0.5 },
            { note: 'E4', time: 26.5, duration: 0.5 },
            { note: 'D4', time: 27, duration: 0.5 },
            { note: 'C4', time: 27.5, duration: 0.5 },

            { note: 'A3', time: 28, duration: 1 },
            { note: 'B3', time: 29, duration: 1 },
            { note: 'C4', time: 30, duration: 2 },
        ]
    }
];

export function getSongs() {
    return songs;
}

export function getSongById(id) {
    return songs.find(s => s.id === id);
}

export default songs;
