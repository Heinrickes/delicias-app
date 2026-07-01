# PROMPT MAESTRO V2 · DELICIAS CASERAS
### Para Claude Code — Consistencia de sistema UI/UX

> **Contexto:** Este prompt combina el plan de mejoras V2 con la revisión visual directa de la app en producción (delicias-app-ten.vercel.app, inspeccionada el 27 de junio 2026). Contiene el estado real actual, qué no tocar, y qué ejecutar en qué orden.

---

## STACK Y CONTEXTO TÉCNICO

- **Framework:** Next.js con App Router + Server Components
- **Lenguaje:** TypeScript
- **UI:** shadcn/ui sobre Base UI + Tailwind CSS v4
- **Base de datos:** Supabase (Postgres + Auth con RLS)
- **Iconos:** lucide-react
- **Toasts:** sonner
- **Gráficos:** Recharts
- **Deploy:** Vercel

**Tokens de color ya definidos (no cambiar):**
- `cream` — fondo principal
- `chocolate` — color primario, botones principales
- `terracotta` — acento cálido, iconos de KPIs
- `gold` — acento secundario

**Tipografía ya definida (no cambiar):**
- Display: Vidaloka
- Cuerpo: Montserrat

---

## ESTADO ACTUAL DE LA APP (revisión visual 27-jun-2026)

### ✅ Lo que funciona bien — NO MODIFICAR

Estos flujos y componentes están correctos. No tocarlos salvo que una mejora posterior lo requiera explícitamente.

- Sistema de color, tipografía y motivos botánicos — coherente en toda la app
- Header (logo, notificaciones, usuario, logout)
- Barra de navegación inferior (Dashboard / Productos / Ventas / Pedidos / Más)
- Menú "Más" como bottom sheet con grilla de accesos
- Dashboard: KPIs con iconos en terracotta, "Producto del mes", ranking de productos, frase de marca
- **Modal de Categorías** — es la referencia positiva de diseño para todos los demás modales
- Modal de **Nuevo pedido** — bien estructurado, úsalo como segunda referencia
- Modal de **Nuevo cliente** — bien estructurado
- Modal de **Agendar producción** — bien estructurado
- Ventas: concepto "Tu bolsa" ya implementado ✅
- Lenguaje "Pedido" (no "Encargo") ya unificado ✅
- Botón "Crear delicia" ya existe en Productos ✅
- Tarjetas de producto en Productos: imagen, categoría, precio, costo, margen, stock

### ❌ Problemas confirmados — ESTO ES LO QUE HAY QUE RESOLVER

| # | Problema | Pantalla | Urgencia |
|---|---|---|---|
| P1 | "Nuevo producto" es accordion inline, no modal | Productos | 🔴 Alta |
| P2 | "Agregar insumo" es accordion inline, no modal | Costos | 🔴 Alta |
| P3 | Eventos no aparecen en la vista del calendario (bug) | Calendario | 🔴 Alta |
| P4 | No hay `CartButton` visible en tarjetas de Ventas | Ventas | 🟡 Media |
| P5 | Tarjetas de inventario sin estructura fija ni acción rápida | Inventario | 🟡 Media |
| P6 | Botón de nueva acción inconsistente entre páginas (ícono vs texto) | Pedidos/Clientes | 🟡 Media |
| P7 | Falta botón `[Cancelar]` en footer de modales (Pedidos, Clientes, Calendario) | Varios | 🟡 Media |
| P8 | Ícono de "Por cobrar" posiblemente distinto entre Dashboard y Menú Más | Dashboard/Más | 🟡 Media |
| P9 | Botón de acción en tarjetas de Productos sin label ni tooltip claro | Productos | 🟢 Baja |
| P10 | Ruta `/stock` vs nombre de UI "Inventario" | Inventario | 🟢 Baja |

---

## PRINCIPIO RECTOR

> El modal de **Categorías** es el estándar de calidad. Antes de cerrar cualquier tarea, pregúntate: ¿este formulario o modal se siente tan ordenado y consistente como el de Categorías? Si no, revisar.

**Regla de oro antes de modificar cualquier archivo:**
1. Leer el componente completo antes de editar
2. Identificar qué otros componentes lo usan
3. Verificar que el cambio no rompe flujos que ya funcionan
4. Un problema a la vez — no abrir múltiples frentes simultáneos

---

## AUDITORÍA INICIAL OBLIGATORIA

Antes de escribir una línea de código, ejecutar esta auditoría y reportar los hallazgos:

