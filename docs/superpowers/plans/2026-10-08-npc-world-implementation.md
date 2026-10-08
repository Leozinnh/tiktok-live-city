# NPC WORLD Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans (Native execution) to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Construir o sistema completo e executável do **NPC WORLD**, uma simulação 3D viva de cidade para TikTok LIVE com engine Three.js PBR, backend Node.js em tempo real, banco de dados SQLite, Event Director autônomo, eventos interativos da Live (Gifts, Comentários, Likes, Follows), câmeras cinematográficas e modo OBS.

**Architecture:** Arquitetura desacoplada em três camadas: (1) Backend Node.js gerenciando persistência SQLite (`better-sqlite3`), orquestração autônoma (Event Director) e ingestão TikTok LIVE com fallback de Mock; (2) WebSocket Hub de alta velocidade transmitindo eventos para o frontend; (3) Engine 3D Three.js PBR rodando no Vite com pós-processamento cinemático (Bloom), tráfego inteligente, simulação FSM de NPCs, áudio procedural Web Audio e HUD Glassmorphism responsivo para OBS.

**Tech Stack:** Node.js (v20+), Express, `ws` (WebSockets), `better-sqlite3`, Three.js, Vite, Web Audio API, HTML5/CSS Glassmorphism.

**Spec:** `docs/superpowers/specs/2026-10-08-npc-world-design.md`

## Global Constraints

- **Sem Git:** Não executar comandos git (`git add`, `git commit`, `git checkout`, etc.) em nenhuma etapa, respeitando a instrução explícita do usuário.
- **Executável e Funcional:** Nenhum arquivo com pseudocódigo, mock incompleto ou placeholders "TODO".
- **Visual Comercial:** Geometrias 3D detalhadas com chanfros, telhados, detalhes arquitetônicos, iluminação PBR com sombras suaves (`PCFSoftShadowMap`), brilho noturno (`UnrealBloomPass`) e materiais estilizados realistas.
- **24/7 Zero Leak:** Object pooling em partículas e gerenciamento de memória em loops de renderização.

## Review Focus

1. **Persistência Confiável:** Moradores criados por seguidores do TikTok devem persistir no SQLite e recarregar perfeitamente após reiniciar o servidor.
2. **Resiliência da Conexão:** Quedas temporárias de rede ou do WebSocket no frontend devem reconectar automaticamente sem travar a simulação 3D.
3. **Saneamento de Dados:** Eventos de comentários e gifts do TikTok com caracteres especiais ou strings gigantescas não podem quebrar o parser ou o HUD.
4. **Desempenho Estável:** O loop de física, tráfego e simulação de NPCs deve manter 60 FPS estáveis mesmo durante grandes eventos como queda de meteoro ou perseguição policial.
5. **Modo OBS Limpo:** No modo `--stream` ou `?mode=stream`, nenhum botão de debug, barra de rolagem ou artefato de desenvolvimento pode aparecer na captura de tela.

---

### Task 1: Estrutura do Projeto, Dependências e Configurações

**Files:**
- Create: `package.json`
- Create: `config/events.json`
- Create: `config/game_config.json`
- Create: `test/smoke_test.js`

**Interfaces:**
- Produces: scripts `npm run start`, `npm run server`, `npm run dev:client`, `npm test`
- Produces: arquivos de configuração JSON com esquemas validados para gifts e parâmetros gráficos

- [ ] **Step 1: Criar `package.json` com scripts e dependências do monorepo**
Configurar Express, `ws`, `better-sqlite3`, `three`, `vite` e dev dependencies.

- [ ] **Step 2: Criar `config/events.json` e `config/game_config.json`**
Definir mapeamento de gifts do TikTok (`Rose`, `Doughnut`, `Cap`, `Galaxy`, etc.) para ações no jogo e limites de performance (NPCs, veículos, qualidade gráfica, ciclo dia/noite).

- [ ] **Step 3: Instalar as dependências via npm**
Executar `npm install` no diretório raiz.

