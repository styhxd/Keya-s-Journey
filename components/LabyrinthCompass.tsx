import React, { useMemo } from 'react';
import { MapTile, PlayerState } from '../types';
import { ArrowUpIcon } from './icons';

interface LabyrinthCompassProps {
    map: MapTile[][];
    playerState: PlayerState;
    t: (key: string) => string;
}

export const LabyrinthCompass: React.FC<LabyrinthCompassProps> = ({ map, playerState, t }) => {
    
    const { angle, distance, maxDistance } = useMemo(() => {
        let bossPos: { row: number, col: number } | null = null;
        for (let r = 0; r < map.length; r++) {
            for (let c = 0; c < map[r].length; c++) {
                if (map[r][c].type === 'boss') {
                    bossPos = { row: r, col: c };
                    break;
                }
            }
            if (bossPos) break;
        }

        if (!bossPos) {
            return { angle: 0, distance: 0, maxDistance: 1 };
        }

        const dRow = bossPos.row - playerState.position.row;
        const dCol = bossPos.col - playerState.position.col;
        const dist = Math.sqrt(dRow * dRow + dCol * dCol);
        const maxDist = Math.sqrt(Math.pow(map.length -1, 2) + Math.pow(map[0].length - 1, 2));
        const ang = Math.atan2(dRow, dCol) * (180 / Math.PI) + 90;

        return { angle: ang, distance: dist, maxDistance: maxDist };
    }, [map, playerState.position]);

    const pulseDuration = 1 + (distance / maxDistance) * 2; // Duration from 1s (close) to 3s (far)

    return (
        <div className="flex flex-col items-center">
            <p className="text-sm font-bold mb-2 text-gray-400">{t('ui.map.compass')}</p>
            <div className="w-24 h-24 bg-black/30 rounded-full flex items-center justify-center border border-white/10 relative">
                <div className="absolute text-gray-500 top-2 text-xs">N</div>
                <div className="absolute text-gray-500 bottom-2 text-xs">S</div>
                <div className="absolute text-gray-500 left-2 text-xs">W</div>
                <div className="absolute text-gray-500 right-2 text-xs">E</div>
                <div className="w-16 h-16 flex items-center justify-center transition-transform duration-500" style={{ transform: `rotate(${angle}deg)` }}>
                    <ArrowUpIcon className="w-12 h-12 text-purple-400 animate-compass-pulse" style={{ animationDuration: `${pulseDuration}s`}} />
                </div>
            </div>
        </div>
    );
};