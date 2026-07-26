"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

const FRASES = [
  "Cada receta cuenta una historia, cada bocado crea un momento.",
  "Hecho a mano, con el mismo cariño desde 2006.",
  "El chocolate fino no se apura: se cuida paso a paso.",
  "Detrás de cada dulce hay horas de dedicación artesanal.",
  "Ingredientes nobles, técnica paciente, resultado honesto.",
  "Lo casero se nota: en el sabor y en el detalle.",
] as const;

export function RotatingPhrase({ className }: { className?: string }) {
  const [index, setIndex] = useState(0);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const interval = setInterval(() => {
      setVisible(false);
      const t = setTimeout(() => {
        setIndex((i) => (i + 1) % FRASES.length);
        setVisible(true);
      }, 300);
      return () => clearTimeout(t);
    }, 6000);
    return () => clearInterval(interval);
  }, []);

  return (
    <p
      className={cn(
        "font-serif text-xl leading-8 text-foreground transition-opacity duration-300",
        visible ? "opacity-100" : "opacity-0",
        className
      )}
    >
      {FRASES[index]}
    </p>
  );
}
