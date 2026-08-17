# Imagen para Railway: build de Next.js en modo "standalone" (ver next.config.ts).
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

COPY --from=build /app/.next/standalone ./
COPY --from=build /app/.next/static ./.next/static
COPY --from=build /app/prisma ./prisma
COPY --from=build /app/node_modules/.prisma ./node_modules/.prisma

EXPOSE 3000
CMD ["node", "server.js"]
