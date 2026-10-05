"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { DashboardEstacion } from "@/aplicacion/casosDeUso/ObtenerDashboardEstacionCasoUso";
import { FiltroFechaFranja, ValorFiltro } from "@/presentacion/componentes/FiltroFechaFranja";
import { KpiCard } from "@/presentacion/componentes/KpiCard";
import { TablaDistribucionFranja } from "@/presentacion/componentes/TablaDistribucionFranja";
import { GraficoDistribucionFranja } from "@/presentacion/componentes/GraficoDistribucionFranja";
import { GraficoEvolucionMensual } from "@/presentacion/componentes/GraficoEvolucionMensual";
import {
  esFechaDeInputCompleta,
  formatearFechaParaInput,
  formatearNumero,
  formatearPorcentaje,
  formatearUsd,
  formatearUyu,
} from "@/presentacion/utilidades/formato";

/** Milisegundos de espera tras el último cambio del filtro antes de pedir datos. */
const RETARDO_DEBOUNCE_MS = 400;

const FILTRO_POR_DEFECTO: ValorFiltro = {
  desde: formatearFechaParaInput(new Date()),
  hasta: formatearFechaParaInput(new Date()),
  franja: "Todas",
  tipoCambio: 40,
};

interface RangoDisponible {
  readonly minima: string;
  readonly maxima: string;
}

