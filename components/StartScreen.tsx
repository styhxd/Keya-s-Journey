import React, { useEffect, useState } from 'react';
import type { Difficulty } from '../types';
import { audioService } from '../services/audioService';
import { Sprite } from './Sprite';
import { PlayIcon, BookOpenIcon, CogIcon, StarIcon, ChevronLeftIcon } from './icons';

export const GameLogo = React.memo(() => (
    <svg width="300" height="150" viewBox="0 0 300 150" className="drop-shadow-lg w-full max-w-[17rem] min-[400px]:max-w-sm md:max-w-md">
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

type Translate = (key: string, replacements?: Record<string, string | number>) => string;

const DIFFICULTIES: {
    id: Difficulty;
    nameKey: string;
    titleKey: string;
    descKey: string;
    accent: string;
    glow: string;
    bar: string;
}[] = [
    {
        id: 'Normal',
        nameKey: 'ui.difficultyNormal',
        titleKey: 'ui.difficultyNormalTitle',
        descKey: 'ui.difficultyNormalDesc',
        accent: 'from-emerald-400/25 to-teal-600/10',
        glow: 'shadow-emerald-500/20',
        bar: 'bg-emerald-400',
    },
    {
        id: 'Hard',
        nameKey: 'ui.difficultyHard',
        titleKey: 'ui.difficultyHardTitle',
        descKey: 'ui.difficultyHardDesc',
        accent: 'from-amber-400/25 to-orange-600/10',
        glow: 'shadow-amber-500/20',
        bar: 'bg-amber-400',
    },
    {
        id: 'Requiem',
        nameKey: 'ui.difficultyRequiem',
        titleKey: 'ui.difficultyRequiemTitle',
        descKey: 'ui.difficultyRequiemDesc',
        accent: 'from-rose-500/30 to-red-900/15',
        glow: 'shadow-rose-600/25',
        bar: 'bg-rose-500',
    },
];

const FallingStars = () => {
    const [stars, setStars] = useState<{ id: number; left: string; size: number; duration: string; delay: string }[]>([]);

    useEffect(() => {
        const isCompact = typeof window !== 'undefined' && (window.innerWidth < 480 || window.innerHeight < 640);
        const count = isCompact ? 8 : 14;
        setStars(Array.from({ length: count }, (_, i) => ({
            id: i,
            left: `${Math.random() * 100}%`,
            size: 1 + Math.random() * 1.5,
            duration: `${22 + Math.random() * 28}s`,
            delay: `-${Math.random() * 50}s`,
        })));
    }, []);

    return (
        <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none" aria-hidden>
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
    );
};

const HeroKeya = () => (
    <div className="menu-hero relative flex items-center justify-center">
        <div className="menu-aurora" aria-hidden />
        <div className="menu-orbit" aria-hidden>
            <span className="menu-mote" style={{ animationDelay: '0s' }} />
            <span className="menu-mote" style={{ animationDelay: '-4s' }} />
            <span className="menu-mote" style={{ animationDelay: '-8s' }} />
        </div>
        <div className="relative z-10 w-[8rem] h-[8rem] min-[400px]:w-[10rem] min-[400px]:h-[10rem] md:w-[12rem] md:h-[12rem] animate-bob">
            <Sprite seed="Keya" size={192} alignment={12} className="w-full h-full drop-shadow-[0_0_22px_rgba(255,255,255,0.28)]" />
        </div>
    </div>
);

const DifficultySheet = ({
    open,
    lastDifficulty,
    onClose,
    onChoose,
    t,
}: {
    open: boolean;
    lastDifficulty: Difficulty | null;
    onClose: () => void;
    onChoose: (difficulty: Difficulty) => void;
    t: Translate;
}) => {
    useEffect(() => {
        if (!open) return;
        const onKey = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                e.preventDefault();
                onClose();
            } else if (e.key === '1') onChoose('Normal');
            else if (e.key === '2') onChoose('Hard');
            else if (e.key === '3') onChoose('Requiem');
        };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [open, onClose, onChoose]);

    if (!open) return null;

    return (
        <div className="fixed inset-0 z-40 flex items-end justify-center md:items-center p-0 md:p-6">
            <button
                type="button"
                className="absolute inset-0 bg-black/60 backdrop-blur-md menu-backdrop-in"
                aria-label={t('ui.return')}
                onClick={onClose}
            />
            <div
                role="dialog"
                aria-modal="true"
                aria-labelledby="difficulty-title"
                className="relative w-full md:max-w-[28rem] max-h-[86dvh] overflow-y-auto menu-sheet-in rounded-t-[1.75rem] md:rounded-3xl border border-white/15 border-b-0 md:border-b bg-[#0b0a16]/92 shadow-[0_-20px_80px_rgba(0,0,0,0.45)]"
            >
                <div className="absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-[var(--color-primary)]/20 to-transparent pointer-events-none" />
                <div className="md:hidden flex justify-center pt-3">
                    <div className="w-10 h-1 rounded-full bg-white/25" />
                </div>
                <div className="relative px-5 pt-3 pb-[max(1.25rem,env(safe-area-inset-bottom))] md:p-6">
                    <div className="flex items-center mb-5">
                        <button
                            type="button"
                            onClick={onClose}
                            className="menu-hit flex items-center justify-center w-11 h-11 -ml-2 rounded-full text-gray-300 active:bg-white/10 hover:bg-white/10 hover:text-white transition-colors"
                            aria-label={t('ui.return')}
                        >
                            <ChevronLeftIcon className="w-6 h-6" />
                        </button>
                        <h2 id="difficulty-title" className="flex-1 text-center font-title text-lg md:text-xl text-white pr-9 tracking-normal">
                            {t('ui.choosePath')}
                        </h2>
                    </div>
                    <div className="flex flex-col gap-3">
                        {DIFFICULTIES.map((diff, index) => {
                            const isLast = lastDifficulty === diff.id;
                            const isRecommended = lastDifficulty === null && diff.id === 'Normal';
                            return (
                                <button
                                    key={diff.id}
                                    type="button"
                                    onClick={() => onChoose(diff.id)}
                                    className={`menu-hit relative overflow-hidden text-left rounded-2xl border border-white/10 bg-gradient-to-r ${diff.accent} px-4 py-3.5 min-h-[4.5rem] shadow-lg ${diff.glow} active:scale-[0.98] hover:border-white/25 transition-transform duration-150`}
                                    style={{ animationDelay: `${80 + index * 70}ms` }}
                                >
                                    <span className={`absolute left-0 top-3 bottom-3 w-1 rounded-full ${diff.bar}`} />
                                    <div className="pl-3 flex items-start justify-between gap-3">
                                        <div className="min-w-0">
                                            <div className="flex items-center gap-2 flex-wrap">
                                                <span className="font-title text-lg text-white tracking-normal">{t(diff.nameKey)}</span>
                                                {isLast && (
                                                    <span className="text-[10px] uppercase tracking-[0.12em] font-bold text-amber-200/90 bg-amber-400/15 border border-amber-300/30 rounded-full px-2 py-0.5">
                                                        {t('ui.lastPlayed')}
                                                    </span>
                                                )}
                                                {isRecommended && (
                                                    <span className="text-[10px] uppercase tracking-[0.12em] font-bold text-emerald-200/90 bg-emerald-400/15 border border-emerald-300/30 rounded-full px-2 py-0.5">
                                                        {t('ui.recommended')}
                                                    </span>
                                                )}
                                            </div>
                                            <p className="text-[var(--color-secondary)] text-xs tracking-wide mt-0.5 opacity-90">
                                                {t(diff.titleKey)}
                                            </p>
                                            <p className="text-gray-300/90 text-sm leading-snug mt-1.5">
                                                {t(diff.descKey)}
                                            </p>
                                        </div>
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                </div>
            </div>
        </div>
    );
};

interface StartScreenProps {
    onStart: (difficulty: Difficulty) => void;
    onOpenSettings: () => void;
    onOpenEndings: () => void;
    onOpenCredits: () => void;
    t: Translate;
}

export const StartScreen: React.FC<StartScreenProps> = ({ onStart, onOpenSettings, onOpenEndings, onOpenCredits, t }) => {
    const [showDifficulty, setShowDifficulty] = useState(false);
    const [lastDifficulty, setLastDifficulty] = useState<Difficulty | null>(null);
    const [heroHop, setHeroHop] = useState(false);

    useEffect(() => {
        document.body.classList.add('menu-active');
        try {
            const saved = localStorage.getItem('lastDifficulty');
            if (saved === 'Normal' || saved === 'Hard' || saved === 'Requiem') {
                setLastDifficulty(saved);
            }
        } catch {
            /* ignore */
        }
        return () => {
            document.body.classList.remove('menu-active');
        };
    }, []);

    const playClick = () => audioService.playSfx('click');

    const openDifficulty = () => {
        playClick();
        setHeroHop(true);
        setShowDifficulty(true);
        window.setTimeout(() => setHeroHop(false), 320);
    };

    const closeDifficulty = () => {
        playClick();
        setShowDifficulty(false);
    };

    const chooseDifficulty = (difficulty: Difficulty) => {
        playClick();
        try {
            localStorage.setItem('lastDifficulty', difficulty);
        } catch {
            /* ignore */
        }
        setLastDifficulty(difficulty);
        onStart(difficulty);
    };

    const secondary = [
        { id: 'fates', label: t('ui.fates'), icon: BookOpenIcon, action: () => { playClick(); onOpenEndings(); } },
        { id: 'settings', label: t('ui.settings'), icon: CogIcon, action: () => { playClick(); onOpenSettings(); } },
        { id: 'credits', label: t('ui.credits'), icon: StarIcon, action: () => { playClick(); onOpenCredits(); } },
    ];

    return (
        <div className="menu-screen relative h-full w-full overflow-hidden flex flex-col items-center">
            <FallingStars />

            <div className="relative z-10 flex flex-col items-center w-full h-full menu-safe">
                <header className="menu-enter flex flex-col items-center pt-1 shrink-0">
                    <GameLogo />
                    <div className="flex items-center gap-3 -mt-2 mb-1 opacity-80">
                        <span className="h-px w-10 bg-gradient-to-r from-transparent to-[var(--color-primary)]" />
                        <StarIcon className="w-3 h-3 text-[var(--color-accent)]" />
                        <span className="h-px w-10 bg-gradient-to-l from-transparent to-[var(--color-secondary)]" />
                    </div>
                    <p className="text-xs min-[400px]:text-sm tracking-[0.14em] text-gray-300/85 text-center px-6">
                        {t('ui.menuTagline')}
                    </p>
                </header>

                <div className={`menu-enter-delayed flex-1 flex items-center justify-center min-h-0 my-2 ${heroHop ? 'animate-hop' : ''}`}>
                    <HeroKeya />
                </div>

                <nav className="menu-enter-late w-full max-w-sm px-1 flex flex-col items-center gap-5 shrink-0 pb-1">
                    <button
                        type="button"
                        onClick={openDifficulty}
                        className="menu-hit menu-play-btn group relative w-full min-h-[3.65rem] rounded-full overflow-hidden font-title text-lg min-[400px]:text-xl text-white"
                    >
                        <span className="relative z-10 flex items-center justify-center gap-3">
                            <PlayIcon className="w-6 h-6 -ml-1" />
                            {t('ui.beginJourney')}
                        </span>
                    </button>

                    <div className="grid grid-cols-3 gap-2 w-full">
                        {secondary.map(item => (
                            <button
                                key={item.id}
                                type="button"
                                onClick={item.action}
                                className="menu-hit menu-dock-btn flex flex-col items-center justify-center gap-1.5 min-h-[4.25rem] rounded-2xl text-gray-200"
                            >
                                <item.icon className="w-6 h-6" />
                                <span className="text-[0.7rem] min-[400px]:text-xs tracking-[0.08em] font-medium">
                                    {item.label}
                                </span>
                            </button>
                        ))}
                    </div>

                    <p className="menu-credit text-[10px] tracking-[0.14em] uppercase text-gray-500/80 pb-1">
                        {t('ui.aGameBy')} Estúdio CRIA
                    </p>
                </nav>
            </div>

            <DifficultySheet
                open={showDifficulty}
                lastDifficulty={lastDifficulty}
                onClose={closeDifficulty}
                onChoose={chooseDifficulty}
                t={t}
            />
        </div>
    );
};

export default StartScreen;
