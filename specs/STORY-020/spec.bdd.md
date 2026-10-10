# Spec BDD: STORY-020 — Mobilidade no início da aba Semana

> **Story**: [story.md](./story.md)
> **Status**: Implemented · 2026-08-29
> **Autor**: Codex (Produto & Design)
> **Revisor**: Jefferson (aprovada em conversa)

---

## Feature: Mobilidade integrada à semana

A mobilidade deixa de ser uma seção isolada e passa a introduzir a aba Semana,
mantendo no mesmo fluxo de leitura a preparação articular, a estrutura semanal
e os treinos de cada dia.

### Regras de Negócio

1. A ordem da aba **Semana** é: conteúdo completo de mobilidade, estrutura
   semanal e detalhamento de cada dia.
2. Os blocos de mobilidade preservam a ordem recebida no documento do plano,
   bem como títulos, exercícios e séries.
3. **Mobilidade** não aparece mais como aba independente e seu conteúdo não é
   duplicado.
4. `section=mobilidade` é uma entrada legada válida e normaliza para **Semana**.
   Valores desconhecidos continuam abrindo **Seus dados**, conforme STORY-012.
5. A entrada da Dashboard em `section=semana&day=N` mantém o dia solicitado
   expandido e rola até ele, mesmo com a mobilidade antes da lista.
6. Um plano sem blocos de mobilidade não mostra placeholder nem erro: a Semana
   começa diretamente pela estrutura semanal.
7. A mudança não altera prescrições, ficha do personal, estados de conclusão ou
   disponibilidade do botão de registro.

---

### Cenários — Happy Path

```gherkin
Scenario: Corredor abre a aba Semana
  Given que o plano contém blocos de mobilidade
  When o corredor seleciona a aba "Semana"
  Then vê primeiro todos os blocos de mobilidade na ordem do plano
  And depois vê a estrutura semanal
  And depois vê o detalhamento de cada dia
```

```gherkin
Scenario: Cabeçalho não oferece mais uma aba separada de Mobilidade
  Given que o corredor abriu o documento do planejamento
  When observa as abas internas do documento
  Then encontra "Semana"
  And não encontra uma aba "Mobilidade"
```

```gherkin
Scenario: Conteúdo de mobilidade aparece uma única vez
  Given que o plano contém dois blocos de mobilidade
  When o corredor percorre a aba "Semana"
  Then cada bloco de mobilidade aparece uma única vez
  And não existe outra seção navegável que repita esses blocos
```

```gherkin
Scenario: Dashboard abre o treino de hoje depois da mobilidade
  Given que o corredor possui um planejamento
  And hoje corresponde a um dia do plano
  When toca no atalho do plano semanal na Dashboard
  Then o documento abre na aba "Semana"
  And o dia de hoje está expandido
  And a tela rola até a área do dia expandido
```

---

### Cenários — Edge Cases

```gherkin
Scenario: Link antigo da aba Mobilidade continua útil
  Given que o corredor abre um link com "section=mobilidade"
  When o documento interpreta o parâmetro da rota
  Then abre a aba "Semana"
  And a mobilidade aparece no início dela
```

```gherkin
Scenario: Plano sem blocos de mobilidade abre a Semana normalmente
  Given que o plano não contém blocos de mobilidade
  When o corredor abre a aba "Semana"
  Then vê a estrutura semanal como primeiro conteúdo
  And não vê mensagem de erro nem espaço reservado para mobilidade
```

```gherkin
Scenario: Seção desconhecida mantém o fallback existente
  Given que o corredor abre um link com uma seção desconhecida
  When o documento interpreta o parâmetro da rota
  Then abre a aba "Seus dados"
```

---

### Cenários — Error Cases

Não há novo caso de erro: todo o conteúdo já foi carregado como uma unidade
antes da renderização do documento. Falha de carregamento do plano permanece
com o tratamento existente da STORY-016.

---

## Mapping: Cenário → Teste

| Cenário | Arquivo de Teste | Status |
|---------|------------------|--------|
| Link legado normaliza para Semana | `src/steady-app/src/planning/__tests__/planDayParam.test.ts` | 🟢 Green |
| Seção desconhecida mantém fallback | `src/steady-app/src/planning/__tests__/planDayParam.test.ts` | 🟢 Green (regressão) |
| Ordem Mobilidade → estrutura → dias | Inspeção da composição em `PlanningDocument.tsx` | 🟢 Green · manual no aparelho recomendada |
| Aba Mobilidade removida e conteúdo sem duplicação | Inspeção de `SECTIONS` e da renderização condicional | 🟢 Green · manual no aparelho recomendada |
| Dashboard mantém dia expandido e rolagem | Inspeção do cálculo `seção + lista + dia` em `SemanaSection.tsx` | 🟢 Green · manual no aparelho recomendada |
| Plano sem mobilidade começa pela estrutura | Composição sobre `document.mobility.map` vazio | 🟢 Green · manual no aparelho recomendada |

> O harness atual não suporta testes de renderização React Native
> (`@testing-library/react-native`), limitação registrada na memória do projeto.
> Na implementação, os cenários visuais podem permanecer manuais se essa
> dependência continuar incompatível com o Expo SDK 57; a normalização da rota
> deve obrigatoriamente ter teste Jest automatizado.

---

## Notas de Especificação

- “Início da aba Semana” significa mover todo o conteúdo atual de Mobilidade
  para antes de “Estrutura semanal”, removendo a aba independente. Não há
  duplicação.
- A compatibilidade de `section=mobilidade` pertence à fronteira de parsing da
  rota, não ao componente visual.
- A mobilidade permanece um bloco de apresentação separado por composição; não
  passa a fazer parte da lógica interativa de `SemanaSection`.
- Fora do escopo: alterar textos ou exercícios, associar mobilidade a dias,
  mudar a fonte do plano ou redesenhar as demais abas.
