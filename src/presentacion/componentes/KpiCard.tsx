interface PropiedadesKpiCard {
  readonly etiqueta: string;
  readonly valor: string;
  /** Texto chico debajo del valor, ej. una unidad o una aclaración. */
  readonly detalle?: string;
  /** Si el valor es negativo/positivo importa (ej. margen), lo marca con semáforo + flecha. */
  readonly resaltarSegunSigno?: boolean;
  readonly valorNumericoParaSigno?: number;
}

/**
 * Semáforo bueno/malo (verde/rojo) + flecha — igual al criterio del
 * dashboard gerencial de referencia de SEG, que sí usa colores de estado
 * para diferenciar valores buenos/malos (no es lo mismo que "diferenciar
 * contenido por color", que la guía de marca reserva para el sitio web).
 */
export function KpiCard({
  etiqueta,
  valor,
  detalle,
  resaltarSegunSigno = false,
  valorNumericoParaSigno = 0,
}: PropiedadesKpiCard) {
  const esNegativo = resaltarSegunSigno && valorNumericoParaSigno < 0;
  const colorDelValor = !resaltarSegunSigno
    ? "text-texto"
    : esNegativo
      ? "text-estadoMalo"
      : "text-estadoBueno";

  return (
    <div className="rounded-lg border border-borde bg-superficie p-4">
      <p className="text-sm text-textoSecundario">{etiqueta}</p>
      <p className={`mt-1 text-2xl font-semibold tabular-nums ${colorDelValor}`}>
        {resaltarSegunSigno && <span aria-hidden>{esNegativo ? "▼ " : "▲ "}</span>}
        {valor}
      </p>
      {detalle && <p className="mt-1 text-xs text-textoMuted">{detalle}</p>}
    </div>
  );
}