- [ ] **Step 4: Criar teste de fumaça inicial em `test/smoke_test.js`**
Testar carregamento dos arquivos de configuração e integridade das dependências.

- [ ] **Step 5: Executar o teste de fumaça**
Run: `node test/smoke_test.js`
Expected: PASS com status de configurações carregadas.

---

### Task 2: Camada de Banco de Dados SQLite (`better-sqlite3`)

**Files:**
- Create: `server/db/schema.sql`
- Create: `server/db/database.js`
- Test: `test/db_test.js`

**Interfaces:**
- Produces: `initDatabase(dbPath)`
- Produces: `getOrCreateViewer(username, nickname)`
- Produces: `recordInteraction(username, type, value)`
- Produces: `saveNPC(npcData)`, `getAllNPCs()`, `updateNPCStatus(id, updates)`
- Produces: `logEvent(type, triggerUser, payload)`
- Produces: `getTopViewers(limit)`
- Produces: `getCityEconomy()`, `updateCityEconomy(economyData)`

- [ ] **Step 1: Escrever teste de persistência em `test/db_test.js`**
Verificar criação de tabelas, inserção de espectadores, conversão em moradores, registro de histórico e recuperação de estado.

- [ ] **Step 2: Executar o teste para validar a falha inicial**
Run: `node test/db_test.js`
Expected: FAIL com módulo não encontrado.

- [ ] **Step 3: Criar `server/db/schema.sql`**
Definir tabelas `viewers`, `npcs`, `events_history` e `city_economy` com chaves primárias, estrangeiras e índices.

- [ ] **Step 4: Implementar `server/db/database.js`**
Conectar com `better-sqlite3`, executar schema de inicialização em transação e exportar métodos CRUD com tratamento de erros.

- [ ] **Step 5: Executar `test/db_test.js` e validar sucesso**
Run: `node test/db_test.js`
Expected: PASS com todos os testes de persistência passando.

---

### Task 3: Backend Core, WebSocket Hub e Event Bus

**Files:**
- Create: `server/websocket/ws_hub.js`
- Create: `server/index.js`
- Test: `test/ws_test.js`

**Interfaces:**
- Consumes: `server/db/database.js`
- Produces: Servidor HTTP Express + WebSocket Server na porta 3000
- Produces: `broadcastEvent(eventType, payload)`
- Produces: Endpoints REST `/api/health`, `/api/stats`, `/api/trigger`

- [ ] **Step 1: Escrever teste de comunicação WebSocket em `test/ws_test.js`**
Conectar um cliente WebSocket sintético ao servidor, disparar um evento via API e verificar se o cliente recebe o payload formatado.

- [ ] **Step 2: Executar teste para validar a falha**
Run: `node test/ws_test.js`
Expected: FAIL (servidor não iniciado).

- [ ] **Step 3: Implementar `server/websocket/ws_hub.js`**
Gerenciar lista de clientes conectados (frontends e OBS), enviar ping/pong para manter conexão viva e método de broadcast com serialização segura.

- [ ] **Step 4: Implementar `server/index.js`**
Inicializar Express, rotas da API, servidor WebSocket e integração com o banco de dados.

- [ ] **Step 5: Executar `test/ws_test.js` e validar sucesso**
Run: `node test/ws_test.js`
Expected: PASS com conexão e broadcast validados.

---

### Task 4: Ingestor TikTok LIVE e Mock Feeder

**Files:**
- Create: `server/tiktok/sanitizer.js`
- Create: `server/tiktok/mock_feeder.js`
- Create: `server/tiktok/connector.js`
- Test: `test/tiktok_feeder_test.js`

**Interfaces:**
- Consumes: `config/events.json`, `server/websocket/ws_hub.js`, `server/db/database.js`
- Produces: `startMockFeeder()`, `stopMockFeeder()`, `triggerManualMock(event)`
- Produces: `connectTikTok(liveUsername)`, `disconnectTikTok()`

