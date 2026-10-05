"use client";

/** Las dos hojas del dashboard, igual que el Excel y el mockup. */
export type Hoja = "dashboard" | "costo-ute";

interface Propiedades {
  readonly valor: Hoja;
  readonly alCambiar: (nueva: Hoja) => void;
}

const PESTANAS: readonly { valor: Hoja; etiqueta: string }[] = [
  { valor: "dashboard", etiqueta: "Dashboard" },
  { valor: "costo-ute", etiqueta: "Resultados Costo UTE" },
];

/** Pestañas de hoja (Dashboard · Resultados Costo UTE), con el subrayado rojo de marca. */
export function SheetTabs({ valor, alCambiar }: Propiedades) {
  return (
    <nav className="-mb-px flex gap-7 overflow-x-auto border-b border-borde">
      {PESTANAS.map((pestania) => {
        const activa = pestania.valor === valor;
        return (
          <button
            key={pestania.valor}
            type="button"
            onClick={() => alCambiar(pestania.valor)}
            className={`whitespace-nowrap border-b-[3px] pb-2.5 pt-2 text-base uppercase tracking-[0.08em] transition-colors ${
              activa
                ? "border-rojo font-extrabold text-white"
                : "border-transparent font-medium text-textoMuted hover:text-texto"
            }`}
          >
            {pestania.etiqueta}
          </button>
        );
      })}
    </nav>
  );
}
