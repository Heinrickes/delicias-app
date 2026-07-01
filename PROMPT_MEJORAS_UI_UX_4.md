# PROMPT MAESTRO V3 · DELICIAS CASERAS
### Para Claude Code — Mejoras UI/UX: Tarjetas, Herramientas, Compras, Productos, Estadísticas y Dashboard

> **Contexto:** Este prompt complementa el V2. Asume que el Sprint 1 del V2 ya está completo o en curso. Las mejoras se basan en inspección visual directa de la app (29 junio 2026) y en decisiones de diseño de negocio confirmadas con el dueño del producto.

---

## STACK Y RESTRICCIONES (no cambiar)

- Next.js App Router + TypeScript + React 19
- shadcn/ui + Tailwind CSS v4
- Supabase (Postgres + Auth con RLS) — reutilizar server actions existentes
- lucide-react para íconos · sonner para toasts · Recharts para gráficos
- Identidad visual intocable: cream / chocolate / terracotta / gold · Vidaloka + Montserrat

---

## MODELO MENTAL: SIMETRÍA VENTAS ↔ COMPRAS

Este es el principio de diseño más importante de este prompt. La app tiene dos flujos económicos simétricos:

```
SALIDA DE DINERO (vender)          ENTRADA DE DINERO EN INSUMOS (comprar)
─────────────────────────────      ─────────────────────────────────────────
Pantalla: Vender                   Pantalla: Compras  (ex Costos)
Catálogo: Productos                Catálogo: Insumos
Acción:   Agregar a Tu bolsa       Acción:   Agregar a Tu compra
Drawer:   Tu bolsa                 Drawer:   Tu compra
Confirmar: Venta inmediata         Confirmar: Compra inmediata
Diferir:  Por cobrar               Diferir:  Planificar compra
Estado:   Pendiente de cobro       Estado:   Pendiente de compra
Cerrar:   Marcar como pagado       Cerrar:   Marcar como comprado
Historial: Estadísticas/Ventas     Historial: Estadísticas/Costos
Calendario: Evento de cobro        Calendario: Evento de compra planificada
```

**Por cobrar** y **Planificar compra** son exactamente análogos:
- Ambos representan una transacción que existe en el sistema pero aún no se ha completado
- Ambos aparecen en el Calendario con una fecha objetivo
- Ambos se cierran con una acción de "marcar como completado"
- Al cerrarlos: Por cobrar registra el ingreso · Planificar compra registra el gasto y sube stock

---

## ESTADO ACTUAL OBSERVADO (inspección 29-jun-2026)

| Sección | Estado visual actual |
|---|---|
| Inventario `/stock` | Grilla 3 cols. Sin herramienta de acción en header. Sin colapso ni filtro |
| Costos `/costos` | Solo "Agregar insumo". Lista de compras estática. Sin drawer de compra. Sin "Planificar compra" |
| Ventas `/ventas` | ✅ Referencia positiva: catálogo de productos + ícono bolsa en tarjeta + drawer "Tu bolsa" |
| Calendario `/calendario` | Tiene botones `Planificar compra` y `Agendar producción` — deben eliminarse |
| Pedidos `/pedidos` | Tarjetas con historial en grilla 2 cols. Referencia del drawer: "Tu bolsa" en Ventas |
| Clientes `/clientes` | Lista simple. Sin acciones visibles |
| Reportes `/reportes` | eyebrow "ESTADÍSTICAS" ✅, título "Reportes". Sin tabs por área |
| Dashboard `/` | 4 KPIs estáticos. Sin costos. Sin links |

---

## REGLA MAESTRA: CADA HERRAMIENTA EN SU PANTALLA PROPIETARIA

| Herramienta | Pantalla propietaria | En Calendario |
|---|---|---|
| Agendar producción | **Inventario** `/stock` | Solo visualiza |
| Planificar compra | **Compras** `/costos` | Solo visualiza |
| Agregar insumo | **Compras** `/costos` | No aplica |
| Nuevo producto | **Productos** `/productos` | No aplica |

