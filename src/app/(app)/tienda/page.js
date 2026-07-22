import {
  listCategoriasProducto,
  listPromos,
  listPlanes,
} from "@/lib/api/tienda";
import TiendaWizard from "@/components/tienda/tienda-wizard";

export const metadata = { title: "Tienda · AcroSystem" };

export default async function TiendaPage() {
  const [categorias, promos, planes] = await Promise.all([
    listCategoriasProducto(),
    listPromos(),
    listPlanes(),
  ]);

  return (
    <TiendaWizard categorias={categorias} promos={promos} planes={planes} />
  );
}
