"use client";

import { useMemo, useState } from "react";
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

const MONEDAS = ["COP", "VES", "USD", "EUR", "USDT"];
const FORMAS_PAGO = ["Efectivo", "Transferencia", "Pago móvil", "Tarjeta", "Zelle"];
const CATEGORIAS_PRECIO = ["Regular", "Miembro", "Empleado"];
const STEPS = ["Tienda", "Detalle de venta", "Datos y pago"];

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

function ProductCard({ producto, onAdd }) {
  const [qty, setQty] = useState(1);
  const agotado = producto.stock <= 0;
  return (
    <article className="flex flex-col gap-2 rounded-2xl bg-acro-surface p-4">
      <h3 className="font-semibold text-acro-text">{producto.nombre}</h3>
      <p className="line-clamp-2 text-sm text-acro-muted">
        {producto.descripcion || "—"}
      </p>
      <p className="text-xl font-bold text-acro-text">{money(producto.precio)}</p>
      <p className="text-xs text-acro-muted">Stock: {producto.stock}</p>
      <div className="mt-auto flex items-center justify-between pt-2">
        <Stepper
          value={qty}
          onDecrement={() => setQty((q) => Math.max(1, q - 1))}
          onIncrement={() => setQty((q) => Math.min(producto.stock, q + 1))}
        />
        <button
          type="button"
          disabled={agotado}
          onClick={() => onAdd(producto, qty)}
          aria-label={`Agregar ${producto.nombre}`}
          className="flex size-10 items-center justify-center rounded-lg bg-acro-accent text-acro-dark hover:scale-105 disabled:opacity-40"
        >
          <ShoppingCart className="size-5" />
        </button>
      </div>
    </article>
  );
}

export default function TiendaWizard({ categorias = [], promos = [], miembros = [] }) {
  const [step, setStep] = useState(1);
  const [search, setSearch] = useState("");
  const [categoria, setCategoria] = useState(null);
  const [cart, setCart] = useState([]);

  const [tipoVenta, setTipoVenta] = useState("Externa");
  const [categoriaPrecio, setCategoriaPrecio] = useState("Regular");
  const [idMiembro, setIdMiembro] = useState("");
  const [moneda, setMoneda] = useState("USD");
  const [formaPago, setFormaPago] = useState("Efectivo");
  const [idPromo, setIdPromo] = useState("");
  const [ventaOk, setVentaOk] = useState(null);

  const crearVenta = useCrearVenta();
  const { data: productos, isLoading } = useProductos({
    search: search.trim() || undefined,
    categoria: categoria ?? undefined,
  });

  const subtotal = useMemo(
    () => cart.reduce((acc, i) => acc + i.precio * i.cantidad, 0),
    [cart],
  );
  const promo = promos.find((p) => String(p.id) === idPromo);
  const descuento = promo ? subtotal * (promo.valorDescuento / 100) : 0;
  const total = Math.max(0, subtotal - descuento);
  const totalItems = cart.reduce((acc, i) => acc + i.cantidad, 0);

  function addToCart(producto, qty) {
    setCart((prev) => {
      const found = prev.find((i) => i.id === producto.id);
      if (found) {
        return prev.map((i) =>
          i.id === producto.id
            ? { ...i, cantidad: Math.min(producto.stock, i.cantidad + qty) }
            : i,
        );
      }
      return [
        ...prev,
        {
          id: producto.id,
          nombre: producto.nombre,
          precio: producto.precio,
          stock: producto.stock,
          cantidad: qty,
        },
      ];
    });
    toast.success(`${producto.nombre} agregado.`);
  }

  function setQty(id, cantidad) {
    setCart((prev) =>
      prev.map((i) =>
        i.id === id
          ? { ...i, cantidad: Math.max(1, Math.min(i.stock, cantidad)) }
          : i,
      ),
    );
  }

  function removeFromCart(id) {
    setCart((prev) => prev.filter((i) => i.id !== id));
  }

  async function confirmar() {
    try {
      const res = await crearVenta.mutateAsync({
        tipoVenta,
        idMiembro: idMiembro || null,
        moneda,
        formaPago,
        idPromo: idPromo ? Number(idPromo) : null,
        items: cart.map((i) => ({ idProducto: i.id, cantidad: i.cantidad })),
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
    setIdMiembro("");
    setIdPromo("");
    setTipoVenta("Externa");
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
    <section className="mx-auto w-full max-w-3xl pb-24">
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
        <h1 className="text-2xl font-bold text-acro-text lg:text-3xl">
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
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <button
              type="button"
              onClick={() => setCategoria(null)}
              className={cn(
                "rounded-xl px-3 py-3 text-sm font-medium",
                categoria === null
                  ? "bg-acro-accent text-acro-dark"
                  : "bg-acro-surface text-acro-text hover:bg-white/5",
              )}
            >
              Todas
            </button>
            {categorias.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => setCategoria(c.id)}
                className={cn(
                  "rounded-xl px-3 py-3 text-sm font-medium",
                  categoria === c.id
                    ? "bg-acro-accent text-acro-dark"
                    : "bg-acro-surface text-acro-text hover:bg-white/5",
                )}
              >
                {c.nombre}
              </button>
            ))}
          </div>

          <div className="relative my-4">
            <Search className="absolute left-3 top-1/2 size-5 -translate-y-1/2 text-acro-muted" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar producto"
              className="h-12 bg-acro-surface pl-11"
            />
          </div>

          {isLoading ? (
            <p className="py-8 text-center text-acro-muted">Cargando…</p>
          ) : !productos || productos.length === 0 ? (
            <p className="py-8 text-center text-acro-muted">Sin productos.</p>
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {productos.map((p) => (
                <ProductCard key={p.id} producto={p} onAdd={addToCart} />
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
                  key={i.id}
                  className="flex items-center justify-between gap-3 rounded-2xl bg-acro-surface p-4"
                >
                  <div className="min-w-0">
                    <h3 className="truncate font-semibold text-acro-text">
                      {i.nombre}
                    </h3>
                    <p className="text-sm text-acro-muted">
                      {money(i.precio)} c/u · {money(i.precio * i.cantidad)}
                    </p>
                    <div className="mt-2">
                      <Stepper
                        value={i.cantidad}
                        onDecrement={() => setQty(i.id, i.cantidad - 1)}
                        onIncrement={() => setQty(i.id, i.cantidad + 1)}
                      />
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeFromCart(i.id)}
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
          <fieldset className="flex flex-col gap-2">
            <legend className="mb-1 text-base font-semibold text-acro-text">
              Tipo de venta
            </legend>
            <div className="flex gap-3">
              {["Externa", "Interna"].map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setTipoVenta(t)}
                  className={cn(
                    "flex-1 rounded-xl py-2.5 font-medium",
                    tipoVenta === t
                      ? "bg-acro-accent text-acro-dark"
                      : "bg-acro-surface text-acro-text hover:bg-white/5",
                  )}
                >
                  {t}
                </button>
              ))}
            </div>
          </fieldset>

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
              Nombre y Apellido {tipoVenta === "Interna" && <span className="text-acro-accent">*</span>}
            </Label>
            <Select value={idMiembro} onValueChange={setIdMiembro}>
              <SelectTrigger className="h-12 w-full bg-acro-surface">
                <SelectValue placeholder="Selecciona un miembro (opcional)" />
              </SelectTrigger>
              <SelectContent>
                {miembros.map((m) => (
                  <SelectItem key={m.id} value={String(m.id)}>
                    {m.nombre}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

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
