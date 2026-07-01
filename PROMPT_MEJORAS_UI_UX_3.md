# PROMPT MAESTRO V3 · DELICIAS CASERAS
### Para Claude Code — Mejoras UI/UX: Tarjetas, Productos, Costos, Reportes y Dashboard

> **Contexto:** Este prompt complementa el V2. Asume que el Sprint 1 del V2 ya está completo o en curso. Las mejoras aquí descritas se basan en inspección visual directa de la app en producción (29 junio 2026). Cada sección incluye el estado actual observado y el estado objetivo.

---

## STACK Y RESTRICCIONES (no cambiar)

- Next.js App Router + TypeScript + React 19
- shadcn/ui + Tailwind CSS v4
- Supabase (Postgres + Auth con RLS) — reutilizar server actions existentes
- lucide-react para íconos
- sonner para toasts
- Recharts para gráficos
- Identidad visual intocable: cream / chocolate / terracotta / gold · Vidaloka + Montserrat

---

## ESTADO ACTUAL OBSERVADO (inspección 29-jun-2026)

| Sección | Estado visual actual |
|---|---|
| Inventario `/stock` | Tarjetas en grilla 3 cols: nombre + badge OK + stock + mínimo + precio + categoría. Sin colapso, sin filtro, sin acción rápida |
| Costos `/costos` | Lista de compras con items planos (nombre + proveedor + badge). Tarjetas de insumos similares a inventario. Sin eliminar de lista de compras |
| Pedidos `/pedidos` | Tarjetas con cliente + fecha + monto + productos + badge estado + ícono eliminar. Historial en grilla 2 cols |
| Clientes `/clientes` | Lista simple: avatar iniciales + nombre + teléfono + pedidos + monto |
| Reportes `/reportes` | eyebrow "ESTADÍSTICAS" ya puesto ✅, título "Reportes". KPIs de ventas + gráfico de barras horizontal (top productos) + gráfico de producción por día. Sin filtro por categoría de métrica |
| Dashboard `/` | 4 KPIs (Ventas hoy, Entregas hoy, Por cobrar, Stock bajo) + ranking top productos + "Producto del mes". Sin resumen de costos. Métricas no son clicables |

---

## PRINCIPIO RECTOR DE ESTE PROMPT

> Las tarjetas colapsables resuelven el problema de espacio en mobile sin sacrificar información. El estado colapsado muestra lo esencial para identificar el ítem; el estado expandido muestra todo con formato consistente y acciones disponibles.

---

## AUDITORÍA OBLIGATORIA ANTES DE EMPEZAR

Responder cada punto antes de tocar código:

```
1. TARJETAS
   - ¿Las tarjetas de Inventario y Costos comparten algún componente base?
   - ¿Existe algún componente de tarjeta colapsable ya implementado en la app?
   - ¿Qué componente shadcn/ui se usa para los filtros de período en /stock (los chips 7/14/30/90 días)?

2. COSTOS — LISTA DE COMPRAS
   - ¿Los ítems de la lista de compras tienen un campo `en_lista` o similar en Supabase?
   - ¿Existe una acción para quitar un insumo de la lista de compras?
   - ¿Cómo se agrega actualmente un insumo a la lista (toggle ★ o automático)?

3. PRODUCTOS — IMÁGENES
   - ¿La tabla de productos en Supabase ya tiene columna `imagen_url`?
   - ¿Existe bucket de storage en Supabase para imágenes de productos?
   - ¿Las tarjetas de producto actuales usan una imagen placeholder o generan un gradiente?

4. REPORTES / CALENDARIO DE VENTAS
   - ¿La ruta del archivo de Reportes es `/app/reportes/page.tsx` o similar?
   - ¿El eyebrow ya dice "ESTADÍSTICAS" o todavía dice "REPORTES"?
   - ¿Existe alguna tabla o vista en Supabase con datos de costos (no solo insumos)?

5. DASHBOARD
   - ¿Las tarjetas de KPI del Dashboard son componentes independientes o están inline en la página?
   - ¿Existe un `href` o `onClick` en cada tarjeta o son estáticas?
   - ¿Hay server action o query que calcule el costo total del período?
```

