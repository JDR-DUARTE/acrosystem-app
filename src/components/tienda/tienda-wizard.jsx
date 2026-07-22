"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import {
  ArrowLeft,
  ArrowRight,
  Search,
  ShoppingCart,
  Minus,
  Plus,
  CheckCircle2,
  Loader2,
  Handshake,
  Ticket,
  UserPlus,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { useProductos, useCrearVenta } from "@/hooks/use-tienda";
import MemberCombobox from "@/components/tienda/member-combobox";

const MONEDAS = ["COP", "VES", "USD", "EUR", "USDT"];
const FORMAS_PAGO = ["Efectivo", "Transferencia", "Pago móvil", "Tarjeta", "Zelle"];
const CATEGORIAS_PRECIO = ["Regular", "Miembro", "Empleado"];
const DIAS_SEMANA = [
  "Lunes",
  "Martes",
  "Miércoles",
  "Jueves",
  "Viernes",
  "Sábado",
];
const STEPS = ["Tienda", "Detalle de venta", "Datos y pago"];
const PLANES_KEY = "planes";
const DRAFT_KEY = "tienda-draft";

function money(n) {
  return `$${Number(n || 0).toFixed(2)}`;
}

function Stepper({ value, onDecrement, onIncrement }) {
  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={onDecrement}
        aria-label="Disminuir"
        className="flex size-8 items-center justify-center rounded-full bg-acro-dark text-acro-text hover:bg-white/10"
      >
        <Minus className="size-4" />
      </button>
      <span className="w-8 rounded-full bg-acro-dark py-1 text-center text-sm text-acro-text">
        {value}
      </span>
      <button
        type="button"
        onClick={onIncrement}
        aria-label="Aumentar"
        className="flex size-8 items-center justify-center rounded-full bg-acro-dark text-acro-text hover:bg-white/10"
      >
        <Plus className="size-4" />
      </button>
    </div>
  );
}

function esAlquiler(producto) {
  return (producto.categoria?.nombre ?? "").toLowerCase() === "alquiler";
}

function ProductCard({ producto, onAdd }) {
  const [qty, setQty] = useState(1);
  const alquiler = esAlquiler(producto);
  const agotado = !alquiler && producto.stock <= 0;
  return (
    <article className="flex flex-col gap-2 rounded-2xl bg-acro-surface p-4">
      <h3 className="font-semibold text-acro-text">{producto.nombre}</h3>
      <p className="line-clamp-2 text-sm text-acro-muted">
        {producto.descripcion || "—"}
      </p>
      <p className="text-xl font-bold text-acro-text">{money(producto.precio)}</p>
      <p className="text-xs text-acro-muted">
        {alquiler ? "Alquiler · 1 unidad" : `Stock: ${producto.stock}`}
      </p>
      <div className="mt-auto flex items-center justify-between pt-2">
        {alquiler ? (
          <span className="text-sm text-acro-muted">1 unidad</span>
        ) : (
          <Stepper
            value={qty}
            onDecrement={() => setQty((q) => Math.max(1, q - 1))}
            onIncrement={() => setQty((q) => Math.min(producto.stock, q + 1))}
          />
        )}
        <button
          type="button"
          disabled={agotado}
          onClick={() => onAdd(alquiler ? 1 : qty)}
          aria-label={`Agregar ${producto.nombre}`}
          className="flex size-10 items-center justify-center rounded-lg bg-acro-accent text-acro-dark hover:scale-105 disabled:opacity-40"
        >
          <ShoppingCart className="size-5" />
        </button>
      </div>
    </article>
  );
}

function PlanCard({ plan, onAdd, added }) {
  return (
    <article className="flex flex-col gap-2 rounded-2xl bg-acro-surface p-4">
      <h3 className="font-semibold text-acro-text">{plan.nombre}</h3>
      <p className="text-sm text-acro-muted">
        {plan.pasesTotales > 0 ? `${plan.pasesTotales} pases · ` : ""}
        {plan.duracionDias} días
      </p>
      <p className="text-xl font-bold text-acro-text">{money(plan.precio)}</p>
      <div className="mt-auto flex items-center justify-end pt-2">
        <button
          type="button"
          disabled={added}
          onClick={onAdd}
          aria-label={`Agregar ${plan.nombre}`}
          className="flex size-10 items-center justify-center rounded-lg bg-acro-accent text-acro-dark hover:scale-105 disabled:opacity-40"
        >
          <ShoppingCart className="size-5" />
        </button>
      </div>
    </article>
  );
}

