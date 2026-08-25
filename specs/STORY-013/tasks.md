# Tasks — STORY-013

## 1. Decisões e domínio

- [x] Registrar ADR de roles, vínculo e autorização.
- [x] Registrar ADR de ficha ativa substituível e execução imutável.
- [x] Implementar roles, vínculo, ficha e execução no domínio por TDD.

## 2. Persistência e API

- [x] Persistir roles, vínculos, fichas ativas e execuções atômicas.
- [x] Criar migration da STORY-013.
- [x] Implementar endpoints de vínculo com autorização por role.
- [x] Implementar publicação, leitura da ficha e histórico autorizado.
- [x] Implementar registro idempotente da execução completa.
- [x] Cobrir isolamento entre corredores/personals e erros de contrato.

## 3. Aplicativo

- [x] Adicionar contratos de coaching e cache da ficha ativa.
- [x] Implementar fila offline para execução completa.
- [x] Implementar validação de carga, pulados, nota e sugestão.
- [x] Implementar áreas de personal e corredor conforme roles.
- [x] Integrar corrida ao formulário existente.

## 4. Fechamento

- [x] Executar testes .NET e Jest, typecheck e cobertura.
- [x] Atualizar mapping cenário → teste e critérios de aceite.
- [x] Executar `/review` automático com OWASP Top 10.
