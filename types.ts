

export type Direction = 'left' | 'down' | 'up' | 'right';
export type Difficulty = 'Normal' | 'Hard' | 'Requiem';

export enum GameState {
  START_SCREEN,
  MAP,
  ENCOUNTER,
  FIGHT_GAME,
  RHYTHM_GAME,
  ACTION_RESULT,
  REWARD_SCREEN,
  ENDING,
  SETTINGS,
  GAME_OVER,
  BOSS_FIGHT,
  ENDINGS_GALLERY,
  AURA_UPDATE,
  CREDITS,
  SURPRISE_BOSS_INTRO,
}

export type EnemyCategory = 'humanoid' | 'ghost' | 'beast' | 'elemental' | 'construct' | 'plant';

export interface Encounter {
  name: string;
  description: string;
  seed: string;
  category: EnemyCategory;
  isBoss?: boolean;
  isGuardian?: boolean;
  archetype?: 'fighter' | 'dancer' | 'balanced';
  sizeModifier?: number;
}

export type FightMove = 'vine' | 'stone' | 'gale' | 'sunfire' | 'focus' | 'ward' | 'rootSnare' | 'mirage' | 'lifeSap' | 'thornBurst' | 'shieldBash' | 'burningBlade' | 'shadow_cloak' | 'celestial_strike' | 'vengeful_strike' | 'purifying_light';
export type DanceMove = 'echo' | 'twirl' | 'flourish' | 'crescendo' | 'soothingHum' | 'serenity' | 'tempoShift' | 'gracefulPoise' | 'rhythmicFlow' | 'starlightStep' | 'flowState' | 'perfectPitch' | 'vital_sonata' | 'mimics_lament' | 'resonant_wave' | 'steadfast_rhythm';
export type BoonId = 'boon_max_hp_1' | 'boon_regen_1' | 'boon_speed_1' | 'boon_stars_1' | 'boon_compass_1' | 'boon_radiance_1' | 'boon_resonance_1' | 'boon_star_regen_1' | 'boon_combat_medic_1' | 'boon_power_1' | 'boon_grace_1';
export type AbilityType = 'fight' | 'dance' | 'boon';


export interface Ability {
    id: FightMove | DanceMove | BoonId;
    name: string;
    description: string;
    type: AbilityType;
}

export interface FightMoveData {
    baseDamage?: number;
    damageRange?: number;
    damageTiers?: {
        miss: number;
        weak: number;
        good: number;
        perfect: number;
        crit: number;
    };
    hits?: {
        min: number;
        max: number;
        baseDamagePerHit: number;
        damageRangePerHit: number;
    };
    starPowerCost?: number;
    stunChance?: number;
    dot?: {
        damage: number;
        turns: number;
    };
    lifestealFactor?: number;
    scaling?: {
        type: 'missingHealth';
        factor: number;
    };
    specialBonus?: {
        type: 'antiCategory';
        category: 'ghost';
        multiplier: number;
    };
    heal?: number;
}

export interface MapTile {
    type: 'start' | 'encounter' | 'boss' | 'empty' | 'cleared' | 'healing' | 'shrine';
    encounter?: Encounter;
    visited?: boolean;
    obstacles?: { 
        x: number, 
        y: number, 
        width: number, 
        height: number, 
        type: 'wall' | 'spikes' | 'pit' | 'rock' | 'cobweb',
        pitType?: 'red' | 'green' | 'gray',
        pairId?: number,
        isUsed?: boolean
    }[];
    fountainUsed?: boolean;
    shrineUsed?: boolean;
    shape?: 'square' | 'circle' | 'triangle';
    wallThickness?: 'normal' | 'thick';
    hasDescentHole?: boolean;
}

export interface GameStats {
  fights: number;
  dances: number;
  encountersDefeated: number;
  bossDefeated: boolean;
  difficulty: Difficulty;
}

export interface PlayerState {
    position: { row: number; col: number };
    health: number;
    maxHealth: number;
    abilities: (FightMove | DanceMove | BoonId)[];
    starPower: number;
    alignment: number;
    currentFloor: number;
}

export interface Palette {
    name: string;
    bg: string;
    primary: string;
    secondary: string;
    accent: string;
}

export interface GameSettings {
    masterVolume: number;
    musicVolume: number;
    sfxVolume: number;
    palette: string;
    paletteCycle: boolean;
    language: 'en' | 'pt' | 'es';
}

export type UnlockedEnding = {
    path: 'PURE_SHADOW' | 'TAINTED_SHADOW' | 'BALANCE' | 'HARMONIOUS_SHEPHERD' | 'PURE_HARMONY' | 'GAME_OVER';
    firstUnlocked: {
        key: string;
        timestamp: number;
    };
    difficulties: Difficulty[];
};

export type CollectibleStar = { id: number; x: number; y: number; collected: boolean; scale: number; };
export type StarMap = Record<string, CollectibleStar[]>;