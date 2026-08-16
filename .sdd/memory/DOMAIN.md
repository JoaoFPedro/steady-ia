# Domínio do Projeto

> Gerado por `/onboard`. Assistentes de IA: consulte para entender o domínio.

## Entidades

<!-- Models/entities do projeto com campos principais -->

| Entidade | Campos principais | Descrição |
|----------|------------------|-----------|
| Corredor | [a definir em /spec] | Usuário do app, corredor amador |
| Plano de Treino | [a definir em /spec] | Sequência de sessões derivada de um Objetivo de Corrida |
| Sessão de Treino | [a definir em /spec] | Um treino planejado dentro do Plano |
| Objetivo/Meta de Corrida | [a definir em /spec] | Data-alvo + distância desejada pelo Corredor |
| Registro de Desempenho | [a definir em /spec] | Dados reais de uma Sessão de Treino realizada |

## Fluxos principais

<!-- Os 3-5 fluxos mais importantes do sistema -->

[a definir em /feature]

## Fronteiras externas

<!-- Onde o sistema se conecta com o mundo externo -->

| Tipo | Nome | Descrição |
|------|------|-----------|
| Identity Provider (OAuth) | Google Sign-In | Autenticação de usuário no MVP |
| API nativa do device | GPS (Expo Location) | Rastreamento de rota/corrida durante a Sessão de Treino |
| Banco de dados | PostgreSQL | Persistência do domínio |
