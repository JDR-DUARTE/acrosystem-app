import { NextResponse } from "next/server";
import { getCurrentEmployee } from "@/lib/auth";
import { listMiembros, createMiembro } from "@/lib/api/miembros";

export async function GET(request) {
  const { employee } = await getCurrentEmployee();
  if (!employee) {
    return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  try {
    const miembros = await listMiembros({
      search: searchParams.get("search") ?? undefined,
      plan: searchParams.get("plan") ?? undefined,
      estado: searchParams.get("estado") ?? undefined,
    });
    return NextResponse.json({ miembros });
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
    const result = await createMiembro(body);
    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
