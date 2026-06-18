import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Delicias Caseras",
    short_name: "Delicias",
    description: "Inventario, stock, pedidos y ventas del taller artesanal",
    start_url: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#f6efe5",
    theme_color: "#4b2d1e",
    lang: "es",
    icons: [
      {
        src: "/icon.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "any",
      },
      {
        src: "/icon.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "maskable",
      },
    ],
  };
}
