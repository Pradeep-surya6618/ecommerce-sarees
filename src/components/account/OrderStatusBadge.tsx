import { Badge } from "@/components/ui/Badge";
import type { OrderStatus } from "@/types/domain";

type BadgeTone = "neutral" | "accent" | "gold" | "success" | "success-solid" | "warning" | "danger";

const TONE: Record<OrderStatus, BadgeTone> = {
  pending_payment: "warning",
  confirmed: "success-solid",
  paid: "gold",
  shipped: "accent",
  delivered: "success-solid",
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
