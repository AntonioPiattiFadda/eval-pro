# EvalPro — Spec: Session Wizard (Entrada + Anamnesis Fase 1)

**Fecha:** 2026-04-06  
**Estado:** Aprobado  
**Sprint scope:** Página de entrada de sesión + Anamnesis Fase 1. Sin banderas rojas.

---

## Contexto

Al hacer doble click en un turno en `AppointmentList`, el profesional navega a una página de sesión clínica. La sesión es el "contacto clínico" — diferente del `appointment` que es la agenda/scheduling.

El flujo completo del sistema (Fase 2, Tests, Scoring, Diagnóstico, Intervenciones, Evolución) queda para sprints futuros. Este sprint construye la base del wizard y los primeros dos pasos.

---

## Routing

Ambas rutas viven bajo `ProfesionalLayout` con `RoleAuth` igual que las rutas profesionales existentes.

```
/professional/sessions/:sessionId                  ← Entrada (info paciente + historial)
/professional/sessions/:sessionId/anamnesis-fase1  ← Fase 1 (4 preguntas + región + dominio)
```

Rutas futuras (no implementadas en este sprint):
```
/professional/sessions/:sessionId/anamnesis-fase2
/professional/sessions/:sessionId/tests
/professional/sessions/:sessionId/resultados
```

---

## Flujo completo

```
[AppointmentList]
  doble click en turno
       ↓
  createDraftSession({ patientId, professionalId, appointmentId })
  → sessions INSERT con status='DRAFT', region/domain/objective nullable
  → navega a /professional/sessions/:sessionId
       ↓
[SessionPage]  ←─────────────────────────────────────┐
  PatientCard (nombre, email, DNI)                    │ botón "← Volver"
  SessionHistory (sesiones anteriores del paciente)   │ o browser back
  WizardProgress (paso 1 de N)                        │
  botón "Iniciar evaluación →"                        │
       ↓                                              │
[AnamnesisPhase1Page] ───────────────────────────────-┘
  WizardProgress (paso 2 de N)
  selector Región (auto-save onChange)
  selector Dominio (auto-save onChange)
  4 preguntas con opciones (auto-save onChange)
  SaveIndicator ("Guardando…" / "✓ Guardado" / "Error")
  botón "← Anterior" | botón "Continuar →" (disabled hasta completar)
       ↓
  [Fase 2 — sprint futuro]
```

---

## Auto-save

Todas las selecciones en Fase 1 se guardan en la DB inmediatamente al cambiar (`onChange`), sin botón de guardar explícito. El botón "Continuar" solo navega — los datos ya están guardados.

- Sin toast por cada cambio individual (ruidoso)
- `SaveIndicator` en el corner del formulario: "Guardando…" → "✓ Guardado" | "Error al guardar"
- Si hay error en un auto-save, el indicador lo muestra — el usuario puede reintentar cambiando el valor o recargando
- Si hay campos de texto libre en fases futuras, aplicar debounce de 500ms

Al volver atrás y navegar de nuevo a Fase 1, el formulario pre-carga desde la DB (`anamnesis_answers` existentes para esa sesión).

---

## Sesión DRAFT

La sesión se crea como `DRAFT` al iniciar el flujo desde `AppointmentList`. Ciclo de vida:

```
DRAFT → IN_PROGRESS (al guardar primera respuesta en Fase 1) → COMPLETED (sprint futuro)
```

Sesiones `DRAFT` abandonadas quedan en DB — no se limpian automáticamente en este sprint. El campo `status` en `sessions` soporta este ciclo.

Cuando el profesional selecciona región o dominio en Fase 1, se actualiza en `sessions` directamente (no se espera al final).

---

## Estructura de archivos

```
src/pages/sessions/
  SessionPage.tsx                     ← página de entrada
  AnamnesisPhase1Page.tsx             ← Fase 1
  components/
    PatientCard.tsx                   ← info del paciente (nombre, email, DNI)
    SessionHistory.tsx                ← historial de sesiones anteriores
    WizardProgress.tsx                ← barra de progreso con pasos
    AnamnesisPhase1Form.tsx           ← formulario Fase 1 con auto-save
    SaveIndicator.tsx                 ← widget "Guardando…" / "✓ Guardado"
  services/
    sessions.service.ts               ← createDraftSession, updateSessionFields, getSession, getSessionsByPatient
    anamnesis.service.ts              ← getPhase1Questions, upsertAnswer
  types/
    session.types.ts
```

