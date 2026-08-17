import {
  PARAMETROS_ESTACION_UTE_POR_DEFECTO,
  PARAMETROS_TARIFA_UTE_ACTUALES,
} from "@/dominio/entidades/ParametrosTarifaUTE";
import { EstrategiaTarifaUTEExcel } from "@/dominio/servicios/EstrategiaTarifaUTE";
import { ObtenerDashboardEstacionCasoUso } from "@/aplicacion/casosDeUso/ObtenerDashboardEstacionCasoUso";
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
  const estrategiaTarifaUTE = new EstrategiaTarifaUTEExcel(
    PARAMETROS_TARIFA_UTE_ACTUALES,
    PARAMETROS_ESTACION_UTE_POR_DEFECTO,
  );

  return {
    subirExcelCasoUso: new SubirExcelCasoUso(parseadorExcel, repositorioTransacciones),
    obtenerDashboardEstacionCasoUso: new ObtenerDashboardEstacionCasoUso(
      repositorioTransacciones,
      estrategiaTarifaUTE,
    ),
    obtenerResumenGeneralCasoUso: new ObtenerResumenGeneralCasoUso(repositorioTransacciones),
    obtenerRangoDeFechasDisponibleCasoUso: new ObtenerRangoDeFechasDisponibleCasoUso(
      repositorioTransacciones,
    ),
  };
}

export const contenedor = crearContenedor();
