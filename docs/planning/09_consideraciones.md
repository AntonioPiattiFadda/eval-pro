# EvalPro — 09. Consideraciones de Diseño

## Principios Arquitectónicos

- **Scoring unificado:** una sola tabla `Reglas_Scoring` con campo `fuente` y `fase` gobierna todo el sistema. Anamnesis, tests, estudios — todos alimentan la misma lógica.

- **Anamnesis inteligente:** Fase 2 se genera dinámicamente según Fase 1. Reduce preguntas innecesarias y clasifica la estructura sospechada antes de tocar al paciente.

- **Clasificación de estructura:** filtra tests relevantes. No muestra los 30 posibles, solo 5-8 que aportan valor diagnóstico real según el perfil (tendón/músculo/ligamento/hueso).

- **Estudios paralelos:** no bloquean el flujo. Se inyectan cuando estén disponibles y recalculan el diagnóstico. El sistema funciona con o sin ellos.

- **Modelo híbrido:** sumatorio simple para filtrar rápido, bayesiano para precisar. Escalable a medida que se cargan datos de evidencia (sensibilidad/especificidad).

- **Pesos negativos:** tests negativos descartan activamente patologías, no solo "no suman".

- **Clusters:** combinaciones de tests validadas que superan la suma de tests individuales en especificidad diagnóstica.

- **Multi-región:** el scoring evalúa patologías de todas las regiones simultáneamente, no solo la evaluada. Cadenas regionales sugieren evaluar regiones conectadas cuando los resultados locales no cierran.

- **Multi-dominio:** cruza automáticamente entre kinesiología, nutrición, psicología y entrenamiento. Una sola evaluación puede disparar sugerencias en cualquier dominio.

- **Evolución temporal:** compara entre sesiones, alerta estancamiento, detecta empeoramiento, y sugiere cambios de enfoque o derivación interdisciplinaria.

- **Formativo:** muestra aporte de cada fase al diagnóstico. Le enseña al profesional que una buena anamnesis resuelve el 40% antes de tocar al paciente.

- **Seguridad primero:** banderas rojas se evalúan antes que cualquier scoring. Prioridad URGENTE detiene todo, prioridad ALTA advierte.

- **Vencimiento de estudios:** un estudio viejo no pondera igual que uno reciente. Cada tipo tiene vigencia definida.

---

## Nomenclatura

- **Diagnósticos** en vez de "Patologías" — inclusivo para psicología y entrenamiento
- **Intervenciones** en vez de "Tratamientos" — abarca desde ejercicio terapéutico hasta plan alimentario o TCC
- **Estructura** — clasificación tisular (tendón/músculo/ligamento/hueso), no anatómica

---

## Números del Sistema

- **31 tablas** organizadas en 9 categorías
- **4 dominios** (kinesiología, nutrición, psicología, entrenamiento)
- **2 capas de scoring** (simple + bayesiano)
- **3 fases de evaluación** (anamnesis general → específica → tests)
- **1 flujo paralelo** (estudios complementarios)
- **4 preguntas** en Fase 1 que disparan todo el árbol

---

## Stack Tecnológico Recomendado (para desarrollo)

- **Frontend:** Next.js + React + Tailwind
- **Backend:** Node.js / API Routes
- **Base de datos:** PostgreSQL (Supabase)
- **AI Chat:** API de Anthropic (Claude)
- **Deploy:** Vercel + Supabase
- **Costo estimado:** $100-300 USD/mes en producción

---

**Documentos relacionados:**
- [01. Flujo Global](./01_flujo_global.md)
- [02. Base de Datos](./02_base_de_datos.md)
- [03. Motor de Scoring](./03_motor_scoring.md)
- [04. Estudios Complementarios](./04_estudios_complementarios.md)
- [05. Sistema Regional](./05_sistema_regional.md)
- [06. Banderas Rojas](./06_banderas_rojas.md)
- [07. Evolución](./07_evolucion.md)
- [08. Scoring por Dominio](./08_scoring_dominio.md)
