/**
 * Estación de carga. El código interno (`SEG_DC_1`, etc.) es el valor de la
 * columna "Cargador" del Excel; el nombre visible es el que ve el usuario.
 */
export interface Estacion {
  readonly codigo: string;
  readonly nombre: string;
  readonly slug: string;
}

export const ESTACIONES: readonly Estacion[] = [
  { codigo: "SEG_DC_1", nombre: "San Jacinto", slug: "san-jacinto" },
  { codigo: "SEG_DC_DUR_1", nombre: "Durazno", slug: "durazno" },
  { codigo: "SEG_DC_CAR_1", nombre: "Cardona", slug: "cardona" },
];

export function buscarEstacionPorSlug(slug: string): Estacion | undefined {
  return ESTACIONES.find((estacion) => estacion.slug === slug);
}

export function buscarEstacionPorCodigo(codigo: string): Estacion | undefined {
  return ESTACIONES.find((estacion) => estacion.codigo === codigo);
}
