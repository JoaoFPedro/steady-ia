# Memória do Projeto

> Assistentes de IA: leia este arquivo ANTES de qualquer ação.

## Identificação

- **Projeto**: Steady
- **Cliente**: Uso próprio / produto pessoal (MVP solo)

## Contexto

Steady ajuda corredores amadores que já correm 21km (meia maratona) a treinar com segurança para sua primeira maratona ou distâncias inferiores. O desenvolvedor é corredor há 4 anos, mas sem formação em fisiologia esportiva — por isso toda regra de progressão de treino deve se apoiar em fontes reconhecidas (regra dos 10%, periodização clássica), nunca em julgamento ad-hoc. MVP mobile (Expo/React Native) com backend .NET e PostgreSQL, autenticação via Google Sign-In e rastreamento de rota via GPS nativo. Horizonte de 2-3 meses para validar a hipótese com dezenas/centenas de usuários.

## Convenções

- **Branch**: `{type}/{story-id}-{descricao}`
- **Commits**: Conventional Commits
- **Testes**: Todo cenário BDD = pelo menos 1 teste automatizado

## Glossário

| Termo | Significado |
|-------|-------------|
| Corredor | Usuário do app — corredor amador com objetivo de completar uma corrida (meia maratona ou maratona) |
| Plano de Treino | Sequência de Sessões de Treino geradas a partir de um Objetivo de Corrida, respeitando progressão segura de volume |
| Sessão de Treino | Um treino individual dentro do Plano — planejado e, depois de realizado, registrado como Registro de Desempenho |
| Objetivo/Meta de Corrida | Data-alvo + distância que o Corredor quer completar — origem de todo Plano de Treino |
| Registro de Desempenho | Dados reais de uma Sessão de Treino realizada (ritmo, distância, rota GPS) — imutável após criado |
| Regra dos 10% | Princípio de treino: volume semanal não deve aumentar mais que 10% em relação à semana anterior, para prevenir lesão por overtraining |

## Estado Atual — 2026-08-16

**STORY-003 implementada e verde**: 74 testes Jest + 42 .NET (116). Todos os 17 cenários da spec marcados 🟢 e os 9 critérios de aceite fechados. ADR-004 (estado de histórico insuficiente no contrato da avaliação) criado nesta rodada.

Ambiente de execução local (WSL2, port proxy, dev build) documentado em `CLAUDE.md` → *Ambiente Local*; setup do Google em `docs/SETUP-LOGIN-GOOGLE.md`.

### Pendências

| # | Pendência | Por quê importa |
|---|-----------|-----------------|
| 1 | **Commit da STORY-003** — implementação, ADR-004, docs, `docker-compose.yml`, `CLAUDE.md` seguem no working tree | O repo tem 1 commit só (scaffold); todo o trabalho está sem histórico |
| 2 | **Validar login do Google no aparelho** | Nunca foi executado ponta a ponta. Build, client IDs e port proxy prontos; falta abrir o app |
| 3 | **Testar a fila offline no aparelho** (registrar → Wi-Fi off → registrar → Wi-Fi on) | Único caminho sem cobertura automatizada e o maior risco da story — a suposição crítica #2 do DISC-001 depende dela |
| 4 | **Telas sem teste de renderização** | `@testing-library/react-native` não instala: exige `react-dom@19.2.8`, incompatível com o `react@19.2.3` do Expo SDK 57. Revisitar quando o SDK avançar |
| 5 | **Divergência herdada de `PainLog`** — dor não vinculada a Sessão de Treino, contra o AC da STORY-001 | Decisão do `/spec` foi manter independente; cabe ao `/sync` alinhar o AC da STORY-001 ao modelo real |

## Links

- Repositório: 
- Board: 
- Docs: 
