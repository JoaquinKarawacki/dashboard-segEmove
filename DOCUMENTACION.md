# Dashboard Cargadores DC — SEG Ingeniería

Documentación técnica del proyecto: qué se construyó, por qué, y qué decisiones de diseño se tomaron en el camino. Pensada para que cualquiera del equipo (con o sin experiencia previa en el código) pueda entender el sistema completo.

## Índice

1. [Qué resuelve este proyecto](#qué-resuelve-este-proyecto)
2. [Arquitectura](#arquitectura)
3. [Patrones de diseño aplicados](#patrones-de-diseño-aplicados)
4. [Capa de dominio](#capa-de-dominio)
5. [Capa de aplicación](#capa-de-aplicación)
6. [Capa de infraestructura](#capa-de-infraestructura)
7. [Capa de presentación](#capa-de-presentación)
8. [Modelo de datos y acumulación](#modelo-de-datos-y-acumulación)
9. [Identidad visual](#identidad-visual)
10. [Bugs encontrados y corregidos](#bugs-encontrados-y-corregidos)
11. [Integración futura con Eve-Move](#integración-futura-con-eve-move)
12. [Fuera de alcance (fase 2)](#fuera-de-alcance-fase-2)
13. [Cómo correr el proyecto en local](#cómo-correr-el-proyecto-en-local)
14. [Deploy en Railway](#deploy-en-railway)
15. [Estructura de carpetas](#estructura-de-carpetas)
16. [Convenciones de código](#convenciones-de-código)

---

## Qué resuelve este proyecto

Hasta ahora, el reporting de los 3 cargadores DC de SEG (San Jacinto, Durazno, Cardona) vivía en un único Excel (`Ultimo Dashboards Cargadores DC.xlsx`) con una hoja de datos crudos ("Panel") y una hoja de dashboard por estación, todas calculadas con fórmulas `SUMIFS`/`COUNTIFS`. Cada vez que había transacciones nuevas, había que volver a exportar el Excel, abrirlo y filtrar a mano.

Este proyecto reemplaza eso por un dashboard web:

- Mismos filtros y vistas que el Excel (rango de fechas, franja horaria, selector de estación).
- Botón para cargar el mismo Excel que ya generan — cada carga **acumula** transacciones nuevas a las que ya había (no reemplaza el histórico).
- Cálculo del margen neto por estación, replicando exactamente la fórmula de costo UTE del Excel original.
- Pensado para poder reemplazar la carga manual por una integración automática con la API de Eve-Move más adelante, sin rehacer el resto del sistema (ver [Integración futura con Eve-Move](#integración-futura-con-eve-move)).

## Arquitectura

Es un **monolito organizado en capas**, siguiendo el estilo de **Clean Architecture / Arquitectura Hexagonal**: un único deploy, pero con una separación estricta de responsabilidades donde cada capa solo conoce **interfaces** de la capa que envuelve, nunca implementaciones concretas de afuera.

La idea clave, para no confundirse: **no es una cadena lineal** (dominio → aplicación → infraestructura → presentación). Es más bien círculos concéntricos, donde infraestructura y presentación son **dos lados independientes** que envuelven a la aplicación, no un paso "después" del otro:

```
                    ┌─────────────────────────┐
                    │      presentación        │  ← UI, rutas API (afuera)
                    │  ┌───────────────────┐    │
                    │  │  infraestructura   │    │  ← Postgres, Excel (afuera)
                    │  │  ┌─────────────┐   │    │
                    │  │  │ aplicación  │   │    │
                    │  │  │ ┌─────────┐ │   │    │
                    │  │  │ │ dominio │ │   │    │  ← el núcleo
                    │  │  │ └─────────┘ │   │    │
                    │  │  └─────────────┘   │    │
                    │  └───────────────────┘    │
                    └─────────────────────────┘
```

**Regla de dependencia (no romper esto a futuro):**

- **Dominio** nunca importa nada de las otras capas. No sabe que existe Postgres, Next.js, ni la librería de Excel.
- **Aplicación** solo importa dominio + sus propios puertos (interfaces). Nunca importa Prisma ni `xlsx` directamente.
- **Infraestructura** y **presentación** pueden importar aplicación y dominio, pero **nunca se importan entre sí**.
- **`src/infraestructura/contenedor.ts`** es el único archivo donde todas las capas se conocen entre sí (el "punto de composición"): instancia las implementaciones concretas de infraestructura y se las inyecta a los casos de uso de aplicación.

### Flujo concreto — subir un Excel

1. `CargarExcelBoton.tsx` (presentación) hace `POST /api/excel/subir`.
2. `app/api/excel/subir/route.ts` (presentación, controlador delgado) llama a `contenedor.subirExcelCasoUso.ejecutar(buffer)`.
3. `SubirExcelCasoUso` (aplicación) le pide al puerto `ParseadorExcel` que parsee el archivo → en la práctica corre `ParseadorExcelSheetJS` (infraestructura).
4. Con los datos crudos, llama a `crearTransaccion` (dominio) para calcular mes/año/franja horaria.
5. Le pasa las transacciones al puerto `RepositorioTransacciones` → en la práctica corre `RepositorioTransaccionesPostgres.guardarOActualizar` (infraestructura), que hace el upsert en Postgres.

### Flujo concreto — ver el dashboard de una estación

1. `app/dashboard/[estacion]/page.tsx` (presentación) hace `GET /api/dashboard/san-jacinto?...`.
2. La ruta llama a `contenedor.obtenerDashboardEstacionCasoUso.ejecutar(...)`.
3. El caso de uso le pide al `RepositorioTransacciones` todas las transacciones de esa estación.
4. Corre los servicios de **dominio** (`filtrarTransacciones`, `calcularKpisEstacion`, `calcularDistribucionPorFranja`, `EstrategiaTarifaUTEExcel.calcularMargen`) — matemática pura sobre arrays, sin SQL ni HTTP de por medio.
5. Devuelve un objeto plano que la ruta convierte a JSON y React pinta en tarjetas/tablas/gráficos.

## Patrones de diseño aplicados

Se usaron 3, cada uno resolviendo un problema concreto — sin forzar patrones de más:

| Patrón | Dónde | Por qué |
|---|---|---|
| **Repository** | `RepositorioTransacciones` (puerto) → `RepositorioTransaccionesPostgres` (implementación) | Desacopla el dominio/aplicación de Postgres/Prisma. Permite testear casos de uso con un repositorio en memoria (se usó así para verificar los cálculos contra el Excel real, ver más abajo). |
| **Adapter** | `ParseadorExcel` (puerto) → `ParseadorExcelSheetJS` (implementación) | Aísla la librería externa `xlsx`. Si se conecta la API de Eve-Move más adelante, se escribe otro adaptador que implemente la misma interfaz, sin tocar el resto. |
| **Strategy** | `EstrategiaTarifaUTE` (interfaz) → `EstrategiaTarifaUTEExcel` (implementación) | El cálculo de costo UTE/margen queda intercambiable, porque las tarifas UTE cambian periódicamente. |

## Capa de dominio

`src/dominio/` — entidades y reglas de negocio puras, sin ninguna dependencia externa.

### Entidades (`src/dominio/entidades/`)

- **`Transaccion.ts`**: una fila de la hoja "Panel" del Excel original. `crearTransaccion()` calcula los campos derivados (mes, año, franja horaria) a partir de los campos crudos — antes esto lo hacían fórmulas de Excel.
- **`FranjaHoraria.ts`**: enum `Punta | Llano | Valle` + la regla de negocio `calcularFranjaHoraria(horaInicio)` → Punta 18-22h, Valle antes de las 7h, Llano el resto.
- **`Estacion.ts`**: mapeo entre el código del cargador (`SEG_DC_1`, `SEG_DC_DUR_1`, `SEG_DC_CAR_1`) y el nombre visible (San Jacinto, Durazno, Cardona).
- **`RangoFechas.ts`**: rango de fechas inclusivo. Acá vivían dos bugs reales encontrados durante el desarrollo (ver [Bugs encontrados y corregidos](#bugs-encontrados-y-corregidos)).
- **`ParametrosTarifaUTE.ts`**: constantes de la tarifa UTE, extraídas **literalmente** de la hoja "Resultados Costo UTE" del Excel (no inventadas):

  | Parámetro | Punta | Llano | Valle |
  |---|---|---|---|
  | Precio energía ($/kWh) | 6.824 | 4.583 | 2.554 |
  | Precio potencia ($/kW) | 737.8 | 317.6 | 52.1 |
  | Bonificación de potencia (%) | -80% | -70% | -70% |

  Más: bonificación reactiva de energía -1.8% (solo sobre el monto de energía Punta), bonificación reactiva de potencia -9.28% (sobre el monto de potencia total), comisión de gestión EVE 12%, costo SIM 4G $400/mes, potencia contratada 60kW y cargo fijo UTE $5225/mes por estación (mismo valor hoy en las 3, modelado por estación para poder diferir a futuro).

### Servicios (`src/dominio/servicios/`)

- **`EstrategiaTarifaUTE.ts`**: el cálculo más importante del sistema — el margen neto por estación, calco fórmula por fórmula de la hoja "Resultados Costo UTE". Dos detalles no obvios que se mantuvieron a propósito porque así lo hace el Excel:
  1. El costo de potencia contratada y el cargo fijo UTE se cobran **completos** (mensuales), sin prorratear por los días del rango elegido.
  2. La bonificación reactiva de energía se aplica solo sobre el monto de energía de la franja **Punta**, no sobre el total.
- **`CalculadoraKpis.ts`**: kWh vendidos, ingresos, duración, transacciones exitosas/fallidas, % de fallas, factor de uso, y la distribución por franja horaria — réplica de las tarjetas KPI y la tabla "Distribución por franja horaria" del Excel.
- **`CalculadoraEvolucionMensual.ts`**: agrupa la energía vendida por mes y franja **dinámicamente** (el Excel tenía columnas fijas Junio/Julio/Agosto; como ahora los datos se acumulan mes a mes, no tiene sentido hardcodear meses).
- **`FiltroTransacciones.ts`**: el filtro equivalente a los criterios de los `SUMIFS`/`COUNTIFS` del Excel (estación + rango de fechas + franja horaria opcional).

## Capa de aplicación

`src/aplicacion/` — orquesta al dominio, sin saber cómo se persisten los datos ni cómo se parsea el Excel.

- **Puertos** (`src/aplicacion/puertos/`): `RepositorioTransacciones` y `ParseadorExcel` — interfaces puras, sin implementación.
- **Casos de uso** (`src/aplicacion/casosDeUso/`):
  - `SubirExcelCasoUso`: parsea el archivo y hace upsert de las transacciones.
  - `ObtenerDashboardEstacionCasoUso`: el caso de uso principal — combina KPIs, distribución por franja, evolución mensual y margen para una estación.
  - `ObtenerResumenGeneralCasoUso`: comparación entre las 3 estaciones (réplica de la hoja "Franjas Horarias" del Excel).
  - `ObtenerRangoDeFechasDisponibleCasoUso`: la fecha mínima/máxima entre todas las transacciones cargadas, para inicializar el filtro del front con el rango completo disponible.

## Capa de infraestructura

`src/infraestructura/` — el "cómo" concreto detrás de los puertos.

- **`persistencia/clientePrisma.ts`**: singleton del cliente de Prisma (evita abrir una conexión nueva por cada recarga en desarrollo).
- **`persistencia/RepositorioTransaccionesPostgres.ts`**: implementa `RepositorioTransacciones` con Prisma/PostgreSQL. El método `guardarOActualizar` hace un **upsert** por `idTransaccion` dentro de una transacción de base de datos.
- **`excel/ParseadorExcelSheetJS.ts`**: implementa `ParseadorExcel` con la librería `xlsx` (SheetJS). Lee la hoja "Panel", valida las columnas esperadas, y convierte cada fila a los datos crudos que entiende el dominio.
- **`contenedor.ts`**: el punto de composición (ver [Arquitectura](#arquitectura)).

### Base de datos

Una sola tabla, `transacciones` (esquema en `prisma/schema.prisma`), con clave única `idTransaccion` (la columna "Transacción" del Excel). No hay tablas de usuarios ni de sesión — no hay login.

## Capa de presentación

Dos ubicaciones por una restricción de Next.js (el router `app/` tiene que estar en `src/app/`, no se puede mover):

- **`src/app/`**: rutas de Next.js — páginas (`dashboard/[estacion]/page.tsx`, `dashboard/resumen/page.tsx`) y rutas API (`api/excel/subir`, `api/dashboard/[estacion]`, `api/resumen-general`, `api/rango-fechas`), todas controladores delgados que solo llaman a un caso de uso.
- **`src/presentacion/componentes/`**: componentes de React reutilizables — `EstacionTabs` (selector de dashboard), `FiltroFechaFranja`, `KpiCard`, `TablaDistribucionFranja`, `GraficoDistribucionFranja`, `GraficoEvolucionMensual`, `CargarExcelBoton`.
- **`src/presentacion/utilidades/`**: formateo de números/fechas/moneda (`formato.ts`) y el mapeo de colores por franja horaria (`colorPorFranja.ts`).

## Modelo de datos y acumulación

**Decisión clave**: cada Excel subido se integra a lo ya cargado (**upsert por `idTransaccion`**), nunca lo reemplaza. Se sube probablemente a diario.

¿Por qué esto no genera duplicados si el Excel de hoy incluye transacciones que ya se habían subido ayer? Porque el upsert pregunta, para cada fila, "¿ya existe una transacción con este ID?" — si existe, la **actualiza** (pisa sus propios valores, no se duplica); si es nueva, la **inserta**. Esto depende de un supuesto: que el número de "Transacción"/ID sea estable entre exportaciones sucesivas del mismo dato en el manager de Eve-Move. Si ese ID cambiara entre exportaciones, habría que buscar otra clave única (por ejemplo, Cargador + Fecha inicio + Conector).

## Identidad visual

El diseño pasó por varias iteraciones reales, vale la pena documentarlas:

1. **Primera versión**: paleta neutra genérica (siguiendo la skill de diseño de datos de Claude), sin datos de marca todavía.
2. **Guía de estilos de SEG** (la del sitio web institucional): rojo `#ca3517` + neutros, tipografía Red Hat Display, y la regla explícita "no usar colores temáticos para diferenciar contenido, solo rojo + neutros, diferenciar por ícono no por color". Se aplicó tal cual, incluyendo las 3 franjas horarias con 3 tonos de rojo.
3. **Corrección real del usuario**: "no se aprecia" — 3 tonos de rojo son muy parecidos entre sí para un gráfico, y el modo oscuro (fondo casi negro) resultaba ilegible. El usuario señaló el dashboard gerencial de referencia de SEG (`generador-dashboard-gerencial/cmi-seg-dashboard-standalone.html`), que muestra el patrón real que usa la empresa en sus herramientas internas: fondo claro, tarjetas blancas, tipografía y rojo como acento de marca (pestañas activas, botones), pero **colores bien distinguibles en los gráficos** (azul/ámbar/teal) y un semáforo de estado (verde/rojo) para valores buenos/malos.

**Resultado final** (`src/app/globals.css`):
- Fondo claro (`#f8fafc`), tarjetas blancas, sin modo oscuro.
- Rojo de marca (`#ca3517` y sus variantes) reservado para acentos de interfaz: pestaña activa, botón "Cargar Excel", mensajes de error.
- Las 3 franjas horarias usan colores categóricos distinguibles (azul `#2563eb` / ámbar `#d97706` / teal `#0891b2`), no tonos de un mismo color.
- El margen neto usa semáforo verde/rojo + flecha (▲/▼), como en el dashboard gerencial de referencia — es un valor de **estado** (bueno/malo), no "contenido a diferenciar", así que no aplica la regla de "solo rojo" del sitio web.
- Tipografía Red Hat Display vía `next/font/google`.
- El logo de SEG se usa como favicon (`src/app/icon.png`, convención de Next.js App Router) y queda disponible en `public/seg-ingenieria-logo.png` para uso futuro en la UI.

**Lección general**: la guía de marca de un sitio web institucional no siempre aplica 1:1 a un dashboard de datos — para eso, la referencia más útil fue una herramienta interna real y ya validada por la empresa, no una guía pensada para páginas de marketing.

## Bugs encontrados y corregidos

Documentados porque son buenos ejemplos de errores sutiles que solo aparecen comparando contra datos reales, no por lectura de código:

1. **Comparación de fechas con hora incluida** (`RangoFechas.fechaEstaDentroDelRango`): comparar la fecha-hora completa de una transacción contra el límite "hasta" a medianoche excluía todas las transacciones de la tarde/noche del último día del rango. El Excel compara solo la parte de fecha (su columna "Fecha", truncada) — se corrigió truncando ambos lados a año/mes/día antes de comparar.
2. **Mezcla de fechas UTC y locales** (`RangoFechas.parsearFechaDesdeTextoISO`): `new Date("2026-08-14")` (formato fecha-sola) se interpreta como medianoche **UTC** en JavaScript, mientras que las transacciones se parsean como hora **local** del servidor. Si el servidor no corre en UTC, el rango se corre un día. Se corrigió parseando los parámetros de fecha de la URL con los mismos componentes año/mes/día explícitos, sin pasar por el parseo ambiguo de string.
3. **Encabezados del Excel con espacios finales** (`ParseadorExcelSheetJS`): columnas como `"Compra ($) "` (con espacio al final) no coincidían con el nombre esperado `"Compra ($)"`.
4. **SheetJS omite columnas con la primera celda vacía**: si la primera fila de datos tenía la columna "Usuario" vacía, la librería `xlsx` no incluía esa clave en el objeto resultante — parecía que la columna "no existía". Se corrigió leyendo la hoja como matriz (`header: 1`) y mapeando por posición según los encabezados reales, en vez de dejar que SheetJS arme los objetos.
5. **Tailwind no escaneaba la carpeta de ruta dinámica `[estacion]`**: con `content` separado en dos entradas del array (`./src/app/**` y `./src/presentacion/**`), las clases usadas en `src/app/dashboard/[estacion]/page.tsx` no se generaban (ninguna clase `grid-*` aparecía en el CSS compilado). Se corrigió unificando en un solo patrón `./src/**/*.{ts,tsx}`.

Todos verificados comparando los KPIs calculados por la app contra los valores reales de la hoja "Resultados Costo UTE" del Excel (mismo rango de fechas, misma franja) — coinciden exactos.

## Integración futura con Eve-Move

Se investigó la opción de reemplazar la carga manual del Excel por una conexión directa con `manager.eve-move.com`. Inspeccionando el Network tab del navegador (con la sesión del usuario logueada) se confirmó que existe una **API REST real**:

- Endpoint: `GET https://back-app.eve-move.com/eve/api/ui/transactions` (filtra por fecha, estación, red, cargador, conector, tag, y pagina con `limit`).
- Autenticación: JWT de **Auth0** (`login.eve-move.com`), con permisos granulares ya definidos por scope (`view:transaction`, `view:dashboard:transaction`, etc.) y soporte de `offline_access` (refresh token).

No es una API pública documentada, pero el diseño (Auth0 + scopes) indica que la plataforma está pensada para dar acceso programático. El token de sesión personal dura 24hs y no debe usarse en ningún script permanente.

**Próximo paso (no técnico)**: pedirle a soporte de Eve-Move credenciales **M2M (machine-to-machine)** de Auth0 con el permiso `view:transaction`. Si se consigue, se agrega un nuevo adaptador en `src/infraestructura/` que implemente `ParseadorExcel` (o un puerto nuevo equivalente) sin tocar dominio, aplicación, ni el resto de infraestructura — es exactamente el problema que resuelve el patrón Adapter.

## Fuera de alcance (fase 2)

- **Simulador "Escenario 60kW"**: la hoja del Excel que simula el impacto de subir la potencia contratada a 60kW. No estaba en el pedido original.
- **Tarifas UTE editables desde una pantalla de configuración**: hoy son constantes documentadas en `ParametrosTarifaUTE.ts`. Cuando UTE actualice el pliego tarifario, se edita ese archivo a mano.
- **Integración con la API de Eve-Move** (ver arriba).
- **Autenticación**: por decisión explícita, el dashboard no tiene login — accesible por link privado.

## Cómo correr el proyecto en local

Requiere Node 24+, Docker (para Postgres local) y las dependencias instaladas (`npm install`).

```bash
# 1. Levantar un Postgres local
docker run -d --name dashboard-segemove-db \
  -e POSTGRES_PASSWORD=devpassword -e POSTGRES_DB=dashboard_segemove \
  -p 55432:5432 postgres:16-alpine

# 2. Configurar la conexión (crear .env en la raíz)
echo 'DATABASE_URL="postgresql://postgres:devpassword@localhost:55432/dashboard_segemove"' > .env

# 3. Aplicar el esquema de base de datos
npx prisma migrate dev

# 4. Arrancar el servidor de desarrollo
npm run dev
```

Abrir `http://localhost:3000` — redirige a `/dashboard/san-jacinto`. Usar el botón "Cargar Excel" para subir `Ultimo Dashboards Cargadores DC.xlsx` y ver datos reales.

## Deploy en Railway

El proyecto está desplegado en Railway (`dashboard-segemove`), con dos servicios:

- **`Postgres`**: base de datos, provisionada como plugin nativo de Railway.
- **`dashboard-segemove`**: la app, construida con el `Dockerfile` de la raíz. Corre `npx prisma migrate deploy` antes de arrancar el servidor (`npm run start`), para aplicar cualquier migración pendiente contra la base de producción.

Variables de entorno del servicio de la app: `DATABASE_URL` (referencia a `${{Postgres.DATABASE_URL}}`, se resuelve automáticamente dentro de la red privada de Railway).

**URL de producción**: `https://dashboard-segemove-production.up.railway.app`

**Pendiente**: el redeploy automático al hacer `git push` requiere autorizar la integración de Railway con el repo de GitHub desde el dashboard web de Railway (Settings → GitHub del servicio) — es un paso de permisos que no se puede completar por CLI. Hasta hacerlo, los deploys nuevos se suben manualmente con `railway up` desde la carpeta del proyecto.

## Estructura de carpetas

```
src/
  dominio/
    entidades/       Transaccion, Estacion, FranjaHoraria, RangoFechas, ParametrosTarifaUTE
    servicios/       EstrategiaTarifaUTE, CalculadoraKpis, CalculadoraEvolucionMensual, FiltroTransacciones
  aplicacion/
    puertos/         RepositorioTransacciones, ParseadorExcel (interfaces)
    casosDeUso/       SubirExcelCasoUso, ObtenerDashboardEstacionCasoUso, ObtenerResumenGeneralCasoUso, ObtenerRangoDeFechasDisponibleCasoUso
  infraestructura/
    persistencia/    clientePrisma, RepositorioTransaccionesPostgres
    excel/           ParseadorExcelSheetJS
    contenedor.ts    punto de composición
  app/               rutas de Next.js (páginas + API) — obligatorio en esta ubicación
  presentacion/
    componentes/     componentes de React reutilizables
    utilidades/      formato, colores por franja
prisma/
  schema.prisma      esquema de la base de datos
  migrations/        historial de migraciones
public/              assets estáticos (logo)
Dockerfile           imagen para Railway
```

## Convenciones de código

- **Todo en español**: clases, funciones, variables, comentarios (mínimos, solo para el "por qué" cuando no es obvio).
- **Clean code**: funciones cortas de una sola responsabilidad, nombres descriptivos, sin duplicación, sin abstracciones fuera de los 3 patrones documentados arriba.
- **Regla de dependencia entre capas**: ver [Arquitectura](#arquitectura). No agregar imports que la rompan.
- **No reemplazar el histórico**: cualquier flujo de carga de datos nuevo debe ser upsert/acumulativo, nunca "borrar todo y volver a cargar".
