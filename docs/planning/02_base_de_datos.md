# EvalPro — 02. Base de Datos

## Resumen

31 tablas organizadas en 9 categorías funcionales.

---

## 2.1 Tablas Core

| # | Tabla | Descripción |
|---|---|---|
| 1 | **Dominios** | Kinesiología, nutrición, psicología, entrenamiento |
| 2 | **Regiones** | Cervical, hombro, codo, muñeca, lumbar, cadera, rodilla, tobillo, etc. |
| 3 | **Pacientes** | Datos personales y antecedentes |
| 4 | **Evaluaciones** | Sesión de evaluación (multi-dominio, multi-región, objetivo) |
| 5 | **Objetivos** | Rehabilitación, rendimiento, estético, salud general, pérdida de peso |

## 2.2 Tablas de Anamnesis

| # | Tabla | Descripción |
|---|---|---|
| 6 | **Preguntas_Fase1** | 4 preguntas generales + región. Opciones de respuesta cerradas |
| 7 | **Preguntas_Fase2** | Preguntas específicas por estructura. Campo `activa_si` = combo de Fase 1 |
| 8 | **Respuestas_Anamnesis** | Respuestas del paciente por evaluación, vinculadas a Fase 1 y 2 |
| 9 | **Perfil_Estructura** | Clasificación resultante: tendón / músculo / ligamento / hueso |

## 2.3 Tablas de Tests y Hallazgos

| # | Tabla | Descripción |
|---|---|---|
| 10 | **Tests** | Catálogo de pruebas por dominio, región y estructura asociada |
| 11 | **Resultados_Test** | Resultado de cada test en una evaluación + score |
| 12 | **Signos_Sintomas** | Catálogo de hallazgos clínicos por dominio |
| 13 | **Evaluacion_Signos** | Signos registrados por evaluación con severidad |

## 2.4 Tablas de Estudios Complementarios

| # | Tabla | Descripción |
|---|---|---|
| 14 | **Estudios_Complementarios** | Catálogo: Rx, Eco, RMN, TAC, labs |
| 15 | **Resultados_Estudio** | Hallazgos por estudio, con estado (solicitado/pendiente/cargado/vencido) y fecha |
| 16 | **Sugerencia_Estudio** | Reglas: qué estudio sugerir según scoring actual |

## 2.5 Tablas de Diagnósticos e Intervenciones

| # | Tabla | Descripción |
|---|---|---|
| 17 | **Diagnosticos** | Catálogo por dominio y región |
| 18 | **Intervenciones** | Catálogo de tratamientos/acciones por dominio |
| 19 | **Diagnostico_Intervencion** | Relación diagnóstico → intervenciones con prioridad |

## 2.6 Tablas del Motor de Scoring

| # | Tabla | Descripción |
|---|---|---|
| 20 | **Reglas_Scoring** | Tabla unificada: fuente (fase1/fase2/test/estudio) → patología → peso |
| 21 | **Evidencia_Test** | Sensibilidad, especificidad por test/patología (Capa 2 Bayesiana) |
| 22 | **Prevalencia** | Probabilidad pretest por patología y contexto |
| 23 | **Clusters** | Combinaciones de tests con bonus de especificidad |
| 24 | **Diagnostico_Sugerido** | Resultado del scoring por evaluación con % y desglose por fase |

## 2.7 Tablas del Sistema Regional

| # | Tabla | Descripción |
|---|---|---|
| 25 | **Patologia_Region** | Regiones de origen y referido por patología |
| 26 | **Cadenas_Regionales** | Conexiones biomecánicas/neurológicas entre regiones |
| 27 | **Derivacion_Regional** | Reglas de sugerencia de nueva región cuando score local es bajo |

## 2.8 Tablas de Seguridad

| # | Tabla | Descripción |
|---|---|---|
| 28 | **Banderas_Rojas** | Hallazgos de alarma con acción y prioridad, por dominio |

## 2.9 Tablas de Evolución y Derivación

| # | Tabla | Descripción |
|---|---|---|
| 29 | **Evaluacion_Evolucion** | Tracking de progreso entre sesiones (delta score, EVA, ROM, funcional) |
| 30 | **Reglas_Derivacion_Interdominio** | Cuándo sugerir otro dominio basado en evolución o hallazgos |
| 31 | **Objetivo_Dominio** | Dominios obligatorios/recomendados por objetivo del paciente |

---

## Diagrama de Relaciones (simplificado)

```
Pacientes ──→ Evaluaciones ──→ Resultados_Test ──→ Reglas_Scoring ──→ Diagnostico_Sugerido
                   │                                      ↑                      ↓
                   ├──→ Respuestas_Anamnesis ─────────────┤          Diagnostico_Intervencion
                   │         ↓                            │                      ↓
                   │    Perfil_Estructura ──→ Tests        │              Intervenciones
                   │                          (filtro)     │
                   ├──→ Evaluacion_Signos ────────────────┤
                   │                                      │
                   ├──→ Resultados_Estudio ───────────────┘
                   │
                   ├──→ Banderas_Rojas (check prioritario)
                   │
                   └──→ Evaluacion_Evolucion (tracking entre sesiones)

Patologia_Region ←──→ Cadenas_Regionales ──→ Derivacion_Regional
Objetivo_Dominio ──→ Reglas_Derivacion_Interdominio
Evidencia_Test + Prevalencia + Clusters ──→ Motor Bayesiano (Capa 2)
```

---

**Documentos relacionados:**
- [01. Flujo Global](./01_flujo_global.md)
- [03. Motor de Scoring Híbrido](./03_motor_scoring.md)
- [04. Estudios Complementarios](./04_estudios_complementarios.md)
