import {
  LayoutDashboard,
  Users,
  Building2,
  Package,
  ShoppingCart,
  CreditCard,
  ShoppingBag,
  Receipt,
  FileText,
  BarChart3,
  Settings,
} from "lucide-react";

export const pageData = [
  {
    name: "Dashboard",
    path: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    name: "Customers",
    path: "/customers",
    icon: Users,
  },
  {
    name: "Suppliers",
    path: "/suppliers",
    icon: Building2,
  },
  {
    name: "Inventory",
    path: "/inventory",
    icon: Package,
  },
  {
    name: "Sales",
    path: "/sales",
    icon: ShoppingCart,
  },
  {
    name: "Payments",
    path: "/payments",
    icon: CreditCard,
  },
  {
    name: "Purchases",
    path: "/purchases",
    icon: ShoppingBag,
  },
  {
    name: "Expenses",
    path: "/expenses",
    icon: Receipt,
  },
  {
    name: "Reports",
    path: "/reports",
    icon: FileText,
  },
  {
    name: "Advanced Reports",
    path: "/advance-reports",
    icon: BarChart3,
  },
  {
    name: "Settings",
    path: "/settings",
    icon: Settings,
  },
];
