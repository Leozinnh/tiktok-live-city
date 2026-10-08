# 🌆 NPC WORLD - Cidade 3D Interativa para TikTok LIVE

Uma simulação 3D viva, visualmente impressionante e com estética de jogo comercial, projetada especificamente para rodar como **máquina de entretenimento contínua (24/7)** em transmissões do TikTok LIVE via OBS Studio.

---

## 🌟 Principais Características

* **Metrópole 3D Expandida (300 x 300 Metros, 9 Setores Urbanos):**
  * **Setor Noroeste (Centro Financeiro):** Grandes arranha-céus corporativos com a **Torre Metropolitan (52 metros de altura)** com barbatanas em neon ciano e espigão com luz de topo, ao lado do **Banco Central NPC** com colunas clássicas e letreiro dourado.
  * **Setor Norte (Shopping Plaza):** Shopping center moderno com marquise de vidro e **outdoor eletrônico luminoso**.
  * **Setor Nordeste (Condomínios & Brownstones):** Fileira de sobrados elegantes e torres residenciais envidraçadas.
  * **Setor Oeste (Complexo Cívico):** Delegacia de polícia com pátio de viaturas e Hospital Geral Municipal com heliponto e luzes de emergência.
  * **Setor Centro (Grand Central Park):** Praça 4x maior com chafariz de pedra, alamedas de paralelepípedo, 16 árvores volumétricas e bancos de praça.
  * **Setor Sul (Boulevard Gastronômico):** Restaurantes, bistrô com toldos listrados e mesas ao ar livre.
  * **Setor Sudeste (Posto e Serviços):** Posto de combustível com 4 bombas, letreiro neon e loja de conveniência.
  * **Setor Leste (Torres Skyline):** Edifícios residenciais de 38 a 44 metros de altura.
  * **Horizonte Distante (X = ±92):** Arranha-céus ao longe compondo a silhueta metropolitana em 360°.
  * **Avenidas Longas de 240 Metros:** Retas amplas ideais para arrancadas e perseguições veiculares sem esbarrar em edifícios.

* **Gráficos 3D de Alto Padrão (Three.js PBR):**
  * Iluminação física com sombras suaves (`PCFSoftShadowMap`).
  * Pós-processamento cinematográfico com brilho noturno (`UnrealBloomPass`) e Tone Mapping (`ACESFilmicToneMapping`).
  * Ciclo Dia/Noite contínuo de 24 horas simuladas com iluminação noturna urbana estilo cyberpunk (luz ambiente ciano `0.45`, luar azulado `0.75` e céu azul índigo `#0f172a`, **eliminando escuridão total**).
  * Postes de rua e janelas dos edifícios acendem automaticamente ao anoitecer.
  * Clima dinâmico: Sol, Chuva (partículas em Object Pooling), Tempestade com relâmpagos estroboscópicos e trovões, e Neblina volumétrica.

* **Física de Veículos e Trânsito Inteligente:**
  * Frota de sedans, carros esportivos, viaturas policiais e ambulâncias.
  * **Semáforos Reais:** Carros civis freiam suavemente e param antes da faixa quando o sinal está vermelho ou amarelo.
  * **Distância de Segurança:** Detecção frontal a 8,5m que impede colisões e empilhamento de carros na mesma faixa.
  * **Atropelamento Físico com Ragdoll:** Carros em velocidade (> 5 m/s) que atingirem pedestres arremessam o NPC a 2,8m de distância; o cidadão cai de costas no asfalto (`state = 'KNOCKED_DOWN'`), sons de pneu cantando e buzina tocam e uma ambulância é despachada na hora para o socorro!

* **I.A Humana de Pedestres e Moradores da LIVE:**
  * Personagens 3D modulares com membros articulados e caminhada procedural em velocidade humana (1,6 m/s).
  * **Navegação Estrita em Calçadas:** Os pedestres contornam os quarteirões pelas calçadas e nunca atravessam por dentro das paredes dos edifícios.
  * **Comportamento Orgânico:** Pausas de 2 a 4 segundos nas esquinas (olhando para a rua/celular) e capacidade de sentar nos bancos da praça.
  * **Seguidores viram Moradores:** Crachá 3D flutuante sobre a cabeça exibindo `@usuario`, profissão e dinheiro em tempo real.

* **Eventos Lendários & Épicos Exclusivos:**
  * ☄️ **Meteoro (Desastre):** Céu vermelho de guerra (`#581c87`), sirene militar da defesa civil, rocha incandescente de 5,5m envolta em labaredas de 7,2m com PointLight de 140m descendo com **câmera de baixo para cima rastreando a bola de fogo em tempo real até o solo**, impacto violento com tremor de tela (screen shake), cratera incandescente, onda de choque dupla e fuga em pânico coletivo!
  * 🌌 **Galáxia (Fenômeno Cósmico):** Céu azul índigo e violeta (`#0f051d`), gigantesco **portal estelar 3D de 32 metros** com 3 anéis giratórios concêntricos em ciano neon, magenta e ouro, áudio com frequências cósmicas puras (432 Hz, 528 Hz, 639 Hz, 852 Hz), **gravidade zero com os cidadãos levitando de 3 a 6 metros no ar**, chuva de poeira estelar cintilante e bênção de prosperidade no HUD!
  * 🏎️ **Corrida Clandestina:** Grid de largada lado a lado na avenida central (-52, 0, 2.0 e 5.0), som de pneu cantando (tire screech), velocidade de 95 km/h furando semáforos vermelhos, **viatura policial em perseguição ativa colada na traseira seguindo a pista de asfalto** e câmera Chase Cam.
  * 🎆 **Festival Metropolitano:** Show coreografado de **14 foguetes multicoloridos** com som de assobio de lançamento (`playFireworkLaunch`), explosão de estrondo com estalo (`playFireworkBurst`) e flashes que iluminam os prédios na cor exata de cada fogo de artifício.
  * 💡 **Apagão:** Pane elétrica temporária apagando postes e vitrines com sirene de emergência.

