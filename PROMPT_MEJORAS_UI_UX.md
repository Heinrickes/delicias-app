# PROMPT MAESTRO · MEJORAS UI/UX Y COMPONENTIZACIÓN DE LA APP

Actúa como desarrollador frontend senior y diseñador UI/UX especializado en apps web modernas, dashboards comerciales, inventario, ventas, pagos y gestión de productos.

Necesito mejorar la coherencia visual, usabilidad y reutilización de componentes de mi app, sin romper la lógica actual ni cambiar funcionalidades críticas sin justificarlo.

El objetivo principal es ordenar, estandarizar y mejorar la experiencia visual de la app mediante componentes reutilizables, iconografía consistente, tarjetas mejor estructuradas, filtros y mejores estados visuales.

---

## 1. Componentes reutilizables para calendarios y listas desplegables

Revisar todos los calendarios desplegables, date pickers, selectores, dropdowns y listas desplegables de la app.

Crear o mejorar componentes reutilizables para que todos compartan:

- mismo estilo visual
- mismos bordes
- mismos radios
- mismos estados hover, focus y disabled
- misma tipografía
- mismo espaciado interno
- mismo comportamiento responsive
- misma lógica visual en desktop y mobile

Componentes sugeridos:

- `DatePicker`
- `DropdownSelect`
- `SearchableSelect`
- `StatusSelect`
- `FilterDropdown`
- `NumericInput`

Estos componentes deben reemplazar los estilos duplicados o inconsistentes existentes.

---

## 2. Registro visual en calendario para entregas y pagos ejecutados

Actualmente, cuando se ejecuta una entrega o un pago, el elemento desaparece o se borra visualmente del calendario.

Esto debe corregirse.

Cuando una entrega o pago sea ejecutado, no debe desaparecer. Debe quedar registro visual histórico.

Propuesta:

- cambiar estado a `Entregado`, `Pagado`, `Completado` o similar
- mantener el evento visible en el calendario
- diferenciarlo visualmente con color, opacidad, badge o icono
- permitir filtrar entre pendientes, completados y todos
- evitar que el usuario pierda trazabilidad

Estados sugeridos:

- Pendiente
- Programado
- Entregado
- Pagado
- Atrasado
- Cancelado

El calendario debe funcionar como herramienta operativa y también como registro histórico visual.

---

## 3. Iconografía consistente en ventas, pedidos y por cobrar

Revisar la iconografía de ventas y reutilizar los mismos íconos y colores en las secciones relacionadas.

Actualmente se identifican estos conceptos:

- Monedas / dinero: Por cobrar
- Pedido: reemplazar el concepto “encargo” por “pedido”
- Ventas
- Pagos
- Entregas

La iconografía debe ser consistente entre:

- Dashboard
- Ventas
- Pedidos
- Por cobrar
- Reportes
- Tarjetas resumen
- Badges de estado

Ejemplo:

- Si “Por cobrar” usa icono de monedas y un color específico, ese mismo icono/color debe repetirse en todos los lugares donde aparezca ese concepto.
- Si existe una página llamada “Pedidos”, no usar “Encargos” en otros lugares. Unificar nombre como “Pedidos”.

Crear un pequeño sistema de iconografía por entidad:

- Ventas
- Pedidos
- Por cobrar
- Pagos
- Productos
- Stock
- Costos
- Reportes

---

## 4. Dashboard · Botón “Ver reportes” más iconográfico

En el dashboard, especialmente en la sección “Top productos”, revisar el botón “Ver reportes”.

Debe transformarse en un botón más visual e iconográfico.

Requisitos:

- incluir icono relacionado a reportes, gráfico o analytics
- mantener texto claro
- mejorar jerarquía visual
- que parezca una acción relevante, no un botón genérico
- usar el mismo estilo que otros botones secundarios importantes

Ejemplo conceptual:

`[ícono gráfico] Ver reportes`

---

## 5. Revisión de textos en estadísticas

Revisar uno a uno los textos de los estadísticos, métricas, tarjetas resumen y labels de dashboard.

Objetivo:

- mejorar claridad
- evitar textos largos
- unificar nombres
- evitar duplicidad de conceptos
- usar lenguaje comercial simple
- que cada métrica explique claramente qué representa