---

## SPRINT A — TARJETAS COLAPSABLES (SISTEMA GLOBAL)
### Afecta: Inventario, Costos, Pedidos, Clientes

**Concepto:** todas las tarjetas de listado (salvo Productos y Ventas, que tienen su propio patrón visual) deben adoptar el mismo comportamiento colapsable.

---

### A1 · Componente `CollapsibleCard`

Crear un componente reutilizable que sirva de base para todas las tarjetas de listado.

**Comportamiento:**

```
ESTADO COLAPSADO (default en mobile, opcional en desktop)
┌─────────────────────────────────────────────────┐
│ [Ícono] Nombre del ítem          [Badge] [∨]   │
└─────────────────────────────────────────────────┘

ESTADO EXPANDIDO (al tocar la tarjeta o el chevron)
┌─────────────────────────────────────────────────┐
│ [Ícono] Nombre del ítem          [Badge] [∧]   │
├─────────────────────────────────────────────────┤
│  Campo 1 label    │  Campo 1 valor              │
│  Campo 2 label    │  Campo 2 valor              │
│  Campo 3 label    │  Campo 3 valor              │
│  Campo 4 label    │  Campo 4 valor              │
├─────────────────────────────────────────────────┤
│  [Acción secundaria]      [Acción primaria ›]   │
└─────────────────────────────────────────────────┘
```

**Especificaciones del componente:**

```tsx
interface CollapsibleCardProps {
  // Encabezado siempre visible
  icon?: React.ReactNode        // ícono contextual (lucide-react)
  title: string                 // nombre del ítem — siempre visible
  badge?: React.ReactNode       // StatusBadge (OK / Bajo / Sin stock / etc.)

  // Contenido expandido
  fields: { label: string; value: string | React.ReactNode }[]  // filas de datos
  actions?: React.ReactNode     // botones de acción (solo visibles expandido)

  // Control
  defaultExpanded?: boolean     // false por default
  className?: string
}
```

**Reglas de comportamiento:**
- El chevron (`ChevronDown` / `ChevronUp`) está en la esquina derecha del header
- Tocar cualquier parte del header colapsa/expande
- La animación es `transition-all duration-200` — suave pero no lenta
- En desktop (`md:`) se pueden mostrar expandidas por default si el contexto lo amerita
- Los `fields` se muestran en una tabla de 2 columnas: label a la izquierda en `text-muted-foreground text-sm`, valor a la derecha en `font-medium`
- Los `actions` aparecen solo en estado expandido, en el footer de la tarjeta

**Consistencia de formato en `fields`:**
- Precios: siempre `$X.XXX` con separador de miles — nunca `$1000`
- Unidades: siempre con unidad explícita — `24 u`, `10 kg`, `500 ml`
- Fechas: siempre `lun, 30 jun` — nunca timestamp raw
- Porcentajes: siempre `47%` — nunca `0.47`

---

### A2 · Barra de filtros encima de las tarjetas

En todas las secciones con `CollapsibleCard`, agregar encima una barra de filtros consistente.

**Estructura:**

```
┌─────────────────────────────────────────────────┐
│ [🔍 Buscar por nombre...]    [Filtro ▾] [∷ ≡]  │
│                                                   │
│ [Todos] [Alfajores] [Dulces] [+ categoría]       │
└─────────────────────────────────────────────────┘
```

**Componentes:**
- Input de búsqueda: filtra por nombre en tiempo real (client-side, sin llamada al servidor)
- Chips de categoría: los mismos que ya existen en `/ventas` y `/productos` — reutilizar ese componente
- Toggle de vista: `LayoutGrid` (tarjetas) vs `List` (lista compacta) — opcional, prioridad baja
- Los chips de categoría deben cargarse dinámicamente desde las categorías existentes en Supabase

**Aplica en:** Inventario, Costos (sección INSUMOS), Pedidos (sección HISTORIAL), Clientes

