# EvalPro — 10. Capa de Intervenciones

## Concepto

Las intervenciones se recomiendan **después del diagnóstico** y se priorizan según:
- Probabilidad del diagnóstico (score bayesiano)
- Nivel de evidencia de la intervención para esa patología
- Dominio activo (kinesiología, nutrición, psicología, entrenamiento)
- Contraindicaciones presentes en el perfil del paciente

No se trata de un listado genérico: el sistema selecciona y ordena intervenciones específicas para el diagnóstico más probable, luego para los secundarios.

---

## Categorías

```
┌─────────────────────────────────────────────────────────────┐
│  TERAPIA MANUAL                                             │
│  Intervención directa sobre tejidos y articulaciones        │
│                                                             │
│  • Movilización articular (grado I-IV)                      │
│  • Manipulación (grado V)                                   │
│  • Masoterapia / liberación miofascial                      │
│  • Movilización neural (deslizamiento / tensión)            │
│  • Vendaje neuromuscular (kinesiotaping)                    │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│  EJERCICIO FÍSICO / TERAPÉUTICO                             │
│  Carga progresiva y control motor                           │
│                                                             │
│  • Ejercicio excéntrico / isométrico                        │
│  • Fortalecimiento progresivo                               │
│  • Stretching y flexibilidad                                │
│  • Estabilización y control motor                           │
│  • Propiocepción y equilibrio                               │
│  • Protocolo de retorno a actividad / deporte               │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│  AGENTES FÍSICOS / ELECTROTERAPIA                           │
│  Modalidades con aparatos de fisioterapia                   │
│                                                             │
│  • Ultrasonido (US) terapéutico                             │
│  • Onda corta (diatermia)                                   │
│  • TENS / corrientes analgésicas                            │
│  • Láser de baja intensidad (LLLT)                          │
│  • Magnetoterapia                                           │
│  • Crioterapia / termoterapia                               │
│  • Interferenciales                                         │
└─────────────────────────────────────────────────────────────┘
```

---

## Tabla: Catalogo_Intervenciones

```
| intervencion_id | categoria          | nombre                        | dominio       |
|-----------------|--------------------|-------------------------------|---------------|
| INT001          | terapia_manual     | Movilización articular I-IV   | kinesiología  |
| INT002          | terapia_manual     | Manipulación                  | kinesiología  |
| INT003          | terapia_manual     | Liberación miofascial         | kinesiología  |
| INT004          | terapia_manual     | Movilización neural           | kinesiología  |
| INT005          | terapia_manual     | Kinesiotaping                 | kinesiología  |
| INT006          | ejercicio          | Ejercicio excéntrico          | kinesiología  |
| INT007          | ejercicio          | Ejercicio isométrico          | kinesiología  |
| INT008          | ejercicio          | Fortalecimiento progresivo    | kinesiología  |
| INT009          | ejercicio          | Estabilización / control motor| kinesiología  |
| INT010          | ejercicio          | Propiocepción                 | kinesiología  |
| INT011          | ejercicio          | Retorno a actividad           | kinesiología  |
| INT012          | ejercicio          | Fase fuerza                   | entrenamiento |
| INT013          | ejercicio          | Fase potencia                 | entrenamiento |
| INT014          | ejercicio          | Fase hipertrofia              | entrenamiento |
| INT015          | agente_fisico      | Ultrasonido terapéutico       | kinesiología  |
| INT016          | agente_fisico      | Onda corta                    | kinesiología  |
| INT017          | agente_fisico      | TENS                          | kinesiología  |
| INT018          | agente_fisico      | Láser LLLT                    | kinesiología  |
| INT019          | agente_fisico      | Magnetoterapia                | kinesiología  |
| INT020          | agente_fisico      | Crioterapia                   | kinesiología  |
| INT021          | agente_fisico      | Termoterapia                  | kinesiología  |
| INT022          | agente_fisico      | Interferenciales              | kinesiología  |
| INT023          | plan               | Plan alimentario              | nutrición     |
| INT024          | plan               | Suplementación                | nutrición     |
| INT025          | plan               | Periodización nutricional     | nutrición     |
| INT026          | psicoterapia       | TCC                           | psicología    |
| INT027          | psicoterapia       | Educación en dolor            | psicología    |
| INT028          | psicoterapia       | Técnicas de relajación        | psicología    |
| INT029          | derivacion         | Derivación médica             | general       |
| INT030          | derivacion         | Derivación interdisciplinaria | general       |
```

