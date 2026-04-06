# Design Tokens & Variables

Toda la paleta vive en un único bloque `@theme` en `src/index.css`. Tailwind v4 lee ese bloque y genera automáticamente las clases utilitarias (`bg-*`, `text-*`, `border-*`, etc.) con los valores hex reales.

## Regla de oro

**Siempre usar clases Tailwind o `var(--color-*)` en `style` props. Nunca hardcodear hex.**

```tsx
// Correcto
<span className="text-primary" />
<div className="bg-surface-container-high" />
<div style={{ color: 'var(--color-primary)' }} />   // cuando className no alcanza

// Incorrecto
<span style={{ color: '#ff8f6f' }} />
```

## Por qué NO usar `@theme inline` ni `:root` HSL

El setup antiguo de shadcn usaba:
```css
:root { --primary: 15 100% 72%; }           /* valores HSL crudos */
@theme inline { --color-primary: var(--primary); }  /* sobreescribe @theme */
```
Esto hace que `text-primary` genere `color: 15 100% 72%` — **un color inválido en CSS**. Todo se rompe en silencio.

La solución (igual que en `ctz-frontend`): definir todo en `@theme` con hex reales, sin `@theme inline` ni `:root` HSL.

---

## Superficies

| Variable | Valor | Clase Tailwind |
|---|---|---|
| `--color-background` | `#0e0e0e` | `bg-background` |
| `--color-surface` | `#0e0e0e` | `bg-surface` |
| `--color-surface-container-lowest` | `#000000` | `bg-surface-container-lowest` |
| `--color-surface-container-low` | `#131313` | `bg-surface-container-low` |
| `--color-surface-container` | `#191a1a` | `bg-surface-container` |
| `--color-surface-container-high` | `#1f2020` | `bg-surface-container-high` |
| `--color-surface-container-highest` | `#262626` | `bg-surface-container-highest` |
| `--color-surface-bright` | `#2c2c2c` | `bg-surface-bright` |

Escala de elevación: `background` → `lowest` → `low` → `container` → `high` → `highest` → `bright`

---

## Color primario (naranja)

| Variable | Valor | Clase Tailwind | Uso |
|---|---|---|---|
| `--color-primary` | `#ff8f6f` | `text-primary` `bg-primary` `border-primary` | Color de marca principal |
| `--color-primary-action` | `#FF5722` | `text-primary-action` `bg-primary-action` | Botones CTA, acentos activos |
| `--color-primary-foreground` | `#5c1400` | `text-primary-foreground` | Texto sobre fondo primario |
| `--color-primary-container` | `#ff7851` | `bg-primary-container` | Contenedores con tono primary |
| `--color-on-primary` | `#5c1400` | `text-on-primary` | Texto directo sobre primary |
| `--color-accent` | `#FF5722` | `text-accent` `bg-accent` | Alias shadcn de primary-action |
| `--color-ring` | `#ff8f6f` | `ring-ring` | Focus rings |

---

## Texto

| Variable | Valor | Clase Tailwind | Uso |
|---|---|---|---|
| `--color-foreground` | `#ffffff` | `text-foreground` | Texto principal (alias shadcn) |
| `--color-on-surface` | `#ffffff` | `text-on-surface` | Texto principal (nombre propio) |
| `--color-on-surface-variant` | `#acabaa` | `text-on-surface-variant` | Texto secundario / labels |
| `--color-muted-foreground` | `#acabaa` | `text-muted-foreground` | Alias shadcn de on-surface-variant |

---

## Tokens semánticos shadcn

Estos nombres son los que usan los componentes de shadcn/ui internamente.

| Variable | Valor | Clase Tailwind |
|---|---|---|
| `--color-card` | `#131313` | `bg-card` |
| `--color-card-foreground` | `#ffffff` | `text-card-foreground` |
| `--color-popover` | `#131313` | `bg-popover` |
| `--color-popover-foreground` | `#ffffff` | `text-popover-foreground` |
| `--color-secondary` | `#1f2020` | `bg-secondary` |
| `--color-secondary-foreground` | `#ffffff` | `text-secondary-foreground` |
| `--color-muted` | `#191a1a` | `bg-muted` |
| `--color-border` | `#484848` | `border-border` |
| `--color-input` | `#1f2020` | `bg-input` `border-input` |
| `--color-destructive` | `#ff716c` | `text-destructive` `bg-destructive` |

---

## Error

| Variable | Valor | Clase Tailwind | Uso |
|---|---|---|---|
| `--color-error` | `#ff716c` | `text-error` | Mensajes de error inline |
| `--color-error-container` | `#9f0519` | `bg-error-container` | Fondo de banners de error |
| `--color-on-error-container` | `#ffa8a3` | `text-on-error-container` | Texto sobre error-container |

---

## Bordes y utilidades

| Variable | Valor | Clase Tailwind | Uso |
|---|---|---|---|
| `--color-outline` | `#767575` | `border-outline` | Bordes medios |
| `--color-outline-variant` | `#484848` | `border-outline-variant` | Bordes sutiles, dividers |

---

## Tipografía

| Variable | Font | Uso | Clase Tailwind |
|---|---|---|---|
| `--font-sans` / `--font-body` | Plus Jakarta Sans Variable | Cuerpo de texto base | `font-sans` `font-body` |
| `--font-display` / `--font-heading` | Lexend Variable | Títulos y headlines | `font-display` `font-heading` |

```tsx
// Headline
<h1 className="font-display font-bold" />

// Cuerpo (default — no hace falta poner la clase)
<p className="font-body" />
```

---

## Radios

| Variable | Valor | Clase Tailwind |
|---|---|---|
| `--radius-sm` | `0.3rem` | `rounded-sm` |
| `--radius-md` | `0.4rem` | `rounded-md` |
| `--radius-lg` | `0.5rem` | `rounded-lg` |
| `--radius-xl` | `0.7rem` | `rounded-xl` |
| `--radius-2xl` | `0.9rem` | `rounded-2xl` |
| `--radius-3xl` | `1.1rem` | `rounded-3xl` |
| `--radius-4xl` | `1.3rem` | `rounded-4xl` |

---

## Scrollbars

Los scrollbars de webkit usan las variables del tema automáticamente:

- **Track**: `--color-surface-container-low` (`#131313`)
- **Thumb**: `--color-outline-variant` (`#484848`) → hover: `--color-primary` (`#ff8f6f`)

No requieren configuración extra — se aplican globalmente desde `index.css`.

---

## Sidebar

Tokens reservados para cuando se implemente la navegación principal.

| Variable | Valor |
|---|---|
| `--color-sidebar` | `#131313` |
| `--color-sidebar-foreground` | `#ffffff` |
| `--color-sidebar-primary` | `#ff8f6f` |
| `--color-sidebar-border` | `#484848` |

---

## Charts

| Variable | Valor | Uso sugerido |
|---|---|---|
| `--color-chart-1` | `#ff8f6f` | Serie principal |
| `--color-chart-2` | `#FF5722` | Serie secundaria |
| `--color-chart-3` | `#ff7851` | Serie terciaria |
| `--color-chart-4` | `#acabaa` | Serie neutral |
| `--color-chart-5` | `#767575` | Serie tenue |
