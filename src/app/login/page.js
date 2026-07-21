import LoginForm from "./login-form";

export const metadata = {
  title: "Iniciar sesión · AcroSystem",
};

export default function LoginPage() {
  return (
    <main className="flex min-h-dvh items-center justify-center bg-acro-dark p-6">
      <LoginForm />
    </main>
  );
}
