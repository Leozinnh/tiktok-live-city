# NPC WORLD - Documento de Design e Especificação Técnica

**Data:** 2026-10-08  
**Projeto:** NPC WORLD — Simulação 3D Interativa para TikTok LIVE  
**Status:** Aprovado  
**Controle de Versão:** Sem Git (conforme instrução do usuário)

---

## 1. Visão Geral e Objetivos do Produto

O **NPC WORLD** é uma simulação 3D viva de uma cidade contemporânea, construída especificamente para funcionar como uma **máquina de entretenimento contínua (24/7)** transmitida via TikTok LIVE e capturada diretamente no OBS Studio.

### Pilares Fundamentais:
1. **Visual Comercial e Estilizado:** Modelagem 3D arquitetônica refinada, iluminação PBR com sombras suaves (`PCFSoftShadowMap`), ciclo contínuo de dia/tarde/pôr do sol/noite/madrugada com postes e janelas iluminadas, clima dinâmico (sol, chuva com reflexos, tempestade com relâmpagos, neblina volumétrica) e pós-processamento cinemático (Bloom e Tone Mapping ACESFilmic).
2. **Cidade Viva e Autônoma:** População com rotina diária (casa, trabalho, lazer, compras, descanso), necessidades orgânicas (energia, fome, humor, dinheiro), economia ativa e tráfego de veículos inteligentes (carros, ambulâncias, viaturas com sirenes operacionais).
3. **Direção Cinematográfica (Event Director):** Algoritmo autônomo que regula a tensão dramática da live (Calmaria → Tensão → Acontecimentos/Perseguições → Clímax → Resolução), garantindo que a transmissão nunca fique monótona mesmo sem intervenções externas.
4. **Interatividade em Tempo Real com TikTok LIVE:**
   * **Seguidores:** Nascem como moradores permanentes da cidade com seus nomes (@usuario) e profissões.
   * **Comentários:** Comandos interativos configuráveis (`chuva`, `policia`, `corrida`, `zumbi`, `festa`, `apagao`).
   * **Presentes (Gifts):** Impacto progressivo (desde uma rosa gerando um novo habitante até presentes lendários gerando uma queda de meteoro com destruição, sirenes e pânico coletivo).
   * **Likes:** Milestones numéricos que aceleram o desenvolvimento da cidade.
5. **Persistência Confiável:** Banco de dados SQLite (`better-sqlite3`) armazenando moradores, histórico de interações de espectadores, economia da cidade e estatísticas.
6. **Robustez 24/7:** Renderização com Object Pooling, prevenção de memory leaks, modo headless/mock para desenvolvimento e modo dedicado otimizado para captura do OBS (`--stream` em 9:16 ou 16:9).

---

## 2. Arquitetura do Sistema

```text
┌────────────────────────────────────────────────────────┐
│                   TIKTOK LIVE / AUDIÊNCIA              │
│       Comentários | Presentes | Likes | Follows        │
└──────────────────────────┬─────────────────────────────┘
                           │
                           ▼
┌────────────────────────────────────────────────────────┐
│                     BACKEND (Node.js)                  │
│                                                        │
│  ┌─────────────────────────┐  ┌─────────────────────┐  │
│  │ TikTok Connector / Mock │  │  SQLite Database    │  │
│  │ (Validação & Fallback)  │  │  (better-sqlite3)   │  │
│  └───────────┬─────────────┘  └──────────┬──────────┘  │
│              ▼                           │             │
│  ┌─────────────────────────┐             │             │
│  │ Event Queue / Director  │◄────────────┘             │
│  │ & Chain Event Processor │                           │
│  └───────────┬─────────────┘                           │
│              ▼                                         │
│  ┌─────────────────────────┐                           │
│  │ WebSocket Server (ws)   │                           │
│  └───────────┬─────────────┘                           │
└──────────────┼─────────────────────────────────────────┘
               │ JSON Events & State Sync
               ▼
┌────────────────────────────────────────────────────────┐
│               FRONTEND 3D ENGINE (Three.js / Vite)     │
│                                                        │
│  ┌──────────────────────────────────────────────────┐  │
│  │ Core Engine (PBR Renderer, Composer, Shadows)    │  │
│  ├──────────────────────────────────────────────────┤  │
│  │ World Builder (Ruas, Prédios, Luzes, Semáforos)  │  │
│  ├──────────────────────────────────────────────────┤  │
│  │ Environment (Ciclo Dia/Noite 24h & Clima)        │  │
│  ├──────────────────────────────────────────────────┤  │
│  │ Entity Managers (NPCs com FSM & Veículos com IA) │  │
│  ├──────────────────────────────────────────────────┤  │
│  │ Dynamic Camera Director (Orbital, Chase, Event)  │  │
│  ├──────────────────────────────────────────────────┤  │
│  │ Web Audio Engine (Sons espaciais sintéticos)     │  │
│  ├──────────────────────────────────────────────────┤  │
│  │ HUD Overlay (Glassmorphism, Live Feed, Ranking)  │  │
│  └──────────────────────────────────────────────────┘  │
└──────────────────────────┬─────────────────────────────┘
                           │
                           ▼
┌────────────────────────────────────────────────────────┐
│               OBS STUDIO (Captura de Tela/Browser)     │
└────────────────────────────────────────────────────────┘
```