**No aplica en:** Ventas, Productos (ya tienen su propio sistema de filtros)

---

### A3 · Aplicar `CollapsibleCard` en Inventario (`/stock`)

**Estado actual observado:** grilla de 3 columnas, tarjetas con altura variable, badge OK flotando junto al nombre.

**Estado objetivo:**

```
COLAPSADA:
┌────────────────────────────────────┐
│ [Package] Alfajor de Nuez  [OK] ∨ │
└────────────────────────────────────┘

EXPANDIDA:
┌────────────────────────────────────┐
│ [Package] Alfajor de Nuez  [OK] ∧ │
├────────────────────────────────────┤
│ Stock actual   │  20 u             │
│ Stock mínimo   │  10 u             │
│ Valor total    │  $10.000          │
│ Categoría      │  Alfajores        │
│ [████████░░]  20 / 30 u            │  ← barra de progreso
├────────────────────────────────────┤
│ [Editar]              [Reponer ›]  │
└────────────────────────────────────┘
```

**Fields a mostrar (en orden fijo):**
1. Stock actual (con unidad)
2. Stock mínimo (con unidad)
3. Valor total en stock (`stock × precio_unitario`)
4. Categoría

**Badge de estado:**
- `OK` → `CheckCircle` verde — stock >= mínimo
- `Bajo` → `AlertTriangle` amber — stock < mínimo y > 0
- `Sin stock` → `XCircle` rojo — stock = 0

**Acción "Reponer":** abre mini-modal para ingresar cantidad de reposición (reutilizar lógica existente de producción/stock si existe)

**Layout:** cambiar de grilla 3 columnas a lista full-width de tarjetas colapsables (más legible en mobile)

---

### A4 · Aplicar `CollapsibleCard` en Pedidos (`/pedidos`) — sección HISTORIAL

**Estado actual observado:** grilla 2 columnas con tarjetas de altura variable. Muestra: cliente, fecha, monto, productos, badge estado, ícono eliminar.

**El problema:** cuando un pedido tiene muchos productos, la tarjeta se hace muy alta y rompe la grilla.

**Estado objetivo — COLAPSADA:**
```
┌────────────────────────────────────────────┐
│ [User] Enrique Arenas   [Pagado]        ∨  │
│        vie, 26 jun · $1.850                │
└────────────────────────────────────────────┘
```

**Estado objetivo — EXPANDIDA:**
```
┌────────────────────────────────────────────┐
│ [User] Enrique Arenas   [Pagado]        ∧  │
│        vie, 26 jun · $1.850                │
├────────────────────────────────────────────┤
│ Productos    │  1× Alfajor de Nuez         │
│              │  1× Alfajor                 │
│ Total        │  $1.850                     │
│ Estado pago  │  Pagado                     │
│ Fecha cobro  │  mié, 01 jul                │
├────────────────────────────────────────────┤
│ [🗑 Eliminar]                              │
└────────────────────────────────────────────┘
```

**Cambio de layout:** de grilla 2 cols a lista full-width (igual que inventario)

---

### A5 · Aplicar `CollapsibleCard` en Clientes (`/clientes`)

**Estado actual observado:** lista simple con: avatar iniciales + nombre + teléfono + cantidad pedidos + monto total. Sin acción visible.

**Estado objetivo — COLAPSADA:**
```
┌────────────────────────────────────────────┐
│ [EA] Enrique Arenas   3 pedidos · $4.850 ∨ │
└────────────────────────────────────────────┘
```

**Estado objetivo — EXPANDIDA:**
```
┌────────────────────────────────────────────┐
│ [EA] Enrique Arenas   3 pedidos · $4.850 ∧ │
├────────────────────────────────────────────┤
│ Teléfono     │  989 056 706                │
│ Correo       │  —                          │
│ Pedidos      │  3 pedidos                  │
│ Total gastado│  $4.850                     │
│ Dirección    │  —                          │
│ Notas        │  —                          │
├────────────────────────────────────────────┤
│ [Editar]            [Ver pedidos ›]        │
└────────────────────────────────────────────┘
```

