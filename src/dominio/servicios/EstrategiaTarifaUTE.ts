import { FranjaHoraria, TODAS_LAS_FRANJAS } from "../entidades/FranjaHoraria";
import {
  ParametrosEstacionUTE,
  ParametrosTarifaUTE,
} from "../entidades/ParametrosTarifaUTE";

/** kWh vendidos, agrupados por franja horaria, dentro de un rango de fechas. */
export type KwhPorFranja = Readonly<Record<FranjaHoraria, number>>;

export interface DatosParaCalculoMargen {
  readonly kwhPorFranja: KwhPorFranja;
  /** Ingreso total (venta de energía + cargo fijo, en UYU) del período y franja filtrados. */
  readonly ingresoTotalUyu: number;
  readonly diasDelRango: number;
}

export interface ResultadoCalculoMargen {
  readonly costoTotalUte: number;
  readonly costoGestionEve: number;
  readonly costoSim4g: number;
  readonly margenNetoUyu: number;
}

/**
 * Estrategia de cálculo del costo UTE y el margen neto por estación.
 *
 * Es un patrón Strategy: el resto del sistema solo conoce esta interfaz, no la
 * fórmula concreta. Si UTE cambia su forma de facturar (o SEG quiere simular
 * un pliego distinto), se escribe otra implementación sin tocar los casos de uso.
 */
export interface EstrategiaTarifaUTE {
  calcularMargen(datos: DatosParaCalculoMargen): ResultadoCalculoMargen;
}

/**
 * Implementación que replica, fórmula por fórmula, la hoja "Resultados Costo
 * UTE" del Excel original. Dos detalles no obvios que se mantienen a propósito
 * porque así lo hace el Excel (y así es como el negocio lo viene calculando):
 *
 * 1. El costo de potencia contratada y el cargo fijo UTE se cobran completos
 *    (mensuales), NO prorrateados por los días del rango elegido.
 * 2. La bonificación reactiva de energía se aplica solo sobre el monto de
 *    energía de la franja Punta, no sobre el total.
 */
export class EstrategiaTarifaUTEExcel implements EstrategiaTarifaUTE {
  constructor(
    private readonly parametrosTarifa: ParametrosTarifaUTE,
    private readonly parametrosEstacion: ParametrosEstacionUTE,
  ) {}

  calcularMargen(datos: DatosParaCalculoMargen): ResultadoCalculoMargen {
    const montoEnergiaPorFranja = this.calcularMontoEnergiaPorFranja(datos.kwhPorFranja);
    const montoPotenciaPorFranja = this.calcularMontoPotenciaPorFranja();

    const montoEnergiaTotal = sumarValoresDeFranjas(montoEnergiaPorFranja);
    const montoPotenciaTotal = sumarValoresDeFranjas(montoPotenciaPorFranja);

    const bonificacionReactivaEnergia =
      montoEnergiaPorFranja[FranjaHoraria.Punta] * this.parametrosTarifa.bonificacionReactivaEnergia;

    const bonificacionReactivaPotencia =
      montoPotenciaTotal * this.parametrosTarifa.bonificacionReactivaPotencia;

    const bonificacionPotencia = TODAS_LAS_FRANJAS.reduce(
      (acumulado, franja) =>
        acumulado +
        montoPotenciaPorFranja[franja] * this.parametrosTarifa.bonificacionPotenciaPorFranja[franja],
      0,
    );

    const costoTotalUte =
      montoEnergiaTotal +
      montoPotenciaTotal +
      bonificacionReactivaEnergia +
      bonificacionReactivaPotencia +
      bonificacionPotencia +
      this.parametrosEstacion.cargoFijoUteMensual;

    const costoGestionEve = datos.ingresoTotalUyu * this.parametrosTarifa.comisionGestionEve;
    const costoSim4g = this.parametrosTarifa.costoSim4g;

    const margenNetoUyu = datos.ingresoTotalUyu - costoTotalUte - costoGestionEve - costoSim4g;

    return { costoTotalUte, costoGestionEve, costoSim4g, margenNetoUyu };
  }

  private calcularMontoEnergiaPorFranja(kwhPorFranja: KwhPorFranja): KwhPorFranja {
    return mapearPorFranja(
      (franja) => kwhPorFranja[franja] * this.parametrosTarifa.precioEnergiaPorFranja[franja],
    );
  }

  private calcularMontoPotenciaPorFranja(): KwhPorFranja {
    return mapearPorFranja(
      (franja) =>
        this.parametrosTarifa.precioPotenciaPorFranja[franja] *
        this.parametrosEstacion.potenciaContratadaPorFranja[franja],
    );
  }
}

function mapearPorFranja(calcular: (franja: FranjaHoraria) => number): KwhPorFranja {
  return {
    [FranjaHoraria.Punta]: calcular(FranjaHoraria.Punta),
    [FranjaHoraria.Llano]: calcular(FranjaHoraria.Llano),
    [FranjaHoraria.Valle]: calcular(FranjaHoraria.Valle),
  };
}

function sumarValoresDeFranjas(valoresPorFranja: KwhPorFranja): number {
  return TODAS_LAS_FRANJAS.reduce((acumulado, franja) => acumulado + valoresPorFranja[franja], 0);
}