* **Áudio Procedural com Compressor de Estúdio:**
  * Síntese de som via Web Audio API com `DynamicsCompressorNode` para eliminar distorções e ruídos conflitantes.
  * Função `stopAllSirens()` para desligamento limpo de sirenes ao término dos eventos.

* **Diretor de Câmeras Inteligente:**
  * Panorâmica Orbital em órbita ampla de 115 metros cobrindo todos os 9 setores da metrópole.
  * Chase Cam em perseguições policiais.
  * Follow Cam em moradores da LIVE.
  * Cinematic Event Cam para eventos cósmicos e desastres.

* **Banco de Dados Persistente (SQLite Nativo Node 24):**
  * Histórico de espectadores, dinheiro da cidade, moradores e ranking persistidos em `database/npc_world.sqlite`.

---

## 🚀 Como Executar

### Pré-requisitos
* Node.js v20+ (ou v24) instalado no Windows.

### Início Rápido (1 Clique no Windows)
Dê dois cliques no arquivo:
```bat
start.bat
```
Ele iniciará automaticamente o servidor backend na porta **3000** e o frontend na porta **5173**, abrindo o navegador.

### Início Manual via Terminal Único:
```bash
npm run dev
```
Inicia simultaneamente o servidor Express/WebSocket e a engine 3D Vite em um único comando.

* **Acesso Completo (com painel interativo):** `http://localhost:5173`
* **Acesso Modo OBS (Captura Limpa):** `http://localhost:5173?mode=stream`
* **Acesso Modo OBS Vertical (TikTok 9:16):** `http://localhost:5173?mode=stream&format=vertical`

---

## 🎥 Como Configurar no OBS Studio

1. No OBS Studio, adicione uma fonte **Navegador (Browser Source)**.
2. Defina a **URL**:
   * **Formato Vertical (TikTok LIVE - 9:16):**
     * URL: `http://localhost:5173?mode=stream&format=vertical`
     * Largura: `1080`
     * Altura: `1920`
   * **Formato Horizontal (Widescreen - 16:9):**
     * URL: `http://localhost:5173?mode=stream`
     * Largura: `1920`
     * Altura: `1080`
3. Marque a opção **"Controlar áudio via OBS"** se desejar dosar o volume do jogo independentemente do microfone.
4. Taxa de quadros: `60 FPS`.

---

## 🛠️ Painel Admin / Dev (Teclas e Comandos Rápidos)

Pressione a tecla **`F2`** no teclado com o jogo aberto no navegador para acessar o painel administrativo:

* **🌹 Rosa (Flor):** Simula o presente Rosa do TikTok, gerando/bonificando um morador e focando a câmera nele com crachá 3D.
* **🌌 Galáxia:** Dispara o fenômeno cósmico exclusivo com o portal estelar 3D no céu, som celestial, gravidade zero com levitação dos NPCs e poeira estelar.
* **☄️ Meteoro:** Dispara o alarme militar da defesa civil, céu vermelho e a queda da bola de fogo com impacto explosivo e cratera no asfalto.
* **🚨 Polícia:** Despacha viatura policial com sirene e giroflex estroboscópico.
* **🌧️ Chuva / ⛈️ Tempestade:** Altera o clima dinâmico com partículas e relâmpagos.
* **🏎️ Corrida:** Inicia o racha com dois carros esportivos na avenida e a viatura policial colada na perseguição.
* **🎆 Festival:** Dispara o show de 14 fogos de artifício com iluminação dinâmica nos prédios.
* **💡 Apagão:** Corta a eletricidade da cidade temporariamente.
* **👤 Morador:** Gera um novo morador da live com crachá suspenso.
* **❤️ +50 Likes:** Envia uma rajada de 50 curtidas na transmissão.
* **☀️/🌙 Dia/Noite:** Alterna instantaneamente entre Dia ensolarado (12:00) e Noite iluminada (21:00).
* **Caixa de Chat Teste:** Digite comandos como `rosa`, `flor`, `policia`, `chuva`, `meteoro`, `galaxia`, `festa`, `corrida` para simular o chat da live.

---

## 🧪 Testes Automatizados

O projeto conta com suíte de 35 testes automatizados cobrindo persistência SQLite, servidor WebSocket, sanitização TikTok, Event Director e integração E2E:
```bash
npm test
```
