# Spec BDD: STORY-001 — Balancear musculação e corrida sem sobrecarga

> **Story**: [story.md](./story.md)
> **Status**: Approved
> **Autor**: Jefferson (Produto & Design)
> **Revisores**: Jefferson (Three Amigos — solo)

---

## Feature: Registro de treino combinado e alerta de sobrecarga

Permite ao corredor registrar sessões de corrida e musculação e recebe uma sugestão concreta de ajuste quando o padrão combinado dos últimos 7 dias indica risco de sobrecarga — sem nunca bloquear o registro do treino.

### Regras de Negócio

1. Uma Sessão de Treino de **Corrida** registra: distância (> 0), tempo/duração (> 0), ritmo médio, percepção de esforço (escala **1 a 10**).
2. Uma Sessão de Treino de **Musculação** registra: grupo muscular (Peito+Tríceps, Ombro, Perna Frontal, Perna Posterior, Bíceps+Costas), intensidade (leve/moderado/pesado) e duração (> 0).
3. A avaliação de sobrecarga usa uma **janela móvel dos últimos 7 dias corridos** (não semana de calendário).
4. Sobrecarga é sinalizada quando há musculação de **perna (frontal ou posterior) com intensidade pesada** nos últimos 7 dias **E** a **carga de treino de corrida** (duração × intensidade, método session-RPE) dos últimos 7 dias é **≥ 110%** da carga de corrida dos 7 dias anteriores. Regra fundamentada em ACWR (Gabbett, 2016) + session-RPE (Foster, 2001) + regra dos 10% — ver [ADR-001](../../docs/adr/ADR-001-regra-sobrecarga-combinada.md).
5. Quando sobrecarga é detectada, o sistema apresenta uma **sugestão concreta de ajuste** (não um aviso genérico) — o registro do treino **nunca é bloqueado**, mesmo que o corredor ignore a sugestão.
6. Sem um período anterior completo de 7 dias para comparação (ex: primeiros 7 dias de uso), **nenhum alerta é gerado** — falta de dados não gera falso positivo.
7. O registro de dor é independente de sessão específica: **data + região do corpo + doeu/não doeu**. Pode ser registrado a qualquer momento após o treino, inclusive dias depois.
8. Toda regra de detecção de sobrecarga aplicada deve ser rastreável a uma fonte reconhecida de treino (ADR obrigatório — Lei do Domínio, `.sdd/PROJECT-CONSTITUTION.md`).

---

### Cenários — Happy Path

```gherkin
Scenario: Corredor registra uma sessão de treino de corrida
  Given que sou um corredor autenticado
  When registro uma Sessão de Treino de Corrida com distância, tempo, ritmo médio e percepção de esforço
  Then a sessão é salva e associada a mim
  And aparece no meu histórico de treinos
```

```gherkin
Scenario: Corredor registra uma sessão de treino de musculação
  Given que sou um corredor autenticado
  When registro uma Sessão de Treino de Musculação informando grupo muscular e intensidade
  Then a sessão é salva e associada a mim
  And aparece no meu histórico de treinos
```

```gherkin
Scenario: Sistema sugere ajuste quando detecta sobrecarga combinada
  Given que tenho pelo menos 14 dias de histórico de treino
  And nos últimos 7 dias registrei uma Sessão de Musculação de Perna Frontal ou Posterior com intensidade pesada
  And minha carga de treino de corrida nos últimos 7 dias é maior ou igual a 110% da carga dos 7 dias anteriores
  When registro a sessão que completa esse padrão
  Then o sistema exibe uma sugestão concreta de ajuste para não sobrecarregar
  And o registro da sessão é salvo normalmente
```

```gherkin
Scenario: Corredor registra dor pós-treino dias depois
  Given que sou um corredor autenticado
  And treinei há alguns dias
  When registro que senti dor, informando a região do corpo
  Then o registro de dor é salvo com a data, a região e o indicador "doeu"
  And não precisa estar vinculado a uma sessão de treino específica
```

---

### Cenários — Edge Cases

```gherkin
Scenario: Sistema não gera alerta por falta de histórico suficiente
  Given que tenho menos de 14 dias de histórico de treino
  And meu padrão de treino desta semana se pareceria com sobrecarga se houvesse comparação
  When registro uma nova Sessão de Treino
  Then nenhum alerta de sobrecarga é exibido
```

```gherkin
Scenario: Sistema não sugere ajuste quando não há sobrecarga
  Given que tenho pelo menos 14 dias de histórico de treino
  And minhas Sessões de Musculação de Perna nos últimos 7 dias são leves ou moderadas
  And minha carga de treino de corrida nos últimos 7 dias é menor que 110% da carga dos 7 dias anteriores
  When registro uma nova Sessão de Treino
  Then nenhuma sugestão de ajuste é exibida
```

