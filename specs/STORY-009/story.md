# Story: STORY-009 — E-mail do corredor persistido no backend

Discovery: — (sem discovery associado, ver *Contexto*)

## Descrição

Como **quem opera e dá suporte ao Steady**,
Quero **que o e-mail da conta Google fique guardado na linha do corredor**,
Para que **eu consiga saber de quem é um registro ao olhar o banco, sem ter
que cruzar um `sub` opaco com o Google Cloud**.

## Contexto

Hoje `corredores` guarda só `id`, `google_sub` e `created_at`. O `google_sub`
é o claim `sub` do ID token — estável e correto como identidade (ADR-002),
mas ilegível: `114037…` não diz quem é. Nome, e-mail e foto existem apenas no
aparelho (`AccountIdentity`, `src/steady-app/src/auth/googleSession.ts`),
alimentam o menu de perfil da STORY-005 e **nunca chegam à API**.

Com o banco agora acessível por console (Supabase), olhar o dado virou parte
do fluxo de trabalho — e é aí que o `sub` opaco atrapalha.

**Nenhuma funcionalidade de produto depende disto.** É dado operacional. Foi
levantado que e-mail é dado pessoal e que a Constituição §3 trata os dados do
corredor como sensíveis; a decisão de guardar assim mesmo é do produto, e as
restrições que a acompanham estão nas regras 1, 6 e 7 da spec.

## Critérios de Aceite

- [x] `corredores` ganha coluna `email`, anulável, **sem índice único**
- [x] Primeiro acesso de um corredor grava o e-mail do claim do ID token
- [x] E-mail trocado na conta Google é atualizado no acesso seguinte
- [x] Token sem claim de e-mail não apaga o e-mail já guardado
- [x] `google_sub` continua sendo o único identificador — dois `sub`
      diferentes com o mesmo e-mail continuam sendo dois corredores
- [x] O e-mail nunca aparece em log

## Estimativa

- **Tamanho**: S
- **Complexidade**: Baixa — uma coluna, uma migration, e alargar o contrato do
  validador de token para carregar o e-mail junto do `sub`.

## Dependências

| Tipo | Descrição | Status |
|------|-----------|--------|
| ADR | ADR-002 — identidade pelo `sub`, nunca por e-mail | ✅ Accepted (esta story não o altera) |

## Notas

O app **não muda**: `GoogleSignin.configure({ webClientId })` já usa os escopos
padrão (`email`, `profile`), então o ID token que a API recebe já traz o claim
`email`. Nada de novo trafega na rede.
