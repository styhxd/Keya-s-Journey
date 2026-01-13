import { Encounter } from '../types';

export const MINIBOSSES: Record<number, Encounter[]> = {
    1: [
        { name: "minibosses.warden_threshold.name", description: "minibosses.warden_threshold.description", seed: "WardenThreshold", category: 'construct', isGuardian: true, archetype: 'fighter', sizeModifier: 1.25 },
        { name: "minibosses.maestro_gallery.name", description: "minibosses.maestro_gallery.description", seed: "MaestroGallery", category: 'ghost', isGuardian: true, archetype: 'dancer', sizeModifier: 1.25 },
        { name: "minibosses.thorn_heart_dryad.name", description: "minibosses.thorn_heart_dryad.description", seed: "ThornHeartDryad", category: 'plant', isGuardian: true, archetype: 'balanced', sizeModifier: 1.25 },
        { name: "minibosses.grinning_gatekeeper.name", description: "minibosses.grinning_gatekeeper.description", seed: "GrinningGatekeeper", category: 'construct', isGuardian: true, archetype: 'fighter', sizeModifier: 1.25 },
        { name: "minibosses.echo_first_misstep.name", description: "minibosses.echo_first_misstep.description", seed: "FirstMisstep", category: 'ghost', isGuardian: true, archetype: 'dancer', sizeModifier: 1.25 }
    ],
    2: [
        { name: "minibosses.crystal_caged_king.name", description: "minibosses.crystal_caged_king.description", seed: "CrystalKing", category: 'humanoid', isGuardian: true, archetype: 'fighter', sizeModifier: 1.25 },
        { name: "minibosses.fractal_weaver.name", description: "minibosses.fractal_weaver.description", seed: "FractalWeaver", category: 'beast', isGuardian: true, archetype: 'dancer', sizeModifier: 1.25 },
        { name: "minibosses.forge_heart_automaton.name", description: "minibosses.forge_heart_automaton.description", seed: "ForgeHeartAutomaton", category: 'construct', isGuardian: true, archetype: 'fighter', sizeModifier: 1.25 },
        { name: "minibosses.silent_choreographer.name", description: "minibosses.silent_choreographer.description", seed: "SilentChoreographer", category: 'humanoid', isGuardian: true, archetype: 'dancer', sizeModifier: 1.25 },
        { name: "minibosses.lore_golem.name", description: "minibosses.lore_golem.description", seed: "LoreGolem", category: 'construct', isGuardian: true, archetype: 'balanced', sizeModifier: 1.25 }
    ],
    3: [
        { name: "minibosses.ashen_dancer.name", description: "minibosses.ashen_dancer.description", seed: "AshenDancer", category: 'elemental', isGuardian: true, archetype: 'dancer', sizeModifier: 1.25 },
        { name: "minibosses.grotto_leviathan.name", description: "minibosses.grotto_leviathan.description", seed: "GrottoLeviathan", category: 'beast', isGuardian: true, archetype: 'fighter', sizeModifier: 1.25 },
        { name: "minibosses.jester_of_sorrows.name", description: "minibosses.jester_of_sorrows.description", seed: "JesterOfSorrows", category: 'humanoid', isGuardian: true, archetype: 'dancer', sizeModifier: 1.25 },
        { name: "minibosses.triumvirate_soul.name", description: "minibosses.triumvirate_soul.description", seed: "ThreeHeadedGuardian", category: 'beast', isGuardian: true, archetype: 'fighter', sizeModifier: 1.25 },
        { name: "minibosses.living_mirage.name", description: "minibosses.living_mirage.description", seed: "LivingMirage", category: 'elemental', isGuardian: true, archetype: 'balanced', sizeModifier: 1.25 }
    ],
    4: [
        { name: "minibosses.timeless_sentinel.name", description: "minibosses.timeless_sentinel.description", seed: "TimelessSentinel", category: 'humanoid', isGuardian: true, archetype: 'fighter', sizeModifier: 1.25 },
        { name: "minibosses.symphony_of_silence.name", description: "minibosses.symphony_of_silence.description", seed: "SymphonyOfSilence", category: 'elemental', isGuardian: true, archetype: 'dancer', sizeModifier: 1.25 },
        { name: "minibosses.heart_of_mountain.name", description: "minibosses.heart_of_mountain.description", seed: "MountainHeart", category: 'construct', isGuardian: true, archetype: 'fighter', sizeModifier: 1.25 },
        { name: "minibosses.doppelganger.name", description: "minibosses.doppelganger.description", seed: "Doppelganger", category: 'humanoid', isGuardian: true, archetype: 'dancer', sizeModifier: 1.25 },
        { name: "minibosses.corrupted_treant.name", description: "minibosses.corrupted_treant.description", seed: "CorruptedTreant", category: 'plant', isGuardian: true, archetype: 'fighter', sizeModifier: 1.25 }
    ]
};