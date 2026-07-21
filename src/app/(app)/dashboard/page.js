import Link from "next/link";
import {
  Activity,
  Home,
  Users,
  Send,
  CalendarDays,
  QrCode,
} from "lucide-react";
import StatCard from "@/components/dashboard/stat-card";

export const metadata = {
  title: "Dashboard · AcroSystem",
};

const STATS = [
  { label: "Ingresos Hoy", value: 0, icon: Activity },
  { label: "Miembros Activos", value: 0, icon: Home },
  { label: "Total Registrados", value: 0, icon: Users },
  { label: "Record Semanal", value: 0, icon: Send },
];

export default function DashboardPage() {
  return (
    <section className="mx-auto w-full max-w-2xl pb-24">
      <h1 className="mb-5 text-center text-2xl font-bold text-acro-text">
        Dashboard
      </h1>

      <div className="grid grid-cols-2 gap-4">
        {STATS.map((stat) => (
          <StatCard key={stat.label} {...stat} />
        ))}
      </div>

      <div className="mt-6">
        <div className="mb-3 flex items-center gap-2">
          <CalendarDays className="size-5 text-acro-text" />
          <h2 className="text-base font-medium text-acro-text">
            Horario Infantil
          </h2>
        </div>

        <div className="rounded-2xl bg-acro-surface p-4">
          <p className="text-center text-sm text-acro-muted">
            No hay miembros agendados todavía.
          </p>
        </div>
      </div>

      <Link
        href="/check-in"
        aria-label="Ir a control de acceso"
        className="fixed bottom-6 right-6 z-20 flex size-16 items-center justify-center rounded-2xl bg-acro-accent text-acro-dark shadow-lg transition-transform hover:scale-105"
      >
        <QrCode className="size-8" />
      </Link>
    </section>
  );
}
