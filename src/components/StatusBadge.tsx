import { OrderStatus, PaymentStatus, STATUS_LABELS, PAYMENT_STATUS_LABELS } from '@/lib/types';

const statusColors: Record<OrderStatus, string> = {
  new: 'bg-primary/10 text-primary',
  in_progress: 'bg-warning/10 text-warning',
  done: 'bg-success/10 text-success',
  delivered: 'bg-muted text-muted-foreground',
};

const paymentColors: Record<PaymentStatus, string> = {
  unpaid: 'bg-destructive/10 text-destructive',
  partially_paid: 'bg-warning/10 text-warning',
  paid: 'bg-success/10 text-success',
};

export function OrderStatusBadge({ status }: { status: OrderStatus }) {
  return (
    <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold ${statusColors[status]}`}>
      {STATUS_LABELS[status]}
    </span>
  );
}

export function PaymentStatusBadge({ status }: { status: PaymentStatus }) {
  return (
    <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold ${paymentColors[status]}`}>
      {PAYMENT_STATUS_LABELS[status]}
    </span>
  );
}
