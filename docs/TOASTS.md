# Toasts en PediClick

## Librería

Se usa **Sonner** (`sonner`). No hay un hook propio activo — `src/hooks/use-toast.ts` está completamente comentado y es código muerto.

## Setup

El `<Toaster>` está montado una sola vez en `src/App.tsx:61`, dentro del árbol de providers. Usa `createPortal` para renderizarse directamente en `document.body`, con `z-index: 100000` para asegurar que quede por encima de cualquier modal o sheet.

El componente wrapper está en `src/components/ui/sonner.tsx`.

## Comportamiento por defecto

| Variante | Duración |
|---|---|
| `toast.success` | Default de Sonner (~4s) |
| `toast.error` | **16 segundos** (sobreescrito en `sonner.tsx:6`) |
| `toast()` (info) | Default de Sonner (~4s) |

El `toast.error` tiene duración extendida adrede para que el usuario tenga tiempo de leer mensajes de error.

Todos los toasts muestran un botón de cierre (`closeButton` está activo).

## Cómo usar

```typescript
import { toast } from "sonner";

// Éxito
toast.success("Stock asignado correctamente");

// Error (dura 16s automáticamente)
toast.error("Error al actualizar: " + errorMessage);

// Info genérica
toast("Mensaje neutral");
```

No hay que importar nada de `@/components/ui/sonner` en los componentes — el override de `toast.error` se aplica al importar desde `"sonner"` porque `sonner.tsx` muta el objeto `toast` en el módulo al cargarse con el `<Toaster>`.

## Convenciones del proyecto

- **`toast.success`**: Confirmar que una mutación se completó correctamente.
- **`toast.error`**: Errores de mutación. Siempre incluir el mensaje del error: `error.message || "Fallback genérico"`.
- **No usar toast para validaciones de formulario**: Para eso se usan mensajes inline vía `react-hook-form` + Zod.
- Los toasts se disparan dentro del callback `onSuccess` / `onError` de React Query mutations, o directamente en el `catch` de llamadas async.

## Estilos

Los toasts usan las variables CSS del tema:
- Fondo: `--color-card`
- Texto: `--color-card-foreground`
- Borde: `--color-border`

Se adaptan automáticamente al tema claro/oscuro vía `next-themes`.
