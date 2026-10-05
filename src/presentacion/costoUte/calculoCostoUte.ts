import { FranjaHoraria } from "@/dominio/entidades/FranjaHoraria";
import { ESTACIONES } from "@/dominio/entidades/Estacion";
import {
  PARAMETROS_TARIFA_UTE_ACTUALES,
  PARAMETROS_ESTACION_UTE_POR_CODIGO,
} from "@/dominio/entidades/ParametrosTarifaUTE";

/**
 * Cálculo de la "factura UTE" y el margen por cargador, replicando la hoja
 * "Resultados Costo UTE" del Excel con el mismo nivel de detalle (líneas
 * agrupadas) y permitiendo editar los parámetros en el navegador. Es una
 * calculadora de presentación: los valores por defecto salen de las constantes
 * del dominio (que son las que usa el servidor para el margen del Dashboard),
 * pero acá se pueden tocar sin afectar la base ni el resto de la app.
 *
 * La fórmula es la misma que `EstrategiaTarifaUTEExcel` (verificada contra el
 * Excel al peso): energía × (2 − eficiencia), potencia (60 + excedente) +
 * recargo por excedentaria, bonificación SAVE sobre 60 kW, reactivas; el margen
 * es ingreso neto − gestión EVE − SIM − costo UTE.
 */

/** Potencia contratada base (kW). No es editable: UTE la fija en 60. */
export const POTENCIA_CONTRATADA_KW = 60;

/** Orden de franjas para mostrar las facturas, igual que el Excel. */
export const ORDEN_FRANJAS: readonly FranjaHoraria[] = [
  FranjaHoraria.Punta,
  FranjaHoraria.Valle,
  FranjaHoraria.Llano,
];

type PorFranja = Record<FranjaHoraria, number>;

/** Parámetros de tarifa compartidos por los 3 cargadores (celdas E6:E17 del Excel). */
export interface ParametrosTarifaEditables {
  readonly precioEnergia: PorFranja;
  readonly precioPotencia: PorFranja;
  /** E12: referencia (no entra en el cálculo; la reactiva aplicada es por estación). */
  readonly reactivaEnergiaReferencia: number;
  /** E13: referencia (no entra en el cálculo; la reactiva aplicada es por estación). */
  readonly reactivaPotenciaReferencia: number;
  readonly bonificacionPotencia: PorFranja;
  /** E17: referencia (ciclo de facturación; no cambia el costo UTE del rango). */
  readonly diasPeriodoReferencia: number;
}

/** Costos de gestión (celdas E20/E21 del Excel). */
export interface ParametrosGestionEditables {
  readonly comisionGestionEve: number;
  readonly costoSim4g: number;
}

/** Parámetros propios de cada cargador (celdas F·/J· del Excel). */
export interface ParametrosEstacionEditables {
  readonly excedentePotencia: PorFranja;
  readonly eficienciaEquipo: PorFranja;
  readonly reactivaEnergia: number;
  readonly reactivaPotencia: PorFranja;
  /** Cargo fijo UTE mensual ($). No editable (el Excel lo deja fijo en 5225). */
  readonly cargoFijoUteMensual: number;
}

export interface ParametrosUteEditables {
  readonly tarifa: ParametrosTarifaEditables;
  readonly gestion: ParametrosGestionEditables;
  /** Indexado por código de estación (SEG_DC_1, etc.). */
  readonly porEstacion: Record<string, ParametrosEstacionEditables>;
}

/** Entrada por estación: lo que aporta la base (kWh por franja e ingreso neto del rango). */
export interface EntradaFacturaEstacion {
  readonly codigoEstacion: string;
  readonly kwhPorFranja: PorFranja;
  readonly ingresoNetoUyu: number;
}

/** Una línea de la factura (ej. "Cargo por potencia Punta"). */
export interface LineaFactura {
  readonly etiqueta: string;
  readonly detalle: string;
  readonly valor: number;
}

/** Un grupo de líneas de la factura (ej. "CARGO ENERGÍA MENSUAL"), con su subtotal. */
export interface GrupoFactura {
  readonly titulo: string;
  readonly lineas: readonly LineaFactura[];
  readonly subtotal: number;
}

export interface FacturaUte {
  readonly potenciaContratadaPorFranja: PorFranja;
  readonly grupos: readonly GrupoFactura[];
  readonly costoTotalUte: number;
  readonly ingresoNetoUyu: number;
  readonly costoGestionEve: number;
  readonly costoSim4g: number;
  readonly margenNetoUyu: number;
}

const IVA = PARAMETROS_TARIFA_UTE_ACTUALES.iva;

/** Construye los parámetros por defecto a partir de las constantes del dominio. */
export function construirParametrosPorDefecto(): ParametrosUteEditables {
  const t = PARAMETROS_TARIFA_UTE_ACTUALES;

  const porEstacion: Record<string, ParametrosEstacionEditables> = {};
  for (const estacion of ESTACIONES) {
    const e = PARAMETROS_ESTACION_UTE_POR_CODIGO[estacion.codigo];
    if (!e) continue;
    // En el Excel la reactiva de potencia es editable por franja (F63/F64/F65).
    // Por defecto las tres franjas comparten el valor medido de la estación.
    const rp = e.bonificacionReactivaPotencia;
    porEstacion[estacion.codigo] = {
      excedentePotencia: { ...e.excedentePotenciaPorFranja },
      eficienciaEquipo: { ...e.eficienciaEquipoPorFranja },
      reactivaEnergia: t.bonificacionReactivaEnergia,
      reactivaPotencia: {
        [FranjaHoraria.Punta]: rp,
        [FranjaHoraria.Llano]: rp,
        [FranjaHoraria.Valle]: rp,
      },
      cargoFijoUteMensual: e.cargoFijoUteMensual,
    };
  }

  return {
    tarifa: {
      precioEnergia: { ...t.precioEnergiaPorFranja },
      precioPotencia: { ...t.precioPotenciaPorFranja },
      reactivaEnergiaReferencia: -0.018,
      reactivaPotenciaReferencia: -0.093,
      bonificacionPotencia: { ...t.bonificacionPotenciaPorFranja },
      diasPeriodoReferencia: t.diasPeriodoReferenciaFactura,
    },
    gestion: {
      comisionGestionEve: t.comisionGestionEve,
      costoSim4g: t.costoSim4g,
    },
    porEstacion,
  };
}

