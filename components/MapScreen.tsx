
import React, { useCallback, useEffect, useState, useRef, useMemo } from 'react';
import { MapTile, PlayerState, CollectibleStar, Direction } from '../types';
import { StarIcon, BookOpenIcon, HeartIcon } from './icons';
import { Sprite } from './Sprite';
import { AuraGauge } from './AuraGauge';
import { Minimap } from './Minimap';
import { audioService } from '../services/audioService';
import { LabyrinthCompass } from './LabyrinthCompass';

const useGameLoop = (callback: (deltaTime: number) => void, isRunning: boolean) => {
    const savedCallback = useRef<(deltaTime: number) => void | null>(null);
    const lastTimeRef = useRef<number>(0);
    
    useEffect(() => { savedCallback.current = callback; }, [callback]);

    useEffect(() => {
        if (!isRunning) return;
        let animationFrameId: number;
        
        const loop = (time: number) => {
            if (lastTimeRef.current !== 0) {
                const deltaTime = time - lastTimeRef.current;
                savedCallback.current?.(deltaTime);
            }
            lastTimeRef.current = time;
            animationFrameId = requestAnimationFrame(loop);
        };
        
        lastTimeRef.current = 0;
        animationFrameId = requestAnimationFrame(loop);
        return () => cancelAnimationFrame(animationFrameId);
    }, [isRunning]);
};

type RoomObstacle = NonNullable<MapTile['obstacles']>[0];

const Door = React.memo(({ position, isAvailable }: { position: 'top' | 'bottom' | 'left' | 'right', isAvailable: boolean }) => {
    const baseClasses = 'absolute bg-slate-800/50 border-2 border-slate-500/50 transform transition-all duration-300 z-10';
    const positionClasses = {
        top: 'w-24 h-4 -top-1 left-1/2 -translate-x-1/2 rounded-b-lg',
        bottom: 'w-24 h-4 -bottom-1 left-1/2 -translate-x-1/2 rounded-t-lg',
        left: 'w-4 h-24 -left-1 top-1/2 -translate-y-1/2 rounded-r-lg',
        right: 'w-4 h-24 -right-1 top-1/2 -translate-y-1/2 rounded-l-lg',
    };
    const stateClasses = isAvailable ? 'opacity-100' : 'opacity-0 cursor-default pointer-events-none';
    return (
        <div className={`${baseClasses} ${positionClasses[position]} ${stateClasses}`}>
            {isAvailable && <div className="absolute inset-0 bg-gradient-to-t from-purple-500/20 to-transparent animate-pulse"></div>}
        </div>
    );
});
Door.displayName = 'Door';

const FloorDisplay: React.FC<{ currentFloor: number, t: (key: string) => string }> = React.memo(({ currentFloor, t }) => (
    <div className="flex flex-col items-center">
        <p className="text-sm font-bold mb-1 text-gray-400">{t('ui.floor')}</p>
        <div className="flex items-center space-x-2 p-2 bg-black/30 rounded-full border border-white/10">
            {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className={`w-4 h-4 rounded-full transition-all duration-300 ${i + 1 === currentFloor ? 'bg-purple-400 scale-125 shadow-[0_0_8px_var(--color-primary)]' : i + 1 < currentFloor ? 'bg-cyan-500' : 'bg-slate-600'}`} />
            ))}
        </div>
    </div>
));
FloorDisplay.displayName = 'FloorDisplay';


