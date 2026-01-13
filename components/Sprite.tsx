import React, { useMemo, useRef, useEffect } from 'react';
import { Encounter } from '../types';

const simpleHash = (str: string): number => {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i);
        hash = (hash << 5) - hash + char;
        hash |= 0; 
    }
    return Math.abs(hash);
};

const palettes = [
    { base: '#6A5ACD', accent: '#FFD700', shadow: '#483D8B', outline: '#2F2A5A' }, // SlateBlue, Gold
    // { base: '#4682B4', accent: '#FF6347', shadow: '#2E5A8A', outline: '#1F3C59' }, // SteelBlue, Tomato - REMOVED to fix blue square bug
    { base: '#3CB371', accent: '#FFFAF0', shadow: '#2A7D4F', outline: '#1D5937' }, // MediumSeaGreen, FloralWhite
    { base: '#CD5C5C', accent: '#F0E68C', shadow: '#8B3A3A', outline: '#5C2727' }, // IndianRed, Khaki
    { base: '#8A2BE2', accent: '#00FF7F', shadow: '#5D1D9C', outline: '#3E136A' }, // BlueViolet, SpringGreen
    { base: '#20B2AA', accent: '#F4A460', shadow: '#167d76', outline: '#0f544f' }, // LightSeaGreen, SandyBrown
    { base: '#d946ef', accent: '#fde047', shadow: '#a21caf', outline: '#701a75' }, // Fuchsia, Yellow
    { base: '#14b8a6', accent: '#f97316', shadow: '#0f766e', outline: '#134e4a' }, // Teal, Orange
];

const hexToRgb = (hex: string) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
    } : null;
};

const rgbToHex = (r: number, g: number, b: number) => "#" + [r, g, b].map(x => {
    const hex = Math.round(x).toString(16);
    return hex.length === 1 ? "0" + hex : hex;
}).join('');

const interpolateColor = (color1: string, color2: string, factor: number) => {
    const rgb1 = hexToRgb(color1);
    const rgb2 = hexToRgb(color2);
    if (!rgb1 || !rgb2) return color1;
    factor = Math.max(0, Math.min(1, factor));
    const result = {
        r: rgb1.r + factor * (rgb2.r - rgb1.r),
        g: rgb1.g + factor * (rgb2.g - rgb1.g),
        b: rgb1.b + factor * (rgb2.b - rgb1.b),
    };
    return rgbToHex(result.r, result.g, result.b);
};

interface SpriteProps {
    seed: string;
    size: number; 
    isHit?: boolean;
    className?: string;
    alignment?: number; // -50 (dark) to +50 (light)
    encounter?: Encounter;
    isDead?: boolean;
}

type PixelGrid = (string | null)[][];
const createGrid = (size: number): PixelGrid => Array.from({ length: size }, () => Array(size).fill(null));

const generateDescentPortal = (): PixelGrid => {
    const gridSize = 32;
    const pixels = createGrid(gridSize);
    const midX = gridSize / 2 - 0.5;
    const midY = gridSize / 2 - 0.5;

    const p = {
        outer: '#a855f7', // --color-primary
        inner: '#4c1d95', // dark purple
        core: '#0d0c1d', // --color-bg
        stars: '#e5e7eb' // --color-text
    };

    for (let y = 0; y < gridSize; y++) {
        for (let x = 0; x < gridSize; x++) {
            const dist = Math.sqrt(Math.pow(x - midX, 2) + Math.pow(y - midY, 2));
            
            if (dist < 15) {
                if (dist > 12) { // Outer edge, fade out
                    pixels[y][x] = interpolateColor(p.outer, 'transparent', (dist - 12) / 3);
                } else if (dist > 7) { // Main swirling body
                    const angle = Math.atan2(y - midY, x - midX) + (dist * 0.4);
                    const swirlFactor = (Math.sin(angle * 6) + 1) / 2;
                    pixels[y][x] = interpolateColor(p.inner, p.outer, swirlFactor);
                } else if (dist > 3) { // Inner edge, fade to black
                    pixels[y][x] = interpolateColor(p.core, p.inner, (dist - 3) / 4);
                } else { // Core
                    pixels[y][x] = p.core;
                }

                // Add some stars
                if (dist > 4 && dist < 11) {
                    // Using sin/cos for a pseudo-random but deterministic pattern
                    const particleRand = Math.sin(x * 2.5 + dist) * Math.cos(y * 2.5 - dist);
                    if (particleRand > 0.92) {
                        pixels[y][x] = p.stars;
                    }
                }
            }
        }
    }
    return pixels;
};

