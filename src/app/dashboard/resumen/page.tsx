"use client";

import { useEffect, useState } from "react";
import { FranjaHoraria, TODAS_LAS_FRANJAS } from "@/dominio/entidades/FranjaHoraria";
import { FilaComparacionEstaciones } from "@/aplicacion/casosDeUso/ObtenerResumenGeneralCasoUso";
import { formatearFechaParaInput, formatearNumero } from "@/presentacion/utilidades/formato";
import { COLOR_CSS_POR_FRANJA } from "@/presentacion/utilidades/colorPorFranja";

export default function PaginaResumenGeneral() {
  const [desde, setDesde] = useState(formatearFechaParaInput(new Date()));
  const [hasta, setHasta] = useState(formatearFechaParaInput(new Date()));
  const [filas, setFilas] = useState<FilaComparacionEstaciones[]>([]);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    fetch("/api/rango-fechas")
      .then((respuesta) => respuesta.json())
      .then((rango: { minima: string; maxima: string } | null) => {
        if (!rango) return;
        setDesde(formatearFechaParaInput(new Date(rango.minima)));
        setHasta(formatearFechaParaInput(new Date(rango.maxima)));
      });
  }, []);

  useEffect(() => {
    setCargando(true);
    fetch(`/api/resumen-general?desde=${desde}&hasta=${hasta}`)
      .then((respuesta) => respuesta.json())
      .then((datos: FilaComparacionEstaciones[]) => setFilas(datos))
      .finally(() => setCargando(false));
  }, [desde, hasta]);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-end gap-4 rounded-lg border border-borde bg-superficie p-4">
        <CampoFecha etiqueta="Día desde" valor={desde} alCambiar={setDesde} />
        <CampoFecha etiqueta="Día hasta" valor={hasta} alCambiar={setHasta} />
      </div>

      {cargando && <p className="text-sm text-textoMuted">Cargando...</p>}

      {!cargando && (
        <div className="overflow-x-auto rounded-lg border border-borde">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-borde text-left text-textoSecundario">
                <th className="px-4 py-2">Estación</th>
                {TODAS_LAS_FRANJAS.map((franja) => (
                  <th key={franja} className="px-4 py-2 text-right">
                    <span className="inline-flex items-center gap-2">
                      <span
                        className="inline-block h-2 w-2 rounded-full"
                        style={{ backgroundColor: COLOR_CSS_POR_FRANJA[franja] }}
                        aria-hidden
                      />
                      {franja} (kWh)
                    </span>
                  </th>
                ))}
                <th className="px-4 py-2 text-right">Total (kWh)</th>
              </tr>
            </thead>
            <tbody>
              {filas.map((fila) => (
                <tr key={fila.estacion.codigo} className="border-b border-grilla last:border-0">
                  <td className="px-4 py-2 font-medium text-texto">{fila.estacion.nombre}</td>
                  {TODAS_LAS_FRANJAS.map((franja: FranjaHoraria) => (
                    <td key={franja} className="px-4 py-2 text-right tabular-nums">
                      {formatearNumero(fila.kwhPorFranja[franja])}
                    </td>
                  ))}
                  <td className="px-4 py-2 text-right font-medium tabular-nums">
                    {formatearNumero(fila.kwhTotal)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
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
