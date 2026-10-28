# Studio Admin UI mapping to Mangesh Mahadev

Reviewed 25 October 2026. Reference repository: https://github.com/arhamkhnz/next-shadcn-admin-dashboard

Pinned source revision: `51fb5d90e09b80f6c96b313a24b34c1514e3352b` (main at review time).

## Conclusion

The repository is suitable as a visual foundation. It does not supply all nine of our operational modules as complete, connected features. Every existing module can be implemented using its components, but the store-specific forms, workflows, backend integration and record protections must be carried over from this project.

This review inspected the source, package manifest, route inventory, sidebar, product editor/add drawer, users table, ecommerce widgets, calendar, authentication form, layout preferences and the repository's bundled light dashboard screenshot. The reference app was not installed or run. The bundled screenshot illustrates a layout; it is not runtime verification of this revision.

## Module mapping

| Our module / route | Closest reference source | UI coverage | Work required to preserve our current features |
|---|---|---|---|
| Overview `/admin` | `dashboard/ecommerce`, `dashboard/default` | Good dashboard starting point | Connect real collected revenue, product/customer/order counts, pending orders, low stock and recent orders. Only display charts with real available data. |
| Products `/admin/products` | `dashboard/products` | Product list, search, filters, row dropdown, add drawer and edit dialog | The local table now follows the reference's Product/SKU/Category/Status/Inventory/Price/Units sold structure, with live sold quantity from non-cancelled order lines. Keep the full product form, INR, actual categories, gallery, variants and guarded lifecycle actions. |
| Orders `/admin/orders` | `dashboard/ecommerce/_components/recent-orders.tsx` | Partial: dashboard table/widget | Build dedicated operational list and detail view with item variants, guest/customer identity, shipping/pickup, COD status, shipments/tracking, forward status changes, cancellation/stock restoration and archive/restore. |
| Categories `/admin/categories` | Product category filter plus generic form/table components | No dedicated category management screen | Build real category CRUD, slug validation, product count and deletion protection. Demo categories are an array, not managed records. |
| Payments `/admin/payments` | `dashboard/finance`, `dashboard/invoice` | Related visual patterns only | Build COD outstanding-order selection, collection receipt, payment detail, refund confirmation, correct financial totals and archive/restore. Personal finance and invoice demos do not implement these operations. |
| Customers `/admin/customers` | `dashboard/users` | Reusable list/search/filter/dropdown layout | Replace organization role/team/workspace data with actual customer phone, order count, collected amount and joined date. Preserve archive/restore and automatic return to current list on new order/appointment. |
| Appointments `/admin/appointments` | `dashboard/calendar` | Month/week/day/list calendar, date navigation, event detail affordance | The appointment screen now defaults to the reference-style calendar, with real appointment data and status colors, IST dates, event details, rescheduling, completion/cancellation, archive controls and customer-backed appointment creation. The operational list remains available. |
| Reviews `/admin/reviews` | `dashboard/ecommerce/_components/customer-reviews.tsx` | Summary widget only | Build moderation queue, search, product/customer context, approve/reject actions and rejection-before-delete protection. |
| Settings `/admin/settings` | Header `layout-controls.tsx`, profile/form components | Layout/theme preferences only | Build actual store name/tagline, support contacts, delivery fee/free-delivery threshold and low-stock threshold. Preserve server validation, dirty state and runtime propagation to storefront/checkout. |

## Cross-module mapping

| Requirement | Reference evidence | Integration decision |
|---|---|---|
| Sidebar/header/mobile shell | Shared dashboard layout and sidebar components | Reuse visual shell with our nine destinations, real store name and authenticated admin identity. |
| Tables, filters and pagination | TanStack tables in Products, Users and Recent Orders | Reusable UI. Retain our API field contracts, numeric sorting and operational filters. Row selection is a pattern, not a completed bulk operation. |
| Three-dot row menus | Product/user/order columns use shadcn dropdowns | Reusable. Carry over our existing actions and confirmations; our requested hover opening needs additional behavior. |
| Forms/dialogs/drawers | Shared components and product forms | Reusable. Extend to our full fields and real pending/error/success handling. |
| Login | `auth/_components/login-form.tsx` | Layout and input validation only. Submission displays form values in a toast. Use our existing admin authentication, role checks and isolated session store instead. |
| Role management | Roles screen and navigation | Screen availability does not establish server authorization. Continue to enforce our admin routes server-side; a richer RBAC model would be separate work. |
| Uploads | `product-images-field.tsx` | File checks/local object URL previews exist. Wire our authenticated Vercel Blob uploader, cover ordering and persisted gallery. |
| Archive/restore and safe delete | No matching store record lifecycle implementation found | Preserve our transaction guards, history retention, reason/typed confirmation and audit writes. |
| Error/loading/empty states | Some table empty states and form validation | Implement against real requests, including expired sessions, stale reads, conflicts, upload errors and duplicate-submit locks. |
| Themes and preferences | Theme/layout preference store and cookie server actions | Reusable, but our initial design should retain white background and readable text. Theme controls are not store settings. |

## Concrete functionality gaps found in source

1. Products imports sample data and holds edits/duplicates in component state. Reload discards changes. Its edit form explicitly identifies the catalog as demo data.
2. The add product drawer submits through `form.handleSubmit(() => undefined)`. Validation and local image previews do not create a product, update the product list or upload files.
3. Users comes from a local data file. Several toolbar controls and row menu options have no operation handlers in the inspected components.
4. Recent orders comes from `recent-orders-table/data.json`. Its menu entries do not implement our order management flow.
5. The reviews widget renders fixed summary values and review content. It is not a moderation queue.
6. The reference calendar uses `demoEvents`, and its Add event button does not implement appointment creation/status management. The local adaptation now uses our admin appointment API and customer records.
7. Login submission renders submitted values, including the password, in a demo toast. Replace this handler when integrating the visual form.
8. The server actions inspected persist presentation preferences. No store CRUD/API route handlers were found in the reference route inventory.