const RoomContent = React.memo(({ obstacles, seed }: { obstacles: RoomObstacle[], seed: string }) => {
    return (
        <>
            {obstacles.map((obs, i) => {
                if (obs.type === 'pit') {
                    let pitSeed = 'PitGray';
                    if (obs.pitType === 'red') pitSeed = 'PitRed';
                    else if (obs.pitType === 'green' && !obs.isUsed) pitSeed = 'PitGreen';
                    
                    return (
                        <div key={`${seed}-${i}`} className="absolute"
                            style={{
                                top: `${obs.y}%`, left: `${obs.x}%`,
                                width: `${obs.width}%`, height: `${obs.height}%`,
                                transform: 'translate(-50%, -50%)',
                            }}>
                            <Sprite seed={pitSeed} size={64} className="w-full h-full animate-pulse" />
                        </div>
                    )
                }
                
                let bgClass = '';
                switch(obs.type) {
                    case 'spikes': bgClass = 'spikes-bg'; break;
                    case 'rock': bgClass = 'rock-bg'; break;
                    case 'cobweb': bgClass = 'cobweb-bg'; break;
                    case 'wall': bgClass = 'wall-bg'; break;
                    // Pit is handled by Sprite now
                }
                if (!bgClass) return null;

                return (
                    <div key={`${seed}-${i}`} className={`absolute ${bgClass}`}
                        style={{
                            top: `${obs.y}%`, left: `${obs.x}%`,
                            width: `${obs.width}%`, height: `${obs.height}%`,
                            transform: 'translate(-50%, -50%)',
                        }}
                    />
                );
            })}
        </>
    );
});
RoomContent.displayName = 'RoomContent';

type EntryDirection = 'up' | 'down' | 'left' | 'right';
interface MapScreenProps {
    map: MapTile[][];
    playerState: PlayerState;
    onMove: (newPosition: { row: number, col: number }) => void;
    onConfront: () => void;
    isTransitioning: boolean;
    onOpenAbilities: () => void;
    stars: CollectibleStar[];
    onStarCollect: (starId: number) => void;
    onDamage: (amount: number) => void;
    onHeal: (amount: number, volume?: number) => void;
    onSpendStarsForHealth: (starCost: number, healthGain: number) => void;
    onFountainUse: () => void;
    onShrineUse: (pos: {row: number, col: number}) => void;
    onPitUse: (pairId: number) => void;
    onDescend: () => void;
    powerUp: { type: 'speed', duration: number } | null;
    labyrinthName: string;
    isPaused: boolean;
    t: (key: string, replacements?: Record<string, string|number>) => string;
    entryDirection: EntryDirection | null;
    onOpenCheatPopup: () => void;
    healthBarAnimKey: number;
}

const PLAYER_SIZE = { width: 6, height: 8 };
const ACCELERATION = 0.003;
const FRICTION = 0.90;
const ENEMY_SPEED = 0.005;

const DOOR_ZONES = {
    up: { y: 6, x: 50, width: 12, height: 12 },
    down: { y: 94, x: 50, width: 12, height: 12 },
    left: { x: 6, y: 50, width: 12, height: 12 },
    right: { x: 94, y: 50, width: 12, height: 12 }
};

