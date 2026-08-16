# Story: STORY-002 — Expor a lógica de treino via API e persistir dados

Discovery: .discovery/DISC-001-musculacao-e-corrida/ (continuação da STORY-001)

## Descrição

Como **corredor que já uso o Steady**,
Quero **que meus registros de treino (corrida, musculação, dor) e minha avaliação de sobrecarga sejam salvos de forma permanente**,
Para que **eu não perca meu histórico entre sessões do app e receba recomendações baseadas nos meus dados reais, não só na memória do dispositivo**.

## Contexto

A STORY-001 entregou a lógica de domínio (`Steady.Domain`) com as regras de registro de treino e detecção de sobrecarga (ADR-001), totalmente testada em memória, sem persistência nem exposição via API. Esta story expõe essa lógica através de uma API .NET, com dados persistidos em PostgreSQL, para que qualquer cliente (o app mobile, em uma story futura) possa consumi-la. Escopo definido como **backend apenas** — o app mobile consumindo essa API fica para a STORY-003.

## Critérios de Aceite

- [ ] API expõe endpoint para registrar Sessão de Treino de Corrida, persistindo no PostgreSQL
- [ ] API expõe endpoint para registrar Sessão de Treino de Musculação, persistindo no PostgreSQL
- [ ] API expõe endpoint para registrar Registro de Dor, persistindo no PostgreSQL
- [ ] API expõe endpoint para consultar a avaliação de sobrecarga atual, calculada a partir do histórico persistido do corredor autenticado
- [ ] API expõe endpoint para consultar o histórico de treinos do corredor autenticado
- [ ] Toda requisição exige um ID token do Google válido; requisições sem token ou com token inválido são rejeitadas (401)
- [ ] Um Corredor é criado automaticamente no banco no primeiro login bem-sucedido (identificado pelo `sub` do Google)
- [ ] Nenhum corredor acessa dados de outro corredor — toda query filtra por `CorredorId` no banco (mandato inviolável da Constituição)

## Estimativa

- **Tamanho**: G
- **Complexidade**: Média

## Dependências

| Tipo | Descrição | Status |
|------|-----------|--------|
| Story | STORY-001 (Steady.Domain) | Concluída |
| Serviço | Google Sign-In (validação de ID token) | A integrar |

## Notas

Escopo explicitamente **backend-only** — decisão tomada no `/plan`. Autenticação valida o ID token do Google diretamente a cada requisição (sem JWT próprio), conforme ADR-002.
