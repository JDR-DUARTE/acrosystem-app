import { NextResponse } from "next/server";
import { getCurrentEmployee } from "@/lib/auth";
import { crearVenta } from "@/lib/api/tienda";

export async function POST(request) {
  const { employee } = await getCurrentEmployee();
  if (!employee) {
    return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  try {
    const venta = await crearVenta(body);
    return NextResponse.json(venta, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
