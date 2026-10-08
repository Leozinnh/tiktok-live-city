# NPC WORLD - Documento de Design e Especificação Técnica

**Data:** 2026-10-08  
**Projeto:** NPC WORLD — Simulação 3D Interativa para TikTok LIVE  
**Status:** Implementado, Aprimorado e Validado  
**Controle de Versão:** Sem Git (conforme instrução do usuário)

---

## 1. Visão Geral e Objetivos do Produto

O **NPC WORLD** é uma simulação 3D viva de uma cidade contemporânea, construída especificamente para funcionar como uma **máquina de entretenimento contínua (24/7)** transmitida via TikTok LIVE e capturada diretamente no OBS Studio.

### Pilares Fundamentais:
1. **Visual Comercial e Estilizado:** Modelagem 3D arquitetônica refinada, iluminação PBR com sombras suaves (`PCFSoftShadowMap`), ciclo contínuo de dia/tarde/pôr do sol/noite/madrugada com postes e janelas iluminadas, clima dinâmico (sol, chuva com reflexos, tempestade com relâmpagos, neblina volumétrica) e pós-processamento cinemático (Bloom e Tone Mapping ACESFilmic).
2. **Grande Metrópole 300x300m (9 Setores Urbanos):**
   * Centro Financeiro com a Torre Metropolitan (52m de altura, espigão e barbatanas neon) e Banco Central.
   * Shopping Plaza Central com marquise de vidro e outdoor eletrônico luminoso.
   * Complexo Cívico: Delegacia de Polícia e Hospital Geral com heliponto.
   * Grand Central Park 4x maior com chafariz de pedra, alamedas e bancos.
   * Boulevard Gastronômico com bistrô e mesas ao ar livre.
   * Posto Estrela com cobertura neon e conveniência.
   * Torres residenciais no horizonte com janelas iluminadas em 360°.
3. **Cidade Viva e Autônoma:** População com rotina diária (casa, trabalho, lazer, compras, descanso), necessidades orgânicas (energia, fome, humor, dinheiro), economia ativa e tráfego de veículos inteligentes (carros, ambulâncias, viaturas com sirenes operacionais).
4. **Física de Veículos e Atropelamento:** Carros civis respeitam semáforos vermelhos e mantêm distância de segurança frontal a 8,5m. Impactos veiculares em velocidade arremessam pedestres a 2,8m para trás com queda de costas no asfalto (ragdoll), acionamento de sirenes de emergência e despacho de ambulância.
5. **Direção Cinematográfica (Event Director):** Algoritmo autônomo que regula a tensão dramática da live (Calmaria → Tensão → Acontecimentos/Perseguições → Clímax → Resolução), garantindo que a transmissão nunca fique monótona mesmo sem intervenções externas.
6. **Interatividade em Tempo Real com TikTok LIVE:**
   * **Seguidores:** Nascem como moradores permanentes da cidade com seus nomes (@usuario) e profissões em crachá 3D flutuante.
   * **Comentários:** Comandos interativos configuráveis (`chuva`, `tempestade`, `sol`, `policia`, `ambulancia`, `corrida`, `festa`, `meteoro`, `galaxia`, `apagao`, `rosa`, `flor`).
   * **Presentes (Gifts) Distintos e Exclusivos:**
     * 🌹 **Rose:** Cria novo morador com crachá 3D e foca a câmera nele.
     * 🌌 **Galaxy (Fenômeno Cósmico):** Abre portal estelar 3D de 32 metros com anéis concêntricos giratórios, som celestial, gravidade zero com levitação dos cidadãos e chuva de poeira estelar dourada.
     * ☄️ **Meteoro (Desastre):** Alarme militar, céu vermelho de guerra, câmera rastreando a bola de fogo em tempo real do céu até o solo com impacto, cratera e pânico coletivo.
     * 🏎️ **Corrida:** Racha com esportivos a 95 km/h na avenida principal com perseguição policial colada na traseira.
     * 🎆 **Festival:** Show coreografado de 14 fogos de artifício com iluminação dinâmica nos edifícios.
   * **Likes:** Milestones numéricos que aceleram o desenvolvimento da cidade.
7. **Persistência Confiável:** Banco de dados SQLite (`node:sqlite DatabaseSync`) armazenando moradores, histórico de interações de espectadores, economia da cidade e estatísticas.
8. **Robustez 24/7:** Renderização com Object Pooling, prevenção de memory leaks, compressor de áudio para evitar distorções sonoras, modo headless/mock para desenvolvimento e modo dedicado otimizado para captura do OBS (`--stream` em 9:16 ou 16:9).

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
│  │ (Validação & Fallback)  │  │  (node:sqlite)      │  │
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
│  │ World Builder (Metrópole 300x300m, 9 Setores)    │  │
│  ├──────────────────────────────────────────────────┤  │
│  │ Environment (Ciclo 24h & Iluminação Cyberpunk)   │  │
│  ├──────────────────────────────────────────────────┤  │
│  │ Entity Managers (NPCs com FSM & Veículos com IA) │  │
│  ├──────────────────────────────────────────────────┤  │
│  │ Dynamic Camera Director (Orbital, Chase, Event)  │  │
│  ├──────────────────────────────────────────────────┤  │
│  │ Web Audio Engine (Compressor de Estúdio)         │  │
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
  * `ACESFilmicToneMapping` com `toneMappingExposure = 1.05`.
  * `DirectionalLight` simulando o sol/lua com cálculo de sombras suaves via `PCFSoftShadowMap`.
  * `HemisphereLight` para iluminação difusa do céu e chão.
  * Pós-processamento com `EffectComposer`, `RenderPass` e `UnrealBloomPass` para gerar brilho natural em lâmpadas, neons e faróis à noite.