export const MapScreen: React.FC<MapScreenProps> = ({ map, playerState, onMove, onConfront, isTransitioning, onOpenAbilities, stars: roomStars, onStarCollect, onDamage, onHeal, onSpendStarsForHealth, onFountainUse, onShrineUse, onPitUse, onDescend, powerUp, labyrinthName, isPaused, t, entryDirection, onOpenCheatPopup, healthBarAnimKey }) => {
    const { position } = playerState;
    const [enemyPos, setEnemyPos] = useState({ x: 50, y: 35 });
    const [playerPhysics, setPlayerPhysics] = useState({ x: 50, y: 50, vx: 0, vy: 0 });
    const [isKeyaHit, setIsKeyaHit] = useState(false);
    const [enemyFrozen, setEnemyFrozen] = useState(true);
    const [floatingHealTexts, setFloatingHealTexts] = useState<{ id: number; amount: number }[]>([]);
    const [renewalEffects, setRenewalEffects] = useState<{ id: number }[]>([]);
    const [playerTrail, setPlayerTrail] = useState<{x: number, y: number}[]>([]);
    const [sparkleEffects, setSparkleEffects] = useState<{id: number, x: number, y: number}[]>([]);
    const [starRegenParticles, setStarRegenParticles] = useState<{id: number}[]>([]);
    const prevStarPowerRef = useRef(playerState.starPower);


    const keysPressed = useRef<{ [key: string]: boolean }>({});
    const movedThisFrame = useRef(false);
    const lastDamageTime = useRef(0);
    const lastTeleportTime = useRef(0);
    const codeSequence = "wwssadadwwssadadwwssadad";
    const keySequence = useRef("");

    const currentTile = map[position.row][position.col];
    const roomObstacles = currentTile.obstacles || [];
    const hasEnemy = (currentTile.type === 'encounter' || currentTile.type === 'boss') && currentTile.encounter;
    const hasDescentHole = currentTile.hasDescentHole;
    
    const hasRadianceBoon = playerState.abilities.includes('boon_radiance_1');
    const minimapSightRange = hasRadianceBoon ? 2 : 0;

    const STAR_HEAL_COST = 5;
    const canHealWithStars = playerState.starPower >= STAR_HEAL_COST && playerState.health < playerState.maxHealth;
    
    const checkCollision = useCallback((x: number, y: number, obstacle: RoomObstacle) => {
        const pRect = { l: x - PLAYER_SIZE.width / 2, r: x + PLAYER_SIZE.width / 2, t: y - PLAYER_SIZE.height / 2, b: y + PLAYER_SIZE.height / 2 };
        const oRect = { l: obstacle.x - obstacle.width / 2, r: obstacle.x + obstacle.width / 2, t: obstacle.y - obstacle.height / 2, b: obstacle.y + obstacle.height / 2 };
        return { isColliding: pRect.l < oRect.r && pRect.r > oRect.l && pRect.t < oRect.b && pRect.b > oRect.t, type: obstacle.type };
    }, []);

    const checkPitCollision = useCallback((px: number, py: number, pit: RoomObstacle) => {
        const dx = px - pit.x;
        const dy = py - pit.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        const collisionThreshold = (pit.width / 2); // Pits are circular, check against its radius
        return distance < collisionThreshold;
    }, []);

    const handleHealKeyPress = useCallback(() => {
        if (isPaused || !canHealWithStars) return;

        const healthGain = 6 + Math.floor(Math.random() * 2);
        onSpendStarsForHealth(STAR_HEAL_COST, healthGain);
        const id = performance.now();
        setFloatingHealTexts(v => [...v, { id, amount: healthGain }]);
        setTimeout(() => setFloatingHealTexts(v => v.filter(i => i.id !== id)), 1500);
    }, [isPaused, canHealWithStars, onSpendStarsForHealth]);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (isPaused) return;
            if (e.key.toLowerCase() === 'h') {
                handleHealKeyPress();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isPaused, handleHealKeyPress]);

    useEffect(() => {
        movedThisFrame.current = false;

        let startPos = { x: 50, y: 80 }; // Default safe spot, away from center
        if (entryDirection === 'up') startPos = { x: DOOR_ZONES.up.x, y: DOOR_ZONES.up.y + 6 };
        else if (entryDirection === 'down') startPos = { x: DOOR_ZONES.down.x, y: DOOR_ZONES.down.y - 6 };
        else if (entryDirection === 'left') startPos = { x: DOOR_ZONES.left.x + 6, y: DOOR_ZONES.left.y };
        else if (entryDirection === 'right') startPos = { x: DOOR_ZONES.right.x - 6, y: DOOR_ZONES.right.y };
        setPlayerPhysics({ x: startPos.x, y: startPos.y, vx: 0, vy: 0 });

        const roomSeed = `${position.row}-${position.col}`;
        const roomHash = parseInt(roomSeed.replace(/\-/g, ''));
        setEnemyPos({ x: 30 + (Math.abs(roomHash) % 40), y: 30 + (Math.abs(roomHash * 31) % 40) });
        setEnemyFrozen(true);
        const timer = setTimeout(() => setEnemyFrozen(false), 1500);
        return () => clearTimeout(timer);
    }, [position, entryDirection]);

    useEffect(() => {
        if (playerState.starPower > prevStarPowerRef.current && playerState.abilities.includes('boon_star_regen_1') && !isPaused) {
            audioService.playSfx('star_regen');
            const id = Date.now();
            setStarRegenParticles(prev => [...prev, { id }]);
            setTimeout(() => {
                setStarRegenParticles(prev => prev.filter(p => p.id !== id));
            }, 1500);
        }
        prevStarPowerRef.current = playerState.starPower;
    }, [playerState.starPower, playerState.abilities, isPaused]);

    useEffect(() => {
        if (isPaused || !playerState.abilities.includes('boon_regen_1')) return;
        const interval = setInterval(() => {
            if (playerState.health < playerState.maxHealth) {
                onHeal(1);
                audioService.playSfx('boon_renewal_tick');
                const id = performance.now();
                setRenewalEffects(v => [...v, { id }]);
                setTimeout(() => setRenewalEffects(v => v.filter(i => i.id !== id)), 1500);
            }
        }, 5000);
        return () => clearInterval(interval);
    }, [isPaused, playerState.abilities, playerState.health, playerState.maxHealth, onHeal]);
    
    const canMove = useCallback((dRow: number, dCol: number) => {
        const newRow = position.row + dRow;
        const newCol = position.col + dCol;
        return newRow >= 0 && newRow < map.length && newCol >= 0 && newCol < map[0].length && map[newRow][newCol].type !== 'empty';
    }, [map, position]);
    
    useEffect(() => {
        if (isTransitioning || isPaused) { keysPressed.current = {}; return; }
        const handleKeyDown = (e: KeyboardEvent) => {
             const key = e.key.toLowerCase();
             if (['w', 'a', 's', 'd', 'arrowup', 'arrowleft', 'arrowdown', 'arrowright'].includes(key)) {
                e.preventDefault();
                keysPressed.current[key] = true;
            }
        };
        const handleKeyUp = (e: KeyboardEvent) => { keysPressed.current[e.key.toLowerCase()] = false; };
        window.addEventListener('keydown', handleKeyDown);
        window.addEventListener('keyup', handleKeyUp);
        return () => { window.removeEventListener('keydown', handleKeyDown); window.removeEventListener('keyup', handleKeyUp); };
    }, [isTransitioning, isPaused]);
    
     useEffect(() => {
        if (isPaused) return;

        const handleCheatKeyDown = (e: KeyboardEvent) => {
            const key = e.key.toLowerCase();
            if ("wsad".includes(key)) {
                keySequence.current += key;
                if (keySequence.current.length > codeSequence.length) {
                    keySequence.current = keySequence.current.slice(1);
                }
                if (keySequence.current.endsWith(codeSequence)) {
                    onOpenCheatPopup();
                    keySequence.current = ""; // Reset after trigger
                }
            } else if (!['arrowup', 'arrowdown', 'arrowleft', 'arrowright', 'h', ' '].includes(key)) {
                keySequence.current = "";
            }
        };

        window.addEventListener('keydown', handleCheatKeyDown);
        return () => {
            window.removeEventListener('keydown', handleCheatKeyDown);
        };
    }, [isPaused, onOpenCheatPopup]);

    useGameLoop((deltaTime) => {
        if (isTransitioning || isPaused) return;
        
        setPlayerPhysics(p => {
            let { x, y, vx, vy } = p;
            let ax = 0, ay = 0;
            if (keysPressed.current['a'] || keysPressed.current['arrowleft']) ax -= 1;
            if (keysPressed.current['d'] || keysPressed.current['arrowright']) ax += 1;
            if (keysPressed.current['w'] || keysPressed.current['arrowup']) ay -= 1;
            if (keysPressed.current['s'] || keysPressed.current['arrowdown']) ay += 1;

            const hasHasteBoon = playerState.abilities.includes('boon_speed_1');
            const speedMultiplier = (hasHasteBoon ? 1.25 : 1) * (powerUp?.type === 'speed' ? 1.7 : 1);
            vx += ax * ACCELERATION * speedMultiplier;
            vy += ay * ACCELERATION * speedMultiplier;
            
            let isSlowed = roomObstacles.some(obs => checkCollision(x, y, obs).isColliding && obs.type === 'cobweb');
            vx *= isSlowed ? 0.80 : FRICTION;
            vy *= isSlowed ? 0.80 : FRICTION;

            if (hasHasteBoon) {
                 setPlayerTrail(trail => [ {x, y}, ...trail.slice(0, 4) ]);
            } else if (playerTrail.length > 0) {
                 setPlayerTrail([]);
            }

            let nextX = x + vx * deltaTime;
            let nextY = y + vy * deltaTime;
            let didTeleport = false;

            // --- PIT (PORTAL) LOGIC ---
            for (const obs of roomObstacles) {
                if (obs.type === 'pit' && obs.pairId !== undefined && checkPitCollision(nextX, nextY, obs) && Date.now() - lastTeleportTime.current > 1500) {
                    lastTeleportTime.current = Date.now();
                    const targetPit = roomObstacles.find(o => o.type === 'pit' && o.pairId === obs.pairId && (o.x !== obs.x || o.y !== obs.y));
                    
                    if (targetPit) {
                        audioService.playSfx('portal_enter');
                        nextX = targetPit.x;
                        nextY = targetPit.y;
                        vx = 0; vy = 0;
                        
                        if (obs.pitType === 'red') {
                            onDamage(10);
                            audioService.playSfx('portal_exit_damage');
                        } else if (obs.pitType === 'green' && !obs.isUsed) {
                            onHeal(15);
                            audioService.playSfx('portal_exit_heal');
                            onPitUse(obs.pairId);
                        } else {
                            audioService.playSfx('portal_enter', 0.8);
                        }
                        didTeleport = true;
                        break;
                    }
                }
            }

            if(didTeleport) return { x: nextX, y: nextY, vx, vy };

            // --- COLLISION RESOLUTION ---
            for (const obs of roomObstacles) {
                if (obs.type !== 'rock' && obs.type !== 'wall') continue;
                const pRect = { x: nextX, y: nextY, w: PLAYER_SIZE.width, h: PLAYER_SIZE.height };
                const oRect = { x: obs.x, y: obs.y, w: obs.width, h: obs.height };
                const overlapX = (pRect.w / 2 + oRect.w / 2) - Math.abs(pRect.x - oRect.x);
                const overlapY = (pRect.h / 2 + oRect.h / 2) - Math.abs(pRect.y - oRect.y);
                
                if (overlapX > 0 && overlapY > 0) {
                    if (overlapX < overlapY) {
                        nextX += overlapX * (Math.sign(nextX - oRect.x) || 1);
                        vx = 0;
                    } else {
                        nextY += overlapY * (Math.sign(nextY - oRect.y) || 1);
                        vy = 0;
                    }
                }
            }

            // Spike hazards
            for (const obs of roomObstacles) {
                if (checkCollision(nextX, nextY, obs).isColliding && obs.type === 'spikes' && Date.now() - lastDamageTime.current > 1000) {
                    lastDamageTime.current = Date.now();
                    setIsKeyaHit(true);
                    setTimeout(() => setIsKeyaHit(false), 200);
                    onDamage(5);
                    vx *= -0.5; vy *= -0.5; // Small knockback
                }
            }
            
            nextX = Math.max(PLAYER_SIZE.width / 2, Math.min(100 - PLAYER_SIZE.width / 2, nextX));
            nextY = Math.max(PLAYER_SIZE.height / 2, Math.min(100 - PLAYER_SIZE.height / 2, nextY));

            return { x: nextX, y: nextY, vx, vy };
        });

        if (movedThisFrame.current) { movedThisFrame.current = false; return; };

        const { x: pX, y: pY } = playerPhysics;

        if (hasDescentHole) {
            const holePos = { x: 50, y: 50 };
            const dist = Math.sqrt(Math.pow(pX - holePos.x, 2) + Math.pow(pY - holePos.y, 2));
            if (dist < 8) {
                onDescend();
                movedThisFrame.current = true;
            }
        }

        if (movedThisFrame.current) { movedThisFrame.current = false; return; };
        
        if (canMove(-1, 0) && pY < DOOR_ZONES.up.y && Math.abs(pX - DOOR_ZONES.up.x) < DOOR_ZONES.up.width/2) { onMove({ row: position.row - 1, col: position.col }); movedThisFrame.current = true; }
        else if (canMove(1, 0) && pY > DOOR_ZONES.down.y && Math.abs(pX - DOOR_ZONES.down.x) < DOOR_ZONES.down.width/2) { onMove({ row: position.row + 1, col: position.col }); movedThisFrame.current = true; }
        else if (canMove(0, -1) && pX < DOOR_ZONES.left.x && Math.abs(pY - DOOR_ZONES.left.y) < DOOR_ZONES.left.height/2) { onMove({ row: position.row, col: position.col - 1 }); movedThisFrame.current = true; }
        else if (canMove(0, 1) && pX > DOOR_ZONES.right.x && Math.abs(pY - DOOR_ZONES.right.y) < DOOR_ZONES.right.height/2) { onMove({ row: position.row, col: position.col + 1 }); movedThisFrame.current = true; }

        if (hasEnemy && !enemyFrozen) {
            const edx = playerPhysics.x - enemyPos.x, edy = playerPhysics.y - enemyPos.y;
            const dist = Math.sqrt(edx * edx + edy * edy);
            if (dist < 8) {
                onConfront();
            } else {
                const moveDist = ENEMY_SPEED * deltaTime;
                setEnemyPos(p => ({ x: p.x + (edx / dist) * moveDist, y: p.y + (edy / dist) * moveDist }));
            }
        }
        
        roomStars.forEach(star => {
            if (star.collected) return;
            const dist = Math.sqrt(Math.pow(playerPhysics.x - star.x, 2) + Math.pow(playerPhysics.y - star.y, 2));
            if (dist < 8) {
                onStarCollect(star.id);
                 if (playerState.abilities.includes('boon_stars_1')) {
                    const id = Date.now();
                    setSparkleEffects(prev => [...prev, { id, x: star.x, y: star.y }]);
                    setTimeout(() => setSparkleEffects(prev => prev.filter(e => e.id !== id)), 500);
                }
            }
        });

        if (currentTile.type === 'healing' && !currentTile.fountainUsed && playerState.health < playerState.maxHealth && Math.sqrt(Math.pow(playerPhysics.x - 50, 2) + Math.pow(playerPhysics.y - 50, 2)) < 10) {
            onHeal(50);
            const id = performance.now();
            setFloatingHealTexts(v => [...v, { id, amount: 50 }]);
            setTimeout(() => setFloatingHealTexts(v => v.filter(i => i.id !== id)), 1500);
            onFountainUse();
        }

        if (currentTile.type === 'shrine' && !currentTile.shrineUsed && Math.sqrt(Math.pow(playerPhysics.x - 50, 2) + Math.pow(playerPhysics.y - 50, 2)) < 10) {
            audioService.playSfx('powerup');
            onShrineUse(position);
        }

    }, !isTransitioning && !isPaused);
    
    return (
        <div className="flex flex-col items-center justify-between h-full">
            <h1 className="font-title text-3xl sm:text-4xl text-gray-300 mb-2 drop-shadow-lg">{labyrinthName}</h1>
            <div className="flex-grow w-full flex items-center justify-center p-2">
                <div className={`w-full h-full flex items-center justify-center relative bg-black/10 rounded-lg border border-white/5 overflow-hidden shadow-[inset_0_0_20px_rgba(0,0,0,0.5)] ${isTransitioning ? 'animate-room-transition' : ''}`}>
                    <div className={`room-bg room-bg-floor${playerState.currentFloor}`}></div>
                    {currentTile.type === 'boss' && <div className="absolute inset-0 room-bg-boss"></div>}
                    {currentTile.type === 'encounter' && <div className="absolute inset-0 room-bg-encounter"></div>}
                    
                    <div className={`wall-overlay wall-overlay-${currentTile.shape || 'square'}-${currentTile.wallThickness || 'normal'}`}></div>

                    <RoomContent obstacles={roomObstacles} seed={`${position.row}-${position.col}`} />

                    {!hasRadianceBoon && (
                        <div 
                            className="fog-of-war"
                            style={{
                                '--player-x': `${playerPhysics.x}%`,
                                '--player-y': `${playerPhysics.y}%`,
                                '--sight-radius': '28%',
                            } as React.CSSProperties}
                        />
                    )}

                    <Door position="top" isAvailable={canMove(-1, 0)} />
                    <Door position="bottom" isAvailable={canMove(1, 0)} />
                    <Door position="left" isAvailable={canMove(0, -1)} />
                    <Door position="right" isAvailable={canMove(0, 1)} />
                    
                    {roomStars.map(star => (
                        !star.collected &&
                        <div key={star.id} className="absolute transition-transform duration-300" style={{top: `${star.y}%`, left: `${star.x}%`, transform: `translate(-50%, -50%)`}}>
                            <StarIcon className="w-8 h-8 text-yellow-300 animate-pulse drop-shadow-[0_0_8px_#fde047]" />
                        </div>
                    ))}
                    {sparkleEffects.map(effect => (
                        <div key={effect.id} className="absolute" style={{ top: `${effect.y}%`, left: `${effect.x}%`, width: '32px', height: '32px', transform: 'translate(-50%, -50%)', zIndex: 11, pointerEvents: 'none' }}>
                            <div className="animate-star-sparkle-enhanced"></div>
                        </div>
                    ))}
                    
                    {hasEnemy &&
                        <div className="absolute transition-all duration-100 ease-linear" style={{ top: `${enemyPos.y}%`, left: `${enemyPos.x}%`, transform: 'translate(-50%, -50%)' }}>
                            <div className="w-24 h-24 sm:w-32 sm:h-32"><Sprite seed={currentTile.encounter!.seed} size={128} encounter={currentTile.encounter!} className="w-full h-full drop-shadow-lg" /></div>
                        </div>
                    }

                    {hasDescentHole && (
                        <div 
                            className="absolute transition-all duration-100 ease-linear" 
                            style={{ 
                                top: '50%', 
                                left: '50%', 
                                transform: 'translate(-50%, -50%)' 
                            }}
                        >
                            <div className="w-32 h-32 sm:w-40 sm:h-40 animate-portal-swirl">
                                <Sprite seed="DescentPortal" size={160} className="w-full h-full drop-shadow-lg" />
                            </div>
                        </div>
                    )}

                    {currentTile.type === 'healing' &&
                         <div className="absolute transition-all duration-100 ease-linear" style={{ top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }}>
                            <div className={`w-32 h-32 sm:w-40 sm:h-40 ${currentTile.fountainUsed ? 'opacity-40 filter grayscale' : 'animate-pulse'}`}>
                                <Sprite seed="HealingFountain" size={160} className="w-full h-full drop-shadow-lg" />
                            </div>
                        </div>
                    }

                    {currentTile.type === 'shrine' &&
                         <div className="absolute transition-all duration-100 ease-linear" style={{ top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }}>
                            <div className={`w-32 h-32 sm:w-40 sm:h-40 ${currentTile.shrineUsed ? 'opacity-40 filter grayscale' : 'animate-pulse'}`}>
                                <Sprite seed="ShrineOfSwiftness" size={160} className="w-full h-full drop-shadow-lg" />
                            </div>
                        </div>
                    }

                    {playerState.abilities.includes('boon_speed_1') && playerTrail.map((pos, i) => (
                        <div key={i} className="absolute" style={{ top: `${pos.y}%`, left: `${pos.x}%`, transform: 'translate(-50%, -50%)', zIndex: 5, opacity: 0.5 - i * 0.1, pointerEvents: 'none' }}>
                            <div className="w-20 h-20 sm:w-24 sm:h-24">
                                <Sprite seed="Keya" size={96} alignment={playerState.alignment} className="w-full h-full" />
                            </div>
                        </div>
                    ))}
                    <div className="absolute" style={{ top: `${playerPhysics.y}%`, left: `${playerPhysics.x}%`, transform: 'translate(-50%, -50%)', zIndex: 6 }}>
                        <div className={`w-20 h-20 sm:w-24 sm:h-24`}>
                            <Sprite seed="Keya" size={96} alignment={playerState.alignment} isHit={isKeyaHit} className="w-full h-full drop-shadow-lg" />
                             {powerUp?.type === 'speed' && <div className="absolute inset-0 rounded-full bg-cyan-400/30 animate-pulse border-2 border-cyan-300"></div>}
                             {floatingHealTexts.map(vfx => <div key={vfx.id} className="heal-vfx-text">+{vfx.amount}</div>)}
                             {renewalEffects.map(effect => (
                                <div key={effect.id} className="absolute inset-0">
                                    <div className="renewal-vfx-text">+1</div>
                                    {Array.from({length: 5}).map((_, i) => (
                                        <div key={i} className="heal-particle" style={{
                                            width: '5px', height: '5px',
                                            top: '50%', left: '50%',
                                            animationDelay: `${i * 0.1}s`,
                                            '--tx': `${Math.cos(i*72 * Math.PI/180) * 30 - 50}%`,
                                            '--ty': `${Math.sin(i*72 * Math.PI/180) * 30 - 150}%`,
                                        } as React.CSSProperties} />
                                    ))}
                                </div>
                             ))}
                            {starRegenParticles.map(p => <div key={p.id} className="star-regen-particle">✨</div>)}
                        </div>
                    </div>
                </div>
            </div>
            
            <footer className="w-full grid grid-cols-1 lg:grid-cols-3 items-center p-2 mt-2 gap-4 glassmorphic-panel rounded-xl">
                 <div className="flex space-x-4 items-center justify-center lg:justify-start">
                     <div className="flex-grow max-w-sm">
                        <div className="flex justify-between items-center w-full">
                            <p className="font-bold text-lg text-gray-200">{t('ui.keyaStatus')}</p>
                            {powerUp?.type === 'speed' && (
                                <div className="px-2 py-1 bg-cyan-500/80 text-white text-sm font-bold rounded-full animate-pulse">
                                    {t('ui.map.powerup.speed')}: {powerUp.duration}s
                                </div>
                            )}
                        </div>
                        <div className="w-full mt-1">
                            <div className="flex justify-between text-sm"><span>{t('ui.health')}</span><span>{playerState.health}/{playerState.maxHealth}</span></div>
                            <div className={`w-full progress-bar rounded-full h-3 ${healthBarAnimKey > 0 ? 'animate-health-bar-flash' : ''}`} key={healthBarAnimKey}><div className="h-full rounded-full progress-bar-fill health-bar" style={{width: `${playerState.health / playerState.maxHealth * 100}%`}}></div></div>
                        </div>
                        <div className="flex items-center text-yellow-400 font-bold mt-1"><StarIcon className="w-5 h-5 mr-1" />{playerState.starPower}</div>
                        <div className="mt-3 flex items-center space-x-2">
                            <button 
                                onClick={onOpenAbilities} 
                                className="flex items-center justify-center font-title text-md bg-purple-700/80 hover:bg-purple-600/80 text-white py-2 px-4 rounded-full shadow-lg transform transition-all duration-200 enabled:hover:-translate-y-0.5 enabled:hover:shadow-xl"
                                aria-label={t('ui.viewAbilities')}
                            >
                                <BookOpenIcon className="w-5 h-5 mr-2" />
                                {t('ui.abilities')}
                            </button>
                            <div className="flex items-center space-x-2">
                                <button
                                    onClick={handleHealKeyPress}
                                    disabled={!canHealWithStars}
                                    title={t('ui.map.spendStars', {cost: STAR_HEAL_COST})}
                                    className="flex items-center justify-center font-title text-md bg-green-700/80 hover:bg-green-600/80 text-white py-2 px-4 rounded-full shadow-lg transition-all duration-200 enabled:hover:-translate-y-0.5 enabled:hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    <HeartIcon className="w-5 h-5 mr-2" />
                                    {STAR_HEAL_COST}
                                    <StarIcon className="w-4 h-4 ml-1" />
                                </button>
                                <span className="text-sm text-gray-400 font-bold">(H)</span>
                            </div>
                        </div>
                    </div>
                    <AuraGauge alignment={playerState.alignment} t={t} />
                 </div>
                 <div className="flex flex-col items-center justify-center">
                    <Minimap map={map} playerState={playerState} t={t} sightRange={minimapSightRange} />
                    <FloorDisplay currentFloor={playerState.currentFloor} t={t} />
                 </div>
                 <div className="flex flex-col items-center justify-center lg:justify-end min-h-[140px]">
                     {playerState.abilities.includes('boon_compass_1') && <LabyrinthCompass map={map} playerState={playerState} t={t} />}
                 </div>
            </footer>
        </div>
    );
};
