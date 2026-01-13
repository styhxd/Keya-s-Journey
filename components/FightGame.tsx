import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { FightMove, PlayerState, Encounter, Ability, Direction, GameStats } from '../types';
import { ABILITIES, DIRECTIONS } from '../constants';
import { 
    VineWhipIcon, StoneShieldIcon, SunfireIcon, FocusIcon, WardIcon, 
    ArrowDownIcon, ArrowLeftIcon, ArrowRightCircleIcon, ArrowUpIcon, StarIcon, FleeIcon, 
    ArrowRightIcon, GalePushIcon, RootSnareIcon, MirageIcon, LifeSapIcon, ThornBurstIcon, BookOpenIcon,
    EyeSlashIcon, HeartIcon, ShieldBashIcon, BurningBladeIcon, VengefulStrikeIcon, PurifyingLightIcon
} from './icons';
import { Sprite } from './Sprite';
import { audioService } from '../services/audioService';
import { FIGHT_MOVE_DATA } from '../data/combatFormulas';

interface FightGameScreenProps {
    enemy: Encounter;
    playerState: PlayerState;
    setPlayerState: React.Dispatch<React.SetStateAction<PlayerState | null>>;
    onComplete: (type: 'fight', success: boolean, fled?: boolean) => void;
    isPaused: boolean;
    onOpenAbilities: () => void;
    t: (key: string, replacements?: Record<string, string | number>) => string;
    language: 'en' | 'pt' | 'es';
    gameStats: GameStats;
}

const HealthBar = React.memo(({ value, maxValue, barClass, name }: { value: number, maxValue: number, barClass: string, name: string }) => (
    <div className="w-full">
        <div className="flex justify-between mb-1">
            <span className="text-sm font-bold text-gray-200">{name}</span>
            <span className="text-sm font-bold text-gray-300">{Math.ceil(value)} / {maxValue}</span>
        </div>
        <div className="w-full progress-bar rounded-full h-4 sm:h-5">
            <div 
                className={`h-full rounded-full progress-bar-fill ${barClass}`} 
                style={{ width: `${Math.max(0, (value / maxValue) * 100)}%` }}
            />
        </div>
    </div>
));
HealthBar.displayName = "HealthBar";


type GamePhase = 'PLAYER_TURN' | 'MINIGAME' | 'ENEMY_TURN' | 'PLAYER_DODGE' | 'GAMEOVER' | 'FEEDBACK';
const ARROW_ICONS: Record<Direction, React.FC<React.ComponentProps<'svg'>>> = { up: ArrowUpIcon, down: ArrowDownIcon, left: ArrowLeftIcon, right: ArrowRightCircleIcon };

const snareStyle = {
    backgroundImage: "url('data:image/svg+xml;utf8,<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"40\" height=\"20\"><path d=\"M0 20 C 10 0, 30 0, 40 20\" stroke=\"%234d7c0f\" fill=\"none\" stroke-width=\"4\" stroke-linecap=\"round\"/></svg>')",
};

const MOVE_ICONS: Record<string, React.FC<any>> = {
    'vine': VineWhipIcon,
    'stone': StoneShieldIcon,
    'gale': GalePushIcon,
    'sunfire': SunfireIcon,
    'focus': FocusIcon,
    'ward': WardIcon,
    'rootSnare': RootSnareIcon,
    'mirage': MirageIcon,
    'lifeSap': LifeSapIcon,
    'thornBurst': ThornBurstIcon,
    'shieldBash': ShieldBashIcon,
    'burningBlade': BurningBladeIcon,
    'shadow_cloak': EyeSlashIcon,
    'celestial_strike': StarIcon,
    'vengeful_strike': VengefulStrikeIcon,
    'purifying_light': PurifyingLightIcon,
}
const MOVE_COLORS: Record<string, {color: string, bgColor: string}> = {
    'vine': { color: 'text-green-200', bgColor: 'bg-green-700/80 hover:bg-green-600/80' },
    'stone': { color: 'text-yellow-200', bgColor: 'bg-yellow-700/80 hover:bg-yellow-600/80' },
    'gale': { color: 'text-cyan-200', bgColor: 'bg-cyan-700/80 hover:bg-cyan-600/80' },
    'sunfire': { color: 'text-orange-200', bgColor: 'bg-orange-700/80 hover:bg-orange-600/80' },
    'focus': { color: 'text-purple-200', bgColor: 'bg-purple-700/80 hover:bg-purple-600/80' },
    'ward': { color: 'text-stone-200', bgColor: 'bg-stone-700/80 hover:bg-stone-600/80' },
    'rootSnare': { color: 'text-lime-200', bgColor: 'bg-lime-700/80 hover:bg-lime-600/80' },
    'mirage': { color: 'text-indigo-200', bgColor: 'bg-indigo-700/80 hover:bg-indigo-600/80' },
    'lifeSap': { color: 'text-red-300', bgColor: 'bg-red-900/80 hover:bg-red-800/80' },
    'thornBurst': { color: 'text-emerald-300', bgColor: 'bg-emerald-800/80 hover:bg-emerald-700/80' },
    'shieldBash': { color: 'text-slate-200', bgColor: 'bg-slate-600/80 hover:bg-slate-500/80' },
    'burningBlade': { color: 'text-rose-200', bgColor: 'bg-rose-700/80 hover:bg-rose-600/80' },
    'shadow_cloak': { color: 'text-slate-300', bgColor: 'bg-slate-800/80 hover:bg-slate-700/80' },
    'celestial_strike': { color: 'text-amber-200', bgColor: 'bg-amber-600/80 hover:bg-amber-500/80' },
    'vengeful_strike': { color: 'text-red-200', bgColor: 'bg-red-800/80 hover:bg-red-700/80' },
    'purifying_light': { color: 'text-yellow-200', bgColor: 'bg-yellow-600/80 hover:bg-yellow-500/80' },
}

const MoveButton = React.memo(({ move, executeMove, disabled, starPower, isSelected, t }: { move: FightMove, executeMove: (move: FightMove) => void, disabled: boolean, starPower: number, isSelected: boolean, t: (key: string, replacements?: any) => string }) => {
    const ability = ABILITIES[move] as Ability;
    if (!ability) return null;
    const Icon = MOVE_ICONS[move] || StarIcon;
    const { color, bgColor } = MOVE_COLORS[move] || { color: 'text-white', bgColor: 'bg-gray-500'};
    const data = FIGHT_MOVE_DATA[move];
    const isCostDisabled = data.starPowerCost && starPower < data.starPowerCost;

    return (
        <div className="group relative">
            <button onClick={() => executeMove(move)} disabled={disabled || isCostDisabled} className={`relative flex flex-col items-center justify-center w-20 h-20 sm:w-24 sm:h-24 rounded-2xl ${bgColor} ${color} shadow-lg transform transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed enabled:hover:-translate-y-1 enabled:hover:shadow-xl ${isSelected ? 'ring-4 ring-offset-2 ring-offset-[var(--color-bg)] ring-[var(--color-accent)]' : ''}`}>
                <Icon className="w-8 h-8 sm:w-10 sm:h-10 mb-1" />
                <span className="text-xs sm:text-sm font-bold text-center leading-tight uppercase tracking-wider">{t(ability.name)}</span>
                 {data.starPowerCost && <div className={`absolute top-1 right-1 flex items-center text-xs font-bold bg-black/50 px-1 rounded-full ${move === 'sunfire' ? 'text-orange-300' : 'text-amber-300'}`}><StarIcon className="w-3 h-3 mr-0.5"/>{data.starPowerCost}</div>}
            </button>
            <div className="absolute bottom-full mb-2 w-48 p-3 text-sm bg-slate-800 border border-slate-600 text-white rounded-lg shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all pointer-events-none z-20">
                <h4 className="font-bold text-md text-purple-300">{t(ability.name)}</h4>
                <p className="text-gray-300 mt-1">{t(ability.description)}</p>
            </div>
        </div>
    )
});
MoveButton.displayName = "MoveButton";

