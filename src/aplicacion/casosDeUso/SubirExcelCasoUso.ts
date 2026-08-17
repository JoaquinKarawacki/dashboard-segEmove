import { crearTransaccion } from "@/dominio/entidades/Transaccion";
import { ParseadorExcel } from "../puertos/ParseadorExcel";
import { RepositorioTransacciones } from "../puertos/RepositorioTransacciones";

export interface ResultadoSubidaExcel {
  readonly cantidadTransaccionesProcesadas: number;
}

/**
 * Caso de uso: el usuario sube un Excel (el mismo que ya generan hoy) y sus
 * transacciones se acumulan a las que ya había cargadas — nunca las reemplaza.
 * Si una transacción ya existía (mismo `idTransaccion`), se actualiza con los
 * datos más recientes en vez de duplicarse.
 */
export class SubirExcelCasoUso {
  constructor(
    private readonly parseadorExcel: ParseadorExcel,
    private readonly repositorioTransacciones: RepositorioTransacciones,
  ) {}

  async ejecutar(archivoExcel: Buffer): Promise<ResultadoSubidaExcel> {
    const datosCrudos = await this.parseadorExcel.parsear(archivoExcel);
    const transacciones = datosCrudos.map(crearTransaccion);

    await this.repositorioTransacciones.guardarOActualizar(transacciones);

    return { cantidadTransaccionesProcesadas: transacciones.length };
  }
}
