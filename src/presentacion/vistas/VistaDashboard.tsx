"use client";

import { useEffect, useMemo, useState } from "react";
import { ESTACIONES } from "@/dominio/entidades/Estacion";
import { FranjaHoraria } from "@/dominio/entidades/FranjaHoraria";
import { DashboardEstacion } from "@/aplicacion/casosDeUso/ObtenerDashboardEstacionCasoUso";
import type { HistoricoEstacion } from "@/aplicacion/casosDeUso/ObtenerHistoricoFlotaCasoUso";
import { KpiCard } from "@/presentacion/componentes/KpiCard";
import { EncabezadoSeccion } from "@/presentacion/componentes/EncabezadoSeccion";
import { TablaDistribucionFranja } from "@/presentacion/componentes/TablaDistribucionFranja";
import { GraficoBarrasKwhFranja } from "@/presentacion/componentes/GraficoBarrasKwhFranja";
import { TablaEvolucionMensual } from "@/presentacion/componentes/TablaEvolucionMensual";
import { GraficoEvolucionMensual } from "@/presentacion/componentes/GraficoEvolucionMensual";
import { TablaCostoUteResumen } from "@/presentacion/componentes/TablaCostoUteResumen";
import { TablaTotalHistorico } from "@/presentacion/componentes/TablaTotalHistorico";
import { useDiasActivos } from "@/presentacion/componentes/useDiasActivos";
import { agregarDashboards } from "@/presentacion/utilidades/agregarDashboards";
import { esFechaDeInputCompleta, formatearNumero, formatearPorcentaje, formatearUyu } from "@/presentacion/utilidades/formato";
import { Alcance } from "@/presentacion/componentes/ScopePills";

const RETARDO_DEBOUNCE_MS = 400;

interface Propiedades {
  readonly alcance: Alcance;
  readonly desde: string;
  readonly hasta: string;
  readonly franja: FranjaHoraria | "Todas";
  readonly tipoCambio: number;
}