const StunVFX = React.memo(() => (
    <>
        <div className="vfx-dizzy-icon" style={{ animationDelay: '0s' }}>💫</div>
        <div className="vfx-dizzy-icon" style={{ animationDelay: '0.4s' }}>💫</div>
        <div className="vfx-dizzy-icon" style={{ animationDelay: '0.8s' }}>💫</div>
    </>
));
StunVFX.displayName = "StunVFX";

const ShieldVFX = React.memo(({ isBreaking }: { isBreaking: boolean }) => (
    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="relative w-full h-full">
            <div className={`vfx-shield-rock ${isBreaking ? 'break' : ''}`} style={{ top: '30%', left: '10%', transform: 'rotate(-15deg)', '--r': '-45deg', '--tx': '-50px', '--ty': '-30px' } as React.CSSProperties} />
            <div className={`vfx-shield-rock ${isBreaking ? 'break' : ''}`} style={{ top: '20%', left: '60%', transform: 'rotate(25deg)', '--r': '30deg', '--tx': '40px', '--ty': '-20px', animationDelay: isBreaking ? '0' : '0.05s' } as React.CSSProperties} />
            <div className={`vfx-shield-rock ${isBreaking ? 'break' : ''}`} style={{ top: '50%', left: '35%', transform: 'rotate(5deg)', '--r': '10deg', '--tx': '10px', '--ty': '50px', animationDelay: isBreaking ? '0' : '0.1s' } as React.CSSProperties}/>
        </div>
    </div>
));
ShieldVFX.displayName = "ShieldVFX";

const WardVFX = React.memo(({ isBreaking }: { isBreaking: boolean }) => (
    <div className={`vfx-ward-shield ${isBreaking ? 'break' : ''}`}></div>
));
WardVFX.displayName = 'WardVFX';

const RootSnareVFX = React.memo(() => (
    <div className="vfx-root-snare-container">
        <div className="vfx-root" style={{ left: '20%', transform: 'rotate(-15deg)', animationDelay: '0s' }} />
        <div className="vfx-root" style={{ left: '50%', transform: 'rotate(5deg)', animationDelay: '0.1s' }} />
        <div className="vfx-root" style={{ left: '80%', transform: 'rotate(20deg)', animationDelay: '0.05s' }} />
    </div>
));
RootSnareVFX.displayName = 'RootSnareVFX';

const HealTextVFX = React.memo(({ texts }: { texts: { id: number, amount: number }[] }) => (
    <>
        {texts.map(text => (
            <div key={text.id} className="heal-text-vfx">
                +{text.amount}
            </div>
        ))}
    </>
));
HealTextVFX.displayName = "HealTextVFX";

const FloatingDamageTextVFX = React.memo(({ texts }: { texts: { id: number, text: string, color: string, x: string, y: string }[] }) => (
    <>
        {texts.map(text => (
            <div key={text.id} className="vfx-damage-text" style={{ color: text.color, top: text.y, left: text.x }}>
                {text.text}
            </div>
        ))}
    </>
));
FloatingDamageTextVFX.displayName = "FloatingDamageTextVFX";

const BurningVFX = React.memo(() => (
    <div className="vfx-burning-container">
        {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="vfx-burning-ember" style={{
                animationDelay: `${i * 0.3}s`,
                '--tx': `${(Math.random() - 0.5) * 40}px`
            } as React.CSSProperties} />
        ))}
    </div>
));
BurningVFX.displayName = "BurningVFX";

