import { GameSettings, Encounter, Direction } from '../types';

let audioContext: AudioContext | null = null;
let isInitialized = false;
let masterGain: GainNode | null = null;
let musicGain: GainNode | null = null;
let sfxGain: GainNode | null = null;
let currentSongTimeout: ReturnType<typeof setTimeout> | null = null;
let cachedMusicVolume = 1.0;
let currentTrackName: SongName | null = null;
let currentMapFloor: number | undefined = undefined;
let currentAlignment = 0; // -50 (dark) to 50 (light)

type ChartNote = { time: number; dir: Direction; flourish: boolean; duration: number; };
type RhythmTrack = { notes: ChartNote[]; tempo: number; };
let scheduledSongNodes: AudioNode[] = [];
let loopingSfx: { [key: string]: { osc: AudioNode, gain: GainNode, nodes: AudioNode[] } } = {};


type SongName = 'menu' | 'map' | 'fight' | 'gameOver' | 'boss' | 'guardian' | 'rhythm' | 'victory';

const init = () => {
    if (isInitialized || typeof window === 'undefined') return;
    try {
        const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
        if (!AudioContext) {
             console.error("Web Audio API is not supported in this browser");
             return;
        }
        audioContext = new AudioContext();
        
        if (audioContext.state === 'suspended') {
            const resumeContext = () => {
                audioContext?.resume();
                window.removeEventListener('click', resumeContext);
                window.removeEventListener('keydown', resumeContext);
            }
            window.addEventListener('click', resumeContext);
            window.addEventListener('keydown', resumeContext);
        }

        masterGain = audioContext.createGain();
        musicGain = audioContext.createGain();
        sfxGain = audioContext.createGain();
        
        musicGain.connect(masterGain);
        sfxGain.connect(masterGain);
        masterGain.connect(audioContext.destination);

        isInitialized = true;
    } catch(e) {
        console.error("Could not initialize Web Audio API.", e);
    }
};

const suspend = () => {
    if (audioContext && audioContext.state === 'running') {
        audioContext.suspend();
    }
};

const resume = () => {
    if (audioContext && audioContext.state === 'suspended') {
        audioContext.resume().then(() => {
            if (musicGain && audioContext) {
                const now = audioContext.currentTime;
                musicGain.gain.cancelScheduledValues(now);
                if (currentTrackName === 'rhythm') {
                    // For rhythm game, resume instantly to not mess up timing.
                    musicGain.gain.setValueAtTime(cachedMusicVolume, now);
                } else {
                    // For other music, ramp up to avoid a sudden blast.
                    musicGain.gain.setValueAtTime(0.0001, now);
                    musicGain.gain.linearRampToValueAtTime(cachedMusicVolume, now + 0.5);
                }
            }
        });
    }
}

const createFilteredSynth = (type: OscillatorType = 'sine', destination: GainNode | null, isMusic = false) => {
    if (!audioContext || !destination) return null;
    
    const play = (freq: number, time: number, duration: number, adsr = { attack: 0.01, decay: 0.1, sustain: 0.5, release: 0.2 }, customGain?: number, filterOptions?: { freq: number, q: number, type: BiquadFilterType }) => {
        if (!audioContext || !destination || !isFinite(freq) || freq <= 0 || !isFinite(duration) || duration <= 0) return;
        
        const osc = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        let filter: BiquadFilterNode | undefined;

        if (isMusic) {
            scheduledSongNodes.push(osc, gainNode);
        }

        osc.type = type;

        let lastNode: AudioNode = osc;
        
        if (filterOptions) {
            filter = audioContext.createBiquadFilter();
            filter.type = filterOptions.type;
            filter.frequency.setValueAtTime(filterOptions.freq, time);
            filter.Q.value = filterOptions.q;
            lastNode.connect(filter);
            lastNode = filter;
            if (isMusic) {
                scheduledSongNodes.push(filter);
            }
        }

        const startTime = Math.max(time, audioContext.currentTime);
        
        osc.frequency.setValueAtTime(freq, startTime);
        
        const detuneValue = (currentAlignment / 50) * 100;
        osc.detune.setValueAtTime(detuneValue, startTime);

        gainNode.connect(destination);
        lastNode.connect(gainNode);

        const finalSustain = customGain !== undefined ? adsr.sustain * customGain : adsr.sustain;

        gainNode.gain.cancelScheduledValues(startTime);
        gainNode.gain.setValueAtTime(0, startTime);

        let { attack, decay, release } = adsr;
        
        attack = Math.max(0.01, attack);
        decay = Math.max(0.01, decay);
        release = Math.max(0.01, release);

        const totalADR = attack + decay + release;
        
        if (totalADR > duration) {
            const scaleFactor = duration / totalADR;
            attack *= scaleFactor;
            decay *= scaleFactor;
            release *= scaleFactor;
        }

        const attackEndTime = startTime + attack;
        const decayEndTime = attackEndTime + decay;
        const noteEndTime = startTime + duration;
        const releaseStartTime = noteEndTime - release;

        gainNode.gain.linearRampToValueAtTime(customGain || 1.0, attackEndTime);
        
        if (decayEndTime > attackEndTime) {
            gainNode.gain.linearRampToValueAtTime(finalSustain, decayEndTime);
        }

        if (releaseStartTime > decayEndTime) {
            gainNode.gain.setValueAtTime(finalSustain, releaseStartTime);
        }
        
        gainNode.gain.linearRampToValueAtTime(0, noteEndTime);

        osc.start(startTime);
        osc.stop(noteEndTime);

        if (!isMusic) {
            osc.onended = () => {
                gainNode.disconnect();
                if (filter) filter.disconnect();
            }
        }
    }
    return { play };
};

const createNoiseSynth = (destination: GainNode | null, isMusic = false) => {
     if (!audioContext || !destination) return null;
     const play = (time: number, duration: number, filterFreq: number, q: number, gain?: number) => {
         if (!audioContext || !destination || !isFinite(filterFreq) || duration <= 0) return;
         const bufferSize = audioContext.sampleRate * duration;
         const buffer = audioContext.createBuffer(1, bufferSize, audioContext.sampleRate);
         const data = buffer.getChannelData(0);
         for(let i = 0; i < bufferSize; i++) {
             data[i] = Math.random() * 2 - 1;
         }
         const noise = audioContext.createBufferSource();
         noise.buffer = buffer;

         const filter = audioContext.createBiquadFilter();
         filter.type = 'bandpass';
         filter.frequency.value = filterFreq;
         filter.Q.value = q;

         const gainNode = audioContext.createGain();

         if (isMusic) {
            scheduledSongNodes.push(noise, filter, gainNode);
         }
         
         noise.connect(filter);
         filter.connect(gainNode);
         gainNode.connect(destination);
         
         const startTime = Math.max(time, audioContext.currentTime);
         const noteEndTime = startTime + duration;
         
         gainNode.gain.setValueAtTime(gain || 1, startTime);
         gainNode.gain.exponentialRampToValueAtTime(0.01, noteEndTime);
         
         noise.start(startTime);
         noise.stop(noteEndTime);
         
         if (!isMusic) {
             noise.onended = () => {
                 filter.disconnect();
                 gainNode.disconnect();
             }
         }
     }
     return { play };
};

type LoopingSfxType = 'focus_sustain' | 'burning_sustain' | 'crescendo_loop' | 'tempo_shift_ambience';

