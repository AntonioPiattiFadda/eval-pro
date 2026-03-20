# EvalPro — 08. Scoring por Dominio — Ejemplos

## Kinesiología

```
Fase 1: dolor sordo, post-actividad, hombro
Fase 2: carga repetitiva, mejora con calentamiento → TENDÓN
Tests:  Jobe (+), Neer (+), Hawkins (+), Drop Arm (-)
Eco:    Tendón SE engrosado
→ Tendinopatía Supraespinoso 89%
→ Intervención: ejercicio terapéutico + terapia manual + educación
```

## Nutrición

```
Recordatorio 24h: 1400 kcal (req. 2000)
Bioimpedancia: 28% grasa
Labs: ferritina 18, proteína 0.8 g/kg
→ Déficit calórico crónico 78%
→ Déficit proteico 74%
→ Intervención: plan alimentario + suplementación hierro
```

## Psicología

```
PHQ-9: 14 (depresión moderada)
GAD-7: 12 (ansiedad moderada)
Entrevista: insomnio, anhedonia, rumiación
→ Trastorno mixto ansioso-depresivo 68%
→ Intervención: TCC + derivación psiquiátrica si necesario
```

## Entrenamiento — Rendimiento

```
Radar lanzamiento: 78 km/h (elite 90-95)
Med ball throw: 8.2 m (esperado >10)
1RM Press: ratio 0.91 (esperado >1.1)
FMS: 14/21, asimetría shoulder mobility
→ Déficit potencia MMSS 82%
→ Intervención: fase fuerza (3 sem) → fase potencia (3 sem)
```

## Entrenamiento — Estético

```
Bioimpedancia: 28% grasa (objetivo <22%)
Volumen: 8 series/semana/grupo (subóptimo)
RIR: 4-5 (baja intensidad)
Frecuencia: 1x/semana/grupo (subóptimo)
→ Déficit volumen entrenamiento 72%
→ Déficit intensidad 65%
→ Cruce automático → Nutrición (ingesta insuficiente)
→ Intervención: subir volumen 14-16 series, frecuencia 2x, RIR 1-2
```

---

## Cruce Entre Dominios

El scoring detecta automáticamente cuándo un diagnóstico de un dominio necesita intervención de otro:

```
Kinesiología detecta sarcopenia → dispara evaluación Nutrición
Entrenamiento detecta fatiga crónica → dispara labs (ferritina, B12)
Nutrición detecta déficit calórico severo → dispara evaluación Psicología
Psicología detecta dolor crónico + catastrofismo → refuerza plan Kinesiología
```

El profesional ve la sugerencia en pantalla. El sistema explica POR QUÉ sugiere el cruce.

---

**Documentos relacionados:**
- [01. Flujo Global](./01_flujo_global.md)
- [03. Motor de Scoring](./03_motor_scoring.md)
- [07. Evolución](./07_evolucion.md)
