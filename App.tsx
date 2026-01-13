
import React, { useState, useCallback, useEffect, useMemo, useRef } from 'react';
import { GameState } from './types';
import type { Encounter, GameStats, PlayerState, MapTile, GameSettings, Ability, UnlockedEnding, FightMove, DanceMove, StarMap, CollectibleStar, Palette, BoonId, Direction, Difficulty } from './types';
import { generateLabyrinth, MAX_PLAYER_HEALTH, ABILITIES } from './constants';
import { gameService } from './services/gameService';
import { audioService } from './services/audioService';
import { PALETTES } from './data/palettes';
import { TEXTS } from './data/narrative';
import { SwordIcon, MusicIcon, PlayIcon, RefreshIcon, CogIcon, StarIcon, BookOpenIcon, CloseIcon, FleeIcon, HeartIcon, SkullIcon } from './components/icons';
import { FightGameScreen } from './components/FightGame';
import { RhythmGameScreen } from './components/RhythmGame';
import { LoadingOverlay } from './components/LoadingOverlay';
import { MapScreen } from './components/MapScreen';
import { SettingsScreen } from './components/SettingsScreen';
import AbilitiesModal from './components/AbilitiesModal';
import { Sprite } from './components/Sprite';
import { BossFightScreen } from './components/BossFight';
import { RewardScreen } from './components/RewardScreen';
import { FadingWordText } from './components/FadingWordText';
import { AuraGauge } from './components/AuraGauge';
import { EncounterScreen } from './components/EncounterScreen';
import CheatAbilitySelector from './components/CheatAbilitySelector';

const GameLogo = React.memo(() => (
    <svg width="300" height="150" viewBox="0 0 300 150" className="drop-shadow-lg w-full max-w-lg">
        <defs>
            <linearGradient id="logo-gradient-primary" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="var(--color-primary)" />
                <stop offset="100%" stopColor="var(--color-accent)" />
            </linearGradient>
            <linearGradient id="logo-gradient-secondary" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="var(--color-secondary)" />
                <stop offset="100%" stopColor="var(--color-primary)" />
            </linearGradient>
             <filter id="logo-glow" x="-50%" y="-50%" width="200%" height="200%">
                <feGaussianBlur stdDeviation="4" result="coloredBlur" />
                <feMerge>
                    <feMergeNode in="coloredBlur" />
                    <feMergeNode in="SourceGraphic" />
                </feMerge>
            </filter>
        </defs>
        <g className="font-title" filter="url(#logo-glow)">
            <text x="50%" y="70" fill="url(#logo-gradient-primary)" textAnchor="middle" fontSize="64" letterSpacing="8">
                KEYA'S
            </text>
            <text x="50%" y="130" fill="url(#logo-gradient-secondary)" textAnchor="middle" fontSize="52" letterSpacing="4">
                JOURNEY
            </text>
        </g>
    </svg>
));
GameLogo.displayName = 'GameLogo';

type ResultInfo = { key: string; replacements?: Record<string, string | number> };
type LoadingInfo = { isVisible: boolean, message: string };
type EntryDirection = 'up' | 'down' | 'left' | 'right';

const QuitConfirmDialog = ({ onConfirm, onCancel, t }: { onConfirm: () => void, onCancel: () => void, t: (key: string) => string }) => (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center animate-pop-in z-50 p-4">
        <div className="w-full max-w-md glassmorphic-panel rounded-2xl p-6 sm:p-8 relative border-2 border-red-500/50">
            <h2 className="text-2xl font-title text-center text-red-400 mb-4">{t('settings.quitConfirm.title')}</h2>
            <p className="text-gray-300 text-center mb-8">{t('settings.quitConfirm.body')}</p>
            <div className="flex justify-center space-x-4">
                <button onClick={onCancel} className="font-title text-lg bg-gray-600 hover:bg-gray-500 text-white py-2 px-8 rounded-full">{t('settings.quitConfirm.cancel')}</button>
                <button onClick={onConfirm} className="font-title text-lg bg-red-600 hover:bg-red-500 text-white py-2 px-8 rounded-full">{t('settings.quitConfirm.confirm')}</button>
            </div>
        </div>
    </div>
);

const CheatCodePopup = ({ onApply, onClose, t }: { onApply: (code: string) => void, onClose: () => void, t: (key: string) => string }) => {
    const [code, setCode] = useState('');

    const handleSubmit = () => {
        onApply(code.trim().toLowerCase());
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            handleSubmit();
        } else if (e.key === 'Escape') {
            onClose();
        }
    }

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center animate-pop-in z-50 p-4">
            <div className="w-full max-w-md glassmorphic-panel rounded-2xl p-6 sm:p-8 relative border-2 border-[var(--color-accent)]/50">
                 <button onClick={onClose} aria-label={t('ui.close')} className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors">
                    <CloseIcon className="w-8 h-8"/>
                </button>
                <h2 className="text-2xl font-title text-center text-gray-200 mb-6 lowercase">{t('ui.cheatCode.title')}</h2>
                <input
                    type="text"
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    onKeyDown={handleKeyDown}
                    className="w-full p-3 rounded bg-black/30 border-2 border-white/20 text-white text-center text-lg tracking-widest"
                    placeholder={t('ui.cheatCode.placeholder')}
                    autoFocus
                />
                <div className="flex justify-center mt-6">
                    <button onClick={handleSubmit} className="font-title text-xl bg-[var(--color-primary)] hover:brightness-110 text-white py-3 px-10 rounded-full">{t('ui.cheatCode.activate')}</button>
                </div>
            </div>
        </div>
    );
};

interface CheatTeleportMenuProps {
    fullLabyrinth: MapTile[][][];
    onClose: () => void;
    onTeleport: (floorIndex: number, roomPos: { row: number, col: number }) => void;
    t: (key: string) => string;
}