export const FightGameScreen: React.FC<FightGameScreenProps> = ({ enemy, playerState, setPlayerState, onComplete, isPaused, onOpenAbilities, t, gameStats }) => {
    const { name: enemyNameKey, isBoss } = enemy;
    const enemyName = t(enemyNameKey);
    
    let archetype = enemy.archetype || 'balanced';
    if (isBoss && enemy.name === "bosses.keyas_shadow.name") {
        if (playerState.alignment <= -40)      archetype = 'fighter';
        else if (playerState.alignment >= 40) archetype = 'dancer';
        else                                   archetype = 'balanced';
    }

    const hasPowerBoon = useMemo(() => playerState.abilities.includes('boon_power_1'), [playerState.abilities]);
    const powerBoonBonus = hasPowerBoon ? 5 : 0;

    const { difficultyMultiplier, maxEnemyHealth, dodgeSequenceLength, dodgeTime, enemyDamage, turnTime } = useMemo(() => {
        const floor = playerState.currentFloor;
        const isGuardian = !!enemy.isGuardian;
        
        const difficultySettings = {
            Normal: { hp: 0.9, dmg: 0.9, seq: 0, time: 1.1 },
            Hard: { hp: 1.1, dmg: 1.05, seq: 1, time: 0.95 },
            Requiem: { hp: 1.3, dmg: 1.2, seq: 1, time: 0.95 },
        }[gameStats.difficulty];

        const mult = 1 + (isBoss ? 0.5 : (isGuardian ? 0.25 : 0));
        let healthMod = 1.0, seqMod = 0, timeMod = 1.0, dmgMod = 1.0;

        if (archetype === 'fighter') {
            healthMod = 1.25; seqMod = 1; timeMod = 0.8; dmgMod = 1.2;
        } else if (archetype === 'dancer') {
            healthMod = 0.8; seqMod = -1; timeMod = 1.25; dmgMod = 0.8;
        }

        return {
            difficultyMultiplier: mult,
            maxEnemyHealth: Math.round(((isBoss ? 350 : (isGuardian ? 140 : 80)) + playerState.abilities.length * 4 + floor * 15) * healthMod * difficultySettings.hp),
            dodgeSequenceLength: Math.min(8, (isBoss ? 6 : (isGuardian ? 4 : 3)) + seqMod + Math.floor(floor / 2) + difficultySettings.seq),
            dodgeTime: Math.max(1500, ((isBoss ? 2500 : (isGuardian ? 3500 : 4000)) * timeMod - floor * 100) * difficultySettings.time),
            enemyDamage: Math.round(((isBoss ? 25 : (isGuardian ? 18 : 12)) * mult * dmgMod + floor * 2) * difficultySettings.dmg),
            turnTime: 10000,
        }
    }, [isBoss, enemy.isGuardian, playerState.abilities.length, playerState.currentFloor, archetype, gameStats.difficulty]);
    
    const [phase, setPhase] = useState<GamePhase>('PLAYER_TURN');
    const [playerHealth, setPlayerHealth] = useState(playerState.health);
    const [enemyHealth, setEnemyHealth] = useState(maxEnemyHealth);
    const [feedbackQueue, setFeedbackQueue] = useState<string[]>([]);
    const [currentMessage, setCurrentMessage] = useState(t('ui.fightGame.chooseMove'));
    const [isKeyaHit, setIsKeyaHit] = useState(false);
    const [isEnemyHit, setIsEnemyHit] = useState(false);
    const [isEnemyDodging, setIsEnemyDodging] = useState(false);
    
    const [isShielded, setIsShielded] = useState(false);
    const [isWarded, setIsWarded] = useState(false);
    const [isAttackFocused, setIsAttackFocused] = useState(false);
    const [isEnemyStunned, setIsEnemyStunned] = useState(false);
    const [mirageTurns, setMirageTurns] = useState(0);
    const [dissipatingMirage, setDissipatingMirage] = useState<number | null>(null);
    const [isEnemySnared, setIsEnemySnared] = useState(false);
    const [enemyBurningTurns, setEnemyBurningTurns] = useState(0);
    const [isShadowCloaked, setIsShadowCloaked] = useState(false);
    const [vfx, setVfx] = useState<{ type: FightMove | 'gale' | 'sunfire_effect' | 'lifeSap' | 'thornBurst' | 'celestial_strike_full' | 'vengeful_strike_fx', key: number, healthPercent?: number } | null>(null);
    const [powerHitVfxKey, setPowerHitVfxKey] = useState(0);
    const [enemyGashKey, setEnemyGashKey] = useState(0);
    const [shieldBreaking, setShieldBreaking] = useState(false);
    const [isWardBreaking, setIsWardBreaking] = useState(false);
    const [lifeSapParticles, setLifeSapParticles] = useState<{ id: number }[]>([]);
    const [floatingHealTexts, setFloatingHealTexts] = useState<{ id: number; amount: number }[]>([]);
    const [floatingDamageTexts, setFloatingDamageTexts] = useState<{ id: number; text: string; color: string; x: string; y: string; }[]>([]);
    const [isPlayerLunging, setIsPlayerLunging] = useState(false);
    const [shieldBashFlashKey, setShieldBashFlashKey] = useState(0);
    const [isWeaponOnFire, setIsWeaponOnFire] = useState(false);
    const [isVengefulAuraActive, setIsVengefulAuraActive] = useState(false);
    const [isShadowCloakVisual, setIsShadowCloakVisual] = useState(false);
    const [shadowCloakDodge, setShadowCloakDodge] = useState(false);
    const [purifyingLightVfx, setPurifyingLightVfx] = useState<{ stage: 'charge' | 'wave' | 'off', key: number }>({ stage: 'off', key: 0 });
    const [isEnemySizzling, setIsEnemySizzling] = useState(false);
    const [healParticles, setHealParticles] = useState<{ id: number }[]>([]);


    const [turnTimerKey, setTurnTimerKey] = useState(0);
    
    const [selectedAbilityIndex, setSelectedAbilityIndex] = useState(0);

    const [activeMinigame, setActiveMinigame] = useState<FightMove | null>(null);
    const [vineLashState, setVineLashState] = useState({ active: false, size: 100 });
    const [dodgeState, setDodgeState] = useState<{ active: boolean; sequence: Direction[]; currentIndex: number; key: number; }>({ active: false, sequence: [], currentIndex: 0, key: Date.now() });
    const dodgeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const { attackMoves, defenseMoves, utilityMoves, allMoves } = useMemo(() => {
        const fightAbilities = playerState.abilities.filter(id => ABILITIES[id]?.type === 'fight') as FightMove[];
        const attackIds = new Set<FightMove>(['vine', 'sunfire', 'lifeSap', 'thornBurst', 'shieldBash', 'burningBlade', 'celestial_strike', 'vengeful_strike', 'purifying_light']);
        const defenseIds = new Set<FightMove>(['stone', 'ward', 'mirage', 'shadow_cloak']);
        
        const attackMoves = fightAbilities.filter(id => attackIds.has(id));
        const defenseMoves = fightAbilities.filter(id => defenseIds.has(id));
        const utilityMoves = fightAbilities.filter(id => !attackIds.has(id) && !defenseIds.has(id));
        
        return { attackMoves, defenseMoves, utilityMoves, allMoves: [...attackMoves, ...defenseMoves, ...utilityMoves] };
    }, [playerState.abilities]);
    
    const nextPhaseRef = useRef<GamePhase | null>(null);

    const canCombatHeal = useMemo(() => 
        playerState.abilities.includes('boon_combat_medic_1') && 
        playerState.starPower >= 5 && 
        playerHealth < playerState.maxHealth,
    [playerState.abilities, playerState.starPower, playerHealth, playerState.maxHealth]);

    const handleCombatHeal = useCallback(() => {
        if (!canCombatHeal || isPaused || phase === 'GAMEOVER') return;
        setPlayerState(p => {
            if (!p) return null;
            const healthGain = 6 + Math.floor(Math.random() * 2);
            const newHealth = Math.min(p.maxHealth, p.health + healthGain);
            setPlayerHealth(newHealth); // Update local state immediately for UI responsiveness
            return { ...p, health: newHealth, starPower: p.starPower - 5 };
        });
        audioService.playSfx('heal');
    }, [canCombatHeal, isPaused, phase, setPlayerState]);

    const processFeedback = useCallback((messages: string | string[]) => {
        const newMessages = Array.isArray(messages) ? messages : [messages];
        setFeedbackQueue(q => [...q, ...newMessages]);
        setPhase('FEEDBACK');
    }, []);
    
    const handleNextMessage = useCallback(() => {
        if (feedbackQueue.length > 0) {
            setCurrentMessage(feedbackQueue[0]);
            setFeedbackQueue(q => q.slice(1));
        } else {
            setPhase(nextPhaseRef.current ?? 'PLAYER_TURN');
            if (nextPhaseRef.current === 'PLAYER_TURN') {
                 setCurrentMessage(t('ui.fightGame.chooseMove'));
                 setSelectedAbilityIndex(0);
                 setTurnTimerKey(k => k + 1);
            }
            nextPhaseRef.current = null;
        }
    }, [feedbackQueue, t]);

    useEffect(() => {
        if (phase === 'FEEDBACK') {
            handleNextMessage();
        }
    }, [phase, handleNextMessage]);

    useEffect(() => {
        // Sync local health changes back to the global player state
        if (playerState.health !== playerHealth) {
            setPlayerState(p => p ? { ...p, health: playerHealth } : null);
        }
    }, [playerHealth, playerState.health, setPlayerState]);

    const triggerMissEffect = useCallback(() => {
        setIsEnemyDodging(true);
        setTimeout(() => setIsEnemyDodging(false), 300);
        audioService.playSfx('miss');
    }, []);

    const triggerHitFlash = useCallback((character: 'keya' | 'enemy') => {
        const setter = character === 'keya' ? setIsKeyaHit : setIsEnemyHit;
        audioService.playSfx(character === 'keya' ? 'playerHit' : 'enemyHit');
        if (character === 'enemy' && hasPowerBoon) {
            audioService.playSfx('power_hit');
            setPowerHitVfxKey(Date.now());
        }
        setter(true);
        setTimeout(() => setter(false), 200);
    }, [hasPowerBoon]);

    const endPlayerTurn = useCallback((precedingFeedback: string[] = []) => {
        setActiveMinigame(null);
        let turnFeedback: string[] = [...precedingFeedback];

        if(mirageTurns > 0) setMirageTurns(t => t-1);
        if (enemyBurningTurns > 0) {
            const data = FIGHT_MOVE_DATA.burningBlade;
            const burnDamage = data.dot!.damage;
            setEnemyHealth(h => Math.max(0, h - burnDamage));
            const newTurns = enemyBurningTurns - 1;
            setEnemyBurningTurns(newTurns);
            if (newTurns === 0) {
                audioService.stopLoopingSfx('burning_sustain');
            }
            triggerHitFlash('enemy');
            turnFeedback.push(t('ui.fightGame.enemyAblaze', { enemyName }) + ` (-${burnDamage})`);
        }
        
        if (isEnemyStunned) {
            nextPhaseRef.current = 'PLAYER_TURN';
            turnFeedback.push(t('ui.fightGame.galePushStun', { enemyName }));
            setIsEnemyStunned(false);
        } else {
            nextPhaseRef.current = 'ENEMY_TURN';
        }

        processFeedback(turnFeedback);
    }, [isEnemyStunned, enemyName, mirageTurns, enemyBurningTurns, processFeedback, triggerHitFlash, t]);

    const handleFlee = useCallback(() => {
        if (phase !== 'PLAYER_TURN' || isBoss || enemy.isGuardian) return;
        setPhase('GAMEOVER'); // Visually disable controls
        
        setTimeout(() => {
            const fleeChance = { Normal: 0.5, Hard: 0.35, Requiem: 0.2 }[gameStats.difficulty];
            const fleeSuccess = Math.random() < fleeChance;
            if (fleeSuccess) {
                onComplete('fight', false, true);
            } else {
                nextPhaseRef.current = 'ENEMY_TURN';
                processFeedback([t('ui.fightGame.fleeFail')]);
            }
        }, 1000);
    }, [phase, isBoss, enemy.isGuardian, gameStats.difficulty, onComplete, processFeedback, t]);

    const executeMove = useCallback((move: FightMove) => {
        if (phase !== 'PLAYER_TURN') return;
        
        if (move !== 'stone' && move !== 'purifying_light') setVfx({ type: move, key: Date.now() });
        setPhase('GAMEOVER');
        
        setIsShielded(false);
        const data = FIGHT_MOVE_DATA[move];

        switch(move) {
            case 'vine':
                audioService.playSfx('vine');
                setPhase('MINIGAME');
                setActiveMinigame('vine');
                setCurrentMessage(t('ui.fightGame.timeAttack'));
                setVineLashState({ active: true, size: 100 });
                break;
            case 'stone': audioService.playSfx('stone_form'); endPlayerTurn(['A rocky shield forms around you.']); setIsShielded(true); break;
            case 'ward': audioService.playSfx('ward_form'); endPlayerTurn(['An earthen ward glows softly.']); setIsWarded(true); break;
            case 'focus': 
                audioService.playSfx('focus_activate');
                audioService.startLoopingSfx('focus_sustain');
                endPlayerTurn(['You gather your power, focusing...']); 
                setIsAttackFocused(true); 
                break;
            case 'gale':
                 audioService.playSfx('gale');
                 setVfx({ type: 'gale', key: Date.now() });
                 if (Math.random() < (data.stunChance! / difficultyMultiplier)) { 
                    setIsEnemyStunned(true); 
                    audioService.playSfx('gale_stun');
                    endPlayerTurn(['A powerful gale knocks the enemy back!', `${enemyName} is stunned!`]); 
                }
                 else { triggerMissEffect(); endPlayerTurn(['A gust of wind misses the enemy.']); }
                break;
            case 'rootSnare': audioService.playSfx('rootSnare'); endPlayerTurn([`${enemyName} is snared by grasping roots!`]); setIsEnemySnared(true); break;
            case 'mirage': audioService.playSfx('mirage'); endPlayerTurn(['Illusory copies dance around you.']); setMirageTurns(2); break;
            case 'sunfire': {
                if (playerState.starPower < data.starPowerCost!) { processFeedback([t('ui.fightGame.notEnoughStarPower')]); setPhase('PLAYER_TURN'); return; }
                setPlayerState(p => ({...p!, starPower: p!.starPower - data.starPowerCost!}));
                setVfx({ type: 'sunfire_effect', key: Date.now() });
                audioService.playSfx('sunfire_charge');
                
                setTimeout(() => {
                    audioService.playSfx('sunfire_fire');
                    let damage = (data.baseDamage! + Math.floor(Math.random() * (data.damageRange! + 1))) + powerBoonBonus;
                    const feedbackMessages = ['A miniature sun erupts!'];
                    if (isAttackFocused) {
                        damage *= 2.0;
                        feedbackMessages.push(t('ui.fightGame.focusedPower'));
                        setIsAttackFocused(false);
                        audioService.stopLoopingSfx('focus_sustain');
                    }
                    setEnemyHealth(h => Math.max(0, h - damage));
                    triggerHitFlash('enemy');
                    feedbackMessages.push(t('ui.fightGame.sunfireDamage', {damage: Math.round(damage)}));
                    endPlayerTurn(feedbackMessages);
                }, 700);
                return;
            }
            case 'lifeSap': {
                audioService.playSfx('lifeSap_impact');
                setVfx({ type: 'lifeSap', key: Date.now() });
                setTimeout(() => {
                    if (Math.random() < 0.1) {
                        triggerMissEffect();
                        endPlayerTurn([t('ui.fightGame.miss')]);
                        return;
                    }
                    audioService.playSfx('lifeSap_drain');
                    let damage = (data.baseDamage! + Math.floor(Math.random() * (data.damageRange! + 1))) + powerBoonBonus;
                    const feedbackMessages = ['A cursed thorn drains the enemy!'];
                    if (isAttackFocused) {
                        damage *= 2.0;
                        feedbackMessages.push(t('ui.fightGame.focusedPower'));
                        setIsAttackFocused(false);
                        audioService.stopLoopingSfx('focus_sustain');
                    }
                    const healthStolen = Math.floor(damage * data.lifestealFactor!);
                    setEnemyHealth(h => Math.max(0, h - damage));
                    triggerHitFlash('enemy');
                    
                    setPlayerHealth(h => {
                        const newHealth = Math.min(playerState.maxHealth, h + healthStolen);
                        if (newHealth > h) {
                            const healId = performance.now();
                            setFloatingHealTexts(texts => [...texts, { id: healId, amount: healthStolen }]);
                            setTimeout(() => setFloatingHealTexts(texts => texts.filter(t => t.id !== healId)), 1500);
                        }
                        return newHealth;
                    });

                    const newParticles = Array.from({ length: 10 }).map(() => ({ id: performance.now() + Math.random() }));
                    setLifeSapParticles(p => [...p, ...newParticles]);
                    setTimeout(() => setLifeSapParticles(p => p.filter(particle => !newParticles.find(np => np.id === particle.id))), 1200);

                    feedbackMessages.push(t('ui.fightGame.lifeSap', {damage: Math.round(damage), health: healthStolen}));
                    endPlayerTurn(feedbackMessages);
                }, 400); // Wait for thorn to travel
                break;
            }
            case 'thornBurst': {
                audioService.playSfx('thornBurst');
                setVfx({ type: 'thornBurst', key: Date.now() });
                const numThorns = data.hits!.min + Math.floor(Math.random() * (data.hits!.max - data.hits!.min + 1));
                let totalDamage = 0;
                const feedbackMessages = [t('ui.fightGame.thornBurst')];
                for (let i = 0; i < numThorns; i++) {
                    setTimeout(() => {
                        let thornDamage = (data.hits!.baseDamagePerHit + Math.floor(Math.random() * (data.hits!.damageRangePerHit + 1))) + powerBoonBonus;
                        if (isAttackFocused) {
                            thornDamage *= 2.0;
                        }
                        totalDamage += thornDamage;
                        setEnemyHealth(h => Math.max(0, h - thornDamage));
                        triggerHitFlash('enemy');
                        
                        const textId = performance.now() + i;
                        setFloatingDamageTexts(texts => [...texts, {
                            id: textId,
                            text: `${Math.round(thornDamage)}`,
                            color: '#a3e635', // lime-400
                            x: `${60 + Math.random() * 10}%`,
                            y: `${30 + Math.random() * 20}%`,
                        }]);
                        setTimeout(() => setFloatingDamageTexts(texts => texts.filter(t => t.id !== textId)), 1500);

                        if (i === numThorns - 1) {
                             if (isAttackFocused) {
                                 feedbackMessages.push(t('ui.fightGame.focusedPower'));
                                 setIsAttackFocused(false);
                                 audioService.stopLoopingSfx('focus_sustain');
                             }
                             feedbackMessages.push(t('ui.fightGame.thornBurstTotal', {count: numThorns, totalDamage: Math.round(totalDamage)}));
                             endPlayerTurn(feedbackMessages);
                        }
                    }, i * 100);
                }
                break;
            }
            case 'shieldBash': {
                setIsPlayerLunging(true);
                setTimeout(() => setIsPlayerLunging(false), 300);
                
                setTimeout(() => {
                    audioService.playSfx('shieldBash_hit');
                    setShieldBashFlashKey(Date.now());
                    let damage = (data.baseDamage! + Math.floor(Math.random() * (data.damageRange! + 1))) + powerBoonBonus;
                    const feedbackMessages = [];
                    if (isAttackFocused) {
                        damage *= 2.0;
                        feedbackMessages.push(t('ui.fightGame.focusedPower'));
                        setIsAttackFocused(false);
                        audioService.stopLoopingSfx('focus_sustain');
                    }
                    setEnemyHealth(h => Math.max(0, h - damage));
                    triggerHitFlash('enemy');
                    feedbackMessages.push(t('ui.fightGame.shieldBashHit', {damage: Math.round(damage)}));
                    if (Math.random() < (data.stunChance! / difficultyMultiplier)) {
                        setIsEnemyStunned(true);
                        audioService.playSfx('shieldBash_stun');
                        feedbackMessages.push(t('ui.fightGame.galePushStun', {enemyName}));
                    } else {
                        feedbackMessages.push(t('ui.fightGame.shieldBashResist'));
                    }
                    endPlayerTurn(feedbackMessages);
                }, 150);
                break;
            }
            case 'burningBlade': {
                setIsWeaponOnFire(true);
                setTimeout(() => setIsWeaponOnFire(false), 500);
                audioService.playSfx('burningBlade_ignite');
                setTimeout(() => {
                    audioService.playSfx('burningBlade');
                    let damage = (data.baseDamage! + Math.floor(Math.random() * (data.damageRange! + 1))) + powerBoonBonus;
                    const feedbackMessages = [];
                    if (isAttackFocused) {
                        damage *= 2.0;
                        feedbackMessages.push(t('ui.fightGame.focusedPower'));
                        setIsAttackFocused(false);
                        audioService.stopLoopingSfx('focus_sustain');
                    }
                    setEnemyHealth(h => Math.max(0, h - damage));
                    triggerHitFlash('enemy');
                    setEnemyBurningTurns(data.dot!.turns);
                    audioService.startLoopingSfx('burning_sustain');
                    feedbackMessages.push(t('ui.fightGame.burningBladeHit', {damage: Math.round(damage)}), t('ui.fightGame.enemyAblaze', {enemyName}));
                    endPlayerTurn(feedbackMessages);
                }, 200);
                break;
            }
            case 'shadow_cloak':
                audioService.playSfx('shadow_cloak_activate');
                setIsShadowCloaked(true);
                setIsShadowCloakVisual(true);
                endPlayerTurn([t('ui.fightGame.shadowCloak')]);
                break;
            case 'celestial_strike': {
                if (playerState.starPower < data.starPowerCost!) { processFeedback([t('ui.fightGame.notEnoughStarPower')]); setPhase('PLAYER_TURN'); return; }
                audioService.playSfx('celestial_strike_summon');
                setPlayerState(p => ({...p!, starPower: p!.starPower - data.starPowerCost!}));
                setVfx({ type: 'celestial_strike_full', key: Date.now() });
                setTimeout(() => {
                    audioService.playSfx('celestial_strike_impact');
                    let damage = (data.baseDamage! + Math.floor(Math.random() * (data.damageRange! + 1))) + powerBoonBonus;
                    const feedbackMessages = [];
                    if (isAttackFocused) {
                        damage *= 2.0;
                        feedbackMessages.push(t('ui.fightGame.focusedPower'));
                        setIsAttackFocused(false);
                        audioService.stopLoopingSfx('focus_sustain');
                    }
                    setEnemyHealth(h => Math.max(0, h - damage));
                    triggerHitFlash('enemy');
                    feedbackMessages.push(t('ui.fightGame.celestialStrike', {damage: Math.round(damage)}));
                    if (Math.random() < data.stunChance!) {
                        setIsEnemyStunned(true);
                        feedbackMessages.push(t('ui.fightGame.galePushStun', {enemyName}));
                    }
                    endPlayerTurn(feedbackMessages);
                }, 800);
                break;
            }
            case 'vengeful_strike': {
                const healthPercent = playerHealth / playerState.maxHealth;
                if (healthPercent < 0.5) { setIsVengefulAuraActive(true); }
                audioService.playSfx('vengeful_strike_hit', { healthPercent });
                setVfx({ type: 'vengeful_strike_fx', key: Date.now(), healthPercent });

                setTimeout(() => {
                    const missingHealth = playerState.maxHealth - playerHealth;
                    let damage = data.baseDamage! + Math.floor(missingHealth * data.scaling!.factor) + powerBoonBonus;
                    const feedbackMessages = [];
                    if (isAttackFocused) {
                        damage *= 2.0;
                        feedbackMessages.push(t('ui.fightGame.focusedPower'));
                        setIsAttackFocused(false);
                        audioService.stopLoopingSfx('focus_sustain');
                    }
                    setEnemyHealth(h => Math.max(0, h - damage));
                    triggerHitFlash('enemy');
                    feedbackMessages.push(t('ui.fightGame.vengefulStrike', { damage: Math.round(damage) }));
                    endPlayerTurn(feedbackMessages);
                    setIsVengefulAuraActive(false);
                }, 200);
                break;
            }
            case 'purifying_light': {
                audioService.playSfx('purifying_light_charge');
                setPurifyingLightVfx({ stage: 'charge', key: Date.now() });
        
                setTimeout(() => {
                    audioService.playSfx('purifying_light_impact');
                    setPurifyingLightVfx(vfx => ({ ...vfx, stage: 'wave' }));
                    
                    const isDark = enemy.category === data.specialBonus!.category || enemy.seed === 'KeyasShadow';
                    if (isDark) {
                        setIsEnemySizzling(true);
                        setTimeout(() => setIsEnemySizzling(false), 800);
                    }
        
                    let damage = (data.baseDamage! + Math.floor(Math.random() * (data.damageRange! + 1))) + powerBoonBonus;
                    if (isDark) {
                        damage *= data.specialBonus!.multiplier;
                    }
                    const healthGain = data.heal!;
                    const feedbackMessages = [];
                    if (isAttackFocused) {
                        damage *= 2.0;
                        feedbackMessages.push(t('ui.fightGame.focusedPower'));
                        setIsAttackFocused(false);
                        audioService.stopLoopingSfx('focus_sustain');
                    }
                    setEnemyHealth(h => Math.max(0, h - damage));
                    triggerHitFlash('enemy');
                    setPlayerHealth(h => Math.min(playerState.maxHealth, h + healthGain));
                    
                    setTimeout(() => {
                        const newParticles = Array.from({ length: 15 }).map(() => ({ id: performance.now() + Math.random() }));
                        setHealParticles(p => [...p, ...newParticles]);
                        setTimeout(() => setHealParticles(p => p.filter(particle => !newParticles.find(np => np.id === particle.id))), 1000);
                    }, 200);
        
                    feedbackMessages.push(t('ui.fightGame.purifyingLight', { damage: Math.round(damage), health: healthGain }));
                    endPlayerTurn(feedbackMessages);
        
                    setTimeout(() => {
                        setPurifyingLightVfx({ stage: 'off', key: 0 });
                    }, 800);
        
                }, 600);
                break;
            }
        }
    }, [phase, playerState, difficultyMultiplier, endPlayerTurn, processFeedback, setPlayerState, enemyName, triggerHitFlash, triggerMissEffect, t, powerBoonBonus, playerHealth, isAttackFocused]);
    
    useEffect(() => {
        if (!vineLashState.active) return;
        const interval = setInterval(() => {
            if (isPaused) return;
            setVineLashState(s => ({ ...s, size: s.size > 10 ? s.size - 2.5 * difficultyMultiplier : 100 }));
        }, 20);
        return () => clearInterval(interval);
    }, [vineLashState.active, difficultyMultiplier, isPaused]);

    const handleVineLashClick = () => {
        if (!vineLashState.active) return;
        setVineLashState({ active: false, size: 100 });
        const { size } = vineLashState;
        let damage = 0;
        let feedback: string[] = [];
        const data = FIGHT_MOVE_DATA.vine.damageTiers!;
        
        const isCrit = size < 35 && size > 15;

        if (isCrit) {
            damage = data.crit + powerBoonBonus;
            feedback.push(t('ui.fightGame.criticalHit'));
            audioService.playSfx('vine_crit');
            setEnemyGashKey(Date.now());
            setTimeout(() => setEnemyGashKey(0), 800);
        } else if (size > 90) {
            damage = data.miss;
            feedback.push(t('ui.fightGame.miss'));
            triggerMissEffect();
        } else if (size < 45) {
            damage = data.perfect + powerBoonBonus;
            feedback.push(t('ui.fightGame.perfectStrike'));
        } else if (size < 70) {
            damage = data.good + powerBoonBonus;
            feedback.push(t('ui.fightGame.goodHit'));
        } else {
            damage = data.weak + powerBoonBonus;
            feedback.push(t('ui.fightGame.weakHit'));
        }

        if (damage > 0) {
            if (isAttackFocused) { 
                damage *= 2.0; 
                feedback.push(t('ui.fightGame.focusedPower')); 
                setIsAttackFocused(false);
                audioService.stopLoopingSfx('focus_sustain');
            }
            feedback.push(t('ui.fightGame.dealtDamage', {damage: Math.round(damage)}));
            setEnemyHealth(h => Math.max(0, h - damage));
            triggerHitFlash('enemy');
        }

        endPlayerTurn(feedback);
    };
    
    const onDodgeFail = useCallback(() => {
        setDodgeState(d => ({...d, active: false}));
        
        let damage = enemyDamage;
        const feedback = [t('ui.fightGame.dodgeFail')];

        if (isShadowCloaked) {
            damage = 0;
            feedback.push(t('ui.fightGame.shadowCloakDodge'));
            setIsShadowCloaked(false);
            setIsShadowCloakVisual(false);
            audioService.playSfx('shadow_cloak_dodge');
            setShadowCloakDodge(true);
            setTimeout(() => setShadowCloakDodge(false), 300);
        } else if (isShielded) { 
            damage = 0;
            feedback.push(t('ui.fightGame.shieldBlocks'));
            audioService.playSfx('stone_break');
            setShieldBreaking(true);
            setTimeout(() => setShieldBreaking(false), 500);
            setIsShielded(false);
        } else if(isWarded) { 
            damage = Math.round(damage/2);
            feedback.push(t('ui.fightGame.wardSoftens'));
            setIsWarded(false);
            setIsWardBreaking(true);
            audioService.playSfx('ward_break');
            setTimeout(() => setIsWardBreaking(false), 300);
        } else if (mirageTurns > 0) {
            damage = 0;
            feedback.push(t('ui.fightGame.mirageHit'));
            setDissipatingMirage(mirageTurns);
            setTimeout(() => setDissipatingMirage(null), 400); // match animation
            setMirageTurns(t => t - 1);
            audioService.playSfx('mirage_shatter');
        }

        if (damage > 0) {
            setPlayerHealth(h => Math.max(0, h - damage));
            triggerHitFlash('keya');
            feedback.push(t('ui.fightGame.tookDamage', {damage}));
        } else if (!isShielded) { audioService.playSfx('block'); }
        
        nextPhaseRef.current = 'PLAYER_TURN';
        processFeedback(feedback);
        setIsEnemySnared(false);
    }, [enemyDamage, isShielded, isWarded, mirageTurns, isShadowCloaked, triggerHitFlash, processFeedback, t]);
    
    useEffect(() => {
        let enemyAttackTimeout: ReturnType<typeof setTimeout> | null = null;
    
        if (phase === 'ENEMY_TURN') {
            setCurrentMessage(t('ui.fightGame.enemyAttacks', { enemyName }));
            enemyAttackTimeout = setTimeout(() => {
                setPhase('PLAYER_DODGE');
            }, 1500);
        } else if (phase === 'PLAYER_DODGE') {
            setCurrentMessage(t('ui.fightGame.dodge'));
            let sequenceLength = dodgeSequenceLength;
            if (isEnemySnared) sequenceLength = Math.max(2, sequenceLength - 1);
            
            const newSequence = Array.from({ length: sequenceLength }, () => DIRECTIONS[Math.floor(Math.random() * 4)]);
            setDodgeState({ active: true, sequence: newSequence, currentIndex: 0, key: Date.now() });
    
            const timerDuration = isEnemySnared ? dodgeTime * 1.5 : dodgeTime;
            
            dodgeTimerRef.current = setTimeout(onDodgeFail, timerDuration);
        }
    
        return () => {
            if (enemyAttackTimeout) clearTimeout(enemyAttackTimeout);
            if (dodgeTimerRef.current) {
                clearTimeout(dodgeTimerRef.current);
                dodgeTimerRef.current = null;
            }
        };
    }, [phase, enemyName, dodgeSequenceLength, isEnemySnared, dodgeTime, onDodgeFail, t]);

    const handleDodgeInput = useCallback((key: Direction) => {
        if (!dodgeState.active) return;
        setDodgeState(d => {
            if (key === d.sequence[d.currentIndex]) {
                audioService.playNote(d.currentIndex);
                const nextIndex = d.currentIndex + 1;
                if (nextIndex >= d.sequence.length) {
                    if (dodgeTimerRef.current) clearTimeout(dodgeTimerRef.current);
                    nextPhaseRef.current = 'PLAYER_TURN';
                    audioService.playSfx('dodge');
                    processFeedback([t('ui.fightGame.dodgeSuccess')]);
                    setIsWarded(false);
                    return { ...d, active: false };
                }
                return { ...d, currentIndex: nextIndex };
            } else {
                if (dodgeTimerRef.current) clearTimeout(dodgeTimerRef.current);
                onDodgeFail();
                return { ...d, active: false };
            }
        });
    }, [dodgeState, onDodgeFail, processFeedback, t]);
    
    useEffect(() => {
        if (enemyHealth <= 0 || playerHealth <= 0) {
            audioService.stopLoopingSfx('burning_sustain');
            audioService.stopLoopingSfx('focus_sustain');
        }

        if (enemyHealth <= 0) { setPhase('GAMEOVER'); setTimeout(() => onComplete('fight', true), 1500); }
        else if (playerHealth <= 0) {
            setPlayerState(p => p ? { ...p, health: 0 } : null);
            setPhase('GAMEOVER');
            setTimeout(() => onComplete('fight', false), 1500);
        }
    }, [enemyHealth, playerHealth, onComplete, setPlayerState]);

    const handleBaseKeyboardInput = useCallback((e: KeyboardEvent) => {
        if (isPaused || phase === 'GAMEOVER') return;
        
        const key = e.key.toLowerCase();
        
        if (key === 'f') {
            e.preventDefault();
            handleFlee();
            return;
        }

        if (phase === 'FEEDBACK') {
            if (key === 'enter' || key === ' ') {
                e.preventDefault();
                handleNextMessage();
            }
            return;
        }

        if (phase === 'PLAYER_TURN') {
            switch(key) {
                case 'arrowleft':
                case 'a':
                    setSelectedAbilityIndex(i => (i - 1 + allMoves.length) % allMoves.length);
                    break;
                case 'arrowright':
                case 'd':
                    setSelectedAbilityIndex(i => (i + 1) % allMoves.length);
                    break;
                case 'enter':
                case ' ':
                    e.preventDefault();
                    if(allMoves[selectedAbilityIndex]) {
                        executeMove(allMoves[selectedAbilityIndex]);
                    }
                    break;
            }
        } else if (phase === 'PLAYER_DODGE') {
            const directionMap: Record<string, Direction> = { arrowleft: 'left', a: 'left', arrowright: 'right', d: 'right', arrowup: 'up', w: 'up', arrowdown: 'down', s: 'down'};
            if (directionMap[key]) {
                e.preventDefault();
                handleDodgeInput(directionMap[key]);
            }
        } else if (phase === 'MINIGAME' && activeMinigame === 'vine') {
            if (key === 'enter' || key === ' ') {
                e.preventDefault();
                handleVineLashClick();
            }
        }

    }, [phase, allMoves, selectedAbilityIndex, executeMove, handleDodgeInput, activeMinigame, handleVineLashClick, handleNextMessage, isPaused, handleFlee]);

    useEffect(() => {
        const handleKeyboardInput = (e: KeyboardEvent) => {
            if (e.key.toLowerCase() === 'h') {
                handleCombatHeal();
            } else {
                handleBaseKeyboardInput(e);
            }
        }
        window.addEventListener('keydown', handleKeyboardInput);
        return () => window.removeEventListener('keydown', handleKeyboardInput);
    }, [handleBaseKeyboardInput, handleCombatHeal]);

    useEffect(() => {
        if(allMoves.length > 0 && selectedAbilityIndex >= allMoves.length) {
            setSelectedAbilityIndex(0);
        }
    }, [allMoves, selectedAbilityIndex]);
    
    const spriteSize = useMemo(() => enemy.sizeModifier ? 160 * enemy.sizeModifier : 160, [enemy.sizeModifier]);
    
    return (
        <div className="h-full flex flex-col items-center justify-between text-center p-1 sm:p-2 relative overflow-hidden">
             <VFXPlayer vfx={vfx} onComplete={() => setVfx(null)} />
             {purifyingLightVfx.stage === 'charge' && <div key={purifyingLightVfx.key} className="vfx-purify-charge-orb"></div>}
            {purifyingLightVfx.stage === 'wave' && <div key={purifyingLightVfx.key} className="vfx-purify-wave-expand"></div>}
            {healParticles.map(p => (
                <div key={p.id} className="vfx-heal-particle-return" style={{
                    '--from-x': `${(Math.random() - 0.5) * 100}vw`,
                    '--from-y': `${(Math.random() - 0.5) * 100}vh`,
                } as React.CSSProperties} />
            ))}
            <div className="fight-light-effect"></div>
            <div className="w-full flex items-center justify-between relative z-10">
                <button onClick={onOpenAbilities} className="absolute left-0 top-0 p-2 bg-black/20 hover:bg-black/40 rounded-full text-gray-300 hover:text-white transition-colors">
                    <BookOpenIcon className="w-7 h-7" />
                </button>
                <div className="w-1/4"></div>
                <h2 className="w-1/2 font-title text-3xl sm:text-4xl text-red-500 tracking-widest uppercase drop-shadow-lg">{isBoss ? t('ui.fightGame.boss') : t('ui.fightGame.fight')}</h2>
                <div className="w-1/4 flex justify-end">
                {phase === 'PLAYER_TURN' &&
                    <div className="w-32 progress-bar h-3 rounded-full border border-red-500/50 overflow-hidden">
                        <div 
                            key={turnTimerKey}
                            className="h-full bg-red-500 rounded-full dodge-timer-bar-animated"
                            style={{ 
                                animationDuration: `${turnTime / 1000}s`,
                                animationPlayState: isPaused ? 'paused' : 'running',
                            }}
                            onAnimationEnd={() => {
                                if (phase === 'PLAYER_TURN') {
                                    nextPhaseRef.current = 'ENEMY_TURN';
                                    processFeedback([t('ui.fightGame.turnTimeout'), t('ui.fightGame.enemyAttacks', { enemyName })]);
                                }
                            }}
                        ></div>
                    </div>
                }
                </div>
            </div>


            <div className="w-full flex justify-between items-start my-auto z-10 relative">
                 <div className={`w-1/3 flex flex-col items-center p-2 relative ${isPlayerLunging ? 'animate-player-lunge' : ''}`}>
                    <div className={`relative w-32 h-32 sm:w-40 sm:h-40 mb-2 ${isKeyaHit ? 'animate-flash' : ''} ${isShadowCloakVisual ? 'sprite-shadow-cloak' : ''} ${shadowCloakDodge ? 'animate-attack-pass-through' : ''}`}>
                        <Sprite seed="Keya" size={160} className="w-full h-full" alignment={playerState.alignment}/>
                        {isVengefulAuraActive && <div className="vfx-vengeful-aura"></div>}
                        {isShadowCloakVisual && Array.from({length: 3}).map((_, i) => <div key={i} className="vfx-shadow-wisp" style={{animationDelay: `${i * 0.5}s`}}/>)}
                        {isWeaponOnFire && <div className="vfx-weapon-fire"></div>}
                        {Array.from({ length: mirageTurns }).map((_, i) => (
                            <div key={i} className="mirage-duplicate" style={{ transform: `translateX(${(i % 2 === 0 ? -1 : 1) * 60}%) translateY(-10%) scale(0.9)` }}>
                                <Sprite seed="Keya" size={160} className="w-full h-full" alignment={playerState.alignment}/>
                            </div>
                        ))}
                        {dissipatingMirage !== null && (
                            <div key={`dissipating-${dissipatingMirage}`} className="mirage-duplicate dissipating" style={{ transform: `translateX(${(dissipatingMirage % 2 === 0 ? -1 : 1) * 60}%) translateY(-10%) scale(0.9)` }}>
                                <Sprite seed="Keya" size={160} className="w-full h-full" alignment={playerState.alignment}/>
                            </div>
                        )}
                        <HealTextVFX texts={floatingHealTexts} />
                        {(isShielded || shieldBreaking) && <ShieldVFX isBreaking={shieldBreaking} />}
                        {isWarded && <WardVFX isBreaking={isWardBreaking} />}
                        {isAttackFocused && <div className="vfx-focus-aura"></div>}
                    </div>
                    <HealthBar name={t('ui.fightGame.you')} value={playerHealth} maxValue={playerState.maxHealth} barClass="health-bar"/>
                    {playerState.abilities.includes('boon_combat_medic_1') && (
                        <button
                            onClick={handleCombatHeal}
                            disabled={!canCombatHeal}
                            title={t('ui.map.actionHeal')}
                            className={`mt-2 flex items-center justify-center font-bold text-sm bg-green-700/80 hover:bg-green-600/80 text-white py-1 px-3 rounded-full shadow-lg transition-all duration-200 enabled:hover:-translate-y-0.5 enabled:hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed ${canCombatHeal ? 'animate-pulse' : ''}`}
                        >
                            <HeartIcon className="w-4 h-4 mr-1" /> 5 <StarIcon className="w-3 h-3 ml-0.5" /> (H)
                        </button>
                    )}
                    <div className="flex items-center text-yellow-400 font-bold mt-2 text-lg">
                        <StarIcon className="w-6 h-6 mr-2 text-yellow-400" /> {playerState.starPower}
                    </div>
                </div>

                <div className="w-1/3 flex flex-col items-center p-2 pt-10">
                     {activeMinigame === 'vine' && (
                        <div className="flex flex-col items-center justify-center h-full">
                            <button onClick={handleVineLashClick} className="w-48 h-48 rounded-full border-4 border-dashed border-green-500 flex items-center justify-center bg-green-500/10">
                                <div className="absolute w-12 h-12 rounded-full bg-yellow-400/50 border-2 border-yellow-300"></div>
                                <div className="rounded-full bg-gradient-to-br from-green-500 to-lime-400 shadow-xl transition-all duration-75" style={{width: `${vineLashState.size}%`, height: `${vineLashState.size}%`}}></div>
                            </button>
                        </div>
                    )}
                     {dodgeState.active && (
                        <div className="flex flex-col items-center justify-center h-full w-full">
                            <div className="flex items-center justify-center space-x-2">
                                {dodgeState.sequence.map((dir, index) => {
                                    const Icon = ARROW_ICONS[dir];
                                    const isCompleted = index < dodgeState.currentIndex;
                                    const isCurrent = index === dodgeState.currentIndex;
                                    return <Icon key={index} className={`w-12 h-12 transition-colors duration-200 ${isCurrent ? 'text-red-500 animate-pulse scale-110' : isCompleted ? 'text-green-500' : 'text-gray-600'}`} />;
                                })}
                            </div>
                            <div className="w-full progress-bar h-4 mt-4 rounded-full border border-red-500/50 overflow-hidden">
                                <div 
                                    key={dodgeState.key}
                                    className="h-full bg-red-500 rounded-full dodge-timer-bar-animated"
                                    style={{
                                        animationDuration: `${isEnemySnared ? dodgeTime * 1.5 / 1000 : dodgeTime / 1000}s`,
                                        animationPlayState: isPaused ? 'paused' : 'running'
                                    }}
                                />
                            </div>
                        </div>
                    )}
                </div>

                 <div className="w-1/3 flex flex-col items-center p-2 relative">
                    <div className={`relative w-32 h-32 sm:w-40 sm:h-40 mb-2 ${isEnemyHit ? 'animate-flash' : ''} ${isEnemyDodging ? 'animate-dodge-effect' : ''}`}>
                         <div className={isEnemySnared ? 'animate-struggle' : ''}>
                             <Sprite seed={enemy.seed} size={spriteSize} className="w-full h-full" encounter={enemy} />
                             {isEnemySizzling && <div className="animate-enemy-sizzle-effect"></div>}
                         </div>
                         {enemyBurningTurns > 0 && <BurningVFX />}
                         {isEnemySnared && <RootSnareVFX />}
                         {isEnemyStunned && <StunVFX />}
                         {enemyBurningTurns > 0 && <div className="absolute inset-0 bg-orange-500/30 rounded-full vfx-burn-indicator"></div>}
                         {powerHitVfxKey > 0 && <div key={powerHitVfxKey} className="absolute inset-0 animate-power-hit"></div>}
                         {enemyGashKey > 0 && <div key={enemyGashKey} className="vfx-gash"></div>}
                    </div>
                    <FloatingDamageTextVFX texts={floatingDamageTexts} />
                    {shieldBashFlashKey > 0 && <div key={shieldBashFlashKey} className="vfx-shield-bash-flash"></div>}
                    <HealthBar name={enemyName} value={enemyHealth} maxValue={maxEnemyHealth} barClass="enemy-health-bar"/>
                </div>
                 <div className="absolute inset-0 pointer-events-none">
                    {lifeSapParticles.map((p, i) => (
                        <div key={p.id} className="life-sap-particle" style={{
                            top: '50%', left: '66%',
                            '--from-x': '0px', '--from-y': `${(Math.random() - 0.5) * 40}px`,
                            '--to-x': '-33vw', '--to-y': `${(Math.random() - 0.5) * 40}px`,
                            animationDelay: `${i * 0.05}s`
                        } as React.CSSProperties} />
                    ))}
                </div>
            </div>

            <div className="h-10 sm:h-12 flex items-center justify-center mb-2 p-2 bg-black/20 rounded-lg min-w-[300px] z-10">
                <p className="text-lg sm:text-xl font-bold text-gray-300">{currentMessage}</p>
            </div>
            
            <div className="w-full flex items-center justify-around z-10" style={{minHeight: '120px'}}>
                {phase === 'PLAYER_TURN' && activeMinigame === null && (
                    <div className="flex flex-col items-center justify-center gap-2 p-2 bg-black/20 rounded-xl">
                        {attackMoves.length > 0 && <div><h3 className="font-title text-md text-red-400 mb-1">Attack</h3><div className="flex flex-wrap justify-center gap-2">{attackMoves.map((m, i) => <MoveButton key={m} move={m} executeMove={executeMove} disabled={phase !== 'PLAYER_TURN'} starPower={playerState.starPower} isSelected={allMoves.indexOf(m) === selectedAbilityIndex} t={t} />)}</div></div>}
                        {defenseMoves.length > 0 && <div><h3 className="font-title text-md text-blue-400 mb-1">Defense</h3><div className="flex flex-wrap justify-center gap-2">{defenseMoves.map((m, i) => <MoveButton key={m} move={m} executeMove={executeMove} disabled={phase !== 'PLAYER_TURN'} starPower={playerState.starPower} isSelected={allMoves.indexOf(m) === selectedAbilityIndex} t={t} />)}</div></div>}
                        {utilityMoves.length > 0 && <div><h3 className="font-title text-md text-yellow-400 mb-1">Utility</h3><div className="flex flex-wrap justify-center gap-2">{utilityMoves.map((m, i) => <MoveButton key={m} move={m} executeMove={executeMove} disabled={phase !== 'PLAYER_TURN'} starPower={playerState.starPower} isSelected={allMoves.indexOf(m) === selectedAbilityIndex} t={t} />)}</div></div>}
                    </div>
                )}
            </div>

            <div className="absolute bottom-2 right-4 z-10">
                {(!isBoss && !enemy.isGuardian) &&
                    <button title={`${t('ui.fightGame.fleeTitle')} (F)`} onClick={handleFlee} disabled={phase !== 'PLAYER_TURN'} className="p-2 bg-gray-600/80 hover:bg-gray-500/80 rounded-full text-white disabled:opacity-50 disabled:cursor-not-allowed">
                        <FleeIcon className="w-6 h-6" />
                    </button>
                }
            </div>
        </div>
    );
};