export default function PaginaDashboardEstacion() {
  const parametros = useParams<{ estacion: string }>();
  const [filtro, setFiltro] = useState<ValorFiltro>(FILTRO_POR_DEFECTO);
  const [rangoDisponible, setRangoDisponible] = useState<RangoDisponible | null>(null);
  const [dashboard, setDashboard] = useState<DashboardEstacion | null>(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Al entrar a la página, se inicializa el filtro con el rango completo
  // disponible en la base (equivalente al mensaje "Rango completo disponible
  // en el histórico" del Excel).
  useEffect(() => {
    fetch("/api/rango-fechas")
      .then((respuesta) => respuesta.json())
      .then((rango: RangoDisponible | null) => {
        if (!rango) return;
        const minima = formatearFechaParaInput(new Date(rango.minima));
        const maxima = formatearFechaParaInput(new Date(rango.maxima));
        setRangoDisponible({ minima, maxima });
        setFiltro((filtroActual) => ({ ...filtroActual, desde: minima, hasta: maxima }));
      })
      .catch(() => {
        /* Si falla, se queda con el filtro por defecto; el pedido de datos avisará el error. */
      });
  }, []);

  useEffect(() => {
    // No dispares con fechas vacías o a medio tipear: evita el parpadeo y los
    // 400 transitorios (el rango invertido lo corrige el server intercambiando).
    if (!esFechaDeInputCompleta(filtro.desde) || !esFechaDeInputCompleta(filtro.hasta)) {
      return;
    }

    const controlador = new AbortController();

    // Debounce: solo se pide tras `RETARDO_DEBOUNCE_MS` sin cambios en el filtro.
    const idTemporizador = setTimeout(() => {
      const tipoCambio = filtro.tipoCambio > 0 ? filtro.tipoCambio : 40;
      const parametrosUrl = new URLSearchParams({
        desde: filtro.desde,
        hasta: filtro.hasta,
        tipoCambio: String(tipoCambio),
      });
      if (filtro.franja !== "Todas") {
        parametrosUrl.set("franja", filtro.franja);
      }

      setCargando(true);
      setError(null);

      fetch(`/api/dashboard/${parametros.estacion}?${parametrosUrl.toString()}`, {
        signal: controlador.signal,
      })
        .then(async (respuesta) => {
          const cuerpo = await respuesta.json();
          if (!respuesta.ok) throw new Error(cuerpo.error ?? "Error desconocido.");
          setDashboard(cuerpo as DashboardEstacion);
        })
        .catch((error: Error) => {
          // La respuesta fue cancelada por un cambio posterior del filtro: se
          // ignora, así una respuesta vieja nunca pisa a la actual.
          if (error.name === "AbortError") return;
          setError(error.message);
        })
        .finally(() => {
          if (!controlador.signal.aborted) setCargando(false);
        });
    }, RETARDO_DEBOUNCE_MS);

    // Al cambiar el filtro (o desmontar): se cancela el temporizador pendiente y
    // se aborta el pedido en curso. Esto elimina la tormenta de requests por
    // tecla y la condición de carrera entre respuestas fuera de orden.
    return () => {
      clearTimeout(idTemporizador);
      controlador.abort();
    };
  }, [parametros.estacion, filtro]);

  return (
    <div className="flex flex-col gap-6">
      <FiltroFechaFranja
        valor={filtro}
        alCambiar={setFiltro}
        fechaMinima={rangoDisponible?.minima}
        fechaMaxima={rangoDisponible?.maxima}
      />

      {error && (
        <p className="rounded-md border border-rojo bg-superficie p-4 text-sm text-rojo">
          {error}
        </p>
      )}

      {cargando && !dashboard && <p className="text-sm text-textoMuted">Cargando...</p>}

      {dashboard && (
        <>
          <div className="flex items-center gap-3">
            <h2 className="text-lg font-semibold text-texto">{dashboard.estacion.nombre}</h2>
            {cargando && <span className="text-xs text-textoMuted">Actualizando…</span>}
          </div>

          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
            <KpiCard etiqueta="kWh vendidos" valor={formatearNumero(dashboard.kpis.kwhVendidos)} />
            <KpiCard etiqueta="Ingreso total (UYU, sin IVA)" valor={formatearUyu(dashboard.kpis.ingresoTotalUyu)} />
            <KpiCard etiqueta="Ingreso total (USD, sin IVA)" valor={formatearUsd(dashboard.kpis.ingresoTotalUsd)} />
            <KpiCard etiqueta="Ingreso por venta de energía (sin IVA)" valor={formatearUyu(dashboard.kpis.ingresoVentaEnergiaUyu)} />
            <KpiCard etiqueta="Ingreso por cargo fijo (sin IVA)" valor={formatearUyu(dashboard.kpis.ingresoCargoFijoUyu)} />
            <KpiCard etiqueta="Duración total" valor={`${formatearNumero(dashboard.kpis.duracionTotalHoras)} h`} />
            <KpiCard etiqueta="Transacciones exitosas" valor={String(dashboard.kpis.transaccionesExitosas)} />
            <KpiCard etiqueta="Intentos fallidos" valor={String(dashboard.kpis.intentosFallidos)} />
            <KpiCard etiqueta="% de fallas" valor={formatearPorcentaje(dashboard.kpis.porcentajeFallas)} />
            <KpiCard
              etiqueta="Factor de uso (h/día)"
              valor={formatearNumero(dashboard.kpis.factorUsoDiarioHoras)}
            />
            <KpiCard
              etiqueta="Margen neto (UYU)"
              valor={formatearUyu(dashboard.margen.margenNetoUyu)}
              resaltarSegunSigno
              valorNumericoParaSigno={dashboard.margen.margenNetoUyu}
              detalle={`Costo UTE: ${formatearUyu(dashboard.margen.costoTotalUte)}`}
            />
          </div>

          <section className="grid gap-4 md:grid-cols-2">
            <div>
              <h3 className="mb-2 text-sm font-medium text-textoSecundario">
                Distribución por franja horaria (rango seleccionado)
              </h3>
              <TablaDistribucionFranja filas={dashboard.distribucionPorFranja} />
            </div>
            <div className="rounded-lg border border-borde bg-superficie p-2">
              <GraficoDistribucionFranja filas={dashboard.distribucionPorFranja} />
            </div>
          </section>

          <section>
            <h3 className="mb-2 text-sm font-medium text-textoSecundario">
              Evolución mensual por franja horaria (histórico completo)
            </h3>
            <div className="rounded-lg border border-borde bg-superficie p-2">
              <GraficoEvolucionMensual filas={dashboard.evolucionMensual} />
            </div>
          </section>
        </>
      )}
    </div>
  );
}