const generatePortal = (type: 'red' | 'green' | 'gray'): PixelGrid => {
    const gridSize = 32;
    const pixels = createGrid(gridSize);
    const midX = gridSize / 2 - 0.5;
    const midY = gridSize / 2 - 0.5;
    
    const colors = {
        red: { outer: '#ef4444', inner: '#7f1d1d', core: '#fee2e2', particles: '#fca5a5' },
        green: { outer: '#4ade80', inner: '#15803d', core: '#dcfce7', particles: '#86efac' },
        gray: { outer: '#a1a1aa', inner: '#404040', core: '#e5e7eb', particles: '#d4d4d8' },
    };
    const p = colors[type];

    for (let y = 0; y < gridSize; y++) {
        for (let x = 0; x < gridSize; x++) {
            const dist = Math.sqrt(Math.pow(x - midX, 2) + Math.pow(y - midY, 2));
            
            const angle = Math.atan2(y - midY, x - midX) + (dist * 0.5);
            const swirlFactor = (Math.sin(angle * 5) + 1) / 2;

            if (dist < 14) {
                if (dist > 11) {
                    pixels[y][x] = interpolateColor(p.outer, 'transparent', (dist - 11) / 3);
                } else if (dist > 6) {
                    const color = interpolateColor(p.inner, p.outer, (dist - 6) / 5);
                    pixels[y][x] = interpolateColor(color, '#000000', swirlFactor * 0.3);
                } else if (dist > 2) {
                    const color = interpolateColor(p.core, p.inner, (dist - 2) / 4);
                    pixels[y][x] = interpolateColor(color, '#000000', swirlFactor * 0.4);
                } else {
                    pixels[y][x] = p.core;
                }
            }
            
            if (dist > 5 && dist < 12) {
                const particleRand = Math.sin(x * 3) * Math.cos(y*5);
                if (particleRand > 0.8) {
                    pixels[y][x] = p.particles;
                }
            }
        }
    }
    return pixels;
};

const generateHealingFountain = (): PixelGrid => {
    const gridSize = 32;
    const pixels = createGrid(gridSize);
    const p = {
        stone: '#6b7280', stone_shadow: '#4b5563',
        water: '#60a5fa', water_light: '#93c5fd',
        glow: '#e0f2fe',
        outline: '#374151'
    };
    const colorMap: {[key: string]: string} = {
        'o': p.outline,
        'S': p.stone, 's': p.stone_shadow,
        'W': p.water, 'w': p.water_light, 'G': p.glow
    };
    const layout = [
        "................................",
        "................................",
        ".............sSsoosSs..........",
        "...........sSwwWwWwwSso.........",
        "..........sSGWWWWWwwGSs.........",
        ".........sSWWwGwGWWwwSs.........",
        "........sSSwWwGwGWWwwSs.........",
        ".......oSSSWWwGwGWWwSSSo........",
        "......oSSsSSWWWWWwSSsSSSo.......",
        ".....oSSsSSSSSSSSSsSSSo.......",
        "....oSSsSssSSSSSssSsSSSo......",
        "...oSSsSssSSSSSssSsSSSo.......",
        "..oSSsSssSSSSSssSsSSSo........",
        ".oSSsSssSSSSSssSsSSSo.........",
        "oSSSSssSSSSSssSSSSSo..........",
        "osssssssssssssssssso..........",
        "oooooooooooooooooooooooooooooo",
        "................................",
        "................................",
        "................................",
        "................................",
        "................................",
        "................................",
        "................................",
        "................................",
        "................................",
        "................................",
        "................................",
        "................................",
        "................................",
        "................................",
        "................................",
    ];

     for (let y = 0; y < gridSize; y++) {
        for (let x = 0; x < gridSize; x++) {
            const char = layout[y]?.[x];
            if (char && char !== '.') {
                pixels[y][x] = colorMap[char];
            }
        }
    }
    return pixels;
};

