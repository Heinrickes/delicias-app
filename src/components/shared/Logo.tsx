/** Marca de Delicias Caseras: cápsula de cacao (line-art). Usa currentColor. */
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
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M24 9 C32 15 32 30 24 40 C16 30 16 15 24 9 Z" />
        <path d="M24 13 V37" />
        <path d="M19 17 C21.5 23 21.5 31 19.5 35" />
        <path d="M29 17 C26.5 23 26.5 31 28.5 35" />
        <path d="M24 9 C24 6 26 4 29 4" />
        <path d="M29 4 C26.5 2.2 24.5 3.4 24.5 6" />
      </g>
    </svg>
  );
}
