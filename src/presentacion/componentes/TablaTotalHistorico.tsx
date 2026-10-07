"use client";

import { useEffect, useState } from "react";
import type { HistoricoEstacion } from "@/aplicacion/casosDeUso/ObtenerHistoricoFlotaCasoUso";
import { FranjaHoraria } from "@/dominio/entidades/FranjaHoraria";
import { formatearNumero } from "../utilidades/formato";
import { Alcance } from "./ScopePills";
import { COLOR_CSS_POR_FRANJA } from "../utilidades/colorPorFranja";

interface Propiedades {
  readonly filas: readonly HistoricoEstacion[];
  readonly alcance: Alcance;
  /** Override de días activos por código de estación (vacío = usar el default del servidor). */
  readonly diasOverride: Record<string, number>;
  readonly onFijarDias: (codigoEstacion: string, dias: number) => void;
  readonly onRestablecerDias: (codigoEstacion: string) => void;
}

const CLASES_TH =
  "border-b-2 border-rojo bg-black px-2.5 py-2 text-xs font-bold uppercase tracking-[0.06em] text-textoMuted";
const CLASES_TD = "border-b border-divisorTabla px-2.5 py-3 text-right tabular-nums";

const COLORES_CARGADOR = [
  COLOR_CSS_POR_FRANJA[FranjaHoraria.Punta],
  COLOR_CSS_POR_FRANJA[FranjaHoraria.Llano],
  COLOR_CSS_POR_FRANJA[FranjaHoraria.Valle],
];

/** Días activos efectivos de una fila: el override manual, o el default del servidor. */
function diasEfectivosDe(fila: HistoricoEstacion, override: Record<string, number>): number {
  return override[fila.estacion.codigo] ?? fila.diasConActividad;
}

/** Factor de uso diario = duración total (h) / días activos. */
function factorUsoDe(fila: HistoricoEstacion, dias: number): number {
  return fila.duracionHoras / Math.max(dias, 1);
}

