# EvalPro — 05. Sistema Regional Inteligente

## Concepto

Las patologías no pertenecen a una sola región. El scoring evalúa patologías de **todas las regiones** simultáneamente. Cuando los resultados locales no cierran, el sistema sugiere evaluar regiones conectadas.

---

## Patologías Multi-Región

Cada patología puede manifestarse en múltiples regiones (origen vs referido):

```
| patologia_id       | region    | tipo     |
|--------------------|-----------|----------|
| Radiculopatía C6   | cervical  | origen   |
| Radiculopatía C6   | hombro    | referido |
| Radiculopatía C6   | brazo     | referido |
| Radiculopatía C6   | muñeca    | referido |
| Coxartrosis        | cadera    | origen   |
| Coxartrosis        | rodilla   | referido |
| Supraespinoso      | hombro    | origen   |
```

---

## Cadenas Regionales

Regiones del cuerpo conectadas biomecánica y neurológicamente:

```
| region_origen | region_conectada | tipo_conexion              | fuerza |
|---------------|-----------------|----------------------------|--------|
| cervical      | hombro          | neurológica + biomecánica  | alta   |
| cervical      | brazo           | neurológica                | alta   |
| cervical      | muñeca/mano     | neurológica                | media  |
| hombro        | codo            | biomecánica                | media  |
| lumbar        | cadera          | biomecánica + neurológica  | alta   |
| lumbar        | rodilla         | neurológica                | media  |
| lumbar        | pie             | neurológica                | baja   |
| cadera        | rodilla         | biomecánica                | alta   |
| rodilla       | tobillo/pie     | biomecánica                | media  |
| torácica      | hombro          | biomecánica                | media  |
| tobillo       | rodilla         | biomecánica ascendente     | media  |
```

---

## Derivación Regional Automática

### Reglas de disparo

```
SI score_max_region_actual < 40%
   Y existen hallazgos con score > 0 en patologías de OTRA región
   Y cadena_regional existe entre ambas regiones
ENTONCES
   → Mostrar: "Resultados no concluyentes para [región actual]"
   → Sugerir: "Evaluar [región conectada]"
   → Mostrar: tests recomendados para la nueva región
   → Mostrar: patologías candidatas con prob. pretest
```

### Tabla de derivaciones

```
| hallazgo_combo                         | region_origen | region_sugerida | patologia_candidata  | prob_pretest |
|----------------------------------------|---------------|-----------------|----------------------|--------------|
| hormigueo dedos + tests muñeca(-)      | muñeca        | cervical        | Radiculopatía C6-C7  | 0.35         |
| dolor hombro + ROM normal + Spurling(+)| hombro        | cervical        | Cervicobraquialgia   | 0.40         |
| dolor rodilla + flexión cadera limitada| rodilla       | cadera          | Coxartrosis referida | 0.20         |
| dolor lumbar + SLR(+) + debilidad pie  | lumbar        | pie/tobillo     | Radiculopatía L5     | 0.30         |
| dolor tobillo + valgo rodilla          | tobillo       | rodilla/cadera  | Déficit cadena asc.  | 0.25         |
```

---

## Ejemplo: De Muñeca a Cuello

```
Sesión 1 — Región: Muñeca
  Phalen: negativo       → Túnel carpiano: -2
  Tinel: negativo        → Túnel carpiano: -2
  Finkelstein: negativo  → De Quervain: -3
  Dolor nocturno: sí     → Flotante (+2 en varias)
  Hormigueo dedos: sí    → Túnel carpiano: +4, Radiculopatía C6: +3

  Score Túnel carpiano: 0 (bajo)
  Score Radiculopatía C6: 5 (hallazgos flotantes)

  ⚠️ SISTEMA SUGIERE:
  "Tests de muñeca no concluyentes. Hallazgos compatibles con
   origen cervical. Se recomienda evaluar región CERVICAL."
  → Tests sugeridos: Spurling, Distracción, ULNT1, ROM cervical

Sesión 2 — Región: Cervical (sugerida por sistema)
  Spurling: positivo (reproduce hormigueo en dedos)  → Radiculopatía C6: +4
  ULNT1: positivo                                     → Radiculopatía C6: +3
  ROM cervical: extensión limitada + dolor             → Radiculopatía C6: +2
  Distracción: positivo (alivia)                       → Radiculopatía C6: +3

  Bayesiano final:
  Radiculopatía C6-C7: 82%
  Cervicobraquialgia: 45%
  Túnel carpiano: 6%
```

---

**Documentos relacionados:**
- [01. Flujo Global](./01_flujo_global.md)
- [02. Base de Datos](./02_base_de_datos.md)
- [03. Motor de Scoring](./03_motor_scoring.md)
