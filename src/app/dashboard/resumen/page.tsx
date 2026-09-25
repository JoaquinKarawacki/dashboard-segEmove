"use client";

import { useEffect, useState } from "react";
import { FranjaHoraria, TODAS_LAS_FRANJAS } from "@/dominio/entidades/FranjaHoraria";
import { FilaComparacionEstaciones } from "@/aplicacion/casosDeUso/ObtenerResumenGeneralCasoUso";
import { esFechaDeInputCompleta, formatearFechaParaInput, formatearNumero } from "@/presentacion/utilidades/formato";
import { COLOR_CSS_POR_FRANJA } from "@/presentacion/utilidades/colorPorFranja";

/** Milisegundos de espera tras el último cambio del filtro antes de pedir datos. */
const RETARDO_DEBOUNCE_MS = 400;

interface RangoDisponible {
  readonly minima: string;
  readonly maxima: string;
}

export default function PaginaResumenGeneral() {
  const [desde, setDesde] = useState(formatearFechaParaInput(new Date()));
  const [hasta, setHasta] = useState(formatearFechaParaInput(new Date()));
  const [rangoDisponible, setRangoDisponible] = useState<RangoDisponible | null>(null);
  const [filas, setFilas] = useState<FilaComparacionEstaciones[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/rango-fechas")
      .then((respuesta) => respuesta.json())
      .then((rango: RangoDisponible | null) => {
        if (!rango) return;
        const minima = formatearFechaParaInput(new Date(rango.minima));
        const maxima = formatearFechaParaInput(new Date(rango.maxima));
        setRangoDisponible({ minima, maxima });
        setDesde(minima);
        setHasta(maxima);
      })
      .catch(() => {
        /* Si falla, se queda con las fechas por defecto; el pedido de datos avisará el error. */
      });
  }, []);

  useEffect(() => {
    // No dispares con fechas vacías o a medio tipear (el rango invertido lo
    // corrige el server intercambiando los extremos).
    if (!esFechaDeInputCompleta(desde) || !esFechaDeInputCompleta(hasta)) {
      return;
    }

    const controlador = new AbortController();

    const idTemporizador = setTimeout(() => {
      const parametrosUrl = new URLSearchParams({ desde, hasta });

      setCargando(true);
      setError(null);

      fetch(`/api/resumen-general?${parametrosUrl.toString()}`, { signal: controlador.signal })
        .then(async (respuesta) => {
          const cuerpo = await respuesta.json();
          if (!respuesta.ok) throw new Error(cuerpo.error ?? "Error desconocido.");
          // Guarda de tipo: solo se acepta un array. Ante cualquier otra cosa
          // (un cuerpo de error, por ejemplo) no se rompe el render con .map.
          setFilas(Array.isArray(cuerpo) ? (cuerpo as FilaComparacionEstaciones[]) : []);
        })
        .catch((error: Error) => {
          if (error.name === "AbortError") return;
          setError(error.message);
        })
        .finally(() => {
          if (!controlador.signal.aborted) setCargando(false);
        });
    }, RETARDO_DEBOUNCE_MS);

    // Cancela el temporizador pendiente y aborta el pedido en curso al cambiar
    // el filtro: sin tormenta de requests ni respuestas fuera de orden.
    return () => {
      clearTimeout(idTemporizador);
      controlador.abort();
    };
  }, [desde, hasta]);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-end gap-4 rounded-lg border border-borde bg-superficie p-4">
        <CampoFecha
          etiqueta="Día desde"
          valor={desde}
          min={rangoDisponible?.minima}
          max={rangoDisponible?.maxima}
          alCambiar={setDesde}
        />
        <CampoFecha
          etiqueta="Día hasta"
          valor={hasta}
          min={rangoDisponible?.minima}
          max={rangoDisponible?.maxima}
          alCambiar={setHasta}
        />
        {cargando && <span className="pb-2 text-xs text-textoMuted">Actualizando…</span>}
      </div>

      {error && (
        <p className="rounded-md border border-rojo bg-superficie p-4 text-sm text-rojo">
          {error}
        </p>
      )}

      {cargando && filas.length === 0 && <p className="text-sm text-textoMuted">Cargando...</p>}

      {filas.length > 0 && (
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
    <div className="flex flex-col gap-1">
      <label className="text-xs text-textoSecundario">{etiqueta}</label>
      <input
        type="date"
        value={valor}
        min={min}
        max={max}
        onChange={(evento) => alCambiar(evento.target.value)}
        className="rounded-md border border-borde bg-pagina px-3 py-2 text-sm text-texto"
      />
    </div>
  );
}
