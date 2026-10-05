"use client";

import { useEffect, useState } from "react";

/**
 * Reloj en vivo del header (punto rojo + hora), igual que el mockup de
 * referencia. Se monta solo en el cliente: arranca vacío para no romper la
 * hidratación (el server no conoce la hora del navegador) y se actualiza cada
 * segundo.
 */
export function RelojEnVivo() {
  const [hora, setHora] = useState<string>("");

  useEffect(() => {
    const actualizar = () =>
      setHora(new Date().toLocaleTimeString("es-UY", { hour12: false }));
    actualizar();
    const id = setInterval(actualizar, 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="flex items-center gap-2 rounded-sm border border-borde px-3 py-1.5 text-sm tabular-nums text-textoMuted">
      <span className="inline-block h-2 w-2 rounded-full bg-rojo" aria-hidden />
      <span>{hora || "--:--:--"}</span>
    </div>
  );
}
