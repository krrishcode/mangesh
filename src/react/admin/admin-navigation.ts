import type { AdminIconName } from "./components/ui/AdminIcon";
export const adminNavGroups: {
  label: string;
  items: { id: AdminIconName; label: string; description: string }[];
}[] = [
  {
    label: "Store",
    items: [
      {
        id: "dashboard",
        label: "Overview",
        description: "Revenue, orders and store activity",
      },
      {
        id: "orders",
        label: "Orders",
        description: "Purchases, fulfilment and cancellations",
      },
      {
        id: "products",
        label: "Products",
        description: "Catalogue, inventory and pricing",
      },
      {
        id: "categories",
        label: "Categories",
        description: "Organise your product catalogue",
      },
    ],
  },
  {
    label: "Operations",
    items: [
      {
        id: "payments",
        label: "Payments",
        description: "COD collections and recorded refunds",
      },
      {
        id: "customers",
        label: "Customers",
        description: "Customer details and purchase history",
      },
      {
        id: "appointments",
        label: "Appointments",
        description: "Fittings and styling visits",
      },
      {
        id: "reviews",
        label: "Reviews",
        description: "Customer feedback and moderation",
      },
    ],
  },
  {
    label: "Manage",
    items: [
      {
        id: "settings",
        label: "Settings",
        description: "Store profile, delivery and inventory",
      },
    ],
  },
];
