# PROMPT MAESTRO — Mejoras UI/UX V4 · Delicias Caseras

## Tu rol en esta sesión

Eres **Claude Code, Arquitecto Senior** de este proyecto. Tu responsabilidad es:

1. Analizar este plan y proponer la arquitectura de componentes compartidos antes de tocar código.
2. Descomponer cada sprint en tareas atómicas y **definir explícitamente qué labores ejecuta Codex** (Programador Senior / Ejecutor), entregándole instrucciones autosuficientes por tarea: archivos a tocar, componente a crear/modificar, criterios de aceptación.
3. Revisar y refactorizar el código que Codex entregue antes de dar la tarea por cerrada.
4. **No implementar nada sin plan aprobado**: si detectas ambigüedad o una decisión no cubierta por este documento, detente y pregunta antes de proceder (ver sección "Puntos abiertos").

### Metodología de trabajo
- **Claude Code** → Arquitectura, decisiones técnicas, dirección del desarrollo, revisión y refactor.
- **Codex** → Ejecución de código: creación de componentes, migraciones de layout, fixes puntuales.
- Comunicación de estado entre agentes vía archivo vivo de proyecto si existe; cada sprint termina con checklist de auditoría verificado.

---

## Contexto del proyecto

**Delicias Caseras** — app interna de gestión para un taller de repostería artesanal. PWA (móvil) + escritorio. Ya desplegada en producción (Vercel).

- **Stack:** Next.js App Router, TypeScript, React 19, Supabase (Postgres + Auth con RLS), shadcn/ui, Tailwind CSS v4, Recharts, lucide-react, sonner.
- **Identidad visual:** fondo crema `#F5F0E8`, chocolate primario `#3B2A20`, acentos terracota `#C4714A` y dorado `#C9A84C`, tipografías Vidaloka/Montserrat, motivos botánicos. **Toda pieza nueva de UI respeta esta identidad.**
- **Páginas actuales:** Dashboard, Productos, Pedidos, Por cobrar, Inventario, Compras, Clientes, Estadísticas (tabs Ventas/Inventario/Costos), Calendario (solo lectura).

### Reglas maestras vigentes (no negociables)
1. **Cada herramienta vive en su pantalla dueña** ("Agendar producción" → Inventario; "Planificar compra" → Compras).
2. **Las estadísticas viven en Estadísticas.** Ninguna otra página aloja KPIs ni gráficos analíticos. Esto ratifica la migración de KPIs de Compras a Estadísticas.
3. **Simetría Compras/Ventas** como modelo mental de validación:

| Lado venta | Lado compra |
|---|---|
| Productos (catálogo) | **Insumos (catálogo, página nueva)** |
| Ventas · "Tu bolsa" | Compras · "Tu compra" |
| Por cobrar | Planificar compra |
| Inventario: producto terminado | Inventario: insumos |

4. Ventas y descuentos de stock ocurren **exactamente una vez** por ciclo de vida del pedido; `aplicarSalidaStock()` es atómico. La entrada de stock al completar una compra debe cumplir la misma garantía (atómica, exactamente una vez).

### Objetivo final de la app
Control de gastos (compras de insumos) vs. ventas, con análisis semanal/mensual/anual en Estadísticas. Todo cambio de este plan debe empujar hacia ese objetivo.

---

## FASE A — CAMBIOS GLOBALES (componentes y patrones compartidos)

> Prioridad: se implementan **antes** que los cambios por página, porque las páginas los consumen. Codex no debe implementar versiones locales por página de nada listado aquí.

### G1 · Sistema unificado de botones de acción (`ActionButton`)
Todos los botones/iconos de acción principal — "Crear delicias", "Categorías", "Nuevo producto", "Tu bolsa", "Nuevo pedido", "Tu compra", "Agregar insumo", "Nuevo cliente" y equivalentes futuros — usan un único componente con:
- Mismo tamaño de icono y de contenedor, misma relación de aspecto, en PWA y desktop.
- Distribución homogénea: en móvil alineados respecto a la pantalla; en desktop alineados a la derecha manteniendo espaciado idéntico entre ellos.
- **Criterio de aceptación:** captura comparada de las 6+ páginas mostrando idéntico tamaño/espaciado; cero estilos ad-hoc por página.

