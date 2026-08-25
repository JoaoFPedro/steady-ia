# ADR-008 — Roles, vínculo e autorização do personal

> Status: Aceita
> Data: 2026-08-24
> Contexto: STORY-013 · DISC-004
> Complementa: ADR-002

## Contexto

A ADR-002 isola todo dado pelo `CorredorId` derivado do `sub` do Google. A
STORY-013 introduz um segundo usuário que precisa ler dados físicos: o personal.
Conhecer e-mail ou identificador de um corredor não pode conceder esse acesso.

Uma conta pode tecnicamente possuir as roles `Corredor` e `Personal`, embora o
provisionamento operacional do MVP não atribua ambas ao mesmo e-mail. Um
personal acompanha vários corredores; um corredor possui no máximo um vínculo
ativo e pode receber várias solicitações pendentes.

## Decisão

- Manter autenticação exclusivamente pelo Google `sub`.
- Persistir roles na conta e exigir `Personal` em endpoints profissionais.
- Usar e-mail apenas para localizar o candidato ao vínculo, nunca como
  identidade ou autorização.
- Liberar ficha e histórico somente quando existir vínculo `Active` entre os
  IDs autenticado e alvo.
- Aceitar uma solicitação ativa o vínculo e expira as demais pendentes daquele
  corredor de forma atômica.
- Encerrar o vínculo revoga imediatamente o acesso do personal, sem apagar os
  dados do corredor.
- Filtrar autorização na query/repository; nunca buscar dados amplos para
  filtrar em memória.

O provisionamento da role `Personal` é administrativo e fica fora da API
pública do MVP. Contas existentes e novas continuam recebendo `Corredor` por
padrão; não existe endpoint de autoelevação de privilégio.

## Consequências

- Um personal não vinculado recebe `404` para recursos identificados do
  corredor, evitando confirmar existência; operações claramente proibidas por
  role retornam `403`.
- Busca por e-mail informa “Corredor não encontrado”, conforme decisão de
  produto, embora isso permita enumeração limitada de contas. Rate limiting é
  recomendado antes de produção pública.
- Testes de integração precisam provisionar a role `Personal` diretamente no
  banco, simulando o processo administrativo.