## Product editor differences that must not be lost

Our editor has more fields than the reference edit dialog. Preserve description, SKU, real category ID, slug, price/sale price, stock, active/ready-to-ship state, home/pickup delivery availability, gallery and cover, colors and swatches, size/in-stock-size mappings, craft/story and additional specifications/care/returns information.

Reference demo values use USD, a fixed category list and Active/Draft/Archived labels. Our products use INR and real categories; inactive product visibility is distinct from the archive mechanism used for operational records. Map these deliberately rather than treating the status values as interchangeable.

## Adoption plan

1. Done: bring the shell, neutral theme, typography, inputs, cards, table and dropdown patterns into this application with admin-scoped styles. Keep existing `/admin` paths and backend routes.
2. Done: convert the operational list modules while preserving API requests, filters, actions, lifecycle policies and accessible confirmations.
3. Done: retain the complete product editor and order/payment details against the current data models rather than adopting the reference's demo forms.
4. Done: implement Categories, Payments, Reviews and Store Settings with the shared components, plus an appointment calendar connected to the existing backend.
5. Verified: run backend authorization/validation tests, check dashboard and module flows, inspect desktop/mobile layouts and confirm the production build/typecheck.

Do not copy unrelated template destinations or controls into the product: chat, mail, kanban, academy, infrastructure, patient monitoring, sample account switchers, GitHub shortcuts, mock exports, unrelated finance cards or invented analytics. Add additional features only when there is an actual product need and data source.

## Module follow-up

The visual check covered the reference's Products, Users and Calendar screens plus this application's Overview, Products, Orders, Categories, Payments, Customers, Appointments and Reviews. Categories, payments and review moderation do not have dedicated CRUD pages in the reference; they continue to use the shared neutral card, filter, table, pagination and three-dot menu patterns with their store-specific data and actions. “Users” in the reference means organization accounts, so the local Customers screen retains customer identity and purchase history rather than importing fake team roles.

The calendar is backed by `GET/POST /admin/appointments` and `PATCH /admin/appointments/:id/{schedule,status}`. Creation accepts registered customer accounts only, validates future visit times, and restores an archived customer when a new appointment is created. Only upcoming appointments can be rescheduled or have their status changed.

Our current typography requirement remains 15px base, 14px table/form/control text and 16px mobile inputs. Reference screens use compact `text-xs`, `h-7` and small icon controls in places, so a literal copy could reintroduce the small-text issue.

## Compatibility

Both projects use Next.js 16, React 19, TypeScript, Tailwind 4 and Zustand. Our project uses Zod 3 and custom admin components; the reviewed reference uses Zod 4, TanStack Table 9, React Hook Form, Radix/shadcn and additional libraries. Component adoption needs dependency and CSS review; copying its package manifest wholesale is not a safe integration plan.

The reference is MIT licensed. Retain the required copyright/license notice with copied code.

## Source links

All reference paths below are relative to `src/app/(main)/dashboard` unless otherwise stated. Links are pinned to the reviewed revision.

- [Repository and README](https://github.com/arhamkhnz/next-shadcn-admin-dashboard/tree/51fb5d90e09b80f6c96b313a24b34c1514e3352b)
- [Products and demo state](https://github.com/arhamkhnz/next-shadcn-admin-dashboard/blob/51fb5d90e09b80f6c96b313a24b34c1514e3352b/src/app/%28main%29/dashboard/products/_components/products.tsx)
- [Add product drawer](https://github.com/arhamkhnz/next-shadcn-admin-dashboard/blob/51fb5d90e09b80f6c96b313a24b34c1514e3352b/src/app/%28main%29/dashboard/products/_components/add-product-drawer.tsx)
- [Users table](https://github.com/arhamkhnz/next-shadcn-admin-dashboard/blob/51fb5d90e09b80f6c96b313a24b34c1514e3352b/src/app/%28main%29/dashboard/users/_components/users.tsx)
- [Recent orders](https://github.com/arhamkhnz/next-shadcn-admin-dashboard/blob/51fb5d90e09b80f6c96b313a24b34c1514e3352b/src/app/%28main%29/dashboard/ecommerce/_components/recent-orders.tsx)
- [Review widget](https://github.com/arhamkhnz/next-shadcn-admin-dashboard/blob/51fb5d90e09b80f6c96b313a24b34c1514e3352b/src/app/%28main%29/dashboard/ecommerce/_components/customer-reviews.tsx)
- [Calendar](https://github.com/arhamkhnz/next-shadcn-admin-dashboard/blob/51fb5d90e09b80f6c96b313a24b34c1514e3352b/src/app/%28main%29/dashboard/calendar/_components/calendar.tsx)
- [Login form](https://github.com/arhamkhnz/next-shadcn-admin-dashboard/blob/51fb5d90e09b80f6c96b313a24b34c1514e3352b/src/app/%28main%29/auth/_components/login-form.tsx)
- [Shared layout](https://github.com/arhamkhnz/next-shadcn-admin-dashboard/blob/51fb5d90e09b80f6c96b313a24b34c1514e3352b/src/app/%28main%29/dashboard/layout.tsx)
- [Dependencies](https://github.com/arhamkhnz/next-shadcn-admin-dashboard/blob/51fb5d90e09b80f6c96b313a24b34c1514e3352b/package.json)
- [License](https://github.com/arhamkhnz/next-shadcn-admin-dashboard/blob/51fb5d90e09b80f6c96b313a24b34c1514e3352b/LICENSE)
