/**
 * Rango de fechas inclusivo, usado para filtrar transacciones (equivalente a
 * las celdas "Día desde" / "Día hasta" del Excel).
 */
export interface RangoFechas {
  readonly desde: Date;
  readonly hasta: Date;
}

/**
 * Se lanza cuando un texto no representa una fecha válida en formato AAAA-MM-DD.
 * Es un error de entrada del usuario (no un fallo inesperado): las rutas API lo
 * traducen a un HTTP 400, no a un 500.
 */
export class ErrorFechaInvalida extends Error {
  constructor(texto: string) {
    super(`La fecha "${texto}" no es válida. Se espera el formato AAAA-MM-DD.`);
    this.name = "ErrorFechaInvalida";
  }
}

/**
 * Compara solo la parte de fecha (año/mes/día), ignorando la hora — igual que
 * el Excel original, que filtra contra la columna "Fecha" (la fecha truncada,
 * sin hora), no contra "Fecha inicio" completo. Si compararamos la fecha-hora
 * completa contra "hasta" a medianoche, se perderían todas las transacciones
 * de la tarde/noche del último día del rango.
 */
export function fechaEstaDentroDelRango(fecha: Date, rango: RangoFechas): boolean {
  const soloFecha = truncarAFecha(fecha);
  return soloFecha >= truncarAFecha(rango.desde) && soloFecha <= truncarAFecha(rango.hasta);
}

function truncarAFecha(fecha: Date): number {
  return new Date(fecha.getFullYear(), fecha.getMonth(), fecha.getDate()).getTime();
}

/**
 * Crea un rango válido. Si "desde" queda posterior a "hasta" (algo común al
 * mover un extremo del filtro, o al tipear el año dígito por dígito), se
 * intercambian los extremos en vez de fallar: el rango siempre queda coherente
 * y el dashboard nunca se rompe por un orden transitorio de las fechas.
 */
export function crearRangoFechas(desde: Date, hasta: Date): RangoFechas {
  if (desde > hasta) {
    return { desde: hasta, hasta: desde };
  }
  return { desde, hasta };
}

/**
 * Parsea un texto "AAAA-MM-DD" (el formato de un `<input type="date">") como
 * fecha LOCAL, a propósito, para no usar `new Date("AAAA-MM-DD")`: el estándar
 * de JavaScript interpreta ese formato como medianoche **UTC**, mientras que
 * las transacciones se parsean como hora local del servidor (ver
 * `ParseadorExcelSheetJS.leerFecha`). Mezclar ambas formas corre el rango un
 * día si el servidor no corre en UTC — esta función evita esa mezcla.
 *
 * Valida estrictamente la entrada: si el texto está vacío, mal formado, o
 * representa una fecha imposible (por ejemplo "2026-02-31", que JavaScript
 * "corregiría" solo a marzo, o un año de 1-2 dígitos que mapea a 19xx), lanza
 * `ErrorFechaInvalida` en vez de devolver una fecha silenciosamente incorrecta.
 */
export function parsearFechaDesdeTextoISO(texto: string): Date {
  const coincidencia = /^(\d{4})-(\d{2})-(\d{2})$/.exec(texto.trim());
  if (!coincidencia) {
    throw new ErrorFechaInvalida(texto);
  }

  const [, anioTexto, mesTexto, diaTexto] = coincidencia;
  const anio = Number(anioTexto);
  const mes = Number(mesTexto);
  const dia = Number(diaTexto);

  const fecha = new Date(anio, mes - 1, dia);

  // Rechaza fechas imposibles: JavaScript normaliza (ej: 31/02 -> 03/03) y
  // mapea años de 0-99 a 1900-1999. Si algún componente no sobrevive el ida y
  // vuelta, la fecha no era válida.
  const esConsistente =
    !Number.isNaN(fecha.getTime()) &&
    fecha.getFullYear() === anio &&
    fecha.getMonth() === mes - 1 &&
    fecha.getDate() === dia;

  if (!esConsistente) {
    throw new ErrorFechaInvalida(texto);
  }

  return fecha;
}
