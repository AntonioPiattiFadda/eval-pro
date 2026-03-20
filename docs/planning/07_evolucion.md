# EvalPro — 07. Evolución Entre Sesiones

## Concepto

El scoring no es estático. Cada sesión actualiza las probabilidades y el sistema compara contra sesiones anteriores para medir progreso objetivo.

---

## Tracking de Evolución

```
| sesion | fecha      | diagnostico         | score | prob  | eva  | estado          |
|--------|------------|---------------------|-------|-------|------|-----------------|
| 1      | 01/03/2026 | Inconcluso (muñeca) | 8     | —     | 7/10 | No concluyente  |
| 2      | 05/03/2026 | Radiculopatía C6    | 26    | 82%   | 7/10 | Confirmado      |
| 3      | 15/03/2026 | Radiculopatía C6    | 26    | 82%   | 5/10 | En tratamiento  |
| 4      | 01/04/2026 | Radiculopatía C6    | 18    | 82%   | 3/10 | Mejorando       |
| 5      | 15/04/2026 | Radiculopatía C6    | 8     | 82%   | 1/10 | Alta            |
```

---

## Métricas Trackeadas

El sistema mide automáticamente entre sesiones:

- **Delta Score:** diferencia de score (bajó = mejora)
- **Delta EVA:** cambio en escala de dolor
- **Delta ROM:** cambio en rangos de movimiento
- **Delta Funcional:** cambio en escalas funcionales (DASH, Oswestry, etc.)
- **Tests que cambiaron:** ej. Spurling pasó de (+) a (-)
- **Tiempo estimado restante:** basado en curva de evolución

---

## Alertas Automáticas

```
SI delta_score entre sesión N y N+2 == 0 (sin cambios):
  → "Paciente estancado. Considerar: cambio de enfoque terapéutico,
     estudios complementarios, o derivación interdisciplinaria."

SI delta_eva > +2 (empeoró):
  → "Dolor aumentó. Revisar: bandera roja tardía, patología concomitante,
     o error diagnóstico. Re-evaluar con scoring completo."

SI delta_score mejora pero delta_funcional no:
  → "Hallazgos clínicos mejoran pero función no. Considerar factores
     psicológicos (kinesiofobia, catastrofismo) o nutricionales."
     → Sugerir evaluación en dominio PSICOLOGÍA

SI estudio pendiente > 2 semanas:
  → "Estudio solicitado sin cargar. Recordar al paciente."
```

---

## Derivación Interdisciplinaria por Evolución

Cuando la evolución sugiere que otro dominio debería intervenir:

```
| condicion                             | de             | a            | razon                              |
|---------------------------------------|----------------|--------------|-------------------------------------|
| EVA estancado + catastrofismo alto    | Kinesiología   | Psicología   | Factores psicosociales              |
| Sarcopenia + déficit proteico         | Kinesiología   | Nutrición    | Recuperación muscular comprometida  |
| Fatiga crónica + déficit B12          | Entrenamiento  | Nutrición    | Performance limitada por nutrición  |
| Objetivo estético + déficit calórico  | Entrenamiento  | Nutrición    | Composición corporal                |
| Déficit calórico severo > 30%         | Nutrición      | Psicología   | Descartar conducta alimentaria alt. |
| Ansiedad + dolor crónico             | Psicología     | Kinesiología | Componente somático                 |
| Sobreentrenamiento + insomnio         | Entrenamiento  | Psicología   | Burnout deportivo                   |
| Pérdida de peso + depresión           | Nutrición      | Psicología   | Conducta alimentaria alterada       |
```

---

## Vinculación con Objetivos

```
| objetivo_id       | dominio_obligatorio | dominio_recomendado | razon                                      |
|-------------------|--------------------|--------------------|---------------------------------------------|
| estetico          | entrenamiento      | nutrición          | Composición corporal depende de ingesta      |
| estetico          | entrenamiento      | psicología         | Descartar relación disfuncional con imagen   |
| rendimiento       | entrenamiento      | nutrición          | Performance depende de combustible            |
| rehabilitacion    | kinesiología       | psicología         | Factores psicosociales afectan recuperación   |
| perdida_peso      | nutrición          | entrenamiento      | Gasto calórico + preservar masa muscular      |
| perdida_peso      | nutrición          | psicología         | Descartar conducta alimentaria alterada       |
```

---

**Documentos relacionados:**
- [01. Flujo Global](./01_flujo_global.md)
- [02. Base de Datos](./02_base_de_datos.md)
- [03. Motor de Scoring](./03_motor_scoring.md)
