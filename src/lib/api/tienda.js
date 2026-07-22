import "server-only";
import { createClient } from "@/lib/supabase/server";
import { getCurrentEmployee } from "@/lib/auth";

const PRODUCTO_SELECT = `
  id_producto,
  nombre,
  descripcion_detalle,
  precio_venta_usd,
  stock_sistema,
  categoria_producto ( id_categoria_producto, nombre )
`;

function mapProducto(row) {
  return {
    id: row.id_producto,
    nombre: row.nombre,
    descripcion: row.descripcion_detalle ?? "",
    precio: Number(row.precio_venta_usd ?? 0),
    stock: row.stock_sistema ?? 0,
    categoria: row.categoria_producto
      ? {
          id: row.categoria_producto.id_categoria_producto,
          nombre: row.categoria_producto.nombre,
        }
      : null,
  };
}

export async function listProductos({ search, categoria } = {}) {
  const supabase = await createClient();
  let query = supabase.from("productos").select(PRODUCTO_SELECT).order("nombre");
  if (categoria) query = query.eq("id_categoria_producto", categoria);
  if (search) query = query.ilike("nombre", `%${search}%`);
  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return (data ?? []).map(mapProducto);
}

export async function listPlanes() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("planes")
    .select(
      "id_plan, nombre, precio_usd, pases_totales, duracion_dias, requiere_agenda",
    )
    .order("precio_usd");
  if (error) throw new Error(error.message);
  return (data ?? []).map((p) => ({
    id: p.id_plan,
    nombre: p.nombre,
    precio: Number(p.precio_usd ?? 0),
    pasesTotales: p.pases_totales ?? 0,
    duracionDias: p.duracion_dias ?? 0,
    requiereAgenda: Boolean(p.requiere_agenda),
  }));
}

export async function listCategoriasProducto() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("categoria_producto")
    .select("id_categoria_producto, nombre")
    .order("nombre");
  if (error) throw new Error(error.message);
  return (data ?? []).map((c) => ({
    id: c.id_categoria_producto,
    nombre: c.nombre,
  }));
}

export async function listPromos() {
  const supabase = await createClient();
  const hoy = new Date().toISOString().slice(0, 10);
  const { data, error } = await supabase
    .from("promos_eventos")
    .select("id_evento, nombre, tipo, valor_descuento, fecha_inicio, fecha_fin");
  if (error) throw new Error(error.message);
  return (data ?? [])
    .filter(
      (p) =>
        (!p.fecha_inicio || p.fecha_inicio <= hoy) &&
        (!p.fecha_fin || p.fecha_fin >= hoy),
    )
    .map((p) => ({
      id: p.id_evento,
      nombre: p.nombre,
      tipo: p.tipo,
      valorDescuento: Number(p.valor_descuento ?? 0),
    }));
}

