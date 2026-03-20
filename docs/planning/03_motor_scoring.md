# EvalPro — 03. Motor de Scoring Híbrido

## Concepto General

El sistema usa dos capas de cálculo combinadas para llegar al diagnóstico más probable.

```
Hallazgos del paciente (todas las fuentes)
        ↓
  CAPA 1: Sumatorio Simple (filtro rápido)
  Evalúa TODAS las patologías del sistema
        ↓
  Filtro: score > umbral mínimo
  Descarta patologías con score irrelevante
        ↓
  CAPA 2: Bayesiano (precisión)
  Solo sobre las 3-8 candidatas que pasaron el filtro
        ↓
  Ranking final con % de probabilidad real
```

---

## Capa 1 — Sumatorio Simple

Cada hallazgo tiene un peso fijo por patología. Se suman todos los pesos positivos y negativos.

### Tabla Unificada: Reglas_Scoring

```
| fuente       | hallazgo_id                | patologia_id       | peso | fase     |
|-------------|----------------------------|--------------------|------|----------|
| fase1        | dolor_sordo                | Tendinopatía SE    | +2   | fase1    |
| fase1        | post_actividad             | Tendinopatía SE    | +2   | fase1    |
| fase1        | dolor_agudo_inmediato      | Ruptura manguito   | +3   | fase1    |
| fase1        | nocturno                   | Tendinopatía SE    | +2   | fase1    |
| fase1        | nocturno                   | Neoplasia          | +1   | fase1    |
| fase2        | mejora_calentamiento       | Tendinopatía SE    | +3   | fase2    |
| fase2        | mejora_calentamiento       | Ruptura manguito   | -2   | fase2    |
| fase2        | mecanismo_traumatico_si    | Ruptura manguito   | +3   | fase2    |
| fase2        | mecanismo_traumatico_no    | Fractura           | -4   | fase2    |
| fase2        | carga_repetitiva_si        | Tendinopatía SE    | +3   | fase2    |
| fase2        | inestabilidad_si           | Luxación recidiv.  | +4   | fase2    |
| fase3_test   | jobe_positivo              | Tendinopatía SE    | +4   | fase3    |
| fase3_test   | jobe_negativo              | Tendinopatía SE    | -2   | fase3    |
| fase3_test   | drop_arm_negativo          | Ruptura manguito   | -3   | fase3    |
| fase3_test   | lachman_positivo           | Ruptura LCA        | +5   | fase3    |
| estudio_img  | eco_tendon_engrosado       | Tendinopatía SE    | +4   | paralelo |
| estudio_img  | eco_bursa_distendida       | Bursitis           | +4   | paralelo |
| estudio_img  | rmn_ruptura_parcial        | Ruptura manguito   | +5   | paralelo |
| estudio_img  | rx_sin_hallazgos           | Fractura           | -4   | paralelo |
| estudio_lab  | pcr_elevada                | Artritis/Infección | +3   | paralelo |
| estudio_lab  | pcr_normal                 | Artritis           | -2   | paralelo |
| estudio_lab  | ferritina_baja             | Déficit hierro     | +3   | paralelo |
| estudio_lab  | vit_d_baja                 | Debilidad muscular | +2   | paralelo |
| cluster      | neer+hawkins+arco          | Subacromial        | +5   | fase3    |
| cluster      | phalen+tinel+durkan        | Túnel carpiano     | +5   | fase3    |
```

### Pesos Negativos

Cuando un test sale negativo, no solo "no suma" sino que **resta activamente** score a las patologías donde ese test es muy sensible.

Ejemplo: Drop Arm negativo → Ruptura manguito rotador **-3**.

### Umbral de Filtro

Configurable por región. Default: patologías con score < 15% del máximo posible se descartan para Capa 2.

---

## Capa 2 — Bayesiano

Para cada patología candidata (que pasó el filtro), se calcula la probabilidad real usando el Teorema de Bayes:

```
P(patología | hallazgo+) = (Sensibilidad × Prevalencia) / P(hallazgo+)

Donde:
P(hallazgo+) = (Sens × Prev) + ((1 - Espec) × (1 - Prev))
```

### Tabla: Evidencia_Test