---

## Tabla: Reglas_Intervenciones

Vincula diagnósticos con intervenciones recomendadas, nivel de evidencia y prioridad.

```
| patologia_id        | intervencion_id | evidencia | prioridad | fase_recomendada     |
|---------------------|-----------------|-----------|-----------|----------------------|
| Tendinopatía SE     | INT006          | A         | 1         | crónica/subaguda     |
| Tendinopatía SE     | INT007          | A         | 1         | aguda / sin carga    |
| Tendinopatía SE     | INT008          | A         | 2         | subaguda/crónica     |
| Tendinopatía SE     | INT003          | B         | 2         | cualquier fase       |
| Tendinopatía SE     | INT015          | B         | 3         | aguda                |
| Tendinopatía SE     | INT018          | B         | 3         | cualquier fase       |
| Tendinopatía SE     | INT017          | B         | 3         | analgesia            |
| Subacromial         | INT001          | B         | 1         | cualquier fase       |
| Subacromial         | INT009          | A         | 1         | subaguda/crónica     |
| Subacromial         | INT016          | B         | 2         | aguda                |
| Subacromial         | INT020          | C         | 3         | inflamación aguda    |
| Ruptura LCA         | INT008          | A         | 1         | post-qx / crónica    |
| Ruptura LCA         | INT009          | A         | 1         | post-qx              |
| Ruptura LCA         | INT010          | A         | 2         | tardía               |
| Radiculopatía C6    | INT004          | B         | 1         | cualquier fase       |
| Radiculopatía C6    | INT001          | B         | 1         | cualquier fase       |
| Radiculopatía C6    | INT017          | B         | 2         | analgesia            |
| Radiculopatía C6    | INT027          | A         | 2         | crónica              |
| Túnel carpiano      | INT005          | B         | 2         | cualquier fase       |
| Túnel carpiano      | INT017          | B         | 2         | analgesia            |
| Déficit calórico    | INT023          | A         | 1         | inicial              |
| Déficit proteico    | INT024          | A         | 1         | inicial              |
| Depresión moderada  | INT026          | A         | 1         | cualquier fase       |
| Ansiedad moderada   | INT026          | A         | 1         | cualquier fase       |
| Ansiedad moderada   | INT028          | B         | 2         | cualquier fase       |
| Déficit potencia    | INT012          | A         | 1         | inicial (3 sem)      |
| Déficit potencia    | INT013          | A         | 2         | segunda etapa        |
```

Niveles de evidencia: **A** = ensayos clínicos / meta-análisis · **B** = estudios observacionales / consenso · **C** = opinión experta

---

## Priorización

```
Para el diagnóstico con mayor probabilidad (ej. 89%):

  1. Seleccionar todas las intervenciones vinculadas (Reglas_Intervenciones)
  2. Ordenar por: prioridad ASC → evidencia DESC
  3. Filtrar contraindicaciones del perfil del paciente
  4. Agrupar por categoría (manual / ejercicio / agente físico)
  5. Mostrar primero categorías con mayor evidencia para esa patología

Para diagnósticos secundarios (ej. 48%, 18%):
  → Mostrar colapsados, expandibles
  → Solo mostrar si no se solapan con el principal
```

---

## Contraindicaciones