- [ ] **Step 1: Escrever teste em `test/tiktok_feeder_test.js`**
Testar sanitização de dados, mapeamento de presentes configuráveis e disparo de eventos simulados.

- [ ] **Step 2: Executar o teste e validar falha**
Run: `node test/tiktok_feeder_test.js`
Expected: FAIL.

- [ ] **Step 3: Implementar `server/tiktok/sanitizer.js`**
Filtrar emojis perigosos, caracteres nulos, limitar tamanho de username e comentários para evitar injeções ou bugs na UI.

- [ ] **Step 4: Implementar `server/tiktok/mock_feeder.js`**
Gerador de likes periódicos, comentários randômicos de comando (`"policia"`, `"chuva"`, `"festa"`), seguidores e presentes com intervalo ajustável.

- [ ] **Step 5: Implementar `server/tiktok/connector.js`**
Wrapper para integração com a API da live do TikTok, com reconexão automática e fallback para mock caso o canal esteja offline.

- [ ] **Step 6: Executar `test/tiktok_feeder_test.js` e validar sucesso**
Run: `node test/tiktok_feeder_test.js`
Expected: PASS.

---

### Task 5: Event Director e Gerador de Eventos em Cadeia

**Files:**
- Create: `server/director/chain_events.js`
- Create: `server/director/event_director.js`
- Test: `test/event_director_test.js`

**Interfaces:**
- Consumes: `server/websocket/ws_hub.js`, `server/db/database.js`
- Produces: `EventDirector.update(delta)`, `EventDirector.triggerChain(chainName, initialData)`

- [ ] **Step 1: Escrever teste de orquestração em `test/event_director_test.js`**
Simular passagem de tempo ocioso e verificar se o Event Director dispara evento autônomo e progride em cadeia (ex: Roubo → Perseguição → Acidente).

- [ ] **Step 2: Executar o teste e validar falha**
Run: `node test/event_director_test.js`
Expected: FAIL.

- [ ] **Step 3: Implementar `server/director/chain_events.js`**
Definir cadeias reativas:
1. `BANK_ROBBERY` → `POLICE_CHASE` → `VEHICLE_CRASH` → `AMBULANCE_DISPATCH` → `ARREST`.
2. `METEOR_STRIKE` → `SIREN_ALERT` → `SKY_RED` → `METEOR_IMPACT` → `PANIC_FLEE` → `RESCUE`.
3. `ILLEGAL_RACE` → `POLICE_INTERVENTION` → `STREET_BLOCK`.

- [ ] **Step 4: Implementar `server/director/event_director.js`**
Monitor de tensão da cidade com máquina de estados (CALM, TENSION, ACTION, CLIMAX, COOLDOWN), temporizadores e tabela de probabilidades ponderadas.

- [ ] **Step 5: Executar `test/event_director_test.js` e validar sucesso**
Run: `node test/event_director_test.js`
Expected: PASS.

---

### Task 6: Setup do Frontend 3D (Vite, Three.js, PBR e Post-Processing)

**Files:**
- Create: `client/index.html`
- Create: `client/vite.config.js`
- Create: `client/src/core/engine.js`
- Create: `client/src/core/composer.js`
- Create: `client/src/core/time.js`
- Create: `client/src/main.js`

**Interfaces:**
- Produces: `GameEngine.init(canvasContainer)`, `GameEngine.render()`, `GameEngine.scene`, `GameEngine.camera`, `GameEngine.renderer`
- Produces: Pipeline com `ACESFilmicToneMapping`, `PCFSoftShadowMap`, `UnrealBloomPass`

- [ ] **Step 1: Criar `client/vite.config.js` e `client/index.html`**
Configurar servidor Vite na porta 5173 com proxy para o backend (porta 3000), montando contêiner 3D em tela cheia e viewport dinâmico.

- [ ] **Step 2: Implementar `client/src/core/engine.js`**
Inicializar Three.js `WebGLRenderer` com antialias, ratio de pixels ajustável, sombras habilitadas e gerenciamento de redimensionamento de janela (16:9 e 9:16).

