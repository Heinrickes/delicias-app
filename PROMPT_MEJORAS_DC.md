# PROMPT MAESTRO — Delicias Caseras · Sesión de Mejoras

## Contexto del Proyecto

Delicias Caseras es una **app de gestión interna** para un taller artesanal de repostería.
Es de uso personal (un solo dueño), no tiene acceso público ni clientes finales.
Funciona como PWA en desktop y móvil.

El proyecto **ya está construido y funcionando** — esta sesión no es de inicio sino de
**revisión, análisis y mejora iterativa** sobre código existente.

Repositorio: `github.com/Heinrickes/delicias-app`

---

## Stack Tecnológico

| Capa | Tecnología |
|------|-----------|
| Framework | Next.js 16.2 (App Router, Server Components, Server Actions) |
| Lenguaje | TypeScript 5 + React 19 |
| Base de datos / Auth | Supabase (Postgres + Auth) vía `@supabase/ssr` |
| UI | shadcn/ui sobre Base UI + Tailwind CSS v4 |
| Iconos | lucide-react |
| Gráficos | Recharts 3 |
| Toasts | sonner |

**Paleta:** fondo crema, chocolate `#4b2d1e` primario, terracota y dorado. Motivos botánicos.  
**Tipografías:** Vidaloka (serif, títulos) + Montserrat (sans, cuerpo)

---

## Arquitectura del código

```
src/
├── app/                    # Páginas (App Router)
│   ├── layout.tsx
│   ├── manifest.ts
│   └── globals.css
├── components/
│   ├── ui/                 # Primitivas shadcn/ui
│   └── shared/             # Componentes de negocio
├── lib/
│   ├── supabase/           # server.ts y client.ts
│   ├── actions/            # Server Actions (productos, packs, pedidos, stock, clientes)
│   ├── constants.ts
│   ├── productos-data.ts   # getProductosEnriquecidos()
│   └── ventas-helpers.ts   # disponibilidad() + aplicarSalidaStock()
└── types/database.ts
```

**Patrón de mutaciones:** Server Actions con `revalidatePath`. Sin escritura directa desde cliente.

---

## Modelo de Datos (Supabase)

| Tabla | Descripción |
|-------|-------------|
| `productos` | `tipo`, `costo`, `precio`, `stock`, `unidad`, `categoria`, `activo` |
| `pack_items` | `pack_id → producto_id × cantidad` |
| `clientes` | Datos de contacto |
| `pedidos` | `cliente_id`, `fecha_entrega`, `fecha_estimada_pago`, `estado`, `total` |
| `pedido_items` | Líneas de cada pedido |
| `ventas` | `total`, `costo_total`, vínculo a `cliente`/`pedido` |
| `movimientos_stock` | Trazabilidad por producto |

Todas las tablas con **RLS activo** (solo usuarios autenticados).

---

## Conceptos de Negocio Clave

### Productos y Packs
- **Simple:** tiene `stock`, `costo` y `precio` propios.
- **Pack** (`tipo = 'pack'`): sin stock propio. Compuesto por productos base (tabla `pack_items`).
  - Disponibilidad = `mín(floor(stock_base / cantidad))` entre sus componentes.
  - Al vender un pack se descuenta el **stock de los productos base**.

### Estados de Pedido
```
pendiente → por_cobrar → entregado (pagado)
          ↘ entregado (entregado y cobrado)
          ↘ cancelado
```
- La venta + descuento de stock se genera **una sola vez** en la primera transición a estado "entregado".
- `por_cobrar`: genera venta y descuenta stock pero queda pendiente de pago con fecha estimada.
- `por_cobrar → entregado`: solo marca pagado, **no duplica venta ni stock**.

---

## Módulos Existentes

| Ruta | Módulo |
|------|--------|
| `/` | Dashboard (métricas del día) |
| `/productos` | CRUD productos + packs |
| `/stock` | Registro de producción, mermas, ajustes, historial |
| `/pedidos` | Crear y gestionar encargos |
| `/por-cobrar` | Pedidos entregados pendientes de pago |
| `/clientes` | CRUD clientes |
| `/ventas` | Historial con margen |
| `/reportes` | Gráficos (ventas, productos, ingresos vs costos, producción) |
| `/login` | Auth Supabase |

---

## Áreas de Mejora — Foco de Esta Sesión

Esta sesión tiene **3 focos prioritarios**. Trabájalos en este orden:

---

### 🔴 FOCO 1 — Lógica de Negocio (pedidos, stock, packs, cobranzas)

Analiza el código actual e identifica problemas o mejoras en:

1. **Flujo de estados de pedido**
   - ¿Hay edge cases no cubiertos en las transiciones de estado?
   - ¿La validación de que "venta + stock se genera una sola vez" es robusta contra condiciones de carrera o doble click?
   - ¿Qué pasa si se cancela un pedido en estado `por_cobrar` — se revierte el stock correctamente?

