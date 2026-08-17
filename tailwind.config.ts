import type { Config } from "tailwindcss";

// Los valores reales viven en `src/app/globals.css` como variables CSS. Acá
// solo se les pone nombre semántico para usarlas como clases de Tailwind
// (ej. `bg-superficie`, `text-rojo`). Paleta clara inspirada en el dashboard
// gerencial de referencia de SEG: rojo de marca como acento de interfaz,
// colores distinguibles en los gráficos, semáforo bueno/alerta/malo.
const configuracion: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        pagina: "var(--color-pagina)",
        superficie: "var(--color-superficie)",
        borde: "var(--color-borde)",
        texto: "var(--color-texto)",
        textoSecundario: "var(--color-texto-secundario)",
        textoMuted: "var(--color-texto-muted)",
        grilla: "var(--color-grilla)",
        rojo: "var(--color-rojo)",
        rojoOscuro: "var(--color-rojo-oscuro)",
        rojoProfundo: "var(--color-rojo-profundo)",
        estadoBueno: "var(--color-estado-bueno)",
        estadoAlerta: "var(--color-estado-alerta)",
        estadoMalo: "var(--color-estado-malo)",
        // Paleta categórica para gráficos con varias series (ej. las 3
        // franjas horarias) — hues distinguibles, orden fijo, no se ciclan.
        serie1: "var(--serie-1)",
        serie2: "var(--serie-2)",
        serie3: "var(--serie-3)",
      },
      fontFamily: {
        sans: ["var(--font-red-hat)", "Arial", "sans-serif"],
      },
    },
  },
  plugins: [],
};

export default configuracion;
