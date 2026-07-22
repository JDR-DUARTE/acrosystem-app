import Link from "next/link";
import Image from "next/image";

export const metadata = {
  title: "Recuperar contraseña · AcroSystem",
};

export default function ForgotPasswordPage() {
  return (
    <main className="flex min-h-dvh items-center justify-center bg-acro-dark p-6">
      <div className="w-full max-w-[364px] rounded-xl bg-acro-surface px-4 py-8">
        <div className="flex flex-col items-center">
          <Image
            src="/logo-acro.png"
            alt="Acrofobia"
            width={120}
            height={120}
            className="size-[120px] object-contain"
          />
          <h1 className="mt-2 text-xl font-bold text-acro-accent">
            Recuperar contraseña
          </h1>
        </div>
        <p className="mt-6 text-center text-sm text-acro-muted">
          La recuperación de contraseña estará disponible próximamente.
          Contacta a un administrador para restablecer tu acceso.
        </p>
        <Link
          href="/login"
          className="mt-6 flex h-14 w-full items-center justify-center rounded-xl bg-acro-input text-acro-text transition-colors hover:bg-acro-input/80"
        >
          Volver a iniciar sesión
        </Link>
      </div>
    </main>
  );
}
