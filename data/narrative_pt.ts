const enemies_pt = {
    whispering_shade: { name: "Sombra Sussurrante", description: "Uma figura tênue e pesarosa que flutua em correntes invisíveis. Parece atraída por movimento e som." },
    giggle_root: { name: "Raiz Risonha", description: "Uma planta de aparência alegre que balança com um ritmo silencioso e inquietante. Sua risada é vista, não ouvida." },
    stone_skinned_grumbler: { name: "Resmungão de Pele de Pedra", description: "Uma criatura robusta e rochosa que parece perpetuamente irritada. Move-se com um andar pesado e rangente." },
    sun_petal_drifter: { name: "Pétala Solar Flutuante", description: "Uma flor flutuante cujas pétalas brilham com luz capturada. Move-se com uma graça preguiçosa e hipnótica." },
    choral_clam: { name: "Concha Coral", description: "Uma grande concha de pedra que emite um zumbido harmonioso e tênue. Abre-se lentamente para revelar uma pérola brilhante." },
    ink_stained_crawler: { name: "Rastejador de Tinta", description: "Uma criatura sombria que goteja escuridão, deixando manchas temporárias na própria realidade." },
    echo_wisp: { name: "Bruma Ecoante", description: "Um pequeno espírito brilhante que imita qualquer som que ouve, transformando-o numa melodia triste." },
    grinning_totem: { name: "Totem Sorridente", description: "Uma figura de pedra esculpida com um sorriso perturbadoramente largo. Permanece perfeitamente imóvel, mas parece intensamente vigilante." },
    singing_crystal: { name: "Cristal Cantor", description: "Um aglomerado de cristais que ressoa com a energia do labirinto, produzindo um tom constante e belo." },
    root_tangle_guardian: { name: "Guardião do Emaranhado de Raízes", description: "Um enorme nó ambulante de raízes e vinhas, que ataca tudo o que perturba o seu sono." },
    dust_bunny_matriarch: { name: "Matriarca dos Tufos de Poeira", description: "Uma bola surpreendentemente grande e agressiva de poeira e coisas esquecidas, unida por estática." },
    tear_drop_spirit: { name: "Espírito Gota de Lágrima", description: "Um pequeno espírito brilhante em forma de lágrima a cair. Deixa um rasto de tristeza cintilante." },
    clockwork_moth: { name: "Mariposa Mecânica", description: "Um inseto mecânico que esvoaça com um ritmo preciso e de tique-taque. As suas asas são feitas de filigrana de latão." },
    silent_sentinel: { name: "Sentinela Silencioso", description: "Uma estátua imponente que se move com um silêncio impossível. O seu olhar é pesado e julgador." },
    humming_stone: { name: "Pedra Zumbidora", description: "Uma pedra lisa e polida pelo rio que vibra com uma frequência baixa e calmante." },
    mischievous_mossling: { name: "Musguinho Travesso", description: "Uma pequena criatura coberta de musgo que se deleita em desviar viajantes com ilusões." },
    fractal_butterfly: { name: "Borboleta Fractal", description: "Uma bela borboleta cujas asas exibem padrões infinitamente complexos e mutáveis." },
    grave_lantern: { name: "Lanterna Sepulcral", description: "Uma lanterna fantasmagórica e flutuante cuja luz parece absorver calor e esperança em vez de emiti-los." },
    amethyst_cluster: { name: "Aglomerado de Ametista", description: "Uma formação irregular de cristais roxos que se arrasta agressivamente pelo chão enquanto se move." },
    somber_statue: { name: "Estátua Sombria", description: "Um anjo de pedra choroso que só se move quando você não está a olhar. Anseia por um descanso final." },
    fools_gold_golem: { name: "Golem de Ouro de Tolo", description: "Um golem corpulento feito de pirita brilhante mas sem valor. Luta com uma fúria desajeitada." },
    lost_page: { name: "Página Perdida", description: "Uma única folha de pergaminho, cheia de texto raivoso e rabiscado, que ataca com cortes de papel." },
    gloom_shroom: { name: "Cogumelo Sombrio", description: "Um cogumelo bioluminescente que pulsa com uma luz azul triste e liberta esporos de melancolia." },
    marble_gryphon: { name: "Grifo de Mármore", description: "Uma estátua majestosa mas lascada de um grifo, animada por um espírito teimoso e territorial." },
    arcane_anomaly: { name: "Anomalia Arcana", description: "Uma fenda cintilante e instável na realidade que oscila entre estados agressivos e plácidos." },
    glimmering_moth: { name: "Mariposa Cintilante", description: "Uma mariposa cujas asas cobertas de pó criam belos e calmantes padrões de luz enquanto voa." },
    sorrowful_effigy: { name: "Efígie Dolorosa", description: "Uma boneca tosca feita de galhos e barbante, animada pela tristeza perdida de uma criança. Quer partilhar a sua dança de tristeza." },
    murky_tentacle: { name: "Tentáculo Obscuro", description: "Um tentáculo poderoso e viscoso que emerge de uma poça escura no chão. Onde está o resto?" },
    forgotten_grimoire: { name: "Grimório Esquecido", description: "Um antigo livro de feitiços, ferozmente protetor dos seus secrets, que usa magia bruta para atacar." },
    rusted_knight: { name: "Cavaleiro Enferrujado", description: "Uma armadura animada por puro e inabalável dever, muito depois de seu dono se ter tornado pó." }
};