- [ ] **Step 3: Implementar `client/src/core/composer.js`**
Configurar pós-processamento: `EffectComposer`, `RenderPass` e `UnrealBloomPass` com valores calibrados para que lâmpadas, faróis e neons brilhem sem estourar a imagem.

- [ ] **Step 4: Implementar `client/src/core/time.js`**
Controle de delta time suave com clamp contra saltos após pausas de aba ou travamentos, garantindo simulação estável 24/7.

- [ ] **Step 5: Integrar loop principal em `client/src/main.js`**
Conectar Engine, Composer e loop RAF.

- [ ] **Step 6: Validar build do Vite**
Run: `npx vite build client`
Expected: Build concluído com sucesso sem erros de sintaxe ou imports.

---

### Task 7: Construtor Urbano 3D (Ruas, Quarteirões, Edifícios e Mobiliário)

**Files:**
- Create: `client/src/world/city_builder.js`
- Create: `client/src/world/buildings.js`
- Create: `client/src/world/props.js`
- Create: `client/src/simulation/pathfinding.js`

**Interfaces:**
- Produces: `CityBuilder.generate()`
- Produces: Malha viária (ruas asfaltadas, faixas duplas, faixas de pedestres, calçadas com chanfro)
- Produces: Prédios residenciais, comerciais, banco, delegacia de polícia, hospital, posto de combustível com cobertura e loja
- Produces: Praça arborizada com bancos, chafariz e caminhos
- Produces: Postes de luz com fontes luminosas acopladas, semáforos animados, árvores e hidrantes
- Produces: Grafo de navegação (`PathGraph`) para pedestres e veículos

- [ ] **Step 1: Implementar `client/src/world/buildings.js`**
Gerador de arquiteturas 3D ricas: edifícios modernos com relevo, telhados com caixas d'água e antenas, lojas com vitrines translúcidas e letreiros emissivos, hospital com cruz vermelha iluminada e delegacia estilizada.

- [ ] **Step 2: Implementar `client/src/world/props.js`**
Criação de postes de ferro fundido detalhados com lâmpadas pontuais, semáforos com caixas e luzes verdes/amarelas/vermelhas, árvores estilizadas com copas volumétricas e troncos de madeira, lixeiras e bancos de praça.

- [ ] **Step 3: Implementar `client/src/simulation/pathfinding.js`**
Grafo com nós viários (pistas de mão única e dupla, entroncamentos) e nós de calçada (caminhos de pedestres, faixas de travessia).

- [ ] **Step 4: Implementar `client/src/world/city_builder.js`**
Montar a cidade conectando o asfalto, quarteirões, edifícios, praça, mobiliário e registrando as posições no grafo de navegação.

- [ ] **Step 5: Validar compilação do Vite**
Run: `npx vite build client`
Expected: PASS.

---

### Task 8: Ciclo Dia/Noite, Luzes Urbanas e Clima Dinâmico

**Files:**
- Create: `client/src/world/environment.js`
- Create: `client/src/world/weather.js`

**Interfaces:**
- Consumes: `GameEngine.scene`
- Produces: `Environment.update(deltaTime)`, `Environment.setTime(hour)`, `Environment.getTime()`
- Produces: `Weather.setWeather(weatherType)`, `Weather.update(deltaTime)`
- Produces: Alternância automática de iluminação de janelas e postes de rua conforme a hora do dia

- [ ] **Step 1: Implementar `client/src/world/environment.js`**
Ciclo contínuo de 24 horas: movimentação orbital do Sol (`DirectionalLight` dourada) e da Lua (luz azulada suave), transição da cor do céu e acionamento/desligamento automático das luzes de postes, semáforos e janelas de prédios ao anoitecer.

