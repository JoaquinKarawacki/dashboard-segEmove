"use client";

import { useCallback, useEffect, useState } from "react";

const CLAVE_ALMACENAMIENTO = "seg-dias-activos-v1";

/**
 * Override manual de "días activos" por estación (código de cargador → días),
 * para el "Factor de uso diario" del Total histórico. Replica la celda editable
 * del Excel (los días que el cargador estuvo operativo, cargados a mano).
 *
 * Se persiste en el navegador (localStorage): si no hay override para una
 * estación, la tabla usa el valor por defecto que calcula el servidor
 * (`diasConActividad`). No toca el servidor ni afecta a otros usuarios.
 */
export function useDiasActivos() {
  const [overrides, setOverrides] = useState<Record<string, number>>({});

  // Se lee recién en el cliente, tras el montaje, para no romper la hidratación.
  useEffect(() => {
    try {
      const crudo = window.localStorage.getItem(CLAVE_ALMACENAMIENTO);
      if (crudo) setOverrides(JSON.parse(crudo) as Record<string, number>);
    } catch {
      /* localStorage no disponible o JSON inválido: se queda sin overrides. */
    }
  }, []);

  const persistir = useCallback((nuevos: Record<string, number>) => {
    try {
      window.localStorage.setItem(CLAVE_ALMACENAMIENTO, JSON.stringify(nuevos));
    } catch {
      /* Si no se puede persistir, al menos queda aplicado en memoria. */
    }
  }, []);

  /** Fija los días activos de una estación (ignora valores no positivos). */
  const fijar = useCallback(
    (codigoEstacion: string, dias: number) => {
      if (!Number.isFinite(dias) || dias <= 0) return;
      setOverrides((actuales) => {
        const nuevos = { ...actuales, [codigoEstacion]: Math.round(dias) };
        persistir(nuevos);
        return nuevos;
      });
    },
    [persistir],
  );

  /** Vuelve una estación a su valor por defecto (el que calcula el servidor). */
  const restablecer = useCallback(
    (codigoEstacion: string) => {
      setOverrides((actuales) => {
        const nuevos = { ...actuales };
        delete nuevos[codigoEstacion];
        persistir(nuevos);
        return nuevos;
      });
    },
    [persistir],
  );

  return { overrides, fijar, restablecer };
}
