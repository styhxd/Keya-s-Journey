import React from 'react';
import { SunIcon, MoonIcon } from './icons';

interface AuraGaugeProps {
    alignment: number; // -50 (dark) to +50 (light)
    t: (key: string) => string;
}

export const AuraGauge: React.FC<AuraGaugeProps> = ({ alignment, t }) => {
    const indicatorPosition = 50 - alignment; // 0% at top (+50), 100% at bottom (-50)
    
    return (
        <div className="flex flex-col items-center space-y-2">
            <p className="text-sm font-bold text-gray-400">{t('ui.aura')}</p>
            <div className="flex flex-col items-center">
                <SunIcon className="w-6 h-6 text-yellow-300" />
                <div className="relative w-6 h-32 my-1 bg-gradient-to-t from-purple-800 via-gray-700 to-blue-400 rounded-full border-2 border-white/10 overflow-hidden">
                    <div 
                        className="absolute left-1/2 w-8 h-1 bg-white rounded-full -translate-x-1/2 -translate-y-1/2 shadow-[0_0_10px_white] transition-all duration-500 ease-out" 
                        style={{ top: `${indicatorPosition}%` }}
                    />
                </div>
                <MoonIcon className="w-6 h-6 text-indigo-400" />
            </div>
        </div>
    );
};