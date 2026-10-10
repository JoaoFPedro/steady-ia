# ADR-019: Identidade histórica estável do exercício

> **Data**: 2026-08-30
> **Status**: Accepted
> **Story**: STORY-014
> **Decisores**: Produto e Engenharia Steady

## Contexto

A política de aderência usa a mediana das cargas anteriores do mesmo exercício.
Hoje cada publicação gera novo `ExerciseId`, mesmo ao editar a mesma linha. Nome
livre não é identidade segura: pode mudar, colidir ou representar movimentos
diferentes.

## Opções Consideradas

### Opção A: Nome normalizado

- **Prós**: não muda o contrato.
- **Contras**: renome perde histórico; homônimos misturam carga; acentos e
  abreviações criam associações falsas.

### Opção B: Reutilizar `ExerciseId`

- **Prós**: um único identificador.
- **Contras**: confunde a identidade da linha histórica com o snapshot de uma
  prescrição imutável e quebra o comportamento atual de publicação.

### Opção C: `ExerciseKey` separado

- **Prós**: prescrição continua imutável; identidade atravessa versões; renome
  é seguro; remoção e recriação são distinguíveis.
- **Contras**: amplia documentos, contratos e compatibilidade legada.

## Decisão

Escolhemos **Opção C**. Cada prescrição mantém seu `Id` e passa a carregar um
`ExerciseKey`. Ao editar ou renomear uma linha carregada da ficha ativa, o app
devolve a chave e o servidor valida que ela pertence à ficha ativa daquele
corredor. Exercício novo omite a chave e recebe outra. Chave removida não pode
ser reivindicada por uma linha nova.

Para documento legado, `ExerciseKey` ausente assume o `ExerciseId` daquela
prescrição. Execuções antigas só participam da mediana quando possuem chave
compatível; igualdade de nome nunca cria vínculo implícito. O snapshot da
execução guarda `ExerciseKey` e `DurationSeconds`.

## Consequências

### Positivas

- Mediana de carga continua válida após renome e ajuste da ficha.
- Exercícios homônimos não contaminam o histórico.
- Fichas legadas continuam legíveis sem migração destrutiva.

### Negativas

- Publicação passa a validar linhagem além de role e vínculo.
- Histórico anterior sem chave pode ficar `NãoComparável`.

### Riscos

- Cliente forja chave de outro exercício → servidor aceita somente chaves da
  ficha ativa do mesmo corredor e uma única vez por publicação.
- Linha removida é reutilizada → chaves ausentes da ficha ativa não podem ser
  reintroduzidas como se fossem continuidade.

## Referências

- `specs/STORY-014/spec.bdd.md`
- ADR-009 — ficha substituível e versões imutáveis
- ADR-015 — referência comparável de carga