const generateShrine = (): PixelGrid => {
    const gridSize = 32;
    const pixels = createGrid(gridSize);
    const p = {
        stone: '#a1a1aa', stone_shadow: '#71717a',
        gem: '#22d3ee', gem_light: '#67e8f9', glow: '#cffafe',
        outline: '#52525b'
    };
    const colorMap: {[key: string]: string} = {
        'o': p.outline, 'S': p.stone, 's': p.stone_shadow,
        'G': p.gem, 'g': p.gem_light, 'L': p.glow
    };
    const layout = [
        "................................",
        "................................",
        "................................",
        "................................",
        "..............sSsoosSs..........",
        ".............sSssssssSs.........",
        "............sSssssssssSs........",
        "...........oSSssssssssSSo.......",
        "..........oSSssSGGGSssSSo.......",
        ".........oSSsSgLLGgSssSSo.......",
        ".........oSSsSgLGGgSssSSo.......",
        ".........oSSsSgGGgGSssSSo.......",
        "..........oSSsSGGGSsSSo.........",
        "...........oSSsSSSsSSo..........",
        "............osssssssso..........",
        ".........sSsoooooooosSs.........",
        "........sSssssssssssssSs........",
        ".......sSssssssssssssssSs.......",
        "......oSSSSSSSSSSSSSSSSSSo......",
        ".....osssssssssssssssssssso.....",
        "....oooooooooooooooooooooooo....",
        "................................",
        "................................",
        "................................",
        "................................",
        "................................",
        "................................",
        "................................",
        "................................",
        "................................",
        "................................",
        "................................",
    ];
    for (let y = 0; y < gridSize; y++) {
        for (let x = 0; x < gridSize; x++) {
            const char = layout[y]?.[x];
            if (char && char !== '.') {
                pixels[y][x] = colorMap[char];
            }
        }
    }
    return pixels;
};


