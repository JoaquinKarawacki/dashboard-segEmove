import {
  PARAMETROS_ESTACION_UTE_POR_CODIGO,
  PARAMETROS_TARIFA_UTE_ACTUALES,
} from "@/dominio/entidades/ParametrosTarifaUTE";
import {
  EstrategiaTarifaUTE,
  EstrategiaTarifaUTEExcel,
} from "@/dominio/servicios/EstrategiaTarifaUTE";
import { ObtenerDashboardEstacionCasoUso } from "@/aplicacion/casosDeUso/ObtenerDashboardEstacionCasoUso";
import { ObtenerHistoricoFlotaCasoUso } from "@/aplicacion/casosDeUso/ObtenerHistoricoFlotaCasoUso";
import { ObtenerRangoDeFechasDisponibleCasoUso } from "@/aplicacion/casosDeUso/ObtenerRangoDeFechasDisponibleCasoUso";
import { ObtenerResumenGeneralCasoUso } from "@/aplicacion/casosDeUso/ObtenerResumenGeneralCasoUso";
import { SubirExcelCasoUso } from "@/aplicacion/casosDeUso/SubirExcelCasoUso";
import { ParseadorExcelSheetJS } from "./excel/ParseadorExcelSheetJS";
import { clientePrisma } from "./persistencia/clientePrisma";
import { RepositorioTransaccionesPostgres } from "./persistencia/RepositorioTransaccionesPostgres";

/**
 * Punto de composición: el único lugar del sistema donde se conectan todas
 * las capas entre sí (implementaciones concretas de infraestructura con los
 * casos de uso de aplicación). La capa de presentación nunca instancia un
 * repositorio o un parseador directamente — siempre pide los casos de uso acá.
 */
function crearContenedor() {
  const repositorioTransacciones = new RepositorioTransaccionesPostgres(clientePrisma);
  const parseadorExcel = new ParseadorExcelSheetJS();

  // Una estrategia de tarifa por estación: comparten la tarifa UTE, pero cada
  // una tiene sus propios parámetros (excedente de potencia, eficiencia, etc.).
  const estrategiasPorEstacion: Record<string, EstrategiaTarifaUTE> = Object.fromEntries(
    Object.entries(PARAMETROS_ESTACION_UTE_POR_CODIGO).map(([codigo, parametrosEstacion]) => [
      codigo,
      new EstrategiaTarifaUTEExcel(PARAMETROS_TARIFA_UTE_ACTUALES, parametrosEstacion),
    ]),
  );

  const resolverEstrategiaTarifaUTE = (codigoEstacion: string): EstrategiaTarifaUTE => {
    const estrategia = estrategiasPorEstacion[codigoEstacion];
    if (!estrategia) {
      throw new Error(`No hay parámetros de tarifa UTE para la estación "${codigoEstacion}".`);
    }
    return estrategia;
  };

  return {
    subirExcelCasoUso: new SubirExcelCasoUso(parseadorExcel, repositorioTransacciones),
    obtenerDashboardEstacionCasoUso: new ObtenerDashboardEstacionCasoUso(
      repositorioTransacciones,
      resolverEstrategiaTarifaUTE,
      PARAMETROS_TARIFA_UTE_ACTUALES.iva,
    ),
    obtenerResumenGeneralCasoUso: new ObtenerResumenGeneralCasoUso(repositorioTransacciones),
    obtenerHistoricoFlotaCasoUso: new ObtenerHistoricoFlotaCasoUso(repositorioTransacciones),
    obtenerRangoDeFechasDisponibleCasoUso: new ObtenerRangoDeFechasDisponibleCasoUso(
      repositorioTransacciones,
    ),
  };
}

export const contenedor = crearContenedor();
