import { CargarExcelBoton } from "@/presentacion/componentes/CargarExcelBoton";
import { EstacionTabs } from "@/presentacion/componentes/EstacionTabs";

export default function LayoutDashboard({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto max-w-7xl p-6">
      <header className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold text-texto">Dashboard Cargadores DC</h1>
          <p className="text-sm text-textoSecundario">SEG Ingeniería</p>
        </div>
        <CargarExcelBoton />
      </header>
      <EstacionTabs />
      <main className="mt-6">{children}</main>
    </div>
  );
}
