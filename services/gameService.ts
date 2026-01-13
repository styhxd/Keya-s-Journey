
import { Encounter, PlayerState, UnlockedEnding } from '../types';
import { ENCOUNTERS, BOSSES } from '../data/enemies';
import { MINIBOSSES } from '../data/minibosses';
import { TEXTS } from '../data/narrative';

const shuffle = <T>(array: T[]): T[] => {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
};

const simpleHash = (s: string) => {
    let h = 0;
    for (let i = 0; i < s.length; i++) h = (Math.imul(31, h) + s.charCodeAt(i)) | 0;
    return h;
};

let availableEncounters = shuffle([...ENCOUNTERS]);
let availableMinibosses: Record<number, Encounter[]> = {};

function getNextEncounter(): Encounter {
    if (availableEncounters.length === 0) {
        availableEncounters = shuffle([...ENCOUNTERS]);
    }
    return availableEncounters.pop()!;
}

function getNextMiniboss(floor: number): Encounter {
    if (!availableMinibosses[floor] || availableMinibosses[floor].length === 0) {
        availableMinibosses[floor] = shuffle([...(MINIBOSSES[floor] || [])]);
    }
    if(availableMinibosses[floor].length === 0) {
        return { name: "minibosses.lost_guardian.name", description: "minibosses.lost_guardian.description", seed: `LostGuardian${floor}`, category: 'ghost', isGuardian: true, archetype: 'balanced' };
    }
    return availableMinibosses[floor].pop()!;
}

function getRandomItem<T>(arr: T[]): T {
    if (!arr || arr.length === 0) {
        return '' as unknown as T;
    }
    return arr[Math.floor(Math.random() * arr.length)];
}

export const gameService = {
    initializeGame: () => {
        availableEncounters = shuffle([...ENCOUNTERS]);
        availableMinibosses = {};
        Object.keys(MINIBOSSES).forEach(floorKey => {
            const floorNum = parseInt(floorKey, 10);
            availableMinibosses[floorNum] = shuffle([...MINIBOSSES[floorNum]]);
        });
    },
    
    generateEncounter: (): Encounter => {
        return getNextEncounter();
    },

    generateMiniboss: (floor: number): Encounter => {
        return getNextMiniboss(floor);
    },
    
    generateSurpriseBoss: (): Encounter => {
        const surpriseBossPool = BOSSES.filter(b => b.seed !== "KeyasShadow");
        return getRandomItem(surpriseBossPool);
    },

    generateFinalBoss: (): Encounter => {
        return { 
            name: "bosses.keyas_shadow.name", 
            seed: "KeyasShadow", 
            description: "bosses.keyas_shadow.description", 
            category: 'humanoid', 
            isBoss: true 
        };
    },

    generateOutcomeKey: (type: 'fight' | 'dance', lang: 'en' | 'pt' | 'es'): string => {
        const outcomes = (TEXTS[lang] as any).outcomes[type];
        const outcomeKeys = Object.keys(outcomes);
        const randomKey = getRandomItem(outcomeKeys);
        return `outcomes.${type}.${randomKey}`;
    },
    
    generateEnding: (player: PlayerState, lang: 'en' | 'pt' | 'es'): { endingKey: string, path: UnlockedEnding['path'] } => {
        const { alignment } = player;
        let path: UnlockedEnding['path'];
        
        if (alignment <= -45) { path = 'PURE_SHADOW'; }
        else if (alignment <= -20) { path = 'TAINTED_SHADOW'; }
        else if (alignment >= 45) { path = 'PURE_HARMONY'; }
        else if (alignment >= 20) { path = 'HARMONIOUS_SHEPHERD'; }
        else { path = 'BALANCE'; }
        
        const languagePack = (TEXTS[lang] as any);
        const endingTexts = languagePack.endings[path].text;
        const randomIndex = Math.floor(Math.random() * endingTexts.length);
        const endingKey = `endings.${path}.text.${randomIndex}`;

        return { endingKey, path };
    },
    shuffle,
    simpleHash,
    getRandomItem,
};