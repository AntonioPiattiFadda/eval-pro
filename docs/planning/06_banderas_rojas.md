# EvalPro — 06. Banderas Rojas

## Concepto

Hallazgos que requieren derivación urgente o descartar patología grave antes de continuar. Se evalúan **SIEMPRE** y **PRIMERO**, independientemente de la región, dominio o scoring.

---

## Lógica de Disparo

```
ANTES de cualquier scoring:
  Evaluar hallazgos contra tabla Banderas_Rojas

SI bandera_roja detectada:
  SI prioridad == URGENTE:
    → DETENER evaluación
    → Mostrar alerta roja con acción recomendada
    → NO mostrar scoring ni diagnósticos
    → Registrar en historial del paciente
  SI prioridad == ALTA:
    → Mostrar alerta amarilla
    → Permitir continuar pero con advertencia visible
    → Sugerir estudios complementarios
    → Registrar en historial
```

---

## Tabla de Banderas Rojas Generales

```
| bandera_id | hallazgo                                          | patologia_grave         | accion                          | prioridad |
|------------|---------------------------------------------------|-------------------------|---------------------------------|-----------|
| BR001      | Pérdida de peso inexplicable + dolor constante    | Neoplasia               | Derivar a médico                | URGENTE   |
| BR002      | Fiebre + dolor articular + edema caliente          | Artritis séptica        | Derivar a urgencias             | URGENTE   |
| BR003      | Trauma reciente + deformidad + impotencia funcional| Fractura/Luxación       | Derivar a urgencias. Inmovilizar| URGENTE   |
| BR004      | Pérdida fuerza progresiva + alt. esfínteres        | Mielopatía/Cauda equina | Derivar a urgencias             | URGENTE   |
| BR005      | Dolor nocturno constante sin alivio posicional     | Neoplasia/Infección     | Derivar a médico. Estudios      | ALTA      |
| BR006      | Antecedente de cáncer + dolor óseo nuevo           | Metástasis ósea         | Derivar a oncología             | ALTA      |
| BR007      | Dolor torácico + disnea + dolor hombro izquierdo   | Evento cardíaco         | Derivar a urgencias             | URGENTE   |
| BR008      | Cefalea súbita + rigidez de nuca                   | Meningitis/HSA          | Derivar a urgencias             | URGENTE   |
| BR009      | Pérdida sensibilidad en silla de montar            | Síndrome cauda equina   | Derivar a urgencias             | URGENTE   |
| BR010      | Claudicación + pulsos periféricos ausentes         | Insuficiencia vascular  | Derivar a vascular              | ALTA      |
```

---

## Banderas Rojas por Dominio

| Dominio | Ejemplos |
|---|---|
| **Kinesiología** | Cauda equina, fractura, luxación, mielopatía, artritis séptica |
| **Nutrición** | IMC < 16, deshidratación severa, hipoglucemia, disfagia aguda |
| **Psicología** | Ideación suicida, psicosis aguda, riesgo de autolesión |
| **Entrenamiento** | Dolor torácico durante ejercicio, síncope, rabdomiólisis |

---

**Documentos relacionados:**
- [01. Flujo Global](./01_flujo_global.md)
- [02. Base de Datos](./02_base_de_datos.md)
