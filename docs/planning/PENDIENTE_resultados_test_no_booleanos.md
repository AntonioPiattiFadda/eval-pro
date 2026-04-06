# PENDIENTE: Resultados de Tests — Más Allá del Binario

## El problema

El modelo actual asume que cada test produce un resultado `positivo / negativo / inconcluso`.
Esto es insuficiente. Los tests clínicos tienen matices que cambian el diagnóstico completamente.

---

## Ejemplos concretos

### Jobe (hombro)

| Resultado observado | Diagnóstico que indica |
|---|---|
| Dolor reproducido | Tendinopatía supraespinoso |
| Debilidad sin dolor | Ruptura parcial / compromiso nervioso |
| Dolor + debilidad | Ruptura masiva manguito |
| Negativo | Descarta tendinopatía y ruptura |

### Lachman (rodilla)

| Resultado observado | Diagnóstico que indica |
|---|---|
| Positivo con tope firme | Laxidad constitucional (no lesión) |
| Positivo con tope blando | Ruptura LCA real |
| Grado 1 (< 5mm) | Esguince grado I-II |
| Grado 2 (5-10mm) | Ruptura parcial |
| Grado 3 (> 10mm) | Ruptura completa |

### Ejemplo extensible: tests de ejercicio

El mismo problema aplica a tests funcionales/de ejercicio donde la respuesta diagnóstica es:
- En qué repetición aparece el dolor
- Si es ardor, parestesia, clic, crepitación
- Si el dolor desaparece al calentar y vuelve post-ejercicio
- La intensidad EVA durante el test

---

## Opciones de diseño

### Opción A — Resultado como hallazgo granular (recomendada)

El test no produce un resultado único sino uno o más **findings discretos** que entran directamente a `Reglas_Scoring`.

```
Resultados_Test.finding_id → Reglas_Scoring.hallazgo_id
```

Ejemplos de findings para Jobe:
```
jobe_dolor_reproducido      → Tendinopatía SE     +4
jobe_debilidad_sin_dolor    → Ruptura parcial     +5
jobe_dolor_y_debilidad      → Ruptura masiva      +6
jobe_negativo               → Tendinopatía SE     -2
```

**Ventaja:** consistente con la arquitectura actual. La tabla `Reglas_Scoring` solo necesita más filas — no cambia su estructura.

**Desventaja:** el profesional selecciona un "patrón", no registra las dimensiones clínicas por separado.

---

### Opción B — Resultado multidimensional

`Resultados_Test` tiene campos separados por dimensión clínica:

```
dolor_evocado:     boolean + EVA (0-10)
debilidad:         boolean + grado MRC (0-5)
laxitud:           grado (0/1/2/3) + calidad tope (firme/blando/ausente)
respuesta_neuro:   parestesia / irradiación / ninguna
crepitacion:       boolean + descripción
```

**Ventaja:** registra lo que el profesional realmente observa con fidelidad clínica.

**Desventaja:** requiere lógica adicional para mapear dimensiones a pesos de scoring.

---

### Opción C — Híbrida (más completa)

Guardar las dimensiones crudas (Opción B) pero el motor las convierte a findings discretos (Opción A) antes de calcular el score.

```
Dimensiones registradas → Motor de mapeo → Findings → Reglas_Scoring → Score
```

El profesional ve y registra dimensiones clínicas reales.
El motor de scoring ve findings discretos.

---

## Pregunta pendiente de consulta

**¿Queremos que el profesional vea y registre las dimensiones clínicas reales (dolor + debilidad + laxitud por separado), o que seleccione el patrón resultado del test (ej: "dolor reproducido", "debilidad sin dolor")?**

- Si registra dimensiones → Opción B o C
- Si selecciona patrón → Opción A

La respuesta define si hay que agregar tablas nuevas o solo enriquecer `Reglas_Scoring`.

---

## Impacto en tablas actuales

| Tabla | Cambio necesario |
|---|---|
| `Tests` | Agregar `tipo` (ortopédico / funcional / ejercicio) |
| `Resultados_Test` | Reemplazar `resultado: enum` por estructura más rica |
| `Reglas_Scoring` | Más filas por findings granulares (Opción A) o lógica de mapeo (Opción C) |
| `Evidencia_Test` | Sensibilidad/especificidad tendría que ser por finding, no solo por test |

---

## Relacionado

- `03_motor_scoring.md` — arquitectura de scoring híbrido
- `02_base_de_datos.md` — tablas `Tests`, `Resultados_Test`, `Reglas_Scoring`
- `01_flujo_global.md` — Fase 3 del flujo
