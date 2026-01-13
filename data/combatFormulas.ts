import { FightMove, FightMoveData } from '../types';

// Rebalanced combat values for all fight abilities
export const FIGHT_MOVE_DATA: Record<FightMove, FightMoveData> = {
    // Starting / Basic Moves
    'vine': {
        damageTiers: { miss: 0, weak: 8, good: 18, perfect: 25, crit: 40 }
    },
    'sunfire': {
        starPowerCost: 10,
        baseDamage: 45,
        damageRange: 15 // 45-60 damage
    },

    // Utility & Defensive Moves
    'stone': {},
    'ward': {},
    'focus': {},
    'gale': {
        stunChance: 0.75
    },
    'rootSnare': {},
    'mirage': {},
    'shadow_cloak': {},
    
    // Advanced / Reward Moves
    'lifeSap': {
        baseDamage: 12,
        damageRange: 8, // 12-20 damage
        lifestealFactor: 0.75 // Heals for 75% of damage dealt
    },
    'thornBurst': {
        hits: { min: 3, max: 5, baseDamagePerHit: 6, damageRangePerHit: 4 } // 3-5 hits of 6-10 damage each. Total: 18-50
    },
    'shieldBash': {
        baseDamage: 12,
        damageRange: 6, // 12-18 damage
        stunChance: 0.8
    },
    'burningBlade': {
        baseDamage: 18,
        damageRange: 8, // 18-26 initial damage
        dot: { damage: 8, turns: 2 } // 16 additional damage over 2 turns
    },
    'vengeful_strike': {
        baseDamage: 10,
        scaling: { type: 'missingHealth', factor: 0.6 } // 10 + 60% of missing health
    },
    'purifying_light': {
        baseDamage: 25,
        damageRange: 10, // 25-35 damage
        heal: 15,
        specialBonus: { type: 'antiCategory', category: 'ghost', multiplier: 2.0 }
    },
    'celestial_strike': {
        starPowerCost: 20,
        baseDamage: 80,
        damageRange: 20, // 80-100 damage
        stunChance: 0.7
    },
};