/** Calcula la factura UTE detallada y el margen de una estación. */
export function calcularFacturaUte(
  entrada: EntradaFacturaEstacion,
  parametros: ParametrosUteEditables,
): FacturaUte {
  const { tarifa, gestion } = parametros;
  const est = parametros.porEstacion[entrada.codigoEstacion];
  if (!est) {
    throw new Error(`No hay parámetros UTE para la estación "${entrada.codigoEstacion}".`);
  }

  const potenciaContratadaPorFranja = mapearFranjas(
    (f) => POTENCIA_CONTRATADA_KW + est.excedentePotencia[f],
  );

  // Cargos base por franja.
  const bonifPotenciaSave = mapearFranjas(
    (f) => tarifa.precioPotencia[f] * POTENCIA_CONTRATADA_KW * tarifa.bonificacionPotencia[f],
  );
  const cargoPotencia = mapearFranjas(
    (f) => potenciaContratadaPorFranja[f] * tarifa.precioPotencia[f],
  );
  const recargoExcedentaria = mapearFranjas(
    (f) => est.excedentePotencia[f] * tarifa.precioPotencia[f],
  );
  const cargoEnergia = mapearFranjas(
    (f) => entrada.kwhPorFranja[f] * (2 - est.eficienciaEquipo[f]) * tarifa.precioEnergia[f],
  );
  const reactivaEnergia = cargoEnergia[FranjaHoraria.Punta] * est.reactivaEnergia;
  const reactivaPotencia = mapearFranjas((f) => cargoPotencia[f] * est.reactivaPotencia[f]);

  const linea = (etiqueta: string, detalle: string, valor: number): LineaFactura => ({
    etiqueta,
    detalle,
    valor,
  });
  const grupo = (titulo: string, lineas: LineaFactura[]): GrupoFactura => ({
    titulo,
    lineas,
    subtotal: lineas.reduce((total, l) => total + l.valor, 0),
  });

  const grupos: GrupoFactura[] = [
    grupo(
      "Bonificación de potencia SAVE - OPC",
      ORDEN_FRANJAS.map((f) =>
        linea(f, porcentaje(tarifa.bonificacionPotencia[f]), bonifPotenciaSave[f]),
      ),
    ),
    grupo("Cargo potencia contratada", [
      ...ORDEN_FRANJAS.map((f) =>
        linea(
          `Cargo por potencia ${f}`,
          `${numero(potenciaContratadaPorFranja[f], 2)} kW × ${numero(tarifa.precioPotencia[f], 1)}`,
          cargoPotencia[f],
        ),
      ),
      ...ORDEN_FRANJAS.map((f) =>
        linea(
          `Recargo por potencia excedentaria ${f}`,
          `${numero(est.excedentePotencia[f], 2)} kW`,
          recargoExcedentaria[f],
        ),
      ),
    ]),
    grupo(
      "Cargo energía mensual",
      ORDEN_FRANJAS.map((f) =>
        linea(
          f,
          `${numero(entrada.kwhPorFranja[f], 1)} kWh · ef. ${numero(est.eficienciaEquipo[f] * 100, 1)} %`,
          cargoEnergia[f],
        ),
      ),
    ),
    grupo("Cargo fijo", [
      linea("Energía reactiva", porcentaje(est.reactivaEnergia), reactivaEnergia),
      ...ORDEN_FRANJAS.map((f) =>
        linea(`Potencia reactiva ${f}`, porcentaje(est.reactivaPotencia[f]), reactivaPotencia[f]),
      ),
    ]),
  ];

  const costoTotalUte =
    est.cargoFijoUteMensual + grupos.reduce((total, g) => total + g.subtotal, 0);

  const costoGestionEve = entrada.ingresoNetoUyu * (1 + IVA) * gestion.comisionGestionEve;
  const margenNetoUyu =
    entrada.ingresoNetoUyu - costoGestionEve - gestion.costoSim4g - costoTotalUte;

  return {
    potenciaContratadaPorFranja,
    grupos,
    costoTotalUte,
    ingresoNetoUyu: entrada.ingresoNetoUyu,
    costoGestionEve,
    costoSim4g: gestion.costoSim4g,
    margenNetoUyu,
  };
}

function mapearFranjas(fn: (franja: FranjaHoraria) => number): PorFranja {
  return {
    [FranjaHoraria.Punta]: fn(FranjaHoraria.Punta),
    [FranjaHoraria.Llano]: fn(FranjaHoraria.Llano),
    [FranjaHoraria.Valle]: fn(FranjaHoraria.Valle),
  };
}

function numero(valor: number, decimales: number): string {
  return valor.toLocaleString("es-UY", {
    minimumFractionDigits: decimales,
    maximumFractionDigits: decimales,
  });
}

function porcentaje(fraccion: number): string {
  const signo = fraccion < 0 ? "−" : "";
  return `${signo}${numero(Math.abs(fraccion) * 100, 2)} %`;
}