El Calendario es un panel de vista consolidada — no crea nada, solo muestra.

---

## AUDITORÍA OBLIGATORIA ANTES DE EMPEZAR

```
1. FLUJO DE VENTAS (referencia para replicar en Compras)
   - ¿Dónde está definido el componente del drawer "Tu bolsa"?
   - ¿Qué server action ejecuta la venta al confirmar? ¿Descuenta stock de productos?
   - ¿Dónde se guarda el registro de venta en Supabase (tabla ventas o similar)?
   - ¿Existe el concepto de "Por cobrar" como estado en esa tabla?

2. FLUJO DE COMPRAS (a construir en espejo)
   - ¿La tabla de insumos tiene columna `stock_actual` actualizable?
   - ¿Existe tabla `compras` o similar en Supabase, o los gastos van a otra tabla?
   - ¿Los ítems de la lista de compras tienen campo `en_lista` o `planificado`?
   - ¿El modal de "Planificar compra" del Calendario guarda en alguna tabla ya?

3. HERRAMIENTAS Y CALENDARIO
   - ¿Dónde está definido el modal de "Agendar producción" en el Calendario?
   - ¿Los eventos de producción y compra tienen tabla propia o van a la tabla de pedidos?

4. TARJETAS Y COMPONENTES
   - ¿Las tarjetas de Inventario y Costos comparten algún componente base?
   - ¿Existe componente `Collapsible` de shadcn/ui ya instalado en el proyecto?

5. PRODUCTOS E IMÁGENES
   - ¿La tabla de productos tiene columna `imagen_url`?
   - ¿Existe bucket en Supabase Storage para imágenes?

6. DASHBOARD Y REPORTES
   - ¿Las tarjetas de KPI del Dashboard son componentes independientes o inline?
   - ¿Existe server action que calcule el gasto total en insumos del período?
```

---

## SPRINT A — RENOMBRES Y TEXTOS (cero riesgo, ejecutar primero)
### Afecta: `/reportes`, `/costos`, Dashboard, menú Más

Cambios de texto puro. Sin tocar lógica ni componentes estructurales.

### A1 · Renombrar "Reportes" → "Estadísticas"

Buscar con grep y reemplazar en toda la UI (no en rutas):

| Ubicación | Actual | Nuevo |
|---|---|---|
| `/reportes/page.tsx` `<h1>` | Reportes | Estadísticas |
| Menú Más | Reportes | Estadísticas |
| Dashboard · botón "Ver reportes" | Ver reportes | Ver estadísticas |
| Cualquier texto visible "reportes" | reportes | estadísticas |

**La ruta `/reportes` NO cambia.**

### A2 · Renombrar "Costos" → "Compras"

| Ubicación | Actual | Nuevo |
|---|---|---|
| `/costos/page.tsx` `<h1>` | Costos | Compras |
| eyebrow | INSUMOS | DESPENSA |
| Menú Más | Costos | Compras |
| Dashboard KPI | Costos del mes | Gastos del mes |
| Descripción de página | "Tu despensa de insumos..." | "Tu despensa: compra insumos y controla tu stock." |

**La ruta `/costos` NO cambia.**

---

## SPRINT B — PANTALLA COMPRAS: FLUJO ESPEJO DE VENTAS
### Afecta: `/costos` (ahora llamada Compras)

Este es el sprint más importante. Transforma la pantalla de Costos en una pantalla de compra activa, con la misma mecánica que Ventas pero en sentido inverso.

---

### B1 · Estructura general de la pantalla Compras

