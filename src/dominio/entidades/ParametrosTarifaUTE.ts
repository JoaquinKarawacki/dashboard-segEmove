import { FranjaHoraria } from "./FranjaHoraria";

/**
 * Parámetros de la tarifa UTE y de los costos de gestión, extraídos literalmente
 * de la hoja "Resultados Costo UTE" del Excel (celdas B6:E21, no inventados).
 * Son constantes de negocio: cambian pocas veces al año, cuando UTE actualiza
 * el pliego tarifario. Quedan documentadas acá en vez de hardcodeadas dentro de
 * la estrategia de cálculo, para poder ajustarlas sin tocar la lógica
 * (fase 2: pantalla de edición).
 */
export interface ParametrosTarifaUTE {
  /** Precio de la energía ($/kWh) por franja horaria. */
  readonly precioEnergiaPorFranja: Readonly<Record<FranjaHoraria, number>>;
  /** Precio de la potencia contratada ($/kW) por franja horaria. */
  readonly precioPotenciaPorFranja: Readonly<Record<FranjaHoraria, number>>;
  /** Bonificación reactiva de energía (% sobre el monto de energía en Punta). */
  readonly bonificacionReactivaEnergia: number;
  /** Bonificación reactiva de potencia (% sobre el monto de potencia total). */
  readonly bonificacionReactivaPotencia: number;
  /** Bonificación de potencia (%) por franja horaria. */
  readonly bonificacionPotenciaPorFranja: Readonly<Record<FranjaHoraria, number>>;
  /** Días del período de referencia de la factura UTE (ciclo de facturación). */
  readonly diasPeriodoReferenciaFactura: number;
  /** Comisión de gestión de EVE sobre el ingreso (venta de energía + cargo fijo). */
  readonly comisionGestionEve: number;
  /** Costo fijo mensual del SIM 4G del cargador. */
  readonly costoSim4g: number;
}

export const PARAMETROS_TARIFA_UTE_ACTUALES: ParametrosTarifaUTE = {
  precioEnergiaPorFranja: {
    [FranjaHoraria.Punta]: 6.824,
    [FranjaHoraria.Llano]: 4.583,
    [FranjaHoraria.Valle]: 2.554,
  },
  precioPotenciaPorFranja: {
    [FranjaHoraria.Punta]: 737.8,
    [FranjaHoraria.Llano]: 317.6,
    [FranjaHoraria.Valle]: 52.1,
  },
  bonificacionReactivaEnergia: -0.018,
  bonificacionReactivaPotencia: -0.0928,
  bonificacionPotenciaPorFranja: {
    [FranjaHoraria.Punta]: -0.8,
    [FranjaHoraria.Llano]: -0.7,
    [FranjaHoraria.Valle]: -0.7,
  },
  diasPeriodoReferenciaFactura: 30,
  comisionGestionEve: 0.12,
  costoSim4g: 400,
};

/**
 * Parámetros propios de cada estación para el cálculo de costo UTE:
 * potencia contratada por franja y el cargo fijo mensual que UTE le facturaba
 * a ese punto. En el Excel, las 3 estaciones tienen hoy los mismos valores
 * (60kW en las 3 franjas, $5225 de cargo fijo), pero se modelan por estación
 * porque son datos contractuales que pueden cambiar por punto de carga.
 */
export interface ParametrosEstacionUTE {
  readonly potenciaContratadaPorFranja: Readonly<Record<FranjaHoraria, number>>;
  readonly cargoFijoUteMensual: number;
}

export const PARAMETROS_ESTACION_UTE_POR_DEFECTO: ParametrosEstacionUTE = {
  potenciaContratadaPorFranja: {
    [FranjaHoraria.Punta]: 60,
    [FranjaHoraria.Llano]: 60,
    [FranjaHoraria.Valle]: 60,
  },
  cargoFijoUteMensual: 5225,
};