const startLoopingSfx = (type: LoopingSfxType, customVolume?: number) => {
    if (!audioContext || !sfxGain || loopingSfx[type]) return;

    const tempGain = audioContext.createGain();
    tempGain.gain.value = customVolume !== undefined ? customVolume : 1.0;
    tempGain.connect(sfxGain);

    const now = audioContext.currentTime;
    const allNodes: AudioNode[] = [tempGain];
    let oscNode: AudioNode;

    switch (type) {
        case 'focus_sustain': {
            const osc = audioContext.createOscillator();
            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(80, now);
            
            const lfo = audioContext.createOscillator();
            lfo.type = 'sine';
            lfo.frequency.setValueAtTime(5, now);
            const lfoGain = audioContext.createGain();
            lfoGain.gain.setValueAtTime(10, now);
            lfo.connect(lfoGain);
            lfoGain.connect(osc.detune);

            const filter = audioContext.createBiquadFilter();
            filter.type = 'lowpass';
            filter.frequency.setValueAtTime(300, now);
            
            osc.connect(filter);
            filter.connect(tempGain);
            
            tempGain.gain.setValueAtTime(0, now);
            tempGain.gain.linearRampToValueAtTime(0.2, now + 0.5);

            osc.start(now);
            lfo.start(now);
            oscNode = osc;
            allNodes.push(osc, lfo, lfoGain, filter);
            break;
        }
        case 'burning_sustain': {
            const noise = audioContext.createBufferSource();
            const bufferSize = audioContext.sampleRate * 2;
            const buffer = audioContext.createBuffer(1, bufferSize, audioContext.sampleRate);
            const data = buffer.getChannelData(0);
            for (let i = 0; i < bufferSize; i++) {
                data[i] = Math.random() * 2 - 1;
            }
            noise.buffer = buffer;
            noise.loop = true;

            const filter = audioContext.createBiquadFilter();
            filter.type = 'bandpass';
            filter.frequency.setValueAtTime(1000, now);
            filter.Q.value = 5;

            const lfo = audioContext.createOscillator();
            lfo.type = 'sine';
            lfo.frequency.setValueAtTime(3, now);
            const lfoGain = audioContext.createGain();
            lfoGain.gain.setValueAtTime(300, now);
            lfo.connect(lfoGain);
            lfoGain.connect(filter.frequency);

            noise.connect(filter);
            filter.connect(tempGain);
            
            tempGain.gain.setValueAtTime(0, now);
            tempGain.gain.linearRampToValueAtTime(0.1, now + 0.3);

            noise.start(now);
            lfo.start(now);
            oscNode = noise;
            allNodes.push(noise, filter, lfo, lfoGain);
            break;
        }
        case 'crescendo_loop': {
            const osc1 = audioContext.createOscillator(); osc1.type = 'sawtooth'; osc1.frequency.setValueAtTime(261.63, now);
            const osc2 = audioContext.createOscillator(); osc2.type = 'sawtooth'; osc2.frequency.setValueAtTime(261.63 * 1.5, now);
            const filter = audioContext.createBiquadFilter(); filter.type = 'lowpass'; filter.frequency.setValueAtTime(800, now); filter.Q.value = 0.8;
            const lfo = audioContext.createOscillator(); lfo.type = 'sine'; lfo.frequency.setValueAtTime(6, now);
            const lfoGain = audioContext.createGain(); lfoGain.gain.setValueAtTime(5, now);
            lfo.connect(lfoGain); lfoGain.connect(osc1.detune); lfoGain.connect(osc2.detune);
            
            osc1.connect(filter); osc2.connect(filter);
            filter.connect(tempGain);

            tempGain.gain.setValueAtTime(0, now);
            tempGain.gain.linearRampToValueAtTime(0.15, now + 1.0); // Swell in

            osc1.start(now); osc2.start(now); lfo.start(now);
            oscNode = osc1;
            allNodes.push(osc1, osc2, filter, lfo, lfoGain);
            break;
        }
        case 'tempo_shift_ambience': {
            const osc = audioContext.createOscillator(); osc.type = 'sine'; osc.frequency.setValueAtTime(60, now);
            const filter = audioContext.createBiquadFilter(); filter.type = 'bandpass'; filter.frequency.setValueAtTime(120, now); filter.Q.value = 1;
            const lfo = audioContext.createOscillator(); lfo.type = 'sine'; lfo.frequency.setValueAtTime(0.2, now);
            const lfoGain = audioContext.createGain(); lfoGain.gain.setValueAtTime(40, now);
            lfo.connect(lfoGain); lfoGain.connect(filter.frequency);
            
            osc.connect(filter);
            filter.connect(tempGain);
            
            tempGain.gain.setValueAtTime(0, now);
            tempGain.gain.linearRampToValueAtTime(0.2, now + 2.0); // slow fade in

            osc.start(now); lfo.start(now);
            oscNode = osc;
            allNodes.push(osc, filter, lfo, lfoGain);
            break;
        }
    }
    loopingSfx[type] = { osc: oscNode, gain: tempGain, nodes: allNodes };
};

const stopLoopingSfx = (type: LoopingSfxType) => {
    if (!audioContext || !loopingSfx[type]) return;

    const { gain, nodes } = loopingSfx[type];
    const now = audioContext.currentTime;

    gain.gain.cancelScheduledValues(now);
    gain.gain.setValueAtTime(gain.gain.value, now);
    gain.gain.linearRampToValueAtTime(0, now + 0.3);

    setTimeout(() => {
        nodes.forEach(node => {
            if (node instanceof OscillatorNode || node instanceof AudioBufferSourceNode) {
                 try { (node as any).stop(); } catch(e) {}
            }
            node.disconnect();
        });
    }, 300);

    delete loopingSfx[type];
};

const stopSong = () => {
    if (currentSongTimeout) {
        clearTimeout(currentSongTimeout);
        currentSongTimeout = null;
    }
    if (scheduledSongNodes.length > 0) {
        scheduledSongNodes.forEach(node => {
            if (node && typeof node.disconnect === 'function') {
                try {
                    node.disconnect();
                } catch (e) {}
            }
        });
        scheduledSongNodes = [];
    }
    // Don't reset currentTrackName here, so startSong can check it
};

const fadeSong = (duration: number) => {
    if (!musicGain || !audioContext) return;
    
    const now = audioContext.currentTime;
    musicGain.gain.cancelScheduledValues(now);
    
    musicGain.gain.setValueAtTime(musicGain.gain.value, now);
    
    musicGain.gain.linearRampToValueAtTime(0.0001, now + duration);
};

const getAudioContext = () => {
    return audioContext;
};

const resumeContext = async (): Promise<boolean> => {
    if (!audioContext) return false;
    if (audioContext.state === 'suspended') {
        await audioContext.resume();
    }
    return true;
}

const floorMusicData = {
    1: { scale: [130.81, 155.56, 196.00, 220.00, 261.63, 311.13], progression: [0, 3, 2, 4], baseTempo: 120 }, // C minor pentatonic
    2: { scale: [146.83, 174.61, 207.65, 246.94, 293.66, 349.23], progression: [0, 2, 3, 1], baseTempo: 125 }, // D Phrygian
    3: { scale: [110.00, 138.59, 164.81, 185.00, 220.00, 277.18], progression: [0, 4, 1, 3], baseTempo: 130 }, // A Harmonic Minor
    4: { scale: [98.00, 116.54, 146.83, 164.81, 196.00, 233.08], progression: [0, 3, 1, 2], baseTempo: 135 }, // G Dorian
    5: { scale: [130.81, 146.83, 185.00, 196.00, 246.94, 277.18], progression: [0, 5, 2, 4], baseTempo: 140 }, // C Lydian b7
};

const generateRhythmTrack = async (archetype: 'fighter' | 'dancer' | 'balanced' = 'balanced', floor: number = 1): Promise<RhythmTrack | null> => {
    const contextReady = await resumeContext();
    if (!contextReady || !audioContext || !musicGain) return null;

    stopSong();
    currentTrackName = 'rhythm';
    currentMapFloor = undefined;
    
    const currentFloorMusic = floorMusicData[floor as keyof typeof floorMusicData] || floorMusicData[1];

    let tempo = currentFloorMusic.baseTempo;
    let noteDensity = 0.45;
    const { scale, progression } = currentFloorMusic;
    const drumMapping: {[key: string]: Direction} = { kick: 'down', snare: 'up', hihat: 'left' };

    if (archetype === 'dancer') { tempo += 15; noteDensity = 0.55; }
    if (archetype === 'fighter') { tempo -= 10; noteDensity = 0.35; }
    
    noteDensity += (floor - 1) * 0.03;

    const eighthNoteTime = 60 / tempo / 2;
    const barTime = eighthNoteTime * 8;
    const totalBars = 24 + (floor - 1) * 5;
    const startTime = audioContext.currentTime + 3.5;

    const chart: ChartNote[] = [];

    const kick = createNoiseSynth(musicGain, true);
    const snare = createNoiseSynth(musicGain, true);
    const hihat = createNoiseSynth(musicGain, true);
    const bass = createFilteredSynth('sawtooth', musicGain, true);
    const arp = createFilteredSynth('triangle', musicGain, true);

    for (let bar = 0; bar < totalBars; bar++) {
        const barStartTime = startTime + bar * barTime;
        const rootIndex = progression[bar % progression.length];
        const rootNote = scale[rootIndex] / 2;

        bass?.play(rootNote, barStartTime, barTime, {attack: 0.02, decay: 0.3, sustain: 0.1, release: 0.2}, 0.5, {freq: 600, q: 2, type: 'lowpass'});
        
        for (let beat = 0; beat < 8; beat++) {
            const time = barStartTime + beat * eighthNoteTime;
            
            if (beat === 0 || beat === 4) {
                kick?.play(time, 0.1, 80, 1, 0.7);
                if (Math.random() < noteDensity * 1.2) {
                    chart.push({ time, dir: drumMapping.kick, flourish: Math.random() < 0.1, duration: eighthNoteTime });
                }
            }
            if (beat === 2 || beat === 6) {
                snare?.play(time, 0.1, 1000, 2, 0.5);
                 if (Math.random() < noteDensity) {
                    chart.push({ time, dir: drumMapping.snare, flourish: Math.random() < 0.1, duration: eighthNoteTime });
                }
            }
            
            hihat?.play(time, 0.05, 7000, 5, 0.1);
            if (Math.random() < noteDensity * 0.5) {
                chart.push({ time, dir: Math.random() < 0.5 ? 'left' : 'right', flourish: Math.random() < 0.2, duration: eighthNoteTime });
            }

             if (archetype !== 'fighter' && beat % 2 === 1) {
                const arpNoteIndex = (rootIndex + [0,1,2,3][Math.floor(beat/2)]) % scale.length;
                const arpOctave = archetype === 'dancer' ? 2 : 1;
                arp?.play(scale[arpNoteIndex] * arpOctave, time, eighthNoteTime * 1.5, {attack: 0.01, decay: 0.1, sustain: 0.1, release: 0.1}, 0.25, {freq: 2000, q: 1, type: 'lowpass'});
             }
        }
    }
    
    const sortedChart = chart.sort((a,b) => a.time - b.time).filter((note, i, arr) => {
        if (i > 0 && note.time - arr[i-1].time < eighthNoteTime * 0.9) {
            return false;
        }
        return true;
    });

    return { notes: sortedChart, tempo };
};

