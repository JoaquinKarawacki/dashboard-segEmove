import { redirect } from "next/navigation";
import { ESTACIONES } from "@/dominio/entidades/Estacion";

/** La raíz del sitio redirige siempre a la primera estación. */
export default function PaginaInicio(): never {
  redirect(`/dashboard/${ESTACIONES[0]!.slug}`);
}
