# EvalPro — 02. Base de Datos

## Resumen

35 tablas organizadas en 10 categorías funcionales.

> **Convención:** nombres de tablas y columnas en inglés. Enums en SCREAMING_SNAKE_CASE.

---

## Estado de implementación

| Símbolo | Significado |
|---|---|
| ✅ | Creada en Supabase |
| 🔲 | Pendiente |

---

## 2.0 Tablas de Usuarios y Roles

| # | Tabla | Descripción | Estado |
|---|---|---|---|
| 1 | **users** | Identidad de la persona: user_id (FK→auth.users), email, full_name, identification_number, organization_id, created_at | ✅ |
| 2 | **user_roles** | Multi-rol por usuario. PK compuesta (user_id, role). Enum USER_ROLE: PROFESSIONAL \| PATIENT \| ADMIN \| SUPERADMIN | ✅ |
| 3 | **professionals** | Perfil profesional. Vinculado a users. Enum SPECIALTY: KINESIOLOGY \| NUTRITION. UNIQUE (user_id, specialty) — un user puede tener múltiples especialidades | ✅ |
| 4 | **patients** | Perfil paciente por organización. user_id NOT NULL (FK→users). Una persona puede ser paciente en múltiples orgs — cada org genera su propia fila. | ✅ |

> **Decisión de diseño — identidad vs. perfiles:**
> `users` representa a la **persona física**: un registro por persona, con su identidad (nombre, email, DNI). `patients` y `professionals` son **perfiles de rol** — una persona puede tener múltiples `patients` rows (una por organización) y múltiples `professionals` rows (una por especialidad/org). `users` no tiene columna `role`; los roles viven en `user_roles`.
>
> **Decisión de diseño — auth compartido entre organizaciones:**
> La plataforma es multi-tenant con auth compartido. Un mismo paciente que es atendido en dos clínicas distintas tiene **una sola cuenta** (`users` / `auth.users`) pero dos filas en `patients` (una por org). Cada org opera como sistema independiente (branding propio, datos aislados por RLS), pero el login es el mismo. Este tradeoff se acepta porque: (a) el paciente raramente sabe que ambas clínicas usan el mismo sistema, (b) la experiencia está aislada por subdominio/branding, (c) la alternativa (un Supabase project por org) tiene costo operacional prohibitivo.
>
> **Alta de pacientes:** se realiza vía Edge Function `invite-patient` que usa el service role key server-side. Flujo: busca si el email ya existe en `users` → si no existe, llama a `auth.admin.inviteUserByEmail` y crea el registro en `users` manualmente (no hay trigger automático) → crea la fila en `patients` para la org. El paciente recibe un email para activar su cuenta y setear su contraseña.

---

## 2.1 Tablas Core

| # | Tabla | Descripción | Estado |
|---|---|---|---|
| 5 | **domains** | Catálogo: KINESIOLOGY, NUTRITION, PSYCHOLOGY, TRAINING. Seeded. | ✅ |
| 6 | **regions** | Catálogo: CERVICAL, SHOULDER, ELBOW, WRIST, LUMBAR, HIP, KNEE, ANKLE. Seeded. | ✅ |
| 7 | **sessions** | Contacto clínico entre profesional y paciente. FK a patient, professional, region, domain, objective. | ✅ |
| 8 | **objectives** | Catálogo: REHABILITATION, SPORTS_PERFORMANCE, AESTHETIC, GENERAL_HEALTH, WEIGHT_LOSS. Seeded. | ✅ |

> **Decisión de diseño:** una `session` por dominio. Si el scoring de kinesiología detecta que hay que evaluar nutrición, se crea una nueva `session` y la relación se registra en `session_derivations`. Cada dominio tiene su propio flujo completo.

---

## 2.2 Tablas de Anamnesis

| # | Tabla | Descripción | Estado |
|---|---|---|---|
| 9 | **anamnesis_phase1_questions** | 4 preguntas generales. Opciones de respuesta cerradas. Seeded. | ✅ |
| 10 | **anamnesis_phase2_questions** | Preguntas específicas por estructura. Campo `active_if` = STRUCTURE_TYPE enum | ✅ |
| 11 | **anamnesis_answers** | Respuestas del paciente por sesión, cubre Fase 1 y 2. UNIQUE (session_id, question_id) | ✅ |
| 12 | **anamnesis_structure_profiles** | Clasificación inferida por el sistema: TENDON / MUSCLE / LIGAMENT / BONE. UNIQUE por sesión | ✅ |

---

## 2.3 Tablas de Tests y Hallazgos