```
AUDITORÍA — responder cada punto antes de proceder:

1. MODALES
   - ¿Existe algún componente BaseModal, BaseDialog o wrapper de Dialog reutilizable?
   - ¿El modal de Categorías usa Dialog de shadcn/ui directamente o un wrapper propio?
   - ¿Los modales de Nuevo pedido, Nuevo cliente y Agendar producción comparten algún componente base?
   - ¿Qué archivo contiene el accordion de "Nuevo producto"?
   - ¿Qué archivo contiene el accordion de "Agregar insumo"?

2. ICONOS
   - ¿Qué icono de lucide-react usa "Por cobrar" en el Dashboard?
   - ¿Es el mismo icono en el Menú Más?
   - ¿Qué icono usa el botón de acción en las tarjetas de Productos (el que no tiene label claro)?

3. CALENDARIO
   - ¿Qué query o server action carga los eventos del calendario?
   - ¿Filtra por fecha? ¿Cómo está construido el filtro?
   - ¿Los eventos de pedidos y producciones tienen una fecha asociada que coincida con el mes actual?

4. TOKENS
   - ¿Los colores chocolate, terracotta, gold, cream están definidos como CSS custom properties o como clases de Tailwind?
   - Mostrar la definición exacta de al menos uno de ellos.
```

---

## SPRINT 1 — FIXES URGENTES
### Objetivo: resolver los 3 problemas críticos sin tocar lo que funciona

---

### S1-T1 · Convertir "Nuevo producto" de accordion a modal `Dialog`

**Archivo a modificar:** el que contiene el accordion de Nuevo producto en `/productos`

**Referencia visual:** copiar exactamente la estructura del modal de Categorías y del modal de Nuevo pedido.

**Estructura del modal resultante (`ProductModal`):**

```
┌─────────────────────────────────────────┐
│ [Package] Nuevo producto           [✕]  │
│ Agrega un producto a tu catálogo.       │
├─────────────────────────────────────────┤
│                                         │
│  INFORMACIÓN PRINCIPAL                  │
│  Nombre del producto *                  │
│  ┌──────────────────────────────────┐   │
│  │ Ej: Alfajor de nuez              │   │
│  └──────────────────────────────────┘   │
│  Categoría              Tipo            │
│  ┌──────────────┐  ┌──────────────┐    │
│  │ Select ▾     │  │ Select ▾     │    │
│  └──────────────┘  └──────────────┘    │
│  Descripción breve (opcional)           │
│  ┌──────────────────────────────────┐   │
│  │ textarea                         │   │
│  └──────────────────────────────────┘   │
│                                         │
│  INFORMACIÓN COMERCIAL                  │
│  Precio de venta *      Costo           │
│  ┌──────────────┐  ┌──────────────┐    │
│  │ $ 0          │  │ $ 0          │    │
│  └──────────────┘  └──────────────┘    │
│  Margen: — (calculado automático)       │
│                                         │
│  INVENTARIO                             │
│  Stock inicial          Stock mínimo    │
│  ┌──────────────┐  ┌──────────────┐    │
│  │ 0            │  │ 0            │    │
│  └──────────────┘  └──────────────┘    │
│  Unidad de medida                       │
│  ┌──────────────────────────────────┐   │
│  │ Select ▾ (unidad / kg / g / l)   │   │
│  └──────────────────────────────────┘   │
│                                         │
│  ESTADO                                 │
│  [toggle] Producto activo               │
│                                         │
├─────────────────────────────────────────┤
│ [Cancelar]              [+ Agregar]     │
└─────────────────────────────────────────┘
```

**Reglas de implementación:**
- Usar `Dialog` de shadcn/ui — el mismo que usan los otros modales
- El margen se calcula en tiempo real: `((precio - costo) / precio) * 100`, mostrar como porcentaje
- Botón primario: `variant="default"` con color chocolate
- Botón secundario: `variant="ghost"` o `variant="outline"`
- Al guardar exitosamente: cerrar el modal + toast de éxito con sonner + refrescar lista de productos
- Si ya existe lógica de guardado en el accordion, reutilizarla — no duplicar el server action

**Lo que NO hacer:**
- No eliminar el accordion si otros flujos lo usan — simplemente moverlo o reemplazarlo
- No crear un nuevo server action si ya existe `crearProducto` o similar

---

### S1-T2 · Convertir "Agregar insumo" de accordion a modal `Dialog`

**Archivo a modificar:** el que contiene el accordion de Agregar insumo en `/costos`

**Mismo patrón que S1-T1.** La estructura del modal (`SupplyModal`):

