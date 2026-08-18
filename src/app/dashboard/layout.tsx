import Image from "next/image";
import { CargarExcelBoton } from "@/presentacion/componentes/CargarExcelBoton";
import { EstacionTabs } from "@/presentacion/componentes/EstacionTabs";

export default function LayoutDashboard({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto max-w-7xl p-6">
      <header className="mb-6 flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <Image
            src="/seg-e-move-logo.jpg"
            alt="SEG e-move"
            width={56}
            height={56}
            className="rounded-md object-contain"
          />
          <div>
            <h1 className="text-xl font-semibold text-texto">Dashboard Cargadores DC</h1>
            <p className="text-sm text-textoSecundario">SEG Ingeniería</p>
          </div>
        </div>
        <CargarExcelBoton />
      </header>
      <EstacionTabs />
      <main className="mt-6">{children}</main>
    </div>
  );
}
