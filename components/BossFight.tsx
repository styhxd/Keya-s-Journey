
import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { FightMove, PlayerState, Encounter, Ability, Direction, GameStats } from '../types';
import { ABILITIES, DIRECTIONS } from '../constants';
import { 
    ArrowDownIcon, ArrowLeftIcon, ArrowRightCircleIcon, ArrowUpIcon, StarIcon, BookOpenIcon,
    VineWhipIcon, StoneShieldIcon, GalePushIcon, SunfireIcon, FocusIcon, WardIcon, 
    RootSnareIcon, MirageIcon, LifeSapIcon, ThornBurstIcon, EyeSlashIcon, HeartIcon,
    PurifyingLightIcon, VengefulStrikeIcon, ShieldBashIcon, BurningBladeIcon,
} from './icons';
import { Sprite } from './Sprite';
import { audioService } from '../services/audioService';
import { FadingWordText } from './FadingWordText';
import { TEXTS } from '../data/narrative';
import { FIGHT_MOVE_DATA } from '../data/combatFormulas';

const MOVE_ICONS: Record<string, React.FC<any>> = {
    // Fight
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
};
const MOVE_COLORS: Record<string, string> = {
    'vine': 'bg-green-700/80 hover:bg-green-600/80', 'stone': 'bg-yellow-700/80 hover:bg-yellow-600/80',
    'gale': 'bg-cyan-700/80 hover:bg-cyan-600/80', 'sunfire': 'bg-orange-700/80 hover:bg-orange-600/80',
    'focus': 'bg-purple-700/80 hover:bg-purple-600/80', 'ward': 'bg-stone-700/80 hover:bg-stone-600/80',
    'rootSnare': 'bg-lime-700/80 hover:bg-lime-600/80', 'mirage': 'bg-indigo-700/80 hover:bg-indigo-600/80',
    'lifeSap': 'bg-red-900/80 hover:bg-red-800/80', 'thornBurst': 'bg-emerald-800/80 hover:bg-emerald-700/80',
    'shieldBash': 'bg-slate-600/80 hover:bg-slate-500/80', 'burningBlade': 'bg-rose-700/80 hover:bg-rose-600/80',
    'shadow_cloak': 'bg-slate-800/80 hover:bg-slate-700/80', 'celestial_strike': 'bg-amber-600/80 hover:bg-amber-500/80',
    'vengeful_strike': 'bg-red-800/80 hover:bg-red-700/80', 'purifying_light': 'bg-yellow-600/80 hover:bg-yellow-500/80',
};

type BossPhase = 
  | 'DIALOGUE' 
  | 'SHOW_CARD'
  | 'PLAYER_CHOOSE_ATTACK' 
  | 'PLAYER_ATTACK_MINIGAME' 
  | 'PLAYER_CONFIRM_DAMAGE' 
  | 'BOSS_ATTACK_DANCE' 
  | 'FINAL_CHOICE' 
  | 'VICTORY' 
  | 'DEFEAT';

type DialogueStage = 'INTRO' | 'INTERLUDE_1' | 'INTERLUDE_2' | 'FINAL_WORDS' | 'EMBRACE_ENDING' | 'DESTROY_ENDING';
const KEY_MAP: Record<string, Direction> = { ArrowLeft: 'left', ArrowDown: 'down', ArrowUp: 'up', ArrowRight: 'right', a: 'left', s: 'down', w: 'up', d: 'right' };
const ARROW_ICONS: Record<string, React.FC<any>> = { up: ArrowUpIcon, down: ArrowDownIcon, left: ArrowLeftIcon, right: ArrowRightCircleIcon };
const COLOR_MAP: Record<Direction, string> = { left: 'from-blue-500 to-cyan-400', down: 'from-red-500 to-orange-400', up: 'from-green-500 to-lime-400', right: 'from-yellow-500 to-amber-400' };

type Note = { id: number; dir: Direction; position: number; hit: 'none' | 'good' | 'miss'; time: number; };
type HitEffect = { id: number; dir: Direction; type: 'good' | 'miss'; };

const HealthBar = React.memo(({ value, maxValue, barClass, name }: { value: number, maxValue: number, barClass: string, name: string }) => (
    <div className="w-full">
        <div className="flex justify-between mb-1"><span className="text-sm font-bold text-gray-200">{name}</span><span className="text-sm font-bold text-gray-300">{Math.ceil(value)} / {maxValue}</span></div>
        <div className="w-full progress-bar rounded-full h-4 sm:h-5"><div className={`h-full rounded-full progress-bar-fill ${barClass}`} style={{ width: `${Math.max(0, (value / maxValue) * 100)}%` }}/></div>
    </div>
));
HealthBar.displayName = "HealthBar";

interface BossFightScreenProps {
    enemy: Encounter;
    playerState: PlayerState;
    setPlayerState: React.Dispatch<React.SetStateAction<PlayerState | null>>;
    onComplete: (victory: boolean, finalChoice?: 'embrace' | 'destroy') => void;
    isPaused: boolean;
    onOpenAbilities: () => void;
    t: (key: string, replacements?: Record<string, string | number>) => string;
    language: 'en' | 'pt' | 'es';
    gameStats: GameStats;
}

const CONFIRM_DAMAGE_TIME = 2500; // ms