const generateKeya = (alignment: number = 0, isShadow: boolean = false, isDead: boolean = false): PixelGrid => {
    const gridSize = 32;
    const pixels = createGrid(gridSize);
    
    const alignmentFactor = alignment / 50;

    const neutral = {
        hair: '#6b7280', hair_shadow: '#4b5563',
        skin: '#d1d5db', skin_shadow: '#9ca3af',
        dress: '#60a5fa', dress_shadow: '#3b82f6', dress_accent: '#93c5fd', // Blue outfit
        eye: '#34d399',
        outline: '#374151',
    };
    
    const light = {
        hair: '#fefce8', hair_shadow: '#fef9c3',
        skin: '#fde68a', skin_shadow: '#fcd34d',
        dress: '#f8fafc', dress_shadow: '#e2e8f0', dress_accent: '#a5b4fc', // White outfit
        eye: '#0ea5e9',
        outline: '#4c1d95',
    };
    
    const dark = {
        hair: '#374151', hair_shadow: '#1f2937',
        skin: '#9ca3af', skin_shadow: '#6b7280',
        dress: '#1e293b', dress_shadow: '#0f172a', dress_accent: '#4338ca', // Dark Slate outfit
        eye: '#dc2626',
        outline: '#000000',
    };
    
    let p;

    if (isDead) {
        p = {
            hair: '#4a4a4a', hair_shadow: '#3a3a3a',
            skin: '#6a6a6a', skin_shadow: '#5a5a5a',
            dress: '#333333', dress_shadow: '#222222', dress_accent: '#555555',
            eye: '#111111',
            outline: '#000000',
        };
    } else if (isShadow) {
        const shadowAlignmentFactor = (alignment + 50) / 100;
        const shadowMain = interpolateColor('#111827', '#f9fafb', shadowAlignmentFactor);
        const shadowSecondary = interpolateColor('#374151', '#e5e7eb', shadowAlignmentFactor);
        p = {
            hair: shadowMain,
            hair_shadow: interpolateColor(shadowMain, '#000000', 0.4),
            skin: shadowSecondary,
            skin_shadow: interpolateColor(shadowSecondary, '#000000', 0.2),
            dress: shadowMain,
            dress_shadow: interpolateColor(shadowMain, '#000000', 0.3),
            dress_accent: interpolateColor('#ef4444', '#60a5fa', shadowAlignmentFactor),
            eye: interpolateColor('#ef4444', '#facc15', shadowAlignmentFactor),
            outline: '#000000'
        };
    } else {
        if (alignmentFactor >= 0) {
            p = {
                hair: interpolateColor(neutral.hair, light.hair, alignmentFactor),
                hair_shadow: interpolateColor(neutral.hair_shadow, light.hair_shadow, alignmentFactor),
                skin: interpolateColor(neutral.skin, light.skin, alignmentFactor),
                skin_shadow: interpolateColor(neutral.skin_shadow, light.skin_shadow, alignmentFactor),
                dress: interpolateColor(neutral.dress, light.dress, alignmentFactor),
                dress_shadow: interpolateColor(neutral.dress_shadow, light.dress_shadow, alignmentFactor),
                dress_accent: interpolateColor(neutral.dress_accent, light.dress_accent, alignmentFactor),
                eye: interpolateColor(neutral.eye, light.eye, alignmentFactor),
                outline: interpolateColor(neutral.outline, light.outline, alignmentFactor),
            };
        } else {
            p = {
                hair: interpolateColor(neutral.hair, dark.hair, -alignmentFactor),
                hair_shadow: interpolateColor(neutral.hair_shadow, dark.hair_shadow, -alignmentFactor),
                skin: interpolateColor(neutral.skin, dark.skin, -alignmentFactor),
                skin_shadow: interpolateColor(neutral.skin_shadow, dark.skin_shadow, -alignmentFactor),
                dress: interpolateColor(neutral.dress, dark.dress, -alignmentFactor),
                dress_shadow: interpolateColor(neutral.dress_shadow, dark.dress_shadow, -alignmentFactor),
                dress_accent: interpolateColor(neutral.dress_accent, dark.dress_accent, -alignmentFactor),
                eye: interpolateColor(neutral.eye, dark.eye, -alignmentFactor),
                outline: interpolateColor(neutral.outline, dark.outline, -alignmentFactor),
            };
        }
    }

    const colorMap: {[key: string]: string} = { 
        'o': p.outline,
        'H': p.hair, 'h': p.hair_shadow,
        'S': p.skin, 's': p.skin_shadow, 
        'D': p.dress, 'd': p.dress_shadow, 'A': p.dress_accent,
        'E': p.eye, 'W': '#ffffff'
    };
    
    const layout = [
        "................................",
        ".............ooooooo............",
        "...........ooHHHHHHHoo..........",
        "..........oHhHHHHHHHHo..........",
        ".........oHhHHHHHHHHhHo.........",
        ".........oHhHHHHHHHHhHo.........",
        "........oHHHSSSSSSHHHHo.........",
        "........oHHsSSSSsSHHHHo.........",
        ".......oHHsSWSsSWSSHhHo.........",
        ".......oHhsSEssESSHhHo.........",
        ".......oHhsssssssSHhHo.........",
        ".......oHHoSSSoSSHHo..........",
        "........oHoodooHHo............",
        ".........oDooDoo..............",
        ".......oodDDDDDDddoo..........",
        "......odDDDDADDDDddo..........",
        ".....odDdDDADDDDdDdo..........",
        "....odDdDAdAdADDdDdo..........",
        "....odDddAdAdAddDdDo..........",
        "...oDddddAAAAAddddDo..........",
        "..oDdddddddddddddddDo.........",
        "..oDdddDDDDDDDDddddDo.........",
        ".oDddDDdDDDDdDDddddDo.........",
        ".oDDdDDDDDDDDDDDddDDo.........",
        ".oDDDDDDDDDDDDDDddDDo.........",
        "..ooDDDDDDDDDDDDoo..........",
        "....odddddddddddo.............",
        "....oHHo.....oHHo.............",
        "...oHHHo.....oHHHo............",
        "..oooooo.....oooooo...........",
        "................................",
        "................................",
    ];

    for (let y = 0; y < gridSize; y++) {
        for (let x = 0; x < gridSize; x++) {
            const char = layout[y]?.[x];
            if (char && char !== '.') {
                pixels[y][x] = colorMap[char];
            }
        }
    }
    return pixels;
};

