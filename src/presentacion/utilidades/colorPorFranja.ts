import { FranjaHoraria } from "@/dominio/entidades/FranjaHoraria";

/**
 * Cada franja horaria es una categoría (identidad), no una magnitud. Según la
 * guía de marca de SEG la paleta es rojo + grises (sin azul/verde/ámbar), así
 * que las franjas se distinguen con el rojo de marca (Punta) y dos grises
 * (Llano, Valle). Siempre van acompañadas del nombre de la franja en
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
  [FranjaHoraria.Punta]: "#ca3517",
  [FranjaHoraria.Llano]: "#9ca3af",
  [FranjaHoraria.Valle]: "#6b7280",
};
