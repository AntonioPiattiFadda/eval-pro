# EvalPro — 11. Gestión de Turnos y Disponibilidad

## Resumen

El sistema de scheduling maneja disponibilidad de profesionales, horarios de locations y asignación de turnos a pacientes.

---

## Entidades

### `locations`
Espacios físicos donde se realizan sesiones. Pertenecen a una organización.

**Tipos (LOCATION_TYPE):** `GYM` | `REHAB_CENTER` | `CLINIC`

---

### `location_operating_hours`
Horarios de apertura de cada location por día de la semana (0=domingo, 6=sábado).

Permite consultar: *¿cuántas horas está abierto el gimnasio los lunes?*

---

### `weekly_availability`
Disponibilidad recurrente de un profesional por día de la semana.

- `location_id` nullable — profesionales sin location fija (ej: kinesiólgo a domicilio) no la tienen.
- `valid_from` / `valid_until` — período de vigencia del template. `valid_until` null = vigente indefinidamente.
- Sin UNIQUE constraint — el mismo profesional puede tener múltiples períodos para el mismo día (desvinculación y revinculación).

Permite consultar: *¿qué horas cubre el profe de ed. física en el gimnasio los martes?*

**Ejemplo de revinculación:**
```
(kinesiólogo, gym, MONDAY, 08:00, 18:00, valid_from=2026-03-01, valid_until=2026-09-30)  ← primer vínculo
(kinesiólogo, gym, MONDAY, 08:00, 18:00, valid_from=2028-01-01, valid_until=null)         ← revinculado
```

---

### `availability_overrides`
Excepciones puntuales al schedule semanal. Soporta rangos de fechas.

**Tipos (OVERRIDE_TYPE):**
| Tipo | Uso | `start_time` / `end_time` |
|---|---|---|
| `BLOCKED` | Vacaciones, día libre, licencia | Nullable (día completo bloqueado) |
| `EXTRA` | Profesional invitado, turno puntual fuera del template | Requeridos |

**Ejemplos:**
```
-- 2 semanas de vacaciones
(kinesiólogo, 2026-07-01, 2026-07-14, BLOCKED)

-- Día libre puntual
(kinesiólogo, 2026-04-07, 2026-04-07, BLOCKED)

-- Profesional invitado un martes específico
(invitado, 2026-04-15, 2026-04-15, EXTRA, 18:00, 20:00, gym_id)
```

**Lógica de resolución para una fecha dada:**
1. ¿Hay override que cubra esta fecha?
   - `BLOCKED` → no disponible (ignora template semanal)
   - `EXTRA` → disponible con esos horarios (suma o reemplaza template)
2. Sin override → usar `weekly_availability` para ese día de la semana
3. Sin template ni override → no disponible

---

### `appointments`
Turno concreto con fecha/hora. Puede pertenecer a un profesional, una location, o ambos.

- `professional_id` nullable — turno asignado a centro sin profesional específico aún
- `location_id` nullable — turno online o a domicilio
- Al menos uno de los dos debe estar presente (CHECK constraint)
- `max_capacity` — override puntual de capacidad (ej: clase especial para 5 personas). Si es null, se asume 1.
- `booked_by` — quién creó el turno (paciente, profesional, admin)

**Estados (APPOINTMENT_STATUS):** `PENDING` | `CONFIRMED` | `CANCELLED` | `COMPLETED`

---

### `appointment_sessions`
Junction table. Un turno puede tener múltiples sesiones (clases grupales de ed. física).

**Validación de capacidad al agregar:**
```
capacidad_efectiva = appointments.max_capacity ?? 1
slots_ocupados     = COUNT(*) FROM appointment_sessions WHERE appointment_id = X
si slots_ocupados < capacidad_efectiva → OK
```

---

## Cobertura de una location

Para detectar gaps en la cobertura de una location:

```
horas abiertas (location_operating_hours)
  -
horas cubiertas por profesionales (weekly_availability WHERE location_id = X, aplicando overrides)
  =
gaps sin cobertura
```

---

## Casos de uso soportados

