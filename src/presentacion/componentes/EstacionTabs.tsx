"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ESTACIONES } from "@/dominio/entidades/Estacion";

const PESTANAS = [
  ...ESTACIONES.map((estacion) => ({ slug: estacion.slug, etiqueta: estacion.nombre })),
  { slug: "resumen", etiqueta: "Resumen general" },
];

export function EstacionTabs() {
  const ruta = usePathname();

  return (
    <nav className="flex gap-1 overflow-x-auto border-b border-borde">
      {PESTANAS.map((pestania) => {
        const estaActiva = ruta === `/dashboard/${pestania.slug}`;
        return (
          <Link
            key={pestania.slug}
            href={`/dashboard/${pestania.slug}`}
            className={`whitespace-nowrap border-b-2 px-4 py-3 text-sm font-medium transition-colors ${
              estaActiva
                ? "border-rojo text-texto"
                : "border-transparent text-textoSecundario hover:text-texto"
            }`}
          >
            {pestania.etiqueta}
          </Link>
        );
      })}
    </nav>
  );
}
