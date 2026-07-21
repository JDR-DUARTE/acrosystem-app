"use client";

import { useActionState } from "react";
import Image from "next/image";
import Link from "next/link";
import { User, LockKeyhole, Loader2 } from "lucide-react";
import { login } from "@/app/auth/actions";

export default function LoginForm() {
  const [state, formAction, pending] = useActionState(login, null);

  return (
    <div className="w-full max-w-[364px] rounded-xl bg-acro-surface px-4 py-8 shadow-[inset_0px_4px_4px_0px_rgba(0,0,0,0.25)]">
      <div className="flex flex-col items-center">
        <Image
          src="/logo-acro.png"
          alt="Acrofobia"
          width={150}
          height={150}
          priority
          className="size-[150px] object-contain"
        />
        <h1 className="mt-2 text-2xl font-bold text-acro-accent">AcroSystem</h1>
      </div>

      <form action={formAction} className="mt-8 flex flex-col gap-4">
        <div className="flex flex-col gap-2">
          <label
            htmlFor="email"
            className="text-lg text-acro-placeholder"
          >
            Email Addres
          </label>
          <div className="relative">
            <User className="pointer-events-none absolute left-4 top-1/2 size-6 -translate-y-1/2 text-acro-text" />
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              placeholder="Email"
              className="h-16 w-full rounded-xl bg-acro-input pl-14 pr-4 text-lg text-acro-text placeholder:text-acro-text/80 focus:outline-none focus:ring-2 focus:ring-acro-accent"
            />
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <label
            htmlFor="password"
            className="text-lg text-acro-placeholder"
          >
            Password
          </label>
          <div className="relative">
            <LockKeyhole className="pointer-events-none absolute left-4 top-1/2 size-6 -translate-y-1/2 text-acro-text" />
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
              placeholder="Password"
              className="h-16 w-full rounded-xl bg-acro-input pl-14 pr-4 text-lg text-acro-text placeholder:text-acro-text/80 focus:outline-none focus:ring-2 focus:ring-acro-accent"
            />
          </div>
        </div>

        {state?.error ? (
          <p className="text-sm text-acro-danger" role="alert">
            {state.error}
          </p>
        ) : null}

        <button
          type="submit"
          disabled={pending}
          className="mt-4 flex h-16 w-full items-center justify-center gap-2 rounded-xl bg-acro-input text-lg text-acro-text transition-colors hover:bg-acro-input/80 disabled:opacity-70"
        >
          {pending ? <Loader2 className="size-5 animate-spin" /> : null}
          Ingresar al sistema
        </button>

        <Link
          href="/forgot-password"
          className="text-center text-lg text-acro-muted hover:text-acro-text"
        >
          Olvide mi contraseña
        </Link>
      </form>
    </div>
  );
}
