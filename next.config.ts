import type { NextConfig } from "next";

// Railway despliega esta app como un contenedor Node persistente (no serverless),
// "standalone" genera un bundle mínimo con solo lo necesario para correr `node server.js`.
const configuracion: NextConfig = {
  output: "standalone",
};

export default configuracion;
