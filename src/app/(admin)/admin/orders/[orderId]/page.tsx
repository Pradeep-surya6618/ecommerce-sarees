import Image from "next/image";
import { notFound } from "next/navigation";
import { ordersRepo } from "@/lib/db/repos/orders";
import { formatRupees } from "@/lib/money";
import { OrderStatusBadge } from "@/components/account/OrderStatusBadge";
import { OrderStatusTimeline } from "@/components/account/OrderStatusTimeline";
import { InternalNotes } from "@/components/admin/InternalNotes";
import { OrderStatusActions } from "@/components/admin/OrderStatusActions";
import { CartSummary } from "@/components/storefront/CartSummary";
import { Breadcrumb } from "@/components/ui/Breadcrumb";

interface PageProps {
  params: Promise<{ orderId: string }>;
}

export default async function AdminOrderDetailPage({ params }: PageProps) {
  const { orderId } = await params;
  const order = await ordersRepo.getById(orderId);
  if (!order) notFound();

  return (
    <div className="flex flex-col gap-8">
      <Breadcrumb
        items={[
          { label: "Admin", href: "/admin" },
          { label: "Orders", href: "/admin/orders" },
          { label: order.id },
        ]}
      />
      <header className="flex items-start justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl text-ink-900">{order.id}</h1>
          <p className="text-sm text-ink-500">
            Placed {new Date(order.createdAt).toLocaleString("en-IN")}
          </p>
        </div>
        <OrderStatusBadge status={order.status} />
      </header>
      <div className="grid gap-8 lg:grid-cols-[2fr_1fr]">
        <div className="flex flex-col gap-6">
          <section>
            <h2 className="mb-4 font-display text-xl text-ink-900">Status</h2>
            <OrderStatusTimeline status={order.status} />
          </section>
          <section>
            <h2 className="mb-4 font-display text-xl text-ink-900">Items</h2>
            <ul className="flex flex-col divide-y divide-ink-500/10 rounded-md border border-ink-500/10 bg-bg-elevated">
              {order.items.map((it) => (
                <li key={it.variantSku} className="flex items-start gap-4 p-4">
                  <div className="relative h-20 w-16 shrink-0 overflow-hidden rounded-sm bg-ink-500/5">
                    {it.imageUrl && (
                      <Image
                        src={it.imageUrl}
                        alt={it.productName}
                        fill
                        sizes="64px"
                        className="object-cover"
                      />
                    )}
                  </div>
                  <div className="flex flex-1 flex-col text-sm">
                    <span className="font-medium text-ink-900">{it.productName}</span>
                    <span className="text-xs text-ink-500">
                      {it.variantLabel} &middot; Qty {it.quantity}
                    </span>
                    <span className="mt-1 font-semibold tabular-nums text-ink-900">
                      {formatRupees(it.lineTotalPaise)}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          </section>
          <InternalNotes orderId={order.id} notes={order.internalNotes} />
        </div>
        <div className="flex flex-col gap-6">
          <OrderStatusActions orderId={order.id} status={order.status} />
          <CartSummary
            subtotalPaise={order.subtotalPaise}
            shippingPaise={order.shippingPaise}
            taxPaise={order.taxPaise}
            totalPaise={order.totalPaise}
          />
          <div className="rounded-md border border-ink-500/10 bg-bg-elevated p-5">
            <h3 className="mb-2 font-display text-lg text-ink-900">Customer</h3>
            <p className="text-sm text-ink-700">
              {order.shippingAddress.fullName}
              <br />
              {order.shippingAddress.email}
              <br />
              {order.shippingAddress.phone}
            </p>
            <h4 className="mt-4 text-xs uppercase tracking-wide text-ink-500">Ship to</h4>
            <p className="mt-1 text-sm text-ink-700">
              {order.shippingAddress.line1}
              {order.shippingAddress.line2 ? `, ${order.shippingAddress.line2}` : ""}
              <br />
              {order.shippingAddress.city}, {order.shippingAddress.state}{" "}
              {order.shippingAddress.pincode}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