```
DESPENSA
Compras                                    [+]           [📅]
Tu despensa: compra insumos y controla tu stock.    Agregar    Agendar
                                                    insumo     compra

┌──────────────┐  ┌──────────────┐  ┌──────────────┐
│ INSUMOS      │  │ VALOR        │  │ POR COMPRAR  │
│ 2            │  │ DESPENSA     │  │ 2            │
│              │  │ $4.970       │  │              │
└──────────────┘  └──────────────┘  └──────────────┘

[🔍 Buscar insumo...]
[Todos] [Lácteos] [Secos] [...]

                                              [🛒] ← Tu compra (con badge contador)
┌────────────────────┐  ┌────────────────────┐
│ Manjar Alerce  [🛒]│  │ Galletas Don Tito  │
│ $4.900 / unidad    │  │ [Bajo]         [🛒]│
│ Stock: 11 u        │  │ $70 / unidad       │
│ mín: 11 u          │  │ Stock: 1 u         │
│                    │  │ mín: 10 u          │
└────────────────────┘  └────────────────────┘
```

**Cambios respecto al estado actual:**
- Las tarjetas de insumos pasan al centro de la pantalla como catálogo navegable (igual que productos en Ventas)
- La "Lista de compras" estática desaparece como sección separada — su función la absorbe el drawer
- Los insumos marcados previamente "en lista" aparecen pre-seleccionados en el drawer al abrirlo
- Ícono `ShoppingCart` en cada tarjeta para agregar al drawer

---

### B2 · Tarjetas de insumo en la pantalla Compras

Cada tarjeta de insumo sigue el mismo patrón visual que las tarjetas de producto en Ventas:

```
┌──────────────────────────┐
│  [gradiente o imagen]    │  ← placeholder igual que productos
│                     [🛒] │  ← ícono ShoppingCart esquina inferior derecha
├──────────────────────────┤
│ LÁCTEOS                  │  ← categoría en mayúsculas
│ Manjar Alerce            │  ← nombre
│ $4.900 / unidad          │  ← precio unitario
│ Stock: 11 · mín: 11  ⚠️ │  ← stock actual y mínimo con badge si está bajo
└──────────────────────────┘
```

**Badge de alerta:**
- Sin alerta: stock > mínimo
- `⚠️ Bajo` (amber): stock <= mínimo y > 0
- `✕ Sin stock` (rojo): stock = 0

**Al tocar el ícono `🛒`:** agrega 1 unidad al drawer "Tu compra". Si ya está en el drawer, incrementa en 1.

---

### B3 · Drawer "Tu compra" — espejo exacto de "Tu bolsa"

El drawer se activa desde el ícono flotante "Tu compra" (esquina superior derecha), idéntico en posición y comportamiento al de "Tu bolsa" en Ventas.

```
┌──────────────────────────────────┐
│ Tu compra  ●2                [✕] │  ← contador de ítems
├──────────────────────────────────┤
│                                  │
│  Manjar Alerce              [✕]  │
│  $4.900 / unidad                 │
│  [−]  2  [+]             $9.800  │
│                                  │
│  Galletas Don Tito          [✕]  │
│  $70 / unidad                    │
│  [−] 99  [+]             $6.930  │
│                                  │
├──────────────────────────────────┤
│  Total estimado                  │
│  $16.730                         │
├──────────────────────────────────┤
│  [Planificar para después]  [→]  │
│                 Comprar ahora    │
└──────────────────────────────────┘
```

**Comportamiento del drawer:**
- Se abre como bottom sheet (mismo componente Sheet de shadcn/ui que "Tu bolsa")
- Los insumos que estaban en la "Lista de compras" anterior aparecen pre-cargados al abrir
- Cantidad editable con `[−]` y `[+]` (igual que "Tu bolsa")
- Precio por ítem editable opcionalmente (el precio real puede diferir del registrado)
- Total se recalcula en tiempo real
- Botón `[✕]` por ítem para quitarlo del drawer

**Dos acciones de cierre — igual que Ventas tiene "Confirmar venta" o dejar "Por cobrar":**

**→ "Comprar ahora" (botón primario):**
- Registra la compra con fecha = hoy
- Suma stock de cada insumo comprado (`stock_actual += cantidad`)
- Registra el gasto en tabla `compras` con estado `completado`
- Toast: "Compra registrada. Stock actualizado."
- El evento aparece en Calendario como compra completada