const CheatTeleportMenu: React.FC<CheatTeleportMenuProps> = ({ fullLabyrinth, onClose, onTeleport, t }) => {
    
    const floorDestinations = fullLabyrinth.map((floorMap, floorIndex) => {
        const destinations: { name: string, pos: { row: number, col: number }, icon: React.ReactNode }[] = [];
        
        let bossPos: { row: number, col: number } | null = null;
        const healingRooms: { row: number, col: number }[] = [];
        const shrineRooms: { row: number, col: number }[] = [];

        floorMap.forEach((row, r) => {
            row.forEach((tile, c) => {
                if (tile.type === 'boss') bossPos = { row: r, col: c };
                if (tile.type === 'healing') healingRooms.push({ row: r, col: c });
                if (tile.type === 'shrine') shrineRooms.push({ row: r, col: c });
            });
        });
        
        if (bossPos) {
            destinations.push({ name: `Guardian / Boss`, pos: bossPos, icon: <SkullIcon className="w-5 h-5 mr-2 text-red-400" /> });
        }
        healingRooms.forEach((pos, i) => {
            destinations.push({ name: `Healing Fountain ${i+1}`, pos, icon: <HeartIcon className="w-5 h-5 mr-2 text-green-400" /> });
        });
        shrineRooms.forEach((pos, i) => {
            destinations.push({ name: `Shrine of Swiftness ${i+1}`, pos, icon: <StarIcon className="w-5 h-5 mr-2 text-cyan-400" /> });
        });

        return { floor: floorIndex + 1, destinations };
    });

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center animate-pop-in z-50 p-4">
            <div className="w-full max-w-4xl h-auto max-h-[90vh] glassmorphic-panel rounded-2xl p-6 sm:p-8 relative border-2 border-amber-400/50 shadow-amber-400/20 shadow-2xl flex flex-col">
                <button onClick={onClose} aria-label={t('ui.close')} className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors">
                    <CloseIcon className="w-8 h-8"/>
                </button>
                <h2 className="text-4xl font-title text-center text-amber-300 mb-6 flex-shrink-0">Labyrinth Teleport</h2>
                <div className="overflow-y-auto pr-2 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {floorDestinations.map(({ floor, destinations }) => (
                        <div key={floor} className="bg-black/20 p-4 rounded-lg border border-white/10">
                            <h3 className="font-title text-2xl text-purple-300 mb-3">Floor {floor}</h3>
                            <div className="space-y-2">
                                {destinations.length > 0 ? destinations.map(dest => (
                                    <button 
                                        key={`${floor}-${dest.name}`}
                                        onClick={() => onTeleport(floor - 1, dest.pos)}
                                        className="w-full flex items-center text-left p-2 rounded bg-slate-700/50 hover:bg-slate-600/50 text-white transition-colors"
                                    >
                                        {dest.icon} {dest.name}
                                    </button>
                                )) : (
                                    <p className="text-gray-500">No key locations found.</p>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

const SurpriseBossIntroScreen: React.FC<{ onContinue: () => void, t: (key: string) => string }> = ({ onContinue, t }) => {
    useEffect(() => {
        const timer = setTimeout(onContinue, 4000); // Show message for 4 seconds
        return () => clearTimeout(timer);
    }, [onContinue]);

    return (
        <div className="flex flex-col items-center justify-center h-full bg-black text-center p-4">
            <div className="max-w-prose">
                <FadingWordText text={t('ui.surpriseBossMessage')} />
            </div>
        </div>
    );
};


const App = () => {
    const [gameState, setGameState] = useState<GameState>(GameState.START_SCREEN);
    const [playerState, setPlayerState] = useState<PlayerState | null>(null);
    const [gameStats, setGameStats] = useState<GameStats>({ fights: 0, dances: 0, encountersDefeated: 0, bossDefeated: false, difficulty: 'Normal' });
    const [mapState, setMapState] = useState<MapTile[][]>([]);
    const [fullLabyrinth, setFullLabyrinth] = useState<MapTile[][][] | null>(null);
    const [starMap, setStarMap] = useState<StarMap>({});
    const [currentEncounter, setCurrentEncounter] = useState<Encounter | null>(null);
    const [resultInfo, setResultInfo] = useState<ResultInfo | null>(null);
    const [loadingInfo, setLoadingInfo] = useState<LoadingInfo>({ isVisible: false, message: '' });
    const [error, setError] = useState<string>('');
    const [settings, setSettings] = useState<GameSettings>({ masterVolume: 0.15, musicVolume: 1, sfxVolume: 0.7, palette: 'Celestial', paletteCycle: true, language: 'en' });
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    const [isAbilitiesModalOpen, setIsAbilitiesModalOpen] = useState(false);
    const [isTransitioning, setIsTransitioning] = useState(false);
    const [unlockedEndings, setUnlockedEndings] = useState<UnlockedEnding[]>([]);
    const [availableAbilities, setAvailableAbilities] = useState<(FightMove | DanceMove)[]>([]);
    const [availableBoons, setAvailableBoons] = useState<BoonId[]>([]);
    const [lastRewards, setLastRewards] = useState<Ability[]>([]);
    const [labyrinthName, setLabyrinthName] = useState('The Labyrinth');
    const [auraUpdateInfo, setAuraUpdateInfo] = useState<{ old: number; new: number } | null>(null);
    const [powerUp, setPowerUp] = useState<{type: 'speed', duration: number} | null>(null);
    const [mapRemountKey, setMapRemountKey] = useState(0);
    const [nextStateAfterResult, setNextStateAfterResult] = useState<GameState | null>(null);
    const [lastEncounterWasGuardian, setLastEncounterWasGuardian] = useState(false);
    const [entryDirection, setEntryDirection] = useState<EntryDirection | null>(null);
    const [gameOverEndingLogged, setGameOverEndingLogged] = useState(false);
    const [isDescending, setIsDescending] = useState(false);
    const [isQuitConfirmVisible, setIsQuitConfirmVisible] = useState(false);
    const [isCheatPopupOpen, setIsCheatPopupOpen] = useState(false);
    const [isCheatAbilitySelectorOpen, setIsCheatAbilitySelectorOpen] = useState(false);
    const [isTeleportMenuOpen, setIsTeleportMenuOpen] = useState(false);
    const [cheatsUsed, setCheatsUsed] = useState({ allAbilities: false });
    const [healthBarAnimKey, setHealthBarAnimKey] = useState(0);
    const [isRadianceFlashing, setIsRadianceFlashing] = useState(false);
    const [resonanceVfx, setResonanceVfx] = useState<'fight' | 'dance' | null>(null);
    const isDescendingRef = useRef(false);
    const [lastEncounterAction, setLastEncounterAction] = useState<'fight' | 'dance' | null>(null);

    const playerStateRef = useRef(playerState);
    useEffect(() => {
        playerStateRef.current = playerState;
    }, [playerState]);

    const isGamePaused = isSettingsOpen || isAbilitiesModalOpen || isQuitConfirmVisible || isCheatPopupOpen || isCheatAbilitySelectorOpen || isTeleportMenuOpen || isDescending;
    const isGameInProgress = gameState !== GameState.START_SCREEN;
    
    const t = useCallback((key: string, replacements?: Record<string, string | number>) => {
        const lang = settings.language;
        let textToTranslate: any = TEXTS;
        
        try {
            let current = textToTranslate[lang];
            if (!current) current = TEXTS.en; // Fallback to English if language pack not found

            for (const k of key.split('.')) {
                if (current === undefined || current === null) { current = undefined; break; }
                current = current[k];
            }
            
            if (typeof current !== 'string') {
                current = TEXTS.en;
                for (const k of key.split('.')) {
                   if (current === undefined || current === null) { current = undefined; break; }
                   current = current[k];
                }
            }

            if (typeof current !== 'string') {
                console.warn(`Translation key not found: ${key}`);
                return key;
            }
            
            let processedText: string = current;
            if (replacements) {
                Object.entries(replacements).forEach(([rKey, value]) => {
                    processedText = processedText.replace(`{{${rKey}}}`, String(value));
                });
            }
            return processedText;
        } catch (e) {
            console.error(`Error translating key: ${key}`, e);
            return key;
        }
    }, [settings.language]);

    useEffect(() => {
        try {
            const savedSettings = localStorage.getItem('gameSettings');
            if (savedSettings) {
                const parsed = JSON.parse(savedSettings);
                if (!['en', 'pt', 'es'].includes(parsed.language)) {
                    parsed.language = 'en';
                }
                setSettings(s => ({...s, ...parsed}));
            } else {
                 setSettings({ masterVolume: 0.15, musicVolume: 1, sfxVolume: 0.7, palette: 'Celestial', paletteCycle: true, language: 'en' });
            }
            const savedEndings = localStorage.getItem('unlockedEndings');
            if (savedEndings) {
                setUnlockedEndings(JSON.parse(savedEndings));
            }
        } catch (e) {
            console.error("Failed to load data from localStorage", e);
        }
        audioService.init();
    }, []);

    useEffect(() => {
        if (isGamePaused) {
            audioService.suspend();
        } else {
            audioService.resume();
        }
    }, [isGamePaused]);

    useEffect(() => {
        if (!settings.paletteCycle || isGamePaused) {
            return;
        }

        const paletteNames = Object.keys(PALETTES);
        const cycleInterval = 30000; // 30 seconds

        const timer = setInterval(() => {
            setSettings(currentSettings => {
                if (!currentSettings.paletteCycle) return currentSettings;
                const currentIndex = paletteNames.indexOf(currentSettings.palette);
                const nextIndex = (currentIndex + 1) % paletteNames.length;
                return { ...currentSettings, palette: paletteNames[nextIndex] };
            });
        }, cycleInterval);

        return () => clearInterval(timer);
    }, [settings.paletteCycle, isGamePaused]);

    useEffect(() => {
        if (powerUp && !isGamePaused && gameState === GameState.MAP) {
            const timer = setTimeout(() => {
                const newDuration = powerUp.duration - 1;
                if (newDuration <= 0) {
                    setPowerUp(null);
                } else {
                    setPowerUp({ ...powerUp, duration: newDuration });
                }
            }, 1000);
            return () => clearTimeout(timer);
        }
    }, [powerUp, isGamePaused, gameState]);

    useEffect(() => {
        if (playerState?.abilities.includes('boon_star_regen_1') && !isGamePaused && gameState === GameState.MAP) {
            const interval = setInterval(() => {
                setPlayerState(p => p ? { ...p, starPower: p.starPower + 1 } : null);
            }, 8000); // 1 star every 8 seconds
            return () => clearInterval(interval);
        }
    }, [playerState?.abilities, isGamePaused, gameState]);

    useEffect(() => {
        try {
            localStorage.setItem('gameSettings', JSON.stringify(settings));
        } catch (e) {
            console.error("Failed to save settings to localStorage", e);
        }
    }, [settings]);

    useEffect(() => {
        audioService.updateVolume(settings);
    }, [settings.masterVolume, settings.musicVolume, settings.sfxVolume]);

    useEffect(() => {
        const activePalette = Object.values(PALETTES).find(p => p.name === settings.palette);
        if (activePalette) {
            const root = document.documentElement;
            root.style.setProperty('--color-bg', activePalette.bg);
            root.style.setProperty('--color-primary', activePalette.primary);
            root.style.setProperty('--color-secondary', activePalette.secondary);
            root.style.setProperty('--color-accent', activePalette.accent);
        }
    }, [settings.palette]);

    useEffect(() => {
        if (playerState) {
            audioService.updateAlignment(playerState.alignment);
        }
    }, [playerState?.alignment]);

    useEffect(() => {
      switch (gameState) {
        case GameState.START_SCREEN:
        case GameState.ACTION_RESULT:
        case GameState.ENDINGS_GALLERY:
        case GameState.REWARD_SCREEN:
        case GameState.AURA_UPDATE:
        case GameState.CREDITS:
        case GameState.SURPRISE_BOSS_INTRO:
          audioService.startSong('menu');
          break;
        case GameState.GAME_OVER:
          audioService.startSong('gameOver');
          break;
        case GameState.ENDING:
           if (gameStats.bossDefeated) {
                audioService.startSong('victory');
            } else {
                audioService.startSong('menu');
            }
            break;
        case GameState.MAP:
           audioService.startSong('map', playerState?.currentFloor);
           break;
        case GameState.FIGHT_GAME:
          if (currentEncounter?.isGuardian || currentEncounter?.isBoss) {
            audioService.startSong('guardian');
          } else {
            audioService.startSong('fight');
          }
          break;
        case GameState.RHYTHM_GAME:
          // Rhythm game handles its own music start via generateRhythmTrack, including stopping previous tracks.
          break;
        case GameState.BOSS_FIGHT:
          audioService.startSong('boss', playerState?.alignment);
          break;
      }
    }, [gameState, currentEncounter, playerState?.currentFloor, playerState?.alignment, gameStats.bossDefeated]);

    const handleGameOver = useCallback(() => {
        if (gameOverEndingLogged) {
            setGameState(GameState.GAME_OVER);
            return;
        }

        const newEndingPath = 'GAME_OVER';
        const newDifficulty = gameStats.difficulty;
        
        setUnlockedEndings(prev => {
            const existingEndingIndex = prev.findIndex(e => e.path === newEndingPath);
            const newEndingsList = [...prev];

            if (existingEndingIndex > -1) {
                const existingEnding = newEndingsList[existingEndingIndex];
                const newDifficulties = Array.from(new Set([...existingEnding.difficulties, newDifficulty]));
                newEndingsList[existingEndingIndex] = { ...existingEnding, difficulties: newDifficulties };
            } else {
                newEndingsList.push({
                    path: newEndingPath,
                    firstUnlocked: {
                        key: 'endings.GAME_OVER.text.0',
                        timestamp: Date.now()
                    },
                    difficulties: [newDifficulty]
                });
            }
            
            try {
                localStorage.setItem('unlockedEndings', JSON.stringify(newEndingsList));
            } catch (e) {
                console.error("Failed to save endings to localStorage", e);
            }
            return newEndingsList;
        });
        setGameOverEndingLogged(true);
        setGameState(GameState.GAME_OVER);
    }, [gameOverEndingLogged, gameStats.difficulty]);

    const startGame = useCallback((difficulty: Difficulty) => {
        setGameStats({ fights: 0, dances: 0, encountersDefeated: 0, bossDefeated: false, difficulty });
        setError('');
        setLoadingInfo({ isVisible: true, message: t('ui.loadingLabyrinth') });
        setPowerUp(null);
        setEntryDirection(null);
        setGameOverEndingLogged(false);
        setCheatsUsed({ allAbilities: false });
        
        gameService.initializeGame();

        const languagePack = (TEXTS as any)[settings.language] || TEXTS.en;
        let newLabyrinthName = 'The Labyrinth';

        if ((settings.language === 'pt' || settings.language === 'es') && typeof languagePack.labyrinth.nouns[0] === 'object') {
            const nouns = languagePack.labyrinth.nouns as { word: string; gender: 'm' | 'f' }[];
            const adjectives = languagePack.labyrinth.adjectives as ({ base: string } | { m: string, f: string })[];
            const templates = languagePack.labyrinth.nameTemplates as { m: string, f: string };

            const randomNoun = gameService.getRandomItem(nouns);
            const randomAdjData = gameService.getRandomItem(adjectives);

            const nounWord = randomNoun.word;
            const nounGender = randomNoun.gender;

            const adjWord = 'base' in randomAdjData ? randomAdjData.base : randomAdjData[nounGender];
            const template = templates[nounGender];
            
            if (adjWord) {
              newLabyrinthName = template.replace('{{noun}}', nounWord).replace('{{adj}}', adjWord);
            }
        } else {
            const adj = gameService.getRandomItem(languagePack.labyrinth.adjectives);
            const noun = gameService.getRandomItem(languagePack.labyrinth.nouns);
            newLabyrinthName = t('ui.labyrinthName', {adj: adj as string, noun: noun as string});
        }
        setLabyrinthName(newLabyrinthName);
        
        const allDroppableAbilities = Object.keys(ABILITIES).filter(id => ABILITIES[id].type !== 'boon' && !['vine', 'echo'].includes(id)) as (FightMove | DanceMove)[];
        setAvailableAbilities(gameService.shuffle(allDroppableAbilities));

        const allBoons = Object.keys(ABILITIES).filter(id => ABILITIES[id].type === 'boon') as BoonId[];
        setAvailableBoons(gameService.shuffle(allBoons));
        
        const initialPlayerState: PlayerState = {
            position: { row: 0, col: 0 },
            health: MAX_PLAYER_HEALTH,
            maxHealth: MAX_PLAYER_HEALTH,
            abilities: ['vine', 'echo'],
            starPower: 0,
            alignment: 0,
            currentFloor: 1,
        };

        const allFloors: MapTile[][][] = [];
        const allStarMaps: StarMap[] = [];
        let startPosFloor1 = { row: 0, col: 0 };
        const hasStarBoon = initialPlayerState.abilities.includes('boon_stars_1');

        for (let floor = 1; floor <= 5; floor++) {
            const isFinalFloor = floor === 5;
            const rows = isFinalFloor ? 7 : 5;
            const cols = isFinalFloor ? 11 : 7;
            const newMap = generateLabyrinth(rows, cols, floor);
            const newStarMapForFloor: StarMap = {};
            let startPos = { row: 0, col: 0 };
            
            const bossEncounter = isFinalFloor ? gameService.generateFinalBoss() : gameService.generateMiniboss(floor);

            newMap.forEach((row, r) => {
                row.forEach((tile, c) => {
                    const roomSeed = `${r}-${c}-${floor}`;
                    if (tile.type === 'start') startPos = { row: r, col: c };
                    if (tile.type === 'boss') newMap[r][c].encounter = bossEncounter;
                    if (tile.type === 'encounter') newMap[r][c].encounter = gameService.generateEncounter();
                    
                    if(tile.type !== 'empty') {
                        const obstacles = tile.obstacles || [];
                        const roomHash = gameService.simpleHash(roomSeed);
                        const baseStarCount = hasStarBoon ? 4 : 2;
                        const starCount = baseStarCount + (Math.abs(roomHash) % 4);
                        const roomStars: CollectibleStar[] = [];

                        for(let i=0; i < starCount; i++) {
                            let isColliding = true;
                            let newStarX = 0, newStarY = 0;
                            let attempts = 0;
                            while(isColliding && attempts < 20) {
                                const starHash = gameService.simpleHash(roomSeed + i + attempts);
                                newStarX = 15 + (Math.abs(starHash) % 70);
                                newStarY = 15 + (Math.abs(gameService.simpleHash(roomSeed+i+1+attempts)) % 70);
                                
                                isColliding = obstacles.some(obs => {
                                    const starRect = { left: newStarX - 3, right: newStarX + 3, top: newStarY - 3, bottom: newStarY + 3 };
                                    const obsRect = { left: obs.x - obs.width/2, right: obs.x + obs.width/2, top: obs.y - obs.height/2, bottom: obs.y + obs.height/2 };
                                    return starRect.left < obsRect.right && starRect.right > obsRect.left && starRect.top < obsRect.bottom && starRect.bottom > obsRect.top;
                                });
                                attempts++;
                            }
                            
                            if(!isColliding) {
                                 roomStars.push({ id: gameService.simpleHash(roomSeed + i), x: newStarX, y: newStarY, collected: false, scale: 1 });
                            }
                        }
                        newStarMapForFloor[roomSeed] = roomStars;
                    }
                });
            });
            allFloors.push(newMap);
            allStarMaps.push(newStarMapForFloor);
            if (floor === 1) {
                startPosFloor1 = startPos;
            }
        }
        
        setFullLabyrinth(allFloors);
        const combinedStarMap = allStarMaps.reduce((acc, current) => ({...acc, ...current}), {});
        setStarMap(combinedStarMap);

        initialPlayerState.position = startPosFloor1;

        setPlayerState(initialPlayerState);
        setMapState(allFloors[0]);
        
        setTimeout(() => {
             setGameState(GameState.MAP);
             setMapRemountKey(k => k + 1);
             setLoadingInfo({ isVisible: false, message: '' });
        }, 1000);
    }, [t, settings.language]);

    const handleStarCollect = useCallback((roomId: string, starId: number) => {
        setStarMap(prevMap => {
            const roomStars = prevMap[roomId];
            if (!roomStars) return prevMap;
            const starIndex = roomStars.findIndex(s => s.id === starId && !s.collected);
            if (starIndex === -1) return prevMap;

            const hasStarBoon = playerState?.abilities.includes('boon_stars_1');
            audioService.playSfx(hasStarBoon ? 'collect_enhanced' : 'collect');

            setPlayerState(p => p ? ({ ...p, starPower: p.starPower + 1 }) : null);

            const newRoomStars = [...roomStars];
            newRoomStars[starIndex] = { ...newRoomStars[starIndex], collected: true };
            return { ...prevMap, [roomId]: newRoomStars };
        });
    }, [playerState]);

    const handlePlayerHeal = useCallback((amount: number) => {
        setPlayerState(p => {
            if (!p || p.health >= p.maxHealth) return p;
            const newHealth = Math.min(p.maxHealth, p.health + amount);
            if (newHealth > p.health) audioService.playSfx('heal');
            return { ...p, health: newHealth };
        });
    }, []);

    const handleSpendStarsForHealth = useCallback((starCost: number, healthGain: number) => {
        setPlayerState(p => {
            if (!p || p.starPower < starCost || p.health >= p.maxHealth) return p;
            audioService.playSfx('heal');
            const newHealth = Math.min(p.maxHealth, p.health + healthGain);
            return { ...p, health: newHealth, starPower: p.starPower - starCost };
        });
    }, []);

    const handlePlayerDamage = useCallback((damage: number) => {
        setPlayerState(p => {
            if (!p) return null;
            audioService.playSfx('damage_spike');
            const newHealth = p.health - damage;
            if (newHealth <= 0) {
                handleGameOver();
                return { ...p, health: 0 };
            }
            return { ...p, health: newHealth };
        });
    }, [handleGameOver]);

    const handleMove = useCallback((newPosition: { row: number, col: number }) => {
        if (!playerState || isTransitioning) return;

        const oldPos = playerState.position;
        let direction: EntryDirection | null = null;
        if (newPosition.row < oldPos.row) direction = 'down'; // Moved UP, so entered from BOTTOM
        else if (newPosition.row > oldPos.row) direction = 'up'; // Moved DOWN, so entered from TOP
        else if (newPosition.col < oldPos.col) direction = 'right'; // Moved LEFT, so entered from RIGHT
        else if (newPosition.col > oldPos.col) direction = 'left'; // Moved RIGHT, so entered from LEFT
        setEntryDirection(direction);

        audioService.playSfx('move');
        setIsTransitioning(true);
        
        setTimeout(() => {
            let newMapState = JSON.parse(JSON.stringify(mapState));
            newMapState[playerState.position.row][playerState.position.col].visited = true;

            setPlayerState(p => ({ ...p!, position: newPosition }));
            
            setMapState(newMapState);
            setMapRemountKey(k => k + 1);
            setIsTransitioning(false);
        }, 300);

    }, [playerState, mapState, isTransitioning]);

    const handlePitUse = useCallback((pairId?: number) => {
        if (!playerState || pairId === undefined) return;
        
        setMapState(ms => {
            const newMap = JSON.parse(JSON.stringify(ms));
            const tile = newMap[playerState.position.row][playerState.position.col];
            if (tile.obstacles) {
                tile.obstacles.forEach(obs => {
                    if (obs.pairId === pairId) {
                        obs.isUsed = true;
                    }
                });
            }
            return newMap;
        });
    }, [playerState]);
    
    const handleConfront = useCallback(() => {
        if (!playerState) return;
        const tile = mapState[playerState.position.row][playerState.position.col];
        if ((tile.type === 'encounter' || tile.type === 'boss') && tile.encounter) {
            setCurrentEncounter(tile.encounter);
            setEntryDirection(null);
            if (tile.encounter.isBoss) {
                setGameState(GameState.BOSS_FIGHT);
            } else {
                setGameState(GameState.ENCOUNTER);
            }
        }
    }, [playerState, mapState]);

    const handleChoice = useCallback((choice: 'fight' | 'dance') => {
        if (!currentEncounter) return;
        audioService.playSfx('click');
        setGameState(choice === 'fight' ? GameState.FIGHT_GAME : GameState.RHYTHM_GAME);
    }, [currentEncounter]);

    const handleFleeEncounter = (success: boolean) => {
        if (success) {
            audioService.playSfx('dodge');
            setResultInfo({ key: 'results.flee.success' });
            setGameState(GameState.ACTION_RESULT);
        } else {
            audioService.playSfx('miss');
            setPlayerState(p => {
                if (!p) return null;
                const newHealth = Math.max(0, p.health - 5);
                 if (newHealth <= 0) {
                    handleGameOver();
                    return { ...p, health: 0 };
                }
                setResultInfo({ key: 'results.flee.fail', replacements: { damage: 5 } });
                setGameState(GameState.ACTION_RESULT);
                return { ...p, health: newHealth };
            });
        }
    };
    
    const onGameComplete = useCallback((type: 'fight' | 'dance', success: boolean, fled: boolean = false) => {
        const playerState = playerStateRef.current;
        if (!currentEncounter || !playerState) return;

        if (fled) {
            setResultInfo({ key: 'ui.fightGame.fleeSuccess' });
            setGameState(GameState.ACTION_RESULT);
            return;
        }

        if (success) {
            audioService.playSfx(type === 'fight' ? 'win_fight' : 'win_dance');
            
            setMapState(ms => {
                const updatedMap = JSON.parse(JSON.stringify(ms));
                updatedMap[playerState.position.row][playerState.position.col].type = 'cleared';
                delete updatedMap[playerState.position.row][playerState.position.col].encounter;
                return updatedMap;
            });
            
            const isGuardian = !!currentEncounter.isGuardian;

            if (isGuardian && playerState.currentFloor === 4) {
                setLastEncounterAction(type);
                setLastEncounterWasGuardian(true); 

                setGameStats(newStats => {
                    const updatedStats = { ...newStats };
                    if (type === 'fight') updatedStats.fights++; else updatedStats.dances++;
                    updatedStats.encountersDefeated++;
                    return updatedStats;
                });
                
                setPlayerState(p => {
                    if (!p) return null;
                    const alignmentChange = type === 'fight' ? -15 : 15;
                    const oldAlignment = p.alignment;
                    const newAlignment = Math.max(-50, Math.min(50, p.alignment + alignmentChange));
                    setAuraUpdateInfo({ old: oldAlignment, new: newAlignment });
                    return { ...p, alignment: newAlignment };
                });

                setGameState(GameState.SURPRISE_BOSS_INTRO);
                return;
            }

            const newRewards: Ability[] = [];
            let nextAvailableBoons = [...availableBoons];
            let nextAvailableAbilities = [...availableAbilities];

            if (cheatsUsed.allAbilities) {
                // No rewards if cheat is active
            } else if (isGuardian) {
                setLastEncounterWasGuardian(true);

                // 1. Guaranteed Boon
                let chosenBoonId: BoonId | undefined;
                const isLastGuardian = playerState.currentFloor === 4;

                if (isLastGuardian && Math.random() < 0.7 && !playerState.abilities.includes('boon_combat_medic_1')) {
                    const medicBoonIndex = nextAvailableBoons.indexOf('boon_combat_medic_1');
                    if (medicBoonIndex > -1) {
                        chosenBoonId = nextAvailableBoons.splice(medicBoonIndex, 1)[0];
                    }
                }
                
                if (!chosenBoonId && nextAvailableBoons.length > 0) {
                    chosenBoonId = nextAvailableBoons.shift();
                }

                if (chosenBoonId) {
                    newRewards.push(ABILITIES[chosenBoonId]);
                }

                // 2. Guaranteed Powerup (Fight/Dance)
                const fightPool = nextAvailableAbilities.filter(id => ABILITIES[id]?.type === 'fight');
                const dancePool = nextAvailableAbilities.filter(id => ABILITIES[id]?.type === 'dance');
                
                let wantsFightChance = 0.5;
                if (playerState.alignment < -10) wantsFightChance = 0.8;
                else if (playerState.alignment > 10) wantsFightChance = 0.2;
                else wantsFightChance = (type === 'fight') ? 0.75 : 0.25;

                let chosenPowerupId: FightMove | DanceMove | undefined;
                if (Math.random() < wantsFightChance) {
                    if (fightPool.length > 0) chosenPowerupId = fightPool[Math.floor(Math.random() * fightPool.length)];
                    else if (dancePool.length > 0) chosenPowerupId = dancePool[Math.floor(Math.random() * dancePool.length)];
                } else {
                    if (dancePool.length > 0) chosenPowerupId = dancePool[Math.floor(Math.random() * dancePool.length)];
                    else if (fightPool.length > 0) chosenPowerupId = fightPool[Math.floor(Math.random() * fightPool.length)];
                }

                if (chosenPowerupId) {
                    newRewards.push(ABILITIES[chosenPowerupId]);
                    nextAvailableAbilities = nextAvailableAbilities.filter(id => id !== chosenPowerupId);
                }

            } else { // Regular Spirit
                const dropChance = 0.70;
                if (Math.random() < dropChance) {
                    const isBoonChance = 0.15;
                    if (Math.random() < isBoonChance && nextAvailableBoons.length > 0) {
                        const chosenBoonId = nextAvailableBoons.shift();
                        if (chosenBoonId) newRewards.push(ABILITIES[chosenBoonId]);
                    } else if (nextAvailableAbilities.length > 0) {
                        const chosenAbilityId = nextAvailableAbilities.shift();
                        if (chosenAbilityId) newRewards.push(ABILITIES[chosenAbilityId]);
                    }
                }
            }
            
            if (newRewards.length > 0) {
                setLastRewards(newRewards);
                setAvailableBoons(nextAvailableBoons);
                setAvailableAbilities(nextAvailableAbilities);
                audioService.playSfx('treasure');
            }

            setPlayerState(p => {
                if (!p) return null;
                
                const alignmentChange = type === 'fight' ? (isGuardian ? -15 : -2) : (isGuardian ? 15 : 2);

                const newStats = { ...gameStats };
                
                if (type === 'fight') newStats.fights++; else newStats.dances++;
                newStats.encountersDefeated++;
                
                setGameStats(newStats);
                
                const outcomeKey = gameService.generateOutcomeKey(type, settings.language);
                setResultInfo({ key: outcomeKey });

                const oldAlignment = p.alignment;
                const newAlignment = Math.max(-50, Math.min(50, p.alignment + alignmentChange));
                
                let updatedPlayer = { ...p, alignment: newAlignment };

                if (p.abilities.includes('boon_resonance_1')) {
                    if (type === 'fight') {
                        updatedPlayer.health = Math.min(p.maxHealth, p.health + 5);
                        audioService.playSfx('boon_resonance_heal');
                    } else { // Dance
                        const maxHealthIncrease = 2;
                        updatedPlayer.maxHealth += maxHealthIncrease;
                        updatedPlayer.health = Math.min(updatedPlayer.maxHealth, p.health + maxHealthIncrease);
                        audioService.playSfx('boon_resonance_empower');
                        setHealthBarAnimKey(k => k + 1);
                    }
                    setResonanceVfx(type);
                }

                if (isGuardian) {
                    setAuraUpdateInfo({ old: oldAlignment, new: newAlignment });
                    setNextStateAfterResult(GameState.AURA_UPDATE);
                } else if (lastEncounterWasGuardian && auraUpdateInfo) {
                    setNextStateAfterResult(GameState.AURA_UPDATE);
                }
                setGameState(GameState.ACTION_RESULT);

                return updatedPlayer;
            });
            return;
        }

        if (!success) {
            if (type === 'fight') {
                setPlayerState(p => p ? { ...p, health: 0 } : null);
                handleGameOver();
            } else if (type === 'dance') {
                const dancePenalty = 20;
                setPlayerState(p => {
                    if (!p) return null;
                    const newHealth = p.health - dancePenalty;
                    if (newHealth <= 0) {
                        handleGameOver();
                        return { ...p, health: 0 };
                    }
                    
                    if (lastEncounterWasGuardian && currentEncounter?.isBoss) { // This means we failed the SURPRISE BOSS
                        setMapState(ms => {
                            const updatedMap = JSON.parse(JSON.stringify(ms));
                            updatedMap[p.position.row][p.position.col].type = 'encounter';
                            updatedMap[p.position.row][p.position.col].encounter = currentEncounter;
                            return updatedMap;
                        });
                    }

                    setResultInfo({ key: 'results.dance.fail', replacements: { damage: dancePenalty } });
                    setGameState(GameState.ACTION_RESULT);
                    return { ...p, health: newHealth };
                });
            }
        }
    }, [currentEncounter, gameStats, availableAbilities, availableBoons, settings.language, handleGameOver, cheatsUsed.allAbilities, auraUpdateInfo, lastEncounterWasGuardian]);

    const onFinalBossComplete = useCallback((victory: boolean, finalChoice?: 'embrace' | 'destroy') => {
        if (!playerState) return;

        if (!victory) {
             setPlayerState(p => p ? { ...p, health: 0 } : null);
             handleGameOver();
             return;
        }

        let finalPlayerState = { ...playerState };
        let finalStats = { ...gameStats, bossDefeated: true };
    
        if (finalChoice) {
            if (finalChoice === 'embrace') {
                finalStats.dances++;
                finalPlayerState.alignment = Math.max(-50, Math.min(50, finalPlayerState.alignment + 15));
            } else { // 'destroy'
                finalStats.fights++;
                finalPlayerState.alignment = Math.max(-50, Math.min(50, finalPlayerState.alignment - 15));
            }
        }
        
        setGameStats(finalStats);
        const currentPlayerStateForEnding = finalPlayerState;
        setPlayerState(currentPlayerStateForEnding);

        audioService.playSfx('victory');
        
        const { endingKey, path } = gameService.generateEnding(currentPlayerStateForEnding, settings.language);
        setResultInfo({ key: endingKey });
        
        const newDifficulty = finalStats.difficulty;
        
        setUnlockedEndings(prev => {
            const existingEndingIndex = prev.findIndex(e => e.path === path);
            const newEndingsList = [...prev];

            if (existingEndingIndex > -1) {
                const existingEnding = newEndingsList[existingEndingIndex];
                const newDifficulties = Array.from(new Set([...existingEnding.difficulties, newDifficulty]));
                newEndingsList[existingEndingIndex] = { ...existingEnding, difficulties: newDifficulties };
            } else {
                 newEndingsList.push({
                    path,
                    firstUnlocked: {
                        key: endingKey,
                        timestamp: Date.now()
                    },
                    difficulties: [newDifficulty]
                });
            }
            
            try {
                localStorage.setItem('unlockedEndings', JSON.stringify(newEndingsList));
            } catch (e) {
                console.error("Failed to save endings to localStorage", e);
            }
            return newEndingsList;
        });

        setGameState(GameState.ENDING);
    }, [playerState, gameStats, settings.language, handleGameOver]);

    const goToNextFloor = useCallback(() => {
        if (!playerState || playerState.currentFloor >= 5 || isDescendingRef.current || !fullLabyrinth) return;
        
        isDescendingRef.current = true;

        const performDescend = () => {
            const targetFloor = playerState.currentFloor + 1;
            setIsDescending(true);
            setLoadingInfo({ isVisible: true, message: t('ui.loadingFloor', { floor: targetFloor }) });
            
            setTimeout(() => {
                const nextFloorMap = fullLabyrinth[targetFloor - 1];
                let startPos = { row: 0, col: 0 };
                nextFloorMap.forEach((row, r) => {
                    row.forEach((tile, c) => {
                        if (tile.type === 'start') startPos = { row: r, col: c };
                    });
                });

                setPlayerState(p => {
                    if (!p) return null;

                    let newPlayerState = { ...p, currentFloor: targetFloor, position: startPos };

                    if (newPlayerState.abilities.includes('boon_radiance_1')) {
                        newPlayerState.health = Math.min(newPlayerState.maxHealth, p.health + 50);
                    }
                    return newPlayerState;
                });
                setMapState(nextFloorMap);
                
                setEntryDirection(null);
                setLoadingInfo({ isVisible: false, message: '' });
                setMapRemountKey(k => k + 1);
                setGameState(GameState.MAP);
                setIsDescending(false);
                isDescendingRef.current = false;
            }, 1500);
        };

        if (playerState.abilities.includes('boon_radiance_1')) {
            setIsRadianceFlashing(true);
            audioService.playSfx('boon_radiance_heal');
            setTimeout(() => {
                setIsRadianceFlashing(false);
                performDescend();
            }, 800);
        } else {
            performDescend();
        }
    }, [playerState, t, fullLabyrinth]);

    const handleDescend = useCallback(() => {
        goToNextFloor();
    }, [goToNextFloor]);

    const continueFromResults = useCallback(() => {
        audioService.playSfx('click');
        setResonanceVfx(null);

        if (nextStateAfterResult) {
            setGameState(nextStateAfterResult);
            setNextStateAfterResult(null);
            return;
        }

        if (lastRewards.length > 0) {
            setGameState(GameState.REWARD_SCREEN);
        } else {
            setCurrentEncounter(null);
            setMapRemountKey(k => k + 1);
            setGameState(GameState.MAP);
        }
    }, [lastRewards, nextStateAfterResult]);

    const continueFromAuraUpdate = useCallback(() => {
        audioService.playSfx('click');
         if (lastRewards.length > 0) {
            setGameState(GameState.REWARD_SCREEN);
        } else {
            setLastEncounterWasGuardian(false);
            setMapState(ms => {
                if (!playerState) return ms;
                const newMap = JSON.parse(JSON.stringify(ms));
                newMap[playerState.position.row][playerState.position.col].hasDescentHole = true;
                return newMap;
            });
            setCurrentEncounter(null);
            setMapRemountKey(k => k + 1);
            setGameState(GameState.MAP);
        }
        setAuraUpdateInfo(null);
    }, [lastRewards, playerState]);

    const continueFromReward = useCallback(() => {
        audioService.playSfx('click');
        if (lastRewards.length === 0) return;

        const currentReward = lastRewards[0];
        
        setPlayerState(p => {
            if (!p || p.abilities.includes(currentReward.id)) return p;
            
            let newPlayerState = { ...p, abilities: [...p.abilities, currentReward.id] };

            if (currentReward.type === 'boon') {
                switch(currentReward.id) {
                    case 'boon_max_hp_1':
                        newPlayerState.maxHealth += 20;
                        newPlayerState.health += 20;
                        audioService.playSfx('boon_vitality');
                        setHealthBarAnimKey(k => k + 1);
                        break;
                    case 'boon_speed_1':
                        audioService.playSfx('boon_haste');
                        break;
                    case 'boon_compass_1':
                        audioService.playSfx('boon_direction');
                        break;
                    case 'boon_radiance_1':
                        audioService.playSfx('boon_radiance');
                        break;
                }
            }
            
            return newPlayerState;
        });

        const remainingRewards = lastRewards.slice(1);
        setLastRewards(remainingRewards);

        if (remainingRewards.length === 0) {
            const wasGuardian = lastEncounterWasGuardian;
            
            if (wasGuardian && auraUpdateInfo) {
                setGameState(GameState.AURA_UPDATE);
            } else if (wasGuardian) {
                setLastEncounterWasGuardian(false);
                setCurrentEncounter(null);
                setMapState(ms => {
                    if (!playerState) return ms;
                    const newMap = JSON.parse(JSON.stringify(ms));
                    newMap[playerState.position.row][playerState.position.col].hasDescentHole = true;
                    return newMap;
                });
                setMapRemountKey(k => k + 1);
                setGameState(GameState.MAP);
            } else {
                setLastEncounterWasGuardian(false);
                setCurrentEncounter(null);
                setMapRemountKey(k => k + 1);
                setGameState(GameState.MAP);
            }
        }
    }, [lastRewards, lastEncounterWasGuardian, playerState, auraUpdateInfo]);

    const returnToMainMenu = useCallback(() => {
        audioService.playSfx('click');
        setGameState(GameState.START_SCREEN);
        setResultInfo(null);
        setLastRewards([]);
    }, []);

    const handleQuitRequest = () => {
        audioService.playSfx('click');
        setIsQuitConfirmVisible(true);
    };

    const confirmQuit = () => {
        audioService.playSfx('click');
        setIsQuitConfirmVisible(false);
        setIsSettingsOpen(false);
        returnToMainMenu();
    };

    const cancelQuit = useCallback(() => {
        audioService.playSfx('click');
        setIsQuitConfirmVisible(false);
    }, []);

    const openSettings = useCallback(() => {
        audioService.playSfx('click');
        setIsSettingsOpen(true);
    }, []);

    const closeSettings = useCallback(() => {
        audioService.playSfx('click');
        setIsSettingsOpen(false);
    }, []);
    
    const openEndingsGallery = useCallback(() => {
        audioService.playSfx('click');
        setGameState(GameState.ENDINGS_GALLERY);
    }, []);
    
    const openCredits = useCallback(() => {
        audioService.playSfx('click');
        setGameState(GameState.CREDITS);
    }, []);

    const openAbilitiesModal = useCallback(() => {
        audioService.playSfx('click');
        setIsAbilitiesModalOpen(true);
    }, []);

    const closeAbilitiesModal = useCallback(() => {
        audioService.playSfx('click');
        setIsAbilitiesModalOpen(false);
    }, []);

    const handleApplyCheatAbilities = useCallback((selectedIds: (FightMove | DanceMove | BoonId)[], grantStars: boolean) => {
        audioService.playSfx('powerup');
        setPlayerState(p => {
            if (!p) return null;
    
            const oldAbilities = new Set(p.abilities);
            const newAbilities = new Set(selectedIds);
            // Always keep base abilities
            newAbilities.add('vine');
            newAbilities.add('echo');
    
            let newPlayerState = { ...p, abilities: Array.from(newAbilities) };
    
            if (grantStars) {
                newPlayerState.starPower = 666;
            }
    
            const hadMaxHpBoon = oldAbilities.has('boon_max_hp_1');
            const hasMaxHpBoon = newAbilities.has('boon_max_hp_1');
    
            if (hasMaxHpBoon && !hadMaxHpBoon) {
                newPlayerState.maxHealth += 20;
                newPlayerState.health += 20;
                setHealthBarAnimKey(k => k + 1);
            } else if (!hasMaxHpBoon && hadMaxHpBoon) {
                newPlayerState.maxHealth = Math.max(1, newPlayerState.maxHealth - 20);
                newPlayerState.health = Math.min(newPlayerState.health, newPlayerState.maxHealth);
                setHealthBarAnimKey(k => k + 1);
            }
            
            setCheatsUsed(c => ({...c, allAbilities: true})); // Mark that cheats have been used.
    
            return newPlayerState;
        });
    }, []);

    const handleApplyCheat = (code: string) => {
        if (code === "ginkgo1863") {
            audioService.playSfx('treasure');
            setIsCheatPopupOpen(false);
            setIsCheatAbilitySelectorOpen(true);
        } else if (code === "j6t2hybt26fwxgy2hvxjttbdy") {
            audioService.playSfx('portal_enter');
            if (fullLabyrinth) {
                setIsTeleportMenuOpen(true);
            }
            setIsCheatPopupOpen(false);
        } else {
            audioService.playSfx('miss');
        }
    }

    const handleTeleport = useCallback((floorIndex: number, roomPos: { row: number, col: number }) => {
        if (!fullLabyrinth || !playerState) return;
    
        const targetFloor = floorIndex + 1;
        setIsTeleportMenuOpen(false);
        setIsTransitioning(true);
        setLoadingInfo({ isVisible: true, message: `Teleporting to Floor ${targetFloor}...` });
    
        setTimeout(() => {
            const targetFloorMap = fullLabyrinth[floorIndex];
            
            setPlayerState(p => p ? { ...p, currentFloor: targetFloor, position: roomPos } : null);
            setMapState(targetFloorMap);
            setEntryDirection(null);
            
            setMapRemountKey(k => k + 1);
            setLoadingInfo({ isVisible: false, message: '' });
            setIsTransitioning(false);
            if (gameState !== GameState.MAP) {
                setGameState(GameState.MAP);
            }
        }, 1000);
    
    }, [fullLabyrinth, playerState, gameState]);

    const handleStartSurpriseBoss = useCallback(() => {
        const surpriseBoss = gameService.generateSurpriseBoss();
        setCurrentEncounter(surpriseBoss);
        setGameState(GameState.ENCOUNTER);
    }, []);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            const key = e.key.toLowerCase();
            const isTab = e.key === 'Tab';
    
            // Universal close key
            if (key === 'escape') {
                e.preventDefault();
                if (isTeleportMenuOpen) { setIsTeleportMenuOpen(false); return; }
                if (isCheatAbilitySelectorOpen) { setIsCheatAbilitySelectorOpen(false); return; }
                if (isCheatPopupOpen) { setIsCheatPopupOpen(false); return; }
                if (isQuitConfirmVisible) { cancelQuit(); return; }
                if (isAbilitiesModalOpen) { closeAbilitiesModal(); return; }
                if (isSettingsOpen) { closeSettings(); return; }
                // If nothing is open, open settings (if in game)
                if (isGameInProgress) { openSettings(); }
                return;
            }
    
            // Keys that open/close modals
            if (isGameInProgress) {
                if (key === 'o') {
                    if (isSettingsOpen) {
                        e.preventDefault();
                        closeSettings();
                    } else if (!isGamePaused) {
                        e.preventDefault();
                        openSettings();
                    }
                } else if (key === 'i' || isTab) {
                    if (isAbilitiesModalOpen) {
                        e.preventDefault();
                        closeAbilitiesModal();
                    } else if (!isGamePaused) {
                        e.preventDefault();
                        openAbilitiesModal();
                    }
                }
            }
        };
    
        window.addEventListener('keydown', handleKeyDown);
        return () => {
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, [isGameInProgress, isGamePaused, isSettingsOpen, isAbilitiesModalOpen, isQuitConfirmVisible, isCheatPopupOpen, isCheatAbilitySelectorOpen, isTeleportMenuOpen, openSettings, closeSettings, openAbilitiesModal, closeAbilitiesModal, cancelQuit]);

    const renderContent = () => {
        if (error) {
            return <ErrorDisplay message={error} onRestart={returnToMainMenu} t={t} />;
        }
        
        switch (gameState) {
            case GameState.START_SCREEN:
                return <StartScreen onStart={startGame} onOpenSettings={openSettings} onOpenEndings={openEndingsGallery} onOpenCredits={openCredits} t={t} />;
            case GameState.ENDINGS_GALLERY:
                return <EndingsGalleryScreen unlockedEndings={unlockedEndings} onBack={returnToMainMenu} t={t} language={settings.language} />;
            case GameState.CREDITS:
                return <CreditsScreen onBack={returnToMainMenu} t={t}/>;
            case GameState.MAP:
                return playerState && mapState.length > 0 ? (
                    <MapScreen 
                        key={mapRemountKey}
                        map={mapState} 
                        playerState={playerState} 
                        onMove={handleMove} 
                        onConfront={handleConfront} 
                        isTransitioning={isTransitioning} 
                        onOpenAbilities={openAbilitiesModal} 
                        stars={starMap[`${playerState.position.row}-${playerState.position.col}-${playerState.currentFloor}`] || []}
                        onStarCollect={(starId) => handleStarCollect(`${playerState.position.row}-${playerState.position.col}-${playerState.currentFloor}`, starId)}
                        onDamage={handlePlayerDamage} 
                        onHeal={handlePlayerHeal}
                        onSpendStarsForHealth={handleSpendStarsForHealth}
                        onFountainUse={() => {
                            setMapState(ms => {
                                if (!playerState) return ms;
                                const newMap = JSON.parse(JSON.stringify(ms));
                                newMap[playerState.position.row][playerState.position.col].fountainUsed = true;
                                return newMap;
                            });
                        }}
                        onShrineUse={(pos) => {
                            setMapState(ms => {
                                const newMap = JSON.parse(JSON.stringify(ms));
                                newMap[pos.row][pos.col].shrineUsed = true;
                                return newMap;
                            });
                            setPowerUp({type: 'speed', duration: 30});
                        }}
                        onPitUse={handlePitUse}
                        powerUp={powerUp}
                        labyrinthName={labyrinthName}
                        isPaused={isGamePaused}
                        t={t}
                        entryDirection={entryDirection}
                        onDescend={handleDescend}
                        onOpenCheatPopup={() => setIsCheatPopupOpen(true)}
                        healthBarAnimKey={healthBarAnimKey}
                    />
                ) : null;
            case GameState.ENCOUNTER:
                const isSurpriseBossEncounter = lastEncounterWasGuardian && !!currentEncounter?.isBoss;
                return <EncounterScreen 
                    encounter={currentEncounter} 
                    gameStats={gameStats} 
                    onChoice={handleChoice} 
                    onFlee={handleFleeEncounter} 
                    t={t} 
                    language={settings.language} 
                    autoStartAction={isSurpriseBossEncounter ? lastEncounterAction : null}
                />;
            case GameState.FIGHT_GAME:
                return currentEncounter && playerState ? <FightGameScreen 
                            enemy={currentEncounter} 
                            onComplete={onGameComplete} 
                            playerState={playerState}
                            setPlayerState={setPlayerState}
                            isPaused={isGamePaused}
                            onOpenAbilities={openAbilitiesModal}
                            t={t}
                            language={settings.language}
                            gameStats={gameStats}
                        /> : null;
             case GameState.BOSS_FIGHT:
                return currentEncounter && playerState ? <BossFightScreen
                            enemy={currentEncounter}
                            onComplete={onFinalBossComplete}
                            playerState={playerState}
                            setPlayerState={setPlayerState}
                            isPaused={isGamePaused}
                            onOpenAbilities={openAbilitiesModal}
                            t={t}
                            language={settings.language}
                            gameStats={gameStats}
                        /> : null;
            case GameState.RHYTHM_GAME:
                return currentEncounter && playerState ? <RhythmGameScreen 
                            enemy={currentEncounter}
                            onComplete={onGameComplete}
                            playerState={playerState}
                            setPlayerState={setPlayerState}
                            isPaused={isGamePaused}
                            onOpenAbilities={openAbilitiesModal}
                            t={t}
                            language={settings.language}
                            gameStats={gameStats}
                        /> : null;
            case GameState.ACTION_RESULT:
                return resultInfo && <ResultScreen resultInfo={resultInfo} onContinue={continueFromResults} buttonText={t('ui.continue')} t={t} resonanceVfx={resonanceVfx} />;
            case GameState.AURA_UPDATE:
                return auraUpdateInfo && <AuraUpdateScreen oldAlignment={auraUpdateInfo.old} newAlignment={auraUpdateInfo.new} onContinue={continueFromAuraUpdate} t={t} />;
            case GameState.REWARD_SCREEN:
                return lastRewards.length > 0 ? <RewardScreen ability={lastRewards[0]} onClose={continueFromReward} t={t} language={settings.language} /> : null;
            case GameState.ENDING:
                return playerState && resultInfo ? <EndingScreen resultInfo={resultInfo} onRestart={returnToMainMenu} stats={gameStats} playerState={playerState} unlockedEndingsCount={unlockedEndings.length} t={t} /> : null;
            case GameState.GAME_OVER:
                return <GameOverScreen onRestart={returnToMainMenu} t={t} />;
            case GameState.SURPRISE_BOSS_INTRO:
                return <SurpriseBossIntroScreen onContinue={handleStartSurpriseBoss} t={t} />;
            default:
                return <StartScreen onStart={startGame} onOpenSettings={openSettings} onOpenEndings={openEndingsGallery} onOpenCredits={openCredits} t={t} />;
        }
    };
    
    return (
        <div className="h-screen w-screen flex flex-col items-center justify-center p-1 sm:p-2 selection:bg-[var(--color-primary)] selection:text-white">
            <LoadingOverlay isVisible={loadingInfo.isVisible} message={loadingInfo.message} />
            {isRadianceFlashing && <div className="fixed inset-0 bg-white z-[100] animate-radiance-flash" />}
            
            <div className={`w-full h-full max-w-md sm:max-w-2xl lg:max-w-6xl mx-auto glassmorphic-panel rounded-2xl shadow-2xl relative transition-all duration-500 ${isGamePaused ? 'filter blur-sm scale-95' : ''}`}>
                <div className="p-2 sm:p-4 md:p-6 h-full flex flex-col">
                    <div key={gameState} className="screen-transition-container animate-pop-in">
                        {renderContent()}
                    </div>
                </div>
            </div>
            
            {isGameInProgress &&
                <button onClick={openSettings} aria-label="Open Settings" className="absolute top-3 right-3 z-20 p-2 bg-black/30 hover:bg-black/50 rounded-full text-gray-300 hover:text-white transition-all duration-200 group">
                    <CogIcon className="w-8 h-8 sm:w-10 sm:h-10" />
                    <span className="absolute top-full mt-1 right-0 bg-black/70 text-white text-xs font-bold py-1 px-2 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">ESC / O</span>
                </button>
            }
            
            {isAbilitiesModalOpen && playerState && (
                <AbilitiesModal abilities={playerState.abilities} onClose={closeAbilitiesModal} t={t} />
            )}

            {isSettingsOpen && (
                <div className="fixed inset-0 z-30">
                    <SettingsScreen 
                        settings={settings} 
                        setSettings={setSettings} 
                        onClose={closeSettings} 
                        t={t}
                        isGameInProgress={isGameInProgress}
                        onQuitRun={handleQuitRequest}
                        gameStats={gameStats}
                    />
                </div>
            )}
            
            {isQuitConfirmVisible && <QuitConfirmDialog onConfirm={confirmQuit} onCancel={cancelQuit} t={t} />}
            {isCheatPopupOpen && <CheatCodePopup onApply={handleApplyCheat} onClose={() => setIsCheatPopupOpen(false)} t={t} />}
            {isCheatAbilitySelectorOpen && playerState && (
                <CheatAbilitySelector
                    isOpen={isCheatAbilitySelectorOpen}
                    onClose={() => setIsCheatAbilitySelectorOpen(false)}
                    onApply={handleApplyCheatAbilities}
                    currentAbilities={playerState.abilities}
                    t={t}
                />
            )}
            {isTeleportMenuOpen && fullLabyrinth && (
                 <CheatTeleportMenu
                    fullLabyrinth={fullLabyrinth}
                    onClose={() => setIsTeleportMenuOpen(false)}
                    onTeleport={handleTeleport}
                    t={t}
                />
            )}
        </div>
    );
};

const ErrorDisplay = React.memo(({ message, onRestart, t }: { message: string, onRestart: () => void, t: (key: string, replacements?: Record<string, string | number>) => string }) => (
    <div className="text-center flex-grow flex flex-col justify-center items-center bg-red-900/20 border border-red-500/50 p-4 rounded-lg">
        <h2 className="text-2xl sm:text-3xl font-title text-red-400 mb-4">{t('ui.error')}</h2>
        <p className="text-base sm:text-lg text-red-300 max-w-prose mb-8">{message}</p>
        <button onClick={onRestart} className="flex items-center justify-center text-xl sm:text-2xl mt-8 bg-pink-600 hover:bg-pink-500 text-white font-bold py-3 px-8 rounded-full shadow-lg shadow-pink-600/30 transform hover:scale-105 transition-transform duration-300">
            <RefreshIcon className="w-6 h-6 mr-2" /> {t('ui.newJourney')}
        </button>
    </div>
));
ErrorDisplay.displayName = 'ErrorDisplay';

const StartScreen: React.FC<{ onStart: (difficulty: Difficulty) => void; onOpenSettings: () => void; onOpenEndings: () => void; onOpenCredits: () => void; t: (key: string, replacements?: Record<string, string | number>) => string; }> = ({ onStart, onOpenSettings, onOpenEndings, onOpenCredits, t }) => {
    const [stars, setStars] = useState<{id: number, left: string, size: number, duration: string, delay: string}[]>([]);

    useEffect(() => {
        const createStar = (id: number) => ({
            id,
            left: `${Math.random() * 100}%`,
            size: 1 + Math.random() * 1.5,
            duration: `${20 + Math.random() * 30}s`,
            delay: `-${Math.random() * 50}s`
        });
        setStars(Array.from({length: 15}, (_, i) => createStar(i)));
    }, []);

    const difficultyButtonClass = "font-title text-xl text-white font-bold py-2 px-6 rounded-full shadow-lg transform hover:scale-105 transition-all duration-300 ease-in-out w-40";

    return (
        <div className="text-center flex-grow flex flex-col justify-around items-center p-4 relative overflow-hidden">
            <div className="absolute inset-0 z-0 h-screen">
                {stars.map(star => (
                    <div
                        key={star.id}
                        className="star-anim"
                        style={{
                            left: star.left,
                            width: `${star.size}px`,
                            height: `${star.size}px`,
                            opacity: star.size / 3,
                            filter: `blur(${3 - star.size}px)`,
                            animationDuration: star.duration,
                            animationDelay: star.delay,
                        }}
                    />
                ))}
            </div>
            <div/>
            <div className="z-10"><GameLogo /></div>
            <div className="flex flex-col items-center space-y-4 w-full px-4 z-10">
                 <p className="font-title text-xl text-gray-300 -mb-2">{t('ui.selectDifficulty')}</p>
                <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-4 justify-center">
                    <button onClick={() => onStart('Normal')} className={`${difficultyButtonClass} bg-gradient-to-br from-green-500 to-emerald-600 hover:brightness-110 shadow-green-500/30`}>
                       {t('ui.difficultyNormal')}
                    </button>
                     <button onClick={() => onStart('Hard')} className={`${difficultyButtonClass} bg-gradient-to-br from-amber-500 to-orange-600 hover:brightness-110 shadow-amber-500/30`}>
                        {t('ui.difficultyHard')}
                    </button>
                     <button onClick={() => onStart('Requiem')} className={`${difficultyButtonClass} bg-gradient-to-br from-red-600 to-rose-700 hover:brightness-110 shadow-red-600/30`}>
                        {t('ui.difficultyRequiem')}
                    </button>
                </div>
                 <div className="flex flex-col items-center justify-center gap-4 w-full max-w-md pt-4">
                    <div className="flex flex-wrap items-center justify-center gap-4">
                        <button onClick={onOpenEndings} className="font-title text-lg bg-white/5 border-2 border-white/20 hover:bg-white/20 text-white font-bold py-2 px-6 rounded-full shadow-lg transform hover:scale-105 transition-all duration-300 ease-in-out flex-grow sm:flex-grow-0 flex items-center justify-center backdrop-blur-sm">
                            <BookOpenIcon className="w-5 h-5 mr-2" /> {t('ui.fates')}
                        </button>
                        <button onClick={onOpenSettings} className="font-title text-lg bg-white/5 border-2 border-white/20 hover:bg-white/20 text-white font-bold py-2 px-6 rounded-full shadow-lg transform hover:scale-105 transition-all duration-300 ease-in-out flex-grow sm:flex-grow-0 flex items-center justify-center backdrop-blur-sm">
                            <CogIcon className="w-5 h-5 mr-2" /> {t('ui.settings')}
                        </button>
                    </div>
                    <button onClick={onOpenCredits} className="font-title text-lg bg-white/5 border-2 border-white/20 hover:bg-white/20 text-white font-bold py-2 px-6 rounded-full shadow-lg transform hover:scale-105 transition-all duration-300 ease-in-out flex-grow sm:flex-grow-0 flex items-center justify-center backdrop-blur-sm">
                        <StarIcon className="w-5 h-5 mr-2" /> {t('ui.credits')}
                    </button>
                </div>
            </div>
        </div>
    );
};

const AuraUpdateScreen: React.FC<{ oldAlignment: number, newAlignment: number, onContinue: () => void, t: (key: string, replacements?: Record<string, string | number>) => string }> = React.memo(({ oldAlignment, newAlignment, onContinue, t }) => {
    const [currentAlignment, setCurrentAlignment] = useState(oldAlignment);

    useEffect(() => {
        const diff = newAlignment - oldAlignment;
        if (diff === 0) return;
        const duration = 1500;
        const stepTime = 20;
        const steps = duration / stepTime;
        const increment = diff / steps;
        
        let i = 0;
        const interval = setInterval(() => {
            i++;
            if (i >= steps) {
                setCurrentAlignment(newAlignment);
                clearInterval(interval);
            } else {
                setCurrentAlignment(prev => prev + increment);
            }
        }, stepTime);
        return () => clearInterval(interval);
    }, [oldAlignment, newAlignment]);

    const changeText = newAlignment > oldAlignment ? t('ui.auraBrighter') : t('ui.auraDarker');
    const changeColor = newAlignment > oldAlignment ? "text-cyan-300" : "text-purple-400";
    
    return (
        <div className="flex flex-col items-center text-center flex-grow justify-center">
            <h2 className="text-4xl sm:text-5xl font-title text-transparent bg-clip-text bg-gradient-to-r from-[var(--color-primary)] to-[var(--color-secondary)] mb-6">{t('ui.auraShift')}</h2>
            <div className="w-32 h-32 sm:w-40 sm:h-40 mb-4 animate-pulse">
                <Sprite seed="Keya" size={160} alignment={currentAlignment} className="w-full h-full" />
            </div>
            <p className={`text-2xl font-bold mb-6 ${changeColor}`}>{changeText}</p>
            <AuraGauge alignment={currentAlignment} t={t} />
            <button onClick={onContinue} className="flex items-center justify-center font-title text-xl sm:text-2xl mt-8 bg-[var(--color-primary)] hover:brightness-110 text-white py-3 px-8 rounded-full shadow-lg shadow-[var(--color-primary)]/30 transform hover:scale-105 transition-transform duration-300">
                {t('ui.descendDeeper')} <span className="ml-3">&rarr;</span>
            </button>
        </div>
    );
});
AuraUpdateScreen.displayName = "AuraUpdateScreen";

const ResonanceVFX: React.FC<{type: 'fight' | 'dance'}> = ({ type }) => {
    const particleColor = type === 'fight' ? 'bg-green-400' : 'bg-blue-400';
    const shadowColor = type === 'fight' ? 'shadow-green-400' : 'shadow-blue-400';
    return (
        <div className="absolute inset-0 pointer-events-none overflow-hidden z-20">
            {Array.from({ length: 12 }).map((_, i) => (
                <div
                    key={i}
                    className={`vfx-particle ${particleColor} shadow-lg ${shadowColor}`}
                    style={{
                        width: '8px', height: '8px',
                        top: `${20 + Math.random() * 60}%`, left: '110%',
                        '--tx': '-80vw',
                        '--ty': `${Math.random() * 40 - 20}vh`,
                        animationDelay: `${i * 0.08}s`,
                        animationDuration: '1s'
                    } as React.CSSProperties}
                />
            ))}
        </div>
    )
};

const ResultScreen = React.memo(({ resultInfo, onContinue, buttonText, t, resonanceVfx }: { resultInfo: ResultInfo, onContinue: () => void, buttonText: string, t: (key: string, replacements?: Record<string, string | number>) => string, resonanceVfx: 'fight' | 'dance' | null }) => (
    <div className="flex flex-col items-center text-center flex-grow justify-center relative">
        {resonanceVfx && <ResonanceVFX type={resonanceVfx} />}
        <div className="flex-grow flex items-center justify-center">
            <div className="text-xl sm:text-2xl text-gray-200 leading-relaxed whitespace-pre-wrap max-w-prose p-6 bg-black/20 rounded-xl border border-white/10">
                <FadingWordText text={t(resultInfo.key, resultInfo.replacements)} />
            </div>
        </div>
        <button onClick={onContinue} className="flex items-center justify-center font-title text-xl sm:text-2xl mt-8 bg-[var(--color-primary)] hover:brightness-110 text-white py-3 px-8 rounded-full shadow-lg shadow-[var(--color-primary)]/30 transform hover:scale-105 transition-transform duration-300">
            {buttonText} <span className="ml-3">&rarr;</span>
        </button>
    </div>
));
ResultScreen.displayName = 'ResultScreen';

const EndingScreen = React.memo(({ resultInfo, onRestart, stats, playerState, unlockedEndingsCount, t }: { resultInfo: ResultInfo, onRestart: () => void, stats: GameStats, playerState: PlayerState, unlockedEndingsCount: number, t: (key: string, replacements?: Record<string, string | number>) => string }) => {
    const [stars, setStars] = useState<{id: number, left: string, size: number, duration: string, delay: string}[]>([]);

    useEffect(() => {
        const createStar = (id: number) => ({
            id,
            left: `${Math.random() * 100}%`,
            size: 1 + Math.random() * 2,
            duration: `${30 + Math.random() * 40}s`,
            delay: `-${Math.random() * 70}s`
        });
        setStars(Array.from({length: 20}, (_, i) => createStar(i)));
    }, []);
    
    return (
        <div className="flex flex-col items-center text-center flex-grow justify-center relative overflow-hidden">
             <div className="absolute inset-0 z-0 h-full">
                {stars.map(star => (
                    <div
                        key={star.id}
                        className="star-anim"
                        style={{
                            left: star.left,
                            width: `${star.size}px`,
                            height: `${star.size}px`,
                            opacity: star.size / 3.5,
                            filter: `blur(${3.5 - star.size}px)`,
                            animationDuration: star.duration,
                            animationDelay: star.delay,
                        }}
                    />
                ))}
            </div>

            <div className="z-10 flex flex-col items-center justify-center p-6 my-8">
                <h2 className="text-4xl sm:text-5xl font-title text-transparent bg-clip-text bg-gradient-to-r from-[var(--color-primary)] to-[var(--color-secondary)] mb-4">{t('ui.journeysEnd')}</h2>
                <div className="w-32 h-32 sm:w-40 sm:h-40 my-4 animate-bob">
                    <Sprite seed="Keya" size={160} alignment={playerState.alignment} className="w-full h-full drop-shadow-[0_0_15px_rgba(255,255,255,0.3)]" />
                </div>
                <div className="text-lg sm:text-xl text-gray-300 leading-relaxed whitespace-pre-wrap mb-6 max-w-prose p-4 bg-black/20 rounded-xl">
                    <FadingWordText text={t(resultInfo.key, resultInfo.replacements)} />
                </div>
                <div className="font-bold text-lg text-gray-300 p-2 bg-black/20 rounded-md">
                    {t('ui.difficultyComplete', { difficulty: t(`ui.difficulty${stats.difficulty}`) })}
                </div>
                <p className="text-lg text-gray-400 mt-2">{t('ui.finalChoices')}: <span className="text-red-400 font-bold">{stats.fights} {t('ui.fights')}</span>, <span className="text-blue-400 font-bold">{stats.dances} {t('ui.dances')}</span></p>
                <p className="text-md text-amber-300 mt-4">{t('ui.endingsUnlocked', {unlocked: unlockedEndingsCount, total: 6})}</p>
            </div>
            <button onClick={onRestart} className="z-10 flex items-center justify-center font-title text-xl sm:text-2xl mt-8 bg-[var(--color-secondary)] hover:brightness-110 text-white py-3 px-8 rounded-full shadow-lg shadow-[var(--color-secondary)]/30 transform hover:scale-105 transition-transform duration-300">
                <RefreshIcon className="w-6 h-6 mr-2" /> {t('ui.newJourney')}
            </button>
        </div>
    );
});
EndingScreen.displayName = 'EndingScreen';

const StarDisplay = ({ difficulties }: { difficulties: Difficulty[] }) => (
  <div className="flex">
    <StarIcon className={`w-5 h-5 ${difficulties.includes('Normal') ? 'text-green-400' : 'text-gray-600'}`} />
    <StarIcon className={`w-5 h-5 ${difficulties.includes('Hard') ? 'text-amber-400' : 'text-gray-600'}`} />
    <StarIcon className={`w-5 h-5 ${difficulties.includes('Requiem') ? 'text-red-500' : 'text-gray-600'}`} />
  </div>
);

const EndingsGalleryScreen: React.FC<{ unlockedEndings: UnlockedEnding[], onBack: () => void, t: (key: string, replacements?: Record<string, string | number>) => string, language: string }> = ({ unlockedEndings, onBack, t, language }) => {
    const totalEndings = 6;
    const unlockedPaths = useMemo(() => new Set(unlockedEndings.map(e => e.path)), [unlockedEndings]);
    
    const getAlignmentForPath = (path: UnlockedEnding['path']): number => {
        switch(path) {
            case 'PURE_SHADOW': return -50;
            case 'TAINTED_SHADOW': return -30;
            case 'BALANCE': return 0;
            case 'HARMONIOUS_SHEPHERD': return 30;
            case 'PURE_HARMONY': return 50;
            case 'GAME_OVER': return -50;
        }
    }

    const pathStyles: Record<UnlockedEnding['path'], { gradient: string, borderColor: string, golden: string }> = {
        'PURE_SHADOW': { gradient: 'from-slate-900 to-purple-900', borderColor: 'border-purple-600/50', golden: 'from-amber-800 to-purple-900' },
        'TAINTED_SHADOW': { gradient: 'from-slate-800 to-indigo-900', borderColor: 'border-indigo-600/50', golden: 'from-amber-800 to-indigo-900' },
        'BALANCE': { gradient: 'from-slate-800 to-gray-700', borderColor: 'border-gray-500/50', golden: 'from-amber-800 to-gray-700' },
        'HARMONIOUS_SHEPHERD': { gradient: 'from-slate-800 to-sky-900', borderColor: 'border-sky-600/50', golden: 'from-amber-800 to-sky-900' },
        'PURE_HARMONY': { gradient: 'from-slate-700 to-emerald-900', borderColor: 'border-emerald-500/50', golden: 'from-amber-800 to-emerald-900' },
        'GAME_OVER': { gradient: 'from-slate-900 to-gray-800', borderColor: 'border-gray-600/50', golden: 'from-amber-800 to-gray-800' },
    };
    
    return (
        <div className="flex flex-col items-center flex-grow justify-center p-4 w-full h-full">
            <h2 className="text-4xl sm:text-5xl font-title text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400 mb-4">{t('ui.galleryOfFates')}</h2>
            <p className="text-lg text-gray-300 mb-8">{t('ui.fatesDiscovered', {unlocked: unlockedPaths.size, total: totalEndings})}</p>
            
            <div className="w-full max-w-5xl grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 overflow-y-auto pr-2 flex-grow">
                {(Object.keys(pathStyles) as UnlockedEnding['path'][]).map((path) => {
                    const ending = unlockedEndings.find(e => e.path === path);
                    const isUnlocked = !!ending;
                    const pathKey = `endings.${path}`;
                    const isComplete = isUnlocked && ending.difficulties.length === 3;
                    const { gradient, borderColor, golden } = pathStyles[path];
                    
                    return (
                        <div key={path} className={`p-4 glassmorphic-panel rounded-lg border-2 transition-all duration-300 bg-gradient-to-br ${isUnlocked ? `${isComplete ? golden : gradient} ${isComplete ? 'border-amber-400' : borderColor}` : 'border-transparent opacity-60'}`}>
                           <div className="flex items-center justify-between mb-3">
                                <div className="flex items-center">
                                    <div className="w-12 h-12 mr-3 flex-shrink-0 bg-black/20 rounded-full flex items-center justify-center border border-white/10">
                                      <Sprite seed="Keya" size={40} alignment={isUnlocked ? getAlignmentForPath(path) : 0} isDead={path === 'GAME_OVER' && isUnlocked} className={!isUnlocked ? 'filter grayscale' : ''} />
                                    </div>
                                    <h3 className={`text-xl font-title ${isUnlocked ? isComplete ? 'text-amber-300' : 'text-purple-300' : 'text-gray-500'}`}>{t(`${pathKey}.title`)}</h3>
                                </div>
                                {isUnlocked && <StarDisplay difficulties={ending.difficulties} />}
                           </div>
                           {isUnlocked ? (
                               <>
                                <p className="text-gray-300 mt-2 text-sm whitespace-pre-wrap"><FadingWordText text={t(ending.firstUnlocked.key)} key={`${ending.firstUnlocked.key}-${language}`} /></p>
                                <p className="text-xs text-gray-500 mt-2 text-right">{t('ui.unlockedOn')}: {new Date(ending.firstUnlocked.timestamp).toLocaleDateString()}</p>
                               </>
                           ) : (
                               <p className="text-gray-600 text-center py-8 text-4xl font-bold">?</p>
                           )}
                        </div>
                    );
                })}
            </div>

            <button onClick={onBack} className="font-title text-xl sm:text-2xl mt-8 bg-gray-600 hover:bg-gray-500 text-white py-3 px-8 rounded-full shadow-lg shadow-gray-600/30 transform hover:scale-105 transition-transform duration-300 flex-shrink-0">
                {t('ui.return')}
            </button>
        </div>
    );
};


const GameOverScreen = React.memo(({ onRestart, t }: { onRestart: () => void, t: (key: string, replacements?: Record<string, string | number>) => string }) => (
    <div className="flex flex-col items-center text-center flex-grow justify-center p-4">
        <div className="w-32 h-32 sm:w-40 sm:h-40 mb-4 opacity-70">
            <Sprite seed="Keya" size={160} alignment={-50} className="w-full h-full" isDead={true} />
        </div>
        <h2 className="text-6xl sm:text-8xl font-title text-gray-700 drop-shadow-lg mb-2">{t('ui.gameOver')}</h2>
        <p className="text-lg text-gray-400 mb-8">{t('ui.gameOverMessage')}</p>
        <button onClick={onRestart} className="flex items-center justify-center font-title text-xl sm:text-2xl mt-8 bg-gray-600 hover:bg-gray-500 text-white py-3 px-8 rounded-full shadow-lg shadow-gray-600/30 transform hover:scale-105 transition-transform duration-300">
            <RefreshIcon className="w-6 h-6 mr-2" /> {t('ui.tryAgain')}
        </button>
    </div>
));
GameOverScreen.displayName = 'GameOverScreen';

const CreditsScreen = React.memo(({ onBack, t }: { onBack: () => void, t: (key: string, replacements?: Record<string, string | number>) => string }) => (
     <div className="flex flex-col items-center text-center flex-grow justify-center p-4">
        <GameLogo />
        <div className="text-center my-8">
            <p className="text-lg text-gray-300">{t('ui.aGameBy')}</p>
            <h3 className="text-2xl font-title text-purple-300 mt-2">Estúdio CRIA</h3>
            <p className="text-xl text-gray-300 mt-4">{t('ui.director')}</p>
            <h2 className="text-4xl font-title text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400 my-1">Paulo Gabriel L. S.</h2>
        </div>
        <button onClick={onBack} className="font-title text-xl sm:text-2xl mt-8 bg-gray-600 hover:bg-gray-500 text-white py-3 px-8 rounded-full shadow-lg shadow-gray-600/30 transform hover:scale-105 transition-transform duration-300">
            {t('ui.return')}
        </button>
    </div>
));
CreditsScreen.displayName = 'CreditsScreen';


export default App;
