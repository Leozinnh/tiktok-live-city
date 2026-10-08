# 📘 DOCUMENTAÇÃO TÉCNICA E GUIA DE CUSTOMIZAÇÃO - NPC WORLD

Bem-vindo à documentação oficial do **NPC WORLD**. Este documento foi criado para que você possa entender em profundidade o funcionamento de cada módulo, personalizar regras, adicionar novos eventos, modificar a cidade ou expandir o sistema quando desejar.

---

## 📑 Índice

1. [Visão Geral da Arquitetura](#1-visão-geral-da-arquitetura)
2. [Estrutura de Pastas e Arquivos](#2-estrutura-de-pastas-e-arquivos)
3. [Como Customizar Presentes (Gifts) e Comandos de Chat](#3-como-customizar-presentes-gifts-e-comandos-de-chat)
4. [Configurações do Jogo (Gráficos, Economia, Dia/Noite)](#4-configurações-do-jogo-gráficos-economia-dianoite)
5. [Como Funciona o Mundo 3D e a Grande Metrópole](#5-como-funciona-o-mundo-3d-e-a-grande-metrópole)
6. [Como Adicionar ou Alterar Prédios e Avenidas](#6-como-adicionar-ou-alterar-prédios-e-avenidas)
7. [Sistema de NPCs, Rotinas e Moradores da LIVE](#7-sistema-de-npcs-rotinas-e-moradores-da-live)
8. [Sistema de Veículos, Semáforos e Atropelamento](#8-sistema-de-veículos-semáforos-e-atropelamento)
9. [Event Director e Criação de Novos Eventos em Cadeia](#9-event-director-e-criação-de-novos-eventos-em-cadeia)
10. [Eventos Épicos (Meteoro, Galáxia, Corrida, Festival, Apagão)](#10-eventos-épicos-meteoro-galáxia-corrida-festival-apagão)
11. [Diretor de Câmeras Dinâmicas](#11-diretor-de-câmeras-dinâmicas)
12. [Engine de Áudio Procedural com Compressor de Estúdio](#12-engine-de-áudio-procedural-com-compressor-de-estúdio)
13. [Banco de Dados SQLite Local](#13-banco-de-dados-sqlite-local)
14. [Integração TikTok LIVE (Real vs Simulador)](#14-integração-tiktok-live-real-vs-simulador)
15. [Configuração no OBS Studio para Transmissão](#15-configuração-no-obs-studio-para-transmissão)
16. [Painel Admin / Dev e Teclas de Atalho](#16-painel-admin--dev-e-teclas-de-atalho)
17. [Comandos de Teste e Build](#17-comandos-de-teste-e-build)

---

## 1. Visão Geral da Arquitetura

O sistema é dividido em três camadas desacopladas que trabalham em tempo real:

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
│  - Ingestor TikTok / Simulador Mock                    │
│  - Event Director (Orquestrador de ritmo da LIVE)      │
│  - Banco SQLite Nativo (Persistência de moradores)     │
│  - Servidor Express + WebSocket Hub (Porta 3000)       │
└──────────────────────────┬─────────────────────────────┘
                           │ WebSocket JSON (Porta 3000)
                           ▼
┌────────────────────────────────────────────────────────┐
│               FRONTEND 3D ENGINE (Three.js / Vite)     │
│                                                        │
│  - Renderizador PBR com Bloom e Sombras Suaves         │
│  - Grande Metrópole 300x300m com 9 Setores Urbanos     │
│  - Simulação de Trânsito com Semáforos e Atropelamento │
│  - Ciclo Dia/Noite 24h e Clima Dinâmico                │
│  - Diretor de Câmeras Inteligentes                     │
│  - Web Audio API com Compressor de Estúdio             │
│  - HUD Glassmorphism e Painel Dev (Porta 5173)         │
└──────────────────────────┬─────────────────────────────┘
                           │
                           ▼
┌────────────────────────────────────────────────────────┐
│               OBS STUDIO (Browser Source / Janela)     │
│       Transmissão contínua em 60 FPS (9:16 ou 16:9)    │
└────────────────────────────────────────────────────────┘
```

---

## 2. Estrutura de Pastas e Arquivos

* `start.bat`: Script em 1 clique para iniciar servidor backend, engine frontend e abrir o navegador automaticamente no Windows.
* `runner.js`: Orquestrador Node.js que executa backend e frontend em simultâneo com `npm run dev`.
* `package.json`: Scripts do projeto e dependências instaladas (`express`, `ws`, `three`, `vite`).
* `.gitignore`: Exclusão da pasta `node_modules/`.
* `config/`
  * `events.json`: **Principal arquivo de configuração de presentes e comandos.** Mapeia cada presente do TikTok e palavra-chave do chat para uma ação no mundo 3D.
  * `game_config.json`: Presets gráficos (Low, Medium, High, Ultra), velocidade do ciclo dia/noite e parâmetros da economia.
* `server/`
  * `index.js`: Ponto de entrada do backend. Inicia o Express, WebSocket, SQLite, Event Director e conector TikTok.
  * `db/database.js`: Camada de acesso a dados usando SQLite nativo (`node:sqlite DatabaseSync`).
  * `db/schema.sql`: Definição das tabelas SQL (`viewers`, `npcs`, `events_history`, `city_economy`).
  * `tiktok/sanitizer.js`: Validador de dados que protege contra injeções, emojis corrompidos ou strings gigantescas.
  * `tiktok/mock_feeder.js`: Gerador automático de eventos simulados para testes locais sem live ativa.
  * `tiktok/connector.js`: Conector resiliente com o TikTok LIVE com reconexão automática e fallback de proteção.
  * `director/chain_events.js`: Máquina de eventos em cadeia (ex: Roubo → Perseguição → Acidente → Ambulância).
  * `director/event_director.js`: Algoritmo que monitora a tensão da cidade e garante que a transmissão nunca fique parada.
  * `websocket/ws_hub.js`: Gerenciador de conexões WebSocket com broadcast bidirecional e heartbeat.
* `client/`
  * `index.html`: Layout da página com o contêiner 3D e elementos da interface HUD Glassmorphism.
  * `vite.config.js`: Configuração do empacotador Vite com proxy HTTP/WS.
  * `src/main.js`: **Loop principal da engine gráfica 3D** (orquestra o `requestAnimationFrame`, atualiza entidades e renderiza).
  * `src/core/engine.js`: Criação do `WebGLRenderer`, câmera perspectiva, sombras suaves e tone mapping ACESFilmic.
  * `src/core/composer.js`: Pipeline de pós-processamento com `UnrealBloomPass` para brilho de luzes e sirenes.
  * `src/core/time.js`: Controle de tempo delta com proteção contra travamentos de aba.
  * `src/world/city_builder.js`: Monta a malha viária metropolitana de 300x300m, quarteirões e posiciona os edifícios e mobiliário.
  * `src/world/buildings.js`: Gerador procedural 3D de edifícios (Arranha-céus com néon, Banco, Hospital, Delegacia, Posto, Restaurante, Shopping, Sobrados).
  * `src/world/props.js`: Gerador de postes de luz iluminados, semáforos, árvores, bancos e chafariz.
  * `src/world/environment.js`: Ciclo de 24 horas (Sol, Lua, iluminação noturna urbana e acendimento de janelas).
  * `src/world/weather.js`: Clima dinâmico (chuva em particle pooling, tempestade com relâmpagos e neblina).
  * `src/world/epic_events.js`: Roteiro visual dos eventos lendários (Meteoro com câmera dinâmica, Galáxia com portal estelar e gravidade zero, Corrida, Festival e Apagão).
  * `src/entities/vehicle.js`: Modelo e movimentação física dos carros civis, viaturas policiais e ambulâncias com parada em semáforos e detecção frontal de colisão.
  * `src/entities/vehicle_manager.js`: Gerenciador da frota viária, semáforos, perseguições ativas e colisões com pedestres.
  * `src/entities/npc.js`: Modelo de personagem 3D articulado com caminhada procedural, pausas nas esquinas, animação sentada e ragdoll/queda ao chão em atropelamentos.
  * `src/entities/npc_manager.js`: Gerenciador da população de pedestres e moradores da LIVE.
  * `src/simulation/npc_ai.js`: Máquina de estados FSM das necessidades e rotinas (trabalho, almoço, sono, lazer e fuga).
  * `src/simulation/pathfinding.js`: Grafo de waypoints perimetrais para calçadas e faixas de trânsito.
  * `src/camera/camera_director.js`: Sistema de câmeras dinâmicas com interpolação suave (Lerp).
  * `src/audio/sound_engine.js`: Sintetizador sonoro procedural via Web Audio API com compressor de estúdio e desligamento limpo de sirenes.
  * `src/ui/hud.js`: Interface moderna da LIVE (feed de presentes, ranking e métricas da cidade).
  * `src/ui/dev_panel.js`: Painel administrativo com botões de disparo de eventos e chat de teste (`F2`).
  * `src/network/ws_client.js`: Cliente WebSocket no frontend com reconexão exponencial automática.

---

## 3. Como Customizar Presentes (Gifts) e Comandos de Chat

Todas as regras de presentes e comandos de chat estão concentradas em:  
`config/events.json`

### Adicionando ou Modificando um Presente:
```json
"gifts": {
  "Rose": {
    "action": "spawn_resident",
    "tier": "common",
    "value": 1,
    "description": "Gera um novo morador ou bonifica morador existente"
  },
  "Galaxy": {
    "action": "galaxy_cosmic",
    "tier": "legendary",
    "value": 10000,
    "description": "Vórtice Cósmico Galáctico e Gravidade Zero"
  }
}
```

* **Nome da Chave:** Deve coincidir com o nome do presente no TikTok (ex: `"Rose"`, `"Galaxy"`, `"Cap"`, `"Doughnut"`).
* **`action`:** Ação disparada no jogo:
  * `"spawn_resident"`: Cria um cidadão 3D com o nome do doador ou dá bônus em dinheiro se ele já existir.
  * `"galaxy_cosmic"`: Abre o portal estelar cósmico 3D no céu, ativa gravidade zero e chuva de poeira estelar.
  * `"meteor_strike"`: Dispara o meteoro em chamas com sirene de alerta militar e impacto no asfalto.
  * `"spawn_police"`: Despacha viatura policial com sirene e giroflex ligados.
  * `"spawn_ambulance"`: Despacha ambulância de emergência.
  * `"weather_rain"`: Ativa chuva na cidade.
  * `"weather_storm"`: Ativa tempestade com trovões e relâmpagos.
  * `"weather_clear"`: Volta o clima para ensolarado.
  * `"city_festival"`: Ativa festival metropolitano com queima coreografada de 14 fogos de artifício na praça.
  * `"city_blackout"`: Apaga as luzes da cidade temporariamente.
  * `"illegal_race"`: Inicia corrida clandestina com perseguição policial.
  * `"bank_robbery"`: Dispara alarme de roubo ao banco.
* **`tier`:** Nível de raridade (`"common"`, `"uncommon"`, `"rare"`, `"legendary"`). Determina o estilo do cartão no feed.

### Comandos de Chat:
No mesmo arquivo `config/events.json`, na seção `"commands"`:
```json
"commands": {
  "chuva": "weather_rain",
  "tempestade": "weather_storm",
  "sol": "weather_clear",
  "policia": "spawn_police",
  "corrida": "illegal_race",
  "festa": "city_festival",
  "meteoro": "meteor_strike",
  "galaxia": "galaxy_cosmic",
  "rosa": "spawn_resident",
  "flor": "spawn_resident"
}
```

---

## 4. Configurações do Jogo (Gráficos, Economia, Dia/Noite)

O arquivo `config/game_config.json` controla os parâmetros de desempenho e simulação:

```json
{
  "simulation": {
    "dayNightCycleMinutes": 12,
    "initialHour": 12.0,
    "eventDirectorIntervalSeconds": 180,
    "eventDirectorMinCalmSeconds": 120,
    "economy": {
      "baseSalary": 50,
      "foodCost": 15,
      "initialResidentCash": 250
    }
  },
  "graphics": {
    "defaultPreset": "HIGH",
    "presets": {
      "HIGH": {
        "maxNPCs": 60,
        "maxVehicles": 18,
        "shadows": true,
        "bloom": true
      }
    }
  }
}
```

---

## 5. Como Funciona o Mundo 3D e a Grande Metrópole

A cidade foi projetada com escala metropolitana de **300 x 300 metros**, organizada em 9 setores integrados:

1. **Setor Noroeste (Centro Financeiro):** Grandes arranha-céus corporativos com a **Torre Metropolitan (52 metros de altura)**, espigão iluminado, barbatanas verticais em neon ciano e a agência clássica do **Banco Central NPC** com colunas e acabamento dourado.
2. **Setor Norte (Shopping Plaza):** Shopping center moderno com marquise de vidro e **outdoor eletrônico luminoso**.
3. **Setor Nordeste (Condomínios & Brownstones):** Fileira de sobrados residenciais e torres envidraçadas.
4. **Setor Oeste (Complexo Cívico):** Delegacia de polícia e Hospital Geral com heliponto e luzes de emergência.
5. **Setor Centro (Grand Central Park):** Praça 4x maior com chafariz de pedra, alamedas de paralelepípedo, 16 árvores volumétricas e bancos.
6. **Setor Sul (Boulevard Gastronômico):** Restaurantes, bistrô com mesas ao ar livre e toldos listrados.
7. **Setor Sudeste (Posto e Serviços):** Posto de combustível com 4 bombas, letreiro neon e loja de conveniência.
8. **Setor Leste (Torres Skyline):** Edifícios residenciais de 38 a 44 metros de altura.
9. **Horizonte Distante (X = ±92):** Arranha-céus ao longe compondo o skyline urbano em 360 graus.

* **Iluminação PBR e Noite Urbana:**
  * O ciclo dia/noite nunca deixa a tela preta: a noite adota uma estética **cyberpunk urbana**, com céu em azul índigo profundo (`#0f172a`), luz ambiente ciano `0.45` e luar azulado `0.75`.
  * Os postes de rua e as janelas dos edifícios acendem automaticamente ao anoitecer.
  * Pós-processamento `UnrealBloomPass` confere brilho incandescente a lâmpadas, letreiros e sirenes.

---

## 6. Como Adicionar ou Alterar Prédios e Avenidas

Os edifícios são criados em `client/src/world/buildings.js` e posicionados em `client/src/world/city_builder.js`.

### Exemplo de Criação de um Novo Prédio em `buildings.js`:
```javascript
createCustomBuilding(x, z) {
  const group = new THREE.Group();
  group.position.set(x, 0, z);

  const geo = new THREE.BoxGeometry(16, 22, 16);
  const mat = new THREE.MeshStandardMaterial({ color: 0x2563eb, roughness: 0.6 });
  const mesh = new THREE.Mesh(geo, mat);
  mesh.position.y = 11;
  mesh.castShadow = true;
  group.add(mesh);

  const winMat = this.createWindowMaterial(0xffe099, 0.8);
  const winMesh = new THREE.Mesh(new THREE.BoxGeometry(16.2, 1.2, 12), winMat);
  winMesh.position.y = 9;
  group.add(winMesh);

  return {
    group,
    id: 'meu_predio',
    name: 'Edifício Comercial',
    type: 'shop',
    entrance: new THREE.Vector3(x, 0, z + 9),
    windowMaterials: [winMat]
  };
}
```

---

## 7. Sistema de NPCs, Rotinas e Moradores da LIVE

### O que compõe um NPC (`client/src/entities/npc.js`):
* Personagem 3D articulado com membros móveis e animação procedural de passos.
* Velocidade de caminhada calibrada para o ritmo humano real (1,6 m/s).
* **Navegação em Calçadas Perimetrais:** O NPC segue strictly as calçadas contornando os quarteirões, sem nunca atravessar através das paredes dos edifícios.
* **Pausas Naturais:** Ao chegar nas esquinas, o pedestre tem 25% de chance de fazer uma pausa de 2 a 4 segundos observando a rua ou o celular antes de prosseguir.
* **Bancos da Praça:** Quando no parque, senta nos bancos com as pernas dobradas a 90°.
* **Moradores da LIVE:** Ao receber o evento `spawn_resident` de um seguidor (`@usuario`), nasce um cidadão com **crachá 3D flutuante** exibindo nome, profissão e saldo. A câmera dá um close nele suavemente por 8 segundos.

---

## 8. Sistema de Veículos, Semáforos e Atropelamento

Localizado em `client/src/entities/vehicle.js` e `vehicle_manager.js`:

* **Tipos de Veículo:**
  * **Civis:** Sedans e compactos em cores variadas cruzando a 7,5 m/s.
  * **Esportivos:** Chassi rebaixado para corridas de alta velocidade (até 26 m/s / 95 km/h).
  * **Viaturas de Polícia:** Barra luminosa no teto alternando luzes azul/vermelha e sirene de alta fidelidade.
  * **Ambulâncias:** Furgão médico de emergência com giroflex.
* **Semáforos Reais:**
  * Os carros civis freiam suavemente e param antes da faixa branca quando o semáforo central está vermelho ou amarelo.
* **Distância de Segurança Frontal:**
  * Carros monitoram veículos à frente na mesma faixa; se a distância for inferior a 8,5 metros, desaceleram e param atrás, evitando empilhamentos.
* **Atropelamento Físico com Ragdoll:**
  * Se um carro em velocidade (> 5 m/s) colidir com um pedestre a menos de 2,5 metros:
    * O pedestre é arremessado 2,8 metros para trás na direção do impacto.
    * Cai estirado de costas no asfalto (`state = 'KNOCKED_DOWN'`).
    * Sons de pneu cantando (`tire screech`) e buzina tocam na hora.
    * Uma **ambulância é despachada automaticamente** para o socorro.
    * O cidadão fica no chão por 8 segundos, levanta-se suavemente e volta a caminhar.

---

## 9. Event Director e Criação de Novos Eventos em Cadeia

O orquestrador autônomo está em `server/director/`:

* Monitora o tempo ocioso da transmissão. Se ninguém interagir durante `minCalmSeconds`, escolhe um evento autônomo baseado na tabela de probabilidades.
* **Cadeia Reativa Típica:**
  1. `BANK_ROBBERY` (Alarme toca no banco central).
  2. `POLICE_CHASE` (Viatura mais próxima é despachada em código 3).
  3. `VEHICLE_CRASH` (Batida com faíscas).
  4. `AMBULANCE_DISPATCH` (Ambulância socorre acidentados).
  5. `ARREST_MADE` (Criminoso é detido).

---

## 10. Eventos Épicos (Meteoro, Galáxia, Corrida, Festival, Apagão)

Localizado em `client/src/world/epic_events.js`:

* ☄️ **Meteoro (Desastre):**
  * Céu vermelho de guerra (`#581c87`), sirene militar estridente.
  * Rocha de 5,5m envolta em labaredas de 7,2m com PointLight de 140m.
  * **Câmera de ângulo baixo rastreando a bola de fogo em tempo real desde o topo do céu até o solo.**
  * Impacto com tremor de tela (screen shake), cratera incandescente e pedestres correndo em pânico.
* 🌌 **Galáxia (Fenômeno Cósmico):**
  * Céu azul índigo e violeta (`#0f051d`).
  * **Vórtice estelar 3D no céu de 32 metros** com 3 anéis concêntricos giratórios em ciano, magenta e ouro.
  * Áudio com frequências cósmicas harmônicas (432 Hz, 528 Hz, 639 Hz, 852 Hz).
  * **Gravidade zero:** pedestres levitam de 3 a 6 metros no ar.
  * Chuva de poeira estelar cintilante e bônus na economia.
* 🏎️ **Corrida Clandestina:**
  * Grid de largada lado a lado na avenida central (-52, 0, 2.0 e 5.0).
  * Arrancada com som de pneu cantando (tire screech), velocidade de 95 km/h.
  * **Viatura policial com I.A de perseguição no asfalto colada na traseira dos carros** e câmera Chase Cam.
* 🎆 **Festival Metropolitano:**
  * Show coreografado de **14 foguetes multicoloridos** com som de assobio de lançamento e explosão de estrondo com estalos.
  * Iluminação dinâmica que reflete nos prédios na cor exata de cada foguete.
* 💡 **Apagão Geral:**
  * Pane na subestação elétrica apagando postes e janelas temporariamente com sirene de alerta.

---

## 11. Diretor de Câmeras Dinâmicas

Localizado em `client/src/camera/camera_director.js`:

* `ORBITAL`: Órbita ampla de 115 metros ao redor do centro da metrópole, visitando os 9 setores automaticamente.
* `CHASE`: Câmera baixa e dinâmica atrás de veículos em perseguição.
* `FOLLOW_NPC`: Câmera em terceira pessoa acompanhando moradores da LIVE.
* `CINEMATIC_EVENT`: Ângulos dramáticos com rastreamento em tempo real.

---

## 12. Engine de Áudio Procedural com Compressor de Estúdio

Localizado em `client/src/audio/sound_engine.js`:

* Todo o áudio é sintetizado nativamente usando a **Web Audio API**.
* **Compressor de Estúdio (`DynamicsCompressorNode`):** Impede distorções sonoras e equilibra o volume master para nunca sobrepor a voz do streamer.
* **Controle Limpo:** `stopAllSirens()` desliga imediatamente qualquer sirene quando o evento termina, eliminando barulho residual.
* Efeitos sintetizados: Sirene policial wail de frequência dupla, assobio de lançamento de fogos, explosão sub-grave de fogos com estalo, pneu cantando, chuva e vento via ruído branco filtrado, explosão profunda de impacto e arpeggio de notificação para presentes.

---

## 13. Banco de Dados SQLite Local

Localizado em `server/db/database.js`:

* Utiliza o driver integrado de alta performance `node:sqlite DatabaseSync`.
* Arquivo persistente salvo em: `database/npc_world.sqlite`.
* Tabelas:
  * `viewers`: Usuários da LIVE, contagem de likes, total de presentes e status de seguidor.
  * `npcs`: Moradores permanentes, profissão, saldo monetário, casa e trabalho.
  * `events_history`: Histórico de eventos ocorridos para ranking e métricas.
  * `city_economy`: Dinheiro circulante e população.

---

## 14. Integração TikTok LIVE (Real vs Simulador)

### Modo Simulador Mock (Padrão para Testes):
Ao iniciar o projeto, o **Mock Feeder** fica ativo gerando periodicamente likes, novos moradores, comentários e presentes em intervalo equilibrado de 8 segundos.

### Conectando na sua LIVE Real do TikTok:
1. Abra sua transmissão ao vivo no aplicativo do TikTok.
2. Envie uma requisição POST com seu `@usuario`:
   ```bash
   curl -X POST http://localhost:3000/api/tiktok/connect -H "Content-Type: application/json" -d "{\"username\": \"@seu_usuario_do_tiktok\"}"
   ```
3. Se o canal estiver offline, o sistema ativa a proteção mock automaticamente para nunca congelar a live.

---

## 15. Configuração no OBS Studio para Transmissão

1. No OBS Studio, adicione uma fonte **Navegador (Browser Source)**.
2. Configure a URL e a resolução:

### Formato Vertical Padrão TikTok LIVE (9:16):
* **URL:** `http://localhost:5173?mode=stream&format=vertical`
* **Largura:** `1080`
* **Altura:** `1920`
* **Taxa de Quadros (FPS):** `60`

### Formato Horizontal Widescreen (16:9):
* **URL:** `http://localhost:5173?mode=stream`
* **Largura:** `1920`
* **Altura:** `1080`
* **Taxa de Quadros (FPS):** `60`

> O parâmetro `?mode=stream` ativa o **Modo OBS Limpo**, ocultando barras de rolagem, botões de teste e menus de debug para uma captura 100% limpa.

---

## 16. Painel Admin / Dev e Teclas de Atalho

Pressione **`F2`** no teclado com o jogo aberto no navegador para acessar o painel:

* **🌹 Rosa (Flor):** Cria/bonifica morador com crachá 3D e foca a câmera nele.
* **🌌 Galáxia:** Abre o portal cósmico no céu com gravidade zero e levitação dos cidadãos.
* **☄️ Meteoro:** Dispara o meteoro em chamas com câmera rastreando a queda e impacto explosivo.
* **🚨 Polícia:** Despacha viatura policial com sirene e giroflex estroboscópico.
* **🌧️ Chuva / ⛈️ Tempestade:** Altera o clima dinâmico com chuva e relâmpagos.
* **🏎️ Corrida:** Arrancada de dois esportivos na avenida com perseguição policial.
* **🎆 Festival:** Show coreografado de 14 fogos de artifício com iluminação dinâmica.
* **💡 Apagão:** Corta a eletricidade da cidade temporariamente.
* **👤 Morador:** Gera um novo morador da live com crachá suspenso.
* **❤️ +50 Likes:** Envia rajada de 50 curtidas na transmissão.
* **☀️/🌙 Dia/Noite:** Alterna instantaneamente entre Dia ensolarado (12:00) e Noite iluminada (21:00).
* **Caixa de Chat Teste:** Digite comandos como `rosa`, `flor`, `policia`, `chuva`, `meteoro`, `galaxia`, `festa`, `corrida` para simular o chat da live.

---

## 17. Comandos de Teste e Build

* **Executar a suíte de 35 testes automatizados:**
  ```bash
  npm test
  ```
* **Executar build de produção do frontend:**
  ```bash
  npm run build
  ```
* **Iniciar backend e frontend em comando único:**
  ```bash
  npm run dev
  ```

---

*NPC WORLD — Desenvolvido para transformar transmissões ao vivo em experiências visuais memoráveis e altamente interativas.*
