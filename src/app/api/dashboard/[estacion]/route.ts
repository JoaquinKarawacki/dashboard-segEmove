import { NextRequest, NextResponse } from "next/server";
import { ErrorEstacionNoEncontrada } from "@/aplicacion/casosDeUso/ObtenerDashboardEstacionCasoUso";
import { FranjaHoraria } from "@/dominio/entidades/FranjaHoraria";
import {
  ErrorFechaInvalida,
  crearRangoFechas,
  parsearFechaDesdeTextoISO,
} from "@/dominio/entidades/RangoFechas";
import { contenedor } from "@/infraestructura/contenedor";

const TIPO_CAMBIO_POR_DEFECTO = 40;

interface ParametrosRuta {
  params: Promise<{ estacion: string }>;
}

export async function GET(peticion: NextRequest, { params }: ParametrosRuta): Promise<NextResponse> {
  const { estacion } = await params;
  const parametrosUrl = peticion.nextUrl.searchParams;

  const desde = parametrosUrl.get("desde");
  const hasta = parametrosUrl.get("hasta");
  const franja = parametrosUrl.get("franja");
  const tipoCambio = leerTipoCambio(parametrosUrl.get("tipoCambio"));

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
    // Errores de entrada del usuario -> 400 (no es un fallo del servidor).
    if (error instanceof ErrorFechaInvalida) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    if (error instanceof ErrorEstacionNoEncontrada) {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }
    console.error("Error inesperado al obtener el dashboard:", error);
    return NextResponse.json({ error: "Ocurrió un error inesperado." }, { status: 500 });
  }
}

/**
 * Lee el tipo de cambio de la URL, cayendo al valor por defecto si viene vacío,
 * cero o no numérico. Evita dividir por cero al convertir los ingresos a USD.
 */
function leerTipoCambio(valor: string | null): number {
  const numero = Number(valor);
  return Number.isFinite(numero) && numero > 0 ? numero : TIPO_CAMBIO_POR_DEFECTO;
}

function esFranjaValida(valor: string | null): valor is FranjaHoraria {
  return valor === FranjaHoraria.Punta || valor === FranjaHoraria.Llano || valor === FranjaHoraria.Valle;
}
