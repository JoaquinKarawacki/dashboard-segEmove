import type { Config } from "tailwindcss";

// Los valores reales viven en `src/app/globals.css` como variables CSS. Acá
// solo se les pone nombre semántico para usarlas como clases de Tailwind
// (ej. `bg-superficie`, `text-rojo`). Tema oscuro calcado del mockup de
// referencia de SEG: fondo negro, rojo de marca como único acento y grises
// para las series de los gráficos (sin azul/verde/ámbar, según la guía de marca).
const configuracion: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        pagina: "var(--color-pagina)",
        superficie: "var(--color-superficie)",
        superficieInput: "var(--color-superficie-input)",
        borde: "var(--color-borde)",
        bordeFuerte: "var(--color-borde-fuerte)",
        divisorTabla: "var(--color-divisor-tabla)",
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
