# Imagen para Railway.
FROM node:24-slim AS build
WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm install

COPY . .
RUN npx prisma generate
RUN npm run build

FROM node:24-slim AS produccion
WORKDIR /app
ENV NODE_ENV=production
# Defensa adicional: aunque el código ya evita mezclar fechas UTC/locales (ver
# RangoFechas.parsearFechaDesdeTextoISO), fijar el timezone del contenedor a
# Uruguay hace que cualquier log o `new Date()` sin parametrizar coincida con
# la hora local del negocio.
ENV TZ=America/Montevideo

COPY --from=build /app ./

EXPOSE 3000
# Aplica las migraciones pendientes contra la base de Railway antes de
# arrancar el servidor. Node/Prisma CLI están disponibles porque se copió
# node_modules completo (ver next.config.ts sobre por qué no usamos "standalone").
CMD ["sh", "-c", "npx prisma migrate deploy && npm run start"]
