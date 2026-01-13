
import { Ability, MapTile, Direction } from './types';

export const DIRECTIONS: readonly Direction[] = ['left', 'down', 'up', 'right'];

export const ABILITIES: Record<string, Ability> = {
    // Fight
    'vine': { id: 'vine', name: "ability.vine.name", description: "ability.vine.description", type: 'fight' },
    'stone': { id: 'stone', name: "ability.stone.name", description: "ability.stone.description", type: 'fight' },
    'gale': { id: 'gale', name: "ability.gale.name", description: "ability.gale.description", type: 'fight' },
    'sunfire': { id: 'sunfire', name: "ability.sunfire.name", description: "ability.sunfire.description", type: 'fight' },
    'focus': { id: 'focus', name: "ability.focus.name", description: "ability.focus.description", type: 'fight'},
    'ward': { id: 'ward', name: "ability.ward.name", description: "ability.ward.description", type: 'fight' },
    'rootSnare': { id: 'rootSnare', name: "ability.rootSnare.name", description: "ability.rootSnare.description", type: 'fight' },
    'mirage': { id: 'mirage', name: "ability.mirage.name", description: "ability.mirage.description", type: 'fight' },
    'lifeSap': { id: 'lifeSap', name: "ability.lifeSap.name", description: "ability.lifeSap.description", type: 'fight' },
    'thornBurst': { id: 'thornBurst', name: "ability.thornBurst.name", description: "ability.thornBurst.description", type: 'fight' },
    'shieldBash': { id: 'shieldBash', name: "ability.shieldBash.name", description: "ability.shieldBash.description", type: 'fight' },
    'burningBlade': { id: 'burningBlade', name: "ability.burningBlade.name", description: "ability.burningBlade.description", type: 'fight' },
    'shadow_cloak': { id: 'shadow_cloak', name: "ability.shadow_cloak.name", description: "ability.shadow_cloak.description", type: 'fight' },
    'celestial_strike': { id: 'celestial_strike', name: "ability.celestial_strike.name", description: "ability.celestial_strike.description", type: 'fight' },
    'vengeful_strike': { id: 'vengeful_strike', name: "ability.vengeful_strike.name", description: "ability.vengeful_strike.description", type: 'fight' },
    'purifying_light': { id: 'purifying_light', name: "ability.purifying_light.name", description: "ability.purifying_light.description", type: 'fight' },
    
    // Dance
    'echo': { id: 'echo', name: "ability.echo.name", description: "ability.echo.description", type: 'dance' },
    'twirl': { id: 'twirl', name: "ability.twirl.name", description: "ability.twirl.description", type: 'dance' },
    'flourish': { id: 'flourish', name: "ability.flourish.name", description: "ability.flourish.description", type: 'dance' },
    'crescendo': { id: 'crescendo', name: "ability.crescendo.name", description: "ability.crescendo.description", type: 'dance' },
    'soothingHum': { id: 'soothingHum', name: "ability.soothingHum.name", description: "ability.soothingHum.description", type: 'dance' },
    'tempoShift': { id: 'tempoShift', name: "ability.tempoShift.name", description: "ability.tempoShift.description", type: 'dance' },
    'serenity': { id: 'serenity', name: "ability.serenity.name", description: "ability.serenity.description", type: 'dance' },
    'gracefulPoise': { id: 'gracefulPoise', name: "ability.gracefulPoise.name", description: "ability.gracefulPoise.description", type: 'dance' },
    'rhythmicFlow': { id: 'rhythmicFlow', name: "ability.rhythmicFlow.name", description: "ability.rhythmicFlow.description", type: 'dance' },
    'starlightStep': { id: 'starlightStep', name: "ability.starlightStep.name", description: "ability.starlightStep.description", type: 'dance' },
    'flowState': { id: 'flowState', name: "ability.flowState.name", description: "ability.flowState.description", type: 'dance' },
    'perfectPitch': { id: 'perfectPitch', name: "ability.perfectPitch.name", description: "ability.perfectPitch.description", type: 'dance' },
    'vital_sonata': { id: 'vital_sonata', name: "ability.vital_sonata.name", description: "ability.vital_sonata.description", type: 'dance' },
    'mimics_lament': { id: 'mimics_lament', name: "ability.mimics_lament.name", description: "ability.mimics_lament.description", type: 'dance' },
    'resonant_wave': { id: 'resonant_wave', name: "ability.resonant_wave.name", description: "ability.resonant_wave.description", type: 'dance' },
    'steadfast_rhythm': { id: 'steadfast_rhythm', name: "ability.steadfast_rhythm.name", description: "ability.steadfast_rhythm.description", type: 'dance' },

    // Boons
    'boon_max_hp_1': { id: 'boon_max_hp_1', name: 'ability.boon_max_hp_1.name', description: 'ability.boon_max_hp_1.description', type: 'boon' },
    'boon_regen_1': { id: 'boon_regen_1', name: 'ability.boon_regen_1.name', description: 'ability.boon_regen_1.description', type: 'boon' },
    'boon_speed_1': { id: 'boon_speed_1', name: 'ability.boon_speed_1.name', description: 'ability.boon_speed_1.description', type: 'boon' },
    'boon_stars_1': { id: 'boon_stars_1', name: 'ability.boon_stars_1.name', description: 'ability.boon_stars_1.description', type: 'boon' },
    'boon_compass_1': { id: 'boon_compass_1', name: 'ability.boon_compass_1.name', description: 'ability.boon_compass_1.description', type: 'boon' },
    'boon_radiance_1': { id: 'boon_radiance_1', name: 'ability.boon_radiance_1.name', description: 'ability.boon_radiance_1.description', type: 'boon' },
    'boon_resonance_1': { id: 'boon_resonance_1', name: 'ability.boon_resonance_1.name', description: 'ability.boon_resonance_1.description', type: 'boon' },
    'boon_star_regen_1': { id: 'boon_star_regen_1', name: 'ability.boon_star_regen_1.name', description: 'ability.boon_star_regen_1.description', type: 'boon' },
    'boon_combat_medic_1': { id: 'boon_combat_medic_1', name: 'ability.boon_combat_medic_1.name', description: 'ability.boon_combat_medic_1.description', type: 'boon' },
    'boon_power_1': { id: 'boon_power_1', name: 'ability.boon_power_1.name', description: 'ability.boon_power_1.description', type: 'boon' },
    'boon_grace_1': { id: 'boon_grace_1', name: 'ability.boon_grace_1.name', description: 'ability.boon_grace_1.description', type: 'boon' },
};

