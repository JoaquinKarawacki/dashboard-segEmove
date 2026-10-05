"use client";

import { useCallback, useEffect, useState } from "react";
import {
  construirParametrosPorDefecto,
  ParametrosUteEditables,
} from "./calculoCostoUte";

const CLAVE_ALMACENAMIENTO = "seg-costo-ute-params-v1";

/**
 * Parámetros editables de la hoja "Resultados Costo UTE", persistidos en el
 * navegador (localStorage). Arranca de los valores oficiales (los del dominio),
 * aplica encima lo que el usuario haya guardado y permite restablecer. Nada de
 * esto toca el servidor ni afecta el margen del Dashboard.
 */
export function useParametrosUte() {
  const [parametros, setParametros] = useState<ParametrosUteEditables>(
    construirParametrosPorDefecto,
  );
  const [cargado, setCargado] = useState(false);

  // Se leen los valores guardados recién en el cliente, tras el montaje, para
  // no romper la hidratación (el server renderiza siempre con los por defecto).
  useEffect(() => {
    try {
      const crudo = window.localStorage.getItem(CLAVE_ALMACENAMIENTO);
      if (crudo) {
        const guardados = JSON.parse(crudo) as Partial<ParametrosUteEditables>;
        setParametros((actuales) => combinar(actuales, guardados));
      }
    } catch {
      /* localStorage no disponible o JSON inválido: se queda con los por defecto. */
    }
    setCargado(true);
  }, []);

  const guardar = useCallback((nuevos: ParametrosUteEditables) => {
    setParametros(nuevos);
    try {
      window.localStorage.setItem(CLAVE_ALMACENAMIENTO, JSON.stringify(nuevos));
    } catch {
      /* Si no se puede persistir, al menos queda aplicado en memoria. */
    }
  }, []);

  const restablecer = useCallback(() => {
    const porDefecto = construirParametrosPorDefecto();
    setParametros(porDefecto);
    try {
      window.localStorage.removeItem(CLAVE_ALMACENAMIENTO);
    } catch {
      /* Ignorado. */
    }
  }, []);

  return { parametros, guardar, restablecer, cargado };
}

/**
 * Combina los parámetros por defecto con los guardados, campo por campo: si el
 * guardado agrega o le falta algo (por un cambio de versión), nunca queda
 * `undefined` — siempre gana el valor por defecto como base.
 */
function combinar(
  base: ParametrosUteEditables,
  guardados: Partial<ParametrosUteEditables>,
): ParametrosUteEditables {
  const porEstacion: ParametrosUteEditables["porEstacion"] = {};
  for (const codigo of Object.keys(base.porEstacion)) {
    porEstacion[codigo] = {
      ...base.porEstacion[codigo]!,
      ...(guardados.porEstacion?.[codigo] ?? {}),
      excedentePotencia: {
        ...base.porEstacion[codigo]!.excedentePotencia,
        ...(guardados.porEstacion?.[codigo]?.excedentePotencia ?? {}),
      },
      eficienciaEquipo: {
        ...base.porEstacion[codigo]!.eficienciaEquipo,
        ...(guardados.porEstacion?.[codigo]?.eficienciaEquipo ?? {}),
      },
      reactivaPotencia: {
        ...base.porEstacion[codigo]!.reactivaPotencia,
        ...(guardados.porEstacion?.[codigo]?.reactivaPotencia ?? {}),
      },
    };
  }

  return {
    tarifa: {
      ...base.tarifa,
      ...(guardados.tarifa ?? {}),
      precioEnergia: { ...base.tarifa.precioEnergia, ...(guardados.tarifa?.precioEnergia ?? {}) },
      precioPotencia: { ...base.tarifa.precioPotencia, ...(guardados.tarifa?.precioPotencia ?? {}) },
      bonificacionPotencia: {
        ...base.tarifa.bonificacionPotencia,
        ...(guardados.tarifa?.bonificacionPotencia ?? {}),
      },
    },
    gestion: { ...base.gestion, ...(guardados.gestion ?? {}) },
    porEstacion,
  };
}