const bosses_pt = {
    keyas_shadow: { name: "Sombra de Keya", description: "Um eco de você mesma, distorcido pelo desespero e pela raiva. É tudo o que você teme se tornar." },
    labyrinths_heart: { name: "Coração do Labirinto", description: "O núcleo central do labirinto, uma construção massiva de pedra e dor." },
    keeper_of_echoes: { name: "Guardião dos Ecos", description: "Um espírito poderoso que reúne as memórias desvanecidas de todos os que se perderam aqui." },
    the_first_shadow: { name: "A Primeira Sombra", description: "O desespero original que deu origem ao próprio labirinto. Uma entidade sem forma e aterrorizante." },
    the_timeless_watcher: { name: "O Vigilante Atemporal", description: "Um ser que observou inúmeras almas tentando escapar. Julga cada um dos seus movimentos com olhos antigos e cansados." },
    the_ashen_king: { name: "O Rei Cinzento", description: "O espírito de um monarca que construiu o labirinto, agora preso e quebrado dentro da sua própria criação." }
};

const minibosses_pt = {
    warden_threshold: { name: "Guardião do Limiar", description: "Uma construção corpulenta de pedra e arrependimento que bloqueia o caminho. Entende apenas a força." },
    maestro_gallery: { name: "Maestro da Galeria", description: "O espírito de um artista, tentando eternamente aperfeiçoar uma sinfonia silenciosa em telas de pedra." },
    thorn_heart_dryad: { name: "Dríade do Coração de Espinhos", description: "Um espírito da natureza distorcido pela melancolia do labirinto, sua bela canção agora uma armadilha espinhosa." },
    grinning_gatekeeper: { name: "Porteiro Sorridente", description: "Um totem estranho que desafia todos que passam com enigmas de força agressivos e sem sentido." },
    echo_first_misstep: { name: "Eco do Primeiro Tropeço", description: "Um espírito melancólico que repete incessantemente a dança de um viajante perdido há muito tempo que falhou." },
    crystal_caged_king: { name: "Rei Enjaulado em Cristal", description: "O espírito de um rei, envolto em uma prisão de cristal de sua própria autoria, que ataca com fúria." },
    fractal_weaver: { name: "Tecelão Fractal", description: "Uma criatura semelhante a uma aranha que tece teias de luz e som, aprisionando seus sentidos em uma dança bela e mortal." },
    forge_heart_automaton: { name: "Autômato do Coração da Forja", description: "Um poderoso soldado mecânico, ainda seguindo sua ordem final: 'Não permitir que ninguém passe'." },
    silent_choreographer: { name: "Coreógrafo Silencioso", description: "Uma figura elegante e mascarada que exige que você siga sua liderança em uma dança de precisão mortal." },
    lore_golem: { name: "Golem do Conhecimento Proibido", description: "Um golem construído a partir das páginas de livros esquecidos, sua mente um turbilhão caótico de raiva e conhecimento." },
    ashen_dancer: { name: "Dançarina Cinzenta", description: "Uma figura de cinzas e brasas rodopiantes, realizando uma dança de imolação bela mas mortal." },
    grotto_leviathan: { name: "Leviatã da Gruta", description: "Uma besta colossal dormindo em uma caverna inundada, seus sonhos criando as próprias paredes ao seu redor." },
    jester_of_sorrows: { name: "Bobo das Mágoas", description: "Um bobo da corte cujas piadas e gracejos se transformaram em performances amargas e melancólicas." },
    triumvirate_soul: { name: "Alma Triunvirato", description: "Uma alma com a fúria de um guerreiro, a dor de uma criança perdida e o foco de um vigilante silencioso. Todas as suas partes querem que você se vá." },
    living_mirage: { name: "Miragem Viva", description: "Uma ilusão cintilante que ganhou senciência. Testa a sua percepção da realidade, tanto em combate como na dança." },
    timeless_sentinel: { name: "Sentinela Atemporal", description: "Um guerreiro congelado no tempo, saindo do fluxo temporal para testar o seu valor." },
    symphony_of_silence: { name: "Sinfonia do Silêncio", description: "Uma entidade a reger uma orquestra do nada. A sua performance é um silêncio ensurdecedor e esmagador pelo qual você tem que dançar." },
    heart_of_mountain: { name: "Coração da Montanha", description: "O próprio núcleo geotérmico do labirinto, um ser de imensa pressão e poder explosivo." },
    doppelganger: { name: "Doppelgänger", description: "Um reflexo perfeito de você, mas com olhos vazios de esperança. Conhece todos os seus movimentos." },
    corrupted_treant: { name: "Treant Corrompido", description: "Um antigo guardião das árvores, envenenado pelo desespero do labirinto, agora um bastião de miséria violenta." },
    lost_guardian: { name: "Guardião Perdido", description: "Um espírito poderoso, com o seu propósito esquecido, vagueia pelos corredores. Não guarda nada, e tudo." }
};