const songs = {
    menu: () => {
        const scale = [130, 164, 196, 246, 261, 329, 392]; // C minor
        const padSynth = createFilteredSynth('sawtooth', musicGain, true);
        const leadSynth = createFilteredSynth('sine', musicGain, true);
        let beat = 0;
        
        function scheduleNextMeasure() {
            if (!audioContext || currentTrackName !== 'menu') return;
            const tempo = 50 + Math.sin(beat * 0.1) * 5;
            const measureTime = (60 / tempo) * 1000 * 4;
            const now = audioContext.currentTime;

            const progression = [0, 4, 5, 3]; // i-V-vi-IV in C minor
            const root = scale[progression[beat % progression.length]];
            padSynth?.play(root / 2, now, measureTime/1000, { attack: 0.8, decay: 2, sustain: 0.3, release: 2}, 0.2, {freq: 800 + Math.sin(beat/2) * 200, q:0.5, type:'lowpass'});
            padSynth?.play(root / 2 * 1.5, now, measureTime/1000, { attack: 0.8, decay: 2, sustain: 0.3, release: 2}, 0.15, {freq: 1200, q:0.5, type:'lowpass'});

            if (Math.random() < 0.6) {
                const note = scale[Math.floor(Math.random() * scale.length)];
                leadSynth?.play(note * (Math.random() > 0.6 ? 2 : 1), now, 5, { attack: 0.5, decay: 2, sustain: 0.1, release: 2.5 }, 0.4);
            }
            beat++;
            currentSongTimeout = setTimeout(scheduleNextMeasure, measureTime);
        }
        scheduleNextMeasure();
    },
    map: [
        () => { // Floor 1: Gentle and hopeful
            const scale = [130.81, 164.81, 196.00, 220.00, 261.63]; // C Major Pentatonic
            const pad = createFilteredSynth('triangle', musicGain, true);
            const lead = createFilteredSynth('sine', musicGain, true);
            const schedulePart = () => {
                if (!audioContext || currentTrackName !== 'map' || currentMapFloor !== 1) return;
                const now = audioContext.currentTime;
                const partDuration = 10000;
                pad?.play(scale[0]/2, now, partDuration/1000, {attack: 4, decay: 4, sustain: 0.1, release: 2}, 0.3);
                const numNotes = 3 + Math.floor(Math.random() * 4);
                for(let i=0; i<numNotes; i++) {
                    const noteTime = now + (Math.random() * partDuration/1000 * 0.9);
                    const note = scale[Math.floor(Math.random() * scale.length)];
                    lead?.play(note * 2, noteTime, 3, {attack: 0.3, decay: 1.5, sustain: 0.1, release: 1.2}, 0.4);
                }
                currentSongTimeout = setTimeout(schedulePart, partDuration);
            }
            schedulePart();
        },
        () => { // Floor 2: Shimmering and crystalline
            const scale = [146.83, 174.61, 220.00, 293.66, 349.23]; // D Lydian pentatonic
            const bell = createFilteredSynth('triangle', musicGain, true);
            let beat = 0;
            const scheduleBeat = () => {
                if (!audioContext || currentTrackName !== 'map' || currentMapFloor !== 2) return;
                const tempo = 80;
                const interval = (60 / tempo) * 1000; // Quarter note
                const now = audioContext.currentTime;
                
                const note = scale[beat % scale.length];
                bell?.play(note * 2, now, 1.5, {attack: 0.01, decay: 1, sustain: 0.2, release: 0.5}, 0.3);
                if (Math.random() < 0.3) {
                    bell?.play(note * 4, now + interval/2000, 1.0, {attack: 0.01, decay: 0.8, sustain: 0.1, release: 0.2}, 0.2);
                }
                beat++;
                currentSongTimeout = setTimeout(scheduleBeat, interval);
            }
            scheduleBeat();
        },
        () => { // Floor 3: Mysterious, less harsh
            const scale = [110.00, 123.47, 130.81, 146.83, 164.81, 185.00, 207.65]; // A Harmonic Minor
            const drone = createFilteredSynth('sawtooth', musicGain, true);
            const arp = createFilteredSynth('sine', musicGain, true);
            let beat = 0;
            const scheduleBeat = () => {
                if (!audioContext || currentTrackName !== 'map' || currentMapFloor !== 3) return;
                const tempo = 75;
                const interval = (60 / tempo) * 500; // eighth note
                const now = audioContext.currentTime;

                const progression = [0, 4, 5, 2]; // Am, E, F, C
                const chordRootIndex = progression[Math.floor(beat / 8) % progression.length];
                
                if (beat % 16 === 0) {
                    drone?.play(scale[chordRootIndex]/2, now, interval*16/1000, {attack: 2, decay: 4, sustain: 0.1, release: 2}, 0.15, {freq: 400, q: 1, type: 'lowpass'});
                }
                
                const arpPattern = [0, 2, 1, 3]; // indices relative to chord root
                const arpNoteInChord = arpPattern[beat % arpPattern.length];
                const arpNoteIndex = (chordRootIndex + arpNoteInChord) % scale.length;

                arp?.play(scale[arpNoteIndex], now, 0.4, {attack: 0.01, decay: 0.3, sustain: 0, release: 0.1}, 0.35);
                
                beat++;
                currentSongTimeout = setTimeout(scheduleBeat, interval);
            }
            scheduleBeat();
        },
        () => { // Floor 4: Deep, spacious, and mysterious
            const scale = [98.00, 110.00, 116.54, 130.81, 146.83, 164.81, 185.00]; // G Dorian
            const pad = createFilteredSynth('triangle', musicGain, true);
            const lead = createFilteredSynth('sine', musicGain, true);
            const schedulePart = () => {
                if (!audioContext || currentTrackName !== 'map' || currentMapFloor !== 4) return;
                const now = audioContext.currentTime;
                const partDuration = 10000 + Math.random() * 4000;

                pad?.play(scale[0] / 2, now, partDuration/1000, {attack: 5, decay: 5, sustain: 0.1, release: 2}, 0.25);
                
                const numNotes = 1 + Math.floor(Math.random() * 3);
                for(let i=0; i<numNotes; i++) {
                    const noteTime = now + (Math.random() * partDuration/1000 * 0.8);
                    const note = scale[Math.floor(Math.random() * scale.length)];
                    lead?.play(note, noteTime, 6, {attack: 1, decay: 3, sustain: 0.1, release: 2}, 0.35);
                }

                currentSongTimeout = setTimeout(schedulePart, partDuration);
            }
            schedulePart();
        },
        () => { // Floor 5: Unsettling but not harsh
            const scale = [130.81, 146.83, 164.81, 185.00, 207.65, 233.08]; // C Whole Tone
            const pad = createFilteredSynth('sawtooth', musicGain, true);
            const bell = createFilteredSynth('sine', musicGain, true);
            const schedulePart = () => {
                if (!audioContext || currentTrackName !== 'map' || currentMapFloor !== 5) return;
                const now = audioContext.currentTime;
                const partDuration = 14000 + Math.random() * 5000;

                const rootNote = scale[Math.floor(Math.random() * 3)]; // Low root notes
                pad?.play(rootNote / 4, now, partDuration/1000, {attack: 6, decay: 6, sustain: 0.05, release: 2}, 0.2, {freq: 250, q: 3, type: 'lowpass'});

                if (Math.random() < 0.7) {
                    const bellNoteTime = now + Math.random() * (partDuration / 1000 - 4);
                    const bellNote = scale[Math.floor(Math.random() * scale.length)];
                    // Play at a higher octave, but softly with a sine wave
                    bell?.play(bellNote * 4, bellNoteTime, 4, {attack: 0.01, decay: 2, sustain: 0.1, release: 2}, 0.25);
                }

                currentSongTimeout = setTimeout(schedulePart, partDuration);
            }
            schedulePart();
        },
    ],
    fight: [
        () => { // Percussive and tribal
            const kick = createNoiseSynth(musicGain, true);
            const snare = createNoiseSynth(musicGain, true);
            const bass = createFilteredSynth('sine', musicGain, true);
            let beat = 0;
            const scheduleBeat = () => {
                if (!audioContext || currentTrackName !== 'fight') return;
                const tempo = 130;
                const interval = (60 / tempo) * 250; // 16th note
                const now = audioContext.currentTime;

                if (beat % 4 === 0) kick?.play(now, 0.2, 80, 1, 0.9);
                if (beat % 4 === 2) snare?.play(now, 0.15, 1200, 1.5, 0.6);
                if (Math.random() < 0.2) snare?.play(now + interval/1000 * 0.5, 0.05, 3000, 5, 0.2);
                if (beat % 8 === 0) bass?.play(73.42, now, 0.4, { attack: 0.01, decay: 0.3, sustain: 0.1, release: 0.1 }, 0.5);
                if (beat % 8 === 4) bass?.play(82.41, now, 0.2, { attack: 0.01, decay: 0.1, sustain: 0.1, release: 0.1 }, 0.5);

                beat++;
                currentSongTimeout = setTimeout(scheduleBeat, interval * 2);
            }
            scheduleBeat();
        },
        () => { // Electronic and Driving
            const bass = createFilteredSynth('sawtooth', musicGain, true);
            const arp = createFilteredSynth('square', musicGain, true);
            const kick = createNoiseSynth(musicGain, true);
            let beat = 0;
            const scheduleBeat = () => {
                if (!audioContext || currentTrackName !== 'fight') return;
                const tempo = 150;
                const interval = (60 / tempo) * 250;
                const now = audioContext.currentTime;
                const scale = [110.00, 130.81, 164.81, 185.00, 220.00];

                if (beat % 4 === 0) kick?.play(now, 0.1, 100, 1, 1.0);
                const bassNote = scale[Math.floor(beat/8) % 2];
                bass?.play(bassNote / 2, now, 0.1, {attack: 0.01, decay: 0.08, sustain: 0.0, release: 0.01}, 0.6, {freq: 400, q: 2, type: 'lowpass'});
                const arpNote = scale[(beat % 5)];
                arp?.play(arpNote * 2, now, 0.1, {attack: 0.01, decay: 0.05, sustain: 0.1, release: 0.05}, 0.2, {freq: 1500, q: 1, type: 'bandpass'});

                beat++;
                currentSongTimeout = setTimeout(scheduleBeat, interval);
            }
            scheduleBeat();
        },
        () => { // Ominous and Atmospheric
            const drone = createFilteredSynth('sawtooth', musicGain, true);
            const hit = createNoiseSynth(musicGain, true);
            const bell = createFilteredSynth('triangle', musicGain, true);
            let beat = 0;

            const schedulePart = () => {
                if (!audioContext || currentTrackName !== 'fight') return;
                const now = audioContext.currentTime;
                const partDuration = 8000;

                drone?.play(65.41, now, partDuration/1000, {attack: 3, decay: 3, sustain: 0.2, release: 2}, 0.3, {freq: 500, q: 1, type: 'lowpass'});
                if (beat % 2 === 0) {
                    hit?.play(now, 1.5, 150, 0.5, 0.7);
                } else {
                    bell?.play(261.63 * 2, now + 1, 2, {attack: 0.01, decay: 1.5, sustain: 0.05, release: 0.5}, 0.4);
                }
                beat++;
                currentSongTimeout = setTimeout(schedulePart, partDuration);
            }
            schedulePart();
        }
    ],
    boss: [
        () => { // PURE_SHADOW (alignment <= -45)
            const scale = [130.81, 155.56, 164.81, 196.00, 207.65, 246.94]; // C Minor
            const bass = createFilteredSynth('sawtooth', musicGain, true);
            const pad = createFilteredSynth('triangle', musicGain, true);
            const lead = createFilteredSynth('square', musicGain, true);
            const kick = createNoiseSynth(musicGain, true);
            let beat = 0;
            const scheduleBeat = () => {
                if (!audioContext || currentTrackName !== 'boss') return;
                const tempo = 140;
                const interval = (60 / tempo) * 250; // 16th note
                const now = audioContext.currentTime;
                const progression = [0, 5, 2, 4]; // i-VI-III-V

                if (beat % 4 === 0) kick?.play(now, 0.15, 60, 1, 1.0);
                
                const bassNote = scale[progression[Math.floor(beat / 8) % progression.length]];
                bass?.play(bassNote / 4, now, interval * 2 / 1000, {attack:0.01, decay:0.1, sustain:0.1, release:0.05}, 0.5, {freq: 400, q: 3, type: 'lowpass'});

                if (beat % 16 === 0) {
                    pad?.play(bassNote / 2, now, interval * 16 / 1000, {attack: 0.8, decay: 1.5, sustain: 0.3, release: 1.5}, 0.2, {freq: 800, q: 1, type: 'lowpass'});
                    pad?.play(scale[(progression[Math.floor(beat / 8) % progression.length] + 2) % scale.length] / 2, now, interval * 16 / 1000, {attack: 0.8, decay: 1.5, sustain: 0.3, release: 1.5}, 0.2, {freq: 800, q: 1, type: 'lowpass'});
                }
                
                if (beat % 32 > 24 && Math.random() < 0.5) {
                    const leadNote = scale[Math.floor(Math.random() * scale.length)];
                    lead?.play(leadNote, now, 0.2, {attack:0.01, decay:0.1, sustain:0.0, release:0.1}, 0.25, {freq: 1200, q: 1, type: 'bandpass'});
                }

                beat++;
                currentSongTimeout = setTimeout(scheduleBeat, interval);
            }
            scheduleBeat();
        },
        () => { // TAINTED_SHADOW (-45 < alignment <= -20)
            const scale = [196.00, 220.00, 233.08, 261.63, 293.66, 311.13, 349.23]; // G Minor
            const bass = createFilteredSynth('sine', musicGain, true);
            const pad = createFilteredSynth('sawtooth', musicGain, true);
            const lead = createFilteredSynth('sine', musicGain, true);
            const snare = createNoiseSynth(musicGain, true);
            let beat = 0;
            const scheduleBeat = () => {
                if (!audioContext || currentTrackName !== 'boss') return;
                const tempo = 130;
                const interval = (60 / tempo) * 500; // 8th note
                const now = audioContext.currentTime;
                const progression = [0, 3, 4, 1]; // i-iv-V-ii°

                if (beat % 4 === 2) snare?.play(now, 0.15, 1200, 3, 0.4);

                if (beat % 2 === 0) {
                    const bassNote = scale[progression[Math.floor(beat / 4) % progression.length]];
                    bass?.play(bassNote / 4, now, interval * 2 / 1000, {attack: 0.01, decay: 0.3, sustain: 0, release: 0.1}, 0.6);
                }

                if (beat % 8 === 0) {
                     const padNote = scale[progression[Math.floor(beat / 4) % progression.length]];
                     pad?.play(padNote / 2, now, interval * 8 / 1000, {attack:1.0, decay:1.5, sustain:0.4, release:1.5}, 0.15, {freq: 600, q: 2, type: 'lowpass'});
                }
                
                if (beat % 4 === 0 && Math.random() > 0.3) {
                    const leadNote = scale[[0,2,4,5][Math.floor(Math.random() * 4)]];
                    lead?.play(leadNote, now, 1.5, {attack:0.1, decay:1.0, sustain:0.1, release:0.4}, 0.35);
                }

                beat++;
                currentSongTimeout = setTimeout(scheduleBeat, interval);
            }
            scheduleBeat();
        },
        () => { // BALANCE (-20 < alignment < 20)
            const scale = [220.00, 261.63, 293.66, 329.63, 392.00]; // A Minor Pentatonic
            const piano = createFilteredSynth('sine', musicGain, true);
            const pad = createFilteredSynth('triangle', musicGain, true);
            const kick = createFilteredSynth('sine', musicGain, true);
            let beat = 0;
            const scheduleBeat = () => {
                if (!audioContext || currentTrackName !== 'boss') return;
                const tempo = 120;
                const interval = (60 / tempo) * 1000; // quarter note
                const now = audioContext.currentTime;
                const progression = [0, 4, 2, 3]; // i-V-iii-iv

                if (beat % 4 === 0) {
                    kick?.play(scale[0]/2, now, 0.1, {attack:0.01, decay:0.05, sustain:0, release:0.05}, 0.7);
                }

                if (beat % 2 === 0) {
                    const chordRoot = scale[progression[Math.floor(beat/4) % progression.length]];
                    piano?.play(chordRoot, now, 0.4, {attack:0.01, decay:0.3, sustain:0, release:0.1}, 0.4);
                    piano?.play(scale[(progression[Math.floor(beat/4) % progression.length] + 2) % scale.length], now, 0.4, {attack:0.01, decay:0.3, sustain:0, release:0.1}, 0.3);
                }

                if (beat % 8 === 0) {
                     const padNote = scale[progression[Math.floor(beat/4) % progression.length]];
                     pad?.play(padNote / 2, now, interval * 8 / 1000, {attack:2.0, decay:2.0, sustain:0.5, release:2.0}, 0.2);
                }

                beat++;
                currentSongTimeout = setTimeout(scheduleBeat, interval / 2); // 8th note rhythm
            }
            scheduleBeat();
        },
        () => { // HARMONIOUS SHEPHERD (20 <= alignment < 45)
            const scale = [174.61, 196.00, 233.08, 261.63, 311.13, 349.23]; // F Major Pentatonic (no 4th)
            const pad = createFilteredSynth('sawtooth', musicGain, true);
            const arp = createFilteredSynth('triangle', musicGain, true);
            const lead = createFilteredSynth('sine', musicGain, true);
            const hihat = createNoiseSynth(musicGain, true);
            let beat = 0;
            const scheduleBeat = () => {
                if (!audioContext || currentTrackName !== 'boss') return;
                const tempo = 125;
                const interval = (60 / tempo) * 250; // 16th note
                const now = audioContext.currentTime;
                const progression = [0, 4, 1, 3]; // I-V-ii-IV

                if (beat % 2 === 0) hihat?.play(now, 0.05, 8000, 10, 0.1);
                
                if (beat % 8 === 0) {
                    const chordRoot = scale[progression[Math.floor(beat / 8) % progression.length]];
                    pad?.play(chordRoot / 2, now, interval * 8 / 1000, {attack:0.5, decay:1.0, sustain:0.3, release:1.0}, 0.3, {freq: 1200, q: 1, type: 'lowpass'});
                    pad?.play(scale[(progression[Math.floor(beat / 8) % progression.length] + 2) % scale.length] / 2, now, interval * 8 / 1000, {attack:0.5, decay:1.0, sustain:0.3, release:1.0}, 0.2, {freq: 1200, q: 1, type: 'lowpass'});
                }

                const arpNoteIdx = (beat + Math.floor(beat / 4)) % scale.length;
                arp?.play(scale[arpNoteIdx], now, 0.2, {attack:0.01, decay:0.1, sustain:0.0, release:0.1}, 0.3);

                if (beat % 16 === 0 && Math.random() > 0.2) {
                    lead?.play(scale[progression[Math.floor(beat/8) % progression.length]] * 2, now, 2.0, {attack:0.2, decay:1.0, sustain:0.2, release:0.8}, 0.4);
                }
                
                beat++;
                currentSongTimeout = setTimeout(scheduleBeat, interval);
            }
            scheduleBeat();
        },
        () => { // PURE HARMONY (alignment >= 45)
            const scale = [261.63, 293.66, 329.63, 349.23, 392.00, 440.00, 493.88, 523.25]; // C Major
            const pad1 = createFilteredSynth('triangle', musicGain, true);
            const pad2 = createFilteredSynth('sine', musicGain, true);
            const bell = createFilteredSynth('sine', musicGain, true);
            let beat = 0;
            const schedulePart = () => {
                if (!audioContext || currentTrackName !== 'boss') return;
                const now = audioContext.currentTime;
                const partDuration = 8000;
                const progression = [0, 5, 3, 4]; // I-vi-IV-V

                const rootNote = scale[progression[beat % progression.length]];
                pad1?.play(rootNote / 2, now, partDuration/1000, {attack:3, decay:3, sustain:0.3, release:2}, 0.25);
                pad2?.play(scale[(progression[beat % progression.length] + 2) % scale.length] / 2, now, partDuration/1000, {attack:3, decay:3, sustain:0.3, release:2}, 0.2);
                pad2?.play(scale[(progression[beat % progression.length] + 4) % scale.length] / 2, now, partDuration/1000, {attack:3, decay:3, sustain:0.3, release:2}, 0.2);

                for (let i = 0; i < 8; i++) {
                    if (Math.random() > 0.6) {
                        const bellNote = scale[Math.floor(Math.random() * scale.length)];
                        bell?.play(bellNote * 2, now + i, 2.0, {attack: 0.01, decay: 1.5, sustain: 0.1, release: 0.5}, 0.25);
                    }
                }
                
                beat++;
                currentSongTimeout = setTimeout(schedulePart, partDuration);
            }
            schedulePart();
        }
    ],
    guardian: () => { // Ominous and powerful
        const scale = [82, 98, 123, 146, 164]; // E Phrygian
        const bass = createFilteredSynth('sawtooth', musicGain, true);
        const pad = createFilteredSynth('sine', musicGain, true);
        const kick = createNoiseSynth(musicGain, true);
        let beat = 0;

        const scheduleBeat = () => {
            if (!audioContext || currentTrackName !== 'guardian') return;
            const tempo = 120;
            const interval = 60 / tempo * 250;
            const now = audioContext.currentTime;

            if (beat % 4 === 0) kick?.play(now, 0.2, 80, 0.8, 1);
            
            if (beat % 8 === 0) {
                 bass?.play(scale[0]/2, now, 0.9, {attack: 0.1, decay: 0.3, sustain: 0.1, release: 0.4}, 0.7, {freq: 500, q: 1.5, type: 'lowpass'});
            }
            if (beat % 16 === 0) {
                 pad?.play(scale[2], now, 3.8, {attack: 1.5, decay: 1.0, sustain: 0.5, release: 1.0}, 0.3);
            }

            beat++;
            currentSongTimeout = setTimeout(scheduleBeat, interval);
        }
        scheduleBeat();
    },
    gameOver: () => {
        const synth = createFilteredSynth('sine', musicGain, true);
        if (!audioContext) return;
        const now = audioContext.currentTime;
        const notes = [392.00, 311.13, 261.63, 196.00]; // G4, Eb4, C4, G3
        notes.forEach((note, i) => {
            synth?.play(note, now + i * 0.8, 2.5, { attack: 0.1, decay: 1, sustain: 0.2, release: 1.4 }, 0.3);
        });
    },
    victory: () => {
        const synth = createFilteredSynth('triangle', musicGain, true);
        if (!audioContext) return;
        const now = audioContext.currentTime;
        const scale = [261, 329, 392, 523];
        synth?.play(scale[0], now, 0.2);
        synth?.play(scale[1], now + 0.2, 0.2);
        synth?.play(scale[2], now + 0.4, 0.2);
        synth?.play(scale[3], now + 0.6, 0.5, {attack:0.01, decay:0.2, sustain:0.3, release:0.2}, 0.7);
    }
};

