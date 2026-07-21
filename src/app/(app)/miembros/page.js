import { listCategorias } from "@/lib/api/miembros";
import MiembrosList from "@/components/miembros/miembros-list";

export const metadata = {
  title: "Miembros · AcroSystem",
};

export default async function MiembrosPage() {
  const categorias = await listCategorias();
  return <MiembrosList categorias={categorias} />;
}
