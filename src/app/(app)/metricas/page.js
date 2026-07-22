import { redirect } from "next/navigation";
import ModulePlaceholder from "@/components/layout/module-placeholder";
import { getCurrentEmployee } from "@/lib/auth";

export const metadata = { title: "Métricas · AcroSystem" };

export default async function MetricasPage() {
  const { isAdmin } = await getCurrentEmployee();
  if (!isAdmin) {
    redirect("/dashboard");
  }
  return <ModulePlaceholder title="Métricas / Reportes" />;
}
