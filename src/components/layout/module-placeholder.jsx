import { Construction } from "lucide-react";

export default function ModulePlaceholder({ title }) {
  return (
    <section className="mx-auto w-full max-w-2xl">
      <h1 className="mb-5 text-center text-2xl font-bold text-acro-text">
        {title}
      </h1>
      <div className="flex flex-col items-center gap-3 rounded-2xl bg-acro-surface p-8 text-center">
        <Construction className="size-10 text-acro-accent" />
        <p className="text-sm text-acro-muted">
          Este módulo estará disponible próximamente.
        </p>
      </div>
    </section>
  );
}
