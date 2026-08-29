# ADR-017: Cor de erro no Nocturne

> **Data**: 2026-08-29
> **Status**: Accepted
> **Story**: STORY-017
> **Decisores**: Produto e Engenharia Steady

## Contexto

O Nocturne nasceu com uma paleta deliberadamente estreita: fundo `#161826`,
superfície `#232532`, texto `#e9e9ed` e uma rampa accent roxa. A regra escrita
no topo de `src/steady-app/src/theme/nocturne.ts` e repetida no `STACK.md` é
que o accent é "linha e brilho, nunca preenchimento amplo", e que **nenhum hex
solto** aparece na UI.

Até a STORY-017, erro de preenchimento não existia como estado visual. O app
comunicava falha por texto no `NoticeStrip` — uma faixa no topo da tela, feita
de superfície com contorno em `accentRamp[700]`. Isso funcionava enquanto a
mensagem era sobre a operação inteira ("não foi possível publicar a ficha").

A ficha do personal quebrou essa premissa. São três treinos com N exercícios de
cinco campos cada, mais três dias de corrida com sete campos cada — mais de
cinquenta campos numa tela só. Uma frase no topo não diz **onde** está o
problema, e o personal precisava fazer round-trip HTTP para descobrir.

O estado de erro precisa, então, morar no campo. E aí surge o conflito: o único
sinal visual disponível no sistema era o accent, que já significa foco,
destaque e ação primária. Um campo inválido pintado de accent fica
indistinguível de um campo em foco.

## Decisão

Entra no Nocturne uma rampa `danger` própria, restrita a estado de erro:

```
danger: { 300: '#f5a3a3', 500: '#e05252', 900: '#3a1f24' }
```

Os três degraus seguem a lógica das rampas existentes em fundo escuro: `900`
para preenchimento tingido, `500` para borda, `300` para texto sobre o
tingimento.

O uso é **exclusivamente estado de erro** — campo inválido e a mensagem que o
acompanha. `danger` não é decoração, não é ênfase e não é alerta genérico.
Aviso que não é erro continua no `NoticeStrip` com o accent.

A divisão de responsabilidade entre os dois canais fica:

| Canal | O que comunica |
|-------|----------------|
| Campo em `danger` | O que este campo tem de errado |
| `NoticeStrip` no topo | O que não pertence a campo algum: falha de rede, conflito, rejeição do backend |

O ponto de aplicação é único: `src/ui/Field.tsx` ganha a prop `error?: string`.
Nenhuma tela pinta erro por conta própria.

## Consequências

**Positivas**

- O personal vê exatamente qual campo corrigir, sem esperar a API.
- Qualquer formulário do app herda o estado de erro adotando `Field` com `error`.
- O accent volta a significar uma coisa só.

**Negativas**

- A paleta do Nocturne cresce, e o `styles.css` do design system em
  `Marathon training app design/_ds/` passa a estar defasado em relação ao
  `nocturne.ts` até ser atualizado.
- Vermelho sobre fundo escuro tem contraste mais delicado que o accent; os
  valores escolhidos foram calibrados para o fundo `#161826` e não devem ser
  reutilizados em superfície clara sem revisão.

**Neutras**

- Telas que hoje comunicam erro pelo `NoticeStrip` continuam válidas: migrar
  cada uma para erro por campo é trabalho de outra story.
