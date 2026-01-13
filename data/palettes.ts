import { Palette } from '../types';

export const PALETTES: Record<string, Palette> = {
    "Celestial": {
        name: "Celestial",
        bg: "#0d0c1d",
        primary: "#a855f7",
        secondary: "#f472b6",
        accent: "#60a5fa",
    },
    "Veridian": {
        name: "Veridian",
        bg: "#051411",
        primary: "#10b981", // Emerald 500
        secondary: "#f59e0b", // Amber 500
        accent: "#84cc16", // Lime 500
    },
    "Azure": {
        name: "Azure",
        bg: "#0b1226",
        primary: "#38bdf8", // Light Blue 400
        secondary: "#34d399", // Emerald 400
        accent: "#a7f3d0", // Mint 200
    },
    "Crimson": {
        name: "Crimson",
        bg: "#240b0b",
        primary: "#f43f5e", // Rose 500
        secondary: "#ef4444", // Red 500
        accent: "#fde047", // Yellow 300
    },
    "Monochrome": {
        name: "Monochrome",
        bg: "#18181b", // Zinc 900
        primary: "#a1a1aa", // Zinc 400
        secondary: "#e4e4e7", // Zinc 200
        accent: "#f43f5e", // Rose 500
    },
    "Golden": {
        name: "Golden",
        bg: "#221C35",
        primary: "#D4AF37", // Gold
        secondary: "#C0C0C0", // Silver
        accent: "#fef3c7", // Amber 100
    }
};
