// Carga inicial ("seed") del dashboard a partir del Excel actual, para que la
// base arranque IDÉNTICA al Excel y desde ahí se siga actualizando siempre.
//
// No tiene lógica propia: sube el archivo al mismo endpoint que usa el botón
// "Cargar Excel" (POST /api/excel/subir → parsea la hoja "Panel" + upsert por
// idTransacción). Como el upsert es idempotente, correrlo más de una vez es
// seguro: no duplica transacciones.
//
// Uso:
//   node scripts/cargar-excel-inicial.mjs [ruta-del-excel] [url-base]
//
// Ejemplos:
//   # contra el server local (npm run dev corriendo en otra terminal)
//   node scripts/cargar-excel-inicial.mjs
//
//   # contra producción (Railway)
//   node scripts/cargar-excel-inicial.mjs "DASHBOARD_CARGADORES_hasta_30-9-2026.xlsx" https://dashboard-segemove-production.up.railway.app
//
// La url base también se puede pasar por la variable de entorno SEED_URL.

import { readFile } from "node:fs/promises";
import { basename, resolve } from "node:path";

const RUTA_EXCEL_POR_DEFECTO = "DASHBOARD_CARGADORES_hasta_30-9-2026.xlsx";
const URL_BASE_POR_DEFECTO = "http://localhost:3000";

async function main() {
  const rutaExcel = resolve(process.argv[2] ?? RUTA_EXCEL_POR_DEFECTO);
  const urlBase = (process.argv[3] ?? process.env.SEED_URL ?? URL_BASE_POR_DEFECTO).replace(/\/+$/, "");
  const endpoint = `${urlBase}/api/excel/subir`;

  console.log(`→ Excel:    ${rutaExcel}`);
  console.log(`→ Endpoint: ${endpoint}`);

  const contenido = await readFile(rutaExcel);

  const formulario = new FormData();
  formulario.append(
    "archivo",
    new File([contenido], basename(rutaExcel), {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    }),
  );

  const respuesta = await fetch(endpoint, { method: "POST", body: formulario });
  const cuerpo = await respuesta.json().catch(() => ({}));

  if (!respuesta.ok) {
    console.error(`✗ Falló (HTTP ${respuesta.status}): ${cuerpo.error ?? "error desconocido"}`);
    process.exit(1);
  }

  console.log(`✓ Carga inicial completa: ${cuerpo.cantidadTransaccionesProcesadas} transacciones procesadas.`);
  console.log("  (El upsert es idempotente: volver a correrlo no duplica datos.)");
}

main().catch((error) => {
  console.error(`✗ Error inesperado: ${error.message}`);
  console.error("  Verificá que el server esté corriendo (npm run dev) o que la url base sea correcta.");
  process.exit(1);
});
