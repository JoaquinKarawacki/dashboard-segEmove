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
  /** Límites opcionales del histórico disponible, para acotar los campos de fecha. */
  readonly fechaMinima?: string;
  readonly fechaMaxima?: string;
}

const OPCIONES_FRANJA: readonly (FranjaHoraria | "Todas")[] = ["Todas", ...TODAS_LAS_FRANJAS];

const CLASES_LABEL = "text-xs uppercase tracking-[0.08em] text-textoMuted";
const CLASES_INPUT =
  "rounded-sm border border-bordeFuerte bg-superficieInput px-2.5 py-2 text-[15px] tabular-nums text-white outline-none";

/** Filtro equivalente a las celdas B6/E6/B8/E8 de cada hoja "Dashboard <Estación>" del Excel. */
export function FiltroFechaFranja({ valor, alCambiar, fechaMinima, fechaMaxima }: PropiedadesFiltro) {
  return (
    <div className="flex flex-wrap items-end gap-3.5">
      <CampoFecha
        etiqueta="Día desde"
        valor={valor.desde}
        min={fechaMinima}
        max={fechaMaxima}
        alCambiar={(desde) => alCambiar({ ...valor, desde })}
      />
      <CampoFecha
        etiqueta="Día hasta"
        valor={valor.hasta}
        min={fechaMinima}
        max={fechaMaxima}
        alCambiar={(hasta) => alCambiar({ ...valor, hasta })}
      />

      <div className="flex flex-col gap-1.5">
        <span className={CLASES_LABEL}>Franja horaria</span>
        <div className="flex overflow-hidden rounded-full border border-bordeFuerte">
          {OPCIONES_FRANJA.map((opcion, indice) => {
            const activa = valor.franja === opcion;
            return (
              <button
                key={opcion}
                type="button"
                onClick={() => alCambiar({ ...valor, franja: opcion })}
                className={`px-4 py-2 text-[15px] transition-colors ${
                  indice > 0 ? "border-l border-bordeFuerte" : ""
                } ${
                  activa
                    ? "bg-rojo font-bold text-white"
                    : "bg-superficieInput font-medium text-textoSecundario hover:text-white"
                }`}
              >
                {opcion}
              </button>
            );
          })}
        </div>
      </div>

      <label className="flex flex-col gap-1.5">
        <span className={CLASES_LABEL}>Tipo de cambio (UYU/USD)</span>
        <input
          type="number"
          min={1}
          step="0.01"
          value={valor.tipoCambio}
          onChange={(evento) => alCambiar({ ...valor, tipoCambio: Number(evento.target.value) })}
          className={`w-28 ${CLASES_INPUT}`}
        />
      </label>

      <div className="flex flex-col gap-1.5">
        <span className={CLASES_LABEL}>IVA</span>
        <div className="rounded-sm border border-borde bg-superficieInput px-3 py-2 text-[15px] tabular-nums text-textoSecundario">
          22 %
        </div>
      </div>
    </div>
  );
}

function CampoFecha({
  etiqueta,
  valor,
  min,
  max,
  alCambiar,
}: {
  etiqueta: string;
  valor: string;
  min?: string;
  max?: string;
  alCambiar: (valor: string) => void;
}) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className={CLASES_LABEL}>{etiqueta}</span>
      <input
        type="date"
        value={valor}
        min={min}
        max={max}
        onChange={(evento) => alCambiar(evento.target.value)}
        className={CLASES_INPUT}
      />
    </label>
  );
}
