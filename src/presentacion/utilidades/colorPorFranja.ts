import { FranjaHoraria } from "@/dominio/entidades/FranjaHoraria";

/**
 * Cada franja horaria es una categoría (identidad), no una magnitud — usa 3
 * hues bien distinguibles entre sí (igual que el dashboard gerencial de
 * referencia de SEG), no tonos de un mismo color, para que se aprecien en
 * los gráficos. Siempre van acompañadas del nombre de la franja en
 * texto/leyenda, nunca se diferencian solo por color.
 */
export const COLOR_CSS_POR_FRANJA: Readonly<Record<FranjaHoraria, string>> = {
  [FranjaHoraria.Punta]: "var(--serie-1)",
  [FranjaHoraria.Llano]: "var(--serie-2)",
  [FranjaHoraria.Valle]: "var(--serie-3)",
};

/**
 * Mismos colores en hex plano, para usar en `recharts` (dibuja en SVG propio
 * y no siempre resuelve `var(--serie-N)` de forma consistente entre
 * navegadores) — mantener sincronizado a mano con `globals.css`.
 */
export const COLOR_HEX_POR_FRANJA: Readonly<Record<FranjaHoraria, string>> = {
  [FranjaHoraria.Punta]: "#2563eb",
  [FranjaHoraria.Llano]: "#d97706",
  [FranjaHoraria.Valle]: "#0891b2",
};