---

## SPRINT B — PRODUCTOS: IMAGEN UPLOADEABLE
### Afecta: `/productos`

---

### B1 · Soporte de imagen en tarjetas de producto

**Estado actual:** las tarjetas de producto muestran un placeholder con gradiente terracota/crema con círculos decorativos. No hay forma de subir imagen.

**Objetivo:** permitir subir una imagen por producto desde el modal de edición, y mostrarla en la tarjeta.

**Especificaciones:**

**En la tarjeta (`ProductCard`) — visualización:**
```
CON IMAGEN:
┌──────────────────────┐
│  [foto real del      │  ← object-cover, aspect-ratio 4:3
│   producto]          │
├──────────────────────┤
│ Alfajores            │
│ Alfajor de Nuez      │
│ $1.000    21 u       │
│ ...                  │

SIN IMAGEN (placeholder):
┌──────────────────────┐
│  [fondo gradiente    │  ← mantener el gradiente actual
│   sin texto]         │     sin íconos ni texto encima
├──────────────────────┤
│ ...                  │
```

**En el modal de edición/creación de producto:**

Agregar al final del formulario una sección:

```
IMAGEN DEL PRODUCTO (opcional)
┌──────────────────────────────────┐
│                                  │
│   [Camera icon]                  │
│   Subir foto del producto        │
│   JPG, PNG · máx. 2 MB          │
│                                  │
└──────────────────────────────────┘
   ↑ si ya tiene imagen, mostrarla aquí con botón "Cambiar"
```

**Implementación técnica:**
1. Verificar si ya existe bucket en Supabase Storage para imágenes de productos
2. Si no existe, crear bucket `product-images` con política de lectura pública
3. Al subir: `supabase.storage.from('product-images').upload(fileName, file)`
4. Guardar la URL pública en columna `imagen_url` de la tabla productos
5. En la tarjeta: `<img src={producto.imagen_url} />` con fallback al gradiente si es null/undefined

**Reglas:**
- La imagen es opcional — nunca bloquear el guardado del producto si no hay imagen
- El placeholder debe verse igual que ahora cuando no hay imagen (no mostrar ícono de "sin foto")
- Redimensionar del lado del cliente antes de subir si supera 2MB (usar canvas o similar)
- Mostrar progreso de upload en el botón con spinner

---

## SPRINT C — COSTOS: ELIMINAR DE LISTA DE COMPRAS
### Afecta: `/costos`

---

### C1 · Botón de eliminar en ítems de la Lista de Compras

**Estado actual observado:** la lista de compras muestra cada ítem como: `Manjar Alerce · Faltan — · El tostadito · [badge: manual]`. No hay forma de eliminar un ítem de la lista sin ir al insumo.

**Objetivo:** el flujo de la lista de compras debe funcionar similar al de "Tu bolsa" en Ventas — poder agregar y quitar ítems.

**Especificación del ítem de lista de compras:**

```
ANTES (actual):
┌──────────────────────────────────────┐
│ Manjar Alerce                        │
│ Faltan — · El tostadito   [manual]   │
└──────────────────────────────────────┘

DESPUÉS:
┌──────────────────────────────────────┐
│ Manjar Alerce              [manual]  │
│ Faltan — · El tostadito              │
│                           [🗑 Quitar] │
└──────────────────────────────────────┘
```

**Acción "Quitar":**
- Confirmar con un dialog de confirmación pequeño o toast con "deshacer"
- La acción debe cambiar el campo `en_lista` (o equivalente) a `false` en Supabase
- Actualizar el contador "LISTA DE COMPRAS (N)" en tiempo real
- Toast de éxito: "Manjar Alerce quitado de la lista"

**También:** el botón de agregar a lista desde la tarjeta de insumo debe ser visible en el estado expandido del `CollapsibleCard` del insumo (Sprint A).

---

### C2 · Módulo de "Planificación de compras" en Calendario

