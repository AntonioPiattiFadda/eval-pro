# Agenda — Vista de Día

## Resumen

Implementación del header secundario de navegación y la grilla de horarios para la vista `view=dia` de la agenda.

---

## Estado actual (2026-04-03)

La vista de día está funcional con:
- Navegación por fecha (toolbar secundario)
- Datepicker dos paneles
- Grilla de horarios con turnos cargados desde Supabase
- Indicador de hora actual en tiempo real (aislado para no rerenderizar la grilla)

---

## Arquitectura

### Componentes nuevos

| Archivo | Responsabilidad |
|---|---|
| `src/components/ui/calendar.tsx` | shadcn Calendar (react-day-picker v9) |
| `src/components/ui/popover.tsx` | shadcn Popover (radix-ui) |
| `src/pages/agenda/components/AgendaDayNav.tsx` | Header secundario: Hoy / flechas / datepicker |
| `src/pages/agenda/components/AgendaDatePicker.tsx` | Popover dos paneles: calendario mensual + grilla de meses |
| `src/pages/agenda/components/AgendaDayGrid.tsx` | Grilla de horas con turnos y hora actual |

### Archivos modificados

| Archivo | Cambio |
|---|---|
| `src/pages/agenda/AgendaPage.tsx` | Renderiza `AgendaDayNav` + `AgendaDayGrid` cuando `view=dia` |
| `src/pages/agenda/services/appointments.service.ts` | Agrega `getAppointmentsForDay(professionalId, date)` |
| `src/layouts/ProfesionalLayout.tsx` | `min-h-screen` → `h-screen`, `overflow-auto` → `overflow-hidden` en `<main>` |

---

## Estado de URL

Toda la navegación vive en URL search params — consistente con el `AgendaToolbar` existente:

| Param | Ejemplo | Descripción |
|---|---|---|
| `view` | `dia` | Modo de vista activo |
| `date` | `2026-04-03` | Fecha seleccionada (YYYY-MM-DD) |

`AgendaDayNav` setea `date` al día de hoy si el param está ausente.

---

## AgendaDayNav

Header `h-10` debajo del `AgendaToolbar`:

```
[ Hoy / Volver a hoy ]  [ < ]  [ > ]   3 Abril, 2026 ▾
```

- Botón **"Hoy"** cuando la fecha seleccionada es hoy, **"Volver a hoy"** cuando no lo es
- Flechas `<` `>` navegan de a un día
- El texto de fecha abre el `AgendaDatePicker`

---

## AgendaDatePicker

Popover con dos paneles:

**Panel izquierdo** — shadcn `Calendar` en modo `single`, locale `es` (react-day-picker v9):
- Mes actual con grilla L M X J V S D
- Día seleccionado con círculo primary
- Cambia el mes activo del panel derecho al navegar

**Panel derecho** — selector de mes/año:
- Flechas `< año >` para cambiar el año del panel derecho
- Grilla 4×3: Ene Feb Mar / Abr May Jun / Jul Ago Sep / Oct Nov Dic
- Click en mes → navega el calendario izquierdo a ese mes/año
- Ambos paneles están sincronizados

**Footer** — botón "Hoy" cierra el popover y selecciona hoy.

---

## AgendaDayGrid

### Layout y scroll

Cadena de alturas para que solo scrollee la grilla:
```
ProfesionalLayout  h-screen overflow-hidden
  └─ <main>        flex-1 overflow-hidden flex flex-col
       └─ AgendaPage  h-full flex flex-col
            ├─ AgendaToolbar    shrink-0
            ├─ AgendaDayNav     shrink-0
            └─ AgendaDayGrid    flex-1 overflow-hidden min-h-0
                 ├─ Day header  shrink-0
                 └─ scroll area flex-1 overflow-y-auto min-h-0  ← único scroll
```

**Nota crítica:** `min-h-0` es obligatorio en los contenedores flex para que `overflow-y-auto` se active. Sin él, el flex item no encoge por debajo de su contenido.

### Constantes

```ts
const START_HOUR = 0
const END_HOUR   = 23
const ROW_HEIGHT = 64   // px por hora
const PADDING_TOP = 32  // media hora de padding superior
const LABEL_W    = 64   // ancho de la columna de horas (px)
```

### Etiquetas de hora

Formato `HH:MM` (`00:00`, `01:00`… `23:00`), con `-mt-2` para que el texto se alinee sobre la línea del borde superior de la fila.

### Slots clickeables

Cada fila de hora se divide en dos mitades de 30 min:
- `:00` — hover `bg-primary/5`, muestra rango a la derecha en hover (`08:00 – 08:30`)
- `:30` — mismo comportamiento, separado por línea punteada

El hover usa el patrón `group` / `group-hover:opacity-100` (solo CSS, sin estado).

Callback: `onSlotClick?: (slotDate: Date) => void` — pendiente de conectar al wizard de nuevo turno.

### Turnos del día

Query: `getAppointmentsForDay(professionalId, date)` filtra por `start_at` entre `00:00:00` y `23:59:59` del día seleccionado (hora local).

Los bloques se posicionan absolutamente dentro del contenedor scrolleable:

```ts
top    = PADDING_TOP + (startHour - START_HOUR) * ROW_HEIGHT + (startMinute / 60) * ROW_HEIGHT
height = max((durationMinutes / 60) * ROW_HEIGHT, 22)
left   = LABEL_W + 2
right  = 8
```

Colores por estado:
| Estado | Clase |
|---|---|
| PENDING | `bg-primary/20 border-primary/40 text-primary` |
| CONFIRMED | `bg-green-500/20 border-green-500/40 text-green-700` |
| CANCELLED | `bg-destructive/10 text-destructive line-through` |
| COMPLETED | `bg-muted text-muted-foreground` |

Vista compacta (height < 40px): una sola línea con hora + nombre.

### Indicador de hora actual

**Componente aislado `CurrentTimeIndicator`** — tiene su propio `useState` y `setInterval(60s)`. Al ser un componente separado, solo él rerenderiza cada minuto; la grilla, las filas y los turnos no se tocan.

Posición: `top = PADDING_TOP + (h - START_HOUR) * ROW_HEIGHT + (m / 60) * ROW_HEIGHT`

Visual: texto naranja `HH:MM` + dot naranja + línea horizontal naranja de borde a borde.

Solo se renderiza cuando `isToday === true`.

Auto-scroll al montar: cuando es hoy, scrollea a `max(0, timeTop - 120)` para mostrar contexto arriba de la línea actual.

---

## Pendiente

- **Configuración de duración de turnos**: los slots son de 30 min hardcodeados. Cuando se defina la config de turnos, `AgendaDayGrid` recibe un prop `slotMinutes` (15 | 30 | 60) y se recalcula la subdivisión de filas.
- **Conectar `onSlotClick`**: abrir el wizard `NewAppointmentDialog` pre-llenado con la hora del slot.
- **Vista semana y mes**: `AgendaDayGrid` es solo para `dias=1`. Vistas multi-día son trabajo futuro.