---

## Queries por página

### SessionPage

| Query | Tabla(s) | Datos |
|---|---|---|
| `getSession(sessionId)` | `sessions` | status, patient_id, professional_id — valida que la sesión pertenece al profesional activo |
| `getPatient(patientId)` | `patients + users JOIN` | full_name, email, identification_number |
| `getSessionsByPatient(patientId)` | `sessions` | fecha, dominio, región, status — ordenadas por fecha desc |

Si `sessionId` no existe o no pertenece al profesional activo → redirigir a `/professional/agenda`.

### AnamnesisPhase1Page

| Query | Tabla(s) | Datos |
|---|---|---|
| `getPhase1Questions()` | `anamnesis_phase1_questions` | id, text, opciones de respuesta — cacheadas con React Query (staleTime largo) |
| `getExistingAnswers(sessionId)` | `anamnesis_answers` | pre-rellena el formulario si el profesional ya guardó antes |
| `getDomains()` | `domains` | catálogo seeded |
| `getRegions()` | `regions` | catálogo seeded |

### Guardado en Fase 1

Cada `onChange` dispara:
- Región/Dominio: `UPDATE sessions SET region_id/domain_id WHERE session_id`
- Respuesta a pregunta: `UPSERT anamnesis_answers (session_id, question_id, answer_value)` — el UNIQUE en `(session_id, question_id)` garantiza upsert limpio

---

## Componentes UI

### WizardProgress

Barra de progreso en el top de todas las páginas de sesión. Recibe `currentStep` y la lista de pasos definidos. Los pasos futuros se muestran como disabled (contexto visual del flujo completo).

```
Entrada  ──●──  Fase 1  ──○──  Fase 2  ──○──  Tests
```

### AnamnesisPhase1Form

- Selector de región: dropdown con valores de `regions`
- Selector de dominio: dropdown con valores de `domains`
- 4 preguntas: cada una con sus opciones como radio group
- Cada cambio dispara auto-save y actualiza `SaveIndicator`
- Botón "Continuar →" disabled hasta que región, dominio y las 4 preguntas estén respondidas

### PatientCard

Muestra: nombre completo, email, número de identificación (DNI). Sin acciones — solo informativa.

### SessionHistory

Lista de sesiones anteriores del paciente (excluyendo la sesión actual). Columnas: fecha, dominio, región, estado. Si no hay sesiones anteriores: mensaje "Primera sesión con este paciente".

---

## Modificaciones a archivos existentes

### `AppointmentList.tsx`
- Agregar prop `onDoubleClick?: (appointment: Appointment) => void`
- Agregar `onDoubleClick` handler en cada fila del listado

### `AgendaPage.tsx`
- Implementar el callback `handleAppointmentDoubleClick(appointment)`
- Llama a `createDraftSession` → navega a `/professional/sessions/:id`
- Toast loading/success/error con patrón CLAUDE.md

### `App.tsx`
- Agregar rutas `/professional/sessions/:sessionId` y `/professional/sessions/:sessionId/anamnesis-fase1` bajo el `RoleAuth` de profesionales

---

## Migración de base de datos requerida

La tabla `sessions` actual no soporta sesiones DRAFT. Se necesita una migración antes de implementar:

```sql
-- 1. Hacer nullable los campos que se completan en Fase 1
ALTER TABLE sessions
  ALTER COLUMN region_id DROP NOT NULL,
  ALTER COLUMN domain_id DROP NOT NULL,
  ALTER COLUMN objective_id DROP NOT NULL;

-- 2. Agregar campo status
CREATE TYPE session_status AS ENUM ('DRAFT', 'IN_PROGRESS', 'COMPLETED');
ALTER TABLE sessions ADD COLUMN status session_status NOT NULL DEFAULT 'DRAFT';
```

---

## Fuera de scope en este sprint

- Banderas rojas
- Anamnesis Fase 2
- Tests (Fase 3)
- Motor de scoring
- Diagnóstico y intervenciones
- Evolución entre sesiones
- Limpieza de sesiones DRAFT abandonadas
- Creación de sesiones sin appointment previo
