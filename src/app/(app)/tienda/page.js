import {
  listCategoriasProducto,
  listPromos,
} from "@/lib/api/tienda";
import { listMiembros } from "@/lib/api/miembros";
import TiendaWizard from "@/components/tienda/tienda-wizard";

export const metadata = { title: "Tienda · AcroSystem" };

export default async function TiendaPage() {
  const [categorias, promos, miembros] = await Promise.all([
    listCategoriasProducto(),
    listPromos(),
    listMiembros(),
  ]);

  const miembrosLite = miembros.map((m) => ({ id: m.id, nombre: m.nombre }));

  return (
    <TiendaWizard
      categorias={categorias}
      promos={promos}
      miembros={miembrosLite}
    />
  );
}
