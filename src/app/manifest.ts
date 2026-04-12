import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Gestione Mezzi",
    short_name: "Mezzi",
    description: "Gestione flotta aziendale",
    start_url: "/",
    display: "standalone",
    orientation: "portrait",
    theme_color: "#4570D3",
    background_color: "#2B2347",
    lang: "it",
    icons: [
      {
        src: "/icon-192",
        sizes: "192x192",
        type: "image/png",
      },
      {
        src: "/icon-512",
        sizes: "512x512",
        type: "image/png",
      },
      {
        src: "/icon-512",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
