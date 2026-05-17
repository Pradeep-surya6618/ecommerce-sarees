import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CheckCircle2, Truck } from "lucide-react";
import { ordersRepo } from "@/lib/db/repos/orders";
import { formatRupees } from "@/lib/money";
import { CartSummary } from "@/components/storefront/CartSummary";
import { Container } from "@/components/ui/Container";

interface PageProps {
  params: Promise<{ orderId: string }>;
}

export const metadata = {
  title: "Order confirmed · Saree Store",
};

export default async function OrderConfirmationPage({ params }: PageProps) {
  const { orderId } = await params;
  const order = await ordersRepo.getById(orderId);
  if (!order) notFound();

  return (
    <Container size="md" className="py-12">
      <div className="flex flex-col items-center gap-3 text-center">
        <CheckCircle2 className="h-12 w-12 text-success" />
        <h1 className="font-display text-3xl text-ink-900 md:text-5xl">Thank you</h1>
        <p className="max-w-md text-ink-700">
          Your order <span className="font-medium text-ink-900">{order.id}</span> is confirmed. A
          summary has been emailed to {order.shippingAddress.email} (in real life — emails wire up
          in the email phase).
        </p>
      </div>

      <div className="mt-10 flex flex-col gap-3 rounded-md border border-ink-500/10 bg-bg-elevated p-6">
        <div className="flex items-start gap-3">
          <Truck className="mt-0.5 h-5 w-5 text-accent-gold" />
          <div className="flex flex-col gap-1 text-sm">
            <span className="font-medium text-ink-900">{order.shippingOption.name}</span>
            <span className="text-ink-700">
              Estimated delivery in {order.shippingOption.etaDays} business days
            </span>
            <span className="text-ink-700">
              {order.shippingAddress.fullName}, {order.shippingAddress.line1}
              {order.shippingAddress.line2 ? `, ${order.shippingAddress.line2}` : ""},{" "}
              {order.shippingAddress.city}, {order.shippingAddress.state}{" "}
              {order.shippingAddress.pincode}
            </span>
          </div>
        </div>
      </div>

      <div className="mt-10 grid gap-8 md:grid-cols-[2fr_1fr]">
        <ul className="flex flex-col divide-y divide-ink-500/10">
          {order.items.map((item) => (
            <li key={item.variantSku} className="flex items-start gap-4 py-4">
              <div className="relative h-20 w-16 shrink-0 overflow-hidden rounded-sm bg-ink-500/5">
                {item.imageUrl && (
                  <Image
                    src={item.imageUrl}
                    alt={item.productName}
                    fill
                    sizes="64px"
                    className="object-cover"
                  />
                )}
              </div>
              <div className="flex flex-1 flex-col gap-1 text-sm">
                <span className="font-medium text-ink-900">{item.productName}</span>
                <span className="text-xs text-ink-500">
                  {item.variantLabel} · Qty {item.quantity}
                </span>
                <span className="mt-1 font-semibold tabular-nums text-ink-900">
                  {formatRupees(item.lineTotalPaise)}
                </span>
              </div>
            </li>
          ))}
        </ul>
        <CartSummary
          subtotalPaise={order.subtotalPaise}
          shippingPaise={order.shippingPaise}
          taxPaise={order.taxPaise}
          totalPaise={order.totalPaise}
        />
      </div>

      <div className="mt-10 flex flex-col items-center gap-3">
        <Link
          href="/shop"
          className="rounded-sm bg-accent-primary px-6 py-3 text-sm font-medium text-white transition hover:bg-accent-primary-hover"
        >
          Continue shopping
        </Link>
      </div>
    </Container>
  );
}