**Concepto:** de la misma forma que en Calendario se puede "Agendar producción", debe poder agendarse una "Compra de insumos".

**Dónde aparece:** en el Calendario, junto al botón "+ Agendar producción", agregar "+ Planificar compra".

**Modal "Planificar compra":**

```
┌─────────────────────────────────────────┐
│ [ShoppingCart] Planificar compra   [✕]  │
│ Agenda cuándo y qué insumos comprar.    │
├─────────────────────────────────────────┤
│  INSUMOS A COMPRAR                      │
│  [Select insumo ▾]  Cantidad  [+ Agregar]│
│  ┌────────────────────────────────────┐ │
│  │ • Manjar Alerce · 2 u             │ │
│  └────────────────────────────────────┘ │
│                                         │
│  FECHA                                  │
│  [date picker]                          │
│                                         │
│  PROVEEDOR (opcional)                   │
│  [text input]                           │
│                                         │
│  NOTAS (opcional)                       │
│  [textarea]                             │
├─────────────────────────────────────────┤
│ [Cancelar]             [Agendar compra] │
└─────────────────────────────────────────┘
```

**En el Calendario:** los eventos de compra se muestran con:
- Ícono `ShoppingCart` en color gold
- Badge "Compra" en gold
- Aparecen en la leyenda junto a Entregas, Cobros y Producciones

**Estadísticas de compras:** se mueven a Estadísticas (ver Sprint E), no se muestran en el Calendario.

---

## SPRINT D — ESTADÍSTICAS (ex Reportes): FILTRO POR ÁREA
### Afecta: `/reportes`

---

### D1 · Renombrar "Reportes" → "Estadísticas"

**Estado actual observado:** el eyebrow ya dice "ESTADÍSTICAS" ✅ pero el título de la página dice "Reportes" y la entrada del menú "Más" dice "Reportes".

**Cambios necesarios:**
1. Título `<h1>` de la página: "Reportes" → "Estadísticas"
2. Entrada en el menú "Más": "Reportes" → "Estadísticas"
3. Botón "Ver reportes" en el Dashboard → "Ver estadísticas"
4. Cualquier otro texto que diga "reportes" en la UI (buscar con grep)
5. La ruta `/reportes` puede mantenerse igual para no romper nada

---

### D2 · Tabs de filtro por área: Ventas / Inventario / Costos

**Estado actual:** la página muestra todo junto — KPIs de ventas + gráfico top productos + gráfico producción. No hay forma de ver solo costos o solo inventario.

**Objetivo:** agregar tabs de área en la parte superior, debajo de los filtros de período.

**Layout:**

```
ESTADÍSTICAS                         [7d] [30d] [90d] [Todo]
─────────────────────────────────────────────────────────────
[Ventas]  [Inventario]  [Costos]
─────────────────────────────────────────────────────────────

Tab VENTAS (actual, ya existe):
  • KPIs: Ventas del período, Ventas de hoy, Ventas del mes, Stock total
  • Gráfico: Top productos más vendidos (barras horizontales)
  • Gráfico: Ventas por día (línea temporal)
  • Historial de transacciones

Tab INVENTARIO (nuevo):
  • KPIs: Total unidades, Valor del inventario, Productos bajo mínimo, Rotación
  • Gráfico: Stock por producto (barras horizontales)
  • Gráfico: Producción registrada por día (ya existe en Reportes actual)
  • Lista: movimientos de stock del período

Tab COSTOS (nuevo):
  • KPIs: Gasto en insumos del período, Costo promedio por venta, Margen bruto, Insumos bajo mínimo
  • Gráfico: Gasto por insumo (barras horizontales)
  • Lista: compras realizadas del período
  • Nota: si no hay datos de compras aún, mostrar estado vacío con CTA a Planificar compra
```

**Implementación:**
- Usar el componente `Tabs` de shadcn/ui
- El tab activo se mantiene en estado local (no en URL) — no requiere routing
- Los datos de cada tab se cargan lazy (solo cuando se activa el tab)
- Reutilizar los gráficos de Recharts ya existentes — solo cambiar los datos

