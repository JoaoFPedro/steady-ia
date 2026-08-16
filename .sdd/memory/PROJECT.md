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

## Links

- Repositório: 
- Board: 
- Docs: 
