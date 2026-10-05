interface PropiedadesKpiCard {
  readonly etiqueta: string;
  readonly valor: string;
  /** Unidad chica delante del valor (ej. "$", "US$", "kWh", "h"). */
  readonly unidad?: string;
  /** Texto chico debajo del valor, ej. una aclaración o un promedio. */
  readonly detalle?: string;
  /** Pinta el valor con el rojo de marca (ej. kWh vendidos, intentos fallidos). */
  readonly acentoRojo?: boolean;
  /** Si el signo importa (ej. margen): negativo en rojo, positivo/cero en blanco. */
  readonly resaltarSegunSigno?: boolean;
  readonly valorNumericoParaSigno?: number;
  /** Ocupa dos columnas de la grilla (ej. la tarjeta de margen). */
  readonly ancho?: boolean;
}

/**
 * Tarjeta de indicador calcada del mockup de referencia de SEG: fondo oscuro,
 * label en mayúsculas centrado y la cifra en grande (Red Hat Display Black).
 * El rojo de marca es el único acento; un valor negativo (margen, fallas) se
 * pinta en rojo, uno bueno/neutro en blanco (sin verde, según la guía de marca).
 */
export function KpiCard({
  etiqueta,
  valor,
  unidad,
  detalle,
  acentoRojo = false,
  resaltarSegunSigno = false,
  valorNumericoParaSigno = 0,
  ancho = false,
}: PropiedadesKpiCard) {
  const esNegativo = resaltarSegunSigno && valorNumericoParaSigno < 0;
  const color = esNegativo || acentoRojo ? "text-rojo" : "text-white";

  return (
    <div
      className={`flex min-h-[128px] flex-col gap-2.5 rounded-sm border border-borde bg-superficie p-4 ${
        ancho ? "sm:col-span-2" : ""
      }`}
    >
      <p className="text-center text-[13px] font-bold uppercase tracking-[0.1em] text-textoMuted">
        {etiqueta}
      </p>
      <div className="flex flex-1 flex-wrap items-baseline justify-center gap-1.5">
        {unidad && (
          <span className={`text-lg font-medium tabular-nums ${color}`}>{unidad}</span>
        )}
        <span
          className={`font-black tabular-nums leading-none tracking-tight ${color}`}
          style={{ fontSize: "clamp(32px, 2.5vw, 48px)" }}
        >
          {valor}
        </span>
      </div>
      {detalle && <p className="text-center text-xs text-textoMuted">{detalle}</p>}
    </div>
  );
}