**Para el tab Costos:** si `margen = precio_venta - costo_produccion`, este dato ya existe en la tabla de productos. El KPI "Margen bruto" puede calcularse como `SUM(ventas.precio) - SUM(ventas.costo)` del período.

---

## SPRINT E — DASHBOARD: COSTOS Y MÉTRICAS CLICABLES
### Afecta: `/` (Dashboard)

---

### E1 · Agregar KPI de Costos al Dashboard

**Estado actual:** 4 KPIs (Ventas hoy, Entregas hoy, Por cobrar, Stock bajo). No hay ninguna métrica de costos.

**Agregar una 5ª tarjeta de KPI:**

```
┌──────────────────────────────┐
│ Costos del mes    [Receipt]  │
│                              │
│ $4.900                       │
│ insumos registrados          │
└──────────────────────────────┘
```

**Dato:** suma de `(costo_unitario × stock_actual)` de todos los insumos, o bien suma de compras del mes si existe ese registro. Usar el dato más significativo disponible.

**Posición:** agregar como 5ª tarjeta después de "Stock bajo", o reemplazar la disposición 2×2 por 2×2 + 1 centrada debajo, según lo que se vea mejor.

---

### E2 · Métricas del Dashboard clicables → Estadísticas

**Estado actual:** las 4 tarjetas de KPI son estáticas. El botón "Ver reportes" que existe junto al ranking de productos lleva a Reportes.

**Objetivo:** cada tarjeta de KPI debe ser clicable y llevar a la tab correspondiente en Estadísticas.

**Mapping:**

| KPI Dashboard | Destino en Estadísticas |
|---|---|
| Ventas hoy | `/reportes` → tab Ventas |
| Entregas hoy | `/pedidos` (lista de pendientes) |
| Por cobrar | `/cobrar` (sección de cobranza) |
| Stock bajo | `/reportes` → tab Inventario |
| Costos del mes | `/reportes` → tab Costos |

**Implementación:**
- Envolver cada tarjeta en un `<Link href="...">` o agregar `onClick` con `router.push()`
- Agregar hover sutil: `hover:shadow-md hover:scale-[1.01] transition-all cursor-pointer`
- No cambiar el diseño visual de las tarjetas — solo hacerlas interactivas

---

### E3 · Botón "Ver reportes" → "Ver estadísticas"

En el ranking de "Top productos más vendidos", el botón de la esquina derecha actualmente dice "Ver reportes". Cambiar a "Ver estadísticas" y asegurar que el link apunta a `/reportes`.

---

## TABLA DE PRIORIDADES

| Sprint | Tarea | Urgencia | Esfuerzo estimado |
|---|---|---|---|
| A1 | Componente `CollapsibleCard` | 🔴 Alta | Medio — base de todo lo demás |
| A2 | Barra de filtros global | 🔴 Alta | Bajo |
| A3 | Tarjetas colapsables en Inventario | 🔴 Alta | Bajo (usa A1) |
| A4 | Tarjetas colapsables en Pedidos | 🟡 Media | Bajo (usa A1) |
| A5 | Tarjetas colapsables en Clientes | 🟡 Media | Bajo (usa A1) |
| B1 | Upload de imagen en Productos | 🟡 Media | Alto |
| C1 | Eliminar de lista de compras en Costos | 🟡 Media | Bajo |
| C2 | Planificar compra en Calendario | 🟢 Baja | Alto |
| D1 | Renombrar Reportes → Estadísticas | 🔴 Alta | Muy bajo |
| D2 | Tabs Ventas / Inventario / Costos | 🟡 Media | Medio |
| E1 | KPI Costos en Dashboard | 🟡 Media | Bajo |
| E2 | KPIs clicables → Estadísticas | 🟡 Media | Bajo |
| E3 | Botón "Ver estadísticas" | 🔴 Alta | Muy bajo |

