import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, QrCode } from "lucide-react";
import MemberQr from "@/components/miembros/member-qr";
import { getMiembro } from "@/lib/api/miembros";

export const metadata = {
  title: "Perfil de miembro · AcroSystem",
};

function formatDate(value) {
  if (!value) return "—";
  const [y, m, d] = value.split("-");
  return `${d} / ${m} / ${y}`;
}

export default async function MiembroPerfilPage({ params }) {
  const { id } = await params;
  const miembro = await getMiembro(id);
  if (!miembro) notFound();

  const activo = miembro.estado === "Activo";

  return (
    <section className="mx-auto w-full max-w-3xl pb-24">
      <div className="mb-5 flex items-center gap-3">
        <Link
          href="/miembros"
          aria-label="Volver"
          className="rounded-md p-1 text-acro-text transition-colors hover:bg-white/5"
        >
          <ArrowLeft className="size-6" />
        </Link>
      </div>

      <h1 className="text-3xl font-bold text-acro-text lg:text-4xl">
        {miembro.nombre}
      </h1>
      <p className="mt-1 flex items-center gap-2 text-sm text-acro-muted">
        <span
          className={`inline-block size-2.5 rounded-full ${
            activo ? "bg-acro-accent" : "bg-acro-muted"
          }`}
        />
        {miembro.estado}
      </p>

      <div className="mt-6 grid gap-4 md:grid-cols-2">
        <div className="rounded-2xl bg-acro-surface p-5">
          <h2 className="mb-3 text-lg font-semibold text-acro-text">
            Información
          </h2>
          <dl className="flex flex-col gap-1.5 text-sm text-acro-text">
            <div className="flex gap-2">
              <dt className="text-acro-muted">C.I:</dt>
              <dd>{miembro.cedula || "—"}</dd>
            </div>
            <div className="flex gap-2">
              <dt className="text-acro-muted">Teléfono:</dt>
              <dd>{miembro.telefono || "—"}</dd>
            </div>
            <div className="flex gap-2">
              <dt className="text-acro-muted">Talla Zapatilla:</dt>
              <dd>{miembro.tallaZapato || "—"}</dd>
            </div>
            <div className="flex gap-2">
              <dt className="text-acro-muted">Contacto Emergencia:</dt>
              <dd>{miembro.contactoEmergencia || "—"}</dd>
            </div>
            <div className="flex gap-2">
              <dt className="text-acro-muted">Categoría:</dt>
              <dd>{miembro.categoria?.nombre ?? "—"}</dd>
            </div>
          </dl>
        </div>

        <div className="flex items-center justify-between rounded-2xl bg-acro-surface p-5">
          <h2 className="text-lg font-semibold text-acro-text">Código QR</h2>
          <MemberQr value={miembro.qrCodigo} />
        </div>
      </div>

      <div className="mt-4 rounded-2xl bg-acro-surface p-5">
        <h2 className="mb-2 text-lg font-semibold text-acro-text">
          Plan actual
        </h2>
        {miembro.planActual ? (
          <div className="text-sm text-acro-text">
            <p>Tipo: {miembro.planActual.nombre}</p>
            <p>Fecha de inicio: {formatDate(miembro.planActual.fechaInicio)}</p>
            <p>
              Fecha de fin: {formatDate(miembro.planActual.fechaExpiracion)}
            </p>
            <p>Pases restantes: {miembro.planActual.pasesRestantes}</p>
          </div>
        ) : (
          <p className="text-sm text-acro-muted">
            Sin suscripción activa.
          </p>
        )}
      </div>

      <div className="mt-4 rounded-2xl bg-acro-surface p-5">
        <h2 className="mb-3 text-lg font-semibold text-acro-text">
          Historial de pagos
        </h2>
        <p className="text-sm text-acro-muted">Sin pagos registrados.</p>
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
