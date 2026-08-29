# Spec BDD: STORY-019 — Nome do corredor na visão do personal e km decimal na ficha

> **Status**: Implemented · **Data**: 2026-08-29
> Pedido direto do usuário, sem discovery.

## Feature 1: O personal vê o nome, não o e-mail

### Decisões de produto

1. O nome vem do claim `name` do Google — **cache do provedor**, como o e-mail
   (ADR-002): serve para exibir, nunca para identificar.
2. O e-mail continua sendo o identificador da **busca**: o personal encontra o
   corredor por e-mail, como antes.
3. Sem nome, exibe o e-mail. Nenhum corredor fica sem identificação.
4. Onde o nome aparece, o e-mail vira linha secundária — o personal ainda
   precisa dele para confirmar que é a pessoa certa.
5. O nome se atualiza sozinho no acesso seguinte do corredor, pelo mesmo
   caminho que já sincronizava o e-mail. Claim ausente **não apaga** o guardado.
6. A lista de vinculados passa a ordenar pelo que o personal lê: nome quando
   existe, e-mail enquanto não.

```gherkin
Scenario: Personal vê o nome do corredor vinculado
  Given que o corredor entrou no app com o nome no perfil do Google
  When o personal abre a lista de corredores vinculados
  Then o nome do corredor é exibido
  And o e-mail continua disponível como identificador
```

```gherkin
Scenario: Corredor sem nome continua identificado pelo e-mail
  Given que o corredor não concedeu o nome
  When o personal busca por ele
  Then o e-mail é exibido no lugar do nome
```

```gherkin
Scenario: Nome chega no acesso seguinte
  Given que a conta foi criada antes desta story, sem nome
  When o corredor entra no app de novo
  Then o personal passa a ver o nome
```

## Feature 2: Quilometragem da ficha é um valor decimal

### Decisões de produto

7. A distância do dia é **um valor**, não faixa: o personal escreve "5,4 km".
   Duração e esforço seguem como faixa (ADR-012) — só a distância mudou.
8. Vírgula é separador decimal, como já era em `app/log/run.tsx`. Ponto também
   é aceito.
9. Campo em branco continua ausente, nunca zero.

```gherkin
Scenario: Personal prescreve 5,4 km
  When informa "5,4" na quilometragem do sábado
  Then a distância é registrada como 5,4 km
  And nenhum máximo é inventado
```

```gherkin
Scenario: Quilometragem não numérica é realçada no campo
  When informa "meia maratona" na quilometragem
  Then o campo de quilometragem fica realçado
```

```gherkin
Scenario: Quilometragem em branco fica ausente
  When publica a ficha sem informar a quilometragem
  Then o dia fica sem distância prescrita
```
