# Steady.Domain - TechnicalDebtsDocs - Índice

Análise de débitos técnicos de `src/Steady.Domain`, classificados por criticidade, com distinção explícita entre "regra de negócio complexa mas correta" (rastreável a ADR-001/spec, não é débito) e "débito técnico real" (lacuna, inconsistência ou gap de implementação).

| Documento | Região | Estado Geral | Descrição |
|---|---|---|---|
| [RunningSession-Treino-Corrida-Debts.md](./RunningSession-Treino-Corrida-Debts.md) | Treino-Corrida | Sem críticos | Gaps de validação em campos fora da spec original (ritmo médio, data futura). |
| [StrengthSession-Treino-Forca-Debts.md](./StrengthSession-Treino-Forca-Debts.md) | Treino-Forca | Sem críticos | Cobertura de teste do guard defensivo de intensidade desconhecida; mesma lacuna de data futura. |
| [PainLog-Treino-Dor-Debts.md](./PainLog-Treino-Dor-Debts.md) | Treino-Dor | Sem críticos, 1 Importante | Divergência entre spec BDD (indicador "doeu" explícito) e o modelo de domínio implementado (apenas Date + Region); região como texto livre sem vocabulário controlado. |
| [OverloadDetectionService-Sobrecarga-Debts.md](./OverloadDetectionService-Sobrecarga-Debts.md) | Sobrecarga | Sem críticos, 2 Importantes | Mensagem de sugestão fixa/não personalizada; caso de borda `previousRunningLoad == 0` sem teste dedicado. Threshold de 110% e pesos de intensidade já assumidos como "sujeitos a calibração" na própria ADR-001 — não tratados como débito, mas como risco de produto já mitigado. |

## Como usar

Cada documento segue: Resumo Executivo → Problemas por Criticidade (🔴 Críticos / 🟡 Importantes / 🟢 Menores) → Plano de Ação → User Stories acionáveis com critérios de aceite e roteiro de teste. Nenhum item aqui listado bloqueia o uso atual do sistema — são oportunidades de robustez e evolução, não bugs em produção.