2. **Lógica de packs**
   - ¿`disponibilidad()` en `ventas-helpers.ts` maneja correctamente packs compuestos por otros packs?
   - ¿`aplicarSalidaStock()` es atómica — o puede quedar en estado parcial si falla a mitad?
   - ¿Se valida disponibilidad antes de confirmar la venta?

3. **Cobranzas (`/por-cobrar`)**
   - ¿Hay lógica de vencimiento activa — o solo es visual?
   - ¿Se puede marcar como pagado parcialmente o solo es total?
   - ¿Qué sucede con el total de la deuda si se edita el pedido después de entregarlo?

4. **Integridad del stock**
   - ¿`movimientos_stock` se genera correctamente para todos los tipos (`produccion | venta | ajuste | merma`)?
   - ¿El historial es inmutable — o se puede editar un movimiento ya registrado?

Para cada problema encontrado:
- Describe el bug o riesgo
- Propón la solución concreta (código o migración SQL si aplica)
- Indica si requiere cambio en DB, Server Action o componente

---

### 🟡 FOCO 2 — UX / Flujos de Navegación

Revisa los componentes en `components/shared/` y las páginas de `app/` para identificar:

1. **Flujos de pedido**
   - ¿El proceso de crear un encargo (cliente → ítems → fecha) tiene pasos innecesarios?
   - ¿El cambio de estado es claro visualmente — o requiere demasiados clics?
   - ¿Se puede editar un pedido ya en estado `por_cobrar`?

2. **Gestión de productos y packs**
   - ¿La creación de un pack es intuitiva — queda claro que se están seleccionando productos base?
   - ¿Se muestra la disponibilidad calculada del pack en tiempo real al editarlo?

3. **Dashboard**
   - ¿Las métricas son accionables — o solo informativas?
   - ¿Las alertas de stock bajo llevan directamente al ítem afectado?
   - ¿Hay información crítica que falta en el dashboard para el día a día del taller?

4. **Mobile UX (PWA)**
   - ¿La navegación es ergonómica en pantalla pequeña?
   - ¿Los formularios de pedido e ítems son usables con teclado móvil?
   - ¿Los toasts (sonner) son visibles en mobile sin tapar contenido clave?

Para cada mejora:
- Describe el problema de UX actual
- Propón la solución (cambio de componente, nuevo flujo, ajuste de layout)
- Prioriza: Alta / Media / Baja impacto

---

### 🔵 FOCO 3 — Rendimiento y Arquitectura

1. **Server Components vs Client Components**
   - ¿Hay componentes marcados `'use client'` que podrían ser Server Components?
   - ¿Se están pasando demasiados datos al cliente innecesariamente?

2. **Server Actions**
   - ¿Las actions validan correctamente la sesión antes de cada mutación?
   - ¿Hay acciones que podrían beneficiarse de transacciones Postgres en lugar de múltiples llamadas a Supabase?
   - ¿`revalidatePath` está bien acotado — o está invalidando rutas de más?

3. **Queries a Supabase**
   - ¿`getProductosEnriquecidos()` en `productos-data.ts` hace N+1 queries para los packs?
   - ¿Hay consultas sin índices en columnas filtradas frecuentemente (`estado`, `fecha_entrega`, `activo`)?
   - ¿Las políticas RLS están optimizadas o generan overhead en cada query?

4. **PWA y caché**
   - ¿El manifiesto PWA está configurado correctamente para instalación en iOS y Android?
   - ¿Hay estrategia de caché offline — o todo requiere conexión?

Para cada hallazgo:
- Indica el impacto (velocidad percibida / costo de queries / seguridad)
- Propón la solución con código o configuración concreta

---

## Tu Rol en Esta Sesión

Eres el **Arquitecto Principal y Ejecutor** de Delicias Caseras.

**Primera tarea:** Lee el repositorio completo (`github.com/Heinrickes/delicias-app`) y audita el código según los 3 focos anteriores.

**Formato de respuesta esperado:**
1. Un resumen ejecutivo de los hallazgos más críticos
2. Un plan de acción priorizado (qué arreglar primero)
3. Implementación iterativa: un módulo a la vez, empezando por lo que más impacta el día a día del taller

**Regla clave:** No hagas cambios especulativos. Cada modificación debe resolver un problema concreto identificado en el código real.

---

## Metodología de Trabajo

- **Claude Code** → Arquitectura, decisiones técnicas, ejecución y refactor
- **Iteración:** Un foco a la vez. Cierra el Foco 1 antes de pasar al 2.
- **Validación:** Antes de implementar cualquier cambio en lógica de stock o pedidos, describir el cambio y pedir confirmación.

---

## Notas Adicionales

- La app es de **uso personal** — no hay multi-tenancy, pero el RLS debe mantenerse.
- El diseño visual (paleta, tipografías, motivos botánicos) no debe modificarse.
- Priorizar siempre la **integridad de datos** sobre la velocidad de desarrollo.
- El dueño usa la app diariamente — los cambios deben ser no disruptivos (no romper flujos que ya funcionan).
