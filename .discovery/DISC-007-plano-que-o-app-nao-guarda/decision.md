# Decisão — DISC-007: O plano existe na tela, não no Steady

> Data: 2026-08-28
> Decidido por: Jefferson
> Referências: `.discovery/DISC-007-plano-que-o-app-nao-guarda/problem.md` · `.discovery/DISC-007-plano-que-o-app-nao-guarda/hypothesis.md`

---

## Decisão

- [x] **Construir** → Story criada em `specs/STORY-016/`
- [ ] **Validar primeiro**
- [ ] **Diferir**
- [ ] **Descartar**

---

## Rationale

Recorte do DISC-005, aberto quando o planejamento da STORY-014 mostrou que a
comparação no servidor não alcança um arquivo do bundle. O problema se sustenta
sozinho: o plano ser conteúdo de tela e não dado do produto é uma lacuna
estrutural, independente da revisão que a expôs.

Construir agora porque a alternativa — o aplicativo enviar a prescrição junto do
registro — coloca a fonte da verdade no cliente e viola FF-004.

Esta decisão **não** reabre a geração de plano adiada em 2026-08-22. Transcrever
um documento que já existe não é derivá-lo de um `PlanRequest`. O que a story
constrói é o lugar onde o plano mora; o que continua adiado é quem o escreve.

O risco aceito é o da ADR-006, e é tratado por teste, não por atenção.

---

## Se Construir

**Story criada:** `specs/STORY-016/`

**Escopo acordado:**

- Documento de plano versionado e imutável, com associação por corredor.
- Seed com transcrição literal do documento atual.
- Campos numéricos só onde o texto-fonte os declara.
- Leitura pela API com cache offline e estado de falha explícito.

**O que fica fora desta versão:**

- Geração do plano a partir do `PlanRequest`.
- Personalização de conteúdo por corredor.
- Qualquer cálculo de progressão.
- Edição do plano pelo aplicativo.

---

## Aprendizados

- A lacuna estava visível em `DOMAIN.md` desde sempre — "Plano de Treino
  (gerado): não implementado" — e foi lida como pendência de geração, quando
  também era pendência de persistência.
- Persistir e gerar são decisões separadas, e confundi-las foi o que manteve o
  plano no bundle por mais tempo do que precisava.
- A ADR-006 continua sendo o registro mais útil do repositório: um erro
  preservado que impediu sua repetição em outra story, meses depois.
