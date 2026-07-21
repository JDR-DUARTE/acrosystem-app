import { NextResponse } from "next/server";
import { getCurrentEmployee } from "@/lib/auth";
import { listVencimientos } from "@/lib/api/vencimientos";

export async function GET(request) {
  const { employee } = await getCurrentEmployee();
  if (!employee) {
    return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  try {
    const vencimientos = await listVencimientos({
      tipo: searchParams.get("tipo") ?? "proximos",
      search: searchParams.get("search") ?? undefined,
    });
    return NextResponse.json({ vencimientos });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
