# 📘 DOCUMENTAÇÃO TÉCNICA E GUIA DE CUSTOMIZAÇÃO - NPC WORLD

Bem-vindo à documentação oficial do **NPC WORLD**. Este documento foi criado para que você possa entender em profundidade o funcionamento de cada módulo, personalizar regras, adicionar novos eventos, modificar a cidade ou expandir o sistema quando desejar.

---

## 📑 Índice

1. [Visão Geral da Arquitetura](#1-visão-geral-da-arquitetura)
2. [Estrutura de Pastas e Arquivos](#2-estrutura-de-pastas-e-arquivos)
3. [Como Customizar Presentes (Gifts) e Comandos de Chat](#3-como-customizar-presentes-gifts-e-comandos-de-chat)
4. [Configurações do Jogo (Gráficos, Economia, Dia/Noite)](#4-configurações-do-jogo-gráficos-economia-dianoite)
5. [Como Funciona o Mundo 3D (Three.js PBR)](#5-como-funciona-o-mundo-3d-threejs-pbr)
6. [Como Adicionar ou Alterar Prédios e Ruas](#6-como-adicionar-ou-alterar-prédios-e-ruas)
7. [Sistema de NPCs, Rotinas e Moradores da LIVE](#7-sistema-de-npcs-rotinas-e-moradores-da-live)
8. [Sistema de Veículos e Trânsito Inteligente](#8-sistema-de-veículos-e-trânsito-inteligente)
9. [Event Director e Criação de Novos Eventos em Cadeia](#9-event-director-e-criação-de-novos-eventos-em-cadeia)
10. [Eventos Épicos (Meteoro, Corrida, Festival, Apagão)](#10-eventos-épicos-meteoro-corrida-festival-apagão)
11. [Diretor de Câmeras Dinâmicas](#11-diretor-de-câmeras-dinâmicas)
12. [Engine de Áudio Procedural (Web Audio API)](#12-engine-de-áudio-procedural-web-audio-api)
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
│  - Simulação de Trânsito e Pedestres em Waypoints      │
│  - Ciclo Dia/Noite 24h e Clima Dinâmico                │
│  - Diretor de Câmeras Inteligentes                     │
│  - Web Audio API (Efeitos Sonoros Procedurais)         │
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
* `package.json`: Scripts do projeto e dependências instaladas (`express`, `ws`, `three`, `vite`).
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
  * `websocket/ws_hub.js`: Gerenciador de conexões WebSocket com heartbeat (ping/pong) para estabilidade 24/7.
* `client/`
  * `index.html`: Layout da página com o contêiner 3D e elementos da interface HUD Glassmorphism.
  * `vite.config.js`: Configuração do empacotador Vite.
  * `src/main.js`: **Loop principal da engine gráfica 3D** (orquestra o `requestAnimationFrame`, atualiza entidades e renderiza).
  * `src/core/engine.js`: Criação do `WebGLRenderer`, câmera perspectiva, sombras suaves e tone mapping ACESFilmic.
  * `src/core/composer.js`: Pipeline de pós-processamento com `UnrealBloomPass` para brilho de luzes e sirenes.
  * `src/core/time.js`: Controle de tempo delta com proteção contra travamentos de aba.
  * `src/world/city_builder.js`: Monta a malha viária, quarteirões e posiciona os edifícios e mobiliário.
  * `src/world/buildings.js`: Gerador procedural 3D de edifícios (Banco, Hospital, Delegacia, Posto, Restaurante, Torres).
  * `src/world/props.js`: Gerador de postes de luz iluminados, semáforos, árvores, bancos e chafariz.
  * `src/world/environment.js`: Ciclo de 24 horas (Sol, Lua, iluminação de céu e acendimento de janelas à noite).
  * `src/world/weather.js`: Clima dinâmico (chuva em particle pooling, tempestade com relâmpagos e neblina).
  * `src/world/epic_events.js`: Roteiro visual dos eventos lendários (queda de meteoro, corrida, festival e apagão).
  * `src/entities/vehicle.js`: Modelo e movimentação física dos carros civis, viaturas policiais e ambulâncias.
  * `src/entities/vehicle_manager.js`: Gerenciador da frota viária, semáforos e despacho de perseguições.
  * `src/entities/npc.js`: Modelo de personagem 3D articulado com caminhada procedural e crachá 3D de seguidor.
  * `src/entities/npc_manager.js`: Gerenciador da população de pedestres e moradores da LIVE.
  * `src/simulation/npc_ai.js`: Máquina de estados FSM das necessidades e rotinas (trabalho, almoço, sono, fuga).
  * `src/simulation/pathfinding.js`: Grafo de waypoints para navegação de pistas e calçadas.
  * `src/camera/camera_director.js`: Sistema de câmeras dinâmicas com interpolação suave (Lerp).
  * `src/audio/sound_engine.js`: Sintetizador sonoro procedural via Web Audio API.
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
    "action": "meteor_strike",
    "tier": "legendary",
    "value": 10000,
    "description": "Queda cinematográfica de meteoro na cidade"
  }
}
```

* **Nome da Chave:** Deve coincidir com o nome do presente no TikTok (ex: `"Rose"`, `"Galaxy"`, `"Cap"`, `"Doughnut"`).
* **`action`:** Ação disparada no jogo. As ações suportadas nativamente incluem:
  * `"spawn_resident"`: Cria um cidadão 3D com o nome do doador ou dá bônus em dinheiro se ele já existir.
  * `"meteor_strike"`: Dispara a queda cinematográfica de meteoro com sirene e pânico.
  * `"spawn_police"`: Despacha viatura policial com sirene e giroflex ligados.
  * `"spawn_ambulance"`: Despacha ambulância de emergência.
  * `"weather_rain"`: Ativa chuva na cidade.
  * `"weather_storm"`: Ativa tempestade com trovões e relâmpagos.
  * `"weather_clear"`: Volta o clima para ensolarado.
  * `"city_festival"`: Ativa festival com queima de fogos na praça central.
  * `"city_blackout"`: Apaga as luzes da cidade temporariamente.
  * `"illegal_race"`: Inicia corrida clandestina com perseguição policial.
  * `"bank_robbery"`: Dispara alarme de roubo ao banco.
  * `"economy_boom"`: Distribui dinheiro para todos os moradores da cidade.
* **`tier`:** Nível de raridade (`"common"`, `"uncommon"`, `"rare"`, `"legendary"`). Determina o estilo do cartão no feed (ex: cartões lendários têm borda em chamas vermelhas brilhantes).

### Adicionando Novos Comandos de Chat:
No mesmo arquivo `config/events.json`, na seção `"commands"`:
```json
"commands": {
  "chuva": "weather_rain",
  "policia": "spawn_police",
  "corrida": "illegal_race",
  "meu_comando": "city_festival"
}
```
Basta associar a palavra-chave que os espectadores digitarão no chat à ação desejada.

---

## 4. Configurações do Jogo (Gráficos, Economia, Dia/Noite)

O arquivo `config/game_config.json` controla os parâmetros de desempenho e simulação:

```json
{
  "simulation": {
    "dayNightCycleMinutes": 12,
    "initialHour": 9.5,
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

* **`dayNightCycleMinutes`:** Duração em minutos reais de 1 dia completo de 24 horas no jogo (padrão: 12 minutos).
* **`eventDirectorMinCalmSeconds`:** Quantos segundos a live pode ficar calma sem interação antes que a cidade gere um evento dramático autônomo (padrão: 120 segundos).
* **`maxNPCs` e `maxVehicles`:** Quantidade máxima simultânea de entidades na tela.

---

## 5. Como Funciona o Mundo 3D (Three.js PBR)

A renderização acontece no arquivo `client/src/core/engine.js` e `client/src/main.js`:

* **Iluminação:**
  * O Sol/Lua é uma `THREE.DirectionalLight` que se move em órbita de 360° ao redor da cidade no arquivo `client/src/world/environment.js`.
  * As sombras são processadas por `THREE.PCFSoftShadowMap` com bias suave para evitar artefatos de "shadow acne".
  * Uma `THREE.HemisphereLight` fornece luz indireta do céu e do chão, garantindo que áreas sob a sombra mantenham cores ricas e visíveis.
* **Pós-processamento (`client/src/core/composer.js`):**
  * O `EffectComposer` processa o `UnrealBloomPass`.
  * Qualquer material no Three.js com `emissiveIntensity > 1.0` automaticamente ganha um halo de brilho suave (usado nos postes, neons de lojas e sirenes).

---

## 6. Como Adicionar ou Alterar Prédios e Ruas

Os edifícios são criados em `client/src/world/buildings.js` e posicionados em `client/src/world/city_builder.js`.

### Exemplo de Criação de um Novo Prédio em `buildings.js`:
```javascript
createCustomBuilding(x, z) {
  const group = new THREE.Group();
  group.position.set(x, 0, z);

  // Corpo do edifício
  const geo = new THREE.BoxGeometry(16, 20, 16);
  const mat = new THREE.MeshStandardMaterial({ color: 0x2563eb, roughness: 0.6 });
  const mesh = new THREE.Mesh(geo, mat);
  mesh.position.y = 10;
  mesh.castShadow = true;
  group.add(mesh);

  // Janelas emissivas noturnas
  const winMat = this.createWindowMaterial(0xffe099, 0.8);
  const winGeo = new THREE.BoxGeometry(16.2, 1.2, 12);
  const winMesh = new THREE.Mesh(winGeo, winMat);
  winMesh.position.y = 8;
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

### Posicionamento em `city_builder.js`:
No método `buildCityBlocks()`, chame seu prédio e adicione ao grupo:
```javascript
const meuPredio = this.buildingBuilder.createCustomBuilding(35, -24);
this.cityGroup.add(meuPredio.group);
this.buildings.push(meuPredio);
```
O sistema cuidará automaticamente de registrar o prédio para que os NPCs possam trabalhar, fazer compras ou visitá-lo.

---

## 7. Sistema de NPCs, Rotinas e Moradores da LIVE

### O que compõe um NPC (`client/src/entities/npc.js`):
* Membros modulares articulados com pivôs nos ombros e quadris.
* Animação procedural calculada a cada quadro:
  $$\text{Ângulo de Balanço} = \sin(\text{animTimer}) \times 0.5$$
  Se estiver correndo de um meteoro (`FLEEING`), a frequência triplica.

### Máquina de Estados e Necessidades (`client/src/simulation/npc_ai.js`):
Cada NPC monitora quatro barras de necessidade:
1. **Fome (0-100):** Aumenta com o tempo. Acima de 80, o NPC caminha até o Bistrô ou Posto de Conveniência para comprar refeição e gasta dinheiro.
2. **Energia (0-100):** Diminui com o tempo. Abaixo de 20 ou durante a madrugada (22h às 06h), o NPC retorna à sua torre residencial para dormir.
3. **Humor (0-100):** Aumenta quando ele passeia pela Praça Central ou senta nos bancos.
4. **Dinheiro ($):** Aumenta durante o expediente de trabalho (08h às 17h).

### Moradores da LIVE:
Quando o evento `spawn_resident` é disparado por um seguidor (`@usuario`):
* O `NPCManager` cria um cidadão especial com **crachá suspenso 3D** (`THREE.Sprite`) gerado via Canvas dinâmico.
* O crachá exibe o `@nome_do_usuario`, a profissão atribuída e seu saldo bancário atual.
* A câmera cinematográfica suavemente dá um close em terceira pessoa no morador por 8 segundos para que o espectador se veja na live.

---

## 8. Sistema de Veículos e Trânsito Inteligente

Localizado em `client/src/entities/vehicle.js` e `vehicle_manager.js`:

* **Tipos de Veículo:**
  * **Civis:** Sedans e compactos em cores variadas.
  * **Esportivos:** Chassi rebaixado com velocidade de até 22 m/s.
  * **Viaturas de Polícia:** Barra luminosa policial no teto alternando luzes azul/vermelha em estroboscópio de 8 Hz com sirene auditiva.
  * **Ambulâncias:** Furgão médico de emergência com giroflex.
* **Navegação:**
  * Os carros seguem nós de trânsito em `client/src/simulation/pathfinding.js`.
  * Eles detectam a rotação correta com `Math.atan2(dx, dz)` e giram as rodas de acordo com a velocidade de deslocamento.
  * Param nos semáforos vermelhos no cruzamento central, a menos que estejam em modo de emergência policial/médico.

---

## 9. Event Director e Criação de Novos Eventos em Cadeia

O orquestrador autônomo está em `server/director/`:

* **Ciclo de Tensão do Event Director:**
  1. `CALM`: A cidade está em rotina normal.
  2. Se ninguém interagir durante `minCalmSeconds`, o diretor escolhe um evento autônomo baseado na tabela de probabilidades.
  3. Dispara a cadeia reativa.
  4. Entra em `COOLDOWN` para relaxar antes da próxima sequência.

### Criando uma Nova Cadeia em `server/director/chain_events.js`:
```javascript
minha_cadeia: [
  { event: 'alarme_incendio', delay: 0 },
  { event: 'viatura_despachada', delay: 2500 },
  { event: 'fogo_apagado', delay: 7000 }
]
```

---

## 10. Eventos Épicos (Meteoro, Corrida, Festival, Apagão)

Localizado em `client/src/world/epic_events.js`:

* **Queda de Meteoro (`triggerMeteorStrike`):**
  * Emite som de sirene da defesa civil.
  * Exibe banner no topo da tela.
  * Câmera sobe aos céus apontando para as coordenadas do meteoro.
  * Cria o mesh 3D da rocha espacial com casca de fogo translúcida descendo a 120m de altitude.
  * Ao atingir o solo: detona onda de choque expansiva (`THREE.RingGeometry`), cratera de impacto escura e dispersa todos os NPCs num raio de 60 metros em modo de pânico `FLEEING`.
  * Despacha automaticamente viaturas e ambulâncias para o local.

---

## 11. Diretor de Câmeras Dinâmicas

Localizado em `client/src/camera/camera_director.js`:

Possui 4 modos principais:
1. `ORBITAL`: Órbita lenta e cinematográfica ao redor do centro da cidade, mudando de ponto de vista a cada 28 segundos para cobrir a Praça Central, Banco e Hospital.
2. `CHASE`: Câmera baixa e dinâmica atrás de veículos em perseguição.
3. `FOLLOW_NPC`: Câmera em terceira pessoa acompanhando espectadores que viraram moradores.
4. `CINEMATIC_EVENT`: Ângulos verticais dramáticos pré-configurados para o meteoro ou roubo ao banco.

Todas as transições utilizam **interpolação linear esférica (Lerp)** para eliminar solavancos de câmera na transmissão.

---

## 12. Engine de Áudio Procedural (Web Audio API)

Localizado em `client/src/audio/sound_engine.js`:

* Todo o áudio é sintetizado nativamente usando a **Web Audio API** do navegador. Não há arquivos MP3 externos pesados ou links que quebrem.
* **Sirene Policial:** Dois osciladores de onda dente-de-serra modulados em frequência por um LFO a 1.8 Hz.
* **Chuva e Vento:** Buffer de ruído branco de 2 segundos em loop passado por filtro passa-baixas biquad.
* **Explosão do Meteoro:** Onda senoidal sub-grave com varredura exponencial de 130 Hz para 25 Hz somada a uma rajada de ruído filtrado.
* **Controle:**
  * `soundEngine.setMasterVolume(0.5)`
  * `soundEngine.mute(true)`

---

## 13. Banco de Dados SQLite Local

Localizado em `server/db/database.js`:

* Utiliza o driver de alta performance integrado ao Node.js (`node:sqlite DatabaseSync`).
* Arquivo persistente salvo em: `database/npc_world.sqlite`.
* Principais tabelas:
  * `viewers`: Registra cada usuário que interagiu, quantidade de likes, valor total de presentes doados e data de criação.
  * `npcs`: Armazena os atributos persistentes dos moradores (nome, cargo, dinheiro acumulado, casa e local de trabalho).
  * `events_history`: Histórico de eventos ocorridos para geração de estatísticas da LIVE.
  * `city_economy`: Dinheiro total circulante e população.

---

## 14. Integração TikTok LIVE (Real vs Simulador)

### Modo Simulador Mock (Padrão para Testes):
Quando você inicia o projeto, ele já vem com o **Mock Feeder** ativado. Ele gera periodicamente likes, seguidores, comentários com comandos e presentes para que a cidade se mova mesmo antes de você abrir sua live real.

### Conectando na sua LIVE Real do TikTok:
O conector está em `server/tiktok/connector.js`. Para conectar na sua live:
1. Abra sua transmissão ao vivo no aplicativo do TikTok.
2. No painel de dev (`F2`) ou via terminal, envie uma requisição:
   ```bash
   curl -X POST http://localhost:3000/api/tiktok/connect -H "Content-Type: application/json" -d "{\"username\": \"@seu_usuario_do_tiktok\"}"
   ```
3. O servidor se conecta ao chat da sua live. Se o canal estiver offline, o sistema ativa a proteção mock automaticamente para evitar interrupções.

---

## 15. Configuração no OBS Studio para Transmissão

1. No OBS Studio, clique em `+` na caixa de Fontes e escolha **Navegador (Browser Source)**.
2. Configure conforme o formato desejado:

### Opção A: Formato Vertical Padrão TikTok LIVE (9:16)
* **URL:** `http://localhost:5173?mode=stream&format=vertical`
* **Largura:** `1080`
* **Altura:** `1920`
* **Taxa de Quadros (FPS):** `60`

### Opção B: Formato Horizontal Widescreen (16:9)
* **URL:** `http://localhost:5173?mode=stream`
* **Largura:** `1920`
* **Altura:** `1080`
* **Taxa de Quadros (FPS):** `60`

> **Dica Importante:** O parâmetro `?mode=stream` ativa o **Modo OBS Limpo**, que desativa menus de desenvolvimento, barras de rolagem e botões de teste, exibindo apenas os gráficos 3D da cidade e o HUD Glassmorphism elegante.

---

## 16. Painel Admin / Dev e Teclas de Atalho

Durante o jogo no navegador, você tem controle total via teclado:

* **Tecla `F2`:** Abre ou fecha o **Painel Flutuante de Desenvolvimento**.
  * **Botões Rápidos:** Dispara instantaneamente `☄️ Meteoro`, `🚨 Polícia`, `🌧️ Chuva`, `⛈️ Tempestade`, `🏎️ Corrida`, `🎆 Festival`, `💡 Apagão` ou `👤 Novo Morador`.
  * **Caixa de Chat Teste:** Digite comandos como `policia`, `chuva`, `meteoro` para simular a reação da cidade aos comentários da transmissão.
* **Clique na tela:** Ativa a saída de áudio (devido à política de reprodução de áudio dos navegadores modernos, é necessário 1 clique inicial).

---

## 17. Comandos de Teste e Build

* **Executar a suíte completa de 35 testes automatizados:**
  ```bash
  npm test
  ```
* **Executar build de produção do frontend:**
  ```bash
  npm run build
  ```
* **Iniciar apenas o backend:**
  ```bash
  npm run server
  ```
* **Iniciar apenas o frontend:**
  ```bash
  npm run dev:client
  ```

---

*NPC WORLD — Desenvolvido para transformar transmissões ao vivo em experiências visuais memoráveis e altamente interativas.*