// Crea una venta con su detalle, descuenta stock y registra el movimiento.
export async function crearVenta(input) {
  const supabase = await createClient();
  const { employee } = await getCurrentEmployee();
  if (!employee) throw new Error("No autorizado.");

  const items = Array.isArray(input.items) ? input.items : [];
  if (items.length === 0) throw new Error("El carrito está vacío.");

  const productItems = items.filter((i) => i.idProducto);
  const planItems = items.filter((i) => i.idPlan);

  // Un plan debe asignarse a un miembro (se le crea la suscripción).
  if (planItems.length > 0 && !input.idMiembro) {
    throw new Error("Selecciona el miembro para vender un plan.");
  }

  // Cargar productos reales para validar precio y stock (no confiar en el cliente).
  const productoIds = productItems.map((i) => i.idProducto);
  let productos = [];
  if (productoIds.length > 0) {
    const { data, error: prodError } = await supabase
      .from("productos")
      .select(
        "id_producto, nombre, precio_venta_usd, stock_sistema, categoria_producto ( nombre )",
      )
      .in("id_producto", productoIds);
    if (prodError) throw new Error(prodError.message);
    productos = data ?? [];
  }

  const byId = new Map(productos.map((p) => [p.id_producto, p]));
  const detalle = [];
  let subtotal = 0;
  for (const item of productItems) {
    const prod = byId.get(item.idProducto);
    if (!prod) throw new Error("Un producto del carrito ya no existe.");
    // Un alquiler no descuenta stock y siempre es una sola unidad por producto.
    const esAlquiler =
      (prod.categoria_producto?.nombre ?? "").toLowerCase() === "alquiler";
    const cantidad = esAlquiler
      ? 1
      : Math.max(1, Number(item.cantidad) || 1);
    if (!esAlquiler && prod.stock_sistema < cantidad) {
      throw new Error(`Stock insuficiente de "${prod.nombre}".`);
    }
    const precio = Number(prod.precio_venta_usd);
    subtotal += precio * cantidad;
    detalle.push({ prod, cantidad, precio, esAlquiler });
  }

  // Cargar planes reales.
  const planIds = planItems.map((i) => i.idPlan);
  let planes = [];
  if (planIds.length > 0) {
    const { data, error: planError } = await supabase
      .from("planes")
      .select(
        "id_plan, nombre, precio_usd, pases_totales, duracion_dias, requiere_agenda",
      )
      .in("id_plan", planIds);
    if (planError) throw new Error(planError.message);
    planes = data ?? [];
  }
  const planById = new Map(planes.map((p) => [p.id_plan, p]));
  const detallePlanes = [];
  for (const item of planItems) {
    const plan = planById.get(item.idPlan);
    if (!plan) throw new Error("Un plan del carrito ya no existe.");
    const precio = Number(plan.precio_usd);
    subtotal += precio;
    // Para planes de niños se agendan los días de asistencia en la semana.
    const dias =
      plan.requiere_agenda && Array.isArray(item.dias)
        ? item.dias.filter((d) => typeof d === "string" && d.trim())
        : [];
    if (plan.requiere_agenda && dias.length === 0) {
      throw new Error(
        `Selecciona los días de asistencia para "${plan.nombre}".`,
      );
    }
    detallePlanes.push({ plan, precio, dias });
  }

  // Promoción (descuento porcentual sobre el subtotal).
  let descuento = 0;
  if (input.idPromo) {
    const { data: promo } = await supabase
      .from("promos_eventos")
      .select("valor_descuento")
      .eq("id_evento", input.idPromo)
      .maybeSingle();
    if (promo) {
      descuento = subtotal * (Number(promo.valor_descuento) / 100);
    }
  }
  const total = Math.max(0, subtotal - descuento);

  // Cabecera de la venta.
  const { data: venta, error: ventaError } = await supabase
    .from("ventas")
    .insert({
      id_comprador: input.idMiembro || null,
      id_vendedor: employee.id_persona,
      id_evento: input.idPromo || null,
      forma_pago: input.formaPago || null,
      moneda: input.moneda || "USD",
      total_usd: total,
      estado: "Completada",
    })
    .select("id_venta")
    .single();
  if (ventaError) throw new Error(ventaError.message);

  // Detalle de productos + movimientos de inventario + descuento de stock.
  for (const d of detalle) {
    await supabase.from("detalle_venta").insert({
      id_venta: venta.id_venta,
      id_producto: d.prod.id_producto,
      cantidad: d.cantidad,
      precio_unit_usd: d.precio,
      tipo_item: d.esAlquiler ? "Alquiler" : "Producto",
    });
    // Los alquileres no afectan el stock (el producto se devuelve).
    if (!d.esAlquiler) {
      await supabase
        .from("productos")
        .update({ stock_sistema: d.prod.stock_sistema - d.cantidad })
        .eq("id_producto", d.prod.id_producto);
      await supabase.from("movimientos_inventario").insert({
        id_producto: d.prod.id_producto,
        id_empleado: employee.id_persona,
        tipo_movimiento: "Venta",
        cantidad: -d.cantidad,
        id_venta_relacionada: venta.id_venta,
      });
    }
  }

  // Detalle de planes + creación de la suscripción del miembro.
  for (const dp of detallePlanes) {
    await supabase.from("detalle_venta").insert({
      id_venta: venta.id_venta,
      id_plan: dp.plan.id_plan,
      cantidad: 1,
      precio_unit_usd: dp.precio,
      tipo_item: "Plan",
    });
    const inicio = new Date();
    const expira = new Date(inicio);
    expira.setDate(expira.getDate() + (dp.plan.duracion_dias ?? 0));
    const { data: suscripcion, error: subError } = await supabase
      .from("suscripciones")
      .insert({
        id_miembro: input.idMiembro,
        id_plan: dp.plan.id_plan,
        fecha_inicio: inicio.toISOString().slice(0, 10),
        fecha_expiracion: expira.toISOString().slice(0, 10),
        pases_restantes: dp.plan.pases_totales ?? 0,
        estado: "Activo",
      })
      .select("id_suscripcion")
      .single();
    if (subError) throw new Error(subError.message);

    if (dp.dias.length > 0 && suscripcion) {
      await supabase.from("suscripcion_dias").insert(
        dp.dias.map((dia) => ({
          id_suscripcion: suscripcion.id_suscripcion,
          dia_semana: dia,
          tipo_dia: "Fijo",
        })),
      );
    }
  }

  return {
    id: venta.id_venta,
    subtotal,
    descuento,
    total,
    items: detalle.length + detallePlanes.length,
  };
}
