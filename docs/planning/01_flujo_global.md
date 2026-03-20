# EvalPro — 01. Flujo Global del Sistema

## Dominios

Kinesiología · Nutrición · Psicología · Entrenamiento

---

## Flujo Completo

```
PACIENTE INGRESA
        ↓
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  BANDERAS ROJAS (se evalúan SIEMPRE, primero)
  → URGENTE: detener todo, derivar
  → ALTA: advertir, permitir continuar
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
        ↓
┌─────────────────────────────────────────────────────────────┐
│  FASE 1: ANAMNESIS GENERAL (4 preguntas clave)             │
│                                                             │
│  1. Frecuencia (siempre / intermitente / con actividad)     │
│  2. Síntomas y manifestaciones (agudo / sordo / punzante)   │
│  3. Duración y latencia (inmediato / minutos / constante)   │
│  4. Momento del día (mañana / actividad / nocturno)         │
│  + Región corporal                                          │
│                                                             │
│  → Scoring ya corre por detrás                              │
│  → Se filtra: región, dominios, perfil de estructura        │
└─────────────────────────────────────────────────────────────┘
        ↓
┌─────────────────────────────────────────────────────────────┐
│  FASE 2: ANAMNESIS ESPECÍFICA                               │
│                                                             │
│  Preguntas generadas dinámicamente según Fase 1.            │
│  Orientadas a clasificar tipo de estructura:                │
│  TENDÓN vs MÚSCULO vs LIGAMENTO vs HUESO                    │
│                                                             │
│  Ej (perfil tendón):                                        │
│    ¿Dolor con carga repetitiva?                             │
│    ¿Mejora con calentamiento y vuelve después?   
                           │
│                                                             │
│  Ej (perfil ligamento):                                     │
│    ¿Hubo mecanismo traumático?                              │
│    ¿Sentiste un "crack" o "pop"?                            │
│    ¿Sensación de inestabilidad?                             │
│                                                             │
│  → Scoring sigue acumulando                                 │
│  → Se clasifica estructura primaria                         │
│  → Se acotan patologías candidatas                          │
└─────────────────────────────────────────────────────────────┘
        ↓                              ↓
        ↓                   ┌──────────────────────────┐
        ↓                   │  ESTUDIOS COMPLEMENTARIOS │
        ↓                   │  (flujo paralelo)         │
        ↓                   │                           │
        ↓                   │  Estado:                  │
        ↓                   │  solicitado → pendiente   │
        ↓                   │  → cargado → vencido      │
        ↓                   │                           │
        ↓                   │  Tipos:                   │
        ↓                   │  • Imagen (Rx, Eco, RMN)  │
        ↓                   │  • Laboratorio (PCR, VSG, │
        ↓                   │    ferritina, Vit D)      │
        ↓                   │                           │
        ↓                   │  → Se inyectan al scoring │
        ↓                   │    cuando estén disponibles│
        ↓                   │  → Recalculan diagnóstico │
        ↓                   └──────────┬───────────────┘
        ↓                              ↓
┌─────────────────────────────────────────────────────────────┐
│  FASE 3: TESTS Y EVALUACIONES                               │
│                                                             │
│  Filtrados por: región + estructura clasificada (Fase 2)    │
│                                                             │
│  Ej: hombro + tendón → Jobe, Neer, Hawkins, Speed          │
│  Ej: hombro + ligamento → Aprensión, Recolocación, Cajón   │
│  Ej: rodilla + ligamento → Lachman, Cajón, Pivot shift     │
│                                                             │
│  → Solo sugiere tests relevantes (no los 30 posibles)       │
│  → Scoring acumula con mayor peso (tests son más específicos)│
└─────────────────────────────────────────────────────────────┘
        ↓
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  MOTOR DE SCORING HÍBRIDO
  
  Todas las fuentes alimentan la misma tabla:
  Fase 1 + Fase 2 + Tests + Estudios complementarios
  
  CAPA 1: Sumatorio Simple
  → Evalúa TODAS las patologías
  → Filtra: descarta score < umbral
  
  CAPA 2: Bayesiano
  → Solo candidatas que pasaron filtro
  → Usa sensibilidad/especificidad + prevalencia
  → Aplica clusters si corresponde
  
  RESULTADO: Ranking de diagnósticos con % probabilidad
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
        ↓
  ¿Score local bajo + hallazgos flotantes?
  SÍ → Sugerir evaluar otra REGIÓN (cadena regional)
       → Volver a Fase 3 con nueva región
        ↓
  ¿Patología involucra otro dominio?
  SÍ → Sugerir derivación interdisciplinaria
       → Ej: entrenamiento → nutrición
        ↓
┌─────────────────────────────────────────────────────────────┐
│  DIAGNÓSTICO SUGERIDO                                       │
│                                                             │
│  1. Tendinopatía Supraespinoso — 89%                        │
│  2. Síndrome Subacromial — 48%                              │
│  3. Ruptura manguito — 5%                                   │
│                                                             │
│  Desglose de aporte por fase:                               │
│  • Anamnesis F1: 15% del score                              │
│  • Anamnesis F2: 25% del score                              │
│  • Tests F3: 40% del score                                  │
│  • Estudios: 20% del score                                  │
└─────────────────────────────────────────────────────────────┘
        ↓
┌─────────────────────────────────────────────────────────────┐
│  INTERVENCIONES RECOMENDADAS                                │
│  Priorizadas por diagnóstico + evidencia                    │
│                                                             │
│  TERAPIA MANUAL                                             │
│  → Movilización articular (grado I-IV)                      │
│  → Manipulación                                             │
│  → Masoterapia / liberación miofascial                      │
│  → Movilización neural                                      │
│  → Vendaje neuromuscular (kinesiotaping)                    │
│                                                             │
│  EJERCICIO FÍSICO / TERAPÉUTICO                             │
│  → Ejercicio excéntrico / isométrico                        │
│  → Fortalecimiento progresivo                               │
│  → Stretching y flexibilidad                                │
│  → Estabilización y control motor                           │
│  → Carga progresiva (protocolo de retorno a actividad)      │
│                                                             │
│  AGENTES FÍSICOS / ELECTROTERAPIA                           │
│  → Ultrasonido (US) terapéutico                             │
│  → Onda corta (diatermia)                                   │
│  → TENS / corrientes analgésicas                            │
│  → Láser de baja intensidad                                 │
│  → Crioterapia / termoterapia                               │
│  → Magnetoterapia                                           │
│                                                             │
│  + Estudios complementarios sugeridos (si no se pidieron)   │
│  + Derivación a otro dominio (si corresponde)               │
└─────────────────────────────────────────────────────────────┘
        ↓
┌─────────────────────────────────────────────────────────────┐
│  EVOLUCIÓN ENTRE SESIONES                                   │
│                                                             │
│  → Re-evaluación: compara scores entre sesiones             │
│  → Delta: score, EVA, ROM, funcionalidad                    │
│  → Alertas:                                                 │
│    • Estancado → cambiar enfoque                            │
│    • Empeoró → revisar diagnóstico / bandera roja tardía    │
│    • Mejora clínica sin mejora funcional → evaluar psico    │
│  → Estudios pendientes: recordatorio si no se cargaron      │
└─────────────────────────────────────────────────────────────┘
```

---

**Documentos relacionados:**
- [02. Base de Datos](./02_base_de_datos.md)
- [03. Motor de Scoring Híbrido](./03_motor_scoring.md)
- [04. Estudios Complementarios](./04_estudios_complementarios.md)
- [05. Sistema Regional](./05_sistema_regional.md)
- [06. Banderas Rojas](./06_banderas_rojas.md)
- [07. Evolución Entre Sesiones](./07_evolucion.md)
- [08. Scoring por Dominio](./08_scoring_dominio.md)
- [09. Consideraciones de Diseño](./09_consideraciones.md)