```
┌─────────────────────────────────────────┐
│ [Box] Agregar insumo               [✕]  │
│ Registra un insumo en tu despensa.      │
├─────────────────────────────────────────┤
│                                         │
│  INFORMACIÓN PRINCIPAL                  │
│  Nombre del insumo *                    │
│  ┌──────────────────────────────────┐   │
│  │ Ej: Manjar, Harina, Mantequilla  │   │
│  └──────────────────────────────────┘   │
│  Categoría           Unidad de medida   │
│  ┌──────────────┐  ┌──────────────┐    │
│  │ Select ▾     │  │ Select ▾     │    │
│  └──────────────┘  └──────────────┘    │
│                                         │
│  COSTO                                  │
│  Precio unitario *      Proveedor       │
│  ┌──────────────┐  ┌──────────────┐    │
│  │ $ 0          │  │ Opcional     │    │
│  └──────────────┘  └──────────────┘    │
│                                         │
│  INVENTARIO                             │
│  Stock actual           Stock mínimo   │
│  ┌──────────────┐  ┌──────────────┐    │
│  │ 0            │  │ 0            │    │
│  └──────────────┘  └──────────────┘    │
│                                         │
│  [toggle] Agregar a lista de compras    │
│                                         │
├─────────────────────────────────────────┤
│ [Cancelar]         [+ Agregar insumo]   │
└─────────────────────────────────────────┘
```

**Reglas de implementación:** idénticas a S1-T1.

---

### S1-T3 · Bug: eventos vacíos en el calendario

**Síntoma confirmado:** La vista de junio 2026 aparece sin eventos aunque existen pedidos y producciones registradas en la base de datos.

**Pasos de diagnóstico (ejecutar en este orden):**

1. Abrir el archivo de la página `/calendario`
2. Identificar el query o server action que carga los eventos
3. Verificar cómo se filtran por fecha: ¿compara la fecha del pedido con el mes seleccionado?
4. Revisar si el campo de fecha en la tabla de pedidos (`fecha_entrega`) y en producciones (`fecha_produccion` o similar) está siendo comparado correctamente con el rango del mes
5. Agregar un log temporal para ver qué devuelve el query antes de que se renderice el calendario

**Causas más probables:**
- El filtro de fecha usa `=` en lugar de un rango `BETWEEN` o `>=` / `<=`
- El campo de fecha se guarda como `timestamptz` pero se compara como `date` (o viceversa)
- El estado de la fecha en el componente no coincide con el formato que espera el query
- Los eventos se cargan pero no se mapean al día correcto en la grilla del calendario

**Criterio de aceptación:** Los pedidos con fecha de entrega en junio 2026 y las producciones agendadas en junio 2026 deben aparecer en el día correspondiente del calendario.

---

## SPRINT 2 — CONSISTENCIA DE PATRÓN
### Ejecutar solo después de completar Sprint 1

---

### S2-T1 · Agregar botón `[Cancelar]` a todos los modales que no lo tienen

**Modales afectados** (confirmar con auditoría):
- Modal de Nuevo pedido (`OrderModal`)
- Modal de Nuevo cliente (`CustomerModal`)
- Modal de Agendar producción (`ProductionScheduleModal`)

**Implementación:** en el footer de cada modal, agregar a la izquierda del botón primario:

```tsx
<Button variant="ghost" onClick={() => onOpenChange(false)}>
  Cancelar
</Button>
```

Esto es un cambio de 2–3 líneas por modal. Bajo riesgo, alto impacto en consistencia.

---

### S2-T2 · Agregar `CartButton` en tarjetas de producto en Ventas

**Contexto:** En `/ventas`, las tarjetas de producto no tienen botón visible de agregar. El usuario debe tocar la tarjeta completa, lo cual no es obvio.

**Acción:** Agregar en la esquina inferior derecha de cada `ProductCard` en la vista de Ventas un botón con icono `ShoppingBag` de lucide-react.

```tsx
import { ShoppingBag } from 'lucide-react'

// Dentro de la tarjeta de producto en ventas:
<button
  onClick={(e) => {
    e.stopPropagation() // evitar que active el click de la tarjeta completa
    agregarABolsa(producto)
  }}
  className="absolute bottom-3 right-3 p-2 rounded-full bg-chocolate text-cream
             hover:bg-chocolate/90 transition-colors min-w-[44px] min-h-[44px]
             flex items-center justify-center"
  aria-label="Agregar a tu bolsa"
>
  <ShoppingBag size={18} />
</button>
```

**Importante:** usar `ShoppingBag`, no `ShoppingCart` — para mantener coherencia con el texto "Tu bolsa" ya existente.

---

### S2-T3 · Unificar el botón de acción principal en páginas de listado

