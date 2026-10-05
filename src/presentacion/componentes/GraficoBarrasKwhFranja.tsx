import { DistribucionFranja } from "@/dominio/servicios/CalculadoraKpis";
import { FranjaHoraria } from "@/dominio/entidades/FranjaHoraria";
import { formatearNumero } from "../utilidades/formato";
import { COLOR_CSS_POR_FRANJA } from "../utilidades/colorPorFranja";

interface Propiedades {
  readonly filas: readonly DistribucionFranja[];
}

const HORARIO_POR_FRANJA: Readonly<Record<FranjaHoraria, string>> = {
  [FranjaHoraria.Punta]: "18–22 h",
  [FranjaHoraria.Llano]: "07–18 · 22–24 h",
  [FranjaHoraria.Valle]: "00–07 h",
};

const ALTO_MAXIMO_BARRA_PX = 170;

/** Barras verticales de kWh por franja, calcadas del mockup (valor arriba, horario abajo). */
export function GraficoBarrasKwhFranja({ filas }: Propiedades) {
  const maximo = Math.max(...filas.map((f) => f.kwhVendidos), 1);

  return (
    <div className="flex flex-col gap-2.5 rounded-sm border border-borde bg-superficie p-4">
      <div className="text-[13px] font-bold uppercase tracking-[0.1em] text-textoMuted">
        kWh vendidos por franja
      </div>
      <div className="flex h-[220px] items-end gap-8 border-b border-bordeFuerte px-5">
        {filas.map((fila) => (
          <div key={fila.franjaHoraria} className="flex h-full flex-1 flex-col items-center justify-end gap-1.5">
            <div className="tabular-nums text-base text-white">{formatearNumero(fila.kwhVendidos)}</div>
            <div
              className="w-full max-w-[120px]"
              style={{
                height: `${(fila.kwhVendidos / maximo) * ALTO_MAXIMO_BARRA_PX}px`,
                backgroundColor: COLOR_CSS_POR_FRANJA[fila.franjaHoraria],
                opacity: 0.9,
              }}
            />
          </div>
        ))}
      </div>
      <div className="flex gap-8 px-5">
        {filas.map((fila) => (
          <div key={fila.franjaHoraria} className="flex flex-1 flex-col items-center gap-0.5">
            <span className="text-base font-semibold" style={{ color: COLOR_CSS_POR_FRANJA[fila.franjaHoraria] }}>
              {fila.franjaHoraria}
            </span>
            <span className="tabular-nums text-xs text-textoMuted">{HORARIO_POR_FRANJA[fila.franjaHoraria]}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
