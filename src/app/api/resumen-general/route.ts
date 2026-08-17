import { NextRequest, NextResponse } from "next/server";
import { crearRangoFechas, parsearFechaDesdeTextoISO } from "@/dominio/entidades/RangoFechas";
import { contenedor } from "@/infraestructura/contenedor";

export async function GET(peticion: NextRequest): Promise<NextResponse> {
  const parametrosUrl = peticion.nextUrl.searchParams;
  const desde = parametrosUrl.get("desde");
  const hasta = parametrosUrl.get("hasta");

  if (!desde || !hasta) {
    return NextResponse.json({ error: "Faltan los parámetros 'desde' y 'hasta'." }, { status: 400 });
  }

  try {
    const comparacion = await contenedor.obtenerResumenGeneralCasoUso.ejecutar({
      rango: crearRangoFechas(parsearFechaDesdeTextoISO(desde), parsearFechaDesdeTextoISO(hasta)),
    });
    return NextResponse.json(comparacion, { status: 200 });
  } catch (error) {
    console.error("Error inesperado al obtener el resumen general:", error);
    return NextResponse.json({ error: "Ocurrió un error inesperado." }, { status: 500 });
  }
}