---

## 3. Especificação dos Módulos

### 3.1. Engine 3D e Renderização (Client)
* **Framework:** Three.js com Vite para empacotamento rápido e HMR.
* **Pipeline PBR:**
  * `ACESFilmicToneMapping` com `toneMappingExposure = 1.0`.
  * `DirectionalLight` simulando o sol/lua com cálculo de sombras suaves via `PCFSoftShadowMap`.
  * `HemisphereLight` para iluminação difusa do céu e chão.
  * Pós-processamento com `EffectComposer`, `RenderPass` e `UnrealBloomPass` para gerar brilho natural em lâmpadas, neons e faróis à noite.
* **Ciclo Dia/Noite:**
  * Duração configurável (padrão: 1 dia completo a cada 12 minutos).
  * Variação contínua da cor do céu (gradiente com ShaderMaterial ou HemisphereLight interpolada).
  * Luzes urbanas (postes de luz, semáforos, fachadas e janelas de edifícios) acendem automaticamente ao anoitecer e apagam ao amanhecer.
* **Sistema Climático:**
  * **Sol:** Iluminação clara, sombras nítidas.
  * **Chuva:** Sistema de partículas recicladas em loop contínuo (Object Pool) caindo com ângulo dinâmico de vento. Asfalto ganha reflexo úmido.
  * **Tempestade:** Chuva densa acompanhada de flashes súbitos de relâmpagos e trovões procedurais no sound engine.
  * **Neblina:** `THREE.FogExp2` com controle de densidade e cor harmonizada com o ciclo dia/noite.

### 3.2. Cidade e Cenário
* **Malha Urbana:**
  * Bairro central planejado com quarteirões, calçadas com rebaixo, pistas de asfalto com marcações viárias, faixas de pedestres e cruzamentos sinalizados com semáforos funcionais.
  * Praça central arborizada com bancos, chafariz e caminhos de pedestres.
  * Zona residencial com casas e prédios de apartamentos.
  * Zona comercial com lojas de conveniência, restaurante, oficina mecânica, posto de combustível com letreiro luminoso e banco.
  * Prédios institucionais: Delegacia de Polícia (com pátio de viaturas) e Hospital Geral (com heliponto e ambulâncias).
* **Adornos e Mobiliário Urbano:**
  * Postes de iluminação de alta definição com fontes de luz pontual/spot.
  * Semáforos com ciclo cronometrado de verde/amarelo/vermelho que controlam veículos e pedestres.
  * Vegetação (árvores estilizadas e arbustos) com ligeiro movimento de vento.
  * Lixeiras, hidrantes, placas de trânsito e pontos de ônibus.

### 3.3. NPCs e Simulação Social
* **Modelo Tridimensional:**
  * Personagens 3D estilizados com proporções agradáveis, corpo modular (cabeça, tronco, membros articulados com animação procedural de caminhada, corrida e repouso).
  * Variações de cores de pele, roupas, chapéus e adereços.
