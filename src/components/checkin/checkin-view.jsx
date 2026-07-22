"use client";

import { useState, useCallback } from "react";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import {
  Search,
  ScanLine,
  CheckCircle2,
  XCircle,
  UserX,
  Loader2,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { useCheckin } from "@/hooks/use-checkin";

const QrScanner = dynamic(() => import("@/components/checkin/qr-scanner"), {
  ssr: false,
});

function ResultCard({ result, onGoToMember }) {
  const map = {
    permitido: {
      icon: CheckCircle2,
      color: "text-acro-accent",
      border: "border-acro-accent/40",
    },
    denegado: {
      icon: XCircle,
      color: "text-acro-danger",
      border: "border-acro-danger/40",
    },
    no_encontrado: {
      icon: UserX,
      color: "text-acro-muted",
      border: "border-border",
    },
  };
  const cfg = map[result.resultado] ?? map.no_encontrado;
  const Icon = cfg.icon;

  return (
    <div
      className={`mt-6 rounded-2xl border bg-acro-surface p-5 ${cfg.border}`}
    >
      <div className="flex items-center gap-3">
        <Icon className={`size-8 ${cfg.color}`} />
        <p className={`text-lg font-semibold ${cfg.color}`}>
          {result.resultado === "permitido"
            ? "Acceso permitido"
            : result.resultado === "denegado"
              ? "Acceso denegado"
              : "No encontrado"}
        </p>
      </div>

      {result.miembro && (
        <button
          type="button"
          onClick={() => onGoToMember(result.miembro.id)}
          className="mt-3 block text-left"
        >
          <p className="text-xl font-bold text-acro-text underline-offset-4 hover:underline">
            {result.miembro.nombre}
          </p>
          <p className="text-sm text-acro-muted">
            C.I: {result.miembro.cedula || "—"}
            {result.miembro.categoria ? ` · ${result.miembro.categoria}` : ""}
          </p>
        </button>
      )}

      <p className="mt-3 text-sm text-acro-text">{result.mensaje}</p>

      {result.resultado === "permitido" && result.usaPases && (
        <p className="mt-1 text-sm text-acro-muted">
          Pases restantes: <span className="text-acro-text">{result.pasesRestantes}</span>
        </p>
      )}
      {result.plan && (
        <p className="mt-1 text-sm text-acro-muted">Plan: {result.plan}</p>
      )}
    </div>
  );
}

export default function CheckinView() {
  const router = useRouter();
  const [cedula, setCedula] = useState("");
  const [scanning, setScanning] = useState(false);
  const [scanError, setScanError] = useState(null);
  const checkin = useCheckin();
  const [result, setResult] = useState(null);

  const submit = useCallback(
    async (query) => {
      const term = String(query ?? "").trim();
      if (!term) return;
      try {
        const res = await checkin.mutateAsync(term);
        setResult(res);
      } catch (err) {
        setResult({ resultado: "no_encontrado", mensaje: err.message });
      }
    },
    [checkin],
  );

  const handleScan = useCallback(
    (text) => {
      setScanning(false);
      submit(text);
    },
    [submit],
  );

  const handleScanError = useCallback((msg) => {
    setScanError(msg);
    setScanning(false);
  }, []);

  return (
    <section className="mx-auto w-full max-w-xl pb-24 text-center">
      <h1 className="text-3xl font-bold text-acro-text lg:text-4xl">
        Control de Acceso
      </h1>
      <p className="mt-2 text-acro-muted">
        Escanea el código QR o ingresa la cédula del miembro
      </p>

      <div className="mt-6 rounded-2xl bg-acro-surface p-4">
        {scanning ? (
          <>
            <QrScanner onScan={handleScan} onError={handleScanError} />
            <button
              type="button"
              onClick={() => setScanning(false)}
              className="mt-3 text-sm text-acro-muted hover:text-acro-text"
            >
              Cancelar
            </button>
          </>
        ) : (
          <button
            type="button"
            onClick={() => {
              setScanError(null);
              setScanning(true);
            }}
            className="flex aspect-square w-full flex-col items-center justify-center gap-4 rounded-xl border-2 border-dashed border-border text-acro-muted transition-colors hover:border-acro-accent hover:text-acro-text"
          >
            <ScanLine className="size-16" />
            <span className="text-lg">Toca para escanear</span>
          </button>
        )}
        {scanError && (
          <p className="mt-3 text-sm text-acro-danger">{scanError}</p>
        )}
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          submit(cedula);
        }}
        className="mt-5 flex flex-col gap-3"
      >
        <div className="relative">
          <Search className="absolute left-3 top-1/2 size-5 -translate-y-1/2 text-acro-muted" />
          <Input
            value={cedula}
            onChange={(e) => setCedula(e.target.value)}
            placeholder="Ingresar cédula"
            className="h-14 bg-acro-surface pl-11 text-center text-lg"
          />
        </div>
        <button
          type="submit"
          disabled={checkin.isPending}
          className="flex h-14 items-center justify-center gap-2 rounded-xl bg-acro-accent text-lg font-semibold text-acro-dark transition-transform hover:scale-[1.01] disabled:opacity-60"
        >
          {checkin.isPending ? (
            <Loader2 className="size-6 animate-spin" />
          ) : (
            "Buscar"
          )}
        </button>
      </form>

      {result && (
        <ResultCard
          result={result}
          onGoToMember={(id) => router.push(`/miembros/${id}`)}
        />
      )}
    </section>
  );
}
