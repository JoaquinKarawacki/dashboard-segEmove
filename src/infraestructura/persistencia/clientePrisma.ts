import { PrismaClient } from "@prisma/client";

/**
 * Singleton del cliente de Prisma. En desarrollo, Next.js recarga módulos en
 * cada cambio de archivo; sin este patrón se abriría una conexión nueva a la
 * base de datos por cada recarga. Se guarda en `globalThis` para sobrevivir
 * a esos recargados.
 */
const globalParaPrisma = globalThis as unknown as { clientePrisma?: PrismaClient };

export const clientePrisma: PrismaClient =
  globalParaPrisma.clientePrisma ?? new PrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalParaPrisma.clientePrisma = clientePrisma;
}