**Inconsistencia detectada:**
- Pedidos → botón circular con ícono (sin label)
- Clientes → `+ Nuevo cliente` como botón de texto con borde

**Definir UN patrón y aplicarlo en ambos.** Propuesta (respetar si ya existe una decisión de diseño):

```tsx
// Patrón sugerido: botón con ícono + label, estilo pill
<Button variant="default" className="rounded-full gap-2">
  <Plus size={16} />
  Nuevo pedido
</Button>
```

Aplicar el mismo patrón en: Pedidos, Clientes, y cualquier otra página de listado con acción de creación.

---

### S2-T4 · Verificar y unificar ícono de "Por cobrar"

**Problema:** El ícono de "Por cobrar" puede ser distinto entre el Dashboard y el Menú Más.

**Acción:**
1. Identificar qué ícono de lucide-react usa cada uno
2. Si son distintos, unificar al que ya está en el Dashboard (es el que el usuario ve más frecuentemente)
3. Aplicar el mismo en el Menú Más y en cualquier otra aparición de "Por cobrar"

**El ícono correcto debe ser el mismo en:** Dashboard KPIs → Menú Más → Sección Por cobrar → Tarjetas de calendario.

---

## SPRINT 3 — TARJETAS DE INVENTARIO
### Ejecutar después de Sprint 2

---

### S3-T1 · Estandarizar `InventoryCard` con estructura fija

**Estado actual:** las tarjetas en `/stock` muestran la información sin estructura fija — el badge de estado flota junto al nombre, no hay acción rápida, no hay stock mínimo visible.

**Estructura objetivo (3 zonas fijas):**

```
┌─────────────────────────────────────┐
│ Nombre del producto                 │  ← ZONA 1: Encabezado
│ Categoría · texto-sm muted          │
├─────────────────────────────────────┤
│  Stock actual    │  Stock mínimo    │  ← ZONA 2: Body
│  ██████░░ 24 u  │  mín. 10 u       │
│  [barra de progreso visual]         │
├─────────────────────────────────────┤
│ [● OK]              [Reponer ›]    │  ← ZONA 3: Footer
└─────────────────────────────────────┘
```

**`StatusBadge` — estados posibles:**

| Estado | Condición | Color | Icono |
|---|---|---|---|
| OK | stock >= stock_minimo | `text-green-600 bg-green-50` | `CheckCircle` |
| Bajo stock | stock < stock_minimo y stock > 0 | `text-amber-600 bg-amber-50` | `AlertTriangle` |
| Sin stock | stock === 0 | `text-red-600 bg-red-50` | `XCircle` |

**Reglas:**
- Alto mínimo fijo con `min-h` para que la grilla no tenga alturas dispares
- La barra de progreso muestra `stock_actual / stock_maximo` (o un tope razonable si no existe stock_maximo)
- La acción "Reponer" abre un mini-modal o inline para ingresar cantidad de reposición
- Aplicar el mismo `InventoryCard` a las tarjetas de insumos en `/costos`

---

## SPRINT 4 — DETALLES Y PULIDO
### Ejecutar al final

---

### S4-T1 · Tooltip o label en botón de acción de tarjetas de Productos

El botón en las tarjetas de Productos (que parece ser `Boxes`) no tiene label visible. Agregar:
- `title` attribute para tooltip nativo
- O reemplazar el ícono por uno más claro con un texto corto ("Packs" o "Delicias")

### S4-T2 · Evaluar ruta `/stock` → `/inventario`

Decidir si vale la pena el cambio (afecta router, menú Más, links internos, posibles bookmarks). Solo ejecutar si no hay riesgo de romper otros flujos. Si se hace, actualizar todos los `href` que apunten a `/stock`.

---

## ESPECIFICACIONES DEL SISTEMA DE MODALES

Estas specs aplican a TODOS los modales, tanto los que se crean nuevos como los que se refactorizan.

### Estructura base

```tsx
// Patrón de uso consistente
<Dialog open={open} onOpenChange={setOpen}>
  <DialogContent className="max-w-lg">
    
    {/* HEADER — siempre igual */}
    <DialogHeader>
      <DialogTitle className="flex items-center gap-2">
        <IconoDelContexto size={20} className="text-chocolate" />
        Título del modal
      </DialogTitle>
      <DialogDescription>
        Descripción breve de qué hace este formulario.
      </DialogDescription>
    </DialogHeader>

    {/* BODY — con secciones */}
    <div className="space-y-6 py-4">
      
      {/* Sección con label */}
      <div className="space-y-3">
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          Información principal
        </p>
        {/* campos */}
      </div>

    </div>

    {/* FOOTER — siempre igual */}
    <DialogFooter>
      <Button variant="ghost" onClick={() => setOpen(false)}>
        Cancelar
      </Button>
      <Button type="submit" disabled={isLoading}>
        {isLoading ? <Loader2 className="animate-spin" size={16} /> : null}
        Guardar
      </Button>
    </DialogFooter>

  </DialogContent>
</Dialog>
```

