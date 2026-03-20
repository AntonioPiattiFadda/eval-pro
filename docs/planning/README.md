# EvalPro — Documentación del Sistema

Sistema inteligente de evaluación clínica con scoring multidominio.

---

## Índice

| # | Documento | Descripción |
|---|---|---|
| 01 | [Flujo Global](./01_flujo_global.md) | Flujo completo del sistema: banderas rojas → anamnesis F1/F2 → tests → scoring → diagnóstico → intervención → evolución |
| 02 | [Base de Datos](./02_base_de_datos.md) | 31 tablas organizadas en 9 categorías con diagrama de relaciones |
| 03 | [Motor de Scoring Híbrido](./03_motor_scoring.md) | Capa 1 (sumatorio simple) + Capa 2 (bayesiano) + clusters + pesos negativos |
| 04 | [Estudios Complementarios](./04_estudios_complementarios.md) | Flujo paralelo de imagen y laboratorio con estados, vencimiento e inyección al scoring |
| 05 | [Sistema Regional](./05_sistema_regional.md) | Cadenas regionales, patologías multi-región y derivación automática entre regiones |
| 06 | [Banderas Rojas](./06_banderas_rojas.md) | Hallazgos de alarma por dominio con lógica de disparo y prioridades |
| 07 | [Evolución Entre Sesiones](./07_evolucion.md) | Tracking de progreso, alertas de estancamiento y derivación interdisciplinaria |
| 08 | [Scoring por Dominio](./08_scoring_dominio.md) | Ejemplos de evaluación completa por dominio: kinesio, nutrición, psicología, entrenamiento |
| 09 | [Consideraciones de Diseño](./09_consideraciones.md) | Principios arquitectónicos, nomenclatura, números del sistema y stack tecnológico |
| 10 | [Intervenciones](./10_intervenciones.md) | Capa de intervenciones: terapia manual, ejercicio terapéutico, agentes físicos/electroterapia, catálogo, reglas, contraindicaciones y cruce multidominio |

---

## Dominios

Kinesiología · Nutrición · Psicología · Entrenamiento

## Estado

Arquitectura diseñada · Documentación completa · MVP pendiente
