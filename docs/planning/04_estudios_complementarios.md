# EvalPro — 04. Estudios Complementarios

## Concepto

Los estudios complementarios (imagen y laboratorio) corren en paralelo al flujo principal. No son obligatorios ni bloquean el scoring. Cuando están disponibles, se inyectan al motor y recalculan el diagnóstico.

---

## Estados del Estudio

```
SOLICITADO → PENDIENTE → CARGADO → (VENCIDO)
                                      ↑
                            después de X meses
                            según tipo de estudio
```

## Vencimiento por Tipo

| Tipo | Vigencia sugerida |
|---|---|
| Laboratorio general | 3 meses |
| Laboratorio específico | 6 meses |
| Radiografía | 12 meses |
| Ecografía | 6 meses |
| RMN | 12 meses |

---

## Catálogo de Estudios

```
| estudio_id | tipo        | nombre          | region  |
|------------|-------------|-----------------|---------|
| EC001      | imagen      | Radiografía     | general |
| EC002      | imagen      | Ecografía MSK   | general |
| EC003      | imagen      | RMN             | general |
| EC004      | laboratorio | Hemograma       | general |
| EC005      | laboratorio | PCR / VSG       | general |
| EC006      | laboratorio | Ferritina       | general |
| EC007      | laboratorio | Vitamina D      | general |
| EC008      | imagen      | TAC             | general |
```

---

## Resultados

```
| resultado_id | evaluacion_id | estudio_id | hallazgo            | valor  | fecha  | estado    |
|-------------|---------------|------------|----------------------|--------|--------|-----------|
| RE001       | EV001         | EC002      | Tendón SE engrosado  | 4.2mm  | 05/03  | cargado   |
| RE002       | EV001         | EC003      | Pendiente            | —      | —      | solicitado|
```

---

## Sugerencia Automática de Estudios

El sistema sugiere qué estudios pedir basándose en el scoring actual:

```
| condicion                              | estudio_sugerido    | razon                              |
|----------------------------------------|---------------------|------------------------------------|
| ruptura_manguito > 30%                 | RMN hombro          | Confirmar/descartar ruptura        |
| artritis > 40%                         | Labs (PCR, VSG)     | Descartar componente inflamatorio  |
| fractura > 25% + trauma reciente       | Radiografía         | Descartar fractura                 |
| tendinopatía > 60% + dx incierto       | Ecografía MSK       | Evaluar integridad tendinosa       |
| déficit fuerza + fatiga crónica        | Labs (ferritina, D) | Descartar déficit nutricional      |
| objetivo estético + déficit comp corp  | Bioimpedancia       | Línea base de composición corporal |
```

---

## Inyección al Scoring

Cuando un estudio se carga, el sistema:

1. Identifica hallazgos del estudio
2. Busca en `Reglas_Scoring` con `fuente = estudio_img` o `estudio_lab`
3. Suma/resta pesos a las patologías correspondientes
4. Recalcula Capa 1 + Capa 2
5. Actualiza ranking de diagnósticos
6. Notifica al profesional si el diagnóstico principal cambió

### Ejemplo

```
Día 1 — Evaluación clínica (sin estudios):
  Anamnesis + Tests → Bayesiano:
    Tendinopatía SE: 74%
    Subacromial: 62%
    Ruptura manguito: 18%
  
  → Sistema sugiere: "Solicitar ecografía MSK de hombro"
  → Estado estudio: SOLICITADO

Día 5 — Paciente trae ecografía:
  Hallazgo: tendón supraespinoso engrosado (4.2mm),
  bursa normal, sin ruptura

  Se cargan resultados → scoring recalcula:
    Tendinopatía SE: 74% → 89%  (eco confirmó)
    Subacromial: 62% → 48%      (bursa normal restó)
    Ruptura manguito: 18% → 5%  (sin ruptura visible)
```

---

## Cruce Interdisciplinario

Los laboratorios inyectan score automáticamente en otros dominios:

- Ferritina baja → score en dominio Nutrición (déficit de hierro)
- Vitamina D baja → score en dominio Entrenamiento (debilidad muscular)
- PCR elevada → score en dominio Kinesiología (proceso inflamatorio)

El profesional no tiene que pensar en el cruce, el sistema lo hace.

---

**Documentos relacionados:**
- [01. Flujo Global](./01_flujo_global.md)
- [02. Base de Datos](./02_base_de_datos.md)
- [03. Motor de Scoring](./03_motor_scoring.md)