- [ ] **Step 2: Implementar `client/src/world/weather.js`**
Object Pool de gotas de chuva em alta densidade com ângulo de vento, poças reflexivas no asfalto (modulação de roughness do material de rua), relâmpagos estroboscópicos durante tempestades e neblina volumétrica ajustável (`FogExp2`).

- [ ] **Step 3: Testar integração no main loop**
Integrar `Environment` e `Weather` em `main.js` e verificar que respondem a mudanças de estado.

- [ ] **Step 4: Validar build do Vite**
Run: `npx vite build client`
Expected: PASS.

---

### Task 9: Frota de Veículos e Sistema de Trânsito Inteligente

**Files:**
- Create: `client/src/entities/vehicle.js`
- Create: `client/src/entities/vehicle_manager.js`

**Interfaces:**
- Consumes: `PathGraph`, `GameEngine.scene`
- Produces: `VehicleManager.spawnVehicle(type, position)`, `VehicleManager.update(deltaTime)`
- Produces: Tipos de veículo: Sedans civis, Carros esportivos, Viaturas Policiais com sirene vermelha/azul e Ambulâncias com giroflex
- Produces: Paradas em semáforos, curvas suaves, modo de perseguição de emergência e efeitos de colisão/fumaça

- [ ] **Step 1: Implementar `client/src/entities/vehicle.js`**
Modelos 3D de veículos estilizados (carroceria chanfrada, rodas giratórias, vidros fumê, faróis dianteiros com cones de luz e lanternas traseiras). Viaturas com barra de luz policial no teto que alterna luzes vermelhas e azuis.

- [ ] **Step 2: Implementar lógica de navegação e semáforos**
Seguimento suave de waypoints, detecção de veículos à frente para evitar sobreposições e respeito aos semáforos nas esquinas.

- [ ] **Step 3: Implementar `client/src/entities/vehicle_manager.js`**
Controle da frota com limite de veículos simultâneos (pool reutilizável), despacho de viaturas policiais em emergência (sirenes abertas e prioridade de trânsito) e simulação de colisões com faíscas/fumaça.

- [ ] **Step 4: Validar build do Vite**
Run: `npx vite build client`
Expected: PASS.

---

### Task 10: Simulação de NPCs, Rotinas, FSM e Moradores da Live

**Files:**
- Create: `client/src/entities/npc.js`
- Create: `client/src/entities/npc_manager.js`
- Create: `client/src/simulation/npc_ai.js`

**Interfaces:**
- Consumes: `PathGraph`, `CityBuilder`, `GameEngine.scene`
- Produces: `NPCManager.spawnNPC(options)`, `NPCManager.createResident(viewerData)`, `NPCManager.update(deltaTime)`
- Produces: Personagens 3D articulados com caminhada procedural, corrida de pânico e animação sentada
- Produces: Máquina de estados FSM: trabalho, compras no mercado, refeição no restaurante, lazer na praça, sono em casa e fuga em emergências
- Produces: Crachá 3D suspenso com nome do seguidor da live (@usuario), ocupação e saldo monetário

- [ ] **Step 1: Implementar `client/src/entities/npc.js`**
Modelo 3D modular estilizado (cabeça com olhos expressivos, tronco, membros com pivôs nos ombros e quadris para animação procedural de passos e braços oscilantes). Variações de paleta de cores para roupas e pele.

- [ ] **Step 2: Implementar crachá estilizado de morador da LIVE**
Sprite 3D / Canvas renderizado acima da cabeça exibindo `@username`, cargo e nível quando o NPC for vinculado a um espectador real.

- [ ] **Step 3: Implementar `client/src/simulation/npc_ai.js`**
Rotina diária com necessidades de fome, energia, humor e dinheiro. Quando com fome, caminha até o restaurante ou mercado; quando sem energia, volta para seu prédio residencial.

- [ ] **Step 4: Implementar `client/src/entities/npc_manager.js`**
Gerenciador com Object Pooling de 20 a 50 NPCs simultâneos, garantindo zero gargalos de renderização e permitindo transformar seguidores da live em cidadãos imediatos.

