import { listPlanes } from "@/lib/api/tienda";
import MiembrosList from "@/components/miembros/miembros-list";

export const metadata = {
  title: "Miembros · AcroSystem",
};

export default async function MiembrosPage() {
  const planes = await listPlanes();
  return <MiembrosList planes={planes} />;
}
