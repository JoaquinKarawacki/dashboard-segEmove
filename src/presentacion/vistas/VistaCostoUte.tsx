"use client";

import { useEffect, useMemo, useState } from "react";
import { ESTACIONES } from "@/dominio/entidades/Estacion";
import { FranjaHoraria } from "@/dominio/entidades/FranjaHoraria";
import { DashboardEstacion } from "@/aplicacion/casosDeUso/ObtenerDashboardEstacionCasoUso";
import { EncabezadoSeccion } from "@/presentacion/componentes/EncabezadoSeccion";
import { esFechaDeInputCompleta } from "@/presentacion/utilidades/formato";
import { useParametrosUte } from "@/presentacion/costoUte/useParametrosUte";
import {
  calcularFacturaUte,
  EntradaFacturaEstacion,
  ORDEN_FRANJAS,
  ParametrosUteEditables,
} from "@/presentacion/costoUte/calculoCostoUte";
import { Alcance } from "@/presentacion/componentes/ScopePills";

const RETARDO_DEBOUNCE_MS = 400;

interface Propiedades {
  readonly alcance: Alcance;
  readonly desde: string;
  readonly hasta: string;
  readonly tipoCambio: number;
}

type EntradasPorEstacion = Record<string, EntradaFacturaEstacion>;

