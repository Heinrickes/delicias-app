/**
 * Motivo botánico de línea fina (flor cosmos con tallo y hojas).
 * Decorativo: usa `currentColor`, hereda el color vía className (ej. text-gold/20).
 */
export function BotanicalAccent({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 100 210"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.3}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={className}
    >
      {/* tallo */}
      <path d="M50 60 C 53 100 47 140 50 205" />
      {/* hojas */}
      <path d="M50 112 C 36 106 27 112 25 124 C 40 126 48 122 50 112 Z" />
      <path d="M50 152 C 64 146 73 152 75 164 C 60 166 52 162 50 152 Z" />
      {/* flor */}
      <g transform="translate(50 42)">
        <ellipse cx="0" cy="-16" rx="5.5" ry="13" />
        <ellipse cx="0" cy="-16" rx="5.5" ry="13" transform="rotate(45)" />
        <ellipse cx="0" cy="-16" rx="5.5" ry="13" transform="rotate(90)" />
        <ellipse cx="0" cy="-16" rx="5.5" ry="13" transform="rotate(135)" />
        <ellipse cx="0" cy="-16" rx="5.5" ry="13" transform="rotate(180)" />
        <ellipse cx="0" cy="-16" rx="5.5" ry="13" transform="rotate(225)" />
        <ellipse cx="0" cy="-16" rx="5.5" ry="13" transform="rotate(270)" />
        <ellipse cx="0" cy="-16" rx="5.5" ry="13" transform="rotate(315)" />
        <circle r="5" />
      </g>
    </svg>
  );
}