**Orden sugerido de ejecución:**
1. D1 + E3 (renombres — 10 minutos, cero riesgo)
2. A1 (componente base — habilita A2-A5)
3. A2 + A3 (filtros + inventario colapsable)
4. A4 + A5 (pedidos + clientes colapsables)
5. C1 (eliminar de lista de compras)
6. E1 + E2 (dashboard costos + clicables)
7. D2 (tabs estadísticas)
8. B1 (upload imagen — mayor riesgo técnico, dejarlo para cuando el resto esté estable)
9. C2 (planificar compra en calendario — feature nueva compleja)

---

## ESPECIFICACIONES DE CONSISTENCIA

### Formato de datos en tarjetas (reglas globales)

```
Precios:    $X.XXX        → $1.850, $10.000, $0
Cantidades: N unidad      → 24 u, 10 kg, 500 ml
Fechas:     día, DD mes   → lun, 26 jun
Porcentajes: N%           → 47%, 12%
Vacío:      —             → nunca dejar en blanco sin indicador
```

### Comportamiento del `CollapsibleCard` en distintos contextos

| Contexto | Default mobile | Default desktop |
|---|---|---|
| Inventario | colapsado | expandido |
| Pedidos historial | colapsado | colapsado |
| Clientes | colapsado | colapsado |
| Costos insumos | colapsado | expandido |

### Ícono contextual por sección

| Sección | Ícono header de tarjeta |
|---|---|
| Inventario | `Package` |
| Pedidos | `ClipboardList` |
| Clientes | `User` |
| Costos / Insumos | `Box` |

---

## CRITERIOS DE ACEPTACIÓN

**Sprint A — Tarjetas:**
- [ ] `CollapsibleCard` funciona en Inventario, Pedidos y Clientes
- [ ] El colapso/expansión es suave (animación `duration-200`)
- [ ] Los datos siempre aparecen en el mismo orden en todas las tarjetas
- [ ] Los precios tienen separador de miles, las cantidades tienen unidad
- [ ] El filtro de búsqueda funciona client-side sin delay
- [ ] Los chips de categoría filtran correctamente las tarjetas visibles

**Sprint B — Imagen:**
- [ ] Se puede subir imagen desde el modal de producto
- [ ] La imagen se muestra en la tarjeta si existe
- [ ] Si no hay imagen, el placeholder queda en blanco (solo gradiente, sin texto)
- [ ] El upload muestra spinner durante el proceso
- [ ] La imagen no es obligatoria para guardar el producto

**Sprint C — Costos:**
- [ ] El botón "Quitar" elimina el ítem de la lista de compras
- [ ] El contador `LISTA DE COMPRAS (N)` se actualiza en tiempo real
- [ ] Toast de confirmación al quitar

**Sprint D — Estadísticas:**
- [ ] El título de la página dice "Estadísticas"
- [ ] El menú Más dice "Estadísticas"
- [ ] Los 3 tabs (Ventas / Inventario / Costos) cargan sin errores
- [ ] El tab Costos muestra estado vacío correcto si no hay datos

**Sprint E — Dashboard:**
- [ ] KPI "Costos del mes" aparece en el Dashboard
- [ ] Cada tarjeta de KPI lleva al destino correcto al hacer clic
- [ ] El hover de las tarjetas es visible pero sutil

---

## REGLAS GENERALES PARA CLAUDE CODE

1. **Auditar antes de modificar** — leer el componente completo antes de editar cualquier archivo
2. **A1 es prerequisito** — no implementar A3-A5 sin tener A1 funcionando
3. **No tocar Ventas ni Productos** — esos tienen su propio sistema de tarjetas y están bien
4. **No duplicar server actions** — si ya existe `actualizarInsumo` o similar, reutilizarlo
5. **Reutilizar componentes de shadcn/ui** — `Tabs`, `Collapsible`, `Badge`, `Button`, `Input`
6. **El formato de datos es obligatorio** — nunca mostrar precios sin formato ni fechas como timestamp
7. **Mobile primero** — el default de las tarjetas es colapsado porque la mayoría del uso es en mobile
