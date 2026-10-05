import * as XLSX from "xlsx";
import { ParseadorExcel, ErrorFormatoExcelInvalido } from "@/aplicacion/puertos/ParseadorExcel";
import { DatosCrudosTransaccion } from "@/dominio/entidades/Transaccion";

/**
 * Nombres posibles de la hoja de datos, en orden de preferencia. El Excel
 * "DASHBOARD_CARGADORES" trae los datos en "Panel"; el export crudo del manager
 * los traía en "Worksheet". Se usa la primera hoja que exista.
 */
const NOMBRES_HOJA_DATOS = ["Panel", "Worksheet"] as const;

/**
 * Nombres de columna esperados en la hoja de datos, tal como los exporta el
 * manager. "Excluir" no está en esta lista porque el export actual no la
 * incluye: si falta, se toma como no excluida (ver `leerNumero`).
 */
const COLUMNAS_ESPERADAS = [
  "Transacción",
  "Cargador",
  "Conector",
  "Tag",
  "Usuario",
  "Fecha inicio",
  "Fecha fin",
  "Potencia (kW)",
  "Energía (kWh)",
  "Compra ($)",
  "Fijo ($)",
  "Permanencia ($)",
  "Venta ($)",
  "Descuento ($)",
  "Total ($)",
  "Duración (m)",
] as const;

/** Una fila cruda de la hoja de datos, tal como la devuelve SheetJS. */
type FilaExcel = Record<string, string | number | boolean | Date | undefined>;

/**
 * Adapter sobre la librería `xlsx` (SheetJS): traduce el archivo que sube el
 * usuario a los `DatosCrudosTransaccion` que entiende el dominio. Si el día
 * de mañana se conecta la API de Eve-Move, se escribe otro adaptador que
 * implemente `ParseadorExcel` sin tocar el resto del sistema.
 */
export class ParseadorExcelSheetJS implements ParseadorExcel {
  async parsear(archivo: Buffer): Promise<DatosCrudosTransaccion[]> {
    const libro = XLSX.read(archivo, { type: "buffer", cellDates: true });
    const nombreHoja = NOMBRES_HOJA_DATOS.find((nombre) => libro.Sheets[nombre]);

    if (!nombreHoja) {
      throw new ErrorFormatoExcelInvalido(
        `no se encontró ninguna hoja de datos (${NOMBRES_HOJA_DATOS.map((n) => `"${n}"`).join(" o ")}).`,
      );
    }

    const hoja = libro.Sheets[nombreHoja]!;

    // Se lee como matriz (`header: 1`) en vez de dejar que SheetJS arme los
    // objetos: así se evita que una celda vacía en la primera fila de datos
    // haga "desaparecer" esa columna (SheetJS omite la clave si el valor de
    // ESA fila es undefined), y se puede recortar el espacio en blanco final
    // que trae el Excel real en encabezados como "Compra ($) ".
    const filasComoMatriz: unknown[][] = XLSX.utils.sheet_to_json(hoja, {
      header: 1,
      defval: undefined,
    });

    if (filasComoMatriz.length < 2) {
      throw new ErrorFormatoExcelInvalido(`la hoja "${nombreHoja}" no tiene filas de datos.`);
    }

    const [filaCabecera, ...filasDeDatos] = filasComoMatriz;
    const cabecera = filaCabecera!.map((valor) => String(valor ?? "").trim());

    validarColumnas(cabecera);

    return filasDeDatos
      .map((fila) => construirFilaDesdeMatriz(cabecera, fila))
      .filter((fila) => fila["Transacción"] !== undefined && fila["Transacción"] !== "")
      .map(convertirFilaATransaccionCruda);
  }
}

function construirFilaDesdeMatriz(cabecera: readonly string[], filaComoMatriz: unknown[]): FilaExcel {
  const fila: FilaExcel = {};
  cabecera.forEach((nombreColumna, indice) => {
    fila[nombreColumna] = filaComoMatriz[indice] as FilaExcel[string];
  });
  return fila;
}

function validarColumnas(cabecera: readonly string[]): void {
  const columnasFaltantes = COLUMNAS_ESPERADAS.filter((columna) => !cabecera.includes(columna));

  if (columnasFaltantes.length > 0) {
    throw new ErrorFormatoExcelInvalido(
      `faltan las columnas: ${columnasFaltantes.join(", ")}.`,
    );
  }
}

function convertirFilaATransaccionCruda(fila: FilaExcel): DatosCrudosTransaccion {
  const fechaInicio = leerFecha(fila["Fecha inicio"]);
  if (!fechaInicio) {
    throw new ErrorFormatoExcelInvalido(
      `la transacción "${fila["Transacción"]}" no tiene una "Fecha inicio" válida.`,
    );
  }

  return {
    idTransaccion: String(fila["Transacción"]),
    cargador: String(fila["Cargador"]),
    conector: leerTextoOpcional(fila["Conector"]),
    tag: leerTextoOpcional(fila["Tag"]),
    usuario: leerTextoOpcional(fila["Usuario"]),
    fechaInicio,
    fechaFin: leerFecha(fila["Fecha fin"]),
    potenciaKw: leerNumero(fila["Potencia (kW)"]),
    energiaKwh: leerNumero(fila["Energía (kWh)"]),
    compra: leerNumero(fila["Compra ($)"]),
    fijo: leerNumero(fila["Fijo ($)"]),
    permanencia: leerNumero(fila["Permanencia ($)"]),
    venta: leerNumero(fila["Venta ($)"]),
    descuento: leerNumero(fila["Descuento ($)"]),
    total: leerNumero(fila["Total ($)"]),
    duracionMinutos: leerNumero(fila["Duración (m)"]),
    excluir: leerNumero(fila["Excluir"]) === 1,
  };
}

function leerNumero(valor: FilaExcel[string]): number {
  if (valor === undefined || valor === null || valor === "") return 0;
  const numero = typeof valor === "number" ? valor : Number(valor);
  return Number.isNaN(numero) ? 0 : numero;
}

function leerTextoOpcional(valor: FilaExcel[string]): string | null {
  if (valor === undefined || valor === null || valor === "") return null;
  return String(valor);
}

function leerFecha(valor: FilaExcel[string]): Date | null {
  if (valor === undefined || valor === null || valor === "") return null;
  if (valor instanceof Date) return valor;

  // Formato de texto del Excel original: "dd/mm/yyyy hh:mm:ss.000"
  if (typeof valor === "string") {
    const coincidencia = valor.match(
      /^(\d{2})\/(\d{2})\/(\d{4}) (\d{2}):(\d{2}):(\d{2})/,
    );
    if (coincidencia) {
      const [, dia, mes, anio, hora, minuto, segundo] = coincidencia;
      return new Date(
        Number(anio),
        Number(mes) - 1,
        Number(dia),
        Number(hora),
        Number(minuto),
        Number(segundo),
      );
    }
  }

  return null;
}