export function VistaDashboard({ alcance, desde, hasta, franja, tipoCambio }: Propiedades) {
  const [dashboards, setDashboards] = useState<DashboardEstacion[] | null>(null);
  const [historico, setHistorico] = useState<HistoricoEstacion[] | null>(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { overrides: diasOverride, fijar: fijarDias, restablecer: restablecerDias } = useDiasActivos();

  // El histórico es acumulado all-time: no depende del rango ni del alcance.
  useEffect(() => {
    fetch("/api/historico")
      .then((r) => r.json())
      .then((filas) => setHistorico(Array.isArray(filas) ? (filas as HistoricoEstacion[]) : []))
      .catch(() => {});
  }, []);

  // Siempre se piden las 3 estaciones: así las tablas de flota (Costo UTE,
  // Total histórico) tienen todo, y cambiar de alcance no vuelve a pedir datos.
  useEffect(() => {
    if (!esFechaDeInputCompleta(desde) || !esFechaDeInputCompleta(hasta)) return;
    const controlador = new AbortController();

    const idTemporizador = setTimeout(() => {
      const tc = tipoCambio > 0 ? tipoCambio : 40;
      setCargando(true);
      setError(null);

      Promise.all(
        ESTACIONES.map(async (estacion) => {
          const parametros = new URLSearchParams({ desde, hasta, tipoCambio: String(tc) });
          if (franja !== "Todas") parametros.set("franja", franja);
          const respuesta = await fetch(`/api/dashboard/${estacion.slug}?${parametros.toString()}`, {
            signal: controlador.signal,
          });
          const cuerpo = await respuesta.json();
          if (!respuesta.ok) throw new Error(cuerpo.error ?? "Error desconocido.");
          return cuerpo as DashboardEstacion;
        }),
      )
        .then((resultados) => setDashboards(resultados))
        .catch((e: Error) => {
          if (e.name === "AbortError") return;
          setError(e.message);
        })
        .finally(() => {
          if (!controlador.signal.aborted) setCargando(false);
        });
    }, RETARDO_DEBOUNCE_MS);

    return () => {
      clearTimeout(idTemporizador);
      controlador.abort();
    };
  }, [desde, hasta, franja, tipoCambio]);

  const seleccionadas = useMemo(
    () => (alcance === "todos" ? ESTACIONES : ESTACIONES.filter((e) => e.codigo === alcance)),
    [alcance],
  );

  const datos = useMemo(() => {
    if (!dashboards) return null;
    const subset = dashboards.filter((d) => seleccionadas.some((e) => e.codigo === d.estacion.codigo));
    return agregarDashboards(subset);
  }, [dashboards, seleccionadas]);

  const titulo =
    alcance === "todos"
      ? "Indicadores · Todos los cargadores"
      : `Indicadores · ${seleccionadas[0]?.nombre ?? ""}`;

  if (error) {
    return <p className="rounded-sm border border-rojo bg-superficie p-4 text-sm text-rojo">{error}</p>;
  }

  if ((cargando && !dashboards) || !datos) {
    return <p className="text-sm text-textoMuted">Cargando...</p>;
  }

  return (
    <div className="flex flex-col gap-5">
      <section className="flex flex-col gap-2.5">
        <div className="flex items-baseline gap-3">
          <EncabezadoSeccion titulo={titulo} subtitulo={franja === "Todas" ? "Todas las franjas" : `Franja ${franja}`} />
          {cargando && <span className="text-xs text-textoMuted">Actualizando…</span>}
        </div>

        <div className="grid gap-2 [grid-template-columns:repeat(auto-fill,minmax(220px,1fr))]">
          <KpiCard etiqueta="kWh vendidos" valor={formatearNumero(datos.kpis.kwhVendidos)} unidad="kWh" acentoRojo />
          <KpiCard etiqueta="Ingreso total (UYU)" valor={formatearNumero(datos.kpis.ingresoTotalUyu)} unidad="$" />
          <KpiCard etiqueta="Ingreso total (USD)" valor={formatearNumero(datos.kpis.ingresoTotalUsd)} unidad="US$" detalle={`TC ${tipoCambio}`} />
          <KpiCard etiqueta="Ingreso por venta de energía (UYU)" valor={formatearNumero(datos.kpis.ingresoVentaEnergiaUyu)} unidad="$" />
          <KpiCard etiqueta="Ingreso por cargo fijo (UYU)" valor={formatearNumero(datos.kpis.ingresoCargoFijoUyu)} unidad="$" />
          <KpiCard etiqueta="Duración total (h)" valor={formatearNumero(datos.kpis.duracionTotalHoras)} unidad="h" />
          <KpiCard etiqueta="Transacciones exitosas" valor={String(datos.kpis.transaccionesExitosas)} />
          <KpiCard etiqueta="Intentos fallidos" valor={String(datos.kpis.intentosFallidos)} acentoRojo />
          <KpiCard etiqueta="% de fallas" valor={formatearPorcentaje(datos.kpis.porcentajeFallas)} acentoRojo={datos.kpis.porcentajeFallas > 0.06} />
          <KpiCard etiqueta="Factor de uso (h promedio/día)" valor={formatearNumero(datos.kpis.factorUsoDiarioHoras)} unidad="h/día" />
          <KpiCard
            etiqueta="Margen neto (UYU)"
            valor={formatearUyu(datos.margen.margenNetoUyu)}
            resaltarSegunSigno
            valorNumericoParaSigno={datos.margen.margenNetoUyu}
            detalle={`Costo UTE: ${formatearUyu(datos.margen.costoTotalUte)}`}
            ancho
          />
        </div>
      </section>

      <section className="flex flex-col gap-2.5">
        <EncabezadoSeccion titulo="Distribución por franja horaria" subtitulo="según el rango de días seleccionado" />
        <div className="grid gap-2 md:grid-cols-2">
          <TablaDistribucionFranja filas={datos.distribucionPorFranja} />
          <GraficoBarrasKwhFranja filas={datos.distribucionPorFranja} />
        </div>
      </section>

      <section className="flex flex-col gap-2.5">
        <EncabezadoSeccion titulo="Evolución mensual por franja horaria" subtitulo="histórico completo, sin filtro" />
        <div className="grid gap-2 md:grid-cols-2">
          <TablaEvolucionMensual filas={datos.evolucionMensual} />
          <div className="rounded-sm border border-borde bg-superficie p-4">
            <GraficoEvolucionMensual filas={datos.evolucionMensual} />
          </div>
        </div>
      </section>

      <section className="flex flex-col gap-2.5">
        <EncabezadoSeccion titulo="Resultados — Costo UTE y margen por cargador" subtitulo="según el rango de días seleccionado" />
        <TablaCostoUteResumen dashboards={dashboards!} alcance={alcance} />
      </section>

      {historico && (
        <section className="flex flex-col gap-2.5">
          <EncabezadoSeccion titulo="Total histórico" subtitulo="acumulado de todo el histórico · importes con IVA" />
          <TablaTotalHistorico
            filas={historico}
            alcance={alcance}
            diasOverride={diasOverride}
            onFijarDias={fijarDias}
            onRestablecerDias={restablecerDias}
          />
        </section>
      )}
    </div>
  );
}