* **Estrutura de Dados do NPC:**
  * Identificador único (`id`), nome (`name`), se é morador da live (`viewerUsername`), personalidade (`Worker`, `Lazy`, `Cop`, `Medic`, `Criminal`, `Tourist`, `Influencer`).
  * Necessidades dinâmicas: `energy` (0-100), `hunger` (0-100), `mood` (0-100), `money` ($).
  * Vínculos: `homeBuildingId`, `workBuildingId`.
  * Estados FSM: `SLEEPING`, `WANDERING`, `GOING_TO_WORK`, `WORKING`, `EATING`, `SHOPPING`, `RELAXING_IN_PARK`, `FLEEING` (pânico), `ARRESTED`.
* **Moradores de Seguidores da LIVE:**
  * Ao receber evento de `follow`, verifica no SQLite se o seguidor já possui registro. Se não possuir, gera um novo habitante na cidade com crachá estilizado flutuante em 3D sobre sua cabeça exibindo seu `@usuario`, cargo e saldo.
  * O espectador ganha dinheiro e nível conforme interage na live.

### 3.4. Veículos e Tráfego
* **Frota Urbana:**
  * Carros civis populares, sedans, pickups e esportivos em cores diversas.
  * Viaturas policiais estilizadas com giroscópio e sirene dupla (luzes azuis e vermelhas piscantes).
  * Ambulâncias de emergência com luzes rotativas.
* **Sistema de Navegação:**
  * Grafo de pistas viárias com nós de tráfego, faixas corretas de mão/contramão e respeito aos semáforos.
  * Sistema de ultrapassagem e aceleração/desaceleração suave.
  * Modo de emergência: viaturas e ambulâncias ligam sirenes sonoras e luminosas, ignoram sinal vermelho e os carros civis abrem passagem.

### 3.5. Event Director e Cadeias de Acontecimentos
* **Algoritmo de Tensão Contínua:**
  * Monitora a atividade recente. Se nos últimos 3 a 5 minutos nenhum evento tiver sido acionado por espectadores, o Event Director gera um evento autônomo baseado em distribuição probabilística balanceada:
    * *Evento Comum (70%):* Corrida de rua, protesto pacífico na praça, chuva repentina, pane em semáforo.
    * *Evento Dramático (25%):* Assalto ao banco comercial com perseguição policial em alta velocidade e possível batida de trânsito.
    * *Evento Especial (5%):* Queda de energia geral na cidade com apagão de postes e prédios, ou festival com fogos.
* **Cadeias Reativas:**
  * Exemplo: Assalto ao Banco → Alarme Toca → Despacho da Viatura mais próxima → Perseguição Policial em tempo real → Colisão Veicular com faíscas e fumaça → Despacho de Ambulância → Remoção do acidentado e prisão do criminoso.
* **Evento Lendário: Queda de Meteoro:**
  * Ativado por presente épico ou comando administrativo (`/meteor`).
  * Roteiro cinematográfico: Sirenes de emergência da defesa civil soam → Céu escurece para vermelho fogo → Câmera sobe aos céus apontando para o meteoro em chamas cortando a atmosfera → Impacto massivo no solo com onda de choque, partículas de fogo e fumaça → NPCs no raio próximo saem correndo em pânico → Equipes de resgate são enviadas ao local.

### 3.6. Sistema de Câmeras Inteligentes
* **Câmera Panorâmica Orbital:** Transição suave entre pontos turísticos e regiões ativas da cidade quando tudo está em calmaria.
* **Chase Cam:** Fixa-se na traseira ou lateral baixa de uma viatura policial durante uma perseguição em alta velocidade.
* **Follow Cam:** Foca em um NPC específico (especialmente um espectador que acabou de mandar presente ou interagir).
* **Cinematic Event Cam:** Ângulos dramáticos pré-configurados acionados durante grandes eventos (ex: ângulo aéreo do meteoro, visão de cima do heliponto do hospital).

