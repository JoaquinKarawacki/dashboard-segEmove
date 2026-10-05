"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { CargarExcelBoton } from "@/presentacion/componentes/CargarExcelBoton";
import { RelojEnVivo } from "@/presentacion/componentes/RelojEnVivo";
import { ScopePills, Alcance } from "@/presentacion/componentes/ScopePills";
import { SheetTabs, Hoja } from "@/presentacion/componentes/SheetTabs";
import { FiltroFechaFranja, ValorFiltro } from "@/presentacion/componentes/FiltroFechaFranja";
import { VistaDashboard } from "@/presentacion/vistas/VistaDashboard";
import { VistaCostoUte } from "@/presentacion/vistas/VistaCostoUte";
import { esFechaDeInputCompleta, formatearFechaParaInput } from "@/presentacion/utilidades/formato";

interface RangoDisponible {
  readonly minima: string;
  readonly maxima: string;
}

const FILTRO_POR_DEFECTO: ValorFiltro = {
  desde: formatearFechaParaInput(new Date()),
  hasta: formatearFechaParaInput(new Date()),
  franja: "Todas",
  tipoCambio: 40,
};

export default function PaginaDashboard() {
  const [alcance, setAlcance] = useState<Alcance>("todos");
  const [hoja, setHoja] = useState<Hoja>("dashboard");
  const [filtro, setFiltro] = useState<ValorFiltro>(FILTRO_POR_DEFECTO);
  const [rangoDisponible, setRangoDisponible] = useState<RangoDisponible | null>(null);

  // Al entrar, el filtro se inicializa con el rango completo disponible en la base.
  useEffect(() => {
    fetch("/api/rango-fechas")
      .then((respuesta) => respuesta.json())
      .then((rango: RangoDisponible | null) => {
        if (!rango) return;
        const minima = formatearFechaParaInput(new Date(rango.minima));
        const maxima = formatearFechaParaInput(new Date(rango.maxima));
        setRangoDisponible({ minima, maxima });
        setFiltro((actual) => ({ ...actual, desde: minima, hasta: maxima }));
      })
      .catch(() => {});
  }, []);

  const filtroListo = esFechaDeInputCompleta(filtro.desde) && esFechaDeInputCompleta(filtro.hasta);

  return (
    <div className="flex flex-col gap-5">
      <header className="flex flex-col gap-4 border-b border-borde pb-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-4">
            <Image
              src="/seg-e-move-logo.jpg"
              alt="SEG e-move"
              width={90}
              height={53}
              className="h-[53px] w-[90px] object-contain"
              priority
            />
            <div className="flex flex-col gap-0.5">
              <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-rojo">
                SEG Ingeniería · Movilidad eléctrica
              </span>
              <span className="text-2xl font-black leading-none text-white">Cargadores DC</span>
            </div>
            <div className="mx-1 hidden h-6 w-px bg-bordeFuerte sm:block" />
            <ScopePills valor={alcance} alCambiar={setAlcance} />
          </div>
          <div className="flex items-center gap-4">
            <RelojEnVivo />
            <CargarExcelBoton />
          </div>
        </div>

        <SheetTabs valor={hoja} alCambiar={setHoja} />

        <FiltroFechaFranja
          valor={filtro}
          alCambiar={setFiltro}
          fechaMinima={rangoDisponible?.minima}
          fechaMaxima={rangoDisponible?.maxima}
        />
      </header>

      {!filtroListo ? (
        <p className="text-sm text-textoMuted">Elegí un rango de fechas válido.</p>
      ) : hoja === "dashboard" ? (
        <VistaDashboard
          alcance={alcance}
          desde={filtro.desde}
          hasta={filtro.hasta}
          franja={filtro.franja}
          tipoCambio={filtro.tipoCambio}
        />
      ) : (
        <VistaCostoUte
          alcance={alcance}
          desde={filtro.desde}
          hasta={filtro.hasta}
          tipoCambio={filtro.tipoCambio}
        />
      )}
    </div>
  );
}
