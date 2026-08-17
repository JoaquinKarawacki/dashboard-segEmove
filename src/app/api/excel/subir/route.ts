import { NextRequest, NextResponse } from "next/server";
import { ErrorFormatoExcelInvalido } from "@/aplicacion/puertos/ParseadorExcel";
import { contenedor } from "@/infraestructura/contenedor";

/**
 * Controlador delgado: solo traduce el request HTTP a una llamada al caso de
 * uso, y el resultado (o el error de negocio) a una respuesta HTTP. No tiene
 * ninguna lógica propia.
 */
export async function POST(peticion: NextRequest): Promise<NextResponse> {
  const formulario = await peticion.formData();
  const archivo = formulario.get("archivo");

  if (!(archivo instanceof File)) {
    return NextResponse.json({ error: "No se recibió ningún archivo." }, { status: 400 });
  }

  const bufferArchivo = Buffer.from(await archivo.arrayBuffer());

  try {
    const resultado = await contenedor.subirExcelCasoUso.ejecutar(bufferArchivo);
    return NextResponse.json(resultado, { status: 200 });
  } catch (error) {
    if (error instanceof ErrorFormatoExcelInvalido) {
      return NextResponse.json({ error: error.message }, { status: 422 });
    }
    console.error("Error inesperado al subir el Excel:", error);
    return NextResponse.json(
      { error: "Ocurrió un error inesperado al procesar el archivo." },
      { status: 500 },
    );
  }
}