| # | Tabla | Descripción | Estado |
|---|---|---|---|
| 13 | **tests** | Catálogo de pruebas por dominio, región y estructura asociada | 🔲 |
| 14 | **test_results** | Resultado de cada test en una evaluación + score | 🔲 |
| 15 | **signs_symptoms** | Catálogo de hallazgos clínicos por dominio | 🔲 |
| 16 | **evaluation_signs** | Signos registrados por evaluación con severidad | 🔲 |

---

## 2.4 Tablas de Estudios Complementarios

| # | Tabla | Descripción | Estado |
|---|---|---|---|
| 17 | **complementary_studies** | Catálogo: Rx, Eco, RMN, TAC, labs | 🔲 |
| 18 | **study_results** | Hallazgos por estudio, con estado (REQUESTED/PENDING/LOADED/EXPIRED) y fecha | 🔲 |
| 19 | **study_suggestions** | Reglas: qué estudio sugerir según scoring actual | 🔲 |

---

## 2.5 Tablas de Diagnósticos e Intervenciones

| # | Tabla | Descripción | Estado |
|---|---|---|---|
| 20 | **diagnoses** | Catálogo por dominio y región | 🔲 |
| 21 | **interventions** | Catálogo de tratamientos/acciones por dominio | 🔲 |
| 22 | **diagnosis_interventions** | Relación diagnóstico → intervenciones con prioridad | 🔲 |

---

## 2.6 Tablas del Motor de Scoring

| # | Tabla | Descripción | Estado |
|---|---|---|---|
| 23 | **scoring_rules** | Tabla unificada: fuente (phase1/phase2/test/study) → diagnóstico → peso | 🔲 |
| 24 | **test_evidence** | Sensibilidad, especificidad por test/diagnóstico (Capa 2 Bayesiana) | 🔲 |
| 25 | **prevalence** | Probabilidad pretest por diagnóstico y contexto | 🔲 |
| 26 | **clusters** | Combinaciones de tests con bonus de especificidad | 🔲 |
| 27 | **suggested_diagnoses** | Resultado del scoring por evaluación con % y desglose por fase | 🔲 |

---

## 2.7 Tablas del Sistema Regional

| # | Tabla | Descripción | Estado |
|---|---|---|---|
| 28 | **pathology_regions** | Regiones de origen y referido por diagnóstico | 🔲 |
| 29 | **regional_chains** | Conexiones biomecánicas/neurológicas entre regiones | 🔲 |
| 30 | **regional_referrals** | Reglas de sugerencia de nueva región cuando score local es bajo | 🔲 |

---

## 2.8 Tablas de Seguridad

| # | Tabla | Descripción | Estado |
|---|---|---|---|
| 31 | **red_flags** | Hallazgos de alarma con acción y prioridad, por dominio | 🔲 |

---

## 2.9 Tablas de Evolución y Derivación

| # | Tabla | Descripción | Estado |
|---|---|---|---|
| 32 | **evaluation_evolutions** | Tracking de progreso entre sesiones (delta score, EVA, ROM, funcional) | 🔲 |
| 33 | **interdomain_referral_rules** | Cuándo sugerir otro dominio basado en evolución o hallazgos | 🔲 |
| 34 | **objective_domains** | Dominios obligatorios/recomendados por objetivo del paciente | 🔲 |

---

## 2.10 Tablas de Organizaciones

| # | Tabla | Descripción | Estado |
|---|---|---|---|
| 35 | **organizations** | Clínicas u organizaciones. FK en users. | ✅ |

---

## Diagrama de Relaciones (simplificado)

```
auth.users
    ↓
users ──→ user_roles
    ├──→ professionals ──→ evaluations ──→ anamnesis_answers ──→ scoring_rules ──→ suggested_diagnoses
    │                           │                                      ↑                    ↓
    └──→ patients ──────────────┤          test_results ───────────────┤       diagnosis_interventions
                                │               ↓                      │                    ↓
                                │          structure_profiles → tests  │              interventions
                                │          (filtro por región+estructura)
                                │
                                ├──→ evaluation_signs ─────────────────┤
                                │
                                ├──→ study_results ────────────────────┘
                                │
                                ├──→ red_flags (check prioritario)
                                │
                                └──→ evaluation_evolutions (tracking entre sesiones)

evaluations.parent_evaluation_id → evaluations (derivación interdominio)
regional_chains ──→ regional_referrals
objective_domains ──→ interdomain_referral_rules
test_evidence + prevalence + clusters ──→ Motor Bayesiano (Capa 2)
```

---

**Documentos relacionados:**
- [01. Flujo Global](./01_flujo_global.md)
- [03. Motor de Scoring Híbrido](./03_motor_scoring.md)
- [04. Estudios Complementarios](./04_estudios_complementarios.md)
