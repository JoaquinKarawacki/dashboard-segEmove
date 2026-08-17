/**
 * Franja horaria tarifaria (UTE). Se calcula a partir de la hora de inicio
 * de la transacción: Punta 18-22h, Valle antes de las 7h, Llano el resto.
 */
export enum FranjaHoraria {
  Punta = "Punta",
  Llano = "Llano",
  Valle = "Valle",
}

export const TODAS_LAS_FRANJAS: readonly FranjaHoraria[] = [
  FranjaHoraria.Punta,
  FranjaHoraria.Llano,
  FranjaHoraria.Valle,
];

/**
 * Regla de negocio replicada del Excel original (columna "Franja horaria" del
 * Panel): punta de 18 a 22h, valle antes de las 7h, llano en cualquier otro horario.
 */
export function calcularFranjaHoraria(horaInicio: number): FranjaHoraria {
  if (horaInicio >= 18 && horaInicio < 22) {
    return FranjaHoraria.Punta;
  }
  if (horaInicio < 7) {
    return FranjaHoraria.Valle;
  }
  return FranjaHoraria.Llano;
}
