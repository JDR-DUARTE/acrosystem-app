import { redirect } from "next/navigation";
import AppShell from "@/components/layout/app-shell";
import { getCurrentEmployee } from "@/lib/auth";

export default async function AppLayout({ children }) {
  const { user, isAdmin } = await getCurrentEmployee();

  if (!user) {
    redirect("/login");
  }

  return <AppShell isAdmin={isAdmin}>{children}</AppShell>;
}