```gherkin
Scenario: Corredor ignora a sugestão de ajuste e treina mesmo assim
  Given que o sistema exibiu uma sugestão de ajuste por risco de sobrecarga
  When registro a próxima Sessão de Treino sem seguir a sugestão
  Then a sessão é salva normalmente
  And o sistema não bloqueia nem impede o registro
```

---

### Cenários — Error Cases

```gherkin
Scenario: Tentativa de registrar sessão de corrida com distância inválida
  Given que sou um corredor autenticado
  When tento registrar uma Sessão de Treino de Corrida com distância zero ou negativa
  Then o sistema rejeita o registro
  And exibe uma mensagem explicando que a distância deve ser maior que zero
```

```gherkin
Scenario: Tentativa de registrar sessão de musculação sem grupo muscular ou intensidade
  Given que sou um corredor autenticado
  When tento registrar uma Sessão de Treino de Musculação sem informar grupo muscular ou intensidade
  Then o sistema rejeita o registro
  And exibe uma mensagem indicando os campos obrigatórios ausentes
```

```gherkin
Scenario: Tentativa de registrar sessão (corrida ou musculação) com duração inválida
  Given que sou um corredor autenticado
  When tento registrar uma Sessão de Treino com duração zero ou negativa
  Then o sistema rejeita o registro
  And exibe uma mensagem explicando que a duração deve ser maior que zero
```

```gherkin
Scenario: Tentativa de registrar sessão de corrida com percepção de esforço fora da escala
  Given que sou um corredor autenticado
  When tento registrar uma Sessão de Treino de Corrida com percepção de esforço fora de 1 a 10
  Then o sistema rejeita o registro
  And exibe uma mensagem explicando que a percepção de esforço deve estar entre 1 e 10
```

---

## Mapping: Cenário → Teste

| Cenário | Arquivo de Teste | Status |
|---------|-----------------|--------|
| Registrar sessão de corrida | `tests/Steady.Domain.Tests/RunningSessionTests.cs` | 🟢 Green |
| Registrar sessão de musculação | `tests/Steady.Domain.Tests/StrengthSessionTests.cs` | 🟢 Green |
| Sugerir ajuste em sobrecarga combinada | `tests/Steady.Domain.Tests/OverloadDetectionTests.cs` | 🟢 Green |
| Registrar dor pós-treino | `tests/Steady.Domain.Tests/PainLogTests.cs` | 🟢 Green |
| Sem alerta por falta de histórico | `tests/Steady.Domain.Tests/OverloadDetectionTests.cs` | 🟢 Green |
| Sem sugestão quando não há sobrecarga | `tests/Steady.Domain.Tests/OverloadDetectionTests.cs` | 🟢 Green |
| Alerta nunca bloqueia registro | `tests/Steady.Domain.Tests/OverloadDetectionTests.cs` | 🟢 Green |
| Distância inválida rejeitada | `tests/Steady.Domain.Tests/RunningSessionTests.cs` | 🟢 Green |
| Musculação sem campos obrigatórios rejeitada | `tests/Steady.Domain.Tests/StrengthSessionTests.cs` | 🟢 Green |
| Duração inválida rejeitada | `tests/Steady.Domain.Tests/RunningSessionTests.cs`, `tests/Steady.Domain.Tests/StrengthSessionTests.cs` | 🟢 Green |
| Percepção de esforço fora da escala rejeitada | `tests/Steady.Domain.Tests/RunningSessionTests.cs` | 🟢 Green |

---

## Notas de Especificação

- **Janela de avaliação**: últimos 7 dias corridos a partir de hoje (rolling window), não semana de calendário — decisão do produto para refletir com mais precisão o acúmulo real de estresse.
- **Ambiguidade resolvida**: dor pode ter múltiplos gatilhos aparentes (mobilidade → canela, corrida → coxa), mas o padrão relatado pelo usuário é que a combinação acumulada de musculação de perna + corrida é a causa raiz de ambos — a regra de sobrecarga trata isso como um problema sistêmico, não uma lesão isolada por região.
- **Fora do escopo desta story** (definido no discovery): recomendações via IA/ML, integração com wearables biométricos, prescrição detalhada de exercícios de musculação, escala de intensidade de dor (fica binário: doeu/não doeu no MVP).
- **Resolvido**: a regra de detecção de sobrecarga (regra de negócio #4) foi fundamentada e formalizada em [ADR-001](../../docs/adr/ADR-001-regra-sobrecarga-combinada.md), conforme exigido pela Lei do Domínio. Pronta para `/implement`.
- **Sincronizado via `/sync` (2026-08-09)**: 2 cenários de erro (duração inválida, percepção de esforço fora de 1-10) foram adicionados à spec — guard clauses de consistência descobertas durante o `/review`, sem impacto na regra de negócio principal.
