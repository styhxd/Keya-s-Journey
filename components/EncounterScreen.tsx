
import React, { useState, useEffect, useCallback } from 'react';
import { Encounter, GameStats } from '../types';
import { SwordIcon, MusicIcon, FleeIcon } from './icons';
import { Sprite } from './Sprite';

export const EncounterScreen: React.FC<{ 
    encounter: Encounter | null, 
    gameStats: GameStats, 
    onChoice: (choice: 'fight' | 'dance') => void, 
    onFlee: (success: boolean) => void, 
    t: (key: string, replacements?: Record<string, string|number>) => string, 
    language: string,
    autoStartAction?: 'fight' | 'dance' | null;
}> = ({ encounter, gameStats, onChoice, onFlee, t, language, autoStartAction }) => {
    const [fleeFailed, setFleeFailed] = useState(false);
    const [selection, setSelection] = useState<'fight' | 'dance' | 'flee'>('fight');

    if (!encounter) return null;

    const handleFleeClick = useCallback(() => {
        const fleeChance = { Normal: 0.7, Hard: 0.5, Requiem: 0.3 }[gameStats.difficulty];
        const success = Math.random() < fleeChance;
        onFlee(success);
        if (!success) {
            setFleeFailed(true);
        }
    }, [onFlee, gameStats.difficulty]);

    const handleContinue = useCallback(() => {
        if (autoStartAction) {
            onChoice(autoStartAction);
        }
    }, [autoStartAction, onChoice]);
    
    useEffect(() => {
        if (autoStartAction) {
            const handleKeyDown = (e: KeyboardEvent) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    handleContinue();
                }
            };
            window.addEventListener('keydown', handleKeyDown);
            return () => window.removeEventListener('keydown', handleKeyDown);
        } else {
            const handleKeyDown = (e: KeyboardEvent) => {
                e.preventDefault();
                const choices: ('fight' | 'dance' | 'flee')[] = ['fight', 'dance'];
                if (!encounter.isBoss && !encounter.isGuardian && !fleeFailed) {
                    choices.push('flee');
                }
                const currentIndex = choices.indexOf(selection);

                if (e.key === 'ArrowRight' || e.key.toLowerCase() === 'd') {
                    const nextIndex = (currentIndex + 1) % choices.length;
                    setSelection(choices[nextIndex]);
                } else if (e.key === 'ArrowLeft' || e.key.toLowerCase() === 'a') {
                    const nextIndex = (currentIndex - 1 + choices.length) % choices.length;
                    setSelection(choices[nextIndex]);
                } else if (e.key === 'Enter' || e.key === ' ') {
                    if (selection === 'fight') onChoice('fight');
                    else if (selection === 'dance') onChoice('dance');
                    else if (selection === 'flee') handleFleeClick();
                }
            };

            window.addEventListener('keydown', handleKeyDown);
            return () => window.removeEventListener('keydown', handleKeyDown);
        }
    }, [selection, encounter, fleeFailed, onChoice, handleFleeClick, autoStartAction, handleContinue]);

    const getButtonClass = (buttonType: typeof selection) => {
        const baseClass = "flex items-center justify-center font-title text-xl py-3 px-8 rounded-full shadow-lg transform hover:scale-105 transition-all duration-300 w-48";
        const selectedClass = " ring-4 ring-offset-2 ring-offset-black/50 ring-white";
        
        let colorClass = '';
        if (buttonType === 'fight') colorClass = 'bg-gradient-to-br from-red-500 to-orange-600 hover:from-red-600 hover:to-orange-700 text-white shadow-red-500/30';
        else if (buttonType === 'dance') colorClass = 'bg-gradient-to-br from-blue-500 to-cyan-600 hover:from-blue-600 hover:to-cyan-700 text-white shadow-blue-500/30';
        else if (buttonType === 'flee') return `flex items-center justify-center font-title text-lg bg-gray-600 hover:bg-gray-500 text-white py-2 px-6 rounded-full shadow-lg transform hover:scale-105 transition-all duration-300 sm:w-auto ${selection === 'flee' ? selectedClass : ''}`;
        
        return `${baseClass} ${colorClass} ${selection === buttonType ? selectedClass : ''}`;
    }

    const spriteSize = encounter.sizeModifier ? 224 * encounter.sizeModifier : 224;
    
    if (autoStartAction) {
        return (
            <div className="h-full flex flex-col items-center justify-center text-center p-2 cursor-pointer" onClick={handleContinue}>
                <div className="w-full max-w-2xl p-8 rounded-2xl border-4 border-amber-400 bg-gradient-to-br from-gray-900 to-black shadow-[0_0_30px_#f59e0b] animate-pop-in">
                    <p className="font-title text-4xl mb-4 tracking-widest animate-pulse text-amber-400 drop-shadow-[0_0_10px_#f59e0b]">{t('ui.bossEncounter')}</p>
                    <div className="w-40 h-40 sm:w-56 sm:h-56 mx-auto mb-6">
                        <Sprite seed={encounter.seed} size={spriteSize} encounter={encounter} className="w-full h-full" />
                    </div>
                    <h2 className="text-4xl sm:text-6xl font-title text-transparent bg-clip-text bg-gradient-to-r from-amber-300 to-red-500 mb-2">{t(encounter.name)}</h2>
                    <p className="text-lg text-center text-gray-300 mb-8 max-w-2xl">{t(encounter.description)}</p>
                    <p className="text-lg text-gray-400 mt-4 animate-pulse">{t('ui.continue')}...</p>
                </div>
            </div>
        );
    }

    const isSurpriseBoss = encounter.isBoss && !encounter.isGuardian;

    return (
        <div className="flex flex-col items-center flex-grow justify-center">
            {(encounter.isBoss || encounter.isGuardian) && <p className={`font-title text-4xl mb-4 tracking-widest animate-pulse ${isSurpriseBoss ? 'text-amber-400 drop-shadow-[0_0_10px_#f59e0b]' : 'text-red-400 drop-shadow-[0_0_10px_#f00]'}`}>{encounter.isBoss ? t('ui.bossEncounter') : t('ui.guardianEncounter')}</p>}
            <div className="w-40 h-40 sm:w-56 sm:h-56 mb-6">
                <Sprite seed={encounter.seed} size={spriteSize} encounter={encounter} className="w-full h-full" />
            </div>
            <h2 className="text-4xl sm:text-6xl font-title text-transparent bg-clip-text bg-gradient-to-r from-[var(--color-primary)] to-[var(--color-secondary)] mb-2">{t(encounter.name)}</h2>
            <p className="text-lg text-center text-gray-300 mb-8 max-w-2xl">{t(encounter.description)}</p>
            {fleeFailed && <p className="text-red-400 font-bold mb-4">{t('ui.fleeFailed', {damage: 5})}</p>}
            <p className="font-title text-3xl mb-4">{t('ui.whatWillKeyaDo')}</p>
            <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-6 items-center">
                <button onClick={() => onChoice('fight')} className={getButtonClass('fight')}>
                    <SwordIcon className="w-6 h-6 mr-2" /> {t('ui.fight')}
                </button>
                <button onClick={() => onChoice('dance')} className={getButtonClass('dance')}>
                    <MusicIcon className="w-6 h-6 mr-2" /> {t('ui.dance')}
                </button>
                {!encounter.isBoss && !encounter.isGuardian && !fleeFailed && (
                     <button onClick={handleFleeClick} className={getButtonClass('flee')}>
                        <FleeIcon className="w-5 h-5 mr-2" /> {t('ui.flee')}
                    </button>
                )}
            </div>
        </div>
    );
};
EncounterScreen.displayName = 'EncounterScreen';