| Caso | Cómo |
|---|---|
| Horario semanal fijo | `weekly_availability` |
| Vacaciones (rango) | `availability_overrides` BLOCKED con `date_from`/`date_until` |
| Día libre puntual | `availability_overrides` BLOCKED con mismo `date_from` y `date_until` |
| Profesional invitado un día | `availability_overrides` EXTRA con horarios y location |
| Turno individual (1-on-1) | `appointments` + 1 row en `appointment_sessions` |
| Clase grupal | `appointments` con `max_capacity` + N rows en `appointment_sessions` |
| Turno sin profesional asignado | `appointments` con `professional_id = null`, `location_id` presente |
| Reserva por paciente o admin | `booked_by` en `appointments` |

---

## Cambios de DB aplicados

### `patients` (migración `add_patient_fields_and_appointment_patient_id`)

```sql
ALTER TABLE patients
  ADD COLUMN full_name text,
  ADD COLUMN email     text,
  ALTER COLUMN user_id DROP NOT NULL;
```

- `user_id` ahora nullable: los pacientes pueden existir como registro clínico sin cuenta de auth.
- Una futura feature enviará invitación y vinculará la cuenta.

### `appointments` (misma migración)

```sql
ALTER TABLE appointments
  ADD COLUMN patient_id uuid REFERENCES patients(patient_id) ON DELETE SET NULL;
```

- Permite asociar el turno a un paciente directamente, sin necesidad de crear una `session` al momento de la reserva.
- La `session` clínica se crea cuando el turno comienza, no al reservar.

---

## Frontend implementado

### Componentes (`src/pages/agenda/`)

| Archivo | Responsabilidad |
|---|---|
| `components/NewAppointmentDialog.tsx` | Dialog wizard principal. Recibe `professionalId` (required), `defaultDate?`, `trigger?`. `booked_by` viene de `useAuth()`. |
| `components/PatientSelector.tsx` | Búsqueda de pacientes existentes por nombre (debounce 300ms, protección de race condition). Botón "Paciente nuevo" para activar el sub-paso. |
| `components/NewPatientSubStep.tsx` | Sub-paso inline de creación de paciente. Paso 1: búsqueda por email. Paso 2 (si no existe): crear con nombre completo. |
| `components/AppointmentList.tsx` | Lista básica de turnos del profesional con nombre de paciente, fecha/hora y badge de estado. |
| `hooks/useProfessionalId.ts` | Resuelve el `professional_id` del usuario logueado consultando la tabla `professionals`. `staleTime: Infinity`. |
| `services/patients.service.ts` | `searchPatientsByName`, `getPatientByEmail`, `createPatient`. |
| `services/appointments.service.ts` | `createAppointment`, `getAppointmentsForProfessional`. |

### Flujo del wizard

```
Abrir dialog
  └─ PatientSelector (búsqueda por nombre)
       └─ "Paciente nuevo" → NewPatientSubStep
            ├─ Paso 1: email → getPatientByEmail
            │    ├─ Encontrado → auto-selecciona, vuelve al main
            │    └─ No encontrado → Paso 2
            └─ Paso 2: nombre completo → createPatient → auto-selecciona

Campos: Fecha · Inicio · Fin  (react-hook-form + Zod)
Confirmar → createAppointment(professional_id, patient_id, start_at, end_at, booked_by, status=PENDING)
```

### Manejo de errores

| Situación | Comportamiento |
|---|---|
| Email lookup falla (red/DB) | Mensaje inline debajo del input. Sin toast. |
| Crear paciente falla | `toast.error` con patrón loading toast. |
| Crear turno falla | `toast.error` con patrón loading toast. |
| Validación del form | Mensajes inline vía Zod. Sin toasts. |

### Entry points actuales

| Contexto | Componente | Props |
|---|---|---|
| Agenda del profesional | `AgendaPage` → `NewAppointmentDialog` | `professionalId` resuelto via `useProfessionalId()` |
| Tabla de scheduling admin | Pendiente (próxima feature) | `professionalId` de la fila seleccionada |