### G2 · Patrón tarjeta → popover (`CardPopover`)
Todas las tarjetas de listado (Productos, Pedidos, Por cobrar, Inventario, Clientes, Insumos) migran a un patrón colapsado/expandido. **Excluidos: indicadores KPI y tarjetas estadísticas.**

Especificación propuesta (Claude Code debe presentar un mockup/muestra de ambas variantes ANTES de implementar, para aprobación del usuario):

| | Estado colapsado (tarjeta) | Estado expandido (popover) |
|---|---|---|
| **Con foto** | Foto miniatura + nombre + 1 dato clave (precio o stock) + badge de estado | Foto grande + todos los campos + acciones (editar, eliminar, acción contextual) |
| **Sin foto** | Icono de categoría + nombre + 1 dato clave + badge | Todos los campos + historial breve + acciones |

- **Regla de tamaño en desktop:** el popover NUNCA ocupa el ancho/largo completo de la página; ancho máximo acotado (p. ej. `max-w-md`/`max-w-lg` según densidad), anclado a la tarjeta que lo abre, para optimizar espacio.
- En móvil puede comportarse como sheet/drawer si mejora la usabilidad, manteniendo la misma información.
- **Criterio de aceptación:** un solo componente con variantes; muestra aprobada por el usuario antes de migración masiva.

### G3 · Fix global de centrado de modales
Bug reproducible: al abrir un select interno ("Elegir producto" en Agendar producción; "Elegir categoría"/"Elegir producto" en Nueva delicia), el modal se desplaza (abajo-derecha o pierde el centro).
- Diagnosticar la causa raíz (probable interacción Radix Select/Popover dentro de Dialog: reposicionamiento por portal/scroll-lock).
- Corregir a nivel de componente base de Dialog/Select para que aplique a **toda** la app, no con parches por modal.
- **Criterio de aceptación:** los modales permanecen centrados al abrir cualquier select interno, en móvil y desktop.

### G4 · Componente `HistorialTimeline` (reutilizable)
Requerido en: Pedidos, Por cobrar, Inventario, Compras, Estadísticas y Clientes (historial por cliente). El historial crecerá indefinidamente; se necesita resumen por fecha navegable.

**Diseño propuesto (a validar con el usuario mediante mockup antes de implementar):**
- **Barra timeline horizontal deslizable** de "chips" agrupados por período: `Hoy · Esta semana · Sem. anteriores · Meses`. Cada chip muestra: rango de fecha, conteo de eventos y monto total del período.
- Al tocar/clicar un chip, se expande debajo el **detalle del período** (lista compacta de transacciones/movimientos).
- Navegación: flechas ‹ › en desktop, swipe en móvil (carrusel).
- **Cabecera con control minimizar/ocultar**: el bloque completo colapsa a una sola línea ("Historial · último movimiento: fecha") y recuerda su estado.
- Granularidad adaptativa: pocos registros → agrupa por día; muchos → por semana/mes automáticamente.
- Props parametrizables: fuente de datos, tipo de evento, formato de monto, acciones por ítem. Paginación/lazy-load hacia el pasado para no cargar todo el historial.
- **Criterio de aceptación:** un único componente consumido por las 6 páginas; rendimiento estable con cientos de registros (carga incremental).

