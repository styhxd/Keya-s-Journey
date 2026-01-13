import React from 'react';
import { GameSettings, GameStats } from '../types';
import { CloseIcon, VolumeUpIcon, VolumeMuteIcon, MusicIcon, StarIcon } from './icons';
import { PALETTES } from '../data/palettes';

interface SettingsScreenProps {
    settings: GameSettings;
    setSettings: React.Dispatch<React.SetStateAction<GameSettings>>;
    onClose: () => void;
    t: (key: string) => string;
    isGameInProgress: boolean;
    onQuitRun: () => void;
    gameStats: GameStats;
}

const VolumeSlider = React.memo(({
    label, 
    value, 
    onChange,
    icon
}: {
    label: string, 
    value: number, 
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => void,
    icon: React.ReactNode
}) => (
    <div className="w-full">
        <label className="flex items-center text-lg font-bold text-gray-200 mb-2">
            {icon}
            {label}
        </label>
        <div className="flex items-center space-x-4">
            <VolumeMuteIcon className="w-6 h-6 text-gray-400" />
            <input 
                type="range" 
                min="0" 
                max="1" 
                step="0.01" 
                value={value}
                onChange={onChange}
                aria-label={label}
                className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-[var(--color-primary)]"
            />
            <VolumeUpIcon className="w-6 h-6 text-gray-400" />
        </div>
    </div>
));
VolumeSlider.displayName = 'VolumeSlider';

const Keycap = ({ children }: { children: React.ReactNode }) => (
    <span className="inline-block bg-slate-900/80 text-gray-300 text-sm font-bold py-1 px-3 rounded border border-slate-600 shadow-sm">{children}</span>
);

