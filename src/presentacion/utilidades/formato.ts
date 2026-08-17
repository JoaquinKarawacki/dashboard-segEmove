const FORMATO_MONEDA_UYU = new Intl.NumberFormat("es-UY", {
  style: "currency",
  currency: "UYU",
  maximumFractionDigits: 0,
});

const FORMATO_MONEDA_USD = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});

const FORMATO_NUMERO = new Intl.NumberFormat("es-UY", { maximumFractionDigits: 1 });
const FORMATO_PORCENTAJE = new Intl.NumberFormat("es-UY", {
  style: "percent",
  maximumFractionDigits: 1,
});

export function formatearUyu(valor: number): string {
  return FORMATO_MONEDA_UYU.format(valor);
}

export function formatearUsd(valor: number): string {
  return FORMATO_MONEDA_USD.format(valor);
}

export function formatearNumero(valor: number): string {
  return FORMATO_NUMERO.format(valor);
}

export function formatearPorcentaje(valor: number): string {
  return FORMATO_PORCENTAJE.format(valor);
}

export function formatearFechaParaInput(fecha: Date): string {
  return fecha.toISOString().slice(0, 10);
}

const NOMBRES_DE_MES = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
];

export function nombreDelMes(mes: number): string {
  return NOMBRES_DE_MES[mes - 1] ?? String(mes);
}
