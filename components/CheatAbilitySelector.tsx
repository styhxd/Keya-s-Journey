import React, { useState, useEffect, useMemo } from 'react';
import { FightMove, DanceMove, BoonId, Ability } from '../types';
import { ABILITIES } from '../constants';
import { CloseIcon, SaveIcon, SwordIcon, MusicIcon, StarIcon } from './icons';

interface CheatAbilitySelectorProps {
    isOpen: boolean;
    onClose: () => void;
    onApply: (selectedIds: (FightMove | DanceMove | BoonId)[], grantStars: boolean) => void;
    currentAbilities: (FightMove | DanceMove | BoonId)[];
    t: (key: string) => string;
}

const AbilitySection = ({ title, abilities, selected, onToggle, onSelectAll, onDeselectAll, icon, t }: any) => (
    <div>
        <div className="flex justify-between items-center mb-3">
            <h3 className="font-title text-2xl flex items-center">{icon} {title}</h3>
            <div className="flex space-x-2">
                <button onClick={onSelectAll} className="text-sm bg-slate-600 hover:bg-slate-500 px-3 py-1 rounded-full">Select All</button>
                <button onClick={onDeselectAll} className="text-sm bg-slate-800 hover:bg-slate-700 px-3 py-1 rounded-full">Deselect All</button>
            </div>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 bg-black/20 p-2 rounded-lg border border-white/10 max-h-48 overflow-y-auto">
            {abilities.map((ability: Ability) => (
                <label key={ability.id} className="flex items-center space-x-2 p-2 rounded hover:bg-white/10 cursor-pointer">
                    <input
                        type="checkbox"
                        checked={selected.has(ability.id)}
                        onChange={() => onToggle(ability.id)}
                        className="form-checkbox h-5 w-5 rounded bg-slate-700 border-slate-500 text-[var(--color-primary)] focus:ring-transparent"
                    />
                    <span className="text-sm text-gray-200">{t(ability.name)}</span>
                </label>
            ))}
        </div>
    </div>
);

const CheatAbilitySelector: React.FC<CheatAbilitySelectorProps> = ({ isOpen, onClose, onApply, currentAbilities, t }) => {
    const { fightAbilities, danceAbilities, boons } = useMemo(() => {
        const fight: Ability[] = [];
        const dance: Ability[] = [];
        const boon: Ability[] = [];
        Object.values(ABILITIES).forEach(ability => {
            if (ability.type === 'fight') fight.push(ability);
            else if (ability.type === 'dance') dance.push(ability);
            else if (ability.type === 'boon') boon.push(ability);
        });
        return { fightAbilities: fight, danceAbilities: dance, boons: boon };
    }, []);

    const [selectedFight, setSelectedFight] = useState<Set<FightMove>>(new Set());
    const [selectedDance, setSelectedDance] = useState<Set<DanceMove>>(new Set());
    const [selectedBoons, setSelectedBoons] = useState<Set<BoonId>>(new Set());
    const [grantStars, setGrantStars] = useState(false);

    useEffect(() => {
        if (isOpen) {
            const currentFight = new Set<FightMove>();
            const currentDance = new Set<DanceMove>();
            const currentBoons = new Set<BoonId>();
            currentAbilities.forEach(id => {
                const ability = ABILITIES[id];
                if (ability?.type === 'fight') currentFight.add(id as FightMove);
                else if (ability?.type === 'dance') currentDance.add(id as DanceMove);
                else if (ability?.type === 'boon') currentBoons.add(id as BoonId);
            });
            setSelectedFight(currentFight);
            setSelectedDance(currentDance);
            setSelectedBoons(currentBoons);
        }
    }, [isOpen, currentAbilities]);

    const handleApply = () => {
        const allSelected = [
            ...Array.from(selectedFight),
            ...Array.from(selectedDance),
            ...Array.from(selectedBoons)
        ];
        onApply(allSelected, grantStars);
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center animate-pop-in z-50 p-4">
            <div className="w-full max-w-4xl h-auto max-h-[90vh] glassmorphic-panel rounded-2xl p-6 sm:p-8 relative border-2 border-amber-400/50 shadow-amber-400/20 shadow-2xl flex flex-col">
                <button onClick={onClose} aria-label={t('ui.close')} className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors">
                    <CloseIcon className="w-8 h-8"/>
                </button>

                <h2 className="text-4xl font-title text-center text-amber-300 mb-6 flex-shrink-0">Ability Selector</h2>

                <div className="overflow-y-auto pr-2 flex-grow space-y-6">
                    <AbilitySection
                        title="Battle"
                        icon={<SwordIcon className="w-6 h-6 mr-2 text-red-400"/>}
                        abilities={fightAbilities}
                        selected={selectedFight}
                        onToggle={(id: FightMove) => setSelectedFight(prev => { const next = new Set(prev); next.has(id) ? next.delete(id) : next.add(id); return next; })}
                        onSelectAll={() => setSelectedFight(new Set(fightAbilities.map(a => a.id as FightMove)))}
                        onDeselectAll={() => setSelectedFight(new Set())}
                        t={t}
                    />
                    <AbilitySection
                        title="Dance"
                        icon={<MusicIcon className="w-6 h-6 mr-2 text-blue-400"/>}
                        abilities={danceAbilities}
                        selected={selectedDance}
                        onToggle={(id: DanceMove) => setSelectedDance(prev => { const next = new Set(prev); next.has(id) ? next.delete(id) : next.add(id); return next; })}
                        onSelectAll={() => setSelectedDance(new Set(danceAbilities.map(a => a.id as DanceMove)))}
                        onDeselectAll={() => setSelectedDance(new Set())}
                        t={t}
                    />
                    <AbilitySection
                        title="Boons"
                        icon={<StarIcon className="w-6 h-6 mr-2 text-yellow-400"/>}
                        abilities={boons}
                        selected={selectedBoons}
                        onToggle={(id: BoonId) => setSelectedBoons(prev => { const next = new Set(prev); next.has(id) ? next.delete(id) : next.add(id); return next; })}
                        onSelectAll={() => setSelectedBoons(new Set(boons.map(a => a.id as BoonId)))}
                        onDeselectAll={() => setSelectedBoons(new Set())}
                        t={t}
                    />
                </div>

                <div className="mt-6 flex-shrink-0 flex flex-col sm:flex-row items-center justify-between gap-4">
                    <label className="flex items-center space-x-3 cursor-pointer">
                        <input
                            type="checkbox"
                            checked={grantStars}
                            onChange={(e) => setGrantStars(e.target.checked)}
                            className="form-checkbox h-6 w-6 rounded bg-slate-700 border-slate-500 text-[var(--color-primary)] focus:ring-transparent"
                        />
                        <span className="text-lg text-gray-200">Grant 666 Star Power</span>
                    </label>
                    <div className="flex items-center space-x-4">
                         <button onClick={handleApply} className="font-title text-xl bg-green-600 hover:bg-green-500 text-white font-bold py-2 px-8 rounded-full shadow-lg transform hover:scale-105 transition-all duration-300 flex items-center">
                            <SaveIcon className="w-5 h-5 mr-2"/>
                            Save
                        </button>
                        <button onClick={onClose} className="font-title text-xl bg-gray-600 hover:bg-gray-500 text-white font-bold py-2 px-8 rounded-full shadow-lg transform hover:scale-105 transition-all duration-300">
                           Close
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CheatAbilitySelector;
