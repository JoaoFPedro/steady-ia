# Story: STORY-001 — Balancear musculação e corrida sem sobrecarga

Discovery: .discovery/DISC-001-musculacao-e-corrida/

## Descrição

Como **corredor amador treinando para minha primeira maratona e que também faz musculação**,
Quero **registrar meus treinos de corrida e musculação e ser alertado quando a combinação indicar risco de sobrecarga**,
Para que **eu reduza os episódios recorrentes de dor pós-treino e treine com consistência até a maratona**.

## Contexto

O corredor hoje ajusta o equilíbrio entre musculação e corrida por tentativa e erro, sem critério, e sente dor pós-treino recorrente que migra de local no corpo (o episódio mais recente foi na canela). Isso é o primeiro discovery do Steady, validado com o próprio criador do produto como usuário.

## Critérios de Aceite

- [ ] Corredor consegue registrar uma Sessão de Treino de corrida (volume/distância, intensidade)
- [ ] Corredor consegue registrar uma Sessão de Treino de musculação (grupo muscular/região trabalhada, intensidade)
- [ ] Sistema alerta o corredor quando o padrão combinado da semana indica risco de sobrecarga (ex: musculação pesada de perna + aumento de volume de corrida)
- [ ] Corredor consegue registrar dor/desconforto pós-treino, com data e região do corpo
- [ ] Regra de detecção de sobrecarga é rastreável a uma fonte reconhecida de treino (ADR obrigatório, conforme Lei do Domínio do Steady)

> **Alinhado ao modelo real pelo `/sync` em 2026-08-16.** O critério dizia
> "associada à Sessão de Treino", mas `PainLog` foi implementado como
> `(Data, Região)` independente. A decisão foi deliberada no `/spec` da
> STORY-003: dor costuma surgir horas ou dias após o treino, e frequentemente
> sem uma sessão única a culpar — exigir o vínculo forçaria o corredor a
> inventar uma atribuição que ele não tem. O critério foi corrigido para
> descrever o que o domínio faz, não o contrário.

## Estimativa

- **Tamanho**: M
- **Complexidade**: Média

## Dependências

| Tipo | Descrição | Status |
|------|-----------|--------|
| Story | — | — |
| Serviço | — | — |

## Notas

Escopo mínimo definido em `.discovery/DISC-001-musculacao-e-corrida/hypothesis.md`. Fora do escopo nesta versão: recomendações via IA/ML, integração com wearables biométricos, prescrição detalhada de exercícios de musculação.
