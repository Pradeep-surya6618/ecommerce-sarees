import { Badge } from "@/components/ui/Badge";
import type { OrderStatus } from "@/types/domain";

const TONE: Record<OrderStatus, "neutral" | "accent" | "gold" | "success" | "warning" | "danger"> =
  {
    pending_payment: "warning",
    confirmed: "neutral",
    paid: "gold",
    shipped: "accent",
    delivered: "success",
    cancelled: "danger",
    payment_failed: "danger",
  };

const LABEL: Record<OrderStatus, string> = {
  pending_payment: "Pending payment",
  confirmed: "Confirmed",
  paid: "Paid",
  shipped: "Shipped",
  delivered: "Delivered",
  cancelled: "Cancelled",
  payment_failed: "Payment failed",
};

export function OrderStatusBadge({ status }: { status: OrderStatus }) {
  return <Badge tone={TONE[status]}>{LABEL[status]}</Badge>;
}
