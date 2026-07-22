"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { ArrowLeft, Save, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useCreateMiembro } from "@/hooks/use-miembros";

function Field({ label, required, htmlFor, children }) {
  return (
    <div className="flex flex-col gap-2">
      <Label htmlFor={htmlFor} className="text-base text-acro-text">
        {required && <span className="text-acro-accent">*</span>}
        {label}
      </Label>
      {children}
    </div>
  );
}

export default function MiembroForm({ categorias = [] }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const volverATienda = searchParams.get("returnTo") === "tienda";
  const createMiembro = useCreateMiembro();
  const [categoriaId, setCategoriaId] = useState(
    categorias[0] ? String(categorias[0].id) : "",
  );

  async function handleSubmit(event) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const input = {
      nombre: form.get("nombre"),
      cedula: form.get("cedula"),
      fechaNacimiento: form.get("fechaNacimiento"),
      tallaZapato: form.get("tallaZapato"),
      telefono: form.get("telefono"),
      contactoEmergencia: form.get("contactoEmergencia"),
      numAsuncionRiesgos: form.get("numAsuncionRiesgos"),
      categoriaId,
    };

    try {
      const { id } = await createMiembro.mutateAsync(input);
      toast.success("Miembro registrado correctamente.");
      if (volverATienda) {
        const nombre = String(input.nombre ?? "");
        router.push(
          `/tienda?nm=${encodeURIComponent(id)}&nmn=${encodeURIComponent(nombre)}`,
        );
      } else {
        router.push(`/miembros/${id}`);
      }
    } catch (error) {
      toast.error(error.message);
    }
  }

  const inputClass = "h-12 bg-acro-surface";
  const pending = createMiembro.isPending;

  return (
    <section className="mx-auto w-full max-w-2xl pb-24">
      <div className="mb-6 flex items-center gap-3">
        <Link
          href={volverATienda ? "/tienda?restore=1" : "/miembros"}
          aria-label="Volver"
          className="rounded-md p-1 text-acro-text transition-colors hover:bg-white/5"
        >
          <ArrowLeft className="size-6" />
        </Link>
        <h1 className="text-2xl font-bold text-acro-text lg:text-3xl">
          Datos de Miembro
        </h1>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        <Field label="Nombre" required htmlFor="nombre">
          <Input id="nombre" name="nombre" className={inputClass} required />
        </Field>

        <Field label="CI / Pasaporte" required htmlFor="cedula">
          <Input id="cedula" name="cedula" className={inputClass} required />
        </Field>

        <Field label="Fecha de nacimiento" required htmlFor="fechaNacimiento">
          <Input
            id="fechaNacimiento"
            name="fechaNacimiento"
            type="date"
            className={inputClass}
            required
          />
        </Field>

        <Field label="Talla de zapato" htmlFor="tallaZapato">
          <Input id="tallaZapato" name="tallaZapato" className={inputClass} />
        </Field>

        <Field label="Teléfono" htmlFor="telefono">
          <Input id="telefono" name="telefono" className={inputClass} />
        </Field>

        <Field
          label="Contacto de Emergencia"
          required
          htmlFor="contactoEmergencia"
        >
          <Input
            id="contactoEmergencia"
            name="contactoEmergencia"
            className={inputClass}
            required
          />
        </Field>

        <Field label="NDAR" required htmlFor="numAsuncionRiesgos">
          <Input
            id="numAsuncionRiesgos"
            name="numAsuncionRiesgos"
            className={inputClass}
            placeholder="N.º documento de asunción de riesgos"
            required
          />
        </Field>

        <Field label="Categoría" htmlFor="categoria">
          <Select value={categoriaId} onValueChange={setCategoriaId}>
            <SelectTrigger id="categoria" className="h-12 w-full bg-acro-surface">
              <SelectValue placeholder="Selecciona una categoría" />
            </SelectTrigger>
            <SelectContent>
              {categorias.map((c) => (
                <SelectItem key={c.id} value={String(c.id)}>
                  {c.nombre}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>

        <button
          type="submit"
          disabled={pending}
          aria-label="Guardar miembro"
          className="fixed bottom-6 right-6 z-20 flex size-16 items-center justify-center rounded-2xl bg-acro-accent text-acro-dark shadow-lg transition-transform hover:scale-105 disabled:opacity-60"
        >
          {pending ? (
            <Loader2 className="size-8 animate-spin" />
          ) : (
            <Save className="size-8" />
          )}
        </button>
      </form>
    </section>
  );
}
