import { NextResponse } from "next/server";
import { contenedor } from "@/infraestructura/contenedor";

export async function GET(): Promise<NextResponse> {
  const rango = await contenedor.obtenerRangoDeFechasDisponibleCasoUso.ejecutar();
  return NextResponse.json(rango, { status: 200 });
}
