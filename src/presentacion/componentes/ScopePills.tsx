"use client";

import { ESTACIONES } from "@/dominio/entidades/Estacion";

/** "todos" = los 3 cargadores juntos; si no, el código de una estación. */
export type Alcance = "todos" | string;

interface Propiedades {
  readonly valor: Alcance;
  readonly alCambiar: (nuevo: Alcance) => void;
}

const OPCIONES: readonly { valor: Alcance; etiqueta: string }[] = [
  { valor: "todos", etiqueta: "Todos" },
  ...ESTACIONES.map((estacion) => ({ valor: estacion.codigo, etiqueta: estacion.nombre })),
];

/**
 * Botones tipo píldora para elegir el "parque": todos los cargadores o uno solo.
 * Es un filtro de alcance compartido por las dos hojas (Dashboard y Costo UTE),
 * igual que el mockup de referencia.
 */
export function ScopePills({ valor, alCambiar }: Propiedades) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {OPCIONES.map((opcion) => {
        const activa = opcion.valor === valor;
        return (
          <button
            key={opcion.valor}
            type="button"
            onClick={() => alCambiar(opcion.valor)}
            className={`whitespace-nowrap rounded-full border-2 px-4 py-1.5 text-[15px] transition-colors ${
              activa
                ? "border-rojo bg-rojo font-bold text-white"
                : "border-bordeFuerte bg-transparent font-medium text-textoSecundario hover:text-white"
            }`}
          >
            {opcion.etiqueta}
          </button>
        );
      })}
    </div>
  );
}