export const MAX_PLAYER_HEALTH = 100;

const simpleHash = (s: string) => {
    let h = 0;
    for (let i = 0; i < s.length; i++) h = (Math.imul(31, h) + s.charCodeAt(i)) | 0;
    return h;
};

const shuffle = <T>(array: T[]): T[] => {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
};

type RoomObstacle = NonNullable<MapTile['obstacles']>[0];

// New maze generation using Prim's Algorithm
export const generateLabyrinth = (rows: number, cols: number, floor: number): MapTile[][] => {
    rows = rows % 2 === 0 ? rows + 1 : rows;
    cols = cols % 2 === 0 ? cols + 1 : cols;
    
    const map: MapTile[][] = Array.from({ length: rows }, () => 
        Array.from({ length: cols }, () => ({ type: 'empty' }))
    );

    const isInside = (r: number, c: number) => r >= 0 && r < rows && c >= 0 && c < cols;

    // Start Prim's algorithm
    const startR = Math.floor(Math.random() * Math.floor(rows / 2)) * 2 + 1;
    const startC = Math.floor(Math.random() * Math.floor(cols / 2)) * 2 + 1;
    
    map[startR][startC].type = 'cleared';
    const walls: [number, number, number, number][] = []; // [r, c, fromR, fromC]

    const addWalls = (r: number, c: number) => {
        const directions = [{r: -2, c: 0}, {r: 2, c: 0}, {r: 0, c: -2}, {r: 0, c: 2}];
        for (const dir of directions) {
            const newR = r + dir.r;
            const newC = c + dir.c;
            if (isInside(newR, newC) && map[newR][newC].type === 'empty') {
                walls.push([newR, newC, r, c]);
            }
        }
    };
    
    addWalls(startR, startC);

    while (walls.length > 0) {
        const wallIndex = Math.floor(Math.random() * walls.length);
        const [r, c, fromR, fromC] = walls[wallIndex];
        walls.splice(wallIndex, 1);

        if (map[r][c].type === 'empty') {
            map[r][c].type = 'cleared';
            map[fromR + (r - fromR) / 2][fromC + (c - fromC) / 2].type = 'cleared';
            addWalls(r, c);
        }
    }
    
    // Collect all walkable tiles
    const walkableTiles: { r: number, c: number }[] = [];
    for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
            if (map[r][c].type === 'cleared') {
                const seed = `${r}-${c}-${floor}`;
                
                // Assign a random shape to the room
                const randShape = Math.random();
                if (randShape < 0.2) map[r][c].shape = 'circle';
                else if (randShape < 0.3) map[r][c].shape = 'triangle';
                else map[r][c].shape = 'square';
                map[r][c].wallThickness = Math.random() < 0.3 ? 'thick' : 'normal';

                const generatedObstacles: RoomObstacle[] = [];
                const doorMargin = 25; 
                const doorZones = [
                    { x: 50, y: 0, width: 30, height: doorMargin }, // top
                    { x: 50, y: 100, width: 30, height: doorMargin }, // bottom
                    { x: 0, y: 50, width: doorMargin, height: 30 }, // left
                    { x: 100, y: 50, width: doorMargin, height: 30 } // right
                ];

                const checkOverlap = (o1: { x: number, y: number, width: number, height: number }, o2: { x: number, y: number, width: number, height: number }) => {
                    const r1 = { left: o1.x - o1.width/2, right: o1.x + o1.width/2, top: o1.y - o1.height/2, bottom: o1.y + o1.height/2 };
                    const r2 = { left: o2.x - o2.width/2, right: o2.x + o2.width/2, top: o2.y - o2.height/2, bottom: o2.y + o2.height/2 };
                    return r1.left < r2.right && r1.right > r2.left && r1.top < r2.bottom && r1.bottom > r2.top;
                };

                // Difficulty Scaling for obstacles
                const baseObstacleCount = 2;
                const floorBonus = Math.floor(floor / 2);
                const randomBonus = (Math.abs(simpleHash(seed)) % 3);
                const count = baseObstacleCount + floorBonus + randomBonus;

                for (let i = 0; i < count; i++) {
                    const hash = simpleHash(seed + i);
                    
                    let type: RoomObstacle['type'] = 'rock';
                    const floorFactor = Math.min(floor, 5) / 5;
                    const randVal = Math.random(); 

                    if (randVal < 0.15 + (0.15 * floorFactor)) type = 'spikes'; 
                    else if (randVal < 0.25 + (0.2 * floorFactor)) type = 'cobweb';
                    else if (randVal < 0.5) type = 'wall';

                    const isHazard = type === 'spikes';
                    const isSlow = type === 'cobweb';
                    
                    const newObstacle: RoomObstacle = {
                        x: 25 + (Math.abs(hash) % 50),
                        y: 25 + (Math.abs(simpleHash(seed + i + 'y')) % 50),
                        width: isSlow ? (10 + (Math.abs(hash) % 10)) : (isHazard ? (8 + (Math.abs(hash) % 7)) : (8 + (Math.abs(hash) % 15))),
                        height: isSlow ? (10 + (Math.abs(hash) % 10)) : (isHazard ? (8 + (Math.abs(hash) % 7)) : (8 + (Math.abs(simpleHash(seed + i + 'h')) % 15))),
                        type: type
                    };
                    
                    const obsRect = { x: newObstacle.x, y: newObstacle.y, width: newObstacle.width, height: newObstacle.height };
                    let isInDoorZone = doorZones.some(zone => checkOverlap(obsRect, { x: zone.x, y: zone.y, width: zone.width, height: zone.height }));
                    if (isInDoorZone) continue;
                    
                    let hasOverlap = generatedObstacles.some(existing => checkOverlap(obsRect, existing));
                    if (!hasOverlap) generatedObstacles.push(newObstacle);
                }

                // Generate pit pairs
                const shouldGeneratePitPair = Math.random() < (0.2 + (0.1 * floor)); // More frequent
                if (generatedObstacles.length < 5 && shouldGeneratePitPair) {
                    const pairId = Math.random();
                    let pitType: 'red' | 'green' | 'gray' = 'gray';
                    const pitTypeRand = Math.random();
                    if (pitTypeRand < 0.3) pitType = 'red';
                    else if (pitTypeRand < 0.5) pitType = 'green';
                    
                    const pitSize = { width: 12, height: 12 };
                    let pit1: RoomObstacle | null = null, pit2: RoomObstacle | null = null, attempts = 0;

                    while (attempts < 20 && !pit1) {
                        const p1 = { x: 15 + (Math.random() * 70), y: 15 + (Math.random() * 70), width: pitSize.width, height: pitSize.height, type: 'pit' as const, pitType, pairId, isUsed: false };
                        if (!generatedObstacles.some(obs => checkOverlap(p1, obs)) && !doorZones.some(zone => checkOverlap(p1, {x: zone.x, y: zone.y, width: zone.width, height: zone.height}))) {
                            pit1 = p1;
                        }
                        attempts++;
                    }

                    if (pit1) {
                        attempts = 0;
                        while (attempts < 30 && !pit2) {
                            const p2 = { x: 15 + (Math.random() * 70), y: 15 + (Math.random() * 70), width: pitSize.width, height: pitSize.height, type: 'pit' as const, pitType, pairId, isUsed: false };
                            const dist = Math.sqrt(Math.pow(pit1.x - p2.x, 2) + Math.pow(pit1.y - p2.y, 2));
                            if (dist > 40 && !generatedObstacles.some(obs => checkOverlap(p2, obs)) && !doorZones.some(zone => checkOverlap(p2, {x: zone.x, y: zone.y, width: zone.width, height: zone.height})) && !checkOverlap(p2, pit1)) {
                                pit2 = p2;
                            }
                            attempts++;
                        }
                    }

                    if (pit1 && pit2) generatedObstacles.push(pit1, pit2);
                }
                
                map[r][c].obstacles = generatedObstacles;
                walkableTiles.push({ r, c });
            }
        }
    }
    
    if (walkableTiles.length < 5) {
        console.error("Map generation failed, not enough walkable tiles. Falling back.");
        return [[{type: 'start'}, {type: 'boss'}]];
    }
    
    shuffle(walkableTiles);

    const startPos = walkableTiles.pop()!;
    map[startPos.r][startPos.c].type = 'start';
    map[startPos.r][startPos.c].obstacles = []; // Ensure start room is clear
    map[startPos.r][startPos.c].shape = 'square';
    
    const getDistance = (p1: {r: number, c: number}, p2: {r: number, c: number}) => 
        Math.sqrt(Math.pow(p1.r - p2.r, 2) + Math.pow(p1.c - p2.c, 2));

    let bossPos = walkableTiles.shift()!;
    let attempts = 0;
    while(walkableTiles.length > 0 && getDistance(startPos, bossPos) < Math.min(rows, cols) * 0.6 && attempts < 20) {
        walkableTiles.push(bossPos);
        shuffle(walkableTiles);
        bossPos = walkableTiles.shift()!;
        attempts++;
    }
    map[bossPos.r][bossPos.c].type = 'boss';

    // Clear obstacles from the center of guardian rooms to make space for the descent portal
    const isFinalFloor = floor === 5;
    if (!isFinalFloor) {
        const bossTile = map[bossPos.r][bossPos.c];
        if (bossTile.obstacles) {
            bossTile.obstacles = bossTile.obstacles.filter(obs => {
                const obstacleRadius = Math.max(obs.width, obs.height) / 2;
                const distFromCenter = Math.sqrt(Math.pow(obs.x - 50, 2) + Math.pow(obs.y - 50, 2));
                // A radius of 20 around the center (50,50) should be clear
                return distFromCenter >= 20 + obstacleRadius;
            });
        }
    }
    
    // Add healing rooms
    const numHealing = Math.floor(walkableTiles.length * 0.05) + 1; // ~5% of rooms, at least 1
    for (let i = 0; i < numHealing && walkableTiles.length > 0; i++) {
        const healingPos = walkableTiles.pop()!;
        map[healingPos.r][healingPos.c].type = 'healing';
        map[healingPos.r][healingPos.c].obstacles = []; // Ensure healing rooms are clear
        map[healingPos.r][healingPos.c].shape = 'circle';
    }
    
    // Add shrines
    const numShrines = 1;
    for (let i = 0; i < numShrines && walkableTiles.length > 0; i++) {
        const shrinePos = walkableTiles.pop()!;
        map[shrinePos.r][shrinePos.c].type = 'shrine';
        map[shrinePos.r][shrinePos.c].obstacles = []; // Ensure shrines are in clear rooms
        map[shrinePos.r][shrinePos.c].shape = 'circle';
    }

    const numEncounters = Math.min(walkableTiles.length, Math.floor(walkableTiles.length * 0.70));
    for (let i = 0; i < numEncounters; i++) {
        const encounterPos = walkableTiles.pop()!;
        if (!encounterPos) continue;
        map[encounterPos.r][encounterPos.c].type = 'encounter';
    }

    // Safeguard: Ensure there is always a boss room
    let hasBoss = false;
    for (const row of map) {
        for (const tile of row) {
            if (tile.type === 'boss') {
                hasBoss = true;
                break;
            }
        }
        if (hasBoss) break;
    }

    if (!hasBoss && walkableTiles.length > 0) {
        const emergencyBossPos = walkableTiles.pop()!;
        if(emergencyBossPos) {
             map[emergencyBossPos.r][emergencyBossPos.c].type = 'boss';
        }
    }

    return map;
};