const pt_translation = {
    speakers: {
        keya: "Keya",
        keyas_shadow: "Sombra de Keya"
    },
    ui: {
        beginJourney: "Iniciar Jornada",
        fates: "Destinos",
        credits: "Créditos",
        settings: "Opções",
        return: "Voltar",
        newJourney: "Nova Jornada",
        tryAgain: "Tentar Novamente",
        continue: "Continuar",
        continueJourney: "Continuar Jornada",
        error: "Ocorreu um Erro",
        loadingFloor: "Descendo para o Andar {{floor}}...",
        loadingAwakens: "O labirinto desperta...",
        loadingLabyrinth: "Forjando os caminhos do Labirinto...",
        keyaStatus: "Status de Keya",
        health: "Vida",
        abilities: "Habilidades",
        viewAbilities: "Ver Habilidades",
        floor: "Andar",
        aura: "Aura",
        minimap: "Minimapa",
        room: "Sala",
        close: "Fechar",
        fight: "Lutar",
        dance: "Dançar",
        boon: "Bênção",
        noFightAbilities: "Nenhuma habilidade de luta aprendida.",
        noDanceAbilities: "Nenhuma habilidade de dança aprendida.",
        bossEncounter: "ENCONTRO COM CHEFE",
        guardianEncounter: "ENCONTRO COM GUARDIÃO",
        whatWillKeyaDo: "O que Keya fará?",
        flee: "Fugir",
        newPowerUnlocked: "Um Novo Poder Desbloqueado!",
        learnedAbility: "Você aprendeu *{{abilityName}}*!",
        journeysEnd: "Fim da Jornada",
        finalChoices: "Escolhas Finais",
        fights: "Lutas",
        dances: "Danças",
        endingsUnlocked: "Você desbloqueou {{unlocked}} de {{total}} finais.",
        difficultyComplete: "Concluído na dificuldade {{difficulty}}",
        galleryOfFates: "Galeria de Destinos",
        fatesDiscovered: "Você descobriu {{unlocked}} de {{total}} destinos possíveis.",
        unlockedOn: "Desbloqueado",
        gameOver: "Fim de Jogo",
        gameOverMessage: "O labirinto reclamou outra alma...",
        aGameBy: "Um jogo de",
        director: "Diretor",
        auraShift: "Mudança de Aura",
        auraBrighter: "Seu espírito se torna mais brilhante!",
        auraDarker: "Seu espírito sucumbe à sombra...",
        descendDeeper: "Descer Mais Fundo",
        labyrinthName: "{{noun}} {{adj}}",
        selectDifficulty: "Selecione uma Dificuldade",
        difficultyNormal: "Normal",
        difficultyHard: "Difícil",
        difficultyRequiem: "Réquiem",
        surpriseBossMessage: "A essência do guardião entra em erupção! Uma vontade poderosa, atraída pela batalha, se manifesta diante de você!",
        cheatCode: {
            title: "Insira o Código Aqui",
            placeholder: "Digite o código...",
            activate: "Ativar"
        },
        map: {
            powerup: {
                speed: "Velocidade"
            },
            spendStars: "Gastar {{cost}} Estrelas para curar?",
            actionHeal: "Curar",
            compass: "Bússola"
        },
        fightGame: {
            attack: "Ataque",
            utility: "Utilidade",
            chooseMove: 'Escolha seu movimento...',
            fleeAttempt: 'Você tenta fugir...',
            fleeSuccess: 'Você conseguiu escapar!',
            fleeFail: 'O inimigo bloqueia sua fuga! Você perde seu turno.',
            timeAttack: 'Calcule o ataque!',
            raiseShield: 'Você ergue um Escudo de Pedra!',
            wardSurrounds: 'Uma Proteção Terrena te rodeia!',
            focusPower: 'Você concentra seu poder!',
            galePush: 'Uma rajada de vento empurra para a frente!',
            galePushStun: '{{enemyName}} está atordoado!',
            galePushMiss: 'O vento erra!',
            enemySnared: '{{enemyName}} está enredado por raízes!',
            mirageDances: 'Miragens dançam à sua volta!',
            notEnoughStarPower: 'Poder Estelar insuficiente!',
            sunfireDamage: 'Você liberou o sol, causando {{damage}} de dano!',
            lifeSap: 'Você drenou {{damage}} de dano e se curou em {{health}}!',
            thornBurst: 'Uma rajada de espinhos voa!',
            thornBurstTotal: 'Atingiu {{count}} vezes, causando {{totalDamage}} de dano total!',
            shieldBashHit: 'Um golpe pesado causa {{damage}} de dano!',
            shieldBashResist: 'O inimigo ignora o golpe.',
            burningBladeHit: 'Um golpe ardente causa {{damage}} de dano!',
            enemyAblaze: '{{enemyName}} está em chamas!',
            shadowCloak: 'Você desliza para as sombras, preparando-se para esquivar.',
            celestialStrike: 'Você invoca as estrelas, causando {{damage}} de dano massivo!',
            vengefulStrike: 'A vingança ataca, causando {{damage}} de dano!',
            purifyingLight: 'Uma luz brilhante causa {{damage}} de dano e te cura em {{health}}!',
            criticalHit: 'GOLPE CRÍTICO!',
            perfectStrike: 'Golpe Perfeito!',
            goodHit: 'Bom Golpe!',
            weakHit: 'Golpe Fraco.',
            miss: 'Errou!',
            focusedPower: 'Poder Focado!',
            dealtDamage: 'Causou {{damage}} de dano!',
            dodgeFail: 'Lento demais!',
            shieldBlocks: 'O Escudo de Pedra bloqueia todo o dano!',
            wardSoftens: 'A Proteção Terrena amortece o golpe!',
            mirageHit: 'Uma miragem sofre o dano!',
            shadowCloakDodge: 'Você se esquiva sem esforço das sombras!',
            tookDamage: 'Você recebeu {{damage}} de dano!',
            enemyAttacks: '{{enemyName}} ataca!',
            dodge: 'Esquive!',
            dodgeSuccess: 'Você se esquivou com sucesso!',
            turnTimeout: "Você demorou demais para decidir!",
            boss: "CHEFE",
            fight: "LUTA",
            you: "Você",
            flee: "Fugir",
            fleeTitle: "Fugir (50% de chance)",
        },
        bossFight: {
            attacksLeft: "Ataques Restantes",
            choiceTitle: "A Sombra muda. Como você vai responder?",
            choiceFight: "Ataque sua fraqueza com força.",
            choiceDance: "Acalme seu tormento com graça.",
            usedAbility: 'Você usou {{abilityName}}!',
            danceNoEffect: "Sua dança não tem efeito aqui... A Sombra só entende a luta.",
            shadowAttacks: "A Sombra ataca! Esquive!",
            hit: "Você foi atingido!",
            harmonyResonates: "A harmonia ressoa!",
            harmonyFalters: "A harmonia vacila!",
            matchRhythm: "Acompanhe o ritmo melancólico da Sombra!",
            stage_INTRO: "PRÓLOGO",
            stage_FIGHT_1: "LUTA 1",
            stage_INTERLUDE_1: "INTERLÚDIO",
            stage_DANCE: "DANÇA",
            stage_INTERLUDE_2: "INTERLÚDIO",
            stage_FIGHT_2: "LUTA 2",
            stage_FINAL_WORDS: "FINAL",
            stage_VICTORY: "VITÓRIA",
            stage_DEFEAT: "DERROTA",
            shadowName: "Sombra de Keya",
        },
        controls: {
            title: "Controles",
            move: "Mover / Navegar",
            interact: "Interagir / Confirmar",
            openAbilities: "Menu de Habilidades",
            openSettings: "Menu de Opções",
            flee: "Fugir do Encontro",
            heal: "Curar (Mapa/Combate)"
        }
    },
    tiles: {
        start: "Início",
        cleared: "Limpo",
        encounter: "Encontro",
        boss: "Chefe",
        healing: "Fonte de Cura",
        shrine: "Santuário",
    },
    settings: {
        paletteMode: {
            label: "Modo de Paleta",
            dynamic: "Dinâmico",
            fixed: "Fixo"
        },
        language: {
            label: "Idioma",
            disabledTooltip: "O idioma só pode ser alterado no menu principal."
        },
        masterVolume: "Volume Principal",
        musicVolume: "Volume da Música",
        sfxVolume: "Efeitos Sonoros",
        colorPalette: "Paleta de Cores",
        currentDifficulty: "Dificuldade Atual",
        quitRun: "Sair da Partida",
        quitConfirm: {
            title: "Sair da partida atual?",
            body: "Seu progresso neste labirinto será perdido.",
            confirm: "Sair",
            cancel: "Cancelar"
        }
    },
    rhythm: {
        preparing: "Preparando a dança...",
        crescendo: "Crescendo!",
        crescendoFades: "Crescendo se Desvanece",
        twirlProtects: "O Rodopio te Protege!",
        twirlSaved: "O Rodopio te salvou!",
        flowSaved: "O Fluxo salvou seu combo!",
        misstep: "Tropeço!",
        perfect: "Perfeito!",
        good: "Bom!",
        starPower: "+1 Poder Estelar",
        wonderful: "Dança Maravilhosa!",
        harmonyFades: "A harmonia se desvanece...",
        perfectHarmony: "Harmonia Perfeita!",
        harmonyBroken: "A harmonia se quebrou!",
        flee: "Você escapa da dança...",
        harmony: "Harmonia",
        combo: "Combo",
        twirlReady: "Rodopio Pronto!",
        crescendoActive: "Crescendo Ativo!",
        flowReady: "Fluxo Pronto",
        resonantWave: "Onda Ressonante!",
        fleeTitle: "Fugir da dança"
    },
    results: {
        flee: {
            success: "Você conseguiu escapar do encontro com sucesso.",
            fail: "Você tentou fugir, mas o espírito foi rápido demais! Você perdeu {{damage}} de vida na tentativa."
        },
        dance: {
            fail: "Sua dança vacilou. Você recebe {{damage}} de dano da energia dissonante."
        }
    },
    ability: {
      vine: { name: "Chicote de Vinha", description: "Um golpe rápido com uma vinha espinhosa. Clique a tempo para um GOLPE CRÍTICO!" },
      stone: { name: "Escudo de Pedra", description: "Invoca um escudo de rocha para bloquear um ataque por um turno." },
      gale: { name: "Rajada de Vento", description: "Uma rajada de vento que tem a chance de atordoar um oponente." },
      sunfire: { name: "Amuleto Solar", description: "Potente energia solar. Consome 10 de Poder Estelar." },
      focus: { name: "Golpe Focado", description: "Canaliza energia para duplicar o dano do seu próximo Chicote de Vinha." },
      ward: { name: "Proteção Terrena", description: "Reduz pela metade o próximo dano que você receber." },
      rootSnare: { name: "Armadilha de Raízes", description: "Enreda o inimigo, tornando-o mais lento e fácil de esquivar." },
      mirage: { name: "Miragem", description: "Cria uma ilusão, aumentando sua chance de esquiva. Dura 3 turnos." },
      lifeSap: { name: "Dreno de Vida", description: "Um espinho amaldiçoado que rouba uma pequena quantidade de vida do inimigo." },
      thornBurst: { name: "Explosão de Espinhos", description: "Uma rajada de espinhos que atinge várias vezes por pouco dano." },
      shieldBash: { name: "Pancada com Escudo", description: "Um golpe rápido que causa pouco dano, mas tem alta chance de atordoar." },
      burningBlade: { name: "Lâmina Ardente", description: "Um ataque que também incendeia o inimigo, causando dano ao longo do tempo." },
      shadow_cloak: { name: "Manto de Sombras", description: "Funda-se nas sombras, garantindo uma esquiva bem-sucedida no próximo ataque do inimigo." },
      celestial_strike: { name: "Golpe Celestial", description: "Consome 20 de Poder Estelar para invocar uma estrela, causando dano massivo e provavelmente atordoando o inimigo." },
      vengeful_strike: { name: "Golpe Vingativo", description: "Um poderoso contra-ataque que causa mais dano com base na sua vida perdida." },
      purifying_light: { name: "Luz Purificadora", description: "Uma explosão de luz que causa dano pesado a espíritos sombrios e te cura ligeiramente." },

      echo: { name: "Passo Ecoante", description: "Um passo simples e ressonante que forma a base de todas as danças." },
      twirl: { name: "Rodopio Harmonioso", description: "Uma dança protetora que te protege do próximo deslize." },
      flourish: { name: "Florescer Rítmico", description: "Adiciona notas especiais e mais potentes ao ritmo." },
      crescendo: { name: "Crescendo", description: "Após um combo de 10 notas, seu ganho de harmonia é duplicado por um curto período." },
      soothingHum: { name: "Zumbido Suave", description: "Cada nota bem-sucedida aumenta ligeiramente o ganho de harmonia." },
      tempoShift: { name: "Mudança de Ritmo", description: "O ritmo do labirinto parece mais lento, tornando as notas mais fáceis de acertar." },
      serenity: { name: "Serenidade", description: "Você começa cada dança com uma maior reserva de harmonia." },
      gracefulPoise: { name: "Postura Graciosa", description: "Aumenta a janela de tempo para acertar uma nota 'Boa'." },
      rhythmicFlow: { name: "Fluxo Rítmico", description: "Um escudo de puro ritmo protege seu combo de um único deslize. Recarrega após 15 notas bem-sucedidas." },
      starlightStep: { name: "Passo de Luz Estelar", description: "Notas de Florescer bem-sucedidas têm a chance de te conceder um Poder Estelar." },
      flowState: { name: "Estado de Fluxo", description: "A janela de tempo perfeito é ligeiramente maior, facilitando acertos 'Perfeitos'." },
      perfectPitch: { name: "Tom Perfeito", description: "Notas perfeitas concedem ainda mais harmonia." },
      vital_sonata: { name: "Sonata Vital", description: "Notas de Florescer têm a chance de restaurar uma pequena quantidade da sua vida." },
      mimics_lament: { name: "Lamento do Mímico", description: "Você replica perfeitamente os dois primeiros passos de qualquer dança, começando com um combo." },
      resonant_wave: { name: "Onda Ressonante", description: "Com um combo de 20 notas, libera uma onda de energia que restaura vida e uma grande quantidade de harmonia." },
      steadfast_rhythm: { name: "Ritmo Firme", description: "Em vez de reiniciar a zero, seu combo é apenas reduzido pela metade quando você erra uma nota." },
      
      boon_max_hp_1: { name: "Bênção da Vitalidade", description: "Aumenta sua Vida máxima." },
      boon_regen_1: { name: "Bênção da Renovação", description: "Regenera lentamente sua vida enquanto você explora o mapa." },
      boon_speed_1: { name: "Bênção da Pressa", description: "Aumenta sua velocidade de movimento no mapa." },
      boon_stars_1: { name: "Bênção da Luz Estelar", description: "Mais estrelas colecionáveis aparecem em cada sala." },
      boon_compass_1: { name: "Bênção da Direção", description: "Uma bússola aparece, apontando sempre para o guardião do andar." },
      boon_radiance_1: { name: "Bênção da Radiância", description: "Sua luz interior expande sua visão no mapa e te cura completamente quando você desce para um novo andar." },
      boon_resonance_1: { name: "Bênção da Ressonância", description: "Lutar restaura um pouco de vida. Dançar aumenta permanentemente sua vida máxima." },
      boon_star_regen_1: { name: "Bênção da Queda de Estrelas", description: "Ganha Poder Estelar lentamente ao longo do tempo enquanto está no mapa." },
      boon_combat_medic_1: { name: "Bênção do Médico de Combate", description: "Permite que você gaste Poder Estelar para se curar durante o combate." },
      boon_power_1: { name: "Bênção do Poder", description: "Seus ataques causam um pouco mais de dano." },
      boon_grace_1: { name: "Bênção da Graça", description: "Suas danças geram um pouco mais de harmonia." }
    },
    abilityLore: {
        vine: "A primeira lição da natureza: uma ferramenta, uma arma, uma conexão. É simples, mas é sua.",
        stone: "A terra não cede facilmente. Lembre-se da sua força quando se sentir frágil.",
        gale: "Até a brisa mais leve pode mudar o curso de uma folha caindo. Não subestime o que é pequeno.",
        sunfire: "Um pedaço capturado de uma aurora esquecida. Use seu calor para queimar as sombras.",
        focus: "A clareza é uma arma. No caos, encontre seu único e inabalável ponto de intenção.",
        ward: "Uma promessa sussurrada ao solo, para que ele possa te proteger em troca.",
        rootSnare: "O próprio chão do labirinto pode ser seu aliado, se você pedir com jeitinho.",
        mirage: "O que é real senão uma ilusão persistente? Crie sua própria realidade, nem que seja por um momento.",
        lifeSap: "Um acordo espinhoso. Para se sustentar, você deve tirar de outro. Uma lição na sombra.",
        thornBurst: "Uma defesa explosiva e de pânico. Às vezes, a melhor resposta é se tornar perigosa para todos.",
        shieldBash: "Ataque e defesa como um só. Uma verdade crua e simples que o labirinto muitas vezes respeita.",
        burningBlade: "Imbua sua vontade com uma raiva cortante e ardente. Que sua raiva seja uma ferramenta, não um mestre.",
        shadow_cloak: "As sombras não estão vazias. São um espaço para se esconder, para esperar, para desaparecer.",
        celestial_strike: "As estrelas que você coleciona não são meros enfeites. São preces e, por vezes, elas respondem.",
        vengeful_strike: "Transforme sua dor em poder. Quanto mais profunda a ferida, mais afiado o golpe.",
        purifying_light: "Há uma luz que não cria sombras, pois ilumina tudo. Seja essa luz.",
        echo: "O primeiro passo de uma dança que não tem fim. É a pergunta que o labirinto te faz.",
        twirl: "Um momento de equilíbrio perfeito, um escudo feito de graça. Desvia a dissonância.",
        flourish: "Um adorno, um risco, um momento de beleza. O labirinto repara nessas coisas.",
        crescendo: "Construa o ritmo, sinta-o crescer e, por um momento, você é o coração da canção.",
        soothingHum: "Uma melodia silenciosa sob a melodia principal, uma harmonia que remenda as fraturas da alma.",
        tempoShift: "Dobre o ritmo do mundo ao seu. Um ato de desafio silencioso.",
        serenity: "Não comece com um passo frenético, mas com uma respiração calma. A dança seguirá.",
        gracefulPoise: "Permita-se margem para erro. A perfeição é uma jaula; a graça é liberdade.",
        rhythmicFlow: "Torne-se o rio, não a pedra. Deixe o ritmo fluir através de você, e ele protegerá seu foco.",
        starlightStep: "Dance com a luz de sóis distantes, e eles poderão partilhar seu poder com você.",
        flowState: "Quando o dançarino e a dança são um só, não há passos em falso.",
        perfectPitch: "Acertar a nota perfeitamente é alinhar-se com a própria canção do labirinto.",
        vital_sonata: "A canção da própria vida. Uma melodia que pode remendar carne e osso.",
        mimics_lament: "O eco da dança de outro, aperfeiçoado. Você aprende com os fantasmas que vagueiam por aqui.",
        resonant_wave: "Quando a harmonia é perfeita, ela transborda, lavando o cansaço e a dúvida.",
        steadfast_rhythm: "Um tropeção não é uma queda. Recupere seu ritmo; a canção ainda não acabou.",
        boon_max_hp_1: "A pressão do Labirinto te fortalece. Você se sente mais sólida, mais real.",
        boon_regen_1: "Uma força vital silenciosa e persistente agora se agarra a você, remendando lentamente suas feridas.",
        boon_speed_1: "Seus pés se sentem mais leves, como se o próprio ar te empurrasse para a frente.",
        boon_stars_1: "As constelações dentro das paredes do Labirinto brilham um pouco mais para você.",
        boon_compass_1: "Um sussurro na sua mente, um puxão na sua alma, mostrando-lhe o caminho para o coração do andar.",
        boon_radiance_1: "Sua luz interior se torna um farol, repelindo a escuridão opressiva dos corredores.",
        boon_resonance_1: "Você encontra uma nova harmonia entre seus dois caminhos. Um fortalece o outro.",
        boon_star_regen_1: "As estrelas parecem cair do teto, atraídas pela sua luz crescente.",
        boon_combat_medic_1: "Você aprende a canalizar a energia das estrelas não apenas para o ataque, mas para a cura.",
        boon_power_1: "Seus golpes parecem mais pesados, imbuídos de uma nova certeza e força.",
        boon_grace_1: "Seus movimentos se tornam mais fluidos, sua conexão com a canção do Labirinto mais profunda."
    },
    enemies: enemies_pt,
    bosses: bosses_pt,
    minibosses: minibosses_pt,
    outcomes: {
        fight: {
            shade: "A Sombra Sussurrante dissolve-se com um último suspiro de som.",
            grumbler: "O Resmungão de Pele de Pedra desmorona-se numa pilha de rochas inertes e silenciosas.",
            crawler: "O Rastejador de Tinta dissolve-se numa poça inofensiva de escuridão, que evapora rapidamente.",
            totem: "O sorriso do Totem Sorridente racha e cai, revelando pedra silenciosa e vazia por baixo.",
            sentinel: "O Sentinela Silencioso congela no lugar, tornando-se mais uma vez uma mera estátua.",
            generic: "O espírito encontra uma paz violenta, sua forma se dissipa em pó e ecos.",
        },
        dance: {
            shade: "A Sombra Sussurrante parece encontrar um momento de paz no seu ritmo, e desvanece-se com um zumbido fraco e feliz.",
            giggle_root: "O balanço frenético da Raiz Risonha acalma-se numa dança suave, e ela enraíza-se silenciosamente, tornando-se uma planta normal.",
            sun_petal: "A Pétala Solar Flutuante ressoa com a sua dança, a sua luz brilha intensamente uma vez antes de flutuar e desaparecer.",
            clam: "O zumbido da Concha Coral alinha-se com a sua dança, e fecha-se com um 'clang' final e ressonante, ficando dormente.",
            wisp: "A Bruma Ecoante junta-se à sua dança por um momento, a sua melodia triste torna-se alegre antes de desaparecer rapidamente.",
            crystal: "O tom do Cristal Cantor sobe a um belo crescendo com os seus movimentos, e depois silencia-se, com o seu dever cumprido.",
            generic: "O espírito é acalmado pela sua graça, sua agitação apaziguada. Ele acena em gratidão antes de desaparecer.",
        }
    },
    endings: {
        PURE_SHADOW: {
            title: "Sombra Pura",
            text: [
                "Você abraçou a luta. O labirinto não é uma prisão para você, mas um crisol. Você destroçou seu reflexo e tomou seu poder, tornando-se a mestre indiscutível deste domínio sombrio. O caminho para fora foi esquecido, pois por que uma rainha abandonaria seu trono?",
                "A sombra não é sua inimiga; é seu eu mais puro. Ao destruí-la, você se despojou de sua última fraqueza. O labirinto se remodela à sua vontade, um monumento à sua força. Você não escapou, você conquistou.",
                "Não há harmonia, apenas força. Não há dança, apenas a batalha. Você provou sua filosofia. O labirinto não oferece saída, mas sim uma coroa de pedra afiada. Você é a nova guardiã."
            ]
        },
        TAINTED_SHADOW: {
            title: "Sombra Contaminada",
            text: [
                "Você lutou, mas seu coração não estava totalmente nisso. Você derrotou sua sombra, mas seus sussurros de harmonia criaram raízes. Você é forte, mas também está em conflito. Você vagueia pelo labirinto, um fantasma poderoso, incerta de sua própria natureza.",
                "Embora você tenha escolhido o caminho da agressão, a memória da dança suavizou seus golpes. Você está vitoriosa, mas vazia. Você tem a força para governar, mas o desejo persistente de paz. Você é uma rainha com um coração dividido.",
                "Sua vitória é uma pergunta, não uma resposta. Você provou que pode lutar, mas não se esqueceu de como dançar. O labirinto não sabe o que fazer com você, e assim você permanece, um paradoxo de poder e graça, presa por sua própria indecisão."
            ]
        },
        BALANCE: {
            title: "Equilíbrio",
            text: [
                "Você caminhou pelo caminho do meio. Não cedeu à luta, nem abraçou totalmente a dança. Você mostrou à sua sombra que ambos são necessários. Em compreensão, ela te oferece uma escolha: ficar como guardiã do equilíbrio, ou partir com sua recém-adquirida sabedoria. O caminho para casa aparece diante de você.",
                "Você aceitou tanto a sombra como a luz dentro de você. O labirinto, um lugar de extremos, não pode conter alguém que caminha em equilíbrio. Sua sombra acena, não em derrota, mas em compreensão, e te mostra o caminho para fora. Você está inteira novamente.",
                "Nem a luta nem a dança são a resposta sozinhas, mas sim a sabedoria de saber quando usar cada uma. Você demonstrou isso, e o propósito do labirinto foi cumprido. Uma porta de luz cinzenta e tranquila aparece, prometendo um regresso ao mundo que você conhecia, mas como uma pessoa mudada."
            ]
        },
        HARMONIOUS_SHEPHERD: {
            title: "Pastora Harmoniosa",
            text: [
                "Você favoreceu a dança, mas não se esquivou da luta quando necessário. Você acalmou o coração do labirinto, mas mostrou-lhe que tem a força para proteger essa paz. Muitos espíritos, acalmados pela sua presença, agora olham para você como uma líder. Você poderia partir, mas quem os guiaria?",
                "Sua graça é temperada com força. Você acalmou os espíritos mais violentos e ganhou seu respeito. Você se tornou um farol de poder sereno no labirinto. A saída está aberta para você, mas os apelos silenciosos dos espíritos perdidos te pedem para ficar e ser sua guia.",
                "Você mostrou ao labirinto que a verdadeira harmonia não é a ausência de conflito, mas a capacidade de resolvê-lo com graça. Você se tornou uma mestra deste princípio. Você pode partir, mas sabe que, ao fazê-lo, esta frágil paz pode se estilhaçar. Você tem um novo propósito aqui."
            ]
        },
        PURE_HARMONY: {
            title: "Pura Harmonia",
            text: [
                "Você abraçou completamente a dança. Você não lutou, apenas acalmou. Você mostrou ao labirinto que todo o conflito pode ser resolvido com graça e compreensão. Os espíritos deste lugar não são seus inimigos, mas sua orquestra. Você é a maestrina de uma grande e bela sinfonia de paz. Você não tem desejo de partir; já está em casa.",
                "Sua jornada foi uma performance, e o labirinto foi seu palco. Você transformou este lugar de dor num salão de baile de espíritos serenos. Sua sombra não é destruída, mas torna-se sua parceira de dança. Juntas, vocês trarão harmonia a este lugar por toda a eternidade.",
                "Você provou que a graça é o poder supremo. O coração raivoso do labirinto é apaziguado, seus impulsos violentos acalmados pelo seu ritmo perfeito. Ele já não deseja te manter prisioneira, mas em vez disso, implora que você fique e seja sua canção. Você aceita, tornando-se a alma do labirinto."
            ]
        },
        GAME_OVER: {
            title: "Eco Desvanecido",
            text: [
                "O labirinto é um lugar difícil...",
                "Outro cai...",
                "Sua jornada termina aqui."
            ]
        }
    },
    labyrinth: {
        adjectives: [{m: "Sombrio", f:"Sombria"}, {m: "Sussurrante", f:"Sussurrante"}, {m: "Interminável", f:"Interminável"}, {m: "Esquecido", f:"Esquecida"}, {m: "Mutável", f:"Mutável"}, {m: "Afundado", f:"Afundada"}, {m: "Silencioso", f:"Silenciosa"}, {m: "Fragmentado", f:"Fragmentada"}],
        nouns: [{word: "Labirinto", gender: "m"}, {word: "Corredor", gender: "m"}, {word: "Salão", gender: "m"}, {word: "Profundeza", gender: "f"}, {word: "Toca", gender: "f"}, {word: "Emaranhado", gender: "m"}],
        nameTemplates: { m: "O {{noun}} {{adj}}", f: "A {{noun}} {{adj}}" }
    },
    bossDialogue: {
        BALANCE: {
            intro: [
                { speaker: "Keya's Shadow", text: "Então, a pequena luz ainda cintila. Você lutou e dançou. O que aprendeu?" },
                { speaker: "Keya", text: "Que ambos são necessários. Que a raiva e a graça devem caminhar juntas." },
                { speaker: "Keya's Shadow", text: "Palavras são fáceis. Mostre-me esse *equilíbrio* que você encontrou." }
            ],
            interlude_1: [
                { speaker: "Keya's Shadow", text: "Você resiste... mas ainda depende da força. É este o seu equilíbrio? Ou apenas hesitação?" },
                { speaker: "Keya", text: "É controle! É escolher quando ser a tempestade e quando ser a calma!" }
            ],
            interlude_2: [
                { speaker: "Keya's Shadow", text: "Impressionante. Você acalmou minha raiva e resistiu aos meus ataques. Mas o teste final permanece." },
                { speaker: "Keya", text: "Não tenho medo. Agora sei quem sou." }
            ],
            final_words: [
                { speaker: "Keya's Shadow", text: "Fui vencida... mas não destruída. Você provou sua sabedoria. Agora, faça sua escolha. O que você fará comigo, sua outra metade?" }
            ],
            embrace_ending: [
                { speaker: "Keya's Shadow", text: "Você me aceita? Toda a minha raiva, minha dor?" },
                { speaker: "Keya", text: "Você é uma parte de mim. Te negar é negar a mim mesma. Juntas, estamos completas." }
            ],
            destroy_ending: [
                { speaker: "Keya's Shadow", text: "Você me rejeitaria? Depois de tudo isto?" },
                { speaker: "Keya", text: "Você é a parte de mim que aceitou esta prisão. Eu vou embora. E vou te deixar para trás." }
            ]
        },
        PURE_SHADOW: {
            intro: [
                { speaker: "Keya's Shadow", text: "Tanta raiva. Tanta força. Finalmente você aprendeu a verdade deste lugar." },
                { speaker: "Keya", text: "A única verdade é que você é uma fraqueza. Uma memória a ser purgada." },
                { speaker: "Keya's Shadow", text: "Palavras ousadas. Vamos ver se sua força pode igualá-las. Mostre-me sua fúria!" }
            ],
            interlude_1: [{ speaker: "Keya's Shadow", text: "Sim! Mais! Abandone essa dança tola! Aqui só o poder importa!" }],
            interlude_2: [{ speaker: "Keya's Shadow", text: "Você é forte... mais forte do que eu pensava. Você está se tornando naquilo que devia ser." }],
            final_words: [{ speaker: "Keya's Shadow", text: "Você venceu. Eu me rendo. Sou sua fraqueza... termine com isso. Tome seu trono." }],
            embrace_ending: [{ speaker: "Keya", text: "Não. Você não é uma fraqueza a ser purgada, mas uma ferramenta a ser empunhada. Governaremos este lugar juntas." }],
            destroy_ending: [{ speaker: "Keya's Shadow", text: "Sim... Este é o verdadeiro caminho... aah!" }]
        },
        TAINTED_SHADOW: {
            intro: [
                { speaker: "Keya's Shadow", text: "Olhe para você. Uma lutadora que ainda ouve a música. Você está confusa." },
                { speaker: "Keya", text: "Eu luto porque devo. Isso não significa que eu tenha esquecido a paz." },
                { speaker: "Keya's Shadow", text: "Então você é uma tola! Uma meia-medida! Vou queimar essa fraqueza de você." }
            ],
            interlude_1: [
                { speaker: "Keya's Shadow", text: "Essa dança... por que você se agarra a ela? Isso só te deixa mais fraca!" },
                { speaker: "Keya", text: "Me lembra quem eu sou! Pelo que estou lutando!" }
            ],
            interlude_2: [{ speaker: "Keya's Shadow", text: "Você ainda está de pé... essa sua esperança patética é... resiliente." }],
            final_words: [{ speaker: "Keya's Shadow", text: "Eu... não compreendo. Sua força é real, mas seu coração está... contaminado com luz. E agora?" }],
            embrace_ending: [{ speaker: "Keya's Shadow", text: "Você me manteria? Com este conflito dentro de você?" }],
            destroy_ending: [{ speaker: "Keya's Shadow", text: "Então, no final, você escolhe a força. Que pena... você quase foi algo novo." }]
        },
        PURE_HARMONY: {
            intro: [
                { speaker: "Keya's Shadow", text: "Você apenas dança. Foge de todos os conflitos, escondendo-se atrás de seus passos graciosos. Você é fraca." },
                { speaker: "Keya", text: "Não sou fraca. Estou em paz. Algo que você claramente se esqueceu." },
                { speaker: "Keya's Shadow", text: "A paz é uma ilusão! Uma mentira que contamos a nós mesmos no escuro! Vou fazer você lutar!" }
            ],
            interlude_1: [{ speaker: "Keya's Shadow", text: "Pare! Pare com essa música incessante! Sua harmonia me queima!" }],
            interlude_2: [{ speaker: "Keya's Shadow", text: "Minha raiva... está... se desvanecendo. A canção... é demasiado bela..." }],
            final_words: [{ speaker: "Keya's Shadow", text: "Você me acalmou. A luta desapareceu. Sou... apenas um eco silencioso. O que você vai fazer?" }],
            embrace_ending: [{ speaker: "Keya's Shadow", text: "Você vai dançar comigo? Aqui? Para sempre?" }],
            destroy_ending: [{ speaker: "Keya", text: "Até um eco silencioso continua a ser uma sombra. E eu vou deixar as sombras para trás." }]
        },
        HARMONIOUS_SHEPHERD: {
            intro: [
                { speaker: "Keya's Shadow", text: "Uma dançarina que carrega um bastão afiado. Que curioso. Você pretende me acalmar ou me ameaçar?" },
                { speaker: "Keya", text: "Vou te acalmar se puder. Mas vou me defender se for preciso." },
                { speaker: "Keya's Shadow", text: "Um nobre sentimento. Vamos ver quanto tempo dura quando a música parar." }
            ],
            interlude_1: [
                { speaker: "Keya's Shadow", text: "Você luta apenas quando é preciso... você se contém. Por quê?" },
                { speaker: "Keya", text: "Porque você não é apenas minha inimiga. Você é minha dor. E a dor merece piedade, não apenas destruição." }
            ],
            interlude_2: [{ speaker: "Keya's Shadow", text: "Sua graça é... uma arma. Não esperava por isso. Você é mais do que eu fui." }],
            final_words: [{ speaker: "Keya's Shadow", text: "Eu concedo. Você me mostrou um caminho que eu não sabia que existia. Um de paz, guardado pela força." }],
            embrace_ending: [{ speaker: "Keya's Shadow", text: "Juntas, podemos guiar as outras almas perdidas aqui." }],
            destroy_ending: [{ speaker: "Keya's Shadow", text: "Então você abandona seus princípios por uma fuga fácil? Que decepcionante." }]
        },
        finalChoice: "O que você fará?",
        choiceDestroy: "Destruir a Sombra",
        choiceEmbrace: "Abraçar a Sombra"
    }
};

export const TEXTS = {
    pt: pt_translation
};