**→ "Planificar para después" (botón secundario):**
- Registra la compra con fecha seleccionable (date picker inline)
- NO modifica el stock todavía
- Guarda en tabla `compras` con estado `planificado`
- Toast: "Compra planificada para [fecha]"
- El evento aparece en Calendario como compra pendiente (análogo a Por cobrar)

---

### B4 · "Planificar compra" como estado — análogo a "Por cobrar"

Una compra planificada es una transacción de insumos que existe en el sistema pero no ha ocurrido todavía. La mecánica es idéntica a "Por cobrar":

```
VENTAS — Por cobrar              COMPRAS — Planificada
──────────────────────────       ──────────────────────────────
Estado en tabla: por_cobrar      Estado en tabla: planificado
Aparece en Calendario: sí        Aparece en Calendario: sí
KPI en Dashboard: Por cobrar     KPI en Dashboard: Por comprar
Acción de cierre: Cobrado ✓      Acción de cierre: Comprado ✓
Efecto al cerrar: registra       Efecto al cerrar: sube stock
                  el ingreso                      + registra gasto
```

**En el Calendario, la tarjeta de una compra planificada:**
```
┌──────────────────────────────────┐
│ [🛒] Compra planificada          │
│ Manjar Alerce (2u) + 1 más       │
│ Estimado: $16.730                │
│ El Tostadito                     │
│                                  │
│ [Ver detalle]    [✓ Comprado]    │
└──────────────────────────────────┘
```

Al tocar "✓ Comprado":
- Cambia estado a `completado`
- Sube stock de cada insumo
- Registra el gasto con la fecha real (hoy)
- Toast: "Compra completada. Stock actualizado."

---

### B5 · KPI "Por comprar" en la pantalla Compras

El KPI "POR COMPRAR" ya existe en la pantalla actual de Costos. Actualizar su comportamiento:
- El número refleja la cantidad de compras en estado `planificado`
- Al tocarlo: hace scroll o filtra para mostrar solo los insumos con compras pendientes
- Si hay compras planificadas vencidas (fecha pasada): el número aparece en rojo

---

### B6 · Tabla Supabase para compras

Verificar si ya existe. Si no, crear:

```sql
create table compras (
  id uuid primary key default gen_random_uuid(),
  items jsonb not null,
  -- [{ insumo_id, nombre, cantidad, precio_unitario }]
  total numeric not null,
  proveedor text,
  notas text,
  fecha_planificada date,
  fecha_completada date,
  estado text not null default 'planificado',
  -- 'planificado' | 'completado' | 'cancelado'
  creado_en timestamptz default now()
);
```

**Server actions necesarios:**
- `crearCompra(items, total, fecha, proveedor, notas)` → inserta con estado `planificado`
- `completarCompra(id)` → cambia estado, actualiza stock de cada insumo, registra fecha_completada
- `cancelarCompra(id)` → cambia estado a `cancelado`
- `obtenerCompras(estado?)` → lista con filtro opcional por estado

---

## SPRINT C — HERRAMIENTAS EN SUS PANTALLAS PROPIETARIAS
### Afecta: Inventario `/stock`, Compras `/costos`, Calendario `/calendario`

---

### C1 · Patrón visual de botones herramienta

Mismo patrón que ya existe en Productos (Categorías + Crear Delicia): ícono circular chocolate + label debajo.

```
[⊕ Agregar insumo]   [📅 Agendar compra]    ← en Compras
[⊕ Agendar prod.]                            ← en Inventario
```

Máximo 2 herramientas por header de página.

### C2 · Mover "Agendar producción" a Inventario

1. Extraer `AgendarProduccionModal` del Calendario a componente compartido
2. Importarlo en `/stock` con ícono `ChefHat` · Label: "Agendar producción"
3. **Eliminar** el botón del Calendario

### C3 · Limpiar el Calendario — solo visualización

**Eliminar del Calendario:**
- Botón `Planificar compra`
- Botón `Agendar producción`

**Mantener en el Calendario:**
- Chips de leyenda: Entregas · Cobros · Producciones · Compras (son filtros, no acciones)
- Visualización de todos los eventos en la grilla
- Panel de detalle del día al tocarlo:

```
lunes, 30 de junio
──────────────────────────────────
[🍽 Producción]
Alfajor de Nuez · 15 unidades
→ Agendada desde Inventario

[🛒 Compra planificada]
Manjar Alerce (2u) · Galletas Don Tito (99u)
Estimado $16.730 · El Tostadito
[✓ Marcar como comprado]
──────────────────────────────────
Sin entregas · Sin cobros
```

---

## SPRINT D — TARJETAS COLAPSABLES (SISTEMA GLOBAL)
### Afecta: Inventario, Compras (insumos), Pedidos, Clientes

---

### D1 · Componente `CollapsibleCard`

```tsx
interface CollapsibleCardProps {
  icon?: React.ReactNode
  title: string
  subtitle?: string          // visible en estado colapsado
  badge?: React.ReactNode
  fields: { label: string; value: string | React.ReactNode }[]
  actions?: React.ReactNode  // solo visible expandido
  defaultExpanded?: boolean
  className?: string
}
```

```
COLAPSADO:
┌─────────────────────────────────────────────────┐
│ [Ícono] Nombre           [subtítulo]  [Badge] ∨ │
└─────────────────────────────────────────────────┘

EXPANDIDO:
┌─────────────────────────────────────────────────┐
│ [Ícono] Nombre           [subtítulo]  [Badge] ∧ │
├─────────────────────────────────────────────────┤
│  Label 1    │  Valor 1                           │
│  Label 2    │  Valor 2                           │
│  Label 3    │  Valor 3                           │
├─────────────────────────────────────────────────┤
│  [Acción 2]               [Acción 1 ›]          │
└─────────────────────────────────────────────────┘
```

**Formato obligatorio de datos:**
```
Precios:      $X.XXX       →  $1.850, $10.000
Cantidades:   N unidad     →  24 u, 10 kg
Fechas:       día, DD mes  →  lun, 26 jun
Porcentajes:  N%           →  47%
Vacío:        —            →  nunca en blanco
```

**Animación:** `transition-all duration-200`

**Defaults:**

| Contexto | Mobile | Desktop |
|---|---|---|
| Inventario | colapsado | expandido |
| Compras / insumos | colapsado | expandido |
| Pedidos historial | colapsado | colapsado |
| Clientes | colapsado | colapsado |

---

### D2 · Barra de filtros (aplica a todas las secciones con CollapsibleCard)

```
┌──────────────────────────────────────────────┐
│ [🔍 Buscar por nombre...]                    │
│ [Todos] [Categoría 1] [Categoría 2] [...]    │
└──────────────────────────────────────────────┘
```

- Búsqueda client-side en tiempo real
- Chips cargados dinámicamente desde Supabase
- Aplica en: Inventario, Compras (insumos), Pedidos (historial), Clientes

### D3 · CollapsibleCard en Inventario

```
COLAPSADA: [Package] Alfajor de Nuez  [OK] ∨
EXPANDIDA:
  Stock actual   │ 20 u
  Stock mínimo   │ 10 u
  Valor total    │ $10.000
  Categoría      │ Alfajores
  [████████░░] 20/30 u
  [Editar]          [Reponer ›]
```

### D4 · CollapsibleCard en Pedidos (historial)

```
COLAPSADA: [User] Enrique Arenas  [Pagado]  $1.850  vie 26 jun ∨
EXPANDIDA:
  Productos    │ 1× Alfajor de Nuez · 1× Alfajor
  Total        │ $1.850
  Estado pago  │ Pagado
  Fecha cobro  │ mié, 01 jul
  [🗑 Eliminar]
```

### D5 · CollapsibleCard en Clientes

```
COLAPSADA: [EA] Enrique Arenas  3 pedidos · $4.850 ∨
EXPANDIDA:
  Teléfono      │ 989 056 706
  Correo        │ —
  Total gastado │ $4.850
  Dirección     │ —
  Notas         │ —
  [Editar]        [Ver pedidos ›]
```

---

