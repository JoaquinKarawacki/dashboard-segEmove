interface PropiedadesEncabezadoSeccion {
  readonly titulo: string;
  /** Texto aclaratorio en gris, al lado del título (ej. el rango o un subtítulo). */
  readonly subtitulo?: string;
}

/**
 * Encabezado de sección con el patrón de marca de SEG: título en blanco y una
 * línea roja corta debajo (el "underline de marca"). Es el mismo patrón que
 * repite el mockup de referencia en cada sección.
 */
export function EncabezadoSeccion({ titulo, subtitulo }: PropiedadesEncabezadoSeccion) {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap items-baseline gap-3">
        <h3 className="text-xl font-bold text-white">{titulo}</h3>
        {subtitulo && (
          <span className="text-sm font-normal tabular-nums text-textoMuted">{subtitulo}</span>
        )}
      </div>
      <span className="h-[3px] w-7 bg-rojo" aria-hidden />
    </div>
  );
}
