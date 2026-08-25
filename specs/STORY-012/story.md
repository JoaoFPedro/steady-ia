# Story: STORY-012 — Do treino do dia ao registro, e o plano avançando sozinho

Discovery: `.discovery/DISC-003-do-treino-do-dia-ao-registro/`
Protótipo: `Marathon training app design/steady.html` (artboard 3a — card "Plano da semana")

## Descrição

Como **corredor amador seguindo o plano de 24 semanas rumo à minha prova**,
Quero **ir do card da Dashboard direto para os exercícios de hoje e registrar dali mesmo o que
acabei de fazer**,
Para que **registrar deixe de custar cinco toques e uma volta pela Dashboard — e para que o plano
mostre sozinho quanto dele eu já cumpri, sem eu ter que marcar nada**.

## Contexto

O app tem as duas metades e não as liga. O card *Plano da semana*
(`app/(tabs)/index.tsx:154`) mostra o treino de hoje em duas linhas, sem os exercícios. Chegar aos
exercícios exige abrir `/planning/plan` — que sempre abre na aba **Dados**, com todos os dias
fechados (`src/planning/PlanningDocument.tsx:46`) —, trocar para **Semana**, rolar e expandir o dia.
Registrar exige voltar à Dashboard e abrir um formulário em branco, que não sabe que existe plano.

A decisão de forma do DISC-003: **o dia não é carimbado, é derivado**. Não há botão "concluí"
gravando um fato novo. O botão leva ao registro que já existe, e o dia fecha porque os registros
daquela data satisfazem o que a grade pedia. Sem tabela nova, sem ADR de imutabilidade —
`RunningSession` e `StrengthSession` já são imutáveis e a leitura herda isso.

**Um dia combinado exige as duas modalidades.** Quinta pede costas+bíceps *e* corrida de qualidade;
registrar só a musculação deixa a quinta **parcial**, não cumprida.

**A % é de avanço, não de aderência** — dias cumpridos sobre dias previstos, começando em 0 e só
subindo. A conta acontece **no app**, sobre `trainingHistory()` + a fila local + a grade: é o único
arranjo em que um registro ainda na fila offline fecha o dia na hora (ADR-003), e segue o precedente
de `trainingProgress.ts` (STORY-011) — aritmética de calendário, não regra de treino. FF-004 fala de
acesso a banco, não de aritmética, e a leitura continua sendo via API .NET.

## Critérios de Aceite

- [x] Do card *Plano da semana*, o corredor chega ao planejamento já na aba **Semana** com o dia de
      hoje expandido
- [x] No dia expandido há como registrar o treino daquele dia, indo ao formulário que já existe
- [x] O formulário abre sabendo qual treino era — o corredor não redigita o que acabou de ler
- [x] Num dia combinado, os dois registros são alcançáveis a partir do dia expandido
- [x] Um dia fica cumprido quando **todas** as modalidades que a grade previa têm registro naquela
      data — sem nenhum gesto extra de "marcar como feito"
- [x] Um dia com parte das modalidades registradas aparece como **parcial**, distinto de cumprido e
      de não feito
- [x] Domingo é descanso: não há o que cumprir nem o que registrar
- [x] O detalhamento dos dias mostra o estado de cada um
- [x] A Dashboard mostra quanto do plano já foi percorrido — dias cumpridos sobre os 144 dias com
      treino das 24 semanas
- [x] Quem criou o planejamento depois do início do plano vê em que semana entrou, para o teto da
      porcentagem não se ler como fracasso
- [x] Histórico que não pôde ser lido nunca vira "0%" 
- [x] Sem planejamento nenhum, o caminho leva ao formulário de criação — nunca inventa dia nem
      porcentagem
- [x] Registro sem sinal continua funcionando: entra na fila e o estado do dia se acerta na volta da
      conexão (ADR-003)

## Questão resolvida no `/spec` (2026-08-22)

**O denominador.** `src/planning/trainingProgress.ts` conta o plano de trás para frente a partir da
data da prova (STORY-011). Quem gera o plano a 10 semanas da prova entra na semana 15 de 24 — as
diárias anteriores nunca existiram para essa pessoa.

**Decisão: denominador fixo em 144** (24 semanas × 6 dias com treino), e a tela **diz em que semana o
corredor entrou**. Um corredor que entra na semana 15 e cumpre tudo termina exibindo 42% — o número é
honesto, e o texto ao lado é o que impede que ele se leia como fracasso. Alternativa descartada:
contar só a janela do corredor, que chegaria a 100% mas discordaria do "Semana 15 de 24" do
cabeçalho.

## Fora de Escopo

| Item | Razão |
|------|-------|
| Carga e séries por exercício | Foi o pedido original, adiado por decisão de produto em 2026-08-22. Resolve outro problema (progressão de força), noutro momento (durante o treino) e com entidade própria — merece discovery separado |
| Check por exercício / estado ao vivo durante o treino | Mesma razão, e colide com a Lei do Domínio #2 (estado mutável em progresso) |
| Desmarcar um dia ou marcar retroativamente | Imutável e só pra frente — decisão do DISC-003. Sai de graça na derivação |
| Aderência (% que começa em 100 e cai) | Escolhido avanço. Conta e mensagem diferentes; pode voltar como story própria |
| Casar `MuscleGroup` registrado com o grupo que a grade pedia | Pergunta aberta no `problem.md`. Começar tolerante é mais barato e menos punitivo |
| Geração dinâmica do plano a partir do `PlanRequest` | Fora de escopo desde o DISC-002, reafirmado em 2026-08-22 |

## Estimativa

- **Tamanho**: M — **só app**. O `/spec` derrubou a parte de backend: nenhum endpoint, nenhuma
  migration, nenhuma coluna. São duas funções puras (estado do dia, avanço do plano), o deep link
  para aba+dia e as marcas de estado no detalhamento.
- **Fatiamento**: os cenários de navegação e registro (regras 1–10 da spec) entregam valor sem
  porcentagem nenhuma e não dependem das regras 19–26. É nessa linha que a story quebra, se quebrar.