## SPRINT E — PRODUCTOS: IMAGEN UPLOADEABLE
### Afecta: `/productos`

### E1 · Upload de imagen por producto

- Verificar/crear bucket `product-images` en Supabase Storage con lectura pública
- Verificar/agregar columna `imagen_url` en tabla productos
- Sección al final del modal de producto:

```
IMAGEN (opcional)
┌──────────────────────────────────┐
│  [Camera]  Subir foto            │
│  JPG o PNG · máx. 2 MB          │
└──────────────────────────────────┘
```

- Con imagen: mostrarla con botón "Cambiar foto"
- Sin imagen: placeholder = gradiente actual (sin ícono ni texto adicional)
- Imagen nunca es obligatoria para guardar

---

## SPRINT F — ESTADÍSTICAS: TABS POR ÁREA
### Afecta: `/reportes`

### F1 · Tabs Ventas / Inventario / Costos

```
ESTADÍSTICAS                       [7d] [30d] [90d] [Todo]
───────────────────────────────────────────────────────────
[ Ventas ]  [ Inventario ]  [ Costos ]
───────────────────────────────────────────────────────────
```

**Tab VENTAS** (contenido actual reorganizado):
- KPIs: Ventas del período · Ventas hoy · Ventas del mes · Stock total
- Gráfico: Top productos más vendidos
- Gráfico: Ventas por día
- Historial de transacciones

**Tab INVENTARIO** (nuevo):
- KPIs: Total unidades · Valor inventario · Bajo mínimo · Rotación
- Gráfico: Stock por producto
- Gráfico: Producción por día (mover desde vista actual)
- Lista: movimientos de stock del período

**Tab COSTOS** (nuevo):
- KPIs: Gasto del período · Costo promedio por venta · Margen bruto · Compras pendientes
- Gráfico: Gasto por insumo
- Lista: compras completadas + planificadas del período
- Estado vacío: "Sin compras registradas. Inicia una compra desde Compras."

**Implementación:**
- Componente `Tabs` de shadcn/ui
- Estado local (no en URL)
- Carga lazy por tab

---

## SPRINT G — DASHBOARD: MÉTRICAS COMPLETAS Y CLICABLES
### Afecta: `/`

### G1 · KPI "Gastos del mes"

```
┌──────────────────────────────┐
│ Gastos del mes   [Receipt]   │
│ $16.730                      │
│ en insumos este mes          │
└──────────────────────────────┘
```

Dato: suma de compras con estado `completado` del mes en curso.

### G2 · KPI "Por comprar"

```
┌──────────────────────────────┐
│ Por comprar   [ShoppingCart] │
│ 2                            │
│ compras planificadas         │
└──────────────────────────────┘
```

Dato: cantidad de compras con estado `planificado`. En rojo si alguna tiene fecha vencida.

### G3 · Todos los KPIs clicables

| KPI | Destino |
|---|---|
| Ventas hoy | `/reportes` → tab Ventas |
| Entregas hoy | `/pedidos` |
| Por cobrar | `/cobrar` |
| Stock bajo | `/reportes` → tab Inventario |
| Gastos del mes | `/reportes` → tab Costos |
| Por comprar | `/costos` (pantalla Compras) |

Hover: `hover:shadow-md hover:scale-[1.01] transition-all cursor-pointer`

---

## TABLA DE PRIORIDADES Y ORDEN

| Sprint | Tarea | Urgencia | Esfuerzo | Dependencia |
|---|---|---|---|---|
| A1+A2 | Renombres Estadísticas + Compras | 🔴 Alta | Muy bajo | — |
| B1-B6 | Pantalla Compras con drawer | 🔴 Alta | Alto | A2 |
| C1-C3 | Herramientas propietarias + Calendario lectura | 🔴 Alta | Medio | — |
| D1 | Componente `CollapsibleCard` | 🟡 Media | Medio | — |
| D2-D5 | Filtros + tarjetas colapsables | 🟡 Media | Bajo | D1 |
| G1-G3 | Dashboard KPIs + clicables | 🟡 Media | Bajo | B1 |
| F1 | Tabs Estadísticas | 🟡 Media | Medio | A1, B1 |
| E1 | Upload imagen productos | 🟢 Baja | Alto | — |

