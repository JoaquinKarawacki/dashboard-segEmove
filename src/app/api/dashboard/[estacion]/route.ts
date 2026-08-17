import { NextRequest, NextResponse } from "next/server";
import { ErrorEstacionNoEncontrada } from "@/aplicacion/casosDeUso/ObtenerDashboardEstacionCasoUso";
import { FranjaHoraria } from "@/dominio/entidades/FranjaHoraria";
import { crearRangoFechas, parsearFechaDesdeTextoISO } from "@/dominio/entidades/RangoFechas";
import { contenedor } from "@/infraestructura/contenedor";

interface ParametrosRuta {
  params: Promise<{ estacion: string }>;
}

export async function GET(peticion: NextRequest, { params }: ParametrosRuta): Promise<NextResponse> {
  const { estacion } = await params;
  const parametrosUrl = peticion.nextUrl.searchParams;

  const desde = parametrosUrl.get("desde");
  const hasta = parametrosUrl.get("hasta");
  const franja = parametrosUrl.get("franja");
  const tipoCambio = Number(parametrosUrl.get("tipoCambio") ?? "40");

  if (!desde || !hasta) {
    return NextResponse.json({ error: "Faltan los parámetros 'desde' y 'hasta'." }, { status: 400 });
  }

  try {
    const dashboard = await contenedor.obtenerDashboardEstacionCasoUso.ejecutar({
      slugEstacion: estacion,
      rango: crearRangoFechas(parsearFechaDesdeTextoISO(desde), parsearFechaDesdeTextoISO(hasta)),
      franjaHoraria: esFranjaValida(franja) ? franja : null,
      tipoCambioUyuUsd: tipoCambio,
    });

    return NextResponse.json(dashboard, { status: 200 });
  } catch (error) {
    if (error instanceof ErrorEstacionNoEncontrada) {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }
    console.error("Error inesperado al obtener el dashboard:", error);
    return NextResponse.json({ error: "Ocurrió un error inesperado." }, { status: 500 });
  }
}

function esFranjaValida(valor: string | null): valor is FranjaHoraria {
  return valor === FranjaHoraria.Punta || valor === FranjaHoraria.Llano || valor === FranjaHoraria.Valle;
}
