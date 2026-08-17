import { PrismaClient, TransaccionRegistro } from "@prisma/client";
import { RepositorioTransacciones } from "@/aplicacion/puertos/RepositorioTransacciones";
import { crearTransaccion, Transaccion } from "@/dominio/entidades/Transaccion";

/**
 * Implementación concreta del puerto `RepositorioTransacciones` usando
 * Prisma/PostgreSQL. Es la única clase del sistema que sabe que la
 * persistencia es una base de datos relacional — dominio y aplicación
 * trabajan siempre contra la interfaz.
 */
export class RepositorioTransaccionesPostgres implements RepositorioTransacciones {
  constructor(private readonly prisma: PrismaClient) {}

  async guardarOActualizar(transacciones: readonly Transaccion[]): Promise<void> {
    // Upsert uno por uno dentro de una transacción de base de datos: si
    // `idTransaccion` ya existía se actualiza, si no, se crea. Así se cumple
    // la regla de negocio "acumular, no reemplazar".
    await this.prisma.$transaction(
      transacciones.map((transaccion) => {
        const datos = mapearTransaccionARegistro(transaccion);
        return this.prisma.transaccionRegistro.upsert({
          where: { idTransaccion: transaccion.idTransaccion },
          create: datos,
          update: datos,
        });
      }),
    );
  }

  async buscarPorEstacion(codigoEstacion: string): Promise<Transaccion[]> {
    const registros = await this.prisma.transaccionRegistro.findMany({
      where: { cargador: codigoEstacion },
      orderBy: { fechaInicio: "asc" },
    });
    return registros.map(mapearRegistroATransaccion);
  }

  async buscarTodas(): Promise<Transaccion[]> {
    const registros = await this.prisma.transaccionRegistro.findMany({
      orderBy: { fechaInicio: "asc" },
    });
    return registros.map(mapearRegistroATransaccion);
  }

  async obtenerRangoDeFechasDisponible(): Promise<{ minima: Date; maxima: Date } | null> {
    const [primeraTransaccion, ultimaTransaccion] = await Promise.all([
      this.prisma.transaccionRegistro.findFirst({ orderBy: { fechaInicio: "asc" } }),
      this.prisma.transaccionRegistro.findFirst({ orderBy: { fechaInicio: "desc" } }),
    ]);

    if (!primeraTransaccion || !ultimaTransaccion) {
      return null;
    }

    return { minima: primeraTransaccion.fechaInicio, maxima: ultimaTransaccion.fechaInicio };
  }
}

function mapearTransaccionARegistro(transaccion: Transaccion) {
  return {
    idTransaccion: transaccion.idTransaccion,
    cargador: transaccion.cargador,
    conector: transaccion.conector,
    tag: transaccion.tag,
    usuario: transaccion.usuario,
    fechaInicio: transaccion.fechaInicio,
    fechaFin: transaccion.fechaFin,
    potenciaKw: transaccion.potenciaKw,
    energiaKwh: transaccion.energiaKwh,
    compra: transaccion.compra,
    fijo: transaccion.fijo,
    permanencia: transaccion.permanencia,
    venta: transaccion.venta,
    descuento: transaccion.descuento,
    total: transaccion.total,
    duracionMinutos: transaccion.duracionMinutos,
    excluir: transaccion.excluir,
  };
}

function mapearRegistroATransaccion(registro: TransaccionRegistro): Transaccion {
  return crearTransaccion({
    idTransaccion: registro.idTransaccion,
    cargador: registro.cargador,
    conector: registro.conector,
    tag: registro.tag,
    usuario: registro.usuario,
    fechaInicio: registro.fechaInicio,
    fechaFin: registro.fechaFin,
    potenciaKw: registro.potenciaKw,
    energiaKwh: registro.energiaKwh,
    compra: registro.compra,
    fijo: registro.fijo,
    permanencia: registro.permanencia,
    venta: registro.venta,
    descuento: registro.descuento,
    total: registro.total,
    duracionMinutos: registro.duracionMinutos,
    excluir: registro.excluir,
  });
}