/** Réplica de la tabla "Total histórico" del Excel (acumulado all-time, importes brutos). */
export function TablaTotalHistorico({
  filas,
  alcance,
  diasOverride,
  onFijarDias,
  onRestablecerDias,
}: Propiedades) {
  const maxKwh = Math.max(...filas.map((f) => f.kwhVendidos), 1);

  const totales = filas.reduce(
    (acum, f) => {
      const dias = diasEfectivosDe(f, diasOverride);
      return {
        kwh: acum.kwh + f.kwhVendidos,
        fijo: acum.fijo + f.ventaCostoFijo,
        venta: acum.venta + f.ventaEnergia,
        total: acum.total + f.totalRecaudado,
        duracion: acum.duracion + f.duracionHoras,
        factorUso: acum.factorUso + factorUsoDe(f, dias),
        exitosas: acum.exitosas + f.transaccionesExitosas,
        fallidos: acum.fallidos + f.intentosFallidos,
        usuarios: acum.usuarios + f.flujoUsuarios,
      };
    },
    { kwh: 0, fijo: 0, venta: 0, total: 0, duracion: 0, factorUso: 0, exitosas: 0, fallidos: 0, usuarios: 0 },
  );

  return (
    <div className="overflow-x-auto rounded-sm border border-borde bg-superficie p-4">
      <table className="w-full min-w-[1320px] border-collapse text-lg">
        <thead>
          <tr>
            <th className={`${CLASES_TH} text-left`}>Cargador</th>
            <th className={`${CLASES_TH} w-[220px] text-left`}>kWh vendidos</th>
            <th className={CLASES_TH}>Venta costo fijo</th>
            <th className={CLASES_TH}>Venta energía</th>
            <th className={CLASES_TH}>Total recaudado</th>
            <th className={CLASES_TH}>Duración (h)</th>
            <th className={CLASES_TH}>Días activos</th>
            <th className={CLASES_TH}>Factor uso diario (h)</th>
            <th className={CLASES_TH}>Trans. exitosas</th>
            <th className={CLASES_TH}>Intentos fallidos</th>
            <th className={CLASES_TH}>Flujo de usuarios</th>
          </tr>
        </thead>
        <tbody>
          {filas.map((fila, indice) => {
            const activa = alcance === "todos" || alcance === fila.estacion.codigo;
            const dias = diasEfectivosDe(fila, diasOverride);
            const tieneOverride = fila.estacion.codigo in diasOverride;
            return (
              <tr key={fila.estacion.codigo} className={activa ? "" : "opacity-40"}>
                <td className="border-b border-divisorTabla px-2.5 py-3 font-semibold text-white">
                  <span className="inline-flex items-center gap-2.5">
                    <span className="inline-block h-2.5 w-2.5" style={{ backgroundColor: COLORES_CARGADOR[indice] }} aria-hidden />
                    {fila.estacion.nombre}
                  </span>
                </td>
                <td className="border-b border-divisorTabla px-2.5 py-3">
                  <div className="flex items-center gap-2.5">
                    <div className="h-3.5 flex-1 overflow-hidden bg-divisorTabla">
                      <div
                        className="h-full"
                        style={{ width: `${(fila.kwhVendidos / maxKwh) * 100}%`, backgroundColor: COLORES_CARGADOR[indice], opacity: 0.85 }}
                      />
                    </div>
                    <span className="min-w-[90px] text-right tabular-nums text-white">{formatearNumero(fila.kwhVendidos)}</span>
                  </div>
                </td>
                <td className={CLASES_TD}>{formatearNumero(fila.ventaCostoFijo)}</td>
                <td className={CLASES_TD}>{formatearNumero(fila.ventaEnergia)}</td>
                <td className={`${CLASES_TD} font-bold text-white`}>{formatearNumero(fila.totalRecaudado)}</td>
                <td className={CLASES_TD}>{formatearNumero(fila.duracionHoras)}</td>
                <td className={CLASES_TD}>
                  <span className="inline-flex items-center justify-end gap-1.5">
                    <CampoDias dias={dias} onComprometer={(d) => onFijarDias(fila.estacion.codigo, d)} />
                    {tieneOverride && (
                      <button
                        type="button"
                        onClick={() => onRestablecerDias(fila.estacion.codigo)}
                        title={`Volver al valor por defecto (${formatearNumero(fila.diasConActividad)} días con actividad)`}
                        className="text-textoMuted transition-colors hover:text-rojo"
                        aria-label="Restablecer días activos"
                      >
                        ↺
                      </button>
                    )}
                  </span>
                </td>
                <td className={`${CLASES_TD} text-white`}>{formatearNumero(factorUsoDe(fila, dias))}</td>
                <td className={`${CLASES_TD} text-white`}>{formatearNumero(fila.transaccionesExitosas)}</td>
                <td className={`${CLASES_TD} text-rojo`}>{formatearNumero(fila.intentosFallidos)}</td>
                <td className={CLASES_TD}>{formatearNumero(fila.flujoUsuarios)}</td>
              </tr>
            );
          })}
        </tbody>
        <tfoot>
          <tr className="bg-black font-bold text-white">
            <td className="px-2.5 py-3">Totales de los 3 puntos</td>
            <td className="px-2.5 py-3 text-right tabular-nums">{formatearNumero(totales.kwh)}</td>
            <td className="px-2.5 py-3 text-right tabular-nums">{formatearNumero(totales.fijo)}</td>
            <td className="px-2.5 py-3 text-right tabular-nums">{formatearNumero(totales.venta)}</td>
            <td className="px-2.5 py-3 text-right tabular-nums">{formatearNumero(totales.total)}</td>
            <td className="px-2.5 py-3 text-right tabular-nums">{formatearNumero(totales.duracion)}</td>
            <td className="px-2.5 py-3" />
            <td className="px-2.5 py-3 text-right tabular-nums">{formatearNumero(totales.factorUso)}</td>
            <td className="px-2.5 py-3 text-right tabular-nums">{formatearNumero(totales.exitosas)}</td>
            <td className="px-2.5 py-3 text-right tabular-nums text-rojo">{formatearNumero(totales.fallidos)}</td>
            <td className="px-2.5 py-3 text-right tabular-nums">{formatearNumero(totales.usuarios)}</td>
          </tr>
        </tfoot>
      </table>
    </div>
  );
}

/**
 * Campo editable de días activos. Mantiene un texto local y recién compromete el
 * cambio al salir del campo (blur) o con Enter; si el valor no es válido, vuelve
 * al anterior. Se re-sincroniza si el valor efectivo cambia desde afuera (reset).
 */
function CampoDias({ dias, onComprometer }: { dias: number; onComprometer: (dias: number) => void }) {
  const [texto, setTexto] = useState(String(dias));

  useEffect(() => {
    setTexto(String(dias));
  }, [dias]);

  const comprometer = () => {
    const numero = Number(texto);
    if (Number.isFinite(numero) && numero > 0) {
      onComprometer(numero);
    } else {
      setTexto(String(dias));
    }
  };

  return (
    <input
      type="number"
      min={1}
      inputMode="numeric"
      className="w-16 rounded-sm border border-bordeFuerte bg-superficieInput px-1.5 py-1 text-right tabular-nums text-texto focus:border-rojo focus:outline-none"
      value={texto}
      onChange={(evento) => setTexto(evento.target.value)}
      onBlur={comprometer}
      onKeyDown={(evento) => {
        if (evento.key === "Enter") (evento.target as HTMLInputElement).blur();
      }}
    />
  );
}