const generateEnemy = (encounter: Encounter): PixelGrid => {
    const gridSize = 32;
    const pixels = createGrid(gridSize);
    const h = (s: string) => simpleHash(encounter.seed + s);
    const p = palettes[h('palette') % palettes.length];
    const midX = gridSize / 2;
    const midY = gridSize / 2;

    const drawPixel = (x: number, y: number, color: string | null) => {
        if (!color) return;
        const rX = Math.round(x);
        const rY = Math.round(y);
        if (rX >= 0 && rX < gridSize && rY >= 0 && rY < gridSize) {
            pixels[rY][rX] = color;
        }
    };
    
    const drawMirrored = (x: number, y: number, color: string | null) => {
        drawPixel(midX + x, y, color);
        drawPixel(midX - 1 - x, y, color);
    };

    const drawBlob = (cx: number, cy: number, r: number, color1: string, color2: string, seed: string) => {
        for (let y = cy - r; y <= cy + r; y++) {
            for (let x = cx - r; x <= cx + r; x++) {
                const hx = simpleHash(seed + x);
                const hy = simpleHash(seed + y);
                const dist = Math.sqrt(Math.pow(x - cx, 2) + Math.pow(y - cy, 2));
                const noise = Math.sin(x * (hx % 5 + 2) / 10) * Math.cos(y * (hy % 5 + 2) / 10) * (r / 4);
                if (dist < r + noise) {
                    const color = interpolateColor(color1, color2, dist / r);
                    drawPixel(x, y, color);
                }
            }
        }
    };
    
    switch (encounter.category) {
        case 'ghost':
            drawBlob(midX, midY + 4, 10, p.base, p.shadow, 'body');
            drawBlob(midX, midY - 2, 4, p.base, p.accent, 'head');
            drawPixel(midX - 2, midY - 2, '#FFF');
            drawPixel(midX + 1, midY - 2, '#FFF');
            break;
        case 'beast':
            for (let y = 12; y < 22; y++) for (let x = 0; x < 6; x++) drawMirrored(x, y, p.base);
            for (let y = 8; y < 14; y++) for (let x = 0; x < 4; x++) drawMirrored(x, y, p.shadow);
            drawMirrored(1, 10, p.accent);
            for (let y = 22; y < 26; y++) {
                drawMirrored(4, y, p.shadow);
                drawMirrored(1, y, p.shadow);
            }
            break;
        case 'plant':
            for (let y = 10; y < 28; y++) {
                const xOff = Math.sin(y / 4 + h('stem')) * 2;
                drawPixel(midX + xOff, y, p.shadow);
                drawPixel(midX + xOff + 1, y, p.shadow);
            }
            const numPetals = 5 + h('petals') % 4;
            for (let i = 0; i < numPetals; i++) {
                const angle = (i / numPetals) * Math.PI * 2;
                const r = 6;
                drawBlob(midX + Math.cos(angle) * r, 10 + Math.sin(angle) * r, 3, p.base, p.accent, `petal${i}`);
            }
            break;
        case 'construct':
            const w = 4 + h('w') % 4;
            const h_ = 6 + h('h') % 5;
            for (let y = 0; y < h_; y++) {
                for (let x = 0; x < w; x++) {
                    if (h(`p${x}${y}`) % 10 > (y/h_ > 0.5 ? 2 : 1) )
                        drawMirrored(x, 10 + y, interpolateColor(p.base, p.shadow, y/h_));
                }
            }
            drawBlob(midX, 14, 2, p.accent, '#FFF', 'core');
            break;
        case 'humanoid':
            for (let y = 6; y < 12; y++) for (let x = 0; x < 3; x++) drawMirrored(x, y, p.base);
            for (let y = 12; y < 20; y++) for (let x = 0; x < 4; x++) drawMirrored(x, y, p.shadow);
            for (let y = 12; y < 18; y++) { drawMirrored(4, y, p.base); drawMirrored(5, y, p.base); }
            for (let y = 20; y < 26; y++) { drawMirrored(0, y, p.shadow); drawMirrored(3, y, p.shadow); }
            drawMirrored(0, 14, p.accent);
            break;
        case 'elemental':
            const numOrbs = 4 + h('orbs') % 5;
            for (let i = 0; i < numOrbs; i++) {
                const r = 3 + h(`r${i}`) % 4;
                const x = midX + (h(`x${i}`) % 20 - 10);
                const y = midY + (h(`y${i}`) % 20 - 10);
                drawBlob(x, y, r, p.base, p.accent, `orb${i}`);
            }
            break;
    }
    
    const finalPixels = createGrid(gridSize);
    for (let y = 0; y < gridSize; y++) {
        for (let x = 0; x < gridSize; x++) {
            if (pixels[y][x]) {
                finalPixels[y][x] = pixels[y][x];
            } else {
                const neighbors = [[-1, 0], [1, 0], [0, -1], [0, 1]];
                for(const [dy, dx] of neighbors) {
                    if(pixels[y+dy]?.[x+dx]) {
                        finalPixels[y][x] = p.outline;
                        break;
                    }
                }
            }
        }
    }
    return finalPixels;
}


