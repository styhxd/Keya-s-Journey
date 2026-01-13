import { Encounter } from '../types';

export const ENCOUNTERS: Encounter[] = [
    { name: "enemies.whispering_shade.name", description: "enemies.whispering_shade.description", seed: "WhisperingShade", category: 'ghost', archetype: 'dancer' },
    { name: "enemies.giggle_root.name", description: "enemies.giggle_root.description", seed: "GiggleRoot", category: 'plant', archetype: 'dancer' },
    { name: "enemies.stone_skinned_grumbler.name", description: "enemies.stone_skinned_grumbler.description", seed: "StoneGrumbler", category: 'construct', archetype: 'fighter' },
    { name: "enemies.sun_petal_drifter.name", description: "enemies.sun_petal_drifter.description", seed: "SunPetalDrifter", category: 'plant', archetype: 'dancer' },
    { name: "enemies.choral_clam.name", description: "enemies.choral_clam.description", seed: "ChoralClam", category: 'beast', archetype: 'dancer' },
    { name: "enemies.ink_stained_crawler.name", description: "enemies.ink_stained_crawler.description", seed: "InkStainedCrawler", category: 'elemental', archetype: 'balanced' },
    { name: "enemies.echo_wisp.name", description: "enemies.echo_wisp.description", seed: "EchoWisp", category: 'ghost', archetype: 'dancer' },
    { name: "enemies.grinning_totem.name", description: "enemies.grinning_totem.description", seed: "GrinningTotem", category: 'construct', archetype: 'balanced' },
    { name: "enemies.singing_crystal.name", description: "enemies.singing_crystal.description", seed: "SingingCrystal", category: 'construct', archetype: 'dancer' },
    { name: "enemies.root_tangle_guardian.name", description: "enemies.root_tangle_guardian.description", seed: "RootTangleGuardian", category: 'plant', archetype: 'fighter' },
    { name: "enemies.dust_bunny_matriarch.name", description: "enemies.dust_bunny_matriarch.description", seed: "DustBunnyMatriarch", category: 'beast', archetype: 'balanced' },
    { name: "enemies.tear_drop_spirit.name", description: "enemies.tear_drop_spirit.description", seed: "TearDropSpirit", category: 'ghost', archetype: 'dancer' },
    { name: "enemies.clockwork_moth.name", description: "enemies.clockwork_moth.description", seed: "ClockworkMoth", category: 'construct', archetype: 'balanced' },
    { name: "enemies.silent_sentinel.name", description: "enemies.silent_sentinel.description", seed: "SilentSentinel", category: 'construct', archetype: 'fighter' },
    { name: "enemies.humming_stone.name", description: "enemies.humming_stone.description", seed: "HummingStone", category: 'construct', archetype: 'dancer' },
    { name: "enemies.mischievous_mossling.name", description: "enemies.mischievous_mossling.description", seed: "MischievousMossling", category: 'plant', archetype: 'balanced'},
    { name: "enemies.fractal_butterfly.name", description: "enemies.fractal_butterfly.description", seed: "FractalButterfly", category: 'beast', archetype: 'dancer'},
    { name: "enemies.grave_lantern.name", description: "enemies.grave_lantern.description", seed: "GraveLantern", category: 'ghost', archetype: 'dancer'},
    { name: "enemies.amethyst_cluster.name", description: "enemies.amethyst_cluster.description", seed: "PurpleAmethystCluster", category: 'construct', archetype: 'fighter'},
    { name: "enemies.somber_statue.name", description: "enemies.somber_statue.description", seed: "SomberStatue", category: 'construct', archetype: 'fighter'},
    { name: "enemies.fools_gold_golem.name", description: "enemies.fools_gold_golem.description", seed: "FoolsGoldGolem", category: 'construct', archetype: 'fighter'},
    { name: "enemies.lost_page.name", description: "enemies.lost_page.description", seed: "LostPage", category: 'elemental', archetype: 'fighter'},
    { name: "enemies.gloom_shroom.name", description: "enemies.gloom_shroom.description", seed: "GloomShroom", category: 'plant', archetype: 'dancer'},
    { name: "enemies.marble_gryphon.name", description: "enemies.marble_gryphon.description", seed: "MarbleGryphon", category: 'construct', archetype: 'fighter'},
    { name: "enemies.arcane_anomaly.name", description: "enemies.arcane_anomaly.description", seed: "ArcaneAnomaly", category: 'elemental', archetype: 'balanced'},
    { name: "enemies.glimmering_moth.name", description: "enemies.glimmering_moth.description", seed: "GlimmeringMoth", category: 'beast', archetype: 'dancer' },
    { name: "enemies.sorrowful_effigy.name", description: "enemies.sorrowful_effigy.description", seed: "SorrowfulEffigy", category: 'humanoid', archetype: 'dancer' },
    { name: "enemies.murky_tentacle.name", description: "enemies.murky_tentacle.description", seed: "MurkyTentacle", category: 'beast', archetype: 'fighter' },
    { name: "enemies.forgotten_grimoire.name", description: "enemies.forgotten_grimoire.description", seed: "ForgottenGrimoire", category: 'construct', archetype: 'fighter' },
    { name: "enemies.rusted_knight.name", description: "enemies.rusted_knight.description", seed: "RustedKnight", category: 'humanoid', archetype: 'fighter' }
];

export const BOSSES: Encounter[] = [
    { name: "bosses.keyas_shadow.name", description: "bosses.keyas_shadow.description", seed: "KeyasShadow", category: 'humanoid', isBoss: true, archetype: 'balanced' },
    { name: "bosses.labyrinths_heart.name", description: "bosses.labyrinths_heart.description", seed: "LabyrinthHeart", category: 'construct', isBoss: true, archetype: 'fighter' },
    { name: "bosses.keeper_of_echoes.name", description: "bosses.keeper_of_echoes.description", seed: "KeeperOfEchoes", category: 'ghost', isBoss: true, archetype: 'dancer' },
    { name: "bosses.the_first_shadow.name", description: "bosses.the_first_shadow.description", seed: "FirstShadow", category: 'elemental', isBoss: true, archetype: 'balanced' },
    { name: "bosses.the_timeless_watcher.name", description: "bosses.the_timeless_watcher.description", seed: "TimelessWatcher", category: 'humanoid', isBoss: true, archetype: 'balanced'},
    { name: "bosses.the_ashen_king.name", description: "bosses.the_ashen_king.description", seed: "AshenKing", category: 'humanoid', isBoss: true, archetype: 'fighter'},
];