Revisar especialmente:

- títulos de tarjetas
- subtítulos
- labels de métricas
- textos de apoyo
- estados vacíos
- mensajes de error
- mensajes de éxito

Proponer mejoras de copy antes de implementar cambios masivos.

---

## 6. Productos · Estandarización de tarjetas

En la sección Productos, la tarjeta de producto debe quedar completamente estandarizada.

La información debe aparecer siempre en el mismo lugar, manteniendo una estructura visual fija.

Cada tarjeta debe tener una jerarquía clara:

1. Imagen o referencia visual del producto
2. Categoría
3. Nombre del producto
4. Precio
5. Stock disponible
6. Estado del stock
7. Acciones

Acciones actuales a mejorar:

- Gestionar stock
- Reponer stock

Estas acciones deben transformarse en botones iconográficos o acciones visuales más limpias.

Ejemplo:

- Icono de caja / inventario para gestionar stock
- Icono de suma / reposición para reponer stock

La tarjeta debe mantener consistencia en alto, espaciado, alineación y ubicación de acciones.

---

## 7. Productos agrupados por categorías y filtros

En Productos, los productos deben poder agruparse por categorías.

Además, se debe permitir filtrarlos.

Requisitos:

- mostrar categorías de forma clara
- permitir filtrar por categoría
- permitir ver todos los productos
- idealmente agregar buscador por nombre
- mantener buena experiencia en mobile
- evitar que el listado se vuelva largo y desordenado

Opciones sugeridas:

- chips de categorías
- tabs por categoría
- dropdown de categoría
- buscador + filtros combinados

Categorías posibles:

- Chocolates
- Bombones
- Barras
- Packs
- Regalos
- Temporada
- Otros

Ajustar las categorías según los datos reales de la app.

---

## 8. Inputs numéricos editables correctamente

Revisar todos los campos donde se ingresan números.

Problema actual: al hacer clic sobre un número, el valor por defecto no se elimina fácilmente o dificulta escribir uno nuevo.

Comportamiento esperado:

- al hacer focus, permitir editar inmediatamente
- si el valor es placeholder, debe desaparecer al escribir
- si el usuario selecciona el número completo, debe poder reemplazarlo
- evitar que el input fuerce valores incómodos
- permitir borrar y escribir desde cero
- validar solo cuando corresponda, no bloquear la escritura

Aplicar a:

- cantidades
- stock
- precios
- costos
- pagos
- descuentos
- unidades
- insumos

Crear o mejorar un componente reutilizable:

`NumericInput`

---

## 9. Inventario · Mejorar visualmente más allá de una tabla

El inventario no debería depender solo de una tabla tradicional.

Proponer una visualización más amigable usando chips, tarjetas compactas o bloques de información.

Idea base:

Crear un `InventoryChip` o componente similar que muestre información clave de inventario.

Cada chip podría mostrar:

- nombre del producto o insumo
- stock actual
- stock mínimo
- estado visual
- categoría
- alerta si está bajo stock

Estados sugeridos:

- Stock correcto
- Bajo stock
- Sin stock
- Reponer pronto

El inventario puede seguir teniendo tabla, pero debe complementarse con una vista más visual y rápida de leer.

---

## 10. Costos · Insumos como chips y lista de compras

En la sección Costos, los insumos también deberían mostrarse de forma más visual, usando chips o tarjetas compactas.

Actualmente existe una estrella como acción. Evaluar reemplazarla por un botón `+`.

La acción `+` debería permitir agregar el insumo a una lista de compras o carro de compras de insumos.

Objetivo:

- seleccionar insumos necesarios
- sumar insumos a una lista
- visualizar qué insumos se deben comprar
- mejorar la gestión de reposición

Crear o mejorar componentes:

- `SupplyChip`
- `AddSupplyButton`
- `ShoppingListPanel`
- `SupplyCart`

Cada insumo debería mostrar:

- nombre
- unidad de medida
- costo unitario
- stock o disponibilidad
- categoría
- botón `+` para agregar a lista

La lista de compras debería permitir:

- ver insumos agregados
- editar cantidades
- eliminar insumos
- calcular costo estimado
- confirmar o guardar lista

---

## 11. Criterios generales de diseño