export const BossFightScreen: React.FC<BossFightScreenProps> = ({ enemy, playerState, setPlayerState, onComplete, isPaused, onOpenAbilities, t, language, gameStats }) => {
    const [phase, setPhase] = useState<BossPhase>('DIALOGUE');
    const phaseRef = useRef(phase);
    const [finalChoice, setFinalChoice] = useState<'embrace' | 'destroy' | null>(null);

    const [dialogueStage, setDialogueStage] = useState<DialogueStage>('INTRO');
    const [dialogue, setDialogue] = useState<{speaker: string; text: string}[]>([]);
    const [dialogueIndex, setDialogueIndex] = useState(0);

    const difficultyMultiplier = useMemo(() => ({ Normal: 1.0, Hard: 1.25, Requiem: 1.5 }[gameStats.difficulty]), [gameStats.difficulty]);
    const MAX_BOSS_HEALTH = useMemo(() => Math.round((500 + playerState.abilities.length * 12) * difficultyMultiplier), [playerState.abilities.length, difficultyMultiplier]);

    const [playerHealth, setPlayerHealth] = useState(playerState.health);
    const [bossHealth, setBossHealth] = useState(MAX_BOSS_HEALTH);
    
    const [feedback, setFeedback] = useState<{text: string; key: number} | null>(null);
    const [isPlayerHit, setIsPlayerHit] = useState(false);
    const [isBossHit, setIsBossHit] = useState(false);
    const [healVfx, setHealVfx] = useState<{ id: number; amount: number }[]>([]);
    const [powerHitVfxKey, setPowerHitVfxKey] = useState(0);

    // Player Turn (Fight) State
    const [attacksLeftInTurn, setAttacksLeftInTurn] = useState(0);
    const [potentialDamage, setPotentialDamage] = useState(0);
    const [confirmSequence, setConfirmSequence] = useState<Direction[]>([]);
    const [confirmIndex, setConfirmIndex] = useState(0);
    const [activeMinigame, setActiveMinigame] = useState<FightMove | null>(null);
    const [vineLashState, setVineLashState] = useState({ active: false, size: 100 });
    const [isShielded, setIsShielded] = useState(false);
    const [isWarded, setIsWarded] = useState(false);
    const [isAttackFocused, setIsAttackFocused] = useState(false);
    const [enemyBurningTurns, setEnemyBurningTurns] = useState(0);
    const [mirageTurns, setMirageTurns] = useState(0);
    const [isShadowCloaked, setIsShadowCloaked] = useState(false);
    const confirmTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    // Boss Turn (Dance) State
    const [notes, setNotes] = useState<Note[]>([]);
    const notesRef = useRef<Note[]>([]);
    const [hitEffects, setHitEffects] = useState<HitEffect[]>([]);
    const gameContainerRef = useRef<HTMLDivElement>(null);
    const danceLoopRef = useRef<number | null>(null);
    const dancePhaseEndTimeRef = useRef<number>(0);
    const audioCtx = useMemo(() => audioService.getAudioContext(), []);

    const fightAbilities = useMemo(() => playerState.abilities.map(id => ABILITIES[id]).filter((a): a is Ability => !!a && a.type === 'fight'), [playerState.abilities]);
    
    const hasPowerBoon = useMemo(() => playerState.abilities.includes('boon_power_1'), [playerState.abilities]);
    const powerBoonBonus = hasPowerBoon ? 5 : 0;
    
    const canCombatHeal = useMemo(() => 
        playerState.abilities.includes('boon_combat_medic_1') && 
        playerState.starPower >= 5 && 
        playerHealth < playerState.maxHealth,
    [playerState.abilities, playerState.starPower, playerHealth, playerState.maxHealth]);

    const dialoguePath = useMemo(() => {
        const { alignment } = playerState;
        if (alignment <= -45) return 'PURE_SHADOW';
        if (alignment <= -20) return 'TAINTED_SHADOW';
        if (alignment >= 45) return 'PURE_HARMONY';
        if (alignment >= 20) return 'HARMONIOUS_SHEPHERD';
        return 'BALANCE';
    }, [playerState.alignment]);

    const handleCombatHeal = useCallback(() => {
        if (!canCombatHeal || isPaused || phaseRef.current === 'VICTORY' || phaseRef.current === 'DEFEAT') return;
        setPlayerState(p => {
            if (!p) return null;
            const healthGain = 6 + Math.floor(Math.random() * 2);
            const newHealth = Math.min(p.maxHealth, p.health + healthGain);
            setPlayerHealth(newHealth);
            const id = performance.now();
            setHealVfx(v => [...v, { id, amount: healthGain }]);
            setTimeout(() => setHealVfx(v => v.filter(i => i.id !== id)), 1500);
            return { ...p, health: newHealth, starPower: p.starPower - 5 };
        });
        audioService.playSfx('heal');
    }, [canCombatHeal, isPaused, setPlayerState]);

    const getDialogueForStage = useCallback((stage: DialogueStage) => {
        const stageKey = stage.toLowerCase() as keyof typeof TEXTS.en.bossDialogue.BALANCE;

        let pathDialogue = (TEXTS[language].bossDialogue as any)[dialoguePath];
        if (!pathDialogue || !pathDialogue[stageKey]) {
            pathDialogue = TEXTS[language].bossDialogue.BALANCE;
        }

        const dialogueLines: {speaker: string, text: string}[] = pathDialogue[stageKey];
        if (!dialogueLines) return [];
        
        return dialogueLines.map(line => ({
            speaker: line.speaker,
            text: line.text
        }));
    }, [language, dialoguePath]);

    useEffect(() => {
        phaseRef.current = phase;
    }, [phase]);

    useEffect(() => {
        setDialogue(getDialogueForStage('INTRO'));
    }, [getDialogueForStage]);
    
    const showFeedback = useCallback((text: string) => {
        const key = Date.now();
        setFeedback({text, key});
        setTimeout(() => setFeedback(current => current?.key === key ? null : current), 2500);
    }, []);

    const triggerHitFlash = useCallback((character: 'player' | 'boss') => {
        const setter = character === 'player' ? setIsPlayerHit : setIsBossHit;
        audioService.playSfx(character === 'player' ? 'playerHit' : 'enemyHit');
        if (character === 'boss' && hasPowerBoon) {
            audioService.playSfx('power_hit');
            setPowerHitVfxKey(Date.now());
        }
        setter(true);
        setTimeout(() => setter(false), 200);
    }, [hasPowerBoon]);

    const endPlayerTurn = useCallback(() => {
        if (enemyBurningTurns > 0) {
            const burnDamage = FIGHT_MOVE_DATA.burningBlade.dot!.damage;
            setBossHealth(h => Math.max(0, h - burnDamage));
            setEnemyBurningTurns(t => t - 1);
            triggerHitFlash('boss');
            showFeedback(t('ui.fightGame.enemyAblaze', { enemyName: t('speakers.keyas_shadow') }) + ` (-${burnDamage})`);
        }
        if (mirageTurns > 0) setMirageTurns(t => t-1);
        setPhase('BOSS_ATTACK_DANCE');
    }, [enemyBurningTurns, mirageTurns, triggerHitFlash, showFeedback, t]);

    const endBossTurn = useCallback((success: boolean) => {
        if (success) {
            showFeedback(t('ui.bossFight.harmonyResonates'));
            setPlayerHealth(h => Math.min(playerState.maxHealth, h + 15));
            audioService.playSfx('win_dance', 0.5);
        } else {
            showFeedback(t('ui.bossFight.harmonyFalters'));
            audioService.playSfx('miss');
        }
        setPhase('PLAYER_CHOOSE_ATTACK');
        setAttacksLeftInTurn(Math.random() > 0.5 ? 3 : 2);
    }, [showFeedback, playerState.maxHealth, t]);

    const advanceDialogue = useCallback(() => {
        if (isPaused) return;
        audioService.playSfx('click');
        if (dialogueIndex < dialogue.length - 1) {
            setDialogueIndex(i => i + 1);
        } else {
            const nextPhase = 
                dialogueStage === 'INTRO' ? 'SHOW_CARD' :
                dialogueStage === 'INTERLUDE_1' ? 'BOSS_ATTACK_DANCE' :
                dialogueStage === 'INTERLUDE_2' ? 'PLAYER_CHOOSE_ATTACK' :
                dialogueStage === 'FINAL_WORDS' ? 'FINAL_CHOICE' :
                dialogueStage === 'EMBRACE_ENDING' || dialogueStage === 'DESTROY_ENDING' ? 'VICTORY' : phase;
            
            if (nextPhase !== 'VICTORY' && nextPhase !== 'DEFEAT') {
                setDialogueIndex(0);
            }
            
            if(nextPhase === 'PLAYER_CHOOSE_ATTACK') setAttacksLeftInTurn(Math.random() > 0.6 ? 3 : 2);
            setPhase(nextPhase);
        }
    }, [isPaused, dialogue, dialogueIndex, dialogueStage, phase]);
    
    const handleFinalChoice = (choice: 'embrace' | 'destroy') => {
        setFinalChoice(choice);
        if (choice === 'embrace') {
            setDialogueStage('EMBRACE_ENDING');
            setDialogue(getDialogueForStage('EMBRACE_ENDING'));
        } else {
            setDialogueStage('DESTROY_ENDING');
            setDialogue(getDialogueForStage('DESTROY_ENDING'));
        }
        setDialogueIndex(0);
        setPhase('DIALOGUE');
    };

    const handleContainerClick = () => {
        if (phase === 'DIALOGUE') {
            advanceDialogue();
        }
    };
    
    const handleConfirmDamageFail = useCallback(() => {
        setConfirmSequence([]);
        showFeedback(t('ui.fightGame.miss'));
        if (attacksLeftInTurn > 1) {
            setAttacksLeftInTurn(n => n - 1);
            setPhase('PLAYER_CHOOSE_ATTACK');
        } else {
            endPlayerTurn();
        }
    }, [attacksLeftInTurn, endPlayerTurn, showFeedback, t]);

    const executeMove = useCallback((ability: Ability) => {
        const move = ability.id as FightMove;
        if (phase !== 'PLAYER_CHOOSE_ATTACK') return;
        audioService.playSfx('click');
        showFeedback(t('ui.bossFight.usedAbility', { abilityName: t(ability.name) }));
        setPhase('DEFEAT'); // Temporarily disable controls
        setIsShielded(false); // Using an ability removes the basic shield

        const data = FIGHT_MOVE_DATA[move];
        let damage = 0;
        let isUtility = false;

        switch(move) {
            case 'vine':
                setPhase('PLAYER_ATTACK_MINIGAME');
                setActiveMinigame('vine');
                setVineLashState({ active: true, size: 100 });
                return; // Exit early, minigame will handle the next phase
            case 'stone':
                setIsShielded(true); isUtility = true; break;
            case 'ward':
                setIsWarded(true); isUtility = true; break;
            case 'focus':
                setIsAttackFocused(true);
                if (attacksLeftInTurn > 1) {
                    setPhase('PLAYER_CHOOSE_ATTACK');
                    setAttacksLeftInTurn(n => n - 1);
                } else {
                    endPlayerTurn();
                }
                return;
            case 'sunfire':
                if (playerState.starPower < data.starPowerCost!) { showFeedback(t('ui.fightGame.notEnoughStarPower')); setPhase('PLAYER_CHOOSE_ATTACK'); return; }
                setPlayerState(p => ({...p!, starPower: p!.starPower - data.starPowerCost!}));
                damage = (data.baseDamage! + Math.floor(Math.random() * (data.damageRange! + 1))) + powerBoonBonus;
                break;
            case 'celestial_strike':
                if (playerState.starPower < data.starPowerCost!) { showFeedback(t('ui.fightGame.notEnoughStarPower')); setPhase('PLAYER_CHOOSE_ATTACK'); return; }
                setPlayerState(p => ({...p!, starPower: p!.starPower - data.starPowerCost!}));
                damage = (data.baseDamage! + Math.floor(Math.random() * (data.damageRange! + 1))) + powerBoonBonus;
                break;
            case 'lifeSap':
                damage = (data.baseDamage! + Math.floor(Math.random() * (data.damageRange! + 1))) + powerBoonBonus;
                const healthStolen = Math.floor(damage * data.lifestealFactor!);
                setPlayerHealth(h => Math.min(playerState.maxHealth, h + healthStolen));
                break;
            case 'shieldBash':
                damage = (data.baseDamage! + Math.floor(Math.random() * (data.damageRange! + 1))) + powerBoonBonus;
                showFeedback("The Shadow cannot be stunned.");
                break;
            case 'burningBlade':
                damage = (data.baseDamage! + Math.floor(Math.random() * (data.damageRange! + 1))) + powerBoonBonus;
                setEnemyBurningTurns(data.dot!.turns);
                break;
            case 'vengeful_strike':
                const missingHealth = playerState.maxHealth - playerHealth;
                damage = data.baseDamage! + Math.floor(missingHealth * data.scaling!.factor) + powerBoonBonus;
                break;
            case 'purifying_light':
                damage = (data.baseDamage! + Math.floor(Math.random() * (data.damageRange! + 1))) + powerBoonBonus;
                damage *= data.specialBonus!.multiplier; // Extra damage to shadow
                setPlayerHealth(h => Math.min(playerState.maxHealth, h + data.heal!));
                break;
            case 'thornBurst':
                const numThorns = data.hits!.min + Math.floor(Math.random() * (data.hits!.max - data.hits!.min + 1));
                let totalDamage = 0;
                for (let i = 0; i < numThorns; i++) {
                    totalDamage += (data.hits!.baseDamagePerHit + Math.floor(Math.random() * (data.hits!.damageRangePerHit + 1))) + powerBoonBonus;
                }
                damage = totalDamage;
                break;
            case 'gale':
                showFeedback("The Shadow is unmoved by the gust."); isUtility = true; break;
            case 'rootSnare':
                showFeedback("Roots cannot hold a shadow."); isUtility = true; break;
            case 'mirage':
                setMirageTurns(3); isUtility = true; break;
            case 'shadow_cloak':
                setIsShadowCloaked(true); isUtility = true; break;
        }

        if (isUtility) {
            setPotentialDamage(0);
        } else {
             if (isAttackFocused) {
                damage *= 1.75;
                setIsAttackFocused(false);
            }
            setPotentialDamage(damage);
        }
        setPhase('PLAYER_CONFIRM_DAMAGE');
    }, [playerState, t, showFeedback, setPlayerState, attacksLeftInTurn, endPlayerTurn, isAttackFocused, powerBoonBonus, playerHealth, phase]);

    const handleVineLashClick = () => {
        if (!vineLashState.active) return;
        setVineLashState({ active: false, size: 100 });
        setActiveMinigame(null);
        let damage = 0;
        const { size } = vineLashState;
        const data = FIGHT_MOVE_DATA.vine.damageTiers!;
        
        if (size > 90) { damage = data.miss; }
        else if (size < 15) { damage = data.crit + powerBoonBonus; audioService.playSfx('treasure'); }
        else if (size < 30) { damage = data.perfect + powerBoonBonus; }
        else if (size < 60) { damage = data.good + powerBoonBonus; }
        else { damage = data.weak + powerBoonBonus; }

        if (isAttackFocused) { damage *= 1.75; setIsAttackFocused(false); }
        setPotentialDamage(damage);
        setPhase('PLAYER_CONFIRM_DAMAGE');
    };
    
    const vineLashDifficultyMultiplier = 1.5;
    useEffect(() => {
        if (!vineLashState.active || isPaused) return;
        const interval = setInterval(() => {
            setVineLashState(s => ({ ...s, size: s.size > 10 ? s.size - 2.5 * vineLashDifficultyMultiplier : 100 }));
        }, 20);
        return () => clearInterval(interval);
    }, [vineLashState.active, isPaused, vineLashDifficultyMultiplier]);

    const handleConfirmDamageInput = useCallback((key: Direction) => {
        if (phase !== 'PLAYER_CONFIRM_DAMAGE') return;
        if (key === confirmSequence[confirmIndex]) {
            audioService.playNote(confirmIndex);
            const nextIndex = confirmIndex + 1;
            if (nextIndex >= confirmSequence.length) {
                if (confirmTimerRef.current) clearTimeout(confirmTimerRef.current);
                setConfirmSequence([]);
                if (potentialDamage > 0) {
                    setBossHealth(h => Math.max(0, h - potentialDamage));
                    triggerHitFlash('boss');
                    showFeedback(t('ui.fightGame.dealtDamage', {damage: Math.round(potentialDamage)}));
                }
                if (attacksLeftInTurn > 1) {
                    setAttacksLeftInTurn(n => n - 1);
                    setPhase('PLAYER_CHOOSE_ATTACK');
                } else {
                    endPlayerTurn();
                }
            } else {
                setConfirmIndex(nextIndex);
            }
        } else {
            if (confirmTimerRef.current) clearTimeout(confirmTimerRef.current);
            handleConfirmDamageFail();
        }
    }, [confirmSequence, confirmIndex, handleConfirmDamageFail, potentialDamage, showFeedback, t, attacksLeftInTurn, endPlayerTurn, triggerHitFlash, phase]);

    const danceGameLoop = useCallback(() => {
        if (isPaused || !gameContainerRef.current || !audioCtx) {
            danceLoopRef.current = requestAnimationFrame(danceGameLoop);
            return;
        }
        const containerHeight = gameContainerRef.current.offsetHeight;
        if (containerHeight === 0) { danceLoopRef.current = requestAnimationFrame(danceGameLoop); return; }
        
        const hitLineY = containerHeight * 0.85;
        const noteVisibleTime = 2.0;
        const pixelsPerSecond = (hitLineY) / noteVisibleTime;
        const currentTime = audioCtx.currentTime;

        if (phaseRef.current === 'BOSS_ATTACK_DANCE') {
            let missedNoteThisFrame = false;
            for (const note of notesRef.current) {
                if (note.hit !== 'none') continue;
                if (note.time - currentTime < -0.15) {
                    note.hit = 'miss';
                    missedNoteThisFrame = true;
                }
            }
    
            if (missedNoteThisFrame) {
                showFeedback(t('rhythm.misstep'));
                const damageMultiplier = { Normal: 1.0, Hard: 1.25, Requiem: 1.5 }[gameStats.difficulty];
                let damage = Math.round(20 * damageMultiplier);
                if (isShadowCloaked) {
                    damage = 0;
                    showFeedback(t('ui.fightGame.shadowCloakDodge'));
                    setIsShadowCloaked(false);
                } else if(isShielded) { 
                    damage = 0; 
                    setIsShielded(false); 
                    showFeedback(t('ui.fightGame.shieldBlocks'));
                } else if(isWarded) { 
                    damage = Math.round(damage/2); 
                    setIsWarded(false); 
                    showFeedback(t('ui.fightGame.wardSoftens'));
                } else if (mirageTurns > 0 && Math.random() < 0.5) {
                    damage = 0;
                    showFeedback(t('ui.fightGame.mirageHit'));
                }
                
                if(damage > 0) { 
                    setPlayerHealth(h => Math.max(0, h - damage)); 
                    triggerHitFlash('player'); 
                } else {
                    audioService.playSfx('block');
                }
            }
        }
        setNotes(notesRef.current.map(note => ({...note, position: hitLineY - (note.time - currentTime) * pixelsPerSecond})).filter(note => currentTime - note.time < 0.5));
        if (phaseRef.current === 'BOSS_ATTACK_DANCE' && dancePhaseEndTimeRef.current && currentTime > dancePhaseEndTimeRef.current) {
            endBossTurn(notesRef.current.every(n => n.hit !== 'miss'));
            return;
        }
        danceLoopRef.current = requestAnimationFrame(danceGameLoop);
    }, [isPaused, audioCtx, t, showFeedback, triggerHitFlash, endBossTurn, isShielded, isWarded, isShadowCloaked, mirageTurns, gameStats.difficulty]);

    const handleDanceInput = useCallback((dir: Direction) => {
        if (phase !== 'BOSS_ATTACK_DANCE' || !audioCtx) return;
        const currentTime = audioCtx.currentTime;
        const hitTolerance = 0.15;
        let noteHit = false;
        let noteToHitIndex = -1;
        let smallestTimeDiff = Infinity;
        notesRef.current.forEach((note, index) => {
            const timeDiff = Math.abs(note.time - currentTime);
            if (note.hit === 'none' && note.dir === dir && timeDiff < hitTolerance && timeDiff < smallestTimeDiff) {
                noteToHitIndex = index;
                smallestTimeDiff = timeDiff;
            }
        });
        if (noteToHitIndex !== -1) {
            notesRef.current[noteToHitIndex].hit = 'good';
            audioService.playNote(DIRECTIONS.indexOf(dir));
            noteHit = true;
        }
        const newEffect: HitEffect = { id: performance.now(), dir, type: noteHit ? 'good' : 'miss' };
        setHitEffects(effects => [...effects, newEffect]);
        setTimeout(() => setHitEffects(e => e.filter(ef => ef.id !== newEffect.id)), 400);
    }, [audioCtx, phase]);
    
    // Phase controllers
    useEffect(() => {
        const nextDialogueStage = 
            (bossHealth <= MAX_BOSS_HEALTH * 0.66 && dialogueStage === 'INTRO') ? 'INTERLUDE_1' :
            (bossHealth <= MAX_BOSS_HEALTH * 0.33 && dialogueStage === 'INTERLUDE_1') ? 'INTERLUDE_2' :
            (bossHealth <= 0 && !['FINAL_WORDS', 'EMBRACE_ENDING', 'DESTROY_ENDING'].includes(dialogueStage)) ? 'FINAL_WORDS' : null;
        
        if (nextDialogueStage && phase !== 'DIALOGUE') {
            setDialogueStage(nextDialogueStage);
            setDialogue(getDialogueForStage(nextDialogueStage));
            setDialogueIndex(0);
            setPhase('DIALOGUE');
        } else if (playerHealth <= 0 && phase !== 'DEFEAT' && phase !== 'VICTORY') {
            setPhase('DEFEAT');
        }
    }, [bossHealth, playerHealth, phase, dialogueStage, getDialogueForStage, MAX_BOSS_HEALTH]);
    
    useEffect(() => {
        if (phase === 'PLAYER_CONFIRM_DAMAGE') {
            const sequenceLength = 4;
            const newSequence = Array.from({ length: sequenceLength }, () => DIRECTIONS[Math.floor(Math.random() * 4)]);
            setConfirmSequence(newSequence);
            setConfirmIndex(0);
            if (confirmTimerRef.current) clearTimeout(confirmTimerRef.current);
            confirmTimerRef.current = setTimeout(handleConfirmDamageFail, CONFIRM_DAMAGE_TIME);
            return () => { if(confirmTimerRef.current) clearTimeout(confirmTimerRef.current); };
        }
    }, [phase, handleConfirmDamageFail]);

    useEffect(() => {
        if (phase === 'BOSS_ATTACK_DANCE' && !isPaused && audioCtx) {
            notesRef.current = []; setNotes([]);
            showFeedback(t('ui.bossFight.matchRhythm'));
            dancePhaseEndTimeRef.current = audioCtx.currentTime + 15;
            const danceSpeedMultiplier = { Normal: 1.0, Hard: 0.85, Requiem: 0.75 }[gameStats.difficulty];
            const spawnNote = () => {
                if (!audioCtx || audioCtx.currentTime > (dancePhaseEndTimeRef.current || 0) || phaseRef.current !== 'BOSS_ATTACK_DANCE' || isPaused) return;
                const noteTime = audioCtx.currentTime + 2.0;
                notesRef.current.push({ id: performance.now(), dir: DIRECTIONS[Math.floor(Math.random() * 4)], time: noteTime, position: -100, hit: 'none' });
                setTimeout(spawnNote, (400 + Math.random() * 200) * danceSpeedMultiplier);
            };
            spawnNote();
            danceLoopRef.current = requestAnimationFrame(danceGameLoop);
            return () => { if (danceLoopRef.current) cancelAnimationFrame(danceLoopRef.current); }
        }
    }, [phase, isPaused, audioCtx, danceGameLoop, t, showFeedback, gameStats.difficulty]);

    useEffect(() => {
        if (phase === 'VICTORY' || phase === 'DEFEAT') {
            // The timeout is removed, victory/defeat is handled by user click
        }
    }, [phase, onComplete]);

    const handleKeyboardInput = useCallback((e: KeyboardEvent) => {
        if (isPaused) return;
        const key = e.key.toLowerCase();
        
        if (key === 'h') { handleCombatHeal(); return; }
        
        if (phase === 'DIALOGUE') { if (key === 'enter' || key === ' ') { e.preventDefault(); advanceDialogue(); }} 
        else if (phase === 'PLAYER_ATTACK_MINIGAME' && activeMinigame === 'vine' && (key === 'enter' || key === ' ')) { e.preventDefault(); handleVineLashClick(); } 
        else {
            const direction = KEY_MAP[key];
            if (direction) {
                e.preventDefault();
                if (phase === 'PLAYER_CONFIRM_DAMAGE') handleConfirmDamageInput(direction);
                else if (phase === 'BOSS_ATTACK_DANCE') handleDanceInput(direction);
            }
        }
    }, [isPaused, phase, advanceDialogue, handleConfirmDamageInput, handleDanceInput, activeMinigame, handleVineLashClick, handleCombatHeal]);
    
    useEffect(() => {
        window.addEventListener('keydown', handleKeyboardInput);
        return () => window.removeEventListener('keydown', handleKeyboardInput);
    }, [handleKeyboardInput]);
    
    useEffect(() => {
        if (playerState.health !== playerHealth) setPlayerState(p => p ? { ...p, health: playerHealth } : null);
    }, [playerHealth, playerState.health, setPlayerState]);
    
    if (phase === 'VICTORY') {
        return (
            <div className="h-full flex flex-col items-center justify-center text-center p-2 cursor-pointer" onClick={() => onComplete(true, finalChoice!)}>
                <h2 className="font-title text-5xl text-yellow-300 animate-pulse">{t('ui.bossFight.stage_VICTORY')}</h2>
                <p className="text-lg text-gray-400 mt-4 animate-pulse">{t('ui.continue')}...</p>
            </div>
        );
    }

    if (phase === 'DEFEAT') {
        return (
            <div className="h-full flex flex-col items-center justify-center text-center p-2 cursor-pointer" onClick={() => onComplete(false)}>
                <h2 className="font-title text-5xl text-red-500 animate-pulse">{t('ui.bossFight.stage_DEFEAT')}</h2>
                <p className="text-lg text-gray-400 mt-4 animate-pulse">{t('ui.continue')}...</p>
            </div>
        );
    }
    
    if (phase === 'DIALOGUE' || phase === 'FINAL_CHOICE') {
        const currentDialogue = dialogue[dialogueIndex];
        const isKeyaSpeaking = currentDialogue && currentDialogue.speaker === 'Keya';
        const speakerKey = currentDialogue ? (isKeyaSpeaking ? 'speakers.keya' : 'speakers.keyas_shadow') : '';
    
        return (
            <div className="h-full flex flex-col items-center justify-center text-center p-2 relative overflow-hidden" onClick={handleContainerClick}>
                <div className="fight-light-effect"></div>
                <div className="absolute inset-0 bg-black/70 backdrop-blur-sm z-20 flex flex-col justify-between">
                    
                    {/* Sprites Area */}
                    <div className="flex justify-between items-center px-4 sm:px-8 pt-8 flex-grow">
                        <div className={`transition-opacity duration-300 ${isKeyaSpeaking || phase === 'FINAL_CHOICE' ? 'opacity-100' : 'opacity-60'}`}>
                            <Sprite seed="Keya" size={224} alignment={playerState.alignment} className="w-40 h-40 sm:w-56 sm:h-56" />
                        </div>
                        <div className={`transition-opacity duration-300 ${!isKeyaSpeaking || phase === 'FINAL_CHOICE' ? 'opacity-100' : 'opacity-60'}`}>
                            <Sprite seed={enemy.seed} size={224} encounter={enemy} alignment={playerState.alignment} className="w-40 h-40 sm:w-56 sm:h-56" />
                        </div>
                    </div>
    
                    {/* Dialogue/Choice Area */}
                    <div className="pb-4 w-full">
                         {(phase === 'DIALOGUE') && currentDialogue && (
                            <div className={`w-full flex items-end px-4`}>
                                <div className={`w-full flex ${isKeyaSpeaking ? 'justify-start' : 'justify-end'}`}>
                                    <div className={`relative p-4 w-11/12 max-w-md bg-black/80 border-2 rounded-lg ${isKeyaSpeaking ? 'border-blue-400' : 'border-purple-400'}`}>
                                        <p className={`font-title text-lg mb-1 ${isKeyaSpeaking ? 'text-blue-300' : 'text-purple-300'}`}>{t(speakerKey)}</p>
                                        <div className="min-h-[3em]">
                                            <FadingWordText text={t(currentDialogue.text)} />
                                        </div>
                                        {(phase === 'DIALOGUE') && <p className="text-sm text-gray-400 text-right mt-2 animate-pulse">{t('ui.continue')}...</p>}
                                    </div>
                                </div>
                            </div>
                        )}
                        
                        {phase === 'FINAL_CHOICE' && (
                            <div className="p-4 mx-auto w-11/12 max-w-3xl bg-black/80 border-2 border-amber-400 rounded-lg">
                                <p className="text-2xl text-center text-gray-200 mb-4 font-title">{t('bossDialogue.finalChoice')}</p>
                                <div className="flex justify-center space-x-4">
                                    <button onClick={() => handleFinalChoice('destroy')} className="ability-button bg-red-800 hover:bg-red-700 w-48">{t('bossDialogue.choiceDestroy')}</button>
                                    <button onClick={() => handleFinalChoice('embrace')} className="ability-button bg-blue-800 hover:bg-blue-700 w-48">{t('bossDialogue.choiceEmbrace')}</button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        )
    }

    if (phase === 'SHOW_CARD') {
        return (
            <div className="h-full flex flex-col items-center justify-center text-center p-2 cursor-pointer" onClick={() => { audioService.playSfx('click'); setPhase('PLAYER_CHOOSE_ATTACK'); setAttacksLeftInTurn(Math.random() > 0.6 ? 3 : 2); }}>
                <div className="w-full max-w-2xl p-8 rounded-2xl border-4 border-amber-400 bg-gradient-to-br from-gray-900 to-black shadow-[0_0_30px_#f59e0b] animate-pop-in">
                    <div className="w-40 h-40 sm:w-56 sm:h-56 mx-auto mb-6">
                        <Sprite seed={enemy.seed} size={224} encounter={enemy} alignment={playerState.alignment} className="w-full h-full" />
                    </div>
                    <h2 className="text-4xl sm:text-6xl font-title text-transparent bg-clip-text bg-gradient-to-r from-amber-300 to-red-500 mb-2">{t(enemy.name)}</h2>
                    <p className="text-lg text-center text-gray-300 mb-8 max-w-2xl">{t(enemy.description)}</p>
                    <p className="text-lg text-gray-400 mt-4 animate-pulse">{t('ui.continue')}...</p>
                </div>
            </div>
        );
    }
    
    return (
         <div className="h-full flex flex-col items-center justify-between text-center animate-pop-in p-1 sm:p-2 relative overflow-hidden">
            <div className="fight-light-effect"></div>
            <div className="w-full flex items-center justify-between relative z-10">
                 <button onClick={onOpenAbilities} className="absolute left-0 top-0 p-2 bg-black/20 hover:bg-black/40 rounded-full text-gray-300 hover:text-white transition-colors">
                    <BookOpenIcon className="w-7 h-7" />
                </button>
                 <div className="w-1/4"></div>
                <h2 className="w-1/2 font-title text-3xl sm:text-4xl text-red-500 tracking-widest uppercase drop-shadow-lg">{t('ui.fightGame.boss')}</h2>
                <div className="w-1/4"></div>
            </div>

            <div className="w-full flex justify-between items-start my-auto z-10">
                <div className="w-1/3 flex flex-col items-center p-2">
                    <div className={`relative w-32 h-32 sm:w-40 sm:h-40 mb-2 ${isPlayerHit ? 'animate-flash' : ''}`}>
                         <Sprite seed="Keya" size={160} className="w-full h-full" alignment={playerState.alignment}/>
                         {healVfx.map(vfx => <div key={vfx.id} className="heal-vfx-text">+{vfx.amount}</div>)}
                    </div>
                    <HealthBar name={t('ui.fightGame.you')} value={playerHealth} maxValue={playerState.maxHealth} barClass="health-bar"/>
                    {canCombatHeal && (
                        <button onClick={handleCombatHeal} className="mt-2 flex items-center justify-center font-bold text-sm bg-green-700/80 hover:bg-green-600/80 text-white py-1 px-3 rounded-full shadow-lg">
                            <HeartIcon className="w-4 h-4 mr-1" /> 5 <StarIcon className="w-3 h-3 ml-0.5" /> (H)
                        </button>
                    )}
                    <div className="flex items-center text-yellow-400 font-bold mt-2 text-lg"><StarIcon className="w-6 h-6 mr-2 text-yellow-400" /> {playerState.starPower}</div>
                </div>

                <div className="w-1/3 flex flex-col items-center p-2 pt-10">
                    <div ref={gameContainerRef} className="w-full h-64 bg-black/30 rounded-lg relative overflow-hidden">
                        {phase === 'PLAYER_ATTACK_MINIGAME' && activeMinigame === 'vine' && (
                            <div className="w-full h-full flex items-center justify-center">
                                <button onClick={handleVineLashClick} className="w-40 h-40 rounded-full border-4 border-dashed border-green-500 flex items-center justify-center bg-green-500/10">
                                    <div className="absolute w-10 h-10 rounded-full bg-yellow-400/50 border-2 border-yellow-300"></div>
                                    <div className="rounded-full bg-gradient-to-br from-green-500 to-lime-400 shadow-xl transition-all duration-75" style={{width: `${vineLashState.size}%`, height: `${vineLashState.size}%`}}></div>
                                </button>
                            </div>
                        )}
                        {phase === 'PLAYER_CONFIRM_DAMAGE' && (
                             <div className="w-full h-full flex flex-col items-center justify-center">
                                 <div className="flex items-center justify-center space-x-2">
                                     {confirmSequence.map((dir, index) => {
                                         const Icon = ARROW_ICONS[dir];
                                         const isCompleted = index < confirmIndex;
                                         const isCurrent = index === confirmIndex;
                                         return <Icon key={index} className={`w-12 h-12 transition-colors duration-200 ${isCurrent ? 'text-red-500 animate-pulse scale-110' : isCompleted ? 'text-green-500' : 'text-gray-600'}`} />;
                                     })}
                                 </div>
                                 <div className="w-full progress-bar h-4 mt-4 rounded-full border border-red-500/50 overflow-hidden">
                                     <div className="h-full bg-red-500 rounded-full dodge-timer-bar-animated" style={{ animationDuration: `${CONFIRM_DAMAGE_TIME / 1000}s` }} />
                                 </div>
                             </div>
                        )}
                         {phase === 'BOSS_ATTACK_DANCE' && (
                             <>
                                <div className="absolute inset-0 flex justify-around">
                                    {DIRECTIONS.map(dir => <div key={dir} className="w-1/4 h-full border-r border-white/10 last:border-r-0"></div>)}
                                </div>
                                <div className="absolute left-0 right-0 flex justify-around items-center border-t-2 border-b-2 border-yellow-400/50 py-2" style={{ top: `85%`, transform: 'translateY(-50%)' }}>
                                    {DIRECTIONS.map(dir => (
                                        <div key={dir} className={`w-14 h-14 rounded-full flex items-center justify-center bg-gradient-to-br ${COLOR_MAP[dir]} opacity-20`}>
                                            {React.createElement(ARROW_ICONS[dir], {className: 'w-8 h-8 text-white'})}
                                        </div>
                                    ))}
                                </div>
                                 {hitEffects.map(effect => {
                                    const dirIndex = DIRECTIONS.indexOf(effect.dir);
                                    let effectClasses = effect.type === 'good' ? 'bg-yellow-400/50 border-yellow-300' : 'bg-red-500/50 border-red-400';
                                    return (<div key={effect.id} className={`absolute w-20 h-20 rounded-full border-4 animate-hit-vfx ${effectClasses}`}
                                        style={{ top: '85%', left: `${dirIndex * 25 + 12.5}%`, transform: 'translate(-50%, -50%)' }} />);
                                })}
                                {notes.map(note => {
                                    const Icon = ARROW_ICONS[note.dir];
                                    const dirIndex = DIRECTIONS.indexOf(note.dir);
                                    return (<div key={note.id} className={`absolute w-1/4 flex justify-center`} style={{ top: note.position, left: `${dirIndex * 25}%`, transform: 'translateY(-50%)'}}>
                                        <div className={`w-14 h-14 rounded-full flex items-center justify-center bg-gradient-to-br ${COLOR_MAP[note.dir]} shadow-lg`}>
                                            <Icon className="w-8 h-8 text-black/70" />
                                        </div>
                                    </div>)
                                })}
                             </>
                         )}
                    </div>
                     {feedback && <p key={feedback.key} className="text-xl font-bold text-gray-300 mt-4 animate-pulse">{feedback.text}</p>}
                </div>

                <div className="w-1/3 flex flex-col items-center p-2 relative">
                     <div className={`relative w-32 h-32 sm:w-40 sm:h-40 mb-2 ${isBossHit ? 'animate-flash' : ''}`}>
                         <Sprite seed={enemy.seed} size={160} className="w-full h-full" encounter={enemy} alignment={playerState.alignment} />
                         {powerHitVfxKey > 0 && <div key={powerHitVfxKey} className="absolute inset-0 animate-power-hit"></div>}
                         {enemyBurningTurns > 0 && <div className="absolute inset-0 bg-orange-500/30 rounded-full vfx-burn-indicator"></div>}
                     </div>
                    <HealthBar name={t('speakers.keyas_shadow')} value={bossHealth} maxValue={MAX_BOSS_HEALTH} barClass="enemy-health-bar"/>
                </div>
            </div>
            
            <div className="w-full min-h-[10rem] flex flex-wrap items-center justify-center gap-2 p-2 bg-black/20 rounded-xl z-10">
                {phase === 'PLAYER_CHOOSE_ATTACK' && fightAbilities.map(ability => (
                    <button key={ability.id} onClick={() => executeMove(ability)} className={`flex flex-col items-center justify-center w-24 h-24 rounded-2xl ${MOVE_COLORS[ability.id]} text-white shadow-lg transform transition-all duration-200 hover:-translate-y-1 hover:shadow-xl`}>
                        {React.createElement(MOVE_ICONS[ability.id], { className: "w-10 h-10 mb-1"})}
                        <span className="text-sm font-bold text-center leading-tight uppercase tracking-wider">{t(ability.name)}</span>
                    </button>
                ))}
                {phase === 'PLAYER_CHOOSE_ATTACK' && <p className="w-full text-center text-lg text-gray-300 font-bold">{t('ui.bossFight.attacksLeft')}: {attacksLeftInTurn}</p>}
            </div>
        </div>
    );
};