- [ ] **Step 5: Validar build do Vite**
Run: `npx vite build client`
Expected: PASS.

---

### Task 11: Diretor de Câmeras Inteligentes e Cinematográficas

**Files:**
- Create: `client/src/camera/camera_modes.js`
- Create: `client/src/camera/camera_director.js`

**Interfaces:**
- Consumes: `GameEngine.camera`
- Produces: `CameraDirector.setMode(mode, target)`, `CameraDirector.update(deltaTime)`
- Produces: Modo Panorâmico Orbital, Chase Cam (traseira baixa de viaturas), Follow Cam (moradores) e Event Cam (dramática com transições suaves via Lerp)

- [ ] **Step 1: Implementar `client/src/camera/camera_modes.js`**
Definição dos modos:
1. `ORBITAL`: Ângulo isométrico suave deslizando sobre os pontos movimentados da cidade.
2. `CHASE`: Câmera dinâmica atrás de veículos com ligeira inclinação em curvas.
3. `FOLLOW_NPC`: Câmera em terceira pessoa acompanhando moradores específicos.
4. `CINEMATIC_EVENT`: Ângulos verticais dramáticos pré-configurados para eventos especiais.

- [ ] **Step 2: Implementar `client/src/camera/camera_director.js`**
Transições suaves entre câmeras utilizando amortecimento esférico e interpolação linear (`lerp` e `slerp`) para evitar solavancos que prejudiquem a experiência da live.

- [ ] **Step 3: Validar build do Vite**
Run: `npx vite build client`
Expected: PASS.

---

### Task 12: Eventos Épicos (Queda de Meteoro, Invasões e Festivais)

**Files:**
- Create: `client/src/world/epic_events.js`
- Test: `test/epic_events_test.js`

**Interfaces:**
- Consumes: `CameraDirector`, `Environment`, `NPCManager`, `VehicleManager`, `SoundEngine`
- Produces: `EpicEvents.triggerMeteorStrike(targetPosition)`
- Produces: `EpicEvents.triggerStreetRace()`
- Produces: `EpicEvents.triggerCityFestival()`

- [ ] **Step 1: Implementar sequência cinemática do Meteoro em `client/src/world/epic_events.js`**
Sirene de emergência soa → Iluminação da cidade ganha matiz vermelho escuro → Câmera sobe em direção ao céu → Rastro volumétrico de fogo e partículas cruza o ar → Impacto no solo com explosão de faíscas, cratera temporária e fumaça densa → NPCs próximos entram em estado `FLEEING` (correndo em pânico) → Sirene de ambulância e polícia ativada para o local.

- [ ] **Step 2: Implementar Corrida Clandestina**
Dois carros esportivos aceleram em alta velocidade lado a lado pelas avenidas principais enquanto uma viatura policial inicia perseguição atrás deles.

- [ ] **Step 3: Implementar Festival da Cidade**
Fogos de artifício estourando acima da praça central, iluminação estroboscópica colorida e aglomeração festiva de NPCs dançando.

- [ ] **Step 4: Validar build do Vite**
Run: `npx vite build client`
Expected: PASS.

---

### Task 13: Engine de Áudio Espacial Procedural (Web Audio API)

**Files:**
- Create: `client/src/audio/sound_engine.js`

**Interfaces:**
- Produces: `SoundEngine.init()`, `SoundEngine.setMasterVolume(volume)`, `SoundEngine.mute(isMuted)`
- Produces: `SoundEngine.playSiren(active)`, `SoundEngine.playRain(intensity)`, `SoundEngine.playExplosion()`, `SoundEngine.playThunder()`, `SoundEngine.playCarHorn()`, `SoundEngine.playNotification()`