### G5 · Migración de estadísticas a Estadísticas
- Eliminar de **Inventario**: bloque de estadísticas y "Más rotación" → viven en Estadísticas (tab Inventario).
- Eliminar de **Por cobrar**: su estadística → Estadísticas (tab Ventas).
- Ratificado: KPIs de **Compras** → Estadísticas (tab Costos). *(Cierra la desviación pendiente #1 del plan V3.)*
- **Criterio de aceptación:** ninguna página fuera de Estadísticas y Dashboard muestra KPIs/gráficos; nada de información se pierde, solo se reubica.

---

## FASE B — NUEVA PÁGINA INSUMOS + REESTRUCTURA DE INVENTARIO

### B1 · Página Insumos (espejo de Productos)
Nueva página con la **misma estructura, componentes y lógica** que Productos, aplicada a insumos: crear, editar, categorizar, foto opcional, filtros.

**Lógica de alimentación (simetría):**
- `Productos` alimenta → Ventas e Inventario (producto terminado).
- `Insumos` alimenta → Compras e Inventario (insumos).

Implicancias:
- El catálogo de insumos que hoy vive dentro de Compras pasa a gestionarse en Insumos; Compras lo **consume** (igual que Ventas consume Productos).
- Reutilizar los componentes globales G1/G2/G4; no duplicar código de Productos — extraer lo común a componentes compartidos si es necesario.
- Modelo de datos: revisar tablas Supabase existentes de insumos; si hace falta migración (categorías de insumo, unidad, proveedor por defecto), Claude Code la diseña y Codex la ejecuta con migración versionada. RLS consistente con el resto.

### B2 · Inventario subdividido
- El popover de stock de insumos que hoy vive en Estadísticas/Costos **migra a Inventario**.
- Inventario queda con **dos secciones/tabs claras**: `Producto terminado` (stock de delicias) e `Insumos` (stock de materias primas).
- "Inventario actual" se reubica **inmediatamente después del texto introductorio**, al inicio de la página.

### B3 · Análisis compra vs. venta en Estadísticas (requisito)
- Nueva vista comparativa **semanal / mensual / anual**: total comprado (insumos) vs. total vendido.
- **Margen bruto (requisito, no opcional):** calcular y mostrar **margen bruto = ventas − costo de insumos consumidos en lo vendido**, junto al comparativo de flujos. La vista distingue explícitamente dos métricas que no deben confundirse:
  - **Gasto en compras** (flujo de caja del período: lo que salió de la billetera).
  - **Costo de lo vendido** (consumo real de insumos asociado a las ventas del período).
  - Razón: comparar solo totales de compra vs. venta engaña cuando se compra stock un mes y se vende en otro. El margen por consumo es el indicador honesto de rentabilidad.
- Implicancia técnica: para calcular consumo, cada producto debe tener asociada su receta/composición de insumos, o en su defecto un costo unitario de insumos estimado. Claude Code debe evaluar el modelo de datos actual y proponer la vía más simple que dé un margen confiable (receta explícita > costo unitario estimado > solo comparativo de flujos como fallback temporal).
- Este análisis es el objetivo final de la app: control de gastos vs. ventas.

---

## FASE C — CAMBIOS ESPECÍFICOS POR PÁGINA

### C1 · Dashboard
- Las tarjetas bajo "Resumen del mes" enlazan (navegación) a la página Estadísticas, idealmente al tab correspondiente.
- Tarjeta "Taller Artesanal": sistema de **frases rotativas** (array configurable de frases; rotación automática con transición suave acorde a la identidad visual).

### C2 · Productos
- Botones "Crear delicias / Categorías / Nuevo producto" → migran a G1.
- **Edición de foto:** el usuario debe poder ajustar la imagen al encuadre — zoom in/out y arrastrar (pan) dentro del espacio para controlar la visualización. Guardar el encuadre resultante.
- **Selección de foto en PWA (bug):** hoy, al subir/cambiar foto desde el dispositivo móvil, se activa directamente la cámara. Debe abrir el **selector de imágenes/galería** del sistema. Causa probable: atributo `capture` en el `<input type="file">` — eliminarlo (o dejar `accept="image/*"` sin `capture`), de modo que el selector nativo ofrezca galería/archivos y la cámara quede como opción del sistema, no como default forzado. Verificar en Android e iOS. Aplicar el mismo fix a todo input de imagen de la app (incluida la futura página Insumos).
- Modal "Nueva delicia": centrado fijo (cubierto por G3); **categoría por defecto = "Delicia" siempre**.
- Filtro de productos: desplegable con **checkboxes de selección por categoría** (multi-selección).
- "Agregar stock": la navegación `Producción · Merma · Ajuste · Umbral` pasa a ser **iconográfica** (iconos lucide + tooltip/label corto).

### C3 · Pedidos
- Tarjetas → G2 (popover acotado en desktop).
- Historial → G4.

### C4 · Por cobrar
- Estadística fuera (G5).
- Popover acotado en desktop (G2).
- **Agregar historial** (hoy no existe) usando G4: registro de cobros realizados.

### C5 · Inventario
- G5 (estadísticas y "más rotación" fuera), B2 (subdivisión y reubicación de "Inventario actual"), G2 (popovers acotados), G4 (historial de movimientos).

### C6 · Compras
- Campo **Unidad**: pasa de texto libre a **selector** con opciones existentes + botón `+` para crear una unidad nueva si no existe (persistida para futuros usos).
- Modal de insumo/compra: campo **Proveedor debajo de Nombre**.
- **Historial de compras/listas de compra** con G4: resumen por fecha de listas completadas y compras realizadas.

### C7 · Clientes
- Popover acotado en desktop (G2).
- **Historial por cliente**: compras realizadas con fecha, monto y **modo de pago**, usando G4 dentro del popover/detalle del cliente.

### C8 · Estadísticas
- El selector de tabs (Ventas / Inventario / Costos) en desktop **no ocupa el ancho completo** de la página: segmented control compacto, alineado consistente.
- Historial → G4 donde aplique.
- Recibe: KPIs migrados (G5), análisis compra vs. venta (B3). Cede: popover de stock de insumos → Inventario (B2).

---

## FASE D — SESIÓN DE USUARIOS, TRAZABILIDAD Y TIEMPO REAL

### D1 · Autenticación con Supabase Auth
- Login formal con email + contraseña. El campo de contraseña incluye **icono de ojo** para mostrar/ocultar la clave.
- 2 usuarios iniciales: la dueña y el administrador (Heinrickes). Emails Gmail en esta etapa.
- Sesiones persistentes compatibles con PWA (el usuario no debe re-loguearse en cada apertura de la app instalada).
- Pantalla de login con la identidad visual de la app (paleta, tipografías, logo).

### D2 · Roles y gestión de usuarios
- **Los roles son de trazabilidad, no de permisos**: ambos usuarios pueden hacer todo en la app (vender, comprar, editar, ver estadísticas). No se oculta UI ni se restringe funcionalidad por rol.
- **Única capacidad reservada al rol `admin`:** la **creación y gestión de usuarios** se hace desde la app, dentro de la sesión del administrador (nombre, email, contraseña inicial, rol). El rol `usuario` no ve esta sección.
- Tabla de perfiles vinculada a `auth.users` por `user_id` con: nombre visible, rol, avatar opcional.
- RLS: mantener el modelo actual; solo agregar la política que restringe la gestión de usuarios al admin.

### D3 · Trazabilidad — "quién hizo qué"
- Toda operación de escritura relevante registra el `user_id` del autor: ventas/pedidos, cobros, compras, movimientos de stock (producción, merma, ajuste), creación/edición de productos, insumos y clientes.
- Migración: agregar columna `created_by` (y `updated_by` donde aplique) a las tablas correspondientes; registros históricos previos quedan con autor nulo o asignado al admin, a decisión del usuario.
- **El autor se muestra en la UI** de forma discreta: en el `CardPopover` expandido (G2) y en cada ítem del `HistorialTimeline` (G4) — p. ej. nombre o inicial del usuario junto a la fecha. Claude Code define el formato en los mockups de G2/G4.

### D4 · Multisesión y sincronización en tiempo real
- Ambos usuarios pueden operar **simultáneamente en distintos dispositivos**; los cambios de uno se reflejan en la pantalla del otro **sin recargar**.
- Implementación: **Supabase Realtime** (suscripciones a cambios) actualizando el estado del cliente.
- **Prioridad de cobertura:** 1º Ventas/Pedidos (mayor volumen de movimientos), 2º stock/Inventario, 3º Por cobrar, 4º Compras. Dashboard y Estadísticas pueden refrescar al enfocar la vista, sin suscripción permanente.
- **Concurrencia crítica:** con dos usuarios vendiendo a la vez, `aplicarSalidaStock()` y la entrada de stock por compras deben resistir escrituras concurrentes — atómicas a nivel de base de datos (función/transacción en Postgres), nunca lógica de leer-calcular-escribir en el cliente. Es obligatorio testear el caso de dos ventas simultáneas sobre el mismo producto con stock limitado.
- UX de sincronía: feedback discreto cuando la vista se actualiza por acción del otro usuario (p. ej. toast sutil o badge), sin interrumpir lo que el usuario está haciendo.

### D5 · Nota de segunda etapa — email de empresa
- Más adelante los usuarios migrarán de Gmail a correos con dominio propio. **No requiere trabajo ahora**, pero el diseño debe garantizar que el email sea reemplazable sin perder historial: todo vínculo con datos va por `user_id`, nunca por email. Verificar que la app no use el email como clave de negocio en ninguna tabla.

---

## SECUENCIA DE SPRINTS

| Sprint | Contenido | Dependencias |
|---|---|---|
| **S1 — Fundaciones** | G1 (ActionButton) + G3 (fix modales) + mockups de G2 y G4 para aprobación | — |
| **S2 — Componentes** | G2 (CardPopover) + G4 (HistorialTimeline) implementados tras aprobación de mockups | S1 |
| **S3 — Reubicaciones** | G5 (estadísticas → Estadísticas) + C8 (tabs) + C1 (Dashboard) | S1 |
| **S4 — Insumos** | B1 (página nueva) + B2 (Inventario subdividido) + C6 (Compras: unidad, proveedor) | S2 |
| **S5 — Migración de páginas** | C2, C3, C4, C5, C7 consumiendo G1/G2/G4 | S2, S4 |
| **S6 — Análisis final** | B3 completo (comparativo compra vs. venta + margen bruto con separación gasto/costo) + auditoría integral | S4, S5 |
| **S7 — Usuarios y tiempo real** | D1 (login) + D2 (roles y gestión de usuarios) + D3 (trazabilidad) + D4 (Realtime) + D5 (nota) | S1; D3 en UI depende de S2 |

> Nota de secuencia: D1–D3 pueden adelantarse en paralelo desde S2 si se prefiere capturar `created_by` cuanto antes (mientras más temprano exista trazabilidad, menos registros históricos quedan sin autor). Los mockups de G2/G4 (S1) deben contemplar desde el inicio el espacio para mostrar el autor (D3).

Cada sprint cierra con: checklist de auditoría verificado, capturas móvil + desktop, y confirmación del usuario antes de avanzar.

---

## CHECKLIST DE AUDITORÍA GLOBAL (fin de proyecto)

- [ ] Ningún botón de acción con estilos ad-hoc; todos vía `ActionButton`.
- [ ] Ninguna tarjeta de listado fuera del patrón `CardPopover`; KPIs excluidos correctamente.
- [ ] Ningún popover ocupa ancho/largo completo en desktop.
- [ ] Todos los modales permanecen centrados al interactuar con selects internos.
- [ ] Un único `HistorialTimeline` consumido por Pedidos, Por cobrar, Inventario, Compras, Estadísticas y Clientes.
- [ ] Cero KPIs/gráficos fuera de Estadísticas y Dashboard.
- [ ] Simetría verificada: Insumos↔Compras funciona igual que Productos↔Ventas.
- [ ] Entrada de stock por compra completada: atómica, exactamente una vez (paridad con `aplicarSalidaStock()`).
- [ ] Estadísticas muestra margen bruto y separa "gasto en compras" de "costo de lo vendido"; ambas métricas verificadas con datos de prueba.
- [ ] PWA móvil y desktop verificados en cada página.
- [ ] Todo input de imagen en PWA abre el selector de galería/archivos, no la cámara directa (verificado en Android e iOS).
- [ ] Login funcional con ojo de contraseña; sesión persiste en PWA instalada.
- [ ] Gestión de usuarios visible solo para admin; el rol usuario opera todo lo demás sin restricción.
- [ ] Toda escritura relevante registra `created_by`; el autor se ve en popovers e historiales.
- [ ] Realtime verificado: dos dispositivos conectados, cambios de ventas/stock reflejados sin recargar.
- [ ] Test de concurrencia superado: dos ventas simultáneas sobre el mismo producto con stock limitado, sin doble descuento ni stock negativo.
- [ ] Ninguna tabla usa el email como clave de negocio (vínculos por `user_id`).
- [ ] Identidad visual (paleta, tipografías) intacta en todo componente nuevo.

---

## PUNTOS ABIERTOS — CONFIRMAR CON EL USUARIO ANTES DE IMPLEMENTAR

1. **Mockup de `CardPopover`** (variantes con/sin foto, contenido colapsado vs. expandido) — presentar muestra y esperar aprobación (requisito explícito del usuario).
2. **Mockup de `HistorialTimeline`** (chips por período + expansión + minimizable) — presentar propuesta visual y esperar aprobación.
3. **Concepto "nombre de lista"** en Compras (desviación pendiente #2 del plan V3): definir si se mantiene, cómo se integra con el historial de listas de compra (C6), o se elimina.
4. **Modelo de datos para el margen (B3):** confirmar la vía elegida — receta explícita por producto, costo unitario estimado, o fallback temporal — antes de implementar Estadísticas.
5. **Frases rotativas del Dashboard:** ¿frases fijas definidas por el usuario, o editables desde la app?
6. **Registros históricos previos al login (D3):** ¿quedan sin autor (nulo) o se asignan al admin? Decidir antes de la migración de `created_by`.