### 3.7. Áudio Espacial e Procedural
* Implementado com a Web Audio API nativa (sem dependências de áudio externas quebradas):
  * Síntese procedural de sirenes policiais senoidais moduladas por frequência.
  * Ruído branco filtrado com passa-baixas para simular chuva contínua e vento.
  * Ondas senoidais amortecidas e ruído para simular impacto de explosão e trovões.
  * Sons de buzina, passos e cliques de interface.
  * Controle de volume mestre para evitar conflito com o microfone do streamer.

### 3.8. Backend, Banco de Dados e WebSocket
* **Servidor Node.js:**
  * Servidor HTTP com Express + WebSocket Server (`ws`) rodando na porta 3000.
  * Camada TikTok LIVE: Biblioteca `tiktok-live-connector` com wrappers para conexão via username da live.
  * Camada de Fallback / Simulador: Painel de simulação que gera eventos automáticos ou manuais via interface ou comandos sem necessidade de live ativa.
  * Validação rigorosa de payloads (sanitização de usernames, limitação de caracteres e verificação de tipos).
* **Banco de Dados SQLite (`better-sqlite3`):**
  * Arquivo persistente em `database/npc_world.sqlite`.
  * Tabela `viewers`: `username` (PK), `nickname`, `likes_count`, `gifts_value`, `is_follower`, `created_at`, `updated_at`.
  * Tabela `npcs`: `id` (PK), `viewer_username` (FK), `name`, `personality`, `job`, `money`, `home_id`, `work_id`.
  * Tabela `events_history`: `id`, `event_type`, `user_trigger`, `payload_json`, `timestamp`.
  * Tabela `city_economy`: `total_money`, `population`, `active_jobs`, `last_updated`.

### 3.9. HUD da LIVE, Modo OBS e Painel de Desenvolvimento
* **HUD Glassmorphism:**
  * Top bar translúcida: Relógio do jogo, clima atual, medidor de população ativa e dinheiro circulante.
  * Painel lateral de Live Feed: Notificações elegantes com ícones animados de presentes, comentários de comando e novos moradores.
  * Widget de Top Moradores / Apoiadores.
* **Modo OBS (`?mode=stream` ou botão no topo):**
  * Oculta qualquer painel de controle ou botão de debug.
  * Formato responsivo com suporte a resolução vertical padrão TikTok (1080x1920) ou horizontal (1920x1080).
* **Painel de Desenvolvimento / Admin (`?mode=dev`):**
  * Monitor de telemetria: FPS em tempo real, total de NPCs ativos, total de carros, tamanho da fila de eventos.
  * Botões de disparo instantâneo: `/meteor`, `/police`, `/rain`, `/storm`, `/clear`, `/zombie`, `/race`, `/blackout`.

---

## 4. Otimização e Estabilidade 24/7

1. **Object Pooling:** Partículas de clima, projéteis e meshes descartáveis utilizam pools pré-alocados para evitar garbage collection spikes.
2. **Geometrias e Materiais Compartilhados:** Prédios, carros e postes compartilham materiais e geometrias base via instâncias ou cópias de baixo overhead de memória.
3. **Limite de Entidades Ativas:** Limite máximo estrito de NPCs simultâneos em tela (ajustável entre 20 e 100 de acordo com o preset de desempenho) e veículos (entre 8 e 25).
4. **Reconexão Resiliente:** Se o WebSocket ou a conexão do TikTok cair, o sistema entra em loop de retry exponencial sem travar a renderização visual.

---

## 5. Estratégia de Teste e Validação

1. **Testes do Banco de Dados:** Inicialização do schema SQLite, inserção e consulta de espectadores e NPCs, persistência entre reinicializações.
2. **Testes do Backend & WebSocket:** Comunicação bidirecional de eventos, dispatch do Event Director e processamento de fila.
3. **Validação Gráfica e de Performance:** Inicialização do Three.js, compilação de shaders sem avisos, estabilidade de FPS acima de 60 FPS, teste de memória contínua.
4. **Validação dos Eventos da Live:** Disparo de eventos simulados (Like, Follow, Comentário, Gift Rose, Gift Galaxy/Meteoro) e verificação do comportamento visual, sonoro e de câmera.
