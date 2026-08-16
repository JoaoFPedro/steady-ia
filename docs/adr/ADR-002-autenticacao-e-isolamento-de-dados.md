# ADR-002: Autenticação via ID token do Google e isolamento de dados por corredor

> **Data**: 2026-08-09
> **Status**: Accepted
> **Story**: STORY-002
> **Decisores**: Jefferson

## Contexto

A API precisa autenticar cada requisição e garantir que um corredor nunca acesse dados de outro — mandato inviolável da `PROJECT-CONSTITUTION.md` (dados de saúde/localização não podem ser expostos entre usuários) e item A01 (Broken Access Control) do checklist OWASP do PLAYBOOK. O MVP usa exclusivamente Google Sign-In (sem senha própria), decisão já registrada na Constituição.

## Opções Consideradas

### Opção A: API valida o ID token do Google diretamente a cada requisição

- **Prós**: Sem estado de sessão para gerenciar no backend; sem necessidade de refresh/revogação própria; menos código para um dev solo manter; a validação do token do Google já garante integridade e expiração.
- **Contras**: Cada requisição paga o custo de validação do token (mitigado — a validação é local via chave pública do Google, cacheada pela biblioteca, sem round-trip de rede por requisição); token do Google tem escopo amplo (login), não é pensado para ser um token de API de longa duração.

### Opção B: Backend emite um JWT próprio após validar o login do Google uma vez

- **Prós**: Mais controle sobre expiração, claims customizadas e revogação.
- **Contras**: Mais complexidade de implementação (emissão, refresh, revogação, chave de assinatura) — custo desproporcional para um MVP solo com escala de dezenas/centenas de usuários.

## Decisão

Escolhemos **Opção A** — a API valida o ID token do Google (via `Google.Apis.Auth.GoogleJsonWebSignature`) em cada requisição, extraído do header `Authorization: Bearer {token}`. O claim `sub` (subject) do token identifica o Corredor de forma estável.

**Isolamento de dados**: todo repositório recebe o `CorredorId` (derivado do `sub` do token validado) e filtra por ele diretamente na query — nunca busca todos os registros e filtra depois em memória. Tentativas de acessar um recurso de outro corredor (ex: por ID direto) retornam **404**, não 403 — não revela que o recurso existe (Playbook A01).

**Provisionamento automático**: se não existir um Corredor com o `sub` do token, um novo é criado antes de processar a requisição (upsert), sem tela de cadastro separada.

**Restrição de audiência** (adicionado em 2026-08-16, durante a STORY-003): a validação informa `ValidationSettings.Audience` com o client ID do Steady. Sem isso a biblioteca do Google **não verifica o claim `aud`** e aceita qualquer ID token válido do Google — inclusive um emitido para outro aplicativo, o que permitiria autenticar como um corredor usando um token obtido fora do Steady, violando o mandato inviolável de não expor dados de saúde entre usuários. A implementação original omitia esse ajuste; a omissão era invisível em runtime, porque tokens legítimos continuavam funcionando.

O client ID vem de `Google:ClientId` na configuração e a API **se recusa a subir** sem ele (`Program.cs`). Falhar fechado é deliberado: um default silencioso reintroduziria a falha sem sinal algum.

## Consequências

### Positivas

- Zero gerenciamento de sessão/token próprio — menos superfície de ataque para um dev solo manter
- Isolamento de dados garantido de forma consistente (filtro por `CorredorId` no banco, não em memória)
- Provisionamento automático elimina fluxo de cadastro redundante

### Negativas

- Acoplamento ao Google como único identity provider — trocar ou adicionar outro provider no futuro exige revisão desta decisão
- Token do Google precisa ser reenviado pelo app a cada requisição (sem sessão de longa duração no backend) — aceitável para MVP, app mobile já mantém o token do Google Sign-In em cache local

### Riscos

- Token do Google expirado/inválido rejeitado incorretamente (falso negativo) → mitigação: usar a biblioteca oficial do Google para validação, que trata expiração e rotação de chaves automaticamente
- Falha ao filtrar por `CorredorId` em uma nova query (erro humano futuro) → mitigação: todo repositório novo deve seguir o mesmo padrão desta ADR; revisão em `/review` cobre A01 explicitamente

## Referências

- `.sdd/PROJECT-CONSTITUTION.md` — Mandatos invioláveis (autenticação exclusiva via Google Sign-In; dados nunca expostos entre usuários)
- `.sdd/PLAYBOOK.md` — seção A01 (Broken Access Control)
- `specs/STORY-002/spec.bdd.md`
