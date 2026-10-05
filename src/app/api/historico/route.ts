import { NextResponse } from "next/server";
import { contenedor } from "@/infraestructura/contenedor";

/** Réplica de la hoja "Total histórico": acumulado all-time por cargador. */
export async function GET(): Promise<NextResponse> {
  try {
    const historico = await contenedor.obtenerHistoricoFlotaCasoUso.ejecutar();
    return NextResponse.json(historico, { status: 200 });
  } catch (error) {
    console.error("Error inesperado al obtener el histórico:", error);
    return NextResponse.json({ error: "Ocurrió un error inesperado." }, { status: 500 });
  }
}