- [ ] **Step 1: Implementar síntese procedural de sons via Web Audio API**
Construir osciladores e geradores de ruído para:
- Sirene de viatura: Modulação de onda senoidal de 600Hz a 950Hz com LFO.
- Chuva contínua: Buffer de ruído branco filtrado por filtro passa-baixas com ganho proporcional.
- Trovão e Explosão: Ruído com decaimento exponencial acoplado a onda senoidal grave com distorção harmônica.
- Notificações de presentes da live: Acorde de sino cristalino.

- [ ] **Step 2: Adicionar controles de volume e mute acessíveis**
Permitir que o streamer silencie ou regule os sons para não interferir na voz da transmissão.

- [ ] **Step 3: Validar build do Vite**
Run: `npx vite build client`
Expected: PASS.

---

### Task 14: HUD Glassmorphism, Modo OBS e Painel Admin / Dev

**Files:**
- Create: `client/src/ui/hud.js`
- Create: `client/src/ui/dev_panel.js`
- Create: `client/src/network/ws_client.js`
- Modify: `client/index.html`

**Interfaces:**
- Consumes: `ws_client.js`, `CityBuilder`, `Environment`, `NPCManager`
- Produces: Live feed de presentes/comentários translúcido na lateral
- Produces: Barra de status superior com relógio, população, clima e economia
- Produces: Painel flutuante de desenvolvimento com telemetria (FPS, entidades, memória) e comandos rápidos (`/meteor`, `/police`, `/rain`, `/race`, `/festival`)
- Produces: Alternância de Modo OBS (oculta todos os controles para captura limpa)

- [ ] **Step 1: Implementar `client/src/network/ws_client.js`**
Conexão WebSocket resiliente com o backend, reconexão exponencial automática e despacho de eventos para a UI e a engine do jogo.

- [ ] **Step 2: Implementar HUD Glassmorphism em `client/src/ui/hud.js`**
Estilo visual profissional com fundo translúcido `backdrop-filter: blur(12px)`, tipografia moderna monospace/sans-serif limpa e cartões animados de alertas de presentes e novos seguidores.

- [ ] **Step 3: Implementar painel de administração em `client/src/ui/dev_panel.js`**
Medidores de FPS, botões para disparar qualquer evento manualmente com 1 clique e input de chat para testar comandos de espectadores.

- [ ] **Step 4: Implementar alternância de Modo OBS e modo vertical 9:16**
Detecção automática de parâmetro URL `?mode=stream` e suporte a formato vertical TikTok (1080x1920) e widescreen (1920x1080).

- [ ] **Step 5: Validar build do Vite**
Run: `npx vite build client`
Expected: PASS.

---

### Task 15: Integração Completa, Validação E2E e Documentação

**Files:**
- Create: `test/e2e_integration_test.js`
- Create: `README.md`
- Create: `start.bat`
- Modify: `client/src/main.js`

**Interfaces:**
- Produces: Suíte de testes automatizados completa
- Produces: Script de inicialização com um clique para Windows (`start.bat`)
- Produces: Guia detalhado de configuração com OBS Studio e TikTok LIVE

- [ ] **Step 1: Escrever teste de integração de ponta a ponta em `test/e2e_integration_test.js`**
Inicializar banco de dados, servidor backend e mock feeder; verificar se os eventos gerados fluem até a emissão do WebSocket e são persistidos no SQLite.

- [ ] **Step 2: Executar todos os testes do projeto**
Run: `npm test`
Expected: PASS em todos os módulos e integrações.

- [ ] **Step 3: Criar script executável `start.bat` para inicialização simples**
Inicia backend e frontend em simultâneo com comandos simplificados.

- [ ] **Step 4: Escrever `README.md` detalhado**
Instruções completas de uso:
- Como iniciar o projeto
- Como configurar a captura no OBS Studio (resolução vertical 1080x1920 ou 16:9)
- Como ativar a integração com a live real do TikTok
- Como usar o simulador/mock para criar transmissões de teste
- Lista de comandos de chat e presentes mapeados

- [ ] **Step 5: Validar build de produção final**
Run: `npm run build`
Expected: Sucesso total sem erros ou warnings bloqueantes.
