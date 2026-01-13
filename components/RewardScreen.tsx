

import React from 'react';
import { Ability } from '../types';
import { 
    StarIcon, VineWhipIcon, StoneShieldIcon, GalePushIcon, SunfireIcon, 
    FocusIcon, WardIcon, RootSnareIcon, MirageIcon, LifeSapIcon, ThornBurstIcon,
    EchoStepIcon, HarmoniousTwirlIcon, RhythmicFlourishIcon, CrescendoIcon,
    SoothingHumIcon, TempoShiftIcon, SerenityIcon, GracefulPoiseIcon,
    RhythmicFlowIcon, StarlightStepIcon, EyeSlashIcon, SunIcon, ResonanceIcon,
    ShieldBashIcon, BurningBladeIcon, FlowStateIcon, PerfectPitchIcon,
    VitalSonataIcon, MimicsLamentIcon, BoonMaxHpIcon, BoonRegenIcon, BoonSpeedIcon,
    BoonMoreStarsIcon, BoonCompassIcon, BoonStarRegenIcon, BoonCombatMedicIcon,
    VengefulStrikeIcon, PurifyingLightIcon, ResonantWaveIcon, SteadfastRhythmIcon,
    BoonPowerIcon, BoonGraceIcon
} from './icons';
import { FadingWordText } from './FadingWordText';

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

interface RewardScreenProps {
    ability: Ability;
    onClose: () => void;
    t: (key: string, replacements?: Record<string, string | number>) => string;
    language: 'en' | 'pt' | 'es';
}

export const RewardScreen: React.FC<RewardScreenProps> = ({ ability, onClose, t, language }) => {
    const Icon = MOVE_ICONS[ability.id] || StarIcon;
    
    const colors = {
        fight: { border: 'border-red-500/50', title: 'text-red-400', bg: 'bg-red-500/80' },
        dance: { border: 'border-blue-500/50', title: 'text-blue-400', bg: 'bg-blue-500/80' },
        boon: { border: 'border-amber-500/50', title: 'text-amber-400', bg: 'bg-amber-500/80' }
    };
    const { border: borderColor, title: titleColor, bg: typeBgColor } = colors[ability.type];
    
    const translatedName = t(ability.name);
    const loreKey = `abilityLore.${ability.id}`;
    const loreText = t(loreKey);

    const iconAnimationClass = 
        ability.id === 'boon_max_hp_1' ? 'animate-reward-heart-pulse' :
        ability.id === 'boon_stars_1' ? 'animate-reward-star-shimmer' : '';

    return (
        <div className="flex flex-col items-center justify-center h-full text-center p-4">
            <h2 className="font-title text-4xl sm:text-5xl text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 to-amber-500 mb-6 drop-shadow-lg">{t('ui.newPowerUnlocked')}</h2>
            
            <div className={`relative w-full max-w-sm p-6 rounded-2xl border-2 ${borderColor} bg-black/30 shadow-2xl animate-pop-in`} style={{ animation: 'pop-in 0.5s ease-out, reward-glow 3s infinite ease-in-out' }}>
                <div className={`absolute top-4 right-4 px-3 py-1 rounded-full text-sm font-bold uppercase tracking-wider ${typeBgColor} text-white`}>
                    {t('ui.' + ability.type)}
                </div>
                <div className={`mx-auto w-20 h-20 p-4 rounded-full ${titleColor} bg-black/50 mb-4 flex items-center justify-center ${iconAnimationClass}`}>
                    <Icon className="w-full h-full" />
                </div>
                <h3 className={`font-title text-3xl ${titleColor} mb-2`}>{translatedName}</h3>
                <p className="text-gray-300 mb-4">{t(ability.description)}</p>
                
                <hr className={`my-4 ${borderColor}`} />
                
                <div className="text-gray-200 italic">
                     <FadingWordText text={loreText || t('ui.learnedAbility', { abilityName: translatedName })} key={`${loreText}-${language}`} />
                </div>
            </div>

            <button onClick={onClose} className="font-title text-xl sm:text-2xl mt-8 bg-gradient-to-br from-yellow-400 to-amber-500 hover:brightness-110 text-black font-bold py-3 px-10 rounded-full shadow-lg shadow-yellow-500/30 transform hover:scale-105 transition-all duration-300">
                {t('ui.continueJourney')}
            </button>
        </div>
    );
}