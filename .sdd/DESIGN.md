# Design System

```yaml
system: material-3
override: false
seed_color: "#6750A4"
```

## Quando `override: false` — Material Design 3

### Cores

Use tokens semânticos — nunca cores hardcoded:

`primary` / `onPrimary` / `primaryContainer` / `onPrimaryContainer`
`secondary` / `surface` / `error` / `outline`

Gere o scheme a partir da seed color via Material Theme Builder.

### Tipografia (M3 Type Scale)

display (Large/Medium/Small) · headline · title · body · label

### Shape

extraSmall: 4dp · small: 8dp · medium: 12dp · large: 16dp · extraLarge: 28dp · full: 50%

### Elevation

Tone-based (não shadow-based). Level 0 (surface) → Level 3 (dialogs/FABs).

### Acessibilidade (obrigatório)

Contraste mínimo 4.5:1 (AA). Touch targets 48dp. Focus indicators visíveis. Labels ARIA. Respeitar `prefers-reduced-motion`.

### Responsividade (obrigatório)

Mobile-first. Breakpoints: compact (<600dp), medium (600-840dp), expanded (>840dp).

## Override — Design System Customizado

Mude `override: true` e substitua as seções acima com os tokens do cliente. Mantenha: princípios, tokens, componentes, acessibilidade, responsividade.

## Regras

1. Leia este arquivo antes de gerar qualquer código de UI.
2. Nunca misture design systems.
3. Sempre use tokens semânticos.
4. Acessibilidade não é opcional.
