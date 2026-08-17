"use client";

import { FranjaHoraria, TODAS_LAS_FRANJAS } from "@/dominio/entidades/FranjaHoraria";

export interface ValorFiltro {
  readonly desde: string;
  readonly hasta: string;
  readonly franja: FranjaHoraria | "Todas";
  readonly tipoCambio: number;
}

interface PropiedadesFiltro {
  readonly valor: ValorFiltro;
  readonly alCambiar: (nuevoValor: ValorFiltro) => void;
}

/** Filtro equivalente a las celdas B6/E6/B8/E8 de cada hoja "Dashboard <Estación>" del Excel. */
export function FiltroFechaFranja({ valor, alCambiar }: PropiedadesFiltro) {
  return (
    <div className="flex flex-wrap items-end gap-4 rounded-lg border border-borde bg-superficie p-4">
      <CampoFecha
        etiqueta="Día desde"
        valor={valor.desde}
        alCambiar={(desde) => alCambiar({ ...valor, desde })}
      />
      <CampoFecha
        etiqueta="Día hasta"
        valor={valor.hasta}
        alCambiar={(hasta) => alCambiar({ ...valor, hasta })}
      />
      <div className="flex flex-col gap-1">
        <label className="text-xs text-textoSecundario">Franja horaria</label>
        <select
          value={valor.franja}
          onChange={(evento) =>
            alCambiar({ ...valor, franja: evento.target.value as ValorFiltro["franja"] })
          }
          className="rounded-md border border-borde bg-pagina px-3 py-2 text-sm text-texto"
        >
          <option value="Todas">Todas</option>
          {TODAS_LAS_FRANJAS.map((franja) => (
            <option key={franja} value={franja}>
              {franja}
            </option>
          ))}
        </select>
      </div>
      <div className="flex flex-col gap-1">
        <label className="text-xs text-textoSecundario">Tipo de cambio (UYU/USD)</label>
        <input
          type="number"
          min={1}
          step="0.01"
          value={valor.tipoCambio}
          onChange={(evento) => alCambiar({ ...valor, tipoCambio: Number(evento.target.value) })}
          className="w-28 rounded-md border border-borde bg-pagina px-3 py-2 text-sm text-texto"
        />
      </div>
    </div>
  );
}

function CampoFecha({
  etiqueta,
  valor,
  alCambiar,
}: {
  etiqueta: string;
  valor: string;
  alCambiar: (valor: string) => void;
}) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-xs text-textoSecundario">{etiqueta}</label>
      <input
        type="date"
        value={valor}
        onChange={(evento) => alCambiar(evento.target.value)}
        className="rounded-md border border-borde bg-pagina px-3 py-2 text-sm text-texto"
      />
    </div>
  );
}