const startSong = (trackName: SongName, arg?: any) => {
    if (!isInitialized || !audioContext) return;
    
    // Check if the correct song is already playing to avoid unnecessary restarts.
    if (trackName === 'map') {
        if (currentTrackName === 'map' && currentMapFloor === arg) {
            return; // Music for this floor is already playing.
        }
    } else if (currentTrackName === trackName) {
        return; // This song is already playing.
    }
    
    const play = () => {
        stopSong();

        if (musicGain && audioContext) {
            const now = audioContext.currentTime;
            musicGain.gain.cancelScheduledValues(now);
            musicGain.gain.setValueAtTime(0.0001, now); // Start silent
            musicGain.gain.linearRampToValueAtTime(cachedMusicVolume, now + 0.5); // Fade in
        }

        currentTrackName = trackName;
        if(trackName === 'map') {
            currentMapFloor = arg;
        } else {
            currentMapFloor = undefined;
        }
        
        const songOrSongs = songs[trackName as Exclude<SongName, 'rhythm'>];

        if (typeof songOrSongs === 'function') {
             (songOrSongs as (arg?: any) => void)(arg);
        } else if (Array.isArray(songOrSongs)) {
            let songFunc = songOrSongs[0];

            if (trackName === 'map') {
                const floor = arg || 1;
                songFunc = songOrSongs[(floor - 1) % songOrSongs.length];
            } else if (trackName === 'boss') {
                const alignment = arg as number || 0;
                if (alignment <= -45) songFunc = songOrSongs[0];      // PURE_SHADOW
                else if (alignment <= -20) songFunc = songOrSongs[1]; // TAINTED_SHADOW
                else if (alignment < 20) songFunc = songOrSongs[2];  // BALANCE
                else if (alignment < 45) songFunc = songOrSongs[3];   // HARMONIOUS_SHEPHERD
                else songFunc = songOrSongs[4];                      // PURE_HARMONY
            } else {
                songFunc = songOrSongs[Math.floor(Math.random() * songOrSongs.length)];
            }

            if (songFunc) {
                songFunc();
            }
        }
    };
    
    if (audioContext.state === 'suspended') {
        audioContext.resume().then(play);
        return;
    }
    
    play();
};

