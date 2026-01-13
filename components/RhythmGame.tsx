import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { PlayerState, DanceMove, Encounter, Direction, GameStats, Ability } from '../types';
import { ArrowUpIcon, ArrowDownIcon, ArrowLeftIcon, ArrowRightCircleIcon, StarIcon, FleeIcon, BookOpenIcon, HeartIcon, MusicIcon, VitalSonataIcon } from './icons';
import { audioService } from '../services/audioService';
import { Sprite } from './Sprite';
import { ABILITIES, DIRECTIONS } from '../constants';

interface RhythmGameScreenProps {
    enemy: Encounter;
    onComplete: (type: 'dance', success: boolean, fled?: boolean) => void;
    playerState: PlayerState;
    setPlayerState: React.Dispatch<React.SetStateAction<PlayerState | null>>;
    isPaused: boolean;
    onOpenAbilities: () => void;
    t: (key: string, replacements?: Record<string, string | number>) => string;
    language: string;
    gameStats: GameStats;
}

const KEY_MAP: Record<string, Direction> = { arrowleft: 'left', arrowdown: 'down', arrowup: 'up', arrowright: 'right', a: 'left', s: 'down', w: 'up', d: 'right' };
const ICON_MAP: Record<Direction, React.FC<{className?: string}>> = { left: ArrowLeftIcon, down: ArrowDownIcon, up: ArrowUpIcon, right: ArrowRightCircleIcon };
const COLOR_MAP: Record<Direction, string> = { left: 'from-blue-500 to-cyan-400', down: 'from-red-500 to-orange-400', up: 'from-green-500 to-lime-400', right: 'from-yellow-500 to-amber-400' };
const DISPLAY_DIRECTIONS: Direction[] = ['left', 'down', 'up', 'right'];

type GamePhase = 'PREPARING'| 'INTRO' | 'PLAYING' | 'GAMEOVER';
type Note = { id: number; dir: Direction; flourish: boolean; position: number; hit: 'perfect' | 'good' | 'miss' | 'none'; time: number };
type HitEffect = { id: number; dir: Direction; type: 'perfect' | 'good' | 'miss'; isFlourish?: boolean };
type PlayerAnimation = { dir: Direction, id: number };
type HealVfx = { id: number; x: string; y: string; amount: number; };
type HumParticle = { id: number; dir: Direction; };
type FlyingStar = { id: number; startX: number; startY: number; toX: string; toY: string };
type GoldenParticle = { id: number; dir: Direction };
type VitalSonataParticle = { id: number; dir: Direction; };

const TwirlBarrier: React.FC<{ isShattering: boolean }> = React.memo(({ isShattering }) => {
    const notes = useMemo(() => Array.from({ length: 4 }).map((_, i) => ({
        id: i,
        delay: `${i * -1}s`,
        tx: `${(Math.random() - 0.5) * 200}px`,
        ty: `${(Math.random() - 0.5) * 200}px`,
    })), []);

    return (
        <div className={`twirl-barrier-container ${isShattering ? 'shattering' : ''}`}>
            {notes.map(note => (
                <div key={note.id} className="twirl-note" style={{ animationDelay: note.delay, '--tx': note.tx, '--ty': note.ty } as React.CSSProperties}>
                    <MusicIcon className="w-full h-full" />
                </div>
            ))}
        </div>
    );
});
TwirlBarrier.displayName = "TwirlBarrier";

