import { Suspense } from "react";
import { listCategorias } from "@/lib/api/miembros";
import MiembroForm from "@/components/miembros/miembro-form";

export const metadata = {
  title: "Registrar miembro · AcroSystem",
};

export default async function NuevoMiembroPage() {
  const categorias = await listCategorias();
  return (
    <Suspense>
      <MiembroForm categorias={categorias} />
    </Suspense>
  );
}