**Orden de ejecución:**
1. **A1 + A2** — renombres de texto, 10 minutos, cero riesgo
2. **C1 → C3** — limpiar Calendario y mover herramientas
3. **B1 → B6** — pantalla Compras completa con drawer (el sprint más complejo)
4. **D1** — componente base `CollapsibleCard`
5. **D2 → D5** — tarjetas colapsables en todas las secciones
6. **G1 → G3** — Dashboard actualizado
7. **F1** — tabs de Estadísticas
8. **E1** — upload de imagen (al final, mayor complejidad técnica)

---

## CRITERIOS DE ACEPTACIÓN

**Sprint A — Renombres:**
- [ ] La pantalla dice "Estadísticas" en `<h1>` y en menú Más
- [ ] La pantalla dice "Compras" en `<h1>` y en menú Más
- [ ] No queda ningún texto visible "Reportes" ni "Costos" en la UI

**Sprint B — Pantalla Compras:**
- [ ] Las tarjetas de insumos tienen ícono `ShoppingCart` para agregar
- [ ] El drawer "Tu compra" se abre y funciona como espejo de "Tu bolsa"
- [ ] Se pueden agregar/quitar insumos y editar cantidades
- [ ] "Comprar ahora" sube el stock de cada insumo y registra el gasto
- [ ] "Planificar para después" guarda con estado `planificado` sin tocar el stock
- [ ] Las compras planificadas aparecen en el Calendario
- [ ] "Marcar como comprado" en el Calendario completa la transacción y sube el stock

**Sprint C — Herramientas:**
- [ ] "Agendar producción" es ícono herramienta en Inventario
- [ ] El Calendario no tiene botones de creación
- [ ] Los eventos de producción y compra se ven en el Calendario
- [ ] El panel de detalle del día muestra los eventos con acción "Marcar como comprado"

**Sprint D — Tarjetas:**
- [ ] `CollapsibleCard` funciona en Inventario, Pedidos y Clientes
- [ ] Animación suave `duration-200`
- [ ] Datos siempre en el mismo orden y formato
- [ ] Búsqueda y filtros funcionan client-side

**Sprint E — Imagen:**
- [ ] Se puede subir imagen desde el modal de producto
- [ ] Sin imagen: solo gradiente, sin texto ni ícono adicional
- [ ] Imagen no bloquea el guardado

**Sprint F — Estadísticas:**
- [ ] 3 tabs funcionan y cargan datos correctos
- [ ] Tab Costos muestra compras completadas y planificadas

**Sprint G — Dashboard:**
- [ ] KPI "Gastos del mes" muestra suma de compras completadas
- [ ] KPI "Por comprar" muestra compras planificadas (rojo si vencidas)
- [ ] Todos los KPIs son clicables y llevan al destino correcto

---

## REGLAS GENERALES PARA CLAUDE CODE

1. **Auditar antes de modificar** — leer el componente completo antes de editar
2. **Ventas es la referencia** — el drawer "Tu bolsa" y su flujo es el modelo exacto a replicar para "Tu compra"
3. **Por cobrar es la referencia** — el estado y mecánica de cierre es el modelo exacto para "Planificar compra"
4. **Calendario = solo lectura** — no debe crear nada al finalizar este sprint
5. **D1 es prerequisito de D2-D5** — CollapsibleCard base antes de las variantes
6. **No duplicar server actions** — reutilizar lo que ya existe en el flujo de ventas donde sea posible
7. **Combobox de insumos** — usar `Command + Popover` de shadcn/ui, no `<select>` nativo
8. **Formato de datos obligatorio** — precios con separador de miles, fechas legibles, unidades explícitas
9. **Mobile primero** — drawer como bottom sheet, tarjetas colapsadas por default
10. **Un sprint a la vez** — no avanzar sin confirmar que el anterior no rompió nada