const ControlsList = ({ t }: { t: (key: string) => string }) => {
    const controls = [
        { label: t('ui.controls.move'), keys: ['W', 'A', 'S', 'D', '/', '↑', '←', '↓', '→'] },
        { label: t('ui.controls.interact'), keys: ['Enter', 'Space'] },
        { label: t('ui.controls.openAbilities'), keys: ['I', 'Tab'] },
        { label: t('ui.controls.openSettings'), keys: ['ESC', 'O'] },
        { label: t('ui.controls.heal'), keys: ['H'] }
    ];

    return (
        <div className="space-y-3">
            <h4 className="text-xl font-bold text-gray-300">{t('ui.controls.title')}</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-3 text-left">
                {controls.map(control => (
                    <div key={control.label} className="flex justify-between items-center">
                        <span className="text-gray-300">{control.label}</span>
                        <div className="flex space-x-1 flex-wrap gap-1 justify-end">
                            {control.keys.map(key => <Keycap key={key}>{key}</Keycap>)}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};


export const SettingsScreen: React.FC<SettingsScreenProps> = ({ settings, setSettings, onClose, t, isGameInProgress, onQuitRun, gameStats }) => {
    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center animate-pop-in z-30 p-4">
            <div className="w-full max-w-2xl glassmorphic-panel rounded-2xl p-6 sm:p-8 relative border-2 border-[var(--color-primary)]/50 shadow-[var(--color-primary)]/20 shadow-2xl flex flex-col max-h-[90vh]">
                <button onClick={onClose} aria-label={t('ui.close')} className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors">
                    <CloseIcon className="w-8 h-8"/>
                </button>
                <h2 className="text-4xl font-title text-center text-transparent bg-clip-text bg-gradient-to-r from-[var(--color-primary)] to-[var(--color-secondary)] mb-8 flex-shrink-0">
                    {t('ui.settings')}
                </h2>

                <div className="overflow-y-auto pr-2 flex-grow space-y-8">
                    {/* Audio Settings */}
                    <div className="space-y-4">
                        <VolumeSlider 
                            label={t('settings.masterVolume')}
                            value={settings.masterVolume}
                            onChange={(e) => setSettings(s => ({...s, masterVolume: +e.target.value}))}
                            icon={<VolumeUpIcon className="w-5 h-5 mr-2" />}
                        />
                         <VolumeSlider 
                            label={t('settings.musicVolume')}
                            value={settings.musicVolume}
                            onChange={(e) => setSettings(s => ({...s, musicVolume: +e.target.value}))}
                            icon={<MusicIcon className="w-5 h-5 mr-2" />}
                        />
                         <VolumeSlider 
                            label={t('settings.sfxVolume')}
                            value={settings.sfxVolume}
                            onChange={(e) => setSettings(s => ({...s, sfxVolume: +e.target.value}))}
                            icon={<StarIcon className="w-5 h-5 mr-2" />}
                        />
                    </div>
                    
                    <hr className="border-white/10"/>

                    {/* Visuals and Language */}
                     <div className="space-y-6">
                        <div>
                            <label htmlFor="language-select" className="block text-lg font-bold text-gray-200 mb-2">{t('settings.language.label')}</label>
                            <div className="relative">
                                <select 
                                    id="language-select"
                                    value={settings.language}
                                    onChange={(e) => setSettings(s => ({...s, language: e.target.value as 'en' | 'pt' | 'es'}))}
                                    disabled={isGameInProgress}
                                    className="block w-full max-w-xs appearance-none bg-black/30 border-2 border-white/20 rounded-md py-2 px-4 text-white disabled:opacity-50"
                                >
                                    <option value="en">English</option>
                                    <option value="pt">Português</option>
                                    <option value="es">Español</option>
                                </select>
                                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-400 max-w-xs">
                                    <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
                                </div>
                                {isGameInProgress && <div className="text-xs text-gray-400 mt-1" title={t('settings.language.disabledTooltip')}>({t('settings.language.disabledTooltip')})</div>}
                            </div>
                        </div>

                        <div>
                            <label className="block text-lg font-bold text-gray-200 mb-2">{t('settings.paletteMode.label')}</label>
                            <div className="flex space-x-2 bg-black/30 p-1 rounded-full max-w-xs">
                                <button 
                                    onClick={() => setSettings(s => ({...s, paletteCycle: true}))}
                                    className={`w-1/2 py-2 rounded-full font-bold transition-colors ${settings.paletteCycle ? 'bg-[var(--color-primary)] text-white shadow-md' : 'text-gray-300 hover:bg-white/10'}`}
                                >
                                    {t('settings.paletteMode.dynamic')}
                                </button>
                                <button 
                                    onClick={() => setSettings(s => ({...s, paletteCycle: false}))}
                                    className={`w-1/2 py-2 rounded-full font-bold transition-colors ${!settings.paletteCycle ? 'bg-[var(--color-primary)] text-white shadow-md' : 'text-gray-300 hover:bg-white/10'}`}
                                >
                                    {t('settings.paletteMode.fixed')}
                                </button>
                            </div>
                        </div>
                        
                        <div className={`transition-opacity duration-300 ${settings.paletteCycle ? 'opacity-50 pointer-events-none' : 'opacity-100'}`}>
                            <label className="block text-lg font-bold text-gray-200 mb-2">{t('settings.colorPalette')}</label>
                            <div className="flex flex-wrap gap-2">
                                {Object.values(PALETTES).map(p => (
                                    <button 
                                        key={p.name} 
                                        onClick={() => setSettings(s => ({...s, palette: p.name}))}
                                        className={`w-10 h-10 rounded-full border-2 transition-all ${settings.palette === p.name ? 'border-white scale-110' : 'border-transparent'}`}
                                        style={{ background: `linear-gradient(45deg, ${p.primary}, ${p.secondary}, ${p.accent})` }}
                                        aria-label={p.name}
                                        title={p.name}
                                    />
                                ))}
                            </div>
                        </div>
                    </div>
                    
                    <hr className="border-white/10"/>

                    {/* Controls */}
                    <ControlsList t={t} />

                </div>

                {isGameInProgress && (
                    <div className="pt-6 mt-auto flex-shrink-0 flex flex-col sm:flex-row items-center justify-between gap-4">
                        <div className="text-left">
                            <p className="font-bold text-gray-300">{t('settings.currentDifficulty')}: <span className="text-purple-300">{t(`ui.difficulty${gameStats.difficulty}`)}</span></p>
                        </div>
                        <button onClick={onQuitRun} className="font-title text-lg bg-red-600 hover:bg-red-500 text-white py-2 px-8 rounded-full shadow-lg shadow-red-600/30">
                            {t('settings.quitRun')}
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};