# Brainstorm en curso: Página de Sesión Clínica

**Fecha:** 2026-04-04  
**Estado:** Pendiente de respuesta del usuario — alcance sin definir

---

## Idea

Al hacer doble click en un turno (appointment) en la `AppointmentList`, navegar a una página de sesión clínica que muestre:
1. Info del paciente
2. Historial de sesiones anteriores para ese paciente
3. Capacidad de iniciar/registrar la sesión de hoy (la evaluación)

---

## Contexto técnico relevante

### Punto de entrada
- Componente: `src/pages/agenda/components/AppointmentList.tsx`
- Trigger: `onDoubleClick` en cada fila de turno
- Datos disponibles en el turno: `appointment_id`, `patient_id`, `patient.user.full_name`, `patient.user.email`, `start_at`, `end_at`, `status`

### Tabla `sessions` (ya existe en Supabase ✅)
- FK a: `patient`, `professional`, `region`, `domain`, `objective`
- Es el "contacto clínico" — diferente de `appointments` que es la agenda/scheduling

### Tablas de dominio relevantes (ya existen ✅)
- `domains`: KINESIOLOGY, NUTRITION, PSYCHOLOGY, TRAINING
- `regions`: CERVICAL, SHOULDER, ELBOW, WRIST, LUMBAR, HIP, KNEE, ANKLE
- `objectives`: REHABILITATION, SPORTS_PERFORMANCE, AESTHETIC, GENERAL_HEALTH, WEIGHT_LOSS

### Routing actual
- Las rutas de profesional viven bajo `ProfesionalLayout`
- Ruta propuesta: `/professional/sessions/:appointmentId` o `/professional/patients/:patientId/sessions`

---

## Flujo completo del sistema (scope total — no todo en este sprint)

```
Banderas Rojas (siempre primero)
  ↓
Anamnesis Fase 1 (4 preguntas + región + dominio)
  ↓
Anamnesis Fase 2 (preguntas específicas por estructura)
  ↓                    ↓ paralelo
Tests Fase 3      Estudios complementarios
  ↓
Motor de Scoring Híbrido (Capa 1 simple + Capa 2 Bayesiano)
  ↓
Diagnóstico sugerido con %
  ↓
Intervenciones recomendadas
  ↓
Evolución entre sesiones
```

---

## Pregunta pendiente de respuesta

¿Qué alcance para este sprint?

- **A)** Solo la página de entrada: info del paciente, historial de sesiones, botón "Iniciar sesión" que crea el registro y muestra placeholder
- **B)** Página de entrada + primera fase completa: banderas rojas + anamnesis Fase 1 (4 preguntas + región + dominio)
- **C)** Otro alcance

---

## Próximos pasos

1. Usuario responde pregunta de alcance
2. Continuar brainstorming (proponer enfoques de arquitectura, diseño de componentes)
3. Escribir spec completa
4. Invocar `writing-plans` para el plan de implementación