```
| test_id   | patologia_id    | sensibilidad | especificidad | fuente          | año  |
|-----------|-----------------|--------------|---------------|-----------------|------|
| Jobe      | Supraespinoso   | 0.72         | 0.58          | Hegedus 2012    | 2012 |
| Neer      | Subacromial     | 0.72         | 0.60          | Hegedus 2012    | 2012 |
| Hawkins   | Subacromial     | 0.79         | 0.59          | Hegedus 2012    | 2012 |
| Phalen    | Túnel carpiano  | 0.68         | 0.73          | MacDermid 2004  | 2004 |
| Spurling  | Radicul. cerv.  | 0.50         | 0.86          | Rubinstein 2007 | 2007 |
```

### Tabla: Prevalencia

```
| patologia_id    | contexto                    | prevalencia | fuente |
|-----------------|-----------------------------|-------------|--------|
| Supraespinoso   | dolor_hombro                | 0.30        | —      |
| Subacromial     | dolor_hombro                | 0.25        | —      |
| Túnel carpiano  | dolor_muñeca                | 0.35        | —      |
| Radiculopatía C6| dolor_muñeca + hormigueo    | 0.15        | —      |
| Radiculopatía C6| dolor_cervical              | 0.20        | —      |
```

La prevalencia depende del **contexto** (motivo de consulta + región), no es fija.

---

## Clusters de Tests

Combinaciones de tests que juntos aumentan la especificidad diagnóstica significativamente.

```
| cluster_id | nombre              | tests                      | patologia_id    | espec_cluster | bonus |
|------------|---------------------|----------------------------|-----------------|---------------|-------|
| CL001      | Cluster pinzamiento | Neer + Hawkins + Arco dol. | Subacromial     | 0.92          | +5    |
| CL002      | Cluster manguito    | Jobe + Drop Arm + Lag Sign | Ruptura manguito| 0.89          | +6    |
| CL003      | Cluster túnel       | Phalen + Tinel + Durkan    | Túnel carpiano  | 0.87          | +5    |
| CL004      | Cluster cervical    | Spurling + Distr. + ULNT1  | Radiculopatía   | 0.93          | +6    |
```

Cuando TODOS los tests de un cluster son positivos, se aplica el bonus_score adicional y la especificidad del cluster reemplaza la individual para el cálculo bayesiano.

---

## Ejemplo Completo del Flujo Híbrido

Paciente: dolor de hombro, 3 semanas.

### Capa 1 — Sumatorio:

```
Patología              Score    Max posible    %
───────────────────────────────────────────────
Subacromial             18         22         82%  ✓ pasa
Supraespinoso           15         20         75%  ✓ pasa
Bursitis subacromial    10         16         63%  ✓ pasa
Capsulitis adhesiva      6         18         33%  ✓ pasa
Ruptura manguito         3         20         15%  ✓ pasa (límite)
Inestabilidad GH         1         18          6%  ✗ descartada
Túnel carpiano           0         16          0%  ✗ descartada
Fractura                 0         14          0%  ✗ descartada
```

### Capa 2 — Bayesiano (sobre 5 candidatas):

```
Patología              Prob. final
─────────────────────────────────
Subacromial             87%
Supraespinoso           74%
Bursitis subacromial    52%
Capsulitis adhesiva     18%
Ruptura manguito        8%
```

---

## Métricas por Fase

El sistema calcula cuánto aportó cada fase al diagnóstico final:

```
Diagnóstico: Tendinopatía Supraespinoso (89%)

Aporte por fase:
  Anamnesis Fase 1: ████░░░░  15%  (primeras pistas)
  Anamnesis Fase 2: ██████░░  25%  (orientó estructura)
  Tests Fase 3:     ████████  40%  (confirmó)
  Estudios:         ████░░░░  20%  (respaldó con imagen)
```

Esto es **formativo**: le muestra al profesional que una buena anamnesis ya resuelve el 40% del diagnóstico antes de tocar al paciente.

---

**Documentos relacionados:**
- [01. Flujo Global](./01_flujo_global.md)
- [02. Base de Datos](./02_base_de_datos.md)
- [04. Estudios Complementarios](./04_estudios_complementarios.md)
