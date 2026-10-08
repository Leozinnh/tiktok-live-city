# 🌆 NPC WORLD - Cidade 3D Interativa para TikTok LIVE

Uma simulação 3D viva, visualmente impressionante e com estética de jogo comercial, projetada especificamente para rodar como **máquina de entretenimento contínua (24/7)** em transmissões do TikTok LIVE via OBS Studio.

---

## 🌟 Principais Características

* **Gráficos 3D de Alto Padrão (Three.js PBR):**
  * Iluminação física com sombras suaves (`PCFSoftShadowMap`).
  * Pós-processamento cinematográfico com brilho noturno (`UnrealBloomPass`) e Tone Mapping (`ACESFilmicToneMapping`).
  * Ciclo Dia/Noite contínuo de 24 horas simuladas com acendimento automático de postes e janelas de edifícios ao anoitecer.
  * Clima dinâmico: Sol, Chuva (sistema de partículas em Object Pooling), Tempestade com relâmpagos estroboscópicos e trovões, e Neblina volumétrica.

* **Cidade Viva e Autônoma:**
  * Bairro central planejado: Banco Central, Hospital com heliponto, Delegacia de polícia, Posto com letreiro neon, Restaurante/Café e Praça Central arborizada com chafariz e bancos.
  * Trânsito inteligente de veículos: Sedans, esportivos, viaturas policiais com giroflex estroboscópico duplo (azul/vermelho) e ambulâncias.
  * NPCs articulados com animação procedural de passos e rotina diária real (trabalho, compras, alimentação no bistrô, lazer na praça e descanso em casa).

* **Interatividade com o TikTok LIVE:**
  * **Seguidores viram Moradores Permanentes:** Crachá 3D suspenso acima da cabeça exibindo `@usuario`, ocupação e dinheiro acumulado.
  * **Comentários de Comando:** `chuva`, `tempestade`, `sol`, `policia`, `ambulancia`, `corrida`, `festa`, `meteoro`, `apagao`.
  * **Presentes (Gifts) com Impacto no Mundo:**
    * 🌹 **Rose:** Gera novo morador ou bonifica morador existente.
    * 🍩 **Doughnut:** Abastece a economia e mercados da cidade.
    * 🧢 **Cap:** Despacha viatura policial extra em patrulha.
    * 🎊 **Confetti:** Inicia festival urbano com queima de fogos na praça central.
    * 🌌 **Galaxy:** Evento Lendário — Queda cinematográfica de meteoro cortando o céu com onda de choque, cratera e pânico coletivo!
    * 🦁 **Lion:** Apagão geral na cidade com sirenes de emergência da defesa civil.
  * **Likes da Transmissão:** Milestones numéricos aceleram a cidade e disparam eventos.

* **Diretor de Câmeras Inteligente:**
  * Câmera Panorâmica Orbital suave cobrindo os pontos turísticos.
  * *Chase Cam* dinâmica atrás de viaturas durante perseguições em alta velocidade.
  * *Follow Cam* acompanhando em terceira pessoa os moradores da LIVE.
  * *Cinematic Event Cam* para grandes acontecimentos (ex: ângulo olhando para as nuvens durante o meteoro).

* **Event Director (Autonomia 24/7):**
  * Se a LIVE estiver calma, o sistema orquestra acontecimentos autônomos seguindo um ritmo dramático:
    $$\text{Calmaria} \longrightarrow \text{Tensão} \longrightarrow \text{Ação / Perseguição} \longrightarrow \text{Clímax} \longrightarrow \text{Calmaria}$$

* **Áudio Procedural Nativo (Web Audio API):**
  * Síntese de sirene policial modulada, ruído de chuva contínua, explosão profunda de impacto, buzinas e alertas de presentes.

* **Banco de Dados Persistente (SQLite Nativo Node 24):**
  * Histórico de espectadores, dinheiro da cidade, moradores e ranking de apoiadores persistidos localmente em `database/npc_world.sqlite`.

---

## 🚀 Como Executar

### Pré-requisitos
* Node.js v20+ (ou v24) instalado no Windows.

### Início Rápido (1 Clique no Windows)
Basta dar duplo clique no arquivo:
```bat
start.bat
```
Ele iniciará automaticamente o servidor backend na porta **3000** e o frontend 3D na porta **5173**, abrindo o navegador.

### Início Manual via Terminal

1. **Instalar dependências (caso seja a primeira vez):**
   ```bash
   npm install
   ```

2. **Iniciar o Servidor Backend:**
   ```bash
   npm run server
   ```

3. **Iniciar o Frontend 3D (em outro terminal):**
   ```bash
   npm run dev:client
   ```

4. **Acessar no Navegador:**
   * **Modo Completo / Interativo:** `http://localhost:5173`
   * **Modo OBS / Stream Limpo:** `http://localhost:5173?mode=stream`

