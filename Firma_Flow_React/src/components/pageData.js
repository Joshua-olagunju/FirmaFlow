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
  Settings,
  Crown,
} from "lucide-react";

export const pageData = [
  {
    name: "Dashboard",
    path: "/dashboard",
    icon: LayoutDashboard,
    roles: ["admin", "user"], // both can see
  },
  {
    name: "Customers",
    path: "/customers",
    icon: Users,
    roles: ["admin", "user"],
  },
  {
    name: "Suppliers",
    path: "/suppliers",
    icon: Building2,
    roles: ["admin"], // admin only
  },
  {
    name: "Inventory",
    path: "/inventory",
    icon: Package,
    roles: ["admin", "user"],
  },
  {
    name: "Sales",
    path: "/sales",
    icon: ShoppingCart,
    roles: ["admin", "user"],
  },
  {
    name: "Payments",
    path: "/payments",
    icon: CreditCard,
    roles: ["admin", "user"],
  },
  {
    name: "Purchases",
    path: "/purchases",
    icon: ShoppingBag,
    roles: ["admin"], // admin only
  },
  {
    name: "Expenses",
    path: "/expenses",
    icon: Receipt,
    roles: ["admin"], // admin only
  },
  {
    name: "Reports",
    path: "/reports",
    icon: FileText,
    roles: ["admin"], // admin only
  },
  {
    name: "Subscription",
    path: "/subscription",
    icon: Crown,
    roles: ["admin", "user"], // both can see
  },
  {
    name: "Settings",
    path: "/settings",
    icon: Settings,
    roles: ["admin", "user"], // both can see
  },
];