const VFXPlayer: React.FC<{ vfx: { type: FightMove | 'gale' | 'sunfire_effect' | 'lifeSap' | 'thornBurst' | 'celestial_strike_full' | 'vengeful_strike_fx', key: number, healthPercent?: number } | null, onComplete: () => void }> = ({ vfx, onComplete }) => {
    useEffect(() => {
        if (!vfx) return;
        const timer = setTimeout(onComplete, 1500); // Increased duration for complex VFX
        return () => clearTimeout(timer);
    }, [vfx, onComplete]);
    
    if (!vfx) return null;

    const targetEnemyPos = { x: '66%', y: '40%'};
    const targetPlayerPos = { x: '33%', y: '40%'};

    switch (vfx.type) {
        case 'sunfire':
            return <div className="absolute inset-0 flex items-center justify-center"><div className="vfx-sunfire"></div></div>;
        case 'sunfire_effect':
            return (
                <div className="vfx-sunfire-container">
                    <div className="vfx-sunfire-flare-effect" style={{ animationDelay: '0.4s' }} />
                    <div className="vfx-sunfire-charge-orb-effect" />
                    <div className="vfx-sunfire-beam-effect" />
                </div>
            );
        case 'gale':
            return <div className="vfx-gale-vortex"></div>;
        case 'celestial_strike_full':
            return (
                <div className="vfx-celestial-container">
                    <div className="vfx-celestial-dim-overlay" />
                    <div className="vfx-celestial-spotlight" style={{'--spotlight-x': '66%', '--spotlight-y': '35%'} as React.CSSProperties} />
                    <div className="vfx-celestial-star" style={{'--spotlight-x': '66%', '--spotlight-y': '35%'} as React.CSSProperties} />
                    <div className="vfx-celestial-impact-flash" />
                </div>
            );
        case 'vengeful_strike_fx': {
            const healthPercent = vfx.healthPercent ?? 1.0;
            const intensity = 1 - healthPercent;
            const scale = 1 + intensity * 1.5;
            const color = `rgba(239, 68, 68, ${0.6 + intensity * 0.4})`;
            return (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none" style={{ left: '16.5%' }}>
                    <div className="vfx-vengeful-slash" style={{ 
                        transform: `scale(${scale})`, 
                        '--slash-color': color 
                    } as React.CSSProperties}/>
                </div>
            );
        }
        case 'lifeSap':
             return <div className="absolute" style={{ top: targetPlayerPos.y, left: targetPlayerPos.x, '--tx': '100vw', '--ty': '0' } as React.CSSProperties}><div className="vfx-lifesap-thorn" /></div>;
        case 'thornBurst':
            return <>{Array.from({length: 8}).map((_, i) => {
                const angle = -45 + Math.random() * 90;
                return <div key={i} className="vfx-thorn-particle" style={{
                    top: '50%', left: '35%',
                    '--tx': `${Math.cos(angle * Math.PI / 180) * 100}vw`,
                    '--ty': `${Math.sin(angle * Math.PI / 180) * 100}vh`,
                    '--r-start': '0deg',
                    '--r-end': `${Math.random() * 360}deg`,
                    animationDelay: `${Math.random() * 0.1}s`,
                } as React.CSSProperties} />
            })}</>;
        default:
            return null;
    }
};