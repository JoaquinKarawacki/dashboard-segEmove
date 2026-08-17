-- CreateTable
CREATE TABLE "transacciones" (
    "id_transaccion" TEXT NOT NULL,
    "cargador" TEXT NOT NULL,
    "conector" TEXT,
    "tag" TEXT,
    "usuario" TEXT,
    "fecha_inicio" TIMESTAMP(3) NOT NULL,
    "fecha_fin" TIMESTAMP(3),
    "potencia_kw" DOUBLE PRECISION NOT NULL,
    "energia_kwh" DOUBLE PRECISION NOT NULL,
    "compra" DOUBLE PRECISION NOT NULL,
    "fijo" DOUBLE PRECISION NOT NULL,
    "permanencia" DOUBLE PRECISION NOT NULL,
    "venta" DOUBLE PRECISION NOT NULL,
    "descuento" DOUBLE PRECISION NOT NULL,
    "total" DOUBLE PRECISION NOT NULL,
    "duracion_minutos" DOUBLE PRECISION NOT NULL,
    "excluir" BOOLEAN NOT NULL,
    "creado_el" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizado_el" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "transacciones_pkey" PRIMARY KEY ("id_transaccion")
);

-- CreateIndex
CREATE INDEX "transacciones_cargador_idx" ON "transacciones"("cargador");

-- CreateIndex
CREATE INDEX "transacciones_fecha_inicio_idx" ON "transacciones"("fecha_inicio");
