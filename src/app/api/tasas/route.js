import { NextResponse } from "next/server";
import { getCurrentEmployee } from "@/lib/auth";
import { getTasasHoy, guardarTasasHoy } from "@/lib/api/tasas";

export async function GET() {
  const { employee } = await getCurrentEmployee();
  if (!employee) {
    return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  }
  try {
    const tasas = await getTasasHoy();
    return NextResponse.json({ tasas });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request) {
  const { employee } = await getCurrentEmployee();
  if (!employee) {
    return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Cuerpo inválido." }, { status: 400 });
  }

  try {
    const tasas = await guardarTasasHoy(body);
    return NextResponse.json({ tasas });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