---

## 🎥 Como Configurar no OBS Studio

O jogo foi projetado para captura de alta performance a 60 FPS:

1. No OBS Studio, adicione uma nova fonte do tipo **Navegador (Browser Source)**.
2. Defina a **URL**:
   * Para transmissão vertical padrão TikTok (9:16):
     * URL: `http://localhost:5173?mode=stream&format=vertical`
     * Largura: `1080`
     * Altura: `1920`
   * Para transmissão widescreen (16:9):
     * URL: `http://localhost:5173?mode=stream`
     * Largura: `1920`
     * Altura: `1080`
3. Marque a opção **"Controlar áudio via OBS"** se desejar ajustar o volume da cidade separadamente da sua voz.
4. Taxa de quadros: `60 FPS`.

---

## 🛠️ Painel Admin / Dev (Testes Locais)

Dentro do jogo (no navegador), pressione a tecla **`F2`** no teclado para abrir o **Painel Flutuante de Desenvolvimento**:

* **Botão ☄️ Meteoro:** Dispara instantaneamente a queda do meteoro lendário.
* **Botão 🚨 Polícia:** Despacha viatura policial com sirene aberta.
* **Botão 🌧️ Chuva / ⛈️ Tempestade:** Altera o clima imediatamente.
* **Botão 🏎️ Corrida:** Inicia racha clandestino na avenida com perseguição policial.
* **Botão 🎆 Festival:** Dispara queima de fogos na praça.
* **Botão 💡 Apagão:** Corta a energia da cidade.
* **Botão 👤 Morador:** Gera um novo habitante com crachá 3D.
* **Caixa de Chat Admin:** Digite qualquer comando (`policia`, `chuva`, `meteoro`, `festa`) para testar como se fosse um espectador da LIVE.

---

## ⚙️ Conectando na sua LIVE Real do TikTok

O sistema possui um **Simulador Mock Integrado** ativo por padrão (ideal para testar antes de abrir a live).

Para conectar na sua transmissão real:
1. Abra a sua LIVE no TikTok.
2. Envie uma requisição POST para o servidor com seu `@usuario`:
   ```bash
   curl -X POST http://localhost:3000/api/tiktok/connect -H "Content-Type: application/json" -d "{\"username\": \"@seunome\"}"
   ```
3. Se o canal estiver offline, o sistema ativa automaticamente o modo mock de proteção para nunca deixar a transmissão congelada.

---

## 📁 Estrutura de Arquivos

```text
tiktok_live_cidade/
├── config/
│   ├── events.json           # Mapeamento de gifts e comandos para eventos do jogo
│   └── game_config.json      # Configurações de gráficos, limites e simulação
├── server/
│   ├── index.js              # Servidor Express, REST API e ciclo central
│   ├── db/
│   │   ├── schema.sql        # Tabelas SQLite (viewers, npcs, events, economy)
│   │   └── database.js       # Operações síncronas de banco de dados
│   ├── tiktok/
│   │   ├── sanitizer.js      # Sanitização e mapeamento seguro de dados
│   │   ├── mock_feeder.js    # Gerador de eventos simulados
│   │   └── connector.js      # Conexão resiliente com TikTok LIVE
│   ├── director/
│   │   ├── chain_events.js   # Gatilhos em cadeia (Roubo -> Perseguição -> Acidente)
│   │   └── event_director.js # Algoritmo de ritmo e tensão dramática
│   └── websocket/
│       └── ws_hub.js         # Broadcast em tempo real para o Three.js
├── client/
│   ├── index.html            # Interface Glassmorphism e contêiner 3D
│   ├── vite.config.js        # Configuração do Vite
│   └── src/
│       ├── main.js           # Loop principal da simulação 3D
│       ├── core/             # Engine Three.js, Bloom Pass e Time delta
│       ├── world/            # Construtor da cidade, edifícios, props, dia/noite, clima e eventos épicos
│       ├── entities/         # Veículos com IA de trânsito e NPCs com rotinas
│       ├── simulation/       # Grafo de caminhos e inteligência FSM
│       ├── camera/           # Diretor de câmeras dinâmicas e cinematográficas
│       ├── audio/            # Síntese sonora procedural com Web Audio
│       ├── ui/               # HUD Glassmorphism, Dev Panel e modo OBS
│       └── network/          # Cliente WebSocket com reconexão automática
├── test/                     # Suíte com 35 testes automatizados
├── start.bat                 # Inicializador em 1 clique para Windows
└── package.json
```

---

## 🧪 Testes Automatizados

Para rodar todos os 35 testes automatizados de persistência, servidor, WebSocket, eventos e E2E:
```bash
npm test
```
