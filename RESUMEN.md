# Delicias Caseras — Resumen de la App

Sistema interno de gestión para un taller artesanal de repostería. Es de **uso
personal de un solo usuario** (el dueño): no es una tienda pública ni tiene
acceso para clientes finales. Funciona en **desktop y móvil**, instalable como
**PWA**.

---

## Stack técnico

| Capa | Tecnología |
|------|-----------|
| Framework | Next.js 16.2 (App Router, Server Components, Server Actions) |
| Lenguaje | TypeScript 5 + React 19 |
| Base de datos / Auth | Supabase (Postgres + Auth) vía `@supabase/ssr` |
| UI | shadcn/ui sobre Base UI + Tailwind CSS v4 |
| Iconos | lucide-react |
| Gráficos | Recharts 3 |
| Toasts | sonner |
| Tipografías | Vidaloka (serif, títulos) + Montserrat (sans, cuerpo) |

**Paleta de diseño:** fondo crema, chocolate `#4b2d1e` como primario, acentos
terracota y dorado. Motivos botánicos de línea fina como decoración sutil.

---

## Módulos / Páginas

| Ruta | Módulo | Función |
|------|--------|---------|
| `/` | **Dashboard** | Métricas accionables y clickeables: ventas hoy, entregas hoy, por cobrar, stock bajo |
| `/ventas` | **Tienda (vender)** | Catálogo en grilla → se agregan productos a "Tu bolsa" (panel lateral) → se cierra la venta (entregado/pagado, por cobrar o encargo). Punto de venta. |
| `/productos` | **Productos** | Catálogo: CRUD de productos simples + creación de **packs** por volumen; costo, precio y margen |
| `/stock` | **Inventario** | Existencias + valor del inventario, producción/mermas/ajustes, umbral de stock bajo por producto, buscador e historial de movimientos |
| `/pedidos` | **Pedidos / Encargos** | Crear encargos con cliente, fecha de entrega e ítems; flujo de estados |
| `/por-cobrar` | **Cobranzas** | Pedidos entregados pendientes de pago; total por cobrar y montos vencidos |
| `/clientes` | **Clientes** | CRUD de clientes (nombre, teléfono, email, dirección, notas) |
| `/reportes` | **Reportes** | Estadísticas (gráficos de ventas, top productos, ingresos vs costos, producción) + historial de transacciones |
| `/login` | **Autenticación** | Login con Supabase Auth; el `proxy.ts` redirige a `/login` sin sesión |

> **Integridad de datos:** todas las operaciones que mueven stock/ventas (vender,
> entregar, cancelar, eliminar) pasan por **funciones RPC transaccionales** en
> Postgres (`crear_venta`, `cambiar_estado_pedido`, `eliminar_pedido`,
> `_descontar_stock`, `_reponer_stock`): validan disponibilidad, son atómicas y
> revierten stock al cancelar.

---

## Conceptos de negocio

### Productos y Packs
- Producto **simple**: tiene su propio `stock`, `costo` y `precio`.
- Producto **pack** (`tipo = 'pack'`): no tiene stock propio. Se compone de uno o
  varios productos base (tabla `pack_items`) con una cantidad cada uno y un
  precio especial por volumen.
  - Ej.: alfajor unitario $850 → pack de 3 a $2.500.
  - **Disponibilidad** del pack = `mín(floor(stock_base / cantidad))` entre sus
    componentes.
  - Al vender un pack se **descuenta el stock de los productos base**, no del pack.

### Estados de pedido
```
pendiente  →  por_cobrar  →  entregado (pagado)
           ↘  entregado (entregado y cobrado)
           ↘  cancelado
```
- **Entregar y cobrar** → `entregado`: genera la venta y descuenta stock.
- **Por cobrar** → `por_cobrar`: también genera venta y descuenta stock, pero
  registra una **fecha estimada de pago**; aparece en `/por-cobrar`.
- **Marcar pagado** (`por_cobrar → entregado`): no duplica venta ni stock.
- La venta + descuento de stock se genera **una sola vez**, en la primera
  transición a un estado "entregado".

### Stock / movimientos
Cada cambio de inventario queda trazado en `movimientos_stock` con tipo
`produccion | venta | ajuste | merma`, para alimentar las estadísticas de
producción y consumo.

---

## Modelo de datos (Supabase)

| Tabla | Descripción |
|-------|-------------|
| `productos` | Productos simples y packs (`tipo`, `costo`, `precio`, `stock`, `unidad`, `categoria`, `activo`) |
| `pack_items` | Composición de cada pack: `pack_id` → `producto_id` × `cantidad` |
| `clientes` | Datos de contacto del cliente |
| `pedidos` | Encargos: `cliente_id`, `fecha_entrega`, `fecha_estimada_pago`, `estado`, `total` |
| `pedido_items` | Líneas de cada pedido |
| `ventas` | Ventas registradas: `total`, `costo_total` (para margen), vínculo a `cliente`/`pedido` |
| `movimientos_stock` | Trazabilidad de inventario por producto |

Todas las tablas con **RLS** activo (política "solo usuarios autenticados").

---

## Arquitectura del código

```
src/
├── app/                    # Páginas (App Router) — un directorio por ruta
│   ├── layout.tsx          # Fuentes, Toaster, metadata PWA
│   ├── manifest.ts         # Manifiesto PWA
│   └── globals.css         # Sistema de diseño (tokens CSS)
├── components/
│   ├── ui/                 # Primitivas shadcn/ui
│   └── shared/             # Componentes de negocio (Cards, Dialogs, Nav, Charts)
├── lib/
│   ├── supabase/           # Clientes server.ts y client.ts (@supabase/ssr)
│   ├── actions/            # Server Actions: productos, packs, pedidos, stock, clientes
│   ├── constants.ts        # Labels y helpers de UI centralizados
│   ├── productos-data.ts   # getProductosEnriquecidos() (deriva stock/costo de packs)
│   └── ventas-helpers.ts   # disponibilidad() + aplicarSalidaStock() (lógica de packs)
└── types/database.ts       # Tipos generados de Supabase
```

**Patrón de mutaciones:** todas las escrituras pasan por **Server Actions**
(`'use server'`) que validan la sesión, mutan en Supabase y llaman
`revalidatePath`. El navegador no escribe directamente con la anon key.

---

## Estado actual

Las 9 fases del plan original están implementadas, más las extensiones
posteriores: productos en su propia página, packs por volumen y la cuenta de
cobranzas (`/por-cobrar`). Repositorio en GitHub: `Heinrickes/delicias-app`.