const playNote = (laneIndex: number) => {
    if (!audioContext || !sfxGain) return;
    const PENTATONIC_SCALE = [261.63, 293.66, 329.63, 392.00, 440.00, 523.25];
    const pitch = PENTATONIC_SCALE[laneIndex % PENTATONIC_SCALE.length];
    if (!pitch) return;
    const synth = createFilteredSynth('triangle', sfxGain);
    synth?.play(pitch, audioContext.currentTime, 0.5, { attack: 0.01, decay: 0.2, sustain: 0.1, release: 0.2 });
};

type SfxType = 'collect' | 'click' | 'playerHit' | 'enemyHit' | 'block' | 'dodge' | 'treasure' | 'move' | 'miss' | 'win_fight' | 'win_dance' | 'damage_spike' | 'heal' | 'powerup' | 'victory' | 'portal_enter' | 'portal_exit_damage' | 'portal_exit_heal' | 'vine' | 'stone' | 'gale' | 'sunfire' | 'focus' | 'ward' | 'rootSnare' | 'mirage' | 'lifeSap' | 'thornBurst' | 'shieldBash' | 'burningBlade' | 'shadow_cloak' | 'celestial_strike' | 'vengeful_strike' | 'boon_vitality' | 'boon_renewal_tick' | 'boon_haste' | 'collect_enhanced' | 'boon_direction' | 'boon_radiance' | 'boon_radiance_heal' | 'boon_resonance_heal' | 'boon_resonance_empower' | 'star_regen' | 'power_hit' | 'grace_hit' | 'vine_crit' | 'stone_form' | 'stone_break' | 'gale_stun' | 'sunfire_charge' | 'sunfire_fire' | 'focus_activate' | 'ward_form' | 'ward_break' | 'mirage_shatter' | 'lifeSap_impact' | 'lifeSap_drain' | 'shieldBash_hit' | 'shieldBash_stun' | 'burningBlade_ignite' | 'shadow_cloak_activate' | 'shadow_cloak_dodge' | 'celestial_strike_summon' | 'celestial_strike_impact' | 'vengeful_strike_hit' | 'purifying_light_charge' | 'purifying_light_impact' | 'echo_step' | 'twirl_shatter' | 'flourish_hit_perfect' | 'soothing_hum_hit' | 'serenity_chime' | 'graceful_poise_sparkle' | 'rhythmic_flow_absorb' | 'star_chime' | 'perfect_ping' | 'perfect_arpeggio' | 'vital_sonata_heal' | 'steadfast_combo_save' | 'mimics_lament_hit' | 'resonant_wave';

