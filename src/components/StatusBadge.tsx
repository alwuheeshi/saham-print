import { OrderStatus, PaymentStatus, STATUS_LABELS, PAYMENT_STATUS_LABELS } from '@/lib/types';

const statusColors: Record<OrderStatus, string> = {
  new: 'bg-primary/10 text-primary',
  designing: 'bg-accent/10 text-accent',
  design_done: 'bg-accent/20 text-accent',
  printing: 'bg-warning/10 text-warning',
  cutting: 'bg-warning/20 text-warning',
  installing: 'bg-primary/10 text-primary',
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
    <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold ${statusColors[status] || 'bg-muted text-muted-foreground'}`}>
      {STATUS_LABELS[status] || status}
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
