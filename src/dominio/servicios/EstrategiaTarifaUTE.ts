import { FranjaHoraria, TODAS_LAS_FRANJAS } from "../entidades/FranjaHoraria";
import {
  ParametrosEstacionUTE,
  ParametrosTarifaUTE,
} from "../entidades/ParametrosTarifaUTE";

/** kWh vendidos, agrupados por franja horaria, dentro de un rango de fechas. */
export type KwhPorFranja = Readonly<Record<FranjaHoraria, number>>;

export interface DatosParaCalculoMargen {
  readonly kwhPorFranja: KwhPorFranja;
  /** Ingreso NETO de IVA (venta de energía + cargo fijo, en UYU) del período filtrado. */
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
 * Implementación que replica, fórmula por fórmula, el bloque "FACTURA UTE" de la
 * hoja "Resultados Costo UTE" del Excel. Puntos no obvios que se mantienen a
 * propósito porque así factura UTE (y así lo calcula el negocio):
 *
 * 1. El cargo de energía por franja se calcula sobre la energía "ajustada" por
 *    la eficiencia del equipo: kWh × (2 − eficiencia).
 * 2. La potencia se factura sobre la potencia máxima medida (60 kW contratados
 *    + excedente), MÁS un recargo aparte por esa potencia excedentaria.
 * 3. La bonificación de potencia SAVE-OPC se calcula solo sobre los 60 kW
 *    contratados (no sobre el excedente).
 * 4. La bonificación reactiva de energía aplica solo al cargo de energía de la
 *    franja Punta; la reactiva de potencia, a cada cargo de potencia.
 * 5. El cargo de potencia y el cargo fijo UTE se cobran completos (mensuales),
 *    sin prorratear por los días del rango.
 * 6. La gestión EVE se cobra sobre el ingreso BRUTO (con IVA), aunque el margen
 *    se calcula sobre el ingreso neto.
 */
export class EstrategiaTarifaUTEExcel implements EstrategiaTarifaUTE {
  constructor(
    private readonly parametrosTarifa: ParametrosTarifaUTE,
    private readonly parametrosEstacion: ParametrosEstacionUTE,
  ) {}

  calcularMargen(datos: DatosParaCalculoMargen): ResultadoCalculoMargen {
    const cargoEnergiaPorFranja = this.calcularCargoEnergiaPorFranja(datos.kwhPorFranja);
    const cargoPotenciaPorFranja = this.calcularCargoPotenciaPorFranja();
    const recargoExcedentariaPorFranja = this.calcularRecargoExcedentariaPorFranja();
    const bonificacionPotenciaPorFranja = this.calcularBonificacionPotenciaPorFranja();
    const reactivaPotenciaPorFranja = mapearPorFranja(
      (franja) =>
        cargoPotenciaPorFranja[franja] * this.parametrosEstacion.bonificacionReactivaPotencia,
    );

    const reactivaEnergia =
      cargoEnergiaPorFranja[FranjaHoraria.Punta] * this.parametrosTarifa.bonificacionReactivaEnergia;

    const costoTotalUte =
      sumarValoresDeFranjas(cargoEnergiaPorFranja) +
      sumarValoresDeFranjas(cargoPotenciaPorFranja) +
      sumarValoresDeFranjas(recargoExcedentariaPorFranja) +
      reactivaEnergia +
      sumarValoresDeFranjas(reactivaPotenciaPorFranja) +
      sumarValoresDeFranjas(bonificacionPotenciaPorFranja) +
      this.parametrosEstacion.cargoFijoUteMensual;

    // La gestión EVE se cobra sobre el ingreso bruto (con IVA); el ingreso que
    // llega acá ya viene neto, así que se re-aplica el IVA para la comisión.
    const ingresoBrutoUyu = datos.ingresoTotalUyu * (1 + this.parametrosTarifa.iva);
    const costoGestionEve = ingresoBrutoUyu * this.parametrosTarifa.comisionGestionEve;
    const costoSim4g = this.parametrosTarifa.costoSim4g;

    const margenNetoUyu = datos.ingresoTotalUyu - costoGestionEve - costoSim4g - costoTotalUte;

    return { costoTotalUte, costoGestionEve, costoSim4g, margenNetoUyu };
  }

  /** Cargo de energía por franja = kWh × (2 − eficiencia) × precio de energía. */
  private calcularCargoEnergiaPorFranja(kwhPorFranja: KwhPorFranja): KwhPorFranja {
    return mapearPorFranja((franja) => {
      const energiaAjustada =
        kwhPorFranja[franja] * (2 - this.parametrosEstacion.eficienciaEquipoPorFranja[franja]);
      return energiaAjustada * this.parametrosTarifa.precioEnergiaPorFranja[franja];
    });
  }

  /** Cargo de potencia por franja = (60 contratados + excedente) × precio de potencia. */
  private calcularCargoPotenciaPorFranja(): KwhPorFranja {
    return mapearPorFranja((franja) => {
      const potenciaTotal =
        POTENCIA_CONTRATADA_KW + this.parametrosEstacion.excedentePotenciaPorFranja[franja];
      return potenciaTotal * this.parametrosTarifa.precioPotenciaPorFranja[franja];
    });
  }

  /** Recargo por potencia excedentaria por franja = excedente × precio de potencia. */
  private calcularRecargoExcedentariaPorFranja(): KwhPorFranja {
    return mapearPorFranja(
      (franja) =>
        this.parametrosEstacion.excedentePotenciaPorFranja[franja] *
        this.parametrosTarifa.precioPotenciaPorFranja[franja],
    );
  }

  /** Bonificación de potencia SAVE-OPC por franja = (precio × 60 contratados) × bonificación. */
  private calcularBonificacionPotenciaPorFranja(): KwhPorFranja {
    return mapearPorFranja(
      (franja) =>
        this.parametrosTarifa.precioPotenciaPorFranja[franja] *
        POTENCIA_CONTRATADA_KW *
        this.parametrosTarifa.bonificacionPotenciaPorFranja[franja],
    );
  }
}

/** Potencia contratada a UTE (kW), igual en las 3 estaciones y las 3 franjas. */
const POTENCIA_CONTRATADA_KW = 60;

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