const DANCE_ABILITY_SFX = new Set<SfxType>([
    'echo_step', 'twirl_shatter', 'flourish_hit_perfect', 'powerup', 'soothing_hum_hit',
    'serenity_chime', 'graceful_poise_sparkle', 'rhythmic_flow_absorb', 'star_chime',
    'perfect_ping', 'perfect_arpeggio', 'vital_sonata_heal', 'mimics_lament_hit',
    'resonant_wave', 'steadfast_combo_save', 'grace_hit'
]);

const playSfx = (type: SfxType, optionsOrVolume?: { customVolume?: number; healthPercent?: number; volumeMultiplier?: number; } | number) => {
    if (!audioContext || !sfxGain) return;
    if (audioContext.state === 'suspended') return;
    const now = audioContext.currentTime;
    
    let customVolume: number | undefined;
    let healthPercent: number | undefined;
    let volumeMultiplier: number | undefined;

    if (typeof optionsOrVolume === 'number') {
        customVolume = optionsOrVolume;
    } else if (typeof optionsOrVolume === 'object' && optionsOrVolume !== null) {
        customVolume = optionsOrVolume.customVolume;
        healthPercent = optionsOrVolume.healthPercent;
        volumeMultiplier = optionsOrVolume.volumeMultiplier;
    }
    
    const tempGain = audioContext.createGain();
    
    const GENERAL_SFX_REDUCTION = 0.7;
    let finalVolume = (customVolume ?? 1.0) * GENERAL_SFX_REDUCTION;
    if (DANCE_ABILITY_SFX.has(type)) {
        finalVolume *= 0.8;
    }
    finalVolume *= volumeMultiplier ?? 1.0;
    
    tempGain.gain.value = finalVolume;
    tempGain.connect(sfxGain);

    const sfxSynth = createFilteredSynth('sine', tempGain);
    const sfxSquare = createFilteredSynth('square', tempGain);
    const sfxSaw = createFilteredSynth('sawtooth', tempGain);
    const noiseSynth = createNoiseSynth(tempGain);

    switch(type) {
        // Existing SFX
        case 'collect': sfxSynth?.play(880, now, 0.2, { attack: 0.01, decay: 0.1, sustain: 0.0, release: 0.1 }); sfxSynth?.play(1046, now + 0.05, 0.15, { attack: 0.01, decay: 0.1, sustain: 0.0, release: 0.05 }); break;
        case 'click': noiseSynth?.play(now, 0.05, 4000, 5, 0.3); break;
        case 'playerHit': noiseSynth?.play(now, 0.3, 300, 0.5, 0.8); sfxSynth?.play(150, now, 0.3, {attack:0.05, decay:0.1, sustain:0.1, release: 0.1}, 0.6); break;
        case 'enemyHit': noiseSynth?.play(now, 0.2, 800, 1); break;
        case 'block': noiseSynth?.play(now, 0.15, 200, 1, 0.7); break;
        case 'dodge': noiseSynth?.play(now, 0.1, 2000, 10, 0.4); break;
        case 'treasure': sfxSynth?.play(523.25, now, 0.2); sfxSynth?.play(659.25, now + 0.1, 0.2); sfxSynth?.play(783.99, now + 0.2, 0.3); sfxSynth?.play(1046.50, now + 0.3, 0.4); break;
        case 'move': noiseSynth?.play(now, 0.05, 500, 0.2, 0.5); break;
        case 'miss': sfxSynth?.play(150, now, 0.2, { attack: 0.01, decay: 0.1, sustain: 0, release: 0.1 }); break;
        case 'win_fight': sfxSquare?.play(220, now, 0.1, undefined, 0.5); sfxSquare?.play(277, now + 0.1, 0.1, undefined, 0.5); sfxSquare?.play(330, now + 0.2, 0.1, undefined, 0.5); sfxSquare?.play(440, now + 0.3, 0.4, undefined, 0.6); break;
        case 'win_dance': sfxSynth?.play(261, now, 0.1, undefined, 0.5); sfxSynth?.play(329, now + 0.15, 0.1, undefined, 0.5); sfxSynth?.play(392, now + 0.3, 0.1, undefined, 0.5); sfxSynth?.play(523, now + 0.45, 0.5, undefined, 0.6); break;
        case 'damage_spike': noiseSynth?.play(now, 0.1, 1500, 2, 0.6); break;
        case 'heal': sfxSynth?.play(587.33, now, 0.5, {attack: 0.2, decay: 0.2, sustain: 0.3, release: 0.1}); sfxSynth?.play(880.00, now + 0.1, 0.4, {attack: 0.1, decay: 0.2, sustain: 0.2, release: 0.1}); break;
        case 'powerup': sfxSynth?.play(349.23, now, 0.1); sfxSynth?.play(466.16, now + 0.1, 0.1); sfxSynth?.play(698.46, now + 0.2, 0.4); break;
        case 'victory': sfxSynth?.play(392, now, 0.1); sfxSynth?.play(523, now + 0.15, 0.1); sfxSynth?.play(587, now + 0.3, 0.1); sfxSynth?.play(784, now + 0.45, 0.5); break;
        case 'portal_enter': sfxSquare?.play(100, now, 0.4, { attack: 0.1, decay: 0.1, sustain: 0, release: 0.2 }, 0.5); noiseSynth?.play(now, 0.4, 500, 10, 0.4); break;
        case 'portal_exit_damage': sfxSquare?.play(80, now, 0.5, { attack: 0.01, decay: 0.4, sustain: 0, release: 0.1 }, 0.7); noiseSynth?.play(now, 0.5, 300, 2, 0.6); break;
        case 'portal_exit_heal': sfxSynth?.play(783.99, now, 0.5, { attack: 0.1, decay: 0.3, sustain: 0.2, release: 0.1 }, 0.6); sfxSynth?.play(1046.50, now + 0.1, 0.4, { attack: 0.1, decay: 0.2, sustain: 0.1, release: 0.1 }, 0.6); break;
        case 'vine': noiseSynth?.play(now, 0.15, 3000, 15, 0.7); sfxSynth?.play(200, now, 0.1, {attack: 0.01, decay: 0.1, sustain: 0, release: 0.05}); break;
        case 'stone': noiseSynth?.play(now, 0.3, 150, 1, 0.9); sfxSaw?.play(100, now, 0.3, {attack: 0.05, decay: 0.2, sustain: 0, release: 0.1}); break;
        case 'gale': noiseSynth?.play(now, 0.5, 1500, 5, 0.6); sfxSynth?.play(600, now, 0.5, {attack: 0.1, decay: 0.3, sustain: 0, release: 0.2}); break;
        case 'sunfire': sfxSaw?.play(100, now, 0.6, {attack: 0.2, decay: 0.3, sustain: 0.5, release: 0.1}, 0.5, {freq: 800, q: 2, type: 'lowpass'}); noiseSynth?.play(now + 0.1, 0.5, 800, 2, 0.8); break;
        case 'focus': sfxSynth?.play(440, now, 1.0, {attack: 0.5, decay: 0.3, sustain: 0.2, release: 0.2}, 0.4); sfxSynth?.play(440*1.5, now, 1.0, {attack: 0.5, decay: 0.3, sustain: 0.2, release: 0.2}, 0.3); break;
        case 'ward': sfxSynth?.play(110, now, 0.5, {attack: 0.1, decay: 0.3, sustain: 0.2, release: 0.1}, 0.7); break;
        case 'rootSnare': noiseSynth?.play(now, 0.4, 300, 1, 0.6); sfxSaw?.play(120, now, 0.3, {attack: 0.01, decay: 0.2, sustain: 0, release: 0.1}, 0.8, {freq: 800, q: 2, type: 'bandpass'}); break;
        case 'mirage': {
            const mirageOsc = audioContext.createOscillator(); mirageOsc.type = 'sine'; mirageOsc.frequency.setValueAtTime(440, now);
            const lfo = audioContext.createOscillator(); lfo.type = 'sine'; lfo.frequency.setValueAtTime(8, now);
            const lfoGain = audioContext.createGain(); lfoGain.gain.setValueAtTime(30, now);
            lfo.connect(lfoGain); lfoGain.connect(mirageOsc.detune);
            const mirageGain = audioContext.createGain(); mirageGain.gain.setValueAtTime(0, now);
            mirageGain.gain.linearRampToValueAtTime(0.5, now + 0.1); mirageGain.gain.linearRampToValueAtTime(0, now + 0.6);
            mirageOsc.connect(mirageGain); mirageGain.connect(tempGain);
            mirageOsc.start(now); lfo.start(now); mirageOsc.stop(now + 0.6); lfo.stop(now + 0.6);
            break;
        }
        case 'mirage_shatter': noiseSynth?.play(now, 0.3, 6000, 5, 0.3); sfxSynth?.play(2000, now, 0.3, { attack: 0.01, decay: 0.2, sustain: 0, release: 0.1}, 0.5); sfxSynth?.play(3500, now+0.02, 0.25, {attack:0.01, decay:0.15, sustain:0, release:0.1}); break;
        case 'lifeSap': sfxSaw?.play(250, now, 0.5, {attack: 0.1, decay: 0.4, sustain: 0, release: 0.1}); sfxSynth?.play(200, now, 0.5, {attack: 0.2, decay: 0.3, sustain: 0, release: 0.1}); break;
        case 'lifeSap_impact': sfxSynth?.play(100, now, 0.1, {attack: 0.01, decay: 0.1, sustain: 0, release: 0.05}); noiseSynth?.play(now, 0.1, 1500, 5, 0.4); break;
        case 'lifeSap_drain': noiseSynth?.play(now, 1.0, 800, 15, 0.2); sfxSynth?.play(300, now, 1.0, {attack:0.1, decay: 0.9, sustain: 0, release:0.1}, 0.3); break;
        case 'thornBurst': 
            for(let i=0; i<5; i++) { 
                const s = createFilteredSynth('square', tempGain);
                s?.play(2000 + Math.random() * 1000, now + i * 0.04, 0.05, {attack:0.01, decay:0.04, sustain:0, release:0.01}, 0.2);
            } 
            break;
        case 'shieldBash': noiseSynth?.play(now, 0.2, 200, 1, 0.8); sfxSquare?.play(150, now, 0.2, {attack:0.02, decay:0.1, sustain:0, release:0.1}); break;
        case 'burningBlade': noiseSynth?.play(now, 0.4, 2500, 5, 0.6); sfxSaw?.play(300, now, 0.3, {attack:0.01, decay:0.2, sustain:0.1, release:0.1}); break;
        case 'shieldBash_hit':
            noiseSynth?.play(now, 0.3, 100, 0.5, 0.9); 
            sfxSaw?.play(120, now, 0.3, {attack:0.01, decay:0.2, sustain:0.1, release:0.1}, 0.8, {freq: 5000, q: 2, type: 'highpass'});
            break;
        case 'shieldBash_stun':
            sfxSynth?.play(500, now, 0.1);
            sfxSynth?.play(400, now + 0.1, 0.15);
            break;
        case 'burningBlade_ignite':
            noiseSynth?.play(now, 0.4, 1500, 8, 0.7);
            break;
        case 'shadow_cloak_activate': noiseSynth?.play(now, 0.8, 3000, 15, 0.2); break;
        case 'shadow_cloak_dodge': noiseSynth?.play(now, 0.3, 2000, 10, 0.4); break;
        case 'celestial_strike_summon':
            sfxSynth?.play(523.25, now, 2.0, {attack: 1, decay: 1, sustain: 0.5, release: 0.5}, 0.15);
            sfxSynth?.play(659.25, now, 2.0, {attack: 1, decay: 1, sustain: 0.5, release: 0.5}, 0.1);
            sfxSynth?.play(783.99, now, 2.0, {attack: 1, decay: 1, sustain: 0.5, release: 0.5}, 0.1);
            const whistle = audioContext.createOscillator(); whistle.type = 'sine';
            whistle.frequency.setValueAtTime(4000, now + 0.2);
            whistle.frequency.linearRampToValueAtTime(1000, now + 0.8);
            const whistleGain = audioContext.createGain(); whistleGain.gain.setValueAtTime(0.3, now + 0.2);
            whistleGain.gain.linearRampToValueAtTime(0, now + 0.8);
            whistle.connect(whistleGain); whistleGain.connect(tempGain);
            whistle.start(now + 0.2); whistle.stop(now + 0.8);
            break;
        case 'celestial_strike_impact':
            noiseSynth?.play(now, 0.5, 500, 1, 1.0); // Crack
            sfxSaw?.play(60, now, 0.8, {attack: 0.01, decay: 0.6, sustain: 0.1, release: 0.2}, 1.2); // Boom
            break;
        case 'vengeful_strike_hit': {
            const hp = healthPercent ?? 1.0;
            if (hp < 0.25) {
                sfxSynth?.play(110, now, 1.5, {attack: 0.01, decay: 1.4, sustain: 0.1, release: 0.1}, 0.8);
                sfxSynth?.play(110 * 1.505, now, 1.5, {attack: 0.01, decay: 1.4, sustain: 0.1, release: 0.1}, 0.6);
                break;
            }
            const osc = audioContext.createOscillator(); osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(150 - (1 - hp) * 50, now);
            const gain = audioContext.createGain();
            const filter = audioContext.createBiquadFilter(); filter.type = 'lowpass';
            filter.frequency.value = 200 + 3000 * hp;
            osc.connect(filter);
            const distortion = audioContext.createWaveShaper();
            const amount = 1 - hp; const k = typeof amount === 'number' ? amount * 100 : 50; const n_samples = 44100;
            const curve = new Float32Array(n_samples); const deg = Math.PI / 180;
            for (let i = 0; i < n_samples; ++i) { const x = i * 2 / n_samples - 1; curve[i] = (3 + k) * x * 20 * deg / (Math.PI + k * Math.abs(x)); }
            distortion.curve = curve; distortion.oversample = '4x';
            filter.connect(distortion); distortion.connect(gain);
            gain.connect(tempGain); gain.gain.setValueAtTime(0, now);
            gain.gain.linearRampToValueAtTime(0.8, now + 0.01); gain.gain.linearRampToValueAtTime(0, now + 0.4);
            osc.start(now); osc.stop(now + 0.4);
            break;
        }
        case 'purifying_light_charge': {
            const synth1 = createFilteredSynth('sine', tempGain);
            const synth2 = createFilteredSynth('sine', tempGain);
            synth1?.play(523.25, now, 0.8, { attack: 0.6, decay: 0.2, sustain: 1, release: 0.1 }, 0);
            synth2?.play(523.25 * 1.5, now, 0.8, { attack: 0.6, decay: 0.2, sustain: 1, release: 0.1 }, 0);
            tempGain.gain.linearRampToValueAtTime(0.4, now + 0.5);
            break;
        }
        case 'purifying_light_impact': {
            const synth1 = createFilteredSynth('triangle', tempGain);
            const synth2 = createFilteredSynth('sine', tempGain);
            synth1?.play(1046.50, now, 1.5, { attack: 0.01, decay: 1.0, sustain: 0.1, release: 0.5 }, 0.6);
            synth2?.play(1046.50 * 1.505, now, 1.5, { attack: 0.01, decay: 1.0, sustain: 0.1, release: 0.5 }, 0.4);
            break;
        }
        case 'echo_step': noiseSynth?.play(now + 0.1, 0.2, 3000, 10, 0.2); break;
        case 'twirl_shatter': noiseSynth?.play(now, 0.4, 7000, 5, 0.4); sfxSynth?.play(2500, now, 0.3, {attack:0.01, decay:0.2, sustain:0, release:0.1}); sfxSynth?.play(3500, now+0.02, 0.25, {attack:0.01, decay:0.15, sustain:0, release:0.1}); break;
        case 'flourish_hit_perfect': sfxSynth?.play(1046.50, now, 0.8, { attack: 0.01, decay: 0.7, sustain: 0.1, release: 0.1 }, 0.5); sfxSynth?.play(1046.50 * 1.5, now, 0.8, { attack: 0.01, decay: 0.7, sustain: 0.1, release: 0.1 }, 0.25); break;
        case 'soothing_hum_hit': sfxSynth?.play(130.81, now, 0.5, { attack: 0.1, decay: 0.3, sustain: 0.1, release: 0.1 }, 0.25); break;
        case 'serenity_chime':
            sfxSynth?.play(880, now, 0.8, { attack: 0.1, decay: 0.6, sustain: 0.1, release: 0.2 }, 0.4);
            sfxSynth?.play(880 * 1.5, now, 0.8, { attack: 0.1, decay: 0.6, sustain: 0.1, release: 0.2 }, 0.2);
            break;
        case 'graceful_poise_sparkle':
            sfxSynth?.play(2000, now, 0.15, { attack: 0.01, decay: 0.1, sustain: 0, release: 0.05 }, 0.3);
            break;
        case 'rhythmic_flow_absorb':
            sfxSaw?.play(150, now, 0.3, { attack: 0.05, decay: 0.2, sustain: 0, release: 0.1 }, 0.5, { freq: 400, q: 3, type: 'lowpass' });
            noiseSynth?.play(now, 0.3, 500, 2, 0.2);
            break;
        // --- NEWLY IMPLEMENTED SFX ---
        case 'boon_vitality': sfxSynth?.play(110, now, 0.8, { attack: 0.3, decay: 0.4, sustain: 0.2, release: 0.1 }); break;
        case 'boon_renewal_tick': sfxSynth?.play(659.25, now, 0.3, { attack: 0.01, decay: 0.2, sustain: 0, release: 0.1 }, 0.2); break;
        case 'boon_haste': noiseSynth?.play(now, 0.3, 4000, 10, 0.3); break;
        case 'collect_enhanced': sfxSynth?.play(880, now, 0.2, { attack: 0.01, decay: 0.1, sustain: 0.0, release: 0.1 }); sfxSynth?.play(1046, now + 0.05, 0.15, { attack: 0.01, decay: 0.1, sustain: 0.0, release: 0.05 }); sfxSynth?.play(1318.51, now + 0.1, 0.2, { attack: 0.01, decay: 0.15, sustain: 0, release: 0.05 }, 0.8); break;
        case 'boon_direction': sfxSynth?.play(220, now, 0.1, undefined, 0.4); sfxSynth?.play(220, now + 0.2, 0.1, undefined, 0.2); break;
        case 'boon_radiance': sfxSynth?.play(1046.50, now, 1.0, { attack: 0.5, decay: 0.4, sustain: 0.1, release: 0.1 }, 0.4); sfxSynth?.play(1046.50 * 1.5, now, 1.0, { attack: 0.5, decay: 0.4, sustain: 0.1, release: 0.1 }, 0.2); break;
        case 'boon_radiance_heal': sfxSynth?.play(587.33, now, 1.0, {attack: 0.5, decay: 0.4, sustain: 0.3, release: 0.1}, 0.5); sfxSynth?.play(880.00, now + 0.1, 0.8, {attack: 0.3, decay: 0.4, sustain: 0.2, release: 0.1}, 0.5); break;
        case 'boon_resonance_heal': sfxSynth?.play(659.25, now, 0.5, {attack: 0.1, decay: 0.3, sustain: 0.1, release: 0.1}, 0.6); break;
        case 'boon_resonance_empower': sfxSynth?.play(329.63, now, 0.8, {attack: 0.3, decay: 0.4, sustain: 0, release: 0.1}); if(audioContext){let osc = audioContext.createOscillator(); osc.frequency.setValueAtTime(329.63, now); osc.frequency.linearRampToValueAtTime(329.63 * 1.5, now + 0.6); const gain = audioContext.createGain(); gain.gain.value = 0.4; gain.connect(tempGain); osc.connect(gain); osc.start(now); osc.stop(now + 0.6);} break;
        case 'star_regen': sfxSynth?.play(1396.91, now, 0.3, { attack: 0.01, decay: 0.2, sustain: 0, release: 0.1 }, 0.3); break;
        case 'power_hit': noiseSynth?.play(now, 0.2, 500, 1, 0.8); sfxSaw?.play(80, now, 0.2, { attack: 0.01, decay: 0.15, sustain: 0, release: 0.05 }); break;
        case 'grace_hit': sfxSynth?.play(987.77, now, 0.2, { attack: 0.01, decay: 0.15, sustain: 0, release: 0.05 }, 0.3); break;
        case 'vine_crit': noiseSynth?.play(now, 0.1, 4000, 10, 0.8); sfxSquare?.play(300, now, 0.1, {attack: 0.01, decay: 0.1, sustain: 0, release: 0.05}); break;
        case 'stone_form': noiseSynth?.play(now, 0.5, 100, 1, 0.8); sfxSaw?.play(80, now, 0.5, {attack: 0.1, decay: 0.3, sustain: 0, release: 0.2}); break;
        case 'stone_break': noiseSynth?.play(now, 0.4, 200, 0.5, 1.0); sfxSaw?.play(100, now, 0.4, {attack: 0.01, decay: 0.3, sustain: 0, release: 0.1}); break;
        case 'gale_stun': sfxSynth?.play(200, now, 0.2, { attack: 0.05, decay: 0.1, sustain: 0, release: 0.1 }); break;
        case 'sunfire_charge': sfxSaw?.play(100, now, 0.6, {attack: 0.2, decay: 0.3, sustain: 0.5, release: 0.1}, 0.5, {freq: 800, q: 2, type: 'lowpass'}); if(audioContext){let osc = audioContext.createOscillator(); osc.type = 'sawtooth'; osc.frequency.setValueAtTime(200, now); osc.frequency.linearRampToValueAtTime(1000, now + 0.6); const gain = audioContext.createGain(); gain.gain.value = 0.3; gain.connect(tempGain); osc.connect(gain); osc.start(now); osc.stop(now+0.6);} break;
        case 'sunfire_fire': noiseSynth?.play(now, 0.8, 400, 1, 1.0); sfxSaw?.play(50, now, 0.8, {attack: 0.01, decay: 0.7, sustain: 0.1, release: 0.1}); break;
        case 'focus_activate': sfxSynth?.play(220, now, 1.2, {attack: 0.6, decay: 0.4, sustain: 0.2, release: 0.2}, 0.4); sfxSynth?.play(220 * 1.5, now + 0.1, 1.1, {attack: 0.6, decay: 0.3, sustain: 0.2, release: 0.2}, 0.3); break;
        case 'ward_form': sfxSynth?.play(110, now, 0.7, {attack: 0.3, decay: 0.3, sustain: 0.2, release: 0.1}, 0.7); break;
        case 'ward_break': noiseSynth?.play(now, 0.3, 1000, 5, 0.4); sfxSquare?.play(400, now, 0.3, {attack:0.01, decay:0.2, sustain:0, release:0.1}); break;
        case 'star_chime': sfxSynth?.play(1567.98, now, 0.2, { attack: 0.01, decay: 0.1, sustain: 0.1, release: 0.1 }, 0.6); sfxSynth?.play(1864.66, now + 0.1, 0.3, { attack: 0.01, decay: 0.2, sustain: 0.1, release: 0.1 }, 0.6); break;
        case 'perfect_ping': sfxSynth?.play(2093.00, now, 0.1, { attack: 0.001, decay: 0.1, sustain: 0, release: 0.05 }, 0.5); break;
        case 'perfect_arpeggio': sfxSynth?.play(523.25, now, 0.1, { attack: 0.01, decay: 0.08, sustain: 0, release: 0.02 }, 0.4); sfxSynth?.play(659.25, now + 0.07, 0.1, { attack: 0.01, decay: 0.08, sustain: 0, release: 0.02 }, 0.4); sfxSynth?.play(783.99, now + 0.14, 0.1, { attack: 0.01, decay: 0.08, sustain: 0, release: 0.02 }, 0.4); break;
        case 'vital_sonata_heal': sfxSynth?.play(659.25, now, 0.6, { attack: 0.2, decay: 0.3, sustain: 0.1, release: 0.1 }, 0.5); sfxSynth?.play(880.00, now + 0.1, 0.5, { attack: 0.1, decay: 0.3, sustain: 0.1, release: 0.1 }, 0.3); break;
        case 'steadfast_combo_save': sfxSaw?.play(100, now, 0.2, { attack: 0.05, decay: 0.1, sustain: 0, release: 0.1 }, 0.4, { freq: 500, q: 2, type: 'lowpass' }); noiseSynth?.play(now, 0.15, 200, 1, 0.2); break;
        case 'mimics_lament_hit': sfxSynth?.play(2093.00, now, 0.5, { attack: 0.001, decay: 0.4, sustain: 0.1, release: 0.1 }, 0.4); sfxSynth?.play(2093.00 * 1.5, now + 0.05, 0.4, { attack: 0.001, decay: 0.3, sustain: 0.1, release: 0.1 }, 0.2); break;
        case 'resonant_wave': {
            const whoomSynth = createFilteredSynth('sawtooth', tempGain);
            whoomSynth?.play(70, now, 1.0, { attack: 0.01, decay: 0.9, sustain: 0.1, release: 0.2 }, 0.6, { freq: 500, q: 1, type: 'lowpass' });
            if (audioContext) {
                const osc = audioContext.createOscillator(); osc.type = 'sawtooth';
                osc.frequency.setValueAtTime(120, now);
                osc.frequency.exponentialRampToValueAtTime(60, now + 0.3);
                const gain = audioContext.createGain(); gain.gain.setValueAtTime(0.5, now);
                gain.gain.exponentialRampToValueAtTime(0.01, now + 0.8);
                osc.connect(gain); gain.connect(tempGain);
                osc.start(now); osc.stop(now + 0.8);
            }
            const chimeSynth = createFilteredSynth('triangle', tempGain);
            chimeSynth?.play(1046.50, now + 0.2, 0.8, { attack: 0.01, decay: 0.7, sustain: 0.1, release: 0.1 }, 0.5);
            chimeSynth?.play(1318.51, now + 0.3, 0.7, { attack: 0.01, decay: 0.6, sustain: 0.1, release: 0.1 }, 0.4);
            break;
        }
    }
};

const setMusicMuted = (muted: boolean) => {
    if (!musicGain || !audioContext) return;
    const targetVolume = muted ? 0 : 1;
    musicGain.gain.linearRampToValueAtTime(targetVolume, audioContext.currentTime + 0.5);
};

const updateVolume = (settings: GameSettings) => {
    if (!masterGain || !musicGain || !sfxGain || !audioContext) return;
    cachedMusicVolume = settings.musicVolume;
    const now = audioContext.currentTime;
    masterGain.gain.linearRampToValueAtTime(settings.masterVolume, now + 0.1);
    musicGain.gain.linearRampToValueAtTime(settings.musicVolume, now + 0.1);
    sfxGain.gain.linearRampToValueAtTime(settings.sfxVolume, now + 0.1);
};

const updateAlignment = (alignment: number) => {
    currentAlignment = alignment;
}

export const audioService = {
    init,
    suspend,
    resume,
    playNote,
    playSfx,
    startSong,
    stopSong,
    fadeSong,
    setMusicMuted,
    updateVolume,
    updateAlignment,
    generateRhythmTrack,
    getAudioContext,
    startLoopingSfx,
    stopLoopingSfx,
};