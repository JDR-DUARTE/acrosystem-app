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

  const tipoVenta = input.tipoVenta === "Interna" ? "Interna" : "Externa";
  if (tipoVenta === "Interna" && !input.idMiembro) {
    throw new Error("Selecciona el miembro para una venta interna.");
  }

  // Cargar productos reales para validar precio y stock (no confiar en el cliente).
  const ids = items.map((i) => i.idProducto);
  const { data: productos, error: prodError } = await supabase
    .from("productos")
    .select("id_producto, nombre, precio_venta_usd, stock_sistema")
    .in("id_producto", ids);
  if (prodError) throw new Error(prodError.message);

  const byId = new Map(productos.map((p) => [p.id_producto, p]));
  const detalle = [];
  let subtotal = 0;
  for (const item of items) {
    const prod = byId.get(item.idProducto);
    if (!prod) throw new Error("Un producto del carrito ya no existe.");
    const cantidad = Math.max(1, Number(item.cantidad) || 1);
    if (prod.stock_sistema < cantidad) {
      throw new Error(`Stock insuficiente de "${prod.nombre}".`);
    }
    const precio = Number(prod.precio_venta_usd);
    subtotal += precio * cantidad;
    detalle.push({ prod, cantidad, precio });
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
      tipo_venta: tipoVenta,
      forma_pago: input.formaPago || null,
      moneda: input.moneda || "USD",
      total_usd: total,
      estado: "Completada",
    })
    .select("id_venta")
    .single();
  if (ventaError) throw new Error(ventaError.message);

  // Detalle + movimientos de inventario + descuento de stock.
  for (const d of detalle) {
    await supabase.from("detalle_venta").insert({
      id_venta: venta.id_venta,
      id_producto: d.prod.id_producto,
      cantidad: d.cantidad,
      precio_unit_usd: d.precio,
      tipo_item: "Producto",
    });
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

  return {
    id: venta.id_venta,
    subtotal,
    descuento,
    total,
    items: detalle.length,
  };
}
