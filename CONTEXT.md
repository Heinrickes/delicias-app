# CONTEXTO GLOBAL: DELICIAS CASERAS

## 🎨 Identidad Visual (Estilo Natalia Pacheco)
- brand-crema: #F5EBE0 (Fondo principal)
- brand-chocolate: #4E342E (Títulos y textos fuertes)
- brand-verde: #6B705C (Botones de acción/Ventas)
- brand-dorado: #C5A059 (Iconos y acentos elegantes)

## 🏗️ Arquitectura de Software
1. **Componentes:** Deben ser atómicos y reutilizables en `src/components/shared`.
2. **Funciones:** Lógica de negocio (precios, stock) siempre en `src/hooks` o `src/lib`.
3. **Labels:** Todos los textos de la interfaz residen en `src/lib/constants.ts`.

## 🛠️ Stack Tecnológico
- Next.js 15 (App Router) + TypeScript.
- Supabase (DB & Auth).
- Tailwind CSS (Estilos globales).