"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";

type EstadoCarga =
  | { tipo: "inactivo" }
  | { tipo: "cargando" }
  | { tipo: "exito"; cantidadTransacciones: number }
  | { tipo: "error"; mensaje: string };

/**
 * Botón para subir el Excel. Cada carga ACUMULA transacciones a las que ya
 * había (upsert por ID) — nunca reemplaza el histórico. Por eso el texto de
 * confirmación aclara "se va a sumar", no "se va a reemplazar".
 */
export function CargarExcelBoton() {
  const [estado, setEstado] = useState<EstadoCarga>({ tipo: "inactivo" });
  const referenciaInput = useRef<HTMLInputElement>(null);
  const router = useRouter();

  async function manejarSeleccionDeArchivo(evento: React.ChangeEvent<HTMLInputElement>) {
    const archivo = evento.target.files?.[0];
    if (!archivo) return;

    const confirmado = window.confirm(
      `¿Cargar "${archivo.name}"? Sus transacciones se van a sumar a las que ya están cargadas (no se pierde nada de lo que ya había).`,
    );
    if (!confirmado) {
      evento.target.value = "";
      return;
    }

    setEstado({ tipo: "cargando" });

    const formulario = new FormData();
    formulario.append("archivo", archivo);

    try {
      const respuesta = await fetch("/api/excel/subir", { method: "POST", body: formulario });
      const cuerpo = await respuesta.json();

      if (!respuesta.ok) {
        setEstado({ tipo: "error", mensaje: cuerpo.error ?? "Error desconocido." });
        return;
      }

      setEstado({ tipo: "exito", cantidadTransacciones: cuerpo.cantidadTransaccionesProcesadas });
      router.refresh();
    } catch {
      setEstado({ tipo: "error", mensaje: "No se pudo conectar con el servidor." });
    } finally {
      evento.target.value = "";
    }
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        type="button"
        onClick={() => referenciaInput.current?.click()}
        disabled={estado.tipo === "cargando"}
        className="rounded-full bg-rojo px-6 py-2 text-sm font-semibold text-white transition-colors duration-200 hover:bg-rojoOscuro disabled:opacity-50"
      >
        {estado.tipo === "cargando" ? "Cargando..." : "Cargar Excel"}
      </button>
      <input
        ref={referenciaInput}
        type="file"
        accept=".xlsx"
        onChange={manejarSeleccionDeArchivo}
        className="hidden"
      />
      {estado.tipo === "exito" && (
        <p className="text-xs text-textoSecundario">
          ✓ Se procesaron {estado.cantidadTransacciones} transacciones del archivo.
        </p>
      )}
      {estado.tipo === "error" && (
        <p className="max-w-xs text-right text-xs text-rojo">{estado.mensaje}</p>
      )}
    </div>
  );
}