### Comportamiento obligatorio en todos los modales
- Cierra con `Escape`, clic fuera, botón ✕, y botón Cancelar
- Botón primario muestra spinner durante submit (`isLoading`)
- Errores de validación aparecen inline bajo cada campo — no como toast
- Al guardar exitosamente: cerrar + toast de éxito con sonner
- En mobile: respetar el comportamiento ya existente (bottom sheet si ya está implementado)

---

## SISTEMA DE ICONOGRAFÍA UNIFICADA

Esta tabla es la fuente de verdad. Si un ícono ya está en uso en la app, verificar que coincida. Si no coincide, corregir para que use el de esta tabla.

| Entidad / Concepto | Ícono lucide-react | Color |
|---|---|---|
| Pedido | `ClipboardList` | chocolate |
| Producto | `Package` | chocolate |
| Delicia / Pack | `Gift` | terracotta |
| Categoría | `Tag` | gold |
| Por cobrar | `Banknote` | amber-600 |
| Venta / Ingreso | `TrendingUp` | green-600 |
| Tu bolsa | `ShoppingBag` | chocolate |
| Cliente | `User` | chocolate |
| Insumo | `Box` | terracotta |
| Inventario | `BarChart2` | chocolate |
| Producción | `ChefHat` | chocolate |
| Calendario | `Calendar` | chocolate |
| Completado / Pagado | `CheckCircle` | green-600 |
| Alerta / Bajo stock | `AlertTriangle` | amber-600 |
| Sin stock | `XCircle` | red-600 |
| Stock OK | `CheckCircle` | green-600 |

**Regla:** si un concepto aparece en más de una pantalla, usa el mismo ícono en todas. No crear variantes.

---

## LENGUAJE UNIFICADO

| ❌ No usar | ✅ Usar |
|---|---|
| Encargo / Encargos | Pedido / Pedidos |
| Carrito / Carro | Tu bolsa |
| Ver carrito | Revisar bolsa |
| Cerrar venta / Finalizar venta | Confirmar venta |
| Agregar al carro | Agregar a tu bolsa |

Buscar estas palabras en el codebase antes de cerrar cualquier sprint y corregir si aparecen.

---

## CRITERIOS DE ACEPTACIÓN GENERALES

Al finalizar cada sprint, verificar:

**Sprint 1:**
- [ ] "Nuevo producto" abre como `Dialog` modal, no como accordion
- [ ] "Agregar insumo" abre como `Dialog` modal, no como accordion
- [ ] Los eventos del mes actual aparecen en la vista del calendario
- [ ] Los server actions existentes no fueron duplicados

**Sprint 2:**
- [ ] Todos los modales tienen botón `[Cancelar]` en el footer izquierdo
- [ ] Las tarjetas de producto en Ventas tienen `CartButton` visible con `ShoppingBag`
- [ ] El botón de acción principal en Pedidos y Clientes tiene el mismo estilo
- [ ] El ícono de "Por cobrar" es el mismo en Dashboard y Menú Más

**Sprint 3:**
- [ ] Las tarjetas de inventario tienen 3 zonas fijas (encabezado / body / footer)
- [ ] El `StatusBadge` muestra OK / Bajo stock / Sin stock con color e ícono correctos
- [ ] Las tarjetas de insumos en Costos siguen el mismo patrón

**Sprint 4:**
- [ ] El botón de acción en tarjetas de Productos tiene label o tooltip claro
- [ ] No aparece "Encargo", "Carrito" ni "Carro" en ningún texto visible

---

## REGLAS GENERALES PARA CLAUDE CODE

1. **Auditar antes de modificar** — leer el componente completo, identificar sus dependencias
2. **Un sprint a la vez** — no avanzar al siguiente sin confirmar que el anterior no rompió nada
3. **Reutilizar antes de crear** — si ya existe un server action, un componente o un helper que hace lo que necesitas, úsalo
4. **No tocar lo que funciona** — la lista "✅ Lo que funciona bien" es zona protegida
5. **Reportar antes de ejecutar cambios destructivos** — si una refactorización implica eliminar código que parece en uso, preguntar primero
6. **El modal de Categorías es el juez final** — si un modal nuevo no se ve tan ordenado como ese, no está listo
