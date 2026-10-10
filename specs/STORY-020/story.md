# Story: STORY-020 — Mobilidade no início da aba Semana

> Pedido direto do usuário, sem discovery. A mudança reorganiza conteúdo já
> existente e não introduz comportamento de domínio novo.

## Descrição

Como **corredor que consulta seu planejamento semanal**,
Quero **encontrar a mobilidade no início da aba Semana**,
Para que **eu veja a preparação e a recuperação articular junto da rotina da
semana, sem precisar procurar uma aba separada**.

## Contexto

O documento do planejamento apresenta hoje **Semana** e **Mobilidade** como
abas irmãs. Entretanto, a mobilidade faz parte da execução segura daquela
rotina: deve preceder a estrutura semanal no mesmo fluxo de leitura. O conteúdo
já existe em `TrainingPlanDocument.mobility`; esta story muda apenas sua posição
e elimina a navegação duplicada.

Links antigos podem conter `section=mobilidade`. Embora a aba deixe de existir,
esses links precisam continuar levando ao conteúdo correspondente, agora na aba
Semana.

## Critérios de Aceite

- [x] A aba **Semana** começa com todo o conteúdo que hoje pertence à aba
      **Mobilidade**
- [x] A estrutura semanal e o detalhamento dos dias aparecem depois da
      mobilidade, sem perda de conteúdo ou funcionalidade
- [x] **Mobilidade** deixa de aparecer como aba independente
- [x] Um link antigo com `section=mobilidade` abre a aba **Semana**
- [x] O atalho da Dashboard continua abrindo a Semana com o dia atual expandido
      e rolado para a área visível
- [x] Se o plano não contiver blocos de mobilidade, a aba começa normalmente
      pela estrutura semanal

## Estimativa

- **Tamanho**: P
- **Complexidade**: Baixa

## Dependências

| Tipo | Descrição | Status |
|------|-----------|--------|
| Story | STORY-012 — entrada da Dashboard na Semana e abertura do dia | Implementada |
| Story | STORY-016 — plano do Steady persistido, incluindo mobilidade | Implementada |

## Notas

- Análise: [analysis.md](./analysis.md)
- Não altera conteúdo prescrito, API, persistência nem regras de registro.
