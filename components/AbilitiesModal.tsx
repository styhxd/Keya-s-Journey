import React from 'react';
import { FightMove, DanceMove, Ability, BoonId } from '../types';
import { ABILITIES } from '../constants';
import { 
    CloseIcon, VineWhipIcon, StoneShieldIcon, GalePushIcon, SunfireIcon, 
    FocusIcon, WardIcon, RootSnareIcon, MirageIcon, LifeSapIcon, ThornBurstIcon,
    EchoStepIcon, HarmoniousTwirlIcon, RhythmicFlourishIcon, CrescendoIcon,
    SoothingHumIcon, TempoShiftIcon, SerenityIcon, GracefulPoiseIcon,
    RhythmicFlowIcon, StarlightStepIcon, StarIcon, SwordIcon, MusicIcon,
    HeartIcon, EyeSlashIcon, SunIcon, ResonanceIcon,
    ShieldBashIcon, BurningBladeIcon, FlowStateIcon, PerfectPitchIcon,
    VitalSonataIcon, MimicsLamentIcon, BoonMaxHpIcon, BoonRegenIcon, BoonSpeedIcon,
    BoonMoreStarsIcon, BoonCompassIcon, BoonStarRegenIcon, BoonCombatMedicIcon,
    VengefulStrikeIcon, PurifyingLightIcon, ResonantWaveIcon, SteadfastRhythmIcon,
    BoonPowerIcon, BoonGraceIcon
} from './icons';

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
    // Dance
    'echo': EchoStepIcon,
    'twirl': HarmoniousTwirlIcon,
    'flourish': RhythmicFlourishIcon,
    'crescendo': CrescendoIcon,
    'soothingHum': SoothingHumIcon,
    'tempoShift': TempoShiftIcon,
    'serenity': SerenityIcon,
    'gracefulPoise': GracefulPoiseIcon,
    'rhythmicFlow': RhythmicFlowIcon,
    'starlightStep': StarlightStepIcon,
    'flowState': FlowStateIcon,
    'perfectPitch': PerfectPitchIcon,
    'vital_sonata': VitalSonataIcon,
    'mimics_lament': MimicsLamentIcon,
    'resonant_wave': ResonantWaveIcon,
    'steadfast_rhythm': SteadfastRhythmIcon,
    // Boon
    'boon_max_hp_1': BoonMaxHpIcon,
    'boon_regen_1': BoonRegenIcon,
    'boon_speed_1': BoonSpeedIcon,
    'boon_stars_1': BoonMoreStarsIcon,
    'boon_compass_1': BoonCompassIcon,
    'boon_radiance_1': SunIcon,
    'boon_resonance_1': ResonanceIcon,
    'boon_star_regen_1': BoonStarRegenIcon,
    'boon_combat_medic_1': BoonCombatMedicIcon,
    'boon_power_1': BoonPowerIcon,
    'boon_grace_1': BoonGraceIcon,
};


interface AbilitiesModalProps {
    abilities: (FightMove | DanceMove | BoonId)[];
    onClose: () => void;
    t: (key: string) => string;
}

const AbilityIconDisplay = React.memo(({ability, t}: {ability: Ability, t: (key: string) => string}) => {
    const Icon = MOVE_ICONS[ability.id] || StarIcon;
    
    const colors = {
        fight: { border: 'border-red-500/30', bg: 'bg-red-900/50', text: 'text-red-300' },
        dance: { border: 'border-blue-500/30', bg: 'bg-blue-900/50', text: 'text-blue-300' },
        boon: { border: 'border-amber-500/30', bg: 'bg-amber-900/50', text: 'text-amber-400' },
    };

    const { border, bg, text } = colors[ability.type];

    return (
        <div className="group relative flex flex-col items-center text-center p-2 rounded-lg w-24">
            <div className={`p-3 rounded-full ${bg} border-2 ${border} ${text} transition-all group-hover:bg-opacity-80 group-hover:scale-110`}>
                <Icon className="w-10 h-10"/>
            </div>
            <p className="font-bold text-xs mt-2 text-gray-200">{t(ability.name)}</p>
            <div className="absolute bottom-full mb-2 w-48 p-3 text-sm bg-slate-800 border border-slate-700 text-white rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-opacity pointer-events-none z-20">
                <h4 className={`font-bold text-md ${text}`}>{t(ability.name)}</h4>
                <p className="text-gray-300 mt-1">{t(ability.description)}</p>
            </div>
        </div>
    );
});
AbilityIconDisplay.displayName = "AbilityIconDisplay";


const AbilitiesModal: React.FC<AbilitiesModalProps> = ({ abilities, onClose, t }) => {
    
    const fightAbilities = abilities.map(id => ABILITIES[id]).filter((a): a is Ability => !!a && a.type === 'fight');
    const danceAbilities = abilities.map(id => ABILITIES[id]).filter((a): a is Ability => !!a && a.type === 'dance');
    const boons = abilities.map(id => ABILITIES[id]).filter((a): a is Ability => !!a && a.type === 'boon');

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center animate-pop-in z-40 p-2 sm:p-4">
            <div className="w-full max-w-4xl h-[90vh] glassmorphic-panel rounded-2xl p-4 sm:p-6 relative border-2 border-[var(--color-primary)]/50 shadow-[var(--color-primary)]/20 shadow-2xl flex flex-col">
                <button onClick={onClose} aria-label={t('ui.close')} className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors z-20">
                    <CloseIcon className="w-8 h-8"/>
                </button>

                <h2 className="text-4xl font-title text-center text-transparent bg-clip-text bg-gradient-to-r from-[var(--color-primary)] to-[var(--color-secondary)] mb-6 flex-shrink-0">
                    {t('ui.abilities')}
                </h2>
                
                <div className="flex-grow overflow-y-auto pr-2 pt-24">
                    {boons.length > 0 && (
                        <div className="mb-4">
                            <h3 className="font-title text-2xl text-amber-400 mb-3 flex items-center"><StarIcon className="w-6 h-6 mr-3" />{t('ui.boon')}s</h3>
                            <div className="flex flex-wrap justify-center gap-2 p-2 bg-black/20 rounded-lg border border-white/10">
                                {boons.map(boon => <AbilityIconDisplay key={boon.id} ability={boon} t={t} />)}
                            </div>
                            <hr className="border-white/10 my-6" />
                        </div>
                    )}
                    
                    <div className="mb-4">
                        <h3 className="font-title text-2xl text-red-400 mb-3 flex items-center"><SwordIcon className="w-6 h-6 mr-3" />{t('ui.fight')}</h3>
                        <div className="flex flex-wrap justify-center gap-2 p-2 bg-black/20 rounded-lg border border-white/10">
                            {fightAbilities.length > 0 ? (
                                fightAbilities.map(ability => <AbilityIconDisplay key={ability.id} ability={ability} t={t} />)
                            ) : (
                                <p className="text-gray-400 p-4">{t('ui.noFightAbilities')}</p>
                            )}
                        </div>
                    </div>

                    <hr className="border-white/10 my-6" />

                    <div>
                        <h3 className="font-title text-2xl text-blue-400 mb-3 flex items-center"><MusicIcon className="w-6 h-6 mr-3" />{t('ui.dance')}</h3>
                        <div className="flex flex-wrap justify-center gap-2 p-2 bg-black/20 rounded-lg border border-white/10">
                            {danceAbilities.length > 0 ? (
                                danceAbilities.map(ability => <AbilityIconDisplay key={ability.id} ability={ability} t={t} />)
                            ) : (
                                <p className="text-gray-400 p-4">{t('ui.noDanceAbilities')}</p>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AbilitiesModal;