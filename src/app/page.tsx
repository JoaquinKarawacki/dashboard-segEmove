import { redirect } from "next/navigation";

/** La raíz del sitio redirige al dashboard (alcance "Todos" por defecto). */
export default function PaginaInicio(): never {
  redirect("/dashboard");
}
