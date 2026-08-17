import type { NextConfig } from "next";

// Sin "standalone": el Dockerfile corre `prisma migrate deploy` antes de
// arrancar, y para eso necesita el CLI de Prisma disponible en la imagen —
// más simple copiar node_modules completo que reconciliar eso con el bundle
// recortado de "standalone".
const configuracion: NextConfig = {};

export default configuracion;
