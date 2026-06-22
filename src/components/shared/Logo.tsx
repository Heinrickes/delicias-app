/**
 * Marca de Delicias Caseras: dos cápsulas/hojas de cacao abiertas en V
 * (line-art, como el manual). Usa currentColor.
 */
export function LogoMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 48 48"
      fill="none"
      className={className}
      aria-hidden="true"
    >
      <g
        stroke="currentColor"
        strokeWidth={1.6}
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        {/* Hoja/cápsula izquierda */}
        <path d="M24 40 C 13 33 11 21 15.5 10 C 20.5 19 23 31 24 40 Z" />
        <path d="M16.5 14 C 19.5 22 22 31 24 39" />
        {/* Hoja/cápsula derecha */}
        <path d="M24 40 C 35 33 37 21 32.5 10 C 27.5 19 25 31 24 40 Z" />
        <path d="M31.5 14 C 28.5 22 26 31 24 39" />
        {/* Tallito inferior */}
        <path d="M24 40 C 24 42 24 43 24 44" />
      </g>
    </svg>
  );
}
