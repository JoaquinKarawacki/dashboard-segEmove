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
  /** Bonificación reactiva de energía (% sobre el cargo de energía en Punta). */
  readonly bonificacionReactivaEnergia: number;
  /** Bonificación de potencia SAVE-OPC (%) por franja horaria. */
  readonly bonificacionPotenciaPorFranja: Readonly<Record<FranjaHoraria, number>>;
  /** Días del período de referencia de la factura UTE (ciclo de facturación). */
  readonly diasPeriodoReferenciaFactura: number;
  /** Comisión de gestión de EVE sobre el ingreso bruto (venta de energía + cargo fijo). */
  readonly comisionGestionEve: number;
  /** Costo fijo mensual del SIM 4G del cargador. */
  readonly costoSim4g: number;
  /**
   * IVA (fracción, p. ej. 0.22 = 22%). Los importes de venta/fijo del Panel
   * vienen con IVA incluido; el dashboard los reporta netos (bruto / (1 + iva)),
   * pero la gestión EVE se cobra sobre el bruto.
   */
  readonly iva: number;
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
  bonificacionReactivaEnergia: -0.0933,
  bonificacionPotenciaPorFranja: {
    [FranjaHoraria.Punta]: -0.8,
    [FranjaHoraria.Llano]: -0.7,
    [FranjaHoraria.Valle]: -0.7,
  },
  diasPeriodoReferenciaFactura: 30,
  comisionGestionEve: 0.12,
  costoSim4g: 400,
  iva: 0.22,
};

/**
 * Parámetros propios de cada estación para el cálculo de costo UTE. A diferencia
 * de la tarifa (compartida), estos valores se midieron por punto de carga:
 *
 * - `excedentePotenciaPorFranja`: kW por encima de los 60 contratados que UTE
 *   factura como potencia excedentaria en cada franja (celdas F54/F55/F56 del
 *   Excel, cargadas a mano a partir de la factura real — NO se derivan de los
 *   datos de transacciones).
 * - `eficienciaEquipoPorFranja`: eficiencia del equipo por franja (celdas
 *   J58/J59/J60); entra en el cargo de energía como factor (2 − eficiencia).
 * - `bonificacionReactivaPotencia`: % sobre el cargo de potencia contratada,
 *   levemente distinto por estación (celdas F63/F98/F133).
 */
export interface ParametrosEstacionUTE {
  readonly excedentePotenciaPorFranja: Readonly<Record<FranjaHoraria, number>>;
  readonly eficienciaEquipoPorFranja: Readonly<Record<FranjaHoraria, number>>;
  readonly bonificacionReactivaPotencia: number;
  readonly cargoFijoUteMensual: number;
}

/**
 * Parámetros por estación, indexados por el código de "Cargador" del Excel.
 * Valores tomados de los bloques FACTURA UTE de la hoja "Resultados Costo UTE".
 */
export const PARAMETROS_ESTACION_UTE_POR_CODIGO: Readonly<
  Record<string, ParametrosEstacionUTE>
> = {
  // San Jacinto
  SEG_DC_1: {
    excedentePotenciaPorFranja: {
      [FranjaHoraria.Punta]: 4.95,
      [FranjaHoraria.Llano]: 4.9,
      [FranjaHoraria.Valle]: 4.18,
    },
    eficienciaEquipoPorFranja: {
      [FranjaHoraria.Punta]: 0.7432,
      [FranjaHoraria.Llano]: 0.95,
      [FranjaHoraria.Valle]: 0.71,
    },
    bonificacionReactivaPotencia: -0.2508,
    cargoFijoUteMensual: 5225,
  },
  // Durazno
  SEG_DC_DUR_1: {
    excedentePotenciaPorFranja: {
      [FranjaHoraria.Punta]: 3.25,
      [FranjaHoraria.Llano]: 3.28,
      [FranjaHoraria.Valle]: 3.21,
    },
    eficienciaEquipoPorFranja: {
      [FranjaHoraria.Punta]: 0.755,
      [FranjaHoraria.Llano]: 0.8894,
      [FranjaHoraria.Valle]: 0.8,
    },
    bonificacionReactivaPotencia: -0.2507,
    cargoFijoUteMensual: 5225,
  },
  // Cardona
  SEG_DC_CAR_1: {
    excedentePotenciaPorFranja: {
      [FranjaHoraria.Punta]: 2.46,
      [FranjaHoraria.Llano]: 2.99,
      [FranjaHoraria.Valle]: 2.81,
    },
    eficienciaEquipoPorFranja: {
      [FranjaHoraria.Punta]: 0.795,
      [FranjaHoraria.Llano]: 0.879,
      [FranjaHoraria.Valle]: 1.0,
    },
    bonificacionReactivaPotencia: -0.2516,
    cargoFijoUteMensual: 5225,
  },
};