export const RhythmGameScreen: React.FC<RhythmGameScreenProps> = ({ enemy, onComplete, playerState, setPlayerState, isPaused, onOpenAbilities, t, gameStats }) => {
    const { isBoss, archetype = 'balanced' } = enemy;

    const danceAbilities = useMemo(() => new Set(playerState.abilities.filter(id => ABILITIES[id]?.type === 'dance')), [playerState.abilities]);
    
    // --- Effect Intensity Scaling ---
    const effectIntensity = useMemo(() => {
        const numDanceAbilities = danceAbilities.size;
        const minAbilities = 2; // Start scaling after 2 abilities
        const maxAbilitiesForScaling = 10; // Reach max reduction at 10 abilities
        const minIntensity = 0.4; // Minimum opacity/volume is 40%

        if (numDanceAbilities <= minAbilities) return 1.0;

        const scaleRange = maxAbilitiesForScaling - minAbilities;
        const abilitiesOverMin = numDanceAbilities - minAbilities;
        const reductionFactor = Math.min(1.0, abilitiesOverMin / scaleRange);

        return 1.0 - (reductionFactor * (1.0 - minIntensity));
    }, [danceAbilities]);


    const hasEcho = danceAbilities.has('echo');
    const hasTwirl = danceAbilities.has('twirl');
    const hasFlourish = danceAbilities.has('flourish');
    const hasCrescendo = danceAbilities.has('crescendo');
    const hasSoothingHum = danceAbilities.has('soothingHum');
    const hasSerenity = danceAbilities.has('serenity');
    const hasTempoShift = danceAbilities.has('tempoShift');
    const hasGracefulPoise = danceAbilities.has('gracefulPoise');
    const hasRhythmicFlow = danceAbilities.has('rhythmicFlow');
    const hasStarlightStep = danceAbilities.has('starlightStep');
    const hasFlowState = danceAbilities.has('flowState');
    const hasPerfectPitch = danceAbilities.has('perfectPitch');
    const hasVitalSonata = danceAbilities.has('vital_sonata');
    const hasMimicsLament = danceAbilities.has('mimics_lament');
    const hasSteadfastRhythm = useMemo(() => danceAbilities.has('steadfast_rhythm'), [danceAbilities]);
    const hasResonantWave = useMemo(() => danceAbilities.has('resonant_wave'), [danceAbilities]);
    const hasGraceBoon = useMemo(() => playerState.abilities.includes('boon_grace_1'), [playerState.abilities]);

    const difficultySettings = useMemo(() => {
        return {
            Normal: { speed: 1.05, loss: 1.1, harmony: 1.0 },
            Hard: { speed: 1.45, loss: 1.7, harmony: 0.7 },
            Requiem: { speed: 1.65, loss: 2.0, harmony: 0.6 },
        }[gameStats.difficulty];
    }, [gameStats.difficulty]);

    const REGULAR_GOOD_TOLERANCE = 120;
    const HIT_TOLERANCE = useMemo(() => ({
        perfect: 60 + (hasFlowState ? 10 : 0),
        good: REGULAR_GOOD_TOLERANCE + (hasGracefulPoise ? 20 : 0),
    }), [hasFlowState, hasGracefulPoise]);
    
    const NOTE_SPEED = useMemo(() => {
        let speed = 4.0;
        if (archetype === 'dancer') speed = 5.0;
        if (archetype === 'fighter') speed = 3.5;
        if (hasTempoShift) speed *= 0.85;
        speed *= (1 + (playerState.currentFloor - 1) * 0.08);
        return speed * difficultySettings.speed;
    }, [archetype, hasTempoShift, playerState.currentFloor, difficultySettings.speed]);

    const harmonyLoss = useMemo(() => {
        let baseLoss = 5;
        if (archetype === 'dancer') baseLoss = 8;
        if (archetype === 'fighter') baseLoss = 3;
        return (baseLoss + (playerState.currentFloor - 1)) * difficultySettings.loss;
    }, [archetype, playerState.currentFloor, difficultySettings.loss]);
    
    const initialHarmony = useMemo(() => {
        let harmony = 25;
        if (hasSerenity) harmony += 20;
        if (archetype === 'dancer') harmony += 5;
        if (archetype === 'fighter') harmony += 15;
        return harmony * difficultySettings.harmony;
    }, [archetype, hasSerenity, difficultySettings.harmony]);

    const [notes, setNotes] = useState<Note[]>([]);
    const [hitEffects, setHitEffects] = useState<HitEffect[]>([]);
    const [phase, setPhase] = useState<GamePhase>('PREPARING');
    const [feedback, setFeedback] = useState<{text: string, color: string, id: number}>({text: '', color: 'text-gray-300', id: 0});
    const [harmony, setHarmony] = useState(hasSerenity ? 0 : initialHarmony);
    const [spiritReact, setSpiritReact] = useState(false);
    const [playerAnim, setPlayerAnim] = useState<PlayerAnimation | null>(null);
    const [spiritAnim, setSpiritAnim] = useState<PlayerAnimation | null>(null);
    
    const [isProtected, setIsProtected] = useState(hasTwirl);
    const [combo, setCombo] = useState(0);
    const [isCrescendoActive, setCrescendoActive] = useState(false);
    const [isFlowShieldActive, setIsFlowShieldActive] = useState(hasRhythmicFlow);
    const [isFlowShieldCracking, setIsFlowShieldCracking] = useState(false);
    const [resonantWaveUsed, setResonantWaveUsed] = useState(false);
    const [healVfx, setHealVfx] = useState<HealVfx[]>([]);
    const [resonantWaveEffect, setResonantWaveEffect] = useState(false);
    const [echoEffect, setEchoEffect] = useState<{ dir: Direction, id: number } | null>(null);
    const [isTwirlShattering, setIsTwirlShattering] = useState(false);
    const [humParticles, setHumParticles] = useState<HumParticle[]>([]);
    const [isSerenityAnimating, setIsSerenityAnimating] = useState(hasSerenity);
    const [flyingStars, setFlyingStars] = useState<FlyingStar[]>([]);
    const [goldenParticles, setGoldenParticles] = useState<GoldenParticle[]>([]);
    const [vitalSonataParticles, setVitalSonataParticles] = useState<VitalSonataParticle[]>([]);

    const [countdown, setCountdown] = useState(3);
    
    const hasCompleted = useRef(false);
    const gameLoopRef = useRef<number | null>(null);
    const allNotesRef = useRef<Note[]>([]);
    const gameContainerRef = useRef<HTMLDivElement>(null);
    const audioCtx = useMemo(() => audioService.getAudioContext(), []);

    const hasCombatHealBoon = playerState.abilities.includes('boon_combat_medic_1');
    const canCombatHeal = hasCombatHealBoon && playerState.starPower >= 5 && playerState.health < playerState.maxHealth;
    
    useEffect(() => {
        setResonantWaveUsed(false);
    }, []);

    const showFeedback = useCallback((text: string, color: string, duration = 1000) => {
        const id = performance.now();
        setFeedback({text, color, id});
        setTimeout(() => {
            setFeedback(f => f.id === id ? {...f, text: ''} : f);
        }, duration);
    }, []);

    const handleCombatHeal = useCallback(() => {
        if (!canCombatHeal || isPaused || phase === 'GAMEOVER') return;
        setPlayerState(p => {
            if (!p) return null;
            const healthGain = 6 + Math.floor(Math.random() * 2);
            const newHealth = Math.min(p.maxHealth, p.health + healthGain);
            
            const id = performance.now();
            setHealVfx(v => [...v, {id, x: '25%', y: '10%', amount: healthGain}]);
            setTimeout(() => setHealVfx(v => v.filter(i => i.id !== id)), 1500);

            return { ...p, health: newHealth, starPower: p.starPower - 5 };
        });
        audioService.playSfx('heal');
    }, [canCombatHeal, isPaused, phase, setPlayerState]);

    const addHitEffect = useCallback((dir: Direction, type: HitEffect['type'], isFlourish = false) => {
        const newEffect = { id: performance.now(), dir, type, isFlourish };
        setHitEffects(effects => [...effects, newEffect]);
        setTimeout(() => setHitEffects(e => e.filter(ef => ef.id !== newEffect.id)), 500);
    }, []);

    const triggerPlayerAnimation = useCallback((dir: Direction) => {
        const id = performance.now();
        setPlayerAnim({ dir, id });
        setTimeout(() => setPlayerAnim(p => p?.id === id ? null : p), 200);
    }, []);

    const triggerSpiritAnimation = useCallback(() => {
        const id = performance.now();
        setSpiritAnim({ dir: 'up', id }); // dir doesn't matter here
        setTimeout(() => setSpiritAnim(p => p?.id === id ? null : p), 200);
    }, []);

    const handleComplete = useCallback((success: boolean, fled: boolean = false) => {
        if (hasCompleted.current) return;
        hasCompleted.current = true;
        if (success) {
            audioService.fadeSong(1);
        } else {
            audioService.stopSong();
        }
        onComplete('dance', success, fled);
    }, [onComplete]);

    useEffect(() => {
        let crescendoTimer: ReturnType<typeof setTimeout> | undefined;
        if (combo >= 10 && hasCrescendo && !isCrescendoActive) {
            setCrescendoActive(true);
            showFeedback(t('rhythm.crescendo'), 'text-pink-400');
            audioService.playSfx('powerup', { customVolume: 0.7, volumeMultiplier: effectIntensity });

            crescendoTimer = setTimeout(() => {
                setCrescendoActive(false);
                 showFeedback(t('rhythm.crescendoFades'), 'text-gray-400', 1500);
            }, 5000);
        }
        
        if (combo >= 20 && hasResonantWave && !resonantWaveUsed) {
            setResonantWaveUsed(true);
            setHarmony(h => Math.min(100, h + 20));
            setPlayerState(p => {
                if (!p) return null;
                const healthGain = 5;
                const newHealth = Math.min(p.maxHealth, p.health + healthGain);
                
                const id = performance.now();
                setHealVfx(v => [...v, {id, x: '25%', y: '10%', amount: healthGain}]);
                setTimeout(() => setHealVfx(v => v.filter(i => i.id !== id)), 1500);

                return { ...p, health: newHealth };
            });
            showFeedback(t('rhythm.resonantWave'), 'text-cyan-300');
            audioService.playSfx('resonant_wave', { volumeMultiplier: effectIntensity });
            setResonantWaveEffect(true);
            setTimeout(() => setResonantWaveEffect(false), 1000);
        }

        return () => {
            if (crescendoTimer) clearTimeout(crescendoTimer);
        }
    }, [combo, hasCrescendo, isCrescendoActive, t, hasResonantWave, resonantWaveUsed, setPlayerState, showFeedback, effectIntensity]);

    useEffect(() => {
        if (isCrescendoActive) {
            audioService.startLoopingSfx('crescendo_loop');
        }
        return () => {
            audioService.stopLoopingSfx('crescendo_loop');
        }
    }, [isCrescendoActive]);
    
    useEffect(() => {
        let cleanup = () => {};
        const prepareAndStart = async () => {
            if (!audioCtx) {
                handleComplete(false);
                return;
            }
            if(hasTempoShift) audioService.startLoopingSfx('tempo_shift_ambience');

            const trackData = await audioService.generateRhythmTrack(archetype, playerState.currentFloor);
            
            if (!trackData || !trackData.notes || trackData.notes.length === 0) {
                handleComplete(false);
                return;
            }
            const { notes: chart } = trackData;
    
            let newNotes = chart.map((note, i) => ({
                id: performance.now() + i,
                dir: note.dir,
                flourish: hasFlourish && note.flourish,
                position: -100,
                hit: 'none' as Note['hit'],
                time: note.time,
            }));

            if(hasMimicsLament) {
                if(newNotes[0]) newNotes[0].hit = 'perfect';
                if(newNotes[1]) newNotes[1].hit = 'perfect';
                setCombo(2);
            }

            allNotesRef.current = newNotes;
    
            setPhase('INTRO');
    
            const countdownInterval = setInterval(() => {
                if (isPaused) return;
                setCountdown(c => {
                    if (c > 1) audioService.playSfx('click', 0.5);
                    return c-1;
                });
            }, 1000);

            const gameStartTimeout = setTimeout(() => {
                clearInterval(countdownInterval);
                setPhase('PLAYING');
                if (hasSerenity) {
                  setHarmony(initialHarmony);
                  audioService.playSfx('serenity_chime', { volumeMultiplier: effectIntensity });
                }
                if(hasTwirl) showFeedback(t('rhythm.twirlProtects'), 'text-cyan-300');
            }, 3000);
    
            cleanup = () => {
                clearTimeout(gameStartTimeout);
                clearInterval(countdownInterval);
                if(hasTempoShift) audioService.stopLoopingSfx('tempo_shift_ambience');
            };
        };

        prepareAndStart();

        return () => { 
            cleanup();
        };
    }, [archetype, isBoss, hasFlourish, danceAbilities.size, audioCtx, handleComplete, playerState.currentFloor, t, hasMimicsLament, hasTempoShift, showFeedback, hasTwirl, hasSerenity, initialHarmony, effectIntensity]);


    const handleMiss = useCallback((direction?: Direction) => {
        if (direction) {
             addHitEffect(direction, 'miss');
             triggerPlayerAnimation(direction);
        }
        
        if (isProtected) {
            setIsProtected(false);
            setIsTwirlShattering(true);
            showFeedback(t('rhythm.twirlSaved'), 'text-cyan-300');
            audioService.playSfx('twirl_shatter', { volumeMultiplier: effectIntensity });
            return;
        }

        if (isFlowShieldActive) {
            setIsFlowShieldActive(false);
            setIsFlowShieldCracking(true);
            setTimeout(() => setIsFlowShieldCracking(false), 500);
            showFeedback(t('rhythm.flowSaved'), 'text-purple-300');
            audioService.playSfx('rhythmic_flow_absorb', { volumeMultiplier: effectIntensity });
            return;
        }

        if (hasSteadfastRhythm) {
            setCombo(c => {
                const newCombo = Math.floor(c / 2);
                if (c > 0 && newCombo < c) {
                     audioService.playSfx('steadfast_combo_save', { volumeMultiplier: effectIntensity });
                }
                return newCombo;
            });
        } else {
            setCombo(0);
        }

        audioService.playSfx('miss');
        showFeedback(t('rhythm.misstep'), 'text-red-400');
        setHarmony(h => Math.max(0, h - harmonyLoss));
    }, [isProtected, harmonyLoss, isFlowShieldActive, addHitEffect, triggerPlayerAnimation, t, hasSteadfastRhythm, showFeedback, effectIntensity]);

    const handleFlee = useCallback(() => {
        if (phase !== 'PLAYING' || isBoss) return;
        setFeedback({text: t('rhythm.flee'), color: 'text-gray-400', id: 0});
        setPhase('GAMEOVER');
        setTimeout(() => handleComplete(false, true), 1500);
    }, [phase, isBoss, t, handleComplete]);

    const handlePlayerInput = useCallback((direction: Direction) => {
        if (phase !== 'PLAYING' || !gameContainerRef.current || !audioCtx) return;

        triggerPlayerAnimation(direction);
        const currentTime = audioCtx.currentTime;
        
        const targetNoteIndex = allNotesRef.current.findIndex(note => 
            note.hit === 'none' && 
            note.dir === direction && 
            Math.abs(note.time - currentTime) * 1000 < HIT_TOLERANCE.good
        );

        if (targetNoteIndex !== -1) {
            const targetNote = allNotesRef.current[targetNoteIndex];
            const distance = Math.abs(targetNote.time - currentTime) * 1000;
            let harmonyGain = 0;
            let hitType: 'perfect' | 'good' = 'good';
            
            setCombo(c => c + 1);

            if (distance <= HIT_TOLERANCE.perfect) {
                hitType = 'perfect';
                allNotesRef.current[targetNoteIndex].hit = 'perfect';
                showFeedback(t('rhythm.perfect'), 'text-yellow-300', 500);
                harmonyGain = targetNote.flourish ? 4 : 2.5;
                if (hasPerfectPitch) {
                    harmonyGain += 1;
                    audioService.playSfx('perfect_arpeggio', { volumeMultiplier: effectIntensity });
                    const particleId = Date.now();
                    setGoldenParticles(p => [...p, {id: particleId, dir: direction}]);
                    setTimeout(() => setGoldenParticles(p => p.filter(particle => particle.id !== particleId)), 1200);
                }
                if(hasFlowState) audioService.playSfx('perfect_ping', { volumeMultiplier: effectIntensity });
            } else {
                allNotesRef.current[targetNoteIndex].hit = 'good';
                showFeedback(t('rhythm.good'), 'text-green-300', 500);
                harmonyGain = targetNote.flourish ? 2.5 : 1.2;
                if (hasGracefulPoise && distance > REGULAR_GOOD_TOLERANCE) {
                    audioService.playSfx('graceful_poise_sparkle', { volumeMultiplier: effectIntensity });
                }
            }

            if (hasEcho) {
                const id = performance.now();
                setEchoEffect({ dir: direction, id });
                setTimeout(() => setEchoEffect(e => e?.id === id ? null : e), 400);
                audioService.playSfx('echo_step', { volumeMultiplier: effectIntensity });
            }

            if (hitType === 'perfect' && targetNote.flourish) {
                audioService.playSfx('flourish_hit_perfect', { volumeMultiplier: effectIntensity });
            } else {
                audioService.playNote(DIRECTIONS.indexOf(direction));
            }
            
            if (hasSoothingHum) {
                audioService.playSfx('soothing_hum_hit', { volumeMultiplier: effectIntensity });
                const id = performance.now();
                setHumParticles(p => [...p, { id, dir: direction }]);
                setTimeout(() => setHumParticles(p => p.filter(particle => particle.id !== id)), 1200);
            }

            addHitEffect(direction, hitType, targetNote.flourish);

            if (targetNote.flourish && hasStarlightStep && Math.random() < 0.25) {
                 setPlayerState(p => p ? ({ ...p, starPower: p.starPower + 1 }) : null);
                 showFeedback(t('rhythm.starPower'), 'text-yellow-400');
                 audioService.playSfx('star_chime', { volumeMultiplier: effectIntensity });
                 const dirIndex = DISPLAY_DIRECTIONS.indexOf(direction);
                 const startXPercent = dirIndex * 25 + 12.5;
                 const startYPercent = 85;
                 const targetXPercent = 12.5;
                 const targetYPercent = 15;
                 const toX = `calc(${targetXPercent}% - ${startXPercent}%)`;
                 const toY = `calc(${targetYPercent}% - ${startYPercent}%)`;
                 const newStar: FlyingStar = { id: Date.now(), startX: startXPercent, startY: startYPercent, toX, toY };
                 setFlyingStars(s => [...s, newStar]);
                 setTimeout(() => setFlyingStars(s => s.filter(star => star.id !== newStar.id)), 1000);
            }
            if (targetNote.flourish && hasVitalSonata && Math.random() < 0.3) {
                const healthGain = 3;
                 setPlayerState(p => p ? ({ ...p, health: Math.min(p.maxHealth, p.health + healthGain) }) : null);
                 const id = performance.now();
                 setHealVfx(v => [...v, {id, x: '25%', y: '10%', amount: healthGain}]);
                 setTimeout(() => setHealVfx(v => v.filter(i => i.id !== id)), 1500);
                 audioService.playSfx('vital_sonata_heal', { volumeMultiplier: effectIntensity });
                 const particleId = performance.now() + Math.random();
                 setVitalSonataParticles(p => [...p, {id: particleId, dir: direction}]);
                 setTimeout(() => setVitalSonataParticles(p => p.filter(particle => particle.id !== particleId)), 1200);
            }

            if (isCrescendoActive) harmonyGain *= 2.0;
            if (hasSoothingHum) harmonyGain += 0.5;
            if (hasGraceBoon) {
                harmonyGain += 0.5;
                audioService.playSfx('grace_hit', { volumeMultiplier: effectIntensity });
            }

            setHarmony(h => Math.min(100, h + harmonyGain));
            setSpiritReact(true);
            triggerSpiritAnimation();
            setTimeout(() => setSpiritReact(false), 300);

        } else {
            handleMiss(direction);
        }

    }, [phase, audioCtx, handleMiss, isCrescendoActive, HIT_TOLERANCE, hasStarlightStep, hasPerfectPitch, hasSoothingHum, addHitEffect, setPlayerState, t, triggerPlayerAnimation, triggerSpiritAnimation, hasVitalSonata, hasGraceBoon, hasEcho, showFeedback, hasGracefulPoise, hasFlowState, effectIntensity]);

    const gameLoop = useCallback(() => {
        if (isPaused || !gameContainerRef.current || !audioCtx) {
            gameLoopRef.current = requestAnimationFrame(gameLoop);
            return;
        }

        const containerHeight = gameContainerRef.current.offsetHeight;
        if (containerHeight === 0) {
            gameLoopRef.current = requestAnimationFrame(gameLoop);
            return;
        }
        
        const hitLine = containerHeight * 0.85;
        const noteVisibleTime = (containerHeight * 1.2) / (NOTE_SPEED * 60);
        const currentTime = audioCtx.currentTime;

        if (phase === 'INTRO' || phase === 'PLAYING') {
            const updatedNotes = allNotesRef.current.map(note => {
                 if (note.hit !== 'none') return note;

                 const timeToHit = note.time - currentTime;

                 if (phase === 'PLAYING' && timeToHit < -(HIT_TOLERANCE.good / 1000)) {
                    note.hit = 'miss';
                    handleMiss();
                    return note;
                 }
                 if (timeToHit > noteVisibleTime) return note;

                 const notePosition = hitLine - (timeToHit * NOTE_SPEED * 60);
                 return { ...note, position: notePosition };
            });

            allNotesRef.current = updatedNotes;
            setNotes(updatedNotes.filter(n => n.position > -100 && n.position < containerHeight + 50 && n.hit !== 'miss'));
            
            if (phase === 'PLAYING' && allNotesRef.current.length > 0 && allNotesRef.current.every(n => n.hit !== 'none')) {
                setPhase('GAMEOVER');
                if (harmony > 50) {
                     showFeedback(t('rhythm.wonderful'), 'text-purple-300');
                     setTimeout(() => handleComplete(true), 2000);
                } else {
                     showFeedback(t('rhythm.harmonyFades'), 'text-gray-400');
                     setTimeout(() => handleComplete(false), 2000);
                }
            }
        }
        
        gameLoopRef.current = requestAnimationFrame(gameLoop);
    }, [phase, isPaused, audioCtx, NOTE_SPEED, handleMiss, handleComplete, harmony, HIT_TOLERANCE.good, t, showFeedback]);
    
     useEffect(() => {
        if (phase !== 'PLAYING') return;

        if (harmony >= 100) {
           setFeedback({text: t('rhythm.perfectHarmony'), color: 'text-yellow-300', id: 0});
           setPhase('GAMEOVER');
           setTimeout(() => handleComplete(true), 2000);
        }
        else if (harmony <= 0) {
           setFeedback({text: t('rhythm.harmonyBroken'), color: 'text-red-500', id: 0});
           setPhase('GAMEOVER');
           setTimeout(() => handleComplete(false), 2000);
        }
   }, [harmony, phase, handleComplete, t]);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (isPaused) return;
            const key = e.key.toLowerCase();
            if (key === 'h') {
                handleCombatHeal();
                return;
            }
            if (key === 'f') {
                e.preventDefault();
                handleFlee();
                return;
            }
            const mappedKey = KEY_MAP[key];
            if (mappedKey && phase === 'PLAYING') {
                e.preventDefault();
                handlePlayerInput(mappedKey);
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        gameLoopRef.current = requestAnimationFrame(gameLoop);
        return () => {
            window.removeEventListener('keydown', handleKeyDown);
            if(gameLoopRef.current) cancelAnimationFrame(gameLoopRef.current);
        }
    }, [handlePlayerInput, gameLoop, phase, isPaused, handleCombatHeal, handleFlee]);

    if (phase === 'PREPARING') {
        return (
            <div className="h-full flex flex-col items-center justify-center">
                <p className="text-2xl font-title animate-pulse">{t('rhythm.preparing')}</p>
            </div>
        );
    }
    
    return (
        <div className="h-full flex flex-col items-center justify-between text-center p-1 sm:p-2 relative overflow-hidden">
             {resonantWaveEffect && (
                <div 
                    className="absolute top-1/2 left-1/2 w-px h-px rounded-full pointer-events-none"
                    style={{
                        zIndex: 20,
                        animation: 'resonant-wave-shadow-vfx 0.8s ease-out forwards',
                        '--vfx-opacity': effectIntensity,
                    } as React.CSSProperties}
                />
            )}
            <div className="fight-light-effect"></div>
            {flyingStars.map(star => (
                <div key={star.id} className="vfx-flying-star" style={{
                    top: `${star.startY}%`,
                    left: `${star.startX}%`,
                    transform: 'translate(-50%, -50%)',
                    '--to-x': star.toX,
                    '--to-y': star.toY,
                     '--vfx-opacity': effectIntensity,
                } as React.CSSProperties}>
                    <StarIcon className="w-8 h-8"/>
                </div>
            ))}
            <header className="w-full relative z-10">
                <button onClick={onOpenAbilities} className="absolute left-0 top-0 p-2 bg-black/20 hover:bg-black/40 rounded-full text-gray-300 hover:text-white transition-colors">
                    <BookOpenIcon className="w-7 h-7" />
                </button>
                <h2 className="font-title text-3xl sm:text-4xl text-blue-400 tracking-widest uppercase drop-shadow-lg">{t('ui.dance')}</h2>
                <div className="w-full flex justify-around items-center my-2 sm:my-4">
                    <div className="flex flex-col items-center w-1/4 relative">
                        {healVfx.map(vfx => <div key={vfx.id} className="heal-vfx-text" style={{top: vfx.y, left: vfx.x}}>+{vfx.amount}</div>)}
                        <div className={`relative w-20 h-20 sm:w-24 sm:h-24 transition-all duration-200 ${playerAnim ? 'animate-hop' : ''} ${isCrescendoActive ? 'crescendo-aura' : ''}`}> 
                            <Sprite seed="Keya" size={96} className="w-full h-full" alignment={playerState.alignment} />
                            {echoEffect && hasEcho && (
                                <div key={echoEffect.id} className="sprite-echo" style={{'--vfx-opacity': effectIntensity } as React.CSSProperties}>
                                    <Sprite seed="Keya" size={96} className="w-full h-full" alignment={playerState.alignment} />
                                </div>
                            )}
                             {isProtected && <div style={{'--vfx-opacity': effectIntensity } as React.CSSProperties}><TwirlBarrier isShattering={isTwirlShattering} /></div>}
                        </div>
                        <p className="text-lg mt-2 text-gray-200 font-bold">Keya</p>
                        {hasCombatHealBoon && <p className="text-sm text-green-400 mt-1 font-bold">({t('ui.map.actionHeal')}: H)</p>}
                    </div>
                    <div className="flex flex-col items-center">
                         <p className={`text-xl sm:text-2xl h-8 mb-2 font-bold transition-colors duration-300 ${feedback.color}`}>{feedback.text}</p>
                         <p className="text-lg text-indigo-300 font-bold mb-1">{t('rhythm.harmony')}</p>
                         <div className={`w-40 sm:w-64 progress-bar rounded-full h-5 relative overflow-hidden ${isCrescendoActive ? 'harmony-bar-crescendo' : ''}`}>
                            <div className="h-full rounded-full progress-bar-fill harmony-bar" style={{ width: `${Math.max(0, harmony)}%`, transition: isSerenityAnimating ? 'width 0.8s ease-in-out' : 'width 0.2s linear' }} />
                            {isSerenityAnimating && <div className="serenity-fill-bar-fx" onAnimationEnd={() => setIsSerenityAnimating(false)} />}
                        </div>
                        <p className={`text-lg text-yellow-300 font-bold mt-1 transition-all duration-300 ${isFlowShieldActive ? 'combo-shield' : ''} ${isFlowShieldCracking ? 'cracking' : ''}`}>{t('rhythm.combo')}: {combo}</p>
                    </div>
                    <div className="flex flex-col items-center w-1/4">
                         <div className={`relative w-20 h-20 sm:w-24 sm:h-24 transition-all duration-300 ${spiritAnim ? 'animate-hop' : ''} ${spiritReact ? 'scale-105' : ''}`}>
                             <Sprite seed={enemy.seed} size={96} className={`w-full h-full transition-all duration-200 ${spiritReact ? 'drop-shadow-[0_0_10px_#facc15]' : ''}`} encounter={enemy} />
                        </div>
                        <p className="text-lg mt-2 text-gray-200 font-bold">{t(enemy.name)}</p>
                    </div>
                </div>
            </header>

            <div ref={gameContainerRef} className={`w-full max-w-lg h-[65vh] max-h-[500px] bg-black/30 rounded-lg overflow-hidden relative border-2 border-[var(--color-border)] z-10 ${hasTempoShift ? 'tempo-shift-track' : ''}`}>
                {hasTempoShift && <div className="tempo-shift-vignette" />}
                <div className="absolute inset-0 flex justify-around">
                    {DISPLAY_DIRECTIONS.map(dir => <div key={dir} className="w-1/4 h-full border-r border-white/10 last:border-r-0"></div>)}
                </div>
                {humParticles.map(p => {
                    const dirIndex = DISPLAY_DIRECTIONS.indexOf(p.dir);
                    return (
                        <div 
                            key={p.id}
                            className="hum-particle"
                            style={{
                                top: '85%',
                                left: `${dirIndex * 25 + 12.5}%`,
                                transform: 'translate(-50%, -50%)',
                                '--vfx-opacity': effectIntensity,
                            } as React.CSSProperties}
                        />
                    )
                })}
                {goldenParticles.map(p => {
                    const dirIndex = DISPLAY_DIRECTIONS.indexOf(p.dir);
                    return (
                        <div
                            key={p.id}
                            className="vfx-golden-particle"
                            style={{
                                top: '85%',
                                left: `${dirIndex * 25 + 12.5}%`,
                                transform: 'translate(-50%, -50%)',
                                '--vfx-opacity': effectIntensity,
                            } as React.CSSProperties}
                        />
                    );
                })}
                {vitalSonataParticles.map(p => {
                    const dirIndex = DISPLAY_DIRECTIONS.indexOf(p.dir);
                    return (
                         <div key={p.id} className="vital-sonata-particle" style={{
                            top: '85%', left: `${dirIndex * 25 + 12.5}%`, transform: 'translate(-50%, -50%)',
                            '--from-x': '0', '--from-y': '0',
                            '--to-x': `${(25 - (dirIndex * 25 + 12.5))}vw`, '--to-y': '-70vh',
                            '--vfx-opacity': effectIntensity,
                         } as React.CSSProperties} >
                             <HeartIcon />
                         </div>
                    )
                })}
                 {hitEffects.map(effect => {
                    const dirIndex = DISPLAY_DIRECTIONS.indexOf(effect.dir);
                    let effectClasses = '';
                    let animationClass = 'animate-hit-vfx';

                    if (effect.isFlourish) {
                        effectClasses = 'bg-yellow-400/50 border-yellow-300';
                        animationClass = 'animate-flourish-hit-vfx';
                    } else if (effect.type === 'perfect') {
                        effectClasses = 'bg-yellow-400/50 border-yellow-300';
                    } else if (effect.type === 'good') {
                        effectClasses = 'bg-green-400/50 border-green-300';
                    } else {
                        effectClasses = 'bg-red-500/50 border-red-400';
                    }
                    
                    return (
                        <div key={effect.id}
                            className={`absolute w-24 h-24 rounded-full border-4 ${animationClass} ${effectClasses}`}
                            style={{ top: '85%', left: `${dirIndex * 25 + 12.5}%`, transform: 'translate(-50%, -50%)' }}
                        />
                    );
                })}
                <div className="absolute left-0 right-0 flex justify-around items-center border-t-2 border-b-2 border-yellow-400/50 py-2" style={{ top: `85%`, transform: 'translateY(-50%)', filter: 'drop-shadow(0 0 10px #facc15)'}}>
                     {hasFlowState && <div className="perfect-hit-zone-glow" />}
                     {hasGracefulPoise && <div className="graceful-poise-zone" />}
                     {DISPLAY_DIRECTIONS.map(dir => (
                        <div key={dir} className={`w-14 h-14 sm:w-20 sm:h-20 rounded-full flex items-center justify-center bg-gradient-to-br ${COLOR_MAP[dir]} opacity-20`}>
                           {React.createElement(ICON_MAP[dir], {className: 'w-8 h-8 sm:w-12 sm:h-12 text-white'})}
                        </div>
                     ))}
                </div>
                {notes.map(note => {
                    if (note.hit !== 'none' && phase === 'PLAYING') return null;
                    const Icon = ICON_MAP[note.dir];
                    const dirIndex = DISPLAY_DIRECTIONS.indexOf(note.dir);
                    return (
                        <div key={note.id} className={`absolute w-1/4 flex justify-center`} style={{ top: note.position, left: `${dirIndex * 25}%`, transform: 'translateY(-50%)'}}>
                            <div className={`relative w-14 h-14 sm:w-20 sm:h-20 rounded-full flex items-center justify-center bg-gradient-to-br ${COLOR_MAP[note.dir]} shadow-lg`}>
                                <Icon className="w-8 h-8 sm:w-12 sm:h-12 text-black/70" />
                                {note.flourish && <StarIcon className="absolute -top-1 -right-1 w-6 h-6 text-yellow-300 drop-shadow-lg" />}
                                {note.flourish && <div className="note-flourish-glow" />}
                            </div>
                        </div>
                    )
                })}
                {phase === 'INTRO' && <div className="absolute inset-0 bg-black/50 flex items-center justify-center"><p className="text-8xl font-title text-white animate-ping">{countdown > 0 ? countdown : ''}</p></div>}
            </div>
            
            <footer className="w-full max-w-lg mt-2 sm:mt-4 flex justify-between items-center z-10">
                <div className="flex items-center space-x-4">
                     {isProtected && <p className="text-sm text-cyan-300 font-bold animate-pulse">{t('rhythm.twirlReady')}</p>}
                     {isCrescendoActive && <p className="text-sm text-pink-400 font-bold animate-pulse">{t('rhythm.crescendoActive')}</p>}
                     {isFlowShieldActive && <p className="text-sm text-purple-300 font-bold">{t('rhythm.flowReady')}</p>}
                 </div>
                 {!isBoss && <button title={`${t('rhythm.fleeTitle')} (F)`} onClick={handleFlee} disabled={phase !== 'PLAYING'} className="p-2 bg-gray-600/80 hover:bg-gray-500/80 rounded-full text-white disabled:opacity-50 disabled:cursor-not-allowed"><FleeIcon className="w-6 h-6" /></button>}
            </footer>
        </div>
    );
};