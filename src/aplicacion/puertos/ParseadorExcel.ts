import { DatosCrudosTransaccion } from "@/dominio/entidades/Transaccion";

/**
 * Puerto (interfaz) para convertir un archivo Excel en transacciones. La
 * implementación concreta (con la librería `xlsx`) vive en `infraestructura/`.
 * Patrón Adapter: aísla la librería externa; si el día de mañana se reemplaza
 * la carga manual por la API de Eve-Move, se escribe otro adaptador que
 * implemente esta misma interfaz.
 */
export interface ParseadorExcel {
  parsear(archivo: Buffer): Promise<DatosCrudosTransaccion[]>;
}

/** Error de negocio: el Excel subido no tiene el formato esperado. */
export class ErrorFormatoExcelInvalido extends Error {
  constructor(motivo: string) {
    super(`El archivo Excel no tiene el formato esperado: ${motivo}`);
    this.name = "ErrorFormatoExcelInvalido";
  }
}
