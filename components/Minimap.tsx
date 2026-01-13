
import React, { useMemo } from 'react';
import { MapTile, PlayerState } from '../types';
import { UserIcon, SkullIcon, HeartIcon, QuestionMarkCircleIcon, EyeSlashIcon, CheckIcon, SwordIcon, StarIcon, ResonanceIcon } from './icons';

interface MinimapProps {
    map: MapTile[][];
    playerState: PlayerState;
    t: (key: string) => string;
    sightRange: number;
}

export const Minimap: React.FC<MinimapProps> = React.memo(({ map, playerState, t, sightRange }) => {
    const { position: playerPos } = playerState;

    const getTileContent = (tile: MapTile, r: number, c: number) => {
        const isCurrent = playerPos.row === r && playerPos.col === c;
        if (isCurrent) {
            return {
                Icon: UserIcon,
                className: "text-white animate-pulse",
                bgClass: "bg-purple-500/50"
            };
        }

        const distance = Math.max(Math.abs(r - playerPos.row), Math.abs(c - playerPos.col));
        const isVisibleByRadiance = playerState.abilities.includes('boon_radiance_1') && distance <= sightRange;
        const shouldReveal = tile.visited || isVisibleByRadiance;

        if (!shouldReveal) {
            return {
                Icon: QuestionMarkCircleIcon,
                className: "text-slate-400",
                bgClass: "bg-slate-700/50"
            };
        }
        
        // If we're here, the tile is either visited or visible, so we show its contents.
        if (tile.hasDescentHole) {
            return {
                Icon: ResonanceIcon,
                className: "text-purple-400 animate-pulse",
                bgClass: "bg-purple-900/50"
            };
        }

        let iconDetails = { Icon: QuestionMarkCircleIcon, className: 'text-slate-400', bgClass: 'bg-slate-700/50' };

        switch (tile.type) {
            case 'start':
            case 'cleared':
                iconDetails = { Icon: CheckIcon, className: 'text-green-400/70', bgClass: 'bg-slate-800/60' };
                break;
            case 'encounter':
                iconDetails = { Icon: SwordIcon, className: 'text-red-400/70', bgClass: 'bg-slate-800/60' };
                break;
            case 'boss':
                iconDetails = { Icon: SkullIcon, className: 'text-red-400', bgClass: 'bg-red-900/50 animate-pulse' };
                break;
            case 'healing':
                if (tile.fountainUsed) {
                    iconDetails = { Icon: HeartIcon, className: 'text-green-700/50', bgClass: 'bg-slate-800/60' };
                } else {
                    iconDetails = { Icon: HeartIcon, className: 'text-green-400', bgClass: 'bg-green-900/50' };
                }
                break;
            case 'shrine':
                if (tile.shrineUsed) {
                    iconDetails = { Icon: StarIcon, className: 'text-cyan-700/50', bgClass: 'bg-slate-800/60' };
                } else {
                    iconDetails = { Icon: StarIcon, className: 'text-cyan-400 animate-pulse', bgClass: 'bg-cyan-900/50' };
                }
                break;
        }


        return iconDetails;
    };

    return (
        <div className="flex flex-col items-center">
            <p className="text-sm font-bold mb-2 text-gray-400">{t('ui.minimap')}</p>
            <div
                className="grid p-1 bg-black/30 border border-white/10 rounded-md"
                style={{
                    gridTemplateRows: `repeat(${map.length}, minmax(0, 1fr))`,
                    gridTemplateColumns: `repeat(${map[0].length}, minmax(0, 1fr))`,
                    gap: '2px',
                }}
            >
                {map.map((row, r) =>
                    row.map((tile, c) => {
                        if (tile.type === 'empty') {
                            return <div key={`${r}-${c}`} className="w-6 h-6 sm:w-7 sm:h-7" />;
                        }
                        
                        const { Icon, className, bgClass } = getTileContent(tile, r, c);
                        
                        return (
                            <div
                                key={`${r}-${c}`}
                                title={`${t('ui.room')} (${r}, ${c}) - ${t('tiles.'+tile.type)}`}
                                className={`w-6 h-6 sm:w-7 sm:h-7 flex items-center justify-center rounded-sm transition-colors duration-300 ${bgClass}`}
                            >
                                <Icon className={`w-4 h-4 sm:w-5 sm:h-5 ${className}`} />
                            </div>
                        );
                    })
                )}
            </div>
        </div>
    );
});
Minimap.displayName = 'Minimap';