* **Ciclo Dia/Noite:**
  * Duração configurável (padrão: 1 dia completo a cada 12 minutos).
  * Noite urbana estilo cyberpunk: céu em azul índigo profundo (`#0f172a`), luz ambiente ciano `0.45` e luar azulado `0.75`, eliminando escuridão total.
  * Luzes urbanas acendem automaticamente ao anoitecer.
* **Sistema Climático:**
  * **Sol:** Iluminação clara, sombras nítidas.
  * **Chuva:** Partículas recicladas em loop contínuo (Object Pool) caindo com ângulo dinâmico de vento. Asfalto reflexivo.
  * **Tempestade:** Chuva densa com relâmpagos estroboscópicos e trovões procedurais no sound engine.
  * **Neblina:** `THREE.FogExp2` com controle de densidade.

### 3.2. Cidade e Cenário
* **Metrópole 300x300m:**
  * 9 grandes setores urbanos interconectados por 4 avenidas principais e anel viário externo.
  * Praça central arborizada com bancos, chafariz e caminhos de pedestres.
  * Zona residencial com casas e prédios de apartamentos.
  * Zona comercial com shopping center, letreiro neon, restaurante, posto de combustível e banco central.
  * Prédios institucionais: Delegacia de Polícia e Hospital Geral com heliponto.
* **Mobiliário Urbano:**
  * 24 postes de iluminação de alta definição com fontes de luz pontual.
  * Semáforos nos cruzamentos com ciclo automático verde/amarelo/vermelho.
  * Mais de 30 árvores volumétricas e bancos.

### 3.3. NPCs e Simulação Social
* **Personagens 3D Estilizados:**
  * Corpo modular com membros articulados e caminhada procedural em velocidade humana (1,6 m/s).
  * Navegação estrita em calçadas perimetrais contornando quarteirões sem atravessar prédios.
  * Pausas de 2 a 4 segundos nas esquinas e capacidade de sentar nos bancos da praça.
* **Necessidades:** Fome, energia, humor e dinheiro.
* **Moradores da LIVE:** Crachá 3D suspenso com nome (@usuario), profissão e saldo monetário em tempo real.

### 3.4. Veículos e Trânsito
* **Frota:** Sedans civis, esportivos, viaturas policiais e ambulâncias.
* **Semáforos Reais:** Parada suave antes da faixa branca no sinal vermelho/amarelo.
* **Prevenção de Colisão Frontal:** Distância de segurança de 8,5m.
* **Atropelamento Físico com Ragdoll:** Impacto veicular arremessa o pedestre a 2,8m de distância com queda de costas no asfalto (`state = 'KNOCKED_DOWN'`), sons de freada brusca e despacho imediato de ambulância para resgate.

### 3.5. Eventos Lendários Exclusivos
* **Meteoro (Desastre):** Rastreamento de câmera de baixo para cima acompanhando a bola de fogo do céu até o solo, impacto violento com tremor de tela (screen shake), cratera incandescente e fuga em pânico coletivo.
* **Galáxia (Fenômeno Cósmico):** Portal estelar 3D no céu de 32 metros com anéis concêntricos giratórios, som celestial, gravidade zero com levitação dos cidadãos e chuva de poeira estelar dourada.
* **Corrida Clandestina:** Grid de largada lado a lado na avenida central, som de pneu cantando (tire screech), velocidade de 95 km/h, viatura policial em perseguição ativa seguindo o asfalto e câmera Chase Cam.
* **Festival Metropolitano:** Show coreografado de 14 fogos de artifício com iluminação dinâmica nos edifícios.
* **Apagão Geral:** Pane elétrica temporária apagando postes e vitrines com sirene de emergência.

---

## 4. Otimização e Estabilidade 24/7

1. **Object Pooling:** Partículas de chuva, fogos e explosões utilizam buffers pré-alocados para evitar garbage collection spikes.
2. **Compressor de Áudio de Estúdio:** Elimina sobreposição e distorção sonora.
3. **Trava de Prioridade de Eventos (`isEventBusy` + `cleanupPreviousEvent`):** Comandos manuais/admin sempre têm prioridade imediata e limpam sons residuais com `stopAllSirens()`.
4. **Proteção do Loop de Renderização (Try/Catch):** Garante que nenhuma exceção não-fatal interrompa a animação a 60 FPS.

---

## 5. Estratégia de Teste e Validação

* Todos os **35 testes automatizados** passam com 100% de sucesso.
* Compilação de produção (`npm run build`) validada sem erros.