export const Sprite: React.FC<SpriteProps> = ({ seed, size, isHit, className, alignment = 0, encounter, isDead = false }) => {
    const gridSize = 32;
    const canvasRef = useRef<HTMLCanvasElement>(null);

    const pixels = useMemo(() => {
        if (seed === 'Keya') return generateKeya(alignment, false, isDead);
        if (seed === 'HealingFountain') return generateHealingFountain();
        if (seed === 'ShrineOfSwiftness') return generateShrine();
        if (seed === 'PitRed') return generatePortal('red');
        if (seed === 'PitGreen') return generatePortal('green');
        if (seed === 'PitGray') return generatePortal('gray');
        if (seed === 'DescentPortal') return generateDescentPortal();
        if (encounter?.seed === 'KeyasShadow') return generateKeya(alignment, true, isDead);
        if (encounter) return generateEnemy(encounter);
        return createGrid(gridSize);
    }, [seed, alignment, encounter, isDead]);
    
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        
        ctx.imageSmoothingEnabled = false;

        const pixelSize = size / gridSize;
        ctx.clearRect(0, 0, size, size);

        for (let y = 0; y < gridSize; y++) {
            for (let x = 0; x < gridSize; x++) {
                const color = pixels[y][x];
                if (color) {
                    ctx.fillStyle = color;
                    ctx.fillRect(Math.floor(x * pixelSize), Math.floor(y * pixelSize), Math.ceil(pixelSize), Math.ceil(pixelSize));
                }
            }
        }
    }, [pixels, size, gridSize]);

    return (
        <div className={`relative w-full h-full flex items-center justify-center transition-all duration-200 ${isHit ? 'animate-flash' : ''} ${className}`}>
             <canvas ref={canvasRef} width={size} height={size} className="w-full h-full" style={{ imageRendering: 'pixelated' }} />
        </div>
    );
};