```
| intervencion_id | contraindicacion                         | motivo                        |
|-----------------|------------------------------------------|-------------------------------|
| INT002          | fractura, inestabilidad severa, infección| riesgo de daño estructural    |
| INT002          | osteoporosis severa                      | riesgo de fractura            |
| INT015          | implante metálico en zona, marcapasos    | calentamiento / interferencia |
| INT015          | neoplasia en zona, trombosis             | riesgo de diseminación        |
| INT016          | marcapasos, implante electrónico         | interferencia electromagnética|
| INT016          | embarazo, neoplasia, trombosis           | contraindicación absoluta     |
| INT017          | marcapasos, trombosis, zona lumbar       | interferencia / riesgo        |
| INT019          | marcapasos, implante electrónico         | campo magnético               |
| INT001          | fractura activa, artritis séptica        | riesgo de daño articular      |
| INT004          | irritación nerviosa aguda severa         | puede exacerbar síntomas      |
| INT008          | fase inflamatoria aguda                  | carga contraproducente        |
```

Las contraindicaciones se detectan automáticamente si el perfil del paciente (o las banderas rojas activas) las registra. El sistema oculta la intervención y lo notifica al profesional.

---

## Interacción con Scoring y Evolución

Las intervenciones no son el destino del flujo — son el input de la próxima sesión.

```
Sesión N: Diagnóstico confirmado → Intervenciones recomendadas
        ↓
Profesional aplica intervenciones y registra:
  • Qué se realizó (por categoría)
  • Respuesta inmediata (EVA pre/post sesión)
        ↓
Sesión N+1: El sistema compara
  • Delta EVA, ROM, funcionalidad
  • Tests que cambiaron de signo
  • ¿Intervención produjo efecto esperado?
        ↓
SI sin cambio en 2 sesiones con misma intervención:
  → "Reconsiderar modalidad. Cambiar categoría o aumentar dosis."

SI empeora con una intervención específica:
  → Marcar como "no tolerada" en perfil del paciente
  → No volver a sugerir en sesiones futuras
```

---

## Ejemplo Completo

**Diagnóstico: Tendinopatía Supraespinoso 89%**

```
INTERVENCIONES SUGERIDAS:

EJERCICIO FÍSICO / TERAPÉUTICO  [evidencia A]
  1. Ejercicio isométrico (fase aguda — sin carga dinámica)
  2. Ejercicio excéntrico (transición a fase subaguda)
  3. Fortalecimiento progresivo de manguito (crónica)

TERAPIA MANUAL  [evidencia B]
  4. Liberación miofascial (trapecios, pectoral menor)
  5. Movilización glenohumeral grado I-II (analgesia)

AGENTES FÍSICOS  [evidencia B]
  6. Ultrasonido terapéutico (3 MHz, zona tendinosa)
  7. TENS (analgesia complementaria)
  8. Láser LLLT (si US no disponible o no tolerado)

+ Sugerir estudio: Ecografía MSK si no realizada (score ruptura 18%)
+ Sin contraindicaciones detectadas en perfil
```

---

## Cruce Multidominio

Algunas intervenciones disparan sugerencias en otros dominios:

```
| condicion                              | de            | a            | intervencion sugerida       |
|----------------------------------------|---------------|--------------|-----------------------------|
| Ejercicio de carga + déficit proteico  | entrenamiento | nutrición    | Plan proteico / suplemento  |
| Dolor crónico > 3 meses + EVA estable  | kinesiología  | psicología   | Educación en dolor / TCC    |
| Fatiga + déficit calórico severo       | entrenamiento | nutrición    | Periodización nutricional   |
| Catastrofismo alto + adherencia baja   | kinesiología  | psicología   | TCC + técnicas de relajación|
| Sarcopenia + baja ingesta proteica     | kinesiología  | nutrición    | Suplementación + plan       |
```

---

**Documentos relacionados:**
- [01. Flujo Global](./01_flujo_global.md)
- [02. Base de Datos](./02_base_de_datos.md)
- [03. Motor de Scoring](./03_motor_scoring.md)
- [07. Evolución Entre Sesiones](./07_evolucion.md)
- [08. Scoring por Dominio](./08_scoring_dominio.md)
