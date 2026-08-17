/**
 * Rango de fechas inclusivo, usado para filtrar transacciones (equivalente a
 * las celdas "Día desde" / "Día hasta" del Excel).
 */
export interface RangoFechas {
  readonly desde: Date;
  readonly hasta: Date;
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

export function crearRangoFechas(desde: Date, hasta: Date): RangoFechas {
  if (desde > hasta) {
    throw new Error("La fecha 'desde' no puede ser posterior a la fecha 'hasta'.");
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
 */
export function parsearFechaDesdeTextoISO(texto: string): Date {
  const [anio, mes, dia] = texto.split("-").map(Number) as [number, number, number];
  return new Date(anio, mes - 1, dia);
}
