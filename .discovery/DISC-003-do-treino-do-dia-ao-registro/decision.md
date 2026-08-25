# Decisão — DISC-003: O plano e o registro não se encontram

> Data: 2026-08-22
> Decidido por: Jefferson
> Referências: `.discovery/DISC-003-do-treino-do-dia-ao-registro/problem.md` · `.discovery/DISC-003-do-treino-do-dia-ao-registro/hypothesis.md`

---

## Decisão

- [x] **Construir** → Story criada em `specs/STORY-012/`
- [ ] **Validar primeiro** → Experimento / pesquisa necessária antes de construir
- [ ] **Diferir** → Válido, mas não agora
- [ ] **Descartar** → Fora do escopo, problema não confirmado ou hipótese refutada

---

## Rationale

**Por que esta decisão?**

O problema é verificável no código, não é opinião: o card do plano e o card de
registro estão na mesma tela, a 5 toques um do outro, e nada os liga. As duas
metades já foram construídas (STORY-006, STORY-007, STORY-001/003) — o que falta
é a costura, que é barata.

O que destravou a decisão foi a escolha de **derivar** a conclusão do dia em vez
de carimbá-la. Na primeira leitura, "computar dia concluído e armazenar" parecia
exigir entidade nova, tabela nova e um ADR abrindo exceção à imutabilidade da
Lei do Domínio #2. Ao decidir que o botão leva ao registro que já existe e o dia
fecha ao salvar, o custo despencou: nenhuma tabela nova, nenhum ADR, nenhuma
dupla entrada, e a imutabilidade vem de graça porque as sessões já são imutáveis.

O escopo maior que apareceu na conversa — registrar carga e séries exercício a
exercício — foi **deliberadamente adiado nesta sessão** ("vamos com a ideia do
botão para registrar o exercício feito, no momento"). É um desejo real, mas
resolve outro problema, para outro momento do dia, com entidade própria.

**A ressalva que acompanha o "Construir":** a regra do denominador da % está em
aberto e é capaz de fazer a tela mentir (ver *Maior risco* na hipótese). Não
bloqueia a story — o caminho curto entrega valor sem % nenhuma — mas bloqueia
o cenário BDD da porcentagem. O `/spec` fecha isso antes de escrevê-lo.

---

## Se Construir

**Story criada:** `specs/STORY-012/`

**Escopo acordado:**

- Botão do card *Plano da semana* abre o planejamento mais recente **na aba
  Semana com o dia de hoje expandido**.
- Botão de registro dentro do dia expandido, levando ao formulário já ciente do
  treino daquele dia (musculação, corrida, ou ambos nos dias combinados).
- **Dia cumprido derivado** dos registros existentes: fecha quando **todas** as
  modalidades previstas para aquela data têm registro. Sem carimbo, sem tabela.
- Marca visual de cumprido / parcial / não feito no detalhamento dos dias.
- **% de avanço** (dias cumpridos ÷ dias previstos) calculada **na API**,
  exibida na Dashboard — o app nunca calcula (FF-004).

**O que fica fora desta versão:**

- Carga e séries por exercício → candidato a **DISC-004**.
- Check por exercício e estado ao vivo durante o treino.
- Desmarcar dia ou marcar retroativamente — imutável e só pra frente.
- **Aderência** (% que cai). Escolhido **avanço** (% que sobe).
- Casar o `MuscleGroup` registrado com o que o plano pedia.
- Geração dinâmica do plano — segue fora desde o DISC-002.

---

## Aprendizados

- **O pedido chegou como solução e continha dois problemas de naturezas
  diferentes.** "Card + botão + %" embrulhava um atrito de navegação (depois do
  treino, quero registrar rápido) e um diário de treino detalhado (durante o
  treino, quero saber que carga usei). Separá-los foi o trabalho desta sessão —
  e a pergunta que separou foi *"o que a granularidade fina te dá que o carimbo
  não dá?"*.

- **Antes de criar tabela para um estado, checar se ele não é leitura do que já
  existe.** "Dia concluído" parecia um fato a persistir; é uma consulta sobre
  `RunningSession`/`StrengthSession` cruzada com a grade da semana. Uma entidade
  e um ADR evaporaram na mesma frase. Vale como heurística geral neste projeto.

- **Uma regra de contagem já implementada pode inviabilizar uma métrica de
  produto sem que ninguém perceba.** A contagem regressiva do
  `trainingProgress.ts` (STORY-011) é correta para descobrir a fase do plano e
  **estruturalmente incompatível** com uma % de avanço de denominador fixo. Foi
  descoberto ao escrever a hipótese, não ao pedir a feature. Métrica de produto
  merece conferência contra a aritmética que já existe no código.

- **Escolher "exige todas as modalidades do dia" é escolher uma % mais dura.**
  A regra é a mais honesta das três, e é também a que mais arrisca desmotivar.
  Registrado como suposição de certeza **Baixa** de propósito: é a primeira
  coisa a revisitar depois de algumas semanas de uso real.
