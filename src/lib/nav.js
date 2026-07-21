import {
  LayoutGrid,
  Users,
  CalendarClock,
  ScanLine,
  Store,
  Boxes,
  CreditCard,
  History,
  Activity,
} from "lucide-react";

// Primary navigation, in the order shown in the Figma menu.
// `adminOnly` items are hidden for non-administrative roles (RN-RES-01).
export const NAV_ITEMS = [
  { label: "Panel", href: "/dashboard", icon: LayoutGrid },
  { label: "Miembros", href: "/miembros", icon: Users },
  { label: "Vencimientos", href: "/vencimientos", icon: CalendarClock },
  { label: "Check-in", href: "/check-in", icon: ScanLine },
  { label: "Tienda", href: "/tienda", icon: Store },
  { label: "Inventario", href: "/inventario", icon: Boxes },
  { label: "Pagos", href: "/pagos", icon: CreditCard },
  { label: "Historico", href: "/historico", icon: History },
  { label: "Métricas", href: "/metricas", icon: Activity, adminOnly: true },
];