Mantener una línea visual consistente en toda la app:

- diseño limpio
- moderno
- ordenado
- componentes reutilizables
- iconografía clara
- colores consistentes por entidad
- tarjetas bien jerarquizadas
- menos tablas cuando una vista visual entregue mejor lectura
- buena experiencia mobile
- evitar sobrecarga visual
- mantener la identidad visual actual de la app

---

## 12. Tareas esperadas

Primero, analizar el código actual y detectar:

- componentes duplicados
- estilos inconsistentes
- botones genéricos
- iconos repetidos o mal usados
- textos poco claros
- tarjetas desordenadas
- inputs numéricos con mala experiencia
- tablas que podrían mejorarse con chips o cards

Luego, proponer un plan por etapas antes de modificar.

Plan sugerido:

### Etapa 1 · Auditoría UI
Revisar pantallas, componentes y estilos actuales.

### Etapa 2 · Sistema de componentes
Crear o mejorar componentes reutilizables:

- `DatePicker`
- `DropdownSelect`
- `NumericInput`
- `IconButton`
- `ProductCard`
- `InventoryChip`
- `SupplyChip`
- `StatusBadge`

### Etapa 3 · Iconografía y colores
Unificar iconos, nombres y colores por entidad.

### Etapa 4 · Productos e inventario
Mejorar tarjetas, categorías, filtros, stock e inventario visual.

### Etapa 5 · Costos e insumos
Crear chips de insumos y lista/carrito de compras.

### Etapa 6 · Dashboard y estadísticas
Mejorar textos, botones, métricas y reportes.

---

## 13. Restricciones

No romper funcionalidades existentes.

No eliminar lógica actual sin explicar.

No cambiar nombres de rutas o modelos de datos sin justificar.

No duplicar componentes si se puede reutilizar uno existente.

No crear estilos aislados por pantalla si pueden formar parte del sistema visual.

Antes de cambios grandes, explicar:

- qué se detectó
- qué se propone
- qué archivos se modificarán
- qué componentes se crearán o reemplazarán

---

## 14. Resultado esperado

Al finalizar, la app debe tener:

- calendarios y dropdowns reutilizables
- calendario con registro histórico visual de pagos y entregas
- iconografía coherente en ventas, pedidos y por cobrar
- dashboard más visual
- estadísticas con textos revisados
- tarjetas de productos estandarizadas
- productos agrupados y filtrables por categoría
- inputs numéricos más fáciles de editar
- inventario más visual mediante chips o cards
- costos con insumos visuales y lista de compras
- mayor coherencia general de UI/UX

Trabaja de forma ordenada, por etapas, manteniendo la lógica actual de la app y priorizando una experiencia visual clara, moderna y reutilizable.

---

# VERSIÓN CORTA PARA CODEX / CLAUDE CODE

Revisa mi app y crea un plan de mejora UI/UX por etapas. Quiero estandarizar calendarios, dropdowns, inputs numéricos, tarjetas de productos, iconografía, inventario, costos e insumos mediante componentes reutilizables.

No rompas la lógica actual. Primero audita componentes duplicados, estilos inconsistentes, textos poco claros, botones genéricos e iconografía mal aplicada. Luego propone los cambios por etapas y finalmente implementa.

Prioridades:

1. Componentes reutilizables para calendarios y listas desplegables.
2. Mantener registro visual histórico en calendario cuando una entrega o pago se ejecuta.
3. Unificar iconografía y colores entre ventas, pedidos y por cobrar.
4. Mejorar botón “Ver reportes” del dashboard con iconografía.
5. Revisar textos de métricas y estadísticas.
6. Estandarizar tarjetas de productos.
7. Agrupar y filtrar productos por categorías.
8. Mejorar inputs numéricos para que sean fáciles de editar.
9. Convertir inventario en una vista más visual con chips o cards.
10. En costos, mostrar insumos como chips y reemplazar estrella por botón `+` para agregar a una lista de compras de insumos.

Crea componentes como:

- `DatePicker`
- `DropdownSelect`
- `NumericInput`
- `IconButton`
- `ProductCard`
- `InventoryChip`
- `SupplyChip`
- `StatusBadge`
- `ShoppingListPanel`

cuando corresponda.