export default function TiendaWizard({ categorias = [], promos = [], planes = [] }) {
  const cards = [
    { key: PLANES_KEY, nombre: "Planes", icon: Ticket },
    ...categorias.map((c) => ({ key: c.id, nombre: c.nombre, icon: Handshake })),
  ];

  const [step, setStep] = useState(1);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState(cards[0]?.key ?? PLANES_KEY);
  const [cart, setCart] = useState([]);

  const [categoriaPrecio, setCategoriaPrecio] = useState("Regular");
  const [miembro, setMiembro] = useState(null);
  const [moneda, setMoneda] = useState("USD");
  const [formaPago, setFormaPago] = useState("Efectivo");
  const [idPromo, setIdPromo] = useState("");
  const [ventaOk, setVentaOk] = useState(null);

  const router = useRouter();
  const searchParams = useSearchParams();

  // Al volver desde "Agregar miembro" se restaura el carrito y, si se creó un
  // miembro, queda seleccionado en el paso de pago. Es una hidratación puntual
  // desde sessionStorage/URL al montar, por eso se ejecuta dentro del efecto.
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    const nuevoId = searchParams.get("nm");
    const nuevoNombre = searchParams.get("nmn");
    const restore = searchParams.get("restore");
    if (!nuevoId && !restore) return;

    try {
      const raw = sessionStorage.getItem(DRAFT_KEY);
      if (raw) {
        const draft = JSON.parse(raw);
        if (Array.isArray(draft.cart)) setCart(draft.cart);
        if (draft.moneda) setMoneda(draft.moneda);
        if (draft.formaPago) setFormaPago(draft.formaPago);
        if (typeof draft.idPromo === "string") setIdPromo(draft.idPromo);
        if (draft.categoriaPrecio) setCategoriaPrecio(draft.categoriaPrecio);
      }
    } catch {
      // Borrador inválido: se ignora.
    }
    sessionStorage.removeItem(DRAFT_KEY);

    if (nuevoId) {
      setMiembro({ id: nuevoId, nombre: nuevoNombre || "Miembro" });
    }
    setStep(3);
    router.replace("/tienda");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  /* eslint-enable react-hooks/set-state-in-effect */

  function irACrearMiembro() {
    try {
      sessionStorage.setItem(
        DRAFT_KEY,
        JSON.stringify({ cart, moneda, formaPago, idPromo, categoriaPrecio }),
      );
    } catch {
      // Sin sessionStorage no se persiste el borrador, pero igual se navega.
    }
    router.push("/miembros/nuevo?returnTo=tienda");
  }

  const isPlanes = selected === PLANES_KEY;
  const crearVenta = useCrearVenta();
  const { data: productos, isLoading } = useProductos({
    search: !isPlanes && search.trim() ? search.trim() : undefined,
    categoria: !isPlanes ? selected : undefined,
  });

  const planesFiltrados = useMemo(() => {
    const t = search.trim().toLowerCase();
    return t ? planes.filter((p) => p.nombre.toLowerCase().includes(t)) : planes;
  }, [planes, search]);

  const subtotal = useMemo(
    () => cart.reduce((acc, i) => acc + i.precio * i.cantidad, 0),
    [cart],
  );
  const promo = promos.find((p) => String(p.id) === idPromo);
  const descuento = promo ? subtotal * (promo.valorDescuento / 100) : 0;
  const total = Math.max(0, subtotal - descuento);
  const totalItems = cart.reduce((acc, i) => acc + i.cantidad, 0);
  const hasPlan = cart.some((i) => i.kind === "plan");

  function addProducto(producto, qty) {
    const key = `prod-${producto.id}`;
    const alquiler = esAlquiler(producto);
    setCart((prev) => {
      const found = prev.find((i) => i.key === key);
      if (found) {
        // Un alquiler siempre queda en 1 unidad.
        if (alquiler) return prev;
        return prev.map((i) =>
          i.key === key
            ? { ...i, cantidad: Math.min(producto.stock, i.cantidad + qty) }
            : i,
        );
      }
      return [
        ...prev,
        {
          key,
          kind: alquiler ? "alquiler" : "producto",
          id: producto.id,
          nombre: producto.nombre,
          precio: producto.precio,
          stock: producto.stock,
          cantidad: alquiler ? 1 : qty,
        },
      ];
    });
    toast.success(`${producto.nombre} agregado.`);
  }

  function addPlan(plan) {
    const key = `plan-${plan.id}`;
    setCart((prev) => {
      if (prev.some((i) => i.key === key)) return prev;
      return [
        ...prev,
        {
          key,
          kind: "plan",
          id: plan.id,
          nombre: plan.nombre,
          precio: plan.precio,
          cantidad: 1,
          requiereAgenda: Boolean(plan.requiereAgenda),
          dias: [],
        },
      ];
    });
    toast.success(`${plan.nombre} agregado.`);
  }

  function setQty(key, cantidad) {
    setCart((prev) =>
      prev.map((i) =>
        i.key === key
          ? {
              ...i,
              cantidad: Math.max(
                1,
                Math.min(i.kind === "plan" ? 1 : i.stock, cantidad),
              ),
            }
          : i,
      ),
    );
  }

  function removeFromCart(key) {
    setCart((prev) => prev.filter((i) => i.key !== key));
  }

  function toggleDia(key, dia) {
    setCart((prev) =>
      prev.map((i) => {
        if (i.key !== key) return i;
        const dias = i.dias ?? [];
        return {
          ...i,
          dias: dias.includes(dia)
            ? dias.filter((d) => d !== dia)
            : [...dias, dia],
        };
      }),
    );
  }

  const planesConAgenda = cart.filter(
    (i) => i.kind === "plan" && i.requiereAgenda,
  );

  async function confirmar() {
    if (hasPlan && !miembro) {
      toast.error("Selecciona el miembro para vender un plan.");
      return;
    }
    const sinDias = planesConAgenda.find((i) => (i.dias ?? []).length === 0);
    if (sinDias) {
      toast.error(`Selecciona los días de asistencia para "${sinDias.nombre}".`);
      return;
    }
    try {
      const res = await crearVenta.mutateAsync({
        idMiembro: miembro?.id ?? null,
        moneda,
        formaPago,
        idPromo: idPromo ? Number(idPromo) : null,
        items: cart.map((i) =>
          i.kind === "plan"
            ? {
                idPlan: i.id,
                cantidad: 1,
                ...(i.requiereAgenda ? { dias: i.dias ?? [] } : {}),
              }
            : { idProducto: i.id, cantidad: i.cantidad },
        ),
      });
      setVentaOk(res);
      setCart([]);
    } catch (err) {
      toast.error(err.message);
    }
  }

  function nuevaVenta() {
    setVentaOk(null);
    setStep(1);
    setMiembro(null);
    setIdPromo("");
    setMoneda("USD");
    setFormaPago("Efectivo");
  }

  if (ventaOk) {
    return (
      <section className="mx-auto flex w-full max-w-md flex-col items-center gap-4 py-16 text-center">
        <CheckCircle2 className="size-16 text-acro-accent" />
        <h1 className="text-2xl font-bold text-acro-text">Venta registrada</h1>
        <p className="text-acro-muted">
          {ventaOk.items} artículo(s) · Total {money(ventaOk.total)}
        </p>
        <button
          type="button"
          onClick={nuevaVenta}
          className="mt-2 rounded-xl bg-acro-accent px-6 py-3 font-semibold text-acro-dark hover:scale-[1.02]"
        >
          Nueva venta
        </button>
      </section>
    );
  }

  return (
    <section className="mx-auto w-full max-w-4xl pb-24">
      <header className="mb-4 flex items-center gap-3">
        {step > 1 && (
          <button
            type="button"
            onClick={() => setStep((s) => s - 1)}
            aria-label="Volver"
            className="rounded-md p-1 text-acro-text hover:bg-white/5"
          >
            <ArrowLeft className="size-6" />
          </button>
        )}
        <h1 className="text-3xl font-bold text-acro-text lg:text-4xl">
          {STEPS[step - 1]}
        </h1>
      </header>

      <ol className="mb-6 flex gap-2" aria-label="Progreso">
        {STEPS.map((label, i) => (
          <li
            key={label}
            className={cn(
              "h-1.5 flex-1 rounded-full",
              i < step ? "bg-acro-accent" : "bg-acro-surface",
            )}
          />
        ))}
      </ol>

      {step === 1 && (
        <div>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            {cards.map((c) => {
              const Icon = c.icon;
              const active = selected === c.key;
              return (
                <button
                  key={c.key}
                  type="button"
                  onClick={() => setSelected(c.key)}
                  aria-pressed={active}
                  className={cn(
                    "flex h-28 flex-col justify-between rounded-2xl border p-4 text-left transition-colors",
                    active
                      ? "border-transparent bg-acro-accent text-acro-dark"
                      : "border-border bg-acro-surface text-acro-text hover:bg-white/5",
                  )}
                >
                  <span className="text-lg font-semibold">{c.nombre}</span>
                  <Icon
                    className={cn(
                      "size-10 self-end",
                      active ? "text-acro-dark" : "text-acro-muted",
                    )}
                  />
                </button>
              );
            })}
          </div>

          <div className="relative my-4">
            <Search className="absolute left-3 top-1/2 size-5 -translate-y-1/2 text-acro-muted" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={isPlanes ? "Buscar plan" : "Buscar producto"}
              className="h-12 bg-acro-surface pl-11"
            />
          </div>

          {isPlanes ? (
            planesFiltrados.length === 0 ? (
              <p className="py-8 text-center text-acro-muted">Sin planes.</p>
            ) : (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {planesFiltrados.map((p) => (
                  <PlanCard
                    key={p.id}
                    plan={p}
                    added={cart.some((i) => i.key === `plan-${p.id}`)}
                    onAdd={() => addPlan(p)}
                  />
                ))}
              </div>
            )
          ) : isLoading ? (
            <p className="py-8 text-center text-acro-muted">Cargando…</p>
          ) : !productos || productos.length === 0 ? (
            <p className="py-8 text-center text-acro-muted">Sin productos.</p>
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {productos.map((p) => (
                <ProductCard
                  key={p.id}
                  producto={p}
                  onAdd={(qty) => addProducto(p, qty)}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {step === 2 && (
        <div>
          {cart.length === 0 ? (
            <p className="py-8 text-center text-acro-muted">
              El carrito está vacío.
            </p>
          ) : (
            <ul className="flex flex-col gap-3">
              {cart.map((i) => (
                <li
                  key={i.key}
                  className="flex items-center justify-between gap-3 rounded-2xl bg-acro-surface p-4"
                >
                  <div className="min-w-0">
                    <h3 className="truncate font-semibold text-acro-text">
                      {i.nombre}
                      {i.kind === "plan" && (
                        <span className="ml-2 rounded bg-acro-accent/20 px-2 py-0.5 text-xs text-acro-accent">
                          Plan
                        </span>
                      )}
                    </h3>
                    <p className="text-sm text-acro-muted">
                      {money(i.precio)} c/u · {money(i.precio * i.cantidad)}
                    </p>
                    {i.kind === "producto" && (
                      <div className="mt-2">
                        <Stepper
                          value={i.cantidad}
                          onDecrement={() => setQty(i.key, i.cantidad - 1)}
                          onIncrement={() => setQty(i.key, i.cantidad + 1)}
                        />
                      </div>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => removeFromCart(i.key)}
                    aria-label={`Quitar ${i.nombre}`}
                    className="flex size-10 items-center justify-center rounded-lg bg-acro-dark text-acro-danger hover:bg-white/10"
                  >
                    <Minus className="size-5" />
                  </button>
                </li>
              ))}
            </ul>
          )}
          <p className="mt-4 text-right text-lg font-semibold text-acro-text">
            Subtotal: {money(subtotal)}
          </p>
        </div>
      )}

      {step === 3 && (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            confirmar();
          }}
          className="flex flex-col gap-5"
        >
          <div className="flex flex-col gap-2">
            <Label className="text-base text-acro-text">Categoría</Label>
            <Select value={categoriaPrecio} onValueChange={setCategoriaPrecio}>
              <SelectTrigger className="h-12 w-full bg-acro-surface">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CATEGORIAS_PRECIO.map((c) => (
                  <SelectItem key={c} value={c}>
                    {c}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col gap-2">
            <Label className="text-base text-acro-text">
              Nombre y Apellido{" "}
              {hasPlan && <span className="text-acro-accent">*</span>}
            </Label>
            <MemberCombobox value={miembro} onChange={setMiembro} />
            {!miembro && (
              <button
                type="button"
                onClick={irACrearMiembro}
                className="flex items-center gap-1.5 self-start text-sm font-medium text-acro-accent hover:underline"
              >
                <UserPlus className="size-4" />
                ¿No está registrado? Agregar miembro
              </button>
            )}
          </div>

          {planesConAgenda.map((i) => (
            <fieldset
              key={i.key}
              className="rounded-xl border border-border p-4"
            >
              <legend className="px-1 text-base font-semibold text-acro-text">
                Días de asistencia · {i.nombre}
              </legend>
              <div className="flex flex-wrap gap-2">
                {DIAS_SEMANA.map((dia) => {
                  const activo = (i.dias ?? []).includes(dia);
                  return (
                    <button
                      key={dia}
                      type="button"
                      onClick={() => toggleDia(i.key, dia)}
                      className={cn(
                        "rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                        activo
                          ? "bg-acro-accent text-acro-dark"
                          : "bg-acro-dark text-acro-text hover:bg-white/10",
                      )}
                    >
                      {dia}
                    </button>
                  );
                })}
              </div>
            </fieldset>
          ))}

          <fieldset className="rounded-xl border border-border p-4">
            <legend className="px-1 text-base font-semibold text-acro-text">
              Moneda
            </legend>
            <div className="flex flex-wrap gap-4">
              {MONEDAS.map((m) => (
                <label
                  key={m}
                  className="flex cursor-pointer items-center gap-2 text-acro-text"
                >
                  <input
                    type="radio"
                    name="moneda"
                    value={m}
                    checked={moneda === m}
                    onChange={() => setMoneda(m)}
                    className="accent-acro-accent"
                  />
                  {m}
                </label>
              ))}
            </div>
          </fieldset>

          <div className="flex flex-col gap-2">
            <Label className="text-base font-semibold text-acro-text">
              Forma de pago
            </Label>
            <Select value={formaPago} onValueChange={setFormaPago}>
              <SelectTrigger className="h-12 w-full bg-acro-surface">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {FORMAS_PAGO.map((f) => (
                  <SelectItem key={f} value={f}>
                    {f}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col gap-2">
            <Label className="text-base font-semibold text-acro-text">
              Promoción
            </Label>
            <Select
              value={idPromo || "none"}
              onValueChange={(v) => setIdPromo(v === "none" ? "" : v)}
            >
              <SelectTrigger className="h-12 w-full bg-acro-surface">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Sin promoción</SelectItem>
                {promos.map((p) => (
                  <SelectItem key={p.id} value={String(p.id)}>
                    {p.nombre} ({p.valorDescuento}%)
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <dl className="rounded-2xl border border-border p-4 text-acro-text">
            <div className="flex justify-between">
              <dt className="text-acro-muted">Items ({totalItems})</dt>
              <dd>{money(subtotal)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-acro-muted">Descuento</dt>
              <dd>{money(descuento)}</dd>
            </div>
            <div className="mt-1 flex justify-between text-lg font-bold">
              <dt>Total</dt>
              <dd>{money(total)}</dd>
            </div>
          </dl>

          <button
            type="submit"
            disabled={crearVenta.isPending || cart.length === 0}
            className="flex h-14 items-center justify-center gap-2 rounded-xl bg-acro-accent text-lg font-semibold text-acro-dark hover:scale-[1.01] disabled:opacity-60"
          >
            {crearVenta.isPending ? (
              <Loader2 className="size-6 animate-spin" />
            ) : (
              "Confirmar"
            )}
          </button>
        </form>
      )}

      {step < 3 && (
        <button
          type="button"
          disabled={cart.length === 0}
          onClick={() => setStep((s) => s + 1)}
          aria-label="Siguiente"
          className="fixed bottom-6 right-6 z-20 flex size-16 items-center justify-center rounded-2xl bg-acro-accent text-acro-dark shadow-lg transition-transform hover:scale-105 disabled:opacity-40"
        >
          <ArrowRight className="size-8" />
        </button>
      )}
    </section>
  );
}