export function VistaCostoUte({ alcance, desde, hasta, tipoCambio }: Propiedades) {
  const [entradas, setEntradas] = useState<EntradasPorEstacion | null>(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const { parametros, guardar, restablecer } = useParametrosUte();

  const estacionesSeleccionadas =
    alcance === "todos" ? ESTACIONES : ESTACIONES.filter((e) => e.codigo === alcance);

  useEffect(() => {
    if (!esFechaDeInputCompleta(desde) || !esFechaDeInputCompleta(hasta)) return;
    const controlador = new AbortController();

    const idTemporizador = setTimeout(() => {
      const tc = tipoCambio > 0 ? tipoCambio : 40;
      setCargando(true);
      setError(null);

      // Siempre se piden las 3: así los parámetros editables afectan a todas y
      // cambiar de alcance no vuelve a pedir datos.
      Promise.all(
        ESTACIONES.map(async (estacion) => {
          const url = `/api/dashboard/${estacion.slug}?desde=${desde}&hasta=${hasta}&tipoCambio=${tc}`;
          const respuesta = await fetch(url, { signal: controlador.signal });
          const cuerpo = await respuesta.json();
          if (!respuesta.ok) throw new Error(cuerpo.error ?? "Error desconocido.");
          return { estacion, dashboard: cuerpo as DashboardEstacion };
        }),
      )
        .then((resultados) => {
          const nuevas: EntradasPorEstacion = {};
          for (const { estacion, dashboard } of resultados) {
            const kwhPorFranja = {
              [FranjaHoraria.Punta]: 0,
              [FranjaHoraria.Llano]: 0,
              [FranjaHoraria.Valle]: 0,
            } as Record<FranjaHoraria, number>;
            for (const fila of dashboard.distribucionPorFranja) {
              kwhPorFranja[fila.franjaHoraria] = fila.kwhVendidos;
            }
            nuevas[estacion.codigo] = {
              codigoEstacion: estacion.codigo,
              kwhPorFranja,
              ingresoNetoUyu: dashboard.kpis.ingresoTotalUyu,
            };
          }
          setEntradas(nuevas);
        })
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
  }, [desde, hasta, tipoCambio]);

  const diasDelRango = useMemo(() => calcularDias(desde, hasta), [desde, hasta]);
  const etiquetaRango = `${invertirFecha(desde)} → ${invertirFecha(hasta)} (${diasDelRango} d)`;

  return (
    <div className="flex flex-col gap-5">
      <section className="flex flex-col gap-2.5">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <EncabezadoSeccion titulo="Resultados — Costo UTE y margen por cargador" subtitulo={etiquetaRango} />
          <button
            type="button"
            onClick={restablecer}
            className="rounded-full border border-bordeFuerte px-4 py-1.5 text-sm font-medium text-textoSecundario transition-colors hover:border-rojo hover:text-white"
          >
            Restablecer a valores oficiales
          </button>
        </div>
        <p className="max-w-3xl text-sm text-textoMuted">
          El costo UTE y el margen se recalculan al instante según el rango de días y los parámetros
          editables de abajo. Los cambios se guardan solo en este navegador y no afectan el margen del
          Dashboard.
        </p>
      </section>

      {error && <p className="rounded-sm border border-rojo bg-superficie p-4 text-sm text-rojo">{error}</p>}

      <ParametrosCompartidos parametros={parametros} guardar={guardar} />

      <ParametrosPorCargador parametros={parametros} guardar={guardar} estaciones={estacionesSeleccionadas} />

      <section className="flex flex-col gap-2.5">
        <EncabezadoSeccion titulo="Factura UTE por cargador" subtitulo="montos en UYU, sin IVA" />
        {cargando && !entradas ? (
          <p className="text-sm text-textoMuted">Cargando...</p>
        ) : (
          <div className="grid gap-2 [grid-template-columns:repeat(auto-fit,minmax(min(100%,420px),1fr))]">
            {estacionesSeleccionadas.map((estacion) => {
              const entrada = entradas?.[estacion.codigo];
              if (!entrada) return null;
              const factura = calcularFacturaUte(entrada, parametros);
              return <TarjetaFactura key={estacion.codigo} nombre={estacion.nombre} diasDelRango={diasDelRango} factura={factura} />;
            })}
          </div>
        )}
      </section>
    </div>
  );
}

/* ------------------------------- Parámetros ------------------------------- */

function ParametrosCompartidos({
  parametros,
  guardar,
}: {
  parametros: ParametrosUteEditables;
  guardar: (p: ParametrosUteEditables) => void;
}) {
  const t = parametros.tarifa;
  const g = parametros.gestion;

  const setTarifaFranja = (campo: "precioEnergia" | "precioPotencia" | "bonificacionPotencia", f: FranjaHoraria, v: number) =>
    guardar({ ...parametros, tarifa: { ...t, [campo]: { ...t[campo], [f]: v } } });
  const setTarifa = (campo: "reactivaEnergiaReferencia" | "reactivaPotenciaReferencia" | "diasPeriodoReferencia", v: number) =>
    guardar({ ...parametros, tarifa: { ...t, [campo]: v } });
  const setGestion = (campo: "comisionGestionEve" | "costoSim4g", v: number) =>
    guardar({ ...parametros, gestion: { ...g, [campo]: v } });

  return (
    <section className="flex flex-col gap-2.5">
      <EncabezadoSeccion titulo="Parámetros de tarifa UTE" subtitulo="compartidos por los 3 cargadores" />
      <div className="grid items-start gap-2 [grid-template-columns:repeat(auto-fit,minmax(min(100%,420px),1fr))]">
        <Tarjeta titulo="Tarifa">
          {ORDEN_FRANJAS.map((f) => (
            <CampoParametro key={`pe-${f}`} etiqueta={`Precio energía — ${f} ($/kWh)`} valor={t.precioEnergia[f]} paso={0.001} onChange={(v) => setTarifaFranja("precioEnergia", f, v)} />
          ))}
          {ORDEN_FRANJAS.map((f) => (
            <CampoParametro key={`pp-${f}`} etiqueta={`Precio potencia — ${f} ($/kW)`} valor={t.precioPotencia[f]} paso={0.1} onChange={(v) => setTarifaFranja("precioPotencia", f, v)} />
          ))}
          <CampoParametro etiqueta="Bonif. reactiva energía (referencia)" valor={t.reactivaEnergiaReferencia} esPorcentaje sufijo="%" onChange={(v) => setTarifa("reactivaEnergiaReferencia", v)} />
          <CampoParametro etiqueta="Bonif. reactiva potencia (referencia)" valor={t.reactivaPotenciaReferencia} esPorcentaje sufijo="%" onChange={(v) => setTarifa("reactivaPotenciaReferencia", v)} />
          {ORDEN_FRANJAS.map((f) => (
            <CampoParametro key={`bp-${f}`} etiqueta={`Bonif. potencia SAVE — ${f}`} valor={t.bonificacionPotencia[f]} esPorcentaje sufijo="%" onChange={(v) => setTarifaFranja("bonificacionPotencia", f, v)} />
          ))}
          <CampoParametro etiqueta="Días del período de referencia" valor={t.diasPeriodoReferencia} paso={1} onChange={(v) => setTarifa("diasPeriodoReferencia", v)} />
        </Tarjeta>
        <Tarjeta titulo="Costos de gestión">
          <CampoParametro etiqueta="Costo Gestión EVE (% de los ingresos)" valor={g.comisionGestionEve} esPorcentaje sufijo="%" onChange={(v) => setGestion("comisionGestionEve", v)} />
          <CampoParametro etiqueta="Costo SIM 4G (fijo mensual, $)" valor={g.costoSim4g} paso={1} onChange={(v) => setGestion("costoSim4g", v)} />
          <p className="pt-3 text-xs text-textoMuted">
            Las bonificaciones reactivas de referencia no entran en el cálculo: la reactiva aplicada es
            la de cada cargador (abajo). El SIM 4G aplica a los 3 cargadores.
          </p>
        </Tarjeta>
      </div>
    </section>
  );
}

function ParametrosPorCargador({
  parametros,
  guardar,
  estaciones,
}: {
  parametros: ParametrosUteEditables;
  guardar: (p: ParametrosUteEditables) => void;
  estaciones: readonly { codigo: string; nombre: string }[];
}) {
  return (
    <section className="flex flex-col gap-2.5">
      <EncabezadoSeccion titulo="Parámetros por cargador" subtitulo="medidos por punto de carga" />
      <div className="grid items-start gap-2 [grid-template-columns:repeat(auto-fit,minmax(min(100%,400px),1fr))]">
        {estaciones.map((estacion) => {
          const e = parametros.porEstacion[estacion.codigo];
          if (!e) return null;
          const setFranja = (campo: "excedentePotencia" | "eficienciaEquipo" | "reactivaPotencia", f: FranjaHoraria, v: number) =>
            guardar({
              ...parametros,
              porEstacion: {
                ...parametros.porEstacion,
                [estacion.codigo]: { ...e, [campo]: { ...e[campo], [f]: v } },
              },
            });
          const setEscalar = (campo: "reactivaEnergia", v: number) =>
            guardar({
              ...parametros,
              porEstacion: { ...parametros.porEstacion, [estacion.codigo]: { ...e, [campo]: v } },
            });
          return (
            <Tarjeta key={estacion.codigo} titulo={estacion.nombre}>
              {ORDEN_FRANJAS.map((f) => (
                <CampoParametro key={`ex-${f}`} etiqueta={`Excedente de potencia — ${f} (kW)`} valor={e.excedentePotencia[f]} paso={0.01} onChange={(v) => setFranja("excedentePotencia", f, v)} />
              ))}
              {ORDEN_FRANJAS.map((f) => (
                <CampoParametro key={`ef-${f}`} etiqueta={`Eficiencia equipo — ${f}`} valor={e.eficienciaEquipo[f]} esPorcentaje sufijo="%" onChange={(v) => setFranja("eficienciaEquipo", f, v)} />
              ))}
              <CampoParametro etiqueta="Reactiva energía" valor={e.reactivaEnergia} esPorcentaje sufijo="%" onChange={(v) => setEscalar("reactivaEnergia", v)} />
              {ORDEN_FRANJAS.map((f) => (
                <CampoParametro key={`rp-${f}`} etiqueta={`Reactiva potencia — ${f}`} valor={e.reactivaPotencia[f]} esPorcentaje sufijo="%" onChange={(v) => setFranja("reactivaPotencia", f, v)} />
              ))}
            </Tarjeta>
          );
        })}
      </div>
    </section>
  );
}

/* ------------------------------- Factura ------------------------------- */

function TarjetaFactura({
  nombre,
  diasDelRango,
  factura,
}: {
  nombre: string;
  diasDelRango: number;
  factura: ReturnType<typeof calcularFacturaUte>;
}) {
  const margenNegativo = factura.margenNetoUyu < 0;
  return (
    <div className="flex flex-col rounded-sm border border-borde border-t-[4px] border-t-rojo bg-superficie">
      <div className="border-b border-borde px-4 py-3 text-xl font-black text-white">Factura UTE {nombre}</div>

      <div className="flex flex-col gap-1 border-b border-borde px-4 py-2 text-[15px]">
        <FilaFactura etiqueta="Ingreso del período — venta + fijo ($)" valor={`$ ${monto(factura.ingresoNetoUyu, 0)}`} fuerte />
        <FilaFactura etiqueta="Costo Gestión EVE ($)" valor={`$ ${monto(factura.costoGestionEve, 0)}`} />
        <FilaFactura etiqueta="Costo SIM 4G ($)" valor={`$ ${monto(factura.costoSim4g, 0)}`} />
        <FilaFactura etiqueta="Días del rango seleccionado" valor={String(diasDelRango)} />
      </div>

      {factura.grupos.map((grupo) => (
        <div key={grupo.titulo} className="flex flex-col border-b border-divisorTabla px-4 py-3">
          <div className="flex items-baseline justify-between gap-3 pb-1.5 text-[11px] font-bold uppercase tracking-[0.12em] text-rojo">
            <span>{grupo.titulo}</span>
            <span className="tabular-nums text-textoSecundario">{montoFirma(grupo.subtotal)}</span>
          </div>
          {grupo.lineas.map((linea) => (
            <div key={linea.etiqueta} className="grid grid-cols-[minmax(0,1fr)_auto_auto] items-baseline gap-3 py-1 text-sm">
              <span className="text-texto">{linea.etiqueta}</span>
              <span className="text-right text-xs tabular-nums text-textoMuted">{linea.detalle}</span>
              <span className={`min-w-[92px] text-right font-semibold tabular-nums ${linea.valor < 0 ? "text-textoMuted" : "text-white"}`}>
                {montoFirma(linea.valor)}
              </span>
            </div>
          ))}
        </div>
      ))}

      <div className="flex items-baseline justify-between gap-3 border-b border-borde bg-black px-4 py-3">
        <span className="text-[13px] font-bold uppercase tracking-[0.1em] text-white">Total costo UTE</span>
        <span className="whitespace-nowrap text-2xl font-black tabular-nums text-white">$ {monto(factura.costoTotalUte, 0)}</span>
      </div>

      <div className={`flex items-center justify-between gap-3 px-4 py-4 text-white ${margenNegativo ? "bg-rojo" : "bg-black"}`}>
        <div className="flex flex-col gap-1">
          <span className="text-[13px] font-bold uppercase tracking-[0.1em]">Margen ($)</span>
          <span className="text-xs font-medium">Ingreso − Costo UTE − Gestión EVE − SIM 4G</span>
        </div>
        <span className="whitespace-nowrap text-4xl font-black leading-none tabular-nums">{montoFirma(factura.margenNetoUyu, 0)}</span>
      </div>
    </div>
  );
}

function FilaFactura({ etiqueta, valor, fuerte = false }: { etiqueta: string; valor: string; fuerte?: boolean }) {
  return (
    <div className="flex items-baseline justify-between gap-3">
      <span className="text-textoSecundario">{etiqueta}</span>
      <span className={`whitespace-nowrap tabular-nums ${fuerte ? "font-bold text-white" : "text-white"}`}>{valor}</span>
    </div>
  );
}

/* ------------------------------- Átomos ------------------------------- */

function Tarjeta({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col rounded-sm border border-borde bg-superficie px-4 py-3">
      <div className="border-b-2 border-rojo pb-2 text-[13px] font-bold uppercase tracking-[0.1em] text-textoMuted">{titulo}</div>
      {children}
    </div>
  );
}

function CampoParametro({
  etiqueta,
  valor,
  onChange,
  esPorcentaje = false,
  paso = 0.01,
  sufijo,
}: {
  etiqueta: string;
  valor: number;
  onChange: (valor: number) => void;
  esPorcentaje?: boolean;
  paso?: number;
  sufijo?: string;
}) {
  const mostrado = esPorcentaje ? valor * 100 : valor;
  const redondeado = Math.round(mostrado * 1e6) / 1e6;
  return (
    <label className="flex items-center justify-between gap-3 border-b border-divisorTabla py-2 text-[15px] last:border-b-0">
      <span className="min-w-0 text-textoSecundario">{etiqueta}</span>
      <span className="flex items-center gap-1">
        <input
          type="number"
          step={esPorcentaje ? 0.01 : paso}
          value={Number.isFinite(redondeado) ? redondeado : ""}
          onChange={(e) => {
            const n = Number(e.target.value);
            if (!Number.isNaN(n)) onChange(esPorcentaje ? n / 100 : n);
          }}
          className="w-24 rounded-sm border border-bordeFuerte bg-superficieInput px-2 py-1.5 text-right tabular-nums text-white outline-none"
        />
        {sufijo && <span className="w-4 text-xs text-textoMuted">{sufijo}</span>}
      </span>
    </label>
  );
}

/* ------------------------------- Utilidades ------------------------------- */

function monto(valor: number, decimales: number): string {
  return Math.abs(valor).toLocaleString("es-UY", {
    minimumFractionDigits: decimales,
    maximumFractionDigits: decimales,
  });
}

function montoFirma(valor: number, decimales = 2): string {
  const signo = valor < 0 ? "−" : "";
  return `${signo}$ ${monto(valor, decimales)}`;
}

function calcularDias(desde: string, hasta: string): number {
  if (!esFechaDeInputCompleta(desde) || !esFechaDeInputCompleta(hasta)) return 1;
  const [a1, m1, d1] = desde.split("-").map(Number);
  const [a2, m2, d2] = hasta.split("-").map(Number);
  const inicio = Date.UTC(a1!, m1! - 1, d1!);
  const fin = Date.UTC(a2!, m2! - 1, d2!);
  return Math.max(Math.round((fin - inicio) / 86_400_000) + 1, 1);
}

function invertirFecha(iso: string): string {
  if (!esFechaDeInputCompleta(iso)) return iso;
  return iso.split("-").reverse().join("/");
}
