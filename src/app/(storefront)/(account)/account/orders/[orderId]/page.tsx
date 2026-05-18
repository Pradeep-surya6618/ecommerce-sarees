import Image from "next/image";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/current-user";
import { ordersRepo } from "@/lib/db/repos/orders";
import { formatRupees } from "@/lib/money";
import { OrderStatusBadge } from "@/components/account/OrderStatusBadge";
import { OrderStatusTimeline } from "@/components/account/OrderStatusTimeline";
import { CartSummary } from "@/components/storefront/CartSummary";
import { Breadcrumb } from "@/components/ui/Breadcrumb";

interface PageProps {
  params: Promise<{ orderId: string }>;
}

export default async function OrderDetailPage({ params }: PageProps) {
  const { orderId } = await params;
  const user = await getCurrentUser();
  if (!user) redirect(`/auth/login?next=/account/orders/${orderId}`);
  const order = await ordersRepo.getById(orderId);
  if (!order || order.userId !== user.id) notFound();

  const placed = new Date(order.createdAt).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

  return (
    <div className="flex flex-col gap-8">
      <Breadcrumb
        items={[
          { label: "Account", href: "/account" },
          { label: "Orders", href: "/account/orders" },
          { label: order.id },
        ]}
      />
      <header className="flex flex-col items-start gap-2">
        <span className="text-xs uppercase tracking-wide text-ink-500">Order placed {placed}</span>
        <h1 className="font-display text-3xl text-ink-900">{order.id}</h1>
        <OrderStatusBadge status={order.status} />
      </header>

      <div className="grid gap-10 md:grid-cols-[2fr_1fr]">
        <div className="flex flex-col gap-8">
          <section className="rounded-md border border-ink-500/10 bg-bg-elevated p-6">
            <h2 className="mb-4 font-display text-xl text-ink-900">Status</h2>
            <OrderStatusTimeline status={order.status} />
          </section>

          <section>
            <h2 className="mb-4 font-display text-xl text-ink-900">Items</h2>
            <ul className="flex flex-col divide-y divide-ink-500/10">
              {order.items.map((it) => (
                <li key={it.variantSku} className="flex items-start gap-4 py-4">
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
                  <div className="flex flex-1 flex-col gap-1 text-sm">
                    <Link
                      href={`/product/${it.productSlug}`}
                      className="font-medium text-ink-900 transition hover:text-accent-primary"
                    >
                      {it.productName}
                    </Link>
                    <span className="text-xs text-ink-500">
                      {it.variantLabel} · Qty {it.quantity}
                    </span>
                    <span className="mt-1 font-semibold tabular-nums text-ink-900">
                      {formatRupees(it.lineTotalPaise)}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          </section>
        </div>

        <div className="flex flex-col gap-6">
          <CartSummary
            subtotalPaise={order.subtotalPaise}
            shippingPaise={order.shippingPaise}
            taxPaise={order.taxPaise}
            totalPaise={order.totalPaise}
          />

          <div className="rounded-md border border-ink-500/10 bg-bg-elevated p-6">
            <h3 className="mb-3 font-display text-lg text-ink-900">Shipping to</h3>
            <p className="text-sm text-ink-700">
              {order.shippingAddress.fullName}
              <br />
              {order.shippingAddress.line1}
              {order.shippingAddress.line2 ? `, ${order.shippingAddress.line2}` : ""}
              <br />
              {order.shippingAddress.city}, {order.shippingAddress.state}{" "}
              {order.shippingAddress.pincode}
              <br />
              {order.shippingAddress.phone}
            </p>
            <p className="mt-3 text-xs text-ink-500">
              {order.shippingOption.name} · {order.shippingOption.etaDays} business days
            </p>
          </div>

          <div className="rounded-md border border-ink-500/10 bg-bg-elevated p-6">
            <h3 className="mb-2 font-display text-lg text-ink-900">Payment</h3>
            <p className="text-sm text-ink-700 capitalize">
              {order.paymentMethod === "cod" ? "Cash on delivery" : "Online (Razorpay)"}
              <br />
              <span className="text-xs text-ink-500">Status: {order.paymentStatus}</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
